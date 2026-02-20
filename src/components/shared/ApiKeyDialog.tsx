"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Key, Check, X, ExternalLink, AlertTriangle } from "lucide-react";
import { getApiKey, setApiKey, removeApiKey, hasApiKey } from "@/lib/anthropic-client";

interface ApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ApiKeyDialog({ open, onClose }: ApiKeyDialogProps) {
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHasKey(hasApiKey());
    const existing = getApiKey();
    if (existing) {
      setKey(existing.slice(0, 12) + "..." + existing.slice(-4));
    }
  }, [open]);

  const handleSave = () => {
    if (key.trim() && !key.includes("...")) {
      setApiKey(key.trim());
      setHasKey(true);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    }
  };

  const handleRemove = () => {
    removeApiKey();
    setKey("");
    setHasKey(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key Settings
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Your API key is stored only in your browser&apos;s localStorage. It is never sent to any server except Anthropic&apos;s API directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium mb-1">Security Note</p>
                <p>Your key is stored locally in this browser only. Never share your API key publicly. You can get one from the Anthropic Console.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Anthropic API Key</label>
            <Input
              type="password"
              value={key.includes("...") ? "" : key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={hasKey ? "••••••••••••" : "sk-ant-api03-..."}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            {hasKey && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> Key configured
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!key.trim() || key.includes("...")} className="gap-1.5">
              {saved ? <Check className="h-3.5 w-3.5" /> : <Key className="h-3.5 w-3.5" />}
              {saved ? "Saved!" : "Save Key"}
            </Button>
            {hasKey && (
              <Button variant="destructive" onClick={handleRemove} className="gap-1.5">
                Remove Key
              </Button>
            )}
          </div>

          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
          >
            Get an API key from Anthropic Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

export function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    setHasKey(hasApiKey());
  }, [showDialog]);

  if (hasKey === null) return null; // loading

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-[var(--primary)]/10 p-4 mb-4">
          <Key className="h-8 w-8 text-[var(--primary)]" />
        </div>
        <h3 className="text-lg font-semibold mb-1">API Key Required</h3>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-4">
          To use AI features, you need to configure your Anthropic API key. It stays in your browser — never sent to any third party.
        </p>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Key className="h-4 w-4" />
          Add API Key
        </Button>
        <ApiKeyDialog open={showDialog} onClose={() => setShowDialog(false)} />
      </div>
    );
  }

  return <>{children}</>;
}
