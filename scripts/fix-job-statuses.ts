
import { db } from "@/lib/db"

async function main() {
    console.log("Fixing job statuses...")

    // Find all jobs that have at least one accepted application but are still marked as OPEN
    const jobsToFix = await db.job.findMany({
        where: {
            status: 'OPEN',
            applications: {
                some: {
                    status: 'ACCEPTED'
                }
            }
        }
    })

    console.log(`Found ${jobsToFix.length} jobs to update.`)

    if (jobsToFix.length > 0) {
        const result = await db.job.updateMany({
            where: {
                id: { in: jobsToFix.map(j => j.id) }
            },
            data: {
                status: 'IN_PROGRESS'
            }
        })
        console.log(`Updated ${result.count} jobs to IN_PROGRESS.`)
    }

    console.log("Done.")
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
