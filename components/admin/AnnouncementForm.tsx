"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Megaphone, Send, User, Loader2 } from "lucide-react"
import { sendMassNotification, sendUserNotification } from "@/app/actions/announcements"
import { toast } from "sonner"

export function AnnouncementForm({ userCount }: { userCount: number }) {
    const [tab, setTab] = useState<"broadcast" | "individual">("broadcast")
    const [message, setMessage] = useState("")
    const [link, setLink] = useState("")
    const [username, setUsername] = useState("")
    const [loading, setLoading] = useState(false)

    const handleBroadcast = async () => {
        if (!message.trim()) return
        setLoading(true)
        try {
            const result = await sendMassNotification("ALL", message, link)
            toast.success(`Announcement sent to ${result.count} users!`)
            setMessage("")
            setLink("")
        } catch (error: any) {
            toast.error(error.message || "Failed to send announcement")
        } finally {
            setLoading(false)
        }
    }

    const handleIndividual = async () => {
        if (!message.trim() || !username.trim()) return
        setLoading(true)
        try {
            const result = await sendUserNotification(username, message, link)
            toast.success(`Notification sent to @${result.username}!`)
            setMessage("")
            setLink("")
            setUsername("")
        } catch (error: any) {
            toast.error(error.message || "Failed to send notification")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Tab Switch */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner w-fit">
                <Button
                    variant={tab === "broadcast" ? "default" : "ghost"}
                    className={`rounded-xl font-bold text-xs px-5 h-10 ${tab === "broadcast" ? "bg-white text-blue-600 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                    onClick={() => setTab("broadcast")}
                >
                    <Megaphone className="w-4 h-4 mr-2" />
                    All Users
                </Button>
                <Button
                    variant={tab === "individual" ? "default" : "ghost"}
                    className={`rounded-xl font-bold text-xs px-5 h-10 ${tab === "individual" ? "bg-white text-blue-600 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                    onClick={() => setTab("individual")}
                >
                    <User className="w-4 h-4 mr-2" />
                    Specific User
                </Button>
            </div>

            {tab === "broadcast" ? (
                <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                        This will send a notification to <span className="font-bold text-slate-900">{userCount}</span> users on the platform.
                    </p>

                    {/* Message */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message</p>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your announcement message..."
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                        />
                    </div>

                    {/* Link */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Link (Optional)</p>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="/dashboard (default)"
                            className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>

                    <Button
                        onClick={handleBroadcast}
                        disabled={loading || !message.trim()}
                        className="h-10 px-6 rounded-xl font-bold text-sm bg-slate-900 hover:bg-blue-600 text-white transition-colors gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {loading ? "Sending..." : `Send to ${userCount} Users`}
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Username */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recipient</p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full h-10 pl-8 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message</p>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                        />
                    </div>

                    {/* Link */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Link (Optional)</p>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="/dashboard (default)"
                            className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>

                    <Button
                        onClick={handleIndividual}
                        disabled={loading || !message.trim() || !username.trim()}
                        className="h-10 px-6 rounded-xl font-bold text-sm bg-slate-900 hover:bg-blue-600 text-white transition-colors gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {loading ? "Sending..." : "Send Notification"}
                    </Button>
                </div>
            )}
        </div>
    )
}
