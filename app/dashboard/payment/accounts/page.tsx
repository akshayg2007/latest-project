import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import AccountsClient from "@/components/AccountsClient"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/api/auth/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            paymentMethods: {
                orderBy: { createdAt: 'desc' }
            },
            payoutAccounts: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!user) redirect("/api/auth/signin")

    // Serialize dates to pass to client component
    const paymentMethods = user.paymentMethods.map(pm => ({
        ...pm,
        createdAt: pm.createdAt.toISOString(),
        updatedAt: pm.updatedAt.toISOString()
    }))

    const payoutAccounts = user.payoutAccounts.map(pa => ({
        ...pa,
        createdAt: pa.createdAt.toISOString(),
        updatedAt: pa.updatedAt.toISOString()
    }))

    return (
        <AccountsClient
            initialPaymentMethods={paymentMethods}
            initialPayoutAccounts={payoutAccounts}
            userName={user.username || session.user.name || "User"}
        />
    )
}
