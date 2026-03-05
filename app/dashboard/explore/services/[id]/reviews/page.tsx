import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Star, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"

interface PageProps {
    params: Promise<{ id: string }>
}

interface ReviewWithAuthor {
    id: string
    rating: number
    comment: string
    createdAt: Date
    author: {
        username: string
        avatarUrl: string | null
    }
}

export default async function ServiceReviewsPage({ params }: PageProps) {
    const { id: serviceId } = await params;

    const service = await db.service.findUnique({
        where: { id: serviceId },
        include: {
            seller: true,
            reviews: {
                include: { author: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!service) return notFound()

    const reviewCount = service.reviews.length
    const averageRating = reviewCount > 0
        ? (service.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviewCount).toFixed(1)
        : "0.0"

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: service.reviews.filter((r: { rating: number }) => r.rating === rating).length,
        percentage: reviewCount > 0
            ? Math.round((service.reviews.filter((r: { rating: number }) => r.rating === rating).length / reviewCount) * 100)
            : 0
    }))

    // Calculate averages for categories
    const getAvg = (field: string) => {
        if (reviewCount === 0) return 0
        return (service.reviews.reduce((acc: number, r: any) => acc + (r[field] || 5), 0) / reviewCount).toFixed(1)
    }

    const categoryStats = [
        { label: "Professionalism", value: getAvg("ratingProfessionalism") },
        { label: "Timeliness", value: getAvg("ratingTimeliness") },
        { label: "Quality of Work", value: getAvg("ratingQualityOfWork") },
        { label: "Communication", value: getAvg("ratingCommunication") },
    ]

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/services/${serviceId}`}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Service
                    </Link>

                    <h1 className="text-2xl font-bold text-slate-900">Reviews for</h1>
                    <p className="text-slate-600 mt-1 line-clamp-1">{service.title}</p>
                </div>

                {reviewCount === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">No reviews yet</h2>
                        <p className="text-slate-500 mb-6">Be the first to order and leave a review!</p>
                        <Link href={`/services/${serviceId}`}>
                            <Button>View Service</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 items-center">
                                <div className="text-center md:text-left">
                                    <div className="flex flex-col items-center md:items-start">
                                        <span className="text-6xl font-black text-slate-900 tracking-tighter">{averageRating}</span>
                                        <div className="mt-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-sm font-medium text-slate-400 mt-2">{reviewCount} global reviews</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {ratingDistribution.map(({ rating, count, percentage }) => (
                                        <div key={rating} className="flex items-center gap-4 text-sm">
                                            <span className="w-2 font-bold text-slate-600">{rating}</span>
                                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="w-10 text-slate-400 text-right font-medium">{percentage}%</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="hidden lg:block space-y-4 border-l border-slate-100 pl-8">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">By Category</h3>
                                    {categoryStats.map((stat) => (
                                        <div key={stat.label} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-600 font-medium">{stat.label}</span>
                                                <span className="font-bold text-slate-900">{stat.value}</span>
                                            </div>
                                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full"
                                                    style={{ width: `${(Number(stat.value) / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900">All Guest Reviews</h2>

                            <div className="grid gap-6">
                                {service.reviews.map((review: any) => (
                                    <div key={review.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 overflow-hidden border-2 border-white shadow-sm">
                                                    {review.author.avatarUrl ? (
                                                        <img src={review.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        review.author.username.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{review.author.username}</p>
                                                    <p className="text-sm text-slate-400">
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
                                                        className={`w-5 h-5 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-100"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl mb-6">
                                            {[
                                                { label: "Professionalism", value: review.ratingProfessionalism },
                                                { label: "Timeliness", value: review.ratingTimeliness },
                                                { label: "Quality", value: review.ratingQualityOfWork },
                                                { label: "Communication", value: review.ratingCommunication }
                                            ].map((cat) => (
                                                <div key={cat.label} className="space-y-1">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{cat.label}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-sm font-black text-slate-700">{cat.value || 5}</span>
                                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-slate-600 leading-relaxed text-lg italic italic-none">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
