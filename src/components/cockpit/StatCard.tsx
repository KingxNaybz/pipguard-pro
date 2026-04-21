import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const StatCard = ({
  label, value, sub, accent, className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "gold" | "profit" | "loss" | "warn" | null;
  className?: string;
}) => {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-5 shadow-card relative overflow-hidden",
      className,
    )}>
      {accent && (
        <div className={cn(
          "absolute inset-x-0 top-0 h-px",
          accent === "gold" && "gradient-gold",
          accent === "profit" && "bg-profit",
          accent === "loss" && "bg-loss",
          accent === "warn" && "bg-warn",
        )} />
      )}
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-3xl font-semibold leading-none tabular">{value}</div>
      {sub && <div className="mt-2 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
};
