"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, X, Clock, CheckCircle2, AlertCircle, History, GitCompare, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { submitScopeChange, confirmScope, rejectNegotiation, withdrawScopeChange } from "@/app/actions/negotiation"
import { format } from "date-fns"

type ScopeVersion = {
    id: string
    versionNumber: number
    createdBy: string
    objective: string
    deliverables: string[]
    tasksIncluded: string[]
    revisions: number
    changeReason?: string
    isActive: boolean
    createdAt: Date
}

type NegotiationStatus = string

interface Props {
    negotiation: {
        id: string
        status: NegotiationStatus
        scopeConfirmedByClient: boolean
        scopeConfirmedByFreelancer: boolean
        scopeVersions: ScopeVersion[]
        job: any
        freelancer: { username: string; avatarUrl: string | null }
        client: { username: string; avatarUrl: string | null }
    }
    job: any
    role: "client" | "freelancer"
    userId: string
    applicationId: string
}

export default function ScopeClient({ negotiation, job, role, applicationId }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const isConfirmed = negotiation.status === 'SCOPE_CONFIRMED'
    const isRejected = negotiation.status === 'REJECTED'

    // Active version (latest active)
    const versions = negotiation.scopeVersions
    const [selectedVersionId, setSelectedVersionId] = useState(
        versions.find(v => v.isActive)?.id ?? versions[0]?.id
    )
    const [showHistory, setShowHistory] = useState(false)
    const [showCompare, setShowCompare] = useState(false)
    const [editMode, setEditMode] = useState(false)

    const activeVersion = versions.find(v => v.id === selectedVersionId) ?? versions[0]

    // Editable fields
    const [objective, setObjective] = useState(activeVersion?.objective ?? '')
    const [deliverables, setDeliverables] = useState<string[]>(activeVersion?.deliverables ?? [])
    const [tasks, setTasks] = useState<string[]>(activeVersion?.tasksIncluded ?? [])
    const [revisions, setRevisions] = useState(activeVersion?.revisions ?? 3)
    const [reasonForChange, setReasonForChange] = useState('')
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    // Auto-redirect to execution if scope is already confirmed
    useEffect(() => {
        const nextPhases = ['SCOPE_CONFIRMED', 'EXEC_PENDING', 'EXEC_COUNTER_SENT', 'EXEC_WAITING_CONFIRMATION', 'CONFIRMED']
        if (nextPhases.includes(negotiation.status)) {
            router.push(`/dashboard/proposals/negotiation/${job.id}/${applicationId}/execution`)
        }
    }, [negotiation.status, job.id, applicationId, router])

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        SCOPE_PENDING: { label: "Awaiting Scope Acceptance", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
        SCOPE_CHANGE_REQUESTED: { label: "Scope Change Requested", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <AlertCircle className="h-3 w-3" /> },
        SCOPE_CONFIRMED: { label: "Scope Confirmed ✓", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
        EXEC_PENDING: { label: "Scope Confirmed ✓", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
        EXEC_COUNTER_SENT: { label: "Scope Confirmed ✓", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
        EXEC_WAITING_CONFIRMATION: { label: "Scope Confirmed ✓", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
        CONFIRMED: { label: "Agreement Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
        REJECTED: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: <X className="h-3 w-3" /> },
    }

    const myConfirmed = role === 'client'
        ? negotiation.scopeConfirmedByClient
        : negotiation.scopeConfirmedByFreelancer

    const cfg = statusConfig[negotiation.status] ?? statusConfig['SCOPE_PENDING']

    const handleScopeChange = () => {
        startTransition(async () => {
            try {
                await submitScopeChange(negotiation.id, {
                    objective,
                    deliverables,
                    tasksIncluded: tasks,
                    revisions,
                    changeReason: reasonForChange,
                })
                setEditMode(false)
                setReasonForChange('')
                toast.success("Scope change submitted. Waiting for the other party to review.")
                router.refresh()
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const handleConfirmScope = () => {
        startTransition(async () => {
            try {
                const result = await confirmScope(negotiation.id)
                if (result.scopeConfirmed) {
                    toast.success("Scope confirmed by both parties! Proceeding to Execution.")
                    router.push(`/dashboard/proposals/negotiation/${job.id}/${applicationId}/execution`)
                } else {
                    toast.success("Scope confirmed. Waiting for the other party to review.")
                    router.refresh()
                }
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
                router.push("/dashboard/proposals/negotiation")
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const handleWithdraw = () => {
        startTransition(async () => {
            try {
                await withdrawScopeChange(negotiation.id)
                toast.success("Changes withdrawn")
                setEditMode(false)
                router.refresh()
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    return (
        <div className="min-h-screen bg-slate-50/60 pb-24">
            {/* ── Top Header ── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href={`/dashboard/proposals/negotiation/${job.id}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Pipeline
                    </Link>
                    <div className="h-5 w-px bg-slate-200" />
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-slate-900 text-lg leading-tight truncate">{job.title}</h1>
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
                            v{activeVersion?.versionNumber ?? 1}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* ── Step Indicator ── */}
            <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black">1</span>
                        Step 1: Scope — WHAT
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="flex items-center gap-2 text-sm text-slate-400 px-3 py-1.5 rounded-full">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-black">2</span>
                        Step 2: Payment & Financial Terms
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="flex items-center gap-2 text-sm text-slate-400 px-3 py-1.5 rounded-full">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-black">3</span>
                        Step 3: Execution Plan
                    </span>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-5">

                {/* Rejected banner */}
                {isRejected && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="font-semibold text-red-800 text-sm">This negotiation has been rejected.</p>
                    </div>
                )}

                {/* My confirmation status */}
                {!isConfirmed && !isRejected && myConfirmed && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-blue-700 font-medium">You have confirmed the scope. Waiting for the other party.</p>
                    </div>
                )}

                {/* Version Info Panel */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="py-4 px-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Scope Version</p>
                                    <Badge variant="outline" className="font-bold text-slate-700 text-[12px] px-2 py-0.5">v{activeVersion?.versionNumber}</Badge>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Created By</p>
                                    <p className="font-medium text-slate-700 text-[13px] capitalize">{activeVersion?.createdBy}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Created</p>
                                    <p className="font-medium text-slate-700 text-[13px]">
                                        {activeVersion ? format(new Date(activeVersion.createdAt), "MMM d, HH:mm") : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                                    <SelectTrigger className="h-8 w-[90px] text-[13px] font-medium border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {versions.map(v => (
                                            <SelectItem key={v.id} value={v.id}>v{v.versionNumber}</SelectItem>
                                        ))}
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

                {/* Section 1 — Objective */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-5">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                            Project Objective
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5 pt-0">
                        <Textarea
                            className="resize-none text-sm text-slate-700 bg-slate-50 border-slate-200 focus:bg-white min-h-[100px]"
                            value={editMode ? objective : (activeVersion?.objective ?? '')}
                            onChange={(e) => setObjective(e.target.value)}
                            readOnly={!editMode}
                            placeholder="Describe the project objective..."
                        />
                    </CardContent>
                </Card>

                {/* Section 2 — Deliverables */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-5">
                        <CardTitle className="text-base font-semibold text-slate-800">Main Deliverables</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5 pt-0 space-y-2.5">
                        {(editMode ? deliverables : (activeVersion?.deliverables ?? [])).map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black">{i + 1}</span>
                                <Input
                                    className="h-9 text-sm text-slate-700 bg-slate-50 border-slate-200 focus:bg-white flex-1"
                                    value={d}
                                    onChange={(e) => setDeliverables(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                                    readOnly={!editMode}
                                    placeholder={`Deliverable ${i + 1}`}
                                />
                                {editMode && (
                                    <button onClick={() => setDeliverables(prev => prev.filter((_, idx) => idx !== i))} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {editMode && (
                            <Button size="sm" variant="ghost" className="h-8 px-3 text-[12px] text-indigo-600 hover:bg-indigo-50 gap-1.5" onClick={() => setDeliverables(prev => [...prev, ''])}>
                                <Plus className="h-3.5 w-3.5" />
                                Add Deliverable
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Section 3 — Tasks */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-5">
                        <CardTitle className="text-base font-semibold text-slate-800">Tasks Included</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5 pt-0 space-y-2.5">
                        {(editMode ? tasks : (activeVersion?.tasksIncluded ?? [])).map((t, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-black">{i + 1}</span>
                                <Input
                                    className="h-9 text-sm text-slate-700 bg-slate-50 border-slate-200 focus:bg-white flex-1"
                                    value={t}
                                    onChange={(e) => setTasks(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                                    readOnly={!editMode}
                                    placeholder={`Task ${i + 1}`}
                                />
                                {editMode && (
                                    <button onClick={() => setTasks(prev => prev.filter((_, idx) => idx !== i))} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {editMode && (
                            <Button size="sm" variant="ghost" className="h-8 px-3 text-[12px] text-indigo-600 hover:bg-indigo-50 gap-1.5" onClick={() => setTasks(prev => [...prev, ''])}>
                                <Plus className="h-3.5 w-3.5" />
                                Add Task
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Section 4 — Revisions */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-5">
                        <CardTitle className="text-base font-semibold text-slate-800">Number of Revisions</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5 pt-0">
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                min={0}
                                max={20}
                                value={editMode ? revisions : (activeVersion?.revisions ?? 3)}
                                onChange={(e) => setRevisions(Number(e.target.value))}
                                readOnly={!editMode}
                                className="h-10 w-[120px] text-sm font-medium border-slate-200 bg-slate-50 focus:bg-white"
                            />
                            {!editMode && <span className="text-sm text-slate-500 font-medium">Revisions included</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* Section 5 — Reason for Change (Only in Edit Mode) */}
                {editMode && (
                    <Card className="shadow-sm border-indigo-200 bg-indigo-50/30">
                        <CardHeader className="py-3 px-5">
                            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Clarification / Reason for Change
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-5 pt-0">
                            <Textarea
                                className="resize-none text-sm text-slate-700 bg-white border-indigo-200 focus:border-indigo-400 min-h-[80px]"
                                value={reasonForChange}
                                onChange={(e) => setReasonForChange(e.target.value)}
                                placeholder="Explain why you are requesting these changes (optional)..."
                            />
                            <p className="text-[10px] text-indigo-500 mt-2 font-medium">Note: This clarification is for the current submission and won't be saved as a permanent record.</p>
                        </CardContent>
                    </Card>
                )}

            </div>

            {/* ── Sticky Action Bar ── */}
            {!isConfirmed && !isRejected && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 shadow-2xl">
                    <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3 justify-between">
                        <div className="flex flex-col">
                            <p className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Last updated: {activeVersion ? format(new Date(activeVersion.createdAt), "MMM d, HH:mm") : '—'}
                            </p>
                            {/* Status logic */}
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
                                {(() => {
                                    if (myConfirmed) return "Waiting on Other Party";
                                    const IAmRequester = activeVersion?.createdBy === role;
                                    const isV1 = activeVersion?.versionNumber === 1;

                                    if (IAmRequester) return "Waiting on Other Party";
                                    return "Waiting on You";
                                })()}
                            </p>
                        </div>

                        {editMode ? (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-9 px-4 text-sm" onClick={() => setEditMode(false)} disabled={isPending}>Cancel</Button>
                                <Button size="sm" className="h-9 px-5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg border-none" onClick={handleScopeChange} disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Scope Change →"}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                {(() => {
                                    const IAmRequester = activeVersion?.createdBy === role;
                                    const isV1 = activeVersion?.versionNumber === 1;

                                    const dismissalButton = (
                                        <Button size="sm" variant="destructive" className="h-9 px-4 text-sm font-bold rounded-lg border-none" onClick={handleReject} disabled={isPending}>
                                            {role === 'client' ? "Reject Candidate" : "Withdraw Proposal"}
                                        </Button>
                                    );

                                    // 1. If I am the sender (requester) of this version
                                    if (IAmRequester) {
                                        return dismissalButton;
                                    }

                                    // 2. If I have already confirmed this version
                                    if (myConfirmed) {
                                        return (
                                            <div className="flex gap-2 items-center">
                                                <p className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
                                                    You've confirmed this scope. Waiting for partner.
                                                </p>
                                                {dismissalButton}
                                            </div>
                                        );
                                    }

                                    // 3. Otherwise (receiver)
                                    // SPECIAL RULE: Client on v1 can ONLY reject
                                    if (isV1 && role === 'client') {
                                        return dismissalButton;
                                    }

                                    return (
                                        <div className="flex gap-2">
                                            <Button size="sm" className="h-9 px-4 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none" onClick={() => setEditMode(true)} disabled={isPending}>
                                                {isV1 ? "Request Change" : "Counter Offer"}
                                            </Button>
                                            <Button size="sm" className="h-9 px-6 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border-none" onClick={handleConfirmScope} disabled={isPending}>
                                                {isV1 ? "Accept & Proceed →" : "Accept Changes →"}
                                            </Button>
                                            {dismissalButton}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
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
                                className="resize-none min-h-[100px] text-sm"
                                placeholder={`Please explain why you are ${role === 'client' ? 'rejecting this candidate' : 'withdrawing your proposal'}...`}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
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

            {/* View Reason Header (if exists for current version) */}
            {!editMode && activeVersion?.changeReason && (
                <div className="max-w-5xl mx-auto px-6 pt-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 shadow-sm">
                        <AlertCircle className="h-5 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] font-black text-indigo-800 uppercase tracking-widest">Clarification from {activeVersion.createdBy}</p>
                            <p className="text-sm text-indigo-700 mt-1 italic font-medium leading-relaxed">"{activeVersion.changeReason}"</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Version History Modal */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold tracking-tight">Scope Version History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {versions.map((v, i) => (
                            <div
                                key={v.id}
                                className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedVersionId === v.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                                onClick={() => { setSelectedVersionId(v.id); setShowHistory(false) }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="font-bold text-slate-700 text-[12px] px-2 py-0.5">v{v.versionNumber}</Badge>
                                    {i === 0 && v.isActive && <Badge className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">Active</Badge>}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">By {v.createdBy} · {format(new Date(v.createdAt), "MMM d, hh:mm a")}</p>
                                <p className="text-sm text-slate-700 mt-1 line-clamp-2">{v.objective}</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Compare Modal */}
            {versions.length >= 2 && (
                <Dialog open={showCompare} onOpenChange={setShowCompare}>
                    <DialogContent className="sm:max-w-[720px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold tracking-tight">Compare Scope Versions</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            {versions.slice(0, 2).map((v, idx) => {
                                const isNewer = idx === 0;
                                const otherVersion = versions.slice(0, 2)[isNewer ? 1 : 0];

                                return (
                                    <div key={v.id} className="space-y-2">
                                        <Badge variant="outline" className="font-bold text-slate-700 px-2 py-0.5">v{v.versionNumber} — {v.createdBy}</Badge>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-600">
                                            <div>
                                                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Objective</p>
                                                <p className="leading-relaxed">{v.objective}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Deliverables</p>
                                                <ul className="list-disc pl-4 space-y-0.5">
                                                    {v.deliverables.map((d, i) => {
                                                        const isAdded = isNewer && !otherVersion?.deliverables.includes(d);
                                                        const isRemoved = !isNewer && !otherVersion?.deliverables.includes(d);
                                                        return (
                                                            <li key={i} className={isAdded ? "text-emerald-600 font-bold" : isRemoved ? "text-red-500 line-through decoration-red-400" : ""}>
                                                                {d}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Tasks Included</p>
                                                <ul className="list-disc pl-4 space-y-0.5">
                                                    {v.tasksIncluded.map((t, i) => {
                                                        const isAdded = isNewer && !otherVersion?.tasksIncluded.includes(t);
                                                        const isRemoved = !isNewer && !otherVersion?.tasksIncluded.includes(t);
                                                        return (
                                                            <li key={i} className={isAdded ? "text-emerald-600 font-bold" : isRemoved ? "text-red-500 line-through decoration-red-400" : ""}>
                                                                {t}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Revisions</p>
                                                <p className={isNewer && v.revisions !== otherVersion?.revisions ? "text-emerald-600 font-extrabold" : !isNewer && v.revisions !== otherVersion?.revisions ? "text-slate-400 line-through" : ""}>
                                                    {v.revisions}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
