import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import PlanClient from "./PlanClient"

interface Props {
    params: {
        jobId: string
        applicationId: string
    }
}

export default async function PlanNegotiationPage({ params }: Props) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { jobId, applicationId } = await params

    const negotiation = await db.negotiation.findFirst({
        where: {
            jobId,
            applicationId
        },
        include: {
            executionVersions: {
                orderBy: { versionNumber: 'desc' },
                include: { milestones: true }
            },
            scopeVersions: {
                orderBy: { versionNumber: 'desc' }
            },
            job: true,
            freelancer: {
                select: { username: true, avatarUrl: true }
            },
            client: {
                select: { username: true, avatarUrl: true }
            }
        }
    })

    if (!negotiation) return notFound()

    const role = session.user.id === negotiation.clientId ? "client" : "freelancer"

    return (
        <PlanClient
            negotiation={negotiation as any}
            role={role}
            userId={session.user.id}
            applicationId={applicationId}
        />
    )
}
