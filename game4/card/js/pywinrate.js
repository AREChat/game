"use strict";
// ===== 勝率予測（Python／Pyodideの かんたんなAI分析）=====
// ・盤面のじょうきょう（HP・ユニットの強さ・手札・ランプ）から、あなたの勝率をPythonで見つもる
// ・HUDの ❤ の横に「🔮 勝率◯%」として表示する。むずかしい演算はぜんぶ Python 側
// ・Pyodideが読みこめない（オフライン等）ときは、何も表示しないだけで、対戦には影響しない
(function(){
    let pyReadyPromise = null;
    function loadPyodide(){
        if(pyReadyPromise) return pyReadyPromise;
        pyReadyPromise = new Promise((resolve, reject) => {
            if(window.loadPyodide){ window.loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"}).then(resolve, reject); return; }
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
            s.onload = () => { window.loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"}).then(resolve, reject); };
            s.onerror = () => reject(new Error("pyodide.jsの読みこみに失敗"));
            document.head.appendChild(s);
        });
        return pyReadyPromise;
    }

    const PY_SRC = [
        "import json, math",
        "",
        "def win_probability(state_json):",
        "    s = json.loads(state_json)",
        "    me, foe = s['me'], s['foe']",
        "    # HPの差（本拠地）",
        "    hp_term = (me['hp'] - foe['hp']) / 20.0",
        "    # 盤面の強さ（攻撃力×生存HPの見積もり）の差",
        "    def board_power(b):",
        "        return sum((u['atk'] + 0.5) * math.sqrt(max(u['hp'], 0)) for u in b)",
        "    board_term = (board_power(me['board']) - board_power(foe['board'])) / 10.0",
        "    # 手札・資源(ランプ)の差",
        "    hand_term = (me['hand'] - foe['hand']) * 0.12",
        "    lamp_term = (me['lamps'] - foe['lamps']) * 0.15",
        "    z = hp_term + board_term + hand_term + lamp_term",
        "    p = 1.0 / (1.0 + math.exp(-z))",
        "    return round(p * 100, 1)",
    ].join("\n");

    let winFn = null;
    async function ensureFn(){
        const pyodide = await loadPyodide();
        if(!winFn){
            pyodide.runPython(PY_SRC);
            winFn = pyodide.globals.get("win_probability");
        }
        return winFn;
    }

    function boardOf(G, side){
        const db = G.db;
        return G.p[side].board.filter(Boolean).map((u) => ({atk: u.atk, hp: u.hp, cost: db[u.id] ? db[u.id].cost : 0}));
    }

    let busy = false, lastKey = "", badge = null;
    function ensureBadge(){
        if(badge && document.body.contains(badge)) return badge;
        const meBox = document.getElementById("meBox");
        if(!meBox) return null;
        badge = document.createElement("span");
        badge.id = "pyWinRate";
        badge.title = "Python(Pyodide)で見つもった、あなたの勝率の目安";
        badge.style.cssText = "margin-left:.4em;opacity:.85;";
        meBox.appendChild(badge);
        return badge;
    }

    async function update(G){
        try{
            if(!G || G.over) return;
            const el = ensureBadge(); if(!el) return;
            const me = G.p[0], foe = G.p[1];
            const state = {
                me: {hp: me.base.hp, hand: me.hand.length, lamps: me.lamps, board: boardOf(G, 0)},
                foe: {hp: foe.base.hp, hand: foe.hand.length, lamps: foe.lamps, board: boardOf(G, 1)},
            };
            const key = JSON.stringify(state);
            if(key === lastKey) return;
            lastKey = key;
            if(busy) return;
            busy = true;
            if(!el.textContent) el.textContent = "🔮 …";
            const fn = await ensureFn();
            const p = fn(JSON.stringify(state));
            el.textContent = "🔮 勝率" + p + "%";
        }catch(_e){
            // Pyodideが使えない環境では、そっと表示をあきらめる（対戦には影響なし）
        }finally{
            busy = false;
        }
    }

    window.PyWinRate = {update};
})();
