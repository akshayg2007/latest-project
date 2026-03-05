"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function createService(data: {
  category: string
  title: string
  tools: string[]
  images: string[]
  revisions: string
  tags: string[]
  deliverables: { title: string, description: string }[]
  summary: string
  faqs: { question: string, answer: string }[]
  pricingMethod: string
  paymentFrequency: string
  rate: string
  deliveryTime?: string
  paymentSteps?: { title: string, description: string, percentage: string }[]
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Log in to create a service" }
  }

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return { error: restriction }

  try {
    const service = await db.service.create({
      data: {
        title: data.title,
        description: data.summary,
        category: data.category,
        price: parseInt(data.rate) || 0,
        deliveryTime: data.deliveryTime ? parseInt(data.deliveryTime) : null,
        images: data.images,
        sellerId: session.user.id,
        revisions: data.revisions,
        tags: data.tags,
        tools: data.tools,
        pricingMethod: data.pricingMethod,
        paymentFrequency: data.paymentFrequency,
        paymentSteps: data.paymentSteps && data.paymentSteps.length > 0 ? data.paymentSteps : undefined,
        deliverables: {
          create: data.deliverables.map(d => ({
            title: d.title,
            description: d.description
          }))
        },
        faqs: {
          create: data.faqs.map(f => ({
            question: f.question,
            answer: f.answer
          }))
        }
      }
    })

    await db.user.update({
      where: { id: session.user.id },
      data: { activeProfile: "SELLER" }
    })

    revalidatePath("/")
    revalidatePath("/dashboard")
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
    revalidatePath(`/users/${user?.username}`)

    return { success: true, id: service.id }

  } catch (err) {
    console.error("Create Service Error:", err)
    return { error: "Failed to create service" }
  }
}