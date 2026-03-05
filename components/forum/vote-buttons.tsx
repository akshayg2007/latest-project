"use client"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { castVote } from "@/app/actions/vote"
import { useTransition } from "react"
import { cn } from "@/lib/utils" // Shadcn utility

interface VoteButtonsProps {
  postId: string
  initialScore: number
  initialUserVote?: "UP" | "DOWN" | null // What the user voted previously
}

export function VoteButtons({ postId, initialScore, initialUserVote }: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition()

  // Helper to handle click
  const handleVote = (type: "UP" | "DOWN") => {
    startTransition(async () => {
      await castVote(postId, type)
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      
      {/* UP BUTTON */}
      <button 
        onClick={(e) => {
          e.preventDefault() // Stop clicking the card link
          handleVote("UP")
        }}
        disabled={isPending}
        className={cn(
          "p-1 rounded hover:bg-slate-100 transition-colors",
          initialUserVote === "UP" ? "text-orange-600 bg-orange-50" : "text-slate-400 hover:text-orange-500"
        )}
      >
        <ArrowBigUp className={cn("w-6 h-6", initialUserVote === "UP" && "fill-current")} />
      </button>

      {/* SCORE */}
      <span className={cn(
        "font-bold text-sm",
        initialUserVote === "UP" ? "text-orange-600" : 
        initialUserVote === "DOWN" ? "text-blue-600" : "text-slate-700"
      )}>
        {initialScore}
      </span>

      {/* DOWN BUTTON */}
      <button 
        onClick={(e) => {
          e.preventDefault() 
          handleVote("DOWN")
        }}
        disabled={isPending}
        className={cn(
          "p-1 rounded hover:bg-slate-100 transition-colors",
          initialUserVote === "DOWN" ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-500"
        )}
      >
        <ArrowBigDown className={cn("w-6 h-6", initialUserVote === "DOWN" && "fill-current")} />
      </button>
      
    </div>
  )
}