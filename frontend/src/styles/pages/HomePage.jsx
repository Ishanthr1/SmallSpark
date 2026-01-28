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

// Generate random velocity for floating
const randomVelocity = () => ({
    x: (Math.random() - 0.5) * 0.8,
    y: (Math.random() - 0.5) * 0.8
});

// Create businesses with random starting positions and velocities
const createFloatingBusinesses = () => {
    const businesses = [
        { id: 1, name: "Bloom Café", category: "Food & Dining", rating: 4.8, image: "☕", color: pastelColors[0], deals: "20% off coffee", description: "Cozy café with artisan coffee and fresh pastries", location: "Downtown Plaza", phone: "(555) 123-4567", rotation: -3 },
        { id: 2, name: "The Cut Studio", category: "Health & Beauty", rating: 4.9, image: "✂️", color: pastelColors[4], deals: "Free consultation", description: "Premium hair styling and beauty services", location: "Main Street", phone: "(555) 234-5678", rotation: 2 },
        { id: 3, name: "Artisan Bakery", category: "Food & Dining", rating: 4.7, image: "🥐", color: pastelColors[1], deals: "Buy 2 get 1 free", description: "Fresh baked goods daily, family recipes", location: "Oak Avenue", phone: "(555) 345-6789", rotation: -2 },
        { id: 4, name: "Zenith Fitness", category: "Fitness", rating: 4.8, image: "💪", color: pastelColors[5], deals: "First month free", description: "Modern gym with personal training", location: "Park District", phone: "(555) 456-7890", rotation: 1 },
        { id: 5, name: "Vintage Threads", category: "Retail", rating: 4.6, image: "👗", color: pastelColors[8], deals: "30% off sale items", description: "Curated vintage clothing and accessories", location: "Arts Quarter", phone: "(555) 567-8901", rotation: -4 },
        { id: 6, name: "Fix-It Pro", category: "Services", rating: 4.9, image: "🔧", color: pastelColors[2], deals: "Free estimate", description: "Professional home repair services", location: "Industrial Park", phone: "(555) 678-9012", rotation: 3 },
        { id: 7, name: "Green Leaf", category: "Food & Dining", rating: 4.7, image: "🌿", color: pastelColors[3], deals: "Happy hour 3-6pm", description: "Farm-to-table organic restaurant", location: "Riverside", phone: "(555) 789-0123", rotation: -1 },
        { id: 8, name: "Pixel Studio", category: "Services", rating: 4.8, image: "🎨", color: pastelColors[7], deals: "First project 15% off", description: "Creative design and branding studio", location: "Tech Hub", phone: "(555) 890-1234", rotation: 2 }
    ];

    return businesses.map(business => ({
        ...business,
        position: {
            x: Math.random() * (window.innerWidth - 250),
            y: Math.random() * (window.innerHeight - 250)
        },
        velocity: randomVelocity(),
        isDragging: false
    }));
};

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

// Floating Business Card Component with Repulsion
const FloatingBusinessCard = ({ business, allBusinesses, onPositionUpdate, onDragStart, onDragEnd, isHovered, onHover, isDarkMode }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;

        const rect = cardRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
        onDragStart(business.id);
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            onPositionUpdate(business.id, { x: newX, y: newY }, true);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onDragEnd(business.id);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, business.id, onPositionUpdate, onDragEnd]);

    return (
        <div
            ref={cardRef}
            style={{
                position: 'absolute',
                left: `${business.position.x}px`,
                top: `${business.position.y}px`,
                transform: `rotate(${business.rotation}deg)`,
                padding: '1.5rem',
                borderRadius: '12px',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                userSelect: 'none',
                fontFamily: "'Patrick Hand', cursive, 'Poppins', sans-serif",
                border: '2px solid rgba(0,0,0,0.08)',
                backgroundColor: business.color,
                zIndex: isDragging ? 1000 : (isHovered ? 100 : 1),
                cursor: isDragging ? 'grabbing' : 'grab',
                width: '200px',
                height: '220px',
                boxShadow: isDragging ? '0 15px 40px rgba(0,0,0,0.2)' : '0 8px 20px rgba(0,0,0,0.12)',
                pointerEvents: 'auto'
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
            </div>
        </div>
    );
};

// Center Text with Hoverable Container
const CenterTextWithContainer = ({ isDarkMode }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '3rem 4rem',
                textAlign: 'center',
                minWidth: '500px',
                zIndex: 5,
                pointerEvents: 'auto',
                backgroundColor: isHovered ? (isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)') : 'transparent',
                borderRadius: '24px',
                border: isHovered ? '3px solid #ff6b35' : '3px solid transparent',
                boxShadow: isHovered ? '0 30px 80px rgba(255, 107, 53, 0.35)' : 'none',
                backdropFilter: isHovered ? 'blur(10px)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: '50px',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                border: '2px solid #ff6b35',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}>
                <Zap size={16} style={{ color: '#ff6b35' }} />
                <span style={{ color: isDarkMode ? '#f1f5f9' : '#1a1a1a' }}>Discover Local. Support Small.</span>
            </div>

            <h1 style={{
                fontSize: '3.5rem',
                fontWeight: '800',
                marginBottom: '1rem',
                color: isDarkMode ? '#f1f5f9' : '#1a1a1a',
                lineHeight: '1.1'
            }}>
                Discover & Support<br />
                <span style={{
                    background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Local Businesses
                </span>
            </h1>

            <p style={{
                fontSize: '1.25rem',
                color: isDarkMode ? '#94a3b8' : '#666',
                fontWeight: '500',
                marginTop: '1rem'
            }}>
                Drag and explore amazing businesses
            </p>
        </div>
    );
};

const HomePage = () => {
    const navigate = useNavigate();
    const { isSignedIn, user } = useUser();

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [businesses, setBusinesses] = useState(createFloatingBusinesses());
    const [draggingId, setDraggingId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);

    // Stats highlighting state - simplified
    const [highlightedStatIndex, setHighlightedStatIndex] = useState(-1);
    const [isInStatsSection, setIsInStatsSection] = useState(false);
    const lastScrollY = useRef(0);
    const scrollAccumulator = useRef(0);

    const [scrollProgress, setScrollProgress] = useState(0);
    const [visibleSections, setVisibleSections] = useState(new Set());

    const statsRef = useRef(null);
    const featuresRef = useRef(null);
    const categoriesRef = useRef(null);

    // Floating animation with repulsion
    useEffect(() => {
        let animationId;

        const animate = () => {
            setBusinesses(prev => prev.map((business, index) => {
                if (business.id === draggingId) return business;

                let newX = business.position.x + business.velocity.x;
                let newY = business.position.y + business.velocity.y;
                let newVelocityX = business.velocity.x;
                let newVelocityY = business.velocity.y;

                // Repulsion from other businesses
                prev.forEach((other, otherIndex) => {
                    if (index === otherIndex) return;

                    const dx = business.position.x - other.position.x;
                    const dy = business.position.y - other.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Only repel if too close
                    if (distance < 250 && distance > 0) {
                        const force = (250 - distance) / 250 * 0.3;
                        newVelocityX += (dx / distance) * force;
                        newVelocityY += (dy / distance) * force;
                    }
                });

                // Limit velocity
                const speed = Math.sqrt(newVelocityX * newVelocityX + newVelocityY * newVelocityY);
                if (speed > 1.5) {
                    newVelocityX = (newVelocityX / speed) * 1.5;
                    newVelocityY = (newVelocityY / speed) * 1.5;
                }

                // Wrap around screen edges
                if (newX < -250) newX = window.innerWidth;
                if (newX > window.innerWidth) newX = -250;
                if (newY < -250) newY = window.innerHeight;
                if (newY > window.innerHeight) newY = -250;

                return {
                    ...business,
                    position: { x: newX, y: newY },
                    velocity: { x: newVelocityX, y: newVelocityY }
                };
            }));

            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [draggingId]);

    // Simplified scroll handler
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentProgress = (currentScrollY / totalScroll) * 100;
            setScrollProgress(currentProgress);

            // Check stats section
            if (statsRef.current) {
                const rect = statsRef.current.getBoundingClientRect();
                const inView = rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;

                if (inView && !isInStatsSection) {
                    setIsInStatsSection(true);
                    scrollAccumulator.current = 0;
                    setHighlightedStatIndex(0);
                } else if (!inView && isInStatsSection) {
                    setIsInStatsSection(false);
                    setHighlightedStatIndex(-1);
                }

                // Progress through stats when scrolling in stats section
                if (inView && currentScrollY > lastScrollY.current) {
                    scrollAccumulator.current += (currentScrollY - lastScrollY.current);

                    // Every 50px of scroll = next stat
                    const newIndex = Math.min(Math.floor(scrollAccumulator.current / 50), stats.length - 1);
                    if (newIndex !== highlightedStatIndex && newIndex < stats.length) {
                        setHighlightedStatIndex(newIndex);
                    }
                }
            }

            lastScrollY.current = currentScrollY;

            // Visible sections
            const sections = [
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

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isInStatsSection, highlightedStatIndex]);

    const handlePositionUpdate = (id, position, isDragging = false) => {
        setBusinesses(prev => prev.map(b =>
            b.id === id ? {
                ...b,
                position,
                velocity: isDragging ? { x: 0, y: 0 } : randomVelocity()
            } : b
        ));
    };

    const handleDragStart = (id) => {
        setDraggingId(id);
    };

    const handleDragEnd = (id) => {
        setDraggingId(null);
        setBusinesses(prev => prev.map(b =>
            b.id === id ? { ...b, velocity: randomVelocity() } : b
        ));
    };

    const handleButtonClick = () => {
        navigate('/dashboard');
    };

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
            borderBottom: 'none'
        },
        btnSecondary: {
            ...styles.btnSecondary,
            color: isDarkMode ? darkColors.text : '#1a1a1a',
            borderColor: isDarkMode ? darkColors.border : '#e0e0e0'
        },
        heroCanvas: {
            ...styles.heroCanvas,
            backgroundColor: isDarkMode ? darkColors.cardBg : '#ffffff'
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
            {/* Scroll progress indicator */}
            <div style={{
                ...currentStyles.scrollProgress,
                width: `${scrollProgress}%`,
                background: 'linear-gradient(90deg, #ff6b35, #f7931e)'
            }} />

            {/* Floating Navigation */}
            <nav style={{
                ...currentStyles.nav,
                position: 'fixed',
                top: '1rem',
                left: '1rem',
                right: '1rem',
                margin: '0 auto',
                maxWidth: '1280px',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                padding: '0.75rem 0'
            }}>
                <div style={currentStyles.navContainer}>
                    <div style={currentStyles.logo}>
                        <Sparkles size={28} style={{ color: '#ff6b35' }} />
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

            {/* Full-Screen Floating Canvas */}
            <section style={currentStyles.heroCanvas}>
                <div style={currentStyles.canvasContainer}>
                    <CenterTextWithContainer isDarkMode={isDarkMode} />

                    {businesses.map(business => (
                        <FloatingBusinessCard
                            key={business.id}
                            business={business}
                            allBusinesses={businesses}
                            onPositionUpdate={handlePositionUpdate}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            isHovered={hoveredId === business.id}
                            onHover={setHoveredId}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                </div>
            </section>

            <div style={currentStyles.sectionDivider} />

            {/* Stats Section with Progressive Highlighting */}
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
                                    transitionDelay: `${i * 100}ms`,
                                    transform: highlightedStatIndex === i ? 'scale(1.1) translateY(-10px)' : 'scale(1)',
                                    boxShadow: highlightedStatIndex === i
                                        ? '0 20px 60px rgba(255, 107, 53, 0.4)'
                                        : '0 4px 15px rgba(0,0,0,0.05)',
                                    border: highlightedStatIndex === i
                                        ? '3px solid #ff6b35'
                                        : (isDarkMode ? `2px solid ${darkColors.border}` : '2px solid #f0f0f0'),
                                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}
                                onClick={handleButtonClick}
                            >
                                <div style={{
                                    ...currentStyles.statIcon,
                                    backgroundColor: pastelColors[i * 2],
                                    color: '#1a1a1a',
                                    transform: highlightedStatIndex === i ? 'rotate(360deg) scale(1.2)' : 'rotate(0deg) scale(1)',
                                    transition: 'all 0.5s ease'
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

            <div style={currentStyles.sectionDivider} />

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

            <div style={currentStyles.sectionDivider} />

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

            <div style={currentStyles.sectionDivider} />

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
    scrollProgress: {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '4px',
        zIndex: 1000,
        transition: 'width 0.1s ease',
        boxShadow: '0 0 10px rgba(255, 107, 53, 0.5)'
    },
    nav: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        transition: 'all 0.3s ease',
        zIndex: 100
    },
    navContainer: {
        maxWidth: '100%',
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
        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
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
        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
        color: '#fff',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
    },
    heroCanvas: {
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #e8e8e8 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        marginTop: '5rem'
    },
    canvasContainer: {
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
    },
    sectionDivider: {
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)',
        margin: '0 auto',
        width: '80%'
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
        color: '#1a1a1a'
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
        color: '#ff6b35',
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
        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
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
        color: '#ff6b35',
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
  
  button:hover {
    transform: translateY(-2px);
  }
  
  [style*="btnSecondary"]:hover {
    border-color: #ff6b35;
    color: #ff6b35;
  }
  
  [style*="btnPrimary"]:hover,
  [style*="ctaPrimary"]:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
  }
`;
document.head.appendChild(styleSheet);

export default HomePage;