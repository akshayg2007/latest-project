"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { toggleSaveService } from "@/app/actions/savedServices"

interface SaveServiceButtonProps {
    serviceId: string
    initialSaved: boolean
    variant?: "default" | "icon"
}

export function SaveServiceButton({ serviceId, initialSaved, variant = "default" }: SaveServiceButtonProps) {
    const [isSaved, setIsSaved] = useState(initialSaved)
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(async () => {
            try {
                const result = await toggleSaveService(serviceId)
                setIsSaved(result.saved)
            } catch (error) {
                console.error("Failed to toggle save:", error)
            }
        })
    }

    if (variant === "icon") {
        return (
            <Button
                variant="outline"
                size="icon"
                onClick={handleToggle}
                disabled={isPending}
                className={`h-10 w-10 ${isSaved ? "bg-blue-50 border-blue-200 text-blue-600" : ""}`}
            >
                <Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            onClick={handleToggle}
            disabled={isPending}
            className={`w-full ${isSaved ? "bg-blue-50 border-blue-200 text-blue-600" : ""}`}
        >
            <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
            {isPending ? "..." : isSaved ? "Saved" : "Save Service"}
        </Button>
    )
}
