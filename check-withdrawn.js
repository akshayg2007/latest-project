const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const allApps = await prisma.jobApplication.findMany({
    where: { 
      jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
      freelancerId: 'shreyas22' 
    },
    select: { id: true, status: true, createdAt: true, proposedBudget: true, coverLetter: true }
  });
  console.log('All applications for this job:');
  allApps.forEach(app => {
    console.log(`- ID: ${app.id.slice(0, 8)}, Status: ${app.status}, Budget: ${app.proposedBudget}, Created: ${app.createdAt}`);
  });
  await prisma.$disconnect();
}

check();
