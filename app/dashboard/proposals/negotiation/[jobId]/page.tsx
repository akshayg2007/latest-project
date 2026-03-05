import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Clock, History, AlertCircle, CheckCircle2, MoreHorizontal, MessageSquare, ChevronRight } from "lucide-react"

export default async function JobNegotiationPipeline({ params }: { params: Promise<{ jobId: string }> }) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { jobId } = await params

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { activeProfile: true }
    })

    if (!user) redirect("/")

    const isBuyer = user.activeProfile === 'BUYER'
    const userId = session.user.id

    const job = await db.job.findUnique({
        where: { id: jobId }
    })

    if (!job) return <div>Job not found</div>

    const applications = await db.jobApplication.findMany({
        where: isBuyer ? {
            jobId,
            status: 'SHORTLISTED'
        } : {
            jobId,
            freelancerId: userId,
            status: 'SHORTLISTED'
        },
        include: {
            freelancer: {
                select: { username: true, avatarUrl: true, bio: true }
            }
        }
    })

    const negotiations = await db.negotiation.findMany({
        where: {
            applicationId: { in: applications.map(a => a.id) }
        },
        include: {
            scopeVersions: { orderBy: { versionNumber: 'desc' }, take: 1 },
            executionVersions: { orderBy: { versionNumber: 'desc' }, take: 1 }
        }
    })

    const pipeline = applications.map(app => {
        const negotiation = negotiations.find(n => n.applicationId === app.id)
        const latestScope = negotiation?.scopeVersions[0]
        const latestExec = negotiation?.executionVersions[0]

        return {
            id: app.id,
            freelancer: app.freelancer,
            status: negotiation?.status ?? 'PENDING',
            vScope: latestScope?.versionNumber ?? 0,
            vExec: latestExec?.versionNumber ?? 0,
            lastUpdated: negotiation?.updatedAt ?? app.updatedAt,
            negotiationId: negotiation?.id,
            bid: app.proposedBudget
        }
    })

    return (
        <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/dashboard/proposals/negotiation" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Negotiations
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{job.title}</h1>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-3 py-1 text-[11px] uppercase tracking-wider h-fit">
                                {job.budgetType}
                            </Badge>
                        </div>
                        <p className="text-slate-500 font-medium">Pipeline: {pipeline.length} Shortlisted Candidates</p>
                    </div>
                </div>
            </div>

            {/* Application List */}
            <div className="grid gap-4">
                {pipeline.map((item) => (
                    <Card key={item.id} className="group relative overflow-hidden border-slate-200/60 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                        <CardContent className="p-0">
                            <div className="flex flex-col lg:flex-row">
                                {/* Freelancer Info */}
                                <div className="p-6 lg:w-72 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100">
                                    <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                                        <Avatar className="h-14 w-14 ring-4 ring-white shadow-sm">
                                            <AvatarImage src={item.freelancer.avatarUrl ?? ''} />
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">{item.freelancer.username[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-black text-slate-900 leading-tight">@{item.freelancer.username}</p>
                                            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-600">
                                                ★ New
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Bid</p>
                                                <p className="text-lg font-black text-slate-800 tracking-tight">${item.bid.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Flow Progress */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            {/* Phase 1: Scope */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase 1: Scope</p>
                                                    {item.vScope > 0 && <Badge variant="outline" className="text-[10px] font-bold border-indigo-100 text-indigo-600">v{item.vScope}</Badge>}
                                                </div>
                                                <div className={`h-2 rounded-full ${item.vScope > 0 ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                                            </div>
                                            {/* Phase 2: Execution */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase 2: Execution</p>
                                                    {item.vExec > 0 && <Badge variant="outline" className="text-[10px] font-bold border-emerald-100 text-emerald-600">v{item.vExec}</Badge>}
                                                </div>
                                                <div className={`h-2 rounded-full ${item.vExec > 0 ? 'bg-emerald-600' : 'bg-slate-100'}`} />
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-3 py-1 h-fit uppercase text-[11px] tracking-wider animate-pulse">
                                                {item.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <p className="text-xs font-medium">Updated 2h ago</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                <p className="text-xs font-medium">Open chat</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 text-slate-400 hover:text-slate-900 border-slate-200 hover:bg-slate-50">
                                                <History className="h-4 w-4" />
                                            </Button>
                                            <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 rounded-xl shadow-lg shadow-indigo-200 border-none group/btn" asChild>
                                                <Link href={`/dashboard/proposals/negotiation/${job.id}/${item.id}/scope`}>
                                                    Enter Negotiator
                                                    <ChevronRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {pipeline.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-slate-50 text-slate-300">
                            <History size={40} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">No candidates shortlisted yet</p>
                            <p className="text-slate-500">Candidates will appear here once you shortlist them from the proposals page.</p>
                        </div>
                        <Button variant="outline" className="h-11 px-8 rounded-xl font-bold border-slate-200" asChild>
                            <Link href={`/dashboard/proposals/${job.id}`}>View All Proposals</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
