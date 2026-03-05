"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"

interface SignOutPopupProps {
    isOpen: boolean
    onClose: () => void
    onConfirm?: () => Promise<void>
    title?: string
    description?: string
    confirmText?: string
}

export function SignOutPopup({
    isOpen,
    onClose,
    onConfirm,
    title = "Sign out?",
    description = "Are you sure you want to sign out? You will need to log in again to access your account.",
    confirmText = "Sign Out"
}: SignOutPopupProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const cancelButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                cancelButtonRef.current?.focus()
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            if (onConfirm) {
                await onConfirm()
            } else {
                await signOut({ callbackUrl: "/" })
            }
        } catch (error) {
            console.error("Action failed:", error)
        } finally {
            setIsLoading(false)
            onClose()
        }
    }

    if (!mounted || !isOpen) return null

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-100 scale-100 animate-in zoom-in-95 duration-200 mx-4">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        ref={cancelButtonRef}
                        variant="outline"
                        className="flex-1 rounded-full border-slate-200 h-11 hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs uppercase tracking-widest"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="flex-1 rounded-full bg-slate-900 text-white hover:bg-slate-800 h-11 shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    )
}
