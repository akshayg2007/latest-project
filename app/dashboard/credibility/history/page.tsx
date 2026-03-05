import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    History,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    Star,
    Shield,
    AlertTriangle,
    CheckCircle2
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function CredibilityHistoryPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch credibility score
    const credibility = await db.credibilityScore.findUnique({
        where: { userId },
        include: { badges: true }
    })

    // Fetch recent orders with reviews to build history
    const recentOrders = await db.order.findMany({
        where: {
            OR: [{ sellerId: userId }, { buyerId: userId }]
        },
        include: {
            review: true,
            service: true,
            buyer: true,
            seller: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    })

    // Build history from orders and reviews
    const historyData = recentOrders.map((order: any) => {
        const isSeller = order.sellerId === userId

        if (order.status === 'COMPLETED' && order.review) {
            if (!isSeller) return null // Only track seller credibility for reviews for now
            return {
                id: order.id,
                type: order.review.rating >= 4 ? 'increase' : order.review.rating >= 3 ? 'neutral' : 'decrease',
                title: order.review.rating >= 4 ? 'Positive Review' : order.review.rating === 3 ? 'Neutral Review' : 'Negative Review',
                description: `${order.review.rating}-star rating for "${order.service?.title || "Service"}"`,
                change: order.review.rating >= 5 ? '+2' : order.review.rating >= 4 ? '+1' : order.review.rating >= 3 ? '0' : '-15',
                date: order.review.createdAt,
                category: 'rating'
            }
        } else if (order.status === 'COMPLETED') {
            if (!isSeller) return {
                id: order.id,
                type: 'neutral',
                title: 'Order Purchased',
                description: `Purchased "${order.service?.title || "Service"}"`,
                change: '0',
                date: order.createdAt,
                category: 'purchase'
            }
            return {
                id: order.id,
                type: 'increase',
                title: 'Order Completed',
                description: `Delivered order for "${order.service?.title || "Service"}"`,
                change: '+5',
                date: order.createdAt,
                category: 'delivery'
            }
        } else if (order.status === 'CANCELLED') {
            if (!isSeller) return {
                id: order.id,
                type: 'neutral',
                title: 'Order Cancelled',
                description: `Purchase of "${order.service?.title || "Service"}" cancelled`,
                change: '0',
                date: order.createdAt,
                category: 'cancellation'
            }
            return {
                id: order.id,
                type: 'warning',
                title: 'Order Cancelled',
                description: `Order for "${order.service?.title || "Service"}" was cancelled`,
                change: '-10',
                date: order.createdAt,
                category: 'cancellation'
            }
        }
        return null
    }).filter(Boolean) as Array<{
        id: string
        type: string
        title: string
        description: string
        change: string
        date: Date
        category: string
    }>

    // Add badges earned
    const badgeHistory = (credibility?.badges || []).map(badge => ({
        id: badge.id,
        type: 'achievement',
        title: 'Achievement Unlocked',
        description: `${badge.name} badge earned`,
        change: '+5',
        date: badge.earnedAt,
        category: 'achievement'
    }))

    const allHistory = [...historyData, ...badgeHistory]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 15)

    const totalGained = allHistory
        .filter(h => parseInt(h.change) > 0)
        .reduce((sum, h) => sum + parseInt(h.change), 0)

    const totalLost = allHistory
        .filter(h => parseInt(h.change) < 0)
        .reduce((sum, h) => sum + Math.abs(parseInt(h.change)), 0)

    const expectedScore = 50 + totalGained - totalLost

    // Self-healing: Sync DB score with calculated history if different
    // This fixes discrepancies from past actions where DB wasn't updated
    if ((credibility?.score ?? 50) !== expectedScore) {
        if (credibility) {
            await db.credibilityScore.update({
                where: { id: credibility.id },
                data: { score: expectedScore }
            })
        } else {
            await db.credibilityScore.create({
                data: { userId, score: expectedScore }
            })
        }
    }

    const currentScore = expectedScore

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Credibility History</h1>
                <p className="text-muted-foreground mt-1">
                    Track changes to your credibility score over time
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Current Score</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{currentScore}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Points Gained</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">+{totalGained}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Points Lost</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-red-600">-{totalLost}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Total Events</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{allHistory.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* History List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Changes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {allHistory.length > 0 ? (
                        allHistory.map((item) => (
                            <HistoryItem key={item.id} item={item} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No credibility history yet</p>
                            <p className="text-sm mt-1">Complete orders to build your credibility</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted/50">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium">How Credibility Score Works</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your credibility score is calculated based on your response rate, delivery time,
                                order completion rate, and client satisfaction. Keep these metrics high to maintain
                                your score and unlock more opportunities.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function HistoryItem({ item }: {
    item: {
        id: string
        type: string
        title: string
        description: string
        change: string
        date: Date
        category: string
    }
}) {
    const typeConfig: Record<string, { icon: React.ElementType; color: string; changeColor: string }> = {
        increase: { icon: TrendingUp, color: "text-green-600 bg-green-50", changeColor: "text-green-600" },
        decrease: { icon: TrendingDown, color: "text-red-600 bg-red-50", changeColor: "text-red-600" },
        warning: { icon: AlertTriangle, color: "text-amber-600 bg-amber-50", changeColor: "text-amber-600" },
        neutral: { icon: Minus, color: "text-muted-foreground bg-muted", changeColor: "text-muted-foreground" },
        achievement: { icon: Star, color: "text-yellow-600 bg-yellow-50", changeColor: "text-yellow-600" },
    }

    const config = typeConfig[item.type] || typeConfig.neutral
    const Icon = config.icon

    return (
        <div className="flex items-start gap-4 py-4 border-b border-border last:border-0">
            <div className={`p-2.5 rounded-full ${config.color}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <span className={`font-semibold ${config.changeColor}`}>
                        {item.change !== "0" && (parseInt(item.change) > 0 ? "+" : "")}{item.change} pts
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{format(item.date, 'MMM dd, yyyy')}</span>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                </div>
            </div>
        </div>
    )
}
