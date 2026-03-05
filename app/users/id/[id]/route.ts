import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const user = await db.user.findUnique({
        where: { id },
        select: { username: true }
    })

    if (!user) {
        return redirect("/dashboard/explore")
    }

    return redirect(`/users/${user.username}`)
}
