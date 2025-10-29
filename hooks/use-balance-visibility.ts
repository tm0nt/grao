"use client"

import { useState } from "react"

export function useBalanceVisibility(initialState = false) {
  const [hideBalance, setHideBalance] = useState(initialState)

  const toggleBalance = () => setHideBalance((prev) => !prev)

  const formatBalance = (amount: number) => {
    if (hideBalance) return "R$ ••••••"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  return { hideBalance, toggleBalance, formatBalance }
}
