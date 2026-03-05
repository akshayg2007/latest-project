"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/user-dropdown"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
// Currency is auto-detected from location - no manual selector needed

interface NavbarClientProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function NavbarClient({ user }: NavbarClientProps) {
  const pathname = usePathname()

  // 1. CHECK IF DASHBOARD OR ADMIN
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")

  // 2. SMOOTH SCROLL HANDLER
  // This forces the browser to scroll to the ID even if the URL hash is already present
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById("how-it-works");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  // 3. IF DASHBOARD, RENDER NOTHING
  if (isDashboard) {
    return null
  }

  // 4. MAIN NAVBAR RENDER
  return (
    <>
      {/* THE FIXED HEADER */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

          {/* LEFT: LOGO */}
          <div className="flex items-center gap-2 font-medium text-xl text-blue-600 shrink-0">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="Truework Logo" width={24} height={24} className="w-6 h-6 object-contain" />
              <span className="text-slate-900 font-[family-name:var(--font-logo)]">Truework</span>
            </Link>
          </div>

          {/* RIGHT: NAVIGATION */}
          <div className="flex items-center gap-8 ml-auto">

            {/* Desktop Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link
                href="/#how-it-works"
                onClick={handleScroll}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                How it works
              </Link>
              <Link href="/safety" className="hover:text-blue-600 transition-colors">Safety</Link>

              <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <UserDropdown user={user} />
              ) : (
                <>
                  <Link href="/api/auth/signin">
                    <Button variant="outline" className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-6">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-sm hover:shadow-md transition-all">
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] p-0">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

                  {/* Menu Header with Logo */}
                  <div className="flex items-center gap-2 p-6 border-b border-slate-100">
                    <Image src="/logo.png" alt="Truework Logo" width={28} height={28} className="w-7 h-7 object-contain" />
                    <span className="font-medium text-lg text-slate-900 font-[family-name:var(--font-logo)]">Truework</span>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col p-6 space-y-1">
                    <Link
                      href="/#how-it-works"
                      onClick={handleScroll}
                      className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      How it works
                    </Link>
                    <Link
                      href="/safety"
                      className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      Safety
                    </Link>

                    <Link
                      href="/pricing"
                      className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      Pricing
                    </Link>
                  </nav>

                  {/* Divider */}
                  <div className="mx-6 h-px bg-slate-100" />

                  {/* Auth Section */}
                  <div className="p-6 mt-auto">
                    {user ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Link href="/api/auth/signin" className="w-full">
                          <Button variant="outline" className="w-full h-12 text-base rounded-xl border-slate-200 hover:bg-slate-50">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/signup" className="w-full">
                          <Button className="w-full h-12 text-base rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all">
                            Get Started Free
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* INVISIBLE SPACER */}
      <div className="h-16 w-full" aria-hidden="true" />
    </>
  )
}