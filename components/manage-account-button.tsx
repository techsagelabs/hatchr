"use client"

import { useState } from "react"
import Link from "next/link"
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
      <DialogContent className="max-w-2xl w-[90vw] p-6">
        <VisuallyHidden>
          <DialogTitle>Manage Account</DialogTitle>
        </VisuallyHidden>
        <div className="space-y-3 text-sm">
          <p>Manage your account settings:</p>
          <div className="grid gap-2">
            <Link href="/profile" className="underline">Edit profile</Link>
            <Link href="/sign-in" className="underline">Change password (via sign-in)</Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
