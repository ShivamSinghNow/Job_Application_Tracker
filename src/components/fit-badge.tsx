"use client";

import { Badge } from "@/components/ui/badge";

export function FitBadge({ score }: { score: number }) {
  const variant =
    score >= 75 ? "default" : score >= 50 ? "secondary" : "destructive";

  const colorClass =
    score >= 75
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
      : score >= 50
        ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";

  return (
    <Badge variant={variant} className={colorClass}>
      {score}
    </Badge>
  );
}
