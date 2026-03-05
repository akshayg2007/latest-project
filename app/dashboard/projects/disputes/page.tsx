import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertTriangle,
    Clock,
    User,
    MessageSquare,
    FileText,
    ArrowUpRight,
    Shield
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function DisputesPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch disputes where user is involved (either raised it, or is part of the project/order)
    const disputes = await db.dispute.findMany({
        where: {
            OR: [
                { raisedById: userId },
                { project: { clientId: userId } },
                { project: { freelancerId: userId } },
                { order: { buyerId: userId } },
                { order: { sellerId: userId } }
            ]
        },
        include: {
            project: {
                include: {
                    client: true,
                    freelancer: true
                }
            },
            order: {
                include: {
                    buyer: true,
                    seller: true,
                    service: true,
                    product: true
                }
            },
            raisedBy: true
        },
        orderBy: { updatedAt: 'desc' }
    })

    const transformedDisputes = disputes.map((d: any) => {
        let otherParty = d.raisedBy
        if (d.raisedById === userId) {
            if (d.project) {
                otherParty = d.project.clientId === userId ? d.project.freelancer : d.project.client
            } else if (d.order) {
                otherParty = d.order.buyerId === userId ? d.order.seller : d.order.buyer
            }
        }

        return {
            id: d.id,
            title: d.reason.length > 50 ? d.reason.substring(0, 50) + '...' : d.reason,
            targetName: d.project?.title || d.order?.service?.title || d.order?.product?.name || "Project/Service",
            otherParty,
            status: d.status,
            openedDate: d.createdAt,
            lastUpdate: d.updatedAt,
            description: d.reason,
            isRaisedByMe: d.raisedById === userId
        }
    })

    const ongoingDisputes = transformedDisputes.filter((d: any) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')
    const pastDisputes = transformedDisputes.filter((d: any) => d.status === 'RESOLVED' || d.status === 'CLOSED')

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Disputes</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Track and resolve issues with your projects and orders
                </p>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-100 shadow-sm overflow-hidden">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-blue-900">Platform Mediation</p>
                            <p className="text-sm text-blue-700/80 mt-1 leading-relaxed">
                                Our support team mediates all disputes to ensure a fair outcome for both parties. Provide clear evidence in the mediation chat to help us resolve your case faster.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ONGOING DISPUTES */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Ongoing Disputes
                    </h2>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none font-bold">
                        {ongoingDisputes.length} Active
                    </Badge>
                </div>

                {ongoingDisputes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {ongoingDisputes.map((dispute: any) => (
                            <DisputeCard key={dispute.id} dispute={dispute} />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed bg-transparent">
                        <CardContent className="py-10 text-center">
                            <p className="text-sm text-slate-400 font-medium">No ongoing disputes. Everything is running smoothly!</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* PAST DISPUTES */}
            {pastDisputes.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Past Resolutions
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 opacity-80 filter grayscale-[0.5] hover:grayscale-0 transition-all">
                        {pastDisputes.map((dispute: any) => (
                            <DisputeCard key={dispute.id} dispute={dispute} />
                        ))}
                    </div>
                </div>
            )}

            {transformedDisputes.length === 0 && (
                <Card className="border-dashed bg-slate-50/50">
                    <CardContent className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                            <Shield className="h-8 w-8 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Clean Slate</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                You haven't been part of any disputes yet. Keep up the great work!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function DisputeCard({ dispute }: { dispute: any }) {
    const statusConfig: Record<string, { label: string; color: string }> = {
        OPEN: { label: "Raised", color: "bg-blue-100 text-blue-700" },
        UNDER_REVIEW: { label: "Under Review", color: "bg-amber-100 text-amber-700" },
        RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700" },
        CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-700" },
    }

    const status = statusConfig[dispute.status] || statusConfig.OPEN

    return (
        <Link href={`/dashboard/projects/disputes/${dispute.id}`}>
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-sm bg-white overflow-hidden group">
                <CardContent className="p-0">
                    <div className={`h-1 w-full ${status.color.split(' ')[0]}`} />
                    <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                                        Case #{dispute.id.slice(0, 8)}
                                    </h3>
                                    <Badge className={`${status.color} border-none font-bold text-[10px] h-5`}>
                                        {status.label}
                                    </Badge>
                                </div>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> {dispute.targetName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Other Party</p>
                                <p className="text-xs font-bold text-slate-700 lowercase italic">@{dispute.otherParty?.username || "platform"}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[60px]">
                            <p className="text-sm text-slate-600 italic line-clamp-2">"{dispute.description}"</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[10px]">
                            <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDistanceToNow(dispute.lastUpdate, { addSuffix: true })}
                                </span>
                                {dispute.isRaisedByMe && (
                                    <Badge variant="outline" className="text-[8px] h-4 border-slate-200 text-slate-400 px-1.5 uppercase font-black tracking-tighter">
                                        You Raised
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-blue-600 font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                View Case <ArrowUpRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
