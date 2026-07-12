import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold text-sm rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5";

    const variants: Record<string, string> = {
      primary: "bg-sendme text-white hover:bg-sendme-dark shadow-sm",
      secondary: "border border-border-default text-text-primary bg-white hover:bg-surface-hover",
      ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
      danger: "bg-danger text-white hover:bg-red-700",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className || ""}`}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
