"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { InputHTMLAttributes } from "react"

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export function FormInput({ label, error, helperText, className, id, ...props }: FormInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="space-y-1">
      <Label htmlFor={inputId} className="text-white text-sm font-medium">
        {label}
      </Label>
      <Input
        id={inputId}
        className={cn(
          "bg-[#2a2a2a] border-gray-700 text-white focus:border-[#00D9A3] focus:ring-[#00D9A3]/20 transition-all",
          error && "border-red-500 focus:border-red-500",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}
