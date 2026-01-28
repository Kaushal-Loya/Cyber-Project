import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, GraduationCap, UserCheck } from "lucide-react";
import { GridBackground } from "@/components/layout/GridBackground";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

type DemoRole = "student" | "reviewer" | "admin";

const roles = [
  {
    id: "student" as DemoRole,
    title: "Student",
    description: "Submit projects and view your results",
    icon: GraduationCap,
    color: "blue",
    path: "/dashboard/student",
  },
  {
    id: "reviewer" as DemoRole,
    title: "Reviewer",
    description: "Evaluate assigned projects and sign reports",
    icon: UserCheck,
    color: "purple",
    path: "/dashboard/reviewer",
  },
  {
    id: "admin" as DemoRole,
    title: "Admin",
    description: "Manage users, verify evaluations, publish results",
    icon: Shield,
    color: "amber",
    path: "/dashboard/admin",
  },
];

export default function DashboardSelector() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      const role = roles.find((r) => r.id === selectedRole);
      if (role) {
        navigate(role.path);
      }
    }
  };

  return (
    <GridBackground showScanlines>
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="font-mono text-xl font-semibold">SecureEval</h1>
                <p className="text-xs text-muted-foreground">Demo Mode</p>
              </div>
            </Link>
            <h2 className="text-2xl font-bold mb-2">Select Your Role</h2>
            <p className="text-muted-foreground">
              Choose a role to explore the dashboard (demo mode)
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              const colorClasses = {
                blue: isSelected
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]"
                  : "border-border hover:border-blue-500/50",
                purple: isSelected
                  ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)]"
                  : "border-border hover:border-purple-500/50",
                amber: isSelected
                  ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]"
                  : "border-border hover:border-amber-500/50",
              };
              const iconColorClasses = {
                blue: isSelected ? "text-blue-400" : "text-muted-foreground",
                purple: isSelected ? "text-purple-400" : "text-muted-foreground",
                amber: isSelected ? "text-amber-400" : "text-muted-foreground",
              };

              return (
                <motion.button
                  key={role.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-6 rounded-lg border-2 text-left transition-all ${colorClasses[role.color]}`}
                >
                  <role.icon className={`w-10 h-10 mb-4 ${iconColorClasses[role.color]}`} />
                  <h3 className="font-mono font-semibold text-lg mb-1">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </motion.button>
              );
            })}
          </div>

          <Button
            className="w-full font-mono text-lg py-6"
            disabled={!selectedRole}
            onClick={handleContinue}
          >
            Continue to Dashboard
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            This is a demonstration. In production, roles are assigned during registration.
          </p>
        </motion.div>
      </div>
    </GridBackground>
  );
}
