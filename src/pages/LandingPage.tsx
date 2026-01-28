import { motion } from "framer-motion";
import { Shield, Lock, Key, FileCheck, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Lock,
    title: "AES-256 Encryption",
    description: "All project files are encrypted using military-grade symmetric encryption",
  },
  {
    icon: Key,
    title: "RSA Key Exchange",
    description: "Secure key distribution using asymmetric cryptography",
  },
  {
    icon: FileCheck,
    title: "Digital Signatures",
    description: "Hash-based signing ensures integrity and non-repudiation",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Granular access control matrix for Students, Reviewers, and Admins",
  },
  {
    icon: Shield,
    title: "MFA Authentication",
    description: "Multi-factor authentication with OTP verification",
  },
  {
    icon: CheckCircle2,
    title: "Tamper Detection",
    description: "Cryptographic verification before publishing results",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <GridBackground showScanlines>
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-mono text-lg font-semibold">SecureEval</h1>
                <p className="text-xs text-muted-foreground">Project Submission System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="font-mono">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="font-mono">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center gap-2 mb-6">
              <SecurityBadge variant="encrypted">End-to-End Encrypted</SecurityBadge>
              <SecurityBadge variant="verified">NIST Compliant</SecurityBadge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Secure Academic
              <span className="block text-gradient-primary">Project Evaluation</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A cryptographically secure workflow system for submitting, reviewing, and evaluating 
              academic projects with complete audit trails and tamper-proof verification.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="font-mono text-lg px-8 glow-primary">
                  <Lock className="w-5 h-5 mr-2" />
                  Start Secure Session
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="font-mono text-lg px-8">
                View Documentation
              </Button>
            </div>
          </motion.div>

          {/* Terminal-style security info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-warning/70" />
                <div className="w-3 h-3 rounded-full bg-primary/70" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">security.status</span>
              </div>
              <div className="p-6 font-mono text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <span className="text-primary">system.security.verify()</span>
                </div>
                <div className="pl-4 text-muted-foreground">
                  <div>├─ encryption: <span className="text-primary">AES-256-GCM</span></div>
                  <div>├─ key_exchange: <span className="text-primary">RSA-2048</span></div>
                  <div>├─ signature: <span className="text-primary">SHA-256</span></div>
                  <div>├─ auth_model: <span className="text-accent">NIST SP 800-63-2</span></div>
                  <div>└─ status: <span className="text-primary">SECURE</span> <span className="cursor-blink"></span></div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Security-First Architecture</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with enterprise-grade security primitives for academic integrity
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.3)]"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-mono font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Access Control Matrix Preview */}
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-mono font-semibold">Access Control Matrix</h3>
              <SecurityBadge variant="secure">RBAC Enforced</SecurityBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left font-mono text-muted-foreground">Subject / Object</th>
                    <th className="px-6 py-3 text-center font-mono text-muted-foreground">Project Files</th>
                    <th className="px-6 py-3 text-center font-mono text-muted-foreground">Evaluations</th>
                    <th className="px-6 py-3 text-center font-mono text-muted-foreground">Published Results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-mono">
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                        Student
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-primary font-mono text-xs">R/W (own)</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-muted-foreground font-mono text-xs">—</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-accent font-mono text-xs">R (own)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono">
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs">
                        Reviewer
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-accent font-mono text-xs">R (assigned)</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-primary font-mono text-xs">R/W (own)</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-muted-foreground font-mono text-xs">—</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono">
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs">
                        Admin
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-primary font-mono text-xs">R/W/D</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-primary font-mono text-xs">R/W/D</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-primary font-mono text-xs">R/W/D/P</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-muted/30 border-t border-border">
              <p className="text-xs text-muted-foreground font-mono">
                R = Read, W = Write, D = Delete, P = Publish | Access enforced via Row-Level Security
              </p>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 mt-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-mono text-sm">SecureEval v1.0</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Academic Security Lab Evaluation System
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                <span className="text-xs text-muted-foreground font-mono">All Systems Operational</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </GridBackground>
  );
}
