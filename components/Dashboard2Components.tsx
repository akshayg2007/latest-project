"use client"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { switchProfileMode } from "@/app/actions/user"
import {
    ChevronDown,
    ChevronRight,
    LogOut,
    Settings,
    User,
    Bookmark,
} from "lucide-react"

export function Dashboard2UserDropdown({ user: initialUser }: { user?: any }) {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)

    const sessionUser = session?.user
    const user = initialUser || sessionUser
    const initials = user?.name?.slice(0, 2).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "U"
    const image = user?.image || user?.avatarUrl

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center h-9 w-9 rounded-full overflow-hidden border-2 border-transparent hover:border-border transition-all"
            >
                {image ? (
                    <img src={image} alt={user.name || user.username || ""} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {initials}
                    </div>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 w-64 bg-card rounded-lg shadow-lg border border-border py-1">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-border">
                            <div className="flex items-center gap-3">
                                {image ? (
                                    <img src={image} alt="" className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                        {initials}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-foreground">{user?.name || user?.username || "User"}</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                            <Link
                                href={`/dashboard/user/${user?.username}`}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <User className="h-4 w-4 text-muted-foreground" />
                                View Profile
                            </Link>



                            <Link
                                href="/settings"
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                Settings
                            </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-border pt-1">
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export function Dashboard2WorkspaceSelector({ user: initialUser }: { user?: any }) {
    const { data: session } = useSession()
    const [isPending, startTransition] = useTransition()

    const sessionUser = session?.user
    const user = initialUser || sessionUser
    const initials = user?.name?.slice(0, 2).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || "TW"
    const image = user?.image || user?.avatarUrl

    // Determine Workspace Text based on activeProfile
    // BUYER = Client = Hiring Workspace
    // SELLER = Freelancer = Delivery Workspace
    const isClient = user?.activeProfile === "BUYER"
    const workspaceText = isClient ? "Hiring space" : "Work space"

    const handleToggle = () => {
        startTransition(async () => {
            await switchProfileMode()
        })
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-left group disabled:opacity-50"
        >
            <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 border border-border group-hover:border-blue-200 transition-colors relative">
                {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {initials}
                    </div>
                )}
            </div>
            <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{workspaceText}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap truncate">{user?.name || user?.username || user?.email}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
    )
}
