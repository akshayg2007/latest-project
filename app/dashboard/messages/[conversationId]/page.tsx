import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ChatInterface from "@/components/ChatInterface"

interface PageProps {
    params: Promise<{ conversationId: string }>
}

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: PageProps) {
    const session = await auth()

    if (!session?.user?.id) return redirect("/api/auth/signin")

    const { conversationId } = await params

    // Fetch Conversation & Messages
    const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
            userA: true,
            userB: true,
            messages: {
                orderBy: { createdAt: 'asc' },
                include: { sender: true }
            }
        }
    })

    if (!conversation) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                    ⚠️
                </div>
                <h3 className="text-lg font-semibold text-foreground">Conversation Not Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    This conversation may have been deleted or doesn&apos;t exist.
                </p>
            </div>
        )
    }

    // Verify user is part of this conversation
    if (conversation.userAId !== session.user.id && conversation.userBId !== session.user.id) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-500">
                    🔒
                </div>
                <h3 className="text-lg font-semibold text-foreground">Access Denied</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    You don&apos;t have permission to view this conversation.
                </p>
            </div>
        )
    }

    // Determine who is "The Other Person"
    const isUserA = conversation.userAId === session.user.id
    const otherUser = isUserA ? conversation.userB : conversation.userA

    return (
        <div className="h-full w-full">
            <ChatInterface
                conversationId={conversation.id}
                currentUserId={session.user.id}
                status={(conversation as any).status}
                initiatorId={(conversation as any).initiatorId}
                otherUser={{
                    username: otherUser.username,
                    avatarUrl: otherUser.avatarUrl
                }}
                initialMessages={conversation.messages as any}
            />
        </div>
    )
}
