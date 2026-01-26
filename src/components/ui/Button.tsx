import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220] disabled:opacity-60 disabled:cursor-not-allowed";

  const variants: Record<Variant, string> = {
    primary:
      "bg-[#7DD3FC] text-[#0B1220] hover:bg-[#38BDF8] shadow-soft hover:shadow-glow",
    secondary:
      "border border-[#7DD3FC]/50 bg-transparent text-[#7DD3FC] hover:bg-[#7DD3FC]/10 hover:border-[#7DD3FC]",
    ghost:
      "bg-transparent text-[#F1F5F9] hover:bg-white/5 text-[#94A3B8] hover:text-[#F1F5F9]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
