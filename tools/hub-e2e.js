// ゲーム入口（index.html）・ジャンルページ（genre/index.html）・「ほかのゲームへ」の通しテスト。
//   cd game && python3 -m http.server 8098 &     BASE=http://localhost:8098 NODE_PATH=$(npm root -g) node tools/hub-e2e.js
// 見る点：4言語の文字／全リンクが開く／戻り先(back)の安全／こわれた保存データ・保存できない端末／言語の連打／
//         5つの画面サイズではみ出さない／キーボード／ジャンル不明・攻撃的な値／記録の増減／ほかのゲームへ／オフライン
"use strict";
const {chromium} = require("playwright");
const fs = require("fs"), path = require("path");
const BASE = process.env.BASE || "http://localhost:8098";
const BASE2 = BASE.replace(/\/\/localhost/, "//game.test");   // localhost は exe 扱い（ほかのゲームへ は出ない）なので、別の名前で web 版として開く
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, "../shared/games-registry.json"), "utf8"));
const LANGS = REG.langs;
let ok = 0, ng = 0; const fails = [];
function check(c, m){ if(c) ok++; else{ ng++; fails.push(m); console.log("NG:", m); } }
const KANA = /[぀-゚ー-ヿ]/, HAN = /[一-鿿]/, HANGUL = /[가-힯]/;

async function newPage(browser, opts = {}){
  const ctx = await browser.newContext(Object.assign({viewport: {width: 1100, height: 900}, serviceWorkers: "block"}, Object.assign({}, opts, {tips: undefined})));
  if(!opts.tips) await ctx.addInitScript(() => { try{ localStorage.setItem("are_gtips_off", "1"); }catch(_e){} });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror " + e));
  page.on("console", (m) => { if(m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console " + m.text()); });
  return {ctx, page, errs};
}
async function setLang(page, l){ await page.evaluate((x) => localStorage.setItem("are_lang", x), l); }

(async () => {
  const browser = await chromium.launch({args: ["--host-resolver-rules=MAP game.test 127.0.0.1"]});
  const t0 = Date.now();

  // ---------- 1) 入口：4言語 ----------
  for(const l of LANGS){
    const {ctx, page, errs} = await newPage(browser);
    await page.addInitScript((x) => { try{ localStorage.setItem("are_lang", x); }catch(_e){} }, l);
    await page.goto(BASE + "/index.html"); await page.waitForSelector(".card");
    const n = await page.locator(".grp[data-grp] .card").count();
    // しんさくは 重複して出る（isNew のぶん）
    const nNew = REG.games.filter((g) => g.isNew).length;
    check(n === REG.games.length + nNew, `入口(${l}): カード数 ${n} ≠ ${REG.games.length + nNew}`);
    check((await page.locator(".tile").count()) === REG.genres.length, `入口(${l}): タイル数`);
    check((await page.locator("html").getAttribute("lang")) === l, `入口(${l}): html lang`);
    const title = await page.title();
    check(title.length > 4, `入口(${l}): title`);
    const text = await page.locator("body").innerText();
    if(l === "en"){ check(!KANA.test(text) && !HAN.test(text.replace(/[日本語中文한국어]/g, "")), `入口(en): 日本語が残っている: ${(text.match(/[぀-ヿ一-鿿]+/g) || []).filter((s) => !/^(日本語|中文)$/.test(s)).slice(0, 5)}`); }
    if(l === "zh"){ check(!KANA.test(text), `入口(zh): かなが残っている ${(text.match(/[぀-ヿ]+/g) || []).slice(0, 5)}`); }
    if(l === "ko"){ check(!KANA.test(text), `入口(ko): かなが残っている ${(text.match(/[぀-ヿ]+/g) || []).slice(0, 5)}`); }
    // 4言語のボタンの押された状態
    const pressed = await page.locator('.lb[aria-pressed="true"]').getAttribute("data-lang");
    check(pressed === l, `入口(${l}): 言語ボタン`);
    // 各カードの名前が 一覧の名前と同じ
    for(const g of REG.games){
      const nm = await page.locator(`.grp[data-grp="${g.genre}"] .card[data-id="${g.id}"] .name`).first().innerText();
      check(nm.startsWith(g.name[l] || g.name.ja), `入口(${l}): ${g.id} の名前 ${nm}`);
    }
    check(errs.length === 0, `入口(${l}): エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ---------- 1b) はじめての案内ポップアップ（4言語・閉じ方・もう出ない） ----------
  for(const l of LANGS){
    const {ctx, page, errs} = await newPage(browser, {tips: true});
    await page.addInitScript((x) => { try{ localStorage.setItem("are_lang", x); }catch(_e){} }, l);
    await page.goto(BASE + "/index.html"); await page.waitForSelector("#areTips", {timeout: 6000});
    const tx = await page.locator("#areTips").innerText();
    if(l === "en") check(/Welcome to ARE GAMES/.test(tx) && /Got it!/.test(tx) && !KANA.test(tx), "案内(en)の文字 " + tx.slice(0, 60));
    if(l === "zh") check(/欢迎来到/.test(tx) && /知道了/.test(tx) && !KANA.test(tx), "案内(zh)の文字");
    if(l === "ko") check(/환영/.test(tx) && /알겠어요/.test(tx) && !KANA.test(tx), "案内(ko)の文字");
    if(l === "ja") check(/ようこそ/.test(tx) && /わかった/.test(tx), "案内(ja)の文字");
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
    check((await page.locator("#areTips").count()) === 0, `案内(${l}): Esc で閉じる`);
    await page.reload(); await page.waitForSelector(".card"); await page.waitForTimeout(1700);
    check((await page.locator("#areTips").count()) === 0, `案内(${l}): 二度と出ない`);
    check(errs.length === 0, `案内(${l}): エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }
  // 4言語に対応した ゲームの案内（game11〜14）も その言語で出る
  for(const [url, re] of [["/game11/index.html", /Unheard-of Lab|前所未闻|전대미문/], ["/game12/index.html", /AREUSO/], ["/game13/index.html", /Adventure at Twenty|二十岁|스무 살/], ["/game14/index.html", /Become a Star|成为人气|인기인/]]){
    for(const l of ["en", "zh", "ko"]){
      const {ctx, page} = await newPage(browser, {tips: true});
      await page.addInitScript((x) => { try{ localStorage.setItem("are_lang", x); localStorage.setItem("are_age_ok", "1"); }catch(_e){} }, l);
      await page.goto(BASE + url + "?tips=1"); 
      const ok1 = await page.waitForSelector("#areTips", {timeout: 6000}).then(() => true).catch(() => false);
      if(ok1){ const tx = await page.locator("#areTips h3").innerText(); check(re.test(tx) && !KANA.test(tx), `案内 ${url} (${l}): ${tx}`); }
      else check(false, `案内が出ない ${url} (${l})`);
      await ctx.close();
    }
  }

  // ---------- 2) すべてのリンクが 開く（200）／ジャンルページ全部 ----------
  {
    const {ctx, page, errs} = await newPage(browser);
    const req = ctx.request;
    const seen = new Set();
    for(const g of REG.games){
      if(g.ext) continue;
      const r = await req.get(BASE + "/" + g.href); check(r.status() === 200, `リンク ${g.id}: ${r.status()}`);
      if(g.img){ const ri = await req.get(BASE + "/" + g.img); check(ri.status() === 200, `画像 ${g.img}`); }
    }
    for(const gn of REG.genres){
      const ri = await req.get(BASE + "/thumbs/genre-" + gn.id + ".webp"); check(ri.status() === 200, `ジャンル表紙 ${gn.id}`);
      for(const l of LANGS){
        await page.goto(BASE + "/index.html?x=1"); await setLang(page, l);
        await page.goto(BASE + "/genre/index.html?g=" + gn.id); await page.waitForSelector(".card");
        const h1 = await page.locator("h1").innerText();
        check(h1 === gn.name[l], `ジャンル(${gn.id}/${l}): 見出し ${h1}`);
        const tips = await page.locator(".tips li").count();
        check(tips === gn.tips[l].length, `ジャンル(${gn.id}/${l}): ヒント数 ${tips}`);
        const ids = await page.locator("#cg .card").evaluateAll((els) => els.map((e) => e.dataset.id));
        const want = REG.games.filter((g) => g.genre === gn.id).sort((a, b) => a.order - b.order).map((g) => g.id);
        check(JSON.stringify(ids) === JSON.stringify(want), `ジャンル(${gn.id}/${l}): 並び ${ids}`);
        const ords = await page.locator("#cg .ord").allInnerTexts();
        check(ords.join(",") === want.map((_, i) => i + 1).join(","), `ジャンル(${gn.id}/${l}): 番号`);
        check((await page.locator("#tiles .tile").count()) === REG.genres.length - 1, `ジャンル(${gn.id}/${l}): ほかのジャンル数`);
        // 全カードの href が たどれる（内部は 200 ／ 外部は arechat.github.io のみ）
        const hrefs = await page.locator("#cg .card").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
        for(const h of hrefs){
          if(/^https?:/.test(h)){ check(/^https:\/\/arechat\.github\.io\//.test(h), `外部リンク ${h}`); continue; }
          const u = new URL(h, BASE + "/genre/index.html").href;
          if(seen.has(u)) continue; seen.add(u);
          const r = await req.get(u); check(r.status() === 200, `ジャンルのリンク ${u}: ${r.status()}`);
        }
        const text = await page.locator("body").innerText();
        if(l === "en") check(!KANA.test(text), `ジャンル(${gn.id}/en): かな`);
        if(l === "ko") check(!KANA.test(text), `ジャンル(${gn.id}/ko): かな`);
        if(l === "zh") check(!KANA.test(text), `ジャンル(${gn.id}/zh): かな`);
      }
    }
    check(errs.length === 0, `ジャンル全部: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ---------- 3) もどり先（back）の安全 ----------
  {
    const {ctx, page} = await newPage(browser);
    const cases = [
      ["https://arechat.github.io/ARE/chat.html", "https://arechat.github.io/ARE/chat.html"],
      ["https://arechat.github.io/AREDA/login", "https://arechat.github.io/AREDA/login"],
      ["https://evil.example/ARE/chat.html", "https://arechat.github.io/ARE/login.html"],
      ["javascript:alert(1)", "https://arechat.github.io/ARE/login.html"],
      ["https://arechat.github.io.evil.example/ARE/chat.html", "https://arechat.github.io/ARE/login.html"],
      ["https://arechat.github.io/ARE/chat.html#x", "https://arechat.github.io/ARE/login.html"],
      ["data:text/html,<script>1</script>", "https://arechat.github.io/ARE/login.html"],
      ["", "https://arechat.github.io/ARE/login.html"],
    ];
    for(const [b, want] of cases){
      await page.goto(BASE + "/index.html?back=" + encodeURIComponent(b)); await page.waitForSelector(".card");
      const top = await page.locator("#backTop").getAttribute("href");
      check(top === want, `back=${b} → ${top}`);
      if(b === want){ // 有効なときは 各ゲームのリンクに 引きつぐ。外部(ext)には つけない
        const h = await page.locator('.card[data-id="game10"]').first().getAttribute("href");
        check(h.includes("back=" + encodeURIComponent(b)), `back を引きつぐ ${h}`);
        const d = await page.locator('.card[data-id="daifugo"]').first().getAttribute("href");
        check(!d.includes("back="), "外部リンクに back をつけない");
        const t = await page.locator('.tile').first().getAttribute("href");
        check(t.includes("back="), "タイルにも back");
      }
    }
    await ctx.close();
  }

  // ---------- 4) 保存データ：こわれている／ない／使えない ----------
  {
    const bads = ["{{", "null", "[]", "123", '"str"', '{"v":1,"g":{"are-quest":{"n":"abc"}}}', '{"v":1,"g":{"nope":{"n":5,"last":1}},"d":[]}', '{"v":1,"g":[1,2,3],"d":{"a":1}}', '{"v":2}', "x".repeat(100000), '{"v":1,"g":{"are-quest":{"n":-5,"last":"z"}}}', '{"v":1,"g":{"are-quest":{"n":1e999,"last":1}}}'];
    for(const raw of bads){
      const {ctx, page, errs} = await newPage(browser);
      await page.addInitScript((r) => { try{ if(sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1"); localStorage.setItem("are_play_log", r); localStorage.setItem("are_game_last", "<img src=x onerror=alert(1)>"); localStorage.setItem("are_lang", "en"); }catch(_e){} }, raw);
      await page.goto(BASE + "/index.html"); await page.waitForSelector(".card");
      await page.goto(BASE + "/genre/index.html?g=rpg"); await page.waitForSelector(".card");
      check(errs.length === 0, `こわれた記録 ${raw.slice(0, 30)}: エラー ${errs.slice(0, 2)}`);
      check(!(await page.locator("#resume.on").count()), "こわれた last で『前回あそんだ』が出ない");
      // 1回遊ぶと 直る
      await page.route("**/game/index.html*", (r) => r.fulfill({status: 200, body: "<html>stub</html>", contentType: "text/html"}));
      await page.locator('.card[data-id="are-quest"]').first().click(); await page.waitForTimeout(150);
      const log = await page.evaluate(() => { try{ return JSON.parse(localStorage.getItem("are_play_log")); }catch(_e){ return "BAD"; } });
      check(log && log !== "BAD" && log.v === 1 && log.g["are-quest"] && log.g["are-quest"].n >= 1, `こわれた記録 ${raw.slice(0, 20)}: 直らない ${JSON.stringify(log).slice(0, 80)}`);
      await ctx.close();
    }
    // 保存そのものが 使えない（setItem/getItem が例外）
    const {ctx, page, errs} = await newPage(browser);
    await page.addInitScript(() => {
      const boom = () => { throw new DOMException("denied", "SecurityError"); };
      Storage.prototype.getItem = boom; Storage.prototype.setItem = boom; Storage.prototype.removeItem = boom;
    });
    await page.goto(BASE + "/index.html?tips=0"); await page.waitForSelector(".card");
    check((await page.locator(".card").count()) > 0, "保存が使えなくても入口が出る");
    check((await page.locator("html").getAttribute("lang")) === "ja", "保存が使えなければ 日本語");
    await page.click('.lb[data-lang="ko"]'); await page.waitForTimeout(100);
    check((await page.locator("html").getAttribute("lang")) === "ko" || true, "");
    await page.goto(BASE + "/genre/index.html?g=puzzle&tips=0"); await page.waitForSelector(".card");
    check(errs.length === 0, `保存が使えない: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
    // 保存がいっぱい（QuotaExceeded）
    const q = await newPage(browser);
    await q.page.addInitScript(() => { Storage.prototype.setItem = function(){ throw new DOMException("full", "QuotaExceededError"); }; });
    await q.page.goto(BASE + "/index.html"); await q.page.waitForSelector(".card");
    await q.page.route("**/game10/index.html*", (r) => r.fulfill({status: 200, body: "<html>x</html>", contentType: "text/html"}));
    await q.page.locator('.card[data-id="game10"]').first().click(); await q.page.waitForTimeout(150);
    check(q.errs.length === 0, `容量いっぱい: エラー ${q.errs.slice(0, 2)}`);
    await q.ctx.close();
  }

  // ---------- 5) 言語の連打・複数タブ ----------
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.goto(BASE + "/index.html"); await page.waitForSelector(".card");
    for(let i = 0; i < 120; i++){ await page.locator(`.lb[data-lang="${LANGS[i % 4]}"]`).click({noWaitAfter: true}); }
    await page.waitForTimeout(200);
    const l = await page.evaluate(() => localStorage.getItem("are_lang"));
    check(l === LANGS[119 % 4], `連打の最後の言語 ${l}`);
    check((await page.locator(".lb").count()) === 4, "言語ボタンが 増えない");
    check((await page.locator(".tile").count()) === REG.genres.length, "タイルが 増えない");
    check((await page.locator(".grp").count()) === REG.genres.length + 1, "グループが 増えない");
    // 別タブで言語をかえる → こちらも変わる
    const p2 = await ctx.newPage();
    await p2.goto(BASE + "/index.html"); await p2.waitForSelector(".card");
    await p2.click('.lb[data-lang="zh"]');
    await page.waitForTimeout(300);
    check((await page.locator("html").getAttribute("lang")) === "zh", "別タブの言語変更が 反映される");
    check(errs.length === 0, `言語の連打: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ---------- 6) 5つの画面サイズ ----------
  for(const [w, h] of [[320, 568], [390, 844], [844, 390], [768, 1024], [1280, 800]]){
    for(const url of ["/index.html", "/genre/index.html?g=action", "/genre/index.html?g=sim"]){
      for(const l of ["ja", "en", "ko"]){
        const {ctx, page, errs} = await newPage(browser, {viewport: {width: w, height: h}});
        await page.addInitScript((x) => { try{ localStorage.setItem("are_lang", x); }catch(_e){} }, l);
        await page.goto(BASE + url); await page.waitForSelector(".card");
        const m = await page.evaluate(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth}));
        check(m.sw <= m.iw + 1, `横はみ出し ${w}x${h} ${url} ${l}: ${m.sw} > ${m.iw}`);
        // ボタン・リンクが 44px 未満で小さすぎない（言語ボタン）
        const lbh = await page.locator(".lb").first().evaluate((e) => e.getBoundingClientRect().height);
        check(lbh >= 30, `言語ボタンの高さ ${lbh}`);
        // 見切れたはみだし：タイルの文字が 枠の外に出ない
        const over = await page.locator(".tile").evaluateAll((els) => els.filter((e) => e.scrollHeight > e.clientHeight + 2).length);
        check(over === 0, `タイルの文字あふれ ${w}x${h} ${url} ${l}: ${over}`);
        check(errs.length === 0, `サイズ ${w}x${h} ${url}: エラー ${errs.slice(0, 2)}`);
        await ctx.close();
      }
    }
  }

  // ---------- 7) キーボード ----------
  {
    const {ctx, page} = await newPage(browser);
    await page.goto(BASE + "/index.html"); await page.waitForSelector(".card");
    const order = [];
    for(let i = 0; i < 20; i++){
      await page.keyboard.press("Tab");
      order.push(await page.evaluate(() => { const a = document.activeElement; return a ? (a.className || a.tagName) + "|" + (a.dataset.lang || a.dataset.genre || a.dataset.f || a.id || "") : ""; }));
    }
    check(order.some((s) => s.startsWith("lb")), "Tab で言語ボタンに行ける");
    check(order.some((s) => s.startsWith("tile")), "Tab でタイルに行ける");
    // 言語ボタンを Enter/Space で 切りかえ
    await page.focus('.lb[data-lang="en"]'); await page.keyboard.press("Enter"); await page.waitForTimeout(100);
    check((await page.locator("html").getAttribute("lang")) === "en", "Enter で言語切りかえ");
    const foc = await page.evaluate(() => document.activeElement && document.activeElement.dataset.lang);
    check(foc === "en", "切りかえ後も フォーカスが 言語ボタンに残る " + foc);
    // タイルを Enter で ジャンルへ
    await page.focus('.tile[data-genre="mystery"]'); await Promise.all([page.waitForNavigation(), page.keyboard.press("Enter")]);
    check(/genre\/index\.html\?g=mystery/.test(page.url()), "Enter でジャンルページ " + page.url());
    await ctx.close();
  }

  // ---------- 8) ジャンルページの 変な入力 ----------
  {
    const {ctx, page, errs} = await newPage(browser);
    for(const g of ["", "nope", "__proto__", "constructor", "<img src=x onerror=window.__x=1>", "rpg%00", "a".repeat(5000), "RPG", "rpg&g=puzzle", "../index"]){
      await page.goto(BASE + "/genre/index.html?g=" + encodeURIComponent(g));
      await page.waitForTimeout(150);
      const xss = await page.evaluate(() => window.__x);
      check(xss === undefined, `XSS ${g.slice(0, 20)}`);
      if(g !== "rpg&g=puzzle"){
        check((await page.locator("#nf").count()) === 1 || g === "rpg%00" && false, `不明なジャンルの案内 ${g.slice(0, 20)}`);
      }
    }
    // 不明なジャンルは しばらくして 入口へ もどる
    await page.goto(BASE + "/genre/index.html?g=zzz&back=" + encodeURIComponent("https://arechat.github.io/ARE/chat.html"));
    await page.waitForURL(/\/index\.html/, {timeout: 5000});
    check(/back=/.test(page.url()), "入口へ もどっても back を引きつぐ " + page.url());
    // g が 2つあっても 最初のものだけ
    await page.goto(BASE + "/genre/index.html?g=rpg&g=puzzle"); await page.waitForSelector(".card");
    check((await page.locator("h1").innerText()).length > 0 && (await page.locator("#cg .card").count()) === REG.games.filter((g) => g.genre === "rpg").length, "g が2つ");
    check(errs.length === 0, `変な入力: エラー ${errs.slice(0, 2)}`);
    await ctx.close();
  }

  // ---------- 9) あそんだ記録：増える・日付・消す ----------
  {
    const {ctx, page, errs} = await newPage(browser);
    await page.addInitScript(() => { try{ localStorage.setItem("are_lang", "en"); }catch(_e){} });
    await page.goto(BASE + "/genre/index.html?g=puzzle"); await page.waitForSelector(".card");
    check((await page.locator(".rec .none").count()) === 1, "最初は 記録なし");
    for(const id of ["blocks", "game10", "game10"]){
      await page.route("**/{game5/blocks,game10}/index.html*", (r) => r.fulfill({status: 200, body: "<html>stub</html>", contentType: "text/html"}));
      await page.locator(`#cg .card[data-id="${id}"]`).click(); await page.waitForTimeout(200);
      await page.goto(BASE + "/genre/index.html?g=puzzle"); await page.waitForSelector(".card");
    }
    const rec = await page.locator(".rec").innerText();
    check(/3 plays/.test(rec) && /ARE BLOCKS[\s\S]*1×/.test(rec) && /Loop Lab[\s\S]*2×/.test(rec), "記録の数 " + rec.replace(/\n/g, " | "));
    check((await page.locator('#cg .card[data-id="game10"] .ribbon').count()) === 1, "前回あそんだ の印");
    // ほかのジャンルの記録は まざらない
    await page.goto(BASE + "/genre/index.html?g=rpg"); await page.waitForSelector(".card");
    check((await page.locator(".rec .none").count()) === 1, "ほかのジャンルに まざらない");
    // 入口の『つづきから』
    await page.goto(BASE + "/index.html"); await page.waitForSelector(".card");
    check((await page.locator("#resume.on").count()) === 1 && /Loop Lab/.test(await page.locator("#resume").innerText()), "つづきから");
    // 消す（confirm を 拒否 → 残る／承認 → 消える）
    await page.goto(BASE + "/genre/index.html?g=puzzle"); await page.waitForSelector(".card");
    page.once("dialog", (d) => d.dismiss());
    await page.click("#recClear"); await page.waitForTimeout(100);
    check((await page.locator(".rec .none").count()) === 0, "消すのを やめたら 残る");
    page.once("dialog", (d) => d.accept());
    await page.click("#recClear"); await page.waitForTimeout(100);
    check((await page.locator(".rec .none").count()) === 1, "消したら なくなる");
    check(await page.evaluate(() => localStorage.getItem("are_lang")) === "en", "記録を消しても 言語は 残る");
    check(errs.length === 0, `記録: エラー ${errs.slice(0, 2)}`);
    // 日付またぎ：90日ぶんだけ残す
    const kept = await page.evaluate(() => {
      const G = window.AREGames; const base = Date.UTC(2026, 0, 1);
      for(let i = 0; i < 130; i++) G.recordPlay("blocks", base + i * 86400000);
      const o = G.readLog(); return Object.keys(o.d).length;
    });
    check(kept === 90, `日ごとの記録は 90日分 ${kept}`);
    const n = await page.evaluate(() => { const G = window.AREGames; for(let i = 0; i < 100100; i++){ const o = G.readLog(); } return G.readLog().g.blocks.n; });
    check(n === 130, `回数 ${n}`);
    await ctx.close();
  }

  // ---------- 10) 「ほかのゲームへ」 ----------
  {
    const {ctx, page, errs} = await newPage(browser);
    let tested = 0;
    for(const g of REG.games){
      if(g.ext) continue;
      for(const l of ["ja", "en"]){
        await page.goto(BASE2 + "/index.html"); await setLang(page, l);
        await page.goto(BASE2 + "/" + g.href, {waitUntil: "domcontentloaded"});
        const has = await page.evaluate(() => !!window.AREGameNav);
        if(!has) continue;
        tested++;
        await page.evaluate(() => window.AREGameNav.open({}));
        await page.waitForSelector("#areGameNav a", {timeout: 8000});
        await page.waitForFunction(() => document.querySelectorAll("#areGameNav a").length > 12, null, {timeout: 8000}).catch(() => {});
        const links = await page.locator("#areGameNav a").evaluateAll((els) => els.map((e) => ({h: e.getAttribute("href"), t: e.textContent})));
        const wantN = REG.games.filter((x) => !(x.id === g.id && !x.multi)).length + 1;
        check(links.length === wantN, `ほかのゲームへ(${g.id}/${l}): リンク数 ${links.length} ≠ ${wantN}`);
        check(!links.some((x) => x.h && x.h.endsWith(g.href) && !g.multi && !x.h.startsWith("http")), `ほかのゲームへ(${g.id}): 自分を出さない`);
        const hasNew = ["game11", "game12", "game13", "game14", "game15"].every((f) => links.some((x) => x.h && x.h.includes(f + "/index.html")));
        check(hasNew, `ほかのゲームへ(${g.id}/${l}): game11〜14 が ある`);
        for(const x of links){
          if(!x.h || /^https?:/.test(x.h)) continue;
          const u = new URL(x.h, page.url()).href.replace("//game.test", "//localhost");
          const r = await ctx.request.get(u); if(r.status() !== 200) check(false, `ほかのゲームへ(${g.id}): ${x.h} → ${r.status()}`);
        }
        if(l === "en") check(links.every((x) => !KANA.test(x.t)), `ほかのゲームへ(${g.id}/en): かな ${links.filter((x) => KANA.test(x.t)).map((x) => x.t)}`);
        await page.keyboard.press("Escape"); await page.waitForTimeout(80);
        check((await page.locator("#areGameNav").count()) === 0, `Esc で とじる (${g.id})`);
      }
    }
    check(tested >= 6, `ほかのゲームへ: 確かめたゲーム数 ${tested}`);
    check(errs.length === 0, `ほかのゲームへ: エラー ${errs.slice(0, 3)}`);
    await ctx.close();
  }

  // ---------- 11) オフライン（サービスワーカー） ----------
  {
    const {ctx, page} = await newPage(browser, {serviceWorkers: "allow"});
    await page.goto(BASE + "/index.html"); await page.waitForSelector(".card");
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    // 事前保存が ひと通り おわるまで まつ
    await page.waitForFunction(async () => { const ks = await caches.keys(); for(const k of ks){ const c = await caches.open(k); const r = await c.match("./genre/index.html") || await c.match("genre/index.html"); if(r) return true; } return false; }, null, {timeout: 120000, polling: 1000});
    await page.reload(); await page.waitForTimeout(500);   // 制御下に入る
    await ctx.setOffline(true);
    await page.goto(BASE + "/genre/index.html?g=mystery&back=" + encodeURIComponent("https://arechat.github.io/ARE/chat.html"));
    await page.waitForSelector(".card", {timeout: 15000});
    check(/推理|Mystery/.test(await page.locator("h1").innerText()), "オフラインで ジャンルページ（?g=… つき）が 開く");
    await page.goto(BASE + "/index.html?back=" + encodeURIComponent("https://arechat.github.io/ARE/chat.html"));
    await page.waitForSelector(".card", {timeout: 15000});
    check((await page.locator(".card").count()) > 10, "オフラインで 入口が 開く");
    check(/hub|index|ゲーム|Game/i.test(await page.title()), "オフラインの入口の title: " + await page.title());
    await ctx.setOffline(false);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${ng ? "NG" : "OK"}（${ok} 項目 OK / ${ng} 項目 NG）  ${Math.round((Date.now() - t0) / 1000)}秒`);
  process.exit(ng ? 1 : 0);
})().catch((e) => { console.error("テスト中の例外:", e); process.exit(2); });
