"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2 } from "lucide-react"
import { sendOrderMessage } from "@/app/actions/support"
import { format } from "date-fns"

interface Message {
    id: string
    text: string
    createdAt: Date
    sender: {
        id: string
        username: string
        avatarUrl: string | null
    }
}

interface OrderChatProps {
    orderId: string
    currentUserId: string
    initialMessages: any[]
}

export function OrderChat({ orderId, currentUserId, initialMessages }: OrderChatProps) {
    const [messages, setMessages] = useState(initialMessages)
    const [newMessage, setNewMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await sendOrderMessage(orderId, newMessage)
            if (result.success) {
                setMessages([...messages, result.message])
                setNewMessage("")
            }
        } catch (error) {
            console.error("Error sending message:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Project Workspace Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <MessageCircle className="w-8 h-8 mb-2" />
                        <p className="text-xs font-medium">No messages yet. Send a message to start the workspace discussion.</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isMe = message.sender.id === currentUserId
                        return (
                            <div key={message.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                                {!isMe && (
                                    <Avatar className="w-8 h-8 shrink-0">
                                        <AvatarImage src={message.sender.avatarUrl || ""} />
                                        <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-bold">
                                            {message.sender.username?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    <div className={`p-3 rounded-2xl text-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"}`}>
                                        {message.text}
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-1 font-medium">
                                        {format(new Date(message.createdAt), 'hh:mm a')}
                                    </span>
                                </div>
                                {isMe && (
                                    <Avatar className="w-8 h-8 shrink-0">
                                        <AvatarImage src={message.sender.avatarUrl || ""} />
                                        <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">
                                            ME
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-100"
                        disabled={isSubmitting}
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-10 h-10 p-0"
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

import { MessageCircle } from "lucide-react"
