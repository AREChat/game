"use strict";
// ===== 推理せいせき分析（Python／Pyodideで統計をけいさん）=====
// ・話をクリアするたびに（★・まちがい回数・ヒント回数・運試しの結果）をlocalStorageにためる
// ・タイトル画面のボタンから、Pythonで集計した統計（平均★・ノーミス率・分布など）を表示する
// ・Pyodideが読みこめない（オフライン等）ときは、その旨を表示するだけで、ゲーム本編には影響しない
(function(){
    const LSKEY = "game6_statlog_v1";
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
            s.onerror = () => reject(new Error("pyodide.jsの読みこみに失敗しました"));
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
        "    stars = [r.get('stars', 0) for r in records]",
        "    mists = [r.get('mist', 0) for r in records]",
        "    hints = [r.get('hints', 0) for r in records]",
        "    luckyN = sum(1 for r in records if r.get('lucky'))",
        "    noMiss = sum(1 for r in records if r.get('mist', 0) == 0 and r.get('hints', 0) == 0)",
        "    def avg(a):",
        "        return sum(a) / len(a) if a else 0",
        "    streak = 0",
        "    best = 0",
        "    for r in records:",
        "        if r.get('stars', 0) >= 3:",
        "            streak += 1",
        "            best = max(best, streak)",
        "        else:",
        "            streak = 0",
        "    buckets = [0, 0, 0, 0]",
        "    for s in stars:",
        "        idx = min(max(int(s), 1), 3)",
        "        buckets[idx] += 1",
        "    out = {",
        "        'n': n,",
        "        'avgStars': round(avg(stars), 2),",
        "        'avgMist': round(avg(mists), 2),",
        "        'avgHints': round(avg(hints), 2),",
        "        'noMissRate': round(noMiss / n * 100, 1),",
        "        'luckyRate': round(luckyN / n * 100, 1),",
        "        'bestPerfectStreak': best,",
        "        'starHistogram': buckets[1:],",
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
        el.style.cssText = "position:fixed;inset:0;background:rgba(10,8,20,.88);color:#fff;z-index:9999;display:none;align-items:center;justify-content:center;font-family:inherit;";
        el.innerHTML = '<div style="max-width:440px;width:92%;background:#1c1630;border:2px solid #7c5fd0;border-radius:12px;padding:1.2em;max-height:86vh;overflow:auto">' +
            '<h2 style="margin:0 0 .6em;font-size:1.1em">📊 推理せいせき分析（Pythonで集計）</h2>' +
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
            if(!r.n){ body.textContent = "まだクリアした話がありません。事件を解決すると、ここにPythonで計算した統計が表示されます。"; return; }
            const names = ["★1", "★2", "★3"];
            const bars = r.starHistogram.map((v, i) => names[i] + ": " + "■".repeat(Math.min(v, 24)) + " " + v).join("\n");
            body.textContent =
                "クリアした話の数: " + r.n + "\n" +
                "平均★: " + r.avgStars + "\n" +
                "平均まちがい回数: " + r.avgMist + "\n" +
                "平均ヒント回数: " + r.avgHints + "\n" +
                "ノーミス・ノーヒント率: " + r.noMissRate + "%\n" +
                "運試しの的中率: " + r.luckyRate + "%\n" +
                "★3の連続記録: " + r.bestPerfectStreak + "話連続\n" +
                "\n★の分布:\n" + bars;
        }catch(e){
            body.textContent = "Pythonの読みこみに失敗しました（オフライン中などは使えません）。\n時間をおいてもう一度お試しください。\n" + (e && e.message ? e.message : e);
        }
    }

    window.DeduceStats = {record, showPanel};
})();
