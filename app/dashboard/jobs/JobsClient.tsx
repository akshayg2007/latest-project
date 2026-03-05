"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Search,
    Filter,
    Briefcase,
    Clock,
    Users,
    Plus,
    Tag,
    SlidersHorizontal,
    Share2,
    FileText,
    ExternalLink,
    Edit,
    Trash2,
    Eye,
    AlertCircle
} from "lucide-react"
import { Price } from "@/components/Price"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { deleteJob } from "@/app/actions/createJob"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Job {
    id: string
    title: string
    company: string
    avatarUrl?: string | null
    description: string
    budget: number
    budgetType: string
    skills: string[]
    deadline?: string | null
    applicants: number
    posted: string
    hasApplied: boolean
    category: string
    status: string
    experienceLevel?: string | null
    createdAt: number
}

interface JobsClientProps {
    initialJobs: Job[]
    totalJobs: number
    activeJobs: number
    totalApplicants: number
    hiredJobs: number
}

type FilterStatus = 'ALL' | 'OPEN' | 'IN_REVIEW' | 'HIRED' | 'SUBMITTED' | 'CLOSED' | 'COMPLETED'
type SortDate = 'RECENT' | 'OLD'

export function JobsClient({ initialJobs, totalJobs, activeJobs, totalApplicants, hiredJobs }: JobsClientProps) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs)
    const router = useRouter()
    // state removed
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
    const [dateSort, setDateSort] = useState<SortDate>('RECENT')
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const handleDelete = async (jobId: string) => {
        setIsDeleting(jobId)
        try {
            const res = await deleteJob(jobId)
            if (res.success) {
                toast.success("Job removed successfully")
                setJobs(prev => prev.filter(j => j.id !== jobId))
            } else {
                toast.error(res.error || "Failed to remove job")
            }
        } catch (error) {
            toast.error("An error occurred while removing the job")
        } finally {
            setIsDeleting(null)
            setConfirmDeleteId(null)
        }
    }

    // Filter and Sort Logic
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase())

        let matchesStatus = true
        if (statusFilter !== 'ALL') {
            // Map UI filter status to DB status if needed, or assume mostly 1:1
            // DB Statuses: OPEN, IN_PROGRESS, COMPLETED, CANCELLED
            // UI Request: Open, In Review, Hired, Closed
            if (statusFilter === 'OPEN') matchesStatus = job.status === 'OPEN'
            if (statusFilter === 'IN_REVIEW') matchesStatus = job.status === 'IN_PROGRESS' // Assuming In Progress maps to 'In Review' conceptually or strictly
            if (statusFilter === 'HIRED') matchesStatus = job.status === 'COMPLETED' // Hired often implies filled/completed
            if (statusFilter === 'CLOSED') matchesStatus = job.status === 'CANCELLED'
        }

        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        if (dateSort === 'RECENT') {
            return b.createdAt - a.createdAt
        } else {
            return a.createdAt - b.createdAt
        }
    })

    const displayJobs = filteredJobs

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN':
                return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Open</Badge>
            case 'IN_PROGRESS':
                return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Accepted</Badge>
            case 'COMPLETED':
                return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Completed</Badge>
            case 'CANCELLED':
                return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Closed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">My Jobs</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage jobs you've posted and track applications
                    </p>
                </div>
                <Link href="/jobs/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Post New Job
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Jobs</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{jobs.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Active Jobs</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">
                            {jobs.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Applicants</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">
                            {jobs.reduce((sum, j) => sum + j.applicants, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Hired Jobs</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">
                            {jobs.filter(j => j.status === 'COMPLETED').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search jobs..."
                            className="pl-9 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        className={cn("shrink-0", showFilters && "bg-accent text-accent-foreground")}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <Card className="absolute top-full left-0 right-0 mt-2 z-10 shadow-lg animate-in fade-in slide-in-from-top-2">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Job Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: 'All', value: 'ALL' },
                                            { label: 'Open', value: 'OPEN' },
                                            { label: 'Accepted', value: 'IN_REVIEW' },
                                            { label: 'Completed', value: 'HIRED' },
                                            { label: 'Closed', value: 'CLOSED' }
                                        ].map((status) => (
                                            <Badge
                                                key={status.value}
                                                variant={statusFilter === status.value ? "default" : "outline"}
                                                className="cursor-pointer"
                                                onClick={() => setStatusFilter(status.value as FilterStatus)}
                                            >
                                                {status.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date Posted</label>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            variant={dateSort === 'RECENT' ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => setDateSort('RECENT')}
                                        >
                                            Recent
                                        </Badge>
                                        <Badge
                                            variant={dateSort === 'OLD' ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => setDateSort('OLD')}
                                        >
                                            Oldest
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Jobs Grid */}
            {displayJobs.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayJobs.map((job) => (
                        <Card
                            key={job.id}
                            className="hover:shadow-md transition-all flex flex-col h-full overflow-hidden cursor-pointer active:scale-[0.98]"
                            onClick={() => router.push(`/dashboard/explore/jobs/${job.id}`)}
                        >
                            <CardContent className="p-5 flex flex-col h-full">
                                {/* Header: User Info & Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-border">
                                            <AvatarImage src={job.avatarUrl || ""} alt={job.company} className="rounded-full" />
                                            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                                                {job.company.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground leading-none">{job.company}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(job.status)}
                                </div>

                                {/* Timer */}
                                <div className="mb-2">
                                    <p className="text-xs text-muted-foreground font-medium">{job.posted}</p>
                                </div>

                                {/* Job Title */}
                                <h3 className="text-lg font-bold text-foreground mb-4 line-clamp-1">{job.title}</h3>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
                                    {job.description}
                                </p>

                                {/* Budget & Experience */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                            <Tag className="w-4.5 h-4.5 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <div className="text-[15px] font-bold text-foreground leading-none truncate">
                                                <Price amount={job.budget} />
                                            </div>
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50 truncate">
                                                {job.budgetType === 'HOURLY' ? 'Hourly' : 'Fixed'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                            <SlidersHorizontal className="w-4.5 h-4.5 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="text-[15px] font-bold text-foreground leading-none capitalize truncate">
                                                {job.experienceLevel || 'Mixed'}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50 truncate">
                                                Experience
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-auto flex flex-col gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                                    <Link href={`/dashboard/proposals/received/${job.id}`} className="w-full">
                                        <Button
                                            size="sm"
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Users className="h-3.5 w-3.5 mr-2" />
                                            Review Job Applicants
                                        </Button>
                                    </Link>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Link href={`/jobs/create?editId=${job.id}`} className="w-full">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Edit className="h-3.5 w-3.5 mr-2" />
                                                Edit
                                            </Button>
                                        </Link>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => setConfirmDeleteId(job.id)}
                                            disabled={isDeleting === job.id}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                            {isDeleting === job.id ? "Removing..." : "Remove"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">No Jobs Found</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            {searchQuery || statusFilter !== 'ALL'
                                ? "Try adjusting your filters to find what you're looking for."
                                : "Start by posting your first job to find talented freelancers."}
                        </p>
                        {!searchQuery && statusFilter === 'ALL' && (
                            <Link href="/jobs/create">
                                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Post Your First Job
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Create Job Modal */}
            {/* Modal removed */}

            {/* Confirmation Modal */}
            <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-white rounded-3xl">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <DialogHeader className="text-center sm:text-left space-y-2">
                            <DialogTitle className="text-xl font-bold text-slate-900">Remove Job?</DialogTitle>
                            <DialogDescription className="text-slate-500 text-sm leading-relaxed">
                                Are you sure you want to remove this job? This action cannot be undone and will hide it from active listings.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 p-4 pt-0 bg-slate-50/50">
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                            className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                            disabled={isDeleting !== null}
                        >
                            {isDeleting ? "Removing..." : "Remove Job"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
