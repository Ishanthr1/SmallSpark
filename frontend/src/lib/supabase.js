import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env (see SUPABASE_SETUP.md).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
