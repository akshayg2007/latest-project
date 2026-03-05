'use client'

import { useCurrency } from './CurrencyProvider'
import { formatPrice, CURRENCIES } from '@/lib/currency'

interface PricingDisplayProps {
    /** Amount in INR */
    amount: number
    /** Show per month suffix */
    showPeriod?: boolean
    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

export function PricingDisplay({
    amount,
    showPeriod = false,
    size = 'lg',
    className = ''
}: PricingDisplayProps) {
    const { currency, isLoading } = useCurrency()

    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl font-bold',
        xl: 'text-5xl font-bold'
    }

    if (isLoading) {
        return (
            <div className={`animate-pulse bg-slate-200 rounded h-10 w-20 ${className}`} />
        )
    }

    const formatted = formatPrice(amount, currency, false)

    return (
        <span className={`${sizeClasses[size]} ${className}`}>
            {formatted}
            {showPeriod && <span className="text-xs text-slate-500 font-medium ml-1">/ month</span>}
        </span>
    )
}

// Show conversion notice
export function ConversionNotice({ className = '' }: { className?: string }) {
    const { currency, currencyInfo, isLoading, detectedCountry } = useCurrency()

    if (isLoading || currency === 'USD') return null

    return (
        <div className={`text-xs text-slate-500 ${className}`}>
            <span className="inline-flex items-center gap-1">
                💱 Prices shown in {currencyInfo.name} ({currencyInfo.code})
                {detectedCountry && <span className="text-slate-400">• Based on your location</span>}
            </span>
        </div>
    )
}

// Inline price for text paragraphs
export function InlinePrice({ amount }: { amount: number }) {
    const { currency, isLoading } = useCurrency()

    if (isLoading) {
        return <span className="animate-pulse bg-slate-200 rounded inline-block w-12 h-4" />
    }

    return <span className="font-semibold">{formatPrice(amount, currency)}</span>
}
