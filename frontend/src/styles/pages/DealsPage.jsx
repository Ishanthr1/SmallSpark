/**
 * DealsPage.jsx — Real deals from DiscountAPI + fallback curated deals
 * Fetches from backend /api/deals (proxies DiscountAPI). Uses placeholder deals when API key is not set.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Star, MapPin, ChevronLeft, ChevronRight, Tag, Sparkles,
    Clock, Gift, ArrowRight, Loader2, Scissors, Utensils,
    Flame, Award, Coffee, ShoppingBag, Ticket,
    Search, X, Wrench, Dumbbell, Tent
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/* Category-correlated fallback images when deal image fails to load (Unsplash) */
const CATEGORY_FALLBACK_IMAGES = {
    'Health & Beauty': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=480&h=320&fit=crop',
    'Food & Drink': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=480&h=320&fit=crop',
    'Activities': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=480&h=320&fit=crop',
    'Auto & Home': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=320&fit=crop',
};
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=480&h=320&fit=crop';

/* Page hero/promo content (not deal data) */
const PROMOS = [
    { id: 'p1', title: 'Support Local This Season', subtitle: 'Save up to 50% at small businesses near you', cta: 'Shop Local Deals', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=400&fit=crop' },
    { id: 'p2', title: 'Foodie Favorites Week', subtitle: 'Save big on the best local restaurants and cafes near you!', cta: 'View Food Deals', gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop' },
];

/* ─── Star rating (optional) ─────────────────────────────────── */
const Stars = ({ rating, count }) => {
    if (rating == null && count == null) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            {[1,2,3,4,5].map(i => (
                <Star key={i} size={12} fill={i <= Math.floor(rating || 0) ? '#f59e0b' : (i - 0.5 <= (rating || 0) ? '#f59e0b' : 'none')}
                    color="#f59e0b" style={{ opacity: i <= (rating || 0) ? 1 : 0.3 }} />
            ))}
            <span style={{ fontSize: '0.72rem', fontWeight: '600', marginLeft: '0.15rem' }}>{rating != null ? rating : '—'}</span>
            {count != null && count > 0 && <span style={{ fontSize: '0.68rem', color: '#999' }}>({count.toLocaleString()})</span>}
        </div>
    );
};

/* ─── Deal Card ────────────────────────────────────────────── */
const DealCard = ({ deal, th, onFav, isFav, compact, onDealClick }) => {
    const [imgErr, setImgErr] = useState(false);
    const handleClick = () => {
        if (onDealClick) onDealClick(deal);
    };
    const displayImage = imgErr
        ? (CATEGORY_FALLBACK_IMAGES[deal.category] || DEFAULT_FALLBACK_IMAGE)
        : deal.image;
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
            style={{ textDecoration: 'none', color: 'inherit', cursor: onDealClick ? 'pointer' : 'default' }}
        >
        <div style={{
            width: compact ? '220px' : '100%', minWidth: compact ? '220px' : 'auto',
            backgroundColor: th.cardBg, borderRadius: '12px', overflow: 'hidden',
            border: `1px solid ${th.border}`, transition: 'all 0.2s',
            cursor: 'pointer', flexShrink: 0,
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
            <div style={{ position: 'relative', height: compact ? '140px' : '180px', overflow: 'hidden', backgroundColor: th.badgeBg }}>
                <img src={displayImage}
                    alt={deal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" onError={() => setImgErr(true)} />
                {deal.popular && <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#16a34a', color: '#fff', fontSize: '0.6rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Gift size={10} /> Popular</div>}
                <button onClick={e => { e.stopPropagation(); onFav(deal.id) }} style={{ position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Heart size={15} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#666'} />
                </button>
            </div>
            <div style={{ padding: compact ? '0.6rem' : '0.8rem' }}>
                <p style={{ fontSize: '0.7rem', color: th.textSecondary, fontWeight: '500', marginBottom: '0.15rem' }}>{deal.name}</p>
                <h3 style={{ fontSize: compact ? '0.78rem' : '0.85rem', fontWeight: '600', color: th.text, margin: '0 0 0.3rem', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{deal.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.68rem', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '0.15rem' }}><MapPin size={10} />{deal.location?.split(',')[0]}</span>
                    {deal.distance && <span style={{ fontSize: '0.65rem', color: th.textMuted }}>↗ {deal.distance}</span>}
                </div>
                <Stars rating={deal.rating} count={deal.reviews} />
                <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {deal.originalPrice > 0 && <span style={{ fontSize: '0.72rem', color: th.textMuted, textDecoration: 'line-through' }}>${deal.originalPrice}</span>}
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: th.text }}>{deal.salePrice === 0 ? 'FREE' : `$${deal.salePrice}`}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>-{deal.discount}%</span>
                </div>
                {deal.code && deal.finalPrice > 0 && <div style={{ marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#16a34a' }}>${deal.finalPrice.toFixed(2)}</span>
                    <span style={{ fontSize: '0.65rem', color: th.textMuted, marginLeft: '0.2rem' }}>with code {deal.code}</span>
                </div>}
            </div>
        </div>
        </div>
    );
};

/* ─── Carousel ─────────────────────────────────────────────── */
const Carousel = ({ children, th }) => {
    const scrollRef = useRef(null);
    const [canL, setCanL] = useState(false);
    const [canR, setCanR] = useState(true);
    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanL(scrollLeft > 10); setCanR(scrollLeft + clientWidth < scrollWidth - 10);
    };
    useEffect(() => { checkScroll(); }, [children]);
    const scroll = (dir) => { if (!scrollRef.current) return; scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' }); setTimeout(checkScroll, 400); };
    return (
        <div style={{ position: 'relative' }}>
            {canL && <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', backgroundColor: th.cardBg, border: `1px solid ${th.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: th.text }}><ChevronLeft size={18} /></button>}
            <div ref={scrollRef} onScroll={checkScroll} style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0.3rem 0.1rem 0.5rem', scrollbarWidth: 'none' }}>{children}</div>
            {canR && <button onClick={() => scroll(1)} style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', backgroundColor: th.cardBg, border: `1px solid ${th.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: th.text }}><ChevronRight size={18} /></button>}
        </div>
    );
};

/* ─── Section Header ───────────────────────────────────────── */
const SectionHead = ({ th, icon: Icon, title, subtitle, action }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {Icon && <Icon size={20} color={th.accent} />}
            <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: th.text, margin: 0 }}>{title}</h2>
                {subtitle && <p style={{ fontSize: '0.75rem', color: th.textMuted, margin: '0.1rem 0 0' }}>{subtitle}</p>}
            </div>
        </div>
        {action && <button style={{ fontSize: '0.78rem', fontWeight: '600', color: th.accent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontFamily: "'Poppins', sans-serif" }}>See all <ChevronRight size={14} /></button>}
    </div>
);


/* ═══════════════════════════════════════════════════════════════
   MAIN DEALS CONTENT
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT_LOCATION = '40.5622,-111.9297'; // South Jordan, UT

const DealsContent = ({ th }) => {
    const navigate = useNavigate();
    const [favs, setFavs] = useState(new Set());
    const [dealSearch, setDealSearch] = useState('');
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [source, setSource] = useState('api');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchDeals = useCallback(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
            location: DEFAULT_LOCATION,
            radius: 15,
            per_page: 20,
            page: 1,
        });
        fetch(`${API}/deals?${params}`)
            .then(r => r.json())
            .then(data => {
                setLoading(false);
                if (data.error) {
                    setError(data.error);
                    setSource(data.source || 'api');
                    setDeals([]);
                } else {
                    setDeals(data.deals || []);
                    setSource(data.source || 'api');
                    setError(null);
                }
            })
            .catch(e => {
                setLoading(false);
                setError(e.message || 'Could not load deals.');
                setDeals([]);
            });
    }, []);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals, refreshKey]);

    const toggleFav = useCallback(id => {
        setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }, []);

    const searchFilter = (dealsList) => {
        if (!dealSearch.trim()) return dealsList;
        const q = dealSearch.toLowerCase();
        return dealsList.filter(d =>
            d.name.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            (d.location && d.location.toLowerCase().includes(q)) ||
            (d.subcategory && d.subcategory.toLowerCase().includes(q))
        );
    };

    const trendingDeals = searchFilter(deals.filter(d => d.popular)).slice(0, 12);
    const filteredDeals = searchFilter(deals);

    const handleDealClick = useCallback((deal) => {
        navigate(`/business/${encodeURIComponent(deal.name)}`, { state: { fromDeal: deal } });
    }, [navigate]);

    return (
        <div style={{ height: '100%', overflowY: 'auto', backgroundColor: th.bgAlt }}>
            {/* Hero */}
            <div style={{ background: PROMOS[0].gradient, position: 'relative', overflow: 'hidden', padding: '2.5rem 2rem', minHeight: '160px' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${PROMOS[0].image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50px', padding: '0.3rem 0.8rem', marginBottom: '0.8rem', fontSize: '0.72rem', color: '#fff', fontWeight: '600' }}><Sparkles size={13} /> Spark Deals</div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem', lineHeight: '1.2' }}>{PROMOS[0].title}</h1>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 1rem' }}>{PROMOS[0].subtitle}</p>
                    <button onClick={() => { setRefreshKey(k => k + 1); }} style={{ padding: '0.6rem 1.4rem', borderRadius: '10px', backgroundColor: '#fff', color: '#1a1a1a', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{PROMOS[0].cta} <ArrowRight size={16} /></button>
                </div>
            </div>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: th.textMuted }}>
                    <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Loading deals...</span>
                </div>
            )}

            {error && !loading && (
                <div style={{ padding: '0.8rem 2rem', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca', fontSize: '0.85rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={18} />
                    <span>{error}</span>
                </div>
            )}

            {!loading && (
            <>
            <div style={{ background: 'linear-gradient(90deg, #c2410c, #ea580c)', padding: '0.7rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: '600' }}>🍕 Foodie Favorites Week — Save up to 40% at the best local restaurants and cafes!</span>
                <ChevronRight size={16} color="#fff" />
            </div>

            <div style={{ padding: '1.5rem 2rem' }}>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.8rem', borderRadius: '12px', border: `1.5px solid ${th.border}`, backgroundColor: th.cardBg, marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <Search size={17} color={th.textMuted} />
                    <input value={dealSearch} onChange={e => setDealSearch(e.target.value)} placeholder="Search deals by name, business, location..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.88rem', fontFamily: "'Poppins', sans-serif", color: th.text, outline: 'none' }} />
                    {dealSearch && <button onClick={() => setDealSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.textMuted, display: 'flex', padding: '0.1rem' }}><X size={16} /></button>}
                </div>

                {dealSearch.trim() && <div style={{ marginBottom: '1rem', fontSize: '0.78rem', color: th.textMuted, fontWeight: '500' }}>{filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''} matching "{dealSearch}"</div>}

                {/* Trending */}
                {trendingDeals.length > 0 && <div style={{ marginBottom: '2rem' }}>
                    <SectionHead th={th} icon={Flame} title="Trending Near You" subtitle="South Jordan & surrounding areas" action />
                    <Carousel th={th}>{trendingDeals.map(deal => <DealCard key={deal.id} deal={deal} th={th} onFav={toggleFav} isFav={favs.has(deal.id)} compact onDealClick={handleDealClick} />)}</Carousel>
                </div>}

                {/* All deals grid */}
                <div style={{ marginBottom: '2rem' }}>
                    <SectionHead th={th} icon={Tag} title="All Deals" subtitle={`${filteredDeals.length} deals available`} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {filteredDeals.map(d => <DealCard key={d.id} deal={d} th={th} onFav={toggleFav} isFav={favs.has(d.id)} onDealClick={handleDealClick} />)}
                    </div>
                    {filteredDeals.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: th.textMuted }}>
                        <Tag size={40} style={{ opacity: 0.3, marginBottom: '0.8rem' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{dealSearch ? `No deals matching "${dealSearch}"` : error ? 'Could not load deals. Check your connection and backend configuration.' : 'No deals available for this area right now.'}</p>
                    </div>}
                </div>

                {/* Bottom promo */}
                <div style={{ background: PROMOS[1].gradient, borderRadius: '16px', padding: '2rem', position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${PROMOS[1].image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: '0 0 0.4rem' }}>{PROMOS[1].title}</h2>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 1rem' }}>{PROMOS[1].subtitle}</p>
                        <button style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#fff', color: '#1a1a1a', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', fontFamily: "'Poppins', sans-serif" }}>{PROMOS[1].cta}</button>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
};

export default DealsContent;