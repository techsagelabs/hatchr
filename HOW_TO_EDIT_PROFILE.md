# 🎯 How to Edit Your Profile

## Quick Access Guide

### **Step 1: Go to Your Profile**
```
1. Click "Profile" in the navbar
2. Or navigate to: http://localhost:3000/profile (or your deployed URL)
```

### **Step 2: Find the Edit Button**
```
Look for the PENCIL ICON (✏️) button next to your profile picture
Location: Top-left of the profile card, near your avatar
```

### **Step 3: Open the Edit Modal**
```
Click the pencil icon → Profile Edit Modal opens
```

### **Step 4: Make Changes**
You can edit:
- ✅ **Username** (unique, 3-30 characters)
- ✅ **Full Name** (display name)
- ✅ **Bio** (tell us about yourself)
- ✅ **Profile Picture** (upload new image)
- ✅ **Location** (city, country)
- ✅ **Website** (your personal site)
- ✅ **Twitter** (@yourusername)
- ✅ **GitHub** (yourusername)
- ✅ **LinkedIn** (your-profile-slug)

### **Step 5: Save Changes**
```
Click "Save Changes" button at the bottom
Wait for success message
Modal closes automatically
Your profile updates instantly!
```

---

## 🎨 Visual Guide

### **Profile Page Layout:**
```
┌─────────────────────────────────────────┐
│  NAVBAR                                 │
└─────────────────────────────────────────┘
┌──────────────┬────────────────────────────┐
│              │                            │
│   ┌────┐     │   MY PROJECTS             │
│   │ 👤 │ ✏️  │   ┌────┐  ┌────┐          │
│   └────┘     │   │    │  │    │          │
│              │   │    │  │    │          │
│  John Doe    │   └────┘  └────┘          │
│              │                            │
│  Bio here... │                            │
│              │                            │
│  🌐 🐦 💻 💼 │                            │
│              │                            │
│  Stats...    │                            │
│              │                            │
└──────────────┴────────────────────────────┘
        ↑
    CLICK HERE!
   (Pencil Icon)
```

---

## 📝 Edit Profile Modal

### **What You'll See:**
```
╔═══════════════════════════════════════════════╗
║  Edit Profile                            ✕   ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Profile Picture                              ║
║  ┌─────────────────────────────────┐          ║
║  │  Choose Image                   │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
║  Username *                                   ║
║  ┌─────────────────────────────────┐          ║
║  │  your_username                  │          ║
║  └─────────────────────────────────┘          ║
║  3-30 characters, letters, numbers...         ║
║                                               ║
║  Full Name                                    ║
║  ┌─────────────────────────────────┐          ║
║  │  John Doe                       │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
║  Bio                                          ║
║  ┌─────────────────────────────────┐          ║
║  │  Tell us about yourself...      │          ║
║  │                                 │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
║  📍 Location                                  ║
║  ┌─────────────────────────────────┐          ║
║  │  City, Country                  │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
║  🌐 Website                                   ║
║  ┌─────────────────────────────────┐          ║
║  │  https://your-website.com       │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
║  Social Links                                 ║
║                                               ║
║  🐦 Twitter                                   ║
║  ┌─────────────────────────────────┐          ║
║  │  @yourusername                  │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
║  💻 GitHub                                    ║
║  ┌─────────────────────────────────┐          ║
║  │  yourusername                   │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
║  💼 LinkedIn                                  ║
║  ┌─────────────────────────────────┐          ║
║  │  your-linkedin-profile          │          ║
║  └─────────────────────────────────┘          ║
║                                               ║
╠═══════════════════════════════════════════════╣
║         [Cancel]    [Save Changes]            ║
╚═══════════════════════════════════════════════╝
```

---

## ⚡ Quick Tips

### **Username Rules:**
- ✅ Must be **unique** (checked in real-time)
- ✅ 3-30 characters
- ✅ Only letters (a-z, A-Z), numbers (0-9), and underscores (_)
- ✅ Automatically converted to lowercase
- ❌ No spaces, dashes, or special characters

### **Profile Picture:**
- ✅ Max size: **5MB**
- ✅ Formats: JPG, PNG, GIF, WEBP
- ✅ Uploaded to Supabase Storage
- 💡 Tip: Square images look best (e.g., 400x400px)

### **Social Links:**
- **Website**: Full URL (e.g., `https://example.com`)
- **Twitter**: Just the handle (e.g., `@john` or `john`)
- **GitHub**: Just the username (e.g., `john`)
- **LinkedIn**: Just the profile slug (e.g., `john-doe-123`)

### **Validation:**
- ⚠️ **Username** is required (red asterisk)
- ⚠️ Invalid username → red border + error message
- ⚠️ Username taken → "Username is already taken" error
- ✅ Valid input → green checkmark (or just normal state)

---

## 🐛 Troubleshooting

### **Problem: Can't find the edit button**
**Solution:**
1. Make sure you're signed in
2. Go to `/profile` (not someone else's profile)
3. Look next to your avatar (top-left of profile card)
4. It's a small round button with a pencil icon ✏️

### **Problem: Username not available**
**Solution:**
- Try a different username
- Add numbers or underscores (e.g., `john_doe_123`)
- Check if you already have that username (can't change to same)

### **Problem: Image upload fails**
**Possible causes:**
1. File too large (> 5MB) → compress it
2. Unsupported format → use JPG, PNG, GIF, or WEBP
3. Network error → check your internet connection
4. Storage bucket not configured → check Supabase dashboard

### **Problem: Changes not saving**
**Possible causes:**
1. Invalid username (too short, special chars, etc.)
2. Network error → check browser console
3. Not signed in → sign in again
4. RLS policy issue → check Supabase logs

---

## 🧪 Test It Now!

### **Quick Test:**
1. Go to: `http://localhost:3000/profile`
2. Click the pencil icon ✏️
3. Change your username to something new
4. Click "Save Changes"
5. ✅ Expected: Modal closes, username updates on page

### **Full Test:**
1. Upload a new profile picture
2. Change your username
3. Add a bio
4. Add all social links
5. Click "Save Changes"
6. ✅ Expected: All changes saved and visible

---

## 📚 Related Files

- **Modal Component**: `components/profile-edit-modal.tsx`
- **Button Component**: `components/profile-edit-button.tsx`
- **API Route**: `app/api/user/profile/route.ts`
- **Database Functions**: `lib/user-profiles.ts`
- **Profile Page**: `app/profile/page.tsx`

---

## ✅ Feature Checklist

- [x] Username editing with validation
- [x] Bio editing
- [x] Profile image upload
- [x] Website link
- [x] Twitter link
- [x] GitHub link
- [x] LinkedIn link
- [x] Location field
- [x] Display name (full name)
- [x] Real-time uniqueness check
- [x] Client-side validation
- [x] Server-side validation
- [x] Error handling
- [x] Loading states
- [x] Mobile responsive
- [x] Dark mode support

---

## 🎉 Done!

Your profile editing feature is **fully functional** and ready to use!

**Need help?** Check:
1. `PROFILE_EDITING_GUIDE.md` (detailed guide)
2. `verify-profile-features.sql` (database verification)
3. Browser console for debug logs
4. Supabase logs for database errors

**Happy editing! 🚀**

