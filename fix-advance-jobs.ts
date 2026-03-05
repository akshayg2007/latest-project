import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const projects = await db.project.findMany({
        include: { milestones: true, order: true }
    })

    const orders = await db.order.findMany({ include: { project: { include: { milestones: true } } } })

    for (const project of projects) {
        if (!project.orderId) continue;

        let hasAgreement = project.milestones.some(m => m.title === "Project Agreement");
        let devMilestones = project.milestones.filter(m => m.title !== "Project Agreement");

        // Find negotiation associated with this order
        const order = orders.find(o => o.id === project.orderId);
        if (!order) continue;

        const negotiation = await db.negotiation.findFirst({
            where: { jobId: project.title === 'Job Title' ? undefined : undefined, freelancerId: project.freelancerId, clientId: project.clientId },
            include: { executionVersions: { where: { isActive: true }, take: 1 } }
        });

        if (negotiation && negotiation.executionVersions.length > 0) {
            const exec = negotiation.executionVersions[0];

            // Check if it's advance but only has "Final Delivery" that covers 100% budget
            if (exec.paymentStructure === 'advance' && devMilestones.length === 1 && devMilestones[0].amount === project.budget) {
                const finalMilestoneId = devMilestones[0].id;

                const advanceAmt = Math.round(exec.finalBudget * (exec.advancePercent / 100));
                const finalAmt = Math.round(exec.finalBudget * ((100 - exec.advancePercent) / 100));

                // Update Final delivery
                await db.milestone.update({
                    where: { id: finalMilestoneId },
                    data: {
                        amount: finalAmt,
                        description: "Remaining balance for complete project delivery"
                    }
                });

                // Create Advance
                await db.milestone.create({
                    data: {
                        title: "Advance Payment",
                        amount: advanceAmt,
                        description: `Upfront payment of ${exec.advancePercent}% before work begins`,
                        status: 'PENDING',
                        projectId: project.id,
                        dueDate: exec.startDate || exec.deadline
                    }
                });
                console.log(`Split fixed milestone into advance + final for project: ${project.id}`);
            }
        }
    }
}

main().catch(console.error).finally(() => db.$disconnect())
