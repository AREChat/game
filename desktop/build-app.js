"use strict";
// アプリに入れるファイルを、リポジトリ本体（../game など）から desktop/app/ にコピーする。
// コピー元は1か所だけ：ゲームを直したら、ここを通して exe にも反映されます。
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(__dirname, "app");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const items = ["game", "shared", "protect.js", "apple-touch-icon.png"];
for (const it of items) {
  const from = path.join(root, it);
  if (!fs.existsSync(from)) throw new Error("見つかりません: " + it);
  fs.cpSync(from, path.join(out, it), { recursive: true, filter: (p) => !/(^|[\\/])\.git([\\/]|$)/.test(p) });
}
// exe には要らないもの（ブラウザ用のインストール設定）
for (const f of ["game/sw.js", "game/manifest.webmanifest"]) fs.rmSync(path.join(out, f), { force: true });
const html = path.join(out, "game", "index.html");
let s = fs.readFileSync(html, "utf8");
s = s.replace(/<link rel="manifest"[^>]*>\r?\n?/, "");
fs.writeFileSync(html, s);
console.log("app/ を作りました：", items.join(", "));
