"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Price } from "@/components/Price"
import { withdrawProposal } from "../received/actions"
import { toast } from "sonner"

interface Application {
    id: string
    jobId: string
    proposedBudget: number
    createdAt: Date
    status: string
    job: {
        title: string
        category: string
        client: {
            username: string
            avatarUrl: string | null
        }
    }
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'PENDING':
            return <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider uppercase">Pending</Badge>
        case 'SHORTLISTED':
            return <Badge variant="secondary" className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider uppercase">Shortlisted</Badge>
        case 'ACCEPTED':
            return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider uppercase">Accepted</Badge>
        case 'REJECTED':
            return <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider uppercase">Rejected</Badge>
        case 'WITHDRAWN':
            return <Badge variant="outline" className="text-slate-500 border-slate-300 bg-slate-50 px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider uppercase">Withdrawn</Badge>
        default:
            return <Badge variant="outline" className="rounded-full text-[12px] uppercase">{status}</Badge>
    }
}

export function SentProposalsTable({ applications }: { applications: Application[] }) {
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

    const handleWithdraw = async (applicationId: string) => {
        setWithdrawingId(applicationId)
        try {
            await withdrawProposal(applicationId)
            toast.success("Proposal withdrawn successfully")
        } catch (error) {
            toast.error("Failed to withdraw proposal")
        } finally {
            setWithdrawingId(null)
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                    <TableHead className="w-[100px] font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Job ID</TableHead>
                    <TableHead className="w-[420px] font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Job Title</TableHead>
                    <TableHead className="font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Category</TableHead>
                    <TableHead className="text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Proposed Price</TableHead>
                    <TableHead className="text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Sent On</TableHead>
                    <TableHead className="text-center font-medium py-4 text-slate-600 uppercase tracking-wider text-[12px]">Status</TableHead>
                    <TableHead className="font-medium py-4 px-6 text-slate-600 uppercase tracking-wider text-[12px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {applications.map((app) => (
                    <TableRow key={app.id} className="group hover:bg-slate-50/40 transition-colors border-b last:border-0">
                        <TableCell className="py-5 px-6 font-mono text-[13px] text-slate-400">
                            #{app.jobId.slice(0, 6)}
                        </TableCell>
                        <TableCell className="py-5">
                            <Link href={`/users/${app.job.client.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <Avatar className="h-10 w-10 border border-slate-100 shadow-sm overflow-hidden rounded-full">
                                    <AvatarImage src={app.job.client.avatarUrl || ""} className="object-cover rounded-full" />
                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-[12px] rounded-full">
                                        {app.job.client.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 line-clamp-1 max-w-[280px] text-[18px] tracking-tight">
                                        {app.job.title}
                                    </span>
                                    <span className="text-[12px] text-slate-400 font-semibold tracking-tight uppercase">
                                        by {app.job.client.username}
                                    </span>
                                </div>
                            </Link>
                        </TableCell>
                        <TableCell className="py-5">
                            <Badge variant="secondary" className="font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border-none text-[12px] shadow-none uppercase tracking-wider">
                                {app.job.category}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center py-5">
                            <Price amount={app.proposedBudget} className="font-bold text-slate-900 text-[18px]" />
                        </TableCell>
                        <TableCell className="text-center py-5 text-slate-500 font-semibold text-[16px]">
                            {format(new Date(app.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-center py-5 text-[16px]">
                            <StatusBadge status={app.status} />
                        </TableCell>
                        <TableCell className="py-5 px-6">
                            <div className="flex items-center justify-start gap-2.5">
                                {app.status === 'SHORTLISTED' && (
                                    <Button
                                        size="sm"
                                        className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all text-[16px] border-none shadow-blue-100"
                                        asChild
                                    >
                                        <Link href={`/dashboard/proposals/negotiation/${app.jobId}/${app.id}`}>
                                            Review terms
                                        </Link>
                                    </Button>
                                )}
                                {((app.status as string) === 'PENDING' || (app.status as string) === 'SHORTLISTED') && (
                                    <Button
                                        size="sm"
                                        className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-all text-[16px] border-none shadow-red-100"
                                        onClick={() => handleWithdraw(app.id)}
                                        disabled={withdrawingId === app.id}
                                    >
                                        {withdrawingId === app.id ? "Withdrawing..." : "Withdraw"}
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table >
    )
}
