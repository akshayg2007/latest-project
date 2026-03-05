import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const email = "admin@truework.com"
    const password = "admin"
    const hashedPassword = await hash(password, 10)

    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: "ADMIN", password: hashedPassword },
        create: {
            email,
            username: "trueworkadmin",
            password: hashedPassword,
            role: "ADMIN",
            onboardingComplete: true,
            activeProfile: "BUYER",
        },
    })

    console.log(`✅ Admin user created/updated:`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Username: ${admin.username}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   ID: ${admin.id}`)
}

main()
    .catch((e) => {
        console.error("❌ Failed to seed admin:", e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
