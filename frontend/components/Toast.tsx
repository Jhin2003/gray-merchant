import toast from "react-hot-toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

const variantStyles: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400",
};

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const showToast = (message: string, variant: ToastVariant = "info") => {
  const Icon = variantIcons[variant];

  // We use toast.custom to render our own React component
  toast.custom(
    (t) => (
      <div
        className={`
          pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300
          ${variantStyles[variant]}
          ${t.visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
        `}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ),
    { duration: 3000 } // Auto-dismiss after 3 seconds
  );
};