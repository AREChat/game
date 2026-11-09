"use strict";
// ===== 「ほかのゲームへ」（全ゲーム共通）：ARE QUEST・2・3・ARE CARD・推理ゲーム を行き来する =====
// ゲームの一覧は、ここ1か所だけ。ゲームが増えたら、ここに足す（game6・game7 は 2026-11-08 に廃止）。
//  ・web（ブラウザ版）…… 使える。
//  ・exe・file …… アプリに入っているのは ARE QUEST だけなので、出さない（開けずにエラーになるため）。
(function(){
    if(window.AREGameNav) return;
    // path は ゲームの サイト（リポジトリ）の いちばん上から見た 場所。ゲームが 増えたら ここに 足す
    // 2026-11-08 統合：game2＝ARE QUEST 2＋3／game4＝ARE CARD＋星紡ぎの旅人／game5＝推理ゲーム＋ARE BLOCKS
    var GAMES = [
        {id: "game",             icon: "🗡", name: "ARE QUEST"},
        {id: "game2/quest2",     icon: "📖", name: "ARE QUEST 2"},
        {id: "game2/quest3",     icon: "🌙", name: "ARE QUEST 3"},
        {id: "game4/card",       icon: "🃏", name: "ARE CARD"},
        {id: "game4/starweaver", icon: "⭐", name: "星紡ぎの旅人"},
        {id: "game5",            icon: "🔎", name: "推理ゲーム"},
        {id: "game5/blocks",     icon: "🧱", name: "ARE BLOCKS"},
        {id: "game6",            icon: "🕵", name: "推理ゲーム2"}
    ];
    function dirOf(){ try{ return location.pathname.replace(/[^\/]*$/, "").replace(/\/play\/$/, "/").replace(/\/manual\/$/, "/"); }catch(_e){ return ""; } }
    // いまの ゲーム（id）。見つからなければ ""
    function here(){
        var d = dirOf(), best = "";
        GAMES.forEach(function(g){ if(d.length >= g.id.length + 2 && d.slice(-(g.id.length + 2)) === "/" + g.id + "/" && g.id.length > best.length) best = g.id; });
        return best;
    }
    // サイトの いちばん上（ゲームの フォルダの 1つ上まで）
    function root(){ var d = dirOf(), h = here(); return h ? d.slice(0, d.length - h.length - 1) : "/"; }
    function isWeb(){
        try{
            if(window.AREMode) return window.AREMode.mode === "web";
            return /^https?:$/.test(location.protocol) && location.hostname !== "127.0.0.1" && location.hostname !== "localhost";
        }catch(_e){ return false; }
    }
    function others(){ var h = here(); return GAMES.filter(function(g){ return g.id !== h; }); }

    var box = null, onKey = null;
    function close(){
        if(box){ box.remove(); box = null; }
        if(onKey){ window.removeEventListener("keydown", onKey, true); onKey = null; }
    }
    // opts.before … 移動するまえに呼ぶ関数（セーブなど）
    function open(opts){
        opts = opts || {};
        if(box || !isWeb()) return;
        box = document.createElement("div");
        box.id = "areGameNav";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-label", "ほかのゲーム");
        box.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font-family:sans-serif";
        var win = document.createElement("div");
        win.style.cssText = "background:#10162e;color:#fff;border:3px solid #ffd86b;border-radius:14px;padding:18px 20px;width:min(86vw,360px);max-height:86vh;overflow:auto;text-align:center";
        var h = document.createElement("div");
        h.textContent = "🎮 ほかのゲームへ";
        h.style.cssText = "font-weight:bold;font-size:20px;color:#ffd86b;margin-bottom:6px";
        var note = document.createElement("div");
        note.textContent = "いまのゲームは、できるだけ セーブしてから うつってね。";
        note.style.cssText = "font-size:13px;opacity:.85;margin-bottom:12px";
        win.appendChild(h); win.appendChild(note);
        others().forEach(function(g){
            var a = document.createElement("a");
            a.href = root() + g.id + "/index.html";
            a.textContent = g.icon + " " + g.name;
            a.style.cssText = "display:block;margin:8px 0;padding:12px;border-radius:10px;background:#243064;color:#fff;font-weight:bold;font-size:18px;text-decoration:none";
            a.addEventListener("click", function(){ try{ if(opts.before) opts.before(); }catch(_e){} });
            win.appendChild(a);
        });
        var x = document.createElement("button");
        x.type = "button"; x.textContent = "とじる";
        x.style.cssText = "margin-top:10px;padding:10px 26px;border-radius:10px;border:0;background:#555;color:#fff;font-size:16px;cursor:pointer";
        x.addEventListener("click", close);
        win.appendChild(x);
        box.appendChild(win);
        box.addEventListener("click", function(e){ if(e.target === box) close(); });
        document.body.appendChild(box);
        // ゲーム本体のキー操作が 後ろで動かないようにする（Esc で とじる／Tab・Enter はそのまま使える）
        onKey = function(e){ if(e.key === "Escape"){ close(); } e.stopPropagation(); };
        window.addEventListener("keydown", onKey, true);
        var f = win.querySelector("a"); if(f) f.focus();
    }

    // 文字のリンク一覧（ARE QUEST 2 などのタイトルに並べる用）
    function links(style){
        return others().map(function(g){ return '<a href="' + root() + g.id + '/index.html"' + (style ? ' style="' + style + '"' : "") + ">" + g.name + "</a>"; }).join("　");
    }
    window.AREGameNav = {games: GAMES, here: here, others: others, canShow: isWeb, open: open, close: close, links: links};
})();
