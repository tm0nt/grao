"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Building2,
  Award,
  X,
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/currency-input";
import { toast } from "sonner";

type PlanDTO = {
  id: string;
  name: string;
  category: string;
  risk: string;
  minInvestment: number;
  dailyReturn: number;    // %
  monthlyReturn: number;  // %
  duration: number;       // meses
  rewards: string[];
  isNew: boolean;
  location: string | null;
  description: string | null;
  features: string[];
};

type MeDTO = {
  id: string;
  name: string;
  email: string;
  balance: number;
  total_invested: number;
  total_returns: number;
  kyc_status: string;
  referral_code: string;
  monthly_return_amount: number;
  monthly_change_pct: number;
};

export default function InvestPage() {
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanDTO | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState(""); // em centavos vindo do CurrencyInput
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // usuário
  const [me, setMe] = useState<MeDTO | null>(null);
  const userBalance = useMemo(() => Number(me?.balance ?? 0), [me]);

  // filtros simples de categoria (exemplo)
  const [category, setCategory] = useState<string>("Todos");
  const filteredPlans = useMemo(() => {
    if (category === "Todos") return plans;
    return plans.filter((p) => p.category === category);
  }, [plans, category]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Busca planos
        const [resPlans, resMe] = await Promise.all([
          fetch("/api/plans", { cache: "no-store" }),
          fetch("/api/me", { cache: "no-store" }),
        ]);
        const dataPlans: PlanDTO[] = resPlans.ok ? await resPlans.json() : [];
        const dataMe: MeDTO | null = resMe.ok ? await resMe.json() : null;
        if (alive) {
          setPlans(dataPlans);
          setMe(dataMe);
        }
      } catch {
        if (alive) {
          setPlans([]);
          setMe(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleInvestConfirm = async () => {
    if (!selectedPlan) return;

    // CurrencyInput envia centavos como string, ex.: "123456" => 1234.56
    const amount = Number(investAmount) / 100;

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    if (amount < selectedPlan.minInvestment) {
      toast.error(`Investimento mínimo é R$ ${selectedPlan.minInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      return;
    }

    if (amount > userBalance) {
      toast.error("Saldo insuficiente para realizar o investimento");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, amount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Falha ao investir");
      }

      setIsProcessing(false);
      setTransactionComplete(true);

      // Atualiza saldo local após sucesso
      const { balance: newBalance } = await res.json().catch(() => ({ balance: userBalance - amount }));
      setMe((prev) => (prev ? { ...prev, balance: Number(newBalance ?? prev.balance) } : prev));

      setTimeout(() => {
        setTransactionComplete(false);
        setShowInvestModal(false);
        setInvestAmount("");
        setSelectedPlan(null);
        toast.success("Investimento realizado com sucesso!");
      }, 1400);
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err?.message || "Erro ao processar investimento");
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64 relative overflow-hidden">
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.12, 0.25, 0.12],
          x: [0, -40, 0],
        }}
        transition={{
          duration: 22,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-0 w-[550px] h-[550px] bg-[#00D9A3]/12 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.08, 0.18, 0.08],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 28,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 left-0 w-[650px] h-[650px] bg-[#00D9A3]/10 rounded-full blur-3xl pointer-events-none"
      />

      <DesktopSidebar />

      <div className="p-4 md:p-6 max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Investir</h1>
          <p className="text-gray-400 text-sm">Escolha o melhor plano para você</p>
          {!loading && (
            <p className="text-xs text-gray-500 mt-1">
              Saldo disponível:{" "}
              <span className="text-white font-semibold">
                R$ {userBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </p>
          )}
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {["Todos", "Residencial", "Comercial", "Terrenos", "Industrial"].map((c) => (
            <Button
              key={c}
              onClick={() => setCategory(c)}
              className={
                category === c
                  ? "bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full whitespace-nowrap"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-gray-800 rounded-full whitespace-nowrap border border-gray-800"
              }
            >
              {c === "Todos" && <Building2 className="w-4 h-4 mr-2" />}
              {c}
            </Button>
          ))}
        </motion.div>

        {/* Investment Plans */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando planos...
            </div>
          ) : filteredPlans.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum plano disponível.</p>
          ) : (
            filteredPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 2) }}
                className="bg-[#1a1a1a] rounded-3xl p-5 border border-gray-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">{plan.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">{plan.category}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">{plan.risk}</span>
                    </div>
                  </div>
                  {plan.isNew && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#00D9A3] text-black font-semibold">NOVO</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Aplicação inicial</p>
                    <p className="text-sm text-white font-semibold">
                      R$ {plan.minInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Rend. diário</p>
                    <p className="text-sm text-white font-semibold">{plan.dailyReturn}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Rend. mensal</p>
                    <p className="text-sm text-white font-semibold flex items-center gap-1">
                      {plan.monthlyReturn}%
                      <TrendingUp className="w-3 h-3 text-[#00D9A3]" />
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Duração mínima</p>
                  <p className="text-sm text-white font-semibold">{plan.duration} meses</p>
                </div>

                {plan.rewards?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Premiações disponíveis
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {plan.rewards.map((reward, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-[#00D9A3]/10 text-[#00D9A3] border border-[#00D9A3]/20"
                        >
                          {reward}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowInvestModal(true);
                    }}
                    className="flex-1 bg-transparent text-white hover:bg-gray-800 rounded-full border border-gray-700"
                  >
                    Ver detalhes
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowInvestModal(true);
                    }}
                    className="flex-1 bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full font-semibold"
                  >
                    Investir
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
          <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-white text-xl">{selectedPlan?.name}</DialogTitle>
                <button
                  onClick={() => {
                    setShowInvestModal(false);
                    setTransactionComplete(false);
                    setIsProcessing(false);
                  }}
                  className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {transactionComplete ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-8 flex flex-col items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-20 h-20 rounded-full bg-[#00D9A3]/20 flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-12 h-12 text-[#00D9A3]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Investimento realizado!</h3>
                  <p className="text-gray-400 text-center">Seu investimento foi processado com sucesso</p>
                </motion.div>
              ) : isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 flex flex-col items-center justify-center"
                >
                  <Loader2 className="w-12 h-12 text-[#00D9A3] animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Processando investimento...</h3>
                  <p className="text-gray-400 text-center">Verificando saldo e confirmando transação</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                    <p className="text-gray-400 text-sm mb-3">{selectedPlan?.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-[#00D9A3]" />
                        <span className="text-gray-300">{selectedPlan?.location || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-[#00D9A3]" />
                        <span className="text-gray-300">Duração: {selectedPlan?.duration} meses</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-[#00D9A3]" />
                        <span className="text-gray-300">Retorno mensal: {selectedPlan?.monthlyReturn}%</span>
                      </div>
                    </div>
                  </div>

                  {selectedPlan?.features?.length ? (
                    <div>
                      <h4 className="text-white font-semibold mb-2">Características</h4>
                      <div className="space-y-2">
                        {selectedPlan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-[#00D9A3] flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="bg-[#2a2a2a] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Seu saldo disponível</span>
                      <span className="text-white font-semibold">
                        R$ {userBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Investimento mínimo</span>
                      <span className="text-[#00D9A3] font-semibold">
                        R$ {selectedPlan?.minInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Valor do investimento</label>
                    <CurrencyInput
                      value={investAmount}
                      onChange={setInvestAmount}
                      className="bg-[#2a2a2a] border-gray-700 text-white text-lg h-12"
                    />
                  </div>

                  <Button
                    onClick={handleInvestConfirm}
                    className="w-full bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full py-6 font-semibold transition-all hover:scale-[1.02]"
                  >
                    Confirmar investimento
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>

      <MobileNav />
    </div>
  );
}
