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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Flag } from "lucide-react"

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  projectTitle: string
  projectId: string
}

export function ReportDialog({ isOpen, onClose, projectTitle, projectId }: ReportDialogProps) {
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return

    try {
      setSubmitting(true)
      
      // Here you would typically send the report to your backend
      // For now, we'll just simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Report submitted:', {
        projectId,
        projectTitle,
        reason,
        details,
        timestamp: new Date().toISOString()
      })
      
      // Show success message
      alert("Thank you for your report. Our team will review it shortly.")
      
      // Reset form and close
      setReason("")
      setDetails("")
      onClose()
      
    } catch (error) {
      console.error('Error submitting report:', error)
      alert("Failed to submit report. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const reportReasons = [
    "Spam or promotional content",
    "Inappropriate content",
    "Copyright violation",
    "Misleading information",
    "Harassment or abuse",
    "Other"
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            Report Project
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting projects that violate our guidelines.
            <br />
            <span className="font-medium">Reporting: "{projectTitle}"</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional context or details..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || submitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
