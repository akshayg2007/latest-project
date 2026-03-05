"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Flag } from "lucide-react"
import { ReportModal } from "./ReportModal"
import { ReportType } from "@prisma/client"
import { cn } from "@/lib/utils"

interface ReportButtonProps {
    targetId: string
    targetType: ReportType
    targetName?: string
    variant?: "default" | "outline" | "ghost" | "icon"
    className?: string
    showLabel?: boolean
}

export function ReportButton({
    targetId,
    targetType,
    targetName,
    variant = "ghost",
    className,
    showLabel = false
}: ReportButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    if (variant === "icon") {
        return (
            <>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(true)}
                    className={cn("text-slate-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 p-0", className)}
                    title={`Report ${targetType.toLowerCase()}`}
                >
                    <Flag className="w-4 h-4" />
                </Button>
                <ReportModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    targetId={targetId}
                    targetType={targetType}
                    targetName={targetName}
                />
            </>
        )
    }

    return (
        <>
            <Button
                variant={variant}
                size="sm"
                onClick={() => setIsOpen(true)}
                className={cn("gap-2 text-[12px] font-bold uppercase tracking-wider", className)}
            >
                <Flag className="w-4 h-4" />
                {showLabel && <span>Report</span>}
            </Button>
            <ReportModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                targetId={targetId}
                targetType={targetType}
                targetName={targetName}
            />
        </>
    )
}
