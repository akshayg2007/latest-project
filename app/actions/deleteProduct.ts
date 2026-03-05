"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function deleteProduct(productId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const product = await db.product.findUnique({
            where: { id: productId },
        })

        if (!product || product.sellerId !== session.user.id) {
            return { error: "Unauthorized" }
        }

        await db.product.delete({
            where: { id: productId },
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Delete Product Error:", error)
        return { error: "Failed to delete" }
    }
}
