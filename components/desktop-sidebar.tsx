"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, TrendingUp, Wallet, BarChart3, Users, LogOut, User, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/invest", icon: TrendingUp, label: "Investir" },
    { href: "/wallet", icon: Wallet, label: "Carteira" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/affiliate", icon: Users, label: "Afiliação" },
    { href: "/account", icon: User, label: "Minha Conta" },
    { href: "/kyc", icon: FileText, label: "Verificação KYC" },
  ];

  const handleLogout = async () => {
    try {
      // Invalida sessão/cookies sem redirecionamento automático
      await signOut({ redirect: false });
      router.push("/login");
    } catch {
      // fallback simples: forçar navegação
      router.push("/login");
    }
  }; // signOut em Client Components com redirecionamento manual é uma prática suportada [web:54]

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#0000] border-r border-gray-800 flex-col z-50"
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">Grão.</h1>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 transition-all ${
                isActive ? "bg-[#00D9A3] text-black" : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          aria-label="Sair"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </motion.aside>
  );
}
