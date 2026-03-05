"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/notifications"
import { logAdminAction } from "@/lib/audit-log"
import { updateCredibility } from "@/lib/credibility"

export async function resolveDispute(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Check if user is admin
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (user?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const disputeId = formData.get("disputeId") as string
    const resolution = formData.get("resolution") as string
    const decision = formData.get("decision") as "REFUND_BUYER" | "PAY_SELLER" | "DISMISS"

    if (!disputeId || !resolution || !decision) throw new Error("Missing required fields")

    const dispute = await db.dispute.findUnique({
        where: { id: disputeId },
        include: {
            order: {
                include: { service: true, product: true }
            },
            project: {
                include: { milestones: true }
            }
        }
    })

    if (!dispute || !dispute.order) throw new Error("Dispute or Order not found")

    const orderId = dispute.orderId!
    const isProduct = !!dispute.order.productId
    const orderPath = isProduct ? `/product-order/${orderId}` : `/service-order/${orderId}`

    try {
        await db.$transaction(async (tx) => {
            const currentOrder = dispute.order!
            if (decision === "REFUND_BUYER") {
                // 1. Update Order to CANCELLED
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: "CANCELLED" }
                })

                // 2. Handle Project and Milestones Escrow Refund
                if (dispute.projectId && dispute.project) {
                    const currentProject = dispute.project
                    await tx.project.update({
                        where: { id: dispute.projectId },
                        data: { status: "CANCELLED" }
                    })

                    // Refund all escrowed funds from milestones back to the buyer
                    for (const milestone of currentProject.milestones) {
                        if ((milestone as any).escrowAmount > 0) {
                            await (tx.user as any).update({
                                where: { id: currentProject.clientId },
                                data: { balance: { increment: (milestone as any).escrowAmount } }
                            })
                            await (tx.milestone as any).update({
                                where: { id: milestone.id },
                                data: {
                                    status: "REJECTED",
                                    escrowAmount: 0
                                }
                            })
                        }
                    }
                }

                // Penalty for seller
                await updateCredibility(currentOrder.sellerId, "DISPUTE_LOST")

            } else if (decision === "PAY_SELLER" || decision === "DISMISS") {
                // 1. Update Order to COMPLETED
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: "COMPLETED" }
                })

                // 2. Handle Project and Milestones Escrow Payout
                if (dispute.projectId && dispute.project) {
                    const currentProject = dispute.project
                    await tx.project.update({
                        where: { id: dispute.projectId },
                        data: { status: "COMPLETED" }
                    })

                    if (decision === "PAY_SELLER") {
                        // Release all escrowed funds from milestones to the seller
                        for (const milestone of currentProject.milestones) {
                            if ((milestone as any).escrowAmount > 0) {
                                await (tx.user as any).update({
                                    where: { id: currentProject.freelancerId },
                                    data: { balance: { increment: (milestone as any).escrowAmount } }
                                })
                                await (tx.milestone as any).update({
                                    where: { id: milestone.id },
                                    data: {
                                        status: "APPROVED",
                                        escrowAmount: 0
                                    }
                                })
                            }
                        }
                    } else if (decision === "DISMISS") {
                        // If dismissed, we might want to just keep things as they are?
                        // But if we set Order to COMPLETED, we should probably also approve milestones
                        // Or just let them continue? Usually "Dismiss" means "Request was invalid".
                        // In current flow, we'll mark milestones as approved to release funds.
                        for (const milestone of currentProject.milestones) {
                            if ((milestone as any).escrowAmount > 0) {
                                await (tx.user as any).update({
                                    where: { id: currentProject.freelancerId },
                                    data: { balance: { increment: (milestone as any).escrowAmount } }
                                })
                                await (tx.milestone as any).update({
                                    where: { id: milestone.id },
                                    data: {
                                        status: "APPROVED",
                                        escrowAmount: 0
                                    }
                                })
                            }
                        }
                    }
                }

                if (decision === "PAY_SELLER") {
                    // Bonus for seller
                    await updateCredibility(currentOrder.sellerId, "DISPUTE_WON")
                }
            }

            // Mark dispute as RESOLVED
            await tx.dispute.update({
                where: { id: disputeId },
                data: {
                    status: "RESOLVED",
                    resolution: resolution,
                    decision: decision
                }
            })
        })

        // 3. Notifications (Outside transaction for better performance)
        const buyerId = dispute.order.buyerId
        const sellerId = dispute.order.sellerId

        if (decision === "REFUND_BUYER") {
            await createNotification(
                buyerId,
                `Dispute resolved: You have been issued a full refund for Case #${disputeId.slice(0, 8)}.`,
                orderPath
            )
            await createNotification(
                sellerId,
                `Dispute resolved: Refund issued to buyer for Case #${disputeId.slice(0, 8)}. No payout was issued.`,
                orderPath
            )
        } else if (decision === "PAY_SELLER") {
            await createNotification(
                sellerId,
                `Dispute resolved: Case #${disputeId.slice(0, 8)} ruled in your favor. Funds released.`,
                orderPath
            )
            await createNotification(
                buyerId,
                `Dispute resolved: Case #${disputeId.slice(0, 8)} resolved in favor of the seller.`,
                orderPath
            )
        } else if (decision === "DISMISS") {
            await createNotification(
                sellerId,
                `Dispute Dismissed: The original sale for Case #${disputeId.slice(0, 8)} stands.`,
                orderPath
            )
            await createNotification(
                buyerId,
                `Dispute Dismissed: The original transaction for Case #${disputeId.slice(0, 8)} has been upheld.`,
                orderPath
            )
        }
    } catch (error) {
        console.error("Dispute resolution failed:", error)
        throw new Error("Failed to resolve dispute")
    }

    await logAdminAction(session.user.id, session.user.name || "Admin", `Resolved dispute (${decision})`, "Dispute", disputeId, `Resolution: ${resolution}`)

    revalidatePath(`/admin/disputes`)
    revalidatePath(`/admin/disputes/${disputeId}`)
    revalidatePath(orderPath)

    redirect("/admin/disputes")
}

export async function sendDisputeMessage(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const disputeId = formData.get("disputeId") as string
    const text = formData.get("text") as string

    if (!disputeId || !text) return

    const dispute = await db.dispute.findUnique({
        where: { id: disputeId },
        include: {
            order: true,
            project: true
        }
    })

    if (!dispute) throw new Error("Dispute not found")

    // Check if user is buyer, seller, or admin
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    const isAdmin = user?.role === "ADMIN"
    const isBuyer = (dispute.order?.buyerId === session.user.id) || (dispute.project?.clientId === session.user.id)
    const isSeller = (dispute.order?.sellerId === session.user.id) || (dispute.project?.freelancerId === session.user.id)

    if (!isAdmin && !isBuyer && !isSeller) {
        throw new Error("Unauthorized: You are not a party to this dispute")
    }

    await db.disputeMessage.create({
        data: {
            text,
            disputeId,
            senderId: session.user.id
        }
    })

    revalidatePath(`/admin/disputes/${disputeId}`)
    revalidatePath(`/dashboard/projects/disputes/${disputeId}`)
    if (dispute.orderId) {
        const order = await db.order.findUnique({ where: { id: dispute.orderId }, select: { productId: true } })
        const path = order?.productId ? `/product-order/${dispute.orderId}` : `/service-order/${dispute.orderId}`
        revalidatePath(path)
    }
}

export async function impersonateUser(targetUserId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify current user is an admin
    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (admin?.role !== "ADMIN") {
        throw new Error("Unauthorized: Only admins can impersonate users")
    }

    // Get target user data
    const targetUser = await db.user.findUnique({
        where: { id: targetUserId }
    })

    if (!targetUser) throw new Error("Target user not found")

    // Return the data needed to update the session
    return {
        sub: targetUser.id,
        name: targetUser.username,
        email: targetUser.email,
        onboardingComplete: targetUser.onboardingComplete,
        activeProfile: targetUser.activeProfile,
        role: targetUser.role,
        image: targetUser.avatarUrl,
        impersonatingFromId: session.user.id // Store the admin's original ID
    }
}

export async function stopImpersonating() {
    const session = await auth()
    // @ts-ignore
    const originalAdminId = session?.user?.impersonatingFromId

    if (!originalAdminId) {
        throw new Error("No impersonation session found")
    }

    // Fetch original admin data
    const admin = await db.user.findUnique({
        where: { id: originalAdminId }
    })

    if (!admin) throw new Error("Original admin not found")

    // Return the data needed to restore the admin session
    return {
        sub: admin.id,
        name: admin.username,
        email: admin.email,
        onboardingComplete: admin.onboardingComplete,
        activeProfile: admin.activeProfile,
        role: admin.role,
        image: admin.avatarUrl,
        impersonatingFromId: null // Explicitly clear with null
    }
}

export async function moderateListing(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Check if user is admin
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (user?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const listingId = formData.get("listingId") as string
    const listingType = formData.get("listingType") as string
    const reason = formData.get("reason") as string
    const action = formData.get("action") as "REMOVE" | "RESTORE"

    if (!listingId || !listingType || (!reason && action !== "RESTORE")) throw new Error("Missing required fields")

    let sellerId: string | undefined;
    let title: string | undefined;

    const isRemoving = action !== "RESTORE";

    if (listingType === "service") {
        const listing = await db.service.update({
            where: { id: listingId },
            data: {
                isRemoved: isRemoving,
                removalReason: isRemoving ? reason : null
            },
            select: { sellerId: true, title: true }
        })
        if (listing) {
            sellerId = listing.sellerId
            title = listing.title
        }
    } else if (listingType === "product") {
        const listing = await db.product.update({
            where: { id: listingId },
            data: {
                isRemoved: isRemoving,
                removalReason: isRemoving ? reason : null
            },
            select: { sellerId: true, name: true }
        })
        if (listing) {
            sellerId = listing.sellerId
            title = listing.name
        }
    } else if (listingType === "job") {
        const listing = await db.job.update({
            where: { id: listingId },
            data: {
                isRemoved: isRemoving,
                removalReason: isRemoving ? reason : null
            },
            select: { clientId: true, title: true }
        })
        if (listing) {
            sellerId = listing.clientId
            title = listing.title
        }
    }

    if (sellerId && title) {
        const message = isRemoving
            ? `Your ${listingType} "${title}" has been removed by an admin. Reason: ${reason}`
            : `Your ${listingType} "${title}" has been restored by an admin.`;

        await createNotification(
            sellerId,
            message,
            listingType === 'job'
                ? `/dashboard/explore/jobs/${listingId}`
                : listingType === 'product'
                    ? `/dashboard/explore/products/${listingId}`
                    : `/dashboard/explore/services/${listingId}`
        )
    }

    await logAdminAction(session.user.id, session.user.name || "Admin", `${isRemoving ? "Removed" : "Restored"} ${listingType}: ${title}`, listingType, listingId, isRemoving ? `Reason: ${reason}` : "Restored listing")

    revalidatePath("/admin/moderation")
    return { success: true }
}

export async function banUser(userId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, username: true }
    })
    if (!targetUser) throw new Error("User not found")
    if (targetUser.role === "ADMIN") throw new Error("Cannot ban an admin")

    await db.user.update({
        where: { id: userId },
        data: {
            isBanned: true,
            banReason: reason,
            suspendedUntil: null,
            suspensionReason: null,
        }
    })

    await createNotification(
        userId,
        `Your account has been permanently banned. Reason: ${reason}. Contact support if you believe this is an error.`,
        "/support"
    )

    await logAdminAction(session.user.id, session.user.name || "Admin", `Banned user @${targetUser.username}`, "User", userId, `Reason: ${reason}`)

    revalidatePath("/admin/users")
    return { success: true }
}

export async function suspendUser(userId: string, reason: string, durationDays: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, username: true }
    })
    if (!targetUser) throw new Error("User not found")
    if (targetUser.role === "ADMIN") throw new Error("Cannot suspend an admin")

    const suspendedUntil = new Date()
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays)

    await db.user.update({
        where: { id: userId },
        data: {
            suspendedUntil,
            suspensionReason: reason,
        }
    })

    await createNotification(
        userId,
        `Your account has been suspended for ${durationDays} day${durationDays > 1 ? "s" : ""}. Reason: ${reason}. You can still browse but some features are restricted.`,
        "/dashboard"
    )

    await logAdminAction(session.user.id, session.user.name || "Admin", `Suspended user @${targetUser.username} for ${durationDays} days`, "User", userId, `Reason: ${reason}`)

    revalidatePath("/admin/users")
    return { success: true }
}

export async function unbanUser(userId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    await db.user.update({
        where: { id: userId },
        data: {
            isBanned: false,
            banReason: null,
        }
    })

    await createNotification(
        userId,
        `Your account ban has been lifted. Welcome back!`,
        "/dashboard"
    )

    await logAdminAction(session.user.id, session.user.name || "Admin", "Unbanned user", "User", userId)

    revalidatePath("/admin/users")
    return { success: true }
}

export async function unsuspendUser(userId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    await db.user.update({
        where: { id: userId },
        data: {
            suspendedUntil: null,
            suspensionReason: null,
        }
    })

    await createNotification(
        userId,
        `Your account suspension has been lifted early. Welcome back!`,
        "/dashboard"
    )

    await logAdminAction(session.user.id, session.user.name || "Admin", "Unsuspended user", "User", userId)

    revalidatePath("/admin/users")
    return { success: true }
}

export async function toggleShadowBan(userId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { isShadowBanned: true }
    })

    if (!user) throw new Error("User not found")

    await db.user.update({
        where: { id: userId },
        data: {
            isShadowBanned: !user.isShadowBanned
        }
    })

    await logAdminAction(session.user.id, session.user.name || "Admin", `${!user.isShadowBanned ? "Shadow banned" : "Removed shadow ban from"} user`, "User", userId)

    revalidatePath("/admin/users")
    return { success: true, isShadowBanned: !user.isShadowBanned }
}

export async function moderatePost(postId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const post = await db.post.update({
        where: { id: postId },
        data: {
            // isRemoved: true, // Assuming schema has this, let's check
            content: `[Removed by Administrator for: ${reason}]`,
            title: `[Removed] ${postId.slice(0, 8)}`
        },
        select: { authorId: true, title: true }
    })

    if (post) {
        await createNotification(
            post.authorId,
            `Your post has been moderated and its content removed. Reason: ${reason}`,
            "/dashboard/community"
        )
    }

    revalidatePath("/dashboard/community")
    revalidatePath(`/dashboard/community/${postId}`)
    return { success: true }
}

export async function moderateComment(commentId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const comment = await db.comment.update({
        where: { id: commentId },
        data: {
            text: `[Comment removed by Administrator for: ${reason}]`
        },
        select: { authorId: true, postId: true }
    })

    if (comment) {
        await createNotification(
            comment.authorId,
            `Your comment has been removed by an administrator. Reason: ${reason}`,
            `/dashboard/community/${comment.postId}`
        )
        revalidatePath(`/dashboard/community/${comment.postId}`)
    }

    return { success: true }
}

export async function promoteToAdmin(username: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, username: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    const trimmed = username.trim().replace(/^@/, "")
    if (!trimmed) throw new Error("Username is required")

    if (trimmed.toLowerCase() === admin.username?.toLowerCase()) {
        throw new Error("You are already an admin")
    }

    const targetUser = await db.user.findUnique({
        where: { username: trimmed },
        select: { id: true, role: true, username: true }
    })

    if (!targetUser) throw new Error(`User "@${trimmed}" not found`)
    if (targetUser.role === "ADMIN") throw new Error(`@${targetUser.username} is already an admin`)

    await db.user.update({
        where: { id: targetUser.id },
        data: { role: "ADMIN" }
    })

    await createNotification(
        targetUser.id,
        `You have been promoted to Admin by @${admin.username}. You now have access to the Admin Console.`,
        "/admin/dashboard"
    )

    await logAdminAction(session.user.id, admin.username || "Admin", `Promoted @${targetUser.username} to Admin`, "User", targetUser.id)

    revalidatePath("/admin/settings")
    revalidatePath("/admin/users")
    return { success: true, username: targetUser.username }
}

export async function demoteAdmin(userId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const admin = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, username: true }
    })
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized: Admin only")

    if (userId === session.user.id) {
        throw new Error("You cannot remove your own admin role")
    }

    const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, username: true }
    })

    if (!targetUser) throw new Error("User not found")
    if (targetUser.role !== "ADMIN") throw new Error("This user is not an admin")

    // Prevent removing the last admin
    const adminCount = await db.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) throw new Error("Cannot remove the last admin")

    await db.user.update({
        where: { id: targetUser.id },
        data: { role: "USER" }
    })

    await createNotification(
        targetUser.id,
        `Your admin privileges have been revoked by @${admin.username}.`,
        "/dashboard"
    )

    await logAdminAction(session.user.id, admin.username || "Admin", `Demoted @${targetUser.username} from Admin`, "User", targetUser.id)

    revalidatePath("/admin/settings")
    revalidatePath("/admin/users")
    return { success: true, username: targetUser.username }
}
