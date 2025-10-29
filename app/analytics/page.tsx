"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PerformancePoint = {
  date: string;
  returnPct: number;
  balance: number;
  deposits: number;
  withdrawals: number;
  investments: number;
};

type PlanOption = { id: string; name: string };

type DistributionItem = {
  planId: string;
  planName: string;
  amount: number;
  sharePct: number;
};

type ExtractItem = {
  date: string;
  type: "deposit" | "withdraw" | "return" | "investment";
  description: string;
  amount: number;
};

type AnalyticsDTO = {
  range: { from: string; to: string };
  agg: {
    periodReturnPct: number;
    lastUpdate: string;
  };
  series: PerformancePoint[];
  distribution: DistributionItem[];
  extract: ExtractItem[];
  plans: PlanOption[];
};

const periods = [
  { key: "all", label: "Desde o início" },
  { key: "ytd", label: "Ano atual" },
  { key: "last3m", label: "Últimos 3 meses" },
  { key: "last6m", label: "Últimos 6 meses" },
  { key: "month", label: "Mês atual" },
];

const chartOptions = [
  { key: "rent", label: "Rentabilidade (%)" },
  { key: "balance", label: "Saldo" },
  { key: "flows", label: "Aportes x Saques" },
  { key: "distribution", label: "Distribuição por plano" },
];

export default function AnalyticsPage() {
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedChart, setSelectedChart] = useState<string>("rent");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsDTO | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const qs = new URLSearchParams();
        qs.set("period", selectedPeriod);
        if (selectedPlan !== "all") qs.set("planId", selectedPlan);
        const res = await fetch(`/api/analytics/overview?${qs.toString()}`, { cache: "no-store" });
        const dto: AnalyticsDTO = res.ok ? await res.json() : null as any;
        if (alive) setData(dto);
      } catch {
        if (alive) setData(null as any);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedPeriod, selectedPlan]);

  const lineData = useMemo(() => {
    return (data?.series || []).map(p => ({
      date: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      rent: Number(p.returnPct.toFixed(2)),
      balance: p.balance,
      deposits: p.deposits,
      withdrawals: p.withdrawals,
      investments: p.investments,
      netFlow: p.deposits - p.withdrawals - p.investments,
    }));
  }, [data]);

  const distributionData = useMemo(() => {
    return (data?.distribution || []).map(d => ({
      name: d.planName,
      amount: d.amount,
      share: Number(d.sharePct.toFixed(2)),
    }));
  }, [data]);

  const periodReturnPct = useMemo(
    () => Number(data?.agg.periodReturnPct?.toFixed(2) || 0),
    [data]
  );
  const lastUpdateText = useMemo(
    () => (data?.agg.lastUpdate ? new Date(data.agg.lastUpdate).toLocaleString("pt-BR") : "—"),
    [data]
  );

  const renderChart = () => {
    if (selectedChart === "rent") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={lineData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 12, color: "#fff" }} />
            <Legend />
            <Line type="monotone" dataKey="rent" name="Rentabilidade (%)" stroke="#00D9A3" strokeWidth={3} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === "balance") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={lineData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 12, color: "#fff" }} />
            <Legend />
            <Area type="monotone" dataKey="balance" name="Saldo" fill="#0ea5e9" stroke="#0ea5e9" fillOpacity={0.2} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === "flows") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={lineData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 12, color: "#fff" }} />
            <Legend />
            <Bar dataKey="deposits" name="Aportes" fill="#22c55e" barSize={18} />
            <Bar dataKey="withdrawals" name="Saques" fill="#ef4444" barSize={18} />
            <Bar dataKey="investments" name="Investimentos" fill="#60a5fa" barSize={18} />
            <Line type="monotone" dataKey="netFlow" name="Fluxo líquido" stroke="#a78bfa" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    // distribution
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={distributionData} layout="vertical">
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis type="number" stroke="#666" />
          <YAxis dataKey="name" type="category" width={140} stroke="#666" />
          <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 12, color: "#fff" }} />
          <Legend />
          <Bar dataKey="amount" name="Valor (R$)" fill="#00D9A3" barSize={16} />
          <Line type="monotone" dataKey="share" name="Participação (%)" stroke="#f59e0b" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.28, 0.15], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute top-1/3 left-0 w-[580px] h-[580px] bg-[#00D9A3]/14 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1], x: [0, 50, 0] }}
        transition={{ duration: 23, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-1/3 right-0 w-[620px] h-[620px] bg-[#00D9A3]/11 rounded-full blur-3xl pointer-events-none"
      />

      <DesktopSidebar />

      <div className="p-4 md:p-6 max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Performance</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-gray-800"
            >
              {hideBalance ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
        </motion.div>

        {/* Filtros principais: período e plano */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {periods.map(p => (
              <Button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key)}
                className={`rounded-full whitespace-nowrap ${
                  selectedPeriod === p.key
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-gray-800 border border-gray-800"
                }`}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="min-w-[220px]">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectValue placeholder="Todos os planos" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-[#2a2a2a]">Todos os planos</SelectItem>
                  {(data?.plans || []).map(pl => (
                    <SelectItem key={pl.id} value={pl.id} className="text-white hover:bg-[#2a2a2a]">
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[220px]">
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectValue placeholder="Selecione o gráfico" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  {chartOptions.map(opt => (
                    <SelectItem key={opt.key} value={opt.key} className="text-white hover:bg-[#2a2a2a]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Métrica de período */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#1a1a1a] rounded-3xl p-6 mb-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-5xl font-bold text-white">{periodReturnPct.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</h2>
            <TrendingUp className="w-6 h-6 text-[#00D9A3]" />
          </div>
          <p className="text-xs text-gray-400">Última atualização em {lastUpdateText}</p>
        </motion.div>

        {/* Único gráfico (selecionável) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1a1a1a] rounded-3xl p-6 mb-6 border border-gray-800">
          {!loading ? renderChart() : <p className="text-sm text-gray-500">Carregando...</p>}
        </motion.div>

        {/* Extrato */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-[#1a1a1a] rounded-3xl p-6 mb-6 border border-gray-800">
          <div className="text-white text-sm font-semibold mb-3">Extrato</div>
          <div className="space-y-2">
            {(data?.extract || []).map((e, i) => (
              <div key={i} className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{e.description}</p>
                  <p className="text-xs text-gray-400">{new Date(e.date).toLocaleString("pt-BR")}</p>
                </div>
                <div className={`text-sm font-semibold ${
                  e.type === "withdraw" || e.type === "investment" ? "text-red-400" : "text-[#00D9A3]"
                }`}>
                  {(e.type === "withdraw" || e.type === "investment") ? "-" : "+"} R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
            {!loading && (data?.extract?.length || 0) === 0 && (
              <p className="text-sm text-gray-500">Sem movimentos no período.</p>
            )}
          </div>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
}
