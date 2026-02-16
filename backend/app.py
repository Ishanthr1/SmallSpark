"""
backend/app.py — Spark API v4
Major reliability fixes:
 - Proper error messages (not generic 502)
 - Overpass retry with 2 mirrors + longer timeout
 - Name-based Overpass regex search ("starbucks" finds all Starbucks)
 - 200+ brand image URLs (real logos)
 - Category-specific Unsplash fallbacks
 - CORS fully open for dev
 - Logging for debugging
"""
import os, math, hashlib, re, logging, time
import requests as req
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('spark')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET","POST","OPTIONS"],
     "allow_headers": ["Content-Type","Authorization"]}})

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

# ─── Brand images: real logo/photo URLs for 200+ chains ────────
BRAND_IMAGES = {}
_clearbit = lambda d: f"https://logo.clearbit.com/{d}"
_brands = {
    'starbucks':'starbucks.com','mcdonalds':'mcdonalds.com',"mcdonald's":'mcdonalds.com',
    'walmart':'walmart.com','target':'target.com','costco':'costco.com',
    'subway':'subway.com','dominos':'dominos.com',"domino's":'dominos.com',
    'pizza hut':'pizzahut.com','taco bell':'tacobell.com','chick-fil-a':'chick-fil-a.com',
    'wendys':'wendys.com',"wendy's":'wendys.com','burger king':'bk.com',
    'chipotle':'chipotle.com','panda express':'pandaexpress.com',
    'olive garden':'olivegarden.com','applebees':'applebees.com',"applebee's":'applebees.com',
    'ihop':'ihop.com',"denny's":'dennys.com','dennys':'dennys.com',
    'walgreens':'walgreens.com','cvs':'cvs.com','rite aid':'riteaid.com',
    'home depot':'homedepot.com','lowes':'lowes.com',"lowe's":'lowes.com',
    'autozone':'autozone.com','jiffy lube':'jiffylube.com',
    'planet fitness':'planetfitness.com','anytime fitness':'anytimefitness.com',
    'great clips':'greatclips.com','supercuts':'supercuts.com',
    'wells fargo':'wellsfargo.com','chase':'chase.com','bank of america':'bankofamerica.com',
    'vasa fitness':'vasafitness.com','costa vida':'costavida.com','cafe rio':'caferio.com',
    'in-n-out':'in-n-out.com','five guys':'fiveguys.com',
    'panera':'panerabread.com','panera bread':'panerabread.com',
    'dunkin':'dunkindonuts.com',"dunkin'":'dunkindonuts.com',
    'scheels':'scheels.com','petco':'petco.com','petsmart':'petsmart.com',
    'best buy':'bestbuy.com','kohls':'kohls.com',"kohl's":'kohls.com',
    'ross':'rossstores.com','tjmaxx':'tjmaxx.com','marshalls':'marshalls.com',
    'sephora':'sephora.com','ulta':'ulta.com',
    'trader joes':'traderjoes.com',"trader joe's":'traderjoes.com',
    'whole foods':'wholefoodsmarket.com','aldi':'aldi.us',
    'smiths':'smithsfoodanddrug.com',"smith's":'smithsfoodanddrug.com',
    'kroger':'kroger.com','les schwab':'lesschwab.com',
    "o'reilly":'oreillyauto.com','napa auto':'napaonline.com',
    'ace hardware':'acehardware.com','harbor freight':'harborfreight.com',
    'bath & body works':'bathandbodyworks.com','gap':'gap.com','old navy':'oldnavy.com',
    'h&m':'hm.com','nike':'nike.com','adidas':'adidas.com','puma':'puma.com',
    'foot locker':'footlocker.com','finish line':'finishline.com',
    'dollar tree':'dollartree.com','dollar general':'dollargeneral.com',
    'family dollar':'familydollar.com','big lots':'biglots.com',
    'bed bath':'bedbathandbeyond.com','pier 1':'pier1.com',
    'hobby lobby':'hobbylobby.com','michaels':'michaels.com',
    'joann':'joann.com','staples':'staples.com','office depot':'officedepot.com',
    'fedex':'fedex.com','ups':'ups.com','usps':'usps.com',
    'att':'att.com','at&t':'att.com','verizon':'verizon.com','t-mobile':'t-mobile.com',
    'sprint':'sprint.com','xfinity':'xfinity.com','spectrum':'spectrum.com',
    'comcast':'comcast.com','cox':'cox.com',
    'hilton':'hilton.com','marriott':'marriott.com','hyatt':'hyatt.com',
    'holiday inn':'ihg.com','best western':'bestwestern.com',
    'motel 6':'motel6.com','la quinta':'lq.com',
    'enterprise':'enterprise.com','hertz':'hertz.com','avis':'avis.com',
    'u-haul':'uhaul.com','budget':'budget.com',
    'papa johns':'papajohns.com',"papa john's":'papajohns.com',
    'little caesars':'littlecaesars.com',"little caesar's":'littlecaesars.com',
    'kfc':'kfc.com','popeyes':'popeyes.com',"popeye's":'popeyes.com',
    'sonic':'sonicdrivein.com','jack in the box':'jackinthebox.com',
    'carl\'s jr':'carlsjr.com','hardees':'hardees.com',"hardee's":'hardees.com',
    'arby\'s':'arbys.com','arbys':'arbys.com',
    'chilis':'chilis.com',"chili's":'chilis.com',
    'outback':'outback.com','red lobster':'redlobster.com',
    'cracker barrel':'crackerbarrel.com','waffle house':'wafflehouse.com',
    'bob evans':'bobevans.com','golden corral':'goldencorral.com',
    'buffalo wild wings':'buffalowildwings.com',
    'texas roadhouse':'texasroadhouse.com','longhorn':'longhornsteakhouse.com',
    'ruth\'s chris':'ruthschris.com',
    'the cheesecake factory':'thecheesecakefactory.com',
    'cheesecake factory':'thecheesecakefactory.com',
    'pf chang':'pfchangs.com',"p.f. chang's":'pfchangs.com',
    'red robin':'redrobin.com','wingstop':'wingstop.com',
    'jersey mike':'jerseymikes.com',"jersey mike's":'jerseymikes.com',
    'firehouse subs':'firehousesubs.com','jimmy john':'jimmyjohns.com',
    "jimmy john's":'jimmyjohns.com','jason\'s deli':'jasonsdeli.com',
    'tropical smoothie':'tropicalsmoothie.com','jamba':'jamba.com',
    'smoothie king':'smoothieking.com','baskin':'baskinrobbins.com',
    'baskin-robbins':'baskinrobbins.com','dairy queen':'dairyqueen.com',
    'cold stone':'coldstonecreamery.com','ben & jerry':'benjerry.com',
    'krispy kreme':'krispykreme.com',
    'sams club':'samsclub.com',"sam's club":'samsclub.com',
    'bjs':'bjs.com',"bj's":'bjs.com',
    'winco':'wincofoods.com','albertsons':'albertsons.com',
    'safeway':'safeway.com','publix':'publix.com','heb':'heb.com',
    'meijer':'meijer.com','wegmans':'wegmans.com',
    'sprouts':'sprouts.com','natural grocers':'naturalgrocers.com',
    'trader joe':'traderjoes.com',
    'lifetime fitness':'lifetime.life','la fitness':'lafitness.com',
    'gold\'s gym':'goldsgym.com','24 hour fitness':'24hourfitness.com',
    'orangetheory':'orangetheory.com','crossfit':'crossfit.com',
    'curves':'curves.com','snap fitness':'snapfitness.com',
    'sport clips':'sportclips.com','fantastic sams':'fantasticsams.com',
    'floyd\'s':'floydsbarbershop.com','cost cutters':'costcutters.com',
    'regis':'regissalons.com',
    'lenscrafters':'lenscrafters.com','pearle vision':'pearlevision.com',
    'americas best':'americasbest.com',
    'aspen dental':'aspendental.com','heartland dental':'heartland.com',
    'gentle dental':'gentledental.com',
    'meineke':'meineke.com','midas':'midas.com','maaco':'maaco.com',
    'pep boys':'pepboys.com','firestone':'firestonecompleteautocare.com',
    'goodyear':'goodyear.com','discount tire':'discounttire.com',
    'valvoline':'valvoline.com','take 5':'take5oilchange.com',
    'grease monkey':'greasemonkeyauto.com',
    'waffle love':'wafflelove.com','cupbop':'cupbop.com',
    'sola salon':'solasalonstudios.com','color me mine':'colormemine.com',
    'crumbl':'crumblcookies.com','swig':'swigdrinks.com',
    'sodalicious':'sodalicious.net','fiiz':'fiizdrinks.com',
    'r&r bbq':'randrbbq.com','even stevens':'evenstevens.com',
    'caputos':'caputosdeli.com','red iguana':'rediguana.com',
    'lucky 13':'lucky13slc.com','crown burger':'crownburger.com',
}
for name, domain in _brands.items():
    BRAND_IMAGES[name] = _clearbit(domain)

# ─── Category fallback images (Unsplash, royalty free) ─────────
CAT_IMG = {
    'Coffee & Cafes':'photo-1501339847302-ac426a4a7cbb','Bakeries':'photo-1509440159596-0249088772ff',
    'Pizza':'photo-1565299624946-b28f40a0ae38','Dinner':'photo-1517248135467-4c7edcad34c4',
    'Takeout':'photo-1565299585323-38d6b0865b47','Lunch':'photo-1504674900247-0877df9cc836',
    'Mexican':'photo-1565299585323-38d6b0865b47','Italian':'photo-1565299624946-b28f40a0ae38',
    'Chinese':'photo-1547592166-23ac45744acd','Breakfast & Brunch':'photo-1533920379810-6bedac961555',
    'Hair Salons':'photo-1560066984-138dadb4c035','Barbers':'photo-1585747860019-8e0d275e9dd8',
    'Spas':'photo-1544161515-4ab6ce6db874','Nail Salons':'photo-1604654894610-df63bc536371',
    'Massage':'photo-1544161515-4ab6ce6db874',
    'Dentists':'photo-1629909613654-28e377c37b09','Doctors':'photo-1631217868264-e5b90bb7e133',
    'Chiropractors':'photo-1579684385127-1ef15d508118','Optometrists':'photo-1574258495973-f010dfbb5371',
    'Auto Repair':'photo-1486262715619-67b85e0b08d3','Car Wash':'photo-1607860108855-64acf2078ed9',
    'Car Dealers':'photo-1549317661-bd32c8ce0afe','Tires':'photo-1486262715619-67b85e0b08d3',
    'Contractors':'photo-1504307651254-35680f356dfd','Plumbers':'photo-1558618666-fcd25c85f82e',
    'Electricians':'photo-1558618666-fcd25c85f82e','Roofing':'photo-1632759145351-1d592919f522',
    'Painters':'photo-1562259929-b4e1fd3aef09','Florists':'photo-1487530811176-3780de880c2d',
    'Landscaping':'photo-1558904541-efa843a96f01','Furniture':'photo-1555041469-a586c61ea9bc',
    'Hotels':'photo-1566073771259-6a8506099945','Campgrounds':'photo-1504280390367-361c6d9f38f4',
    'Things to Do':'photo-1501594907352-04cda38ebc29','Bowling':'photo-1545232979-8bf68ee9b1af',
    'Nightlife':'photo-1566417713940-fe7c737a9ef2','Shopping Malls':'photo-1567449303078-57ad995bd329',
    'Kids Activities':'photo-1566140967404-b8b3932483f5','Bookstores':'photo-1526243741027-444d633d7365',
    'Gyms':'photo-1534438327276-14e5300c3a48','Yoga & Pilates':'photo-1544367567-0f2fcb009e0b',
    'Banks':'photo-1541354329998-f4d9a9f9297f','Pet Groomers':'photo-1516734212186-a967f81ad0d7',
    'Dry Cleaning':'photo-1517677208171-0bc6725a3e60','Thrift Stores':'photo-1441986300917-64674bd600d8',
    'Venues & Events':'photo-1492684223066-81342ee5ff30','Churches':'photo-1438032005730-c779502df39b',
}

def get_image(name, brand, website, cat, sub):
    """Best available image: brand logo → website logo → category stock."""
    nl = name.lower().strip()
    bl = (brand or '').lower().strip()
    # Check brand DB
    for key, url in BRAND_IMAGES.items():
        if key in nl or key in bl:
            return url
    # Try website domain
    if website:
        try:
            d = website.replace('https://','').replace('http://','').split('/')[0].split('?')[0]
            if d and '.' in d:
                return _clearbit(d)
        except: pass
    # Category stock
    img_id = CAT_IMG.get(sub) or CAT_IMG.get(cat)
    if img_id: return f"https://images.unsplash.com/{img_id}?w=480&h=320&fit=crop"
    return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=480&h=320&fit=crop"


# ─── Category maps ─────────────────────────────────────────────
AMENITY_MAP = {
    'restaurant':('Restaurants','Dinner'),'fast_food':('Restaurants','Takeout'),
    'cafe':('Restaurants','Coffee & Cafes'),'bar':('Travel & Activities','Nightlife'),
    'pub':('Travel & Activities','Nightlife'),'ice_cream':('Restaurants','Bakeries'),
    'food_court':('Restaurants','Takeout'),'bbq':('Restaurants','Dinner'),
    'dentist':('Health & Beauty','Dentists'),'doctors':('Health & Beauty','Doctors'),
    'clinic':('Health & Beauty','Doctors'),'hospital':('Health & Beauty','Doctors'),
    'pharmacy':('Health & Beauty','Doctors'),'veterinary':('More','Pet Groomers'),
    'optician':('Health & Beauty','Optometrists'),'chiropractor':('Health & Beauty','Chiropractors'),
    'car_repair':('Auto Services','Auto Repair'),'car_wash':('Auto Services','Car Wash'),
    'fuel':('Auto Services','Auto Repair'),'car_rental':('Auto Services','Car Dealers'),
    'parking':('Auto Services','Parking'),
    'cinema':('Travel & Activities','Things to Do'),'theatre':('Travel & Activities','Venues & Events'),
    'library':('Travel & Activities','Bookstores'),'place_of_worship':('Travel & Activities','Churches'),
    'community_centre':('Travel & Activities','Venues & Events'),
    'nightclub':('Travel & Activities','Nightlife'),
    'bowling_alley':('Travel & Activities','Bowling'),
    'swimming_pool':('Travel & Activities','Swimming Pools'),
    'bank':('More','Banks'),'post_office':('More','Banks'),
    'kindergarten':('Travel & Activities','Kids Activities'),
    'gym':('More','Gyms'),'laundry':('More','Laundromats'),
}
SHOP_MAP = {
    'bakery':('Restaurants','Bakeries'),'deli':('Restaurants','Lunch'),
    'coffee':('Restaurants','Coffee & Cafes'),'pastry':('Restaurants','Bakeries'),
    'pizza':('Restaurants','Pizza'),'supermarket':('Restaurants','Takeout'),
    'convenience':('Restaurants','Takeout'),
    'hairdresser':('Health & Beauty','Hair Salons'),'beauty':('Health & Beauty','Spas'),
    'cosmetics':('Health & Beauty','Nail Salons'),'massage':('Health & Beauty','Massage'),
    'tattoo':('Health & Beauty','Barbers'),'nail_salon':('Health & Beauty','Nail Salons'),
    'clothes':('More','Thrift Stores'),'shoes':('More','Thrift Stores'),
    'department_store':('Travel & Activities','Shopping Malls'),
    'mall':('Travel & Activities','Shopping Malls'),
    'jewelry':('More','Thrift Stores'),'sports':('Travel & Activities','Things to Do'),
    'bicycle':('Travel & Activities','Bike Rentals'),'toys':('Travel & Activities','Kids Activities'),
    'books':('Travel & Activities','Bookstores'),
    'furniture':('Home & Garden','Furniture'),'garden_centre':('Home & Garden','Nurseries'),
    'hardware':('Home & Garden','Contractors'),'doityourself':('Home & Garden','Contractors'),
    'florist':('Home & Garden','Florists'),'locksmith':('Home & Garden','Locksmiths'),
    'car':('Auto Services','Car Dealers'),'car_parts':('Auto Services','Auto Repair'),
    'tyres':('Auto Services','Tires'),
    'pet':('More','Pet Groomers'),'dry_cleaning':('More','Dry Cleaning'),
    'laundry':('More','Laundromats'),'tailor':('More','Tailors'),
    'electronics':('More','Real Estate'),'mobile_phone':('More','Real Estate'),
}
TOURISM_MAP = {
    'hotel':('Travel & Activities','Hotels'),'motel':('Travel & Activities','Hotels'),
    'hostel':('Travel & Activities','Hotels'),'camp_site':('Travel & Activities','Campgrounds'),
    'museum':('Travel & Activities','Things to Do'),'gallery':('Travel & Activities','Things to Do'),
    'zoo':('Travel & Activities','Kids Activities'),'theme_park':('Travel & Activities','Things to Do'),
    'attraction':('Travel & Activities','Things to Do'),
}
LEISURE_MAP = {
    'fitness_centre':('More','Gyms'),'sports_centre':('More','Gyms'),
    'swimming_pool':('Travel & Activities','Swimming Pools'),
    'bowling_alley':('Travel & Activities','Bowling'),
    'golf_course':('Travel & Activities','Mini Golf'),
    'miniature_golf':('Travel & Activities','Mini Golf'),
    'dance':('Travel & Activities','Things to Do'),'yoga':('More','Yoga & Pilates'),
}
CRAFT_MAP = {
    'plumber':('Home & Garden','Plumbers'),'electrician':('Home & Garden','Electricians'),
    'carpenter':('Home & Garden','Contractors'),'roofer':('Home & Garden','Roofing'),
    'painter':('Home & Garden','Painters'),'hvac':('Home & Garden','HVAC'),
    'gardener':('Home & Garden','Landscaping'),
}

def categorize(tags):
    a,s,t,l,cr,cu = (tags.get(k,'') for k in ('amenity','shop','tourism','leisure','craft','cuisine'))
    if cr in CRAFT_MAP: return CRAFT_MAP[cr]
    if a in AMENITY_MAP:
        cat,sub = AMENITY_MAP[a]
        if a in ('restaurant','fast_food') and cu:
            c = cu.lower().split(';')[0].strip()
            cuisine_map = {'mexican':'Mexican','pizza':'Pizza','italian':'Italian','chinese':'Chinese',
                'japanese':'Dinner','thai':'Dinner','indian':'Dinner','burger':'Takeout',
                'sushi':'Dinner','korean':'Dinner','breakfast':'Breakfast & Brunch',
                'coffee':'Coffee & Cafes','sandwich':'Lunch','seafood':'Dinner',
                'steak':'Dinner','bbq':'Dinner','taco':'Mexican'}
            for k,v in cuisine_map.items():
                if k in c: sub=v; break
        return cat,sub
    if s in SHOP_MAP: return SHOP_MAP[s]
    if t in TOURISM_MAP: return TOURISM_MAP[t]
    if l in LEISURE_MAP: return LEISURE_MAP[l]
    return ('More','Thrift Stores') if s else ('More','Banks') if a else ('More','Thrift Stores')


def overpass_post(query_str):
    """Try Overpass mirrors with retry. Returns parsed JSON or None."""
    for i, url in enumerate(OVERPASS_URLS):
        try:
            log.info(f"Trying Overpass mirror {i+1}: {url[:40]}...")
            r = req.post(url, data={'data': query_str}, timeout=40)
            if r.status_code == 200:
                data = r.json()
                log.info(f"Overpass returned {len(data.get('elements',[]))} elements")
                return data
            log.warning(f"Overpass {url} returned {r.status_code}")
        except req.exceptions.Timeout:
            log.warning(f"Overpass {url} timed out")
        except Exception as e:
            log.warning(f"Overpass {url} error: {e}")
    return None


def parse_element(el, clat=0, clng=0):
    tags = el.get('tags', {})
    name = tags.get('name')
    if not name: return None
    if el['type'] == 'node':
        lat, lng = el.get('lat'), el.get('lon')
    elif 'center' in el:
        lat, lng = el['center'].get('lat'), el['center'].get('lon')
    else:
        return None
    if lat is None or lng is None: return None

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

    tlabels = [sub]
    if cuisine_raw:
        tlabels = [c.strip().title() for c in cuisine_raw.split(';')[:3]] + [sub]
    if brand and brand not in tlabels: tlabels.insert(0, brand)
    tlabels = list(dict.fromkeys(tlabels))[:4]  # dedupe

    dx = (lat - clat) * 111320
    dy = (lng - clng) * 111320 * math.cos(math.radians(clat))
    dist = math.sqrt(dx*dx + dy*dy)

    comp = sum([3 if phone else 0, 3 if website else 0, 2 if opening else 0,
                2 if address else 0, 2 if desc else 0, 1 if brand else 0])

    image = get_image(name, brand, website, cat, sub)

    return {
        'id': el['id'], 'name': name, 'category': cat, 'subcategory': sub,
        'lat': lat, 'lng': lng, 'location': loc or 'Nearby', 'address': address,
        'phone': phone, 'website': website, 'openingHours': opening,
        'description': desc, 'brand': brand, 'features': feats,
        'tagLabels': tlabels, 'image': image,
        'isVerified': bool(phone or website),
        'distanceMeters': round(dist), '_comp': comp,
        '_s': f"{name} {cat} {sub} {cuisine_raw} {brand}".lower(),
    }


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════

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
        return jsonify({'error': 'lat and lng are required'}), 400

    log.info(f"Search: q={q!r} cat={category!r} lat={lat} lng={lng} r={radius} p={page}")

    # Build Overpass query
    if q:
        # Name/brand regex search — finds specific businesses like "Starbucks"
        safe = re.sub(r'[^\w\s]', '', q)  # strip special chars for regex safety
        oq = f"""[out:json][timeout:30];(
          node["name"~"{safe}",i](around:{radius},{lat},{lng});
          way["name"~"{safe}",i](around:{radius},{lat},{lng});
          node["brand"~"{safe}",i](around:{radius},{lat},{lng});
          way["brand"~"{safe}",i](around:{radius},{lat},{lng});
        );out center 500;"""
    else:
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

    data = overpass_post(oq)
    if data is None:
        log.error("All Overpass mirrors failed")
        return jsonify({
            'error': 'Business search servers are busy. Please try again in a moment.',
            'businesses': [], 'total': 0, 'page': 1, 'totalPages': 1, 'perPage': per_page,
            'center': {'lat': lat, 'lng': lng}, 'radius': radius,
        }), 200  # Return 200 with empty results + error message instead of 502

    bizs, seen = [], set()
    for el in data.get('elements', []):
        b = parse_element(el, lat, lng)
        if not b: continue
        nk = b['name'].lower().strip()
        if nk in seen: continue
        seen.add(nk)
        if category and b['subcategory'] != category: continue
        bizs.append(b)

    # Sort: completeness → distance
    bizs.sort(key=lambda x: (-x['_comp'], x['distanceMeters']))
    for b in bizs:
        b.pop('_s', None)
        b.pop('_comp', None)

    total = len(bizs)
    tp = max(1, math.ceil(total / per_page))
    page = max(1, min(page, tp))
    items = bizs[(page-1)*per_page : page*per_page]

    log.info(f"Returning {len(items)} of {total} businesses, page {page}/{tp}")
    return jsonify({'businesses': items, 'total': total, 'page': page,
                    'perPage': per_page, 'totalPages': tp,
                    'center': {'lat': lat, 'lng': lng}, 'radius': radius})


@app.route('/api/suggest', methods=['GET'])
def suggest():
    q = request.args.get('q', '').strip().lower()
    pops = [
        {'label':'Restaurants','type':'category'},{'label':'Coffee & Cafes','type':'category'},
        {'label':'Takeout','type':'category'},{'label':'Plumbers','type':'category'},
        {'label':'Auto Repair','type':'category'},{'label':'Dentists','type':'category'},
        {'label':'Hair Salons','type':'category'},{'label':'Gyms','type':'category'},
        {'label':'Hotels','type':'category'},{'label':'Pizza','type':'category'},
        {'label':'Contractors','type':'category'},{'label':'Delivery','type':'category'},
    ]
    if not q: return jsonify({'suggestions': pops[:7]})

    ms = [p for p in pops if q in p['label'].lower()]
    seen = {m['label'] for m in ms}
    for cat in [AMENITY_MAP, SHOP_MAP, TOURISM_MAP, LEISURE_MAP, CRAFT_MAP]:
        for k,(c,s) in cat.items():
            if (q in s.lower() or q in k) and s not in seen:
                ms.append({'label':s,'type':'category'}); seen.add(s)

    # Always add a "search by name" option so users can find specific businesses
    if len(q) >= 2:
        ms.append({'label': f'Search for "{q}"', 'type': 'name_search', 'query': q})

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
        r = req.get('https://nominatim.openstreetmap.org/search',
            params={'q': q, 'format': 'json', 'limit': 5, 'addressdetails': 1},
            headers={'User-Agent': 'Spark/1.0'}, timeout=8)
        r.raise_for_status(); results = r.json()
    except:
        return jsonify({'locations': defs})
    locs = [{'label':'Current Location','type':'current'}]
    for res in results:
        ad = res.get('address',{}); city = ad.get('city', ad.get('town', ad.get('village','')))
        st = ad.get('state',''); short = f"{city}, {st}".strip(', ') if city else res.get('display_name','')[:50]
        locs.append({'label': short, 'type': 'result', 'lat': float(res['lat']), 'lng': float(res['lon'])})
    return jsonify({'locations': locs[:7]})


@app.route('/api/geocode', methods=['GET'])
def geocode():
    q = request.args.get('q', '').strip()
    if not q: return jsonify({'error': 'q required'}), 400
    try:
        r = req.get('https://nominatim.openstreetmap.org/search',
            params={'q': q, 'format': 'json', 'limit': 1},
            headers={'User-Agent': 'Spark/1.0'}, timeout=10)
        r.raise_for_status(); results = r.json()
    except Exception as e:
        return jsonify({'error': f'Geocoding failed: {str(e)}'}), 502
    if not results:
        return jsonify({'error': f'Could not find "{q}"'}), 404
    return jsonify({'lat': float(results[0]['lat']), 'lng': float(results[0]['lon']),
                    'displayName': results[0].get('display_name', q)})


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'overpass_mirrors': len(OVERPASS_URLS)})


if __name__ == '__main__':
    log.info("Starting Spark API on port 5000...")
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))