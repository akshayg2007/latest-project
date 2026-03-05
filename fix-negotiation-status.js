const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNegotiationStatus() {
    console.log('🔧 Fixing Negotiation Status...\n');
    
    const negotiation = await prisma.negotiation.findFirst({
        where: {
            jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
            applicationId: '3efe2438-7d75-4897-a242-cf111d5a0bf2'
        }
    });
    
    if (negotiation) {
        console.log('📋 Current Status:');
        console.log(`   Status: ${negotiation.status}`);
        console.log(`   Scope Confirmed - Client: ${negotiation.scopeConfirmedByClient}`);
        console.log(`   Scope Confirmed - Freelancer: ${negotiation.scopeConfirmedByFreelancer}`);
        console.log(`   Exec Confirmed - Client: ${negotiation.execConfirmedByClient}`);
        console.log(`   Exec Confirmed - Freelancer: ${negotiation.execConfirmedByFreelancer}\n`);
        
        // Since both parties confirmed scope, status should be EXECUTION_PENDING
        if (negotiation.scopeConfirmedByClient && negotiation.scopeConfirmedByFreelancer) {
            console.log('✅ Both parties confirmed scope - updating status to EXECUTION_PENDING');
            
            const updated = await prisma.negotiation.update({
                where: { id: negotiation.id },
                data: {
                    status: 'EXECUTION_PENDING'
                }
            });
            
            console.log(`✅ Negotiation status updated: ${updated.status}`);
            console.log('🎉 Now the negotiation flow can continue properly!');
            
        } else {
            console.log('❌ Scope not confirmed by both parties - cannot fix');
        }
        
    } else {
        console.log('❌ No negotiation found');
    }
    
    await prisma.$disconnect();
}

fixNegotiationStatus().catch(console.error);
