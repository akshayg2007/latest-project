const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const service = await prisma.service.findFirst()
    const product = await prisma.product.findFirst()
    const job = await prisma.job.findFirst()
    const post = await prisma.post.findFirst()
    const user = await prisma.user.findFirst({ where: { role: 'USER' } })

    console.log('IDs Found:')
    console.log('Service:', service?.id)
    console.log('Product:', product?.id)
    console.log('Job:', job?.id)
    console.log('Post:', post?.id)
    console.log('User:', user?.username)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
