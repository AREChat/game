// ゲーム一覧（shared/games-registry.json）を検査して、ブラウザ用の shared/games-data.js を作る。
//   node tools/build-registry.js          … 作る
//   node tools/build-registry.js --check  … 検査だけ（古ければ失敗）
// 一覧の元データは games-registry.json の1か所だけ。ハブ・ジャンルページ・「ほかのゲームへ」・Go/Python/Kotlin/Swift/C#/Java の道具は、すべてこの JSON を読む。
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const jsonPath = path.join(root, "shared/games-registry.json"), outPath = path.join(root, "shared/games-data.js");
const raw = fs.readFileSync(jsonPath, "utf8");
const data = JSON.parse(raw);
const errs = [];
const L = data.langs;
const GENRE_IDS = new Set(data.genres.map((g) => g.id));
function need4(obj, where){
  if(!obj || typeof obj !== "object"){ errs.push(where + ": 4言語の表がない"); return; }
  for(const l of L){
    const v = obj[l];
    if(Array.isArray(v)){ if(!v.length || v.some((s) => typeof s !== "string" || !s.trim())) errs.push(where + "." + l + ": 空の項目"); }
    else if(typeof v !== "string" || !v.trim()) errs.push(where + "." + l + ": 空");
  }
}
const ids = new Set();
for(const g of data.genres){
  for(const k of ["name", "blurb"]) need4(g[k], "genre " + g.id + "." + k);
  need4(g.tips, "genre " + g.id + ".tips");
  for(const l of L) if(g.tips && g.tips[l] && g.tips[l].length !== (g.tips.ja || []).length) errs.push("genre " + g.id + ".tips." + l + ": 件数が日本語とちがう");
  if(!/^#[0-9a-f]{6}$/i.test(g.c1 || "") || !/^#[0-9a-f]{6}$/i.test(g.c2 || "")) errs.push("genre " + g.id + ": 色");
}
for(const g of data.games){
  if(ids.has(g.id)) errs.push("game " + g.id + ": id が重なっている"); ids.add(g.id);
  if(!/^[a-z0-9-]+$/.test(g.id)) errs.push("game " + g.id + ": id の文字");
  if(!GENRE_IDS.has(g.genre)) errs.push("game " + g.id + ": ジャンル " + g.genre + " がない");
  for(const k of ["name", "sub", "desc", "tags"]) need4(g[k], "game " + g.id + "." + k);
  for(const l of L) if(g.tags && g.tags[l] && g.tags[l].length !== (g.tags.ja || []).length) errs.push("game " + g.id + ".tags." + l + ": 件数が日本語とちがう");
  if(!g.ext && !fs.existsSync(path.join(root, g.href))) errs.push("game " + g.id + ": href がない " + g.href);
  if(g.ext && !/^https:\/\/arechat\.github\.io\//.test(g.href)) errs.push("game " + g.id + ": 外部リンクは arechat.github.io のみ");
  if(g.img && !fs.existsSync(path.join(root, g.img))) errs.push("game " + g.id + ": 画像がない " + g.img);
  if(!g.ext && g.folder && !fs.existsSync(path.join(root, g.folder))) errs.push("game " + g.id + ": folder がない");
  if(!Number.isInteger(g.order) || g.order < 1) errs.push("game " + g.id + ": order");
  if(!Array.isArray(g.inGameLangs) || !g.inGameLangs.includes("ja") || g.inGameLangs.some((x) => !L.includes(x))) errs.push("game " + g.id + ": inGameLangs");
  if(g.adult && g.genre !== "sim") errs.push("game " + g.id + ": 20歳以上は sim に置く");
  if(typeof g.emoji !== "string" || !g.emoji) errs.push("game " + g.id + ": emoji");
  if(g.multi !== undefined && g.multi !== true) errs.push("game " + g.id + ": multi は true だけ");
  // 虫は一切出さない（絵文字・文言）
  // 虫は一切出さない（絵文字・文言）。検査用の語は 文字コードで書く（この道具自身が 虫チェックに ひっかからないように）
  if(/[\u{1F41B}-\u{1F41E}\u{1FAB0}-\u{1FAB3}\u{1F577}\u{1F578}\u{1F982}]|\u6606\u866b|\u866b|\u87f2|\ubc8c\ub808|\uace4\ucda9|bug\b|insect/u.test(JSON.stringify(g))) errs.push("game " + g.id + ": 虫に関する語・絵文字");
}
for(const g of data.genres) if(!data.games.some((x) => x.genre === g.id)) errs.push("genre " + g.id + ": ゲームが1本もない");
// ジャンル内の order は 重ならない
for(const gn of data.genres){
  const os = data.games.filter((x) => x.genre === gn.id).map((x) => x.order).sort((a, b) => a - b);
  os.forEach((o, i) => { if(o !== i + 1) errs.push("genre " + gn.id + ": order が 1,2,3… の連番でない"); });
}
if(errs.length){ console.error("NG（" + errs.length + "件）\n" + errs.join("\n")); process.exit(1); }
const out = "// 自動で作られるファイル（直接は直さない）。元は shared/games-registry.json → node tools/build-registry.js\nwindow.AREGamesData = " + JSON.stringify(data) + ";\n";
if(process.argv.includes("--check")){
  let cur = ""; try{ cur = fs.readFileSync(outPath, "utf8"); }catch(_e){}
  if(cur !== out){ console.error("NG: shared/games-data.js が古い。node tools/build-registry.js を実行してください"); process.exit(1); }
  console.log("OK: ゲーム一覧 " + data.games.length + "本・ジャンル " + data.genres.length + " 件（games-data.js は最新）");
}else{
  fs.writeFileSync(outPath, out);
  console.log("作りました: shared/games-data.js（ゲーム " + data.games.length + "本・ジャンル " + data.genres.length + "）");
}
