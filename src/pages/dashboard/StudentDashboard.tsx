
import { useState, useEffect } from "react";
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
import { NewSubmissionModal } from "@/components/dashboard/NewSubmissionModal";
import { MockDatabaseService, Submission } from "@/services/MockDatabaseService";
import { useSecurity } from "@/context/SecurityContext";

const statusConfig = {
  pending: { label: "Pending Review", color: "text-muted-foreground", icon: Clock },
  under_review: { label: "Under Review", color: "text-accent", icon: Eye },
  evaluated: { label: "Evaluated", color: "text-primary", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-destructive", icon: XCircle },
};

export default function StudentDashboard() {
  const { user, logout } = useSecurity();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const loadSubmissions = () => {
    if (user) {
      const allSubmissions = MockDatabaseService.getSubmissions();
      const evaluations = MockDatabaseService.getEvaluations();

      const userSubmissions = allSubmissions
        .filter(s => s.studentId === user.id)
        .map(submission => {
          const evaluation = evaluations.find(e => e.submissionId === submission.id);
          return {
            ...submission,
            encrypted: true, // All are encrypted
            grade: evaluation?.score,
            feedback: evaluation?.feedback,
            evaluationDate: evaluation?.timestamp
          };
        });

      setSubmissions(userSubmissions);
    }
  };

  const handleSubmissionSuccess = () => {
    loadSubmissions();
    setIsSubmissionModalOpen(false);
  };

  return (
    <GridBackground>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                  <button
                    onClick={() => setIsSubmissionModalOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    New Submission
                  </button>
                </li>
              </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-mono font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">{user?.email || 'Student'}</p>
                  <RoleBadge role="student" size="sm" />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start font-mono" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
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
                <Button className="font-mono" onClick={() => setIsSubmissionModalOpen(true)}>
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
                    <p className="text-3xl font-mono font-bold">{submissions.length}</p>
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
                      {submissions.filter((s) => s.status === "under_review").length}
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
                      {submissions.filter((s) => s.status === "evaluated").length}
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
              {submissions.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-mono">
                  No submissions yet. Click "New Submission" to start.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {submissions.map((submission) => {
                    const status = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.pending;
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
              )}
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
                      {selectedSubmission.evaluationDate && (
                        <p className="text-sm text-muted-foreground">
                          Evaluated on {new Date(selectedSubmission.evaluationDate).toLocaleString()}
                        </p>
                      )}
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

      <NewSubmissionModal
        open={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSuccess={handleSubmissionSuccess}
      />
    </GridBackground>
  );
}
