import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Settings, Shield, User, Database, Globe, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PromoteAdminForm } from "@/components/admin/PromoteAdminForm"

export default async function AdminSettingsPage() {
    const session = await auth()
    if (!session?.user) redirect("/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatarUrl: true,
            createdAt: true
        }
    })

    if (user?.role !== "ADMIN") redirect("/dashboard")

    const [totalUsers, totalOrders, totalServices, totalProducts, allAdmins] = await Promise.all([
        db.user.count(),
        db.order.count(),
        db.service.count(),
        db.product.count(),
        db.user.findMany({
            where: { role: "ADMIN" },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        })
    ])

    const dbUrl = process.env.DATABASE_URL || ""
    const dbProvider = dbUrl.includes("neon.tech")
        ? "Prisma + PostgreSQL (Neon)"
        : dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")
            ? "Prisma + PostgreSQL (Local)"
            : "Prisma + Database"

    const uploadsConfigured = !!(process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET)
    const nextVersion = "16.1.1" // From package.json
    const authVersion = "5.0.0-beta.30" // From package.json

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-blue-600" />
                    Admin Settings
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage your admin account and platform configuration</p>
            </div>

            {/* ADMIN ACCOUNT */}
            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        Admin Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <Shield className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg">@{user.username}</span>
                            <span className="text-sm text-slate-500">{user.email}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-slate-900 text-white text-[8px] font-black border-none">{user.role}</Badge>
                                <span className="text-[10px] text-slate-400">Since {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User ID</p>
                            <p className="text-xs font-mono text-slate-600 mt-1 truncate">{user.id}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                            <p className="text-xs font-bold text-slate-900 mt-1">{user.role}</p>
                        </div>
                    </div>

                    <Separator />

                    <PromoteAdminForm admins={allAdmins} currentUserId={user.id} />
                </CardContent>
            </Card>

            {/* PLATFORM STATUS */}
            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        Platform Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-2xl font-black text-slate-900">{totalUsers}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Users</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-2xl font-black text-slate-900">{totalOrders}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Orders</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-2xl font-black text-slate-900">{totalServices}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Services</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-2xl font-black text-slate-900">{totalProducts}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Products</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SECURITY */}
            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-600" />
                        Security & Access
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                            <p className="text-sm font-bold text-slate-900">Authentication Provider</p>
                            <p className="text-xs text-slate-500 mt-0.5">NextAuth.js {authVersion}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-bold">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                            <p className="text-sm font-bold text-slate-900">Database Connection</p>
                            <p className="text-xs text-slate-500 mt-0.5">{dbProvider}</p>
                        </div>
                        <Badge className={dbUrl ? "bg-emerald-100 text-emerald-700 border-none text-[9px] font-bold" : "bg-red-100 text-red-700 border-none text-[9px] font-bold"}>
                            {dbUrl ? "Connected" : "Disconnected"}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                            <p className="text-sm font-bold text-slate-900">File Uploads</p>
                            <p className="text-xs text-slate-500 mt-0.5">Uploadthing</p>
                        </div>
                        <Badge className={uploadsConfigured ? "bg-emerald-100 text-emerald-700 border-none text-[9px] font-bold" : "bg-amber-100 text-amber-700 border-none text-[9px] font-bold"}>
                            {uploadsConfigured ? "Configured" : "Missing API Key"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* ENVIRONMENT */}
            <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        Environment
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Framework</p>
                            <p className="text-xs font-bold text-slate-900 mt-1">Next.js {nextVersion}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORM</p>
                            <p className="text-xs font-bold text-slate-900 mt-1">Prisma 6.19.1</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment</p>
                            <p className="text-xs font-bold text-slate-900 mt-1 capitalize">{process.env.NODE_ENV}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Runtime</p>
                            <p className="text-xs font-bold text-slate-900 mt-1">{process.version}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
