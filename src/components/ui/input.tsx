import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sendme focus:ring-1 focus:ring-sendme/20 transition-all ${className || ""}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
