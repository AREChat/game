// game14 UI テスト（Playwright）
//   NODE_PATH=$(npm root -g) node tools/g14-ui-test.js [sweep|events|pad|kbd|ptr|long|daily|all] [--shots=DIR]
// 前提：ローカルサーバー http://localhost:8098/ で /home/claude/game を配信していること
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const BASE = process.env.BASE || "http://localhost:8098/game14/index.html";
const BOT = fs.readFileSync(path.join(__dirname, "g14-bot.js"), "utf8");
const SH = (process.argv.find(a => a.startsWith("--shots=")) || "").split("=")[1] || "";
if (SH) fs.mkdirSync(SH, { recursive: true });
let fails = 0, oks = 0, warns = 0;
const ok = (c, m) => { if (c) oks++; else { fails++; console.log("  ✗ " + m); } };
const warn = (m) => { warns++; console.log("  △ " + m); };
const LANGS = ["ja", "en", "zh", "ko"];
const VPS = { phone: { width: 390, height: 780, touch: 1 }, small: { width: 320, height: 568, touch: 1 }, tablet: { width: 820, height: 1180, touch: 1 }, pc: { width: 1280, height: 720 }, land: { width: 780, height: 360, touch: 1 } };

const PADINIT = `(function(){window.__pad={buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0})),axes:[0,0,0,0]};navigator.getGamepads=function(){var p=window.__pad;return [{id:"Pro Controller",index:0,connected:true,mapping:"standard",timestamp:performance.now(),buttons:p.buttons,axes:p.axes}];};window.padPress=function(i,ms){window.__pad.buttons[i].pressed=true;return new Promise(function(r){setTimeout(function(){window.__pad.buttons[i].pressed=false;setTimeout(r,90)},ms||120)})};})();`;
const SPEED = `(function(){var t=0;window.requestAnimationFrame=function(cb){return setTimeout(function(){t+=33;cb(t);},0)};window.cancelAnimationFrame=function(id){clearTimeout(id)};})();`;
const BTN = { B: 0, A: 1, Y: 2, X: 3, PLUS: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

async function mk(br, o) {
  o = o || {}; const vp = VPS[o.vp || "phone"];
  const ctx = await br.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.touch, isMobile: !!vp.touch && vp.width < 700, deviceScaleFactor: o.dsf || 1, storageState: o.state });
  await ctx.addInitScript(([lang, age, fast]) => { try { if (lang) localStorage.setItem("are_lang", lang); if (age) localStorage.setItem("are_age20", "1"); } catch (e) { } if (fast) window.__stFast = true; }, [o.lang || "ja", o.age !== false, o.fast !== false]);
  if (o.pad) await ctx.addInitScript(PADINIT);
  if (o.speed) await ctx.addInitScript(SPEED);
  const pg = await ctx.newPage(); pg.errs = [];
  pg.on("pageerror", e => pg.errs.push("pageerror: " + e)); pg.on("console", m => { if (m.type() === "error") pg.errs.push("console: " + m.text()); });
  pg.on("dialog", d => d.dismiss().catch(() => { }));
  return { ctx, pg, vp };
}
async function load(pg) { await pg.goto(BASE); await pg.waitForFunction(() => window.__st && window.__st.G && window.__st.G.scr, null, { timeout: 8000 }); await pg.waitForTimeout(150); }
const wf = (pg, fn, arg, ms) => pg.waitForFunction(fn, arg, { timeout: ms || 6000 }).then(() => true).catch(() => false);
const scr = pg => pg.evaluate(() => window.__st.G.scr);
const waitPlay = (pg, ms) => wf(pg, () => { const p = __st.play && __st.play(); return p && p.g && p.g.state === "play"; }, null, ms || 6000);
const click = (pg, sel) => pg.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);

// ---- 画面の 監査：生のキー・はみ出し・切れ ----
async function audit(pg, label, o) {
  o = o || {};
  const r = await pg.evaluate(() => {
    const bad = [], vw = innerWidth, vh = innerHeight;
    const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return false; const sc = e.closest(".scr"); if (sc && !sc.classList.contains("on")) return false; const md = e.closest(".modal"); if (md && !md.classList.contains("on")) return false; return true; };
    const txt = document.body.innerText || "";
    const m = txt.match(/undefined|NaN|\[object|\{[a-zA-Z_]+\}|\bnull\b/); if (m) bad.push("raw text: " + m[0]);
    if (document.documentElement.scrollWidth > vw + 1) bad.push("page scrollWidth " + document.documentElement.scrollWidth + " > " + vw);
    const els = document.querySelectorAll(".scr.on button, .scr.on .card, .scr.on .chip, .scr.on h2, .scr.on .hb, .scr.on .cg, .modal.on .box, .modal.on button, .modal.on .cbox, #toast.on");
    els.forEach(e => {
      if (!vis(e)) return; if (e.closest(".tabs")) return;
      const r = e.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) bad.push("off-screen x: " + (e.id || e.className || e.tagName) + " [" + Math.round(r.left) + "," + Math.round(r.right) + "] " + (e.textContent || "").slice(0, 20));
      if ((e.tagName === "BUTTON" || e.classList.contains("hb") || e.classList.contains("chip")) && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "visible") bad.push("clipped text: " + (e.id || e.className) + " " + (e.textContent || "").slice(0, 24));
      if (e.classList.contains("box") && (r.bottom > vh + 1 || r.top < -1)) bad.push("modal box off-screen y: " + Math.round(r.top) + "-" + Math.round(r.bottom) + " vh " + vh);
    });
    return bad;
  });
  if (r.length) { for (const b of r) warn(label + " :: " + b); if (o.strict) ok(false, label + " has layout/text problems"); }
  return r;
}
async function shot(pg, name) { if (SH) await pg.screenshot({ path: path.join(SH, name + ".png") }); }

// ---- 共通：ダイアログ/イベント/シネマを 進める ----
async function drain(pg, ms) {
  const t0 = Date.now(); let steps = 0;
  while (Date.now() - t0 < (ms || 15000)) {
    const r = await pg.evaluate(() => {
      const on = id => document.getElementById(id).classList.contains("on");
      if (on("mCine")) { const b = document.getElementById("cineOk"); if (b) { b.click(); return "cine"; } }
      if (on("mEvent")) {
        const nx = document.getElementById("evNext"); if (nx) { nx.click(); nx.click(); return "dlg"; }
        const ok = document.getElementById("evOk"); if (ok) { ok.click(); return "evok"; }
        const b = [...document.querySelectorAll("#evBox .evch button")].find(x => !x.disabled); if (b) { b.click(); return "choice"; }
      }
      return "idle";
    });
    if (r === "idle") { await pg.waitForTimeout(120); const r2 = await pg.evaluate(() => ["mCine", "mEvent"].some(i => document.getElementById(i).classList.contains("on"))); if (!r2) return steps; }
    else steps++;
    await pg.waitForTimeout(60);
  }
  return -1;
}
async function startRun(pg, name) {
  await click(pg, "#bNew"); await wf(pg, () => window.__st.G.scr === "setup");
  await pg.fill("#nameIn", name || "テスト"); await click(pg, "#bGo");
  await wf(pg, () => document.getElementById("mEvent").classList.contains("on"));
  const n = await drain(pg, 20000); ok(n >= 0, "intro dialog drains"); await wf(pg, () => window.__st.G.scr === "home");
}

// ====================== 1. 4言語×画面サイズ ======================
async function sweep(br) {
  console.log("== sweep: 4 languages × viewports");
  for (const vpn of Object.keys(VPS)) for (const lang of LANGS) {
    const { ctx, pg } = await mk(br, { vp: vpn, lang }); const L = `[${lang}/${vpn}] `;
    await load(pg);
    ok(await pg.evaluate(() => document.documentElement.lang) === lang, L + "html lang");
    ok(!(await pg.evaluate(() => !!document.getElementById("ageGate"))), L + "no age gate when age flag set");
    await audit(pg, L + "title"); if (vpn !== "tablet" && vpn !== "pc") await shot(pg, `${vpn}_${lang}_title`);
    await click(pg, "#bHow"); await audit(pg, L + "how"); await click(pg, "#bHowBack");
    await click(pg, "#bColl"); for (const c of ["end", "ach", "star"]) { await pg.evaluate(c => document.querySelector('#cTabs [data-c="' + c + '"]').click(), c); await audit(pg, L + "coll " + c); } await click(pg, "#bCollBack");
    await click(pg, "#bNew"); await audit(pg, L + "setup"); await shot(pg, `${vpn}_${lang}_setup`);
    await startRun(pg, lang === "ja" ? "ぽんた" : "Pon");
    await audit(pg, L + "home"); await shot(pg, `${vpn}_${lang}_home`);
    await pg.evaluate(() => { const S = window.__st.G.S; S.coins = 6000; S.rk = 5; S.fans = 20000; });
    await click(pg, "#bChal"); await wf(pg, () => window.__st.G.scr === "area");
    const tabs = await pg.evaluate(() => [...document.querySelectorAll("#areaTabs .tab")].map(t => t.dataset.area));
    for (const a of tabs) { await pg.evaluate(a => document.querySelector('#areaTabs .tab[data-area="' + a + '"]').click(), a); await audit(pg, L + "area " + a); if (a === "izakaya" || a === "pachi") await shot(pg, `${vpn}_${lang}_area_${a}`); }
    await click(pg, "#bAreaBack"); await click(pg, "#bTrain"); await audit(pg, L + "train"); await click(pg, "#bTrBack");
    await click(pg, "#bShop"); await audit(pg, L + "shop"); await pg.evaluate(() => { const b = document.querySelector("#shList .buy:not(:disabled)"); if (b) b.click(); }); await audit(pg, L + "shop after buy"); await click(pg, "#bShBack");
    await click(pg, "#bStat"); await audit(pg, L + "stat"); await shot(pg, `${vpn}_${lang}_stat`); await click(pg, "#bStBack");
    await click(pg, "#bHMenu"); await audit(pg, L + "menu"); await pg.keyboard.press("Escape"); await pg.waitForTimeout(200);
    ok(!(await pg.evaluate(() => document.getElementById("mMenu").classList.contains("on"))), L + "Esc closes menu");
    await click(pg, "#bEnd"); await audit(pg, L + "end-day confirm"); await click(pg, "#edNo");
    await click(pg, "#lgBtn"); await pg.waitForTimeout(100); // 言語ボタンで つぎの 言語へ
    ok(await pg.evaluate(() => document.documentElement.lang) === LANGS[(LANGS.indexOf(lang) + 1) % 4], L + "language button cycles");
    ok(pg.errs.length === 0, L + "no JS errors " + pg.errs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}
// ====================== 2. 全イベント・ランクアップ・エンディング（4言語×狭い画面）======================
async function events(br) {
  console.log("== events: every event / rank cinematic / ending in 4 languages");
  for (const vpn of ["small", "phone", "land"]) for (const lang of LANGS) {
    const { ctx, pg } = await mk(br, { vp: vpn, lang }); const L = `[${lang}/${vpn}] `; await load(pg); await startRun(pg);
    const ids = await pg.evaluate(() => ST.EV.map(e => e.id));
    for (const id of ids) {
      await pg.evaluate(id => { const S = __st.G.S; S.pend = [id]; window.__evDone = 0; __st.runPending(() => { window.__evDone = 1; }); }, id);
      const shown = await wf(pg, () => document.getElementById("mEvent").classList.contains("on"));
      ok(shown, L + id + " shows"); if (!shown) continue;
      await audit(pg, L + "event " + id);
      if (vpn === "small" && lang !== "ja" && (id === "izakaya_invite" || id === "rival_final")) await shot(pg, `ev_${lang}_${id}`);
      await pg.evaluate(() => { const b = [...document.querySelectorAll("#evBox .evch button")].find(x => !x.disabled); if (b) b.click(); });
      await wf(pg, () => !!document.getElementById("evOk")); await audit(pg, L + "event result " + id);
      await pg.evaluate(() => document.getElementById("evOk").click());
      ok(await wf(pg, () => window.__evDone === 1 || document.getElementById("mCine").classList.contains("on")), L + id + " completes");
      await drain(pg, 4000);
      await pg.evaluate(() => { const S = __st.G.S; S.hlt = 100; S.over = false; S.endId = null; document.querySelectorAll(".modal.on").forEach(m => m.classList.remove("on")); __st.G.busy = false; __st.show("home"); });
    }
    for (let rk = 1; rk <= 11; rk++) {
      await pg.evaluate(rk => { __st.STU.rankCines([rk], () => { window.__cd = 1; }); }, rk);
      ok(await wf(pg, () => document.getElementById("mCine").classList.contains("on")), L + "cine " + rk); await audit(pg, L + "rank cinema " + rk);
      if (rk === 11 || rk === 6) await shot(pg, `cine_${vpn}_${lang}_${rk}`);
      await pg.evaluate(() => document.getElementById("cineOk").click()); await pg.waitForTimeout(40);
    }
    const ends = await pg.evaluate(() => ST.ENDS.map(e => e.id));
    for (const id of ends) {
      await pg.evaluate(id => { const S = __st.G.S; S.endId = id; S.over = true; S.day = 91; __st.finish(); }, id);
      ok((await scr(pg)) === "end", L + "end screen " + id); await audit(pg, L + "ending " + id);
      const t = await pg.evaluate(() => document.getElementById("endT").textContent + "|" + document.getElementById("endB").textContent);
      ok(t.length > 12 && !/undefined|\{me\}/.test(t), L + "ending text " + id + " (" + t.slice(0, 30) + ")");
      if (id === "hospital" || id === "legend" || id === "rivalfriend") await shot(pg, `end_${vpn}_${lang}_${id}`);
    }
    ok(pg.errs.length === 0, L + "no JS errors " + pg.errs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}
// ====================== 3. プロコン（仮想）だけで 最後まで ======================
async function pad(br) {
  console.log("== pad: gamepad-only play");
  const { ctx, pg } = await mk(br, { vp: "pc", lang: "ja", age: false, pad: true });
  await load(pg);
  const pr = n => pg.evaluate(([i]) => window.padPress(i, 120), [BTN[n]]);
  const focus = () => pg.evaluate(() => { const f = document.querySelector(".are-pad-focus"); return f ? (f.id || f.className || f.tagName) : null; });
  const padTo = async (sel) => {
    for (let i = 0; i < 40; i++) {
      const r = await pg.evaluate((sel) => {
        const f = document.querySelector(".are-pad-focus"), t = document.querySelector(sel);
        if (!t) return { err: "no target " + sel }; if (f && f.matches(sel)) return { done: true }; if (!f) return { dir: "DOWN" };
        const tr = t.getBoundingClientRect(), fr = f.getBoundingClientRect();
        const dx = (tr.left + tr.width / 2) - (fr.left + fr.width / 2), dy = (tr.top + tr.height / 2) - (fr.top + fr.height / 2);
        if (Math.abs(dy) > 12) return { dir: dy > 0 ? "DOWN" : "UP" }; return { dir: dx > 0 ? "RIGHT" : "LEFT" };
      }, sel);
      if (r.err) { console.log("   padTo " + sel + ": " + r.err + " scr=" + await scr(pg)); return false; } if (r.done) return true; await pr(r.dir);
    }
    console.log("   padTo " + sel + " gave up; focus=" + await focus() + " scr=" + await scr(pg) + " modals=" + await pg.evaluate(() => [...document.querySelectorAll(".modal.on,.gki-modal.on")].map(m => m.id || m.className).join(",")));
    return false;
  };
  const padAdvance = async (maxN) => { // モーダルが 出ている あいだ A を 押して 進める
    for (let i = 0; i < (maxN || 40); i++) {
      const on = await pg.evaluate(() => ["mEvent", "mCine"].some(i => document.getElementById(i).classList.contains("on")));
      if (!on) { await pg.waitForTimeout(250); if (!(await pg.evaluate(() => ["mEvent", "mCine"].some(i => document.getElementById(i).classList.contains("on"))))) return true; }
      await pr("A"); await pr("A");
    }
    return false;
  };
  const wnotgate = () => pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !!document.getElementById("ageGate")), "age gate shown (no flag)");
  for (let i = 0; i < 4 && (await focus()) !== "ageYes"; i++) await pr(i === 0 ? "DOWN" : "UP");
  ok((await focus()) === "ageYes", "pad focus reaches 'ageYes' (" + await focus() + ")");
  await pr("A"); await wnotgate(); ok(await pg.evaluate(() => !document.getElementById("ageGate")), "A on ageYes closes the gate");
  ok((await focus()) === "bNew", "title focus = bNew (" + await focus() + ")");
  await pr("A"); await wnotgate(); ok((await scr(pg)) === "setup", "A starts setup");
  ok(await padTo("#bGo"), "pad reaches bGo"); await pr("A"); await wnotgate();
  ok(await padAdvance(40), "intro dialog advances with A only"); ok(await wf(pg, () => __st.G.scr === "home"), "home reached via pad");
  // B / + でメニュー
  await pr("PLUS"); await pg.waitForTimeout(250);
  const mm = await pg.evaluate(() => document.getElementById("mMenu").classList.contains("on")); console.log("   + on home → menu:", mm);
  if (mm) { await pr("B"); await pg.waitForTimeout(300); ok(!(await pg.evaluate(() => document.getElementById("mMenu").classList.contains("on"))), "B closes the menu"); }
  // 学校エリアを 開放して 連打ゲーム（s3）をパッドで
  await pg.evaluate(() => { const S = __st.G.S; S.rk = 3; S.coins = 4000; });
  ok(await padTo("#bChal"), "pad reaches 挑戦 button"); await pr("A"); await wnotgate(); ok((await scr(pg)) === "area", "area screen");
  await pg.evaluate(() => document.querySelector('#areaTabs .tab[data-area="school"]').click()); await pg.waitForTimeout(150);
  ok(await padTo('[data-ch="s3"]'), "pad reaches s3 (mash)"); await pr("A");
  ok(await wf(pg, () => __st.G.scr === "play"), "play started by A");
  ok(await waitPlay(pg), "countdown ends and play begins");
  for (let i = 0; i < 25; i++) await pr("A");
  const pct1 = await pg.evaluate(() => { const g = __st.play(); return g ? g.g.taps : -1; }); ok(pct1 > 0 || (await scr(pg)) !== "play", "mash counts A presses (" + pct1 + ")");
  // ＋で ポーズ → B で 再開
  await pr("PLUS"); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => document.getElementById("mMenu").classList.contains("on") && __st.G.paused), "+ pauses the game");
  ok((await focus()) === "pzResume", "pause focus = pzResume (" + await focus() + ")");
  await pr("B"); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !document.getElementById("mMenu").classList.contains("on") && !__st.G.paused), "B resumes");
  // ＋ → やめる → はい
  await pr("PLUS"); await pg.waitForTimeout(250); ok(await padTo("#pzQuit"), "pad reaches quit"); await pr("A"); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => document.getElementById("mInfo").classList.contains("on")), "quit confirm shown");
  ok(await padTo("#qYes"), "pad reaches qYes"); await pr("A"); await pg.waitForTimeout(400);
  ok((await scr(pg)) === "area", "quit returns to area (" + await scr(pg) + ")");
  const apAfterQuit = await pg.evaluate(() => __st.G.S.ap); ok(apAfterQuit === 3, "quitting does not spend an action (ap " + apAfterQuit + ")");
  // もういちど あそんで クリアまで
  ok(await padTo('[data-ch="s3"]'), "pad reaches s3 again"); await pr("A");
  ok(await wf(pg, () => __st.G.scr === "play"), "play again"); await waitPlay(pg);
  const t0 = Date.now(); while ((await scr(pg)) === "play" && Date.now() - t0 < 60000) { await pr("A"); }
  ok(await wf(pg, () => __st.G.scr === "result", null, 8000), "result screen after mash (" + await scr(pg) + ")");
  ok((await focus()) === "bResOk", "result focus = bResOk (" + await focus() + ")");
  await pr("A"); await wnotgate(); await padAdvance(30);
  ok(["area", "home"].includes(await scr(pg)), "after result returns to a menu (" + await scr(pg) + ")");
  // 設定（🎮）を パッドで ひらく
  await pg.evaluate(() => { __st.show("home"); }); await pg.waitForTimeout(200);
  await pg.evaluate(() => document.getElementById("padBtn").click()); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !!document.querySelector(".gki-modal.on")), "controller settings open");
  await pr("B"); await pg.waitForTimeout(300); ok(await pg.evaluate(() => !document.querySelector(".gki-modal.on")), "B closes settings");
  // 1日を おわらせる（パッド）→ イベント→ ホーム
  ok(await padTo("#bEnd"), "pad reaches 1日おわり"); await pr("A"); await pg.waitForTimeout(250);
  ok(await padTo("#edYes"), "pad reaches edYes"); await pr("A"); await pg.waitForTimeout(500);
  await padAdvance(60); ok(await wf(pg, () => __st.G.scr === "home" || __st.G.scr === "end"), "day ended via pad → home");
  ok(await pg.evaluate(() => __st.G.S.day >= 2), "day advanced");
  ok(pg.errs.length === 0, "no JS errors " + pg.errs.slice(0, 3).join(" | "));
  await ctx.close();
}
// ====================== 4. キーボード ======================
async function kbd(br) {
  console.log("== kbd: keyboard play");
  const { ctx, pg } = await mk(br, { vp: "pc", lang: "en" }); await load(pg); await startRun(pg, "Key");
  await pg.evaluate(() => { __st.G.S.rk = 3; });
  await click(pg, "#bChal"); await pg.evaluate(() => document.querySelector('#areaTabs .tab[data-area="school"]').click());
  await pg.evaluate(() => document.querySelector('[data-ch="s3"]').click()); ok(await wf(pg, () => __st.G.scr === "play"), "mash started");
  ok(await waitPlay(pg), "mash play state");
  for (let i = 0; i < 3; i++) { await pg.keyboard.press("Space"); await pg.waitForTimeout(40); }
  for (let i = 0; i < 3; i++) { await pg.keyboard.press("Enter"); await pg.waitForTimeout(40); }
  const p1 = await pg.evaluate(() => __st.play().g.taps); ok(p1 >= 5, "Space/Enter count as taps (" + p1 + ")");
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => __st.G.paused && document.getElementById("mMenu").classList.contains("on")), "Esc pauses");
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !__st.G.paused), "Esc resumes");
  await pg.evaluate(() => window.dispatchEvent(new Event("blur"))); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => __st.G.paused), "window blur auto-pauses"); await pg.keyboard.press("Escape"); await pg.waitForTimeout(250);
  // キー設定 UI
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(150); await pg.keyboard.press("Escape"); await pg.waitForTimeout(150);
  await pg.evaluate(() => { __st.show("home"); }); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.getElementById("padBtn").click()); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !!document.querySelector(".gki-modal.on")), "settings modal opens");
  await pg.screenshot({ path: SH ? path.join(SH, "gki_settings.png") : "/dev/null" }).catch(() => { });
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(250); ok(await pg.evaluate(() => !document.querySelector(".gki-modal.on")), "Esc closes settings");
  ok(pg.errs.length === 0, "no JS errors " + pg.errs.slice(0, 3).join(" | "));
  await ctx.close();
}
// ====================== 5. タッチ・マウス ======================
async function ptr(br) {
  console.log("== ptr: touch & mouse");
  for (const vpn of ["phone", "pc"]) {
    const { ctx, pg, vp } = await mk(br, { vp: vpn, lang: "zh" }); const L = `[${vpn}] `; await load(pg); await startRun(pg, "Tap");
    await pg.evaluate(() => { __st.G.S.rk = 3; });
    for (const [area, id, kind] of [["school", "s3", "mash"], ["town", "t2", "timing"], ["town", "t4", "react"]]) {
      await click(pg, "#bChal"); await pg.evaluate(a => document.querySelector('#areaTabs .tab[data-area="' + a + '"]').click(), area);
      await pg.evaluate(id => document.querySelector('[data-ch="' + id + '"]').click(), id); ok(await wf(pg, () => __st.G.scr === "play"), L + kind + " started");
      ok(await waitPlay(pg), L + kind + " play state");
      const box = await pg.evaluate(() => { const r = document.getElementById("gc").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      ok(box.w > 200 && box.h > 150, L + "canvas size " + Math.round(box.w) + "x" + Math.round(box.h));
      await audit(pg, L + "play " + kind);
      ok(await pg.evaluate(() => document.body.classList.contains("playing") && getComputedStyle(document.getElementById("exitBtn")).display === "none"), L + "play screen hides top buttons");
      // 一時停止ボタン（先に）
      const pb = await pg.evaluate(() => { const r = document.getElementById("bPause").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; });
      ok(pb.w >= 36 && pb.h >= 36, L + kind + " pause button tappable " + Math.round(pb.w) + "x" + Math.round(pb.h));
      if (vp.touch) await pg.touchscreen.tap(pb.x, pb.y); else await pg.mouse.click(pb.x, pb.y);
      await pg.waitForTimeout(250); ok(await pg.evaluate(() => __st.G.paused), L + kind + " pause button pauses");
      await audit(pg, L + "pause modal");
      const frozen = await pg.evaluate(() => __st.play().g.t); await pg.waitForTimeout(300); ok((await pg.evaluate(() => __st.play().g.t)) === frozen, L + kind + " game time frozen while paused");
      await pg.evaluate(() => document.getElementById("pzResume").click()); await pg.waitForTimeout(150); ok(await pg.evaluate(() => !__st.G.paused), L + kind + " resume button");
      // タップ
      await pg.evaluate(() => { window.__pn = 0; if (!window.__pw) { window.__pw = 1; const o = ST.gamePtr; ST.gamePtr = function (g, x, y, k) { if (k === "down") window.__pn++; return o(g, x, y, k); }; } });
      for (let i = 0; i < 6; i++) { if (vp.touch) await pg.touchscreen.tap(box.x + box.w / 2, box.y + box.h / 2); else await pg.mouse.click(box.x + box.w / 2, box.y + box.h / 2); await pg.waitForTimeout(kind === "mash" ? 40 : 160); }
      const pn = await pg.evaluate(() => ({ n: window.__pn, taps: __st.play() ? __st.play().g.taps : -1 })); ok(pn.n >= 5, L + kind + " canvas taps reach the game (" + pn.n + ")"); if (kind === "mash") ok(pn.taps >= 5, L + "mash counts taps (" + pn.taps + ")");
      await pg.evaluate(() => { if (__st.G.scr === "play") { __st.STU.pause(); } }); await pg.waitForTimeout(150);
      await pg.evaluate(() => { const q = document.getElementById("pzQuit"); if (q) q.click(); const y = document.getElementById("qYes"); if (y) y.click(); }); await pg.waitForTimeout(250);
      ok(await pg.evaluate(() => __st.G.scr !== "play"), L + "quit leaves play");
    }
    ok(pg.errs.length === 0, L + "no JS errors " + pg.errs.slice(0, 3).join(" | "));
    await ctx.close();
  }
}
// ====================== 6/7. 通しプレイ（UI操作 + bot）======================
async function installBot(pg, skill) {
  await pg.addScriptTag({ content: BOT });
  await pg.evaluate((skill) => {
    if (window.__botInstalled) { window.__skill = skill; return; } window.__botInstalled = true; window.__skill = skill;
    const nG = ST.newGame, sG = ST.stepGame;
    ST.newGame = function (type, o) { const g = nG(type, o); window.__bot = G14BOT.make(type, window.__skill, (Math.random() * 1e6) | 0); return g; };
    ST.stepGame = function (g, dt) { sG(g, dt); if (window.__bot) window.__bot(g, dt); };
  }, skill);
}
async function driveUntil(pg, cond, maxMs, log) {
  const t0 = Date.now(); let acts = 0, wd = Date.now(), lastSig = "";
  while (Date.now() - t0 < maxMs) {
    if (await pg.evaluate(cond)) return { ok: true, acts };
    const st = await pg.evaluate(() => {
      const on = id => document.getElementById(id).classList.contains("on"), G = __st.G, S = G.S;
      const sig = G.scr + "|" + (S ? S.day + "/" + S.ap : "") + "|" + ["mCine", "mEvent", "mInfo", "mMenu"].filter(on).join(",");
      if (on("mCine")) { document.getElementById("cineOk").click(); return { sig, a: "cine" }; }
      if (on("mEvent")) {
        const nx = document.getElementById("evNext"); if (nx) { nx.click(); nx.click(); return { sig, a: "dlg" }; }
        const ok_ = document.getElementById("evOk"); if (ok_) { ok_.click(); return { sig, a: "evok" }; }
        const bs = [...document.querySelectorAll("#evBox .evch button")].filter(x => !x.disabled); if (bs.length) { bs[Math.floor(Math.random() * bs.length)].click(); return { sig, a: "choice" }; }
        return { sig, a: "wait" };
      }
      if (on("mInfo") || on("mMenu")) { if (G.scr === "play") return { sig, a: "wait" }; document.querySelectorAll(".modal.on").forEach(m => m.classList.remove("on")); return { sig, a: "close" }; }
      if (G.scr === "result") { document.getElementById("bResOk").click(); return { sig, a: "result" }; }
      if (G.scr === "play" || G.busy) return { sig, a: "wait" };
      if (G.scr === "home") {
        if (S.ap <= 0) { document.getElementById("bEnd").click(); return { sig, a: "endday" }; }
        if (S.cond < 32 || ST.tired(S)) { document.getElementById("bRest").click(); return { sig, a: "rest" }; }
        if (S.coins > 300) { document.getElementById("bShop").click(); return { sig, a: "shop" }; }
        document.getElementById("bChal").click(); return { sig, a: "chal" };
      }
      if (G.scr === "shop") { for (let k = 0; k < 6; k++) { const b = [...document.querySelectorAll("#shList .buy")].find(x => !x.disabled && x.classList.contains("gold")); if (!b) break; b.click(); } document.getElementById("bShBack").click(); return { sig, a: "shopdone" }; }
      if (G.scr === "area") {
        const open = ST.openAreas(S); let best = null, bestSc = 9;
        for (let i = open.length - 1; i >= 0; i--) {
          if (open[i].id === "pachi") continue; G.areaSel = open[i].id; __st.show("area");
          const cards = [...document.querySelectorAll("#chList .card:not(:disabled)")];
          for (const c of cards) { const earned = c.querySelectorAll(".stars span:not(.off)").length; if (earned < bestSc) { bestSc = earned; best = c; } }
          if (best && bestSc === 0) break;   // いちばん 高い エリアの 未クリアを 優先
        }
        if (!best) { G.areaSel = "town"; __st.show("area"); best = document.querySelector("#chList .card:not(:disabled)"); }
        if (best) { best.click(); return { sig, a: "start" }; } document.getElementById("bAreaBack").click(); return { sig, a: "noch" };
      }
      if (G.scr === "end") return { sig, a: "end" };
      return { sig, a: "idle:" + G.scr };
    });
    acts++; if (st.sig !== lastSig) { lastSig = st.sig; wd = Date.now(); } else if (Date.now() - wd > 45000) { console.log("   stuck at", st.sig, st.a); return { ok: false, acts, stuck: st.sig }; }
    await pg.waitForTimeout(st.a === "wait" ? 150 : 70);
  }
  return { ok: false, acts, timeout: true };
}
async function longrun(br) {
  console.log("== long: UI auto-play with bot (phase 1: day 1→10 by UI, save/continue, phase 2: fast-forward, phase 3: finish via UI)");
  const { ctx, pg } = await mk(br, { vp: "phone", lang: "ja", speed: true }); await load(pg); await installBot(pg, .55);
  await startRun(pg, "ロング");
  const r1 = await driveUntil(pg, () => __st.G.scr === "home" && __st.G.S.day >= 10 && __st.G.S.ap === 3, 240000);
  console.log("   phase1:", JSON.stringify(r1), await pg.evaluate(() => { const S = __st.G.S; return { day: S.day, fans: S.fans, rk: S.rk, chal: S.cnt.chal, coins: S.coins }; }));
  ok(r1.ok, "UI auto-play reaches day 10"); await audit(pg, "[long] home day10");
  const snap = await pg.evaluate(() => { const S = __st.G.S; return { day: S.day, fans: S.fans, rk: S.rk }; });
  // 保存→再読み込み→つづきから
  await pg.reload(); await pg.waitForFunction(() => window.__st && __st.G.scr === "title", null, { timeout: 8000 }); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => getComputedStyle(document.getElementById("bCont")).display !== "none"), "Continue button appears after reload");
  await click(pg, "#bCont"); await wf(pg, () => __st.G.scr === "home"); await drain(pg, 8000);
  const s2 = await pg.evaluate(() => { const S = __st.G.S; return { day: S.day, fans: S.fans, rk: S.rk }; });
  ok(s2.day === snap.day && s2.fans === snap.fans && s2.rk === snap.rk, "save/continue restores state " + JSON.stringify(snap) + " vs " + JSON.stringify(s2));
  // フェーズ2：コアだけで day 86 まで
  await installBot(pg, .55);
  const ff = await pg.evaluate(() => {
    const S = __st.G.S; let guard = 0, n = 0;
    while (!S.over && S.day < 86 && guard++ < 5000) {
      while (S.ap > 0 && !S.over) {
        if (S.cond < 30 || ST.tired(S)) ST.rest(S);
        else { const open = ST.openAreas(S), c = ST.CHS.filter(c => ST.areaOpen(S, ST.AREAMAP[c.area]) && c.type !== "pachi").sort((a, b) => (S.stars[a.id] || 0) - (S.stars[b.id] || 0) || b.d - a.d)[0]; ST.applyChallenge(S, c, 55 + (n++ % 30), { coinsDelta: 0, pachi: false }); }
        if (ST.checkEnd(S)) break;
      }
      if (S.over) break; ST.endDay(S); if (ST.checkEnd(S)) break;
      let e; while ((e = ST.nextEv(S))) { ST.choose(S, e, 0); if (ST.checkEnd(S)) break; }
    }
    __st.STU.persist(); return { day: S.day, over: S.over, fans: S.fans, rk: S.rk };
  });
  console.log("   phase2:", JSON.stringify(ff)); ok(!ff.over && ff.day >= 86, "fast-forward reached day 86 alive");
  await pg.reload(); await pg.waitForFunction(() => window.__st && __st.G.scr === "title", null, { timeout: 8000 }); await installBot(pg, .55);
  await click(pg, "#bCont"); await wf(pg, () => __st.G.scr === "home"); await drain(pg, 8000);
  const r3 = await driveUntil(pg, () => __st.G.scr === "end", 240000);
  console.log("   phase3:", JSON.stringify(r3));
  ok(r3.ok, "UI auto-play reaches the ending screen");
  if (r3.ok) {
    await pg.waitForTimeout(400); await audit(pg, "[long] ending"); await shot(pg, "long_ending");
    const e = await pg.evaluate(() => ({ id: __st.G.S.endId, t: document.getElementById("endT").textContent, sc: document.getElementById("endScore").textContent, day: __st.G.S.day }));
    console.log("   ending:", JSON.stringify(e)); ok(!!e.id && e.t.length > 2, "ending title shown");
    ok(await pg.evaluate(() => localStorage.getItem("are_st_save_v1") === null), "save cleared after ending");
    await click(pg, "#bEndColl"); await wf(pg, () => __st.G.scr === "coll"); const cc = await pg.evaluate(() => document.getElementById("cCount").textContent); console.log("   collection:", cc); ok(/1\s*\/\s*14|1\s*[\/／]\s*14|1.*14/.test(cc), "collection counts the new ending (" + cc + ")");
    await click(pg, "#bCollBack"); await click(pg, "#bNew"); ok((await scr(pg)) === "setup", "play again → setup");
  }
  ok(pg.errs.length === 0, "[long] no JS errors " + pg.errs.slice(0, 3).join(" | "));
  await ctx.close();
}
async function daily(br) {
  console.log("== daily challenge");
  const { ctx, pg } = await mk(br, { vp: "phone", lang: "ko", speed: true }); await load(pg); await installBot(pg, .7);
  await click(pg, "#bDaily"); ok(await wf(pg, () => __st.G.scr === "play"), "daily starts");
  const r = await driveUntil(pg, () => __st.G.scr === "result", 120000); ok(r.ok, "daily reaches result");
  if (r.ok) { await audit(pg, "[daily] result"); await click(pg, "#bResOk"); await wf(pg, () => __st.G.scr === "title"); ok(/✓/.test(await pg.evaluate(() => document.getElementById("bDaily").textContent)), "daily button shows ✓ after finishing");
    const d = await pg.evaluate(() => JSON.parse(localStorage.getItem("gk_st") || "{}")); ok(d.daily && d.dailyStreak === 1, "daily recorded (streak 1)"); }
  ok(pg.errs.length === 0, "[daily] no JS errors " + pg.errs.slice(0, 3).join(" | "));
  await ctx.close();
}

(async () => {
  const which = process.argv.slice(2).filter(a => !a.startsWith("--")); const all = !which.length || which.includes("all");
  const br = await chromium.launch(); const run = n => all || which.includes(n);
  try {
    if (run("sweep")) await sweep(br); if (run("events")) await events(br); if (run("pad")) await pad(br); if (run("kbd")) await kbd(br); if (run("ptr")) await ptr(br); if (run("daily")) await daily(br); if (run("long")) await longrun(br);
  } catch (e) { fails++; console.log("  ✗ exception:", e && e.stack || e); }
  await br.close(); console.log(`\n${oks} ok, ${fails} failed, ${warns} warnings`); process.exit(fails ? 1 : 0);
})();
