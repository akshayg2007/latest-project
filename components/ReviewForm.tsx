"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createReview } from "@/app/actions/createReview"
import { useFormStatus } from "react-dom"

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-50">
      {pending ? "Submitting..." : "Submit Review"}
    </Button>
  )
}

function CategoryRating({ label, name, value, onChange }: { label: string, name: string, value: number, onChange: (val: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform active:scale-90"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`w-5 h-5 ${star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-200"
                }`}
            />
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

export default function ReviewForm({ serviceId, orderId }: { serviceId?: string, orderId: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)

  const [prof, setProf] = useState(0)
  const [time, setTime] = useState(0)
  const [qual, setQual] = useState(0)
  const [comm, setComm] = useState(0)

  return (
    <form action={createReview} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl mt-8 max-w-2xl mx-auto">
      <div className="text-center space-y-1 mb-6">
        <h3 className="text-2xl font-bold text-slate-900">How was your experience?</h3>
        <p className="text-slate-500">Your feedback helps the community and the seller</p>
      </div>

      {/* Hidden Inputs for Server Action */}
      {serviceId && <input type="hidden" name="serviceId" value={serviceId} />}
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="rating" value={rating} />

      {/* Main Star Selection */}
      <div className="flex flex-col items-center gap-3 py-4 border-y border-slate-100">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Overall Rating</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-all hover:scale-110"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              <Star
                className={`w-10 h-10 ${star <= (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-200"
                  }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Categories */}
      <div className="space-y-1 py-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Detailed Ratings</h4>
        <CategoryRating label="Professionalism" name="ratingProfessionalism" value={prof} onChange={setProf} />
        <CategoryRating label="Timeliness" name="ratingTimeliness" value={time} onChange={setTime} />
        <CategoryRating label="Quality of Work" name="ratingQualityOfWork" value={qual} onChange={setQual} />
        <CategoryRating label="Communication" name="ratingCommunication" value={comm} onChange={setComm} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Tell us more</label>
        <Textarea
          name="comment"
          placeholder="What did you like or dislike? How can the seller improve?"
          required
          className="min-h-[120px] rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <SubmitButton disabled={rating === 0} />
    </form>
  )
}