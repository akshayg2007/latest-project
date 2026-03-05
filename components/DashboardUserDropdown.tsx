"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2, CircleUser, RefreshCw, UserCircle } from "lucide-react"
import { switchProfileMode } from "@/app/actions/user"

interface DashboardUserDropdownProps {
  username: string
  isSeller: boolean
}

export function DashboardUserDropdown({ username, isSeller }: DashboardUserDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSignOutOpen, setIsSignOutOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (isSignOutOpen) {
      setTimeout(() => cancelButtonRef.current?.focus(), 50)
    }
  }, [isSignOutOpen])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/" })
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full focus-visible:ring-0">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account ({username})</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* 1. MY PROFILE (First Icon) */}
          <DropdownMenuItem asChild onClick={() => setIsDropdownOpen(false)}>
            <Link href={`/dashboard/user/${username}`} className="cursor-pointer flex items-center">
              <UserCircle className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </DropdownMenuItem>



          {/* 3. SWITCH MODE */}
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <form action={switchProfileMode} className="w-full">
              <button type="submit" className="relative flex w-full cursor-default select-none items-center rounded-sm text-sm outline-none text-blue-600 font-medium">
                <RefreshCw className="mr-2 h-4 w-4" />
                Switch to {isSeller ? "Buying" : "Selling"}
              </button>
            </form>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 4. LOGOUT (Triggers Popup) */}
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            onSelect={() => {
              setIsDropdownOpen(false)
              setIsSignOutOpen(true)
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- LOGOUT POPUP PORTAL --- */}
      {mounted && isSignOutOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-100 mx-4 animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sign out?</h3>
              <p className="text-slate-500 text-sm mt-2">Are you sure you want to sign out? You will need to log in again to access your account.</p>
            </div>
            <div className="flex gap-3">
              <Button ref={cancelButtonRef} variant="outline" className="flex-1 rounded-full" onClick={() => setIsSignOutOpen(false)} disabled={isSigningOut}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white" onClick={handleSignOut} disabled={isSigningOut}>
                {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}