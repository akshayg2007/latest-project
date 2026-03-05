import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FileText, Clock, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/Price"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

export default async function AdminOrdersPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const { status } = await searchParams
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") redirect("/dashboard")

    const statusFilter = status && status !== "all" ? { status: status.toUpperCase() } : {}

    const orders = await db.order.findMany({
        where: statusFilter,
        orderBy: { createdAt: 'desc' },
        include: {
            buyer: { select: { username: true, avatarUrl: true } },
            seller: { select: { username: true, avatarUrl: true } },
            service: { select: { title: true } },
            product: { select: { name: true } },
            project: { select: { title: true } }
        },
        take: 50
    })

    const [totalOrders, pendingOrders, completedOrders, cancelledOrders] = await Promise.all([
        db.order.count(),
        db.order.count({ where: { status: "PENDING" } }),
        db.order.count({ where: { status: "COMPLETED" } }),
        db.order.count({ where: { status: "CANCELLED" } })
    ])

    const tabs = [
        { label: "All", value: "all", count: totalOrders },
        { label: "Pending", value: "pending", count: pendingOrders },
        { label: "Completed", value: "completed", count: completedOrders },
        { label: "Cancelled", value: "cancelled", count: cancelledOrders },
    ]

    const activeTab = status || "all"

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Order Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Track and manage all platform transactions</p>
                </div>
                <div className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">
                    {orders.length} Orders Shown
                </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner w-fit">
                {tabs.map((tab) => (
                    <Link key={tab.value} href={`/admin/orders${tab.value === "all" ? "" : `?status=${tab.value}`}`}>
                        <Button
                            variant={activeTab === tab.value ? "default" : "ghost"}
                            className={`rounded-xl font-bold text-xs px-4 h-9 ${activeTab === tab.value
                                ? "bg-white text-blue-600 shadow-sm hover:bg-white"
                                : "text-slate-500 hover:text-slate-700 hover:bg-transparent"
                                }`}
                        >
                            {tab.label} <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
                        </Button>
                    </Link>
                ))}
            </div>

            {/* ORDERS TABLE */}
            <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-0">
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                <FileText className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-bold">No orders found</p>
                            <p className="text-sm text-slate-400 mt-1">No orders match the current filter.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-900">Order</TableHead>
                                    <TableHead className="font-bold text-slate-900">Buyer</TableHead>
                                    <TableHead className="font-bold text-slate-900">Seller</TableHead>
                                    <TableHead className="font-bold text-slate-900">Amount</TableHead>
                                    <TableHead className="font-bold text-slate-900">Status</TableHead>
                                    <TableHead className="font-bold text-slate-900">Date</TableHead>
                                    <TableHead className="font-bold text-slate-900 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const itemName = order.service?.title || order.product?.name || order.project?.title || "Direct Order"
                                    const isProduct = !!order.productId
                                    const isJob = !!order.project
                                    const orderPath = isProduct ? `/product-order/${order.id}` : isJob ? `/job-order/${order.id}` : `/service-order/${order.id}`
                                    return (
                                        <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{itemName}</span>
                                                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">#{order.id.slice(0, 8)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-600">@{order.buyer.username}</TableCell>
                                            <TableCell className="text-sm font-medium text-slate-600">@{order.seller.username}</TableCell>
                                            <TableCell className="font-bold text-slate-900"><Price amount={order.price} /></TableCell>
                                            <TableCell>
                                                <Badge className={`border-none font-bold text-[9px] uppercase tracking-wider ${order.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                                                    order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                        order.status === "DELIVERED" ? "bg-blue-100 text-blue-700" :
                                                            "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={orderPath}>
                                                    <Button variant="outline" size="sm" className="text-xs font-bold border-slate-200 h-8 rounded-lg">
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
