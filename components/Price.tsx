'use client'

import { useCurrency } from '@/components/CurrencyProvider'
import { formatPrice, CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface PriceProps {
    /** Amount in INR (base currency) */
    amount: number
    /** Show the original INR amount in parentheses */
    showOriginal?: boolean
    /** Additional CSS classes */
    className?: string
    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    /** Show as a compact badge */
    badge?: boolean
    /** Skip currency conversion and just show with symbol */
    suppressConversion?: boolean
}

const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl font-bold',
    '2xl': 'text-3xl font-bold',
    '3xl': 'text-4xl font-black'
}

export function Price({
    amount,
    showOriginal = false,
    className,
    size = 'md',
    badge = false,
    suppressConversion = false
}: PriceProps) {
    const { currency: _unused, isLoading } = useCurrency()
    const currency = 'INR' // Forced to INR as per user request for the website

    if (isLoading) {
        // Show skeleton while loading
        const symbol = CURRENCIES[DEFAULT_CURRENCY]?.symbol || '₹'
        return (
            <span className={cn('inline-block animate-pulse bg-slate-200 rounded', className)}>
                <span className="invisible">{symbol}{amount.toFixed(0)}</span>
            </span>
        )
    }

    const formatted = suppressConversion
        ? new Intl.NumberFormat(CURRENCIES[currency]?.locale || 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
        : formatPrice(amount, currency, showOriginal)

    if (badge) {
        return (
            <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium',
                sizeClasses[size],
                className
            )}>
                {formatted}
            </span>
        )
    }

    return (
        <span className={cn(sizeClasses[size], className, suppressConversion && "text-[#107c10] font-bold")}>
            {formatted}
        </span>
    )
}

// Static price display for server components (always base currency)
export function StaticPrice({
    amount,
    className,
    size = 'md'
}: {
    amount: number
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
    const symbol = CURRENCIES[DEFAULT_CURRENCY]?.symbol || '₹'
    return (
        <span className={cn(sizeClasses[size], className)}>
            {symbol}{amount.toLocaleString()}
        </span>
    )
}
