"use client"

import { AlertTriangle, Clock } from "lucide-react"

interface SuspensionBannerProps {
    suspendedUntil: string | Date
    suspensionReason: string | null
}

export function SuspensionBanner({ suspendedUntil, suspensionReason }: SuspensionBannerProps) {
    const expiryDate = new Date(suspendedUntil)
    const now = new Date()

    if (expiryDate <= now) return null

    const diffMs = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    let timeLeft = ""
    if (diffDays > 1) {
        timeLeft = `${diffDays} days`
    } else if (diffHours > 1) {
        timeLeft = `${diffHours} hours`
    } else {
        timeLeft = "less than an hour"
    }

    return (
        <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-amber-700">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="font-bold text-sm">Your account is suspended</span>
                        <span className="text-xs sm:text-sm text-amber-600">
                            · {timeLeft} remaining (expires {expiryDate.toLocaleDateString()})
                        </span>
                    </div>
                </div>
                {suspensionReason && (
                    <div className="flex items-start gap-1.5 ml-10 sm:ml-0">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-amber-600">
                            Reason: {suspensionReason}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
