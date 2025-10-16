# ⚡ Quick Fix: Profile Update 500 Error

## 🎯 **The Fix (2 Minutes)**

### **Problem:**
```
PUT /api/user/profile 500 (Internal Server Error)
```

### **Solution:**

#### **1. Run This SQL in Supabase** (1 minute)

```sql
-- Add username column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_unique 
ON user_profiles (LOWER(username));

-- Generate usernames for existing users
DO $$
DECLARE
    user_record RECORD;
    base_username TEXT;
    final_username TEXT;
    counter INTEGER;
BEGIN
    FOR user_record IN 
        SELECT id, user_id, display_name 
        FROM user_profiles 
        WHERE username IS NULL
    LOOP
        -- Create base username from display_name or user_id
        IF user_record.display_name IS NOT NULL AND user_record.display_name != '' THEN
            base_username := LOWER(REPLACE(REPLACE(user_record.display_name, ' ', ''), '.', ''));
            base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
        ELSE
            base_username := 'user_' || SUBSTRING(user_record.user_id::text FROM 1 FOR 6);
        END IF;
        
        IF LENGTH(base_username) < 3 THEN
            base_username := 'user_' || SUBSTRING(user_record.user_id::text FROM 1 FOR 6);
        END IF;
        
        IF LENGTH(base_username) > 25 THEN
            base_username := SUBSTRING(base_username FROM 1 FOR 25);
        END IF;
        
        final_username := base_username;
        counter := 1;
        
        WHILE EXISTS (SELECT 1 FROM user_profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
            final_username := base_username || '_' || counter::text;
            counter := counter + 1;
            IF counter > 999 THEN EXIT; END IF;
        END LOOP;
        
        UPDATE user_profiles 
        SET username = final_username 
        WHERE id = user_record.id;
    END LOOP;
END $$;

-- Make username NOT NULL
ALTER TABLE user_profiles 
ALTER COLUMN username SET NOT NULL;

-- Add validation constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
```

#### **2. Verify It Worked** (10 seconds)

```sql
SELECT username FROM user_profiles LIMIT 1;
```

✅ If you see a username → **SUCCESS!**

---

#### **3. Deploy Updated Code** (1 minute)

```bash
git add .
git commit -m "Fix: Improve profile update error handling"
git push
```

---

#### **4. Test It** (30 seconds)

1. Go to: https://hatchr.techsagelabs.in/profile
2. Click edit button (pencil icon)
3. Change something
4. Click "Save Changes"
5. ✅ Should work now!

---

## ✅ **Done!**

Your profile editing should now work in production.

**Total time: ~2-3 minutes**

---

## 🐛 **If Still Broken:**

Check browser console (F12) for the error code:

- `MIGRATION_REQUIRED` → Migration didn't run, try again
- `USERNAME_TAKEN` → Try a different username
- Other error → Check full guide: `FIX-PROFILE-UPDATE-500-ERROR.md`

---

## 📚 **More Info:**

- Full guide: `FIX-PROFILE-UPDATE-500-ERROR.md`
- Migration file: `add-username-to-user-profiles.sql`
- Verification: `verify-profile-features.sql`

---

**That's it! Simple fix.** ✨

