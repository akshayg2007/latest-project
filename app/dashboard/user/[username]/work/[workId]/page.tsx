import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ExternalLink, BadgeCheck } from "lucide-react"

export const dynamic = 'force-dynamic'

interface WorkDetailPageProps {
    params: Promise<{
        username: string
        workId: string
    }>
}

function getRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { username, workId } = await params

    // Decode username logic
    const rawUsername = decodeURIComponent(username)
    const strippedUsername = rawUsername.startsWith("@") ? rawUsername.slice(1) : rawUsername

    // Fetch user and portfolio item
    const user = await db.user.findFirst({
        where: {
            OR: [
                { username: rawUsername },
                { username: strippedUsername },
            ],
        },
    })

    if (!user) return notFound()

    const workItem = await db.portfolioItem.findUnique({
        where: { id: workId },
    })

    if (!workItem || workItem.userId !== user.id) return notFound()

    const relativeTime = getRelativeTime(workItem.createdAt)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Back Button */}
                <Link
                    href={`/dashboard/user/${username}`}
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Profile
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left: Image */}
                    <div className="space-y-4">
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/50 bg-muted">
                            <Image
                                src={workItem.mediaUrl}
                                alt={workItem.title || "Work Item"}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="space-y-8">
                        {/* Profile Picture and Username */}
                        <div className="flex items-center gap-2">
                            <Link href={`/dashboard/user/${username}`} className="flex items-center gap-2 group">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                    <Image
                                        src={user.avatarUrl || "/placeholder-user.jpg"}
                                        alt={user.username}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {user.username}
                                </span>
                            </Link>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="text-xs text-muted-foreground">
                                {relativeTime}
                            </span>
                        </div>

                        {/* Work Title */}
                        <div>
                            <h1 className="text-3xl font-bold text-foreground leading-tight">
                                {workItem.title}
                            </h1>
                        </div>

                        {/* Original Work Badge */}
                        <div className="flex items-center gap-2 text-green-600 bg-green-50/50 w-fit px-3 py-1.5 rounded-full border border-green-100">
                            <BadgeCheck className="w-4 h-4" />
                            <span className="text-xs font-semibold">Verified Original Work</span>
                        </div>

                        {/* Skills and Tools */}
                        <div className="space-y-6">
                            {/* Skills */}
                            {workItem.skills && workItem.skills.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {workItem.skills.map((skill: string, i: number) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tools */}
                            {workItem.tools && workItem.tools.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tools Used</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {workItem.tools.map((tool: string, i: number) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium"
                                            >
                                                {tool}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* View Project Button */}
                        {workItem.link && (
                            <div>
                                <a
                                    href={workItem.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button className="rounded-full h-11 px-6 font-bold flex items-center gap-2">
                                        View Project <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
