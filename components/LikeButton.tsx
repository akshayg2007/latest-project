"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toggleLike } from "@/app/actions/toggleLike"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface LikeButtonProps {
    itemId: string
    itemType: 'SERVICE' | 'PRODUCT' | 'JOB'
    initialLiked?: boolean
    initialCount?: number
    className?: string
    showCount?: boolean
    variant?: 'ghost' | 'outline' | 'filled'
}

export function LikeButton({
    itemId,
    itemType,
    initialLiked = false,
    initialCount = 0,
    className,
    showCount = false,
    variant = 'ghost'
}: LikeButtonProps) {
    const [isLiked, setIsLiked] = useState(initialLiked)
    const [count, setCount] = useState(initialCount)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return

        const previousLiked = isLiked
        const previousCount = count

        // Optimistic UI
        setIsLiked(!isLiked)
        setCount(prev => isLiked ? prev - 1 : prev + 1)
        setIsLoading(true)

        try {
            const result = await toggleLike({ itemId, itemType })

            if (result.error) {
                // Revert on error
                setIsLiked(previousLiked)
                setCount(previousCount)

                if (result.error === "Unauthorized") {
                    toast.error("Please sign in to like items")
                } else {
                    toast.error(result.error)
                }
            } else {
                // Sync with server result if needed, though toggleLike returns isLiked
                // Actually the optimistic update is usually fine
                router.refresh()
            }
        } catch (error) {
            setIsLiked(previousLiked)
            setCount(previousCount)
            toast.error("Failed to update like")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleLike}
            disabled={isLoading}
            className={cn(
                "group flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer",
                variant === 'ghost' && "p-2 rounded-full hover:bg-red-50",
                variant === 'outline' && "px-3 py-1.5 rounded-full border border-slate-200 hover:border-red-200 hover:bg-red-50",
                variant === 'filled' && "px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100",
                className
            )}
        >
            <div className="relative">
                <Heart
                    className={cn(
                        "w-5 h-5 transition-all duration-300",
                        isLiked
                            ? "fill-red-500 text-red-500 scale-110"
                            : "text-slate-400 group-hover:text-red-400"
                    )}
                />

                {/* Pop animation for heart */}
                <AnimatePresence>
                    {isLiked && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-red-500 rounded-full -z-10"
                        />
                    )}
                </AnimatePresence>
            </div>

            {showCount && (
                <span className={cn(
                    "text-sm font-bold transition-colors",
                    isLiked ? "text-red-500" : "text-slate-500 group-hover:text-red-400"
                )}>
                    {count}
                </span>
            )}
        </button>
    )
}
