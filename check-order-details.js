const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrderDetails() {
    console.log('🔍 Checking Order Details...\n');
    
    const order = await prisma.order.findUnique({
        where: { id: 'c1ff9e2f-bda2-4378-bee5-ce468ad22d31' },
        include: {
            project: {
                include: {
                    milestones: true,
                    client: true,
                    freelancer: true
                }
            }
        }
    });
    
    if (order) {
        console.log('✅ Order Found:');
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Price: ₹${order.price}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Revisions: ${order.revisionsRemaining}\n`);
        
        if (order.project) {
            console.log('📋 Linked Project:');
            console.log(`   Project ID: ${order.project.id}`);
            console.log(`   Title: ${order.project.title}`);
            console.log(`   Status: ${order.project.status}`);
            console.log(`   Milestones: ${order.project.milestones.length}\n`);
            
            console.log('📊 Project Milestones:');
            order.project.milestones.forEach((milestone, index) => {
                console.log(`   ${index + 1}. ${milestone.title}`);
                console.log(`      Status: ${milestone.status}`);
                console.log(`      Amount: ₹${milestone.amount}`);
                console.log(`      Due: ${milestone.dueDate || 'Not set'}`);
                console.log(`      Delivery: ${milestone.deliveryUrl || 'Not submitted'}\n`);
            });
        }
        
        console.log('🌐 Where to test what:');
        console.log(`   Job-Order Page: http://localhost:3000/job-order/${order.id}`);
        console.log(`   Project Workspace: http://localhost:3000/dashboard/projects/active/${order.project.id}`);
        console.log('\n💡 Both pages work for different purposes:');
        console.log('   • Job-Order: Payments, milestone submissions, approvals');
        console.log('   • Project Workspace: Chat, files, collaboration');
        
    } else {
        console.log('❌ Order Not Found');
    }
    
    await prisma.$disconnect();
}

checkOrderDetails().catch(console.error);
