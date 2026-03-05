
"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function submitProposal(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const jobId = formData.get("jobId") as string
    const budget = Number(formData.get("budget"))
    const revisions = Number(formData.get("revisions")) || 0
    const coverLetter = formData.get("coverLetter") as string
    const days = Number(formData.get("days"))

    if (!jobId || !budget || !days) {
        throw new Error("Missing required fields")
    }

    try {
        // Check if there's an existing application (including withdrawn/rejected)
        const existingApplication = await db.jobApplication.findUnique({
            where: {
                jobId_freelancerId: {
                    jobId,
                    freelancerId: session.user.id
                }
            }
        })

        if (existingApplication) {
            // Update existing application
            await db.jobApplication.update({
                where: {
                    jobId_freelancerId: {
                        jobId,
                        freelancerId: session.user.id
                    }
                },
                data: {
                    proposedBudget: budget,
                    estimatedDays: days,
                    revisions: revisions,
                    coverLetter: coverLetter || "I am interested in this job.",
                    status: 'PENDING',
                    updatedAt: new Date()
                }
            })
        } else {
            // Create new application
            await db.jobApplication.create({
                data: {
                    jobId,
                    freelancerId: session.user.id,
                    proposedBudget: budget,
                    estimatedDays: days,
                    revisions: revisions,
                    coverLetter: coverLetter || "I am interested in this job.",
                    status: 'PENDING'
                }
            })
        }

        revalidatePath(`/dashboard/explore/jobs/${jobId}`)
        revalidatePath('/dashboard/proposals/sent')
    } catch (error) {
        console.error("Failed to submit proposal:", error)
        throw new Error("Failed to submit proposal")
    }
}
