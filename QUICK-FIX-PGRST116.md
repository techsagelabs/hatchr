# ⚡ QUICK FIX: PGRST116 Error

## 🎯 The Error

```
Database update failed: Cannot coerce the result to a single JSON object (code: PGRST116)
```

**AND**

```
ERROR: 42710: constraint "username_format_check" already exists
```

---

## ✅ The Fix (3 Steps)

### **1. Run This SQL in Supabase** ⏱️ 1 minute

**File:** `fix-profile-safe-migration.sql`

**Or copy/paste this:**

```sql
-- Add username column if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'username') THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT;
    END IF;
END $$;

-- Create unique index if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_profiles_username_unique') THEN
        CREATE UNIQUE INDEX user_profiles_username_unique ON user_profiles (LOWER(username));
    END IF;
END $$;

-- Fill NULL usernames
UPDATE user_profiles 
SET username = 'user_' || SUBSTRING(user_id FROM 1 FOR 8)
WHERE username IS NULL;

-- Set NOT NULL
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;

-- Add constraint if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'username_format_check' AND conrelid = 'user_profiles'::regclass) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
    END IF;
END $$;
```

**Click RUN** ✅

---

### **2. Deploy Code** ⏱️ 1 minute

```bash
git add .
git commit -m "Fix PGRST116 error"
git push
```

---

### **3. Test** ⏱️ 30 seconds

1. Go to profile page
2. Click edit
3. Make change
4. Click save
5. ✅ Should work!

---

## 📊 What Changed

- **Code:** `.single()` → `.maybeSingle()` (handles edge cases)
- **Migration:** Now safe to run multiple times
- **Fallback:** Creates profile if missing

---

## 🔍 Debug If Still Broken

```sql
-- Check current state
SELECT COUNT(*) as total, COUNT(username) as with_username 
FROM user_profiles;

-- Should show: total = with_username
```

---

## ✅ Done!

**Total time:** ~3 minutes

**Files:**
- `fix-profile-safe-migration.sql` ← Run this
- `FIX-PGRST116-ERROR-NOW.md` ← Full guide

---

**Quick start:**
1. Supabase → SQL Editor
2. Paste SQL above
3. Click RUN
4. Deploy code
5. Test!

🎉

