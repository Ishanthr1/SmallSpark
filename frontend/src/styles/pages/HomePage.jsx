import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {SignInButton, SignUpButton, UserButton, useUser} from '@clerk/clerk-react';
import {
    Search, MapPin, Star, Heart, TrendingUp, Sparkles, X, Check,
    Store, Users, Award, Zap, Filter, ChevronRight, ArrowRight,
    Globe, Shield, Clock, Coffee, Scissors, Utensils, Dumbbell,
    ShoppingBag, Wrench, Palette, Music, Phone, Mail, Moon, Sun,
    ChevronLeft, Languages
} from 'lucide-react';
import InteractiveGlobe from './InteractiveGlobe.jsx';

// ─── Theme Colors ─────────────────────────────────────────────
const lightTheme = {
    bg: '#ffffff',
    bgAlt: '#fafafa',
    text: '#1a1a1a',
    textSecondary: '#555555',
    textMuted: '#999999',
    border: '#ebebeb',
    cardBg: '#ffffff',
    cardBgAlt: '#f7f7f7',
    accent: '#1a1a1a',
    accentText: '#ffffff',
    navBg: 'rgba(255,255,255,0.92)',
    footerBg: '#0a0a0a',
    footerText: '#ffffff',
    footerTextSecondary: '#888888',
    tintBlue: '#f0f4ff',
    tintGreen: '#f0faf4',
    tintAmber: '#fffbf0',
    tintRose: '#fff0f3',
    tintPurple: '#f5f0ff',
    tintCyan: '#f0fbff',
    borderTintBlue: '#dce5f5',
    borderTintGreen: '#d4eddc',
    borderTintAmber: '#f0e6cc',
    borderTintRose: '#f5d5dc',
    borderTintPurple: '#e2d5f5',
    borderTintCyan: '#d0ecf5',
};

const darkTheme = {
    bg: '#0a0a0a',
    bgAlt: '#111111',
    text: '#f0f0f0',
    textSecondary: '#aaaaaa',
    textMuted: '#666666',
    border: '#222222',
    cardBg: '#141414',
    cardBgAlt: '#111111',
    accent: '#f0f0f0',
    accentText: '#0a0a0a',
    navBg: 'rgba(10,10,10,0.92)',
    footerBg: '#050505',
    footerText: '#f0f0f0',
    footerTextSecondary: '#777777',
    tintBlue: '#0d1520',
    tintGreen: '#0d1a12',
    tintAmber: '#1a1508',
    tintRose: '#1a0d10',
    tintPurple: '#130d1a',
    tintCyan: '#0d171a',
    borderTintBlue: '#1a2535',
    borderTintGreen: '#1a2e22',
    borderTintAmber: '#2e2515',
    borderTintRose: '#2e1a20',
    borderTintPurple: '#221a2e',
    borderTintCyan: '#1a2a2e',
};

// ─── Data ─────────────────────────────────────────────────────
const categories = [
    {name: 'Food & Dining', icon: Utensils, count: '1,234', description: 'Restaurants, cafes, and food trucks'},
    {name: 'Retail & Shopping', icon: ShoppingBag, count: '856', description: 'Local shops and boutiques'},
    {name: 'Health & Beauty', icon: Heart, count: '642', description: 'Salons, spas, and wellness'},
    {name: 'Professional Services', icon: Award, count: '523', description: 'Business and consulting'},
    {name: 'Arts & Crafts', icon: Palette, count: '398', description: 'Creative studios and galleries'},
    {name: 'Home Services', icon: Wrench, count: '467', description: 'Repair and maintenance'},
    {name: 'Entertainment', icon: Music, count: '289', description: 'Events and activities'},
    {name: 'Fitness & Wellness', icon: Dumbbell, count: '356', description: 'Gyms and fitness centers'}
];

const features = [
    {icon: MapPin, title: 'Interactive Maps', text: 'Explore businesses with our interactive map feature powered by real-time location data.', tint: 'Blue'},
    {icon: Star, title: 'Verified Reviews', text: 'Read authentic reviews from real customers who have experienced the businesses firsthand.', tint: 'Amber'},
    {icon: Heart, title: 'Save Favorites', text: 'Bookmark your favorite businesses and create custom collections for easy access.', tint: 'Rose'},
    {icon: TrendingUp, title: 'Exclusive Deals', text: 'Access special offers and time-limited deals exclusive to Spark members.', tint: 'Green'},
    {icon: Globe, title: 'Nationwide Coverage', text: 'Discover small businesses across the country, from your hometown to new destinations.', tint: 'Purple'},
    {icon: Shield, title: 'Verified Businesses', text: 'All businesses are verified and vetted to ensure quality and authenticity.', tint: 'Cyan'}
];

const reviews = [
    {quote: "Spark helped me find the best local coffee shop I never knew existed. The reviews were spot-on and the deals saved me money every week.", name: "Jordan Kim", role: "Regular User", rating: 5},
    {quote: "As a small business owner, Spark brought in so many new customers. The platform is easy to use and the verification process builds real trust.", name: "Melissa Grant", role: "Business Owner", rating: 5},
    {quote: "I use Spark every time I travel to find authentic local spots. It's like having a friend in every city who knows all the hidden gems.", name: "Alex Johnson", role: "Frequent Traveler", rating: 5},
    {quote: "The category filtering and smart recommendations are incredible. Spark understands what I'm looking for before I even finish typing.", name: "Priya Patel", role: "Food Enthusiast", rating: 5},
    {quote: "Our family uses Spark to support local businesses every weekend. It's become part of our routine to discover something new together.", name: "David Chen", role: "Community Member", rating: 5}
];

const typingPhrases = [
    "Connect with authentic local businesses, discover exclusive deals, and support your community — all in one place.",
    "Find hidden gems in your neighborhood, read real reviews, and save your favorite spots for later.",
    "Support small businesses that make your community unique — explore deals, ratings, and more.",
    "Your go-to platform for discovering local shops, restaurants, and services you'll love."
];

const tintColors = ['Blue', 'Green', 'Amber', 'Rose', 'Purple', 'Cyan', 'Blue', 'Green'];

// ─── Typing Animation Hook ───────────────────────────────────
const useTypingAnimation = (phrases, typingSpeed = 35, deletingSpeed = 20, pauseDuration = 2500) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentPhrase = phrases[currentPhraseIndex];
        let timeout;
        if (!isDeleting) {
            if (displayText.length < currentPhrase.length) {
                timeout = setTimeout(() => setDisplayText(currentPhrase.slice(0, displayText.length + 1)), typingSpeed);
            } else {
                timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
            }
        } else {
            if (displayText.length > 0) {
                timeout = setTimeout(() => setDisplayText(displayText.slice(0, -1)), deletingSpeed);
            } else {
                setIsDeleting(false);
                setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
            }
        }
        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration]);

    return displayText;
};

// ─── Infinite Carousel ────────────────────────────────────────
const InfiniteCarousel = ({items, renderCard, speed = 30, cardWidth = 320, gap = 20, reverse = false}) => {
    const trackRef = useRef(null);
    const offsetRef = useRef(0);
    const animRef = useRef(null);
    const lastTimeRef = useRef(null);

    const tripled = [...items, ...items, ...items];
    const singleSetWidth = items.length * (cardWidth + gap);

    useEffect(() => {
        const animate = (timestamp) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const delta = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            if (reverse) {
                offsetRef.current -= (speed * delta) / 1000;
                if (offsetRef.current <= 0) offsetRef.current += singleSetWidth;
            } else {
                offsetRef.current += (speed * delta) / 1000;
                if (offsetRef.current >= singleSetWidth) offsetRef.current -= singleSetWidth;
            }

            if (trackRef.current) {
                trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
            }
            animRef.current = requestAnimationFrame(animate);
        };

        if (reverse) offsetRef.current = singleSetWidth;
        animRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animRef.current);
    }, [speed, singleSetWidth, reverse]);

    return (
        <div style={{overflow: 'hidden', width: '100%', position: 'relative'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, var(--carousel-bg), transparent)', zIndex: 2, pointerEvents: 'none'}}/>
            <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, var(--carousel-bg), transparent)', zIndex: 2, pointerEvents: 'none'}}/>
            <div ref={trackRef} style={{display: 'flex', gap: `${gap}px`, willChange: 'transform'}}>
                {tripled.map((item, i) => (
                    <div key={i} style={{flex: `0 0 ${cardWidth}px`, minWidth: `${cardWidth}px`}}>
                        {renderCard(item, i % items.length)}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Diagonal Divider ─────────────────────────────────────────
const DiagonalDivider = ({fromColor, toColor, direction = 'left', height = 60}) => {
    if (direction === 'left') {
        return (
            <div style={{position: 'relative', height: `${height}px`, overflow: 'hidden', zIndex: 1}}>
                <div style={{position: 'absolute', inset: 0, backgroundColor: fromColor}}/>
                <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%'}}>
                    <polygon points={`0,${height} 100,0 100,${height}`} fill={toColor}/>
                </svg>
            </div>
        );
    } else {
        return (
            <div style={{position: 'relative', height: `${height}px`, overflow: 'hidden', zIndex: 1}}>
                <div style={{position: 'absolute', inset: 0, backgroundColor: fromColor}}/>
                <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%'}}>
                    <polygon points={`0,0 100,${height} 100,${height} 0,${height}`} fill={toColor}/>
                </svg>
            </div>
        );
    }
};

// ─── Feature Card ─────────────────────────────────────────────
const FeatureCard = ({feature, theme}) => {
    const tintKey = `tint${feature.tint}`;
    const borderKey = `borderTint${feature.tint}`;
    return (
        <div style={{backgroundColor: theme[tintKey] || theme.cardBg, border: `1.5px solid ${theme[borderKey] || theme.border}`, borderRadius: '16px', padding: '2rem', height: '100%', cursor: 'default'}}>
            <div style={{width: '46px', height: '46px', borderRadius: '12px', border: `1.5px solid ${theme[borderKey] || theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: theme.text}}>
                <feature.icon size={21}/>
            </div>
            <h3 style={{fontSize: '1.08rem', fontWeight: '600', marginBottom: '0.5rem', color: theme.text}}>{feature.title}</h3>
            <p style={{fontSize: '0.86rem', color: theme.textSecondary, lineHeight: '1.6', margin: 0}}>{feature.text}</p>
        </div>
    );
};

// ─── Category Card ────────────────────────────────────────────
const CategoryCard = ({cat, theme, tint}) => {
    const tintKey = `tint${tint}`;
    const borderKey = `borderTint${tint}`;
    return (
        <div style={{backgroundColor: theme[tintKey] || theme.cardBg, border: `1.5px solid ${theme[borderKey] || theme.border}`, borderRadius: '16px', padding: '1.75rem 1.25rem', textAlign: 'center', height: '100%', cursor: 'default'}}>
            <div style={{width: '50px', height: '50px', borderRadius: '13px', border: `1.5px solid ${theme[borderKey] || theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.9rem', color: theme.text}}>
                <cat.icon size={23}/>
            </div>
            <h3 style={{fontSize: '0.98rem', fontWeight: '600', marginBottom: '0.25rem', color: theme.text}}>{cat.name}</h3>
            <p style={{fontSize: '0.75rem', color: theme.textMuted, marginBottom: '0.15rem'}}>{cat.description}</p>
            <p style={{fontSize: '0.75rem', color: theme.textSecondary, fontWeight: '500', margin: 0}}>{cat.count} businesses</p>
        </div>
    );
};

// ─── Review Card ──────────────────────────────────────────────
const ReviewCard = ({review, theme}) => (
    <div style={{backgroundColor: theme.cardBg, border: `1.5px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
        <div>
            <div style={{display: 'flex', gap: '2px', marginBottom: '1rem'}}>
                {[1,2,3,4,5].map(s => (<Star key={s} size={14} fill={s <= review.rating ? '#f59e0b' : 'none'} color="#f59e0b"/>))}
            </div>
            <p style={{fontSize: '0.88rem', color: theme.textSecondary, lineHeight: '1.7', fontStyle: 'italic', margin: '0 0 1.5rem 0'}}>"{review.quote}"</p>
        </div>
        <div>
            <p style={{fontSize: '0.88rem', fontWeight: '600', color: theme.text, margin: '0 0 0.1rem 0'}}>— {review.name}</p>
            <p style={{fontSize: '0.75rem', color: theme.textMuted, margin: 0, fontStyle: 'italic'}}>{review.role}</p>
        </div>
    </div>
);

// ─── Hero Section with Globe ──────────────────────────────────
const HeroSection = ({theme, onNavigate, isDarkMode}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const typedText = useTypingAnimation(typingPhrases, 30, 15, 2200);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) onNavigate();
    };

    return (
        <section style={{
            position: 'relative', width: '100%', minHeight: '100vh',
            display: 'flex', alignItems: 'center', backgroundColor: theme.bg,
            overflow: 'hidden', paddingTop: '100px', paddingBottom: '80px'
        }}>
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `radial-gradient(circle, ${theme.border} 0.8px, transparent 0.8px)`,
                backgroundSize: '32px 32px', opacity: 0.3
            }}/>

            <div style={{
                position: 'relative', zIndex: 1, maxWidth: '1280px', width: '100%',
                margin: '0 auto', padding: '0 2rem', display: 'flex',
                alignItems: 'center', gap: '2rem'
            }}>
                {/* Left Side — Text content */}
                <div style={{flex: '1 1 50%', maxWidth: '560px'}}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.35rem 0.9rem', border: `1.5px solid ${theme.border}`,
                        borderRadius: '50px', fontSize: '0.72rem', fontWeight: '600',
                        marginBottom: '2rem', color: theme.textMuted,
                        letterSpacing: '0.06em', textTransform: 'uppercase'
                    }}>
                        <Zap size={13}/>
                        <span>Discover Local. Support Small.</span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800',
                        marginBottom: '1.5rem', color: theme.text, lineHeight: '1.08',
                        fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.035em'
                    }}>
                        Find Local Businesses<br/>
                        <span style={{fontStyle: 'italic', fontWeight: '400'}}>You'll Love</span>
                    </h1>

                    <div style={{minHeight: '4.2rem', marginBottom: '2.5rem'}}>
                        <p style={{
                            fontSize: 'clamp(0.92rem, 1.4vw, 1.1rem)', color: theme.textSecondary,
                            fontWeight: '400', lineHeight: '1.65', margin: 0
                        }}>
                            {typedText}
                            <span style={{
                                display: 'inline-block', width: '2px', height: '1.1em',
                                backgroundColor: theme.text, marginLeft: '2px',
                                verticalAlign: 'text-bottom', animation: 'cursorBlink 0.7s infinite'
                            }}/>
                        </p>
                    </div>

                    <form onSubmit={handleSearch} style={{maxWidth: '480px', marginBottom: '2.5rem'}}>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            backgroundColor: theme.cardBgAlt, borderRadius: '14px',
                            padding: '0.5rem 0.5rem 0.5rem 1.1rem',
                            border: isFocused ? `2px solid ${theme.accent}` : `1.5px solid ${theme.border}`,
                            transition: 'all 0.3s ease'
                        }}>
                            <Search size={17} style={{color: theme.textMuted, marginRight: '0.6rem', flexShrink: 0}}/>
                            <input
                                type="text" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Search for businesses near you..."
                                style={{
                                    flex: 1, border: 'none', background: 'transparent',
                                    fontSize: '0.92rem', fontFamily: "'Poppins', sans-serif",
                                    color: theme.text, outline: 'none', padding: '0.35rem 0'
                                }}
                            />
                            <button type="submit" style={{
                                background: theme.accent, border: 'none', borderRadius: '10px',
                                padding: '0.6rem 1.3rem', color: theme.accentText,
                                fontSize: '0.86rem', fontWeight: '600', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif",
                                whiteSpace: 'nowrap'
                            }}>
                                <span>Search</span>
                                <ArrowRight size={15}/>
                            </button>
                        </div>
                    </form>

                    <div style={{display: 'flex', gap: '2.5rem', alignItems: 'flex-start'}}>
                        {[
                            {val: '10,000+', label: 'Local Businesses'},
                            {val: '50,000+', label: 'Active Users'},
                            {val: '100,000+', label: 'Reviews Posted'}
                        ].map((s, i) => (
                            <div key={i}>
                                <div style={{fontSize: '1.4rem', fontWeight: '700', color: theme.text, marginBottom: '0.1rem', letterSpacing: '-0.02em'}}>{s.val}</div>
                                <div style={{fontSize: '0.68rem', color: theme.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side — Interactive Globe */}
                <div className="hero-right-side" style={{
                    flex: '1 1 50%', display: 'flex', justifyContent: 'center',
                    alignItems: 'center', position: 'relative'
                }}>
                    <InteractiveGlobe theme={theme} isDarkMode={isDarkMode} />
                </div>
            </div>
        </section>
    );
};

// ─── Carousel Section ─────────────────────────────────────────
const CarouselSection = ({title, subtitle, items, renderCard, theme, bgColor, speed, cardWidth, reverse}) => (
    <section style={{padding: '5rem 0', backgroundColor: bgColor, position: 'relative', zIndex: 1, '--carousel-bg': bgColor}}>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '0 2rem'}}>
            <div style={{textAlign: 'center', marginBottom: '2.5rem'}}>
                <h2 style={{fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: theme.text, letterSpacing: '-0.025em'}}>{title}</h2>
                <p style={{fontSize: '0.98rem', color: theme.textSecondary, maxWidth: '480px', margin: '0 auto'}}>{subtitle}</p>
            </div>
        </div>
        <InfiniteCarousel items={items} renderCard={renderCard} speed={speed || 35} cardWidth={cardWidth || 320} gap={20} reverse={reverse || false}/>
    </section>
);

// ─── Footer ───────────────────────────────────────────────────
const Footer = ({theme}) => {
    const footerLinks = {
        Product: ['Features', 'Pricing', 'API', 'Integrations'],
        Company: ['About', 'Blog', 'Careers', 'Press'],
        Support: ['Help Center', 'Contact', 'Privacy', 'Terms']
    };
    return (
        <footer style={{backgroundColor: theme.footerBg, color: theme.footerText, padding: '4rem 2rem 2rem', position: 'relative', zIndex: 1}}>
            <div style={{maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid #222'}}>
                <div>
                    <div style={{marginBottom: '1rem'}}>
                        <img src="/logo_dark.png" alt="Spark" style={{height: '32px', width: 'auto', display: 'block'}}/>
                    </div>
                    <p style={{fontSize: '0.85rem', color: theme.footerTextSecondary, lineHeight: '1.6', maxWidth: '260px', marginBottom: '1.5rem'}}>
                        Connecting communities with the local businesses they love. Discover, support, and grow together.
                    </p>
                    <div style={{display: 'flex', gap: '0.6rem'}}>
                        {['X', 'f', 'in', 'ig'].map((icon, i) => (
                            <div key={i} style={{width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#888', cursor: 'pointer', transition: 'all 0.2s ease'}}
                                 onMouseEnter={e => {e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff';}}
                                 onMouseLeave={e => {e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888';}}
                            >{icon}</div>
                        ))}
                    </div>
                </div>
                {Object.entries(footerLinks).map(([heading, links]) => (
                    <div key={heading}>
                        <h4 style={{fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: '1.25rem'}}>{heading}</h4>
                        {links.map(link => (
                            <a key={link} href="#" style={{display: 'block', fontSize: '0.88rem', color: '#ccc', textDecoration: 'none', marginBottom: '0.7rem', transition: 'color 0.2s'}}
                               onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                               onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                            >{link}</a>
                        ))}
                    </div>
                ))}
            </div>
            <div style={{maxWidth: '1280px', margin: '0 auto', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
                <p style={{fontSize: '0.78rem', color: '#666', margin: 0}}>© 2026 Spark. All rights reserved.</p>
                <div style={{display: 'flex', gap: '1.5rem'}}>
                    {['Privacy Policy', 'Terms of Service', 'Cookies'].map(link => (
                        <a key={link} href="#" style={{fontSize: '0.78rem', color: '#666', textDecoration: 'none', transition: 'color 0.2s'}}
                           onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                           onMouseLeave={e => e.currentTarget.style.color = '#666'}
                        >{link}</a>
                    ))}
                </div>
            </div>
        </footer>
    );
};

// ─── CTA Section ──────────────────────────────────────────────
const CTASection = ({theme, onNavigate}) => (
    <section style={{padding: '5rem 2rem', backgroundColor: theme.accent, color: theme.accentText, position: 'relative', zIndex: 1}}>
        <div style={{maxWidth: '650px', margin: '0 auto', textAlign: 'center'}}>
            <h2 style={{fontSize: '2.3rem', fontWeight: '700', marginBottom: '1rem', letterSpacing: '-0.02em'}}>Ready to discover local businesses?</h2>
            <p style={{fontSize: '1.1rem', marginBottom: '2.5rem', opacity: 0.8, lineHeight: '1.6'}}>Join thousands of users supporting small businesses in their community.</p>
            <button onClick={onNavigate} style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2rem', background: theme.accentText, color: theme.accent, border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif"}}>
                <span>Get Started Free</span>
                <ArrowRight size={18}/>
            </button>
        </div>
    </section>
);

// ═══════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
const HomePage = () => {
    const navigate = useNavigate();
    const {isSignedIn} = useUser();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const theme = isDarkMode ? darkTheme : lightTheme;

    const SITE_URL = 'https://YOUR_SITE_URL.com';
    const translateUrl = `https://translate.google.com/website?sl=en&tl=es&hl=en-US&u=${encodeURIComponent(SITE_URL)}`;

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress((window.scrollY / totalScroll) * 100);
        };
        window.addEventListener('scroll', handleScroll, {passive: true});
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleButtonClick = () => navigate('/dashboard');

    return (
        <div style={{
            fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            backgroundColor: theme.bg, color: theme.text, minHeight: '100vh',
            transition: 'background-color 0.3s ease, color 0.3s ease'
        }}>
            <div style={{position: 'fixed', top: 0, left: 0, height: '3px', width: `${scrollProgress}%`, background: theme.accent, zIndex: 1000, transition: 'width 0.1s ease'}}/>

            {/* Nav */}
            <nav style={{
                position: 'fixed', top: '0.75rem', left: '0.75rem', right: '0.75rem',
                margin: '0 auto', maxWidth: '1280px', borderRadius: '16px',
                backdropFilter: 'blur(20px)', backgroundColor: theme.navBg,
                border: `1px solid ${theme.border}`, padding: '0.6rem 0', zIndex: 100,
                transition: 'all 0.3s ease'
            }}>
                <div style={{padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div style={{cursor: 'pointer'}} onClick={handleButtonClick}>
                        <img src={isDarkMode ? '/logo_dark.png' : '/logo_light.png'} alt="Spark" style={{height: '36px', width: 'auto', display: 'block'}}/>
                    </div>
                    <div style={{display: 'flex', gap: '0.6rem', alignItems: 'center'}}>
                        <a href={translateUrl} target="_blank" rel="noopener noreferrer"
                           style={{background: 'transparent', border: `1.5px solid ${theme.border}`, borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', color: theme.text, textDecoration: 'none'}}
                           aria-label="Translate page"><Languages size={18}/></a>

                        <button onClick={() => setIsDarkMode(!isDarkMode)}
                                style={{background: 'transparent', border: `1.5px solid ${theme.border}`, borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', color: theme.text}}
                                aria-label="Toggle dark mode">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>

                        {isSignedIn ? (
                            <>
                                <button onClick={handleButtonClick} style={{padding: '0.5rem 1.2rem', border: `1.5px solid ${theme.border}`, background: 'transparent', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem', color: theme.text, transition: 'all 0.2s ease'}}>Dashboard</button>
                                <UserButton afterSignOutUrl="/"/>
                            </>
                        ) : (
                            <>
                                <SignInButton mode="modal">
                                    <button style={{padding: '0.5rem 1.2rem', border: `1.5px solid ${theme.border}`, background: 'transparent', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem', color: theme.text, transition: 'all 0.2s ease'}}>Sign In</button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button style={{padding: '0.5rem 1.2rem', border: 'none', background: theme.accent, color: theme.accentText, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem', transition: 'all 0.2s ease'}}>Get Started</button>
                                </SignUpButton>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <HeroSection theme={theme} onNavigate={handleButtonClick} isDarkMode={isDarkMode}/>

            <DiagonalDivider fromColor={theme.bg} toColor={theme.bgAlt} direction="left" height={64}/>
            <CarouselSection title="Why Choose Spark?" subtitle="Everything you need to discover and support local businesses" items={features} theme={theme} bgColor={theme.bgAlt} speed={30} cardWidth={320} reverse={false} renderCard={(feature) => <FeatureCard feature={feature} theme={theme}/>}/>

            <DiagonalDivider fromColor={theme.bgAlt} toColor={theme.bg} direction="right" height={64}/>
            <CarouselSection title="Browse by Category" subtitle="Explore thousands of local businesses organized by industry" items={categories} theme={theme} bgColor={theme.bg} speed={25} cardWidth={250} reverse={true} renderCard={(cat, i) => <CategoryCard cat={cat} theme={theme} tint={tintColors[i]}/>}/>

            <DiagonalDivider fromColor={theme.bg} toColor={theme.bgAlt} direction="left" height={64}/>
            <CarouselSection title="What Our Users Say" subtitle="Real stories from people who love supporting local businesses" items={reviews} theme={theme} bgColor={theme.bgAlt} speed={28} cardWidth={340} reverse={false} renderCard={(review) => <ReviewCard review={review} theme={theme}/>}/>

            <DiagonalDivider fromColor={theme.bgAlt} toColor={theme.accent} direction="right" height={64}/>
            <CTASection theme={theme} onNavigate={handleButtonClick}/>
            <Footer theme={theme}/>
        </div>
    );
};

// ─── Global Styles ────────────────────────────────────────────
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap');
  * { box-sizing: border-box; }
  ::placeholder { color: #999 !important; }

  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .globe-card {
    transition: opacity 0.8s ease, transform 0.8s ease !important;
  }

  @media (max-width: 900px) {
    .hero-right-side { display: none !important; }
  }
`;
document.head.appendChild(styleSheet);

export default HomePage;