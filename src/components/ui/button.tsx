import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "lg" | "sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

    const variants: Record<string, string> = {
      default: "btn-primary",
      outline:
        "border border-white/10 bg-transparent text-white hover:bg-white/5",
    };

    const sizes: Record<string, string> = {
      default: "h-10 px-5 py-2 text-sm rounded-lg",
      lg: "h-12 px-8 py-2 text-base rounded-xl",
      sm: "h-8 px-4 py-1 text-xs rounded-md",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
