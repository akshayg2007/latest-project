"use client"

import { useState, useEffect } from "react"
import { RateClientDialog } from "./RateClientDialog"
import { RateFreelancerDialog } from "./RateFreelancerDialog"

interface JobOrderFeedbackProps {
    order: any
    isFreelancer: boolean
    hasReview: boolean
}

export function JobOrderFeedback({ order, isFreelancer, hasReview }: JobOrderFeedbackProps) {
    const [showRateModal, setShowRateModal] = useState(false)

    useEffect(() => {
        // Auto-show modal if project is COMPLETED and user hasn't reviewed yet
        const isCompleted = order.status === "COMPLETED" || order.status === "PAID"
        if (isCompleted && !hasReview) {
            // Check if we've already shown it in this session to avoid annoyance
            const storageKey = `feedback_shown_${order.id}`
            const alreadyShown = sessionStorage.getItem(storageKey)

            if (!alreadyShown) {
                // Delay showing feedback modal so any payment modal can appear first
                const timer = setTimeout(() => {
                    setShowRateModal(true)
                    sessionStorage.setItem(storageKey, "true")
                }, 3500)
                return () => clearTimeout(timer)
            }
        }
    }, [order.status, order.id, hasReview])

    if (isFreelancer) {
        return (
            <RateClientDialog
                orderId={order.id}
                clientName={order.buyer?.username || "the client"}
                open={showRateModal}
                onOpenChange={setShowRateModal}
            />
        )
    }

    return (
        <RateFreelancerDialog
            orderId={order.id}
            serviceId={order.serviceId}
            freelancerName={order.seller?.username || "the freelancer"}
            open={showRateModal}
            onOpenChange={setShowRateModal}
        />
    )
}
