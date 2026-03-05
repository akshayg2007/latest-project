"use server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { VoteType } from "@prisma/client"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function castVote(postId: string, type: VoteType) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Login required" }

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return { error: restriction }

  const userId = session.user.id

  // 1. Check if user already voted
  const existingVote = await db.vote.findUnique({
    where: {
      userId_postId: {
        userId,
        postId
      }
    }
  })

  // 2. Logic to Toggle or Update
  if (existingVote) {
    if (existingVote.type === type) {
      // User clicked same button -> Delete vote (Toggle off)
      await db.vote.delete({
        where: { id: existingVote.id }
      })
    } else {
      // User changed vote (Up to Down, or vice versa) -> Update it
      await db.vote.update({
        where: { id: existingVote.id },
        data: { type }
      })
    }
  } else {
    // 3. New Vote
    await db.vote.create({
      data: {
        userId,
        postId,
        type
      }
    })
  }

  revalidatePath(`/community/${postId}`)
  revalidatePath("/dashboard/community/feed")
}