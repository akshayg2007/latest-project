import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
    ArrowLeft,
    Headset,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Mail,
    Calendar,
    Shield,
    FileText,
    Tag,
    Zap,
    MessageSquare,
    History,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { updateTicketStatus } from "@/app/actions/adminSupport"
import { SupportChat } from "@/components/admin/SupportChat"

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; ringColor: string }> = {
    URGENT: { color: "text-red-700", bg: "bg-red-100", border: "border-red-200", label: "URGENT", ringColor: "ring-red-500" },
    HIGH: { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", label: "HIGH", ringColor: "ring-amber-500" },
    MEDIUM: { color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200", label: "MEDIUM", ringColor: "ring-blue-500" },
    LOW: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "LOW", ringColor: "ring-slate-400" },
}

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
    const { ticketId } = await params
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const adminUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (adminUser?.role !== "ADMIN") redirect("/dashboard")

    const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarUrl: true,
                    activeProfile: true,
                    createdAt: true,
                    bio: true,
                    isBanned: true,
                    credibility: { select: { score: true } },
                    _count: {
                        select: {
                            supportTickets: true,
                            reports: true,
                        }
                    }
                }
            }
        }
    })

    if (!ticket) notFound()

    const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM
    const metadata = (ticket.metadata as Record<string, any>) || {}
    const statusHistory: Array<{ from: string; to: string; by: string; at: string }> = metadata.statusHistory || []

    const isOpen = ticket.status === "OPEN"
    const isInProgress = ticket.status === "IN_PROGRESS"
    const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"

    // Get other tickets from same user for context
    const userTicketCount = await db.supportTicket.count({
        where: { userId: ticket.userId }
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/support">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-black text-slate-900">Ticket #{ticket.id.slice(0, 8)}</h1>
                            <Badge className={`border-none font-black text-[10px] uppercase tracking-widest ${priorityCfg.bg} ${priorityCfg.color}`}>
                                {priorityCfg.label}
                            </Badge>
                            <Badge className={`border-none font-black text-[10px] uppercase tracking-widest ${isOpen ? "bg-amber-100 text-amber-700" :
                                isInProgress ? "bg-blue-100 text-blue-700" :
                                    "bg-emerald-100 text-emerald-700"
                                }`}>
                                {ticket.status.replace("_", " ")}
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm">
                            Support request from <strong>@{ticket.user.username}</strong> · {ticket.category}
                            {ticket.subcategory ? ` → ${ticket.subcategory}` : ""}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Ticket Details */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Ticket Content Card */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className={`p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${ticket.priority === "URGENT" ? "bg-gradient-to-r from-red-600 to-red-700" :
                            ticket.priority === "HIGH" ? "bg-gradient-to-r from-amber-600 to-amber-700" :
                                "bg-slate-900"
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Headset className="w-5 h-5 text-white/80" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Subject</p>
                                    <h3 className="font-bold text-lg leading-tight">{ticket.subject}</h3>
                                </div>
                            </div>
                            <div className="text-left md:text-right">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Category</p>
                                <p className="text-sm font-bold">{ticket.category} {ticket.subcategory ? `· ${ticket.subcategory}` : ""}</p>
                            </div>
                        </div>

                        <CardContent className="p-8 space-y-8">
                            {/* Description */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    User&apos;s Description
                                </h4>
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {ticket.description}
                                </div>
                            </div>

                            <Separator />

                            {/* Metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                                    <Badge className={`font-bold text-xs ${priorityCfg.bg} ${priorityCfg.color} border-none`}>
                                        {ticket.priority === "URGENT" && <Zap className="w-3 h-3 mr-1" />}
                                        {priorityCfg.label}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="font-bold text-slate-900 text-sm">{ticket.status.replace("_", " ")}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
                                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {new Date(ticket.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>

                            {/* Bot Path Metadata */}
                            {metadata.botPath && metadata.botPath.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Tag className="w-3 h-3" />
                                            Bot Navigation Path
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {metadata.botPath.map((nodeId: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                                                        {nodeId.replace(/_/g, " ")}
                                                    </span>
                                                    {idx < metadata.botPath.length - 1 && (
                                                        <span className="text-slate-300 text-xs">→</span>
                                                    )}
                                                </div>
                                            ))}
                                            {metadata.nodeId && (
                                                <>
                                                    <span className="text-slate-300 text-xs">→</span>
                                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg">
                                                        {metadata.nodeId.replace(/_/g, " ")}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Admin Note (if exists) */}
                            {metadata.adminNote && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Shield className="w-3 h-3 text-blue-600" />
                                            Admin Response
                                        </h4>
                                        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                                            {metadata.adminNote}
                                        </div>
                                        {metadata.resolvedBy && (
                                            <p className="text-[10px] text-slate-400 mt-2 font-bold">
                                                — Handled by @{metadata.resolvedBy}
                                                {metadata.resolvedAt && ` on ${new Date(metadata.resolvedAt).toLocaleDateString()}`}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Status History */}
                            {statusHistory.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <History className="w-3 h-3" />
                                            Status History
                                        </h4>
                                        <div className="space-y-3">
                                            {statusHistory.map((entry, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                                    <span className="text-slate-500">
                                                        <strong className="text-slate-700">@{entry.by}</strong> changed status from{" "}
                                                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold uppercase mx-0.5">
                                                            {entry.from.replace("_", " ")}
                                                        </Badge>
                                                        {" → "}
                                                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold uppercase mx-0.5">
                                                            {entry.to.replace("_", " ")}
                                                        </Badge>
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                                                        {new Date(entry.at).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* LIVE CHAT INTERFACE */}
                    <SupportChat ticketId={ticket.id} currentUserId={session.user.id} />
                </div>

                {/* RIGHT COLUMN: Actions */}
                <div className="lg:col-span-4 space-y-6">
                    {/* User Info Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3" /> Submitted By
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                {ticket.user.avatarUrl ? (
                                    <img src={ticket.user.avatarUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
                                        <User className="w-6 h-6 text-slate-400" />
                                    </div>
                                )}
                                <div>
                                    <Link href={`/users/${ticket.user.username}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                                        @{ticket.user.username}
                                    </Link>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className={`text-[8px] h-4 font-bold uppercase ${ticket.user.activeProfile === "SELLER" ? "border-blue-200 text-blue-600" : "border-emerald-200 text-emerald-600"}`}>
                                            {ticket.user.activeProfile}
                                        </Badge>
                                        {ticket.user.isBanned && (
                                            <Badge className="bg-red-100 text-red-700 border-none text-[8px] h-4 font-bold uppercase">BANNED</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Email
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs truncate max-w-[160px]">{ticket.user.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Joined
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs">{new Date(ticket.user.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Shield className="w-3 h-3" /> Credibility
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs">{ticket.user.credibility?.score ?? "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Headset className="w-3 h-3" /> Total Tickets
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs">{userTicketCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" /> Reports Filed
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs">{ticket.user._count.reports}</span>
                                </div>
                            </div>

                            <Link href={`/users/${ticket.user.username}`}>
                                <Button variant="outline" className="w-full mt-2 text-xs font-bold rounded-xl border-slate-200">
                                    View Full Profile
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Action Card */}
                    <Card className="border-none shadow-sm sticky top-8">
                        <CardHeader className={`rounded-t-xl py-6 ${isResolved
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                            }`}>
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                {isResolved ? (
                                    <><CheckCircle className="w-5 h-5" /> Resolved</>
                                ) : (
                                    <><Headset className="w-5 h-5" /> Take Action</>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {isResolved ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Status</p>
                                            <p className="text-sm font-bold text-emerald-900">Ticket Resolved & Closed</p>
                                        </div>
                                    </div>

                                    {/* Reopen option */}
                                    <form action={updateTicketStatus}>
                                        <input type="hidden" name="ticketId" value={ticket.id} />
                                        <input type="hidden" name="status" value="OPEN" />
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 font-bold rounded-xl"
                                        >
                                            Reopen Ticket
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                <form action={updateTicketStatus} className="space-y-6">
                                    <input type="hidden" name="ticketId" value={ticket.id} />

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Note / Response</p>
                                        <Textarea
                                            name="adminNote"
                                            placeholder="Write your response or internal note here..."
                                            className="min-h-[120px] rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-2">
                                        {isOpen && (
                                            <Button
                                                type="submit"
                                                name="status"
                                                value="IN_PROGRESS"
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl group"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4" /> Mark In Progress
                                                    </span>
                                                    <span className="text-[8px] opacity-70 uppercase tracking-widest">Start working on this ticket</span>
                                                </div>
                                            </Button>
                                        )}

                                        <Button
                                            type="submit"
                                            name="status"
                                            value="RESOLVED"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl group"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Resolve Ticket
                                                </span>
                                                <span className="text-[8px] opacity-70 uppercase tracking-widest">User will be notified</span>
                                            </div>
                                        </Button>

                                        <Button
                                            type="submit"
                                            name="status"
                                            value="CLOSED"
                                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl group"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="flex items-center gap-2">Close Ticket</span>
                                                <span className="text-[8px] opacity-70 uppercase tracking-widest">Close without resolution</span>
                                            </div>
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
