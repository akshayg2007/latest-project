"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Pencil, ChevronRight, ImageIcon, PlusCircle, Loader2, MapPin, Globe, MessageSquare, ShieldOff, Clock, Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReportModal } from "@/components/ReportModal"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useUploadThing } from "@/lib/uploadthing"
import { updateVisualIntro, updateClientInfo, updateProfile, toggleFollow, toggleOnlineStatus } from "@/app/actions/user"
import { startConversation } from "@/app/actions/chat"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FollowersPopup } from "@/components/FollowersPopup"

export interface ProfileBuyerUser {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    companyName: string | null
    isIndividual: boolean
    website: string | null
    location: string | null
    followers: number
    following: number
    score: number
    isOwnProfile: boolean
    isFollowing: boolean
    visualIntroUrl: string | null
    bio: string | null
    description: string | null
    createdAt: Date
    hired: number
    followerInfo: { username: string; avatarUrl: string | null }[]
    isOnline?: boolean
    isBanned?: boolean
    banReason?: string | null
    suspendedUntil?: Date | null
    suspensionReason?: string | null
    isViewerAdmin?: boolean
}

export interface Review {
    id: string
    rating: number
    comment: string
    createdAt: Date
    service: {
        title: string
        seller: {
            username: string
            avatarUrl: string | null
        }
    } | null
}

export interface Post {
    id: string
    title: string
    content: string
    createdAt: Date
    tags: string[]
    author: {
        username: string
        avatarUrl: string | null
    }
}

interface ProfileBuyerProps {
    user: ProfileBuyerUser
    posts: Post[]
    reviews: Review[]
}

export function ProfileBuyer({ user, posts, reviews }: ProfileBuyerProps) {
    const [availableToggle, setAvailableToggle] = useState(user.isOnline ?? false)
    const [isUploading, setIsUploading] = useState(false)
    const [visualIntroUrl, setVisualIntroUrl] = useState<string | null>(user.visualIntroUrl)
    const searchParams = useSearchParams()
    const requestedTab = searchParams.get('tab')

    const [activeTab, setActiveTab] = useState(requestedTab || "posts")

    useEffect(() => {
        if (requestedTab) {
            setActiveTab(requestedTab)
        }
    }, [requestedTab])

    const [isEditingBio, setIsEditingBio] = useState(false)
    const [bioText, setBioText] = useState(user.bio || user.description || "")
    const [isUpdatingAbout, setIsUpdatingAbout] = useState(false)

    // Basic Info Modal State
    const [isEditingBasic, setIsEditingBasic] = useState(false)
    const [basicForm, setBasicForm] = useState({
        avatarUrl: user.avatarUrl || "",
        companyName: user.companyName || ""
    })
    const [isUpdatingBasic, setIsUpdatingBasic] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [isFollowersOpen, setIsFollowersOpen] = useState(false)
    const { startUpload } = useUploadThing("visualIntro", {
        onClientUploadComplete: async (res) => {
            if (res?.[0]) {
                const url = res[0].url
                const result = await updateVisualIntro(url)
                if (result.success) {
                    setVisualIntroUrl(url)
                    toast.success("Visual intro updated!")
                }
            }
            setIsUploading(false)
        },
        onUploadError: (error) => {
            toast.error(`Upload failed: ${error.message}`)
            setIsUploading(false)
        },
        onUploadBegin: () => {
            setIsUploading(true)
        }
    })

    // Reuse productImage uploader for avatar
    const { startUpload: uploadAvatar } = useUploadThing("productImage")

    const handleSaveBasic = async () => {
        setIsUpdatingBasic(true)
        try {
            // Update Avatar
            if (basicForm.avatarUrl !== user.avatarUrl) {
                await updateProfile({
                    avatarUrl: basicForm.avatarUrl
                })
            }
            // Update Company Name
            if (basicForm.companyName !== user.companyName) {
                await updateClientInfo({
                    companyName: basicForm.companyName
                })
            }
            toast.success("Profile updated")
            setIsEditingBasic(false)
        } catch (error) {
            toast.error("Failed to update profile")
        } finally {
            setIsUpdatingBasic(false)
        }
    }

    const [isFollowing, setIsFollowing] = useState(user.isFollowing)

    const handleFollow = async () => {
        setIsFollowing(!isFollowing)
        try {
            await toggleFollow(user.id)
            toast.success(isFollowing ? "Unfollowed" : "Followed")
        } catch (error) {
            setIsFollowing(user.isFollowing) // Revert
            toast.error("Failed to update follow status")
        }
    }

    const handleConnect = async () => {
        setIsConnecting(true)
        try {
            await startConversation(user.id)
        } catch (error: any) {
            // Next.js redirect() throws a special error — let it propagate
            if (error?.digest?.startsWith("NEXT_REDIRECT")) {
                throw error
            }
            toast.error("Failed to start conversation")
        } finally {
            setIsConnecting(false)
        }
    }

    const handleSaveAbout = async (data: any) => {
        setIsUpdatingAbout(true)
        try {
            await updateClientInfo(data)
            toast.success("Profile updated")
            setIsEditingBio(false)
        } catch (error) {
            toast.error("Failed to update profile")
        } finally {
            setIsUpdatingAbout(false)
        }
    }

    const isVideo = (url: string) => {
        return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm')
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto pt-8 pb-12">

                {/* Profile Header Card */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

                            {/* Left: Avatar + Info + Stats */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-4">
                                    <div className="relative shrink-0">
                                        <Avatar className="h-25 w-25 rounded-full border-2 border-border">
                                            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
                                            <AvatarFallback className="text-xl font-semibold text-muted-foreground bg-muted">
                                                {user.displayName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className="min-w-0 flex-1 pt-1">
                                        {/* Status Badge */}
                                        <div className="mb-2">
                                            {user.isBanned ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 border border-red-200/50 shadow-sm">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                                    BANNED
                                                </span>
                                            ) : user.suspendedUntil && new Date(user.suspendedUntil) > new Date() ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 border border-amber-200/50 shadow-sm">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                    SUSPENDED
                                                </span>
                                            ) : availableToggle ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100/50 shadow-sm">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                    </span>
                                                    ONLINE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 border border-slate-200/50 shadow-sm">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                                    OFFLINE
                                                </span>
                                            )}
                                        </div>

                                        {/* Name + Title */}
                                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                            {user.displayName}
                                        </h1>
                                        <p className="text-muted-foreground text-sm mt-0.5">
                                            {user.companyName || (user.isIndividual ? "Hiring as an individual" : "Client")}
                                        </p>

                                        {/* Action Buttons - Moved here below description */}
                                        {!user.isOwnProfile && (
                                            <div className="flex items-center gap-2 mt-4">
                                                <Button
                                                    size="sm"
                                                    onClick={handleConnect}
                                                    disabled={isConnecting}
                                                    className="rounded-lg bg-black hover:bg-black/90 text-white font-medium h-9 px-4 text-sm gap-2"
                                                >
                                                    {isConnecting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <MessageSquare className="w-4 h-4" />
                                                    )}
                                                    Request to Connect
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-lg border-border bg-background text-foreground hover:bg-muted h-9 px-4 text-sm font-medium"
                                                    onClick={handleFollow}
                                                >
                                                    {isFollowing ? "Following" : "Follow"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setIsReportModalOpen(true)}
                                                    className="rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
                                                    title="Report User"
                                                >
                                                    <Flag className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons - Only for Owner */}
                                <div className="flex flex-wrap items-center gap-2.5 mt-5">
                                    {user.isOwnProfile && (
                                        <div className={cn(
                                            "flex items-center gap-2.5 px-4 h-9 rounded-full transition-all duration-300",
                                            availableToggle ? "bg-[#0052cc] text-white" : "bg-muted/50 text-muted-foreground border border-border/50"
                                        )}>
                                            <span className="text-[16px] font-semibold whitespace-nowrap">
                                                {availableToggle ? "Active Client" : "Not Hiring"}
                                            </span>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={availableToggle}
                                                onClick={async () => {
                                                    const newStatus = !availableToggle
                                                    setAvailableToggle(newStatus)
                                                    try {
                                                        await toggleOnlineStatus(newStatus)
                                                    } catch (error) {
                                                        setAvailableToggle(availableToggle)
                                                        toast.error("Failed to update status")
                                                    }
                                                }}
                                                className={cn(
                                                    "relative inline-flex h-[18px] w-6 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-0",
                                                    availableToggle ? "bg-white/30" : "bg-slate-300"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "pointer-events-none block h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform mt-[2px]",
                                                        availableToggle ? "translate-x-[16px]" : "translate-x-[2px]"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    )}

                                    {user.isOwnProfile && (
                                        <Dialog open={isEditingBasic} onOpenChange={setIsEditingBasic}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-lg gap-1.5 border-border bg-background text-foreground hover:bg-muted h-9 px-4 text-[14px] font-semibold"
                                                >
                                                    Edit Profile <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-bold">Edit Basic Info</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-6 mt-4">
                                                    {/* Avatar Upload */}
                                                    <div className="space-y-4">
                                                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Profile Picture</Label>
                                                        <div className="flex items-center gap-6">
                                                            <Avatar className="w-20 h-20 border-2 border-slate-100">
                                                                <AvatarImage src={basicForm.avatarUrl} />
                                                                <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const input = document.createElement('input')
                                                                        input.type = 'file'
                                                                        input.accept = 'image/*'
                                                                        input.onchange = async (e) => {
                                                                            const file = (e.target as HTMLInputElement).files?.[0]
                                                                            if (file) {
                                                                                const uploadRes = await uploadAvatar([file])
                                                                                if (uploadRes?.[0]) {
                                                                                    setBasicForm(prev => ({ ...prev, avatarUrl: uploadRes[0].url }))
                                                                                    toast.success("Avatar uploaded")
                                                                                }
                                                                            }
                                                                        }
                                                                        input.click()
                                                                    }}
                                                                    className="rounded-lg h-10 px-4"
                                                                >
                                                                    Change Picture
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Company Name Input */}
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Company / Display Name</Label>
                                                        <Input
                                                            value={basicForm.companyName}
                                                            onChange={(e) => setBasicForm(prev => ({ ...prev, companyName: e.target.value }))}
                                                            placeholder="Company Name"
                                                            className="rounded-xl h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-primary/20 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className="mt-8 gap-3 sm:gap-0">
                                                    <Button variant="ghost" onClick={() => setIsEditingBasic(false)} className="rounded-full px-6 font-bold h-11">Cancel</Button>
                                                    <Button
                                                        onClick={handleSaveBasic}
                                                        disabled={isUpdatingBasic}
                                                        className="rounded-full px-8 bg-black hover:bg-black/90 text-white font-bold h-11 min-w-[100px]"
                                                    >
                                                        {isUpdatingBasic ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center gap-6 mt-6 pt-5 border-t border-border/100">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-foreground">{user.hired}×</p>
                                        <p className="text-[11px] text-muted-foreground">Jobs Posted</p>
                                    </div>
                                    <div
                                        className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                                        onClick={() => setIsFollowersOpen(true)}
                                        title="View followers"
                                    >
                                        <p className="text-lg font-bold text-foreground">{user.followers}</p>
                                        <p className="text-[11px] text-muted-foreground">Followers</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Visual Intro Upload */}
                            <div className="lg:w-[400px] shrink-0">
                                <div className="h-full min-h-[200px] rounded-xl border-border bg-muted/30 flex flex-col items-center justify-center relative overflow-hidden group">
                                    {visualIntroUrl ? (
                                        <div className="w-full h-full absolute inset-0">
                                            {isVideo(visualIntroUrl) ? (
                                                <video
                                                    src={visualIntroUrl}
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={visualIntroUrl}
                                                    alt="Visual Intro"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}

                                            {user.isOwnProfile && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="h-8 rounded-lg text-[11px]"
                                                        onClick={() => {
                                                            const input = document.createElement('input')
                                                            input.type = 'file'
                                                            input.accept = 'image/*,video/*'
                                                            input.onchange = (e) => {
                                                                const file = (e.target as HTMLInputElement).files?.[0]
                                                                if (file) startUpload([file])
                                                            }
                                                            input.click()
                                                        }}
                                                    >
                                                        Change
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-8 rounded-lg text-[11px]"
                                                        onClick={async () => {
                                                            const result = await updateVisualIntro("")
                                                            if (result.success) {
                                                                setVisualIntroUrl(null)
                                                                toast.success("Visual intro removed")
                                                            }
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        user.isOwnProfile ? (
                                            <div
                                                className="p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl"
                                                onClick={() => {
                                                    const input = document.createElement('input')
                                                    input.type = 'file'
                                                    input.accept = 'image/*,video/*'
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0]
                                                        if (file) startUpload([file])
                                                    }
                                                    input.click()
                                                }}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                                                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-foreground mb-2 leading-snug">
                                                            Upload a short visual intro to show your culture.
                                                        </p>
                                                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                                                            <p>Max 16MB (images), 32MB (videos).</p>
                                                            <p>Supports PNG, JPG, GIF, MP4 in 4:3</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-border/40 rounded-xl bg-muted/10 opacity-40 italic text-xs">
                                                No visual intro provided
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ban / Suspension Status Banner */}
                {(user.isBanned || (user.suspendedUntil && new Date(user.suspendedUntil) > new Date())) && (
                    <div className={cn(
                        "mt-4 rounded-xl border px-5 py-4 flex items-start gap-3",
                        user.isBanned
                            ? "bg-red-50 border-red-200"
                            : "bg-amber-50 border-amber-200"
                    )}>
                        <div className={cn(
                            "shrink-0 mt-0.5 p-2 rounded-lg",
                            user.isBanned ? "bg-red-100" : "bg-amber-100"
                        )}>
                            {user.isBanned
                                ? <ShieldOff className="w-5 h-5 text-red-600" />
                                : <Clock className="w-5 h-5 text-amber-600" />
                            }
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={cn(
                                "text-sm font-bold",
                                user.isBanned ? "text-red-800" : "text-amber-800"
                            )}>
                                {user.isBanned ? "Account Permanently Banned" : "Account Temporarily Suspended"}
                            </p>
                            {user.isBanned && user.banReason && (
                                <p className="text-xs text-red-600 mt-1">
                                    <span className="font-semibold">Reason:</span> {user.banReason}
                                </p>
                            )}
                            {!user.isBanned && user.suspendedUntil && (
                                <>
                                    <p className="text-xs text-amber-600 mt-1">
                                        <span className="font-semibold">Suspended until:</span>{" "}
                                        {new Date(user.suspendedUntil).toLocaleDateString("en-US", {
                                            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </p>
                                    {user.suspensionReason && (
                                        <p className="text-xs text-amber-600 mt-0.5">
                                            <span className="font-semibold">Reason:</span> {user.suspensionReason}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <Tabs
                    defaultValue="posts"
                    className="mt-8"
                    value={activeTab}
                    onValueChange={setActiveTab}
                >
                    <div className="flex items-center justify-between border-b border-border/40">
                        <TabsList className="h-auto p-0 bg-transparent rounded-none gap-1">
                            {["Posts", "Reviews", "About"].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab.toLowerCase()}
                                    className="relative rounded-none border-0 bg-transparent px-4 py-3 text-sm font-medium transition-all text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-none group"
                                >
                                    {tab}
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 transition-transform duration-200 group-data-[state=active]:scale-x-100" />
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {user.isOwnProfile && (
                            <>
                                {activeTab === "posts" && (
                                    <Link href="/dashboard/community/feed">
                                        <Button
                                            size="sm"
                                            className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-4 text-sm flex items-center gap-1.5"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            Add Post
                                        </Button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <TabsContent value="posts" className="mt-8">
                        {posts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {posts.map((post) => (
                                    <div key={post.id} className="p-6 rounded-2xl border border-border bg-card">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={post.author.avatarUrl || ""} />
                                                <AvatarFallback>{post.author.username[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-sm">{post.author.username}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{post.content}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {post.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-muted rounded text-xs font-medium">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/60 bg-muted/30 py-16 px-8">
                                <div className="text-center max-w-md mx-auto">
                                    <h2 className="text-xl font-bold text-foreground mb-2">
                                        {user.isOwnProfile ? "Write your first post" : "No posts yet"}
                                    </h2>
                                    <p className="text-muted-foreground text-sm mb-6">
                                        {user.isOwnProfile
                                            ? "Share updates, tips, or stories with your audience."
                                            : "This user hasn't created any posts yet."}
                                    </p>
                                    {user.isOwnProfile && (
                                        <div className="flex justify-center">
                                            <Link href="/dashboard/community/feed">
                                                <Button className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-6 transition-all">
                                                    Create Post
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-8">
                        {reviews.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="p-6 rounded-2xl border border-border bg-card">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={cn(
                                                                    "w-4 h-4",
                                                                    i < review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="font-medium text-foreground mt-1">{review.comment}</p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Reviewed {review.service?.title ? `service "${review.service.title}"` : "work"} by {review.service?.seller.username || "Unknown"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/60 bg-muted/30 py-16 px-8">
                                <div className="text-center max-w-md mx-auto">
                                    <h2 className="text-xl font-bold text-foreground mb-2">
                                        No reviews given yet
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        {user.isOwnProfile
                                            ? "Reviews you give to freelancers will appear here."
                                            : "This user hasn't given any reviews yet."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="about" className="mt-8">
                        <div className="bg-white rounded-[32px] border border-[#F0F0F0] p-10 md:p-14 shadow-sm">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

                                {/* Left Column: Identity & Bio */}
                                <div className="lg:col-span-6 space-y-8">
                                    <div className="flex items-center gap-6">
                                        <Avatar className="h-24 w-24 rounded-full border-4 border-white shadow-lg ring-1 ring-slate-100">
                                            <AvatarImage src={user.avatarUrl || ""} />
                                            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary text-2xl font-bold">
                                                {user.displayName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h2 className="text-[28px] font-bold text-slate-900 leading-tight">
                                                {user.displayName}
                                            </h2>
                                            <p className="text-slate-400 text-lg font-medium">
                                                {user.companyName || (user.isIndividual ? "Hiring as an individual" : "Client")}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Followed By */}
                                    {user.followers > 0 && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {user.followerInfo.map((follower, i) => (
                                                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden ring-1 ring-slate-50">
                                                        <Avatar className="h-full w-full">
                                                            <AvatarImage src={follower.avatarUrl || ""} />
                                                            <AvatarFallback className="text-[10px] font-bold">
                                                                {follower.username.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[15px] font-medium text-slate-500">
                                                Followed by{" "}
                                                {user.followerInfo.length > 0 ? (
                                                    <>
                                                        <span className="text-slate-900">{user.followerInfo[0].username}</span>
                                                        {user.followerInfo.length > 1 && (
                                                            <>
                                                                , <span className="text-slate-900">{user.followerInfo[1].username}</span>
                                                            </>
                                                        )}
                                                        {user.followers > user.followerInfo.length && (
                                                            <> and {user.followers - user.followerInfo.length} more</>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-slate-900">{user.followers} {user.followers === 1 ? 'person' : 'people'}</span>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {/* Bio Section */}
                                    <div className="space-y-4">
                                        {isEditingBio ? (
                                            <div className="space-y-3">
                                                <Textarea
                                                    value={bioText}
                                                    onChange={(e) => setBioText(e.target.value)}
                                                    placeholder="Write a descriptive bio..."
                                                    className="min-h-[160px] rounded-2xl border-slate-200 focus:ring-primary/20 resize-none text-[16px] leading-relaxed p-4"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="rounded-full px-6" onClick={() => setIsEditingBio(false)}>Cancel</Button>
                                                    <Button size="sm" className="rounded-full px-6 bg-black hover:bg-black/90 text-white" onClick={() => handleSaveAbout({ bio: bioText })} disabled={isUpdatingAbout}>
                                                        {isUpdatingAbout ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {user.bio || user.description ? (
                                                    <div className="group relative">
                                                        <h3 className="font-bold text-lg mb-2">About</h3>
                                                        <p className="text-slate-600 text-[17px] leading-relaxed max-w-[90%] whitespace-pre-wrap">
                                                            {user.bio || user.description}
                                                        </p>
                                                        {user.isOwnProfile && (
                                                            <button
                                                                onClick={() => setIsEditingBio(true)}
                                                                className="absolute -top-1 -right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-primary"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    user.isOwnProfile && (
                                                        <Button
                                                            variant="outline"
                                                            className="rounded-full h-11 px-6 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 gap-2"
                                                            onClick={() => setIsEditingBio(true)}
                                                        >
                                                            <PlusCircle className="w-5 h-5" />
                                                            Add a descriptive bio
                                                        </Button>
                                                    )
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Details */}
                                <div className="lg:col-span-6 space-y-10 lg:pl-10 border-l border-[#F8F8F8] lg:border-l-0 lg:ml-0">
                                    <div className="space-y-5">
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none">Details</p>

                                        <div className="space-y-4">
                                            {/* Location */}
                                            <div className="flex items-center gap-4 group">
                                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <span className="text-[17px] font-medium text-slate-700">{user.location || "Add Location"}</span>
                                                {user.isOwnProfile && (
                                                    <button onClick={() => {
                                                        const newLoc = prompt("Enter location:", user.location || "")
                                                        if (newLoc !== null) handleSaveAbout({ location: newLoc })
                                                    }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary">
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Website */}
                                            <div className="flex items-center gap-4 group">
                                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                {user.website ? (
                                                    <a href={user.website} target="_blank" className="text-[17px] font-medium text-blue-600 hover:underline">{user.website}</a>
                                                ) : (
                                                    <span className="text-[17px] font-medium text-slate-400 italic">Add Website</span>
                                                )}
                                                {user.isOwnProfile && (
                                                    <button onClick={() => {
                                                        const newWeb = prompt("Enter website URL:", user.website || "")
                                                        if (newWeb !== null) handleSaveAbout({ website: newWeb })
                                                    }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary">
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetId={user.id}
                targetType="USER"
                targetName={`@${user.username}`}
            />
            <FollowersPopup
                isOpen={isFollowersOpen}
                onClose={() => setIsFollowersOpen(false)}
                followers={user.followerInfo}
                totalCount={user.followers}
            />
        </div>
    )
}
