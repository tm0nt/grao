// hooks/use-user.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UserDTO = {
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
  cpf?: string | null;
  phone?: string | null;
  avatar?: string | null;
};

type UpdateUserInput = {
  // Atualização leve suportada de imediato
  avatar?: string | null; // URL/base64/dataURL
  // Se você criar PATCH /api/me, pode aceitar name/phone/etc. aqui também
};

export function useUser() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedAt = useRef<number>(0);

  const fetchMe = useCallback(async (signal?: AbortSignal) => {
    const res = await fetch("/api/me", { cache: "no-store", signal });
    if (!res.ok) throw new Error("Falha ao carregar usuário");
    const data = await res.json();
    return data as UserDTO;
  }, []); 

  const refresh = useCallback(async () => {
    try {
      const data = await fetchMe();
      setUser(data);
      lastFetchedAt.current = Date.now();
    } catch {
      setUser(null);
    }
  }, [fetchMe]); 

  // Primeira carga + abort seguro
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const data = await fetchMe(ac.signal);
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
        lastFetchedAt.current = Date.now();
      }
    })();
    return () => ac.abort();
  }, [fetchMe]); 

  // Revalida ao voltar o foco se passou > 60s
  useEffect(() => {
    const onFocus = () => {
      const elapsed = Date.now() - lastFetchedAt.current;
      if (elapsed > 60_000) refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]); 

  // Atualização leve (avatar) + sync
  const updateUser = useCallback(
    async (next: UpdateUserInput) => {
      // Atualiza avatar via API dedicada
      if (typeof next.avatar === "string") {
        const res = await fetch("/api/account/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: next.avatar }),
        });
        if (!res.ok) throw new Error("Falha ao atualizar avatar");
      }
      await refresh();
    },
    [refresh]
  ); 

  return { user, loading, refresh, updateUser };
}
