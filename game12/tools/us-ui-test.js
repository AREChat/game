// AREUSO 画面テスト（Playwright）。使い方: node us-ui-test.js [layout|lang|kbd|touch|pad|flow|dead|all]
const {chromium} = require("playwright"); const fs = require("fs");
const SEC = process.argv[2] || "all", OUT = process.argv[3] || "/tmp/us-ui"; fs.mkdirSync(OUT, {recursive: true});
const URL = "http://localhost:8098/game12/index.html?noauto=1";
const ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
let ok = 0, ng = 0; const fails = [];
function chk(c, m){ if(c) ok++; else { ng++; fails.push(m); console.log("  NG:", m); } }
async function mk(b, vp, opt){ const ctx = await b.newContext(Object.assign({viewport: vp}, opt || {})); const p = await ctx.newPage(); p.errs = [];
    p.on("console", m => { if(m.type() === "error") p.errs.push(m.text()); }); p.on("pageerror", e => p.errs.push("PAGEERR " + e.message)); return {ctx, p}; }
async function open(p, save, lang){ await p.addInitScript(([s, l]) => { try{ if(!localStorage.getItem("__init")){ localStorage.setItem("__init", "1"); if(s) localStorage.setItem("gk_us", s); if(l) localStorage.setItem("are_lang", l); } }catch(e){} }, [save || "", lang || ""]);
    await p.goto(URL); await p.waitForFunction(() => window.__us && window.__us.S && window.__us.S.R, null, {timeout: 20000}); await p.waitForTimeout(400); }
const FULL = JSON.stringify({rank_s1: "A", rank_s2: "B", rank_s3: "A", rank_s4: "S", rank_s5: "A", cleared: 5});
async function overflow(p){ return p.evaluate(() => { const bad = []; const W = innerWidth, H = innerHeight; document.querySelectorAll(".scr.on button, .scr.on h2, .scr.on .panel, .scr.on .briefbox").forEach(e => { const r = e.getBoundingClientRect(); if(r.width && (r.left < -1 || r.right > W + 1)) bad.push((e.id || e.className) + ":" + Math.round(r.left) + "-" + Math.round(r.right)); }); const sc = document.documentElement.scrollWidth > W + 1; return {bad, sc}; }); }
async function toPlay(p, si, hi, quiet){ await p.evaluate(([si, hi]) => { const u = window.__us; u.S.stageSel = si; u.S.heroSel = hi; u.startBattle(); }, [si, hi]); await p.waitForTimeout(300); await p.click("#bBrGo"); await p.waitForTimeout(500); if(quiet) await p.evaluate(() => { const B = __us.S.B; B.E.forEach(e => { e.alive = false; }); B.spawnT = 1e9; }); }

(async () => {
    const b = await chromium.launch({args: ARGS});
    if(SEC === "layout" || SEC === "all"){
        console.log("== layout");
        for(const [name, vp, o] of [["pc", {width: 1280, height: 720}], ["phoneL", {width: 844, height: 390}, {hasTouch: true, isMobile: true}], ["phoneP", {width: 390, height: 844}, {hasTouch: true, isMobile: true}], ["tabletP", {width: 768, height: 1024}, {hasTouch: true}], ["small", {width: 667, height: 320}, {hasTouch: true, isMobile: true}]]){
            const {ctx, p} = await mk(b, vp, o); await open(p, FULL, "ja");
            const scr = async (id, fn) => { if(fn) await fn(); await p.waitForTimeout(350); const r = await overflow(p); chk(!r.sc && r.bad.length === 0, `${name} ${id} overflow ${JSON.stringify(r.bad)} sc=${r.sc}`); await p.screenshot({path: `${OUT}/${name}_${id}.png`}); };
            await scr("title"); await scr("sel", () => p.click("#bStart")); await scr("how", () => p.evaluate(() => __us.show("how"))); await scr("opt", () => p.evaluate(() => __us.show("opt")));
            await p.evaluate(() => { __us.S.stageSel = 4; __us.S.heroSel = 3; __us.startBattle(); }); await scr("brief");
            await p.click("#bBrGo"); await scr("play"); await p.waitForTimeout(500);
            // タッチ UI: 画面内か
            const tb = await p.evaluate(() => { const bad = []; document.querySelectorAll("#cluster .tb").forEach(e => { const r = e.getBoundingClientRect(); if(e.offsetParent !== null && (r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight)) bad.push(e.dataset.act + ":" + [r.left, r.top, r.right, r.bottom].map(Math.round)); }); return {bad, shown: document.body.classList.contains("touchui")}; });
            chk(tb.bad.length === 0, `${name} touch buttons offscreen ${JSON.stringify(tb.bad)}`);
            await p.evaluate(() => __us.pause()); await scr("pause");
            await p.evaluate(() => { __us.resume(); const B = __us.S.B; B.stats = {time: 123, ko: 99, dmg: 50, combo: 77, pts: 90, rank: "S", score: 12345}; B.state = "clear"; __us.showResult(true); }); await scr("res");
            chk(p.errs.length === 0, `${name} console errors ${p.errs.slice(0, 3)}`); await ctx.close();
        }
    }
    if(SEC === "lang" || SEC === "all"){
        console.log("== lang");
        for(const lang of ["ja", "en", "zh", "ko"]){
            const {ctx, p} = await mk(b, {width: 844, height: 390}, {hasTouch: true, isMobile: true}); await open(p, FULL, lang);
            const texts = []; const grab = async id => { await p.waitForTimeout(250); texts.push(...await p.evaluate(() => Array.from(document.querySelectorAll(".scr.on button, .scr.on h2, .scr.on p, .scr.on h3, #tSub, .scr.on .stc, .scr.on .hc")).map(e => e.textContent.trim()).filter(x => x))); await p.screenshot({path: `${OUT}/lang_${lang}_${id}.png`}); };
            await grab("title"); await p.click("#bStart"); await grab("sel"); await p.evaluate(() => __us.show("how")); await grab("how"); await p.evaluate(() => __us.show("opt")); await grab("opt");
            await toPlay(p, 4, 1); await p.evaluate(() => __us.S.B && 0); await p.waitForTimeout(1500); await grab("play");
            const all = texts.join("|"); chk(!/undefined|null|NaN|\[object/.test(all), `${lang} bad text`);
            const L = {ja: /[ぁ-んァ-ン]/, en: /[A-Za-z]{4}/, zh: /[一-鿿]/, ko: /[가-힯]/}[lang]; chk(L.test(all), `${lang} lang chars`);
            if(lang !== "ja") chk(!/[ぁ-ん]/.test(texts.filter(t => !/AREUSO/.test(t)).join("")), `${lang} contains kana: ${(all.match(/.{0,8}[ぁ-ん]+.{0,8}/) || [""])[0]}`);
            chk(p.errs.length === 0, `${lang} errs ${p.errs.slice(0, 2)}`); await ctx.close();
        }
    }
    if(SEC === "kbd" || SEC === "all"){
        console.log("== kbd");
        const {ctx, p} = await mk(b, {width: 1100, height: 620}); await open(p, FULL, "ja"); await toPlay(p, 0, 0, true);
        const st = () => p.evaluate(() => { const P = __us.S.B.P; return {st: P.st, x: P.x, z: P.z, y: P.y, ci: P.ci, mus: P.mus, hp: P.hp, state: __us.S.B.state, paused: __us.S.paused, scr: __us.S.scr}; });
        await p.waitForTimeout(500); let a = await st(); chk(a.state === "play", "play state");
        await p.keyboard.down("d"); await p.waitForTimeout(700); await p.keyboard.up("d"); let c = await st(); chk(Math.hypot(c.x - a.x, c.z - a.z) > 2, "WASD moves " + JSON.stringify([a.x, c.x]));
        await p.keyboard.down("w"); await p.waitForTimeout(500); await p.keyboard.up("w"); let c2 = await st(); chk(Math.hypot(c2.x - c.x, c2.z - c.z) > 1.5, "W moves");
        await p.keyboard.press("j"); await p.waitForTimeout(120); a = await st(); chk(a.st === "atk", "J attack " + a.st);
        await p.waitForTimeout(600); await p.keyboard.press("k"); await p.waitForTimeout(150); a = await st(); chk(a.st === "atk", "K heavy " + a.st); await p.waitForTimeout(1000);
        await p.keyboard.press("l"); await p.waitForTimeout(80); a = await st(); chk(a.st === "dodge", "L dodge " + a.st); await p.waitForTimeout(500);
        await p.keyboard.press("Shift"); await p.waitForTimeout(80); a = await st(); chk(a.st === "dodge" || a.st === "idle", "Shift dodge " + a.st);
        await p.waitForTimeout(600); await p.keyboard.press(" "); await p.waitForTimeout(150); a = await st(); chk(a.y > 0, "Space jump y=" + a.y); await p.waitForTimeout(900);
        await p.evaluate(() => { __us.S.B.P.mus = 100; }); await p.keyboard.press("o"); await p.waitForTimeout(250); a = await st(); chk(a.st === "musou", "O musou " + a.st); await p.waitForTimeout(2600);
        await p.screenshot({path: `${OUT}/kbd_musou_after.png`});
        // ポーズ：Esc で ポーズ → Esc で 再開（1回ずつ）
        await p.keyboard.press("Escape"); await p.waitForTimeout(350); a = await st(); chk(a.paused && a.scr === "pause", "Esc pause " + JSON.stringify(a));
        await p.keyboard.press("Escape"); await p.waitForTimeout(450); a = await st(); chk(!a.paused && a.scr === "play", "Esc resume " + JSON.stringify(a));
        await p.keyboard.press("p"); await p.waitForTimeout(350); a = await st(); chk(a.paused, "P pause"); await p.click("#bResume"); await p.waitForTimeout(300); a = await st(); chk(!a.paused, "resume btn");
        // ガード
        await p.keyboard.down("i"); await p.waitForTimeout(200); let gd = await p.evaluate(() => __us.S.B.P.guard); await p.keyboard.up("i"); chk(gd === true, "I guard");
        // カメラ: Q で 再センタ
        await p.keyboard.press("q"); await p.waitForTimeout(300);
        chk(p.errs.length === 0, "kbd errs " + p.errs.slice(0, 3)); await ctx.close();
    }
    if(SEC === "touch" || SEC === "all"){
        console.log("== touch");
        const {ctx, p} = await mk(b, {width: 844, height: 390}, {hasTouch: true, isMobile: true}); await open(p, FULL, "ja"); await toPlay(p, 0, 0, true); await p.waitForTimeout(400);
        chk(await p.evaluate(() => document.body.classList.contains("touchui")), "touchui shown");
        const ptr = (sel, type, x, y, id) => p.evaluate(([sel, type, x, y, id]) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const cx = x === undefined ? r.left + r.width / 2 : x, cy = y === undefined ? r.top + r.height / 2 : y; el.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, pointerId: id || 1, pointerType: "touch", clientX: cx, clientY: cy, isPrimary: true})); }, [sel, type, x, y, id]);
        const st = () => p.evaluate(() => { const P = __us.S.B.P; return {st: P.st, x: P.x, z: P.z, y: P.y, mus: P.mus, guard: P.guard}; });
        let a = await st();
        // 左スティック ドラッグ
        await ptr("#stickZone", "pointerdown", 120, 300, 7); await ptr("#stickZone", "pointermove", 170, 300, 7); await p.waitForTimeout(600); const mv = await st(); await ptr("#stickZone", "pointerup", 170, 300, 7);
        chk(Math.hypot(mv.x - a.x, mv.z - a.z) > 1.5, "stick moves " + JSON.stringify([a, mv])); await p.waitForTimeout(200);
        const stkv = await p.evaluate(() => [__us.S.tv.x, __us.S.tv.y]); chk(stkv[0] === 0 && stkv[1] === 0, "stick released");
        // ボタン
        await ptr(".tbY", "pointerdown"); await ptr(".tbY", "pointerup"); await p.waitForTimeout(100); a = await st(); chk(a.st === "atk", "Y tap attacks " + a.st); await p.waitForTimeout(700);
        await ptr(".tbX", "pointerdown"); await ptr(".tbX", "pointerup"); await p.waitForTimeout(100); a = await st(); chk(a.st === "atk", "X heavy"); await p.waitForTimeout(1100);
        await ptr(".tbB", "pointerdown"); await ptr(".tbB", "pointerup"); await p.waitForTimeout(80); a = await st(); chk(a.st === "dodge", "B dodge " + a.st); await p.waitForTimeout(600);
        await ptr(".tbA", "pointerdown"); await ptr(".tbA", "pointerup"); await p.waitForTimeout(120); a = await st(); chk(a.y > 0, "A jump"); await p.waitForTimeout(900);
        await ptr(".tbR", "pointerdown"); await p.waitForTimeout(150); a = await st(); chk(a.guard, "R guard hold"); await ptr(".tbR", "pointerup"); await p.waitForTimeout(150); a = await st(); chk(!a.guard, "R guard release");
        await p.evaluate(() => { __us.S.B.P.mus = 100; }); await p.waitForTimeout(100); chk(await p.evaluate(() => document.getElementById("tbMus").classList.contains("rdy")), "musou btn ready glow");
        await ptr(".tbZ", "pointerdown"); await ptr(".tbZ", "pointerup"); await p.waitForTimeout(250); a = await st(); chk(a.st === "musou", "ZR musou " + a.st); await p.waitForTimeout(2600);
        // カメラ スワイプ
        const y0 = await p.evaluate(() => __us.S.R.yaw); await ptr("#camZone", "pointerdown", 600, 200, 9); await ptr("#camZone", "pointermove", 700, 200, 9); await p.waitForTimeout(100); await ptr("#camZone", "pointerup", 700, 200, 9); const y1 = await p.evaluate(() => __us.S.R.yaw); chk(Math.abs(y1 - y0) > .3, "camera swipe " + [y0, y1]);
        // 2本 同時（スティック＋攻撃）
        await ptr("#stickZone", "pointerdown", 100, 300, 11); await ptr("#stickZone", "pointermove", 100, 250, 11); await ptr(".tbY", "pointerdown", undefined, undefined, 12); await ptr(".tbY", "pointerup", undefined, undefined, 12); await p.waitForTimeout(150); a = await st(); chk(a.st === "atk", "multi touch attack while holding stick"); await ptr("#stickZone", "pointerup", 100, 250, 11);
        // ポーズ ボタン
        await p.click("#pauseBtn"); await p.waitForTimeout(300); chk(await p.evaluate(() => __us.S.paused), "pause btn"); await p.click("#bResume"); await p.waitForTimeout(300);
        chk(p.errs.length === 0, "touch errs " + p.errs.slice(0, 3)); await ctx.close();
    }
    if(SEC === "pad" || SEC === "all"){
        console.log("== pad");
        const {ctx, p} = await mk(b, {width: 1100, height: 620}); 
        await p.addInitScript(() => { window.__pad = {buttons: Array.from({length: 17}, () => ({pressed: false, value: 0})), axes: [0, 0, 0, 0], connected: true, id: "Pro Controller (STANDARD GAMEPAD)", index: 0, mapping: "standard"}; navigator.getGamepads = () => [window.__pad]; });
        await open(p, FULL, "ja");
        const btn = async (i, ms) => { await p.evaluate(i => { __pad.buttons[i] = {pressed: true, value: 1}; }, i); await p.waitForTimeout(Math.max(ms || 120, 420)); await p.evaluate(i => { __pad.buttons[i] = {pressed: false, value: 0}; }, i); await p.waitForTimeout(120); };
        const hit = async (i) => { await p.evaluate(i => { __pad.buttons[i] = {pressed: true, value: 1}; }, i); await p.waitForTimeout(220); const r = await p.evaluate(() => { const P = __us.S.B.P; return {st: P.st, y: P.y, guard: P.guard}; }); await p.evaluate(i => { __pad.buttons[i] = {pressed: false, value: 0}; }, i); return r; };
        // メニュー: A で スタート
        await p.waitForTimeout(500); await btn(1, 150); await p.waitForTimeout(500); chk(await p.evaluate(() => __us.S.scr) === "sel", "pad A starts → sel");
        await btn(1, 150); await p.waitForTimeout(500); // 最初の フォーカスが ステージ → A
        await p.evaluate(() => { __us.S.stageSel = 0; __us.S.heroSel = 0; });
        await p.evaluate(() => __us.startBattle()); await p.waitForTimeout(500); await btn(1, 150); await p.waitForTimeout(500); await p.evaluate(() => { const B = __us.S.B; B.E.forEach(e => { e.alive = false; }); B.spawnT = 1e9; });
        chk(await p.evaluate(() => __us.S.scr) === "play", "pad A at brief → play (" + await p.evaluate(() => __us.S.scr) + ")");
        const st = () => p.evaluate(() => { const P = __us.S.B.P; return {st: P.st, x: P.x, z: P.z, y: P.y, guard: P.guard}; });
        let a = await st(); await p.evaluate(() => { __pad.axes = [1, 0, 0, 0]; }); await p.waitForTimeout(600); await p.evaluate(() => { __pad.axes = [0, 0, 0, 0]; }); let c = await st(); chk(Math.hypot(c.x - a.x, c.z - a.z) > 2, "left stick moves " + JSON.stringify([a, c, await p.evaluate(() => [__us.S.scr, __us.S.paused, __us.S.hold, __us.S.B.state, GKI._mode()])]));
        await p.evaluate(() => { __pad.buttons[2] = {pressed: true, value: 1}; }); await p.waitForTimeout(250); a = await st(); await p.evaluate(() => { __pad.buttons[2] = {pressed: false, value: 0}; }); chk(a.st === "atk", "Y(pad idx2) light " + a.st); await p.waitForTimeout(900);
        await btn(3, 100); await p.waitForTimeout(60); a = await st(); chk(a.st === "atk", "X heavy"); await p.waitForTimeout(1200);
        a = await hit(0); chk(a.st === "dodge", "B dodge " + a.st); await p.waitForTimeout(900);
        a = await hit(1); chk(a.y > 0, "A jump " + a.y); await p.waitForTimeout(1200);
        await p.evaluate(() => { __pad.buttons[5] = {pressed: true, value: 1}; }); await p.waitForTimeout(200); a = await st(); chk(a.guard, "R guard"); await p.evaluate(() => { __pad.buttons[5] = {pressed: false, value: 0}; });
        await p.evaluate(() => { __us.S.B.P.mus = 100; }); await btn(7, 120); await p.waitForTimeout(250); a = await st(); chk(a.st === "musou", "ZR musou " + a.st); await p.waitForTimeout(2600);
        const y0 = await p.evaluate(() => __us.S.R.yaw); await p.evaluate(() => { __pad.axes = [0, 0, 1, 0]; }); await p.waitForTimeout(500); await p.evaluate(() => { __pad.axes = [0, 0, 0, 0]; }); const y1 = await p.evaluate(() => __us.S.R.yaw); chk(Math.abs(y1 - y0) > .3, "right stick camera " + [y0, y1]);
        await btn(9, 120); await p.waitForTimeout(400); chk(await p.evaluate(() => __us.S.paused), "pad + pauses");
        // ポーズ中: A=再開ボタン
        await btn(1, 150); await p.waitForTimeout(500); const r = await p.evaluate(() => [__us.S.paused, __us.S.scr]); chk(!r[0] && r[1] === "play", "pad A on resume → resumes " + r);
        await btn(9, 120); await p.waitForTimeout(400); await btn(0, 150); await p.waitForTimeout(500); const r2 = await p.evaluate(() => [__us.S.paused, __us.S.scr]); chk(!r2[0], "pad B in pause → resumes " + r2);
        chk(p.errs.length === 0, "pad errs " + p.errs.slice(0, 3)); await ctx.close();
    }

    if(SEC === "flow" || SEC === "all"){
        console.log("== flow");
        const {ctx, p} = await mk(b, {width: 960, height: 540}); await open(p, "", "ja");
        const botSrc = fs.readFileSync(__dirname + "/us-bot.js", "utf8"); await p.evaluate("window.global = window;"); await p.addScriptTag({content: botSrc});
        chk(await p.locator("#bCont").isHidden(), "fresh: continue hidden");
        await p.click("#bStart"); await p.waitForTimeout(500);
        const lockInfo = await p.evaluate(() => ({st: Array.from(document.querySelectorAll(".stc")).map(e => e.classList.contains("lock")), hc: Array.from(document.querySelectorAll(".hc")).map(e => e.classList.contains("lock"))}));
        chk(JSON.stringify(lockInfo.st) === "[false,true,true,true,true]", "fresh stage locks " + JSON.stringify(lockInfo.st)); chk(JSON.stringify(lockInfo.hc) === "[false,true,true,true]", "fresh hero locks " + JSON.stringify(lockInfo.hc));
        await p.click(".stc[data-i='2']", {force: true}); await p.waitForTimeout(200); chk(await p.evaluate(() => __us.S.stageSel) === 0, "locked stage not selectable");
        await p.click(".hc[data-i='3']", {force: true}); await p.waitForTimeout(200); chk(await p.evaluate(() => __us.S.heroSel) === 0, "locked hero not selectable");
        const ff = async (assist) => p.evaluate(([assist]) => { const U = __us, B = U.S.B; const bot = USBOT.make(.95, (Math.random() * 1e6) | 0); let t = 0; const P = B.P;
            while(t < 700 && B.state === "play"){ if(assist && P.hp < P.maxhp * .3) P.hp = P.maxhp * .6; if(B.slow.t > 0){ B.slow.t -= 1 / 30; } US.step(B, 1 / 30, bot(B, 1 / 30)); B.ev.length = 0; t += 1 / 30; }
            return {state: B.state, t: B.t, ko: B.ko, hp: P.hp}; }, [assist]);
        const stagesTested = [];
        for(let i = 0; i < 5; i++){
            await p.evaluate(i => { const u = __us; u.S.stageSel = i; u.S.heroSel = Math.min(u.S.heroSel, 3); u.startBattle(); }, i); await p.waitForTimeout(300);
            chk(await p.evaluate(() => __us.S.scr) === "brief", `s${i + 1} brief shown`); await p.click("#bBrGo"); await p.waitForTimeout(300);
            let r = await ff(i >= 2); chk(r.state === "clear", `s${i + 1} cleared by bot: ${JSON.stringify(r)}`);
            if(r.state !== "clear"){ break; }
            await p.waitForFunction(() => __us.S.scr === "res", null, {timeout: 20000}); await p.waitForTimeout(300);
            const res = await p.evaluate(() => ({rank: document.getElementById("rsRank").textContent, nw: document.getElementById("rsNew").textContent, t: document.getElementById("rsTable").textContent, nxt: document.getElementById("bRsNext").textContent, save: JSON.parse(localStorage.getItem("gk_us") || "{}")}));
            chk(/^[SABC]$/.test(res.rank), `s${i + 1} rank ${res.rank}`); chk(res.save["rank_s" + (i + 1)] === res.rank, `s${i + 1} saved rank`); chk(res.t.length > 10, `s${i + 1} table`);
            if(i < 3) chk(/[ァ-ン]/.test(res.nw), `s${i + 1} new hero text "${res.nw}"`);
            await p.screenshot({path: `${OUT}/flow_res_s${i + 1}.png`}); stagesTested.push(res.rank);
            if(i < 4){ await p.click("#bRsNext"); await p.waitForTimeout(500); chk(await p.evaluate(() => [__us.S.scr, __us.S.stageSel]).then(a => a[0] === "brief" && a[1] === i + 1), `s${i + 1} next → brief s${i + 2}`); }
        }
        // エンディング
        if(stagesTested.length === 5){ await p.click("#bRsNext"); await p.waitForTimeout(500); chk(await p.evaluate(() => __us.S.scr) === "end", "ending shows"); const et = await p.evaluate(() => document.getElementById("enBody").textContent); chk(et.length > 30, "ending text"); await p.screenshot({path: `${OUT}/flow_ending.png`}); await p.click("#bEnd"); await p.waitForTimeout(400); chk(await p.evaluate(() => __us.S.scr) === "title", "ending → title"); chk(await p.locator("#bCont").isVisible(), "continue visible after clear"); }
        // 保存の 持続
        await p.reload(); await p.waitForFunction(() => window.__us && __us.S.R); await p.waitForTimeout(500); chk(await p.locator("#bCont").isVisible(), "continue after reload");
        await p.click("#bCont"); await p.waitForTimeout(400); const li2 = await p.evaluate(() => ({st: Array.from(document.querySelectorAll(".stc")).map(e => e.classList.contains("lock")), hc: Array.from(document.querySelectorAll(".hc")).map(e => e.classList.contains("lock"))}));
        chk(li2.st.every(x => !x) && li2.hc.every(x => !x), "all unlocked after clear " + JSON.stringify(li2));
        // データ消去 2回押し
        await p.evaluate(() => __us.show("opt")); await p.click("#bReset"); await p.waitForTimeout(150); chk(Object.keys(await p.evaluate(() => JSON.parse(localStorage.getItem("gk_us")))).some(k => /rank_s1/.test(k) && true), "reset needs confirm"); chk(await p.evaluate(() => JSON.parse(localStorage.getItem("gk_us")).rank_s1) !== "", "still saved after 1 click");
        await p.click("#bReset"); await p.waitForTimeout(200); chk(await p.evaluate(() => JSON.parse(localStorage.getItem("gk_us")).rank_s1) === "", "erased after 2 clicks");
        chk(p.errs.length === 0, "flow errs " + p.errs.slice(0, 3)); await ctx.close();
    }
    if(SEC === "dead" || SEC === "all"){
        console.log("== dead");
        const {ctx, p} = await mk(b, {width: 960, height: 540}); await open(p, FULL, "en");
        await toPlay(p, 0, 0); await p.evaluate(() => { const B = __us.S.B; B.P.hp = 1; });
        // 敵に 殴らせる（プレイヤーを 動かさない）
        await p.waitForFunction(() => __us.S.B.state === "dead", null, {timeout: 60000}).catch(() => {});
        let dead = await p.evaluate(() => __us.S.B.state); if(dead !== "dead"){ await p.evaluate(() => { const B = __us.S.B; B.P.hp = 0; B.P.dead = true; B.state = "dead"; B.ev.push({t: "dead", x: B.P.x, z: B.P.z}); }); }
        await p.waitForFunction(() => __us.S.scr === "res", null, {timeout: 20000}); await p.waitForTimeout(300);
        const r = await p.evaluate(() => ({t: document.getElementById("rsT").textContent, next: getComputedStyle(document.getElementById("bRsNext")).display, retry: getComputedStyle(document.getElementById("bRsRetry")).display, rank: document.getElementById("rsRank").textContent}));
        chk(/Defeated/.test(r.t), "dead title " + r.t); chk(r.next === "none", "no next on defeat"); chk(r.retry !== "none", "retry visible"); await p.screenshot({path: `${OUT}/dead_res.png`});
        const old = await p.evaluate(() => __us.S.B.nid + ":" + __us.S.B.seedTag);
        await p.click("#bRsRetry"); await p.waitForTimeout(500); chk(await p.evaluate(() => [__us.S.scr, __us.S.B.state, __us.S.B.P.hp === __us.S.B.P.maxhp].join()) === "brief,intro,true", "retry → fresh brief");
        await p.click("#bBrGo"); await p.waitForTimeout(500); chk(await p.evaluate(() => __us.S.scr) === "play", "retry → play");
        // ポーズ → やめる → えらび
        await p.evaluate(() => __us.pause()); await p.waitForTimeout(300); await p.click("#bPaQuit"); await p.waitForTimeout(400); chk(await p.evaluate(() => __us.S.scr) === "sel", "quit → sel");
        // 言語切替 中の 戦闘 HUD
        await toPlay(p, 0, 0, true); await p.click("#lgBtn", {force: true, timeout: 2000}).catch(() => {});
        chk(p.errs.length === 0, "dead errs " + p.errs.slice(0, 3)); await ctx.close();
    }
    await b.close();
    console.log(`\nOK ${ok}  NG ${ng}`); if(ng) console.log(fails.join("\n")); process.exit(ng ? 1 : 0);
})();
