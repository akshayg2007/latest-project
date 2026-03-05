'use client'

import { Input } from "@/components/ui/input"
import { useCurrency } from "@/components/CurrencyProvider"

export function BudgetFilter() {
    const { currencyInfo } = useCurrency()
    const symbol = currencyInfo.symbol

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">{symbol}</span>
                <Input type="number" placeholder="Min" className="pl-6 h-9" />
            </div>
            <span className="text-slate-400">-</span>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">{symbol}</span>
                <Input type="number" placeholder="Max" className="pl-6 h-9" />
            </div>
        </div>
    )
}
