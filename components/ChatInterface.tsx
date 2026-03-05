"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Flag, ShieldAlert, MoreVertical } from "lucide-react"
import { ReportButton } from "@/components/ReportButton"
import { sendMessage, acceptConversation, declineConversation } from "@/app/actions/chat"

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

interface ChatInterfaceProps {
  conversationId: string
  currentUserId: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  initiatorId: string | null
  otherUser: {
    username: string
    avatarUrl: string | null
  }
  initialMessages: Message[]
}

export default function ChatInterface({
  conversationId,
  currentUserId,
  status,
  initiatorId,
  otherUser,
  initialMessages
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isPending = status === "PENDING"
  const isInitiator = initiatorId === currentUserId
  const isRequest = isPending && !isInitiator
  const isDeclined = status === "DECLINED"

  // Auto-scroll to bottom on load and on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [initialMessages])

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* HEADER - Premium frosted look */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src={otherUser.avatarUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                {otherUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{otherUser.username}</h3>
            {isRequest && (
              <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Message Request</p>
            )}
          </div>
        </div>

        {/* Actions Placeholder - Could be 'View Profile' etc */}
        <div className="flex items-center gap-1">
          <ReportButton targetId={conversationId} targetType="USER" targetName={`@${otherUser.username}`} variant="icon" />
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* REQUEST BANNER */}
      {isRequest && (
        <div className="bg-blue-50 border-b border-blue-100 p-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="max-w-md mx-auto text-center space-y-3">
            <p className="text-sm text-blue-900 font-medium">
              {otherUser.username} wants to message you. They won&apos;t know you&apos;ve seen this until you accept.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => acceptConversation(conversationId)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6"
              >
                Accept
              </Button>
              <Button
                onClick={() => declineConversation(conversationId)}
                size="sm"
                variant="outline"
                className="text-slate-600 rounded-lg"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINED BANNER */}
      {isDeclined && (
        <div className="bg-slate-100 border-b border-slate-200 p-4">
          <p className="text-sm text-center text-slate-600 font-medium">
            This conversation has been declined.
          </p>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 relative"
      >
        {/* Subtle pattern background could go here */}

        {initialMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <div className="w-16 h-16 bg-blue-100/50 rounded-full flex items-center justify-center mb-4 text-blue-500">
              <Send className="w-8 h-8 ml-1" />
            </div>
            <p className="text-slate-500 font-medium">No messages yet.</p>
            <p className="text-sm text-slate-400 mt-1">Start the conversation with {otherUser.username}!</p>
          </div>
        ) : (
          initialMessages.map((msg, index) => {
            const isMe = msg.sender.id === currentUserId
            const isLast = index === initialMessages.length - 1

            return (
              <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex flex-col max-w-[85%] md:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>

                  <div className={`px-5 py-3 text-base leading-relaxed shadow-sm relative group/msg ${isMe
                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                    : "bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-sm hover:border-slate-200"
                    }`}>
                    {msg.text}

                    {!isMe && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <ReportButton
                          targetId={msg.id}
                          targetType="MESSAGE"
                          targetName="this message"
                          variant="icon"
                          className="h-7 w-7 text-slate-300 hover:text-red-500 bg-transparent hover:bg-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 mt-1.5 px-1 select-none">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* INPUT AREA */}
      {!isRequest && !isDeclined && (
        <div className="p-4 bg-white border-t border-slate-100">
          <form
            ref={formRef}
            action={async (formData) => {
              const result = await sendMessage(formData);
              formRef.current?.reset();
            }} className="flex gap-3 items-end max-w-4xl mx-auto">
            <input type="hidden" name="conversationId" value={conversationId} />

            <div className="flex-1 bg-slate-100 hover:bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all rounded-xl border border-transparent focus-within:border-blue-200 flex items-center px-4 py-2">
              <Input
                name="text"
                placeholder="Type your message..."
                autoComplete="off"
                className="border-none shadow-none focus-visible:ring-0 bg-transparent p-0 text-base h-auto placeholder:text-slate-400"
                required
              />
            </div>

            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      )}

    </div>
  )
}
