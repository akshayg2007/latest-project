"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, Activity } from "lucide-react"

interface Message {
    id: string
    text: string
    createdAt: string
    sender: {
        id: string
        username: string
        avatarUrl: string | null
        role: string
    }
}

interface SupportChatProps {
    ticketId: string
    currentUserId: string
    messages?: Message[]
}

export function SupportChat({ ticketId, currentUserId, messages = [] }: SupportChatProps) {
    const [newMessage, setNewMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAdminTyping, setIsAdminTyping] = useState(false)
    const [lastAdminActivity, setLastAdminActivity] = useState<Date | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Simulate admin typing indicator (in real app, this would be WebSocket or polling)
    useEffect(() => {
        const checkAdminActivity = () => {
            // Check if there are recent admin messages
            const recentAdminMessages = messages.filter(msg => 
                msg.sender.role === "ADMIN" && 
                new Date(msg.createdAt).getTime() > Date.now() - 60000 // Last 60 seconds
            )
            
            if (recentAdminMessages.length > 0) {
                setLastAdminActivity(new Date(recentAdminMessages[0].createdAt))
                setIsAdminTyping(false)
            }
        }

        checkAdminActivity()
        const interval = setInterval(checkAdminActivity, 5000)
        return () => clearInterval(interval)
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("ticketId", ticketId)
            formData.append("text", newMessage)

            const response = await fetch("/api/support/message", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                setNewMessage("")
                // Refresh the page to show new message
                window.location.reload()
            } else {
                console.error("Failed to send message")
            }
        } catch (error) {
            console.error("Error sending message:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Live Chat</h3>
                <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${lastAdminActivity && new Date().getTime() - lastAdminActivity.getTime() < 30000 ? "bg-green-500 animate-pulse" : "bg-green-500"}`} />
                    <span className="text-slate-500">
                        {lastAdminActivity && new Date().getTime() - lastAdminActivity.getTime() < 30000 
                            ? "Support Team Active" 
                            : "Support Team Online"
                        }
                    </span>
                </div>
            </div>

            {/* Admin Typing Indicator */}
            {isAdminTyping && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">
                            Support team is typing...
                        </span>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-8">
                        No messages yet. Start the conversation below.
                    </div>
                ) : (
                    messages.map((message) => {
                        const isCurrentUser = message.sender.id === currentUserId
                        const isAdmin = message.sender.role === "ADMIN"
                        const isRecentAdmin = isAdmin && new Date(message.createdAt).getTime() > Date.now() - 30000

                        return (
                            <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Avatar className="w-8 h-8">
                                            {message.sender.avatarUrl ? (
                                                <AvatarImage src={message.sender.avatarUrl} alt="" />
                                            ) : (
                                                <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                                    {message.sender.username?.charAt(0).toUpperCase() || "S"}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {message.sender.username}
                                                {isAdmin && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                        {isRecentAdmin ? <><Activity className="w-3 h-3 mr-1 animate-pulse" /> SUPPORT</> : "SUPPORT"}
                                                    </span>
                                                )}
                                                {isCurrentUser && <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">YOU</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(message.createdAt).toLocaleString()}
                                                {isRecentAdmin && (
                                                    <span className="ml-2 text-blue-600">
                                                        • Just now
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm ${isCurrentUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"} ${isRecentAdmin ? "ring-2 ring-blue-200 ring-opacity-50" : ""}`}>
                                        {message.text}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100">
                <div className="flex gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 resize-none rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        rows={2}
                        disabled={isSubmitting}
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
