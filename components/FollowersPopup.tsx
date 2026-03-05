"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, X } from "lucide-react"

interface FollowerInfo {
    username: string
    avatarUrl: string | null
}

interface FollowersPopupProps {
    isOpen: boolean
    onClose: () => void
    followers: FollowerInfo[]
    totalCount: number
}

export function FollowersPopup({
    isOpen,
    onClose,
    followers,
    totalCount,
}: FollowersPopupProps) {
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 scale-100 animate-in zoom-in-95 duration-200 mx-4 flex flex-col max-h-[70vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Followers</h3>
                            <p className="text-xs text-slate-400 font-medium">{totalCount} {totalCount === 1 ? "follower" : "followers"}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
                    {followers.length > 0 ? (
                        <div className="space-y-1">
                            {followers.map((follower, i) => (
                                <Link
                                    key={i}
                                    href={`/users/${follower.username}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                                >
                                    <Avatar className="h-10 w-10 border border-slate-100">
                                        <AvatarImage src={follower.avatarUrl || ""} alt={follower.username} />
                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-bold">
                                            {follower.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">
                                            {follower.username}
                                        </p>
                                    </div>
                                    <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">No followers yet</p>
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                {followers.length > 0 && totalCount > followers.length && (
                    <div className="px-6 py-3 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            Showing {followers.length} of {totalCount} followers
                        </p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}
