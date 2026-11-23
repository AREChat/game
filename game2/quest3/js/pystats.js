"use strict";
// ===== せんせき分析（Python／Pyodideで統計をけいさん）=====
// ・バトルの記録（勝敗・ターン数・ゴールド・けいけんち・かかった時間）をlocalStorageにためる
// ・タイトル画面のボタンから、Pythonで集計した統計（勝率・平均ターン・最高連勝・分布）を表示する
// ・Pyodideが読みこめない（オフライン等）ときは、その旨を表示するだけで、ゲーム本編には影響しない
(function(){
    const LSKEY = "quest3_battlelog_v1";
    const MAXLOG = 300;

    function loadLog(){
        try{ const a = JSON.parse(localStorage.getItem(LSKEY) || "[]"); return Array.isArray(a) ? a : []; }
        catch(_e){ return []; }
    }
    function saveLog(a){ try{ localStorage.setItem(LSKEY, JSON.stringify(a.slice(-MAXLOG))); }catch(_e){} }
    function record(entry){
        const log = loadLog();
        log.push(Object.assign({t: Date.now()}, entry));
        saveLog(log);
    }

    let pyReadyPromise = null;
    function loadPyodide(){
        if(pyReadyPromise) return pyReadyPromise;
        pyReadyPromise = new Promise((resolve, reject) => {
            if(window.loadPyodide){ window.loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"}).then(resolve, reject); return; }
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
            s.onload = () => { window.loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"}).then(resolve, reject); };
            s.onerror = () => reject(new Error("pyodide.jsの読みこみに失敗しました（ネットワークを確認してください）"));
            document.head.appendChild(s);
        });
        return pyReadyPromise;
    }

    const PY_SRC = [
        "import json",
        "",
        "def analyze(records_json):",
        "    records = json.loads(records_json)",
        "    n = len(records)",
        "    if n == 0:",
        "        return json.dumps({'n': 0})",
        "    wins = sum(1 for r in records if r.get('result') == 'win')",
        "    loses = sum(1 for r in records if r.get('result') == 'lose')",
        "    runs = sum(1 for r in records if r.get('result') == 'run')",
        "    rounds = [r.get('rounds', 0) for r in records]",
        "    golds = [r.get('gold', 0) for r in records]",
        "    exps = [r.get('exp', 0) for r in records]",
        "    mss = [r.get('ms', 0) for r in records]",
        "    def avg(a):",
        "        return sum(a) / len(a) if a else 0",
        "    streak = 0",
        "    best = 0",
        "    for r in records:",
        "        if r.get('result') == 'win':",
        "            streak += 1",
        "            best = max(best, streak)",
        "        else:",
        "            streak = 0",
        "    buckets = [0, 0, 0, 0, 0]",
        "    for rc in rounds:",
        "        if rc <= 2: buckets[0] += 1",
        "        elif rc <= 4: buckets[1] += 1",
        "        elif rc <= 6: buckets[2] += 1",
        "        elif rc <= 8: buckets[3] += 1",
        "        else: buckets[4] += 1",
        "    boss_n = sum(1 for r in records if r.get('boss'))",
        "    boss_wins = sum(1 for r in records if r.get('boss') and r.get('result') == 'win')",
        "    out = {",
        "        'n': n, 'wins': wins, 'loses': loses, 'runs': runs,",
        "        'winRate': round(wins / n * 100, 1),",
        "        'avgRounds': round(avg(rounds), 2),",
        "        'avgGold': round(avg(golds), 1),",
        "        'avgExp': round(avg(exps), 1),",
        "        'avgSec': round(avg(mss) / 1000, 2),",
        "        'bestStreak': best,",
        "        'histogram': buckets,",
        "        'bossBattles': boss_n,",
        "        'bossWinRate': (round(boss_wins / boss_n * 100, 1) if boss_n else None),",
        "    }",
        "    return json.dumps(out)",
    ].join("\n");

    let analyzeFn = null;
    async function analyze(){
        const pyodide = await loadPyodide();
        if(!analyzeFn){
            pyodide.runPython(PY_SRC);
            analyzeFn = pyodide.globals.get("analyze");
        }
        const log = loadLog();
        return JSON.parse(analyzeFn(JSON.stringify(log)));
    }

    function ensurePanel(){
        let el = document.getElementById("pystatsPanel");
        if(el) return el;
        el = document.createElement("div");
        el.id = "pystatsPanel";
        el.style.cssText = "position:fixed;inset:0;background:rgba(6,10,30,.88);color:#fff;z-index:9999;display:none;align-items:center;justify-content:center;font-family:inherit;";
        el.innerHTML = '<div style="max-width:440px;width:92%;background:#121a3d;border:2px solid #4a5fd0;border-radius:12px;padding:1.2em;max-height:86vh;overflow:auto">' +
            '<h2 style="margin:0 0 .6em;font-size:1.1em">📊 せんせき分析（Pythonで集計）</h2>' +
            '<div id="pystatsBody" style="font-size:.85em;line-height:1.7;white-space:pre-wrap"></div>' +
            '<button id="pystatsClose" type="button" style="margin-top:1em;width:100%;padding:.6em;font-size:1em">とじる</button></div>';
        document.body.appendChild(el);
        el.querySelector("#pystatsClose").addEventListener("click", () => { el.style.display = "none"; });
        el.addEventListener("pointerdown", (e) => { if(e.target === el) el.style.display = "none"; });
        return el;
    }

    async function showPanel(){
        const el = ensurePanel(); el.style.display = "flex";
        const body = el.querySelector("#pystatsBody");
        body.textContent = "Python（Pyodide）で解析中…";
        try{
            const r = await analyze();
            if(!r.n){ body.textContent = "まだ戦闘の記録がありません。バトルをこなすと、ここにPythonで計算した統計が表示されます。"; return; }
            const names = ["1-2", "3-4", "5-6", "7-8", "9+"];
            const bars = r.histogram.map((v, i) => names[i] + "ターン: " + "■".repeat(Math.min(v, 24)) + " " + v).join("\n");
            body.textContent =
                "総戦闘数: " + r.n + "\n" +
                "勝率: " + r.winRate + "%（勝ち " + r.wins + " / 負け " + r.loses + " / 逃げ " + r.runs + "）\n" +
                "最高連勝記録: " + r.bestStreak + "連勝\n" +
                "平均ターン数: " + r.avgRounds + "\n" +
                "平均獲得ゴールド: " + r.avgGold + "G\n" +
                "平均獲得けいけんち: " + r.avgExp + "\n" +
                "平均戦闘時間: " + r.avgSec + "秒\n" +
                (r.bossBattles ? ("ボス戦: " + r.bossBattles + "回（勝率 " + r.bossWinRate + "%）\n") : "") +
                "\nターン数の分布:\n" + bars;
        }catch(e){
            body.textContent = "Pythonの読みこみに失敗しました（オフライン中などは使えません）。\n時間をおいてもう一度お試しください。\n" + (e && e.message ? e.message : e);
        }
    }

    window.QuestStats = {record, showPanel};
})();
