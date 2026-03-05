const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // First get shreyas22's user ID
  const user = await prisma.user.findUnique({
    where: { username: 'shreyas22' },
    select: { id: true }
  });
  
  console.log('shreyas22 user ID:', user?.id);
  
  if (user) {
    const allApps = await prisma.jobApplication.findMany({
      where: { 
        jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
        freelancerId: user.id 
      },
      select: { id: true, status: true, createdAt: true, proposedBudget: true }
    });
    console.log('Applications by user ID:');
    allApps.forEach(app => {
      console.log(`- ID: ${app.id.slice(0, 8)}, Status: ${app.status}, Budget: ${app.proposedBudget}`);
    });
  }
  
  await prisma.$disconnect();
}

check();
