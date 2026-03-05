import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
    LayoutDashboard, Users, ShoppingBag, Briefcase, TrendingUp, Scale,
    Package, FileText, ArrowRight, Clock, Shield, Activity, Headset, Settings,
    Star, Megaphone, ScrollText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Price } from "@/components/Price"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AdminDashboardPage() {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const [
        userCount,
        serviceCount,
        productCount,
        projectCount,
        orderCount,
        disputeCount,
        jobCount,
        totalRevenue,
        recentOrders,
        recentUsers,
        openDisputes
    ] = await Promise.all([
        db.user.count(),
        db.service.count(),
        db.product.count(),
        db.project.count(),
        db.order.count(),
        db.dispute.count({ where: { status: "OPEN" } }),
        db.job.count(),
        db.order.aggregate({ _sum: { price: true } }),
        db.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                buyer: { select: { username: true, avatarUrl: true } },
                seller: { select: { username: true, avatarUrl: true } },
                service: { select: { title: true } },
                product: { select: { name: true } }
            }
        }),
        db.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true, role: true }
        }),
        db.dispute.findMany({
            take: 5,
            where: { status: "OPEN" },
            orderBy: { createdAt: 'desc' },
            include: {
                raisedBy: { select: { username: true } },
                order: { select: { price: true } }
            }
        })
    ])

    const stats = [
        { label: "Total Users", value: userCount, icon: Users, color: "indigo", href: "/admin/users" },
        { label: "Services", value: serviceCount, icon: ShoppingBag, color: "emerald", href: "/admin/moderation" },
        { label: "Products", value: productCount, icon: Package, color: "purple", href: "/admin/moderation" },
        { label: "Active Orders", value: orderCount, icon: FileText, color: "blue", href: "/admin/orders" },
        { label: "Projects", value: projectCount, icon: Briefcase, color: "amber", href: "/admin/reports" },
        { label: "Jobs Posted", value: jobCount, icon: Briefcase, color: "rose", href: "/admin/reports" },
        { label: "Open Disputes", value: disputeCount, icon: Scale, color: "red", href: "/admin/disputes" },
    ]

    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
        indigo: { bg: "bg-indigo-50/50", text: "text-indigo-600", icon: "text-indigo-500" },
        emerald: { bg: "bg-emerald-50/50", text: "text-emerald-600", icon: "text-emerald-500" },
        purple: { bg: "bg-purple-50/50", text: "text-purple-600", icon: "text-purple-500" },
        blue: { bg: "bg-blue-50/50", text: "text-blue-600", icon: "text-blue-500" },
        amber: { bg: "bg-amber-50/50", text: "text-amber-600", icon: "text-amber-500" },
        rose: { bg: "bg-rose-50/50", text: "text-rose-600", icon: "text-rose-500" },
        red: { bg: "bg-red-50/50", text: "text-red-600", icon: "text-red-500" },
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <LayoutDashboard className="w-6 h-6 text-blue-600" />
                    Admin Dashboard
                </h1>
                <p className="text-slate-500 text-sm mt-1">Overview of platform activity and key metrics</p>
            </div>

            {/* STATS GRID */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {stats.map((stat) => {
                    const colors = colorMap[stat.color]
                    const Icon = stat.icon
                    return (
                        <Link key={stat.label} href={stat.href}>
                            <Card className={`border-none shadow-sm ${colors.bg} hover:shadow-md transition-shadow cursor-pointer`}>
                                <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                    <CardTitle className={`text-[10px] font-black ${colors.text} uppercase tracking-widest`}>
                                        {stat.label}
                                    </CardTitle>
                                    <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {/* REVENUE BANNER */}
            <Card className="border-none shadow-sm bg-slate-900 text-white">
                <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Platform GMV</p>
                            <div className="text-3xl font-black"><Price amount={totalRevenue._sum.price || 0} /></div>
                        </div>
                    </div>
                    <Link href="/admin/reports">
                        <div className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">
                            View Reports <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>
                </CardContent>
            </Card>

            {/* THREE COLUMNS: RECENT ACTIVITY */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Orders */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-sm font-black text-slate-900">Recent Orders</CardTitle>
                        <Link href="/admin/orders" className="text-xs text-blue-600 font-bold hover:underline">View all</Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentOrders.length === 0 ? (
                            <p className="text-sm text-slate-400 italic py-4 text-center">No orders yet</p>
                        ) : recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                                        {order.service?.title || order.product?.name || "Order"}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        @{order.buyer.username} → @{order.seller.username}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-xs font-bold text-slate-900"><Price amount={order.price} /></span>
                                    <Badge className={`text-[8px] h-4 border-none font-bold uppercase ${order.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                                        order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                            "bg-amber-100 text-amber-700"
                                        }`}>{order.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* New Users */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-sm font-black text-slate-900">Newest Users</CardTitle>
                        <Link href="/admin/users" className="text-xs text-blue-600 font-bold hover:underline">View all</Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentUsers.map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                        {u.avatarUrl ? (
                                            <img src={u.avatarUrl} alt={u.username} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-indigo-600">{u.username.slice(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-900">@{u.username}</span>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{u.email}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                    {u.role === "ADMIN" && <Badge className="bg-slate-900 text-white text-[8px] h-4 border-none">ADMIN</Badge>}
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Open Disputes */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-sm font-black text-slate-900">Open Disputes</CardTitle>
                        <Link href="/admin/disputes" className="text-xs text-blue-600 font-bold hover:underline">View all</Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {openDisputes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                                    <Scale className="w-5 h-5 text-emerald-500" />
                                </div>
                                <p className="text-sm text-slate-400 font-medium">All clear! No open disputes.</p>
                            </div>
                        ) : openDisputes.map((dispute) => (
                            <Link key={dispute.id} href={`/admin/disputes/${dispute.id}`}>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100 hover:border-red-300 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                                            {dispute.reason.slice(0, 40)}{dispute.reason.length > 40 ? "..." : ""}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            by @{dispute.raisedBy.username}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        {dispute.order && <span className="text-xs font-bold text-red-600"><Price amount={dispute.order.price} /></span>}
                                        <Badge className="bg-red-100 text-red-700 text-[8px] h-4 border-none font-bold uppercase">Open</Badge>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* QUICK ACTIONS */}
            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                        { label: "User Management", href: "/admin/users", icon: Users },
                        { label: "Orders", href: "/admin/orders", icon: FileText },
                        { label: "Moderation", href: "/admin/moderation", icon: Shield },
                        { label: "User Reports", href: "/admin/moderation/reports", icon: Shield },
                        { label: "Analytics", href: "/admin/reports", icon: Activity },
                        { label: "Disputes", href: "/admin/disputes", icon: Scale },
                        { label: "Support Tickets", href: "/admin/support", icon: Headset },
                        { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
                        { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
                        { label: "Settings", href: "/admin/settings", icon: Settings },
                    ].map((action) => {
                        const Icon = action.icon
                        return (
                            <Link key={action.label} href={action.href} className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group">
                                <Icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 mb-1.5 transition-colors" />
                                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{action.label}</span>
                            </Link>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
