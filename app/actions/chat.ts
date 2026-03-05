"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function startConversation(otherUserId: string) {
  const session = await auth()
  if (!session?.user?.id) return redirect("/api/auth/signin")

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return redirect("/dashboard")

  const myId = session.user.id

  // Prevent messaging self
  if (myId === otherUserId) {
    return redirect('/dashboard') // Redirect to dashboard instead of trying to build profile URL
  }

  // 1. Check if conversation already exists
  let conversation = await db.conversation.findFirst({
    where: {
      OR: [
        { userAId: myId, userBId: otherUserId },
        { userAId: otherUserId, userBId: myId },
      ]
    }
  })

  // 2. If not, create it
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        userAId: myId,
        userBId: otherUserId,
        initiatorId: myId,
        status: "PENDING"
      }
    })
  }

  // 3. Redirect to the inbox page for this conversation
  redirect(`/dashboard/messages/${conversation.id}`)
}

export async function startConversationD2(otherUserId: string) {
  const session = await auth()
  if (!session?.user?.id) return redirect("/api/auth/signin")

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return redirect("/dashboard")

  const myId = session.user.id

  // Prevent messaging self
  if (myId === otherUserId) {
    return redirect('/dashboard')
  }

  // 1. Check if conversation already exists
  let conversation = await db.conversation.findFirst({
    where: {
      OR: [
        { userAId: myId, userBId: otherUserId },
        { userAId: otherUserId, userBId: myId },
      ]
    }
  })

  // 2. If not, create it
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        userAId: myId,
        userBId: otherUserId,
        initiatorId: myId,
        status: "PENDING"
      }
    })
  }

  // 3. Redirect to the dashboard messages page for this conversation
  redirect(`/dashboard/messages/${conversation.id}`)
}

export async function sendMessage(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return

  const text = formData.get("text") as string
  const conversationId = formData.get("conversationId") as string

  if (!text || !conversationId) return

  const myId = session.user.id

  // 1. Fetch current conversation to check status
  const conv = await db.conversation.findUnique({
    where: { id: conversationId }
  })

  if (!conv) return

  // 2. If the sender is NOT the initiator and the conversation is PENDING, 
  // then replying (sending a message) automatically accepts the request.
  if (conv.status === "PENDING" && conv.initiatorId !== myId) {
    await db.conversation.update({
      where: { id: conversationId },
      data: { status: "ACCEPTED" }
    })
  }

  // 3. Create the Message
  await db.message.create({
    data: {
      text,
      conversationId,
      senderId: myId
    }
  })

  // 4. Update conversation timestamp (to bump it to top of list)
  const conversation = await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
    include: { userA: true, userB: true } // Fetch users to know who to notify
  })

  // 5. Send Notification to the OTHER person
  if (conversation) {
    const recipientId = conversation.userAId === myId
      ? conversation.userBId
      : conversation.userAId

    const isRequest = conv.status === "PENDING" && recipientId !== conv.initiatorId;
    const notificationText = isRequest
      ? `New message request from ${session.user.name || "User"}`
      : `New message from ${session.user.name || "User"}`;

    await createNotification(
      recipientId,
      notificationText,
      `/dashboard/messages/${conversationId}${isRequest ? '?tab=requests' : ''}`
    )
  }

  revalidatePath(`/dashboard/messages/${conversationId}`)
}

export async function acceptConversation(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const conversation = await db.conversation.update({
    where: { id: conversationId },
    data: { status: "ACCEPTED" },
    include: { userA: true, userB: true }
  })

  // Notify the other person (the initiator usually)
  const recipientId = conversation.userAId === session.user.id
    ? conversation.userBId
    : conversation.userAId

  await createNotification(
    recipientId,
    `${session.user.name || "User"} accepted your message request`,
    `/dashboard/messages/${conversationId}`
  )

  revalidatePath(`/dashboard/messages/${conversationId}`)
}

export async function declineConversation(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await db.conversation.update({
    where: { id: conversationId },
    data: { status: "DECLINED" }
  })

  redirect("/dashboard/messages")
}