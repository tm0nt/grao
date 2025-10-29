"use client"

import { motion } from "framer-motion"

interface AnimatedBackgroundProps {
  variant?: "default" | "subtle" | "intense"
}

export function AnimatedBackground({ variant = "default" }: AnimatedBackgroundProps) {
  const configs = {
    default: {
      blob1: { size: 500, opacity: [0.2, 0.4, 0.2], duration: 12 },
      blob2: { size: 600, opacity: [0.15, 0.35, 0.15], duration: 15 },
      blob3: { size: 700, opacity: [0.1, 0.25, 0.1], duration: 18 },
    },
    subtle: {
      blob1: { size: 400, opacity: [0.1, 0.2, 0.1], duration: 15 },
      blob2: { size: 500, opacity: [0.08, 0.15, 0.08], duration: 18 },
      blob3: { size: 600, opacity: [0.05, 0.12, 0.05], duration: 20 },
    },
    intense: {
      blob1: { size: 600, opacity: [0.3, 0.5, 0.3], duration: 10 },
      blob2: { size: 700, opacity: [0.25, 0.45, 0.25], duration: 12 },
      blob3: { size: 800, opacity: [0.2, 0.35, 0.2], duration: 15 },
    },
  }

  const config = configs[variant]

  return (
    <>
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: config.blob1.opacity,
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: config.blob1.duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 bg-[#00D9A3]/20 rounded-full blur-3xl pointer-events-none"
        style={{ width: config.blob1.size, height: config.blob1.size }}
      />
      <motion.div
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: config.blob2.opacity,
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: config.blob2.duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-0 bg-[#00D9A3]/15 rounded-full blur-3xl pointer-events-none"
        style={{ width: config.blob2.size, height: config.blob2.size }}
      />
      <motion.div
        animate={{
          scale: [1.1, 1.4, 1.1],
          opacity: config.blob3.opacity,
          x: [0, 30, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: config.blob3.duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00D9A3]/10 rounded-full blur-3xl pointer-events-none"
        style={{ width: config.blob3.size, height: config.blob3.size }}
      />
    </>
  )
}
