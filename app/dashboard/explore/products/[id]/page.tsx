import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { Price } from "@/components/Price"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Heart,
    ShoppingBag,
    ShieldCheck,
    Download,
    Calendar,
    Tag,
    Share2,
    ArrowLeft,
    CheckCircle2,
    Star,
    MessageSquare,
    Clock,
    Package,
    ArrowRight,
    User,
    CheckCircle
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { startConversation } from "@/app/actions/chat"
import { ShareButton } from "@/components/ShareButton"
import { ReportButton } from "@/components/ReportButton"
import { ProductOrderButton } from "@/components/payment/product-order-button"
import { LikeButton } from "@/components/LikeButton"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    const product = await db.product.findUnique({
        where: { id },
        include: {
            seller: {
                select: {
                    username: true,
                    avatarUrl: true,
                    id: true,
                    bio: true,
                    createdAt: true,
                    isShadowBanned: true,
                    _count: { select: { products: true, ordersSold: true } }
                }
            },
            reviews: {
                include: { author: true },
                orderBy: { createdAt: 'desc' },
                take: 3
            },
            _count: { select: { likes: true, reviews: true } },
            likes: session?.user?.id ? { where: { userId: session.user.id } } : false
        }
    })

    if (!product) return notFound()

    const isLiked = product.likes && product.likes.length > 0
    const isOwner = session?.user?.id === product.sellerId

    // Check viewer admin status first to use in shadow ban check
    const viewer = session?.user?.id ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    }) : null
    const isViewerAdmin = viewer?.role === "ADMIN"

    // Shadow ban check: If seller is shadow banned, only they and admins can see the product
    if ((product.seller as any).isShadowBanned && !isOwner && !isViewerAdmin) {
        return notFound()
    }

    // Calculate Real Stats
    const reviewCount = product._count.reviews

    // Fetch all reviews for accurate rating calculation
    const allReviews = await db.review.findMany({
        where: { productId: id },
        select: { rating: true }
    })

    const averageRating = allReviews.length > 0
        ? (allReviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / allReviews.length)
        : null

    if (product.isRemoved) {
        const currentUser = session?.user?.id ? await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        }) : null;

        const isAdmin = currentUser?.role === "ADMIN"
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-purple-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Product Removed</h1>
                <p className="text-slate-500 max-w-md mb-8">
                    This product "{product.name}" has been removed by platform administrators and is no longer available.
                </p>
                {product.removalReason && (
                    <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm max-w-md mb-8 text-left">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">Reason for removal</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{product.removalReason}</p>
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
            {/* Header / Nav */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-16 z-20">
                <div className="max-w-6xl mx-auto px-6 md:px-10 py-5">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/dashboard/explore"
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Explore
                        </Link>

                        <div className="flex items-center gap-2">
                            {!isOwner && session?.user && (
                                <ReportButton targetId={product.id} targetType="PRODUCT" targetName="this product" variant="icon" />
                            )}
                            <ShareButton title={product.name} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT COLUMN - Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Title Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant="secondary" className="text-xs font-medium">
                                    {product.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    <Tag className="w-3 h-3 mr-1" />
                                    Digital Asset
                                </Badge>
                            </div>

                            <h1 className="text-2xl md:text-[28px] font-bold text-slate-900 leading-tight">
                                {product.name}
                            </h1>

                            {/* Seller Info Bar */}
                            <div className="flex items-center gap-4 py-4 border-y">
                                <Link href={`/users/${product.seller.username}`} className="flex items-center gap-3 group">
                                    <Avatar className="h-12 w-12 rounded-full ring-2 ring-background shadow-sm transition-transform group-hover:scale-105">
                                        <AvatarImage src={product.seller.avatarUrl ?? undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/30 text-primary font-bold">
                                            {product.seller.username?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {product.seller.username}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            {averageRating && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                    <span className="font-medium text-foreground">{averageRating.toFixed(1)}</span>
                                                </span>
                                            )}
                                            <span>{product.seller._count.ordersSold} sales</span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="ml-auto flex items-center gap-2">
                                    <LikeButton
                                        itemId={product.id}
                                        itemType="PRODUCT"
                                        initialLiked={isLiked}
                                        initialCount={product._count.likes}
                                        showCount={true}
                                        variant="filled"
                                        className="bg-red-50 dark:bg-red-500/10 border-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="space-y-3">
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-secondary border shadow-sm group">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Tag className="w-20 h-20 text-muted-foreground/20" />
                                    </div>
                                )}
                            </div>

                            {product.images?.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {product.images.map((img: string, i: number) => (
                                        <div key={i} className="relative w-24 h-16 rounded-lg overflow-hidden bg-secondary border-2 border-transparent hover:border-primary/50 transition-all cursor-pointer shrink-0">
                                            <img src={img} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Product Details</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* Deliverables / License Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-bold text-slate-900">License & Usage</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-1 hover:border-primary/20 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="font-bold text-slate-800 text-sm">
                                            {product.license === "COMMERCIAL" ? "Commercial Use" : "Personal Use Only"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-6">
                                        {product.license === "COMMERCIAL"
                                            ? "Usage for commercial projects and redistribution allowed."
                                            : "Limited to personal use only. No commercial distribution."}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-1 hover:border-primary/20 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span className="font-bold text-slate-800 text-sm">Instant Delivery</span>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-6">Get access to your assets immediately after purchase.</p>
                                </div>
                            </div>
                        </div>

                        {/* About the Seller */}
                        <div className="p-6 rounded-2xl bg-card border shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-4">About the Seller</h3>
                            <div className="flex items-start gap-4">
                                <Link href={`/users/${product.seller.username}`}>
                                    <Avatar className="h-16 w-16 rounded-full ring-2 ring-background shadow-md">
                                        <AvatarImage src={product.seller.avatarUrl ?? undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/30 text-primary font-bold text-xl">
                                            {product.seller.username?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/users/${product.seller.username}`}>
                                        <h4 className="font-semibold text-foreground hover:text-primary transition-colors">
                                            {product.seller.username}
                                        </h4>
                                    </Link>
                                    {product.seller.bio && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {product.seller.bio}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                                        {averageRating && (
                                            <span className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="font-medium text-foreground">{averageRating.toFixed(1)}</span>
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <ShoppingBag className="w-4 h-4" />
                                            {product.seller._count.products} Products
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Member since {new Date(product.seller.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {!isOwner && (
                                    <form action={async () => {
                                        "use server"
                                        await startConversation(product.sellerId)
                                    }}>
                                        <Button variant="outline" type="submit" className="shrink-0">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Contact
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN - Sticky Purchase Card */}
                    <div className="relative">
                        <div className="sticky top-32">
                            <Card className="shadow-xl border overflow-hidden py-0">
                                <CardContent className="p-0">

                                    {/* Price Header */}
                                    <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Price</span>
                                            <Price amount={product.price} size="2xl" className="font-bold text-slate-900" />
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-5">
                                        {/* Delivery Info */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    Delivery
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    Instant Download
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    License
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {product.license === "COMMERCIAL" ? "Commercial Use" : "Personal Use"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Type Context */}
                                        <div className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Type</p>
                                                <p className="text-xs font-bold text-slate-700 capitalize">Digital Asset</p>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        {product._count.likes > 0 && (
                                            <div className="flex items-center justify-between text-sm pt-2 border-t">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Heart className={cn("w-3.5 h-3.5", isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                                                    <span className="font-semibold text-foreground">{product._count.likes}</span>
                                                    <span>likes</span>
                                                </span>
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
                                                    Own Listing
                                                </Button>
                                            ) : (
                                                <ProductOrderButton
                                                    productId={product.id}
                                                    price={product.price}
                                                    sellerName={product.seller.username}
                                                    title={product.name}
                                                />
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                {!isOwner && (
                                                    <form action={async () => {
                                                        "use server"
                                                        await startConversation(product.sellerId)
                                                    }} className="w-full col-span-2">
                                                        <Button variant="outline" className="w-full h-11" type="submit">
                                                            <MessageSquare className="w-4 h-4 mr-2" />
                                                            Contact Seller
                                                        </Button>
                                                    </form>
                                                )}
                                                {/* Hidden buttons for potentially future use or alternate layout if desired, 
                                                    but current gig layout doesn't split these. keeping them clean based on user request to "copy" gig layout. 
                                                    Wait, the share and like buttons were here. Let's keep ShareButton maybe? 
                                                    Actually gig page puts share button in header. Product page has it in header too.
                                                    So we can just stick to Purchase & Contact.
                                                */}
                                            </div>
                                        </div>

                                        {/* Trust Badges */}
                                        <div className="pt-4 border-t space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                <span>Instant delivery after checkout</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                <span>Secure individual-to-individual transaction</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Seller Quick Stats */}
                            <div className="mt-4 p-4 rounded-xl bg-card border">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{product.seller._count.products}</p>
                                        <p className="text-xs text-muted-foreground">Store Items</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{product.seller._count.ordersSold}</p>
                                        <p className="text-xs text-muted-foreground">Total Sales</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">
                                Reviews
                                {reviewCount > 0 && (
                                    <span className="ml-2 text-base font-normal text-muted-foreground">
                                        ({reviewCount})
                                    </span>
                                )}
                            </h2>
                            {reviewCount > 3 && (
                                <Link
                                    href={`/products/${id}/reviews`}
                                    className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                                >
                                    See all reviews
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>

                        {product.reviews.length === 0 ? (
                            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border/60">
                                <h2 className="text-lg font-bold text-slate-900 mb-2">
                                    No reviews yet
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Customer feedback will appear here after purchases.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {product.reviews.map((review: any) => (
                                    <div key={review.id} className="p-6 bg-card rounded-2xl border border-border shadow-sm group hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center font-bold text-primary text-sm overflow-hidden ring-2 ring-background shadow-sm">
                                                    {review.author.avatarUrl ? (
                                                        <img src={review.author.avatarUrl} alt={review.author.username} className="h-full w-full object-cover" />
                                                    ) : (
                                                        review.author.username.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{review.author.username}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
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
                                                        className={`w-4 h-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}

                                {reviewCount > 3 && (
                                    <Link href={`/products/${id}/reviews`}>
                                        <Button variant="outline" className="w-full">
                                            View All {reviewCount} Reviews
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
