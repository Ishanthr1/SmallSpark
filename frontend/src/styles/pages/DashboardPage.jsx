import React, {useState, useRef, useEffect, useCallback} from 'react';
import {useUser, UserButton, useClerk} from '@clerk/clerk-react';
import {useNavigate} from 'react-router-dom';
import {MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Compass, Heart, Tag, Star, Settings, Search, MapPin, X, ChevronDown,
    ChevronLeft, ChevronRight, Menu, Utensils, Home, Car, Stethoscope,
    Plane, MoreHorizontal, Scissors, Wrench, Dumbbell, Music, ShoppingBag,
    Coffee, Pizza, Truck, Flame, Waves, Tent, Bike, Hotel, Sparkles, Zap,
    BookOpen, Flower2, Dog, Award,
    Phone, Droplets, Wind, Hammer, PaintBucket, Plug, Key,
    Thermometer, Sofa, Leaf, Shirt,
    HandMetal, Gamepad2, Church, Ticket, Landmark, ParkingCircle,
    Baby, Loader2, AlertCircle, Navigation, Glasses, Bone, PersonStanding,
    Clock, Navigation2, ArrowRight, RefreshCw, Bot, Users, Trash2, Save
} from 'lucide-react';

import DealsContent from './DealsPage';
import FriendsPage from './FriendsPage';
import { getPreferences, setPreferences } from '../../lib/preferences';

const API = 'http://localhost:5000/api';

/* ─── Fetch helper ─────────────────────────────────────────── */
async function apiFetch(url) {
    let resp;
    try {
        resp = await fetch(url);
    } catch (e) {
        throw new Error('Cannot connect to server. Make sure the backend is running:\n  cd backend && python app.py');
    }
    const data = await resp.json().catch(() => null);
    if (!data) throw new Error('Invalid server response');
    if (data.error && (!data.businesses || data.businesses.length === 0)) {
        throw new Error(data.error);
    }
    return data;
}

const light = {
    bg: '#fff',
    bgAlt: '#f9f9f9',
    sidebar: '#f7f7f7',
    sidebarBorder: '#ebebeb',
    text: '#1a1a1a',
    textSecondary: '#555',
    textMuted: '#999',
    border: '#e8e8e8',
    cardBg: '#fff',
    accent: '#1a1a1a',
    accentText: '#fff',
    hoverBg: '#f0f0f0',
    activeBg: '#e8e8e8',
    activeAccent: '#1a1a1a',
    badgeBg: '#f0f0f0',
    inputBg: '#f5f5f5',
    dropdownBg: '#fff',
    categoryBar: '#fafafa',
    categoryBorder: '#eee'
};
const dark = {
    bg: '#0a0a0a',
    bgAlt: '#0f0f0f',
    sidebar: '#0f0f0f',
    sidebarBorder: '#1e1e1e',
    text: '#f0f0f0',
    textSecondary: '#aaa',
    textMuted: '#666',
    border: '#222',
    cardBg: '#141414',
    accent: '#f0f0f0',
    accentText: '#0a0a0a',
    hoverBg: '#1a1a1a',
    activeBg: '#222',
    activeAccent: '#f0f0f0',
    badgeBg: '#1e1e1e',
    inputBg: '#141414',
    dropdownBg: '#161616',
    categoryBar: '#111',
    categoryBorder: '#222'
};

const CUISINE_OPTIONS = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Vietnamese', 'Korean', 'Mediterranean',
    'American', 'French', 'Vegan', 'Vegetarian', 'Seafood', 'Bakeries', 'Coffee & Cafes',
    'Pizza', 'Breakfast & Brunch'
];

const CATEGORY_OPTIONS = [
    'Restaurants', 'Home & Garden', 'Auto Services', 'Health & Beauty', 'Travel & Activities',
    'Nightlife', 'Shopping', 'Gyms', 'Hotels'
];

const PRICE_LEVELS = [
    {v: 1, l: '$'}, {v: 2, l: '$$'}, {v: 3, l: '$$$'}, {v: 4, l: '$$$$'}
];

const DISTANCE_OPTIONS = [
    {v: 1000, l: 'Walking (1 mi)'}, {v: 3200, l: 'Biking (2 mi)'},
    {v: 8000, l: "Bird's-eye (3 mi)"}, {v: 16000, l: 'Driving (5 mi)'}
];

const mainCategories = [
    {
        id: 'restaurants',
        label: 'Restaurants',
        icon: Utensils,
        subs: [{name: 'Takeout', icon: ShoppingBag}, {name: 'Lunch', icon: Utensils}, {
            name: 'Mexican',
            icon: Flame
        }, {name: 'Delivery', icon: Truck}, {name: 'Dinner', icon: Star}, {
            name: 'Bakeries',
            icon: Award
        }, {name: 'Coffee & Cafes', icon: Coffee}, {name: 'Italian', icon: Pizza}, {
            name: 'Pizza',
            icon: Pizza
        }, {name: 'Breakfast & Brunch', icon: Coffee}, {name: 'Chinese', icon: Utensils}]
    },
    {
        id: 'home',
        label: 'Home & Garden',
        icon: Home,
        subs: [{name: 'Contractors', icon: Hammer}, {name: 'Roofing', icon: Home}, {
            name: 'Florists',
            icon: Flower2
        }, {name: 'Plumbers', icon: Droplets}, {name: 'Locksmiths', icon: Key}, {
            name: 'Electricians',
            icon: Plug
        }, {name: 'Painters', icon: PaintBucket}, {name: 'HVAC', icon: Thermometer}, {
            name: 'Landscaping',
            icon: Leaf
        }, {name: 'Furniture', icon: Sofa}, {name: 'Nurseries', icon: Flower2}]
    },
    {
        id: 'auto',
        label: 'Auto Services',
        icon: Car,
        subs: [{name: 'Auto Repair', icon: Wrench}, {name: 'Car Wash', icon: Droplets}, {
            name: 'Parking',
            icon: ParkingCircle
        }, {name: 'Tires', icon: Car}, {name: 'Car Dealers', icon: Car}]
    },
    {
        id: 'health',
        label: 'Health & Beauty',
        icon: Stethoscope,
        subs: [{name: 'Dentists', icon: PersonStanding}, {name: 'Nail Salons', icon: HandMetal}, {
            name: 'Doctors',
            icon: Stethoscope
        }, {name: 'Barbers', icon: Scissors}, {name: 'Chiropractors', icon: Bone}, {
            name: 'Massage',
            icon: HandMetal
        }, {name: 'Spas', icon: Waves}, {name: 'Optometrists', icon: Glasses}, {name: 'Hair Salons', icon: Scissors}]
    },
    {
        id: 'travel',
        label: 'Travel & Activities',
        icon: Plane,
        subs: [{name: 'Things to Do', icon: Compass}, {name: 'Bookstores', icon: BookOpen}, {
            name: 'Kids Activities',
            icon: Baby
        }, {name: 'Campgrounds', icon: Tent}, {name: 'Venues & Events', icon: Ticket}, {
            name: 'Bowling',
            icon: Gamepad2
        }, {name: 'Churches', icon: Church}, {name: 'Hotels', icon: Hotel}, {
            name: 'Swimming Pools',
            icon: Waves
        }, {name: 'Shopping Malls', icon: ShoppingBag}, {name: 'Nightlife', icon: Music}]
    },
    {
        id: 'more',
        label: 'More',
        icon: MoreHorizontal,
        subs: [{name: 'Dry Cleaning', icon: Wind}, {name: 'Pet Groomers', icon: Dog}, {
            name: 'Laundromats',
            icon: Shirt
        }, {name: 'Banks', icon: Landmark}, {name: 'Thrift Stores', icon: ShoppingBag}, {
            name: 'Gyms',
            icon: Dumbbell
        }, {name: 'Tailors', icon: Scissors}, {name: 'Yoga & Pilates', icon: PersonStanding}]
    },
];

const navTabs = [
    {id: 'discover', label: 'Discover', icon: Compass},
    {id: 'favorites', label: 'Favorites', icon: Heart},
    {id: 'deals', label: 'Deals', icon: Tag},
    {id: 'reviews', label: 'My Reviews', icon: Star},
    {id: 'friends', label: 'Friends', icon: Users},
];

function pinIcon(h) {
    const c = h ? '#ef4444' : '#1a1a1a', s = h ? 30 : 22;
    return L.divIcon({
        className: 'mp',
        html: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" stroke="#fff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`,
        iconSize: [s, s],
        iconAnchor: [s / 2, s],
        popupAnchor: [0, -s]
    })
}

function LocUser({onLoc}) {
    const m = useMapEvents({
        locationfound(e) {
            onLoc(e.latlng);
            m.flyTo(e.latlng, 14)
        }
    });
    useEffect(() => {
        m.locate({setView: false})
    }, [m]);
    return null
}

/* ─── FlyTo — only flies when target actually changes ──────── */
function FlyTo({c, z}) {
    const m = useMap();
    const lastRef = useRef(null);
    useEffect(() => {
        if (!c) return;
        const key = `${c[0].toFixed(4)},${c[1].toFixed(4)}`;
        if (lastRef.current === key) return;
        lastRef.current = key;
        m.flyTo(c, z || 14, {duration: 1});
    }, [c, z, m]);
    return null;
}

/* ─── Category Bar with AI Search button ───────────────────── */
const CatBar = ({th, onSel, sel, onAISearch}) => {
    const [h, sH] = useState(null);
    const t = useRef(null);

    return (
        <div
            style={{
                backgroundColor: th.categoryBar,
                borderBottom: `1px solid ${th.categoryBorder}`,
                position: "relative",
                zIndex: 60,
            }}
        >
            <div
                style={{
                    display: "flex",
                    padding: "0.35rem 1rem",
                    alignItems: "center",
                }}
            >
                {mainCategories.map((c) => {
                    const o = h === c.id;

                    return (
                        <div
                            key={c.id}
                            style={{position: "relative"}}
                            onMouseEnter={() => {
                                clearTimeout(t.current);
                                sH(c.id);
                            }}
                            onMouseLeave={() => {
                                t.current = setTimeout(() => sH(null), 200);
                            }}
                        >
                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    padding: "0.7rem 0.8rem",
                                    fontSize: "0.82rem",
                                    fontWeight: "500",
                                    color: o ? th.text : th.textSecondary,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    fontFamily: "'Poppins',sans-serif",
                                    whiteSpace: "nowrap",
                                    borderBottom: o
                                        ? `2px solid ${th.accent}`
                                        : "2px solid transparent",
                                }}
                            >
                                {c.label}
                                <ChevronDown
                                    size={12}
                                    style={{
                                        transform: o ? "rotate(180deg)" : "",
                                        transition: "0.2s",
                                    }}
                                />
                            </button>

                            {o && (
                                <div
                                    onMouseEnter={() => {
                                        clearTimeout(t.current);
                                        sH(c.id);
                                    }}
                                    onMouseLeave={() => {
                                        t.current = setTimeout(() => sH(null), 200);
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        backgroundColor: th.dropdownBg,
                                        border: `1px solid ${th.border}`,
                                        borderRadius: "12px",
                                        padding: "0.65rem",
                                        boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                                        zIndex: 100,
                                        minWidth: "360px",
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2,1fr)",
                                        gap: "0.08rem",
                                    }}
                                >
                                    {c.subs.map((s) => {
                                        const I = s.icon;
                                        const sl = sel === s.name;

                                        return (
                                            <button
                                                key={s.name}
                                                onClick={() => {
                                                    onSel(sl ? null : s.name);
                                                    sH(null);
                                                }}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    padding: "0.45rem 0.55rem",
                                                    borderRadius: "7px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    backgroundColor: sl
                                                        ? th.activeBg
                                                        : "transparent",
                                                    fontFamily: "'Poppins',sans-serif",
                                                    fontSize: "0.8rem",
                                                    fontWeight: sl ? "600" : "450",
                                                    color: sl ? th.text : th.textSecondary,
                                                    transition: "0.1s",
                                                    textAlign: "left",
                                                    width: "100%",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!sl) {
                                                        e.currentTarget.style.backgroundColor = th.hoverBg;
                                                        e.currentTarget.style.color = th.text;
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!sl) {
                                                        e.currentTarget.style.backgroundColor = "transparent";
                                                        e.currentTarget.style.color = th.textSecondary;
                                                    }
                                                }}
                                            >
                                                <I size={16} strokeWidth={1.5}/>
                                                <span>{s.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* AI Button */}
                <div
                    style={{
                        marginLeft: "0.2rem",
                        borderLeft: `1px solid ${th.categoryBorder}`,
                        paddingLeft: "0.5rem",
                    }}
                >
                    <button
                        onClick={onAISearch}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.5rem 0.9rem",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            color: "#fff",
                            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontFamily: "'Poppins',sans-serif",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.5)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.3)";
                            e.currentTarget.style.transform = "none";
                        }}
                    >
                        <Sparkles size={14}/>
                        AI Search
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Autocomplete ─────────────────────────────────────────── */
const AutoDrop = ({th, items, onPick, type}) => (<div style={{
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: th.dropdownBg,
    border: `1px solid ${th.border}`,
    borderRadius: '10px',
    boxShadow: '0 10px 32px rgba(0,0,0,0.12)',
    zIndex: 200,
    overflow: 'hidden',
    maxHeight: '320px',
    overflowY: 'auto'
}}>
    {type === 'search' && items.length > 0 && <div style={{
        padding: '0.4rem 0.7rem 0.15rem',
        fontSize: '0.64rem',
        fontWeight: '600',
        color: th.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    }}>Suggestions</div>}
    {items.map((it, i) => (<button key={i} onClick={() => onPick(it)} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.45rem 0.7rem',
        width: '100%',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: 'transparent',
        fontFamily: "'Poppins',sans-serif",
        fontSize: '0.82rem',
        color: it.type === 'current' ? '#3b82f6' : it.type === 'name_search' ? th.accent : th.text,
        fontWeight: it.type === 'current' || it.type === 'name_search' ? '600' : '450',
        textAlign: 'left'
    }}
                                   onMouseEnter={e => e.currentTarget.style.backgroundColor = th.hoverBg}
                                   onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
        {type === 'location' ? (it.type === 'current' ? <Navigation2 size={15} color="#3b82f6"/> :
            <Clock size={14} color={th.textMuted}/>) : it.type === 'name_search' ? <ArrowRight size={14}/> :
            <Search size={14} color={th.textMuted}/>}
        <span>{it.label}</span></button>))}</div>);

/* ─── Business Card ────────────────────────────────────────── */
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=480&h=320&fit=crop';
const BizCard = ({biz, th, hov, onHov, onFav, isFav, onNavigate}) => {
    const [imgSrc, setImgSrc] = useState(biz.image);
    return (
        <div onMouseEnter={() => onHov(biz.id)} onMouseLeave={() => onHov(null)}
             onClick={() => onNavigate && onNavigate(biz.name)} style={{
            display: 'flex',
            gap: '0.85rem',
            padding: '0.85rem',
            borderBottom: `1px solid ${th.border}`,
            backgroundColor: hov ? th.hoverBg : 'transparent',
            transition: '0.15s',
            cursor: 'pointer'
        }}>
            <div style={{
                width: '190px',
                minWidth: '190px',
                height: '140px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: th.badgeBg,
                flexShrink: 0
            }}>
                <img src={imgSrc} alt={biz.name} style={{width: '100%', height: '100%', objectFit: 'cover'}}
                     loading="lazy" onError={() => setImgSrc(FALLBACK_IMG)}/>
            </div>
            <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginBottom: '0.15rem'}}>
                    <h3 style={{
                        fontSize: '0.93rem',
                        fontWeight: '600',
                        color: th.text,
                        margin: 0,
                        lineHeight: '1.2'
                    }}>{biz.name}</h3>
                    {biz.isVerified && <div style={{
                        width: '15px',
                        height: '15px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                    }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>}
                    <button onClick={e => {
                        e.stopPropagation();
                        onFav(biz.id)
                    }} style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.1rem',
                        flexShrink: 0
                    }}><Heart size={17} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : th.textMuted}/>
                    </button>
                </div>
                {biz.rating &&
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem'}}>
                        <div style={{display: 'flex', gap: '1px'}}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={11}
                                                                                                   fill={s <= Math.round(biz.rating) ? '#f59e0b' : 'none'}
                                                                                                   color="#f59e0b"/>)}</div>
                        <span style={{fontSize: '0.7rem', fontWeight: '600', color: th.text}}>{biz.rating}</span>
                        {biz.reviewCount > 0 && <span style={{
                            fontSize: '0.65rem',
                            color: th.textMuted
                        }}>({biz.reviewCount.toLocaleString()})</span>}
                        {biz.priceLevel && <span style={{
                            fontSize: '0.65rem',
                            color: th.textMuted,
                            marginLeft: '0.2rem'
                        }}>{biz.priceLevel}</span>}
                    </div>}
                <div style={{
                    display: 'flex',
                    gap: '0.2rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.15rem'
                }}>{biz.tagLabels?.map((t, i) => <span key={i} style={{
                    fontSize: '0.64rem',
                    padding: '0.1rem 0.38rem',
                    borderRadius: '4px',
                    border: `1px solid ${th.border}`,
                    color: th.textSecondary
                }}>{t}</span>)}</div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.12rem',
                    flexWrap: 'wrap'
                }}>
                    {biz.location !== 'Nearby' && <span style={{
                        fontSize: '0.7rem',
                        color: th.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.15rem'
                    }}><MapPin size={11}/>{biz.location}</span>}
                    {biz.phone && <span style={{
                        fontSize: '0.7rem',
                        color: th.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.15rem'
                    }}><Phone size={11}/>{biz.phone}</span>}</div>
                {biz.openingHours && <div style={{
                    fontSize: '0.66rem',
                    color: th.textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    marginBottom: '0.1rem'
                }}><Clock size={10}/>{biz.openingHours.substring(0, 55)}{biz.openingHours.length > 55 ? '...' : ''}
                </div>}
                {biz.features?.length > 0 && <div style={{
                    display: 'flex',
                    gap: '0.2rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.1rem'
                }}>{biz.features.slice(0, 3).map((f, i) => <span key={i} style={{
                    fontSize: '0.58rem',
                    padding: '0.06rem 0.28rem',
                    borderRadius: '4px',
                    backgroundColor: th.badgeBg,
                    color: th.textSecondary
                }}>{f}</span>)}</div>}
                {biz.description && <p style={{
                    fontSize: '0.69rem',
                    color: th.textMuted,
                    margin: '0.05rem 0 0',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                }}>{biz.description}</p>}
                <div style={{
                    fontSize: '0.64rem',
                    color: th.textMuted,
                    marginTop: 'auto',
                    paddingTop: '0.1rem'
                }}>{biz.distanceMeters != null && (biz.distanceMeters < 1000 ? `${biz.distanceMeters}m away` : `${(biz.distanceMeters / 1000).toFixed(1)}km away`)}</div>
            </div>
        </div>)
};

/* ─── Pagination ───────────────────────────────────────────── */
const Pager = ({page, total, onPage, th}) => {
    if (total <= 1) return null;
    const pages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(total, page + 2); i++) pages.push(i);
    return (<div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.3rem',
        padding: '0.8rem',
        borderTop: `1px solid ${th.border}`
    }}>
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: `1px solid ${th.border}`,
            backgroundColor: 'transparent',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: th.textMuted,
            opacity: page <= 1 ? 0.3 : 1
        }}><ChevronLeft size={16}/></button>
        {pages.map(p => (<button key={p} onClick={() => onPage(p)} style={{
            minWidth: '32px',
            height: '32px',
            borderRadius: '6px',
            border: p === page ? 'none' : `1px solid ${th.border}`,
            backgroundColor: p === page ? th.accent : 'transparent',
            color: p === page ? th.accentText : th.text,
            cursor: 'pointer',
            fontWeight: p === page ? '700' : '500',
            fontSize: '0.82rem',
            fontFamily: "'Poppins',sans-serif"
        }}>{p}</button>))}
        <button disabled={page >= total} onClick={() => onPage(page + 1)} style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: `1px solid ${th.border}`,
            backgroundColor: 'transparent',
            cursor: page >= total ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: th.textMuted,
            opacity: page >= total ? 0.3 : 1
        }}><ChevronRight size={16}/></button>
    </div>)
};


/* ═══════════════════════════════════════════════════════════════
   AI SEARCH PLACEHOLDER VIEW
   ═══════════════════════════════════════════════════════════════ */
const AISearchView = ({th, onBack}) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        textAlign: 'center',
        position: 'relative'
    }}>
        <button onClick={onBack} style={{
            position: 'absolute', top: '1rem', left: '1rem',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.4rem 0.8rem', borderRadius: '8px',
            border: `1px solid ${th.border}`, backgroundColor: 'transparent',
            cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
            fontSize: '0.8rem', fontWeight: '500', color: th.textSecondary,
        }}><ChevronLeft size={16}/> Back to Discover
        </button>
        <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 0 60px rgba(99,102,241,0.3), 0 0 120px rgba(139,92,246,0.15)',
            animation: 'pulseOrb 3s ease-in-out infinite',
        }}><Sparkles size={44} color="#fff"/></div>
        <h2 style={{fontSize: '1.3rem', fontWeight: '700', color: th.text, marginBottom: '0.4rem'}}>AI-Powered
            Search</h2>
        <p style={{
            fontSize: '0.88rem',
            color: th.textMuted,
            lineHeight: '1.6',
            maxWidth: '400px',
            marginBottom: '2rem'
        }}>
            Tell me what you're looking for in natural language. I'll find the best local businesses that match your
            vibe.
        </p>
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            width: '100%', maxWidth: '500px',
            padding: '0.6rem 0.7rem 0.6rem 1rem',
            borderRadius: '14px',
            border: `2px solid rgba(99,102,241,0.3)`,
            backgroundColor: th.inputBg,
            boxShadow: '0 4px 20px rgba(99,102,241,0.1)',
        }}>
            <Bot size={18} color="#8b5cf6"/>
            <input placeholder="e.g. A cozy dinner spot with outdoor seating near me..."
                   style={{
                       flex: 1, border: 'none', background: 'transparent', fontSize: '0.88rem',
                       fontFamily: "'Poppins',sans-serif", color: th.text, outline: 'none'
                   }}/>
            <button style={{
                padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#fff', fontWeight: '600', fontSize: '0.84rem',
                cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}><Search size={14}/> Search
            </button>
        </div>
        <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
            {['Best pizza nearby', 'Quiet coffee shop to work', 'Date night restaurant', 'Cheap lunch under $15'].map(s => (
                <button key={s} style={{
                    padding: '0.3rem 0.7rem', borderRadius: '50px',
                    border: `1px solid ${th.border}`, backgroundColor: th.badgeBg,
                    fontSize: '0.72rem', color: th.textSecondary, cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif", fontWeight: '500', transition: '0.15s',
                }} onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.color = '#8b5cf6'
                }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = th.border;
                            e.currentTarget.style.color = th.textSecondary
                        }}>
                    {s}
                </button>
            ))}
        </div>
        <p style={{fontSize: '0.7rem', color: th.textMuted, marginTop: '2rem', maxWidth: '350px', lineHeight: '1.5'}}>
            Coming soon — AI recommendations powered by your preferences, friends' picks, and real business data.
        </p>
    </div>);


/* ═══════════════════════════════════════════════════════════════
   DISCOVER TAB
   ═══════════════════════════════════════════════════════════════ */
const DiscoverContent = ({th, favs, toggleFav}) => {
    const [biz, setBiz] = useState([]);
    const [loading, setLoad] = useState(false);
    const [err, setErr] = useState('');
    const [sq, setSq] = useState('');
    const [lq, setLq] = useState('');
    const [selCat, setSelCat] = useState(null);
    const [hovBiz, setHovBiz] = useState(null);
    const [mapC, setMapC] = useState(null);
    const [uLoc, setULoc] = useState(null);
    const [searched, setSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showSD, setShowSD] = useState(false);
    const [sSugg, setSSugg] = useState([]);
    const [showLD, setShowLD] = useState(false);
    const [lSugg, setLSugg] = useState([]);
    const sRef = useRef(null);
    const lRef = useRef(null);
    const timer = useRef(null);
    const [showAI, setShowAI] = useState(false);
    const lastSearch = useRef({});
    const [flyTarget, setFlyTarget] = useState(null);

    useEffect(() => {
        const h = e => {
            if (sRef.current && !sRef.current.contains(e.target)) setShowSD(false);
            if (lRef.current && !lRef.current.contains(e.target)) setShowLD(false)
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const fetchSugg = useCallback(async q => {
        try {
            const d = await apiFetch(`${API}/suggest?q=${encodeURIComponent(q)}`);
            setSSugg(d.suggestions || [])
        } catch {
            setSSugg([])
        }
    }, []);
    const fetchLocS = useCallback(async q => {
        try {
            const d = await apiFetch(`${API}/locations?q=${encodeURIComponent(q)}`);
            setLSugg(d.locations || [])
        } catch {
            setLSugg([])
        }
    }, []);

    const onSI = v => {
        setSq(v);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => fetchSugg(v), 200);
        setShowSD(true)
    };
    const onLI = v => {
        setLq(v);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => fetchLocS(v), 300);
        setShowLD(true)
    };

    /* ─── MAIN SEARCH ──────────────────────────────────────── */
    const doSearch = useCallback(async (opts = {}) => {
        const q = opts.query ?? sq, cat = opts.category ?? selCat, loc = opts.location ?? lq, pg = opts.page || 1;
        let lat = mapC?.lat || uLoc?.lat, lng = mapC?.lng || uLoc?.lng;

        lastSearch.current = {query: q, category: cat, location: loc, page: pg};

        if (loc && loc.trim() && loc !== 'Current Location') {
            setLoad(true);
            setErr('');
            try {
                const g = await apiFetch(`${API}/geocode?q=${encodeURIComponent(loc)}`);
                lat = g.lat;
                lng = g.lng;
                setMapC({lat, lng});
                setFlyTarget({lat, lng});
                setLq(g.displayName?.split(',').slice(0, 2).join(',') || loc);
            } catch (e) {
                if (!lat || !lng) {
                    setErr(`Location not found: "${loc}"`);
                    setLoad(false);
                    return
                }
            }
        }
        if (!lat || !lng) {
            setErr('Please allow location access or type a city name');
            setLoad(false);
            return
        }

        setLoad(true);
        setErr('');
        setSearched(true);
        setShowSD(false);
        setShowLD(false);
        try {
            const p = new URLSearchParams({
                lat: String(lat),
                lng: String(lng),
                radius: String(5000),
                page: String(pg),
                per_page: '15'
            });
            if (q) p.set('q', q);
            if (cat) p.set('category', cat);
            const d = await apiFetch(`${API}/search?${p}`);

            let businesses = d.businesses || [];
            if (uLoc || loc === 'Current Location') {
                businesses = [...businesses].sort((a, b) => (a.distanceMeters || 99999) - (b.distanceMeters || 99999));
            }

            setBiz(businesses);
            setTotal(d.total || 0);
            setTotalPages(d.totalPages || 1);
            setPage(d.page || 1);
            setFlyTarget({lat, lng});
        } catch (e) {
            setErr(e.message);
            setBiz([]);
        }
        setLoad(false);
    }, [sq, selCat, lq, mapC, uLoc]);

    const retry = useCallback(() => {
        const ls = lastSearch.current;
        doSearch({query: ls.query, category: ls.category, location: ls.location, page: ls.page});
    }, [doSearch]);

    const handleLoc = useCallback(ll => {
        setULoc(ll);
        if (!mapC) {
            setMapC(ll);
            setFlyTarget(ll)
        }
    }, [mapC]);
    const handleCat = useCallback(c => {
        setSelCat(c);
        if (c) {
            doSearch({category: c, query: ''});
            setSq('')
        }
    }, [doSearch]);
    const handlePage = useCallback(p => doSearch({page: p}), [doSearch]);

    const handleSPick = useCallback(it => {
        setShowSD(false);
        if (it.type === 'name_search') {
            const q = it.query || it.label;
            setSq(q);
            setSelCat(null);
            doSearch({query: q, category: null});
        } else {
            setSq(it.label);
            doSearch({query: it.label});
        }
    }, [doSearch]);

    const handleLPick = useCallback(it => {
        setShowLD(false);
        if (it.type === 'current') {
            if (uLoc) {
                setMapC(uLoc);
                setFlyTarget(uLoc);
                setLq('Current Location');
                doSearch({location: ''})
            }
            return;
        }
        setLq(it.label);
        if (it.lat) {
            setMapC({lat: it.lat, lng: it.lng});
            setFlyTarget({lat: it.lat, lng: it.lng})
        }
        doSearch({location: it.label});
    }, [uLoc, doSearch]);

    const submit = () => {
        setShowSD(false);
        setShowLD(false);
        doSearch()
    };
    const kd = e => {
        if (e.key === 'Enter') submit()
    };

    if (showAI) return <AISearchView th={th} onBack={() => setShowAI(false)}/>;

    return (<div style={{display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>
        <CatBar th={th} onSel={handleCat} sel={selCat} onAISearch={() => setShowAI(true)}/>

        {/* ── Search Bar ─────────────────────────────────────── */}
        <div style={{
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center',
            padding: '0.6rem 1rem',
            borderBottom: `1px solid ${th.border}`,
            backgroundColor: th.bg,
            zIndex: 55
        }}>
            <div ref={sRef} style={{position: 'relative', flex: 1}}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: th.inputBg,
                    borderRadius: '10px',
                    padding: '0.45rem 0.65rem',
                    border: `1.5px solid ${th.border}`
                }}>
                    <Search size={15} color={th.textMuted}/>
                    <input value={sq} onChange={e => onSI(e.target.value)} onFocus={() => {
                        fetchSugg(sq);
                        setShowSD(true)
                    }} onKeyDown={kd} placeholder="Search businesses, categories..." style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.84rem',
                        fontFamily: "'Poppins',sans-serif",
                        color: th.text,
                        outline: 'none'
                    }}/>
                    {(sq || selCat) && <button onClick={() => {
                        setSq('');
                        setSelCat(null)
                    }} style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: th.textMuted,
                        display: 'flex',
                        padding: 0
                    }}><X size={14}/></button>}
                </div>
                {showSD && sSugg.length > 0 && <AutoDrop th={th} items={sSugg} onPick={handleSPick} type="search"/>}
            </div>
            <div ref={lRef} style={{position: 'relative', width: '210px'}}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: th.inputBg,
                    borderRadius: '10px',
                    padding: '0.45rem 0.65rem',
                    border: `1.5px solid ${th.border}`
                }}>
                    <MapPin size={15} color={th.textMuted}/>
                    <input value={lq} onChange={e => onLI(e.target.value)} onFocus={() => {
                        fetchLocS(lq);
                        setShowLD(true)
                    }} onKeyDown={kd} placeholder={uLoc ? 'Current location' : 'City, state, ZIP'} style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.84rem',
                        fontFamily: "'Poppins',sans-serif",
                        color: th.text,
                        outline: 'none'
                    }}/>
                </div>
                {showLD && lSugg.length > 0 && <AutoDrop th={th} items={lSugg} onPick={handleLPick} type="location"/>}
            </div>
            <button onClick={submit} style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '10px',
                backgroundColor: th.accent,
                color: th.accentText,
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center'
            }}><Search size={15}/></button>
        </div>

        {/* ── Results info bar ────────────────────────────────── */}
        {searched && !loading && !err && <div style={{
            display: 'flex',
            gap: '0.3rem',
            padding: '0.45rem 1rem',
            borderBottom: `1px solid ${th.border}`,
            backgroundColor: th.bg,
            alignItems: 'center',
            zIndex: 50
        }}>
            {selCat && <span style={{
                fontSize: '0.76rem',
                fontWeight: '600',
                color: th.text,
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                marginRight: '0.3rem'
            }}>{selCat}
                <button onClick={() => {
                    setSelCat(null);
                    doSearch({category: null})
                }} style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: th.textMuted,
                    display: 'flex',
                    padding: 0
                }}><X size={12}/></button></span>}
            <span style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                color: th.textMuted
            }}>{total} results{uLoc ? ' · Sorted by distance' : ''}</span></div>}

        {/* ── Map + List ─────────────────────────────────────── */}
        <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', inset: 0, zIndex: 1}}>
                <MapContainer center={[40.56, -111.93]} zoom={12} style={{width: '100%', height: '100%'}} zoomControl>
                    <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <LocUser onLoc={handleLoc}/>
                    {flyTarget && <FlyTo c={[flyTarget.lat, flyTarget.lng]} z={14}/>}
                    {uLoc && <Marker position={[uLoc.lat, uLoc.lng]} icon={L.divIcon({
                        className: 'ud',
                        html: '<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.5)"></div>',
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                    })}><Popup><span
                        style={{fontFamily: 'Poppins', fontSize: '0.8rem'}}>You are here</span></Popup></Marker>}
                    {biz.map(b => (<Marker key={b.id} position={[b.lat, b.lng]} icon={pinIcon(hovBiz === b.id)}
                                           eventHandlers={{
                                               mouseover: () => setHovBiz(b.id),
                                               mouseout: () => setHovBiz(null)
                                           }}>
                        <Popup maxWidth={260}>
                            <div style={{fontFamily: "'Poppins',sans-serif", width: '230px'}}>
                                <img src={b.image} alt="" style={{
                                    width: '100%',
                                    height: '100px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    marginBottom: '0.35rem'
                                }} onError={e => {
                                    e.target.src = FALLBACK_IMG
                                }}/>
                                <strong style={{
                                    fontSize: '0.88rem',
                                    display: 'block',
                                    marginBottom: '0.1rem'
                                }}>{b.name}</strong>
                                {b.rating && <div style={{
                                    fontSize: '0.72rem',
                                    color: '#f59e0b',
                                    marginBottom: '0.08rem'
                                }}>★ {b.rating} {b.reviewCount > 0 &&
                                    <span style={{color: '#777'}}>({b.reviewCount})</span>}</div>}
                                <div style={{
                                    fontSize: '0.72rem',
                                    color: '#555',
                                    marginBottom: '0.08rem'
                                }}>{b.tagLabels?.join(', ')}</div>
                                <div style={{fontSize: '0.7rem', color: '#777'}}>{b.location}</div>
                                {b.phone && <div
                                    style={{fontSize: '0.7rem', color: '#777', marginTop: '0.05rem'}}>{b.phone}</div>}
                                {b.description && <div style={{
                                    fontSize: '0.68rem',
                                    color: '#888',
                                    marginTop: '0.2rem',
                                    lineHeight: '1.4'
                                }}>{b.description}</div>}
                            </div>
                        </Popup></Marker>))}
                </MapContainer></div>

            {/* ── Left panel ─────────────────────────────────────── */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '460px',
                zIndex: 10,
                backgroundColor: th.bg,
                overflowY: 'auto',
                borderRight: `1px solid ${th.border}`,
                boxShadow: '4px 0 20px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column'
            }}>

                {!searched && !loading && !err && (<div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '3rem 2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: th.badgeBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem'
                    }}><Search size={36} color={th.textMuted} style={{opacity: 0.5}}/></div>
                    <h2 style={{fontSize: '1.1rem', fontWeight: '600', color: th.text, marginBottom: '0.4rem'}}>Search
                        to discover</h2>
                    <p style={{fontSize: '0.84rem', color: th.textMuted, lineHeight: '1.5', maxWidth: '280px'}}>Search
                        for a business by name, browse categories, or explore what's nearby</p>
                    <button onClick={() => doSearch({query: ''})} style={{
                        marginTop: '1.5rem',
                        padding: '0.55rem 1.4rem',
                        borderRadius: '10px',
                        backgroundColor: th.accent,
                        color: th.accentText,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.86rem',
                        fontFamily: "'Poppins',sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                    }}><Navigation size={15}/>Explore nearby
                    </button>
                </div>)}

                {loading && <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '0.8rem'
                }}>
                    <Loader2 size={30} color={th.textMuted} style={{animation: 'spin 1s linear infinite'}}/><p
                    style={{fontSize: '0.85rem', color: th.textMuted}}>Searching businesses...</p></div>}

                {err && !loading && <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <AlertCircle size={34} color="#ef4444" style={{marginBottom: '0.8rem', opacity: 0.6}}/>
                    <p style={{
                        fontSize: '0.88rem',
                        color: th.text,
                        fontWeight: '500',
                        marginBottom: '0.3rem'
                    }}>Something went wrong</p>
                    <p style={{
                        fontSize: '0.78rem',
                        color: th.textMuted,
                        maxWidth: '300px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-line'
                    }}>{err}</p>
                    <button onClick={retry} style={{
                        marginTop: '1rem',
                        padding: '0.45rem 1.2rem',
                        borderRadius: '8px',
                        border: `1.5px solid ${th.border}`,
                        backgroundColor: 'transparent',
                        color: th.text,
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.82rem',
                        fontFamily: "'Poppins',sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                    }}><RefreshCw size={14}/>Try again
                    </button>
                </div>}

                {searched && !loading && !err && (<div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <div style={{padding: '0.5rem 0.8rem 0.3rem'}}>
                        <span style={{
                            fontSize: '0.76rem',
                            fontWeight: '600',
                            color: th.text
                        }}>{sq ? `"${sq}"` : selCat || 'All Businesses'}</span>
                        <span style={{fontSize: '0.7rem', color: th.textMuted, marginLeft: '0.3rem'}}>· {total} found · Page {page}/{totalPages}</span>
                    </div>
                    <div style={{flex: 1, overflowY: 'auto'}}>{biz.map(b => <BizCard key={b.id} biz={b} th={th}
                                                                                     hov={hovBiz === b.id}
                                                                                     onHov={setHovBiz} onFav={toggleFav}
                                                                                     isFav={favs.has(b.id)}
                                                                                     onNavigate={(name) => window.location.href = `/business/${encodeURIComponent(name)}`}
                    />)}
                        {biz.length === 0 && <div style={{textAlign: 'center', padding: '3rem 1.5rem'}}><p
                            style={{color: th.textMuted, fontSize: '0.88rem'}}>No businesses
                            found{sq ? ` for "${sq}"` : ''}</p><p
                            style={{color: th.textMuted, fontSize: '0.76rem', marginTop: '0.3rem'}}>Try a broader search
                            or increase the distance filter</p></div>}</div>
                    <Pager page={page} total={totalPages} onPage={handlePage} th={th}/></div>)}

            </div>
        </div>
    </div>)
};


/* ─── Other tabs ───────────────────────────────────────────── */
const PH = ({th, icon: I, title, desc}) => (<div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '3rem',
    textAlign: 'center'
}}><I size={44} color={th.textMuted} style={{marginBottom: '1rem', opacity: 0.4}}/><h2
    style={{fontSize: '1.1rem', fontWeight: '600', color: th.text, marginBottom: '0.3rem'}}>{title}</h2><p
    style={{fontSize: '0.85rem', color: th.textMuted}}>{desc}</p></div>);

const SettingsContent = ({th, isDark, setDark, userId}) => {
    const { signOut } = useClerk();
    const nav = useNavigate();
    const [cuisines, setCuisines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priceLevel, setPriceLevel] = useState(null);
    const [distanceRadius, setDistanceRadius] = useState(5000);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!userId) return;
        getPreferences(userId).then(p => {
            if (p?.preferences) {
                setCuisines(p.preferences.cuisines ?? []);
                setCategories(p.preferences.categories ?? []);
                setPriceLevel(p.preferences.price_level ?? null);
                setDistanceRadius(p.preferences.distance_radius_meters ?? 5000);
            }
            setLoaded(true);
        }).catch(() => setLoaded(true));
    }, [userId]);

    const toggleChip = (arr, setArr, val) =>
        setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

    const chipStyle = (active) => ({
        padding: '0.4rem 1rem',
        borderRadius: '20px',
        border: active ? 'none' : `1px solid ${th.border}`,
        backgroundColor: active ? th.accent : 'transparent',
        color: active ? th.accentText : th.textSecondary,
        cursor: 'pointer',
        fontFamily: "'Poppins',sans-serif",
        fontSize: '0.8rem',
        fontWeight: active ? '600' : '450',
        transition: '0.15s',
    });

    const handleSaveAsync = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            await setPreferences(userId, { cuisines, categories, price_level: priceLevel, distance_radius_meters: distanceRadius });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            await signOut(() => nav('/'));
        }
    };

    return (
        <div style={{padding: '2rem 2.5rem', maxWidth: '500px', margin: '0 auto', overflowY: 'auto', height: '100%'}}>
            <h1 style={{fontSize: '1.5rem', fontWeight: '700', color: th.text, marginBottom: '1.5rem'}}>Settings</h1>

            {/* App toggles */}
            {[{
                title: 'Dark Mode', desc: 'Switch themes', isOn: isDark, fn: () => setDark(!isDark)
            }, {
                title: 'Notifications', desc: 'Deal & review alerts', isOn: true, fn: () => {}
            }, {
                title: 'Location Tracking', desc: 'Nearby businesses', isOn: true, fn: () => {}
            }].map((it, i) => (
                <div key={i} style={{
                    backgroundColor: th.cardBg,
                    border: `1px solid ${th.border}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '0.6rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div><h3 style={{fontSize: '0.88rem', fontWeight: '600', color: th.text, margin: '0 0 0.1rem'}}>{it.title}</h3>
                        <p style={{fontSize: '0.72rem', color: th.textMuted, margin: 0}}>{it.desc}</p></div>
                    <button onClick={it.fn} style={{
                        width: '42px', height: '24px', borderRadius: '12px', border: 'none',
                        backgroundColor: it.isOn ? th.accent : th.border, cursor: 'pointer', position: 'relative'
                    }}>
                        <div style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            backgroundColor: it.isOn ? th.accentText : '#fff',
                            position: 'absolute', top: '3px', left: it.isOn ? '21px' : '3px',
                            transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                        }}/>
                    </button>
                </div>
            ))}

            {/* Taste Profile */}
            <div style={{borderTop: `1px solid ${th.border}`, marginTop: '1.5rem', paddingTop: '1.5rem'}}>
                <h2 style={{fontSize: '1rem', fontWeight: '700', color: th.text, marginBottom: '1.2rem'}}>Taste Profile</h2>

                <div style={{marginBottom: '1.2rem'}}>
                    <h3 style={{fontSize: '0.85rem', fontWeight: '600', color: th.text, marginBottom: '0.5rem'}}>Favorite Cuisines</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem'}}>
                        {CUISINE_OPTIONS.map(c => (
                            <button key={c} onClick={() => toggleChip(cuisines, setCuisines, c)} style={chipStyle(cuisines.includes(c))}>{c}</button>
                        ))}
                    </div>
                </div>

                <div style={{marginBottom: '1.2rem'}}>
                    <h3 style={{fontSize: '0.85rem', fontWeight: '600', color: th.text, marginBottom: '0.5rem'}}>Business Categories</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem'}}>
                        {CATEGORY_OPTIONS.map(c => (
                            <button key={c} onClick={() => toggleChip(categories, setCategories, c)} style={chipStyle(categories.includes(c))}>{c}</button>
                        ))}
                    </div>
                </div>

                <div style={{marginBottom: '1.2rem'}}>
                    <h3 style={{fontSize: '0.85rem', fontWeight: '600', color: th.text, marginBottom: '0.5rem'}}>Price Level</h3>
                    <div style={{display: 'flex', gap: '0.4rem'}}>
                        {PRICE_LEVELS.map(p => (
                            <button key={p.v} onClick={() => setPriceLevel(priceLevel === p.v ? null : p.v)} style={{
                                padding: '0.4rem 1rem', borderRadius: '8px',
                                border: `1px solid ${priceLevel === p.v ? 'transparent' : th.border}`,
                                backgroundColor: priceLevel === p.v ? th.accent : 'transparent',
                                color: priceLevel === p.v ? th.accentText : th.textSecondary,
                                cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem',
                                fontWeight: priceLevel === p.v ? '700' : '500', transition: '0.15s',
                            }}>{p.l}</button>
                        ))}
                    </div>
                </div>

                <div style={{marginBottom: '1.2rem'}}>
                    <h3 style={{fontSize: '0.85rem', fontWeight: '600', color: th.text, marginBottom: '0.5rem'}}>Preferred Distance</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem'}}>
                        {DISTANCE_OPTIONS.map(d => (
                            <button key={d.v} onClick={() => setDistanceRadius(d.v)} style={{
                                padding: '0.35rem 0.7rem', borderRadius: '20px',
                                border: `1px solid ${distanceRadius === d.v ? 'transparent' : th.border}`,
                                backgroundColor: distanceRadius === d.v ? th.accent : 'transparent',
                                color: distanceRadius === d.v ? th.accentText : th.textSecondary,
                                cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                                fontWeight: distanceRadius === d.v ? '600' : '450', fontSize: '0.76rem',
                                transition: '0.15s',
                            }}>{d.l}</button>
                        ))}
                    </div>
                </div>

                <button onClick={handleSaveAsync} disabled={saving || loaded === false} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.7rem 2rem', width: '100%', maxWidth: '320px',
                    backgroundColor: saved ? '#16a34a' : th.accent, color: saved ? '#fff' : th.accentText,
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif", fontWeight: '600', fontSize: '0.88rem',
                    opacity: (saving || !loaded) ? 0.7 : 1, transition: '0.3s',
                }}>
                    <Save size={16}/>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Taste Profile'}
                </button>
            </div>

            {/* Account actions */}
            <div style={{borderTop: `1px solid ${th.border}`, marginTop: '1.5rem', paddingTop: '1.5rem'}}>
                <button onClick={() => signOut(() => nav('/'))} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.65rem 1rem', width: '100%', maxWidth: '320px',
                    backgroundColor: 'transparent', color: th.textSecondary,
                    border: `1px solid ${th.border}`, borderRadius: '10px', cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', marginBottom: '0.65rem',
                }}>Sign out</button>
                <button onClick={handleDeleteAccount} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.65rem 1rem', width: '100%', maxWidth: '320px',
                    backgroundColor: 'transparent', color: '#dc2626',
                    border: `1px solid #dc2626`, borderRadius: '10px', cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem',
                }}><Trash2 size={15}/>Delete account</button>
            </div>
        </div>
    );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
    const {user} = useUser();
    const nav = useNavigate();
    const [isDark, setDark] = useState(true);
    const [tab, setTab] = useState('discover');
    const [sbO, setSbO] = useState(false);
    const [favs, setFavs] = useState(new Set());
    const th = isDark ? dark : light;
    const sw = sbO ? 230 : 58;
    const tF = useCallback(id => {
        setFavs(p => {
            const n = new Set(p);
            n.has(id) ? n.delete(id) : n.add(id);
            return n
        })
    }, []);

    const content = () => {
        switch (tab) {
            case 'discover':
                return <DiscoverContent th={th} favs={favs} toggleFav={tF}/>;
            case 'favorites':
                return <PH th={th} icon={Heart} title="Favorites" desc="Heart businesses to save them here"/>;
            case 'deals':
                return <DealsContent th={th}/>;
            case 'reviews':
                return <PH th={th} icon={Star} title="My Reviews" desc="Your reviews show here"/>;
            case 'friends':
                return <FriendsPage />;
            case 'settings':
                return <SettingsContent th={th} isDark={isDark} setDark={setDark} userId={user?.id}/>;
            default:
                return <DiscoverContent th={th} favs={favs} toggleFav={tF}/>
        }
    };

    return (<div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: "'Poppins',-apple-system,sans-serif",
        backgroundColor: th.bg,
        color: th.text
    }}>
        <aside style={{
            width: `${sw}px`,
            minWidth: `${sw}px`,
            backgroundColor: th.sidebar,
            borderRight: `1px solid ${th.sidebarBorder}`,
            display: 'flex',
            flexDirection: 'column',
            padding: sbO ? '0.9rem 0.5rem' : '0.9rem 0.3rem',
            transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            zIndex: 70
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sbO ? 'space-between' : 'center',
                padding: sbO ? '0.3rem 0.4rem' : '0.3rem 0',
                marginBottom: '1.2rem'
            }}>
                {sbO ? <div style={{cursor: 'pointer'}} onClick={() => nav('/')}><img
                        src={isDark ? '/logo_dark.png' : '/logo_light.png'} alt="Spark" style={{height: '24px'}}/></div> :
                    <div style={{cursor: 'pointer'}} onClick={() => nav('/')}><img src="/logo.png" alt="Spark" style={{
                        height: '24px',
                        width: '24px',
                        objectFit: 'contain'
                    }}/></div>}
                {sbO && <button onClick={() => setSbO(false)} style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: th.textMuted,
                    display: 'flex',
                    padding: '0.2rem'
                }}><ChevronLeft size={17}/></button>}</div>
            <nav style={{display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1}}>
                {!sbO && <button onClick={() => setSbO(true)} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: th.textMuted,
                    marginBottom: '0.4rem'
                }} onMouseEnter={e => e.currentTarget.style.backgroundColor = th.hoverBg}
                                 onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><Menu
                    size={18}/></button>}
                {navTabs.map(t => {
                    const a = tab === t.id, I = t.icon;
                    return (<button key={t.id} onClick={() => setTab(t.id)} title={!sbO ? t.label : undefined} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sbO ? 'flex-start' : 'center',
                        gap: '0.6rem',
                        padding: sbO ? '0.5rem 0.6rem' : '0.5rem',
                        borderRadius: '9px',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: '0.83rem',
                        fontWeight: a ? '600' : '450',
                        color: a ? th.activeAccent : th.textSecondary,
                        backgroundColor: a ? th.activeBg : 'transparent',
                        transition: '0.12s',
                        width: '100%'
                    }} onMouseEnter={e => {
                        if (!a) e.currentTarget.style.backgroundColor = th.hoverBg
                    }} onMouseLeave={e => {
                        if (!a) e.currentTarget.style.backgroundColor = 'transparent'
                    }}><I size={18}/>{sbO && <span>{t.label}</span>}</button>)
                })}</nav>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.1rem'}}>
                <button onClick={() => setTab('settings')} title={!sbO ? 'Settings' : undefined} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sbO ? 'flex-start' : 'center',
                    gap: '0.6rem',
                    padding: sbO ? '0.5rem 0.6rem' : '0.5rem',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    color: tab === 'settings' ? th.activeAccent : th.textMuted,
                    backgroundColor: tab === 'settings' ? th.activeBg : 'transparent',
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '0.8rem',
                    width: '100%',
                    fontWeight: tab === 'settings' ? '600' : '450'
                }} onMouseEnter={e => {
                    if (tab !== 'settings') e.currentTarget.style.backgroundColor = th.hoverBg
                }} onMouseLeave={e => {
                    if (tab !== 'settings') e.currentTarget.style.backgroundColor = 'transparent'
                }}><Settings size={18}/>{sbO && <span>Settings</span>}</button>
                <div style={{
                    borderTop: `1px solid ${th.sidebarBorder}`,
                    paddingTop: '0.5rem',
                    marginTop: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sbO ? 'flex-start' : 'center',
                    gap: '0.4rem',
                    padding: sbO ? '0.5rem 0.6rem 0.2rem' : '0.5rem 0 0.2rem'
                }}>
                    <UserButton afterSignOutUrl="/"
                                appearance={{elements: {avatarBox: {width: '28px', height: '28px'}}}}/>
                    {sbO && <p style={{
                        fontSize: '0.74rem',
                        fontWeight: '600',
                        color: th.text,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>{user?.fullName || user?.firstName || 'User'}</p>}</div>
            </div>
        </aside>
        <main style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: tab === 'discover' ? th.bg : th.bgAlt
        }}>{content()}</main>
    </div>)
};

/* ─── Styles ───────────────────────────────────────────────── */
const ds = document.createElement('style');
ds.textContent = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
::placeholder{color:#999!important}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
.mp,.ud{background:none!important;border:none!important}
.leaflet-control-attribution{font-size:9px!important;opacity:0.5}
.leaflet-popup-content-wrapper{border-radius:10px!important;padding:0!important}
.leaflet-popup-content{margin:8px!important}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulseOrb{0%,100%{box-shadow:0 0 60px rgba(99,102,241,0.3),0 0 120px rgba(139,92,246,0.15)}50%{box-shadow:0 0 80px rgba(99,102,241,0.5),0 0 160px rgba(139,92,246,0.25)}}`;
document.head.appendChild(ds);

export default DashboardPage;