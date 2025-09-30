# Fix Video Upload Error: "mime type video/mp4 is not supported"

## Problem
Supabase Storage bucket `project-assets` is rejecting video uploads because it doesn't have video MIME types configured in its allowed types list.

## Solution

### Option 1: Update via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Click on **Storage** in the left sidebar

2. **Find your bucket**
   - Locate the `project-assets` bucket
   - Click on the bucket name

3. **Update Bucket Settings**
   - Click on the **"Settings"** or **"Configuration"** button (usually three dots menu)
   - Look for **"Allowed MIME types"** section
   - Update to include:
     ```
     image/*
     video/*
     ```
   - Or be more specific:
     ```
     image/jpeg
     image/png
     image/gif
     image/webp
     video/mp4
     video/quicktime
     video/webm
     ```

4. **Save changes**

### Option 2: Update via SQL (If Dashboard Option Not Available)

If you don't see the MIME type option in the dashboard, run this SQL in your Supabase SQL Editor:

```sql
-- Update the project-assets bucket to allow video uploads
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/*', 'video/*']
WHERE id = 'project-assets';

-- Or be more specific with individual types:
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm'
]
WHERE id = 'project-assets';

-- Verify the change
SELECT id, name, allowed_mime_types, file_size_limit 
FROM storage.buckets 
WHERE id = 'project-assets';
```

### Option 3: Remove MIME Type Restrictions (Less Secure)

If you want to allow all file types (not recommended for production):

```sql
UPDATE storage.buckets 
SET allowed_mime_types = NULL
WHERE id = 'project-assets';
```

## Verify the Fix

After making the change, try uploading a video through your application. The error should be resolved.

## Additional Recommendations

### 1. Check File Size Limits
Ensure your bucket has adequate file size limits for videos:

```sql
-- Check current file size limit (in bytes)
SELECT file_size_limit FROM storage.buckets WHERE id = 'project-assets';

-- Update to 50MB (50 * 1024 * 1024 = 52428800 bytes)
UPDATE storage.buckets 
SET file_size_limit = 52428800
WHERE id = 'project-assets';
```

### 2. Verify Storage Policies
Make sure your RLS policies allow uploads:

```sql
-- Check existing policies
SELECT * FROM storage.policies WHERE bucket_id = 'project-assets';

-- Example: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-assets');
```

### 3. Monitor Storage Usage
Video files are larger than images. Monitor your Supabase storage usage to ensure you don't exceed your plan limits.

## Testing

After applying the fix:

1. Go to your project submission page
2. Try uploading a video file (MP4, MOV, or WebM)
3. Confirm the upload completes successfully
4. Verify the video plays correctly in the carousel

## Troubleshooting

If you still get errors:

- **Check browser console** for detailed error messages
- **Verify bucket name** is exactly `project-assets` in your code
- **Check authentication** - ensure user is logged in when uploading
- **Test with small video** - try a very small video file first (< 5MB)
- **Check Supabase logs** - review storage logs in dashboard for more details

---

**Last Updated**: December 30, 2025

