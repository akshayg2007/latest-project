import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { startConversation } from "@/app/actions/chat"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SaveServiceButton } from "@/components/SaveServiceButton"
import { ShareButton } from "@/components/ShareButton"
import { ReportButton } from "@/components/ReportButton"
import { ServicePriceDisplay } from "@/components/ServicePriceDisplay"
import {
    Clock,
    Star,
    ShieldCheck,
    ChevronRight,
    MessageSquare,
    ArrowLeft,
    User,
    Calendar,
    CheckCircle,
    Wrench,
    Package,
    HelpCircle,
    RefreshCcw,
    Heart,
    GitPullRequest,
    Tag
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ServiceOrderButton } from "@/components/payment/service-order-button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { LikeButton } from "@/components/LikeButton"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ServiceDetailsPage({ params }: PageProps) {
    const session = await auth();
    const { id: serviceId } = await params;

    const service = await db.service.findUnique({
        where: { id: serviceId },
        include: {
            seller: {
                include: {
                    _count: { select: { services: true, ordersSold: true } }
                }
            },
            deliverables: true,
            faqs: true,
            reviews: {
                include: { author: true },
                orderBy: { createdAt: 'desc' },
                take: 3
            },
            savedBy: session?.user?.id ? { where: { userId: session.user.id } } : false,
            likes: session?.user?.id ? { where: { userId: session.user.id } } : false,
            _count: { select: { reviews: true, orders: true, savedBy: true, likes: true } }
        }
    })

    if (!service) return notFound()

    const isOwner = session?.user?.id === service.sellerId;

    // Check viewer admin status first to use in shadow ban check
    const viewer = session?.user?.id ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    }) : null
    const isViewerAdmin = viewer?.role === "ADMIN"

    // Shadow ban check: If seller is shadow banned, only they and admins can see the service
    if (service.seller.isShadowBanned && !isOwner && !isViewerAdmin) {
        return notFound()
    }
    const isSaved = Array.isArray(service.savedBy) && service.savedBy.length > 0;
    const isLiked = Array.isArray(service.likes) && service.likes.length > 0;

    // Calculate Real Stats
    const reviewCount = service._count.reviews;
    const orderCount = service._count.orders;

    // Fetch all reviews for accurate rating calculation
    const allReviews = await db.review.findMany({
        where: { serviceId: serviceId },
        select: { rating: true }
    })

    const averageRating = allReviews.length > 0
        ? (allReviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / allReviews.length)
        : null;

    // Calculate seller stats
    const sellerReviews = await db.review.findMany({
        where: { service: { sellerId: service.sellerId } },
        select: { rating: true }
    })

    const sellerAvgRating = sellerReviews.length > 0
        ? (sellerReviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / sellerReviews.length)
        : null;

    const memberSince = service.seller.createdAt;

    if (service.isRemoved) {
        const currentUser = session?.user?.id ? await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        }) : null;

        const isAdmin = currentUser?.role === "ADMIN"
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <HelpCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Service Removed</h1>
                <p className="text-slate-500 max-w-md mb-8">
                    This service "{service.title}" has been removed by platform administrators and is no longer available.
                </p>
                {service.removalReason && (
                    <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm max-w-md mb-8 text-left">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Reason for removal</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{service.removalReason}</p>
                    </div>
                )}
                <div className="flex flex-col gap-3">
                    <Link href="/dashboard/explore">
                        <Button className="rounded-full px-8 font-bold h-12 bg-slate-900 hover:bg-slate-800 text-white">
                            Back to Explore
                        </Button>
                    </Link>
                    {isAdmin && (
                        <Link href="/admin/moderation">
                            <Button variant="ghost" className="text-xs font-bold text-slate-400">
                                Return to Moderation
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-16 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/dashboard/explore"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Back to Explore</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {!isOwner && session?.user && (
                                <div className="flex items-center gap-1">
                                    <SaveServiceButton serviceId={service.id} initialSaved={isSaved} variant="icon" />
                                    <ReportButton targetId={service.id} targetType="SERVICE" targetName="this service" variant="icon" />
                                </div>
                            )}
                            <ShareButton title={service.title} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT COLUMN - Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Title Section */}
                        <div className="space-y-4">
                            {/* Seller Info Bar */}
                            <div className="flex items-center gap-4 pb-4 border-b">
                                <Link
                                    href={`/users/${service.seller.username}`}
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center text-lg font-bold text-primary overflow-hidden ring-1 ring-border shadow-sm">
                                        {service.seller.avatarUrl ? (
                                            <img src={service.seller.avatarUrl} alt={service.seller.username} className="h-full w-full object-cover" />
                                        ) : (
                                            service.seller.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {service.seller.username}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {sellerAvgRating && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <span className="font-medium text-foreground">{sellerAvgRating.toFixed(1)}</span>
                                                </span>
                                            )}
                                            <span>{service.seller._count.ordersSold} sales</span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="ml-auto flex items-center gap-2">
                                    <LikeButton
                                        itemId={service.id}
                                        itemType="SERVICE"
                                        initialLiked={isLiked}
                                        initialCount={service._count.likes}
                                        showCount={true}
                                        variant="filled"
                                        className="bg-red-50 dark:bg-red-500/10 border-none"
                                    />
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                                {service.title}
                            </h1>

                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant="secondary" className="text-xs font-medium">
                                    {service.category}
                                </Badge>
                                {orderCount > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        {orderCount} orders completed
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="space-y-3">
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-secondary border shadow-sm">
                                <img
                                    src={service.images[0] || "/placeholder.jpg"}
                                    alt={service.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Thumbnail strip if multiple images */}
                            {service.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {service.images.map((image: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`relative w-20 h-14 rounded-lg overflow-hidden bg-secondary border-2 shrink-0 cursor-pointer transition-all ${idx === 0 ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                                }`}
                                        >
                                            <img src={image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground">About this Service</h2>
                            <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                        </div>

                        {/* Deliverables */}
                        {service.deliverables.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold text-foreground">What you'll get</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {service.deliverables.map((item: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-1 hover:border-primary/20 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-slate-500 pl-6">{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Development Roadmap / Part Payments */}
                        {(service as any).paymentSteps && ((service as any).paymentSteps as any[]).length > 0 && (
                            <div className="space-y-6 pt-8 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <GitPullRequest className="w-5 h-5 text-primary" />
                                        <h2 className="text-xl font-bold text-foreground">Development Roadmap</h2>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                                        {((service as any).paymentSteps as any[]).length} Milestones
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    This service is delivered in phases. You only release payment as each milestone is completed and approved.
                                </p>
                                <div className="space-y-4">
                                    {((service as any).paymentSteps as any[]).map((step: any, idx: number) => {
                                        const stepAmount = Math.round(service.price * (parseInt(step.percentage) || 0) / 100);
                                        return (
                                            <div key={idx} className="relative pl-8 pb-8 last:pb-0">
                                                {/* Connecting Line */}
                                                {idx !== ((service as any).paymentSteps as any[]).length - 1 && (
                                                    <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100" />
                                                )}

                                                {/* Milestone Dot */}
                                                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                                                    <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                                                </div>

                                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-primary/20 transition-all group">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                            {step.title}
                                                        </h4>
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-sm font-black text-slate-900">₹{stepAmount.toLocaleString('en-IN')}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{step.percentage}% of total</p>
                                                        </div>
                                                    </div>
                                                    {step.description && (
                                                        <p className="text-sm text-slate-500 leading-relaxed">
                                                            {step.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* FAQ Section */}
                        {service.faqs.length > 0 && (
                            <div className="space-y-6 pt-8 border-t">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
                                </div>
                                <Accordion type="single" collapsible className="w-full">
                                    {service.faqs.map((faq: any, idx: number) => (
                                        <AccordionItem key={idx} value={`item-${idx}`} className="border-b-0 mb-2">
                                            <AccordionTrigger className="hover:no-underline bg-white p-4 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm text-left shadow-sm">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-2 text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-b-xl border-x border-b border-slate-100">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        )}
                        {/* Tools */}
                        {service.tools && service.tools.length > 0 && (
                            <div className="space-y-4 pt-8 border-t mb-8">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                                    <Wrench className="w-5 h-5 text-primary" />
                                    Tools and technologies
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {service.tools.map((tool: string, idx: number) => (
                                        <Badge key={`tool-${idx}`} variant="secondary" className="px-3 py-1 font-medium bg-secondary/60 hover:bg-secondary">
                                            {tool}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seller Card */}
                        <div className="p-6 rounded-2xl bg-card border shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-4">About the Seller</h3>
                            <div className="flex items-start gap-4">
                                <Link href={`/users/${service.seller.username}`}>
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center text-xl font-bold text-primary overflow-hidden ring-2 ring-background shadow-md">
                                        {service.seller.avatarUrl ? (
                                            <img src={service.seller.avatarUrl} alt={service.seller.username} className="h-full w-full object-cover" />
                                        ) : (
                                            service.seller.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/users/${service.seller.username}`}>
                                        <h4 className="font-semibold text-foreground hover:text-primary transition-colors">
                                            {service.seller.username}
                                        </h4>
                                    </Link>
                                    {service.seller.bio && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {service.seller.bio}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                                        {sellerAvgRating && (
                                            <span className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="font-medium text-foreground">{sellerAvgRating.toFixed(1)}</span>
                                                <span>({sellerReviews.length})</span>
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {service.seller._count.ordersSold} orders completed
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Member since {memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {!isOwner && (
                                    <form action={async () => {
                                        "use server"
                                        await startConversation(service.sellerId)
                                    }}>
                                        <Button variant="outline" type="submit" className="shrink-0">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Contact
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-foreground">
                                    Reviews
                                    {reviewCount > 0 && (
                                        <span className="ml-2 text-base font-normal text-muted-foreground">
                                            ({reviewCount})
                                        </span>
                                    )}
                                </h2>
                                {reviewCount > 3 && (
                                    <Link
                                        href={`/services/${serviceId}/reviews`} // Updated Link
                                        className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                                    >
                                        See all reviews
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>

                            {service.reviews.length === 0 ? (
                                <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border/60">
                                    <h2 className="text-xl font-bold text-foreground mb-2">
                                        No reviews yet
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        Client feedback will appear here after completed work.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {service.reviews.map((review: any) => (
                                        <div key={review.id} className="p-6 bg-card rounded-2xl border border-border shadow-sm group hover:shadow-md transition-all">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center font-bold text-primary text-sm overflow-hidden border">
                                                        {review.author.avatarUrl ? (
                                                            <img src={review.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            review.author.username.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{review.author.username}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4, 5].map((star: number) => (
                                                                    <Star
                                                                        key={star}
                                                                        className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/10"}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">•</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detail Ratings */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-50 mb-4 bg-slate-50/50 rounded-lg px-3">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Professionalism</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-bold text-foreground">{review.ratingProfessionalism || 5}</span>
                                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Timeliness</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-bold text-foreground">{review.ratingTimeliness || 5}</span>
                                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Quality</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-bold text-foreground">{review.ratingQualityOfWork || 5}</span>
                                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Comm.</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-bold text-foreground">{review.ratingCommunication || 5}</span>
                                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-muted-foreground leading-relaxed italic">"{review.comment}"</p>
                                        </div>
                                    ))}

                                    {reviewCount > 3 && (
                                        <Link href={`/services/${serviceId}/reviews`}> {/* Updated Link */}
                                            <Button variant="outline" className="w-full">
                                                View All {reviewCount} Reviews
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Sticky Order Card */}
                    <div className="relative">
                        <div className="sticky top-32">
                            <Card className="shadow-xl border overflow-hidden py-0">
                                <CardContent className="p-0">

                                    {/* Price Header */}
                                    <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-b space-y-2">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Starting at</span>
                                            <ServicePriceDisplay price={service.price} className="text-3xl font-bold text-foreground" />
                                        </div>
                                        {(service as any).paymentSteps && ((service as any).paymentSteps as any[]).length > 0 && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100 w-fit">
                                                <GitPullRequest className="w-3 h-3 text-emerald-600" />
                                                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-tight">Pay in Milestones</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 space-y-5">
                                        {/* Delivery Info */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    Delivery Time
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {service.deliveryTime
                                                        ? service.deliveryTime >= 24
                                                            ? `${Math.floor(service.deliveryTime / 24)} ${Math.floor(service.deliveryTime / 24) === 1 ? 'Day' : 'Days'}`
                                                            : `${service.deliveryTime} ${service.deliveryTime === 1 ? 'Hour' : 'Hours'}`
                                                        : 'Variable'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <RefreshCcw className="w-4 h-4" />
                                                    Revisions
                                                </span>
                                                <span className="font-semibold text-foreground uppercase">
                                                    {service.revisions === '0' ? 'No Revisions' : service.revisions === 'unlimited' ? 'Unlimited' : `${service.revisions} Revisions`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Frequency Context */}
                                        {service.pricingMethod === 'ongoing' && (
                                            <div className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Frequency</p>
                                                    <p className="text-xs font-bold text-slate-700 capitalize">{service.paymentFrequency || "One-time"}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Milestones Summary */}
                                        {(service as any).paymentSteps && ((service as any).paymentSteps as any[]).length > 0 && (
                                            <div className="space-y-3 pt-3 border-t">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Milestones</p>
                                                <div className="space-y-2">
                                                    {((service as any).paymentSteps as any[]).map((step: any, idx: number) => {
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                                <span className="text-muted-foreground line-clamp-1 flex-1 pr-2">{idx + 1}. {step.title}</span>
                                                                <div className="text-right shrink-0">
                                                                    <span className="font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-md text-xs">{step.percentage}%</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {/* Stats */}
                                        {(orderCount > 0 || reviewCount > 0) && (
                                            <div className="flex items-center justify-between text-sm pt-2 border-t">
                                                {orderCount > 0 && (
                                                    <span className="text-muted-foreground">
                                                        <span className="font-semibold text-foreground">{orderCount}</span> orders
                                                    </span>
                                                )}
                                                {reviewCount > 0 && (
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                        <span className="font-semibold text-foreground">{averageRating?.toFixed(1)}</span>
                                                        <span>({reviewCount})</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <Separator />

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            {isOwner ? (
                                                <Button
                                                    className="w-full h-12 text-base font-semibold"
                                                    variant="secondary"
                                                    disabled
                                                >
                                                    This is your Service
                                                </Button>
                                            ) : (
                                                <ServiceOrderButton
                                                    serviceId={service.id}
                                                    price={service.price}
                                                    sellerName={service.seller.username}
                                                    title={service.title}
                                                    hasMilestones={((service as any).paymentSteps as any[])?.length > 0}
                                                />
                                            )}

                                            {!isOwner && (
                                                <form action={async () => {
                                                    "use server"
                                                    await startConversation(service.sellerId)
                                                }}>
                                                    <Button variant="outline" className="w-full h-11" type="submit">
                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                        Contact Seller
                                                    </Button>
                                                </form>
                                            )}
                                        </div>

                                        {/* Trust Badges */}
                                        <div className="pt-4 border-t space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                <span>Secure payment with buyer protection</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                <span>Money back guarantee if not delivered</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Stats Below Card */}
                            <div className="mt-4 p-4 rounded-xl bg-card border">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{service.seller._count.services}</p>
                                        <p className="text-xs text-muted-foreground">Active Services</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{service.seller._count.ordersSold}</p>
                                        <p className="text-xs text-muted-foreground">Total Sales</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
