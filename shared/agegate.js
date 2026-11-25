"use strict";
/* 20歳以上ゲート（自己申告）
   ・パチンコ・お酒・たばこの場面を含むゲーム（game13・game14）の入口で使う。
   ・「20歳以上です」を押すと localStorage(are_age20=1) に覚えて、次から出ない。
   ・「20歳未満です」を押すと、ゲーム一覧（？back= があればそこ）へもどす。
   ・ゲームのお金はすべて架空のコイン。現実のお酒・たばこ・賭け事をすすめる内容ではない。
   ・読みこんだだけで動く（HTML の最初の <script> で読みこむ）。AgeGate.ok() で確認済みか分かる。 */
(function(){
    var KEY = "are_age20";
    function ls(){ try{ return window.localStorage; }catch(e){ return null; } }
    function isOk(){ var s = ls(); try{ return !!(s && s.getItem(KEY) === "1"); }catch(e){ return !!window.__ageOkMem; } }
    function lang(){ var s = ls(), l = "ja"; try{ l = (s && s.getItem("are_lang")) || "ja"; }catch(e){} return ["ja", "en", "zh", "ko"].indexOf(l) >= 0 ? l : "ja"; }
    var T = {
        ja: {h: "20歳以上の方だけ あそべます", p: "このゲームには、パチンコ・お酒・たばこの場面が出てきます（ゲームのお金はぜんぶ ニセモノのコインです）。", q: "あなたは 20歳以上ですか？", y: "20歳以上です", n: "20歳未満です", f: "お酒やたばこ、ギャンブルは 20歳になってから。のみすぎ・やりすぎには ちゅうい。"},
        en: {h: "For players aged 20 and over", p: "This game features pachinko, alcohol and tobacco scenes (all in-game money is fake coins).", q: "Are you 20 or older?", y: "I'm 20 or older", n: "I'm under 20", f: "Alcohol, tobacco and gambling are for adults only. Please enjoy responsibly."},
        zh: {h: "仅限20岁以上玩家", p: "本游戏含有弹珠机、饮酒、吸烟的场景（游戏中的钱全部是虚拟币）。", q: "您已满20岁了吗？", y: "我已满20岁", n: "我未满20岁", f: "饮酒、吸烟和赌博仅限成年人。请适度。"},
        ko: {h: "20세 이상만 플레이할 수 있어요", p: "이 게임에는 파칭코·술·담배 장면이 나옵니다 (게임 속 돈은 모두 가짜 코인이에요).", q: "20세 이상이신가요?", y: "20세 이상입니다", n: "20세 미만입니다", f: "술·담배·도박은 성인만. 과하지 않게 즐겨 주세요."}
    };
    function backUrl(){
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)) return b; }catch(e){}
        return "../index.html";
    }
    function show(){
        if(document.getElementById("ageGate")) return;
        var t = T[lang()], d = document.createElement("div"); d.id = "ageGate"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
        d.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:radial-gradient(circle at 50% 30%,#2a1450,#07041a 70%);color:#fff;font-family:system-ui,-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif;text-align:center";
        function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
        d.innerHTML = '<div style="max-width:420px;width:100%;background:#17123f;border:2px solid #ff8ac7;border-radius:22px;padding:26px 20px;box-shadow:0 0 40px rgba(255,138,199,.35)">' +
            '<div style="font-size:54px;font-weight:900;color:#ff8ac7;text-shadow:0 0 18px #ff2e93">20+</div>' +
            '<h1 style="font-size:20px;margin:6px 0 10px">' + esc(t.h) + '</h1>' +
            '<p style="font-size:14px;line-height:1.7;color:#d6dcff;margin:0 0 12px">' + esc(t.p) + '</p>' +
            '<p style="font-size:16px;font-weight:800;margin:0 0 14px">' + esc(t.q) + '</p>' +
            '<div style="display:flex;flex-direction:column;gap:10px">' +
            '<button id="ageYes" type="button" style="padding:13px;font-size:17px;font-weight:900;border:0;border-radius:14px;background:linear-gradient(#ffe36a,#ffb02e);color:#2b1a00;cursor:pointer">' + esc(t.y) + '</button>' +
            '<button id="ageNo" type="button" style="padding:11px;font-size:15px;border:1px solid #6b73f0;border-radius:14px;background:#1d2060;color:#fff;cursor:pointer">' + esc(t.n) + '</button></div>' +
            '<p style="font-size:11.5px;color:#a9b2ee;margin:14px 0 0;line-height:1.6">' + esc(t.f) + '</p></div>';
        document.body.appendChild(d);
        document.getElementById("ageYes").onclick = function(){ var s = ls(); try{ s && s.setItem(KEY, "1"); }catch(e){ window.__ageOkMem = 1; } d.remove(); window.dispatchEvent(new Event("agegate-ok")); };
        document.getElementById("ageNo").onclick = function(){ location.href = backUrl(); };
        try{ document.getElementById("ageYes").focus(); }catch(e){}
    }
    function start(){ if(!isOk()) show(); else window.dispatchEvent(new Event("agegate-ok")); }
    window.AgeGate = {ok: isOk, show: show, KEY: KEY};
    if(document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
