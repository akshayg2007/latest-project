'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
    title: string
    url?: string
    className?: string
    children?: React.ReactNode
}

export function ShareButton({ title, url, className, children }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const shareUrl = url || window.location.href
        const shareData = {
            title: title,
            url: shareUrl,
        }

        // Try native share first (mobile)
        if (navigator.share && navigator.canShare?.(shareData)) {
            try {
                await navigator.share(shareData)
                return
            } catch (err) {
                // User cancelled or error - fall through to clipboard
                if ((err as Error).name === 'AbortError') return
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.success('Link copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Failed to copy link')
        }
    }

    return (
        <Button
            variant="ghost"
            size={children ? "default" : "icon"}
            className={cn(className, !children && "h-9 w-9")}
            onClick={handleShare}
        >
            {copied ? (
                <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {children && <span className="text-emerald-500">Copied</span>}
                </div>
            ) : (
                children || <Share2 className="h-4 w-4" />
            )}
        </Button>
    )
}
