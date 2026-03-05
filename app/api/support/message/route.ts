import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sendSupportMessage } from "@/app/actions/support"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const ticketId = formData.get("ticketId") as string
        const text = formData.get("text") as string

        if (!ticketId || !text) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const result = await sendSupportMessage(ticketId, text)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Support message API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
