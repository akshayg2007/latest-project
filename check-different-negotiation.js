const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDifferentNegotiation() {
    console.log('🔍 Checking Different Negotiation...\n');
    
    const negotiation = await prisma.negotiation.findFirst({
        where: {
            jobId: 'b7b674f6-fb0a-44a9-a7fe-e5fbd4488890',
            applicationId: '6595a7ff-492d-4ba8-a066-ea9fdde4c71a'
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
            } else {
                console.log('✅ Both parties confirmed execution - should be CONFIRMED');
            }
        } else {
            console.log('⏳ Scope not confirmed by both parties');
            if (!negotiation.scopeConfirmedByClient) {
                console.log('🔄 Client needs to confirm scope');
            }
            if (!negotiation.scopeConfirmedByFreelancer) {
                console.log('🔄 Freelancer needs to confirm scope');
            }
        }
        
        // Check if there's a project for this negotiation
        const project = await prisma.project.findFirst({
            where: {
                clientId: negotiation.clientId,
                freelancerId: negotiation.freelancerId
            }
        });
        
        if (project) {
            console.log('\n📋 Related Project Found:');
            console.log(`   Project ID: ${project.id}`);
            console.log(`   Status: ${project.status}`);
            console.log(`   Order ID: ${project.orderId}`);
        } else {
            console.log('\n❌ No project found for this negotiation');
        }
        
    } else {
        console.log('❌ No negotiation found');
    }
    
    await prisma.$disconnect();
}

checkDifferentNegotiation().catch(console.error);
