import { cn } from "@/lib/utils";
import { GraduationCap, UserCheck, Shield } from "lucide-react";

type Role = "student" | "reviewer" | "admin";

interface RoleBadgeProps {
  role: Role;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const roleConfig = {
  student: {
    label: "Student",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Icon: GraduationCap,
  },
  reviewer: {
    label: "Reviewer",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Icon: UserCheck,
  },
  admin: {
    label: "Admin",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Icon: Shield,
  },
};

const sizeConfig = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export function RoleBadge({ role, className, size = "md" }: RoleBadgeProps) {
  const { label, className: roleClass, Icon } = roleConfig[role];
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium font-mono border",
        roleClass,
        sizeConfig[size],
        className
      )}
    >
      <Icon className={cn(size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4")} />
      {label}
    </span>
  );
}
