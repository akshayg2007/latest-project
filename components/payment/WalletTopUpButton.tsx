"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PaymentModal } from "./payment-modal"
import { topUpBalance } from "@/app/actions/wallet"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface WalletTopUpButtonProps {
    variant?: "primary" | "sidebar"
}

export function WalletTopUpButton({ variant = "sidebar" }: WalletTopUpButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [amount, setAmount] = useState<string>("1000") // Default to 1k
    const { data: session } = useSession()

    const handleTopUpClick = () => {
        if (!session?.user) {
            toast.error("Please sign in to top up your wallet")
            return
        }

        const numAmount = parseInt(amount)
        if (isNaN(numAmount) || numAmount < 10) {
            toast.error("Please enter a valid amount (min ₹10)")
            return
        }

        setIsModalOpen(true)
    }

    const handleSuccess = async () => {
        setIsModalOpen(false)
        try {
            const numAmount = parseInt(amount)
            await topUpBalance(numAmount)
            toast.success(`Wallet topped up successfully! ₹${numAmount.toLocaleString()} added.`)
        } catch (error) {
            console.error("Top up failed:", error)
            toast.error("Failed to update balance. Please try again.")
        }
    }

    if (variant === "sidebar") {
        return (
            <div className="space-y-3">
                <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-[10px] font-black">₹</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border-none text-white text-xs h-9 pl-6 pr-3 rounded-lg outline-none transition-all placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
                <Button
                    onClick={handleTopUpClick}
                    className="w-full bg-white text-indigo-600 hover:bg-white/90 font-black text-[10px] uppercase tracking-widest h-9 rounded-lg shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                >
                    Add Funds
                </Button>

                {session?.user && (
                    <PaymentModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                        amount={parseInt(amount) || 0}
                        merchantName="Truework Wallet"
                        itemName={`Wallet Top Up (₹${(parseInt(amount) || 0).toLocaleString()})`}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-12 pl-8 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                    placeholder="Enter amount to add"
                />
            </div>
            <Button
                onClick={handleTopUpClick}
                className="w-full font-bold h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
            >
                Top Up Wallet
            </Button>

            {session?.user && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                    amount={parseInt(amount) || 0}
                    merchantName="Truework Wallet"
                    itemName={`Wallet Top Up (₹${(parseInt(amount) || 0).toLocaleString()})`}
                />
            )}
        </div>
    )
}
