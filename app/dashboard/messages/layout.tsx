import { auth } from "@/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

import { ConversationList } from "@/components/messages/ConversationList"

export const dynamic = 'force-dynamic'

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/api/auth/signin")

    const conversations = await db.conversation.findMany({
        where: {
            OR: [{ userAId: session.user.id }, { userBId: session.user.id }]
        },
        include: {
            userA: true,
            userB: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    // Count unread messages (simplified)
    const unreadCount = conversations.filter(conv => {
        const lastMsg = conv.messages[0]
        if (!lastMsg) return false
        const isFromOther = lastMsg.senderId !== session.user.id
        const isRecent = Date.now() - new Date(lastMsg.createdAt).getTime() < 24 * 60 * 60 * 1000
        return isFromOther && isRecent && (conv as any).status === "ACCEPTED" // Only count accepted ones as new primary
    }).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-semibold md:text-2xl">Messages</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                    Communicate with your clients and collaborators
                </p>
            </div>

            {/* Messages Layout */}
            <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[400px] sm:min-h-[500px] lg:h-[600px]">
                {/* Conversations List Sidebar */}
                <div className="lg:col-span-1 flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                    <div className="p-4 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search messages..." className="pl-9" />
                        </div>
                    </div>

                    <ConversationList
                        conversations={conversations as any[]}
                        currentUserId={session.user.id}
                    />
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    )
}
