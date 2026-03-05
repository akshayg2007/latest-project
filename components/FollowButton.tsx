"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toggleFollow } from "@/app/actions/user"
import { toast } from "sonner"

interface FollowButtonProps {
    targetUserId: string
    initialIsFollowing: boolean
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [isPending, setIsPending] = useState(false)

    const handleClick = async () => {
        const prev = isFollowing
        setIsFollowing(!prev)
        setIsPending(true)
        try {
            const result = await toggleFollow(targetUserId)
            setIsFollowing(result.isFollowing)
            toast.success(result.isFollowing ? "Followed!" : "Unfollowed")
        } catch {
            setIsFollowing(prev)
            toast.error("Failed to update follow status")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Button
            variant="outline"
            className="rounded-full px-6 font-bold h-10 border-slate-200 text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
            onClick={handleClick}
            disabled={isPending}
        >
            {isFollowing ? "Following" : "Follow"}
        </Button>
    )
}
