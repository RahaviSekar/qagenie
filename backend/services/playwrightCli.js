const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { log } = require("./logEmitter");
const { tryParsePlaywrightJsonReport, extractTestsFromPlaywrightJson } = require("./playwrightJsonReport");

const projectRoot = path.join(__dirname, "..", "..");

/** Wall-clock cap for the whole `npx playwright test` process (browser + test). */
function getRunTimeoutMs() {
  const n = Number(process.env.PLAYWRIGHT_RUN_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 180_000;
}

/** Passed to Playwright as --timeout (per-test, ms). */
function getTestTimeoutMs() {
  const n = Number(process.env.PLAYWRIGHT_TEST_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 120_000;
}

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    exec(`taskkill /PID ${pid} /T /F`, () => {});
  } else {
    try {
      process.kill(-pid, "SIGKILL");
    } catch (_) {
      try {
        process.kill(pid, "SIGKILL");
      } catch (_) {}
    }
  }
}

/**
 * Runs one spec file via Playwright CLI. Always resolves (never hangs past runTimeout).
 * @param {string} specPath
 * @param {{ maxFailures?: number, jsonReport?: boolean }} [opts]
 */
function runPlaywrightSpec(specPath, opts = {}) {
  const maxFailures = opts.maxFailures != null ? opts.maxFailures : 1;
  const jsonReport = Boolean(opts.jsonReport);
  const runTimeoutMs = getRunTimeoutMs();
  const testTimeoutMs = getTestTimeoutMs();

  return new Promise((resolve) => {
    const outChunks = [];
    const errChunks = [];
    let settled = false;
    let timer;
    const done = (payload) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(payload);
    };

    const resolved = path.resolve(specPath);
    const rel = path.relative(projectRoot, resolved).split(path.sep).join("/");
    if (!rel || rel.startsWith("..")) {
      done({
        passed: false,
        exitCode: 2,
        output: `Invalid spec path outside project: ${specPath}`,
        timedOut: false,
        testRows: null,
      });
      return;
    }
    const testTarget = rel.includes(" ") ? `"${rel}"` : rel;
    const usePnpm = fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml"));
    const cmd = usePnpm ? "pnpm" : "npx";
    const reporterArg = jsonReport ? "--reporter=json" : "--reporter=line";
    const args = usePnpm
      ? ["exec", "playwright", "test", testTarget, reporterArg, `--timeout=${testTimeoutMs}`, `--max-failures=${maxFailures}`]
      : ["playwright", "test", testTarget, reporterArg, `--timeout=${testTimeoutMs}`, `--max-failures=${maxFailures}`];
    const proc = spawn(cmd, args, {
      cwd: projectRoot,
      shell: true,
      windowsHide: true,
    });

    timer = setTimeout(() => {
      log(`Playwright run exceeded ${runTimeoutMs}ms — stopping process tree.`, "error");
      try {
        proc.kill("SIGTERM");
      } catch (_) {}
      setTimeout(() => killProcessTree(proc.pid), 2000);
      done({
        passed: false,
        exitCode: 124,
        output:
          errChunks.join("") +
          outChunks.join("") +
          `\n\n[QA Genie] Aborted: exceeded PLAYWRIGHT_RUN_TIMEOUT_MS (${runTimeoutMs}ms). ` +
          `Increase in .env or simplify the flow. See PLAYWRIGHT_TEST_TIMEOUT_MS (currently ${testTimeoutMs}ms).`,
        timedOut: true,
        testRows: null,
      });
    }, runTimeoutMs);

    proc.stdout.on("data", (d) => {
      const t = d.toString();
      outChunks.push(t);
      if (!jsonReport) log(t.trimEnd(), "info");
    });
    proc.stderr.on("data", (d) => {
      const t = d.toString();
      errChunks.push(t);
      if (!jsonReport) log(t.trimEnd(), "error");
    });
    proc.on("close", (code) => {
      const stdout = outChunks.join("");
      const stderr = errChunks.join("");
      const combined = stderr + stdout;
      let testRows = null;
      if (jsonReport) {
        const parsed = tryParsePlaywrightJsonReport(stdout);
        testRows = extractTestsFromPlaywrightJson(parsed);
        if (testRows && testRows.length) {
          for (const row of testRows) {
            const ok = row.status === "passed" || row.status === "skipped";
            log(`${ok ? "✓" : "✘"} ${row.title}`, ok ? "success" : "error");
          }
        } else {
          log("Playwright JSON report could not be parsed; see combined output.", "error");
        }
      }
      done({
        passed: code === 0,
        exitCode: code,
        output: combined,
        timedOut: false,
        testRows,
      });
    });
    proc.on("error", (err) => {
      done({
        passed: false,
        exitCode: -1,
        output: errChunks.join("") + outChunks.join("") + String(err.message || err),
        timedOut: false,
        testRows: null,
      });
    });
  });
}

module.exports = { runPlaywrightSpec, getRunTimeoutMs, getTestTimeoutMs, projectRoot };
