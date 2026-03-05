"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/notifications" // Assuming this imports properly
import { updateCredibility } from "@/lib/credibility"

// Helper: get a display title for an order (service title > project title > generic)
function getOrderTitle(order: any): string {
  return order.service?.title || order.project?.title || `Order #${order.id.slice(0, 8)}`
}

// Helper: get the correct link for an order
function getOrderLink(order: any): string {
  if (order.serviceId || order.service) {
    return `/service-order/${order.id}`
  }
  if (order.productId || order.product) {
    return `/product-order/${order.id}`
  }
  if (order.project || (order.project && order.project.id)) {
    return `/job-order/${order.id}`
  }
  return `/service-order/${order.id}`
}

export async function markServiceComplete(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const orderId = formData.get("orderId") as string
  const deliveryUrl = formData.get("deliveryUrl") as string

  if (!orderId || !deliveryUrl) return

  // 1. Update Order AND fetch 'service' data in the same call
  const order = await db.order.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
      deliveryUrl: deliveryUrl,
      revisionRequested: false // Clear any revision request on completion
    },
    include: {
      service: true,
      project: true
    }
  })

  const link = getOrderLink(order)

  // 2. Send Notification
  await createNotification(
    order.buyerId,
    `Your work for "${getOrderTitle(order)}" is ready!`,
    link
  )

  // 3. Update Credibility Score
  await updateCredibility(order.sellerId, "ORDER_COMPLETED")

  // Bonus: On-time delivery
  if (order.deadline && new Date() <= new Date(order.deadline)) {
    await updateCredibility(order.sellerId, "ON_TIME_DELIVERY")
  }

  revalidatePath(link)
  revalidatePath("/dashboard")
}

export async function cancelService(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const orderId = formData.get("orderId") as string
  if (!orderId) return

  // Fetch order to verify ownership and status
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { service: true, project: true }
  })

  if (!order) return

  // Only seller can cancel AND only if not completed
  if (order.sellerId !== session.user.id) {
    throw new Error("Unauthorized: Only the seller can cancel this service")
  }

  if (order.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed service")
  }

  if (order.status === "CANCELLED") {
    throw new Error("Service is already cancelled")
  }

  // Cancel the order
  await db.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" }
  })

  const link = getOrderLink(order)

  // Notify the buyer
  await createNotification(
    order.buyerId,
    `Your order for "${getOrderTitle(order)}" has been cancelled by the freelancer.`,
    link
  )

  // Update Credibility Score
  await updateCredibility(order.sellerId, "SELLER_CANCELLED")

  revalidatePath(link)
  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function requestRevision(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const orderId = formData.get("orderId") as string
  const description = formData.get("description") as string

  if (!orderId || !description) return

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { service: true, project: true }
  })

  if (!order || order.buyerId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  // A Service order has a serviceId. A Job order does not.
  const isJob = !order.serviceId

  if (!isJob && order.revisionsRemaining !== -1 && order.revisionsRemaining <= 0) {
    throw new Error("No revisions remaining")
  }

  const updateData: any = {
    status: "REVISION_REQUESTED",
    revisionRequested: true,
    revisionDescription: description
  }

  if (!isJob && order.revisionsRemaining !== -1) {
    updateData.revisionsRemaining = { decrement: 1 }
  }

  await db.order.update({
    where: { id: orderId },
    data: updateData
  })

  const link = getOrderLink(order)

  await createNotification(
    order.sellerId,
    `Revision requested for "${getOrderTitle(order)}"`,
    link
  )

  revalidatePath(link)
}

export async function acceptRevision(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const orderId = formData.get("orderId") as string
  if (!orderId) return

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { service: true, project: true }
  })

  if (!order || order.sellerId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      status: "IN_REVISION",
      revisionRequested: false
    }
  })

  const link = getOrderLink(order)

  await createNotification(
    order.buyerId,
    `Freelancer accepted your revision for "${getOrderTitle(order)}"`,
    link
  )

  revalidatePath(link)
}

export async function denyRevision(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const orderId = formData.get("orderId") as string
  const reason = formData.get("reason") as string
  if (!orderId) return

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { service: true, project: true }
  })

  if (!order || order.sellerId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      status: "REVISION_DENIED",
      revisionRequested: false,
      revisionDenialReason: reason
    }
  })

  const link = getOrderLink(order)

  await createNotification(
    order.buyerId,
    `Freelancer declined your revision for "${getOrderTitle(order)}"`,
    link
  )

  revalidatePath(link)
}

export async function raiseServiceDispute(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    console.error("No session found")
    return
  }

  const orderId = formData.get("orderId") as string
  const reason = formData.get("reason") as string

  console.log("Dispute form data:", { orderId, reason, userId: session.user.id })

  if (!orderId || !reason) {
    console.error("Missing required fields:", { orderId, reason })
    return
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { service: true, project: true }
  })

  if (!order) {
    console.error("Order not found:", orderId)
    return
  }

  if (order.buyerId !== session.user.id) {
    console.error("Unauthorized - user is not buyer:", { buyerId: order.buyerId, userId: session.user.id })
    throw new Error("Unauthorized")
  }

  console.log("Creating dispute for order:", orderId)

  try {
    // Update order status to DISPUTED
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "DISPUTED"
      }
    })

    // Create dispute record
    const dispute = await db.dispute.create({
      data: {
        reason: reason,
        orderId: orderId,
        raisedById: session.user.id,
        status: "OPEN"
      }
    })

    console.log("Dispute created successfully:", dispute.id)

    const link = `/service-order/${orderId}`

    // Notify seller
    await createNotification(
      order.sellerId,
      `A dispute has been raised for "${getOrderTitle(order)}"`,
      link
    )

    revalidatePath(`/service-order/${orderId}`)
    revalidatePath(`/job-order/${orderId}`)
    revalidatePath('/dashboard')

    console.log("Redirecting to:", link)
    redirect(link)
  } catch (error) {
    console.error("Error creating dispute:", error)
    throw error
  }
}

export async function submitMilestone(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const milestoneId = formData.get("milestoneId") as string
  const deliveryUrl = formData.get("deliveryUrl") as string
  const orderId = formData.get("orderId") as string

  if (!milestoneId || !deliveryUrl || !orderId) return

  // Update milestone
  await db.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "SUBMITTED",
      deliveryUrl,
      submittedAt: new Date(),
      revisionDescription: null,
      revisionDenialReason: null
    }
  })

  // notify buyer
  const order = await db.order.findUnique({ where: { id: orderId }, include: { service: true, project: true } })
  if (order) {
    const link = getOrderLink(order)
    await createNotification(
      order.buyerId,
      `Work submitted for a development stage in "${getOrderTitle(order)}"`,
      link
    )
  }

  revalidatePath(`/service-order/${orderId}`)
  revalidatePath(`/job-order/${orderId}`)
}

export async function approveMilestone(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const milestoneId = formData.get("milestoneId") as string
  const orderId = formData.get("orderId") as string

  if (!milestoneId || !orderId) return

  const milestone = await db.milestone.findUnique({
    where: { id: milestoneId },
    include: { project: true }
  })

  const orderStr = await db.order.findUnique({
    where: { id: orderId },
    include: { service: true, project: true }
  })

  if (!milestone || !orderStr) return

  // Pay out to freelancer 
  const payoutAmount = milestone.escrowAmount > 0 ? milestone.escrowAmount : milestone.amount;

  if (payoutAmount > 0) {
    // If no escrow, try to deduct from buyer first
    if (milestone.escrowAmount === 0) {
      const buyer = await db.user.findUnique({ where: { id: orderStr.buyerId } });
      if (!buyer || buyer.balance < payoutAmount) {
        throw new Error("Insufficient buyer balance for payment");
      }

      // Deduct from buyer
      await db.user.update({
        where: { id: orderStr.buyerId },
        data: { balance: { decrement: payoutAmount } }
      });
    }

    // Credit freelancer
    await db.user.update({
      where: { id: orderStr.sellerId },
      data: { balance: { increment: payoutAmount } }
    })

    // Create transaction log
    await db.transaction.create({
      data: {
        amount: payoutAmount,
        type: "MILESTONE_RELEASE",
        status: "COMPLETED",
        userId: orderStr.sellerId,
        milestoneId: milestone.id,
        projectId: milestone.projectId
      }
    })
  }

  await db.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "APPROVED",
      escrowAmount: 0
    }
  })

  // Check if all development milestones are approved
  const allMilestones = await db.milestone.findMany({
    where: {
      projectId: milestone.projectId,
      NOT: { title: "Project Agreement" }
    }
  })

  const allApproved = allMilestones.length > 0 && allMilestones.every(m => m.status === 'APPROVED')

  if (allApproved) {
    await db.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED" }
    })
    // Award credibility for project completion
    await updateCredibility(orderStr.sellerId, "PROJECT_COMPLETED")

    // Bonus for on-time delivery
    if (orderStr.deadline && new Date() <= new Date(orderStr.deadline)) {
      await updateCredibility(orderStr.sellerId, "ON_TIME_DELIVERY")
    }
  }

  // notify seller
  // notify seller
  if (orderStr) {
    const link = getOrderLink(orderStr)
    await createNotification(
      orderStr.sellerId,
      allApproved
        ? `All stages approved! Order "${getOrderTitle(orderStr)}" is now complete.`
        : `Development stage approved for "${getOrderTitle(orderStr)}"`,
      link
    )
  }

  revalidatePath(`/service-order/${orderId}`)
  revalidatePath(`/job-order/${orderId}`)
}

export async function requestMilestoneRevision(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const milestoneId = formData.get("milestoneId") as string
  const orderId = formData.get("orderId") as string
  const description = formData.get("description") as string

  if (!milestoneId || !orderId || !description) return

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { project: { include: { milestones: true } } }
  })

  if (!order || order.buyerId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  // Respect revision limits if they aren't unlimited (-1)
  if (order.revisionsRemaining !== -1 && order.revisionsRemaining <= 0) {
    throw new Error("No revisions remaining. You must accept the current delivery.")
  }

  await db.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "REVISION_REQUESTED",
      revisionDescription: description
    }
  })

  // Decrement revision count if applicable
  if (order.revisionsRemaining !== -1) {
    await db.order.update({
      where: { id: orderId },
      data: {
        revisionsRemaining: { decrement: 1 }
      }
    })
  }

  const link = getOrderLink(order)

  await createNotification(
    order.sellerId,
    `Revision requested for milestone in "${getOrderTitle(order)}"`,
    link
  )

  revalidatePath(link)
}

export async function acceptMilestoneRevision(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const milestoneId = formData.get("milestoneId") as string
  const orderId = formData.get("orderId") as string

  if (!milestoneId || !orderId) return

  const order = await db.order.findUnique({
    where: { id: orderId }
  })

  if (!order || order.sellerId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  await db.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "IN_REVISION"
    }
  })

  const link = getOrderLink(order)

  await createNotification(
    order.buyerId,
    `Freelancer accepted your revision for milestone in "${getOrderTitle(order)}"`,
    link
  )

  revalidatePath(link)
}

export async function denyMilestoneRevision(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const milestoneId = formData.get("milestoneId") as string
  const orderId = formData.get("orderId") as string
  const reason = formData.get("reason") as string

  if (!milestoneId || !orderId) return

  const order = await db.order.findUnique({
    where: { id: orderId }
  })

  if (!order || order.sellerId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  await db.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "REJECTED",
      revisionDenialReason: reason
    }
  })

  const link = getOrderLink(order)

  await createNotification(
    order.buyerId,
    `Freelancer declined your milestone revision for "${getOrderTitle(order)}"`,
    link
  )

  revalidatePath(link)
}


