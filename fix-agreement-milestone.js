const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAgreementMilestone() {
    console.log('🔧 Fixing Agreement Milestone...\n');
    
    // Find the project and its agreement milestone
    const project = await prisma.project.findFirst({
        where: {
            clientId: '0515e36a-1f15-41cc-a51e-a01e9b563764',
            freelancerId: '9e713eae-d7e7-4401-be3b-20e71b7c3ff9'
        },
        include: {
            milestones: {
                where: { title: "Project Agreement" }
            },
            order: true
        }
    });
    
    if (project && project.milestones.length > 0) {
        const agreementMilestone = project.milestones[0];
        console.log('📄 Current Agreement Milestone:');
        console.log(`   Status: ${agreementMilestone.status}`);
        console.log(`   Description: ${agreementMilestone.description}`);
        
        // Since project has an order, both parties should have agreed
        const newAgreementData = {
            clientAgreed: true,
            freelancerAgreed: true,
            originalProposalId: "46893e26-57fd-41f2-a96f-00afbd3ffda7"
        };
        
        console.log('\n✅ Updating Agreement Milestone:');
        console.log(`   Client Agreed: ${newAgreementData.clientAgreed}`);
        console.log(`   Freelancer Agreed: ${newAgreementData.freelancerAgreed}`);
        
        // Update the agreement milestone
        const updated = await prisma.milestone.update({
            where: { id: agreementMilestone.id },
            data: {
                description: JSON.stringify(newAgreementData),
                status: 'APPROVED' // Mark as approved since both agreed
            }
        });
        
        console.log(`\n✅ Agreement milestone updated! Status: ${updated.status}`);
        console.log('🎉 Both parties now show as agreed!');
        
    } else {
        console.log('❌ No project or agreement milestone found');
    }
    
    await prisma.$disconnect();
}

fixAgreementMilestone().catch(console.error);
