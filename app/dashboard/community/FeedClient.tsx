"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Image as ImageIcon,
    Send,
    TrendingUp,
    Users
} from "lucide-react"
import { createPost, toggleLike } from "@/app/actions/community"

export interface Post {
    id: string
    author: {
        name: string
        avatar: string
        title: string
        verified: boolean
    }
    content: string
    likes: number
    comments: number
    shares: number
    time: string
    liked: boolean
}

export interface SuggestedUser {
    id: string
    name: string
    title: string
    avatar: string
    initials: string
}

export interface TrendingCategory {
    name: string
    count: number
}

interface FeedClientProps {
    initialPosts: Post[]
    suggestedUsers: SuggestedUser[]
    trendingCategories: TrendingCategory[]
}

function FeedPost({ post }: { post: Post }) {
    // Optimistic UI for likes
    const [liked, setLiked] = useState(post.liked)
    const [likes, setLikes] = useState(post.likes)

    const handleLike = async () => {
        // Optimistic update
        const newLiked = !liked
        setLiked(newLiked)
        setLikes(newLiked ? likes + 1 : likes - 1)

        // Server action
        await toggleLike(post.id)
    }

    return (
        <Card>
            <CardContent className="pt-5">
                {/* Author Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {post.author.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={post.author.avatar}
                                alt={post.author.name}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {post.author.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{post.author.name}</p>
                                {post.author.verified && (
                                    <Badge variant="secondary" className="text-xs px-1.5">Pro</Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">{post.author.title} • {post.time}</p>
                        </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <p className="text-sm text-foreground whitespace-pre-line mb-4">
                    {post.content}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={liked ? "text-red-500" : ""}
                            onClick={handleLike}
                        >
                            <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
                            {likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            {post.shares}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function CommunityFeedClient({ initialPosts, suggestedUsers, trendingCategories }: FeedClientProps) {
    const { data: session } = useSession()
    const userInitials = session?.user?.name?.slice(0, 2).toUpperCase() || "U"

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Community Feed</h1>
                <p className="text-muted-foreground mt-1">
                    Connect with freelancers and share your work
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Create Post */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {userInitials}
                                </div>
                                <div className="flex-1">
                                    <form action={async (formData) => {
                                        await createPost(formData)
                                        // Reset form logic would go here, for now relying on server revalidation
                                        // A ref would be better for resetting HTMLFormElement
                                        const form = document.getElementById("create-post-form") as HTMLFormElement
                                        if (form) form.reset()
                                    }} id="create-post-form">
                                        <Textarea
                                            name="content"
                                            placeholder="Share something with the community..."
                                            className="min-h-[80px] resize-none"
                                        />
                                        <div className="flex items-center justify-between mt-3">
                                            <Button type="button" variant="ghost" size="sm">
                                                <ImageIcon className="h-4 w-4 mr-2" />
                                                Add Image
                                            </Button>
                                            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                <Send className="h-4 w-4 mr-2" />
                                                Post
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Posts */}
                    {initialPosts.length > 0 ? (
                        initialPosts.map((post) => (
                            <FeedPost key={post.id} post={post} />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <p>No posts yet. Be the first to share!</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Trending Categories */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">Trending Categories</h3>
                            </div>
                            <div className="space-y-3">
                                {trendingCategories.map((category) => (
                                    <div key={category.name} className="flex items-center justify-between">
                                        <span className="text-sm text-blue-600 hover:underline cursor-pointer">{category.name}</span>
                                        <span className="text-xs text-muted-foreground">{category.count} gigs</span>
                                    </div>
                                ))}
                                {trendingCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No trends yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Suggested Connections */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">Suggested to Follow</h3>
                            </div>
                            <div className="space-y-3">
                                {suggestedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {user.avatar ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={user.avatar} className="h-8 w-8 rounded-full object-cover" alt={user.name} />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                    {user.initials}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.title}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">Follow</Button>
                                    </div>
                                ))}
                                {suggestedUsers.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No suggestions available.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
