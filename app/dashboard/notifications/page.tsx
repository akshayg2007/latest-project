import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Bell, CheckCircle2, MessageSquare, Info, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/app/actions/notifications"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function NotificationsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/api/auth/signin")

    const notifications = await db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Bell className="w-8 h-8 text-blue-600" />
                        Notifications
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Stay updated with your latest activity and messages
                    </p>
                </div>

                {unreadCount > 0 && (
                    <form action={async () => {
                        "use server"
                        await markAllNotificationsRead()
                    }}>
                        <Button variant="outline" size="sm" type="submit" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            Mark all as read
                        </Button>
                    </form>
                )}
            </div>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-10 h-10 text-muted-foreground opacity-20" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">All caught up!</h3>
                            <p className="text-muted-foreground max-w-xs mt-2">
                                You don't have any notifications at the moment. We'll let you know when something happens.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((n) => (
                                <NotificationItem key={n.id} notification={n} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function NotificationItem({ notification }: { notification: any }) {
    // Determine icon based on text content (simple heuristic)
    const getIcon = (text: string) => {
        const t = text.toLowerCase()
        if (t.includes('message')) return <MessageSquare className="w-5 h-5 text-blue-500" />
        if (t.includes('order') || t.includes('payment')) return <CheckCircle2 className="w-5 h-5 text-green-500" />
        if (t.includes('review')) return <Info className="w-5 h-5 text-amber-500" />
        return <Bell className="w-5 h-5 text-slate-400" />
    }

    return (
        <div className={`group relative flex items-start gap-4 p-6 transition-all hover:bg-muted/50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}>
            {!notification.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
            )}

            <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!notification.isRead ? 'bg-blue-100/50' : 'bg-muted'}`}>
                {getIcon(notification.text)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                    <p className={`text-sm md:text-base ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {notification.text}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                </div>

                <div className="flex items-center gap-4 mt-3">
                    {notification.link && (
                        <Link href={notification.link}>
                            <Button variant="secondary" size="sm" className="h-8 text-xs font-medium">
                                View Details
                            </Button>
                        </Link>
                    )}

                    {!notification.isRead && (
                        <form action={async () => {
                            "use server"
                            await markNotificationRead(notification.id)
                        }}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-blue-600 hover:bg-transparent p-0 underline decoration-slate-300 underline-offset-4">
                                Mark as read
                            </Button>
                        </form>
                    )}

                    <form action={async () => {
                        "use server"
                        await deleteNotification(notification.id)
                    }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                            title="Delete notification"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
