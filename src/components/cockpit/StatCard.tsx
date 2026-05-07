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
      "glass rounded-xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5",
      "hover:shadow-glow",
      className,
    )}>
      {accent && (
        <>
          <div className={cn(
            "absolute inset-x-0 top-0 h-[2px]",
            accent === "gold" && "gradient-gold",
            accent === "profit" && "bg-profit",
            accent === "loss" && "bg-loss",
            accent === "warn" && "bg-warn",
          )} />
          <div className={cn(
            "absolute -top-12 -right-12 h-24 w-24 rounded-full opacity-30 blur-2xl",
            accent === "gold" && "bg-primary",
            accent === "profit" && "bg-profit",
            accent === "loss" && "bg-loss",
            accent === "warn" && "bg-warn",
          )} />
        </>
      )}
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-primary/70 heartbeat" />
          {label}
        </div>
        <div className="mt-2 font-mono text-3xl font-semibold leading-none tabular">{value}</div>
        {sub && <div className="mt-2 text-xs text-muted-foreground font-mono">{sub}</div>}
      </div>
    </div>
  );
};
