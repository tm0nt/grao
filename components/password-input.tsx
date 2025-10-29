"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { FormInput } from "./form-input"
import type { InputHTMLAttributes } from "react"

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string
  error?: string
}

export function PasswordInput({ label, error, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <FormInput label={label} type={showPassword ? "text" : "password"} error={error} className="pr-10" {...props} />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-[34px] text-gray-400 hover:text-[#00D9A3] transition-colors"
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  )
}
