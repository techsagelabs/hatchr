# 🔍 Updated Clerk Dashboard Navigation Guide

## 📍 Current Clerk Dashboard Structure (2024)

The Clerk dashboard has been updated! Here are the **current locations** for the settings you need:

---

## 🚨 STEP 1: Find Social Connections

**Try these paths in order:**

### Option A: Authentication Section
```
Left Sidebar → Authentication → Social connections
```

### Option B: Configure Section  
```
Left Sidebar → Configure → Authentication → Social connections
```

### Option C: User Management Section
```
Left Sidebar → User management → Social connections
```

### Option D: Direct Menu Item
```
Left Sidebar → Social connections
```

---

## 🚨 STEP 2: Configure Google Settings

**Once you find "Social connections":**

1. **Click on "Google"** in the provider list
2. **Look for these settings** (different names possible):

### Authentication Strategy Settings:
- **"Authentication method"** → Set to **"Modal"**
- **"Sign-in mode"** → Set to **"Modal"** 
- **"Authentication flow"** → Set to **"Modal"**
- **"Display mode"** → Set to **"Modal"**

### Redirect Settings (DISABLE THESE):
- **"Use sign-in page"** → ❌ **DISABLE**
- **"Use sign-up page"** → ❌ **DISABLE**
- **"Enable redirect mode"** → ❌ **DISABLE**
- **"Redirect after sign-in"** → ❌ **DISABLE**

---

## 🚨 STEP 3: Find Paths/URLs Settings

**Try these locations:**

### Option A: 
```
Left Sidebar → Configure → Paths
```

### Option B:
```
Left Sidebar → Authentication → Settings → Paths
```

### Option C:
```
Left Sidebar → Settings → Application → Paths
```

**Set these to EMPTY or "/":**
- Sign-in path
- Sign-up path  
- After sign-in redirect
- After sign-up redirect

---

## 🔧 Alternative: Use Search Function

1. **Click the search bar** in Clerk Dashboard
2. **Search for:**
   - `"Google"`
   - `"Social"`
   - `"Modal"`
   - `"Paths"`
   - `"Authentication"`

---

## 💡 What to Look For Visually

### ✅ Good Signs (Modal Mode):
- Toggle switches set to **"Modal"**
- **"Embedded"** or **"In-app"** options enabled
- **No** external redirect URLs listed

### ❌ Bad Signs (Redirect Mode):
- **"Redirect"** options enabled
- External URLs like `*.clerk.accounts.dev` 
- **"Hosted pages"** enabled

---

## 🛟 Still Can't Find It?

### Method 1: Use Clerk CLI
```bash
npx @clerk/clerk-cli configure
```

### Method 2: Contact Support
- Email: support@clerk.com
- Include: "Need help finding modal settings for Google OAuth"

### Method 3: Screenshot Method
- Take screenshot of your entire Clerk dashboard
- Share it for specific guidance

---

## 🎯 Expected Result

After correct configuration:
- Google sign-in opens **modal in your app**
- **No redirect** to clerk.accounts.dev
- User stays on your domain throughout auth flow

## 🧪 Test Steps

1. Clear browser cache/cookies
2. Restart dev server: `npm run dev`  
3. Try Google sign-up
4. Should see modal popup (not page redirect)
