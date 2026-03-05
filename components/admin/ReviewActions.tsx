"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, RotateCcw, Loader2 } from "lucide-react"
import { moderateReview, restoreReview } from "@/app/actions/reviews"
import { toast } from "sonner"

export function ReviewActions({ reviewId, isRemoved }: { reviewId: string; isRemoved: boolean }) {
    const [reason, setReason] = useState("")
    const [showInput, setShowInput] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleRemove = async () => {
        if (!reason.trim()) {
            setShowInput(true)
            return
        }
        setLoading(true)
        try {
            await moderateReview(reviewId, reason)
            toast.success("Review removed successfully")
            setReason("")
            setShowInput(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to remove review")
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async () => {
        setLoading(true)
        try {
            await restoreReview(reviewId)
            toast.success("Review restored successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to restore review")
        } finally {
            setLoading(false)
        }
    }

    if (isRemoved) {
        return (
            <Button
                variant="outline"
                onClick={handleRestore}
                disabled={loading}
                className="h-10 px-5 rounded-xl font-bold text-sm gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Restore
            </Button>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {showInput && (
                <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for removal..."
                    className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && reason.trim()) handleRemove()
                        if (e.key === "Escape") setShowInput(false)
                    }}
                />
            )}
            <Button
                variant="outline"
                onClick={handleRemove}
                disabled={loading || (showInput && !reason.trim())}
                className="h-10 px-5 rounded-xl font-bold text-sm gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {showInput ? "Confirm Remove" : "Remove"}
            </Button>
        </div>
    )
}
