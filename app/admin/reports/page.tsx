import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
    TrendingUp, Users, ShoppingBag, Package, FileText, Briefcase,
    Scale, DollarSign, BarChart3, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Price } from "@/components/Price"
import { Badge } from "@/components/ui/badge"

export default async function AdminReportsPage() {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") redirect("/dashboard")

    // Aggregate all platform data
    const [
        totalUsers,
        totalServices,
        totalProducts,
        totalOrders,
        totalJobs,
        totalProjects,
        totalDisputes,
        resolvedDisputes,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        revenue,
        topSellers
    ] = await Promise.all([
        db.user.count(),
        db.service.count(),
        db.product.count(),
        db.order.count(),
        db.job.count(),
        db.project.count(),
        db.dispute.count(),
        db.dispute.count({ where: { status: "RESOLVED" } }),
        db.order.count({ where: { status: "PENDING" } }),
        db.order.count({ where: { status: "COMPLETED" } }),
        db.order.count({ where: { status: "CANCELLED" } }),
        db.order.aggregate({ _sum: { price: true }, _avg: { price: true } }),
        db.user.findMany({
            where: {
                ordersSold: { some: {} }
            },
            select: {
                username: true,
                avatarUrl: true,
                _count: { select: { ordersSold: true, services: true, products: true } }
            },
            orderBy: {
                ordersSold: { _count: 'desc' }
            },
            take: 10
        })
    ])

    const avgOrderValue = revenue._avg.price || 0
    const totalGMV = revenue._sum.price || 0
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    const disputeRate = totalOrders > 0 ? ((totalDisputes / totalOrders) * 100).toFixed(1) : "0"

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Platform Reports & Analytics
                </h1>
                <p className="text-slate-500 text-sm mt-1">Comprehensive overview of platform performance</p>
            </div>

            {/* REVENUE SECTION */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-sm bg-slate-900 text-white md:col-span-2">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue (GMV)</p>
                        </div>
                        <div className="text-4xl font-black"><Price amount={totalGMV} /></div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Avg Order Value</p>
                        <div className="text-3xl font-black text-slate-900"><Price amount={Math.round(avgOrderValue)} /></div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Completion Rate</p>
                        <div className="text-3xl font-black text-slate-900">{completionRate}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* PLATFORM STATS */}
            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Platform Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {[
                            { label: "Users", value: totalUsers, icon: Users, color: "indigo" },
                            { label: "Services", value: totalServices, icon: ShoppingBag, color: "emerald" },
                            { label: "Products", value: totalProducts, icon: Package, color: "purple" },
                            { label: "Orders", value: totalOrders, icon: FileText, color: "blue" },
                            { label: "Jobs", value: totalJobs, icon: Briefcase, color: "amber" },
                            { label: "Projects", value: totalProjects, icon: Briefcase, color: "teal" },
                            { label: "Disputes", value: totalDisputes, icon: Scale, color: "red" },
                        ].map((stat) => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <Icon className="w-5 h-5 text-slate-400 mb-2" />
                                    <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ORDER BREAKDOWN + DISPUTES */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-slate-900">Order Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: "Pending", count: pendingOrders, color: "bg-amber-500" },
                            { label: "Completed", count: completedOrders, color: "bg-emerald-500" },
                            { label: "Cancelled", count: cancelledOrders, color: "bg-red-500" },
                        ].map((item) => {
                            const percentage = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
                            return (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-700">{item.label}</span>
                                        <span className="text-slate-500 font-medium">{item.count} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-slate-900">Dispute Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50 text-center">
                                <p className="text-2xl font-black text-slate-900">{totalDisputes}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Disputes</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 text-center">
                                <p className="text-2xl font-black text-slate-900">{resolvedDisputes}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resolved</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 text-center">
                                <p className="text-2xl font-black text-slate-900">{totalDisputes - resolvedDisputes}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 text-center">
                                <p className="text-2xl font-black text-slate-900">{disputeRate}%</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dispute Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TOP SELLERS */}
            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Top Sellers by Orders
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {topSellers.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-6 text-center">No sellers with completed orders yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {topSellers.map((seller, i) => (
                                <div key={seller.username} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-black text-xs text-emerald-600">
                                            {i + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {seller.avatarUrl ? (
                                                <img src={seller.avatarUrl} alt={seller.username} className="w-7 h-7 rounded-full object-cover" />
                                            ) : null}
                                            <span className="font-bold text-sm text-slate-900">@{seller.username}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="text-[9px] font-bold border-slate-200">
                                            {seller._count.ordersSold} orders
                                        </Badge>
                                        <Badge variant="outline" className="text-[9px] font-bold border-emerald-200 text-emerald-600">
                                            {seller._count.services} services
                                        </Badge>
                                        <Badge variant="outline" className="text-[9px] font-bold border-purple-200 text-purple-600">
                                            {seller._count.products} products
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
