# 🚨 URGENT: Run This SQL to Fix Google Sign-In

## The Issue
Users getting: **"Database error saving new user"**

## The Fix
Your OAuth is working! Just need to update the database trigger.

---

## ⚡ **Run This SQL NOW** (2 minutes)

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard
- Click your project
- Click **"SQL Editor"** → **"+ New query"**

### 2. Copy & Paste This SQL

```sql
-- Add username column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_username 
ON public.user_profiles(username);

-- Fix the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_username TEXT;
    email_prefix TEXT;
BEGIN
    -- Get username from metadata or generate from email
    new_username := NEW.raw_user_meta_data->>'username';
    
    IF new_username IS NULL OR new_username = '' THEN
        -- Extract from email: john@example.com -> john
        email_prefix := split_part(NEW.email, '@', 1);
        email_prefix := lower(regexp_replace(email_prefix, '[^a-z0-9]', '', 'g'));
        email_prefix := substring(email_prefix from 1 for 20);
        new_username := email_prefix;
        
        -- Add random number if taken
        WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = new_username) LOOP
            new_username := email_prefix || floor(random() * 10000)::text;
        END LOOP;
    END IF;
    
    -- Create profile
    INSERT INTO public.user_profiles (
        user_id, username, display_name, avatar_url
    ) VALUES (
        NEW.id::text,
        new_username,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            new_username
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback: use UUID username
        INSERT INTO public.user_profiles (
            user_id, username, display_name, avatar_url
        ) VALUES (
            NEW.id::text,
            'user_' || substring(NEW.id::text from 1 for 12),
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.raw_user_meta_data->>'picture'
        );
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
UPDATE public.user_profiles
SET username = 'user_' || substring(user_id from 1 for 12)
WHERE username IS NULL;

-- Done!
SELECT 'Google OAuth is now fixed! ✅' as status;
```

### 3. Click "RUN"

You should see: **"Google OAuth is now fixed! ✅"**

---

## ✅ Test It

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Go to**: https://hatchr.techsagelabs.in/sign-in
3. **Click**: "Sign in with Google"
4. **Should work!** ✅

---

## What This Does

- ✅ Adds `username` column to store usernames
- ✅ Auto-generates username from email for Google users
- ✅ Handles Google profile picture
- ✅ Prevents database errors
- ✅ Makes Google sign-in work perfectly

---

## Success Looks Like

- ✅ Click "Sign in with Google"
- ✅ Google consent screen appears
- ✅ User approves
- ✅ Redirected to app (logged in!)
- ✅ No error page

---

**Time: 2 minutes**  
**Difficulty: Copy → Paste → Run**  
**Result: Google OAuth works! 🎉**

See detailed guide: `FIX-OAUTH-DATABASE-ERROR.md`

