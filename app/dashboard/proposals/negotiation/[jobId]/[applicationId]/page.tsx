import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { openOrGetNegotiation } from "../../../../../actions/negotiation"

export const dynamic = 'force-dynamic'

export default async function NegotiationPage({ params }: { params: Promise<{ jobId: string, applicationId: string }> }) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { jobId, applicationId } = await params

    // Verify the application exists and user has access
    const application = await db.jobApplication.findUnique({
        where: { id: applicationId, jobId },
        include: { job: true }
    })

    if (!application) {
        return <div>Application not found</div>
    }

    // Check if user is client or freelancer
    const isClient = application.job.clientId === session.user.id
    const isFreelancer = application.freelancerId === session.user.id

    if (!isClient && !isFreelancer) {
        return <div>Unauthorized</div>
    }

    // Open or get existing negotiation
    const negotiation = await openOrGetNegotiation(applicationId)

    // Redirect to scope page to start the negotiation
    redirect(`/dashboard/proposals/negotiation/${jobId}/${applicationId}/scope`)
}
