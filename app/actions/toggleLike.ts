"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function toggleLike({
    itemId,
    itemType,
    path
}: {
    itemId: string
    itemType: 'SERVICE' | 'PRODUCT' | 'JOB'
    path?: string
}) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) return { error: restriction }

    const userId = session.user.id

    try {
        let isLiked = false

        if (itemType === 'PRODUCT') {
            const existingLike = await db.productLike.findUnique({
                where: {
                    userId_productId: {
                        userId,
                        productId: itemId
                    }
                }
            })

            if (existingLike) {
                await db.productLike.delete({
                    where: { id: existingLike.id }
                })
            } else {
                await db.productLike.create({
                    data: {
                        userId,
                        productId: itemId
                    }
                })
                isLiked = true
            }
        }
        else if (itemType === 'SERVICE') {
            const existingLike = await db.serviceLike.findUnique({
                where: {
                    userId_serviceId: {
                        userId,
                        serviceId: itemId
                    }
                }
            })

            if (existingLike) {
                await db.serviceLike.delete({
                    where: { id: existingLike.id }
                })
            } else {
                await db.serviceLike.create({
                    data: {
                        userId,
                        serviceId: itemId
                    }
                })
                isLiked = true
            }
        }
        else if (itemType === 'JOB') {
            const existingLike = await db.jobLike.findUnique({
                where: {
                    userId_jobId: {
                        userId,
                        jobId: itemId
                    }
                }
            })

            if (existingLike) {
                await db.jobLike.delete({
                    where: { id: existingLike.id }
                })
            } else {
                await db.jobLike.create({
                    data: {
                        userId,
                        jobId: itemId
                    }
                })
                isLiked = true
            }
        }

        if (path) {
            revalidatePath(path)
        }

        return { success: true, isLiked }

    } catch (error) {
        console.error("Toggle Like Error:", error)
        return { error: "Failed to toggle like" }
    }
}
