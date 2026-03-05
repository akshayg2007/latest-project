import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Headset,
    Plus,
    MessageSquare,
    Clock,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { getUserTickets } from "@/app/actions/support"

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
    URGENT: { color: "text-red-700", bg: "bg-red-100", border: "border-red-200", label: "URGENT" },
    HIGH: { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", label: "HIGH" },
    MEDIUM: { color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200", label: "MEDIUM" },
    LOW: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "LOW" },
}

export default async function SupportPage() {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const tickets = await getUserTickets()

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-black text-slate-900">Support Tickets</h1>
                        <p className="text-slate-500 text-sm">
                            Manage and track your support requests
                        </p>
                    </div>
                    <Link href="/dashboard/support/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Ticket
                        </Button>
                    </Link>
                </div>

                {/* Tickets List */}
                {tickets.length === 0 ? (
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Headset className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Support Tickets</h3>
                            <p className="text-slate-600 mb-6">
                                You haven't created any support tickets yet. Click the button above to create your first ticket.
                            </p>
                            <Link href="/dashboard/support/new">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Your First Ticket
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {tickets.map((ticket) => {
                            const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM
                            const isOpen = ticket.status === "OPEN"
                            const isInProgress = ticket.status === "IN_PROGRESS"
                            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"

                            return (
                                <Card key={ticket.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-lg font-semibold text-slate-900 truncate">
                                                    Ticket #{ticket.id.slice(0, 8)}
                                                </h3>
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
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Link href={`/dashboard/support/${ticket.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="hover:bg-blue-50"
                                                >
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{ticket.subject}</h4>
                                                <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Category</span>
                                                <span className="font-medium text-slate-700">{ticket.category}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
