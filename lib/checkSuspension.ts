import { db } from "@/lib/db"

/**
 * Checks if a user is banned or currently suspended.
 * Returns an error message string if the user is restricted, or null if they are clear.
 */
export async function checkUserRestriction(userId: string): Promise<string | null> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            isBanned: true,
            banReason: true,
            suspendedUntil: true,
            suspensionReason: true,
        },
    })

    if (!user) return "User not found"

    if ((user as any).isBanned) {
        return `Your account has been permanently banned.${(user as any).banReason ? ` Reason: ${(user as any).banReason}` : ""}`
    }

    const suspendedUntil = (user as any).suspendedUntil
    if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
        const until = new Date(suspendedUntil).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
        })
        return `Your account is suspended until ${until}.${(user as any).suspensionReason ? ` Reason: ${(user as any).suspensionReason}` : ""}`
    }

    return null
}
