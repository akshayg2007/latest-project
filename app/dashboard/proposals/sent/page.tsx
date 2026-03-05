
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableCell } from "@/components/ui/table"
import { Inbox } from "lucide-react"
import { SentProposalsTable } from "./SentProposalsTable"


export const dynamic = 'force-dynamic'


export default async function SentProposalsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch all sent applications and filter in JavaScript
    const allApplications = await db.jobApplication.findMany({
        where: {
            freelancerId: userId
        },
        include: {
            job: {
                include: { client: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    // Filter out rejected and withdrawn
    const applications = allApplications.filter(app =>
        app.status !== 'REJECTED' && app.status !== 'WITHDRAWN'
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sent Proposals</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Track the status of your applications and manage your proposals.
                    </p>
                </div>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm">
                    <Link href="/explore">
                        Find More Jobs
                    </Link>
                </Button>
            </div>

            <Card className="border-none bg-white/50 backdrop-blur-sm overflow-hidden ring-1 ring-slate-200/50 shadow-sm">
                <CardHeader className="px-6 py-5 border-b bg-white">
                    <CardTitle className="text-lg font-semibold text-slate-800">Your Proposals</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <div className="p-4 rounded-full bg-slate-100 mb-4">
                                <Inbox className="h-10 w-10 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-slate-900">No proposals sent yet</p>
                                <p>Your sent proposals will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <SentProposalsTable applications={applications as any} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
