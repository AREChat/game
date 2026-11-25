// ループ・ラボ（game10）の「画面の重なり」テスト：画面の上に浮かぶボタン（もどる／🎮／📊）が、見出し・文字・ボタンを隠していないか。
//   cd game && python3 -m http.server 8098 &     BASE=http://localhost:8098 NODE_PATH=$(npm root -g) node tools/g10-layout.js
// 見る点：5つの画面（タイトル／あそびかた／ステージえらび／ランダム／あそぶ）×
//         いろいろな画面サイズ（スマホたて・よこ、小さいスマホ、タブレット、PC）× 4言語 ×
//         スクロールの いちばん上と いちばん下 ／ 浮かぶボタンどうしも 重ならない ／ 画面の外に はみ出さない
"use strict";
const {chromium} = require("playwright");
const BASE = process.env.BASE || "http://localhost:8098";
const URL10 = BASE + "/game10/index.html";
let ok = 0, ng = 0;
function check(c, m){ if(c) ok++; else{ ng++; console.log("NG:", m); } }

// ページの中で「重なり」を数える。返す：[ "説明", ... ]（空なら 重なりなし）
const FIND = () => {
  const FIXED = ["#exitBtn", "#padBtn", "#arefp-btn"];
  const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 1 && r.height > 1 && cs.display !== "none" && cs.visibility !== "hidden" && !e.closest("[hidden]"); };
  const fixed = FIXED.map((s) => document.querySelector(s)).filter((e) => e && vis(e));
  const fr = fixed.map((e) => ({id: e.id, r: e.getBoundingClientRect()}));
  const clip = (r, b) => ({left: Math.max(r.left, b.left), right: Math.min(r.right, b.right), top: Math.max(r.top, b.top), bottom: Math.min(r.bottom, b.bottom)});   // スクロール枠の外に はみ出した部分は 見えない
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
  const out = [];
  const vw = innerWidth, vh = innerHeight;
  fr.forEach((f) => { if(f.r.left < -0.5 || f.r.top < -0.5 || f.r.right > vw + 0.5 || f.r.bottom > vh + 0.5) out.push(f.id + " が画面の外にはみ出している"); });
  for(let i = 0; i < fr.length; i++) for(let j = i + 1; j < fr.length; j++) if(hit(fr[i].r, fr[j].r)) out.push(fr[i].id + " と " + fr[j].id + " が重なっている");
  const scr = document.querySelector(".scr.on"); if(!scr) return ["表示中の画面がない"];
  const box = scr.getBoundingClientRect();
  const label = (e) => (e.id ? "#" + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "")) + "「" + String(e.textContent || "").trim().slice(0, 14) + "」";
  // 文字：行ごとの四角で調べる（ブロックの横幅いっぱいの四角だと、文字のない所まで 重なりと数えてしまうため）
  const texts = scr.querySelectorAll("h2,.sub,.hint,.panel p,.panel b,.logo span,#lvName,#lvInfo span,#toast.on");
  texts.forEach((e) => {
    if(!vis(e)) return;
    const rg = document.createRange(); rg.selectNodeContents(e);
    Array.from(rg.getClientRects()).forEach((r) => {
      if(r.width < 1 || r.height < 1) return;
      const c = clip(r, box);                                          // スクロールで 見えている部分だけ
      fr.forEach((f) => { if(hit(c, f.r)) out.push(label(e) + " が " + f.id + " と重なっている"); });
    });
  });
  // ボタンなど：四角ぜんたいで調べる
  const boxes = scr.querySelectorAll("button,input,select,.lv");
  boxes.forEach((e) => {
    if(!vis(e) || FIXED.some((s) => e.matches(s))) return;
    const c = clip(e.getBoundingClientRect(), box);
    fr.forEach((f) => { if(hit(c, f.r)) out.push(label(e) + " が " + f.id + " と重なっている"); });
  });
  return out;
};

async function scrollEnds(page, fn){
  // いちばん上 → いちばん下 の 2か所で 調べる（スクロールできない画面は 1か所）
  const res = [];
  await page.evaluate(() => { const s = document.querySelector(".scr.on"); if(s) s.scrollTop = 0; });
  res.push(["上", await page.evaluate(fn)]);
  const more = await page.evaluate(() => { const s = document.querySelector(".scr.on"); if(!s || s.scrollHeight <= s.clientHeight + 2) return false; s.scrollTop = s.scrollHeight; return true; });
  if(more) res.push(["下", await page.evaluate(fn)]);
  return res;
}

const SIZES = [
  ["スマホ たて 390×844", {width: 390, height: 844}, true],
  ["小さいスマホ 320×568", {width: 320, height: 568}, true],
  ["スマホ たて 360×640", {width: 360, height: 640}, true],
  ["スマホ よこ 844×390", {width: 844, height: 390}, true],
  ["小さいスマホ よこ 568×320", {width: 568, height: 320}, true],
  ["タブレット 820×1180", {width: 820, height: 1180}, true],
  ["PC 1280×720", {width: 1280, height: 720}, false],
];
const LANGS = ["ja", "en", "zh", "ko"];

(async () => {
  const browser = await chromium.launch();
  for(const [sname, vp, mobile] of SIZES){
    for(const lang of LANGS){
      // 小さい画面は 4言語ぜんぶ、ほかは ja/ko だけ（長い言語で 崩れやすいので ko は かならず）
      if(!/小さい|スマホ/.test(sname) && lang !== "ja" && lang !== "ko") continue;
      const ctx = await browser.newContext({viewport: vp, serviceWorkers: "block", isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1});
      await ctx.addInitScript((l) => { try{ localStorage.setItem("are_gtips_off", "1"); localStorage.setItem("are_lang", l); }catch(_e){} }, lang);
      const page = await ctx.newPage();
      const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
      await page.goto(URL10); await page.waitForSelector("#bPlay");
      await page.waitForFunction(() => !!document.querySelector("#arefp-btn")).catch(() => {});
      const tag = sname + " / " + lang;
      const run = async (screen) => {
        const rs = await scrollEnds(page, FIND);
        rs.forEach(([where, list]) => check(list.length === 0, tag + " / " + screen + "（" + where + "）: " + list.slice(0, 4).join("、")));
      };
      await run("タイトル");
      await page.click("#bHow"); await page.waitForSelector("#s-how.on"); await run("あそびかた");
      await page.click("#bHowBack");
      await page.click("#bPlay"); await page.waitForSelector("#s-sel.on"); await run("ステージえらび");
      await page.click("#bSelBack");
      await page.click("#bGen"); await page.waitForSelector("#s-gen.on .gbtn"); await page.waitForTimeout(150); await run("ランダム");
      await page.evaluate(() => window.__g10.startGen("rand", 3, 11)); await page.waitForSelector("#s-play.on"); await page.waitForTimeout(500); await run("あそぶ");
      // ふつうの面（最初のステージ）でも
      await page.click("#exitBtn"); await page.waitForSelector("#s-gen.on");
      await page.click("#exitBtn"); await page.waitForSelector("#s-title.on");
      await page.click("#bPlay"); await page.waitForSelector("#s-sel.on");
      await page.click(".lv:not(.locked)"); await page.waitForSelector("#s-play.on"); await page.waitForTimeout(400); await run("あそぶ(ステージ1)");
      check(errs.length === 0, tag + " / エラーなし: " + errs.join(" | "));
      await ctx.close();
    }
  }
  await browser.close();
  console.log("\n" + (ng ? "NG " + ng + " 件 / " : "") + "OK（" + ok + " 項目）");
  process.exit(ng ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
