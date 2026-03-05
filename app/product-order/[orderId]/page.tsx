import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    CheckCircle2,
    Clock,
    Package,
    Download,
    ArrowLeft,
    User,
    MessageCircle,
    AlertTriangle,
    ExternalLink,
    Star
} from "lucide-react"
import Link from "next/link"
import { ServicePriceDisplay } from "@/components/ServicePriceDisplay"
import { startConversation } from "@/app/actions/chat"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { raiseProductDispute } from "@/app/actions/manageProduct"
import { RateClientButton } from "../../service-order/[orderId]/RateClientButton"
import ReviewForm from "@/components/ReviewForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PageProps {
    params: Promise<{ orderId: string }>
}

export default async function ProductOrderPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) return redirect("/signin")

    const { orderId } = await params

    const orders: any[] = await db.$queryRaw`
        SELECT * FROM "Order" WHERE "id" = ${orderId} LIMIT 1
    `
    const orderBase = orders[0]

    if (!orderBase) return notFound()

    // Fetch relations
    const [product, buyer, seller, review, clientReview] = await Promise.all([
        orderBase.productId ? db.product.findUnique({ where: { id: orderBase.productId } }) : null,
        db.user.findUnique({ where: { id: orderBase.buyerId } }),
        db.user.findUnique({ where: { id: orderBase.sellerId } }),
        db.review.findUnique({ where: { orderId: orderBase.id } }),
        db.clientReview.findUnique({ where: { orderId: orderBase.id } }),
    ])

    const order = {
        ...orderBase,
        product,
        buyer,
        seller,
        review,
        clientReview,
    }

    if (!order.product) {
        // Not a product order, redirect to service order
        return redirect(`/service-order/${orderId}`)
    }

    const isSeller = session.user.id === order.sellerId
    const isBuyer = session.user.id === order.buyerId

    // Allow admins to view any order
    const currentUser = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    const isAdmin = currentUser?.role === "ADMIN"

    if (!isSeller && !isBuyer && !isAdmin) {
        return <div className="p-10 text-center">Unauthorized</div>
    }

    const isCompleted = order.status === "COMPLETED" || order.status === "PAID"
    const isDisputed = order.status === "DISPUTED"
    const isCancelled = order.status === "CANCELLED"

    // Fetch dispute info if it exists
    let dispute = null
    if (isDisputed) {
        dispute = await db.dispute.findFirst({
            where: { orderId: orderId },
            orderBy: { createdAt: 'desc' }
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Product Order #{order.id.slice(0, 8)}</h1>
                            <p className="text-slate-500">Placed on {order.createdAt.toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${order.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        isDisputed ? "bg-amber-100 text-amber-700" :
                            isCancelled ? "bg-red-100 text-red-700" :
                                "bg-blue-100 text-blue-700"
                        }`}>
                        {order.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* MAIN CONTENT */}
                    <div className="md:col-span-2 space-y-6">

                        {order.product?.isRemoved && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-800">Original Listing Removed</p>
                                    <p className="text-xs text-red-700 mt-0.5">
                                        This product has been removed by platform administrators. Your order remains active and you can still download your files, but the original listing details are no longer public.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SUMMARY */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                <img
                                    src={order.product?.images[0] || "/placeholder.jpg"}
                                    className="w-24 h-16 object-cover rounded bg-slate-200"
                                    alt="Thumbnail"
                                />
                                <div>
                                    <h3 className="font-semibold text-slate-900">{order.product?.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Package className="w-4 h-4" /> Digital Asset</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Instant Delivery
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* PRODUCT DOWNLOAD CARD */}
                        <Card className={
                            isDisputed ? "border-amber-200 bg-amber-50/50" :
                                isCancelled ? "border-red-200 bg-red-50/50" :
                                    "border-green-200 bg-green-50/50"
                        }>
                            <CardContent className="p-8 space-y-4">
                                {isDisputed ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-amber-800">Order Disputed</h2>
                                        <p className="text-amber-700 max-w-md mx-auto mb-6">
                                            This order is currently under review by our safety team. No funds will be released until a resolution is reached.
                                        </p>
                                        <div className="flex flex-col gap-3 max-w-sm mx-auto">
                                            {dispute && (
                                                <Link href={`/dashboard/projects/disputes/${dispute.id}`}>
                                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12">
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Go to Dispute Resolution
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ) : isCancelled ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-red-800">Order Cancelled</h2>
                                        <p className="text-red-700 max-w-md mx-auto mb-6">
                                            This order has been cancelled and is no longer active.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-bold text-green-800">
                                            Product Ready!
                                        </h2>
                                        <p className="text-green-700 max-w-md mx-auto mb-6">
                                            Thank you for your purchase. Your files are ready for download below.
                                        </p>

                                        {/* Product Files */}
                                        <div className="space-y-3 max-w-sm mx-auto">
                                            {order.product.fileUrls && order.product.fileUrls.length > 0 ? (
                                                order.product.fileUrls.map((url: string, idx: number) => (
                                                    <Link key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base">
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download File {order.product.fileUrls.length > 1 ? idx + 1 : ""}
                                                        </Button>
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="bg-white/50 p-4 rounded-lg border border-green-200 text-green-800 text-sm">
                                                    No file links found. Please contact the seller.
                                                </div>
                                            )}

                                            {isSeller && !order.clientReview && (
                                                <div className="mt-8 max-w-sm mx-auto space-y-2">
                                                    <p className="text-sm font-semibold text-slate-700 mb-2">One last thing — rate your buyer!</p>
                                                    <RateClientButton
                                                        orderId={order.id}
                                                        clientName={order.buyer?.username}
                                                    />
                                                    <p className="text-[11px] text-slate-400">
                                                        Your review helps build a trustworthy community.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* REVIEW SECTION */}
                        {isCompleted && isBuyer && !review && order.productId && (
                            <ReviewForm orderId={order.id} />
                        )}

                        {isCompleted && review && (() => {
                            const avgRating = (
                                ((review as any).ratingProfessionalism || 5) +
                                ((review as any).ratingTimeliness || 5) +
                                ((review as any).ratingQualityOfWork || 5) +
                                ((review as any).ratingCommunication || 5)
                            ) / 4;

                            return (
                                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{isBuyer ? "Your Review" : "Client Review"}</span>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                    const fillPercent = star <= avgRating ? 100 : (star - 1 < avgRating ? (avgRating % 1) * 100 : 0);
                                                    return (
                                                        <div key={star} className="relative">
                                                            <Star className="w-4 h-4 text-slate-200" />
                                                            {fillPercent > 0 && (
                                                                <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <span className="text-[13px] font-bold text-amber-600 ml-1">
                                                    {avgRating.toFixed(1)}
                                                </span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-8 px-8 pb-8">
                                        <div className="flex flex-col md:flex-row gap-10">
                                            <div className="flex-1 space-y-4">
                                                <p className="text-slate-700 italic text-xl leading-relaxed">"{review.comment}"</p>
                                                <div className="flex items-center gap-3 pt-4">
                                                    <Avatar className="w-10 h-10 border border-slate-100">
                                                        <AvatarImage src={order.buyer?.avatarUrl || ""} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                                            {order.buyer?.username?.charAt(0).toUpperCase() || "C"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{order.buyer?.username || "Anonymous"}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client • {new Date(review.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-64 space-y-3 pt-2">
                                                {[
                                                    { label: "Professionalism", value: (review as any).ratingProfessionalism },
                                                    { label: "Timeliness", value: (review as any).ratingTimeliness },
                                                    { label: "Quality of Work", value: (review as any).ratingQualityOfWork },
                                                    { label: "Communication", value: (review as any).ratingCommunication },
                                                ].map((cat) => (
                                                    <div key={cat.label} className="space-y-1.5">
                                                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                            <span>{cat.label}</span>
                                                            <span className="text-slate-900">{cat.value || 5}/5</span>
                                                        </div>
                                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full"
                                                                style={{ width: `${((cat.value || 5) / 5) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })()}

                        {/* CLIENT REVIEW CARD (From Freelancer about Client) */}
                        {isCompleted && order.clientReview && (() => {
                            const rev = order.clientReview as any;
                            const avgRating = (
                                (rev.ratingRequirements || 5) +
                                (rev.ratingCommunication || 5) +
                                (rev.ratingCollaboration || 5) +
                                (rev.ratingPaymentPromptness || 5)
                            ) / 4;

                            return (
                                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden mt-6">
                                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{isSeller ? "Your Review" : "Freelancer Review"}</span>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                    const fillPercent = star <= avgRating ? 100 : (star - 1 < avgRating ? (avgRating % 1) * 100 : 0);
                                                    return (
                                                        <div key={star} className="relative">
                                                            <Star className="w-4 h-4 text-slate-200" />
                                                            {fillPercent > 0 && (
                                                                <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <span className="text-[13px] font-bold text-amber-600 ml-1">
                                                    {avgRating.toFixed(1)}
                                                </span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-8 px-8 pb-8">
                                        <div className="flex flex-col md:flex-row gap-10">
                                            <div className="flex-1 space-y-4">
                                                <p className="text-slate-700 italic text-xl leading-relaxed">"{rev.comment}"</p>
                                                <div className="flex items-center gap-3 pt-4">
                                                    <Avatar className="w-10 h-10 border border-slate-100">
                                                        <AvatarImage src={order.seller?.avatarUrl || ""} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                                            {order.seller?.username?.charAt(0).toUpperCase() || "S"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{order.seller?.username || "Freelancer"}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Freelancer • {new Date(rev.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-64 space-y-3 pt-2">
                                                {[
                                                    { label: "Requirements Clarity", value: rev.ratingRequirements },
                                                    { label: "Communication", value: rev.ratingCommunication },
                                                    { label: "Collaboration", value: rev.ratingCollaboration },
                                                    { label: "Payment Promptness", value: rev.ratingPaymentPromptness },
                                                ].map((cat) => (
                                                    <div key={cat.label} className="space-y-1.5">
                                                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                            <span>{cat.label}</span>
                                                            <span className="text-slate-900">{cat.value || 5}/5</span>
                                                        </div>
                                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{ width: `${((cat.value || 5) / 5) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })()}
                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-wider text-slate-500">
                                    {isSeller ? "Buyer" : "Seller"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden font-bold text-slate-500">
                                    {(isSeller ? order.buyer.avatarUrl : order.seller.avatarUrl) ? (
                                        <img
                                            src={isSeller ? order.buyer.avatarUrl! : order.seller.avatarUrl!}
                                            className="w-full h-full object-cover"
                                            alt="User avatar"
                                        />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">
                                        {isSeller ? order.buyer.username : order.seller.username}
                                    </p>

                                    <form action={async () => {
                                        "use server"
                                        await startConversation(isSeller ? order.buyerId : order.sellerId)
                                    }}>
                                        <button
                                            type="submit"
                                            className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-1 font-medium bg-transparent border-none p-0 cursor-pointer"
                                        >
                                            <MessageCircle className="w-3 h-3" />
                                            Send Message
                                        </button>
                                    </form>

                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-slate-500">Product Price</span>
                                    <ServicePriceDisplay price={order.price} size="md" />
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total</span>
                                    <ServicePriceDisplay price={order.price} size="lg" />
                                </div>
                            </CardContent>
                        </Card>

                        {isBuyer && !isDisputed && !isCancelled && (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardHeader className="pb-3 text-red-800">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <CardTitle className="text-sm font-bold">Raise Dispute</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        If there is an issue with the product or its files, you can open a dispute. Our team will review the case.
                                    </p>
                                    <form action={raiseProductDispute} className="space-y-3">
                                        <input type="hidden" name="orderId" value={order.id} />
                                        <div className="space-y-1">
                                            <Label htmlFor="dispute-reason-sidebar" className="text-[10px] font-bold uppercase text-red-400">Reason</Label>
                                            <Textarea
                                                id="dispute-reason-sidebar"
                                                name="reason"
                                                placeholder="Why are you disputing?"
                                                className="min-h-[80px] text-sm bg-white border-red-200 focus:border-red-500 rounded-lg resize-none"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 rounded-lg transition-all active:scale-95">
                                            Raise Formal Dispute
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
