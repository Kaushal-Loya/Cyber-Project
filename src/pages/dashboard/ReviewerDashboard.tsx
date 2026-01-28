import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  FileText,
  Clock,
  CheckCircle2,
  LogOut,
  Menu,
  X,
  Eye,
  FileCheck,
  AlertTriangle,
  PenLine,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { GlowCard } from "@/components/layout/GlowCard";
import { HashDisplay } from "@/components/ui/HashDisplay";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const mockAssignedProjects = [
  {
    id: "1",
    title: "Cryptography Final Project",
    student: "Alice Johnson",
    assignedAt: "2024-01-16T08:00:00Z",
    status: "pending_review",
    fileHash: "a1b2c3d4e5f6789012345678901234567890abcdef",
    encrypted: true,
  },
  {
    id: "2",
    title: "Network Security Analysis",
    student: "Bob Smith",
    assignedAt: "2024-01-21T10:00:00Z",
    status: "reviewed",
    fileHash: "b2c3d4e5f67890123456789012345678901abcdef0",
    encrypted: true,
    evaluation: {
      grade: "B+",
      feedback: "Good analysis but missing some key security considerations.",
      signedAt: "2024-01-22T14:30:00Z",
      signatureHash: "e5f6789012345678901234567890abcdef01234567",
    },
  },
];

export default function ReviewerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [evaluatingProject, setEvaluatingProject] = useState<typeof mockAssignedProjects[0] | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({ grade: "", feedback: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitEvaluation = async () => {
    if (!evaluationForm.grade || !evaluationForm.feedback) {
      toast.error("Please fill in all evaluation fields");
      return;
    }

    setIsSubmitting(true);
    // Simulate signing and submitting
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    toast.success("Evaluation signed and submitted successfully!");
    setEvaluatingProject(null);
    setEvaluationForm({ grade: "", feedback: "" });
  };

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
                  <p className="text-xs text-muted-foreground">Reviewer Portal</p>
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
                    Assigned Projects
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
                  >
                    <FileCheck className="w-4 h-4" />
                    Completed Reviews
                  </a>
                </li>
              </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-mono font-bold">
                  DR
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">Dr. Roberts</p>
                  <RoleBadge role="reviewer" size="sm" />
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
                  <h1 className="font-mono text-xl font-bold">Assigned Projects</h1>
                  <p className="text-sm text-muted-foreground">Review and evaluate student projects</p>
                </div>
              </div>
              <StatusIndicator status="secure" label="Session Secure" pulse />
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <GlowCard glowColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Reviews</p>
                    <p className="text-3xl font-mono font-bold">
                      {mockAssignedProjects.filter((p) => p.status === "pending_review").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-mono font-bold">
                      {mockAssignedProjects.filter((p) => p.status === "reviewed").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </GlowCard>
              <GlowCard glowColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assigned</p>
                    <p className="text-3xl font-mono font-bold">{mockAssignedProjects.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </GlowCard>
            </div>

            {/* Projects List */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-mono font-semibold">Projects to Review</h2>
                <div className="flex items-center gap-2">
                  <SecurityBadge variant="encrypted">Read-Only Access</SecurityBadge>
                </div>
              </div>
              <div className="divide-y divide-border">
                {mockAssignedProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-mono font-medium">{project.title}</h3>
                          {project.status === "pending_review" ? (
                            <SecurityBadge variant="warning">Pending Review</SecurityBadge>
                          ) : (
                            <SecurityBadge variant="signed">Signed</SecurityBadge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span>Student: {project.student}</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            Assigned {new Date(project.assignedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <HashDisplay
                          hash={project.fileHash}
                          label="Project File Hash"
                          algorithm="SHA-256"
                          truncate
                        />

                        {project.evaluation && (
                          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <FileCheck className="w-4 h-4 text-primary" />
                              <span className="font-mono text-sm font-medium">Your Evaluation</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Grade</p>
                                <p className="font-mono font-bold text-primary">{project.evaluation.grade}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Signed At</p>
                                <p className="font-mono text-sm">
                                  {new Date(project.evaluation.signedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{project.evaluation.feedback}</p>
                            <HashDisplay
                              hash={project.evaluation.signatureHash}
                              label="Digital Signature"
                              algorithm="RSA-SHA256"
                              truncate
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="font-mono">
                          <Eye className="w-4 h-4 mr-2" />
                          View Project
                        </Button>
                        {project.status === "pending_review" && (
                          <Button
                            size="sm"
                            className="font-mono"
                            onClick={() => setEvaluatingProject(project)}
                          >
                            <PenLine className="w-4 h-4 mr-2" />
                            Evaluate
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Evaluation Modal */}
            {evaluatingProject && (
              <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setEvaluatingProject(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-lg max-w-lg w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-mono font-semibold">Submit Evaluation</h2>
                    <button
                      onClick={() => setEvaluatingProject(null)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-mono font-medium">{evaluatingProject.title}</h3>
                      <p className="text-sm text-muted-foreground">Student: {evaluatingProject.student}</p>
                    </div>

                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">Digital Signature Required</p>
                        <p className="text-xs text-muted-foreground">
                          Your evaluation will be digitally signed using your private key for authenticity
                          and non-repudiation.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-mono">Grade</label>
                      <select
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono text-sm"
                        value={evaluationForm.grade}
                        onChange={(e) => setEvaluationForm({ ...evaluationForm, grade: e.target.value })}
                      >
                        <option value="">Select grade...</option>
                        <option value="A+">A+ (Exceptional)</option>
                        <option value="A">A (Excellent)</option>
                        <option value="A-">A- (Very Good)</option>
                        <option value="B+">B+ (Good)</option>
                        <option value="B">B (Above Average)</option>
                        <option value="B-">B- (Average)</option>
                        <option value="C+">C+ (Below Average)</option>
                        <option value="C">C (Fair)</option>
                        <option value="D">D (Poor)</option>
                        <option value="F">F (Fail)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-mono">Feedback</label>
                      <Textarea
                        placeholder="Provide detailed feedback on the project..."
                        className="font-mono min-h-[120px]"
                        value={evaluationForm.feedback}
                        onChange={(e) => setEvaluationForm({ ...evaluationForm, feedback: e.target.value })}
                      />
                    </div>

                    <Button
                      className="w-full font-mono"
                      onClick={handleSubmitEvaluation}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Signing & Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Sign & Submit Evaluation
                        </span>
                      )}
                    </Button>
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
