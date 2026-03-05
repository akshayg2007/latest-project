import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-8 w-40" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-24 rounded-full" />
                            <Skeleton className="h-10 w-24 rounded-full" />
                            <Skeleton className="h-10 w-24 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    <Card className="shadow-xl">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-12 w-32" />
                            </div>
                            <Skeleton className="h-24 w-full rounded-3xl" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                            <Skeleton className="h-11 w-full rounded-2xl" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
