"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function updateProposalStatus(applicationId: string, newStatus: string) {
    if (!['SHORTLISTED', 'ACCEPTED', 'REJECTED'].includes(newStatus)) {
        throw new Error("Invalid status")
    }

    try {
        await db.jobApplication.update({
            where: { id: applicationId },
            data: {
                status: newStatus as any,
            }
        })

        revalidatePath("/dashboard/proposals/received/[jobId]")
        revalidatePath("/dashboard/proposals/track")
    } catch (error) {
        console.error("Failed to update status:", error)
        throw new Error("Database update failed")
    }
}

export async function rejectProposal(applicationId: string, reason?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    try {
        // Get application details for notification
        const application = await db.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    select: { title: true, clientId: true }
                },
                freelancer: {
                    select: { id: true }
                }
            }
        })

        if (!application) throw new Error("Application not found")
        if (application.job.clientId !== session.user.id) throw new Error("Unauthorized")

        // Update status to REJECTED
        await db.jobApplication.update({
            where: { id: applicationId },
            data: { status: 'REJECTED' }
        })

        // Create notification for freelancer
        const notificationText = reason
            ? `Your proposal for "${application.job.title}" was rejected. Reason: ${reason}`
            : `Your proposal for "${application.job.title}" was rejected.`

        await db.notification.create({
            data: {
                userId: application.freelancer.id,
                text: notificationText,
                link: `/dashboard/proposals/track`
            }
        })

        revalidatePath("/dashboard/proposals/received/[jobId]")
        revalidatePath("/dashboard/proposals/track")

        return { success: true }
    } catch (error) {
        console.error("Failed to reject proposal:", error)
        throw new Error("Failed to reject proposal")
    }
}

export async function withdrawProposal(applicationId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    try {
        const application = await db.jobApplication.findUnique({
            where: { id: applicationId },
            select: { freelancerId: true }
        })

        if (!application) throw new Error("Application not found")
        if (application.freelancerId !== session.user.id) throw new Error("Unauthorized")

        // Update status to WITHDRAWN
        await db.jobApplication.update({
            where: { id: applicationId },
            data: { status: 'WITHDRAWN' }
        })

        revalidatePath("/dashboard/proposals/sent")
        revalidatePath("/dashboard/proposals/track")

        return { success: true }
    } catch (error) {
        console.error("Failed to withdraw proposal:", error)
        throw new Error("Failed to withdraw proposal")
    }
}

export async function acceptProposalAndCreateProject(applicationId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    try {
        const application = await db.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: true,
                freelancer: true
            }
        })

        if (!application) throw new Error("Application not found")
        if (application.job.clientId !== session.user.id) throw new Error("Unauthorized")

        // 1. Create Order (for service-order UI and payment tracking)
        const order = await db.order.create({
            data: {
                price: Math.floor(application.proposedBudget),
                status: 'PENDING',
                buyerId: session.user.id,
                sellerId: application.freelancerId,
                deadline: application.job.deadline,
                revisionsRemaining: application.revisions // Use revisions from application
            }
        })

        const proposedMilestones = (application.job.proposedMilestones as any[]) || []
        const paymentStructure = application.job.paymentStructure || 'full'
        const advancePercent = application.job.advancePercentage || 0
        const finalBudget = Math.floor(application.proposedBudget)

        // 2. Create Project with Initial Agreement Milestone (linked to Order)
        const project = await db.project.create({
            data: {
                title: application.job.title,
                description: application.job.description,
                budget: finalBudget,
                status: 'ACTIVE',
                clientId: session.user.id,
                freelancerId: application.freelancerId,
                deadline: application.job.deadline,
                progress: 0,
                orderId: order.id,
                milestones: {
                    create: [
                        {
                            title: "Project Agreement",
                            description: JSON.stringify({
                                clientAgreed: false,
                                freelancerAgreed: false,
                                originalProposalId: applicationId
                            }),
                            amount: 0,
                            status: 'PENDING'
                        },
                        ...(paymentStructure === 'advance'
                            ? [
                                {
                                    title: "Advance Payment",
                                    amount: Math.round(finalBudget * (advancePercent / 100)),
                                    dueDate: application.job.expectedStartDate || application.job.deadline,
                                    status: 'PENDING' as any,
                                    description: `Upfront payment of ${advancePercent}% before work begins`
                                },
                                {
                                    title: "Final Delivery",
                                    amount: Math.round(finalBudget * ((100 - advancePercent) / 100)),
                                    dueDate: application.job.deadline,
                                    status: 'PENDING' as any,
                                    description: "Remaining balance for complete project delivery"
                                }
                            ]
                            : proposedMilestones.length > 0
                                ? proposedMilestones.map(m => ({
                                    title: m.name ?? '',
                                    amount: parseFloat(m.amount) || 0,
                                    dueDate: null, // Since direct job milestones don't have detailed dates like exec versions
                                    status: 'PENDING' as any,
                                    description: m.description || ''
                                }))
                                : [{
                                    title: "Final Delivery",
                                    amount: finalBudget,
                                    dueDate: application.job.deadline,
                                    status: 'PENDING' as any,
                                    description: "Complete project delivery"
                                }]
                        )
                    ]
                }
            }
        })

        // 3. Update Application Status AND Job Status
        await db.jobApplication.update({
            where: { id: applicationId },
            data: { status: 'ACCEPTED' }
        })

        await db.job.update({
            where: { id: application.job.id },
            data: { status: 'IN_PROGRESS' }
        })

        // 4. Create Notification for Freelancer
        await db.notification.create({
            data: {
                userId: application.freelancerId,
                text: `Your proposal for "${application.job.title}" has been accepted! Order #${order.id.slice(0, 8)} created.`,
                link: `/job-order/${order.id}`
            }
        })

        // 5. Create Notification for Client
        await db.notification.create({
            data: {
                userId: session.user.id,
                text: `Project order for "${application.job.title}" created. Track it here.`,
                link: `/job-order/${order.id}`
            }
        })

        revalidatePath("/dashboard/proposals/received/[jobId]")
        revalidatePath("/dashboard/projects/active")
        revalidatePath("/job-order/[orderId]")
        revalidatePath("/dashboard/proposals/track")

        return { success: true, projectId: project.id, orderId: order.id }
    } catch (error) {
        console.error("Failed to create project:", error)
        throw new Error("Failed to create project")
    }
}
