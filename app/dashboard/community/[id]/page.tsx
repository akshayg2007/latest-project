import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { CommentItem } from "@/components/forum/comment-item"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addComment } from "@/app/actions/forum"
import { PostDetailView } from "@/components/community/post-detail-view"
import {
    MessageSquare,
    ArrowLeft,
    ShieldAlert,
    Info,
    Calendar,
    MoreHorizontal
} from "lucide-react"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function SinglePostPage(props: PageProps) {
    const params = await props.params;
    const session = await auth()
    const userId = session?.user?.id

    // 1. Fetch Post Info
    const post = await db.post.findUnique({
        where: { id: params.id },
        include: {
            author: {
                include: {
                    followedBy: userId ? { where: { followerId: userId } } : false
                }
            },
            votes: true,
        }
    })

    if (!post) return notFound()

    // Check viewer admin status
    const viewer = userId ? await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
    }) : null
    const isViewerAdmin = viewer?.role === "ADMIN"
    const isPostAuthor = userId === post.authorId

    // Shadow ban check for post: If author is shadow banned, only they and admins can see it
    if ((post.author as any).isShadowBanned && !isPostAuthor && !isViewerAdmin) {
        return notFound()
    }

    // Removal check: If post is removed, only admins and the author can see it
    // @ts-ignore
    if (post.isRemoved && !isPostAuthor && !isViewerAdmin) {
        return notFound()
    }

    // 2. Fetch ALL Comments
    const allComments = await db.comment.findMany({
        where: {
            postId: params.id,
            // We fetch all and filter in memory to handle the author/admin visibility
        },
        include: {
            author: true,
            votes: true,
        },
        orderBy: { createdAt: 'asc' }
    })

    // Filter comments based on shadow ban and removed status
    const filteredComments = allComments.filter(comment => {
        const isCommentAuthor = userId === comment.authorId

        // Removed check
        // @ts-ignore
        if (comment.isRemoved && !isCommentAuthor && !isViewerAdmin) {
            return false
        }

        // Shadow ban check
        if ((comment.author as any).isShadowBanned && !isCommentAuthor && !isViewerAdmin) {
            return false
        }

        return true
    })

    // 3. Build Tree Structure
    const commentMap = new Map()
    const rootComments: any[] = []

    filteredComments.forEach((comment) => {
        // @ts-ignore
        comment.replies = []
        commentMap.set(comment.id, comment)
    })

    filteredComments.forEach((comment) => {
        if (comment.parentId) {
            const parent = commentMap.get(comment.parentId)
            if (parent) {
                parent.replies.push(comment)
            }
        } else {
            rootComments.push(comment)
        }
    })

    // Sort root comments: Newest on top usually feels better for top-level
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 4. Calculate Scores
    const upvotes = post.votes.filter(v => v.type === 'UP').length
    const downvotes = post.votes.filter(v => v.type === 'DOWN').length
    const score = upvotes - downvotes
    const userVote = userId ? post.votes.find((v) => v.userId === userId)?.type : null

    return (
        <div className="min-h-screen bg-slate-50/50 py-8">
            <div className="max-w-6xl mx-auto px-4">

                {/* BACK BUTTON */}
                <div className="mb-6">
                    <Link href="/dashboard/community" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Feed
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

                    {/* --- LEFT COLUMN: POST & COMMENTS --- */}
                    <div className="min-w-0"> {/* min-w-0 prevents flex items from overflowing */}

                        {/* 1. THE POST DETAIL VIEW */}
                        <div className="mb-6">
                            <PostDetailView
                                post={post as any}
                                userId={userId}
                                commentCount={allComments.length}
                            />
                        </div>

                        {/* 2. COMMENT INPUT */}
                        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 mb-8 shadow-sm">
                            {session?.user ? (
                                <form action={addComment}>
                                    <input type="hidden" name="postId" value={post.id} />
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {session.user.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <label className="text-sm font-bold text-slate-700">
                                                Comment as <span className="text-blue-600">u/{session.user.name}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Textarea
                                            name="text"
                                            placeholder="What are your thoughts?"
                                            className="min-h-[140px] resize-none bg-slate-50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-200 transition-all p-5 text-base"
                                            required
                                        />
                                        <div className="absolute bottom-4 right-4">
                                            <Button type="submit" size="sm" className="bg-black hover:bg-black/90 text-white font-bold h-10 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/5">
                                                Post Comment
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                    <p className="text-slate-500 mb-4 font-medium">Log in to join the discussion.</p>
                                    <Link href="/api/auth/signin">
                                        <Button variant="outline">Sign In</Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* 3. COMMENT TREE */}
                        <div className="space-y-6">
                            {rootComments.length === 0 && (
                                <div className="text-center py-10 text-slate-400">
                                    <p>No comments yet. Be the first to share your thoughts!</p>
                                </div>
                            )}
                            {rootComments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    currentUserId={userId}
                                    postId={post.id}
                                />
                            ))}
                        </div>

                    </div>

                    {/* --- RIGHT COLUMN: SIDEBAR --- */}
                    <div className="hidden lg:block space-y-6">

                        {/* About Community (Reused for consistency) */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-24">
                            <div className="bg-slate-100 rounded-t-xl -mx-5 -mt-5 h-12 mb-4 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold">
                                <Info className="w-5 h-5 text-blue-600" />
                                <h3>About our Community</h3>
                            </div>
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                The premier place for TrueWork freelancers to share knowledge, ask questions, and grow together.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                                <Calendar className="w-4 h-4" />
                                <span>Created Jan 13, 2026</span>
                            </div>
                        </div>

                        {/* Rules Card */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                            <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-sm">
                                <ShieldAlert className="w-4 h-4" />
                                <h3>Community Rules</h3>
                            </div>
                            <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4">
                                <li>Be respectful to other members.</li>
                                <li>No spam or self-promotion.</li>
                                <li>Use clear and descriptive titles.</li>
                            </ul>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}
