# 🚨 FIX: "Cannot coerce the result to a single JSON object (code: PGRST116)"

## ⚠️ **The Error You're Seeing:**

```
Failed to update profile:
Database update failed: Cannot coerce the result to a single JSON object (code: PGRST116)
Details: Check server logs for more information
```

**AND when running the old migration:**
```
ERROR: 42710: constraint "username_format_check" for relation "user_profiles" already exists
```

---

## 🎯 **What This Means**

1. **The migration was partially run before** (constraint exists)
2. **But something is incomplete** (causing update to fail)
3. **The PGRST116 error** means the query returned unexpected results (0 rows or multiple rows)

---

## ✅ **THE FIX (3 Steps - 3 Minutes)**

### **STEP 1: Diagnose the Issue** ⏱️ 30 seconds

Run this in **Supabase SQL Editor**:

**Copy from:** `diagnose-profile-issue.sql`

Or run this:

```sql
-- Check if username column exists and its state
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND column_name = 'username';

-- Check for NULL usernames
SELECT 
    COUNT(*) as total_users,
    COUNT(username) as users_with_username,
    COUNT(*) - COUNT(username) as users_without_username
FROM user_profiles;

-- Show your current profile
SELECT id, user_id, username, display_name 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

**Look at the results:**
- ✅ Does `username` column exist?
- ❌ Are there any NULL usernames?
- ❌ Is `is_nullable` = YES?

---

### **STEP 2: Run the Safe Migration** ⏱️ 1 minute

This migration **won't fail** if things already exist!

**Copy from:** `fix-profile-safe-migration.sql`

**Paste into Supabase SQL Editor → Click RUN**

**What it does:**
- ✅ Adds username column (if missing)
- ✅ Creates unique index (if missing)
- ✅ Fills NULL usernames with auto-generated ones
- ✅ Sets NOT NULL constraint
- ✅ Adds validation constraint (skips if exists)
- ✅ Shows you the results

**Expected output:**
```
ℹ️  Username column already exists
ℹ️  Unique index already exists
🔄 Migrating users with NULL usernames...
  ✅ Updated user xyz with username: john_doe
✅ Migration complete
✅ Set username to NOT NULL
ℹ️  Username format constraint already exists
✅ All 5 users have usernames
```

---

### **STEP 3: Deploy Fixed Code** ⏱️ 1 minute

```bash
cd "C:\programming-files\Innovator's Place\Takeo-1"

# Pull latest code first (if working in a team)
git pull

# Add changes
git add .

# Commit with clear message
git commit -m "Fix: Handle PGRST116 error and improve profile update logic"

# Push to deploy
git push
```

**Wait for Vercel deployment** (check dashboard for green checkmark)

---

### **STEP 4: Test It** ⏱️ 30 seconds

1. **Go to:** https://hatchr.techsagelabs.in/profile
2. **Open browser console** (F12)
3. **Click edit button** (pencil icon)
4. **Make a change** (update bio or website)
5. **Click "Save Changes"**
6. **Look for:**
   - Console: `✅ Profile updated successfully`
   - Alert closes
   - Changes appear on page

---

## 🔍 **What Changed in the Code**

### **Before:**
```typescript
.single()  // Throws PGRST116 if result is unexpected
```

### **After:**
```typescript
.maybeSingle()  // Handles 0 rows gracefully
```

### **Added Fallback:**
```typescript
if (!profile) {
  // If no profile exists, create one
  const newProfile = await createOrUpdateUserProfile(...)
  return newProfile
}
```

---

## 📊 **Migration Comparison**

| Old Migration | New Safe Migration |
|---------------|-------------------|
| ❌ Fails if constraint exists | ✅ Checks before creating |
| ❌ No status messages | ✅ Clear progress indicators |
| ❌ All-or-nothing | ✅ Idempotent (run multiple times) |
| ❌ Hard to debug | ✅ Shows what it's doing |

---

## 🐛 **Troubleshooting**

### **Problem: Still getting PGRST116 error**

**Check:**
1. **Multiple profiles for same user?**
   ```sql
   SELECT user_id, COUNT(*) 
   FROM user_profiles 
   GROUP BY user_id 
   HAVING COUNT(*) > 1;
   ```
   
   **If you see duplicates:**
   ```sql
   -- Keep newest, delete older duplicates
   DELETE FROM user_profiles 
   WHERE id NOT IN (
     SELECT DISTINCT ON (user_id) id 
     FROM user_profiles 
     ORDER BY user_id, created_at DESC
   );
   ```

2. **RLS policy blocking the update?**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```
   
   Make sure you have:
   ```sql
   CREATE POLICY "Users can update their own profile" ON user_profiles
   FOR UPDATE USING (
       (auth.jwt() ->> 'sub') = user_id
   );
   ```

3. **Check Vercel logs:**
   - Go to: https://vercel.com/dashboard
   - Click your project → Logs
   - Look for the update request
   - Check error details

---

### **Problem: Migration says "⚠️ Cannot set NOT NULL"**

**Solution:**
```sql
-- Find users with NULL username
SELECT id, user_id, display_name 
FROM user_profiles 
WHERE username IS NULL;

-- Manually set username for those users
UPDATE user_profiles 
SET username = 'temp_user_' || SUBSTRING(user_id FROM 1 FOR 8)
WHERE username IS NULL;

-- Run the safe migration again
```

---

### **Problem: "Username format constraint" error persists**

**Solution:**
```sql
-- Drop the existing constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS username_format_check;

-- Run the safe migration again
-- It will recreate the constraint properly
```

---

## ✅ **Success Checklist**

- [ ] Ran `diagnose-profile-issue.sql` - saw current state
- [ ] Ran `fix-profile-safe-migration.sql` - saw ✅ success messages
- [ ] All users have usernames (no NULLs)
- [ ] Username column is NOT NULL
- [ ] Committed and pushed code changes
- [ ] Vercel deployment completed (green checkmark)
- [ ] Tested profile update on production
- [ ] Saw ✅ success message in console
- [ ] Profile changes saved and visible

---

## 📁 **Files Changed**

| File | Change | Why |
|------|--------|-----|
| `lib/user-profiles.ts` | `.single()` → `.maybeSingle()` | Prevents PGRST116 error |
| `lib/user-profiles.ts` | Added fallback to create profile | Handles missing profile case |
| `fix-profile-safe-migration.sql` | **NEW** | Safe, idempotent migration |
| `diagnose-profile-issue.sql` | **NEW** | Debug queries |

---

## 🎯 **Expected Behavior After Fix**

### **Before:**
```
❌ 500 Internal Server Error
❌ PGRST116 error
❌ Migration fails if run twice
❌ No clear error messages
```

### **After:**
```
✅ Profile updates successfully
✅ Creates profile if missing
✅ Migration can run multiple times
✅ Clear progress indicators
✅ Detailed error logging
```

---

## ⏱️ **Total Time**

| Step | Time |
|------|------|
| Diagnose | 30 sec |
| Run safe migration | 1 min |
| Deploy code | 1 min |
| Test | 30 sec |
| **TOTAL** | **3 minutes** |

---

## 🚀 **Quick Commands**

```bash
# 1. Go to Supabase Dashboard
# 2. SQL Editor → New Query
# 3. Paste contents of: fix-profile-safe-migration.sql
# 4. Click RUN
# 5. Wait for ✅ success messages

# 6. In your terminal:
cd "C:\programming-files\Innovator's Place\Takeo-1"
git add .
git commit -m "Fix: Handle PGRST116 error - use maybeSingle() and add fallback"
git push

# 7. Wait for Vercel deploy
# 8. Test at: https://hatchr.techsagelabs.in/profile
```

---

## 💡 **Why This Happened**

1. **The old migration ran partially** - constraint was created
2. **But was interrupted** - some usernames might be NULL
3. **Running it again failed** - constraint already exists
4. **Update query expects 1 row** - but returns 0 or multiple
5. **PGRST116 error thrown** - cannot parse result

**The fix:**
- ✅ Safe migration checks before creating
- ✅ `.maybeSingle()` handles edge cases
- ✅ Fallback creates profile if missing
- ✅ Better error handling throughout

---

## 📞 **Still Having Issues?**

### **Check Server Logs:**

**Vercel:**
```
Dashboard → Your Project → Functions → Logs
Look for: PUT /api/user/profile
```

**Supabase:**
```
Dashboard → Logs → API
Filter: Status 500
```

**Browser Console:**
```
F12 → Console tab
Look for: ❌ Error messages with details
```

---

## ✨ **Success Indicators**

You'll know it's fixed when you see:

**In Supabase SQL Editor:**
```
✅ All 5 users have usernames
```

**In Browser Console:**
```
🔄 Updating profile for user: abc-123
🔍 Checking if username column exists...
✅ Username column exists
💾 Attempting to update database
✅ Profile updated successfully
```

**In the App:**
```
[Profile Edit Modal closes]
[Changes visible on page]
[No error messages]
```

---

**Ready? Let's fix this once and for all!** 🚀

**Start with:** `diagnose-profile-issue.sql` to see what's wrong  
**Then run:** `fix-profile-safe-migration.sql` to fix it  
**Finally:** Deploy the code and test!

**Total time: 3 minutes** ⏱️

