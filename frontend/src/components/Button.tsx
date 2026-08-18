import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonProps = {
  variant?: "primary" | "neutral" | "danger" | "icon";
  icon?: ReactNode;
} & ComponentPropsWithoutRef<"button">;

export function Button({
  variant = "neutral",
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
