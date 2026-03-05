"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Briefcase, DollarSign, Clock, Calendar, Tag, FileText, ChevronRight, Check, Mail } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { createJob } from "@/app/actions/createJob"
import { cn } from "@/lib/utils"

interface CreateJobModalProps {
    isOpen: boolean
    onClose: () => void
}

const categories = [
    "Web Development", "Video Editing", "Blog Writing"
]

const experienceLevels = ["Beginner", "Intermediate", "Expert"]
const proposalCounts = ["1", "3", "5", "10", "20", "50", "Unlimited"]
const timelines = ["Less than 1 month", "1-3 months", "3+ months"]

export function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        experienceLevel: "",
        maxProposals: "",
        skills: [] as string[],
        timeline: "",
        budgetType: "FIXED" as "FIXED" | "HOURLY",
        minBudget: "",
        maxBudget: "",
        deadline: "",
    })

    const [skillInput, setSkillInput] = useState("")

    const addSkill = (skill: string) => {
        const trimmed = skill.trim()
        if (trimmed && !formData.skills.includes(trimmed) && formData.skills.length < 5) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
            setSkillInput("")
        }
    }

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        if (!formData.timeline || !formData.minBudget || !formData.maxBudget) {
            toast.error("Please fill in all budget details")
            return
        }

        try {
            setIsSubmitting(true)

            const result = await createJob({
                title: formData.title,
                description: formData.description,
                category: formData.category,
                budget: formData.maxBudget, // Legacy field
                budgetType: formData.budgetType,
                skills: formData.skills,
                experienceLevel: formData.experienceLevel,
                maxProposals: formData.maxProposals === "Unlimited" ? "" : formData.maxProposals,
                timeline: formData.timeline,
                minBudget: formData.minBudget,
                maxBudget: formData.maxBudget,
                deadline: formData.deadline,
            })

            if (result.success) {
                toast.success("Job posted successfully!")
                onClose()
                setStep(1)
                setFormData({
                    title: "", description: "", category: "", experienceLevel: "",
                    maxProposals: "", skills: [], timeline: "",
                    budgetType: "FIXED", minBudget: "", maxBudget: "", deadline: "",
                })
            } else {
                toast.error(result.error || "Failed to post job")
            }
        } catch (error: any) {
            console.error("Submit error:", error)

            // Handle redirect errors (from auth failure)
            if (error.message?.includes("NEXT_REDIRECT") || error.digest?.startsWith("NEXT_REDIRECT")) {
                // This is expected behavior for auth failures - the redirect will handle it
                return
            }

            // Handle other errors
            if (error.message?.includes("Unexpected token '<'") || error.message?.includes("<!DOCTYPE")) {
                toast.error("Session expired. Please sign in again.")
                setTimeout(() => {
                    window.location.href = '/signin'
                }, 1500)
            } else {
                toast.error("Failed to post job. Please try again.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const nextStep = () => {
        if (step === 1) {
            if (!formData.category) {
                toast.error("Please select a job category")
                return
            }
            if (!formData.title.trim()) {
                toast.error("Please enter a job title")
                return
            }
            if (!formData.experienceLevel) {
                toast.error("Please select an experience level")
                return
            }
        } else if (step === 2) {
            if (!formData.maxProposals) {
                toast.error("Please select the number of proposals to accept")
                return
            }
            if (formData.skills.length === 0) {
                toast.error("Please add at least one required skill")
                return
            }
            if (!formData.description.trim()) {
                toast.error("Please enter a job description")
                return
            }
        } else if (step === 3) {
            if (!formData.timeline) {
                toast.error("Please select an expected timeline")
                return
            }
            if (!formData.minBudget && !formData.maxBudget) {
                toast.error("Please enter a budget amount")
                return
            }
            if (formData.minBudget && formData.maxBudget && parseInt(formData.minBudget) > parseInt(formData.maxBudget)) {
                toast.error("Minimum budget cannot be greater than maximum budget")
                return
            }
        }
        setStep(prev => Math.min(prev + 1, 3))
    }

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="sr-only">
                    <DialogTitle>Create a Job</DialogTitle>
                    <DialogDescription>
                        Step through the process of creating a new job posting.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-8 sm:p-12">
                        {/* Progress Dots */}
                        <div className="flex items-center justify-center mb-10 relative">
                            <div className="absolute top-1/2 left-[35%] right-[35%] h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
                            <div className="relative z-10 flex justify-between w-[30%]">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={cn(
                                            "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all bg-white",
                                            step >= s ? "border-slate-400 shadow-md" : "border-slate-100"
                                        )}
                                    >
                                        {step > s ? (
                                            <Check className="h-4 w-4 text-slate-600" />
                                        ) : (
                                            <motion.div
                                                className="w-4 h-4 rounded-full"
                                                animate={{
                                                    backgroundColor: step === s ? "#334155" : "transparent"
                                                }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 text-center sm:text-left">Create a Job</h1>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Job Category</Label>
                                        <p className="text-sm text-slate-500">Choose the category that best matches the work you need.</p>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                                        >
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-600 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Job Title</Label>
                                        <p className="text-sm text-slate-500">Use a clear title so freelancers quickly understand the role.</p>
                                        <Input
                                            placeholder="Add a title...."
                                            className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Experience Level</Label>
                                        <p className="text-sm text-slate-500">Choose the experience level you're looking for.</p>
                                        <Select
                                            value={formData.experienceLevel}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, experienceLevel: val }))}
                                        >
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-600 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base">
                                                <SelectValue placeholder="Eg . Beginner . Intermediate . Expert" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {experienceLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Number of Proposals Accepted</Label>
                                        <p className="text-sm text-slate-500">Limit how many freelancers you want to move forward with.</p>
                                        <Select
                                            value={formData.maxProposals}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, maxProposals: val }))}
                                        >
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-600 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base">
                                                <SelectValue placeholder="Eg. 10" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {proposalCounts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Required Skills</Label>
                                        <p className="text-sm text-slate-500">Add up to 5 skills that are essential for this job.</p>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. Figma, React, Content Writing"
                                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base flex-1"
                                                    value={skillInput}
                                                    onChange={(e) => setSkillInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            addSkill(skillInput)
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => addSkill(skillInput)}
                                                    disabled={!skillInput.trim() || formData.skills.length >= 5}
                                                    className="h-14 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.skills.map((s) => (
                                                    <Badge key={s} variant="secondary" className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold border-0 flex items-center gap-2 text-xs">
                                                        {s}
                                                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-red-500" onClick={() => removeSkill(s)} />
                                                    </Badge>
                                                ))}
                                            </div>
                                            {formData.skills.length === 0 && (
                                                <p className="text-sm text-slate-400">Add at least one skill to continue</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Description</Label>
                                        <p className="text-sm text-slate-500">Briefly explain the work and requirements.</p>
                                        <Textarea
                                            placeholder="Describe what you need done..."
                                            className="min-h-[160px] bg-slate-50 border-slate-200 rounded-2xl text-slate-900 p-6 focus:ring-0 focus:border-slate-400 transition-all resize-none text-base leading-relaxed"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Expected Timeline</Label>
                                        <p className="text-sm text-slate-500">How long do you expect this job to take?</p>
                                        <Select
                                            value={formData.timeline}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, timeline: val }))}
                                        >
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-600 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base">
                                                <SelectValue placeholder="Select a timeline" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timelines.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Budget Type</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, budgetType: 'HOURLY' }))}
                                                className={cn(
                                                    "h-16 flex items-center justify-center gap-3 rounded-2xl border-2 transition-all font-bold text-base outline-none px-4",
                                                    formData.budgetType === 'HOURLY'
                                                        ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                                                        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                                )}
                                            >
                                                <Clock className={cn("w-5 h-5", formData.budgetType === 'HOURLY' ? "text-slate-900" : "text-slate-300")} />
                                                Hourly
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, budgetType: 'FIXED' }))}
                                                className={cn(
                                                    "h-16 flex items-center justify-center gap-3 rounded-2xl border-2 transition-all font-bold text-base outline-none px-4",
                                                    formData.budgetType === 'FIXED'
                                                        ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                                                        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                                )}
                                            >
                                                <Mail className={cn("w-5 h-5", formData.budgetType === 'FIXED' ? "text-slate-900" : "text-slate-300")} />
                                                Fixed
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-lg font-bold text-slate-900">
                                            {formData.budgetType === 'HOURLY' ? 'Budget Range' : 'Budget Amount'}
                                        </Label>
                                        <p className="text-sm text-slate-500">Provide a realistic {formData.budgetType === 'HOURLY' ? 'range' : 'amount'} to attract suitable freelancers.</p>
                                        {formData.budgetType === 'HOURLY' ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</div>
                                                    <Input
                                                        type="text"
                                                        placeholder="Min"
                                                        className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-base focus:ring-0 focus:border-slate-400 transition-all"
                                                        value={formData.minBudget}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, minBudget: e.target.value.replace(/[^0-9]/g, "") }))}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</div>
                                                    <Input
                                                        type="text"
                                                        placeholder="Max"
                                                        className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-base focus:ring-0 focus:border-slate-400 transition-all"
                                                        value={formData.maxBudget}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, maxBudget: e.target.value.replace(/[^0-9]/g, "") }))}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</div>
                                                <Input
                                                    type="text"
                                                    placeholder="Eg . 15000"
                                                    className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-base focus:ring-0 focus:border-slate-400 transition-all"
                                                    value={formData.maxBudget}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, "");
                                                        setFormData(prev => ({ ...prev, maxBudget: val, minBudget: val }));
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-8 border-t border-slate-50 bg-white rounded-b-[32px] flex items-center justify-end gap-4 shrink-0">
                    <Button
                        variant="outline"
                        onClick={step === 1 ? onClose : prevStep}
                        className="h-14 px-10 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 transition-all"
                    >
                        {step === 1 ? 'Cancel' : 'Previous'}
                    </Button>
                    <Button
                        onClick={step === 3 ? handleSubmit : nextStep}
                        disabled={isSubmitting}
                        className="h-14 px-12 rounded-full bg-black text-white font-bold text-base hover:bg-slate-800 transition-all shadow-lg min-w-[160px]"
                    >
                        {isSubmitting ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            step === 3 ? 'Publish' : 'Next'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
