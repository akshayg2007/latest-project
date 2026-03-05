"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ReportType } from "@prisma/client"
import { submitReport } from "@/app/actions/report"
import { toast } from "sonner"
import { AlertCircle, Flag } from "lucide-react"

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    targetId: string
    targetType: ReportType
    targetName?: string // e.g. "this post", "@username", "this service"
}

const REPORT_REASONS = [
    "Spam or misleading",
    "Harassment or hate speech",
    "Inappropriate content",
    "Intellectual property violation",
    "Scam or fraud",
    "Prohibited services/products",
    "Other"
]

export function ReportModal({
    isOpen,
    onClose,
    targetId,
    targetType,
    targetName
}: ReportModalProps) {
    const [reason, setReason] = useState<string>("")
    const [details, setDetails] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Please select a reason for the report")
            return
        }

        setIsSubmitting(true)
        try {
            await submitReport({
                targetId,
                targetType,
                reason,
                details
            })
            toast.success("Thank you. Your report has been submitted to the moderation team.")
            onClose()
            // Reset form
            setReason("")
            setDetails("")
        } catch (error: any) {
            toast.error(error.message || "Failed to submit report. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <Flag className="w-5 h-5 fill-current" />
                        <DialogTitle className="text-xl">Submit a Report</DialogTitle>
                    </div>
                    <DialogDescription>
                        Help us understand what's happening {targetName ? `with ${targetName}` : "with this content"}.
                        Your report is anonymous.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-bold">Reason for Report</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason" className="w-full">
                                <SelectValue placeholder="Why are you reporting this?" />
                            </SelectTrigger>
                            <SelectContent>
                                {REPORT_REASONS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details" className="text-sm font-bold">Additional Details (Optional)</Label>
                        <Textarea
                            id="details"
                            placeholder="Provide more information to help our moderators..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg flex gap-3 items-start border border-slate-100">
                        <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-slate-500 leading-normal">
                            Abusing the reporting system by submitting false reports may result in account penalties or suspension.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Report"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
