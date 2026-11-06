"use strict";
// ゲーム側（game/mode.js）に「いま exe の中です」と伝える。ゲームから使えるのは、この2つだけ。
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("areDesktop", {
  isDesktop: true,
  quit: () => ipcRenderer.send("are:quit"),
});
