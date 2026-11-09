#!/usr/bin/env node
"use strict";
// ARE QUEST（game/index.html）の JS 66本を、4本の束（game/game.bundle-1.js 〜 4）にまとめるビルド（読み込みを速くするため）
//
// ・まとめる順番は tools/game-bundle-sources.txt の上から下（＝これまで index.html に並んでいた順番）。「---」で束を分ける
// ・もとの JS は今までどおり game/ の中で編集する。編集したら、かならずこのビルドを実行する：
//       node tools/build-game.js
// ・中身は 1文字も かえない（圧縮も書きかえもしない）。つなげるだけ
// ・束のあとに game/game.bundle-fb.js（予備）が走り、まだ実行が始まっていないファイルだけを もとのファイルで 1本ずつ読み直す（途中で止まったファイル自体は 二重に動かさない）
//   （束が 読めない／構文エラーでも ゲームは今までどおり動く）
// ・安全のため、次のどれかに当てはまると このビルドは失敗する：
//     1) 先頭が "use strict" でないファイルがある（つなげると 全体が strict になるため）
//     2) 同じ束の中で、同じ名前の関数・const・let・class が 2回出てくる（つなげると 後ろの定義が先に効くため）
//     3) 束が JavaScript として読めない（構文エラー）
// ・   node tools/build-game.js --check   … 作り直した結果が 今のファイルと同じかを調べる（CI 用。違えば失敗）

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const dir = path.join(root, "game");
const htmlFile = path.join(dir, "index.html");
const checkOnly = process.argv.includes("--check");

// ---- 並び順の読みこみ ----
const segs = [[]];
fs.readFileSync(path.join(__dirname, "game-bundle-sources.txt"), "utf8").split("\n").map((s) => s.trim()).forEach((s) => {
    if(!s || s[0] === "#") return;
    if(s === "---"){ if(segs[segs.length - 1].length) segs.push([]); return; }
    segs[segs.length - 1].push(s);
});
const files = [].concat.apply([], segs);
const fail = (m) => { console.error("× " + m); process.exit(2); };

const src = {};
files.forEach((f) => {
    const p = path.join(dir, f);
    if(!fs.existsSync(p)) fail("ファイルがありません: game/" + f);
    let t = fs.readFileSync(p, "utf8");
    if(t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
    if(!/^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*(["'])use strict\1/.test(t)) fail("game/" + f + " の先頭が \"use strict\" ではありません（束にすると 全体が strict になるため、先頭に \"use strict\"; を書いてください）");
    src[f] = t;
});

// ---- 束を作る ----
let idx = 0;
const bundles = segs.map((seg, si) => {
    const seen = {};
    seg.forEach((f) => {
        src[f].split("\n").forEach((line) => {
            const m = /^(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/.exec(line);
            if(!m) return;
            if(seen[m[1]] && seen[m[1]] !== f) fail("同じ束の中で「" + m[1] + "」が game/" + seen[m[1]] + " と game/" + f + " の 2か所にあります。名前をかえるか、game-bundle-sources.txt の「---」で 別の束に分けてください。");
            seen[m[1]] = f;
        });
    });
    let out = '"use strict";\n/* 自動生成: node tools/build-game.js （直接編集しない）  束 ' + (si + 1) + ' / ' + segs.length + ' */\n';
    seg.forEach((f) => {
        out += "\n/* ==== game/" + f + " ==== */\n;(window.__AREB_S||(window.__AREB_S=[]))[" + (idx++) + "]=1;\n" + src[f] + "\n";
    });
    try { new vm.Script(out, {filename: "game.bundle-" + (si + 1) + ".js"}); } catch(e){ fail("束 " + (si + 1) + " が 構文エラーです: " + e.message); }
    return out;
});

const ver = crypto.createHash("sha256").update(bundles.join("\u0000")).digest("hex").slice(0, 10);

// ---- 予備（束が 動かなかった分だけ、もとのファイルで読み直す）----
let k = 0;
const segIdx = segs.map((seg) => seg.map((f) => [k++, f]));
const fb =
    "/* 自動生成: node tools/build-game.js （直接編集しない）。まだ実行が始まっていないファイルだけ、もとのファイルで 1本ずつ読み直す */\n" +
    "(function(){\n" +
    "var S=" + JSON.stringify(segIdx) + ";\n" +
    "var me=document.currentScript, n=me&&me.getAttribute('data-seg')|0, d=window.__AREB_S||[], list=S[n-1]||[], h='';\n" +
    "for(var i=0;i<list.length;i++){ if(!d[list[i][0]]) h+='<script src=\"./'+list[i][1]+'?fb='+(me.getAttribute('data-v')||'')+'\"></'+'script>'; }\n" +
    "if(h){ try{ console.warn('[ARE QUEST] 束で動かなかったファイルを、1本ずつ読み直します（束 '+n+'）'); }catch(e){} document.write(h); }\n" +
    "})();\n";

// ---- index.html の書きかえ ----
const tags = segs.map((_, i) =>
    '<script src="./game.bundle-' + (i + 1) + '.js?v=' + ver + '"></script>\n' +
    '<script src="./game.bundle-fb.js?v=' + ver + '" data-seg="' + (i + 1) + '" data-v="' + ver + '"></script>').join("\n");
const block = "<!-- GAME-BUNDLE:BEGIN 自動生成（node tools/build-game.js）。直接編集しない -->\n" + tags + "\n<!-- GAME-BUNDLE:END -->";
const html = fs.readFileSync(htmlFile, "utf8");
const re = /<!-- GAME-BUNDLE:BEGIN[\s\S]*?<!-- GAME-BUNDLE:END -->/;
if(!re.test(html)) fail("index.html に GAME-BUNDLE の目印がありません");
const newHtml = html.replace(re, () => block);

const outputs = bundles.map((b, i) => [path.join(dir, "game.bundle-" + (i + 1) + ".js"), b]).concat([[path.join(dir, "game.bundle-fb.js"), fb], [htmlFile, newHtml]]);
if(checkOnly){
    const bad = outputs.filter(([p, c]) => !fs.existsSync(p) || fs.readFileSync(p, "utf8") !== c);
    // 束の数が減った時の、古い束ファイルの取りのこし
    fs.readdirSync(dir).filter((n) => /^game\.bundle-\d+\.js$/.test(n)).forEach((n) => { if(Number(n.match(/\d+/)[0]) > segs.length) bad.push([n]); });
    if(bad.length){ console.error("× 最新ではありません: " + bad.map((b) => path.basename(b[0])).join(", ") + "\n   node tools/build-game.js を実行して、できたファイルも コミットしてください。"); process.exit(1); }
    console.log("OK: game の束は最新です（" + files.length + "本 → " + segs.length + "束, v=" + ver + "）");
} else {
    fs.readdirSync(dir).filter((n) => /^game\.bundle-\d+\.js$/.test(n)).forEach((n) => { if(Number(n.match(/\d+/)[0]) > segs.length) fs.unlinkSync(path.join(dir, n)); });
    outputs.forEach(([p, c]) => fs.writeFileSync(p, c));
    console.log("作りました: " + files.length + "本 → " + segs.length + "束（" + bundles.map((b) => (b.length / 1024 | 0) + "KB").join(" / ") + "）, v=" + ver);
}
