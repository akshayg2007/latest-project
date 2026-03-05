import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { AgreementView } from "./AgreementView"
import { WorkspaceView } from "./WorkspaceView"

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { projectId } = await params

    const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
            milestones: { orderBy: { createdAt: 'asc' } },
            client: true,
            freelancer: true,
            order: true // Still include order for potential future use
        }
    })

    if (!project) {
        return <div>Project not found</div>
    }

    // Redirect to modern order details page if linked to an order
    // TEMPORARILY DISABLED: Allow access to Project Workspace instead
    // if (project.orderId) {
    //     const order = await db.order.findUnique({
    //         where: { id: project.orderId }
    //     })
    //     if (order) {
    //         // Determine if it's a service order or job order
    //         if (order?.serviceId) {
    //             redirect(`/service-order/${order.id}`)
    //         } else if (order) {
    //             redirect(`/job-order/${order.id}`)
    //         }
    //     }
    // }

    // Check if user is authorized
    if (project.clientId !== session.user.id && project.freelancerId !== session.user.id) {
        return <div>Unauthorized</div>
    }

    // Check for Agreement Milestone
    const agreementMilestone = project.milestones.find(m => m.title === "Project Agreement")

    // If we have an agreement milestone and it is PENDING, show Agreement View
    // BUT we also need to check if *both* have agreed. 
    // Actually, simpler: if the milestone status is APPROVED, it means both agreed (logic in server action).
    // If it is PENDING, we show the Agreement UI.

    if (agreementMilestone && agreementMilestone.status === 'PENDING') {
        const agreementData = JSON.parse(agreementMilestone.description || "{}")
        return (
            <AgreementView
                project={project}
                agreementData={{
                    clientAgreed: agreementData.clientAgreed || false,
                    freelancerAgreed: agreementData.freelancerAgreed || false
                }}
                currentUserId={session.user.id}
            />
        )
    }

    // Otherwise, show active workspace
    const userRole = project.clientId === session.user.id ? 'client' : 'freelancer'
    
    // Map project data to match WorkspaceView interface
    const mappedProject = {
        ...project,
        description: project.description || undefined,
        deadline: project.deadline || undefined,
        progress: (project.milestones.filter((m: any) => m.status === 'APPROVED').length / project.milestones.length) * 100 || 0,
        client: {
            id: project.client.id,
            name: project.client.username,
            email: project.client.email
        },
        freelancer: {
            id: project.freelancer.id,
            name: project.freelancer.username,
            email: project.freelancer.email
        }
    }
    
    return (
        <WorkspaceView 
            project={mappedProject} 
            currentUserId={session.user.id}
            userRole={userRole}
        />
    )
}
