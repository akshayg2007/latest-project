import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { markOrderComplete, cancelOrder } from "@/app/actions/manageOrder"
import { startConversation } from "@/app/actions/chat" // <--- Chat Action
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    CheckCircle2,
    Clock,
    User,
    Package,
    Download,
    ExternalLink,
    Star,
    MessageCircle, // <--- Chat Icon
    ArrowLeft,
    XCircle
} from "lucide-react"
import Link from "next/link"
import ReviewForm from "@/components/ReviewForm"
import { ServicePriceDisplay } from "@/components/ServicePriceDisplay"

interface PageProps {
    params: Promise<{ orderId: string }>
}

export default async function OrderPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) return redirect("/signin")

    const { orderId } = await params

    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            service: true,
            buyer: true,
            seller: true,
            review: true
        }
    })

    if (!order) return notFound()

    // Redirect to modern order details page
    if (order.productId) {
        redirect(`/product-order/${orderId}`)
    } else {
        redirect(`/service-order/${orderId}`)
    }

    return null
}