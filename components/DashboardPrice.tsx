'use client'

import { Price } from '@/components/Price'

// Simple price display for use in server components
// Just use <DashboardPrice amount={123} /> anywhere

export function DashboardPrice({
    amount,
    prefix = '',
    className = ''
}: {
    amount: number
    prefix?: string
    className?: string
}) {
    return (
        <span className={className}>
            {prefix}<Price amount={amount} />
        </span>
    )
}

// For revenue/spent totals in stat cards
export function StatPrice({ amount }: { amount: number }) {
    return <Price amount={amount} size="xl" className="text-2xl font-bold" />
}

// For order lists (green for income, normal for expense)
export function OrderPrice({
    amount,
    isIncome = false
}: {
    amount: number
    isIncome?: boolean
}) {
    return (
        <span className={`font-medium ${isIncome ? 'text-green-600' : 'text-slate-900'}`}>
            {isIncome ? '+' : ''}<Price amount={amount} />
        </span>
    )
}

// Compact price for small displays
export function CompactPrice({ amount, className = '' }: { amount: number; className?: string }) {
    return <Price amount={amount} size="sm" className={className} />
}
