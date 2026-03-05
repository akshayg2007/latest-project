"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function updateService(serviceId: string, data: {
    category?: string
    title?: string
    tools?: string[]
    images?: string[]
    revisions?: string
    tags?: string[]
    description?: string
    price?: number
    deliveryTime?: number
    deliverables?: { title: string, description: string }[]
    faqs?: { question: string, answer: string }[]
    paymentSteps?: { title: string, description: string, percentage: string }[]
    paymentFrequency?: string
    pricingMethod?: string
}) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Log in to update a service" }
    }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    try {
        const service = await db.service.findUnique({
            where: { id: serviceId }
        })

        if (!service || service.sellerId !== session.user.id) {
            return { error: "Service not found or unauthorized" }
        }

        await db.service.update({
            where: { id: serviceId },
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                price: data.price,
                deliveryTime: data.deliveryTime,
                images: data.images,
                revisions: data.revisions,
                tags: data.tags,
                tools: data.tools,
                paymentFrequency: data.paymentFrequency,
                pricingMethod: data.pricingMethod,
                paymentSteps: data.paymentSteps && data.paymentSteps.length > 0 ? data.paymentSteps : [],
                deliverables: {
                    deleteMany: {},
                    create: data.deliverables?.map(d => ({
                        title: d.title,
                        description: d.description
                    })) || []
                },
                faqs: {
                    deleteMany: {},
                    create: data.faqs?.map(f => ({
                        question: f.question,
                        answer: f.answer
                    })) || []
                }
            }
        })

        const user = await db.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
        revalidatePath(`/users/${user?.username}`)
        revalidatePath("/")
        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/explore/services/${serviceId}`)

        return { success: true }

    } catch (err) {
        console.error("Update Service Error:", err)
        return { error: "Failed to update service" }
    }
}

export async function getServiceForEdit(serviceId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const service = await db.service.findUnique({
        where: { id: serviceId },
        include: {
            deliverables: true,
            faqs: true
        }
    })

    if (!service || service.sellerId !== session.user.id) return null

    return service
}
