"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  type Command,
  getCommandsForRole,
  fuzzyFilterCommands,
  getCategoryLabel,
  type UserRole,
} from "@/lib/command-palette/registry";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When a command with action "open-verification-request" is run, this is called. */
  onOpenVerificationRequest?: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onOpenVerificationRequest,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [role, setRole] = useState<UserRole>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // Preload role when palette opens (or on mount for instant open)
  useEffect(() => {
    if (!open) return;
    if (roleLoaded) return;
    let cancelled = false;
    fetch("/api/user/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok || cancelled) return null;
        return res.json();
      })
      .then((data: { user?: { role?: string } } | null) => {
        if (cancelled || !data?.user) {
          if (!cancelled) setRole(null);
          return;
        }
        const r = (data.user.role as string) ?? null;
        const norm = r?.toLowerCase().trim() ?? null;
        if (norm === "employer") setRole("employer");
        else if (norm === "employee") setRole("employee");
        else if (
          norm === "admin" ||
          norm === "superadmin" ||
          norm === "super_admin"
        )
          setRole("admin");
        else setRole(null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      })
      .finally(() => {
        if (!cancelled) setRoleLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, roleLoaded]);

  const commandsForRole = useMemo(
    () => getCommandsForRole(role),
    [role]
  );
  const filtered = useMemo(
    () => fuzzyFilterCommands(commandsForRole, query),
    [commandsForRole, query]
  );

  const selectedCommand = filtered[selectedIndex] ?? null;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex >= filtered.length && filtered.length > 0) {
      setSelectedIndex(filtered.length - 1);
    } else if (selectedIndex < 0) {
      setSelectedIndex(0);
    }
  }, [selectedIndex, filtered.length]);

  const execute = useCallback(
    (cmd: Command) => {
      if (cmd.action === "open-verification-request") {
        onOpenVerificationRequest?.();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("workvouch:open-verification-request"));
        }
        // If not on worker dashboard, navigate so the page can open the modal via query or event
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/dashboard/worker")) {
          router.push("/dashboard/worker?openVerification=1");
        }
        onOpenChange(false);
        return;
      }
      if (cmd.route) {
        router.push(cmd.route);
        onOpenChange(false);
      }
    },
    [router, onOpenChange, onOpenVerificationRequest]
  );

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    setQuery("");
    setSelectedIndex(0);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !selectedCommand) return;
    const item = el.querySelector(`[data-command-id="${selectedCommand.id}"]`);
    item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, selectedCommand?.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          return;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          return;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          return;
        case "Enter":
          e.preventDefault();
          if (selectedCommand) execute(selectedCommand);
          return;
        default:
          break;
      }
    },
    [open, filtered.length, selectedCommand, execute, onOpenChange]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-xl rounded-xl bg-white dark:bg-[#1A1F2B] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 min-w-0 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none text-base"
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            aria-activedescendant={selectedCommand ? selectedCommand.id : undefined}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
            Esc
          </kbd>
        </div>

        <div className="max-h-[min(60vh,400px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No commands match &quot;{query}&quot;
            </div>
          ) : (
            <ul
              id="command-palette-list"
              ref={listRef}
              role="listbox"
              className="py-2"
            >
              {filtered.map((cmd, i) => (
                <li
                  key={cmd.id}
                  role="option"
                  aria-selected={i === selectedIndex}
                  data-command-id={cmd.id}
                  onClick={() => execute(cmd)}
                  className={`flex flex-col gap-0.5 px-4 py-2.5 cursor-pointer transition-colors ${
                    i === selectedIndex
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {cmd.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                      {getCategoryLabel(cmd.category)}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {cmd.description}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>
            <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5">↑↓</kbd> navigate
            <span className="mx-2">·</span>
            <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5">Enter</kbd> execute
          </span>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

/** Global command palette with Ctrl+K / Cmd+K shortcut. Mount once in root layout. */
export function CommandPaletteGlobal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
    />
  );
}
