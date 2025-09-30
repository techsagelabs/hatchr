# Video Upload Debugging Guide

## If SQL Migration Didn't Work

### 1. Verify Bucket Name
Check that your code is using the correct bucket name:

```bash
# Search for bucket references in your code
```

**Files to check:**
- `components/ui/multi-image-upload.tsx` (line ~54)
- `components/ui/image-upload.tsx`

Expected bucket name: `project-assets`

### 2. Check Supabase Project URL
Verify you're connected to the correct Supabase project:

**Location:** `.env.local` file

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Enable Detailed Error Logging

Add this to `components/ui/multi-image-upload.tsx` in the `uploadImage` function:

```typescript
const uploadImage = async (file: File): Promise<string> => {
  if (!user) throw new Error('Authentication required')

  console.log('🎬 Uploading video:', {
    name: file.name,
    type: file.type,
    size: file.size,
    bucket: 'project-assets'
  })

  // Create a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `project-images/${fileName}`

  // Create client-side Supabase client with auth token
  const supabaseClient = createClient()

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('project-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('❌ Upload error details:', {
      message: uploadError.message,
      name: uploadError.name,
      cause: uploadError.cause,
      filePath,
      fileType: file.type
    })
    throw uploadError
  }

  console.log('✅ Upload successful:', uploadData)

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from('project-assets')
    .getPublicUrl(filePath)

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL')
  }

  console.log('✅ Public URL:', urlData.publicUrl)

  return urlData.publicUrl
}
```

### 4. Check Browser Console
After adding logging, check the browser console when uploading:

**Look for:**
- 🎬 Upload log with file details
- ❌ Error log with detailed error info
- ✅ Success logs if upload works

**Common errors:**
- `"new row violates row-level security policy"` → RLS policy issue
- `"mime type not supported"` → Bucket configuration issue
- `"file size exceeds limit"` → File size limit issue
- `"permission denied"` → Authentication issue

### 5. Manual Bucket Check via Supabase API

Test the bucket directly:

```sql
-- Get complete bucket configuration
SELECT 
  id,
  name,
  owner,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'project-assets';
```

Expected result:
```json
{
  "id": "project-assets",
  "name": "project-assets",
  "public": true,
  "file_size_limit": 52428800,  // 50MB
  "allowed_mime_types": ["image/*", "video/*"]
}
```

### 6. Create New Bucket (Last Resort)

If the existing bucket is corrupted, create a new one:

```sql
-- Create new bucket with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media',
  'project-media',
  true,
  52428800,
  ARRAY['image/*', 'video/*']
);

-- Create RLS policies
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'project-media');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-media');

CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (auth.uid()::text = owner)
WITH CHECK (bucket_id = 'project-media');

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (auth.uid()::text = owner);
```

Then update your code to use `project-media` instead of `project-assets`.

### 7. Check Supabase Logs

In Supabase Dashboard:
1. Go to **"Logs"** → **"Storage"**
2. Look for recent errors
3. Filter by your user ID or file name

### 8. Verify File Type on Upload

Add this validation before upload:

```typescript
const isImage = file.type.startsWith('image/')
const isVideo = file.type.startsWith('video/')

console.log('File type check:', {
  type: file.type,
  isImage,
  isVideo,
  valid: isImage || isVideo
})

if (!isImage && !isVideo) {
  throw new Error(`Invalid file type: ${file.type}`)
}
```

### 9. Test with Small Video File

Try uploading a very small video first (< 1MB) to isolate the issue:
- If small video works → File size limit issue
- If small video fails → MIME type issue

### 10. Check Environment Variables

Verify your `.env.local` file:

```bash
# In PowerShell
Get-Content .env.local | Select-String -Pattern "SUPABASE"
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 11. Restart Development Server

After making any changes:

```bash
# Stop the dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### 12. Network Tab Inspection

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try uploading a video
4. Look for the upload request (POST to `/storage/v1/object/project-assets/...`)
5. Check:
   - Request Headers (should include Authorization)
   - Request Payload (should be the video file)
   - Response (look for error details)

---

## Quick Checklist

- [ ] Ran SQL migration in Supabase SQL Editor
- [ ] Verified `allowed_mime_types` includes `video/*`
- [ ] Increased `file_size_limit` to 50MB+
- [ ] Checked RLS policies allow INSERT for authenticated users
- [ ] Bucket name in code matches Supabase bucket name
- [ ] Cleared browser cache and restarted dev server
- [ ] Checked browser console for detailed errors
- [ ] Tested with small video file (< 5MB)
- [ ] Verified environment variables are correct
- [ ] Checked Supabase Storage logs for errors

---

## Contact Support

If none of these steps work, the issue might be with your Supabase project configuration. Consider:

1. **Supabase Support**: https://supabase.com/support
2. **Supabase Discord**: https://discord.supabase.com
3. **GitHub Issues**: https://github.com/supabase/supabase/issues

Provide them with:
- The exact error message
- Your Supabase project ID
- The SQL query results from step 5
- Browser console logs with detailed logging

