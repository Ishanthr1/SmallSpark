import { supabase } from './supabase';

const TABLE = 'friend_requests';
const PROFILES = 'user_profiles';

/**
 * List accepted friends for a user, with profile info.
 */
export async function listFriends(clerkUserId) {
  if (!clerkUserId) throw new Error('listFriends requires clerkUserId');

  const { data: sent, error: e1 } = await supabase
    .from(TABLE)
    .select('to_clerk_user_id')
    .eq('from_clerk_user_id', clerkUserId)
    .eq('status', 'accepted');
  if (e1) throw e1;

  const { data: received, error: e2 } = await supabase
    .from(TABLE)
    .select('from_clerk_user_id')
    .eq('to_clerk_user_id', clerkUserId)
    .eq('status', 'accepted');
  if (e2) throw e2;

  const friendIds = [
    ...(sent ?? []).map(r => r.to_clerk_user_id),
    ...(received ?? []).map(r => r.from_clerk_user_id),
  ];
  if (friendIds.length === 0) return [];

  const { data: profiles, error: e3 } = await supabase
    .from(PROFILES)
    .select('clerk_user_id, full_name, email, avatar_url')
    .in('clerk_user_id', friendIds);
  if (e3) throw e3;
  return profiles ?? [];
}

/**
 * Incoming pending friend requests (you need to accept/reject).
 */
export async function listIncomingRequests(clerkUserId) {
  if (!clerkUserId) throw new Error('listIncomingRequests requires clerkUserId');
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, from_clerk_user_id, created_at')
    .eq('to_clerk_user_id', clerkUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (!data || data.length === 0) return [];
  const ids = data.map(r => r.from_clerk_user_id);
  const { data: profiles, error: e2 } = await supabase
    .from(PROFILES)
    .select('clerk_user_id, full_name, email, avatar_url')
    .in('clerk_user_id', ids);
  if (e2) throw e2;

  const pMap = Object.fromEntries((profiles ?? []).map(p => [p.clerk_user_id, p]));
  return data.map(r => ({ ...r, profile: pMap[r.from_clerk_user_id] ?? null }));
}

/**
 * Outgoing pending friend requests (you sent, awaiting response).
 */
export async function listOutgoingRequests(clerkUserId) {
  if (!clerkUserId) throw new Error('listOutgoingRequests requires clerkUserId');
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, to_clerk_user_id, created_at')
    .eq('from_clerk_user_id', clerkUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (!data || data.length === 0) return [];
  const ids = data.map(r => r.to_clerk_user_id);
  const { data: profiles, error: e2 } = await supabase
    .from(PROFILES)
    .select('clerk_user_id, full_name, email, avatar_url')
    .in('clerk_user_id', ids);
  if (e2) throw e2;

  const pMap = Object.fromEntries((profiles ?? []).map(p => [p.clerk_user_id, p]));
  return data.map(r => ({ ...r, profile: pMap[r.to_clerk_user_id] ?? null }));
}

/**
 * Send a friend request.
 */
export async function sendFriendRequest(fromId, toId) {
  if (!fromId || !toId) throw new Error('sendFriendRequest requires fromId and toId');
  if (fromId === toId) throw new Error('Cannot send friend request to yourself');
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ from_clerk_user_id: fromId, to_clerk_user_id: toId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Accept or reject a friend request. Only the receiver can respond.
 */
export async function respondToFriendRequest(requestId, clerkUserId, status) {
  if (!requestId || !clerkUserId) throw new Error('respondToFriendRequest requires requestId and clerkUserId');
  if (status !== 'accepted' && status !== 'rejected') throw new Error('status must be accepted or rejected');
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('to_clerk_user_id', clerkUserId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get all friend request IDs involving a user (for checking duplicates in UI).
 * Returns a map: { clerkUserId: 'pending'|'accepted'|'rejected' }
 */
export async function getFriendshipMap(clerkUserId) {
  if (!clerkUserId) return {};
  const { data: sent, error: e1 } = await supabase
    .from(TABLE)
    .select('to_clerk_user_id, status')
    .eq('from_clerk_user_id', clerkUserId);
  if (e1) throw e1;

  const { data: received, error: e2 } = await supabase
    .from(TABLE)
    .select('from_clerk_user_id, status')
    .eq('to_clerk_user_id', clerkUserId);
  if (e2) throw e2;

  const map = {};
  (sent ?? []).forEach(r => { map[r.to_clerk_user_id] = r.status; });
  (received ?? []).forEach(r => { map[r.from_clerk_user_id] = r.status; });
  return map;
}
