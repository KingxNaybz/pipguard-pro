import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (sessionLoading) return null;
  if (session) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded gradient-gold shadow-glow" />
            <h1 className="font-mono text-2xl font-bold tracking-tight">PIPGOLD <span className="text-primary">ULTRA</span></h1>
          </div>
          <p className="text-sm text-muted-foreground">Remote cockpit for your MT5 bot</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6 flex gap-2 rounded-lg bg-surface-2 p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === "signin" ? "bg-surface-3 text-foreground" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-surface-3 text-foreground" : "text-muted-foreground"}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full gradient-gold text-primary-foreground hover:opacity-90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            One account = one bot. Connect it from your VPS using the BOT_API_KEY.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
