"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, Clock, Tag, SlidersHorizontal, Pencil } from "lucide-react"
import { Price } from "@/components/Price"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { LikeButton } from "@/components/LikeButton"

export type ItemType = 'ALL' | 'PROFILE' | 'SERVICE' | 'PRODUCT' | 'JOB'

export interface ExploreItem {
    id: string
    type: ItemType
    title: string
    description: string
    category: string
    price: number
    deliveryTime?: number | null
    images: string[]
    createdAt: string
    seller: {
        username: string | null
        avatarUrl: string | null
    }
    avgRating?: number
    reviewCount?: number
    skills?: string[]
    tools?: string[]
    license?: string
    budgetType?: string
    experienceLevel?: string
    likesCount?: number
    isLiked?: boolean
    paymentFrequency?: string | null
    pricingMethod?: string | null
    revisions?: string | null
}

interface ExploreCardProps {
    item: ExploreItem
    index?: number
    showBadge?: boolean
    hideLike?: boolean
    onEdit?: (item: ExploreItem) => void
}

export const ExploreCard = ({ item, index = 0, showBadge = true, hideLike = false, onEdit }: ExploreCardProps) => {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    const badge = item.type === 'SERVICE' ? 'Service' :
        item.type === 'PRODUCT' ? 'Product' :
            item.type === 'JOB' ? 'Job' : 'Profile'

    const href = item.type === 'SERVICE' ? `/dashboard/explore/services/${item.id}` :
        item.type === 'PRODUCT' ? `/dashboard/explore/products/${item.id}` :
            item.type === 'PROFILE' ? (item.seller?.username ? `/dashboard/user/${item.seller.username}` : '#') :
                `/dashboard/explore/jobs/${item.id}`

    // Profile Card
    if (item.type === 'PROFILE') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="h-full"
            >
                <Link href={href} className="flex flex-col h-full bg-card border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                            {item.seller.avatarUrl ? (
                                <img src={item.seller.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-300 bg-slate-50">
                                    {item.seller.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-slate-900 truncate">@{item.seller.username}</h3>
                            <p className="text-[12px] font-medium text-slate-500 truncate">{item.category}</p>
                        </div>
                    </div>

                    <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-3 flex-1">
                        {item.description || "No bio provided yet."}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3 h-6 overflow-hidden">
                        {(item.skills || []).slice(0, 3).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-tight whitespace-nowrap">
                                {skill}
                            </span>
                        ))}
                    </div>

                    <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Starts at</span>
                            <span className="text-xs font-bold text-slate-900">
                                <Price amount={item.price} />/hr
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[11px] font-bold text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-50 transition-all px-3">
                            View Profile
                        </Button>
                    </div>
                </Link>
            </motion.div>
        )
    }

    // Job Card
    if (item.type === 'JOB') {
        const tools = item.skills || item.tools || []
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="h-full"
            >
                <div className="flex flex-col h-full bg-card border border-slate-200 rounded-3xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200 p-5 min-h-[400px]">
                    <div className="flex flex-col h-full gap-3 justify-between">
                        {/* Header Section: Job Title and Relative Timestamp */}
                        <div className="space-y-1">
                            <h3 className="text-[26px] font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                {item.title}
                            </h3>
                            <div className="flex items-center justify-between">
                                <p className="text-[12px] text-slate-400 font-medium lowercase">
                                    {mounted ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }).replace('about ', '').replace('minutes', 'min').replace('minute', 'min') : 'just now'}
                                </p>
                                <LikeButton
                                    itemId={item.id}
                                    itemType="JOB"
                                    initialLiked={item.isLiked}
                                    initialCount={item.likesCount}
                                    showCount={true}
                                    className="p-0 hover:bg-transparent h-6"
                                />
                            </div>
                        </div>

                        {/* Stats Grid: Displays numeric info like Budget and Experience Level */}
                        <div className="flex flex-wrap gap-6 mt-0">
                            {/* Budget Item */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                    <Tag className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="flex flex-col gap-0">
                                    <div className="text-[17px] font-bold text-slate-900 leading-tight whitespace-nowrap">
                                        <Price amount={item.price} />
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 whitespace-nowrap">
                                        {item.budgetType === 'HOURLY' ? 'Hourly' : 'Fixed'}
                                    </div>
                                </div>
                            </div>

                            {/* Experience Item */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                    <SlidersHorizontal className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="flex flex-col gap-0">
                                    <div className="text-[17px] font-bold text-slate-900 leading-tight capitalize whitespace-nowrap">
                                        {item.experienceLevel || 'Mixed'}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 whitespace-nowrap">
                                        Exp.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Job Description: Uses line-clamp to limit text length */}
                        <p className="text-[15px] text-slate-600 line-clamp-3 leading-relaxed">
                            {item.description}
                        </p>

                        {/* Skills/Tags List: Renders a few tags with an overflow count */}
                        <div className="flex flex-wrap gap-2">
                            {(tools || []).slice(0, 4).map((skill) => (
                                <span key={skill} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">
                                    {skill}
                                </span>
                            ))}
                            {tools.length > 4 && (
                                <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-400 text-[11px] font-bold">
                                    +{tools.length - 4}
                                </span>
                            )}
                        </div>

                        {/* Footer: Action button to view job details */}
                        <div>
                            <Link href={href}>
                                <Button className="w-fit px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl h-11 text-xs shadow-sm transition-all active:scale-[0.98]">
                                    Send Proposal
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Default Card (Service / Product)
    const tools = item.skills || item.tools || []

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="h-full"
        >
            <Link href={href} className="group block h-full">
                <div className="flex flex-col h-full bg-card border border-slate-200 rounded-3xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200">
                    <div className="p-3 pb-0">
                        {/* CARD SIZE: Changed to 4/3 for slightly taller images */}
                        <div className="relative aspect-[16/10] w-full bg-slate-50 rounded-2xl overflow-hidden">
                            {item.images && item.images.length > 0 ? (
                                <img
                                    src={item.images[0]}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 text-blue-600">
                                    <Sparkles className="w-12 h-12 opacity-20" />
                                </div>
                            )}
                            {showBadge && (
                                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-foreground/90 text-background backdrop-blur-sm uppercase tracking-wider">
                                        {badge}
                                    </span>
                                </div>
                            )}
                            {!hideLike && (
                                <div className="absolute top-2.5 right-2.5">
                                    <LikeButton
                                        itemId={item.id}
                                        itemType={item.type as any}
                                        initialLiked={item.isLiked}
                                        initialCount={item.likesCount}
                                        variant="filled"
                                        className="bg-white/80 backdrop-blur-md shadow-sm border-none w-9 h-9 rounded-2xl"
                                    />
                                </div>
                            )}

                            {onEdit && (
                                <div className="absolute top-2.5 right-12">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            onEdit(item)
                                        }}
                                        className="bg-white/80 backdrop-blur-md shadow-sm border-none w-9 h-9 rounded-2xl flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-3 flex flex-col flex-1 h-full">
                        {item.type === 'SERVICE' ? (
                            <>
                                <h3 className="font-semibold text-slate-900 text-[18px] mb-1 leading-tight line-clamp-1">
                                    {item.title}
                                </h3>
                                {item.revisions && (
                                    <div className="flex items-center gap-1.5 mb-2 h-4">
                                        <Sparkles className="w-3 h-3 text-slate-400" />
                                        <span className="text-[11px] font-medium text-slate-500">
                                            {item.revisions} Revisions
                                        </span>
                                    </div>
                                )}
                                <div className="mt-auto flex items-baseline gap-1">
                                    <span className="text-[16px] font-bold text-slate-900 tracking-tight">Starts at</span>
                                    <Price amount={item.price} className="text-slate-900 font-bold text-[16px]" />
                                    {item.paymentFrequency === 'HOURLY' && <span className="text-[16px] font-bold text-slate-900">\hr</span>}
                                    {item.paymentFrequency === 'WEEKLY' && <span className="text-[16px] font-bold text-slate-900">\week</span>}
                                    {item.paymentFrequency === 'MONTHLY' && <span className="text-[16px] font-bold text-slate-900">\month</span>}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="font-semibold text-slate-900 text-[20px] mb-1 leading-tight line-clamp-1">
                                    {item.title}
                                </h3>
                                <p className="text-[12px] font-medium text-slate-400 mb-1">
                                    {item.license
                                        ? `${item.license.charAt(0).toUpperCase()}${item.license.slice(1).toLowerCase()} License`
                                        : "Commercial License"}
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-[14px] font-bold text-slate-900">
                                        <Price amount={item.price} />
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div >
    )
}
