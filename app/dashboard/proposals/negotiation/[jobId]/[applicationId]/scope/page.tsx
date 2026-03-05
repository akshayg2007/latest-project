import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import ScopeClient from "./ScopeClient"

interface Props {
    params: {
        jobId: string
        applicationId: string
    }
}

export default async function ScopeNegotiationPage({ params }: Props) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { jobId, applicationId } = await params

    const negotiation = await db.negotiation.findFirst({
        where: {
            jobId,
            applicationId
        },
        include: {
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

    if (!negotiation) {
        // If not exists, maybe we need to create it? 
        // But usually it should be created when someone is shortlisted OR when first opened.
        // Let's assume it should exist if they reached here.
        return notFound()
    }

    const role = session.user.id === negotiation.clientId ? "client" : "freelancer"

    return (
        <ScopeClient
            negotiation={negotiation as any}
            job={negotiation.job}
            role={role}
            userId={session.user.id}
            applicationId={applicationId}
        />
    )
}
