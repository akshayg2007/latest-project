const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNegotiationHistory() {
    console.log('🔍 Checking Negotiation History...\n');
    
    const negotiation = await prisma.negotiation.findFirst({
        where: {
            jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
            applicationId: '3efe2438-7d75-4897-a242-cf111d5a0bf2'
        },
        include: {
            scopeVersions: {
                orderBy: { versionNumber: 'desc' },
                take: 3
            },
            executionVersions: {
                orderBy: { versionNumber: 'desc' },
                take: 3
            }
        }
    });
    
    if (negotiation) {
        console.log('📋 Negotiation Details:');
        console.log(`   Current Status: ${negotiation.status}`);
        console.log(`   Scope Confirmed - Client: ${negotiation.scopeConfirmedByClient}`);
        console.log(`   Scope Confirmed - Freelancer: ${negotiation.scopeConfirmedByFreelancer}`);
        console.log(`   Exec Confirmed - Client: ${negotiation.execConfirmedByClient}`);
        console.log(`   Exec Confirmed - Freelancer: ${negotiation.execConfirmedByFreelancer}\n`);
        
        console.log('📜 Scope Versions (last 3):');
        negotiation.scopeVersions.forEach((version, index) => {
            console.log(`   v${version.versionNumber} - Created by: ${version.createdBy} - Active: ${version.isActive}`);
        });
        
        console.log('\n⚙️ Execution Versions (last 3):');
        negotiation.executionVersions.forEach((version, index) => {
            console.log(`   v${version.versionNumber} - Created by: ${version.createdBy} - Active: ${version.isActive}`);
        });
        
        // Check if there's a newer negotiation for the same job
        const allNegotiations = await prisma.negotiation.findMany({
            where: {
                jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
                applicationId: '3efe2438-7d75-4897-a242-cf111d5a0bf2'
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        
        console.log('\n📈 All Negotiations (newest first):');
        allNegotiations.forEach((neg, index) => {
            console.log(`   ${index + 1}. Status: ${neg.status} - Created: ${neg.createdAt}`);
        });
        
        // Find the issue
        console.log('\n🔍 Analysis:');
        if (negotiation.status === 'REJECTED' && negotiation.scopeConfirmedByClient && negotiation.scopeConfirmedByFreelancer) {
            console.log('❌ ISSUE FOUND: Scope was confirmed but negotiation was rejected');
            console.log('🔧 This should not happen! Scope confirmation should lead to execution phase, not rejection.');
            console.log('💡 Possible cause: Execution phase was rejected, but status not properly updated.');
        }
        
    } else {
        console.log('❌ No negotiation found');
    }
    
    await prisma.$disconnect();
}

checkNegotiationHistory().catch(console.error);
