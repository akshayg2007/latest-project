import { db } from "./db";

export type CredibilityAction =
    | "ORDER_COMPLETED"
    | "PROJECT_COMPLETED"
    | "ON_TIME_DELIVERY"
    | "PRODUCT_SOLD"
    | "SELLER_CANCELLED"
    | "DISPUTE_WON"
    | "DISPUTE_LOST"
    | "REVIEW_5_STAR"
    | "REVIEW_4_STAR"
    | "REVIEW_LOW_RATING"
    | "CONTENT_REMOVED"
    | "FALSE_REPORT"
    | "USER_BANNED";

const SCORE_CHANGES: Record<CredibilityAction, number> = {
    ORDER_COMPLETED: 5,
    PROJECT_COMPLETED: 8, // Jobs/Projects are bigger
    ON_TIME_DELIVERY: 2,
    PRODUCT_SOLD: 1,
    SELLER_CANCELLED: -15,
    DISPUTE_WON: 5,
    DISPUTE_LOST: -15,
    REVIEW_5_STAR: 2,
    REVIEW_4_STAR: 1,
    REVIEW_LOW_RATING: -15,
    CONTENT_REMOVED: -20,
    FALSE_REPORT: -5,
    USER_BANNED: -50,
};

export async function updateCredibility(userId: string, action: CredibilityAction) {
    const points = SCORE_CHANGES[action];

    // Fetch current stats to update rates
    const stats = await db.credibilityScore.findUnique({
        where: { userId },
    });

    const isPositiveCompletion = action === "ORDER_COMPLETED" || action === "PROJECT_COMPLETED";
    const isCancellation = action === "SELLER_CANCELLED";
    const isOnTime = action === "ON_TIME_DELIVERY";

    // Calculate new stats
    const completedJobsIncrement = isPositiveCompletion ? 1 : 0;

    // We can't easily calculate rates without history, but we can do simple moving averages or increments
    // For now, let's just update the score and basic counts.

    return await db.credibilityScore.upsert({
        where: { userId },
        create: {
            userId,
            score: 50 + points,
            completedJobs: completedJobsIncrement,
        },
        update: {
            score: { increment: points },
            completedJobs: { increment: completedJobsIncrement },
            // If it was an on-time delivery, we could update onTimeDelivery rate
            // but that requires knowing total deliveries. For now, let's keep it simple
            // and just update the score.
        },
    });
}

/**
 * Advanced update that calculates rates based on actual data
 */
export async function refreshUserCredibility(userId: string) {
    // 1. Get all orders
    const orders = await db.order.findMany({
        where: { sellerId: userId },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === "COMPLETED").length;
    const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length;

    // 2. Calculate completion rate
    const completionRate = totalOrders > 0
        ? Math.round((completedOrders / (completedOrders + cancelledOrders)) * 100)
        : 100;

    // 3. Calculate on-time delivery
    const completedOnTime = orders.filter(o =>
        o.status === "COMPLETED" &&
        o.deadline &&
        o.createdAt.getTime() <= o.deadline.getTime() // This is a bit simplified
    ).length;

    const onTimeDelivery = completedOrders > 0
        ? Math.round((completedOnTime / completedOrders) * 100)
        : 95;

    return await db.credibilityScore.upsert({
        where: { userId },
        create: {
            userId,
            completionRate,
            onTimeDelivery,
            completedJobs: completedOrders,
        },
        update: {
            completionRate,
            onTimeDelivery,
            completedJobs: completedOrders,
        },
    });
}
