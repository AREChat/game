"use strict";
// ===== 出口ボタン（game6・game7 など共通）：web はチャットへもどる／exe は おわる・ほかのゲームへ =====
// 見分けは are-mode.js（AREMode）。game/mode.js の window.areQuit があれば それを使い、なければ ここで終了する。
(function(){
    if(window.AREExit) return;
    function M(){ return window.AREMode || {mode: /^https?:$/.test(location.protocol) && location.hostname !== "127.0.0.1" && location.hostname !== "localhost" ? "web" : "exe", chatUrl: "https://arechat.github.io/ARE/login.html", listUrl: "../index.html"}; }
    function isWeb(){ return M().mode === "web"; }
    function quit(){
        try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(_e){}
        var m = M();
        if(isWeb()){ location.href = m.chatUrl; return; }
        if(window.areDesktop && window.areDesktop.quit){ try{ window.areDesktop.quit(); return; }catch(_e){} }
        var toList = function(){ try{ location.href = m.listUrl; }catch(_e){} }, done = false;
        if(m.mode === "file"){ try{ window.close(); }catch(_e){} setTimeout(toList, 400); return; }
        try{ fetch("/__quit", {cache: "no-store"}).then(function(r){ done = true; if(r && r.ok){ try{ document.body.innerHTML = '<div style="position:fixed;inset:0;background:#10141f;color:#fff;font:bold 20px sans-serif;display:grid;place-items:center;text-align:center;padding:24px">おつかれさま！<br>このタブは とじて だいじょうぶです。</div>'; window.close(); }catch(_e){} } else toList(); }).catch(function(){ if(!done) toList(); }); }catch(_e){ toList(); }
        setTimeout(function(){ if(!done) toList(); }, 3000);
    }
    function label(){ return isWeb() ? "← チャットへ" : "✖ おわる"; }
    var box = null;
    function close(){ if(box){ box.remove(); box = null; } }
    function open(opts){
        opts = opts || {};
        if(box) return;
        box = document.createElement("div");
        box.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font-family:sans-serif";
        var win = document.createElement("div");
        win.style.cssText = "background:#10162e;color:#fff;border:3px solid #ffd86b;border-radius:14px;padding:18px 20px;width:min(86vw,340px);text-align:center";
        function add(t, bg, f){
            var b = document.createElement("button"); b.type = "button"; b.textContent = t;
            b.style.cssText = "display:block;width:100%;margin:8px 0;padding:13px;border-radius:10px;border:0;background:" + bg + ";color:#fff;font-weight:bold;font-size:17px;cursor:pointer";
            b.addEventListener("click", f); win.appendChild(b); return b;
        }
        var h = document.createElement("div"); h.textContent = "どうする？"; h.style.cssText = "font-weight:bold;font-size:19px;color:#ffd86b;margin-bottom:6px"; win.appendChild(h);
        var go = function(f){ return function(){ try{ if(opts.before) opts.before(); }catch(_e){} f(); }; };
        if(isWeb()) add("💬 チャットにもどる", "#2e7d4f", go(quit));
        else add("✖ ゲームをおわる", "#a33", go(quit));
        if(isWeb() && window.AREGameNav){ add("🎮 ほかのゲームへ", "#243064", function(){ close(); window.AREGameNav.open({before: opts.before}); }); }
        else if(!isWeb()){ add("🎮 ほかのゲームへ（一覧）", "#243064", go(function(){ location.href = M().listUrl; })); }
        add("とじる", "#555", close);
        box.appendChild(win);
        box.addEventListener("click", function(e){ if(e.target === box) close(); });
        window.addEventListener("keydown", function esc(e){ if(e.key === "Escape"){ close(); window.removeEventListener("keydown", esc, true); } }, true);
        document.body.appendChild(box);
    }
    window.AREExit = {open: open, close: close, quit: quit, label: label, isWeb: isWeb};
})();
