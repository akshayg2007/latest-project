"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Loader2, ShieldCheck } from "lucide-react"
import { useSession } from "next-auth/react"
import { impersonateUser } from "@/app/actions/adminActions"
import { useRouter } from "next/navigation"
import { SignOutPopup } from "./SignOutPopup"

export function ImpersonateButton({ userId, username }: { userId: string, username: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const { update } = useSession()
    const router = useRouter()

    const handleImpersonate = async () => {
        setIsLoading(true)
        try {
            const result = await impersonateUser(userId)

            // Update the session in the browser
            await update(result)

            // Redirect to dashboard to see what they see
            router.push("/dashboard")
            router.refresh()
        } catch (error: any) {
            alert(error.message || "Failed to impersonate user")
        } finally {
            setIsLoading(false)
            setIsPopupOpen(false)
        }
    }

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPopupOpen(true)}
                disabled={isLoading}
                className="h-8 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-lg group"
            >
                <Eye className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                Impersonate
            </Button>

            <SignOutPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                onConfirm={handleImpersonate}
                title={`Impersonate @${username}?`}
                description={`You are about to enter impersonation mode for this user. You will see the platform exactly as they do. You can restore your admin session at any time.`}
                confirmText="Start Session"
            />
        </>
    )
}
