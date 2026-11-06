"use strict";
// ===== 実行モード：exe（パソコン用アプリ）か、web（サーバーに公開したページ）か =====
// ・exe … デスクトップアプリ（desktop/ の Electron）の中で動いているとき。「おわる」＝ アプリ（画面）を終了する。
// ・web … ブラウザで開いたとき（GitHub Pages など）。「おわる」＝ チャット画面にもどる。
// 見分け方：アプリが window.areDesktop を用意する（desktop/preload.js）。動作確認用に URL の ?mode=exe でも exe 扱いにできる。
(function(){
    var desk = false;
    try{ desk = !!(window.areDesktop && window.areDesktop.isDesktop); }catch(_e){}
    try{ if(!desk && /[?&]mode=exe(&|$)/.test(location.search)) desk = true; }catch(_e){}
    window.ARE_MODE = desk ? "exe" : "web";

    // ---- web のとき もどる先（チャット）。?back=… か、チャットから来たページ（referrer）を優先。なければ運用中のチャット。
    var DEFAULT_CHAT = "https://arechat.github.io/ARE/chat.html";
    var OK_BACK = /^https:\/\/arechat\.github\.io\/(ARE|AREDA)\/chat(\.html)?(\?[^#]*)?$/;
    var OK_REF = /^(https:\/\/arechat\.github\.io\/(ARE|AREDA)\/)/;
    var chat = DEFAULT_CHAT;
    try{ var b = new URLSearchParams(location.search).get("back"); if(b && OK_BACK.test(b)) chat = b; else { var m = String(document.referrer || "").match(OK_REF); if(m) chat = m[1] + "chat.html"; } }catch(_e){}
    window.areChatUrl = chat;

    // 「おわる」の本体。先に セーブ・BGM停止・全画面解除 をしてから、モードに合わせて終わる。
    window.areQuit = function(){
        try{ if(window.G && G.S && window.tqAutoSave) tqAutoSave(); }catch(_e){}
        try{ if(window.tqBgmStop) tqBgmStop(); if(window.tqSpeakStop) tqSpeakStop(); }catch(_e){}
        try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(_e){}
        if(window.ARE_MODE === "exe"){
            try{ if(window.areDesktop && window.areDesktop.quit){ window.areDesktop.quit(); return; } }catch(_e){}
            try{ window.close(); }catch(_e){}                                                     // ?mode=exe の確認用など（アプリ以外）
            setTimeout(() => { try{ location.href = window.areChatUrl; }catch(_e){} }, 350);
            return;
        }
        try{ location.href = window.areChatUrl; }catch(_e){}                                      // web：チャット画面にもどる
    };
    window.areQuitText = function(inGame){
        var a = inGame ? "ここまでの 冒険を 自動で 記録して、\n" : "";
        return window.ARE_MODE === "exe" ? a + "ゲームを おわりますか？\n（ゲームの 画面が とじます）" : a + "ゲームを おわって、チャット画面に もどりますか？";
    };

    function label(){
        var b = document.getElementById("btnQuit");
        if(b) b.textContent = window.ARE_MODE === "exe" ? "✖ おわる" : "← チャットへ";
        try{ document.documentElement.setAttribute("data-mode", window.ARE_MODE); }catch(_e){}
    }
    label();
    document.addEventListener("DOMContentLoaded", label);
})();
