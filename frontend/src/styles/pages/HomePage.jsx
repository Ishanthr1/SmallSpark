import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Search, MapPin, Star, Heart, TrendingUp, Sparkles, X, Check, Store, Users, Award, Zap, Filter, ChevronRight, ArrowRight, Globe, Shield, Clock } from 'lucide-react';

// Typing animation sentences
const typingPhrases = [
    "Find amazing small businesses in your community.",
    "Save your favorites and explore exclusive deals.",
    "Help local entrepreneurs thrive and grow.",
    "Discover hidden gems near you every day.",
    "Support local businesses with every purchase."
];

const categories = [
    { name: 'Food & Dining', icon: Store, count: '1,234' },
    { name: 'Retail & Shopping', icon: Store, count: '856' },
    { name: 'Health & Beauty', icon: Heart, count: '642' },
    { name: 'Professional Services', icon: Award, count: '523' },
    { name: 'Arts & Crafts', icon: Star, count: '398' },
    { name: 'Home Services', icon: MapPin, count: '467' },
    { name: 'Entertainment', icon: TrendingUp, count: '289' },
    { name: 'Fitness & Wellness', icon: Users, count: '356' }
];

const stats = [
    { value: '10,000+', label: 'Local Businesses', icon: Store },
    { value: '50,000+', label: 'Active Users', icon: Users },
    { value: '100,000+', label: 'Reviews Posted', icon: Star },
    { value: '5,000+', label: 'Active Deals', icon: Award }
];

const HomePage = () => {
    const navigate = useNavigate();
    const { isSignedIn, user } = useUser();

    // Typing animation state
    const [displayText, setDisplayText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [charIndex, setCharIndex] = useState(0);

    // Typing animation effect
    useEffect(() => {
        const currentPhrase = typingPhrases[phraseIndex];
        const typingSpeed = isDeleting ? 30 : 80;
        const pauseTime = 2000;

        const timer = setTimeout(() => {
            if (!isDeleting && charIndex < currentPhrase.length) {
                setDisplayText(currentPhrase.substring(0, charIndex + 1));
                setCharIndex(charIndex + 1);
            } else if (isDeleting && charIndex > 0) {
                setDisplayText(currentPhrase.substring(0, charIndex - 1));
                setCharIndex(charIndex - 1);
            } else if (!isDeleting && charIndex === currentPhrase.length) {
                setTimeout(() => setIsDeleting(true), pauseTime);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setPhraseIndex((phraseIndex + 1) % typingPhrases.length);
            }
        }, typingSpeed);

        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, phraseIndex]);

    // Handle all button clicks - go to dashboard
    const handleButtonClick = () => {
        navigate('/dashboard');
    };

    return (
        <div style={styles.page}>
            {/* Navigation */}
            <nav style={styles.nav}>
                <div style={styles.navContainer}>
                    <div style={styles.logo}>
                        <Sparkles size={28} style={{ color: 'var(--color-primary)' }} />
                        <span style={styles.logoText}>SmallSpark</span>
                    </div>
                    <div style={styles.navLinks}>
                        <a onClick={handleButtonClick} style={styles.navLink}>Explore</a>
                        <a onClick={handleButtonClick} style={styles.navLink}>Categories</a>
                        <a onClick={handleButtonClick} style={styles.navLink}>Deals</a>
                        <a onClick={handleButtonClick} style={styles.navLink}>About</a>
                    </div>
                    <div style={styles.navButtons}>
                        {isSignedIn ? (
                            <>
                                <button
                                    style={styles.btnSecondary}
                                    onClick={handleButtonClick}
                                >
                                    Dashboard
                                </button>
                                <UserButton afterSignOutUrl="/" />
                            </>
                        ) : (
                            <>
                                <SignInButton mode="modal">
                                    <button style={styles.btnSecondary}>Sign In</button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button style={styles.btnPrimary}>Get Started</button>
                                </SignUpButton>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <div style={styles.badge}>
                        <Zap size={16} />
                        <span>Discover Local. Support Small.</span>
                    </div>
                    <h1 style={styles.heroTitle}>
                        Discover & Support<br />
                        <span style={styles.heroGradient}>Local Businesses</span>
                    </h1>
                    <div style={styles.typingContainer}>
                        <p style={styles.heroSubtitle}>
                            {displayText}
                            <span style={styles.cursor}>|</span>
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div style={styles.searchContainer}>
                        <div style={styles.searchBox}>
                            <Search size={20} style={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search for businesses, services, or categories..."
                                style={styles.searchInput}
                            />
                            <button style={styles.searchButton} onClick={handleButtonClick}>
                                <span>Search</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                        <div style={styles.quickFilters}>
                            <button style={styles.filterButton} onClick={handleButtonClick}>
                                <Filter size={16} />
                                <span>Filters</span>
                            </button>
                            <button style={styles.filterTag} onClick={handleButtonClick}>Food & Dining</button>
                            <button style={styles.filterTag} onClick={handleButtonClick}>Retail</button>
                            <button style={styles.filterTag} onClick={handleButtonClick}>Services</button>
                            <button style={styles.filterTag} onClick={handleButtonClick}>Health & Beauty</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section style={styles.stats}>
                <div style={styles.container}>
                    <div style={styles.statsGrid}>
                        {stats.map((stat, i) => (
                            <div key={i} style={styles.statCard} onClick={handleButtonClick}>
                                <div style={styles.statIcon}>
                                    <stat.icon size={24} />
                                </div>
                                <div style={styles.statValue}>{stat.value}</div>
                                <div style={styles.statLabel}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <section style={styles.features}>
                <div style={styles.container}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Why Choose SmallSpark?</h2>
                        <p style={styles.sectionSubtitle}>Everything you need to discover and support local businesses</p>
                    </div>
                    <div style={styles.featureGrid}>
                        <div style={styles.featureCard} onClick={handleButtonClick}>
                            <div style={styles.featureIcon}>
                                <MapPin size={24} />
                            </div>
                            <h3 style={styles.featureTitle}>Interactive Maps</h3>
                            <p style={styles.featureText}>
                                Explore businesses with our interactive map feature. Find hidden gems near you with advanced location filters.
                            </p>
                            <button style={styles.featureLink} onClick={handleButtonClick}>
                                <span>Learn more</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div style={styles.featureCard} onClick={handleButtonClick}>
                            <div style={styles.featureIcon}>
                                <Star size={24} />
                            </div>
                            <h3 style={styles.featureTitle}>Verified Reviews</h3>
                            <p style={styles.featureText}>
                                Read authentic reviews from real customers. Share your experiences and help others make informed decisions.
                            </p>
                            <button style={styles.featureLink} onClick={handleButtonClick}>
                                <span>Learn more</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div style={styles.featureCard} onClick={handleButtonClick}>
                            <div style={styles.featureIcon}>
                                <Heart size={24} />
                            </div>
                            <h3 style={styles.featureTitle}>Save Favorites</h3>
                            <p style={styles.featureText}>
                                Bookmark your favorite businesses and create personalized collections for easy access.
                            </p>
                            <button style={styles.featureLink} onClick={handleButtonClick}>
                                <span>Learn more</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div style={styles.featureCard} onClick={handleButtonClick}>
                            <div style={styles.featureIcon}>
                                <TrendingUp size={24} />
                            </div>
                            <h3 style={styles.featureTitle}>Exclusive Deals</h3>
                            <p style={styles.featureText}>
                                Access special offers, coupons, and time-limited deals from your favorite local businesses.
                            </p>
                            <button style={styles.featureLink} onClick={handleButtonClick}>
                                <span>Learn more</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div style={styles.featureCard} onClick={handleButtonClick}>
                            <div style={styles.featureIcon}>
                                <Globe size={24} />
                            </div>
                            <h3 style={styles.featureTitle}>Nationwide Coverage</h3>
                            <p style={styles.featureText}>
                                Discover small businesses across the country. Perfect for travelers and locals alike.
                            </p>
                            <button style={styles.featureLink} onClick={handleButtonClick}>
                                <span>Learn more</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div style={styles.featureCard} onClick={handleButtonClick}>
                            <div style={styles.featureIcon}>
                                <Shield size={24} />
                            </div>
                            <h3 style={styles.featureTitle}>Verified Businesses</h3>
                            <p style={styles.featureText}>
                                All businesses are verified and vetted. Shop with confidence knowing you're supporting legitimate local shops.
                            </p>
                            <button style={styles.featureLink} onClick={handleButtonClick}>
                                <span>Learn more</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section style={styles.categoriesSection}>
                <div style={styles.container}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Browse by Category</h2>
                        <p style={styles.sectionSubtitle}>Explore thousands of local businesses organized by industry</p>
                    </div>
                    <div style={styles.categoryGrid}>
                        {categories.map((cat, i) => (
                            <div key={i} style={styles.categoryCard} onClick={handleButtonClick}>
                                <div style={styles.categoryIcon}>
                                    <cat.icon size={32} />
                                </div>
                                <h3 style={styles.categoryName}>{cat.name}</h3>
                                <p style={styles.categoryCount}>{cat.count} businesses</p>
                                <button style={styles.categoryButton} onClick={handleButtonClick}>
                                    <span>Explore</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={styles.cta}>
                <div style={styles.container}>
                    <div style={styles.ctaContent}>
                        <div style={styles.ctaText}>
                            <h2 style={styles.ctaTitle}>Ready to discover local businesses?</h2>
                            <p style={styles.ctaSubtitle}>Join thousands of users supporting small businesses in their community</p>
                            <div style={styles.ctaButtons}>
                                <button style={styles.ctaPrimary} onClick={handleButtonClick}>
                                    <span>Get Started Free</span>
                                    <ArrowRight size={20} />
                                </button>
                                <button style={styles.ctaSecondary} onClick={handleButtonClick}>
                                    <Clock size={20} />
                                    <span>Watch Demo</span>
                                </button>
                            </div>
                        </div>
                        <div style={styles.ctaFeatures}>
                            <div style={styles.ctaFeature}>
                                <Check size={20} style={{ color: '#fff' }} />
                                <span>Free forever</span>
                            </div>
                            <div style={styles.ctaFeature}>
                                <Check size={20} style={{ color: '#fff' }} />
                                <span>No credit card required</span>
                            </div>
                            <div style={styles.ctaFeature}>
                                <Check size={20} style={{ color: '#fff' }} />
                                <span>Cancel anytime</span>
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
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)',
        minHeight: '100vh',
        transition: 'all 0.3s ease'
    },
    nav: {
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        animation: 'slideDown 0.5s ease-out'
    },
    navContainer: {
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
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
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    navLinks: {
        display: 'flex',
        gap: '2rem',
        alignItems: 'center'
    },
    navLink: {
        color: 'var(--text-main)',
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
        alignItems: 'center'
    },
    btnSecondary: {
        padding: '0.625rem 1.5rem',
        border: '2px solid var(--border-color)',
        background: 'transparent',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.9rem'
    },
    btnPrimary: {
        padding: '0.625rem 1.5rem',
        border: 'none',
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        color: '#fff',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
    },
    hero: {
        padding: '5rem 2rem',
        background: `linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(59, 130, 246, 0.05))`,
        borderBottom: '1px solid var(--border-color)',
        animation: 'fadeIn 0.8s ease-out'
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '50px',
        fontSize: '0.875rem',
        fontWeight: '600',
        marginBottom: '2rem',
        border: '1px solid var(--border-color)',
        color: 'var(--color-primary)',
        animation: 'bounce 2s infinite'
    },
    heroTitle: {
        fontSize: '4rem',
        fontWeight: '800',
        lineHeight: '1.1',
        marginBottom: '1.5rem',
        color: 'var(--text-main)',
        animation: 'fadeInUp 0.8s ease-out 0.2s both'
    },
    heroGradient: {
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    typingContainer: {
        minHeight: '60px',
        marginBottom: '2.5rem'
    },
    heroSubtitle: {
        fontSize: '1.25rem',
        color: '#6b7280',
        lineHeight: '1.6',
        animation: 'fadeInUp 0.8s ease-out 0.4s both'
    },
    cursor: {
        display: 'inline-block',
        marginLeft: '2px',
        animation: 'blink 1s infinite'
    },
    searchContainer: {
        marginTop: '2rem',
        animation: 'fadeInUp 0.8s ease-out 0.6s both'
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '0.75rem 1rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        border: '2px solid var(--border-color)',
        gap: '1rem',
        transition: 'all 0.3s ease'
    },
    searchIcon: {
        color: '#9ca3af'
    },
    searchInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: '1rem',
        fontFamily: 'inherit'
    },
    searchButton: {
        padding: '0.75rem 1.5rem',
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    quickFilters: {
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'center',
        marginTop: '1.5rem',
        flexWrap: 'wrap'
    },
    filterButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit'
    },
    filterTag: {
        padding: '0.625rem 1.25rem',
        backgroundColor: 'var(--bg-card)',
        border: '2px solid var(--border-color)',
        borderRadius: '10px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        color: 'var(--text-main)'
    },
    stats: {
        padding: '4rem 2rem',
        backgroundColor: 'var(--bg-main)',
        borderBottom: '1px solid var(--border-color)'
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
        transition: 'transform 0.3s ease',
        animation: 'fadeInUp 0.8s ease-out both',
        cursor: 'pointer'
    },
    statIcon: {
        width: '60px',
        height: '60px',
        margin: '0 auto 1rem',
        borderRadius: '14px',
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        transition: 'transform 0.3s ease'
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: '800',
        color: 'var(--text-main)',
        marginBottom: '0.5rem'
    },
    statLabel: {
        color: '#6b7280',
        fontWeight: '500'
    },
    features: {
        padding: '5rem 2rem',
        backgroundColor: 'var(--bg-card)'
    },
    sectionHeader: {
        textAlign: 'center',
        marginBottom: '4rem'
    },
    sectionTitle: {
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: 'var(--text-main)'
    },
    sectionSubtitle: {
        fontSize: '1.125rem',
        color: '#6b7280',
        maxWidth: '600px',
        margin: '0 auto'
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
        border: '2px solid var(--border-color)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    },
    featureIcon: {
        width: '60px',
        height: '60px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        marginBottom: '1.5rem',
        transition: 'transform 0.3s ease'
    },
    featureTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '0.75rem',
        color: 'var(--text-main)'
    },
    featureText: {
        color: '#6b7280',
        lineHeight: '1.6',
        marginBottom: '1.5rem'
    },
    featureLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--color-primary)',
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
        backgroundColor: 'var(--bg-main)'
    },
    categoryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2rem'
    },
    categoryCard: {
        backgroundColor: 'var(--bg-card)',
        padding: '2rem',
        borderRadius: '16px',
        border: '2px solid var(--border-color)',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    },
    categoryIcon: {
        width: '60px',
        height: '60px',
        margin: '0 auto 1rem',
        borderRadius: '14px',
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        transition: 'transform 0.3s ease'
    },
    categoryName: {
        fontSize: '1.125rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        color: 'var(--text-main)'
    },
    categoryCount: {
        color: '#6b7280',
        fontSize: '0.875rem',
        marginBottom: '1.5rem'
    },
    categoryButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.5rem',
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        color: '#fff',
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
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        color: '#fff'
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
        opacity: 0.9
    },
    ctaButtons: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '2rem'
    },
    ctaPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 2rem',
        background: '#fff',
        color: 'var(--color-primary)',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '700',
        fontSize: '1.05rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit'
    },
    ctaSecondary: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 2rem',
        background: 'rgba(255, 255, 255, 0.2)',
        color: '#fff',
        border: '2px solid #fff',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '1.05rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit'
    },
    ctaFeatures: {
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    ctaFeature: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1rem',
        fontWeight: '500'
    }
};

// Add keyframe animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  
  nav a:hover {
    color: var(--color-primary);
  }
  
  nav a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--color-primary);
    transition: width 0.3s ease;
  }
  
  nav a:hover::after {
    width: 100%;
  }
  
  button:hover {
    transform: translateY(-2px);
  }
  
  [style*="btnSecondary"]:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  
  [style*="btnPrimary"]:hover {
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }
  
  [style*="searchBox"]:hover {
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
    border-color: var(--color-primary);
  }
  
  [style*="searchButton"]:hover {
    transform: translateX(5px);
  }
  
  [style*="filterButton"]:hover,
  [style*="filterTag"]:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  [style*="statCard"]:hover [style*="statIcon"] {
    transform: rotate(360deg);
  }
  
  [style*="featureCard"]:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);
  }
  
  [style*="featureCard"]:hover [style*="featureIcon"] {
    transform: scale(1.1);
  }
  
  [style*="featureLink"]:hover {
    gap: 0.75rem;
  }
  
  [style*="categoryCard"]:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);
  }
  
  [style*="categoryCard"]:hover [style*="categoryIcon"] {
    transform: scale(1.15) rotate(5deg);
  }
  
  [style*="categoryButton"]:hover {
    transform: scale(1.05);
  }
  
  [style*="ctaPrimary"]:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  [style*="ctaSecondary"]:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;
document.head.appendChild(styleSheet);

export default HomePage;