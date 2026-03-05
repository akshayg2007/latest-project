const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentNegotiation() {
    console.log('🔍 Checking Current Negotiation State...\n');
    
    const negotiation = await prisma.negotiation.findFirst({
        where: {
            jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
            applicationId: '3efe2438-7d75-4897-a242-cf111d5a0bf2'
        },
        include: {
            scopeVersions: {
                orderBy: { versionNumber: 'desc' },
                take: 1
            },
            executionVersions: {
                orderBy: { versionNumber: 'desc' },
                take: 1
            }
        }
    });
    
    if (negotiation) {
        console.log('📋 Negotiation Status:');
        console.log(`   Status: ${negotiation.status}`);
        console.log(`   Scope Confirmed - Client: ${negotiation.scopeConfirmedByClient}`);
        console.log(`   Scope Confirmed - Freelancer: ${negotiation.scopeConfirmedByFreelancer}`);
        console.log(`   Exec Confirmed - Client: ${negotiation.execConfirmedByClient}`);
        console.log(`   Exec Confirmed - Freelancer: ${negotiation.execConfirmedByFreelancer}\n`);
        
        const activeScopeVersion = negotiation.scopeVersions[0];
        const activeExecVersion = negotiation.executionVersions[0];
        
        console.log('📜 Active Scope Version:');
        console.log(`   Version: ${activeScopeVersion?.versionNumber}`);
        console.log(`   Created by: ${activeScopeVersion?.createdBy}`);
        console.log(`   Active: ${activeScopeVersion?.isActive}\n`);
        
        console.log('⚙️ Active Execution Version:');
        console.log(`   Version: ${activeExecVersion?.versionNumber}`);
        console.log(`   Created by: ${activeExecVersion?.createdBy}`);
        console.log(`   Active: ${activeExecVersion?.isActive}\n`);
        
        // Check what should happen next
        if (negotiation.scopeConfirmedByClient && negotiation.scopeConfirmedByFreelancer) {
            console.log('✅ Both parties confirmed scope - should move to execution phase');
            
            if (!negotiation.execConfirmedByClient || !negotiation.execConfirmedByFreelancer) {
                console.log('⏳ Execution phase not completed - need both parties to confirm execution terms');
                
                if (activeExecVersion) {
                    console.log(`📄 Current execution version created by: ${activeExecVersion.createdBy}`);
                    
                    // Determine who needs to confirm
                    if (activeExecVersion.createdBy === 'client' && !negotiation.execConfirmedByFreelancer) {
                        console.log('🔄 Freelancer needs to confirm execution terms');
                    } else if (activeExecVersion.createdBy === 'freelancer' && !negotiation.execConfirmedByClient) {
                        console.log('🔄 Client needs to confirm execution terms');
                    } else {
                        console.log('🔄 Both parties need to confirm execution terms');
                    }
                } else {
                    console.log('❌ No execution version found - this is the problem!');
                }
            }
        }
        
    } else {
        console.log('❌ No negotiation found');
    }
    
    await prisma.$disconnect();
}

checkCurrentNegotiation().catch(console.error);
