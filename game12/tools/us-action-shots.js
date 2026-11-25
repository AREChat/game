const {chromium} = require("playwright"); const fs = require("fs");
const OUT = process.argv[2]; fs.mkdirSync(OUT, {recursive: true});
(async () => {
    const b = await chromium.launch({args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]});
    const p = await (await b.newContext({viewport: {width: 1000, height: 560}})).newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if(m.type() === "error") errs.push(m.text()); });
    await p.addInitScript(() => { localStorage.setItem("gk_us", JSON.stringify({rank_s1: "A", rank_s2: "A", rank_s3: "A", rank_s4: "A", cleared: 4})); });
    await p.goto("http://localhost:8098/game12/index.html?noauto=1"); await p.waitForFunction(() => window.__us && __us.S.R); await p.evaluate("window.global = window;"); await p.addScriptTag({content: fs.readFileSync(__dirname + "/us-bot.js", "utf8")});
    for(const [si, hi, tag] of [[1, 1, "lancer"], [3, 3, "twins"], [4, 2, "king"]]){
        await p.evaluate(([si, hi]) => { const u = __us; u.S.stageSel = si; u.S.heroSel = hi; u.startBattle(); }, [si, hi]); await p.waitForTimeout(300); await p.click("#bBrGo");
        // 進めて 武将を 出す
        await p.evaluate(() => { const B = __us.S.B, bot = USBOT.make(.95, 3); let t = 0; while(t < 300 && !B.offSpawned){ if(B.P.hp < B.P.maxhp * .4) B.P.hp = B.P.maxhp; if(B.slow.t > 0) B.slow.t -= 1 / 30; US.step(B, 1 / 30, bot(B, 1 / 30)); B.ev.length = 0; t += 1 / 30; } window.__usInput = USBOT.make(.9, 5); });
        await p.waitForTimeout(1200); await p.screenshot({path: `${OUT}/act_${tag}_intro.png`}); await p.waitForTimeout(3500);
        for(let i = 0; i < 3; i++){ await p.waitForTimeout(1500); await p.screenshot({path: `${OUT}/act_${tag}_${i}.png`}); }
        await p.evaluate(() => { __us.S.B.P.mus = 100; __us.S.B.P.hp = __us.S.B.P.maxhp; }); await p.waitForTimeout(2500); await p.screenshot({path: `${OUT}/act_${tag}_musou.png`}); await p.evaluate(() => { window.__usInput = null; });
    }
    console.log("errs", errs.slice(0, 5)); await b.close();
})();
