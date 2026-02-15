// InteractiveGlobe.jsx — Three.js dotted sphere with continent-aware dots & floating business cards
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Star, MapPin } from 'lucide-react';

// ─── Famous small businesses with real coordinates ────────────
const businesses = [
    { name: "Café de Flore", location: "Paris, France", rating: 4.8, lat: 48.854, lng: 2.333, description: "Iconic literary café since 1887" },
    { name: "Ichiran Ramen", location: "Tokyo, Japan", rating: 4.9, lat: 35.693, lng: 139.703, description: "Solo ramen dining experience" },
    { name: "Shakespeare & Co.", location: "Paris, France", rating: 4.7, lat: 48.852, lng: 2.347, description: "Legendary indie bookshop" },
    { name: "Taquería Los Cocuyos", location: "Mexico City", rating: 4.8, lat: 19.432, lng: -99.133, description: "Legendary late-night tacos" },
    { name: "Bar Luce", location: "Milan, Italy", rating: 4.6, lat: 45.463, lng: 9.176, description: "Wes Anderson-designed café" },
    { name: "City Lights Books", location: "San Francisco", rating: 4.8, lat: 37.798, lng: -122.407, description: "Beat Generation bookshop" },
    { name: "Warung Babi Guling", location: "Bali, Indonesia", rating: 4.7, lat: -8.506, lng: 115.262, description: "Famous roast suckling pig" },
    { name: "Tim Ho Wan", location: "Hong Kong", rating: 4.8, lat: 22.319, lng: 114.170, description: "World's cheapest Michelin star" },
    { name: "Pieminister", location: "London, UK", rating: 4.5, lat: 51.524, lng: -0.072, description: "Gourmet British pies" },
    { name: "Schwartz's Deli", location: "Montreal, Canada", rating: 4.7, lat: 45.518, lng: -73.577, description: "Smoked meat since 1928" },
    { name: "Lune Croissanterie", location: "Melbourne, AU", rating: 4.9, lat: -37.810, lng: 144.939, description: "World's best croissants" },
    { name: "Bo-Kaap Kombuis", location: "Cape Town, SA", rating: 4.6, lat: -33.921, lng: 18.414, description: "Cape Malay cuisine" },
];

// ─── Simplified continent detection (lat, lng → is land?) ─────
// Uses bounding boxes for major landmasses. Not pixel-perfect, but visually convincing.
function isLand(lat, lng) {
    const regions = [
        // North America
        { latMin: 25, latMax: 72, lngMin: -170, lngMax: -50 },
        // Central America / Caribbean
        { latMin: 7, latMax: 25, lngMin: -120, lngMax: -60 },
        // South America
        { latMin: -56, latMax: 12, lngMin: -82, lngMax: -34 },
        // Europe
        { latMin: 35, latMax: 71, lngMin: -12, lngMax: 45 },
        // Africa
        { latMin: -35, latMax: 37, lngMin: -18, lngMax: 52 },
        // Middle East
        { latMin: 12, latMax: 42, lngMin: 25, lngMax: 63 },
        // Russia / Central Asia
        { latMin: 40, latMax: 78, lngMin: 45, lngMax: 180 },
        // South Asia
        { latMin: 5, latMax: 38, lngMin: 60, lngMax: 98 },
        // East Asia
        { latMin: 18, latMax: 55, lngMin: 98, lngMax: 145 },
        // Southeast Asia (mainland)
        { latMin: -2, latMax: 23, lngMin: 95, lngMax: 120 },
        // Indonesia / Philippines
        { latMin: -11, latMax: 20, lngMin: 95, lngMax: 141 },
        // Australia
        { latMin: -44, latMax: -10, lngMin: 112, lngMax: 155 },
        // New Zealand
        { latMin: -47, latMax: -34, lngMin: 166, lngMax: 179 },
        // Japan / Korea
        { latMin: 30, latMax: 46, lngMin: 125, lngMax: 146 },
        // UK / Ireland
        { latMin: 50, latMax: 60, lngMin: -11, lngMax: 2 },
        // Scandinavia
        { latMin: 55, latMax: 71, lngMin: 4, lngMax: 31 },
        // Greenland
        { latMin: 59, latMax: 84, lngMin: -73, lngMax: -12 },
        // Alaska extension
        { latMin: 54, latMax: 72, lngMin: -170, lngMax: -130 },
        // Madagascar
        { latMin: -26, latMax: -12, lngMin: 43, lngMax: 51 },
    ];

    for (const r of regions) {
        if (lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax) {
            return true;
        }
    }
    return false;
}

// ─── Convert lat/lng to 3D position ───────────────────────────
function latLngTo3D(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// ─── Generate dots on sphere with Fibonacci distribution ──────
function generateDots(count, radius) {
    const dots = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2; // -1 to 1
        const r = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        // Convert to lat/lng to check continent
        const lat = Math.asin(y) * (180 / Math.PI);
        const lng = Math.atan2(z, x) * (180 / Math.PI);
        const onLand = isLand(lat, lng);

        dots.push({
            position: new THREE.Vector3(x * radius, y * radius, z * radius),
            isLand: onLand,
            lat,
            lng
        });
    }
    return dots;
}

// ═══════════════════════════════════════════════════════════════
const InteractiveGlobe = ({ theme, isDarkMode }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const globeGroupRef = useRef(null);
    const isDragging = useRef(false);
    const previousMousePos = useRef({ x: 0, y: 0 });
    const rotationVelocity = useRef({ x: 0, y: 0.002 });
    const animRef = useRef(null);
    const [visibleCards, setVisibleCards] = useState([]);

    const GLOBE_SIZE = 560;
    const GLOBE_RADIUS = 200;

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // ── Scene setup ──
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);
        camera.position.z = 600;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(GLOBE_SIZE, GLOBE_SIZE);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;
        mount.appendChild(renderer.domElement);

        // ── Globe group (for rotation) ──
        const globeGroup = new THREE.Group();
        globeGroupRef.current = globeGroup;
        scene.add(globeGroup);

        // ── Generate dots ──
        const dots = generateDots(2200, GLOBE_RADIUS);

        // Land dots — fully opaque, larger
        const landPositions = [];
        const oceanPositions = [];

        for (const dot of dots) {
            if (dot.isLand) {
                landPositions.push(dot.position.x, dot.position.y, dot.position.z);
            } else {
                oceanPositions.push(dot.position.x, dot.position.y, dot.position.z);
            }
        }

        // Land dots
        const landGeom = new THREE.BufferGeometry();
        landGeom.setAttribute('position', new THREE.Float32BufferAttribute(landPositions, 3));
        const landColor = isDarkMode ? '#ffffff' : '#111111';
        const landMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(landColor),
            size: 2.6,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.92,
        });
        const landPoints = new THREE.Points(landGeom, landMaterial);
        globeGroup.add(landPoints);

        // Ocean dots — lighter / more transparent
        const oceanGeom = new THREE.BufferGeometry();
        oceanGeom.setAttribute('position', new THREE.Float32BufferAttribute(oceanPositions, 3));
        const oceanColor = isDarkMode ? '#555555' : '#cccccc';
        const oceanMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(oceanColor),
            size: 1.6,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.35,
        });
        const oceanPoints = new THREE.Points(oceanGeom, oceanMaterial);
        globeGroup.add(oceanPoints);

        // ── Business location markers (small glowing spheres) ──
        const markerGroup = new THREE.Group();
        const markerColor = isDarkMode ? 0x8b5cf6 : 0x6366f1;
        businesses.forEach(b => {
            const pos = latLngTo3D(b.lat, b.lng, GLOBE_RADIUS + 2);
            // Inner dot
            const dotGeom = new THREE.SphereGeometry(2.5, 8, 8);
            const dotMat = new THREE.MeshBasicMaterial({ color: markerColor });
            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.position.copy(pos);
            markerGroup.add(dot);
            // Outer glow ring
            const ringGeom = new THREE.SphereGeometry(5, 8, 8);
            const ringMat = new THREE.MeshBasicMaterial({ color: markerColor, transparent: true, opacity: 0.2 });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.copy(pos);
            markerGroup.add(ring);
        });
        globeGroup.add(markerGroup);

        // ── Animation loop ──
        const animate = () => {
            // Auto-rotate
            if (!isDragging.current) {
                globeGroup.rotation.y += rotationVelocity.current.y;
            }

            // Project business positions to screen for cards
            const cardData = businesses.map(b => {
                const pos3D = latLngTo3D(b.lat, b.lng, GLOBE_RADIUS + 5);
                // Apply globe rotation
                const vec = pos3D.clone().applyEuler(globeGroup.rotation);
                // Project to 2D
                const projected = vec.clone().project(camera);
                const screenX = (projected.x * 0.5 + 0.5) * GLOBE_SIZE;
                const screenY = (-projected.y * 0.5 + 0.5) * GLOBE_SIZE;
                // Check if front-facing (z < 0 in camera space means behind)
                const camSpaceZ = vec.z;
                const isFront = camSpaceZ > 0;
                const depth = (camSpaceZ + GLOBE_RADIUS) / (GLOBE_RADIUS * 2);
                return {
                    ...b,
                    screenX,
                    screenY,
                    z: camSpaceZ,
                    visible: isFront && depth > 0.4,
                    scale: Math.max(0, Math.min(1, depth)),
                };
            }).filter(c => c.visible);

            cardData.sort((a, b) => b.z - a.z);
            setVisibleCards(cardData.slice(0, 4));

            renderer.render(scene, camera);
            animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);

        // ── Cleanup ──
        return () => {
            cancelAnimationFrame(animRef.current);
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            landGeom.dispose();
            landMaterial.dispose();
            oceanGeom.dispose();
            oceanMaterial.dispose();
        };
    }, [isDarkMode]);

    // ── Mouse interaction ──
    const handleMouseDown = useCallback((e) => {
        isDragging.current = true;
        previousMousePos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging.current || !globeGroupRef.current) return;
        const dx = e.clientX - previousMousePos.current.x;
        const dy = e.clientY - previousMousePos.current.y;
        globeGroupRef.current.rotation.y += dx * 0.005;
        globeGroupRef.current.rotation.x += dy * 0.005;
        // Clamp x rotation
        globeGroupRef.current.rotation.x = Math.max(-0.8, Math.min(0.8, globeGroupRef.current.rotation.x));
        previousMousePos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    return (
        <div style={{ position: 'relative', width: `${GLOBE_SIZE}px`, height: `${GLOBE_SIZE}px` }}>
            <div
                ref={mountRef}
                style={{
                    width: `${GLOBE_SIZE}px`,
                    height: `${GLOBE_SIZE}px`,
                    cursor: isDragging.current ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            {/* Floating business cards */}
            {visibleCards.map((card) => (
                <div
                    key={card.name}
                    className="globe-card"
                    style={{
                        position: 'absolute',
                        left: `${card.screenX}px`,
                        top: `${card.screenY}px`,
                        transform: `translate(-50%, -120%) scale(${0.7 + card.scale * 0.3})`,
                        opacity: 0.7 + card.scale * 0.3,
                        backgroundColor: isDarkMode ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.93)',
                        backdropFilter: 'blur(14px)',
                        borderRadius: '13px',
                        padding: '0.7rem 0.85rem',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
                        pointerEvents: 'none',
                        transition: 'opacity 0.5s ease, transform 0.5s ease',
                        whiteSpace: 'nowrap',
                        zIndex: Math.round(card.z + 200),
                        maxWidth: '210px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                        <span style={{
                            fontWeight: '600', fontSize: '0.76rem', color: theme.text,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            fontFamily: "'Poppins', sans-serif"
                        }}>{card.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.2rem' }}>
                        <MapPin size={9} color={theme.textMuted} />
                        <span style={{ fontSize: '0.62rem', color: theme.textMuted, fontFamily: "'Poppins', sans-serif" }}>{card.location}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={9}
                                fill={s <= Math.floor(card.rating) ? '#f59e0b' : 'none'}
                                color="#f59e0b"
                            />
                        ))}
                        <span style={{ fontSize: '0.58rem', color: theme.textMuted, marginLeft: '0.2rem', fontFamily: "'Poppins', sans-serif" }}>
                            {card.rating}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InteractiveGlobe;