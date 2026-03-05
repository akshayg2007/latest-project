"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Clock,
    Ban,
    ShieldCheck,
    Loader2,
    EyeOff,
    Eye,
} from "lucide-react"
import { banUser, suspendUser, unbanUser, unsuspendUser, toggleShadowBan } from "@/app/actions/adminActions"

interface UserActionsProps {
    userId: string
    username: string
    isBanned: boolean
    suspendedUntil: Date | null
    suspensionReason: string | null
    banReason: string | null
    isShadowBanned: boolean
    isAdmin: boolean
}

/* ── Reusable portal modal (matches SignOutPopup style) ── */
function ActionModal({
    isOpen,
    onClose,
    children,
}: {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
}) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-100 scale-100 animate-in zoom-in-95 duration-200 mx-4 max-h-[90vh] overflow-y-auto">
                {children}
            </div>
        </div>,
        document.body
    )
}

export function UserActions({
    userId,
    username,
    isBanned,
    suspendedUntil,
    isShadowBanned,
    isAdmin,
}: UserActionsProps) {
    const [showBanModal, setShowBanModal] = useState(false)
    const [showSuspendModal, setShowSuspendModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [banReasonInput, setBanReasonInput] = useState("")
    const [suspendReasonInput, setSuspendReasonInput] = useState("")
    const [suspendDays, setSuspendDays] = useState("7")

    const isSuspended = suspendedUntil && new Date(suspendedUntil) > new Date()

    if (isAdmin) return null

    const handleBan = async () => {
        if (!banReasonInput.trim()) return
        setIsLoading(true)
        try {
            await banUser(userId, banReasonInput.trim())
            setShowBanModal(false)
            setBanReasonInput("")
        } catch (error: any) {
            alert(error.message || "Failed to ban user")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuspend = async () => {
        if (!suspendReasonInput.trim()) return
        const days = parseInt(suspendDays)
        if (isNaN(days) || days < 1) return
        setIsLoading(true)
        try {
            await suspendUser(userId, suspendReasonInput.trim(), days)
            setShowSuspendModal(false)
            setSuspendReasonInput("")
            setSuspendDays("7")
        } catch (error: any) {
            alert(error.message || "Failed to suspend user")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnban = async () => {
        setIsLoading(true)
        try {
            await unbanUser(userId)
        } catch (error: any) {
            alert(error.message || "Failed to unban user")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnsuspend = async () => {
        setIsLoading(true)
        try {
            await unsuspendUser(userId)
        } catch (error: any) {
            alert(error.message || "Failed to unsuspend user")
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleShadowBan = async () => {
        setIsLoading(true)
        try {
            await toggleShadowBan(userId)
        } catch (error: any) {
            alert(error.message || "Failed to shadow ban user")
        } finally {
            setIsLoading(false)
        }
    }

    const suspendPresets = [
        { label: "1d", value: "1" },
        { label: "3d", value: "3" },
        { label: "7d", value: "7" },
        { label: "14d", value: "14" },
        { label: "30d", value: "30" },
        { label: "90d", value: "90" },
    ]

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-slate-200 hover:border-slate-300"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {isBanned ? (
                        <DropdownMenuItem
                            onClick={handleUnban}
                            disabled={isLoading}
                            className="text-emerald-600 focus:text-emerald-600 font-medium"
                        >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Unban User
                        </DropdownMenuItem>
                    ) : (
                        <>
                            {isSuspended ? (
                                <DropdownMenuItem
                                    onClick={handleUnsuspend}
                                    disabled={isLoading}
                                    className="text-emerald-600 focus:text-emerald-600 font-medium"
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Lift Suspension
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => setShowSuspendModal(true)}
                                    className="text-amber-600 focus:text-amber-600 font-medium"
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    Suspend User
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowBanModal(true)}
                                className="text-red-600 focus:text-red-600 font-medium"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban Permanently
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleToggleShadowBan}
                                disabled={isLoading}
                                className={isShadowBanned ? "text-emerald-600 focus:text-emerald-600 font-medium" : "text-slate-600 focus:text-slate-600 font-medium"}
                            >
                                {isShadowBanned ? (
                                    <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Lift Shadow Ban
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Shadow Ban
                                    </>
                                )}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* ── Ban Modal ── */}
            <ActionModal isOpen={showBanModal} onClose={() => { setShowBanModal(false); setBanReasonInput("") }}>
                <div className="text-center mb-5">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ban className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Ban @{username}?</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        This will <strong className="text-slate-700">permanently prevent</strong> this user from
                        logging in. They'll see a ban notice when attempting to sign in.
                    </p>
                </div>

                <div className="space-y-2 mb-5">
                    <label htmlFor="ban-reason" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Reason
                    </label>
                    <textarea
                        id="ban-reason"
                        placeholder="e.g. Repeated violation of terms of service..."
                        className="w-full h-20 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 resize-none bg-slate-50 transition-all"
                        value={banReasonInput}
                        onChange={(e) => setBanReasonInput(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-full border-slate-200 h-11 hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs uppercase tracking-widest"
                        onClick={() => { setShowBanModal(false); setBanReasonInput("") }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 rounded-full bg-red-600 text-white hover:bg-red-700 h-11 shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                        onClick={handleBan}
                        disabled={isLoading || !banReasonInput.trim()}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ban User"}
                    </Button>
                </div>
            </ActionModal>

            {/* ── Suspend Modal ── */}
            <ActionModal isOpen={showSuspendModal} onClose={() => { setShowSuspendModal(false); setSuspendReasonInput(""); setSuspendDays("7") }}>
                <div className="text-center mb-5">
                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Suspend @{username}?</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        User can still <strong className="text-slate-700">browse</strong> the site but
                        cannot post, order, or interact until the suspension ends.
                    </p>
                </div>

                {/* Duration picker */}
                <div className="space-y-2.5 mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Duration
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {suspendPresets.map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => setSuspendDays(preset.value)}
                                className={`px-3 py-1.5 text-xs rounded-full border transition-all font-bold tracking-wide ${suspendDays === preset.value
                                    ? "bg-slate-900 border-slate-900 text-white"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Custom:</span>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={suspendDays}
                            onChange={(e) => setSuspendDays(e.target.value)}
                            className="w-16 h-8 px-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 bg-slate-50 transition-all"
                        />
                        <span className="text-xs text-slate-400">days</span>
                    </div>
                </div>

                {/* Reason */}
                <div className="space-y-2 mb-5">
                    <label htmlFor="suspend-reason" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Reason
                    </label>
                    <textarea
                        id="suspend-reason"
                        placeholder="e.g. Spamming community forum..."
                        className="w-full h-20 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 resize-none bg-slate-50 transition-all"
                        value={suspendReasonInput}
                        onChange={(e) => setSuspendReasonInput(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-full border-slate-200 h-11 hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs uppercase tracking-widest"
                        onClick={() => { setShowSuspendModal(false); setSuspendReasonInput(""); setSuspendDays("7") }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 rounded-full bg-slate-900 text-white hover:bg-slate-800 h-11 shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                        onClick={handleSuspend}
                        disabled={isLoading || !suspendReasonInput.trim() || !suspendDays}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suspend"}
                    </Button>
                </div>
            </ActionModal>
        </>
    )
}
