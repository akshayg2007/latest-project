"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkUserRestriction } from "@/lib/checkSuspension"
import { updateCredibility } from "@/lib/credibility"

export async function createReview(formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return

  const serviceId = formData.get("serviceId") as string
  const orderId = formData.get("orderId") as string
  const rating = parseInt(formData.get("rating") as string) || 5
  const prof = parseInt(formData.get("ratingProfessionalism") as string) || 5
  const time = parseInt(formData.get("ratingTimeliness") as string) || 5
  const qual = parseInt(formData.get("ratingQualityOfWork") as string) || 5
  const comm = parseInt(formData.get("ratingCommunication") as string) || 5
  const comment = formData.get("comment") as string

  if (!orderId || !rating || !comment) {
    throw new Error("Missing required fields")
  }

  // Security Check: Ensure user actually bought this service via this order
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { review: true }
  })

  if (!order || order.buyerId !== session.user.id || (order.status !== "COMPLETED" && order.status !== "PAID")) {
    throw new Error("Unauthorized review attempt")
  }

  // Check if order already has a review
  if (order.review) {
    throw new Error("You have already reviewed this order")
  }

  // Create Review linked to the order
  await db.review.create({
    data: {
      rating,
      ratingProfessionalism: prof,
      ratingTimeliness: time,
      ratingQualityOfWork: qual,
      ratingCommunication: comm,
      comment,
      orderId,
      serviceId: serviceId || undefined,
      authorId: session.user.id,
    }
  })

  // Update Credibility Score
  if (rating >= 5) await updateCredibility(order.sellerId, "REVIEW_5_STAR")
  else if (rating >= 4) await updateCredibility(order.sellerId, "REVIEW_4_STAR")
  else if (rating < 3) await updateCredibility(order.sellerId, "REVIEW_LOW_RATING")

  revalidatePath(`/service-order/${orderId}`)
  revalidatePath(`/product-order/${orderId}`)
  if (serviceId) {
    revalidatePath(`/services/${serviceId}`)
  }
  revalidatePath(`/job-order/${orderId}`)
  revalidatePath(`/dashboard`)
}

export async function createClientReview(formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) return

  const orderId = formData.get("orderId") as string
  const ratingRequirements = parseInt(formData.get("ratingRequirements") as string) || 5
  const ratingPaymentPromptness = parseInt(formData.get("ratingPaymentPromptness") as string) || 5
  const ratingCommunication = parseInt(formData.get("ratingCommunication") as string) || 5
  const ratingCollaboration = parseInt(formData.get("ratingCollaboration") as string) || 5
  const comment = formData.get("comment") as string

  if (!orderId || !comment) {
    throw new Error("Missing required fields")
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { clientReview: true }
  })

  if (!order) {
    throw new Error("Order not found")
  }

  // Debug check: allow if seller OR if admin (for testing)
  const isSeller = order.sellerId === session.user.id
  const isCompleted = order.status === "COMPLETED" || order.status === "PAID"

  if (!isSeller) {
    throw new Error("You are not authorized to review this client as you are not the seller of this order.")
  }

  if (!isCompleted) {
    throw new Error(`You can only review the client once the order is COMPLETED or PAID. Current status: ${order.status}`)
  }

  if (order.clientReview) {
    throw new Error("You already reviewed this client")
  }

  const overallRating = Math.round(
    (ratingRequirements + ratingPaymentPromptness + ratingCommunication + ratingCollaboration) / 4
  )

  await db.clientReview.create({
    data: {
      rating: overallRating,
      ratingRequirements,
      ratingPaymentPromptness,
      ratingCommunication,
      ratingCollaboration,
      comment,
      authorId: session.user.id,
      clientId: order.buyerId,
      orderId,
    }
  })

  // Update Credibility Score for the client
  if (overallRating >= 5) await updateCredibility(order.buyerId, "REVIEW_5_STAR")
  else if (overallRating >= 4) await updateCredibility(order.buyerId, "REVIEW_4_STAR")
  else if (overallRating < 3) await updateCredibility(order.buyerId, "REVIEW_LOW_RATING")

  revalidatePath(`/service-order/${orderId}`)
  revalidatePath(`/product-order/${orderId}`)
  revalidatePath(`/job-order/${orderId}`)
  revalidatePath(`/dashboard`)
}
