/* GKI ─ ARE ゲーム共通の「そうさ」ぶひん（クラシックscript／4か国語）
   キーボード・プロコン（ゲームパッド）・タッチの 3つを 1つに まとめる。基準は ニンテンドー配置（右のボタン＝A＝決定／下＝B＝もどる）。
   ・ゲームは「じょうたい（メニュー／キー／ポインタ）」を GKI.mode() で 知らせるだけ。ぎゃくに ゲームは pad を直接 読まなくて よい
       GKI.mode("menu")            … メニュー：十字キー／スティックで ボタンを えらび、A で おす、B で もどる（are-pad.js が 担当）
       GKI.mode("keys")            … アクション：GKI.on(function(act, down){}) / GKI.held("left")
       GKI.mode("pointer", el)     … ポインタ：スティック／十字で カーソルを うごかし、A で タップ（el に PointerEvent を おくる）。画面の ボタンも A で おせる
   ・アクション名：up down left right a b x y l r zl zr plus minus（キーボードは 設定で 自由に わりあて）
   ・設定画面：GKI.openSettings()（data-gki-settings を つけた ボタンを おしても ひらく）。キー割り当て／ボタン配置／カーソル速度／スティックのあそび／しんどう／画面ボタンの 大きさ
   ・もじ入力：GKI.textpad(input) … パッドだけで 文字を 打てる もじ盤（ひらがな・カタカナ・ABC・ハングル・数字）。input に data-pad-text を つけると パッドで A を おしたとき 自動で ひらく
   ※ shared/are-padmap.js → shared/are-pad.js → このファイル の じゅんに 読みこむ（are-padmap は いちばん さいしょ）。 */
(function(){
    "use strict";
    if(window.GKI) return;
    var ACTS = ["up", "down", "left", "right", "a", "b", "x", "y", "l", "r", "zl", "zr", "plus", "minus"];
    var PADIDX = {up: 12, down: 13, left: 14, right: 15, a: 1, b: 0, x: 3, y: 2, l: 4, r: 5, zl: 6, zr: 7, minus: 8, plus: 9};
    var DEFKEYS = {up: ["ArrowUp", "w"], down: ["ArrowDown", "s"], left: ["ArrowLeft", "a"], right: ["ArrowRight", "d"], a: ["Enter", " "], b: ["Backspace", "z"],
        x: ["x", "h"], y: ["r", "y"], l: ["q"], r: ["e"], zl: ["["], zr: ["]"], plus: ["Escape", "p"], minus: ["m"]};
    var KEYKEY = "are_gki_v1";
    var T = {
        title: {ja: "🎮 操作設定", en: "🎮 Controls", zh: "🎮 操作设置", ko: "🎮 조작 설정"},
        legend: {ja: "このゲームの そうさ", en: "Controls in this game", zh: "本游戏的操作", ko: "이 게임의 조작"},
        padSec: {ja: "プロコン・ゲームパッド", en: "Pro Controller / gamepad", zh: "手柄（Pro 手柄等）", ko: "게임패드 (프로 컨트롤러 등)"},
        padNote: {ja: "ニンテンドー配置が 標準です：右のボタン＝A（決定）、下のボタン＝B（もどる）。", en: "Nintendo layout is the default: right button = A (confirm), bottom = B (back).", zh: "默认为任天堂布局：右键＝A（确定），下键＝B（返回）。", ko: "닌텐도 배치가 기본: 오른쪽 버튼＝A(결정), 아래 버튼＝B(뒤로)."},
        layNin: {ja: "ニンテンドー配置（標準）", en: "Nintendo layout (default)", zh: "任天堂布局（默认）", ko: "닌텐도 배치 (기본)"},
        layXbox: {ja: "Xbox・Steam配置", en: "Xbox / Steam layout", zh: "Xbox / Steam 布局", ko: "Xbox / Steam 배치"},
        padOpen: {ja: "ボタンを 1つずつ かえる…", en: "Remap each button…", zh: "逐个修改按键…", ko: "버튼을 하나씩 바꾸기…"},
        noPad: {ja: "パッドは まだ つながっていません（ボタンを どれか おすと つかえます）", en: "No gamepad yet (press any button to connect)", zh: "尚未连接手柄（按任意键即可使用）", ko: "게임패드 미연결 (아무 버튼이나 누르세요)"},
        padOn: {ja: "つながっている パッド：", en: "Connected pad: ", zh: "已连接手柄：", ko: "연결된 패드: "},
        kbSec: {ja: "キーボード（キーを じゆうに わりあて）", en: "Keyboard (assign any key)", zh: "键盘（自由分配按键）", ko: "키보드 (키 자유 지정)"},
        press: {ja: "…キーを おしてください（Esc でやめる）", en: "…press a key (Esc to cancel)", zh: "…请按键（Esc 取消）", ko: "…키를 누르세요 (Esc 취소)"},
        reset: {ja: "↩ ぜんぶ もとに もどす", en: "↩ Reset all", zh: "↩ 全部恢复默认", ko: "↩ 모두 초기화"},
        tune: {ja: "ちょうせい", en: "Tuning", zh: "调整", ko: "조정"},
        spd: {ja: "カーソルの はやさ", en: "Cursor speed", zh: "光标速度", ko: "커서 속도"},
        dz: {ja: "スティックの あそび", en: "Stick dead zone", zh: "摇杆死区", ko: "스틱 데드존"},
        rumble: {ja: "しんどう（ふるえ）", en: "Vibration", zh: "震动", ko: "진동"},
        tb: {ja: "画面ボタンの 大きさ", en: "On-screen button size", zh: "屏幕按钮大小", ko: "화면 버튼 크기"},
        on: {ja: "オン", en: "On", zh: "开", ko: "켜짐"}, off: {ja: "オフ", en: "Off", zh: "关", ko: "꺼짐"},
        sz: [{ja: "小", en: "S", zh: "小", ko: "작게"}, {ja: "中", en: "M", zh: "中", ko: "보통"}, {ja: "大", en: "L", zh: "大", ko: "크게"}],
        close: {ja: "とじる", en: "Close", zh: "关闭", ko: "닫기"},
        space: {ja: "くうはく", en: "Space", zh: "空格", ko: "띄어쓰기"}, del: {ja: "⌫ けす", en: "⌫ Del", zh: "⌫ 删除", ko: "⌫ 지우기"}, ok: {ja: "✓ けってい", en: "✓ Done", zh: "✓ 确定", ko: "✓ 확인"},
        dak: {ja: "゛゜", en: "゛゜", zh: "゛゜", ko: "゛゜"}, small: {ja: "小", en: "small", zh: "小", ko: "작게"},
        tpHint: {ja: "十字キー／スティックで えらび、A で 入力、B で とじる", en: "D-pad/stick to pick, A to type, B to close", zh: "方向键/摇杆选择，A 输入，B 关闭", ko: "방향키/스틱으로 선택, A 입력, B 닫기"},
        decide: {ja: "決定", en: "Confirm", zh: "确定", ko: "결정"}, back: {ja: "もどる", en: "Back", zh: "返回", ko: "뒤로"},
        dpad: {ja: "十字キー／左スティック", en: "D-pad / left stick", zh: "方向键/左摇杆", ko: "방향키/왼쪽 스틱"}
    };
    var NAMES = {up: "↑", down: "↓", left: "←", right: "→", a: "A", b: "B", x: "X", y: "Y", l: "L", r: "R", zl: "ZL", zr: "ZR", plus: "＋", minus: "−"};
    function LS(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(_e){} return null; }
    function lang(){ var l = "ja"; try{ l = (window.GK && GK.lang && GK.lang()) || LS("are_lang") || "ja"; }catch(_e){} return T.title[l] ? l : "ja"; }
    function tt(k){ var o = T[k]; return o ? (o[lang()] || o.ja) : k; }
    function tz(o){ return o ? (o[lang()] || o.ja || o.en || "") : ""; }

    // ---- 設定 ----
    var cfg = {keys: {}, dz: .25, spd: 1, rumble: true, tb: 1};
    try{ var s0 = JSON.parse(LS(KEYKEY) || "null"); if(s0){ cfg.keys = s0.keys || {}; cfg.dz = +s0.dz || .25; cfg.spd = +s0.spd || 1; cfg.rumble = s0.rumble !== false; cfg.tb = s0.tb === 0 || s0.tb === 2 ? s0.tb : 1; } }catch(_e){}
    function save(){ LS(KEYKEY, JSON.stringify(cfg)); applyTb(); }
    function keysOf(a){ return cfg.keys[a] && cfg.keys[a].length ? cfg.keys[a] : DEFKEYS[a]; }
    function applyTb(){ try{ document.documentElement.style.setProperty("--gki-tb", [.85, 1, 1.3][cfg.tb]); }catch(_e){} }
    applyTb();
    function nk(k){ return k.length === 1 ? k.toLowerCase() : k; }
    function kname(k){ return k === " " ? "Space" : k === "ArrowUp" ? "↑" : k === "ArrowDown" ? "↓" : k === "ArrowLeft" ? "←" : k === "ArrowRight" ? "→" : k.length === 1 ? k.toUpperCase() : k; }

    // ---- じょうたい ----
    var G = {mode: "menu", target: null, lastSrc: "key", legend: [], backFn: null};
    var heldK = {}, heldP = {}, lis = [];
    function modalEl(){ var m = document.querySelector(".modal.on, .gki-modal.on, [data-gki-modal].on, [data-gki-modal]:not([hidden])"); return m || null; }
    function playing(){ return G.mode !== "menu" && !modalEl(); }
    function emit(a, down){ for(var i = 0; i < lis.length; i++){ try{ lis[i](a, down); }catch(e){ console.error(e); } } }
    var prevOff = window.ARE_PAD_OFF;
    window.ARE_PAD_OFF = function(){ return playing() || !!(typeof prevOff === "function" && prevOff()); };

    // ---- キーボード ----
    function typing(){ var a = document.activeElement; if(!a) return false; var n = a.tagName; return n === "INPUT" && !/^(checkbox|radio|button|range)$/.test(a.type) || n === "TEXTAREA" || n === "SELECT" || a.isContentEditable; }
    var cap = null, capCb = null;
    window.addEventListener("keydown", function(e){
        if(cap){ e.preventDefault(); e.stopImmediatePropagation(); var k = nk(e.key); if(k === "Escape"){ cap = null; paintPanel(); return; }
            ACTS.forEach(function(a){ if(a !== cap){ var l = keysOf(a).filter(function(x){ return x !== k; }); if(l.length !== keysOf(a).length) cfg.keys[a] = l.length ? l : ["(none)"]; } });
            cfg.keys[cap] = [k]; cap = null; save(); paintPanel(); return; }
        G.lastSrc = "key";
        if(e.key === "Escape" && !typing()){
            var gm = document.querySelector(".gki-modal.on"); if(gm){ closeAll(); e.preventDefault(); return; }
            if(G.mode === "menu" && !modalEl() && G.backFn){ try{ G.backFn(); }catch(_e){} }
        }
        if(typing() || e.ctrlKey || e.metaKey || e.altKey) return;
        var k2 = nk(e.key);
        for(var i = 0; i < ACTS.length; i++){ var a = ACTS[i];
            if(keysOf(a).indexOf(k2) >= 0){
                if(!heldK[a]){ heldK[a] = 1; if(G.mode !== "menu" && !modalEl()){ emit(a, true); } }
                if(G.mode !== "menu" && !modalEl() && (a === "a" || /^(up|down|left|right|b)$/.test(a)) && /^(Arrow|Backspace| )/.test(e.key)) e.preventDefault();
                break;
            } }
    }, true);
    window.addEventListener("keyup", function(e){
        var k2 = nk(e.key);
        for(var i = 0; i < ACTS.length; i++){ var a = ACTS[i]; if(keysOf(a).indexOf(k2) >= 0 && heldK[a]){ heldK[a] = 0; emit(a, false); } }
    }, true);
    window.addEventListener("blur", function(){ ACTS.forEach(function(a){ if(heldK[a]){ heldK[a] = 0; emit(a, false); } }); });
    ["pointermove", "pointerdown"].forEach(function(t){ window.addEventListener(t, function(e){ if(e.isTrusted){ G.lastSrc = "mouse"; hideCur(); } }, true); });

    // ---- パッド ----
    var padOn = null, rumbleAt = 0;
    function getPad(){ var a = navigator.getGamepads ? navigator.getGamepads() : []; for(var i = 0; i < a.length; i++) if(a[i] && a[i].connected) return a[i]; return null; }
    var cur = {x: 0, y: 0, init: false, aDown: false, ts: 0}, curEl = null;
    function hideCur(){ if(curEl) curEl.style.display = "none"; }
    function showCur(){
        if(!curEl){ curEl = document.createElement("div"); curEl.id = "gkiCur"; curEl.style.cssText = "position:fixed;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;border:3px solid #ffd86b;border-radius:50%;box-shadow:0 0 0 2px #000,0 0 14px #ffd86b;z-index:99990;pointer-events:none;display:none;background:radial-gradient(circle,#ffd86b 0 3px,transparent 4px)"; (document.body || document.documentElement).appendChild(curEl); }
        curEl.style.display = "block"; curEl.style.transform = "translate(" + cur.x + "px," + cur.y + "px)"; curEl.style.opacity = cur.aDown ? ".55" : "1";
    }
    function fire(el, type, buttons){
        var ev; try{ ev = new PointerEvent(type, {bubbles: true, cancelable: true, clientX: cur.x, clientY: cur.y, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: buttons, button: type === "pointermove" ? -1 : 0}); }catch(_e){ return; }
        el.dispatchEvent(ev);
    }
    function domPress(el){
        var b = el.closest ? el.closest("button, a[href], [role=button], [data-move], input, select, summary, label, [data-pad-text]") : null; if(!b) return;
        if(b.matches && b.matches("[data-pad-text]")){ textpad(b); return; }
        b.classList.add("gki-press"); setTimeout(function(){ b.classList.remove("gki-press"); }, 120); try{ b.click(); }catch(_e){}
    }
    function pad(now){
        requestAnimationFrame(pad);
        var p = getPad(), dt = Math.min(.05, (now - (cur.ts || now)) / 1000); cur.ts = now;
        if(!p){ padOn = null; if(cur.aDown && G.target){ cur.aDown = false; } hideCur(); return; }
        var b = p.buttons, ax = p.axes || [], dz = cfg.dz, st = {};
        ACTS.forEach(function(a){ var i = PADIDX[a]; st[a] = !!(b[i] && b[i].pressed); });
        var ax0 = ax[0] || 0, ax1 = ax[1] || 0, mag = Math.hypot(ax0, ax1);
        if(ax0 < -.5) st.left = true; if(ax0 > .5) st.right = true; if(ax1 < -.5) st.up = true; if(ax1 > .5) st.down = true;
        var any = ACTS.some(function(a){ return st[a]; }) || mag > .4;
        if(any && padOn !== null) G.lastSrc = "pad";
        padOn = padOn || {id: p.id};
        var play = playing();
        ACTS.forEach(function(a){
            var was = !!heldP[a]; heldP[a] = st[a];
            if(!play || G.mode === "pointer" && /^(up|down|left|right|a)$/.test(a)) return;   // メニュー中は are-pad、ポインタ中は カーソルが 使う
            if(st[a] !== was) emit(a, st[a]);
        });
        if(G.mode === "pointer" && play && G.target){
            if(!cur.init){ var r0 = G.target.getBoundingClientRect(); cur.x = r0.left + r0.width / 2; cur.y = r0.top + r0.height / 2; cur.init = true; }
            var vx = 0, vy = 0;
            if(mag > dz){ var sc = Math.pow((mag - dz) / (1 - dz), 1.6); vx = ax0 / mag * sc * 1100 * cfg.spd; vy = ax1 / mag * sc * 1100 * cfg.spd; }
            if(!(mag > dz)){ if(b[14] && b[14].pressed) vx -= 330 * cfg.spd; if(b[15] && b[15].pressed) vx += 330 * cfg.spd; if(b[12] && b[12].pressed) vy -= 330 * cfg.spd; if(b[13] && b[13].pressed) vy += 330 * cfg.spd; }
            var nx = Math.max(0, Math.min(innerWidth - 1, cur.x + vx * dt)), ny = Math.max(0, Math.min(innerHeight - 1, cur.y + vy * dt)), moved = nx !== cur.x || ny !== cur.y; cur.x = nx; cur.y = ny;
            var below = document.elementFromPoint(cur.x, cur.y), onT = below && (below === G.target || G.target.contains(below));
            if(moved && onT) fire(G.target, "pointermove", cur.aDown ? 1 : 0);
            var aNow = !!(b[1] && b[1].pressed);
            if(cur.gate){ if(!aNow) cur.gate = false; aNow = false; }   // ゲームに はいる とき おしていた A は むし（はなすまで）
            if(aNow && !cur.aDown){ cur.aDown = true; G.lastSrc = "pad"; if(onT){ fire(G.target, "pointerdown", 1); } else if(below){ domPress(below); cur.aDown = false; cur.uiHold = true; } }
            else if(!aNow && cur.aDown){ cur.aDown = false; fire(G.target, "pointerup", 0); }
            if(!aNow) cur.uiHold = false;
            if(G.lastSrc === "pad") showCur();
            var sy = ax[3] || 0; if(Math.abs(sy) > .5){ var sc2 = document.scrollingElement; if(sc2 && sc2.scrollHeight > sc2.clientHeight) sc2.scrollTop += sy * 14; }
        }else{ if(cur.aDown && G.target){ cur.aDown = false; fire(G.target, "pointerup", 0); } cur.gate = !!(b[1] && b[1].pressed); hideCur(); }
    }
    requestAnimationFrame(pad);
    function rumble(ms, weak, strong){
        if(!cfg.rumble) return; var now = performance.now(); if(now - rumbleAt < 60) return; rumbleAt = now;
        var p = getPad(); if(!p) return; var v = p.vibrationActuator;
        try{ if(v && v.playEffect) v.playEffect("dual-rumble", {duration: ms || 80, strongMagnitude: strong == null ? .5 : strong, weakMagnitude: weak == null ? .4 : weak}); else if(p.hapticActuators && p.hapticActuators[0] && p.hapticActuators[0].pulse) p.hapticActuators[0].pulse(.6, ms || 80); }catch(_e){}
    }

    // ---- 画面（ダイアログ） ----
    var css = document.createElement("style");
    css.textContent = ".gki-modal{position:fixed;inset:0;z-index:99980;background:rgba(5,3,25,.78);display:none;align-items:center;justify-content:center;padding:12px;font-family:system-ui,'Hiragino Sans','Yu Gothic','Noto Sans JP','Noto Sans SC','Noto Sans KR',sans-serif;color:#fff;-webkit-user-select:none;user-select:none}" +
        ".gki-modal.on{display:flex}.gki-box{width:min(96vw,560px);max-height:94vh;overflow:auto;background:linear-gradient(#26297a,#171a52);border:2px solid #8a8fff;border-radius:18px;padding:14px 16px;box-shadow:0 0 40px rgba(120,100,255,.5)}" +
        ".gki-box h3{margin:0 0 6px;font-size:20px;text-align:center;color:#ffd86b}.gki-box h4{margin:12px 0 4px;font-size:14px;color:#9fb0ff;border-bottom:1px solid #4b53b8;padding-bottom:2px}" +
        ".gki-box button,.gki-tp button{font:inherit;color:#fff;background:linear-gradient(#3a3d8f,#262a6b);border:1px solid #8a8fff;border-radius:10px;padding:8px 10px;cursor:pointer;touch-action:manipulation;min-height:40px}" +
        ".gki-box button.sel,.gki-tp button.sel{background:linear-gradient(#ffe36a,#ffb02e);color:#1a0b3a;border-color:#ffe36a;font-weight:800}" +
        ".gki-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0;font-size:14px}.gki-row>span{flex:1;text-align:left}.gki-row button{min-width:110px}" +
        ".gki-leg{font-size:13px;line-height:1.7;margin:2px 0;display:flex;gap:8px}.gki-leg b{flex:0 0 9.5em;font-size:12.5px;color:#ffd86b;text-align:left}.gki-leg i{font-style:normal;opacity:.65;font-size:11px}" +
        ".gki-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:6px 0}.gki-btns button{flex:1 1 140px}.gki-note{font-size:12px;opacity:.85;margin:2px 0}.gki-press{filter:brightness(1.6)}" +
        ".gki-tp{align-items:flex-end}.gki-tp .gki-box{width:min(100vw,720px);border-radius:18px 18px 0 0;padding:10px 10px calc(10px + env(safe-area-inset-bottom))}" +
        ".gki-tpv{font-size:22px;min-height:34px;background:#0c0f33;border:1px solid #6b73f0;border-radius:10px;padding:4px 10px;margin-bottom:6px;text-align:left;word-break:break-all}.gki-tpv u{text-decoration:none;color:#ffd86b;animation:gkiBl 1s steps(2) infinite}" +
        "@keyframes gkiBl{50%{opacity:0}}.gki-tpg{display:grid;gap:5px;margin:6px 0}.gki-tpg button{padding:6px 0;font-size:19px;min-height:44px}.gki-tpf{display:flex;gap:6px}.gki-tpf button{flex:1;min-height:46px}.gki-tpt{display:flex;gap:6px;margin-bottom:4px}.gki-tpt button{flex:1;min-height:36px}";
    (document.head || document.documentElement).appendChild(css);
    function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
    function closeAll(){ var a = document.querySelectorAll(".gki-modal.on"); for(var i = 0; i < a.length; i++){ a[i].classList.remove("on"); if(a[i].parentNode && a[i].dataset.tmp) a[i].parentNode.removeChild(a[i]); } cap = null; }

    // ---- 設定画面 ----
    var panel = null;
    function legendRows(){
        var out = []; G.legend.forEach(function(L){
            var acts = L.k === "dpad" ? ["up", "down", "left", "right"] : [L.k];
            var padN = L.k === "dpad" ? "🎮 " + tt("dpad") : "🎮 " + NAMES[L.k] + (L.k === "a" ? "（" + tt("decide") + "）" : L.k === "b" ? "（" + tt("back") + "）" : "");
            var keys = acts.map(function(a){ return keysOf(a).map(kname).join("/"); }).join(L.k === "dpad" ? " " : "");
            out.push({n: padN, k: keys, t: tz(L.t)});
        }); return out;
    }
    function openSettings(){
        closeAll();
        if(!panel){ panel = el("div", "gki-modal"); panel.id = "gkiPanel"; panel.setAttribute("role", "dialog"); panel.addEventListener("click", function(e){ if(e.target === panel) closeAll(); }); document.body.appendChild(panel); }
        panel.classList.add("on"); paintPanel();
        var fb = panel.querySelector("[data-first]"); if(fb) try{ fb.scrollIntoView({block: "nearest"}); }catch(_e){}
    }
    function paintPanel(){
        if(!panel) return; panel.innerHTML = ""; var box = el("div", "gki-box"); panel.appendChild(box);
        box.appendChild(el("h3", "", tt("title")));
        var lg = legendRows();
        if(lg.length){ box.appendChild(el("h4", "", tt("legend"))); lg.forEach(function(r){ var d = el("div", "gki-leg"); d.appendChild(el("b", "", r.n)); var s = el("span", "", r.t + "　"); s.appendChild(el("i", "", "⌨ " + r.k)); d.appendChild(s); box.appendChild(d); }); }
        box.appendChild(el("h4", "", tt("padSec")));
        var p = getPad(); box.appendChild(el("div", "gki-note", p ? tt("padOn") + String(p.id).slice(0, 36) : tt("noPad"))); box.appendChild(el("div", "gki-note", tt("padNote")));
        var pm = window.AREPadMap, ly = pm && pm.layout ? pm.layout() : "nin";
        var bb = el("div", "gki-btns");
        var b1 = el("button", ly === "nin" ? "sel" : "", (ly === "nin" ? "✅ " : "") + tt("layNin")); b1.type = "button"; b1.setAttribute("data-first", "1"); b1.onclick = function(){ if(pm && pm.setLayout) pm.setLayout("nin"); paintPanel(); };
        var b2 = el("button", ly === "xbox" ? "sel" : "", (ly === "xbox" ? "✅ " : "") + tt("layXbox")); b2.type = "button"; b2.onclick = function(){ if(pm && pm.setLayout) pm.setLayout("xbox"); paintPanel(); };
        var b3 = el("button", "", tt("padOpen")); b3.type = "button"; b3.onclick = function(){ if(pm && pm.open) pm.open(); };
        if(pm){ bb.appendChild(b1); bb.appendChild(b2); bb.appendChild(b3); box.appendChild(bb); }
        box.appendChild(el("h4", "", tt("kbSec")));
        var NA = {a: "A（" + tt("decide") + "）", b: "B（" + tt("back") + "）"};
        ACTS.forEach(function(a){
            var row = el("div", "gki-row"), nm = el("span", "", NA[a] || NAMES[a]);
            var kb = el("button", cap === a ? "sel" : "", cap === a ? tt("press") : keysOf(a).map(function(k){ return k === "(none)" ? "—" : kname(k); }).join(" / ")); kb.type = "button";
            kb.onclick = function(){ cap = cap === a ? null : a; paintPanel(); };
            row.appendChild(nm); row.appendChild(kb); box.appendChild(row);
        });
        box.appendChild(el("h4", "", tt("tune")));
        function stepper(label, get, set, show){
            var row = el("div", "gki-row"); row.appendChild(el("span", "", label));
            var m = el("button", "", "−"), v = el("button", "", show()), pl = el("button", "", "＋"); [m, v, pl].forEach(function(x){ x.type = "button"; x.style.minWidth = "52px"; }); v.style.minWidth = "72px"; v.disabled = true;
            m.onclick = function(){ set(-1); paintPanel(); }; pl.onclick = function(){ set(1); paintPanel(); };
            row.appendChild(m); row.appendChild(v); row.appendChild(pl); box.appendChild(row);
        }
        var SP = [.5, .75, 1, 1.5, 2], DZ = [.1, .18, .25, .35, .5];
        function idx(arr, v){ var bi = 0; arr.forEach(function(x, i){ if(Math.abs(x - v) < Math.abs(arr[bi] - v)) bi = i; }); return bi; }
        stepper(tt("spd"), 0, function(d){ cfg.spd = SP[Math.max(0, Math.min(SP.length - 1, idx(SP, cfg.spd) + d))]; save(); }, function(){ return "×" + cfg.spd; });
        stepper(tt("dz"), 0, function(d){ cfg.dz = DZ[Math.max(0, Math.min(DZ.length - 1, idx(DZ, cfg.dz) + d))]; save(); }, function(){ return Math.round(cfg.dz * 100) + "%"; });
        stepper(tt("tb"), 0, function(d){ cfg.tb = Math.max(0, Math.min(2, cfg.tb + d)); save(); }, function(){ return tz(T.sz[cfg.tb]); });
        var rr = el("div", "gki-row"); rr.appendChild(el("span", "", tt("rumble"))); var rb = el("button", cfg.rumble ? "sel" : "", cfg.rumble ? tt("on") : tt("off")); rb.type = "button"; rb.onclick = function(){ cfg.rumble = !cfg.rumble; save(); if(cfg.rumble) rumble(120, .6, .8); paintPanel(); }; rr.appendChild(rb); box.appendChild(rr);
        var fin = el("div", "gki-btns");
        var rs = el("button", "", tt("reset")); rs.type = "button"; rs.onclick = function(){ cfg = {keys: {}, dz: .25, spd: 1, rumble: true, tb: 1}; save(); if(window.AREPadMap && AREPadMap.reset) try{ AREPadMap.reset(); }catch(_e){} paintPanel(); };
        var cl = el("button", "sel", tt("close")); cl.type = "button"; cl.onclick = closeAll; fin.appendChild(rs); fin.appendChild(cl); box.appendChild(fin);
    }
    document.addEventListener("click", function(e){ var t = e.target && e.target.closest && e.target.closest("[data-gki-settings]"); if(t){ e.preventDefault(); openSettings(); } }, true);

    // ---- もじ盤（パッドだけで 文字を うつ） ----
    var HL = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ", HV = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
    var HT = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    var CT = {"ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ", "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ", "ㅂㅅ": "ㅄ"}, SPL = {};
    Object.keys(CT).forEach(function(k){ SPL[CT[k]] = [k[0], k[1]]; });
    var CV = {"ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ", "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ", "ㅡㅣ": "ㅢ"}, SPV = {};
    Object.keys(CV).forEach(function(k){ SPV[CV[k]] = [k[0], k[1]]; });
    function mk(l, v, t){ return String.fromCharCode(0xAC00 + (l * 21 + v) * 28 + t); }
    function hangulAppend(s, j){
        var last = s.slice(-1), code = last.charCodeAt(0), vow = HV.indexOf(j) >= 0;
        if(code >= 0xAC00 && code <= 0xD7A3){
            var n = code - 0xAC00, l = Math.floor(n / 588), v = Math.floor(n % 588 / 28), t = n % 28;
            if(vow){
                if(t === 0){ var cv = CV[HV[v] + j]; if(cv) return s.slice(0, -1) + mk(l, HV.indexOf(cv), 0); }
                else{ var tj = HT[t], rest = "", mv = tj; if(SPL[tj]){ rest = SPL[tj][0]; mv = SPL[tj][1]; } var li = HL.indexOf(mv); if(li >= 0) return s.slice(0, -1) + mk(l, v, rest ? HT.indexOf(rest) : 0) + mk(li, HV.indexOf(j), 0); }
            }else if(HL.indexOf(j) >= 0){
                if(t === 0){ var ti = HT.indexOf(j); if(ti > 0) return s.slice(0, -1) + mk(l, v, ti); }
                else{ var cc = CT[HT[t] + j]; if(cc) return s.slice(0, -1) + mk(l, v, HT.indexOf(cc)); }
            }
        }else if(HL.indexOf(last) >= 0 && vow) return s.slice(0, -1) + mk(HL.indexOf(last), HV.indexOf(j), 0);
        else if(HV.indexOf(last) >= 0 && vow && CV[last + j]) return s.slice(0, -1) + CV[last + j];
        return s + j;
    }
    function hangulBack(s){
        var last = s.slice(-1), code = last.charCodeAt(0);
        if(code >= 0xAC00 && code <= 0xD7A3){
            var n = code - 0xAC00, l = Math.floor(n / 588), v = Math.floor(n % 588 / 28), t = n % 28;
            if(t){ var tj = HT[t]; return s.slice(0, -1) + mk(l, v, SPL[tj] ? HT.indexOf(SPL[tj][0]) : 0); }
            var vj = HV[v]; if(SPV[vj]) return s.slice(0, -1) + mk(l, HV.indexOf(SPV[vj][0]), 0);
            return s.slice(0, -1) + HL[l];
        }
        if(SPV[last]) return s.slice(0, -1) + SPV[last][0];
        return Array.from(s).slice(0, -1).join("");
    }
    var HIRA_G = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と", "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ", "ま", "み", "む", "め", "も", "や", "", "ゆ", "", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "ん", "ー", "？"];
    var SM = "ぁあぃいぅうぇえぉおっつゃやゅゆょよゎわ";
    var DK = ["かが", "きぎ", "くぐ", "けげ", "こご", "さざ", "しじ", "すず", "せぜ", "そぞ", "ただ", "ちぢ", "つづ", "てで", "とど", "はば", "ひび", "ふぶ", "へべ", "ほぼ"], HD = ["はぱ", "ひぴ", "ふぷ", "へぺ", "ほぽ"];
    function dakuten(c, mode){   // mode: 0=゛（にごる／もどる） 1=゜（はぎょう） 2=小（ちいさい／もどる）
        var i, p;
        if(mode === 2){ for(i = 0; i < SM.length; i += 2){ if(c === SM[i]) return SM[i + 1]; if(c === SM[i + 1]) return SM[i]; } return c; }
        if(mode === 1){ for(i = 0; i < HD.length; i++){ p = HD[i]; if(c === p[0] || c === DK[15 + i][1]) return p[1]; if(c === p[1]) return p[0]; } return c; }
        for(i = 0; i < DK.length; i++){ p = DK[i]; if(c === p[0]) return p[1]; if(c === p[1]) return p[0]; }
        for(i = 0; i < HD.length; i++){ if(c === HD[i][1]) return DK[15 + i][1]; }
        return c;
    }
    function kata(s){ return s.replace(/[ぁ-ゖ]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) + 0x60); }); }
    function hira(s){ return s.replace(/[ァ-ヶ]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }
    var tp = null;
    function tabsFor(l, o){
        var ABC = {n: "ABC", cols: 7, ch: "abcdefghijklmnopqrstuvwxyz".split("")}, NUM = {n: "123", cols: 5, ch: "0123456789!?-+・.,".split("")};
        if(l === "ja") return [{n: "ひら", cols: 5, ch: HIRA_G, kana: 1}, {n: "カナ", cols: 5, ch: HIRA_G.map(function(c){ return c ? kata(c) : c; }), kana: 2}, ABC, NUM];
        if(l === "ko") return [{n: "ㄱ", cols: 7, ch: (HL.replace(/[ㄸㅃㅉ]/g, function(c){ return c; }) + HV).split(""), hangul: 1}, ABC, NUM];
        if(l === "zh") return [{n: "字", cols: 7, ch: ((o && o.chars) || "一二三四五六七八九十大小上下左右中人口手水火木金土山川日月").split("")}, ABC, NUM];
        return [ABC, NUM];
    }
    function textpad(inp, o){
        closeAll(); var l = lang(), tabs = tabsFor(l, o || (window.GKI && G.tpOpts)), ti = 0;
        var ov = el("div", "gki-modal gki-tp on"); ov.dataset.tmp = "1"; document.body.appendChild(ov); tp = ov;
        try{ inp.blur(); }catch(_e){}
        function val(){ return inp.value; }
        function setv(v){ inp.value = v; try{ inp.dispatchEvent(new Event("input", {bubbles: true})); }catch(_e){} }
        function paint(){
            ov.innerHTML = ""; var box = el("div", "gki-box"); ov.appendChild(box);
            var vv = el("div", "gki-tpv"); vv.appendChild(document.createTextNode(val())); vv.appendChild(el("u", "", "▏")); box.appendChild(vv);
            if(tabs.length > 1){ var tb = el("div", "gki-tpt"); tabs.forEach(function(t, i){ var b = el("button", i === ti ? "sel" : "", t.n); b.type = "button"; b.onclick = function(){ ti = i; paint(); }; tb.appendChild(b); }); box.appendChild(tb); }
            var T0 = tabs[ti], g = el("div", "gki-tpg"); g.style.gridTemplateColumns = "repeat(" + T0.cols + ",1fr)";
            T0.ch.forEach(function(c){ var b = el("button", "", c); b.type = "button"; if(!c){ b.style.visibility = "hidden"; b.disabled = true; }
                b.onclick = function(){ var v = val(); setv(T0.hangul ? hangulAppend(v, c) : v + c); paintV(); GK_sfx("tap"); }; g.appendChild(b); });
            box.appendChild(g);
            var f = el("div", "gki-tpf"), mkb = function(txt, fn, cls){ var b = el("button", cls || "", txt); b.type = "button"; b.onclick = fn; f.appendChild(b); return b; };
            if(T0.kana){ mkb("゛", function(){ edit(0); }); mkb("゜", function(){ edit(1); }); mkb(tt("small"), function(){ edit(2); }); }
            mkb(tt("space"), function(){ setv(val() + " "); paintV(); });
            mkb(tt("del"), function(){ var v = val(); setv(l === "ko" ? hangulBack(v) : Array.from(v).slice(0, -1).join("")); paintV(); });
            mkb(tt("ok"), function(){ closeAll(); try{ if(inp.form){ if(inp.form.requestSubmit) inp.form.requestSubmit(); else inp.form.dispatchEvent(new Event("submit", {cancelable: true, bubbles: true})); } }catch(_e){} }, "sel");
            mkb("✕", closeAll);
            box.appendChild(f); box.appendChild(el("div", "gki-note", tt("tpHint")));
        }
        function paintV(){ var vv = ov.querySelector(".gki-tpv"); if(vv){ vv.textContent = val(); vv.appendChild(el("u", "", "▏")); } }
        function edit(mode){ var v = Array.from(val()); if(!v.length) return; var c = v[v.length - 1], h = hira(c), isK = c !== h, r = dakuten(h, mode); v[v.length - 1] = isK ? kata(r) : r; setv(v.join("")); paintV(); }
        paint();
    }
    function GK_sfx(n){ try{ if(window.GK && GK.sfx) GK.sfx(n); }catch(_e){} }
    // pad の A で input（data-pad-text）を おしたら もじ盤を ひらく
    document.addEventListener("click", function(e){
        var t = e.target && e.target.closest && e.target.closest("[data-pad-text]");
        if(t && G.lastSrc === "pad" && !(tp && tp.classList.contains("on"))){ e.preventDefault(); textpad(t); }
    }, true);

    window.GKI = {
        mode: function(m, el2){ G.mode = m || "menu"; G.target = el2 || G.target; if(m !== "pointer"){ cur.init = false; hideCur(); } else if(el2) cur.init = false; },
        on: function(fn){ lis.push(fn); return fn; }, off: function(fn){ var i = lis.indexOf(fn); if(i >= 0) lis.splice(i, 1); },
        held: function(a){ return !!(heldK[a] || heldP[a]); }, playing: playing,
        keyAxis: function(){ return {x: (heldK.right ? 1 : 0) - (heldK.left ? 1 : 0), y: (heldK.down ? 1 : 0) - (heldK.up ? 1 : 0)}; },
        defaults: function(m){ Object.keys(m).forEach(function(a){ if(DEFKEYS[a]) DEFKEYS[a] = m[a]; }); },
        axis: function(){ var p = getPad(), x = 0, y = 0; if(p){ var ax = p.axes || [], m = Math.hypot(ax[0] || 0, ax[1] || 0); if(m > cfg.dz){ x = ax[0] || 0; y = ax[1] || 0; } } return {x: x + ((heldK.right || heldP.right) ? 1 : 0) - ((heldK.left || heldP.left) ? 1 : 0), y: y + ((heldK.down || heldP.down) ? 1 : 0) - ((heldK.up || heldP.up) ? 1 : 0)}; },
        legend: function(a){ G.legend = a || []; }, onBack: function(fn){ G.backFn = fn; },
        openSettings: openSettings, close: closeAll, textpad: textpad, textpadOpts: function(o){ G.tpOpts = o; },
        rumble: rumble, cfg: function(){ return cfg; }, keys: keysOf, lastSrc: function(){ return G.lastSrc; }, padConnected: function(){ return !!getPad(); },
        _hangul: {append: hangulAppend, back: hangulBack}, _cur: cur, _mode: function(){ return G.mode; }, ACTS: ACTS
    };
})();
