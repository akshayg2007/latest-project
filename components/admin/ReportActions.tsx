"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { updateReportStatus } from "@/app/actions/report"
import { ReportStatus } from "@prisma/client"
import { toast } from "sonner"

interface ReportActionsProps {
    reportId: string
    currentStatus: ReportStatus
}

export function ReportActions({ reportId, currentStatus }: ReportActionsProps) {
    const [loading, setLoading] = useState<ReportStatus | null>(null)

    const handleUpdate = async (status: ReportStatus) => {
        setLoading(status)
        try {
            await updateReportStatus(reportId, status)
            toast.success(`Report marked as ${status.toLowerCase()}`)
        } catch (error: any) {
            toast.error(error.message || "Failed to update report")
        } finally {
            setLoading(null)
        }
    }

    if (currentStatus !== 'PENDING') return null

    return (
        <div className="flex flex-row md:flex-col gap-2.5 w-full">
            <Button
                variant="default"
                className="flex-1 rounded-xl font-bold text-sm gap-2.5 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
                onClick={() => handleUpdate('RESOLVED')}
                disabled={loading !== null}
            >
                <CheckCircle2 className="w-4 h-4" />
                {loading === 'RESOLVED' ? "Updating..." : "Resolve"}
            </Button>
            <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold text-sm gap-2.5 h-10 px-5 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                onClick={() => handleUpdate('DISMISSED')}
                disabled={loading !== null}
            >
                <XCircle className="w-4 h-4" />
                {loading === 'DISMISSED' ? "Updating..." : "Dismiss"}
            </Button>
        </div>
    )
}
