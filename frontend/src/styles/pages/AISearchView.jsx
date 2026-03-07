/**
 * AISearchView.jsx — Yumi Liquid Glass AI Search
 *
 * Uses Yumi's ACTUAL glass technique from their codebase:
 * - SVG feGaussianBlur + feColorMatrix filters for true liquid glass refraction
 * - ::after pseudo-element pattern: backdrop-filter + filter: url(#svg) + isolation: isolate
 * - transform: translateZ(0) + backface-visibility: hidden for GPU compositing
 * - Dark dot-grid canvas background
 * - Match score % badges on orbiting cards (no bottom list)
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ChevronLeft, Star, Loader2, AlertCircle, Users, Sparkles
} from 'lucide-react';
import { getPreferences } from '../../lib/preferences';
import { listFriends } from '../../lib/friends';

const API = 'http://localhost:5001/api';

/* ─── Fetch helper ─────────────────────────────────────────── */
async function apiFetch(url) {
    let resp;
    try { resp = await fetch(url); } catch (e) {
        throw new Error('Cannot connect to server.');
    }
    const data = await resp.json().catch(() => null);
    if (!data) throw new Error('Invalid server response');
    if (data.error && (!data.businesses || data.businesses.length === 0)) throw new Error(data.error);
    return data;
}

/* ─── Taste matching ──────────────────────────────────────── */
const PRICE_MAP = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };

function mergeGroupPreferences(allPrefs) {
    const mc = allPrefs.length;
    if (mc === 0) return { cuisineFreq: {}, categoryFreq: {}, avgPrice: null, memberCount: 0 };
    const cuisineFreq = {}, categoryFreq = {};
    let priceSum = 0, priceCount = 0;
    for (const p of allPrefs) {
        if (p?.cuisines) for (const c of p.cuisines) cuisineFreq[c] = (cuisineFreq[c] || 0) + 1;
        if (p?.categories) for (const c of p.categories) categoryFreq[c] = (categoryFreq[c] || 0) + 1;
        if (p?.price_level) { priceSum += p.price_level; priceCount++; }
    }
    return { cuisineFreq, categoryFreq, avgPrice: priceCount > 0 ? Math.round(priceSum / priceCount) : null, memberCount: mc, distanceRadius: allPrefs[0]?.distance_radius_meters || 5000 };
}

function computeGroupTasteMatch(biz, merged) {
    let score = 50;
    const reasons = [];
    const mc = merged.memberCount || 1;
    const matchedCuisine = Object.keys(merged.cuisineFreq).find(c =>
        biz.tagLabels?.some(t => t.toLowerCase().includes(c.toLowerCase())) ||
        biz.subcategory?.toLowerCase().includes(c.toLowerCase()) ||
        biz.name?.toLowerCase().includes(c.toLowerCase())
    );
    if (matchedCuisine) {
        const freq = merged.cuisineFreq[matchedCuisine];
        score += Math.round(25 * (freq / mc));
        reasons.push(mc > 1 ? (freq === mc ? `serves ${matchedCuisine} — everyone loves it` : `serves ${matchedCuisine}, loved by ${freq}/${mc}`) : `serves your favorite ${matchedCuisine}`);
    }
    const matchedCat = Object.keys(merged.categoryFreq).find(c => biz.category === c);
    if (matchedCat) { score += Math.round(15 * (merged.categoryFreq[matchedCat] / mc)); reasons.push(`fits ${matchedCat.toLowerCase()}`); }
    if (merged.avgPrice) { const bp = PRICE_MAP[biz.priceLevel]; if (bp === merged.avgPrice) { score += 10; reasons.push('right price range'); } else if (bp) score -= 5; }
    if (biz.rating >= 4.5) { score += 8; reasons.push('highly rated'); } else if (biz.rating >= 4.0) { score += 5; reasons.push('well-reviewed'); }
    score = Math.min(98, Math.max(20, score));
    const reasoning = reasons.length > 0 ? `${reasons[0]}${reasons.length > 1 ? `, ${reasons[1]}` : ''}` : `A nearby ${biz.subcategory?.toLowerCase() || 'local'} business worth discovering.`;
    return { score, reasoning };
}

function getMatchColor(score) {
    if (score >= 80) return 'rgba(255, 255, 255, 0.95)';
    if (score >= 60) return 'rgba(200, 200, 200, 0.95)';
    if (score >= 40) return 'rgba(140, 140, 140, 0.95)';
    return 'rgba(80, 80, 80, 0.95)';
}

function getMatchTextColor(score) {
    if (score >= 60) return '#000';
    return '#fff';
}

function getMatchGlow(score) {
    if (score >= 80) return '0 0 20px rgba(255, 255, 255, 0.25)';
    if (score >= 60) return '0 0 14px rgba(255, 255, 255, 0.15)';
    return 'none';
}

/* ─── Constants ────────────────────────────────────────────── */
const ORBIT_RADIUS = 260;
const ORBIT_IMG_SIZE = 100;
const FRIEND_ORBIT_RADIUS = 140;
const FRIEND_AVT_SIZE = 52;
const DEFAULT_COORDS = { lat: 40.758, lng: -111.876 };

const AI_LOADING_PHRASES = [
    'Discovering small business gems nearby…',
    'Blending your group\'s taste profiles…',
    'Matching local businesses to your crew…',
    'Scanning independent neighborhood favorites…',
    'Evaluating mom-and-pop shops for the group…',
    'Ranking the best small business matches…',
];

const AI_SUGGESTIONS = [
    'Best small-town pizza spot',
    'Hidden gem indie coffee shop',
    'Cozy family-owned bakery nearby',
    'Local small business for date night',
];

/* ─── Central Blob ─────────────────────────────────────────── */
const CentralBlob = ({ state }) => {
    const isThinking = state === 'thinking';
    const isActive = state !== 'idle';

    return (
        <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '160px', height: '160px',
            pointerEvents: 'none', zIndex: 5,
        }}>
            {/* Outer glow */}
            <div style={{
                position: 'absolute', inset: '-60px',
                borderRadius: '50%',
                background: isThinking
                    ? 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(200,200,200,0.06) 40%, transparent 70%)'
                    : isActive
                        ? 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 60%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 50%)',
                filter: 'blur(30px)',
                animation: isThinking ? 'blobPulse 3s ease-in-out infinite' : 'none',
                transition: 'all 0.8s ease',
            }} />

            {/* Rotating glow during thinking */}
            {isThinking && (
                <div style={{
                    position: 'absolute', inset: '-40px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08) 0%, rgba(180,180,180,0.04) 50%, transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'blobRotate 5s linear infinite reverse',
                }} />
            )}

            {/* Core sphere */}
            <div className="yumi-blob" style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: isThinking
                    ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.22), rgba(200,200,200,0.12), rgba(150,150,150,0.06))'
                    : isActive
                        ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.14), rgba(200,200,200,0.07))'
                        : 'radial-gradient(circle at 35% 35%, rgba(80,80,80,0.25), rgba(40,40,40,0.12))',
                border: isThinking
                    ? '0.5px solid rgba(255,255,255,0.25)'
                    : '0.5px solid rgba(255,255,255,0.08)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isThinking ? 'blobMorph 4s ease-in-out infinite' : 'none',
                overflow: 'hidden',
            }}>
                {/* Inner shimmer — kept as subtle overlay on top of SVG glass */}
                <div style={{
                    position: 'absolute', top: '8%', left: '15%',
                    width: '55%', height: '35%',
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    transform: 'rotate(-15deg)',
                }} />
            </div>

            {/* Sparkle dots during thinking */}
            {isThinking && [0, 1, 2, 3].map(i => (
                <div key={i} style={{
                    position: 'absolute',
                    width: '3px', height: '3px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    top: `${20 + Math.sin(i * 1.5) * 30}%`,
                    left: `${20 + Math.cos(i * 1.5) * 30}%`,
                    animation: `sparkle ${1.5 + i * 0.3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                    opacity: 0,
                }} />
            ))}
        </div>
    );
};

/* ─── Liquid Glass Orbit Card ──────────────────────────────── */
const OrbitPhotoCard = ({ biz, x, y, isGlowing, matchScore, isResult, onClick, isExiting }) => {
    const [hovered, setHovered] = useState(false);
    const hasMatch = matchScore != null;

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'absolute',
                left: `${x}px`, top: `${y}px`,
                transform: `translate(-50%, -50%) scale(${hovered ? 1.12 : isExiting ? 0.3 : 1})`,
                opacity: isExiting ? 0 : 1,
                transition: isExiting
                    ? 'all 0.5s cubic-bezier(0.4, 0, 1, 1)'
                    : 'transform 0.25s cubic-bezier(0.17,0.67,0.27,1), opacity 0.4s ease',
                zIndex: hovered ? 20 : isResult ? 10 : 1,
                cursor: isResult ? 'pointer' : 'default',
            }}
        >
            {/* Glass container */}
            <div className="yumi-card" style={{
                width: `${ORBIT_IMG_SIZE}px`, height: `${ORBIT_IMG_SIZE}px`,
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative',
                background: isGlowing
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(20,20,20,0.25)',
                border: isGlowing
                    ? '1px solid rgba(255,255,255,0.6)'
                    : isResult
                        ? '0.5px solid rgba(255,255,255,0.3)'
                        : '0.5px solid rgba(255,255,255,0.08)',
                boxShadow: isGlowing
                    ? `0 0 24px rgba(255,255,255,0.2), 0 0 48px rgba(255,255,255,0.08)${hasMatch ? ', ' + getMatchGlow(matchScore) : ''}`
                    : hovered
                        ? '0 16px 40px rgba(0,0,0,0.5)'
                        : '0 8px 24px rgba(0,0,0,0.3)',
                transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
            }}>
                {/* Image */}
                <img
                    src={biz.image}
                    alt={biz.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                />

                {/* Hover overlay */}
                {hovered && isResult && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        padding: '8px', zIndex: 4,
                    }}>
                        <div style={{ color: '#fff', fontSize: '0.68rem', fontWeight: '700', lineHeight: 1.2, fontFamily: "'Poppins', sans-serif" }}>{biz.name}</div>
                        {biz.rating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <Star size={9} fill="#f59e0b" color="#f59e0b" />
                                <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: '600' }}>{biz.rating}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Match score badge — on card */}
            {hasMatch && (
                <div style={{
                    position: 'absolute', top: '-9px', right: '-9px',
                    padding: '2px 8px', borderRadius: '10px',
                    backgroundColor: getMatchColor(matchScore),
                    color: getMatchTextColor(matchScore),
                    fontSize: '0.62rem', fontWeight: '800',
                    boxShadow: `0 2px 8px rgba(0,0,0,0.35), ${getMatchGlow(matchScore)}`,
                    zIndex: 6,
                    fontFamily: "'Poppins', sans-serif",
                    letterSpacing: '-0.01em',
                    backdropFilter: 'blur(4px)',
                    border: '0.5px solid rgba(255,255,255,0.2)',
                }}>
                    {matchScore}%
                </div>
            )}

            {/* Reasoning tooltip on hover for result cards */}
            {hovered && isResult && biz.matchReasoning && (
                <div style={{
                    position: 'absolute', bottom: '-44px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(10,10,10,0.95)',
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.5)',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '0.58rem',
                    color: 'rgba(200,200,200,0.85)',
                    whiteSpace: 'nowrap',
                    zIndex: 30,
                    fontFamily: "'Poppins', sans-serif",
                    fontStyle: 'italic',
                    maxWidth: '160px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {biz.matchReasoning}
                </div>
            )}
        </div>
    );
};

/* ─── Friend Avatar on orbit ───────────────────────────────── */
const OrbitFriendAvatar = ({ friend, x, y, isMentioned, onHover, onLeave, onClick }) => {
    const initials = (friend.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2);
    return (
        <div
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            style={{
                position: 'absolute',
                left: `${x}px`, top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                width: `${FRIEND_AVT_SIZE}px`, height: `${FRIEND_AVT_SIZE}px`,
                zIndex: 8, cursor: 'pointer',
            }}
        >
            {/* Border ring */}
            <div className="yumi-avatar" style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: isMentioned
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(255,255,255,0.15)',
                padding: isMentioned ? '3px' : '2px',
                boxShadow: isMentioned
                    ? '0 0 16px rgba(255,255,255,0.3), 0 0 32px rgba(255,255,255,0.1)'
                    : 'none',
                transition: 'all 0.3s ease',
            }}>
                <div style={{
                    width: '100%', height: '100%',
                    borderRadius: '50%', overflow: 'hidden',
                    backgroundColor: 'rgba(15,15,15,0.9)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {friend.avatar_url
                        ? <img src={friend.avatar_url} alt={friend.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(220,220,220,0.9)', fontFamily: "'Poppins', sans-serif" }}>{initials}</span>
                    }
                </div>
            </div>

            {/* Name badge */}
            <div style={{
                position: 'absolute', bottom: '-6px', left: '50%',
                transform: 'translateX(-50%)',
                padding: '1px 6px', borderRadius: '8px',
                fontSize: '0.52rem', fontWeight: '700',
                fontFamily: "'Poppins', sans-serif",
                whiteSpace: 'nowrap', color: isMentioned ? '#000' : '#fff',
                background: isMentioned
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(40,40,40,0.85)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
                {isMentioned ? '✓ Included' : friend.full_name?.split(' ')[0] || 'Friend'}
            </div>
        </div>
    );
};


/* ─── Animated Dot Canvas Background ──────────────────────────── */
const DotCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = document.getElementById('dotCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf;
        let t = 0;

        const COLS = 32;
        const ROWS = 24;
        let dots = [];

        function buildDots() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const gapX = canvas.width / (COLS + 1);
            const gapY = canvas.height / (ROWS + 1);
            dots = [];
            for (let row = 1; row <= ROWS; row++) {
                for (let col = 1; col <= COLS; col++) {
                    dots.push({
                        x: gapX * col,
                        y: gapY * row,
                        phase: Math.random() * Math.PI * 2,
                        speed: 0.4 + Math.random() * 0.8,
                        baseAlpha: 0.08 + Math.random() * 0.18,
                        radius: 0.9 + Math.random() * 0.8,
                    });
                }
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            t += 0.008;
            for (const d of dots) {
                const alpha = d.baseAlpha + Math.sin(t * d.speed + d.phase) * 0.12;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
                ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        }

        buildDots();
        draw();
        const ro = new ResizeObserver(buildDots);
        ro.observe(canvas);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);

    return null;
};

/* ═══════════════════════════════════════════════════════════════
   MAIN AI SEARCH VIEW
   ═══════════════════════════════════════════════════════════════ */
const AISearchView = ({ th, onBack }) => {
    const { user } = useUser();
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [rotation, setRotation] = useState(0);
    const cyclesRef = useRef(0);
    const [isThinking, setIsThinking] = useState(false);
    const [showingResults, setShowingResults] = useState(false);
    const [isNarrowing, setIsNarrowing] = useState(false);
    const [orbitImages, setOrbitImages] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [exitingIds, setExitingIds] = useState(new Set());
    const [glowingIndices, setGlowingIndices] = useState(new Set());
    const [currentPhrase, setCurrentPhrase] = useState(AI_LOADING_PHRASES[0]);
    const [searchError, setSearchError] = useState(null);
    const [userPrefs, setUserPrefs] = useState(null);
    const [userCoords, setUserCoords] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [mergedPrefs, setMergedPrefs] = useState(null);
    const [groupSize, setGroupSize] = useState(1);
    const [hoveredFriendId, setHoveredFriendId] = useState(null);

    const blobState = isThinking ? 'thinking' : showingResults ? 'results' : 'idle';
    const wheelDiameter = ORBIT_RADIUS * 2 + ORBIT_IMG_SIZE + 40;

    /* Geolocation */
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setUserCoords(DEFAULT_COORDS)
            );
        } else setUserCoords(DEFAULT_COORDS);
    }, []);

    /* Load preferences + friends */
    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        async function load() {
            const allPrefs = [];
            try {
                const myP = await getPreferences(user.id);
                if (myP?.preferences) { setUserPrefs(myP.preferences); allPrefs.push(myP.preferences); }
            } catch (_) {}
            try {
                const friends = await listFriends(user.id);
                if (cancelled) return;
                setFriendsList(friends || []);
                const results = await Promise.all((friends || []).map(f => getPreferences(f.clerk_user_id).catch(() => null)));
                if (cancelled) return;
                results.forEach((fp, idx) => {
                    const friend = friends[idx];
                    if (fp?.preferences && friend?.clerk_user_id) allPrefs.push(fp.preferences);
                });
            } catch (_) {}
            if (!cancelled) { setGroupSize(allPrefs.length); setMergedPrefs(mergeGroupPreferences(allPrefs)); }
        }
        load();
        return () => { cancelled = true; };
    }, [user?.id]);

    /* Load initial orbit images */
    useEffect(() => {
        if (!userCoords) return;
        apiFetch(`${API}/search?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=5000`)
            .then(data => { if (data?.businesses?.length) setOrbitImages(data.businesses.slice(0, 14)); })
            .catch(() => {});
    }, [userCoords]);

    /* Orbit rotation */
    useEffect(() => {
        const interval = setInterval(() => {
            let speed;
            if (isThinking) speed = 1.0;
            else if (showingResults) speed = 0.4;
            else if (cyclesRef.current < 0.7) speed = 4.0;
            else { const p = Math.min((cyclesRef.current - 0.7) / 0.3, 1); speed = 4.0 - 3.4 * p; }
            setRotation(prev => {
                if (!isThinking && !showingResults) cyclesRef.current += speed / 360;
                return (prev + speed) % 360;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [isThinking, showingResults]);

    /* Glow effect during thinking */
    useEffect(() => {
        if (!isThinking || isNarrowing) { setGlowingIndices(new Set()); return; }
        const interval = setInterval(() => {
            const count = orbitImages.length;
            if (!count) return;
            const n = Math.floor(Math.random() * 3) + 2;
            const s = new Set();
            while (s.size < Math.min(n, count)) s.add(Math.floor(Math.random() * count));
            setGlowingIndices(s);
        }, 1200);
        return () => clearInterval(interval);
    }, [isThinking, isNarrowing, orbitImages.length]);

    /* Rotate loading phrases */
    useEffect(() => {
        if (!isThinking) return;
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % AI_LOADING_PHRASES.length;
            setCurrentPhrase(AI_LOADING_PHRASES[idx]);
        }, 2800);
        return () => clearInterval(interval);
    }, [isThinking]);

    /* Search handler */
    const handleSearch = useCallback(async (q) => {
        const searchQ = (q || query).trim();
        if (!searchQ || !userCoords) return;

        setIsThinking(true);
        setShowingResults(false);
        setIsNarrowing(false);
        setSearchError(null);
        setSearchResults([]);
        setExitingIds(new Set());
        cyclesRef.current = 0;
        setCurrentPhrase(AI_LOADING_PHRASES[0]);

        const radius = mergedPrefs?.distanceRadius || userPrefs?.distance_radius_meters || 5000;

        try {
            const data = await apiFetch(
                `${API}/search?q=${encodeURIComponent(searchQ)}&lat=${userCoords.lat}&lng=${userCoords.lng}&radius=${radius}`
            );

            if (data?.businesses?.length) {
                setOrbitImages(data.businesses.slice(0, 14));
                await new Promise(r => setTimeout(r, 2000));

                const prefsToUse = mergedPrefs || mergeGroupPreferences(userPrefs ? [userPrefs] : []);
                const scored = data.businesses.map(biz => {
                    const { score, reasoning } = computeGroupTasteMatch(biz, prefsToUse);
                    return { ...biz, matchScore: score, matchReasoning: reasoning };
                });
                scored.sort((a, b) => b.matchScore - a.matchScore);
                const topResults = scored.slice(0, 5);
                const topIds = new Set(topResults.map(b => b.id));

                setIsNarrowing(true);
                setCurrentPhrase('Narrowing down the best matches…');

                const nonMatches = orbitImages.filter(b => !topIds.has(b.id));
                const shuffled = [...nonMatches].sort(() => Math.random() - 0.5);

                for (const biz of shuffled) {
                    await new Promise(r => setTimeout(r, 250));
                    setExitingIds(prev => new Set([...prev, biz.id]));
                }

                await new Promise(r => setTimeout(r, 600));

                setOrbitImages(topResults);
                setSearchResults(topResults);
                setExitingIds(new Set());
                setIsNarrowing(false);
            } else {
                setSearchError('No small businesses found nearby. Try a different search.');
            }
        } catch (e) {
            setSearchError(e.message || 'Search failed.');
        } finally {
            setIsThinking(false);
            setShowingResults(true);
        }
    }, [query, userCoords, userPrefs, mergedPrefs, orbitImages]);

    const total = orbitImages.length;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            position: 'relative', overflow: 'hidden',
            width: '100%', fontFamily: "'Poppins', -apple-system, sans-serif",
            background: '#09090f',
        }}>
            {/* ── Yumi SVG Filters for true liquid glass refraction ── */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    {/* Card glass — medium blur + high saturation */}
                    <filter id="card-glass" x="-50%" y="-50%" width="200%" height="200%"
                        filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation="14 10" in="SourceGraphic" edgeMode="none" result="blur"/>
                        <feColorMatrix type="saturate" values="2.2" in="blur" result="colormatrix"/>
                    </filter>
                    {/* Panel glass — heavier blur for input bar + panels */}
                    <filter id="panel-glass" x="-50%" y="-50%" width="200%" height="200%"
                        filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation="20 15" in="SourceGraphic" edgeMode="none" result="blur"/>
                        <feColorMatrix type="saturate" values="2.0" in="blur" result="colormatrix"/>
                    </filter>
                    {/* Btn glass — tight blur for small buttons + chips */}
                    <filter id="btn-glass" x="-50%" y="-50%" width="200%" height="200%"
                        filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation="8 6" in="SourceGraphic" edgeMode="none" result="blur"/>
                        <feColorMatrix type="saturate" values="1.85" in="blur" result="colormatrix"/>
                    </filter>
                    {/* Blob glass — large soft blur for central orb */}
                    <filter id="blob-glass" x="-80%" y="-80%" width="360%" height="360%"
                        filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation="28 22" in="SourceGraphic" edgeMode="none" result="blur"/>
                        <feColorMatrix type="saturate" values="2.5" in="blur" result="colormatrix"/>
                    </filter>
                </defs>
            </svg>
            {/* Animated dot grid canvas */}
            <canvas id="dotCanvas" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 0, opacity: 0.55,
            }} />
            <DotCanvas />
            {/* Back button — Yumi glass */}
            <button onClick={onBack} className="yumi-back-btn" style={{
                position: 'absolute', top: '0.7rem', left: '1rem', zIndex: 30,
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.4rem 0.8rem', borderRadius: '10px', width: 'fit-content',
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.14)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                color: 'rgba(240,240,240,0.8)',
                fontFamily: "'Poppins', sans-serif",
            }}><ChevronLeft size={16} /> Back</button>

            {/* Ambient center glow */}
            <div style={{
                position: 'absolute', left: '50%', top: '45%',
                transform: 'translate(-50%, -50%)',
                width: '600px', height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, rgba(200,200,200,0.02) 40%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none', zIndex: 1,
            }} />

            {/* Main orbit area */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                overflowY: 'hidden', overflowX: 'hidden',
                padding: '0.5rem 1rem',
                position: 'relative', zIndex: 2,
            }}>
                {/* Orbit wheel */}
                <div style={{
                    position: 'relative',
                    width: `${wheelDiameter}px`, height: `${wheelDiameter}px`,
                    minHeight: `${wheelDiameter}px`, flexShrink: 0,
                }}>
                    {/* Orbit track */}
                    <div style={{
                        position: 'absolute', left: '50%', top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${ORBIT_RADIUS * 2}px`, height: `${ORBIT_RADIUS * 2}px`,
                        borderRadius: '50%',
                        border: '0.5px dashed rgba(255,255,255,0.1)',
                        opacity: 0.7,
                    }} />

                    {/* Inner friend orbit track */}
                    {friendsList.length > 0 && (
                        <div style={{
                            position: 'absolute', left: '50%', top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: `${FRIEND_ORBIT_RADIUS * 2}px`, height: `${FRIEND_ORBIT_RADIUS * 2}px`,
                            borderRadius: '50%',
                            border: '0.5px dashed rgba(255,255,255,0.07)',
                        }} />
                    )}

                    {/* Central blob */}
                    <CentralBlob state={blobState} />

                    {/* Status text */}
                    <div style={{
                        position: 'absolute', left: '50%', top: '50%',
                        transform: 'translate(-50%, 90px)',
                        textAlign: 'center', zIndex: 6,
                        pointerEvents: 'none',
                    }}>
                        {isThinking && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                                <Loader2 size={13} color="rgba(255,255,255,0.7)" style={{ animation: 'spin 1s linear infinite' }} />
                                <p style={{
                                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600',
                                    fontFamily: "'Poppins', sans-serif", margin: 0,
                                    animation: 'fadeInUp 0.3s ease',
                                }}>{currentPhrase}</p>
                            </div>
                        )}
                        {showingResults && searchResults.length > 0 && !isThinking && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                                <Sparkles size={12} color="rgba(255,255,255,0.6)" />
                                <p style={{
                                    fontSize: '0.78rem', color: 'rgba(200,200,200,0.7)',
                                    fontFamily: "'Poppins', sans-serif", margin: 0,
                                }}>
                                    {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''} for {groupSize > 1 ? 'your group' : 'you'}
                                </p>
                            </div>
                        )}
                        {!isThinking && !showingResults && (
                            <p style={{
                                fontSize: '0.88rem', fontWeight: '700',
                                color: 'rgba(255,255,255,0.5)',
                                fontFamily: "'Poppins', sans-serif", margin: 0,
                                animation: 'gentlePulse 3s ease-in-out infinite',
                            }}>Discover something new</p>
                        )}
                    </div>

                    {/* Friend avatars on inner orbit */}
                    {friendsList.slice(0, 6).map((friend, i) => {
                        const fTotal = Math.min(friendsList.length, 6);
                        const angle = ((i / fTotal) * 360 + rotation * 0.4) * (Math.PI / 180);
                        const cx = wheelDiameter / 2 + Math.cos(angle) * FRIEND_ORBIT_RADIUS;
                        const cy = wheelDiameter / 2 + Math.sin(angle) * FRIEND_ORBIT_RADIUS;
                        return (
                            <OrbitFriendAvatar
                                key={friend.clerk_user_id}
                                friend={friend}
                                x={cx} y={cy}
                                isMentioned={false}
                                onHover={() => setHoveredFriendId(friend.clerk_user_id)}
                                onLeave={() => setHoveredFriendId(null)}
                                onClick={() => setHoveredFriendId(prev => prev === friend.clerk_user_id ? null : friend.clerk_user_id)}
                            />
                        );
                    })}

                    {/* Orbiting business photo cards */}
                    {total > 0 && orbitImages.map((biz, i) => {
                        const angle = ((i / total) * 360 + rotation) * (Math.PI / 180);
                        const cx = wheelDiameter / 2 + Math.cos(angle) * ORBIT_RADIUS;
                        const cy = wheelDiameter / 2 + Math.sin(angle) * ORBIT_RADIUS;
                        const isResult = searchResults.some(r => r.id === biz.id);
                        const matchData = searchResults.find(r => r.id === biz.id);
                        const isExiting = exitingIds.has(biz.id);

                        return (
                            <OrbitPhotoCard
                                key={biz.id || i}
                                biz={matchData || biz}
                                x={cx} y={cy}
                                isGlowing={glowingIndices.has(i)}
                                matchScore={matchData?.matchScore}
                                isResult={isResult}
                                isNarrowing={isNarrowing}
                                isExiting={isExiting}
                                onClick={() => isResult && navigate(`/business/${encodeURIComponent(biz.name)}`)}
                            />
                        );
                    })}
                </div>

                {/* Group badge */}
                {friendsList.length > 0 && (
                    <div className="yumi-chip" style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        marginTop: '0.6rem', padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '0.5px solid rgba(255,255,255,0.15)',
                    }}>
                        <Users size={12} color="rgba(220,220,220,0.8)" />
                        <span style={{ fontSize: '0.68rem', fontWeight: '600', color: 'rgba(220,220,220,0.8)', fontFamily: "'Poppins', sans-serif" }}>
                            You + {friendsList.length} friend{friendsList.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Error */}
                {searchError && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.8rem', marginTop: '0.5rem',
                        borderRadius: '10px',
                        background: 'rgba(255,30,30,0.08)',
                        border: '0.5px solid rgba(239,68,68,0.3)',
                    }}>
                        <AlertCircle size={15} color="#ef4444" />
                        <p style={{ fontSize: '0.78rem', color: '#ef4444', margin: 0, fontFamily: "'Poppins', sans-serif" }}>{searchError}</p>
                    </div>
                )}
            </div>

            {/* Search bar — bottom */}
            <div className="yumi-bottom-bar" style={{
                flexShrink: 0, padding: '1rem 1.5rem 1.25rem',
                borderTop: '0.5px solid rgba(255,255,255,0.07)',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                position: 'relative', zIndex: 2,
            }}>
                {/* Input bar */}
                <div className="yumi-input-bar" style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    width: '100%', maxWidth: '580px',
                    padding: '0.65rem 0.65rem 0.65rem 1.1rem', borderRadius: '20px',
                    background: 'rgba(255,255,255,0.04)',
                    border: isThinking
                        ? '1px solid rgba(255,255,255,0.35)'
                        : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: isThinking
                        ? '0 0 0 3px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)'
                        : '0 4px 20px rgba(0,0,0,0.35)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                }}>
                    <Search
                        size={17}
                        color={isThinking ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)'}
                        style={{ flexShrink: 0, position: 'relative', zIndex: 1, transition: 'color 0.3s' }}
                    />
                    <input value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Find a local business near you…"
                        disabled={isThinking}
                        style={{
                            flex: 1, border: 'none', background: 'transparent',
                            fontSize: '0.88rem',
                            fontFamily: "'Poppins', sans-serif",
                            color: 'rgba(255,255,255,0.9)', outline: 'none',
                            opacity: isThinking ? 0.5 : 1,
                            position: 'relative', zIndex: 1,
                            letterSpacing: '-0.01em',
                        }} />
                    <button onClick={() => handleSearch()} disabled={isThinking || !query.trim()} style={{
                        padding: '0.5rem 1.15rem', borderRadius: '14px', border: 'none',
                        background: (isThinking || !query.trim())
                            ? 'rgba(255,255,255,0.08)'
                            : '#ffffff',
                        color: (isThinking || !query.trim())
                            ? 'rgba(255,255,255,0.25)'
                            : '#000000',
                        fontWeight: '700', fontSize: '0.82rem',
                        cursor: (isThinking || !query.trim()) ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins', sans-serif",
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        transition: 'all 0.2s ease',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        position: 'relative', zIndex: 1,
                        flexShrink: 0,
                    }}>
                        {isThinking ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                        {isThinking ? 'Searching…' : 'Search'}
                    </button>
                </div>

                {/* Suggestion chips */}
                {!showingResults && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {AI_SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => { setQuery(s); handleSearch(s); }}
                                style={{
                                    padding: '0.24rem 0.7rem', borderRadius: '50px',
                                    background: 'transparent',
                                    border: '0.5px solid rgba(255,255,255,0.14)',
                                    fontSize: '0.67rem', color: 'rgba(255,255,255,0.45)',
                                    cursor: 'pointer',
                                    fontFamily: "'Poppins', sans-serif", fontWeight: '500',
                                    transition: 'all 0.18s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                                    e.currentTarget.style.background = 'transparent';
                                }}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* CSS — Yumi liquid glass classes + animations */}
            <style>{`
                /* ── Yumi Glass Pattern: ::after with SVG filter + backdrop-filter ── */

                /* Orbit card glass */
                .yumi-card {
                    position: relative;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                }
                .yumi-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 18px;
                    background: transparent;
                    overflow: hidden;
                    z-index: 0;
                }
                .yumi-card::after {
                    content: '';
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    border-radius: 18px;
                    backdrop-filter: blur(24px) saturate(185%);
                    -webkit-backdrop-filter: blur(24px) saturate(185%);
                    filter: url(#card-glass);
                    overflow: hidden;
                    isolation: isolate;
                }

                /* Friend avatar glass ring */
                .yumi-avatar {
                    position: relative;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                }
                .yumi-avatar::after {
                    content: '';
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    border-radius: 9999px;
                    backdrop-filter: blur(16px) saturate(180%);
                    -webkit-backdrop-filter: blur(16px) saturate(180%);
                    filter: url(#btn-glass);
                    overflow: hidden;
                    isolation: isolate;
                }

                /* Input bar panel glass */
                .yumi-input-bar {
                    position: relative;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                }
                .yumi-input-bar::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 20px;
                    background: transparent;
                    overflow: hidden;
                }
                .yumi-input-bar::after {
                    content: '';
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    border-radius: 20px;
                    backdrop-filter: blur(32px) saturate(140%);
                    -webkit-backdrop-filter: blur(32px) saturate(140%);
                    filter: url(#panel-glass);
                    overflow: hidden;
                    isolation: isolate;
                }

                /* Bottom bar glass */
                .yumi-bottom-bar {
                    position: relative;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                }
                .yumi-bottom-bar::after {
                    content: '';
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    backdrop-filter: blur(40px) saturate(200%);
                    -webkit-backdrop-filter: blur(40px) saturate(200%);
                    filter: url(#panel-glass);
                    overflow: hidden;
                    isolation: isolate;
                }

                /* Chip / small button glass */
                .yumi-chip {
                    position: relative;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                    transition: transform 0.2s ease;
                }
                .yumi-chip:hover { transform: scale(1.05) translateZ(0); }
                .yumi-chip:active { transform: scale(0.95) translateZ(0); }
                .yumi-chip::after {
                    content: '';
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    border-radius: 9999px;
                    backdrop-filter: blur(18px) saturate(185%);
                    -webkit-backdrop-filter: blur(18px) saturate(185%);
                    filter: url(#btn-glass);
                    overflow: hidden;
                    isolation: isolate;
                }

                /* Back button glass */
                .yumi-back-btn {
                    position: relative;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                    transition: transform 0.2s ease;
                }
                .yumi-back-btn:hover { transform: scale(1.04) translateZ(0); }
                .yumi-back-btn::after {
                    content: '';
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    border-radius: 10px;
                    backdrop-filter: blur(20px) saturate(185%);
                    -webkit-backdrop-filter: blur(20px) saturate(185%);
                    filter: url(#btn-glass);
                    overflow: hidden;
                    isolation: isolate;
                }

                /* Central blob glass */
                .yumi-blob {
                    position: relative;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                }
                .yumi-blob::after {
                    content: '';
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    border-radius: 9999px;
                    backdrop-filter: blur(40px) saturate(200%);
                    -webkit-backdrop-filter: blur(40px) saturate(200%);
                    filter: url(#blob-glass);
                    overflow: hidden;
                    isolation: isolate;
                }

                /* ── Animations ── */
                @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
                @keyframes blobPulse {
                    0%, 100% { transform: scale(1); opacity: 0.85; }
                    50% { transform: scale(1.18); opacity: 1; }
                }
                @keyframes blobMorph {
                    0%, 100% { border-radius: 50%; transform: scale(1) rotate(0deg); }
                    25% { border-radius: 45% 55% 50% 50%; transform: scale(1.04) rotate(2deg); }
                    50% { border-radius: 50% 45% 55% 50%; transform: scale(0.96) rotate(-1deg); }
                    75% { border-radius: 55% 50% 45% 55%; transform: scale(1.03) rotate(1deg); }
                }
                @keyframes blobRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 0.9; transform: scale(1.3); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gentlePulse {
                    0%, 100% { opacity: 0.55; }
                    50% { opacity: 1; }
                }
                input::placeholder { color: rgba(255, 255, 255, 0.28); }
            `}</style>
        </div>
    );
};

export default AISearchView;