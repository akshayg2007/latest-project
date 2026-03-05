'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

import { useParams, useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Conversation {
    id: string
    status: string
    initiatorId: string | null
    userAId: string
    userBId: string
    updatedAt: any
    userA: { username: string; avatarUrl: string | null }
    userB: { username: string; avatarUrl: string | null }
    messages: { text: string; senderId: string; createdAt: any }[]
}

interface ConversationListProps {
    conversations: any[]
    currentUserId: string
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
    const params = useParams()
    const searchParams = useSearchParams()
    const activeTab = searchParams.get('tab') || 'primary'
    const activeConvId = params.conversationId as string

    const primaryConversations = conversations.filter(c =>
        c.status === "ACCEPTED" || c.initiatorId === currentUserId
    )
    const requestConversations = conversations.filter(c =>
        c.status === "PENDING" && c.initiatorId !== currentUserId
    )

    const displayConversations = activeTab === 'requests' ? requestConversations : primaryConversations

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-border">
                <Link
                    href="/dashboard/messages"
                    className={cn(
                        "flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 hover:bg-muted/50",
                        activeTab === 'primary' ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground"
                    )}
                >
                    Primary
                </Link>
                <Link
                    href="/dashboard/messages?tab=requests"
                    className={cn(
                        "flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 hover:bg-muted/50 relative",
                        activeTab === 'requests' ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground"
                    )}
                >
                    Requests
                </Link>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {displayConversations.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center text-muted-foreground">
                            {activeTab === 'requests' ? '📥' : '✉️'}
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {activeTab === 'requests' ? 'No message requests.' : 'No conversations yet.'}
                        </p>
                    </div>
                ) : (
                    displayConversations.map((conv) => {
                        const isUserA = conv.userAId === currentUserId
                        const otherUser = isUserA ? conv.userB : conv.userA
                        const lastMsg = conv.messages[0]
                        const isUnread = lastMsg && lastMsg.senderId !== currentUserId
                        const isActive = activeConvId === conv.id

                        return (
                            <Link
                                key={conv.id}
                                href={`/dashboard/messages/${conv.id}${activeTab === 'requests' ? '?tab=requests' : ''}`}
                                className="block"
                            >
                                <div className={cn(
                                    "flex items-center gap-3 p-4 hover:bg-muted/50 transition-all border-b border-border cursor-pointer group",
                                    isUnread ? 'bg-blue-50/50' : '',
                                    isActive ? 'bg-muted' : ''
                                )}>
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border border-border">
                                            <AvatarImage src={otherUser.avatarUrl || ""} />
                                            <AvatarFallback className="bg-blue-600 text-white font-semibold">
                                                {otherUser.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-semibold truncate pr-2 text-sm text-foreground">
                                                {otherUser.username}
                                            </h3>
                                            {lastMsg && (
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {format(new Date(lastMsg.createdAt), "MMM d")}
                                                </span>
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate",
                                            isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                                        )}>
                                            {lastMsg ? lastMsg.text : <span className="italic">No messages</span>}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}
