import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    Calendar,
    TrendingUp,
    Wallet,
    CreditCard,
    Building,
    Filter,
    Receipt
} from "lucide-react"
import { StatPrice } from "@/components/DashboardPrice"

export const dynamic = 'force-dynamic'

export default async function PaymentFeedPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch orders (incoming payments = ordersSold, outgoing = ordersBought)
    const ordersSold = await db.order.findMany({
        where: { sellerId: userId },
        include: {
            buyer: true,
            service: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    })

    const ordersBought = await db.order.findMany({
        where: { buyerId: userId },
        include: {
            seller: true,
            service: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    })

    // Build transactions list
    const transactions = [
        ...ordersSold.map((order: any) => ({
            id: order.id,
            type: 'incoming' as const,
            title: order.status === 'COMPLETED' ? 'Payment Received' : 'Payment Pending',
            description: order.service?.title || "Service",
            amount: order.price,
            status: order.status.toLowerCase(),
            date: order.createdAt,
            from: order.buyer.username,
            to: undefined
        })),
        ...ordersBought.map((order: any) => ({
            id: order.id,
            type: 'outgoing' as const,
            title: 'Payment Sent',
            description: order.service?.title || "Service",
            amount: order.price,
            status: order.status.toLowerCase(),
            date: order.createdAt,
            from: undefined,
            to: order.seller.username
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15)

    // Calculate totals
    const completedIncoming = ordersSold.filter((o: any) => o.status === 'COMPLETED').reduce((sum: number, o: any) => sum + o.price, 0)
    const pendingAmount = ordersSold.filter((o: any) => o.status === 'PENDING').reduce((sum: number, o: any) => sum + o.price, 0)

    // This month's earnings
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const thisMonthEarnings = ordersSold
        .filter((o: any) => o.status === 'COMPLETED' && o.createdAt >= thisMonth)
        .reduce((sum: number, o: any) => sum + o.price, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Payment Feed</h1>
                    <p className="text-muted-foreground mt-1">
                        Track all your payments and transactions
                    </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Wallet className="h-4 w-4 mr-2" />
                    Withdraw Funds
                </Button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card className="col-span-2 sm:col-span-1 bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                            <p className="text-xs sm:text-sm opacity-80">Available Balance</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold mt-2">
                            <StatPrice amount={completedIncoming} />
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-amber-600">
                            <StatPrice amount={pendingAmount} />
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">
                            +<StatPrice amount={thisMonthEarnings} />
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Total Earned</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold mt-1">
                            <StatPrice amount={completedIncoming} />
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4 flex items-center gap-4">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-blue-50">
                            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-sm sm:text-base">Bank Account</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">Connect account</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4 flex items-center gap-4">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-purple-50">
                            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-medium text-sm sm:text-base">Payment Methods</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">Manage methods</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4 flex items-center gap-4">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-green-50">
                            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-sm sm:text-base">Invoices</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">View all invoices</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Transactions</CardTitle>
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </CardHeader>
                <CardContent>
                    {transactions.length > 0 ? (
                        transactions.map((transaction: any) => (
                            <TransactionItem key={transaction.id} transaction={transaction} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No transactions yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function TransactionItem({ transaction }: {
    transaction: {
        id: string
        type: 'incoming' | 'outgoing'
        title: string
        description: string
        amount: number
        status: string
        date: Date
        from?: string
        to?: string
    }
}) {
    const isIncoming = transaction.type === "incoming"

    return (
        <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
            <div className={`p-2.5 rounded-full ${isIncoming ? "bg-green-50" : "bg-red-50"}`}>
                {isIncoming ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                )}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{transaction.title}</p>
                    {transaction.status === "pending" && (
                        <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{format(transaction.date, 'MMM dd, yyyy')}</span>
                    <span className="text-xs text-muted-foreground">
                        • {isIncoming ? `From: ${transaction.from}` : `To: ${transaction.to}`}
                    </span>
                </div>
            </div>
            <p className={`text-lg font-semibold ${isIncoming ? "text-green-600" : "text-red-600"}`}>
                {isIncoming ? "+" : "-"}<StatPrice amount={transaction.amount} />
            </p>
        </div>
    )
}
