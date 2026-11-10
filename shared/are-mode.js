"use strict";
// ===== 実行のしかたを見分ける（全ゲーム共通）：exe／ファイルを直接開いた版／ブラウザ版（Web） =====
// 見分けは、ここ1か所だけ。ゲームごとに ばらばらに書かない。
//  ・exe（アプリ）…… window.areDesktop がある（Electron）／ アドレスが 127.0.0.1・localhost（Go 版 exe）／ ?mode=exe
//  ・file …… file:// で直接開いた
//  ・web …… それ以外（https のブラウザ版）
// exe・file では、外のアドレス（チャットなど）へ 飛ばさない（オフラインで開けず、エラーになるため）。
(function(){
    if(window.AREMode) return;
    var q = ""; try{ q = location.search; }catch(_e){}
    var host = ""; try{ host = location.hostname; }catch(_e){}
    var kind = "web";
    try{
        if(window.areDesktop && window.areDesktop.isDesktop) kind = "exe";
        else if(/[?&]mode=exe(&|$)/.test(q) || host === "127.0.0.1" || host === "localhost") kind = "exe";
        else if(location.protocol === "file:") kind = "file";
    }catch(_e){}

    var LOGIN = "https://arechat.github.io/ARE/login.html";            // ブラウザ版の もどる先（ログイン済みなら、そのままチャットへ入る）
    var OK_BACK = /^https:\/\/arechat\.github\.io\/(ARE|AREDA)\/(chat|login)(\.html)?(\?[^#]*)?$/;
    var OK_REF = /^(https:\/\/arechat\.github\.io\/(ARE|AREDA)\/)/;
    var chat = LOGIN;
    try{ var b = new URLSearchParams(q).get("back"); if(b && OK_BACK.test(b)) chat = b; else { var m = String(document.referrer || "").match(OK_REF); if(m) chat = m[1] + "chat.html"; } }catch(_e){}

    var list = "../index.html";                                           // ゲーム一覧（exe の中の index.html）
    try{ list = new URL("../index.html", location.href).href; }catch(_e){}

    var A = { mode: kind, isApp: kind !== "web", chatUrl: chat, listUrl: list, helpBase: "https://arechat.github.io/ARE/" };
    window.AREMode = A;
    window.ARE_MODE = kind === "web" ? "web" : "exe";                     // 古い呼び方（game/mode.js が使う）
    window.areChatUrl = chat;

    // ゲームの中の「もどる」リンク（もとは ../login.html など）を、実行のしかたに合わせて直す
    function fix(){
        try{ document.documentElement.setAttribute("data-mode", A.mode); }catch(_e){}
        var as = document.querySelectorAll('a[href="../login.html"],a[href="../chat.html"],a[href="../guide.html"],a[href="../faq.html"]');
        for(var i = 0; i < as.length; i++){
            var a = as[i], h = a.getAttribute("href");
            if(A.mode === "web"){
                if(h === "../login.html" || h === "../chat.html") a.setAttribute("href", A.chatUrl);
                else a.setAttribute("href", A.helpBase + h.replace("../", ""));
            }else if(h === "../login.html"){
                a.setAttribute("href", A.listUrl);
                if(/ログイン画面/.test(a.textContent)) a.textContent = "⬅ ゲーム一覧へもどる";
            }else{
                a.style.display = "none";                                  // チャット・ガイド・FAQ は アプリの中に無いので かくす
            }
        }
    }
    // exe・file では、公開サイト（チャット・学習アプリなど）へのリンクは オフラインで開けないので かくす
    function hideExternal(){
        if(A.mode === "web") return;
        var as = document.querySelectorAll('a[href^="https://arechat.github.io/"]');
        for(var i = 0; i < as.length; i++) as[i].style.display = "none";
    }
    var _fix = fix; fix = function(){ _fix(); hideExternal(); };
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fix); else fix();
})();
