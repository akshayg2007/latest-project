"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
    FileText, MessageSquare, Clock, Paperclip, Send, CheckCircle2, AlertTriangle, PlayCircle,
    Upload, Download, Calendar, Users, Target, TrendingUp, Settings, Bell, Plus,
    Edit, Trash2, Eye, EyeOff, Lock, Unlock, RefreshCw, X
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Milestone {
    id: string
    title: string
    amount: number
    status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED' | 'IN_PROGRESS' | 'REJECTED' | 'IN_REVISION'
    dueDate?: Date | null
    description?: string | null
    deliveryUrl?: string | null
}

interface ProjectFile {
    id: string
    name: string
    size: number
    type: string
    uploadedBy: string
    uploadedAt: Date
    url?: string
}

interface WorkspaceProps {
    project: {
        id: string
        title: string
        description?: string
        status: string
        progress: number
        deadline?: Date
        milestones: Milestone[]
        client: { id: string; name: string; email: string }
        freelancer: { id: string; name: string; email: string }
        createdAt: Date
        updatedAt: Date
    }
    currentUserId: string
    userRole: 'client' | 'freelancer'
}

export function WorkspaceView({ project, currentUserId, userRole }: WorkspaceProps) {
    const [messages, setMessages] = useState([
        { id: 1, sender: "System", text: "🎉 Project created successfully! All terms agreed.", time: "Just now", type: "system" }
    ])
    const [newMessage, setNewMessage] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([])
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
    const [showMilestoneDialog, setShowMilestoneDialog] = useState(false)
    const [showFileUpload, setShowFileUpload] = useState(false)
    const [projectSettings, setProjectSettings] = useState({
        notifications: true,
        autoApprove: false,
        publicView: false
    })
    
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Calculate project statistics
    const completedMilestones = project.milestones.filter(m => m.status === 'APPROVED').length
    const totalMilestones = project.milestones.length
    const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
    const totalBudget = project.milestones.reduce((sum, m) => sum + m.amount, 0)
    const earnedAmount = project.milestones
        .filter(m => m.status === 'APPROVED')
        .reduce((sum, m) => sum + m.amount, 0)

    const handleSendMessage = () => {
        if (!newMessage.trim()) return
        
        const msg = {
            id: messages.length + 1,
            sender: userRole === 'client' ? 'Client' : 'Freelancer',
            text: newMessage,
            time: "Just now",
            type: "user"
        }
        setMessages([...messages, msg])
        setNewMessage("")
        toast.success("Message sent")
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files) return

        Array.from(files).forEach(file => {
            const newFile: ProjectFile = {
                id: Date.now().toString(),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedBy: currentUserId,
                uploadedAt: new Date(),
                url: URL.createObjectURL(file)
            }
            setUploadedFiles(prev => [...prev, newFile])
        })
        
        toast.success(`${files.length} file(s) uploaded`)
        setShowFileUpload(false)
    }

    const handleMilestoneSubmit = (milestoneId: string, deliveryUrl: string) => {
        // Mock milestone submission
        toast.success("Milestone submitted for review")
        setSelectedMilestone(null)
    }

    const handleMilestoneApprove = (milestoneId: string) => {
        // Mock milestone approval
        toast.success("Milestone approved and payment released")
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'REVISION_REQUESTED': case 'IN_REVISION': return 'bg-amber-100 text-amber-800 border-amber-200'
            case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-slate-100 text-slate-800 border-slate-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle2 className="h-4 w-4" />
            case 'SUBMITTED': return <Clock className="h-4 w-4" />
            case 'REVISION_REQUESTED': case 'IN_REVISION': return <RefreshCw className="h-4 w-4" />
            case 'IN_PROGRESS': return <PlayCircle className="h-4 w-4" />
            case 'REJECTED': return <X className="h-4 w-4" />
            default: return <Target className="h-4 w-4" />
        }
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 p-6 bg-slate-50/50">
            {/* Left Sidebar - Project Info & Milestones */}
            <div className="lg:w-1/3 flex flex-col gap-6">
                {/* Project Header */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-xl font-bold line-clamp-2">{project.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                                        {project.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {project.deadline && `Due ${format(project.deadline, 'MMM dd, yyyy')}`}
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Progress Overview */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Project Progress</span>
                                <span className="text-muted-foreground">{completedMilestones}/{totalMilestones}</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">{progressPercentage.toFixed(0)}% complete</p>
                        </div>

                        {/* Budget Overview */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs font-medium text-blue-600">Total Budget</p>
                                <p className="text-lg font-bold text-blue-800">₹{totalBudget.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <p className="text-xs font-medium text-emerald-600">Earned</p>
                                <p className="text-lg font-bold text-emerald-800">₹{earnedAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Team</p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        C
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{project.client.name}</p>
                                        <p className="text-xs text-muted-foreground">Client</p>
                                    </div>
                                </div>
                                <div className="h-px bg-slate-200 flex-1" />
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        F
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{project.freelancer.name}</p>
                                        <p className="text-xs text-muted-foreground">Freelancer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Milestones */}
                <Card className="flex-1 flex flex-col border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                                Milestones
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                        {project.milestones.map((milestone, index) => (
                            <div
                                key={milestone.id}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                    selectedMilestone?.id === milestone.id
                                        ? 'border-blue-200 bg-blue-50'
                                        : 'border-slate-100 bg-white'
                                }`}
                                onClick={() => setSelectedMilestone(milestone)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium line-clamp-1">{milestone.title}</p>
                                            <p className="text-xs text-muted-foreground">₹{milestone.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(milestone.status)}`}>
                                        {getStatusIcon(milestone.status)}
                                        <span className="ml-1">{milestone.status.replace('_', ' ')}</span>
                                    </Badge>
                                </div>
                                
                                {milestone.dueDate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        Due {format(milestone.dueDate, 'MMM dd')}
                                    </div>
                                )}

                                {/* Milestone Actions */}
                                {userRole === 'freelancer' && milestone.status === 'PENDING' && (
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                                            Submit Work
                                        </Button>
                                    </div>
                                )}
                                
                                {userRole === 'client' && milestone.status === 'SUBMITTED' && (
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                                            Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs">
                                            Request Revision
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Files Section */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-slate-600" />
                                <CardTitle className="text-lg">Project Files</CardTitle>
                                <Badge variant="secondary">{uploadedFiles.length}</Badge>
                            </div>
                            <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-8">
                                        <Upload className="h-4 w-4 mr-1" />
                                        Upload
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Upload Files</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div
                                            className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-slate-300 transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                            <p className="text-sm font-medium">Drop files here or click to browse</p>
                                            <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {uploadedFiles.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No files uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {uploadedFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Chat/Activity Section */}
                <Card className="flex-1 flex flex-col border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="border-b bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Project Board</CardTitle>
                                <CardDescription>Chat, updates, and activity</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Bell className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'system' ? 'justify-center' : msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                                        msg.type === 'system'
                                            ? 'bg-slate-100 text-slate-600 text-center w-full max-w-none text-xs font-semibold uppercase tracking-wide py-2'
                                            : msg.sender === 'You'
                                                ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-200'
                                                : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'
                                    }`}
                                >
                                    {msg.type !== 'system' && (
                                        <p className="text-xs font-medium mb-1 opacity-70">{msg.sender}</p>
                                    )}
                                    {msg.text}
                                    <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>

                    <div className="p-4 bg-white border-t flex gap-3 items-center">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:bg-slate-100">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="Type a message..."
                        />
                        <Button 
                            className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
