import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white border border-border-default rounded-xl shadow-sm ${hover ? "hover:shadow-md transition-shadow" : ""} ${className || ""}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
