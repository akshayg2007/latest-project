'use client'

import { SessionProvider } from "next-auth/react"
import { CurrencyProvider } from "@/components/CurrencyProvider"
import { Toaster } from "sonner"

export function Providers({ children, session }: { children: React.ReactNode, session?: any }) {
    return (
        <SessionProvider session={session}>
            <CurrencyProvider>
                {children}
                <Toaster richColors position="bottom-right" />
            </CurrencyProvider>
        </SessionProvider>
    )
}
