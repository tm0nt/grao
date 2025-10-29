"use client"

import { motion } from "framer-motion"
import { Plane, Trophy, Gift, Star, Sparkles, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const awards = [
  {
    title: "Viagem para Dubai",
    description: "7 dias em hotel 5 estrelas com passagens incluídas",
    requirement: "Investimento acima de R$ 100.000",
    icon: Plane,
    image: "/placeholder.svg?height=300&width=400",
    gradient: "from-amber-500/20 to-orange-500/20",
    color: "text-amber-400",
  },
  {
    title: "Cruzeiro pelo Caribe",
    description: "10 dias navegando pelas ilhas caribenhas",
    requirement: "Investimento acima de R$ 75.000",
    icon: MapPin,
    image: "/placeholder.svg?height=300&width=400",
    gradient: "from-blue-500/20 to-cyan-500/20",
    color: "text-blue-400",
  },
  {
    title: "Experiência VIP",
    description: "Acesso exclusivo a eventos e networking premium",
    requirement: "Investimento acima de R$ 50.000",
    icon: Star,
    image: "/placeholder.svg?height=300&width=400",
    gradient: "from-purple-500/20 to-pink-500/20",
    color: "text-purple-400",
  },
  {
    title: "Bônus em Dinheiro",
    description: "Até R$ 10.000 em bônus de investimento",
    requirement: "Investimento acima de R$ 25.000",
    icon: Gift,
    image: "/placeholder.svg?height=300&width=400",
    gradient: "from-green-500/20 to-emerald-500/20",
    color: "text-[#00D9A3]",
  },
]

export function AwardsSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-[#00D9A3]" />
          <h2 className="text-3xl font-bold text-white">Prêmios Exclusivos</h2>
          <Sparkles className="w-8 h-8 text-[#00D9A3]" />
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Invista mais e desbloqueie experiências incríveis. Quanto maior seu investimento,{" "}
          <span className="text-[#00D9A3] font-semibold">maiores as recompensas</span>!
        </p>
      </motion.div>

      {/* Awards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {awards.map((award, index) => {
          const Icon = award.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-3xl border border-gray-800 hover:border-[#00D9A3]/50 transition-all"
            >
              {/* Background Image */}
              <div className="relative h-48 overflow-hidden">
                <img src={award.image || "/placeholder.svg"} alt={award.title} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t ${award.gradient} to-transparent`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />

                {/* Icon Badge */}
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-gray-700 flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${award.color}`} />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00D9A3] transition-colors">
                    {award.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{award.description}</p>
                </div>

                {/* Requirement Badge */}
                <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl border border-gray-800">
                  <div className="w-2 h-2 rounded-full bg-[#00D9A3] animate-pulse" />
                  <p className="text-xs text-gray-300 font-medium">{award.requirement}</p>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Seu progresso</span>
                    <span className="text-[#00D9A3] font-semibold">45%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "45%" }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 1 }}
                      className="h-full bg-gradient-to-r from-[#00D9A3] to-[#00b386] rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#00D9A3]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-[#00D9A3]/10 via-[#00D9A3]/5 to-transparent rounded-3xl p-8 border border-[#00D9A3]/20 text-center"
      >
        <h3 className="text-2xl font-bold text-white mb-3">Pronto para desbloquear seu prêmio?</h3>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Aumente seus investimentos hoje e comece a conquistar experiências exclusivas que vão transformar sua vida.
        </p>
        <Link href="/invest">
          <Button className="bg-[#00D9A3] text-black hover:bg-[#00b386] rounded-full px-8 py-6 text-lg font-bold shadow-lg shadow-[#00D9A3]/20 hover:shadow-[#00D9A3]/40 transition-all">
            <Trophy className="w-5 h-5 mr-2" />
            Investir Agora
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
