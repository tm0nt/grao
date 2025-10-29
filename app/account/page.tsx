"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Lock,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Eye,
  EyeOff,
  ChevronRight,
  Award,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { AvatarUpload } from "@/components/avatar-upload";
import { EnhancedInput } from "@/components/enhanced-input";
import { AwardsSection } from "@/components/awards-section";
import { useUser } from "@/hooks/use-user";
import { PageContainer } from "@/components/page-container";
import { Input } from "@/components/ui/input";

type StatsDTO = {
  totalDeposits: number;
  totalWithdraws: number;
  activeAffiliates: number;
  totalCommissions: number;
};

type RecentItem = {
  date: string | null;
  type: string;
  amount: number;
  status: string;
};

function moneyBR(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function typeLabel(t: string) {
  switch (String(t).toLowerCase()) {
    case "deposit":
      return "Depósito";
    case "withdraw":
      return "Saque";
    case "return":
      return "Rendimento";
    case "investment":
      return "Investimento";
    default:
      return t;
  }
}

export default function AccountPage() {
  const { user, updateUser } = useUser();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAwards, setShowAwards] = useState(false);

  const [stats, setStats] = useState<StatsDTO | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/account", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar conta");
        const data = await res.json();
        if (!alive) return;
        setStats(data.stats);
        setRecent(data.recent);
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar conta");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []); // fetch client-side recomendado para dados dinâmicos do usuário [web:211]

  const cards = useMemo(
    () => [
      {
        label: "Total depositado",
        value:
          loading || !stats ? "R$ —" : `R$ ${moneyBR(Number(stats.totalDeposits || 0))}`,
        icon: TrendingUp,
        color: "text-[#00D9A3]",
      },
      {
        label: "Total sacado",
        value:
          loading || !stats ? "R$ —" : `R$ ${moneyBR(Number(stats.totalWithdraws || 0))}`,
        icon: TrendingDown,
        color: "text-blue-400",
      },
      {
        label: "Afiliados ativos",
        value: loading || !stats ? "—" : String(Number(stats.activeAffiliates || 0)),
        icon: Users,
        color: "text-purple-400",
      },
      {
        label: "Comissões recebidas",
        value:
          loading || !stats ? "R$ —" : `R$ ${moneyBR(Number(stats.totalCommissions || 0))}`,
        icon: TrendingUp,
        color: "text-[#00D9A3]",
      },
    ],
    [stats, loading]
  ); // memo de cards para evitar recalcular a cada render [web:211]

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Falha ao alterar senha");
      toast.success("Senha alterada com sucesso!");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao alterar senha");
    }
  }; // POST em route handler é padrão no App Router [web:106]

  const handleAvatarChange = async (avatar: string) => {
    try {
      await updateUser({ avatar });
      toast.success("Avatar atualizado!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar avatar");
    }
  }; // atualização de avatar via rota dedicada e refresh subsequente [web:106]

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64">
      <DesktopSidebar />

      <PageContainer>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Minha Conta</h1>
          <p className="text-gray-400 text-sm">Gerencie suas informações e configurações</p>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-3xl p-8 border border-gray-800 mb-6"
        >
          <AvatarUpload currentAvatar={user?.avatar || null} onAvatarChange={handleAvatarChange} userName={user?.name || "Usuário"} />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {cards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 hover:border-[#00D9A3]/50 transition-all"
              >
                <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 mb-6"
        >
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#00D9A3]" />
            Informações pessoais
          </h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <EnhancedInput label="Nome completo" value={user?.name || ""} readOnly />
              <EnhancedInput label="CPF" value={user?.cpf || ""} readOnly />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <EnhancedInput label="E-mail" value={user?.email || ""} type="email" readOnly />
              <EnhancedInput label="Telefone" value={user?.phone || ""} type="tel" readOnly />
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 mb-6"
        >
          <h2 className="text-white font-semibold mb-4">Ações rápidas</h2>
          <div className="space-y-2">
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
              <DialogTrigger asChild>
                <button className="w-full bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between hover:bg-[#333] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00D9A3]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Lock className="w-5 h-5 text-[#00D9A3]" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">Alterar senha</p>
                      <p className="text-gray-400 text-xs">Mantenha sua conta segura</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Alterar senha</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-400 text-sm mb-2 block">Senha atual</Label>
                    <div className="relative">
                      <Input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        className="bg-[#2a2a2a] border-gray-700 text-white h-11 pr-10 transition-all duration-200 hover:border-gray-600 focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00D9A3] transition-colors"
                      >
                        {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm mb-2 block">Nova senha</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite sua nova senha"
                        className="bg-[#2a2a2a] border-gray-700 text-white h-11 pr-10 transition-all duration-200 hover:border-gray-600 focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00D9A3] transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm mb-2 block">Confirmar nova senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      className="bg-[#2a2a2a] border-gray-700 text-white h-11 transition-all duration-200 hover:border-gray-600 focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20"
                    />
                  </div>
                  <Button onClick={handleChangePassword} className="w-full bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 rounded-full py-6 font-semibold transition-all hover:scale-[1.02]">
                    Confirmar alteração
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Link href="/kyc" className="block w-full bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between hover:bg-[#333] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Verificação KYC</p>
                  <p className="text-gray-400 text-xs">Complete sua verificação de identidade</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/affiliate" className="block w-full bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between hover:bg-[#333] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Programa de afiliados</p>
                  <p className="text-gray-400 text-xs">Convide amigos e ganhe comissões</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button onClick={() => setShowAwards(!showAwards)} className="w-full bg-gradient-to-r from-[#00D9A3]/10 to-transparent rounded-2xl p-4 flex items-center justify-between hover:from-[#00D9A3]/20 transition-all group border border-[#00D9A3]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00D9A3]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5 text-[#00D9A3]" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Prêmios Exclusivos</p>
                  <p className="text-gray-400 text-xs">Veja as recompensas disponíveis</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-[#00D9A3] transition-transform ${showAwards ? "rotate-90" : ""}`} />
            </button>
          </div>
        </motion.div>

        {showAwards && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="mb-6">
            <AwardsSection />
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Extrato recente</h2>
          <div className="space-y-2">
            {(recent || []).map((t, i) => {
              const isPositive = ["deposit", "return"].includes(String(t.type).toLowerCase());
              return (
                <motion.div key={i} whileHover={{ scale: 1.02, x: 5 }} className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between hover:bg-[#333] transition-all cursor-pointer">
                  <div>
                    <p className="text-white text-sm font-medium">{typeLabel(t.type)}</p>
                    <p className="text-gray-400 text-xs">{t.date ? new Date(t.date).toLocaleString("pt-BR") : "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isPositive ? "text-[#00D9A3]" : "text-red-400"}`}>
                      {isPositive ? "+" : "-"}R$ {moneyBR(Math.abs(t.amount))}
                    </p>
                    <p className="text-gray-400 text-xs">{t.status}</p>
                  </div>
                </motion.div>
              );
            })}
            {!loading && (recent?.length || 0) === 0 && <p className="text-sm text-gray-500">Sem movimentos recentes.</p>}
          </div>
        </motion.div>
      </PageContainer>

      <MobileNav />
    </div>
  );
}
