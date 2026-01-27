import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import {
    Search, MapPin, Star, Heart, TrendingUp, Sparkles, X, Check,
    Store, Users, Award, Zap, Filter, ChevronRight, ArrowRight,
    Globe, Shield, Clock, Coffee, Scissors, Utensils, Dumbbell,
    ShoppingBag, Wrench, Palette, Music, Phone, Mail, Moon, Sun
} from 'lucide-react';

// Lighter pastel colors
const pastelColors = [
    '#FFE5E5', '#FFE5CC', '#FFFFCC', '#E5FFCC', '#CCFFE5',
    '#CCFFFF', '#CCE5FF', '#E5CCFF', '#FFCCFF', '#FFCCE5'
];

// Dark mode colors
const darkColors = {
    background: '#0f172a',
    cardBg: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155'
};

// Sample businesses for drag-and-drop board
const featuredBusinesses = [
    {
        id: 1,
        name: "Bloom Café",
        category: "Food & Dining",
        rating: 4.8,
        image: "☕",
        color: pastelColors[0],
        deals: "20% off coffee",
        description: "Cozy café with artisan coffee and fresh pastries",
        location: "Downtown Plaza",
        phone: "(555) 123-4567",
        position: { x: 50, y: 80 },
        rotation: -3
    },
    {
        id: 2,
        name: "The Cut Studio",
        category: "Health & Beauty",
        rating: 4.9,
        image: "✂️",
        color: pastelColors[4],
        deals: "Free consultation",
        description: "Premium hair styling and beauty services",
        location: "Main Street",
        phone: "(555) 234-5678",
        position: { x: 300, y: 100 },
        rotation: 2
    },
    {
        id: 3,
        name: "Artisan Bakery",
        category: "Food & Dining",
        rating: 4.7,
        image: "🥐",
        color: pastelColors[1],
        deals: "Buy 2 get 1 free",
        description: "Fresh baked goods daily, family recipes",
        location: "Oak Avenue",
        phone: "(555) 345-6789",
        position: { x: 550, y: 60 },
        rotation: -2
    },
    {
        id: 4,
        name: "Zenith Fitness",
        category: "Fitness",
        rating: 4.8,
        image: "💪",
        color: pastelColors[5],
        deals: "First month free",
        description: "Modern gym with personal training",
        location: "Park District",
        phone: "(555) 456-7890",
        position: { x: 800, y: 120 },
        rotation: 1
    },
    {
        id: 5,
        name: "Vintage Threads",
        category: "Retail",
        rating: 4.6,
        image: "👗",
        color: pastelColors[8],
        deals: "30% off sale items",
        description: "Curated vintage clothing and accessories",
        location: "Arts Quarter",
        phone: "(555) 567-8901",
        position: { x: 150, y: 300 },
        rotation: -4
    },
    {
        id: 6,
        name: "Fix-It Pro",
        category: "Services",
        rating: 4.9,
        image: "🔧",
        color: pastelColors[2],
        deals: "Free estimate",
        description: "Professional home repair services",
        location: "Industrial Park",
        phone: "(555) 678-9012",
        position: { x: 400, y: 280 },
        rotation: 3
    },
    {
        id: 7,
        name: "Green Leaf",
        category: "Food & Dining",
        rating: 4.7,
        image: "🌿",
        color: pastelColors[3],
        deals: "Happy hour 3-6pm",
        description: "Farm-to-table organic restaurant",
        location: "Riverside",
        phone: "(555) 789-0123",
        position: { x: 650, y: 320 },
        rotation: -1
    },
    {
        id: 8,
        name: "Pixel Studio",
        category: "Services",
        rating: 4.8,
        image: "🎨",
        color: pastelColors[7],
        deals: "First project 15% off",
        description: "Creative design and branding studio",
        location: "Tech Hub",
        phone: "(555) 890-1234",
        position: { x: 900, y: 250 },
        rotation: 2
    }
];

const categories = [
    { name: 'Food & Dining', icon: Store, count: '1,234', color: '#FF6B6B' },
    { name: 'Retail & Shopping', icon: Store, count: '856', color: '#4ECDC4' },
    { name: 'Health & Beauty', icon: Heart, count: '642', color: '#FFE66D' },
    { name: 'Professional Services', icon: Award, count: '523', color: '#95E1D3' },
    { name: 'Arts & Crafts', icon: Palette, count: '398', color: '#F38181' },
    { name: 'Home Services', icon: MapPin, count: '467', color: '#AA96DA' },
    { name: 'Entertainment', icon: Music, count: '289', color: '#FCBAD3' },
    { name: 'Fitness & Wellness', icon: Users, count: '356', color: '#A8D8EA' }
];

const stats = [
    { value: '10,000+', label: 'Local Businesses', icon: Store },
    { value: '50,000+', label: 'Active Users', icon: Users },
    { value: '100,000+', label: 'Reviews Posted', icon: Star },
    { value: '5,000+', label: 'Active Deals', icon: Award }
];

// Custom Dark Mode Toggle Component
const DarkModeToggle = ({ isDark, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            style={{
                background: 'transparent',
                border: '2px solid #e0e0e0',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: isDark ? '#f1f5f9' : '#1a1a1a'
            }}
            aria-label="Toggle dark mode"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

// Draggable Business Card Component
const DraggableBusinessCard = ({ business, onDragStart, onDragEnd, isHovered, onHover, isDarkMode }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [localPosition, setLocalPosition] = useState(business.position);
    const cardRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        setIsDragging(true);
        onDragStart(business.id);
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            setLocalPosition(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onDragEnd(business.id, localPosition);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, business.id, localPosition, onDragEnd]);

    return (
        <div
            ref={cardRef}
            style={{
                position: 'absolute',
                padding: '1.5rem',
                borderRadius: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none',
                fontFamily: "'Patrick Hand', cursive, 'Poppins', sans-serif",
                border: '2px solid rgba(0,0,0,0.08)',
                willChange: 'transform',
                left: `${localPosition.x}px`,
                top: `${localPosition.y}px`,
                backgroundColor: business.color,
                transform: isHovered
                    ? 'scale(1.15) rotate(0deg)'
                    : `rotate(${business.rotation}deg)`,
                zIndex: isDragging ? 1000 : (isHovered ? 100 : 1),
                cursor: isDragging ? 'grabbing' : 'grab',
                width: isHovered ? '320px' : '200px',
                height: isHovered ? 'auto' : '220px',
                boxShadow: isHovered
                    ? '0 20px 60px rgba(0,0,0,0.25)'
                    : (isDragging ? '0 15px 40px rgba(0,0,0,0.2)' : '0 8px 20px rgba(0,0,0,0.12)')
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => !isDragging && onHover(business.id)}
            onMouseLeave={() => !isDragging && onHover(null)}
        >
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.2)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
            <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem', textAlign: 'center' }}>{business.image}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1a1a1a', textAlign: 'center' }}>{business.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: '#1a1a1a' }}>
                    <Star size={16} fill="#FFB800" color="#FFB800" />
                    <span>{business.rating}</span>
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>{business.category}</p>

                {/* Expanded content - only visible on hover */}
                {isHovered && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid rgba(0,0,0,0.1)', animation: 'fadeIn 0.3s ease' }}>
                        <p style={{ fontSize: '0.9rem', color: '#444', marginBottom: '1rem', lineHeight: '1.5', textAlign: 'center' }}>{business.description}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#555', justifyContent: 'center' }}>
                                <MapPin size={14} />
                                <span>{business.location}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#555', justifyContent: 'center' }}>
                                <Phone size={14} />
                                <span>{business.phone}</span>
                            </div>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '1rem', border: '2px solid rgba(0,0,0,0.1)', width: '100%', justifyContent: 'center' }}>
                            <Award size={14} />
                            <span>{business.deals}</span>
                        </div>
                        <button style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            View Details <ArrowRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const HomePage = () => {
    const navigate = useNavigate();
    const { isSignedIn, user } = useUser();

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Mouse gradient state with lighter colors
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [gradientColors, setGradientColors] = useState({
        primary: pastelColors[0],
        secondary: pastelColors[4]
    });

    // Business cards state
    const [businesses, setBusinesses] = useState(featuredBusinesses);
    const [draggingId, setDraggingId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);

    // Scroll animation state
    const [scrollProgress, setScrollProgress] = useState(0);
    const [visibleSections, setVisibleSections] = useState(new Set());

    // Refs for scroll animation
    const boardRef = useRef(null);
    const statsRef = useRef(null);
    const featuresRef = useRef(null);
    const categoriesRef = useRef(null);

    // Mouse movement gradient effect with lighter colors
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePosition({ x, y });

            // Use lighter pastel colors for gradient
            const colorIndex1 = Math.floor((x / 10) % pastelColors.length);
            const colorIndex2 = Math.floor((y / 10) % pastelColors.length);

            setGradientColors({
                primary: pastelColors[colorIndex1],
                secondary: pastelColors[colorIndex2]
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Scroll progress tracking
    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentProgress = (window.scrollY / totalScroll) * 100;
            setScrollProgress(currentProgress);
            setIsScrolled(window.scrollY > 50);

            const sections = [
                { ref: boardRef, name: 'board' },
                { ref: statsRef, name: 'stats' },
                { ref: featuresRef, name: 'features' },
                { ref: categoriesRef, name: 'categories' }
            ];

            const newVisibleSections = new Set();
            sections.forEach(({ ref, name }) => {
                if (ref.current) {
                    const rect = ref.current.getBoundingClientRect();
                    if (rect.top < window.innerHeight * 0.75 && rect.bottom > 0) {
                        newVisibleSections.add(name);
                    }
                }
            });

            setVisibleSections(newVisibleSections);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDragStart = (id) => {
        setDraggingId(id);
    };

    const handleDragEnd = (id, newPosition) => {
        setBusinesses(prev => prev.map(b =>
            b.id === id ? { ...b, position: newPosition } : b
        ));
        setDraggingId(null);
    };

    const handleButtonClick = () => {
        navigate('/dashboard');
    };

    const dynamicGradient = `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${gradientColors.primary}, ${gradientColors.secondary})`;

    // Dynamic styles based on dark mode
    const getStyles = () => ({
        ...styles,
        page: {
            ...styles.page,
            backgroundColor: isDarkMode ? darkColors.background : '#f8f9fa',
            color: isDarkMode ? darkColors.text : '#1a1a1a'
        },
        nav: {
            ...styles.nav,
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderBottom: isDarkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(0,0,0,0.06)'
        },
        navLink: {
            ...styles.navLink,
            color: isDarkMode ? darkColors.text : '#1a1a1a'
        },
        btnSecondary: {
            ...styles.btnSecondary,
            color: isDarkMode ? darkColors.text : '#1a1a1a',
            borderColor: isDarkMode ? darkColors.border : '#e0e0e0'
        },
        boardTitle: {
            ...styles.boardTitle,
            color: isDarkMode ? darkColors.text : '#1a1a1a'
        },
        boardSubtitle: {
            ...styles.boardSubtitle,
            color: isDarkMode ? darkColors.textSecondary : '#666'
        },
        boardCanvas: {
            ...styles.boardCanvas,
            backgroundColor: isDarkMode ? darkColors.cardBg : '#ffffff',
            border: isDarkMode ? `2px solid ${darkColors.border}` : '2px solid #e8e8e8'
        },
        statCard: {
            ...styles.statCard,
            backgroundColor: isDarkMode ? darkColors.cardBg : '#fafafa',
            border: isDarkMode ? `2px solid ${darkColors.border}` : '2px solid #f0f0f0'
        },
        statValue: {
            ...styles.statValue,
            color: isDarkMode ? darkColors.text : '#1a1a1a'
        },
        statLabel: {
            ...styles.statLabel,
            color: isDarkMode ? darkColors.textSecondary : '#666'
        },
        stats: {
            ...styles.stats,
            backgroundColor: isDarkMode ? darkColors.background : '#fff'
        },
        features: {
            ...styles.features,
            backgroundColor: isDarkMode ? darkColors.cardBg : '#f8f9fa'
        },
        featureCard: {
            ...styles.featureCard,
            backgroundColor: isDarkMode ? darkColors.background : '#fff',
            border: isDarkMode ? `2px solid ${darkColors.border}` : '2px solid #f0f0f0'
        },
        featureTitle: {
            ...styles.featureTitle,
            color: isDarkMode ? darkColors.text : '#1a1a1a'
        },
        featureText: {
            ...styles.featureText,
            color: isDarkMode ? darkColors.textSecondary : '#666'
        },
        sectionTitle: {
            ...styles.sectionTitle,
            color: isDarkMode ? darkColors.text : '#1a1a1a'
        },
        sectionSubtitle: {
            ...styles.sectionSubtitle,
            color: isDarkMode ? darkColors.textSecondary : '#666'
        },
        categoriesSection: {
            ...styles.categoriesSection,
            backgroundColor: isDarkMode ? darkColors.background : '#fff'
        },
        categoryCard: {
            ...styles.categoryCard,
            backgroundColor: isDarkMode ? darkColors.cardBg : '#fafafa',
            border: isDarkMode ? `2px solid ${darkColors.border}` : '2px solid #f0f0f0'
        },
        categoryName: {
            ...styles.categoryName,
            color: isDarkMode ? darkColors.text : '#1a1a1a'
        },
        categoryCount: {
            ...styles.categoryCount,
            color: isDarkMode ? darkColors.textSecondary : '#666'
        }
    });

    const currentStyles = getStyles();

    return (
        <div style={currentStyles.page}>
            {/* Dynamic gradient overlay */}
            <div style={{
                ...currentStyles.gradientOverlay,
                background: dynamicGradient,
                opacity: isDarkMode ? 0.1 : 0.3
            }} />

            {/* Scroll progress indicator */}
            <div style={{
                ...currentStyles.scrollProgress,
                width: `${scrollProgress}%`,
                background: `linear-gradient(90deg, ${pastelColors[6]}, ${pastelColors[3]})`
            }} />

            {/* Navigation */}
            <nav style={{
                ...currentStyles.nav,
                padding: isScrolled ? '0.5rem 0' : '1rem 0',
                borderRadius: isScrolled ? '0 0 20px 20px' : '0',
                margin: isScrolled ? '0 1rem' : '0',
                boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none'
            }}>
                <div style={currentStyles.navContainer}>
                    <div style={currentStyles.logo}>
                        <Sparkles size={28} style={{ color: '#667eea' }} />
                        <span style={currentStyles.logoText}>SmallSpark</span>
                    </div>

                    <div style={currentStyles.navButtons}>
                        <DarkModeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
                        {isSignedIn ? (
                            <>
                                <button style={currentStyles.btnSecondary} onClick={handleButtonClick}>
                                    Dashboard
                                </button>
                                <UserButton afterSignOutUrl="/" />
                            </>
                        ) : (
                            <>
                                <SignInButton mode="modal">
                                    <button style={currentStyles.btnSecondary}>Sign In</button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button style={currentStyles.btnPrimary}>Get Started</button>
                                </SignUpButton>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Interactive Drag-and-Drop Board with Hero Text */}
            <section
                ref={boardRef}
                style={{
                    ...currentStyles.interactiveBoard,
                    transform: visibleSections.has('board') ? 'scale(1)' : 'scale(0.95)',
                    opacity: visibleSections.has('board') ? 1 : 0
                }}
            >
                <div style={currentStyles.boardContainer}>
                    <div style={currentStyles.boardHeader}>
                        <div style={currentStyles.badge}>
                            <Zap size={16} style={{ color: '#667eea' }} />
                            <span>Discover Local. Support Small.</span>
                        </div>

                        <h1 style={currentStyles.boardTitle}>
                            Discover & Support<br />
                            <span style={currentStyles.heroGradient}>Local Businesses</span>
                        </h1>

                        <p style={currentStyles.boardSubtitle}>
                            Explore amazing small businesses in your community
                        </p>
                    </div>

                    <div style={currentStyles.boardCanvas}>
                        {businesses.map(business => (
                            <DraggableBusinessCard
                                key={business.id}
                                business={business}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                isHovered={hoveredId === business.id}
                                onHover={setHoveredId}
                                isDarkMode={isDarkMode}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section
                ref={statsRef}
                style={{
                    ...currentStyles.stats,
                    transform: visibleSections.has('stats') ? 'translateY(0)' : 'translateY(100px)',
                    opacity: visibleSections.has('stats') ? 1 : 0
                }}
            >
                <div style={currentStyles.container}>
                    <div style={currentStyles.statsGrid}>
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                style={{
                                    ...currentStyles.statCard,
                                    transitionDelay: `${i * 100}ms`
                                }}
                                onClick={handleButtonClick}
                            >
                                <div style={{
                                    ...currentStyles.statIcon,
                                    backgroundColor: pastelColors[i * 2],
                                    color: '#1a1a1a'
                                }}>
                                    <stat.icon size={24} />
                                </div>
                                <div style={currentStyles.statValue}>{stat.value}</div>
                                <div style={currentStyles.statLabel}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section
                ref={featuresRef}
                style={currentStyles.features}
            >
                <div style={currentStyles.container}>
                    <div style={{
                        ...currentStyles.sectionHeader,
                        transform: visibleSections.has('features') ? 'translateY(0)' : 'translateY(50px)',
                        opacity: visibleSections.has('features') ? 1 : 0
                    }}>
                        <h2 style={currentStyles.sectionTitle}>Why Choose SmallSpark?</h2>
                        <p style={currentStyles.sectionSubtitle}>Everything you need to discover and support local businesses</p>
                    </div>

                    <div style={currentStyles.featureGrid}>
                        {[
                            { icon: MapPin, title: 'Interactive Maps', text: 'Explore businesses with our interactive map feature.', color: pastelColors[0] },
                            { icon: Star, title: 'Verified Reviews', text: 'Read authentic reviews from real customers.', color: pastelColors[1] },
                            { icon: Heart, title: 'Save Favorites', text: 'Bookmark your favorite businesses and collections.', color: pastelColors[2] },
                            { icon: TrendingUp, title: 'Exclusive Deals', text: 'Access special offers and time-limited deals.', color: pastelColors[3] },
                            { icon: Globe, title: 'Nationwide Coverage', text: 'Discover small businesses across the country.', color: pastelColors[4] },
                            { icon: Shield, title: 'Verified Businesses', text: 'All businesses are verified and vetted.', color: pastelColors[5] }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                style={{
                                    ...currentStyles.featureCard,
                                    transform: visibleSections.has('features') ? 'translateY(0)' : 'translateY(80px)',
                                    opacity: visibleSections.has('features') ? 1 : 0,
                                    transitionDelay: `${i * 100}ms`
                                }}
                                onClick={handleButtonClick}
                            >
                                <div style={{
                                    ...currentStyles.featureIcon,
                                    backgroundColor: feature.color,
                                    color: '#1a1a1a'
                                }}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 style={currentStyles.featureTitle}>{feature.title}</h3>
                                <p style={currentStyles.featureText}>{feature.text}</p>
                                <button style={currentStyles.featureLink} onClick={handleButtonClick}>
                                    <span>Learn more</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section
                ref={categoriesRef}
                style={currentStyles.categoriesSection}
            >
                <div style={currentStyles.container}>
                    <div style={{
                        ...currentStyles.sectionHeader,
                        transform: visibleSections.has('categories') ? 'translateY(0)' : 'translateY(50px)',
                        opacity: visibleSections.has('categories') ? 1 : 0
                    }}>
                        <h2 style={currentStyles.sectionTitle}>Browse by Category</h2>
                        <p style={currentStyles.sectionSubtitle}>Explore thousands of local businesses organized by industry</p>
                    </div>

                    <div style={currentStyles.categoryGrid}>
                        {categories.map((cat, i) => (
                            <div
                                key={i}
                                style={{
                                    ...currentStyles.categoryCard,
                                    transform: visibleSections.has('categories') ? 'scale(1)' : 'scale(0.8)',
                                    opacity: visibleSections.has('categories') ? 1 : 0,
                                    transitionDelay: `${i * 80}ms`
                                }}
                                onClick={handleButtonClick}
                            >
                                <div style={{
                                    ...currentStyles.categoryIcon,
                                    backgroundColor: pastelColors[i],
                                    color: '#1a1a1a'
                                }}>
                                    <cat.icon size={32} />
                                </div>
                                <h3 style={currentStyles.categoryName}>{cat.name}</h3>
                                <p style={currentStyles.categoryCount}>{cat.count} businesses</p>
                                <button
                                    style={{
                                        ...currentStyles.categoryButton,
                                        backgroundColor: pastelColors[i],
                                        color: '#1a1a1a'
                                    }}
                                    onClick={handleButtonClick}
                                >
                                    <span>Explore</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={currentStyles.cta}>
                <div style={currentStyles.container}>
                    <div style={currentStyles.ctaContent}>
                        <div style={currentStyles.ctaText}>
                            <h2 style={currentStyles.ctaTitle}>Ready to discover local businesses?</h2>
                            <p style={currentStyles.ctaSubtitle}>Join thousands of users supporting small businesses in their community</p>
                            <div style={currentStyles.ctaButtons}>
                                <button style={currentStyles.ctaPrimary} onClick={handleButtonClick}>
                                    <span>Get Started Free</span>
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const styles = {
    page: {
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: '#f8f9fa',
        color: '#1a1a1a',
        minHeight: '100vh',
        position: 'relative',
        transition: 'background-color 0.3s ease, color 0.3s ease'
    },
    gradientOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.5s ease, opacity 0.3s ease'
    },
    scrollProgress: {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '4px',
        zIndex: 1000,
        transition: 'width 0.1s ease',
        boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
    },
    nav: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease'
    },
    navContainer: {
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1.5rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'transform 0.2s'
    },
    logoText: {
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    navLinks: {
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
    },
    navLink: {
        color: '#1a1a1a',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'all 0.2s',
        cursor: 'pointer',
        position: 'relative',
        padding: '0.5rem 0'
    },
    navButtons: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
    },
    btnSecondary: {
        padding: '0.625rem 1.5rem',
        border: '2px solid #e0e0e0',
        background: 'transparent',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        color: '#1a1a1a'
    },
    btnPrimary: {
        padding: '0.625rem 1.5rem',
        border: 'none',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#fff',
        borderRadius: '50px',
        fontSize: '0.875rem',
        fontWeight: '600',
        marginBottom: '1.5rem',
        border: '2px solid #667eea',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
    },
    heroGradient: {
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    interactiveBoard: {
        padding: '3rem 2rem 5rem',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    boardContainer: {
        maxWidth: '1400px',
        margin: '0 auto'
    },
    boardHeader: {
        textAlign: 'center',
        marginBottom: '3rem',
        padding: '2rem'
    },
    boardTitle: {
        fontSize: '3.5rem',
        fontWeight: '800',
        marginBottom: '1rem',
        color: '#1a1a1a',
        lineHeight: '1.1',
        transition: 'color 0.3s ease'
    },
    boardSubtitle: {
        fontSize: '1.25rem',
        color: '#666',
        fontWeight: '500',
        marginTop: '1rem',
        transition: 'color 0.3s ease'
    },
    boardCanvas: {
        position: 'relative',
        minHeight: '600px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        border: '2px solid #e8e8e8',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(circle, #e8e8e8 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        transition: 'all 0.3s ease'
    },
    stats: {
        padding: '5rem 2rem',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#fff'
    },
    container: {
        maxWidth: '1280px',
        margin: '0 auto'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem'
    },
    statCard: {
        textAlign: 'center',
        padding: '2rem',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        backgroundColor: '#fafafa',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        border: '2px solid #f0f0f0'
    },
    statIcon: {
        width: '60px',
        height: '60px',
        margin: '0 auto 1rem',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a1a1a',
        transition: 'transform 0.3s ease'
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: '0.5rem',
        transition: 'color 0.3s ease'
    },
    statLabel: {
        color: '#666',
        fontWeight: '500',
        transition: 'color 0.3s ease'
    },
    features: {
        padding: '5rem 2rem',
        backgroundColor: '#f8f9fa',
        position: 'relative',
        zIndex: 1,
        transition: 'background-color 0.3s ease'
    },
    sectionHeader: {
        textAlign: 'center',
        marginBottom: '4rem',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    sectionTitle: {
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: '#1a1a1a',
        transition: 'color 0.3s ease'
    },
    sectionSubtitle: {
        fontSize: '1.125rem',
        color: '#666',
        maxWidth: '600px',
        margin: '0 auto',
        transition: 'color 0.3s ease'
    },
    featureGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
    },
    featureCard: {
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        border: '2px solid #f0f0f0',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
    },
    featureIcon: {
        width: '60px',
        height: '60px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a1a1a',
        marginBottom: '1.5rem',
        transition: 'transform 0.3s ease'
    },
    featureTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '0.75rem',
        color: '#1a1a1a',
        transition: 'color 0.3s ease'
    },
    featureText: {
        color: '#666',
        lineHeight: '1.6',
        marginBottom: '1.5rem',
        transition: 'color 0.3s ease'
    },
    featureLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#667eea',
        fontWeight: '600',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        transition: 'gap 0.3s ease'
    },
    categoriesSection: {
        padding: '5rem 2rem',
        backgroundColor: '#fff',
        position: 'relative',
        zIndex: 1,
        transition: 'background-color 0.3s ease'
    },
    categoryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2rem'
    },
    categoryCard: {
        backgroundColor: '#fafafa',
        padding: '2rem',
        borderRadius: '16px',
        border: '2px solid #f0f0f0',
        textAlign: 'center',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
    },
    categoryIcon: {
        width: '60px',
        height: '60px',
        margin: '0 auto 1rem',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a1a1a',
        transition: 'transform 0.3s ease'
    },
    categoryName: {
        fontSize: '1.125rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        color: '#1a1a1a',
        transition: 'color 0.3s ease'
    },
    categoryCount: {
        color: '#666',
        fontSize: '0.875rem',
        marginBottom: '1.5rem',
        transition: 'color 0.3s ease'
    },
    categoryButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.5rem',
        color: '#1a1a1a',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.9rem'
    },
    cta: {
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff',
        position: 'relative',
        zIndex: 1
    },
    ctaContent: {
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center'
    },
    ctaText: {
        marginBottom: '2rem'
    },
    ctaTitle: {
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '1rem'
    },
    ctaSubtitle: {
        fontSize: '1.25rem',
        marginBottom: '2rem',
        opacity: 0.95
    },
    ctaButtons: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    ctaPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 2rem',
        background: '#fff',
        color: '#667eea',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '700',
        fontSize: '1.05rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit'
    }
};

// Add keyframe animations and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  nav a:hover {
    color: #667eea;
  }
  
  nav a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #667eea;
    transition: width 0.3s ease;
  }
  
  nav a:hover::after {
    width: 100%;
  }
  
  button:hover {
    transform: translateY(-2px);
  }
  
  [style*="btnSecondary"]:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  [style*="btnPrimary"]:hover,
  [style*="ctaPrimary"]:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  }
`;
document.head.appendChild(styleSheet);

export default HomePage;