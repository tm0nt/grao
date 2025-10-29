"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CurrencyInput({ value, onChange, placeholder, className }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(value ? formatCurrency(value) : "")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    onChange(rawValue)
    setDisplayValue(formatCurrency(rawValue))
  }

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder || "R$ 0,00"}
      className={className}
      style={{
        MozAppearance: "textfield",
        WebkitAppearance: "none",
      }}
    />
  )
}
