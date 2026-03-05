import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  Search,
  Ban,
  Scale,
  Link as LinkIcon,
  AlertTriangle,
  ArrowDownToLine,
  Ghost,
  HelpCircle,
  Menu
} from "lucide-react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">

      {/* 2. HERO SECTION */}
      {/* ADDED: border-b border-slate-100 to give it the "rectangle" cut */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden border-b border-slate-100">

        {/* --- BACKGROUND EFFECTS --- */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 1. Giant Blue Orb */}
          <div
            className="absolute top-[-10%] right-[-5%] w-[70%] h-[700px] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"
            style={{ backgroundColor: '#3b82f6' }}
          />

          {/* 2. Giant Cyan Orb */}
          <div
            className="absolute top-[-10%] right-[20%] w-[60%] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"
            style={{ backgroundColor: '#22d3ee' }}
          />

          {/* 3. Overall soft tint */}
          <div className="absolute inset-0 bg-blue-50/30 -z-10" />
        </div>
        {/* ----------------------------------------------- */}

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Freelancing, Redesigned <br />
            Around Skill And Trust.
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed font-medium">
            Work together in a focused, moderated environment where quality rises and collaboration stays clear from start to finish.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* --- UPDATED: Added Link wrapper for redirect --- */}
            <Link href="/signup">
              <Button className="h-12 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-lg shadow-blue-600/20 transition-transform active:scale-95">
                Get started
              </Button>
            </Link>

            <Button variant="secondary" className="h-12 px-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-base font-semibold transition-colors">
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* 3. THE PROBLEM SECTION */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            The Problem
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Freelancing today feels broken.</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Clients struggle to trust who they hire, while skilled freelancers struggle to be seen. Most platforms optimize for volume — not quality.
          </p>
        </div>

        {/* Problem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1 */}
          <ProblemCard
            title="Good talent gets buried."
            desc="Skilled freelancers are lost under spam proposals and low-effort competition."
            illustration={<div className="w-full h-32 bg-slate-50 rounded-lg flex items-center justify-center mb-4"><Ghost className="w-10 h-10 text-slate-300" /></div>}
          />

          {/* Card 2 (Middle - Trust) */}
          <Card className="border border-slate-100 shadow-sm bg-white p-2">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="w-full h-32 bg-slate-50 rounded-lg flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Trust is unreliable.</h3>
              <p className="text-slate-500 text-sm mb-4">Star ratings and profiles don't reflect real behavior, reliability, or intent.</p>

              <div className="mt-auto">
                <span className="text-xs font-bold text-slate-900 block mb-2">What goes wrong</span>
                <ul className="space-y-2">
                  <li className="text-xs text-slate-500 flex items-center gap-2">• Inflated ratings from easy projects</li>
                  <li className="text-xs text-slate-500 flex items-center gap-2">• No signal of communication skills</li>
                  <li className="text-xs text-slate-500 flex items-center gap-2">• One bad actor can look "trusted"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <ProblemCard
            title="New talent gets no entry."
            desc="Even skilled newcomers struggle to get visibility without racing to the bottom on price."
            illustration={<div className="w-full h-32 bg-slate-50 rounded-lg flex items-center justify-center mb-4"><Ban className="w-10 h-10 text-slate-300" /></div>}
          />
        </div>

        {/* Problem Grid Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProblemCard
            layout="horizontal"
            title="Price replaces quality."
            desc="Bidding pushes professionals to undercut instead of doing their best work."
            illustration={<div className="w-32 h-24 bg-slate-50 rounded-lg flex items-center justify-center shrink-0"><ArrowDownToLine className="w-8 h-8 text-slate-300" /></div>}
          />
          <ProblemCard
            layout="horizontal"
            title="Clarity fades after hiring."
            desc="Once hired, communication and progress tracking often become unclear and stressful."
            illustration={<div className="w-32 h-24 bg-slate-50 rounded-lg flex items-center justify-center shrink-0"><HelpCircle className="w-8 h-8 text-slate-300" /></div>}
          />
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">

          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-block bg-[#6AD7FB] text-slate-900 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
              FEATURES
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Built to remove friction at every step.
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base">
              Each feature exists to solve a specific freelancing problem — without adding complexity.
            </p>
          </div>

          {/* Feature 1: Behavior-based scores */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-20">
            <div>
              <div className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Core Feature
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                Behavior-based scores, not vanity ratings.
              </h3>
              <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                Truework uses trust, skill relevance, and real behavior to decide visibility — so quality rises naturally without spam or bidding.
              </p>
              <ul className="space-y-2 text-slate-600 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Skill relevance score
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Trust score based on actions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Visibility adjusts over time
                </li>
              </ul>
            </div>

            {/* Score Card Illustration */}
            <div className="bg-[#f8fafc] rounded-xl p-5 md:p-6 border border-slate-100">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-4 text-sm">Score-Based System</h4>
                <div className="flex items-center gap-4">
                  {/* Circular Progress */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Score Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="text-[10px] text-slate-400">Restricted</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-900">458</span>
                      <span className="text-green-500 font-semibold text-xs">Good</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-medium">Skill Relevance</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-medium">Trust Score</span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-amber-600 text-[10px]">!</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">Low Score?</p>
                    <p className="text-[10px] text-slate-500">Improve your behavior and skills to unlock better visibility.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Kickstart mode */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-20">
            {/* Kickstart Card Illustration */}
            <div className="order-2 md:order-1 bg-[#f8fafc] rounded-xl p-5 md:p-6 border border-slate-100">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                <h4 className="font-semibold text-blue-600 mb-3 text-sm">Kickstart mode</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <div className="w-7 h-7 bg-slate-200 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 bg-slate-100 rounded-full w-4/5" />
                    <div className="h-2 bg-slate-100 rounded-full w-3/5" />
                  </div>
                  <div className="text-2xl">⚡</div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Core Feature
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                A Fair start for new talent.
              </h3>
              <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                Kickstart Mode gives new but skilled freelancers temporary visibility so they can get discovered without bidding, spamming, or underpricing.
              </p>
              <ul className="space-y-2 text-slate-600 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Temporary visibility boost in relevant searches
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Skill-gated and behavior-aware
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Gradually tapers as real performance data is collected
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Clear progress */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-20">
            <div>
              <div className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Core Feature
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                Clear progress, no guesswork.
              </h3>
              <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                Truework keeps work organized once a project starts — so both sides always know what's happening and what's next.
              </p>
              <ul className="space-y-2 text-slate-600 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Tasks and milestones visible in one place
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Calendar-based tracking for timelines
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Fewer check-ins, less confusion
                </li>
              </ul>
            </div>

            {/* Calendar Card Illustration */}
            <div className="bg-[#f8fafc] rounded-xl p-5 md:p-6 border border-slate-100">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                <div className="flex gap-4">
                  {/* Task List */}
                  <div className="flex-1 space-y-3">
                    {[true, true, false, false].map((checked, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'border-slate-200 bg-white'}`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full flex-1" />
                      </div>
                    ))}
                  </div>

                  {/* Mini Calendar */}
                  <div className="shrink-0">
                    <div className="grid grid-cols-5 gap-0.5 text-[10px] font-medium text-slate-400 mb-1.5 text-center">
                      {['S', 'M', 'T', 'W', 'S'].map((d, i) => (
                        <span key={i} className="w-6">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-0.5 text-[10px]">
                      {[2, 3, 4, 5, 6].map((d) => (
                        <span key={d} className={`w-6 h-6 flex items-center justify-center rounded font-medium ${d === 5 || d === 4 ? 'bg-blue-500 text-white' : 'text-slate-600'}`}>
                          {d}
                        </span>
                      ))}
                      {[19, 10, 11, 18, 10].map((d, i) => (
                        <span key={i} className="w-6 h-6 flex items-center justify-center text-slate-300">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Work that speaks */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Profile Cards Illustration */}
            <div className="order-2 md:order-1 bg-[#f8fafc] rounded-xl p-5 md:p-6 border border-slate-100">
              <div className="space-y-2">
                {[false, true, false].map((checked, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 flex items-center gap-3"
                    style={{ marginLeft: i % 2 === 1 ? '8%' : '0' }}
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-1.5 bg-slate-100 rounded-full w-1/2" />
                    </div>
                    {checked && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Core Feature
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                Work that speaks beyond one project.
              </h3>
              <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                Truework lets freelancers showcase real work and contributions through a shared community — so reputation grows from outcomes, not proposals.
              </p>
              <ul className="space-y-2 text-slate-600 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Public work visibility beyond private projects
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Reputation builds from real contributions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  Discovery happens organically through shared work
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>


      {/* 5. THE SOLUTION SECTION */}
      <section className="relative py-24 overflow-hidden" id="how-it-works">

        {/* --- BACKGROUND GLOW EFFECTS --- */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 1. Giant Cyan Glow - Top/Left */}
          <div
            className="absolute top-[0%] left-[-20%] w-[90%] h-[900px] rounded-full mix-blend-multiply filter blur-[120px] opacity-25"
            style={{ backgroundColor: '#22d3ee' }}
          />

          {/* 2. Giant Blue Glow - Bottom/Right */}
          <div
            className="absolute bottom-[-10%] right-[-20%] w-[90%] h-[900px] rounded-full mix-blend-multiply filter blur-[120px] opacity-25"
            style={{ backgroundColor: '#3b82f6' }}
          />

          {/* 3. Overall soft tint */}
          <div className="absolute inset-0 bg-blue-50/40 -z-10" />
        </div>
        {/* ------------------------------- */}

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-white/60 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md shadow-sm">
              The Solution
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How Truework fixes this</h2>
            <p className="text-slate-600 font-medium">
              A skill-first system designed to replace noise with clarity and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <SolutionCard
              icon={<Search className="w-6 h-6 text-white" />}
              title="Skill-based discovery"
              desc="Freelancers are ranked by relevance and capability, so real skill rises without proposal spam."
            />
            <SolutionCard
              icon={<Ban className="w-6 h-6 text-white" />}
              title="No bidding. Ever."
              desc="Professionals aren't forced to undercut. Clients choose based on fit, not price pressure."
            />
            <SolutionCard
              icon={<Shield className="w-6 h-6 text-white" />}
              title="Trust built on behavior."
              desc="Trust reflects consistency, communication, and reliability — not static star ratings."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <SolutionCard
              icon={<Scale className="w-6 h-6 text-white" />}
              title="A fair starting point."
              desc="New but skilled freelancers get structured visibility without racing to the bottom."
            />
            <SolutionCard
              icon={<LinkIcon className="w-6 h-6 text-white" />}
              title="Clear collaboration."
              desc="Communication, progress, and expectations stay visible and structured once work begins."
            />
          </div>
        </div>
      </section>



    </div>
  )
}

// --- HELPER COMPONENTS ---

function ProblemCard({ title, desc, illustration, layout = "vertical" }: { title: string, desc: string, illustration: any, layout?: "vertical" | "horizontal" }) {
  if (layout === "horizontal") {
    return (
      <Card className="border border-slate-100 shadow-sm bg-white p-2">
        <CardContent className="p-6 flex items-center gap-6 h-full">
          {illustration}
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm">{desc}</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="border border-slate-100 shadow-sm bg-white p-2">
      <CardContent className="p-6 h-full flex flex-col">
        {illustration}
        <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm">{desc}</p>
      </CardContent>
    </Card>
  )
}

function SolutionCard({ title, desc, icon }: { title: string, desc: string, icon: any }) {
  return (
    <Card className="border-none shadow-none bg-white rounded-3xl p-6 h-full">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
          {icon}
        </div>
      </div>
      <h3 className="font-bold text-lg text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </Card>
  )
}