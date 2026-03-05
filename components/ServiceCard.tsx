'use client'

import Link from "next/link"
import { Star } from "lucide-react"
import { Price } from "./Price"

interface ServiceCardProps {
    service: {
        id: string
        title: string
        images: string[]
        price: number
        seller?: {
            username?: string
        }
    }
}

export function ServiceCard({ service }: ServiceCardProps) {
    return (
        <Link href={`/services/${service.id}`} className="group block h-full">
            <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all duration-300">

                {/* Image Section */}
                <div className="relative h-52 w-full bg-slate-200">
                    <img
                        src={service.images[0] || "/placeholder.jpg"}
                        alt={service.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* Text Content */}
                <div className="p-4 flex-1 flex flex-col gap-3">

                    {/* Seller */}
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {service.seller?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 truncate">{service.seller?.username || "User"}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {service.title}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs mt-auto">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-slate-900">5.0</span>
                        <span className="text-slate-400">(New)</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[18px] font-bold text-slate-900 uppercase tracking-wide">Starting at</span>
                    <Price amount={service.price} size="lg" className="font-bold text-slate-900" />
                </div>

            </div>
        </Link>
    )
}
