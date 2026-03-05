"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function deleteService(serviceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service || service.sellerId !== session.user.id) {
      return { error: "Unauthorized" }
    }

    await db.service.delete({
      where: { id: serviceId },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Delete Service Error:", error)
    return { error: "Failed to delete" }
  }
}