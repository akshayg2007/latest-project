import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
    AlertTriangle,
    CheckCircle,
    MessageSquare,
    FileText,
    Download,
    User,
    TrendingDown,
    TrendingUp,
    Scale,
    ShieldCheck,
    ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Price } from "@/components/Price"
import Link from "next/link"
import { resolveDispute, sendDisputeMessage } from "@/app/actions/adminActions"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

export default async function DisputeResolutionPage({ params }: { params: Promise<{ disputeId: string }> }) {
    const { disputeId } = await params
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const dispute = await db.dispute.findUnique({
        where: { id: disputeId },
        include: {
            order: {
                include: {
                    service: true,
                    product: true,
                    buyer: true,
                    seller: true,
                    project: {
                        include: {
                            milestones: true,
                        }
                    }
                }
            },
            project: {
                include: {
                    client: true,
                    freelancer: true,
                    milestones: true
                }
            },
            raisedBy: true,
            messages: {
                include: { sender: true },
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!dispute || !dispute.order) notFound()

    // Fetch conversation between buyer and seller
    const conversation = await db.conversation.findFirst({
        where: {
            OR: [
                { userAId: dispute.order.buyerId, userBId: dispute.order.sellerId },
                { userAId: dispute.order.sellerId, userBId: dispute.order.buyerId }
            ]
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                include: { sender: true }
            }
        }
    })

    const isResolved = dispute.status === "RESOLVED"

    const actualProject = dispute.project || (dispute.order as any)?.project
    const actualProjectId = dispute.projectId || (dispute.order as any)?.project?.id

    const isProject = !!actualProject
    const isService = !!dispute.order?.serviceId
    const isProduct = !!dispute.order?.productId
    const itemType = isProject ? "Job" : isProduct ? "Product" : isService ? "Service" : "Order"

    const totalEscrow = actualProject?.milestones.reduce((acc: number, m: any) => acc + (m.escrowAmount || 0), 0) || 0

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/disputes">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900">Case Resolution #{dispute.id.slice(0, 8)}</h1>
                                <Badge className={`border-none font-black text-[10px] uppercase tracking-widest ${itemType === "Product" ? "bg-purple-100 text-purple-700" :
                                    itemType === "Service" ? "bg-blue-100 text-blue-700" :
                                        "bg-emerald-100 text-emerald-700"
                                    }`}>
                                    {itemType}
                                </Badge>
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black text-[10px] uppercase tracking-widest">
                                    {dispute.status.replace("_", " ")}
                                </Badge>
                            </div>
                            <p className="text-slate-500 text-sm">Reviewing conflict between <strong>@{dispute.order.buyer.username}</strong> and <strong>@{dispute.order.seller.username}</strong></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: ORDER & EVIDENCE */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* CASE SUMMARY CARD */}
                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispute Reason</p>
                                        <h3 className="font-bold text-lg leading-tight">{dispute.reason}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Value</p>
                                    <div className="text-xl font-black text-white"><Price amount={dispute.order.price} /></div>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Original {itemType}</h4>
                                        {isProject ? (
                                            <Link href={`/dashboard/projects/active/${actualProjectId}`} className="flex gap-4 group/service hover:opacity-80 transition-opacity">
                                                <div className="w-20 h-20 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                    <FileText className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight mb-1 group-hover/service:text-emerald-600 transition-colors">
                                                        {actualProject?.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {actualProject?.description}
                                                    </p>
                                                    <Badge variant="outline" className="mt-2 text-[8px] h-4 border-emerald-200 text-emerald-600 uppercase font-black">
                                                        {actualProject?.status}
                                                    </Badge>
                                                </div>
                                            </Link>
                                        ) : (
                                            <Link href={isProduct ? `/dashboard/explore/products/${dispute.order?.productId}` : `/services/${dispute.order?.serviceId}`} className="flex gap-4 group/service hover:opacity-80 transition-opacity">
                                                <img
                                                    src={dispute.order?.service?.images[0] || dispute.order?.product?.images[0] || "/placeholder.jpg"}
                                                    className="w-20 h-20 object-cover rounded-xl bg-slate-100"
                                                    alt="Asset"
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight mb-1 group-hover/service:text-blue-600 transition-colors">
                                                        {dispute.order?.service?.title || dispute.order?.product?.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {dispute.order?.service?.description || dispute.order?.product?.description}
                                                    </p>
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Deliverables & Materials</h4>
                                        {isProject && actualProject?.milestones ? (
                                            <div className="space-y-3">
                                                {actualProject.milestones.some((m: any) => m.deliveryUrl) ? (
                                                    actualProject.milestones.filter((m: any) => m.deliveryUrl).map((milestone: any, idx: number) => (
                                                        <div key={idx} className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                                                <div>
                                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Milestone Delivery</p>
                                                                    <p className="text-sm font-bold text-blue-900 truncate max-w-[150px]">{milestone.title}</p>
                                                                </div>
                                                            </div>
                                                            <Link href={milestone.deliveryUrl} target="_blank">
                                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8">
                                                                    <Download className="w-3 h-3 mr-2" /> Download
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                                        <p className="text-sm font-bold text-red-900">No work has been delivered yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : itemType === "Product" && dispute.order?.product ? (
                                            <div className="space-y-3">
                                                {dispute.order.product.fileUrls && dispute.order.product.fileUrls.length > 0 ? (
                                                    dispute.order.product.fileUrls.map((url: string, idx: number) => (
                                                        <div key={idx} className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="w-5 h-5 text-purple-600" />
                                                                <div>
                                                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Product File</p>
                                                                    <p className="text-sm font-bold text-purple-900 truncate max-w-[150px]">File {idx + 1}</p>
                                                                </div>
                                                            </div>
                                                            <Link href={url} target="_blank">
                                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-8">
                                                                    <Download className="w-3 h-3 mr-2" /> Download
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                                        <p className="text-sm font-bold text-red-900">No product files found.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : dispute.order?.deliveryUrl ? (
                                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Seller's Delivery</p>
                                                        <p className="text-sm font-bold text-blue-900">Work Submission Uploaded</p>
                                                    </div>
                                                </div>
                                                <Link href={dispute.order.deliveryUrl} target="_blank">
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8">
                                                        <Download className="w-3 h-3 mr-2" /> Download
                                                    </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                                <p className="text-sm font-bold text-red-900">No work has been delivered yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator className="my-8" />

                                <Separator className="my-8" />

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> Private Chat History
                                    </h4>
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6 max-h-[400px] overflow-y-auto">
                                        {conversation?.messages.map((msg: any) => (
                                            <div key={msg.id} className={`flex gap-3 ${msg.senderId === dispute.order?.buyerId ? "bg-white p-4 rounded-2xl shadow-sm border border-slate-100" : ""}`}>
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                    {msg.sender.avatarUrl ? (
                                                        <img src={msg.sender.avatarUrl} className="w-full h-full object-cover rounded-full" alt="User" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-900 lowercase italic">@{msg.sender.username}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                                                        {msg.senderId === dispute.order?.buyerId && <Badge variant="outline" className="text-[8px] h-4 border-slate-200 uppercase font-bold text-slate-400">Buyer</Badge>}
                                                        {msg.senderId === dispute.order?.sellerId && <Badge variant="outline" className="text-[8px] h-4 border-blue-200 uppercase font-bold text-blue-400">Seller</Badge>}
                                                    </div>
                                                    <p className="text-sm text-slate-700 leading-relaxed">{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {!conversation?.messages.length && (
                                            <p className="text-center py-10 text-slate-400 italic text-sm">No private messages found.</p>
                                        )}
                                    </div>
                                </div>

                                <Separator className="my-8" />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Scale className="w-3 h-3 text-blue-600" /> Mediation Thread (Group Chat)
                                        </h4>
                                        <Badge className="bg-blue-600 text-white border-none font-black text-[8px] uppercase tracking-widest">
                                            Tri-Party Mediation
                                        </Badge>
                                    </div>

                                    <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100 flex flex-col min-h-[500px]">
                                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 mb-6 max-h-[400px]">
                                            {dispute.messages.map((msg: any) => {
                                                const senderRole = msg.sender.role
                                                const isAdminMsg = senderRole === 'ADMIN'
                                                const isMyAdminMsg = isAdminMsg && msg.senderId === session.user?.id

                                                return (
                                                    <div key={msg.id} className={`flex gap-3 ${isAdminMsg ? "justify-end" : ""}`}>
                                                        <div className={`max-w-[85%] space-y-1 ${isAdminMsg ? "items-end flex flex-col" : ""}`}>
                                                            <div className="flex items-center gap-2">
                                                                {!isAdminMsg && (
                                                                    <>
                                                                        <span className="text-[10px] font-black text-slate-900 lowercase italic">@{msg.sender.username}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                            {(msg.senderId === dispute.order?.buyerId || msg.senderId === actualProject?.clientId) ? "Buyer" : "Seller"}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {isAdminMsg && <Badge className="bg-slate-900 border-none text-[8px] font-black h-4 px-2 text-white">( Admin ) Support Agent</Badge>}
                                                                <span className="text-[8px] text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className={`p-4 rounded-2xl text-sm ${isAdminMsg
                                                                ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-100"
                                                                : "bg-white border border-slate-100 rounded-tl-none text-slate-700 shadow-sm"
                                                                }`}>
                                                                {msg.text}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {!dispute.messages.length && (
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-20">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <MessageSquare className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <p className="text-slate-400 italic text-sm">No mediation messages yet.</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest max-w-[200px]">Start the group chat to begin investigation</p>
                                                </div>
                                            )}
                                        </div>

                                        {!isResolved ? (
                                            <form action={sendDisputeMessage} className="mt-auto relative">
                                                <input type="hidden" name="disputeId" value={dispute.id} />
                                                <Input
                                                    name="text"
                                                    placeholder="Send a message to both buyer and seller..."
                                                    className="pr-14 py-6 rounded-xl border-slate-200 focus-visible:ring-blue-600 bg-white"
                                                    required
                                                />
                                                <Button
                                                    type="submit"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 w-10 flex items-center justify-center p-0"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        ) : (
                                            <div className="mt-auto p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-3">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                <p className="text-xs font-bold text-emerald-800">This case has been resolved. Messaging is disabled.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: ACTIONS */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-sm sticky top-8">
                            <CardHeader className="bg-blue-600 text-white rounded-t-xl py-6">
                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                    <Scale className="w-5 h-5" />
                                    Final Judgment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {isResolved ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Outcome</p>
                                                <p className="text-sm font-bold text-emerald-900">Case Resolved & Closed</p>
                                                {dispute.decision && (
                                                    <p className="text-[10px] font-bold text-emerald-700/80 mt-1 uppercase tracking-wider">
                                                        Ruling: {
                                                            dispute.decision === 'REFUND_BUYER' ? "Full Refund to Buyer" :
                                                                dispute.decision === 'PAY_SELLER' ? "Payout Released to Seller" :
                                                                    "Dispute Dismissed (Sale Stands)"
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Statement</p>
                                            <div className="p-4 rounded-xl bg-white border border-slate-200 italic text-sm text-slate-600">
                                                "{dispute.resolution}"
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form action={resolveDispute} className="space-y-6">
                                        <input type="hidden" name="disputeId" value={dispute.id} />

                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruling Statement</p>
                                            <Textarea
                                                name="resolution"
                                                placeholder="Explain your decision to both parties..."
                                                className="min-h-[120px] rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 pt-4">
                                            <Button
                                                type="submit"
                                                name="decision"
                                                value="REFUND_BUYER"
                                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl group"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="flex items-center gap-2">Refund Buyer</span>
                                                    <span className="text-[8px] opacity-70 uppercase tracking-widest">Seller loses payout</span>
                                                </div>
                                            </Button>
                                            <Button
                                                type="submit"
                                                name="decision"
                                                value="PAY_SELLER"
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl group"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="flex items-center gap-2">Rule for Seller</span>
                                                    <span className="text-[8px] opacity-70 uppercase tracking-widest">Seller gets +5 Credibility</span>
                                                </div>
                                            </Button>
                                            <Button
                                                type="submit"
                                                name="decision"
                                                value="DISMISS"
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl group"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="flex items-center gap-2">Dismiss Dispute</span>
                                                    <span className="text-[8px] opacity-70 uppercase tracking-widest">Sale stands. No score impact.</span>
                                                </div>
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                <Separator />

                                {/* Financial Outlook */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Overview</h4>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-medium">Order Price</span>
                                            <span className="text-sm font-bold text-slate-900">
                                                <Price amount={dispute.order.price} />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-medium">Held in Escrow</span>
                                            <span className="text-sm font-bold text-blue-600">
                                                <Price amount={totalEscrow} />
                                            </span>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700">At Stake</span>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-slate-900 leading-none">
                                                    <Price amount={totalEscrow || dispute.order.price} />
                                                </span>
                                                <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                                                    {totalEscrow > 0 ? "Refund/Release Amount" : "Order Value"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {totalEscrow > 0 && (
                                        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                                            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5" />
                                            <p className="text-[10px] font-medium text-blue-800 leading-relaxed">
                                                Funds are safely held in TrueWork Escrow. This decision will instantly process refunds or payouts.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parties Involved</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">B</div>
                                                <Link href={`/users/${dispute.order.buyer.username}`} className="text-sm font-bold text-slate-700 hover:text-blue-600">
                                                    @{dispute.order.buyer.username}
                                                </Link>
                                            </div>
                                            <Badge variant="outline" className="text-[8px] border-slate-200">Buyer</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center font-bold text-[10px] text-blue-500">S</div>
                                                <Link href={`/users/${dispute.order.seller.username}`} className="text-sm font-bold text-slate-700 hover:text-blue-600">
                                                    @{dispute.order.seller.username}
                                                </Link>
                                            </div>
                                            <Badge variant="outline" className="text-[8px] border-blue-200 text-blue-600">Seller</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
