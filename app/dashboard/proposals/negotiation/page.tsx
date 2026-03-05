import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Inbox, LayoutList } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function NegotiationProposalsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { activeProfile: true }
    })

    if (!user) redirect("/api/auth/signin")

    const isBuyer = user.activeProfile === 'BUYER'
    const userId = session.user.id

    let jobsWithNegotiations = []

    if (isBuyer) {
        // Fetch jobs posted by this user that have shortlisted applications
        const jobs = await db.job.findMany({
            where: {
                clientId: userId,
                applications: {
                    some: { status: 'SHORTLISTED' }
                }
            },
            include: {
                applications: {
                    where: { status: 'SHORTLISTED' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        jobsWithNegotiations = jobs.map(job => ({
            id: job.id,
            title: job.title,
            budgetType: job.budgetType,
            shortlistedCount: job.applications.length,
            waitingOn: "Client", // Default for buyer view
            actionLink: `/dashboard/proposals/negotiation/${job.id}`
        }))
    } else {
        // Fetch jobs where this user is shortlisted
        const applications = await db.jobApplication.findMany({
            where: {
                freelancerId: userId,
                status: 'SHORTLISTED'
            },
            include: {
                job: {
                    include: {
                        applications: {
                            where: { status: 'SHORTLISTED' }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        jobsWithNegotiations = applications.map(app => ({
            id: app.job.id,
            title: app.job.title,
            budgetType: app.job.budgetType,
            shortlistedCount: app.job.applications.length,
            waitingOn: "Client", // Default for seller view
            actionLink: `/dashboard/proposals/negotiation/${app.job.id}`
        }))
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Negotiation</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Manage your active negotiations and shortlisted proposals.
                </p>
            </div>

            <Card className="border-none bg-white/50 backdrop-blur-sm overflow-hidden ring-1 ring-slate-200/50 shadow-sm">
                <CardHeader className="px-6 py-5 border-b bg-white">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Active Negotiations
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {jobsWithNegotiations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <div className="p-4 rounded-full bg-slate-100 mb-4">
                                <Inbox className="h-10 w-10 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-slate-900">No active negotiations</p>
                                <p>Jobs with shortlisted proposals will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                                    <TableHead className="w-[120px] font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Job ID</TableHead>
                                    <TableHead className="min-w-[300px] font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Job Title</TableHead>
                                    <TableHead className="w-[150px] font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Project Type</TableHead>
                                    <TableHead className="w-[150px] text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Shortlisted Count</TableHead>
                                    <TableHead className="w-[150px] text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Waiting On</TableHead>
                                    <TableHead className="text-center font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobsWithNegotiations.map((job) => (
                                    <TableRow key={job.id} className="group hover:bg-slate-50/40 transition-colors border-b last:border-0">
                                        <TableCell className="py-5 px-6 font-mono text-[13px] text-slate-400">
                                            #{job.id.slice(0, 6).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <span className="font-semibold text-slate-900 text-[18px] tracking-tight line-clamp-1">
                                                {job.title}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge variant="outline" className="font-medium px-3 py-1 rounded-full border-slate-200 text-slate-600 text-[12px] uppercase tracking-wider">
                                                {job.budgetType === 'FIXED' ? 'Fixed Price' : 'Hourly'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center py-5">
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full border-none text-[14px]">
                                                {job.shortlistedCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center py-5">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-semibold px-3 py-1 rounded-full text-[12px] uppercase">
                                                {job.waitingOn}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <div className="flex justify-center">
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 h-9 text-[14px] rounded-lg transition-all shadow-sm border-none"
                                                    asChild
                                                >
                                                    <Link href={job.actionLink}>
                                                        <LayoutList className="h-4 w-4 mr-2" />
                                                        View Shortlisted
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
