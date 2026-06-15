interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-400 focus:ring-red-400" : "border-zinc-200 focus:ring-zinc-900"} bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-shadow text-sm ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
