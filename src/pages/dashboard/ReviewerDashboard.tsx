
import { useState, useEffect } from "react";
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
  Lock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { GlowCard } from "@/components/layout/GlowCard";
import { HashDisplay } from "@/components/ui/HashDisplay";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ApiService from "@/services/ApiService";
import { Submission } from "@/services/MockDatabaseService";
import { useSecurity } from "@/context/SecurityContext";
import { CryptoService } from "@/services/CryptoService";

type ReviewerTab = "pending" | "evaluated";

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const { user, logout, encryptionKeys, signingKeys } = useSecurity();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewerTab>("pending");
  const [projects, setProjects] = useState<any[]>([]);
  const [evaluatingProject, setEvaluatingProject] = useState<any | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({ grade: "", feedback: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getAssignedProjects();
      if (response.success) {
        setProjects(response.projects || []);
      }
    } catch (e) {
      console.error("Failed to load assigned projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecryptAndDownload = async (project: any) => {
    if (!encryptionKeys) {
      toast.error("Encryption keys not loaded. Please re-login.");
      return;
    }
    try {
      setDecryptingId(project.id);
      const aesKey = await CryptoService.unwrapKey(project.encryptedKey, encryptionKeys.privateKey);
      const fileBuffer = await CryptoService.decryptData(project.encryptedData, project.iv, aesKey);
      const decryptedBase64 = CryptoService.arrayBufferToBase64(fileBuffer);
      const calculatedHash = await CryptoService.hashData(decryptedBase64);

      if (calculatedHash !== project.fileHash) {
        toast.error("Integrity Check Failed! Hash mismatch.");
      } else {
        toast.success("Integrity Verified. File Decrypted.");
      }

      const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = project.originalName || `submission_${project.id}.bin`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (e: any) {
      console.error(e);
      toast.error("Decryption failed: " + e.message + ". Ensure you are the intended reviewer.");
    } finally {
      setDecryptingId(null);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!evaluationForm.grade || !evaluationForm.feedback || !evaluatingProject || !user) {
      toast.error("Please fill in all evaluation fields");
      return;
    }

    if (!signingKeys) {
      toast.error("Signing keys not found. Please re-login.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = `${evaluatingProject.id}:${evaluationForm.grade}:${evaluationForm.feedback}`;
      const signature = await CryptoService.signData(payload, signingKeys.privateKey);

      await ApiService.submitEvaluation({
        submissionId: evaluatingProject.id,
        score: 0,
        grading: evaluationForm.grade,
        feedback: evaluationForm.feedback,
        signature: signature
      });

      toast.success("Evaluation signed and submitted successfully!");
      setEvaluatingProject(null);
      setEvaluationForm({ grade: "", feedback: "" });

      // Automatic Reload
      await loadProjects();
      setActiveTab("evaluated"); // Shift to evaluated section
    } catch (e: any) {
      toast.error("Signing failed: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (activeTab === "pending") return p.status === "pending";
    return p.status === "evaluated" || p.status === "published";
  });

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
                  <p className="text-xs text-muted-foreground">Reviewer Portal</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "pending"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Clock className="w-4 h-4" />
                    Pending Reviews
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("evaluated")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "evaluated"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Evaluated
                  </button>
                </li>
              </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-mono font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">{user?.username || user?.email || 'Reviewer'}</p>
                  <RoleBadge role="reviewer" size="sm" />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start font-mono" onClick={() => { logout(); navigate('/'); }}>
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
                  <h1 className="font-mono text-xl font-bold">
                    {activeTab === "pending" ? "Pending Reviews" : "Evaluated Projects"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "pending" ? "Review and evaluate student projects" : "View your past evaluations"}
                  </p>
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
                      {projects.filter((p) => p.status === "pending").length}
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
                    <p className="text-sm text-muted-foreground">Completed Evaluated</p>
                    <p className="text-3xl font-mono font-bold">
                      {projects.filter((p) => p.status === "evaluated" || p.status === "published").length}
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
                    <p className="text-3xl font-mono font-bold">{projects.length}</p>
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
                <h2 className="font-mono font-semibold">
                  {activeTab === "pending" ? "Projects to Review" : "Evaluated Projects History"}
                </h2>
                <div className="flex items-center gap-2">
                  <SecurityBadge variant="encrypted">Read-Only Access</SecurityBadge>
                </div>
              </div>
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading projects...</div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No projects found in this section.</div>
                ) : filteredProjects.map((project) => (
                  <motion.div
                    key={project._id || project.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6"
                  >
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-mono font-medium text-lg">{project.title}</h3>
                          {project.status === "pending" ? (
                            <SecurityBadge variant="warning">Pending Review</SecurityBadge>
                          ) : project.status === "published" ? (
                            <SecurityBadge variant="verified">Published</SecurityBadge>
                          ) : (
                            <SecurityBadge variant="signed">Evaluated</SecurityBadge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span>Student ID: <span className="font-mono">{(project.studentId || "").substring(0, 8)}...</span></span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            Submitted {new Date(project.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {activeTab === "evaluated" && project.evaluation ? (
                          <div className="mt-4 p-5 bg-muted/20 rounded-xl border border-border/50">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <FileCheck className="w-4 h-4 text-primary" />
                                  <span className="font-mono text-sm font-bold uppercase tracking-wider">Evaluation Details</span>
                                </div>
                                <div className="mb-4">
                                  <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Feedback</p>
                                  <p className="text-sm text-foreground/90 leading-relaxed">{project.evaluation.feedback}</p>
                                </div>
                                <HashDisplay
                                  hash={project.evaluation.signature}
                                  label="Your Digital Signature"
                                  algorithm="RSA-SHA256"
                                  truncate
                                />
                              </div>
                              <div className="md:text-right flex flex-col items-start md:items-end gap-4 min-w-[120px]">
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Grade</p>
                                  <p className="text-3xl font-mono font-bold text-primary">{project.evaluation.grading}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Signed Date</p>
                                  <p className="font-mono text-xs">{new Date(project.evaluation.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <HashDisplay
                            hash={project.fileHash}
                            label="Project File Hash"
                            algorithm="SHA-256"
                            truncate
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-mono w-full"
                          onClick={() => handleDecryptAndDownload(project)}
                          disabled={decryptingId === project.id}
                        >
                          {decryptingId === project.id ? (
                            <span className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Decrypt & View
                        </Button>
                        {project.status === "pending" && (
                          <Button
                            size="sm"
                            className="font-mono w-full"
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
                      <p className="text-sm text-muted-foreground font-mono">ID: {evaluatingProject.id}</p>
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

