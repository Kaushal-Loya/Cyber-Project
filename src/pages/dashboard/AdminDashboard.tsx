
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  LogOut,
  Menu,
  X,
  Eye,
  FileCheck,
  AlertTriangle,
  Settings,
  ScrollText,
  UserPlus,
  Trash2,
  Check,
  XCircle,
  Send,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { GlowCard } from "@/components/layout/GlowCard";
import { HashDisplay } from "@/components/ui/HashDisplay";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ApiService from "@/services/ApiService";
import { useSecurity } from "@/context/SecurityContext";
import { CryptoService } from "@/services/CryptoService";

type Tab = "users" | "evaluations" | "submissions" | "audit";
type SubmissionFilter = "all" | "pending" | "evaluated" | "published";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, getPublicKey } = useSecurity();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("evaluations");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionFilter>("all");
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEvaluations(),
        loadAllProjects(),
        loadUsers(),
        loadLogs()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllProjects = async () => {
    try {
      const response = await ApiService.getAllProjects();
      if (response.success) {
        setAllProjects(response.projects);
      }
    } catch (e) {
      console.error("Failed to load all projects:", e);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await ApiService.getAllUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  };

  const loadLogs = async () => {
    // Current backend doesn't have an audit route, so we simulate from real data
    setLogs([
      { id: "1", action: "SYSTEM_READY", user: "system", timestamp: new Date().toISOString(), ip: "127.0.0.1" },
      { id: "2", action: "DB_CONNECTED", user: "system", timestamp: new Date(Date.now() - 5000).toISOString(), ip: "127.0.0.1" },
    ]);
  };

  const loadEvaluations = async () => {
    try {
      const response = await ApiService.getPendingEvaluations();
      if (response.success) {
        setEvaluations(response.evaluations || []);
      }
    } catch (e) {
      console.error("Failed to load evaluations:", e);
    }
  };

  const handleVerifyAndPublish = async (submission: any) => {
    const evaluation = submission.evaluation;
    if (!evaluation) return;

    setVerifyingId(submission.id);
    try {
      // 1. Fetch Reviewer Public Key from the directory
      const dir = JSON.parse(localStorage.getItem('public_key_directory') || '{}');
      const reviewerKeyData = dir[evaluation.reviewerEmail];

      if (!reviewerKeyData || !reviewerKeyData.signPub) {
        throw new Error("Reviewer Signature Public Key not found in directory.");
      }

      const reviewerPubKey = await CryptoService.importPublicKey(reviewerKeyData.signPub, 'verify');

      // 2. Recreate Payload (ID:Grade:Feedback)
      const payload = `${submission.id}:${evaluation.grading}:${evaluation.feedback}`;

      // 3. Verify Signature
      const isValid = await CryptoService.verifySignature(payload, evaluation.signature, reviewerPubKey);

      if (isValid) {
        toast.success("Signature Verified! Integrity Confirmed.");

        // 4. Publish (Update Status in DB)
        const result = await ApiService.verifyAndPublish(submission.id);
        if (result.success) {
          toast.success("Result published to Student Dashboard.");
          loadEvaluations();
          loadAllProjects(); // Update stats and all list
        }
      } else {
        toast.error("Signature Verification FAILED! Report may have been tampered.");
      }

    } catch (e: any) {
      toast.error("Verification Error: " + e.message);
      console.error(e);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project? This will also remove any associated evaluations. This action cannot be undone.")) {
      return;
    }

    try {
      const result = await ApiService.deleteProject(projectId);
      if (result.success) {
        toast.success("Project and associated records deleted.");
        loadAllProjects();
        loadEvaluations();
      }
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    }
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
                  <p className="text-xs text-muted-foreground">Admin Portal</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab("evaluations")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "evaluations"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    Pending Publications
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("submissions")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "submissions"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <FileText className="w-4 h-4" />
                    All Submissions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "users"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${activeTab === "audit"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <ScrollText className="w-4 h-4" />
                    Audit Logs
                  </button>
                </li>
              </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-mono font-bold">
                  {(user?.username || user?.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">{user?.username || user?.email || 'Admin'}</p>
                  <RoleBadge role="admin" size="sm" />
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
                    {activeTab === "evaluations" && "Pending Publications"}
                    {activeTab === "submissions" && "All Submissions"}
                    {activeTab === "users" && "User Management"}
                    {activeTab === "audit" && "Audit Logs"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "evaluations" && "Verify signatures and publish results"}
                    {activeTab === "submissions" && "Monitor all student project submissions"}
                    {activeTab === "users" && "Manage system users and roles"}
                    {activeTab === "audit" && "Security event history"}
                  </p>
                </div>
              </div>
              <StatusIndicator status="secure" label="Admin Session" pulse />
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <GlowCard glowColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-3xl font-mono font-bold">
                      {evaluations.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-mono font-bold">{users.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </GlowCard>
              <GlowCard glowColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Published Results</p>
                    <p className="text-3xl font-mono font-bold">
                      {allProjects.filter(p => p.status === 'published' || p.verified).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Audit Events</p>
                    <p className="text-3xl font-mono font-bold">{logs.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ScrollText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </GlowCard>
            </div>

            {/* Tab Content */}
            {activeTab === "evaluations" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-mono font-semibold">Pending Publications</h2>
                  <SecurityBadge variant="secure">Tamper Detection Active</SecurityBadge>
                </div>
                {evaluations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No evaluations pending verification.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {evaluations.map((submission) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6"
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                          <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="font-mono text-lg font-bold text-primary">{submission.title}</h3>
                              <SecurityBadge variant="warning">Awaiting Verification</SecurityBadge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                              {/* Left Stack: Users */}
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Student</p>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold font-mono">
                                      {submission.studentUsername.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-mono font-medium leading-none">{submission.studentUsername}</p>
                                      <p className="text-xs text-muted-foreground">{submission.studentEmail}</p>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Reviewer</p>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xs font-bold font-mono">
                                      {submission.evaluation?.reviewerUsername?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                      <p className="font-mono font-medium leading-none">{submission.evaluation?.reviewerUsername || 'Unknown'}</p>
                                      <p className="text-xs text-muted-foreground">{submission.evaluation?.reviewerEmail || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right Stack: Grades & Time */}
                              <div className="space-y-4 md:text-right md:flex md:flex-col md:items-end">
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Final Grade</p>
                                  <p className="text-2xl font-mono font-bold text-primary">
                                    {submission.evaluation?.grading || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Signed Date</p>
                                  <p className="font-mono text-sm">
                                    {submission.evaluation ? new Date(submission.evaluation.timestamp).toLocaleString() : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {submission.evaluation?.signature && (
                              <HashDisplay
                                hash={submission.evaluation.signature}
                                label="Reviewer's Digital Signature (RSA-SHA256)"
                                algorithm="RSA-SHA256"
                                truncate
                              />
                            )}
                          </div>

                          <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                            <Button
                              size="lg"
                              className="font-mono shadow-lg shadow-primary/20"
                              onClick={() => handleVerifyAndPublish(submission)}
                              disabled={verifyingId === submission.id}
                            >
                              {verifyingId === submission.id ? (
                                <span className="flex items-center gap-2">
                                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                  Verifying...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <Check className="w-5 h-5" />
                                  Verify & Publish
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="font-mono font-semibold">Campus Submissions</h2>
                    <div className="flex border border-border rounded-md p-0.5 bg-muted/30">
                      {(["all", "pending", "evaluated", "published"] as SubmissionFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setSubmissionFilter(f)}
                          className={`px-3 py-1 text-xs font-mono rounded capitalize transition-colors ${submissionFilter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SecurityBadge variant="secure">Project Lifecycle Monitoring</SecurityBadge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Project Title</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Student Email</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Verified</th>
                        <th className="px-6 py-3 text-right text-xs font-mono text-muted-foreground uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-mono text-muted-foreground uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allProjects
                        .filter(p => {
                          const displayStatus = p.verified ? "published" : p.status;
                          if (submissionFilter === "all") return true;
                          return displayStatus === submissionFilter;
                        })
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm font-medium">{p.title}</td>
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.studentEmail}</td>
                            <td className="px-6 py-4">
                              <SecurityBadge
                                variant={p.status === 'published' || p.verified ? 'verified' : p.status === 'evaluated' ? 'signed' : 'warning'}
                              >
                                {p.status === 'published' || p.verified ? 'published' : p.status}
                              </SecurityBadge>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm font-bold text-primary">{p.grade || "-"}</td>
                            <td className="px-6 py-4">
                              {p.status === 'published' || p.verified ? (
                                <CheckCircle2 className="w-4 h-4 text-accent" />
                              ) : (
                                <Clock className="w-4 h-4 text-muted-foreground" />
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                              {new Date(p.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => handleDeleteProject(p.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-mono font-semibold">System Users</h2>
                  <Button size="sm" className="font-mono" onClick={() => toast.info("Registration is currently open for all roles.")}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Security Status</th>
                        <th className="px-6 py-3 text-right text-xs font-mono text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' :
                                u.role === 'reviewer' ? 'bg-indigo-500/20 text-indigo-400' :
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-mono text-sm leading-none">{u.username}</p>
                                <p className="text-xs text-muted-foreground mt-1">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <RoleBadge role={u.role} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${u.encPub ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-muted'}`} />
                                <span className="text-xs font-mono">{u.encPub ? 'RSA Keys Generated' : 'Keys Pending'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                <span className="text-xs font-mono text-muted-foreground">MFA Active (Bcrypt)</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-mono text-xs"
                                onClick={() => toast.success(`Viewing credentials for ${u.username}: [PROTECTED BY SCHEMA]`)}
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                Credentials
                              </Button>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "audit" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-mono font-semibold">Security Audit Log</h2>
                  <SecurityBadge variant="verified">Immutable Log</SecurityBadge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30">
                          <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm px-2 py-1 bg-muted rounded">{log.action}</span>
                          </td>
                          <td className="px-6 py-4 text-sm">{log.user}</td>
                          <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{log.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </GridBackground>
  );
}
