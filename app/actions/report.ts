"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ReportType, ReportStatus } from "@prisma/client"

export async function submitReport(formData: {
    targetId: string;
    targetType: ReportType;
    reason: string;
    details?: string;
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const { targetId, targetType, reason, details } = formData

    if (!targetId || !targetType || !reason) {
        throw new Error("Missing required fields")
    }

    const report = await db.report.create({
        data: {
            reporterId: session.user.id,
            targetId,
            targetType,
            reason,
            details,
        }
    })

    // Revalidate paths depending on what was reported (optional but good practice)
    revalidatePath("/admin/moderation/reports")

    return { success: true, reportId: report.id }
}

import { updateCredibility } from "@/lib/credibility"

export async function updateReportStatus(reportId: string, status: ReportStatus) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin access required")

    // Fetch report details first to know what we are dealing with
    const report = await db.report.findUnique({
        where: { id: reportId },
        include: {
            reporter: true
        }
    })

    if (!report) throw new Error("Report not found")

    if (status === "RESOLVED") {
        const { targetId, targetType, reason } = report;

        switch (targetType) {
            case "USER":
                await db.user.update({
                    where: { id: targetId },
                    data: {
                        isBanned: true,
                        banReason: `Report Resolved: ${reason}`
                    }
                })
                // Penalty for reported user
                await updateCredibility(targetId, "USER_BANNED")
                await createNotification(targetId, `Your account has been banned due to reports. Reason: ${reason}`, "/support")
                break;

            case "COMMENT":
                const comment = await db.comment.findUnique({ where: { id: targetId } })
                if (comment) {
                    await db.comment.delete({ where: { id: targetId } })
                    // Penalty for comment author
                    await updateCredibility(comment.authorId, "CONTENT_REMOVED")
                    await createNotification(comment.authorId, `Your comment was removed by moderators.`, "/dashboard")
                }
                break;

            case "POST":
                await db.post.update({
                    where: { id: targetId },
                    data: { isRemoved: true, removalReason: reason }
                })
                const post = await db.post.findUnique({ where: { id: targetId } })
                if (post) {
                    await updateCredibility(post.authorId, "CONTENT_REMOVED")
                    await createNotification(post.authorId, `Your post "${post.title}" was removed by moderators.`, "/dashboard")
                }
                break;

            case "SERVICE":
                const service = await db.service.update({
                    where: { id: targetId },
                    data: { isRemoved: true, removalReason: reason }
                })
                await updateCredibility(service.sellerId, "CONTENT_REMOVED")
                await createNotification(service.sellerId, `Your service "${service.title}" was removed by moderators.`, "/dashboard")
                break;

            case "PRODUCT":
                const product = await db.product.update({
                    where: { id: targetId },
                    data: { isRemoved: true, removalReason: reason }
                })
                await updateCredibility(product.sellerId, "CONTENT_REMOVED")
                await createNotification(product.sellerId, `Your product "${product.name}" was removed by moderators.`, "/dashboard")
                break;

            case "JOB":
                const job = await db.job.update({
                    where: { id: targetId },
                    data: { isRemoved: true, removalReason: reason }
                })
                await updateCredibility(job.clientId, "CONTENT_REMOVED")
                await createNotification(job.clientId, `Your job "${job.title}" was removed by moderators.`, "/dashboard")
                break;

            case "MESSAGE":
                // Just resolve messages for now, maybe delete in future if needed
                break;
        }
    } else if (status === "DISMISSED") {
        // False report penalty for reporter
        await updateCredibility(report.reporterId, "FALSE_REPORT")
        await createNotification(report.reporterId, `Your report was dismissed by administrators as unfounded.`, "/dashboard")
    }


    await db.report.update({
        where: { id: reportId },
        data: { status }
    })

    revalidatePath("/admin/moderation/reports")
    return { success: true }
}

export async function getReports(status?: ReportStatus) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") throw new Error("Unauthorized: Admin access required")

    return await db.report.findMany({
        where: status ? { status } : {},
        include: {
            reporter: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}
