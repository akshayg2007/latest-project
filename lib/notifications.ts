import { db } from "@/lib/db"

export async function createNotification(userId: string, text: string, link: string) {
  try {
    // 1. Check if an UNREAD notification already exists for this exact link
    const existingNotification = await db.notification.findFirst({
      where: {
        userId,
        link,
        isRead: false
      }
    })

    if (existingNotification) {
      // 2. If it exists, just "bump" it to the top (update time)
      // We can also optionally update the text if you want (e.g., "New messages...")
      // But keeping it simple prevents complexity.
      await db.notification.update({
        where: { id: existingNotification.id },
        data: { 
            createdAt: new Date(),
            text: text // Update text in case it changed (e.g. "5 messages" vs "1 message")
        }
      })
      return
    }

    // 3. If no existing unread notification, create a new one
    await db.notification.create({
      data: {
        userId,
        text,
        link,
      }
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
  }
}