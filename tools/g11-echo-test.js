// こだまの部屋：ルールの テスト（こんなことまで？ という ところまで）
const EC = require(__dirname + "/../game11/js/ec-core.js");
global.window = {}; require(__dirname + "/../game11/js/ec-levels.js"); const LV = global.window.EC_LEVELS;
let ok = 0, ng = 0; const t = (n, c, d) => { if(c) ok++; else ng++; console.log((c ? "OK  " : "NG  ") + n + (c ? "" : " : " + JSON.stringify(d))); };
const P = rows => EC.parse({rows, echoes: 2});
// --- 基本 ---
{ const L = P(["#####","#S.G#","#####"]); const g = new EC.Game(L);
  t("1 かべに ぶつかる動きは「まつ」として きろく", (g.move("U"), g.cur === "W"));
  t("2 ふつうの 動き", (g.move("R"), g.cur === "WR"));
  t("3 ゴールで クリア", (g.move("R"), g.won()));
  t("4 クリア後は 動けない", g.move("R") === false && g.cur === "WRR");
  t("5 変な 文字は うけつけない", new EC.Game(L).move("X") === false && new EC.Game(L).move("") === false && new EC.Game(L).move("r") === false);
  t("6 ゲーム面の外へは 出られない", (()=>{ const g2 = new EC.Game(P(["S.G"])); g2.move("L"); g2.move("U"); g2.move("D"); return g2.cur === "WWW"; })());
}
// --- スイッチ・とびら ---
{ const L = P(["#######","#S.a.G#","#.#####","#1#####","#######"]);
  const r = EC.check(L, ["DD","WRRRR"]); t("7 こたえ通り クリア", r.ok, r);
  const r2 = EC.check(L, ["DD","RRRR"]); t("8 またずに すすむと とびらで とまる（クリアできない）", !r2.ok);
  const g = new EC.Game(L); "DD".split("").forEach(c=>g.move(c)); g.echo();
  const s = g.sim(); t("9 こだま作成後は はじめの場所に もどる", s.now.hero.x === 1 && s.now.hero.y === 1 && g.cur === "");
  "WW".split("").forEach(c=>g.move(c));
  t("10 こだまは 2手めで スイッチに のる", g.sim().now.echoes[0].x === 1 && g.sim().now.echoes[0].y === 3 && g.sim().now.open[1] === true);
  "WW".split("").forEach(c=>g.move(c));
  t("11 こだまは おわったら その場所で とまり つづける", g.sim().now.echoes[0].y === 3 && g.sim().now.open[1] === true);
  t("12 こだまを 作る前は こだまの数 0", new EC.Game(L).sim().echoes.length === 0);
}
{ // 主人公が 自分で スイッチに のって いるとき、そのとなりの とびらに はいれる（その手のはじめに ふんでいるので）
  const L = P(["######","#S1aG#","######"]); const r = EC.check(L, ["RRRR"]);
  t("13 スイッチの 上から となりの とびらへ すすめる", r.ok, r);
  const L2 = P(["#######","#S1.aG#","#######"]); t("14 スイッチを はなれたら とびらは とじる（ひとりでは ぬけられない）", !EC.check(L2, ["RRRR"]).ok);
}
{ // とびらの 上に こだまが いる時に とじる→ 動き
  const L = P(["#######","#S1a.G#","#######"]);
  const g = new EC.Game(L); g.move("R"); g.move("R"); // スイッチ→とびら
  t("15 とびらの 中に はいれる", g.sim().now.hero.x === 3, g.sim().now.hero);
}
// --- こだまの さいしょの 状態・上限 ---
{ const L = EC.parse({rows:["#####","#S1G#","#####"], echoes:1}); const g = new EC.Game(L);
  t("16 なにも 動かないと こだまは 作れない", g.canEcho() === false && g.echo() === false);
  g.move("W"); t("17 「まつ」だけでは こだまは 作れない", g.canEcho() === false);
  g.move("R"); t("18 1手 動いたら こだまを 作れる", g.canEcho() === true);
  g.echo(); g.move("R"); t("19 こだまの 上限をこえて 作れない", g.canEcho() === false && g.echo() === false);
  t("20 さいごの 「まつ」は こだまの ながさに ふくめない", (()=>{ const g2 = new EC.Game(L); g2.move("R"); g2.move("W"); g2.move("W"); g2.echo(); return g2.recs[0] === "R"; })());
  const g3 = new EC.Game(L); g3.move("R"); g3.echo(); t("21 undoEcho で こだまを もどす", g3.undoEcho() && g3.recs.length === 0 && g3.cur === "R");
  t("22 こだまが ないとき undoEcho は できない", new EC.Game(L).undoEcho() === false);
  const g4 = new EC.Game(L); g4.move("R"); g4.reset(); t("23 reset で ぜんぶ きえる", g4.cur === "" && g4.recs.length === 0 && g4.total() === 0);
  const g5 = new EC.Game(L); g5.move("R"); g5.redoRound(); t("24 redoRound は こだまを けさない", g5.cur === "" && (g5.move("R"), g5.echo(), g5.redoRound(), g5.recs.length === 1));
}
// --- 長さの 上限 ---
{ const L = EC.parse({rows:["#####","#SG.#","#####"], echoes:1}); const g = new EC.Game(L); let n = 0; for(let i = 0; i < 200; i++){ if(g.move("W")) n++; }
  t("25 1ラウンドの ながさの 上限 " + EC.MAXT, n === EC.MAXT && g.cur.length === EC.MAXT, n); }
// --- 同じ場所・入れかわり ---
{ const L = EC.parse({rows:["#####","#S.G#","#####"], echoes:1}); const g = new EC.Game(L); g.move("R"); g.echo(); g.move("R");
  const s = g.sim(); t("26 こだまと 主人公は おなじ マスに いられる（ぶつからない）", s.now.echoes[0].x === 2 && s.now.hero.x === 2); }
{ const L = EC.parse({rows:["#####","#S.G#","#####"], echoes:1}); const g = new EC.Game(L); g.move("R"); g.move("R"); g.echo();   // こだま：RR で ゴール前
  g.move("R"); g.move("R"); t("27 こだまが ゴールに 先に ついても クリアに ならない（主人公だけ）", g.won() === true && g.sim().wonTick === 2); }
{ const L = EC.parse({rows:["#######","#S.G..#","#######"], echoes:1}); const g = new EC.Game(L); "RR".split("").forEach(c=>g.move(c));
  t("28 ゴールに ついた ラウンドは こだまに できない（クリアで おわり）", g.won() === true && g.canEcho() === false && g.echo() === false); }
// --- こだまが とびらで ブロックされる（再生の とき状態が ちがう） ---
{ const L = EC.parse({rows:["#########","#S.a.G..#","#.#####.#","#1#####.#","#########"], echoes:2});
  const g = new EC.Game(L); "RRRR".split("").forEach(c=>g.move(c));   // R R: 2 まで、あとは とびらで ブロック
  t("29 とびらが しまっている ときの 動きは「まつ」", g.cur === "RWWW", g.cur); }
// --- 決まった 入力は いつも 同じ 結果（さいげんせい）---
{ const L = EC.parse(LV[3]); const a = EC.check(L, LV[3].sol), b = EC.check(L, LV[3].sol); t("30 同じ入力は 同じ結果", JSON.stringify(a.game.sim().hero) === JSON.stringify(b.game.sim().hero)); }
// --- ステージ全部 ---
LV.forEach((d, i) => {
  const n = i + 1, L = EC.parse(d);
  const r = EC.check(L, d.sol); t("S" + n + " こたえで クリアできる", r.ok, r.why);
  t("S" + n + " さいたん手数（par）と こたえの 手数が 同じ", r.total === d.par, [r.total, d.par]);
  t("S" + n + " こたえの ラウンド数 ＝ こだま数 ＋ 1", d.sol.length === d.echoes + 1 || d.sol.length <= d.echoes + 1, d.sol.length);
  t("S" + n + " S と G が ちょうど 1つ", d.rows.join("").split("S").length === 2 && d.rows.join("").split("G").length === 2);
  const ids = {}; L.plates.forEach(p => ids["p" + p.id] = 1); L.doors.forEach(q => ids["d" + q.id] = 1);
  t("S" + n + " スイッチの 番号ごとに とびらが ある", L.plates.every(p => L.doors.some(q => q.id === p.id)) && L.doors.every(q => L.plates.some(p => p.id === q.id)));
  t("S" + n + " まわりが かべで かこまれている", d.rows.every(r => r[0] === "#" && r[r.length - 1] === "#") && /^#+$/.test(d.rows[0]) && /^#+$/.test(d.rows[d.rows.length - 1]));
  t("S" + n + " どの行も おなじ 長さ", d.rows.every(r => r.length === d.rows[0].length));
  t("S" + n + " こだまなし では クリアできない（ひとりで ぬけ道が ない）", !EC.check(L, [d.sol[d.sol.length - 1]]).ok || d.echoes === 0);
});
console.log("\nルールの テスト", ok, "/", ok + ng); process.exit(ng ? 1 : 0);
