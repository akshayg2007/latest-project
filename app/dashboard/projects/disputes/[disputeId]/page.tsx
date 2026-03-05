import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    Shield,
    ShieldCheck,
    Clock,
    MessageSquare,
    FileText,
    Scale,
    Send,
    ExternalLink,
    User,
    AlertTriangle,
    ArrowLeft
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { sendDisputeMessage } from "@/app/actions/adminActions"
import { formatDistanceToNow } from "date-fns"

export default async function UserDisputePage({ params }: { params: Promise<{ disputeId: string }> }) {
    const { disputeId } = await params
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const dispute = await db.dispute.findUnique({
        where: { id: disputeId },
        include: {
            order: {
                include: {
                    service: true,
                    product: true,
                    buyer: true,
                    seller: true
                }
            },
            project: {
                include: {
                    client: true,
                    freelancer: true
                }
            },
            messages: {
                include: { sender: true },
                orderBy: { createdAt: 'asc' }
            },
            raisedBy: true
        }
    })

    if (!dispute) notFound()

    // Check if user is part of the dispute
    const isBuyer = dispute.order?.buyerId === session.user.id || dispute.project?.clientId === session.user.id
    const isSeller = dispute.order?.sellerId === session.user.id || dispute.project?.freelancerId === session.user.id
    const isAdmin = (session.user as any).role === "ADMIN"

    if (!isBuyer && !isSeller && !isAdmin) {
        redirect("/dashboard")
    }

    const statusConfig: Record<string, { label: string; color: string; desc: string }> = {
        OPEN: {
            label: "Open",
            color: "bg-blue-100 text-blue-700",
            desc: "This case has been raised and is awaiting initial review from our support team."
        },
        UNDER_REVIEW: {
            label: "Under Review",
            color: "bg-amber-100 text-amber-700",
            desc: "A support agent is currently reviewing the evidence provided by both parties."
        },
        RESOLVED: {
            label: "Resolved",
            color: "bg-green-100 text-green-700",
            desc: "This case has been resolved and a final judgment has been made."
        },
        CLOSED: {
            label: "Closed",
            color: "bg-slate-100 text-slate-700",
            desc: "This case is closed."
        },
    }

    const status = statusConfig[dispute.status] || statusConfig.OPEN
    const targetName = dispute.project?.title || dispute.order?.service?.title || dispute.order?.product?.name || "Project/Service"

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* BACK BUTTON & HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/projects/disputes">
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Case Resolution #{disputeId.slice(0, 8)}</h1>
                                <Badge className={`${status.color} border-none font-black text-xs px-4 py-1 rounded-full uppercase tracking-widest`}>{status.label}</Badge>
                            </div>
                            <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                                <Scale className="w-4 h-4" /> Mediation Center
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: CASE FILE */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* CASE SUMMARY */}
                        <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                            <CardHeader className="border-b border-slate-50 bg-white px-8 py-6">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-indigo-600" /> Case File
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Disputed {dispute.order ? (dispute.order.product ? "Product" : "Service") : "Project"}</h4>
                                        <Link href={dispute.orderId ? (dispute.order?.product ? `/product-order/${dispute.orderId}` : `/service-order/${dispute.orderId}`) : `/dashboard/projects/active/${dispute.projectId}`}>
                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6 hover:border-blue-200 hover:bg-slate-100/50 transition-all group">
                                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Shield className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">{targetName}</p>
                                                    <p className="text-xs text-slate-500 mt-2 font-mono font-bold">ID: {dispute.orderId || dispute.projectId}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Status Update</h4>
                                        <div className={`p-6 rounded-3xl border ${status.color.replace('text-', 'border-').split(' ')[0]} flex flex-col gap-2 min-h-[100px] justify-center`}>
                                            <p className={`text-sm font-black uppercase tracking-widest ${status.color.split(' ')[1]}`}>{status.label}</p>
                                            <p className="text-xs text-slate-500 leading-normal font-medium">{status.desc}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Reason for Dispute</h4>
                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                        <p className="text-lg text-slate-700 leading-relaxed font-medium italic">"{dispute.reason}"</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* MEDIATION CHAT */}
                        <Card className="border-none shadow-2xl shadow-blue-100/40 overflow-hidden bg-white rounded-3xl">
                            <CardHeader className="bg-blue-600 text-white px-10 py-8">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-black flex items-center gap-3">
                                        <MessageSquare className="w-6 h-6" /> Mediation Thread
                                    </CardTitle>
                                    <Badge className="bg-white/20 border-none text-[10px] text-white uppercase font-black tracking-widest px-4 py-1">
                                        Direct Support Channel
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex flex-col min-h-[700px]">
                                <div className="flex-1 p-10 space-y-10 overflow-y-auto max-h-[650px]">
                                    {dispute.messages.map((msg: any) => {
                                        const isMe = msg.senderId === session.user?.id
                                        const senderRole = (msg.sender as any).role
                                        const isAdminMsg = senderRole === 'ADMIN'

                                        return (
                                            <div key={msg.id} className={`flex gap-6 ${isMe ? "justify-end" : ""}`}>
                                                <div className={`max-w-[75%] space-y-3 ${isMe ? "items-end flex flex-col" : ""}`}>
                                                    <div className="flex items-center gap-3">
                                                        {!isMe && !isAdminMsg && (
                                                            <>
                                                                <span className="text-xs font-black text-slate-900 lowercase italic">@{msg.sender.username}</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    ({(msg.senderId === dispute.order?.buyerId || msg.senderId === dispute.project?.clientId) ? "Buyer" : "Seller"})
                                                                </span>
                                                            </>
                                                        )}
                                                        {isAdminMsg && <Badge className="bg-slate-900 border-none text-[10px] font-black h-6 px-3 text-white">Platform Mediator</Badge>}
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className={`p-6 rounded-3xl text-sm md:text-base font-medium leading-relaxed shadow-sm ${isMe
                                                        ? "bg-slate-900 text-white rounded-tr-none"
                                                        : isAdminMsg
                                                            ? "bg-indigo-600 text-white rounded-tl-none"
                                                            : "bg-slate-50 border border-slate-100 rounded-tl-none text-slate-700 shadow-inner"
                                                        }`}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {dispute.messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20 opacity-40">
                                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                                <MessageSquare className="w-8 h-8 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-blue-900 uppercase tracking-widest">Investigation Pending</p>
                                                <p className="text-xs text-blue-600 mt-1 max-w-[240px]">A support agent will initiate the conversation shortly.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-white border-t border-slate-50 mt-auto">
                                    {dispute.status !== "RESOLVED" ? (
                                        <>
                                            <form action={sendDisputeMessage} className="relative group">
                                                <input type="hidden" name="disputeId" value={dispute.id} />
                                                <Input
                                                    name="text"
                                                    placeholder="Type message to mediator and other party..."
                                                    className="pr-14 py-8 rounded-2xl border-slate-200 focus-visible:ring-blue-600 bg-slate-50/50 shadow-inner group-focus-within:bg-white transition-all"
                                                    required
                                                />
                                                <Button
                                                    type="submit"
                                                    size="icon"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 w-10 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                            </form>
                                            <p className="text-[9px] text-slate-400 mt-3 text-center font-bold uppercase tracking-widest">
                                                This conversation is recorded as part of the formal resolution process.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="text-xs font-bold text-blue-900 leading-tight">Case Resolution Finalized</p>
                                                <p className="text-[10px] text-blue-600 font-medium">Further messaging is disabled for this historical record.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: PARTIES & ACTION */}
                    <div className="space-y-8">
                        {/* THE PARTIES */}
                        <Card className="border-none shadow-sm bg-white rounded-3xl">
                            <CardHeader className="px-8 pt-8">
                                <CardTitle className="text-xs font-black uppercase text-slate-300 tracking-widest">Involved Parties</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <Link href={`/users/${dispute.order?.buyer.username || dispute.project?.client.username}`}>
                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-slate-100 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                {dispute.order?.buyer.avatarUrl || dispute.project?.client.avatarUrl ? (
                                                    <img src={dispute.order?.buyer.avatarUrl ?? dispute.project?.client.avatarUrl ?? undefined} className="w-full h-full object-cover" alt="Buyer" />
                                                ) : (
                                                    <User className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 italic lowercase group-hover:text-blue-600 transition-colors">@{dispute.order?.buyer.username || dispute.project?.client.username}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Buyer</p>
                                            </div>
                                        </div>
                                        {(dispute.order?.buyerId === session.user.id || dispute.project?.clientId === session.user.id) && <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-black text-[10px] px-3 py-1">YOU</Badge>}
                                    </div>
                                </Link>

                                <Link href={`/users/${dispute.order?.seller.username || dispute.project?.freelancer.username}`}>
                                    <div className="flex items-center justify-between p-6 bg-blue-50/30 rounded-3xl border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                {dispute.order?.seller.avatarUrl || dispute.project?.freelancer.avatarUrl ? (
                                                    <img src={dispute.order?.seller.avatarUrl ?? dispute.project?.freelancer.avatarUrl ?? undefined} className="w-full h-full object-cover" alt="Seller" />
                                                ) : (
                                                    <User className="w-6 h-6 text-blue-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 italic lowercase group-hover:text-blue-600 transition-colors">@{dispute.order?.seller.username || dispute.project?.freelancer.username}</p>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Seller</p>
                                            </div>
                                        </div>
                                        {(dispute.order?.sellerId === session.user.id || dispute.project?.freelancerId === session.user.id) && <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-black text-[10px] px-3 py-1">YOU</Badge>}
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* CASE INFO - Only show Final Ruling when RESOLVED */}
                        {dispute.status === "RESOLVED" ? (
                            <Card className="border-none bg-blue-600 text-white shadow-xl shadow-blue-200/50 rounded-3xl">
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-black uppercase text-blue-200 tracking-widest">Final Ruling</h4>
                                        <div className="flex items-start gap-6">
                                            <Scale className="w-8 h-8 text-blue-200 shrink-0" />
                                            <div className="space-y-6 flex-1">
                                                <p className="text-lg font-bold text-white leading-relaxed italic">
                                                    "{dispute.resolution}"
                                                </p>
                                                <div className="flex items-center gap-4">
                                                    <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                                                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Decision</p>
                                                        <p className="text-sm font-black text-white">
                                                            {(dispute as any).decision === 'REFUND_BUYER' ? "Full Refund to Buyer" : "Payout Released to Seller"}
                                                        </p>
                                                    </div>
                                                    <Badge className="bg-emerald-500 text-[10px] font-black uppercase text-white h-6 border-none px-3">
                                                        Finalized
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-white/10" />

                                    <div className="space-y-6">
                                        <h4 className="text-xs font-black uppercase text-blue-200 tracking-widest">Case Timeline</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-blue-200 font-bold uppercase tracking-widest text-[10px]">Opened</span>
                                                <span className="font-black">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-blue-200 font-bold uppercase tracking-widest text-[10px]">Last Update</span>
                                                <span className="font-black">{formatDistanceToNow(dispute.updatedAt, { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-none bg-white shadow-sm rounded-3xl">
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-black uppercase text-slate-300 tracking-widest">Case Timeline</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Opened</span>
                                                <span className="font-black text-slate-700">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Last Update</span>
                                                <span className="font-black text-slate-700">{formatDistanceToNow(dispute.updatedAt, { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* WARNING */}
                        <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex gap-6">
                            <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-800 font-black leading-relaxed uppercase tracking-wide">
                                <span className="text-sm block mb-1">Warning:</span>
                                IMPORTANT: Communication outside the platform regarding this dispute is strictly prohibited and will result in an immediate unfavorable ruling.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
