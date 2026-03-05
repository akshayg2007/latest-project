"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2, User, Bot, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupportMessages, sendSupportMessage } from "@/app/actions/support"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface Message {
    id: string
    text: string
    createdAt: Date
    sender: {
        id: string
        username: string
        avatarUrl: string | null
        role: string
    }
}

export function SupportChat({ ticketId, currentUserId }: { ticketId: string, currentUserId: string }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadMessages()
    }, [ticketId])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    async function loadMessages() {
        try {
            const data = await getSupportMessages(ticketId)
            setMessages(data as any)
        } catch (error) {
            toast.error("Failed to load messages")
        } finally {
            setLoading(false)
        }
    }

    async function handleSend() {
        if (!input.trim() || sending) return
        setSending(true)
        try {
            const result = await sendSupportMessage(ticketId, input)
            if (result.success) {
                setMessages(prev => [...prev, result.message as any])
                setInput("")
            }
        } catch (error: any) {
            console.error("Chat send error:", error)
            toast.error(error.message || "Failed to send message")
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    Support Chat
                </h4>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Connect</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <Bot className="w-8 h-8 mb-2 text-slate-300" />
                        <p className="text-sm font-medium text-slate-400">No messages yet.<br />Start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender.id === currentUserId
                        const isAdmin = msg.sender.role === "ADMIN"

                        return (
                            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                    isMe
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : isAdmin
                                            ? "bg-blue-600 text-white rounded-tl-none"
                                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                                )}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {msg.sender.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Type your response..."
                        className="flex-1 min-h-[44px] max-h-[120px] rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="w-11 h-11 shrink-0 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
