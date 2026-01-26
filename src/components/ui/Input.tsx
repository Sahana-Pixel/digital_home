import { InputHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  helper,
  error,
  showPasswordToggle = false,
  type = "text",
  className = "",
  id,
  ...props
}: InputProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPasswordToggle && show ? "text" : type;
  const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#F1F5F9]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={`
            w-full rounded-xl border bg-[#0F172A]/80 px-4 py-3
            text-[#F1F5F9] placeholder-[#94A3B8]/60
            transition-all duration-300
            focus:border-[#7DD3FC] focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]/30
            ${error ? "border-red-500/50" : "border-[#94A3B8]/20"}
            ${showPasswordToggle && isPassword ? "pr-12" : ""}
            ${className}
          `}
          {...props}
        />
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "🙈" : "👁"}
          </button>
        )}
      </div>
      {helper && !error && (
        <p className="text-sm text-[#94A3B8]">{helper}</p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
