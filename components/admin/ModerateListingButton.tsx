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
import { Textarea } from "@/components/ui/textarea"
import { Trash2, AlertTriangle, RefreshCcw } from "lucide-react"
import { moderateListing } from "@/app/actions/adminActions"
import { toast } from "sonner"
interface ModerateListingButtonProps {
    listingId: string
    listingType: "service" | "product" | "job"
    listingTitle: string
    isRemoved?: boolean
    removalReason?: string
}

export function ModerateListingButton({ listingId, listingType, listingTitle, isRemoved, removalReason }: ModerateListingButtonProps) {
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState(removalReason || "")
    const [loading, setLoading] = useState(false)

    const handleModerate = async (action: "REMOVE" | "RESTORE") => {
        if (action === "REMOVE" && !reason.trim()) {
            toast.error("Please provide a reason for removal")
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("listingId", listingId)
            formData.append("listingType", listingType)
            formData.append("reason", action === "REMOVE" ? reason : "")
            formData.append("action", action)

            await moderateListing(formData)
            toast.success(action === "RESTORE" ? "Listing restored successfully" : "Listing removed successfully")
            setOpen(false)
        } catch (error) {
            toast.error(action === "RESTORE" ? "Failed to restore listing" : "Failed to remove listing")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (isRemoved) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 font-bold hover:bg-emerald-50 hover:text-emerald-700">
                        <RefreshCcw className="w-3 h-3 mr-1" /> Restore
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <RefreshCcw className="w-5 h-5" />
                            Restore Listing
                        </DialogTitle>
                        <DialogDescription>
                            You are about to restore <strong>{listingTitle}</strong>. It will be visible to buyers again.
                        </DialogDescription>
                    </DialogHeader>
                    {removalReason && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Previous Removal Reason</p>
                            <p className="text-slate-600 text-sm italic">"{removalReason}"</p>
                        </div>
                    )}
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => handleModerate("RESTORE")} disabled={loading}>
                            {loading ? "Restoring..." : "Confirm Restoration"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 font-bold hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Remove Listing
                    </DialogTitle>
                    <DialogDescription>
                        You are about to remove <strong>{listingTitle}</strong>. This action will hide the listing from search and new buyers, but existing orders will remain.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-bold text-slate-700">
                            Reason for removal
                        </label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Terms of service violation, inappropriate content..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <p className="text-[10px] text-slate-500">
                            This reason will be shared with the owner of the listing.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => handleModerate("REMOVE")} disabled={loading}>
                        {loading ? "Removing..." : "Confirm Removal"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
