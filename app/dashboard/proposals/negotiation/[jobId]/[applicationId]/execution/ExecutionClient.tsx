"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ArrowLeft, Clock, CheckCircle2, AlertCircle, History,
    Plus, X, Loader2, GitCompare
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
import { Checkbox } from "@/components/ui/checkbox"
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

interface Phase {
    name: string
    date: string
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

type PaymentStructure = "full" | "advance" | "milestone"

export default function ExecutionClient({ negotiation, role, applicationId }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const versions = negotiation.executionVersions || []
    const activeVersion = versions.find(v => v.isActive) ?? versions[0] ?? null
    const [selectedVersionId, setSelectedVersionId] = useState(activeVersion?.id ?? '')
    const [showHistory, setShowHistory] = useState(false)
    const [showAgreement, setShowAgreement] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [reasonForChange, setReasonForChange] = useState('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showCompare, setShowCompare] = useState(false)

    const currentVersion = versions.find(v => v.id === selectedVersionId) ?? activeVersion

    const budgetType: "FIXED" | "HOURLY" = negotiation.job.budgetType ?? 'FIXED'
    const isConfirmed = negotiation.status === 'CONFIRMED'
    const isRejected = negotiation.status === 'REJECTED'
    const isWaiting = negotiation.status === 'EXEC_WAITING_CONFIRMATION'

    const myConfirmed = role === 'client'
        ? negotiation.execConfirmedByClient
        : negotiation.execConfirmedByFreelancer

    const mapPaymentStructure = (val: string | null | undefined): PaymentStructure => {
        if (!val) return 'full'
        const v = val.toUpperCase()
        if (v === 'MILESTONE') return 'milestone'
        if (v === 'ADVANCE_FINAL') return 'advance'
        if (v === 'POST_COMPLETION') return 'full'

        const vl = val.toLowerCase()
        if (vl === 'milestone') return 'milestone'
        if (vl === 'advance') return 'advance'
        return 'full'
    }

    // Fields
    const [finalBudget, setFinalBudget] = useState(String(currentVersion?.finalBudget ?? negotiation.job.budget ?? 0))
    const [paymentStructure, setPaymentStructure] = useState<PaymentStructure>(mapPaymentStructure(currentVersion?.paymentStructure ?? negotiation.job.paymentStructure))
    const [advancePercent, setAdvancePercent] = useState(String(currentVersion?.advancePercent ?? negotiation.job.advancePercentage ?? 0))
    const [startDate, setStartDate] = useState(currentVersion?.startDate ? format(new Date(currentVersion.startDate), 'yyyy-MM-dd') : negotiation.job.expectedStartDate ? format(new Date(negotiation.job.expectedStartDate), 'yyyy-MM-dd') : '')
    const [deadline, setDeadline] = useState(currentVersion?.deadline ? format(new Date(currentVersion.deadline), 'yyyy-MM-dd') : negotiation.job.deadline ? format(new Date(negotiation.job.deadline), 'yyyy-MM-dd') : '')
    const [paymentTimeline, setPaymentTimeline] = useState(currentVersion?.paymentTimeline ?? negotiation.job.paymentTimeline ?? '7days')
    const [hourlyRate, setHourlyRate] = useState(String(currentVersion?.hourlyRate ?? negotiation.job.hourlyRateMin ?? ''))
    const [maxHours, setMaxHours] = useState(String(currentVersion?.maxHoursPerWeek ?? negotiation.job.maxHoursPerWeek ?? ''))
    const [totalHours, setTotalHours] = useState(String(currentVersion?.estimatedHours ?? negotiation.job.estimatedTotalHours ?? ''))
    const [payFrequency, setPayFrequency] = useState(currentVersion?.paymentFrequency ?? negotiation.job.paymentFrequency ?? 'weekly')
    const [approvalMethod, setApprovalMethod] = useState(currentVersion?.hourApprovalMethod ?? negotiation.job.hourApprovalMethod ?? 'timesheet')

    const [milestones, setMilestones] = useState<Milestone[]>(
        currentVersion?.milestones?.map(m => ({
            id: m.id,
            name: m.name,
            amount: String(((parseFloat(m.amount) || 0) / (currentVersion?.finalBudget || negotiation.job.budget || 1) * 100).toFixed(1)),
            deliveryDate: m.deliveryDate ? format(new Date(m.deliveryDate), 'yyyy-MM-dd') : '',
            releaseCondition: m.releaseCondition ?? ''
        })) ?? (negotiation.job.proposedMilestones as any[])?.map((m: any) => ({
            id: '',
            name: m.name || '',
            amount: String(((parseFloat(m.amount) || 0) / (negotiation.job.budget || 1) * 100).toFixed(1)),
            deliveryDate: '',
            releaseCondition: m.description || ''
        })) ?? []
    )
    const [phases, setPhases] = useState<Phase[]>(
        Array.isArray(currentVersion?.phases) ? currentVersion.phases : []
    )

    // Sync fields when version changes (History browsing)
    useEffect(() => {
        if (!currentVersion) return;
        setFinalBudget(String(currentVersion.finalBudget));
        setPaymentStructure(mapPaymentStructure(currentVersion.paymentStructure));
        setAdvancePercent(String(currentVersion.advancePercent));
        setStartDate(currentVersion.startDate ? format(new Date(currentVersion.startDate), 'yyyy-MM-dd') : '');
        setDeadline(currentVersion.deadline ? format(new Date(currentVersion.deadline), 'yyyy-MM-dd') : '');
        setPaymentTimeline(currentVersion.paymentTimeline);
        setHourlyRate(String(currentVersion.hourlyRate ?? ''));
        setMaxHours(String(currentVersion.maxHoursPerWeek ?? ''));
        setTotalHours(String(currentVersion.estimatedHours ?? ''));
        setPayFrequency(currentVersion.paymentFrequency ?? 'weekly');
        setApprovalMethod(currentVersion.hourApprovalMethod ?? 'timesheet');
        if (currentVersion.milestones) {
            setMilestones(currentVersion.milestones.map(m => ({
                id: m.id,
                name: m.name,
                amount: String(((parseFloat(m.amount) || 0) / (currentVersion.finalBudget || 1) * 100).toFixed(1)),
                deliveryDate: m.deliveryDate ? format(new Date(m.deliveryDate), 'yyyy-MM-dd') : '',
                releaseCondition: m.releaseCondition ?? ''
            })));
        }
    }, [currentVersion?.id])

    // Auto-redirect based on status
    useEffect(() => {
        // 1. If still in scope phase, go back
        const scopePhases = ['SCOPE_PENDING', 'SCOPE_CHANGE_REQUESTED']
        if (scopePhases.includes(negotiation.status)) {
            router.push(`/dashboard/proposals/negotiation/${negotiation.job.id}/${applicationId}/scope`)
        }

        // 2. If terms are finalized (both accepted), OR if a plan version exists, go to Plan
        const hasDates = activeVersion?.milestones?.some(m => !!m.deliveryDate)
        if (negotiation.status === 'EXEC_WAITING_CONFIRMATION' || (negotiation.status === 'EXEC_COUNTER_SENT' && hasDates)) {
            router.push(`/dashboard/proposals/negotiation/${negotiation.job.id}/${applicationId}/plan`)
        }

        // 3. If project is created, go to workspace
        if (negotiation.status === 'CONFIRMED') {
            router.push('/dashboard/projects/active')
        }
    }, [negotiation.status, negotiation.job.id, applicationId, router])




    const budget = parseFloat(finalBudget) || 0
    const advPct = parseFloat(advancePercent) || 0
    const advanceAmount = ((advPct / 100) * budget).toFixed(2)
    const finalAmount = (budget - parseFloat(advanceAmount)).toFixed(2)

    // For milestones, 'amount' field in state stores the percentage
    const milestonePercentageTotal = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0)
    const milestoneValid = paymentStructure === 'milestone'
        ? Math.abs(milestonePercentageTotal - 100) < 0.01
        : true

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        SCOPE_PENDING: { label: "Scope Awaiting Other Party", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3" /> },
        SCOPE_CONFIRMED: { label: "Awaiting Terms", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
        EXEC_PENDING: { label: "Awaiting Terms", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
        EXEC_COUNTER_SENT: { label: "Counter Offer Sent", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <AlertCircle className="h-3 w-3" /> },
        EXEC_WAITING_CONFIRMATION: { label: "Waiting Final Confirmation", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <Clock className="h-3 w-3" /> },
        CONFIRMED: { label: "Confirmed — Project Created", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
        REJECTED: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: <X className="h-3 w-3" /> },
    }

    const cfg = statusConfig[negotiation.status] ?? statusConfig['EXEC_PENDING']

    const handleSubmitCounter = () => {
        startTransition(async () => {
            try {
                await submitExecutionTerms(negotiation.id, {
                    startDate: startDate || undefined,
                    deadline: deadline || undefined,
                    finalBudget: budget,
                    paymentStructure,
                    advancePercent: advPct,
                    paymentTimeline,
                    hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                    maxHoursPerWeek: maxHours ? parseInt(maxHours) : undefined,
                    estimatedHours: totalHours ? parseInt(totalHours) : undefined,
                    paymentFrequency: payFrequency,
                    hourApprovalMethod: approvalMethod,
                    changeReason: reasonForChange,
                    milestones: milestones.map(m => ({
                        name: m.name,
                        amount: paymentStructure === 'milestone'
                            ? (parseFloat(m.amount) / 100) * budget
                            : parseFloat(m.amount) || 0,
                        deliveryDate: m.deliveryDate || undefined,
                        releaseCondition: m.releaseCondition || undefined,
                    })),
                })
                setEditMode(false)
                setReasonForChange('')
                toast.success("Counter offer submitted.")
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
                toast.success("Terms accepted. Proceeding to Execution Plan.")
                router.push(`/dashboard/proposals/negotiation/${negotiation.job.id}/${applicationId}/plan`)
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

    const handleWithdraw = () => {
        startTransition(async () => {
            try {
                await withdrawExecutionTerms(negotiation.id)
                toast.success("Terms withdrawn")
                setEditMode(false)
                router.refresh()
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const isEditable = editMode && !isConfirmed && !isRejected

    return (
        <div className="min-h-screen bg-slate-50/60 pb-24">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href={`../${applicationId}/scope`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Scope
                    </Link>
                    <div className="h-5 w-px bg-slate-200" />
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-slate-900 text-lg truncate">{negotiation.job.title}</h1>
                        <p className="text-sm text-slate-500">
                            with {role === 'client' ? negotiation.freelancer.username : negotiation.client.username}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                        </Badge>
                        <Badge variant="outline" className="px-2.5 py-1 text-[11px] font-bold text-slate-600 uppercase">
                            v{currentVersion?.versionNumber ?? 1}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* ── Step Indicator ── */}
            <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        Step 1: Scope Confirmed
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black">2</span>
                        Step 2: Payment & Financial Terms
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="flex items-center gap-2 text-sm text-slate-400 px-3 py-1.5 rounded-full">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-black">3</span>
                        Step 3: Execution Plan
                    </span>
                </div>
            </div>

            {/* ── Main ── */}
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-5">

                {/* My confirmation status */}
                {!isConfirmed && !isRejected && myConfirmed && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-blue-700 font-medium">You have accepted the terms. Waiting for the other party.</p>
                    </div>
                )}

                {/* Version Panel */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="py-4 px-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Version</p>
                                    <Badge variant="outline" className="font-bold text-slate-700 text-[12px] px-2 py-0.5">v{currentVersion?.versionNumber}</Badge>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">By</p>
                                    <p className="font-medium text-slate-700 text-[13px] capitalize">{currentVersion?.createdBy}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Waiting On</p>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-semibold px-2 py-0.5 text-[11px] uppercase">
                                        {role === 'client' ? 'Freelancer' : 'Client'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isConfirmed && !isRejected && !myConfirmed && activeVersion?.createdBy !== role && (
                                    <Button size="sm" variant="outline" className="h-8 px-3 text-[12px] border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold" onClick={() => setEditMode(true)}>
                                        Counter Offer
                                    </Button>
                                )}
                                <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                                    <SelectTrigger className="h-8 w-[90px] text-[13px] font-medium border-slate-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {versions.map(v => <SelectItem key={v.id} value={v.id}>v{v.versionNumber}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" variant="outline" className="h-8 px-3 text-[12px] border-slate-200 gap-1.5" onClick={() => setShowHistory(true)}>
                                    <History className="h-3.5 w-3.5" />
                                    History
                                </Button>
                                {versions.length > 1 && (
                                    <Button size="sm" variant="outline" className="h-8 px-3 text-[12px] border-slate-200 gap-1.5" onClick={() => setShowCompare(true)}>
                                        <GitCompare className="h-3.5 w-3.5" />
                                        Compare
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 1 — Timeline */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-5">
                        <CardTitle className="text-base font-semibold text-slate-800">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5 pt-0">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">Project Start Date</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!isEditable} className="h-10 text-sm border-slate-200 bg-slate-50 focus:bg-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">Final Deadline</Label>
                                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={!isEditable} className="h-10 text-sm border-slate-200 bg-slate-50 focus:bg-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2 — Financial */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-5">
                        <CardTitle className="text-base font-semibold text-slate-800">Financial Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5 pt-0 space-y-6">
                        {budgetType === 'FIXED' ? (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">Final Budget (₹)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                                        <Input type="number" value={finalBudget} onChange={(e) => setFinalBudget(e.target.value)} disabled={!isEditable} className="h-10 pl-7 text-sm border-slate-200 bg-slate-50 focus:bg-white font-semibold" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">Payment Structure</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(["full", "advance", "milestone"] as PaymentStructure[]).map((opt) => (
                                            <div key={opt} onClick={() => { if (isEditable) setPaymentStructure(opt) }}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentStructure === opt ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"} ${!isEditable ? "cursor-not-allowed opacity-70" : ""}`}>
                                                <p className="font-bold text-sm text-slate-800">
                                                    {opt === "full" && "100% After"}{opt === "advance" && "Advance + Final"}{opt === "milestone" && "Milestone-Based"}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    {opt === "full" && "Pay on completion"}{opt === "advance" && "Split upfront & final"}{opt === "milestone" && "Pay per milestone"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {paymentStructure === 'advance' && (
                                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <div className="space-y-1.5">
                                            <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">Advance %</Label>
                                            <Input type="number" min={0} max={100} value={advancePercent} onChange={(e) => setAdvancePercent(e.target.value)} disabled={!isEditable} className="h-9 text-sm border-slate-200 bg-white w-36" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider">Advance</p>
                                                <p className="text-lg font-black text-amber-800">₹{advanceAmount}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Final</p>
                                                <p className="text-lg font-black text-emerald-800">₹{finalAmount}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentStructure === 'milestone' && (
                                    <div className="space-y-3">
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Milestone</th>
                                                        <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold w-24">Weightage (%)</th>
                                                        <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold w-32">Preview (₹)</th>
                                                        <th className="text-left px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Release Condition</th>
                                                        {isEditable && <th className="px-4 py-3 w-10" />}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {milestones.map((m, i) => {
                                                        const pAmount = ((parseFloat(m.amount) || 0) / 100) * budget;
                                                        return (
                                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                                                <td className="px-4 py-2.5">
                                                                    <Input value={m.name} onChange={(e) => setMilestones(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} disabled={!isEditable} className="h-8 text-[13px] border-slate-200 bg-transparent" placeholder={`Milestone ${i + 1}`} />
                                                                </td>
                                                                <td className="px-4 py-2.5">
                                                                    <div className="relative">
                                                                        <Input type="number" value={m.amount} onChange={(e) => setMilestones(p => p.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))} disabled={!isEditable} className="h-8 pr-5 text-[13px] border-slate-200 bg-transparent w-full" />
                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2.5 text-slate-600 font-medium">
                                                                    ₹{pAmount.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-2.5">
                                                                    <Input value={m.releaseCondition} onChange={(e) => setMilestones(p => p.map((x, idx) => idx === i ? { ...x, releaseCondition: e.target.value } : x))} disabled={!isEditable} className="h-8 text-[13px] border-slate-200 bg-transparent" />
                                                                </td>
                                                                {isEditable && (
                                                                    <td className="px-4 py-2.5">
                                                                        <button onClick={() => setMilestones(p => p.filter((_, idx) => idx !== i))} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50">
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            {isEditable && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-3 text-[12px] text-indigo-600 hover:bg-indigo-50 gap-1.5"
                                                    onClick={() => setMilestones(p => [...p, { name: '', amount: '', deliveryDate: '', releaseCondition: '' }])}
                                                    disabled={milestonePercentageTotal >= 100}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />Add Milestone
                                                </Button>
                                            )}
                                            <div className={`text-sm font-bold ml-auto ${milestoneValid ? "text-emerald-600" : "text-amber-500"}`}>
                                                {milestonePercentageTotal.toFixed(1)}% / 100% {!milestoneValid && "⚠ Must total 100%"}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-5">
                                {[
                                    { label: "Hourly Rate (₹)", value: hourlyRate, setter: setHourlyRate, prefix: "₹" },
                                    { label: "Max Hours / Week", value: maxHours, setter: setMaxHours },
                                    { label: "Estimated Total Hours", value: totalHours, setter: setTotalHours },
                                ].map(({ label, value, setter, prefix }) => (
                                    <div key={label} className="space-y-1.5">
                                        <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">{label}</Label>
                                        <div className="relative">
                                            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">{prefix}</span>}
                                            <Input type="number" value={value} onChange={(e) => setter(e.target.value)} disabled={!isEditable} className={`h-10 text-sm border-slate-200 bg-slate-50 focus:bg-white ${prefix ? 'pl-7' : ''}`} />
                                        </div>
                                    </div>
                                ))}
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">Payment Frequency</Label>
                                    <Select value={payFrequency} onValueChange={setPayFrequency} disabled={!isEditable}>
                                        <SelectTrigger className="h-10 text-sm border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">Hour Approval</Label>
                                    <Select value={approvalMethod} onValueChange={setApprovalMethod} disabled={!isEditable}>
                                        <SelectTrigger className="h-10 text-sm border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="timesheet">Timesheet</SelectItem>
                                            <SelectItem value="screenshot">Screenshots</SelectItem>
                                            <SelectItem value="manual">Manual Approval</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>


                {/* Section 3 — Development Phases deleted as not used */}


                {/* Counter Reason (if editing) - MOVED TO BOTTOM */}
                {editMode && (
                    <Card className="shadow-sm border-indigo-200 bg-indigo-50/30">
                        <CardHeader className="py-3 px-5">
                            <CardTitle className="text-sm font-bold text-indigo-900 uppercase tracking-tight">Clarify your changes (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-5 pt-0">
                            <Textarea
                                className="resize-none min-h-[80px] text-sm bg-white border-indigo-100 focus:border-indigo-300 ring-indigo-50"
                                placeholder="Explain why you are requesting these execution terms..."
                                value={reasonForChange}
                                onChange={(e) => setReasonForChange(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Confirmed Banner */}
                {isConfirmed && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-emerald-800">Agreement Confirmed — Project workspace created!</p>
                            <p className="text-xs text-emerald-600 mt-0.5">All negotiation versions are locked. The project is now active.</p>
                        </div>
                        <Button className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-5 text-sm rounded-lg flex-shrink-0" asChild>
                            <Link href="/dashboard/projects/active">View Project →</Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Sticky Action Bar ── */}
            {!isConfirmed && !isRejected && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 shadow-2xl">
                    <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                            <p className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                v{currentVersion?.versionNumber} by {currentVersion?.createdBy}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
                                {(() => {
                                    if (negotiation.status === 'EXEC_WAITING_CONFIRMATION') return "Ready for Final Confirmation";
                                    if (myConfirmed) return "Waiting on Other Party";
                                    const IAmRequester = currentVersion?.createdBy === role;
                                    return IAmRequester ? "Waiting on Other Party" : "Waiting on You";
                                })()}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {editMode ? (
                                <>
                                    <Button size="sm" variant="outline" className="h-9 px-4 text-sm" onClick={() => setEditMode(false)} disabled={isPending}>Cancel</Button>
                                    <Button
                                        size="sm"
                                        className="h-9 px-5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg border-none"
                                        onClick={handleSubmitCounter}
                                        disabled={isPending || !milestoneValid}
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Counter Offer →"}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {negotiation.status === 'EXEC_WAITING_CONFIRMATION' ? (
                                        <Button size="sm" className="h-9 px-6 text-sm font-bold bg-slate-900 hover:bg-black text-white rounded-lg border-none" onClick={() => setShowAgreement(true)} disabled={isPending}>
                                            Complete Final Review →
                                        </Button>
                                    ) : (
                                        <>
                                            {(() => {
                                                const IAmRequester = currentVersion?.createdBy === role;

                                                // Special case: If I created the execution version and the other party has already confirmed,
                                                // I should be able to confirm my own terms to complete the negotiation
                                                const canConfirmOwnTerms = IAmRequester &&
                                                    (role === 'freelancer' ? negotiation.execConfirmedByClient : negotiation.execConfirmedByFreelancer);

                                                if (IAmRequester && !canConfirmOwnTerms) {
                                                    // I sent this version
                                                    return (
                                                        <Button size="sm" variant="destructive" className="h-9 px-4 text-sm font-bold rounded-lg" onClick={handleReject} disabled={isPending}>
                                                            {role === 'client' ? "Reject Candidate" : "Withdraw Proposal"}
                                                        </Button>
                                                    );
                                                } else if (IAmRequester && canConfirmOwnTerms) {
                                                    // I created this version and other party confirmed
                                                    return (
                                                        <Button size="sm" className="h-9 px-6 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border-none" onClick={handleAccept} disabled={isPending}>
                                                            Confirm My Terms
                                                        </Button>
                                                    );
                                                } else {
                                                    // I received this version
                                                    return (
                                                        <>
                                                            {!myConfirmed && (
                                                                <>
                                                                    <Button size="sm" className="h-9 px-4 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none" onClick={() => setEditMode(true)} disabled={isPending}>
                                                                        Counter Offer
                                                                    </Button>
                                                                    <Button size="sm" className="h-9 px-6 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border-none" onClick={handleAccept} disabled={isPending}>
                                                                        Accept Terms
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button size="sm" variant="destructive" className="h-9 px-4 text-sm font-bold rounded-lg" onClick={handleReject} disabled={isPending}>
                                                                {role === 'client' ? "Reject Candidate" : "Withdraw Proposal"}
                                                            </Button>
                                                        </>
                                                    );
                                                }
                                            })()}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Reason Header (if exists for current version) */}
            {!editMode && currentVersion?.changeReason && (
                <div className="max-w-5xl mx-auto px-6 pt-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 shadow-sm">
                        <AlertCircle className="h-5 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] font-black text-indigo-800 uppercase tracking-widest">Clarification from {currentVersion.createdBy}</p>
                            <p className="text-sm text-indigo-700 mt-1 italic font-medium leading-relaxed">"{currentVersion.changeReason}"</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {role === 'client' ? 'Reject Candidate' : 'Withdraw Proposal'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for {role === 'client' ? 'rejection' : 'withdrawal'}</label>
                            <Textarea
                                className="resize-none min-h-[100px] text-sm border-slate-200"
                                placeholder={`Please explain why you are ${role === 'client' ? 'rejecting this candidate' : 'withdrawing your proposal'}...`}
                                value={rejectionReason}
                                onChange={(e: any) => setRejectionReason(e.target.value)}
                            />
                            <p className="text-[10px] text-slate-400 italic">This reason will be shared with the {role === 'client' ? 'freelancer' : 'client'}.</p>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <Button variant="outline" size="sm" className="h-9" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="h-9 font-bold px-5" onClick={handleConfirmReject} disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (role === 'client' ? 'Confirm Rejection' : 'Withdraw Proposal')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Version History Modal */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle className="text-base font-bold tracking-tight">Execution Version History</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        {versions.map((v) => (
                            <div key={v.id} className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedVersionId === v.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`} onClick={() => { setSelectedVersionId(v.id); setShowHistory(false) }}>
                                <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="font-bold text-slate-700 text-[12px] px-2 py-0.5">v{v.versionNumber}</Badge>
                                    {v.isActive && <Badge className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">Active</Badge>}
                                </div>
                                <p className="text-sm font-medium text-slate-700">By {v.createdBy} · {format(new Date(v.createdAt), "MMM d, hh:mm a")}</p>
                                <p className="text-xs text-slate-500 mt-0.5">₹{v.finalBudget.toLocaleString()} — {v.paymentStructure}</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Agreement Modal */}
            <Dialog open={showAgreement} onOpenChange={setShowAgreement}>
                <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-slate-900 text-white">
                        <DialogTitle className="text-base font-bold tracking-tight text-white">Agreement Summary</DialogTitle>
                        <p className="text-[12px] text-slate-400 mt-0.5">Confirm to create the project workspace.</p>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Job</p>
                            <p className="text-sm font-bold text-slate-800">{negotiation.job.title}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Financial Terms</p>
                            <p className="text-sm font-bold text-slate-800 mt-1">₹{budget.toLocaleString()} — {paymentStructure === 'full' ? '100% on Completion' : paymentStructure === 'advance' ? `${advancePercent}% Advance + Final` : 'Milestone-Based'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Start</p>
                                <p className="text-sm font-bold text-slate-800 mt-0.5">{startDate || 'TBD'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Deadline</p>
                                <p className="text-sm font-bold text-slate-800 mt-0.5">{deadline || 'TBD'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 pt-2">
                            <Checkbox id="agree" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(!!v)} className="mt-0.5" />
                            <label htmlFor="agree" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                                I agree to all scope and execution terms. I understand this will create a project workspace and auto-reject other proposals.
                            </label>
                        </div>
                    </div>
                    <div className="px-6 pb-6 flex gap-2 justify-end">
                        <Button variant="outline" className="h-9 px-4 text-sm" onClick={() => setShowAgreement(false)}>Cancel</Button>
                        <Button className="h-9 px-6 text-sm font-bold bg-slate-900 hover:bg-black text-white rounded-lg" disabled={!agreedToTerms || isPending} onClick={handleFinalConfirm}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm & Start Project
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Compare Modal */}
            {versions.length >= 2 && (
                <Dialog open={showCompare} onOpenChange={setShowCompare}>
                    <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold tracking-tight">Compare Execution Versions</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            {versions.slice(0, 2).map((v, idx) => {
                                const isNewer = idx === 0;
                                const other = versions.slice(0, 2)[isNewer ? 1 : 0];

                                return (
                                    <div key={v.id} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="font-bold text-slate-700 px-2 py-0.5">v{v.versionNumber} — {v.createdBy}</Badge>
                                            {v.isActive && <Badge className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">Active</Badge>}
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs text-slate-600">
                                            {/* Summary */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Budget</p>
                                                    <p className={`text-sm font-bold ${isNewer && v.finalBudget !== other?.finalBudget ? "text-emerald-700 font-black" : "text-slate-700"}`}>
                                                        ₹{v.finalBudget.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Structure</p>
                                                    <p className={`text-sm font-bold ${isNewer && v.paymentStructure !== other?.paymentStructure ? "text-emerald-700 font-black" : "text-slate-700"}`}>
                                                        {(() => {
                                                            const s = v.paymentStructure?.toUpperCase();
                                                            if (s === 'POST_COMPLETION' || s === 'FULL') return "100% After Completion";
                                                            if (s === 'ADVANCE_FINAL' || s === 'ADVANCE') return "Advance + Final";
                                                            if (s === 'MILESTONE') return "Milestone-Based";
                                                            return v.paymentStructure;
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Start Date</p>
                                                    <p className="font-medium text-slate-700">{v.startDate ? format(new Date(v.startDate), "MMM d, yyyy") : '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Deadline</p>
                                                    <p className="font-medium text-slate-700">{v.deadline ? format(new Date(v.deadline), "MMM d, yyyy") : '—'}</p>
                                                </div>
                                            </div>

                                            {/* Conditional Detail Section */}
                                            {(() => {
                                                const s = v.paymentStructure?.toUpperCase();
                                                const isAdvance = s === 'ADVANCE_FINAL' || s === 'ADVANCE';
                                                const isMilestone = s === 'MILESTONE';

                                                if (isAdvance) {
                                                    const advAmount = (v.advancePercent / 100) * v.finalBudget;
                                                    const finAmount = v.finalBudget - advAmount;
                                                    return (
                                                        <div className="pt-2 border-t border-slate-200 space-y-3">
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Advance ({v.advancePercent}%)</p>
                                                                <p className="text-sm font-bold text-amber-700">₹{advAmount.toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Final Payment</p>
                                                                <p className="text-sm font-bold text-emerald-700">₹{finAmount.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (isMilestone) {
                                                    return (
                                                        <div>
                                                            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Milestones</p>
                                                            <div className="space-y-2">
                                                                {v.milestones?.map((m, i) => {
                                                                    const pPct = ((m.amount / v.finalBudget) * 100).toFixed(0);
                                                                    const otherM = other?.milestones?.[i];
                                                                    const isDiff = isNewer && (m.amount !== otherM?.amount || m.name !== otherM?.name);

                                                                    return (
                                                                        <div key={i} className={`p-2 rounded-lg border bg-white ${isDiff ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100"}`}>
                                                                            <p className="font-bold text-slate-800 truncate">{m.name}</p>
                                                                            <div className="flex justify-between mt-1 text-[10px]">
                                                                                <span className="font-black text-slate-600">{pPct}%</span>
                                                                                <span className="font-bold text-slate-500">₹{m.amount.toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {(!v.milestones || v.milestones.length === 0) && (
                                                                    <p className="italic text-slate-400">No milestones defined</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return null; // Don't show anything for '100% After Completion'
                                            })()}

                                            {/* Hourly Details (If applicable) */}
                                            {v.hourlyRate && (
                                                <div className="pt-2 border-t border-slate-200 space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Rate:</span>
                                                        <span className="font-bold text-slate-700">₹{v.hourlyRate}/hr</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Limit:</span>
                                                        <span className="font-bold text-slate-700">{v.maxHoursPerWeek} hrs/wk</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
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
