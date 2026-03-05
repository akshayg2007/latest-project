'use client'

import Link from "next/link"
import { Heart, ImageIcon, Download, ShoppingCart, ShieldCheck, Tag } from "lucide-react"
import { Price } from "./Price"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ProductCardProps {
    product: {
        id: string
        name: string
        description: string
        price: number
        images: string[]
        tags?: string[]
        category: string
        license: string
        likesCount?: number
        isLiked?: boolean
        seller?: {
            username?: string
            avatarUrl?: string | null
        }
    }
    onLike?: (id: string, isLiked: boolean) => void
}

export function ProductCard({ product, onLike }: ProductCardProps) {
    const isCommercial = product.license === "COMMERCIAL"

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative bg-card border border-border/50 rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-border"
        >
            {/* Image Section */}
            <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
                <Link href={`/products/${product.id}`}>
                    {product.images && product.images[0] ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                    )}
                </Link>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm border",
                        isCommercial
                            ? "bg-blue-500/10 text-blue-600 border-blue-200/50"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-200/50"
                    )}>
                        {isCommercial ? "Commercial" : "Personal"}
                    </div>
                </div>

                {/* Like Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onLike?.(product.id, !!product.isLiked)
                    }}
                    className={cn(
                        "absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-sm",
                        product.isLiked
                            ? "bg-white border-red-100 text-red-500"
                            : "bg-black/5 border-white/20 text-white hover:bg-white hover:text-red-500 group/like"
                    )}
                >
                    <Heart className={cn("w-4 h-4 transition-transform duration-300", product.isLiked ? "fill-red-500 scale-110" : "group-hover/like:scale-110")} />
                </button>
            </div>

            {/* Content Section */}
            <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        {product.category}
                    </span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <ShoppingCart className="w-3 h-3" />
                        {product.likesCount || 0}
                    </span>
                </div>

                <Link href={`/products/${product.id}`}>
                    <h3 className="text-base font-bold text-foreground leading-snug mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">
                    {product.description}
                </p>

                {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-5">
                        {product.tags.slice(0, 2).map((tag: string, i: number) => (
                            <span key={`${tag}-${i}`} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/40 font-bold uppercase tracking-tight">
                                #{tag}
                            </span>
                        ))}
                        {product.tags.length > 2 && (
                            <span className="text-[9px] px-1.5 py-0.5 text-muted-foreground font-bold italic">
                                +{product.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price</span>
                        <div className="flex items-baseline gap-1">
                            <Price amount={product.price} size="lg" className="font-black text-foreground" />
                        </div>
                    </div>

                    <Link href={`/products/${product.id}`}>
                        <button className="h-9 px-4 rounded-xl bg-foreground text-background text-[11px] font-bold transition-all hover:bg-foreground/90 active:scale-95 flex items-center gap-2 shadow-sm">
                            View Item
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    )
}
