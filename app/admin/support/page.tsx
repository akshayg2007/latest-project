import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Headset, Clock, CheckCircle, Loader2, AlertTriangle, ArrowUpRight, User, Inbox } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SupportFilters } from "@/components/admin/SupportFilters"
import Link from "next/link"
import { Suspense } from "react"

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
    URGENT: { color: "text-red-700", bg: "bg-red-100", border: "border-red-200", label: "URGENT" },
    HIGH: { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", label: "HIGH" },
    MEDIUM: { color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200", label: "MEDIUM" },
    LOW: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "LOW" },
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    OPEN: { color: "text-amber-700", bg: "bg-amber-100", icon: AlertTriangle },
    IN_PROGRESS: { color: "text-blue-700", bg: "bg-blue-100", icon: Loader2 },
    RESOLVED: { color: "text-emerald-700", bg: "bg-emerald-100", icon: CheckCircle },
    CLOSED: { color: "text-slate-600", bg: "bg-slate-100", icon: CheckCircle },
}

function timeAgo(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
}

export default async function AdminSupportPage({
    searchParams
}: {
    searchParams: Promise<{ filter?: string; q?: string }>
}) {
    const { filter, q } = await searchParams
    const session = await auth()

    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") redirect("/dashboard")

    const activeFilter = filter || "open"

    const statusFilter = activeFilter === "resolved"
        ? { in: ["RESOLVED" as const, "CLOSED" as const] }
        : activeFilter === "in_progress"
            ? ("IN_PROGRESS" as const)
            : ("OPEN" as const)

    const tickets = await db.supportTicket.findMany({
        where: {
            status: statusFilter,
            ...(q ? {
                OR: [
                    { subject: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { user: { username: { contains: q, mode: 'insensitive' } } },
                    { user: { email: { contains: q, mode: 'insensitive' } } },
                ]
            } : {})
        },
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
        },
        orderBy: { createdAt: "desc" }
    })

    // Stats
    const [openCount, progressCount, resolvedCount] = await Promise.all([
        db.supportTicket.count({ where: { status: "OPEN" } }),
        db.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
        db.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    ])

    const urgentCount = await db.supportTicket.count({ where: { status: "OPEN", priority: "URGENT" } })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Headset className="w-6 h-6 text-blue-600" />
                        Support Center
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage user support tickets and requests.</p>
                </div>

                <div className="flex items-center gap-4">
                    <Suspense fallback={<div className="h-10 w-64 bg-slate-100 animate-pulse rounded-xl" />}>
                        <SupportFilters />
                    </Suspense>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                <Link href="/admin/support">
                    <Button
                        variant={activeFilter === "open" ? "default" : "ghost"}
                        className={`rounded-xl font-bold text-xs px-5 h-10 ${activeFilter === "open" ? "bg-white text-amber-600 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                    >
                        Open
                        {openCount > 0 && (
                            <span className="ml-2 bg-amber-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                {openCount}
                            </span>
                        )}
                    </Button>
                </Link>
                <Link href="/admin/support?filter=in_progress">
                    <Button
                        variant={activeFilter === "in_progress" ? "default" : "ghost"}
                        className={`rounded-xl font-bold text-xs px-5 h-10 ${activeFilter === "in_progress" ? "bg-white text-blue-600 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                    >
                        In Progress
                        {progressCount > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                {progressCount}
                            </span>
                        )}
                    </Button>
                </Link>
                <Link href="/admin/support?filter=resolved">
                    <Button
                        variant={activeFilter === "resolved" ? "default" : "ghost"}
                        className={`rounded-xl font-bold text-xs px-5 h-10 ${activeFilter === "resolved" ? "bg-white text-emerald-600 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                    >
                        Resolved
                    </Button>
                </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{openCount}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Tickets</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-2xl font-black text-red-600">{urgentCount}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgent</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{progressCount}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{resolvedCount}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolved</p>
                </div>
            </div>

            {/* Ticket Count Label */}
            <div className="flex items-center justify-between py-1 px-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Showing {tickets.length} {activeFilter === "resolved" ? "Resolved" : activeFilter === "in_progress" ? "In Progress" : "Open"} Tickets
                </p>
                {activeFilter === "open" && urgentCount > 0 && (
                    <Badge className="bg-red-100 text-red-700 border-none font-bold uppercase text-[9px] animate-pulse">
                        {urgentCount} Urgent
                    </Badge>
                )}
            </div>

            {/* Ticket List */}
            {
                tickets.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                {activeFilter === "open" ? (
                                    <Inbox className="w-8 h-8 text-emerald-500" />
                                ) : (
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {activeFilter === "open" ? "All Clear!" : activeFilter === "in_progress" ? "Nothing in Progress" : "No Resolved Tickets"}
                            </h3>
                            <p className="text-slate-500 max-w-xs mt-2">
                                {activeFilter === "open"
                                    ? "There are no open support tickets. Great work!"
                                    : activeFilter === "in_progress"
                                        ? "No tickets are currently being worked on."
                                        : "No tickets have been resolved yet."
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {tickets.map((ticket: any) => {
                            const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM
                            const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN

                            return (
                                <Card key={ticket.id} className="overflow-hidden border-slate-200 hover:border-blue-400 transition-all group shadow-sm hover:shadow-md">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Priority stripe */}
                                        <div className={`w-full md:w-1.5 h-1.5 md:h-auto ${ticket.priority === "URGENT" ? "bg-red-500" : ticket.priority === "HIGH" ? "bg-amber-500" : ticket.priority === "MEDIUM" ? "bg-blue-500" : "bg-slate-300"}`} />

                                        <div className="flex-1 p-6">
                                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                <Badge className={`border-none font-bold uppercase tracking-widest text-[9px] px-3 h-6 ${priorityCfg.bg} ${priorityCfg.color}`}>
                                                    {priorityCfg.label}
                                                </Badge>
                                                <Badge className={`border-none font-bold uppercase tracking-widest text-[9px] px-3 h-6 ${statusCfg.bg} ${statusCfg.color}`}>
                                                    {ticket.status.replace("_", " ")}
                                                </Badge>
                                                <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px] px-3 h-6">
                                                    {ticket.category}
                                                </Badge>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-auto">
                                                    #{ticket.id.slice(0, 8)}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                {ticket.subject}
                                            </h3>
                                            <p className="text-slate-500 text-sm italic line-clamp-2 mb-6">
                                                "{ticket.description}"
                                            </p>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-5 border-t border-slate-100">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted By</p>
                                                    <div className="flex items-center gap-2">
                                                        {ticket.user?.avatarUrl ? (
                                                            <img src={ticket.user.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                                                                <User className="w-3 h-3 text-slate-400" />
                                                            </div>
                                                        )}
                                                        <p className="font-bold text-slate-900 text-sm">@{ticket.user?.username}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                                                    <p className="font-bold text-slate-900 text-sm">{ticket.subcategory || ticket.category}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profile</p>
                                                    <Badge variant="outline" className={`font-bold text-[9px] ${ticket.user?.activeProfile === "SELLER" ? "border-blue-200 text-blue-600" : "border-emerald-200 text-emerald-600"}`}>
                                                        {ticket.user?.activeProfile}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                                                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        {timeAgo(ticket.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:w-52 bg-slate-50/50 border-l border-slate-100 p-6 flex flex-col justify-center items-center gap-3">
                                            <Link href={`/admin/support/${ticket.id}`} className="w-full">
                                                <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold transition-all shadow-sm rounded-xl flex items-center gap-2">
                                                    Review
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                                                {ticket.priority === "URGENT" ? "⚡ Act Fast" : "Support Review"}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )
            }
        </div >
    )
}
