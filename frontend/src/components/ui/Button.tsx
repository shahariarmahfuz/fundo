import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-md";
    
    const variants = {
      primary: "bg-teal-700 text-white hover:bg-teal-800 shadow-sm",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      destructive: "bg-rose-600 text-white hover:bg-rose-700",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 text-sm",
      lg: "h-11 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
