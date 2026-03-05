import { auth } from "@/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user) redirect("/")

    const conversations = await db.conversation.findMany({
        where: {
            OR: [{ userAId: session.user.id }, { userBId: session.user.id }]
        },
        include: {
            userA: true,
            userB: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    return (
        <div className="flex h-[calc(100vh-140px)] min-h-[500px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* SIDEBAR */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 hidden md:flex">
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-lg text-slate-800">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center text-slate-400">
                                ✉️
                            </div>
                            <p className="text-slate-500 text-sm">No conversations yet.</p>
                        </div>
                    ) : (
                        conversations.map((conv: any) => {
                            const isUserA = conv.userAId === session.user.id
                            const otherUser = isUserA ? conv.userB : conv.userA
                            const lastMsg = conv.messages[0]

                            return (
                                <Link key={conv.id} href={`/dashboard/inbox/${conv.id}`} className="block">
                                    <div className="flex items-center gap-3 p-4 hover:bg-white hover:shadow-sm transition-all border-b border-slate-100/50 cursor-pointer group">
                                        <Avatar className="h-10 w-10 border border-slate-200">
                                            <AvatarImage src={otherUser.avatarUrl || ""} />
                                            <AvatarFallback className="bg-slate-200 text-slate-600 font-semibold">
                                                {otherUser.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-semibold text-slate-800 truncate pr-2 text-sm">{otherUser.username}</h3>
                                                {lastMsg && (
                                                    <span className="text-[10px] text-slate-400 shrink-0">
                                                        {new Date(lastMsg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate group-hover:text-slate-700 font-medium">
                                                {lastMsg ? lastMsg.text : <span className="text-slate-400 italic">No messages</span>}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {children}
            </div>
        </div>
    )
}
