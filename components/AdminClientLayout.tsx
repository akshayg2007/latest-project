"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Dashboard2UserDropdown } from "@/components/Dashboard2Components"
import NotificationsMenu from "@/components/NotificationsMenu"

// Icons
import {
    LayoutDashboard,
    Users,
    Shield,
    Activity,
    FileText,
    Settings,
    Headset,

    PanelLeft,
    Menu,
    X,
    Scale,
    Megaphone,
    Star,
    ScrollText,
} from "lucide-react"

// Types
interface AdminCounts {
    disputes: number
    support: number
    reports: number
    orders: number
}

interface NavItem {
    label: string
    icon: React.ReactNode
    href?: string
    badge?: number
    children?: { label: string; href: string }[]
}

function getAdminNavItems(counts?: AdminCounts): NavItem[] {
    return [
        {
            label: "Dashboard",
            icon: <LayoutDashboard className="h-4 w-4" />,
            href: "/admin/dashboard",
        },
        {
            label: "User Management",
            icon: <Users className="h-4 w-4" />,
            href: "/admin/users",
        },
        {
            label: "Orders",
            icon: <FileText className="h-4 w-4" />,
            href: "/admin/orders",
            badge: counts?.orders || undefined,
        },
        {
            label: "Moderation",
            icon: <Shield className="h-4 w-4" />,
            href: "/admin/moderation",
        },
        {
            label: "User Reports",
            icon: <Shield className="h-4 w-4" />,
            href: "/admin/moderation/reports",
            badge: counts?.reports || undefined,
        },
        {
            label: "Analytics",
            icon: <Activity className="h-4 w-4" />,
            href: "/admin/reports",
        },
        {
            label: "Disputes",
            icon: <Scale className="h-4 w-4" />,
            href: "/admin/disputes",
            badge: counts?.disputes || undefined,
        },
        {
            label: "Support Tickets",
            icon: <Headset className="h-4 w-4" />,
            href: "/admin/support",
            badge: counts?.support || undefined,
        },
        {
            label: "Announcements",
            icon: <Megaphone className="h-4 w-4" />,
            href: "/admin/announcements",
        },
        {
            label: "Audit Logs",
            icon: <ScrollText className="h-4 w-4" />,
            href: "/admin/audit-logs",
        },
        {
            label: "Settings",
            icon: <Settings className="h-4 w-4" />,
            href: "/admin/settings",
        },
    ]
}

function NavItemComponent({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const isActive = item.href === pathname || item.children?.some((c) => c.href === pathname)

    return (
        <Link
            href={item.href || "#"}
            onClick={onNavigate}
            className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-muted ${isActive ? "text-foreground bg-muted" : "text-muted-foreground"
                }`}
        >
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{item.icon}</span>
                {item.label}
            </div>
            {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white px-1.5">
                    {item.badge}
                </span>
            )}
        </Link>
    )
}

function AdminSidebarContent({ user, onNavigate, counts }: { user?: any, onNavigate?: () => void, counts?: AdminCounts }) {
    const navItems = getAdminNavItems(counts)
    return (
        <>
            <div className="flex items-center h-14 px-4 border-b border-border lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
                    <Image
                        src="/logo.png"
                        alt="Truework Logo"
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain flex-shrink-0"
                    />
                    <span className="font-medium text-foreground font-[family-name:var(--font-logo)]">Truework Admin</span>
                </Link>
            </div>

            <div className="px-3 py-4">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest leading-none">Admin Console</span>
                        <span className="text-[10px] text-white/60 font-medium">Root Access</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => (
                    <NavItemComponent key={item.label} item={item} onNavigate={onNavigate} />
                ))}
            </nav>

        </>
    )
}

export default function AdminClientLayout({
    children,
    notifications,
    user,
    counts
}: {
    children: React.ReactNode,
    notifications: any[],
    user?: any,
    counts?: AdminCounts
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const pathname = usePathname()
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    return (
        <div className="flex min-h-screen bg-[#f8f9fc]">
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-background border-r border-border transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted z-10"
                >
                    <X className="h-5 w-5 text-muted-foreground" />
                </button>
                <AdminSidebarContent user={user} onNavigate={() => setMobileMenuOpen(false)} counts={counts} />
            </aside>

            <aside
                className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-background border-r border-border transition-[width,opacity,transform] duration-300 ease-in-out overflow-hidden ${sidebarCollapsed
                    ? "w-0 opacity-0 -translate-x-4"
                    : "w-[260px] opacity-100 translate-x-0"
                    }`}
            >
                <div className="min-w-[260px]">
                    <AdminSidebarContent user={user} counts={counts} />
                </div>
            </aside>

            <div
                className={`flex-1 flex flex-col transition-[margin] duration-300 ease-in-out ${sidebarCollapsed ? "md:ml-0" : "md:ml-[260px]"
                    }`}
            >
                <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-3 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sm:px-4 lg:h-[60px] lg:px-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden"
                        >
                            <Menu className="h-5 w-5 text-muted-foreground" />
                        </button>

                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden md:flex p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <PanelLeft className="h-5 w-5 text-muted-foreground" />
                        </button>

                        <div className="hidden sm:block h-5 w-px bg-slate-200" />

                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-none mb-0.5">Administrator</span>
                            <span className="text-sm font-bold text-slate-900 leading-none">Global Control</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <NotificationsMenu initialNotifications={notifications} />
                        <Dashboard2UserDropdown user={user} />
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
