import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ChatInterface from "@/components/ChatInterface"

interface PageProps {
  params: Promise<{ conversationId: string }>
}

export default async function InboxPage({ params }: PageProps) {
  const session = await auth()

  // FIXED: Check specifically for user.id to satisfy TypeScript
  if (!session?.user?.id) return redirect("/api/auth/signin")

  const { conversationId } = await params

  // 1. Fetch Conversation & Messages
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      userA: true,
      userB: true,
      messages: {
        orderBy: { createdAt: 'asc' }, // Oldest first
        include: { sender: true }
      }
    }
  })

  if (!conversation) return <div>Conversation not found</div>

  // 2. Determine who is "The Other Person"
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