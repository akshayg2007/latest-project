"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function fundMilestone(projectId: string, milestoneId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const milestone = await db.milestone.findUnique({
        where: { id: milestoneId },
        include: { project: true }
    })

    if (!milestone) return { error: "Milestone not found" }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) return { error: "User not found" }

    if (user.balance < milestone.amount) {
        return { error: "Insufficient balance" }
    }

    // Deduct
    await db.user.update({
        where: { id: user.id },
        data: { balance: { decrement: milestone.amount } }
    })

    // Fund
    await db.milestone.update({
        where: { id: milestoneId },
        data: { escrowAmount: milestone.amount, status: "IN_PROGRESS" }
    })

    // Add transaction record
    await db.transaction.create({
        data: {
            amount: milestone.amount,
            type: "ESCROW_FUNDING",
            status: "COMPLETED",
            userId: user.id,
            milestoneId: milestone.id
        }
    })

    revalidatePath(`/dashboard/projects/active/${projectId}`)
    revalidatePath(`/service-order/${milestone.project.orderId}`)
    revalidatePath(`/job-order/${milestone.project.orderId}`)

    return { success: true }
}
