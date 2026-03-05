"use client"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { UserCircle, MessageSquare, ArrowBigUp, ArrowBigDown, Flag } from "lucide-react"
import { ReportModal } from "@/components/ReportModal"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addComment, castCommentVote } from "@/app/actions/forum"
import { cn } from "@/lib/utils"

interface CommentItemProps {
  comment: any // Using 'any' for simplicity, ideally define strict types
  currentUserId?: string
  postId: string
}

export function CommentItem({ comment, currentUserId, postId }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Calculate Votes
  const upvotes = comment.votes.filter((v: any) => v.type === 'UP').length
  const downvotes = comment.votes.filter((v: any) => v.type === 'DOWN').length
  const score = upvotes - downvotes
  const userVote = currentUserId ? comment.votes.find((v: any) => v.userId === currentUserId)?.type : null

  return (
    <div className="flex gap-3">
      {/* PFP Section */}
      <div className="shrink-0 mt-1">
        {comment.author.image ? (
          <img
            src={comment.author.image}
            alt="pfp"
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <UserCircle className="w-8 h-8 text-slate-300" />
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm text-slate-900">
              {comment.author.username || comment.author.name || "User"}
            </span>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(comment.createdAt))} ago
            </span>
          </div>
          <p className="text-sm text-slate-700">{comment.text}</p>
        </div>

        {/* Action Bar (Vote & Reply) */}
        <div className="flex items-center gap-4 mt-1 ml-1">

          {/* Vote Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => castCommentVote(comment.id, "UP")}
              className={cn("p-0.5 rounded hover:bg-slate-100", userVote === 'UP' ? "text-orange-600" : "text-slate-400")}
            >
              <ArrowBigUp className={cn("w-5 h-5", userVote === 'UP' && "fill-current")} />
            </button>
            <span className={cn("text-xs font-bold",
              userVote === 'UP' ? "text-orange-600" :
                userVote === 'DOWN' ? "text-blue-600" : "text-slate-500"
            )}>
              {score}
            </span>
            <button
              onClick={() => castCommentVote(comment.id, "DOWN")}
              className={cn("p-0.5 rounded hover:bg-slate-100", userVote === 'DOWN' ? "text-blue-600" : "text-slate-400")}
            >
              <ArrowBigDown className={cn("w-5 h-5", userVote === 'DOWN' && "fill-current")} />
            </button>
          </div>

          {/* Reply Button */}
          {currentUserId && (
            <>
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" /> Reply
              </button>

              {currentUserId !== comment.authorId && (
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Flag className="w-3 h-3" /> Report
                </button>
              )}
            </>
          )}
        </div>

        {/* Reply Form (Hidden until clicked) */}
        {isReplying && (
          <form action={addComment} className="mt-3 ml-2 pl-4 border-l-2 border-slate-200">
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="parentId" value={comment.id} />
            <Textarea
              name="text"
              placeholder={`Reply to ${comment.author.username}...`}
              className="min-h-[60px] mb-2 text-sm bg-white"
            />
            <div className="flex gap-2">
              <Button size="sm" type="submit" className="h-8 text-xs">Reply</Button>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setIsReplying(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Recursive Children (Replies to this comment) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-4">
            {comment.replies.map((reply: any) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                postId={postId}
              />
            ))}
          </div>
        )}
      </div>
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={comment.id}
        targetType="COMMENT"
        targetName="this comment"
      />
    </div>
  )
}