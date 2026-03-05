"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logAdminAction } from "@/lib/audit-log"

export async function sendMassNotification(
    target: "ALL" | "SELLERS" | "BUYERS",
    message: string,
    link: string
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, username: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    if (!message.trim()) throw new Error("Message is required")

    const whereClause = target === "SELLERS"
        ? { activeProfile: "SELLER" as const }
        : target === "BUYERS"
            ? { activeProfile: "BUYER" as const }
            : {}

    const users = await db.user.findMany({
        where: whereClause,
        select: { id: true }
    })

    if (users.length === 0) throw new Error("No users found for this target group")

    const finalLink = link.trim() || "/dashboard"

    // Batch create notifications
    await db.notification.createMany({
        data: users.map(u => ({
            userId: u.id,
            text: `📢 ${message}`,
            link: finalLink,
        }))
    })

    await logAdminAction(
        session.user.id,
        admin.username || "Admin",
        `Sent announcement to ${target} (${users.length} users)`,
        "Notification",
        undefined,
        message
    )

    revalidatePath("/admin/announcements")
    return { success: true, count: users.length }
}

export async function sendUserNotification(
    username: string,
    message: string,
    link: string
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, username: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    if (!message.trim()) throw new Error("Message is required")

    const trimmed = username.trim().replace(/^@/, "")
    if (!trimmed) throw new Error("Username is required")

    const targetUser = await db.user.findUnique({
        where: { username: trimmed },
        select: { id: true, username: true }
    })

    if (!targetUser) throw new Error(`User "@${trimmed}" not found`)

    const finalLink = link.trim() || "/dashboard"

    await db.notification.create({
        data: {
            userId: targetUser.id,
            text: `📢 ${message}`,
            link: finalLink,
        }
    })

    await logAdminAction(
        session.user.id,
        admin.username || "Admin",
        `Sent direct notification to @${targetUser.username}`,
        "Notification",
        targetUser.id,
        message
    )

    revalidatePath("/admin/announcements")
    return { success: true, username: targetUser.username }
}
