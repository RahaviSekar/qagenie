"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  History,
  Loader2,
  Pencil,
  Radar,
  Sparkles,
  Terminal,
  Workflow,
  X,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";

type Tab = "scan" | "flows" | "regression";

type LogLine = { message: string; level: string; ts?: string };

const LS_BASE_URL = "qa-genie-default-base-url";
const LS_INCLUDE_NEGATIVE = "qa-genie-include-negative-run";

type FlowRunCaseRow = {
  kind: "happy_path" | "negative" | "positive";
  title: string;
  passed: boolean;
  durationMs?: number | null;
  errorMessage?: string | null;
  plainSummary?: string | null;
};

type FlowRunReportShape = {
  summary: {
    total: number;
    passedCount: number;
    failedCount: number;
    happyPassed: boolean;
    negativePassed: number;
    negativeFailed: number;
    negativeTotal: number;
    positivePassed?: number;
    positiveFailed?: number;
    positiveTotal?: number;
    includeNegativeTests?: boolean;
  };
  cases: FlowRunCaseRow[];
};

function formatBugReportText(
  flowName: string,
  report: FlowRunReportShape,
  overallPassed: boolean,
  progress?: FriendlyFailureProgress | null
) {
  const s = report.summary;
  const lines: string[] = [];
  lines.push(`QA Genie — ${flowName}`);
  lines.push(`Overall: ${overallPassed ? "PASSED" : "FAILED"}`);
  lines.push("");
  if (progress && (progress.completedSteps.length > 0 || progress.failedAtStepNumber)) {
    lines.push("Where the automated run got to (your checklist)");
    for (const step of progress.completedSteps) {
      lines.push(`  ✓ ${step.summary || step.text}`);
    }
    if (progress.failedAtStepNumber != null) {
      lines.push(
        `  ✗ Step ${progress.failedAtStepNumber}: ${progress.failedStepSummary || progress.failedStepText || "Failed"}`
      );
    }
    lines.push("");
  }
  lines.push("Summary");
  lines.push(`- Happy path: ${s.happyPassed ? "PASSED" : "FAILED"}`);
  if ((s.positiveTotal ?? 0) > 0) {
    lines.push(
      `- Positive scenarios: ${s.positivePassed ?? 0} passed, ${s.positiveFailed ?? 0} failed (${s.positiveTotal} total)`
    );
  }
  if (s.negativeTotal > 0) {
    lines.push(`- Negative scenarios: ${s.negativePassed} passed, ${s.negativeFailed} failed (${s.negativeTotal} total)`);
  } else if ((s.positiveTotal ?? 0) === 0) {
    lines.push("- Extra scenarios: (none in this run — enable scenario checks on run)");
  }
  lines.push(`- Checks total: ${s.total} (${s.passedCount} passed, ${s.failedCount} failed)`);
  lines.push("");
  lines.push("Per-check results");
  for (const c of report.cases) {
    const tag =
      c.kind === "negative" ? "NEGATIVE" : c.kind === "positive" ? "POSITIVE" : "HAPPY PATH";
    lines.push(`[${c.passed ? "PASS" : "FAIL"}] [${tag}] ${c.title}`);
    if (!c.passed) {
      const plain = c.plainSummary || c.errorMessage;
      if (plain) lines.push(`  What went wrong: ${plain.replace(/\s+/g, " ").trim()}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("Use the FAIL lines above when filing a bug.");
  return lines.join("\n");
}

type FriendlyFailureProgress = {
  totalSteps: number | null;
  failedAtStepNumber: number | null;
  failedStepText: string | null;
  completedSteps: { number: number; text: string; summary?: string }[];
  failedStepSummary?: string | null;
  note: string;
};

type FriendlyFailure = {
  headline: string;
  stepSummary: string;
  stepNumber: number | null;
  flowStepText: string | null;
  scriptCommentLabel?: string | null;
  whatHappened: string;
  suggestions: string[];
  progress?: FriendlyFailureProgress;
  technical: { failureLine: number | null; waitingFor: string | null; errorSnippet: string | null };
  oneLineSummary: string;
};

type Flow = {
  id: string;
  name: string;
  steps: string[];
  baseUrl?: string;
  lastResult: {
    passed: boolean;
    at: string;
    failureSummary?: string;
    reportSummary?: FlowRunReportShape["summary"];
  } | null;
};

type RunRow = {
  id: string;
  timestamp: string;
  summary?: { passed?: number; failed?: number; total?: number };
};

const scopes = [
  { id: "navigation", label: "Navigation" },
  { id: "forms", label: "Forms" },
  { id: "buttons", label: "Buttons" },
  { id: "links", label: "Links" },
  { id: "accessibility", label: "A11y" },
];

const LS_ACTIVITY_HEIGHT = "qa-genie-activity-height-px";
const ACTIVITY_H_MIN = 120;
const ACTIVITY_H_DEFAULT = 280;
const ACTIVITY_H_MAX_RATIO = 0.72;

function clampActivityHeight(px: number) {
  if (typeof window === "undefined") return Math.max(ACTIVITY_H_MIN, Math.min(480, px));
  const cap = Math.floor(window.innerHeight * ACTIVITY_H_MAX_RATIO);
  return Math.max(ACTIVITY_H_MIN, Math.min(cap, px));
}

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("scan");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [logOpen, setLogOpen] = useState(true);
  const [activityHeightPx, setActivityHeightPx] = useState(ACTIVITY_H_DEFAULT);
  const [activityResizing, setActivityResizing] = useState(false);
  const activityHeightRef = useRef(ACTIVITY_H_DEFAULT);
  const resizeDrag = useRef<{ pointerId: number; startY: number; startH: number } | null>(null);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activityHeightRef.current = activityHeightPx;
  }, [activityHeightPx]);

  useEffect(() => {
    try {
      const raw = parseInt(localStorage.getItem(LS_ACTIVITY_HEIGHT) || "", 10);
      if (Number.isFinite(raw)) setActivityHeightPx(clampActivityHeight(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onResize = () => setActivityHeightPx((h) => clampActivityHeight(h));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const appendLog = useCallback((entry: LogLine) => {
    setLogs((prev) => [...prev.slice(-400), entry]);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data) as LogLine;
        if (d.message) appendLog(d);
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [appendLog]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const persistActivityHeight = useCallback(() => {
    try {
      localStorage.setItem(LS_ACTIVITY_HEIGHT, String(activityHeightRef.current));
    } catch {
      /* ignore */
    }
  }, []);

  const onActivityResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!logOpen) return;
      e.preventDefault();
      resizeDrag.current = { pointerId: e.pointerId, startY: e.clientY, startH: activityHeightRef.current };
      setActivityResizing(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [logOpen]
  );

  const onActivityResizePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = resizeDrag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const next = Math.round(d.startH + (d.startY - e.clientY));
    setActivityHeightPx(clampActivityHeight(next));
  }, []);

  const endActivityResize = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = resizeDrag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      resizeDrag.current = null;
      setActivityResizing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      persistActivityHeight();
    },
    [persistActivityHeight]
  );

  return (
    <div className="relative flex h-svh max-h-svh flex-col overflow-hidden bg-app-grid">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-transparent to-transparent" />

      <header className="relative z-10 shrink-0 border-b border-white/[0.06] bg-zinc-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-200/90">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              Gemini + Playwright
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">QA Genie</h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Scan a site, write flows in plain English, and let AI draft checks — built for manual testers who want speed
              without living in code.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="flex flex-wrap gap-2"
          >
            <HealthPill />
          </motion.div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-4 sm:px-6 lg:px-8">
          {(
            [
              { id: "scan" as const, label: "URL scan", icon: Radar },
              { id: "flows" as const, label: "Flows", icon: Workflow },
              { id: "regression" as const, label: "Runs", icon: History },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={clsx(
                "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                tab === id ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab === id && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl bg-white/[0.08] shadow-glow ring-1 ring-indigo-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-80" />
                {label}
              </span>
            </button>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <AnimatePresence mode="wait">
            {tab === "scan" && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="min-h-0"
              >
                <ScanPanel appendLog={appendLog} />
              </motion.div>
            )}
            {tab === "flows" && (
              <motion.div
                key="flows"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="min-h-0"
              >
                <FlowsPanel appendLog={appendLog} />
              </motion.div>
            )}
            {tab === "regression" && (
              <motion.div
                key="regression"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="min-h-0"
              >
                <RegressionPanel appendLog={appendLog} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Activity panel — height saved to localStorage; drag top edge to resize */}
      <aside
        style={{ height: logOpen ? activityHeightPx : 48 }}
        className={clsx(
          "relative z-40 flex shrink-0 flex-col border-t border-white/10 bg-zinc-950/95 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
          !activityResizing && "transition-[height] duration-200 ease-out"
        )}
      >
        {logOpen ? (
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize activity panel"
            onPointerDown={onActivityResizePointerDown}
            onPointerMove={onActivityResizePointerMove}
            onPointerUp={endActivityResize}
            onPointerCancel={endActivityResize}
            onLostPointerCapture={() => {
              if (!resizeDrag.current) return;
              resizeDrag.current = null;
              setActivityResizing(false);
              persistActivityHeight();
            }}
            className={clsx(
              "group flex h-2 shrink-0 cursor-ns-resize items-center justify-center border-b border-transparent hover:border-indigo-500/25",
              activityResizing && "border-indigo-500/40 bg-indigo-500/10"
            )}
          >
            <span className="h-1 w-12 rounded-full bg-white/15 transition-colors group-hover:bg-indigo-400/50 group-active:bg-indigo-400/70" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setLogOpen((o) => !o)}
          className="flex h-12 w-full shrink-0 items-center justify-between px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
        >
          <span className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Activity
            <Activity className="h-3.5 w-3.5 text-emerald-400/80" />
          </span>
          <ChevronRight className={clsx("h-4 w-4 transition-transform", logOpen && "rotate-90")} />
        </button>
        {logOpen ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-3 font-mono text-[11px] leading-relaxed [-webkit-overflow-scrolling:touch]">
            {logs.length === 0 ? (
              <p className="text-slate-600">Logs from scans and flow runs appear here in real time.</p>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  className={clsx(
                    "border-b border-white/[0.04] py-1",
                    l.level === "error" && "text-rose-300",
                    l.level === "success" && "text-emerald-300",
                    l.level === "step" && "text-sky-300",
                    (!l.level || l.level === "info") && "text-slate-500"
                  )}
                >
                  {l.message}
                </div>
              ))
            )}
            <div ref={logEnd} />
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function HealthPill() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    api<{ ok: boolean; gemini: boolean }>("/api/health")
      .then((h) => setOk(Boolean(h.ok && h.gemini)))
      .catch(() => setOk(false));
  }, []);
  if (ok === null) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking API…
      </span>
    );
  }
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
      )}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {ok ? "API & Gemini ready" : "API up — check GEMINI_API_KEY"}
    </span>
  );
}

function ScanPanel({ appendLog }: { appendLog: (l: LogLine) => void }) {
  const [url, setUrl] = useState("");
  const [scope, setScope] = useState<string[]>(scopes.map((s) => s.id));
  const [busy, setBusy] = useState(false);
  const [cases, setCases] = useState<unknown[] | null>(null);
  const [results, setResults] = useState<unknown[] | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const toggle = (id: string) => {
    setScope((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const run = async () => {
    if (!url.trim()) {
      appendLog({ message: "Enter a URL to scan.", level: "error" });
      return;
    }
    setBusy(true);
    setCases(null);
    setResults(null);
    setWarn(null);
    appendLog({ message: "Starting URL scan…", level: "step" });
    try {
      const data = await api<{
        testCases: unknown[];
        results: { name?: string; passed: boolean; error?: string }[];
        aiWarning?: string | null;
        aiSource?: string;
      }>("/api/scan", { method: "POST", json: { url: url.trim(), scope } });
      setCases(data.testCases);
      setResults(data.results);
      if (data.aiWarning) setWarn(data.aiWarning);
      appendLog({
        message: data.aiWarning ? data.aiWarning : "Scan finished.",
        level: data.aiWarning ? "error" : "success",
      });
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <h2 className="text-lg font-semibold text-white">Scan a site</h2>
        <p className="mt-1 text-sm text-slate-500">
          MCP explores the live site, plans 6–10 E2E scenarios, generates Playwright tests, and runs them automatically.
        </p>
        <label className="mt-6 block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.com"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none ring-indigo-500/0 transition focus:border-indigo-500/40 focus:ring-4"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          {scopes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={clsx(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                scope.includes(s.id)
                  ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-100"
                  : "border-white/10 bg-white/[0.03] text-slate-500 hover:border-white/20"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <motion.button
          type="button"
          disabled={busy}
          onClick={run}
          whileTap={{ scale: 0.98 }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          Run scan
        </motion.button>
      </Card>

      <Card className="lg:col-span-3">
        <h2 className="text-lg font-semibold text-white">Results</h2>
        {warn && (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">{warn}</p>
        )}
        {!cases && !busy && <p className="mt-4 text-sm text-slate-500">Run a scan to see generated cases and pass/fail.</p>}
        {busy && (
          <div className="mt-8 flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm">Exploring site (MCP) → generating Playwright suite → running E2E…</p>
          </div>
        )}
        {cases && (
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {cases.map((c, i) => {
              const tc = c as { id?: string; name?: string; steps?: string[]; assertion?: string };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                >
                  <div className="font-medium text-slate-200">
                    {tc.id} · {tc.name}
                  </div>
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                    {(tc.steps || []).slice(0, 5).map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        )}
        {results && results.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-slate-500">
                <tr>
                  <th className="p-3 font-medium">Test</th>
                  <th className="p-3 font-medium">Result</th>
                  <th className="p-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const row = r as { name?: string; passed: boolean; error?: string };
                  return (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0">
                      <td className="p-3 text-slate-300">{row.name}</td>
                      <td className="p-3">
                        {row.passed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400">
                            <XCircle className="h-3.5 w-3.5" /> Fail
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs truncate p-3 text-slate-500">{row.error || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FlowsPanel({ appendLog }: { appendLog: (l: LogLine) => void }) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [edge, setEdge] = useState<unknown[] | null>(null);
  const [includeNegativeRun, setIncludeNegativeRun] = useState(false);
  const [lastRun, setLastRun] = useState<{
    passed: boolean;
    output: string;
    friendlyFailure: FriendlyFailure | null;
    report: FlowRunReportShape | null;
    flowName: string;
    specPath?: string | null;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");

  const load = useCallback(() => {
    api<Flow[]>("/api/flows").then(setFlows).catch(() => setFlows([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_BASE_URL);
      if (v) setBaseUrl(v);
      const n = localStorage.getItem(LS_INCLUDE_NEGATIVE);
      if (n === "0") setIncludeNegativeRun(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const t = baseUrl.trim();
      if (t) localStorage.setItem(LS_BASE_URL, t);
    } catch {
      /* ignore */
    }
  }, [baseUrl]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_INCLUDE_NEGATIVE, includeNegativeRun ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [includeNegativeRun]);

  const save = async () => {
    const lines = steps.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || !lines.length) {
      appendLog({ message: "Add a flow name and steps.", level: "error" });
      return;
    }
    setBusy(true);
    try {
      await api("/api/flows", {
        method: "POST",
        json: {
          name: name.trim(),
          steps: lines,
          ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
        },
      });
      setName("");
      setSteps("");
      appendLog({ message: "Flow saved.", level: "success" });
      load();
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    } finally {
      setBusy(false);
    }
  };

  const copyRunReport = useCallback(async () => {
    if (!lastRun?.report) return;
    const text = formatBugReportText(
      lastRun.flowName,
      lastRun.report,
      lastRun.passed,
      lastRun.friendlyFailure?.progress ?? null
    );
    try {
      await navigator.clipboard.writeText(text);
      appendLog({ message: "Run report copied — paste into your bug tracker or email.", level: "success" });
    } catch {
      appendLog({ message: "Could not copy to clipboard from this page.", level: "error" });
    }
  }, [lastRun, appendLog]);

  const runOne = async (id: string) => {
    const override = baseUrl.trim();
    const flowMeta = flows.find((x) => x.id === id);
    setBusy(true);
    setLastRun(null);
    appendLog({
      message: `Running flow ${id}${includeNegativeRun ? " (happy path + positive & negative scenarios)" : " (happy path only)"}…`,
      level: "step",
    });
    try {
      const r = await api<{
        passed: boolean;
        output?: string;
        friendlyFailure?: FriendlyFailure | null;
        report?: FlowRunReportShape | null;
        specPath?: string | null;
      }>(`/api/flows/${id}/run`, {
        method: "POST",
        json: {
          ...(override ? { baseUrl: override } : {}),
          includeNegativeTests: includeNegativeRun,
        },
      });
      setLastRun({
        passed: r.passed,
        output: (r.output || "").slice(0, 8000),
        friendlyFailure: r.friendlyFailure ?? null,
        report: r.report ?? null,
        flowName: flowMeta?.name || id,
        specPath: r.specPath ?? null,
      });
      const rs = r.report?.summary;
      const tail =
        rs && rs.negativeTotal > 0
          ? ` Happy: ${rs.happyPassed ? "ok" : "fail"} · Negatives: ${rs.negativePassed}/${rs.negativeTotal} ok.`
          : "";
      appendLog({
        message: (r.passed ? "Flow run passed." : r.friendlyFailure?.oneLineSummary || "Flow run failed.") + tail,
        level: r.passed ? "success" : "error",
      });
      load();
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    } finally {
      setBusy(false);
    }
  };

  const runAll = async () => {
    const override = baseUrl.trim();
    setBusy(true);
    appendLog({ message: "Running all flows…", level: "step" });
    try {
      await api("/api/flows/run", { method: "POST", json: override ? { baseUrl: override } : {} });
      appendLog({ message: "All flows finished.", level: "success" });
      load();
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    } finally {
      setBusy(false);
    }
  };

  const suggestEdge = async () => {
    if (!steps.trim()) return;
    try {
      const r = await api<{ edgeCases: unknown[] }>("/api/flows/edge-cases", {
        method: "POST",
        json: { description: steps },
      });
      setEdge(r.edgeCases);
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    }
  };

  const del = async (id: string) => {
    await api(`/api/flows/${id}`, { method: "DELETE" });
    if (editingId === id) {
      setEditingId(null);
      setEditName("");
      setEditSteps("");
    }
    load();
  };

  const startEdit = (f: Flow) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditSteps(f.steps.join("\n"));
    setEditBaseUrl(f.baseUrl || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditSteps("");
    setEditBaseUrl("");
  };

  const saveEdit = async (id: string) => {
    const lines = editSteps.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (!editName.trim() || !lines.length) {
      appendLog({ message: "Name and at least one step are required.", level: "error" });
      return;
    }
    setBusy(true);
    try {
      await api(`/api/flows/${id}`, {
        method: "PUT",
        json: {
          name: editName.trim(),
          steps: lines,
          baseUrl: editBaseUrl.trim(),
        },
      });
      appendLog({ message: "Flow updated.", level: "success" });
      cancelEdit();
      load();
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    } finally {
      setBusy(false);
    }
  };

  const downloadScript = async (id: string) => {
    const base = baseUrl.trim() || "https://example.com";
    const r = await api<{ code: string }>(`/api/flows/${id}/script`, { method: "POST", json: { baseUrl: base } });
    const blob = new Blob([r.code], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qa-genie-${id}.spec.js`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-semibold text-white">New flow</h2>
        <p className="mt-1 text-sm text-slate-500">
          One action per line — plain English. For flaky steps, add a Playwright locator:{" "}
          <span className="font-mono text-slate-400">
            Click Save &gt;&gt; getByRole(&apos;button&apos;, &#123; name: /save/i &#125;)
          </span>
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Flow name"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40"
        />
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={7}
          placeholder={"Go to /login\nClick Create account\n…"}
          className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500/40"
        />
        <label className="mt-3 block space-y-1">
          <span className="text-xs text-slate-500">
            Default base URL (saved to this browser; also stored on each flow when you Save / Edit)
          </span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://dev.yourapp.com"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <motion.button
            type="button"
            disabled={busy}
            whileTap={{ scale: 0.98 }}
            onClick={save}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Save flow
          </motion.button>
          <button
            type="button"
            onClick={suggestEdge}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            AI edge cases
          </button>
        </div>
        {edge && edge.length > 0 && (
          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-400">
            {edge.map((x, i) => (
              <div key={i} className="border-b border-white/5 pb-2 last:border-0">
                {(x as { name?: string }).name}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Saved flows</h2>
            <label className="mt-2 flex max-w-xl cursor-pointer items-start gap-2 text-xs leading-relaxed text-slate-400">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-white/20 bg-black/40 text-indigo-500"
                checked={includeNegativeRun}
                onChange={(e) => setIncludeNegativeRun(e.target.checked)}
              />
              <span>
                When checked, <span className="text-slate-300">Run</span> also generates extra positive and negative
                Playwright scenarios (~5–10 tests total). Leave unchecked for{" "}
                <span className="text-slate-300">happy path only</span> (recommended while tuning a new flow).{" "}
                <span className="text-slate-500">Run all</span> always runs happy paths only. While a test runs, open{" "}
                <span className="text-slate-300">Activity</span> — live lines show each click and URL (
                <span className="font-mono text-slate-500">graciousgarage.com/…</span>).
              </span>
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={runAll}
            className="shrink-0 self-start rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-50"
          >
            Run all
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {flows.map((f) => (
            <motion.li
              key={f.id}
              layout
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition hover:border-indigo-500/20"
            >
              {editingId === f.id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Edit flow</span>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300"
                      aria-label="Cancel edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
                  />
                  <textarea
                    value={editSteps}
                    onChange={(e) => setEditSteps(e.target.value)}
                    rows={6}
                    className="w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500/40"
                  />
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">Base URL for this flow</span>
                    <input
                      value={editBaseUrl}
                      onChange={(e) => setEditBaseUrl(e.target.value)}
                      placeholder="https://dev.yourapp.com (leave empty to clear)"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/40"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => saveEdit(f.id)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={cancelEdit}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-100">{f.name}</div>
                      {f.baseUrl ? (
                        <div className="mt-0.5 font-mono text-[10px] text-indigo-400/90">Base: {f.baseUrl}</div>
                      ) : null}
                      <div className="mt-1 line-clamp-2 font-mono text-[11px] text-slate-500">{f.steps.join(" · ")}</div>
                    </div>
                    <span
                      className={clsx(
                        "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                        f.lastResult == null ? "bg-slate-600" : f.lastResult.passed ? "bg-emerald-500" : "bg-rose-500"
                      )}
                      title={
                        f.lastResult?.failureSummary ||
                        (f.lastResult == null ? "Not run yet" : f.lastResult.passed ? "Last run passed" : "Last run failed")
                      }
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || editingId !== null}
                      onClick={() => startEdit(f)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runOne(f.id)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      Run
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadScript(f.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                    >
                      <Download className="h-3 w-3" /> Script
                    </button>
                    <button type="button" onClick={() => del(f.id)} className="text-xs text-rose-400/80 hover:text-rose-300">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </motion.li>
          ))}
        </ul>
        {lastRun && (
          <div className="mt-4 space-y-3">
            {lastRun.report ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Run report</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{lastRun.flowName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      <span className="text-emerald-400/90">{lastRun.report.summary.passedCount} passed</span>
                      <span className="text-slate-600"> · </span>
                      <span className="text-rose-400/90">{lastRun.report.summary.failedCount} failed</span>
                      <span className="text-slate-600"> · </span>
                      {lastRun.report.summary.total} checks total
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Happy path: {lastRun.report.summary.happyPassed ? "passed" : "failed"}
                      {(lastRun.report.summary.positiveTotal ?? 0) > 0
                        ? ` · Positive: ${lastRun.report.summary.positivePassed}/${lastRun.report.summary.positiveTotal}`
                        : null}
                      {lastRun.report.summary.negativeTotal > 0
                        ? ` · Negative: ${lastRun.report.summary.negativePassed}/${lastRun.report.summary.negativeTotal}`
                        : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyRunReport()}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy for bug report
                  </button>
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-white/[0.06]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 border-b border-white/10 bg-zinc-950/95 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="p-2.5 font-medium">Type</th>
                        <th className="p-2.5 font-medium">Test</th>
                        <th className="p-2.5 font-medium">Result</th>
                        <th className="p-2.5 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastRun.report.cases.map((c, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-0">
                          <td className="whitespace-nowrap p-2.5 text-slate-500">
                            {c.kind === "negative" ? (
                              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-200">Negative</span>
                            ) : c.kind === "positive" ? (
                              <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] text-violet-200">Positive</span>
                            ) : (
                              <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-200">Happy path</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-200">{c.title}</td>
                          <td className="p-2.5">
                            {c.passed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400">
                                <XCircle className="h-3.5 w-3.5" /> Fail
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-400">
                            {c.passed ? (
                              <span className="text-slate-600">—</span>
                            ) : (
                              <span className="text-xs leading-relaxed">
                                {c.plainSummary || "See technical log below."}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!lastRun.passed && lastRun.report.summary.happyPassed && lastRun.report.summary.negativeFailed > 0 ? (
                  <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/25 px-3 py-2 text-xs text-amber-100">
                    The main happy path passed, but one or more negative checks failed. The product may still mishandle
                    invalid input — use the table and “Copy for bug report” when filing issues.
                  </p>
                ) : null}
                {!lastRun.passed ? (
                  <details className="mt-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                    <summary className="cursor-pointer text-xs text-slate-500">Technical log (for developers)</summary>
                    <motion.div className="mt-2 space-y-2">
                      {lastRun.report.cases
                        .filter((c) => !c.passed && c.errorMessage)
                        .map((c, j) => (
                          <p
                            key={`${c.title}-${j}`}
                            className="font-mono text-[10px] leading-relaxed text-slate-500 break-words"
                          >
                            <span className="text-slate-400">{c.title}: </span>
                            {c.errorMessage}
                          </p>
                        ))}
                    </motion.div>
                  </details>
                ) : null}
              </div>
            ) : null}
            {lastRun.passed ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/35 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-medium text-white">This flow finished successfully</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {lastRun.report && lastRun.report.summary.total > 1
                      ? `All ${lastRun.report.summary.total} checks passed (happy path${(lastRun.report.summary.positiveTotal ?? 0) > 0 ? ", positive" : ""}${lastRun.report.summary.negativeTotal > 0 ? ", negative" : ""} scenarios).`
                      : "The automated browser completed the generated test without errors."}
                  </p>
                </div>
              </div>
            ) : lastRun.friendlyFailure ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-4 text-sm">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                  <div className="min-w-0 space-y-2">
                    <p className="font-semibold text-white leading-snug">{lastRun.friendlyFailure.headline}</p>
                    {lastRun.friendlyFailure.progress ? (
                      <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-xs leading-relaxed text-slate-300">
                        <p className="font-medium text-slate-100">Where you got to</p>
                        {lastRun.friendlyFailure.progress.completedSteps.length > 0 ? (
                          <ol className="mt-2 list-decimal space-y-1.5 pl-4 marker:text-emerald-500/90">
                            {lastRun.friendlyFailure.progress.completedSteps.map((s) => (
                              <li key={s.number} className="pl-1 text-emerald-100/90">
                                <span className="text-emerald-400/80">✓ </span>
                                {s.summary || s.text}
                              </li>
                            ))}
                          </ol>
                        ) : lastRun.friendlyFailure.progress.failedAtStepNumber === 1 ? (
                          <p className="mt-2 text-slate-500">No earlier checklist steps were completed before the failure.</p>
                        ) : null}
                        {lastRun.friendlyFailure.progress.failedAtStepNumber != null ? (
                          <p className="mt-3 border-t border-white/10 pt-2 font-medium text-rose-200/95">
                            <span className="text-rose-400/80">✗ </span>
                            Failed at step {lastRun.friendlyFailure.progress.failedAtStepNumber}
                            {lastRun.friendlyFailure.progress.totalSteps != null
                              ? ` of ${lastRun.friendlyFailure.progress.totalSteps}`
                              : ""}
                            {lastRun.friendlyFailure.progress.failedStepSummary ? (
                              <span className="mt-1 block font-normal text-slate-200">
                                {lastRun.friendlyFailure.progress.failedStepSummary}
                              </span>
                            ) : lastRun.friendlyFailure.progress.failedStepText ? (
                              <span className="mt-1 block font-normal text-slate-300">
                                {lastRun.friendlyFailure.progress.failedStepText}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                        <p className="mt-2 text-[11px] text-slate-500">{lastRun.friendlyFailure.progress.note}</p>
                      </div>
                    ) : null}
                    <p className="text-slate-200 leading-relaxed">{lastRun.friendlyFailure.stepSummary}</p>
                    <p className="text-slate-400 leading-relaxed">{lastRun.friendlyFailure.whatHappened}</p>
                    {lastRun.friendlyFailure.suggestions.length > 0 ? (
                      <div className="pt-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">What you can try</p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-300">
                          {lastRun.friendlyFailure.suggestions.map((s, i) => (
                            <li key={i} className="leading-relaxed">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
                This run did not pass. Open Technical details for the raw browser log.
              </div>
            )}
            {lastRun.output.trim().length > 0 ||
            (lastRun.friendlyFailure &&
              (lastRun.friendlyFailure.technical.errorSnippet || lastRun.friendlyFailure.technical.waitingFor)) ? (
              <details className="group rounded-lg border border-white/10 bg-black/20">
                <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200">
                  Technical details (for developers)
                </summary>
                <div className="space-y-2 border-t border-white/5 px-3 py-2">
                  {lastRun.friendlyFailure?.technical.errorSnippet ? (
                    <p className="font-mono text-[10px] leading-relaxed text-slate-500 break-words">
                      {lastRun.friendlyFailure.technical.errorSnippet}
                    </p>
                  ) : null}
                  {lastRun.friendlyFailure?.technical.waitingFor ? (
                    <p className="font-mono text-[10px] leading-relaxed text-slate-600 break-words">
                      Waiting for: {lastRun.friendlyFailure.technical.waitingFor}
                    </p>
                  ) : null}
                  {lastRun.friendlyFailure?.technical.waitingFor?.includes("navigation") ? (
                    <p className="text-[11px] leading-relaxed text-amber-200/95">
                      That locator is from an old generated script. Restart the backend, click Run again (each run
                      creates a new file). The updated script uses{" "}
                      <span className="font-mono text-slate-300">clickTopNavLink(page, &apos;Decor&apos;)</span>, not{" "}
                      <span className="font-mono text-slate-300">getByRole(&apos;navigation&apos;)</span>.
                    </p>
                  ) : null}
                  {lastRun.specPath ? (
                    <p className="font-mono text-[10px] text-slate-600 truncate" title={lastRun.specPath}>
                      Script: {lastRun.specPath.replace(/^.*[/\\]/, "")}
                    </p>
                  ) : null}
                  {lastRun.output.trim().length > 0 ? (
                    <pre className="max-h-52 overflow-auto rounded-md bg-black/30 p-3 font-mono text-[10px] leading-relaxed text-slate-500">
                      {lastRun.output}
                    </pre>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}

function RegressionPanel({ appendLog }: { appendLog: (l: LogLine) => void }) {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [url, setUrl] = useState("");
  const [scan, setScan] = useState(true);
  const [fl, setFl] = useState(true);
  const [snapUrl, setSnapUrl] = useState("");
  const [snapId, setSnapId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<RunRow[]>("/api/regression/history").then(setRuns).catch(() => setRuns([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runReg = async () => {
    setBusy(true);
    appendLog({ message: "Running regression…", level: "step" });
    try {
      await api("/api/regression/run", {
        method: "POST",
        json: { url: url.trim() || undefined, includeUrlScan: scan, includeFlows: fl },
      });
      appendLog({ message: "Regression complete.", level: "success" });
      load();
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    } finally {
      setBusy(false);
    }
  };

  const snapshot = async () => {
    if (!snapUrl.trim()) return;
    try {
      const r = await api<{ snapshotId: string }>("/api/regression/snapshot", {
        method: "POST",
        json: { url: snapUrl.trim() },
      });
      setSnapId(r.snapshotId);
      appendLog({ message: `Snapshot: ${r.snapshotId}`, level: "success" });
    } catch (e) {
      appendLog({ message: (e as Error).message, level: "error" });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-semibold text-white">Full regression</h2>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL for scan (optional)"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40"
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={scan} onChange={(e) => setScan(e.target.checked)} className="rounded border-white/20" />
          Include URL scan
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={fl} onChange={(e) => setFl(e.target.checked)} className="rounded border-white/20" />
          Include saved flows
        </label>
        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.98 }}
          onClick={runReg}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Run regression"}
        </motion.button>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Snapshots & history</h2>
        <div className="mt-4 flex gap-2">
          <input
            value={snapUrl}
            onChange={(e) => setSnapUrl(e.target.value)}
            placeholder="URL for snapshot"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
          />
          <button type="button" onClick={snapshot} className="rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-300">
            Save
          </button>
        </div>
        {snapId && <p className="mt-2 font-mono text-xs text-indigo-300">Snapshot id: {snapId}</p>}
        <div className="mt-6 max-h-64 space-y-2 overflow-y-auto">
          {runs.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs">
              <span className="truncate font-mono text-slate-400">{r.id}</span>
              <span className="shrink-0 text-slate-500">
                {r.summary?.passed ?? 0}/{r.summary?.total ?? 0} ok
              </span>
              <a
                href={`/api/regression/export/${r.id}?format=markdown`}
                className="shrink-0 text-indigo-400 hover:text-indigo-300"
              >
                MD
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-card backdrop-blur-md",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
