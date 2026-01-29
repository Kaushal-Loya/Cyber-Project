import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, ArrowRight, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useSecurity } from "@/context/SecurityContext";
import { UserRole } from "@/services/AccessControlService";
import ApiService from "@/services/ApiService";

export default function LoginPage() {
  const navigate = useNavigate();
  const { mockLogin, isAuthenticated, role } = useSecurity();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === UserRole.ADMIN) navigate("/dashboard/admin");
      else if (role === UserRole.REVIEWER) navigate("/dashboard/reviewer");
      else navigate("/dashboard/student");
    }
  }, [isAuthenticated, role, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    otp: "",
  });

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error("Please enter both username and password");
      return;
    }
    setIsLoading(true);

    try {
      // STEP 1: Single-Factor Authentication
      const result = await ApiService.login(formData.username, formData.password);

      if (!result.success) {
        toast.error(result.error || "Authentication failed");
        setIsLoading(false);
        return;
      }



      // Normal flow: STEP 2 OTP sent
      setCurrentUserEmail(result.email);
      setIsLoading(false);
      setStep("otp");

      // Mask email for security (e.g., k***@gmail.com)
      const maskEmail = (email: string) => {
        const [local, domain] = email.split('@');
        if (local.length <= 2) return email;
        return `${local[0]}***@${domain}`;
      };

      toast.success(`OTP sent to ${maskEmail(result.email)}`, {
        description: 'Please check your email inbox',
        duration: 8000,
      });

    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(error.message || "Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setIsLoading(true);

    try {
      // STEP 3: Multi-Factor Authentication - Verify OTP from MongoDB
      const result = await ApiService.verifyOTP(currentUserEmail, formData.otp, false);

      if (!result.success) {
        toast.error(result.error || "OTP verification failed");
        setIsLoading(false);
        return;
      }

      // Store JWT token
      localStorage.setItem('token', result.token);

      // Map role to UserRole enum
      let userRole = UserRole.STUDENT;
      if (result.user.role === 'reviewer') userRole = UserRole.REVIEWER;
      else if (result.user.role === 'admin') userRole = UserRole.ADMIN;

      // Authenticate via SecurityContext
      await mockLogin(result.user.email, userRole, result.user.username);



      setIsLoading(false);
      toast.success("MFA Successful! Welcome back.", {
        description: `Logged in as ${result.user.username}`,
      });

      // Navigate based on role
      if (userRole === UserRole.ADMIN) navigate("/dashboard/admin");
      else if (userRole === UserRole.REVIEWER) navigate("/dashboard/reviewer");
      else navigate("/dashboard/student");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "OTP verification failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <GridBackground showScanlines>
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="font-mono text-xl font-semibold">SecureEval</h1>
                <p className="text-xs text-muted-foreground">Secure Authentication</p>
              </div>
            </Link>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
              <h2 className="font-mono font-semibold">
                {step === "credentials" ? "Sign In" : "Verify OTP"}
              </h2>
              <SecurityBadge variant="encrypted">
                {step === "credentials" ? "TLS 1.3" : "MFA"}
              </SecurityBadge>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-3 border-b border-border bg-muted/10">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${step === "credentials" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono
                    ${step === "credentials" ? "border-primary bg-primary/10" : "border-primary bg-primary text-primary-foreground"}`}>
                    {step === "otp" ? "✓" : "1"}
                  </div>
                  <span className="text-xs font-mono">Credentials</span>
                </div>
                <div className="flex-1 h-px bg-border" />
                <div className={`flex items-center gap-2 ${step === "otp" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono
                    ${step === "otp" ? "border-primary bg-primary/10" : "border-border"}`}>
                    2
                  </div>
                  <span className="text-xs font-mono">OTP Verify</span>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {step === "credentials" ? (
                <motion.form
                  key="credentials"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleCredentialSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username" className="font-mono text-sm">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="font-mono"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-mono text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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
                    <p className="text-xs text-muted-foreground">
                      Password is hashed with PBKDF2 + salt
                    </p>
                  </div>

                  <Button type="submit" className="w-full font-mono" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleOTPSubmit}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                      <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to
                    </p>
                    <p className="text-sm font-mono text-primary mt-1">
                      {currentUserEmail ? (() => {
                        const [local, domain] = currentUserEmail.split('@');
                        return local.length <= 2 ? currentUserEmail : `${local[0]}***@${domain}`;
                      })() : ''}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="font-mono text-sm sr-only">
                      OTP Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="font-mono text-center text-2xl tracking-[0.5em] py-6"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>

                  <Button type="submit" className="w-full font-mono" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Verifying OTP...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Authenticate
                      </span>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to credentials
                  </button>
                </motion.form>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-muted/10 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              <Lock className="w-3 h-3 inline mr-1" />
              NIST SP 800-63-2 Compliant Authentication
            </p>
          </div>
        </motion.div>
      </div>
    </GridBackground>
  );
}
