import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import AdminClientLayout from "@/components/AdminClientLayout"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            role: true,
            activeProfile: true
        }
    })

    if (!user || user.role !== "ADMIN") {
        redirect("/dashboard")
    }

    // Fetch all pending counts in parallel
    const [notifications, pendingDisputes, pendingSupportTickets, pendingReports, pendingOrders] = await Promise.all([
        db.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        }),
        db.dispute.count({
            where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }
        }),
        db.supportTicket.count({
            where: { status: { in: ["OPEN", "IN_PROGRESS"] } }
        }),
        db.report.count({
            where: { status: "PENDING" }
        }),
        db.order.count({
            where: { status: "PENDING" }
        }),
    ])

    const counts = {
        disputes: pendingDisputes,
        support: pendingSupportTickets,
        reports: pendingReports,
        orders: pendingOrders,
    }

    return (
        <AdminClientLayout notifications={notifications} user={user} counts={counts}>
            {children}
        </AdminClientLayout>
    )
}
