import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex min-h-6 items-center justify-center gap-1 rounded-xs px-2.5 text-sm font-medium " +
  "transition-colors duration-150 disabled:cursor-not-allowed select-none";

const variants: Record<Variant, string> = {
  primary: "lift border border-ink bg-ink text-bg [--lift-shadow:var(--accent)] disabled:border-surface-sunk disabled:bg-surface-sunk disabled:text-ink-3",
  secondary: "lift border border-ink bg-surface text-ink",
  ghost: "px-0 text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink",
};

export const buttonClass = (variant: Variant = "primary", extra = "") => `${base} ${variants[variant]} ${extra}`;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode };

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
