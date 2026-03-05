/**
 * DigitalBusinessPage.jsx — Full detail page for a digital/online business
 * Optimized for SaaS, tools, and online products (not physical locations)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import {
    ChevronLeft, Star, Heart, Share2, Bookmark, Globe, ExternalLink,
    ThumbsUp, Award, Loader2, AlertCircle, X, Check, Copy,
    Sun, Moon, ArrowUpRight, Tag, Zap, Shield, Users, Code,
    DollarSign, Clock, Calendar, Sparkles, ChevronDown, ChevronUp,
    Edit3, Facebook, Twitter, Mail, Link2, Monitor, Cpu,
    MessageSquare, BookOpen, TrendingUp, CheckCircle
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop';

/* ─── Theme ────────────────────────────────────────────────── */
const light = {
    bg: '#fff', bgAlt: '#f9f9f9', text: '#1a1a1a',
    textSecondary: '#555', textMuted: '#999', border: '#e8e8e8',
    cardBg: '#fff', accent: '#1a1a1a', accentText: '#fff',
    hoverBg: '#f0f0f0', activeBg: '#e8e8e8', badgeBg: '#f0f0f0',
    inputBg: '#f5f5f5', redAccent: '#d32323', greenAccent: '#16a34a',
    heroOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)',
    modalOverlay: 'rgba(0,0,0,0.6)', modalBg: '#fff',
    phOrange: '#da552f',
};
const dark = {
    bg: '#0a0a0a', bgAlt: '#0f0f0f', text: '#f0f0f0',
    textSecondary: '#aaa', textMuted: '#666', border: '#222',
    cardBg: '#141414', accent: '#f0f0f0', accentText: '#0a0a0a',
    hoverBg: '#1a1a1a', activeBg: '#222', badgeBg: '#1e1e1e',
    inputBg: '#141414', redAccent: '#ef4444', greenAccent: '#22c55e',
    heroOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)',
    modalOverlay: 'rgba(0,0,0,0.8)', modalBg: '#1a1a1a',
    phOrange: '#ff6154',
};

/* ─── Price color ──────────────────────────────────────────── */
const priceColor = price => ({
    'Free': '#16a34a', 'Freemium': '#2563eb',
    'Subscription': '#7c3aed', 'One-time': '#d97706', 'Paid': '#dc2626',
}[price] || '#666');

/* ─── Star Rating ──────────────────────────────────────────── */
const StarRating = ({ rating, size = 14, showNumber = true, count, th }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
        {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={size}
                fill={s <= Math.round(rating) ? '#f59e0b' : 'none'}
                color="#f59e0b"
                style={{ opacity: s <= Math.ceil(rating) ? 1 : 0.3 }}
            />
        ))}
        {showNumber && <span style={{ fontSize: `${size * 0.78}px`, fontWeight: '700', color: th.text, marginLeft: '0.2rem' }}>{rating}</span>}
        {count != null && <span style={{ fontSize: `${size * 0.7}px`, color: th.textMuted, marginLeft: '0.1rem' }}>({count.toLocaleString()} reviews)</span>}
    </div>
);

/* ─── Modal Backdrop ───────────────────────────────────────── */
const ModalBackdrop = ({ th, onClose, children }) => (
    <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: th.modalOverlay, backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem', animation: 'fadeIn 0.2s ease',
    }}>
        <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
);

/* ─── Share Modal ──────────────────────────────────────────── */
const ShareModal = ({ name, th, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = window.location.href;
    const copy = async () => {
        try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    };
    return (
        <ModalBackdrop th={th} onClose={onClose}>
            <div style={{ width: '420px', maxWidth: '95vw', backgroundColor: th.modalBg, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', borderBottom: `1px solid ${th.border}` }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: th.text, margin: 0 }}>Share {name}</h3>
                    <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${th.border}`, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted }}><X size={16} /></button>
                </div>
                <div style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '10px', backgroundColor: th.inputBg, border: `1px solid ${th.border}`, marginBottom: '1rem' }}>
                        <Link2 size={16} color={th.textMuted} />
                        <span style={{ flex: 1, fontSize: '0.78rem', color: th.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
                        <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem', borderRadius: '8px', backgroundColor: copied ? th.greenAccent : th.accent, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.76rem', fontFamily: "'Poppins', sans-serif" }}>
                            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        {[
                            { label: 'Twitter/X', color: th.text, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${name}!`)}&url=${encodeURIComponent(shareUrl)}` },
                            { label: 'Facebook', color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                            { label: 'Email', color: '#ea4335', url: `mailto:?subject=${encodeURIComponent(`Check out ${name}`)}&body=${encodeURIComponent(shareUrl)}` },
                        ].map(o => (
                            <a key={o.label} href={o.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.8rem', borderRadius: '10px', border: `1px solid ${th.border}`, textDecoration: 'none', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = th.hoverBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: o.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: '800' }}>
                                    {o.label[0]}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: th.textSecondary }}>{o.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </ModalBackdrop>
    );
};

/* ─── Write Review Modal ───────────────────────────────────── */
const WriteReviewModal = ({ name, th, onClose, onSubmit }) => {
    const [hov, setHov] = useState(0);
    const [sel, setSel] = useState(0);
    const [text, setText] = useState('');
    const [done, setDone] = useState(false);
    const labels = ['', 'Not good', 'Could be better', "It's okay", 'Great', 'Excellent!'];

    const submit = () => {
        if (sel === 0 || text.trim().length < 10) return;
        onSubmit({ rating: sel, text: text.trim() });
        setDone(true);
        setTimeout(onClose, 1500);
    };

    if (done) return (
        <ModalBackdrop th={th} onClose={onClose}>
            <div style={{ width: '360px', backgroundColor: th.modalBg, borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Check size={28} color="#16a34a" /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: th.text }}>Review posted!</h3>
            </div>
        </ModalBackdrop>
    );

    return (
        <ModalBackdrop th={th} onClose={onClose}>
            <div style={{ width: '500px', maxWidth: '95vw', backgroundColor: th.modalBg, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', borderBottom: `1px solid ${th.border}` }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: th.text, margin: 0 }}>{name}</h3>
                    <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${th.border}`, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted }}><X size={16} /></button>
                </div>
                <div style={{ padding: '1.5rem 1.2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            {[1,2,3,4,5].map(s => (
                                <button key={s} onMouseEnter={() => setHov(s)} onMouseLeave={() => setHov(0)} onClick={() => setSel(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', transform: (hov || sel) >= s ? 'scale(1.15)' : 'scale(1)', transition: '0.15s' }}>
                                    <Star size={34} fill={(hov || sel) >= s ? '#f59e0b' : 'none'} color={(hov || sel) >= s ? '#f59e0b' : th.border} strokeWidth={1.5} />
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.8rem', fontWeight: '600', minHeight: '1.2rem', color: (hov || sel) > 0 ? th.text : th.textMuted }}>{labels[hov || sel] || 'Select a rating'}</p>
                    </div>
                    <textarea value={text} onChange={e => setText(e.target.value)}
                        placeholder={`How has ${name} helped you? What do you like or dislike?`}
                        style={{ width: '100%', minHeight: '140px', padding: '0.8rem', borderRadius: '10px', border: `1.5px solid ${th.border}`, backgroundColor: th.inputBg, color: th.text, fontSize: '0.86rem', fontFamily: "'Poppins', sans-serif", resize: 'vertical', outline: 'none', lineHeight: '1.6' }}
                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                        onBlur={e => e.target.style.borderColor = th.border}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: `1.5px solid ${th.border}`, backgroundColor: 'transparent', color: th.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', fontFamily: "'Poppins', sans-serif" }}>Cancel</button>
                        <button onClick={submit} disabled={sel === 0 || text.trim().length < 10} style={{ padding: '0.5rem 1.2rem', borderRadius: '10px', border: 'none', backgroundColor: (sel > 0 && text.trim().length >= 10) ? th.phOrange : th.badgeBg, color: (sel > 0 && text.trim().length >= 10) ? '#fff' : th.textMuted, cursor: (sel > 0 && text.trim().length >= 10) ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '0.82rem', fontFamily: "'Poppins', sans-serif" }}>Post Review</button>
                    </div>
                </div>
            </div>
        </ModalBackdrop>
    );
};

/* ─── Review Card ──────────────────────────────────────────── */
const ReviewCard = ({ review, th }) => (
    <div style={{ padding: '1.2rem 0', borderBottom: `1px solid ${th.border}` }}>
        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `hsl(${review.name.charCodeAt(0) * 7 % 360}, 45%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>{review.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.86rem', color: th.text }}>{review.name}</div>
                <div style={{ fontSize: '0.7rem', color: th.textMuted }}>{review.role}</div>
            </div>
            {review.isNew && <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#fff', backgroundColor: th.greenAccent, padding: '0.15rem 0.5rem', borderRadius: '50px' }}>New</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <StarRating rating={review.rating} size={12} showNumber={false} th={th} />
            <span style={{ fontSize: '0.7rem', color: th.textMuted }}>{review.date}</span>
        </div>
        <p style={{ fontSize: '0.84rem', color: th.textSecondary, lineHeight: '1.65', margin: '0 0 0.5rem' }}>{review.text}</p>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.22rem 0.5rem', borderRadius: '6px', border: `1px solid ${th.border}`, backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.68rem', color: th.textMuted, fontFamily: "'Poppins', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textMuted }}>
            <ThumbsUp size={11} /> Helpful {review.helpful > 0 && review.helpful}
        </button>
    </div>
);

/* ─── Generate fake reviews for the product ───────────────── */
function generateReviews(product) {
    const reviewers = [
        { name: 'Alex M.', role: 'Software Engineer' },
        { name: 'Sarah K.', role: 'Product Manager' },
        { name: 'Jordan T.', role: 'Startup Founder' },
        { name: 'Priya L.', role: 'Designer' },
        { name: 'Chris W.', role: 'Marketing Lead' },
        { name: 'Dana R.', role: 'Freelancer' },
    ];
    const positiveTexts = [
        `${product.name} has completely transformed how I work. The interface is intuitive and the features are exactly what I needed. Highly recommend to anyone looking for a solid tool!`,
        `I've tried many similar tools but ${product.name} stands out. The team clearly thought through every detail. Worth every penny if you upgrade.`,
        `Amazing product! I use it daily and it saves me hours every week. The customer support is also excellent when I've had questions.`,
        `Game changer for our team. Onboarding was a breeze and the results were immediately noticeable. Can't imagine working without it now.`,
    ];
    const count = Math.min(5, Math.max(3, Math.floor((product.reviews || 20) / 20)));
    return Array.from({ length: count }, (_, i) => {
        const r = reviewers[i % reviewers.length];
        const rating = i === count - 1 && (product.rating || 4) < 4.5 ? 3 : (Math.random() > 0.25 ? 5 : 4);
        const daysAgo = Math.floor(Math.random() * 90) + 5;
        const date = new Date(Date.now() - daysAgo * 86400000);
        return {
            id: `r${i}`, name: r.name, role: r.role, rating,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            text: positiveTexts[i % positiveTexts.length],
            helpful: Math.floor(Math.random() * 8),
            isNew: i === 0,
        };
    });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
const DigitalBusinessPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isDark, setDark] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [showAllReviews, setShowAllReviews] = useState(false);

    const th = isDark ? dark : light;

    /* ─── Fetch product ──────────────────────────────────── */
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                // Try direct product endpoint first
                const resp = await fetch(`${API}/digital/product/${encodeURIComponent(id)}`);
                const data = await resp.json();
                if (data.product) {
                    setProduct(data.product);
                    setReviews(generateReviews(data.product));
                } else {
                    throw new Error(data.error || 'Product not found');
                }
            } catch (e) {
                // Fallback: search for it
                try {
                    const name = decodeURIComponent(id).replace('ph_', '');
                    const resp = await fetch(`${API}/digital/search?q=${encodeURIComponent(name)}&per_page=5`);
                    const data = await resp.json();
                    const found = data.businesses?.find(b => b.id === id || b.id === decodeURIComponent(id));
                    if (found) {
                        setProduct(found);
                        setReviews(generateReviews(found));
                    } else if (data.businesses?.length > 0) {
                        setProduct(data.businesses[0]);
                        setReviews(generateReviews(data.businesses[0]));
                    } else {
                        setError('Product not found');
                    }
                } catch (e2) {
                    setError(e2.message);
                }
            }
            setLoading(false);
        };
        if (id) load();
    }, [id]);

    const handleReviewSubmit = ({ rating, text }) => {
        const newReview = {
            id: `user_r_${Date.now()}`,
            name: user?.fullName || user?.firstName || 'You',
            role: 'Verified User',
            rating, text,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            helpful: 0,
            isNew: true,
        };
        setReviews(prev => [newReview, ...prev]);
    };

    /* ─── Rating distribution ────────────────────────────── */
    const ratingDist = () => {
        if (!product) return [0,0,0,0,0];
        const r = product.rating || 4, total = product.reviews || 50;
        if (r >= 4.5) return [Math.round(total*0.68), Math.round(total*0.20), Math.round(total*0.06), Math.round(total*0.03), Math.round(total*0.03)];
        if (r >= 4.0) return [Math.round(total*0.45), Math.round(total*0.28), Math.round(total*0.15), Math.round(total*0.08), Math.round(total*0.04)];
        return [Math.round(total*0.28), Math.round(total*0.25), Math.round(total*0.22), Math.round(total*0.15), Math.round(total*0.10)];
    };
    const dist = ratingDist();
    const maxDist = Math.max(...dist, 1);

    /* ─── Loading ────────────────────────────────────────── */
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: th.bg, fontFamily: "'Poppins', sans-serif" }}>
            <Loader2 size={36} color={th.textMuted} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p style={{ color: th.textMuted, fontSize: '0.88rem' }}>Loading product details...</p>
        </div>
    );

    if (error || !product) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: th.bg, fontFamily: "'Poppins', sans-serif", padding: '2rem' }}>
            <AlertCircle size={44} color={th.redAccent} style={{ marginBottom: '1rem', opacity: 0.6 }} />
            <h2 style={{ color: th.text, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Product not found</h2>
            <p style={{ color: th.textMuted, fontSize: '0.84rem', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1.2rem', borderRadius: '10px', backgroundColor: th.accent, color: th.accentText, border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: "'Poppins', sans-serif", fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ChevronLeft size={15} /> Back to Dashboard
            </button>
        </div>
    );

    const productFeatures = [
        { icon: Globe, label: 'Web-based platform' },
        { icon: Shield, label: 'Secure & private' },
        { icon: Users, label: 'Team collaboration' },
        { icon: Zap, label: 'Fast & reliable' },
        { icon: Code, label: 'API available' },
        { icon: Monitor, label: 'Cross-platform' },
    ];

    return (
        <div style={{ fontFamily: "'Poppins', -apple-system, sans-serif", backgroundColor: th.bg, color: th.text, minHeight: '100vh' }}>

            {/* Modals */}
            {showShareModal && <ShareModal name={product.name} th={th} onClose={() => setShowShareModal(false)} />}
            {showReviewModal && <WriteReviewModal name={product.name} th={th} onClose={() => setShowReviewModal(false)} onSubmit={handleReviewSubmit} />}

            {/* ── Top Bar ──────────────────────────────────── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: th.bg, borderBottom: `1px solid ${th.border}`, backdropFilter: 'blur(12px)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.7rem', borderRadius: '8px', border: `1px solid ${th.border}`, backgroundColor: 'transparent', cursor: 'pointer', color: th.textSecondary, fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem', fontWeight: '500' }}>
                            <ChevronLeft size={15} /> Back
                        </button>
                        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <img src={isDark ? '/logo_dark.png' : '/logo_light.png'} alt="Spark" style={{ height: '22px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => setDark(!isDark)} style={{ background: 'transparent', border: `1px solid ${th.border}`, borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.text }}>
                            {isDark ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: { width: '30px', height: '30px' } } }} />
                    </div>
                </div>
            </div>

            {/* ── Hero Banner ──────────────────────────────── */}
            <div style={{ position: 'relative', height: '320px', overflow: 'hidden', backgroundColor: isDark ? '#0d0d1a' : '#f0f4ff' }}>
                {/* Background gradient pattern */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: isDark
                        ? 'radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.1) 0%, transparent 60%)'
                        : 'radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)',
                }} />
                {/* Thumbnail as background */}
                <img src={product.image || FALLBACK_IMG} alt="" onError={e => { e.target.style.display = 'none' }}
                    style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '50%', objectFit: 'cover', opacity: 0.12, maskImage: 'linear-gradient(to left, rgba(0,0,0,0.3), transparent)' }} />
                <div style={{ position: 'absolute', inset: 0, background: th.heroOverlay }} />

                <div style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
                    {/* Product icon/thumbnail */}
                    <div style={{ width: '90px', height: '90px', borderRadius: '18px', overflow: 'hidden', border: `3px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`, flexShrink: 0, backgroundColor: th.cardBg, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <img src={product.image || FALLBACK_IMG} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = FALLBACK_IMG }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.5)', letterSpacing: '-0.02em' }}>{product.name}</h1>
                            {product.featured && <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#fff', backgroundColor: th.phOrange, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>PH Featured</span>}
                        </div>
                        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 0.5rem', maxWidth: '500px', lineHeight: '1.4' }}>{product.tagline}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                                <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', marginLeft: '0.2rem' }}>{product.rating}</span>
                                {product.reviews > 0 && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>({product.reviews.toLocaleString()} reviews)</span>}
                            </div>
                            {product.votes > 0 && (
                                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <ThumbsUp size={13} /> {product.votes.toLocaleString()} upvotes
                                </span>
                            )}
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: priceColor(product.price), backgroundColor: priceColor(product.price) + '33', padding: '0.15rem 0.5rem', borderRadius: '50px' }}>{product.price}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action Buttons ────────────────────────────── */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', borderBottom: `1px solid ${th.border}`, flexWrap: 'wrap' }}>
                {product.website && (
                    <a href={product.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: th.phOrange, color: '#fff', textDecoration: 'none', fontWeight: '700', fontSize: '0.82rem', fontFamily: "'Poppins', sans-serif", transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <Globe size={15} /> Visit Website <ExternalLink size={13} />
                    </a>
                )}
                {product.phUrl && (
                    <a href={product.phUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', borderRadius: '8px', border: `1.5px solid ${th.border}`, backgroundColor: 'transparent', color: th.phOrange, textDecoration: 'none', fontWeight: '600', fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif', transition: 'all 0.15s'" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                        <ThumbsUp size={14} /> Product Hunt <ArrowUpRight size={13} />
                    </a>
                )}
                <button onClick={() => setShowReviewModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', borderRadius: '8px', border: `1.5px solid ${th.border}`, backgroundColor: 'transparent', color: th.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary }}>
                    <Star size={14} /> Write a Review
                </button>
                <button onClick={() => setShowShareModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', borderRadius: '8px', border: `1.5px solid ${th.border}`, backgroundColor: 'transparent', color: th.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary }}>
                    <Share2 size={14} /> Share
                </button>
                <button onClick={() => setIsSaved(!isSaved)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem', borderRadius: '8px', border: `1.5px solid ${th.border}`, backgroundColor: isSaved ? th.activeBg : 'transparent', color: isSaved ? th.text : th.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}>
                    <Bookmark size={14} fill={isSaved ? th.text : 'none'} /> {isSaved ? 'Saved' : 'Save'}
                </button>
            </div>

            {/* ── Main Content ──────────────────────────────── */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>

                {/* ── LEFT COLUMN ──────────────────────────── */}
                <div>
                    {/* Tags */}
                    {product.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {product.tags.map((t, i) => (
                                <span key={i} style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '50px', border: `1px solid ${th.border}`, color: th.textSecondary, fontWeight: '500' }}>{t}</span>
                            ))}
                        </div>
                    )}

                    {/* About */}
                    {product.description && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.6rem', color: th.text }}>About {product.name}</h2>
                            <p style={{ fontSize: '0.88rem', color: th.textSecondary, lineHeight: '1.75', margin: 0 }}>{product.description}</p>
                        </div>
                    )}

                    {/* What makes it special */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.8rem', color: th.text }}>What You Get</h2>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {productFeatures.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: `1px solid ${th.border}`, backgroundColor: th.cardBg, fontSize: '0.76rem', color: th.textSecondary, fontWeight: '500' }}>
                                    <f.icon size={14} /> {f.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Highlights */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.8rem', color: th.text }}>Product Highlights</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                            {[
                                { icon: Zap, label: 'Quick setup' },
                                { icon: Shield, label: 'Data security' },
                                { icon: TrendingUp, label: 'Scalable' },
                                { icon: BookOpen, label: 'Docs & guides' },
                                { icon: MessageSquare, label: '24/7 support' },
                                { icon: CheckCircle, label: 'Regular updates' },
                            ].map((h, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.9rem 0.4rem', borderRadius: '10px', backgroundColor: th.badgeBg, gap: '0.35rem' }}>
                                    <h.icon size={22} color={th.textSecondary} />
                                    <span style={{ fontSize: '0.7rem', color: th.textSecondary, fontWeight: '500', textAlign: 'center' }}>{h.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.8rem', color: th.text }}>User Reviews</h2>
                        {/* Rating summary */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '1rem', borderRadius: '12px', backgroundColor: th.cardBg, border: `1px solid ${th.border}`, marginBottom: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: th.text, lineHeight: 1 }}>{product.rating}</div>
                                <StarRating rating={product.rating} size={13} showNumber={false} th={th} />
                                <div style={{ fontSize: '0.7rem', color: th.textMuted, marginTop: '0.2rem' }}>{(product.reviews || 0).toLocaleString()} reviews</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                {[5,4,3,2,1].map((star, i) => (
                                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: th.textMuted, width: '35px' }}>{star} stars</span>
                                        <div style={{ flex: 1, height: '7px', borderRadius: '4px', backgroundColor: th.badgeBg, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: '4px', width: `${(dist[i] / maxDist) * 100}%`, backgroundColor: star >= 4 ? th.phOrange : star === 3 ? '#f59e0b' : '#999' }} />
                                        </div>
                                        <span style={{ fontSize: '0.66rem', color: th.textMuted, width: '22px', textAlign: 'right' }}>{dist[i]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(showAllReviews ? reviews : reviews.slice(0, 3)).map(r => (
                            <ReviewCard key={r.id} review={r} th={th} />
                        ))}
                        {reviews.length > 3 && (
                            <button onClick={() => setShowAllReviews(!showAllReviews)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.8rem', padding: '0.5rem 1rem', borderRadius: '8px', border: `1.5px solid ${th.border}`, backgroundColor: 'transparent', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", color: th.text }}>
                                {showAllReviews ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {reviews.length} reviews</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── RIGHT COLUMN ─────────────────────────── */}
                <div>
                    {/* CTA Card */}
                    <div style={{ padding: '1.2rem', borderRadius: '12px', border: `1px solid ${th.border}`, backgroundColor: th.cardBg, marginBottom: '1rem' }}>
                        <div style={{ marginBottom: '0.8rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: priceColor(product.price), backgroundColor: priceColor(product.price) + '18', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{product.price}</span>
                        </div>

                        {product.website && (
                            <a href={product.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', padding: '0.7rem', borderRadius: '10px', backgroundColor: th.phOrange, color: '#fff', textDecoration: 'none', fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.6rem', fontFamily: "'Poppins', sans-serif", transition: 'opacity 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                <Globe size={16} /> Get Started
                            </a>
                        )}

                        {product.phUrl && (
                            <a href={product.phUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', padding: '0.6rem', borderRadius: '10px', border: `1.5px solid ${th.border}`, backgroundColor: 'transparent', color: th.phOrange, textDecoration: 'none', fontWeight: '600', fontSize: '0.82rem', fontFamily: "'Poppins', sans-serif", marginBottom: '0.6rem' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = th.hoverBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <ThumbsUp size={14} /> Upvote on Product Hunt
                            </a>
                        )}

                        <div style={{ borderTop: `1px solid ${th.border}`, paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {product.website && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: th.textSecondary }}>
                                    <Globe size={14} color={th.textMuted} />
                                    <span style={{ color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                                </div>
                            )}
                            {product.subcategory && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: th.textSecondary }}>
                                    <Tag size={14} color={th.textMuted} /> {product.subcategory}
                                </div>
                            )}
                            {product.createdAt && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: th.textSecondary }}>
                                    <Calendar size={14} color={th.textMuted} /> Launched {new Date(product.createdAt).getFullYear()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upvotes / social proof */}
                    <div style={{ padding: '1rem', borderRadius: '12px', border: `1px solid ${th.border}`, backgroundColor: th.cardBg, marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: th.text, margin: '0 0 0.8rem' }}>Social Proof</h3>
                        {[
                            { icon: ThumbsUp, label: 'Product Hunt Upvotes', value: (product.votes || 0).toLocaleString(), color: th.phOrange },
                            { icon: Star, label: 'Average Rating', value: product.rating?.toString() || 'N/A', color: '#f59e0b' },
                            { icon: MessageSquare, label: 'User Reviews', value: (product.reviews || 0).toLocaleString(), color: '#3b82f6' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: i < 2 ? `1px solid ${th.border}` : 'none' }}>
                                <s.icon size={16} color={s.color} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.72rem', color: th.textMuted }}>{s.label}</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: '700', color: th.text }}>{s.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tags cloud */}
                    {product.tags?.length > 0 && (
                        <div style={{ padding: '1rem', borderRadius: '12px', border: `1px solid ${th.border}`, backgroundColor: th.cardBg }}>
                            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: th.text, margin: '0 0 0.6rem' }}>Related Topics</h3>
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                {product.tags.map((t, i) => (
                                    <button key={i} onClick={() => navigate('/dashboard')} style={{ padding: '0.25rem 0.55rem', borderRadius: '50px', border: `1px solid ${th.border}`, backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.7rem', color: th.textSecondary, fontFamily: "'Poppins', sans-serif", fontWeight: '500', transition: '0.12s' }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary }}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${th.border}`, padding: '1.5rem', textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ fontSize: '0.7rem', color: th.textMuted, margin: 0 }}>© 2026 Spark. Product data powered by Product Hunt.</p>
            </div>
        </div>
    );
};

/* ─── Styles ───────────────────────────────────────────────── */
const dbpStyles = document.createElement('style');
dbpStyles.textContent = `
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
`;
if (!document.querySelector('[data-dbp-styles]')) {
    dbpStyles.setAttribute('data-dbp-styles', '');
    document.head.appendChild(dbpStyles);
}

export default DigitalBusinessPage;