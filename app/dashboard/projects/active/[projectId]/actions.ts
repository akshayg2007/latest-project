"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function agreeToProject(projectId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    try {
        // Find the agreement milestone
        const milestone = await db.milestone.findFirst({
            where: {
                projectId,
                title: "Project Agreement",
                status: 'PENDING'
            }
        })

        if (!milestone) throw new Error("Agreement milestone not found or already approved")

        const currentData = JSON.parse(milestone.description || "{}")

        let newData = { ...currentData }

        // Determine if user is client or freelancer
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, freelancerId: true }
        })

        if (!project) throw new Error("Project not found")

        if (session.user.id === project.clientId) {
            newData.clientAgreed = true
        } else if (session.user.id === project.freelancerId) {
            newData.freelancerAgreed = true
        } else {
            throw new Error("User is not part of this project")
        }

        let newStatus = 'PENDING'
        if (newData.clientAgreed && newData.freelancerAgreed) {
            newStatus = 'APPROVED'
        }

        await db.milestone.update({
            where: { id: milestone.id },
            data: {
                description: JSON.stringify(newData),
                status: newStatus as any
            }
        })

        revalidatePath(`/dashboard/projects/active/${projectId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to agree:", error)
        throw new Error("Failed to agree to project terms")
    }
}
