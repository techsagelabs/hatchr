# 🚨 URGENT: Fix Video Upload Error

## The Problem
You're getting: **"mime type video/mp4 is not supported"**

## The Cause
Your Supabase Storage bucket is **not configured** to accept video files.

## The Fix (3 Simple Steps)

### ⚠️ **STEP 1: Open Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Click on your **Takeo-1** project (or whatever your project is named)
3. You should see the project overview

---

### ⚠️ **STEP 2: Run This SQL**

1. In the left sidebar, click **"SQL Editor"**
2. Click the **"+ New query"** button
3. **Copy and paste this ENTIRE code block:**

```sql
-- Check current configuration (you'll see the problem)
SELECT 
  id,
  name,
  allowed_mime_types,
  file_size_limit
FROM storage.buckets 
WHERE id = 'project-assets';

-- FIX IT: Allow video uploads
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/*', 'video/*']
WHERE id = 'project-assets';

-- Increase file size limit to 50MB for videos
UPDATE storage.buckets 
SET file_size_limit = 52428800
WHERE id = 'project-assets';

-- Verify the fix worked
SELECT 
  id,
  name,
  allowed_mime_types,
  file_size_limit
FROM storage.buckets 
WHERE id = 'project-assets';
```

4. Click the **"RUN"** button (or press Ctrl+Enter)

5. **Check the results:**
   - You should see 4 result tables
   - The last table should show:
     - `allowed_mime_types: {image/*,video/*}` ✅
     - `file_size_limit: 52428800` ✅

---

### ⚠️ **STEP 3: Test the Fix**

1. **Go back to your application**
2. **Refresh the page** (Ctrl+R or F5)
3. **Try uploading a video again**
4. **Open browser console** (F12) to see detailed logs:
   - Look for: `📤 Starting upload:` 
   - Should see: `✅ Upload successful:`
   - Should see: `✅ Got public URL:`

---

## 🔍 Troubleshooting

### If Step 2 (SQL) didn't work:

**Option A: Check the bucket name**

Maybe your bucket isn't called `project-assets`. Run this to see all buckets:

```sql
SELECT id, name FROM storage.buckets;
```

If you see a different bucket name, replace `project-assets` with your actual bucket name in the UPDATE queries above.

---

**Option B: Try the UI method**

If SQL doesn't work, try updating via the UI:

1. Go to **Storage** (left sidebar)
2. Find the **project-assets** bucket
3. Click the **⋮** (three dots) next to the bucket name
4. Click **"Edit bucket"**
5. Find the **"Allowed MIME types"** field
6. Enter: `image/*, video/*`
7. Update **"File size limit"** to: `52428800` (or 50 MB)
8. Click **"Save"**

---

### If it STILL doesn't work:

**Share these details with me:**

1. **What did the first SQL query show?**
   - Copy the `allowed_mime_types` value

2. **What error do you see in browser console?**
   - Open console (F12)
   - Try uploading
   - Look for the `❌ Upload failed:` log
   - Copy the entire error message

3. **What does this SQL return?**
   ```sql
   SELECT * FROM storage.buckets;
   ```

---

## 📸 Screenshots to Help

### Step 2.1 - SQL Editor Location
![SQL Editor](https://supabase.com/docs/img/guides/database/sql-editor.png)

### Step 2.4 - What Success Looks Like
After running the SQL, you should see in the **last result table**:

```
| id            | name          | allowed_mime_types         | file_size_limit |
|---------------|---------------|----------------------------|-----------------|
| project-assets| project-assets| {image/*,video/*}          | 52428800        |
```

---

## ✅ Success Checklist

- [ ] Opened Supabase Dashboard
- [ ] Went to SQL Editor
- [ ] Pasted and ran the SQL code
- [ ] Saw "Success" or row count in results
- [ ] Verified `allowed_mime_types` includes `video/*`
- [ ] Verified `file_size_limit` is 52428800
- [ ] Refreshed application
- [ ] Tried uploading video
- [ ] Video upload succeeded!

---

## 🆘 Still Need Help?

If you've completed all steps above and it's STILL not working:

1. **Take a screenshot** of the SQL query results (especially the last one)
2. **Copy the error** from browser console (the `❌ Upload failed:` log)
3. **Share both with me**

I'll help you debug further!

