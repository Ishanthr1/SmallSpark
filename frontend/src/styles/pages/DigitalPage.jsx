/**
 * DigitalPage.jsx — Digital Business Discovery via Product Hunt API
 *
 * Calls /api/digital/search on the Flask backend, which proxies
 * Product Hunt's GraphQL API. Same UX patterns as Discover tab.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Search, X, Star, Heart, Globe, ExternalLink, ChevronLeft, ChevronRight,
    ChevronDown, Loader2, AlertCircle, RefreshCw, Filter, Monitor,
    Zap, Palette, Code, ShoppingCart, BookOpen, TrendingUp, Video,
    Users, Database, DollarSign, Cpu, ArrowUpRight, ThumbsUp
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=320&fit=crop';

/* ─── Theme (matches DashboardPage) ───────────────────────── */
const light = {
    bg: '#fff', bgAlt: '#f9f9f9', text: '#1a1a1a', textSecondary: '#555',
    textMuted: '#999', border: '#e8e8e8', cardBg: '#fff', accent: '#1a1a1a',
    accentText: '#fff', hoverBg: '#f0f0f0', activeBg: '#e8e8e8',
    badgeBg: '#f0f0f0', inputBg: '#f5f5f5', dropdownBg: '#fff',
};
const dark = {
    bg: '#0a0a0a', bgAlt: '#0f0f0f', text: '#f0f0f0', textSecondary: '#aaa',
    textMuted: '#666', border: '#222', cardBg: '#141414', accent: '#f0f0f0',
    accentText: '#0a0a0a', hoverBg: '#1a1a1a', activeBg: '#222',
    badgeBg: '#1e1e1e', inputBg: '#141414', dropdownBg: '#161616',
};

/* ─── Categories ───────────────────────────────────────────── */
const CATEGORIES = [
    { id: 'all',            label: 'All',           icon: Globe },
    { id: 'productivity',   label: 'Productivity',  icon: Zap },
    { id: 'design',         label: 'Design',        icon: Palette },
    { id: 'development',    label: 'Development',   icon: Code },
    { id: 'e-commerce',     label: 'E-Commerce',    icon: ShoppingCart },
    { id: 'education',      label: 'Education',     icon: BookOpen },
    { id: 'marketing',      label: 'Marketing',     icon: TrendingUp },
    { id: 'media',          label: 'Media',         icon: Video },
    { id: 'ai',             label: 'AI Tools',      icon: Cpu },
    { id: 'finance',        label: 'Finance',       icon: DollarSign },
    { id: 'infrastructure', label: 'Infrastructure',icon: Database },
];

const PRICE_FILTERS  = ['All', 'Free', 'Freemium', 'Subscription', 'One-time', 'Paid'];
const SORT_OPTIONS   = [
    { value: 'featured',      label: 'Featured' },
    { value: 'most_votes',    label: 'Most Upvoted' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'most_reviews',  label: 'Most Reviews' },
    { value: 'name',          label: 'Name A–Z' },
];

/* ─── Helpers ──────────────────────────────────────────────── */
const priceColor = price => ({
    'Free':         '#16a34a',
    'Freemium':     '#2563eb',
    'Subscription': '#7c3aed',
    'One-time':     '#d97706',
    'Paid':         '#dc2626',
}[price] || '#666');

async function apiFetch(url) {
    let resp;
    try {
        resp = await fetch(url);
    } catch {
        throw new Error('Cannot connect to server. Make sure the backend is running.');
    }
    const data = await resp.json().catch(() => null);
    if (!data) throw new Error('Invalid server response');
    if (data.error) throw new Error(data.error);
    return data;
}

/* ─── Stars ────────────────────────────────────────────────── */
const Stars = ({ rating, size = 12, th }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.18rem' }}>
        {[1,2,3,4,5].map(s => (
            <Star key={s} size={size}
                fill={s <= Math.round(rating) ? '#f59e0b' : 'none'}
                color="#f59e0b"
                style={{ opacity: s <= Math.ceil(rating) ? 1 : 0.3 }}
            />
        ))}
        <span style={{ fontSize: `${size * 0.83}px`, fontWeight: '700', color: th.text, marginLeft: '0.15rem' }}>
            {rating}
        </span>
    </div>
);

/* ─── Business Card ────────────────────────────────────────── */
const DigitalCard = ({ biz, th, isFav, onFav }) => {
    const [imgErr, setImgErr] = useState(false);
    return (
        <div style={{
            display: 'flex', gap: '0.85rem', padding: '0.9rem',
            borderBottom: `1px solid ${th.border}`,
            transition: '0.15s', cursor: 'pointer',
        }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = th.hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            {/* Thumbnail */}
            <div style={{
                width: '190px', minWidth: '190px', height: '130px',
                borderRadius: '8px', overflow: 'hidden',
                backgroundColor: th.badgeBg, flexShrink: 0,
            }}>
                <img
                    src={imgErr ? FALLBACK_IMG : (biz.image || FALLBACK_IMG)}
                    alt={biz.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                    onError={() => setImgErr(true)}
                />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Name row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginBottom: '0.2rem' }}>
                    <h3 style={{ fontSize: '0.93rem', fontWeight: '600', color: th.text, margin: 0, lineHeight: '1.2' }}>
                        {biz.name}
                    </h3>
                    {biz.featured && (
                        <span style={{
                            fontSize: '0.58rem', fontWeight: '700', color: '#fff',
                            backgroundColor: '#da552f', padding: '0.1rem 0.35rem',
                            borderRadius: '4px', flexShrink: 0, marginTop: '1px',
                        }}>PH Featured</span>
                    )}
                    <button
                        onClick={e => { e.stopPropagation(); onFav(biz.id); }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', flexShrink: 0 }}
                    >
                        <Heart size={17} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : th.textMuted} />
                    </button>
                </div>

                {/* Tagline */}
                <p style={{
                    fontSize: '0.78rem', color: th.textSecondary, margin: '0 0 0.3rem',
                    lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{biz.tagline}</p>

                {/* Tags */}
                {biz.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                        {biz.tags.slice(0, 4).map(t => (
                            <span key={t} style={{
                                fontSize: '0.62rem', padding: '0.08rem 0.35rem', borderRadius: '4px',
                                border: `1px solid ${th.border}`, color: th.textSecondary,
                            }}>{t}</span>
                        ))}
                    </div>
                )}

                {/* Rating + votes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <Stars rating={biz.rating} th={th} />
                    {biz.reviews > 0 && (
                        <span style={{ fontSize: '0.65rem', color: th.textMuted }}>
                            ({biz.reviews.toLocaleString()} reviews)
                        </span>
                    )}
                    {biz.votes > 0 && (
                        <span style={{
                            fontSize: '0.65rem', color: '#da552f',
                            display: 'flex', alignItems: 'center', gap: '0.2rem',
                        }}>
                            <ThumbsUp size={10} /> {biz.votes.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Bottom row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: '0.7rem', fontWeight: '700',
                        color: priceColor(biz.price),
                        backgroundColor: priceColor(biz.price) + '18',
                        padding: '0.15rem 0.45rem', borderRadius: '4px',
                    }}>{biz.price}</span>
                    <span style={{ fontSize: '0.65rem', color: th.textMuted }}>{biz.subcategory}</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {biz.phUrl && (
                            <a href={biz.phUrl} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ fontSize: '0.66rem', color: '#da552f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
                                PH <ArrowUpRight size={10} />
                            </a>
                        )}
                        {biz.website && (
                            <a href={biz.website} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ fontSize: '0.7rem', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
                                <Globe size={11} /> Visit <ExternalLink size={10} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Category Bar ─────────────────────────────────────────── */
const CatBar = ({ th, selected, onSelect }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.1rem',
        padding: '0.35rem 1rem', borderBottom: `1px solid ${th.border}`,
        backgroundColor: th.bg, overflowX: 'auto', flexShrink: 0,
        scrollbarWidth: 'none',
    }}>
        {CATEGORIES.map(c => {
            const active = selected === c.id;
            const Icon = c.icon;
            return (
                <button key={c.id} onClick={() => onSelect(c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.6rem 0.75rem', borderRadius: '0', border: 'none',
                    backgroundColor: 'transparent',
                    color: active ? th.text : th.textSecondary,
                    fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem',
                    fontWeight: active ? '600' : '450', cursor: 'pointer',
                    whiteSpace: 'nowrap', transition: '0.12s',
                    borderBottom: active ? `2px solid ${th.accent}` : '2px solid transparent',
                }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = th.text; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = th.textSecondary; } }}
                >
                    <Icon size={14} strokeWidth={1.5} />
                    {c.label}
                </button>
            );
        })}
    </div>
);

/* ─── Pagination ───────────────────────────────────────────── */
const Pager = ({ page, total, onPage, th }) => {
    if (total <= 1) return null;
    const pages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(total, page + 2); i++) pages.push(i);
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.8rem', borderTop: `1px solid ${th.border}` }}>
            <button disabled={page <= 1} onClick={() => onPage(page - 1)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${th.border}`, backgroundColor: 'transparent', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted, opacity: page <= 1 ? 0.3 : 1 }}><ChevronLeft size={16} /></button>
            {pages.map(p => (
                <button key={p} onClick={() => onPage(p)} style={{ minWidth: '32px', height: '32px', borderRadius: '6px', border: p === page ? 'none' : `1px solid ${th.border}`, backgroundColor: p === page ? th.accent : 'transparent', color: p === page ? th.accentText : th.text, cursor: 'pointer', fontWeight: p === page ? '700' : '500', fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif" }}>{p}</button>
            ))}
            <button disabled={page >= total} onClick={() => onPage(page + 1)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${th.border}`, backgroundColor: 'transparent', cursor: page >= total ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted, opacity: page >= total ? 0.3 : 1 }}><ChevronRight size={16} /></button>
        </div>
    );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const DigitalPage = ({ isDark = true }) => {
    const th = isDark ? dark : light;

    const [businesses, setBusinesses]   = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const [query, setQuery]             = useState('');
    const [category, setCategory]       = useState('all');
    const [priceFilter, setPriceFilter] = useState('All');
    const [sortBy, setSortBy]           = useState('featured');
    const [showFilters, setShowFilters] = useState(false);

    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [total, setTotal]             = useState(0);

    const [favs, setFavs]               = useState(new Set());

    const lastParams = useRef({});
    const searchTimer = useRef(null);

    const toggleFav = useCallback(id => {
        setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }, []);

    /* ─── Core search function ─────────────────────────────── */
    const doSearch = useCallback(async (opts = {}) => {
        const q    = opts.query    ?? query;
        const cat  = opts.category ?? category;
        const price = opts.price   ?? priceFilter;
        const sort = opts.sort     ?? sortBy;
        const pg   = opts.page     ?? 1;

        lastParams.current = { q, cat, price, sort, pg };

        setLoading(true);
        setError('');
        setHasSearched(true);

        try {
            const params = new URLSearchParams({
                q, category: cat, price, sort, page: pg, per_page: 12
            });
            const data = await apiFetch(`${API}/digital/search?${params}`);
            setBusinesses(data.businesses || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setPage(data.page || 1);
        } catch (e) {
            setError(e.message);
            setBusinesses([]);
        }
        setLoading(false);
    }, [query, category, priceFilter, sortBy]);

    /* ─── Auto-search on category / price / sort change ────── */
    useEffect(() => {
        if (!hasSearched) return;
        doSearch({ category, price: priceFilter, sort: sortBy, page: 1 });
    }, [category, priceFilter, sortBy]); // eslint-disable-line

    /* ─── Debounced search on query typing ─────────────────── */
    const handleQueryChange = e => {
        const v = e.target.value;
        setQuery(v);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            doSearch({ query: v, page: 1 });
        }, 400);
    };

    const handlePage = p => doSearch({ page: p });

    const retry = () => {
        const lp = lastParams.current;
        doSearch({ query: lp.q, category: lp.cat, price: lp.price, sort: lp.sort, page: lp.pg });
    };

    const hasFilters = category !== 'all' || priceFilter !== 'All' || query;
    const clearFilters = () => {
        setQuery(''); setCategory('all'); setPriceFilter('All'); setSortBy('featured');
        doSearch({ query: '', category: 'all', price: 'All', sort: 'featured', page: 1 });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: th.bg, fontFamily: "'Poppins',-apple-system,sans-serif", color: th.text }}>

            {/* ── Category bar ─────────────────────────────── */}
            <CatBar th={th} selected={category} onSelect={cat => setCategory(cat)} />

            {/* ── Search + controls bar ─────────────────────── */}
            <div style={{
                display: 'flex', gap: '0.5rem', alignItems: 'center',
                padding: '0.6rem 1rem', borderBottom: `1px solid ${th.border}`,
                backgroundColor: th.bg, flexShrink: 0,
            }}>
                {/* Search input */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    backgroundColor: th.inputBg, borderRadius: '10px',
                    padding: '0.45rem 0.65rem', border: `1.5px solid ${th.border}`, flex: 1,
                }}>
                    <Search size={15} color={th.textMuted} />
                    <input
                        value={query}
                        onChange={handleQueryChange}
                        onKeyDown={e => e.key === 'Enter' && doSearch({ page: 1 })}
                        placeholder="Search digital tools, SaaS, platforms..."
                        style={{
                            flex: 1, border: 'none', background: 'transparent',
                            fontSize: '0.84rem', fontFamily: "'Poppins',sans-serif",
                            color: th.text, outline: 'none',
                        }}
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); doSearch({ query: '', page: 1 }); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.textMuted, display: 'flex', padding: 0 }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Sort dropdown */}
                <div style={{ position: 'relative' }}>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                        padding: '0.47rem 1.8rem 0.47rem 0.7rem', borderRadius: '10px',
                        border: `1.5px solid ${th.border}`, backgroundColor: th.inputBg,
                        color: th.text, fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif",
                        cursor: 'pointer', outline: 'none', appearance: 'none',
                    }}>
                        {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown size={12} color={th.textMuted} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                {/* Filters toggle */}
                <button onClick={() => setShowFilters(!showFilters)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.47rem 0.8rem', borderRadius: '10px',
                    border: `1.5px solid ${showFilters ? th.accent : th.border}`,
                    backgroundColor: showFilters ? th.activeBg : 'transparent',
                    color: showFilters ? th.text : th.textSecondary,
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500',
                    fontFamily: "'Poppins',sans-serif",
                }}>
                    <Filter size={14} /> Filters
                    {hasFilters && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />}
                </button>

                {hasFilters && (
                    <button onClick={clearFilters} style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.47rem 0.7rem', borderRadius: '10px',
                        border: `1.5px solid ${th.border}`, backgroundColor: 'transparent',
                        color: th.textMuted, cursor: 'pointer', fontSize: '0.76rem',
                        fontFamily: "'Poppins',sans-serif",
                    }}>
                        <X size={13} /> Clear
                    </button>
                )}
            </div>

            {/* ── Filter panel ─────────────────────────────── */}
            {showFilters && (
                <div style={{
                    padding: '0.8rem 1rem', borderBottom: `1px solid ${th.border}`,
                    backgroundColor: th.bgAlt, flexShrink: 0,
                }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '600', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Pricing Model</p>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {PRICE_FILTERS.map(p => (
                            <button key={p} onClick={() => setPriceFilter(p)} style={{
                                padding: '0.25rem 0.6rem', borderRadius: '50px', fontSize: '0.74rem',
                                fontFamily: "'Poppins',sans-serif", cursor: 'pointer',
                                border: `1px solid ${priceFilter === p ? 'transparent' : th.border}`,
                                backgroundColor: priceFilter === p ? th.accent : 'transparent',
                                color: priceFilter === p ? th.accentText : th.textSecondary,
                                fontWeight: priceFilter === p ? '600' : '450', transition: '0.12s',
                            }}>{p}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Results meta bar ─────────────────────────── */}
            {hasSearched && !loading && !error && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 1rem', borderBottom: `1px solid ${th.border}`,
                    backgroundColor: th.bg, flexShrink: 0,
                }}>
                    <Monitor size={13} color={th.textMuted} />
                    <span style={{ fontSize: '0.75rem', color: th.textMuted }}>
                        <span style={{ fontWeight: '600', color: th.text }}>{total}</span> digital products
                        {query && <> for "<span style={{ fontWeight: '600', color: th.text }}>{query}</span>"</>}
                        {category !== 'all' && <> in <span style={{ fontWeight: '600', color: th.text }}>{CATEGORIES.find(c => c.id === category)?.label}</span></>}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Powered by <span style={{ color: '#da552f', fontWeight: '600' }}>Product Hunt</span>
                    </span>
                </div>
            )}

            {/* ── Main content area ────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* Empty state — before first search */}
                {!hasSearched && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            backgroundColor: th.badgeBg, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', marginBottom: '1.5rem',
                        }}>
                            <Monitor size={36} color={th.textMuted} style={{ opacity: 0.5 }} />
                        </div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: th.text, marginBottom: '0.4rem' }}>
                            Discover Digital Businesses
                        </h2>
                        <p style={{ fontSize: '0.84rem', color: th.textMuted, lineHeight: '1.5', maxWidth: '280px', marginBottom: '1.5rem' }}>
                            Search for SaaS tools, platforms, marketplaces, dev tools, and more — all 100% online businesses
                        </p>
                        <button onClick={() => doSearch({ page: 1 })} style={{
                            padding: '0.55rem 1.4rem', borderRadius: '10px',
                            backgroundColor: th.accent, color: th.accentText, border: 'none',
                            cursor: 'pointer', fontWeight: '600', fontSize: '0.86rem',
                            fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: '0.35rem',
                        }}>
                            <Monitor size={15} /> Browse all digital products
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.8rem' }}>
                        <Loader2 size={30} color={th.textMuted} style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: '0.85rem', color: th.textMuted }}>Searching Product Hunt...</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
                        <AlertCircle size={34} color="#ef4444" style={{ marginBottom: '0.8rem', opacity: 0.6 }} />
                        <p style={{ fontSize: '0.88rem', color: th.text, fontWeight: '500', marginBottom: '0.3rem' }}>Something went wrong</p>
                        <p style={{ fontSize: '0.78rem', color: th.textMuted, maxWidth: '360px', lineHeight: '1.5' }}>{error}</p>
                        <button onClick={retry} style={{
                            marginTop: '1rem', padding: '0.45rem 1.2rem', borderRadius: '8px',
                            border: `1.5px solid ${th.border}`, backgroundColor: 'transparent',
                            color: th.text, cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem',
                            fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: '0.3rem',
                        }}><RefreshCw size={14} /> Try again</button>
                    </div>
                )}

                {/* Results */}
                {hasSearched && !loading && !error && (
                    <>
                        {businesses.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                                <Monitor size={44} color={th.textMuted} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: th.text, marginBottom: '0.3rem' }}>No results found</h3>
                                <p style={{ fontSize: '0.82rem', color: th.textMuted, marginBottom: '1rem' }}>Try a different search term or clear your filters</p>
                                <button onClick={clearFilters} style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', backgroundColor: th.accent, color: th.accentText, border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif" }}>
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <>
                                {businesses.map(biz => (
                                    <DigitalCard key={biz.id} biz={biz} th={th} isFav={favs.has(biz.id)} onFav={toggleFav} />
                                ))}
                                <Pager page={page} total={totalPages} onPage={handlePage} th={th} />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DigitalPage;