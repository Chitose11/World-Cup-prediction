import { app, BrowserWindow, Menu, shell } from "electron";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { startServer } from "./server.js";

let mainWindow = null;
let httpServer = null;

async function readTavilyApiKey() {
  if (process.env.TAVILY_API_KEY) return process.env.TAVILY_API_KEY.trim();
  const secretPath = join(app.getPath("home"), ".codex", "secrets", "tavily_api_key.txt");
  try {
    return (await readFile(secretPath, "utf8")).trim();
  } catch {
    return "";
  }
}

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

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
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

app.on("before-quit", () => {
  if (httpServer?.listening) {
    httpServer.close();
  }
});
