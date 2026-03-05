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
import { Badge } from "@/components/ui/badge"
import { X, Check, Clock, Mail, ChevronLeft, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getPaymentMethods } from "@/app/actions/payment"
import { useEffect } from "react"
import { createJob, getJobForEdit, updateJob } from "@/app/actions/createJob"
import { cn } from "@/lib/utils"

const categories = [
    "Web & App Development",
    "UI/UX & Product Design",
    "Graphic Design & Branding",
    "Digital Marketing & SEO",
    "Content Writing & Copywriting",
    "Video Editing & Animation",
    "Data & Tech Services",
    "Business & Support Services",
    "Other (Custom Services)"
]

const experienceLevels = ["Beginner", "Intermediate", "Expert"]
const timelines = ["Less than 1 month", "1-3 months", "3+ months"]

export default function CreateJobPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        experienceLevel: "",
        skills: [] as string[],
        timeline: "",
        budgetType: "FIXED" as "FIXED" | "HOURLY",
        minBudget: "",
        maxBudget: "",
        deadline: "",
        objective: "",
        deliverables: [] as string[],
        tasksIncluded: [] as string[],
        paymentStructure: "POST_COMPLETION",
        advancePercentage: 0,
        paymentMethods: [] as string[],
        proposedMilestones: [] as { name: string, percentage: string, condition: string }[],
        hourlyRateMin: "",
        hourlyRateMax: "",
        maxHoursPerWeek: "",
        estimatedTotalHours: "",
        paymentFrequency: "WEEKLY",
        hourApprovalMethod: "MANUAL",
        description: "",
        expectedStartDate: "",
        deadlineFlexible: false,
        urgencyLevel: "Medium",
    })

    const [skillInput, setSkillInput] = useState("")
    const [deliverableInput, setDeliverableInput] = useState("")
    const [taskInput, setTaskInput] = useState("")
    const [milestoneInput, setMilestoneInput] = useState({ name: "", percentage: "", condition: "" })
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([])

    const searchParams = useSearchParams()
    const editId = searchParams.get("editId")
    const [isFetching, setIsFetching] = useState(!!editId)

    useEffect(() => {
        const loadJobData = async () => {
            if (!editId) return
            try {
                const res = await getJobForEdit(editId)
                if (res.success && res.job) {
                    const job = res.job
                    setFormData({
                        title: job.title || "",
                        category: job.category || "",
                        experienceLevel: job.experienceLevel || "",
                        skills: (job.skills as string[]) || [],
                        timeline: job.timeline || "",
                        budgetType: (job.budgetType as "FIXED" | "HOURLY") || "FIXED",
                        minBudget: job.minBudget?.toString() || "",
                        maxBudget: job.maxBudget?.toString() || "",
                        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : "",
                        objective: job.objective || "",
                        deliverables: (job.deliverables as string[]) || [],
                        tasksIncluded: (job.tasksIncluded as string[]) || [],
                        paymentStructure: job.paymentStructure || "POST_COMPLETION",
                        advancePercentage: job.advancePercentage || 0,
                        paymentMethods: (job.paymentMethods as string[]) || [],
                        proposedMilestones: (job.proposedMilestones as any[])?.map(m => ({
                            name: m.name,
                            percentage: m.percentage.toString(),
                            condition: m.condition
                        })) || [],
                        hourlyRateMin: job.hourlyRateMin?.toString() || "",
                        hourlyRateMax: job.hourlyRateMax?.toString() || "",
                        maxHoursPerWeek: job.maxHoursPerWeek?.toString() || "",
                        estimatedTotalHours: job.estimatedTotalHours?.toString() || "",
                        paymentFrequency: job.paymentFrequency || "WEEKLY",
                        hourApprovalMethod: job.hourApprovalMethod || "MANUAL",
                        description: job.description || "",
                        expectedStartDate: job.expectedStartDate ? new Date(job.expectedStartDate).toISOString().split('T')[0] : "",
                        deadlineFlexible: job.deadlineFlexible || false,
                        urgencyLevel: job.urgencyLevel || "Medium",
                    })
                } else {
                    toast.error(res.error || "Failed to load job data")
                }
            } catch (error) {
                console.error("Error loading job:", error)
            } finally {
                setIsFetching(false)
            }
        }

        const fetchMethods = async () => {
            const methods = await getPaymentMethods()
            setAvailablePaymentMethods(methods)
        }

        loadJobData()
        fetchMethods()
    }, [editId])

    const totalMilestonePercentage = formData.proposedMilestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0)

    const addMilestone = () => {
        const percentage = parseFloat(milestoneInput.percentage) || 0
        if (milestoneInput.name && percentage > 0) {
            if (totalMilestonePercentage + percentage > 100) {
                toast.error("Total milestones cannot exceed 100%")
                return
            }
            setFormData(prev => ({
                ...prev,
                proposedMilestones: [...prev.proposedMilestones, { ...milestoneInput }]
            }))
            setMilestoneInput({ name: "", percentage: "", condition: "" })
        }
    }

    const removeMilestone = (index: number) => {
        setFormData(prev => ({
            ...prev,
            proposedMilestones: prev.proposedMilestones.filter((_, i) => i !== index)
        }))
    }

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

    const addDeliverable = (val: string) => {
        const trimmed = val.trim()
        if (trimmed && !formData.deliverables.includes(trimmed)) {
            setFormData(prev => ({ ...prev, deliverables: [...prev.deliverables, trimmed] }))
            setDeliverableInput("")
        }
    }

    const removeDeliverable = (item: string) => {
        setFormData(prev => ({ ...prev, deliverables: prev.deliverables.filter(d => d !== item) }))
    }

    const addTask = (val: string) => {
        const trimmed = val.trim()
        if (trimmed && !formData.tasksIncluded.includes(trimmed)) {
            setFormData(prev => ({ ...prev, tasksIncluded: [...prev.tasksIncluded, trimmed] }))
            setTaskInput("")
        }
    }

    const removeTask = (item: string) => {
        setFormData(prev => ({ ...prev, tasksIncluded: prev.tasksIncluded.filter(t => t !== item) }))
    }

    const handleSubmit = async () => {
        if (isSubmitting) return

        // Final validation before submission
        if (!formData.title || !formData.category || !formData.experienceLevel) {
            toast.error("Please ensure all basic job details are filled")
            return
        }

        if (formData.budgetType === 'FIXED' && !formData.maxBudget) {
            toast.error("Please specify a total budget")
            return
        }

        if (formData.budgetType === 'HOURLY' && (!formData.hourlyRateMin || !formData.hourlyRateMax)) {
            toast.error("Please specify an hourly rate range")
            return
        }

        if (!formData.expectedStartDate || !formData.deadline) {
            toast.error("Please ensure project dates are selected")
            return
        }

        try {
            setIsSubmitting(true)

            const jobPayload = {
                title: formData.title,
                category: formData.category,
                budget: formData.maxBudget,
                budgetType: formData.budgetType,
                skills: formData.skills,
                experienceLevel: formData.experienceLevel,
                timeline: formData.timeline,
                minBudget: formData.minBudget,
                maxBudget: formData.maxBudget,
                deadline: formData.deadline,
                objective: formData.objective,
                deliverables: formData.deliverables,
                tasksIncluded: formData.tasksIncluded,
                description: formData.description,
                paymentStructure: formData.paymentStructure,
                advancePercentage: formData.advancePercentage,
                paymentMethods: formData.paymentMethods,
                proposedMilestones: formData.proposedMilestones.map(m => ({
                    name: m.name,
                    percentage: parseFloat(m.percentage),
                    amount: (parseFloat(formData.maxBudget) * parseFloat(m.percentage) / 100).toFixed(2),
                    condition: m.condition
                })),
                hourlyRateMin: parseFloat(formData.hourlyRateMin) || 0,
                hourlyRateMax: parseFloat(formData.hourlyRateMax) || 0,
                maxHoursPerWeek: parseInt(formData.maxHoursPerWeek) || 0,
                estimatedTotalHours: parseInt(formData.estimatedTotalHours) || 0,
                paymentFrequency: formData.paymentFrequency,
                hourApprovalMethod: formData.hourApprovalMethod,
                expectedStartDate: formData.expectedStartDate,
                deadlineFlexible: formData.deadlineFlexible,
                urgencyLevel: formData.urgencyLevel,
            }

            const result = editId
                ? await updateJob(editId, jobPayload)
                : await createJob(jobPayload)

            if (result.success) {
                toast.success(editId ? "Job updated successfully!" : "Job posted successfully!")
                router.push("/dashboard/jobs")
            } else {
                toast.error(result.error || "Failed to post job")
            }
        } catch (error: any) {
            console.error("Submit error:", error)

            // Handle redirect errors (from auth failure)
            if (error.message?.includes("NEXT_REDIRECT") || error.digest?.startsWith("NEXT_REDIRECT")) {
                router.push("/signin")
                return
            }

            // Handle other errors
            if (error.message?.includes("Unexpected token '<'") || error.message?.includes("<!DOCTYPE")) {
                toast.error("Session expired. Please sign in again.")
                setTimeout(() => {
                    router.push('/signin')
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
            if (!formData.objective.trim()) {
                toast.error("Please describe your project objective")
                return
            }
            if (formData.deliverables.length === 0) {
                toast.error("Please add at least one deliverable")
                return
            }
            if (formData.tasksIncluded.length === 0) {
                toast.error("Please add at least one task")
                return
            }
        } else if (step === 3) {
            if (!formData.expectedStartDate) {
                toast.error("Please select an expected start date")
                return
            }
            if (!formData.deadline) {
                toast.error("Please select a project deadline")
                return
            }
            if (new Date(formData.deadline) < new Date(formData.expectedStartDate)) {
                toast.error("Project deadline must be after the start date")
                return
            }
            if (!formData.urgencyLevel) {
                toast.error("Please select an urgency level")
                return
            }
        } else if (step === 4) {
            if (formData.budgetType === 'FIXED') {
                if (!formData.maxBudget) {
                    toast.error("Please enter a total budget")
                    return
                }
                if (formData.paymentStructure === 'MILESTONE' && formData.proposedMilestones.length === 0) {
                    toast.error("Please add at least one milestone")
                    return
                }
            } else {
                if (!formData.hourlyRateMin || !formData.hourlyRateMax) {
                    toast.error("Please enter hourly rate range")
                    return
                }
            }
        } else if (step === 5) {
            if (formData.skills.length === 0) {
                toast.error("Please add at least one required skill")
                return
            }
        }
        setStep(prev => Math.min(prev + 1, 5))
    }

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

    if (isFetching) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium">Loading job details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/dashboard/jobs" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors w-fit font-medium">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to My Jobs
                    </Link>
                </div>

                <div className="bg-white rounded-[32px] shadow-xl overflow-hidden">
                    <div className="p-8 sm:p-12">
                        {/* Progress Dots */}
                        <div className="flex items-center justify-center mb-10 relative">
                            <div className="absolute top-1/2 left-[20%] right-[20%] h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
                            <div className="relative z-10 flex justify-between w-[60%]">
                                {[1, 2, 3, 4, 5].map((s) => (
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
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
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
                                                <SelectValue placeholder="Can't find your category? Choose &quot;Other&quot;." />
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
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    {/* Project Objective */}
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">What do you want to achieve with this project?</Label>
                                        <Textarea
                                            placeholder="Describe your project objective..."
                                            className="min-h-[140px] bg-slate-50 border-slate-200 rounded-2xl text-slate-900 p-6 focus:ring-0 focus:border-slate-400 transition-all resize-none text-base leading-relaxed"
                                            value={formData.objective}
                                            onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                                        />
                                    </div>



                                    {/* Main Deliverables List */}
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Main Deliverables List</Label>
                                        <p className="text-sm text-slate-500">Each deliverable should be a final output.</p>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. Fully functional website, Brand logo..."
                                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base flex-1"
                                                    value={deliverableInput}
                                                    onChange={(e) => setDeliverableInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            addDeliverable(deliverableInput)
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => addDeliverable(deliverableInput)}
                                                    disabled={!deliverableInput.trim()}
                                                    className="h-14 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                            {formData.deliverables.length === 0 ? (
                                                <p className="text-sm text-slate-400">Add at least one deliverable to continue</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {formData.deliverables.map((d, i) => (
                                                        <li key={d} className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                                            <span className="text-sm font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
                                                            <span className="text-sm text-slate-700 flex-1">{d}</span>
                                                            <X className="h-3.5 w-3.5 cursor-pointer text-slate-400 hover:text-red-500 shrink-0" onClick={() => removeDeliverable(d)} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tasks Included */}
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Tasks Included</Label>
                                        <p className="text-sm text-slate-500">This explains what work is expected during the process.</p>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. UI design, API integration..."
                                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base flex-1"
                                                    value={taskInput}
                                                    onChange={(e) => setTaskInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            addTask(taskInput)
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => addTask(taskInput)}
                                                    disabled={!taskInput.trim()}
                                                    className="h-14 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                            {formData.tasksIncluded.length === 0 ? (
                                                <p className="text-sm text-slate-400">Add at least one task to continue</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {formData.tasksIncluded.map((t, i) => (
                                                        <li key={t} className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                                            <span className="text-sm font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
                                                            <span className="text-sm text-slate-700 flex-1">{t}</span>
                                                            <X className="h-3.5 w-3.5 cursor-pointer text-slate-400 hover:text-red-500 shrink-0" onClick={() => removeTask(t)} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-lg font-bold text-slate-900">Expected Start Date</Label>
                                            <Input
                                                type="date"
                                                className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base"
                                                value={formData.expectedStartDate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, expectedStartDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-lg font-bold text-slate-900">Project Deadline</Label>
                                            <Input
                                                type="date"
                                                className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base"
                                                value={formData.deadline}
                                                min={formData.expectedStartDate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <input
                                            type="checkbox"
                                            id="deadlineFlexible"
                                            className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                            checked={formData.deadlineFlexible}
                                            onChange={(e) => setFormData(prev => ({ ...prev, deadlineFlexible: e.target.checked }))}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="deadlineFlexible" className="text-base font-bold text-slate-900 cursor-pointer">Deadline Flexible</Label>
                                            <p className="text-sm text-slate-500">Enable if the project timeline has some room for adjustment.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Urgency Level</Label>
                                        <Select
                                            value={formData.urgencyLevel}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, urgencyLevel: val }))}
                                        >
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-600 px-6 focus:ring-0 focus:border-slate-400 transition-all text-base">
                                                <SelectValue placeholder="Select urgency level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["Low", "Medium", "High", "Critical"].map((u) => (
                                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Budget Type</Label>
                                        <div className="grid grid-cols-2 gap-3">
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
                                        </div>
                                    </div>

                                    {formData.budgetType === 'FIXED' ? (
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <Label className="text-lg font-bold text-slate-900">Total Budget Amount</Label>
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
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-lg font-bold text-slate-900">Payment Structure</Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {[
                                                        { id: "POST_COMPLETION", label: "100% After Completion", desc: "Pay only when the work is fully finished." },
                                                        { id: "ADVANCE_FINAL", label: "Advance + Final", desc: "Pay a portion upfront and the rest at the end." },
                                                        { id: "MILESTONE", label: "Milestone-Based", desc: "Pay in stages as work is delivered." }
                                                    ].map((struct) => (
                                                        <button
                                                            key={struct.id}
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, paymentStructure: struct.id }))}
                                                            className={cn(
                                                                "p-6 rounded-[24px] border-2 text-left transition-all hover:shadow-md",
                                                                formData.paymentStructure === struct.id
                                                                    ? "border-slate-900 bg-white shadow-sm ring-1 ring-slate-900"
                                                                    : "border-slate-100 bg-white grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
                                                            )}
                                                        >
                                                            <div className="h-4 w-4 rounded-full border-2 border-slate-300 mb-4 flex items-center justify-center">
                                                                {formData.paymentStructure === struct.id && <div className="h-2 w-2 rounded-full bg-slate-900" />}
                                                            </div>
                                                            <p className="font-bold text-slate-900 text-sm mb-1">{struct.label}</p>
                                                            <p className="text-xs text-slate-500 leading-relaxed">{struct.desc}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {formData.paymentStructure === 'ADVANCE_FINAL' && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                                                    <Label className="text-base font-bold text-slate-900">Advance Percentage (%)</Label>
                                                    <div className="flex items-center gap-4">
                                                        <Input
                                                            type="number"
                                                            max="100"
                                                            min="0"
                                                            placeholder="e.g. 25"
                                                            className="h-14 bg-white border-slate-200 rounded-xl text-slate-900 px-6 font-bold"
                                                            value={formData.advancePercentage || ""}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, advancePercentage: parseInt(e.target.value) || 0 }))}
                                                        />
                                                        <div className="p-4 bg-white rounded-xl border border-slate-100 flex-1">
                                                            <p className="text-xs text-slate-500 font-medium">Advance Amount Preview</p>
                                                            <p className="text-lg font-bold text-slate-900 text-nowrap">₹ {((parseInt(formData.maxBudget) || 0) * (formData.advancePercentage || 0) / 100).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {formData.paymentStructure === 'MILESTONE' && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                    <div className="space-y-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-bold text-slate-900">Add Proposed Milestones</p>
                                                            <p className={cn("text-xs font-bold", totalMilestonePercentage >= 100 ? "text-red-500" : "text-slate-500")}>
                                                                {totalMilestonePercentage}% / 100%
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <Input
                                                                placeholder="Milestone Name (e.g. Design Phase)"
                                                                className="h-11 bg-white rounded-xl"
                                                                value={milestoneInput.name}
                                                                onChange={(e) => setMilestoneInput(prev => ({ ...prev, name: e.target.value }))}
                                                            />
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        placeholder="Percentage"
                                                                        className="h-11 pr-8 bg-white rounded-xl"
                                                                        value={milestoneInput.percentage}
                                                                        onChange={(e) => setMilestoneInput(prev => ({ ...prev, percentage: e.target.value.replace(/[^0-9.]/g, "") }))}
                                                                    />
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</div>
                                                                </div>
                                                                <div className="flex-[1.5] flex items-center px-4 bg-white rounded-xl border border-slate-200">
                                                                    <p className="text-xs font-bold text-slate-900">
                                                                        Preview: ₹ {((parseFloat(formData.maxBudget) || 0) * (parseFloat(milestoneInput.percentage) || 0) / 100).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <Input
                                                                    placeholder="Release Condition"
                                                                    className="h-11 flex-[2] bg-white rounded-xl"
                                                                    value={milestoneInput.condition}
                                                                    onChange={(e) => setMilestoneInput(prev => ({ ...prev, condition: e.target.value }))}
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                onClick={addMilestone}
                                                                disabled={totalMilestonePercentage >= 100 || !milestoneInput.name || !milestoneInput.percentage}
                                                                className="h-11 bg-slate-900 text-white rounded-xl font-bold text-xs"
                                                            >
                                                                + Add Milestone
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {formData.proposedMilestones.length > 0 && (
                                                        <div className="space-y-2">
                                                            {formData.proposedMilestones.map((m, i) => (
                                                                <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-bold text-slate-900 text-xs">{m.name}</p>
                                                                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-slate-100">{m.percentage}%</Badge>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-500">Cond: {m.condition || "On approval"}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <p className="font-bold text-slate-900 text-sm">₹{((parseFloat(formData.maxBudget) || 0) * (parseFloat(m.percentage) || 0) / 100).toLocaleString()}</p>
                                                                        <X className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 cursor-pointer" onClick={() => removeMilestone(i)} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}

                                            <div className="space-y-4">
                                                <Label className="text-lg font-bold text-slate-900">Payment Methods Accepted</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {availablePaymentMethods.length > 0 ? (
                                                        availablePaymentMethods.map(pm => (
                                                            <div
                                                                key={pm.id}
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        paymentMethods: prev.paymentMethods.includes(pm.id)
                                                                            ? prev.paymentMethods.filter(id => id !== pm.id)
                                                                            : [...prev.paymentMethods, pm.id]
                                                                    }))
                                                                }}
                                                                className={cn(
                                                                    "p-4 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all",
                                                                    formData.paymentMethods.includes(pm.id)
                                                                        ? "border-slate-900 bg-slate-50"
                                                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                                                )}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-slate-900 capitalize">{pm.type.toLowerCase()}</span>
                                                                    <span className="text-[10px] text-slate-500 font-medium">{pm.maskedIdentifier}</span>
                                                                </div>
                                                                <div className={cn(
                                                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                                                    formData.paymentMethods.includes(pm.id) ? "bg-slate-900 border-slate-900" : "border-slate-200"
                                                                )}>
                                                                    {formData.paymentMethods.includes(pm.id) && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-2 p-10 border-2 border-dashed border-slate-100 rounded-[28px] text-center bg-slate-50/50">
                                                            <p className="text-sm text-slate-500 font-medium mb-3">No payment methods found in your account.</p>
                                                            <Link href="/dashboard/payment/accounts">
                                                                <Button variant="outline" className="h-10 rounded-full border-slate-200 text-xs font-bold hover:bg-white bg-transparent">Add Payment Method</Button>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <Label className="text-lg font-bold text-slate-900">Minimum Hourly Rate</Label>
                                                    <div className="relative">
                                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</div>
                                                        <Input
                                                            type="text"
                                                            placeholder="Min"
                                                            className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold"
                                                            value={formData.hourlyRateMin}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRateMin: e.target.value.replace(/[^0-9]/g, "") }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-lg font-bold text-slate-900">Maximum Hourly Rate</Label>
                                                    <div className="relative">
                                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</div>
                                                        <Input
                                                            type="text"
                                                            placeholder="Max"
                                                            className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold"
                                                            value={formData.hourlyRateMax}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRateMax: e.target.value.replace(/[^0-9]/g, "") }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <Label className="text-lg font-bold text-slate-900">Payment Frequency</Label>
                                                    <Select
                                                        value={formData.paymentFrequency}
                                                        onValueChange={(val) => setFormData(prev => ({ ...prev, paymentFrequency: val }))}
                                                    >
                                                        <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                            <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                            <SelectItem value="UPON_APPROVAL">Upon Approval</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-lg font-bold text-slate-900">Max Hours/Week</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Eg. 40"
                                                        className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6"
                                                        value={formData.maxHoursPerWeek}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, maxHoursPerWeek: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 5 && (
                                <motion.div
                                    key="step5"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Required Skills</Label>
                                        <p className="text-sm text-slate-500">Pick up to 5 essential skills for this project.</p>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. Figma, React, Python..."
                                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 px-6 focus:ring-0 focus:border-slate-400 text-base flex-1"
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
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-lg font-bold text-slate-900">Brief Overview Description</Label>
                                        <p className="text-sm text-slate-500">This will be shown on the job card and explorer.</p>
                                        <Textarea
                                            placeholder="Write a short summary of the role..."
                                            className="min-h-[120px] bg-slate-50 border-slate-200 rounded-2xl text-slate-900 p-6 focus:ring-0 focus:border-slate-400 transition-all resize-none text-base leading-relaxed"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-8 border-t border-slate-50 bg-white rounded-b-[32px] flex items-center justify-end gap-4 shrink-0">
                        <Button
                            variant="outline"
                            onClick={step === 1 ? () => router.push('/dashboard/jobs') : prevStep}
                            className="h-14 px-10 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 transition-all"
                        >
                            {step === 1 ? 'Cancel' : 'Previous'}
                        </Button>
                        <Button
                            onClick={step === 5 ? handleSubmit : nextStep}
                            disabled={isSubmitting}
                            className="h-14 px-12 rounded-full bg-black text-white font-bold text-base hover:bg-slate-800 transition-all shadow-lg min-w-[160px]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                step === 5 ? 'Publish' : 'Next'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
