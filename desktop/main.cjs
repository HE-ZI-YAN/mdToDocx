const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, shell } = require("electron");

let backendServer = null;
let backendPort = null;

function resolvePath(...segments) {
  return path.join(__dirname, ...segments);
}

async function startBackendServer() {
  const backendEntry = resolvePath("..", "backend", "src", "index.js");
  const frontendDist = resolvePath("..", "frontend", "dist");

  process.env.TEMPLATE_STORAGE_DIR = path.join(app.getPath("userData"), "templates");

  const backendModule = await import(pathToFileURL(backendEntry).href);
  const { server, port } = await backendModule.startServer({
    host: "127.0.0.1",
    port: 0,
    serveFrontend: true,
    frontendDist
  });

  backendServer = server;
  backendPort = port;
}

async function stopBackendServer() {
  if (!backendServer) {
    return;
  }

  await new Promise((resolve) => {
    backendServer.close(() => resolve());
  });

  backendServer = null;
  backendPort = null;
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    title: "Markdown 转 Word 格式标准化工具",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://127.0.0.1:${backendPort}`);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await stopBackendServer();
});

app.whenReady().then(async () => {
  await startBackendServer();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});
