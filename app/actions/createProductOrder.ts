"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/notifications"
import crypto from "crypto"
import { checkUserRestriction } from "@/lib/checkSuspension"
import { updateCredibility } from "@/lib/credibility"

export async function createProductOrder(formData: FormData) {
    const session = await auth()

    if (!session?.user?.id) return redirect("/api/auth/signin")

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) throw new Error(restriction)

    const productId = formData.get("productId") as string
    if (!productId) return

    const product = await db.product.findUnique({
        where: { id: productId }
    })

    if (!product) {
        throw new Error("Product not found")
    }

    // Create Order
    // Generate ID manually to bypass Prisma Client validation issues
    const orderId = crypto.randomUUID()

    // Use raw query to insert order, avoiding stale Prisma Client types that demand 'gig' relation
    await db.$executeRaw`
        INSERT INTO "Order" ("id", "price", "status", "buyerId", "sellerId", "productId", "createdAt", "revisionsRemaining", "revisionRequested")
        VALUES (${orderId}, ${product.price}, 'PAID', ${session.user.id}, ${product.sellerId}, ${product.id}, NOW(), 0, false)
    `

    const order = { id: orderId }

    // Send Notification
    await createNotification(
        product.sellerId,
        `New order for product ${product.name}!`,
        `/product-order/${orderId}`
    )

    // Update Credibility
    await updateCredibility(product.sellerId, "PRODUCT_SOLD")

    redirect(`/product-order/${orderId}`)
}
