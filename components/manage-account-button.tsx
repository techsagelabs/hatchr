"use client"

import { useState } from "react"
import { UserProfile } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Settings } from "lucide-react"

export function ManageAccountButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Manage Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
        <VisuallyHidden>
          <DialogTitle>Manage Account</DialogTitle>
        </VisuallyHidden>
        <UserProfile 
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full h-full",
              card: "shadow-none border-none h-full",
            },
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
