"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"
import { redirect } from "next/navigation"

export async function submitSupportTicket(data: any) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const { category, subcategory, subject, description, priority = "MEDIUM", metadata } =
        (typeof data.get === 'function')
            ? {
                category: data.get("category") as string,
                subcategory: data.get("subcategory") as string || undefined,
                subject: data.get("subject") as string,
                description: data.get("description") as string,
                priority: data.get("priority") as any || "MEDIUM",
                metadata: undefined
            }
            : data

    if (!category || !subject || !description) {
        throw new Error("Missing required fields")
    }

    const ticket = await db.supportTicket.create({
        data: {
            userId: session.user.id,
            category,
            subcategory,
            subject,
            description,
            priority,
            metadata: metadata ?? undefined,
        }
    })

    // Notify all admins about the new ticket
    const admins = await db.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
    })

    for (const admin of admins) {
        await createNotification(
            admin.id,
            `New support ticket: "${subject}" [${priority}]`,
            "/admin/support"
        )
    }

    revalidatePath("/admin/support")

    return { success: true, ticketId: ticket.id }
}

export async function createSupportTicketAction(formData: FormData) {
    const result = await submitSupportTicket(formData)
    if (result.success) {
        redirect("/dashboard/support")
    }
}

export async function getUserTickets() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await db.supportTicket.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    })
}

export async function getTicketDetails(ticketId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId }
    })

    if (!ticket || ticket.userId !== session.user.id) {
        throw new Error("Ticket not found or unauthorized")
    }

    return ticket
}
export async function getSupportMessages(ticketId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await db.supportMessage.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { role: true, avatarUrl: true, id: true, username: true } } }
    })
}

export async function sendSupportMessage(ticketId: string, text: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (!text.trim()) throw new Error("Message cannot be empty")

    const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId },
        select: { userId: true }
    })

    if (!ticket) throw new Error("Ticket not found")

    const userQuery = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    // Auth check: either the owner of the ticket or an admin
    const isAdmin = userQuery?.role === "ADMIN" || session.user.role === "ADMIN"

    if (ticket.userId !== session.user.id && !isAdmin) {
        throw new Error("Unauthorized access to this ticket")
    }

    try {
        const message = await db.supportMessage.create({
            data: {
                text,
                ticketId,
                senderId: session.user.id,
            },
            include: {
                sender: { select: { role: true, avatarUrl: true, id: true, username: true } }
            }
        })

        // If a user sends a message, notify admins
        if (!isAdmin) {
            try {
                const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
                for (const admin of admins) {
                    await createNotification(
                        admin.id,
                        `New message in support ticket: "${text.substring(0, 30)}..."`,
                        `/admin/support/${ticketId}`
                    )
                }
            } catch (notifyError) {
                console.error("Failed to notify admins:", notifyError)
            }
        } else {
            // If an admin sends a message, notify the user
            try {
                await createNotification(
                    ticket.userId,
                    `Admin replied to your support ticket: "${text.substring(0, 30)}..."`,
                    `/dashboard?ticketId=${ticketId}`
                )
            } catch (notifyError) {
                console.error("Failed to notify user:", notifyError)
            }
        }

        // revalidate paths just in case
        try {
            revalidatePath(`/admin/support/${ticketId}`)
            revalidatePath(`/dashboard`)
        } catch (revalidateError) {
            // Silently fail revalidation if it's not critical
        }

        return { success: true, message }
    } catch (dbError: any) {
        console.error("sendSupportMessage error:", dbError)
        throw new Error(dbError.message || "Failed to send message")
    }
}

export async function getOrderMessages(orderId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await db.disputeMessage.findMany({
        where: {
            dispute: {
                orderId: orderId,
                reason: "ORDER_COMMUNICATION" // Using a dummy dispute as a message container
            }
        },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { avatarUrl: true, id: true, username: true } } }
    })
}

export async function sendOrderMessage(orderId: string, text: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    let dispute = await db.dispute.findFirst({
        where: { orderId, reason: "ORDER_COMMUNICATION" }
    })

    if (!dispute) {
        dispute = await db.dispute.create({
            data: {
                orderId,
                reason: "ORDER_COMMUNICATION",
                raisedById: session.user.id,
                status: "CLOSED" // Hidden from admin moderation
            }
        })
    }

    const message = await db.disputeMessage.create({
        data: {
            text,
            disputeId: dispute.id,
            senderId: session.user.id
        },
        include: { sender: { select: { avatarUrl: true, id: true, username: true } } }
    })

    revalidatePath(`/job-order/${orderId}`)
    return { success: true, message }
}
