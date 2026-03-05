'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Check,
    Sparkles,
    Zap,
    ShieldCheck,
    HelpCircle
} from "lucide-react"
import { Price } from "@/components/Price"

export function PricingTickets() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">

            {/* TICKET 1: STANDARD (FREE) */}
            <div className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col md:flex-row">

                {/* Left: The "Stub" (Price) */}
                <div className="bg-slate-50 p-8 md:w-64 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-dashed border-slate-300 relative">
                    {/* The "Cutout" circles */}
                    <div className="absolute top-[-10px] right-[-10px] md:top-[-10px] md:right-[-10px] w-5 h-5 bg-slate-50 border border-slate-200 rounded-full z-10 hidden md:block" />
                    <div className="absolute bottom-[-10px] right-[-10px] md:bottom-[-10px] md:right-[-10px] w-5 h-5 bg-slate-50 border border-slate-200 rounded-full z-10 hidden md:block" />

                    <span className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Starter</span>
                    <Price amount={0} size="xl" className="text-slate-900 mb-1" />
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>

                {/* Right: The Value */}
                <div className="p-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 flex-1">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            Pay As You Go
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Perfect for new freelancers and clients. No upfront costs. You only pay a small transaction fee when you get paid.
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <FeatureItem text="5% Service Fee" />
                            <FeatureItem text="Escrow Protection" />
                            <FeatureItem text="Standard Support" />
                        </div>
                    </div>
                    <Link href="/signup">
                        <Button variant="outline" size="lg" className="rounded-full px-8 border-slate-300 hover:bg-slate-100 hover:text-slate-900 h-12">
                            Get Started Free
                        </Button>
                    </Link>
                </div>
            </div>

            {/* TICKET 2: PRO (MEMBERSHIP) */}
            <div className="group relative bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row transform hover:-translate-y-1 transition-transform duration-300">

                {/* Decorative Gradient Blob (Blue/Sky) */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Left: The "Stub" (Price) */}
                <div className="bg-slate-950 p-8 md:w-64 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-dashed border-slate-800 relative">
                    {/* The "Cutout" circles */}
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-50 rounded-full z-10 hidden md:block" />
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-slate-50 rounded-full z-10 hidden md:block" />

                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-3 border border-blue-500/30">
                        <Sparkles className="w-3 h-3" /> Most Popular
                    </div>
                    <Price amount={29} size="xl" className="text-white mb-1" />
                    <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>

                {/* Right: The Value */}
                <div className="p-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4 flex-1">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            TrueWork Pro
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            For serious freelancers scaling their business. Keep 100% of your earnings and get seen by more clients.
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <FeatureItem text="0% Service Fee" dark />
                            <FeatureItem text="Verified Badge" dark />
                            <FeatureItem text="Priority Support" dark />
                            <FeatureItem text="See Client Budgets" dark />
                        </div>
                    </div>
                    <Link href="/signup?plan=pro">
                        <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 shadow-lg shadow-blue-900/40 border-0">
                            Upgrade to Pro
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export function TransactionBreakdown() {
    return (
        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wide">
                Transaction Breakdown (<Price amount={100} /> Order)
            </h3>

            <div className="space-y-6">
                {/* Freelancer Share */}
                <div>
                    <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-slate-900">You Keep</span>
                        <Price amount={95} className="text-slate-900" />
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 w-[95%]"></div>
                    </div>
                </div>

                {/* TrueWork Share */}
                <div>
                    <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-blue-600">TrueWork Fee (5%)</span>
                        <Price amount={5} className="text-blue-600" />
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[5%]"></div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-4">
                    <p className="text-xs text-slate-500">
                        *On the Pro plan, the TrueWork fee becomes <Price amount={0} />.
                    </p>
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ text, dark }: { text: string, dark?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${dark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <Check className="w-3 h-3" />
            </div>
            <span className={`text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{text}</span>
        </div>
    )
}
