
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
  Eye,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { GlowCard } from "@/components/layout/GlowCard";
import { HashDisplay } from "@/components/ui/HashDisplay";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Link, useNavigate } from "react-router-dom";
import { NewSubmissionModal } from "@/components/dashboard/NewSubmissionModal";
import ApiService from "@/services/ApiService";
import { useSecurity } from "@/context/SecurityContext";

const statusConfig = {
  pending: { label: "Pending Review", color: "text-muted-foreground", icon: Clock },
  under_review: { label: "Under Review", color: "text-accent", icon: Eye },
  evaluated: { label: "Evaluated (Pending Publication)", color: "text-indigo-400", icon: CheckCircle2 },
  published: { label: "Published & Verified", color: "text-accent", icon: Shield },
  rejected: { label: "Rejected", color: "text-destructive", icon: XCircle },
};

type StudentTab = "submissions" | "grades";

export default function StudentDashboard() {
  const { user, logout } = useSecurity();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTab>("submissions");
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [submissionsSubTab, setSubmissionsSubTab] = useState<"all" | "evaluated">("all");

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const loadSubmissions = async () => {
    if (user) {
      try {
        const response = await ApiService.getMyProjects();
        if (response.success) {
          setSubmissions(response.projects || []);
          // Check for filename field presence to alert about server restart
          if (response.projects?.length > 0 && !response.projects[0].originalName && response.projects[0].id) {
            console.warn("Original names missing in API response. Server restart may be required.");
          }
        }
      } catch (error) {
        console.error("Failed to load submissions:", error);
      }
    }
  };

  const renderSubmissionItem = (submission: any) => {
    const status = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = status.icon;
    const isGradesTab = activeTab === "grades";

    return (
      <motion.div
        key={submission._id || submission.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setSelectedSubmission(submission)}
      >
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-mono font-medium text-lg">{submission.title}</h3>
              {isGradesTab && (
                <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {new Date(submission.submittedAt).toLocaleDateString()}
              </span>
              {submission.encrypted !== false && (
                <SecurityBadge variant="encrypted" showIcon>
                  AES-256 Secured
                </SecurityBadge>
              )}
            </div>

            {submission.originalName && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-md w-fit mb-4">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-primary/80">{submission.originalName}</span>
              </div>
            )}

            {isGradesTab ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-muted/20 border border-border/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-mono mb-2">Evaluator Details</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-xs font-bold">
                      {submission.reviewer?.username?.charAt(0).toUpperCase() || "R"}
                    </div>
                    <div>
                      <p className="text-sm font-mono font-medium">{submission.reviewer?.username || "Reviewer"}</p>
                      <p className="text-xs text-muted-foreground">{submission.reviewer?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Published By</p>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      <p className="text-sm font-mono font-medium text-accent">Office of Controller of Examinations</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Feedback</p>
                    <p className="text-sm text-muted-foreground italic">"{submission.feedback}"</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                <HashDisplay
                  hash={submission.fileHash}
                  label="File Integrity Hash"
                  algorithm="SHA-256"
                  truncate
                />
              </div>
            )}
          </div>

          {isGradesTab && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/30 flex flex-col items-center justify-center shadow-lg shadow-primary/5">
                <span className="text-3xl font-mono font-bold text-primary">
                  {submission.grade || submission.grading || "N/A"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1">Final Grade</p>
            </div>
          )}

          {!isGradesTab && submission.status !== 'evaluated' && submission.status !== 'published' && (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={(e) => handleDeleteSubmission(e, submission._id || submission.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const handleSubmissionSuccess = () => {
    loadSubmissions();
    setIsSubmissionModalOpen(false);
  };

  const handleDeleteSubmission = async (e: React.MouseEvent, submissionId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this submission? This cannot be undone.")) {
      return;
    }

    try {
      const result = await ApiService.deleteProject(submissionId);
      if (result.success) {
        toast.success("Submission deleted successfully");
        loadSubmissions();
        if (selectedSubmission?._id === submissionId || selectedSubmission?.id === submissionId) {
          setSelectedSubmission(null);
        }
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error(error.message || "Failed to delete submission");
    }
  };

  const allSubmissions = submissions.filter(s => {
    return s.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const evaluatedSubmissions = submissions.filter(s => {
    return (s.status === 'evaluated' || s.status === 'published') &&
      s.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const gradesSubmissions = submissions.filter(s => {
    return s.status === 'published' && s.title.toLowerCase().includes(searchTerm.toLowerCase());
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
                  <p className="text-xs text-muted-foreground">Student Portal</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab("submissions")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "submissions"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <FileText className="w-4 h-4" />
                    My Submissions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("grades")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "grades"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Grades
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsSubmissionModalOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-sm transition-colors mt-4"
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
                  <p className="font-mono text-sm font-medium truncate">{user?.username || user?.email || 'Student'}</p>
                  <RoleBadge role="student" size="sm" />
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
                    {activeTab === "submissions" ? "My Submissions" : "Final Grades"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "submissions" ? "Manage your project submissions" : "View your verified results"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusIndicator status="secure" label="Session Secure" pulse />
                {activeTab === "submissions" && (
                  <Button className="font-mono" onClick={() => setIsSubmissionModalOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    New Submission
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">


            {/* Submissions/Grades List */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="font-mono font-semibold whitespace-nowrap">
                      {activeTab === "submissions" ? "Submission History" : "Verified Results"}
                    </h2>
                    <SecurityBadge variant="encrypted">
                      {activeTab === "submissions" ? "Files Encrypted" : "Result Verified"}
                    </SecurityBadge>
                  </div>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by title..."
                      className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {activeTab === "submissions" && (
                  <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-lg w-fit">
                    <button
                      onClick={() => setSubmissionsSubTab("all")}
                      className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all ${submissionsSubTab === "all"
                        ? "bg-background text-primary shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      All Submissions ({allSubmissions.length})
                    </button>
                    <button
                      onClick={() => setSubmissionsSubTab("evaluated")}
                      className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all ${submissionsSubTab === "evaluated"
                        ? "bg-background text-primary shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Evaluated / Published ({evaluatedSubmissions.length})
                    </button>
                  </div>
                )}
              </div>
              {activeTab === "grades" ? (
                gradesSubmissions.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground font-mono">
                    No published grades yet. Results appear after Admin verification.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {gradesSubmissions.map((submission) => renderSubmissionItem(submission))}
                  </div>
                )
              ) : (
                <div className="divide-y divide-border">
                  {submissionsSubTab === "all" ? (
                    allSubmissions.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground font-mono">
                        No submissions yet. Click "New Submission" to start.
                      </div>
                    ) : (
                      allSubmissions.map((submission) => renderSubmissionItem(submission))
                    )
                  ) : (
                    evaluatedSubmissions.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground font-mono">
                        No evaluated or published projects found.
                      </div>
                    ) : (
                      evaluatedSubmissions.map((submission) => renderSubmissionItem(submission))
                    )
                  )}
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
                    <div className="flex justify-between items-start">
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
                      {activeTab === 'grades' && (
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <span className="text-2xl font-mono font-bold text-primary">
                              {selectedSubmission.grade || selectedSubmission.grading || "N/A"}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1">Grade</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground uppercase font-mono">Submitted File</p>
                        <p className="text-sm font-mono truncate">{selectedSubmission.originalName || "Not recorded for this submission"}</p>
                      </div>
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

                    {activeTab === 'grades' && (selectedSubmission.feedback || selectedSubmission.evaluation?.feedback) && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm font-mono font-medium mb-2">Reviewer Feedback</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedSubmission.feedback || selectedSubmission.evaluation?.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </main>
      </div >

      <NewSubmissionModal
        open={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSuccess={handleSubmissionSuccess}
      />
    </GridBackground >
  );
}
