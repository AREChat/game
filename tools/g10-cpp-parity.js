// ループ・ラボの C++（ステージ自動生成＋ソルバー）を、ほんもののルール（game10/js/sim.js）と 突き合わせる検査。
//   sh game10/build.sh && node tools/g10-cpp-parity.js [ステージ数/むずかしさ=300] [--native /tmp/g10main]
// 見る点：
//   1) levels.js の 10ステージ：C++ の「さいしょうの ぶんしん数」が お手本(par)と 一致
//   2) つくった ステージ：かたち（S・E が 1つ／トビラには ボタン／大きさ）・むずかしさの はんい・おなじ seed → おなじステージ
//   3) JS の ソルバー（sim.js の plan だけで 数える）が 出す 最少人数が C++ と 一致し、その 手順で ほんとうに クリアできる
//   4) こわれた 地図・ひどい 入力でも C++ が とまらない（-1/-2/-3 を返す）
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");
const Sim = require("../game10/js/sim.js");
const N = Number(process.argv.find((a) => /^\d+$/.test(a)) || 300);
let ok = 0, ng = 0; const fails = [];
function check(c, m){ if(c) ok++; else{ ng++; fails.push(m); if(fails.length <= 20) console.log("NG:", m); } }

const win = {}; new Function("window", fs.readFileSync(path.join(__dirname, "../game10/js/levels.js"), "utf8"))(win);
const LEVELS = win.G10_LEVELS;

// ---- JS の 基準ソルバー：sim.js の plan() と step() だけで、最少人数を 数える（hint() と おなじ やりかた）----
function jsMin(lv, maxG){
  const g = Sim.parse(lv), all = []; Object.keys(g.plates).forEach((k) => g.plates[k].forEach((p) => all.push(p)));
  const steps = lv.steps - 1;
  for(let n = 0; n <= maxG; n++){
    let sol = null;
    (function rec(gs, used, depth){
      if(sol) return;
      const fin = Sim.plan(g, gs, g.E, steps);
      if(fin){ sol = {ghosts: gs, final: fin}; return; }
      if(depth >= n) return;
      for(const p of all){
        const key = p.join(","); if(used[key] || sol) continue;
        const path = Sim.plan(g, gs, p, steps); if(!path) continue;
        const run = Sim.newRun(g); path.forEach((d) => Sim.step(g, gs, run, d));
        const u = Object.assign({}, used); u[key] = 1; rec(gs.concat([run.path]), u, depth + 1);
      }
    })([], {}, 0);
    if(sol) return Object.assign({n}, sol);
  }
  return null;
}
// 手順どおりに ほんもののルールで あそんで、出口に つくか（歩数は lv.steps まで）
function replay(lv, sol){
  const g = Sim.parse(lv); let ghosts = sol.ghosts;
  if(sol.ghosts.some((p) => p.length - 1 > lv.steps)) return false;
  const run = Sim.newRun(g); let win = false, left = lv.steps;
  for(const d of sol.final){ if(left-- <= 0) return false; const r = Sim.step(g, ghosts, run, d); if(r.win){ win = true; break; } }
  return win;
}

(async () => {
  const t0 = Date.now();
  const wasm = fs.readFileSync(path.join(__dirname, "../game10/js/g10gen.wasm"));
  const {instance} = await WebAssembly.instantiate(wasm, {});
  const E = instance.exports;
  check(E.g10_ping() === 1010, "ping");
  const mem = () => new Uint8Array(E.memory.buffer);
  function putIn(s){ const b = Buffer.from(s, "utf8"), cap = E.g10_incap(); if(b.length >= cap) return false; const m = mem(), p = E.g10_inbuf(); m.set(b, p); m[p + b.length] = 0; return true; }
  function getOut(){ const m = mem(); let i = E.g10_outbuf(), s = ""; while(m[i]) s += String.fromCharCode(m[i++]); return s; }
  const par = (mapRows, steps) => { putIn(mapRows.join("\n") + "\n"); return E.g10_par(steps); };
  function gen(seed, level){ const n = E.g10_gen(seed >>> 0, level); if(!n) return null; const t = getOut(); const L = t.split("\n"); return {steps: Number(L[0]), par: Number(L[1]), map: L.slice(2).filter((x) => x.length), text: t, n}; }

  // 1) 10ステージ
  LEVELS.forEach((lv, i) => {
    const p = par(lv.map, lv.steps);
    check(p === lv.par, `ステージ${i + 1}「${lv.name}」: C++ の最少=${p} お手本=${lv.par}`);
    const js = jsMin(lv, lv.par + 1);
    check(js && js.n === p, `ステージ${i + 1}: JS の最少=${js && js.n} C++=${p}`);
    check(js && replay(lv, js), `ステージ${i + 1}: JS の手順で クリアできない`);
  });
  // もし 歩数が たりなければ 解けない／ぶんしんが 少なすぎても 解けない を 確かめる
  check(par(LEVELS[0].map, 3) === -1, "歩数が たりない → 解けない(-1)");
  check(par(LEVELS[9].map, 2) === -1, "最終ステージ 歩数2 → -1");

  // 2・3) つくったステージ
  const RANGE = {1: [1, 2], 2: [2, 3], 3: [3, 5]};
  let made = 0, maxMs = 0, sumPar = {1: 0, 2: 0, 3: 0}, diffMax = 0;
  const seen = new Map();
  for(const level of [1, 2, 3]){
    const per = level === 3 ? Math.ceil(N / 2) : N;
    for(let k = 0; k < per; k++){
      const seed = (k * 7919 + level * 31 + 1) >>> 0;
      const t1 = Date.now(); const lv = gen(seed, level); const ms = Date.now() - t1; if(ms > maxMs) maxMs = ms;
      if(!lv){ check(false, `生成に しっぱい level${level} seed${seed}`); continue; }
      made++; sumPar[level] += lv.par;
      const m = lv.map, W = m[0].length;
      check(m.every((r) => r.length === W), `形 level${level} seed${seed}: 行の長さ`);
      check(m.length >= 5 && m.length <= 8 && W >= 9 && W <= 18, `大きさ level${level} seed${seed}: ${W}x${m.length}`);
      const flat = m.join("");
      check((flat.match(/S/g) || []).length === 1 && (flat.match(/E/g) || []).length === 1, `S・E level${level} seed${seed}`);
      for(const L of "ABCD"){ const doors = (flat.match(new RegExp(L, "g")) || []).length, plates = (flat.match(new RegExp(L.toLowerCase(), "g")) || []).length; check(doors === 0 ? plates === 0 : (doors === 1 && plates >= 1 && plates <= 2), `トビラ${L}とボタン level${level} seed${seed}: ${doors}/${plates}`); }
      check(!/[^#.SEabcdABCD]/.test(flat), `へんな文字 level${level} seed${seed}`);
      check(lv.par >= RANGE[level][0] && lv.par <= RANGE[level][1], `むずかしさ level${level} seed${seed}: par=${lv.par}`);
      check(lv.steps >= 10 && lv.steps <= 100, `歩数 level${level} seed${seed}: ${lv.steps}`);
      // 外枠は かべ
      check(m[0].split("").every((c) => c === "#") && m[m.length - 1].split("").every((c) => c === "#") && m.every((r) => r[0] === "#" && r[W - 1] === "#"), `外枠 level${level} seed${seed}`);
      // おなじ seed → おなじステージ（もういちど つくる）
      const again = gen(seed, level); check(again && again.text === lv.text, `再現 level${level} seed${seed}`);
      // JS の基準
      if(k % 3 === 0){
        const L = {name: "x", steps: lv.steps, par: lv.par, map: lv.map};
        const js = jsMin(L, lv.par + 1);
        check(js && js.n === lv.par, `JS と C++ の最少人数 level${level} seed${seed}: JS=${js && js.n} C++=${lv.par}\n${lv.map.join("\n")}`);
        check(js && replay(L, js), `クリアできない level${level} seed${seed}`);
        // C++ の g10_par も 同じ答え
        check(par(lv.map, lv.steps) === lv.par, `g10_par level${level} seed${seed}`);
        // 歩数を へらすと 解けなくなる（ぎりぎり）か 人数が ふえる → par は 増えるだけ
        const tight = par(lv.map, Math.max(3, Math.floor(lv.steps / 2)));
        check(tight === -1 || tight >= lv.par, `歩数を へらしたら par が へった level${level} seed${seed}: ${tight} < ${lv.par}`);
      }
      seen.set(lv.text, (seen.get(lv.text) || 0) + 1);
    }
  }
  const dup = [...seen.values()].filter((v) => v > 1).length;
  check(dup <= made * 0.02, `おなじステージが 多すぎる: ${dup}/${made}`);
  console.log(`つくった ${made} ステージ／生成の いちばん長い 1回 ${maxMs}ms／平均 par: かんたん ${(sumPar[1] / N).toFixed(2)} ふつう ${(sumPar[2] / N).toFixed(2)} むずかしい ${(sumPar[3] / Math.ceil(N / 2)).toFixed(2)}／重複 ${dup}`);

  // 他の level 番号（0 や 99 や 負）は はんい内に ならす
  check(gen(5, 0) && gen(5, 99) && gen(5, -3), "level の はんいがい");
  check(gen(0, 1) && gen(0xFFFFFFFF, 2) && gen(4294967295, 3), "seed の 両はし");

  // 4) ひどい入力
  const ugly = [
    "", "\n\n\n", "###", "S", "SE", "#S#\n#E#\n###\n", "#####\n#S.E#\n#####\n", "#####\n#S.E#\n##\n", "#######\n#S.A.E#\n#######\n",
    "#######\n#S.aAE#\n#######\n" + "x".repeat(40) + "\n", "@@@@@@\n@SE@@@\n@@@@@@\n", "#SE#\n#SE#\n#...#\n", "#########\n#S.aaaaaaaaaaaaaa.E#\n#########\n",
    ("#".repeat(30) + "\n").repeat(5), ("#".repeat(10) + "\n").repeat(40), "#####\n#S..E\n#####\n", "ééé\n", "\0", "#S.E#\r\n#.a.#\r\n#####\r\n",
    "######\n#S.bB#\n#a.AE#\n######\n", "#######\n#SabcdE#\n#######\n", "#######\n#S.AAE#\n#######\n", "#####\n#SEE#\n#####\n"
  ];
  const rnd = (() => { let a = 12345; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; })();
  for(let i = 0; i < 400; i++){   // ランダムな 文字の 地図
    const W = 3 + Math.floor(rnd() * 12), H = 3 + Math.floor(rnd() * 7), rows = [];
    for(let y = 0; y < H; y++){ let r = ""; for(let x = 0; x < W; x++) r += "#..SEabcdABCD"[Math.floor(rnd() * 13)]; rows.push(r); }
    ugly.push(rows.join("\n"));
  }
  let stuck = 0;
  for(const u of ugly){
    for(const steps of [0, 1, 5, 40, 101, 102, 1000, -5]){
      let r;
      try{ if(!putIn(u)){ r = -3; } else r = E.g10_par(steps); }catch(e){ stuck++; check(false, `トラップ: ${JSON.stringify(u).slice(0, 40)} steps=${steps} ${e.message}`); continue; }
      check(Number.isInteger(r) && r >= -3 && r <= 8, `ひどい入力 ${JSON.stringify(u).slice(0, 30)} steps=${steps} → ${r}`);
    }
  }
  // 入力バッファを 超える 長さは JS 側で はじく（C++ へ わたさない）→ 2047文字ちょうどまでは 読める
  check(putIn("#".repeat(2000)) && E.g10_par(10) === -3, "長い入力");
  // メモリが 増えていない（固定メモリ）
  check(E.memory.buffer.byteLength === 1048576, `メモリが かわった ${E.memory.buffer.byteLength}`);

  // ネイティブ版（g++）と WebAssembly 版が おなじステージを つくる（どの端末でも きょうのステージが 同じ）
  const nat = process.argv.indexOf("--native") >= 0 ? process.argv[process.argv.indexOf("--native") + 1] : "";
  if(nat && fs.existsSync(nat)){
    let same = 0, tot = 0;
    for(const level of [1, 2, 3]){
      const out = cp.execFileSync(nat, ["dump", String(level), "1", "400"], {maxBuffer: 1 << 26}).toString().split("\u0001");
      for(let k = 0; k < 400; k++){ const lv = gen(1 + k, level); tot++; if(lv && out[k] && out[k].trim() === lv.text.trim()) same++; else if(ng < 5) console.log("ちがい", level, 1 + k); }
    }
    check(same === tot, `ネイティブと WebAssembly の ステージが ちがう ${tot - same}/${tot}`);
    console.log(`ネイティブ版と WebAssembly 版：${same}/${tot} 同じ`);
  }

  console.log(`\n結果: OK ${ok} ／ NG ${ng}（${Math.round((Date.now() - t0) / 1000)}秒）`);
  if(ng){ console.log(fails.slice(0, 20).join("\n")); process.exit(1); }
})().catch((e) => { console.error("テスト自体が 失敗:", e); process.exit(2); });
