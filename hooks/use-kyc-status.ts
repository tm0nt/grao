"use client"

import { useState, useEffect } from "react"

export function useKYCStatus() {
  const [isKYCVerified, setIsKYCVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check KYC status from localStorage or API
    const kycStatus = localStorage.getItem("kycVerified")
    setIsKYCVerified(kycStatus === "true")
    setIsLoading(false)
  }, [])

  const updateKYCStatus = (status: boolean) => {
    localStorage.setItem("kycVerified", status.toString())
    setIsKYCVerified(status)
  }

  return { isKYCVerified, isLoading, updateKYCStatus }
}
