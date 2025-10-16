"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { LoadingSpinner } from "@/components/ui/loading"
import { User, Globe, Github, Linkedin, Twitter, MapPin } from "lucide-react"
import type { UserProfile } from "@/lib/user-profiles"

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile | null
  onProfileUpdated?: (profile: UserProfile) => void
}

export function ProfileEditModal({ 
  isOpen, 
  onClose, 
  profile, 
  onProfileUpdated 
}: ProfileEditModalProps) {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [twitter, setTwitter] = useState("")
  const [github, setGithub] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [location, setLocation] = useState("")
  const [saving, setSaving] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const router = useRouter()

  // Populate form with existing profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "")
      setDisplayName(profile.displayName || "")
      setBio(profile.bio || "")
      setWebsite(profile.website || "")
      setTwitter(profile.twitter || "")
      setGithub(profile.github || "")
      setLinkedin(profile.linkedin || "")
      setAvatarUrl(profile.avatarUrl || "")
      setLocation(profile.location || "")
    }
    setUsernameError("")
  }, [profile, isOpen])

  // Username validation
  const validateUsername = (value: string) => {
    if (!value) {
      setUsernameError("Username is required")
      return false
    }
    if (value.length < 3) {
      setUsernameError("Username must be at least 3 characters")
      return false
    }
    if (value.length > 30) {
      setUsernameError("Username must be less than 30 characters")
      return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Username can only contain letters, numbers, and underscores")
      return false
    }
    setUsernameError("")
    return true
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))
    validateUsername(value)
  }

  const handleSave = async () => {
    if (saving) return

    // Validate username before saving
    if (!validateUsername(username)) {
      return
    }

    setSaving(true)
    try {
      console.log('🔄 Sending profile update request...')
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || undefined,
          displayName: displayName || undefined,
          bio: bio || undefined,
          website: website || undefined,
          twitter: twitter || undefined,
          github: github || undefined,
          linkedin: linkedin || undefined,
          avatarUrl: avatarUrl || undefined,
          location: location || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Profile update failed:', error)
        
        // Handle specific error codes
        if (error.code === 'MIGRATION_REQUIRED') {
          alert(
            '⚠️ Database Migration Required\n\n' +
            'The username field needs to be added to your production database.\n\n' +
            'Please run the migration file:\n' +
            '• add-username-to-user-profiles.sql\n\n' +
            'In your Supabase Dashboard:\n' +
            '1. Go to SQL Editor\n' +
            '2. Paste the migration SQL\n' +
            '3. Click Run\n\n' +
            'See: FIX-PROFILE-UPDATE-500-ERROR.md for detailed instructions.'
          )
          setSaving(false)
          return
        }
        
        if (error.code === 'USERNAME_TAKEN' || error.message?.includes('Username is already taken')) {
          setUsernameError("Username is already taken")
          setSaving(false)
          return
        }
        
        // Generic error handling with better messaging
        const errorMessage = error.details 
          ? `${error.error}\n\nDetails: ${error.details}` 
          : error.error || 'Failed to update profile'
        
        throw new Error(errorMessage)
      }

      const updatedProfile = await response.json()
      console.log('✅ Profile updated successfully')
      
      // Call the callback if provided
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile)
      }

      // Refresh the page to show updated data
      router.refresh()
      onClose()
      
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      alert(`Failed to update profile:\n\n${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your profile information and social links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar Upload */}
          <ImageUpload
            label="Profile Picture"
            value={avatarUrl}
            onChange={setAvatarUrl}
            disabled={saving}
          />

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
            <Input
              id="username"
              placeholder="your_username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={saving}
              className={usernameError ? "border-red-500" : ""}
            />
            {usernameError && (
              <p className="text-sm text-red-500">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-30 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name</Label>
            <Input
              id="displayName"
              placeholder="Your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              className="min-h-[80px]"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="City, Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://your-website.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Social Links</h4>
            
            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter
              </Label>
              <Input
                id="twitter"
                placeholder="@yourusername"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </Label>
              <Input
                id="github"
                placeholder="yourusername"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                placeholder="your-linkedin-profile"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving && <LoadingSpinner size="sm" className="mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
