"""
backend/app.py — SmallSpark API v2
Richer data, pagination, autocomplete, location suggestions.
"""
import os, math, hashlib, requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

AMENITY_MAP = {
    'restaurant': ('Restaurants', 'Dinner'), 'fast_food': ('Restaurants', 'Takeout'),
    'cafe': ('Restaurants', 'Coffee & Cafes'), 'bar': ('Travel & Activities', 'Nightlife'),
    'pub': ('Travel & Activities', 'Nightlife'), 'ice_cream': ('Restaurants', 'Bakeries'),
    'food_court': ('Restaurants', 'Takeout'), 'bbq': ('Restaurants', 'Dinner'),
    'dentist': ('Health & Beauty', 'Dentists'), 'doctors': ('Health & Beauty', 'Doctors'),
    'clinic': ('Health & Beauty', 'Doctors'), 'hospital': ('Health & Beauty', 'Doctors'),
    'pharmacy': ('Health & Beauty', 'Doctors'), 'veterinary': ('More', 'Pet Groomers'),
    'optician': ('Health & Beauty', 'Optometrists'), 'chiropractor': ('Health & Beauty', 'Chiropractors'),
    'car_repair': ('Auto Services', 'Auto Repair'), 'car_wash': ('Auto Services', 'Car Wash'),
    'fuel': ('Auto Services', 'Auto Repair'), 'car_rental': ('Auto Services', 'Car Dealers'),
    'parking': ('Auto Services', 'Parking'),
    'cinema': ('Travel & Activities', 'Things to Do'), 'theatre': ('Travel & Activities', 'Venues & Events'),
    'library': ('Travel & Activities', 'Bookstores'), 'place_of_worship': ('Travel & Activities', 'Churches'),
    'community_centre': ('Travel & Activities', 'Venues & Events'),
    'nightclub': ('Travel & Activities', 'Nightlife'), 'arts_centre': ('Travel & Activities', 'Things to Do'),
    'bowling_alley': ('Travel & Activities', 'Bowling'), 'swimming_pool': ('Travel & Activities', 'Swimming Pools'),
    'bank': ('More', 'Banks'), 'post_office': ('More', 'Banks'),
    'kindergarten': ('Travel & Activities', 'Kids Activities'),
    'gym': ('More', 'Gyms'), 'laundry': ('More', 'Laundromats'),
}
SHOP_MAP = {
    'bakery': ('Restaurants', 'Bakeries'), 'butcher': ('Restaurants', 'Dinner'),
    'deli': ('Restaurants', 'Lunch'), 'coffee': ('Restaurants', 'Coffee & Cafes'),
    'confectionery': ('Restaurants', 'Bakeries'), 'pastry': ('Restaurants', 'Bakeries'),
    'pizza': ('Restaurants', 'Pizza'), 'supermarket': ('Restaurants', 'Takeout'),
    'convenience': ('Restaurants', 'Takeout'),
    'hairdresser': ('Health & Beauty', 'Hair Salons'), 'beauty': ('Health & Beauty', 'Spas'),
    'cosmetics': ('Health & Beauty', 'Nail Salons'), 'massage': ('Health & Beauty', 'Massage'),
    'tattoo': ('Health & Beauty', 'Barbers'), 'nail_salon': ('Health & Beauty', 'Nail Salons'),
    'clothes': ('More', 'Thrift Stores'), 'shoes': ('More', 'Thrift Stores'),
    'boutique': ('More', 'Thrift Stores'), 'department_store': ('Travel & Activities', 'Shopping Malls'),
    'mall': ('Travel & Activities', 'Shopping Malls'), 'gift': ('More', 'Thrift Stores'),
    'jewelry': ('More', 'Thrift Stores'), 'sports': ('Travel & Activities', 'Things to Do'),
    'bicycle': ('Travel & Activities', 'Bike Rentals'), 'toys': ('Travel & Activities', 'Kids Activities'),
    'books': ('Travel & Activities', 'Bookstores'),
    'furniture': ('Home & Garden', 'Furniture'), 'garden_centre': ('Home & Garden', 'Nurseries'),
    'hardware': ('Home & Garden', 'Contractors'), 'doityourself': ('Home & Garden', 'Contractors'),
    'florist': ('Home & Garden', 'Florists'), 'locksmith': ('Home & Garden', 'Locksmiths'),
    'car': ('Auto Services', 'Car Dealers'), 'car_parts': ('Auto Services', 'Auto Repair'),
    'tyres': ('Auto Services', 'Tires'),
    'pet': ('More', 'Pet Groomers'), 'dry_cleaning': ('More', 'Dry Cleaning'),
    'laundry': ('More', 'Laundromats'), 'tailor': ('More', 'Tailors'),
    'electronics': ('More', 'Real Estate'), 'mobile_phone': ('More', 'Real Estate'),
}
TOURISM_MAP = {
    'hotel': ('Travel & Activities', 'Hotels'), 'motel': ('Travel & Activities', 'Hotels'),
    'hostel': ('Travel & Activities', 'Hotels'), 'camp_site': ('Travel & Activities', 'Campgrounds'),
    'museum': ('Travel & Activities', 'Things to Do'), 'gallery': ('Travel & Activities', 'Things to Do'),
    'zoo': ('Travel & Activities', 'Kids Activities'), 'theme_park': ('Travel & Activities', 'Things to Do'),
    'attraction': ('Travel & Activities', 'Things to Do'),
}
LEISURE_MAP = {
    'fitness_centre': ('More', 'Gyms'), 'sports_centre': ('More', 'Gyms'),
    'swimming_pool': ('Travel & Activities', 'Swimming Pools'),
    'bowling_alley': ('Travel & Activities', 'Bowling'),
    'golf_course': ('Travel & Activities', 'Mini Golf'), 'miniature_golf': ('Travel & Activities', 'Mini Golf'),
    'dance': ('Travel & Activities', 'Things to Do'), 'yoga': ('More', 'Yoga & Pilates'),
}
CRAFT_MAP = {
    'plumber': ('Home & Garden', 'Plumbers'), 'electrician': ('Home & Garden', 'Electricians'),
    'carpenter': ('Home & Garden', 'Contractors'), 'roofer': ('Home & Garden', 'Roofing'),
    'painter': ('Home & Garden', 'Painters'), 'hvac': ('Home & Garden', 'HVAC'),
    'gardener': ('Home & Garden', 'Landscaping'),
}

def categorize(tags):
    a, s, t, l, cr, cu = (tags.get(k, '') for k in ('amenity','shop','tourism','leisure','craft','cuisine'))
    if cr in CRAFT_MAP: return CRAFT_MAP[cr]
    if a in AMENITY_MAP:
        cat, sub = AMENITY_MAP[a]
        if a in ('restaurant','fast_food') and cu:
            c = cu.lower().split(';')[0].strip()
            for k,v in {'mexican':'Mexican','pizza':'Pizza','italian':'Italian','chinese':'Chinese',
                'japanese':'Dinner','thai':'Dinner','indian':'Dinner','burger':'Takeout',
                'sushi':'Dinner','korean':'Dinner','breakfast':'Breakfast & Brunch',
                'coffee':'Coffee & Cafes','sandwich':'Lunch','seafood':'Dinner',
                'steak':'Dinner','bbq':'Dinner','taco':'Mexican'}.items():
                if k in c: sub = v; break
        return cat, sub
    if s in SHOP_MAP: return SHOP_MAP[s]
    if t in TOURISM_MAP: return TOURISM_MAP[t]
    if l in LEISURE_MAP: return LEISURE_MAP[l]
    return ('More', 'Thrift Stores') if s else ('More', 'Banks') if a else ('More', 'Thrift Stores')

def parse_element(el, clat=0, clng=0):
    tags = el.get('tags', {})
    name = tags.get('name')
    if not name: return None
    if el['type'] == 'node': lat, lng = el['lat'], el['lon']
    elif 'center' in el: lat, lng = el['center']['lat'], el['center']['lon']
    else: return None

    cat, sub = categorize(tags)
    phone = tags.get('phone', tags.get('contact:phone', ''))
    website = tags.get('website', tags.get('contact:website', ''))
    opening = tags.get('opening_hours', '')
    brand = tags.get('brand', '')
    desc = tags.get('description', '')
    cuisine_raw = tags.get('cuisine', '')
    wheelchair = tags.get('wheelchair', '')
    wifi = tags.get('internet_access', '')
    outdoor = tags.get('outdoor_seating', '')
    takeaway = tags.get('takeaway', '')
    delivery = tags.get('delivery', '')

    ap = []
    if tags.get('addr:housenumber'): ap.append(tags['addr:housenumber'])
    if tags.get('addr:street'): ap.append(tags['addr:street'])
    city = tags.get('addr:city', '')
    state = tags.get('addr:state', '')
    pc = tags.get('addr:postcode', '')
    address = ', '.join(ap)
    loc = f"{city}, {state}".strip(', ') if city or state else ''
    if pc and loc: loc += f" {pc}"

    feats = []
    if wheelchair in ('yes','limited'): feats.append('Wheelchair Accessible')
    if wifi in ('yes','wlan'): feats.append('Free Wi-Fi')
    if outdoor == 'yes': feats.append('Outdoor Seating')
    if takeaway in ('yes','only'): feats.append('Takeout Available')
    if delivery == 'yes': feats.append('Delivery')
    if phone: feats.append('Phone')
    if website: feats.append('Website')

    tlabels = [sub]
    if cuisine_raw:
        tlabels = [c.strip().title() for c in cuisine_raw.split(';')[:3]] + [sub]
    if brand: tlabels.insert(0, brand)

    dx = (lat - clat) * 111320
    dy = (lng - clng) * 111320 * math.cos(math.radians(clat))
    dist = math.sqrt(dx*dx + dy*dy)

    comp = sum([3 if phone else 0, 3 if website else 0, 2 if opening else 0,
                2 if address else 0, 2 if desc else 0, 1 if brand else 0, 1 if len(feats) > 2 else 0])

    seed = hashlib.md5(name.encode()).hexdigest()[:8]
    return {
        'id': el['id'], 'name': name, 'category': cat, 'subcategory': sub,
        'lat': lat, 'lng': lng, 'location': loc or 'Nearby', 'address': address,
        'phone': phone, 'website': website, 'openingHours': opening,
        'description': desc, 'brand': brand, 'features': feats,
        'tagLabels': tlabels[:4], 'image': f"https://picsum.photos/seed/{seed}/480/320",
        'isVerified': bool(phone or website),
        'distanceMeters': round(dist), 'completeness': comp,
        '_s': f"{name} {cat} {sub} {cuisine_raw} {brand} {' '.join(tlabels)}".lower(),
    }

@app.route('/api/search', methods=['GET'])
def search_businesses():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    q = request.args.get('q', '', type=str).strip()
    radius = min(request.args.get('radius', 5000, type=int), 15000)
    category = request.args.get('category', '', type=str).strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)

    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng required'}), 400

    oq = f"""[out:json][timeout:30];(
      node["name"]["amenity"](around:{radius},{lat},{lng});
      node["name"]["shop"](around:{radius},{lat},{lng});
      node["name"]["tourism"](around:{radius},{lat},{lng});
      node["name"]["leisure"]["name"](around:{radius},{lat},{lng});
      node["name"]["craft"](around:{radius},{lat},{lng});
      way["name"]["amenity"](around:{radius},{lat},{lng});
      way["name"]["shop"](around:{radius},{lat},{lng});
      way["name"]["tourism"](around:{radius},{lat},{lng});
      way["name"]["craft"](around:{radius},{lat},{lng});
    );out center 1000;"""
    try:
        r = requests.post(OVERPASS_URL, data={'data': oq}, timeout=35)
        r.raise_for_status(); data = r.json()
    except Exception as e:
        return jsonify({'error': str(e)}), 502

    bizs, seen = [], set()
    for el in data.get('elements', []):
        b = parse_element(el, lat, lng)
        if not b: continue
        nk = b['name'].lower().strip()
        if nk in seen: continue
        seen.add(nk)
        if q and q.lower() not in b['_s']: continue
        if category and b['subcategory'] != category: continue
        bizs.append(b)

    bizs.sort(key=lambda x: (-x['completeness'], x['distanceMeters']))
    for b in bizs: del b['_s']; del b['completeness']

    total = len(bizs)
    tp = max(1, math.ceil(total / per_page))
    page = max(1, min(page, tp))
    items = bizs[(page-1)*per_page : page*per_page]

    return jsonify({'businesses': items, 'total': total, 'page': page,
                    'perPage': per_page, 'totalPages': tp,
                    'center': {'lat': lat, 'lng': lng}, 'radius': radius})

@app.route('/api/suggest', methods=['GET'])
def suggest():
    q = request.args.get('q', '').strip().lower()
    pops = [
        {'label':'Restaurants','type':'category'},{'label':'Delivery','type':'category'},
        {'label':'Takeout','type':'category'},{'label':'Coffee & Cafes','type':'category'},
        {'label':'Plumbers','type':'category'},{'label':'Auto Repair','type':'category'},
        {'label':'Dentists','type':'category'},{'label':'Hair Salons','type':'category'},
        {'label':'Gyms','type':'category'},{'label':'Hotels','type':'category'},
        {'label':'Pizza','type':'category'},{'label':'Contractors','type':'category'},
    ]
    if not q: return jsonify({'suggestions': pops[:7]})
    ms = [p for p in pops if q in p['label'].lower()]
    seen = {m['label'] for m in ms}
    for cat in [AMENITY_MAP, SHOP_MAP, TOURISM_MAP, LEISURE_MAP, CRAFT_MAP]:
        for k,(c,s) in cat.items():
            if (q in s.lower() or q in k) and s not in seen:
                ms.append({'label': s, 'type': 'category'}); seen.add(s)
    return jsonify({'suggestions': ms[:7]})

@app.route('/api/locations', methods=['GET'])
def location_suggestions():
    q = request.args.get('q', '').strip()
    defs = [
        {'label':'Current Location','type':'current'},
        {'label':'South Jordan, UT','type':'recent'},
        {'label':'Salt Lake City, UT','type':'city'},
        {'label':'West Valley City, UT','type':'city'},
        {'label':'Sandy, UT','type':'city'},
        {'label':'Murray, UT','type':'city'},
        {'label':'Midvale, UT','type':'city'},
    ]
    if not q: return jsonify({'locations': defs})
    try:
        r = requests.get('https://nominatim.openstreetmap.org/search',
            params={'q': q, 'format': 'json', 'limit': 5, 'addressdetails': 1},
            headers={'User-Agent': 'SmallSpark/1.0'}, timeout=8)
        r.raise_for_status(); results = r.json()
    except: return jsonify({'locations': defs})
    locs = [{'label':'Current Location','type':'current'}]
    for r in results:
        ad = r.get('address',{}); city = ad.get('city', ad.get('town', ad.get('village','')))
        st = ad.get('state',''); short = f"{city}, {st}".strip(', ') if city else r.get('display_name','')[:50]
        locs.append({'label': short, 'type': 'result', 'lat': float(r['lat']), 'lng': float(r['lon'])})
    return jsonify({'locations': locs[:7]})

@app.route('/api/geocode', methods=['GET'])
def geocode():
    q = request.args.get('q', '').strip()
    if not q: return jsonify({'error': 'q required'}), 400
    try:
        r = requests.get('https://nominatim.openstreetmap.org/search',
            params={'q': q, 'format': 'json', 'limit': 1},
            headers={'User-Agent': 'SmallSpark/1.0'}, timeout=10)
        r.raise_for_status(); res = r.json()
    except Exception as e: return jsonify({'error': str(e)}), 502
    if not res: return jsonify({'error': 'Not found'}), 404
    return jsonify({'lat': float(res[0]['lat']), 'lng': float(res[0]['lon']),
                    'displayName': res[0].get('display_name', q)})

@app.route('/api/health')
def health(): return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))