import { db } from "@/lib/db"

export async function logAdminAction(
    adminId: string,
    adminName: string,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
) {
    try {
        await db.adminAuditLog.create({
            data: {
                adminId,
                adminName,
                action,
                targetType: targetType || null,
                targetId: targetId || null,
                details: details || null,
            }
        })
    } catch (error) {
        console.error("Failed to log admin action:", error)
    }
}
