import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Price } from "@/components/Price"
import {
    Clock,
    ShieldCheck,
    MessageSquare,
    ArrowLeft,
    Calendar,
    CheckCircle,
    CheckCircle2,
    Briefcase,
    Tag,
    FileText,
    Users,
    Zap,
    Building2,
    ArrowRight,
    Star,
    MapPin,
    Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ShareButton } from "@/components/ShareButton"
import { startConversation } from "@/app/actions/chat"
import { ApplyJobDialog } from "./ApplyJobDialog"
import { LikeButton } from "@/components/LikeButton"
import { FollowButton } from "@/components/FollowButton"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function JobDetailsPage({ params }: PageProps) {
    const session = await auth();
    const { id: jobId } = await params;

    const job = await db.job.findUnique({
        where: { id: jobId },
        include: {
            client: {
                select: {
                    username: true,
                    avatarUrl: true,
                    id: true,
                    bio: true,
                    createdAt: true,
                    clientProfile: { select: { location: true } },
                    _count: { select: { postedJobs: true, followedBy: true } }
                }
            },
            _count: { select: { applications: true, likes: true } },
            likes: session?.user?.id ? { where: { userId: session.user.id } } : false
        }
    }) as (any & {
        objective: string | null;
        deliverables: string[];
        tasksIncluded: string[];
        paymentStructure: string | null;
        advancePercentage: number | null;
        paymentTimeline: string | null;
        hourlyRateMin: number | null;
        hourlyRateMax: number | null;
        maxHoursPerWeek: number | null;
        estimatedTotalHours: number | null;
        paymentFrequency: string | null;
        hourApprovalMethod: string | null;
        expectedStartDate: Date | null;
        urgencyLevel: string | null;
        proposedMilestones: any;
        paymentMethods: string[];
        experienceLevel: string | null;
    }) | null;

    if (!job) return notFound()

    const paymentMethodsData = job.paymentMethods && job.paymentMethods.length > 0
        ? await db.paymentMethod.findMany({
            where: { id: { in: job.paymentMethods } },
            select: { type: true, bankName: true, walletProvider: true }
        })
        : [];

    const paymentMethodNames = paymentMethodsData.map(pm => {
        const type = pm.type.toUpperCase();
        if (type === 'BANK') return pm.bankName || 'Bank';
        if (type === 'WALLET') return pm.walletProvider || 'Wallet';
        return pm.type;
    });

    const isOwner = session?.user?.id === job.clientId;
    const isLiked = Array.isArray(job.likes) && job.likes.length > 0;

    const isFollowingClient = session?.user?.id && !isOwner ? !!(await db.follows.findUnique({
        where: {
            followerId_followingId: {
                followerId: session.user.id,
                followingId: job.clientId
            }
        }
    })) : false;

    const existingApplication = session?.user?.id ? await db.jobApplication.findFirst({
        where: {
            jobId,
            freelancerId: session.user.id,
            status: {
                notIn: ['REJECTED', 'WITHDRAWN']
            }
        },
        select: { id: true }
    }) : null

    const hasApplied = !!existingApplication

    if (job.isRemoved) {
        const currentUser = session?.user?.id ? await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        }) : null;

        const isAdmin = currentUser?.role === "ADMIN"
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Briefcase className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Job Removed</h1>
                <p className="text-slate-500 max-w-md mb-8">
                    This job "{job.title}" has been removed by platform administrators and is no longer available.
                </p>
                {job.removalReason && (
                    <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm max-w-md mb-8 text-left">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Reason for removal</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{job.removalReason}</p>
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
        <div className="min-h-screen bg-transparent">
            {/* Header / Nav */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-14 lg:top-[60px] z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/dashboard/explore"
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Explore
                        </Link>

                        <div className="flex items-center gap-2">
                            <LikeButton
                                itemId={job.id}
                                itemType="JOB"
                                initialLiked={isLiked}
                                initialCount={job._count.likes}
                                variant="outline"
                            />
                            <ShareButton title={job.title} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT COLUMN - Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Header Metadata Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <Link href={`/dashboard/user/${job.client.username}`}>
                                    <Avatar className="h-12 w-12 rounded-full transition-transform hover:scale-105 shadow-sm">
                                        <AvatarImage src={job.client.avatarUrl || ""} />
                                        <AvatarFallback className="bg-slate-100 text-xl font-black">
                                            {job.client.username?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex flex-col gap-0.5">
                                    <Link href={`/dashboard/user/${job.client.username}`}>
                                        <p className="text-xl font-bold text-slate-900 hover:text-primary transition-colors leading-tight">{job.client.username}</p>
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1.5 grayscale opacity-70">
                                            <MapPin className="w-4 h-4" />
                                            {(job.client as any).clientProfile?.location || "Mumbai, India"}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="flex items-center gap-1.5 grayscale opacity-70">
                                            <Clock className="w-4 h-4" />
                                            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }).replace('about ', '')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="opacity-60" />

                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-[2.5rem] font-bold text-slate-900 leading-[1.15] tracking-tight">
                                    {job.title}
                                </h1>
                                <p className="text-base font-bold text-slate-500 uppercase tracking-widest">{job.category}</p>
                            </div>
                        </div>

                        {/* 2. Project Scope Section */}
                        <div className="space-y-8">
                            <div className="space-y-5">
                                <h2 className="text-2xl font-bold text-slate-900">Project Objective</h2>
                                <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                    {job.objective}
                                </p>
                            </div>

                            {job.deliverables && job.deliverables.length > 0 && (
                                <div className="space-y-5">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        Key Deliverables
                                    </h3>
                                    <div className="space-y-1">
                                        {job.deliverables.map((d: string, i: number) => (
                                            <div key={i} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                                                <span className="text-sm font-bold text-slate-400 mt-0.5">{i + 1}.</span>
                                                <p className="text-base text-slate-700 font-bold leading-tight">{d}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {job.tasksIncluded && job.tasksIncluded.length > 0 && (
                                <div className="space-y-5">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-500" />
                                        Tasks Included
                                    </h3>
                                    <ul className="space-y-2.5">
                                        {job.tasksIncluded.map((t: string, i: number) => (
                                            <li key={i} className="flex items-center gap-3 text-base text-slate-700 font-bold">
                                                <Check className="w-4 h-4 text-amber-500 shrink-0" />
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {job.description && (
                                <div className="space-y-5">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        Additional Details
                                    </h3>
                                    <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                        {job.description}
                                    </p>
                                </div>
                            )}

                            {/* 3. Timeline & Meta Grid */}
                            <div className="space-y-8 pt-6 border-t border-slate-100">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-rose-500" />
                                        Project Timeline
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Start Date</span>
                                            <span className="text-lg font-black text-slate-800">
                                                {job.expectedStartDate ? new Date(job.expectedStartDate).toLocaleDateString() : "Flexible"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Deadline</span>
                                            <span className="text-lg font-black text-slate-800">
                                                {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Not set"}
                                            </span>
                                        </div>
                                    </div>
                                    {job.deadlineFlexible && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                                            <Check className="w-3 h-3" />
                                            DEADLINE IS FLEXIBLE
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Priority Status */}
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-amber-500" />
                                                Priority Status
                                            </h3>
                                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start gap-3">
                                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Urgency Level</span>
                                                <Badge className={cn(
                                                    "px-6 py-2 rounded-full font-black text-base transition-all",
                                                    job.urgencyLevel === 'Critical' ? "bg-rose-500 hover:bg-rose-600" :
                                                        job.urgencyLevel === 'High' ? "bg-amber-500 hover:bg-amber-600" :
                                                            job.urgencyLevel === 'Medium' ? "bg-indigo-500 hover:bg-indigo-600" :
                                                                "bg-emerald-500 hover:bg-emerald-600"
                                                )}>
                                                    {job.urgencyLevel || "Normal"}
                                                </Badge>
                                            </div>
                                        </div>

                                        {job.experienceLevel && (
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                    <Briefcase className="w-5 h-5 text-indigo-500" />
                                                    Experience Level
                                                </h3>
                                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start gap-3">
                                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Level Required</span>
                                                    <Badge className="px-6 py-2 rounded-full font-black text-base bg-indigo-500 hover:bg-indigo-600">
                                                        {job.experienceLevel}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <Tag className="w-5 h-5 text-indigo-500" />
                                            Required Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {job.skills.map((skill: string, idx: number) => (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-base font-bold border border-transparent hover:border-slate-200 transition-all cursor-default"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Methods Section */}
                                    {paymentMethodNames.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-amber-500" />
                                                Supported Payment Methods
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {paymentMethodNames.map((name: string, idx: number) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                        className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-base font-bold border border-emerald-100 transition-all cursor-default"
                                                    >
                                                        {name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 5. About the Client Card Redesigned */}
                        <div className="p-8 rounded-[32px] bg-card border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-5">
                                    <Link href={`/dashboard/user/${job.client.username}`}>
                                        <Avatar className="h-16 w-16 rounded-full ring-4 ring-slate-50 ring-offset-0 transition-transform group-hover:scale-105 duration-300">
                                            <AvatarImage src={job.client.avatarUrl || ""} />
                                            <AvatarFallback className="bg-slate-100 text-slate-900 font-black text-xl">
                                                {job.client.username?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="space-y-2">
                                        <Link href={`/dashboard/user/${job.client.username}`} className="hover:opacity-80 transition-opacity">
                                            <h4 className="text-xl font-bold text-slate-900 leading-none">
                                                {job.client.username}
                                            </h4>
                                        </Link>
                                        <p className="text-sm font-semibold text-slate-400 capitalize">
                                            {job.client._count.followedBy} followers
                                        </p>
                                    </div>
                                </div>
                                {!isOwner && session?.user?.id && (
                                    <FollowButton
                                        targetUserId={job.clientId}
                                        initialIsFollowing={isFollowingClient}
                                    />
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-6 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Total Jobs</p>
                                        <p className="text-lg font-bold text-slate-900">{job.client._count.postedJobs} Posted</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Member Since</p>
                                        <p className="text-lg font-bold text-slate-900">{new Date(job.client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                {job.client.bio && (
                                    <p className="text-base text-slate-600 font-medium leading-relaxed">
                                        {job.client.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Sticky Application Card */}
                    <div className="relative">
                        <div className="sticky top-[120px]">
                            <Card className="shadow-xl border overflow-hidden py-0">
                                <CardContent className="p-0">

                                    {/* Price Header - Match Gig Header but with overflow fix */}
                                    <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Project Budget</p>
                                            <div className="overflow-hidden">
                                                {job.budgetType === 'HOURLY' ? (
                                                    <div className="flex flex-col gap-0">
                                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                            <Price amount={job.minBudget || 0} size="xl" className="font-bold text-foreground" />
                                                            <span className="text-muted-foreground font-semibold text-xs lowercase">to</span>
                                                            <Price amount={job.maxBudget || 0} size="xl" className="font-bold text-foreground" />
                                                        </div>
                                                        <p className="text-xs font-bold text-muted-foreground mt-1">per hour</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <Price amount={job.maxBudget || job.budget || 0} size="2xl" className="font-bold text-foreground" />
                                                        <p className="text-xs font-bold text-muted-foreground mt-1">Fixed Price</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="space-y-5">
                                            {/* Payment Details */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        Structure
                                                    </span>
                                                    <span className="font-black text-slate-900 text-sm uppercase tracking-wider">
                                                    </span>
                                                </div>


                                                {job.paymentStructure === 'ADVANCE_FINAL' && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                            <Zap className="w-3.5 h-3.5" />
                                                            Advance
                                                        </span>
                                                        <span className="font-black text-slate-900">
                                                            {job.advancePercentage}%
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        Post Date
                                                    </span>
                                                    <span className="font-black text-slate-900">
                                                        {new Date(job.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {job.budgetType === 'HOURLY' && (
                                                    <>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                Weekly Limit
                                                            </span>
                                                            <span className="font-black text-slate-900">
                                                                {job.maxHoursPerWeek} hrs
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                                <Building2 className="w-3.5 h-3.5" />
                                                                Total Est.
                                                            </span>
                                                            <span className="font-black text-slate-900">
                                                                {job.estimatedTotalHours} hrs
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                Frequency
                                                            </span>
                                                            <span className="font-black text-slate-900 text-sm uppercase tracking-wider">
                                                                {job.paymentFrequency}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Approval
                                                            </span>
                                                            <span className="font-black text-slate-900 text-sm uppercase tracking-wider">
                                                                {job.hourApprovalMethod === 'MANUAL' ? 'Manual' : 'Automatic'}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Milestones Preview */}
                                            {job.paymentStructure === 'MILESTONE' && job.proposedMilestones && (
                                                <div className="pt-4 border-t border-slate-50 space-y-3">
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Milestones</p>
                                                    <div className="space-y-2">
                                                        {(job.proposedMilestones as any[]).map((m, i) => (
                                                            <div key={i} className="flex justify-between items-center text-sm">
                                                                <span className="font-bold text-slate-600 truncate mr-4">{m.name}</span>
                                                                <span className="font-black text-slate-900 shrink-0">{m.percentage}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Separator className="opacity-40" />

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            {isOwner ? (
                                                <Button
                                                    className="w-full h-12 text-sm font-black rounded-2xl bg-slate-100 text-slate-400 border-none shadow-none"
                                                    variant="secondary"
                                                    disabled
                                                >
                                                    Own Listing
                                                </Button>
                                            ) : (
                                                <ApplyJobDialog
                                                    jobId={job.id}
                                                    title={job.title}
                                                    budgetType={job.budgetType}
                                                    budget={job.budget}
                                                    minBudget={job.minBudget}
                                                    maxBudget={job.maxBudget}
                                                    hasApplied={hasApplied}
                                                />
                                            )}

                                            {!isOwner && (
                                                <form action={async () => {
                                                    "use server"
                                                    await startConversation(job.client.id)
                                                }}>
                                                    <Button variant="outline" className="w-full h-11 rounded-2xl border-slate-200 font-bold text-slate-600 hover:text-slate-900" type="submit">
                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                        Contact Client
                                                    </Button>
                                                </form>
                                            )}
                                        </div>

                                        {/* Trust Badges */}
                                        <div className="pt-2 space-y-3 text-center">
                                            <div className="flex items-center justify-center gap-2 text-[13px] font-bold text-slate-400">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                <span>Escrow protection included</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 text-[13px] font-bold text-slate-400">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                <span>Secure platform payments</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}