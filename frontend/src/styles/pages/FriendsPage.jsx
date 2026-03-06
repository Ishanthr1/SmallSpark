import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, X, Clock, Loader2, Mail,
  UserPlus, Send, Sparkles, ChevronRight, Heart,
  Coffee, Utensils, Dumbbell, Music, BookOpen, Car, Home, Star
} from 'lucide-react';
import { searchProfiles } from '../../lib/profiles';
import {
  listFriends, listIncomingRequests, listOutgoingRequests,
  sendFriendRequest, respondToFriendRequest, getFriendshipMap
} from '../../lib/friends';

// ─── Theme ────────────────────────────────────────────────────
const th = {
  bg: '#080808',
  bgAlt: '#0e0e0e',
  bgCard: '#111111',
  bgCardHover: '#161616',
  text: '#f0f0f0',
  textSub: '#888888',
  textMuted: '#444444',
  border: '#1e1e1e',
  borderLight: '#252525',
  accent: '#ffffff',
  accentSoft: 'rgba(255,255,255,0.08)',
  accentGlow: 'rgba(255,255,255,0.15)',
  green: '#34d399',
  greenSoft: 'rgba(52,211,153,0.12)',
  red: '#f87171',
  amber: '#fbbf24',
};

// ─── Taste category config ─────────────────────────────────────
const TASTE_CATEGORIES = [
  { key: 'restaurants', label: 'Dining', icon: Utensils, color: '#f97316' },
  { key: 'coffee', label: 'Coffee', icon: Coffee, color: '#d97706' },
  { key: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#10b981' },
  { key: 'nightlife', label: 'Nightlife', icon: Music, color: '#8b5cf6' },
  { key: 'culture', label: 'Culture', icon: BookOpen, color: '#3b82f6' },
  { key: 'automotive', label: 'Auto', icon: Car, color: '#6b7280' },
  { key: 'home', label: 'Home', icon: Home, color: '#ec4899' },
];

// ─── Mock compatibility scores (replace with real logic) ───────
function computeCompatibility(myPrefs, theirPrefs) {
  if (!myPrefs || !theirPrefs) return Math.floor(30 + Math.random() * 55);
  const keys = TASTE_CATEGORIES.map(c => c.key);
  let score = 0;
  keys.forEach(k => {
    const a = (myPrefs[k] || []);
    const b = (theirPrefs[k] || []);
    const shared = a.filter(x => b.includes(x)).length;
    const total = new Set([...a, ...b]).size;
    if (total > 0) score += shared / total;
  });
  return Math.round((score / keys.length) * 100);
}

function mockPrefs() {
  const cats = ['Italian', 'Sushi', 'Brunch', 'BBQ', 'Thai', 'Mexican'];
  const picks = cats.sort(() => Math.random() - 0.5).slice(0, 3);
  return { restaurants: picks, coffee: Math.random() > 0.5 ? ['Lattes', 'Cold Brew'] : ['Espresso'] };
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ url, name, size = 36 }) {
  if (url) return (
    <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${th.border}` }} />
  );
  const colors = ['#7c6af7','#f97316','#10b981','#3b82f6','#ec4899','#f59e0b'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}22`, border: `2px solid ${color}44`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: '700', flexShrink: 0 }}>
      {(name?.[0] || '?').toUpperCase()}
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────
function InviteModal({ uid, onClose, onSent }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errMsg, setErrMsg] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true); setStatus(null);
    try {
      const results = await searchProfiles({ query: input.trim(), excludeClerkUserId: uid });
      if (!results || results.length === 0) {
        setErrMsg('No user found with that name or email.');
        setStatus('error');
      } else {
        await sendFriendRequest(uid, results[0].clerk_user_id);
        setStatus('success');
        setTimeout(() => { onSent(); onClose(); }, 1200);
      }
    } catch (e) {
      setErrMsg(e.message || 'Something went wrong.');
      setStatus('error');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '420px', background: th.bgCard, border: `1px solid ${th.borderLight}`, borderRadius: '20px', padding: '2rem', boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px ${th.accent}22`, animation: 'modalIn 0.2s ease' }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: th.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={20} color={th.accent} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: th.text }}>Invite a Friend</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: th.textSub }}>Enter their name or email address</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: th.textMuted, padding: '0.2rem' }}><X size={18} /></button>
        </div>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Mail size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: th.textSub }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="name@email.com or username"
            value={input}
            onChange={e => { setInput(e.target.value); setStatus(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '12px', border: `1px solid ${status === 'error' ? th.red + '66' : th.borderLight}`, background: th.bgAlt, color: th.text, fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          />
        </div>

        {status === 'error' && (
          <p style={{ fontSize: '0.78rem', color: th.red, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><X size={13} />{errMsg}</p>
        )}
        {status === 'success' && (
          <p style={{ fontSize: '0.78rem', color: th.green, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Check size={13} />Request sent!</p>
        )}

        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: loading || !input.trim() ? th.bgAlt : `linear-gradient(135deg, ${th.accent}, #cccccc)`, color: loading || !input.trim() ? th.textMuted : '#000', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: '600', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Send size={15} />Send Invite</>}
        </button>
      </div>
    </div>
  );
}

// ─── Compatibility Node Card ──────────────────────────────────
function CompatNode({ friend, score, x, y, isCenter, selected, onMouseDown, isDragging }) {
  const w = isCenter ? 150 : 160;
  const h = isCenter ? 170 : 190;
  const avatarSize = isCenter ? 60 : 54;

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', left: x - w / 2, top: y - h / 2,
        width: w, height: h,
        background: isCenter
          ? 'rgba(255,255,255,0.07)'
          : selected
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isCenter || selected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '24px',
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '1rem 0.75rem 1.5rem',
        gap: '0.35rem',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        boxShadow: isDragging
          ? '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2)'
          : selected
          ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)'
          : isCenter
          ? '0 8px 40px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        transition: isDragging ? 'box-shadow 0.15s ease' : 'all 0.25s ease',
        zIndex: isDragging ? 20 : isCenter ? 10 : selected ? 5 : 1,
      }}
    >
      {/* Score badge floating above card */}
      {!isCenter && score != null && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: score >= 70 ? th.green : score >= 50 ? th.amber : '#555',
          color: score >= 70 || score >= 50 ? '#000' : '#fff',
          borderRadius: '20px', padding: '3px 11px',
          fontSize: '0.7rem', fontWeight: '800',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}>
          {score}%
        </div>
      )}

      <Avatar url={friend.avatar_url} name={friend.full_name} size={avatarSize} />

      <p style={{
        margin: '0.2rem 0 0',
        fontSize: isCenter ? '0.85rem' : '0.8rem',
        fontWeight: '700', color: th.text,
        textAlign: 'center', lineHeight: 1.2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: w - 20,
      }}>
        {friend.full_name?.split(' ')[0] || (isCenter ? 'You' : 'Friend')}
      </p>

      {!isCenter && (
        <p style={{ margin: 0, fontSize: '0.65rem', color: th.textSub, textAlign: 'center' }}>
          {score >= 70 ? 'great match' : score >= 50 ? 'good match' : 'some overlap'}
        </p>
      )}

      {/* Progress bar at bottom */}
      {!isCenter && (
        <div style={{
          position: 'absolute', bottom: 12, left: 16, right: 16,
          height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${score}%`,
            background: score >= 70 ? th.green : score >= 50 ? th.amber : 'rgba(255,255,255,0.35)',
            borderRadius: 99,
            transition: 'width 1s ease',
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Connection Line SVG ──────────────────────────────────────
function ConnectionLines({ friends, centerPos, nodePosMap, panOffset, selectedId }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
      {friends.map(f => {
        const rawPos = nodePosMap[f.clerk_user_id];
        if (!rawPos) return null;
        const pos = { x: rawPos.x + panOffset.x, y: rawPos.y + panOffset.y };
        const cx = centerPos.x;
        const cy = centerPos.y;
        const isSelected = f.clerk_user_id === selectedId;
        const dx = pos.x - cx;
        const dy = pos.y - cy;
        const cpX = (cx + pos.x) / 2 + dy * 0.15;
        const cpY = (cy + pos.y) / 2 - dx * 0.15;
        // Point at t=0.5 on quadratic bezier
        const midX = 0.25 * cx + 0.5 * cpX + 0.25 * pos.x;
        const midY = 0.25 * cy + 0.5 * cpY + 0.25 * pos.y;
        const score = f._score;
        return (
          <g key={f.clerk_user_id}>
            <path
              d={`M ${cx} ${cy} Q ${cpX} ${cpY} ${pos.x} ${pos.y}`}
              stroke={isSelected ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isSelected ? 1.5 : 1}
              fill="none"
              strokeDasharray={isSelected ? '' : '5 5'}
            />
            {score != null && !isSelected && (
              <g>
                <rect x={midX - 19} y={midY - 10} width={38} height={20} rx={10} ry={10} fill={th.bgCard} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                <text x={midX} y={midY + 4} textAnchor="middle" fontSize="10" fill={th.textSub} fontFamily="inherit" fontWeight="700">{score}%</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Friend Detail Panel ──────────────────────────────────────
function FriendDetailPanel({ friend, score, myUser, onClose }) {
  const prefs = friend._mockPrefs || {};
  const sharedCats = TASTE_CATEGORIES.filter(() => Math.random() > 0.5);

  return (
    <div style={{
      position: 'absolute', right: 16, top: 16, bottom: 16, width: '300px',
      background: th.bgCard, border: `1px solid ${th.borderLight}`,
      borderRadius: '20px', overflow: 'hidden',
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${th.accent}22`,
      animation: 'slideIn 0.22s ease',
      display: 'flex', flexDirection: 'column', zIndex: 20,
    }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>

      {/* Header */}
      <div style={{ padding: '1.25rem', borderBottom: `1px solid ${th.border}`, background: `linear-gradient(160deg, ${th.accent}0d, transparent)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Avatar url={friend.avatar_url} name={friend.full_name} size={52} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.textMuted, padding: '0.2rem' }}><X size={16} /></button>
        </div>
        <h3 style={{ margin: '0 0 0.15rem', fontSize: '1rem', fontWeight: '700', color: th.text }}>{friend.full_name || 'Friend'}</h3>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: th.textSub, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={11} />{friend.email}</p>

        {/* Compatibility meter */}
        <div style={{ background: th.bgAlt, borderRadius: '12px', padding: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: th.textSub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taste Match</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: score >= 70 ? th.green : score >= 50 ? th.amber : th.textSub }}>{score}%</span>
          </div>
          <div style={{ height: 6, background: th.border, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: score >= 70 ? `linear-gradient(90deg, ${th.green}, #6ee7b7)` : score >= 50 ? `linear-gradient(90deg, ${th.amber}, #fde68a)` : `linear-gradient(90deg, ${th.accent}, #cccccc)`, borderRadius: 99, transition: 'width 1s ease' }} />
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: th.textMuted }}>
            {score >= 70 ? '✦ You two would love exploring together!' : score >= 50 ? 'Good overlap in tastes' : 'Different tastes — new discoveries ahead!'}
          </p>
        </div>
      </div>

      {/* Taste breakdown */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', fontWeight: '600', color: th.textSub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taste Profile</p>

        {TASTE_CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          const hasMatch = Math.random() > 0.4;
          const level = Math.floor(Math.random() * 4) + 1;
          return (
            <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.7rem', borderRadius: '10px', background: hasMatch ? `${cat.color}0d` : 'transparent', border: `1px solid ${hasMatch ? cat.color + '22' : 'transparent'}`, marginBottom: '0.4rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: `${cat.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CatIcon size={14} color={cat.color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '600', color: th.text }}>{cat.label}</p>
                <div style={{ display: 'flex', gap: '2px', marginTop: '3px' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ width: 16, height: 3, borderRadius: 99, background: i <= level ? cat.color : th.border }} />
                  ))}
                </div>
              </div>
              {hasMatch && <Star size={12} color={cat.color} fill={cat.color} />}
            </div>
          );
        })}

        {/* Shared favorites hint */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '12px', background: th.accentSoft, border: `1px solid ${th.accent}22` }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: '600', color: th.accent, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Sparkles size={12} />Places you'd both enjoy</p>
          {['Local Coffee Spots', 'Weekend Brunch', 'Live Music Venues'].map(s => (
            <p key={s} style={{ margin: '0.15rem 0', fontSize: '0.72rem', color: th.textSub }}>· {s}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function FriendsPage() {
  const { user } = useUser();
  const nav = useNavigate();
  const uid = user?.id;

  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [showInvite, setShowInvite] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // ── Drag / pan state ──────────────────────────────────────
  const [nodePosMap, setNodePosMap] = useState({});   // { id: {x,y} } in world space
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState(null);
  const dragState = useRef(null);
  const initialized = useRef(false);

  // Observe canvas size
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setCanvasSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Initialize node positions once after data first loads
  useEffect(() => {
    if (loading || initialized.current || canvasSize.w < 100) return;
    initialized.current = true;
    const cx = canvasSize.w / 2;
    const cy = canvasSize.h / 2;
    const r = Math.min(canvasSize.w, canvasSize.h) * 0.38;
    const meKey = uid || '__me__';
    const init = { [meKey]: { x: cx, y: cy } };
    friends.forEach((f, i) => {
      const angle = (i / Math.max(friends.length, 1)) * 2 * Math.PI - Math.PI / 2;
      init[f.clerk_user_id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    setNodePosMap(init);
  }, [loading, friends, canvasSize, uid]);

  // Global mouse handlers for dragging nodes and panning canvas
  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
      if (dragState.current.type === 'node') {
        const { nodeId, origX, origY } = dragState.current;
        setNodePosMap(prev => ({ ...prev, [nodeId]: { x: origX + dx, y: origY + dy } }));
      } else {
        setPanOffset({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
      }
    };
    const onUp = () => {
      if (!dragState.current) return;
      const { type, nodeId, moved } = dragState.current;
      if (type === 'node' && !moved && nodeId !== (uid || '__me__')) {
        setSelectedFriend(prev => prev === nodeId ? null : nodeId);
      }
      dragState.current = null;
      setDraggingId(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [uid]);

  const handleCanvasMouseDown = (e) => {
    if (e.target !== e.currentTarget) return;
    dragState.current = { type: 'pan', startX: e.clientX, startY: e.clientY, origX: panOffset.x, origY: panOffset.y, moved: false };
    e.preventDefault();
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = nodePosMap[nodeId] || { x: 0, y: 0 };
    dragState.current = { type: 'node', nodeId, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, moved: false };
    setDraggingId(nodeId);
  };

  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const [f, inc, out] = await Promise.all([
        listFriends(uid), listIncomingRequests(uid), listOutgoingRequests(uid)
      ]);
      const enriched = f.map(fr => ({ ...fr, _mockPrefs: mockPrefs(), _score: Math.floor(35 + Math.random() * 60) }));
      setFriends(enriched); setIncoming(inc); setOutgoing(out);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [uid]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRespond = async (reqId, status) => {
    setActionLoading(p => ({ ...p, [reqId]: true }));
    try { await respondToFriendRequest(reqId, uid, status); await refresh(); } catch (e) { console.error(e); }
    setActionLoading(p => ({ ...p, [reqId]: false }));
  };

  const meKey = uid || '__me__';
  const mePos = nodePosMap[meKey] || { x: canvasSize.w / 2, y: canvasSize.h / 2 };
  const meNode = { full_name: user?.fullName || 'You', avatar_url: user?.imageUrl, clerk_user_id: meKey };
  const hasPositions = Object.keys(nodePosMap).length > 0;

  const selectedData = selectedFriend ? friends.find(f => f.clerk_user_id === selectedFriend) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Poppins',-apple-system,sans-serif", background: th.bg, color: th.text, overflow: 'hidden' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        * { scrollbar-width: thin; scrollbar-color: #1e1e1e transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 99px; }
      `}</style>

      {/* ── Left Panel ── */}
      <div style={{ width: '340px', minWidth: '280px', borderRight: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={() => nav('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.textSub, display: 'flex', padding: '0.25rem', borderRadius: '8px', transition: 'color 0.15s' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, flex: 1 }}>Friends</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {incoming.length > 0 && (
              <span style={{ fontSize: '0.68rem', fontWeight: '700', background: th.accent, color: '#000', borderRadius: '20px', padding: '2px 7px', minWidth: 20, textAlign: 'center' }}>{incoming.length}</span>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={22} color={th.textMuted} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* Incoming requests */}
          {!loading && incoming.length > 0 && (
            <div style={{ marginBottom: '1.5rem', animation: 'fadeUp 0.3s ease' }}>
              <SectionLabel label={`Requests · ${incoming.length}`} color={th.accent} />
              {incoming.map(req => (
                <FriendRow key={req.id} profile={req.profile} right={
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <IconBtn onClick={() => handleRespond(req.id, 'accepted')} loading={actionLoading[req.id]} color={th.green} title="Accept"><Check size={14} /></IconBtn>
                    <IconBtn onClick={() => handleRespond(req.id, 'rejected')} loading={actionLoading[req.id]} color={th.red} title="Decline" ghost><X size={14} /></IconBtn>
                  </div>
                } />
              ))}
            </div>
          )}

          {/* Friends */}
          {!loading && (
            <div style={{ animation: 'fadeUp 0.35s ease' }}>
              <SectionLabel label={`Your Friends · ${friends.length}`} />
              {friends.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: th.textMuted, padding: '0.75rem 0', lineHeight: 1.5 }}>
                  No friends yet — invite someone to get started!
                </p>
              )}
              {friends.map(f => (
                <FriendRow
                  key={f.clerk_user_id}
                  profile={f}
                  score={f._score}
                  selected={selectedFriend === f.clerk_user_id}
                  onClick={() => setSelectedFriend(selectedFriend === f.clerk_user_id ? null : f.clerk_user_id)}
                  right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MatchBadge score={f._score} />
                      <ChevronRight size={14} color={th.textMuted} />
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {/* Pending sent */}
          {!loading && outgoing.length > 0 && (
            <div style={{ marginTop: '1.5rem', animation: 'fadeUp 0.4s ease' }}>
              <SectionLabel label={`Pending Sent · ${outgoing.length}`} />
              {outgoing.map(req => (
                <FriendRow key={req.id} profile={req.profile} right={
                  <span style={{ fontSize: '0.68rem', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <Clock size={11} />Pending
                  </span>
                } />
              ))}
            </div>
          )}
        </div>

        {/* Invite button */}
        <div style={{ padding: '1rem', borderTop: `1px solid ${th.border}` }}>
          <button
            onClick={() => setShowInvite(true)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg, ${th.accent}, #cccccc)`, color: '#000', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: `0 4px 20px ${th.accentGlow}`, transition: 'opacity 0.2s' }}
          >
            <UserPlus size={16} /> Invite
          </button>
        </div>
      </div>

      {/* ── Right: Interactive Graph Canvas ── */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: `radial-gradient(ellipse at 50% 40%, ${th.accent}06 0%, transparent 65%)`,
          cursor: draggingId ? 'default' : 'grab',
        }}
      >
        {/* Dot grid background — fixed */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill={th.border} opacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {friends.length === 0 && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.6, pointerEvents: 'none' }}>
            <div style={{ width: 64, height: 64, borderRadius: '20px', background: th.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={28} color={th.accent} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: '600', color: th.text }}>Your taste graph awaits</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: th.textSub }}>Add friends to see how your tastes align</p>
            </div>
          </div>
        )}

        {friends.length > 0 && hasPositions && (
          <>
            {/* Curved connection lines (rendered behind nodes) */}
            <ConnectionLines
              friends={friends}
              centerPos={{ x: mePos.x + panOffset.x, y: mePos.y + panOffset.y }}
              nodePosMap={nodePosMap}
              panOffset={panOffset}
              selectedId={selectedFriend}
            />

            {/* Friend nodes */}
            {friends.map(f => {
              const pos = nodePosMap[f.clerk_user_id] || mePos;
              return (
                <CompatNode
                  key={f.clerk_user_id}
                  friend={f}
                  score={f._score}
                  x={pos.x + panOffset.x}
                  y={pos.y + panOffset.y}
                  isCenter={false}
                  selected={selectedFriend === f.clerk_user_id}
                  isDragging={draggingId === f.clerk_user_id}
                  onMouseDown={(e) => handleNodeMouseDown(e, f.clerk_user_id)}
                />
              );
            })}

            {/* Center: You */}
            <CompatNode
              friend={meNode}
              score={null}
              x={mePos.x + panOffset.x}
              y={mePos.y + panOffset.y}
              isCenter={true}
              selected={false}
              isDragging={draggingId === meKey}
              onMouseDown={(e) => handleNodeMouseDown(e, meKey)}
            />
          </>
        )}

        {/* Legend — fixed overlay */}
        {friends.length > 0 && (
          <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: '0.75rem', alignItems: 'center', pointerEvents: 'none' }}>
            {[{ color: th.green, label: '70%+ Great' }, { color: th.amber, label: '50%+ Good' }, { color: th.textSub, label: 'Some overlap' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: th.textSub }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        )}

        {/* Hint — fixed overlay */}
        {friends.length > 0 && !selectedFriend && (
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: th.bgCard, border: `1px solid ${th.borderLight}`, borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.72rem', color: th.textSub, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            <Sparkles size={11} style={{ display: 'inline', marginRight: 4 }} />Drag cards · pan canvas · click a friend to inspect
          </div>
        )}

        {/* Detail panel — fixed overlay */}
        {selectedData && (
          <FriendDetailPanel
            friend={selectedData}
            score={selectedData._score}
            myUser={user}
            onClose={() => setSelectedFriend(null)}
          />
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal uid={uid} onClose={() => setShowInvite(false)} onSent={refresh} />
      )}
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────
function SectionLabel({ label, color }) {
  return (
    <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: '600', color: color || '#44445a', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</p>
  );
}

function MatchBadge({ score }) {
  if (!score) return null;
  const color = score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#6b7280';
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: '700', color, background: `${color}18`, borderRadius: '20px', padding: '2px 7px' }}>{score}%</span>
  );
}

function FriendRow({ profile, right, onClick, selected }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.7rem', borderRadius: '12px', backgroundColor: selected ? `${th.accent}12` : hov ? th.bgCardHover : 'transparent', border: `1px solid ${selected ? th.accent + '33' : 'transparent'}`, marginBottom: '0.3rem', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s' }}
    >
      <Avatar url={profile?.avatar_url} name={profile?.full_name} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.82rem', fontWeight: '600', color: th.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Unknown'}</p>
        {profile?.email && <p style={{ fontSize: '0.68rem', color: th.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</p>}
      </div>
      {right}
    </div>
  );
}

function IconBtn({ onClick, children, color, loading, ghost, title }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      style={{ width: 28, height: 28, borderRadius: '50%', border: ghost ? `1px solid ${th.border}` : 'none', background: ghost ? 'transparent' : `${color}22`, color: ghost ? th.textMuted : color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
    >
      {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : children}
    </button>
  );
}