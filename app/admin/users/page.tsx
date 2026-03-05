import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImpersonateButton } from "@/components/ImpersonateButton"
import { UserSearch } from "@/components/user-search"
import { UserActions } from "@/components/admin/UserActions"
import { ExternalLink } from "lucide-react"

export default async function AdminUsersPage({
    searchParams
}: {
    searchParams: Promise<{ query?: string }>
}) {
    const { query } = await searchParams
    const session = await auth()

    // Safety check: Ensure user is actually an admin
    if (!session?.user) redirect("/signin")

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, id: true }
    })

    if (currentUser?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const users = await db.user.findMany({
        where: query ? {
            OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
            ]
        } : {},
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            role: true,
            activeProfile: true,
            createdAt: true,
            isOnline: true,
            isBanned: true,
            banReason: true,
            suspendedUntil: true,
            suspensionReason: true,
            isShadowBanned: true,
        }
    })

    function getUserStatus(user: typeof users[0]) {
        if (user.isBanned) return "BANNED"
        if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) return "SUSPENDED"
        if (user.isShadowBanned) return "SHADOW_BANNED"
        return user.isOnline ? "ONLINE" : "OFFLINE"
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case "BANNED":
                return (
                    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 font-bold text-[10px] tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                        BANNED
                    </Badge>
                )
            case "SUSPENDED":
                return (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 font-bold text-[10px] tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                        SUSPENDED
                    </Badge>
                )
            case "SHADOW_BANNED":
                return (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold text-[10px] tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
                        SHADOW
                    </Badge>
                )
            case "ONLINE":
                return (
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-500">Online</span>
                    </div>
                )
            default:
                return (
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <span className="text-xs font-bold text-slate-500">Offline</span>
                    </div>
                )
        }
    }

    const bannedCount = users.filter(u => u.isBanned).length
    const suspendedCount = users.filter(u => u.suspendedUntil && new Date(u.suspendedUntil) > new Date()).length

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        User Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">View and manage all platform users</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <UserSearch />
                    <div className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold whitespace-nowrap">
                        {users.length} Total Users
                    </div>
                    {bannedCount > 0 && (
                        <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold whitespace-nowrap border border-red-200">
                            {bannedCount} Banned
                        </div>
                    )}
                    {suspendedCount > 0 && (
                        <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold whitespace-nowrap border border-amber-200">
                            {suspendedCount} Suspended
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-900">User</TableHead>
                            <TableHead className="font-bold text-slate-900">Email</TableHead>
                            <TableHead className="font-bold text-slate-900">Role</TableHead>
                            <TableHead className="font-bold text-slate-900">Profile</TableHead>
                            <TableHead className="font-bold text-slate-900">Joined</TableHead>
                            <TableHead className="font-bold text-slate-900">Status</TableHead>
                            <TableHead className="font-bold text-slate-900 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => {
                            const status = getUserStatus(user)
                            return (
                                <TableRow
                                    key={user.id}
                                    className={`hover:bg-slate-50/50 transition-colors ${status === "BANNED" ? "bg-red-50/30" :
                                        status === "SUSPENDED" ? "bg-amber-50/30" : ""
                                        }`}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className={`w-9 h-9 border ${status === "BANNED" ? "border-red-300 opacity-60" :
                                                    status === "SUSPENDED" ? "border-amber-300" :
                                                        "border-slate-200"
                                                    }`}>
                                                    <AvatarImage src={user.avatarUrl || ""} />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                                                        {user.username.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${status === "BANNED" ? "text-red-800 line-through" : "text-slate-900"}`}>
                                                    @{user.username}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{user.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge className={user.role === "ADMIN" ? "bg-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-100 border-none"}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-bold border-slate-200">
                                            {user.activeProfile}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div
                                            className="inline-block cursor-default"
                                            title={
                                                status === "BANNED"
                                                    ? `Reason: ${user.banReason || "No reason provided"}`
                                                    : status === "SUSPENDED"
                                                        ? `Until: ${user.suspendedUntil ? new Date(user.suspendedUntil).toLocaleDateString() : "N/A"}${user.suspensionReason ? `\nReason: ${user.suspensionReason}` : ""}`
                                                        : undefined
                                            }
                                        >
                                            {getStatusBadge(status)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/users/${user.username}`}
                                                target="_blank"
                                                className="inline-flex items-center justify-center h-8 px-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-lg transition-all group"
                                            >
                                                <ExternalLink className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                                                View
                                            </Link>
                                            {user.id !== currentUser?.id && (
                                                <>
                                                    <ImpersonateButton userId={user.id} username={user.username} />
                                                    <UserActions
                                                        userId={user.id}
                                                        username={user.username}
                                                        isBanned={user.isBanned}
                                                        suspendedUntil={user.suspendedUntil}
                                                        suspensionReason={user.suspensionReason}
                                                        banReason={user.banReason}
                                                        isShadowBanned={user.isShadowBanned}
                                                        isAdmin={user.role === "ADMIN"}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
