/**
 * Spark
 * FBLA Coding & Programming 2024-2025
 * A community platform for discovering and supporting local small businesses
 *
 * Innovative Features:
 * 1. "Hidden Gems" Daily Spotlight — rotates a featured business each day using date-seeded selection
 * 2. AI-Style Recommendation Engine — rule-based matching using user behavior (categories visited, bookmarks)
 * 3. Community Impact Dashboard — live engagement metrics with animated counters
 * 4. Local Deals Section — time-limited promotions per business
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────
const BUSINESSES = [
  {
    id: 1,
    name: "The Golden Fork",
    category: "Food",
    subcategory: "Restaurant",
    description:
      "A family-owned bistro serving farm-to-table American classics since 1998. Every dish is crafted with locally sourced ingredients and love.",
    address: "142 Maple Street, Riverside, CA 92501",
    phone: "(951) 555-0142",
    website: "https://goldenfork.example.com",
    hours: "Mon–Sat 11am–9pm, Sun 10am–8pm",
    rating: 4.8,
    reviewCount: 124,
    photos: ["🍽️", "🥗", "🍰"],
    tags: ["family-friendly", "outdoor seating", "vegetarian options"],
    featured: true,
    deal: { text: "10% off your first order", expires: "2025-06-01" },
    lat: 33.9806,
    lng: -117.3755,
    story:
      "Chef Maria Lopez opened The Golden Fork after 20 years in fine dining, wanting to bring that quality to everyday families.",
    established: 1998,
  },
  {
    id: 2,
    name: "Bloom & Thrive Florist",
    category: "Retail",
    subcategory: "Florist",
    description:
      "Artisan floral arrangements for every occasion. Specializing in wildflower bouquets and sustainable, seasonal blooms.",
    address: "78 Oak Avenue, Riverside, CA 92502",
    phone: "(951) 555-0078",
    website: "https://bloomthrive.example.com",
    hours: "Tue–Sat 9am–6pm",
    rating: 4.9,
    reviewCount: 88,
    photos: ["🌸", "💐", "🌿"],
    tags: ["sustainable", "custom orders", "wedding specialist"],
    featured: true,
    deal: null,
    lat: 33.982,
    lng: -117.377,
    story:
      "Founded by botanist Priya Patel who left corporate life to pursue her passion for sustainable floristry.",
    established: 2015,
  },
  {
    id: 3,
    name: "Circuit & Soul",
    category: "Services",
    subcategory: "Tech Repair",
    description:
      "Honest, fast electronics repair for phones, laptops, and tablets. No upselling — just expert fixes at fair prices.",
    address: "305 Pine Blvd, Riverside, CA 92503",
    phone: "(951) 555-0305",
    website: "https://circuitsoul.example.com",
    hours: "Mon–Fri 10am–7pm, Sat 10am–5pm",
    rating: 4.7,
    reviewCount: 210,
    photos: ["💻", "📱", "🔧"],
    tags: ["same-day service", "warranty included", "data recovery"],
    featured: false,
    deal: { text: "Free screen protector with any repair", expires: "2025-05-15" },
    lat: 33.975,
    lng: -117.372,
    story:
      "Marcus Chen spent 10 years at a big-box store watching customers get overcharged, so he opened his own place to fix that.",
    established: 2019,
  },
  {
    id: 4,
    name: "Velvet Thread Studio",
    category: "Arts",
    subcategory: "Fashion & Art",
    description:
      "Independent clothing boutique and art gallery. Showcasing local designers and rotating gallery exhibitions monthly.",
    address: "21 Gallery Row, Riverside, CA 92501",
    phone: "(951) 555-0021",
    website: "https://velvetthread.example.com",
    hours: "Wed–Sun 11am–7pm",
    rating: 4.6,
    reviewCount: 67,
    photos: ["🎨", "👗", "🖼️"],
    tags: ["local artists", "handmade", "gallery events"],
    featured: true,
    deal: { text: "First-time visitors: free tote bag", expires: "2025-07-01" },
    lat: 33.979,
    lng: -117.369,
    story:
      "Co-founded by artists Layla and Remi to create a space where fashion meets fine art in their community.",
    established: 2021,
  },
  {
    id: 5,
    name: "Sunrise Bakehouse",
    category: "Food",
    subcategory: "Bakery",
    description:
      "Artisan sourdough, pastries, and specialty coffees baked fresh daily. Gluten-free options always available.",
    address: "9 Harbor Lane, Riverside, CA 92504",
    phone: "(951) 555-0009",
    website: "https://sunrisebakehouse.example.com",
    hours: "Daily 6am–2pm",
    rating: 4.9,
    reviewCount: 301,
    photos: ["🥐", "☕", "🍞"],
    tags: ["gluten-free", "organic", "early opening"],
    featured: false,
    deal: null,
    lat: 33.978,
    lng: -117.381,
    story:
      "Jamie Okafor trained at a Paris boulangerie before returning home to share that craft with their hometown.",
    established: 2017,
  },
  {
    id: 6,
    name: "Harbor Fitness Co.",
    category: "Services",
    subcategory: "Fitness",
    description:
      "Community-focused gym with small-group training, yoga, and nutrition coaching. No intimidating atmosphere here.",
    address: "55 Riverside Drive, Riverside, CA 92501",
    phone: "(951) 555-0055",
    website: "https://harborfitness.example.com",
    hours: "Mon–Fri 5am–10pm, Sat–Sun 7am–8pm",
    rating: 4.5,
    reviewCount: 143,
    photos: ["🏋️", "🧘", "💪"],
    tags: ["group classes", "personal training", "beginner-friendly"],
    featured: false,
    deal: { text: "First week free for new members", expires: "2025-05-30" },
    lat: 33.981,
    lng: -117.375,
    story:
      "Former teacher Sofia Nguyen built Harbor Fitness after seeing how inaccessible health spaces felt for regular people.",
    established: 2020,
  },
  {
    id: 7,
    name: "Page & Prose Books",
    category: "Retail",
    subcategory: "Bookstore",
    description:
      "An independent bookstore with curated fiction, local author spotlights, and a cozy reading nook open to all.",
    address: "33 Literary Lane, Riverside, CA 92502",
    phone: "(951) 555-0033",
    website: "https://pageandprose.example.com",
    hours: "Mon–Sat 10am–8pm, Sun 12pm–6pm",
    rating: 4.8,
    reviewCount: 178,
    photos: ["📚", "📖", "☕"],
    tags: ["book club", "author events", "kids section"],
    featured: false,
    deal: null,
    lat: 33.977,
    lng: -117.373,
    story:
      "David and Ana Reyes started Page & Prose after their favorite bookstore closed, determined to keep literary culture alive.",
    established: 2016,
  },
  {
    id: 8,
    name: "Mural & Mosaic Arts",
    category: "Arts",
    subcategory: "Art Studio",
    description:
      "Community art studio offering classes for all ages, plus a vibrant gallery of local muralists and mosaic artists.",
    address: "101 Color Street, Riverside, CA 92503",
    phone: "(951) 555-0101",
    website: "https://muralmosaic.example.com",
    hours: "Tue–Sun 10am–6pm",
    rating: 4.7,
    reviewCount: 95,
    photos: ["🎭", "🖌️", "🏛️"],
    tags: ["classes", "kids welcome", "community events"],
    featured: false,
    deal: { text: "Kids class 50% off this month", expires: "2025-05-31" },
    lat: 33.983,
    lng: -117.368,
    story:
      "A collective of six local artists who pooled resources to create a permanent creative hub for their neighborhood.",
    established: 2018,
  },
];

const REVIEWS_INITIAL = {
  1: [
    { id: 1, author: "Sarah M.", rating: 5, text: "Best brunch spot in town. The eggs benedict are life-changing!", date: "2024-11-15", avatar: "S" },
    { id: 2, author: "James K.", rating: 5, text: "Family atmosphere, incredible food. We come every Sunday.", date: "2024-10-22", avatar: "J" },
  ],
  2: [
    { id: 3, author: "Anika R.", rating: 5, text: "My wedding bouquets were absolutely stunning. Priya gets your vision.", date: "2024-12-01", avatar: "A" },
  ],
  3: [
    { id: 4, author: "Derek L.", rating: 5, text: "Fixed my shattered screen in 45 minutes. Honest pricing, great service.", date: "2024-11-28", avatar: "D" },
    { id: 5, author: "Chloe P.", rating: 4, text: "Very knowledgeable team. Saved my laptop when others said it was dead.", date: "2024-10-10", avatar: "C" },
  ],
  4: [
    { id: 6, author: "Mia T.", rating: 5, text: "The gallery rotation is always fresh. Found my favorite local artist here!", date: "2024-11-05", avatar: "M" },
  ],
  5: [
    { id: 7, author: "Tom B.", rating: 5, text: "The sourdough alone is worth the drive. Opens at 6am which is perfect.", date: "2024-12-10", avatar: "T" },
    { id: 8, author: "Priya S.", rating: 5, text: "GF croissants that actually taste amazing. A rare find.", date: "2024-11-30", avatar: "P" },
  ],
  6: [
    { id: 9, author: "Luis V.", rating: 4, text: "Best gym environment I've ever been in. No judgment, just community.", date: "2024-12-05", avatar: "L" },
  ],
  7: [
    { id: 10, author: "Emma W.", rating: 5, text: "Their staff actually reads the books and gives perfect recommendations.", date: "2024-11-18", avatar: "E" },
  ],
  8: [
    { id: 11, author: "Oscar F.", rating: 5, text: "Took a mosaic class here — the instructors are so patient and talented.", date: "2024-11-25", avatar: "O" },
  ],
};

const CATEGORIES = ["All", "Food", "Retail", "Services", "Arts"];
const CATEGORY_ICONS = { Food: "🍴", Retail: "🛍️", Services: "⚙️", Arts: "🎨", All: "✨" };
const CATEGORY_COLORS = {
  Food: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
  Retail: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300", border: "border-sky-300 dark:border-sky-700" },
  Services: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700" },
  Arts: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700" },
};

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  const set = useCallback((val) => {
    setState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [state, set];
}

function useAnimatedCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return count;
}

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function getHiddenGem() {
  // Seeded by day-of-year so it changes daily
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return BUSINESSES[dayOfYear % BUSINESSES.length];
}

function getRecommendations(bookmarks, visitedCategories, currentId) {
  // Rule-based: prefer bookmarked categories, then highly-rated, then exclude current
  const catCounts = {};
  bookmarks.forEach((id) => {
    const b = BUSINESSES.find((x) => x.id === id);
    if (b) catCounts[b.category] = (catCounts[b.category] || 0) + 3;
  });
  visitedCategories.forEach((cat) => {
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  return BUSINESSES
    .filter((b) => b.id !== currentId)
    .map((b) => ({ ...b, score: (catCounts[b.category] || 0) + b.rating }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function StarRating({ rating, size = "sm", interactive = false, onRate }) {
  const sz = size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-xl";
  return (
    <div className={`flex gap-0.5 ${sz}`} aria-label={`Rating: ${rating} out of 5`}>
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          onClick={() => interactive && onRate && onRate(s)}
          className={`${interactive ? "cursor-pointer hover:scale-125 transition-transform" : "cursor-default"} ${s <= Math.round(rating) ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
          aria-label={interactive ? `Rate ${s} stars` : undefined}
          tabIndex={interactive ? 0 : -1}
        >★</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function Navbar({ page, setPage, darkMode, setDarkMode, bookmarks }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { key: "home", label: "Home" },
    { key: "discover", label: "Discover" },
    { key: "deals", label: "Deals" },
    { key: "community", label: "Community" },
    { key: "dashboard", label: "Dashboard" },
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-200/60 dark:border-gray-800/60 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => setPage("home")} className="flex items-center gap-2 font-black text-xl tracking-tight text-gray-900 dark:text-white hover:opacity-80 transition-opacity" aria-label="Go to home">
          <span className="text-2xl">✨</span>
          <span className="hidden sm:inline text-blue-500">Spark</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <button
              key={l.key}
              onClick={() => setPage(l.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                page === l.key
                  ? "bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
              aria-current={page === l.key ? "page" : undefined}
            >{l.label}</button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage("favorites")}
            className={`relative p-2 rounded-lg transition-all ${page === "favorites" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-500" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            aria-label={`Favorites (${bookmarks.length} saved)`}
          >
            <span className="text-xl">♥</span>
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {bookmarks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xl"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >{darkMode ? "☀️" : "🌙"}</button>
          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <div className="w-5 flex flex-col gap-1">
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}/>
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`}/>
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}/>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((l) => (
            <button
              key={l.key}
              onClick={() => { setPage(l.key); setMenuOpen(false); }}
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                page === l.key ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >{l.label}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

function BusinessCard({ business, bookmarks, toggleBookmark, onView, showDeal = false }) {
  const isBookmarked = bookmarks.includes(business.id);
  const catColor = CATEGORY_COLORS[business.category] || CATEGORY_COLORS.Food;

  return (
    <article
      className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onView(business.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onView(business.id)}
      aria-label={`View ${business.name}`}
    >
      {/* Header photo strip */}
      <div className={`h-28 flex items-center justify-center text-5xl gap-3 ${catColor.bg} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent"/>
        {business.photos.slice(0, 3).map((p, i) => (
          <span key={i} className="filter drop-shadow" style={{ transform: `rotate(${[-8, 0, 8][i]}deg) scale(${[0.8, 1.1, 0.8][i]})` }}>{p}</span>
        ))}
        {business.featured && (
          <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full">⭐ Featured</div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{business.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                {CATEGORY_ICONS[business.category]} {business.category}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleBookmark(business.id); }}
            className={`flex-shrink-0 p-2 rounded-xl transition-all ${isBookmarked ? "bg-rose-100 dark:bg-rose-900/40 text-rose-500 scale-110" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-500"}`}
            aria-label={isBookmarked ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isBookmarked}
          >♥</button>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">{business.description}</p>

        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={business.rating} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{business.rating}</span>
          <span className="text-xs text-gray-400">({business.reviewCount})</span>
        </div>

        {showDeal && business.deal && (
          <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5 flex items-center gap-2">
            <span>🏷️</span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{business.deal.text}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
          <span>📍</span>
          <span className="truncate">{business.address.split(",").slice(0, 2).join(",")}</span>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────

function HomePage({ setPage, setActiveBusiness, bookmarks, toggleBookmark, stats }) {
  const gem = getHiddenGem();
  const featured = BUSINESSES.filter((b) => b.featured);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCarouselIdx((i) => (i + 1) % featured.length), 4000);
    return () => clearInterval(t);
  }, [featured.length]);

  const StatCounter = ({ value, label, icon }) => {
    const count = useAnimatedCounter(value);
    return (
      <div className="text-center">
        <div className="text-3xl font-black text-blue-500">{count}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{icon} {label}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-sky-200/30 dark:bg-sky-800/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-blue-200 dark:border-blue-800">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
            Supporting local since day one
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white leading-none tracking-tighter mb-6">
            Discover the
            <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-400">heart</span>
            {" "}of your
            <br/>community
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Every purchase from a local business keeps dreams alive. Explore, support, and celebrate the small businesses that make your community extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setPage("discover")}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900 transition-all hover:scale-105 text-lg"
            >
              Explore Businesses 🔍
            </button>
            <button
              onClick={() => setPage("community")}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all hover:scale-105 text-lg shadow-sm"
            >
              Community Stories 💬
            </button>
          </div>
        </div>

        {/* Live stats strip */}
        <div className="max-w-2xl mx-auto mt-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 grid grid-cols-3 gap-6">
          <StatCounter value={stats.totalBusinesses} label="Businesses" icon="🏪" />
          <StatCounter value={stats.totalBookmarks} label="Bookmarks" icon="♥" />
          <StatCounter value={stats.totalEngagement} label="Engagements" icon="🌱" />
        </div>
      </section>

      {/* Hidden Gem spotlight */}
      <section className="py-16 px-4 bg-gradient-to-r from-violet-600 to-purple-700 dark:from-violet-900 dark:to-purple-950" aria-label="Daily hidden gem spotlight">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">💎</span>
            <div>
              <h2 className="text-2xl font-black text-white">Today's Hidden Gem</h2>
              <p className="text-violet-200 text-sm">Our algorithm surfaces a different local treasure every day</p>
            </div>
            <div className="ml-auto bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
              Refreshes daily
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className={`w-32 h-32 flex-shrink-0 rounded-2xl flex items-center justify-center text-5xl ${CATEGORY_COLORS[gem.category]?.bg || "bg-white/20"}`}>
              {gem.photos[0]}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="text-violet-200 text-sm font-semibold mb-1">{CATEGORY_ICONS[gem.category]} {gem.category} · Est. {gem.established}</div>
              <h3 className="text-3xl font-black text-white mb-2">{gem.name}</h3>
              <p className="text-violet-100 mb-4">{gem.description}</p>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <StarRating rating={gem.rating} size="md" />
                <span className="text-white font-bold">{gem.rating}</span>
                <span className="text-violet-200">({gem.reviewCount} reviews)</span>
              </div>
            </div>
            <button
              onClick={() => { setActiveBusiness(gem.id); setPage("business"); }}
              className="flex-shrink-0 px-6 py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-all hover:scale-105 shadow-lg"
            >
              Discover Now →
            </button>
          </div>
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="py-16 px-4" aria-label="Featured businesses">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Featured Businesses</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Handpicked community favorites</p>
            </div>
            <button onClick={() => setPage("discover")} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">View all →</button>
          </div>

          {/* Carousel */}
          <div className="relative overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
            >
              {featured.map((b) => (
                <div key={b.id} className="w-full flex-shrink-0">
                  <div
                    className={`h-64 md:h-80 flex items-center justify-between px-8 md:px-16 cursor-pointer ${CATEGORY_COLORS[b.category]?.bg || "bg-gray-100 dark:bg-gray-800"}`}
                    onClick={() => { setActiveBusiness(b.id); setPage("business"); }}
                  >
                    <div className="flex-1">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[b.category]?.bg} ${CATEGORY_COLORS[b.category]?.text}`}>
                        {b.category}
                      </span>
                      <h3 className="text-4xl font-black text-gray-900 dark:text-white mt-3 mb-2">{b.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md line-clamp-2">{b.description}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <StarRating rating={b.rating} size="md" />
                        <span className="font-bold text-gray-800 dark:text-gray-200">{b.rating}</span>
                      </div>
                    </div>
                    <div className="hidden md:flex text-8xl gap-2">{b.photos.map((p, i) => <span key={i}>{p}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === carouselIdx ? "bg-blue-500 scale-125" : "bg-gray-400/50 hover:bg-gray-400"}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Quick browse grid */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(CATEGORY_ICONS).filter(([k]) => k !== "All").map(([cat, icon]) => (
              <button
                key={cat}
                onClick={() => setPage("discover")}
                className={`p-5 rounded-2xl border ${CATEGORY_COLORS[cat]?.bg} ${CATEGORY_COLORS[cat]?.border} hover:scale-105 transition-all group`}
                aria-label={`Browse ${cat} businesses`}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <div className={`font-bold text-sm ${CATEGORY_COLORS[cat]?.text}`}>{cat}</div>
                <div className={`text-xs mt-0.5 ${CATEGORY_COLORS[cat]?.text} opacity-70`}>
                  {BUSINESSES.filter((b) => b.category === cat).length} businesses
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DiscoverPage({ setPage, setActiveBusiness, bookmarks, toggleBookmark }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("rating");

  const filtered = useMemo(() => {
    return BUSINESSES
      .filter((b) => {
        const q = search.toLowerCase();
        const matchSearch = !q || b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || b.tags.some((t) => t.includes(q));
        const matchCat = category === "All" || b.category === category;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "reviews") return b.reviewCount - a.reviewCount;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [search, category, sortBy]);

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Discover Local Businesses</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Find and support amazing businesses in your community</p>

        {/* Search & filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="search"
                placeholder="Search businesses, tags, or neighborhoods..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                aria-label="Search businesses"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Sort businesses"
            >
              <option value="rating">⭐ Top Rated</option>
              <option value="reviews">💬 Most Reviewed</option>
              <option value="name">🔤 A-Z</option>
            </select>
          </div>
          {/* Category pills */}
          <div className="flex gap-2 mt-3 flex-wrap" role="group" aria-label="Filter by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  category === cat
                    ? "bg-blue-500 text-white border-blue-500 shadow-md"
                    : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400`
                }`}
                aria-pressed={category === cat}
              >
                {CATEGORY_ICONS[cat] || "✨"} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {filtered.length} {filtered.length === 1 ? "business" : "businesses"} found
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No businesses found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try a different search term or category</p>
            <button onClick={() => { setSearch(""); setCategory("All"); }} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                onView={(id) => { setActiveBusiness(id); setPage("business"); }}
                showDeal
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessPage({ businessId, setPage, bookmarks, toggleBookmark, reviews, addReview, trackEngagement, visitedCategories, setVisitedCategories }) {
  const business = BUSINESSES.find((b) => b.id === businessId);
  const [activeTab, setActiveTab] = useState("about");
  const [newReview, setNewReview] = useState({ rating: 5, text: "", author: "" });
  const [submitted, setSubmitted] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const businessReviews = reviews[businessId] || [];
  const isBookmarked = bookmarks.includes(businessId);
  const catColor = CATEGORY_COLORS[business?.category] || CATEGORY_COLORS.Food;

  const recs = useMemo(() => getRecommendations(bookmarks, visitedCategories, businessId), [bookmarks, visitedCategories, businessId]);

  useEffect(() => {
    if (business) {
      setVisitedCategories((prev) => {
        const next = [...prev];
        if (!next.includes(business.category)) next.push(business.category);
        return next;
      });
      trackEngagement("visit");
    }
  }, [businessId]);

  if (!business) return <div className="pt-24 text-center text-gray-500">Business not found</div>;

  const handleSubmitReview = () => {
    if (!newReview.text.trim() || !newReview.author.trim()) return;
    addReview(businessId, {
      id: Date.now(),
      author: newReview.author,
      rating: newReview.rating,
      text: newReview.text,
      date: new Date().toISOString().split("T")[0],
      avatar: newReview.author[0].toUpperCase(),
    });
    setNewReview({ rating: 5, text: "", author: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    trackEngagement("review");
  };

  const handleShare = () => {
    const text = `Check out ${business.name} — a local business in your community!`;
    if (navigator.share) {
      navigator.share({ title: business.name, text, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(text);
      setShareMsg("Link copied to clipboard!");
      setTimeout(() => setShareMsg(""), 3000);
    }
    trackEngagement("share");
  };

  return (
    <div className="pt-20 pb-16 min-h-screen">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-4 pt-6 mb-4">
        <button onClick={() => setPage("discover")} className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
          ← Back to Discover
        </button>
      </div>

      {/* Hero banner */}
      <div className={`${catColor.bg} py-12 px-4 mb-8`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-center">
          <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-6xl bg-white/60 dark:bg-white/10 shadow-lg flex-shrink-0">
            {business.photos[0]}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full mb-2 ${catColor.bg} ${catColor.text} border ${catColor.border}`}>
              {CATEGORY_ICONS[business.category]} {business.category} · {business.subcategory}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">{business.name}</h1>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <StarRating rating={business.rating} size="lg" />
              <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">{business.rating}</span>
              <span className="text-gray-500 dark:text-gray-400">({business.reviewCount} reviews)</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">Est. {business.established}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 min-w-40">
            <button
              onClick={() => { toggleBookmark(business.id); trackEngagement("bookmark"); }}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${isBookmarked ? "bg-rose-500 text-white shadow-md" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-rose-400 hover:text-rose-500"}`}
            >
              ♥ {isBookmarked ? "Saved" : "Save"}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all"
            >
              ↑ Share
            </button>
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEngagement("visit")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-md text-center"
            >
              🌐 Visit Site
            </a>
          </div>
        </div>
      </div>

      {shareMsg && (
        <div className="max-w-5xl mx-auto px-4 mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200 dark:border-blue-800">✓ {shareMsg}</div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4">
        {/* Deal banner */}
        {business.deal && (
          <div className="mb-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-5 flex items-center gap-4 text-white shadow-lg">
            <span className="text-3xl">🏷️</span>
            <div>
              <div className="font-black text-lg">{business.deal.text}</div>
              <div className="text-white/80 text-sm">Offer expires {business.deal.expires}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl w-fit" role="tablist">
          {["about", "gallery", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >{tab}</button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "about" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <h2 className="font-black text-xl text-gray-900 dark:text-white mb-3">About</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{business.description}</p>
                <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-900/40">
                  <div className="text-xs font-bold text-violet-500 uppercase tracking-wide mb-2">Origin Story</div>
                  <p className="text-gray-600 dark:text-gray-400 italic text-sm">{business.story}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <h2 className="font-black text-xl text-gray-900 dark:text-white mb-3">What to Expect</h2>
                <div className="flex flex-wrap gap-2">
                  {business.tags.map((t) => (
                    <span key={t} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">✓ {t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Contact & Hours</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">📍</span>
                    <span className="text-gray-600 dark:text-gray-400">{business.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📞</span>
                    <a href={`tel:${business.phone}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">{business.phone}</a>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">🕐</span>
                    <span className="text-gray-600 dark:text-gray-400">{business.hours}</span>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: "repeating-linear-gradient(0deg, #3b82f6 0, #3b82f6 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 1px, transparent 0, transparent 40px)",
                  }}/>
                  <div className="text-center relative">
                    <div className="text-4xl mb-1">📍</div>
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">Map View</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">{business.lat.toFixed(3)}°N, {Math.abs(business.lng).toFixed(3)}°W</div>
                  </div>
                </div>
                <div className="p-3">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {business.photos.map((p, i) => (
              <div key={i} className={`rounded-2xl flex items-center justify-center text-6xl md:text-8xl aspect-square ${catColor.bg} border ${catColor.border}`}>
                {p}
              </div>
            ))}
            {[...business.photos, ...business.photos].map((p, i) => (
              <div key={`dup-${i}`} className={`rounded-2xl flex items-center justify-center text-4xl aspect-square bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 opacity-60`}>
                {p}
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="font-black text-xl text-gray-900 dark:text-white">
                {businessReviews.length} Review{businessReviews.length !== 1 ? "s" : ""}
              </h2>
              {businessReviews.map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {r.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{r.author}</div>
                      <div className="text-xs text-gray-400">{r.date}</div>
                    </div>
                    <div className="ml-auto">
                      <StarRating rating={r.rating} />
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{r.text}</p>
                </div>
              ))}
            </div>

            {/* Write review */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 h-fit">
              <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">Write a Review</h3>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">🎉</div>
                  <div className="font-bold text-gray-900 dark:text-white">Thank you for your review!</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your feedback helps the community.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Your Rating</label>
                    <StarRating rating={newReview.rating} size="lg" interactive onRate={(r) => setNewReview((p) => ({ ...p, rating: r }))} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block" htmlFor="review-author">Your Name</label>
                    <input
                      id="review-author"
                      type="text"
                      placeholder="Jane D."
                      value={newReview.author}
                      onChange={(e) => setNewReview((p) => ({ ...p, author: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block" htmlFor="review-text">Your Review</label>
                    <textarea
                      id="review-text"
                      rows={4}
                      placeholder="Share your experience..."
                      value={newReview.text}
                      onChange={(e) => setNewReview((p) => ({ ...p, text: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!newReview.text.trim() || !newReview.author.trim()}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                  >
                    Submit Review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-12">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">You Might Also Love</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">✨ AI-powered recommendations based on your interests</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recs.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                onView={(id) => { setActiveBusiness(id); }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DealsPage({ setPage, setActiveBusiness }) {
  const dealsBusinesses = BUSINESSES.filter((b) => b.deal);
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? dealsBusinesses : dealsBusinesses.filter((b) => b.category === filter);

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-bold px-4 py-2 rounded-full mb-4 border border-amber-200 dark:border-amber-800">
            🏷️ Limited Time Offers
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3">Local Deals & Promos</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Exclusive offers from small businesses who want to welcome you in. Every deal supports a dream.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center" role="group" aria-label="Filter deals by category">
          {["All", ...new Set(dealsBusinesses.map((b) => b.category))].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === cat ? "bg-amber-400 text-white shadow-md" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400"}`}
              aria-pressed={filter === cat}
            >
              {cat === "All" ? "✨" : CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Deal cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
              onClick={() => { setActiveBusiness(b.id); setPage("business"); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && (setActiveBusiness(b.id), setPage("business"))}
              aria-label={`View deal from ${b.name}`}
            >
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/30 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {b.photos[0]}
                </div>
                <div className="flex-1">
                  <div className="text-white/80 text-xs font-semibold">{b.category}</div>
                  <h3 className="text-white font-black text-xl">{b.name}</h3>
                </div>
                <div className="text-3xl">🏷️</div>
              </div>
              <div className="p-5">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-2">{b.deal.text}</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{b.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating rating={b.rating} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{b.rating}</span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span>⏱️</span> Expires {b.deal.expires}
                  </div>
                </div>
                <button
                  className="mt-4 w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-sm group-hover:scale-[1.02]"
                  onClick={(e) => { e.stopPropagation(); setActiveBusiness(b.id); setPage("business"); }}
                >
                  Claim Deal →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunityPage({ setPage, setActiveBusiness }) {
  const stories = BUSINESSES.map((b) => ({
    ...b,
    storyFull: `${b.story} Today, ${b.name} continues to be a beloved fixture in the community, serving hundreds of customers who come not just for the products but for the connection.`,
  }));

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-bold px-4 py-2 rounded-full mb-4 border border-rose-200 dark:border-rose-800">
            💬 Community Voices
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3">Stories Behind the Signs</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Every business has a story. These are the dreams, sacrifices, and passions of the people who built something real.
          </p>
        </div>

        <div className="space-y-6">
          {stories.map((b, i) => (
            <div
              key={b.id}
              className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row gap-5">
                <div className={`w-16 h-16 flex-shrink-0 rounded-2xl flex items-center justify-center text-3xl ${CATEGORY_COLORS[b.category]?.bg}`}>
                  {b.photos[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{b.subcategory} · Est. {b.established}</div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">{b.name}</h3>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[b.category]?.bg} ${CATEGORY_COLORS[b.category]?.text} border ${CATEGORY_COLORS[b.category]?.border}`}>
                      {CATEGORY_ICONS[b.category]} {b.category}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{b.storyFull}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating rating={b.rating} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{b.reviewCount} community reviews</span>
                    </div>
                    <button
                      onClick={() => { setActiveBusiness(b.id); setPage("business"); }}
                      className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Visit page →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ stats, bookmarks, visitedCategories }) {
  const totalBiz = useAnimatedCounter(stats.totalBusinesses);
  const totalBookmarks = useAnimatedCounter(stats.totalBookmarks);
  const totalEngagement = useAnimatedCounter(stats.totalEngagement);
  const categoriesExplored = useAnimatedCounter(visitedCategories.length);

  const categoryBreakdown = CATEGORIES.filter((c) => c !== "All").map((cat) => ({
    cat,
    count: BUSINESSES.filter((b) => b.category === cat).length,
    color: catColor(cat),
  }));

  function catColor(cat) {
    return { Food: "#f59e0b", Retail: "#0ea5e9", Services: "#8b5cf6", Arts: "#f43f5e" }[cat] || "#3b82f6";
  }

  const maxCount = Math.max(...categoryBreakdown.map((c) => c.count));

  const bookmarkedBusinesses = BUSINESSES.filter((b) => bookmarks.includes(b.id));

  const engagementScore = Math.min(100, Math.floor(
    (stats.totalEngagement / 20) * 40 +
    (bookmarks.length / 8) * 30 +
    (visitedCategories.length / 4) * 30
  ));

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Community Impact Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your engagement and see the impact of supporting local businesses</p>
        </div>

        {/* Big stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Businesses in DB", value: totalBiz, icon: "🏪", color: "blue" },
            { label: "Your Bookmarks", value: totalBookmarks, icon: "♥", color: "rose" },
            { label: "Total Engagements", value: totalEngagement, icon: "🌱", color: "sky" },
            { label: "Categories Explored", value: `${categoriesExplored}/4`, icon: "🗺️", color: "violet" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 text-center shadow-sm`}>
              <div className="text-3xl mb-2">{icon}</div>
              <div className={`text-3xl font-black text-${color}-500`}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Engagement Score */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-black text-xl text-gray-900 dark:text-white mb-2">Community Engagement Score</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Based on your bookmarks, visits, reviews, and shares</p>
            <div className="flex items-center gap-6">
              {/* Ring chart */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120" aria-label={`Engagement score: ${engagementScore} out of 100`}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-800"/>
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="url(#engGrad)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${engagementScore * 3.14} 314`}
                    style={{ transition: "stroke-dasharray 1.5s ease-out" }}
                  />
                  <defs>
                    <linearGradient id="engGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#0ea5e9"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{engagementScore}</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  { label: "Visits", value: stats.visits || 0, max: 10, color: "bg-sky-400" },
                  { label: "Bookmarks", value: bookmarks.length, max: 8, color: "bg-rose-400" },
                  { label: "Reviews", value: stats.reviews || 0, max: 5, color: "bg-violet-400" },
                  { label: "Shares", value: stats.shares || 0, max: 5, color: "bg-amber-400" },
                ].map(({ label, value, max, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      <span>{label}</span><span>{value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-black text-xl text-gray-900 dark:text-white mb-2">Business Categories</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Distribution of local businesses by category</p>
            <div className="space-y-3">
              {categoryBreakdown.map(({ cat, count, color }) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <span>{CATEGORY_ICONS[cat]} {cat}</span>
                    <span>{count} businesses</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookmarks section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-black text-xl text-gray-900 dark:text-white mb-2">Your Saved Businesses</h2>
          {bookmarkedBusinesses.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">♥</div>
              <p className="text-gray-500 dark:text-gray-400">You haven't saved any businesses yet. Start exploring!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {bookmarkedBusinesses.map((b) => (
                <div key={b.id} className={`p-3 rounded-xl ${CATEGORY_COLORS[b.category]?.bg} border ${CATEGORY_COLORS[b.category]?.border} text-center`}>
                  <div className="text-2xl mb-1">{b.photos[0]}</div>
                  <div className={`text-xs font-bold ${CATEGORY_COLORS[b.category]?.text} truncate`}>{b.name}</div>
                  <div className={`text-xs ${CATEGORY_COLORS[b.category]?.text} opacity-70`}>{b.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FavoritesPage({ bookmarks, toggleBookmark, setPage, setActiveBusiness }) {
  const saved = BUSINESSES.filter((b) => bookmarks.includes(b.id));

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Your Favorites</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{saved.length} saved {saved.length === 1 ? "business" : "businesses"}</p>

        {saved.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-4">♥</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nothing saved yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Explore businesses and save your favorites to keep track of them.</p>
            <button onClick={() => setPage("discover")} className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">
              Browse Businesses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {saved.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                onView={(id) => { setActiveBusiness(id); setPage("business"); }}
                showDeal
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useLocalStorage("bsbb_dark", false);
  const [page, setPage] = useState("home");
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [bookmarks, setBookmarks] = useLocalStorage("bsbb_bookmarks", []);
  const [reviews, setReviews] = useLocalStorage("bsbb_reviews", REVIEWS_INITIAL);
  const [engagements, setEngagements] = useLocalStorage("bsbb_eng", { total: 0, visits: 0, reviews: 0, shares: 0, bookmarks: 0 });
  const [visitedCategories, setVisitedCategories] = useLocalStorage("bsbb_cats", []);

  const toggleBookmark = useCallback((id) => {
    setBookmarks((prev) => {
      const isIn = prev.includes(id);
      const next = isIn ? prev.filter((x) => x !== id) : [...prev, id];
      if (!isIn) setEngagements((e) => ({ ...e, total: e.total + 1, bookmarks: e.bookmarks + 1 }));
      return next;
    });
  }, [setBookmarks, setEngagements]);

  const addReview = useCallback((bizId, review) => {
    setReviews((prev) => ({
      ...prev,
      [bizId]: [...(prev[bizId] || []), review],
    }));
  }, [setReviews]);

  const trackEngagement = useCallback((type) => {
    setEngagements((e) => ({
      ...e,
      total: e.total + 1,
      [type]: (e[type] || 0) + 1,
    }));
  }, [setEngagements]);

  const stats = useMemo(() => ({
    totalBusinesses: BUSINESSES.length,
    totalBookmarks: bookmarks.length,
    totalEngagement: engagements.total,
    visits: engagements.visits,
    reviews: engagements.reviews,
    shares: engagements.shares,
  }), [bookmarks.length, engagements]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, activeBusiness]);

  const commonProps = { bookmarks, toggleBookmark, setPage, setActiveBusiness };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300" style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}>
        {/* Google Font import */}
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box}.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>

        <Navbar
          page={page}
          setPage={setPage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          bookmarks={bookmarks}
        />

        <main id="main-content">
          {page === "home" && <HomePage {...commonProps} stats={stats} />}
          {page === "discover" && <DiscoverPage {...commonProps} />}
          {page === "business" && activeBusiness && (
            <BusinessPage
              businessId={activeBusiness}
              setPage={setPage}
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              reviews={reviews}
              addReview={addReview}
              trackEngagement={trackEngagement}
              visitedCategories={visitedCategories}
              setVisitedCategories={setVisitedCategories}
            />
          )}
          {page === "deals" && <DealsPage {...commonProps} />}
          {page === "community" && <CommunityPage {...commonProps} />}
          {page === "dashboard" && (
            <DashboardPage
              stats={stats}
              bookmarks={bookmarks}
              visitedCategories={visitedCategories}
            />
          )}
          {page === "favorites" && <FavoritesPage {...commonProps} />}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 py-10 px-4 mt-8 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="font-black text-lg text-gray-900 dark:text-white">Spark</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Built for FBLA Coding & Programming · Empowering local communities</p>
            <div className="flex gap-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <button onClick={() => setPage("discover")} className="hover:text-blue-500 transition-colors">Discover</button>
              <button onClick={() => setPage("deals")} className="hover:text-blue-500 transition-colors">Deals</button>
              <button onClick={() => setPage("dashboard")} className="hover:text-blue-500 transition-colors">Dashboard</button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
