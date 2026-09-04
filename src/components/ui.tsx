import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";

const BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  secondary: "border border-border bg-card text-foreground hover:border-muted",
  danger: "border border-danger/40 bg-card text-danger hover:bg-danger/5",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>{children}</div>;
}

type Tone = "neutral" | "ok" | "warn" | "danger" | "accent";

const TONE: Record<Tone, string> = {
  neutral: "border-border text-muted",
  ok: "border-ok/40 text-ok",
  warn: "border-warn/50 text-warn",
  danger: "border-danger/40 text-danger",
  accent: "border-accent/40 text-accent",
};

export function Badge({ children, tone = "neutral", title }: { children: ReactNode; tone?: Tone; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function Plate({ value }: { value: string }) {
  return (
    <span className="inline-block rounded-md border border-black/20 bg-plate px-2.5 py-1 font-mono text-base font-bold tracking-wider text-black">
      {value}
    </span>
  );
}
