import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, UserPlus, Check, X, Users, Clock, Loader2, Mail
} from 'lucide-react';
import { searchProfiles } from '../../lib/profiles';
import {
  listFriends, listIncomingRequests, listOutgoingRequests,
  sendFriendRequest, respondToFriendRequest, getFriendshipMap
} from '../../lib/friends';

const light = {bg:'#fff',bgAlt:'#f9f9f9',text:'#1a1a1a',textSecondary:'#555',textMuted:'#999',border:'#e8e8e8',cardBg:'#fff',accent:'#1a1a1a',accentText:'#fff',hoverBg:'#f0f0f0',inputBg:'#f5f5f5',badgeBg:'#f0f0f0'};
const dark = {bg:'#0a0a0a',bgAlt:'#0f0f0f',text:'#f0f0f0',textSecondary:'#aaa',textMuted:'#666',border:'#222',cardBg:'#141414',accent:'#f0f0f0',accentText:'#0a0a0a',hoverBg:'#1a1a1a',inputBg:'#141414',badgeBg:'#1e1e1e'};

function Avatar({ url, name, size = 36, th }) {
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: th.badgeBg, color: th.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: '600', flexShrink: 0 }}>
      {(name?.[0] || '?').toUpperCase()}
    </div>
  );
}

function ProfileRow({ profile, th, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.65rem 0.8rem', borderRadius: '10px', backgroundColor: th.cardBg, border: `1px solid ${th.border}`, marginBottom: '0.5rem' }}>
      <Avatar url={profile?.avatar_url} name={profile?.full_name} th={th} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.88rem', fontWeight: '600', color: th.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Unknown'}</p>
        {profile?.email && <p style={{ fontSize: '0.72rem', color: th.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={11} />{profile.email}</p>}
      </div>
      {right}
    </div>
  );
}

const _s = document.createElement('style');
_s.textContent = `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
if (!document.querySelector('style[data-friends-spin]')) { _s.setAttribute('data-friends-spin', ''); document.head.appendChild(_s); }

export default function FriendsPage() {
  const { user } = useUser();
  const nav = useNavigate();
  const uid = user?.id;
  const th = dark;

  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friendMap, setFriendMap] = useState({});

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const [f, inc, out, fmap] = await Promise.all([
        listFriends(uid), listIncomingRequests(uid), listOutgoingRequests(uid), getFriendshipMap(uid)
      ]);
      setFriends(f); setIncoming(inc); setOutgoing(out); setFriendMap(fmap);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [uid]);

  useEffect(() => { refresh(); }, [refresh]);

  const doSearch = async () => {
    if (!query.trim() || query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const r = await searchProfiles({ query, excludeClerkUserId: uid });
      setResults(r);
    } catch (e) { console.error(e); }
    setSearching(false);
  };

  useEffect(() => {
    const t = setTimeout(doSearch, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleSend = async (toId) => {
    setActionLoading(p => ({ ...p, [toId]: true }));
    try { await sendFriendRequest(uid, toId); await refresh(); } catch (e) { console.error(e); }
    setActionLoading(p => ({ ...p, [toId]: false }));
  };

  const handleRespond = async (reqId, status) => {
    setActionLoading(p => ({ ...p, [reqId]: true }));
    try { await respondToFriendRequest(reqId, uid, status); await refresh(); } catch (e) { console.error(e); }
    setActionLoading(p => ({ ...p, [reqId]: false }));
  };

  const statusOf = (clerkId) => friendMap[clerkId];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Poppins',-apple-system,sans-serif", backgroundColor: th.bg, color: th.text }}>

      {/* Left panel: friends + requests */}
      <div style={{ width: '380px', minWidth: '320px', borderRight: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.2rem', borderBottom: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={() => nav('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.textMuted, display: 'flex', padding: '0.2rem' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Friends</h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.2rem' }}>
          {loading && <div style={{ textAlign: 'center', padding: '2rem', color: th.textMuted }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>}

          {!loading && incoming.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '600', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Friend Requests ({incoming.length})</h3>
              {incoming.map(req => (
                <ProfileRow key={req.id} profile={req.profile} th={th} right={
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button disabled={actionLoading[req.id]} onClick={() => handleRespond(req.id, 'accepted')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                    <button disabled={actionLoading[req.id]} onClick={() => handleRespond(req.id, 'rejected')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${th.border}`, backgroundColor: 'transparent', color: th.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                  </div>
                } />
              ))}
            </div>
          )}

          {!loading && (
            <div>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '600', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Your Friends ({friends.length})</h3>
              {friends.length === 0 && <p style={{ fontSize: '0.82rem', color: th.textMuted, padding: '1rem 0' }}>No friends yet. Search for people to connect with!</p>}
              {friends.map(f => <ProfileRow key={f.clerk_user_id} profile={f} th={th} />)}
            </div>
          )}

          {!loading && outgoing.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '600', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Pending Sent ({outgoing.length})</h3>
              {outgoing.map(req => (
                <ProfileRow key={req.id} profile={req.profile} th={th} right={
                  <span style={{ fontSize: '0.7rem', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}><Clock size={12} />Pending</span>
                } />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: search / discover */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${th.border}` }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.7rem' }}>Discover People</h2>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: th.textMuted }} />
            <input
              type="text" placeholder="Search by name or email..." value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '10px', border: `1px solid ${th.border}`, backgroundColor: th.inputBg, color: th.text, fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {searching && <div style={{ textAlign: 'center', padding: '2rem', color: th.textMuted }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p style={{ color: th.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No users found for "{query}"</p>
          )}

          {!searching && results.map(p => {
            const st = statusOf(p.clerk_user_id);
            const isFriend = st === 'accepted';
            const isPending = st === 'pending';
            return (
              <ProfileRow key={p.clerk_user_id} profile={p} th={th} right={
                isFriend
                  ? <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}><Check size={14} />Friends</span>
                  : isPending
                    ? <span style={{ fontSize: '0.72rem', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}><Clock size={12} />Pending</span>
                    : <button
                        disabled={actionLoading[p.clerk_user_id]}
                        onClick={() => handleSend(p.clerk_user_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.7rem', borderRadius: '8px', border: 'none', backgroundColor: th.accent, color: th.accentText, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontSize: '0.76rem', fontWeight: '600', flexShrink: 0 }}
                      ><UserPlus size={14} />Add</button>
              } />
            );
          })}

          {!searching && query.trim().length < 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem', textAlign: 'center' }}>
              <Users size={44} color={th.textMuted} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: th.text, marginBottom: '0.3rem' }}>Find Friends</h2>
              <p style={{ fontSize: '0.85rem', color: th.textMuted }}>Search by name or email to discover people</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
