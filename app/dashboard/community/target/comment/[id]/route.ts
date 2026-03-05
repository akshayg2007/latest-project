import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const comment = await db.comment.findUnique({
        where: { id },
        select: { postId: true }
    })

    if (!comment) {
        return redirect("/dashboard/community")
    }

    // Redirect to the post page and scroll to the comment
    return redirect(`/dashboard/community/${comment.postId}#comment-${id}`)
}
