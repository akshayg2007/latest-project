import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "admin@truework.com" }
    })
    console.log("Admin User found:", user ? JSON.stringify(user, null, 2) : "Not found")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
