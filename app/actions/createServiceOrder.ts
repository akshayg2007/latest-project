"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/notifications"
import { checkUserRestriction } from "@/lib/checkSuspension"

export async function createServiceOrder(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) return redirect("/api/auth/signin")

  const restriction = await checkUserRestriction(session.user.id)
  if (restriction) throw new Error(restriction)

  const serviceId = formData.get("serviceId") as string
  if (!serviceId) return

  const service = await db.service.findUnique({
    where: { id: serviceId }
  })

  if (!service) {
    throw new Error("Service not found")
  }

  // 1. Create Order
  const deadline = service.deliveryTime
    ? new Date(Date.now() + service.deliveryTime * 60 * 60 * 1000)
    : null

  const paymentSteps = (service as any).paymentSteps as any[] | null
  const hasMilestones = paymentSteps && paymentSteps.length > 0

  const order = await db.order.create({
    data: {
      price: service.price,
      status: hasMilestones ? "IN_PROGRESS" : "PAID",
      buyerId: session.user.id,
      sellerId: service.sellerId,
      serviceId: service.id,
      deadline: deadline,
      revisionsRemaining: service.revisions ? (isNaN(parseInt(service.revisions)) ? 10 : parseInt(service.revisions)) : 0
    }
  })

  // 2. If service has paymentSteps, create a Project and Milestones
  let projectId: string | null = null

  if (paymentSteps && paymentSteps.length > 0) {
    const project = await db.project.create({
      data: {
        title: service.title,
        description: service.description,
        status: "ACTIVE",
        budget: service.price,
        deadline: deadline,
        clientId: session.user.id,
        freelancerId: service.sellerId,
        orderId: order.id,
        clientAgreed: true,
        freelancerAgreed: true,
        progress: 0,
        milestones: {
          create: paymentSteps.map((step) => ({
            title: step.title,
            description: step.description,
            amount: Math.round(service.price * (parseInt(step.percentage) || 0) / 100),
            status: "PENDING"
          }))
        }
      }
    })
    projectId = project.id
  }

  // 3. Send Notification
  await createNotification(
    service.sellerId,
    `New service order for ${service.title}!`,
    `/service-order/${order.id}`
  )

  // 4. Redirect
  redirect(`/service-order/${order.id}`)
}