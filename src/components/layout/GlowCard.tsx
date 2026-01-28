import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "primary" | "accent" | "warning";
  hover?: boolean;
}

const glowColors = {
  primary: "hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.4)]",
  accent: "hover:shadow-[0_0_30px_-10px_hsl(var(--accent)/0.4)]",
  warning: "hover:shadow-[0_0_30px_-10px_hsl(var(--warning)/0.4)]",
};

export function GlowCard({ children, className, glowColor = "primary", hover = true }: GlowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "bg-card border border-border rounded-lg p-6",
        hover && "transition-all duration-300",
        hover && "hover:border-primary/40",
        hover && glowColors[glowColor],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
