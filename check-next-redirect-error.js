const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNextRedirectError() {
    console.log('🔍 Checking NEXT_REDIRECT Error...\n');
    
    // Check the specific negotiation that's causing issues
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
        
        // Check if there are any redirect-related issues
        console.log('🔍 Checking for redirect issues...');
        
        // Check if status is correct for agreement phase
        if (negotiation.scopeConfirmedByClient && negotiation.scopeConfirmedByFreelancer) {
            console.log('✅ Both parties confirmed scope');
            console.log('📄 Should move to execution phase, not redirect');
            
            if (negotiation.status === 'CONFIRMED') {
                console.log('❌ PROBLEM: Negotiation is CONFIRMED but trying to agree to agreement');
                console.log('🔧 This should not happen - agreement is already completed');
            }
        }
        
        // Check for any status inconsistencies
        const expectedStatus = negotiation.scopeConfirmedByClient && negotiation.scopeConfirmedByFreelancer 
            ? (negotiation.execConfirmedByClient && negotiation.execConfirmedByFreelancer ? 'CONFIRMED' : 'EXEC_WAITING_CONFIRMATION')
            : 'SCOPE_CONFIRMED';
            
        console.log(`📊 Expected Status: ${expectedStatus}`);
        console.log(`📊 Actual Status: ${negotiation.status}`);
        
        if (negotiation.status !== expectedStatus) {
            console.log('❌ STATUS MISMATCH - This could cause redirect errors');
        }
        
        // Check for any active scope version issues
        const activeScopeVersion = negotiation.scopeVersions[0];
        if (activeScopeVersion) {
            console.log('📄 Active Scope Version:');
            console.log(`   Version: ${activeScopeVersion.versionNumber}`);
            console.log(`   Created by: ${activeScopeVersion.createdBy}`);
            console.log(`   Active: ${activeScopeVersion.isActive}`);
        }
        
    } else {
        console.log('❌ No negotiation found');
    }
    
    await prisma.$disconnect();
}

checkNextRedirectError().catch(console.error);
