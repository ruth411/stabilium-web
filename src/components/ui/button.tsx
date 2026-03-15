import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "lg" | "sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

    const variants: Record<string, string> = {
      default:
        "bg-primary text-primary-foreground hover:opacity-90",
      outline:
        "border border-border/40 bg-background/60 text-foreground/80 backdrop-blur hover:border-border/60 hover:bg-background/70",
    };

    const sizes: Record<string, string> = {
      default: "h-10 px-5 py-2 text-sm rounded-lg",
      lg: "h-12 px-8 py-2 text-base rounded-full",
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
