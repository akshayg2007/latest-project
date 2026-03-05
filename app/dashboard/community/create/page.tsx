"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPost } from "@/app/actions/forum"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    ChevronLeft,
    Loader2,
    Plus,
    X,
    UploadCloud
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/lib/uploadthing"
import { toast } from "sonner"
import { SmartEmbed } from "@/components/community/smart-embed"

type PostType = "text" | "image" | "link"

export default function CreatePostPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [postType, setPostType] = useState<PostType>("text")
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [mediaUrl, setMediaUrl] = useState<string | null>(null)
    const [detectedType, setDetectedType] = useState<"IMAGE" | "VIDEO" | null>(null)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [isUploading, setIsUploading] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")

    const { startUpload } = useUploadThing("communityPost", {
        onUploadBegin: () => {
            setIsUploading(true)
            setUploadProgress(0)
        },
        onUploadProgress: (p) => {
            setUploadProgress(p)
        },
        onClientUploadComplete: (res) => {
            setIsUploading(false)
            setUploadProgress(100)
            if (res?.[0]) {
                const url = res[0].url
                setMediaUrl(url)
                const isVideo = res[0].name.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/)
                setDetectedType(isVideo ? "VIDEO" : "IMAGE")
                toast.success(`${isVideo ? 'Video' : 'Image'} uploaded!`)
            }
        },
        onUploadError: (error: Error) => {
            setIsUploading(false)
            setUploadProgress(0)
            toast.error(`Upload failed: ${error.message}`)
        },
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await startUpload([file])
    }

    const handleAddTag = () => {
        const trimmedInput = tagInput.trim()
        if (trimmedInput && !tags.includes(trimmedInput)) {
            setTags([...tags, trimmedInput])
            setTagInput("")
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        formData.append("tags", tags.join(","))

        // Use detected type if it's an image/video tab
        const finalType = postType === "image"
            ? (detectedType || "IMAGE")
            : postType.toUpperCase()

        formData.append("postType", finalType)

        // Handle media vs link
        const finalMediaUrl = postType === "link"
            ? formData.get("linkUrl") as string
            : mediaUrl

        if (finalMediaUrl) {
            formData.append("mediaUrl", finalMediaUrl)
        }

        const result = await createPost(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-[750px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-8 h-8 text-black" />
                    </button>
                    <h1 className="text-[2.5rem] font-bold text-black tracking-tight flex items-center gap-3">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-slate-700 to-black">Create post</span>
                    </h1>
                </div>

                {/* Custom Tabs */}
                <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-[1.25rem] w-fit border border-slate-100">
                    <button
                        type="button"
                        onClick={() => setPostType("text")}
                        className={cn(
                            "px-6 py-2 text-sm font-semibold rounded-lg transition-all",
                            postType === "text"
                                ? "bg-white text-black shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Text
                    </button>
                    <button
                        type="button"
                        onClick={() => setPostType("image")}
                        className={cn(
                            "px-8 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
                            postType === "image"
                                ? "bg-white text-black shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Image or Video
                    </button>
                    <button
                        type="button"
                        onClick={() => setPostType("link")}
                        className={cn(
                            "px-6 py-2 text-sm font-semibold rounded-lg transition-all",
                            postType === "link"
                                ? "bg-white text-black shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Link
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Common Fields: Title */}
                    <div className="space-y-3">
                        <label className="text-xl font-bold text-black">Title</label>
                        <Input
                            name="title"
                            placeholder="Add a short title"
                            className="w-full h-14 bg-white border-slate-200 rounded-xl px-4 text-base focus-visible:ring-black"
                            required
                        />
                    </div>

                    {/* Post Type: Text */}
                    {postType === "text" && (
                        <div className="space-y-6">
                            {/* Body Section */}
                            <div className="space-y-3">
                                <label className="text-xl font-bold text-black">Body</label>
                                <Textarea
                                    name="content"
                                    placeholder="A clear and short description"
                                    className="min-h-[220px] bg-white border-slate-200 rounded-xl p-4 text-base focus-visible:ring-black resize-none"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Post Type: Image or Video */}
                    {postType === "image" && (
                        <div className="space-y-6">
                            {/* Media Upload Section */}
                            <div className="space-y-3">
                                <label className="text-xl font-bold text-black">Image or Video</label>
                                <div className="relative">
                                    {mediaUrl ? (
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                                            {detectedType === "VIDEO" || mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                <video
                                                    src={mediaUrl}
                                                    controls
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img src={mediaUrl} alt="Uploaded media" className="w-full h-full object-cover" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMediaUrl(null)
                                                    setDetectedType(null)
                                                }}
                                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all shadow-lg backdrop-blur-sm active:scale-95"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => !isUploading && document.getElementById('media-upload')?.click()}
                                            className={cn(
                                                "relative rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer group overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-8",
                                                isUploading ? "border-blue-100 bg-blue-50/10 cursor-wait" : "border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                                            )}
                                        >
                                            <input
                                                id="media-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*,video/*"
                                                onChange={handleFileChange}
                                                disabled={isUploading}
                                            />

                                            {!isUploading ? (
                                                <div className="flex flex-col items-center text-center space-y-4">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-100">
                                                        <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-black transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xl font-extrabold text-black tracking-tight">Click to upload media</p>
                                                        <p className="text-sm font-bold text-slate-400">Image (16MB) or Video (32MB)</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full max-w-[280px] space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <p className="text-lg font-black text-black">Uploading...</p>
                                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">Processing media</p>
                                                        </div>
                                                        <span className="text-2xl font-black text-black">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full bg-blue-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight">Keep this window open</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Body Section (Optional) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-1">
                                    <span className="text-xl font-bold text-black">Body</span>
                                    <span className="text-xl font-bold text-slate-400">(Optional)</span>
                                </div>
                                <Textarea
                                    name="content"
                                    placeholder="A clear and short description"
                                    className="min-h-[160px] bg-white border-slate-200 rounded-xl p-4 text-base focus-visible:ring-black resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tags Section (Common) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-1">
                            <span className="text-xl font-bold text-black">Add tags</span>
                            <span className="text-xl font-bold text-slate-400">(Optional)</span>
                        </div>

                        <div className="space-y-0 border border-slate-200 rounded-xl overflow-hidden focus-within:border-black transition-colors">
                            {/* Tags List */}
                            {tags.length > 0 && (
                                <div className="p-3 bg-white flex flex-wrap gap-2 border-b border-slate-100">
                                    {tags.map((tag, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 group cursor-pointer hover:border-slate-400 transition-colors"
                                            onClick={() => removeTag(tag)}
                                        >
                                            <span className="text-slate-400 group-hover:text-red-400 transition-colors">#</span>
                                            {tag}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tag Input Field */}
                            <div className="relative">
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddTag()
                                        }
                                    }}
                                    placeholder="Add or create a trend"
                                    className="w-full h-14 bg-white px-4 text-base focus:outline-none placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <Plus className="w-6 h-6 text-black" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {postType === "link" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xl font-bold text-black">Link</label>
                                <Input
                                    name="linkUrl"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="Paste a YouTube, Instagram, or Spotify link..."
                                    className="w-full h-14 bg-white border-slate-200 rounded-xl px-4 text-base focus-visible:ring-black"
                                    required
                                />
                            </div>

                            {/* Link Preview Section */}
                            {linkUrl && (
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Preview</p>
                                    <SmartEmbed url={linkUrl} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-600 font-medium px-4">
                            {error}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-8 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="h-14 px-10 rounded-full border-slate-200 text-base font-bold text-black hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-14 px-12 rounded-full bg-black hover:bg-black/90 text-white text-base font-bold shadow-lg transition-all active:scale-95 min-w-[140px]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Posting...
                                </div>
                            ) : (
                                "Post"
                            )}
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    )
}
