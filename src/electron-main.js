import { app, BrowserWindow, Menu, shell } from "electron";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execSync } from "node:child_process";
import net from "node:net";
import { startServer } from "./server.js";

let mainWindow = null;
let httpServer = null;
let copulaProcess = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the Copula engine root — portable‑safe relative path
function copulaDir() {
  // In dev:  <repo>/omega-copula-engine
  // In dist: resources/app.asar  → walk up to repo root
  let candidate = join(__dirname, "..", "..", "omega-copula-engine");
  // If we're inside an asar the hierarchy is different — try one level up
  if (candidate.includes("app.asar")) {
    candidate = join(dirname(process.resourcesPath), "omega-copula-engine");
  }
  return candidate;
}

function copulaPython() {
  return join(copulaDir(), "venv", "Scripts", "python.exe");
}

function copulaMain() {
  return join(copulaDir(), "main.py");
}

// ── Port probe ──────────────────────────────────────────────
function checkPortInUse(port, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("error", (err) => {
      socket.destroy();
      if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") resolve(false);
      else reject(err);
    });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

// ── Launch Copula service ───────────────────────────────────
async function startCopulaService() {
  const port = 8000;
  const inUse = await checkPortInUse(port);
  if (inUse) {
    console.log("[copula] port 8000 already in use — reusing");
    return;
  }
  const pythonExe = copulaPython();
  const mainScript = copulaMain();
  console.log(`[copula] starting: ${pythonExe} ${mainScript}`);
  copulaProcess = spawn(pythonExe, [mainScript], {
    cwd: copulaDir(),
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    windowsHide: true,
  });
  copulaProcess.stdout.on("data", (data) => {
    console.log(`[copula:out] ${data.toString().trim()}`);
  });
  copulaProcess.stderr.on("data", (data) => {
    console.log(`[copula:err] ${data.toString().trim()}`);
  });
  copulaProcess.on("error", (err) => {
    console.error("[copula] spawn error:", err.message);
  });
  copulaProcess.on("exit", (code, signal) => {
    console.log(`[copula] exited code=${code} signal=${signal}`);
    copulaProcess = null;
  });

  // Wait for port to become ready (max 15 s)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await checkPortInUse(port)) {
      console.log("[copula] ready on port 8000");
      return;
    }
  }
  console.error("[copula] WARNING: port 8000 not responding after 15 s");
}

// ── Kill Copula (process‑tree safe, cross‑platform) ─────────
function killCopulaProcess() {
  if (!copulaProcess) return;
  const pid = copulaProcess.pid;
  console.log(`[copula] killing process tree pid=${pid}`);
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
    } else {
      // detached:true → child is group leader → -pid kills whole tree
      try { process.kill(-pid, "SIGKILL"); } catch {}
      // fallback: direct kill in case process group is already gone
      try { copulaProcess.kill("SIGKILL"); } catch {}
    }
  } catch (e) {
    console.log("[copula] kill note:", e.message);
  }
  copulaProcess = null;
}

// ── Tavily key ──────────────────────────────────────────────
async function readTavilyApiKey() {
  if (process.env.TAVILY_API_KEY) return process.env.TAVILY_API_KEY.trim();
  const secretPath = join(app.getPath("home"), ".codex", "secrets", "tavily_api_key.txt");
  try {
    return (await readFile(secretPath, "utf8")).trim();
  } catch {
    return "";
  }
}

// ── Window creation ─────────────────────────────────────────
async function createWindow() {
  const tavilyApiKey = await readTavilyApiKey();
  const started = await startServer({
    port: 0,
    tavilyApiKey,
    stateFile: join(app.getPath("userData"), "workbench-state.json"),
  });
  httpServer = started.server;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    title: "World Cup V3.2 Workbench",
    backgroundColor: "#f7f8f5",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  await mainWindow.loadURL(`http://127.0.0.1:${started.port}/`);
}

// ── App lifecycle ───────────────────────────────────────────
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  await startCopulaService();  // auto‑launch Copula engine
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// CRITICAL: prevent zombie processes on quit
app.on("before-quit", () => {
  if (httpServer?.listening) {
    httpServer.close();
  }
  killCopulaProcess();
});

app.on("will-quit", () => {
  killCopulaProcess();  // double‑tap for safety
});
