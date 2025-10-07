# ⚡ Quick Fix: Google OAuth in Production

## 🚨 Issue
```
refresh_token_not_found error in production
```

---

## ✅ Code Changes (DONE)

I've already updated your code:
- ✅ Added `access_type: 'offline'` to OAuth requests
- ✅ Added `prompt: 'consent'` to force refresh token
- ✅ Updated both sign-in and sign-up pages

---

## 📋 **YOU NEED TO DO: Configure URLs**

### **Step 1: Supabase Dashboard** (5 minutes)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"Authentication"** → **"URL Configuration"**
4. **Add to "Redirect URLs"**:
   ```
   https://YOUR-APP.vercel.app/auth/callback
   https://YOUR-APP.vercel.app/**
   ```
   
5. **Set "Site URL"** to:
   ```
   https://YOUR-APP.vercel.app
   ```

6. Click **"Save"**

**⚠️ Replace `YOUR-APP.vercel.app` with your actual deployment URL**

---

### **Step 2: Google Cloud Console** (10 minutes)

1. Go to: https://console.cloud.google.com
2. Select your project
3. Click **"APIs & Services"** → **"Credentials"**
4. Find your OAuth 2.0 Client ID → Click **Edit**
5. **Add to "Authorized redirect URIs"**:
   ```
   https://YOUR-APP.vercel.app/auth/callback
   https://YOUR-SUPABASE-REF.supabase.co/auth/v1/callback
   ```

6. Click **"Save"**

**How to find your Supabase reference**:
- Supabase Dashboard → Settings → API
- Look for "Project URL": `https://YOUR_REF.supabase.co`

---

### **Step 3: Check OAuth Consent Screen**

1. In Google Cloud Console: **"APIs & Services"** → **"OAuth consent screen"**
2. **Status should be**: "In production" (NOT "Testing")
3. If it says "Testing", click **"PUBLISH APP"**

---

### **Step 4: Deploy Code Changes**

```bash
git add .
git commit -m "Fix: Add access_type=offline for Google OAuth"
git push
```

Wait for Vercel to deploy (~2 minutes).

---

### **Step 5: Test**

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Revoke previous access**:
   - Go to: https://myaccount.google.com/permissions
   - Find your app → Click "Remove Access"
3. **Try signing in with Google** in production
4. **Should work!** ✅

---

## 🔍 What to Look For

### ✅ Success Signs:
- Google consent screen appears
- Asks for permissions
- Redirects back to your app
- User is logged in
- No errors in logs

### ❌ Failure Signs:
- "redirect_uri_mismatch" → Check Step 2
- "refresh_token_not_found" → Check Step 3 (publish app)
- Still errors → See detailed guide in `FIX-GOOGLE-OAUTH-PRODUCTION.md`

---

## 📝 URLs You Need

**Find your deployment URL**:
- Vercel Dashboard → Your Project → "Domains"
- Example: `hatchr-app.vercel.app`

**Find your Supabase reference**:
- Supabase Dashboard → Settings → API
- Look for: `https://zjappsarpwtbdvgdrwhc.supabase.co`
- Your reference is: `zjappsarpwtbdvgdrwhc`

---

## 🆘 Still Not Working?

See detailed troubleshooting in:
📄 `FIX-GOOGLE-OAUTH-PRODUCTION.md`

---

## ⏱️ Time Estimate
- **Step 1**: 5 minutes (Supabase URLs)
- **Step 2**: 10 minutes (Google OAuth URIs)  
- **Step 3**: 2 minutes (Publish app)
- **Step 4**: 2 minutes (Deploy)
- **Step 5**: 5 minutes (Test)

**Total: ~25 minutes**

---

## ✨ After This Fix

Users will be able to:
- ✅ Sign up with Google in production
- ✅ Sign in with Google in production
- ✅ Get proper refresh tokens
- ✅ Stay signed in across sessions

---

**Status**: Code updated ✅ | Configuration needed ⚠️

