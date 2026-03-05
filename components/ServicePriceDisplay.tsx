'use client'

import { Price } from "@/components/Price"

interface ServicePriceDisplayProps {
    price: number
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    showInButton?: boolean
}

export function ServicePriceDisplay({ price, size = 'xl', className }: ServicePriceDisplayProps) {
    return <Price amount={price} size={size} className={className} />
}

export function ServiceButtonPrice({ price }: { price: number }) {
    return (
        <span>
            Continue (<Price amount={price} />)
        </span>
    )
}
