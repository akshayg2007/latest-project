import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

import { JobsClient } from "./JobsClient"

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const userId = session.user.id

    // Fetch user's created jobs (only jobs posted by current user)
    const jobs = await db.job.findMany({
        where: {
            clientId: userId, // Only show jobs created by this user
            isRemoved: false,
        },
        include: {
            client: true,
            applications: true
        },
        orderBy: { createdAt: 'desc' }
    })

    const transformedJobs = jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.client.username,
        avatarUrl: job.client.avatarUrl,
        description: job.description, //.substring(0, 100) + '...', // Don't truncate here, might be needed for the card
        budget: job.budget,
        budgetType: job.budgetType,
        skills: job.skills,

        applicants: job.applications.length,
        posted: formatDistanceToNow(job.createdAt, { addSuffix: true }),
        hasApplied: false, // User can't apply to their own jobs
        category: job.category,
        status: job.status,
        experienceLevel: job.experienceLevel,
        createdAt: job.createdAt.getTime(),
        deadline: job.deadline ? job.deadline.toISOString() : null
    }))

    const totalJobs = transformedJobs.length
    const activeJobs = transformedJobs.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS').length
    const totalApplicants = transformedJobs.reduce((sum, job) => sum + job.applicants, 0)
    const hiredJobs = transformedJobs.filter(j => j.status === 'COMPLETED').length

    return (
        <JobsClient
            initialJobs={transformedJobs}
            totalJobs={totalJobs}
            activeJobs={activeJobs}
            totalApplicants={totalApplicants}
            hiredJobs={hiredJobs}
        />
    )
}
