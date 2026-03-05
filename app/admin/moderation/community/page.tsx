import { redirect } from "next/navigation"

export default async function AdminCommunityRedirect({
    searchParams
}: {
    searchParams: Promise<{ filter?: string; type?: string; q?: string }>
}) {
    const { filter, type, q } = await searchParams
    const params = new URLSearchParams({ tab: 'community' })
    if (filter) params.set('status', filter === 'removed' ? 'REMOVED' : 'ACTIVE')
    if (type) params.set('type', type)
    if (q) params.set('q', q)
    redirect(`/admin/moderation?${params.toString()}`)
}
