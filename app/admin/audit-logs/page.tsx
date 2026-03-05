import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ScrollText, Clock, User, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

export default async function AdminAuditLogsPage() {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") redirect("/dashboard")

    const logs = await db.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    })

    const getActionColor = (action: string) => {
        if (action.includes("Banned") || action.includes("Removed") || action.includes("Demoted")) return "bg-red-100 text-red-700"
        if (action.includes("Promoted") || action.includes("Restored") || action.includes("Unbanned") || action.includes("Unsuspended")) return "bg-emerald-100 text-emerald-700"
        if (action.includes("Resolved") || action.includes("Suspended")) return "bg-amber-100 text-amber-700"
        if (action.includes("Shadow")) return "bg-slate-100 text-slate-700"
        return "bg-blue-100 text-blue-700"
    }

    const getTargetBadge = (targetType: string | null) => {
        if (!targetType) return null
        const colors: Record<string, string> = {
            User: "bg-indigo-100 text-indigo-700",
            Dispute: "bg-amber-100 text-amber-700",
            service: "bg-blue-100 text-blue-700",
            product: "bg-purple-100 text-purple-700",
            job: "bg-emerald-100 text-emerald-700",
            Review: "bg-rose-100 text-rose-700",
            Notification: "bg-cyan-100 text-cyan-700",
        }
        return colors[targetType] || "bg-slate-100 text-slate-700"
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <ScrollText className="w-6 h-6 text-blue-600" />
                        Audit Logs
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Chronological record of all admin actions on the platform</p>
                </div>
                <div className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">
                    {logs.length} Entries
                </div>
            </div>

            {logs.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                            <ScrollText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No logs yet</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Admin actions will appear here as they occur.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                                    {/* Timeline dot */}
                                    <div className="mt-1 shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-slate-500" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-900">@{log.adminName}</span>
                                            <Badge className={`border-none font-bold text-[9px] uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </Badge>
                                            {log.targetType && (
                                                <Badge className={`border-none font-bold text-[9px] uppercase tracking-wider ${getTargetBadge(log.targetType)}`}>
                                                    {log.targetType}
                                                </Badge>
                                            )}
                                        </div>

                                        {log.details && (
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{log.details}</p>
                                        )}

                                        {log.targetId && (
                                            <p className="text-[10px] text-slate-400 font-mono mt-1">Target: {log.targetId.slice(0, 16)}...</p>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="shrink-0 text-right">
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(log.createdAt))} ago
                                        </p>
                                        <p className="text-[9px] text-slate-300 mt-0.5">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
