"use client"

import { useState } from "react"
import { Bell, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/app/actions/notifications"

interface Notification {
  id: string
  text: string
  link: string | null
  isRead: boolean
  createdAt: Date
}

export default function NotificationsMenu({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleRead = async (id: string, link: string | null) => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    // Server Update
    await markNotificationRead(id)
  }

  const handleReadAll = async () => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    // Server Update
    await markAllNotificationsRead()
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    // Optimistic Update
    setNotifications(prev => prev.filter(n => n.id !== id))
    // Server Update
    await deleteNotification(id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative ml-auto h-8 w-8 rounded-full">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-white" />
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex flex-col">
            <span>Notifications</span>
            {unreadCount > 0 && <span className="text-[10px] font-normal text-slate-500">{unreadCount} unread</span>}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                handleReadAll();
              }}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No new notifications</div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} className="cursor-pointer p-0 focus:bg-transparent">
                <div className={`w-full flex items-center border-b border-slate-50 hover:bg-slate-50 transition-colors ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}>
                  <Link
                    href={n.link || "#"}
                    className="flex-1 px-4 py-3 block min-w-0"
                    onClick={() => handleRead(n.id, n.link)}
                  >
                    <p className={`text-sm ${n.isRead ? 'font-normal' : 'font-semibold text-slate-900'}`}>{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="flex-shrink-0 p-2 mr-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {/* VIEW ALL BUTTON */}
        <div className="p-2 border-t bg-slate-50/50">
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="sm" className="w-full text-xs justify-between">
              View All Activity <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </Link>
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}