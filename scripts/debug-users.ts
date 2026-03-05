
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = ['shreyas', 'atrva']

    console.log('--- START DEBUG ---')
    for (const username of users) {
        console.log(`\nChecking user: ${username}`)
        const user = await prisma.user.findFirst({
            where: { username: { equals: username, mode: 'insensitive' } },
            include: {
                freelancerProfile: true,
                clientProfile: true,
                services: true,
                ordersBought: true,
                ordersSold: true
            }
        })

        if (!user) {
            console.log(`[FAIL] User '${username}' NOT FOUND in DB.`)
        } else {
            console.log(`[OK] User '${username}' found. ID: ${user.id}`)
            console.log(`Role: ${user.role}, ActiveProfile: ${user.activeProfile}`)
            console.log(`FreelancerProfile: ${user.freelancerProfile ? 'Present' : 'MISSING'}`)
            console.log(`ClientProfile: ${user.clientProfile ? 'Present' : 'MISSING'}`)
            // Check for specific fields that might crash the page
            if (user.activeProfile === 'SELLER' && !user.freelancerProfile) {
                console.log('[CRITICAL] User is SELLER but missing FreelancerProfile!')
            }
        }
    }
    console.log('\n--- END DEBUG ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
