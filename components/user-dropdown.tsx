"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  UserCircle,
  LogOut,
  LayoutDashboard
} from "lucide-react"
import { SignOutPopup } from "./SignOutPopup"

interface UserDropdownProps {
  user: {
    id?: string | null
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSignOutOpen, setIsSignOutOpen] = useState(false)

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border border-slate-200 shadow-sm focus-visible:ring-0">
            {user.image ? (
              <img src={user.image} alt="User" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild onClick={() => setIsDropdownOpen(false)}>
            <Link href={`/dashboard/user/${user.name}`} className="cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild onClick={() => setIsDropdownOpen(false)}>
            <Link href="/dashboard" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </DropdownMenuItem>



          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            onSelect={() => {
              setIsDropdownOpen(false)
              setIsSignOutOpen(true)
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutPopup
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
      />
    </>
  )
}