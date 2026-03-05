import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import {
    markServiceComplete,
    cancelService,
    requestRevision,
    acceptRevision,
    denyRevision,
    raiseServiceDispute,
    submitMilestone,
    approveMilestone,
    requestMilestoneRevision,
    acceptMilestoneRevision,
    denyMilestoneRevision
} from "@/app/actions/manageService"
import { startConversation } from "@/app/actions/chat"
import { getOrderMessages } from "@/app/actions/support"
import { agreeToProject } from "@/app/dashboard/projects/active/[projectId]/actions"
import { RateClientButton } from "../../service-order/[orderId]/RateClientButton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    CheckCircle2,
    Clock,
    User,
    Briefcase,
    Download,
    ExternalLink,
    Star,
    MessageCircle,
    ArrowLeft,
    XCircle,
    RotateCcw,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Shield,
    FileText,
    Flag,
    Upload,
    Send
} from "lucide-react"
import Link from "next/link"
import ReviewForm from "@/components/ReviewForm"
import { ServicePriceDisplay } from "@/components/ServicePriceDisplay"
import { formatDistanceToNow } from "date-fns"
import { MilestoneFundButton } from "@/components/MilestoneFundButton"
import { ApproveAndPayButton } from "@/components/ApproveAndPayButton"
import { OrderChat } from "@/components/OrderChat"
import { GanttChart } from "@/components/GanttChart"
import { JobOrderFeedback } from "@/components/JobOrderFeedback"

interface PageProps {
    params: Promise<{ orderId: string }>
}

export default async function JobOrderPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) return redirect("/signin")

    const { orderId } = await params

    const orderBase = await db.order.findUnique({
        where: { id: orderId }
    })

    if (!orderBase) return notFound()

    // Fetch relations - Focus on Project instead of Service
    const [project, buyer, seller, review, dispute, commMsgs, clientReview] = await Promise.all([
        db.project.findUnique({
            where: { orderId: orderBase.id },
            include: { milestones: { orderBy: { createdAt: 'asc' } } }
        }),
        db.user.findUnique({ where: { id: orderBase.buyerId } }),
        db.user.findUnique({ where: { id: orderBase.sellerId } }),
        db.review.findUnique({ where: { orderId: orderBase.id } }),
        db.dispute.findFirst({
            where: { orderId: orderBase.id, NOT: { reason: "ORDER_COMMUNICATION" } },
            orderBy: { createdAt: 'desc' }
        }),
        getOrderMessages(orderBase.id),
        db.clientReview.findUnique({ where: { orderId: orderBase.id } })
    ])

    // Fetch Job Timeline via Agreement Milestone (if exists)
    let jobTimeline = null
    let jobTimelineStartDate: Date | null = null
    if (project?.milestones) {
        const agreementMilestone = project.milestones.find(m => m.title === "Project Agreement")
        if (agreementMilestone?.description) {
            try {
                const meta = JSON.parse(agreementMilestone.description)
                if (meta.originalProposalId) {
                    const application = await db.jobApplication.findUnique({
                        where: { id: meta.originalProposalId },
                        select: { job: { select: { timeline: true } } }
                    })
                    jobTimeline = application?.job?.timeline
                    const agreementData = JSON.parse(agreementMilestone.description || "{}")
                    if (agreementData.startDate) {
                        jobTimelineStartDate = new Date(agreementData.startDate)
                    }
                }
            } catch (e) {
                // Ignore parsing errors
                console.error("Failed to parse milestone description for timeline", e)
            }
        }
    }

    const order = {
        ...orderBase,
        project,
        buyer, // Client
        seller, // Freelancer
        review,
        dispute,
        communicationMessages: commMsgs,
        clientReview,
        totalRevisions: (orderBase as any).totalRevisions || 0
    }


    // If no project found, this might be a service order
    if (!order.project) {
        if (orderBase.serviceId) return redirect(`/service-order/${orderId}`)
        if (orderBase.productId) return redirect(`/product-order/${orderId}`)
    }

    const isFreelancer = session.user.id === order.sellerId
    const isClient = session.user.id === order.buyerId

    // Allow admins to view any order
    const currentUser = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    const isAdmin = currentUser?.role === "ADMIN"

    if (!isFreelancer && !isClient && !isAdmin) {
        return <div className="p-10 text-center">Unauthorized</div>
    }

    const isCompleted = order.status === "COMPLETED" || order.status === "PAID"
    const isCancelled = order.status === "CANCELLED"
    const isDenied = order.status === "REVISION_DENIED"
    const isDisputed = order.status === "DISPUTED"
    const revisionRequested = order.revisionRequested
    const inRevision = order.status === "IN_REVISION"
    const developmentMilestones = order.project?.milestones?.filter(m => m.title !== "Project Agreement") || []
    const hasMilestones = developmentMilestones.length > 0
    const activeMilestoneIndex = developmentMilestones.findIndex(m => m.status !== 'APPROVED')
    const allMilestonesCompleted = hasMilestones && activeMilestoneIndex === -1
    const activeMilestone = activeMilestoneIndex !== -1 ? developmentMilestones[activeMilestoneIndex] : null

    // AUTO-COMPLETION SWEEP: If all work milestones are approved but order isn't completed
    if (allMilestonesCompleted && !isCompleted && !isCancelled && !isDisputed) {
        await db.order.update({
            where: { id: order.id },
            data: { status: "COMPLETED" }
        });
        order.status = "COMPLETED";
    }

    const payableMilestones = developmentMilestones.filter(m => (m.amount || 0) > 0)
    let paymentType = "Milestone-based Delivery"
    if (payableMilestones.length === 1 && !payableMilestones.some(m => m.title === "Advance Payment")) {
        paymentType = "100% Final Delivery"
    } else if (payableMilestones.length === 2 && payableMilestones.some(m => m.title === "Advance Payment")) {
        paymentType = "Advance + Final Delivery"
    }

    // Use actually updated status for UI
    const isActuallyCompleted = order.status === "COMPLETED" || order.status === "PAID"

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Job Order #{order.id.slice(0, 8)}</h1>
                            <p className="text-slate-500">Started on {order.createdAt.toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${isActuallyCompleted ? "bg-green-100 text-green-700"
                        : isCancelled || isDenied ? "bg-red-100 text-red-700"
                            : isDisputed ? "bg-amber-100 text-amber-700"
                                : order.status === "REVISION_REQUESTED" ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                        }`}>
                        {order.status.replace("_", " ")}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">

                    {/* MAIN CONTENT */}
                    <div className="space-y-6">

                        {/* PROJECT SUMMARY - Full Width */}
                        <Card className="w-full">
                            <CardHeader className="border-b border-slate-100 pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Briefcase className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{order.project?.title || "Job Order"}</CardTitle>
                                            <p className="text-xs text-slate-400 mt-0.5">Ordered by <span className="font-medium text-slate-600">{order.buyer?.username || "Client"}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-3 pb-4">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Objective</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{order.project?.description}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-100 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-500">Start:</span>
                                            <span className="font-medium text-slate-700">{order.createdAt.toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-500">Deadline:</span>
                                            <span className="font-medium text-slate-700">{order.deadline ? new Date(order.deadline).toLocaleDateString() : (jobTimeline || "Flexible")}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-500">Revisions:</span>
                                            <span className="font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full text-xs">
                                                {order.revisionsRemaining === -1 ? "Unlimited" : (
                                                    `${Math.max(0, (order as any).totalRevisions - order.revisionsRemaining)} / ${(order as any).totalRevisions} Used`
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-500">Payment:</span>
                                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">{paymentType}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* EXECUTION PLAN / DELIVERABLES TABLE */}
                        {developmentMilestones.length > 0 && (
                            <Card className="w-full overflow-hidden">
                                <CardHeader className="border-b border-slate-100">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        Execution Plan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">Sr.</th>
                                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Deliverable</th>
                                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date of Delivery</th>
                                                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paymentType === "100% Final Delivery" && (() => {
                                                    const zeroAmountDeliverables = developmentMilestones.filter(m => (m.amount || 0) === 0)
                                                    const paymentMilestone = developmentMilestones.find(m => (m.amount || 0) > 0)
                                                    return (
                                                        <>
                                                            {zeroAmountDeliverables.map((deliverable, idx) => (
                                                                <tr key={deliverable.id} className="hover:bg-slate-50/50">
                                                                    <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-800">{deliverable.title}</p>
                                                                        {deliverable.description && <p className="text-xs text-slate-500 mt-0.5">{deliverable.description}</p>}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                                        {deliverable.dueDate ? new Date(deliverable.dueDate).toLocaleDateString() : "–"}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-slate-400 italic text-xs">N/A</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right text-slate-400 italic text-xs">N/A</td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-green-50 border-t-2 border-green-200">
                                                                <td className="px-4 py-3 text-slate-400 font-medium">{zeroAmountDeliverables.length + 1}</td>
                                                                <td className="px-4 py-3">
                                                                    <p className="font-bold text-green-800">{paymentMilestone?.title || "Final Approval & Payment"}</p>
                                                                    <p className="text-xs text-green-600 mt-0.5">Full payment released upon client approval</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500">
                                                                    {paymentMilestone?.dueDate ? new Date(paymentMilestone.dueDate).toLocaleDateString() : "–"}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="font-bold text-green-700">₹{paymentMilestone?.amount || order.price}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold text-green-700">₹{order.price}</td>
                                                            </tr>
                                                        </>
                                                    )
                                                })()}

                                                {paymentType === "Advance + Final Delivery" && (() => {
                                                    const advanceMilestone = developmentMilestones.find(m => m.title === "Advance Payment")
                                                    const finalMilestone = developmentMilestones.find(m => m.title === "Final Delivery" || ((m.amount || 0) > 0 && m.id !== advanceMilestone?.id))
                                                    const zeroAmountDeliverables = developmentMilestones.filter(m => (m.amount || 0) === 0 && m.id !== advanceMilestone?.id && m.id !== finalMilestone?.id)
                                                    return (
                                                        <>
                                                            <tr className="hover:bg-slate-50/50 bg-amber-50/30">
                                                                <td className="px-4 py-3 text-slate-400 font-medium">1</td>
                                                                <td className="px-4 py-3">
                                                                    <p className="font-semibold text-slate-800">{advanceMilestone?.title || "Advance Payment"}</p>
                                                                    <p className="text-xs text-amber-600 mt-0.5 font-medium">Upfront advance — released before work begins</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500">Upon Start</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="font-bold text-amber-700">₹{advanceMilestone?.amount ?? "–"}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold text-amber-700">₹{advanceMilestone?.amount ?? "–"}</td>
                                                            </tr>
                                                            {zeroAmountDeliverables.map((deliverable, idx) => (
                                                                <tr key={deliverable.id} className="hover:bg-slate-50/50">
                                                                    <td className="px-4 py-3 text-slate-400 font-medium">{idx + 2}</td>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-800">{deliverable.title}</p>
                                                                        {deliverable.description && <p className="text-xs text-slate-500 mt-0.5">{deliverable.description}</p>}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                                        {deliverable.dueDate ? new Date(deliverable.dueDate).toLocaleDateString() : "–"}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-slate-400 italic text-xs">N/A</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right text-slate-400 italic text-xs">N/A</td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-green-50 border-t-2 border-green-200">
                                                                <td className="px-4 py-3 text-slate-400 font-medium">{zeroAmountDeliverables.length + 2}</td>
                                                                <td className="px-4 py-3">
                                                                    <p className="font-bold text-green-800">{finalMilestone?.title || "Final Approval & Payment"}</p>
                                                                    <p className="text-xs text-green-600 mt-0.5">Final amount released upon client approval</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500">
                                                                    {finalMilestone?.dueDate ? new Date(finalMilestone.dueDate).toLocaleDateString() : "–"}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="font-bold text-green-700">₹{finalMilestone?.amount ?? (order.price - (advanceMilestone?.amount ?? 0))}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold text-green-700">₹{order.price}</td>
                                                            </tr>
                                                        </>
                                                    )
                                                })()}

                                                {paymentType === "Milestone-based Delivery" && (() => {
                                                    const totalMilestoneAmount = developmentMilestones.reduce((sum, m) => sum + (m.amount ?? 0), 0)
                                                    return (
                                                        <>
                                                            {developmentMilestones.map((milestone, idx) => (
                                                                <tr key={milestone.id} className="hover:bg-slate-50/50">
                                                                    <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-800">{milestone.title}</p>
                                                                        {milestone.description && <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                                        {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : "–"}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="font-bold text-blue-700">₹{milestone.amount}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="font-medium text-slate-500">₹{developmentMilestones.slice(0, idx + 1).reduce((s, m) => s + (m.amount ?? 0), 0)}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-green-50 border-t-2 border-green-200">
                                                                <td className="px-4 py-3 text-slate-400 font-medium">{developmentMilestones.length + 1}</td>
                                                                <td className="px-4 py-3">
                                                                    <p className="font-bold text-green-800">Final Approval &amp; Total Payment</p>
                                                                    <p className="text-xs text-green-600 mt-0.5">All milestones completed and approved</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500">–</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="text-slate-400 italic text-xs">N/A</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold text-green-700">₹{totalMilestoneAmount}</td>
                                                            </tr>
                                                        </>
                                                    )
                                                })()}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-800 text-white">
                                                    <td colSpan={3} className="px-4 py-3 font-bold text-sm">Project Total</td>
                                                    <td className="px-4 py-3 text-right font-bold text-sm">₹{order.price}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-sm">₹{order.price}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}





                        {/* COMMUNICATION SECTION */}
                        <OrderChat
                            orderId={order.id}
                            currentUserId={session.user.id}
                            initialMessages={commMsgs}
                        />

                        {/* GANTT CHART SECTION */}
                        {developmentMilestones.length > 0 && (
                            <GanttChart
                                milestones={developmentMilestones as any}
                                projectStartDate={jobTimelineStartDate || order.createdAt}
                            />
                        )}


                        {/* MAIN PROJECT INTERACTION AREA */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden pb-12">
                            <div className="p-8 pb-0">
                                {isActuallyCompleted ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-green-800">
                                            {isFreelancer ? "Job Completed!" : "Project Completed!"}
                                        </h2>
                                        <p className="text-green-700 max-w-md mx-auto mb-6 mt-2">
                                            {hasMilestones
                                                ? "All development stages have been successfully approved and the project is complete."
                                                : isFreelancer
                                                    ? "You have successfully delivered the final work for this project."
                                                    : "The freelancer has delivered the final work. Review the files below."
                                            }
                                        </p>

                                        {order.deliveryUrl && !hasMilestones && (
                                            <div className="space-y-4">
                                                <Link href={order.deliveryUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        {isFreelancer ? "Download Your Delivery" : "Download Delivered Work"}
                                                    </Button>
                                                </Link>

                                                {isFreelancer && !order.clientReview && (
                                                    <div className="mt-8 max-w-sm mx-auto space-y-2">
                                                        <p className="text-sm font-semibold text-slate-700 mb-2">One last thing — rate your client!</p>
                                                        <RateClientButton
                                                            orderId={order.id}
                                                            clientName={order.buyer?.username}
                                                        />
                                                        <p className="text-[11px] text-slate-400">
                                                            Your review helps build a trustworthy community.
                                                        </p>
                                                    </div>
                                                )}

                                                {isClient && (order.revisionsRemaining > 0 || order.revisionsRemaining === -1) && (
                                                    <div className="pt-6 border-t border-green-200 mt-6">
                                                        <h4 className="text-sm font-bold text-green-800 mb-1 font-bold italic">Not satisfied?</h4>
                                                        <p className="text-sm text-green-600 mb-4">You can request changes if you are not satisfied.</p>
                                                        <form action={requestRevision} className="space-y-4 text-left">
                                                            <input type="hidden" name="orderId" value={order.id} />
                                                            <div className="space-y-2">
                                                                <Label htmlFor="revision-desc" className="text-green-800">What needs to be changed?</Label>
                                                                <Textarea
                                                                    id="revision-desc"
                                                                    name="description"
                                                                    placeholder="Describe the changes you need..."
                                                                    className="bg-white border-green-200 focus:border-green-400 min-h-[100px]"
                                                                    required
                                                                />
                                                            </div>
                                                            <Button type="submit" variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-100 font-bold">
                                                                Request Revision
                                                            </Button>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isFreelancer && hasMilestones && !order.clientReview && (
                                            <div className="mt-8 max-w-sm mx-auto space-y-2">
                                                <p className="text-sm font-semibold text-slate-700 mb-2">One last thing — rate your client!</p>
                                                <RateClientButton
                                                    orderId={order.id}
                                                    clientName={order.buyer?.username}
                                                />
                                                <p className="text-[11px] text-slate-400 font-bold">
                                                    Your review helps build a trustworthy community.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : isCancelled ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <XCircle className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-red-800">Project Cancelled</h2>
                                        <p className="text-red-700 max-w-md mx-auto mt-2">
                                            {isFreelancer
                                                ? "You cancelled this project. The client has been notified."
                                                : "This project was cancelled by the freelancer."
                                            }
                                        </p>
                                        <Link href="/dashboard" className="inline-block mt-6">
                                            <Button variant="outline" className="font-bold">
                                                Go to Dashboard
                                            </Button>
                                        </Link>
                                    </div>
                                ) : isDenied ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <XCircle className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold text-red-800">Revision Declined</h2>
                                            <h3 className="text-sm font-bold text-red-600/80 uppercase tracking-widest">Job Completed!</h3>
                                        </div>
                                        <p className="text-slate-600 max-w-md mx-auto mb-8 mt-4">
                                            {isFreelancer
                                                ? "You have declined this revision request. Your previous delivery is still accessible to the client."
                                                : "The freelancer has declined your revision request. You can still access the original delivery below."
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-left">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                {order.status === "IN_REVISION" ? <RotateCcw className="w-5 h-5 animate-spin-slow" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-blue-800">
                                                    {order.status === "IN_REVISION" ? "Revising Project" : "Project in Progress"}
                                                </h2>
                                                <p className="text-sm text-blue-600">
                                                    {paymentType === "100% Final Delivery"
                                                        ? "Full payment released upon final delivery & approval"
                                                        : paymentType === "Advance + Final Delivery"
                                                            ? "Advance paid upfront; final payment on delivery approval"
                                                            : "Payment released per milestone as approved"}
                                                </p>
                                            </div>
                                        </div>

                                        {isFreelancer ? (
                                            <div className="space-y-4">
                                                {hasMilestones ? (
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <p className="text-sm font-semibold text-slate-700">
                                                                {allMilestonesCompleted ? "All milestones completed!" : "Active Development Stage"}
                                                            </p>
                                                            {activeMilestone?.dueDate && (
                                                                <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md">
                                                                    <Clock className="w-3 h-3" /> Due: {new Date(activeMilestone.dueDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {developmentMilestones.map((milestone, idx) => {
                                                            const isCompleted = milestone.status === 'APPROVED'
                                                            const isDeliverable = milestone.title !== "Project Agreement" && milestone.title !== "Advance Payment"
                                                            // All PREVIOUS milestones must be APPROVED before this one can be acted on
                                                            const prevAllApproved = developmentMilestones.slice(0, idx).every(m => m.status === 'APPROVED')
                                                            const isLocked = !prevAllApproved && !isCompleted
                                                            const canSubmit = prevAllApproved && isDeliverable && ['PENDING', 'IN_PROGRESS', 'REVISION_REQUESTED', 'REJECTED'].includes(milestone.status)

                                                            if (isLocked) {
                                                                return (
                                                                    <div key={milestone.id} className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 opacity-60">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-bold text-slate-300 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center">{idx + 1}</span>
                                                                            <div>
                                                                                <p className="font-semibold text-slate-400 text-sm">{milestone.title}</p>
                                                                                <p className="text-[10px] text-slate-400">Locked until previous phase is approved by client</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }

                                                            if (isCompleted) {
                                                                return (
                                                                    <div key={milestone.id} className="p-3 rounded-xl border border-green-200 bg-green-50/30 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                            <div>
                                                                                <p className="font-semibold text-green-800 text-sm">{milestone.title}</p>
                                                                                {milestone.deliveryUrl && (
                                                                                    <Link href={milestone.deliveryUrl} target="_blank" className="text-[10px] text-green-600 font-bold hover:underline">View Approved Work</Link>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 text-[10px]">Completed</Badge>
                                                                    </div>
                                                                )
                                                            }

                                                            return (
                                                                <div key={milestone.id} className={`p-5 rounded-xl border-2 shadow-sm ${milestone.status === 'SUBMITTED' ? 'border-blue-200 bg-blue-50/30'
                                                                    : milestone.status === 'REVISION_REQUESTED' ? 'border-purple-200 bg-purple-50/30'
                                                                        : 'border-blue-400 bg-white'
                                                                    }`}>
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-bold text-white bg-blue-600 w-7 h-7 rounded-full flex items-center justify-center">{idx + 1}</span>
                                                                            <div>
                                                                                <p className="font-bold text-slate-900 text-base">{milestone.title}</p>
                                                                                {milestone.description && <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                                                                            <Badge variant={milestone.status === 'SUBMITTED' ? 'secondary' : 'outline'} className="text-xs uppercase px-2 py-0.5">
                                                                                {milestone.status.replace('_', ' ')}
                                                                            </Badge>
                                                                            {isDeliverable && (
                                                                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">+₹{milestone.amount} on approval</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {milestone.title === "Advance Payment" && milestone.status === 'IN_PROGRESS' && (
                                                                        <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2">
                                                                            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                                                            <p className="text-xs text-amber-700 font-medium font-bold">Waiting for client to release advance payment.</p>
                                                                        </div>
                                                                    )}

                                                                    {canSubmit && (
                                                                        <div className="space-y-3 pt-2">
                                                                            <p className="text-xs font-bold text-slate-500 uppercase">Submit Work</p>
                                                                            <form action={submitMilestone} className="flex flex-col sm:flex-row gap-2 w-full">
                                                                                <input type="hidden" name="milestoneId" value={milestone.id} />
                                                                                <input type="hidden" name="orderId" value={order.id} />
                                                                                <Input
                                                                                    id={`progress-url-${milestone.id}`}
                                                                                    name="deliveryUrl"
                                                                                    placeholder="Delivery Link (Google Drive, GitHub, etc.)"
                                                                                    required
                                                                                    type="url"
                                                                                    className="h-10 flex-1 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                                                                />
                                                                                <Button type="submit" className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                                                                                    <Send className="w-4 h-4 mr-2" /> Submit Phase
                                                                                </Button>
                                                                            </form>
                                                                        </div>
                                                                    )}

                                                                    {milestone.status === 'SUBMITTED' && (
                                                                        <div className="mt-2 p-4 bg-white/60 rounded-xl border border-blue-100 flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                                <Clock className="w-4 h-4 text-blue-600 animate-spin-slow" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-blue-800">Review Pending</p>
                                                                                <p className="text-xs text-slate-500">The client has been notified to review your work.</p>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {milestone.status === 'REVISION_REQUESTED' && (
                                                                        <div className="mt-2 p-4 bg-purple-50 rounded-xl border border-purple-100 shadow-inner">
                                                                            <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                                                                <RotateCcw className="w-3.5 h-3.5" /> Revision Requested
                                                                            </p>
                                                                            <div className="bg-white/80 p-3 rounded-lg border border-purple-200 text-sm text-slate-700 italic border-l-4 border-l-purple-400">
                                                                                &quot;{milestone.revisionDescription}&quot;
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="font-semibold text-slate-900">
                                                            {order.status === "IN_REVISION" ? "Deliver Revision" : "Deliver your work"}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 mb-4">
                                                            Paste a link to your updated files to complete this project.
                                                        </p>
                                                        <form action={markServiceComplete} className="space-y-4">
                                                            <input type="hidden" name="orderId" value={order.id} />
                                                            <div className="space-y-2">
                                                                <Label htmlFor="url">File Link</Label>
                                                                <Input
                                                                    id="url"
                                                                    name="deliveryUrl"
                                                                    placeholder="https://drive.google.com/..."
                                                                    required
                                                                    type="url"
                                                                    defaultValue={order.deliveryUrl || ""}
                                                                />
                                                            </div>
                                                            <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Submit Work
                                                            </Button>
                                                        </form>
                                                    </>
                                                )}

                                                {!inRevision && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        <form action={cancelService}>
                                                            <input type="hidden" name="orderId" value={order.id} />
                                                            <Button
                                                                type="submit"
                                                                variant="outline"
                                                                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancel Project
                                                            </Button>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* CLIENT VIEW */
                                            <div className="space-y-4">
                                                <p className="text-sm text-blue-700">
                                                    Freelancer <strong>{order.seller?.username || "Unknown"}</strong> is {order.status === "IN_REVISION" ? "working on your revision" : "working on your project"}.
                                                </p>
                                                {order.status === "IN_REVISION" && order.revisionDescription && (
                                                    <div className="p-4 bg-white/50 rounded-lg border border-blue-100">
                                                        <p className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">Your Revision Request:</p>
                                                        <p className="text-sm text-slate-700 italic">&quot;{order.revisionDescription}&quot;</p>
                                                    </div>
                                                )}

                                                {hasMilestones && (
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <p className="text-sm font-semibold text-slate-700">
                                                                {allMilestonesCompleted ? "Project Roadmap Completed" : "Current Project Phase"}
                                                            </p>
                                                            {activeMilestone?.dueDate && (
                                                                <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md border border-amber-100">
                                                                    <Clock className="w-3 h-3" /> Due on: {new Date(activeMilestone.dueDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {developmentMilestones.map((milestone, idx) => {
                                                            const isCompleted = milestone.status === 'APPROVED'
                                                            const isAdvance = milestone.title === "Advance Payment"
                                                            const isSubmitted = milestone.status === 'SUBMITTED'
                                                            // Only show review UI if ALL previous milestones are APPROVED
                                                            const prevAllApproved = developmentMilestones.slice(0, idx).every(m => m.status === 'APPROVED')
                                                            const isLocked = !prevAllApproved && !isCompleted
                                                            const needsApproval = prevAllApproved && isSubmitted
                                                            const isWaitingForSubmission = prevAllApproved && milestone.status === 'PENDING' && !isAdvance

                                                            const isLast = idx === developmentMilestones.length - 1;
                                                            const buttonLabel = isLast ? "Approve Final Work" : "Approve Submission";

                                                            if (isLocked) {
                                                                return (
                                                                    <div key={milestone.id} className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 opacity-50">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-bold text-slate-300 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center">{idx + 1}</span>
                                                                            <div>
                                                                                <p className="font-semibold text-slate-400 text-sm">{milestone.title}</p>
                                                                                <p className="text-[10px] text-slate-400">Unlocks after phase {idx} completion</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }

                                                            if (isCompleted) {
                                                                return (
                                                                    <div key={milestone.id} className="p-3 rounded-xl border border-green-200 bg-green-50/20 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-semibold text-green-800 text-sm">{milestone.title}</p>
                                                                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Payment Released</p>
                                                                            </div>
                                                                        </div>
                                                                        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 text-[10px]">Paid</Badge>
                                                                    </div>
                                                                )
                                                            }

                                                            return (
                                                                <div key={milestone.id} className={`p-5 rounded-xl border-2 shadow-sm ${needsApproval ? 'border-blue-400 bg-white'
                                                                    : isWaitingForSubmission ? 'border-amber-200 bg-amber-50/20'
                                                                        : 'border-slate-200 bg-slate-50/50'
                                                                    }`}>
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-bold text-white bg-blue-800 w-7 h-7 rounded-full flex items-center justify-center">{idx + 1}</span>
                                                                            <div>
                                                                                <p className="font-bold text-slate-900 text-base">{milestone.title}</p>
                                                                                {milestone.description && <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                                                                            <Badge variant={needsApproval ? 'secondary' : 'outline'} className="text-xs uppercase px-2 py-0.5">
                                                                                {milestone.status === 'PENDING' ? "Waiting for Submission"
                                                                                    : milestone.status === 'SUBMITTED' ? "Review Required"
                                                                                        : milestone.status.replace('_', ' ')}
                                                                            </Badge>
                                                                            <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">₹{milestone.amount.toLocaleString()}</span>
                                                                        </div>
                                                                    </div>


                                                                    {needsApproval && (
                                                                        <div className="mt-3 space-y-4">
                                                                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                                                                <p className="text-xs font-black text-blue-700 mb-2 uppercase tracking-widest flex items-center gap-2">
                                                                                    <Send className="w-3 h-3" /> Freelancer has submitted for review
                                                                                </p>
                                                                                <p className="text-xs font-bold text-blue-800 mb-3">Review the submission below to proceed.</p>
                                                                                <Link href={milestone.deliveryUrl!} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:bg-blue-100 w-fit p-2 rounded-lg transition-colors border border-blue-200 bg-white">
                                                                                    <Download className="w-4 h-4" />
                                                                                    Download Review Files
                                                                                </Link>
                                                                            </div>

                                                                            <div className="flex flex-col gap-3">
                                                                                <ApproveAndPayButton
                                                                                    orderId={order.id}
                                                                                    milestoneId={milestone.id}
                                                                                    amount={milestone.amount}
                                                                                    escrowAmount={milestone.escrowAmount}
                                                                                    currentBalance={order.buyer?.balance || 0}
                                                                                    milestoneName={milestone.title}
                                                                                    label={buttonLabel}
                                                                                    paymentType={paymentType}
                                                                                    isLast={isLast}
                                                                                    milestoneIndex={idx}
                                                                                />

                                                                                {!isAdvance && (order.revisionsRemaining > 0 || order.revisionsRemaining === -1) && (
                                                                                    <div className="pt-2">
                                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Or Request Changes</p>
                                                                                        <form action={requestMilestoneRevision} className="space-y-3">
                                                                                            <input type="hidden" name="milestoneId" value={milestone.id} />
                                                                                            <input type="hidden" name="orderId" value={order.id} />
                                                                                            <div className="relative">
                                                                                                <Textarea
                                                                                                    name="description"
                                                                                                    placeholder="What should the freelancer change? Be specific..."
                                                                                                    required
                                                                                                    className="text-sm min-h-[100px] bg-white border-slate-200 focus:border-purple-400 focus:ring-purple-100 rounded-xl resize-none"
                                                                                                />
                                                                                                <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-300">
                                                                                                    REVISION
                                                                                                </div>
                                                                                            </div>
                                                                                            <Button type="submit" variant="outline" className="w-full h-10 text-xs font-bold text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 rounded-xl transition-all active:scale-[0.98]">
                                                                                                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                                                                                Submit Revision Request
                                                                                            </Button>
                                                                                        </form>
                                                                                    </div>
                                                                                )}

                                                                                {order.revisionsRemaining === 0 && !isAdvance && isClient && isSubmitted && (
                                                                                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                                                                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                                                        <div>
                                                                                            <p className="text-sm font-bold text-amber-900">Revisions Exhausted</p>
                                                                                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                                                                                All allowed revisions for this project have been used. You must approve the current work to proceed.
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {prevAllApproved && milestone.status === 'IN_PROGRESS' && !needsPayment && (
                                                                        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                                                                <Clock className="w-4 h-4 text-slate-400 animate-spin-slow" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-600">Work in Progress</p>
                                                                                <p className="text-xs text-slate-400">Freelancer is currently working on this phase.</p>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {prevAllApproved && milestone.status === 'REVISION_REQUESTED' && (
                                                                        <div className="mt-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                                                                            <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                                                                                <RotateCcw className="w-3.5 h-3.5" /> Waiting for Resubmission
                                                                            </p>
                                                                            <p className="text-xs text-slate-500">The freelancer is addressing your feedback.</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* REVIEW SECTION */}
                        {
                            isCompleted && isClient && !review && (
                                <ReviewForm orderId={order.id} />
                            )
                        }

                        {
                            isCompleted && review && (() => {
                                const avgRating = (
                                    ((review as any).ratingProfessionalism || 5) +
                                    ((review as any).ratingTimeliness || 5) +
                                    ((review as any).ratingQualityOfWork || 5) +
                                    ((review as any).ratingCommunication || 5)
                                ) / 4;

                                return (
                                    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                            <CardTitle className="text-lg flex items-center justify-between">
                                                <span className="font-bold text-slate-900">{isClient ? "Your Review" : "Client Review"}</span>
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                        const fillPercent = star <= avgRating ? 100 : (star - 1 < avgRating ? (avgRating % 1) * 100 : 0);
                                                        return (
                                                            <div key={star} className="relative">
                                                                <Star className="w-4 h-4 text-slate-200" />
                                                                {fillPercent > 0 && (
                                                                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <span className="text-[13px] font-bold text-amber-600 ml-1">
                                                        {avgRating.toFixed(1)}
                                                    </span>
                                                </div>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-8 px-8 pb-8">
                                            <div className="flex flex-col md:flex-row gap-10">
                                                <div className="flex-1 space-y-4">
                                                    <p className="text-slate-700 italic text-xl leading-relaxed">"{review.comment}"</p>
                                                    <div className="flex items-center gap-3 pt-4">
                                                        <Avatar className="w-10 h-10 border border-slate-100">
                                                            <AvatarImage src={order.buyer?.avatarUrl || ""} />
                                                            <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                                                {order.buyer?.username?.charAt(0).toUpperCase() || "C"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{order.buyer?.username || "Anonymous"}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client • {new Date(review.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-64 space-y-3 pt-2">
                                                    {[
                                                        { label: "Professionalism", value: (review as any).ratingProfessionalism },
                                                        { label: "Timeliness", value: (review as any).ratingTimeliness },
                                                        { label: "Quality of Work", value: (review as any).ratingQualityOfWork },
                                                        { label: "Communication", value: (review as any).ratingCommunication },
                                                    ].map((cat) => (
                                                        <div key={cat.label} className="space-y-1.5">
                                                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                                <span>{cat.label}</span>
                                                                <span className="text-slate-900">{cat.value || 5}/5</span>
                                                            </div>
                                                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 rounded-full"
                                                                    style={{ width: `${((cat.value || 5) / 5) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()
                        }

                        {/* CLIENT REVIEW CARD (From Freelancer about Client) */}
                        {
                            isCompleted && order.clientReview && (() => {
                                const rev = order.clientReview as any;
                                const avgRating = (
                                    (rev.ratingRequirements || 5) +
                                    (rev.ratingCommunication || 5) +
                                    (rev.ratingCollaboration || 5) +
                                    (rev.ratingPaymentPromptness || 5)
                                ) / 4;

                                return (
                                    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden mt-6">
                                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                            <CardTitle className="text-lg flex items-center justify-between">
                                                <span className="font-bold text-slate-900">{isFreelancer ? "Your Review" : "Freelancer Review"}</span>
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                        const fillPercent = star <= avgRating ? 100 : (star - 1 < avgRating ? (avgRating % 1) * 100 : 0);
                                                        return (
                                                            <div key={star} className="relative">
                                                                <Star className="w-4 h-4 text-slate-200" />
                                                                {fillPercent > 0 && (
                                                                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <span className="text-[13px] font-bold text-amber-600 ml-1">
                                                        {avgRating.toFixed(1)}
                                                    </span>
                                                </div>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-8 px-8 pb-8">
                                            <div className="flex flex-col md:flex-row gap-10">
                                                <div className="flex-1 space-y-4">
                                                    <p className="text-slate-700 italic text-xl leading-relaxed">"{rev.comment}"</p>
                                                    <div className="flex items-center gap-3 pt-4">
                                                        <Avatar className="w-10 h-10 border border-slate-100">
                                                            <AvatarImage src={order.seller?.avatarUrl || ""} />
                                                            <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                                                {order.seller?.username?.charAt(0).toUpperCase() || "F"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{order.seller?.username || "Freelancer"}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Freelancer • {new Date(rev.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-64 space-y-3 pt-2">
                                                    {[
                                                        { label: "Requirements Clarity", value: rev.ratingRequirements },
                                                        { label: "Communication", value: rev.ratingCommunication },
                                                        { label: "Collaboration", value: rev.ratingCollaboration },
                                                        { label: "Payment Promptness", value: rev.ratingPaymentPromptness },
                                                    ].map((cat) => (
                                                        <div key={cat.label} className="space-y-1.5">
                                                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                                <span>{cat.label}</span>
                                                                <span className="text-slate-900">{cat.value || 5}/5</span>
                                                            </div>
                                                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${((cat.value || 5) / 5) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()
                        }

                        {/* Dispute section (kept for edge case) */}
                        {
                            isClient && !order.project && (order.revisionsRemaining === 0 || (order.revisionsRemaining !== -1 && order.revisionsRemaining === 0)) && !isDisputed && !isCancelled && (
                                <Card className="border-red-200 bg-red-50/50">
                                    <CardHeader className="pb-3 text-red-800">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            <CardTitle className="text-sm font-bold">Raise Dispute</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-xs text-red-700 leading-relaxed">
                                            You have used all your revisions. If you are unsatisfied, you can open a dispute.
                                        </p>
                                        <form action={raiseServiceDispute} className="space-y-3">
                                            <input type="hidden" name="orderId" value={order.id} />
                                            <div className="space-y-1">
                                                <Label htmlFor="dispute-reason-sidebar" className="text-[10px] font-bold uppercase text-red-400">Reason</Label>
                                                <Textarea
                                                    id="dispute-reason-sidebar"
                                                    name="reason"
                                                    placeholder="Why are you disputing?"
                                                    className="min-h-[80px] text-sm bg-white border-red-200 focus:border-red-500 rounded-lg resize-none"
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 rounded-lg transition-all active:scale-95">
                                                Raise Formal Dispute
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                </div>
            </div>
            <JobOrderFeedback
                order={order}
                isFreelancer={isFreelancer}
                hasReview={!!(isFreelancer ? (clientReview as any) : (review as any))}
            />
        </div>
    );
}
