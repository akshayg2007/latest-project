"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"

function getOrderTitle(order: any): string {
    return order.product?.name || `Order #${order.id.slice(0, 8)}`
}

export async function raiseProductDispute(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return

    const orderId = formData.get("orderId") as string
    const reason = formData.get("reason") as string

    if (!orderId || !reason) return

    const order = await db.order.findUnique({
        where: { id: orderId },
        include: { product: true }
    })

    if (!order || order.buyerId !== session.user.id) {
        throw new Error("Unauthorized")
    }

    // Update order status to DISPUTED
    await db.order.update({
        where: { id: orderId },
        data: {
            status: "DISPUTED"
        }
    })

    // Create dispute record
    await db.dispute.create({
        data: {
            reason: reason,
            orderId: orderId,
            raisedById: session.user.id,
            status: "OPEN"
        }
    })

    // Notify seller
    await createNotification(
        order.sellerId,
        `A dispute has been raised for product "${getOrderTitle(order)}"`,
        `/product-order/${order.id}`
    )

    revalidatePath(`/product-order/${orderId}`)
}
