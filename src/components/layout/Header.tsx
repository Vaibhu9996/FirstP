"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ApiKeyDialog } from "@/components/shared/ApiKeyDialog";
import { Button } from "@/components/ui/button";
import { useAnalysisStore } from "@/stores/analysis-store";
import { Download, Upload, Plus, Lightbulb, Menu, Key } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useRef } from "react";
import Link from "next/link";

export function Header() {
  const { exportAnalysis, importAnalysis, newAnalysis, analysis } = useAnalysisStore();
  const { toggleSidebar } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleExport = () => {
    const data = exportAnalysis();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `firstp-${analysis.title.slice(0, 30).replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importAnalysis(data);
      } catch {
        alert("Invalid analysis file. Please select a valid FirstP JSON export.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Lightbulb className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">FirstP</span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => newAnalysis()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowApiKey(true)} title="API Key Settings">
              <Key className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </header>
      <ApiKeyDialog open={showApiKey} onClose={() => setShowApiKey(false)} />
    </>
  );
}
