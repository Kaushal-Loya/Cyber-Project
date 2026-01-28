import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, Check, GraduationCap, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Role = "student" | "reviewer";

const roleOptions = [
  {
    id: "student" as Role,
    title: "Student",
    description: "Submit projects and view results",
    icon: GraduationCap,
    color: "blue",
  },
  {
    id: "reviewer" as Role,
    title: "Reviewer",
    description: "Evaluate assigned projects",
    icon: UserCheck,
    color: "purple",
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "" as Role | "",
  });

  const passwordRequirements = [
    { met: formData.password.length >= 12, text: "At least 12 characters" },
    { met: /[A-Z]/.test(formData.password), text: "One uppercase letter" },
    { met: /[a-z]/.test(formData.password), text: "One lowercase letter" },
    { met: /[0-9]/.test(formData.password), text: "One number" },
    { met: /[^A-Za-z0-9]/.test(formData.password), text: "One special character" },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.username || !formData.password || !formData.role) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (!allRequirementsMet) {
      toast.error("Password does not meet security requirements");
      return;
    }
    
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast.success("Registration successful! Please check your email to verify your account.");
    navigate("/login");
  };

  return (
    <GridBackground showScanlines>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="font-mono text-xl font-semibold">SecureEval</h1>
                <p className="text-xs text-muted-foreground">Identity Proofing</p>
              </div>
            </Link>
          </div>

          {/* Registration Card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
              <h2 className="font-mono font-semibold">Create Account</h2>
              <SecurityBadge variant="secure">Secure Registration</SecurityBadge>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="font-mono text-sm">Select Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.role === role.id
                          ? role.color === "blue"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-purple-500 bg-purple-500/10"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <role.icon
                        className={`w-6 h-6 mb-2 ${
                          formData.role === role.id
                            ? role.color === "blue"
                              ? "text-blue-400"
                              : "text-purple-400"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className="font-mono font-medium text-sm">{role.title}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-mono text-sm">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="font-mono"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-sm">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@university.edu"
                  className="font-mono"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="font-mono text-sm">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  className="font-mono"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-mono text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="font-mono pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 font-mono">Password Requirements:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {passwordRequirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                          req.met ? "bg-primary" : "bg-muted-foreground/30"
                        }`}>
                          {req.met && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </div>
                        <span className={`text-xs ${req.met ? "text-foreground" : "text-muted-foreground"}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-mono text-sm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className={`font-mono pr-10 ${
                      formData.confirmPassword && !passwordsMatch ? "border-destructive" : ""
                    }`}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button type="submit" className="w-full font-mono" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Secure Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Password will be hashed using PBKDF2 with unique salt
              </p>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-muted/10 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </GridBackground>
  );
}
