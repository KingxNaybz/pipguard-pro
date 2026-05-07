import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES, useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const swatch: Record<string, string> = {
  cyber: "linear-gradient(135deg, hsl(180 95% 55%), hsl(220 60% 15%))",
  stealth: "linear-gradient(135deg, hsl(0 85% 58%), hsl(0 0% 5%))",
  light: "linear-gradient(135deg, hsl(215 95% 50%), hsl(0 0% 95%))",
  gold: "linear-gradient(135deg, hsl(42 92% 56%), hsl(30 30% 10%))",
  matrix: "linear-gradient(135deg, hsl(130 100% 50%), hsl(120 15% 5%))",
};

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Switch theme">
          <Palette className="h-4 w-4" />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-1 ring-background"
            style={{ background: swatch[theme] }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 glass">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Terminal theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn("flex items-center gap-3 cursor-pointer", theme === t.id && "bg-accent")}
          >
            <span
              className="h-6 w-6 rounded-md border border-border shadow-inner shrink-0"
              style={{ background: swatch[t.id] }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium leading-tight">{t.name}</div>
              <div className="text-[10px] text-muted-foreground">{t.desc}</div>
            </div>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
