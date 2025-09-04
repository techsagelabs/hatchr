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
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [twitter, setTwitter] = useState("")
  const [github, setGithub] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [location, setLocation] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Populate form with existing profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "")
      setBio(profile.bio || "")
      setWebsite(profile.website || "")
      setTwitter(profile.twitter || "")
      setGithub(profile.github || "")
      setLinkedin(profile.linkedin || "")
      setAvatarUrl(profile.avatarUrl || "")
      setLocation(profile.location || "")
    }
  }, [profile])

  const handleSave = async () => {
    if (saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        throw new Error(error.message || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      
      // Call the callback if provided
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile)
      }

      // Refresh the page to show updated data
      router.refresh()
      onClose()
      
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your display name"
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
