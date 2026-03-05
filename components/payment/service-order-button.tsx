"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PaymentModal } from "./payment-modal"
import { createServiceOrder } from "@/app/actions/createServiceOrder"
import { ServiceButtonPrice } from "@/components/ServicePriceDisplay"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ServiceOrderButtonProps {
    serviceId: string
    price: number
    sellerName: string
    title: string
    hasMilestones?: boolean
}

export function ServiceOrderButton({ serviceId, price, sellerName, title, hasMilestones }: ServiceOrderButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { data: session } = useSession()
    const router = useRouter()

    const handleBuyClick = () => {
        if (!session?.user) {
            router.push("/api/auth/signin")
            return
        }

        if (price === 0 || hasMilestones) {
            handleSuccess()
        } else {
            setIsModalOpen(true)
        }
    }

    const handleSuccess = async () => {
        setIsModalOpen(false)

        // Save to purchased items in localStorage
        const stored = localStorage.getItem('purchasedItems')
        let purchasedItems = []
        if (stored) {
            try {
                purchasedItems = JSON.parse(stored)
            } catch (e) {
                console.error("Failed to parse purchased items", e)
            }
        }
        if (!purchasedItems.includes(serviceId)) {
            purchasedItems.push(serviceId)
            localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems))
        }

        // Trigger the actual order creation action
        const formData = new FormData()
        formData.append("serviceId", serviceId)

        try {
            await createServiceOrder(formData)
            // If we reach here, something went wrong with redirect
            toast.error("Order created but redirect failed. Please check your orders page.")
        } catch (error: any) {
            // Next.js redirect throws an error, which is expected behavior
            // The error message typically contains "NEXT_REDIRECT" 
            if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message?.includes('redirect')) {
                // This is the expected redirect behavior, don't show error
                return
            }
            // For any other actual errors, show the message
            console.error("Order creation failed:", error)
            toast.error("Something went wrong while creating your order.")
        }
    }

    return (
        <>
            <Button
                onClick={handleBuyClick}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20"
            >
                <ServiceButtonPrice price={price} />
            </Button>

            {session?.user && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                    amount={price}
                    merchantName={sellerName}
                    itemName={title}
                />
            )}
        </>
    )
}
