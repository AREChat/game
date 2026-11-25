// 「📊 あなたの記録」パネル（shared/hub-record.js ＋ Java 分析 ＋ C# レポート）の通しテスト。
//   cd game && python3 -m http.server 8098 &     BASE=http://localhost:8098 NODE_PATH=$(npm root -g) node tools/record-e2e.js
// 見る点：からっぽ／4言語／Java・C# が 本当に 動く（正解データ tools/parity/hub-vectors.json を ブラウザの中の C#(WASM)・Java(TeaVM) に 流す）／
//         同意するまで C# を 読まない／読みこみ失敗→もう一度／こわれた保存データ／5つの画面サイズ／キーボード／開閉の連打／
//         タイムゾーン・日づけ／ジャンルページ／戻り先／外へ 通信しない
"use strict";
const {chromium} = require("playwright");
const fs = require("fs"), path = require("path");
const BASE = process.env.BASE || "http://localhost:8098";
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, "../shared/games-registry.json"), "utf8"));
const VEC = JSON.parse(fs.readFileSync(path.join(__dirname, "parity/hub-vectors.json"), "utf8"));
const LANGS = REG.langs;
let ok = 0, ng = 0; const fails = [];
function check(c, m){ if(c) ok++; else{ ng++; fails.push(m); console.log("NG:", m); } }
const KANA = /[぀-ゟ゠-ヺヽ-ヿ]/;   // ひらがな・カタカナ（中点 ・ は のぞく）

async function newPage(browser, opts = {}){
  const ctx = await browser.newContext(Object.assign({viewport: {width: 1100, height: 900}, serviceWorkers: "block"}, opts.ctx || {}));
  await ctx.addInitScript(() => { try{ localStorage.setItem("are_gtips_off", "1"); }catch(_e){} });
  if(opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  const errs = [], reqs = [];
  page.on("pageerror", (e) => errs.push("pageerror " + e));
  page.on("console", (m) => { if(m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) errs.push("console " + m.text()); });
  page.on("request", (r) => reqs.push(r.url()));
  return {ctx, page, errs, reqs};
}
async function seed(page, log, lang){
  await page.evaluate(([l, lg]) => {
    if(l) localStorage.setItem("are_lang", l);
    if(lg === null) localStorage.removeItem("are_play_log"); else localStorage.setItem("are_play_log", typeof lg === "string" ? lg : JSON.stringify(lg));
  }, [lang || null, log]);
}
const dayKeyOf = (offset) => { const d = new Date(); d.setDate(d.getDate() - offset); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
async function openPanel(page){ await page.click("#recBtn"); await page.waitForSelector("#hrOverlay"); }
async function waitCs(page, ms = 30000){ await page.waitForSelector("#hrCs .hr-genres", {timeout: ms}); }
function subset(want, got, p, why){
  if(want !== null && typeof want === "object" && !Array.isArray(want)){
    if(got === null || typeof got !== "object" || Array.isArray(got)){ why.push(p + ": object expected"); return false; }
    let r = true; for(const k of Object.keys(want)){ if(!(k in got)){ why.push(p + "." + k + ": missing"); r = false; } else if(!subset(want[k], got[k], p + "." + k, why)) r = false; } return r;
  }
  if(Array.isArray(want)){
    if(!Array.isArray(got) || got.length !== want.length){ why.push(p + ": length " + (got && got.length) + " != " + want.length); return false; }
    let r = true; want.forEach((w, i) => { if(!subset(w, got[i], p + "[" + i + "]", why)) r = false; }); return r;
  }
  if(want !== got){ why.push(p + ": expected " + JSON.stringify(want) + ", got " + JSON.stringify(got)); return false; }
  return true;
}
const ALL = REG.games.filter((g) => !g.adult).map((g) => g.id);
function logOf(map, days){ const g = {}; for(const k of Object.keys(map)) g[k] = {n: map[k], last: Date.now() - 1000}; return {v: 1, g, d: days || {}, h: new Array(24).fill(0), w: new Array(7).fill(0)}; }

(async () => {
  const browser = await chromium.launch();
  const t0 = Date.now();

  // ================= 1) からっぽ：C#・Java を 読まない／4言語／とじ方 =================
  for(const l of LANGS){
    const {ctx, page, errs, reqs} = await newPage(browser);
    await page.goto(BASE + "/index.html"); await seed(page, null, l); await page.reload(); await page.waitForSelector(".card");
    await page.focus("#recBtn"); await page.keyboard.press("Enter");
    await page.waitForSelector("#hrOverlay");
    const t = await page.locator("#hrOverlay").innerText();
    check(await page.locator("#hrEmpty").count() === 1, `からっぽ(${l}): 空の文`);
    check(/ARE|記録|record|记录|기록/i.test(t), `からっぽ(${l}): 題`);
    if(l !== "ja") check(!KANA.test(t), `からっぽ(${l}): かなが残っている ${(t.match(/[぀-ヿ]+/g) || []).slice(0, 4)}`);
    check(await page.locator("#hrOverlay").getAttribute("aria-modal") === "true", `からっぽ(${l}): aria-modal`);
    check(document_active(await page.evaluate(() => document.activeElement && document.activeElement.id)) === "hrClose", `からっぽ(${l}): 最初のフォーカスは「✕」`);
    await page.waitForTimeout(400);
    check(!reqs.some((u) => /csharp-achievements|java-stats/.test(u)), `からっぽ(${l}): Java/C# を 読んでしまった`);
    await page.keyboard.press("Escape");
    check(await page.locator("#hrOverlay").count() === 0, `からっぽ(${l}): Escで閉じる`);
    check(await page.evaluate(() => document.activeElement && document.activeElement.id) === "recBtn", `からっぽ(${l}): 閉じたら ボタンに もどる`);
    check(await page.evaluate(() => document.body.style.overflow) !== "hidden", `からっぽ(${l}): 背景のスクロールが もどる`);
    check(errs.length === 0, `からっぽ(${l}): エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }
  function document_active(x){ return x; }

  // ================= 2) 記録あり：Java が すぐ／C# は 同意まで 読まない =================
  {
    const {ctx, page, errs, reqs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    // 夜型・日曜と土曜が多い記録を 本物の recordPlay で つくる
    await page.evaluate(() => {
      const G = window.AREGames; G.clearLog();
      const at = (y, mo, d, h) => new Date(y, mo - 1, d, h, 5).getTime();
      [[2026, 11, 21, 21], [2026, 11, 21, 22], [2026, 11, 22, 21], [2026, 11, 22, 20], [2026, 11, 24, 21], [2026, 11, 14, 21]].forEach((a, i) => G.recordPlay(i % 2 ? "game10" : "are-quest", at(...a)));
    });
    const lg = await page.evaluate(() => window.AREGames.readLog());
    check(lg.h.length === 24 && lg.w.length === 7, "記録に h/w がある");
    check(lg.h[21] === 4 && lg.h[22] === 1 && lg.h[20] === 1, `時間帯の数え方 ${JSON.stringify(lg.h)}`);
    check(lg.w[6] === 3 && lg.w[0] === 2 && lg.w[2] === 1, `曜日の数え方 ${JSON.stringify(lg.w)}`);   // 11/21=土 11/22=日 11/24=火 11/14=土
    await seed(page, await page.evaluate(() => JSON.parse(localStorage.getItem("are_play_log"))), "ja");
    await page.reload(); await page.waitForSelector(".card");
    await openPanel(page);
    await page.waitForSelector("#hrHabits .hr-bands", {timeout: 15000});
    let t = await page.locator("#hrHabits").innerText();
    check(/夕方〜夜/.test(t) && /21時/.test(t), `Java: 時間帯 ${t.slice(0, 80)}`);
    check(/土日の割合：83%/.test(t), `Java: 土日 5/6=83% ${t}`);
    check(/いちばん多い曜日：土曜日/.test(t), `Java: 曜日 ${t}`);
    check(await page.locator("#hrLoadCs").count() === 1, "C#: 「見る」ボタン");
    check(/数MB/.test(await page.locator("#hrCs").innerText()), "C#: 大きさの注意");
    check(!reqs.some((u) => /csharp-achievements/.test(u)), "同意まで C# を 読まない");
    check(reqs.some((u) => /java-stats\/dist\/stats-analyzer\.js/.test(u)), "Java は 読む");
    check(await page.evaluate(() => localStorage.getItem("are_hub_cs")) === null, "同意の印は まだ ない");
    // 同意 → C#
    await page.click("#hrLoadCs");
    await waitCs(page);
    check(reqs.some((u) => /csharp-achievements\/dist\/index\.html/.test(u)), "C# を 読んだ");
    check(await page.evaluate(() => localStorage.getItem("are_hub_cs")) === "1", "同意の印が つく");
    t = await page.locator("#hrCs").innerText();
    check(new RegExp("あそんだゲーム 2 / " + ALL.length + "本（" + Math.round(200 / ALL.length) + "%）").test(t), `C#: あそんだ本数（20+ は 目標に入らない）${t.slice(0, 60)}`);
    await ctx.close();
  }
  const goal = ALL.length;

  // ================= 3) 正解データ（25 + 4 パターン）を ブラウザの中の C#(WASM)・Java(TeaVM) に 流す =================
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, logOf({"are-quest": 1}, {[dayKeyOf(0)]: 1}), "ja"); await page.reload(); await page.waitForSelector(".card");
    await openPanel(page); await page.click("#hrLoadCs"); await waitCs(page);
    await page.waitForSelector("#hrHabits .hr-bands, #hrHabits .hr-none");
    const frame = page.frames().find((f) => /csharp-achievements\/dist\/index\.html/.test(f.url()));
    check(!!frame, "C# の iframe が ある");
    let n = 0;
    for(const v of VEC.genreReport){
      const res = await frame.evaluate(([a, b, c]) => DotNet.invokeMethodAsync("AchievementsEngine", "Report", a, b, c), [JSON.stringify(v.games), JSON.stringify(v.log), v.today]);
      const why = [];
      let got = null; try{ got = JSON.parse(res); }catch(_e){}
      check(!!got && subset(v.expect, got, "$", why), `WASM 正解データ '${v.name}': ${why.join("; ")} ← ${String(res).slice(0, 200)}`);
      n++;
    }
    for(const v of VEC.habits){
      const res = await page.evaluate(([a, b]) => window.habits(a, b), [v.hours, v.weekdays]);
      const why = []; const got = JSON.parse(res);
      check(subset(v.expect, got, "$", why), `TeaVM 正解データ '${v.name}': ${why.join("; ")} ← ${res}`);
      n++;
    }
    // 壊れた入力で 例外にならない（WASM 側）
    for(const bad of ["", "{", "null", "[[[", "\u0000", "{\"g\":5}"]){
      const res = await frame.evaluate(([a]) => DotNet.invokeMethodAsync("AchievementsEngine", "Report", a, a, a), [bad]);
      let o = null; try{ o = JSON.parse(res); }catch(_e){}
      check(o && typeof o === "object", `WASM 壊れた入力 ${JSON.stringify(bad)} → ${String(res).slice(0, 80)}`);
    }
    console.log(`正解データ ${n} 件を C#(WASM)・Java(TeaVM) に 流した`);
    check(errs.length === 0, `正解データ: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ================= 4) 本物の記録 → 画面（4言語）・次のおすすめ・バッジ =================
  for(const l of LANGS){
    const {ctx, page, errs, reqs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, logOf({"are-quest": 12}, {[dayKeyOf(0)]: 4, [dayKeyOf(1)]: 4, [dayKeyOf(2)]: 4}), l); await page.reload(); await page.waitForSelector(".card");
    await openPanel(page); await page.click("#hrLoadCs"); await waitCs(page);
    const t = await page.locator("#hrOverlay").innerText();
    check(await page.locator(".hr-badges li").count() === 10, `画面(${l}): バッジ10個`);
    check(await page.locator(".hr-badges li.on").count() === 3, `画面(${l}): 解除3個（first・fan10・streak3）= ${await page.locator(".hr-badges li.on").count()}`);
    check(await page.locator("#hrNext").count() === 1, `画面(${l}): 次のおすすめ`);
    const nextId = await page.locator("#hrNext").getAttribute("data-id");
    check(nextId === "quest2-3", `画面(${l}): 同じジャンルの つぎ ${nextId}`);
    check((await page.locator("#hrNext small").innerText()).length > 6, `画面(${l}): 理由の文`);
    if(l !== "ja") check(!KANA.test(t), `画面(${l}): かなが残っている ${(t.match(/[぀-ヿ]+/g) || []).slice(0, 4)}`);
    const names = await page.locator(".hr-badges .bt b").allInnerTexts();
    check(names.every((s) => s.length > 0) && new Set(names).size === 10, `画面(${l}): バッジ名が 全部ちがう ${names}`);
    if(l === "en") check(/First step/.test(t) && /Play next/.test(t) && /3-day streak/.test(t), "画面(en): 英語の文");
    if(l === "zh") check(/第一步/.test(t) && /下一个推荐/.test(t), "画面(zh)");
    if(l === "ko") check(/첫걸음/.test(t) && /다음 추천/.test(t), "画面(ko)");
    // ジャンルの行は 全部 開ける
    const hrefs = await page.locator(".hr-genres a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    check(hrefs.length >= 2, `画面(${l}): ジャンル行 ${hrefs.length}`);
    for(const h of hrefs){ const r = await ctx.request.get(new URL(h, BASE + "/index.html").href); check(r.status() === 200, `画面(${l}): ジャンル行リンク ${h} → ${r.status()}`); }
    check(!reqs.some((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")), `画面(${l}): 外へ 通信している ${reqs.filter((u) => !u.startsWith(BASE)).slice(0, 3)}`);
    check(errs.length === 0, `画面(${l}): エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ================= 5) 同意のあと：つぎは 自動／言語が かわる／開閉の連打／iframe は 1つ =================
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, logOf({"are-quest": 3, "game10": 2}, {[dayKeyOf(0)]: 5}), "ja"); await page.evaluate(() => localStorage.setItem("are_hub_cs", "1"));
    await page.reload(); await page.waitForSelector(".card");
    await openPanel(page); await waitCs(page);
    check(await page.locator("#hrLoadCs").count() === 0, "同意ずみ: ボタンなしで 自動に 出る");
    // 言語を ほかのタブで かえた → 開いたまま 更新
    await page.evaluate(() => { localStorage.setItem("are_lang", "en"); window.dispatchEvent(new StorageEvent("storage", {key: "are_lang", newValue: "en"})); });
    await page.waitForFunction(() => /Badges/.test(document.querySelector("#hrOverlay").innerText), null, {timeout: 5000});
    check(/Play next/.test(await page.locator("#hrOverlay").innerText()), "言語が 開いたまま かわる");
    // 記録が ほかのタブで ふえた → 更新（C# は 再計算しない：古い表示のまま でも 壊れない）
    await page.evaluate(() => { window.dispatchEvent(new StorageEvent("storage", {key: "are_play_log"})); });
    await page.waitForTimeout(200);
    check(await page.locator("#hrOverlay").count() === 1, "記録の更新通知で 壊れない");
    // 連打：開く→閉じる ×40
    for(let i = 0; i < 40; i++){ await page.keyboard.press("Escape"); await page.click("#recBtn"); await page.waitForSelector("#hrOverlay"); }
    await waitCs(page);
    check(await page.locator("iframe").count() === 1, `iframe は 1つだけ（${await page.locator("iframe").count()}）`);
    check(await page.locator("#hrOverlay").count() === 1, "オーバーレイは 1つだけ");
    // 閉じている間に Esc を 押しても 何も おこらない／背景のキーは 通る
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    check(await page.locator("#hrOverlay").count() === 0, "とじた");
    check(errs.length === 0, `連打: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ================= 6) 読みこみ失敗 → もう一度 =================
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, logOf({"are-quest": 3}, {[dayKeyOf(0)]: 1}), "ja"); await page.reload(); await page.waitForSelector(".card");
    await ctx.route("**/csharp-achievements/**", (r) => r.abort());
    await ctx.route("**/java-stats/**", (r) => r.abort());
    await page.evaluate(() => { window.__t = 1; });
    await openPanel(page);   // 既定は 45秒。ここでは テスト用に 短く → 下で open しなおす
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.AREHubRecord.open({prefix: "", csTimeout: 6000}));
    await page.waitForSelector("#hrLoadCs");
    await page.waitForFunction(() => /読みこめませんでした/.test(document.querySelector("#hrHabits").innerText), null, {timeout: 8000});
    check(true, "Java 失敗の表示");
    await page.click("#hrLoadCs");
    await page.waitForFunction(() => /読みこめませんでした/.test(document.querySelector("#hrCs").innerText) && document.querySelector("#hrCs button"), null, {timeout: 20000});
    check(await page.evaluate(() => localStorage.getItem("are_hub_cs")) === null, "失敗したら 同意の印は つけない");
    check(await page.locator("#hrCs [role=alert]").count() === 1, "失敗は role=alert");
    // つながった → もう一度
    await ctx.unroute("**/csharp-achievements/**"); await ctx.unroute("**/java-stats/**");
    await page.click("#hrCs button");
    await waitCs(page);
    check(await page.locator(".hr-badges li").count() === 10, "もう一度 で 直る");
    check(await page.evaluate(() => localStorage.getItem("are_hub_cs")) === "1", "成功したら 印がつく");
    // Java も もう一度（とじて 開く）
    await page.keyboard.press("Escape"); await page.click("#recBtn"); await page.waitForSelector("#hrHabits .hr-bands, #hrHabits .hr-none", {timeout: 10000});
    check(!/読みこめませんでした/.test(await page.locator("#hrHabits").innerText()), "Java も 開きなおせば 直る");
    check(errs.length === 0, `失敗テスト: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ================= 7) こわれた保存データ・保存できない端末 =================
  const corrupt = [
    "{", "null", "[]", "123", "\"x\"", "{\"v\":2}", "{\"v\":1,\"g\":[]}", "{\"v\":1,\"g\":{\"are-quest\":{\"n\":-5}}}",
    "{\"v\":1,\"g\":{\"are-quest\":{\"n\":\"9\"}},\"d\":5,\"h\":\"abc\",\"w\":{\"0\":1}}",
    JSON.stringify({v: 1, g: {"are-quest": {n: 1e30, last: "x"}}, d: {"2026-11-25": "x", "": 1, "__proto__": 2}, h: [1, "a", null, -4, 1e30, NaN], w: [1, 2]}),
    JSON.stringify({v: 1, g: {"nope": {n: 3}, "__proto__": {n: 9}, "constructor": {n: 9}}, d: {}}),
    "{\"v\":1,\"g\":{\"are-quest\":{\"n\":3}},\"d\":{},\"h\":[" + "9,".repeat(5000) + "1]}"
  ];
  for(let i = 0; i < corrupt.length; i++){
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html"); await seed(page, corrupt[i], "ja"); await page.reload(); await page.waitForSelector(".card");
    await openPanel(page);
    await page.waitForFunction(() => document.querySelector("#hrEmpty, #hrHabits .hr-bands, #hrHabits .hr-none"), null, {timeout: 15000});
    const hasTotal = await page.locator("#hrTotal").count();
    if(hasTotal){ await page.click("#hrLoadCs").catch(() => {}); await page.waitForSelector("#hrCs .hr-genres, #hrCs [role=alert]", {timeout: 30000}); check(await page.locator("#hrCs [role=alert]").count() === 0, `こわれ#${i}: C# が 失敗した`); }
    check(await page.locator("#hrOverlay").count() === 1, `こわれ#${i}: パネルが ひらく`);
    const body = await page.locator("#hrOverlay").innerText();
    check(!/NaN|undefined|null|\[object/.test(body), `こわれ#${i}: 変な文字 ${body.match(/NaN|undefined|null|\[object/)}`);
    check(errs.length === 0, `こわれ#${i}: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }
  {   // localStorage が 使えない（読み書きで 例外）
    const {ctx, page, errs} = await newPage(browser, {init: () => {
      const boom = () => { throw new DOMException("denied", "SecurityError"); };
      try{ Object.defineProperty(window, "localStorage", {get: boom}); }catch(_e){}
    }});
    await page.goto(BASE + "/index.html"); await page.waitForSelector(".card");
    await openPanel(page);
    check(await page.locator("#hrEmpty").count() === 1, "保存できない端末: からっぽとして ひらく");
    check(errs.length === 0, `保存できない端末: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ================= 8) 傾向（Java analyze）：増える・へる・かわらない／あそんだ日が少ないと 出さない =================
  async function trendCase(name, daily, expectRe){
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    const days = {}; daily.forEach((v, i) => { if(v) days[dayKeyOf(13 - i)] = v; });
    const lg = logOf({"are-quest": Math.max(1, daily.reduce((a, b) => a + b, 0))}, days); lg.h[10] = 1;
    await seed(page, lg, "ja"); await page.reload(); await page.waitForSelector(".card");
    await openPanel(page); await page.waitForSelector("#hrHabits .hr-bands", {timeout: 15000});
    const t = await page.locator("#hrHabits").innerText();
    if(expectRe) check(expectRe.test(t), `傾向 ${name}: ${t}`); else check(!/さいきん（14日）/.test(t), `傾向 ${name}: 出してはいけない ${t}`);
    check(errs.length === 0, `傾向 ${name}: エラー`);
    await ctx.close();
  }
  await trendCase("増える", [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 6], /だんだん増えています/);
  await trendCase("へる", [6, 5, 4, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0], /すこし減っています/);
  await trendCase("かわらない", [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], /いつもどおりです/);
  await trendCase("日が少ない", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 5], null);

  // ================= 9) 記録のない時間帯（むかしの記録） =================
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, {v: 1, g: {"are-quest": {n: 5, last: Date.now()}}, d: {}}, "ja"); await page.reload(); await page.waitForSelector(".card");
    await openPanel(page); await page.waitForSelector("#hrHabits .hr-none", {timeout: 15000});
    check(/これからあそぶと/.test(await page.locator("#hrHabits").innerText()), "むかしの記録: 時間帯は これから たまる");
    check(await page.locator("#hrTotal").count() === 1, "むかしの記録: 回数は 出る");
    await ctx.close();
  }

  // ================= 10) バッジが 順に ひらく（本物の recordPlay で あそぶ） =================
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, null, "ja"); await page.reload(); await page.waitForSelector(".card");
    const states = [];
    async function snap(){
      await page.evaluate(() => { localStorage.setItem("are_hub_cs", "1"); });
      await openPanel(page); await waitCs(page);
      const on = await page.locator(".hr-badges li.on").evaluateAll((l) => l.map((x) => x.dataset.badge));
      const nx = await page.locator("#hrNext").getAttribute("data-id");
      const nr = await page.locator("#hrNext small").innerText();
      await page.keyboard.press("Escape");
      return {on, nx, nr};
    }
    await page.evaluate(() => window.AREGames.recordPlay("are-quest"));
    let s = await snap(); states.push(s);
    check(s.on.join() === "first", `バッジ 1回: ${s.on}`);
    check(s.nx === "quest2-3", `次 1回: ${s.nx}`);
    await page.evaluate(() => { window.AREGames.recordPlay("quest2-3"); window.AREGames.recordPlay("mystery"); });
    s = await snap();
    check(s.on.join() === "first,tried3", `バッジ 3本: ${s.on}`);
    for(let i = 0; i < 9; i++) await page.evaluate(() => window.AREGames.recordPlay("mystery"));
    s = await snap();
    check(s.on.includes("fan10"), `バッジ 10回: ${s.on}`);
    // ぜんぶあそぶ
    await page.evaluate((ids) => ids.forEach((id) => window.AREGames.recordPlay(id)), ALL);
    s = await snap();
    for(const b of ["first", "tried3", "triedAll", "genres3", "genresAll", "fan10", "master"]) check(s.on.includes(b), `バッジ ぜんぶ: ${b} が ひらいていない ${s.on}`);
    const adultIds = REG.games.filter((g) => g.adult).map((g) => g.id);
    check(!adultIds.includes(s.nx) && s.nr.length > 3, `20+ は すすめない: ${s.nx}`);
    check(s.nx && !adultIds.includes(s.nx), "ぜんぶ遊んだ後も 何かを すすめる");
    // 20+ を あそんだら 目標が ふえるだけ（100% を こえない）
    await page.evaluate((id) => window.AREGames.recordPlay(id), adultIds[0]);
    await page.evaluate(() => localStorage.setItem("are_hub_cs", "1"));
    await openPanel(page); await waitCs(page);
    const big = await page.locator("#hrCs .hr-big").first().innerText();
    const m = big.match(/(\d+) \/ (\d+)本（(\d+)%）/);
    check(m && +m[1] === +m[2] && +m[3] === 100 && +m[2] === goal + 1, `20+ を あそんだ: ${big}（期待 ${goal + 1} 本）`);
    check(errs.length === 0, `バッジ: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ================= 11) 5つの画面サイズ：はみ出さない・✕が見える・スクロールできる・Tab が ぐるぐる =================
  const sizes = [[320, 568], [375, 667], [414, 896], [768, 1024], [1280, 720], [667, 375], [1920, 1080]];
  for(const [w, h] of sizes){
    for(const l of ["ja", "en", "ko"]){
      const {ctx, page, errs} = await newPage(browser, {ctx: {viewport: {width: w, height: h}}});
      await page.goto(BASE + "/index.html");
      await seed(page, logOf({"are-quest": 12, "mystery": 3, "game10": 2, "card": 1}, {[dayKeyOf(0)]: 4, [dayKeyOf(1)]: 4, [dayKeyOf(2)]: 4}), l); await page.evaluate(() => localStorage.setItem("are_hub_cs", "1"));
      await page.reload(); await page.waitForSelector(".card");
      await openPanel(page); await waitCs(page); await page.waitForSelector("#hrHabits .hr-bands, #hrHabits .hr-none");
      const m = await page.evaluate(() => {
        const p = document.querySelector(".hr-panel"), r = p.getBoundingClientRect(), x = document.getElementById("hrClose").getBoundingClientRect();
        return {sw: p.scrollWidth, cw: p.clientWidth, top: r.top, bottom: r.bottom, left: r.left, right: r.right, xTop: x.top, xBottom: x.bottom, xLeft: x.left, xRight: x.right, vw: innerWidth, vh: innerHeight, docW: document.documentElement.scrollWidth, ph: p.scrollHeight, ch: p.clientHeight, ov: document.body.style.overflow};
      });
      const tag = `${w}x${h}(${l})`;
      check(m.sw <= m.cw + 1, `サイズ ${tag}: 横にはみ出す ${m.sw}>${m.cw}`);
      check(m.left >= -0.5 && m.right <= m.vw + 0.5 && m.top >= -0.5 && m.bottom <= m.vh + 0.5, `サイズ ${tag}: パネルが 画面の外 ${JSON.stringify(m)}`);
      check(m.xTop >= 0 && m.xBottom <= m.vh && m.xLeft >= 0 && m.xRight <= m.vw, `サイズ ${tag}: ✕が 見えない`);
      check(m.xBottom - m.xTop >= 40 && m.xRight - m.xLeft >= 40, `サイズ ${tag}: ✕が 小さい`);
      check(m.ov === "hidden", `サイズ ${tag}: 背景スクロールを とめている`);
      check(m.docW <= m.vw + 1, `サイズ ${tag}: ページが 横スクロール ${m.docW}>${m.vw}`);
      // いちばん下まで スクロール → 「とじる」が 見える
      await page.evaluate(() => { const p = document.querySelector(".hr-panel"); p.scrollTop = p.scrollHeight; });
      const vis = await page.evaluate(() => { const b = document.getElementById("hrClose2").getBoundingClientRect(); return b.bottom <= innerHeight + 1 && b.top >= 0; });
      check(vis, `サイズ ${tag}: 下の「とじる」に とどく`);
      // Tab が パネルの 外へ 出ない（40回）
      let escaped = 0;
      for(let i = 0; i < 40; i++){ await page.keyboard.press("Tab"); if(!(await page.evaluate(() => document.querySelector("#hrOverlay").contains(document.activeElement)))) escaped++; }
      for(let i = 0; i < 10; i++){ await page.keyboard.press("Shift+Tab"); if(!(await page.evaluate(() => document.querySelector("#hrOverlay").contains(document.activeElement)))) escaped++; }
      check(escaped === 0, `サイズ ${tag}: Tab が 外へ ${escaped}回`);
      check(errs.length === 0, `サイズ ${tag}: エラー ${errs.slice(0, 2)}`);
      await ctx.close();
    }
  }

  // ================= 12) タイムゾーン：時間帯・日づけが 端末の 時刻 =================
  for(const tz of ["Asia/Tokyo", "America/Los_Angeles", "Pacific/Auckland", "Asia/Kolkata", "Pacific/Kiritimati", "Etc/GMT+12"]){
    const {ctx, page, errs} = await newPage(browser, {ctx: {timezoneId: tz}});
    await page.goto(BASE + "/index.html");
    const r = await page.evaluate(() => {
      const G = window.AREGames; G.clearLog();
      const ts = Date.UTC(2026, 11 - 1, 24, 15, 30);   // UTC 15:30
      G.recordPlay("are-quest", ts);
      const d = new Date(ts), lg = G.readLog();
      return {h: lg.h.indexOf(1), w: lg.w.indexOf(1), eh: d.getHours(), ew: d.getDay(), day: Object.keys(lg.d)[0], eday: G.dayKey(ts)};
    });
    check(r.h === r.eh && r.w === r.ew && r.day === r.eday, `TZ ${tz}: 時間帯・曜日・日づけが 端末の時刻 ${JSON.stringify(r)}`);
    check(errs.length === 0, `TZ ${tz}: エラー`);
    await ctx.close();
  }

  // ================= 13) ジャンルページ：ボタン・戻り先・おすすめを おすと 記録 =================
  {
    const back = "https://arechat.github.io/ARE/chat.html?x=1";
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/genre/index.html?g=rpg&back=" + encodeURIComponent(back));
    await seed(page, logOf({"are-quest": 3}, {[dayKeyOf(0)]: 1}), "ja"); await page.evaluate(() => localStorage.setItem("are_hub_cs", "1"));
    await page.reload(); await page.waitForSelector(".card");
    check((await page.locator("#recBtn").innerText()).includes("あなたの記録"), "ジャンルページ: ボタン");
    await openPanel(page); await waitCs(page);
    const href = await page.locator("#hrNext").getAttribute("href");
    check(/^\.\.\/.+back=/.test(href) && href.includes(encodeURIComponent(back)), `ジャンルページ: おすすめの先 ../ と back ${href}`);
    const gh = await page.locator(".hr-genres a").first().getAttribute("href");
    check(/^\.\.\/genre\/index\.html\?g=[a-z]+&back=/.test(gh), `ジャンルページ: ジャンル行 ${gh}`);
    const before = await page.evaluate(() => window.AREGames.readLog().g["quest2-3"]);
    await page.evaluate(() => { document.getElementById("hrNext").addEventListener("click", (e) => e.preventDefault(), true); });
    await page.click("#hrNext");
    const after = await page.evaluate(() => window.AREGames.readLog().g["quest2-3"]);
    check(!before && after && after.n === 1, `おすすめを おすと 記録 ${JSON.stringify(after)}`);
    // 行き先が 本当に ある
    const r = await ctx.request.get(new URL(href, BASE + "/genre/index.html").href); check(r.status() === 200, "おすすめの先が 開く " + r.status());
    check(errs.length === 0, `ジャンルページ: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }
  {   // 悪い back は つかわない
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html?back=" + encodeURIComponent("javascript:alert(1)"));
    await seed(page, logOf({"are-quest": 3}, {[dayKeyOf(0)]: 1}), "ja"); await page.evaluate(() => localStorage.setItem("are_hub_cs", "1"));
    await page.goto(BASE + "/index.html?back=" + encodeURIComponent("javascript:alert(1)")); await page.waitForSelector(".card");
    await openPanel(page); await waitCs(page);
    const href = await page.locator("#hrNext").getAttribute("href");
    check(!/back=|javascript/.test(href), `悪い back: ${href}`);
    check(errs.length === 0, "悪い back: エラー");
    await ctx.close();
  }

  // ================= 14) 長めの連続動作（ソーク）：開閉・言語・記録を くりかえす =================
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, logOf({"are-quest": 3}, {[dayKeyOf(0)]: 1}), "ja"); await page.evaluate(() => localStorage.setItem("are_hub_cs", "1"));
    await page.reload(); await page.waitForSelector(".card");
    const base = await page.evaluate(() => document.getElementsByTagName("*").length);
    for(let i = 0; i < 120; i++){
      await page.evaluate((l) => { localStorage.setItem("are_lang", l); }, LANGS[i % 4]);
      await page.evaluate(() => window.AREHubRecord.open({prefix: ""}));
      if(i % 10 === 0) await page.evaluate((id) => window.AREGames.recordPlay(id), ALL[(i / 10) % ALL.length]);
      if(i % 30 === 0) await waitCs(page);
      await page.evaluate(() => window.AREHubRecord.close());
    }
    const end = await page.evaluate(() => ({n: document.getElementsByTagName("*").length, f: document.querySelectorAll("iframe").length, o: document.querySelectorAll(".hr-overlay").length, ov: document.body.style.overflow}));
    check(end.o === 0 && end.f <= 1 && end.ov !== "hidden", `ソーク: 後始末 ${JSON.stringify(end)}`);
    check(end.n <= base + 8, `ソーク: 要素が ふえつづけている ${base} → ${end.n}`);
    check(errs.length === 0, `ソーク: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ================= 15) オフライン：開ける・回数は 出る・読めないところは 文で 知らせる =================
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html");
    await seed(page, logOf({"are-quest": 3}, {[dayKeyOf(0)]: 1}), "ja"); await page.reload(); await page.waitForSelector(".card");
    await ctx.setOffline(true);
    await page.evaluate(() => window.AREHubRecord.open({prefix: "", csTimeout: 1500}));
    await page.waitForFunction(() => /読みこめませんでした/.test(document.querySelector("#hrHabits").innerText) || document.querySelector("#hrHabits .hr-bands"), null, {timeout: 10000});
    check(true, "オフライン: 開く");
    check(await page.locator("#hrTotal").count() === 1, "オフライン: 回数は 出る");
    check(await page.locator("#hrClose").count() === 1, "オフライン: とじられる");
    await page.keyboard.press("Escape");
    await ctx.setOffline(false);
    check(errs.length === 0, `オフライン: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n結果: OK ${ok} ／ NG ${ng}（${Math.round((Date.now() - t0) / 1000)}秒）`);
  if(ng){ console.log(fails.slice(0, 30).join("\n")); process.exit(1); }
})().catch((e) => { console.error("テスト自体が 失敗:", e); process.exit(2); });
