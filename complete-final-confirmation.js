const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeFinalConfirmation() {
    console.log('🎯 Completing Final Confirmation...\n');
    
    const negotiation = await prisma.negotiation.findFirst({
        where: {
            jobId: 'b7b674f6-fb0a-44a9-a7fe-e5fbd4488890',
            applicationId: '6595a7ff-492d-4ba8-a066-ea9fdde4c71a'
        }
    });
    
    if (negotiation) {
        console.log('📋 Current Status:');
        console.log(`   Status: ${negotiation.status}`);
        console.log(`   Exec Confirmed - Client: ${negotiation.execConfirmedByClient}`);
        console.log(`   Exec Confirmed - Freelancer: ${negotiation.execConfirmedByFreelancer}\n`);
        
        // Since both parties confirmed execution, set status to CONFIRMED
        if (negotiation.execConfirmedByClient && negotiation.execConfirmedByFreelancer) {
            console.log('✅ Both parties confirmed execution - setting status to CONFIRMED');
            
            const updated = await prisma.negotiation.update({
                where: { id: negotiation.id },
                data: {
                    status: 'CONFIRMED'
                }
            });
            
            console.log(`✅ Final status: ${updated.status}`);
            console.log('🎉 Negotiation completed successfully!');
            console.log('📋 Both parties should now see completed negotiation');
            
        } else {
            console.log('❌ Both parties have not confirmed execution yet');
        }
        
    } else {
        console.log('❌ No negotiation found');
    }
    
    await prisma.$disconnect();
}

completeFinalConfirmation().catch(console.error);
