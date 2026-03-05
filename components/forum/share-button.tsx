"use client"
import { Share2, Check } from "lucide-react"
import { useState } from "react"

export function ShareButton({ postId }: { postId: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault() // Don't click the card
    
    // Copy full URL
    const url = `${window.location.origin}/forum/${postId}`
    navigator.clipboard.writeText(url)
    
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // Reset after 2s
  }

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-1.5 text-slate-500 hover:bg-slate-100 px-2 py-1 rounded text-xs font-medium transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
      <span className={copied ? "text-green-600" : ""}>
        {copied ? "Copied!" : "Share"}
      </span>
    </button>
  )
}