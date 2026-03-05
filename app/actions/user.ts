"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function switchProfileMode() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) return

  // 1. Toggle the Mode
  const newMode = user.activeProfile === "BUYER" ? "SELLER" : "BUYER"

  // 2. Save to DB
  await db.user.update({
    where: { id: session.user.id },
    data: { activeProfile: newMode }
  })

  // 3. Clear Cache & Force Redirect
  revalidatePath("/")
  redirect("/dashboard")
}

export async function updateVisualIntro(url: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { activeProfile: true, username: true }
  })

  if (!user) throw new Error("User not found")

  if (user.activeProfile === "BUYER") {
    await db.clientProfile.update({
      where: { userId: session.user.id },
      data: { visualIntroUrl: url }
    })
  } else {
    // Default to freelancer profile updating
    // We use upsert here just in case, or simply update if we assume it exists
    // The original code used update, so we'll stick to update, or try-catch
    try {
      await db.freelancerProfile.update({
        where: { userId: session.user.id },
        data: { visualIntroUrl: url }
      })
    } catch (error) {
      // If freelancer profile doesn't exist, we could try creating it or ignore
      console.error("Failed to update freelancer profile visual intro", error)
    }
  }

  if (user) {
    revalidatePath(`/users/${user.username}`)
  }

  return { success: true }
}

export async function toggleOnlineStatus(status: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.user.update({
    where: { id: session.user.id },
    data: { isOnline: status }
  })

  revalidatePath("/") // Revalidate everything just in case
  return { success: true }
}


export async function updateProfile(data: { avatarUrl?: string; title?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const updateData: any = {}

  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl
  }

  // Update user avatar if provided
  if (Object.keys(updateData).length > 0) {
    await db.user.update({
      where: { id: session.user.id },
      data: updateData
    })
  }

  // Update title in freelancer profile if provided
  if (data.title !== undefined) {
    await db.freelancerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, title: data.title },
      update: { title: data.title }
    })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true }
  })

  if (user) {
    revalidatePath(`/users/${user.username}`)
    revalidatePath(`/users/${user.username}`)
  }

  return { success: true }
}

export async function toggleFollow(targetUserId: string) {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) {
    throw new Error("Unauthorized")
  }

  if (currentUserId === targetUserId) {
    throw new Error("Cannot follow yourself")
  }

  const restriction = await checkUserRestriction(currentUserId)
  if (restriction) throw new Error(restriction)

  const existingFollow = await db.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    }
  })

  if (existingFollow) {
    await db.follows.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    // Revalidating multiple potential paths where follow state matters
    revalidatePath("/community", "layout")
    revalidatePath("/dashboard/community/feed")
    revalidatePath(`/users/${targetUserId}`)

    return { isFollowing: false }
  } else {
    await db.follows.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })

    // Create Notification
    try {
      await db.notification.create({
        data: {
          userId: targetUserId,
          text: `${session.user.name || "Someone"} started following you`,
          link: `/users/${session.user.id}`,
        }
      })
    } catch (e) {
      console.error("Failed to create notification", e)
    }

    revalidatePath("/community", "layout")
    revalidatePath("/dashboard/community/feed")
    revalidatePath(`/users/${targetUserId}`)

    return { isFollowing: true }
  }
}

export async function hidePost(postId: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error("Unauthorized")
  }

  await db.hiddenPost.create({
    data: {
      userId,
      postId
    }
  })

  revalidatePath("/community", "layout")
  return { success: true }
}

export async function addPortfolioItem(mediaUrl: string, mediaType: "IMAGE" | "VIDEO" = "IMAGE", title: string = "Untitled") {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const restriction = await checkUserRestriction(userId)
  if (restriction) throw new Error(restriction)

  await db.portfolioItem.create({
    data: {
      userId,
      mediaUrl,
      mediaType,
      title
    }
  })

  // Revalidate profile page
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true }
  })
  if (user) revalidatePath(`/users/${user.username}`)

  return { success: true }
}

export async function removePortfolioItem(itemId: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error("Unauthorized")
  }

  // Ensure user owns the item
  const item = await db.portfolioItem.findUnique({
    where: { id: itemId }
  })

  if (!item || item.userId !== userId) {
    throw new Error("Unauthorized or not found")
  }

  await db.portfolioItem.delete({
    where: { id: itemId }
  })

  // Revalidate profile page
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true }
  })
  if (user) revalidatePath(`/users/${user.username}`)

  return { success: true }
}

export async function togglePortfolioLike(itemId: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const restriction = await checkUserRestriction(userId)
  if (restriction) throw new Error(restriction)

  const existingLike = await db.portfolioLike.findUnique({
    where: {
      userId_portfolioItemId: {
        userId,
        portfolioItemId: itemId
      }
    }
  })

  if (existingLike) {
    await db.portfolioLike.delete({
      where: {
        userId_portfolioItemId: {
          userId,
          portfolioItemId: itemId
        }
      }
    })
    return { liked: false }
  } else {
    await db.portfolioLike.create({
      data: {
        userId,
        portfolioItemId: itemId
      }
    })
  }
}

export async function toggleProductLike(productId: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const restriction = await checkUserRestriction(userId)
  if (restriction) throw new Error(restriction)

  const existingLike = await db.productLike.findUnique({
    where: {
      userId_productId: {
        userId,
        productId
      }
    }
  })

  if (existingLike) {
    await db.productLike.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })
    return { liked: false }
  } else {
    await db.productLike.create({
      data: {
        userId,
        productId
      }
    })
    return { liked: true }
  }
}

export async function updateAboutInfo(data: {
  bio?: string;
  location?: string;
  hourlyRate?: string;
  skills?: string[];
  tools?: string[];
  languages?: any[];
  externalLinks?: string[];
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (data.bio !== undefined) {
    await db.user.update({
      where: { id: session.user.id },
      data: { bio: data.bio }
    })
  }

  const profileData: any = {}
  if (data.location !== undefined) profileData.location = data.location
  if (data.hourlyRate !== undefined) profileData.hourlyRate = data.hourlyRate
  if (data.skills !== undefined) profileData.skills = data.skills
  if (data.tools !== undefined) profileData.tools = data.tools
  if (data.languages !== undefined) profileData.languages = data.languages
  if (data.externalLinks !== undefined) profileData.externalLinks = data.externalLinks

  if (Object.keys(profileData).length > 0) {
    await db.freelancerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...profileData
      },
      update: profileData
    })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true }
  })

  if (user) {
    revalidatePath(`/users/${user.username}`)
  }

  return { success: true }
}

export async function updateClientInfo(data: {
  bio?: string;
  location?: string;
  website?: string;
  companyName?: string;
  description?: string;
  languages?: any[];
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (data.bio !== undefined) {
    await db.user.update({
      where: { id: session.user.id },
      data: { bio: data.bio }
    })
  }

  const profileData: any = {}
  if (data.location !== undefined) profileData.location = data.location
  if (data.website !== undefined) profileData.website = data.website
  if (data.companyName !== undefined) profileData.companyName = data.companyName
  if (data.description !== undefined) profileData.description = data.description
  if (data.languages !== undefined) profileData.languages = data.languages

  if (Object.keys(profileData).length > 0) {
    await db.clientProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...profileData
      },
      update: profileData
    })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true }
  })

  if (user) {
    revalidatePath(`/users/${user.username}`)
  }

  return { success: true }
}