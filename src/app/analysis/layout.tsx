"use client";

import { Header } from "@/components/layout/Header";
import { StepNavigator } from "@/components/layout/StepNavigator";

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <StepNavigator />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
