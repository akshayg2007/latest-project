"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { useDebounce } from "@/hooks/use-debounce"

export function SupportFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Use a ref to track if the search was triggered by this component
    const isInternalUpdate = useRef(false)

    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
    const debouncedSearch = useDebounce(searchTerm, 300)

    // Only update state if external q param changes
    useEffect(() => {
        const query = searchParams.get("q") || ""
        if (query !== searchTerm && !isInternalUpdate.current) {
            setSearchTerm(query)
        }
        isInternalUpdate.current = false
    }, [searchParams])

    useEffect(() => {
        const currentQ = searchParams.get("q") || ""
        if (debouncedSearch === currentQ) return

        const params = new URLSearchParams(searchParams.toString())
        if (debouncedSearch) {
            params.set("q", debouncedSearch)
        } else {
            params.delete("q")
        }

        isInternalUpdate.current = true
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [debouncedSearch, pathname, router, searchParams])

    return (
        <div className="relative w-full max-md:max-w-xs md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                placeholder="Search tickets or users..."
                className="pl-9 h-10 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    )
}
