import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Search,
    Filter,
    ShoppingBag,
    Download,
    Star,
    Calendar,
    FileText,
    ExternalLink
} from "lucide-react"
import { StatPrice } from "@/components/DashboardPrice"

export const dynamic = 'force-dynamic'

export default async function MyPurchasesPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch orders bought by user (community purchases are digital products)
    const orders = await db.order.findMany({
        where: { buyerId: userId },
        include: {
            seller: true,
            service: {
                include: { reviews: true }
            },
            review: true
        },
        orderBy: { createdAt: 'desc' }
    })

    const purchases = orders.map(order => {
        // Calculate average rating for the gig
        const avgRating = (order.service?.reviews.length ?? 0) > 0
            ? order.service!.reviews.reduce((sum, r) => sum + r.rating, 0) / order.service!.reviews.length
            : 0

        return {
            id: order.id,
            title: order.service?.title || "Product Purchase",
            seller: order.seller.username,
            price: order.price,
            purchaseDate: order.createdAt,
            category: order.service?.category || "Digital Product",
            rating: avgRating,
            hasReviewed: !!order.review
        }
    })

    const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">My Purchases</h1>
                <p className="text-muted-foreground mt-1">
                    Access and download your purchased digital products
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search purchases..." className="pl-9" />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Purchases</p>
                        <p className="text-2xl font-bold mt-1">{purchases.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold mt-1">
                            <StatPrice amount={totalSpent} />
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Pending Reviews</p>
                        <p className="text-2xl font-bold mt-1 text-blue-600">
                            {purchases.filter(p => !p.hasReviewed).length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Purchases Grid */}
            {purchases.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {purchases.map((purchase) => (
                        <PurchaseCard key={purchase.id} purchase={purchase} />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold">No Purchases Yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Browse the marketplace to find great services.
                        </p>
                        <Link href="/explore">
                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                Browse Marketplace
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function PurchaseCard({ purchase }: {
    purchase: {
        id: string
        title: string
        seller: string
        price: number
        purchaseDate: Date
        category: string
        rating: number
        hasReviewed: boolean
    }
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground line-clamp-2">{purchase.title}</h3>
                            {!purchase.hasReviewed && (
                                <Badge className="bg-blue-600 text-xs shrink-0">Review Pending</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">by {purchase.seller}</p>
                    </div>
                    <Badge variant="outline">{purchase.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4 text-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-green-600">
                            <StatPrice amount={purchase.price} />
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${i < Math.round(purchase.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted"}`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(purchase.purchaseDate, 'MMM dd, yyyy')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                    </Button>
                    <Button variant="outline" size="sm">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        License
                    </Button>
                    <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
