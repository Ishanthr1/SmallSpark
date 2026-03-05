# Supabase setup

## 1. Where to paste your keys

Put these in **`frontend/.env`** (same file as `VITE_CLERK_PUBLISHABLE_KEY`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

- **VITE_SUPABASE_URL**: In Supabase Dashboard → **Project Settings** → **API** → **Project URL**.
- **VITE_SUPABASE_ANON_KEY**: Same page → **Project API keys** → **anon** (public). Use this one, not the `service_role` key.

Restart the dev server after changing `.env` (`npm run dev`).

## 2. Create the preferences table

In Supabase Dashboard → **SQL Editor**, click **New query**, paste the full contents of **`supabase/migrations/001_user_preferences.sql`**, then click **Run**. That creates the `user_preferences` table (taste preferences and more later) linked to your Clerk user id.

## 3. Optional: backend (Python)

To use Supabase from the Flask backend (e.g. with a service role key for admin tasks), add to **`backend/.env`**:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get the service role key from **Project Settings** → **API** → **service_role** (keep it secret, server-only).
