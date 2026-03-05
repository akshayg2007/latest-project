"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function updateProduct(productId: string, data: {
    category?: string
    name?: string
    description?: string
    images?: string[]
    tags?: string[]
    price?: number
    license?: "PERSONAL" | "COMMERCIAL"
    fileUrls?: string[]
}) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "You must be logged in to update a product" }
    }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    try {
        const product = await db.product.findUnique({
            where: { id: productId }
        })

        if (!product || product.sellerId !== session.user.id) {
            return { error: "Product not found or unauthorized" }
        }

        await db.product.update({
            where: { id: productId },
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                price: data.price,
                images: data.images,
                tags: data.tags,
                license: data.license,
                fileUrls: data.fileUrls,
            },
        })

        const user = await db.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
        revalidatePath(`/users/${user?.username}`)
        revalidatePath(`/users/${user?.username}/store`)

        return { success: true }
    } catch (err: any) {
        console.error("Update Product Error:", err)
        return { error: `Failed to update product: ${err.message}` }
    }
}

export async function getProductForEdit(productId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const product = await db.product.findUnique({
        where: { id: productId }
    })

    if (!product || product.sellerId !== session.user.id) return null

    return product
}
