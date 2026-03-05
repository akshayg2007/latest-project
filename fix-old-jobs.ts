import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const projects = await db.project.findMany({
        include: { milestones: true, order: true }
    })

    for (const project of projects) {
        if (!project.orderId) continue;

        let hasAgreement = project.milestones.some(m => m.title === "Project Agreement");
        let hasDev = project.milestones.some(m => m.title !== "Project Agreement");

        if (!hasAgreement) {
            await db.milestone.create({
                data: {
                    title: "Project Agreement",
                    description: JSON.stringify({
                        clientAgreed: true,
                        freelancerAgreed: true,
                        originalProposalId: null
                    }),
                    amount: 0,
                    status: 'APPROVED',
                    projectId: project.id
                }
            })
            console.log("Added Agreement to", project.id)
        }

        if (!hasDev && project.budget > 0) {
            await db.milestone.create({
                data: {
                    title: "Final Delivery",
                    description: "Complete project delivery",
                    amount: project.budget,
                    status: project.order?.status === "COMPLETED" ? 'APPROVED' : 'PENDING',
                    projectId: project.id
                }
            })
            console.log("Added Final Delivery to", project.id)
        }
    }
}

main().catch(console.error).finally(() => db.$disconnect())
