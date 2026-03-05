"use server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { VoteType } from "@prisma/client"
import { redirect } from "next/navigation"
import { checkUserRestriction } from "@/lib/checkSuspension"

// 1. Create Post
export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return { error: restriction }

  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const postType = (formData.get("postType") as string) || "TEXT"
  const mediaUrl = formData.get("mediaUrl") as string | null
  const tagsString = formData.get("tags") as string
  const tags = tagsString ? tagsString.split(",").filter(t => t.trim() !== "") : []

  if (!title) return { error: "Title is required." }

  try {
    const post = await db.post.create({
      data: {
        title,
        content: content || "",
        postType,
        mediaUrl,
        tags,
        authorId: session.user.id
      }
    })
    console.log("Post created successfully:", post.id)
  } catch (error: any) {
    if (error.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("CREATE POST ERROR DETAILED:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    return { error: `Failed to create post: ${error.message || "Unknown error"}` }
  }

  revalidatePath("/dashboard/community")
  revalidatePath("/dashboard/community/feed")
  redirect("/dashboard/community")
}

// 2. Add Comment (Now supports Replies!)
export async function addComment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return

  const text = formData.get("text") as string
  const postId = formData.get("postId") as string
  const parentId = formData.get("parentId") as string | null // <--- Handle Replies

  if (!text || !postId) return

  await db.comment.create({
    data: {
      text,
      postId,
      authorId: session.user.id,
      parentId: parentId || null
    }
  })

  revalidatePath(`/dashboard/community/${postId}`)
  revalidatePath("/dashboard/community/feed")
}

// 3. Cast Comment Vote (The missing function!)
export async function castCommentVote(commentId: string, type: VoteType) {
  const session = await auth()
  if (!session?.user?.id) return

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return

  const userId = session.user.id

  // Check if vote exists
  const existingVote = await db.commentVote.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId
      }
    }
  })

  if (existingVote) {
    if (existingVote.type === type) {
      // Toggle off
      await db.commentVote.delete({ where: { id: existingVote.id } })
    } else {
      // Change vote
      await db.commentVote.update({
        where: { id: existingVote.id },
        data: { type }
      })
    }
  } else {
    // Create new vote
    await db.commentVote.create({
      data: { userId, commentId, type }
    })
  }

  // Find the post ID so we can refresh the page
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { postId: true }
  })

  if (comment) {
    revalidatePath(`/dashboard/community/${comment.postId}`)
    revalidatePath("/dashboard/community/feed")
  }
}