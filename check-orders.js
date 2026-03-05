const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('=== Checking Recent Orders ===');
    
    // Check recent orders
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: {
            milestones: true
          }
        },
        buyer: { select: { username: true } },
        seller: { select: { username: true } }
      }
    });
    
    console.log(`Found ${orders.length} recent orders:`);
    orders.forEach((order, i) => {
      console.log(`\n${i+1}. Order ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Price: ₹${order.price}`);
      console.log(`   Buyer: ${order.buyer?.username}`);
      console.log(`   Seller: ${order.seller?.username}`);
      console.log(`   Has Project: ${order.project ? 'YES' : 'NO'}`);
      if (order.project) {
        console.log(`   Project Title: ${order.project.title}`);
        console.log(`   Milestones: ${order.project.milestones.length}`);
      }
    });
    
    // Check negotiations
    console.log('\n=== Checking Recent Negotiations ===');
    const negotiations = await prisma.negotiation.findMany({
      take: 3,
      orderBy: { updatedAt: 'desc' },
      include: {
        job: { select: { title: true } },
        application: { select: { status: true } }
      }
    });
    
    console.log(`Found ${negotiations.length} recent negotiations:`);
    negotiations.forEach((neg, i) => {
      console.log(`\n${i+1}. Negotiation ID: ${neg.id}`);
      console.log(`   Status: ${neg.status}`);
      console.log(`   Job: ${neg.job?.title}`);
      console.log(`   Application Status: ${neg.application?.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
