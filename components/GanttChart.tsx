"use client"

import React from 'react'
import { format, differenceInDays, isAfter, startOfDay, addDays, max } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp, TrendingDown, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface GanttMilestone {
    id: string
    title: string
    dueDate: Date | null
    submittedAt: Date | null
    status: string
}

interface GanttChartProps {
    milestones: GanttMilestone[]
    projectStartDate: Date
}

function getStatusInfo(milestone: GanttMilestone) {
    const completed = milestone.status === 'APPROVED' || milestone.status === 'SUBMITTED'

    if (completed && milestone.submittedAt && milestone.dueDate) {
        const diff = differenceInDays(
            startOfDay(new Date(milestone.submittedAt)),
            startOfDay(new Date(milestone.dueDate))
        )
        if (diff < 0) return { label: `Early by ${Math.abs(diff)}d`, barColor: 'bg-emerald-500', dotColor: 'bg-emerald-400', delay: diff }
        if (diff > 0) return { label: `Delayed by ${diff}d`, barColor: 'bg-rose-500', dotColor: 'bg-rose-400', delay: diff }
        return { label: 'On Time', barColor: 'bg-emerald-500', dotColor: 'bg-emerald-400', delay: 0 }
    }
    if (completed) return { label: 'Completed', barColor: 'bg-emerald-500', dotColor: 'bg-emerald-400', delay: 0 }

    if (milestone.dueDate && isAfter(new Date(), new Date(milestone.dueDate))) {
        const diff = differenceInDays(startOfDay(new Date()), startOfDay(new Date(milestone.dueDate)))
        return { label: `Overdue by ${diff}d`, barColor: 'bg-amber-500', dotColor: 'bg-amber-400', delay: diff }
    }

    return { label: 'Pending', barColor: 'bg-blue-300', dotColor: 'bg-blue-300', delay: 0 }
}

export function GanttChart({ milestones, projectStartDate }: GanttChartProps) {
    if (!milestones || milestones.length === 0) return null

    const validMilestones = milestones.filter(m => m.dueDate)
    if (validMilestones.length === 0) return null

    const start = startOfDay(new Date(projectStartDate))
    const futureDates = [
        ...validMilestones.map(m => new Date(m.dueDate!)),
        ...validMilestones.filter(m => m.submittedAt).map(m => new Date(m.submittedAt!)),
        addDays(new Date(), 7)
    ]
    const end = startOfDay(max(futureDates))
    const totalDays = Math.max(differenceInDays(end, start) + 1, 14)

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 py-4 border-b border-slate-100">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Project Timeline (Gantt)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="min-w-[720px] p-6">

                        {/* Date axis labels */}
                        <div className="flex mb-3 border-b border-slate-100 pb-2">
                            <div className="w-44 shrink-0 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Milestone</div>
                            <div className="flex-1 relative h-5">
                                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                                    <span
                                        key={pct}
                                        className="absolute text-[9px] text-slate-400 font-medium -translate-x-1/2"
                                        style={{ left: `${pct * 100}%` }}
                                    >
                                        {format(addDays(start, Math.floor(pct * totalDays)), 'MMM d')}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Milestone rows */}
                        <div className="space-y-5">
                            {validMilestones.map((m) => {
                                const s = getStatusInfo(m)
                                const duePct = Math.min(
                                    (differenceInDays(new Date(m.dueDate!), start) / totalDays) * 100,
                                    100
                                )
                                const subPct = m.submittedAt
                                    ? Math.min(
                                        (differenceInDays(new Date(m.submittedAt), start) / totalDays) * 100,
                                        100
                                    )
                                    : null

                                const todayPct = Math.min(
                                    (differenceInDays(new Date(), start) / totalDays) * 100,
                                    duePct
                                )

                                const tooltipText = m.submittedAt
                                    ? `Planned: ${format(new Date(m.dueDate!), 'MMM d, yyyy')} | Submitted: ${format(new Date(m.submittedAt), 'MMM d, yyyy')} | ${s.label}`
                                    : `Due: ${format(new Date(m.dueDate!), 'MMM d, yyyy')} | ${s.label}`

                                return (
                                    <div key={m.id} className="flex items-center group">
                                        {/* Label */}
                                        <div className="w-44 shrink-0 pr-3">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{s.label}</span>
                                            </div>
                                        </div>

                                        {/* Bar area */}
                                        <div
                                            className="flex-1 relative h-7 flex items-center rounded-lg bg-slate-50 group-hover:bg-slate-100/80 transition-colors px-0.5"
                                            title={tooltipText}
                                        >
                                            {/* Subtle grid lines */}
                                            {[0.25, 0.5, 0.75].map(p => (
                                                <div
                                                    key={p}
                                                    className="absolute top-0 bottom-0 w-px bg-slate-200 opacity-50 pointer-events-none"
                                                    style={{ left: `${p * 100}%` }}
                                                />
                                            ))}

                                            {/* Planned range ghost bar */}
                                            <div
                                                className="absolute h-2 rounded-full bg-slate-200 border border-dashed border-slate-300"
                                                style={{ left: '0%', width: `${Math.max(duePct, 1)}%` }}
                                            />

                                            {/* Actual completion bar or in-progress bar */}
                                            {subPct !== null ? (
                                                <div
                                                    className={`absolute h-4 rounded-md shadow-sm ${s.barColor} opacity-90 transition-all`}
                                                    style={{ left: '0%', width: `${Math.max(subPct, 2)}%` }}
                                                />
                                            ) : (
                                                <div
                                                    className={`absolute h-4 rounded-md ${isAfter(new Date(), new Date(m.dueDate!)) ? 'bg-amber-200 border border-amber-300' : 'bg-blue-100 border border-blue-200'} opacity-80`}
                                                    style={{ left: '0%', width: `${Math.max(todayPct, 1)}%` }}
                                                />
                                            )}

                                            {/* Deadline marker */}
                                            <div
                                                className="absolute w-0.5 h-6 bg-slate-400 opacity-50 group-hover:opacity-100 transition-opacity z-10"
                                                style={{ left: `${duePct}%` }}
                                            >
                                                <div className="absolute -top-4 left-1 bg-slate-800 text-white text-[8px] px-1 rounded font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Due {format(new Date(m.dueDate!), 'MMM d')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-emerald-500" />
                                <span>On Time / Early</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-rose-500" />
                                <span>Delayed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-amber-400" />
                                <span>Overdue</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
                                <span>In Progress</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
