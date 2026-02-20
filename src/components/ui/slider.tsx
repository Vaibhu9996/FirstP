"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = 50, min = 0, max = 100, step = 1, onChange, showValue, ...props }, ref) => {
    const percent = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn("flex items-center gap-3", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="confidence-track h-2 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300"
          style={{
            background: `linear-gradient(to right, var(--color-danger) 0%, var(--color-warning) 50%, var(--color-success) 100%)`,
          }}
          {...props}
        />
        {showValue && (
          <span className="min-w-[3ch] text-right text-sm font-medium tabular-nums">
            {value}
          </span>
        )}
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
