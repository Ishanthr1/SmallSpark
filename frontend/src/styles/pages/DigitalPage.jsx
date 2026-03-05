/**
 * DigitalPage.jsx — Digital Business Discovery via Product Hunt API
 * - Hover subcategory menus on each category (like DiscoveryPage)
 * - Click on a card opens DigitalBusinessPage.jsx detail view
 * - Search fixed (client-side filtering, no broken PH 'search' arg)
 * - Pagination fetches up to 400 results per category
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Search, X, Star, Heart, Globe, ExternalLink, ChevronLeft, ChevronRight,
    ChevronDown, Loader2, AlertCircle, RefreshCw, Filter, Monitor,
    Zap, Palette, Code, ShoppingCart, BookOpen, TrendingUp, Video,
    Database, DollarSign, Cpu, ArrowUpRight, ThumbsUp,
    FileText, Users, Settings, BarChart2, Shield, Layout,
    Mic, Music, PenTool, Package, Mail, CreditCard, Clock,
    ToggleLeft, Terminal, GitBranch, TestTube, Server, Cloud,
    Bot, Image, Headphones, Briefcase, Film, Rss, Globe2, Lock
} from 'lucide-react';
import DigitalBusinessPage from './DigitalBusinessPage.jsx';

const API = 'http://localhost:5000/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=320&fit=crop';

const light = {
    bg: '#fff', bgAlt: '#f9f9f9', text: '#1a1a1a', textSecondary: '#555',
    textMuted: '#999', border: '#e8e8e8', cardBg: '#fff', accent: '#1a1a1a',
    accentText: '#fff', hoverBg: '#f0f0f0', activeBg: '#e8e8e8',
    badgeBg: '#f0f0f0', inputBg: '#f5f5f5', dropdownBg: '#fff',
    categoryBar: '#fafafa', categoryBorder: '#eee',
};
const dark = {
    bg: '#0a0a0a', bgAlt: '#0f0f0f', text: '#f0f0f0', textSecondary: '#aaa',
    textMuted: '#666', border: '#222', cardBg: '#141414', accent: '#f0f0f0',
    accentText: '#0a0a0a', hoverBg: '#1a1a1a', activeBg: '#222',
    badgeBg: '#1e1e1e', inputBg: '#141414', dropdownBg: '#161616',
    categoryBar: '#111', categoryBorder: '#222',
};

/* ─── Category definitions with subcategories ─────────────────── */
const CATEGORIES = [
    {
        id: 'all', label: 'All', icon: Globe,
        subs: []
    },
    {
        id: 'productivity', label: 'Productivity', icon: Zap,
        subs: [
            { name: 'Task Management', icon: FileText },
            { name: 'Time Tracking',   icon: Clock },
            { name: 'Note Taking',     icon: PenTool },
            { name: 'Calendars',       icon: BarChart2 },
            { name: 'Project Mgmt',    icon: Layout },
            { name: 'Team Collab',     icon: Users },
            { name: 'No-Code',         icon: ToggleLeft },
            { name: 'Automation',      icon: Settings },
        ]
    },
    {
        id: 'design', label: 'Design', icon: Palette,
        subs: [
            { name: 'UI/UX Tools',    icon: Layout },
            { name: 'Logo & Branding',icon: Palette },
            { name: 'Illustration',   icon: PenTool },
            { name: 'Prototyping',    icon: Monitor },
            { name: 'Stock Assets',   icon: Image },
            { name: 'Video Editing',  icon: Film },
            { name: '3D Tools',       icon: Package },
            { name: 'Color Tools',    icon: Palette },
        ]
    },
    {
        id: 'development', label: 'Development', icon: Code,
        subs: [
            { name: 'Code Editors', icon: Terminal },
            { name: 'APIs & SDKs',  icon: GitBranch },
            { name: 'DevOps',       icon: Server },
            { name: 'Testing',      icon: TestTube },
            { name: 'Open Source',  icon: Globe2 },
            { name: 'Databases',    icon: Database },
            { name: 'Cloud',        icon: Cloud },
            { name: 'CLI Tools',    icon: Terminal },
        ]
    },
    {
        id: 'ai', label: 'AI Tools', icon: Cpu,
        subs: [
            { name: 'AI Writing',      icon: FileText },
            { name: 'AI Art',          icon: Image },
            { name: 'AI Coding',       icon: Code },
            { name: 'AI Chat',         icon: Bot },
            { name: 'Machine Learning',icon: Cpu },
            { name: 'AI Productivity', icon: Zap },
            { name: 'AI Video',        icon: Film },
            { name: 'AI Music',        icon: Music },
        ]
    },
    {
        id: 'e-commerce', label: 'E-Commerce', icon: ShoppingCart,
        subs: [
            { name: 'Online Stores',   icon: ShoppingCart },
            { name: 'Dropshipping',    icon: Package },
            { name: 'Payments',        icon: CreditCard },
            { name: 'Inventory',       icon: Database },
            { name: 'Marketplaces',    icon: Globe2 },
            { name: 'Print on Demand', icon: FileText },
        ]
    },
    {
        id: 'marketing', label: 'Marketing', icon: TrendingUp,
        subs: [
            { name: 'SEO Tools',      icon: Search },
            { name: 'Email Marketing',icon: Mail },
            { name: 'Social Media',   icon: Users },
            { name: 'Analytics',      icon: BarChart2 },
            { name: 'CRM',            icon: Briefcase },
            { name: 'Ad Tools',       icon: TrendingUp },
            { name: 'Content Mktg',   icon: FileText },
            { name: 'Affiliate',      icon: Globe2 },
        ]
    },
    {
        id: 'education', label: 'Education', icon: BookOpen,
        subs: [
            { name: 'Online Courses', icon: BookOpen },
            { name: 'Language Learn', icon: Globe2 },
            { name: 'Kids Learning',  icon: Users },
            { name: 'Coding Edu',     icon: Code },
            { name: 'Tutoring',       icon: Users },
            { name: 'Flashcards',     icon: FileText },
        ]
    },
    {
        id: 'media', label: 'Media', icon: Video,
        subs: [
            { name: 'Podcasting',    icon: Mic },
            { name: 'Newsletters',   icon: Rss },
            { name: 'Video Hosting', icon: Video },
            { name: 'Live Streaming',icon: Film },
            { name: 'Music Tools',   icon: Headphones },
            { name: 'Publishing',    icon: FileText },
        ]
    },
    {
        id: 'finance', label: 'Finance', icon: DollarSign,
        subs: [
            { name: 'Personal Finance', icon: CreditCard },
            { name: 'Crypto',           icon: DollarSign },
            { name: 'Invoicing',        icon: FileText },
            { name: 'Accounting',       icon: BarChart2 },
            { name: 'Investing',        icon: TrendingUp },
            { name: 'Budgeting',        icon: DollarSign },
        ]
    },
    {
        id: 'infrastructure', label: 'Infrastructure', icon: Database,
        subs: [
            { name: 'Web Hosting', icon: Server },
            { name: 'DNS & CDN',   icon: Globe2 },
            { name: 'Monitoring',  icon: BarChart2 },
            { name: 'Security',    icon: Lock },
            { name: 'Serverless',  icon: Cloud },
        ]
    },
    {
        id: 'freelance', label: 'Freelance', icon: Briefcase,
        subs: [
            { name: 'Freelance Jobs', icon: Briefcase },
            { name: 'Portfolios',     icon: Layout },
            { name: 'Client Mgmt',    icon: Users },
            { name: 'Proposals',      icon: FileText },
            { name: 'Contracts',      icon: Shield },
            { name: 'Time Billing',   icon: Clock },
        ]
    },
];

const PRICE_FILTERS = ['All', 'Free', 'Freemium', 'Subscription', 'One-time', 'Paid'];
const SORT_OPTIONS  = [
    { value: 'featured',      label: 'Featured' },
    { value: 'most_votes',    label: 'Most Upvoted' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'most_reviews',  label: 'Most Reviews' },
    { value: 'name',          label: 'Name A–Z' },
];

const priceColor = price => ({
    'Free':         '#16a34a',
    'Freemium':     '#2563eb',
    'Subscription': '#7c3aed',
    'One-time':     '#d97706',
    'Paid':         '#dc2626',
}[price] || '#666');

async function apiFetch(url) {
    let resp;
    try { resp = await fetch(url); }
    catch { throw new Error('Cannot connect to server. Make sure the backend is running.'); }
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

/* ─── Category Bar with hover subcategories ────────────────── */
const CatBar = ({ th, selectedCat, selectedSub, onSelectCat, onSelectSub }) => {
    const [hovered, setHovered] = useState(null);
    const timerRef = useRef(null);

    return (
        <div style={{
            backgroundColor: th.categoryBar,
            borderBottom: `1px solid ${th.categoryBorder}`,
            position: 'relative', zIndex: 60, flexShrink: 0,
        }}>
            <div style={{ display: 'flex', padding: '0.35rem 1rem', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {CATEGORIES.map(cat => {
                    const isOpen = hovered === cat.id;
                    const isActive = selectedCat === cat.id;
                    const Icon = cat.icon;

                    return (
                        <div key={cat.id} style={{ position: 'relative', flexShrink: 0 }}
                            onMouseEnter={() => { clearTimeout(timerRef.current); setHovered(cat.id); }}
                            onMouseLeave={() => { timerRef.current = setTimeout(() => setHovered(null), 200); }}
                        >
                            <button onClick={() => { onSelectCat(cat.id); onSelectSub(null); setHovered(null); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                    padding: '0.7rem 0.8rem', fontSize: '0.8rem',
                                    fontWeight: isActive ? '600' : '500',
                                    color: (isActive || isOpen) ? th.text : th.textSecondary,
                                    backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                                    fontFamily: "'Poppins',sans-serif", whiteSpace: 'nowrap',
                                    borderBottom: isActive ? `2px solid ${th.accent}` : '2px solid transparent',
                                    transition: '0.12s',
                                }}
                            >
                                <Icon size={13} strokeWidth={1.5} />
                                {cat.label}
                                {cat.subs.length > 0 && (
                                    <ChevronDown size={11} style={{ transform: isOpen ? 'rotate(180deg)' : '', transition: '0.2s' }} />
                                )}
                            </button>

                            {/* Subcategory dropdown */}
                            {isOpen && cat.subs.length > 0 && (
                                <div
                                    onMouseEnter={() => { clearTimeout(timerRef.current); setHovered(cat.id); }}
                                    onMouseLeave={() => { timerRef.current = setTimeout(() => setHovered(null), 200); }}
                                    style={{
                                        position: 'absolute', top: '100%', left: 0,
                                        backgroundColor: th.dropdownBg, border: `1px solid ${th.border}`,
                                        borderRadius: '12px', padding: '0.65rem',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
                                        zIndex: 1, minWidth: '320px',
                                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '0.08rem',
                                    }}
                                >
                                    {cat.subs.map(sub => {
                                        const SubIcon = sub.icon;
                                        const subActive = selectedSub === sub.name;
                                        return (
                                            <button key={sub.name}
                                                onClick={() => {
                                                    onSelectCat(cat.id);
                                                    onSelectSub(subActive ? null : sub.name);
                                                    setHovered(null);
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    padding: '0.45rem 0.55rem', borderRadius: '7px', border: 'none',
                                                    cursor: 'pointer', backgroundColor: subActive ? th.activeBg : 'transparent',
                                                    fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem',
                                                    fontWeight: subActive ? '600' : '450',
                                                    color: subActive ? th.text : th.textSecondary,
                                                    transition: '0.1s', textAlign: 'left', width: '100%',
                                                }}
                                                onMouseEnter={e => { if (!subActive) { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text; }}}
                                                onMouseLeave={e => { if (!subActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary; }}}
                                            >
                                                <SubIcon size={14} strokeWidth={1.5} />
                                                <span>{sub.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Digital Business Card ────────────────────────────────── */
const DigitalCard = ({ biz, th, isFav, onFav, onClick }) => {
    const [imgErr, setImgErr] = useState(false);
    return (
        <div
            onClick={() => onClick(biz)}
            style={{
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
                        <span style={{ fontSize: '0.65rem', color: '#da552f', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
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

/* ─── Pagination ────────────────────────────────────────────── */
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

    const [businesses, setBusinesses]     = useState([]);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
    const [hasSearched, setHasSearched]   = useState(false);

    const [query, setQuery]               = useState('');
    const [category, setCategory]         = useState('all');
    const [subcategory, setSubcategory]   = useState(null);
    const [priceFilter, setPriceFilter]   = useState('All');
    const [sortBy, setSortBy]             = useState('featured');
    const [showFilters, setShowFilters]   = useState(false);

    const [page, setPage]                 = useState(1);
    const [totalPages, setTotalPages]     = useState(1);
    const [total, setTotal]               = useState(0);

    const [favs, setFavs]                 = useState(new Set());
    const [selectedBiz, setSelectedBiz]   = useState(null);

    const lastParams = useRef({});
    const searchTimer = useRef(null);

    const toggleFav = useCallback(id => {
        setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }, []);

    /* ─── Core search ─────────────────────────────────────── */
    const doSearch = useCallback(async (opts = {}) => {
        const q    = opts.query      !== undefined ? opts.query    : query;
        const cat  = opts.category   !== undefined ? opts.category : category;
        const sub  = opts.subcategory!== undefined ? opts.subcategory : subcategory;
        const price = opts.price     !== undefined ? opts.price    : priceFilter;
        const sort = opts.sort       !== undefined ? opts.sort     : sortBy;
        const pg   = opts.page       !== undefined ? opts.page     : 1;

        lastParams.current = { q, cat, sub, price, sort, pg };
        setLoading(true); setError(''); setHasSearched(true);

        try {
            const params = new URLSearchParams({
                q: q || '',
                category: cat || 'all',
                subcategory: sub || '',
                price: price || 'All',
                sort: sort || 'featured',
                page: pg,
                per_page: 12,
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
    }, [query, category, subcategory, priceFilter, sortBy]);

    /* ─── Re-search when filters change ──────────────────── */
    useEffect(() => {
        if (!hasSearched) return;
        doSearch({ category, subcategory, price: priceFilter, sort: sortBy, page: 1 });
    }, [category, subcategory, priceFilter, sortBy]); // eslint-disable-line

    /* ─── Debounced search on query ────────────────────────── */
    const handleQueryChange = e => {
        const v = e.target.value;
        setQuery(v);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => doSearch({ query: v, page: 1 }), 400);
    };

    const handleCatSelect = cat => {
        setCategory(cat);
        setSubcategory(null);
    };
    const handleSubSelect = sub => {
        setSubcategory(sub);
    };

    const handlePage = p => doSearch({ page: p });

    const retry = () => {
        const lp = lastParams.current;
        doSearch({ query: lp.q, category: lp.cat, subcategory: lp.sub, price: lp.price, sort: lp.sort, page: lp.pg });
    };

    const hasFilters = category !== 'all' || subcategory || priceFilter !== 'All' || query;
    const clearFilters = () => {
        setQuery(''); setCategory('all'); setSubcategory(null);
        setPriceFilter('All'); setSortBy('featured');
        doSearch({ query: '', category: 'all', subcategory: null, price: 'All', sort: 'featured', page: 1 });
    };

    /* ─── If a biz is selected, show detail page ────────────── */
    if (selectedBiz) {
        return (
            <DigitalBusinessPage
                biz={selectedBiz}
                isDark={isDark}
                onBack={() => setSelectedBiz(null)}
            />
        );
    }

    const catLabel = CATEGORIES.find(c => c.id === category)?.label || 'All';

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            backgroundColor: th.bg, fontFamily: "'Poppins',-apple-system,sans-serif", color: th.text,
        }}>
            {/* ── Category bar with subcategory hovers ──────── */}
            <CatBar
                th={th}
                selectedCat={category}
                selectedSub={subcategory}
                onSelectCat={handleCatSelect}
                onSelectSub={handleSubSelect}
            />

            {/* ── Search + controls ─────────────────────────── */}
            <div style={{
                display: 'flex', gap: '0.5rem', alignItems: 'center',
                padding: '0.6rem 1rem', borderBottom: `1px solid ${th.border}`,
                backgroundColor: th.bg, flexShrink: 0,
            }}>
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

            {/* ── Filter panel ────────────────────────────── */}
            {showFilters && (
                <div style={{ padding: '0.8rem 1rem', borderBottom: `1px solid ${th.border}`, backgroundColor: th.bgAlt, flexShrink: 0 }}>
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

            {/* ── Active filter chips ──────────────────────── */}
            {(subcategory || (category !== 'all')) && (
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.4rem 1rem', borderBottom: `1px solid ${th.border}`, backgroundColor: th.bg, flexShrink: 0, flexWrap: 'wrap' }}>
                    {category !== 'all' && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.72rem', fontWeight: '600', color: th.text,
                            backgroundColor: th.activeBg, padding: '0.2rem 0.6rem',
                            borderRadius: '50px', cursor: 'pointer',
                        }} onClick={() => { setCategory('all'); setSubcategory(null); }}>
                            {catLabel} <X size={11} />
                        </span>
                    )}
                    {subcategory && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.72rem', fontWeight: '600', color: th.text,
                            backgroundColor: th.badgeBg, padding: '0.2rem 0.6rem',
                            borderRadius: '50px', border: `1px solid ${th.border}`, cursor: 'pointer',
                        }} onClick={() => setSubcategory(null)}>
                            {subcategory} <X size={11} />
                        </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: th.textMuted }}>
                        Powered by <span style={{ color: '#da552f', fontWeight: '600' }}>Product Hunt</span>
                    </span>
                </div>
            )}

            {/* ── Results meta bar ────────────────────────── */}
            {hasSearched && !loading && !error && !subcategory && category === 'all' && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 1rem', borderBottom: `1px solid ${th.border}`,
                    backgroundColor: th.bg, flexShrink: 0,
                }}>
                    <Monitor size={13} color={th.textMuted} />
                    <span style={{ fontSize: '0.75rem', color: th.textMuted }}>
                        <span style={{ fontWeight: '600', color: th.text }}>{total}</span> digital products
                        {query && <> for "<span style={{ fontWeight: '600', color: th.text }}>{query}</span>"</>}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: th.textMuted }}>
                        Powered by <span style={{ color: '#da552f', fontWeight: '600' }}>Product Hunt</span>
                    </span>
                </div>
            )}

            {/* ── Main content ─────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* Empty state */}
                {!hasSearched && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: th.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Monitor size={36} color={th.textMuted} style={{ opacity: 0.5 }} />
                        </div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: th.text, marginBottom: '0.4rem' }}>Discover Digital Businesses</h2>
                        <p style={{ fontSize: '0.84rem', color: th.textMuted, lineHeight: '1.5', maxWidth: '280px', marginBottom: '1.5rem' }}>
                            Browse SaaS tools, platforms, dev tools, AI apps and more — all 100% online
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
                                <p style={{ fontSize: '0.82rem', color: th.textMuted, marginBottom: '1rem' }}>Try a different search or clear your filters</p>
                                <button onClick={clearFilters} style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', backgroundColor: th.accent, color: th.accentText, border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif" }}>
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ padding: '0.4rem 1rem', fontSize: '0.72rem', color: th.textMuted, borderBottom: `1px solid ${th.border}`, backgroundColor: th.bg }}>
                                    <span style={{ fontWeight: '600', color: th.text }}>{total}</span> results
                                    {subcategory && <> in <span style={{ fontWeight: '600', color: th.text }}>{subcategory}</span></>}
                                    {!subcategory && category !== 'all' && <> in <span style={{ fontWeight: '600', color: th.text }}>{catLabel}</span></>}
                                    <span style={{ float: 'right' }}>Page {page}/{totalPages}</span>
                                </div>
                                {businesses.map(biz => (
                                    <DigitalCard
                                        key={biz.id}
                                        biz={biz}
                                        th={th}
                                        isFav={favs.has(biz.id)}
                                        onFav={toggleFav}
                                        onClick={setSelectedBiz}
                                    />
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