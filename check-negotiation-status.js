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
      freelancerId: true
    }
  });
  
  console.log('Negotiation status:', negotiation);
  
  // Get user IDs for shreyas22 and shreyas33
  const shreyas22 = await prisma.user.findUnique({ where: { username: 'shreyas22' }, select: { id: true } });
  const shreyas33 = await prisma.user.findUnique({ where: { username: 'shreyas33' }, select: { id: true } });
  
  console.log('shreyas22 (freelancer):', shreyas22?.id);
  console.log('shreyas33 (client):', shreyas33?.id);
  
  if (negotiation) {
    console.log('Client confirmed:', negotiation.scopeConfirmedByClient);
    console.log('Freelancer confirmed:', negotiation.scopeConfirmedByFreelancer);
    console.log('Is shreyas22 freelancer?', negotiation.freelancerId === shreyas22?.id);
    console.log('Is shreyas33 client?', negotiation.clientId === shreyas33?.id);
  }
  
  await prisma.$disconnect();
}

check();
