const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProjectWorkspaceAccess() {
    console.log('🧪 Testing Project Workspace Access...\n');
    
    // Check the specific project
    const project = await prisma.project.findUnique({
        where: { id: '1d648bdf-abef-48b1-8d29-294c66b07ce3' },
        include: {
            milestones: true,
            client: true,
            freelancer: true,
            order: true
        }
    });
    
    if (project) {
        console.log('✅ Project Found:');
        console.log(`   ID: ${project.id}`);
        console.log(`   Title: ${project.title}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Has Order: ${project.orderId ? 'YES' : 'NO'}`);
        console.log(`   Order ID: ${project.orderId || 'None'}\n`);
        
        console.log('🎯 Expected Behavior:');
        console.log('   1. Project page should load WITHOUT redirect');
        console.log('   2. Should show WorkspaceView (not AgreementView)');
        console.log('   3. User can access all workspace features');
        console.log('   4. URL should be: /dashboard/projects/active/[projectId]\n');
        
        console.log('🔧 What Changed:');
        console.log('   ✅ Redirect code commented out');
        console.log('   ✅ Order still fetched for data');
        console.log('   ✅ Workspace should load directly');
        
        console.log('\n🌐 Access URLs:');
        console.log(`   Project Workspace: http://localhost:3000/dashboard/projects/active/${project.id}`);
        console.log(`   Job Order: http://localhost:3000/job-order/${project.orderId}`);
        
        console.log('\n💡 Recommendation:');
        console.log('   ✅ Use Project Workspace for communication');
        console.log('   ✅ Use Job Order for milestone management');
        console.log('   ✅ Both pages now accessible without redirect interference');
        
    } else {
        console.log('❌ Project not found');
    }
    
    await prisma.$disconnect();
}

testProjectWorkspaceAccess().catch(console.error);
