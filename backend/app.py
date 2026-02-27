"""
backend/app.py — Spark API v5
Performance overhaul:
 - In-memory cache: fetch area once, filter in Python (instant name search)
 - Multiple images per category (5-8 each, picked by name hash)
 - Shorter Overpass timeout with smarter retry
 - Name search is now instant (filters cached data)
"""
import os, math, hashlib, re, logging, time, threading
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

# ─── Area cache ────────────────────────────────────────────────
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 600

def cache_key(lat, lng, radius):
    return f"{round(lat*200)/200},{round(lng*200)/200},{radius}"

def get_cached(lat, lng, radius):
    k = cache_key(lat, lng, radius)
    with _cache_lock:
        if k in _cache and time.time() - _cache[k]['ts'] < CACHE_TTL:
            return _cache[k]['businesses']
    return None

def set_cached(lat, lng, radius, bizs):
    k = cache_key(lat, lng, radius)
    with _cache_lock:
        _cache[k] = {'businesses': bizs, 'ts': time.time()}

# ─── Category images (5-8 distinct per category) ──────────────
_IMG = {
    'Coffee & Cafes':['photo-1501339847302-ac426a4a7cbb','photo-1509042239860-f550ce710b93','photo-1495474472287-4d71bcdd2085','photo-1442512595331-e89e73853f31','photo-1514432324607-a09d9b4aefda'],
    'Bakeries':['photo-1509440159596-0249088772ff','photo-1486427944544-d2c246c4df4a','photo-1558961363-fa8fdf82db35','photo-1517433670267-08bbd4be890f','photo-1483695028939-5bb13f8648b0'],
    'Pizza':['photo-1565299624946-b28f40a0ae38','photo-1574071318508-1cdbab80d002','photo-1513104890138-7c749659a591','photo-1588315029754-2dd089d39a1a','photo-1593560708920-61dd98c46a4e'],
    'Dinner':['photo-1517248135467-4c7edcad34c4','photo-1414235077428-338989a2e8c0','photo-1559329007-40df8a9345d8','photo-1550966871-3ed3cdb51f3a','photo-1424847651672-bf20a4b0982b','photo-1466978913421-dad2ebd01d17'],
    'Takeout':['photo-1565299585323-38d6b0865b47','photo-1504674900247-0877df9cc836','photo-1568901346375-23c9450c58cd','photo-1561758033-d89a9ad46330','photo-1594212699903-ec8a3eca50f5'],
    'Lunch':['photo-1504674900247-0877df9cc836','photo-1512621776951-a57141f2eefd','photo-1546069901-ba9599a7e63c','photo-1498837167922-ddd27525d352','photo-1547592180-85f173990554'],
    'Mexican':['photo-1565299585323-38d6b0865b47','photo-1552332386-f8dd00dc2f85','photo-1599974579688-8dbdd335c77f','photo-1624300629298-e9209b2b5c1c','photo-1551504734-5ee1c4a1479b'],
    'Italian':['photo-1565299624946-b28f40a0ae38','photo-1551183053-bf91a1d81141','photo-1595295333158-4742f28fbd85','photo-1498579150354-977475b7ea0b','photo-1533777324565-a040eb52fac1'],
    'Chinese':['photo-1547592166-23ac45744acd','photo-1563245372-f21724e3856d','photo-1585032226651-759b368d7246','photo-1552611052-33e04de1b100','photo-1569718212165-3a8278d5f624'],
    'Breakfast & Brunch':['photo-1533920379810-6bedac961555','photo-1504754524776-8f4f37790ca0','photo-1525351484163-7529414344d8','photo-1528207776546-365bb710ee93','photo-1493770348161-369560ae357d'],
    'Hair Salons':['photo-1560066984-138dadb4c035','photo-1521590832167-7bcbfaa6381f','photo-1562322140-8baeececf3df','photo-1582095133179-bfd08e2fc6b3','photo-1633681926022-84c23e8cb2d6'],
    'Barbers':['photo-1585747860019-8e0d275e9dd8','photo-1503951914875-452162b0f3f1','photo-1599351431202-1e0f0137899a','photo-1622286342621-4bd786c2447c','photo-1621605815971-fbc98d665033'],
    'Spas':['photo-1544161515-4ab6ce6db874','photo-1600334129128-685c5582fd35','photo-1540555700478-4be289fbec6d','photo-1519823551278-64ac92734fb1','photo-1507652313519-d4e9174996dd'],
    'Nail Salons':['photo-1604654894610-df63bc536371','photo-1610992015732-2449b76344bc','photo-1519014816548-bf5fe059798b','photo-1571290274554-6a2eaa71bea4'],
    'Massage':['photo-1544161515-4ab6ce6db874','photo-1519823551278-64ac92734fb1','photo-1600334129128-685c5582fd35','photo-1507652313519-d4e9174996dd','photo-1515377905703-c4788e51af15'],
    'Dentists':['photo-1629909613654-28e377c37b09','photo-1606811841689-23dfddce3e95','photo-1588776814546-1ffcf47267a5','photo-1598256989800-fe5f95da9787','photo-1609840114035-3c981b782dfe'],
    'Doctors':['photo-1631217868264-e5b90bb7e133','photo-1579684385127-1ef15d508118','photo-1581056771107-24ca5f033842','photo-1530026405186-ed1f139313f8'],
    'Chiropractors':['photo-1579684385127-1ef15d508118','photo-1559757175-5700dde675bc','photo-1576091160550-2173dba999ef','photo-1571019613454-1cb2f99b2d8b'],
    'Optometrists':['photo-1574258495973-f010dfbb5371','photo-1591076482161-42ce6da69f67','photo-1577401239170-897c8e88fcfb','photo-1560963805-6c64417e3413'],
    'Auto Repair':['photo-1486262715619-67b85e0b08d3','photo-1619642751034-765dfdf7c58e','photo-1580273916550-e323be2ae537','photo-1625047509248-ec889cbff17f','photo-1487754180451-c456f719a1fc'],
    'Car Wash':['photo-1607860108855-64acf2078ed9','photo-1520340356584-f9917d1eea6f','photo-1605164599901-db23013a79c8','photo-1596385573780-592fe7e09f6a'],
    'Car Dealers':['photo-1549317661-bd32c8ce0afe','photo-1552519507-da3b142c6e3d','photo-1568605117036-5fe5e7bab0b7','photo-1494976388531-d1058494cdd8'],
    'Contractors':['photo-1504307651254-35680f356dfd','photo-1581578731548-c64695cc6952','photo-1621905251189-08b45d6a269e','photo-1503387762-592deb58ef4e'],
    'Plumbers':['photo-1558618666-fcd25c85f82e','photo-1585704032915-c3400ca199e7','photo-1607472586893-edb57bdc0e39','photo-1504328345606-18bbc8c9d7d1'],
    'Electricians':['photo-1558618666-fcd25c85f82e','photo-1621905252507-b35492cc74b4','photo-1581094794329-c8112a89af12'],
    'Roofing':['photo-1632759145351-1d592919f522','photo-1600585154526-990dced4db0d','photo-1558036117-15d82a90b9b1','photo-1513584684374-8bab748fbf90'],
    'Florists':['photo-1487530811176-3780de880c2d','photo-1490750967868-88aa4f44baee','photo-1563241527-3004b7be0ffd','photo-1457089328109-e5d9bd499191','photo-1525310272905-1a197820b2fd'],
    'Landscaping':['photo-1558904541-efa843a96f01','photo-1600607687939-ce8a6c25118c','photo-1600607687644-c7171b62d583','photo-1585320806297-9794b3e4eeae'],
    'Furniture':['photo-1555041469-a586c61ea9bc','photo-1538688525198-9b88f6f53126','photo-1540574163026-643ea20ade25','photo-1556228453-efd6c1ff04f6'],
    'Hotels':['photo-1566073771259-6a8506099945','photo-1551882547-ff40c63fe5fa','photo-1582719508461-905c673771fd','photo-1520250497591-112f2f40a3f4','photo-1564501049412-61c2a3083791'],
    'Campgrounds':['photo-1504280390367-361c6d9f38f4','photo-1487730116645-74489c95b41b','photo-1537905569824-f89f14cceb68','photo-1510672981848-a1c4f1cb5ccf'],
    'Things to Do':['photo-1501594907352-04cda38ebc29','photo-1470229722913-7c0e2dbbafd3','photo-1523580494863-6f3031224c94','photo-1492684223066-81342ee5ff30','photo-1511578314322-379afb476865'],
    'Bowling':['photo-1545232979-8bf68ee9b1af','photo-1540747913346-19e32dc3e97e','photo-1556056733-59b5681e1831','photo-1558008258-3256797b43f3'],
    'Nightlife':['photo-1566417713940-fe7c737a9ef2','photo-1514525253161-7a46d19cd819','photo-1470225620780-dba8ba36b745','photo-1571204829887-3b8d69e4094d'],
    'Shopping Malls':['photo-1567449303078-57ad995bd329','photo-1441986300917-64674bd600d8','photo-1555529771-835f59fc5efa','photo-1481437156560-3205f6a55735'],
    'Kids Activities':['photo-1566140967404-b8b3932483f5','photo-1587654780014-9d2e2f5e0a05','photo-1472162072942-cd5147eb3902','photo-1484820540004-14229fe36ca4'],
    'Bookstores':['photo-1526243741027-444d633d7365','photo-1507842217343-583bb7270b66','photo-1512820790803-83ca734da794','photo-1544716278-ca5e3f4abd8c'],
    'Gyms':['photo-1534438327276-14e5300c3a48','photo-1571902943202-507ec2618e8f','photo-1540497077202-7c8a3999166f','photo-1576678927484-cc907957088c','photo-1517836357463-d25dfeac3438'],
    'Yoga & Pilates':['photo-1544367567-0f2fcb009e0b','photo-1506126613408-eca07ce68773','photo-1545389336-cf090694435e','photo-1599447421416-3414500d18a5'],
    'Banks':['photo-1541354329998-f4d9a9f9297f','photo-1556742049-0cfed4f6a45d','photo-1559526324-593bc073d938','photo-1618044733300-9472054094ee'],
    'Pet Groomers':['photo-1516734212186-a967f81ad0d7','photo-1587300003388-59208cc962cb','photo-1548199973-03cce0bbc87b','photo-1583337130417-13219ce08108'],
    'Dry Cleaning':['photo-1517677208171-0bc6725a3e60','photo-1545173168-9f1947eebb7f','photo-1582735689369-4fe89db7114c'],
    'Thrift Stores':['photo-1441986300917-64674bd600d8','photo-1555529771-835f59fc5efa','photo-1567401893414-76b7b1e5a7a5','photo-1523381210434-271e8be1f52b','photo-1441984904996-e0b6ba687e04'],
    'Venues & Events':['photo-1492684223066-81342ee5ff30','photo-1514525253161-7a46d19cd819','photo-1540575467063-178a50e2fd60','photo-1505236858219-8359eb29e329'],
    'Churches':['photo-1438032005730-c779502df39b','photo-1548625149-fc4a29cf7092','photo-1543702242-8a4bd129e62d'],
    'Parking':['photo-1590674899484-d5640e854abe','photo-1573348722427-f1d6819fdf98','photo-1506521781263-d8422e82f27a'],
    'Laundromats':['photo-1517677208171-0bc6725a3e60','photo-1545173168-9f1947eebb7f','photo-1469504512102-900f29606341'],
    'Tires':['photo-1486262715619-67b85e0b08d3','photo-1619642751034-765dfdf7c58e','photo-1580273916550-e323be2ae537'],
    'Nurseries':['photo-1558904541-efa843a96f01','photo-1416879595882-3373a0480b5b','photo-1585320806297-9794b3e4eeae','photo-1459411552884-841db9b3cc2a'],
    'HVAC':['photo-1558618666-fcd25c85f82e','photo-1585704032915-c3400ca199e7','photo-1504328345606-18bbc8c9d7d1'],
    'Painters':['photo-1562259929-b4e1fd3aef09','photo-1589939705384-5185137a7f0f','photo-1513542789411-b6a5d4f31634'],
    'Locksmiths':['photo-1558618666-fcd25c85f82e','photo-1585704032915-c3400ca199e7','photo-1504307651254-35680f356dfd'],
    'Swimming Pools':['photo-1576013551627-0cc20b96c2a7','photo-1519315901367-f34ff9154487','photo-1562778612-e1e0cda9915c'],
    'Mini Golf':['photo-1535131749006-b7f58c99034b','photo-1501594907352-04cda38ebc29','photo-1523580494863-6f3031224c94'],
    'Tailors':['photo-1558618666-fcd25c85f82e','photo-1517677208171-0bc6725a3e60','photo-1545173168-9f1947eebb7f'],
    'Real Estate':['photo-1560518883-ce09059eeffa','photo-1560184897-ae75f418493e','photo-1564013799919-ab600027ffc6'],
    'Bike Rentals':['photo-1571068316344-75bc76f77890','photo-1485965120184-e220f721d03e'],
}

def get_category_image(name, sub, cat):
    pool = _IMG.get(sub) or _IMG.get(cat) or ['photo-1441986300917-64674bd600d8']
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    pick = pool[h % len(pool)]
    return f"https://images.unsplash.com/{pick}?w=480&h=320&fit=crop"


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
            for k,v in {'mexican':'Mexican','pizza':'Pizza','italian':'Italian','chinese':'Chinese',
                'japanese':'Dinner','thai':'Dinner','indian':'Dinner','burger':'Takeout',
                'sushi':'Dinner','korean':'Dinner','breakfast':'Breakfast & Brunch',
                'coffee':'Coffee & Cafes','sandwich':'Lunch','seafood':'Dinner',
                'steak':'Dinner','bbq':'Dinner','taco':'Mexican'}.items():
                if k in c: sub=v; break
        return cat,sub
    if s in SHOP_MAP: return SHOP_MAP[s]
    if t in TOURISM_MAP: return TOURISM_MAP[t]
    if l in LEISURE_MAP: return LEISURE_MAP[l]
    return ('More','Thrift Stores') if s else ('More','Banks') if a else ('More','Thrift Stores')


def overpass_post(query_str):
    for i, url in enumerate(OVERPASS_URLS):
        try:
            log.info(f"Overpass mirror {i+1}...")
            r = req.post(url, data={'data': query_str}, timeout=25)
            if r.status_code == 200:
                data = r.json()
                log.info(f"Got {len(data.get('elements',[]))} elements")
                return data
            log.warning(f"Mirror {i+1} returned {r.status_code}")
        except req.exceptions.Timeout:
            log.warning(f"Mirror {i+1} timed out")
        except Exception as e:
            log.warning(f"Mirror {i+1} error: {e}")
    return None


def parse_element(el, clat=0, clng=0):
    tags = el.get('tags', {})
    name = tags.get('name')
    if not name: return None
    if el['type'] == 'node': lat, lng = el.get('lat'), el.get('lon')
    elif 'center' in el: lat, lng = el['center'].get('lat'), el['center'].get('lon')
    else: return None
    if lat is None or lng is None: return None

    cat, sub = categorize(tags)
    phone = tags.get('phone', tags.get('contact:phone', ''))
    website = tags.get('website', tags.get('contact:website', ''))
    opening = tags.get('opening_hours', '')
    brand = tags.get('brand', '')
    desc = tags.get('description', '')
    cuisine_raw = tags.get('cuisine', '')

    ap = []
    if tags.get('addr:housenumber'): ap.append(tags['addr:housenumber'])
    if tags.get('addr:street'): ap.append(tags['addr:street'])
    city = tags.get('addr:city', '')
    state = tags.get('addr:state', '')
    address = ', '.join(ap)
    loc = f"{city}, {state}".strip(', ') if city or state else ''

    feats = []
    if tags.get('wheelchair') in ('yes','limited'): feats.append('Wheelchair Accessible')
    if tags.get('internet_access') in ('yes','wlan'): feats.append('Free Wi-Fi')
    if tags.get('outdoor_seating') == 'yes': feats.append('Outdoor Seating')
    if tags.get('takeaway') in ('yes','only'): feats.append('Takeout Available')
    if tags.get('delivery') == 'yes': feats.append('Delivery')

    tlabels = [sub]
    if cuisine_raw:
        tlabels = [c.strip().title() for c in cuisine_raw.split(';')[:3]] + [sub]
    if brand and brand not in tlabels: tlabels.insert(0, brand)
    tlabels = list(dict.fromkeys(tlabels))[:4]

    dx = (lat - clat) * 111320
    dy = (lng - clng) * 111320 * math.cos(math.radians(clat))
    dist = math.sqrt(dx*dx + dy*dy)

    comp = sum([3 if phone else 0, 3 if website else 0, 2 if opening else 0,
                2 if address else 0, 2 if desc else 0, 1 if brand else 0])

    image = get_category_image(name, sub, cat)

    return {
        'id': el['id'], 'name': name, 'category': cat, 'subcategory': sub,
        'lat': lat, 'lng': lng, 'location': loc or 'Nearby', 'address': address,
        'phone': phone, 'website': website, 'openingHours': opening,
        'description': desc, 'brand': brand, 'features': feats,
        'tagLabels': tlabels, 'image': image,
        'isVerified': bool(phone or website),
        'distanceMeters': round(dist), '_comp': comp,
        '_search': f"{name} {brand} {cuisine_raw} {sub} {cat}".lower(),
    }


def fetch_area(lat, lng, radius):
    cached = get_cached(lat, lng, radius)
    if cached is not None:
        log.info(f"Cache hit: {len(cached)} businesses")
        return cached

    oq = f"""[out:json][timeout:25];(
      node["name"]["amenity"](around:{radius},{lat},{lng});
      node["name"]["shop"](around:{radius},{lat},{lng});
      node["name"]["tourism"](around:{radius},{lat},{lng});
      node["name"]["leisure"]["name"](around:{radius},{lat},{lng});
      node["name"]["craft"](around:{radius},{lat},{lng});
      way["name"]["amenity"](around:{radius},{lat},{lng});
      way["name"]["shop"](around:{radius},{lat},{lng});
      way["name"]["tourism"](around:{radius},{lat},{lng});
      way["name"]["craft"](around:{radius},{lat},{lng});
    );out center 1500;"""

    data = overpass_post(oq)
    if data is None: return None

    bizs, seen = [], set()
    for el in data.get('elements', []):
        b = parse_element(el, lat, lng)
        if not b: continue
        nk = b['name'].lower().strip()
        if nk in seen: continue
        seen.add(nk)
        bizs.append(b)

    bizs.sort(key=lambda x: (-x['_comp'], x['distanceMeters']))
    set_cached(lat, lng, radius, bizs)
    log.info(f"Cached {len(bizs)} businesses")
    return bizs


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

    log.info(f"Search: q={q!r} cat={category!r} r={radius} p={page}")

    all_biz = fetch_area(lat, lng, radius)
    if all_biz is None:
        return jsonify({
            'error': 'Search servers are busy. Please try again in a moment.',
            'businesses': [], 'total': 0, 'page': 1, 'totalPages': 1, 'perPage': per_page,
            'center': {'lat': lat, 'lng': lng}, 'radius': radius,
        })

    results = all_biz
    if q:
        ql = q.lower()
        results = [b for b in results if ql in b['_search']]
    if category:
        results = [b for b in results if b['subcategory'] == category]

    clean = [{k:v for k,v in b.items() if not k.startswith('_')} for b in results]

    total = len(clean)
    tp = max(1, math.ceil(total / per_page))
    page = max(1, min(page, tp))
    items = clean[(page-1)*per_page : page*per_page]

    log.info(f"Returning {len(items)} of {total}, page {page}/{tp}")
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
    except: return jsonify({'locations': defs})
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
    except Exception as e: return jsonify({'error': f'Geocoding failed: {str(e)}'}), 502
    if not results: return jsonify({'error': f'Could not find "{q}"'}), 404
    return jsonify({'lat': float(results[0]['lat']), 'lng': float(results[0]['lon']),
                    'displayName': results[0].get('display_name', q)})


@app.route('/api/health')
def health(): return jsonify({'status': 'ok'})

if __name__ == '__main__':
    log.info("Starting Spark API on port 5000...")
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))