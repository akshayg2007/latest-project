
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
import { ArrowRight, Inbox } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReceivedProposalsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch jobs posted by the user (client)
    const userJobs = await db.job.findMany({
        where: {
            clientId: userId,
            isRemoved: false
        },
        include: {
            applications: {
                select: {
                    id: true,
                    status: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    const jobsWithStats = (userJobs as any[]).map(job => ({
        id: job.id,
        title: job.title,
        category: job.category,
        totalProposals: job.applications.filter((app: any) => !['REJECTED', 'WITHDRAWN'].includes(app.status)).length,
        unreadProposals: job.applications.filter((app: any) => app.status === 'PENDING').length,
        status: job.status
    }))

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Received Proposals</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Manage and review applications for your posted jobs.
                </p>
            </div>

            <Card className="border-none bg-white/50 backdrop-blur-sm overflow-hidden ring-1 ring-slate-200/50 shadow-sm">
                <CardHeader className="px-6 py-5 border-b bg-white">
                    <CardTitle className="text-lg font-semibold text-slate-800">Active Jobs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                                <TableHead className="w-[100px] font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Job ID</TableHead>
                                <TableHead className="w-[420px] font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Job Title</TableHead>
                                <TableHead className="font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Category</TableHead>
                                <TableHead className="text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Total Proposals</TableHead>
                                <TableHead className="text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Unread</TableHead>
                                <TableHead className="text-center font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobsWithStats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="p-4 rounded-full bg-slate-100">
                                                <Inbox className="h-10 w-10 text-slate-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-medium text-slate-900">No jobs posted yet</p>
                                                <p>Your job listings will appear here once you post them.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                jobsWithStats.map((job) => (
                                    <TableRow key={job.id} className="group hover:bg-slate-50/40 transition-colors border-b last:border-0">
                                        <TableCell className="py-5 px-6 font-mono text-md text-slate-400">
                                            #{job.id.slice(0, 6)}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <span className="font-semibold text-slate-900 line-clamp-1 max-w-[350px] text-[18px]">
                                                {job.title}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge variant="secondary" className="font-medium px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 border-none text-[16px] shadow-none">
                                                {job.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center py-5">
                                            {job.totalProposals > 0 ? (
                                                <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-medium border-none shadow-none text-[16px]">
                                                    {job.totalProposals}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 font-normal text-sm">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center py-5">
                                            {job.unreadProposals > 0 ? (
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-semibold px-2.5 py-0.5 rounded-full text-[14px]">
                                                    {job.unreadProposals} New
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 font-normal text-[14px]">All read</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center py-5 px-6">
                                            <Button
                                                size="sm"
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 h-8 text-[16px] rounded-lg transition-all shadow-sm hover:shadow-indigo-100 border-none"
                                                asChild
                                            >
                                                <Link href={`/dashboard/proposals/received/${job.id}`}>
                                                    View Proposals
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
