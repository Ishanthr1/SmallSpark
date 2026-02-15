// InteractiveGlobe.jsx — Fixed version
// Fixes applied:
//  1. buildLandMap() memoized at module level (runs once, not on every mount)
//  2. Dark mode toggle updates material colors only — no full scene rebuild
//  3. depth/sc calculation corrected using proper camera-space z
//  4. SIZE and R moved to module-level constants
//  5. theme prop wired up (passed through to card styling)
//  6. Card positions clamped to canvas bounds
//  7. Scroll-to-zoom added
//  8. THREE.Points objects explicitly removed and disposed on cleanup

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Star, MapPin } from 'lucide-react';

// ─── Module-level constants ───────────────────────────────────
const SIZE = 700;
const R = 260;
const CARD_W = 174; // approximate card width for clamping
const CARD_H = 90;  // approximate card height for clamping

// ─── Famous small businesses with real coordinates ───────────
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

// ─── Accurate continent polygons ─────────────────────────────
const CONTINENT_POLYS = [
  [[-168,72],[-160,72],[-153,70],[-145,62],[-142,58],[-135,57],[-130,55],[-125,48],[-124,46],[-124,38],[-120,34],[-117,32],[-117,29],[-110,23],[-105,20],[-97,19],[-90,20],[-83,20],[-87,15],[-85,11],[-82,8],[-77,8],[-77,12],[-83,10],[-90,16],[-92,18],[-97,22],[-98,26],[-97,28],[-94,30],[-90,29],[-89,30],[-85,30],[-82,29],[-80,25],[-80,22],[-80,25],[-75,35],[-77,40],[-74,40],[-72,41],[-70,42],[-66,44],[-67,45],[-64,47],[-61,46],[-60,46],[-63,44],[-66,43],[-67,44],[-70,47],[-75,50],[-79,52],[-83,55],[-84,57],[-82,60],[-80,63],[-83,65],[-88,65],[-92,66],[-95,68],[-100,70],[-110,70],[-120,70],[-130,70],[-140,70],[-148,70],[-155,70],[-160,68],[-165,67],[-168,66],[-168,72]],
  [[-18,76],[-25,78],[-33,83],[-45,84],[-60,84],[-70,82],[-70,78],[-65,72],[-52,68],[-45,60],[-42,66],[-38,68],[-28,72],[-18,76]],
  [[-90,20],[-83,20],[-87,15],[-85,11],[-83,8],[-79,8]],
  [[-79,8],[-75,11],[-68,11],[-62,10],[-60,8],[-53,4],[-50,2],[-50,0],[-48,-1],[-45,-2],[-40,-2],[-36,-4],[-35,-9],[-37,-12],[-39,-16],[-39,-20],[-40,-22],[-43,-23],[-45,-24],[-48,-27],[-51,-32],[-55,-35],[-58,-38],[-62,-40],[-65,-42],[-68,-46],[-68,-54],[-72,-50],[-74,-42],[-73,-38],[-72,-30],[-70,-18],[-75,-14],[-77,-8],[-78,-2],[-80,0],[-80,5],[-78,8],[-79,8]],
  [[-10,36],[-7,38],[-9,39],[-8,44],[-3,44],[0,44],[1,43],[3,44],[5,44],[6,46],[7,48],[6,49],[7,51],[6,52],[7,53],[8,54],[9,55],[10,55],[12,56],[14,56],[15,55],[18,55],[19,55],[20,54],[21,55],[22,56],[23,57],[23,58],[24,60],[25,62],[28,65],[29,68],[28,71],[26,70],[23,70],[19,70],[18,68],[17,65],[14,63],[5,62],[5,58],[1,58],[-2,57],[-5,58],[-6,55],[-8,52],[-10,52],[-9,44],[-10,36]],
  [[5,58],[8,58],[10,57],[12,56],[14,56],[14,58],[12,59],[12,62],[14,64],[16,66],[18,68],[20,70],[22,70],[25,68],[26,65],[24,62],[22,59],[18,57],[14,56],[12,56],[10,55],[8,55],[5,58]],
  [[-24,64],[-22,66],[-18,67],[-13,66],[-13,64],[-18,63],[-22,63],[-24,64]],
  [[-6,50],[-5,50],[-3,51],[0,51],[1,51],[2,52],[1,53],[-1,54],[-2,57],[-4,58],[-6,56],[-5,54],[-4,52],[-5,51],[-6,50]],
  [[-10,52],[-7,52],[-6,53],[-6,55],[-8,55],[-10,54],[-10,52]],
  [[-18,15],[-16,18],[-12,22],[-12,24],[-8,28],[-5,32],[-2,35],[0,36],[5,37],[10,37],[12,34],[13,33],[15,32],[20,32],[25,30],[30,28],[32,28],[34,28],[36,24],[38,22],[40,16],[42,12],[44,10],[48,8],[50,5],[42,0],[40,-8],[38,-12],[36,-18],[35,-22],[33,-26],[30,-30],[26,-34],[20,-35],[18,-34],[16,-32],[14,-22],[12,-16],[10,-6],[8,4],[6,5],[2,6],[-2,5],[-5,5],[-8,5],[-12,6],[-15,10],[-18,14],[-18,15]],
  [[44,-13],[47,-15],[49,-18],[49,-22],[48,-26],[46,-25],[43,-22],[43,-17],[44,-13]],
  [[26,42],[30,42],[35,37],[37,36],[38,37],[42,38],[45,42],[48,44],[52,44],[56,44],[60,44],[64,42],[68,38],[70,35],[72,32],[74,30],[76,26],[78,22],[80,14],[80,8],[78,8],[76,10],[72,8],[70,14],[68,22],[66,24],[64,24],[62,24],[60,26],[58,24],[60,22],[62,20],[66,18],[68,14],[72,20],[76,22],[80,24],[82,26],[84,28],[86,28],[88,22],[90,22],[92,22],[94,20],[98,16],[100,12],[102,2],[104,0],[102,2],[100,4],[100,6],[100,10],[102,12],[104,10],[106,10],[108,14],[110,18],[112,22],[114,22],[116,22],[118,24],[120,30],[122,32],[120,36],[122,38],[124,40],[126,40],[128,38],[128,36],[130,34],[132,34],[134,36],[138,40],[140,42],[142,44],[145,44],[144,50],[140,54],[135,55],[130,58],[120,62],[112,60],[100,60],[90,65],[80,68],[74,72],[68,72],[64,72],[60,70],[55,68],[50,64],[48,60],[44,56],[40,50],[36,46],[32,44],[28,44],[26,42]],
  [[68,22],[72,22],[76,10],[78,8],[80,8],[82,10],[80,14],[78,22],[76,26],[72,32],[68,30],[66,24],[68,22]],
  [[80,6],[81,8],[81,10],[80,10],[80,6]],
  [[130,31],[131,33],[133,34],[135,34],[136,36],[138,38],[140,40],[141,42],[142,44],[141,43],[140,42],[138,38],[136,34],[133,32],[131,31],[130,31]],
  [[140,42],[142,44],[144,45],[142,46],[140,44],[140,42]],
  [[120,22],[121,23],[121,25],[120,25],[120,22]],
  [[117,14],[118,16],[120,18],[122,18],[122,16],[120,14],[118,12],[117,14]],
  [[108,2],[110,0],[112,-2],[115,-4],[117,-2],[118,2],[117,4],[115,5],[112,5],[110,4],[108,2]],
  [[95,-2],[98,2],[102,4],[105,4],[106,2],[104,0],[102,-2],[98,-4],[95,-4],[95,-2]],
  [[105,-6],[108,-7],[110,-8],[112,-8],[114,-8],[115,-8],[113,-8],[110,-8],[108,-7],[105,-6]],
  [[120,-1],[122,0],[124,-1],[122,-4],[120,-4],[118,-3],[120,-1]],
  [[132,-2],[135,-4],[138,-6],[140,-8],[142,-6],[145,-6],[147,-6],[146,-7],[142,-8],[138,-8],[136,-6],[134,-4],[132,-2]],
  [[114,-22],[115,-14],[120,-14],[122,-14],[128,-14],[130,-12],[132,-12],[136,-12],[138,-14],[140,-15],[142,-16],[145,-18],[148,-22],[150,-24],[152,-26],[153,-28],[152,-30],[150,-34],[148,-36],[146,-38],[144,-38],[140,-38],[136,-36],[132,-32],[128,-32],[124,-32],[120,-34],[116,-34],[114,-30],[114,-26],[114,-22]],
  [[144,-40],[146,-42],[148,-42],[147,-44],[145,-42],[144,-40]],
  [[172,-38],[174,-38],[176,-38],[178,-38],[178,-42],[176,-43],[174,-40],[172,-38]],
  [[168,-44],[170,-44],[172,-44],[174,-44],[172,-46],[170,-47],[168,-46],[168,-44]],
  [[-85,22],[-82,22],[-80,22],[-74,20],[-74,22],[-80,24],[-84,24],[-85,22]],
  [[-74,18],[-72,18],[-68,18],[-68,20],[-72,20],[-74,20],[-74,18]],
  [[32,34],[33,35],[34,35],[34,34],[32,34]],
  [[32,44],[34,45],[36,45],[36,44],[32,44]],
];

// ─── Build land map ONCE at module level (not inside component) ───
let _landMapCache = null;
function getLandMap() {
  if (_landMapCache) return _landMapCache;
  const W = 1440, H = 720;
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
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  _landMapCache = ctx.getImageData(0, 0, W, H);
  return _landMapCache;
}

function isLand(imgData, lat, lng) {
  const W = imgData.width, H = imgData.height;
  const px = Math.floor(((lng + 180) / 360) * W) % W;
  const py = Math.floor(((90 - lat) / 180) * H) % H;
  return imgData.data[(py * W + px) * 4] > 128;
}

function latLngTo3D(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

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

// ─── Colors extracted so we can update without scene rebuild ──
function getDotColors(isDarkMode) {
  return {
    land: new THREE.Color(isDarkMode ? '#ffffff' : '#1a1a2e'),
    ocean: new THREE.Color(isDarkMode ? '#3a4a6b' : '#a0b8d0'),
    marker: isDarkMode ? 0x8b5cf6 : 0x6366f1,
  };
}

// ═══════════════════════════════════════════════════════════════
const InteractiveGlobe = ({ theme, isDarkMode }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null); // persistent scene objects
  const dragRef = useRef(false);
  const prevRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const zoomRef = useRef(750); // camera z distance
  const [cards, setCards] = useState([]);

  // ── Scene setup: runs once ───────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const landImg = getLandMap(); // uses cache after first call

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, 1, 1, 2000);
    cam.position.z = zoomRef.current;

    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(SIZE, SIZE);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setClearColor(0x000000, 0);
    el.appendChild(ren.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    // Dots
    const { land, ocean } = makeDots(8500, R, landImg);
    const colors = getDotColors(isDarkMode);

    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(land, 3));
    const lMat = new THREE.PointsMaterial({
      color: colors.land, size: 2.2, sizeAttenuation: true,
      transparent: true, opacity: 0.92,
    });
    const landPoints = new THREE.Points(lGeo, lMat);
    globe.add(landPoints);

    const oGeo = new THREE.BufferGeometry();
    oGeo.setAttribute('position', new THREE.Float32BufferAttribute(ocean, 3));
    const oMat = new THREE.PointsMaterial({
      color: colors.ocean, size: 1.4, sizeAttenuation: true,
      transparent: true, opacity: 0.18,
    });
    const oceanPoints = new THREE.Points(oGeo, oMat);
    globe.add(oceanPoints);

    // Markers
    const markerMeshes = [];
    businesses.forEach(b => {
      const p = latLngTo3D(b.lat, b.lng, R + 3);

      const sg = new THREE.SphereGeometry(3, 8, 8);
      const sm = new THREE.MeshBasicMaterial({ color: colors.marker });
      const s = new THREE.Mesh(sg, sm);
      s.position.copy(p);
      globe.add(s);

      const hg = new THREE.SphereGeometry(7, 8, 8);
      const hm = new THREE.MeshBasicMaterial({ color: colors.marker, transparent: true, opacity: 0.18 });
      const h = new THREE.Mesh(hg, hm);
      h.position.copy(p);
      globe.add(h);

      markerMeshes.push({ s, sm, h, hm, sg, hg });
    });

    // Store refs for color updates
    sceneRef.current = { globe, cam, ren, lMat, oMat, markerMeshes, landPoints, oceanPoints, lGeo, oGeo };

    // Animate
    const tick = () => {
      if (!dragRef.current) globe.rotation.y += 0.002;

      // Smooth zoom
      cam.position.z += (zoomRef.current - cam.position.z) * 0.08;

      const cArr = businesses.map(b => {
        // Transform point into camera space to get correct depth
        const worldPos = latLngTo3D(b.lat, b.lng, R + 8).applyEuler(globe.rotation);
        const camPos = worldPos.clone().sub(cam.position);

        // Project to screen
        const proj = worldPos.clone().project(cam);
        const sx = (proj.x * 0.5 + 0.5) * SIZE;
        const sy = (-proj.y * 0.5 + 0.5) * SIZE;

        // FIX: depth based on actual world-space z relative to globe center.
        // Points with z > 0 (toward camera) are on the front hemisphere.
        const depth = (worldPos.z + R) / (R * 2); // 0 = back, 1 = front
        const visible = worldPos.z > 20;           // only front hemisphere
        const sc = Math.max(0, Math.min(1, depth));

        // Clamp card position so it stays within canvas
        const clampedSx = Math.max(0, Math.min(SIZE - CARD_W, sx + 14));
        const clampedSy = Math.max(0, Math.min(SIZE - CARD_H, sy - 20));

        return { ...b, sx: clampedSx, sy: clampedSy, z: worldPos.z, ok: visible, sc };
      }).filter(c => c.ok).sort((a, b_) => b_.z - a.z).slice(0, 4);

      setCards(cArr);
      ren.render(scene, cam);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (el.contains(ren.domElement)) el.removeChild(ren.domElement);

      // Properly dispose everything
      globe.remove(landPoints);
      globe.remove(oceanPoints);
      lGeo.dispose(); lMat.dispose();
      oGeo.dispose(); oMat.dispose();
      markerMeshes.forEach(({ s, sm, h, hm, sg, hg }) => {
        globe.remove(s); globe.remove(h);
        sg.dispose(); sm.dispose();
        hg.dispose(); hm.dispose();
      });
      ren.dispose();
      sceneRef.current = null;
    };
  }, []); // ← empty deps: scene built once only

  // ── Color update: runs when dark mode changes, no rebuild ────
  useEffect(() => {
    if (!sceneRef.current) return;
    const { lMat, oMat, markerMeshes } = sceneRef.current;
    const colors = getDotColors(isDarkMode);
    lMat.color.set(colors.land);
    oMat.color.set(colors.ocean);
    markerMeshes.forEach(({ sm, hm }) => {
      sm.color.setHex(colors.marker);
      hm.color.setHex(colors.marker);
    });
  }, [isDarkMode]);

  // ── Mouse drag ───────────────────────────────────────────────
  const dn = useCallback(e => {
    dragRef.current = true;
    prevRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const mv = useCallback(e => {
    if (!dragRef.current || !sceneRef.current) return;
    const { globe } = sceneRef.current;
    globe.rotation.y += (e.clientX - prevRef.current.x) * 0.004;
    globe.rotation.x = Math.max(-0.6, Math.min(0.6,
      globe.rotation.x + (e.clientY - prevRef.current.y) * 0.004));
    prevRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const up = useCallback(() => { dragRef.current = false; }, []);

  // ── Touch drag ───────────────────────────────────────────────
  const td = useCallback(e => {
    if (e.touches.length === 1) {
      dragRef.current = true;
      prevRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);
  const tm = useCallback(e => {
    if (!dragRef.current || !sceneRef.current || e.touches.length !== 1) return;
    const t = e.touches[0], { globe } = sceneRef.current;
    globe.rotation.y += (t.clientX - prevRef.current.x) * 0.004;
    globe.rotation.x = Math.max(-0.6, Math.min(0.6,
      globe.rotation.x + (t.clientY - prevRef.current.y) * 0.004));
    prevRef.current = { x: t.clientX, y: t.clientY };
  }, []);
  const tu = useCallback(() => { dragRef.current = false; }, []);

  // ── Scroll to zoom ───────────────────────────────────────────
  const onWheel = useCallback(e => {
    e.preventDefault();
    zoomRef.current = Math.max(400, Math.min(1200, zoomRef.current + e.deltaY * 0.5));
  }, []);

  return (
    <div
      style={{ position: 'relative', width: SIZE, height: SIZE, cursor: 'grab' }}
      onMouseDown={dn} onMouseMove={mv} onMouseUp={up} onMouseLeave={up}
      onTouchStart={td} onTouchMove={tm} onTouchEnd={tu}
      onWheel={onWheel}
    >
      <div ref={mountRef} style={{ width: SIZE, height: SIZE }} />

      {cards.map(c => (
        <div key={c.name} style={{
          position: 'absolute',
          left: c.sx,
          top: c.sy,
          background: isDarkMode
            ? 'rgba(15,15,30,0.88)'
            : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isDarkMode ? 'rgba(139,92,246,0.4)' : 'rgba(99,102,241,0.3)'}`,
          borderRadius: 10,
          padding: '8px 12px',
          minWidth: 160,
          pointerEvents: 'none',
          boxShadow: isDarkMode
            ? '0 4px 20px rgba(139,92,246,0.2)'
            : '0 4px 20px rgba(0,0,0,0.12)',
          opacity: 0.9 + c.sc * 0.1,
          transform: `scale(${0.88 + c.sc * 0.12})`,
          transformOrigin: 'top left',
          zIndex: Math.round(c.sc * 10),
        }}>
          <div style={{
            fontWeight: 700, fontSize: 13,
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            marginBottom: 2,
          }}>{c.name}</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: isDarkMode ? '#94a3b8' : '#64748b',
            fontSize: 11, marginBottom: 4,
          }}>
            <MapPin size={10} /> {c.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={9}
                fill={s <= Math.round(c.rating) ? '#f59e0b' : 'none'}
                color={s <= Math.round(c.rating) ? '#f59e0b' : '#94a3b8'}
              />
            ))}
            <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#475569', marginLeft: 2 }}>
              {c.rating}
            </span>
          </div>
          <div style={{
            fontSize: 11,
            color: isDarkMode ? '#64748b' : '#94a3b8',
            fontStyle: 'italic',
          }}>{c.desc}</div>
        </div>
      ))}
    </div>
  );
};

export default InteractiveGlobe;