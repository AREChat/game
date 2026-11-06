"use strict";
// ARE QUEST パソコン用アプリ（exe）。ゲーム本体は app/ の中身を、そのまま表示するだけです（通信は使いません）。
const { app, BrowserWindow, protocol, net, ipcMain, shell, Menu, session } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname, "app");
const DEV = process.env.ARE_DEV === "1";

// app://are/ を、ブラウザの https のページと同じ「安全な場所」として扱う（localStorage のセーブ、CSP の 'self' が動く）
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 640, minHeight: 360,
    backgroundColor: "#0b1020",
    title: "ARE QUEST",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      devTools: DEV,
      autoplayPolicy: "no-user-gesture-required",
    },
  });
  if (!DEV) Menu.setApplicationMenu(null);
  win.loadURL("app://are/game/index.html");
  // 外のサイトへのリンクは、アプリの中で開かず、ふだんのブラウザで開く（https のものだけ）
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("app://are/")) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); } });
  win.on("closed", () => { win = null; });
}

app.whenReady().then(() => {
  protocol.handle("app", (req) => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = path.normalize(path.join(ROOT, p));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return new Response("forbidden", { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  // カメラ・マイクなどの許可は出さない
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  createWindow();
});

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
ipcMain.on("are:quit", () => { app.quit(); });
app.on("window-all-closed", () => { app.quit(); });
