"use client"


import { useState } from "react"
import Link from "next/link"
import { Price } from "@/components/Price"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, XCircle } from "lucide-react"
import { updateProposalStatus, rejectProposal, acceptProposalAndCreateProject } from "../actions"
import { toast } from "sonner"
import { PaymentModal } from "@/components/payment/payment-modal"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface Application {
    id: string
    jobId: string
    freelancer: {
        username: string
        avatarUrl: string | null
        credibility?: {
            score: number
        } | null
    }
    proposedBudget: number // Int in DB but used as number
    createdAt: Date
    status: string // Enum string
}

export function ProposalRow({ application }: { application: Application }) {
    const [status, setStatus] = useState(application.status)
    const [isLoading, setIsLoading] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const router = useRouter()

    const handleStatusUpdate = async (newStatus: string) => {
        setIsLoading(true)
        try {
            await updateProposalStatus(application.id, newStatus)
            setStatus(newStatus)
            toast.success(`Proposal marked as ${newStatus.toLowerCase()}`)
        } catch (error) {
            toast.error("Failed to update status")
        } finally {
            setIsLoading(false)
        }
    }

    const handleReject = async () => {
        setIsLoading(true)
        try {
            await rejectProposal(application.id, rejectReason.trim() || undefined)
            setStatus('REJECTED')
            setShowRejectDialog(false)
            setRejectReason("")
            toast.success("Proposal rejected")
        } catch (error) {
            toast.error("Failed to reject proposal")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAcceptClick = () => {
        if (application.proposedBudget === 0) {
            handlePaymentSuccess()
        } else {
            setShowPaymentModal(true)
        }
    }

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false)
        setIsLoading(true)
        try {
            const result = await acceptProposalAndCreateProject(application.id)
            if (result.success && result.orderId) {
                toast.success("Proposal accepted & Project created!")
                router.push(`/job-order/${result.orderId}`)
            }
        } catch (error) {
            toast.error("Failed to create project")
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">New</Badge>
            case 'SHORTLISTED':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">Shortlisted</Badge>
            case 'ACCEPTED':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">Accepted</Badge>
            case 'REJECTED':
                return <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">Rejected</Badge>
            default:
                return <Badge variant="outline" className="rounded-full text-[12px] uppercase">{status}</Badge>
        }
    }

    const isTerminated = status === 'ACCEPTED' || status === 'REJECTED'
    const credibilityScore = application.freelancer.credibility?.score ?? 50

    return (
        <>
            <TableRow className="group hover:bg-slate-50/40 transition-colors border-b last:border-0">
                <TableCell className="align-middle py-5 px-6">
                    <Link
                        href={`/users/${application.freelancer.username}`}
                        className="flex items-center gap-3 group/link"
                    >
                        <Avatar className="h-10 w-10 border border-slate-100 shadow-sm group-hover/link:border-indigo-200 transition-colors">
                            <AvatarImage src={application.freelancer.avatarUrl || ""} className="rounded-full" />
                            <AvatarFallback className="rounded-full">{application.freelancer.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-[18px] text-slate-900 group-hover/link:text-indigo-600 transition-colors tracking-tight">
                            {application.freelancer.username}
                        </span>
                    </Link>
                </TableCell>
                <TableCell className="align-middle py-5">
                    <Badge variant="outline" className="gap-1.5 font-semibold text-slate-600 border-slate-200 px-3 py-1 rounded-lg bg-white text-[12px] uppercase tracking-wider">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {credibilityScore}
                    </Badge>
                </TableCell>
                <TableCell className="text-center align-middle py-5">
                    <Price amount={application.proposedBudget} className="font-semibold text-slate-900 text-[18px] tracking-tight" />
                </TableCell>
                <TableCell className="text-center align-middle py-5">
                    <span className="text-[16px] font-semibold text-slate-600 tracking-tight">{format(new Date(application.createdAt), "MMM d, yyyy")}</span>
                </TableCell>
                <TableCell className="text-center align-middle py-5">
                    {getStatusBadge(status)}
                </TableCell>
                <TableCell className="text-center align-middle py-5 px-6">
                    <div className="flex items-center justify-center gap-3">
                        {!isTerminated && (
                            <>
                                {status === 'PENDING' && (
                                    <Button
                                        size="sm"
                                        className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all text-[16px] border-none flex-shrink-0"
                                        onClick={() => handleStatusUpdate('SHORTLISTED')}
                                        disabled={isLoading}
                                    >
                                        Shortlist
                                    </Button>
                                )}
                                {status === 'SHORTLISTED' && (
                                    <Button
                                        size="sm"
                                        className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all text-[16px] border-none flex-shrink-0"
                                        asChild
                                    >
                                        <Link href={`/dashboard/proposals/negotiation/${application.jobId}/${application.id}`}>
                                            Finalise terms
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-10 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-all text-[16px] border-none flex-shrink-0"
                                    onClick={() => setShowRejectDialog(true)}
                                    disabled={isLoading}
                                >
                                    Reject
                                </Button>
                            </>
                        )}
                    </div>
                </TableCell>
            </TableRow>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Proposal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this proposal from {application.freelancer.username}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (Optional)</Label>
                            <Input
                                id="reason"
                                placeholder="Brief reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                maxLength={200}
                            />
                            <p className="text-xs text-muted-foreground">
                                This will be sent to the freelancer as a notification.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false)
                                setRejectReason("")
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isLoading}
                        >
                            {isLoading ? "Rejecting..." : "Confirm Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                amount={application.proposedBudget}
                merchantName={application.freelancer.username}
                itemName={`Project: ${application.id.slice(0, 8)}`}
            />
        </>
    )
}
