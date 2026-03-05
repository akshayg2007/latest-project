import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Zap,
  Sparkles,
  ArrowRight
} from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* 1. HERO: Clean, Minimalist, "High-End" */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Subtle Background Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white opacity-70 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            The New Standard
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Experience work <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">without the friction.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            TrueWork creates a seamless environment where ambition meets execution. 
            No bidding wars, just premium results.
          </p>
        </div>
      </section>

      {/* 2. THE PROCESS (BUYERS) */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1 rounded-full">For Clients</span>
            <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
             {/* Connector Line (Desktop) */}
             <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-1 bg-slate-100 -z-10" />

             {/* Step 1 */}
             <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-200">
                    <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">1. Find an Expert</h3>
                <p className="text-slate-500">
                    Browse services by skill, price, or reviews. No need to post a job and wait for proposals, just find what you need and order.
                </p>
             </div>

             {/* Step 2 */}
             <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-200">
                    <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2. Secure Payment</h3>
                <p className="text-slate-500">
                    Pay upfront to start the order. We hold the money in an escrow account. The seller doesn't get paid until the work is done.
                </p>
             </div>

             {/* Step 3 */}
             <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-200">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">3. Approve & Download</h3>
                <p className="text-slate-500">
                    Review the delivered files. If it looks good, approve the order to release funds. If not, request a revision.
                </p>
             </div>
        </div>
      </section>

      {/* 3. TRUST & SAFETY */}
      <section className="py-20 bg-slate-900 text-white px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div>
                  <h2 className="text-3xl font-bold mb-6">Why over 10,000+ people trust TrueWork</h2>
                  <div className="space-y-6">
                      <div className="flex gap-4">
                          <ShieldCheck className="w-8 h-8 text-green-400 shrink-0" />
                          <div>
                              <h4 className="font-bold text-lg">Money-Back Guarantee</h4>
                              <p className="text-slate-400 text-sm">If the seller doesn't deliver or the work isn't as described, you get a full refund.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <Users className="w-8 h-8 text-blue-400 shrink-0" />
                          <div>
                              <h4 className="font-bold text-lg">Verified Identity</h4>
                              <p className="text-slate-400 text-sm">We verify seller identities so you know exactly who you're working with.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <Zap className="w-8 h-8 text-yellow-400 shrink-0" />
                          <div>
                              <h4 className="font-bold text-lg">24/7 Support</h4>
                              <p className="text-slate-400 text-sm">Our team is always here to resolve disputes fairly and quickly.</p>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* --- UPDATED CTA CARD (PROFESSIONAL VERSION) --- */}
              <div className="relative p-8 md:p-10 rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-950 shadow-2xl overflow-hidden">
                
                {/* Background Glow Effect */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 bg-blue-900/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-medium mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        Get Started Today
                    </div>

                    <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Ready to get started?</h3>
                    <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                        Join the community today. It's free to sign up and browse.
                    </p>

                    <div className="flex flex-col gap-4">
                        <Link href="/signup" className="w-full">
                            <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold tracking-wide shadow-lg shadow-blue-500/20 h-12 text-base">
                                Join as a New User
                            </Button>
                        </Link>
                        <Link href="/api/auth/signin" className="w-full">
  <Button 
    size="lg" 
    variant="outline" 
    className="w-full h-12 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-400 font-semibold tracking-wide transition-all duration-300"
  >
    Sign in as an Existing User
  </Button>
</Link>
                    </div>
                </div>
              </div>

          </div>
      </section>

      {/* 4. FAQ (Simple) */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
         <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Frequently Asked Questions</h2>
         <div className="space-y-6">
             <FaqItem 
                q="Is it free to join?" 
                a="Yes! Signing up and browsing is completely free. You only pay when you purchase a service." 
             />
             <FaqItem 
                q="What if I'm not happy with the order?" 
                a="You can request revisions from the seller. If they cannot deliver what was promised, you can cancel the order for a refund." 
             />
             <FaqItem 
                q="How do I get paid as a seller?" 
                a="Once an order is marked complete, the funds are credited to your TrueWork balance. You can withdraw to your bank or PayPal." 
             />
         </div>
      </section>

    </div>
  )
}

function FaqItem({q, a}: {q: string, a: string}) {
    return (
        <div className="border border-slate-200 rounded-lg p-6 hover:border-blue-200 transition-colors">
            <h4 className="font-bold text-lg text-slate-900 mb-2">{q}</h4>
            <p className="text-slate-600">{a}</p>
        </div>
    )
}