"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { checkUserRestriction } from "@/lib/checkSuspension"

const PortfolioSchema = z.object({
    title: z.string().min(1, "Title is required"),
    mediaUrl: z.string().min(1, "Cover image is required"),
    skills: z.array(z.string()),
    tools: z.array(z.string()),
    link: z.string().optional(),
})

export async function createPortfolioItem(data: z.infer<typeof PortfolioSchema>) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { error: "Unauthorized" }
        }

        const restriction = await checkUserRestriction(session.user.id)
        if (restriction) return { error: restriction }

        const validData = PortfolioSchema.parse(data)

        const portfolioItem = await db.portfolioItem.create({
            data: {
                userId: session.user.id,
                title: validData.title,
                mediaUrl: validData.mediaUrl,
                skills: validData.skills,
                tools: validData.tools,
                link: validData.link || null,
                mediaType: "IMAGE", // Defaulting to IMAGE for now as per requirement
            },
        })

        revalidatePath(`/users/${session.user.name}`) // or username, need to be careful
        // We can fetch the username
        const user = await db.user.findUnique({ where: { id: session.user.id } })
        if (user) {
            revalidatePath(`/users/${user.username}`)
        }

        return { success: true, item: portfolioItem }
    } catch (error) {
        console.error("Failed to create portfolio item:", error)
        return { error: "Failed to create portfolio item" }
    }
}
