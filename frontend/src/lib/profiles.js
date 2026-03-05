import { supabase } from './supabase';

const TABLE = 'user_profiles';

/**
 * Upsert a Clerk user into user_profiles so they exist in Supabase.
 * Call on every sign-in (idempotent).
 */
export async function ensureProfileForUser(clerkUser) {
  if (!clerkUser?.id) throw new Error('ensureProfileForUser requires a Clerk user object');
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        clerk_user_id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        full_name: clerkUser.fullName ?? clerkUser.firstName ?? null,
        avatar_url: clerkUser.imageUrl ?? null,
      },
      { onConflict: 'clerk_user_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Search user profiles by name or email for friend discovery.
 * Excludes the current user from results.
 */
export async function searchProfiles({ query, excludeClerkUserId, limit = 20 }) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const { data, error } = await supabase
    .from(TABLE)
    .select('clerk_user_id, full_name, email, avatar_url')
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    .neq('clerk_user_id', excludeClerkUserId ?? '')
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * Get a single profile by clerk_user_id.
 */
export async function getProfile(clerkUserId) {
  if (!clerkUserId) throw new Error('getProfile requires clerkUserId');
  const { data, error } = await supabase
    .from(TABLE)
    .select('clerk_user_id, full_name, email, avatar_url')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
