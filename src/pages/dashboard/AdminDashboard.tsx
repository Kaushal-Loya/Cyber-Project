
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/layout/GridBackground";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { GlowCard } from "@/components/layout/GlowCard";
import { HashDisplay } from "@/components/ui/HashDisplay";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MockDatabaseService } from "@/services/MockDatabaseService";
import { useSecurity } from "@/context/SecurityContext";
import { CryptoService } from "@/services/CryptoService";

type Tab = "users" | "evaluations" | "audit";

export default function AdminDashboard() {
  const { user, logout, getPublicKey } = useSecurity();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("evaluations");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Mock users
  const [logs, setLogs] = useState<any[]>([]); // Mock logs

  useEffect(() => {
    loadEvaluations();
    // Use simulated data for users/logs for this demo
    setLogs([
      { id: "1", action: "USER_LOGIN", user: "student@univ.edu", timestamp: new Date(Date.now() - 1000000).toISOString(), ip: "192.168.1.100" },
      { id: "2", action: "PROJECT_SUBMIT", user: "student@univ.edu", timestamp: new Date(Date.now() - 900000).toISOString(), ip: "192.168.1.100" },
      { id: "3", action: "EVALUATION_SIGN", user: "reviewer@univ.edu", timestamp: new Date(Date.now() - 500000).toISOString(), ip: "192.168.1.102" },
    ]);
  }, [user]);

  const loadEvaluations = () => {
    const allEvals = MockDatabaseService.getEvaluations();
    const subs = MockDatabaseService.getSubmissions();
    const joined = allEvals.map(ev => {
      const sub = subs.find(s => s.id === ev.submissionId);
      return {
        ...ev,
        id: ev.id, // Ensure ID is correct
        projectTitle: sub?.title || "Unknown Project",
        student: sub?.studentId || "Unknown Student",
        reviewer: ev.evaluatorId,
        grade: ev.grading || "N/A", // Use grading field
        submittedAt: ev.timestamp,
        signatureHash: ev.signature,
        verified: sub?.status === 'evaluated' // Consider verified if status upgraded? Or separate flag needed.
        // For this demo, we can assume 'evaluated' means pending verification unless we add 'published' status.
        // Let's assume we need to verify.
      };
    });
    setEvaluations(joined);
  };

  const handleVerifyAndPublish = async (evaluation: any) => {
    setVerifyingId(evaluation.id);
    try {
      // 1. Fetch Reviewer Public Key
      // In this demo, we might not have a perfect map of evaluatorId to Public Key if we didn't store it properly.
      // We will try to fetch using the ID.
      let reviewerPubKey = await getPublicKey(evaluation.reviewer, 'sign');

      if (!reviewerPubKey) {
        console.warn("Reviewer key not found, trying fallback for demo");
        // Fallback for demo: Check if WE are the reviewer (same browser session)
        // or check the directory manually
        const dir = JSON.parse(localStorage.getItem('public_key_directory') || '{}');
        if (dir[evaluation.reviewer]) {
          reviewerPubKey = await CryptoService.importPublicKey(dir[evaluation.reviewer].signPub, 'verify');
        }
      }

      if (!reviewerPubKey) {
        throw new Error("Reviewer Public Key not found. Cannot verify signature.");
      }

      // 2. Recreate Payload
      const payload = `${evaluation.submissionId}:${evaluation.grade}:${evaluation.feedback}`;

      // 3. Verify
      const isValid = await CryptoService.verifySignature(payload, evaluation.signature, reviewerPubKey);

      if (isValid) {
        toast.success("Signature Verified! Integrity Confirmed.");

        // 4. Publish (Update Status)
        MockDatabaseService.updateSubmissionStatus(evaluation.submissionId, 'evaluated'); // Or 'published'
        // Add to logs
        const newLog = { id: crypto.randomUUID(), action: "RESULT_PUBLISH", user: user?.email, timestamp: new Date().toISOString(), ip: "127.0.0.1" };
        setLogs(prev => [newLog, ...prev]);

        // Mark locally as verified (or reload)
        loadEvaluations();
      } else {
        toast.error("Signature Verification FAILED! Report may have been tampered.");
      }

    } catch (e: any) {
      toast.error("Verification Error: " + e.message);
    } finally {
      setVerifyingId(null);
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
                    Pending Approvals
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
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">{user?.email || 'Admin'}</p>
                  <RoleBadge role="admin" size="sm" />
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
                  <h1 className="font-mono text-xl font-bold">
                    {activeTab === "evaluations" && "Pending Approvals"}
                    {activeTab === "users" && "User Management"}
                    {activeTab === "audit" && "Audit Logs"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "evaluations" && "Verify signatures and publish results"}
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
                    <p className="text-3xl font-mono font-bold">{users.length || 4}</p>
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
                    <p className="text-3xl font-mono font-bold">12</p>
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
                  <h2 className="font-mono font-semibold">Evaluations Verification Queue</h2>
                  <SecurityBadge variant="secure">Tamper Detection Active</SecurityBadge>
                </div>
                {evaluations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No evaluations pending verification.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {evaluations.map((evaluation) => (
                      <motion.div
                        key={evaluation.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-mono font-medium">{evaluation.projectTitle}</h3>
                              {evaluation.verified ? (
                                <SecurityBadge variant="verified">Verified</SecurityBadge>
                              ) : (
                                <SecurityBadge variant="warning">Awaiting Verification</SecurityBadge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-muted-foreground">Student ID</p>
                                <p className="font-mono">{evaluation.student.substring(0, 8)}...</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Reviewer ID</p>
                                <p className="font-mono">{evaluation.reviewer.substring(0, 8)}...</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Grade</p>
                                <p className="font-mono text-primary font-bold">{evaluation.grade}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Signed At</p>
                                <p className="font-mono">{new Date(evaluation.submittedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <HashDisplay
                              hash={evaluation.signatureHash}
                              label="Reviewer's Digital Signature (RSA-SHA256)"
                              algorithm="RSA-SHA256"
                              truncate
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="font-mono">
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            {!evaluation.verified && (
                              <>
                                <Button
                                  size="sm"
                                  className="font-mono"
                                  onClick={() => handleVerifyAndPublish(evaluation)}
                                  disabled={verifyingId === evaluation.id}
                                >
                                  {verifyingId === evaluation.id ? (
                                    <span className="flex items-center gap-2">
                                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                      Verifying...
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-2">
                                      <Check className="w-4 h-4" />
                                      Verify & Publish
                                    </span>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
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
