import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow, differenceInDays, addDays } from "date-fns"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Search,
    Filter,
    Plus,
    Clock,

    User,
    MoreHorizontal,
    ArrowUpRight,
    Package
} from "lucide-react"
import { StatPrice } from "@/components/DashboardPrice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const dynamic = 'force-dynamic'

export default async function ActiveProjectsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // 1. Fetch ACTIVE PROJECTS (New Model)
    const projects = await db.project.findMany({
        where: {
            OR: [
                { freelancerId: userId },
                { clientId: userId }
            ],
            status: { in: ['ACTIVE', 'IN_REVIEW'] },
            orderId: null,
            NOT: { status: 'DISPUTED' }
        },
        include: {
            client: true,
            freelancer: true,
            milestones: true
        },
        orderBy: { updatedAt: 'desc' }
    })

    // 2. Fetch PENDING ORDERS (Gig Model & Job Orders) - Treat as Active Projects
    const orders = await db.order.findMany({
        where: {
            OR: [
                { sellerId: userId },
                { buyerId: userId }
            ],
            status: { notIn: ['COMPLETED', 'CANCELLED', 'DISPUTED'] },
            productId: null // Explicitly exclude product orders
        },
        include: {
            service: true,
            buyer: true,
            seller: true,
            project: true
        },
        orderBy: { createdAt: 'desc' }
    })

    // 3. Transform and Merge
    const mappedProjects = projects.map(p => ({
        id: p.id,
        title: p.title,
        otherParty: p.freelancerId === userId ? p.client : p.freelancer,
        role: p.freelancerId === userId ? 'freelancer' : 'client',
        budget: p.budget,
        deadline: p.deadline,
        progress: p.progress,
        daysLeft: p.deadline ? differenceInDays(p.deadline, new Date()) : null,
        status: p.status === 'IN_REVIEW' ? 'IN_REVIEW' : 'ACTIVE',
        type: 'PROJECT',
        orderId: p.orderId
    }))

    const mappedOrders = orders.map((o: any) => {
        const isSeller = o.sellerId === userId
        const deadline = o.deadline

        return {
            id: o.id,
            title: o.service?.title || o.project?.title || ("Project Order #" + o.id.toString().slice(0, 8)),
            otherParty: isSeller ? o.buyer : o.seller,
            role: isSeller ? 'freelancer' : 'client',
            budget: o.price,
            deadline: deadline,
            progress: o.project?.progress || 0,
            daysLeft: deadline ? differenceInDays(deadline, new Date()) : null,
            status: o.status === 'PENDING' ? 'ACTIVE' : o.status === 'IN_PROGRESS' ? 'ACTIVE' : o.status,
            type: 'ORDER',
            isJobOrder: !!o.project && !o.serviceId
        }
    })

    const activeProjects = [...mappedProjects, ...mappedOrders].sort((a, b) => {
        const aDays = a.daysLeft ?? 999
        const bDays = b.daysLeft ?? 999
        return aDays - bDays
    })

    const totalValue = activeProjects.reduce((sum, p) => sum + p.budget, 0)
    const avgProgress = activeProjects.length > 0
        ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
        : 0
    const dueThisWeek = activeProjects.filter(p => p.daysLeft !== null && p.daysLeft <= 7 && p.daysLeft >= 0).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Active Projects</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your ongoing projects and track progress
                    </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search projects..." className="pl-9" />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Active</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{activeProjects.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Value</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">
                            <StatPrice amount={totalValue} />
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Avg. Progress</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{avgProgress}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Due This Week</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{dueThisWeek}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Projects Grid */}
            {activeProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">No Active Projects</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            Start by creating a service or applying to jobs
                        </p>
                        <Link href="/dashboard/jobs">
                            <Button className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Browse Jobs
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function ProjectCard({ project }: {
    project: {
        id: string
        title: string
        otherParty: { username: string; avatarUrl?: string | null }
        role: string
        budget: number
        deadline: Date | null
        progress: number
        daysLeft: number | null
        status: string
        type: string
        isJobOrder?: boolean
    }
}) {
    const getLink = () => {
        if (project.type === 'ORDER') {
            return project.isJobOrder ? `/job-order/${project.id}` : `/service-order/${project.id}`
        }
        return `/dashboard/projects/active/${project.id}`
    }

    return (
        <Card className="hover:shadow-md transition-shadow group">
            <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                            {project.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-6 w-6 border border-border rounded-sm">
                                <AvatarImage src={project.otherParty.avatarUrl || ""} alt={project.otherParty.username} />
                                <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                                    {project.otherParty.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                                {project.otherParty.username}
                                <span className="text-xs ml-1 opacity-70">({project.role})</span>
                            </span>
                        </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            <StatPrice amount={project.budget} />
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {project.daysLeft !== null
                                ? project.daysLeft > 0
                                    ? `${project.daysLeft} days left`
                                    : project.daysLeft === 0
                                        ? 'Due today'
                                        : 'Overdue'
                                : 'No deadline'}
                        </span>
                    </div>
                </div>



                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Badge variant={project.status === 'IN_REVIEW' || project.status.includes('REVISION') ? 'secondary' : 'default'}>
                        {project.status === 'IN_REVIEW' ? 'In Review'
                            : project.status === 'REVISION_REQUESTED' ? 'Revision Requested'
                                : project.status === 'IN_REVISION' ? 'Revising'
                                    : project.status === 'REVISION_DENIED' ? 'Revision Denied'
                                        : 'Active'}
                    </Badge>
                    <Link href={getLink()}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            View Details
                            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
