// hooks/use-featured-plans.ts
"use client";

import { useEffect, useState } from "react";

export type FeaturedPlan = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  min_investment: number;
  daily_return_rate: number;
  monthly_return_rate: number;
  duration_months: number;
  risk_level: string | null;
  image_url: string | null;
  is_new: boolean;
  total_invested: number;
};

export function useFeaturedPlans() {
  const [plans, setPlans] = useState<FeaturedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/plans/featured", { cache: "no-store" });
        const data = res.ok ? await res.json() : [];
        if (alive) setPlans(data);
      } catch {
        if (alive) setPlans([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { plans, loading };
}
