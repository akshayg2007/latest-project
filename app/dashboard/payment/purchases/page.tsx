import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import PurchasesClient from "./PurchasesClient"

export default async function MyPurchasesPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch all orders where the user is the BUYER
    const orders = await db.order.findMany({
        where: { buyerId: userId },
        include: {
            seller: {
                select: {
                    username: true
                }
            },
            service: {
                select: {
                    title: true,
                    deliveryTime: true
                }
            },
            product: {
                select: {
                    name: true,
                    images: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    // Transform orders for the client component
    const transformedOrders = orders.map((order: any) => {
        const isProduct = !!order.productId
        const title = isProduct ? order.product?.name : order.service?.title
        const type = isProduct ? 'product' : 'service'

        return {
            id: order.id,
            title: title || "Unknown Item",
            seller: order.seller.username,
            sellerName: order.seller.username,
            price: order.price,
            purchaseDate: order.createdAt,
            status: order.status.toLowerCase(), // 'PENDING', 'COMPLETED', etc.
            type: type,
            deliveryDate: order.deliveryDate || null, // Assuming deliveryDate exists on order or needs logic
            downloadUrls: isProduct && order.product?.images ? order.product.images : [], // Placeholder for actual digital assets
            billingName: session.user?.name || session.user?.email || "Buyer",
            deadline: !isProduct && order.service?.deliveryTime
                ? new Date(new Date(order.createdAt).getTime() + order.service.deliveryTime * 60 * 60 * 1000).toISOString()
                : null
        }
    })

    // Calculate Stats
    const totalSpent = orders.reduce((sum: number, order: any) => sum + order.price, 0)
    const deliveredCount = orders.filter((o: any) => o.status === 'COMPLETED').length
    const inProgressCount = orders.filter((o: any) => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length

    return (
        <PurchasesClient
            transformedOrders={transformedOrders}
            totalSpent={totalSpent}
            deliveredCount={deliveredCount}
            inProgressCount={inProgressCount}
        />
    )
}
