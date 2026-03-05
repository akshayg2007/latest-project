import { redirect } from "next/navigation"

export default async function AdminReviewsRedirect({
    searchParams
}: {
    searchParams: Promise<{ filter?: string; q?: string }>
}) {
    const { filter, q } = await searchParams
    const params = new URLSearchParams({ tab: 'reviews' })
    if (filter) params.set('status', filter === 'removed' ? 'REMOVED' : 'ACTIVE')
    if (q) params.set('q', q)
    redirect(`/admin/moderation?${params.toString()}`)
}
