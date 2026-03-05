// app/onboarding/client.tsx
"use client"

import { useState, useEffect } from "react"
import { completeFreelancerOnboarding, completeClientOnboarding } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft, User, Briefcase, Plus, RefreshCw,
    MapPin, Trash2, Globe, Pencil, Loader2, Camera, Upload, Check
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/CurrencyProvider"
import { convertPrice } from "@/lib/currency"
import { UploadButton } from "@/lib/uploadthing"

export default function OnboardingClient({ username }: { username: string }) {
    const [step, setStep] = useState(0)
    const [role, setRole] = useState<"FREELANCER" | "CLIENT" | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [locationLoading, setLocationLoading] = useState(true)
    const [locationEditing, setLocationEditing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const { currencyInfo } = useCurrency()
    const symbol = currencyInfo.symbol

    // --- FORM STATES ---
    const [formData, setFormData] = useState({
        title: "",
        location: "",
        links: [""],
        skills: [] as string[],
        tools: [] as string[],
        hourlyRate: "",
        companyName: "",
        isIndividual: false,
        website: "",
        description: "",
        avatarUrl: ""
    })

    // --- TAG INPUT STATES ---
    const [skillInput, setSkillInput] = useState("")
    const [toolInput, setToolInput] = useState("")

    // --- AUTO-DETECT LOCATION ---
    useEffect(() => {
        const detectLocation = async () => {
            try {
                // Using ipapi.co - supports CORS and HTTPS
                const res = await fetch('https://ipapi.co/json/')
                const data = await res.json()
                if (data.city && data.country_name) {
                    const location = `${data.city}, ${data.country_name}`
                    setFormData(prev => ({ ...prev, location }))
                }
            } catch (error) {
                console.error('Failed to detect location:', error)
            } finally {
                setLocationLoading(false)
            }
        }
        detectLocation()
    }, [])

    // --- HANDLERS ---
    const addLink = () => setFormData(prev => ({ ...prev, links: [...prev.links, ""] }))

    const updateLink = (index: number, value: string) => {
        const newLinks = [...formData.links]
        newLinks[index] = value
        setFormData(prev => ({ ...prev, links: newLinks }))
    }

    const removeLink = (index: number) => {
        if (formData.links.length === 1) {
            updateLink(0, "")
            return
        }
        const newLinks = formData.links.filter((_, i) => i !== index)
        setFormData(prev => ({ ...prev, links: newLinks }))
    }

    // --- TAG HANDLERS ---
    const addSkill = () => {
        const trimmed = skillInput.trim()
        if (trimmed && !formData.skills.includes(trimmed)) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
            setSkillInput("")
        }
    }

    const removeSkill = (index: number) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }))
    }

    const addTool = () => {
        const trimmed = toolInput.trim()
        if (trimmed && !formData.tools.includes(trimmed)) {
            setFormData(prev => ({ ...prev, tools: [...prev.tools, trimmed] }))
            setToolInput("")
        }
    }

    const removeTool = (index: number) => {
        setFormData(prev => ({ ...prev, tools: prev.tools.filter((_, i) => i !== index) }))
    }

    const handleNext = () => setStep((prev) => prev + 1)
    const handleBack = () => setStep((prev) => prev - 1)

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            if (role === "FREELANCER") {
                await completeFreelancerOnboarding({
                    title: formData.title,
                    portfolio: formData.links[0] || "",
                    skills: formData.skills.join(", "),
                    tools: formData.tools.join(", "),
                    hourlyRate: formData.hourlyRate,
                    avatarUrl: formData.avatarUrl || undefined,
                    location: formData.location || undefined,
                    externalLinks: formData.links
                })
            } else {
                await completeClientOnboarding({
                    companyName: formData.companyName,
                    isIndividual: formData.isIndividual,
                    website: formData.website,
                    description: formData.description,
                    avatarUrl: formData.avatarUrl || undefined,
                    location: formData.location || undefined
                })
            }
        } catch (error) {
            console.error(error)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="bg-white w-full max-w-6xl min-h-[650px] rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex relative">

                    {step > 0 && (
                        <Button variant="ghost" size="icon" onClick={handleBack} className="absolute top-6 left-6 z-20 hover:bg-slate-100 rounded-full">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    )}

                    {/* STEP 0: SELECTION */}
                    {step === 0 && (
                        <div className="w-full flex flex-col items-center justify-center p-8 md:p-20 text-center animate-in fade-in zoom-in-95 duration-300">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">How do you want to use Truework?</h1>
                            <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
                                <button onClick={() => { setRole("FREELANCER"); setStep(1); }} className="group flex flex-col items-center p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/30 transition-all duration-300 text-left bg-white shadow-sm hover:shadow-md">
                                    <div className="w-full aspect-[4/3] bg-white rounded-2xl mb-6 relative overflow-hidden p-6 flex items-center justify-center border border-slate-50">
                                        <Image src="/client.png" alt="Freelancer" fill className="object-contain" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 w-full">Do work that matters</h3>
                                    <p className="text-slate-500">Get discovered for your skills and grow with real projects.</p>
                                </button>
                                <button onClick={() => { setRole("CLIENT"); setStep(1); }} className="group flex flex-col items-center p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/30 transition-all duration-300 text-left bg-white shadow-sm hover:shadow-md">
                                    <div className="w-full aspect-[4/3] bg-white rounded-2xl mb-6 relative overflow-hidden p-6 flex items-center justify-center border border-slate-50">
                                        <Image src="/freelancer.png" alt="Client" fill className="object-contain" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 w-full">From idea to execution</h3>
                                    <p className="text-slate-500">Hire trusted professionals with clarity, from brief to delivery.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FREELANCER FLOW */}
                    {role === "FREELANCER" && step > 0 && (
                        <div className="w-full grid md:grid-cols-2 animate-in slide-in-from-right-8 duration-500 h-full">
                            {/* FREELANCER FORM PANE - LEFT */}
                            <div className="p-10 md:p-14 flex flex-col h-full overflow-y-auto max-h-[800px] no-scrollbar">
                                <div className="mb-8 pt-8">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step}/2</span>
                                    <h2 className="text-3xl font-bold text-slate-900 mt-2">{step === 1 ? "What do you do?" : "What are you interested in?"}</h2>
                                    <p className="text-slate-500 mt-2 text-lg">{step === 1 ? "Set up your profile for this workspace." : "This will customize your experience."}</p>
                                </div>

                                {step === 1 ? (
                                    <div className="space-y-8 pb-8">
                                        {/* Profile Picture Upload */}
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Profile Picture</Label>
                                            <div className="flex items-center gap-6">
                                                <div className="relative group">
                                                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                                        {formData.avatarUrl ? (
                                                            <img
                                                                src={formData.avatarUrl}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-10 h-10 text-slate-300" />
                                                        )}
                                                    </div>
                                                    {formData.avatarUrl && (
                                                        <button
                                                            onClick={() => setFormData({ ...formData, avatarUrl: "" })}
                                                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <UploadButton
                                                        endpoint="profileImage"
                                                        onUploadBegin={() => setIsUploading(true)}
                                                        onClientUploadComplete={(res) => {
                                                            setIsUploading(false)
                                                            if (res?.[0]?.url) {
                                                                setFormData({ ...formData, avatarUrl: res[0].url })
                                                            }
                                                        }}
                                                        onUploadError={(error: Error) => {
                                                            setIsUploading(false)
                                                            console.error("Upload error:", error)
                                                        }}
                                                        appearance={{
                                                            button: "bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all",
                                                            allowedContent: "text-slate-400 text-xs mt-2"
                                                        }}
                                                        content={{
                                                            button: isUploading ? "Uploading..." : "Upload Photo",
                                                            allowedContent: "JPG, PNG up to 4MB"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">What should people hire you for?</Label>
                                            <Input placeholder="Eg. Web Developer, Product Designer" className="h-14 bg-white border-slate-200 focus:border-blue-600 focus:ring-0 text-base rounded-xl px-4" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Your work links</Label>
                                            {formData.links.map((link, index) => (
                                                <div key={index} className="flex gap-3 group">
                                                    <Input placeholder="Eg. Portfolio, website, or best work" className="h-14 bg-white border-slate-200 focus:border-blue-600 focus:ring-0 text-base rounded-xl px-4" value={link} onChange={(e) => updateLink(index, e.target.value)} />
                                                    {formData.links.length > 1 && (
                                                        <Button variant="ghost" size="icon" onClick={() => removeLink(index)} className="h-14 w-14 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></Button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={addLink} className="text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-2 mt-2 transition-colors px-1"><div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100"><Plus className="w-4 h-4" /></div> Add another link</button>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Location</Label>
                                            {locationEditing ? (
                                                <div className="flex gap-3">
                                                    <Input
                                                        placeholder="Eg. Navi Mumbai, India"
                                                        className="h-14 bg-white border-slate-200 focus:border-blue-600 focus:ring-0 text-base rounded-xl px-4"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setLocationEditing(false)}
                                                        className="h-14 px-6 rounded-xl"
                                                    >
                                                        Done
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center justify-between">
                                                    {locationLoading ? (
                                                        <div className="flex items-center gap-3 text-slate-500">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Detecting location...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <MapPin className="w-5 h-5 text-slate-400" />
                                                                <span className="text-base text-slate-700 font-medium">{formData.location || "Location not detected"}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setLocationEditing(true)}
                                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                                Edit
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Button onClick={handleNext} className="h-14 bg-slate-900 hover:bg-black text-white w-fit px-10 rounded-full text-base font-medium mt-4 shadow-lg shadow-slate-900/10">Continue</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Skills Input with Tags */}
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Skills</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. React, Next.js"
                                                    className="h-14 bg-white border-slate-200 text-base rounded-xl px-4"
                                                    value={skillInput}
                                                    onChange={(e) => setSkillInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            addSkill()
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={addSkill}
                                                    className="h-14 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                            {formData.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {formData.skills.map((skill, index) => (
                                                        <div key={index} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium">
                                                            <span>{skill}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSkill(index)}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Tools Input with Tags */}
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Tools</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. VS Code, Figma"
                                                    className="h-14 bg-white border-slate-200 text-base rounded-xl px-4"
                                                    value={toolInput}
                                                    onChange={(e) => setToolInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            addTool()
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={addTool}
                                                    className="h-14 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                            {formData.tools.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {formData.tools.map((tool, index) => (
                                                        <div key={index} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium">
                                                            <span>{tool}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTool(index)}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Hourly Rate - Number Only */}
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Hourly rate</Label>
                                            <Input
                                                type="number"
                                                placeholder={`${symbol}${Math.round(convertPrice(50, currencyInfo.code))}/hr`}
                                                className="h-14 bg-white border-slate-200 text-base rounded-xl px-4"
                                                value={formData.hourlyRate}
                                                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                                min="0"
                                                step="1"
                                            />
                                        </div>
                                        <Button onClick={handleSubmit} disabled={isLoading} className="h-14 bg-slate-900 hover:bg-black text-white w-fit px-10 rounded-full text-base font-medium mt-4 shadow-lg">{isLoading ? "Saving..." : "Finish Setup"}</Button>
                                    </div>
                                )}
                            </div>

                            {/* FREELANCER PREVIEW PANE - RIGHT */}
                            <div className="bg-slate-50/50 hidden md:flex items-center justify-center border-l border-slate-100 p-18">
                                {step === 1 ? (
                                    <div className="bg-white w-full max-w-[420px] rounded-[2rem] shadow-xl shadow-slate-200/80 border border-slate-100 p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                                        <div className="w-32 h-32 bg-slate-100 rounded-full mb-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                                            {formData.avatarUrl ? (
                                                <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-14 h-14 text-slate-300" />
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-1">{username}</h3>
                                        <p className="text-base text-slate-500 font-medium line-clamp-1 px-4 w-full">{formData.title || "Web Developer"}</p>
                                        <Separator className="my-8 opacity-60" />
                                        <div className="w-full space-y-8 text-left">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-3">LOCATION</p>
                                                <div className="flex items-center gap-3 text-slate-700 font-semibold text-base"><MapPin className="w-5 h-5 text-slate-400" />{formData.location || "Navi Mumbai, India"}</div>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-3">LINKS</p>
                                                <div className="space-y-3">
                                                    {formData.links.some(l => l.length > 0) ? (
                                                        formData.links.map((link, i) => (link && (
                                                            <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-900 group">
                                                                <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                                <span className="truncate hover:underline cursor-pointer">{link}</span>
                                                            </div>
                                                        )))
                                                    ) : (
                                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
                                                            <Globe className="w-4 h-4" /> https://{username}.com
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full aspect-square max-w-[400px] flex items-center justify-center">
                                        <Image
                                            src="/feed-icon.png"
                                            alt="Feed Preview"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- CLIENT FLOW --- */}
                    {role === "CLIENT" && step > 0 && (
                        <div className="w-full grid md:grid-cols-2 animate-in slide-in-from-right-8 duration-500">
                            {/* CLIENT FORM PANE - LEFT */}
                            <div className="p-10 md:p-14 flex flex-col justify-center">
                                <div className="mb-8">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step}/2</span>
                                    <h2 className="text-3xl font-bold text-slate-900 mt-2">{step === 1 ? "What's the name of your company?" : "Build your workspace"}</h2>
                                </div>

                                {step === 1 ? (
                                    <div className="space-y-6">
                                        {/* Profile Picture Upload for Client */}
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Profile Picture</Label>
                                            <div className="flex items-center gap-6">
                                                <div className="relative group">
                                                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                                        {formData.avatarUrl ? (
                                                            <img
                                                                src={formData.avatarUrl}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-10 h-10 text-slate-300" />
                                                        )}
                                                    </div>
                                                    {formData.avatarUrl && (
                                                        <button
                                                            onClick={() => setFormData({ ...formData, avatarUrl: "" })}
                                                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <UploadButton
                                                        endpoint="profileImage"
                                                        onUploadBegin={() => setIsUploading(true)}
                                                        onClientUploadComplete={(res) => {
                                                            setIsUploading(false)
                                                            if (res?.[0]?.url) {
                                                                setFormData({ ...formData, avatarUrl: res[0].url })
                                                            }
                                                        }}
                                                        onUploadError={(error: Error) => {
                                                            setIsUploading(false)
                                                            console.error("Upload error:", error)
                                                        }}
                                                        appearance={{
                                                            button: "bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all",
                                                            allowedContent: "text-slate-400 text-xs mt-2"
                                                        }}
                                                        content={{
                                                            button: isUploading ? "Uploading..." : "Upload Photo",
                                                            allowedContent: "JPG, PNG up to 4MB"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-slate-900">Company Name</Label>
                                                <Input
                                                    placeholder="Company Ltd."
                                                    className="h-14 bg-white border-slate-200 rounded-xl px-4 focus:ring-slate-900"
                                                    value={formData.companyName}
                                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                                    disabled={formData.isIndividual}
                                                />
                                            </div>

                                            <div
                                                className="flex items-center space-x-3 group cursor-pointer"
                                                onClick={() => setFormData({ ...formData, isIndividual: !formData.isIndividual, companyName: !formData.isIndividual ? "" : formData.companyName })}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-all duration-200",
                                                    formData.isIndividual
                                                        ? "bg-slate-900 border-slate-900"
                                                        : "bg-white border-slate-300 group-hover:border-slate-400"
                                                )}>
                                                    {formData.isIndividual && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                                </div>
                                                <span className="text-slate-500 font-medium select-none">I’m hiring as an individual</span>
                                            </div>
                                        </div>

                                        {/* Location Input for Client */}
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-900">Location</Label>
                                            {locationEditing ? (
                                                <div className="flex gap-3">
                                                    <Input
                                                        placeholder="Eg. New York, USA"
                                                        className="h-14 bg-white border-slate-200 focus:border-blue-600 focus:ring-0 text-base rounded-xl px-4"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setLocationEditing(false)}
                                                        className="h-14 px-6 rounded-xl"
                                                    >
                                                        Done
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center justify-between">
                                                    {locationLoading ? (
                                                        <div className="flex items-center gap-3 text-slate-500">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Detecting location...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <MapPin className="w-5 h-5 text-slate-400" />
                                                                <span className="text-base text-slate-700 font-medium">{formData.location || "Location not detected"}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setLocationEditing(true)}
                                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                                Edit
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <Button onClick={handleNext} className="h-14 bg-black hover:bg-slate-800 text-white w-fit px-10 rounded-full mt-4">Continue</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>About the work</Label>
                                            <Textarea
                                                placeholder="We are looking for..."
                                                className="min-h-[120px] bg-white border-slate-200 rounded-xl p-4 text-base"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Website (Optional)</Label>
                                            <Input placeholder="https://" className="h-14 bg-white border-slate-200 rounded-xl px-4" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                                        </div>
                                        <Button onClick={handleSubmit} disabled={isLoading} className="h-14 bg-black hover:bg-slate-800 text-white w-fit px-10 rounded-full mt-4">{isLoading ? "Creating..." : "Finish Setup"}</Button>
                                    </div>
                                )}
                            </div>

                            {/* CLIENT PREVIEW PANE - RIGHT */}
                            <div className="bg-slate-50 hidden md:flex items-center justify-center border-l border-slate-100 p-12">
                                {step === 1 ? (
                                    <div className="relative w-full aspect-square max-w-sm opacity-90 animate-in zoom-in-95 duration-500">
                                        <div className="absolute inset-0 bg-white rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 p-8 flex flex-col items-center justify-center">
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src="/company.png"
                                                    alt="Company Preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full aspect-square max-w-sm opacity-90 animate-in zoom-in-95 duration-500">
                                        <div className="absolute inset-0 bg-white rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 p-8 flex flex-col items-center justify-center">
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src="/workspace.png"
                                                    alt="Workspace Preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}