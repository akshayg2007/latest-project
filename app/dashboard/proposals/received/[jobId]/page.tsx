
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Price } from "@/components/Price"
import { ArrowLeft } from "lucide-react"

// Client Component for the Row to handle interactions without page reload (if possible via Server Actions)
import { ProposalRow } from "@/app/dashboard/proposals/received/[jobId]/ProposalRow"

export const dynamic = 'force-dynamic'

export default async function JobProposalsPage({ params }: { params: Promise<{ jobId: string }> }) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { jobId } = await params

    // Fetch Job Details + All Applications
    const job = await db.job.findUnique({
        where: { id: jobId },
        include: {
            applications: {
                include: {
                    freelancer: {
                        include: {
                            credibility: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    // Filter out rejected and withdrawn in JavaScript
    if (job) {
        job.applications = job.applications.filter(app =>
            app.status !== 'REJECTED' && app.status !== 'WITHDRAWN'
        ) as any
    }

    if (!job || job.isRemoved) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Job Not Found or Removed</h2>
                <Button asChild variant="link" className="mt-4 text-indigo-600 hover:text-indigo-700">
                    <Link href="/dashboard/proposals/received">Back to Received Proposals</Link>
                </Button>
            </div>
        )
    }

    // Verify ownership
    if (job.clientId !== session.user.id) {
        redirect("/dashboard/proposals/received")
    }



    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Top Navigation & Job Context */}
            <div className="flex flex-col gap-4">
                <Link
                    href="/dashboard/proposals/received"
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Jobs
                </Link>

                <div className="flex items-start justify-between border-b pb-2">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">{job.title}</h1>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-semibold bg-slate-100/80 text-slate-600 border-none px-4 py-1 rounded-full text-[14px] uppercase tracking-wider">
                                {job.category}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right glass-card p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Job Budget</p>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-lg">
                                    {job.minBudget && job.maxBudget && job.minBudget !== job.maxBudget ? (
                                        <>
                                            <Price amount={job.minBudget} />
                                            <span className="text-slate-300 font-medium">-</span>
                                            <Price amount={job.maxBudget} />
                                        </>
                                    ) : (
                                        <Price amount={job.budget || job.maxBudget || 0} />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {job.budgetType === 'HOURLY' ? 'Hourly Rate' : 'Fixed Price'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proposals Table */}
            <Card className="border-none bg-white/50 backdrop-blur-sm overflow-hidden ring-1 ring-slate-200/50 shadow-sm">
                <CardHeader className="px-6 py-5 border-b bg-white">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-slate-800">Received Proposals</CardTitle>
                            <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                                JOB ID: <span className="font-mono text-slate-500 font-bold text-[12px]">#{job.id.slice(0, 8)}</span>
                            </p>
                        </div>
                        <Badge variant="outline" className="font-semibold text-slate-500 border-slate-200">{job.applications.length} Applicants</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                                <TableHead className="py-4 px-6 font-medium text-slate-600 uppercase tracking-wider text-[12px]">Freelancer</TableHead>
                                <TableHead className="py-4 text-slate-600 uppercase tracking-wider text-[12px]">Credibility</TableHead>
                                <TableHead className="text-center py-4 text-slate-600 uppercase tracking-wider text-[12px]">Proposed Price</TableHead>
                                <TableHead className="text-center py-4 text-slate-600 uppercase tracking-wider text-[12px]">Received</TableHead>
                                <TableHead className="text-center py-4 text-slate-600 uppercase tracking-wider text-[12px]">Status</TableHead>
                                <TableHead className="text-center py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {job.applications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No proposals received yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                job.applications.map((app) => (
                                    <ProposalRow key={app.id} application={{ ...app, jobId: job.id }} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
