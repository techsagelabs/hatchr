"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { LoadingSpinner } from "@/components/ui/loading"
import { SlideUpTransition } from "@/components/page-transitions"
import { 
  Sparkles, 
  User, 
  Camera, 
  FileText, 
  Globe,
  Github,
  Twitter,
  Linkedin,
  ArrowRight,
  CheckCircle
} from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  userName: string
  userAvatar?: string
  onComplete?: () => void
}

type OnboardingStep = 'welcome' | 'profile' | 'bio' | 'social' | 'complete'

export function OnboardingModal({ isOpen, userName, userAvatar, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [displayName, setDisplayName] = useState(userName)
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState(userAvatar || "")
  const [website, setWebsite] = useState("")
  const [github, setGithub] = useState("")
  const [twitter, setTwitter] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const steps: OnboardingStep[] = ['welcome', 'profile', 'bio', 'social', 'complete']
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleComplete = async () => {
    setSaving(true)
    try {
      // Save profile data
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio: bio || undefined,
          avatarUrl: avatarUrl || undefined,
          website: website || undefined,
          github: github || undefined,
          twitter: twitter || undefined,
          linkedin: linkedin || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      // Mark user as onboarded
      const onboardResponse = await fetch('/api/user/onboard', {
        method: 'POST',
      })

      if (!onboardResponse.ok) {
        throw new Error('Failed to complete onboarding')
      }

      setCurrentStep('complete')
      
      // Call completion callback
      if (onComplete) {
        onComplete()
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/profile')
        router.refresh()
      }, 2000)
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to complete setup. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  const handleSkipOnboarding = () => {
    if (onComplete) {
      onComplete()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleSkipOnboarding}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Progress bar */}
        <div className="w-full bg-muted h-2 rounded-full mb-6">
          <div 
            className="bg-orange-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {currentStep === 'welcome' && (
          <SlideUpTransition>
            <div className="text-center py-6">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-orange-600" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl">Welcome to Takeo! 🎉</DialogTitle>
                <DialogDescription className="text-base">
                  Let's set up your profile so you can start sharing your amazing projects with the community.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline"
                  onClick={handleSkipOnboarding}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button 
                  onClick={handleNext}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </SlideUpTransition>
        )}

        {currentStep === 'profile' && (
          <SlideUpTransition>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Profile Info
              </DialogTitle>
              <DialogDescription>
                Tell us a bit about yourself. You can change this later.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <ImageUpload
                label="Profile Picture"
                value={avatarUrl}
                onChange={setAvatarUrl}
                disabled={saving}
              />

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={!displayName.trim()}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </SlideUpTransition>
        )}

        {currentStep === 'bio' && (
          <SlideUpTransition>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                About You (Optional)
              </DialogTitle>
              <DialogDescription>
                Share what you're passionate about or what you're working on.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Designer, developer, maker, dreamer... tell us about yourself!"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={saving}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleNext}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </SlideUpTransition>
        )}

        {currentStep === 'social' && (
          <SlideUpTransition>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Links (Optional)
              </DialogTitle>
              <DialogDescription>
                Connect your social profiles so people can find you elsewhere.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {saving && <LoadingSpinner size="sm" className="mr-2" />}
                {saving ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </SlideUpTransition>
        )}

        {currentStep === 'complete' && (
          <SlideUpTransition>
            <div className="text-center py-8">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl">You're all set! 🚀</DialogTitle>
                <DialogDescription className="text-base">
                  Welcome to the Takeo community! You can now start sharing your projects and discovering amazing builds from other makers.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-4">
                Redirecting to your profile...
              </p>
            </div>
          </SlideUpTransition>
        )}
      </DialogContent>
    </Dialog>
  )
}
