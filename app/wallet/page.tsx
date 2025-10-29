"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/currency-input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  CreditCard,
  X,
  AlertCircle,
  Mail,
  Phone,
  Key,
  IdCard as IdCardIcon,
  Percent,
  PiggyBank,
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";

type DividendDTO = { date: string; value: number; type: string; };

type PortfolioItem = {
  investmentId: string;
  planId: string;
  planName: string;
  category: string;
  amount: number;
  sharePct: number;
  dailyReturnPct: number;
  monthlyReturnPct: number;
  durationMonths: number;
  riskLevel: string | null;
  color?: string;
  dividends: DividendDTO[];
};

type WalletDTO = {
  user: {
    id: string;
    name: string;
    email: string;
    balance: number;
    total_invested: number;
    total_returns: number;
    kyc_status: string;
  };
  portfolio: PortfolioItem[];
  updatedAt: string;
  pixStaticKey?: string | null;
};

type TxItem = {
  id: string;
  amount: number;
  status: string;
  method?: string | null;
  created_at: string;
  description?: string | null;
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // histories
  const [depositHistory, setDepositHistory] = useState<TxItem[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<TxItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // UI states
  const [isKYCVerified, setIsKYCVerified] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showInvestmentDetail, setShowInvestmentDetail] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<PortfolioItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Deposit flow states
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<"pix" | "card">("pix");
  const [depositStep, setDepositStep] = useState<"form" | "awaitPayment" | "done">("form");
  const [pixQrcode, setPixQrcode] = useState<string>("");
  const [externalId, setExternalId] = useState<string>("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  // Withdraw flow states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<string>("");

  // Derived values
  const userBalance = useMemo(() => Number(wallet?.user.balance ?? 0), [wallet]);
  const totalInvested = useMemo(() => Number(wallet?.user.total_invested ?? 0), [wallet]);
  const totalReturns = useMemo(() => Number(wallet?.user.total_returns ?? 0), [wallet]);
  const updatedAt = useMemo(() => wallet?.updatedAt ?? "", [wallet]);
  const accumulatedYieldPct = useMemo(() => {
    const base = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    return Number.isFinite(base) ? Math.max(0, base) : 0;
  }, [totalInvested, totalReturns]);

  // Load wallet
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/wallet", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar carteira");
        const data: WalletDTO = await res.json();
        if (alive) {
          setWallet(data);
          setIsKYCVerified((data.user.kyc_status || "").toLowerCase() === "approved");
        }
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar carteira");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []); 

  // Load histories (deposits + withdrawals)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/wallet/history?limit=10", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar histórico");
        const data = await res.json();
        if (!alive) return;
        setDepositHistory(Array.isArray(data?.deposits) ? data.deposits : []);
        setWithdrawHistory(Array.isArray(data?.withdrawals) ? data.withdrawals : []);
      } catch (e: any) {
        // Mantém a página funcionando mesmo sem o endpoint
        setDepositHistory([]);
        setWithdrawHistory([]);
      } finally {
        if (alive) setLoadingHistory(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []); 

  // Helpers
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  }; 

  const getPixKeyPlaceholder = () => {
    switch (pixKeyType) {
      case "email":
        return "seu@email.com";
      case "phone":
        return "(00) 00000-0000";
      case "cpf":
        return "000.000.000-00";
      case "random":
        return "Chave aleatória";
      default:
        return "Selecione o tipo de chave";
    }
  }; 

  const getPixKeyIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "cpf":
        return <IdCardIcon className="w-4 h-4" />;
      case "random":
        return <Key className="w-4 h-4" />;
      default:
        return null;
    }
  }; 

  const statusColor = (s: string) => {
    const st = String(s || "").toLowerCase();
    if (st === "paid" || st === "completed" || st === "approved") return "text-[#00D9A3]";
    if (st === "pending" || st === "processing") return "text-yellow-400";
    if (st === "failed" || st === "canceled" || st === "rejected") return "text-red-400";
    return "text-gray-400";
  }; 

  // Deposit: continue (create transaction + call PSP)
  const handleDepositContinue = async () => {
    const amount = Number(depositAmount) / 100;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    try {
      const body: any = { amount, method: depositMethod };
      if (depositMethod === "card") {
        if (!cardNumber || !cardHolder || !cardExpMonth || !cardExpYear || !cardCVV) {
          toast.error("Preencha os dados do cartão");
          return;
        }
        body.card = {
          number: cardNumber.replace(/\s/g, ""),
          holderName: cardHolder,
          expirationMonth: Number(cardExpMonth),
          expirationYear: Number(cardExpYear),
          cvv: cardCVV,
        };
      }

      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao iniciar depósito");
      }

      // Card
      if (depositMethod === "card") {
        const status = String(data?.status || "").toLowerCase();
        if (status === "paid" || status === "approved" || status === "completed") {
          toast.success("Pagamento aprovado!");
          setDepositStep("done");
          try {
            const re = await fetch("/api/wallet", { cache: "no-store" });
            if (re.ok) setWallet(await re.json());
          } catch {}
          setShowDepositModal(false);
          setDepositAmount("");
          setCardNumber("");
          setCardHolder("");
          setCardExpMonth("");
          setCardExpYear("");
          setCardCVV("");
          // refresh histories
          try {
            const rh = await fetch("/api/wallet/history?limit=10", { cache: "no-store" });
            if (rh.ok) {
              const h = await rh.json();
              setDepositHistory(Array.isArray(h?.deposits) ? h.deposits : []);
              setWithdrawHistory(Array.isArray(h?.withdrawals) ? h.withdrawals : []);
            }
          } catch {}
          return;
        }
        toast.success("Pagamento em processamento.");
        setShowDepositModal(false);
        setDepositAmount("");
        return;
      }

      // PIX
      setExternalId(String(data.externalId || ""));
      setPixQrcode(String(data.pixQrcode || ""));
      if (!data.pixQrcode) {
        toast.error("Não foi possível gerar o QR Code PIX");
        return;
      }
      setDepositStep("awaitPayment");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao iniciar depósito");
    }
  }; 

  // Deposit: confirm (check status)
  const handleDepositConfirm = async () => {
    if (!externalId) {
      toast.error("Transação inválida");
      return;
    }
    try {
      const res = await fetch(`/api/wallet/deposit/status?id=${encodeURIComponent(externalId)}`, {
        method: "GET",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao confirmar depósito");

      const status = String(data?.status || "").toLowerCase();
      if (status === "paid" || status === "already_paid") {
        toast.success("Pagamento recebido com sucesso!");
        try {
          const re = await fetch("/api/wallet", { cache: "no-store" });
          if (re.ok) setWallet(await re.json());
        } catch {}
        // refresh histories
        try {
          const rh = await fetch("/api/wallet/history?limit=10", { cache: "no-store" });
          if (rh.ok) {
            const h = await rh.json();
            setDepositHistory(Array.isArray(h?.deposits) ? h.deposits : []);
            setWithdrawHistory(Array.isArray(h?.withdrawals) ? h.withdrawals : []);
          }
        } catch {}
        setDepositStep("done");
        setTimeout(() => {
          setShowDepositModal(false);
          setDepositAmount("");
          setExternalId("");
          setPixQrcode("");
          setDepositStep("form");
        }, 1000);
      } else {
        toast.message(`Status: ${status || "desconhecido"}`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao confirmar depósito");
    }
  }; 

  // Withdraw
  const handleWithdraw = async () => {
    if (!isKYCVerified) {
      toast.error("Complete a verificação KYC para realizar saques");
      return;
    }
    const amount = Number(withdrawAmount) / 100;
    if (!Number.isFinite(amount) || amount < 50) {
      toast.error("Valor mínimo de saque é R$ 50,00");
      return;
    }
    if (!pixKeyType) {
      toast.error("Selecione o tipo de chave PIX");
      return;
    }
    if (!pixKey) {
      toast.error("Digite sua chave PIX");
      return;
    }
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, pixKey, pixKeyType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao solicitar saque");

      toast.success("Saque solicitado! Processamento em até 24h.");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setPixKey("");
      setPixKeyType("");
      try {
        const re = await fetch("/api/wallet", { cache: "no-store" });
        if (re.ok) setWallet(await re.json());
      } catch {}
      // refresh histories
      try {
        const rh = await fetch("/api/wallet/history?limit=10", { cache: "no-store" });
        if (rh.ok) {
          const h = await rh.json();
          setDepositHistory(Array.isArray(h?.deposits) ? h.deposits : []);
          setWithdrawHistory(Array.isArray(h?.withdrawals) ? h.withdrawals : []);
        }
      } catch {}
    } catch (e: any) {
      toast.error(e?.message || "Erro ao solicitar saque");
    }
  }; 

  const formatBRL = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); 

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1.1, 1.4, 1.1], opacity: [0.1, 0.22, 0.1], x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00D9A3]/12 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.3, 1, 1.3], opacity: [0.08, 0.16, 0.08], x: [0, -30, 0] }}
        transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-0 right-1/4 w-[550px] h-[550px] bg-[#00D9A3]/10 rounded-full blur-3xl pointer-events-none"
      />

      <DesktopSidebar />

      <div className="p-4 md:p-6 max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Carteira</h1>
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-gray-800 hover:border-[#00D9A3] transition-all"
          >
            {hideBalance ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
          </button>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon className="w-4 h-4 text-[#00D9A3]" />
              <p className="text-xs text-gray-400">Saldo disponível</p>
            </div>
            <p className="text-xl font-bold text-white">
              {hideBalance ? "R$ ••••••" : `R$ ${formatBRL(userBalance)}`}
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#00D9A3]" />
              <p className="text-xs text-gray-400">Total investido</p>
            </div>
            <p className="text-xl font-bold text-white">
              {hideBalance ? "R$ ••••••" : `R$ ${formatBRL(totalInvested)}`}
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-4 h-4 text-[#00D9A3]" />
              <p className="text-xs text-gray-400">Rendimentos pagos</p>
            </div>
            <p className="text-xl font-bold text-white">
              {hideBalance ? "R$ ••••••" : `R$ ${formatBRL(totalReturns)}`}
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-[#00D9A3]" />
              <p className="text-xs text-gray-400">Rentabilidade acumulada</p>
            </div>
            <p className="text-xl font-bold text-white">
              {`${hideBalance ? "•••" : accumulatedYieldPct.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%`}
            </p>
          </div>
        </motion.div>

        {/* Resumo */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-6 mb-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-2">Resumo</p>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#00D9A3]" />
            <span className="text-[#00D9A3] font-semibold">
              {hideBalance ? "R$ ••••••" : `R$ ${formatBRL(totalReturns)}`}
            </span>
            <span className="text-gray-400 text-sm">Rendimentos brutos acumulados</span>
          </div>
          <p className="text-xs text-gray-400">Última atualização {updatedAt ? new Date(updatedAt).toLocaleString("pt-BR") : "—"}</p>
        </motion.div>

        {/* Ações */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3 mb-6">
          {/* Depositar */}
          <Dialog
            open={showDepositModal}
            onOpenChange={(open) => {
              setShowDepositModal(open);
              if (!open) {
                setDepositStep("form");
                setDepositAmount("");
                setExternalId("");
                setPixQrcode("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full py-6 font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                <ArrowDownLeft className="w-5 h-5" />
                Depositar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">
                  {depositStep === "form" ? "Depositar" : depositStep === "awaitPayment" ? "Pagar com PIX" : "Depósito concluído"}
                </DialogTitle>
              </DialogHeader>

              <AnimatePresence mode="wait">
                {depositStep === "form" ? (
                  <motion.div key="deposit-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <div>
                      <Label className="text-gray-400 text-sm mb-2 block">Valor do depósito</Label>
                      <CurrencyInput value={depositAmount} onChange={setDepositAmount} className="bg-[#2a2a2a] border-gray-700 text-white text-lg h-12" />
                      <p className="text-xs text-gray-400 mt-2">Depósito mínimo conforme configuração</p>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-sm mb-3 block">Método de pagamento</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setDepositMethod("pix")} className={`p-4 rounded-2xl border-2 transition-all ${depositMethod === "pix" ? "border-[#00D9A3] bg-[#00D9A3]/10" : "border-gray-700 bg-[#2a2a2a] hover:border-gray-600"}`}>
                          <div className="text-2xl mb-2">⚡</div>
                          <p className="text-sm font-semibold text-white">PIX</p>
                        </button>
                        <button onClick={() => setDepositMethod("card")} className={`p-4 rounded-2xl border-2 transition-all ${depositMethod === "card" ? "border-[#00D9A3] bg-[#00D9A3]/10" : "border-gray-700 bg-[#2a2a2a] hover:border-gray-600"}`}>
                          <CreditCard className="w-6 h-6 mx-auto mb-2 text-white" />
                          <p className="text-sm font-semibold text-white">Cartão</p>
                        </button>
                      </div>
                    </div>

                    {depositMethod === "card" && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-gray-400 text-sm mb-2 block">Número do cartão</Label>
                          <Input placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="bg-[#2a2a2a] border-gray-700 text-white" />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-sm mb-2 block">Nome do titular</Label>
                          <Input placeholder="Nome impresso no cartão" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} className="bg-[#2a2a2a] border-gray-700 text-white" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-gray-400 text-sm mb-2 block">Mês</Label>
                            <Input placeholder="MM" value={cardExpMonth} onChange={(e) => setCardExpMonth(e.target.value)} className="bg-[#2a2a2a] border-gray-700 text-white" />
                          </div>
                          <div>
                            <Label className="text-gray-400 text-sm mb-2 block">Ano</Label>
                            <Input placeholder="AAAA" value={cardExpYear} onChange={(e) => setCardExpYear(e.target.value)} className="bg-[#2a2a2a] border-gray-700 text-white" />
                          </div>
                          <div>
                            <Label className="text-gray-400 text-sm mb-2 block">CVV</Label>
                            <Input placeholder="000" value={cardCVV} onChange={(e) => setCardCVV(e.target.value)} className="bg-[#2a2a2a] border-gray-700 text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleDepositContinue} className="w-full bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full py-6 font-semibold transition-all hover:scale-[1.02]">
                      Continuar
                    </Button>
                  </motion.div>
                ) : depositStep === "awaitPayment" ? (
                  <motion.div key="await-payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <div className="bg-[#2a2a2a] rounded-2xl p-4">
                      <p className="text-sm text-gray-400 mb-2">PIX Copia e Cola</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-white break-all">{pixQrcode}</code>
                        <button onClick={() => copyText(pixQrcode)} className="w-10 h-10 rounded-full bg-[#00D9A3] flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform">
                          {copied ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5 text-black" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 flex items-center justify-center">
                      <QRCodeSVG value={pixQrcode} size={192} />
                    </div>

                    <Button onClick={handleDepositConfirm} className="w-full bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full py-6 font-semibold transition-all hover:scale-[1.02]">
                      Confirmar depósito
                    </Button>
                    <p className="text-xs text-gray-400 text-center">O saldo será liberado após confirmação do pagamento</p>
                  </motion.div>
                ) : (
                  <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <p className="text-sm text-gray-300">Depósito concluído.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>

          {/* Saque */}
          <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a1a1a] text-white hover:bg-gray-800 rounded-full py-6 font-semibold flex items-center justify-center gap-2 border border-gray-800 transition-all hover:scale-[1.02]">
                <ArrowUpRight className="w-5 h-5" />
                Sacar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Solicitar saque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!isKYCVerified && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-500 font-semibold mb-1">Verificação KYC necessária</p>
                      <p className="text-xs text-yellow-500/80">Complete a verificação de identidade para realizar saques</p>
                    </div>
                  </motion.div>
                )}

                <div>
                  <Label className="text-gray-400 text-sm mb-2 block">Valor do saque</Label>
                  <CurrencyInput value={withdrawAmount} onChange={setWithdrawAmount} className="bg-[#2a2a2a] border-gray-700 text-white text-lg h-12" disabled={!isKYCVerified} />
                  <p className="text-xs text-gray-400 mt-2">Saque mínimo conforme configuração</p>
                </div>

                <div className="bg-[#2a2a2a] rounded-2xl p-4 space-y-3">
                  <Label className="text-gray-400 text-sm block">Tipo de chave PIX</Label>
                  <Select value={pixKeyType} onValueChange={setPixKeyType} disabled={!isKYCVerified}>
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o tipo de chave" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-700">
                      <SelectItem value="email" className="text-white hover:bg-[#2a2a2a]">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>E-mail</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="phone" className="text-white hover:bg-[#2a2a2a]">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>Celular</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cpf" className="text-white hover:bg-[#2a2a2a]">
                        <div className="flex items-center gap-2">
                          <IdCardIcon className="w-4 h-4" />
                          <span>CPF</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="random" className="text-white hover:bg-[#2a2a2a]">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          <span>Chave aleatória</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {pixKeyType && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                      <Label className="text-gray-400 text-sm block">Chave PIX</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{getPixKeyIcon(pixKeyType)}</div>
                        <Input placeholder={getPixKeyPlaceholder()} value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="bg-[#1a1a1a] border-gray-700 text-white pl-10" disabled={!isKYCVerified} />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <p className="text-xs text-yellow-500">⚠️ Saques são processados em até 24 horas úteis via PIX</p>
                </div>
                <Button onClick={handleWithdraw} disabled={!isKYCVerified} className="w-full bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full py-6 font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                  Confirmar saque
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Meus Investimentos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00D9A3]" />
            <h3 className="text-white font-semibold">Meus investimentos</h3>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (wallet?.portfolio?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">Você ainda não possui investimentos.</p>
          ) : (
            <div className="space-y-3">
              {wallet!.portfolio.map((inv) => (
                <motion.button
                  key={inv.investmentId}
                  onClick={() => {
                    setSelectedInvestment(inv);
                    setShowInvestmentDetail(true);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between hover:bg-[#333] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#333" strokeWidth="4" fill="none" />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke={inv.color || "#00D9A3"}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${Math.min(inv.sharePct, 100) * 1.256} ${125.6 - Math.min(inv.sharePct, 100) * 1.256}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">{Math.round(inv.sharePct)}%</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">{inv.planName}</p>
                      <p className="text-gray-400 text-xs">R$ {inv.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Histórico de Depósitos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownCircle className="w-5 h-5 text-[#00D9A3]" />
            <h3 className="text-white font-semibold">Histórico de depósitos</h3>
          </div>
          {loadingHistory ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : depositHistory.length === 0 ? (
            <p className="text-sm text-gray-500">Sem depósitos recentes.</p>
          ) : (
            <div className="space-y-2">
              {depositHistory.map((t) => (
                <div key={t.id} className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <p className={`text-xs font-semibold ${statusColor(t.status)}`}>{t.status}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Histórico de Saques */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-white font-semibold">Histórico de saques</h3>
          </div>
          {loadingHistory ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : withdrawHistory.length === 0 ? (
            <p className="text-sm text-gray-500">Sem saques recentes.</p>
          ) : (
            <div className="space-y-2">
              {withdrawHistory.map((t) => (
                <div key={t.id} className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <p className={`text-xs font-semibold ${statusColor(t.status)}`}>{t.status}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
}
