
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { submitProposal } from "./actions"
import { toast } from "sonner"
import { CheckCircle2, Send } from "lucide-react"

interface ApplyJobDialogProps {
    jobId: string
    title: string
    budgetType: string
    budget: number
    minBudget?: number | null
    maxBudget?: number | null
    hasApplied: boolean
}

export function ApplyJobDialog({
    jobId,
    title,
    budgetType,
    budget,
    minBudget,
    maxBudget,
    hasApplied
}: ApplyJobDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [amount, setAmount] = useState<string>(
        budgetType === 'FIXED' ? (budget?.toString() || "") : ""
    )
    const [days, setDays] = useState<string>("7")
    const [revisions, setRevisions] = useState<string>("3")
    const [coverLetter, setCoverLetter] = useState("")

    if (hasApplied) {
        return (
            <Button disabled className="w-full bg-slate-100 text-slate-500 h-12 rounded-2xl font-bold">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Proposal Sent
            </Button>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append("jobId", jobId)
            formData.append("budget", amount)
            formData.append("days", days)
            formData.append("revisions", revisions)
            formData.append("coverLetter", coverLetter)

            await submitProposal(formData)

            toast.success("Proposal sent successfully!")
            setOpen(false)
        } catch (error) {
            toast.error("Failed to send proposal. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const isFixed = budgetType === 'FIXED'

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-slate-900 hover:bg-black text-white h-12 text-sm font-black rounded-2xl shadow-sm transition-all tracking-tight">
                    Apply for Job
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="leading-[1.2]">Apply for {title}</DialogTitle>
                    <DialogDescription>
                        Set your terms for this project.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-8">
                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                {isFixed ? "Confirmed Price (₹)" : "Your Quote (₹)"}
                            </Label>
                            {isFixed ? (
                                <div className="text-2xl font-bold pl-1">
                                    ₹{budget}
                                    <input type="hidden" name="amount" value={budget} />
                                </div>
                            ) : (
                                <div>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        min="1"
                                    />
                                    {(minBudget || maxBudget) && (
                                        <p className="text-xs text-muted-foreground mt-3 text-slate-400">
                                            Client budget: ₹{minBudget || 0} - ₹{maxBudget || '...'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="revisions">
                                Number of Revisions
                            </Label>
                            <Input
                                id="revisions"
                                type="number"
                                placeholder="3"
                                value={revisions}
                                onChange={(e) => setRevisions(e.target.value)}
                                required
                                min="0"
                                max="100"
                            />
                            <p className="text-[10px] text-slate-400">
                                How many rounds of changes are included?
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-slate-900 text-white">
                            {isLoading ? "Sending..." : "Apply"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
