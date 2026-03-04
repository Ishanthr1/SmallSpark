import { supabase } from './supabase';

const TABLE = 'user_preferences';

// Usage: get clerk user id from useUser() in your component, then:
//   const prefs = await getPreferences(user.id);
//   await setPreferences(user.id, { cuisines: ['Italian'], radius: 5000 });

/**
 * Get taste preferences (and any other stored user data) for a Clerk user.
 * @param {string} clerkUserId - From useUser().id
 * @returns {Promise<{ preferences: object } | null>} Row or null if no row exists
 */
export async function getPreferences(clerkUserId) {
  if (!clerkUserId) throw new Error('getPreferences requires clerkUserId');
  const { data, error } = await supabase
    .from(TABLE)
    .select('preferences')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Set taste preferences for a Clerk user. Merges with existing preferences.
 * @param {string} clerkUserId - From useUser().id
 * @param {object} preferences - Object to merge (e.g. { cuisines: [], radius: 5000 })
 * @returns {Promise<{ preferences: object }>} Updated row from Supabase
 */
export async function setPreferences(clerkUserId, preferences) {
  if (!clerkUserId) throw new Error('setPreferences requires clerkUserId');
  if (typeof preferences !== 'object' || preferences === null) throw new Error('setPreferences requires a preferences object');
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select('preferences')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const merged = { ...(existing?.preferences ?? {}), ...preferences };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      { clerk_user_id: clerkUserId, preferences: merged },
      { onConflict: 'clerk_user_id' }
    )
    .select('preferences')
    .single();

  if (error) throw error;
  return data;
}
