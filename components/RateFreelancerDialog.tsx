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
import { createReview } from "@/app/actions/createReview"
import { toast } from "sonner"

// --- Star Rating ---
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
        <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
                <circle cx="50" cy="50" r={r} fill="none" stroke="#3b82f6" strokeWidth="9"
                    strokeLinecap="round" strokeDasharray={`${circumference}`} strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out" />
            </svg>
            <div className="z-10 text-center">
                <p className="text-[20px] font-black text-slate-900 leading-none">
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

interface RateFreelancerDialogProps {
    orderId: string
    freelancerName?: string
    serviceId?: string
    open: boolean
    onOpenChange: (v: boolean) => void
}

export function RateFreelancerDialog({ orderId, freelancerName, serviceId, open, onOpenChange }: RateFreelancerDialogProps) {
    const router = useRouter()
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [ratings, setRatings] = useState({
        overall: 0,
        professionalism: 0,
        timeliness: 0,
        quality: 0,
        communication: 0,
    })
    const [comment, setComment] = useState("")

    const filledCount = Object.values(ratings).filter(v => v > 0).length
    const allFilled = filledCount === 5
    const overallScore = allFilled
        ? (ratings.overall + ratings.professionalism + ratings.timeliness + ratings.quality + ratings.communication) / 5
        : 0

    const handleSubmit = async () => {
        if (!allFilled) {
            toast.error("Please rate all categories.")
            return
        }
        if (!comment.trim()) {
            toast.error("Please write a brief review.")
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("orderId", orderId)
            if (serviceId) formData.append("serviceId", serviceId)
            formData.append("rating", ratings.overall.toString())
            formData.append("ratingProfessionalism", ratings.professionalism.toString())
            formData.append("ratingTimeliness", ratings.timeliness.toString())
            formData.append("ratingQualityOfWork", ratings.quality.toString())
            formData.append("ratingCommunication", ratings.communication.toString())
            formData.append("comment", comment.trim())

            await createReview(formData)

            setSubmitted(true)
            toast.success("Review submitted!")
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
            <DialogContent className="sm:max-w-[500px] p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
                {submitted ? (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-white">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Review Submitted!</h2>
                        <p className="text-sm text-slate-500">Thanks for sharing your experience.</p>
                    </div>
                ) : (
                    <div className="bg-[#f8f9fb] flex flex-col w-full max-h-[90vh]">
                        <div className="bg-white px-7 pt-7 pb-5 border-b border-slate-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Rate Freelancer</p>
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-[22px] font-bold text-slate-900 leading-tight">
                                    How was working with {freelancerName || "the freelancer"}?
                                </DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="overflow-y-auto px-4 py-4 space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-1 shadow-sm">
                                <RatingRow label="Overall Satisfaction" value={ratings.overall} onChange={v => setRatings(r => ({ ...r, overall: v }))} disabled={isSubmitting} />
                                <RatingRow label="Professionalism" value={ratings.professionalism} onChange={v => setRatings(r => ({ ...r, professionalism: v }))} disabled={isSubmitting} />
                                <RatingRow label="Timeliness" value={ratings.timeliness} onChange={v => setRatings(r => ({ ...r, timeliness: v }))} disabled={isSubmitting} />
                                <RatingRow label="Quality of Work" value={ratings.quality} onChange={v => setRatings(r => ({ ...r, quality: v }))} disabled={isSubmitting} />
                                <RatingRow label="Communication" value={ratings.communication} onChange={v => setRatings(r => ({ ...r, communication: v }))} disabled={isSubmitting} />
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-5 shadow-sm">
                                <CircularRating value={overallScore} />
                                <div>
                                    <p className="text-[13px] font-bold text-slate-900 mb-0.5">Calculated Score</p>
                                    <p className="text-[11px] text-slate-400 leading-tight">
                                        {allFilled ? "Based on your ratings" : `${5 - filledCount} categories remaining`}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 p-1 shadow-sm overflow-hidden">
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share more details about the quality of delivery and collaboration..."
                                    disabled={isSubmitting}
                                    rows={4}
                                    className="border-0 focus-visible:ring-0 text-[13px] text-slate-700 placeholder:text-slate-400 resize-none min-h-[100px]"
                                />
                            </div>
                        </div>

                        <div className="px-4 pb-6 bg-white border-t border-slate-100 pt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !allFilled || !comment.trim()}
                                className={cn(
                                    "w-full h-12 rounded-2xl font-bold text-[15px] transition-all",
                                    allFilled && comment.trim()
                                        ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                                        : "bg-slate-200 text-slate-400"
                                )}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isSubmitting ? "Submitting..." : "Complete Review"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
