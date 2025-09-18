"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { UserPlus, LogIn, X } from "lucide-react"

interface SignUpPromptModalProps {
  isOpen: boolean
  onClose: () => void
  action?: string // e.g., "vote", "comment", "share"
}

export function SignUpPromptModal({ isOpen, onClose, action = "interact" }: SignUpPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6 text-orange-600" />
            Join TechsageLabs
          </DialogTitle>
          <DialogDescription className="text-base py-2">
            To {action} on projects and connect with the community, 
            <br />
            you'll need to create an account or sign in.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <SignUpButton 
            mode="modal"
            forceRedirectUrl={typeof window !== 'undefined' ? window.location.origin : '/'}
            fallbackRedirectUrl="/"
          >
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Button>
          </SignUpButton>
          
          <SignInButton 
            mode="modal"
            forceRedirectUrl={typeof window !== 'undefined' ? window.location.origin : '/'}
            fallbackRedirectUrl="/"
          >
            <Button variant="outline" className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </SignInButton>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Continue Browsing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
