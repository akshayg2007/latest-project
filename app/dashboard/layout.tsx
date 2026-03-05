import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import DashboardClientLayout from "@/components/DashboardClientLayout"
import { SuspensionBanner } from "@/components/SuspensionBanner"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) redirect("/api/auth/signin")

    if (user.onboardingComplete !== true && user.role !== "ADMIN") redirect("/onboarding")

    const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil) > new Date()

    const notifications = await db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10
    })

    return (
        <>
            {isSuspended && (
                <SuspensionBanner
                    suspendedUntil={user.suspendedUntil!}
                    suspensionReason={user.suspensionReason}
                />
            )}
            <DashboardClientLayout notifications={notifications} user={user}>
                {children}
            </DashboardClientLayout>
        </>
    )
}
