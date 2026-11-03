import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur shadow-sm hover:shadow-md transition-shadow", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function Stat({ label, value, change, icon }: { label: string; value: string; change?: string; icon?: React.ReactNode }) {
  const positive = change?.startsWith("+") || (change && !change.startsWith("-"));
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        {icon && <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">{icon}</div>}
        <div className="flex-1">
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="text-xl font-semibold mt-0.5">{value}</div>
          {change && (
            <div className={cn("text-xs mt-0.5", positive ? "text-emerald-400" : "text-rose-400")}>{change}</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function Button({ variant = "primary", className, children, ...props }: any) {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
    ghost: "hover:bg-zinc-800 text-zinc-300",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
  };
  return <button className={cn(base, variants[variant], className)} {...props}>{children}</button>;
}

export function Input({ className, ...props }: any) {
  return <input className={cn("bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40", className)} {...props} />;
}

export function Select({ className, children, ...props }: any) {
  return <select className={cn("bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40", className)} {...props}>{children}</select>;
}

export function Badge({ variant = "default", children }: { variant?: "default" | "success" | "danger" | "info"; children: React.ReactNode }) {
  const v: any = {
    default: "bg-zinc-800 text-zinc-300",
    success: "bg-emerald-500/15 text-emerald-400",
    danger: "bg-rose-500/15 text-rose-400",
    info: "bg-sky-500/15 text-sky-400",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", v[variant])}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-zinc-800/60", className)} />;
}

export function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>;
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-2 px-3", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("py-2.5 px-3 text-zinc-200 border-t border-zinc-800/60", className)}>{children}</td>;
}