"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function moderateCommunityPost(postId: string, reason: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

    await db.post.update({
        where: { id: postId },
        data: {
            isRemoved: true,
            removalReason: reason
        }
    })

    revalidatePath("/admin/moderation/community")
    revalidatePath("/dashboard/community")
    revalidatePath(`/dashboard/community/${postId}`)

    return { success: true }
}

export async function restoreCommunityPost(postId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

    await db.post.update({
        where: { id: postId },
        data: {
            isRemoved: false,
            removalReason: null
        }
    })

    revalidatePath("/admin/moderation/community")
    revalidatePath("/dashboard/community")
    revalidatePath(`/dashboard/community/${postId}`)

    return { success: true }
}

export async function moderateCommunityComment(commentId: string, reason: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

    const comment = await db.comment.update({
        where: { id: commentId },
        data: {
            isRemoved: true,
            removalReason: reason
        }
    })

    revalidatePath("/admin/moderation/community")
    revalidatePath(`/dashboard/community/${comment.postId}`)

    return { success: true }
}

export async function restoreCommunityComment(commentId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

    const comment = await db.comment.update({
        where: { id: commentId },
        data: {
            isRemoved: false,
            removalReason: null
        }
    })

    revalidatePath("/admin/moderation/community")
    revalidatePath(`/dashboard/community/${comment.postId}`)

    return { success: true }
}
