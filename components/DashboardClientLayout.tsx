"use client"

import { cn } from "@/lib/utils"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Dashboard2UserDropdown, Dashboard2WorkspaceSelector } from "@/components/Dashboard2Components"
import NotificationsMenu from "@/components/NotificationsMenu"
import { SupportBot } from "@/components/SupportBot"

// Icons
import {
    LayoutDashboard,
    FolderKanban,
    MessageSquare,
    FileText,
    Users,
    Briefcase,
    Shield,
    CreditCard,
    ChevronDown,
    ChevronRight,
    Plus,
    PanelLeft,
    Menu,
    X,
    Compass,
    PlusCircle,
    ShoppingBag,
    LifeBuoy,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

// Types
interface NavItem {
    label: string
    icon: React.ReactNode
    href?: string
    badge?: number
    children?: { label: string; href: string }[]
}

const CLIENT_NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        href: "/dashboard",
    },
    {
        label: "Explore",
        icon: <Compass className="h-4 w-4" />,
        href: "/dashboard/explore",
    },
    {
        label: "Projects",
        icon: <FolderKanban className="h-4 w-4" />,
        children: [
            { label: "Active", href: "/dashboard/projects/active" },
            { label: "Completed", href: "/dashboard/projects/completed" },
            { label: "Disputes", href: "/dashboard/projects/disputes" },
        ],
    },
    {
        label: "Messages",
        icon: <MessageSquare className="h-4 w-4" />,
        href: "/dashboard/messages",
    },
    {
        label: "Proposals",
        icon: <FileText className="h-4 w-4" />,
        children: [
            { label: "Received", href: "/dashboard/proposals/received" },
            { label: "Track", href: "/dashboard/proposals/track" },
        ],
    },
    {
        label: "Jobs",
        icon: <Briefcase className="h-4 w-4" />,
        href: "/dashboard/jobs",
    },
    {
        label: "Community",
        icon: <Users className="h-4 w-4" />,
        href: "/dashboard/community",
    },

    {
        label: "Credibility",
        icon: <Shield className="h-4 w-4" />,
        children: [
            { label: "Status", href: "/dashboard/credibility/status" },
            { label: "History", href: "/dashboard/credibility/history" },
        ],
    },
    {
        label: "Payment",
        icon: <CreditCard className="h-4 w-4" />,
        children: [
            { label: "Accounts", href: "/dashboard/payment/accounts" },
            { label: "My Purchases", href: "/dashboard/payment/purchases" },
            { label: "History", href: "/dashboard/payment/history" },
        ],
    },
    {
        label: "Support",
        icon: <LifeBuoy className="h-4 w-4" />,
        href: "?support=tickets",
    },
]

const FREELANCER_NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        href: "/dashboard",
    },
    {
        label: "Explore",
        icon: <Compass className="h-4 w-4" />,
        href: "/dashboard/explore",
    },
    {
        label: "Projects",
        icon: <FolderKanban className="h-4 w-4" />,
        children: [
            { label: "Active", href: "/dashboard/projects/active" },
            { label: "Completed", href: "/dashboard/projects/completed" },
            { label: "Disputes", href: "/dashboard/projects/disputes" },
        ],
    },
    {
        label: "Messages",
        icon: <MessageSquare className="h-4 w-4" />,
        href: "/dashboard/messages",
    },
    {
        label: "Proposals",
        icon: <FileText className="h-4 w-4" />,
        children: [
            { label: "Sent", href: "/dashboard/proposals/sent" },
            { label: "Track", href: "/dashboard/proposals/track" },
        ],
    },
    {
        label: "Community",
        icon: <Users className="h-4 w-4" />,
        href: "/dashboard/community",
    },

    {
        label: "Credibility",
        icon: <Shield className="h-4 w-4" />,
        children: [
            { label: "Status", href: "/dashboard/credibility/status" },
            { label: "History", href: "/dashboard/credibility/history" },
        ],
    },
    {
        label: "Payment",
        icon: <CreditCard className="h-4 w-4" />,
        children: [
            { label: "Accounts", href: "/dashboard/payment/accounts" },
            { label: "My Purchases", href: "/dashboard/payment/purchases" },
            { label: "History", href: "/dashboard/payment/history" },
        ],
    },
    {
        label: "Support",
        icon: <LifeBuoy className="h-4 w-4" />,
        href: "?support=tickets",
    },
]

function NavItemComponent({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const hasChildren = item.children && item.children.length > 0

    const isActive = item.href === pathname || item.children?.some((c) => c.href === pathname)

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-muted ${isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{item.icon}</span>
                        {item.label}
                    </div>
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                {isOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-4">
                        {item.children?.map((child) => (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={`block px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted ${pathname === child.href
                                    ? "text-foreground font-medium bg-muted"
                                    : "text-muted-foreground"
                                    }`}
                            >
                                {child.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )
    }

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
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white px-1.5">
                    {item.badge}
                </span>
            )}
        </Link>
    )
}

function SidebarContent({ user, onNavigate }: { user?: any, onNavigate?: () => void }) {
    const isClient = user?.activeProfile === "BUYER"
    const navItems = isClient ? CLIENT_NAV_ITEMS : FREELANCER_NAV_ITEMS

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
                    <span className="font-medium text-foreground font-[family-name:var(--font-logo)]">Truework</span>
                </Link>
            </div>

            <div className="px-3 py-3">
                <Dashboard2WorkspaceSelector user={user} />
            </div>

            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => (
                    <NavItemComponent key={item.label} item={item} onNavigate={onNavigate} />
                ))}
            </nav>

            <div className="p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
                            <Plus className="h-4 w-4 flex-shrink-0" />
                            Create
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="center" side="top">
                        <DropdownMenuLabel>Create New</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {isClient ? (
                            <>
                                <DropdownMenuItem onClick={() => window.location.href = "/jobs/create"}>
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <span>Create a Job</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = "/dashboard/community/create"}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Create a Post</span>
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <>
                                <DropdownMenuItem onClick={() => window.location.href = "/services/create"}>
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <span>Create a Service</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = `/users/${user?.username}/store/create`}>
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    <span>Create a Product</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = "/jobs/create"}>
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <span>Create a Job</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = "/dashboard/community/create"}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Create a Post</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}

export default function DashboardClientLayout({
    children,
    notifications,
    user
}: {
    children: React.ReactNode,
    notifications: any[],
    user?: any
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const pathname = usePathname()
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileMenuOpen])

    return (
        <div className="flex min-h-screen bg-muted/40">
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
                <SidebarContent user={user} onNavigate={() => setMobileMenuOpen(false)} />
            </aside>

            <aside
                className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-background border-r border-border transition-[width,opacity,transform] duration-300 ease-in-out overflow-hidden ${sidebarCollapsed
                    ? "w-0 opacity-0 -translate-x-4"
                    : "w-[240px] opacity-100 translate-x-0"
                    }`}
            >
                <div className="min-w-[240px]">
                    <SidebarContent user={user} />
                </div>
            </aside>

            <div
                className={`flex-1 flex flex-col transition-[margin] duration-300 ease-in-out ${sidebarCollapsed ? "md:ml-0" : "md:ml-[240px]"
                    }`}
            >
                <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sm:px-4 lg:h-[60px] lg:px-6">
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

                        <div className="hidden sm:block h-5 w-px bg-border" />

                        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                            <Image
                                src="/logo.png"
                                alt="Truework"
                                width={24}
                                height={24}
                                className="h-6 w-6 object-contain"
                            />
                            <span className="font-medium text-foreground text-sm font-[family-name:var(--font-logo)]">Truework</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <NotificationsMenu initialNotifications={notifications} />
                        <Dashboard2UserDropdown user={user} />
                    </div>
                </header>

                <main className={cn(
                    "flex-1 bg-muted/40",
                    (pathname === "/dashboard/explore" || pathname?.startsWith("/dashboard/user")) ? "p-0" : "p-3 sm:p-4 lg:p-6"
                )}>
                    <div className={cn(
                        (pathname === "/dashboard/explore" || pathname?.startsWith("/dashboard/user")) ? "max-w-none mx-0" : "max-w-7xl mx-auto"
                    )}>
                        {children}
                    </div>
                </main>
            </div>
            <SupportBot />
        </div>
    )
}
