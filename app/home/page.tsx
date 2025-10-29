"use client";

import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { TrendingUp, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { PageContainer } from "@/components/page-container";
import { BalanceCard } from "@/components/balance-card";
import { AccountManagerCard } from "@/components/account-manager-card";
import { useUser } from "@/hooks/use-user";
import { useBalanceVisibility } from "@/hooks/use-balance-visibility";
import { useFeaturedPlans } from "@/hooks/use-featured-plans";

export default function HomePage() {
  const { user } = useUser();
  const { hideBalance, toggleBalance } = useBalanceVisibility();
  const { plans } = useFeaturedPlans();

  const balance = typeof user?.balance === "number" ? user.balance : 0;
  const pct = typeof user?.monthly_change_pct === "number" ? user.monthly_change_pct : 0;

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64 relative overflow-hidden">
      {/* Animated background gradients for consistency */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], x: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00D9A3]/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1], y: [0, 50, 0] }}
        transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00D9A3]/8 rounded-full blur-3xl pointer-events-none"
      />

      <DesktopSidebar />

      <PageContainer>
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl text-white font-light">
            Olá, <span className="font-semibold text-[#00D9A3]">{user?.name || "Investidor"}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Bem-vindo de volta à sua carteira</p>
        </motion.div>

        {/* Balance Card */}
        <div className="mb-6">
          <BalanceCard
            balance={balance}
            hideBalance={hideBalance}
            onToggleVisibility={toggleBalance}
            showPercentage
            percentageChange={pct}
          />
        </div>

        {/* Account Manager Card */}
        <div className="mb-6">
          <AccountManagerCard />
        </div>

        {/* Alert Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-[#2a2a2a] via-[#1a1a1a] to-[#1a1a1a] rounded-2xl p-4 mb-6 border border-gray-800 hover:border-[#00D9A3]/50 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00D9A3]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#00D9A3]" />
            </div>
            <div>
              <p className="text-sm text-[#00D9A3] font-semibold mb-1">Novos imóveis disponíveis!</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Confira as novas oportunidades de investimento com{" "}
                <span className="text-white font-semibold">alto rendimento</span> e retorno potencialmente superior.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <Link
            href="/invest"
            className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-4 border border-gray-800 hover:border-[#00D9A3] transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D9A3]/20 to-[#00D9A3]/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-[#00D9A3]" />
            </div>
            <p className="text-sm text-white font-medium mb-1">Imóveis</p>
            <p className="text-xs text-gray-500">Investir</p>
            <div className="h-1 w-full bg-gradient-to-r from-[#00D9A3] to-transparent rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/wallet"
            className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-4 border border-gray-800 hover:border-[#00D9A3] transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D9A3]/20 to-[#00D9A3]/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-[#00D9A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-white font-medium mb-1">Carteira</p>
            <p className="text-xs text-gray-500">Gerenciar</p>
            <div className="h-1 w-full bg-gradient-to-r from-[#00D9A3] to-transparent rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/affiliate"
            className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-4 border border-gray-800 hover:border-[#00D9A3] transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D9A3]/20 to-[#00D9A3]/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-[#00D9A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-white font-medium mb-1">Afiliação</p>
            <p className="text-xs text-gray-500">Indicar</p>
            <div className="h-1 w-full bg-gradient-to-r from-[#00D9A3] to-transparent rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>

        {/* Em destaque */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#00D9A3]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00D9A3]" />
            </div>
            <h3 className="text-white font-semibold text-lg">Em destaque</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/invest?plan=${encodeURIComponent(p.id)}`}
                className="block bg-gradient-to-br from-[#1a1a1a] via-[#1a1a1a] to-[#0f0f0f] rounded-3xl p-6 border border-gray-800 hover:border-[#00D9A3] transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-2">{p.name}</h4>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#00D9A3]/10 text-[#00D9A3] border border-[#00D9A3]/20 font-medium">
                        {p.category}
                      </span>
                      {p.risk_level && (
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 border border-gray-700">
                          {p.risk_level}
                        </span>
                      )}
                    </div>
                  </div>
                  {p.is_new && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[#00D9A3] text-black font-bold shadow-lg shadow-[#00D9A3]/20">
                      NOVO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-black/30 rounded-xl p-3 border border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Aplicação inicial</p>
                    <p className="text-base text-white font-bold">
                      {p.min_investment.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Rendimento</p>
                    <p className="text-base text-[#00D9A3] font-bold">
                      {p.monthly_return_rate ? `${(p.monthly_return_rate * 100).toFixed(1)}% a.m.` : "—"}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Duração</p>
                    <p className="text-base text-white font-bold flex items-center gap-1">
                      {p.duration_months} meses
                      <TrendingUp className="w-4 h-4 text-[#00D9A3]" />
                    </p>
                  </div>
                </div>

                <Button className="w-full bg-[#00D9A3] text-black hover:bg-[#00b386] rounded-full font-bold text-base h-12 shadow-lg shadow-[#00D9A3]/20 group-hover:shadow-[#00D9A3]/40 transition-all">
                  Investir agora
                </Button>
              </Link>
            ))}
          </div>
        </motion.div>
      </PageContainer>

      <MobileNav />
    </div>
  );
}
