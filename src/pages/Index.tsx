import { useBotState } from "@/lib/cockpit-data";
import { fmtMoney, fmtNum, pnlColor } from "@/lib/format";
import { StatCard } from "@/components/cockpit/StatCard";
import { HeartbeatPill } from "@/components/cockpit/HeartbeatPill";
import { ControlBar } from "@/components/cockpit/ControlBar";
import { PositionsTable } from "@/components/cockpit/PositionsTable";
import { SignalsGrid } from "@/components/cockpit/SignalsGrid";
import { EquityChart } from "@/components/cockpit/EquityChart";
import { PerPairStats } from "@/components/cockpit/PerPairStats";
import { TradeJournal } from "@/components/cockpit/TradeJournal";
import { ParamsEditor } from "@/components/cockpit/ParamsEditor";
import { AlertsFeed } from "@/components/cockpit/AlertsFeed";
import { ConnectBotDialog } from "@/components/cockpit/ConnectBotDialog";
import { TestConnection } from "@/components/cockpit/TestConnection";
import { CommandHistory } from "@/components/cockpit/CommandHistory";
import { DailyRiskCard } from "@/components/cockpit/DailyRiskCard";
import { PairSettings } from "@/components/cockpit/PairSettings";
import { HeartbeatDebug } from "@/components/cockpit/HeartbeatDebug";
import { ForecastScanner } from "@/components/cockpit/ForecastScanner";
import { RiskDashboard } from "@/components/cockpit/RiskDashboard";
import { PerformanceAnalytics } from "@/components/cockpit/PerformanceAnalytics";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, AlertOctagon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const Index = () => {
  const state = useBotState();
  const ddPct = state && state.equity ? (Number(state.daily_drawdown) / Number(state.equity)) * 100 : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-glass-border/0">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-lg gradient-gold shadow-glow flex items-center justify-center">
              <span className="font-mono text-xs font-black text-primary-foreground">PG</span>
              <span className="absolute inset-0 rounded-lg ring-1 ring-primary/40 pulse-glow" />
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold leading-none tracking-[0.18em]">
                PIPGOLD <span className="neon-text-primary">ULTRA</span>
              </h1>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Cockpit · v3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeartbeatPill />
            <ConnectBotDialog />
            <ThemeSwitcher />
            <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Halted banner */}
      {state?.halted && (
        <div className="border-b border-loss/30 bg-loss/10">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 text-sm lg:px-8">
            <AlertOctagon className="h-5 w-5 text-loss" />
            <span className="font-semibold text-loss">TRADING HALTED</span>
            <span className="text-muted-foreground">{state.halt_reason ?? "Circuit breaker triggered"}</span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Equity" accent="gold" value={fmtMoney(state?.equity, state?.currency)} sub={`Bal ${fmtMoney(state?.balance, state?.currency)}`} />
          <StatCard label="Today P/L" accent={Number(state?.daily_pl) >= 0 ? "profit" : "loss"}
            value={<span className={pnlColor(state?.daily_pl)}>{Number(state?.daily_pl ?? 0) >= 0 ? "+" : ""}{fmtMoney(state?.daily_pl, state?.currency)}</span>}
            sub={`${state?.wins_today ?? 0}W · ${state?.losses_today ?? 0}L`} />
          <StatCard label="Daily DD" accent={ddPct > 4 ? "warn" : null}
            value={<>{ddPct.toFixed(1)}<span className="text-base text-muted-foreground">%</span></>}
            sub={`${fmtMoney(state?.daily_drawdown, state?.currency)}`} />
          <StatCard label="Free Margin" value={fmtMoney(state?.free_margin, state?.currency)} sub={`Margin used ${fmtMoney(state?.margin, state?.currency)}`} />
          <StatCard label="Streak" accent={Number(state?.consecutive_losses) >= 3 ? "warn" : null}
            value={<>{state?.consecutive_losses ?? 0}<span className="ml-1 text-sm text-muted-foreground">losses</span></>}
            sub={`Trades today ${state?.trades_today ?? 0}`} />
          <StatCard label="Scans" value={fmtNum(state?.scan_count, 0)} sub={state?.bot_version ? `v${state.bot_version}` : "—"} />
        </div>

        {/* Controls */}
        <ControlBar />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="glass flex h-auto flex-wrap p-1 gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="params">Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <DailyRiskCard />
              <TestConnection />
              <CommandHistory />
            </div>
            <HeartbeatDebug />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2"><EquityChart /></div>
              <AlertsFeed />
            </div>
            <PositionsTable />
            <PerPairStats />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <ForecastScanner />
          </TabsContent>

          <TabsContent value="signals" className="space-y-6">
            <SignalsGrid />
            <PairSettings />
            <PositionsTable />
          </TabsContent>

          <TabsContent value="journal" className="space-y-6">
            <PerPairStats />
            <TradeJournal />
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <RiskDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PerformanceAnalytics />
          </TabsContent>

          <TabsContent value="params" className="space-y-6">
            <ParamsEditor />
            <PairSettings />
          </TabsContent>
        </Tabs>

        <footer className="pt-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          PipGold Ultra v3 · cockpit synced via Lovable Cloud
        </footer>
      </main>
    </div>
  );
};

export default Index;
