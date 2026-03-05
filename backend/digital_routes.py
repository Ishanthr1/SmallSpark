"""
backend/digital_routes.py

Product Hunt API integration for digital business search.

SETUP:
1. Go to https://www.producthunt.com/v2/oauth/applications
2. Create a new application (free)
3. Copy your API key (Developer Token)
4. Add to backend/.env:
      PRODUCT_HUNT_API_KEY=your_token_here
5. In app.py, add at the top:
      from digital_routes import digital_bp
      app.register_blueprint(digital_bp)
"""

import os, time, threading, math, logging
import requests as req
from flask import Blueprint, request, jsonify

log = logging.getLogger('spark.digital')

digital_bp = Blueprint('digital', __name__)

PH_API_KEY = os.environ.get('PRODUCT_HUNT_API_KEY', '')
PH_URL = 'https://api.producthunt.com/v2/api/graphql'

# ─── Cache (reuse the same pattern as app.py) ──────────────────
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 600  # 10 minutes

def _cache_get(key):
    with _cache_lock:
        if key in _cache and time.time() - _cache[key]['ts'] < CACHE_TTL:
            return _cache[key]['data']
    return None

def _cache_set(key, data):
    with _cache_lock:
        _cache[key] = {'data': data, 'ts': time.time()}


# ─── Category → Product Hunt topic slug mapping ────────────────
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

FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=320&fit=crop'


# ─── GraphQL query builders ────────────────────────────────────
def _search_query(query, first=100, after=None):
    after_str = f', after: "{after}"' if after else ''
    return f"""
    {{
      posts(search: "{query}", first: {first}{after_str}, order: VOTES) {{
        pageInfo {{ hasNextPage endCursor }}
        edges {{
          node {{
            id
            name
            tagline
            description
            url
            votesCount
            reviewsCount
            reviewsRating
            website
            createdAt
            featuredAt
            thumbnail {{ url }}
            topics {{
              edges {{ node {{ name slug }} }}
            }}
          }}
        }}
      }}
    }}
    """

def _topic_query(topic_slug, first=20, after=None):
    after_str = f', after: "{after}"' if after else ''
    return f"""
    {{
      posts(topic: "{topic_slug}", first: {first}{after_str}, order: VOTES) {{
        pageInfo {{ hasNextPage endCursor }}
        edges {{
          node {{
            id
            name
            tagline
            description
            url
            votesCount
            reviewsCount
            reviewsRating
            website
            createdAt
            featuredAt
            thumbnail {{ url }}
            topics {{
              edges {{ node {{ name slug }} }}
            }}
          }}
        }}
      }}
    }}
    """

def _featured_query(first=20):
    return f"""
    {{
      posts(first: {first}, order: VOTES, postedAfter: "2022-01-01T00:00:00Z") {{
        pageInfo {{ hasNextPage endCursor }}
        edges {{
          node {{
            id
            name
            tagline
            description
            url
            votesCount
            reviewsCount
            reviewsRating
            website
            createdAt
            featuredAt
            thumbnail {{ url }}
            topics {{
              edges {{ node {{ name slug }} }}
            }}
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
        resp = req.post(
            PH_URL,
            json={'query': gql_query},
            headers=headers,
            timeout=15
        )
        resp.raise_for_status()
        data = resp.json()
        if 'errors' in data:
            log.error(f'PH GraphQL errors: {data["errors"]}')
            if not data.get('data'):
                return None
        return data
    except Exception as e:
        log.error(f'Product Hunt request error: {e}')
        return None


# ─── Map pricing offering → readable label ─────────────────────
def _map_price(offering):
    if not offering:
        return 'Unknown'
    o = offering.upper()
    if 'FREE' in o and 'PAID' in o:
        return 'Freemium'
    if o == 'FREE':
        return 'Free'
    if 'SUBSCRIPTION' in o or 'MONTHLY' in o:
        return 'Subscription'
    if 'ONE_TIME' in o or 'ONETIME' in o:
        return 'One-time'
    if 'PAID' in o:
        return 'Paid'
    return 'Free'


# ─── Map topics → our category system ─────────────────────────
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
    'health': 'Other',
    'gaming': 'Other',
    'crypto': 'Finance',
    'blockchain': 'Finance',
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
    return [e.get('node', {}).get('name', '') for e in (topics or [])][:4]


# ─── Parse a Product Hunt post node → our business dict ────────
def _parse_post(node):
    if not node:
        return None
    name = node.get('name', '')
    if not name:
        return None

    topics_edges = node.get('topics', {}).get('edges', [])

    # Rating: PH uses reviewsRating (0–5) or fall back to votes-based estimate
    rating = node.get('reviewsRating')
    if not rating or rating == 0:
        votes = node.get('votesCount', 0)
        # Estimate a rating from votes (more votes = higher implied quality)
        if votes >= 2000:   rating = 4.8
        elif votes >= 1000: rating = 4.6
        elif votes >= 500:  rating = 4.4
        elif votes >= 100:  rating = 4.2
        else:               rating = 4.0
    rating = round(min(5.0, max(3.5, float(rating))), 1)

    reviews = node.get('reviewsCount', 0) or 0
    votes = node.get('votesCount', 0) or 0

    # pricing field not available in PH API v2 - default to Free
    price = 'Free'

    thumbnail = node.get('thumbnail', {}) or {}
    image = thumbnail.get('url', '') or FALLBACK_IMG

    website = node.get('website', '') or node.get('url', '') or ''

    return {
        'id': f"ph_{node.get('id', '')}",
        'name': name,
        'tagline': (node.get('tagline', '') or '')[:140],
        'description': (node.get('description', '') or '')[:300],
        'category': _get_category(topics_edges),
        'subcategory': _get_subcategory(topics_edges),
        'tags': _get_tags(topics_edges),
        'rating': rating,
        'reviews': reviews,
        'votes': votes,
        'price': price,
        'website': website,
        'phUrl': node.get('url', ''),
        'image': image,
        'featured': bool(node.get('featuredAt')),
        'createdAt': node.get('createdAt', ''),
    }


# ─── Extract posts from GraphQL response ───────────────────────
def _extract_posts(data, query_key='posts'):
    if not data:
        return [], None
    posts_data = data.get('data', {}).get(query_key, {})
    edges = posts_data.get('edges', [])
    page_info = posts_data.get('pageInfo', {})
    results = []
    for edge in edges:
        parsed = _parse_post(edge.get('node'))
        if parsed:
            results.append(parsed)
    return results, page_info.get('endCursor')


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════

@digital_bp.route('/api/digital/search', methods=['GET'])
def digital_search():
    q        = request.args.get('q', '', type=str).strip()
    category = request.args.get('category', 'all', type=str).strip().lower()
    price    = request.args.get('price', 'All', type=str).strip()
    sort     = request.args.get('sort', 'featured', type=str).strip()
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 12, type=int), 20)

    if not PH_API_KEY:
        return jsonify({
            'error': 'PRODUCT_HUNT_API_KEY not set. Add it to backend/.env',
            'businesses': [], 'total': 0, 'page': 1, 'totalPages': 1
        }), 500

    ck = f"digital:{q}:{category}:{price}:{sort}"
    cached = _cache_get(ck)

    if cached is not None:
        businesses = cached
        log.info(f'Digital cache hit: {len(businesses)} results')
    else:
        log.info(f'Digital search: q={q!r} cat={category!r} price={price!r}')
        data = None

        if q:
            data = _ph_request(_search_query(q, first=20))
            businesses, _ = _extract_posts(data, 'posts')
        elif category != 'all' and category in CATEGORY_TOPIC_MAP:
            topic_slug = CATEGORY_TOPIC_MAP[category]
            data = _ph_request(_topic_query(topic_slug, first=20))
            businesses, _ = _extract_posts(data, 'posts')
        else:
            data = _ph_request(_featured_query(first=20))
            businesses, _ = _extract_posts(data, 'posts')

        if data is None:
            return jsonify({
                'error': 'Could not reach Product Hunt API. Check your API key.',
                'businesses': [], 'total': 0, 'page': 1, 'totalPages': 1
            }), 502

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
            # featured first, then by votes
            businesses.sort(key=lambda b: (not b['featured'], -b['votes']))

        _cache_set(ck, businesses)
        log.info(f'Digital fetched & cached {len(businesses)} results')

    # Paginate
    total = len(businesses)
    total_pages = max(1, math.ceil(total / per_page))
    page = max(1, min(page, total_pages))
    items = businesses[(page - 1) * per_page: page * per_page]

    return jsonify({
        'businesses': items,
        'total': total,
        'page': page,
        'perPage': per_page,
        'totalPages': total_pages,
    })


@digital_bp.route('/api/digital/categories', methods=['GET'])
def digital_categories():
    """Returns available Product Hunt topic slugs for the category bar."""
    return jsonify({'categories': list(CATEGORY_TOPIC_MAP.keys())})


@digital_bp.route('/api/digital/health', methods=['GET'])
def digital_health():
    has_key = bool(PH_API_KEY)
    return jsonify({'status': 'ok', 'product_hunt_key_set': has_key})