import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Megaphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnnouncementForm } from "@/components/admin/AnnouncementForm"

export default async function AdminAnnouncementsPage() {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== "ADMIN") redirect("/dashboard")

    const userCount = await db.user.count()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Megaphone className="w-6 h-6 text-blue-600" />
                    Announcements
                </h1>
                <p className="text-slate-500 text-sm mt-1">Send notifications to all users or a specific user</p>
            </div>

            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-blue-600" />
                        Compose Notification
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AnnouncementForm userCount={userCount} />
                </CardContent>
            </Card>
        </div>
    )
}
