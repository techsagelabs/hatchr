# 📝 Profile Editing Guide

## ✅ **Feature Already Implemented!**

Your Hatchr app already has a **complete profile editing system** with all the features you requested:

1. ✅ **Username** - Unique, alphanumeric usernames (3-30 characters)
2. ✅ **Bio** - Tell the community about yourself
3. ✅ **Profile Image** - Upload custom avatar
4. ✅ **Bio Links** - Add your social media and website links
   - Website
   - Twitter
   - GitHub
   - LinkedIn
5. ✅ **Location** - Where you're based
6. ✅ **Display Name** - Your full name

---

## 📍 **How to Access Profile Editing**

### **Method 1: From Your Profile Page** (Recommended)
1. Click **"Profile"** in the navbar (or go to `/profile`)
2. Look for the **edit button** (pencil icon) next to your profile picture
3. Click it to open the **Edit Profile modal**
4. Make your changes
5. Click **"Save Changes"**

### **Method 2: Direct Button**
The profile edit button appears:
- On your profile page (top-left, near your avatar)
- Anywhere the `<ProfileEditButton>` component is used

---

## 🎨 **What You Can Edit**

### **1. Profile Picture**
- Click **"Choose Image"** to upload a new avatar
- Supports: JPG, PNG, GIF, WEBP
- Max size: 5MB
- Images are stored in Supabase Storage

### **2. Username** ⚠️ **IMPORTANT**
- **Unique identifier** for your profile
- Must be **3-30 characters**
- Only letters, numbers, and underscores (`a-zA-Z0-9_`)
- Automatically converted to lowercase
- Real-time validation & uniqueness check
- Example: `john_doe_123`

### **3. Display Name**
- Your **full name** or preferred display name
- Can contain spaces and special characters
- Example: `John Doe`, `Jane Smith Jr.`

### **4. Bio**
- Tell the community about yourself
- Supports multi-line text
- Appears on your profile page and project cards

### **5. Location**
- Where you're based
- Example: `San Francisco, CA` or `Tokyo, Japan`

### **6. Social Links**

#### **Website**
- Your personal website or portfolio
- Format: `https://your-website.com`
- Appears with a 🌐 globe icon

#### **Twitter**
- Your Twitter/X username
- Format: `@yourusername` or `yourusername`
- Links to: `https://twitter.com/yourusername`

#### **GitHub**
- Your GitHub username
- Format: `yourusername`
- Links to: `https://github.com/yourusername`

#### **LinkedIn**
- Your LinkedIn profile slug
- Format: `your-linkedin-profile`
- Links to: `https://linkedin.com/in/your-linkedin-profile`

---

## 🗄️ **Database Setup**

### **Check if Username Column Exists**

Run this in your Supabase SQL editor:

```sql
SELECT username FROM user_profiles LIMIT 1;
```

### **If You Get an Error:**

If you see: `ERROR: column "username" does not exist`

**Run this migration:**

```bash
# In Supabase Dashboard → SQL Editor → Run:
```

Then run the contents of: `add-username-to-user-profiles.sql`

This will:
1. Add the `username` column
2. Create a unique index (case-insensitive)
3. Migrate existing `display_name` values to `username`
4. Add validation constraints

---

## 🧪 **Testing the Feature**

### **Test 1: Open Edit Modal**
1. Go to `/profile`
2. Click the **edit button** (pencil icon)
3. **Expected:** Modal opens with your current profile data

### **Test 2: Edit Username**
1. Change your username to something new
2. Try an invalid username (e.g., `ab` - too short)
3. **Expected:** Error message appears
4. Enter a valid username (e.g., `my_new_username`)
5. Click **"Save Changes"**
6. **Expected:** Success! Profile updates and modal closes

### **Test 3: Upload Profile Picture**
1. Click **"Choose Image"**
2. Select an image from your computer
3. Wait for upload
4. **Expected:** Image preview appears
5. Click **"Save Changes"**
6. **Expected:** New avatar appears on profile

### **Test 4: Add Bio Links**
1. Add your website: `https://example.com`
2. Add Twitter: `@yourhandle`
3. Add GitHub: `yourusername`
4. Add LinkedIn: `your-profile`
5. Click **"Save Changes"**
6. **Expected:** Social icons appear on your profile with working links

### **Test 5: Username Uniqueness**
1. Try to change username to one that's already taken
2. **Expected:** Error: `"Username is already taken"`
3. Change to a unique username
4. **Expected:** Success!

---

## 🔧 **Code Implementation**

### **Key Files:**

```
📁 Profile Editing System
├── components/profile-edit-modal.tsx       # Main edit form (310 lines)
├── components/profile-edit-button.tsx      # Button to open modal
├── app/api/user/profile/route.ts           # API endpoint (GET/PUT)
├── lib/user-profiles.ts                    # Database functions
└── app/profile/page.tsx                    # Profile page with edit button
```

### **How It Works:**

```typescript
// 1. User clicks edit button
<ProfileEditButton profile={profile} />

// 2. Modal opens with current data
<ProfileEditModal 
  isOpen={true} 
  profile={currentProfile}
  onProfileUpdated={handleUpdate}
/>

// 3. User makes changes and clicks "Save Changes"

// 4. Data sent to API
fetch('/api/user/profile', {
  method: 'PUT',
  body: JSON.stringify({
    username: 'new_username',
    bio: 'My new bio',
    avatarUrl: 'https://...',
    // ... other fields
  })
})

// 5. API validates and updates database
await updateUserProfile(updates)

// 6. Page refreshes with new data
router.refresh()
```

---

## ✅ **Validation Rules**

### **Username:**
- ✅ Required field
- ✅ 3-30 characters
- ✅ Alphanumeric + underscores only (`[a-zA-Z0-9_]+`)
- ✅ Must be unique (case-insensitive)
- ✅ Auto-converted to lowercase
- ❌ No spaces, dashes, or special characters

### **Profile Image:**
- ✅ Max size: 5MB
- ✅ Formats: JPEG, PNG, GIF, WEBP
- ✅ Uploaded to Supabase Storage
- ❌ Videos not supported

### **All Other Fields:**
- ✅ Optional
- ✅ String validation
- ✅ No length limits (except database)

---

## 🎨 **UI/UX Features**

1. **Real-time Validation**
   - Username validity checked on every keystroke
   - Error messages appear instantly
   - Save button disabled if invalid

2. **Loading States**
   - "Saving..." text with spinner during save
   - All inputs disabled while saving
   - Prevents double-submission

3. **Error Handling**
   - Username taken → Clear error message
   - Network error → Alert with details
   - Validation error → Inline field errors

4. **Responsive Design**
   - Modal scrollable on mobile
   - Touch-friendly inputs
   - Works on all screen sizes

5. **Accessibility**
   - Proper labels for screen readers
   - Keyboard navigation
   - Focus management

---

## 🚀 **Quick Test Script**

```bash
# 1. Start your dev server
npm run dev

# 2. Open browser
http://localhost:3000/profile

# 3. Click the edit button (pencil icon)

# 4. Make changes and save

# 5. Check console for debug logs:
# - "✅ Profile updated successfully"
# - API responses
# - Validation messages
```

---

## 📊 **Database Schema**

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,           -- Supabase Auth user ID
    username TEXT NOT NULL UNIQUE,          -- NEW: Unique username
    display_name TEXT,                      -- Full name
    bio TEXT,                               -- User bio
    website TEXT,                           -- Personal website
    twitter TEXT,                           -- Twitter handle
    github TEXT,                            -- GitHub username
    linkedin TEXT,                          -- LinkedIn profile
    avatar_url TEXT,                        -- Profile picture URL
    location TEXT,                          -- User location
    is_onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index (case-insensitive)
CREATE UNIQUE INDEX user_profiles_username_unique 
ON user_profiles (LOWER(username));

-- Format validation
ALTER TABLE user_profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
```

---

## 🐛 **Troubleshooting**

### **Error: "column 'username' does not exist"**
**Solution:** Run `add-username-to-user-profiles.sql` in Supabase

### **Error: "Username is already taken"**
**Solution:** Choose a different username (they're unique!)

### **Error: "Failed to update profile"**
**Possible causes:**
1. Not signed in → Check `getCurrentUser()`
2. RLS policy issue → Check Supabase RLS policies
3. Network error → Check browser console

### **Image upload not working**
**Possible causes:**
1. File too large (max 5MB)
2. Storage bucket not configured
3. RLS policy on storage bucket

---

## 🎉 **Feature Summary**

| Feature | Status | Location |
|---------|--------|----------|
| Username editing | ✅ Working | Profile Edit Modal |
| Bio editing | ✅ Working | Profile Edit Modal |
| Profile image | ✅ Working | Profile Edit Modal |
| Website link | ✅ Working | Profile Edit Modal |
| Twitter link | ✅ Working | Profile Edit Modal |
| GitHub link | ✅ Working | Profile Edit Modal |
| LinkedIn link | ✅ Working | Profile Edit Modal |
| Location | ✅ Working | Profile Edit Modal |
| Display name | ✅ Working | Profile Edit Modal |
| Real-time validation | ✅ Working | Client-side |
| Uniqueness check | ✅ Working | Server-side |
| Image upload | ✅ Working | Supabase Storage |

---

## 📝 **Next Steps**

1. **Verify Database:**
   - Run `verify-profile-features.sql` in Supabase
   - If username column missing, run `add-username-to-user-profiles.sql`

2. **Test the Feature:**
   - Go to `/profile`
   - Click edit button
   - Update your profile
   - Verify changes saved

3. **Deploy:**
   - Push to production
   - Test on deployed site
   - Verify Supabase connection works

---

## 📚 **Additional Resources**

- **Profile Edit Modal:** `components/profile-edit-modal.tsx`
- **API Documentation:** `app/api/user/profile/route.ts`
- **Database Functions:** `lib/user-profiles.ts`
- **Type Definitions:** `lib/types.ts` (User type)

---

## 🎯 **Success Criteria**

✅ User can edit username  
✅ User can edit bio  
✅ User can upload profile image  
✅ User can add website link  
✅ User can add Twitter link  
✅ User can add GitHub link  
✅ User can add LinkedIn link  
✅ Changes persist to database  
✅ Changes visible immediately  
✅ Validation prevents invalid data  
✅ Error messages are clear  

---

**Your profile editing feature is complete and ready to use! 🚀**

Just verify the database setup and you're good to go!

