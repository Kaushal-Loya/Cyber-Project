import { cn } from "@/lib/utils";

type Status = "secure" | "warning" | "error" | "pending" | "inactive";

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  className?: string;
  pulse?: boolean;
}

const statusConfig = {
  secure: {
    className: "bg-primary",
    glowColor: "shadow-[0_0_8px_hsl(var(--primary))]",
    label: "Secure",
  },
  warning: {
    className: "bg-warning",
    glowColor: "shadow-[0_0_8px_hsl(var(--warning))]",
    label: "Warning",
  },
  error: {
    className: "bg-destructive",
    glowColor: "shadow-[0_0_8px_hsl(var(--destructive))]",
    label: "Error",
  },
  pending: {
    className: "bg-muted-foreground",
    glowColor: "",
    label: "Pending",
  },
  inactive: {
    className: "bg-muted-foreground/50",
    glowColor: "",
    label: "Inactive",
  },
};

export function StatusIndicator({ status, label, className, pulse = false }: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          config.className,
          config.glowColor,
          pulse && "animate-pulse"
        )}
      />
      <span className="text-sm text-muted-foreground">
        {label || config.label}
      </span>
    </div>
  );
}
