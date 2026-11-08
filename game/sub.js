"use strict";
// ===== 本編 Map1〜10 の クリア後に ひらく 任意サブストーリー（9作品・各10話＝合計90話。前編5話＋後編5話）=====
//   ssa〜ssj ＝ Map1〜10。 LDX（ld.js）を そのまま つかう。
const SUB_MAPS = [  // key, 親のMap(ゲートID), 本編の おすすめLv, 話数, 名前
    ["ssa", "sendai", 1, 10, "コード・オブ・デスティニー"],
    ["ssb", "tokyo", 3, 10, "リプレイワールド"],
    ["ssc", "white", 10, 10, "人生2周目"],
    ["sse", "labn", 20, 10, "楽しい時ほど、大さんじ！？"],
    ["ssf", "n8", 28, 10, "人生おにハードモード"],
    ["ssg", "n9", 33, 10, "職業せんたく"],
    ["ssh", "n10", 38, 10, "デビルバイト"],
    ["ssi", "n11", 43, 10, "うそつきは うそはるの はじまり"],
    ["ssj", "future", 48, 10, "余命7日間の 彼女"]
];
SUB_MAPS.forEach((s) => { LD_EPS[s[0]] = []; LD_AREA[s[0]] = s[4]; });
// 20話ぶん書いてあった 3作品（ssa・ssb・ssc）は、2話ずつ ひとつに まとめて 10話（前編5話＋後編5話）にする。
// そのぶん 1話の長さ（場面・たたかい・ごほうび）は 2倍になる。ファイルは 書いたまま（20話ぶん）で、ここで まとめる。
const SUB_MERGE = {ssa:20, ssb:20, ssc:20};
const SUB_Q = {};
// その話の おすすめレベルを きめる（Map の おすすめ + 2 から じわじわ 上がる）。total＝もとの 話数
function SBlvT(key, n, total){
    const s = SUB_MAPS.find((x) => x[0] === key), lo = s[2] + 2, span = total >= 20 ? 14 : 8;
    return Math.min(99, lo + Math.round((n - 1) * span / (total - 1)));
}
// 10話に まとめたあとの 話数 n（1〜10）の おすすめレベル。もとが 20話の作品は、2話ぶんの 真ん中あたりを とる
function SBlv(key, n){
    const s = SUB_MAPS.find((x) => x[0] === key);
    return SUB_MERGE[key] ? SBlvT(key, n * 2, SUB_MERGE[key]) : SBlvT(key, n, s[3]);
}
// SB(キー, 話, {…LDX と おなじ（lvは じどう）})
function SB(key, n, c){
    const s = SUB_MAPS.find((x) => x[0] === key);
    if(SUB_MERGE[key]){                                          // 20話ぶんを ためて、20話目で まとめて 10話にする
        (SUB_Q[key] = SUB_Q[key] || [])[n - 1] = c;
        if(n < SUB_MERGE[key]) return;
        const q = SUB_Q[key], half = q.length / 2;
        for(let k = 1; k <= half; k++){
            const a = q[2 * k - 2], b = q[2 * k - 1];
            const pre = (t) => String(t || "").replace(/^(前編|後編)[①-⑳0-9]*\s*/, "");   // 「前編① 」の かざりは つけなおす
            const part = k <= half / 2 ? "前編" : "後編", no = "①②③④⑤⑥⑦⑧⑨⑩"[(k - 1) % (half / 2)];
            const base = Math.round((1500 + SBlvT(key, 2 * k - 1, 20) * 160 + (2 * k - 1) * 120 + 1500 + SBlvT(key, 2 * k, 20) * 160 + (2 * k) * 120) / 2) * 2;
            const m = Object.assign({}, a, {
                title: part + no + " " + pre(a.title) + "／" + pre(b.title),
                area: LD_AREA[key] + " " + part,
                steps: a.steps.concat(b.steps),
                talks: (a.talks || []).concat(b.talks || []),
                fin: b.fin, after: b.after || a.after,
                learn: a.learn === b.learn ? a.learn : [a.learn, b.learn].filter(Boolean).join("　／　"),
                base: base,
                lv: SBlv(key, k), last: k === s[3]
            });
            LDX(key, k, m);
        }
        return;
    }
    LDX(key, n, Object.assign({lv:SBlv(key, n), last:n === s[3], base:1500 + SBlv(key, n) * 160 + n * 120}, c));
}
// 人を おく 場所を ふやす（1話に 場面が 8つ ちかく になるので）。下の はしは どの 場面も 歩ける
Y_SLOT.push([1, 10], [11, 10], [13, 10], [15, 10]);
// ---- むかしの セーブデータを 10話に あわせる（20話ぶんの 進み具合を 2話ずつ まとめる）----
window.tqSubMigrate = function(S){
    try{
        if(!S || !S.f || S.f.ss_m10) return;
        Object.keys(SUB_MERGE).forEach((key) => {
            const old = (n) => !!S.f["e_" + key + n], total = SUB_MERGE[key], half = total / 2;
            const done = []; for(let k = 1; k <= half; k++) done[k] = old(2 * k - 1) && old(2 * k);
            const wasAll = !!S.f["e_" + key + "_all"];
            for(let n = 1; n <= total; n++){
                delete S.f["e_" + key + n]; delete S.f[key + n + "_in"];
                for(let i = 1; i <= 10; i++) delete S.f[key + n + "s" + i];
            }
            for(let k = 1; k <= half; k++) if(done[k] || wasAll) S.f["e_" + key + k] = 1;
            if(wasAll || done.slice(1).every(Boolean)) S.f["e_" + key + "_all"] = 1; else delete S.f["e_" + key + "_all"];
            const m = new RegExp("^" + key + "(\\d+)$").exec(S.map || "");     // 消えた 話の マップに いたら、まとめた 話の 入口へ
            if(m && parseInt(m[1], 10) > half || m && !RPG_MAPS[S.map]){ S.map = key + Math.min(half, Math.ceil(parseInt(m[1], 10) / 2)); S.x = S.px = 9; S.y = S.py = 10; S.dir = "up"; }
        });
        S.f.ss_m10 = 1;
    }catch(_e){}
};
// 作品の さいごの ごほうび
SUB_MAPS.forEach((s, i) => {
    RPG_EV[s[0] + "_final"] = YKL(["語り手｜『" + s[4] + "』の " + s[3] + "話は ぜんぶ おしまい。", "語り手｜さいごまで 見てくれて ありがとう！ きみの ぼうけんに、とっておきの ごほうびを おくるよ。"])
        .concat([["gold", 30000 + i * 6000], ["item", "special", 5 + i], ["item", "omamori", 2 + (i >> 1)], rpgN((30000 + i * 6000).toLocaleString() + "G と スペシャルおにぎり " + (5 + i) + "こ・ふっかつのおまもり " + (2 + (i >> 1)) + "こを てにいれた！"), ["set", "e_" + s[0] + "_all"], ["run", "lab_ret_go"]]);
});
Object.assign(Y_PEOPLE, {
    "蒼太":["#f6d2b0", "#1b1b27", "short", "#2f6fdc", "#374151", "glasses"], "健斗":["#f6d2b0", "#3a2a1a", "spike", "#f2994a", "#374151", "none"],
    "美咲":["#f9d9bd", "#1b1b27", "long", "#d65a8a", "#4b3a6b", "none"], "竜也":["#f3cfae", "#222", "short", "#3b4a66", "#2b2b3a", "none"],
    "さえこ":["#f9d9bd", "#2a1a14", "long", "#2b2b3a", "#2b2b3a", "none"], "龍之介":["#f0d2b4", "#cfcfcf", "short", "#556", "#444", "glasses"]
});
// 戦う 相手（おすすめレベルと 画像は じどうで きまる）
const SBF = (key, n, name, emo, say, mult) => ldFoe(key + n + "_f", name, emo, key + n + "_boss", SUB_MERGE[key] ? SBlvT(key, n, SUB_MERGE[key]) : SBlv(key, n),
    [[name.split(" ").pop().slice(0, 4) + "アタック", 0, 1, 1.2], ["ぐるぐる ノイズ", 1, 0.7, 0.9], ["どっしり ジャンプ", 0, 0.6, 1.6]], (name + "「" + (say || "いい 勝負だったよ！") + "」"), mult || 1.1);
