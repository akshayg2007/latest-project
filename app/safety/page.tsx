import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  AlertTriangle, 
  HelpCircle, 
  Eye, 
  FileCheck,
  CreditCard,
  MessageSquare,
  ArrowRight
} from "lucide-react"

export default function SafetyPage() {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. HERO SECTION: "Sky Sanctuary" Theme */}
      <section className="relative pt-32 pb-28 px-6 overflow-hidden bg-white border-b border-slate-100">
        
        {/* --- BACKGROUND: The "Sanctuary" Glow --- */}
        {/* A massive, wide radiant glow from the top-center that washes the page in safety */}
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(50%_100%_at_50%_0%,#bae6fd_0%,#f0f9ff_40%,#ffffff_100%)] opacity-60 pointer-events-none" />
        
        {/* --- ACCENT: Thin "Horizon" Line --- */}
        {/* A subtle blue line at the top to ground the design */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-300 to-transparent opacity-30" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          
          {/* Badge: White on white (Neumorphic-ish) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-sky-100 shadow-sm text-sky-700 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            Trust Center
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-slate-900">
            Your safety is our <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-600 to-blue-600">
              absolute priority.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We've engineered TrueWork with bank grade security protocols. 
            From escrow payments to verified identities, protection is built into every pixel.
          </p>

          {/* Optional: Trust Indicators below text */}
          <div className="pt-8 flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                <Lock className="w-4 h-4" /> 256-bit SSL
             </div>
             <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                <UserCheck className="w-4 h-4" /> ID Verified
             </div>
          </div>

        </div>
      </section>

      {/* 2. CORE PILLARS OF TRUST */}
      <section className="py-24 px-6 max-w-7xl mx-auto -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Card 1 */}
             <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                 <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                     <Lock className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Escrow Protection</h3>
                 <p className="text-slate-500 leading-relaxed">
                     Your money is held safely in escrow. Funds are only released to the freelancer when you are 100% happy with the work.
                 </p>
             </div>

             {/* Card 2 */}
             <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                 <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                     <UserCheck className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Identities</h3>
                 <p className="text-slate-500 leading-relaxed">
                     We verify IDs, phone numbers, and portfolios so you can trust the person behind the profile.
                 </p>
             </div>

             {/* Card 3 */}
             <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                 <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                     <HeadsetIcon className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 Mediation</h3>
                 <p className="text-slate-500 leading-relaxed">
                     If something goes wrong, our specialized support team steps in to mediate disputes fairly and quickly.
                 </p>
             </div>
        </div>
      </section>

      {/* 3. SPLIT SECTION: BUYERS VS SELLERS */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Protection for everyone</h2>
            <p className="text-slate-500 mt-2">Whether you're hiring or working, we've got your back.</p>
         </div>

         <div className="grid md:grid-cols-2 gap-12">
             
             {/* FOR BUYERS */}
             <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                 
                 <div className="relative z-10">
                     <span className="text-blue-600 font-bold tracking-wide text-sm uppercase mb-2 block">For Clients</span>
                     <h3 className="text-2xl font-bold text-slate-900 mb-6">Hire with confidence.</h3>
                     
                     <ul className="space-y-4">
                         <li className="flex gap-4 items-start">
                             <CheckCircleIcon className="w-6 h-6 text-blue-600 shrink-0" />
                             <div>
                                 <h4 className="font-bold text-slate-900">Payment Protection</h4>
                                 <p className="text-sm text-slate-600">You don't pay until you approve the work.</p>
                             </div>
                         </li>
                         <li className="flex gap-4 items-start">
                             <CheckCircleIcon className="w-6 h-6 text-blue-600 shrink-0" />
                             <div>
                                 <h4 className="font-bold text-slate-900">Money-Back Guarantee</h4>
                                 <p className="text-sm text-slate-600">Get a full refund if the work isn't delivered.</p>
                             </div>
                         </li>
                         <li className="flex gap-4 items-start">
                             <CheckCircleIcon className="w-6 h-6 text-blue-600 shrink-0" />
                             <div>
                                 <h4 className="font-bold text-slate-900">Quality Assurance</h4>
                                 <p className="text-sm text-slate-600">See real reviews and work history before hiring.</p>
                             </div>
                         </li>
                     </ul>
                 </div>
             </div>

             {/* FOR FREELANCERS */}
             <div className="bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors text-white">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                 
                 <div className="relative z-10">
                     <span className="text-indigo-400 font-bold tracking-wide text-sm uppercase mb-2 block">For Freelancers</span>
                     <h3 className="text-2xl font-bold text-white mb-6">Get paid for your work.</h3>
                     
                     <ul className="space-y-4">
                         <li className="flex gap-4 items-start">
                             <CheckCircleIcon className="w-6 h-6 text-indigo-400 shrink-0" />
                             <div>
                                 <h4 className="font-bold text-white">Guaranteed Payment</h4>
                                 <p className="text-sm text-slate-400">Client funds are verified before you start working.</p>
                             </div>
                         </li>
                         <li className="flex gap-4 items-start">
                             <CheckCircleIcon className="w-6 h-6 text-indigo-400 shrink-0" />
                             <div>
                                 <h4 className="font-bold text-white">Fair Dispute Resolution</h4>
                                 <p className="text-sm text-slate-400">We protect you from unreasonable clients and scope creep.</p>
                             </div>
                         </li>
                         <li className="flex gap-4 items-start">
                             <CheckCircleIcon className="w-6 h-6 text-indigo-400 shrink-0" />
                             <div>
                                 <h4 className="font-bold text-white">No Chargebacks</h4>
                                 <p className="text-sm text-slate-400">We handle fraud protection so you don't lose money.</p>
                             </div>
                         </li>
                     </ul>
                 </div>
             </div>

         </div>
      </section>

      {/* 4. REPORTING / HELP SECTION */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
         <div className="max-w-4xl mx-auto px-6 text-center">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle className="w-8 h-8" />
             </div>
             <h2 className="text-3xl font-bold text-slate-900 mb-4">See something suspicious?</h2>
             <p className="text-slate-600 mb-8 max-w-lg mx-auto">
                 We have zero tolerance for fraud, harassment, or scams. If you see something that violates our policies, report it immediately.
             </p>
             
             <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
                 <Button variant="outline" className="h-12 bg-white border-slate-200 hover:bg-slate-50 text-slate-700">
                    <FileCheck className="w-4 h-4 mr-2" /> View Guidelines
                 </Button>
                 <Button className="h-12 bg-red-600 hover:bg-red-700 text-white">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Report an Issue
                 </Button>
             </div>
         </div>
      </section>

      {/* 5. FAQ */}
      <section className="py-24 px-6 max-w-3xl mx-auto">
         <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Common Safety Questions</h2>
         <div className="space-y-4">
             <SafetyFaq 
                question="What happens if a client doesn't pay?" 
                answer="On TrueWork, clients must deposit funds into escrow before you begin the order. This ensures the money is there. If they refuse to release it for no valid reason, our support team can intervene and release it to you." 
             />
             <SafetyFaq 
                question="Is my credit card information safe?" 
                answer="Yes. We use industry-standard SSL encryption and do not store your full credit card details on our servers. All payments are processed by Stripe/PayPal." 
             />
             <SafetyFaq 
                question="How do you handle disputes?" 
                answer="If you and the other party cannot agree, you can open a dispute. A TrueWork specialist will review the order requirements, chat history, and delivered work to make a fair, binding decision." 
             />
             <SafetyFaq 
                question="Can I communicate outside of TrueWork?" 
                answer="To stay protected, we strongly recommend keeping all communication on TrueWork. If you move off-platform, we cannot verify agreements or offer payment protection." 
             />
         </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-20 px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to work securely?</h2>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 bg-slate-900 hover:bg-slate-800 text-white h-12">
                Join TrueWork Today
            </Button>
          </Link>
      </section>

    </div>
  )
}

// --- HELPER COMPONENTS ---

function CheckCircleIcon({className}: {className?: string}) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    )
}

function HeadsetIcon({className}: {className?: string}) {
    // Lucide doesn't export 'Headset' sometimes depending on version, so using custom SVG or 'HelpCircle'
    return <HelpCircle className={className} />
}

function SafetyFaq({question, answer}: {question: string, answer: string}) {
    return (
        <div className="border border-slate-200 rounded-lg p-6 bg-white hover:border-blue-200 transition-all">
            <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-slate-400" />
                {question}
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">{answer}</p>
        </div>
    )
}