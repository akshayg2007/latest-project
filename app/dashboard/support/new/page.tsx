import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Headset,
    Send
} from "lucide-react"
import { createSupportTicketAction } from "@/app/actions/support"
import Link from "next/link"

export default async function NewSupportTicketPage() {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/support">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Create Support Ticket</h1>
                        <p className="text-slate-500 text-sm">
                            Get help from our support team
                        </p>
                    </div>
                </div>

                {/* Ticket Form */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Headset className="w-5 h-5" />
                            Submit New Ticket
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form action={createSupportTicketAction} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        name="category"
                                        placeholder="e.g., Technical Issue, Billing Question"
                                        className="rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                                    <Input
                                        id="subcategory"
                                        name="subcategory"
                                        placeholder="e.g., Login Issues, Payment Problems"
                                        className="rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    name="subject"
                                    placeholder="Brief description of your issue"
                                    className="rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Please provide as much detail as possible..."
                                    className="min-h-[150px] rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <select
                                    id="priority"
                                    name="priority"
                                    className="w-full rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 p-3"
                                    defaultValue="MEDIUM"
                                >
                                    <option value="LOW">Low - Not urgent</option>
                                    <option value="MEDIUM">Medium - Normal priority</option>
                                    <option value="HIGH">High - Urgent attention needed</option>
                                    <option value="URGENT">Urgent - Critical issue</option>
                                </select>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Submit Ticket
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
