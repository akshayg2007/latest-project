"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { RateClientDialog } from "@/components/RateClientDialog"

interface RateClientButtonProps {
    orderId: string
    clientName?: string | null
}

export function RateClientButton({ orderId, clientName }: RateClientButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Rate Your Client
            </Button>

            <RateClientDialog
                orderId={orderId}
                clientName={clientName || "the client"}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    )
}
