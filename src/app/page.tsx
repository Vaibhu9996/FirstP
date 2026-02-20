"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  Lightbulb,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  Puzzle,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    icon: MessageSquare,
    title: "Frame the Problem",
    desc: "Define and reframe your problem from multiple perspectives with AI assistance.",
  },
  {
    icon: AlertTriangle,
    title: "Extract Assumptions",
    desc: "Identify hidden assumptions and challenge what you take for granted.",
  },
  {
    icon: GitBranch,
    title: "Decompose",
    desc: "Break down into fundamental truths using an interactive visual tree.",
  },
  {
    icon: ShieldCheck,
    title: "Validate with Data",
    desc: "Back every claim with evidence, statistics, and counter-arguments.",
  },
  {
    icon: Puzzle,
    title: "Reconstruct",
    desc: "Build novel solutions from first principles, free from old assumptions.",
  },
  {
    icon: LayoutDashboard,
    title: "Review & Export",
    desc: "See the full picture, export your analysis, and share insights.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Lightbulb className="h-5 w-5" />
          </div>
          FirstP
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Lightbulb className="h-3.5 w-3.5" />
          AI-Powered First Principles Thinking
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mb-4">
          Think deeper.{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Build better.
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-8">
          Break any problem into its fundamental truths, challenge every assumption
          with data-backed evidence, and reconstruct innovative solutions from the ground up.
        </p>

        <Link href="/analysis/framing">
          <Button size="lg" className="gap-2 text-base px-8">
            Start Thinking
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-20 max-w-4xl w-full">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Built with first principles. Powered by Claude AI.
      </footer>
    </div>
  );
}
