"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"
import { createNotification } from "@/lib/notifications"

interface JobData {
    title: string
    description: string
    category: string
    budget: string
    budgetType: "FIXED" | "HOURLY"
    skills: string[]
    experienceLevel?: string
    maxProposals?: string
    timeline?: string
    minBudget?: string
    maxBudget?: string
    deadline?: string
    objective?: string
    deliverables?: string[]
    tasksIncluded?: string[]
    paymentStructure?: string
    advancePercentage?: number
    paymentTimeline?: string
    paymentMethods?: string[]
    proposedMilestones?: any
    hourlyRateMin?: number
    hourlyRateMax?: number
    maxHoursPerWeek?: number
    estimatedTotalHours?: number
    paymentFrequency?: string
    hourApprovalMethod?: string
    expectedStartDate?: string
    deadlineFlexible?: boolean
    urgencyLevel?: string
}

export async function createJob(data: JobData) {
    let session;
    try {
        session = await auth()
    } catch (authError: any) {
        console.error("Auth attempted failed:", authError)
        return { error: "Session authentication failed. Please try logging in again." }
    }

    if (!session?.user?.id) {
        console.error("Create Job: No session found")
        redirect("/signin")
    }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    // Use input values directly as Rupees (base currency)
    const toNum = (val: string | number | undefined) => {
        if (val === undefined || val === null) return null
        if (typeof val === 'number') return val
        return parseFloat(val.replace(/[^0-9.]/g, ""))
    }

    try {
        const job = await db.job.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                skills: data.skills,
                experienceLevel: data.experienceLevel,
                maxProposals: data.maxProposals ? parseInt(data.maxProposals) : null,
                timeline: data.timeline,
                minBudget: toNum(data.minBudget),
                maxBudget: toNum(data.maxBudget),
                budget: toNum(data.maxBudget) || 0,
                budgetType: data.budgetType,
                deadline: data.deadline ? new Date(data.deadline) : null,
                clientId: session.user.id,
                objective: data.objective ?? null,
                deliverables: data.deliverables ?? [],
                tasksIncluded: data.tasksIncluded ?? [],
                paymentStructure: data.paymentStructure ?? null,
                advancePercentage: data.advancePercentage ?? null,
                paymentTimeline: data.paymentTimeline ?? null,
                paymentMethods: data.paymentMethods ?? [],
                proposedMilestones: data.proposedMilestones ?? null,
                hourlyRateMin: data.hourlyRateMin ?? null,
                hourlyRateMax: data.hourlyRateMax ?? null,
                maxHoursPerWeek: data.maxHoursPerWeek ?? null,
                estimatedTotalHours: data.estimatedTotalHours ?? null,
                paymentFrequency: data.paymentFrequency ?? null,
                hourApprovalMethod: data.hourApprovalMethod ?? null,
                expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
                deadlineFlexible: data.deadlineFlexible ?? false,
                urgencyLevel: data.urgencyLevel ?? null,
            } as any,
        })

        console.log("Create Job: Successfully created job:", job.id)

        revalidatePath("/dashboard/jobs")
        revalidatePath(`/users/${(session.user as any).username}`)

        return { success: true, jobId: job.id }
    } catch (err: any) {
        if (err.digest?.startsWith("NEXT_REDIRECT")) {
            throw err
        }

        console.error("Create Job Error:", err)
        return { error: `Failed to create job: ${err.message || "Unknown error"}` }
    }
}

export async function getJobForEdit(jobId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const job = await db.job.findUnique({
            where: { id: jobId },
        })

        if (!job) return { error: "Job not found" }
        if (job.clientId !== session.user.id) return { error: "Unauthorized to edit this job" }

        return { success: true, job }
    } catch (error) {
        console.error("Error fetching job for edit:", error)
        return { error: "Failed to fetch job data" }
    }
}

export async function updateJob(jobId: string, data: JobData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    const toNum = (val: string | number | undefined) => {
        if (val === undefined || val === null) return null
        if (typeof val === 'number') return val
        return parseFloat(val.toString().replace(/[^0-9.]/g, ""))
    }

    try {
        const existingJob = await db.job.findUnique({
            where: { id: jobId }
        })

        if (!existingJob) return { error: "Job not found" }
        if (existingJob.clientId !== session.user.id) return { error: "Unauthorized" }

        const job = await db.job.update({
            where: { id: jobId },
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                skills: data.skills,
                experienceLevel: data.experienceLevel,
                maxProposals: data.maxProposals ? parseInt(data.maxProposals) : null,
                timeline: data.timeline,
                minBudget: toNum(data.minBudget),
                maxBudget: toNum(data.maxBudget),
                budget: toNum(data.maxBudget) || 0,
                budgetType: data.budgetType,
                deadline: data.deadline ? new Date(data.deadline) : null,
                objective: data.objective ?? null,
                deliverables: data.deliverables ?? [],
                tasksIncluded: data.tasksIncluded ?? [],
                paymentStructure: data.paymentStructure ?? null,
                advancePercentage: data.advancePercentage ?? null,
                paymentTimeline: data.paymentTimeline ?? null,
                paymentMethods: data.paymentMethods ?? [],
                proposedMilestones: data.proposedMilestones ?? null,
                hourlyRateMin: data.hourlyRateMin ?? null,
                hourlyRateMax: data.hourlyRateMax ?? null,
                maxHoursPerWeek: data.maxHoursPerWeek ?? null,
                estimatedTotalHours: data.estimatedTotalHours ?? null,
                paymentFrequency: data.paymentFrequency ?? null,
                hourApprovalMethod: data.hourApprovalMethod ?? null,
                expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
                deadlineFlexible: data.deadlineFlexible ?? false,
                urgencyLevel: data.urgencyLevel ?? null,
            } as any,
        })

        revalidatePath("/dashboard/jobs")
        revalidatePath(`/dashboard/explore/jobs/${job.id}`)
        revalidatePath("/dashboard/jobs")

        return { success: true, jobId: job.id }
    } catch (err: any) {
        console.error("Update Job Error:", err)
        return { error: `Failed to update job: ${err.message || "Unknown error"}` }
    }
}

export async function deleteJob(jobId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    try {
        const job = await db.job.findUnique({
            where: { id: jobId },
            include: { applications: true }
        })

        if (!job) return { error: "Job not found" }
        if (job.clientId !== session.user.id) return { error: "Unauthorized" }

        // 1. Soft delete the job
        await db.job.update({
            where: { id: jobId },
            data: {
                isRemoved: true,
                status: 'CANCELLED',
                removalReason: 'Job removed by client'
            }
        })

        // 2. Update all pending applications to REJECTED and notify freelancers
        const pendingApps = job.applications.filter(app => ['PENDING', 'SHORTLISTED'].includes(app.status))

        await db.jobApplication.updateMany({
            where: {
                jobId: jobId,
                status: { in: ['PENDING', 'SHORTLISTED'] }
            },
            data: {
                status: 'REJECTED'
            }
        })

        // Send notifications to all freelancers who applied
        for (const app of job.applications) {
            await createNotification(
                app.freelancerId,
                `The job "${job.title}" has been removed by the client.`,
                `/dashboard/proposals/track`
            )
        }

        // 3. Update all ongoing negotiations to REJECTED (if they are not already CONFIRMED or REJECTED)
        await db.negotiation.updateMany({
            where: {
                jobId: jobId,
                status: { notIn: ['CONFIRMED', 'REJECTED'] }
            },
            data: {
                status: 'REJECTED',
                rejectionReason: 'Job removed by client'
            }
        })

        revalidatePath("/dashboard/jobs")
        return { success: true }
    } catch (error) {
        console.error("Delete Job Error:", error)
        return { error: "Failed to delete job" }
    }
}
