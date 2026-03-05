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

const FAVORITES_KEY = 'favorites';

/**
 * Get saved favorite businesses for a Clerk user.
 * @param {string} clerkUserId - From useUser().id
 * @returns {Promise<Array<object>>} Array of business objects (or [] if none)
 */
export async function getFavorites(clerkUserId) {
  if (!clerkUserId) return [];
  const row = await getPreferences(clerkUserId);
  const list = row?.preferences?.[FAVORITES_KEY];
  return Array.isArray(list) ? list : [];
}

/**
 * Save favorite businesses for a Clerk user.
 * @param {string} clerkUserId - From useUser().id
 * @param {Array<object>} favorites - Array of business objects to save
 * @returns {Promise<object>} Updated preferences from Supabase
 */
export async function setFavorites(clerkUserId, favorites) {
  if (!clerkUserId) throw new Error('setFavorites requires clerkUserId');
  if (!Array.isArray(favorites)) throw new Error('setFavorites requires an array');
  return setPreferences(clerkUserId, { [FAVORITES_KEY]: favorites });
}

const REVIEWS_KEY = 'reviews';

/**
 * Get saved reviews written by the user (each has businessId, businessName, rating, text, date, id).
 * @param {string} clerkUserId - From useUser().id
 * @returns {Promise<Array<object>>} Array of review objects (or [] if none)
 */
export async function getReviews(clerkUserId) {
  if (!clerkUserId) return [];
  const row = await getPreferences(clerkUserId);
  const list = row?.preferences?.[REVIEWS_KEY];
  return Array.isArray(list) ? list : [];
}

/**
 * Add a review and persist to preferences.
 * @param {string} clerkUserId - From useUser().id
 * @param {object} review - { businessId, businessName, rating, text, date, id }
 * @returns {Promise<object>} Updated preferences from Supabase
 */
export async function addReview(clerkUserId, review) {
  if (!clerkUserId) throw new Error('addReview requires clerkUserId');
  if (!review || typeof review !== 'object') throw new Error('addReview requires a review object');
  const existing = await getReviews(clerkUserId);
  const next = [review, ...existing];
  return setPreferences(clerkUserId, { [REVIEWS_KEY]: next });
}
