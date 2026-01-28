import { cn } from "@/lib/utils";
import { Lock, Shield, AlertTriangle, XCircle, CheckCircle2, Key, FileCheck } from "lucide-react";

type BadgeVariant = "encrypted" | "verified" | "signed" | "warning" | "error" | "secure";

interface SecurityBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

const variantConfig = {
  encrypted: {
    className: "bg-primary/10 text-primary border-primary/20",
    Icon: Lock,
  },
  verified: {
    className: "bg-accent/10 text-accent border-accent/20",
    Icon: CheckCircle2,
  },
  signed: {
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Icon: FileCheck,
  },
  warning: {
    className: "bg-warning/10 text-warning border-warning/20",
    Icon: AlertTriangle,
  },
  error: {
    className: "bg-destructive/10 text-destructive border-destructive/20",
    Icon: XCircle,
  },
  secure: {
    className: "bg-primary/10 text-primary border-primary/20",
    Icon: Shield,
  },
};

export function SecurityBadge({ variant, children, className, showIcon = true }: SecurityBadgeProps) {
  const { className: variantClass, Icon } = variantConfig[variant];
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono border",
        variantClass,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
