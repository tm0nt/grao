"use client"

import { MessageCircle, Phone } from "lucide-react"
import { motion } from "framer-motion"
import { ACCOUNT_MANAGER } from "@/lib/constants"

export function AccountManagerCard() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Olá! Gostaria de falar com meu gerente de contas.")
    window.open(`https://wa.me/${ACCOUNT_MANAGER.phone}?text=${message}`, "_blank")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleWhatsAppClick}
      className="bg-gradient-to-br from-[#00D9A3]/10 via-[#1a1a1a] to-[#1a1a1a] rounded-3xl p-5 border border-[#00D9A3]/30 cursor-pointer hover:border-[#00D9A3] transition-all hover:scale-[1.02] group"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D9A3] to-[#00b386] flex items-center justify-center text-2xl font-bold text-black overflow-hidden border-2 border-[#00D9A3]">
            <img
              src={ACCOUNT_MANAGER.avatar || "/placeholder.svg"}
              alt="Gerente de Contas"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center border-2 border-black">
            <MessageCircle className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-lg">{ACCOUNT_MANAGER.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D9A3]/20 text-[#00D9A3] border border-[#00D9A3]/30">
              Premium
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2">{ACCOUNT_MANAGER.role}</p>
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-[#00D9A3]" />
            <span className="text-xs text-gray-500">Disponível no WhatsApp</span>
          </div>
        </div>
        <div className="text-[#25D366] group-hover:translate-x-1 transition-transform">
          <MessageCircle className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}
