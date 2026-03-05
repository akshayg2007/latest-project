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
import { RateClientButton } from "./RateClientButton"
import { JobOrderFeedback } from "@/components/JobOrderFeedback"
import { ApproveAndPayButton } from "@/components/ApproveAndPayButton"

import { sendDisputeMessage } from "@/app/actions/adminActions"
import { startConversation } from "@/app/actions/chat"
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
    Package,
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
    FileText
} from "lucide-react"
import Link from "next/link"
import ReviewForm from "@/components/ReviewForm"
import { ServicePriceDisplay } from "@/components/ServicePriceDisplay"
import { formatDistanceToNow } from "date-fns"

interface PageProps {
    params: Promise<{ orderId: string }>
}

export default async function ServiceOrderPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) return redirect("/signin")

    const { orderId } = await params

    const orderBase = await db.order.findUnique({
        where: { id: orderId }
    })

    if (!orderBase) return notFound()

    // Fetch relations
    const [service, buyer, seller, review, project, dispute, clientReview] = await Promise.all([
        orderBase.serviceId ? db.service.findUnique({ where: { id: orderBase.serviceId } }) : null,
        db.user.findUnique({ where: { id: orderBase.buyerId } }),
        db.user.findUnique({ where: { id: orderBase.sellerId } }),
        db.review.findUnique({ where: { orderId: orderBase.id } }),
        db.project.findUnique({ where: { orderId: orderBase.id }, include: { milestones: { orderBy: { createdAt: 'asc' } } } }),
        db.dispute.findFirst({
            where: { orderId: orderBase.id },
            orderBy: { createdAt: 'desc' }
        }),
        db.clientReview.findUnique({ where: { orderId: orderBase.id } })
    ])

    const order = {
        ...orderBase,
        service,
        buyer,
        seller,
        review,
        project,
        clientReview
    }


    if (!order.service) {
        // Check if it's a product order
        if (orderBase.productId) {
            return redirect(`/product-order/${orderId}`)
        }
    }


    const isSeller = session.user.id === order.sellerId
    const isBuyer = session.user.id === order.buyerId

    // Allow admins to view any order
    const currentUser = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    const isAdmin = currentUser?.role === "ADMIN"

    if (!isSeller && !isBuyer && !isAdmin) {
        return <div className="p-10 text-center">Unauthorized</div>
    }

    // AUTO-CANCELLATION LOGIC
    const isOverdue = order.deadline && new Date() > new Date(order.deadline) && order.status !== "COMPLETED" && order.status !== "CANCELLED"

    if (isOverdue) {
        // Auto-cancel the order if deadline passed
        await db.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" }
        })
        order.status = "CANCELLED"

        // Notify Buyer and Seller
        const { createNotification } = await import("@/lib/notifications")
        await Promise.all([
            createNotification(
                order.buyerId,
                `Order for ${order.service?.title} was auto-cancelled & refunded (Delivery Deadline Passed).`,
                `/service-order/${orderId}`
            ),
            createNotification(
                order.sellerId,
                `Order for ${order.service?.title} was auto-cancelled as you missed the deadline.`,
                `/service-order/${orderId}`
            )
        ])
    }

    const isCompleted = order.status === "COMPLETED" || order.status === "PAID"
    const isCancelled = order.status === "CANCELLED"
    const isDenied = order.status === "REVISION_DENIED"
    const isDisputed = order.status === "DISPUTED"
    const revisionRequested = order.revisionRequested
    const inRevision = order.status === "IN_REVISION"
    const hasMilestones = order.project?.milestones && order.project.milestones.length > 0

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
                            <h1 className="text-2xl font-bold text-slate-900">Service Order #{order.id.slice(0, 8)}</h1>
                            <p className="text-slate-500">Placed on {order.createdAt.toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${isCompleted ? "bg-green-100 text-green-700"
                        : isCancelled || isDenied ? "bg-red-100 text-red-700"
                            : isDisputed ? "bg-amber-100 text-amber-700"
                                : order.status === "REVISION_REQUESTED" ? "bg-purple-100 text-purple-700"
                                    : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {order.status.replace("_", " ")}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* MAIN CONTENT */}
                    <div className="md:col-span-2 space-y-6">

                        {order.service?.isRemoved && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-800">Original Listing Removed</p>
                                    <p className="text-xs text-red-700 mt-0.5">
                                        This service has been removed by platform administrators. Your order remains active and is still being processed, but the original listing details are no longer public.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SERVICE SUMMARY */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                <img
                                    src={order.service?.images[0] || "/placeholder.jpg"}
                                    className="w-24 h-16 object-cover rounded bg-slate-200"
                                    alt="Thumbnail"
                                />
                                <div>
                                    <h3 className="font-semibold text-slate-900">{(order as any).service?.title || (order as any).project?.title || "Service Order"}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Package className="w-4 h-4" /> Standard Package</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {order.service
                                                ? (order.service.deliveryTime ?? 0) >= 24
                                                    ? `${Math.floor((order.service.deliveryTime ?? 0) / 24)} Days Delivery`
                                                    : `${order.service.deliveryTime ?? 0} Hours Delivery`
                                                : "Unknown Delivery"}
                                        </span>
                                    </div>
                                    {(order.service || order.project) && order.revisionsRemaining !== undefined && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <RotateCcw className="w-3 h-3 text-blue-600" />
                                            <span className="text-xs font-medium text-blue-600">
                                                {order.revisionsRemaining === -1 ? "Unlimited revisions" : `${order.revisionsRemaining} revisions remaining`}
                                            </span>
                                        </div>
                                    )}

                                    {order.deadline && !isCompleted && !isCancelled && (
                                        <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                            <span className="text-xs font-bold text-amber-800">
                                                Deadline: {new Date(order.deadline).toLocaleString()}
                                                ({formatDistanceToNow(new Date(order.deadline), { addSuffix: true })})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* MILESTONES (Development Stages) */}
                        {order.project?.milestones && order.project.milestones.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="w-5 h-5" /> Development Stages
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {order.project.milestones.map((milestone: any) => (
                                        <div key={milestone.id} className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-900">{milestone.title}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Amount: <span className="font-bold text-slate-700">₹{milestone.amount}</span></p>
                                                    {milestone.description && <p className="text-sm text-slate-600 mt-2">{milestone.description}</p>}
                                                </div>
                                                <Badge variant={milestone.status === 'APPROVED' ? 'default' : milestone.status === 'SUBMITTED' ? 'secondary' : 'outline'}>
                                                    {milestone.status}
                                                </Badge>
                                            </div>

                                            {/* Milestone actions */}
                                            {isSeller && (['PENDING', 'IN_PROGRESS', 'IN_REVISION', 'REJECTED'].includes(milestone.status)) && (
                                                <form action={submitMilestone} className="flex gap-2 w-full mt-2">
                                                    <input type="hidden" name="milestoneId" value={milestone.id} />
                                                    <input type="hidden" name="orderId" value={order.id} />
                                                    <Input
                                                        id={`url-${milestone.id}`}
                                                        name="deliveryUrl"
                                                        placeholder="Delivery Link (Google Drive, Github, etc)"
                                                        required
                                                        type="url"
                                                        className="h-9 flex-1 text-xs"
                                                    />
                                                    <Button type="submit" size="sm" className="h-9">
                                                        Submit Work
                                                    </Button>
                                                </form>
                                            )}

                                            {milestone.status === 'SUBMITTED' && (
                                                <div className="flex flex-col gap-3 mt-2">
                                                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                        <div className="flex items-center gap-2">
                                                            <Download className="w-4 h-4 text-blue-600" />
                                                            <Link href={milestone.deliveryUrl!} target="_blank" className="text-sm font-medium text-blue-700 hover:underline">
                                                                View Delivered Work
                                                            </Link>
                                                        </div>
                                                        {isBuyer && (
                                                            <ApproveAndPayButton
                                                                orderId={order.id}
                                                                milestoneId={milestone.id}
                                                                amount={milestone.amount}
                                                                escrowAmount={milestone.escrowAmount}
                                                                currentBalance={order.buyer?.balance || 0}
                                                                milestoneName={milestone.title}
                                                                label="Approve Stage"
                                                            />
                                                        )}
                                                    </div>

                                                    {isBuyer && (order.revisionsRemaining > 0 || order.revisionsRemaining === -1) && (
                                                        <div className="p-4 bg-slate-100/50 rounded-lg border border-slate-200">
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Need changes?</p>
                                                            <form action={requestMilestoneRevision} className="space-y-2">
                                                                <input type="hidden" name="milestoneId" value={milestone.id} />
                                                                <input type="hidden" name="orderId" value={order.id} />
                                                                <Textarea
                                                                    name="description"
                                                                    placeholder="What needs to be revised in this stage?"
                                                                    className="text-xs min-h-[60px] bg-white"
                                                                    required
                                                                />
                                                                <Button type="submit" variant="outline" size="sm" className="w-full text-xs h-8 border-slate-300">
                                                                    Request Stage Revision
                                                                </Button>
                                                            </form>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {milestone.status === 'REVISION_REQUESTED' && (
                                                <div className="mt-2 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                                                    <p className="text-[10px] font-bold text-purple-600 uppercase mb-2">Revision Requested</p>
                                                    <p className="text-sm text-slate-700 italic">"{milestone.revisionDescription}"</p>

                                                    {isSeller && (
                                                        <div className="flex gap-2 mt-4">
                                                            <form action={acceptMilestoneRevision} className="flex-1">
                                                                <input type="hidden" name="milestoneId" value={milestone.id} />
                                                                <input type="hidden" name="orderId" value={order.id} />
                                                                <Button type="submit" size="sm" className="w-full bg-purple-600 text-white h-8 text-xs">
                                                                    Accept Revision
                                                                </Button>
                                                            </form>
                                                            <form action={denyMilestoneRevision} className="flex-1">
                                                                <input type="hidden" name="milestoneId" value={milestone.id} />
                                                                <input type="hidden" name="orderId" value={order.id} />
                                                                <Button type="submit" variant="outline" size="sm" className="w-full h-8 text-xs border-purple-200 text-purple-700">
                                                                    Decline
                                                                </Button>
                                                            </form>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {milestone.status === 'IN_REVISION' && (
                                                <div className="mt-2 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <RotateCcw className="w-3 h-3 text-blue-600 animate-spin-slow" />
                                                        <p className="text-xs font-medium text-blue-700">Freelancer is revising this stage...</p>
                                                    </div>
                                                    {isSeller && (
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase">Submit work again above</p>
                                                    )}
                                                </div>
                                            )}

                                            {milestone.status === 'REJECTED' && (
                                                <div className="mt-2 p-4 bg-red-50 border border-red-100 rounded-lg">
                                                    <p className="text-[10px] font-bold text-red-600 uppercase mb-2">Revision Declined</p>
                                                    {milestone.revisionDenialReason && (
                                                        <p className="text-sm text-red-800 font-medium">"{milestone.revisionDenialReason}"</p>
                                                    )}
                                                    {isBuyer && (
                                                        <p className="text-[10px] text-slate-500 mt-2">The freelancer has declined your revision request for this stage.</p>
                                                    )}
                                                </div>
                                            )}

                                            {milestone.status === 'APPROVED' && milestone.deliveryUrl && (
                                                <div className="flex items-center gap-2 mt-2 bg-green-50 p-3 rounded-lg border border-green-100">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    <Link href={milestone.deliveryUrl} target="_blank" className="text-xs font-bold text-green-800 hover:underline">
                                                        View Approved Work
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* STATUS AND ACTIONS CARD */}
                        <Card className={
                            isCompleted ? "border-green-200 bg-green-50/50"
                                : isCancelled ? "border-red-200 bg-red-50/50"
                                    : isDisputed ? "border-amber-200 bg-amber-50/50"
                                        : revisionRequested ? "border-purple-200 bg-purple-50/50"
                                            : "border-blue-200 bg-blue-50/50"
                        }>
                            <CardContent className="p-8 space-y-4">

                                {isDisputed ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-amber-800">Order Disputed</h2>
                                        <p className="text-amber-700 max-w-md mx-auto mb-6">
                                            This order is currently under review by our support team.
                                        </p>

                                        {dispute && (
                                            <div className="mt-6 space-y-4">
                                                <div className="p-6 bg-white rounded-2xl border border-amber-200 text-left shadow-sm">
                                                    <p className="text-[10px] text-amber-600 mb-2 uppercase tracking-widest font-black flex items-center gap-2">
                                                        <FileText className="w-3 h-3" /> Case #{dispute.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-sm text-slate-700 italic">"{dispute.reason}"</p>
                                                </div>

                                                <Link href={`/dashboard/projects/disputes/${dispute.id}`} className="block">
                                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-amber-200/50 transition-all active:scale-95 flex items-center justify-center gap-2">
                                                        <Shield className="w-4 h-4" />
                                                        Go to Dispute Resolution
                                                        <ExternalLink className="w-3 h-3 opacity-60" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}

                                        <div className="mt-8 pt-6 border-t border-amber-100">
                                            <p className="text-sm text-slate-500">
                                                Our team will contact both parties soon to resolve this matter.
                                            </p>
                                        </div>
                                    </div>
                                ) : isCompleted ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-green-800">
                                            {isSeller ? "Service Completed!" : "Service Delivered!"}
                                        </h2>
                                        <p className="text-green-700 max-w-md mx-auto mb-6">
                                            {hasMilestones
                                                ? "All development stages have been successfully approved and the service is complete."
                                                : isSeller
                                                    ? "You have successfully delivered the final work for this service."
                                                    : "The seller has delivered the final work. Review the files below."
                                            }
                                        </p>

                                        {order.deliveryUrl && !hasMilestones && (
                                            <div className="space-y-4">
                                                <Link href={order.deliveryUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        {isSeller ? "Download Your Delivery" : "Download Delivered Work"}
                                                    </Button>
                                                </Link>

                                                {/* Freelancer: rate the client if not yet done */}
                                                {isSeller && !order.clientReview && (
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

                                                {isBuyer && (order.revisionsRemaining > 0 || order.revisionsRemaining === -1) && (

                                                    <div className="pt-6 border-t border-green-200 mt-6">
                                                        <h4 className="text-sm font-bold text-green-800 mb-1">Not satisfied?</h4>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <p className="text-sm text-green-600">You can request a revision if you need changes.</p>
                                                            <Badge variant="outline" className="text-xs h-7 px-3 border-green-300 text-green-800 bg-green-100/50 font-bold">
                                                                {order.revisionsRemaining === -1 ? 'unlimited revisions' : `${order.revisionsRemaining} ${order.revisionsRemaining === 1 ? 'revision' : 'revisions'} left`}
                                                            </Badge>
                                                        </div>
                                                        <form action={requestRevision} className="space-y-4 text-left">
                                                            <input type="hidden" name="orderId" value={order.id} />
                                                            <div className="space-y-2">
                                                                <Label htmlFor="revision-desc" className="text-green-800">What needs to be changed?</Label>
                                                                <Textarea
                                                                    id="revision-desc"
                                                                    name="description"
                                                                    placeholder="Describe the changes you need..."
                                                                    className="bg-white border-green-200 focus:border-green-400"
                                                                    required
                                                                />
                                                            </div>
                                                            <Button type="submit" variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-100">
                                                                Request Revision
                                                            </Button>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : isCancelled ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <XCircle className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-red-800">Service Cancelled</h2>
                                        <p className="text-red-700 max-w-md mx-auto mt-2">
                                            {isSeller
                                                ? "You cancelled this service. The buyer has been notified."
                                                : "This service was cancelled by the seller."
                                            }
                                        </p>
                                        <Link href="/dashboard" className="inline-block mt-6">
                                            <Button variant="outline">
                                                Go to Dashboard
                                            </Button>
                                        </Link>
                                    </div>
                                ) : isDenied ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <XCircle className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold text-red-800">Revision Declined</h2>
                                            <h3 className="text-sm font-bold text-red-600/80 uppercase tracking-widest">Service Delivered!</h3>
                                        </div>
                                        <p className="text-slate-600 max-w-md mx-auto mb-8 mt-4">
                                            {isSeller
                                                ? "You have declined this revision request. Your previous delivery is still accessible to the buyer."
                                                : "The seller has declined your revision request. You can still access the original delivery below."
                                            }
                                        </p>

                                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                                            <div>
                                                <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-black text-left">{isBuyer ? "Your Request" : "Buyer's Request"}</p>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-left">
                                                    <p className="text-sm text-slate-600 italic">"{order.revisionDescription}"</p>
                                                </div>
                                            </div>

                                            {order.revisionDenialReason && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-black text-left">{isSeller ? "Your Reason" : "Seller's Reason"}</p>
                                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left">
                                                        <p className="text-sm text-red-800 font-bold">"{order.revisionDenialReason}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isBuyer && (order.revisionsRemaining > 0 || order.revisionsRemaining === -1) && (
                                            <div className="mt-10 bg-white p-8 rounded-2xl border border-slate-200 text-left shadow-sm">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                            <RotateCcw className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <h3 className="font-bold text-slate-900">Request New Revision</h3>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs h-7 px-3 border-slate-200 text-slate-600 font-bold bg-slate-50">
                                                        {order.revisionsRemaining === -1 ? 'unlimited' : order.revisionsRemaining} {order.revisionsRemaining === 1 ? 'revision' : 'revisions'} left
                                                    </Badge>
                                                </div>

                                                <p className="text-slate-500 text-sm mb-6">
                                                    Your previous request was declined. You can still use your remaining revisions to ask for a different set of changes.
                                                </p>

                                                <form action={requestRevision} className="space-y-4">
                                                    <input type="hidden" name="orderId" value={order.id} />
                                                    <div className="space-y-2">
                                                        <Label htmlFor="new-revision-desc" className="text-xs font-bold uppercase tracking-wider text-slate-400">What changes do you need now?</Label>
                                                        <Textarea
                                                            id="new-revision-desc"
                                                            name="description"
                                                            placeholder="Describe the changes you need..."
                                                            className="min-h-[120px] rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900/5 resize-none"
                                                            required
                                                        />
                                                    </div>
                                                    <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold h-12 rounded-xl transition-all active:scale-95">
                                                        Send New Revision Request
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                ) : revisionRequested ? (

                                    <div className="mt-6 bg-white p-6 rounded-lg border border-purple-100 text-left shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" /> Revision Details
                                            </h3>
                                            <Badge variant="outline" className="text-sm py-1 px-4 text-purple-800 border-purple-300 bg-purple-100/50 font-bold">
                                                {order.revisionsRemaining === -1 ? 'unlimited' : order.revisionsRemaining} {order.revisionsRemaining === 1 ? 'revision' : 'revisions'} left
                                            </Badge>
                                        </div>
                                        <p className="text-slate-700 text-sm whitespace-pre-wrap">
                                            {order.revisionDescription || "No description provided."}
                                        </p>

                                        {isSeller && (
                                            <div className="mt-6 space-y-3">
                                                <div className="flex flex-col gap-4">
                                                    <form action={acceptRevision} className="flex-1">
                                                        <input type="hidden" name="orderId" value={order.id} />
                                                        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                                                            Accept & Start Revision
                                                        </Button>
                                                    </form>

                                                    <Separator className="bg-purple-100" />

                                                    <form action={denyRevision} className="flex-1 space-y-3">
                                                        <input type="hidden" name="orderId" value={order.id} />
                                                        <div className="space-y-1.5">
                                                            <Label htmlFor="decline-reason" className="text-xs font-semibold text-purple-900">Reason for decline (optional)</Label>
                                                            <Textarea
                                                                id="decline-reason"
                                                                name="reason"
                                                                placeholder="Why are you declining this request?..."
                                                                className="text-xs min-h-[80px] border-purple-200 focus:border-purple-400"
                                                            />
                                                        </div>
                                                        <Button type="submit" variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
                                                            Decline Request
                                                        </Button>
                                                    </form>
                                                </div>
                                            </div>
                                        )}

                                        {isBuyer && (
                                            <p className="text-xs text-purple-600 mt-4 text-center">
                                                Awaiting seller to review your revision request.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            {order.status === "IN_REVISION" ? <RotateCcw className="w-8 h-8 animate-spin-slow" /> : <Clock className="w-8 h-8" />}
                                        </div>
                                        <h2 className="text-xl font-bold text-blue-800">
                                            {order.status === "IN_REVISION" ? "Revising Service" : "Service in Progress"}
                                        </h2>

                                        {isSeller ? (
                                            <div className="space-y-4 mt-6 text-left bg-white p-6 rounded-lg border shadow-sm">
                                                {hasMilestones ? (
                                                    <div className="text-center">
                                                        <p className="text-slate-500 mb-4">
                                                            Submit your work for each development stage above. Once all stages are completed, this service will be marked as finished.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="font-semibold text-slate-900">
                                                            {order.status === "IN_REVISION" ? "Deliver Revision" : "Deliver your work"}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 mb-4">
                                                            Paste a link to your updated files to complete this service.
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
                                                    <div className="mt-6 pt-4 border-t">
                                                        <form action={cancelService}>
                                                            <input type="hidden" name="orderId" value={order.id} />
                                                            <Button
                                                                type="submit"
                                                                variant="outline"
                                                                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancel Service
                                                            </Button>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                <p className="text-blue-700">
                                                    Seller <strong>{order.seller?.username || "Unknown"}</strong> is {order.status === "IN_REVISION" ? "working on your revision" : "working on your service"}.
                                                </p>
                                                {order.status === "IN_REVISION" && order.revisionDescription && (
                                                    <div className="mt-4 p-4 bg-white/50 rounded-lg border border-blue-100 text-left">
                                                        <p className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">Your Revision Request:</p>
                                                        <p className="text-sm text-slate-700 italic">"{order.revisionDescription}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* REVIEW SECTION */}
                        {isCompleted && isBuyer && !review && order.serviceId && (
                            <ReviewForm serviceId={order.serviceId} orderId={order.id} />
                        )}

                        {isCompleted && review && (() => {
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
                                            <span className="font-bold text-slate-900">{isBuyer ? "Your Review" : "Client Review"}</span>
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
                                                            {order.buyer?.username?.charAt(0).toUpperCase() || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{order.buyer?.username || "Anonymous"}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Purchase • {new Date(review.createdAt).toLocaleDateString()}</p>
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
                            )
                        })()}

                        {/* CLIENT REVIEW CARD (From Freelancer about Client) */}
                        {isCompleted && order.clientReview && (() => {
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
                                            <span className="font-bold text-slate-900">{isSeller ? "Your Review" : "Freelancer Review"}</span>
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
                                                            {order.seller?.username?.charAt(0).toUpperCase() || "S"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{order.seller?.username || "Freelancer"}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Completed • {new Date(rev.createdAt).toLocaleDateString()}</p>
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
                            )
                        })()}


                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-wider text-slate-500">
                                    {isSeller ? "Buyer" : "Seller"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden font-bold text-slate-500">
                                    {(isSeller ? order.buyer?.avatarUrl : order.seller?.avatarUrl) ? (
                                        <img
                                            src={isSeller ? order.buyer?.avatarUrl! : order.seller?.avatarUrl!}
                                            className="w-full h-full object-cover"
                                            alt="User avatar"
                                        />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">
                                        {isSeller ? order.buyer?.username : order.seller?.username}
                                    </p>

                                    <form action={async () => {
                                        "use server"
                                        await startConversation(isSeller ? order.buyerId : order.sellerId)
                                    }}>
                                        <button
                                            type="submit"
                                            className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-1 font-medium bg-transparent border-none p-0 cursor-pointer"
                                        >
                                            <MessageCircle className="w-3 h-3" />
                                            Send Message
                                        </button>
                                    </form>

                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-slate-500">Service Price</span>
                                    <ServicePriceDisplay price={order.price} size="md" />
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total</span>
                                    <ServicePriceDisplay price={order.price} size="lg" />
                                </div>
                            </CardContent>
                        </Card>

                        {isBuyer && order.revisionsRemaining === 0 && !isDisputed && !isCancelled && (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardHeader className="pb-3 text-red-800">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <CardTitle className="text-sm font-bold">Raise Dispute</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        You have used all your revisions and the seller has declined your last request. If you are still unsatisfied, you can open a dispute.
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

                <JobOrderFeedback
                    order={{ ...order, buyer, seller }}
                    isFreelancer={isSeller}
                    hasReview={isSeller ? !!clientReview : !!review}
                />
            </div>
        </div>
    )
}
