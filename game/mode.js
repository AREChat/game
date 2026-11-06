"use strict";
// ===== 「おわる」ボタン：exe（パソコン用アプリ）と web（サーバーに公開したページ）で動きを分ける =====
// 見分けは ../shared/are-mode.js（window.AREMode）。ここは「おわる」の動きと、ボタンの表示だけ。
//  ・exe（アプリ／Go 版 exe）… セーブして 画面（アプリ）を終了する。終了できないときは ゲーム一覧へ。
//  ・file（直接開いた）………… 画面を閉じる。閉じられなければ ゲーム一覧へ。
//  ・web（https のブラウザ）…… チャット画面にもどる。
(function(){
    var M = window.AREMode || {mode:"web", isApp:false, chatUrl:"https://arechat.github.io/AREDA/login.html", listUrl:"../index.html"};
    if(!window.ARE_MODE) window.ARE_MODE = M.mode === "web" ? "web" : "exe";
    if(!window.areChatUrl) window.areChatUrl = M.chatUrl;

    function bye(){
        // 終了したあとの画面（このタブは とじて だいじょうぶ）
        try{
            document.body.innerHTML = '<div style="position:fixed;inset:0;background:#10141f;color:#fff;font:bold 20px sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px"><div>おつかれさま！ ゲームを おわりました。</div><div style="font-size:15px;font-weight:normal">このタブ（画面）は とじて だいじょうぶです。</div></div>';
        }catch(_e){}
        try{ window.close(); }catch(_e){}
    }
    function toList(){ try{ location.href = M.listUrl; }catch(_e){} }

    window.areQuit = function(){
        try{ if(window.G && G.S && window.tqAutoSave) tqAutoSave(); }catch(_e){}
        try{ if(window.tqBgmStop) tqBgmStop(); if(window.tqSpeakStop) tqSpeakStop(); }catch(_e){}
        try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(_e){}
        if(M.mode === "web"){ try{ location.href = M.chatUrl; }catch(_e){} return; }          // web：チャット画面にもどる
        if(window.areDesktop && window.areDesktop.quit){ try{ window.areDesktop.quit(); return; }catch(_e){} }   // Electron のアプリ
        if(M.mode === "file"){ try{ window.close(); }catch(_e){} setTimeout(toList, 350); return; }          // 直接開いた版
        // Go 版 exe（127.0.0.1）：サーバーを終了する。できなければ ゲーム一覧へ
        var done = false;
        try{
            fetch("/__quit", {cache:"no-store"}).then((r) => { done = true; if(r && r.ok) bye(); else toList(); }).catch(() => { if(!done) toList(); });
        }catch(_e){ toList(); }
        setTimeout(() => { if(!done) toList(); }, 3000);
    };
    window.areQuitText = function(inGame){
        var a = inGame ? "ここまでの 冒険を 自動で 記録して、\n" : "";
        return M.mode === "web" ? a + "ゲームを おわって、チャット画面に もどりますか？" : a + "ゲームを おわりますか？\n（ゲームの 画面が とじます）";
    };

    function label(){
        var b = document.getElementById("btnQuit");
        if(b) b.textContent = M.mode === "web" ? "← チャットへ" : "✖ おわる";
    }
    label();
    document.addEventListener("DOMContentLoaded", label);
})();
