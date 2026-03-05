import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Zap,
    ShieldCheck,
    HelpCircle
} from "lucide-react"
import { PricingTickets, TransactionBreakdown } from "@/components/PricingTickets"

export default function PricingPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">

            {/* 1. HERO: Minimalist & Direct */}
            <section className="pt-32 pb-20 px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                    Simple, transparent pricing. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                        No hidden fees.
                    </span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-12">
                    Join for free. We only make money when you successfully complete a project.
                    Upgrade only when you're ready to scale.
                </p>

                {/* 2. THE "TICKETS" (UNIQUE LAYOUT) - Now with currency conversion */}
                <PricingTickets />
            </section>

            {/* 3. "WHERE DOES THE MONEY GO?" (TRANSPARENCY SECTION) */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-12 items-center">

                        <div className="flex-1 space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900">Where does the fee go?</h2>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                We believe in radical transparency. The small service fee on the free plan isn't just profit—it powers the ecosystem that keeps you safe.
                            </p>

                            <div className="space-y-4 pt-4">
                                <TransparencyItem
                                    icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
                                    title="Payment Protection"
                                    desc="Escrow costs and anti-fraud monitoring systems."
                                />
                                <TransparencyItem
                                    icon={<Zap className="w-5 h-5 text-sky-500" />}
                                    title="Platform Development"
                                    desc="Servers, new features, and keeping the site fast."
                                />
                                <TransparencyItem
                                    icon={<HelpCircle className="w-5 h-5 text-indigo-500" />}
                                    title="24/7 Support Team"
                                    desc="Real humans mediating disputes and answering tickets."
                                />
                            </div>
                        </div>

                        {/* VISUAL BREAKDOWN GRAPH - Now with currency conversion */}
                        <div className="flex-1 w-full">
                            <TransactionBreakdown />
                        </div>

                    </div>
                </div>
            </section>

            {/* 4. FAQ */}
            <section className="py-20 px-6 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Common Questions</h2>
                <div className="space-y-4">
                    <FaqItem q="Can I cancel the Pro plan anytime?" a="Yes, you can cancel immediately. You will keep your benefits until the end of the billing period." />
                    <FaqItem q="Do clients pay a fee?" a="Yes, clients pay a small processing fee of 3% on top of the order price to cover credit card processing costs." />
                    <FaqItem q="What is a 'Verified Badge'?" a="Pro members get a blue checkmark after identity verification, which statistically increases trust and order volume by 40%." />
                    <FaqItem q="Are prices shown in my local currency?" a="Yes! We automatically show prices in INR across the platform. All payments are processed in Indian Rupees (INR)." />
                </div>
            </section>

        </div>
    )
}

// --- HELPER COMPONENTS ---

function TransparencyItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1">{icon}</div>
            <div>
                <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                <p className="text-sm text-slate-500">{desc}</p>
            </div>
        </div>
    )
}

function FaqItem({ q, a }: { q: string, a: string }) {
    return (
        <div className="border border-slate-200 rounded-xl p-6 hover:border-blue-200 transition-colors bg-white">
            <h4 className="font-bold text-slate-900 mb-2">{q}</h4>
            <p className="text-slate-600 text-sm">{a}</p>
        </div>
    )
}