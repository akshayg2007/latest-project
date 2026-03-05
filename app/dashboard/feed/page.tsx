import { auth } from "@/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    MessageSquare,
    Plus,
    Search,
    TrendingUp,
    Clock,
    Flame,
    Info,
    ShieldAlert
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { VoteButtons } from "@/components/forum/vote-buttons"
import { ShareButton } from "@/components/forum/share-button"
import StopPropagation from "@/components/stop-propagation"
import { cn } from "@/lib/utils"
import { CommunityPostCard } from "@/components/community/post-card"

// 1. FORCE DYNAMIC: Ensures the page rebuilds when URL params change
export const dynamic = 'force-dynamic'

export default async function CommunityFeedPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string; sort?: string }>
}) {
    const session = await auth()
    const userId = session?.user?.id

    // 2. AWAIT PARAMETERS (Next.js 15 Fix)
    const params = await searchParams;
    const query = params.q || ""
    const sort = params.sort || "new"

    // 3. LOGIC: Determine Sort Order
    let orderBy: any = { createdAt: 'desc' }

    if (sort === "popular") {
        // Sort by Comment Count (Most discussed)
        orderBy = { comments: { _count: 'desc' } }
    } else if (sort === "top") {
        // Sort by Vote Count (Most active engagement)
        orderBy = { votes: { _count: 'desc' } }
    }

    // 4. MEMBERS COUNT
    const memberCount = await db.user.count()

    const posts = await db.post.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                },
                {
                    hiddenBy: userId ? { none: { userId: userId } } : {}
                }
            ]
        },
        orderBy: orderBy,
        include: {
            author: true,
            votes: true,
            _count: { select: { comments: true } }
        }
    })

    // Helper to build links
    const getSortLink = (sortType: string) => {
        return `/dashboard/community/feed?sort=${sortType}${query ? `&q=${query}` : ""}`
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-xl font-semibold md:text-2xl">Community Feed</h1>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <form>
                            <input type="hidden" name="sort" value={sort} />
                            <Input
                                name="q"
                                placeholder="Search topics..."
                                className="pl-9"
                                defaultValue={query}
                            />
                        </form>
                    </div>
                    <Link href="/community/create">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Post
                        </Button>
                    </Link>
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

                {/* FEED */}
                <div className="space-y-6">

                    {/* SORT TABS */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
                        <Link href={getSortLink("new")}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 text-xs font-medium",
                                    sort === "new" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <Clock className="w-3.5 h-3.5 mr-2" /> Newest
                            </Button>
                        </Link>

                        <Link href={getSortLink("popular")}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 text-xs font-medium",
                                    sort === "popular" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <Flame className="w-3.5 h-3.5 mr-2" /> Popular
                            </Button>
                        </Link>

                        <Link href={getSortLink("top")}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 text-xs font-medium",
                                    sort === "top" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <TrendingUp className="w-3.5 h-3.5 mr-2" /> Top All Time
                            </Button>
                        </Link>
                    </div>

                    {/* POSTS LIST */}
                    <div className="space-y-4">
                        {posts.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-slate-900">No posts found</h3>
                                <p className="text-slate-500 text-sm">Be the first to share something!</p>
                            </div>
                        ) : (
                            posts.map((post: any) => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    userId={userId}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* SIDEBAR */}
                <div className="hidden lg:block space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-24">
                        <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                            <Info className="w-5 h-5 text-blue-600" />
                            <h3>About Community</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            The premier place for TrueWork freelancers to share knowledge.
                        </p>
                        <div className="flex gap-4 text-sm border-t border-slate-100 pt-4 mb-4">
                            <div>
                                <p className="font-bold text-slate-900">{posts.length}</p>
                                <p className="text-slate-500 text-xs">Posts</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{memberCount.toLocaleString()}</p>
                                <p className="text-slate-500 text-xs">Members</p>
                            </div>
                        </div>
                        {/* <Link href="/forum/create">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">Create Post</Button>
                    </Link> */}
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-sm">
                            <ShieldAlert className="w-4 h-4" />
                            <h3>Posting Rules</h3>
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
    )
}
