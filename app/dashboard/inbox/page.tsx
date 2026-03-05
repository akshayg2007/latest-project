import { MessageSquare } from "lucide-react"

export default function InboxPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-500 animate-pulse">
                <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Messages</h2>
            <p className="text-slate-500 max-w-sm mb-8">
                Select a conversation from the sidebar to start chatting with buyers or sellers.
            </p>
        </div>
    )
}
