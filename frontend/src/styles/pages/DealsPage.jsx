/**
 * DealsPage.jsx — Real curated deals only
 * No fake/randomized API deals — all handpicked Utah businesses
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Heart, Star, MapPin, ChevronLeft, ChevronRight, Tag, Sparkles,
    Clock, Gift, ArrowRight, Loader2, Scissors, Utensils,
    Flame, Award, Coffee, ShoppingBag, Ticket,
    Search, X, Wrench, Dumbbell, Tent
} from 'lucide-react';

const API = 'http://localhost:5001/api';

/* ─── Curated deals database (real UT businesses with realistic pricing) */
/* ─── All real Utah deals ──────────────────────────────────── */
const CURATED_DEALS = [
    // Health & Beauty
    { id: 'c1', name: 'Spa Holiday', title: '60-Min Couples Massage or Single Massage', location: '4970 South 900 East, Murray', distance: '7.4 mi', rating: 4.7, reviews: 767, originalPrice: 260, salePrice: 189, finalPrice: 151.20, discount: 27, code: 'LOVE', category: 'Health & Beauty', subcategory: 'Spas', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=480&h=320&fit=crop', popular: true },
    { id: 'c2', name: 'Raiya Head Spa', title: 'Premier Head Spa for Singles or Couples with Scalp Massage & Analysis', location: '1290 South 500 West, Woods Cross', distance: '16.8 mi', rating: 5.0, reviews: 11, originalPrice: 105, salePrice: 75, finalPrice: 52.75, discount: 29, code: 'LOVE', category: 'Health & Beauty', subcategory: 'Spas', image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=480&h=320&fit=crop', popular: true },
    { id: 'c3', name: 'Rebalance Life and Body', title: 'One or Three Sessions of 60 or 90 minute Swedish Massages Package', location: '9035 South 1300 East, Sandy', distance: '9.1 mi', rating: 4.9, reviews: 17, originalPrice: 70, salePrice: 56, finalPrice: 38.92, discount: 20, code: 'LOVE', category: 'Health & Beauty', subcategory: 'Massage', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=480&h=320&fit=crop', popular: true },
    { id: 'c4', name: 'Evolve Wellness Collective', title: 'One Salt Cave Session or One Month of Unlimited Salt Cave Sessions', location: '10382 South Jordan Gateway, South Jordan', distance: '8.1 mi', rating: 4.8, reviews: 22, originalPrice: 25, salePrice: 15, finalPrice: 10.16, discount: 40, code: 'LOVE', category: 'Health & Beauty', subcategory: 'Spas', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=480&h=320&fit=crop', popular: true },
    { id: 'c5', name: 'Sola Salon Studios', title: 'Haircut & Style with Optional Color Treatment', location: '11467 South Parkway, South Jordan', distance: '3.2 mi', rating: 4.7, reviews: 89, originalPrice: 85, salePrice: 55, finalPrice: 44.00, discount: 35, code: 'STYLE', category: 'Health & Beauty', subcategory: 'Hair Salons', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=480&h=320&fit=crop', popular: false },
    { id: 'c6', name: 'Zen Nail Bar', title: 'Gel Manicure and Spa Pedicure Combo', location: '7157 South Plaza Center Dr, West Jordan', distance: '4.5 mi', rating: 4.6, reviews: 134, originalPrice: 65, salePrice: 42, finalPrice: 33.60, discount: 35, code: 'GLOW', category: 'Health & Beauty', subcategory: 'Nail Salons', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=480&h=320&fit=crop', popular: false },
    { id: 'c7', name: 'Hand & Stone Massage', title: 'Introductory Hot Stone Massage — 50 Minutes', location: '6949 S Redwood Rd, West Jordan', distance: '5.0 mi', rating: 4.5, reviews: 241, originalPrice: 100, salePrice: 69, finalPrice: 55.20, discount: 31, code: 'RELAX', category: 'Health & Beauty', subcategory: 'Massage', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=480&h=320&fit=crop', popular: true },
    { id: 'c8', name: 'European Wax Center', title: 'Complimentary Wax on First Visit + 50% Off Next', location: '11433 S Parkway Plaza Dr, South Jordan', distance: '3.1 mi', rating: 4.4, reviews: 178, originalPrice: 50, salePrice: 0, finalPrice: 0, discount: 100, code: 'FREE', category: 'Health & Beauty', subcategory: 'Spas', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=480&h=320&fit=crop', popular: false },

    // Food & Drink
    { id: 'c10', name: 'Waffle Love', title: 'Two Signature Liege Waffles with Toppings', location: '1470 W 9000 S, West Jordan', distance: '5.2 mi', rating: 4.6, reviews: 312, originalPrice: 28, salePrice: 18, finalPrice: 14.40, discount: 36, code: 'YUMMY', category: 'Food & Drink', subcategory: 'Bakeries', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=480&h=320&fit=crop', popular: true },
    { id: 'c11', name: 'Cupbop', title: 'Two Korean BBQ Bowls with Drinks', location: '11449 S Parkway Plaza Dr, South Jordan', distance: '3.4 mi', rating: 4.5, reviews: 462, originalPrice: 32, salePrice: 22, finalPrice: 17.60, discount: 31, code: 'BOWLS', category: 'Food & Drink', subcategory: 'Dinner', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=480&h=320&fit=crop', popular: true },
    { id: 'c12', name: 'Costa Vida', title: '$30 Worth of Fresh Mexican Food for $18', location: '10432 S Redwood Rd, South Jordan', distance: '4.1 mi', rating: 4.4, reviews: 205, originalPrice: 30, salePrice: 18, finalPrice: 14.40, discount: 40, code: 'FRESH', category: 'Food & Drink', subcategory: 'Mexican', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=480&h=320&fit=crop', popular: false },
    { id: 'c13', name: 'Crumbl Cookies', title: 'Box of 6 Rotating Weekly Cookie Flavors', location: '11587 S District Drive, South Jordan', distance: '2.8 mi', rating: 4.8, reviews: 578, originalPrice: 28, salePrice: 22, finalPrice: 17.60, discount: 21, code: 'SWEET', category: 'Food & Drink', subcategory: 'Bakeries', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=480&h=320&fit=crop', popular: true },
    { id: 'c14', name: 'Cafe Rio', title: 'Two Entrees with Drinks at Any Utah Location', location: '10309 S Jordan Gateway, South Jordan', distance: '3.9 mi', rating: 4.5, reviews: 387, originalPrice: 36, salePrice: 24, finalPrice: 19.20, discount: 33, code: 'RIO', category: 'Food & Drink', subcategory: 'Mexican', image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=480&h=320&fit=crop', popular: false },
    { id: 'c15', name: 'Swig', title: 'Five Custom Dirty Sodas (Any Size)', location: '11453 S Parkway Plaza Dr, South Jordan', distance: '3.3 mi', rating: 4.7, reviews: 229, originalPrice: 30, salePrice: 20, finalPrice: 16.00, discount: 33, code: 'SWIG', category: 'Food & Drink', subcategory: 'Coffee & Cafes', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=480&h=320&fit=crop', popular: false },
    { id: 'c16', name: 'R&R BBQ', title: 'Two-Meat Combo Plate with Two Sides for Two People', location: '307 W 600 S, Salt Lake City', distance: '14.2 mi', rating: 4.7, reviews: 1842, originalPrice: 44, salePrice: 30, finalPrice: 24.00, discount: 32, code: 'SMOKE', category: 'Food & Drink', subcategory: 'Dinner', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=480&h=320&fit=crop', popular: true },
    { id: 'c17', name: 'Beans & Brews', title: 'Buy 5 Drinks, Get 5 Free — Any Size', location: '1098 W South Jordan Pkwy, South Jordan', distance: '2.6 mi', rating: 4.3, reviews: 156, originalPrice: 35, salePrice: 17.50, finalPrice: 14.00, discount: 50, code: 'BREW', category: 'Food & Drink', subcategory: 'Coffee & Cafes', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=480&h=320&fit=crop', popular: false },

    // Activities & Fun
    { id: 'c20', name: 'Uptown Jungle Fun Park Sandy', title: '3-Hour Trampoline Time — Unlimited Fun Activities Any Day', location: '7850 South 1300 East, Sandy', distance: '8.4 mi', rating: 4.8, reviews: 377, originalPrice: 22, salePrice: 16, finalPrice: 12.80, discount: 27, code: 'LOVE', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=480&h=320&fit=crop', popular: true },
    { id: 'c21', name: 'Momentum Indoor Climbing', title: 'Explore 47,000 sq ft of Indoor Climbing Fun in Salt Lake City!', location: '7210 Union Park Avenue, Midvale', distance: '7.9 mi', rating: 4.9, reviews: 46, originalPrice: 40, salePrice: 20, finalPrice: 15.00, discount: 50, code: 'LOVE', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=480&h=320&fit=crop', popular: true },
    { id: 'c22', name: 'Color Me Mine', title: 'Pottery Painting Session for Two with Studio Fee Included', location: '6985 S Park Centre Dr, Salt Lake City', distance: '6.1 mi', rating: 4.6, reviews: 156, originalPrice: 50, salePrice: 35, finalPrice: 28.00, discount: 30, code: 'CREATE', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=480&h=320&fit=crop', popular: false },
    { id: 'c23', name: 'TopGolf', title: 'Two Hours of Bay Time with $20 Game Play Credits', location: '920 Jordan River Blvd, Midvale', distance: '9.2 mi', rating: 4.5, reviews: 289, originalPrice: 75, salePrice: 50, finalPrice: 40.00, discount: 33, code: 'SWING', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=480&h=320&fit=crop', popular: true },
    { id: 'c24', name: 'Fat Cats Bowling', title: 'Two Games of Bowling with Shoe Rental for Up to 4 People', location: '3739 W 2400 S, West Valley City', distance: '11.3 mi', rating: 4.3, reviews: 198, originalPrice: 60, salePrice: 38, finalPrice: 30.40, discount: 37, code: 'STRIKE', category: 'Activities', subcategory: 'Bowling', image: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=480&h=320&fit=crop', popular: false },
    { id: 'c25', name: 'Flowrider Indoor Surfing', title: 'One-Hour Indoor Surfing Session with Gear Included', location: '7500 S State St, Midvale', distance: '8.8 mi', rating: 4.6, reviews: 94, originalPrice: 35, salePrice: 22, finalPrice: 17.60, discount: 37, code: 'SURF', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1502680390548-bdbac40ae2ea?w=480&h=320&fit=crop', popular: true },
    { id: 'c26', name: 'Escape Room Orem', title: 'Escape Room Experience for Up to 6 Players — Any Room', location: '575 E University Pkwy, Orem', distance: '28.1 mi', rating: 4.8, reviews: 312, originalPrice: 120, salePrice: 72, finalPrice: 57.60, discount: 40, code: 'ESCAPE', category: 'Activities', subcategory: 'Things to Do', image: 'https://images.unsplash.com/photo-1587825140708-dfaf18c4c8bc?w=480&h=320&fit=crop', popular: false },

    // Auto & Home
    { id: 'c30', name: 'Oilstop Drive Thru Oil Change', title: 'Up to 50% Off on Oil Change at Oilstop', location: '5534 West 3500 South, West Valley City', distance: '3.4 mi', rating: 4.7, reviews: 462, originalPrice: 80, salePrice: 40, finalPrice: 32.00, discount: 50, code: 'LOVE', category: 'Auto & Home', subcategory: 'Auto Repair', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=480&h=320&fit=crop', popular: true },
    { id: 'c31', name: 'Wasatch Mobile Detailing', title: 'Full Interior & Exterior Detail for Sedan or SUV', location: 'Mobile — South Jordan Area', distance: '0 mi', rating: 4.9, reviews: 67, originalPrice: 180, salePrice: 120, finalPrice: 96.00, discount: 33, code: 'CLEAN', category: 'Auto & Home', subcategory: 'Auto Repair', image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=480&h=320&fit=crop', popular: false },
    { id: 'c32', name: 'Safelite AutoGlass', title: 'Windshield Chip Repair — Up to 3 Chips Free with Insurance', location: '8786 S Redwood Rd, West Jordan', distance: '4.7 mi', rating: 4.3, reviews: 523, originalPrice: 75, salePrice: 0, finalPrice: 0, discount: 100, code: 'GLASS', category: 'Auto & Home', subcategory: 'Auto Repair', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=480&h=320&fit=crop', popular: true },
    { id: 'c33', name: 'Molly Maid', title: 'Two-Hour Deep Clean for Homes Up to 2,000 sq ft', location: 'South Jordan Service Area', distance: '0 mi', rating: 4.6, reviews: 89, originalPrice: 200, salePrice: 139, finalPrice: 111.20, discount: 31, code: 'TIDY', category: 'Auto & Home', subcategory: 'Home', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=480&h=320&fit=crop', popular: false },
];

const PROMOS = [
    { id: 'p1', title: 'Support Local This Season', subtitle: 'Save up to 50% at small businesses near you', cta: 'Shop Local Deals', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=400&fit=crop' },
    { id: 'p2', title: 'Foodie Favorites Week', subtitle: 'Save big on the best local restaurants and cafes near you!', cta: 'View Food Deals', gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop' },
];

const CATEGORY_BANNERS = [
    { id: 'b1', title: 'Food & Drink Deals', subtitle: 'Save on local restaurants & cafes', icon: Utensils, bg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=300&fit=crop', filter: 'Food & Drink' },
    { id: 'b2', title: 'Beauty & Spa', subtitle: 'Top-rated salons & spas near you', icon: Scissors, bg: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=300&fit=crop', filter: 'Health & Beauty' },
    { id: 'b3', title: 'Activities & Fun', subtitle: 'Experiences the whole family will love', icon: Ticket, bg: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=300&fit=crop', filter: 'Activities' },
    { id: 'b4', title: 'Auto & Home Services', subtitle: 'Keep your car and home in top shape', icon: Wrench, bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop', filter: 'Auto & Home' },
];

/* ─── Star rating ──────────────────────────────────────────── */
const Stars = ({ rating, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
        {[1,2,3,4,5].map(i => (
            <Star key={i} size={12} fill={i <= Math.floor(rating) ? '#f59e0b' : (i - 0.5 <= rating ? '#f59e0b' : 'none')}
                color="#f59e0b" style={{ opacity: i <= rating ? 1 : 0.3 }} />
        ))}
        <span style={{ fontSize: '0.72rem', fontWeight: '600', marginLeft: '0.15rem' }}>{rating}</span>
        {count != null && <span style={{ fontSize: '0.68rem', color: '#999' }}>({count.toLocaleString()})</span>}
    </div>
);

/* ─── Deal Card ────────────────────────────────────────────── */
const DealCard = ({ deal, th, onFav, isFav, compact }) => {
    const [imgErr, setImgErr] = useState(false);
    return (
        <div style={{
            width: compact ? '220px' : '100%', minWidth: compact ? '220px' : 'auto',
            backgroundColor: th.cardBg, borderRadius: '12px', overflow: 'hidden',
            border: `1px solid ${th.border}`, transition: 'all 0.2s',
            cursor: 'pointer', flexShrink: 0,
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
            <div style={{ position: 'relative', height: compact ? '140px' : '180px', overflow: 'hidden', backgroundColor: th.badgeBg }}>
                <img src={imgErr ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=480&h=320&fit=crop' : deal.image}
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
const DealsContent = ({ th }) => {
    const [favs, setFavs] = useState(new Set());
    const [activeFilter, setActiveFilter] = useState('All');
    const [dealSearch, setDealSearch] = useState('');

    const toggleFav = useCallback(id => {
        setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }, []);

    const searchFilter = (deals) => {
        if (!dealSearch.trim()) return deals;
        const q = dealSearch.toLowerCase();
        return deals.filter(d =>
            d.name.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            (d.location && d.location.toLowerCase().includes(q)) ||
            (d.subcategory && d.subcategory.toLowerCase().includes(q))
        );
    };

    const trendingDeals = searchFilter(CURATED_DEALS.filter(d => d.popular)).slice(0, 12);
    const filteredDeals = searchFilter(activeFilter === 'All' ? CURATED_DEALS : CURATED_DEALS.filter(d => d.category === activeFilter));
    const healthDeals = searchFilter(CURATED_DEALS.filter(d => d.category === 'Health & Beauty'));
    const foodDeals = searchFilter(CURATED_DEALS.filter(d => d.category === 'Food & Drink'));
    const activityDeals = searchFilter(CURATED_DEALS.filter(d => d.category === 'Activities'));
    const filters = ['All', 'Health & Beauty', 'Food & Drink', 'Activities', 'Auto & Home'];

    return (
        <div style={{ height: '100%', overflowY: 'auto', backgroundColor: th.bgAlt }}>
            {/* Hero */}
            <div style={{ background: PROMOS[0].gradient, position: 'relative', overflow: 'hidden', padding: '2.5rem 2rem', minHeight: '160px' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${PROMOS[0].image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50px', padding: '0.3rem 0.8rem', marginBottom: '0.8rem', fontSize: '0.72rem', color: '#fff', fontWeight: '600' }}><Sparkles size={13} /> Spark Deals</div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem', lineHeight: '1.2' }}>{PROMOS[0].title}</h1>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 1rem' }}>{PROMOS[0].subtitle}</p>
                    <button style={{ padding: '0.6rem 1.4rem', borderRadius: '10px', backgroundColor: '#fff', color: '#1a1a1a', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{PROMOS[0].cta} <ArrowRight size={16} /></button>
                </div>
            </div>

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
                    <Carousel th={th}>{trendingDeals.map(deal => <DealCard key={deal.id} deal={deal} th={th} onFav={toggleFav} isFav={favs.has(deal.id)} compact />)}</Carousel>
                </div>}

                {/* Category banners */}
                {!dealSearch.trim() && <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                        {CATEGORY_BANNERS.map(b => (
                            <div key={b.id} onClick={() => setActiveFilter(b.filter)} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: '130px', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <img src={b.bg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 100%)' }} />
                                <div style={{ position: 'absolute', bottom: '0.8rem', left: '1rem', color: '#fff' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.15rem' }}>{b.title}</h3>
                                    <p style={{ fontSize: '0.72rem', opacity: 0.85, margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ArrowRight size={12} /> {b.subtitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>}

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {filters.map(f => (<button key={f} onClick={() => setActiveFilter(f)} style={{ padding: '0.35rem 0.9rem', borderRadius: '50px', fontSize: '0.78rem', fontWeight: activeFilter === f ? '700' : '500', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", border: activeFilter === f ? 'none' : `1.5px solid ${th.border}`, backgroundColor: activeFilter === f ? th.accent : 'transparent', color: activeFilter === f ? th.accentText : th.textSecondary, transition: '0.15s' }}>{f}</button>))}
                </div>

                {/* Category sections */}
                {(activeFilter === 'All' || activeFilter === 'Health & Beauty') && healthDeals.length > 0 && <div style={{ marginBottom: '2rem' }}>
                    <SectionHead th={th} icon={Scissors} title="Health & Beauty Deals" subtitle="Salons, spas, and wellness" action />
                    <Carousel th={th}>{healthDeals.map(d => <DealCard key={d.id} deal={d} th={th} onFav={toggleFav} isFav={favs.has(d.id)} compact />)}</Carousel>
                </div>}

                {(activeFilter === 'All' || activeFilter === 'Food & Drink') && foodDeals.length > 0 && <div style={{ marginBottom: '2rem' }}>
                    <SectionHead th={th} icon={Utensils} title="Food & Drink Deals" subtitle="Restaurants, cafes, and treats" action />
                    <Carousel th={th}>{foodDeals.map(d => <DealCard key={d.id} deal={d} th={th} onFav={toggleFav} isFav={favs.has(d.id)} compact />)}</Carousel>
                </div>}

                {(activeFilter === 'All' || activeFilter === 'Activities') && activityDeals.length > 0 && <div style={{ marginBottom: '2rem' }}>
                    <SectionHead th={th} icon={Ticket} title="Activities & Fun" subtitle="Experiences and entertainment" action />
                    <Carousel th={th}>{activityDeals.map(d => <DealCard key={d.id} deal={d} th={th} onFav={toggleFav} isFav={favs.has(d.id)} compact />)}</Carousel>
                </div>}

                {/* All deals grid */}
                <div style={{ marginBottom: '2rem' }}>
                    <SectionHead th={th} icon={Tag} title={activeFilter === 'All' ? 'All Deals' : `${activeFilter} Deals`} subtitle={`${filteredDeals.length} deals available`} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {filteredDeals.map(d => <DealCard key={d.id} deal={d} th={th} onFav={toggleFav} isFav={favs.has(d.id)} />)}
                    </div>
                    {filteredDeals.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: th.textMuted }}>
                        <Tag size={40} style={{ opacity: 0.3, marginBottom: '0.8rem' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{dealSearch ? `No deals matching "${dealSearch}"` : 'No deals in this category yet'}</p>
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
        </div>
    );
};

export default DealsContent;