"use strict";
// ===== 「ほかのゲームへ」（全ゲーム共通）：ジャンルごとに まとめて、行き来できる =====
// ゲームの一覧は、shared/games-registry.json の1か所だけ（node tools/build-registry.js → shared/games-data.js）。
// このファイルは、その一覧を ひらいたときに読みこんで（なければ 下の「予備の一覧」で）出す。ことばは are_lang（ja/en/zh/ko）。
//  ・web（ブラウザ版）…… 使える。
//  ・exe・file …… アプリに入っているのは ARE QUEST だけなので、出さない（開けずにエラーになるため）。
(function(){
    if(window.AREGameNav) return;
    // 予備の一覧（games-data.js が 読めなかったときだけ使う）。path は サイトの いちばん上から見た 場所。
    var GAMES = [
        {id: "game",             icon: "🗡", name: "ARE QUEST"},
        {id: "game2/quest2",     icon: "📖", name: "ARE QUEST 2"},
        {id: "game2/quest3",     icon: "🌙", name: "ARE QUEST 3"},
        {id: "game4/card",       icon: "🃏", name: "ARE CARD"},
        {id: "game4/starweaver", icon: "⭐", name: "星紡ぎの旅人"},
        {id: "game6",            icon: "🔎", name: "推理ゲーム"},
        {id: "game5/blocks",     icon: "🧱", name: "ARE BLOCKS"},
        {id: "game7",            icon: "🎰", name: "OFFLINE PARADISE"},
        {id: "game8",            icon: "🏁", name: "GAME8（アクション＆レース）"},
        {id: "game9",            icon: "🍽️", name: "AREshoot（シューティング＆バトロワ）"},
        {id: "game10",           icon: "⏪", name: "ループ・ラボ（パズル）"},
        {id: "game11",           icon: "🧪", name: "ARE 前代未聞ラボ"},
        {id: "game12",           icon: "⚔️", name: "AREUSO"}
    ];
    function dirOf(){ try{ return location.pathname.replace(/[^\/]*$/, "").replace(/\/play\/$/, "/").replace(/\/manual\/$/, "/"); }catch(_e){ return ""; } }
    // いまの ゲーム（id）。見つからなければ ""
    function here(){
        var d = dirOf(), best = "";
        GAMES.forEach(function(g){ if(d.length >= g.id.length + 2 && d.slice(-(g.id.length + 2)) === "/" + g.id + "/" && g.id.length > best.length) best = g.id; });
        return best;
    }
    // サイトの いちばん上（ゲームの フォルダの 1つ上まで）
    function root(){
        var d = dirOf(), best = "";
        // 登録されているフォルダ名のうち いちばん長く合うもの → その手前までが サイトの上
        var folders = GAMES.map(function(g){ return g.id; });
        try{ if(window.AREGames) window.AREGames.games.forEach(function(g){ if(!g.ext && g.folder) folders.push(g.folder); }); }catch(_e){}
        folders.forEach(function(f){ if(d.length >= f.length + 2 && d.slice(-(f.length + 2)) === "/" + f + "/" && f.length > best.length) best = f; });
        if(!best){ // 入れ子（game2/quest2/ など）のなかも 見る
            folders.forEach(function(f){ var i = d.lastIndexOf("/" + f + "/"); if(i >= 0 && f.length > best.length) best = f; });
            if(best){ var j = d.lastIndexOf("/" + best + "/"); return d.slice(0, j + 1); }
        }
        return best ? d.slice(0, d.length - best.length - 1) : "/";
    }
    function isWeb(){
        try{
            if(window.AREMode) return window.AREMode.mode === "web";
            return /^https?:$/.test(location.protocol) && location.hostname !== "127.0.0.1" && location.hostname !== "localhost";
        }catch(_e){ return false; }
    }
    function others(){ var h = here(); return GAMES.filter(function(g){ return g.id !== h; }); }

    // ---- 一覧（games-data.js）を 読みこむ ----
    var loading = null;
    function loadScript(src){
        return new Promise(function(resolve, reject){
            var s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = function(){ reject(new Error("load " + src)); };
            document.head.appendChild(s);
        });
    }
    function ensureRegistry(){
        if(window.AREGames) return Promise.resolve(true);
        if(!loading){
            var base = root() + "shared/";
            loading = loadScript(base + "games-data.js").then(function(){ return loadScript(base + "games-registry.js"); }).then(function(){ return !!window.AREGames; }).catch(function(){ loading = null; return false; });
        }
        return loading;
    }

    var box = null, onKey = null;
    function close(){
        if(box){ box.remove(); box = null; }
        if(onKey){ window.removeEventListener("keydown", onKey, true); onKey = null; }
    }
    var FALLBACK_TXT = {
        ja: {head: "🎮 ほかのゲームへ", note: "いまのゲームは、できるだけ セーブしてから うつってね。", close: "とじる", all: "🏠 ゲーム一覧"},
        en: {head: "🎮 Other games", note: "Please save the current game before you move on.", close: "Close", all: "🏠 All games"},
        zh: {head: "🎮 去玩别的游戏", note: "切换前请尽量先保存当前游戏。", close: "关闭", all: "🏠 游戏列表"},
        ko: {head: "🎮 다른 게임으로", note: "옮기기 전에 지금 게임을 저장해 주세요.", close: "닫기", all: "🏠 게임 목록"}
    };
    function curLang(){ try{ var l = localStorage.getItem("are_lang"); return /^(ja|en|zh|ko)$/.test(l) ? l : "ja"; }catch(_e){ return "ja"; } }
    function linkCss(){ return "display:block;margin:6px 0;padding:11px 12px;border-radius:10px;background:#243064;color:#fff;font-weight:bold;font-size:17px;text-decoration:none;text-align:left"; }

    // 画面を つくる（registry があれば ジャンル別、なければ 予備の一覧）
    function build(opts, reg){
        var l = curLang(), tx = FALLBACK_TXT[l], items = [];
        var win = document.createElement("div");
        win.style.cssText = "background:#10162e;color:#fff;border:3px solid #ffd86b;border-radius:14px;padding:18px 20px;width:min(90vw,400px);max-height:86vh;overflow:auto;text-align:center";
        var h = document.createElement("div");
        h.textContent = tx.head;
        h.style.cssText = "font-weight:bold;font-size:20px;color:#ffd86b;margin-bottom:6px";
        var note = document.createElement("div");
        note.textContent = tx.note;
        note.style.cssText = "font-size:13px;opacity:.85;margin-bottom:12px";
        win.appendChild(h); win.appendChild(note);
        function addLink(href, text, ext){
            var a = document.createElement("a");
            a.href = href; a.textContent = text; a.style.cssText = linkCss();
            if(ext) a.rel = "noopener";
            a.addEventListener("click", function(){ try{ if(opts.before) opts.before(); }catch(_e){} });
            win.appendChild(a); items.push(a);
        }
        if(reg){
            var cur = reg.currentGameId();
            var curG = reg.byId(cur);
            // ゲームの 一覧（まとまり）。ARE QUEST 2・3 のように 入口ページに 2本ぶん入っているものは、いまのゲームでも 出す
            reg.genres.forEach(function(gn){
                var list = reg.ofGenre(gn.id).filter(function(g){ return !(curG && g.id === curG.id && !g.multi); });
                if(!list.length) return;
                var gh = document.createElement("div");
                gh.textContent = gn.emoji + " " + reg.t(gn.name, l);
                gh.style.cssText = "margin:14px 0 2px;font-size:13px;font-weight:bold;color:#9fb4ff;text-align:left";
                win.appendChild(gh);
                list.forEach(function(g){ addLink(g.ext ? g.href : root() + g.href, g.emoji + " " + reg.t(g.name, l) + (g.adult ? "（20+）" : ""), g.ext); });
            });
            var all = document.createElement("a");
            all.href = root() + "index.html"; all.textContent = tx.all; all.style.cssText = linkCss() + ";background:#1b3a6b;margin-top:14px;text-align:center";
            all.addEventListener("click", function(){ try{ if(opts.before) opts.before(); }catch(_e){} });
            win.appendChild(all); items.push(all);
        }else{
            others().forEach(function(g){ addLink(root() + g.id + "/index.html", g.icon + " " + g.name, false); });
        }
        var x = document.createElement("button");
        x.type = "button"; x.textContent = tx.close;
        x.style.cssText = "margin-top:12px;padding:10px 26px;border-radius:10px;border:0;background:#555;color:#fff;font-size:16px;cursor:pointer";
        x.addEventListener("click", close);
        win.appendChild(x);
        return win;
    }
    // opts.before … 移動するまえに呼ぶ関数（セーブなど）
    function open(opts){
        opts = opts || {};
        if(box || !isWeb()) return;
        box = document.createElement("div");
        box.id = "areGameNav";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-label", FALLBACK_TXT[curLang()].head.replace(/^🎮 /, ""));
        box.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font-family:sans-serif";
        var mine = box;
        function show(reg){
            if(box !== mine) return; // 読みこみ中に とじられた
            var win = build(opts, reg);
            while(mine.firstChild) mine.removeChild(mine.firstChild);
            mine.appendChild(win);
            var f = win.querySelector("a"); if(f) f.focus();
        }
        show(window.AREGames || null); // いったん すぐ出す（予備の一覧 か、読みこみずみの一覧）
        if(!window.AREGames) ensureRegistry().then(function(ok){ if(ok) show(window.AREGames); });
        box.addEventListener("click", function(e){ if(e.target === box) close(); });
        document.body.appendChild(box);
        // ゲーム本体のキー操作が 後ろで動かないようにする（Esc で とじる／Tab・Enter はそのまま使える）
        onKey = function(e){ if(e.key === "Escape"){ close(); } e.stopPropagation(); };
        window.addEventListener("keydown", onKey, true);
    }

    // 文字のリンク一覧（ARE QUEST 2 などのタイトルに並べる用）
    function links(style){
        return others().map(function(g){ return '<a href="' + root() + g.id + '/index.html"' + (style ? ' style="' + style + '"' : "") + ">" + g.name + "</a>"; }).join("　");
    }
    window.AREGameNav = {games: GAMES, here: here, others: others, canShow: isWeb, open: open, close: close, links: links, root: root};
})();
