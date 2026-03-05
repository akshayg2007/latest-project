"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { approveMilestone } from "@/app/actions/manageService"
import { topUpBalance } from "@/app/actions/wallet"
import { PaymentModal } from "@/components/payment/payment-modal"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"

interface ApproveAndPayButtonProps {
    orderId: string
    milestoneId: string
    amount: number
    escrowAmount: number
    currentBalance: number
    milestoneName?: string
    label?: string
    paymentType?: string
    isLast?: boolean
    milestoneIndex?: number
}

export function ApproveAndPayButton({
    orderId,
    milestoneId,
    amount,
    escrowAmount,
    currentBalance,
    milestoneName = "Phase Completion",
    label,
    paymentType,
    isLast,
    milestoneIndex
}: ApproveAndPayButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    // Determine if this milestone requires a payment
    // Advance Payment milestone has amount but is pre-funded separately via MilestoneFundButton
    const isAdvancePayment = milestoneName === "Advance Payment"
    const requiresPayment = amount > 0 && !isAdvancePayment

    const handleApproveClick = () => {
        if (requiresPayment) {
            // Always show payment modal for any milestone with an amount
            setIsPaymentModalOpen(true)
        } else {
            // Zero-amount milestone (e.g. intermediate deliverable without payment) or Advance (handled by escrow)
            handleApproveDirectly()
        }
    }

    const handleApproveDirectly = async () => {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("milestoneId", milestoneId)
            formData.append("orderId", orderId)
            await approveMilestone(formData)
            toast.success("Work approved!")
        } catch (error: any) {
            console.error("Approval failed:", error)
            toast.error(error.message || "An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePaymentSuccess = async () => {
        setIsPaymentModalOpen(false)
        setIsLoading(true)
        try {
            // Top up wallet with the milestone amount so approveMilestone can deduct it
            await topUpBalance(amount)

            // Now approve and release payment to freelancer
            const formData = new FormData()
            formData.append("milestoneId", milestoneId)
            formData.append("orderId", orderId)
            await approveMilestone(formData)
            toast.success("Payment successful! Work approved and payment released.")
        } catch (error: any) {
            console.error("Post-payment approval failed:", error)
            toast.error("Payment was successful but an error occurred during approval.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button
                onClick={handleApproveClick}
                disabled={isLoading}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.98]"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                {label || "Approve & Release Payment"}
            </Button>

            {requiresPayment && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={amount}
                    merchantName="Truework Marketplace"
                    itemName={`Payment for: ${milestoneName}`}
                />
            )}
        </>
    )
}
