// components/balance-card.tsx
"use client";

import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

interface BalanceCardProps {
  balance: number;
  hideBalance: boolean;
  onToggleVisibility: () => void;
  title?: string;
  subtitle?: string;
  showPercentage?: boolean;
  percentageChange?: number;
}

export function BalanceCard({
  balance,
  hideBalance,
  onToggleVisibility,
  title = "Meus investimentos",
  subtitle,
  showPercentage = true,
  percentageChange = 0,
}: BalanceCardProps) {
  const formatBalance = (amount: number) => {
    if (hideBalance) return "R$ ••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const pct = Number.isFinite(percentageChange) ? percentageChange : 0;
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  const absPct = Math.abs(pct).toFixed(2);
  const pctColor = pct >= 0 ? "text-[#00D9A3]" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-[#1a1a1a] via-[#1a1a1a] to-[#0f0f0f] rounded-3xl p-6 border border-gray-800 overflow-hidden group hover:border-[#00D9A3]/50 transition-all"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D9A3]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm font-medium">{title}</span>
          <button
            onClick={onToggleVisibility}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
            aria-label={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
          >
            {hideBalance ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
          </button>
        </div>
        <div className="text-4xl font-bold text-white mb-2">{formatBalance(balance)}</div>
        {showPercentage && (
          <div className="flex items-center gap-2 text-sm">
            <span className={`${pctColor} font-semibold`}>
              {sign}
              {absPct}%
            </span>
            <span className="text-gray-500">{subtitle || "este mês"}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
