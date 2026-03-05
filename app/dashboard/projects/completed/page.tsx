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
    CheckCircle2,

    User,
    Star,
    Calendar,
    ArrowUpRight,
    Download,
    Package
} from "lucide-react"
import { StatPrice } from "@/components/DashboardPrice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const dynamic = 'force-dynamic'

export default async function CompletedProjectsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch completed projects
    const projects = await db.project.findMany({
        where: {
            OR: [
                { freelancerId: userId },
                { clientId: userId }
            ],
            status: 'COMPLETED'
        },
        include: {
            client: true,
            freelancer: true,
        },
        orderBy: { updatedAt: 'desc' }
    })

    // Also get completed orders with reviews as "completed projects"
    const completedOrders = await db.order.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { sellerId: userId },
                        { buyerId: userId }
                    ]
                },
                {
                    OR: [
                        { status: 'COMPLETED' },
                        { status: 'PAID' } // Include PAID status for product orders
                    ]
                }
            ]
        },
        include: {
            service: {
                include: {
                    seller: true
                }
            },
            product: {
                include: {
                    seller: true
                }
            },
            buyer: true,
            seller: true,
            review: true,
            project: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    })

    // Combine both sources
    const completedProjects = [
        ...projects.map(p => ({
            id: p.id,
            title: p.title,
            otherParty: p.freelancerId === userId ? p.client : p.freelancer,
            budget: p.budget,
            completedDate: p.updatedAt,
            rating: null as number | null,
            review: null as string | null,
            type: 'project' as const
        })),
        ...completedOrders.map((o: any) => ({
            id: o.id,
            title: o.service ? o.service.title : o.product ? o.product.name : o.project ? o.project.title : 'Unknown Order',
            otherParty: o.sellerId === userId ? o.buyer : o.seller,
            budget: o.price,
            completedDate: o.createdAt,
            rating: o.review?.rating || null,
            review: o.review?.comment || null,
            type: 'order' as const,
            deliveryUrl: o.deliveryUrl,
            orderType: o.service ? 'service' : o.product ? 'product' : o.project ? 'job' : 'unknown'
        }))
    ].sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime())

    const totalEarnings = completedProjects.reduce((sum, p) => sum + p.budget, 0)
    const projectsWithRating = completedProjects.filter(p => p.rating !== null)
    const avgRating = projectsWithRating.length > 0
        ? projectsWithRating.reduce((sum, p) => sum + (p.rating || 0), 0) / projectsWithRating.length
        : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Completed Projects</h1>
                <p className="text-muted-foreground mt-1">
                    View your successfully delivered projects
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search completed projects..." className="pl-9" />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Completed</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{completedProjects.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Earned</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">
                            <StatPrice amount={totalEarnings} />
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-1">
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Average Rating</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xl sm:text-2xl font-bold">
                                {avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
                            </p>
                            {avgRating > 0 && <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-yellow-400" />}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Projects Grid */}
            {completedProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {completedProjects.map((project) => (
                        <CompletedProjectCard key={project.id} project={project as any} />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">No Completed Projects Yet</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            Complete your first project to see it here
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function CompletedProjectCard({ project }: {
    project: {
        id: string
        title: string
        otherParty: { username: string; avatarUrl?: string | null }
        budget: number
        completedDate: Date
        rating: number | null
        review: string | null
        type: 'project' | 'order'
        deliveryUrl?: string
        orderType?: 'service' | 'product' | 'job' | 'unknown'
    }
}) {
    const getDetailsLink = () => {
        if (project.type === 'order') {
            if (project.orderType === 'service') {
                return `/service-order/${project.id}`
            } else if (project.orderType === 'product') {
                return `/product-order/${project.id}`
            } else if (project.orderType === 'job') {
                return `/job-order/${project.id}`
            }
        }
        return '#'
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-foreground">{project.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-6 w-6 border border-border rounded-sm">
                                <AvatarImage src={project.otherParty.avatarUrl || ""} alt={project.otherParty.username} />
                                <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                                    {project.otherParty.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{project.otherParty.username}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                        </Badge>
                        {project.type === 'order' && project.orderType && (
                            <Badge variant="secondary" className="text-xs">
                                {project.orderType === 'service' ? 'Service' : project.orderType === 'product' ? 'Product' : 'Order'}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            <StatPrice amount={project.budget} />
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {format(project.completedDate, 'MMM dd, yyyy')}
                        </span>
                    </div>
                </div>

                {/* Rating */}
                {project.rating !== null && (
                    <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`h-4 w-4 ${i < project.rating! ? "text-yellow-400 fill-yellow-400" : "text-muted"}`}
                            />
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">({project.rating}/5)</span>
                    </div>
                )}

                {/* Review */}
                {project.review && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3 line-clamp-2">
                        "{project.review}"
                    </p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    {project.deliveryUrl ? (
                        <Link href={project.deliveryUrl} target="_blank" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Files
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="outline" size="sm" className="flex-1 opacity-50 cursor-not-allowed" disabled>
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Files
                        </Button>
                    )}

                    <Link href={getDetailsLink()} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full text-blue-600">
                            Details
                            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
