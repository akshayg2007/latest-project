const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFreelancerConfirmation() {
    console.log('🔧 Fixing Freelancer Confirmation...\n');
    
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
        console.log(`   Exec Confirmed - Freelancer: ${negotiation.execConfirmedByFreelancer}`);
        console.log(`   Scope Confirmed - Client: ${negotiation.scopeConfirmedByClient}`);
        console.log(`   Scope Confirmed - Freelancer: ${negotiation.scopeConfirmedByFreelancer}\n`);
        
        // Since both parties confirmed scope and client confirmed execution,
        // the freelancer should be able to confirm their own execution terms
        if (negotiation.scopeConfirmedByClient && 
            negotiation.scopeConfirmedByFreelancer && 
            negotiation.execConfirmedByClient && 
            !negotiation.execConfirmedByFreelancer) {
            
            console.log('✅ Freelancer should be able to confirm their own execution terms');
            console.log('🔧 Setting execConfirmedByFreelancer to true');
            
            const updated = await prisma.negotiation.update({
                where: { id: negotiation.id },
                data: {
                    execConfirmedByFreelancer: true
                }
            });
            
            console.log(`✅ Updated: execConfirmedByFreelancer = ${updated.execConfirmedByFreelancer}`);
            
            // Also update status to EXEC_WAITING_CONFIRMATION since both confirmed
            const finalUpdate = await prisma.negotiation.update({
                where: { id: negotiation.id },
                data: {
                    status: 'EXEC_WAITING_CONFIRMATION'
                }
            });
            
            console.log(`✅ Status updated to: ${finalUpdate.status}`);
            console.log('🎉 Now freelancer should see "Complete Final Review" button!');
            
        } else {
            console.log('❌ Conditions not met for freelancer confirmation');
        }
        
    } else {
        console.log('❌ No negotiation found');
    }
    
    await prisma.$disconnect();
}

fixFreelancerConfirmation().catch(console.error);
