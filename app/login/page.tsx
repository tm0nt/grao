"use client";

import type React from "react";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Sparkles, ArrowLeft, Mail } from "lucide-react";
import { formatCPF, validateEmail, validateCPF, validateFullName } from "@/lib/utils";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromUrl = useMemo(
    () => (searchParams.get("ref") || "").trim() || null,
    [searchParams]
  );

  const [isLogin, setIsLogin] = useState(true);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    cpf: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;

    if (!validateEmail(formData.email)) {
      toast.error("E-mail inválido");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (!isLogin) {
      if (!validateFullName(formData.name)) {
        toast.error("Digite seu nome completo");
        return;
      }
      if (!validateCPF(formData.cpf)) {
        toast.error("CPF inválido");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
    }

    try {
      setPending(true);

      if (isLogin) {
        const res = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });
        if (!res || res.error) {
          toast.error("Credenciais inválidas");
          setPending(false);
          return;
        }
        toast.success("Login realizado com sucesso!");
        router.push("/home");
        return;
      }

      // Cadastro: envia o ref capturado da URL (se existir)
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          cpf: formData.cpf,
          email: formData.email,
          password: formData.password,
          ref: referralFromUrl, // <- aqui vai o referral da URL
        }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast.error(data?.error || "Falha ao criar conta");
        setPending(false);
        return;
      }

      // login automático após cadastro
      const login = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      setPending(false);

      if (!login || login.error) {
        toast.success("Conta criada! Faça login para continuar.");
        return;
      }

      toast.success("Conta criada com sucesso!");
      router.push("/home");
    } catch {
      setPending(false);
      toast.error("Erro inesperado, tente novamente.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(forgotPasswordEmail)) {
      toast.error("E-mail inválido");
      return;
    }
    toast.success("Link de recuperação enviado para seu e-mail!");
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#00D9A3]/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.3, 1, 1.3], opacity: [0.15, 0.35, 0.15], x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#00D9A3]/15 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 1.4, 1.1], opacity: [0.1, 0.25, 0.1], x: [0, 30, 0], y: [0, -50, 0] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#00D9A3]/10 rounded-full blur-3xl"
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: "spring" }} className="inline-flex items-center gap-2 mb-4">
            <h1 className="text-4xl font-bold text-white">Grão.</h1>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {showForgotPassword ? (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl p-6  shadow-2xl backdrop-blur-sm"
            >
              <button
                onClick={() => setShowForgotPassword(false)}
                className="flex items-center gap-2 text-gray-400 hover:text-[#00D9A3] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Voltar ao login</span>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#00D9A3]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#00D9A3]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Esqueceu sua senha?</h2>
                <p className="text-gray-400 text-sm">Digite seu e-mail e enviaremos um link para redefinir sua senha</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email" className="text-white text-sm font-medium">E-mail</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="bg-[#0000] rounded-xl border-gray-700 text-white mt-1 focus:border-[#00D9A3] focus:ring-[#00D9A3]/20 transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#00D9A3] text-black hover:bg-[#00b386] rounded-full py-6 font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00D9A3]/30"
                >
                  Enviar link de recuperação
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="login-register"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl p-6 shadow-2xl backdrop-blur-sm"
            >
              <div className="flex gap-2 mb-6 bg-[#0a0a0a] p-1 rounded-full">
                <Button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    isLogin ? "bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 shadow-lg shadow-[#00D9A3]/20" : "bg-transparent text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  Login
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    !isLogin ? "bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90 shadow-lg shadow-[#00D9A3]/20" : "bg-transparent text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  Cadastro
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      key="registration-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="name" className="text-white text-sm font-medium">Nome completo</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-[#0000] rounded-xl border-gray-700 text-white mt-1 focus:border-[#00D9A3] focus:ring-[#00D9A3]/20 transition-all"
                          placeholder="João Silva"
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf" className="text-white text-sm font-medium">CPF</Label>
                        <Input
                          id="cpf"
                          type="text"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                          className="bg-[#0000] rounded-xl border-gray-700 text-white mt-1 focus:border-[#00D9A3] focus:ring-[#00D9A3]/20 transition-all"
                          placeholder="000.000.000-00"
                          maxLength={14}
                          required={!isLogin}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <Label htmlFor="email" className="text-white text-sm font-medium">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#0000] rounded-xl border-gray-700 text-white mt-1 focus:border-[#00D9A3] focus:ring-[#00D9A3]/20 transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-white text-sm font-medium">Senha</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-[#0000] rounded-xl border-gray-700 text-white pr-10 focus:border-[#00D9A3] focus:ring-[#00D9A3]/20 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00D9A3] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      key="confirm-password"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">Confirmar senha</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="bg-[#0000] rounded-xl border-gray-700 text-white pr-10 focus:border-[#00D9A3] focus:ring-[#00D9A3]/20 transition-all"
                          placeholder="••••••••"
                          required={!isLogin}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00D9A3] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-[#00D9A3] text-black hover:bg-[#00b386] rounded-full py-6 font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00D9A3]/30 mt-6"
                >
                  {isLogin ? (pending ? "Entrando..." : "Entrar") : (pending ? "Criando..." : "Criar conta")}
                </Button>
              </form>

              {isLogin && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-center">
                  <button onClick={() => setShowForgotPassword(true)} className="text-sm text-gray-400 hover:text-[#00D9A3] transition-colors">
                    Esqueceu sua senha?
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
