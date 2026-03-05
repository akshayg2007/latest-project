"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"

export async function getAdminTickets(filter?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") throw new Error("Unauthorized: Admin access required")

    const statusFilter = filter === "resolved"
        ? { in: ["RESOLVED" as const, "CLOSED" as const] }
        : filter === "in_progress"
            ? ("IN_PROGRESS" as const)
            : ("OPEN" as const)

    return await db.supportTicket.findMany({
        where: { status: statusFilter },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarUrl: true,
                    activeProfile: true,
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })
}

export async function getTicketById(ticketId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") throw new Error("Unauthorized: Admin access required")

    return await db.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarUrl: true,
                    activeProfile: true,
                    createdAt: true,
                    bio: true,
                    credibility: { select: { score: true } },
                }
            }
        }
    })
}

export async function updateTicketStatus(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, username: true }
    })

    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin access required")

    const ticketId = formData.get("ticketId") as string
    const status = formData.get("status") as string
    const adminNote = formData.get("adminNote") as string | null

    if (!ticketId || !status) throw new Error("Missing required fields")

    const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId },
    })

    if (!ticket) throw new Error("Ticket not found")

    // Update the ticket status and optionally store admin note in metadata
    const existingMetadata = (ticket.metadata as Record<string, any>) || {}

    await db.supportTicket.update({
        where: { id: ticketId },
        data: {
            status: status as any,
            metadata: {
                ...existingMetadata,
                adminNote: adminNote || existingMetadata.adminNote,
                resolvedBy: status === "RESOLVED" || status === "CLOSED" ? admin.username : existingMetadata.resolvedBy,
                resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date().toISOString() : existingMetadata.resolvedAt,
                statusHistory: [
                    ...(existingMetadata.statusHistory || []),
                    { from: ticket.status, to: status, by: admin.username, at: new Date().toISOString() }
                ]
            }
        }
    })

    // Notify the user about the status change
    const statusLabels: Record<string, string> = {
        IN_PROGRESS: "is now being reviewed",
        RESOLVED: "has been resolved",
        CLOSED: "has been closed",
        OPEN: "has been reopened",
    }

    await createNotification(
        ticket.userId,
        `Your support ticket "${ticket.subject}" ${statusLabels[status] || "was updated"}.`,
        `/dashboard?ticketId=${ticketId}`
    )

    revalidatePath("/admin/support")
    revalidatePath(`/admin/support/${ticketId}`)
}
