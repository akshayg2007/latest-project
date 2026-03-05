"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Price } from "@/components/Price"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Pencil, Upload, ChevronRight, ImageIcon, PlusCircle, Loader2, X, Heart, MapPin, Globe, Link2, Plus, MessageSquare, ShieldAlert, ShieldOff, Clock, Flag, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExploreCard } from "@/components/ExploreCard"
import { ReportModal } from "@/components/ReportModal"
import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUploadThing } from "@/lib/uploadthing"
import { updateVisualIntro, updateAboutInfo, updateProfile, toggleFollow } from "@/app/actions/user"
import { startConversation } from "@/app/actions/chat"
import { deleteService } from "@/app/actions/deleteService"
import { deleteProduct } from "@/app/actions/deleteProduct"
import { deletePost, updatePost, getPostForEdit } from "@/app/actions/community"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { createPortal } from "react-dom"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createPortfolioItem } from "@/app/actions/portfolio"
import { FollowersPopup } from "@/components/FollowersPopup"

export interface ProfileUser {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    title: string
    isPro: boolean
    earned: number
    hired: number
    followers: number
    following: number
    score: number
    isOwnProfile: boolean
    isFollowing: boolean
    visualIntroUrl: string | null
    bio: string | null
    hourlyRate: string | null
    location: string | null
    skills: string[]
    tools: string[]
    languages: any[]
    externalLinks: string[]
    followerInfo: { username: string; avatarUrl: string | null }[]
    isBanned?: boolean
    banReason?: string | null
    suspendedUntil?: Date | null
    suspensionReason?: string | null
    isViewerAdmin?: boolean
}

export interface Service {
    id: string
    title: string
    description: string
    price: number
    category: string
    images: string[]
    tags: string[]
    tools: string[]
    deliveryTime?: number | null
    paymentFrequency?: string | null
    pricingMethod: string
    createdAt: Date
    updatedAt: Date
}

export interface PortfolioItem {
    id: string
    title: string | null
    mediaUrl: string
    skills: string[]
    tools: string[]
    link: string | null
    createdAt: Date
    // likes...
}

export interface Product {
    id: string
    name: string
    description: string
    category: string
    price: number
    images: string[]
    tags: string[]
    license: string
    createdAt: Date
    likesCount?: number
    isLiked?: boolean
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
    votes?: any[]
    _count?: {
        comments: number
    }
}

export interface Review {
    id: string
    rating: number
    comment: string
    createdAt: Date
    author: {
        username: string
        avatarUrl: string | null
    }
    serviceTitle?: string
}

interface ProfileClientProps {
    user: ProfileUser
    services: Service[]
    portfolioItems: PortfolioItem[]
    products: Product[]
    posts: Post[]
    reviews: Review[]
}

export function ProfileClient({ user, services, portfolioItems, products, posts, reviews }: ProfileClientProps) {
    const router = useRouter()
    const [availableToggle, setAvailableToggle] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [visualIntroUrl, setVisualIntroUrl] = useState<string | null>(user.visualIntroUrl)
    const [isFollowing, setIsFollowing] = useState(user.isFollowing)
    const [isConnecting, setIsConnecting] = useState(false)
    const searchParams = useSearchParams()
    const requestedTab = searchParams.get('tab')

    const [activeTab, setActiveTab] = useState(requestedTab || "work")

    // Update tab if URL param changes
    useEffect(() => {
        if (requestedTab) {
            setActiveTab(requestedTab)
        }
    }, [requestedTab])

    // Work Modal State
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false)

    // About Tab State
    const [isEditingBio, setIsEditingBio] = useState(false)
    const [bioText, setBioText] = useState(user.bio || "")
    const [isAddingLanguage, setIsAddingLanguage] = useState(false)
    const [isAddingLink, setIsAddingLink] = useState(false)
    const [newLanguage, setNewLanguage] = useState({ name: "", proficiency: "" })
    const [newLink, setNewLink] = useState("")
    const [isUpdatingAbout, setIsUpdatingAbout] = useState(false)
    const [isEditingRate, setIsEditingRate] = useState(false)
    const [rateValue, setRateValue] = useState(user.hourlyRate || "1500")

    // Basic Info Modal State
    const [isEditingBasic, setIsEditingBasic] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [isFollowersOpen, setIsFollowersOpen] = useState(false)
    const [basicForm, setBasicForm] = useState({
        avatarUrl: user.avatarUrl || "",
        title: user.title || ""
    })
    const [isUpdatingBasic, setIsUpdatingBasic] = useState(false)

    const handleSaveBasic = async () => {
        setIsUpdatingBasic(true)
        try {
            await updateProfile({
                avatarUrl: basicForm.avatarUrl,
                title: basicForm.title
            })
            toast.success("Profile updated")
            setIsEditingBasic(false)
        } catch (error) {
            toast.error("Failed to update profile")
        } finally {
            setIsUpdatingBasic(false)
        }
    }

    const [workForm, setWorkForm] = useState({
        title: "",
        skills: [] as string[],
        tools: [] as string[],
        link: "",
        image: null as File | null,
        imagePreview: null as string | null,
        isOriginal: false
    })
    const [skillInput, setSkillInput] = useState("")
    const [toolInput, setToolInput] = useState("")
    const [isPublishingWork, setIsPublishingWork] = useState(false)

    const { startUpload: uploadWorkImage } = useUploadThing("productImage") // Reusing image uploader

    // Delete Confirmation Popup State
    const [deletePopup, setDeletePopup] = useState<{
        isOpen: boolean
        type: 'service' | 'product' | 'post'
        id: string
        title: string
    } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const openDeletePopup = (type: 'service' | 'product' | 'post', id: string, title: string) => {
        setDeletePopup({ isOpen: true, type, id, title })
    }

    const handleConfirmDelete = async () => {
        if (!deletePopup) return
        setIsDeleting(true)
        try {
            let res: any
            if (deletePopup.type === 'service') {
                res = await deleteService(deletePopup.id)
            } else if (deletePopup.type === 'product') {
                res = await deleteProduct(deletePopup.id)
            } else {
                res = await deletePost(deletePopup.id)
            }
            if (res.success) {
                toast.success(`${deletePopup.type.charAt(0).toUpperCase() + deletePopup.type.slice(1)} deleted`)
                router.refresh()
            } else {
                toast.error(res.error || "Failed to delete")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsDeleting(false)
            setDeletePopup(null)
        }
    }

    const handleEditService = (serviceId: string) => {
        router.push(`/services/create?edit=${serviceId}`)
    }

    const handleEditProduct = (productId: string) => {
        router.push(`/dashboard/user/${user.username}/store/create?edit=${productId}`)
    }

    // Post Edit State
    const [editingPostId, setEditingPostId] = useState<string | null>(null)
    const [postEditForm, setPostEditForm] = useState<{ content: string } | null>(null)
    const [isUpdatingPost, setIsUpdatingPost] = useState(false)

    const handleEditPost = async (postId: string) => {
        try {
            const post = await getPostForEdit(postId)
            if (post) {
                setEditingPostId(postId)
                setPostEditForm({ content: post.content })
            }
        } catch (error) {
            toast.error("Failed to load post")
        }
    }

    const handleUpdatePost = async () => {
        if (!editingPostId || !postEditForm) return
        setIsUpdatingPost(true)
        try {
            const res = await updatePost(editingPostId, postEditForm)
            if (res.success) {
                toast.success("Post updated")
                setEditingPostId(null)
                setPostEditForm(null)
                router.refresh()
            } else {
                toast.error(res.error || "Failed to update")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsUpdatingPost(false)
        }
    }


    const handleSaveAbout = async (data: any) => {
        setIsUpdatingAbout(true)
        try {
            await updateAboutInfo(data)
            toast.success("Profile updated")
            setIsEditingBio(false)
            setIsEditingRate(false)
            setIsAddingLanguage(false)
            setIsAddingLink(false)
        } catch (error) {
            toast.error("Failed to update profile")
        } finally {
            setIsUpdatingAbout(false)
        }
    }

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            setWorkForm(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }))
            setSkillInput("")
        }
    }

    const handleAddTool = () => {
        if (toolInput.trim()) {
            setWorkForm(prev => ({ ...prev, tools: [...prev.tools, toolInput.trim()] }))
            setToolInput("")
        }
    }

    const handlePublishWork = async () => {
        if (!workForm.image) {
            toast.error("Please upload a cover image")
            return
        }
        if (!workForm.title) {
            toast.error("Please enter a title")
            return
        }
        if (!workForm.isOriginal) {
            toast.error("Please confirm this is your original work")
            return
        }

        setIsPublishingWork(true)
        try {
            // 1. Upload Image
            const uploadRes = await uploadWorkImage([workForm.image])
            if (!uploadRes?.[0]) {
                throw new Error("Failed to upload image")
            }
            const imageUrl = uploadRes[0].url

            // 2. Create in DB
            const result = await createPortfolioItem({
                title: workForm.title,
                mediaUrl: imageUrl,
                skills: workForm.skills,
                tools: workForm.tools,
                link: workForm.link
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Work published!")
                setIsWorkModalOpen(false)
                setWorkForm({
                    title: "",
                    skills: [],
                    tools: [],
                    link: "",
                    image: null,
                    imagePreview: null,
                    isOriginal: false
                })
                // Refresh logic is valid via server action revalidation, 
                // but client updates might need router.refresh() if not automatic
                // router.refresh() // If needed, import useRouter
            }
        } catch (error) {
            toast.error("Something went wrong")
            console.error(error)
        } finally {
            setIsPublishingWork(false)
        }
    }


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

    const isVideo = (url: string) => {
        return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm')
    }

    const isGif = (url: string) => {
        return url.toLowerCase().endsWith('.gif')
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
                                {/* ... (previous content remains same) ... */}
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
                                        {/* PRO Badge + Unlock */}
                                        {user.isPro && (
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-muted text-foreground tracking-wide">
                                                    PRO
                                                </span>
                                                {user.isOwnProfile && (
                                                    <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                                                        Unlock more with Pro <ChevronRight className="inline w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                        )}

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
                                        <p className="text-muted-foreground text-sm mt-0.5">{user.title}</p>

                                        {/* Action Button - Moved here below description */}
                                        {!user.isOwnProfile && (
                                            <div className="mt-4 flex items-center gap-2">
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
                                                {availableToggle ? "Available for work" : "User is offline"}
                                            </span>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={availableToggle}
                                                onClick={() => setAvailableToggle((v) => !v)}
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
                                                                                const uploadRes = await uploadWorkImage([file])
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

                                                    {/* Title Input */}
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Title / Headline</Label>
                                                        <Input
                                                            value={basicForm.title}
                                                            onChange={(e) => setBasicForm(prev => ({ ...prev, title: e.target.value }))}
                                                            placeholder="e.g. Web Developer"
                                                            className="rounded-xl h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-primary/20 transition-all"
                                                        />
                                                        <p className="text-[12px] text-slate-400">This appears below your name on your profile.</p>
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
                                        <p className="text-lg font-semibold text-foreground">
                                            <Price amount={user.earned} size="lg" />+
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">Earned</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-foreground">{user.hired}×</p>
                                        <p className="text-[11px] text-muted-foreground">Hired</p>
                                    </div>
                                    <div
                                        className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                                        onClick={() => setIsFollowersOpen(true)}
                                        title="View followers"
                                    >
                                        <p className="text-lg font-bold text-foreground">{user.followers}</p>
                                        <p className="text-[11px] text-muted-foreground">Followers</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-foreground flex items-center justify-center gap-0.5">
                                            {user.score}
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">Score</p>
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
                                                            Upload a short visual intro to show your skills.
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
                    defaultValue="work"
                    className="mt-8"
                    value={activeTab}
                    onValueChange={setActiveTab}
                >
                    <div className="flex items-center justify-between border-b border-border/40">
                        <TabsList className="h-auto p-0 bg-transparent rounded-none gap-1">
                            {["Work", "Services", "Store", "Posts", "Reviews", "About"].map((tab) => (
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
                                {activeTab === "work" && (
                                    <Dialog open={isWorkModalOpen} onOpenChange={setIsWorkModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-4 text-sm flex items-center gap-1.5"
                                            >
                                                <PlusCircle className="w-4 h-4" />
                                                Add Work
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
                                            <div className="flex flex-col h-full max-h-[90vh]">
                                                <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
                                                    <DialogTitle className="text-xl font-bold">Feature work on Profile</DialogTitle>
                                                </DialogHeader>

                                                <div className="flex-1 overflow-y-auto p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* LEFT: Cover Photo */}
                                                        <div className="space-y-2">
                                                            <Label className="font-bold text-base">Cover Photo</Label>
                                                            <div
                                                                className="aspect-square w-full rounded-xl bg-muted border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer group hover:bg-muted/80 transition-colors relative overflow-hidden"
                                                                onClick={() => document.getElementById('work-image-upload')?.click()}
                                                            >
                                                                {workForm.imagePreview ? (
                                                                    <img src={workForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="flex flex-col items-center text-muted-foreground">
                                                                        <div className="w-16 h-16 rounded-xl bg-background/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                                                            <ImageIcon className="w-8 h-8" />
                                                                        </div>
                                                                        <span className="font-medium text-lg">Preview</span>
                                                                    </div>
                                                                )}

                                                                <input
                                                                    id="work-image-upload"
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0]
                                                                        if (file) {
                                                                            setWorkForm(prev => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }))
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* RIGHT: Form Fields */}
                                                        <div className="space-y-6">
                                                            <div className="space-y-2">
                                                                <Label className="font-bold">Title</Label>
                                                                <Input
                                                                    placeholder="Describe Your work in two lines"
                                                                    className="h-11"
                                                                    value={workForm.title}
                                                                    onChange={(e) => setWorkForm(prev => ({ ...prev, title: e.target.value }))}
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="font-bold">Skills</Label>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Add Skills used"
                                                                        className="h-11"
                                                                        value={skillInput}
                                                                        onChange={(e) => setSkillInput(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                                                    />
                                                                    <Button onClick={handleAddSkill} className="h-11 bg-foreground text-background shrink-0">Add</Button>
                                                                </div>
                                                                {workForm.skills.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {workForm.skills.map((skill, i) => (
                                                                            <span key={i} className="text-xs font-semibold px-2 py-1 bg-muted rounded-md flex items-center gap-1">
                                                                                {skill}
                                                                                <X className="w-3 h-3 cursor-pointer" onClick={() => setWorkForm(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }))} />
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="font-bold">Tools</Label>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Add tools used"
                                                                        className="h-11"
                                                                        value={toolInput}
                                                                        onChange={(e) => setToolInput(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTool()}
                                                                    />
                                                                    <Button onClick={handleAddTool} className="h-11 bg-foreground text-background shrink-0">Add</Button>
                                                                </div>
                                                                {workForm.tools.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {workForm.tools.map((tool, i) => (
                                                                            <span key={i} className="text-xs font-semibold px-2 py-1 bg-muted rounded-md flex items-center gap-1">
                                                                                {tool}
                                                                                <X className="w-3 h-3 cursor-pointer" onClick={() => setWorkForm(prev => ({ ...prev, tools: prev.tools.filter((_, idx) => idx !== i) }))} />
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="font-bold">Completed work link <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                                                <Input
                                                                    placeholder="Enter link to project or deliverable"
                                                                    className="h-11"
                                                                    value={workForm.link}
                                                                    onChange={(e) => setWorkForm(prev => ({ ...prev, link: e.target.value }))}
                                                                />
                                                            </div>

                                                            <div className="flex items-center space-x-2 pt-2">
                                                                <Checkbox
                                                                    id="original-work"
                                                                    checked={workForm.isOriginal}
                                                                    onCheckedChange={(c) => setWorkForm(prev => ({ ...prev, isOriginal: c === true }))}
                                                                />
                                                                <Label htmlFor="original-work" className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                    I confirm this is my original work
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <DialogFooter className="px-6 py-4 border-t border-border flex !justify-between gap-4">
                                                    <Button
                                                        variant="outline"
                                                        className="h-11 px-8 rounded-full border-border font-bold text-foreground hover:bg-muted"
                                                        onClick={() => document.getElementById('work-image-upload')?.click()}
                                                    >
                                                        Upload
                                                    </Button>
                                                    <Button
                                                        className="h-11 px-10 rounded-full bg-black hover:bg-black/90 text-white font-bold"
                                                        disabled={isPublishingWork}
                                                        onClick={handlePublishWork}
                                                    >
                                                        {isPublishingWork ? (
                                                            <div className="flex items-center gap-2">
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Publishing...
                                                            </div>
                                                        ) : "Publish"}
                                                    </Button>
                                                </DialogFooter>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                                {activeTab === "services" && (
                                    <Link href="/services/create">
                                        <Button
                                            className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-4 text-sm flex items-center gap-1.5"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            Add Service
                                        </Button>
                                    </Link>
                                )}
                                {activeTab === "store" && (
                                    <Link href={`/dashboard/user/${user.username}/store/create`}>
                                        <Button
                                            size="sm"
                                            className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-4 text-sm flex items-center gap-1.5"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            Add Product
                                        </Button>
                                    </Link>
                                )}
                                {activeTab === "posts" && (
                                    <Link href="/dashboard/community/create">
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

                    {/* Work Tab */}
                    <TabsContent value="work" className="mt-8">
                        {portfolioItems && portfolioItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                                {portfolioItems.map((item) => (
                                    <Link
                                        href={`/dashboard/user/${user.username}/work/${item.id}`}
                                        key={item.id}
                                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-pointer hover:shadow-lg transition-all"
                                    >
                                        {/* Image */}
                                        <Image
                                            src={item.mediaUrl}
                                            alt={item.title || "Work"}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Overlay Gradient - Only on Hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Content - Only on Hover */}
                                        <div className="absolute bottom-0 left-0 w-full p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 text-white">
                                            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                                                {item.title}
                                            </h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/60 bg-muted/30 py-16 px-8">
                                <div className="text-center max-w-md mx-auto">
                                    <h2 className="text-xl font-bold text-foreground mb-2">
                                        {user.isOwnProfile ? "Feature your work" : "No work featured yet"}
                                    </h2>
                                    <p className="text-muted-foreground text-sm mb-6">
                                        {user.isOwnProfile
                                            ? "Share quick snapshots of what you've been working on."
                                            : "This user hasn't shared any work samples yet."}
                                    </p>
                                    {user.isOwnProfile && (
                                        <Button
                                            className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium px-5 transition-all"
                                            onClick={() => setIsWorkModalOpen(true)}
                                        >
                                            Add your work
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="services" className="mt-8">
                        {services.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {/* CARD SIZE: Change 'xl:grid-cols-3' above to adjust card width (e.g. 2 for wider, 4 for thinner) */}
                                {services.map((service, index) => (
                                    <div key={service.id} className="flex justify-center h-fit">
                                        {/* CARD SIZE: The height is set to 'h-fit' to hug the content. Change to a fixed px value if needed. */}
                                        <div className="w-[100%] h-full">
                                            <div className="relative group/card">
                                                <ExploreCard
                                                    index={index}
                                                    hideLike={user.isOwnProfile}
                                                    item={{
                                                        id: service.id,
                                                        type: 'SERVICE',
                                                        title: service.title,
                                                        description: service.description || "",
                                                        category: service.category || "",
                                                        price: service.price,
                                                        images: service.images,
                                                        createdAt: service.createdAt.toISOString(),
                                                        tools: service.tools,
                                                        skills: service.tags,
                                                        revisions: service.revisions,
                                                        paymentFrequency: service.paymentFrequency,
                                                        pricingMethod: service.pricingMethod,
                                                        seller: {
                                                            username: user.username,
                                                            avatarUrl: user.avatarUrl
                                                        }
                                                    }}
                                                />
                                                {user.isOwnProfile && (
                                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                                        <Button
                                                            size="icon"
                                                            variant="secondary"
                                                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleEditService(service.id)
                                                            }}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm border-none"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                openDeletePopup('service', service.id, service.title)
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/60 bg-muted/30 py-16 px-8">
                                <div className="text-center max-w-md mx-auto">
                                    <h2 className="text-xl font-bold text-foreground mb-2">
                                        {user.isOwnProfile ? "Add your first service" : "No services yet"}
                                    </h2>
                                    <p className="text-muted-foreground text-sm mb-6">
                                        {user.isOwnProfile
                                            ? "The clearer the service, the faster you'll get hired."
                                            : "Check back later for available services."}
                                    </p>
                                    {user.isOwnProfile && (
                                        <div className="flex justify-center">
                                            <Link href="/services/create">
                                                <Button className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-5 flex items-center gap-2 transition-all">
                                                    <PlusCircle className="w-4 h-4" />
                                                    Create Service
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="store" className="mt-8">
                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {/* CARD SIZE: Change 'xl:grid-cols-3' above to adjust card width (e.g. 2 for wider, 4 for thinner) */}
                                {products.map((product, index) => (
                                    <div key={product.id} className="flex justify-center h-fit">
                                        {/* CARD SIZE: The height is set to 'h-fit' to hug the content. Change to a fixed px value if needed. */}
                                        <div className="w-[100%] h-full">
                                            <div className="relative group/card">
                                                <ExploreCard
                                                    index={index}
                                                    hideLike={user.isOwnProfile}
                                                    item={{
                                                        id: product.id,
                                                        type: 'PRODUCT',
                                                        title: product.name,
                                                        description: product.description || "",
                                                        category: product.category || "",
                                                        price: product.price,
                                                        images: product.images,
                                                        createdAt: product.createdAt.toISOString(),
                                                        license: product.license,
                                                        likesCount: product.likesCount,
                                                        seller: {
                                                            username: user.username,
                                                            avatarUrl: user.avatarUrl
                                                        }
                                                    }}
                                                />
                                                {user.isOwnProfile && (
                                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                                        <Button
                                                            size="icon"
                                                            variant="secondary"
                                                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleEditProduct(product.id)
                                                            }}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm border-none"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                openDeletePopup('product', product.id, product.name)
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/60 bg-muted/30 py-16 px-8">
                                <div className="text-center max-w-md mx-auto">
                                    <h2 className="text-xl font-bold text-foreground mb-2">
                                        {user.isOwnProfile ? "Add your first product" : "No items in store yet"}
                                    </h2>
                                    <p className="text-muted-foreground text-sm mb-6">
                                        {user.isOwnProfile
                                            ? "Well-presented products get discovered and sold faster."
                                            : "This user hasn't added any products to their store yet."}
                                    </p>
                                    {user.isOwnProfile && (
                                        <div className="flex justify-center">
                                            <Link href={`/dashboard/user/${user.username}/store/create`}>
                                                <Button className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-6 flex items-center gap-2 transition-all">
                                                    <PlusCircle className="w-4 h-4" />
                                                    Create Product
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="posts" className="mt-8">
                        {posts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {posts.map((post, index) => (
                                    <div key={post.id} className="relative group/card">
                                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border-2 border-slate-100">
                                                        <AvatarImage src={user.avatarUrl || ""} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-bold">
                                                            {user.username?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{user.username}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-700 leading-relaxed mb-4 line-clamp-4">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
                                                <div className="flex items-center gap-4">
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span>{post._count?.comments || 0} Comments</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Heart className="w-4 h-4" />
                                                    <span>{post.votes?.length || 0} Likes</span>
                                                </div>
                                            </div>
                                        </div>
                                        {user.isOwnProfile && (
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200"
                                                    onClick={() => handleEditPost(post.id)}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm border-none"
                                                    onClick={() => openDeletePopup('post', post.id, post.title || 'this post')}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
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
                                            <Link href="/dashboard/community/create">
                                                <Button className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-medium h-9 px-6 transition-all">
                                                    <PlusCircle className="w-4 h-4" />
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-white rounded-[24px] border border-[#F0F0F0] p-8 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-slate-50">
                                                    <AvatarImage src={review.author.avatarUrl || ""} />
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                                        {review.author.username.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">@{review.author.username}</h4>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={cn(
                                                                    "w-3.5 h-3.5",
                                                                    i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-100"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[13px] font-medium text-slate-400">
                                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                                                <p className="text-slate-600 text-[15px] leading-relaxed italic">
                                                    "{review.comment}"
                                                </p>
                                            </div>

                                            {review.serviceTitle && (
                                                <div className="flex items-center gap-2 group/service">
                                                    <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {review.serviceTitle === "Client Review" ? "Client Review" : `For: ${review.serviceTitle}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[32px] border border-[#F0F0F0] bg-white py-20 px-8 text-center shadow-sm">
                                <div className="max-w-md mx-auto">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                        <Star className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                        {user.isOwnProfile ? "No reviews yet" : "Zero feedback"}
                                    </h2>
                                    <p className="text-slate-400 text-lg">
                                        {user.isOwnProfile
                                            ? "Client feedback will appear here after you complete your first few orders."
                                            : "This user hasn't received any reviews yet. Be the first to work with them!"}
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
                                                {user.title}
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
                                                {user.bio ? (
                                                    <div className="group relative">
                                                        <p className="text-slate-600 text-[17px] leading-relaxed max-w-[90%] whitespace-pre-wrap">
                                                            {user.bio}
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

                                {/* Right Column: Stats & Meta */}
                                <div className="lg:col-span-6 space-y-10 lg:pl-10 border-l border-[#F8F8F8] lg:border-l-0 lg:ml-0">
                                    {/* Rate */}
                                    <div className="space-y-3">
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none">Rate</p>
                                        <div className="flex items-center gap-3">
                                            {isEditingRate ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                                                        <Input
                                                            type="number"
                                                            value={rateValue}
                                                            onChange={(e) => setRateValue(e.target.value)}
                                                            className="w-32 pl-7 h-10 rounded-xl border-slate-200 focus:ring-primary/20 font-bold"
                                                        />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="rounded-xl px-4 h-10 bg-black hover:bg-black/90 text-white"
                                                        onClick={() => handleSaveAbout({ hourlyRate: rateValue })}
                                                        disabled={isUpdatingAbout}
                                                    >
                                                        {isUpdatingAbout ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="rounded-xl h-10 px-2 text-slate-400"
                                                        onClick={() => { setIsEditingRate(false); setRateValue(user.hourlyRate || "1500"); }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="group flex items-center gap-2">
                                                    <div className="flex items-baseline gap-1">
                                                        <Price
                                                            amount={parseInt(user.hourlyRate || "1500")}
                                                            size="xl"
                                                            suppressConversion
                                                            className="text-[24px] text-[#107c10]"
                                                        />
                                                        <span className="text-[16px] font-medium text-slate-400">/Hr</span>
                                                    </div>
                                                    {user.isOwnProfile && (
                                                        <button
                                                            onClick={() => setIsEditingRate(true)}
                                                            className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-primary"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div className="space-y-4">
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none">Skills & Tools</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(user.skills.length > 0 ? user.skills : ["Deadline Management", "Frontend Development", "UI Implementation", "Clear Communication"]).slice(0, 4).map((skill, idx) => (
                                                <div key={idx} className="px-5 py-2 rounded-full bg-[#F5F5F5] text-slate-700 text-[14px] font-medium border border-transparent hover:border-slate-200 transition-colors">
                                                    {skill}
                                                </div>
                                            ))}
                                            {user.skills.length > 4 && (
                                                <div className="px-3 py-2 rounded-full bg-[#F5F5F5] text-slate-400 text-[14px] font-bold">
                                                    +{user.skills.length - 4}
                                                </div>
                                            )}
                                            {!user.skills.length && (
                                                <div className="px-3 py-2 rounded-full bg-[#F5F5F5] text-slate-400 text-[14px] font-bold">
                                                    4+
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-5">
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none">Details</p>

                                        <div className="space-y-4">
                                            {/* Location */}
                                            <div className="flex items-center gap-4 group">
                                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <span className="text-[17px] font-medium text-slate-700">{user.location || "Mumbai, India"}</span>
                                            </div>

                                            {/* Languages */}
                                            <div className="space-y-4">
                                                {user.languages.map((lang: any, idx) => (
                                                    <div key={idx} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-slate-900">
                                                                <MessageSquare className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[17px] font-medium text-slate-900">{lang.proficiency} in {lang.name}</span>
                                                        </div>
                                                        {user.isOwnProfile && idx === 0 && !isAddingLanguage && (
                                                            <button
                                                                onClick={() => setIsAddingLanguage(true)}
                                                                className="text-slate-300 hover:text-primary transition-colors"
                                                            >
                                                                <PlusCircle className="w-7 h-7 stroke-[1px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {user.languages.length === 0 && user.isOwnProfile && !isAddingLanguage && (
                                                    <div className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-slate-900">
                                                                <MessageSquare className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[17px] font-medium text-slate-400 italic">Add language</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setIsAddingLanguage(true)}
                                                            className="text-slate-300 hover:text-primary transition-colors"
                                                        >
                                                            <PlusCircle className="w-7 h-7 stroke-[1px]" />
                                                        </button>
                                                    </div>
                                                )}

                                                {isAddingLanguage && (
                                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4 text-left">
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-bold text-slate-500">Language</h4>
                                                            <Select onValueChange={(v) => setNewLanguage(prev => ({ ...prev, name: v }))}>
                                                                <SelectTrigger className="bg-white rounded-xl border-slate-200 h-11 focus:ring-primary/20">
                                                                    <SelectValue placeholder="Select language" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-slate-200">
                                                                    <SelectItem value="English">English</SelectItem>
                                                                    <SelectItem value="Hindi">Hindi</SelectItem>
                                                                    <SelectItem value="Marathi">Marathi</SelectItem>
                                                                    <SelectItem value="Spanish">Spanish</SelectItem>
                                                                    <SelectItem value="French">French</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <Select onValueChange={(v) => setNewLanguage(prev => ({ ...prev, proficiency: v }))}>
                                                                <SelectTrigger className="bg-white rounded-xl border-slate-200 h-11 focus:ring-primary/20">
                                                                    <SelectValue placeholder="Select proficiency" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-slate-200">
                                                                    <SelectItem value="Native">Native</SelectItem>
                                                                    <SelectItem value="Fluent">Fluent</SelectItem>
                                                                    <SelectItem value="Conversational">Conversational</SelectItem>
                                                                    <SelectItem value="Basic">Basic</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" className="rounded-full px-4 h-9 font-bold" onClick={() => setIsAddingLanguage(false)}>Cancel</Button>
                                                            <Button
                                                                size="sm"
                                                                className="rounded-full px-6 h-9 bg-black hover:bg-black/90 text-white font-bold"
                                                                onClick={() => {
                                                                    if (newLanguage.name && newLanguage.proficiency) {
                                                                        handleSaveAbout({ languages: [...user.languages, newLanguage] })
                                                                    }
                                                                }}
                                                                disabled={isUpdatingAbout}
                                                            >
                                                                {isUpdatingAbout ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* External Links */}
                                            <div className="space-y-4">
                                                {user.externalLinks.map((link, idx) => (
                                                    <div key={idx} className="flex items-center justify-between group">
                                                        <a href={link} target="_blank" className="flex items-center gap-4 flex-1">
                                                            <div className="text-slate-900">
                                                                <Link2 className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[17px] font-medium text-blue-600 hover:underline line-clamp-1">{link}</span>
                                                        </a>
                                                        {user.isOwnProfile && idx === 0 && !isAddingLink && (
                                                            <button
                                                                onClick={() => setIsAddingLink(true)}
                                                                className="text-slate-300 hover:text-primary transition-colors"
                                                            >
                                                                <PlusCircle className="w-7 h-7 stroke-[1px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {user.externalLinks.length === 0 && user.isOwnProfile && !isAddingLink && (
                                                    <div className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-slate-900">
                                                                <Link2 className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[17px] font-medium text-slate-400 italic">Add link</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setIsAddingLink(true)}
                                                            className="text-slate-300 hover:text-primary transition-colors"
                                                        >
                                                            <PlusCircle className="w-7 h-7 stroke-[1px]" />
                                                        </button>
                                                    </div>
                                                )}

                                                {isAddingLink && (
                                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4 text-left">
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-bold text-slate-500">External Links</h4>
                                                            <Input
                                                                placeholder="Paste link"
                                                                className="bg-white rounded-xl border-slate-200 h-11 focus:ring-primary/20"
                                                                value={newLink}
                                                                onChange={(e) => setNewLink(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" className="rounded-full px-4 h-9 font-bold" onClick={() => setIsAddingLink(false)}>Cancel</Button>
                                                            <Button
                                                                size="sm"
                                                                className="rounded-full px-6 h-9 bg-black hover:bg-black/90 text-white font-bold"
                                                                onClick={() => {
                                                                    if (newLink) {
                                                                        handleSaveAbout({ externalLinks: [...user.externalLinks, newLink] })
                                                                        setNewLink("")
                                                                    }
                                                                }}
                                                                disabled={isUpdatingAbout}
                                                            >
                                                                {isUpdatingAbout ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs >
            </div >
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

            {/* Post Edit Modal */}
            <Dialog open={!!editingPostId} onOpenChange={() => setEditingPostId(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>
                    {postEditForm && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="content">Post Content</Label>
                                <Textarea
                                    id="content"
                                    value={postEditForm.content}
                                    onChange={(e) => setPostEditForm({ content: e.target.value })}
                                    placeholder="What's on your mind?"
                                    className="min-h-[150px]"
                                />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" onClick={() => setEditingPostId(null)}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    onClick={handleUpdatePost}
                                    disabled={isUpdatingPost}
                                    className="min-w-[120px]"
                                >
                                    {isUpdatingPost ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {isUpdatingPost ? "Updating..." : "Update Post"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Popup */}
            {deletePopup && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setDeletePopup(null)
                    }}
                >
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-100 scale-100 animate-in zoom-in-95 duration-200 mx-4">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete {deletePopup.type}?</h3>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                                Are you sure you want to delete <span className="font-semibold text-slate-700">"{deletePopup.title}"</span>? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full border-slate-200 h-11 hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs uppercase tracking-widest"
                                onClick={() => setDeletePopup(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>

                            <Button
                                className="flex-1 rounded-full bg-red-500 text-white hover:bg-red-600 h-11 shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Delete"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
