import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { calculateAndUpdateResponseRate } from "@/app/actions/updateResponseRate"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Shield,
    Star,
    CheckCircle2,
    TrendingUp,
    Award,
    Target,
    Zap,
    AlertCircle
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function CredibilityStatusPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch credibility score
    const credibility = await db.credibilityScore.findUnique({
        where: { userId },
        include: { badges: true }
    })

    // Fetch orders for calculating metrics
    const orders = await db.order.findMany({
        where: {
            OR: [{ sellerId: userId }, { buyerId: userId }]
        },
        include: { review: true }
    })

    const completedOrders = orders.filter(o => o.status === 'COMPLETED')
    // Filter orders where user is seller for scoring metrics
    const sellerOrders = orders.filter(o => o.sellerId === userId)
    const sellerCompletedOrders = sellerOrders.filter(o => o.status === 'COMPLETED')
    const totalSellerOrders = sellerOrders.length

    // Calculate metrics - only show if there's actual data
    // Calculate real response rate
    const calculatedResponseRate = await calculateAndUpdateResponseRate(userId)
    const responseRate = credibility?.responseRate ?? calculatedResponseRate
    const onTimeDelivery = credibility?.onTimeDelivery ?? null
    const completionRate = credibility?.completionRate ?? (totalSellerOrders > 0 ? Math.round((sellerCompletedOrders.length / totalSellerOrders) * 100) : null)

    // Calculate average rating from reviews (only for orders where user is seller)
    const reviewsReceived = sellerCompletedOrders.filter(o => o.review).map(o => o.review!.rating)
    const avgRating = reviewsReceived.length > 0
        ? reviewsReceived.reduce((a, b) => a + b, 0) / reviewsReceived.length
        : null

    // Calculate score dynamically if not in DB
    let calculatedScore = null
    if (responseRate !== null && onTimeDelivery !== null && completionRate !== null && avgRating !== null) {
        // Calculate Score with Penalties and Bonuses
        const baseScore = Math.round(
            ((responseRate * 0.2) +
                (onTimeDelivery * 0.2) +
                (completionRate * 0.2) +
                ((avgRating * 20) * 0.4))
        )

        // Deductions
        const cancelledOrdersCount = orders.filter(o => o.status === 'CANCELLED' && o.sellerId === userId).length
        const penalty = cancelledOrdersCount * 5 // -5 per cancellation

        // Bonuses
        const completedOrdersAsSeller = completedOrders.filter(o => o.sellerId === userId).length
        const bonus = Math.min(10, Math.floor(completedOrdersAsSeller / 10)) // +1 per 10 orders (max 10)

        calculatedScore = Math.max(0, Math.min(100, baseScore - penalty + bonus))
    }

    const overallScore = credibility?.score ?? calculatedScore

    // Only include metrics that have actual data
    const metrics = [
        ...(responseRate !== null ? [{ name: "Response Rate", value: responseRate, target: 90, status: responseRate >= 90 ? "excellent" : responseRate >= 70 ? "good" : "warning" }] : []),
        ...(onTimeDelivery !== null ? [{ name: "On-Time Delivery", value: onTimeDelivery, target: 90, status: onTimeDelivery >= 90 ? "excellent" : onTimeDelivery >= 70 ? "good" : "warning" }] : []),
        ...(completionRate !== null ? [{ name: "Order Completion", value: completionRate, target: 95, status: completionRate >= 95 ? "excellent" : completionRate >= 80 ? "good" : "warning" }] : []),
        ...(avgRating !== null ? [{ name: "Client Satisfaction", value: avgRating, target: 4.5, status: avgRating >= 4.5 ? "excellent" : avgRating >= 4 ? "good" : "warning", isRating: true }] : []),
    ]

    // Determine badges/achievements with real logic
    const achievements = [
        { name: `${completedOrders.length} Orders Completed`, icon: Award, earned: completedOrders.length >= 1, description: completedOrders.length === 0 ? "Complete your first order" : `Keep going! ${10 - completedOrders.length} more to reach 10` },
        { name: "5-Star Average Rating", icon: Star, earned: avgRating !== null && avgRating >= 4.8, description: avgRating === null ? "Get reviews from clients" : avgRating >= 4.8 ? "Excellent work!" : `Need ${(4.8 * 20 - avgRating * 20).toFixed(0)} more rating points` },
        { name: "Quick Responder", icon: Zap, earned: responseRate !== null && responseRate >= 95, description: responseRate === null ? "Respond to messages quickly" : responseRate >= 95 ? "Great response time!" : `Improve response rate by ${(95 - responseRate).toFixed(0)}%` },
        { name: "Top 10% Seller", icon: TrendingUp, earned: overallScore !== null && overallScore >= 90, description: overallScore === null ? "Build your seller profile" : overallScore >= 90 ? "You're in the top 10%!" : `Need ${(90 - overallScore).toFixed(0)} more points` },
    ]

    // Add actual badges from database
    const dbBadges = credibility?.badges || []

    const level = overallScore !== null ? (overallScore >= 90 ? "Pro Seller" : overallScore >= 70 ? "Rising Talent" : "New Seller") : "Getting Started"
    const badge = overallScore !== null ? (overallScore >= 90 ? "Top Rated" : overallScore >= 80 ? "Level 2" : "Level 1") : "Newcomer"

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Credibility Status</h1>
                <p className="text-muted-foreground mt-1">
                    Your performance metrics and seller status
                </p>
            </div>

            {/* Overall Score Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
                                <div>
                                    <p className="text-xs sm:text-sm opacity-80">Overall Score</p>
                                    <p className="text-3xl sm:text-4xl font-bold">{overallScore}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                <Badge className="bg-white/20 text-white hover:bg-white/30 text-xs">
                                    {level}
                                </Badge>
                                <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300 text-xs">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    {badge}
                                </Badge>
                            </div>
                        </div>
                        <div className="hidden sm:block text-right shrink-0">
                            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center">
                                <div className="h-20 w-20 rounded-full bg-white/30 flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Algorithm Explanation - Positive */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-green-100 bg-green-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-green-800">
                            <TrendingUp className="h-4 w-4" />
                            Increases & Bonuses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ScoreFactor
                            label="Successful Order"
                            points="+5 pts"
                            desc="Every completed order boosts your score."
                        />
                        <ScoreFactor
                            label="5-Star Rating"
                            points="+2 pts"
                            desc="Client satisfaction rewards."
                        />
                        <ScoreFactor
                            label="Fast Response"
                            points="Variable"
                            desc="Responding in < 1 hr improves rate metric."
                        />
                        <ScoreFactor
                            label="Volume Bonus"
                            points="+10 pts"
                            desc="Every 10 orders completed gives a bump."
                        />
                    </CardContent>
                </Card>

                {/* Algorithm Explanation - Negative */}
                <Card className="border-red-100 bg-red-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            Deductions & Penalties
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ScoreFactor
                            label="Order Cancellation"
                            points="-10 pts"
                            desc="Seller-initiated cancellations hurt credibility."
                            isNegative
                        />
                        <ScoreFactor
                            label="Late Delivery"
                            points="-5 pts"
                            desc="Missing deadlines impacts reliability score."
                            isNegative
                        />
                        <ScoreFactor
                            label="Negative Review"
                            points="-15 pts"
                            desc="Low star ratings (1-2 stars) significantly reduce score."
                            isNegative
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Metrics Grid */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
                {metrics.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center">
                            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Target className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="font-medium text-slate-900 mb-2">No Performance Data Yet</h3>
                            <p className="text-sm text-slate-500 max-w-md mx-auto">
                                Start completing orders and responding to messages to build your credibility score. Your performance metrics will appear here once you have activity.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        {metrics.map((metric) => (
                            <MetricCard key={metric.name} metric={metric} />
                        ))}
                    </div>
                )}
            </div>

            {/* Achievements */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Achievements
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {achievements.map((achievement) => (
                            <div
                                key={achievement.name}
                                className={`flex items-center gap-4 p-4 rounded-lg border ${achievement.earned
                                    ? "bg-green-50 border-green-200"
                                    : "bg-muted/50 border-border opacity-60"
                                    }`}
                            >
                                <div className={`p-3 rounded-full ${achievement.earned ? "bg-green-100" : "bg-muted"
                                    }`}>
                                    <achievement.icon className={`h-5 w-5 ${achievement.earned ? "text-green-600" : "text-muted-foreground"
                                        }`} />
                                </div>
                                <div>
                                    <p className={`font-medium ${achievement.earned ? "text-green-900" : "text-muted-foreground"
                                        }`}>
                                        {achievement.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {achievement.description}
                                    </p>
                                    <p className={`text-xs mt-1 ${achievement.earned ? "text-green-600 font-medium" : "text-muted-foreground"
                                        }`}>
                                        {achievement.earned ? "✓ Earned" : "○ In Progress"}
                                    </p>
                                </div>
                                {achievement.earned && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-900">Tips to Improve Your Score</p>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                                <li>Respond to messages within 1 hour</li>
                                <li>Deliver orders before the deadline</li>
                                <li>Maintain clear communication with clients</li>
                                <li>Request reviews after successful orders</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function MetricCard({ metric }: {
    metric: {
        name: string
        value: number
        target: number
        status: string
        isRating?: boolean
    }
}) {
    const statusColors: Record<string, string> = {
        excellent: "text-green-600",
        good: "text-blue-600",
        warning: "text-amber-600",
        poor: "text-red-600",
    }

    return (
        <Card>
            <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{metric.name}</p>
                    <Badge variant="outline" className={statusColors[metric.status]}>
                        {metric.status}
                    </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                    <p className={`text-2xl font-bold ${statusColors[metric.status]}`}>
                        {metric.isRating ? metric.value.toFixed(1) : `${metric.value}%`}
                    </p>
                    {metric.isRating && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                </div>
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Target: {metric.isRating ? metric.target : `${metric.target}%`}</span>
                    </div>
                    <Progress
                        value={metric.isRating ? (metric.value / 5) * 100 : metric.value}
                        className="h-2"
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function ScoreFactor({ label, points, desc, isNegative }: { label: string, points: string, desc: string, isNegative?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
            <div>
                <p className={`font-semibold text-sm ${isNegative ? 'text-red-700' : 'text-green-700'}`}>{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <Badge variant="secondary" className={`${isNegative ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} whitespace-nowrap`}>
                {points}
            </Badge>
        </div>
    )
}
