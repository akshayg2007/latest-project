"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Search,
  Briefcase
} from "lucide-react"

interface SidebarNavProps {
  isSeller: boolean
  pendingOrdersCount: number
  basePath?: string
}

export function SidebarNav({ isSeller, pendingOrdersCount, basePath = "/dashboard" }: SidebarNavProps) {
  const pathname = usePathname()

  // Helper to determine active style
  const isActive = (path: string) => pathname === path

  const linkClass = (path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive(path)
      ? "bg-muted text-primary font-medium"
      : "text-muted-foreground"
    }`

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">

      {isSeller ? (
        // === SELLER LINKS ===
        <>
          <Link href={basePath} className={linkClass(basePath)}>
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <Link href={`${basePath}/customers`} className={linkClass(`${basePath}/customers`)}>
            <Users className="h-4 w-4" /> Customers
          </Link>
        </>
      ) : (
        // === BUYER LINKS ===
        <>
          <Link href="/" className={linkClass("/")}>
            <Search className="h-4 w-4" /> Browse Talent
          </Link>
          <Link href={basePath} className={linkClass(basePath)}>
            <Home className="h-4 w-4" /> Dashboard
          </Link>
        </>
      )}
    </nav>
  )
}