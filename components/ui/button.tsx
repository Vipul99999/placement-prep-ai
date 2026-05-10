import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
}

const baseStyles =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/50 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-ink text-white shadow-glow hover:-translate-y-0.5 hover:bg-ocean",
  secondary: "bg-white/80 text-ink ring-1 ring-black/10 hover:bg-white",
  ghost: "bg-transparent text-ink hover:bg-black/5"
};

export function Button({ className, href, variant = "primary", ...props }: ButtonProps) {
  if (href) {
    return (
      <Link href={href as never} className={cn(baseStyles, variants[variant], className)}>
        {props.children}
      </Link>
    );
  }

  return <button className={cn(baseStyles, variants[variant], className)} {...props} />;
}
