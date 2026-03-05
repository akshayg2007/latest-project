
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Inbox } from "lucide-react"
import { Price } from "@/components/Price"

export const dynamic = 'force-dynamic'

interface TrackItem {
    id: string
    jobId: string
    jobTitle: string
    category: string
    price: number
    status: string
    createdAt: Date
    updatedAt: Date
    isJobRemoved: boolean
    counterparty: {
        username: string
        avatarUrl: string | null
    }
    role: 'freelancer' | 'client'
}

export default async function TrackProposalsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    let items: TrackItem[] = []

    // Fetch as freelancer
    const apps = await db.jobApplication.findMany({
        where: {
            freelancerId: userId,
            status: { in: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'] }
        },
        include: {
            job: {
                include: { client: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    const freelancerItems = apps.map(app => ({
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.job.title,
        category: app.job.category,
        price: app.proposedBudget,
        status: app.status,
        isJobRemoved: app.job.isRemoved,
        counterparty: app.job.client,
        role: 'freelancer' as const,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
    }))

    // Fetch as client
    const jobs = await db.job.findMany({
        where: { clientId: userId },
        include: {
            applications: {
                where: { status: { in: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'] } },
                include: { freelancer: true }
            }
        }
    })

    const clientItems = jobs.flatMap(job => job.applications.map(app => ({
        id: app.id,
        jobId: job.id,
        jobTitle: job.title,
        category: job.category,
        price: app.proposedBudget,
        status: app.status,
        isJobRemoved: job.isRemoved,
        counterparty: app.freelancer,
        role: 'client' as const,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
    })))

    // Combine and sort
    items = [...freelancerItems, ...clientItems].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Track Proposals</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    View the history of your accepted, rejected, and withdrawn proposals.
                </p>
            </div>

            <Card className="border-none bg-white/50 backdrop-blur-sm overflow-hidden ring-1 ring-slate-200/50 shadow-sm">
                <CardHeader className="px-6 py-5 border-b bg-white">
                    <CardTitle className="text-lg font-semibold text-slate-800">Proposal History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <div className="p-4 rounded-full bg-slate-100 mb-4">
                                <Inbox className="h-10 w-10 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-slate-900">No proposal history yet</p>
                                <p>Completed proposals will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                                    <TableHead className="w-[100px] font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Job ID</TableHead>
                                    <TableHead className="w-[320px] font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Job Title</TableHead>
                                    <TableHead className="w-[200px] font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">User</TableHead>
                                    <TableHead className="font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Category</TableHead>
                                    <TableHead className="text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Price</TableHead>
                                    <TableHead className="text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Date</TableHead>
                                    <TableHead className="text-center font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id} className="group hover:bg-slate-50/40 transition-colors border-b last:border-0">
                                        <TableCell className="py-5 px-6 font-mono text-[14px] text-slate-400 font-medium">
                                            #{item.jobId.slice(0, 6)}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 line-clamp-1 max-w-[320px] text-[18px] tracking-tight">
                                                    {item.jobTitle}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Link href={`/users/${item.counterparty.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
                                                <Avatar className="h-8 w-8 border border-slate-100 shadow-sm overflow-hidden rounded-full">
                                                    <AvatarImage src={item.counterparty.avatarUrl || ""} className="object-cover rounded-full" />
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] rounded-full">
                                                        {item.counterparty.username.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-slate-700 text-[16px] tracking-tight">
                                                    {item.counterparty.username}
                                                </span>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge variant="secondary" className="font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border-none text-[12px] shadow-none uppercase tracking-wider">
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center py-5">
                                            <Price amount={item.price} className="font-bold text-slate-900 text-[18px]" />
                                        </TableCell>
                                        <TableCell className="text-center py-5 text-slate-500 font-semibold text-[16px]">
                                            {format(new Date(item.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-center py-5 px-6">
                                            {item.isJobRemoved ? (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">Job Removed</Badge>
                                            ) : item.status === 'ACCEPTED' ? (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">Accepted</Badge>
                                            ) : item.status === 'REJECTED' ? (
                                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">Rejected</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase">Withdrawn</Badge>
                                            )}
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
