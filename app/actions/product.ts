"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"

interface ProductData {
    category: string
    name: string
    description: string
    images: string[]
    tags: string[]
    price: string
    license: "personal" | "commercial"
    fileUrls: string[]
}

export async function createProduct(data: ProductData) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "You must be logged in to create a product" }
    }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    try {
        const product = await db.product.create({
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                price: parseInt(data.price.replace(/[^0-9]/g, "")) || 0,
                images: data.images,
                tags: data.tags,
                license: data.license === "commercial" ? "COMMERCIAL" : "PERSONAL",
                fileUrls: data.fileUrls,
                sellerId: session.user.id,
            },
        })

        revalidatePath(`/users/${(session.user as any).username}`)
        revalidatePath(`/users/${(session.user as any).username}/store`)

        return { success: true, productId: product.id }
    } catch (err: any) {
        console.error("Create Product Error:", err)
        return { error: `Failed to create product: ${err.message}` }
    }
}
