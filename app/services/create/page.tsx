"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ChevronRight, X, ImageIcon, Upload, PlusCircle, Plus, CheckCircle2, Clock, Mail, Loader2, Lock, AlertCircle, Percent, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useUploadThing } from "@/lib/uploadthing"
import { createService } from "@/app/actions/createService"
import { getServiceForEdit, updateService } from "@/app/actions/updateService"

export default function CreateServicePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get("edit")
    const [step, setStep] = useState(1)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isFetching, setIsFetching] = useState(!!editId)
    const [formData, setFormData] = useState({
        category: "",
        title: "",
        tools: [] as string[],
        image: null as File | null,
        imagePreview: null as string | null,
        revisions: "",
        tags: [] as string[],
        deliverables: [{ title: "", description: "" }],
        summary: "",
        faqs: [] as { question: string, answer: string }[],
        pricingMethod: "ongoing" as "ongoing" | "contact" | "fixed",
        paymentFrequency: "hourly" as "hourly" | "weekly" | "monthly",
        rate: "0",
        deliveryTime: "72", // Default 3 days in hours (3 * 24)
        paymentSteps: [] as { title: string, description: string, percentage: string }[],
    })

    useEffect(() => {
        if (editId) {
            const fetchService = async () => {
                try {
                    const service = await getServiceForEdit(editId)
                    if (service) {
                        const presetRevisions = [1, 2, 3, 4, 5, 10, "Unlimited"]
                        const isCustomRevision = service.revisions &&
                            !presetRevisions.includes(parseInt(service.revisions)) &&
                            service.revisions !== "Unlimited"

                        setFormData({
                            category: service.category,
                            title: service.title,
                            tools: service.tools,
                            image: null,
                            imagePreview: service.images[0] || null,
                            revisions: isCustomRevision ? "custom" : (service.revisions || ""),
                            tags: service.tags,
                            deliverables: service.deliverables.map(d => ({ title: d.title, description: d.description })),
                            summary: service.description,
                            faqs: service.faqs.map(f => ({ question: f.question, answer: f.answer })),
                            pricingMethod: (service.pricingMethod as any) || "ongoing",
                            paymentFrequency: (service.paymentFrequency as any) || "hourly",
                            rate: service.price.toString(),
                            deliveryTime: (service.deliveryTime || 72).toString(),
                            paymentSteps: (service.paymentSteps as any) || [],
                        })

                        if (isCustomRevision) {
                            setCustomRevisionValue(service.revisions || "")
                        }
                    } else {
                        toast.error("Service not found or unauthorized")
                        router.push("/dashboard")
                    }
                } catch (error) {
                    console.error("Fetch service error:", error)
                    toast.error("Error loading service data")
                } finally {
                    setIsFetching(false)
                }
            }
            fetchService()
        }
    }, [editId, router])
    const [toolInput, setToolInput] = useState("")
    const [tagInput, setTagInput] = useState("")
    const [customRevisionValue, setCustomRevisionValue] = useState("")

    const { startUpload } = useUploadThing("serviceImage")

    const steps = [1, 2, 3, 4, 5, 6]

    // Calculate progress percentage for the line
    const progress = ((step - 1) / (steps.length - 1)) * 100

    const nextStep = () => setStep((s) => Math.min(s + 1, steps.length))
    const prevStep = () => setStep((s) => Math.max(s - 1, 1))

    // Payment steps helpers
    const addPaymentStep = () => {
        setFormData(prev => ({
            ...prev,
            paymentSteps: [...prev.paymentSteps, { title: "", description: "", percentage: "" }]
        }))
    }

    const updatePaymentStep = (index: number, field: 'title' | 'description' | 'percentage', value: string) => {
        const newSteps = [...formData.paymentSteps]
        if (field === 'percentage') {
            value = value.replace(/[^0-9]/g, '')
            const num = parseInt(value)
            if (num > 100) value = '100'
        }
        newSteps[index][field] = value
        setFormData({ ...formData, paymentSteps: newSteps })
    }

    const removePaymentStep = (index: number) => {
        setFormData(prev => ({
            ...prev,
            paymentSteps: prev.paymentSteps.filter((_, i) => i !== index)
        }))
    }

    const totalPercentage = formData.paymentSteps.reduce((sum, s) => sum + (parseInt(s.percentage) || 0), 0)
    const rateNum = parseInt(formData.rate) || 0

    const addDeliverable = () => {
        setFormData({
            ...formData,
            deliverables: [...formData.deliverables, { title: "", description: "" }]
        })
    }

    const updateDeliverable = (index: number, field: 'title' | 'description', value: string) => {
        const newDeliverables = [...formData.deliverables]
        newDeliverables[index][field] = value
        setFormData({ ...formData, deliverables: newDeliverables })
    }

    const addFAQ = () => {
        setFormData({
            ...formData,
            faqs: [...formData.faqs, { question: "", answer: "" }]
        })
    }

    const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
        const newFaqs = [...formData.faqs]
        newFaqs[index][field] = value
        setFormData({ ...formData, faqs: newFaqs })
    }

    const handleAddTool = () => {
        if (toolInput.trim()) {
            setFormData(prev => ({ ...prev, tools: [...prev.tools, toolInput.trim()] }))
            setToolInput("")
        }
    }

    const handleAddTag = () => {
        if (tagInput.trim()) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
            setTagInput("")
        }
    }

    const handlePublish = async () => {
        if (isPublishing) return

        try {
            setIsPublishing(true)

            let imageUrls: string[] = []

            // 1. Upload Image if exists
            if (formData.image) {
                toast.loading("Uploading image...", { id: "publish" })
                const uploadRes = await startUpload([formData.image])
                if (!uploadRes) {
                    toast.error("Failed to upload image", { id: "publish" })
                    setIsPublishing(false)
                    return
                }
                imageUrls = uploadRes.map((file: any) => file.url)
            } else if (editId && formData.imagePreview) {
                // If editing and no new image, keep the existing one
                imageUrls = [formData.imagePreview]
            } else {
                toast.error("Please upload a cover image", { id: "publish" })
                setIsPublishing(false)
                setStep(6)
                return
            }

            // 2. Create/Update Service in DB
            toast.loading(editId ? "Updating your service..." : "Creating your service...", { id: "publish" })

            const revisionValue = formData.revisions === "custom" ? customRevisionValue : formData.revisions

            const serviceData = {
                category: formData.category,
                title: formData.title,
                tools: formData.tools,
                images: imageUrls,
                revisions: revisionValue,
                tags: formData.tags,
                deliverables: formData.deliverables,
                summary: formData.summary,
                faqs: formData.faqs,
                pricingMethod: formData.pricingMethod,
                paymentFrequency: formData.paymentFrequency,
                rate: formData.rate,
                deliveryTime: formData.deliveryTime,
                paymentSteps: formData.paymentSteps,
            }

            let result;
            if (editId) {
                result = await updateService(editId, {
                    ...serviceData,
                    price: parseInt(formData.rate),
                    deliveryTime: parseInt(formData.deliveryTime),
                    description: formData.summary
                })
            } else {
                result = await createService(serviceData)
            }

            if (result.error) {
                toast.error(result.error, { id: "publish" })
                setIsPublishing(false)
                return
            }

            toast.success(editId ? "Service updated successfully!" : "Service published successfully!", {
                id: "publish",
                description: editId ? "Your changes have been saved." : "Your service is now live on your profile.",
            })

            router.push(`/dashboard`)
            router.refresh()

        } catch (error: any) {
            console.error("Publish Error:", error)
            toast.error(error.message || "An unexpected error occurred", { id: "publish" })
            setIsPublishing(false)
        }
    }

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    <p className="text-slate-500 font-medium">Loading service data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 flex flex-col justify-center font-sans relative">
            <AnimatePresence>
                {isPublishing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-slate-100 border-t-black rounded-full mb-6"
                        />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Publishing your service</h2>
                        <p className="text-sm text-slate-500 max-w-[280px]">
                            We're uploading your image and setting up your workspace. This might take a few seconds.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto w-full">

                {/* Stepper */}
                <div className="flex items-center justify-center mb-10 relative max-w-sm mx-auto">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -translate-y-1/2 z-0" />

                    {/* Animated Progress Line */}
                    <motion.div
                        className="absolute top-1/2 left-0 h-px bg-slate-400 -translate-y-1/2 z-10 origin-left"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />

                    <div className="relative z-20 flex justify-between w-full">
                        {steps.map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all bg-white shadow-sm",
                                    step >= s ? "border-slate-300 transition-colors duration-500" : "border-slate-200"
                                )}
                            >
                                <motion.div
                                    className="w-3.5 h-3.5 rounded-full"
                                    animate={{
                                        backgroundColor: step >= s ? "#64748b" : "transparent" // slate-500
                                    }}
                                    transition={{ duration: 0.3, delay: step >= s ? 0.2 : 0 }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-10 min-h-[500px] flex flex-col">
                        <h1 className="text-2xl font-bold text-slate-900 mb-6 shrink-0">{editId ? "Edit your service" : "Create a service"}</h1>

                        <div className="flex-1">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Category */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-slate-900">
                                                Category
                                            </Label>
                                            <p className="text-xs text-slate-400">
                                                Pick your service category to get started.
                                            </p>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                            >
                                                <SelectTrigger className="w-full h-12 bg-white border-slate-200 rounded-lg text-slate-500 text-sm px-4 focus:ring-0 focus:ring-offset-0">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="web-app-development">Web & App Development</SelectItem>
                                                    <SelectItem value="ui-ux-design">UI/UX & Product Design</SelectItem>
                                                    <SelectItem value="graphic-design">Graphic Design & Branding</SelectItem>
                                                    <SelectItem value="digital-marketing">Digital Marketing & SEO</SelectItem>
                                                    <SelectItem value="content-writing">Content Writing & Copywriting</SelectItem>
                                                    <SelectItem value="video-editing">Video Editing & Animation</SelectItem>
                                                    <SelectItem value="data-tech">Data & Tech Services</SelectItem>
                                                    <SelectItem value="business-support">Business & Support Services</SelectItem>
                                                    <SelectItem value="other">Other (Custom Services)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Title */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-slate-900">
                                                Title
                                            </Label>
                                            <p className="text-xs text-slate-400">
                                                Pitch your service with an engaging, descriptive title.
                                            </p>
                                            <Input
                                                placeholder="Add a title...."
                                                className="h-12 bg-white border-slate-200 rounded-lg text-sm"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>

                                        {/* Summary */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-slate-900">
                                                Summary
                                            </Label>
                                            <p className="text-xs text-slate-400">
                                                Explain in 2-3 sentences what you&apos;re offering and highlight what makes you unique.
                                            </p>
                                            <textarea
                                                placeholder="Short summary about your service"
                                                className="w-full min-h-[100px] p-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-slate-400 transition-all resize-none"
                                                value={formData.summary}
                                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => router.back()}
                                                className="h-10 px-6 rounded-full border-slate-200 font-bold text-slate-800 text-sm hover:bg-slate-50 outline-none"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="h-10 px-8 rounded-full bg-black hover:bg-black/90 text-white font-bold text-sm"
                                                onClick={nextStep}
                                                disabled={!formData.category || !formData.title || !formData.summary}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Deliverables */}
                                        <div className="space-y-3">
                                            <Label className="text-base font-bold text-slate-900 block">
                                                Deliverables
                                            </Label>
                                            <p className="text-xs text-slate-400">
                                                List the deliverables a client can expect at the end of the project.
                                            </p>

                                            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                                {formData.deliverables.map((deliverable, index) => (
                                                    <div key={index} className="space-y-2 pb-2 border-b border-slate-100 last:border-0">
                                                        <Input
                                                            placeholder="Deliverable title"
                                                            className="h-10 border-slate-200 rounded-lg text-sm focus:ring-0 focus-visible:ring-0"
                                                            value={deliverable.title}
                                                            onChange={(e) => updateDeliverable(index, 'title', e.target.value)}
                                                        />
                                                        <textarea
                                                            placeholder="A clear and short description"
                                                            className="w-full min-h-[60px] p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-400 transition-all resize-none"
                                                            value={deliverable.description}
                                                            onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addDeliverable}
                                                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors py-2 group outline-none"
                                            >
                                                <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 group-hover:bg-slate-50 transition-all">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium">Add another deliverable</span>
                                            </button>
                                        </div>

                                        {/* Revision Rounds */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-slate-900">
                                                Number of revision rounds
                                            </Label>
                                            <p className="text-xs text-slate-400">
                                                Mention how many revisions you provide so clients know what to expect.
                                            </p>
                                            <Select
                                                value={formData.revisions}
                                                onValueChange={(val) => {
                                                    setFormData({ ...formData, revisions: val })
                                                    if (val !== "custom") {
                                                        setCustomRevisionValue("")
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-lg text-slate-500 text-sm focus:ring-0 focus:ring-offset-0">
                                                    <SelectValue placeholder="Eg. 10" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5, 10, "Unlimited"].map((num) => (
                                                        <SelectItem key={num} value={num.toString()}>
                                                            {num}
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="custom">
                                                        Custom
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {formData.revisions === "custom" && (
                                                <Input
                                                    placeholder="Enter custom number of revisions"
                                                    type="number"
                                                    min="1"
                                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm focus:ring-0 focus-visible:ring-0"
                                                    value={customRevisionValue}
                                                    onChange={(e) => setCustomRevisionValue(e.target.value)}
                                                />
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="h-10 px-6 rounded-full border-slate-200 font-bold text-slate-800 text-sm hover:bg-slate-50 outline-none"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                className="h-10 px-8 rounded-full bg-black hover:bg-black/90 text-white font-bold text-sm"
                                                onClick={nextStep}

                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Max Delivery Time */}
                                        <div className="space-y-4">
                                            <Label className="text-base font-bold text-slate-900">
                                                Max Delivery Time
                                            </Label>
                                            <p className="text-xs text-slate-400">
                                                The maximum amount of time you have to deliver the final work.
                                                <span className="text-red-500 font-medium ml-1">Orders will be auto-cancelled after this time.</span>
                                            </p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { label: '1h', value: 1 },
                                                    { label: '6h', value: 6 },
                                                    { label: '12h', value: 12 },
                                                    { label: '1 Day', value: 24 },
                                                    { label: '3 Days', value: 72 },
                                                    { label: '7 Days', value: 168 },
                                                    { label: '14 Days', value: 336 },
                                                    { label: '30 Days', value: 720 },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, deliveryTime: opt.value.toString() })}
                                                        className={cn(
                                                            "py-3 rounded-xl border-2 transition-all font-bold text-xs outline-none px-2",
                                                            formData.deliveryTime === opt.value.toString()
                                                                ? "border-slate-900 bg-white text-slate-900"
                                                                : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="pt-2">
                                                <Label className="text-[11px] text-slate-400 font-bold uppercase mb-2 block">Or enter custom hours</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Custom hours"
                                                    value={formData.deliveryTime}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setFormData({ ...formData, deliveryTime: val });
                                                    }}
                                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm focus:ring-0 focus-visible:ring-0"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="h-10 px-6 rounded-full border-slate-200 font-bold text-slate-800 text-sm hover:bg-slate-50 outline-none"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                className="h-10 px-8 rounded-full bg-black hover:bg-black/90 text-white font-bold text-sm"
                                                onClick={nextStep}

                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                                {step === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Pricing Method */}
                                        <div className="space-y-4">
                                            <Label className="text-base font-bold text-slate-900">
                                                How do you want to set up your pricing?
                                            </Label>
                                            <div className="grid grid-cols-3 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, pricingMethod: 'ongoing' })}
                                                    className={cn(
                                                        "h-14 flex items-center justify-center gap-3 rounded-xl border-2 transition-all font-bold text-sm outline-none px-4 text-center",
                                                        formData.pricingMethod === 'ongoing'
                                                            ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                                                            : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                                    )}
                                                >
                                                    <Clock className={cn("w-5 h-5", formData.pricingMethod === 'ongoing' ? "text-slate-900" : "text-slate-300")} />
                                                    Ongoing rate
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, pricingMethod: 'fixed' })}
                                                    className={cn(
                                                        "h-14 flex items-center justify-center gap-3 rounded-xl border-2 transition-all font-bold text-sm outline-none px-4 text-center",
                                                        formData.pricingMethod === 'fixed'
                                                            ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                                                            : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                                    )}
                                                >
                                                    <Lock className={cn("w-5 h-5", formData.pricingMethod === 'fixed' ? "text-slate-900" : "text-slate-300")} />
                                                    Fixed price
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, pricingMethod: 'contact' })}
                                                    className={cn(
                                                        "h-14 flex items-center justify-center gap-3 rounded-xl border-2 transition-all font-bold text-sm outline-none px-4 text-center",
                                                        formData.pricingMethod === 'contact'
                                                            ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                                                            : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                                    )}
                                                >
                                                    <Mail className={cn("w-5 h-5", formData.pricingMethod === 'contact' ? "text-slate-900" : "text-slate-300")} />
                                                    Contact for pricing
                                                </button>
                                            </div>
                                        </div>

                                        {(formData.pricingMethod === 'ongoing' || formData.pricingMethod === 'fixed') && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-8"
                                            >
                                                {/* Payment Frequency - Only for Ongoing */}
                                                {formData.pricingMethod === 'ongoing' && (
                                                    <div className="space-y-4">
                                                        <Label className="text-base font-bold text-slate-900">
                                                            How often would you like to get paid?
                                                        </Label>
                                                        <div className="p-1 bg-slate-50/50 border border-slate-100 rounded-xl flex gap-1 relative overflow-hidden">
                                                            {['hourly', 'weekly', 'monthly'].map((freq) => {
                                                                const hours = parseInt(formData.deliveryTime) || 0;
                                                                const isWeeklyDisabled = hours < 168 && freq === 'weekly';
                                                                const isMonthlyDisabled = hours < 720 && freq === 'monthly';
                                                                const isDisabled = isWeeklyDisabled || isMonthlyDisabled;

                                                                return (
                                                                    <button
                                                                        key={freq}
                                                                        type="button"
                                                                        disabled={isDisabled}
                                                                        onClick={() => setFormData({ ...formData, paymentFrequency: freq as any })}
                                                                        className={cn(
                                                                            "flex-1 py-3 text-sm font-bold rounded-lg transition-all relative z-10 capitalize outline-none flex items-center justify-center gap-2",
                                                                            formData.paymentFrequency === freq ? "text-slate-900" : "text-slate-400 hover:text-slate-500",
                                                                            isDisabled && "opacity-50 cursor-not-allowed hover:text-slate-400 bg-slate-100/50"
                                                                        )}
                                                                    >
                                                                        {freq}
                                                                        {isDisabled && <Lock className="w-3 h-3" />}
                                                                        {formData.paymentFrequency === freq && (
                                                                            <motion.div
                                                                                layoutId="freq-pill"
                                                                                className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] -z-10"
                                                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                                            />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {['weekly', 'monthly'].includes(formData.paymentFrequency) && (parseInt(formData.deliveryTime) < (formData.paymentFrequency === 'weekly' ? 168 : 720)) && (
                                                            <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 bg-red-50 p-3 rounded-lg border border-red-100">
                                                                <AlertCircle className="w-3.5 h-3.5" />
                                                                Delivery time is too short for {formData.paymentFrequency} payment. Please increase delivery time or switch to hourly.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Price Input */}
                                                <div className="space-y-3">
                                                    <Label className="text-base font-bold text-slate-900">
                                                        Price
                                                    </Label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                                                            <span className="text-4xl font-bold text-slate-900 ml-4">₹</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={formData.rate}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                setFormData({ ...formData, rate: val || "0" });
                                                            }}
                                                            placeholder="Enter price"
                                                            className="w-full h-28 text-center text-5xl font-bold text-slate-900 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-900 transition-all shadow-sm selection:bg-slate-100"
                                                        />
                                                        {formData.pricingMethod === 'ongoing' && (
                                                            <div className="absolute inset-y-0 right-0 pr-1 flex items-center pointer-events-none">
                                                                <span className="text-2xl font-bold text-slate-400 mr-4">
                                                                    {formData.paymentFrequency === 'hourly' && '/hr'}
                                                                    {formData.paymentFrequency === 'weekly' && '/week'}
                                                                    {formData.paymentFrequency === 'monthly' && '/month'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Part Payment / Development Steps - Only for Fixed Price */}
                                                {formData.pricingMethod === 'fixed' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <Label className="text-base font-bold text-slate-900">
                                                                    Development Steps
                                                                </Label>
                                                                <p className="text-xs text-slate-400">
                                                                    Break your service into milestones. Clients pay as each step is completed.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Progress bar showing total percentage */}
                                                        {formData.paymentSteps.length > 0 && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between text-xs font-bold">
                                                                    <span className="text-slate-500">Total allocation</span>
                                                                    <span className={cn(
                                                                        totalPercentage === 100 ? "text-emerald-600" : totalPercentage > 100 ? "text-red-500" : "text-amber-500"
                                                                    )}>
                                                                        {totalPercentage}%
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        className={cn(
                                                                            "h-full rounded-full transition-colors",
                                                                            totalPercentage === 100 ? "bg-emerald-500" : totalPercentage > 100 ? "bg-red-500" : "bg-amber-400"
                                                                        )}
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${Math.min(totalPercentage, 100)}%` }}
                                                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Steps list */}
                                                        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                                            {formData.paymentSteps.map((ps, index) => {
                                                                const stepAmount = rateNum > 0 && ps.percentage ? Math.round(rateNum * (parseInt(ps.percentage) || 0) / 100) : 0;
                                                                return (
                                                                    <motion.div
                                                                        key={index}
                                                                        initial={{ opacity: 0, y: 8 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: index * 0.05 }}
                                                                        className="relative group"
                                                                    >
                                                                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-all space-y-2">
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Step number indicator */}
                                                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200/70 text-slate-600 text-xs font-black shrink-0">
                                                                                    {index + 1}
                                                                                </div>

                                                                                {/* Title */}
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Step title (e.g. UI Design)"
                                                                                    value={ps.title}
                                                                                    onChange={(e) => updatePaymentStep(index, 'title', e.target.value)}
                                                                                    className="flex-1 h-8 bg-transparent border-0 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none min-w-0"
                                                                                />

                                                                                {/* Percentage */}
                                                                                <div className="flex items-center gap-1 shrink-0">
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="0"
                                                                                        value={ps.percentage}
                                                                                        onChange={(e) => updatePaymentStep(index, 'percentage', e.target.value)}
                                                                                        className="w-12 h-8 text-center bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all"
                                                                                    />
                                                                                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                                                                                </div>

                                                                                {/* Delete */}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removePaymentStep(index)}
                                                                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>

                                                                            {/* Description */}
                                                                            <textarea
                                                                                placeholder="Describe what this step includes..."
                                                                                value={ps.description}
                                                                                onChange={(e) => updatePaymentStep(index, 'description', e.target.value)}
                                                                                rows={2}
                                                                                className="w-full bg-transparent border-0 text-xs text-slate-600 placeholder:text-slate-300 focus:outline-none resize-none leading-relaxed pl-10"
                                                                            />

                                                                            {/* Amount display */}
                                                                            {stepAmount > 0 && (
                                                                                <p className="text-[11px] font-bold text-slate-400 pl-10">₹{stepAmount.toLocaleString('en-IN')}</p>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Add step button */}
                                                        <button
                                                            type="button"
                                                            onClick={addPaymentStep}
                                                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors py-2 group outline-none w-full"
                                                        >
                                                            <div className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center group-hover:border-slate-400 group-hover:bg-slate-50 transition-all">
                                                                <Plus className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-sm font-medium">Add a development step</span>
                                                        </button>

                                                        {/* Validation messages */}
                                                        {formData.paymentSteps.length > 0 && totalPercentage !== 100 && (
                                                            <p className={cn(
                                                                "text-xs font-medium flex items-center gap-1.5 p-3 rounded-lg border",
                                                                totalPercentage > 100 ? "text-red-500 bg-red-50 border-red-100" : "text-amber-600 bg-amber-50 border-amber-100"
                                                            )}>
                                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                                {totalPercentage > 100
                                                                    ? `Total exceeds 100% by ${totalPercentage - 100}%. Please adjust your steps.`
                                                                    : `${100 - totalPercentage}% remaining. Total must equal 100% to publish.`
                                                                }
                                                            </p>
                                                        )}

                                                        {formData.paymentSteps.length > 0 && totalPercentage === 100 && (
                                                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                All steps add up to 100%. You&apos;re good to go!
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {formData.pricingMethod === 'contact' && (
                                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <Mail className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-slate-900">Contact for Pricing</h3>
                                                    <p className="text-xs text-slate-400 max-w-xs">Clients will reach out to you directly to discuss the cost based on their specific needs.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="h-10 px-6 rounded-full border-slate-200 font-bold text-slate-800 text-sm hover:bg-slate-50 outline-none"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                className="h-10 px-8 rounded-full bg-black hover:bg-black/90 text-white font-bold text-sm"
                                                onClick={nextStep}
                                                disabled={((formData.pricingMethod === 'ongoing' || formData.pricingMethod === 'fixed') && !formData.rate) || (formData.pricingMethod === 'ongoing' && formData.paymentSteps.length > 0 && totalPercentage !== 100)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                                {step === 5 && (
                                    <motion.div
                                        key="step5"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Tools */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-slate-900">
                                                Tools
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add Tools used"
                                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm"
                                                    value={toolInput}
                                                    onChange={(e) => setToolInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTool()}
                                                />
                                                <Button type="button" onClick={handleAddTool} className="h-12 bg-black text-white shrink-0 px-6">Add</Button>
                                            </div>
                                            {formData.tools.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.tools.map((tool, i) => (
                                                        <span key={i} className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-md flex items-center gap-1.5">
                                                            {tool}
                                                            <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" onClick={() => setFormData(prev => ({ ...prev, tools: prev.tools.filter((_, idx) => idx !== i) }))} />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Search Tags */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-slate-900">
                                                Search tags
                                            </Label>
                                            <p className="text-xs text-slate-400">
                                                Add tags to help clients find your service.
                                            </p>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Eg . Graphics, Video editing, etc"
                                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm focus:ring-0 focus-visible:ring-0"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                                />
                                                <Button type="button" onClick={handleAddTag} className="h-12 bg-black text-white shrink-0 px-6">Add</Button>
                                            </div>
                                            {formData.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.tags.map((tag, i) => (
                                                        <span key={i} className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-md flex items-center gap-1.5">
                                                            {tag}
                                                            <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }))} />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* FAQs */}
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/30 overflow-hidden">
                                            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
                                                <div className="space-y-0.5">
                                                    <h4 className="text-sm font-bold text-slate-900">FAQs</h4>
                                                    <p className="text-[10px] text-slate-400 font-medium">Answer common questions.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addFAQ}
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all outline-none"
                                                >
                                                    <Plus className="w-4 h-4 text-slate-500" />
                                                </button>
                                            </div>

                                            {formData.faqs.length > 0 && (
                                                <div className="p-4 space-y-4 bg-slate-50/50 max-h-[160px] overflow-y-auto custom-scrollbar">
                                                    {formData.faqs.map((faq, index) => (
                                                        <div key={index} className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                                            <button
                                                                onClick={() => {
                                                                    const newFaqs = formData.faqs.filter((_, i) => i !== index)
                                                                    setFormData({ ...formData, faqs: newFaqs })
                                                                }}
                                                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <Input
                                                                placeholder="Question"
                                                                className="h-10 bg-slate-50/50 border-slate-200 rounded-lg text-sm focus:bg-white transition-all shadow-none"
                                                                value={faq.question}
                                                                onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                                                            />
                                                            <textarea
                                                                placeholder="Answer"
                                                                className="w-full min-h-[60px] p-3 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none shadow-none"
                                                                value={faq.answer}
                                                                onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                                                            />
                                                        </div>
                                                    ))}

                                                    <button
                                                        type="button"
                                                        onClick={addFAQ}
                                                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors py-1 group outline-none"
                                                    >
                                                        <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 group-hover:bg-slate-100 transition-all">
                                                            <Plus className="w-3 h-3 text-slate-400" />
                                                        </div>
                                                        <span className="text-[11px] font-bold">Add another question</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="h-10 px-6 rounded-full border-slate-200 font-bold text-slate-800 text-sm hover:bg-slate-50 outline-none"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                className="h-10 px-8 rounded-full bg-black hover:bg-black/90 text-white font-bold text-sm"
                                                onClick={nextStep}

                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                                {step === 6 && (
                                    <motion.div
                                        key="step6"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-1">
                                            <h2 className="text-base font-bold text-slate-900">
                                                Add an image to highlight your service
                                            </h2>
                                            <p className="text-xs text-slate-400">
                                                Attract clients with a custom image or use one from our resources.
                                            </p>
                                        </div>

                                        {/* Preview Box */}
                                        <div className="relative aspect-[16/10] max-h-[200px] w-full bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden mx-auto shadow-inner">
                                            {formData.imagePreview ? (
                                                <img
                                                    src={formData.imagePreview}
                                                    alt="Preview"
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-300">
                                                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                                    <span className="text-lg font-bold tracking-tight">Preview</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Button */}
                                        <div className="space-y-3">
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full h-11 rounded-full border-slate-200 text-sm font-bold transition-all outline-none",
                                                    formData.imagePreview ? "border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50" : "hover:bg-slate-50"
                                                )}
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                            >
                                                {formData.imagePreview ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Change Image
                                                    </span>
                                                ) : "Select a file"}
                                            </Button>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setFormData({
                                                            ...formData,
                                                            image: file,
                                                            imagePreview: URL.createObjectURL(file)
                                                        })
                                                    }
                                                }}
                                            />
                                            <p className="text-[10px] text-slate-400 text-center leading-normal max-w-sm mx-auto">
                                                Images at least 1600 x 1200 (4:3 aspect ratio) in PNG, JPG, or GIF formats work best. 10MB max file size.
                                            </p>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="h-10 px-6 rounded-full border-slate-200 font-bold text-slate-800 text-sm hover:bg-slate-50 outline-none"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                className="h-10 px-10 rounded-full bg-black hover:bg-black/90 text-white font-bold text-sm min-w-[140px] flex items-center justify-center gap-2"
                                                onClick={handlePublish}
                                                disabled={isPublishing}
                                            >
                                                {isPublishing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Please wait...</span>
                                                    </>
                                                ) : "Publish"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div >
    )
}
