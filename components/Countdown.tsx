"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface CountdownProps {
    deadline: Date | string | null
}

export function Countdown({ deadline }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: string;
        hours: string;
        minutes: string;
    } | null>(null)

    useEffect(() => {
        if (!deadline) return

        const target = new Date(deadline).getTime()

        const calculateTimeLeft = () => {
            const now = new Date().getTime()
            const difference = target - now

            if (difference <= 0) {
                setTimeLeft({ days: "00", hours: "00", minutes: "00" })
                return
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

            setTimeLeft({
                days: days.toString().padStart(2, "0"),
                hours: hours.toString().padStart(2, "0"),
                minutes: minutes.toString().padStart(2, "0")
            })
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

        return () => clearInterval(timer)
    }, [deadline])

    if (!deadline) return <span className="text-slate-400">Flexible</span>

    return (
        <div className="flex items-center gap-2 font-mono text-lg font-bold text-slate-900">
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="flex items-center gap-1">
                <span>{timeLeft?.days || "00"}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">days</span>
            </div>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-1">
                <span>{timeLeft?.hours || "00"}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Hrs</span>
            </div>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-1">
                <span>{timeLeft?.minutes || "00"}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">minutes</span>
            </div>
        </div>
    )
}
