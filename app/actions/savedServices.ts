"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function toggleSaveService(serviceId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const restriction = await checkUserRestriction(session.user.id)
    if (restriction) throw new Error(restriction)

    // Check if already saved
    const existingSave = await db.savedService.findUnique({
        where: {
            userId_serviceId: {
                userId: session.user.id,
                serviceId: serviceId
            }
        }
    })

    if (existingSave) {
        // Unsave the service
        await db.savedService.delete({
            where: { id: existingSave.id }
        })
    } else {
        // Save the service
        await db.savedService.create({
            data: {
                userId: session.user.id,
                serviceId: serviceId
            }
        })
    }

    // Revalidate relevant paths
    revalidatePath(`/dashboard/explore/services/${serviceId}`)
    revalidatePath("/dashboard")

    return { saved: !existingSave }
}

export async function isServiceSaved(serviceId: string): Promise<boolean> {
    const session = await auth()

    if (!session?.user?.id) {
        return false
    }

    const existingSave = await db.savedService.findUnique({
        where: {
            userId_serviceId: {
                userId: session.user.id,
                serviceId: serviceId
            }
        }
    })

    return !!existingSave
}
