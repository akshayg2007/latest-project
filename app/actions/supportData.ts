"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"

// Fetch user's orders (as buyer or seller)
export async function getUserOrders() {
    const session = await auth()
    if (!session?.user?.id) return []

    const orders = await db.order.findMany({
        where: {
            OR: [
                { buyerId: session.user.id },
                { sellerId: session.user.id },
            ]
        },
        include: {
            service: { select: { title: true } },
            product: { select: { name: true } },
            buyer: { select: { username: true } },
            seller: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
    })

    return orders.map(o => ({
        id: o.id,
        label: o.service?.title || o.product?.name || "Order",
        type: o.serviceId ? "Service" : "Product",
        status: o.status,
        price: o.price,
        date: o.createdAt.toISOString(),
        otherParty: o.buyerId === session.user!.id
            ? `@${o.seller.username}`
            : `@${o.buyer.username}`,
        role: o.buyerId === session.user!.id ? "Buyer" : "Seller",
    }))
}

// Fetch user's services (as seller)
export async function getUserServices() {
    const session = await auth()
    if (!session?.user?.id) return []

    const services = await db.service.findMany({
        where: { sellerId: session.user.id },
        select: {
            id: true,
            title: true,
            category: true,
            price: true,
            isRemoved: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 15,
    })

    return services.map(s => ({
        id: s.id,
        label: s.title,
        type: "Service",
        category: s.category,
        price: s.price,
        isRemoved: s.isRemoved,
        date: s.createdAt.toISOString(),
    }))
}

// Fetch user's products (as seller)
export async function getUserProducts() {
    const session = await auth()
    if (!session?.user?.id) return []

    const products = await db.product.findMany({
        where: { sellerId: session.user.id },
        select: {
            id: true,
            name: true,
            category: true,
            price: true,
            isRemoved: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 15,
    })

    return products.map(p => ({
        id: p.id,
        label: p.name,
        type: "Product",
        category: p.category,
        price: p.price,
        isRemoved: p.isRemoved,
        date: p.createdAt.toISOString(),
    }))
}

// Fetch user's projects
export async function getUserProjects() {
    const session = await auth()
    if (!session?.user?.id) return []

    const projects = await db.project.findMany({
        where: {
            OR: [
                { clientId: session.user.id },
                { freelancerId: session.user.id },
            ]
        },
        include: {
            client: { select: { username: true } },
            freelancer: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
    })

    return projects.map(p => ({
        id: p.id,
        label: p.title,
        type: "Project",
        status: p.status,
        budget: p.budget,
        progress: p.progress,
        date: p.createdAt.toISOString(),
        otherParty: p.clientId === session.user!.id
            ? `@${p.freelancer.username}`
            : `@${p.client.username}`,
        role: p.clientId === session.user!.id ? "Client" : "Freelancer",
    }))
}

// Fetch user's conversations
export async function getUserConversations() {
    const session = await auth()
    if (!session?.user?.id) return []

    const conversations = await db.conversation.findMany({
        where: {
            OR: [
                { userAId: session.user.id },
                { userBId: session.user.id },
            ]
        },
        include: {
            userA: { select: { username: true, avatarUrl: true } },
            userB: { select: { username: true, avatarUrl: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
    })

    return conversations.map(c => {
        const otherUser = c.userAId === session.user!.id ? c.userB : c.userA
        return {
            id: c.id,
            label: `@${otherUser.username}`,
            type: "Conversation",
            status: c.status,
            lastMessage: c.messages[0]?.text?.slice(0, 60) || "No messages",
            date: c.updatedAt.toISOString(),
        }
    })
}

// Fetch user's posts
export async function getUserPosts() {
    const session = await auth()
    if (!session?.user?.id) return []

    const posts = await db.post.findMany({
        where: { authorId: session.user.id },
        select: {
            id: true,
            title: true,
            isRemoved: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 15,
    })

    return posts.map(p => ({
        id: p.id,
        label: p.title,
        type: "Post",
        isRemoved: p.isRemoved,
        date: p.createdAt.toISOString(),
    }))
}

// Fetch user's job applications (proposals)
export async function getUserProposals() {
    const session = await auth()
    if (!session?.user?.id) return []

    const applications = await db.jobApplication.findMany({
        where: { freelancerId: session.user.id },
        include: {
            job: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
    })

    return applications.map(a => ({
        id: a.id,
        label: a.job.title,
        type: "Proposal",
        status: a.status,
        proposedBudget: a.proposedBudget,
        date: a.createdAt.toISOString(),
    }))
}

// Fetch user's disputes
export async function getUserDisputes() {
    const session = await auth()
    if (!session?.user?.id) return []

    const disputes = await db.dispute.findMany({
        where: { raisedById: session.user.id },
        include: {
            order: {
                select: {
                    service: { select: { title: true } },
                    product: { select: { name: true } },
                }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 10,
    })

    return disputes.map(d => ({
        id: d.id,
        label: d.order?.service?.title || d.order?.product?.name || "Dispute",
        type: "Dispute",
        status: d.status,
        reason: d.reason.slice(0, 60),
        date: d.createdAt.toISOString(),
    }))
}
