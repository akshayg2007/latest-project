"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"

export async function topUpBalance(amount: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: amount } }
    })

    return { success: true }
}
