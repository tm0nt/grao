"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { InputHTMLAttributes, ReactNode } from "react"
import { useState } from "react"

interface EnhancedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  icon?: ReactNode
}

export function EnhancedInput({ label, error, helperText, icon, className, id, ...props }: EnhancedInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-white text-sm font-medium flex items-center gap-2">
        {icon && <span className="text-[#00D9A3]">{icon}</span>}
        {label}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          className={cn(
            "bg-[#2a2a2a] border-gray-700 text-white h-11",
            "transition-all duration-200 ease-out",
            "placeholder:text-gray-500",
            "hover:border-gray-600",
            "focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20",
            isFocused && "shadow-lg shadow-[#00D9A3]/5",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className,
          )}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
          <span className="w-1 h-1 rounded-full bg-red-400" />
          {error}
        </p>
      )}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}
