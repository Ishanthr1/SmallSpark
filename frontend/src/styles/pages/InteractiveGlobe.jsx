// InteractiveGlobe.jsx — Three.js dotted globe with continent-aware dots & business cards
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Star, MapPin } from 'lucide-react';

// ─── Famous small businesses with real coordinates ────────────
const businesses = [
    { name: "Café de Flore", location: "Paris, France", rating: 4.8, lat: 48.854, lng: 2.333, desc: "Iconic literary café since 1887" },
    { name: "Ichiran Ramen", location: "Tokyo, Japan", rating: 4.9, lat: 35.693, lng: 139.703, desc: "Solo ramen dining experience" },
    { name: "Taquería Los Cocuyos", location: "Mexico City", rating: 4.8, lat: 19.432, lng: -99.133, desc: "Legendary late-night tacos" },
    { name: "City Lights Books", location: "San Francisco", rating: 4.8, lat: 37.798, lng: -122.407, desc: "Beat Generation bookshop" },
    { name: "Warung Babi Guling", location: "Bali, Indonesia", rating: 4.7, lat: -8.506, lng: 115.262, desc: "Famous roast suckling pig" },
    { name: "Tim Ho Wan", location: "Hong Kong", rating: 4.8, lat: 22.319, lng: 114.170, desc: "Cheapest Michelin star" },
    { name: "Pieminister", location: "London, UK", rating: 4.5, lat: 51.524, lng: -0.072, desc: "Gourmet British pies" },
    { name: "Schwartz's Deli", location: "Montreal, Canada", rating: 4.7, lat: 45.518, lng: -73.577, desc: "Smoked meat since 1928" },
    { name: "Lune Croissanterie", location: "Melbourne, AU", rating: 4.9, lat: -37.810, lng: 144.939, desc: "World's best croissants" },
    { name: "Bo-Kaap Kombuis", location: "Cape Town, SA", rating: 4.6, lat: -33.921, lng: 18.414, desc: "Cape Malay cuisine" },
    { name: "Bar Luce", location: "Milan, Italy", rating: 4.6, lat: 45.463, lng: 9.176, desc: "Wes Anderson café" },
    { name: "Boulangerie Poilâne", location: "Paris, France", rating: 4.9, lat: 48.851, lng: 2.328, desc: "Famous sourdough bread" },
];

// ─── Continent polygons (simplified [lng, lat] outlines) ──────
// Drawn onto a hidden equirectangular canvas for pixel-accurate land detection.
const CONTINENT_POLYS = [
    // North America
    [[-130,55],[-165,63],[-168,66],[-165,72],[-140,70],[-130,72],[-118,74],[-90,74],[-85,70],[-78,68],[-68,60],[-55,52],[-57,47],[-67,44],[-70,42],[-75,35],[-82,30],[-82,25],[-97,25],[-100,20],[-105,20],[-115,30],[-120,34],[-125,48],[-130,55]],
    // Central America
    [[-100,20],[-97,18],[-92,15],[-88,15],[-85,12],[-83,8],[-79,8],[-77,8],[-82,10],[-86,13],[-90,16],[-96,17],[-100,20]],
    // South America
    [[-82,10],[-77,8],[-72,12],[-67,11],[-60,8],[-52,4],[-50,0],[-50,-5],[-45,-5],[-41,-3],[-35,-5],[-35,-10],[-37,-15],[-40,-20],[-42,-22],[-48,-28],[-52,-33],[-58,-38],[-65,-42],[-68,-46],[-68,-54],[-72,-50],[-75,-45],[-75,-35],[-70,-18],[-75,-15],[-77,-5],[-78,0],[-80,5],[-78,8],[-82,10]],
    // Europe
    [[-12,36],[-10,38],[-8,42],[-2,44],[0,46],[2,48],[5,48],[6,52],[5,54],[8,55],[10,55],[12,57],[15,56],[18,55],[20,55],[22,58],[24,60],[25,62],[28,65],[30,68],[30,70],[25,71],[20,70],[12,65],[5,62],[0,58],[-5,58],[-6,54],[-10,52],[-10,44],[-12,36]],
    // Africa
    [[-18,15],[-16,18],[-12,22],[-13,25],[-8,30],[-5,34],[0,36],[10,37],[12,34],[15,32],[20,32],[25,30],[30,30],[33,28],[35,30],[38,25],[42,12],[48,8],[50,2],[42,-2],[40,-10],[35,-22],[33,-26],[28,-34],[20,-35],[18,-30],[15,-25],[12,-18],[10,-5],[8,5],[5,5],[2,6],[-5,5],[-8,5],[-15,10],[-18,15]],
    // Asia mainland
    [[25,42],[30,42],[35,37],[38,37],[42,38],[45,40],[50,40],[55,42],[60,40],[65,38],[68,37],[72,32],[76,28],[78,22],[80,15],[80,8],[82,8],[88,22],[90,22],[92,20],[95,18],[98,16],[100,14],[104,10],[105,12],[108,16],[110,20],[112,22],[115,23],[118,25],[120,30],[122,32],[125,34],[128,36],[128,38],[130,42],[132,44],[135,45],[138,42],[140,44],[145,44],[142,48],[138,50],[135,55],[133,58],[120,62],[110,60],[95,60],[82,62],[75,68],[70,72],[65,70],[60,68],[55,65],[48,60],[42,55],[40,48],[35,45],[30,42],[25,42]],
    // India
    [[68,23],[70,28],[72,32],[76,28],[78,22],[80,15],[80,8],[76,8],[72,10],[68,15],[68,23]],
    // SE Asia mainland
    [[98,6],[100,14],[104,10],[108,3],[105,0],[102,-2],[100,0],[98,6]],
    // Indonesia
    [[95,-2],[105,-5],[110,-7],[115,-8],[120,-8],[125,-6],[130,-3],[135,-5],[140,-6],[140,-8],[135,-10],[128,-9],[120,-10],[115,-9],[108,-8],[105,-6],[98,-3],[95,-2]],
    // Australia
    [[115,-14],[120,-14],[125,-14],[130,-12],[135,-12],[140,-15],[145,-16],[150,-22],[152,-25],[153,-28],[150,-32],[148,-36],[146,-39],[140,-38],[135,-35],[130,-32],[125,-32],[120,-34],[115,-34],[114,-28],[114,-22],[116,-20],[116,-17],[115,-14]],
    // UK/Ireland
    [[-8,52],[-5,52],[-5,55],[-3,56],[-2,58],[0,58],[2,55],[2,52],[0,50],[-4,50],[-5,51],[-8,52]],
    // Japan
    [[130,31],[132,33],[134,35],[136,36],[138,38],[140,40],[142,43],[144,44],[142,45],[140,43],[138,40],[136,38],[133,35],[130,31]],
    // New Zealand
    [[165,-35],[168,-37],[173,-40],[175,-42],[174,-44],[172,-45],[170,-43],[168,-40],[166,-38],[165,-35]],
    // Scandinavia
    [[5,58],[8,58],[12,60],[15,62],[16,65],[18,68],[20,70],[22,70],[25,68],[30,70],[30,65],[28,62],[24,60],[18,57],[14,56],[10,56],[5,58]],
    // Greenland
    [[-55,60],[-50,63],[-45,66],[-42,70],[-38,73],[-30,76],[-22,78],[-18,76],[-20,72],[-25,68],[-30,64],[-38,62],[-45,60],[-55,60]],
    // Madagascar
    [[44,-12],[47,-14],[49,-18],[49,-22],[48,-25],[45,-25],[43,-22],[43,-17],[44,-12]],
];

// Build a 720×360 land-mask bitmap from polygon outlines
function buildLandMap() {
    const W = 720, H = 360;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (const poly of CONTINENT_POLYS) {
        ctx.beginPath();
        for (let i = 0; i < poly.length; i++) {
            const [lng, lat] = poly[i];
            const px = ((lng + 180) / 360) * W;
            const py = ((90 - lat) / 180) * H;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
    return ctx.getImageData(0, 0, W, H);
}

function isLand(imgData, lat, lng) {
    const W = imgData.width, H = imgData.height;
    const px = Math.floor(((lng + 180) / 360) * W) % W;
    const py = Math.floor(((90 - lat) / 180) * H) % H;
    return imgData.data[(py * W + px) * 4] > 128;
}

// ─── lat/lng → Three.js Vector3 ──────────────────────────────
function latLngTo3D(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Generate Fibonacci-distributed dots, tagged land vs ocean
function makeDots(count, radius, landImg) {
    const land = [], ocean = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = golden * i;
        const x = Math.cos(th) * r, z = Math.sin(th) * r;
        const lat = Math.asin(y) * (180 / Math.PI);
        const lng = Math.atan2(z, x) * (180 / Math.PI);
        const arr = isLand(landImg, lat, lng) ? land : ocean;
        arr.push(x * radius, y * radius, z * radius);
    }
    return { land, ocean };
}

// ═══════════════════════════════════════════════════════════════
const InteractiveGlobe = ({ theme, isDarkMode }) => {
    const mountRef = useRef(null);
    const globeRef = useRef(null);
    const dragRef = useRef(false);
    const prevRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef(null);
    const [cards, setCards] = useState([]);

    const SIZE = 700;
    const R = 260;

    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        const landImg = buildLandMap();

        // Scene
        const scene = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(45, 1, 1, 2000);
        cam.position.z = 750;

        const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        ren.setSize(SIZE, SIZE);
        ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        ren.setClearColor(0x000000, 0);
        el.appendChild(ren.domElement);

        const globe = new THREE.Group();
        globeRef.current = globe;
        scene.add(globe);

        // Dots
        const { land, ocean } = makeDots(3200, R, landImg);

        const lGeo = new THREE.BufferGeometry();
        lGeo.setAttribute('position', new THREE.Float32BufferAttribute(land, 3));
        const lMat = new THREE.PointsMaterial({
            color: new THREE.Color(isDarkMode ? '#ffffff' : '#000000'),
            size: 3.0, sizeAttenuation: true, transparent: true, opacity: 0.95,
        });
        globe.add(new THREE.Points(lGeo, lMat));

        const oGeo = new THREE.BufferGeometry();
        oGeo.setAttribute('position', new THREE.Float32BufferAttribute(ocean, 3));
        const oMat = new THREE.PointsMaterial({
            color: new THREE.Color(isDarkMode ? '#444444' : '#c0c0c0'),
            size: 1.8, sizeAttenuation: true, transparent: true, opacity: 0.22,
        });
        globe.add(new THREE.Points(oGeo, oMat));

        // Business markers
        const mc = isDarkMode ? 0x8b5cf6 : 0x6366f1;
        businesses.forEach(b => {
            const p = latLngTo3D(b.lat, b.lng, R + 3);
            const sg = new THREE.SphereGeometry(3, 8, 8);
            const sm = new THREE.MeshBasicMaterial({ color: mc });
            const s = new THREE.Mesh(sg, sm); s.position.copy(p); globe.add(s);
            const hg = new THREE.SphereGeometry(7, 8, 8);
            const hm = new THREE.MeshBasicMaterial({ color: mc, transparent: true, opacity: 0.18 });
            const h = new THREE.Mesh(hg, hm); h.position.copy(p); globe.add(h);
        });

        // Animate
        const tick = () => {
            if (!dragRef.current) globe.rotation.y += 0.002;

            const cArr = businesses.map(b => {
                const v = latLngTo3D(b.lat, b.lng, R + 8).applyEuler(globe.rotation);
                const p = v.clone().project(cam);
                const depth = (v.z + R) / (R * 2);
                return {
                    ...b,
                    sx: (p.x * 0.5 + 0.5) * SIZE,
                    sy: (-p.y * 0.5 + 0.5) * SIZE,
                    z: v.z,
                    ok: v.z > 30 && depth > 0.45,
                    sc: Math.max(0, Math.min(1, depth)),
                };
            }).filter(c => c.ok).sort((a, b) => b.z - a.z).slice(0, 4);
            setCards(cArr);

            ren.render(scene, cam);
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
            if (el.contains(ren.domElement)) el.removeChild(ren.domElement);
            ren.dispose(); lGeo.dispose(); lMat.dispose(); oGeo.dispose(); oMat.dispose();
        };
    }, [isDarkMode]);

    // Mouse
    const dn = useCallback(e => { dragRef.current = true; prevRef.current = { x: e.clientX, y: e.clientY }; }, []);
    const mv = useCallback(e => {
        if (!dragRef.current || !globeRef.current) return;
        const g = globeRef.current;
        g.rotation.y += (e.clientX - prevRef.current.x) * 0.004;
        g.rotation.x = Math.max(-0.6, Math.min(0.6, g.rotation.x + (e.clientY - prevRef.current.y) * 0.004));
        prevRef.current = { x: e.clientX, y: e.clientY };
    }, []);
    const up = useCallback(() => { dragRef.current = false; }, []);

    // Touch
    const td = useCallback(e => { if (e.touches.length === 1) { dragRef.current = true; prevRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } }, []);
    const tm = useCallback(e => {
        if (!dragRef.current || !globeRef.current || e.touches.length !== 1) return;
        const t = e.touches[0], g = globeRef.current;
        g.rotation.y += (t.clientX - prevRef.current.x) * 0.004;
        g.rotation.x = Math.max(-0.6, Math.min(0.6, g.rotation.x + (t.clientY - prevRef.current.y) * 0.004));
        prevRef.current = { x: t.clientX, y: t.clientY };
    }, []);
    const tu = useCallback(() => { dragRef.current = false; }, []);

    return (
        <div style={{ position: 'relative', width: `${SIZE}px`, height: `${SIZE}px`, flexShrink: 0 }}>
            <div ref={mountRef} style={{ width: `${SIZE}px`, height: `${SIZE}px`, cursor: 'grab' }}
                 onMouseDown={dn} onMouseMove={mv} onMouseUp={up} onMouseLeave={up}
                 onTouchStart={td} onTouchMove={tm} onTouchEnd={tu}
            />

            {cards.map(c => (
                <div key={c.name} className="globe-card" style={{
                    position: 'absolute',
                    left: `${c.sx}px`, top: `${c.sy}px`,
                    transform: `translate(-50%, -115%) scale(${0.72 + c.sc * 0.28})`,
                    opacity: 0.65 + c.sc * 0.35,
                    backgroundColor: isDarkMode ? 'rgba(18,18,18,0.92)' : 'rgba(255,255,255,0.94)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '14px', padding: '0.65rem 0.8rem',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                    boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.1)',
                    pointerEvents: 'none', transition: 'opacity 0.6s ease, transform 0.6s ease',
                    whiteSpace: 'nowrap', zIndex: Math.round(c.z + 300), maxWidth: '220px',
                }}>
                    <div style={{ marginBottom: '0.15rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.78rem', color: theme.text, fontFamily: "'Poppins', sans-serif" }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.15rem' }}>
                        <MapPin size={9} color={theme.textMuted} />
                        <span style={{ fontSize: '0.63rem', color: theme.textMuted, fontFamily: "'Poppins', sans-serif" }}>{c.location}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={9} fill={s <= Math.floor(c.rating) ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                        <span style={{ fontSize: '0.58rem', color: theme.textMuted, marginLeft: '0.2rem', fontFamily: "'Poppins', sans-serif" }}>{c.rating}</span>
                    </div>
                    <div style={{ marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.58rem', color: theme.textMuted, fontFamily: "'Poppins', sans-serif", fontStyle: 'italic' }}>{c.desc}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InteractiveGlobe;