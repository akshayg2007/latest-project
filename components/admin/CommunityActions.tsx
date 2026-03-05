"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, XCircle, CheckCircle2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { moderateCommunityPost, restoreCommunityPost, moderateCommunityComment, restoreCommunityComment } from "@/app/actions/moderateCommunity"

export function CommunityActions({
    id,
    type,
    isRemoved,
}: {
    id: string
    type: "post" | "comment"
    isRemoved: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const handleModerate = async () => {
        if (!reason.trim()) return toast.error("Please provide a reason")
        setLoading(true)
        try {
            const result = type === "post"
                ? await moderateCommunityPost(id, reason)
                : await moderateCommunityComment(id, reason)

            if (result.success) {
                toast.success(`${type === "post" ? "Post" : "Comment"} removed successfully`)
                setIsOpen(false)
            } else {
                toast.error(result.error || "Failed to remove item")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async () => {
        setLoading(true)
        try {
            const result = type === "post"
                ? await restoreCommunityPost(id)
                : await restoreCommunityComment(id)

            if (result.success) {
                toast.success(`${type === "post" ? "Post" : "Comment"} restored successfully`)
            } else {
                toast.error(result.error || "Failed to restore item")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (isRemoved) {
        return (
            <Button
                variant="outline"
                className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={handleRestore}
                disabled={loading}
            >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Restore {type === "post" ? "Post" : "Comment"}
            </Button>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Remove {type === "post" ? "Post" : "Comment"}
                    </DialogTitle>
                    <DialogDescription>
                        This will hide the {type} from the community feed. Please provide a reason for the author.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="e.g., Violates community guidelines by..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="resize-none"
                    />
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleModerate}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Remove {type === "post" ? "Post" : "Comment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
