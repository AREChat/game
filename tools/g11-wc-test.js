"use strict";
// ことばクラフト：ステージの 検査  node tools/g11-wc-test.js [番号]
//  ①なにも おかないと クリアできない ②用意した こたえ(sol)で クリアできる ③こたえの ことば数 ≦ limit
const path = require("path"), D = path.join(__dirname, "..", "game11", "js");
const WC = require(path.join(D, "wc-core.js")), S = require(path.join(D, "wc-stages.js"));
const only = process.argv[2] ? +process.argv[2] : 0;
let bad = 0;
S.forEach((st) => {
    if(only && st.id !== only) return;
    const none = WC.simulate(st, [], 2400);
    const sol = WC.simulate(st, st.sol, 2400);
    const okNone = none.status !== "win", okSol = sol.status === "win", okLim = st.sol.length <= st.limit;
    const line = `#${st.id} ${st.name.ja}: なし=${none.status}${none.reason ? "(" + none.reason + ")" : ""} こたえ=${sol.status}${sol.reason ? "(" + sol.reason + ")" : ""} ${sol.steps}st words=${st.sol.length}/${st.limit}`;
    if(okNone && okSol && okLim) console.log("OK  " + line); else { bad++; console.log("NG  " + line); }
});
console.log(bad ? "NG " + bad : "ALL OK");
process.exit(bad ? 1 : 0);
