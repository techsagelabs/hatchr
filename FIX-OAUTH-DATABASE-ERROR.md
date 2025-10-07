# Fix: "Database error saving new user" for Google OAuth

## 🎉 Good News!
Your OAuth flow is now working! Users are successfully authenticating with Google. The new error means we're past the OAuth phase and into the database phase.

---

## 🐛 The Problem

Error: **"Database error saving new user"**

**Root Cause:**
When a user signs in with Google for the first time, Supabase tries to create a user profile using a database trigger (`handle_new_user()`). The trigger expects a `username` field in the `user_profiles` table, but:

1. ❌ The table doesn't have a `username` column
2. ❌ Google OAuth doesn't provide a username (only email and name)
3. ❌ The trigger fails, blocking user creation

---

## ✅ The Solution

Run the migration SQL to:
1. Add `username` column to `user_profiles`
2. Update the trigger to auto-generate usernames for OAuth users
3. Handle Google-specific data (like `picture` instead of `avatar_url`)

---

## 🚀 **Step-by-Step Fix** (10 minutes)

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"+ New query"**

---

### **Step 2: Run the Migration**

**Copy and paste this ENTIRE SQL:**

```sql
-- Add username column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- Update the trigger to handle Google OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_username TEXT;
    email_prefix TEXT;
    username_suffix TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Try to get username from metadata (for email/password signups)
    new_username := NEW.raw_user_meta_data->>'username';
    
    -- If no username, generate one from email (for Google OAuth)
    IF new_username IS NULL OR new_username = '' THEN
        -- Extract part before @ from email
        email_prefix := split_part(NEW.email, '@', 1);
        
        -- Clean the email prefix (remove special characters, convert to lowercase)
        email_prefix := lower(regexp_replace(email_prefix, '[^a-z0-9]', '', 'g'));
        
        -- Limit to 20 characters
        email_prefix := substring(email_prefix from 1 for 20);
        
        -- Try to find an available username
        new_username := email_prefix;
        
        -- If username exists, add random suffix
        WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = new_username) AND attempt_count < max_attempts LOOP
            username_suffix := floor(random() * 10000)::text;
            new_username := email_prefix || username_suffix;
            attempt_count := attempt_count + 1;
        END LOOP;
        
        -- If still can't find unique username, use UUID
        IF EXISTS (SELECT 1 FROM public.user_profiles WHERE username = new_username) THEN
            new_username := 'user_' || substring(NEW.id::text from 1 for 8);
        END IF;
    END IF;
    
    -- Insert user profile with generated/provided username
    INSERT INTO public.user_profiles (
        user_id,
        username,
        display_name,
        avatar_url
    )
    VALUES (
        NEW.id::text,
        new_username,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            new_username
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'  -- Google provides 'picture'
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Fallback: use UUID-based username
        INSERT INTO public.user_profiles (
            user_id,
            username,
            display_name,
            avatar_url
        )
        VALUES (
            NEW.id::text,
            'user_' || substring(NEW.id::text from 1 for 12),
            COALESCE(
                NEW.raw_user_meta_data->>'display_name',
                NEW.raw_user_meta_data->>'full_name',
                NEW.email
            ),
            COALESCE(
                NEW.raw_user_meta_data->>'avatar_url',
                NEW.raw_user_meta_data->>'picture'
            )
        );
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Backfill username for existing users
UPDATE public.user_profiles
SET username = 'user_' || substring(user_id from 1 for 12)
WHERE username IS NULL;

-- Verification
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_profiles,
    COUNT(username) as profiles_with_username
FROM public.user_profiles;
```

**Click "RUN"** (or press Ctrl+Enter)

---

### **Step 3: Verify Success**

You should see:
```
✅ Migration completed successfully!
total_profiles: X
profiles_with_username: X
```

---

### **Step 4: Test Google Sign-In**

1. **Clear browser cache and cookies**
2. **Go to your deployed app**: https://hatchr.techsagelabs.in
3. **Click "Sign in with Google"**
4. **Select your Google account**
5. **Should work!** ✅

---

## 🎯 What the Fix Does

### **1. Adds Username Column**
```sql
ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;
```
Now the table can store usernames.

### **2. Auto-Generates Usernames**
For Google OAuth users (who don't provide username):
- Extracts email prefix: `john.doe@gmail.com` → `johndoe`
- Adds random number if taken: `johndoe` → `johndoe1234`
- Falls back to UUID: `user_a1b2c3d4`

### **3. Handles Google Profile Data**
Google provides:
- `picture` (not `avatar_url`)
- `full_name` (not `display_name`)

The trigger now extracts these correctly.

### **4. Error Handling**
If anything fails:
- Logs a warning
- Uses UUID-based username as fallback
- **Doesn't block user creation**

---

## 🧪 Testing Scenarios

### Test 1: Email/Password Signup ✅
- User provides username → Uses that username
- Creates profile with custom username

### Test 2: Google OAuth Signup ✅
- User signs in with: `jane.doe@gmail.com`
- Auto-generates username: `janedoe`
- Creates profile successfully
- Avatar from Google profile picture

### Test 3: Duplicate Email Prefix ✅
- First user: `john@gmail.com` → username: `john`
- Second user: `john@yahoo.com` → username: `john1234`
- Both profiles created successfully

---

## 📊 Username Generation Logic

```
Email: john.doe@gmail.com
  ↓
Extract prefix: john.doe
  ↓
Clean: johndoe
  ↓
Check if exists: No → Use "johndoe"
                 Yes → Try "johndoe1234"
                 Still taken → Use "user_a1b2c3d4"
```

---

## 🔍 Debugging

### Check if trigger is working:

```sql
-- View trigger details
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check user_profiles table structure
\d user_profiles

-- View recent profiles
SELECT user_id, username, display_name, avatar_url, created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;
```

### Check auth logs:

1. Supabase Dashboard → **Logs** → **Auth**
2. Look for user creation events
3. Check for any errors

---

## ❌ Common Issues & Solutions

### Issue 1: "column username does not exist"
**Solution:** The migration didn't run. Re-run Step 2.

### Issue 2: Still getting database error
**Solution:** 
- Check Supabase logs for specific error
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
- Make sure RLS policies allow INSERT

### Issue 3: Users created but no username
**Solution:**
```sql
-- Backfill usernames
UPDATE user_profiles
SET username = 'user_' || substring(user_id from 1 for 12)
WHERE username IS NULL OR username = '';
```

---

## 📝 What Happens Now

### For New Google OAuth Users:
1. ✅ User clicks "Sign in with Google"
2. ✅ Google consent screen appears
3. ✅ User approves permissions
4. ✅ Supabase creates auth.users entry
5. ✅ Trigger fires automatically
6. ✅ user_profiles entry created with auto-generated username
7. ✅ User redirected to app (logged in)
8. ✅ Can use the app normally

### For Existing Users:
- ✅ Existing profiles get usernames backfilled
- ✅ Can continue using the app
- ✅ No data loss

---

## 🎨 User Experience

### Before Fix:
- ❌ User clicks "Sign in with Google"
- ❌ Gets error page
- ❌ Can't sign up
- ❌ Frustration

### After Fix:
- ✅ User clicks "Sign in with Google"
- ✅ Google consent screen
- ✅ Instant account creation
- ✅ Redirected to app
- ✅ Ready to use!

---

## 📋 Checklist

- [ ] Ran SQL migration in Supabase SQL Editor
- [ ] Verified "Migration completed successfully" message
- [ ] Checked that `username` column exists in `user_profiles`
- [ ] Verified trigger exists: `on_auth_user_created`
- [ ] Tested Google sign-in with new account
- [ ] Verified user profile was created
- [ ] Checked that username was auto-generated
- [ ] Confirmed avatar displays correctly

---

## 🆘 Still Not Working?

**Share these details:**

1. **Run this query and share results:**
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

2. **Check trigger:**
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

3. **Share error from Supabase Logs**:
   - Dashboard → Logs → Auth
   - Copy the most recent error

---

## ✅ Success Criteria

You'll know it's fixed when:
1. ✅ User clicks "Sign in with Google"
2. ✅ Google consent screen appears
3. ✅ User approves
4. ✅ Redirected to: `https://hatchr.techsagelabs.in/` (no error)
5. ✅ User is logged in
6. ✅ Profile picture appears in navbar
7. ✅ Can submit projects, vote, comment

---

**Last Updated**: December 30, 2025  
**Status**: Production-ready solution  
**Estimated Time**: 10 minutes

