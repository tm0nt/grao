"use client"

import { MobileNav } from "@/components/mobile-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { AnimatedBackground } from "@/components/animated-background"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface PageContainerProps {
  children: ReactNode
  showNav?: boolean
  backgroundVariant?: "default" | "subtle" | "intense"
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
}

export function PageContainer({
  children,
  showNav = true,
  backgroundVariant = "default",
  maxWidth = "2xl",
}: PageContainerProps) {
  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64 relative overflow-hidden">
      <AnimatedBackground variant={backgroundVariant} />

      {showNav && <DesktopSidebar />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-4 md:p-6 ${maxWidthClasses[maxWidth]} mx-auto relative z-10`}
      >
        {children}
      </motion.div>

      {showNav && <MobileNav />}
    </div>
  )
}
