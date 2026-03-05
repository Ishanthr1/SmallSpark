"""
backend/app.py — Spark API v6 (Google Places)
Migrated from Overpass → Google Places API (New)
- Nearby Search for category browsing
- Text Search for user queries
- Google Geocoding replaces Nominatim
- Real photos, ratings, reviews, hours from Google
- In-memory cache for performance
"""
import os, math, logging, time, threading
import requests as req
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('spark')

app = Flask(__name__)
from digital_routes import digital_bp
app.register_blueprint(digital_bp)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET","POST","OPTIONS"],
     "allow_headers": ["Content-Type","Authorization"]}})

GOOGLE_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY', '')

if not GOOGLE_API_KEY:
    log.warning("⚠️  GOOGLE_PLACES_API_KEY not set! Add it to backend/.env")

# ─── Cache ─────────────────────────────────────────────────────
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 600

def cache_key(lat, lng, radius, q='', cat=''):
    return f"{round(lat*200)/200},{round(lng*200)/200},{radius},{q},{cat}"

def get_cached(key):
    with _cache_lock:
        if key in _cache and time.time() - _cache[key]['ts'] < CACHE_TTL:
            return _cache[key]['data']
    return None

def set_cached(key, data):
    with _cache_lock:
        _cache[key] = {'data': data, 'ts': time.time()}


# ─── Field mask for Google Places ──────────────────────────────
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.shortFormattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.types",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.currentOpeningHours",
    "places.regularOpeningHours",
    "places.photos",
    "places.primaryType",
    "places.primaryTypeDisplayName",
    "places.editorialSummary",
    "places.priceLevel",
    "places.businessStatus",
])


# ─── Google Places: Nearby Search ──────────────────────────────
def google_nearby_search(lat, lng, radius, included_types=None):
    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    body = {
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": min(radius, 50000.0)
            }
        },
        "maxResultCount": 20,  # Google's max per request
        "languageCode": "en",
    }
    if included_types:
        body["includedTypes"] = included_types

    try:
        resp = req.post(url, json=body, headers=headers, timeout=12)
        resp.raise_for_status()
        data = resp.json()
        places = data.get("places", [])

        # Try to get more results with pagination if available
        next_token = data.get("nextPageToken")
        attempt = 0
        while next_token and attempt < 4:  # Get up to 100 total (5 pages × 20)
            attempt += 1
            import time
            time.sleep(0.5)  # Brief delay for pagination
            body["pageToken"] = next_token
            try:
                resp = req.post(url, json=body, headers=headers, timeout=12)
                resp.raise_for_status()
                data = resp.json()
                places.extend(data.get("places", []))
                next_token = data.get("nextPageToken")
            except:
                break

        return places
    except Exception as e:
        log.error(f"Nearby search error: {e}")
        return []


# ─── Google Places: Text Search ────────────────────────────────
def google_text_search(query, lat, lng, radius):
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    body = {
        "textQuery": query,
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": min(radius, 50000.0)
            }
        },
        "maxResultCount": 20,  # Google's max per request
        "languageCode": "en",
    }

    try:
        resp = req.post(url, json=body, headers=headers, timeout=12)
        resp.raise_for_status()
        data = resp.json()
        places = data.get("places", [])

        # Try to get more results with pagination if available
        next_token = data.get("nextPageToken")
        attempt = 0
        while next_token and attempt < 4:  # Get up to 100 total (5 pages × 20)
            attempt += 1
            import time
            time.sleep(0.5)  # Brief delay for pagination
            body["pageToken"] = next_token
            try:
                resp = req.post(url, json=body, headers=headers, timeout=12)
                resp.raise_for_status()
                data = resp.json()
                places.extend(data.get("places", []))
                next_token = data.get("nextPageToken")
            except:
                break

        return places
    except Exception as e:
        log.error(f"Text search error: {e}")
        return []


# ─── Photo URL builder ─────────────────────────────────────────
FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=480&h=320&fit=crop'

def get_photo_url(photo_ref):
    if not photo_ref:
        return FALLBACK_IMAGE
    return f"https://places.googleapis.com/v1/{photo_ref}/media?maxHeightPx=400&maxWidthPx=600&key={GOOGLE_API_KEY}"


# ─── Map Google types → your category system ───────────────────
GTYPE_MAP = {
    # Restaurants
    "restaurant": ("Restaurants", "Dinner"),
    "cafe": ("Restaurants", "Coffee & Cafes"),
    "coffee_shop": ("Restaurants", "Coffee & Cafes"),
    "bakery": ("Restaurants", "Bakeries"),
    "pizza_restaurant": ("Restaurants", "Pizza"),
    "mexican_restaurant": ("Restaurants", "Mexican"),
    "italian_restaurant": ("Restaurants", "Italian"),
    "chinese_restaurant": ("Restaurants", "Chinese"),
    "japanese_restaurant": ("Restaurants", "Dinner"),
    "thai_restaurant": ("Restaurants", "Dinner"),
    "indian_restaurant": ("Restaurants", "Dinner"),
    "korean_restaurant": ("Restaurants", "Dinner"),
    "seafood_restaurant": ("Restaurants", "Dinner"),
    "steak_house": ("Restaurants", "Dinner"),
    "fast_food_restaurant": ("Restaurants", "Takeout"),
    "sandwich_shop": ("Restaurants", "Lunch"),
    "meal_delivery": ("Restaurants", "Delivery"),
    "meal_takeaway": ("Restaurants", "Takeout"),
    "breakfast_restaurant": ("Restaurants", "Breakfast & Brunch"),
    "brunch_restaurant": ("Restaurants", "Breakfast & Brunch"),
    "ice_cream_shop": ("Restaurants", "Bakeries"),
    "bar": ("Travel & Activities", "Nightlife"),
    "night_club": ("Travel & Activities", "Nightlife"),
    # Health & Beauty
    "hair_salon": ("Health & Beauty", "Hair Salons"),
    "beauty_salon": ("Health & Beauty", "Spas"),
    "spa": ("Health & Beauty", "Spas"),
    "nail_salon": ("Health & Beauty", "Nail Salons"),
    "barber_shop": ("Health & Beauty", "Barbers"),
    "dentist": ("Health & Beauty", "Dentists"),
    "doctor": ("Health & Beauty", "Doctors"),
    "pharmacy": ("Health & Beauty", "Doctors"),
    "physiotherapist": ("Health & Beauty", "Chiropractors"),
    "chiropractor": ("Health & Beauty", "Chiropractors"),
    "optician": ("Health & Beauty", "Optometrists"),
    # Auto
    "car_repair": ("Auto Services", "Auto Repair"),
    "car_wash": ("Auto Services", "Car Wash"),
    "car_dealer": ("Auto Services", "Car Dealers"),
    "gas_station": ("Auto Services", "Auto Repair"),
    "parking": ("Auto Services", "Parking"),
    # Home & Garden
    "plumber": ("Home & Garden", "Plumbers"),
    "electrician": ("Home & Garden", "Electricians"),
    "roofing_contractor": ("Home & Garden", "Roofing"),
    "general_contractor": ("Home & Garden", "Contractors"),
    "painter": ("Home & Garden", "Painters"),
    "locksmith": ("Home & Garden", "Locksmiths"),
    "florist": ("Home & Garden", "Florists"),
    "furniture_store": ("Home & Garden", "Furniture"),
    "home_improvement_store": ("Home & Garden", "Contractors"),
    "hardware_store": ("Home & Garden", "Contractors"),
    # Travel & Activities
    "lodging": ("Travel & Activities", "Hotels"),
    "hotel": ("Travel & Activities", "Hotels"),
    "motel": ("Travel & Activities", "Hotels"),
    "campground": ("Travel & Activities", "Campgrounds"),
    "tourist_attraction": ("Travel & Activities", "Things to Do"),
    "bowling_alley": ("Travel & Activities", "Bowling"),
    "movie_theater": ("Travel & Activities", "Things to Do"),
    "amusement_park": ("Travel & Activities", "Things to Do"),
    "museum": ("Travel & Activities", "Things to Do"),
    "art_gallery": ("Travel & Activities", "Things to Do"),
    "zoo": ("Travel & Activities", "Kids Activities"),
    "aquarium": ("Travel & Activities", "Kids Activities"),
    "shopping_mall": ("Travel & Activities", "Shopping Malls"),
    "book_store": ("Travel & Activities", "Bookstores"),
    "church": ("Travel & Activities", "Churches"),
    "swimming_pool": ("Travel & Activities", "Swimming Pools"),
    "event_venue": ("Travel & Activities", "Venues & Events"),
    # More
    "gym": ("More", "Gyms"),
    "fitness_center": ("More", "Gyms"),
    "yoga_studio": ("More", "Yoga & Pilates"),
    "bank": ("More", "Banks"),
    "laundry": ("More", "Laundromats"),
    "dry_cleaner": ("More", "Dry Cleaning"),
    "pet_store": ("More", "Pet Groomers"),
    "veterinary_care": ("More", "Pet Groomers"),
    "clothing_store": ("More", "Thrift Stores"),
    "tailor": ("More", "Tailors"),
}

# Reverse map: subcategory → Google type for nearby search
SUBCAT_TO_GTYPE = {
    "Dinner": ["restaurant"],
    "Coffee & Cafes": ["cafe", "coffee_shop"],
    "Bakeries": ["bakery"],
    "Pizza": ["pizza_restaurant"],
    "Mexican": ["mexican_restaurant"],
    "Italian": ["italian_restaurant"],
    "Chinese": ["chinese_restaurant"],
    "Takeout": ["fast_food_restaurant", "meal_takeaway"],
    "Lunch": ["restaurant"],
    "Delivery": ["meal_delivery"],
    "Breakfast & Brunch": ["breakfast_restaurant"],
    "Hair Salons": ["hair_salon"],
    "Barbers": ["barber_shop"],
    "Spas": ["spa", "beauty_salon"],
    "Nail Salons": ["nail_salon"],
    "Dentists": ["dentist"],
    "Doctors": ["doctor"],
    "Chiropractors": ["chiropractor", "physiotherapist"],
    "Optometrists": ["optician"],
    "Massage": ["spa"],
    "Auto Repair": ["car_repair"],
    "Car Wash": ["car_wash"],
    "Car Dealers": ["car_dealer"],
    "Parking": ["parking"],
    "Tires": ["car_repair"],
    "Contractors": ["general_contractor"],
    "Roofing": ["roofing_contractor"],
    "Plumbers": ["plumber"],
    "Electricians": ["electrician"],
    "Painters": ["painter"],
    "Locksmiths": ["locksmith"],
    "Florists": ["florist"],
    "Furniture": ["furniture_store"],
    "Landscaping": ["general_contractor"],
    "Nurseries": ["home_improvement_store"],
    "HVAC": ["general_contractor"],
    "Hotels": ["hotel", "lodging"],
    "Campgrounds": ["campground"],
    "Things to Do": ["tourist_attraction"],
    "Bowling": ["bowling_alley"],
    "Nightlife": ["bar", "night_club"],
    "Shopping Malls": ["shopping_mall"],
    "Bookstores": ["book_store"],
    "Kids Activities": ["amusement_park"],
    "Churches": ["church"],
    "Swimming Pools": ["swimming_pool"],
    "Venues & Events": ["event_venue"],
    "Gyms": ["gym", "fitness_center"],
    "Yoga & Pilates": ["yoga_studio"],
    "Banks": ["bank"],
    "Laundromats": ["laundry"],
    "Dry Cleaning": ["dry_cleaner"],
    "Pet Groomers": ["pet_store", "veterinary_care"],
    "Thrift Stores": ["clothing_store"],
    "Tailors": ["tailor"],
}


def map_google_type(primary_type, types):
    if primary_type and primary_type in GTYPE_MAP:
        return GTYPE_MAP[primary_type]
    for t in (types or []):
        if t in GTYPE_MAP:
            return GTYPE_MAP[t]
    return ("More", "Thrift Stores")


# ─── Parse a Google Place into business dict ───────────────────
def parse_google_place(place, clat=0, clng=0):
    loc = place.get("location", {})
    lat = loc.get("latitude")
    lng = loc.get("longitude")
    if not lat or not lng:
        return None

    name = place.get("displayName", {}).get("text", "")
    if not name:
        return None

    # Skip closed businesses
    status = place.get("businessStatus", "")
    if status in ("CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY"):
        return None

    # Distance
    dx = (lat - clat) * 111320
    dy = (lng - clng) * 111320 * math.cos(math.radians(clat))
    dist = math.sqrt(dx * dx + dy * dy)

    # Photo
    photos = place.get("photos", [])
    image = get_photo_url(photos[0].get("name")) if photos else FALLBACK_IMAGE

    # Opening hours
    hours = place.get("currentOpeningHours") or place.get("regularOpeningHours") or {}
    opening_text = ""
    descs = hours.get("weekdayDescriptions", [])
    if descs:
        opening_text = "; ".join(descs[:3])

    # Category
    primary_type = place.get("primaryType", "")
    types = place.get("types", [])
    cat, sub = map_google_type(primary_type, types)

    # Type display name
    type_display = place.get("primaryTypeDisplayName", {}).get("text", sub)

    # Description
    desc = place.get("editorialSummary", {}).get("text", "")

    # Address
    address = place.get("formattedAddress", "")
    short_addr = place.get("shortFormattedAddress", address)

    # Rating
    rating = place.get("rating")
    review_count = place.get("userRatingCount", 0)

    # Tag labels
    tlabels = [type_display]
    if sub != type_display:
        tlabels.append(sub)
    for t in types[:3]:
        readable = t.replace("_", " ").title()
        if readable not in tlabels and len(tlabels) < 4:
            tlabels.append(readable)

    # Features from types
    feats = []
    if "takeout" in types or "meal_takeaway" in types:
        feats.append("Takeout Available")
    if "delivery" in types or "meal_delivery" in types:
        feats.append("Delivery")
    if place.get("websiteUri"):
        feats.append("Has Website")

    # Price level
    price = place.get("priceLevel", "")
    price_str = {"PRICE_LEVEL_FREE": "Free", "PRICE_LEVEL_INEXPENSIVE": "$",
                 "PRICE_LEVEL_MODERATE": "$$", "PRICE_LEVEL_EXPENSIVE": "$$$",
                 "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$"}.get(price, "")

    return {
        'id': place.get("id", ""),
        'name': name,
        'category': cat,
        'subcategory': sub,
        'lat': lat,
        'lng': lng,
        'location': short_addr or 'Nearby',
        'address': address,
        'phone': place.get("nationalPhoneNumber", ""),
        'website': place.get("websiteUri", ""),
        'openingHours': opening_text,
        'description': desc,
        'rating': rating,
        'reviewCount': review_count,
        'image': image,
        'isVerified': True,
        'distanceMeters': round(dist),
        'tagLabels': tlabels[:4],
        'features': feats[:3],
        'priceLevel': price_str,
    }


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route('/api/search', methods=['GET'])
def search_businesses():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    q = request.args.get('q', '', type=str).strip()
    radius = min(request.args.get('radius', 5000, type=int), 50000)
    category = request.args.get('category', '', type=str).strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)

    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng required'}), 400

    log.info(f"Search: q={q!r} cat={category!r} r={radius} p={page}")

    # Check cache
    ck = cache_key(lat, lng, radius, q, category)
    cached = get_cached(ck)
    if cached is not None:
        log.info(f"Cache hit: {len(cached)} businesses")
        businesses = cached
    else:
        try:
            places = []
            if q:
                # User typed a query — use text search
                search_q = f"{q} {category}" if category else q
                places = google_text_search(search_q, lat, lng, radius)
            elif category:
                # Category browsing — try to map to Google types
                gtypes = SUBCAT_TO_GTYPE.get(category)
                if gtypes:
                    places = google_nearby_search(lat, lng, radius, included_types=gtypes)
                else:
                    # Fallback to text search with category name
                    places = google_text_search(category, lat, lng, radius)
            else:
                # General explore
                places = google_nearby_search(lat, lng, radius)

            businesses = []
            seen_names = set()
            for p in places:
                biz = parse_google_place(p, lat, lng)
                if not biz:
                    continue
                # Deduplicate
                nk = biz['name'].lower().strip()
                if nk in seen_names:
                    continue
                seen_names.add(nk)
                businesses.append(biz)

            # Define big business chains to deprioritize
            BIG_CHAINS = {
                'walmart', 'costco', 'target', 'home depot', 'lowes', "lowe's",
                'best buy', 'kroger', 'safeway', 'whole foods', 'albertsons',
                'cvs', 'walgreens', 'rite aid', 'mcdonalds', "mcdonald's",
                'burger king', 'wendys', "wendy's", 'taco bell', 'kfc',
                'subway', 'starbucks', 'dunkin', "dunkin'", 'chipotle',
                'panera', 'chick-fil-a', 'pizza hut', 'dominos', "domino's",
                'papa johns', "papa john's", 'little caesars', 'olive garden',
                'applebees', "applebee's", 'chilis', "chili's", 'red lobster',
                'outback steakhouse', 'buffalo wild wings', 'ihop', 'dennys', "denny's",
                'waffle house', 'panda express', 'five guys', 'in-n-out',
                'shake shack', 'popeyes', 'arbys', "arby's", 'sonic',
                'dairy queen', 'baskin robbins', 'cold stone', '7-eleven',
                "7 eleven", 'circle k', 'shell', 'chevron', 'exxon', 'bp',
                'mobil', 'marathon', 'speedway', 'sams club', "sam's club",
                'kohls', "kohl's", 'jcpenney', 'macys', "macy's", 'nordstrom',
                'tjmaxx', 'tj maxx', 'marshalls', 'ross', 'burlington',
                'petco', 'petsmart', 'autozone', 'oreilly', "o'reilly",
                'napa', 'jiffy lube', 'valvoline', 'discount tire',
                'firestone', 'goodyear', 'pep boys', 'home goods',
                'bed bath', 'bath & body', 'ulta', 'sephora', 'sally beauty',
                'great clips', 'supercuts', 'sport clips', 'fantastic sams',
                '24 hour fitness', 'la fitness', 'planet fitness', 'anytime fitness',
                'gold gym', "gold's gym", 'marriott', 'hilton', 'hyatt',
                'holiday inn', 'best western', 'comfort inn', 'hampton inn',
                'courtyard', 'residence inn', 'springhill', 'fairfield inn',
            }

            # Sort: small businesses first (by distance), then big chains (by distance)
            def sort_key(biz):
                name_lower = biz['name'].lower()
                is_big_chain = any(chain in name_lower for chain in BIG_CHAINS)
                # Return tuple: (is_big_chain, distance)
                # False sorts before True, so small businesses come first
                return (is_big_chain, biz['distanceMeters'])

            businesses.sort(key=sort_key)
            set_cached(ck, businesses)
            log.info(f"Fetched & cached {len(businesses)} businesses")

        except Exception as e:
            log.error(f"Search error: {e}")
            return jsonify({
                'error': 'Search failed. Please try again.',
                'businesses': [], 'total': 0, 'page': 1,
                'totalPages': 1, 'perPage': per_page,
                'center': {'lat': lat, 'lng': lng}, 'radius': radius,
            })

    # Pagination
    total = len(businesses)
    tp = max(1, math.ceil(total / per_page))
    page = max(1, min(page, tp))
    items = businesses[(page - 1) * per_page: page * per_page]

    log.info(f"Returning {len(items)} of {total}, page {page}/{tp}")
    return jsonify({
        'businesses': items, 'total': total, 'page': page,
        'perPage': per_page, 'totalPages': tp,
        'center': {'lat': lat, 'lng': lng}, 'radius': radius
    })


@app.route('/api/suggest', methods=['GET'])
def suggest():
    q = request.args.get('q', '').strip().lower()
    pops = [
        {'label': 'Restaurants', 'type': 'category'},
        {'label': 'Coffee & Cafes', 'type': 'category'},
        {'label': 'Takeout', 'type': 'category'},
        {'label': 'Plumbers', 'type': 'category'},
        {'label': 'Auto Repair', 'type': 'category'},
        {'label': 'Dentists', 'type': 'category'},
        {'label': 'Hair Salons', 'type': 'category'},
        {'label': 'Gyms', 'type': 'category'},
        {'label': 'Hotels', 'type': 'category'},
        {'label': 'Pizza', 'type': 'category'},
        {'label': 'Contractors', 'type': 'category'},
        {'label': 'Delivery', 'type': 'category'},
    ]
    if not q:
        return jsonify({'suggestions': pops[:7]})

    ms = [p for p in pops if q in p['label'].lower()]
    seen = {m['label'] for m in ms}

    # Search through all subcategories
    for sub in SUBCAT_TO_GTYPE:
        if q in sub.lower() and sub not in seen:
            ms.append({'label': sub, 'type': 'category'})
            seen.add(sub)

    if len(q) >= 2:
        ms.append({'label': f'Search for "{q}"', 'type': 'name_search', 'query': q})

    return jsonify({'suggestions': ms[:7]})


@app.route('/api/locations', methods=['GET'])
def location_suggestions():
    q = request.args.get('q', '').strip()
    defs = [
        {'label': 'Current Location', 'type': 'current'},
        {'label': 'South Jordan, UT', 'type': 'recent'},
        {'label': 'Salt Lake City, UT', 'type': 'city'},
        {'label': 'West Valley City, UT', 'type': 'city'},
        {'label': 'Sandy, UT', 'type': 'city'},
        {'label': 'Murray, UT', 'type': 'city'},
        {'label': 'Midvale, UT', 'type': 'city'},
    ]
    if not q:
        return jsonify({'locations': defs})

    # Use Google Geocoding for location autocomplete
    try:
        r = req.get('https://maps.googleapis.com/maps/api/geocode/json',
                     params={'address': q, 'key': GOOGLE_API_KEY}, timeout=8)
        r.raise_for_status()
        data = r.json()
    except:
        return jsonify({'locations': defs})

    locs = [{'label': 'Current Location', 'type': 'current'}]
    for res in data.get('results', [])[:5]:
        loc = res.get('geometry', {}).get('location', {})
        addr = res.get('formatted_address', '')
        short = ', '.join(addr.split(', ')[:2]) if addr else ''
        locs.append({
            'label': short or addr[:50],
            'type': 'result',
            'lat': loc.get('lat'),
            'lng': loc.get('lng')
        })

    return jsonify({'locations': locs[:7]})


@app.route('/api/geocode', methods=['GET'])
def geocode():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'error': 'q required'}), 400
    try:
        r = req.get('https://maps.googleapis.com/maps/api/geocode/json',
                     params={'address': q, 'key': GOOGLE_API_KEY}, timeout=10)
        r.raise_for_status()
        data = r.json()
        if data['status'] != 'OK' or not data['results']:
            return jsonify({'error': f'Could not find "{q}"'}), 404
        loc = data['results'][0]['geometry']['location']
        return jsonify({
            'lat': loc['lat'],
            'lng': loc['lng'],
            'displayName': data['results'][0].get('formatted_address', q)
        })
    except Exception as e:
        return jsonify({'error': f'Geocoding failed: {str(e)}'}), 502


@app.route('/api/health')
def health():
    has_key = bool(GOOGLE_API_KEY)
    return jsonify({'status': 'ok', 'google_api_key_set': has_key})


if __name__ == '__main__':
    log.info("Starting Spark API v6 (Google Places) on port 5001...")
    if not GOOGLE_API_KEY:
        log.warning("=" * 60)
        log.warning("  GOOGLE_PLACES_API_KEY is NOT set!")
        log.warning("  Add it to backend/.env:")
        log.warning("  GOOGLE_PLACES_API_KEY=AIzaSy...")
        log.warning("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))