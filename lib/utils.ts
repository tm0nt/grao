import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string): string {
  const numbers = value.replace(/\D/g, "")
  const amount = Number(numbers) / 100
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11)
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "")
  if (numbers.length !== 11) return false

  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(numbers)) return false

  // Validate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(numbers.charAt(i)) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== Number.parseInt(numbers.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(numbers.charAt(i)) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== Number.parseInt(numbers.charAt(10))) return false

  return true
}

export function validateFullName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.split(" ").length >= 2 && trimmed.length >= 3
}

export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11)
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
}

export function validatePixKey(key: string, type: string): boolean {
  switch (type) {
    case "email":
      return validateEmail(key)
    case "cpf":
      return validateCPF(key)
    case "phone":
      return key.replace(/\D/g, "").length >= 10
    case "random":
      return key.length >= 32
    default:
      return false
  }
}
