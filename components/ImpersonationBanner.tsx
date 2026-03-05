"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Shield, UserMinus } from "lucide-react"
import { SignOutPopup } from "./SignOutPopup"
import { stopImpersonating } from "@/app/actions/adminActions"
import { useRouter } from "next/navigation"

export function ImpersonationBanner() {
    const { data: session, update } = useSession()
    const [isExitOpen, setIsExitOpen] = useState(false)
    const router = useRouter()

    // @ts-ignore
    const impersonatingFromId = session?.user?.impersonatingFromId
    const isImpersonating = !!impersonatingFromId && impersonatingFromId !== null

    if (!isImpersonating) return null

    const handleExitMode = async () => {
        try {
            const adminData = await stopImpersonating()

            // Update the session back to the admin's original data
            await update(adminData)

            // Redirect back to admin dashboard
            router.push("/admin/users")
            router.refresh()
        } catch (error: any) {
            alert(error.message || "Failed to exit impersonation")
        }
    }

    return (
        <>
            <div className="bg-slate-900 text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
                    <div className="bg-amber-500 p-1.5 rounded-lg">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Impersonation Mode</p>
                        <span className="text-white/20 text-xs">|</span>
                        <p className="text-sm font-medium">
                            Viewing site as <strong className="font-black text-amber-50">@{session?.user?.name}</strong>
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExitOpen(true)}
                        className="ml-auto bg-white/5 hover:bg-white text-white hover:text-slate-900 font-black text-[10px] uppercase tracking-widest h-8 px-4 rounded-full border border-white/10 transition-all"
                    >
                        <UserMinus className="w-3 h-3 mr-2" />
                        Restore Admin
                    </Button>
                </div>
            </div>

            <SignOutPopup
                isOpen={isExitOpen}
                onClose={() => setIsExitOpen(false)}
                onConfirm={handleExitMode}
                title="Restore Admin Session?"
                description="This will end the impersonation and return you to your administrator account immediately. You won't need to log in again."
                confirmText="Restore Access"
            />
        </>
    )
}
