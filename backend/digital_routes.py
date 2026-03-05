"""
backend/digital_routes.py

Product Hunt API integration for digital business search.

FIXES:
- Search: PH API does NOT support 'search' arg on posts. We fetch from
  multiple popular topics and filter client-side by keyword matching.
- Pagination: fetches up to 8 pages (up to 400 results) per topic.
- Subcategories: 40+ subcategories mapped to PH topic slugs.
"""

import os, time, threading, math, logging
import requests as req
from flask import Blueprint, request, jsonify

log = logging.getLogger('spark.digital')

digital_bp = Blueprint('digital', __name__)

PH_API_KEY = os.environ.get('PRODUCT_HUNT_API_KEY', '')
PH_URL = 'https://api.producthunt.com/v2/api/graphql'

# ─── Cache ──────────────────────────────────────────────────────
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 600

def _cache_get(key):
    with _cache_lock:
        if key in _cache and time.time() - _cache[key]['ts'] < CACHE_TTL:
            return _cache[key]['data']
    return None

def _cache_set(key, data):
    with _cache_lock:
        _cache[key] = {'data': data, 'ts': time.time()}


# ─── Category → PH topic slug mapping ─────────────────────────
CATEGORY_TOPIC_MAP = {
    'productivity':    'productivity',
    'design':          'design-tools',
    'development':     'developer-tools',
    'e-commerce':      'e-commerce',
    'education':       'education',
    'marketing':       'marketing',
    'media':           'media',
    'ai':              'artificial-intelligence',
    'finance':         'fintech',
    'infrastructure':  'developer-tools',
    'freelance':       'productivity',
}

# ─── Subcategory → PH topic slug ──────────────────────────────
SUBCATEGORY_TOPIC_MAP = {
    'Task Management':    'productivity',
    'Note Taking':        'productivity',
    'Time Tracking':      'productivity',
    'Automation':         'no-code',
    'No-Code':            'no-code',
    'Remote Work':        'productivity',
    'Team Collaboration': 'collaboration',
    'UI/UX Tools':        'design-tools',
    'Prototyping':        'design-tools',
    'Icon & Assets':      'design-tools',
    'Video Editing':      'video',
    'Image Editing':      'design-tools',
    'Design Systems':     'design-tools',
    'Dev Tools':          'developer-tools',
    'APIs':               'api',
    'Open Source':        'open-source',
    'Testing':            'developer-tools',
    'DevOps':             'devops',
    'Security':           'security',
    'Databases':          'databases',
    'AI Writing':         'artificial-intelligence',
    'AI Image':           'artificial-intelligence',
    'AI Code':            'artificial-intelligence',
    'AI Chat':            'artificial-intelligence',
    'Machine Learning':   'machine-learning',
    'AI Analytics':       'artificial-intelligence',
    'SEO Tools':          'seo',
    'Email Marketing':    'email',
    'Social Media':       'social-media',
    'CRM':                'crm',
    'Analytics':          'analytics',
    'Advertising':        'marketing',
    'Storefronts':        'e-commerce',
    'Payments':           'payments',
    'Dropshipping':       'e-commerce',
    'Subscriptions':      'subscriptions',
    'Inventory':          'e-commerce',
    'Online Courses':     'education',
    'Language Learning':  'education',
    'Coding Education':   'education',
    'Kids Learning':      'education',
    'Accounting':         'fintech',
    'Investing':          'fintech',
    'Crypto':             'crypto',
    'Budgeting':          'fintech',
    'Podcasting':         'podcasting',
    'Newsletter':         'email',
    'Video Hosting':      'video',
    'Streaming':          'media',
    'Cloud':              'developer-tools',
    'Monitoring':         'devops',
    'Auth & Identity':    'security',
    'Storage':            'developer-tools',
}

# ─── Category → list of subcategories ─────────────────────────
CATEGORY_SUBCATEGORIES = {
    'productivity':    ['Task Management', 'Note Taking', 'Time Tracking', 'Automation', 'No-Code', 'Remote Work', 'Team Collaboration'],
    'design':          ['UI/UX Tools', 'Prototyping', 'Icon & Assets', 'Video Editing', 'Image Editing', 'Design Systems'],
    'development':     ['Dev Tools', 'APIs', 'Open Source', 'Testing', 'DevOps', 'Security', 'Databases'],
    'ai':              ['AI Writing', 'AI Image', 'AI Code', 'AI Chat', 'Machine Learning', 'AI Analytics'],
    'marketing':       ['SEO Tools', 'Email Marketing', 'Social Media', 'CRM', 'Analytics', 'Advertising'],
    'e-commerce':      ['Storefronts', 'Payments', 'Dropshipping', 'Subscriptions', 'Inventory'],
    'education':       ['Online Courses', 'Language Learning', 'Coding Education', 'Kids Learning'],
    'finance':         ['Accounting', 'Investing', 'Crypto', 'Budgeting'],
    'media':           ['Podcasting', 'Newsletter', 'Video Hosting', 'Streaming'],
    'infrastructure':  ['Cloud', 'Monitoring', 'Auth & Identity', 'Storage'],
    'freelance':       ['Task Management', 'Time Tracking', 'Automation', 'No-Code'],
}

# ─── Topics to search across for keyword queries ──────────────
SEARCH_TOPICS = [
    'productivity', 'artificial-intelligence', 'developer-tools',
    'design-tools', 'marketing', 'saas', 'e-commerce', 'education',
    'fintech', 'media', 'no-code', 'analytics', 'security',
    'social-media', 'email',
]

FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=320&fit=crop'


# ─── GraphQL query builders ────────────────────────────────────
def _topic_query(topic_slug, first=50, after=None):
    after_str = f', after: "{after}"' if after else ''
    return f"""
    {{
      posts(topic: "{topic_slug}", first: {first}{after_str}, order: VOTES) {{
        pageInfo {{ hasNextPage endCursor }}
        edges {{
          node {{
            id name tagline description url
            votesCount reviewsCount reviewsRating
            website createdAt featuredAt
            thumbnail {{ url }}
            topics {{ edges {{ node {{ name slug }} }} }}
          }}
        }}
      }}
    }}
    """

def _featured_query(first=50, after=None):
    after_str = f', after: "{after}"' if after else ''
    return f"""
    {{
      posts(first: {first}{after_str}, order: VOTES, postedAfter: "2022-01-01T00:00:00Z") {{
        pageInfo {{ hasNextPage endCursor }}
        edges {{
          node {{
            id name tagline description url
            votesCount reviewsCount reviewsRating
            website createdAt featuredAt
            thumbnail {{ url }}
            topics {{ edges {{ node {{ name slug }} }} }}
          }}
        }}
      }}
    }}
    """


# ─── GraphQL request helper ────────────────────────────────────
def _ph_request(gql_query):
    if not PH_API_KEY:
        raise ValueError('PRODUCT_HUNT_API_KEY not set')
    headers = {
        'Authorization': f'Bearer {PH_API_KEY}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    try:
        resp = req.post(PH_URL, json={'query': gql_query}, headers=headers, timeout=15)
        data = resp.json()
        if 'errors' in data:
            # THIS IS IMPORTANT: Print the actual error message from PH
            log.error(f"GraphQL Error: {data['errors'][0].get('message')}")
            return None
        return data
    except Exception as e:
        log.error(f"Network/Request Error: {e}")
        return None


# ─── Fetch all pages for a topic (up to max_pages * 50) ────────
def _fetch_all_pages(topic_slug=None, max_pages=1):
    all_posts = []
    cursor = None
    for _ in range(max_pages):
        if topic_slug:
            gql = _topic_query(topic_slug, first=20, after=cursor)
        else:
            gql = _featured_query(first=20, after=cursor)

        data = _ph_request(gql)
        if not data:
            break

        posts_data = data.get('data', {}).get('posts', {})
        edges = posts_data.get('edges', [])
        page_info = posts_data.get('pageInfo', {})

        for edge in edges:
            parsed = _parse_post(edge.get('node'))
            if parsed:
                all_posts.append(parsed)

        if not page_info.get('hasNextPage'):
            break
        cursor = page_info.get('endCursor')
        if not cursor:
            break

        time.sleep(0.3)  # rate limit courtesy delay

    return all_posts


# ─── Category helpers ──────────────────────────────────────────
TOPIC_CATEGORY_MAP = {
    'developer-tools': 'Development',
    'design-tools': 'Design',
    'productivity': 'Productivity',
    'artificial-intelligence': 'AI Tools',
    'machine-learning': 'AI Tools',
    'marketing': 'Marketing',
    'e-commerce': 'E-Commerce',
    'education': 'Education',
    'finance': 'Finance',
    'fintech': 'Finance',
    'media': 'Media',
    'saas': 'Productivity',
    'no-code': 'Productivity',
    'analytics': 'Marketing',
    'security': 'Infrastructure',
    'devops': 'Infrastructure',
    'api': 'Development',
    'open-source': 'Development',
    'writing': 'Media',
    'podcasting': 'Media',
    'video': 'Media',
    'social-media': 'Marketing',
    'seo': 'Marketing',
    'email': 'Marketing',
    'crm': 'Marketing',
    'crypto': 'Finance',
    'blockchain': 'Finance',
    'payments': 'Finance',
    'subscriptions': 'E-Commerce',
    'databases': 'Development',
    'remote-work': 'Productivity',
    'collaboration': 'Productivity',
}

def _get_category(topics):
    for edge in (topics or []):
        slug = edge.get('node', {}).get('slug', '')
        if slug in TOPIC_CATEGORY_MAP:
            return TOPIC_CATEGORY_MAP[slug]
    return 'Other'

def _get_subcategory(topics):
    names = [e.get('node', {}).get('name', '') for e in (topics or [])]
    return names[0] if names else 'Digital Product'

def _get_tags(topics):
    return [e.get('node', {}).get('name', '') for e in (topics or [])][:5]


# ─── Parse a PH post node ──────────────────────────────────────
def _parse_post(node):
    if not node:
        return None
    name = node.get('name', '')
    if not name:
        return None

    topics_edges = node.get('topics', {}).get('edges', [])

    rating = node.get('reviewsRating')
    if not rating or rating == 0:
        votes = node.get('votesCount', 0)
        if votes >= 2000:   rating = 4.8
        elif votes >= 1000: rating = 4.6
        elif votes >= 500:  rating = 4.4
        elif votes >= 100:  rating = 4.2
        else:               rating = 4.0
    rating = round(min(5.0, max(3.5, float(rating))), 1)

    reviews  = node.get('reviewsCount', 0) or 0
    votes    = node.get('votesCount', 0) or 0
    price    = 'Free'

    thumbnail = node.get('thumbnail', {}) or {}
    image     = thumbnail.get('url', '') or FALLBACK_IMG
    website   = node.get('website', '') or node.get('url', '') or ''

    return {
        'id':          f"ph_{node.get('id', '')}",
        'name':        name,
        'tagline':     (node.get('tagline', '') or '')[:140],
        'description': (node.get('description', '') or '')[:500],
        'category':    _get_category(topics_edges),
        'subcategory': _get_subcategory(topics_edges),
        'tags':        _get_tags(topics_edges),
        'rating':      rating,
        'reviews':     reviews,
        'votes':       votes,
        'price':       price,
        'website':     website,
        'phUrl':       node.get('url', ''),
        'image':       image,
        'featured':    bool(node.get('featuredAt')),
        'createdAt':   node.get('createdAt', ''),
    }


# ─── Client-side keyword filter ────────────────────────────────
def _keyword_filter(posts, query):
    q = query.lower()
    scored = []
    for post in posts:
        score = 0
        name        = (post.get('name') or '').lower()
        tagline     = (post.get('tagline') or '').lower()
        tags        = ' '.join(post.get('tags') or []).lower()
        category    = (post.get('category') or '').lower()
        subcategory = (post.get('subcategory') or '').lower()
        description = (post.get('description') or '').lower()

        if q in name:        score += 10
        if q in tagline:     score += 6
        if q in tags:        score += 5
        if q in category:    score += 4
        if q in subcategory: score += 4
        if q in description: score += 2

        for word in q.split():
            if len(word) > 2:
                if word in name:    score += 3
                if word in tagline: score += 2
                if word in tags:    score += 2

        if score > 0:
            scored.append((score, post))

    scored.sort(key=lambda x: (-x[0], -x[1].get('votes', 0)))
    return [p for _, p in scored]


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════

@digital_bp.route('/api/digital/search', methods=['GET'])
def digital_search():
    q           = request.args.get('q', '', type=str).strip()
    category    = request.args.get('category', 'all', type=str).strip().lower()
    subcategory = request.args.get('subcategory', '', type=str).strip()
    price       = request.args.get('price', 'All', type=str).strip()
    sort        = request.args.get('sort', 'featured', type=str).strip()
    page        = request.args.get('page', 1, type=int)
    per_page    = min(request.args.get('per_page', 12, type=int), 20)

    if not PH_API_KEY:
        return jsonify({
            'error': 'PRODUCT_HUNT_API_KEY not set. Add it to backend/.env',
            'businesses': [], 'total': 0, 'page': 1, 'totalPages': 1
        }), 500

    ck = f"digital:{q}:{category}:{subcategory}:{price}:{sort}"
    cached = _cache_get(ck)

    if cached is not None:
        businesses = cached
        log.info(f'Digital cache hit: {len(businesses)} results')
    else:
        log.info(f'Digital search: q={q!r} cat={category!r} sub={subcategory!r}')

        if q:
            # Keyword search: fetch from multiple topics, filter client-side
            all_posts = []
            seen_ids = set()
            for topic in SEARCH_TOPICS[:6]:
                posts = _fetch_all_pages(topic_slug=topic, max_pages=3)
                for p in posts:
                    if p['id'] not in seen_ids:
                        seen_ids.add(p['id'])
                        all_posts.append(p)
            businesses = _keyword_filter(all_posts, q)
            if not businesses:
                businesses = all_posts

        elif subcategory and subcategory in SUBCATEGORY_TOPIC_MAP:
            topic_slug = SUBCATEGORY_TOPIC_MAP[subcategory]
            businesses = _fetch_all_pages(topic_slug=topic_slug, max_pages=8)

        elif category != 'all' and category in CATEGORY_TOPIC_MAP:
            topic_slug = CATEGORY_TOPIC_MAP[category]
            businesses = _fetch_all_pages(topic_slug=topic_slug, max_pages=8)

        else:
            businesses = _fetch_all_pages(topic_slug=None, max_pages=8)

        # Price filter
        if price and price != 'All':
            businesses = [b for b in businesses if b['price'] == price]

        # Sort
        if sort == 'highest_rated':
            businesses.sort(key=lambda b: b['rating'], reverse=True)
        elif sort == 'most_votes':
            businesses.sort(key=lambda b: b['votes'], reverse=True)
        elif sort == 'most_reviews':
            businesses.sort(key=lambda b: b['reviews'], reverse=True)
        elif sort == 'name':
            businesses.sort(key=lambda b: b['name'].lower())
        else:
            businesses.sort(key=lambda b: (not b['featured'], -b['votes']))

        # Deduplicate
        seen_names = set()
        deduped = []
        for b in businesses:
            n = b['name'].lower().strip()
            if n not in seen_names:
                seen_names.add(n)
                deduped.append(b)
        businesses = deduped

        _cache_set(ck, businesses)
        log.info(f'Digital fetched & cached {len(businesses)} results')

    total       = len(businesses)
    total_pages = max(1, math.ceil(total / per_page))
    page        = max(1, min(page, total_pages))
    items       = businesses[(page - 1) * per_page: page * per_page]

    return jsonify({
        'businesses': items,
        'total':      total,
        'page':       page,
        'perPage':    per_page,
        'totalPages': total_pages,
    })


@digital_bp.route('/api/digital/product/<product_id>', methods=['GET'])
def digital_product(product_id):
    """Fetch a single digital product from cache."""
    ck = f"digital_product:{product_id}"
    cached = _cache_get(ck)
    if cached:
        return jsonify(cached)

    with _cache_lock:
        for key, val in _cache.items():
            if key.startswith('digital:'):
                for b in val.get('data', []):
                    if b.get('id') == product_id:
                        _cache_set(ck, b)
                        return jsonify(b)

    return jsonify({'error': 'Product not found'}), 404


@digital_bp.route('/api/digital/categories', methods=['GET'])
def digital_categories():
    return jsonify({
        'categories':    list(CATEGORY_TOPIC_MAP.keys()),
        'subcategories': CATEGORY_SUBCATEGORIES,
    })


@digital_bp.route('/api/digital/health', methods=['GET'])
def digital_health():
    return jsonify({'status': 'ok', 'product_hunt_key_set': bool(PH_API_KEY)})