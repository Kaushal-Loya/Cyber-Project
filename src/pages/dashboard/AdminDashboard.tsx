import { useState } from "react";
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

const mockUsers = [
  { id: "1", name: "Alice Johnson", email: "alice@university.edu", role: "student" as const, status: "active" },
  { id: "2", name: "Bob Smith", email: "bob@university.edu", role: "student" as const, status: "active" },
  { id: "3", name: "Dr. Roberts", email: "roberts@university.edu", role: "reviewer" as const, status: "active" },
  { id: "4", name: "Prof. Williams", email: "williams@university.edu", role: "reviewer" as const, status: "active" },
];

const mockPendingEvaluations = [
  {
    id: "1",
    projectTitle: "Cryptography Final Project",
    student: "Alice Johnson",
    reviewer: "Dr. Roberts",
    grade: "A",
    submittedAt: "2024-01-22T14:30:00Z",
    signatureHash: "e5f6789012345678901234567890abcdef01234567",
    verified: true,
  },
  {
    id: "2",
    projectTitle: "Network Security Analysis",
    student: "Bob Smith",
    reviewer: "Prof. Williams",
    grade: "B+",
    submittedAt: "2024-01-23T10:15:00Z",
    signatureHash: "f6789012345678901234567890abcdef012345678",
    verified: false,
  },
];

const mockAuditLogs = [
  { id: "1", action: "USER_LOGIN", user: "alice@university.edu", timestamp: "2024-01-23T10:00:00Z", ip: "192.168.1.100" },
  { id: "2", action: "PROJECT_SUBMIT", user: "bob@university.edu", timestamp: "2024-01-23T10:15:00Z", ip: "192.168.1.101" },
  { id: "3", action: "EVALUATION_SIGN", user: "roberts@university.edu", timestamp: "2024-01-23T11:00:00Z", ip: "192.168.1.102" },
  { id: "4", action: "RESULT_PUBLISH", user: "admin@university.edu", timestamp: "2024-01-23T12:00:00Z", ip: "192.168.1.1" },
];

type Tab = "users" | "evaluations" | "audit";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("evaluations");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleVerifyAndPublish = async (id: string) => {
    setVerifyingId(id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setVerifyingId(null);
    toast.success("Signature verified and result published!");
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${
                      activeTab === "evaluations"
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
                    onClick={() => setActiveTab("users")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${
                      activeTab === "users"
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-sm transition-colors ${
                      activeTab === "audit"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ScrollText className="w-4 h-4" />
                    Audit Logs
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </a>
                </li>
              </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-mono font-bold">
                  AD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">Admin User</p>
                  <RoleBadge role="admin" size="sm" />
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
                      {mockPendingEvaluations.filter((e) => !e.verified).length}
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
                    <p className="text-3xl font-mono font-bold">{mockUsers.length}</p>
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
                    <p className="text-sm text-muted-foreground">Audit Events (24h)</p>
                    <p className="text-3xl font-mono font-bold">{mockAuditLogs.length}</p>
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
                  <h2 className="font-mono font-semibold">Evaluations Pending Verification</h2>
                  <SecurityBadge variant="secure">Tamper Detection Active</SecurityBadge>
                </div>
                <div className="divide-y divide-border">
                  {mockPendingEvaluations.map((evaluation) => (
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
                              <SecurityBadge variant="verified">Published</SecurityBadge>
                            ) : (
                              <SecurityBadge variant="warning">Awaiting Verification</SecurityBadge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-muted-foreground">Student</p>
                              <p className="font-mono">{evaluation.student}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Reviewer</p>
                              <p className="font-mono">{evaluation.reviewer}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Grade</p>
                              <p className="font-mono text-primary font-bold">{evaluation.grade}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Submitted</p>
                              <p className="font-mono">{new Date(evaluation.submittedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <HashDisplay
                            hash={evaluation.signatureHash}
                            label="Reviewer's Digital Signature"
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
                                onClick={() => handleVerifyAndPublish(evaluation.id)}
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
                              <Button variant="destructive" size="sm" className="font-mono">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-mono font-semibold">System Users</h2>
                  <Button size="sm" className="font-mono">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-mono text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {mockUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30">
                          <td className="px-6 py-4 font-mono text-sm">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                          <td className="px-6 py-4">
                            <RoleBadge role={user.role} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <StatusIndicator status="secure" label="Active" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
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
                      {mockAuditLogs.map((log) => (
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
