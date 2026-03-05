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
import { Plus } from "lucide-react"
import { ReportModal } from "@/components/ReportModal"

interface PostDetailViewProps {
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
            id: string // needed for follow
            avatarUrl: string | null
            title?: string | null
            isPro?: boolean
            followedBy?: any[]
        }
        votes: any[]
    }
    userId?: string
    commentCount: number
}

export function PostDetailView({ post, userId, commentCount }: PostDetailViewProps) {
    const [copied, setCopied] = useState(false)
    const [isHidden, setIsHidden] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)

    const upvotes = post.votes.filter((v: any) => v.type === 'UP').length
    const downvotes = post.votes.filter((v: any) => v.type === 'DOWN').length
    const score = upvotes - downvotes
    const hasVoted = userId ? post.votes.find((v: any) => v.userId === userId) : null
    const tags = Array.isArray(post.tags) ? post.tags : []

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

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleHidePost = async () => {
        setIsHidden(true)
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
                onClick: () => setIsHidden(false)
            },
            duration: 3000,
        })
    }

    if (isHidden) return (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
            <EyeOff className="w-10 h-10 text-slate-300 mb-4" />
            <h3 className="text-slate-900 font-bold text-lg mb-1">Post Hidden</h3>
            <p className="text-slate-500 mb-6 max-w-xs">You've chosen to hide this post. It won't be visible to you for now.</p>
            <Button variant="outline" onClick={() => setIsHidden(false)}>
                Undo
            </Button>
        </div>
    )

    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-50">
                        {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-bold text-lg">
                                {post.author.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                                {post.author.username}
                            </span>
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

                <div className="flex items-center gap-3">
                    {userId !== post.author.id && (
                        <Button
                            variant={isFollowing ? "outline" : "default"}
                            onClick={handleFollow}
                            disabled={isFollowPending}
                            className={cn(
                                "rounded-xl h-10 px-6 font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2",
                                isFollowing
                                    ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                        >
                            {isFollowing ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <Plus className="w-3.5 h-3.5" />
                                    Follow
                                </>
                            )}
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2.5 hover:bg-slate-50 rounded-full transition-colors">
                                <MoreHorizontal className="w-6 h-6 text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                            <DropdownMenuItem
                                className="flex items-center gap-3 p-3 cursor-pointer text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                                onClick={() => setShowReportModal(true)}
                            >
                                <ShieldAlert className="w-5 h-5" />
                                <span className="font-semibold">Report this post</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex items-center gap-3 p-3 cursor-pointer text-slate-600 rounded-xl transition-colors"
                                onClick={handleHidePost}
                            >
                                <EyeOff className="w-5 h-5" />
                                <span className="font-semibold">Hide this post</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-6 md:px-10 pb-8">
                <h1 className="text-2xl md:text-[32px] font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                    {post.title}
                </h1>

                {post.postType === "IMAGE" && post.mediaUrl && (
                    <div className="mb-8 rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                        <img src={post.mediaUrl} alt={post.title} className="w-full h-auto object-contain max-h-[800px] mx-auto bg-slate-50" />
                    </div>
                )}

                {post.postType === "VIDEO" && post.mediaUrl && (
                    <div className="mb-8 rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                        <video src={post.mediaUrl} className="w-full h-auto max-h-[800px] mx-auto bg-slate-50" controls />
                    </div>
                )}

                {post.postType === "LINK" && post.mediaUrl && (
                    <div className="mb-8">
                        <SmartEmbed url={post.mediaUrl} />
                    </div>
                )}

                {post.content && post.content.trim() !== "" && (
                    <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-[1.8] mb-10 font-medium">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                )}

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mb-10">
                        {tags.map((tag, i) => (
                            <span key={i} className="text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-white transition-all cursor-default">
                                <span className="text-slate-300 mr-1.5 font-black">#</span>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Engagement Bar */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => castVote(post.id, 'UP')}
                            className="flex items-center gap-2.5 group/btn"
                        >
                            <div className={cn(
                                "p-2.5 rounded-full transition-all duration-300",
                                hasVoted?.type === 'UP' ? "bg-red-50 text-red-500 shadow-sm" : "bg-slate-50 text-slate-400 group-hover/btn:bg-red-50 group-hover/btn:text-red-500"
                            )}>
                                <Heart className={cn("w-5 h-5 transition-transform group-hover/btn:scale-110", hasVoted?.type === 'UP' && "fill-current")} />
                            </div>
                            <span className={cn(
                                "text-sm font-black min-w-[1ch] tracking-tight",
                                hasVoted?.type === 'UP' ? "text-red-500" : "text-slate-500"
                            )}>
                                {score}
                            </span>
                        </button>

                        <div className="flex items-center gap-2.5 group cursor-default">
                            <div className="p-2.5 rounded-full bg-slate-50 text-slate-400 transition-colors">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-slate-500 tracking-tight">
                                {commentCount} <span className="text-slate-400 font-bold ml-0.5">Comments</span>
                            </span>
                        </div>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 group/btn"
                        >
                            <div className={cn(
                                "p-2.5 rounded-full transition-all",
                                copied ? "bg-green-50 text-green-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                            )}>
                                {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
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
            </div>

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetId={post.id}
                targetType="POST"
                targetName="this post"
            />
        </div>
    )
}
