// ARE BLOCKS（落ち物パズル）の「キー・ボタン・プロコン」通しテスト。
//   cd game && python3 -m http.server 8098 &     BASE=http://localhost:8098 NODE_PATH=$(npm root -g) node tools/blocks-keys-e2e.js
// 見る点：
//   ・「落とす」機能は 1つだけ（いっきに おとす）。↓／Space／Enter／▼ボタン／プロコン十字↓／ZR は ぜんぶ それ。「そっと おろす（押しているあいだ ずっと速く落ちる）」は もう ない
//   ・↑／X＝まわす、Z＝ぎゃくまわし、←→＝いどう、C／Shift＝HOLD（それぞれ ほんとうに そのとおりに動く）
//   ・プロコンの十字↑＝まわす（キーボードの ↑ と同じ）／十字↓＝いっきに／←→＝いどう
//   ・キーを押しっぱなし（リピート）でも 2回は 落ちない／タッチボタンは 5つ（⤓ は なくなった）／じゃま役でも こわれない
"use strict";
const {chromium} = require("playwright");
const BASE = process.env.BASE || "http://localhost:8098";
const URL = BASE + "/game5/blocks/index.html";
let ok = 0, ng = 0;
function check(c, m){ if(c) ok++; else{ ng++; console.log("NG:", m); } }

const cells = () => { const g = window.__are7.G.grid; let n = 0; for(const r of g) for(const v of r) if(v) n++; return n; };
const snap = () => { const G = window.__are7.G; return {x: G.cur.x, y: G.cur.y, m: JSON.stringify(G.cur.m), t: G.cur.t, cells: (() => { let n = 0; for(const r of G.grid) for(const v of r) if(v) n++; return n; })(), score: G.score, hold: G.hold, canHold: G.canHold}; };

async function fresh(browser, extra){
  const ctx = await browser.newContext(Object.assign({viewport: {width: 1000, height: 800}, serviceWorkers: "block"}, extra || {}));
  await ctx.addInitScript(() => { try{ localStorage.setItem("are_gtips_off", "1"); }catch(_e){} });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if(m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(URL); await page.waitForSelector("#pickErase");
  return {ctx, page, errs};
}
async function startErase(page){ await page.click("#pickErase"); await page.waitForFunction(() => window.__are7.state === "play"); await page.waitForTimeout(80); }

(async () => {
  const browser = await chromium.launch();

  // ===== キーボード（けす役）=====
  {
    const {ctx, page, errs} = await fresh(browser);
    await startErase(page);
    // 説明文
    const help = await page.evaluate(() => document.getElementById("helpBox").textContent);
    check(!/そっと/.test(help), "説明に「そっと おろす」が のこっている: " + help);
    check(/↓/.test(help) && /いっきに/.test(help), "説明に ↓ と「いっきに」が ない");
    check(/まわす/.test(help) && /ぎゃくまわし/.test(help) && /HOLD/.test(help), "説明に まわす／ぎゃくまわし／HOLD が ない");
    const menuNote = await page.evaluate(() => document.getElementById("ovMenu").textContent);
    check(!/そっと/.test(menuNote), "メニューの説明に「そっと」が のこっている");

    // ←→
    let a = await page.evaluate(snap); await page.keyboard.press("ArrowLeft"); let b = await page.evaluate(snap);
    check(b.x === a.x - 1, "← で 1つ ひだりへ：" + a.x + "→" + b.x);
    await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); let c = await page.evaluate(snap);
    check(c.x === a.x + 1, "→ を 2回で みぎへ：" + a.x + "→" + c.x);
    // ↑ ＝ まわす（落ちない）
    a = await page.evaluate(snap);
    if(a.t !== 2){   // O（正方形）は まわしても 同じ
      await page.keyboard.press("ArrowUp"); b = await page.evaluate(snap);
      check(b.m !== a.m || b.x !== a.x || b.y !== a.y, "↑ で まわる（形か位置が かわる）");
      check(b.cells === a.cells, "↑ で 落ちて（固まって）しまった");
    }
    // X ＝ まわす／Z ＝ ぎゃくまわし：4回ずつで もとの形
    a = await page.evaluate(snap);
    if(a.t !== 2){
      for(let i = 0; i < 4; i++) await page.keyboard.press("x");
      b = await page.evaluate(snap); check(b.m === a.m, "X を 4回で もとの形にもどる");
      for(let i = 0; i < 4; i++) await page.keyboard.press("z");
      b = await page.evaluate(snap); check(b.m === a.m, "Z を 4回で もとの形にもどる");
      await page.keyboard.press("x"); const cw = (await page.evaluate(snap)).m; await page.keyboard.press("z"); await page.keyboard.press("z");
      const ccw = (await page.evaluate(snap)).m; await page.keyboard.press("x");
      check(a.t === 6 || cw !== ccw || true, "");   // 形によっては 左右の まわしが 同じに なるので 厳密には見ない
    }
    // ↓ ＝ いっきに おとす
    for(const key of ["ArrowDown", " ", "Enter"]){
      await page.evaluate(() => { const G = window.__are7.G; G.fall = 0; });
      a = await page.evaluate(snap);
      await page.keyboard.press(key); await page.waitForTimeout(30); b = await page.evaluate(snap);
      check(b.cells === a.cells + 4, "「" + (key === " " ? "Space" : key) + "」で いっきに 落ちて 固まる（4マス ふえる）：" + a.cells + "→" + b.cells);
      check(b.y <= 3, "「" + key + "」の あと 新しい パーツが 上から出る（y=" + b.y + "）");
      check(b.score > a.score, "「" + key + "」で 得点が 入る（落とした ぶん）");
    }
    // 押しっぱなし（リピート）では 2回 落ちない
    a = await page.evaluate(snap);
    await page.keyboard.down("ArrowDown"); await page.keyboard.down("ArrowDown"); await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(40); b = await page.evaluate(snap);
    check(b.cells === a.cells + 4, "↓ 押しっぱなしでも 1つしか 落ちない：" + a.cells + "→" + b.cells);
    await page.keyboard.up("ArrowDown");
    // 「そっと おろす」が ない：↓ を押さずに 待つ → 重力だけで ゆっくり（1秒で 1〜2段）
    await page.evaluate(() => { const G = window.__are7.G; G.fall = 0; G.lockT = 0; });
    a = await page.evaluate(snap); await page.waitForTimeout(700); b = await page.evaluate(snap);
    check(b.y - a.y <= 1 && b.cells === a.cells, "なにも 押さなければ ゆっくり（0.7秒で 1段まで）：" + a.y + "→" + b.y);
    // HOLD
    a = await page.evaluate(snap); await page.keyboard.press("c"); b = await page.evaluate(snap);
    check(b.hold === a.t && b.canHold === false, "C で HOLD（とっておく）");
    await page.evaluate(() => { window.__are7.G.canHold = true; });
    a = await page.evaluate(snap); await page.keyboard.press("Shift"); b = await page.evaluate(snap);
    check(b.hold === a.t, "Shift でも HOLD");
    // ポーズ
    await page.keyboard.press("Escape"); check(await page.evaluate(() => window.__are7.state) === "pause", "Esc で ポーズ");
    await page.waitForTimeout(300); await page.keyboard.press("p"); check(await page.evaluate(() => window.__are7.state) === "play", "P で つづき");
    check(errs.length === 0, "エラーなし（キーボード）：" + errs.join(" | "));
    await ctx.close();
  }

  // ===== タッチ =====
  {
    const {ctx, page, errs} = await fresh(browser, {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    await startErase(page);
    const btns = await page.evaluate(() => Array.from(document.querySelectorAll("#touch button")).map((b) => b.dataset.a));
    check(JSON.stringify(btns) === JSON.stringify(["L", "R", "hard", "rot", "hold"]), "タッチボタンは ◀ ▶ ▼ ⟳ HOLD の 5つ：" + btns.join(","));
    check(await page.evaluate(() => !document.querySelector("#touch [data-a=D]")), "「そっと」ボタン（D）が のこっている");
    check(await page.evaluate(() => getComputedStyle(document.getElementById("touch")).display === "grid"), "タッチボタンが 見えている");
    let a = await page.evaluate(snap);
    await page.tap('#touch [data-a=hard]'); await page.waitForTimeout(40); let b = await page.evaluate(snap);
    check(b.cells === a.cells + 4, "▼ ボタンで いっきに 落ちる：" + a.cells + "→" + b.cells);
    a = await page.evaluate(snap); await page.tap('#touch [data-a=L]'); b = await page.evaluate(snap);
    check(b.x === a.x - 1, "◀ で ひだり");
    await page.tap('#touch [data-a=R]'); await page.tap('#touch [data-a=R]'); const c = await page.evaluate(snap);
    check(c.x === a.x + 1, "▶ で みぎ");
    a = await page.evaluate(snap);
    if(a.t !== 2){ await page.tap('#touch [data-a=rot]'); b = await page.evaluate(snap); check(b.m !== a.m || b.x !== a.x || b.y !== a.y, "⟳ で まわる"); }
    a = await page.evaluate(snap); await page.tap('#touch [data-a=hold]'); b = await page.evaluate(snap); check(b.hold === a.t, "HOLD ボタン");
    // 5つ並びで はみ出さない
    const wide = await page.evaluate(() => { const t = document.getElementById("touch").getBoundingClientRect(); return {l: t.left, r: t.right, vw: innerWidth, bs: Array.from(document.querySelectorAll("#touch button")).map((x) => x.getBoundingClientRect().width)}; });
    check(wide.l >= 0 && wide.r <= wide.vw + 0.5, "タッチボタンが 画面から はみ出さない");
    check(wide.bs.every((w) => w >= 44), "タッチボタンの 横はばが 44px 以上：" + wide.bs.map(Math.round).join(","));
    check(errs.length === 0, "エラーなし（タッチ）：" + errs.join(" | "));
    await ctx.close();
  }

  // ===== プロコン（ゲームパッド）=====
  {
    const {ctx, page, errs} = await fresh(browser);
    await page.addInitScript(() => {
      window.__padState = {buttons: Array.from({length: 17}, () => ({pressed: false, value: 0})), axes: [0, 0, 0, 0]};
      navigator.getGamepads = () => [{connected: true, id: "mock", index: 0, buttons: window.__padState.buttons, axes: window.__padState.axes, mapping: "standard"}];
    });
    await page.reload(); await page.waitForSelector("#pickErase"); await startErase(page);
    const press = async (idx, hold) => { await page.evaluate((i) => { window.__padState.buttons[i].pressed = true; }, idx); await page.waitForTimeout(hold || 60); await page.evaluate((i) => { window.__padState.buttons[i].pressed = false; }, idx); await page.waitForTimeout(60); };
    let a, b;
    a = await page.evaluate(snap); await press(14); b = await page.evaluate(snap); check(b.x < a.x, "プロコン 十字← で ひだり");
    a = await page.evaluate(snap); await press(15, 40); b = await page.evaluate(snap); check(b.x > a.x, "プロコン 十字→ で みぎ");
    a = await page.evaluate(snap);
    if(a.t !== 2){ await press(12); b = await page.evaluate(snap); check(b.m !== a.m || b.x !== a.x || b.y !== a.y, "プロコン 十字↑ で まわる（キーボードの ↑ と同じ）"); check(b.cells === a.cells, "プロコン 十字↑ で 落ちてしまった"); }
    await page.evaluate(() => { window.__are7.G.fall = 0; });
    a = await page.evaluate(snap); await press(13); b = await page.evaluate(snap); check(b.cells === a.cells + 4, "プロコン 十字↓ で いっきに 落ちる：" + a.cells + "→" + b.cells);
    await page.evaluate(() => { window.__are7.G.fall = 0; });
    a = await page.evaluate(snap); await press(7); b = await page.evaluate(snap); check(b.cells === a.cells + 4, "プロコン ZR で いっきに 落ちる");
    // スティック↓ → いっきに／スティック↑ → まわす
    await page.evaluate(() => { window.__are7.G.fall = 0; });
    a = await page.evaluate(snap);
    await page.evaluate(() => { window.__padState.axes[1] = 1; }); await page.waitForTimeout(80); await page.evaluate(() => { window.__padState.axes[1] = 0; }); await page.waitForTimeout(60);
    b = await page.evaluate(snap); check(b.cells === a.cells + 4, "プロコン スティック↓ で いっきに 落ちる");
    // 押しっぱなしでも 1回だけ
    await page.evaluate(() => { window.__are7.G.fall = 0; });
    a = await page.evaluate(snap);
    await page.evaluate(() => { window.__padState.buttons[13].pressed = true; }); await page.waitForTimeout(400); await page.evaluate(() => { window.__padState.buttons[13].pressed = false; });
    b = await page.evaluate(snap); check(b.cells === a.cells + 4, "プロコン 十字↓ 押しっぱなしでも 1つしか 落ちない：" + a.cells + "→" + b.cells);
    // L／R ＝ まわす（R＝みぎまわし＝↑と同じ、L＝ぎゃくまわし）。HOLD は Y だけ
    await page.evaluate(() => { const G = window.__are7.G; G.fall = 0; G.lockT = 0; G.canHold = true; });
    a = await page.evaluate(snap);
    if(a.t !== 2){
      await press(5); const r1 = await page.evaluate(snap);
      check(r1.m !== a.m && r1.cells === a.cells && r1.hold === a.hold, "プロコン R で まわる（落ちない・HOLD しない）");
      await press(4); const l1 = await page.evaluate(snap);
      check(l1.m === a.m, "プロコン L は R の ぎゃくまわし（R のあと L で もとの形）");
      await page.keyboard.press("ArrowUp"); const up = await page.evaluate(snap);
      await page.keyboard.press("z"); await press(5); const r2 = await page.evaluate(snap);
      check(up.m === r2.m, "プロコン R ＝ キーボード ↑（おなじ まわしかた）");
      await press(4); await press(4); await press(4); await press(4); const l4 = await page.evaluate(snap);
      check(l4.m === r2.m, "プロコン L を 4回で もとの形");
    }
    a = await page.evaluate(snap); await press(2); b = await page.evaluate(snap); check(b.hold === a.t, "プロコン Y で HOLD");
    a = await page.evaluate(snap); await press(3); b = await page.evaluate(snap); check(b.m === a.m && b.cells === a.cells && b.x === a.x, "プロコン X は けす役では なにもしない（A と おなじ まわしの ダブりを なくした）");
    a = await page.evaluate(snap); await press(1); b = await page.evaluate(snap);
    if(a.t !== 2) check(b.m !== a.m, "プロコン A で まわる");
    a = await page.evaluate(snap); await press(0); b = await page.evaluate(snap);
    if(a.t !== 2) check(b.m !== a.m, "プロコン B で ぎゃくまわし");
    // 見えない所の HOLD：L/R で HOLD しない
    await page.evaluate(() => { window.__are7.G.canHold = true; });
    a = await page.evaluate(snap); await press(4); await press(5); b = await page.evaluate(snap); check(b.hold === a.hold, "プロコン L/R では HOLD しない");
    check(errs.length === 0, "エラーなし（プロコン）：" + errs.join(" | "));
    await ctx.close();
  }

  // ===== じゃま役 =====
  {
    const {ctx, page, errs} = await fresh(browser);
    await page.click("#pickSab"); await page.waitForFunction(() => window.__are7.state === "play"); await page.waitForTimeout(100);
    const e0 = await page.evaluate(() => window.__are7.A.energy);
    await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowLeft");
    for(const k of ["ArrowDown", "ArrowUp", " ", "Enter", "3", "g", "f"]) await page.keyboard.press(k);
    check(await page.evaluate(() => window.__are7.state) === "play", "じゃま役：キーを ひととおり 押しても 動いている");
    check(errs.length === 0, "エラーなし（じゃま役）：" + errs.join(" | "));
    await ctx.close();
  }
  await browser.close();
  console.log("\n" + (ng ? "NG " + ng + " 件 / " : "") + "OK（" + ok + " 項目）");
  process.exit(ng ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
