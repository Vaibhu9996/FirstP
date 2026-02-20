"use client";

import { useAnalysisStore } from "@/stores/analysis-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  Puzzle,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AnalysisPhase } from "@/types/analysis";

const steps: { phase: AnalysisPhase; label: string; icon: React.ElementType; path: string }[] = [
  { phase: "framing", label: "Problem Framing", icon: MessageSquare, path: "/analysis/framing" },
  { phase: "assumptions", label: "Assumptions", icon: AlertTriangle, path: "/analysis/assumptions" },
  { phase: "decomposition", label: "Decomposition", icon: GitBranch, path: "/analysis/decomposition" },
  { phase: "validation", label: "Validation", icon: ShieldCheck, path: "/analysis/validation" },
  { phase: "reconstruction", label: "Reconstruction", icon: Puzzle, path: "/analysis/reconstruction" },
  { phase: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/analysis/dashboard" },
];

const phaseOrder: AnalysisPhase[] = [
  "framing", "assumptions", "decomposition", "validation", "reconstruction", "dashboard",
];

export function StepNavigator() {
  const { analysis, setCurrentPhase } = useAnalysisStore();
  const { sidebarOpen } = useUIStore();
  const pathname = usePathname();

  const currentPhaseIdx = phaseOrder.indexOf(analysis.currentPhase);

  const getStepStatus = (phase: AnalysisPhase) => {
    const idx = phaseOrder.indexOf(phase);
    if (idx < currentPhaseIdx) return "completed";
    if (idx === currentPhaseIdx) return "current";
    return "upcoming";
  };

  if (!sidebarOpen) return null;

  return (
    <nav className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 gap-1">
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Analysis Steps
        </p>
      </div>
      {steps.map((step, idx) => {
        const status = getStepStatus(step.phase);
        const isActive = pathname === step.path;

        return (
          <Link
            key={step.phase}
            href={step.path}
            onClick={() => setCurrentPhase(step.phase)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : status === "completed"
                ? "text-foreground hover:bg-muted"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                isActive
                  ? "bg-primary text-white"
                  : status === "completed"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {status === "completed" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <step.icon className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col">
              <span>{step.label}</span>
              <span className="text-[10px] text-muted-foreground">
                Step {idx + 1} of 6
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
