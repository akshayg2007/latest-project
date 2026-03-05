"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

// --- SAVE FREELANCER PROFILE ---
// --- SAVE FREELANCER PROFILE ---
export async function completeFreelancerOnboarding(data: {
  title: string
  portfolio: string
  skills: string
  tools: string
  hourlyRate: string
  avatarUrl?: string
  location?: string
  externalLinks?: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Helper to process arrays
  const skillsArray = data.skills.split(',').map(s => s.trim()).filter(s => s !== "")
  const toolsArray = data.tools.split(',').map(s => s.trim()).filter(s => s !== "")
  const linksArray = data.externalLinks?.filter(l => l.trim() !== "") || []

  // REMOVE portfolioUrl usage if you want to store everything in externalLinks,
  // OR keep portfolioUrl as the first link and store the rest in externalLinks?
  // The user request says "the links we are taking in inpiut display them in links section".
  // The 'links' section on profile uses `user.externalLinks`.
  // So I should save ALL links to `externalLinks`.

  // 1. Upsert Profile (Update if exists, Create if new)
  await db.freelancerProfile.upsert({
    where: {
      userId: session.user.id
    },
    update: {
      title: data.title,
      portfolioUrl: data.portfolio, // Keeping unique portfolio url for backward compatibility or main portfolio
      skills: skillsArray,
      tools: toolsArray,
      hourlyRate: data.hourlyRate,
      location: data.location,
      externalLinks: linksArray
    },
    create: {
      userId: session.user.id,
      title: data.title,
      portfolioUrl: data.portfolio,
      skills: skillsArray,
      tools: toolsArray,
      hourlyRate: data.hourlyRate,
      location: data.location,
      externalLinks: linksArray
    }
  })

  // 2. Update User Status and Avatar
  await db.user.update({
    where: { id: session.user.id },
    data: {
      activeProfile: "SELLER",
      onboardingComplete: true,
      ...(data.avatarUrl && { avatarUrl: data.avatarUrl })
    }
  })

  redirect("/dashboard")
}

// --- SAVE CLIENT PROFILE ---
export async function completeClientOnboarding(data: {
  companyName: string
  isIndividual: boolean
  website: string
  description: string
  avatarUrl?: string
  location?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // 1. Upsert Profile
  await db.clientProfile.upsert({
    where: {
      userId: session.user.id
    },
    update: {
      companyName: data.companyName,
      isIndividual: data.isIndividual,
      website: data.website,
      description: data.description,
      location: data.location
    },
    create: {
      userId: session.user.id,
      companyName: data.companyName,
      isIndividual: data.isIndividual,
      website: data.website,
      description: data.description,
      location: data.location
    }
  })

  // 2. Update User Status and Avatar
  await db.user.update({
    where: { id: session.user.id },
    data: {
      activeProfile: "BUYER",
      onboardingComplete: true,
      ...(data.avatarUrl && { avatarUrl: data.avatarUrl })
    }
  })

  redirect("/dashboard")
}

// --- UPDATE AVATAR ONLY ---
export async function updateUserAvatar(avatarUrl: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.user.update({
    where: { id: session.user.id },
    data: { avatarUrl }
  })

  return { success: true }
}
