"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ImageIcon, CheckCircle2, Upload, CloudUpload, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { useUploadThing } from "@/lib/uploadthing"
import { createProduct } from "@/app/actions/product"
import React from "react"

export default function CreateProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    description: "",
    image: null as File | null,
    imagePreview: null as string | null,
    tags: [] as string[],
    price: "",
    license: "personal" as "personal" | "commercial",
    productFiles: [] as File[],
  })
  const [tagInput, setTagInput] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)

  const { startUpload: uploadImage } = useUploadThing("productImage")
  const { startUpload: uploadFiles } = useUploadThing("productFile")

  const steps = [1, 2, 3, 4]
  const progress = ((step - 1) / (steps.length - 1)) * 100

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length))
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput("")
    }
  }

  const handlePublish = async () => {
    if (isPublishing) return

    try {
      if (!formData.image) {
        toast.error("Please upload a cover image")
        setStep(2)
        return
      }
      if (formData.productFiles.length === 0) {
        toast.error("Please upload at least one product file")
        setStep(4)
        return
      }

      setIsPublishing(true)
      toast.loading("Publishing product...", { id: "publish" })

      // 1. Upload Cover Image
      const imageRes = await uploadImage([formData.image])
      if (!imageRes) {
        toast.error("Failed to upload cover image", { id: "publish" })
        setIsPublishing(false)
        return
      }

      // 2. Upload Product Files
      const fileRes = await uploadFiles(formData.productFiles)
      if (!fileRes) {
        toast.error("Failed to upload product files", { id: "publish" })
        setIsPublishing(false)
        return
      }

      // 3. Create Product in DB
      const result = await createProduct({
        category: formData.category,
        name: formData.name,
        description: formData.description,
        images: imageRes.map(f => f.url),
        tags: formData.tags,
        price: formData.price,
        license: formData.license,
        fileUrls: fileRes.map(f => f.url)
      })

      if (result.error) {
        toast.error(result.error, { id: "publish" })
        setIsPublishing(false)
        return
      }

      toast.success("Product published!", { id: "publish" })
      router.back()
      router.refresh()

    } catch (err: any) {
      console.error(err)
      toast.error("Something went wrong", { id: "publish" })
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 flex flex-col items-center font-sans">
      <div className="max-w-2xl w-full">

        {/* Stepper */}
        <div className="flex items-center justify-center mb-10 relative max-w-xs mx-auto">
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
                    backgroundColor: step >= s ? "#64748b" : "transparent"
                  }}
                  transition={{ duration: 0.3, delay: step >= s ? 0.2 : 0 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight">Create a Product</h1>

                  {/* Category Section */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-lg font-bold text-slate-900">Category</Label>
                      <p className="text-sm text-slate-500">Pick your Product category to get started.</p>
                    </div>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                      <SelectTrigger className="w-full h-14 bg-white border-slate-200 rounded-xl text-slate-500 px-6 focus:ring-0 focus:ring-offset-0 text-left">
                        <SelectValue placeholder="Can't find your category? Choose &quot;Other&quot;." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value="templates">Templates & UI Kits</SelectItem>
                        <SelectItem value="graphics">Graphics & Illustrations</SelectItem>
                        <SelectItem value="fonts">Fonts & Typography</SelectItem>
                        <SelectItem value="icons">Icons</SelectItem>
                        <SelectItem value="3d">3D Assets</SelectItem>
                        <SelectItem value="photography">Stock Photography</SelectItem>
                        <SelectItem value="audio">Music & Audio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Name Section */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-lg font-bold text-slate-900">Product name</Label>
                      <p className="text-sm text-slate-500">Use a clear name so buyers instantly understand what this product is.</p>
                    </div>
                    <Input
                      placeholder="e.g. SaaS Landing Page UI Kit"
                      className="h-14 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Short Description Section */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-lg font-bold text-slate-900">Short Description</Label>
                      <p className="text-sm text-slate-500">Briefly explain what the product is and who it's for.</p>
                    </div>
                    <Textarea
                      placeholder="e.g. A clean, modern landing page UI kit for SaaS startups"
                      className="min-h-[160px] bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 resize-none leading-relaxed"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => router.back()}
                      className="h-12 px-8 rounded-full border-slate-200 font-bold text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="h-12 px-10 rounded-full bg-black hover:bg-black/90 text-white font-bold transition-all active:scale-95"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Preview Images */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight">Create a Product</h1>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-lg font-bold text-slate-900">Preview Images</Label>
                      <p className="text-sm text-slate-500">Show clear previews so buyers know what they&apos;re purchasing.</p>
                    </div>

                    {/* Preview Box */}
                    <div className="relative aspect-[16/10] w-full bg-[#f8f8f8] rounded-[2rem] flex flex-col items-center justify-center border border-slate-100 overflow-hidden shadow-sm group">
                      {formData.imagePreview ? (
                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-300">
                          <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                          <span className="text-xl font-bold tracking-tight">Preview</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="space-y-6">
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-14 rounded-full border-slate-200 text-base font-bold transition-all outline-none",
                          formData.imagePreview ? "border-emerald-200 bg-emerald-50/20 text-emerald-700" : "hover:bg-slate-50 text-slate-900"
                        )}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        {formData.imagePreview ? (
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
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
                      <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-sm mx-auto">
                        Images at least 1600 x 1200 (4:3 aspect ratio) in PNG, JPG, or GIF formats work best. 10MB max file size.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handlePrev}
                      className="h-12 px-8 rounded-full border-slate-200 font-bold text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      className="h-12 px-10 rounded-full bg-black hover:bg-black/90 text-white font-bold transition-all active:scale-95"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Tags, Price & License */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight">Create a Product</h1>

                  <div className="space-y-8">
                    {/* Search Tags Section */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-lg font-bold text-slate-900">
                          Search tags
                        </Label>
                        <p className="text-sm text-slate-500">Add up to 5 tags to help buyers find your product.</p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. UI kit, SaaS, landing page"
                          className="h-14 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <Button type="button" onClick={handleAddTag} className="h-14 bg-black text-white rounded-xl px-8 font-bold">Add</Button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tag, i) => (
                            <span key={i} className="text-xs font-semibold px-3 py-2 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-2">
                              {tag}
                              <X className="w-4 h-4 cursor-pointer hover:text-red-500" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }))} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price Section */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-lg font-bold text-slate-900">Price</Label>
                        <p className="text-sm text-slate-500">Set a one-time price for this product.</p>
                      </div>
                      <Input
                        placeholder="e.g. ₹1499"
                        className="h-14 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={formData.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, price: val });
                        }}
                      />
                    </div>

                    {/* License Section */}
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <Label className="text-lg font-bold text-slate-900">License</Label>
                        <p className="text-sm text-slate-500">Choose how buyers are allowed to use this product.</p>
                      </div>
                      <div className="flex items-center gap-8">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, license: "personal" })}
                          className="flex items-center gap-3 group outline-none"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            formData.license === "personal" ? "border-slate-900" : "border-slate-300 group-hover:border-slate-400"
                          )}>
                            {formData.license === "personal" && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                          </div>
                          <span className={cn(
                            "text-sm font-bold transition-colors",
                            formData.license === "personal" ? "text-slate-900" : "text-slate-500"
                          )}>Personal use</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, license: "commercial" })}
                          className="flex items-center gap-3 group outline-none"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            formData.license === "commercial" ? "border-slate-900" : "border-slate-300 group-hover:border-slate-400"
                          )}>
                            {formData.license === "commercial" && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                          </div>
                          <span className={cn(
                            "text-sm font-bold transition-colors",
                            formData.license === "commercial" ? "text-slate-900" : "text-slate-500"
                          )}>Commercial use</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handlePrev}
                      className="h-12 px-8 rounded-full border-slate-200 font-bold text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      className="h-12 px-10 rounded-full bg-black hover:bg-black/90 text-white font-bold transition-all active:scale-95"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: File Upload */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight">Create a Product</h1>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-lg font-bold text-slate-900">File upload</Label>
                      <p className="text-sm text-slate-500">Upload the exact files buyers will receive after purchase.</p>
                    </div>

                    {/* Upload Zone */}
                    <div
                      className="relative w-full py-12 px-6 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center transition-colors hover:border-slate-300 group cursor-pointer"
                      onClick={() => document.getElementById("product-files")?.click()}
                    >
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-slate-900" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Upload a your product file.</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-400 font-medium tracking-tight uppercase">Accepted formats: ZIP, PDF, FIG, MP4, PNG, JPG</p>
                        <p className="text-sm text-slate-400 font-medium">Max file size: 1GB</p>
                        <p className="text-sm text-slate-400 font-medium">Multiple files allowed</p>
                      </div>

                      {formData.productFiles.length > 0 && (
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                          {formData.productFiles.map((file, i) => (
                            <div key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {file.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Select File Button */}
                    <div className="space-y-6">
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full h-14 rounded-full border-slate-200 text-base font-bold text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                        onClick={() => document.getElementById("product-files")?.click()}
                      >
                        Select a file
                      </Button>
                      <input
                        id="product-files"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setFormData({ ...formData, productFiles: [...formData.productFiles, ...files] });
                        }}
                      />
                      <p className="text-xs text-slate-400 text-center leading-relaxed">
                        Make sure you own the rights to sell these files. Copyrighted or stolen content is not allowed.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handlePrev}
                      className="h-12 px-8 rounded-full border-slate-200 font-bold text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      disabled={isPublishing}
                      className="h-12 px-10 rounded-full bg-black hover:bg-black/90 text-white font-bold transition-all active:scale-95 min-w-[140px]"
                      onClick={handlePublish}
                    >
                      {isPublishing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing...
                        </div>
                      ) : (
                        "Publish"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Placeholder for future steps */}
              {step > 4 && (
                <motion.div
                  key={`step${step}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                >
                  <h2 className="text-2xl font-bold text-slate-900">Step {step} Coming Soon</h2>
                  <p className="text-slate-500">Send the next screenshot to continue!</p>
                  <Button onClick={handlePrev} variant="ghost">Go Back</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
