/**
 * BusinessPage.jsx — Full business detail page (Yelp-style)
 *
 * Features:
 * - Photo gallery modal with carousel navigation
 * - Share modal (copy link, social share)
 * - Add photo button opens file picker, photos shown in gallery
 * - Write a review modal with star picker + text, saved to review list
 * - Get Directions opens Google Maps in new tab
 * - Message business removed
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    ChevronLeft, Star, Heart, Share2, Bookmark, MapPin, Phone, Globe,
    Clock, ExternalLink, Camera, CheckCircle, Tag,
    ThumbsUp, Award, Utensils, Truck, Wifi, ParkingCircle, Dog,
    Baby, Users, Volume2, Scissors, Gift, Loader2, AlertCircle,
    ChevronRight, ChevronDown, ChevronUp, Edit3, Flag, X,
    Navigation2, Coffee, CreditCard, CalendarCheck, Sparkles,
    Shield, Percent, Moon, Sun, Copy, Check, Upload,
    Facebook, Twitter, Link2, Mail, ImagePlus
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop';

/* ─── Theme ────────────────────────────────────────────────── */
const light = {
    bg: '#fff', bgAlt: '#f9f9f9', sidebar: '#f7f7f7', text: '#1a1a1a',
    textSecondary: '#555', textMuted: '#999', border: '#e8e8e8',
    cardBg: '#fff', accent: '#1a1a1a', accentText: '#fff',
    hoverBg: '#f0f0f0', activeBg: '#e8e8e8', badgeBg: '#f0f0f0',
    inputBg: '#f5f5f5', redAccent: '#d32323', greenAccent: '#16a34a',
    heroOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
    modalOverlay: 'rgba(0,0,0,0.6)', modalBg: '#fff',
};
const dark = {
    bg: '#0a0a0a', bgAlt: '#0f0f0f', sidebar: '#0f0f0f', text: '#f0f0f0',
    textSecondary: '#aaa', textMuted: '#666', border: '#222',
    cardBg: '#141414', accent: '#f0f0f0', accentText: '#0a0a0a',
    hoverBg: '#1a1a1a', activeBg: '#222', badgeBg: '#1e1e1e',
    inputBg: '#141414', redAccent: '#ef4444', greenAccent: '#22c55e',
    heroOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)',
    modalOverlay: 'rgba(0,0,0,0.8)', modalBg: '#1a1a1a',
};

/* ─── Curated deals ────────────────────────────────────────── */
const CURATED_DEALS = [
    { id: 'c1', name: 'Spa Holiday', title: '60-Min Couples Massage or Single Massage', location: '4970 South 900 East, Murray', distance: '7.4 mi', rating: 4.7, reviews: 767, originalPrice: 260, salePrice: 189, finalPrice: 151.20, discount: 27, code: 'LOVE', category: 'Health & Beauty', subcategory: 'Spas', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=480&h=320&fit=crop', popular: true },
    { id: 'c2', name: 'Raiya Head Spa', title: 'Premier Head Spa for Singles or Couples', location: '1290 South 500 West, Woods Cross', distance: '16.8 mi', rating: 5.0, reviews: 11, originalPrice: 105, salePrice: 75, finalPrice: 52.75, discount: 29, code: 'LOVE', category: 'Health & Beauty', subcategory: 'Spas', image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=480&h=320&fit=crop', popular: true },
    { id: 'c3', name: 'Rebalance Life and Body', title: 'One or Three Sessions of Swedish Massages', location: '9035 South 1300 East, Sandy', distance: '9.1 mi', rating: 4.9, reviews: 17, originalPrice: 70, salePrice: 56, finalPrice: 38.92, discount: 20, code: 'LOVE', category: 'Health & Beauty', subcategory: 'Massage', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=480&h=320&fit=crop', popular: true },
    { id: 'c5', name: 'Sola Salon Studios', title: 'Haircut & Style with Optional Color Treatment', location: '11467 South Parkway, South Jordan', distance: '3.2 mi', rating: 4.7, reviews: 89, originalPrice: 85, salePrice: 55, finalPrice: 44.00, discount: 35, code: 'STYLE', category: 'Health & Beauty', subcategory: 'Hair Salons', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=480&h=320&fit=crop', popular: false },
    { id: 'c7', name: 'Hand & Stone Massage', title: 'Introductory Hot Stone Massage — 50 Minutes', location: '6949 S Redwood Rd, West Jordan', distance: '5.0 mi', rating: 4.5, reviews: 241, originalPrice: 100, salePrice: 69, finalPrice: 55.20, discount: 31, code: 'RELAX', category: 'Health & Beauty', subcategory: 'Massage', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=480&h=320&fit=crop', popular: true },
    { id: 'c10', name: 'Waffle Love', title: 'Two Signature Liege Waffles with Toppings', location: '1470 W 9000 S, West Jordan', distance: '5.2 mi', rating: 4.6, reviews: 312, originalPrice: 28, salePrice: 18, finalPrice: 14.40, discount: 36, code: 'YUMMY', category: 'Food & Drink', subcategory: 'Bakeries', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=480&h=320&fit=crop', popular: true },
    { id: 'c11', name: 'Cupbop', title: 'Two Korean BBQ Bowls with Drinks', location: '11449 S Parkway Plaza Dr, South Jordan', distance: '3.4 mi', rating: 4.5, reviews: 462, originalPrice: 32, salePrice: 22, finalPrice: 17.60, discount: 31, code: 'BOWLS', category: 'Food & Drink', subcategory: 'Dinner', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=480&h=320&fit=crop', popular: true },
    { id: 'c13', name: 'Crumbl Cookies', title: 'Box of 6 Rotating Weekly Cookie Flavors', location: '11587 S District Drive, South Jordan', distance: '2.8 mi', rating: 4.8, reviews: 578, originalPrice: 28, salePrice: 22, finalPrice: 17.60, discount: 21, code: 'SWEET', category: 'Food & Drink', subcategory: 'Bakeries', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=480&h=320&fit=crop', popular: true },
    { id: 'c16', name: 'R&R BBQ', title: 'Two-Meat Combo Plate with Two Sides for Two', location: '307 W 600 S, Salt Lake City', distance: '14.2 mi', rating: 4.7, reviews: 1842, originalPrice: 44, salePrice: 30, finalPrice: 24.00, discount: 32, code: 'SMOKE', category: 'Food & Drink', subcategory: 'Dinner', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=480&h=320&fit=crop', popular: true },
    { id: 'c17', name: 'Beans & Brews', title: 'Buy 5 Drinks, Get 5 Free — Any Size', location: '1098 W South Jordan Pkwy, South Jordan', distance: '2.6 mi', rating: 4.3, reviews: 156, originalPrice: 35, salePrice: 17.50, finalPrice: 14.00, discount: 50, code: 'BREW', category: 'Food & Drink', subcategory: 'Coffee & Cafes', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=480&h=320&fit=crop', popular: false },
    { id: 'c20', name: 'Uptown Jungle Fun Park Sandy', title: '3-Hour Trampoline Time', location: '7850 South 1300 East, Sandy', distance: '8.4 mi', rating: 4.8, reviews: 377, originalPrice: 22, salePrice: 16, finalPrice: 12.80, discount: 27, code: 'LOVE', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=480&h=320&fit=crop', popular: true },
    { id: 'c21', name: 'Momentum Indoor Climbing', title: 'Explore 47,000 sq ft of Indoor Climbing!', location: '7210 Union Park Avenue, Midvale', distance: '7.9 mi', rating: 4.9, reviews: 46, originalPrice: 40, salePrice: 20, finalPrice: 15.00, discount: 50, code: 'LOVE', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=480&h=320&fit=crop', popular: true },
    { id: 'c23', name: 'TopGolf', title: 'Two Hours of Bay Time with $20 Game Play Credits', location: '920 Jordan River Blvd, Midvale', distance: '9.2 mi', rating: 4.5, reviews: 289, originalPrice: 75, salePrice: 50, finalPrice: 40.00, discount: 33, code: 'SWING', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=480&h=320&fit=crop', popular: true },
    { id: 'c30', name: 'Oilstop Drive Thru Oil Change', title: 'Up to 50% Off on Oil Change', location: '5534 West 3500 South, West Valley City', distance: '3.4 mi', rating: 4.7, reviews: 462, originalPrice: 80, salePrice: 40, finalPrice: 32.00, discount: 50, code: 'LOVE', category: 'Auto & Home', subcategory: 'Auto Repair', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=480&h=320&fit=crop', popular: true },
    { id: 'c32', name: 'Safelite AutoGlass', title: 'Windshield Chip Repair — Up to 3 Chips Free', location: '8786 S Redwood Rd, West Jordan', distance: '4.7 mi', rating: 4.3, reviews: 523, originalPrice: 75, salePrice: 0, finalPrice: 0, discount: 100, code: 'GLASS', category: 'Auto & Home', subcategory: 'Auto Repair', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=480&h=320&fit=crop', popular: true },
];

/* ─── Generate initial reviews ─────────────────────────────── */
function generateReviews(biz) {
    const names = [
        { name: 'Michelle D.', loc: 'Bluffdale, UT', reviews: 49, photos: 1 },
        { name: 'Linh N.', loc: 'SoMa, San Francisco, CA', reviews: 0, photos: 1 },
        { name: 'Shannara I.', loc: 'Taylorsville, UT', reviews: 0, photos: 1 },
        { name: 'Chantel H.', loc: 'Salt Lake City, UT', reviews: 17, photos: 0 },
        { name: 'Stefania D.', loc: 'Herriman, UT', reviews: 41, photos: 4 },
        { name: 'Jordan K.', loc: 'Sandy, UT', reviews: 23, photos: 3 },
        { name: 'Alex M.', loc: 'South Jordan, UT', reviews: 12, photos: 2 },
        { name: 'Priya P.', loc: 'Murray, UT', reviews: 8, photos: 0 },
    ];
    const positiveTexts = [
        `Best ${biz.subcategory?.toLowerCase() || 'experience'} ever! My family even liked it and they're usually picky. The service was excellent! We will definitely be back!`,
        `Food was so freaking good, it took awhile to come out but it's okay. Everything was amazing and we loved every bit of it!`,
        `I love this place! I've been going here for over a year and will continue to! Customer service is through the roof!`,
        `Excellent food and service! A hidden gem with great prices, I have been coming here for years and love it every time.`,
        `Really wonderful experience from start to finish. The staff was incredibly friendly and attentive. Highly recommend to anyone in the area!`,
        `One of the best spots in the valley. Clean, great atmosphere, and the quality is consistently top notch. Can't say enough good things.`,
    ];
    const mixedTexts = [
        `A decent spot. Fresh enough but nothing particularly memorable. The portions are good and it's convenient for a quick meal. Reliable but not somewhere I'd go out of my way for.`,
        `Good overall experience. Some items were better than others, but the staff was friendly and the prices are fair for what you get.`,
    ];
    const count = Math.min(6, Math.max(3, Math.floor((biz.reviewCount || 10) / 50)));
    const revs = [];
    for (let i = 0; i < count; i++) {
        const person = names[i % names.length];
        const isPositive = i < count - 1 || (biz.rating || 4) >= 4.5;
        const rating = isPositive ? (Math.random() > 0.3 ? 5 : 4) : 3;
        const text = isPositive ? positiveTexts[i % positiveTexts.length] : mixedTexts[i % mixedTexts.length];
        const daysAgo = Math.floor(Math.random() * 60) + 5;
        const date = new Date(Date.now() - daysAgo * 86400000);
        revs.push({
            id: `r${i}`, name: person.name, location: person.loc,
            reviewCount: person.reviews, photoCount: person.photos, rating,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            text, helpful: Math.floor(Math.random() * 5),
            thanks: Math.floor(Math.random() * 3), love: Math.floor(Math.random() * 4),
        });
    }
    return revs;
}

/* ─── Fetch helper ─────────────────────────────────────────── */
async function apiFetch(url) {
    const resp = await fetch(url);
    const data = await resp.json().catch(() => null);
    if (!data) throw new Error('Invalid server response');
    if (data.error) throw new Error(data.error);
    return data;
}

/* ─── Star Rating Component ────────────────────────────────── */
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
        <div onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            {children}
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   PHOTO GALLERY MODAL
   ═══════════════════════════════════════════════════════════════ */
const PhotoGalleryModal = ({ photos, startIndex, th, onClose }) => {
    const [idx, setIdx] = useState(startIndex || 0);
    const total = photos.length;

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowRight') setIdx(p => (p + 1) % total);
            else if (e.key === 'ArrowLeft') setIdx(p => (p - 1 + total) % total);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [total, onClose]);

    if (total === 0) return null;

    return (
        <ModalBackdrop th={th} onClose={onClose}>
            <div style={{
                width: '90vw', maxWidth: '900px', backgroundColor: th.modalBg,
                borderRadius: '16px', overflow: 'hidden', position: 'relative',
                boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.8rem 1.2rem', borderBottom: `1px solid ${th.border}`,
                }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: th.text }}>
                        Photo {idx + 1} of {total}
                    </span>
                    <button onClick={onClose} style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        border: `1px solid ${th.border}`, backgroundColor: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: th.textMuted,
                    }}><X size={18} /></button>
                </div>

                {/* Image */}
                <div style={{
                    position: 'relative', width: '100%', height: '500px',
                    backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <img src={photos[idx]} alt={`Photo ${idx + 1}`}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.src = FALLBACK_IMG }}
                    />
                    {/* Prev */}
                    {total > 1 && <button onClick={() => setIdx((idx - 1 + total) % total)} style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        width: '44px', height: '44px', borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.88)', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.2)', color: '#1a1a1a',
                        transition: 'transform 0.15s',
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                       onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}>
                        <ChevronLeft size={22} />
                    </button>}
                    {/* Next */}
                    {total > 1 && <button onClick={() => setIdx((idx + 1) % total)} style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        width: '44px', height: '44px', borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.88)', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.2)', color: '#1a1a1a',
                        transition: 'transform 0.15s',
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                       onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}>
                        <ChevronRight size={22} />
                    </button>}
                </div>

                {/* Thumbnails */}
                {total > 1 && <div style={{
                    display: 'flex', gap: '0.4rem', padding: '0.8rem 1rem',
                    overflowX: 'auto', borderTop: `1px solid ${th.border}`,
                }}>
                    {photos.map((p, i) => (
                        <div key={i} onClick={() => setIdx(i)} style={{
                            width: '60px', height: '45px', borderRadius: '6px', overflow: 'hidden',
                            cursor: 'pointer', flexShrink: 0,
                            border: i === idx ? '2px solid #3b82f6' : `2px solid transparent`,
                            opacity: i === idx ? 1 : 0.6, transition: 'all 0.15s',
                        }}>
                            <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                 onError={e => { e.target.src = FALLBACK_IMG }} />
                        </div>
                    ))}
                </div>}
            </div>
        </ModalBackdrop>
    );
};


/* ═══════════════════════════════════════════════════════════════
   SHARE MODAL
   ═══════════════════════════════════════════════════════════════ */
const ShareModal = ({ bizName, th, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = window.location.href;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* fallback */ }
    };

    const shareOptions = [
        { label: 'Facebook', color: '#1877F2', icon: 'f', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
        { label: 'Twitter / X', color: th.text, icon: 'X', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${bizName} on Spark!`)}&url=${encodeURIComponent(shareUrl)}` },
        { label: 'Email', color: '#ea4335', icon: null, iconComp: Mail, url: `mailto:?subject=${encodeURIComponent(`Check out ${bizName}`)}&body=${encodeURIComponent(`Found this on Spark: ${shareUrl}`)}` },
    ];

    return (
        <ModalBackdrop th={th} onClose={onClose}>
            <div style={{
                width: '420px', maxWidth: '95vw', backgroundColor: th.modalBg,
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.2rem', borderBottom: `1px solid ${th.border}`,
                }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: th.text, margin: 0 }}>Share this business</h3>
                    <button onClick={onClose} style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: `1px solid ${th.border}`, backgroundColor: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted,
                    }}><X size={16} /></button>
                </div>

                <div style={{ padding: '1.2rem' }}>
                    {/* Copy link */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 0.8rem', borderRadius: '10px',
                        backgroundColor: th.inputBg, border: `1px solid ${th.border}`,
                        marginBottom: '1.2rem',
                    }}>
                        <Link2 size={16} color={th.textMuted} />
                        <span style={{
                            flex: 1, fontSize: '0.78rem', color: th.textSecondary,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{shareUrl}</span>
                        <button onClick={copyLink} style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.35rem 0.75rem', borderRadius: '8px',
                            backgroundColor: copied ? th.greenAccent : th.accent,
                            color: copied ? '#fff' : th.accentText,
                            border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.76rem',
                            fontFamily: "'Poppins', sans-serif", transition: 'all 0.2s',
                        }}>
                            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                        </button>
                    </div>

                    {/* Social share */}
                    <p style={{ fontSize: '0.72rem', fontWeight: '600', color: th.textMuted, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Share via</p>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        {shareOptions.map(opt => {
                            const IC = opt.iconComp;
                            return (
                                <a key={opt.label} href={opt.url} target="_blank" rel="noopener noreferrer" style={{
                                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.9rem 0.5rem', borderRadius: '12px',
                                    border: `1px solid ${th.border}`, backgroundColor: 'transparent',
                                    textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                   onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'none' }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        backgroundColor: opt.color, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1rem',
                                    }}>
                                        {IC ? <IC size={20} /> : opt.icon}
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: '500', color: th.textSecondary }}>{opt.label}</span>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </ModalBackdrop>
    );
};


/* ═══════════════════════════════════════════════════════════════
   WRITE REVIEW MODAL
   ═══════════════════════════════════════════════════════════════ */
const WriteReviewModal = ({ bizName, th, userName, onClose, onSubmit }) => {
    const [hoverStar, setHoverStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const starLabels = ['', 'Not good', 'Could be better', "It's okay", 'Great', 'Excellent!'];

    const handleSubmit = () => {
        if (selectedStar === 0 || !reviewText.trim()) return;
        onSubmit({ rating: selectedStar, text: reviewText.trim() });
        setSubmitted(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    if (submitted) {
        return (
            <ModalBackdrop th={th} onClose={onClose}>
                <div style={{
                    width: '400px', maxWidth: '95vw', backgroundColor: th.modalBg,
                    borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem',
                    }}><Check size={32} color="#16a34a" /></div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: th.text, marginBottom: '0.3rem' }}>Review posted!</h3>
                    <p style={{ fontSize: '0.85rem', color: th.textMuted }}>Thanks for sharing your experience.</p>
                </div>
            </ModalBackdrop>
        );
    }

    return (
        <ModalBackdrop th={th} onClose={onClose}>
            <div style={{
                width: '520px', maxWidth: '95vw', backgroundColor: th.modalBg,
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.2rem', borderBottom: `1px solid ${th.border}`,
                }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: th.text, margin: 0 }}>{bizName}</h3>
                    <button onClick={onClose} style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: `1px solid ${th.border}`, backgroundColor: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted,
                    }}><X size={16} /></button>
                </div>

                <div style={{ padding: '1.5rem 1.2rem' }}>
                    {/* Star picker */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s}
                                    onMouseEnter={() => setHoverStar(s)}
                                    onMouseLeave={() => setHoverStar(0)}
                                    onClick={() => setSelectedStar(s)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem',
                                        transform: (hoverStar >= s || selectedStar >= s) ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'transform 0.15s',
                                    }}
                                >
                                    <Star size={36}
                                        fill={(hoverStar || selectedStar) >= s ? '#f59e0b' : 'none'}
                                        color={(hoverStar || selectedStar) >= s ? '#f59e0b' : th.border}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                        </div>
                        <p style={{
                            fontSize: '0.82rem', fontWeight: '600', minHeight: '1.2rem',
                            color: (hoverStar || selectedStar) > 0 ? th.text : th.textMuted,
                        }}>
                            {starLabels[hoverStar || selectedStar] || 'Select your rating'}
                        </p>
                    </div>

                    {/* Text area */}
                    <textarea
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        placeholder={`Share your experience at ${bizName}... What did you like? What could be improved? Would you recommend this place?`}
                        style={{
                            width: '100%', minHeight: '150px', padding: '0.8rem',
                            borderRadius: '10px', border: `1.5px solid ${th.border}`,
                            backgroundColor: th.inputBg, color: th.text,
                            fontSize: '0.88rem', fontFamily: "'Poppins', sans-serif",
                            resize: 'vertical', outline: 'none', lineHeight: '1.6',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                        onBlur={e => e.target.style.borderColor = th.border}
                    />
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: '0.4rem',
                    }}>
                        <span style={{ fontSize: '0.7rem', color: th.textMuted }}>
                            {reviewText.length > 0 ? `${reviewText.length} characters` : 'Minimum 10 characters'}
                        </span>
                    </div>

                    {/* Submit */}
                    <div style={{
                        display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.2rem',
                    }}>
                        <button onClick={onClose} style={{
                            padding: '0.55rem 1.1rem', borderRadius: '10px',
                            border: `1.5px solid ${th.border}`, backgroundColor: 'transparent',
                            color: th.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.84rem',
                            fontFamily: "'Poppins', sans-serif",
                        }}>Cancel</button>
                        <button onClick={handleSubmit}
                            disabled={selectedStar === 0 || reviewText.trim().length < 10}
                            style={{
                                padding: '0.55rem 1.3rem', borderRadius: '10px', border: 'none',
                                backgroundColor: (selectedStar > 0 && reviewText.trim().length >= 10) ? th.redAccent : th.badgeBg,
                                color: (selectedStar > 0 && reviewText.trim().length >= 10) ? '#fff' : th.textMuted,
                                cursor: (selectedStar > 0 && reviewText.trim().length >= 10) ? 'pointer' : 'not-allowed',
                                fontWeight: '700', fontSize: '0.84rem',
                                fontFamily: "'Poppins', sans-serif", transition: 'all 0.2s',
                            }}
                        >Post Review</button>
                    </div>
                </div>
            </div>
        </ModalBackdrop>
    );
};


/* ─── Review Card ──────────────────────────────────────────── */
const ReviewCard = ({ review, th }) => (
    <div style={{ padding: '1.2rem 0', borderBottom: `1px solid ${th.border}` }}>
        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.6rem' }}>
            <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: `hsl(${review.name.charCodeAt(0) * 7 % 360}, 45%, 55%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0
            }}>{review.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.88rem', color: th.text }}>{review.name}</div>
                <div style={{ fontSize: '0.72rem', color: th.textMuted }}>{review.location}</div>
                <div style={{ fontSize: '0.68rem', color: th.textMuted, display: 'flex', gap: '0.5rem' }}>
                    <span>{review.reviewCount} reviews</span>
                    <span>{review.photoCount} photos</span>
                </div>
            </div>
            {review.isNew && <span style={{
                fontSize: '0.62rem', fontWeight: '700', color: '#fff',
                backgroundColor: th.greenAccent, padding: '0.15rem 0.5rem',
                borderRadius: '50px', alignSelf: 'flex-start',
            }}>New</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <StarRating rating={review.rating} size={13} showNumber={false} th={th} />
            <span style={{ fontSize: '0.72rem', color: th.textMuted }}>{review.date}</span>
        </div>
        <p style={{ fontSize: '0.84rem', color: th.textSecondary, lineHeight: '1.6', margin: '0 0 0.6rem' }}>{review.text}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
            {[
                { icon: ThumbsUp, label: 'Helpful', count: review.helpful },
                { icon: Heart, label: 'Love this', count: review.love },
            ].map(a => (
                <button key={a.label} style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.25rem 0.5rem', borderRadius: '6px',
                    border: `1px solid ${th.border}`, backgroundColor: 'transparent',
                    cursor: 'pointer', fontSize: '0.7rem', color: th.textMuted,
                    fontFamily: "'Poppins', sans-serif",
                }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
                   onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textMuted }}>
                    <a.icon size={12} /> {a.label} {a.count > 0 && a.count}
                </button>
            ))}
        </div>
    </div>
);

/* ─── Deal Card (mini) ─────────────────────────────────────── */
const MiniDealCard = ({ deal, th }) => (
    <div style={{
        display: 'flex', gap: '0.8rem', padding: '0.8rem',
        backgroundColor: th.cardBg, borderRadius: '10px',
        border: `1px solid ${th.border}`, cursor: 'pointer', transition: 'all 0.2s',
    }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
       onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <img src={deal.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: th.text, margin: '0 0 0.2rem', lineHeight: '1.3' }}>{deal.title}</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.15rem' }}>
                {deal.originalPrice > 0 && <span style={{ fontSize: '0.72rem', color: th.textMuted, textDecoration: 'line-through' }}>${deal.originalPrice}</span>}
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: th.text }}>{deal.salePrice === 0 ? 'FREE' : `$${deal.salePrice}`}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.08rem 0.25rem', borderRadius: '4px' }}>-{deal.discount}%</span>
            </div>
            {deal.code && deal.finalPrice > 0 && <div style={{ fontSize: '0.7rem', color: th.greenAccent }}>
                <span style={{ fontWeight: '700' }}>${deal.finalPrice.toFixed(2)}</span> with code <span style={{ fontWeight: '600', backgroundColor: th.badgeBg, padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{deal.code}</span>
            </div>}
        </div>
    </div>
);

/* ─── Map Pin ──────────────────────────────────────────────── */
function bizPinIcon() {
    return L.divIcon({
        className: 'biz-pin',
        html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="#d32323" stroke="#fff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`,
        iconSize: [30, 30], iconAnchor: [15, 30],
    });
}


/* ═══════════════════════════════════════════════════════════════
   MAIN BUSINESS PAGE
   ═══════════════════════════════════════════════════════════════ */
const BusinessPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const photoInputRef = useRef(null);

    const [biz, setBiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFav, setIsFav] = useState(false);
    const [isDark, setDark] = useState(true);
    const [showAllHours, setShowAllHours] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [matchingDeals, setMatchingDeals] = useState([]);

    // Modal states
    const [showPhotoGallery, setShowPhotoGallery] = useState(false);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // User-uploaded photos
    const [userPhotos, setUserPhotos] = useState([]);

    const th = isDark ? dark : light;

    /* ─── All photos for the gallery ───────────────────────── */
    const allPhotos = [
        biz?.image || FALLBACK_IMG,
        ...userPhotos,
    ].filter(Boolean);

    /* ─── Handle file upload ───────────────────────────────── */
    const handlePhotoUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newPhotos = [];
        for (let i = 0; i < files.length; i++) {
            const url = URL.createObjectURL(files[i]);
            newPhotos.push(url);
        }
        setUserPhotos(prev => [...prev, ...newPhotos]);
        // Open gallery at the first new photo
        setGalleryStartIndex(allPhotos.length);
        setShowPhotoGallery(true);
        // Reset input
        if (photoInputRef.current) photoInputRef.current.value = '';
    };

    /* ─── Handle review submit ─────────────────────────────── */
    const handleReviewSubmit = ({ rating, text }) => {
        const newReview = {
            id: `user_r_${Date.now()}`,
            name: user?.fullName || user?.firstName || 'You',
            location: 'Your location',
            reviewCount: 1,
            photoCount: 0,
            rating,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            text,
            helpful: 0,
            thanks: 0,
            love: 0,
            isNew: true,
        };
        setReviews(prev => [newReview, ...prev]);
    };

    /* ─── Open Google Maps directions ──────────────────────── */
    const openDirections = () => {
        if (!biz) return;
        const addr = encodeURIComponent(biz.address || biz.location || biz.name);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, '_blank');
    };

    /* ─── Fetch business ───────────────────────────────────── */
    useEffect(() => {
        const fetchBusiness = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({
                    lat: '40.56', lng: '-111.93', radius: '50000',
                    q: id, per_page: '1'
                });
                const data = await apiFetch(`${API}/search?${params}`);
                if (data.businesses && data.businesses.length > 0) {
                    const b = data.businesses[0];
                    setBiz(b);
                    setReviews(generateReviews(b));
                    const nameWords = b.name.toLowerCase().split(/\s+/);
                    const deals = CURATED_DEALS.filter(d => {
                        const dName = d.name.toLowerCase();
                        return nameWords.some(w => w.length > 3 && dName.includes(w)) ||
                            (b.subcategory && d.subcategory === b.subcategory) ||
                            (b.category && d.category?.includes(b.category?.split(' ')[0]));
                    }).slice(0, 4);
                    setMatchingDeals(deals);
                } else {
                    setError('Business not found');
                }
            } catch (e) {
                setError(e.message);
            }
            setLoading(false);
        };
        if (id) fetchBusiness();
    }, [id]);

    /* ─── Parse hours ──────────────────────────────────────── */
    const parseHours = () => {
        if (!biz?.openingHours) return [];
        const parts = biz.openingHours.split(';').map(s => s.trim()).filter(Boolean);
        const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return parts.map((p, i) => ({
            day: shortDays[i] || `Day ${i + 1}`,
            hours: p.replace(/^[A-Za-z]+:\s*/, '') || 'Closed',
        }));
    };
    const hours = parseHours();
    const todayDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

    /* ─── Rating distribution ──────────────────────────────── */
    const getRatingDist = () => {
        if (!biz) return [0, 0, 0, 0, 0];
        const r = biz.rating || 4;
        const total = biz.reviewCount || 100;
        if (r >= 4.5) return [Math.round(total * 0.65), Math.round(total * 0.22), Math.round(total * 0.06), Math.round(total * 0.04), Math.round(total * 0.03)];
        if (r >= 4.0) return [Math.round(total * 0.45), Math.round(total * 0.30), Math.round(total * 0.12), Math.round(total * 0.08), Math.round(total * 0.05)];
        if (r >= 3.5) return [Math.round(total * 0.25), Math.round(total * 0.25), Math.round(total * 0.25), Math.round(total * 0.15), Math.round(total * 0.10)];
        return [Math.round(total * 0.15), Math.round(total * 0.15), Math.round(total * 0.20), Math.round(total * 0.25), Math.round(total * 0.25)];
    };
    const ratingDist = getRatingDist();
    const maxDist = Math.max(...ratingDist, 1);

    /* ─── Business highlights ──────────────────────────────── */
    const getHighlights = () => {
        if (!biz) return [];
        const h = [];
        if (biz.features?.includes('Takeout Available')) h.push({ icon: Truck, label: 'Takeout available' });
        if (biz.features?.includes('Delivery')) h.push({ icon: Truck, label: 'Delivery' });
        if (biz.priceLevel) h.push({ icon: CreditCard, label: biz.priceLevel + ' pricing' });
        if (biz.features?.includes('Has Website')) h.push({ icon: Globe, label: 'Has website' });
        h.push({ icon: CalendarCheck, label: 'Takes reservations' });
        h.push({ icon: ParkingCircle, label: 'Free parking' });
        h.push({ icon: Users, label: 'Good for groups' });
        h.push({ icon: Baby, label: 'Good for kids' });
        h.push({ icon: Volume2, label: 'Moderate noise' });
        h.push({ icon: Dog, label: 'Dogs allowed' });
        return h.slice(0, 6);
    };

    /* ─── Loading ──────────────────────────────────────────── */
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: th.bg, fontFamily: "'Poppins', sans-serif" }}>
            <Loader2 size={40} color={th.textMuted} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p style={{ color: th.textMuted, fontSize: '0.9rem' }}>Loading business details...</p>
        </div>
    );

    /* ─── Error ────────────────────────────────────────────── */
    if (error || !biz) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: th.bg, fontFamily: "'Poppins', sans-serif", padding: '2rem' }}>
            <AlertCircle size={48} color={th.redAccent} style={{ marginBottom: '1rem', opacity: 0.6 }} />
            <h2 style={{ color: th.text, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Business not found</h2>
            <p style={{ color: th.textMuted, fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>{error || 'Could not load this business.'}</p>
            <button onClick={() => navigate('/dashboard')} style={{
                padding: '0.5rem 1.2rem', borderRadius: '10px', backgroundColor: th.accent,
                color: th.accentText, border: 'none', cursor: 'pointer', fontWeight: '600',
                fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}><ChevronLeft size={16} /> Back to Dashboard</button>
        </div>
    );

    const highlights = getHighlights();

    return (
        <div style={{ fontFamily: "'Poppins', -apple-system, sans-serif", backgroundColor: th.bg, color: th.text, minHeight: '100vh' }}>

            {/* Hidden file input for photo upload */}
            <input type="file" ref={photoInputRef} accept="image/*" multiple
                onChange={handlePhotoUpload} style={{ display: 'none' }} />

            {/* ── Modals ───────────────────────────────────────── */}
            {showPhotoGallery && (
                <PhotoGalleryModal
                    photos={[biz.image || FALLBACK_IMG, ...userPhotos]}
                    startIndex={galleryStartIndex}
                    th={th}
                    onClose={() => setShowPhotoGallery(false)}
                />
            )}
            {showShareModal && (
                <ShareModal bizName={biz.name} th={th} onClose={() => setShowShareModal(false)} />
            )}
            {showReviewModal && (
                <WriteReviewModal
                    bizName={biz.name} th={th}
                    userName={user?.fullName || user?.firstName || 'User'}
                    onClose={() => setShowReviewModal(false)}
                    onSubmit={handleReviewSubmit}
                />
            )}

            {/* ── Sticky Top Bar ───────────────────────────────── */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100,
                backgroundColor: th.bg, borderBottom: `1px solid ${th.border}`,
                backdropFilter: 'blur(12px)',
            }}>
                <div style={{
                    maxWidth: '1100px', margin: '0 auto', padding: '0.5rem 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button onClick={() => navigate('/dashboard')} style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.7rem', borderRadius: '8px',
                            border: `1px solid ${th.border}`, backgroundColor: 'transparent',
                            cursor: 'pointer', color: th.textSecondary,
                            fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem', fontWeight: '500',
                        }}><ChevronLeft size={16} /> Back</button>
                        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <img src={isDark ? '/logo_dark.png' : '/logo_light.png'} alt="Spark" style={{ height: '22px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => setDark(!isDark)} style={{
                            background: 'transparent', border: `1px solid ${th.border}`,
                            borderRadius: '50%', width: '34px', height: '34px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: th.text,
                        }}>{isDark ? <Sun size={16} /> : <Moon size={16} />}</button>
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: { width: '30px', height: '30px' } } }} />
                    </div>
                </div>
            </div>

            {/* ── Hero / Photo Gallery ─────────────────────────── */}
            <div style={{ position: 'relative', height: '380px', overflow: 'hidden', backgroundColor: '#111' }}>
                <img src={biz.image || FALLBACK_IMG} alt={biz.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.src = FALLBACK_IMG }}
                />
                <div style={{ position: 'absolute', inset: 0, background: th.heroOverlay }} />
                <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
                    <h1 style={{
                        fontSize: '2.2rem', fontWeight: '800', color: '#fff',
                        margin: '0 0 0.4rem', textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                        letterSpacing: '-0.02em',
                    }}>{biz.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={18} fill={s <= Math.round(biz.rating || 0) ? '#f59e0b' : 'none'} color="#f59e0b" />
                            ))}
                            <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', marginLeft: '0.3rem' }}>{biz.rating || 'N/A'}</span>
                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>({(biz.reviewCount || 0).toLocaleString()} reviews)</span>
                        </div>
                        {biz.isVerified && <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.2rem',
                            backgroundColor: 'rgba(59,130,246,0.85)', padding: '0.15rem 0.5rem',
                            borderRadius: '50px', fontSize: '0.7rem', fontWeight: '600', color: '#fff',
                        }}><CheckCircle size={12} /> Claimed</div>}
                        {biz.priceLevel && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: '500' }}>{biz.priceLevel}</span>}
                        {biz.tagLabels?.map((t, i) => (
                            <span key={i} style={{
                                color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem',
                                padding: '0.1rem 0.4rem', borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.3)',
                            }}>{t}</span>
                        ))}
                    </div>
                </div>
                {/* See all photos button */}
                <button onClick={() => { setGalleryStartIndex(0); setShowPhotoGallery(true); }} style={{
                    position: 'absolute', bottom: '1.5rem', right: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.45rem 0.9rem', borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.9)', border: 'none',
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem',
                    fontFamily: "'Poppins', sans-serif", color: '#1a1a1a',
                    transition: 'all 0.15s',
                }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff'}
                   onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'}>
                    <Camera size={14} /> See all {allPhotos.length} photos
                </button>
            </div>

            {/* ── Action Buttons Row ───────────────────────────── */}
            <div style={{
                maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem',
                display: 'flex', gap: '0.5rem', borderBottom: `1px solid ${th.border}`,
            }}>
                {/* Write a review */}
                <button onClick={() => setShowReviewModal(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none',
                    backgroundColor: th.redAccent, color: '#fff',
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                    fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s',
                }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                   onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <Star size={15} /> Write a review
                </button>

                {/* Add photo */}
                <button onClick={() => photoInputRef.current?.click()} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 0.9rem', borderRadius: '8px',
                    border: `1.5px solid ${th.border}`, backgroundColor: 'transparent',
                    color: th.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                    fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s',
                }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
                   onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary }}>
                    <ImagePlus size={15} /> Add photo
                </button>

                {/* Share */}
                <button onClick={() => setShowShareModal(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 0.9rem', borderRadius: '8px',
                    border: `1.5px solid ${th.border}`, backgroundColor: 'transparent',
                    color: th.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                    fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s',
                }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
                   onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary }}>
                    <Share2 size={15} /> Share
                </button>

                {/* Save */}
                <button onClick={() => setIsFav(!isFav)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 0.9rem', borderRadius: '8px',
                    border: `1.5px solid ${th.border}`,
                    backgroundColor: isFav ? th.activeBg : 'transparent',
                    color: isFav ? th.text : th.textSecondary,
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                    fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s',
                }} onMouseEnter={e => { if (!isFav) { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}}
                   onMouseLeave={e => { if (!isFav) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary }}}>
                    <Bookmark size={15} fill={isFav ? th.text : 'none'} /> {isFav ? 'Saved' : 'Save'}
                </button>
            </div>

            {/* ── Main Content ─────────────────────────────────── */}
            <div style={{
                maxWidth: '1100px', margin: '0 auto', padding: '1.5rem',
                display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem',
            }}>
                {/* ── LEFT COLUMN ──────────────────────────────── */}
                <div>
                    {/* Deals */}
                    {matchingDeals.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                <Tag size={18} color={th.greenAccent} />
                                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, color: th.text }}>Available Deals</h2>
                                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#fff', backgroundColor: th.greenAccent, padding: '0.1rem 0.4rem', borderRadius: '50px' }}>{matchingDeals.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {matchingDeals.map(d => <MiniDealCard key={d.id} deal={d} th={th} />)}
                            </div>
                        </div>
                    )}

                    {/* About */}
                    {biz.description && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: th.text }}>About This Business</h2>
                            <p style={{ fontSize: '0.88rem', color: th.textSecondary, lineHeight: '1.7', margin: 0 }}>{biz.description}</p>
                        </div>
                    )}

                    {/* User uploaded photos */}
                    {userPhotos.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.8rem', color: th.text }}>Your Photos</h2>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {userPhotos.map((p, i) => (
                                    <div key={i} onClick={() => { setGalleryStartIndex(i + 1); setShowPhotoGallery(true); }}
                                        style={{ width: '100px', height: '75px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${th.border}`, transition: 'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = th.border}>
                                        <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                                <div onClick={() => photoInputRef.current?.click()} style={{
                                    width: '100px', height: '75px', borderRadius: '8px',
                                    border: `2px dashed ${th.border}`, cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', gap: '0.2rem', transition: 'all 0.15s',
                                    color: th.textMuted,
                                }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6' }}
                                   onMouseLeave={e => { e.currentTarget.style.borderColor = th.border; e.currentTarget.style.color = th.textMuted }}>
                                    <ImagePlus size={18} />
                                    <span style={{ fontSize: '0.6rem', fontWeight: '600' }}>Add more</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vibe */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.8rem', color: th.text }}>What's the Vibe?</h2>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {highlights.map((h, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.45rem 0.8rem', borderRadius: '8px',
                                    border: `1px solid ${th.border}`, backgroundColor: th.cardBg,
                                    fontSize: '0.78rem', color: th.textSecondary, fontWeight: '500',
                                }}>
                                    <h.icon size={15} /> {h.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Highlights */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.8rem', color: th.text }}>Highlights from the Business</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                            {[
                                { icon: Percent, label: 'Discounts available' },
                                { icon: Truck, label: 'Catering service' },
                                { icon: Award, label: 'Healthy dining' },
                                { icon: CalendarCheck, label: 'Takes reservations' },
                                { icon: Sparkles, label: 'Fine dining' },
                                { icon: ParkingCircle, label: 'Free parking' },
                            ].map((h, i) => (
                                <div key={i} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    padding: '0.8rem 0.4rem', borderRadius: '10px',
                                    backgroundColor: th.badgeBg, gap: '0.3rem',
                                }}>
                                    <h.icon size={22} color={th.textSecondary} />
                                    <span style={{ fontSize: '0.7rem', color: th.textSecondary, fontWeight: '500', textAlign: 'center' }}>{h.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.8rem', color: th.text }}>Recommended Reviews</h2>
                        {/* Overall Rating */}
                        <div style={{
                            display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
                            padding: '1rem', borderRadius: '12px',
                            backgroundColor: th.cardBg, border: `1px solid ${th.border}`,
                            marginBottom: '1rem',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: th.text, lineHeight: 1 }}>{biz.rating || 'N/A'}</div>
                                <StarRating rating={biz.rating || 0} size={14} showNumber={false} th={th} />
                                <div style={{ fontSize: '0.72rem', color: th.textMuted, marginTop: '0.2rem' }}>{(biz.reviewCount || 0).toLocaleString()} reviews</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                {[5, 4, 3, 2, 1].map((star, i) => (
                                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                                        <span style={{ fontSize: '0.72rem', color: th.textMuted, width: '35px' }}>{star} stars</span>
                                        <div style={{ flex: 1, height: '8px', borderRadius: '4px', backgroundColor: th.badgeBg, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '4px',
                                                width: `${(ratingDist[i] / maxDist) * 100}%`,
                                                backgroundColor: star >= 4 ? th.redAccent : star === 3 ? '#f59e0b' : '#999',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.68rem', color: th.textMuted, width: '25px', textAlign: 'right' }}>{ratingDist[i]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Review list */}
                        {(showAllReviews ? reviews : reviews.slice(0, 3)).map(r => (
                            <ReviewCard key={r.id} review={r} th={th} />
                        ))}
                        {reviews.length > 3 && (
                            <button onClick={() => setShowAllReviews(!showAllReviews)} style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                marginTop: '0.8rem', padding: '0.5rem 1rem', borderRadius: '8px',
                                border: `1.5px solid ${th.border}`, backgroundColor: 'transparent',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem',
                                fontFamily: "'Poppins', sans-serif", color: th.text,
                            }}>
                                {showAllReviews ? <><ChevronUp size={15} /> Show less</> : <><ChevronDown size={15} /> Show all {reviews.length} reviews</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── RIGHT COLUMN (Sidebar) ───────────────────── */}
                <div>
                    {/* Order / CTA Card */}
                    <div style={{
                        padding: '1.2rem', borderRadius: '12px',
                        border: `1px solid ${th.border}`, backgroundColor: th.cardBg,
                        marginBottom: '1rem',
                    }}>
                        {biz.website && (
                            <a href={biz.website} target="_blank" rel="noopener noreferrer" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.4rem', width: '100%', padding: '0.65rem',
                                borderRadius: '8px', backgroundColor: th.redAccent,
                                color: '#fff', textDecoration: 'none', fontWeight: '700',
                                fontSize: '0.88rem', marginBottom: '0.6rem',
                                fontFamily: "'Poppins', sans-serif",
                            }}><ExternalLink size={16} /> Order takeout or delivery</a>
                        )}

                        {biz.features?.includes('Takeout Available') && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem', borderRadius: '8px',
                                backgroundColor: th.badgeBg, marginBottom: '0.6rem',
                            }}>
                                <Truck size={18} color={th.textSecondary} />
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: th.text }}>Takeout available</div>
                                    <div style={{ fontSize: '0.7rem', color: th.greenAccent, fontWeight: '500' }}>Order now</div>
                                </div>
                            </div>
                        )}

                        {/* Website */}
                        {biz.website && (
                            <a href={biz.website} target="_blank" rel="noopener noreferrer" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 0', borderBottom: `1px solid ${th.border}`,
                                textDecoration: 'none', color: th.text,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Globe size={16} color={th.textMuted} />
                                    <span style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: '500' }}>{biz.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                                </div>
                                <ExternalLink size={14} color={th.textMuted} />
                            </a>
                        )}

                        {/* Phone */}
                        {biz.phone && (
                            <a href={`tel:${biz.phone}`} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 0', borderBottom: `1px solid ${th.border}`,
                                textDecoration: 'none', color: th.text,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Phone size={16} color={th.textMuted} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>{biz.phone}</span>
                                </div>
                                <Phone size={14} color={th.textMuted} />
                            </a>
                        )}

                        {/* Address + Get Directions → opens Google Maps */}
                        {biz.address && (
                            <div onClick={openDirections} style={{
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                padding: '0.5rem 0', cursor: 'pointer',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                    <MapPin size={16} color={th.textMuted} style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.1rem' }}>Get Directions</div>
                                        <span style={{ fontSize: '0.78rem', color: th.textSecondary, lineHeight: '1.4' }}>{biz.address}</span>
                                    </div>
                                </div>
                                <Navigation2 size={14} color={th.textMuted} style={{ flexShrink: 0, marginTop: '2px' }} />
                            </div>
                        )}
                    </div>

                    {/* Hours Card */}
                    {hours.length > 0 && (
                        <div style={{
                            padding: '1.2rem', borderRadius: '12px',
                            border: `1px solid ${th.border}`, backgroundColor: th.cardBg,
                            marginBottom: '1rem',
                        }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: th.text, margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Clock size={16} /> Location & Hours
                            </h3>
                            {(showAllHours ? hours : hours.slice(0, 3)).map((h, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '0.25rem 0',
                                    fontWeight: h.day === todayDay ? '700' : '400',
                                }}>
                                    <span style={{ fontSize: '0.78rem', color: h.day === todayDay ? th.text : th.textSecondary }}>{h.day}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.78rem', color: th.textSecondary }}>{h.hours}</span>
                                        {h.day === todayDay && <span style={{ fontSize: '0.65rem', fontWeight: '700', color: th.greenAccent }}>Open now</span>}
                                    </div>
                                </div>
                            ))}
                            {hours.length > 3 && (
                                <button onClick={() => setShowAllHours(!showAllHours)} style={{
                                    marginTop: '0.4rem', background: 'none', border: 'none',
                                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                                    color: '#3b82f6', fontFamily: "'Poppins', sans-serif",
                                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                                }}>
                                    {showAllHours ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> Show all hours</>}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Mini Map */}
                    {biz.lat && biz.lng && (
                        <div style={{
                            borderRadius: '12px', overflow: 'hidden',
                            border: `1px solid ${th.border}`, height: '200px',
                            marginBottom: '1rem',
                        }}>
                            <MapContainer center={[biz.lat, biz.lng]} zoom={15}
                                style={{ width: '100%', height: '100%' }}
                                zoomControl={false} scrollWheelZoom={false} dragging={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[biz.lat, biz.lng]} icon={bizPinIcon()}>
                                    <Popup><strong>{biz.name}</strong><br />{biz.location}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    )}

                    {/* People also searched for */}
                    <div style={{
                        padding: '1rem', borderRadius: '12px',
                        border: `1px solid ${th.border}`, backgroundColor: th.cardBg,
                    }}>
                        <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: th.text, margin: '0 0 0.6rem' }}>People also searched for</h3>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {(biz.tagLabels || ['Restaurants', 'Takeout', 'Dinner']).concat(['Seafood', 'Noodles', 'Brunch']).slice(0, 6).map((t, i) => (
                                <button key={i} onClick={() => navigate('/dashboard')} style={{
                                    padding: '0.3rem 0.6rem', borderRadius: '50px',
                                    border: `1px solid ${th.border}`, backgroundColor: 'transparent',
                                    cursor: 'pointer', fontSize: '0.72rem', color: th.textSecondary,
                                    fontFamily: "'Poppins', sans-serif", fontWeight: '500',
                                }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; e.currentTarget.style.color = th.text }}
                                   onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = th.textSecondary }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${th.border}`, padding: '1.5rem', textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ fontSize: '0.72rem', color: th.textMuted }}>© 2026 Spark. All rights reserved.</p>
            </div>
        </div>
    );
};

/* ─── Styles ───────────────────────────────────────────────── */
const bpStyles = document.createElement('style');
bpStyles.textContent = `
.biz-pin { background: none !important; border: none !important; }
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
`;
if (!document.querySelector('[data-biz-page-styles]')) {
    bpStyles.setAttribute('data-biz-page-styles', '');
    document.head.appendChild(bpStyles);
}

export default BusinessPage;