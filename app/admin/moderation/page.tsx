import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Shield, ShoppingBag, Package, Briefcase, Clock, ExternalLink, Star, Users, Search, MessageCircle, Link2, Flag, FileText, AlertTriangle, CheckCircle2, User, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ReportStatus, ReportType } from "@prisma/client"

import { ModerateListingButton } from "@/components/admin/ModerateListingButton"
import { ReviewActions } from "@/components/admin/ReviewActions"
import { CommunityActions } from "@/components/admin/CommunityActions"
import { ReportActions } from "@/components/admin/ReportActions"
import { ReportFilters as ReportFiltersComponent } from "@/components/admin/ReportFilters"
import { Price } from "@/components/Price"

const REPORT_REASONS = [
    "Spam or misleading",
    "Harassment or hate speech",
    "Inappropriate content",
    "Intellectual property violation",
    "Scam or fraud",
    "Prohibited services/products",
    "Other"
]

export default async function AdminModerationPage({
    searchParams
}: {
    searchParams: Promise<{
        tab?: string;
        status?: string;
        q?: string;
        filter?: string;
        type?: string;
        reason?: string;
    }>
}) {
    const { tab, status, q, filter, type, reason: filterReason } = await searchParams
    const query = q || ""
    const activeTab = tab || "services"

    // Support both 'status' and legacy 'filter' parameter
    const rawStatus = status || (filter === "removed" ? "REMOVED" : "")
    const activeStatus = rawStatus || (activeTab === "reports" ? "PENDING" : "ACTIVE")
    const isRemovedFilter = activeStatus === "REMOVED"

    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") redirect("/dashboard")

    // Unified Counts for Tabs
    const [serviceCount, productCount, jobCount, reviewCount, postCount, commentCount, reportCount] = await Promise.all([
        db.service.count({ where: { isRemoved: false } }),
        db.product.count({ where: { isRemoved: false } }),
        db.job.count({ where: { isRemoved: false } }),
        db.review.count({ where: { isRemoved: false } }),
        db.post.count({ where: { isRemoved: false } }),
        db.comment.count({ where: { isRemoved: false } }),
        db.report.count({ where: { status: 'PENDING' } })
    ])

    // Tab Specific Data
    let services: any[] = []
    let products: any[] = []
    let jobs: any[] = []
    let reviews: any[] = []
    let communityPosts: any[] = []
    let communityComments: any[] = []
    let reports: any[] = []
    let historyData: any[] = []

    if (activeTab === "services") {
        services = await db.service.findMany({
            where: {
                isRemoved: isRemovedFilter,
                ...(query && {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { description: { contains: query, mode: "insensitive" } },
                    ]
                })
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                seller: { select: { username: true, avatarUrl: true } },
                _count: { select: { orders: true, reviews: true } }
            }
        })
    } else if (activeTab === "products") {
        products = await db.product.findMany({
            where: {
                isRemoved: isRemovedFilter,
                ...(query && {
                    OR: [
                        { name: { contains: query, mode: "insensitive" } },
                        { description: { contains: query, mode: "insensitive" } },
                    ]
                })
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                seller: { select: { username: true, avatarUrl: true } },
                _count: { select: { orders: true, reviews: true } }
            }
        })
    } else if (activeTab === "jobs") {
        jobs = await db.job.findMany({
            where: {
                isRemoved: isRemovedFilter,
                ...(query && {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { description: { contains: query, mode: "insensitive" } },
                    ]
                })
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                client: { select: { username: true, avatarUrl: true } },
                _count: { select: { applications: true } }
            }
        })
    } else if (activeTab === "reviews") {
        reviews = await db.review.findMany({
            where: {
                isRemoved: isRemovedFilter,
                ...(query && {
                    comment: { contains: query, mode: "insensitive" }
                })
            },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                order: {
                    select: {
                        id: true,
                        service: { select: { title: true } },
                        product: { select: { name: true } },
                        seller: { select: { username: true } },
                        productId: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        })
    } else if (activeTab === "community") {
        const showType = type || "posts"
        if (showType === "posts") {
            communityPosts = await db.post.findMany({
                where: {
                    isRemoved: isRemovedFilter,
                    ...(query && {
                        OR: [
                            { title: { contains: query, mode: "insensitive" } },
                            { content: { contains: query, mode: "insensitive" } }
                        ]
                    })
                },
                include: {
                    author: { select: { id: true, username: true, avatarUrl: true } },
                    _count: { select: { comments: true, votes: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            })
        } else {
            communityComments = await db.comment.findMany({
                where: {
                    isRemoved: isRemovedFilter,
                    ...(query && {
                        text: { contains: query, mode: "insensitive" }
                    })
                },
                include: {
                    author: { select: { id: true, username: true, avatarUrl: true } },
                    post: { select: { title: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            })
        }
    } else if (activeTab === "reports") {
        const filterStatus = status || "PENDING"
        reports = await db.report.findMany({
            where: {
                ...(filterStatus === 'HISTORY'
                    ? { status: { in: ['RESOLVED', 'DISMISSED'] } }
                    : filterStatus === 'ALL'
                        ? {}
                        : { status: filterStatus as ReportStatus }),
                ...(type ? { targetType: type as ReportType } : {}),
                ...(filterReason ? { reason: filterReason } : {}),
                ...(query && {
                    OR: [
                        { details: { contains: query, mode: 'insensitive' } },
                        { reason: { contains: query, mode: 'insensitive' } },
                    ]
                })
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        // Fetch history for report targets
        const targetIds = reports.map(r => r.targetId)
        historyData = (await db.report.groupBy({
            by: ['targetId', 'status'],
            where: {
                targetId: { in: targetIds },
            },
            _count: true
        }) as any)
    }

    const getTargetIcon = (type: ReportType) => {
        switch (type) {
            case 'USER': return <User className="w-4 h-4" />
            case 'POST': return <FileText className="w-4 h-4" />
            case 'SERVICE': return <ShoppingBag className="w-4 h-4" />
            case 'PRODUCT': return <Package className="w-4 h-4" />
            case 'JOB': return <Briefcase className="w-4 h-4" />
            case 'COMMENT': return <MessageCircle className="w-4 h-4" />
            case 'MESSAGE': return <MessageCircle className="w-4 h-4" />
            default: return <Flag className="w-4 h-4" />
        }
    }

    const getTargetUrl = (type: ReportType, targetId: string) => {
        switch (type) {
            case 'USER': return `/users/id/${targetId}`
            case 'POST': return `/dashboard/community/${targetId}`
            case 'SERVICE': return `/dashboard/explore/services/${targetId}`
            case 'PRODUCT': return `/dashboard/explore/products/${targetId}`
            case 'JOB': return `/dashboard/explore/jobs/${targetId}`
            case 'COMMENT': return `/dashboard/community/target/comment/${targetId}`
            case 'MESSAGE': return `/dashboard/messages`
            default: return '#'
        }
    }

    const getStatusBadge = (status: ReportStatus) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 font-bold text-[10px] tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                        PENDING
                    </Badge>
                )
            case 'RESOLVED':
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold text-[10px] tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        RESOLVED
                    </Badge>
                )
            case 'DISMISSED':
                return (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold text-[10px] tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
                        DISMISSED
                    </Badge>
                )
        }
    }

    const tabs = [
        { label: "Services", value: "services", count: serviceCount, icon: ShoppingBag },
        { label: "Products", value: "products", count: productCount, icon: Package },
        { label: "Jobs", value: "jobs", count: jobCount, icon: Briefcase },
        { label: "Reviews", value: "reviews", count: reviewCount, icon: Star },
        { label: "Community", value: "community", count: postCount + commentCount, icon: Users },
        { label: "Reports", value: "reports", count: reportCount, icon: Flag },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                    Content Moderation
                </h1>
                <p className="text-slate-500 text-sm mt-1">Review and moderate platform listings</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* TABS */}
                <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner w-fit overflow-x-auto max-w-full">
                    {tabs.map((t) => {
                        const Icon = t.icon
                        return (
                            <Link key={t.value} href={`/admin/moderation?${new URLSearchParams({
                                tab: t.value,
                                ...(activeStatus !== 'ACTIVE' && activeTab !== 'reports' && { status: activeStatus })
                            }).toString()}`}>
                                <Button
                                    variant={activeTab === t.value ? "default" : "ghost"}
                                    className={`rounded-xl font-bold text-xs px-4 h-9 whitespace-nowrap ${activeTab === t.value
                                        ? "bg-white text-purple-600 shadow-sm hover:bg-white"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-transparent"
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                                    {t.label} {t.count > 0 && <span className="ml-1.5 text-[10px] opacity-70">({t.count})</span>}
                                </Button>
                            </Link>
                        )
                    })}
                </div>

                {/* Search & Status Toggle */}
                <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${activeTab === 'reports' ? 'overflow-x-auto no-scrollbar pb-1' : ''}`}>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Search Field */}
                        <form className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="hidden" name="tab" value={activeTab} />
                            {activeStatus !== "ACTIVE" && <input type="hidden" name="status" value={activeStatus} />}
                            {type && <input type="hidden" name="type" value={type} />}
                            {filterReason && <input type="hidden" name="reason" value={filterReason} />}
                            <input
                                type="text"
                                name="q"
                                placeholder="Search..."
                                defaultValue={query}
                                className="w-full h-9 pl-9 pr-4 text-xs bg-slate-100 border-none rounded-xl focus:ring-1 focus:ring-slate-300"
                            />
                        </form>

                        {/* Community Type Toggle */}
                        {activeTab === "community" && (
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit shrink-0">
                                <Link href={`/admin/moderation?${new URLSearchParams({
                                    tab: 'community',
                                    type: 'posts',
                                    status: activeStatus,
                                    ...(query && { q: query })
                                }).toString()}`}>
                                    <Button variant={(type || 'posts') === "posts" ? "default" : "ghost"} size="sm" className={`rounded-lg h-7 px-3 text-[10px] font-bold ${(type || 'posts') === "posts" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-transparent"}`}>
                                        POSTS
                                    </Button>
                                </Link>
                                <Link href={`/admin/moderation?${new URLSearchParams({
                                    tab: 'community',
                                    type: 'comments',
                                    status: activeStatus,
                                    ...(query && { q: query })
                                }).toString()}`}>
                                    <Button variant={type === "comments" ? "default" : "ghost"} size="sm" className={`rounded-lg h-7 px-3 text-[10px] font-bold ${type === "comments" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-transparent"}`}>
                                        COMMENTS
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Report Specific Filters */}
                        {activeTab === "reports" && (
                            <div className="shrink-0 transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                                <ReportFiltersComponent
                                    currentStatus={activeStatus as any}
                                    currentType={type as any}
                                    currentReason={filterReason}
                                    reasons={REPORT_REASONS}
                                />
                            </div>
                        )}

                        {/* Status Toggle */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit shrink-0">
                            {activeTab === 'reports' ? (
                                <>
                                    <Link href={`/admin/moderation?${new URLSearchParams({
                                        tab: 'reports',
                                        status: 'PENDING',
                                        ...(type && { type }),
                                        ...(query && { q: query })
                                    }).toString()}`}>
                                        <Button variant={activeStatus === 'PENDING' ? "default" : "ghost"} size="sm" className={`rounded-lg h-7 text-[10px] font-bold ${activeStatus === 'PENDING' ? "bg-white text-amber-600 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-transparent"}`}>
                                            PENDING
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/moderation?${new URLSearchParams({
                                        tab: 'reports',
                                        status: 'HISTORY',
                                        ...(type && { type }),
                                        ...(query && { q: query })
                                    }).toString()}`}>
                                        <Button variant={activeStatus === 'HISTORY' ? "default" : "ghost"} size="sm" className={`rounded-lg h-7 text-[10px] font-bold ${activeStatus === 'HISTORY' ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-transparent"}`}>
                                            HISTORY
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href={`/admin/moderation?${new URLSearchParams({
                                        tab: activeTab,
                                        status: 'ACTIVE',
                                        ...(query && { q: query }),
                                        ...(type && { type })
                                    }).toString()}`}>
                                        <Button variant={activeStatus === 'ACTIVE' ? "default" : "ghost"} size="sm" className={`rounded-lg h-7 text-[10px] font-bold ${activeStatus === 'ACTIVE' ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-transparent"}`}>
                                            ACTIVE
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/moderation?${new URLSearchParams({
                                        tab: activeTab,
                                        status: 'REMOVED',
                                        ...(query && { q: query }),
                                        ...(type && { type })
                                    }).toString()}`}>
                                        <Button variant={activeStatus === 'REMOVED' ? "default" : "ghost"} size="sm" className={`rounded-lg h-7 text-[10px] font-bold ${activeStatus === 'REMOVED' ? "bg-white text-red-600 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-transparent"}`}>
                                            REMOVED
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SERVICES */}
            {activeTab === "services" && (
                <div className="grid gap-4">
                    {services.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
                            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">No services found</p>
                        </Card>
                    ) : services.map((service) => (
                        <Card key={service.id} className="border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 transition-all">
                            <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5 min-w-0 flex-1">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                        {service.mediaUrls?.[0] ? <img src={service.mediaUrls[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingBag className="w-6 h-6" /></div>}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">{service.title}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="font-bold text-slate-900">@{service.seller.username}</span>
                                            <span>•</span>
                                            <span>{service._count.orders} Orders</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 shrink-0">
                                    <div className="text-right">
                                        <Price amount={service.price} className="font-black text-lg text-slate-900" />
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mt-0.5">Starting Price</p>
                                    </div>
                                    <ModerateListingButton listingId={service.id} listingType="service" listingTitle={service.title} isRemoved={service.isRemoved} removalReason={service.removalReason} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* PRODUCTS */}
            {activeTab === "products" && (
                <div className="grid gap-4">
                    {products.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
                            <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">No products found</p>
                        </Card>
                    ) : products.map((product) => (
                        <Card key={product.id} className="border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 transition-all">
                            <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5 min-w-0 flex-1">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                        {product.mediaUrls?.[0] ? <img src={product.mediaUrls[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-6 h-6" /></div>}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="font-bold text-slate-900">@{product.seller.username}</span>
                                            <span>•</span>
                                            <span>{product._count.orders} Orders</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 shrink-0">
                                    <div className="text-right">
                                        <Price amount={product.price} className="font-black text-lg text-slate-900" />
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mt-0.5">Price</p>
                                    </div>
                                    <ModerateListingButton listingId={product.id} listingType="product" listingTitle={product.name} isRemoved={product.isRemoved} removalReason={product.removalReason} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* JOBS */}
            {activeTab === "jobs" && (
                <div className="grid gap-4">
                    {jobs.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
                            <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">No jobs found</p>
                        </Card>
                    ) : jobs.map((job) => (
                        <Card key={job.id} className="border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 transition-all">
                            <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5 min-w-0 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black shrink-0">
                                        {job.client.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">{job.title}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="font-bold text-slate-900">@{job.client.username}</span>
                                            <span>•</span>
                                            <span>{job._count.applications} Applications</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 shrink-0">
                                    <div className="text-right">
                                        <Price amount={job.budget} className="font-black text-lg text-slate-900" />
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mt-0.5">Budget</p>
                                    </div>
                                    <ModerateListingButton listingId={job.id} listingType="job" listingTitle={job.title} isRemoved={job.isRemoved} removalReason={job.removalReason} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
                <div className="grid gap-4">
                    {reviews.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
                            <Star className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">No reviews found</p>
                        </Card>
                    ) : reviews.map((review: any) => {
                        const itemName = review.order?.service?.title || review.order?.product?.name || "Order"
                        const isProduct = !!review.order?.productId
                        const orderPath = isProduct ? `/product-order/${review.order?.id}` : `/service-order/${review.order?.id}`
                        return (
                            <Card key={review.id} className={`border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 transition-all ${review.isRemoved ? "opacity-70 bg-red-50/20" : ""}`}>
                                <div className="flex flex-col md:flex-row">
                                    <div className={`w-1 md:w-1.5 shrink-0 ${review.rating <= 2 ? "bg-red-500" : review.rating <= 3 ? "bg-amber-500" : "bg-emerald-500"}`} />
                                    <CardContent className="p-0 flex-1">
                                        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                                            <div className="w-full md:w-44 shrink-0">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reviewer</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                                        {review.author.avatarUrl ? <img src={review.author.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-bold text-xs uppercase">{review.author.username.charAt(0)}</div>}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-slate-900 text-sm truncate">@{review.author.username}</span>
                                                        <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(review.createdAt))} ago</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}
                                                    </div>
                                                    <Badge className={`border-none font-bold text-[10px] ${review.rating <= 2 ? "bg-red-100 text-red-700" : review.rating <= 3 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{review.rating}/5</Badge>
                                                    {review.isRemoved && <Badge className="bg-red-110 text-red-700 font-bold text-[10px]">REMOVED</Badge>}
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 italic">"{review.comment}"</div>
                                                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                                    <span className="truncate max-w-[200px]">{itemName}</span>
                                                    <span>Seller: @{review.order?.seller?.username}</span>
                                                </div>
                                            </div>
                                            <div className="w-full md:w-auto shrink-0 flex flex-col gap-2 justify-start border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                                <Link href={orderPath} target="_blank">
                                                    <Button variant="outline" className="w-full h-10 rounded-xl font-bold text-sm gap-2 px-5 border-slate-200 hover:bg-slate-50">
                                                        <ExternalLink className="w-4 h-4" /> View Order
                                                    </Button>
                                                </Link>
                                                <ReviewActions reviewId={review.id} isRemoved={review.isRemoved} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* COMMUNITY */}
            {activeTab === "community" && (
                <div className="grid gap-4">
                    {(type || 'posts') === "posts" ? (
                        communityPosts.length === 0 ? (
                            <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
                                <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-bold">No posts found</p>
                            </Card>
                        ) : communityPosts.map((post: any) => (
                            <Card key={post.id} className={`border-slate-100 shadow-sm overflow-hidden ${post.isRemoved ? "opacity-70 bg-red-50/20" : ""}`}>
                                <CardContent className="p-0 flex flex-col md:flex-row">
                                    <div className="p-5 flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                                {post.author.avatarUrl ? <img src={post.author.avatarUrl} className="w-full h-full object-cover" /> : <div className="p-2 text-center text-xs">@</div>}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-900 text-sm">@{post.author.username}</span>
                                                <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                            </div>
                                            {post.isRemoved && <Badge className="ml-auto bg-red-100 text-red-700 font-bold text-[10px]">REMOVED</Badge>}
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900">{post.title}</h3>
                                        <p className="text-sm text-slate-600 line-clamp-3 mt-1">{post.content}</p>
                                        <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                                            <span>{post._count.votes} Votes</span>
                                            <span>{post._count.comments} Comments</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{post.postType}</span>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-48 border-l border-slate-100 p-5 flex flex-col justify-center gap-3 bg-slate-50/50">
                                        <Link href={`/dashboard/community/${post.id}`} target="_blank">
                                            <Button variant="outline" className="w-full h-9 rounded-xl font-bold text-xs gap-2 border-slate-200 hover:bg-slate-100">
                                                <ExternalLink className="w-4 h-4" /> View Post
                                            </Button>
                                        </Link>
                                        <CommunityActions id={post.id} type="post" isRemoved={post.isRemoved} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        communityComments.length === 0 ? (
                            <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
                                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-bold">No comments found</p>
                            </Card>
                        ) : communityComments.map((comment: any) => (
                            <Card key={comment.id} className={`border-slate-100 shadow-sm overflow-hidden ${comment.isRemoved ? "opacity-70 bg-red-50/20" : ""}`}>
                                <CardContent className="p-0 flex flex-col md:flex-row">
                                    <div className="p-5 flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                                {comment.author.avatarUrl ? <img src={comment.author.avatarUrl} className="w-full h-full object-cover" /> : <div className="p-2 text-center text-xs">@</div>}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-900 text-sm">@{comment.author.username}</span>
                                                <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                                            </div>
                                            {comment.isRemoved && <Badge className="ml-auto bg-red-100 text-red-700 font-bold text-[10px]">REMOVED</Badge>}
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-sm text-slate-700">{comment.text}</p>
                                        </div>
                                        <div className="mt-3 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                                            <MessageCircle className="w-3 h-3 shrink-0" />
                                            On post: <span className="text-slate-700 truncate">"{comment.post.title}"</span>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-36 border-l border-slate-100 p-4 flex flex-col justify-center gap-2 bg-slate-50/50">
                                        <Link href={`/dashboard/community/${comment.postId}`} target="_blank">
                                            <Button variant="outline" className="w-full h-8 rounded-lg font-bold text-[10px] gap-1.5 border-slate-200 hover:bg-slate-100">
                                                <ExternalLink className="w-3 h-3" /> View Thread
                                            </Button>
                                        </Link>
                                        <CommunityActions id={comment.id} type="comment" isRemoved={comment.isRemoved} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* REPORTS */}
            {activeTab === "reports" && (
                <div className="grid gap-4">
                    {reports.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
                            <Flag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">No reports found</p>
                        </Card>
                    ) : reports.map((report: any) => {
                        const history = historyData.filter(h => h.targetId === report.targetId)
                        const totalHistory = history.reduce((acc, curr) => acc + curr._count, 0)
                        return (
                            <Card key={report.id} className="border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    <div className={`w-1 md:w-1.5 shrink-0 ${report.status === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    <CardContent className="p-0 flex-1">
                                        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                                            <div className="w-full md:w-48 shrink-0">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Flag className="w-4 h-4 text-red-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                                        {report.reporter.avatarUrl ? <img src={report.reporter.avatarUrl} className="w-full h-full object-cover" /> : <div className="p-2 text-center text-xs">@</div>}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-sm">@{report.reporter.username}</span>
                                                        <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(report.createdAt))} ago</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {getStatusBadge(report.status)}
                                                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-bold text-[10px] tracking-wide flex items-center gap-1.5 py-1 px-2.5">
                                                        {getTargetIcon(report.targetType)}
                                                        {report.targetType}
                                                    </Badge>
                                                    <Badge className="bg-red-50 text-red-700 border-none font-bold text-[10px] uppercase py-1 px-2.5">
                                                        {report.reason}
                                                    </Badge>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-inner">
                                                    <p className="text-sm text-slate-700 leading-relaxed italic">{report.details || "No details provided."}</p>
                                                </div>
                                                {totalHistory > 1 && (
                                                    <div className="text-[10px] font-black text-red-800/60 uppercase bg-red-50/30 p-2 rounded-lg border border-red-100/50 w-fit">
                                                        Repeat Offenses: {totalHistory} flags
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full md:w-auto shrink-0 flex flex-col gap-2 justify-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                                <Link href={getTargetUrl(report.targetType, report.targetId)} target="_blank">
                                                    <Button variant="outline" className="w-full h-10 rounded-xl font-bold text-sm gap-2.5 px-5 border-slate-200 hover:bg-slate-50">
                                                        <ExternalLink className="w-4 h-4" /> View Target
                                                    </Button>
                                                </Link>
                                                <ReportActions reportId={report.id} currentStatus={report.status} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
