const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const negotiation = await prisma.negotiation.findFirst({
    where: {
      jobId: 'd3ad4c28-4f1a-4523-bddf-2a9e0659eab2',
      applicationId: '3efe2438-7d75-4897-a242-cf111d5a0bf2'
    },
    select: {
      id: true,
      status: true,
      scopeConfirmedByClient: true,
      scopeConfirmedByFreelancer: true,
      clientId: true,
      freelancerId: true,
      scopeVersions: {
        select: {
          versionNumber: true,
          createdBy: true,
          isActive: true
        },
        orderBy: { versionNumber: 'desc' },
        take: 1
      }
    }
  });
  
  console.log('Current negotiation status:', negotiation);
  
  await prisma.$disconnect();
}

check();
