"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, TrendingUp, Wallet, User } from "lucide-react"
import { motion } from "framer-motion"

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/invest", icon: TrendingUp, label: "Investir" },
    { href: "/wallet", icon: Wallet, label: "Carteira" },
    { href: "/account", icon: User, label: "Conta" },
  ]

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 px-4 py-3 z-50 backdrop-blur-lg bg-opacity-95"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 relative">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  isActive ? "bg-[#00D9A3]" : "bg-transparent"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "text-black" : "text-gray-400"}`} />
              </motion.div>
              <span className={`text-xs ${isActive ? "text-[#00D9A3] font-semibold" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
