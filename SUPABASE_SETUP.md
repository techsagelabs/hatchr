# Supabase Integration Setup Guide

This guide will walk you through setting up Supabase for data storage with Clerk authentication in your Takeo app.

## Prerequisites

- Existing Clerk project with authentication working
- Supabase account (free tier is fine)

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and enter project details:
   - **Name**: `takeo-innovators-place` (or your preferred name)
   - **Database Password**: Generate a secure password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be created (2-3 minutes)

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings > API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Project API Keys > anon public** (starts with `eyJ`)
   - **Project API Keys > service_role** (starts with `eyJ`) - Keep this secret!

## Step 3: Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Clerk Authentication (you should already have these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Step 4: Run Database Migrations

1. In your Supabase project dashboard, go to **SQL Editor**
2. **First, run the main migration:**
   - Copy the entire contents of `supabase-migrations.sql` file
   - Paste it into the SQL editor
   - Click "RUN" to execute the migration
   - You should see success messages for all tables, indexes, and policies created

3. **Then, set up storage for image uploads:**
   - Copy the entire contents of `supabase-storage-setup.sql` file
   - Paste it into the SQL editor
   - Click "RUN" to execute the storage setup
   - This creates the `project-assets` bucket for image uploads

4. **Finally, if needed, run the Clerk integration fix:**
   - Copy the entire contents of `supabase-clerk-integration.sql` file
   - Paste it into the SQL editor
   - Click "RUN" to ensure proper RLS policies for Clerk

## Step 5: Configure Clerk-Supabase Integration

### In Supabase Dashboard:

1. Go to **Authentication > Providers**
2. Scroll down to **Custom OAuth Provider** (or look for Clerk integration)
3. Enable it and configure:
   - **Provider Name**: `Clerk`
   - **Client ID**: Your Clerk application ID
   - **Authorization URL**: `https://your-clerk-frontend-api.clerk.accounts.dev/oauth/authorize`
   - **Token URL**: `https://your-clerk-frontend-api.clerk.accounts.dev/oauth/token`

### In Clerk Dashboard:

1. Go to **Configure > JWT Templates**
2. Click **New template**
3. Select **Supabase** from the template list, or create a custom template with:
   - **Name**: `supabase`
   - **Signing Algorithm**: `RS256`
   - **Token Lifetime**: `3600` (1 hour, or your preferred duration in seconds)
   - **Claims**:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated"
   }
   ```

   **Important**: Only include custom claims in the template. Clerk automatically manages these reserved claims:
   - `exp` (expiration time) - based on Token Lifetime setting
   - `iat` (issued at) - current timestamp
   - `iss` (issuer) - Clerk handles this
   - `sub` (subject) - automatically set to user ID
   - `nbf` (not before) - managed by Clerk
   - `jti` (JWT ID) - unique token identifier
4. Save the template

## Step 6: Verify Integration

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Test the following features:
   - ✅ Sign in with Clerk
   - ✅ Create a new project (should save to Supabase)
   - ✅ View projects list (should load from Supabase)
   - ✅ Vote on projects (should update in Supabase)
   - ✅ Add comments (should save to Supabase)

## Step 7: Verify Database in Supabase

1. Go to **Table Editor** in your Supabase dashboard
2. Check that the following tables exist:
   - `projects`
   - `comments` 
   - `votes`
3. After testing your app, you should see data appearing in these tables

## Troubleshooting

### Common Issues:

**1. "Invalid JWT" errors:**
- Ensure your JWT template in Clerk matches the expected format
- Check that the `iss` claim in JWT template matches your Supabase project URL
- Verify environment variables are correct

**2. "Row Level Security" errors (e.g., "new row violates row-level security policy"):**
- Make sure you're signed in to your app
- Check that the RLS policies were created correctly
- Verify that `auth.jwt() ->> 'sub'` matches the user ID format from Clerk
- **FIX**: If you're getting RLS errors during project creation, run the `supabase-rls-fix.sql` script in your Supabase SQL Editor

**3. "Error fetching project: {}" or UUID errors:**
- This usually happens when project IDs are undefined in navigation
- Check browser console for more detailed error messages
- Ensure projects are being created successfully before navigation

**4. Database connection errors:**
- Double-check your Supabase URL and API keys
- Ensure `.env.local` file is in the project root
- Restart your development server after adding environment variables

**5. Tables not found:**
- Make sure you ran the complete migration script
- Check the SQL Editor logs for any errors during migration
- Verify tables exist in the Table Editor

**6. Project submission fails:**
- Check that you're signed in to Clerk
- Verify your JWT template is configured correctly
- Look at browser network tab for specific error messages
- Check server console logs for detailed error information

### Debugging Tools:

1. **Supabase Logs**: Go to **Logs > Postgres Logs** to see database queries
2. **Network Tab**: Check browser dev tools for API request/response details
3. **Console Logs**: Check browser console for JavaScript errors

## Next Steps

1. **Production Setup**: When deploying, make sure to:
   - Add environment variables to your hosting platform
   - Use production Clerk keys
   - Consider upgrading Supabase plan for production workloads

2. **Data Migration**: If you had existing data, you can:
   - Export it from your old system
   - Use the Supabase SQL editor to insert it into the new tables

3. **Backup Strategy**: Set up regular backups in Supabase:
   - Go to **Settings > Backup**
   - Configure automated backups

## Security Notes

- ✅ Row Level Security (RLS) is enabled on all tables
- ✅ Users can only modify their own projects, comments, and votes
- ✅ All data access goes through authenticated API routes
- ✅ Supabase API keys are environment-specific

Your app is now fully integrated with Supabase for persistent data storage while maintaining Clerk for user authentication! 🎉
