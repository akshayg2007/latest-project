const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectSetup() {
    console.log('🔍 Checking Project Setup Implementation...\n');
    
    // 1. Check if project exists from negotiation
    const project = await prisma.project.findFirst({
        where: {
            clientId: '0515e36a-1f15-41cc-a51e-a01e9b563764', // client
            freelancerId: '9e713eae-d7e7-4401-be3b-20e71b7c3ff9' // freelancer (shreyas22)
        },
        include: {
            milestones: true,
            client: true,
            freelancer: true,
            order: true
        }
    });
    
    if (project) {
        console.log('✅ Project Found:');
        console.log(`   Title: ${project.title}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Progress: ${project.progress}%`);
        console.log(`   Milestones: ${project.milestones.length}`);
        console.log(`   Order ID: ${project.orderId}`);
        console.log(`   Created: ${project.createdAt}\n`);
        
        // 2. Check milestones
        console.log('📋 Milestones:');
        project.milestones.forEach((milestone, index) => {
            console.log(`   ${index + 1}. ${milestone.title} - ${milestone.status} - ₹${milestone.amount}`);
        });
        console.log('');
        
        // 3. Check order
        if (project.order) {
            console.log('💰 Order Found:');
            console.log(`   Order ID: ${project.order.id}`);
            console.log(`   Status: ${project.order.status}`);
            console.log(`   Price: ₹${project.order.price}`);
            console.log(`   Buyer: ${project.order.buyerId}`);
            console.log(`   Seller: ${project.order.sellerId}\n`);
        } else {
            console.log('❌ No Order Found\n');
        }
        
        console.log(`🌐 Test URLs:`);
        console.log(`   Project Workspace: http://localhost:3000/dashboard/projects/active/${project.id}`);
        console.log(`   Job Order: http://localhost:3000/job-order/${project.orderId || 'order-id'}`);
        
    } else {
        console.log('❌ No Project Found - Complete negotiation first!');
        console.log('\n📝 To create project:');
        console.log('   1. Go to: http://localhost:3000/dashboard/proposals/negotiation/d3ad4c28-4f1a-4523-bddf-2a9e0659eab2/3efe2438-7d75-4897-a242-cf111d5a0bf2/scope');
        console.log('   2. Click "Confirm My Changes →" as freelancer');
        console.log('   3. Project should be created automatically');
    }
    
    await prisma.$disconnect();
}

checkProjectSetup().catch(console.error);
