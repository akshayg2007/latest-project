"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ─── Helper ────────────────────────────────────────────────────────────────── 
async function getSessionOrThrow() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    return session.user
}

// ─── Open (or get) a negotiation for a shortlisted application ─────────────── 
export async function openOrGetNegotiation(applicationId: string) {
    const user = await getSessionOrThrow()

    const application = await db.jobApplication.findUnique({
        where: { id: applicationId },
        include: { job: true }
    })

    if (!application) throw new Error("Application not found")
    if (application.status !== 'SHORTLISTED') throw new Error("Application is not shortlisted")

    // Check auth: must be client or the freelancer
    const isClient = application.job.clientId === user.id
    const isFreelancer = application.freelancerId === user.id
    if (!isClient && !isFreelancer) throw new Error("Unauthorized")

    // Return existing negotiation if it exists
    const existing = await db.negotiation.findUnique({
        where: { applicationId },
        include: {
            client: { select: { id: true, username: true, avatarUrl: true } },
            freelancer: { select: { id: true, username: true, avatarUrl: true } },
            scopeVersions: { orderBy: { versionNumber: 'desc' } },
            executionVersions: {
                orderBy: { versionNumber: 'desc' },
                include: { milestones: true }
            }
        }
    })

    if (existing) {
        // Auto-patch v1 if it was incorrectly pre-filled with job.description instead of job.objective
        const v1 = existing.scopeVersions.find(v => v.versionNumber === 1)
        const correctObjective = application.job.objective ?? application.job.description ?? ''

        if (v1) {
            let updated = false
            const dataToUpdate: any = {}

            if (application.job.objective && v1.objective !== correctObjective && v1.objective === application.job.description) {
                dataToUpdate.objective = correctObjective
                v1.objective = correctObjective
                updated = true
            }

            // Recovery: If tasksIncluded is empty (wiped during migration), restore from Job
            if ((!v1.tasksIncluded || v1.tasksIncluded.length === 0) && application.job.tasksIncluded && application.job.tasksIncluded.length > 0) {
                dataToUpdate.tasksIncluded = application.job.tasksIncluded
                v1.tasksIncluded = application.job.tasksIncluded as any // cast if stale
                updated = true
            }

            if (updated) {
                await db.negotiationScopeVersion.update({
                    where: { id: v1.id },
                    data: dataToUpdate
                })
            }
        }
        return existing as any
    }

    // Create new negotiation with v1 scope pre-filled from job
    const negotiation = await db.negotiation.create({
        data: {
            applicationId,
            jobId: application.jobId,
            clientId: application.job.clientId,
            freelancerId: application.freelancerId,
            status: 'SCOPE_PENDING',
            scopeConfirmedByClient: true, // Proposer (client) is auto-confirmed
            scopeConfirmedByFreelancer: false,
            scopeVersions: {
                create: {
                    versionNumber: 1,
                    createdBy: 'client',
                    objective: application.job.objective ?? application.job.description ?? '',
                    deliverables: application.job.deliverables ?? [],
                    tasksIncluded: application.job.tasksIncluded ?? [],
                    revisions: application.revisions ?? 3,
                } as any
            }
        },
        include: {
            client: { select: { id: true, username: true, avatarUrl: true } },
            freelancer: { select: { id: true, username: true, avatarUrl: true } },
            scopeVersions: { orderBy: { versionNumber: 'desc' } },
            executionVersions: {
                orderBy: { versionNumber: 'desc' },
                include: { milestones: true }
            }
        }
    })

    return negotiation
}

// ─── Get full negotiation by jobId + applicationId ─────────────────────────── 
export async function getNegotiation(negotiationId: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
            job: true,
            application: true,
            client: { select: { id: true, username: true, avatarUrl: true } },
            freelancer: { select: { id: true, username: true, avatarUrl: true } },
            scopeVersions: { orderBy: { versionNumber: 'desc' } },
            executionVersions: {
                orderBy: { versionNumber: 'desc' },
                include: { milestones: true }
            }
        }
    })

    if (!negotiation) throw new Error("Negotiation not found")
    if (negotiation.clientId !== user.id && negotiation.freelancerId !== user.id)
        throw new Error("Unauthorized")

    return negotiation
}

// ─── Get negotiation by applicationId ─────────────────────────────────────── 
export async function getNegotiationByApplication(applicationId: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { applicationId },
        include: {
            job: true,
            application: true,
            client: { select: { id: true, username: true, avatarUrl: true } },
            freelancer: { select: { id: true, username: true, avatarUrl: true } },
            scopeVersions: { orderBy: { versionNumber: 'desc' } },
            executionVersions: {
                orderBy: { versionNumber: 'desc' },
                include: { milestones: true }
            }
        }
    })

    if (!negotiation) return null
    if (negotiation.clientId !== user.id && negotiation.freelancerId !== user.id)
        throw new Error("Unauthorized")

    return negotiation
}

// ─── Submit a scope change (creates new version) ───────────────────────────── 
export async function submitScopeChange(
    negotiationId: string,
    data: {
        objective: string
        deliverables: string[]
        tasksIncluded: string[]
        revisions: number
        changeReason?: string
    }
) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: { scopeVersions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    })
    if (!negotiation) throw new Error("Not found")

    const isClient = negotiation.clientId === user.id
    const isFreelancer = negotiation.freelancerId === user.id
    if (!isClient && !isFreelancer) throw new Error("Unauthorized")

    const latestVersion = negotiation.scopeVersions[0]?.versionNumber ?? 0

    // Deactivate all old versions
    await db.negotiationScopeVersion.updateMany({
        where: { negotiationId },
        data: { isActive: false }
    })

    // Create new version
    await db.negotiationScopeVersion.create({
        data: {
            negotiationId,
            versionNumber: latestVersion + 1,
            createdBy: isClient ? 'client' : 'freelancer',
            objective: data.objective,
            deliverables: data.deliverables,
            tasksIncluded: data.tasksIncluded,
            revisions: data.revisions,
            changeReason: data.changeReason,
            isActive: true,
        } as any
    })

    // Update negotiation status
    await db.negotiation.update({
        where: { id: negotiationId },
        data: {
            status: 'SCOPE_CHANGE_REQUESTED',
            scopeConfirmedByClient: isClient, // Requester is auto-confirmed
            scopeConfirmedByFreelancer: isFreelancer, // Requester is auto-confirmed
        }
    })

    revalidatePath(`/dashboard/proposals/negotiation`, 'layout')
    return { success: true }
}

// ─── Confirm scope ─────────────────────────────────────────────────────────── 
export async function confirmScope(negotiationId: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: { scopeVersions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    })
    if (!negotiation) throw new Error("Not found")

    const isClient = negotiation.clientId === user.id
    const isFreelancer = negotiation.freelancerId === user.id
    if (!isClient && !isFreelancer) throw new Error("Unauthorized")

    // Proposer of the active version is logically confirmed
    const activeVersion = negotiation.scopeVersions[0]
    const proposerIsClient = activeVersion?.createdBy === 'client'
    const proposerIsFreelancer = activeVersion?.createdBy === 'freelancer'

    // Check after update if both confirmed (Logical OR with proposer to handle legacy data)
    const newClient = isClient ? true : (proposerIsClient ? true : negotiation.scopeConfirmedByClient)
    const newFreelancer = isFreelancer ? true : (proposerIsFreelancer ? true : negotiation.scopeConfirmedByFreelancer)

    const updateData: any = {
        scopeConfirmedByClient: newClient,
        scopeConfirmedByFreelancer: newFreelancer,
    }

    if (newClient && newFreelancer) {
        updateData.status = 'SCOPE_CONFIRMED'
        // Create first execution version prefilled from job
        const job = await db.job.findUnique({ where: { id: negotiation.jobId } })
        const application = await db.jobApplication.findUnique({ where: { id: negotiation.applicationId } })
        if (job && application) {
            await db.negotiationExecutionVersion.create({
                data: {
                    negotiationId,
                    versionNumber: 1,
                    createdBy: 'client',
                    finalBudget: application.proposedBudget,
                    deadline: job.deadline,
                    startDate: job.expectedStartDate,
                    paymentStructure: job.paymentStructure ?? 'full',
                    advancePercent: job.advancePercentage ?? 0,
                    paymentTimeline: job.paymentTimeline ?? '7days',
                    hourlyRate: job.hourlyRateMin,
                    maxHoursPerWeek: job.maxHoursPerWeek,
                    estimatedHours: job.estimatedTotalHours,
                    paymentFrequency: job.paymentFrequency,
                    hourApprovalMethod: job.hourApprovalMethod,
                    milestones: job.proposedMilestones
                        ? {
                            create: (job.proposedMilestones as any[]).map((m: any) => ({
                                name: m.name ?? '',
                                amount: parseFloat(m.amount) || 0,
                                releaseCondition: m.description ?? '',
                            }))
                        }
                        : undefined
                }
            })
        }
    } else {
        // If not both confirmed, keep current status or set to PENDING if it was none
        if (negotiation.status === 'SCOPE_CONFIRMED') {
            // should not happen if we are here
        }
    }

    await db.negotiation.update({ where: { id: negotiationId }, data: updateData })

    revalidatePath(`/dashboard/proposals/negotiation`, 'layout')
    return { success: true, scopeConfirmed: newClient && newFreelancer }
}

// ─── Submit execution counter / terms ─────────────────────────────────────── 
export async function submitExecutionTerms(
    negotiationId: string,
    data: {
        startDate?: string
        deadline?: string
        finalBudget: number
        paymentStructure: string
        advancePercent: number
        paymentTimeline: string
        hourlyRate?: number
        maxHoursPerWeek?: number
        estimatedHours?: number
        paymentFrequency?: string
        hourApprovalMethod?: string
        changeReason?: string
        milestones: { name: string; amount: number; deliveryDate?: string; releaseCondition?: string }[]
    }
) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: { executionVersions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    })
    if (!negotiation) throw new Error("Not found")

    const isClient = negotiation.clientId === user.id
    const isFreelancer = negotiation.freelancerId === user.id
    if (!isClient && !isFreelancer) throw new Error("Unauthorized")

    const latestVersion = negotiation.executionVersions[0]?.versionNumber ?? 0

    // Deactivate old versions
    await db.negotiationExecutionVersion.updateMany({
        where: { negotiationId },
        data: { isActive: false }
    })

    // Create new version
    await db.negotiationExecutionVersion.create({
        data: {
            negotiationId,
            versionNumber: latestVersion + 1,
            createdBy: isClient ? 'client' : 'freelancer',
            finalBudget: data.finalBudget,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            deadline: data.deadline ? new Date(data.deadline) : undefined,
            paymentStructure: data.paymentStructure,
            advancePercent: data.advancePercent,
            paymentTimeline: data.paymentTimeline,
            hourlyRate: data.hourlyRate,
            maxHoursPerWeek: data.maxHoursPerWeek,
            estimatedHours: data.estimatedHours,
            paymentFrequency: data.paymentFrequency,
            hourApprovalMethod: data.hourApprovalMethod,
            changeReason: data.changeReason,
            milestones: data.milestones && data.milestones.length > 0 ? {
                create: data.milestones.map(m => ({
                    name: m.name,
                    amount: m.amount,
                    deliveryDate: m.deliveryDate ? new Date(m.deliveryDate) : undefined,
                    releaseCondition: m.releaseCondition || '',
                }))
            } : undefined
        } as any
    })

    await db.negotiation.update({
        where: { id: negotiationId },
        data: {
            status: 'EXEC_COUNTER_SENT',
            execConfirmedByClient: isClient, // Proposer is auto-confirmed
            execConfirmedByFreelancer: isFreelancer, // Proposer is auto-confirmed
        }
    })

    revalidatePath(`/dashboard/proposals/negotiation`, 'layout')
    return { success: true }
}

// ─── Accept execution terms ────────────────────────────────────────────────── 
export async function acceptExecutionTerms(negotiationId: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
            executionVersions: {
                where: { isActive: true },
                include: { milestones: true }
            }
        }
    })
    if (!negotiation) throw new Error("Not found")

    const isClient = negotiation.clientId === user.id
    const isFreelancer = negotiation.freelancerId === user.id
    if (!isClient && !isFreelancer) throw new Error("Unauthorized")

    // Proposer of the active version is logically confirmed
    const activeVersion = negotiation.executionVersions.find(v => v.isActive) ?? negotiation.executionVersions[0]
    const proposerIsClient = activeVersion?.createdBy === 'client'
    const proposerIsFreelancer = activeVersion?.createdBy === 'freelancer'

    const newClient = isClient ? true : (proposerIsClient ? true : negotiation.execConfirmedByClient)
    const newFreelancer = isFreelancer ? true : (proposerIsFreelancer ? true : negotiation.execConfirmedByFreelancer)

    const updateData: any = {
        execConfirmedByClient: newClient,
        execConfirmedByFreelancer: newFreelancer,
    }

    if (newClient && newFreelancer) {
        updateData.status = 'EXEC_WAITING_CONFIRMATION'
    } else if (newClient || newFreelancer) {
        updateData.status = 'EXEC_WAITING_CONFIRMATION'
    } else {
        updateData.status = 'EXEC_PENDING'
    }

    await db.negotiation.update({ where: { id: negotiationId }, data: updateData })

    revalidatePath(`/dashboard/proposals/negotiation`, 'layout')
    return { success: true, bothConfirmed: newClient && newFreelancer }
}

// ─── Final confirm & create project ────────────────────────────────────────── 
export async function finalConfirmNegotiation(negotiationId: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
            job: true,
            application: true,
            executionVersions: {
                where: { isActive: true },
                include: { milestones: true }
            },
            scopeVersions: { where: { isActive: true }, take: 1 }
        }
    })
    if (!negotiation) throw new Error("Not found")
    if (negotiation.status !== 'EXEC_WAITING_CONFIRMATION') throw new Error("Terms not finalized yet")

    const isClient = negotiation.clientId === user.id
    const isFreelancer = negotiation.freelancerId === user.id
    if (!isClient && !isFreelancer) throw new Error("Unauthorized")

    const execVersion = negotiation.executionVersions[0]
    if (!execVersion) throw new Error("No active execution version")

    // Mark negotiation as confirmed
    await db.negotiation.update({
        where: { id: negotiationId },
        data: { status: 'CONFIRMED' }
    })

    // Accept application
    await db.jobApplication.update({
        where: { id: negotiation.applicationId },
        data: { status: 'ACCEPTED' }
    })

    // Reject all other shortlisted applications for this job
    await db.jobApplication.updateMany({
        where: {
            jobId: negotiation.jobId,
            id: { not: negotiation.applicationId },
            status: 'SHORTLISTED'
        },
        data: { status: 'REJECTED' }
    })

    // Close the job
    await db.job.update({
        where: { id: negotiation.jobId },
        data: { status: 'IN_PROGRESS' }
    })

    // Create project
    const project = await db.project.create({
        data: {
            title: negotiation.job.title,
            description: negotiation.job.description,
            budget: Math.round(execVersion.finalBudget),
            deadline: execVersion.deadline,
            clientId: negotiation.clientId,
            freelancerId: negotiation.freelancerId,
            status: 'ACTIVE',
            milestones: {
                create: [
                    {
                        title: "Project Agreement",
                        description: JSON.stringify({
                            clientAgreed: false,
                            freelancerAgreed: false,
                            originalProposalId: negotiation.applicationId,
                            startDate: execVersion.startDate
                        }),
                        amount: 0,
                        status: 'PENDING'
                    },
                    ...(execVersion.paymentStructure === 'advance'
                        ? [
                            {
                                title: "Advance Payment",
                                amount: Math.round(execVersion.finalBudget * (execVersion.advancePercent / 100)),
                                dueDate: execVersion.startDate || execVersion.deadline,
                                status: 'PENDING' as any,
                                description: `Upfront payment of ${execVersion.advancePercent}% before work begins`
                            },
                            // Include any additional delivery items (amount 0)
                            ...execVersion.milestones.filter(m => m.amount === 0).map(m => ({
                                title: m.name,
                                amount: 0,
                                dueDate: m.deliveryDate,
                                status: 'PENDING' as any,
                                description: m.releaseCondition || ''
                            })),
                            {
                                title: "Final Delivery",
                                amount: Math.round(execVersion.finalBudget * ((100 - execVersion.advancePercent) / 100)),
                                dueDate: execVersion.deadline,
                                status: 'PENDING' as any,
                                description: "Remaining balance for complete project delivery"
                            }
                        ]
                        : execVersion.paymentStructure === 'full'
                            ? [
                                // Include any additional delivery items (amount 0)
                                ...execVersion.milestones.filter(m => m.amount === 0).map(m => ({
                                    title: m.name,
                                    amount: 0,
                                    dueDate: m.deliveryDate,
                                    status: 'PENDING' as any,
                                    description: m.releaseCondition || ''
                                })),
                                {
                                    title: "Final Delivery",
                                    amount: Math.round(execVersion.finalBudget),
                                    dueDate: execVersion.deadline,
                                    status: 'PENDING' as any,
                                    description: "Complete project delivery"
                                }
                            ]
                            : execVersion.milestones.map(m => ({
                                title: m.name,
                                amount: Math.round(m.amount),
                                dueDate: m.deliveryDate,
                                status: 'PENDING' as any,
                                description: m.releaseCondition || ''
                            }))
                    )
                ]
            }
        }
    })

    // Create Order linked to the project
    const order = await db.order.create({
        data: {
            price: Math.round(execVersion.finalBudget),
            buyerId: negotiation.clientId,
            sellerId: negotiation.freelancerId,
            status: "PENDING",
            deadline: execVersion.deadline,
            // @ts-ignore
            totalRevisions: negotiation.scopeVersions[0]?.revisions || 3,
            revisionsRemaining: negotiation.scopeVersions[0]?.revisions || 3,
            // Link to the project
            project: {
                connect: { id: project.id }
            }
        }
    })

    // Update project with orderId to establish the reverse relationship
    await db.project.update({
        where: { id: project.id },
        data: { orderId: order.id }
    })

    revalidatePath(`/dashboard/proposals/negotiation`, 'layout')
    redirect(`/job-order/${order.id}`)
}

// ─── Reject/Withdraw negotiation ────────────────────────────────────────────── 
export async function rejectNegotiation(negotiationId: string, reason: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({ where: { id: negotiationId } })
    if (!negotiation) throw new Error("Not found")

    const isClient = negotiation.clientId === user.id
    const isFreelancer = negotiation.freelancerId === user.id
    if (!isClient && !isFreelancer) throw new Error("Unauthorized")

    await db.negotiation.update({
        where: { id: negotiationId },
        data: {
            status: 'REJECTED',
            rejectionReason: reason
        } as any
    })

    // If client rejects, it's a rejection. If freelancer rejects, it's a withdrawal.
    await db.jobApplication.update({
        where: { id: negotiation.applicationId },
        data: { status: isClient ? 'REJECTED' : 'WITHDRAWN' }
    })

    revalidatePath(`/dashboard/proposals/negotiation`, 'layout')
    return { success: true }
}

// ─── Withdraw a pending scope change request ───────────────────────────────── 
export async function withdrawScopeChange(negotiationId: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: { scopeVersions: { orderBy: { versionNumber: 'desc' } } }
    })
    if (!negotiation) throw new Error("Not found")

    const latestVersion = negotiation.scopeVersions[0]
    if (!latestVersion || latestVersion.versionNumber === 1) throw new Error("Cannot withdraw v1")

    // Check if user is the one who created this version
    const isCreator = (latestVersion.createdBy === 'client' && negotiation.clientId === user.id) ||
        (latestVersion.createdBy === 'freelancer' && negotiation.freelancerId === user.id)

    if (!isCreator) throw new Error("Only the requester can withdraw")

    // Deactivate current, activate previous
    await db.negotiationScopeVersion.update({
        where: { id: latestVersion.id },
        data: { isActive: false }
    })

    const prevVersion = negotiation.scopeVersions[1]
    if (prevVersion) {
        await db.negotiationScopeVersion.update({
            where: { id: prevVersion.id },
            data: { isActive: true }
        })
    }

    // Reset negotiation status
    await db.negotiation.update({
        where: { id: negotiationId },
        data: {
            status: 'SCOPE_PENDING',
            scopeConfirmedByClient: false,
            scopeConfirmedByFreelancer: false
        }
    })

    revalidatePath(`/dashboard/proposals/negotiation`, 'layout')
    return { success: true }
}

// ─── Withdraw a pending execution terms request ────────────────────────────── 
export async function withdrawExecutionTerms(negotiationId: string) {
    const user = await getSessionOrThrow()

    const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: { executionVersions: { orderBy: { versionNumber: 'desc' } } }
    })
    if (!negotiation) throw new Error("Not found")

    const latestVersion = negotiation.executionVersions[0]
    if (!latestVersion || latestVersion.versionNumber === 1) throw new Error("Cannot withdraw v1")

    // Check if user is the one who created this version
    const isCreator = (latestVersion.createdBy === 'client' && negotiation.clientId === user.id) ||
        (latestVersion.createdBy === 'freelancer' && negotiation.freelancerId === user.id)

    if (!isCreator) throw new Error("Only the requester can withdraw")

    // Deactivate current, activate previous
    await db.negotiationExecutionVersion.update({
        where: { id: latestVersion.id },
        data: { isActive: false }
    })

    const prevVersion = negotiation.executionVersions[1]
    if (prevVersion) {
        await db.negotiationExecutionVersion.update({
            where: { id: prevVersion.id },
            data: { isActive: true }
        })
    }

    // Reset negotiation status
    await db.negotiation.update({
        where: { id: negotiationId },
        data: {
            status: 'EXEC_PENDING',
            execConfirmedByClient: false,
            execConfirmedByFreelancer: false
        }
    })

    revalidatePath(`/dashboard/proposals/negotiation`)
    return { success: true }
}
