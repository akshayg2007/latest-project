import { MessageSquare, Users } from "lucide-react"

export default function MessagesPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/30">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-500">
                <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your Messages</h2>
            <p className="text-muted-foreground max-w-sm mb-4">
                Select a conversation from the sidebar to start chatting with clients or collaborators.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>All your conversations are secure and private</span>
            </div>
        </div>
    )
}
