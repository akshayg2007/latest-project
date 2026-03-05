import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Star,
    ArrowLeft,
    User,
    Calendar,
    CheckCircle2
} from "lucide-react"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ProductReviewsPage({ params }: PageProps) {
    const { id: productId } = await params;

    const product = await db.product.findUnique({
        where: { id: productId },
        include: {
            seller: {
                select: {
                    username: true,
                    avatarUrl: true
                }
            },
            reviews: {
                include: { author: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!product) return notFound()

    const reviewCount = product.reviews.length
    const averageRating = reviewCount > 0
        ? (product.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviewCount).toFixed(1)
        : "0.0"

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: product.reviews.filter((r: { rating: number }) => r.rating === rating).length,
        percentage: reviewCount > 0
            ? Math.round((product.reviews.filter((r: { rating: number }) => r.rating === rating).length / reviewCount) * 100)
            : 0
    }))

    // Calculate averages for categories
    const getAvg = (field: string) => {
        if (reviewCount === 0) return 0
        return (product.reviews.reduce((acc: number, r: any) => acc + (r[field] || 5), 0) / reviewCount).toFixed(1)
    }

    const categoryStats = [
        { label: "Professionalism", value: getAvg('ratingProfessionalism') },
        { label: "Timeliness", value: getAvg('ratingTimeliness') },
        { label: "Quality", value: getAvg('ratingQualityOfWork') },
        { label: "Communication", value: getAvg('ratingCommunication') }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-16 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href={`/products/${productId}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Product
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Stats */}
                    <div className="space-y-6">
                        {/* Overall Rating */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <h1 className="text-4xl font-bold text-foreground mb-2">{averageRating}</h1>
                                    <div className="flex justify-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${star <= Number(averageRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground">{reviewCount} Reviews</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rating Distribution */}
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-4">Rating Distribution</h3>
                                <div className="space-y-3">
                                    {ratingDistribution.map(({ rating, count, percentage }) => (
                                        <div key={rating} className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 w-12">
                                                <span className="text-sm">{rating}</span>
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            </div>
                                            <Progress value={percentage} className="flex-1" />
                                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category Stats */}
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-4">Rating Breakdown</h3>
                                <div className="space-y-3">
                                    {categoryStats.map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">{label}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">{value}</span>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= Number(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN - Reviews */}
                    <div className="lg:col-span-2">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-foreground mb-2">All Customer Reviews</h2>

                            <div className="grid gap-6">
                                {product.reviews.map((review: any) => (
                                    <div key={review.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center font-bold text-primary overflow-hidden ring-2 ring-background shadow-md">
                                                    {review.author.avatarUrl ? (
                                                        <img src={review.author.avatarUrl} alt={review.author.username} className="h-full w-full object-cover" />
                                                    ) : (
                                                        review.author.username.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{review.author.username}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-5 h-5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-1">Professionalism</p>
                                                <div className="flex justify-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= review.ratingProfessionalism ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-1">Timeliness</p>
                                                <div className="flex justify-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= review.ratingTimeliness ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-1">Quality</p>
                                                <div className="flex justify-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= review.ratingQualityOfWork ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-1">Communication</p>
                                                <div className="flex justify-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= review.ratingCommunication ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-700 leading-relaxed">{review.comment}</p>

                                        {review.verified && (
                                            <div className="flex items-center gap-2 mt-4 text-sm text-emerald-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Verified Purchase</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
