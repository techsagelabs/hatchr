# 🔧 Fix for Dedicated Sign-In/Sign-Up Pages

## 🎯 Your Setup
You have custom sign-in/sign-up pages:
- `/sign-in` → `app/sign-in/[[...rest]]/page.tsx`
- `/sign-up` → `app/sign-up/[[...rest]]/page.tsx`

## 🚨 The Problem
Google OAuth redirects to Clerk's hosted pages instead of your custom pages.

---

## 🛠️ Clerk Dashboard Configuration

### 1. Find Authentication Settings

**Try these paths (dashboard structure varies):**

**Option A:**
```
Left Sidebar → Authentication → Social connections → Google
```

**Option B:** 
```
Left Sidebar → Configure → Authentication → Social connections → Google
```

**Option C:**
```
Left Sidebar → Social connections → Google
```

**Or use Search:** Type `"Google"` in dashboard search bar

---

### 2. Configure Google OAuth Settings

**Once you find Google settings, look for:**

#### Authentication Mode/Strategy:
- **"Authentication strategy"** → Set to **"Embedded"** or **"Custom pages"**
- **"Sign-in mode"** → Set to **"Embedded"** or **"Custom"**
- **NOT** "Hosted" or "Redirect"

#### Disable Hosted Pages:
- **"Use Clerk hosted pages"** → ❌ **DISABLE**
- **"Redirect to hosted sign-in"** → ❌ **DISABLE**  
- **"Redirect to hosted sign-up"** → ❌ **DISABLE**

#### Enable Custom Pages:
- **"Use custom pages"** → ✅ **ENABLE**
- **"Embedded mode"** → ✅ **ENABLE**

---

### 3. Set Application URLs

**Find "Paths" or "URLs" section:**

**Try these locations:**
```
Configure → Paths
Authentication → Settings → Paths  
Settings → Application → Paths
```

**Set these values:**
- **Sign-in URL:** `/sign-in`
- **Sign-up URL:** `/sign-up`
- **After sign-in:** `/` (your home page)
- **After sign-up:** `/` (your home page)

**CRITICAL:** Make sure these URLs point to YOUR domain, not Clerk's.

---

### 4. Domain Configuration

**Find "Domains" section:**
- **Development:** `localhost:3000`
- **Production:** `your-actual-domain.com`

---

## 🧪 Test Your Fix

### Expected Behavior:
1. **Click "Sign up"** → Goes to `/sign-up` page ✅
2. **Click "Google"** → Google OAuth popup ✅
3. **Complete Google auth** → Redirects back to `/sign-up` or `/` ✅
4. **NO redirect** to `*.clerk.accounts.dev` ❌

### If Still Redirecting:
1. **Clear browser cache/cookies completely**
2. **Restart dev server:** `npm run dev`
3. **Try incognito/private browsing**
4. **Check browser console for errors**

---

## 🔍 Alternative Solutions

### Option 1: Switch to Modal Mode (Recommended)

If you prefer modal authentication:

1. **Update environment variables:**
```bash
# Remove these lines from .env.local:
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
```

2. **Delete dedicated pages:**
- Delete `app/sign-in/` folder
- Delete `app/sign-up/` folder

3. **Configure modal mode in Clerk dashboard:**
- **Authentication strategy** → **"Modal"**

### Option 2: Force Redirect URLs

**Add these props to your SignIn/SignUp components:**

```typescript
// app/sign-in/[[...rest]]/page.tsx
<SignIn 
  forceRedirectUrl="/"
  fallbackRedirectUrl="/"
  appearance={{ /* your styles */ }}
/>

// app/sign-up/[[...rest]]/page.tsx  
<SignUp
  forceRedirectUrl="/"
  fallbackRedirectUrl="/"
  appearance={{ /* your styles */ }}
/>
```

---

## 🚨 Can't Find Settings?

**Screenshot Method:**
1. Take screenshot of your Clerk Dashboard sidebar
2. Share it for specific guidance
3. Different Clerk plans have different layouts

**Search Method:**
- Use Clerk dashboard search
- Search terms: `"Google"`, `"Authentication"`, `"Hosted"`, `"Embedded"`

**Contact Support:**
- Email: support@clerk.com  
- Mention: "Need help disabling hosted pages for Google OAuth"
