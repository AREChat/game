// 画面の ざっくり 確認：起動→タイトル→出陣→戦闘→スクショ
const {chromium} = require("playwright");
const OUT = process.argv[2] || "/tmp/us-shots";
require("fs").mkdirSync(OUT, {recursive: true});
(async () => {
    const b = await chromium.launch({args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]});
    const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); const p = await ctx.newPage();
    const errs = []; p.on("console", m => { if(m.type() === "error") errs.push(m.text()); }); p.on("pageerror", e => errs.push("PAGEERR " + e.message));
    await p.goto("http://localhost:8098/game12/index.html"); await p.waitForTimeout(2500);
    await p.screenshot({path: OUT + "/01title.png"});
    await p.click("#bStart"); await p.waitForTimeout(1200); await p.screenshot({path: OUT + "/02sel.png"});
    await p.click("#bGo"); await p.waitForTimeout(1500); await p.screenshot({path: OUT + "/03brief.png"});
    await p.click("#bBrGo"); await p.waitForTimeout(2500); await p.screenshot({path: OUT + "/04play.png"});
    await p.keyboard.down("w"); await p.waitForTimeout(800); await p.keyboard.up("w");
    for(let i = 0; i < 6; i++){ await p.keyboard.press("j"); await p.waitForTimeout(180); }
    await p.screenshot({path: OUT + "/05atk.png"});
    console.log("errs", errs.slice(0, 8));
    await b.close();
})();
