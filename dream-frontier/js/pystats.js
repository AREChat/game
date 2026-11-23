"use strict";
// ===== らいえん分析（Python／Pyodideで統計をけいさん）=====
// ・スタンプを ゲットするたびに（どのアトラクション・エリア・もらったコイン）をlocalStorageにためる
// ・メニューの「📊 らいえん分析」から、Pythonで集計した統計（エリアべつの人気・コインのペースなど）を表示する
// ・Pyodideが読みこめない（オフライン等）ときは、その旨を表示するだけで、ゲーム本編には影響しない
(function(){
    const LSKEY = "dreamfrontier_statlog_v1";
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
        "    coins = [r.get('coin', 0) for r in records]",
        "    areas = {}",
        "    for r in records:",
        "        a = r.get('area') or '？'",
        "        areas[a] = areas.get(a, 0) + 1",
        "    top_area = max(areas.items(), key=lambda kv: kv[1]) if areas else ('？', 0)",
        "    ts = [r.get('t', 0) for r in records]",
        "    ts_sorted = sorted(ts)",
        "    gaps = [(ts_sorted[i+1]-ts_sorted[i]) for i in range(len(ts_sorted)-1)]",
        "    avg_gap_sec = (sum(gaps)/len(gaps)/1000.0) if gaps else 0",
        "    out = {",
        "        'n': n,",
        "        'totalCoins': sum(coins),",
        "        'avgCoin': round(sum(coins)/n, 1),",
        "        'areas': areas,",
        "        'topArea': top_area[0],",
        "        'topAreaCount': top_area[1],",
        "        'avgGapSec': round(avg_gap_sec, 1),",
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

    const AREA_JA = {sky: "そら", lagoon: "みずうみ", grove: "もり", manor: "やしき", center: "ちゅうおう"};
    function areaName(k){ return AREA_JA[k] || k; }

    function ensurePanel(){
        let el = document.getElementById("pystatsPanel");
        if(el) return el;
        el = document.createElement("div");
        el.id = "pystatsPanel";
        el.style.cssText = "position:fixed;inset:0;background:rgba(10,14,30,.88);color:#fff;z-index:99999;display:none;align-items:center;justify-content:center;font-family:inherit;";
        el.innerHTML = '<div style="max-width:440px;width:92%;background:#15213a;border:2px solid #4fb8e8;border-radius:12px;padding:1.2em;max-height:86vh;overflow:auto">' +
            '<h2 style="margin:0 0 .6em;font-size:1.1em">📊 らいえん分析（Pythonで集計）</h2>' +
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
            if(!r.n){ body.textContent = "まだスタンプがありません。アトラクションに のると、ここにPythonで計算した統計が表示されます。"; return; }
            const areaLines = Object.keys(r.areas).sort((a, b) => r.areas[b] - r.areas[a])
                .map((k) => areaName(k) + ": " + "■".repeat(Math.min(r.areas[k], 24)) + " " + r.areas[k]).join("\n");
            body.textContent =
                "ゲットしたスタンプ数: " + r.n + "\n" +
                "ごうけいコイン: " + r.totalCoins + "G\n" +
                "1こあたりの平均コイン: " + r.avgCoin + "G\n" +
                "いちばん人気のエリア: " + areaName(r.topArea) + "（" + r.topAreaCount + "こ）\n" +
                "スタンプの間かく（平均）: " + r.avgGapSec + "秒\n" +
                "\nエリアべつスタンプ数:\n" + areaLines;
        }catch(e){
            body.textContent = "Pythonの読みこみに失敗しました（オフライン中などは使えません）。\n時間をおいてもう一度お試しください。\n" + (e && e.message ? e.message : e);
        }
    }

    window.DfStats = {record, showPanel};
})();
