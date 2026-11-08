/* ARE ゲームパッド「ボタン設定」（全ゲーム共通・クラシックscript）
   どのゲームも navigator.getGamepads() で パッドを 読んでいる。その入口を ここで 1か所だけ かぶせて、
   「押した ボタン → ゲームが 受けとる ボタン」を、じぶんの 好きな 配置に 入れかえる（ゲームごとの 書きかえは いらない）。
   ・A と B を 入れかえる、L／ZL を かえる、など ボタン1つ1つを 自由に 設定できる（タイトル画面の「🎮 ボタン設定」）
   ・マウスが なくても 設定できる（十字キー／キーボードの ↑↓・Enter・Esc、パッドの 十字・A・B）
   ・設定は この端末の ブラウザ（localStorage）に ほぞん。「もとにもどす」で ぜんぶ もとの 配置に もどる
   ・どのゲームも 読みこみの いちばん さいしょに この script を 入れる（先に かぶせるため）
   ・設定画面を ひらくには：window.AREPadMap.open()  または  data-are-padmap を つけた ボタンを おす */
(function(){
    if(window.AREPadMap || !navigator.getGamepads) return;
    var KEY = "are_padmap_v1";
    // ゲームが 見る ボタン（標準配置の 番号）。名前は Nintendo Switch の 呼びかた
    var ROWS = [
        {i: 1,  n: "A（決定）"}, {i: 0,  n: "B（もどる）"}, {i: 3,  n: "X"}, {i: 2,  n: "Y"},
        {i: 4,  n: "L"}, {i: 5,  n: "R"}, {i: 6,  n: "ZL"}, {i: 7,  n: "ZR"},
        {i: 8,  n: "−（マイナス）"}, {i: 9,  n: "＋（プラス）"},
        {i: 12, n: "十字キー 上"}, {i: 13, n: "十字キー 下"}, {i: 14, n: "十字キー 左"}, {i: 15, n: "十字キー 右"},
        {i: 10, n: "左スティック 押しこみ"}, {i: 11, n: "右スティック 押しこみ"}
    ];
    var PHYS = {0: "B", 1: "A", 2: "Y", 3: "X", 4: "L", 5: "R", 6: "ZL", 7: "ZR", 8: "−", 9: "＋", 10: "左スティック押し", 11: "右スティック押し", 12: "十字 上", 13: "十字 下", 14: "十字 左", 15: "十字 右", 16: "HOME", 17: "キャプチャー"};
    var WIZ = [1, 0, 3, 2, 4, 5, 6, 7];      // 「ひとつずつ 設定」で じゅんばんに きく ボタン（A B X Y L R ZL ZR）
    var realGet = navigator.getGamepads.bind(navigator);

    // ---- 設定の よみかき ----
    function ident(){ var m = []; for(var i = 0; i < 18; i++) m[i] = i; return m; }
    var cfg = {map: ident(), swap: false};
    function load(){
        try{
            var o = JSON.parse(localStorage.getItem(KEY) || "null");
            if(o && Array.isArray(o.map) && o.map.length === 18 && o.map.every(function(v){ return typeof v === "number" && v >= 0 && v < 18; })){ cfg.map = o.map.slice(); cfg.swap = !!o.swap; }
        }catch(_e){}
    }
    function save(){ try{ localStorage.setItem(KEY, JSON.stringify(cfg)); }catch(_e){} }
    function isDefault(){ return !cfg.swap && cfg.map.every(function(v, i){ return v === i; }); }
    load();

    // ---- パッドに かぶせる ----
    var panelOpen = false;
    var NONE = {pressed: false, touched: false, value: 0};
    function wrap(p){
        if(!p) return p;
        var btns = [], n = Math.max(p.buttons.length, 17);
        for(var i = 0; i < n; i++){
            var s = cfg.map[i] != null ? cfg.map[i] : i, b = panelOpen ? NONE : (p.buttons[s] || NONE);   // 設定画面を ひらいている あいだは ゲームには なにも 伝えない
            btns[i] = {pressed: !!b.pressed, touched: !!b.touched || !!b.pressed, value: +b.value || 0};
        }
        var ax = Array.prototype.slice.call(p.axes || []);
        if(cfg.swap && ax.length >= 4) ax = [ax[2], ax[3], ax[0], ax[1]].concat(ax.slice(4));
        if(panelOpen) ax = ax.map(function(){ return 0; });
        return {id: p.id, index: p.index, connected: p.connected, mapping: p.mapping, timestamp: p.timestamp, buttons: btns, axes: ax,
                vibrationActuator: p.vibrationActuator, hapticActuators: p.hapticActuators};
    }
    navigator.getGamepads = function(){
        var raw = realGet(), out = [];
        for(var i = 0; i < raw.length; i++) out[i] = isDefault() && !panelOpen ? raw[i] : wrap(raw[i]);
        return out;
    };

    // ---- 設定画面 ----
    var box = null, rows = [], sel = 0, cap = -1, capT = 0, wiz = -1, raf = 0, prev = {}, info = null, status = "";
    function physName(i){ return PHYS[i] != null ? PHYS[i] : "ボタン" + i; }
    function el(tag, css, text){ var e = document.createElement(tag); if(css) e.style.cssText = css; if(text != null) e.textContent = text; return e; }
    function rawPad(){ var r = realGet(); for(var i = 0; i < r.length; i++) if(r[i] && r[i].connected) return r[i]; return null; }

    function paint(){
        if(!box) return;
        var p = rawPad();
        info.textContent = p ? "つながっている パッド： " + String(p.id).slice(0, 40) : "パッドが 見つかりません。パッドの ボタンを どれか おしてください。（キーボードでも 操作できます）";
        rows.forEach(function(r, k){
            var v = cfg.map[ROWS[k].i];
            r.val.textContent = (cap === k ? "…… おしたい ボタンを おしてください" : physName(v) + (v === ROWS[k].i ? "" : "　（かえた）"));
            r.row.style.background = k === sel ? "#35479a" : "#1b2350";
            r.row.style.outline = k === sel ? "2px solid #ffd86b" : "none";
            r.val.style.color = cap === k ? "#ffd86b" : v === ROWS[k].i ? "#cfd6ff" : "#7dffb0";
        });
        acts.forEach(function(a, k){ a.el.style.background = ROWS.length + k === sel ? "#35479a" : "#243064"; a.el.style.outline = ROWS.length + k === sel ? "2px solid #ffd86b" : "none"; });
        swapBtn.textContent = "🕹 スティック 左右を入れかえる：" + (cfg.swap ? "オン" : "オフ");
        stEl.textContent = status;
    }
    var swapBtn, stEl, acts = [];
    function total(){ return ROWS.length + acts.length; }
    function activate(k){ if(k < ROWS.length) startCap(k); else if(acts[k - ROWS.length]) acts[k - ROWS.length].fn(); }
    function startCap(k){ cap = k; capT = performance.now(); sel = k; paint(); }
    function endCap(msg){ cap = -1; wiz = -1; status = msg || ""; paint(); }
    // physical を logical(k行) に わりあてる。すでに ほかの行が つかっていたら、おたがいを 入れかえる
    function assign(k, phys){
        var li = ROWS[k].i, old = cfg.map[li];
        for(var j = 0; j < ROWS.length; j++){ var lj = ROWS[j].i; if(lj !== li && cfg.map[lj] === phys){ cfg.map[lj] = old; } }
        cfg.map[li] = phys; save();
    }
    function next(){
        if(wiz >= 0){
            wiz++;
            if(wiz < WIZ.length){ var idx = ROWS.findIndex(function(r){ return r.i === WIZ[wiz]; }); startCap(idx); return; }
            endCap("できました！ ためしに ボタンを おして ためしてみてください。");
        }
    }
    function reset(){ cfg.map = ident(); cfg.swap = false; save(); status = "もとの 配置に もどしました。"; paint(); }
    function close(){
        panelOpen = false; cap = -1; wiz = -1; cancelAnimationFrame(raf);
        if(box){ box.remove(); box = null; }
        window.removeEventListener("keydown", onKey, true);
    }
    function onKey(e){
        if(!box) return;
        var k = e.key;
        e.stopPropagation();
        if(cap >= 0){ if(k === "Escape"){ e.preventDefault(); endCap("やめました。"); } return; }
        if(k === "Escape"){ e.preventDefault(); close(); }
        else if(k === "ArrowUp"){ e.preventDefault(); sel = (sel + total() - 1) % total(); paint(); }
        else if(k === "ArrowDown"){ e.preventDefault(); sel = (sel + 1) % total(); paint(); }
        else if(k === "Enter" || k === " "){ e.preventDefault(); activate(sel); }
    }
    // 設定画面の 操作は、いつもの 標準配置（A＝決定・B＝もどる・十字＝えらぶ）で。かえた 配置の 影響は うけない
    function loop(){
        raf = requestAnimationFrame(loop);
        var p = rawPad(), now = performance.now();
        if(!p){ paint(); return; }
        var cur = {};
        for(var i = 0; i < p.buttons.length; i++) cur[i] = !!p.buttons[i].pressed;
        var edge = function(i){ return cur[i] && !prev[i]; };
        if(cap >= 0){
            if(now - capT > 12000){ endCap("じかんぎれです。もういちど えらんでください。"); }
            else if(now - capT > 250){
                for(var b = 0; b < p.buttons.length; b++){
                    if(edge(b)){ assign(cap, b); var nm = ROWS[cap].n; status = nm + " ← 「" + physName(b) + "」に しました。"; if(wiz >= 0) next(); else endCap(status); break; }
                }
            }
        }else{
            var ay = p.axes && p.axes[1] || 0;
            if(edge(12) || (ay < -.7 && !prev.up)){ sel = (sel + total() - 1) % total(); paint(); }
            if(edge(13) || (ay > .7 && !prev.dn)){ sel = (sel + 1) % total(); paint(); }
            if(edge(1)) activate(sel);
            if(edge(0)) close();
            prev.up = ay < -.7; prev.dn = ay > .7;
        }
        prev = Object.assign({up: prev.up, dn: prev.dn}, cur);
        // いま おされている ボタンの 表示（どの ボタンが どれか わかる ように）
        var on = []; for(var j = 0; j < p.buttons.length; j++) if(cur[j]) on.push(physName(j));
        liveEl.textContent = on.length ? "いま おしている ボタン： " + on.join("・") : "いま おしている ボタン： なし";
    }
    var liveEl;
    function open(){
        if(box) return;
        panelOpen = true; sel = 0; cap = -1; wiz = -1; status = ""; prev = {};
        var p0 = rawPad(); if(p0) for(var q = 0; q < p0.buttons.length; q++) prev[q] = !!p0.buttons[q].pressed;   // ひらいた しゅんかんに おしていた ボタンは むし
        box = el("div", "position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#fff");
        box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "ボタン設定");
        var win = el("div", "background:#10162e;border:3px solid #ffd86b;border-radius:14px;padding:14px 16px;width:min(94vw,560px);max-height:94vh;overflow:auto");
        win.appendChild(el("div", "font-weight:bold;font-size:20px;color:#ffd86b;text-align:center", "🎮 ボタン設定（プロコン・ゲームパッド）"));
        win.appendChild(el("div", "font-size:12px;opacity:.88;margin:6px 0 8px;line-height:1.5", "「ゲームが 受けとる ボタン」を、じぶんが おしたい ボタンに かえられます。行を えらんで Enter（パッドは A）→ おしたい ボタンを おすと 入れかわります。この画面だけは、いつもの 配置（A＝決定・B＝もどる・十字＝えらぶ）で 操作します。マウスは いりません。"));
        info = el("div", "font-size:12px;color:#9fb0ff;margin-bottom:6px"); win.appendChild(info);
        liveEl = el("div", "font-size:12px;color:#7dffb0;margin-bottom:6px;min-height:1.4em"); win.appendChild(liveEl);
        rows = [];
        ROWS.forEach(function(r, k){
            var row = el("div", "display:flex;justify-content:space-between;gap:8px;padding:7px 10px;margin:3px 0;border-radius:8px;cursor:pointer;font-size:15px");
            var nm = el("span", "font-weight:bold", r.n), val = el("span", "text-align:right");
            row.appendChild(nm); row.appendChild(val);
            row.addEventListener("click", function(){ sel = k; startCap(k); });
            win.appendChild(row); rows.push({row: row, val: val});
        });
        acts = [];
        function act(label, fn){
            var e = el("div", "padding:9px 12px;margin:4px 0;border-radius:8px;cursor:pointer;font-size:15px;text-align:center;font-weight:bold", label);
            var idx = ROWS.length + acts.length;
            e.addEventListener("click", function(){ sel = idx; fn(); });
            win.appendChild(e); acts.push({el: e, fn: fn}); return e;
        }
        act("▶ ひとつずつ 設定（A B X Y L R ZL ZR）", function(){ wiz = 0; status = ""; startCap(ROWS.findIndex(function(r){ return r.i === WIZ[0]; })); });
        swapBtn = act("", function(){ cfg.swap = !cfg.swap; save(); status = "スティックの 左右を " + (cfg.swap ? "入れかえました。" : "もとに もどしました。"); paint(); });
        act("↩ もとにもどす", reset);
        act("とじる", close);
        stEl = el("div", "text-align:center;font-size:13px;color:#ffd86b;margin-top:8px;min-height:1.4em"); win.appendChild(stEl);
        box.appendChild(win);
        box.addEventListener("click", function(e){ if(e.target === box) close(); });
        document.body.appendChild(box);
        window.addEventListener("keydown", onKey, true);
        paint(); raf = requestAnimationFrame(loop);
    }

    window.AREPadMap = {open: open, close: close, isDefault: isDefault, get: function(){ return {map: cfg.map.slice(), swap: cfg.swap}; }, reset: reset};
    // data-are-padmap を つけた ものを おすと、設定画面が ひらく（ゲームの タイトルに ボタンを 置くだけで つかえる）
    document.addEventListener("click", function(e){
        var t = e.target && e.target.closest && e.target.closest("[data-are-padmap]");
        if(t){ e.preventDefault(); open(); }
    }, true);
})();
