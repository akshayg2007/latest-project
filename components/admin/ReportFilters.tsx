"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ReportType, ReportStatus } from "@prisma/client"

interface ReportFiltersProps {
    currentStatus?: ReportStatus
    currentType?: ReportType
    currentReason?: string
    reasons: string[]
}

export function ReportFilters({
    currentStatus,
    currentType,
    currentReason,
    reasons
}: ReportFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const pathname = usePathname()
    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === "ALL") {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit shrink-0 gap-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-40px)]">
            {/* Subject Type Filter */}
            <div className="w-28 shrink-0">
                <Select
                    value={currentType || "ALL"}
                    onValueChange={(val) => updateFilter("type", val)}
                >
                    <SelectTrigger className="h-7 border-none bg-transparent hover:bg-white rounded-lg text-[9px] font-black uppercase tracking-tight shadow-none focus:ring-0 px-2 transition-all">
                        <div className="flex items-center gap-1.5 truncate">
                            <SelectValue placeholder="TYPE" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value="ALL" className="text-[10px] font-bold">ALL SUBJECTS</SelectItem>
                        {Object.values(ReportType).map((t) => (
                            <SelectItem key={t} value={t} className="text-[10px] font-bold">{t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-px h-3 bg-slate-200 shrink-0" />

            {/* Reason Filter */}
            <div className="w-32 shrink-0">
                <Select
                    value={currentReason || "ALL"}
                    onValueChange={(val) => updateFilter("reason", val)}
                >
                    <SelectTrigger className="h-7 border-none bg-transparent hover:bg-white rounded-lg text-[9px] font-black uppercase tracking-tight shadow-none focus:ring-0 px-2 transition-all">
                        <div className="flex items-center gap-1.5 truncate">
                            <SelectValue placeholder="REASON" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value="ALL" className="text-[10px] font-bold">ALL REASONS</SelectItem>
                        {reasons.map((r) => (
                            <SelectItem key={r} value={r} className="text-[10px] font-bold uppercase">{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
