"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ArrowLeft, Clock, CheckCircle2, AlertCircle, History,
    Plus, X, Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format, isBefore, isAfter } from "date-fns"
import { PaymentModal } from "@/components/payment/payment-modal"
import {
    submitExecutionTerms,
    acceptExecutionTerms,
    finalConfirmNegotiation,
    rejectNegotiation,
    withdrawExecutionTerms,
} from "@/app/actions/negotiation"

interface Milestone {
    id?: string
    name: string
    amount: string
    deliveryDate: string
    releaseCondition: string
}

interface ExecVersion {
    id: string
    versionNumber: number
    createdBy: string
    startDate: Date | null
    deadline: Date | null
    finalBudget: number
    paymentStructure: string
    advancePercent: number
    paymentTimeline: string
    hourlyRate: number | null
    maxHoursPerWeek: number | null
    estimatedHours: number | null
    paymentFrequency: string | null
    hourApprovalMethod: string | null
    milestones: any[]
    phases: any[]
    changeReason?: string | null
    isActive: boolean
    createdAt: Date
}

interface Props {
    negotiation: {
        id: string
        status: string
        execConfirmedByClient: boolean
        execConfirmedByFreelancer: boolean
        job: any
        client: { username: string; avatarUrl: string | null }
        freelancer: { username: string; avatarUrl: string | null }
        scopeVersions: any[]
        executionVersions: ExecVersion[]
    }
    role: "client" | "freelancer"
    userId: string
    applicationId: string
}

export default function PlanClient({ negotiation, role, applicationId }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const versions = negotiation.executionVersions || []
    const activeVersion = versions.find(v => v.isActive) ?? versions[0] ?? null
    const [selectedVersionId, setSelectedVersionId] = useState(activeVersion?.id ?? '')
    const [showHistory, setShowHistory] = useState(false)
    const [showAgreement, setShowAgreement] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [reasonForChange, setReasonForChange] = useState('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    const currentVersion = versions.find(v => v.id === selectedVersionId) ?? activeVersion

    const isConfirmed = negotiation.status === 'CONFIRMED'
    const isRejected = negotiation.status === 'REJECTED'

    const myConfirmed = role === 'client'
        ? negotiation.execConfirmedByClient
        : negotiation.execConfirmedByFreelancer

    const isMilestoneBased = currentVersion?.paymentStructure?.toUpperCase() === 'MILESTONE'

    // Auto-enable edit mode if any milestones are missing dates
    useEffect(() => {
        const hasMissingDates = milestones.some(m => !m.deliveryDate);
        if (hasMissingDates && !isConfirmed && !isRejected && role === 'freelancer') {
            setEditMode(true);
        }
    }, [isConfirmed, isRejected, role]);

    // Fields from current version
    const [startDate, setStartDate] = useState(currentVersion?.startDate ? format(new Date(currentVersion.startDate), 'yyyy-MM-dd') : '')
    const [deadline, setDeadline] = useState(currentVersion?.deadline ? format(new Date(currentVersion.deadline), 'yyyy-MM-dd') : '')
    const [milestones, setMilestones] = useState<Milestone[]>(
        currentVersion?.milestones?.map(m => ({
            id: m.id,
            name: m.name,
            amount: String(m.amount),
            deliveryDate: m.deliveryDate ? format(new Date(m.deliveryDate), 'yyyy-MM-dd') : '',
            releaseCondition: m.releaseCondition ?? ''
        })) ?? []
    )

    // Auto-redirect based on status
    useEffect(() => {
        // 1. If still in early phases (Scope), go back
        const scopePhases = ['SCOPE_PENDING', 'SCOPE_CHANGE_REQUESTED']
        if (scopePhases.includes(negotiation.status)) {
            router.push(`/dashboard/proposals/negotiation/${negotiation.job.id}/${applicationId}/scope`)
        }

        // Only redirect to execution if status is explicitly EXEC_PENDING or SCOPE_CONFIRMED
        // and we haven't reached a state where plan is being negotiated.
        const executionPhases = ['SCOPE_CONFIRMED', 'EXEC_PENDING']
        if (executionPhases.includes(negotiation.status)) {
            router.push(`/dashboard/proposals/negotiation/${negotiation.job.id}/${applicationId}/execution`)
        }

        // 2. If project is already created, go to workspace
        if (negotiation.status === 'CONFIRMED') {
            router.push('/dashboard/projects/active')
        }
    }, [negotiation.status, negotiation.job.id, applicationId, router])

    // Sync selected version when a new one becomes active
    useEffect(() => {
        if (activeVersion?.id && !showHistory) {
            setSelectedVersionId(activeVersion.id);
        }
    }, [activeVersion?.id, showHistory]);

    // Sync fields when current version changes
    useEffect(() => {
        if (!currentVersion) return;
        setStartDate(currentVersion.startDate ? format(new Date(currentVersion.startDate), 'yyyy-MM-dd') : '');
        setDeadline(currentVersion.deadline ? format(new Date(currentVersion.deadline), 'yyyy-MM-dd') : '');
        setMilestones(currentVersion.milestones?.map(m => ({
            id: m.id,
            name: m.name,
            amount: String(m.amount),
            deliveryDate: m.deliveryDate ? format(new Date(m.deliveryDate), 'yyyy-MM-dd') : '',
            releaseCondition: m.releaseCondition ?? ''
        })) ?? []);
    }, [currentVersion?.id]);

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        EXEC_PENDING: { label: "Awaiting Execution Plan", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
        EXEC_COUNTER_SENT: { label: "Plan Counter Sent", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <AlertCircle className="h-3 w-3" /> },
        EXEC_WAITING_CONFIRMATION: { label: "Waiting Final Confirmation", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <Clock className="h-3 w-3" /> },
        CONFIRMED: { label: "Confirmed \u2713", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
        REJECTED: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: <X className="h-3 w-3" /> },
    }

    const cfg = statusConfig[negotiation.status] ?? statusConfig['EXEC_PENDING']

    const handleSubmitCounter = () => {
        // Validation: only items visible to the user must have a delivery date
        const visibleMilestones = isMilestoneBased
            ? milestones
            : milestones.filter(m => parseFloat(m.amount) === 0);

        const missingDates = visibleMilestones.some(m => !m.deliveryDate);
        if (missingDates) {
            toast.error("Please provide delivery dates for all items.");
            return;
        }

        const missingNames = visibleMilestones.some(m => !m.name);
        if (missingNames) {
            toast.error("Please provide names for all items.");
            return;
        }

        startTransition(async () => {
            try {
                // If not milestone based, auto-assign the latest deliverable date to the hidden payment milestone
                const finalMilestones = milestones.map(m => {
                    if (!isMilestoneBased && parseFloat(m.amount) > 0 && !m.deliveryDate) {
                        const otherDates = milestones
                            .filter(x => x.deliveryDate && x !== m)
                            .map(x => new Date(x.deliveryDate));

                        if (otherDates.length > 0) {
                            const latestDate = new Date(Math.max(...otherDates.map(d => d.getTime())));
                            return { ...m, deliveryDate: format(latestDate, 'yyyy-MM-dd') };
                        }
                        return { ...m, deliveryDate: deadline || format(new Date(), 'yyyy-MM-dd') };
                    }
                    return m;
                });

                // Keep existing financial terms from current version
                await submitExecutionTerms(negotiation.id, {
                    startDate: startDate || undefined,
                    deadline: deadline || undefined,
                    finalBudget: currentVersion?.finalBudget ?? 0,
                    paymentStructure: currentVersion?.paymentStructure ?? 'full',
                    advancePercent: currentVersion?.advancePercent ?? 0,
                    paymentTimeline: currentVersion?.paymentTimeline ?? '7days',
                    hourlyRate: currentVersion?.hourlyRate ?? undefined,
                    maxHoursPerWeek: currentVersion?.maxHoursPerWeek ?? undefined,
                    estimatedHours: currentVersion?.estimatedHours ?? undefined,
                    paymentFrequency: currentVersion?.paymentFrequency ?? undefined,
                    hourApprovalMethod: currentVersion?.hourApprovalMethod ?? undefined,
                    changeReason: "Updated execution plan",
                    milestones: finalMilestones.map(m => ({
                        name: m.name,
                        amount: parseFloat(m.amount) || 0,
                        deliveryDate: m.deliveryDate || undefined,
                        releaseCondition: m.releaseCondition || undefined,
                    })),
                })
                setEditMode(false)
                toast.success("Plan updated.")
                router.refresh()
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const handleAccept = () => {
        startTransition(async () => {
            try {
                const result = await acceptExecutionTerms(negotiation.id)
                if (result.bothConfirmed) {
                    setShowAgreement(true)
                } else {
                    toast.success("Plan accepted. Waiting for other party.")
                    router.refresh()
                }
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const handleFinalConfirm = () => {
        const structure = currentVersion?.paymentStructure?.toLowerCase()
        const isAdvance = structure === 'advance' || structure === 'advance_final'

        if (isAdvance && currentVersion?.advancePercent > 0 && role === 'client') {
            toast.info("Preparing advance payment...")
            setShowPaymentModal(true)
            return
        }

        startTransition(async () => {
            try {
                await finalConfirmNegotiation(negotiation.id)
                toast.success("Project workspace created!")
                router.push('/dashboard/projects/active')
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false)
        startTransition(async () => {
            try {
                await finalConfirmNegotiation(negotiation.id)
                toast.success("Advance paid! Project workspace created.")
                router.push('/dashboard/projects/active')
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const handleReject = () => {
        setShowRejectDialog(true)
    }

    const handleConfirmReject = () => {
        if (!rejectionReason) {
            toast.error("Please provide a reason")
            return
        }
        startTransition(async () => {
            try {
                await rejectNegotiation(negotiation.id, rejectionReason)
                toast.success(role === 'client' ? "Candidate rejected" : "Negotiation withdrawn")
                router.push(`/dashboard/proposals/negotiation/${negotiation.job.id}`)
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const isEditable = editMode && !isConfirmed && !isRejected

    return (
        <div className="min-h-screen bg-slate-50/60 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href={`/dashboard/proposals/negotiation/${negotiation.job.id}/${applicationId}/execution`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Payment Terms
                    </Link>
                    <div className="h-5 w-px bg-slate-200" />
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-slate-900 text-lg truncate">{negotiation.job.title}</h1>
                        <p className="text-sm text-slate-500">
                            with {role === 'client' ? negotiation.freelancer.username : negotiation.client.username}
                        </p>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        Scope Confirmed
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        Payment Terms Confirmed
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-black">3</span>
                        Step 3: Define Execution Plan & Timeline
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-5">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-4 px-5 flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30">
                        <CardTitle className="text-base font-semibold text-slate-800">Execution Plan</CardTitle>
                        <div className="flex items-center gap-4 text-[13px]">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
                                <span className="text-slate-400 font-medium uppercase text-[10px]">Start:</span>
                                <span className="text-slate-700 font-bold">{startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
                                <span className="text-slate-400 font-medium uppercase text-[10px]">Deadline:</span>
                                <span className="text-slate-700 font-bold text-indigo-600">{deadline ? format(new Date(deadline), 'MMM d, yyyy') : 'TBD'}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4 px-5 pt-0 space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900 mb-1">
                                        {(() => {
                                            if (role === 'client') {
                                                if (!currentVersion?.milestones?.some(m => m.deliveryDate)) return "Waiting for Freelancer";
                                                if (currentVersion?.createdBy === 'client') return "Awaiting Freelancer Approval";
                                                return "Plan Received";
                                            } else {
                                                if (!currentVersion?.milestones?.some(m => m.deliveryDate)) return "Draft Your Plan";
                                                if (currentVersion?.createdBy === 'freelancer') return "Awaiting Client Approval";
                                                return "Counter-Offer Received";
                                            }
                                        })()}
                                    </p>
                                    <p className="text-[13px] text-blue-700 leading-relaxed">
                                        {(() => {
                                            if (role === 'client') {
                                                if (!currentVersion?.milestones?.some(m => m.deliveryDate))
                                                    return "Waiting for the freelancer to draft the execution plan and delivery dates.";
                                                if (currentVersion?.createdBy === 'client')
                                                    return "You have countered with your own dates. Waiting for the freelancer to accept or counter back.";
                                                return "Please review the proposed execution timeline. You can accept it to start the project or counter with your own dates.";
                                            } else {
                                                if (!currentVersion?.milestones?.some(m => m.deliveryDate))
                                                    return "Please fill in the delivery dates for each agreed milestone below. This is required to finalize the negotiation.";
                                                if (currentVersion?.createdBy === 'freelancer')
                                                    return "You have submitted the execution plan. Waiting for the client to review and accept.";
                                                return "The client has countered your plan with new dates. Please review and accept, or counter again.";
                                            }
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                                            {isMilestoneBased ? "Milestone" : "Deliverable Item"}
                                        </th>
                                        {isMilestoneBased && (
                                            <>
                                                <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Weightage (%)</th>
                                                <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Amount (₹)</th>
                                            </>
                                        )}
                                        {!isMilestoneBased && (
                                            <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Description</th>
                                        )}
                                        <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Delivery Date</th>
                                        {isEditable && !isMilestoneBased && <th className="px-4 py-3 w-10" />}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(isMilestoneBased ? milestones : milestones.filter(m => parseFloat(m.amount) === 0)).map((m, i) => {
                                        const actualIndex = milestones.findIndex((x, idx) => isMilestoneBased ? idx === i : (x.name === m.name && parseFloat(x.amount) === 0));
                                        const isDateInvalid = m.deliveryDate && startDate && deadline && (isBefore(new Date(m.deliveryDate), new Date(startDate)) || isAfter(new Date(m.deliveryDate), new Date(deadline)));

                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                                <td className="px-4 py-2.5">
                                                    <Input
                                                        value={m.name}
                                                        onChange={(e) => setMilestones(p => p.map((x, idx) => idx === actualIndex ? { ...x, name: e.target.value } : x))}
                                                        disabled={!isEditable || isMilestoneBased}
                                                        className={`h-8 text-[13px] border-slate-200 bg-transparent ${isMilestoneBased ? 'font-bold' : ''}`}
                                                        placeholder={isMilestoneBased ? "Milestone name" : "Deliverable title..."}
                                                    />
                                                </td>
                                                {isMilestoneBased && (
                                                    <>
                                                        <td className="px-4 py-2.5 text-slate-600 font-medium">
                                                            {((parseFloat(m.amount) / (currentVersion?.finalBudget || 1)) * 100).toFixed(1)}%
                                                        </td>
                                                        <td className="px-4 py-2.5 text-slate-600 font-bold">
                                                            ₹{parseFloat(m.amount).toLocaleString()}
                                                        </td>
                                                    </>
                                                )}
                                                {!isMilestoneBased && (
                                                    <td className="px-4 py-2.5">
                                                        <Input
                                                            value={m.releaseCondition}
                                                            onChange={(e) => setMilestones(p => p.map((x, idx) => idx === actualIndex ? { ...x, releaseCondition: e.target.value } : x))}
                                                            disabled={!isEditable}
                                                            className="h-8 text-[13px] border-slate-200 bg-transparent"
                                                            placeholder="What will be delivered?"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-4 py-2.5">
                                                    <div className="space-y-1 relative">
                                                        {isEditable ? (
                                                            <div className="relative group">
                                                                <Input
                                                                    type="date"
                                                                    value={m.deliveryDate}
                                                                    onChange={(e) => setMilestones(p => p.map((x, idx) => idx === actualIndex ? { ...x, deliveryDate: e.target.value } : x))}
                                                                    className={`h-9 text-[13px] border-slate-200 bg-white w-full transition-all cursor-pointer ${!m.deliveryDate ? "text-transparent" : "text-slate-900"} ${isDateInvalid ? "border-red-500 focus:ring-red-500" : "hover:border-blue-400"}`}
                                                                />
                                                                {!m.deliveryDate && (
                                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-blue-50/50 rounded-lg">
                                                                        <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                                                                            <Plus className="h-3 w-3" /> Add Date
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="font-medium text-slate-700">{m.deliveryDate ? format(new Date(m.deliveryDate), "MMM d, yyyy") : '—'}</p>
                                                        )}
                                                        {isDateInvalid && <p className="text-[10px] text-red-500 font-medium">Out of project range</p>}
                                                    </div>
                                                </td>
                                                {isEditable && !isMilestoneBased && (
                                                    <td className="px-4 py-2.5">
                                                        <button onClick={() => setMilestones(p => p.filter((_, idx) => idx !== actualIndex))} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {(isMilestoneBased ? milestones : milestones.filter(m => parseFloat(m.amount) === 0)).length === 0 && (
                                        <tr>
                                            <td colSpan={isMilestoneBased ? 4 : (isEditable ? 4 : 3)} className="px-4 py-8 text-center text-slate-400 italic text-[13px]">
                                                {isMilestoneBased ? "Loading milestones..." : "No delivery items added yet."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {isEditable && !isMilestoneBased && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-[12px] text-indigo-600 hover:bg-indigo-50 gap-1.5"
                                onClick={() => setMilestones(p => [...p, { id: crypto.randomUUID(), name: '', amount: '0', deliveryDate: '', releaseCondition: '' }])}
                            >
                                <Plus className="h-3.5 w-3.5" />Add Item
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Reason card removed */}
            </div>

            {/* Sticky Action Bar */}
            {!isConfirmed && !isRejected && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 shadow-2xl">
                    <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col text-sm text-slate-500">
                            <p>v{currentVersion?.versionNumber} \u00b7 {currentVersion?.createdBy}</p>
                        </div>
                        <div className="flex gap-2">
                            {editMode ? (
                                <>
                                    <Button
                                        className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-8 shadow-md shadow-blue-100"
                                        onClick={handleSubmitCounter}
                                        disabled={isPending}
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (role === 'freelancer' ? "Submit" : "Submit Plan")}
                                    </Button>
                                    <Button variant="destructive" className="font-bold px-6" onClick={handleReject} disabled={isPending}>
                                        {role === 'client' ? "Reject Candidate" : "Withdraw Proposal"}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {!isConfirmed && !isRejected && (
                                        <>
                                            {/* Client Buttons */}
                                            {role === 'client' && (
                                                <>
                                                    {currentVersion?.milestones?.some(m => m.deliveryDate) ? (
                                                        <>
                                                            {(!myConfirmed || negotiation.status === 'EXEC_WAITING_CONFIRMATION') && (
                                                                <Button className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-6" onClick={handleAccept} disabled={isPending}>
                                                                    Accept
                                                                </Button>
                                                            )}
                                                            {currentVersion?.createdBy?.toLowerCase() !== 'client' && (
                                                                <Button className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-6 shadow-md shadow-blue-100" onClick={() => setEditMode(true)} disabled={isPending}>
                                                                    Counter
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : null}
                                                    <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                                                        Reject Candidate
                                                    </Button>
                                                </>
                                            )}

                                            {/* Freelancer Buttons */}
                                            {role === 'freelancer' && (
                                                <>
                                                    {currentVersion && currentVersion.createdBy?.toLowerCase() === 'client' ? (
                                                        <>
                                                            {currentVersion?.milestones?.some(m => m.deliveryDate) && (
                                                                <Button className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-6" onClick={handleAccept} disabled={isPending}>
                                                                    Accept Plan
                                                                </Button>
                                                            )}
                                                            <Button className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-6 shadow-md shadow-blue-100" onClick={() => setEditMode(true)} disabled={isPending}>
                                                                {currentVersion?.milestones?.some(m => m.deliveryDate) ? "Counter" : "Add Execution Plan"}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        (!currentVersion?.milestones?.some(m => m.deliveryDate) || currentVersion?.createdBy?.toLowerCase() !== 'freelancer') && (
                                                            <Button className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-8 shadow-md shadow-blue-100" onClick={() => setEditMode(true)} disabled={isPending}>
                                                                {currentVersion?.milestones?.some(m => m.deliveryDate) ? "Submit" : "Add Execution Plan"}
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                                                        {(currentVersion?.milestones?.some(m => m.deliveryDate) && currentVersion?.createdBy?.toLowerCase() === 'freelancer') ? "Withdraw" : "Withdraw Proposal"}
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                    {negotiation.status === 'EXEC_WAITING_CONFIRMATION' && myConfirmed && currentVersion?.milestones?.some(m => m.deliveryDate) && (
                                        <Button className="bg-black text-white" onClick={() => setShowAgreement(true)}>
                                            Review Summary
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Agreement Dialog (Simplified) */}
            <Dialog open={showAgreement} onOpenChange={setShowAgreement}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Final Agreement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            You are about to finalize the negotiation and start the project. This will create a project workspace and lock all terms.
                        </p>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-[10px] text-slate-400 uppercase font-black">Final Budget</p>
                            <p className="text-lg font-bold text-slate-900">₹{activeVersion?.finalBudget.toLocaleString()}</p>
                        </div>
                        <Button className="w-full bg-indigo-600 text-white h-10 font-bold" onClick={handleFinalConfirm} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Start Project
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{role === 'client' ? 'Reject Candidate' : 'Withdraw Proposal'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</Label>
                            <Textarea
                                className="resize-none min-h-[100px]"
                                placeholder="Explain why you are rejecting..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleConfirmReject} disabled={isPending}>
                                Confirm {role === 'client' ? 'Rejection' : 'Withdrawal'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Payment Modal */}
            {currentVersion && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={currentVersion.finalBudget * (currentVersion.advancePercent / 100)}
                    merchantName="Truework Marketplace"
                    itemName={`Advance Payment for: ${negotiation.job.title}`}
                />
            )}
        </div>
    )
}
