"use client"

import { usePathname } from "next/navigation"

export function GlobalNavFooter({
    children,
    navbar,
    footer
}: {
    children: React.ReactNode
    navbar: React.ReactNode
    footer: React.ReactNode
}) {
    const pathname = usePathname()
    // Hide standard navbar/footer on dashboard and admin pages
    const shouldHide = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")

    return (
        <>
            {!shouldHide && navbar}
            <main className={`w-full flex-1 flex flex-col ${shouldHide ? "h-screen" : ""}`}>
                {children}
            </main>
            {!shouldHide && footer}
        </>
    )
}
