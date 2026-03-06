import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {useUser, UserButton, useClerk} from '@clerk/clerk-react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Compass, Heart, Tag, Star, Settings, Search, MapPin, X, ChevronDown,
    ChevronLeft, ChevronRight, Menu, Utensils, Home, Car, Stethoscope,
    Plane, MoreHorizontal, Scissors, Wrench, Dumbbell, Music, ShoppingBag,
    Coffee, Pizza, Truck, Flame, Waves, Tent, Bike, Hotel, Sparkles, Zap,
    BookOpen, Flower2, Dog, Award,
    Phone, Droplets, Wind, Hammer, Monitor, PaintBucket, Plug, Key,
    Thermometer, Sofa, Leaf, Shirt,
    HandMetal, Gamepad2, Church, Ticket, Landmark, ParkingCircle,
    Baby, Loader2, AlertCircle, Navigation, Glasses, Bone, PersonStanding,
    Clock, Navigation2, ArrowRight, RefreshCw, Bot, Users, Trash2, Save,
    ArrowUpDown
} from 'lucide-react';

import DealsContent from './DealsPage';
import FriendsPage from './FriendsPage';
import { getPreferences, setPreferences, getFavorites, setFavorites, getReviews } from '../../lib/preferences';
import DigitalPage from './DigitalPage';
import { listFriends } from '../../lib/friends';

const API = 'http://localhost:5001/api';

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
    { id: 'digital', label: 'Digital', icon: Monitor },
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
                            color: th.text,
                            background: "transparent",
                            border: `1.5px solid ${th.border}`,
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontFamily: "'Poppins',sans-serif",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = th.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                        }}
                    >
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
                        onFav(biz)
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
   AI SEARCH — ORBIT WHEEL + TASTE MATCHING
   ═══════════════════════════════════════════════════════════════ */
const AI_LOADING_PHRASES = [
    'Discovering small business gems nearby...',
    'Blending your group\'s taste profiles...',
    'Matching local small businesses to your crew...',
    'Computing group compatibility with small businesses...',
    'Scanning independent neighborhood favorites...',
    'Finding small businesses the whole crew will love...',
    'Evaluating mom-and-pop shops for the group...',
    'Ranking the best small business matches...',
];

const AI_SUGGESTIONS = [
    'Best small-town pizza spot',
    'Hidden gem indie coffee shop',
    'Cozy family-owned bakery nearby',
    'Local small business for date night',
];

const PRICE_MAP = {'$': 1, '$$': 2, '$$$': 3, '$$$$': 4};

function mergeGroupPreferences(allPrefs) {
    const memberCount = allPrefs.length;
    if (memberCount === 0) return {cuisineFreq: {}, categoryFreq: {}, avgPrice: null, memberCount: 0};

    const cuisineFreq = {};
    const categoryFreq = {};
    let priceSum = 0;
    let priceCount = 0;

    for (const p of allPrefs) {
        if (p?.cuisines) {
            for (const c of p.cuisines) {
                cuisineFreq[c] = (cuisineFreq[c] || 0) + 1;
            }
        }
        if (p?.categories) {
            for (const c of p.categories) {
                categoryFreq[c] = (categoryFreq[c] || 0) + 1;
            }
        }
        if (p?.price_level) {
            priceSum += p.price_level;
            priceCount++;
        }
    }

    return {
        cuisineFreq,
        categoryFreq,
        avgPrice: priceCount > 0 ? Math.round(priceSum / priceCount) : null,
        memberCount,
        distanceRadius: allPrefs[0]?.distance_radius_meters || 5000,
    };
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
        const bonus = Math.round(25 * (freq / mc));
        score += bonus;
        if (mc > 1) {
            reasons.push(freq === mc
                ? `serves ${matchedCuisine} — a cuisine everyone loves`
                : `serves ${matchedCuisine}, loved by ${freq} of ${mc} in your group`);
        } else {
            reasons.push(`serves your favorite ${matchedCuisine} cuisine`);
        }
    }

    const matchedCat = Object.keys(merged.categoryFreq).find(c => biz.category === c);
    if (matchedCat) {
        const freq = merged.categoryFreq[matchedCat];
        const bonus = Math.round(15 * (freq / mc));
        score += bonus;
        if (mc > 1 && freq > 1) {
            reasons.push(`${freq} of your group prefer ${matchedCat.toLowerCase()}`);
        } else {
            reasons.push(`fits the ${matchedCat.toLowerCase()} category`);
        }
    }

    if (merged.avgPrice) {
        const bizPrice = PRICE_MAP[biz.priceLevel];
        if (bizPrice === merged.avgPrice) {
            score += 10;
            reasons.push(mc > 1 ? 'matches the group\'s price sweet spot' : 'right in your price range');
        } else if (bizPrice) {
            score -= 5;
        }
    }

    if (biz.rating >= 4.5) {
        score += 8;
        reasons.push('highly rated by the community');
    } else if (biz.rating >= 4.0) {
        score += 5;
        reasons.push('well-reviewed locally');
    }

    score = Math.min(98, Math.max(20, score));

    const reasoning = reasons.length > 0
        ? `This small business ${reasons[0]}${reasons.length > 1 ? ` and is ${reasons[1]}` : ''}.`
        : `A nearby small ${biz.subcategory?.toLowerCase() || 'local'} business worth discovering.`;

    return {score, reasoning};
}

function getMatchColor(score) {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#8b5cf6';
    if (score >= 40) return '#eab308';
    return '#94a3b8';
}

const ORBIT_RADIUS = 220;
const ORBIT_IMG_SIZE = 90;
const DEFAULT_COORDS = {lat: 40.758, lng: -111.876};

const FRIEND_ORBIT_RADIUS = 120;
const FRIEND_AVT_SIZE = 56;

const AISearchView = ({th, onBack}) => {
    const {user} = useUser();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [rotation, setRotation] = useState(0);
    const cyclesRef = useRef(0);
    const [isThinking, setIsThinking] = useState(false);
    const [showingResults, setShowingResults] = useState(false);
    const [orbitImages, setOrbitImages] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [glowingIndices, setGlowingIndices] = useState(new Set());
    const [currentPhrase, setCurrentPhrase] = useState(AI_LOADING_PHRASES[0]);
    const [searchError, setSearchError] = useState(null);
    const [userPrefs, setUserPrefs] = useState(null);
    const [userCoords, setUserCoords] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [mergedPrefs, setMergedPrefs] = useState(null);
    const [groupSize, setGroupSize] = useState(1);
    const [friendPrefs, setFriendPrefs] = useState({});
    const [hoveredFriendId, setHoveredFriendId] = useState(null);

    const hoveredFriendPrefs = hoveredFriendId ? friendPrefs[hoveredFriendId] : null;
    const hoveredFriendProfile = hoveredFriendId
        ? friendsList.find(f => f.clerk_user_id === hoveredFriendId)
        : null;
    const commonCuisines = hoveredFriendPrefs?.cuisines && userPrefs?.cuisines
        ? hoveredFriendPrefs.cuisines.filter(c => userPrefs.cuisines.includes(c))
        : [];
    const commonCategories = hoveredFriendPrefs?.categories && userPrefs?.categories
        ? hoveredFriendPrefs.categories.filter(c => userPrefs.categories.includes(c))
        : [];

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setUserCoords({lat: pos.coords.latitude, lng: pos.coords.longitude}),
                () => setUserCoords(DEFAULT_COORDS)
            );
        } else {
            setUserCoords(DEFAULT_COORDS);
        }
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        async function loadGroupPrefs() {
            const allPrefs = [];
            const fpMap = {};
            try {
                const myP = await getPreferences(user.id);
                if (myP?.preferences) {
                    setUserPrefs(myP.preferences);
                    allPrefs.push(myP.preferences);
                }
            } catch (_) {}

            try {
                const friends = await listFriends(user.id);
                if (cancelled) return;
                setFriendsList(friends || []);
                const friendPrefPromises = (friends || []).map(f =>
                    getPreferences(f.clerk_user_id).catch(() => null)
                );
                const friendPrefResults = await Promise.all(friendPrefPromises);
                if (cancelled) return;
                friendPrefResults.forEach((fp, idx) => {
                    const friend = friends[idx];
                    if (fp?.preferences && friend?.clerk_user_id) {
                        allPrefs.push(fp.preferences);
                        fpMap[friend.clerk_user_id] = fp.preferences;
                    }
                });
            } catch (_) {}

            if (!cancelled) {
                setGroupSize(allPrefs.length);
                setMergedPrefs(mergeGroupPreferences(allPrefs));
                setFriendPrefs(fpMap);
            }
        }

        loadGroupPrefs();
        return () => { cancelled = true; };
    }, [user?.id]);

    useEffect(() => {
        if (!userCoords) return;
        apiFetch(`${API}/search?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=5000`)
            .then(data => {
                if (data?.businesses?.length) setOrbitImages(data.businesses.slice(0, 12));
            }).catch(() => {});
    }, [userCoords]);

    useEffect(() => {
        const interval = setInterval(() => {
            let speed;
            if (isThinking) {
                speed = 1.2;
            } else if (showingResults) {
                speed = 0.6;
            } else if (cyclesRef.current < 0.7) {
                speed = 5.0;
            } else {
                const p = Math.min((cyclesRef.current - 0.7) / 0.3, 1);
                speed = 5.0 - 4.2 * p;
            }
            setRotation(prev => {
                if (!isThinking && !showingResults) cyclesRef.current += speed / 360;
                return (prev + speed) % 360;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [isThinking, showingResults]);

    useEffect(() => {
        if (!isThinking) { setGlowingIndices(new Set()); return; }
        const interval = setInterval(() => {
            const count = orbitImages.length;
            if (!count) return;
            const n = Math.floor(Math.random() * 3) + 2;
            const s = new Set();
            while (s.size < Math.min(n, count)) s.add(Math.floor(Math.random() * count));
            setGlowingIndices(s);
        }, 1500);
        return () => clearInterval(interval);
    }, [isThinking, orbitImages.length]);

    useEffect(() => {
        if (!isThinking) return;
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % AI_LOADING_PHRASES.length;
            setCurrentPhrase(AI_LOADING_PHRASES[idx]);
        }, 2500);
        return () => clearInterval(interval);
    }, [isThinking]);

    const handleSearch = useCallback(async (q) => {
        const searchQ = (q || query).trim();
        if (!searchQ || !userCoords) return;

        setIsThinking(true);
        setShowingResults(false);
        setSearchError(null);
        setSearchResults([]);
        cyclesRef.current = 0;
        setCurrentPhrase(AI_LOADING_PHRASES[0]);

        const radius = mergedPrefs?.distanceRadius || userPrefs?.distance_radius_meters || 5000;

        try {
            const data = await apiFetch(
                `${API}/search?q=${encodeURIComponent(searchQ)}&lat=${userCoords.lat}&lng=${userCoords.lng}&radius=${radius}`
            );

            if (data?.businesses?.length) {
                setOrbitImages(data.businesses.slice(0, 12));
                await new Promise(r => setTimeout(r, 1800));

                const prefsToUse = mergedPrefs || mergeGroupPreferences(userPrefs ? [userPrefs] : []);
                const scored = data.businesses.map(biz => {
                    const {score, reasoning} = computeGroupTasteMatch(biz, prefsToUse);
                    return {...biz, matchScore: score, matchReasoning: reasoning};
                });
                scored.sort((a, b) => b.matchScore - a.matchScore);
                setSearchResults(scored);
            } else {
                setSearchError('No small businesses found nearby. Try a different search.');
            }
        } catch (e) {
            setSearchError(e.message || 'Search failed. Make sure the backend is running.');
        } finally {
            setIsThinking(false);
            setShowingResults(true);
        }
    }, [query, userCoords, userPrefs, mergedPrefs]);

    const total = orbitImages.length;
    const wheelDiameter = ORBIT_RADIUS * 2 + ORBIT_IMG_SIZE + 20;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            position: 'relative', overflow: 'hidden',
            width: '100%', minWidth: 0, maxWidth: '100%',
        }}>
            <button onClick={onBack} style={{
                position: 'absolute', top: '0.7rem', left: '1rem', zIndex: 10,
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.4rem 0.8rem', borderRadius: '8px', width: 'fit-content',
                border: `1px solid ${th.border}`, backgroundColor: th.bg,
                cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                fontSize: '0.8rem', fontWeight: '500', color: th.textSecondary,
            }}><ChevronLeft size={16}/> Back to Discover</button>

            {/* ── Orbit Wheel — fills center ────────────────────── */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                overflowY: showingResults ? 'auto' : 'hidden',
                overflowX: 'hidden',
                padding: '0.5rem 1rem',
                minWidth: 0, width: '100%',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    width: '100%',
                    maxWidth: '1100px',
                    minWidth: 0,
                }}>
                    <div style={{
                        position: 'relative', width: `${wheelDiameter}px`, height: `${wheelDiameter}px`,
                        minHeight: `${wheelDiameter}px`, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            position: 'absolute', width: `${ORBIT_RADIUS * 2}px`, height: `${ORBIT_RADIUS * 2}px`,
                            borderRadius: '50%', border: `1px dashed ${th.border}`, opacity: 0.25,
                        }}/>

                        {friendsList.length > 0 && (
                            <div style={{
                                position: 'absolute', width: `${FRIEND_ORBIT_RADIUS * 2}px`, height: `${FRIEND_ORBIT_RADIUS * 2}px`,
                                borderRadius: '50%', border: `1px dashed ${th.border}`, opacity: 0.12,
                            }}/>
                        )}

                    {friendsList.slice(0, 6).map((friend, i) => {
                            const fTotal = Math.min(friendsList.length, 6);
                            const angle = (i / fTotal) * 360 + rotation * 0.4;
                            const rad = (angle * Math.PI) / 180;
                            const x = Math.cos(rad) * FRIEND_ORBIT_RADIUS;
                            const y = Math.sin(rad) * FRIEND_ORBIT_RADIUS;
                            const initials = (friend.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2);
                            return (
                                <div
                                    key={friend.clerk_user_id}
                                    title={friend.full_name || 'Friend'}
                                onClick={() => setHoveredFriendId(prev => prev === friend.clerk_user_id ? null : friend.clerk_user_id)}
                                    style={{
                                        position: 'absolute',
                                        width: `${FRIEND_AVT_SIZE}px`, height: `${FRIEND_AVT_SIZE}px`,
                                        borderRadius: '50%', overflow: 'hidden',
                                        transform: `translate(${x}px, ${y}px)`,
                                        border: `2px solid rgba(139,92,246,0.4)`,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        zIndex: 3, backgroundColor: th.badgeBg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    {friend.avatar_url
                                        ? <img src={friend.avatar_url} alt={friend.full_name}
                                               style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                                        : <span style={{fontSize: '0.7rem', fontWeight: '700', color: th.textSecondary,
                                            fontFamily: "'Poppins',sans-serif"}}>{initials}</span>}
                                </div>
                            );
                        })}

                        {total > 0 && orbitImages.map((biz, i) => {
                            const angle = (i / total) * 360 + rotation;
                            const rad = (angle * Math.PI) / 180;
                            const x = Math.cos(rad) * ORBIT_RADIUS;
                            const y = Math.sin(rad) * ORBIT_RADIUS;
                            const glow = glowingIndices.has(i);
                            return (
                                <div key={biz.id || i} style={{
                                    position: 'absolute',
                                    width: `${ORBIT_IMG_SIZE}px`, height: `${ORBIT_IMG_SIZE}px`,
                                    borderRadius: '50%', overflow: 'hidden',
                                    transform: `translate(${x}px, ${y}px)`,
                                    transition: 'box-shadow 0.4s ease',
                                    boxShadow: glow
                                        ? '0 0 26px rgba(139,92,246,0.9), 0 0 52px rgba(99,102,241,0.5)'
                                        : '0 4px 16px rgba(0,0,0,0.35)',
                                    border: glow ? '3px solid rgba(139,92,246,0.9)' : `2.5px solid ${th.border}`,
                                    zIndex: 1,
                                }}>
                                    <img src={biz.image} alt={biz.name}
                                         style={{width: '100%', height: '100%', objectFit: 'cover'}} loading="lazy"/>
                                </div>
                            );
                        })}
                        {hoveredFriendId && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '100%',
                                marginLeft: '16px',
                                transform: 'translateY(-50%)',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '12px',
                                backgroundColor: th.cardBg,
                                border: `1px solid ${th.border}`,
                                width: '260px',
                                fontFamily: "'Poppins',sans-serif",
                                fontSize: '0.72rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                                zIndex: 4,
                            }}>
                                <div style={{marginBottom: '0.25rem'}}>
                                    <span style={{fontWeight: 600, color: th.text}}>
                                        {hoveredFriendProfile?.full_name || 'Friend'}'s taste profile
                                    </span>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                                    <div>
                                        <p style={{margin: '0 0 0.15rem', color: th.textMuted}}>They like</p>
                                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.22rem'}}>
                                            {(hoveredFriendPrefs?.cuisines || []).slice(0, 5).map(c => (
                                                <span key={c} style={{
                                                    padding: '0.08rem 0.4rem',
                                                    borderRadius: '999px',
                                                    backgroundColor: th.badgeBg,
                                                    border: `1px solid ${th.border}`,
                                                }}>{c}</span>
                                            ))}
                                            {(hoveredFriendPrefs?.categories || []).slice(0, 3).map(c => (
                                                <span key={c} style={{
                                                    padding: '0.08rem 0.4rem',
                                                    borderRadius: '999px',
                                                    backgroundColor: th.badgeBg,
                                                    border: `1px solid ${th.border}`,
                                                }}>{c}</span>
                                            ))}
                                            {!hoveredFriendPrefs && (
                                                <span style={{color: th.textMuted}}>No saved taste profile yet</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{margin: '0 0 0.15rem', color: th.textMuted}}>In common with you</p>
                                        {commonCuisines.length === 0 && commonCategories.length === 0 && (
                                            <span style={{color: th.textMuted}}>No overlap saved yet</span>
                                        )}
                                        {(commonCuisines.length > 0 || commonCategories.length > 0) && (
                                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.22rem'}}>
                                                {commonCuisines.map(c => (
                                                    <span key={`cc-${c}`} style={{
                                                        padding: '0.08rem 0.4rem',
                                                        borderRadius: '999px',
                                                        backgroundColor: 'rgba(34,197,94,0.1)',
                                                        border: '1px solid rgba(34,197,94,0.4)',
                                                        color: th.text,
                                                    }}>{c}</span>
                                                ))}
                                                {commonCategories.map(c => (
                                                    <span key={`cat-${c}`} style={{
                                                        padding: '0.08rem 0.4rem',
                                                        borderRadius: '999px',
                                                        backgroundColor: 'rgba(34,197,94,0.1)',
                                                        border: '1px solid rgba(34,197,94,0.4)',
                                                        color: th.text,
                                                    }}>{c}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {friendsList.length > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        marginTop: '0.6rem', padding: '0.2rem 0.6rem',
                        borderRadius: '20px', backgroundColor: 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                        <Users size={12} color="#8b5cf6"/>
                        <span style={{
                            fontSize: '0.68rem', fontWeight: '600', color: '#8b5cf6',
                            fontFamily: "'Poppins',sans-serif",
                        }}>You + {friendsList.length} friend{friendsList.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {isThinking && (
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem'}}>
                        <Loader2 size={15} color="#8b5cf6" style={{animation: 'spin 1s linear infinite'}}/>
                        <p style={{
                            fontSize: '0.82rem', color: '#8b5cf6', fontWeight: '500',
                            fontFamily: "'Poppins',sans-serif", margin: 0,
                        }}>{currentPhrase}</p>
                    </div>
                )}

                {showingResults && searchResults.length > 0 && !isThinking && (
                    <p style={{
                        fontSize: '0.82rem', color: th.textMuted, margin: '0.5rem 0 0',
                        fontFamily: "'Poppins',sans-serif",
                    }}>Found {searchResults.length} small business match{searchResults.length !== 1 ? 'es' : ''} for {groupSize > 1 ? 'your group' : 'you'}</p>
                )}

                {/* ── Error ──────────────────────────────────── */}
                {searchError && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.8rem', marginTop: '0.5rem',
                        borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                    }}>
                        <AlertCircle size={15} color="#ef4444"/>
                        <p style={{fontSize: '0.78rem', color: '#ef4444', margin: 0, fontFamily: "'Poppins',sans-serif"}}>{searchError}</p>
                    </div>
                )}

                {/* ── Result Cards ────────────────────────────── */}
                {showingResults && searchResults.length > 0 && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.6rem',
                        width: '100%', maxWidth: '560px', marginTop: '0.8rem',
                    }}>
                        {searchResults.map((biz, i) => {
                            const hov = hoveredCard === i;
                            return (
                                <div key={biz.id || i}
                                     onClick={() => navigate(`/business/${biz.id}`)}
                                     onMouseEnter={() => setHoveredCard(i)}
                                     onMouseLeave={() => setHoveredCard(null)}
                                     style={{
                                         display: 'flex', gap: '0.85rem', padding: '0.85rem',
                                         borderRadius: '12px', border: `1px solid ${th.border}`,
                                         backgroundColor: hov ? th.hoverBg : th.cardBg,
                                         cursor: 'pointer', transition: '0.15s',
                                     }}>
                                    <div style={{
                                        width: '80px', minWidth: '80px', height: '80px',
                                        borderRadius: '10px', overflow: 'hidden',
                                        backgroundColor: th.badgeBg, position: 'relative',
                                    }}>
                                        <img src={biz.image} alt={biz.name}
                                             style={{width: '100%', height: '100%', objectFit: 'cover'}} loading="lazy"/>
                                        <div style={{
                                            position: 'absolute', top: '4px', right: '4px',
                                            padding: '1px 5px', borderRadius: '6px',
                                            backgroundColor: getMatchColor(biz.matchScore),
                                            fontSize: '0.62rem', fontWeight: '700', color: '#fff',
                                            fontFamily: "'Poppins',sans-serif",
                                        }}>{biz.matchScore}%</div>
                                    </div>

                                    <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem'}}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                                            <h3 style={{
                                                fontSize: '0.88rem', fontWeight: '600', color: th.text,
                                                margin: 0, lineHeight: 1.2, overflow: 'hidden',
                                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{biz.name}</h3>
                                            {biz.isVerified && (
                                                <div style={{
                                                    width: '14px', height: '14px', borderRadius: '50%',
                                                    backgroundColor: '#3b82f6', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
                                            {biz.rating && (
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}>
                                                    <Star size={11} fill="#facc15" color="#facc15"/>
                                                    <span style={{fontSize: '0.73rem', fontWeight: '600', color: th.text}}>{biz.rating}</span>
                                                    {biz.reviewCount > 0 && <span style={{fontSize: '0.65rem', color: th.textMuted}}>({biz.reviewCount})</span>}
                                                </div>
                                            )}
                                            {biz.priceLevel && <span style={{fontSize: '0.7rem', color: th.textMuted}}>{biz.priceLevel}</span>}
                                            {biz.distanceMeters != null && (
                                                <span style={{fontSize: '0.66rem', color: th.textMuted}}>
                                                    {biz.distanceMeters < 1000 ? `${biz.distanceMeters}m` : `${(biz.distanceMeters / 1000).toFixed(1)}km`}
                                                </span>
                                            )}
                                        </div>

                                        {biz.tagLabels?.length > 0 && (
                                            <div style={{display: 'flex', gap: '0.25rem', flexWrap: 'wrap'}}>
                                                {biz.tagLabels.slice(0, 3).map(t => (
                                                    <span key={t} style={{
                                                        padding: '0.1rem 0.45rem', borderRadius: '4px',
                                                        backgroundColor: th.badgeBg, fontSize: '0.62rem',
                                                        color: th.textSecondary, fontWeight: '500',
                                                    }}>{t}</span>
                                                ))}
                                            </div>
                                        )}

                                        <p style={{
                                            fontSize: '0.72rem', color: '#8b5cf6', margin: '0.1rem 0 0',
                                            fontStyle: 'italic', lineHeight: 1.3,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>{biz.matchReasoning}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Search Input — pinned to bottom ──────────────── */}
            <div style={{
                flexShrink: 0, padding: '0.7rem 1.5rem',
                borderTop: `1px solid ${th.border}`,
                backgroundColor: th.bg,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    width: '100%', maxWidth: '560px',
                    padding: '0.55rem 0.7rem 0.55rem 1rem', borderRadius: '14px',
                    border: `2px solid ${isThinking ? 'rgba(139,92,246,0.5)' : 'rgba(99,102,241,0.25)'}`,
                    backgroundColor: th.inputBg,
                    boxShadow: isThinking ? '0 4px 24px rgba(139,92,246,0.15)' : '0 2px 12px rgba(99,102,241,0.06)',
                    transition: '0.3s',
                }}>
                    <Bot size={18} color="#8b5cf6"/>
                    <input value={query}
                           onChange={e => setQuery(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSearch()}
                           placeholder="Search small businesses near you..."
                           disabled={isThinking}
                           style={{
                               flex: 1, border: 'none', background: 'transparent', fontSize: '0.86rem',
                               fontFamily: "'Poppins',sans-serif", color: th.text, outline: 'none',
                               opacity: isThinking ? 0.5 : 1,
                           }}/>
                    <button onClick={() => handleSearch()} disabled={isThinking || !query.trim()} style={{
                        padding: '0.45rem 0.9rem', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff', fontWeight: '600', fontSize: '0.82rem',
                        cursor: isThinking ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        opacity: (isThinking || !query.trim()) ? 0.5 : 1, transition: '0.2s',
                    }}>
                        {isThinking
                            ? <Loader2 size={14} style={{animation: 'spin 1s linear infinite'}}/>
                            : <Search size={14}/>}
                        {isThinking ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {!showingResults && (
                    <div style={{display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center'}}>
                        {AI_SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => { setQuery(s); handleSearch(s); }} style={{
                                padding: '0.25rem 0.65rem', borderRadius: '50px',
                                border: `1px solid ${th.border}`, backgroundColor: th.badgeBg,
                                fontSize: '0.68rem', color: th.textSecondary, cursor: 'pointer',
                                fontFamily: "'Poppins',sans-serif", fontWeight: '500', transition: '0.15s',
                            }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = th.border; e.currentTarget.style.color = th.textSecondary; }}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


/* ═══════════════════════════════════════════════════════════════
   DISCOVER TAB
   ═══════════════════════════════════════════════════════════════ */
const DiscoverContent = ({th, favs, toggleFav}) => {
    const [searchParams] = useSearchParams();
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
    const categoryFromUrlSearched = useRef(false);
    const [sortBy, setSortBy] = useState('relevance');
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    useEffect(() => {
        const categoryFromUrl = searchParams.get('category');
        if (categoryFromUrl) setSelCat(categoryFromUrl);
        if (!categoryFromUrl || categoryFromUrlSearched.current) return;
        categoryFromUrlSearched.current = true;
        const DEFAULT_LAT = 40.56;
        const DEFAULT_LNG = -111.93;
        doSearch({ category: categoryFromUrl, query: '', lat: DEFAULT_LAT, lng: DEFAULT_LNG, useAsUserLoc: false });
        if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
            navigator.geolocation.getCurrentPosition(
                pos => doSearch({ category: categoryFromUrl, query: '', lat: pos.coords.latitude, lng: pos.coords.longitude, useAsUserLoc: true }),
                () => {},
                { timeout: 8000, maximumAge: 60000 }
            );
        }
    // Category-from-URL: only depend on searchParams so this runs when navigating with ?category=; doSearch is stable and we pass full opts
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        const h = e => {
            if (sRef.current && !sRef.current.contains(e.target)) setShowSD(false);
            if (lRef.current && !lRef.current.contains(e.target)) setShowLD(false);
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) setSortDropdownOpen(false);
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
        let lat = opts.lat ?? mapC?.lat ?? uLoc?.lat;
        let lng = opts.lng ?? mapC?.lng ?? uLoc?.lng;

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

        if (opts.lat != null && opts.lng != null) {
            setMapC({lat, lng});
            setFlyTarget({lat, lng});
            if (opts.useAsUserLoc) {
                setULoc({lat, lng});
                setLq('Current Location');
            } else {
                setLq('South Jordan, UT');
            }
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
            if (uLoc || opts.useAsUserLoc || loc === 'Current Location') {
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

    const SORT_OPTIONS = [
        { value: 'relevance', label: 'Relevance' },
        { value: 'rating_high', label: 'Rating: High to Low' },
        { value: 'rating_low', label: 'Rating: Low to High' },
        { value: 'reviews', label: 'Most Reviews' },
        { value: 'distance', label: 'Distance: Nearest' },
        { value: 'name_asc', label: 'Name: A–Z' },
        { value: 'name_desc', label: 'Name: Z–A' },
    ];
    const sortedBiz = useMemo(() => {
        const list = [...biz];
        switch (sortBy) {
            case 'rating_high':
                return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
            case 'rating_low':
                return list.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
            case 'reviews':
                return list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
            case 'distance':
                return list.sort((a, b) => (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999));
            case 'name_asc':
                return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'name_desc':
                return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            default:
                return list;
        }
    }, [biz, sortBy]);

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
                color: th.textMuted,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <span>{total} results</span>
                <div ref={sortDropdownRef} style={{position: 'relative'}}>
                    <button
                        type="button"
                        onClick={() => setSortDropdownOpen(o => !o)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.3rem 0.5rem',
                            borderRadius: '8px',
                            border: `1px solid ${th.border}`,
                            backgroundColor: th.inputBg,
                            color: th.textSecondary,
                            fontSize: '0.72rem',
                            fontFamily: "'Poppins',sans-serif",
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowUpDown size={12}/>
                        {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
                        <ChevronDown size={12} style={{opacity: sortDropdownOpen ? 0.7 : 0.5}}/>
                    </button>
                    {sortDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.2rem',
                            minWidth: '180px',
                            backgroundColor: th.dropdownBg,
                            border: `1px solid ${th.border}`,
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            overflow: 'hidden'
                        }}>
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '0.45rem 0.75rem',
                                        border: 'none',
                                        background: sortBy === opt.value ? th.activeBg : 'transparent',
                                        color: sortBy === opt.value ? th.text : th.textSecondary,
                                        fontSize: '0.78rem',
                                        fontFamily: "'Poppins',sans-serif",
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </span></div>}

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
                    {sortedBiz.map(b => (<Marker key={b.id} position={[b.lat, b.lng]} icon={pinIcon(hovBiz === b.id)}
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
                    <div style={{flex: 1, overflowY: 'auto'}}>{sortedBiz.map(b => <BizCard key={b.id} biz={b} th={th}
                                                                                     hov={hovBiz === b.id}
                                                                                     onHov={setHovBiz} onFav={toggleFav}
                                                                                     isFav={favs.has(b.id)}
                                                                                     onNavigate={(name) => window.location.href = `/business/${encodeURIComponent(name)}`}
                    />)}
                        {sortedBiz.length === 0 && <div style={{textAlign: 'center', padding: '3rem 1.5rem'}}><p
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

/* ─── Favorites tab: list of favorited businesses ───────────── */
const FavoritesContent = ({ th, favoritesList, toggleFav, onNavigate }) => {
    if (!favoritesList || favoritesList.length === 0) {
        return <PH th={th} icon={Heart} title="Favorites" desc="Heart businesses to save them here"/>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '0.8rem 1rem', borderBottom: `1px solid ${th.border}` }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: th.text }}>Your favorites</span>
                <span style={{ fontSize: '0.78rem', color: th.textMuted, marginLeft: '0.4rem' }}>{favoritesList.length} saved</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {favoritesList.map(b => (
                    <BizCard
                        key={b.id}
                        biz={b}
                        th={th}
                        hov={false}
                        onHov={() => {}}
                        onFav={toggleFav}
                        isFav={true}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>
        </div>
    );
};

/* ─── Reviews tab: list of user's reviews ────────────────────── */
const ReviewsContent = ({ th, userId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        getReviews(userId)
            .then(list => setReviews(list || []))
            .catch(() => setReviews([]))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <Loader2 size={28} color={th.textMuted} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.85rem', color: th.textMuted }}>Loading your reviews...</span>
            </div>
        );
    }
    if (!reviews.length) {
        return <PH th={th} icon={Star} title="My Reviews" desc="Your reviews show here"/>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '0.8rem 1rem', borderBottom: `1px solid ${th.border}` }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: th.text }}>Your reviews</span>
                <span style={{ fontSize: '0.78rem', color: th.textMuted, marginLeft: '0.4rem' }}>{reviews.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {reviews.map(r => (
                    <div
                        key={r.id}
                        onClick={() => nav(`/business/${encodeURIComponent(r.businessName)}`)}
                        style={{
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            backgroundColor: th.cardBg,
                            border: `1px solid ${th.border}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = th.hoverBg; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = th.cardBg; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', gap: 1 }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={12} fill={s <= (r.rating || 0) ? '#f59e0b' : 'none'} color="#f59e0b" />
                                ))}
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: th.text }}>{r.businessName}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: th.textSecondary, margin: '0 0 0.25rem', lineHeight: 1.5 }}>{r.text}</p>
                        <span style={{ fontSize: '0.7rem', color: th.textMuted }}>{r.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

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
        <div style={{
            padding: '2rem 3rem',
            maxWidth: '1000px',
            margin: '0 auto',
            overflowY: 'auto',
            height: '100%',
            width: '100%',
        }}>
            <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: th.text, marginBottom: '2rem'}}>Settings</h1>

            {/* App toggles - spread in a row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '2rem',
            }}>
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
                        padding: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div><h3 style={{fontSize: '0.88rem', fontWeight: '600', color: th.text, margin: '0 0 0.1rem'}}>{it.title}</h3>
                            <p style={{fontSize: '0.72rem', color: th.textMuted, margin: 0}}>{it.desc}</p></div>
                        <button onClick={it.fn} style={{
                            width: '42px', height: '24px', borderRadius: '12px', border: 'none',
                            backgroundColor: it.isOn ? th.accent : th.border, cursor: 'pointer', position: 'relative', flexShrink: 0
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
            </div>

            {/* Taste Profile - two columns */}
            <div style={{
                borderTop: `1px solid ${th.border}`,
                marginTop: '1.5rem',
                paddingTop: '2rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem 3rem',
            }}>
                <h2 style={{fontSize: '1rem', fontWeight: '700', color: th.text, marginBottom: '1.2rem', gridColumn: '1 / -1'}}>Taste Profile</h2>

                <div>
                    <h3 style={{fontSize: '0.85rem', fontWeight: '600', color: th.text, marginBottom: '0.5rem'}}>Favorite Cuisines</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem'}}>
                        {CUISINE_OPTIONS.map(c => (
                            <button key={c} onClick={() => toggleChip(cuisines, setCuisines, c)} style={chipStyle(cuisines.includes(c))}>{c}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 style={{fontSize: '0.85rem', fontWeight: '600', color: th.text, marginBottom: '0.5rem'}}>Business Categories</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem'}}>
                        {CATEGORY_OPTIONS.map(c => (
                            <button key={c} onClick={() => toggleChip(categories, setCategories, c)} style={chipStyle(categories.includes(c))}>{c}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 style={{fontSize: '0.85rem', fontWeight: '600', color: th.text, marginBottom: '0.5rem'}}>Price Level</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem'}}>
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

                <div>
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

                <div style={{gridColumn: '1 / -1'}}>
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
            </div>

            {/* Account actions - spread in a row */}
            <div style={{
                borderTop: `1px solid ${th.border}`,
                marginTop: '2rem',
                paddingTop: '2rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
            }}>
                <button onClick={() => signOut(() => nav('/'))} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.65rem 1.5rem', minWidth: '140px',
                    backgroundColor: 'transparent', color: th.textSecondary,
                    border: `1px solid ${th.border}`, borderRadius: '10px', cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem',
                }}>Sign out</button>
                <button onClick={handleDeleteAccount} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.65rem 1.5rem', minWidth: '140px',
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
    const [searchParams] = useSearchParams();
    const [isDark, setDark] = useState(true);
    const [tab, setTab] = useState('discover');
    const [sbO, setSbO] = useState(false);
    const [favoritesList, setFavoritesList] = useState([]);
    const th = isDark ? dark : light;
    const sw = sbO ? 230 : 58;

    useEffect(() => {
        if (!user?.id) return;
        getFavorites(user.id)
            .then(list => setFavoritesList(Array.isArray(list) ? list : []))
            .catch(() => setFavoritesList([]));
    }, [user?.id]);

    const favs = useMemo(() => new Set(favoritesList.map(b => b.id)), [favoritesList]);

    const tF = useCallback(biz => {
        if (!user?.id || !biz?.id) return;
        const isFav = favoritesList.some(b => b.id === biz.id);
        let next;
        if (isFav) {
            next = favoritesList.filter(b => b.id !== biz.id);
        } else {
            next = [...favoritesList, biz];
        }
        setFavoritesList(next);
        setFavorites(user.id, next).catch(() => setFavoritesList(favoritesList));
    }, [user?.id, favoritesList]);

    const onNavigateToBiz = useCallback(name => {
        nav(`/business/${encodeURIComponent(name)}`);
    }, [nav]);

    const content = () => {
        switch (tab) {
            case 'discover':
                return <DiscoverContent th={th} favs={favs} toggleFav={tF}/>;
            case 'digital':
                return <DigitalPage isDark={isDark} />;
            case 'favorites':
                return <FavoritesContent th={th} favoritesList={favoritesList} toggleFav={tF} onNavigate={onNavigateToBiz}/>;
            case 'deals':
                return <DealsContent th={th}/>;
            case 'reviews':
                return <ReviewsContent th={th} userId={user?.id}/>;
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