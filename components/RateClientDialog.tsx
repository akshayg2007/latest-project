"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientReview } from "@/app/actions/createReview"
import { toast } from "sonner"

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, disabled }: {
    value: number
    onChange: (v: number) => void
    disabled?: boolean
}) {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 disabled:cursor-default"
                >
                    <Star className={cn(
                        "w-6 h-6 transition-colors duration-150",
                        star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-200"
                    )} />
                </button>
            ))}
        </div>
    )
}

function CircularRating({ value }: { value: number }) {
    const r = 40
    const circumference = 2 * Math.PI * r
    const filled = (value / 5) * circumference
    const offset = circumference - filled
    return (
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
                <circle cx="50" cy="50" r={r} fill="none" stroke="#eab308" strokeWidth="9"
                    strokeLinecap="round" strokeDasharray={`${circumference}`} strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out" />
            </svg>
            <div className="z-10 text-center">
                <p className="text-[22px] font-black text-slate-900 leading-none">
                    {value > 0 ? value.toFixed(1) : "—"}
                </p>
            </div>
        </div>
    )
}

function RatingRow({ label, value, onChange, disabled }: {
    label: string
    value: number
    onChange: (v: number) => void
    disabled?: boolean
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
            <span className="text-[14px] font-medium text-slate-700 whitespace-nowrap">{label}</span>
            <StarRating value={value} onChange={onChange} disabled={disabled} />
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface RateClientDialogProps {
    orderId: string
    clientName?: string
    open: boolean
    onOpenChange: (v: boolean) => void
}

export function RateClientDialog({ orderId, clientName, open, onOpenChange }: RateClientDialogProps) {
    const router = useRouter()
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [ratings, setRatings] = useState({
        requirements: 0,
        timeliness: 0,
        communication: 0,
        professionalism: 0,
    })
    const [comment, setComment] = useState("")

    const filled = Object.values(ratings).filter((v) => v > 0).length
    const allFilled = filled === 4
    const overallRating = allFilled
        ? (ratings.requirements + ratings.timeliness + ratings.communication + ratings.professionalism) / 4
        : 0

    const handleSubmit = async () => {
        if (!allFilled) {
            toast.error("Please rate all 4 categories before submitting.")
            return
        }
        if (!comment.trim()) {
            toast.error("Please write a brief review before submitting.")
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("orderId", orderId)
            formData.append("ratingRequirements", ratings.requirements.toString())
            formData.append("ratingPaymentPromptness", ratings.timeliness.toString())
            formData.append("ratingCommunication", ratings.communication.toString())
            formData.append("ratingCollaboration", ratings.professionalism.toString())
            formData.append("comment", comment.trim())

            await createClientReview(formData)

            setSubmitted(true)
            toast.success("Client review submitted!")
            setTimeout(() => {
                onOpenChange(false)
                router.refresh()
            }, 1800)
        } catch (err: any) {
            toast.error(err.message || "Failed to submit review.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[500px] p-0 rounded-2xl overflow-hidden border-0 shadow-xl"
                onInteractOutside={(e) => { if (isSubmitting) e.preventDefault() }}
            >
                {submitted ? (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-white">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Review Submitted!</h2>
                        <p className="text-sm text-slate-500">Thanks for rating your client.</p>
                    </div>
                ) : (
                    <div className="bg-[#f8f9fb] flex flex-col w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-white px-7 pt-7 pb-5 border-b border-slate-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Rate Your Client</p>
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-[22px] font-bold text-slate-900 leading-snug mt-1">
                                    How was working with {clientName || "this client"}?
                                </DialogTitle>
                            </DialogHeader>
                            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                                Your honest feedback helps maintain quality on the platform.
                            </p>
                        </div>

                        <div className="overflow-y-auto max-h-[70vh]">
                            {/* Rating Rows */}
                            <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-slate-100 px-5 py-1">
                                <RatingRow label="Clarity of Brief" value={ratings.requirements}
                                    onChange={(v) => setRatings((r) => ({ ...r, requirements: v }))} disabled={isSubmitting} />
                                <RatingRow label="Payment Timeliness" value={ratings.timeliness}
                                    onChange={(v) => setRatings((r) => ({ ...r, timeliness: v }))} disabled={isSubmitting} />
                                <RatingRow label="Communication" value={ratings.communication}
                                    onChange={(v) => setRatings((r) => ({ ...r, communication: v }))} disabled={isSubmitting} />
                                <RatingRow label="Professionalism" value={ratings.professionalism}
                                    onChange={(v) => setRatings((r) => ({ ...r, professionalism: v }))} disabled={isSubmitting} />
                            </div>

                            {/* Overall */}
                            <div className="bg-white mx-4 mt-3 rounded-2xl shadow-sm border border-slate-100 px-5 py-4 flex items-center gap-5">
                                <CircularRating value={overallRating} />
                                <div>
                                    <p className="text-[13px] font-bold text-slate-900 mb-0.5">Overall Rating</p>
                                    <p className="text-[12px] text-slate-400 leading-snug">
                                        {allFilled ? "Based on this review" : `${4 - filled} rating${4 - filled !== 1 ? "s" : ""} remaining`}
                                    </p>
                                    <div className="flex gap-1 mt-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className={cn("w-3.5 h-3.5 transition-colors",
                                                s <= Math.round(overallRating) ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-100")} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="px-4 mt-3 mb-4">
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience working with this client…"
                                    disabled={isSubmitting}
                                    rows={4}
                                    className="rounded-2xl border-slate-200 bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 resize-none shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 pb-5">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !allFilled || !comment.trim()}
                                className={cn(
                                    "w-full h-12 rounded-2xl font-bold text-[15px] transition-all",
                                    allFilled && comment.trim()
                                        ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting…
                                    </span>
                                ) : "Submit Review"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
