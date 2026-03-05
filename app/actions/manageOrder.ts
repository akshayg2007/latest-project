"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/notifications"
import { updateCredibility } from "@/lib/credibility"

export async function markOrderComplete(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const orderId = formData.get("orderId") as string
  const deliveryUrl = formData.get("deliveryUrl") as string

  if (!orderId || !deliveryUrl) return

  // 1. Update Order AND fetch 'gig' data in the same call
  const order = await db.order.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
      deliveryUrl: deliveryUrl
    },
    include: {
      service: true
    }
  })

  // 2. Send Notification
  await createNotification(
    order.buyerId,
    `Your order for ${order.service?.title} is ready!`,
    `/service-order/${order.id}`
  )

  // 3. Update Credibility
  await updateCredibility(order.sellerId, "ORDER_COMPLETED")

  // Bonus: On-time delivery
  if (order.deadline && new Date() <= new Date(order.deadline)) {
    await updateCredibility(order.sellerId, "ON_TIME_DELIVERY")
  }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath("/dashboard")
}

export async function cancelOrder(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const orderId = formData.get("orderId") as string
  if (!orderId) return

  // Fetch order to verify ownership and status
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { service: true }
  })

  if (!order) return

  // Only seller can cancel AND only if not completed
  if (order.sellerId !== session.user.id) {
    throw new Error("Unauthorized: Only the seller can cancel this order")
  }

  if (order.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed order")
  }

  if (order.status === "CANCELLED") {
    throw new Error("Order is already cancelled")
  }

  // Cancel the order
  await db.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" }
  })

  // Notify the buyer
  await createNotification(
    order.buyerId,
    `Your order for "${order.service?.title}" has been cancelled by the seller.`,
    `/service-order/${order.id}`
  )

  // Update Credibility
  await updateCredibility(order.sellerId, "SELLER_CANCELLED")

  revalidatePath(`/orders/${orderId}`)
  revalidatePath("/dashboard")
  redirect("/dashboard")
}
