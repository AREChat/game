"use strict";
// ===== スマホ・タブレットの「画面の向き」をそろえる（全ゲーム共通）=====
// 使いかた：各ゲームの <head> に
//     <meta name="are-orient" content="landscape">     ← 横画面のゲーム（"portrait" なら 縦画面のゲーム）
//     <script src="…/shared/are-orient.js"></script>
// を 1 行ずつ 足すだけ。パソコン（マウス）・exe では 何もしません。
//
// やること（強いじゅんに 3つ）
//  1) 向きを「ロック」する（screen.orientation.lock）。インストールした アプリ（ホーム画面から開いたもの）や、
//     Android の Chrome の「全画面」では これで 向きが かたまる。
//  2) Android で ロックできないときは、さいしょの タッチで 全画面にして もういちど ロックする（全画面でないと ロックできない決まり）。
//  3) それでも 向きが ちがうとき（iPhone の Safari は ロックの機能が ないので ここ）は、
//     「スマホを ◯向きに してね」の 画面を ゲームの上に かぶせて、向きが あうまで さわれなく する。
// ※ ブラウザの決まりで、iPhone の Safari では 向きを むりやり 回すことは できません（かぶせる画面で 強制します）。
//   動作確認のために、URL に ?orient=off を つけると 何もしません。
(function(){
    if(window.AREOrient) return;
    var meta = document.querySelector('meta[name="are-orient"]');
    var want = meta ? String(meta.getAttribute("content") || "").trim() : "";
    if(want !== "landscape" && want !== "portrait") return;
    try{ if(/[?&]orient=off(&|$)/.test(location.search)) return; }catch(_e){}

    var UA = navigator.userAgent || "";
    var isAndroid = /Android/i.test(UA);
    var isApple = /iPhone|iPad|iPod/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
    // ゆびで さわる 機械（スマホ・タブレット）だけが 対象。パソコン・exe は そのまま
    function isTouchDevice(){
        if(window.areDesktop) return false;
        try{ if(window.AREMode && window.AREMode.mode && window.AREMode.mode !== "web") return false; }catch(_e){}
        return isAndroid || isApple;
    }
    if(!isTouchDevice()) return;

    function isLandscape(){
        try{
            var so = screen.orientation && screen.orientation.type;
            // 画面の下に キーボードが 出ると innerHeight が へるので、まず 端末の向きそのものを 見る
            if(so) return so.indexOf("landscape") === 0;
        }catch(_e){}
        try{ if(typeof window.orientation === "number") return Math.abs(window.orientation) === 90; }catch(_e2){}
        return window.innerWidth > window.innerHeight;
    }
    function isOk(){ return (want === "landscape") === isLandscape(); }

    // ---------- 1) ロック ----------
    function tryLock(){
        try{
            if(screen.orientation && typeof screen.orientation.lock === "function"){
                var p = screen.orientation.lock(want);
                if(p && typeof p.catch === "function") p.catch(function(){});
                return p;
            }
        }catch(_e){}
        return null;
    }
    tryLock();

    // ---------- 2) さいしょの タッチで 全画面 → ロック（Android）----------
    var tried = 0;
    function onGesture(){
        if(isOk()) return;
        if(tried++ > 3) return;
        var de = document.documentElement, rf = de.requestFullscreen || de.webkitRequestFullscreen;
        if(isAndroid && rf && !(document.fullscreenElement || document.webkitFullscreenElement)){
            try{
                var r = rf.call(de, {navigationUI: "hide"});
                if(r && typeof r.then === "function") r.then(function(){ tryLock(); }, function(){ tryLock(); }); else tryLock();
            }catch(_e){ tryLock(); }
        }else tryLock();
    }
    ["pointerup", "touchend", "click"].forEach(function(t){ document.addEventListener(t, onGesture, {capture: true, passive: true}); });

    // ---------- 3) かぶせる画面 ----------
    var box = null;
    function css(){
        if(document.getElementById("areOrientCss")) return;
        var s = document.createElement("style"); s.id = "areOrientCss";
        s.textContent = "#areOrient{position:fixed;inset:0;z-index:2147483600;display:none;align-items:center;justify-content:center;flex-direction:column;gap:18px;padding:24px;box-sizing:border-box;text-align:center;color:#fff;font-family:system-ui,-apple-system,'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;background:radial-gradient(circle at 50% 30%,#1b2a5c,#070b1c);touch-action:none;-webkit-user-select:none;user-select:none}" +
            "#areOrient.on{display:flex}" +
            "#areOrient .ph{width:64px;height:112px;border:5px solid #ffd86b;border-radius:14px;position:relative;animation:areOrientSpin 2.4s ease-in-out infinite;box-shadow:0 0 24px rgba(255,216,107,.45)}" +
            "#areOrient .ph::after{content:'';position:absolute;left:50%;bottom:7px;width:16px;height:4px;margin-left:-8px;border-radius:3px;background:#ffd86b}" +
            "#areOrient.p .ph{animation-name:areOrientSpinP;width:112px;height:64px}" +
            "#areOrient b{font-size:clamp(20px,5.4vw,30px);line-height:1.4}#areOrient span{font-size:clamp(13px,3.4vw,17px);opacity:.85;line-height:1.6}" +
            "@keyframes areOrientSpin{0%,15%{transform:rotate(0)}55%,100%{transform:rotate(-90deg)}}" +
            "@keyframes areOrientSpinP{0%,15%{transform:rotate(0)}55%,100%{transform:rotate(90deg)}}" +
            "body.are-orient-bad{overflow:hidden}";
        (document.head || document.documentElement).appendChild(s);
    }
    function build(){
        if(box || !document.body) return;
        css();
        box = document.createElement("div"); box.id = "areOrient"; if(want === "portrait") box.className = "p";
        box.setAttribute("role", "alertdialog"); box.setAttribute("aria-live", "assertive");
        var land = want === "landscape";
        box.innerHTML = '<div class="ph" aria-hidden="true"></div><b>' + (land ? "スマホを 横向き に してね" : "スマホを 縦向き に してね") + '</b>' +
            '<span>このゲームは ' + (land ? "横画面" : "縦画面") + ' で あそびます。<br>' + (land ? "横に すると、自動で はじまるよ。" : "縦に すると、自動で はじまるよ。") + '<br>（画面の向きの ロックを オフに しておいてね）</span>';
        // ゲームの上に かぶせて、さわれなく する（下のゲームに タッチが 通らない）
        ["touchstart", "touchmove", "pointerdown", "click", "wheel"].forEach(function(t){ box.addEventListener(t, function(e){ e.stopPropagation(); if(e.cancelable) e.preventDefault(); }, {passive: false}); });
        document.body.appendChild(box);
    }
    function apply(){
        if(!document.body) return;
        var ok = isOk();
        if(!ok){
            build();
            if(box){ box.classList.add("on"); }
            document.body.classList.add("are-orient-bad");
        }else{
            if(box) box.classList.remove("on");
            document.body.classList.remove("are-orient-bad");
        }
        try{ window.dispatchEvent(new CustomEvent("are-orient", {detail: {ok: ok, want: want}})); }catch(_e){}
    }
    window.AREOrient = {want: want, ok: isOk, lock: tryLock, apply: apply};

    function start(){
        apply();
        window.addEventListener("resize", apply);
        window.addEventListener("orientationchange", function(){ setTimeout(apply, 80); setTimeout(apply, 400); });
        try{ if(screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener("change", apply); }catch(_e){}
        document.addEventListener("visibilitychange", function(){ if(!document.hidden){ tryLock(); apply(); } });
        // ブラウザによっては 通知が 遅れるので、さいしょの数秒だけ 見はる
        var n = 0, t = setInterval(function(){ apply(); if(++n > 12) clearInterval(t); }, 500);
    }
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
