import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Shield, AlertTriangle, Scale, Clock, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Price } from "@/components/Price"

export default async function AdminDisputesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
    const { filter } = await searchParams
    const session = await auth()

    // Safety check: Ensure user is actually an admin
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const isPast = filter === "past"

    const disputes = await db.dispute.findMany({
        where: { status: isPast ? { in: ["RESOLVED", "CLOSED"] } : "OPEN" },
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
            raisedBy: true
        },
        orderBy: { updatedAt: 'desc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Scale className="w-6 h-6 text-blue-600" />
                        Dispute Resolution Center
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Review and resolve conflicts between buyers and sellers.</p>
                </div>

                <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <Link href="/admin/disputes">
                        <Button
                            variant={!isPast ? "default" : "ghost"}
                            className={`rounded-xl font-bold text-xs px-6 h-10 ${!isPast ? "bg-white text-blue-600 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                        >
                            Active Cases
                        </Button>
                    </Link>
                    <Link href="/admin/disputes?filter=past">
                        <Button
                            variant={isPast ? "default" : "ghost"}
                            className={`rounded-xl font-bold text-xs px-6 h-10 ${isPast ? "bg-white text-blue-600 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                        >
                            Past Disputes
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center justify-between py-1 px-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Showing {disputes.length} {isPast ? "Resolved" : "Open"} Conflicts
                </p>
                {isPast ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold uppercase text-[9px]">Historical Record</Badge>
                ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-none font-bold uppercase text-[9px]">Needs Attention</Badge>
                )}
            </div>

            {disputes.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">All Clear!</h3>
                        <p className="text-slate-500 max-w-xs mt-2">There are currently no {isPast ? "past" : "open"} disputes found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {disputes.map((dispute: any) => (
                        <Card key={dispute.id} className="overflow-hidden border-slate-200 hover:border-blue-400 transition-all group shadow-sm hover:shadow-md">
                            <div className="flex flex-col md:flex-row">
                                <div className="flex-1 p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Badge className={`border-none font-bold uppercase tracking-widest text-[9px] px-3 h-6 ${dispute.status === 'RESOLVED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {dispute.status.replace("_", " ")}
                                        </Badge>
                                        {(() => {
                                            const isProject = !!dispute.projectId
                                            const isProduct = !!dispute.order?.productId
                                            const isService = !!dispute.order?.serviceId
                                            const itemType = isProject ? "Job" : isProduct ? "Product" : isService ? "Service" : "Order"

                                            return (
                                                <Badge className={`border-none font-bold uppercase tracking-widest text-[9px] px-3 h-6 ${itemType === "Product" ? "bg-purple-100 text-purple-700" :
                                                    itemType === "Service" ? "bg-blue-100 text-blue-700" :
                                                        "bg-emerald-100 text-emerald-700"
                                                    }`}>
                                                    {itemType}
                                                </Badge>
                                            )
                                        })()}
                                        {dispute.decision && (
                                            <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px] px-3 h-6">
                                                {dispute.decision === 'REFUND_BUYER' ? "Buyer Refunded" : "Seller Paid"}
                                            </Badge>
                                        )}
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-auto">Case #{dispute.id.slice(0, 8)}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                        {dispute.order?.service?.title || dispute.order?.product?.name || "Order Dispute"}
                                    </h3>

                                    <p className="text-slate-600 text-sm italic line-clamp-2 mb-6">
                                        "{dispute.reason}"
                                    </p>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Buyer</p>
                                            <p className="font-bold text-slate-900 text-sm">@{dispute.order?.buyer?.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seller</p>
                                            <p className="font-bold text-slate-900 text-sm">@{dispute.order?.seller?.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Value</p>
                                            <div className="font-bold text-blue-600 text-sm"><Price amount={dispute.order?.price || 0} /></div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isPast ? "Resolved" : "Opened"} At</p>
                                            <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {new Date(isPast ? dispute.updatedAt : dispute.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-64 bg-slate-50/50 border-l border-slate-100 p-6 flex flex-col justify-center items-center gap-3">
                                    <Link href={`/admin/disputes/${dispute.id}`} className="w-full">
                                        <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold transition-all shadow-sm rounded-xl">
                                            {isPast ? "View Record" : "Review Case"}
                                        </Button>
                                    </Link>

                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
