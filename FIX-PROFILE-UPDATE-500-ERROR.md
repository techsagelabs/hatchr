# 🔧 Fix Profile Update 500 Error

## ⚠️ **Problem**

When trying to update your profile in **production**, you get:

```
PUT https://hatchr.techsagelabs.in/api/user/profile 500 (Internal Server Error)
```

---

## 🎯 **Root Cause**

The `username` column **does not exist** in your production database's `user_profiles` table.

Your local database might have it, but production doesn't (yet).

---

## ✅ **Solution (3 Steps)**

### **Step 1: Run the Migration in Supabase** 🗄️

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Go to SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **+ New Query**

3. **Copy the Migration SQL**
   - Open: `add-username-to-user-profiles.sql` in your project
   - Copy the **entire contents**

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click **Run** (or press F5)
   - ✅ You should see: "Success. No rows returned"

---

### **Step 2: Verify the Migration** ✅

Run this in the SQL Editor to verify:

```sql
-- Check if username column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name = 'username';
```

**Expected output:**
```
column_name | data_type | is_nullable
------------|-----------|------------
username    | text      | NO
```

If you see a row, ✅ **SUCCESS!**

---

### **Step 3: Deploy the Fixed Code** 🚀

```bash
# 1. Commit the error handling improvements
git add .
git commit -m "Fix: Improve error handling for profile updates"

# 2. Push to production
git push

# Wait for Vercel to deploy (check dashboard)
```

---

## 🧪 **Test After Deployment**

### **Test 1: Check Logs**

1. Go to your profile: https://hatchr.techsagelabs.in/profile
2. Click the edit button (pencil icon)
3. Make a change (e.g., update your bio)
4. Click "Save Changes"
5. Open browser console (F12)
6. Look for logs:
   ```
   🔄 Sending profile update request...
   ✅ Profile updated successfully
   ```

### **Test 2: Verify Update**

1. After saving, refresh the page
2. Your changes should be visible
3. ✅ **SUCCESS!**

---

## 📊 **What the Migration Does**

```sql
-- 1. Adds username column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Creates unique index (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_unique 
ON user_profiles (LOWER(username));

-- 3. Migrates existing data
-- Converts display_name values to valid usernames
-- Ensures uniqueness by appending numbers if needed

-- 4. Makes username NOT NULL
ALTER TABLE user_profiles 
ALTER COLUMN username SET NOT NULL;

-- 5. Adds validation constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
```

---

## 🔍 **Debug Logs (What You'll See)**

### **Before Migration (Error):**
```
❌ Error in PUT /api/user/profile:
Error: column "username" does not exist
⚠️ Username column does not exist in production database
```

### **After Migration (Success):**
```
🔄 Updating profile for user: abc-123-def
🔍 Checking if username column exists...
✅ Username column exists
💾 Attempting to update database with: {...}
✅ Profile updated successfully: xyz-789
```

---

## 🐛 **Troubleshooting**

### **Problem: Migration fails with "relation does not exist"**

**Solution:**
- Make sure you selected the **correct project** in Supabase
- Check that you're in the **production** database, not staging

### **Problem: "username already exists" error**

**Solution:**
- This means the migration ran before
- Check if the column exists:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'user_profiles' AND column_name = 'username';
  ```
- If it returns a row, the migration already ran ✅

### **Problem: "duplicate key value violates unique constraint"**

**Solution:**
- Some users have duplicate usernames
- Run this to find duplicates:
  ```sql
  SELECT username, COUNT(*) 
  FROM user_profiles 
  WHERE username IS NOT NULL
  GROUP BY username 
  HAVING COUNT(*) > 1;
  ```
- Manually fix duplicates by updating one of them:
  ```sql
  UPDATE user_profiles 
  SET username = 'unique_username_here'
  WHERE id = 'user_id_here';
  ```

### **Problem: Still getting 500 error after migration**

**Solution:**
1. Check Vercel logs:
   - Go to Vercel Dashboard
   - Click your project
   - Go to **Functions** or **Logs**
   - Look for the error details

2. Check Supabase logs:
   - Go to Supabase Dashboard
   - Click **Logs** → **API**
   - Filter by status: 500
   - Look for the specific error

3. Check browser console for detailed error:
   - Open browser DevTools (F12)
   - Go to **Console** tab
   - Look for the error object with code and details

---

## 📚 **Related Files**

| File | Purpose |
|------|---------|
| `add-username-to-user-profiles.sql` | Migration script (run this!) |
| `verify-profile-features.sql` | Verification script |
| `app/api/user/profile/route.ts` | API endpoint (improved error handling) |
| `lib/user-profiles.ts` | Database functions (better logging) |
| `components/profile-edit-modal.tsx` | UI (helpful error messages) |

---

## ✅ **Success Checklist**

- [ ] Ran migration in Supabase SQL Editor
- [ ] Verified `username` column exists (query returned a row)
- [ ] Deployed updated code to production
- [ ] Tested profile update in production
- [ ] No more 500 errors
- [ ] Profile updates save successfully
- [ ] Browser console shows ✅ success logs

---

## 🎉 **After Fix**

Once the migration is complete and code is deployed:

1. ✅ Profile updates work in production
2. ✅ Clear error messages if something fails
3. ✅ Detailed logs for debugging
4. ✅ Username validation enforced
5. ✅ All profile fields editable (username, bio, image, links)

---

## 📞 **Still Having Issues?**

### **Check Server Logs:**

**Vercel (Functions):**
```bash
# Go to: https://vercel.com/dashboard
# Select your project
# Click "Functions" or "Logs"
# Look for errors around the time you tried to update
```

**Supabase (API Logs):**
```bash
# Go to: https://supabase.com/dashboard
# Select your project
# Click "Logs" → "API"
# Filter by: Status 500
# Look for the error details
```

### **Debug Queries:**

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'username';

-- Check current user profiles
SELECT id, user_id, username, display_name 
FROM user_profiles 
LIMIT 5;

-- Check for NULL usernames
SELECT COUNT(*) FROM user_profiles WHERE username IS NULL;

-- Check for duplicate usernames
SELECT username, COUNT(*) 
FROM user_profiles 
GROUP BY username 
HAVING COUNT(*) > 1;
```

---

## 🚀 **Quick Fix Script**

If you want to do everything in one go:

```bash
# 1. Copy the migration SQL
cat add-username-to-user-profiles.sql | pbcopy

# 2. Run in Supabase SQL Editor (paste and run)

# 3. Verify
# Run: SELECT username FROM user_profiles LIMIT 1;

# 4. Deploy
git add .
git commit -m "Fix: Add username column and improve error handling"
git push

# 5. Wait for Vercel deployment

# 6. Test at: https://hatchr.techsagelabs.in/profile
```

---

## 📝 **Summary**

| Step | Action | Time | Status |
|------|--------|------|--------|
| 1 | Run migration in Supabase | 30 sec | ⏳ |
| 2 | Verify column exists | 10 sec | ⏳ |
| 3 | Deploy code to Vercel | 2 min | ⏳ |
| 4 | Test profile update | 30 sec | ⏳ |
| 5 | ✅ Done! | - | ⏳ |

---

**Total estimated time: ~3-5 minutes** ⏱️

**Difficulty: Easy** ⭐

**Risk: Low** (migration is safe and reversible)

---

## 🎯 **Expected Result**

**Before Fix:**
```
❌ 500 Internal Server Error
❌ Profile update fails
❌ No helpful error message
```

**After Fix:**
```
✅ Profile updates successfully
✅ Clear error messages if validation fails
✅ Detailed logs for debugging
✅ Username uniqueness enforced
```

---

**Ready? Let's fix this! 🚀**

1. Open Supabase Dashboard
2. Run the migration
3. Deploy the code
4. Test it out

You'll be updating profiles in no time! ✨

