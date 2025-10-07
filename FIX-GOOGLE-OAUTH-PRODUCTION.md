# Fix Google OAuth "refresh_token_not_found" Error

## Problem
When users try to sign up/in with Google in production, they get:
```
[AuthApiError]: Invalid Refresh Token: Refresh Token Not Found
status: 400, code: 'refresh_token_not_found'
```

## Root Cause
This error occurs when:
1. **Supabase redirect URLs aren't configured correctly** for production
2. **Google OAuth redirect URIs don't match** the actual deployment URL
3. **Missing `access_type=offline` parameter** in OAuth request

---

## ✅ Solution (Step-by-Step)

### **Step 1: Configure Supabase Redirect URLs**

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication → URL Configuration**:
   - Click **"Authentication"** in left sidebar
   - Click **"URL Configuration"** tab

3. **Add Production URL** to "Redirect URLs":
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```
   
   **Replace `your-app.vercel.app` with your actual deployed domain**

4. **Update Site URL**:
   - Set **"Site URL"** to: `https://your-app.vercel.app`
   - This is your production domain

5. **Click "Save"**

---

### **Step 2: Configure Google Cloud Console**

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com
   - Select your project

2. **Navigate to OAuth Consent Screen**:
   - Click **"APIs & Services"** → **"OAuth consent screen"**
   - Ensure status is **"In production"** (not "Testing")
   - If in "Testing", click **"PUBLISH APP"**

3. **Navigate to Credentials**:
   - Click **"APIs & Services"** → **"Credentials"**
   - Find your OAuth 2.0 Client ID
   - Click **Edit** (pencil icon)

4. **Update Authorized redirect URIs**:
   - Add these URIs:
     ```
     https://your-app.vercel.app/auth/callback
     https://zjappsarpwtbdvgdrwhc.supabase.co/auth/v1/callback
     ```
   
   **Important**: Replace with your actual:
   - Production domain (`your-app.vercel.app`)
   - Supabase project reference (`zjappsarpwtbdvgdrwhc.supabase.co`)
   
   To find your Supabase reference:
   - Go to Supabase Dashboard → Settings → API
   - Look for "Project URL": `https://YOUR_PROJECT_REF.supabase.co`

5. **Save changes**

---

### **Step 3: Update OAuth Request (Add `access_type=offline`)**

Update your sign-in/sign-up pages to request offline access:

**File**: `app/sign-in/page.tsx` and `app/sign-up/page.tsx`

**Current code** (lines 63-68 in sign-in, 142-147 in sign-up):
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: getAuthCallbackUrl('/')
  }
})
```

**Updated code** (add `queryParams`):
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: getAuthCallbackUrl('/'),
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})
```

This ensures Google provides a refresh token on first authorization.

---

### **Step 4: Verify Environment Variables**

1. **Check Vercel Environment Variables**:
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Click **"Settings"** → **"Environment Variables"**

2. **Ensure these are set**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   ```

3. **Redeploy** after adding/changing variables:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

---

### **Step 5: Clear OAuth State (If Needed)**

If users were testing before the fix:

1. **Users should revoke app access**:
   - Go to: https://myaccount.google.com/permissions
   - Find your app
   - Click **"Remove Access"**

2. **Clear browser cache/cookies**

3. **Try signing in again**

---

## 🔍 Debugging

### Check Redirect URL in Logs

When OAuth fails, check which URL was used:

1. **Supabase Dashboard** → **"Logs"** → **"Auth"**
2. Look for the redirect URL in failed requests
3. Ensure it matches what you configured

### Test Locally First

Before testing in production:

```bash
# Test with ngrok
ngrok http 3000

# Update Supabase redirect URLs with ngrok URL:
# https://YOUR_SUBDOMAIN.ngrok.io/auth/callback

# Update Google OAuth redirect URIs with same URL
```

### Common Mistakes

❌ **Wrong**: Using `localhost:3000` in production URLs
❌ **Wrong**: Forgetting the `/auth/callback` path
❌ **Wrong**: Using `http://` instead of `https://` for production
❌ **Wrong**: Not including Supabase callback URL in Google Console

✅ **Correct**: Three URLs needed in Google Console:
1. `https://your-app.vercel.app/auth/callback` (your app)
2. `https://YOUR_REF.supabase.co/auth/v1/callback` (Supabase)
3. (Optional) `http://localhost:3000/auth/callback` (local dev)

---

## 🧪 Testing Checklist

After applying fixes:

- [ ] Configured Supabase redirect URLs (production domain)
- [ ] Set Supabase Site URL to production domain
- [ ] Added both redirect URIs to Google Cloud Console
- [ ] Google OAuth app is in "Production" status (not Testing)
- [ ] Added `access_type=offline` to OAuth request
- [ ] Verified environment variables in Vercel
- [ ] Redeployed application
- [ ] Cleared browser cache/cookies
- [ ] Revoked previous app access in Google account
- [ ] Tested sign-in with Google in production
- [ ] Tested sign-up with Google in production
- [ ] Verified user is redirected to home page after auth

---

## 📝 Quick Reference

### What URLs to Use

**Your Production Domain** (example: `hatchr-app.vercel.app`):
- Supabase Site URL: `https://hatchr-app.vercel.app`
- Supabase Redirect URL: `https://hatchr-app.vercel.app/**`
- Google OAuth Redirect URI: `https://hatchr-app.vercel.app/auth/callback`

**Supabase Project** (find in Dashboard → Settings → API):
- Google OAuth Redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

---

## 🆘 Still Not Working?

### Check Error Details

1. **In Vercel Logs**:
   ```bash
   vercel logs YOUR_PROJECT_NAME --follow
   ```

2. **Look for**:
   - Which redirect URL was attempted
   - Any error messages from Supabase
   - HTTP status codes

### Test with Different Account

- Try with a different Google account
- Some accounts might have cached auth state

### Verify Callback Route

Ensure `/app/auth/callback/route.ts` is deployed:
```bash
# Check if file exists in deployment
ls -la .vercel/output/functions/auth/callback.func/
```

### Contact Support

If still broken after all steps:
1. **Supabase Support**: https://supabase.com/support
2. **Google OAuth Support**: https://support.google.com/cloud/
3. Provide:
   - Error message from logs
   - Screenshot of Supabase URL config
   - Screenshot of Google OAuth redirect URIs
   - Your production domain

---

## ✅ Success Criteria

You'll know it's fixed when:
1. ✅ User clicks "Continue with Google"
2. ✅ Google consent screen appears
3. ✅ User approves permissions
4. ✅ User is redirected back to your app
5. ✅ User is logged in (sees home page)
6. ✅ No errors in Vercel/Supabase logs

---

**Last Updated**: December 30, 2025  
**Status**: Production-ready solution

