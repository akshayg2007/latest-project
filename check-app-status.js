const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const apps = await prisma.jobApplication.findMany({
    where: { 
      jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
      freelancerId: 'shreyas22' 
    },
    select: { id: true, status: true }
  });
  console.log('Applications for this job:', apps);
  await prisma.$disconnect();
}

check();
