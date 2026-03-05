'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, ThumbsUp, ShieldCheck } from "lucide-react"
import { Price } from "./Price"
import { SaveServiceButton } from "./SaveServiceButton"
import { createServiceOrder } from "@/app/actions/createServiceOrder"

interface ServiceDetailsPriceCardProps {
    price: number
    deliveryTime: number
    serviceId: string
    isOwner: boolean
    isSaved: boolean
    isLoggedIn: boolean
}

export function ServiceDetailsPriceCard({
    price,
    deliveryTime,
    serviceId,
    isOwner,
    isSaved,
    isLoggedIn
}: ServiceDetailsPriceCardProps) {
    return (
        <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Standard Package</span>
                    <Price amount={price} size="xl" className="text-slate-900" />
                </div>

                <p className="text-sm text-slate-500">
                    Includes source files, commercial use, and high quality delivery.
                </p>

                <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{deliveryTime} Days Delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Satisfaction Guaranteed</span>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    {isOwner ? (
                        <Button className="w-full h-12 text-lg font-bold bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200">
                            You own this Service
                        </Button>
                    ) : (
                        <form action={createServiceOrder}>
                            <input type="hidden" name="serviceId" value={serviceId} />
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20"
                            >
                                Continue (<Price amount={price} />)
                            </Button>
                        </form>
                    )}

                    {!isOwner && isLoggedIn && (
                        <SaveServiceButton serviceId={serviceId} initialSaved={isSaved} />
                    )}

                    <form action={`/api/conversations/start`} method="POST">
                        <input type="hidden" name="sellerId" value={serviceId} />
                        <Button variant="outline" className="w-full" type="submit">
                            Contact Seller
                        </Button>
                    </form>
                </div>

                <div className="flex justify-center items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>SSL Secure Payment</span>
                </div>
            </CardContent>
        </Card>
    )
}
