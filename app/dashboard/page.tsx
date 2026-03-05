import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { formatDistanceToNow } from "date-fns"

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic'

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Briefcase,
    Star,
    Activity,
    ArrowUpRight,
    ShoppingBag,
    CreditCard,
    TrendingUp,
    Search,
    MessageSquare,
    CheckCircle2,
    IndianRupee,
    AlertCircle,
    Rocket,
    Plus,
    Users,
    Calendar,
    Send
} from "lucide-react"
import { Price } from "@/components/Price"

interface PageProps {
    searchParams: Promise<{ ticketId?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    // Check for ticketId parameter to handle resolved ticket redirects
    const { ticketId } = await searchParams

    // If ticketId exists, redirect to the support ticket page
    if (ticketId) {
        redirect(`/dashboard/support/${ticketId}`)
    }

    // Check mode (Buyer vs Seller) - Fetch from DB to get current value
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { activeProfile: true, username: true, role: true }
    })

    if (!user) redirect("/api/auth/signin")

    // REDIRECT ADMINS
    if (user.role === "ADMIN") {
        redirect("/admin/dashboard")
    }

    const isSeller = user.activeProfile === "SELLER"

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">
                    {isSeller ? "Dashboard" : "My Workspace"}
                </h1>
            </div>

            {/* CONDITIONAL RENDERING BASED ON ACTIVE PROFILE */}
            {isSeller ? (
                <SellerView userId={session.user.id} />
            ) : (
                <BuyerView userId={session.user.id} />
            )}
        </div>
    )
}

// =========================================================
// 1. SELLER DASHBOARD
// =========================================================
async function SellerView({ userId }: { userId: string }) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            services: { include: { reviews: true }, orderBy: { createdAt: 'desc' } },
            ordersSold: {
                include: { service: true, product: true, buyer: true, seller: true },
                orderBy: { createdAt: 'desc' }
            },
            freelancerProjects: {
                include: { client: true },
                orderBy: { updatedAt: 'desc' },
                take: 4
            },
            conversationsA: {
                include: {
                    userB: true,
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { updatedAt: 'desc' },
                take: 4
            },
            conversationsB: {
                include: {
                    userA: true,
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { updatedAt: 'desc' },
                take: 4
            },
            notifications: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    })

    if (!user) return null

    // CALCULATE STATS
    const income = user.ordersSold.reduce((acc: number, order: any) => acc + order.price, 0)
    const pendingOrders = user.ordersSold.filter((o: any) => o.status === "PENDING").length
    const completedOrders = user.ordersSold.filter((o: any) => o.status === "COMPLETED").length

    // Rating Math
    const allReviews = user.services.flatMap((service: any) => service.reviews)
    const rating = allReviews.length > 0
        ? (allReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / allReviews.length).toFixed(1)
        : "N/A"

    // Combine and sort conversations
    const allConversations = [
        ...user.conversationsA.map((c: any) => ({ ...c, otherUser: c.userB })),
        ...user.conversationsB.map((c: any) => ({ ...c, otherUser: c.userA }))
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4)

    // Combine projects and pending orders for the "Active Projects" section
    const pendingOrdersList = user.ordersSold
        .filter((o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED" && !o.product)
        .map((o: any) => ({
            id: o.id,
            title: o.service?.title || o.product?.name || ("Order #" + o.id.toString().slice(0, 8)),
            client: o.buyer,
            status: o.status === 'PENDING' ? 'ACTIVE' : o.status.replace("_", " "),
            progress: 0,
            deadline: o.deadline,
            updatedAt: o.createdAt
        }))

    const projects = [
        ...(user.freelancerProjects || []),
        ...pendingOrdersList
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4)

    // Build activity from orders and notifications
    const activityItems = [
        ...user.ordersSold.slice(0, 5).map((order: any) => ({
            type: order.status === 'COMPLETED' ? 'completed' : order.revisionRequested ? 'revision' : 'payment',
            title: order.status === 'COMPLETED' ? 'Project completed' : order.revisionRequested ? 'Revision requested' : 'New payment received',
            description: order.status === 'COMPLETED'
                ? `${order.service?.title || order.product?.name || 'Item'} has been delivered to ${order.buyer.username}`
                : order.revisionRequested
                    ? `${order.buyer.username} requested changes on ${order.service?.title || order.product?.name || 'Item'}`
                    : `You received ₹${order.price} from ${order.buyer.username} for ${order.service?.title || order.product?.name || 'Item'}`,
            time: order.createdAt
        })),
        ...user.notifications.slice(0, 2).map((n: any) => ({
            type: 'notification',
            title: 'New activity',
            description: n.text,
            time: n.createdAt
        }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4)

    return (
        <>
            {/* STATS ROW */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><Price amount={income} /></div>
                        <p className="text-xs text-muted-foreground">Lifetime Earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingOrders}</div>
                        <p className="text-xs text-muted-foreground">Needs delivery</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedOrders}</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rating}</div>
                        <p className="text-xs text-muted-foreground">Based on reviews</p>
                    </CardContent>
                </Card>
            </div>

            {/* ACTIVE PROJECTS + MESSAGES */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Active Projects - 2 cols */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Active Projects</h2>
                        <Link href="/dashboard/projects/active" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {projects.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No active projects yet</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {projects.map((project: any) => (
                                <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-sm line-clamp-1">{project.title}</h3>
                                            <p className="text-xs text-muted-foreground">{project.client?.username || 'Client'}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge
                                                variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                className={
                                                    project.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                                        project.status === 'IN_REVIEW' || project.status.includes('REVISION') ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                            ''
                                                }
                                            >
                                                {project.status === 'ACTIVE' ? 'Active' :
                                                    project.status === 'IN_REVIEW' ? 'In Review' :
                                                        project.status.replace("_", " ")}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                                            </span>
                                        </div>

                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Messages - 1 col */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base font-semibold">Messages</CardTitle>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{allConversations.length}</span>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {allConversations.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                        ) : (
                            allConversations.map((conv: any) => (
                                <div key={conv.id} className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                                        {conv.otherUser?.username?.slice(0, 2).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-sm truncate">{conv.otherUser?.username || 'User'}</p>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {conv.messages[0]?.text || 'No messages'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <Link
                            href="/dashboard/messages"
                            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground pt-2"
                        >
                            View All Messages <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* RECENT ACTIVITY + QUICK ACTIONS */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity - 2 cols */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>

                    </CardHeader>
                    <CardContent className="space-y-5">
                        {activityItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                        ) : (
                            activityItems.map((item: any, i: number) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.type === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                        item.type === 'payment' ? 'bg-blue-100 text-blue-600' :
                                            item.type === 'revision' ? 'bg-amber-100 text-amber-600' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {item.type === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                            item.type === 'payment' ? <IndianRupee className="h-4 w-4" /> :
                                                item.type === 'revision' ? <AlertCircle className="h-4 w-4" /> :
                                                    <Rocket className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{item.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions - 1 col */}
                <Card className="bg-slate-900 text-white border-none">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                        <CardDescription className="text-slate-400">
                            Speed up your workflow with these shortcuts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link
                            href="/dashboard/proposals/sent"
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Send className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">My Proposals</p>
                                <p className="text-xs text-slate-400">Track sent applications</p>
                            </div>
                        </Link>
                        <Link
                            href="/jobs"
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <Search className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Browse Jobs</p>
                                <p className="text-xs text-slate-400">Find new opportunities</p>
                            </div>
                        </Link>
                        <Link
                            href="/dashboard/messages"
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Invite Client</p>
                                <p className="text-xs text-slate-400">Add a new client to workspace</p>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

// =========================================================
// 2. BUYER DASHBOARD
// =========================================================
async function BuyerView({ userId }: { userId: string }) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            ordersBought: { include: { service: true, product: true, seller: true, buyer: true }, orderBy: { createdAt: 'desc' } },
            clientProjects: {
                include: { freelancer: true },
                orderBy: { updatedAt: 'desc' },
                take: 4
            },
            conversationsA: {
                include: {
                    userB: true,
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { updatedAt: 'desc' },
                take: 4
            },
            conversationsB: {
                include: {
                    userA: true,
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { updatedAt: 'desc' },
                take: 4
            },
            notifications: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    })

    if (!user) return null

    // CALCULATE STATS
    const totalSpent = user.ordersBought.reduce((acc: number, order: any) => acc + order.price, 0)
    const activeOrders = user.ordersBought.filter((o: any) => o.status === "PENDING" || o.status === "IN_PROGRESS").length
    const totalOrders = user.ordersBought.length

    // Combine and sort conversations
    const allConversations = [
        ...user.conversationsA.map((c: any) => ({ ...c, otherUser: c.userB })),
        ...user.conversationsB.map((c: any) => ({ ...c, otherUser: c.userA }))
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4)

    // Combine projects and pending orders for the "Active Projects" section
    const pendingOrdersList = user.ordersBought
        .filter((o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED" && !o.product)
        .map((o: any) => ({
            id: o.id,
            title: o.service?.title || o.product?.name || ("Order #" + o.id.toString().slice(0, 8)),
            freelancer: o.seller,
            status: o.status === 'PENDING' ? 'ACTIVE' : o.status.replace("_", " "),
            progress: 0,
            deadline: o.deadline,
            updatedAt: o.createdAt
        }))

    const projects = [
        ...(user.clientProjects || []),
        ...pendingOrdersList
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4)

    // Build activity from orders and notifications
    const activityItems = [
        ...user.ordersBought.slice(0, 5).map((order: any) => ({
            type: order.status === 'COMPLETED' ? 'completed' : order.status === 'PENDING' ? 'started' : 'payment',
            title: order.status === 'COMPLETED' ? 'Project completed' : order.status === 'PENDING' ? 'New project started' : 'Payment sent',
            description: order.status === 'COMPLETED'
                ? `${order.service?.title || order.product?.name || 'Item'} has been delivered by ${order.seller.username}`
                : `${order.service?.title || order.product?.name || 'Item'} with ${order.seller.username}`,
            time: order.createdAt
        })),
        ...user.notifications.slice(0, 2).map((n: any) => ({
            type: 'notification',
            title: 'New activity',
            description: n.text,
            time: n.createdAt
        }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4)

    return (
        <>
            {/* STATS ROW */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><Price amount={totalSpent} /></div>
                        <p className="text-xs text-muted-foreground">Lifetime investment</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeOrders}</div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Services purchased</p>
                    </CardContent>
                </Card>
            </div>

            {/* ACTIVE PROJECTS + MESSAGES */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Active Projects - 2 cols */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Active Projects</h2>
                        <Link href="/dashboard/projects/active" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {projects.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-4">No active projects yet</p>
                            <Button asChild variant="outline">
                                <Link href="/">Find Talent</Link>
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {projects.map((project: any) => (
                                <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-sm line-clamp-1">{project.title}</h3>
                                            <p className="text-xs text-muted-foreground">{project.freelancer?.username || 'Freelancer'}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge
                                                variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                className={
                                                    project.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                                        project.status === 'IN_REVIEW' || project.status.includes('REVISION') ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                            ''
                                                }
                                            >
                                                {project.status === 'ACTIVE' ? 'Active' :
                                                    project.status === 'IN_REVIEW' ? 'In Review' :
                                                        project.status.replace("_", " ")}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                                            </span>
                                        </div>

                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Messages - 1 col */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base font-semibold">Messages</CardTitle>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{allConversations.length}</span>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {allConversations.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                        ) : (
                            allConversations.map((conv: any) => (
                                <div key={conv.id} className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                                        {conv.otherUser?.username?.slice(0, 2).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-sm truncate">{conv.otherUser?.username || 'User'}</p>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {conv.messages[0]?.text || 'No messages'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <Link
                            href="/dashboard/messages"
                            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground pt-2"
                        >
                            View All Messages <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* RECENT ACTIVITY + QUICK ACTIONS */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity - 2 cols */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>

                    </CardHeader>
                    <CardContent className="space-y-5">
                        {activityItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                        ) : (
                            activityItems.map((item: any, i: number) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.type === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                        item.type === 'payment' ? 'bg-blue-100 text-blue-600' :
                                            item.type === 'started' ? 'bg-blue-100 text-blue-600' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {item.type === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                            item.type === 'payment' ? <IndianRupee className="h-4 w-4" /> :
                                                item.type === 'started' ? <Rocket className="h-4 w-4" /> :
                                                    <Activity className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{item.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions - 1 col */}
                <Card className="bg-slate-900 text-white border-none">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                        <CardDescription className="text-slate-400">
                            Speed up your workflow with these shortcuts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link
                            href="/jobs/new"
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Plus className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Post a Job</p>
                                <p className="text-xs text-slate-400">Find the right talent for your project</p>
                            </div>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <Search className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Browse Services</p>
                                <p className="text-xs text-slate-400">Explore marketplace offerings</p>
                            </div>
                        </Link>
                        <Link
                            href="/dashboard/messages"
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Messages</p>
                                <p className="text-xs text-slate-400">Chat with freelancers</p>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
