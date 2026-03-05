"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function markNotificationRead(notificationId: string) {
  const session = await auth()
  if (!session?.user) return

  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })

  revalidatePath("/dashboard")
}

// --- ADD THIS NEW FUNCTION ---
export async function markAllNotificationsRead() {
  const session = await auth()
  if (!session?.user) return

  await db.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false // Only update the unread ones
    },
    data: { isRead: true }
  })

  revalidatePath("/dashboard")
}

export async function deleteNotification(notificationId: string) {
  const session = await auth()
  if (!session?.user) return

  // Only delete if the notification belongs to the current user
  await db.notification.deleteMany({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
  })

  revalidatePath("/dashboard")
}