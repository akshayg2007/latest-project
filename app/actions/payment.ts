"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// Payment Methods
export async function addPaymentMethod(data: {
    type: string
    identifier: string
    maskedIdentifier: string
    holderName?: string
    bankName?: string
    cardNetwork?: string
    walletProvider?: string
    isDefault?: boolean
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // If setting as default, unset others first
    if (data.isDefault) {
        await db.paymentMethod.updateMany({
            where: { userId: session.user.id },
            data: { isDefault: false }
        })
    }

    const pm = await db.paymentMethod.create({
        data: {
            ...data,
            userId: session.user.id
        }
    })

    revalidatePath("/dashboard/payment/accounts")
    return pm
}

export async function getPaymentMethods() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await db.paymentMethod.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    })
}

export async function deletePaymentMethod(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.paymentMethod.delete({
        where: { id, userId: session.user.id }
    })

    revalidatePath("/dashboard/payment/accounts")
}

export async function setDefaultPaymentMethod(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Unset all first
    await db.paymentMethod.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
    })

    // Set one
    await db.paymentMethod.update({
        where: { id, userId: session.user.id },
        data: { isDefault: true }
    })

    revalidatePath("/dashboard/payment/accounts")
}

// Payout Accounts
export async function addPayoutAccount(data: {
    type: string
    identifier: string
    holderName: string
    bankName?: string
    accountNumber?: string
    ifsc?: string
    isPrimary?: boolean
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // If setting as primary, unset others first
    if (data.isPrimary) {
        await db.payoutAccount.updateMany({
            where: { userId: session.user.id },
            data: { isPrimary: false }
        })
    }

    const pa = await db.payoutAccount.create({
        data: {
            ...data,
            userId: session.user.id
        }
    })

    revalidatePath("/dashboard/payment/accounts")
    return pa
}

export async function deletePayoutAccount(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.payoutAccount.delete({
        where: { id, userId: session.user.id }
    })

    revalidatePath("/dashboard/payment/accounts")
}

export async function setPrimaryPayoutAccount(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Unset all first
    await db.payoutAccount.updateMany({
        where: { userId: session.user.id },
        data: { isPrimary: false }
    })

    // Set one
    await db.payoutAccount.update({
        where: { id, userId: session.user.id },
        data: { isPrimary: true }
    })

    revalidatePath("/dashboard/payment/accounts")
}
