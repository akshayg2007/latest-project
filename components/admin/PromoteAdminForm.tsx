"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldPlus, ShieldOff, Loader2, ShieldAlert, X } from "lucide-react"
import { promoteToAdmin, demoteAdmin } from "@/app/actions/adminActions"
import { toast } from "sonner"

interface AdminUser {
    id: string
    username: string
    email: string
    avatarUrl: string | null
    createdAt: Date
}

interface ConfirmPopupProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    title: string
    description: string
    confirmText: string
    variant?: "promote" | "demote"
}

function ConfirmPopup({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    variant = "promote"
}: ConfirmPopupProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const cancelRef = useRef<HTMLButtonElement>(null)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => cancelRef.current?.focus(), 50)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            await onConfirm()
        } finally {
            setIsLoading(false)
            onClose()
        }
    }

    if (!mounted || !isOpen) return null

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-100 scale-100 animate-in zoom-in-95 duration-200 mx-4">
                <div className="text-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === "demote" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                        {variant === "demote" ? <ShieldOff className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        ref={cancelRef}
                        variant="outline"
                        className="flex-1 rounded-full border-slate-200 h-11 hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs uppercase tracking-widest"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        className={`flex-1 rounded-full h-11 shadow-md transition-all font-bold text-xs uppercase tracking-widest ${variant === "demote"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-slate-900 text-white hover:bg-blue-600"
                            }`}
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

export function PromoteAdminForm({ admins, currentUserId }: { admins: AdminUser[]; currentUserId: string }) {
    const [username, setUsername] = useState("")
    const [promotePopupOpen, setPromotePopupOpen] = useState(false)
    const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null)

    const handlePromote = async () => {
        try {
            const result = await promoteToAdmin(username)
            toast.success(`@${result.username} has been promoted to Admin!`)
            setUsername("")
        } catch (error: any) {
            toast.error(error.message || "Failed to promote user")
        }
    }

    const handleDemote = async () => {
        if (!demoteTarget) return
        try {
            const result = await demoteAdmin(demoteTarget.id)
            toast.success(`@${result.username} has been removed as admin`)
        } catch (error: any) {
            toast.error(error.message || "Failed to remove admin")
        }
    }

    return (
        <div className="space-y-5">
            {/* Promote form */}
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promote User to Admin</p>
                <p className="text-xs text-slate-500 mb-3">Enter a username to grant them admin access to the platform.</p>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full h-10 pl-8 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <Button
                        onClick={() => {
                            if (!username.trim()) return
                            setPromotePopupOpen(true)
                        }}
                        disabled={!username.trim()}
                        className="h-10 px-5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-blue-600 text-white transition-colors gap-2 shrink-0"
                    >
                        <ShieldPlus className="w-4 h-4" />
                        Grant Admin
                    </Button>
                </div>
            </div>

            {/* Admin list */}
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Admins ({admins.length})</p>
                <p className="text-xs text-slate-500 mb-3">All users with administrative access to the platform.</p>
                <div className="space-y-2">
                    {admins.map((admin) => {
                        const isSelf = admin.id === currentUserId
                        return (
                            <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                                        {admin.avatarUrl ? (
                                            <img src={admin.avatarUrl} alt={admin.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-white">{admin.username.slice(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-900">@{admin.username}</span>
                                            {isSelf && (
                                                <Badge className="bg-blue-100 text-blue-700 border-none text-[8px] font-black h-4">YOU</Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400">{admin.email}</span>
                                    </div>
                                </div>
                                {!isSelf && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDemoteTarget(admin)}
                                        className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-3.5 h-3.5 mr-1" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Promote confirmation popup */}
            <ConfirmPopup
                isOpen={promotePopupOpen}
                onClose={() => setPromotePopupOpen(false)}
                onConfirm={handlePromote}
                title={`Grant admin to @${username.trim().replace(/^@/, "")}?`}
                description={`This will give @${username.trim().replace(/^@/, "")} full access to the admin console, including user management, moderation, disputes, and all platform settings. This action can be reversed.`}
                confirmText="Confirm Promote"
                variant="promote"
            />

            {/* Demote confirmation popup */}
            <ConfirmPopup
                isOpen={!!demoteTarget}
                onClose={() => setDemoteTarget(null)}
                onConfirm={handleDemote}
                title={`Remove @${demoteTarget?.username} as admin?`}
                description={`This will revoke all admin privileges from @${demoteTarget?.username}. They will be downgraded to a regular user and lose access to the admin console immediately.`}
                confirmText="Remove Admin"
                variant="demote"
            />
        </div>
    )
}
