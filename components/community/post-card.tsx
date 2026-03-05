"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
    MessageSquare,
    Share2,
    MoreHorizontal,
    Heart,
    ExternalLink,
    ShieldAlert,
    EyeOff,
    Check
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import StopPropagation from "@/components/stop-propagation"
import { castVote } from "@/app/actions/vote"
import { toast } from "sonner"
import { useState } from "react"
import { SmartEmbed } from "./smart-embed"
import { toggleFollow, hidePost } from "@/app/actions/user"
import { ReportModal } from "@/components/ReportModal"

interface PostCardProps {
    post: {
        id: string
        title: string
        content: string
        postType: string
        mediaUrl?: string | null
        tags: string[]
        createdAt: Date
        author: {
            username: string
            id: string // Needed for follow
            avatarUrl: string | null
            title?: string | null
            isPro?: boolean
            followedBy?: any[]
        }
        _count: {
            comments: number
        }
        votes: any[]
    }
    userId?: string
}

export function CommunityPostCard({ post, userId }: PostCardProps) {
    const [isHidden, setIsHidden] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const tags = Array.isArray(post.tags) ? post.tags : []
    const upvotes = post.votes.filter((v: any) => v.type === 'UP').length
    const downvotes = post.votes.filter((v: any) => v.type === 'DOWN').length
    const score = upvotes - downvotes
    const hasVoted = userId ? post.votes.find((v: any) => v.userId === userId) : null

    // Follow State
    const [isFollowing, setIsFollowing] = useState(
        (post.author.followedBy && post.author.followedBy.length > 0) || false
    )
    const [isFollowPending, setIsFollowPending] = useState(false)

    const handleFollow = async () => {
        if (!userId) {
            toast.error("Please login to follow users")
            return
        }
        // Optimistic Update
        const previousState = isFollowing
        setIsFollowing(!previousState)
        setIsFollowPending(true)

        try {
            const result = await toggleFollow(post.author.id)
            setIsFollowing(result.isFollowing)
            toast.success(result.isFollowing ? `Followed ${post.author.username}` : `Unfollowed ${post.author.username}`)
        } catch (err: any) {
            setIsFollowing(previousState) // Revert
            toast.error(err.message || "Failed to update follow status")
        } finally {
            setIsFollowPending(false)
        }
    }

    const handleHidePost = async () => {
        setIsHidden(true)
        setIsMenuOpen(false)

        if (userId) {
            try {
                await hidePost(post.id)
            } catch (error) {
                console.error("Failed to hide post", error)
            }
        }

        toast.info("Post hidden", {
            description: "You won't see this post for now.",
            action: {
                label: "Undo",
                onClick: () => {
                    setIsHidden(false)
                }
            },
            duration: 3000,
        })
    }

    if (isHidden) return null

    return (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
            {/* Header */}
            <div className="p-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-50">
                        {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-bold text-base">
                                {post.author.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Link href={`/users/${post.author.username}`} className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors">
                                {post.author.username}
                            </Link>
                            {post.author.isPro && (
                                <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                    PRO
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <span>{post.author.title || "User"}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {userId !== post.author.id && (
                        <Button
                            variant={isFollowing ? "outline" : "default"}
                            onClick={handleFollow}
                            disabled={isFollowPending}
                            className={cn(
                                "rounded-xl h-8 px-4 font-bold text-xs shadow-sm transition-all active:scale-95",
                                isFollowing
                                    ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </Button>
                    )}
                    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1.5 hover:bg-slate-50 rounded-full transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
                            <DropdownMenuItem
                                className="flex items-center gap-2 p-2.5 cursor-pointer text-slate-600 rounded-lg focus:bg-slate-100"
                                onSelect={() => setIsReportModalOpen(true)}
                            >
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                <span className="font-medium">Report this post</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex items-center gap-2 p-2.5 cursor-pointer text-slate-600 rounded-lg focus:bg-slate-100"
                                onSelect={(e) => {
                                    e.preventDefault() // Prevent closing efficiently
                                    handleHidePost()
                                }}
                            >
                                <EyeOff className="w-4 h-4" />
                                <span className="font-medium">Hide this post</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 group">
                <Link href={`/dashboard/community/${post.id}`} className="block">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                        {post.title}
                    </h2>
                </Link>

                {post.postType === "IMAGE" && post.mediaUrl && (
                    <Link href={`/dashboard/community/${post.id}`} className="block mb-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <img src={post.mediaUrl} alt={post.title} className="w-full h-auto object-contain max-h-[400px] mx-auto bg-slate-50" />
                    </Link>
                )}

                {post.postType === "VIDEO" && post.mediaUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <video src={post.mediaUrl} className="w-full h-auto max-h-[400px] mx-auto bg-slate-50" controls />
                    </div>
                )}

                {post.postType === "LINK" && post.mediaUrl && (
                    <div className="mb-4">
                        <SmartEmbed url={post.mediaUrl} />
                    </div>
                )}

                {post.content && post.content.trim() !== "" && (
                    <Link href={`/dashboard/community/${post.id}`} className="block mb-4">
                        <p className="text-sm font-normal text-slate-600 leading-relaxed line-clamp-3">
                            {post.content}
                        </p>
                    </Link>
                )}

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tags.map((tag, i) => (
                            <span key={i} className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 transition-colors uppercase tracking-tight">
                                <span className="text-slate-300 mr-1 font-black">#</span>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => castVote(post.id, 'UP')}
                        className="flex items-center gap-1.5 group/btn"
                    >
                        <div className={cn(
                            "p-1.5 rounded-full transition-colors",
                            hasVoted?.type === 'UP' ? "bg-red-50 text-red-500" : "group-hover/btn:bg-red-50 text-slate-400 group-hover/btn:text-red-500"
                        )}>
                            <Heart className={cn("w-4 h-4", hasVoted?.type === 'UP' && "fill-current")} />
                        </div>
                        <span className={cn(
                            "text-sm font-bold min-w-[1ch]",
                            hasVoted?.type === 'UP' ? "text-red-500" : "text-slate-500"
                        )}>
                            {score}
                        </span>
                    </button>

                    <Link href={`/dashboard/community/${post.id}`} className="flex items-center gap-1.5 group/btn cursor-pointer">
                        <div className="p-1.5 rounded-full group-hover/btn:bg-slate-100 transition-colors text-slate-400 group-hover/btn:text-slate-900">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 group-hover/btn:text-slate-900">
                            {post._count.comments}
                        </span>
                    </Link>

                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/dashboard/community/${post.id}`
                            navigator.clipboard.writeText(url)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                        }}
                        className="flex items-center gap-1.5 group/btn"
                    >
                        <div className={cn(
                            "p-1.5 rounded-full transition-colors",
                            copied ? "bg-green-50 text-green-600" : "group-hover/btn:bg-slate-100 text-slate-400 group-hover/btn:text-slate-900"
                        )}>
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        </div>
                        <span className={cn(
                            "text-sm font-bold transition-colors",
                            copied ? "text-green-600" : "text-slate-500 group-hover/btn:text-slate-900"
                        )}>
                            {copied ? "Copied!" : "Share"}
                        </span>
                    </button>
                </div>
            </div>
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetId={post.id}
                targetType="POST"
                targetName="this post"
            />
        </div>
    )
}
