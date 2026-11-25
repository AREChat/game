// 各ステージ・ボス・無双の 見た目を スクショで 確認（ボットで 進める）
const {chromium} = require("playwright"); const fs = require("fs");
const OUT = process.argv[2] || "/tmp/us-shots"; fs.mkdirSync(OUT, {recursive: true});
(async () => {
    const b = await chromium.launch({args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]});
    const ctx = await b.newContext({viewport: {width: 1100, height: 620}}); const p = await ctx.newPage();
    const errs = []; p.on("console", m => { if(m.type() === "error") errs.push(m.text()); }); p.on("pageerror", e => errs.push("PAGEERR " + e.message));
    await p.addInitScript(() => { localStorage.setItem("gk_us", JSON.stringify({rank_s1: "A", rank_s2: "A", rank_s3: "A", rank_s4: "A", cleared: 4})); });
    await p.goto("http://localhost:8098/game12/index.html?noauto=1"); await p.waitForTimeout(2000);
    for(const [si, hi] of [[0, 0], [1, 1], [2, 2], [3, 3], [4, 0]]){
        await p.evaluate(([si, hi]) => { const u = window.__us; u.S.stageSel = si; u.S.heroSel = hi; u.startBattle(); }, [si, hi]);
        await p.waitForTimeout(600); await p.click("#bBrGo"); await p.waitForTimeout(1500);
        // ボットで 武将が 出るまで 進める（描画フレームの 外で 速く）
        await p.evaluate(() => { const u = window.__us, B = u.S.B; const bot = window.USBOT ? null : null; });
        await p.screenshot({path: `${OUT}/s${si + 1}_a.png`});
    }
    console.log("errs", errs.slice(0, 6)); await b.close();
})();
