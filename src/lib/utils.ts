import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function confidenceLabel(value: number): string {
  if (value <= 20) return "Very Uncertain";
  if (value <= 40) return "Uncertain";
  if (value <= 60) return "Moderate";
  if (value <= 80) return "Confident";
  return "Highly Confident";
}

export function confidenceColor(value: number): string {
  if (value <= 33) return "var(--confidence-low)";
  if (value <= 66) return "var(--confidence-mid)";
  return "var(--confidence-high)";
}
