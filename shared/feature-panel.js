"use strict";
// ============================================================================
// AREFeaturePanel — 「せいせき分析」(Java/TeaVM) と「実績」(C#/Blazor WASM) の
// 共通パネル。game / game7 / game8 / game9 の 4つの ゲームから 同じ部品を つかう。
//
//   ・分析タブ：各ゲームが 記録した 数値の れきし（タイムや スコア）を、
//     Java で書いて TeaVM で JS に 変換した stats-analyzer.js に わたして、
//     ベスト・平均・調子（よくなっている／わるくなっている）を 計算する。
//   ・実績タブ：各ゲームの セーブデータから 作った 「じょうけん」の 一覧を、
//     C# で書いて Blazor WebAssembly で うごかす AchievementsEngine に わたして、
//     どれが 達成ずみかを 判定する（新しく 達成した ものは 通知する）。
//
// 両方とも 本体は 別言語で 書かれた コードで、ここは その呼び出しと 画面表示だけ。
// 重い C# の ランタイム（約14MB）は、パネルを 開くまで 読みこまない（遅延ロード）。
// ============================================================================
(function(){
  var JAVA_SRC = "../shared/java-stats/dist/stats-analyzer.js";
  var CSHARP_FRAME_SRC = "../shared/csharp-achievements/dist/index.html";

  var javaReady = null;   // Promise<void>
  var csharpReady = null; // Promise<Window> (the achievements iframe's contentWindow)
  var csharpCallId = 0;
  var csharpPending = {};

  function loadScriptOnce(src){
    return new Promise(function(resolve, reject){
      var exist = document.querySelector('script[data-arefp-src="' + src + '"]');
      if(exist){ if(exist._loaded){ resolve(); } else { exist.addEventListener("load", resolve); exist.addEventListener("error", reject); } return; }
      var s = document.createElement("script");
      s.src = src; s.dataset.arefpSrc = src; s.async = false;
      s.onload = function(){ s._loaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureJava(){
    if(!javaReady){
      javaReady = loadScriptOnce(JAVA_SRC).then(function(){
        if(typeof window.analyze !== "function") throw new Error("stats-analyzer.js: analyze() が見つからない");
      });
    }
    return javaReady;
  }

  // C#/Blazor の実行環境は、各ゲームの index.html と同じ場所に置くと
  // 「このページの URL から見た相対パス」で .wasm 等を取りに行ってしまい、
  // shared/ 以下に置いた共通ランタイムの場所と合わなくなる。そこで、
  // shared/csharp-achievements/dist/index.html を 隠しiframeとして読みこみ、
  // そのiframeの中で（＝正しい場所で）Blazorを起動して、postMessageで
  // AchievementsEngine.Evaluate(...) を呼び出す。
  function ensureCSharp(){
    if(!csharpReady){
      csharpReady = new Promise(function(resolve, reject){
        var frame = document.createElement("iframe");
        frame.style.display = "none";
        frame.setAttribute("aria-hidden", "true");
        frame.src = CSHARP_FRAME_SRC;
        var timer = setTimeout(function(){ reject(new Error("C# (Blazor) の読みこみが タイムアウトしました")); }, 30000);
        window.addEventListener("message", function onMsg(ev){
          var msg = ev.data;
          if(!msg || !msg.arefp) return;
          if(msg.type === "ready" && ev.source === frame.contentWindow){
            clearTimeout(timer);
            resolve(frame.contentWindow);
          } else if(msg.type === "result"){
            var p = csharpPending[msg.id];
            if(p){ delete csharpPending[msg.id]; if(msg.error) p.reject(new Error(msg.error)); else p.resolve(msg.result); }
          }
        });
        document.body.appendChild(frame);
      });
    }
    return csharpReady;
  }

  function callCSharp(method, a, b, c){
    return ensureCSharp().then(function(frameWindow){
      return new Promise(function(resolve, reject){
        var id = ++csharpCallId;
        csharpPending[id] = {resolve: resolve, reject: reject};
        frameWindow.postMessage({arefp: true, type: "call", id: id, method: method, a: a, b: b, c: c}, "*");
      });
    });
  }

  // ---- 走行・プレイの れきし（Java分析用） -----------------------------------
  function histKey(gameId){ return "arefp_hist_" + gameId; }
  function loadHist(gameId){
    try{ var a = JSON.parse(localStorage.getItem(histKey(gameId)) || "[]"); return Array.isArray(a) ? a : []; }catch(_e){ return []; }
  }
  function recordRun(gameId, value){
    if(typeof value !== "number" || !isFinite(value)) return;
    var h = loadHist(gameId);
    h.push([Math.round(value * 1000) / 1000, Date.now()]);
    if(h.length > 200) h = h.slice(h.length - 200);
    try{ localStorage.setItem(histKey(gameId), JSON.stringify(h)); }catch(_e){}
  }
  function histToWire(h){ return h.map(function(r){ return r[0] + ":" + r[1]; }).join(";"); }

  // ---- 達成ずみバッジの保存（「新規達成」トーストの判定用） --------------------
  function unlockedKey(gameId){ return "arefp_unlocked_" + gameId; }
  function loadUnlocked(gameId){
    try{ var a = JSON.parse(localStorage.getItem(unlockedKey(gameId)) || "[]"); return Array.isArray(a) ? a : []; }catch(_e){ return []; }
  }
  function saveUnlocked(gameId, ids){ try{ localStorage.setItem(unlockedKey(gameId), JSON.stringify(ids)); }catch(_e){} }

  // ---- UI ------------------------------------------------------------------
  var CSS = "\
#arefp-btn{position:fixed;right:10px;bottom:10px;z-index:9000;width:44px;height:44px;border-radius:50%;border:none;\
  background:#2b2f3a;color:#fff;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer;opacity:.85}\
#arefp-btn:active{opacity:1}\
#arefp-wrap{position:fixed;inset:0;z-index:9001;display:none;background:rgba(0,0,0,.6);align-items:center;justify-content:center;padding:14px;box-sizing:border-box;font-family:system-ui,sans-serif}\
#arefp-wrap.on{display:flex}\
#arefp-card{background:#1d2026;color:#eee;max-width:420px;width:100%;max-height:88vh;overflow:auto;border-radius:12px;padding:14px 16px 18px}\
#arefp-card h2{margin:2px 0 10px;font-size:17px}\
.arefp-tabs{display:flex;gap:6px;margin-bottom:10px}\
.arefp-tab{flex:1;background:#30343e;color:#bbb;border:none;border-radius:8px;padding:8px 4px;font-size:13px;cursor:pointer}\
.arefp-tab.on{background:#4a6cf7;color:#fff}\
.arefp-sec{display:none}\
.arefp-sec.on{display:block}\
.arefp-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px solid #2d313b}\
.arefp-trend-improving{color:#5fd97a}.arefp-trend-declining{color:#f08a6c}.arefp-trend-flat{color:#aaa}\
.arefp-badge{display:flex;gap:8px;align-items:center;padding:7px 2px;border-bottom:1px solid #2d313b;font-size:13px}\
.arefp-badge .ic{font-size:20px;width:26px;text-align:center}\
.arefp-badge.locked{opacity:.4}\
.arefp-badge .bar{height:4px;background:#30343e;border-radius:2px;margin-top:3px}\
.arefp-badge .bar i{display:block;height:100%;background:#4a6cf7;border-radius:2px}\
.arefp-close{margin-top:12px;width:100%;padding:9px;border:none;border-radius:8px;background:#30343e;color:#eee;font-size:14px}\
.arefp-note{font-size:11px;color:#888;margin-top:8px;line-height:1.5}\
";

  function ensureStyle(){
    if(document.getElementById("arefp-style")) return;
    var st = document.createElement("style"); st.id = "arefp-style"; st.textContent = CSS; document.head.appendChild(st);
  }

  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }

  function buildUI(cfg){
    ensureStyle();
    var btn = el("button", "", "📊"); btn.id = "arefp-btn"; btn.type = "button"; btn.title = cfg.title;
    document.body.appendChild(btn);

    var wrap = el("div"); wrap.id = "arefp-wrap";
    var card = el("div"); card.id = "arefp-card";
    card.appendChild(el("h2", "", cfg.title));
    var tabs = el("div", "arefp-tabs");
    var tabStats = el("button", "arefp-tab on", "📈 分析 (Java)"); tabStats.type = "button";
    var tabAch = el("button", "arefp-tab", "🏅 実績 (C#)"); tabAch.type = "button";
    tabs.appendChild(tabStats); tabs.appendChild(tabAch); card.appendChild(tabs);

    var secStats = el("div", "arefp-sec on"); secStats.id = "arefp-sec-stats"; secStats.innerHTML = "<p>計算中…</p>";
    var secAch = el("div", "arefp-sec"); secAch.id = "arefp-sec-ach"; secAch.innerHTML = "<p>計算中…</p>";
    card.appendChild(secStats); card.appendChild(secAch);
    card.appendChild(el("p", "arefp-note", "📈分析は Java(TeaVM)、🏅実績は C#(.NET Blazor WebAssembly) を このブラウザの中で そのまま動かして 計算しています。"));

    var closeBtn = el("button", "arefp-close", "とじる"); closeBtn.type = "button";
    card.appendChild(closeBtn);
    wrap.appendChild(card); document.body.appendChild(wrap);

    function selectTab(which){
      tabStats.classList.toggle("on", which === "stats"); tabAch.classList.toggle("on", which === "ach");
      secStats.classList.toggle("on", which === "stats"); secAch.classList.toggle("on", which === "ach");
    }
    tabStats.onclick = function(){ selectTab("stats"); };
    tabAch.onclick = function(){ selectTab("ach"); };
    closeBtn.onclick = function(){ wrap.classList.remove("on"); };
    wrap.addEventListener("click", function(e){ if(e.target === wrap) wrap.classList.remove("on"); });

    btn.onclick = function(){
      wrap.classList.add("on");
      renderStats(cfg, secStats);
      renderAchievements(cfg, secAch);
    };
  }

  function trendLabel(t){
    return t === "improving" ? "⬆ 調子が 上がっています" : t === "declining" ? "⬇ 調子が 下がっています" : "→ 安定しています";
  }

  function renderStats(cfg, host){
    host.innerHTML = "<p>Java(TeaVM) を 読みこみ中…</p>";
    ensureJava().then(function(){
      var hist = loadHist(cfg.gameId);
      if(hist.length === 0){
        host.innerHTML = "<p>まだ 記録が ありません。あそぶと ここに たまっていきます。</p>";
        return;
      }
      var report = JSON.parse(window.analyze(histToWire(hist), !!cfg.lowerIsBetter));
      var unit = cfg.unit || "";
      var rows = [
        ["記録数", report.count + " 回"],
        ["ベスト", report.best + unit],
        ["平均", report.average + unit],
        ["中央値", report.median + unit],
        ["直近5回の平均", report.recentAverage + unit],
        ["ばらつき(標準偏差)", report.stdev + unit],
        ["連続で更新中", report.streak + " 回"]
      ];
      var html = rows.map(function(r){
        return '<div class="arefp-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
      }).join("");
      html += '<p class="arefp-trend-' + report.trend + '" style="margin-top:8px;font-weight:bold">' + trendLabel(report.trend) + '</p>';
      host.innerHTML = html;
    }).catch(function(err){
      host.innerHTML = "<p>読みこみに 失敗しました：" + (err && err.message || err) + "</p>";
    });
  }

  function renderAchievements(cfg, host){
    host.innerHTML = "<p>C#(.NET WASM) を 読みこみ中…（はじめての時だけ 少し 時間が かかります）</p>";
    (function(){
      var stats = typeof cfg.getLiveStats === "function" ? (cfg.getLiveStats() || {}) : {};
      var prevUnlocked = loadUnlocked(cfg.gameId);
      return callCSharp("Evaluate", JSON.stringify(cfg.rules || []), JSON.stringify(stats), JSON.stringify(prevUnlocked))
        .then(function(resJson){
        var list = JSON.parse(resJson);
        if(list && list.error) throw new Error(list.error);
        var newlyUnlocked = prevUnlocked.slice();
        var html = list.map(function(b){
          var pct = Math.round((b.progress || 0) * 100);
          return '<div class="arefp-badge' + (b.unlocked ? "" : " locked") + '">' +
            '<span class="ic">' + b.icon + '</span>' +
            '<span style="flex:1"><b>' + b.title + '</b>' + (b.justUnlocked ? " 🆕" : "") + '<br><small>' + b.desc + '</small>' +
            (b.unlocked ? "" : '<div class="bar"><i style="width:' + pct + '%"></i></div>') +
            '</span></div>';
        }).join("");
        list.forEach(function(b){ if(b.unlocked && newlyUnlocked.indexOf(b.id) < 0) newlyUnlocked.push(b.id); });
        saveUnlocked(cfg.gameId, newlyUnlocked);
        var unlockedCount = list.filter(function(b){ return b.unlocked; }).length;
        host.innerHTML = '<p style="margin:0 0 8px;font-size:12px;color:#aaa">' + unlockedCount + ' / ' + list.length + ' 達成</p>' + (html || "<p>まだ 実績が ありません。</p>");
      });
    })().catch(function(err){
      host.innerHTML = "<p>読みこみに 失敗しました：" + (err && err.message || err) + "</p>";
    });
  }

  window.AREFeaturePanel = {
    init: function(cfg){ buildUI(cfg); },
    recordRun: recordRun
  };
})();
