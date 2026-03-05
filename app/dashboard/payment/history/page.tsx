import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import HistoryClient from "./HistoryClient"

export default async function PaymentHistoryPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, activeProfile: true }
    })

    if (!user) redirect("/api/auth/signin")

    const isBuyer = user.activeProfile === 'BUYER'

    // Fetch Orders
    const orders = await db.order.findMany({
        where: isBuyer ? { buyerId: user.id } : { sellerId: user.id },
        include: {
            service: { select: { title: true } },
            product: { select: { name: true } },
            buyer: { select: { username: true } },
            seller: { select: { username: true } },
            project: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' }
    })

    // Fetch Milestones (Jobs)
    // For Buyers: Projects where they are clientId
    // For Sellers: Projects where they are freelancerId
    const milestones = await db.milestone.findMany({
        where: {
            project: isBuyer ? { clientId: user.id } : { freelancerId: user.id }
        },
        include: {
            project: { select: { title: true, clientId: true, freelancerId: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    // Transform to unified Transaction format
    const orderTransactions = orders
        .filter((order: any) => !order.project)
        .map((order: any) => ({
            id: order.id,
            type: isBuyer ? 'debit' : 'credit',
            amount: order.price,
            paymentFor: order.productId ? 'product' : 'service',
            referenceId: order.serviceId || order.productId || order.id,
            title: order.productId ? order.product?.name : order.service?.title || "Order",
            paymentMode: "Wallet", // Placeholder
            role: isBuyer ? 'client' : 'freelancer',
            status: mapStatus(order.status),
            date: order.createdAt,
        }))

    const milestoneTransactions = milestones.map((milestone: any) => ({
        id: milestone.id,
        type: isBuyer ? 'debit' : 'credit',
        amount: milestone.amount,
        paymentFor: 'job',
        referenceId: milestone.projectId,
        title: `${milestone.title} - ${milestone.project.title}`,
        paymentMode: "Wallet",
        role: isBuyer ? 'client' : 'freelancer',
        status: mapStatus(milestone.status),
        date: milestone.createdAt,
    }))

    const transactions = [...orderTransactions, ...milestoneTransactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return (
        <div className="h-full w-full p-4 sm:p-6 lg:p-8">
            <HistoryClient
                initialTransactions={transactions}
                userRole={isBuyer ? 'client' : 'freelancer'}
            />
        </div>
    )
}

function mapStatus(status: string) {
    const s = status.toUpperCase()
    if (['COMPLETED', 'APPROVED', 'PAID', 'SUCCESS'].includes(s)) return 'success'
    if (['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'OPEN'].includes(s)) return 'pending'
    if (['FAILED', 'CANCELLED', 'REJECTED'].includes(s)) return 'failed'
    return 'pending'
}
