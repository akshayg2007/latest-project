"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { fundMilestone } from "@/app/actions/fundMilestone"
import { topUpBalance } from "@/app/actions/wallet"
import { PaymentModal } from "@/components/payment/payment-modal"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface MilestoneFundButtonProps {
    projectId: string
    milestoneId: string
    amount: number
    currentBalance: number
    milestoneName?: string
}

export function MilestoneFundButton({
    projectId,
    milestoneId,
    amount,
    currentBalance,
    milestoneName = "Milestone Funding"
}: MilestoneFundButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    const handleFund = async () => {
        // If balance is enough, fund directly
        if (currentBalance >= amount) {
            setIsLoading(true)
            try {
                const result = await fundMilestone(projectId, milestoneId)

                if (result.error) {
                    toast.error(result.error)
                    return
                }

                if (result.success) {
                    toast.success("Milestone funded successfully!")
                }
            } catch (error: any) {
                console.error("Funding failed:", error)
                toast.error("An unexpected error occurred.")
            } finally {
                setIsLoading(false)
            }
        } else {
            // Otherwise, open the payment module (PaymentModal)
            setIsPaymentModalOpen(true)
        }
    }

    const handlePaymentSuccess = async () => {
        setIsPaymentModalOpen(false)
        setIsLoading(true)
        try {
            // 1. Top up the wallet with the milestone amount
            // Since the user is paying specifically for this milestone via the gateway
            await topUpBalance(amount)

            // 2. Now fund the milestone
            const result = await fundMilestone(projectId, milestoneId)

            if (result.success) {
                toast.success("Payment successful! Milestone has been funded.")
            } else {
                toast.error(result.error || "Payment received but failed to fund milestone. Check your wallet.")
            }
        } catch (error) {
            console.error("Post-payment funding failed:", error)
            toast.error("Payment was successful but an error occurred during funding.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button
                onClick={handleFund}
                disabled={isLoading}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold px-4 h-9 rounded-lg shadow-sm shadow-indigo-200 w-full md:w-auto"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Fund Milestone
            </Button>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentSuccess}
                amount={amount}
                merchantName="Truework Marketplace"
                itemName={`Escrow Funding: ${milestoneName}`}
            />
        </>
    )
}
