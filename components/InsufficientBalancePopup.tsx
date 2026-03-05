"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle, X, ChevronRight, Loader2 } from "lucide-react"
import { WalletTopUpButton } from "./payment/WalletTopUpButton"

interface InsufficientBalancePopupProps {
    isOpen: boolean
    onClose: () => void
    requiredAmount: number
    currentBalance: number
}

export function InsufficientBalancePopup({
    isOpen,
    onClose,
    requiredAmount,
    currentBalance
}: InsufficientBalancePopupProps) {
    const [mounted, setMounted] = useState(false)
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                closeButtonRef.current?.focus()
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    const deficit = requiredAmount - currentBalance

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 px-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden scale-100 animate-in zoom-in-95 duration-300">
                {/* Header Decoration */}
                <div className="h-2 bg-amber-500 w-full" />

                <div className="p-8">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-inner">
                            <Wallet className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Insufficient Balance</h3>
                        <p className="text-slate-500 text-sm mt-3 leading-relaxed px-4">
                            You need <span className="font-bold text-slate-900">₹{requiredAmount.toLocaleString()}</span> to fund this milestone, but you only have <span className="font-bold text-slate-900">₹{currentBalance.toLocaleString()}</span>.
                        </p>
                    </div>

                    {/* Deficit Card */}
                    <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Deficit</p>
                                <p className="text-lg font-black text-slate-900">₹{deficit.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200" />
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Top Up Needed</p>
                            <p className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md mt-0.5 inline-block">Min. ₹10,000</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Wrap the TopUp button logic */}
                        <div className="w-full">
                            <WalletTopUpButton variant="primary" />
                        </div>

                        <Button
                            ref={closeButtonRef}
                            variant="ghost"
                            className="w-full h-12 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                            onClick={onClose}
                        >
                            I'll do it later
                        </Button>
                    </div>
                </div>

                {/* Footer Trust */}
                <div className="bg-slate-50 px-8 py-4 flex items-center justify-center gap-2 border-t border-slate-100">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Payments Powered by TruePay</span>
                </div>
            </div>
        </div>,
        document.body
    )
}
