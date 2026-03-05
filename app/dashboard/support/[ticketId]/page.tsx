import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    ArrowLeft,
    Headset,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    MessageSquare,
    Calendar,
    Mail,
    FileText,
    Reply,
    History
} from "lucide-react"
import Link from "next/link"
import { SupportChat } from "@/components/SupportChat"

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
    URGENT: { color: "text-red-700", bg: "bg-red-100", border: "border-red-200", label: "URGENT" },
    HIGH: { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", label: "HIGH" },
    MEDIUM: { color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200", label: "MEDIUM" },
    LOW: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "LOW" },
}

interface PageProps {
    params: Promise<{ ticketId: string }>
}

export default async function UserSupportTicketPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const { ticketId } = await params

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
                }
            }
        }
    })

    if (!ticket) return null

    // Fetch messages separately
    const messages = await db.supportMessage.findMany({
        where: { ticketId },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    role: true
                }
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM
    const metadata = (ticket.metadata as Record<string, any>) || {}

    const isOpen = ticket.status === "OPEN"
    const isInProgress = ticket.status === "IN_PROGRESS"
    const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/support">
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
                                Your support request · {ticket.category}
                                {ticket.subcategory ? ` → ${ticket.subcategory}` : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Ticket Details */}
                    <div className="lg:col-span-2 space-y-6">
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
                                    <p className="text-sm font-bold text-white">{ticket.category} {ticket.subcategory ? ` · ${ticket.subcategory}` : ""}</p>
                                </div>
                            </div>

                            <CardContent className="p-8 space-y-8">
                                {/* Description */}
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" />
                                        Your Description
                                    </h4>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {ticket.description}
                                    </div>
                                </div>

                                {/* Admin Response (if exists) */}
                                {metadata.adminNote && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <AlertTriangle className="w-3 h-3 text-blue-600" />
                                                Admin Response
                                            </h4>
                                            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                                                {metadata.adminNote}
                                            </div>
                                            {metadata.resolvedBy && (
                                                <p className="text-[10px] text-slate-400 mt-2 font-bold">
                                                    — Resolved by @{metadata.resolvedBy}
                                                    {metadata.resolvedAt && ` on ${new Date(metadata.resolvedAt).toLocaleDateString()}`}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Status History */}
                                {metadata.statusHistory && metadata.statusHistory.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <History className="w-3 h-3" />
                                                Status History
                                            </h4>
                                            <div className="space-y-3">
                                                {metadata.statusHistory.map((entry: any, idx: number) => (
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

                        <SupportChat
                            ticketId={ticket.id}
                            currentUserId={session.user.id}
                            messages={messages as any}
                        />
                    </div>

                    {/* RIGHT COLUMN: Ticket Info */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card className="border-none shadow-sm">
                            <CardHeader className={`rounded-t-xl py-6 ${isResolved
                                ? "bg-emerald-600 text-white"
                                : "bg-blue-600 text-white"
                                }`}>
                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                    {isResolved ? (
                                        <><CheckCircle className="w-5 h-5" /> Resolved</>
                                    ) : (
                                        <><Headset className="w-5 h-5" /> {isOpen ? "Open" : "In Progress"}</>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {isResolved ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Status</p>
                                                <p className="text-sm font-bold text-emerald-900">Ticket Resolved & Closed</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            This ticket has been resolved by our support team. If you have any further questions, please create a new ticket.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                                            <Headset className="w-6 h-6 text-blue-600 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Status</p>
                                                <p className="text-sm font-bold text-blue-900">Ticket {isOpen ? "Received" : "Being Reviewed"}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Our support team has received your ticket and will respond as soon as possible.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Ticket Info */}
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-3 h-3" />
                                    Ticket Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Priority</span>
                                        <Badge className={`font-bold text-xs ${priorityCfg.bg} ${priorityCfg.color} border-none`}>
                                            {priorityCfg.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status</span>
                                        <span className="font-bold text-slate-700">{ticket.status.replace("_", " ")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Submitted</span>
                                        <span className="font-bold text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Last Updated</span>
                                        <span className="font-bold text-slate-700">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
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
