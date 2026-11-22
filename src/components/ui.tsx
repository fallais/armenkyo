import type { ReactNode } from "react";

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex w-full rounded-xl border border-line bg-surface p-1 text-sm">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-1.5 font-medium transition ${value === o.value ? "bg-brand-500 text-white shadow-sm" : "text-muted hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Bouton d'action principal d'un exercice. Sur mobile, fixé au-dessus de la barre de navigation
 * (dont la hauteur inclut la zone de sécurité de l'écran) ; sur grand écran, dans le flux.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 px-4 md:static md:mt-6 md:px-0">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}
