import { redirect } from "next/navigation"

export default async function AdminReportsRedirect({
    searchParams
}: {
    searchParams: Promise<{ status?: string; type?: string; reason?: string; q?: string }>
}) {
    const { status, type, reason, q } = await searchParams
    const params = new URLSearchParams({ tab: 'reports' })
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    if (reason) params.set('reason', reason)
    if (q) params.set('q', q)
    redirect(`/admin/moderation?${params.toString()}`)
}
