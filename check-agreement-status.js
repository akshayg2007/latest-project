const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAgreementStatus() {
    console.log('🔍 Checking Agreement Status...\n');
    
    // Check negotiation status
    const negotiation = await prisma.negotiation.findFirst({
        where: {
            jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
            applicationId: '3efe2438-7d75-4897-a242-cf111d5a0bf2'
        },
        select: {
            id: true,
            status: true,
            scopeConfirmedByClient: true,
            scopeConfirmedByFreelancer: true,
            execConfirmedByClient: true,
            execConfirmedByFreelancer: true
        }
    });
    
    console.log('📋 Negotiation Status:');
    console.log(`   ID: ${negotiation?.id}`);
    console.log(`   Status: ${negotiation?.status}`);
    console.log(`   Scope Confirmed - Client: ${negotiation?.scopeConfirmedByClient}`);
    console.log(`   Scope Confirmed - Freelancer: ${negotiation?.scopeConfirmedByFreelancer}`);
    console.log(`   Exec Confirmed - Client: ${negotiation?.execConfirmedByClient}`);
    console.log(`   Exec Confirmed - Freelancer: ${negotiation?.execConfirmedByFreelancer}\n`);
    
    // Check project and agreement milestone
    const project = await prisma.project.findFirst({
        where: {
            clientId: '0515e36a-1f15-41cc-a51e-a01e9b563764',
            freelancerId: '9e713eae-d7e7-4401-be3b-20e71b7c3ff9'
        },
        include: {
            milestones: {
                where: { title: "Project Agreement" }
            }
        }
    });
    
    if (project) {
        console.log('📋 Project Found:');
        console.log(`   Project ID: ${project.id}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Order ID: ${project.orderId}\n`);
        
        const agreementMilestone = project.milestones[0];
        if (agreementMilestone) {
            console.log('📄 Agreement Milestone:');
            console.log(`   ID: ${agreementMilestone.id}`);
            console.log(`   Status: ${agreementMilestone.status}`);
            console.log(`   Description: ${agreementMilestone.description}`);
            
            try {
                const agreementData = JSON.parse(agreementMilestone.description || "{}");
                console.log(`   Client Agreed: ${agreementData.clientAgreed}`);
                console.log(`   Freelancer Agreed: ${agreementData.freelancerAgreed}`);
                console.log(`   Original Proposal ID: ${agreementData.originalProposalId}\n`);
                
                // Check if both should have agreed already
                const bothShouldHaveAgreed = negotiation?.status === 'CONFIRMED';
                console.log(`✅ Should both have agreed? ${bothShouldHaveAgreed ? 'YES' : 'NO'}`);
                
                if (bothShouldHaveAgreed && (!agreementData.clientAgreed || !agreementData.freelancerAgreed)) {
                    console.log('❌ PROBLEM: Negotiation confirmed but agreement milestone not updated!');
                    console.log('🔧 Need to fix: Auto-agree both parties when negotiation is confirmed');
                }
                
            } catch (e) {
                console.log('❌ Error parsing agreement data:', e.message);
            }
        } else {
            console.log('❌ No Agreement Milestone Found');
        }
    } else {
        console.log('❌ No Project Found');
    }
    
    await prisma.$disconnect();
}

checkAgreementStatus().catch(console.error);
