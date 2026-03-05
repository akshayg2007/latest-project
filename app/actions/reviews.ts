"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"
import { logAdminAction } from "@/lib/audit-log"

export async function moderateReview(reviewId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, username: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    if (!reason.trim()) throw new Error("Reason is required")

    const review = await db.review.findUnique({
        where: { id: reviewId },
        select: { id: true, authorId: true, comment: true, isRemoved: true, orderId: true }
    })

    if (!review) throw new Error("Review not found")

    await db.review.update({
        where: { id: reviewId },
        data: {
            isRemoved: true,
            removalReason: reason
        }
    })

    await createNotification(
        review.authorId,
        `Your review has been removed by an administrator. Reason: ${reason}`,
        "/dashboard"
    )

    await logAdminAction(
        session.user.id,
        admin.username || "Admin",
        "Removed review",
        "Review",
        reviewId,
        `Reason: ${reason}`
    )

    revalidatePath("/admin/moderation/reviews")
    return { success: true }
}

export async function restoreReview(reviewId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, username: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const review = await db.review.findUnique({
        where: { id: reviewId },
        select: { id: true, authorId: true, isRemoved: true }
    })

    if (!review) throw new Error("Review not found")
    if (!review.isRemoved) throw new Error("Review is not removed")

    await db.review.update({
        where: { id: reviewId },
        data: {
            isRemoved: false,
            removalReason: null
        }
    })

    await createNotification(
        review.authorId,
        `Your review has been restored by an administrator.`,
        "/dashboard"
    )

    await logAdminAction(
        session.user.id,
        admin.username || "Admin",
        "Restored review",
        "Review",
        reviewId
    )

    revalidatePath("/admin/moderation/reviews")
    return { success: true }
}
