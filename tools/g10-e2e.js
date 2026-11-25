// ループ・ラボ「🎲 きょうのステージ・ランダム」（C++/WebAssembly の ステージ生成）の ブラウザ通しテスト。
//   cd game && python3 -m http.server 8098 &     BASE=http://localhost:8098 NODE_PATH=$(npm root -g) node tools/g10-e2e.js
// 見る点：4言語／ほんとうに キー操作で クリアできる（かんたん・ふつう・むずかしい × 複数 seed）／きょうのステージは 同じ日なら 同じ・ちがう日は ちがう／
//         ばんごう入力の 境目と ひどい入力／WebAssembly が 読めないとき／もどる・Esc／★の 保存と こわれた保存／5つの画面サイズ／連打
"use strict";
const {chromium} = require("playwright");
const BASE = process.env.BASE || "http://localhost:8098";
let ok = 0, ng = 0; const fails = [];
function check(c, m){ if(c) ok++; else{ ng++; fails.push(m); console.log("NG:", m); } }
const KANA = /[぀-ゟ゠-ヺヽ-ヿ]/;
const URL10 = BASE + "/game10/index.html";

async function newPage(browser, opts = {}){
  const ctx = await browser.newContext(Object.assign({viewport: {width: 1000, height: 800}, serviceWorkers: "block"}, opts.ctx || {}));
  await ctx.addInitScript(() => { try{ localStorage.setItem("are_gtips_off", "1"); }catch(_e){} });
  const page = await ctx.newPage();
  const errs = [], reqs = [];
  page.on("pageerror", (e) => errs.push("pageerror " + e));
  page.on("console", (m) => { if(m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) errs.push("console " + m.text()); });
  page.on("request", (r) => reqs.push(r.url()));
  return {ctx, page, errs, reqs};
}
// ページの中で、ほんもののルール(G10Sim)だけで 手順を つくる → ["U","D","L","R","W","LOOP"…]
const SOLVE = () => {
  const Sim = window.G10Sim, S = window.__g10.S, lv = S.lv, g = S.g, steps = lv.steps - 1;
  const all = []; Object.keys(g.plates).forEach((k) => g.plates[k].forEach((p) => all.push(p)));
  let sol = null;
  for(let n = 0; n <= lv.par + 1 && !sol; n++){
    (function rec(gs, dirs, used, depth){
      if(sol) return;
      const fin = Sim.plan(g, gs, g.E, steps);
      if(fin){ sol = {dirs, fin}; return; }
      if(depth >= n) return;
      for(const p of all){
        const key = p.join(","); if(used[key] || sol) continue;
        const path = Sim.plan(g, gs, p, steps); if(!path) continue;
        const run = Sim.newRun(g); path.forEach((d) => Sim.step(g, gs, run, d));
        const u = Object.assign({}, used); u[key] = 1; rec(gs.concat([run.path]), dirs.concat([path]), u, depth + 1);
      }
    })([], [], {}, 0);
  }
  if(!sol) return null;
  const tok = (d) => d || "W", out = [];
  sol.dirs.forEach((p) => { p.forEach((d) => out.push(tok(d))); out.push("LOOP"); });
  sol.fin.forEach((d) => out.push(tok(d)));
  return out;
};
const KEY = {U: "ArrowUp", D: "ArrowDown", L: "ArrowLeft", R: "ArrowRight", W: " ", LOOP: "Enter"};
async function playBot(page){
  const toks = await page.evaluate(SOLVE);
  if(!toks) return null;
  for(const t of toks){ await page.keyboard.press(KEY[t]); }
  return toks.length;
}
async function waitPlay(page){ await page.waitForFunction(() => document.getElementById("s-play").classList.contains("on") && window.__g10 && window.__g10.S, null, {timeout: 20000}); }
async function stage(page){ return page.evaluate(() => { const S = window.__g10.S; return S ? {map: S.lv.map.join("\n"), par: S.lv.par, steps: S.lv.steps, custom: S.custom, name: document.getElementById("lvName").textContent} : null; }); }

(async () => {
  const browser = await chromium.launch();
  const t0 = Date.now();

  // ===== 1) 4言語：タイトルの ボタン・えらぶ画面 =====
  for(const l of ["ja", "en", "zh", "ko"]){
    const {ctx, page, errs} = await newPage(browser);
    await page.addInitScript((x) => { try{ localStorage.setItem("are_lang", x); }catch(_e){} }, l);
    await page.goto(URL10); await page.waitForSelector("#bGen");
    const bt = await page.locator("#bGen").innerText();
    check(l === "ja" ? /きょうのステージ/.test(bt) : l === "en" ? /Daily/.test(bt) : l === "zh" ? /每日/.test(bt) : /오늘의/.test(bt), `タイトルのボタン(${l}): ${bt}`);
    await page.click("#bGen"); await page.waitForSelector("#s-gen.on .gbtn");
    const t = await page.locator("#s-gen").innerText();
    check((await page.locator("#s-gen .gbtn").count()) === 6, `えらぶ画面(${l}): ボタン6つ`);
    check(await page.locator("#gNum").count() === 1 && await page.locator("#gGo").count() === 1, `えらぶ画面(${l}): 番号入力`);
    if(l !== "ja") check(!KANA.test(t), `えらぶ画面(${l}): かなが残っている ${(t.match(/[぀-ヿ]+/g) || []).slice(0, 4)}`);
    check(await page.evaluate(() => document.documentElement.lang) === l, `html lang(${l})`);
    check(errs.length === 0, `えらぶ画面(${l}): エラー ${errs.slice(0, 2)}`);
    // もどる
    await page.click("#gBack"); check(await page.locator("#s-title.on").count() === 1, `もどる(${l})`);
    await ctx.close();
  }

  // ===== 2) ほんとうに クリア：3段階 × seed =====
  {
    const {ctx, page, errs, reqs} = await newPage(browser);
    await page.goto(URL10); await page.waitForSelector("#bGen");
    check(!reqs.some((u) => /g10gen\.wasm/.test(u)), "さいしょは wasm を 読まない（開くまで）");
    await page.click("#bGen"); await page.waitForSelector(".gbtn");
    const seeds = [1, 7, 42, 2026, 20261125, 65535, 123456789, 4294967295, 0];
    let cleared = 0, total = 0;
    for(const level of [1, 2, 3]){
      for(const seed of seeds){
        await page.evaluate(([lv, sd]) => window.__g10.startGen("rand", lv, sd), [level, seed]); await waitPlay(page);
        const st = await stage(page);
        check(st && st.custom && st.custom.seed === seed && st.custom.level === level, `開始 level${level} seed${seed}`);
        check(st.name.includes(String(seed)), `ステージ名に 番号 ${st.name}`);
        const n = await playBot(page); total++;
        await page.waitForSelector("#clear:not([hidden])", {timeout: 8000}).catch(() => {});
        const shown = await page.locator("#clear").isVisible();
        check(n !== null && shown, `クリアできない level${level} seed${seed}（手順 ${n}）\n${st.map}`);
        if(shown){ cleared++; const stars = await page.locator("#clStars i.on").count(); check(stars === 3, `★3 level${level} seed${seed}: ${stars}（お手本どおりの 人数）`); }
        await page.evaluate(() => { document.getElementById("clear").hidden = true; });
      }
    }
    console.log(`キー操作で クリア ${cleared}/${total}`);
    check(reqs.filter((u) => /g10gen\.wasm/.test(u)).length === 1, "wasm は 1回だけ 読む");
    check(!reqs.some((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")), "外へ 通信しない");
    check(errs.length === 0, `クリア: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ===== 3) きょうのステージ：同じ日 → 同じ／ちがう日 → ちがう／★の保存 =====
  const maps = {};
  for(const [label, date] of [["a1", [2026, 10, 25, 9]], ["a2", [2026, 10, 25, 23]], ["b", [2026, 10, 26, 9]], ["c", [2027, 0, 1, 12]]]){
    const {ctx, page, errs} = await newPage(browser);
    await page.clock.setFixedTime(new Date(date[0], date[1], date[2], date[3], 30));
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    const labelDay = await page.locator("#s-gen .panel").first().innerText();
    check(new RegExp(`${date[1] + 1}/${date[2]}`).test(labelDay), `日づけの 表示(${label}): ${labelDay.slice(0, 30)}`);
    for(const lv of [1, 2, 3]){
      await page.click(`.gbtn[data-k=daily][data-lv="${lv}"]`); await waitPlay(page);
      maps[label + lv] = await stage(page);
      check(maps[label + lv].custom.kind === "daily" && maps[label + lv].custom.seed === date[0] * 10000 + (date[1] + 1) * 100 + date[2], `きょうの seed(${label}${lv}): ${maps[label + lv].custom.seed}`);
      await page.click("#exitBtn"); await page.waitForSelector(".gbtn");
    }
    check(errs.length === 0, `きょうのステージ(${label}): エラー`);
    await ctx.close();
  }
  for(const lv of [1, 2, 3]){
    check(maps["a1" + lv].map === maps["a2" + lv].map, `同じ日 → 同じステージ（${lv}）`);
    check(maps["a1" + lv].map !== maps["b" + lv].map, `つぎの日 → ちがうステージ（${lv}）`);
    check(maps["b" + lv].map !== maps["c" + lv].map, `年がわり → ちがうステージ（${lv}）`);
  }
  check(new Set([1, 2, 3].map((lv) => maps["a1" + lv].map)).size === 3, "むずかしさごとに ちがうステージ");
  // タイムゾーン：同じ「日づけ」なら おなじ seed（各地の 現地の日付で きまる）
  for(const tz of ["Asia/Tokyo", "America/Los_Angeles", "Pacific/Kiritimati", "Etc/GMT+12"]){
    const {ctx, page} = await newPage(browser, {ctx: {timezoneId: tz}});
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    const r = await page.evaluate(() => { const d = new Date(); return {ds: d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()}; });
    await page.click('.gbtn[data-k=daily][data-lv="1"]'); await waitPlay(page);
    check((await stage(page)).custom.seed === r.ds, `TZ ${tz}: きょうの seed は 現地の日づけ`);
    await ctx.close();
  }
  // ★の 保存と 表示
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    await page.click('.gbtn[data-k=daily][data-lv="2"]'); await waitPlay(page);
    await playBot(page); await page.waitForSelector("#clear:not([hidden])");
    check(await page.locator("#clNext").isHidden(), "きょうのステージ: 「つぎのランダム」は ない");
    const d = await page.evaluate(() => JSON.parse(localStorage.getItem("g10_daily_v1")));
    const key = Object.keys(d)[0];
    check(Object.keys(d).length === 1 && /^\d{8}-2$/.test(key) && d[key] === 3, `★の保存 ${JSON.stringify(d)}`);
    check(await page.evaluate(() => localStorage.getItem("g10_prog_v1")) === null, "きょうのステージは ふつうの 進み具合に 入らない");
    await page.click("#clSel"); await page.waitForSelector(".gbtn");
    check((await page.locator('.gbtn[data-k=daily][data-lv="2"] .st').innerText()).includes("★★★"), "えらぶ画面に ★★★");
    check((await page.locator('.gbtn[data-k=daily][data-lv="1"] .st').innerText()).includes("☆☆☆"), "ほかは ☆☆☆");
    check((await page.locator('.gbtn[data-k=rand] .st').count()) === 0, "ランダムには ★を 出さない");
    // もう一度（同じ seed）
    await page.click('.gbtn[data-k=daily][data-lv="2"]'); await waitPlay(page);
    const a = await stage(page); await page.click("#bReset"); const b = await stage(page);
    check(a.map === b.map && b.custom.seed === a.custom.seed, "ぜんぶ やりなおしでも 同じステージ");
    // 失敗しても ★は へらない（クリアせず 戻る → 保存は そのまま）
    check(JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem("g10_daily_v1")))) === JSON.stringify(d), "★は へらない");
    check(errs.length === 0, `★: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }
  // ふつうの ステージも いままでどおり（進み具合・★・つぎへ）
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(URL10); await page.click("#bPlay"); await page.waitForSelector(".lv");
    await page.click('.lv[data-i="0"]'); await waitPlay(page);
    check((await page.locator("#lvName").innerText()).startsWith("Lv.1"), "ふつうの ステージ名");
    await playBot(page); await page.waitForSelector("#clear:not([hidden])");
    check(/^🎉 クリア/.test(await page.locator("#clT").innerText()) && (await page.locator("#clNext").innerText()).includes("つぎへ"), "ふつうの クリア画面");
    check(JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem("g10_prog_v1")))) === '{"0":3}', "ふつうの 進み具合");
    await page.click("#clNext"); await waitPlay(page);
    check((await page.locator("#lvName").innerText()).startsWith("Lv.2"), "つぎへ → Lv.2");
    check(errs.length === 0, `ふつう: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ===== 4) ランダム：つぎのランダム／ばんごう入力 =====
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    await page.click('.gbtn[data-k=rand][data-lv="1"]'); await waitPlay(page);
    const s1 = (await stage(page)).custom.seed;
    await playBot(page); await page.waitForSelector("#clear:not([hidden])");
    check(await page.locator("#clNext").isVisible() && /ランダム/.test(await page.locator("#clNext").innerText()), "ランダム: つぎのランダム が ある");
    await page.click("#clNext"); await waitPlay(page);
    const st2 = await stage(page);
    check(st2.custom.seed !== s1 && st2.custom.level === 1 && st2.custom.kind === "rand", "つぎのランダム: ちがう seed・同じ むずかしさ");
    // もういちど → 同じ
    await playBot(page); await page.waitForSelector("#clear:not([hidden])"); await page.click("#clRetry"); await waitPlay(page);
    const st3 = await stage(page); check(st3.map === st2.map && st3.custom.seed === st2.custom.seed, "もういちど: 同じステージ");
    check((await page.locator("#clear").isHidden()), "もういちど: クリア画面が 消える");
    // ばんごう入力
    await page.click("#exitBtn"); await page.waitForSelector("#gNum");
    async function tryNum(v, lv){
      await page.fill("#gNum", v); await page.selectOption("#gNumLv", String(lv)); await page.click("#gGo");
      await page.waitForTimeout(250);
      return page.evaluate(() => ({play: document.getElementById("s-play").classList.contains("on"), msg: document.getElementById("gMsg").textContent, seed: window.__g10.S && window.__g10.S.custom ? window.__g10.S.custom.seed : null, lv: window.__g10.S && window.__g10.S.custom ? window.__g10.S.custom.level : null, map: window.__g10.S ? window.__g10.S.lv.map.join("\n") : ""}));
    }
    for(const bad of ["", " ", "abc", "-1", "1e3", "4294967296", "99999999999", "12 34", "１２３", "0x10", "1.5", "+5", "١٢٣", "'; drop", "<b>1</b>"]){
      await page.evaluate(() => { document.getElementById("s-play").classList.remove("on"); document.getElementById("s-gen").classList.add("on"); });
      const r = await tryNum(bad, 2);
      check(!r.play && r.msg.length > 3, `へんな番号を はじく ${JSON.stringify(bad)} → ${JSON.stringify(r)}`);
      check(await page.locator("#s-gen.on").count() === 1, `へんな番号 ${JSON.stringify(bad)}: 画面が かわった`);
    }
    const good = {};
    for(const [v, lv] of [["0", 1], ["4294967295", 3], ["0007", 2], ["7", 2], ["  42 ", 1], ["4294967295", 1]]){
      await page.evaluate(() => window.__g10.openGen());
      const r = await tryNum(v, lv);
      check(r.play && r.seed === Number(v.trim()) && r.lv === lv, `よい番号 ${JSON.stringify(v)}: ${JSON.stringify({play: r.play, seed: r.seed, lv: r.lv, msg: r.msg})}`);
      good[v + "/" + lv] = r.map;
    }
    check(good["0007/2"] === good["7/2"], "0007 と 7 は 同じステージ");
    check(good["4294967295/3"] !== good["4294967295/1"], "同じ番号でも むずかしさが ちがえば ちがうステージ");
    check(errs.length === 0, `ランダム: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ===== 5) WebAssembly が 読めない =====
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    await ctx.route("**/g10gen.wasm", (r) => r.abort());
    await page.click('.gbtn[data-k=daily][data-lv="1"]');
    await page.waitForFunction(() => /つくれませんでした/.test(document.getElementById("gMsg").textContent), null, {timeout: 8000});
    check(await page.locator("#s-gen.on").count() === 1, "wasm なし: 画面は えらぶ画面のまま");
    await ctx.unroute("**/g10gen.wasm");
    await ctx.route("**/g10gen.wasm", (r) => r.fulfill({status: 200, contentType: "application/wasm", body: Buffer.from("not wasm at all")}));
    await page.click('.gbtn[data-k=daily][data-lv="1"]');
    await page.waitForFunction(() => /つくれませんでした/.test(document.getElementById("gMsg").textContent), null, {timeout: 8000});
    check(true, "こわれた wasm: 文で しらせる");
    await ctx.unroute("**/g10gen.wasm");
    await page.click('.gbtn[data-k=daily][data-lv="1"]'); await waitPlay(page);
    check(true, "つながったら 直る");
    // ふつうの ステージは wasm なしでも あそべる
    await ctx.route("**/g10gen.wasm", (r) => r.abort());
    await page.evaluate(() => window.__g10.start(0)); await waitPlay(page);
    await playBot(page); await page.waitForSelector("#clear:not([hidden])");
    check(true, "wasm が なくても ふつうの ステージは あそべる");
    check(errs.length === 0, `wasm失敗: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ===== 6) もどる・Esc・キー =====
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    await page.click('.gbtn[data-k=rand][data-lv="2"]'); await waitPlay(page);
    await page.keyboard.press("Escape");   // ＋ボタン相当
    check(await page.locator("#s-gen.on").count() === 1, "Esc: プレイ中 → えらぶ画面");
    await page.click("#exitBtn"); check(await page.locator("#s-title.on").count() === 1, "もどる: えらぶ → タイトル");
    await page.click("#bGen"); await page.click('.gbtn[data-k=rand][data-lv="3"]'); await waitPlay(page);
    await page.click("#exitBtn"); check(await page.locator("#s-gen.on").count() === 1, "もどる: プレイ中 → えらぶ画面（ステージえらびではない）");
    // ヒント・ぶんしん・やりなおしが 生成ステージでも 動く
    await page.click('.gbtn[data-k=daily][data-lv="2"]'); await waitPlay(page);
    await page.click("#bHint");
    check(await page.evaluate(() => !!window.__g10.S.hint), "ヒントが 出る");
    await page.keyboard.press("ArrowRight"); await page.keyboard.press("Enter"); await page.keyboard.press("r");
    check(errs.length === 0, `キー: エラー ${errs.slice(0, 2)}`);
    // 連打：えらぶ → ステージ → もどる を 80回
    for(let i = 0; i < 80; i++){
      await page.evaluate((i) => { window.__g10.openGen(); }, i);
      await page.evaluate((i) => document.querySelector(`.gbtn[data-k=rand][data-lv="${1 + i % 3}"]`).click(), i);
      if(i % 10 === 0) await waitPlay(page);
    }
    await waitPlay(page); await page.waitForTimeout(500);
    check(errs.length === 0, `連打: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ===== 7) こわれた保存データ =====
  for(const bad of ["{", "null", "[]", "123", "\"x\"", "{\"20261125-1\":\"x\"}", "{\"a\":null}", JSON.stringify(Object.fromEntries(Array.from({length: 300}, (_, i) => [String(20260101 + i) + "-1", 3])))]){
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(URL10); await page.evaluate((b) => localStorage.setItem("g10_daily_v1", b), bad); await page.reload();
    await page.click("#bGen"); await page.waitForSelector(".gbtn");
    const t = await page.locator("#s-gen").innerText();
    check(!/NaN|undefined|null|\[object/.test(t), `こわれた保存 ${bad.slice(0, 20)}: へんな文字 ${t.match(/NaN|undefined|null|\[object/)}`);
    await page.click('.gbtn[data-k=daily][data-lv="1"]'); await waitPlay(page);
    await playBot(page); await page.waitForSelector("#clear:not([hidden])");
    const after = await page.evaluate(() => localStorage.getItem("g10_daily_v1"));
    check(after && Object.keys(JSON.parse(after)).length <= 91, `こわれた保存 ${bad.slice(0, 20)}: 保存が ふくらむ ${after && Object.keys(JSON.parse(after)).length}`);
    check(errs.length === 0, `こわれた保存 ${bad.slice(0, 20)}: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }
  {   // localStorage が 使えない
    const {ctx, page, errs} = await newPage(browser);
    await ctx.addInitScript(() => { try{ Object.defineProperty(window, "localStorage", {get(){ throw new DOMException("denied", "SecurityError"); }}); }catch(_e){} });
    await page.goto(URL10); await page.waitForSelector("#bGen");
    await page.click("#bGen"); await page.waitForSelector(".gbtn");
    await page.click('.gbtn[data-k=daily][data-lv="1"]'); await waitPlay(page);
    await playBot(page); await page.waitForSelector("#clear:not([hidden])");
    check(true, "保存できない端末でも あそべる");
    check(errs.length === 0, `保存できない: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ===== 8) 画面サイズ：えらぶ画面・遊ぶ画面（いちばん 広い ステージ）が はみ出さない =====
  const sizes = [[320, 568], [375, 667], [414, 896], [768, 1024], [667, 375], [1280, 720]];
  // 横はばが いちばん 広い むずかしいステージを さがす
  const widest = await (async () => {
    const {ctx, page} = await newPage(browser);
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    await page.evaluate(() => window.__g10.startGen("rand", 3, 1)); await waitPlay(page);
    let best = {w: 0, seed: 1};
    for(let sd = 1; sd < 400; sd++){
      const w = await page.evaluate(([s]) => window.G10Gen.load().then((a) => { const l = a.gen(s, 3); return l ? l.map[0].length : 0; }), [sd]);
      if(w > best.w) best = {w, seed: sd};
    }
    await ctx.close(); return best;
  })();
  check(widest.w <= 18, `いちばん広い ステージ ${widest.w} マス（18まで）`);
  for(const [w, h] of sizes){
    const {ctx, page, errs} = await newPage(browser, {ctx: {viewport: {width: w, height: h}, hasTouch: w < 800, isMobile: w < 800}});
    await page.goto(URL10); await page.click("#bGen"); await page.waitForSelector(".gbtn");
    const m1 = await page.evaluate(() => { const p = document.getElementById("s-gen"); return {sw: p.scrollWidth, cw: p.clientWidth, dw: document.documentElement.scrollWidth, vw: innerWidth}; });
    check(m1.sw <= m1.cw + 1 && m1.dw <= m1.vw + 1, `サイズ ${w}x${h}: えらぶ画面が はみ出す ${JSON.stringify(m1)}`);
    const small = await page.evaluate(() => [...document.querySelectorAll("#s-gen button")].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height < 36; }).length);
    check(small === 0, `サイズ ${w}x${h}: 小さすぎる ボタン ${small}`);
    await page.evaluate(([sd]) => window.__g10.startGen("rand", 3, sd), [widest.seed]); await waitPlay(page); await page.waitForTimeout(250);
    const m2 = await page.evaluate(() => { const c = document.getElementById("cv"), r = c.getBoundingClientRect(), S = window.__g10.S; return {cw: r.width, ch: r.height, W: S.g.W, H: S.g.H, dw: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight, bottom: document.getElementById("ctrl").getBoundingClientRect().bottom}; });
    check(m2.dw <= m2.vw + 1, `サイズ ${w}x${h}: 遊ぶ画面が 横にはみ出す`);
    check(m2.bottom <= m2.vh + 1, `サイズ ${w}x${h}: 操作ボタンが 画面の外`);
    const ts = Math.min(m2.cw / m2.W, m2.ch / m2.H);
    check(ts >= (w < 400 && h > w ? 17 : h < 400 ? 15 : 22), `サイズ ${w}x${h}: マスが 小さすぎる ${ts.toFixed(1)}px（${m2.W}マス）`);
    check(errs.length === 0, `サイズ ${w}x${h}: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n結果: OK ${ok} ／ NG ${ng}（${Math.round((Date.now() - t0) / 1000)}秒）`);
  if(ng){ console.log(fails.slice(0, 20).join("\n")); process.exit(1); }
})().catch((e) => { console.error("テスト自体が 失敗:", e); process.exit(2); });
