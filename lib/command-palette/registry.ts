/**
 * Command palette registry.
 * Commands are filtered by user role (employee, employer, admin).
 * Preload: registry is static; filter by role when palette opens.
 */

export type CommandCategory = "employee" | "employer" | "admin" | "global";

export type Command = {
  id: string;
  name: string;
  description: string;
  /** Route to navigate to (used when action is 'navigate'). */
  route?: string;
  /** Optional: custom action key for programmatic handling (e.g. open modal). */
  action?: string;
  category: CommandCategory;
  /** Extra keywords for fuzzy search. */
  keywords?: string[];
};

/** All commands. Role filtering applied at runtime. */
export const COMMANDS: Command[] = [
  // ——— Employee ———
  {
    id: "emp-add-employment",
    name: "Add employment",
    description: "Add a job to your professional record",
    route: "/profile",
    category: "employee",
    keywords: ["job", "work", "history", "add"],
  },
  {
    id: "emp-request-verification",
    name: "Request verification",
    description: "Ask a colleague to verify your employment",
    action: "open-verification-request",
    category: "employee",
    keywords: ["verify", "colleague", "coworker", "request"],
  },
  {
    id: "emp-share-credential",
    name: "Share credential",
    description: "Create and share your WorkVouch credential link",
    route: "/dashboard/worker",
    category: "employee",
    keywords: ["credential", "share", "link", "workvouch"],
  },
  {
    id: "emp-view-trust-timeline",
    name: "View trust timeline",
    description: "See your verifications, references, and trust events",
    route: "/dashboard/worker",
    category: "employee",
    keywords: ["timeline", "trust", "history", "events"],
  },
  {
    id: "emp-invite-coworker",
    name: "Invite coworker",
    description: "Invite a coworker to join WorkVouch",
    route: "/coworker-matches",
    category: "employee",
    keywords: ["invite", "coworker", "match", "references"],
  },
  {
    id: "emp-export-profile",
    name: "Export profile",
    description: "Export your profile or resume",
    route: "/profile",
    category: "employee",
    keywords: ["export", "download", "resume", "pdf"],
  },
  // ——— Employer ———
  {
    id: "emp-search-candidates",
    name: "Search candidates",
    description: "Search and verify worker profiles",
    route: "/dashboard/employer/search",
    category: "employer",
    keywords: ["search", "candidates", "workers", "find"],
  },
  {
    id: "emp-compare-candidates",
    name: "Compare candidates",
    description: "Compare multiple candidates side by side",
    route: "/dashboard/employer/comparison",
    category: "employer",
    keywords: ["compare", "candidates", "side by side"],
  },
  {
    id: "emp-view-hiring-confidence",
    name: "View hiring confidence",
    description: "See hiring confidence for a candidate",
    route: "/dashboard/employer/search",
    category: "employer",
    keywords: ["hiring", "confidence", "candidate"],
  },
  {
    id: "emp-add-candidate-note",
    name: "Add candidate note",
    description: "Add a private note to a saved candidate",
    route: "/dashboard/employer/candidates",
    category: "employer",
    keywords: ["note", "candidate", "save", "private"],
  },
  {
    id: "emp-share-candidate",
    name: "Share candidate",
    description: "Share a candidate profile with your team",
    route: "/dashboard/employer",
    category: "employer",
    keywords: ["share", "candidate", "team"],
  },
  // ——— Admin ———
  {
    id: "admin-review-flags",
    name: "Review flags",
    description: "Review flagged content and reports",
    route: "/admin/flagged-content",
    category: "admin",
    keywords: ["flags", "moderation", "review", "content"],
  },
  {
    id: "admin-view-audit-logs",
    name: "View audit logs",
    description: "View system audit logs",
    route: "/admin/audit-logs",
    category: "admin",
    keywords: ["audit", "logs", "admin"],
  },
  {
    id: "admin-reset-sandbox",
    name: "Reset sandbox",
    description: "Reset sandbox environment",
    route: "/admin/sandbox-v2",
    category: "admin",
    keywords: ["sandbox", "reset", "admin"],
  },
  {
    id: "admin-open-lab-playground",
    name: "Open lab playground",
    description: "Open the lab playground",
    route: "/admin/sandbox-v2",
    category: "admin",
    keywords: ["lab", "playground", "sandbox", "admin"],
  },
  // ——— Global (pages, available to all) ———
  {
    id: "go-dashboard",
    name: "Go to Trust Overview",
    description: "Open your trust overview dashboard",
    route: "/dashboard",
    category: "global",
    keywords: ["dashboard", "trust", "overview", "home"],
  },
  {
    id: "go-profile",
    name: "Go to Professional Record",
    description: "Edit your profile and employment",
    route: "/profile",
    category: "global",
    keywords: ["profile", "record", "edit"],
  },
  {
    id: "go-settings",
    name: "Go to Settings",
    description: "Account and privacy settings",
    route: "/settings",
    category: "global",
    keywords: ["settings", "account", "privacy"],
  },
  {
    id: "go-coworker-matches",
    name: "Go to Coworker matches",
    description: "Find and invite coworkers",
    route: "/coworker-matches",
    category: "global",
    keywords: ["coworker", "matches", "invite"],
  },
  {
    id: "go-login",
    name: "Log in",
    description: "Sign in to your account",
    route: "/login",
    category: "global",
    keywords: ["login", "sign in", "auth"],
  },
  {
    id: "go-signup",
    name: "Sign up",
    description: "Create an account",
    route: "/signup",
    category: "global",
    keywords: ["signup", "register", "create account"],
  },
];

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  employee: "Employee",
  employer: "Employer",
  admin: "Admin",
  global: "Pages",
};

export function getCategoryLabel(category: CommandCategory): string {
  return CATEGORY_LABELS[category];
}

export type UserRole = "employee" | "employer" | "admin" | null;

/**
 * Returns commands available for the given role.
 * - global: always included
 * - employee: global + employee
 * - employer: global + employer
 * - admin: global + admin
 * - null (not logged in): global only
 */
export function getCommandsForRole(role: UserRole): Command[] {
  const roleNorm = role?.toLowerCase().trim() ?? null;
  return COMMANDS.filter((c) => {
    if (c.category === "global") return true;
    if (c.category === "employee") return roleNorm === "employee";
    if (c.category === "employer") return roleNorm === "employer";
    if (c.category === "admin")
      return roleNorm === "admin" || roleNorm === "superadmin" || roleNorm === "super_admin";
    return false;
  });
}

/**
 * Fuzzy filter: query tokens must each appear (substring) in name, description, or keywords.
 */
export function fuzzyFilterCommands(commands: Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  const tokens = q.split(/\s+/).filter(Boolean);
  return commands.filter((cmd) => {
    const searchable = [
      cmd.name,
      cmd.description,
      ...(cmd.keywords ?? []),
    ].join(" ").toLowerCase();
    return tokens.every((t) => searchable.includes(t));
  });
}
