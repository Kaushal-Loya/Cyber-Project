import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  LogOut,
  Menu,
  X,
  FileCheck,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { GlowCard } from "@/components/layout/GlowCard";
import { HashDisplay } from "@/components/ui/HashDisplay";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Link } from "react-router-dom";

// Mock data for demonstration
const mockSubmissions = [
  {
    id: "1",
    title: "Cryptography Final Project",
    status: "evaluated",
    submittedAt: "2024-01-15T10:30:00Z",
    fileHash: "a1b2c3d4e5f6789012345678901234567890abcdef",
    encrypted: true,
    grade: "A",
    feedback: "Excellent implementation of AES encryption.",
  },
  {
    id: "2",
    title: "Network Security Analysis",
    status: "pending",
    submittedAt: "2024-01-20T14:15:00Z",
    fileHash: "b2c3d4e5f67890123456789012345678901abcdef0",
    encrypted: true,
    grade: null,
    feedback: null,
  },
  {
    id: "3",
    title: "Authentication System Design",
    status: "under_review",
    submittedAt: "2024-01-22T09:45:00Z",
    fileHash: "c3d4e5f6789012345678901234567890abcdef01b",
    encrypted: true,
    grade: null,
    feedback: null,
  },
];

const statusConfig = {
  pending: { label: "Pending Review", color: "text-muted-foreground", icon: Clock },
  under_review: { label: "Under Review", color: "text-accent", icon: Eye },
  evaluated: { label: "Evaluated", color: "text-primary", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-destructive", icon: XCircle },
};

export default function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<typeof mockSubmissions[0] | null>(null);

  return (
    <GridBackground>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-sidebar-border">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-mono text-lg font-semibold">SecureEval</h1>
                  <p className="text-xs text-muted-foreground">Student Portal</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-mono text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    My Submissions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    New Submission
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
                  >
                    <FileCheck className="w-4 h-4" />
                    Results
                  </a>
                </li>
              </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-mono font-bold">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">John Doe</p>
                  <RoleBadge role="student" size="sm" />
                </div>
              </div>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="w-full justify-start font-mono">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 hover:bg-muted rounded-lg"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div>
                  <h1 className="font-mono text-xl font-bold">My Submissions</h1>
                  <p className="text-sm text-muted-foreground">Manage your project submissions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusIndicator status="secure" label="Session Secure" pulse />
                <Button className="font-mono">
                  <Upload className="w-4 h-4 mr-2" />
                  New Submission
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <GlowCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <p className="text-3xl font-mono font-bold">{mockSubmissions.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </GlowCard>
              <GlowCard glowColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Under Review</p>
                    <p className="text-3xl font-mono font-bold">
                      {mockSubmissions.filter((s) => s.status === "under_review").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Evaluated</p>
                    <p className="text-3xl font-mono font-bold">
                      {mockSubmissions.filter((s) => s.status === "evaluated").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </GlowCard>
            </div>

            {/* Submissions List */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-mono font-semibold">Submission History</h2>
                <SecurityBadge variant="encrypted">Files Encrypted</SecurityBadge>
              </div>
              <div className="divide-y divide-border">
                {mockSubmissions.map((submission) => {
                  const status = statusConfig[submission.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;
                  return (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-mono font-medium">{submission.title}</h3>
                            <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </span>
                            {submission.encrypted && (
                              <SecurityBadge variant="encrypted" showIcon>
                                AES-256
                              </SecurityBadge>
                            )}
                          </div>
                          <div className="mt-3">
                            <HashDisplay
                              hash={submission.fileHash}
                              label="File Hash"
                              algorithm="SHA-256"
                              truncate
                            />
                          </div>
                        </div>
                        {submission.grade && (
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-2xl font-mono font-bold text-primary">
                                {submission.grade}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Grade</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Selected Submission Details Modal */}
            {selectedSubmission && (
              <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedSubmission(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-lg max-w-lg w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-mono font-semibold">Submission Details</h2>
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-mono font-medium text-lg">{selectedSubmission.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(selectedSubmission.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <span className="text-sm">File encrypted with AES-256-GCM</span>
                    </div>

                    <HashDisplay
                      hash={selectedSubmission.fileHash}
                      label="File Integrity Hash"
                      algorithm="SHA-256"
                    />

                    {selectedSubmission.feedback && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm font-mono font-medium mb-2">Reviewer Feedback</p>
                        <p className="text-sm text-muted-foreground">{selectedSubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </main>
      </div>
    </GridBackground>
  );
}
