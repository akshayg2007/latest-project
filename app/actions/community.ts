"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { VoteType } from "@prisma/client"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function createPost(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return

    const content = formData.get("content") as string
    if (!content || !content.trim()) return

    try {
        await db.post.create({
            data: {
                title: content.slice(0, 50) || "Untitled Post",
                content,
                authorId: session.user.id,
            }
        })

        revalidatePath("/dashboard/community")
    } catch (error) {
        console.error("Failed to create post:", error)
    }
}

export async function toggleLike(postId: string) {
    const session = await auth()
    if (!session?.user?.id) return

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return

    const userId = session.user.id

    try {
        const existing = await db.vote.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        })

        if (existing) {
            await db.vote.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId
                    }
                }
            })
        } else {
            await db.vote.create({
                data: {
                    userId,
                    postId,
                    type: "UP" as VoteType
                }
            })
        }

        revalidatePath("/dashboard/community")
    } catch (error) {
        console.error("Failed to toggle like:", error)
    }
}
export async function getPostForEdit(postId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const post = await db.post.findUnique({
        where: { id: postId }
    })

    if (!post || post.authorId !== session.user.id) return null

    return post
}

export async function updatePost(postId: string, data: { content: string }) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    try {
        const post = await db.post.findUnique({
            where: { id: postId }
        })

        if (!post || post.authorId !== session.user.id) {
            return { error: "Post not found or unauthorized" }
        }

        await db.post.update({
            where: { id: postId },
            data: {
                content: data.content,
                title: data.content.slice(0, 50) || post.title
            }
        })

        revalidatePath("/dashboard/community")
        return { success: true }
    } catch (err) {
        console.error("Update Post Error:", err)
        return { error: "Failed to update post" }
    }
}

export async function deletePost(postId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const post = await db.post.findUnique({
            where: { id: postId }
        })

        if (!post || post.authorId !== session.user.id) {
            return { error: "Post not found or unauthorized" }
        }

        await db.post.delete({
            where: { id: postId }
        })

        revalidatePath("/dashboard/community")
        return { success: true }
    } catch (err) {
        console.error("Delete Post Error:", err)
        return { error: "Failed to delete post" }
    }
}
