"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { MessageCircle, X, Send, ChevronLeft, Bot, Loader2, CheckCircle2, AlertTriangle, Package, Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useSearchParams } from "next/navigation"
import { submitSupportTicket, getUserTickets, getSupportMessages, sendSupportMessage, getTicketDetails } from "@/app/actions/support"
import { getUserOrders, getUserServices, getUserProducts, getUserProjects, getUserConversations, getUserPosts, getUserProposals, getUserDisputes } from "@/app/actions/supportData"
import { toast } from "sonner"

// ─── Data types for context-aware ticket creation ────────────────────
type DataType = "orders" | "services" | "products" | "projects" | "conversations" | "posts" | "proposals" | "disputes" | "tickets"

interface UserDataItem {
    id: string
    label: string
    type: string
    status?: string
    price?: number
    budget?: number
    proposedBudget?: number
    progress?: number
    date: string
    otherParty?: string
    role?: string
    category?: string
    isRemoved?: boolean
    lastMessage?: string
    reason?: string
}

const DATA_FETCHERS: Record<DataType, () => Promise<UserDataItem[]>> = {
    orders: getUserOrders,
    services: getUserServices,
    products: getUserProducts,
    projects: getUserProjects,
    conversations: getUserConversations,
    posts: getUserPosts,
    proposals: getUserProposals,
    disputes: getUserDisputes,
    tickets: async () => {
        const tickets = await getUserTickets()
        return tickets.map(t => ({
            id: t.id,
            label: t.subject,
            type: "Ticket",
            status: t.status,
            date: t.createdAt.toISOString(),
            category: t.category,
        }))
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

// ─── Bot conversation tree ───────────────────────────────────────────
interface BotOption {
    label: string
    value: string
    icon?: string
    isPrimary?: boolean
}

interface BotNode {
    id: string
    message: string
    options?: BotOption[]
    next?: Record<string, string>  // value → next node id
    isTicket?: boolean             // final node that creates a ticket
    ticketCategory?: string
    ticketSubcategory?: string
    ticketPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    isSelfHelp?: boolean           // shows self-help text, no ticket
    selfHelpText?: string
    dataType?: DataType            // fetch user data for context selection
}

const BOT_TREE: Record<string, BotNode> = {
    // ─── Root ────
    root: {
        id: "root",
        message: "Hey there! 👋 I'm the Truework Support Bot. What do you need help with?",
        options: [
            { label: "📂 My Support Tickets", value: "view_tickets", isPrimary: true },
            { label: "💳 Orders & Payments", value: "orders" },
            { label: "🛠 Services & Products", value: "services" },
            { label: "📋 Projects & Proposals", value: "projects" },
            { label: "💬 Messages & Communication", value: "messages" },
            { label: "👤 Account & Profile", value: "account" },
            { label: "🏘 Community & Posts", value: "community" },
            { label: "⚠️ Report a Problem", value: "report" },
            { label: "🔒 Safety & Trust", value: "safety" },
            { label: "❓ Other / General Question", value: "other" },
        ],
        next: {
            view_tickets: "my_tickets",
            orders: "orders_menu",
            services: "services_menu",
            projects: "projects_menu",
            messages: "messages_menu",
            account: "account_menu",
            community: "community_menu",
            report: "report_menu",
            safety: "safety_menu",
            other: "other_ticket",
        },
    },

    my_tickets: {
        id: "my_tickets",
        isTicket: true, // we use this hack to trigger the item selection UI
        dataType: "tickets",
        message: "Here are your support tickets. Select one to view or send messages.",
    },

    // ─── Orders & Payments ────
    orders_menu: {
        id: "orders_menu",
        message: "What's going on with your order or payment?",
        options: [
            { label: "Order not delivered", value: "not_delivered" },
            { label: "Wrong or incomplete delivery", value: "wrong_delivery" },
            { label: "Payment failed / charged twice", value: "payment_issue" },
            { label: "Need a refund", value: "refund" },
            { label: "Can't track my order", value: "track_issue" },
            { label: "Seller not responding", value: "seller_unresponsive" },
            { label: "Revision request denied", value: "revision_denied" },
        ],
        next: {
            not_delivered: "order_not_delivered",
            wrong_delivery: "order_wrong_delivery",
            payment_issue: "payment_issue_ticket",
            refund: "refund_ticket",
            track_issue: "order_track_help",
            seller_unresponsive: "seller_unresponsive_ticket",
            revision_denied: "revision_denied_ticket",
        },
    },
    order_not_delivered: {
        id: "order_not_delivered",
        message: "Has the delivery deadline passed?",
        options: [
            { label: "Yes, deadline passed", value: "yes" },
            { label: "No, still within deadline", value: "no" },
        ],
        next: { yes: "order_overdue_ticket", no: "order_waiting_help" },
    },
    order_waiting_help: {
        id: "order_waiting_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "If the deadline hasn't passed yet, the seller still has time to deliver. You can message them directly from your order page under Dashboard → Projects → Active. If you're still concerned, you can create a support ticket below.",
        options: [
            { label: "Open a ticket anyway", value: "ticket" },
            { label: "That helps, thanks!", value: "done" },
        ],
        next: { ticket: "order_overdue_ticket", done: "resolved" },
    },
    order_overdue_ticket: {
        id: "order_overdue_ticket",
        isTicket: true,
        ticketCategory: "Orders & Payments",
        ticketSubcategory: "Order not delivered",
        ticketPriority: "HIGH",
        dataType: "orders",
        message: "Let me pull up your orders so you can select the one with the issue.",
    },
    order_wrong_delivery: {
        id: "order_wrong_delivery",
        message: "Have you already requested a revision from the seller?",
        options: [
            { label: "Yes, revision was denied", value: "denied" },
            { label: "No, I haven't yet", value: "not_yet" },
        ],
        next: { denied: "revision_denied_ticket", not_yet: "revision_help" },
    },
    revision_help: {
        id: "revision_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "Go to your order page (Dashboard → Projects → Active → your order) and click 'Request Revision'. Describe clearly what needs to be changed. If the seller denies it and you still aren't satisfied, come back and open a ticket.",
        options: [
            { label: "I still need help", value: "ticket" },
            { label: "Got it, thanks!", value: "done" },
        ],
        next: { ticket: "revision_denied_ticket", done: "resolved" },
    },
    revision_denied_ticket: {
        id: "revision_denied_ticket",
        isTicket: true,
        ticketCategory: "Orders & Payments",
        ticketSubcategory: "Revision denied",
        ticketPriority: "HIGH",
        dataType: "orders",
        message: "I'll escalate this. First, select the order in question.",
    },
    payment_issue_ticket: {
        id: "payment_issue_ticket",
        isTicket: true,
        ticketCategory: "Orders & Payments",
        ticketSubcategory: "Payment issue",
        ticketPriority: "URGENT",
        dataType: "orders",
        message: "Payment issues are top priority. Select the related order below.",
    },
    refund_ticket: {
        id: "refund_ticket",
        isTicket: true,
        ticketCategory: "Orders & Payments",
        ticketSubcategory: "Refund request",
        ticketPriority: "HIGH",
        dataType: "orders",
        message: "Select the order you'd like a refund for.",
    },
    order_track_help: {
        id: "order_track_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "You can track all your orders from Dashboard → Projects → Active. Each order shows its current status (Pending, In Progress, In Review, etc.). For product orders, check Dashboard → Payment → My Purchases.",
        options: [
            { label: "I still can't find it", value: "ticket" },
            { label: "Found it, thanks!", value: "done" },
        ],
        next: { ticket: "order_track_ticket", done: "resolved" },
    },
    order_track_ticket: {
        id: "order_track_ticket",
        isTicket: true,
        ticketCategory: "Orders & Payments",
        ticketSubcategory: "Can't track order",
        ticketPriority: "MEDIUM",
        dataType: "orders",
        message: "Select the order you're having trouble tracking.",
    },
    seller_unresponsive_ticket: {
        id: "seller_unresponsive_ticket",
        isTicket: true,
        ticketCategory: "Orders & Payments",
        ticketSubcategory: "Seller unresponsive",
        ticketPriority: "HIGH",
        dataType: "orders",
        message: "Select the order where the seller isn't responding.",
    },

    // ─── Services & Products ────
    services_menu: {
        id: "services_menu",
        message: "What's the issue with services or products?",
        options: [
            { label: "Can't create a service", value: "create_service" },
            { label: "Can't create a product", value: "create_product" },
            { label: "Service/product was removed", value: "removed" },
            { label: "Upload or image issues", value: "upload_issue" },
            { label: "Pricing not showing correctly", value: "pricing" },
            { label: "Can't edit my listing", value: "edit_issue" },
        ],
        next: {
            create_service: "create_service_help",
            create_product: "create_product_help",
            removed: "listing_removed_ticket",
            upload_issue: "upload_help",
            pricing: "pricing_ticket",
            edit_issue: "edit_listing_ticket",
        },
    },
    create_service_help: {
        id: "create_service_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "To create a service, make sure you're on Seller mode (switch via your profile dropdown). Then go to Dashboard → sidebar 'Create' button → Create a Service. Fill in all required fields (title, description, price, category, and at least one image).",
        options: [
            { label: "Still not working", value: "ticket" },
            { label: "That worked!", value: "done" },
        ],
        next: { ticket: "service_create_ticket", done: "resolved" },
    },
    service_create_ticket: {
        id: "service_create_ticket",
        isTicket: true,
        ticketCategory: "Services & Products",
        ticketSubcategory: "Cannot create service",
        ticketPriority: "MEDIUM",
        message: "Please describe what happens when you try to create a service — any error messages you see, what step you're stuck on.",
    },
    create_product_help: {
        id: "create_product_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "To create a product, go to your profile → Store tab → 'Add Product'. Fill all required fields including name, description, price, images, and digital files to deliver. Make sure file size is within limits.",
        options: [
            { label: "Still not working", value: "ticket" },
            { label: "That worked!", value: "done" },
        ],
        next: { ticket: "product_create_ticket", done: "resolved" },
    },
    product_create_ticket: {
        id: "product_create_ticket",
        isTicket: true,
        ticketCategory: "Services & Products",
        ticketSubcategory: "Cannot create product",
        ticketPriority: "MEDIUM",
        message: "Please describe the issue you're facing when creating a product.",
    },
    listing_removed_ticket: {
        id: "listing_removed_ticket",
        isTicket: true,
        ticketCategory: "Services & Products",
        ticketSubcategory: "Listing removed",
        ticketPriority: "HIGH",
        dataType: "services",
        message: "Select the removed listing you'd like us to review.",
    },
    upload_help: {
        id: "upload_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "Image uploads support PNG, JPG, GIF (max 16MB). Videos support MP4, WebM (max 32MB). Make sure your file isn't too large. Try a different browser or clear cache if uploads keep failing.",
        options: [
            { label: "Still failing", value: "ticket" },
            { label: "Fixed it!", value: "done" },
        ],
        next: { ticket: "upload_ticket", done: "resolved" },
    },
    upload_ticket: {
        id: "upload_ticket",
        isTicket: true,
        ticketCategory: "Services & Products",
        ticketSubcategory: "Upload issues",
        ticketPriority: "MEDIUM",
        message: "Please describe the upload issue — what file type, size, and what error you see.",
    },
    pricing_ticket: {
        id: "pricing_ticket",
        isTicket: true,
        ticketCategory: "Services & Products",
        ticketSubcategory: "Pricing display issue",
        ticketPriority: "MEDIUM",
        dataType: "services",
        message: "Select which service or product has incorrect pricing.",
    },
    edit_listing_ticket: {
        id: "edit_listing_ticket",
        isTicket: true,
        ticketCategory: "Services & Products",
        ticketSubcategory: "Cannot edit listing",
        ticketPriority: "MEDIUM",
        dataType: "services",
        message: "Select the listing you're trying to edit.",
    },

    // ─── Projects & Proposals ────
    projects_menu: {
        id: "projects_menu",
        message: "What's going on with your project or proposal?",
        options: [
            { label: "Project stuck / not progressing", value: "stuck" },
            { label: "Milestone payment issue", value: "milestone" },
            { label: "Want to cancel a project", value: "cancel" },
            { label: "Dispute isn't being resolved", value: "dispute" },
            { label: "Proposal wasn't received", value: "proposal_lost" },
            { label: "Can't submit a proposal", value: "proposal_submit" },
        ],
        next: {
            stuck: "project_stuck_ticket",
            milestone: "milestone_ticket",
            cancel: "project_cancel_ticket",
            dispute: "dispute_ticket",
            proposal_lost: "proposal_lost_ticket",
            proposal_submit: "proposal_submit_help",
        },
    },
    project_stuck_ticket: {
        id: "project_stuck_ticket",
        isTicket: true,
        ticketCategory: "Projects & Proposals",
        ticketSubcategory: "Project not progressing",
        ticketPriority: "HIGH",
        dataType: "projects",
        message: "Let me pull up your projects. Select the one that's stuck.",
    },
    milestone_ticket: {
        id: "milestone_ticket",
        isTicket: true,
        ticketCategory: "Projects & Proposals",
        ticketSubcategory: "Milestone payment issue",
        ticketPriority: "HIGH",
        dataType: "projects",
        message: "Select the project with the milestone issue.",
    },
    project_cancel_ticket: {
        id: "project_cancel_ticket",
        isTicket: true,
        ticketCategory: "Projects & Proposals",
        ticketSubcategory: "Cancellation request",
        ticketPriority: "MEDIUM",
        dataType: "projects",
        message: "Select the project you'd like to cancel. Note: cancellations may affect your credibility score.",
    },
    dispute_ticket: {
        id: "dispute_ticket",
        isTicket: true,
        ticketCategory: "Projects & Proposals",
        ticketSubcategory: "Dispute not resolved",
        ticketPriority: "URGENT",
        dataType: "disputes",
        message: "Select the dispute you need help with.",
    },
    proposal_lost_ticket: {
        id: "proposal_lost_ticket",
        isTicket: true,
        ticketCategory: "Projects & Proposals",
        ticketSubcategory: "Proposal not received",
        ticketPriority: "MEDIUM",
        dataType: "proposals",
        message: "Select the proposal you submitted that wasn't received.",
    },
    proposal_submit_help: {
        id: "proposal_submit_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "To submit a proposal, navigate to Explore → Jobs → find a job → click 'Apply'. Fill in your cover letter, proposed budget, and estimated days. Make sure you haven't already applied to the same job.",
        options: [
            { label: "Still can't submit", value: "ticket" },
            { label: "Got it!", value: "done" },
        ],
        next: { ticket: "proposal_submit_ticket", done: "resolved" },
    },
    proposal_submit_ticket: {
        id: "proposal_submit_ticket",
        isTicket: true,
        ticketCategory: "Projects & Proposals",
        ticketSubcategory: "Cannot submit proposal",
        ticketPriority: "MEDIUM",
        message: "Please describe what happens when you try to submit — any error message or behavior.",
    },

    // ─── Messages & Communication ────
    messages_menu: {
        id: "messages_menu",
        message: "What's the messaging issue?",
        options: [
            { label: "Can't send messages", value: "cant_send" },
            { label: "Connection request not accepted", value: "connection" },
            { label: "Getting spam or harassment", value: "harassment" },
            { label: "Messages not loading", value: "not_loading" },
        ],
        next: {
            cant_send: "cant_send_help",
            connection: "connection_help",
            harassment: "harassment_ticket",
            not_loading: "messages_loading_ticket",
        },
    },
    cant_send_help: {
        id: "cant_send_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "You can only message users you've connected with. Go to their profile → click 'Request to Connect'. Once they accept, you'll be able to message them from Dashboard → Messages. If your account is suspended, messaging may be restricted.",
        options: [
            { label: "I'm connected but still can't send", value: "ticket" },
            { label: "That explains it!", value: "done" },
        ],
        next: { ticket: "cant_send_ticket", done: "resolved" },
    },
    cant_send_ticket: {
        id: "cant_send_ticket",
        isTicket: true,
        ticketCategory: "Messages",
        ticketSubcategory: "Cannot send messages",
        ticketPriority: "MEDIUM",
        dataType: "conversations",
        message: "Select the conversation where you're having trouble.",
    },
    connection_help: {
        id: "connection_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "Connection requests need to be accepted by the other user. They appear in their inbox. If it's been a while, the user may not be active. You can check their online status on their profile.",
        options: [
            { label: "It's been weeks, need help", value: "ticket" },
            { label: "I'll wait, thanks!", value: "done" },
        ],
        next: { ticket: "connection_ticket", done: "resolved" },
    },
    connection_ticket: {
        id: "connection_ticket",
        isTicket: true,
        ticketCategory: "Messages",
        ticketSubcategory: "Connection request issue",
        ticketPriority: "LOW",
        message: "Please tell us which user you're trying to connect with and how long you've been waiting.",
    },
    harassment_ticket: {
        id: "harassment_ticket",
        isTicket: true,
        ticketCategory: "Messages",
        ticketSubcategory: "Spam or harassment",
        ticketPriority: "URGENT",
        dataType: "conversations",
        message: "This is taken seriously. Select the conversation with the issue — our safety team will review.",
    },
    messages_loading_ticket: {
        id: "messages_loading_ticket",
        isTicket: true,
        ticketCategory: "Messages",
        ticketSubcategory: "Messages not loading",
        ticketPriority: "MEDIUM",
        message: "Please tell us what you see — blank page, loading spinner, error? Also mention your browser and device.",
    },

    // ─── Account & Profile ────
    account_menu: {
        id: "account_menu",
        message: "What account or profile issue are you facing?",
        options: [
            { label: "Can't log in", value: "login" },
            { label: "Want to switch Buyer/Seller mode", value: "switch_mode" },
            { label: "Profile not updating", value: "profile_update" },
            { label: "Credibility score seems wrong", value: "credibility" },
            { label: "Account banned or suspended", value: "banned" },
            { label: "Want to delete my account", value: "delete" },
            { label: "Visual intro upload issue", value: "visual_intro" },
        ],
        next: {
            login: "login_help",
            switch_mode: "switch_mode_help",
            profile_update: "profile_update_ticket",
            credibility: "credibility_help",
            banned: "banned_ticket",
            delete: "delete_ticket",
            visual_intro: "visual_intro_help",
        },
    },
    login_help: {
        id: "login_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "Try resetting your password via the sign-in page. If you signed up with Google/GitHub, use the same provider to log in. Clear your browser cache and cookies if you're having persistent issues.",
        options: [
            { label: "Still locked out", value: "ticket" },
            { label: "That worked!", value: "done" },
        ],
        next: { ticket: "login_ticket", done: "resolved" },
    },
    login_ticket: {
        id: "login_ticket",
        isTicket: true,
        ticketCategory: "Account & Profile",
        ticketSubcategory: "Cannot log in",
        ticketPriority: "HIGH",
        message: "Please share the email or username you're trying to log in with and what error you see.",
    },
    switch_mode_help: {
        id: "switch_mode_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "To switch between Buyer and Seller mode, click your profile icon in the top-right → select 'Switch to Buying' or 'Switch to Selling'. This changes your dashboard view and available features.",
        options: [
            { label: "It's not working", value: "ticket" },
            { label: "Found it!", value: "done" },
        ],
        next: { ticket: "switch_mode_ticket", done: "resolved" },
    },
    switch_mode_ticket: {
        id: "switch_mode_ticket",
        isTicket: true,
        ticketCategory: "Account & Profile",
        ticketSubcategory: "Cannot switch mode",
        ticketPriority: "MEDIUM",
        message: "Please describe what happens when you try to switch modes.",
    },
    profile_update_ticket: {
        id: "profile_update_ticket",
        isTicket: true,
        ticketCategory: "Account & Profile",
        ticketSubcategory: "Profile not updating",
        ticketPriority: "MEDIUM",
        message: "Please describe what you changed and what isn't saving correctly.",
    },
    credibility_help: {
        id: "credibility_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "Your credibility score starts at 50 and changes based on: completed orders (+5), good reviews (+3), on-time delivery (+2). Penalties: cancellations (-10), bad reviews (-5), late delivery (-3), reports resolved against you (-20 to -50). Check Dashboard → Credibility → History for details.",
        options: [
            { label: "Something still seems off", value: "ticket" },
            { label: "Makes sense now!", value: "done" },
        ],
        next: { ticket: "credibility_ticket", done: "resolved" },
    },
    credibility_ticket: {
        id: "credibility_ticket",
        isTicket: true,
        ticketCategory: "Account & Profile",
        ticketSubcategory: "Credibility score dispute",
        ticketPriority: "MEDIUM",
        message: "Please explain what you believe is incorrect about your score. We'll audit it.",
    },
    banned_ticket: {
        id: "banned_ticket",
        isTicket: true,
        ticketCategory: "Account & Profile",
        ticketSubcategory: "Account banned/suspended",
        ticketPriority: "URGENT",
        message: "Please describe why you think this action is incorrect. Include your username and any context about what happened.",
    },
    delete_ticket: {
        id: "delete_ticket",
        isTicket: true,
        ticketCategory: "Account & Profile",
        ticketSubcategory: "Account deletion request",
        ticketPriority: "LOW",
        message: "Please confirm you want your account deleted. Note: this is irreversible and all your data, orders, and reviews will be permanently removed.",
    },
    visual_intro_help: {
        id: "visual_intro_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "Visual intros support images (PNG, JPG, GIF up to 16MB) and videos (MP4 up to 32MB) in 4:3 aspect ratio. Go to your profile → click the visual intro area → upload your file. Try a smaller file if it keeps failing.",
        options: [
            { label: "Still not working", value: "ticket" },
            { label: "Fixed!", value: "done" },
        ],
        next: { ticket: "visual_intro_ticket", done: "resolved" },
    },
    visual_intro_ticket: {
        id: "visual_intro_ticket",
        isTicket: true,
        ticketCategory: "Account & Profile",
        ticketSubcategory: "Visual intro upload",
        ticketPriority: "LOW",
        message: "Please describe the issue with uploading your visual intro.",
    },

    // ─── Community & Posts ────
    community_menu: {
        id: "community_menu",
        message: "What's the community issue?",
        options: [
            { label: "My post was removed", value: "post_removed" },
            { label: "Can't create a post", value: "cant_post" },
            { label: "Seeing inappropriate content", value: "inappropriate" },
            { label: "Embeds not showing", value: "embeds" },
            { label: "Comments/votes not working", value: "comments" },
        ],
        next: {
            post_removed: "post_removed_ticket",
            cant_post: "cant_post_help",
            inappropriate: "inappropriate_ticket",
            embeds: "embeds_help",
            comments: "comments_ticket",
        },
    },
    post_removed_ticket: {
        id: "post_removed_ticket",
        isTicket: true,
        ticketCategory: "Community",
        ticketSubcategory: "Post removed",
        ticketPriority: "MEDIUM",
        dataType: "posts",
        message: "Select the post that was removed so we can review the decision.",
    },
    cant_post_help: {
        id: "cant_post_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "To create a post, go to Dashboard → Community → 'Create Post'. You need a title and content at minimum. If your account is suspended, posting may be restricted until the suspension lifts.",
        options: [
            { label: "Still can't post", value: "ticket" },
            { label: "Got it!", value: "done" },
        ],
        next: { ticket: "cant_post_ticket", done: "resolved" },
    },
    cant_post_ticket: {
        id: "cant_post_ticket",
        isTicket: true,
        ticketCategory: "Community",
        ticketSubcategory: "Cannot create post",
        ticketPriority: "MEDIUM",
        message: "Please describe what happens when you try to create a post.",
    },
    inappropriate_ticket: {
        id: "inappropriate_ticket",
        isTicket: true,
        ticketCategory: "Community",
        ticketSubcategory: "Inappropriate content",
        ticketPriority: "HIGH",
        message: "Please describe the content and share the post or user involved. Our moderation team will review immediately.",
    },
    embeds_help: {
        id: "embeds_help",
        isSelfHelp: true,
        message: "📌 Self-help tip",
        selfHelpText: "Social embeds (Instagram, Spotify, X, YouTube, etc.) should auto-detect when you paste a URL in your post content. Make sure you're pasting the full URL. Some platforms may block embeds — try a direct link.",
        options: [
            { label: "Still not showing", value: "ticket" },
            { label: "Working now!", value: "done" },
        ],
        next: { ticket: "embeds_ticket", done: "resolved" },
    },
    embeds_ticket: {
        id: "embeds_ticket",
        isTicket: true,
        ticketCategory: "Community",
        ticketSubcategory: "Embed not working",
        ticketPriority: "LOW",
        message: "Please share the URL that's not embedding and which platform it's from.",
    },
    comments_ticket: {
        id: "comments_ticket",
        isTicket: true,
        ticketCategory: "Community",
        ticketSubcategory: "Comments/votes not working",
        ticketPriority: "MEDIUM",
        message: "Please describe what's happening — are comments not saving, votes not counting, or something else?",
    },

    // ─── Report a Problem ────
    report_menu: {
        id: "report_menu",
        message: "What would you like to report?",
        options: [
            { label: "Bug or broken feature", value: "bug" },
            { label: "Page not loading", value: "page_broken" },
            { label: "Slow performance", value: "slow" },
            { label: "Data showing incorrectly", value: "wrong_data" },
            { label: "Feature request", value: "feature" },
        ],
        next: {
            bug: "bug_ticket",
            page_broken: "page_broken_ticket",
            slow: "slow_ticket",
            wrong_data: "wrong_data_ticket",
            feature: "feature_ticket",
        },
    },
    bug_ticket: {
        id: "bug_ticket",
        isTicket: true,
        ticketCategory: "Bug Report",
        ticketSubcategory: "Bug or broken feature",
        ticketPriority: "HIGH",
        message: "Please describe the bug in detail — what you did, what you expected, and what actually happened. Include the page URL if possible.",
    },
    page_broken_ticket: {
        id: "page_broken_ticket",
        isTicket: true,
        ticketCategory: "Bug Report",
        ticketSubcategory: "Page not loading",
        ticketPriority: "HIGH",
        message: "Which page isn't loading? Please share the URL and what you see (blank page, error message, etc.).",
    },
    slow_ticket: {
        id: "slow_ticket",
        isTicket: true,
        ticketCategory: "Bug Report",
        ticketSubcategory: "Slow performance",
        ticketPriority: "MEDIUM",
        message: "Which part of the site is slow? Please describe your browser, device, and internet connection.",
    },
    wrong_data_ticket: {
        id: "wrong_data_ticket",
        isTicket: true,
        ticketCategory: "Bug Report",
        ticketSubcategory: "Incorrect data display",
        ticketPriority: "MEDIUM",
        message: "What data is showing incorrectly? Please be specific about where and what's wrong.",
    },
    feature_ticket: {
        id: "feature_ticket",
        isTicket: true,
        ticketCategory: "Feature Request",
        ticketSubcategory: "New feature suggestion",
        ticketPriority: "LOW",
        message: "We'd love to hear your idea! Please describe the feature you'd like to see and how it would help you.",
    },

    // ─── Safety & Trust ────
    safety_menu: {
        id: "safety_menu",
        message: "What's the safety concern?",
        options: [
            { label: "Suspicious user / scam", value: "scam" },
            { label: "Someone stole my work", value: "ip_theft" },
            { label: "Fake reviews", value: "fake_reviews" },
            { label: "Identity impersonation", value: "impersonation" },
            { label: "I feel unsafe", value: "unsafe" },
        ],
        next: {
            scam: "scam_ticket",
            ip_theft: "ip_theft_ticket",
            fake_reviews: "fake_reviews_ticket",
            impersonation: "impersonation_ticket",
            unsafe: "unsafe_ticket",
        },
    },
    scam_ticket: {
        id: "scam_ticket",
        isTicket: true,
        ticketCategory: "Safety & Trust",
        ticketSubcategory: "Suspected scam",
        ticketPriority: "URGENT",
        message: "Please share the username or profile URL of the suspicious user and describe what happened. Our safety team will investigate immediately.",
    },
    ip_theft_ticket: {
        id: "ip_theft_ticket",
        isTicket: true,
        ticketCategory: "Safety & Trust",
        ticketSubcategory: "Intellectual property theft",
        ticketPriority: "URGENT",
        message: "Please describe your original work and who you believe copied it. Include links to both if possible.",
    },
    fake_reviews_ticket: {
        id: "fake_reviews_ticket",
        isTicket: true,
        ticketCategory: "Safety & Trust",
        ticketSubcategory: "Fake reviews",
        ticketPriority: "HIGH",
        message: "Please point us to the service/product and the specific reviews you believe are fake. We'll investigate.",
    },
    impersonation_ticket: {
        id: "impersonation_ticket",
        isTicket: true,
        ticketCategory: "Safety & Trust",
        ticketSubcategory: "Identity impersonation",
        ticketPriority: "URGENT",
        message: "Who is being impersonated? Please share both the impersonator's profile and the real person's identity/profile.",
    },
    unsafe_ticket: {
        id: "unsafe_ticket",
        isTicket: true,
        ticketCategory: "Safety & Trust",
        ticketSubcategory: "Safety concern",
        ticketPriority: "URGENT",
        message: "Your safety is our top priority. Please describe what's making you feel unsafe. If this involves threats, please also consider contacting local authorities.",
    },

    // ─── Other ────
    other_ticket: {
        id: "other_ticket",
        isTicket: true,
        ticketCategory: "General",
        ticketSubcategory: "Other",
        ticketPriority: "MEDIUM",
        message: "No problem! Please describe your issue or question and our team will get back to you.",
    },

    // ─── Terminal States ────
    resolved: {
        id: "resolved",
        message: "Glad I could help! 🎉 If you need anything else, just start over.",
        options: [
            { label: "Start over", value: "restart" },
        ],
        next: { restart: "root" },
    },
    ticket_submitted: {
        id: "ticket_submitted",
        message: "✅ Your support ticket has been submitted! Our team will review it and get back to you. You'll receive a notification when there's an update.",
        options: [
            { label: "I have another issue", value: "restart" },
        ],
        next: { restart: "root" },
    },
}

// ─── Message types ────
interface ChatMessage {
    id: string
    sender: "bot" | "user"
    text: string
    options?: BotOption[]
    selfHelpText?: string
    isTicketPrompt?: boolean
    userDataItems?: UserDataItem[]
    isLoadingData?: boolean
    timestamp: Date
}

// ─── Component ────
export function SupportBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [currentNodeId, setCurrentNodeId] = useState("root")
    const [ticketInput, setTicketInput] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [pendingTicketNode, setPendingTicketNode] = useState<BotNode | null>(null)
    const [navigationPath, setNavigationPath] = useState<string[]>([])
    const [selectedItem, setSelectedItem] = useState<UserDataItem | null>(null)
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const searchParams = useSearchParams()
    const pathname = usePathname()

    const handleDirectNavigation = useCallback(async (nextNodeId: string) => {
        const nextNode = BOT_TREE[nextNodeId]
        if (!nextNode) return

        setIsOpen(true)
        setCurrentNodeId(nextNodeId)
        setPendingTicketNode(null)
        setSelectedItem(null)
        setActiveTicketId(null)
        setNavigationPath(["root"])

        if (nextNode.isTicket && nextNode.dataType) {
            const loadingMsgId = `bot-loading-${Date.now()}`
            setMessages([{
                id: loadingMsgId,
                sender: "bot",
                text: nextNode.message,
                isLoadingData: true,
                timestamp: new Date(),
            }])

            try {
                const fetcher = DATA_FETCHERS[nextNode.dataType]
                const items = await fetcher()

                setMessages([{
                    id: loadingMsgId,
                    sender: "bot",
                    text: items.length > 0
                        ? `${nextNode.message}\n\n📋 Found ${items.length} ${nextNode.dataType}. Select one below:`
                        : `${nextNode.message}\n\nI couldn't find any ${nextNode.dataType} on your account. Please describe the issue in detail below.`,
                    isLoadingData: false,
                    userDataItems: items,
                    isTicketPrompt: items.length === 0,
                    timestamp: new Date(),
                }])
                setPendingTicketNode(nextNode)
            } catch {
                setMessages([{
                    id: loadingMsgId,
                    sender: "bot",
                    text: `${nextNode.message}\n\nCouldn't load your data. Please describe the issue below.`,
                    isLoadingData: false,
                    isTicketPrompt: true,
                    timestamp: new Date(),
                }])
                setPendingTicketNode(nextNode)
            }
        } else {
            setMessages([{
                id: `bot-${Date.now()}`,
                sender: "bot",
                text: nextNode.message,
                options: nextNode.options,
                selfHelpText: nextNode.selfHelpText,
                timestamp: new Date(),
            }])
        }
    }, [])

    const handleSelectItem = useCallback(async (item: UserDataItem) => {
        let finalItem = item

        if (item.type === "Ticket") {
            try {
                setActiveTicketId(item.id)
                setMessages([{
                    id: `bot-loading-${Date.now()}`,
                    sender: "bot",
                    text: `Loading ticket details...`,
                    isLoadingData: true,
                    timestamp: new Date(),
                }])

                // Fetch full details to get status, etc.
                const details = await getTicketDetails(item.id)
                finalItem = {
                    id: details.id,
                    label: details.subject,
                    type: "Ticket",
                    status: details.status,
                    date: details.createdAt.toISOString(),
                }
                setSelectedItem(finalItem)

                const msgs = await getSupportMessages(item.id)
                setMessages(msgs.map((m: any) => ({
                    id: m.id,
                    sender: m.sender.role === "ADMIN" ? "bot" : "user",
                    text: m.text,
                    timestamp: new Date(m.createdAt),
                })))
                return
            } catch (error) {
                console.error("Failed to load ticket:", error)
                toast.error("Failed to load ticket details")
                setActiveTicketId(null)
                setSelectedItem(null)
                handleReset()
                return
            }
        }

        setSelectedItem(finalItem)

        // Show user selection as a message
        const itemLabel = `${item.type}: ${item.label}${item.otherParty ? ` (with ${item.otherParty})` : ""}${item.status ? ` · ${item.status}` : ""}`
        setMessages(prev => [...prev, {
            id: `user-item-${Date.now()}`,
            sender: "user",
            text: `📌 Selected: ${itemLabel}`,
            timestamp: new Date(),
        }])

        // Now show the description prompt
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: `bot-desc-${Date.now()}`,
                sender: "bot",
                text: "Got it! Now please add any extra details about the issue. What exactly went wrong?",
                isTicketPrompt: true,
                timestamp: new Date(),
            }])
        }, 300)
    }, [])


    useEffect(() => {
        setMounted(true)
    }, [])

    // Handle support triggers from URL
    useEffect(() => {
        const ticketId = searchParams.get("ticketId")
        const view = searchParams.get("support")

        if (ticketId && ticketId !== activeTicketId) {
            setIsOpen(true)
            handleSelectItem({
                id: ticketId,
                label: "Ticket #" + ticketId.slice(0, 8),
                type: "Ticket",
                date: new Date().toISOString()
            })
        } else if (view === "tickets" && (currentNodeId !== "my_tickets" || activeTicketId !== null)) {
            handleDirectNavigation("my_tickets")
        }
    }, [searchParams, handleSelectItem, handleDirectNavigation, activeTicketId, currentNodeId])

    // Initialize with root message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const rootNode = BOT_TREE["root"]
            setMessages([{
                id: "init",
                sender: "bot",
                text: rootNode.message,
                options: rootNode.options,
                timestamp: new Date(),
            }])
        }
    }, [isOpen, messages.length])

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Focus input when ticket prompt appears
    useEffect(() => {
        if (pendingTicketNode) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [pendingTicketNode])

    const handleOptionSelect = (option: BotOption) => {
        const currentNode = BOT_TREE[currentNodeId]
        if (!currentNode?.next) return

        const nextNodeId = currentNode.next[option.value]
        if (!nextNodeId) return

        // Add user's selected option as message
        setMessages(prev => [...prev, {
            id: `user-${Date.now()}`,
            sender: "user",
            text: option.label,
            timestamp: new Date(),
        }])

        setNavigationPath(prev => [...prev, currentNodeId])

        // Handle special restart
        if (nextNodeId === "root") {
            setTimeout(() => {
                const rootNode = BOT_TREE["root"]
                setMessages(prev => [...prev, {
                    id: `bot-${Date.now()}`,
                    sender: "bot",
                    text: rootNode.message,
                    options: rootNode.options,
                    timestamp: new Date(),
                }])
                setCurrentNodeId("root")
                setPendingTicketNode(null)
                setNavigationPath([])
            }, 400)
            return
        }

        const nextNode = BOT_TREE[nextNodeId]
        if (!nextNode) return

        // Clear pending ticket state on navigation
        setPendingTicketNode(null)
        setSelectedItem(null)

        setTimeout(async () => {
            if (nextNode.isTicket) {
                if (nextNode.dataType) {
                    // Show loading message first
                    const loadingMsgId = `bot-loading-${Date.now()}`
                    setMessages(prev => [...prev, {
                        id: loadingMsgId,
                        sender: "bot",
                        text: nextNode.message,
                        isLoadingData: true,
                        timestamp: new Date(),
                    }])
                    setCurrentNodeId(nextNodeId)

                    try {
                        const fetcher = DATA_FETCHERS[nextNode.dataType]
                        const items = await fetcher()

                        // Replace loading message with data
                        setMessages(prev => prev.map(m =>
                            m.id === loadingMsgId
                                ? {
                                    ...m,
                                    isLoadingData: false,
                                    userDataItems: items,
                                    isTicketPrompt: items.length === 0,
                                    text: items.length > 0
                                        ? `${nextNode.message}\n\n📋 Found ${items.length} ${nextNode.dataType}. Select one below:`
                                        : `${nextNode.message}\n\nI couldn't find any ${nextNode.dataType} on your account. Please describe the issue in detail below.`,
                                }
                                : m
                        ))
                        setPendingTicketNode(nextNode)
                        if (items.length === 0) {
                            setSelectedItem(null)
                        }
                    } catch {
                        setMessages(prev => prev.map(m =>
                            m.id === loadingMsgId
                                ? { ...m, isLoadingData: false, isTicketPrompt: true, text: `${nextNode.message}\n\nCouldn't load your data. Please describe the issue below.` }
                                : m
                        ))
                        setPendingTicketNode(nextNode)
                    }
                } else {
                    // No data to fetch, show text input directly
                    setMessages(prev => [...prev, {
                        id: `bot-${Date.now()}`,
                        sender: "bot",
                        text: nextNode.message,
                        isTicketPrompt: true,
                        timestamp: new Date(),
                    }])
                    setPendingTicketNode(nextNode)
                    setCurrentNodeId(nextNodeId)
                }
            } else {
                // Show next options
                setMessages(prev => [...prev, {
                    id: `bot-${Date.now()}`,
                    sender: "bot",
                    text: nextNode.message,
                    options: nextNode.options,
                    selfHelpText: nextNode.selfHelpText,
                    timestamp: new Date(),
                }])
                setCurrentNodeId(nextNodeId)
            }
        }, 400)
    }


    const handleSendSupportMessage = async () => {
        if (!ticketInput.trim() || !activeTicketId || isSubmitting) return

        const messageText = ticketInput.trim()
        setIsSubmitting(true)
        setTicketInput("")

        try {
            // Optimistic update
            const tempId = `temp-${Date.now()}`
            setMessages(prev => [...prev, {
                id: tempId,
                sender: "user",
                text: messageText,
                timestamp: new Date(),
            }])

            const result = await sendSupportMessage(activeTicketId, messageText)

            // Replace with real message
            setMessages(prev => prev.map(m => m.id === tempId ? {
                id: result.message.id,
                sender: "user",
                text: result.message.text,
                timestamp: new Date(result.message.createdAt),
            } : m))
        } catch (error: any) {
            toast.error(error.message || "Failed to send message")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitTicket = async () => {
        if (!ticketInput.trim() || !pendingTicketNode || isSubmitting) return

        const description = ticketInput.trim()
        setIsSubmitting(true)

        // Build full description with selected item info
        const fullDescription = selectedItem
            ? `[Selected ${selectedItem.type}: "${selectedItem.label}" (ID: ${selectedItem.id})${selectedItem.otherParty ? `, with ${selectedItem.otherParty}` : ""}${selectedItem.status ? `, Status: ${selectedItem.status}` : ""}${selectedItem.price != null ? `, Price: ₹${selectedItem.price}` : ""}]\n\n${description}`
            : description

        setMessages(prev => [...prev, {
            id: `user-${Date.now()}`,
            sender: "user",
            text: description,
            timestamp: new Date(),
        }])

        setTicketInput("")

        try {
            const result = await submitSupportTicket({
                category: pendingTicketNode.ticketCategory || "General",
                subcategory: pendingTicketNode.ticketSubcategory,
                subject: selectedItem
                    ? `${pendingTicketNode.ticketCategory}: ${pendingTicketNode.ticketSubcategory || "General"} — ${selectedItem.label}`
                    : `${pendingTicketNode.ticketCategory}: ${pendingTicketNode.ticketSubcategory || "General"}`,
                description: fullDescription,
                priority: pendingTicketNode.ticketPriority || "MEDIUM",
                metadata: {
                    botPath: navigationPath,
                    nodeId: pendingTicketNode.id,
                    ...(selectedItem && {
                        selectedItem: {
                            id: selectedItem.id,
                            type: selectedItem.type,
                            label: selectedItem.label,
                            status: selectedItem.status,
                            otherParty: selectedItem.otherParty,
                            role: selectedItem.role,
                        }
                    }),
                },
            })

            const successNode = BOT_TREE["ticket_submitted"]
            setMessages(prev => [...prev, {
                id: `bot-${Date.now()}`,
                sender: "bot",
                text: `${successNode.message}\n\n📋 Ticket ID: ${result.ticketId?.slice(0, 8)}...`,
                options: successNode.options,
                timestamp: new Date(),
            }])
            setCurrentNodeId("ticket_submitted")
            setPendingTicketNode(null)
            setSelectedItem(null)
            toast.success("Support ticket submitted!")
        } catch (error) {
            setMessages(prev => [...prev, {
                id: `bot-${Date.now()}`,
                sender: "bot",
                text: "❌ Sorry, something went wrong submitting your ticket. Please try again or email support directly.",
                options: [{ label: "Try again", value: "retry" }],
                timestamp: new Date(),
            }])
            toast.error("Failed to submit ticket")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoBack = () => {
        if (activeTicketId) {
            setActiveTicketId(null)
            handleReset() // Go back to root for now, or we could store the previous navigation path better
            return
        }

        if (navigationPath.length === 0) return

        const previousNodeId = navigationPath[navigationPath.length - 1]
        const previousNode = BOT_TREE[previousNodeId]

        setNavigationPath(prev => prev.slice(0, -1))
        setPendingTicketNode(null)
        setTicketInput("")
        setSelectedItem(null)

        // Remove last bot + user message pair
        setMessages(prev => {
            const msgs = [...prev]
            // Remove at least last 2 messages (user selection + bot response)
            if (msgs.length >= 2) {
                msgs.splice(-2, 2)
            }
            return msgs
        })

        setCurrentNodeId(previousNodeId)
    }

    const handleReset = () => {
        setMessages([])
        setCurrentNodeId("root")
        setPendingTicketNode(null)
        setTicketInput("")
        setNavigationPath([])
        setSelectedItem(null)
        setActiveTicketId(null)

        const rootNode = BOT_TREE["root"]
        setMessages([{
            id: "init-reset",
            sender: "bot",
            text: rootNode.message,
            options: rootNode.options,
            timestamp: new Date(),
        }])
    }

    if (!mounted) return null

    // Floating action button
    const fab = (
        <button
            onClick={() => setIsOpen(true)}
            className={cn(
                "fixed bottom-6 right-6 z-[9990] flex items-center justify-center",
                "w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl",
                "hover:bg-slate-800 hover:scale-105 active:scale-95",
                "transition-all duration-200 group",
                isOpen && "hidden"
            )}
            title="Need help?"
        >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {/* Pulse indicator */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500" />
            </span>
        </button>
    )

    const chatWindow = isOpen ? createPortal(
        <div className={cn(
            "fixed bottom-6 right-6 z-[9998] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 transition-all",
            activeTicketId || currentNodeId === "my_tickets" ? "w-[500px]" : "w-[400px]",
            "max-w-[calc(100vw-2rem)]"
        )}
            style={{ height: "min(700px, calc(100vh - 4rem))" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-tight">
                            {activeTicketId ? "Ticket Support" : "Truework Support"}
                        </h3>
                        <p className="text-[10px] text-slate-300 font-medium">
                            {activeTicketId ? "Live Chat" : "Usually replies instantly"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {(navigationPath.length > 0 || activeTicketId) && (
                        <button
                            onClick={handleGoBack}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                            title="Go back"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white text-[10px] font-bold"
                        title="Start over"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 bg-slate-50/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                            msg.sender === "user"
                                ? "bg-slate-900 text-white rounded-br-md"
                                : "bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm"
                        )}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            {/* Self-help tip callout */}
                            {msg.selfHelpText && (
                                <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs leading-relaxed">
                                    {msg.selfHelpText}
                                </div>
                            )}

                            {/* Options buttons */}
                            {msg.options && msg.options.length > 0 && (
                                <div className="mt-3 flex flex-col gap-1.5">
                                    {msg.options.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleOptionSelect(opt)}
                                            className={cn(
                                                "w-full text-left transition-all active:scale-[0.98] border",
                                                opt.isPrimary
                                                    ? "px-4 py-4 rounded-xl text-sm font-black bg-white border-blue-600 text-blue-600 hover:bg-blue-50 hover:shadow-md mb-1"
                                                    : "px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Loading data indicator */}
                            {msg.isLoadingData && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 font-medium p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Fetching your data...
                                </div>
                            )}

                            {/* User data items for selection */}
                            {msg.userDataItems && msg.userDataItems.length > 0 && !selectedItem && (
                                <div className={cn(
                                    "mt-3 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar",
                                    currentNodeId === "my_tickets" ? "max-h-[450px]" : "max-h-[250px]"
                                )}>
                                    {msg.userDataItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectItem(item)}
                                            className={cn(
                                                "w-full text-left rounded-2xl transition-all active:scale-[0.98] group border",
                                                currentNodeId === "my_tickets"
                                                    ? "p-5 bg-white border-slate-100 hover:border-blue-500 hover:shadow-md"
                                                    : "px-3 py-2.5 bg-slate-50 border-slate-200 hover:border-blue-300 text-xs"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className={cn(
                                                    "font-black text-slate-900 group-hover:text-blue-600 truncate mb-1 block",
                                                    currentNodeId === "my_tickets" ? "text-base" : "text-sm"
                                                )}>
                                                    {item.label}
                                                </span>
                                                {item.status && (
                                                    <span className={cn(
                                                        "shrink-0 font-bold uppercase px-2 py-1 rounded-lg",
                                                        currentNodeId === "my_tickets" ? "text-[10px]" : "text-[8px]",
                                                        item.status === "COMPLETED" || item.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" :
                                                            item.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                                                item.status === "ACTIVE" || item.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                                                                    item.status === "CANCELLED" || item.status === "CLOSED" ? "bg-red-100 text-red-700" :
                                                                        "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn(
                                                "flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-slate-400 font-medium",
                                                currentNodeId === "my_tickets" ? "text-xs" : "text-[10px]"
                                            )}>
                                                <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 uppercase tracking-wider text-[10px] font-black">
                                                    {item.type}
                                                </span>
                                                {item.otherParty && <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.otherParty}</span>}
                                                {(item.price != null || item.budget != null) && <span className="text-slate-900 font-bold">₹{item.price ?? item.budget}</span>}
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{timeAgo(item.date)}</span>
                                            </div>
                                        </button>
                                    ))}
                                    {/* Skip option */}
                                    <button
                                        onClick={() => {
                                            setSelectedItem(null)
                                            setMessages(prev => [...prev, {
                                                id: `user-skip-${Date.now()}`,
                                                sender: "user",
                                                text: "I don't see it listed / it's something else",
                                                timestamp: new Date(),
                                            }, {
                                                id: `bot-skip-${Date.now()}`,
                                                sender: "bot",
                                                text: "No worries! Please describe the issue in detail below.",
                                                isTicketPrompt: true,
                                                timestamp: new Date(),
                                            }])
                                        }}
                                        className="w-full text-center px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        I don&apos;t see it / describe manually
                                    </button>
                                </div>
                            )}

                            {/* Ticket prompt indicator */}
                            {msg.isTicketPrompt && (
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    Describe your issue below to create a ticket
                                </div>
                            )}
                        </div>
                    </div >
                ))
                }

                {/* Typing indicator */}
                {
                    isSubmitting && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )
                }

                <div ref={messagesEndRef} />
            </div >

            {/* Input area — visible in ticket creation mode or active chat mode */}
            {
                // Only show input if we are in a ticket prompt node (after selection) or in an active chat
                (pendingTicketNode || activeTicketId) && (() => {
                    // If we are in a data selection node but haven't selected an item yet, DON'T show the input
                    if (pendingTicketNode?.dataType && !selectedItem && !activeTicketId) {
                        return null
                    }

                    // Check if the active ticket is resolved/closed
                    const isTicketResolved = activeTicketId && selectedItem?.status &&
                        (selectedItem.status === "RESOLVED" || selectedItem.status === "CLOSED")

                    if (isTicketResolved) {
                        return (
                            <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-4">
                                <div className="flex items-center gap-3 justify-center text-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <p className="text-sm text-slate-500 font-medium">
                                        This ticket has been resolved. If you need further help, please create a new ticket.
                                    </p>
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={inputRef}
                                    value={ticketInput}
                                    onChange={(e) => setTicketInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            if (activeTicketId) {
                                                handleSendSupportMessage()
                                            } else {
                                                handleSubmitTicket()
                                            }
                                        }
                                    }}
                                    placeholder={activeTicketId ? "Type a message..." : "Describe your issue in detail..."}
                                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all min-h-[44px] max-h-[120px]"
                                    rows={activeTicketId ? 1 : 2}
                                    disabled={isSubmitting}
                                />
                                <button
                                    onClick={activeTicketId ? handleSendSupportMessage : handleSubmitTicket}
                                    disabled={!ticketInput.trim() || isSubmitting}
                                    className={cn(
                                        "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        ticketInput.trim() && !isSubmitting
                                            ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                                Press Enter to {activeTicketId ? "send" : "submit"} • Shift+Enter for new line
                            </p>
                        </div>
                    )
                })()
            }
        </div >,
        document.body
    ) : null

    return (
        <>
            {fab}
            {chatWindow}
        </>
    )
}
