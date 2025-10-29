"use client";

import { useEffect, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Copy, Check, Users, TrendingUp, Award, Share2 } from "lucide-react";
import { toast } from "sonner";

type AffiliateDTO = {
  affiliateLink: string;
  referralCode: string;
  stats: {
    totalReferrals: number;
    activeInvestors: number;
    totalEarnings: number;
    thisMonth: number;
  };
  levels: { level: number; percentage: number; description: string; color: string }[];
};

export default function AffiliatePage() {
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<AffiliateDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/affiliate", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar afiliação");
        const dto: AffiliateDTO = await res.json();
        if (alive) setData(dto);
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar afiliação");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const affiliateLink = data?.affiliateLink || "https://example.com/ref/—";

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = data?.stats || {
    totalReferrals: 0,
    activeInvestors: 0,
    totalEarnings: 0,
    thisMonth: 0,
  };

  const levels = data?.levels || [
    { level: 1, percentage: 5, description: "Indicações diretas", color: "#00D9A3" },
    { level: 2, percentage: 3, description: "Indicações de 2º nível", color: "#6366f1" },
    { level: 3, percentage: 1, description: "Indicações de 3º nível", color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64">
      <DesktopSidebar />

      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Programa de Afiliação</h1>
          <p className="text-gray-400 text-sm">Ganhe comissões indicando novos investidores</p>
        </motion.div>

        {/* Affiliate Link Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-[#00D9A3] to-[#00b386] rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-black" />
            <h3 className="text-black font-semibold">Seu link de indicação</h3>
          </div>
          <div className="bg-black/20 rounded-2xl p-4 mb-4">
            <code className="text-sm text-black break-all">{affiliateLink}</code>
          </div>
          <Button onClick={copyLink} className="w-full bg-black text-white hover:bg-black/90 rounded-full py-6 font-semibold flex items-center justify-center gap-2">
            {copied ? (<><Check className="w-5 h-5" /> Link copiado!</>) : (<><Copy className="w-5 h-5" /> Copiar link</>)}
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <Users className="w-5 h-5 text-[#00D9A3] mb-2" />
            <p className="text-2xl font-bold text-white mb-1">{loading ? "—" : stats.totalReferrals}</p>
            <p className="text-xs text-gray-400">Total de indicações</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <TrendingUp className="w-5 h-5 text-[#00D9A3] mb-2" />
            <p className="text-2xl font-bold text-white mb-1">{loading ? "—" : stats.activeInvestors}</p>
            <p className="text-xs text-gray-400">Investidores ativos</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <Award className="w-5 h-5 text-[#00D9A3] mb-2" />
            <p className="text-2xl font-bold text-white mb-1">R$ {(loading ? 0 : stats.totalEarnings).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400">Ganhos totais</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <TrendingUp className="w-5 h-5 text-[#00D9A3] mb-2" />
            <p className="text-2xl font-bold text-white mb-1">R$ {(loading ? 0 : stats.thisMonth).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400">Este mês</p>
          </div>
        </motion.div>

        {/* How it Works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#1a1a1a] rounded-3xl p-6 mb-6 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Como funciona</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: "Compartilhe seu link", text: "Envie seu link de indicação para amigos e familiares" },
              { step: 2, title: "Eles investem", text: "Quando alguém se cadastra e investe usando seu link" },
              { step: 3, title: "Você ganha comissão", text: "Receba comissões recorrentes sobre os investimentos" },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#00D9A3] flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">{s.step}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">{s.title}</p>
                  <p className="text-gray-400 text-xs">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Multi-level System */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Sistema Multi-Nível</h3>
          <p className="text-gray-400 text-sm mb-6">
            Ganhe comissões não apenas das suas indicações diretas, mas também das indicações feitas por elas!
          </p>

          <div className="space-y-3">
            {levels.map((level, index) => (
              <div key={index} className="bg-[#2a2a2a] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${level.color}20` }}>
                      <span className="font-bold" style={{ color: level.color }}>{level.level}º</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{level.description}</p>
                      <p className="text-gray-400 text-xs">Nível {level.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-lg font-bold">{level.percentage}%</p>
                    <p className="text-gray-400 text-xs">comissão</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-[#00D9A3]/10 border border-[#00D9A3]/20 rounded-2xl p-4">
            <p className="text-sm text-[#00D9A3]">
              💡 <span className="font-semibold">Exemplo:</span> Se você indicar alguém que investe R$ 10.000, você
              ganha R$ {(10_000 * (levels.find(l => l.level === 1)?.percentage || 5) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (nível 1).
            </p>
          </div>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
}
