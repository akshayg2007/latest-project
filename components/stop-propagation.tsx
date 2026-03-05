"use client"

import { ReactNode } from "react"

export default function StopPropagation({ children }: { children: ReactNode }) {
  return (
    <div onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
    }}>
      {children}
    </div>
  )
}