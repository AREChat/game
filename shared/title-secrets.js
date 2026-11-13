/* ARE タイトル画面の「ひみつ」100こ（全ゲーム共通・クラシックscript）
   タイトル画面で ボタンを 同時に おす・ながおしする・コマンドを 入れる・画面を さわる と、
   かくれた 演出（ひかり・おと・いろ・うごき）が 出ます。ゲームの 進み方には ぜんぜん かかわりません。
   ・どのゲームも「いま タイトル画面か？」を TitleSecrets.attach({title: function(){…}, host: "#title"}) で 教えるだけ
     （そのゲームで キーが「決定」に なっている ときは keys: {KeyZ: null, KeyV: "B"} のように つけかえる）
   ・キーボード／ゲームパッド（Switch プロコン）／タッチ・マウス に 対応（A・Enter・Space は つかわない → はじめるのを じゃましない）
   ・文字入力の中（名前のらん）では うごかない。タイトル以外では ぜんぶ 止まる
   ・止めたいとき：アドレスの うしろに ?secrets=0 を つける／ブラウザの記憶 are_secrets_off=1 ／ TitleSecrets.enable(false)
   ・音を消すとき：are_secrets_mute=1（ARE の「音」設定が ミュートでも 鳴らさない）
   ・「うごきを へらす」設定（are-calm）や OS の「視差効果を減らす」が オンなら、ゆれる・光る演出は ひかえめ
   ・このファイルは 自分で つくった 絵文字と CSS だけで できています（外部の絵・音は つかっていません） */
(function(){
    "use strict";
    if(window.TitleSecrets) return;

    // ---------- 設定・記録 ----------
    var LSF = "are_secrets_found_v1", LSOFF = "are_secrets_off", LSMUTE = "are_secrets_mute", LSDONE = "are_secrets_done_v1";
    function lsGet(k){ try{ return localStorage.getItem(k); }catch(_e){ return null; } }
    function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(_e){} }
    var enabled = lsGet(LSOFF) !== "1";
    try{ if(/[?&]secrets=0\b/.test(location.search)) enabled = false; }catch(_e){}
    var found = {};
    try{ var fo = JSON.parse(lsGet(LSF) || "[]"); for(var fi = 0; fi < fo.length; fi++) found[fo[fi]] = 1; }catch(_e){}
    var stats = {fired: {}, last: 0, via: "", count: 0, errors: []};

    // ---------- 入力の きめごと ----------
    // ひみつで つかう ボタン（A・Enter・Space は 「はじめる」と かさなるので つかわない）
    //   キーボード: ↑↓←→  Z=B  X=X  C=Y  Q=L  E=R  A=ZL  D=ZR  -=セレクト  ==スタート  1=左スティック押し  2=右スティック押し
    //   パッド(標準配置の番号): 0=B 2=Y 3=X 4=L 5=R 6=ZL 7=ZR 8=− 9=＋ 10=左押し 11=右押し 12〜15=十字
    var KEYMAP = {ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R", KeyZ: "B", KeyX: "X", KeyC: "Y", KeyQ: "L1", KeyE: "R1",
        KeyA: "L2", KeyD: "R2", Minus: "SEL", Equal: "ST", Digit1: "LS", Digit2: "RS", NumpadSubtract: "SEL", NumpadAdd: "ST"};
    var PADMAP = {0: "B", 2: "Y", 3: "X", 4: "L1", 5: "R1", 6: "L2", 7: "R2", 8: "SEL", 9: "ST", 10: "LS", 11: "RS", 12: "U", 13: "D", 14: "L", 15: "R"};

    // ---------- ひみつの 一覧（100こ）----------
    // t: seq=じゅんばんに おす / chord=同時に おす / hold=ながおし(3びょう) / mash=れんだ / touch=画面を さわる
    // fx: [しゅるい, ひきすう…] の 並び。しゅるいは p(つぶ) x(ゆれ) f(いろ) flash tint stripes rings light trail scan fw bolt parade
    var D = [];
    function S(t, p, name, fx, o){ D.push({id: D.length + 1, t: t, p: p, name: name, fx: fx, o: o || {}}); }
    // ---- じゅんばんに おす（41） ----
    S("seq", "U U D D L R L R B X", "ひみつのコマンド", [["p", "⭐✨🌟", {mode: "burst", n: 46}], ["flash", "#fff"]]);
    S("seq", "R D L U", "ぐるりん", [["x", "tsSpin", 1300]]);
    S("seq", "L D R U", "ぎゃくぐるり", [["x", "tsSpinR", 1300]]);
    S("seq", "U R D L Y U R D L", "うずまき", [["p", "✨💫", {mode: "spiral", n: 26}]]);
    S("seq", "R R R L L L", "ゆらゆら", [["x", "tsWobble", 2600]]);
    S("seq", "U U U D D D", "エレベーター", [["p", "🔼⬆️", {mode: "rise", n: 24}]]);
    S("seq", "L R L R L R", "ステップ", [["p", "👣", {mode: "pops", n: 22}]]);
    S("seq", "D D D D D", "どすん", [["x", "tsShake", 900], ["flash", "#000", 0.25]]);
    S("seq", "U U U U U", "ジャンプ", [["x", "tsBounce", 1400]]);
    S("seq", "L L R R X", "ふりふり", [["x", "tsJelly", 1800]]);
    S("seq", "X X Y Y", "ダブルパンチ", [["flash", "#fff"], ["p", "💥", {mode: "burst", n: 10, size: 46}]]);
    S("seq", "X Y X Y X Y", "ドラムロール", [["p", "🥁🎵", {mode: "pops", n: 26}]]);
    S("seq", "Y X B", "よくできました", [["p", "🌸", {mode: "fall", n: 40}], ["confetti", 60]]);
    S("seq", "B B B X", "まるまるまる", [["p", "⭕", {mode: "pops", n: 24, size: 40}]]);
    S("seq", "L1 R1 L1 R1", "こうごに", [["stripes", ["#ffd54a", "#ff7aa8"], 1]]);
    S("seq", "L2 R2 L2 R2", "ぱたぱた", [["parade", "🐾", {dir: 1, n: 8}]]);
    S("seq", "L1 L1 R1 R1 X", "ふたごのほし", [["p", "🌟", {mode: "burst", n: 16, size: 44}], ["rings", "#ffe27a", 3]]);
    S("seq", "U L1 D R1", "ふうりん", [["p", "🎐🍃", {mode: "rise", n: 22}]]);
    S("seq", "SEL ST SEL ST", "スイッチ", [["f", "invert(1)", 1800]]);
    S("seq", "ST ST ST", "スタートれんだ", [["flash", "#fff"], ["rings", "#7ad7ff", 2]]);
    S("seq", "SEL SEL SEL", "セレクトれんだ", [["scan", 3200]]);
    S("seq", "U D L R B", "ぐるっとじゅうじ", [["rings", "#ff8a8a", 2], ["rings", "#8ab4ff", 2]]);
    S("seq", "D D U U X Y", "ながれぼし", [["p", "🌠", {mode: "diag", n: 14, size: 40}]]);
    S("seq", "R R D D L L U U", "しかくのさんぽ", [["parade", "🐢", {dir: -1, n: 5}]]);
    S("seq", "U R R D L L", "ハートのうた", [["p", "💖💗💕", {mode: "fall", n: 36}]]);
    S("seq", "L R U D B", "そよかぜ", [["p", "🍃🍂", {mode: "side", n: 28, dir: 1}]]);
    S("seq", "B Y X Y B", "ゆきのよる", [["f", "brightness(.6) hue-rotate(190deg)", 4200], ["p", "❄️", {mode: "fall", n: 54}]]);
    S("seq", "X B X B", "おりがみ", [["confetti", 90]]);
    S("seq", "U U R R D D L L", "うずうず", [["x", "tsSquish", 1500]]);
    S("seq", "L1 X R1 Y", "まほうじん", [["rings", "#b58cff", 3], ["p", "✨", {mode: "burst", n: 30}]]);
    S("seq", "R2 L2 R2 L2 X", "かみなり", [["bolt"]]);
    S("seq", "U L1 U R1 D", "ひこうき", [["parade", "✈️", {dir: 1, n: 3, size: 54}]]);
    S("seq", "D L U R B", "たいこ", [["p", "🥁", {mode: "pops", n: 12, size: 56}]]);
    S("seq", "SEL U ST D", "ふしぎなじゅもん", [["stripes", ["#7a5cff", "#35d0ba"], -1]]);
    S("seq", "LS RS LS RS", "スティックたいそう", [["x", "tsWobble", 2600], ["p", "💫", {mode: "spiral", n: 18}]]);
    S("seq", "R L1 L R1", "オーロラ", [["tint", "linear-gradient(180deg,rgba(60,255,160,.55),rgba(150,90,255,.5))", 4000]]);
    S("seq", "Y Y B B X X", "にじ", [["f", "hue-rotate(360deg) saturate(1.6)", 3600, true]]);
    S("seq", "U X D Y L B R", "ななつぼし", [["p", "⭐", {mode: "burst", n: 7, size: 64}]]);
    S("seq", "R1 U L1 D X", "よぞら", [["f", "brightness(.55) saturate(1.3)", 4200], ["p", "✨🌙", {mode: "fall", n: 26, slow: 1}]]);
    S("seq", "L2 U R2 D Y", "ふうせん", [["p", "🎈", {mode: "rise", n: 22, size: 46}]]);
    S("seq", "Y B Y B X", "おまつり", [["p", "🎆🎇", {mode: "pops", n: 18, size: 52}], ["parade", "🏮", {dir: 1, n: 6, size: 40}]]);
    // ---- 同時に おす（26） ----
    S("chord", "L1 R1", "ダブルタップ", [["flash", "#fff"], ["rings", "#ffffff", 2]]);
    S("chord", "L2 R2", "ふたつのおと", [["p", "🎵🎶", {mode: "burst", n: 24}]]);
    S("chord", "X Y", "ばんざい", [["confetti", 90]]);
    S("chord", "B X", "ぴかぴか", [["p", "✨", {mode: "pops", n: 44}]]);
    S("chord", "B Y", "ぽんぽん", [["p", "🎉", {mode: "pops", n: 22, size: 44}]]);
    S("chord", "SEL ST", "タイムスリップ", [["f", "sepia(1) contrast(1.1)", 3400]]);
    S("chord", "U D", "ぺっちゃんこ", [["x", "tsSquish", 1500]]);
    S("chord", "L R", "ひっぱりだこ", [["x", "tsStretch", 1500]]);
    S("chord", "U L", "ななめうえ", [["x", "tsTilt", 2200]]);
    S("chord", "D R", "ななめした", [["x", "tsTiltR", 2200]]);
    S("chord", "L1 L2", "ひだりがわ", [["p", "◀️", {mode: "side", n: 16, dir: -1}]]);
    S("chord", "R1 R2", "みぎがわ", [["p", "▶️", {mode: "side", n: 16, dir: 1}]]);
    S("chord", "L1 R2", "たすきがけ", [["stripes", ["#ff9a3c", "#ffffff"], 1]]);
    S("chord", "L2 R1", "たすきがけ・うら", [["stripes", ["#3c9aff", "#ffffff"], -1]]);
    S("chord", "R1 ST X", "さんにんのちから", [["rings", "#ff9ad5", 3], ["rings", "#9ad5ff", 3]]);
    S("chord", "L2 SEL Y", "はなび", [["fw"]]);
    S("chord", "B L R2", "ぞろめ", [["p", "💎", {mode: "burst", n: 18, size: 40}]]);
    S("chord", "L1 U X", "まいごのほし", [["p", "🌟", {mode: "fall", n: 12, slow: 1, size: 44}]]);
    S("chord", "D Y R1", "ふかいうみ", [["f", "hue-rotate(160deg) brightness(.75)", 4200], ["p", "🐟🐠🫧", {mode: "rise", n: 26}]]);
    S("chord", "LS RS", "ぎゅっ", [["f", "blur(4px)", 1500], ["x", "tsZoom", 1500]]);
    S("chord", "SEL X", "かげぼうし", [["f", "brightness(.35)", 2600]]);
    S("chord", "ST Y", "あさやけ", [["tint", "linear-gradient(0deg,rgba(255,150,60,.55),rgba(255,120,190,.25) 60%,rgba(255,255,255,0))", 4200]]);
    S("chord", "X L2 ST D", "よっつのちから", [["tint", "rgba(255,255,255,.0)", 3000, "disco"]]);
    S("chord", "B L1", "あしあと", [["trail", "👣", 6000]]);
    S("chord", "Y R2", "ひかりのつぶ", [["light", 6000]]);
    S("chord", "U R", "みぎうえ", [["p", "↗️", {mode: "diag", n: 14, size: 40}]]);
    // ---- ながおし 3びょう（14） ----
    S("hold", "U", "ぐんぐん", [["p", "🌱🌿", {mode: "rise", n: 26}]]);
    S("hold", "D", "もぐもぐ", [["p", "🍙🍰🍎", {mode: "fall", n: 28, size: 40}]]);
    S("hold", "L", "ひだりまき", [["x", "tsSpinR", 2000]]);
    S("hold", "R", "みぎまき", [["x", "tsSpin", 2000]]);
    S("hold", "X", "ためる", [["rings", "#ffd24a", 4, true], ["p", "💥✨", {mode: "burst", n: 26}]]);
    S("hold", "Y", "ほしあつめ", [["p", "⭐", {mode: "in", n: 22, size: 40}]]);
    S("hold", "B", "いいこいいこ", [["p", "💗", {mode: "rise", n: 22, size: 40}]]);
    S("hold", "L1", "ひだりのつばさ", [["parade", "🕊️", {dir: -1, n: 5, size: 50}]]);
    S("hold", "R1", "みぎのつばさ", [["parade", "🕊️", {dir: 1, n: 5, size: 50}]]);
    S("hold", "L2", "ふかいいき", [["f", "brightness(.5)", 3000], ["p", "🫧", {mode: "rise", n: 20}]]);
    S("hold", "R2", "たかいいき", [["f", "brightness(1.5) saturate(1.2)", 2800], ["flash", "#fff", 0.5]]);
    S("hold", "SEL", "しずかなよる", [["light", 5000]]);
    S("hold", "ST", "めざめ", [["flash", "#fff"], ["p", "☀️", {mode: "burst", n: 8, size: 64}]]);
    S("hold", "LS", "ぐるぐるスティック", [["x", "tsSpin", 2600], ["p", "🌀", {mode: "spiral", n: 14}]]);
    // ---- れんだ（9） ----
    S("mash", "B 10", "れんだめいじん", [["confetti", 70]], {win: 2200});
    S("mash", "X 10", "ばばばば", [["p", "💥", {mode: "pops", n: 22, size: 48}]], {win: 2200});
    S("mash", "Y 10", "ぴこぴこ", [["p", "🎶", {mode: "pops", n: 26}]], {win: 2200});
    S("mash", "L1 8", "ぱちぱち", [["p", "👏", {mode: "pops", n: 22, size: 44}]], {win: 2200});
    S("mash", "R1 8", "ちょきちょき", [["p", "✂️", {mode: "pops", n: 20, size: 44}]], {win: 2200});
    S("mash", "L2 8", "とんとん", [["p", "🔔", {mode: "pops", n: 20, size: 44}]], {win: 2200});
    S("mash", "R2 8", "こんこん", [["p", "🔑", {mode: "pops", n: 20, size: 44}]], {win: 2200});
    S("mash", "LS 8", "かちかち", [["p", "🔘", {mode: "pops", n: 22, size: 40}]], {win: 2200});
    S("mash", "RS 8", "くるくるくる", [["p", "🌀", {mode: "pops", n: 22, size: 44}]], {win: 2200});
    // ---- 画面を さわる（10）：ゆびで・マウスで ----
    S("touch", "two", "ふたりでぎゅっ", [["rings", "#ffb3d1", 3], ["p", "💞", {mode: "rise", n: 18, size: 40}]]);
    S("touch", "three", "さんにんでぎゅっ", [["rings", "#b3ffd1", 3], ["p", "🌈", {mode: "pops", n: 10, size: 60}]]);
    S("touch", "long:C", "まんなかのひみつ", [["p", "🔮✨", {mode: "burst", n: 24}], ["rings", "#c9a8ff", 3]]);
    S("touch", "long:TL", "ひだりうえのひみつ", [["p", "🌸", {mode: "diag", n: 16, size: 44}]]);
    S("touch", "long:TR", "みぎうえのひみつ", [["p", "🍁", {mode: "diag", n: 16, size: 44, flip: 1}]]);
    S("touch", "long:BL", "ひだりしたのひみつ", [["p", "🫧", {mode: "rise", n: 22, size: 42}]]);
    S("touch", "long:BR", "みぎしたのひみつ", [["p", "🍬", {mode: "rise", n: 22, size: 42}]]);
    S("touch", "tap:TL TR BR BL", "かどめぐり", [["fw"], ["rings", "#ffffff", 2]]);
    S("touch", "tap:TL TR BL BR", "ゼットのひみつ", [["p", "⚡", {mode: "diag", n: 12, size: 46}], ["bolt"]]);
    S("touch", "tap:C C C C C C C", "なないろ", [["tint", "linear-gradient(90deg,rgba(255,80,80,.35),rgba(255,200,60,.35),rgba(80,220,120,.35),rgba(70,150,255,.35),rgba(180,90,255,.35))", 3800]]);

    // ---------- 画面の しくみ ----------
    var cfg = {title: function(){ return true; }, host: null}, attached = false;
    var layerEl = null, styleEl = null, timers = [], cleanups = [], hostMem = [];
    function calm(){
        try{ if(window.AREsettings && window.AREsettings().calm) return true; }catch(_e){}
        try{ return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }catch(_e){ return false; }
    }
    function isTitle(){ try{ return !!cfg.title(); }catch(_e){ return false; } }
    var CSS = "@keyframes tsSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes tsSpinR{from{transform:rotate(0)}to{transform:rotate(-360deg)}}" +
        "@keyframes tsShake{0%,100%{transform:translate(0,0)}15%{transform:translate(-12px,6px)}30%{transform:translate(10px,-8px)}45%{transform:translate(-8px,-4px)}60%{transform:translate(8px,6px)}75%{transform:translate(-4px,2px)}}" +
        "@keyframes tsWobble{0%,100%{transform:rotate(0)}20%{transform:rotate(3deg) scale(1.02)}40%{transform:rotate(-3deg)}60%{transform:rotate(2deg) scale(1.02)}80%{transform:rotate(-2deg)}}" +
        "@keyframes tsBounce{0%,100%{transform:translateY(0)}20%{transform:translateY(-46px)}40%{transform:translateY(0)}60%{transform:translateY(-26px)}80%{transform:translateY(0)}}" +
        "@keyframes tsSquish{0%,100%{transform:scale(1,1)}40%{transform:scale(1.14,.82)}70%{transform:scale(.94,1.08)}}" +
        "@keyframes tsStretch{0%,100%{transform:scale(1,1)}50%{transform:scale(1.18,.95)}}" +
        "@keyframes tsJelly{0%,100%{transform:scale(1,1)}25%{transform:scale(1.1,.92)}50%{transform:scale(.94,1.06)}75%{transform:scale(1.04,.98)}}" +
        "@keyframes tsTilt{0%,100%{transform:rotate(0)}30%,70%{transform:rotate(-5deg)}}@keyframes tsTiltR{0%,100%{transform:rotate(0)}30%,70%{transform:rotate(5deg)}}" +
        "@keyframes tsZoom{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}" +
        "#ts-layer{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99990;pointer-events:none;overflow:hidden;contain:layout paint}" +
        "#ts-layer *{pointer-events:none;box-sizing:border-box}" +
        "#ts-banner{position:absolute;left:50%;top:10px;transform:translateX(-50%);max-width:92vw;padding:8px 16px;border-radius:999px;background:rgba(10,14,40,.82);color:#fff;border:2px solid #ffd86b;font:700 16px/1.3 system-ui,sans-serif;text-align:center;white-space:nowrap;box-shadow:0 4px 18px rgba(0,0,0,.45)}" +
        "#ts-banner small{display:block;font-weight:400;font-size:12px;opacity:.85}";
    function ensureStyle(){
        if(styleEl && styleEl.parentNode) return;
        styleEl = document.createElement("style"); styleEl.id = "ts-style"; styleEl.textContent = CSS; (document.head || document.documentElement).appendChild(styleEl);
    }
    function layer(){
        if(layerEl && layerEl.parentNode) return layerEl;
        ensureStyle(); layerEl = document.createElement("div"); layerEl.id = "ts-layer"; layerEl.setAttribute("aria-hidden", "true");
        (document.body || document.documentElement).appendChild(layerEl); return layerEl;
    }
    function el(css, txt, parent){
        var e = document.createElement("div"); e.style.cssText = css; if(txt != null) e.textContent = txt; (parent || layer()).appendChild(e); return e;
    }
    function later(fn, ms){ var h = setTimeout(function(){ try{ fn(); }catch(err){ stats.errors.push(String(err && err.message || err)); } }, ms); timers.push(h); return h; }
    function rnd(a, b){ return a + Math.random() * (b - a); }
    function host(){
        var h = null;
        try{ var c = cfg.host; if(typeof c === "function") h = c(); else if(typeof c === "string") h = document.querySelector(c); }catch(_e){}
        return h || document.body;
    }
    // 本物の 見た目を いじる 変更は ぜんぶ ここに 記録して、あとで かならず もとにもどす
    function hostSet(h, prop, val){
        var rec = null; for(var i = 0; i < hostMem.length; i++) if(hostMem[i].h === h && hostMem[i].p === prop){ rec = hostMem[i]; break; }
        if(!rec){ rec = {h: h, p: prop, v: h.style[prop]}; hostMem.push(rec); }
        h.style[prop] = val;
    }
    function hostRestore(){
        for(var i = 0; i < hostMem.length; i++){ try{ hostMem[i].h.style[hostMem[i].p] = hostMem[i].v; }catch(_e){} }
        hostMem = [];
    }
    function cancelAll(){
        for(var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = [];
        for(var j = 0; j < cleanups.length; j++){ try{ cleanups[j](); }catch(_e){} } cleanups = [];
        hostRestore();
        if(layerEl){ layerEl.textContent = ""; }
    }

    // ---------- 演出 ----------
    var P_SIZE = 30, COLORS = ["#ff6b6b", "#ffd24a", "#6bd66b", "#4aa8ff", "#c07bff", "#ff8fd0", "#ffffff"];
    function chars(s){ return Array.from(s); }
    function anim(e, kf, opt){
        try{ var a = e.animate(kf, opt); a.onfinish = function(){ if(e.parentNode) e.parentNode.removeChild(e); }; return a; }
        catch(_e){ later(function(){ if(e.parentNode) e.parentNode.removeChild(e); }, (opt && opt.duration) || 2000); }
    }
    var FX = {
        p: function(cs, o){
            var set = chars(cs), n = Math.min(o.n || 30, 70), W = innerWidth, H = innerHeight, mode = o.mode || "fall", sz = o.size || P_SIZE, slow = o.slow ? 1.7 : 1;
            if(calm()) n = Math.ceil(n / 2);
            for(var i = 0; i < n; i++){
                var s = sz * rnd(.7, 1.25), c = set[i % set.length], d0 = rnd(0, 1400), x = rnd(0, W - s), y = rnd(0, H - s), dur = rnd(2200, 3600) * slow;
                var e = el("position:absolute;left:" + x + "px;top:" + y + "px;font-size:" + s + "px;line-height:1;opacity:0;will-change:transform,opacity", c), kf, r = rnd(-60, 60);
                if(mode === "fall") kf = [{transform: "translate(0," + (-y - 60) + "px) rotate(0)", opacity: 0}, {opacity: 1, offset: .1}, {transform: "translate(" + rnd(-60, 60) + "px," + (H - y + 60) + "px) rotate(" + r + "deg)", opacity: 1, offset: .9}, {transform: "translate(" + rnd(-60, 60) + "px," + (H - y + 80) + "px) rotate(" + r + "deg)", opacity: 0}];
                else if(mode === "rise") kf = [{transform: "translate(0," + (H - y + 60) + "px) rotate(0)", opacity: 0}, {opacity: 1, offset: .12}, {transform: "translate(" + rnd(-60, 60) + "px," + (-y - 40) + "px) rotate(" + r + "deg)", opacity: 1, offset: .9}, {transform: "translate(" + rnd(-60, 60) + "px," + (-y - 80) + "px)", opacity: 0}];
                else if(mode === "burst"){ var a = rnd(0, 6.283), rr = rnd(.25, .62) * Math.min(W, H); e.style.left = (W / 2 - s / 2) + "px"; e.style.top = (H / 2 - s / 2) + "px"; kf = [{transform: "translate(0,0) scale(.2)", opacity: 0}, {opacity: 1, offset: .15}, {transform: "translate(" + Math.cos(a) * rr + "px," + Math.sin(a) * rr + "px) scale(1) rotate(" + r + "deg)", opacity: 1, offset: .75}, {transform: "translate(" + Math.cos(a) * rr * 1.1 + "px," + (Math.sin(a) * rr * 1.1 + 40) + "px) scale(.8)", opacity: 0}]; dur = rnd(1500, 2400); }
                else if(mode === "in"){ var a2 = rnd(0, 6.283), r2 = Math.max(W, H) * .6; e.style.left = (W / 2 - s / 2) + "px"; e.style.top = (H / 2 - s / 2) + "px"; kf = [{transform: "translate(" + Math.cos(a2) * r2 + "px," + Math.sin(a2) * r2 + "px) scale(1)", opacity: 0}, {opacity: 1, offset: .2}, {transform: "translate(0,0) scale(.3)", opacity: 1, offset: .9}, {transform: "translate(0,0) scale(.1)", opacity: 0}]; dur = rnd(1800, 3000); }
                else if(mode === "pops"){ kf = [{transform: "scale(0) rotate(" + r + "deg)", opacity: 0}, {transform: "scale(1.3) rotate(" + (r / 2) + "deg)", opacity: 1, offset: .3}, {transform: "scale(1) rotate(0)", opacity: 1, offset: .7}, {transform: "scale(0)", opacity: 0}]; dur = rnd(900, 1500); d0 = rnd(0, 1800); }
                else if(mode === "side"){ var dir = o.dir || 1, yy = rnd(H * .1, H * .85); e.style.top = yy + "px"; e.style.left = "0px"; kf = [{transform: "translate(" + (dir > 0 ? -80 : W + 80) + "px,0) rotate(0)", opacity: 0}, {opacity: 1, offset: .1}, {transform: "translate(" + (dir > 0 ? W + 40 : -40) + "px," + rnd(-60, 60) + "px) rotate(" + r + "deg)", opacity: 1, offset: .9}, {opacity: 0}]; dur = rnd(1800, 3000); }
                else if(mode === "diag"){ var fl = o.flip ? -1 : 1; e.style.left = (fl > 0 ? 0 : W - s) + "px"; e.style.top = "0px"; var sy = rnd(-.2, .6) * H; kf = [{transform: "translate(" + (fl > 0 ? -60 : 60) + "px," + sy + "px)", opacity: 0}, {opacity: 1, offset: .15}, {transform: "translate(" + fl * W * .9 + "px," + (sy + H * .6) + "px) rotate(" + r + "deg)", opacity: 1, offset: .85}, {opacity: 0}]; dur = rnd(1400, 2400); }
                else if(mode === "spiral"){ e.style.left = (W / 2 - s / 2) + "px"; e.style.top = (H / 2 - s / 2) + "px"; var a0 = (i / n) * 6.283 * 2, kfs = [], K = 10; for(var k = 0; k <= K; k++){ var t = k / K, rad = t * Math.min(W, H) * .5, an = a0 + t * 9; kfs.push({transform: "translate(" + Math.cos(an) * rad + "px," + Math.sin(an) * rad + "px) scale(" + (.3 + t) + ")", opacity: k === 0 ? 0 : (k === K ? 0 : 1)}); } kf = kfs; dur = 2600; d0 = i * 40; }
                else kf = [{opacity: 0}, {opacity: 1}, {opacity: 0}];
                anim(e, kf, {duration: dur, delay: d0, easing: "ease-in-out", fill: "both"});
            }
        },
        confetti: function(n){
            n = Math.min(n || 60, 100); if(calm()) n = Math.ceil(n / 2);
            for(var i = 0; i < n; i++){
                var w = rnd(7, 13), x = rnd(0, innerWidth), e = el("position:absolute;left:" + x + "px;top:-20px;width:" + w + "px;height:" + w * 1.5 + "px;background:" + COLORS[i % COLORS.length] + ";opacity:0;will-change:transform");
                anim(e, [{transform: "translate(0,0) rotate(0)", opacity: 1}, {transform: "translate(" + rnd(-90, 90) + "px," + (innerHeight + 40) + "px) rotate(" + rnd(360, 900) + "deg)", opacity: 1}], {duration: rnd(1800, 3400), delay: rnd(0, 900), easing: "ease-in", fill: "both"});
            }
        },
        x: function(name, ms){
            if(calm()) return; var h = host(); hostSet(h, "animation", name + " " + (ms || 1500) + "ms ease-in-out 1");
            later(function(){ hostRestore(); }, (ms || 1500) + 120);
        },
        f: function(css, ms, cycle){
            var h = host(); hostSet(h, "transition", "filter .45s"); hostSet(h, "filter", css);
            if(cycle){ hostSet(h, "filter", "hue-rotate(0deg) saturate(1.6)"); var t0 = Date.now(), iv = setInterval(function(){ var d = (Date.now() - t0) / (ms || 3000); h.style.filter = "hue-rotate(" + Math.round(360 * d) + "deg) saturate(1.6)"; }, 60); cleanups.push(function(){ clearInterval(iv); }); }
            later(function(){ hostRestore(); }, ms || 3000);
        },
        flash: function(color, a){
            var n = calm() ? 1 : 2; for(var i = 0; i < n; i++){ var e = el("position:absolute;inset:0;background:" + (color || "#fff") + ";opacity:0"); anim(e, [{opacity: 0}, {opacity: a || .85}, {opacity: 0}], {duration: 420, delay: i * 520}); }
        },
        tint: function(bg, ms, kind){
            var e = el("position:absolute;inset:0;background:" + bg + ";opacity:0");
            if(kind === "disco"){ var cols = ["rgba(255,60,120,.35)", "rgba(255,210,60,.35)", "rgba(60,220,140,.35)", "rgba(60,150,255,.35)", "rgba(190,90,255,.35)"], i = 0; e.style.opacity = "1"; var iv = setInterval(function(){ e.style.background = cols[i++ % cols.length]; }, 420); cleanups.push(function(){ clearInterval(iv); }); later(function(){ e.style.opacity = "0"; }, ms || 3000); e.style.transition = "opacity .5s"; }
            else anim(e, [{opacity: 0}, {opacity: 1, offset: .2}, {opacity: 1, offset: .8}, {opacity: 0}], {duration: ms || 3500});
        },
        stripes: function(cols, dir){
            var e = el("position:absolute;inset:-60px;opacity:0;background:repeating-linear-gradient(" + (dir > 0 ? 45 : -45) + "deg," + cols[0] + " 0 26px," + cols[1] + " 26px 52px)");
            anim(e, [{opacity: 0, transform: "translate(0,0)"}, {opacity: .3, offset: .2}, {opacity: .3, offset: .8}, {opacity: 0, transform: "translate(" + (dir > 0 ? 60 : -60) + "px,60px)"}], {duration: 3200});
        },
        rings: function(color, n, inward){
            n = n || 3; for(var i = 0; i < n; i++){
                var s = Math.min(innerWidth, innerHeight) * .9, e = el("position:absolute;left:" + (innerWidth / 2 - s / 2) + "px;top:" + (innerHeight / 2 - s / 2) + "px;width:" + s + "px;height:" + s + "px;border-radius:50%;border:6px solid " + color + ";opacity:0");
                anim(e, inward ? [{transform: "scale(1.3)", opacity: 0}, {opacity: .9, offset: .3}, {transform: "scale(0)", opacity: 0}] : [{transform: "scale(0)", opacity: .9}, {transform: "scale(1.25)", opacity: 0}], {duration: 1500, delay: i * 420, easing: "ease-out"});
            }
        },
        scan: function(ms){
            var e = el("position:absolute;inset:0;opacity:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 2px,rgba(0,0,0,0) 2px 5px)");
            anim(e, [{opacity: 0}, {opacity: 1, offset: .1}, {opacity: 1, offset: .9}, {opacity: 0}], {duration: ms || 3000});
        },
        bolt: function(){
            var n = calm() ? 1 : 3; for(var i = 0; i < n; i++){ var e = el("position:absolute;inset:0;background:#fff;opacity:0"); anim(e, [{opacity: 0}, {opacity: .9, offset: .08}, {opacity: .1, offset: .3}, {opacity: .7, offset: .45}, {opacity: 0}], {duration: 700, delay: i * 900}); }
            var b = el("position:absolute;left:" + rnd(30, 70) + "%;top:-4%;font-size:" + Math.round(innerHeight * .8) + "px;line-height:1;opacity:0;transform:translateX(-50%)", "⚡");
            anim(b, [{opacity: 0}, {opacity: 1, offset: .1}, {opacity: 0, offset: .5}, {opacity: 0}], {duration: 900});
        },
        fw: function(){
            var W = innerWidth, H = innerHeight;
            for(var b = 0; b < 5; b++){
                var cx = rnd(W * .15, W * .85), cy = rnd(H * .15, H * .55), col = COLORS[b % COLORS.length], d0 = b * 450;
                for(var i = 0; i < 16; i++){
                    var a = (i / 16) * 6.283, r = rnd(70, 130), e = el("position:absolute;left:" + cx + "px;top:" + cy + "px;width:9px;height:9px;border-radius:50%;background:" + col + ";opacity:0");
                    anim(e, [{transform: "translate(0,0)", opacity: 1}, {transform: "translate(" + Math.cos(a) * r + "px," + Math.sin(a) * r + "px)", opacity: 1, offset: .6}, {transform: "translate(" + Math.cos(a) * r * 1.1 + "px," + (Math.sin(a) * r + 50) + "px)", opacity: 0}], {duration: 1100, delay: d0, easing: "ease-out", fill: "both"});
                }
            }
        },
        parade: function(c, o){
            var n = o.n || 5, s = o.size || 44, dir = o.dir || 1, W = innerWidth, H = innerHeight;
            for(var i = 0; i < n; i++){
                var y = H - s - 14 - (i % 2) * 6, e = el("position:absolute;left:0;top:" + y + "px;font-size:" + s + "px;line-height:1;opacity:0", c);
                anim(e, [{transform: "translateX(" + (dir > 0 ? -80 : W + 80) + "px)", opacity: 1}, {transform: "translateX(" + (dir > 0 ? W + 40 : -40) + "px)", opacity: 1}], {duration: 3600, delay: i * 520, fill: "both"});
            }
        },
        light: function(ms){
            var e = el("position:absolute;inset:0;background:radial-gradient(circle 120px at 50% 50%,rgba(0,0,0,0) 0,rgba(0,0,0,.88) 100%)"), mv = function(ev){ e.style.background = "radial-gradient(circle 120px at " + ev.clientX + "px " + ev.clientY + "px,rgba(0,0,0,0) 0,rgba(0,0,0,.88) 100%)"; };
            window.addEventListener("pointermove", mv, true); cleanups.push(function(){ window.removeEventListener("pointermove", mv, true); });
            e.style.transition = "opacity .5s"; later(function(){ e.style.opacity = "0"; }, (ms || 5000) - 500);
        },
        trail: function(c, ms){
            var last = 0, mv = function(ev){
                var now = Date.now(); if(now - last < 60) return; last = now;
                var e = el("position:absolute;left:" + (ev.clientX - 14) + "px;top:" + (ev.clientY - 14) + "px;font-size:28px;line-height:1;opacity:0", c);
                anim(e, [{transform: "translateY(0) scale(.6)", opacity: 1}, {transform: "translateY(-30px) scale(1.2)", opacity: 0}], {duration: 900});
            };
            window.addEventListener("pointermove", mv, true); cleanups.push(function(){ window.removeEventListener("pointermove", mv, true); });
            // マウスが なくても 見えるように、まず まんなかに 足あとを いくつか 出す
            for(var i = 0; i < 6; i++){ var e = el("position:absolute;left:" + (innerWidth / 2 - 100 + i * 36) + "px;top:" + (innerHeight / 2 + (i % 2) * 24) + "px;font-size:28px;line-height:1;opacity:0", c); anim(e, [{opacity: 0}, {opacity: 1, offset: .3}, {opacity: 0}], {duration: 1600, delay: i * 220}); }
            later(function(){ window.removeEventListener("pointermove", mv, true); }, ms || 6000);
        }
    };

    // ---------- 音（みじかい ジングル。WebAudio だけ）----------
    var actx = null, SCALE = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880, 988, 1047];
    function jingle(id){
        if(lsGet(LSMUTE) === "1") return;
        try{ if(window.AREsettings && window.AREsettings().mute) return; }catch(_e){}
        try{
            var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
            if(!actx) actx = new AC(); if(actx.state === "suspended" && actx.resume) actx.resume();
            var t = actx.currentTime + .02, seed = id * 7919 % 9973, n = 4 + (id % 3);
            for(var i = 0; i < n; i++){
                seed = (seed * 1103515245 + 12345) & 0x7fffffff; var f = SCALE[(seed >> 8) % SCALE.length];
                var o = actx.createOscillator(), g = actx.createGain(); o.type = i === n - 1 ? "sine" : "triangle"; o.frequency.value = f;
                g.gain.setValueAtTime(0, t + i * .09); g.gain.linearRampToValueAtTime(.05, t + i * .09 + .01); g.gain.exponentialRampToValueAtTime(.0008, t + i * .09 + (i === n - 1 ? .5 : .16));
                o.connect(g); g.connect(actx.destination); o.start(t + i * .09); o.stop(t + i * .09 + (i === n - 1 ? .55 : .2));
            }
        }catch(_e){}
    }

    // ---------- ふやす・出す ----------
    function foundCount(){ var c = 0; for(var k in found) c++; return c; }
    function banner(def){
        var b = el("", null); b.id = "ts-banner"; b.innerHTML = ""; b.appendChild(document.createTextNode("✨ ひみつ #" + def.id + "「" + def.name + "」"));
        var sm = document.createElement("small"); sm.textContent = "みつけた ひみつ： " + foundCount() + " / " + D.length; b.appendChild(sm);
        anim(b, [{opacity: 0, transform: "translate(-50%,-14px)"}, {opacity: 1, transform: "translate(-50%,0)", offset: .12}, {opacity: 1, transform: "translate(-50%,0)", offset: .85}, {opacity: 0, transform: "translate(-50%,-8px)"}], {duration: 2800});
    }
    var lastFire = 0;
    function run(def, via){
        cancelAll();
        banner(def);
        for(var i = 0; i < def.fx.length; i++){
            var f = def.fx[i], k = f[0];
            try{
                if(k === "p") FX.p(f[1], f[2] || {}); else if(k === "confetti") FX.confetti(f[1]); else if(k === "x") FX.x(f[1], f[2]);
                else if(k === "f") FX.f(f[1], f[2], f[3]); else if(k === "flash") FX.flash(f[1], f[2]); else if(k === "tint") FX.tint(f[1], f[2], f[3]);
                else if(k === "stripes") FX.stripes(f[1], f[2]); else if(k === "rings") FX.rings(f[1], f[2], f[3]); else if(k === "scan") FX.scan(f[1]);
                else if(k === "bolt") FX.bolt(); else if(k === "fw") FX.fw(); else if(k === "parade") FX.parade(f[1], f[2] || {});
                else if(k === "light") FX.light(f[1]); else if(k === "trail") FX.trail(f[1], f[2]);
            }catch(err){ stats.errors.push(def.id + ":" + k + ":" + String(err && err.message || err)); }
        }
        jingle(def.id);
        later(function(){ cancelAll(); }, 7500);   // どんな 演出も 7.5びょうで ぜんぶ かたづく
    }
    function fire(id, via, force){
        if(!enabled && !force) return false;
        var def = D[id - 1]; if(!def) return false;
        var now = Date.now(); if(!force && now - lastFire < 500) return false; lastFire = now;
        seqBuf = [];   // どれかの ひみつが 出たら、じゅんばんの 記録は まっさらに もどす
        stats.fired[id] = (stats.fired[id] || 0) + 1; stats.last = id; stats.via = via || ""; stats.count++;
        if(!found[id]){ found[id] = 1; var arr = []; for(var k in found) arr.push(+k); lsSet(LSF, JSON.stringify(arr)); }
        try{ run(def, via); }catch(err){ stats.errors.push(id + ":" + String(err && err.message || err)); }
        try{ window.dispatchEvent(new CustomEvent("are-secret", {detail: {id: id, name: def.name, via: via || "", found: foundCount()}})); }catch(_e){}
        if(foundCount() >= D.length && !lsGet(LSDONE)){
            lsSet(LSDONE, "1");
            later(function(){ FX.fw(); FX.confetti(100); var b = el("position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);padding:14px 22px;border-radius:18px;background:rgba(10,14,40,.9);color:#ffe27a;border:3px solid #ffd86b;font:800 22px/1.4 system-ui,sans-serif;text-align:center", "🎊 ぜんぶの ひみつを みつけた！ 🎊"); anim(b, [{opacity: 0}, {opacity: 1, offset: .15}, {opacity: 1, offset: .85}, {opacity: 0}], {duration: 3500}); }, 1200);
        }
        return true;
    }

    // ---------- 入力の しらべ ----------
    var down = {};             // 出どころ → ボタン名
    var SLOW = 1;   // テスト用：画面が とても おそい 環境で、れんだ・タップの 制限時間を のばす（ふだんは 1）
    var seqBuf = [], seqT = 0, pressTimes = {}, chordT = 0, holdT = 0, chordDone = false, holdDone = false;
    var seqDefs = [], chordMap = {}, holdMap = {}, mashDefs = {}, touchDefs = {long: {}, tap: [], two: 0, three: 0};
    D.forEach(function(d){
        if(d.t === "seq") seqDefs.push({id: d.id, p: d.p.split(" ")});
        else if(d.t === "chord") chordMap[d.p.split(" ").sort().join("+")] = d.id;
        else if(d.t === "hold") holdMap[d.p] = d.id;
        else if(d.t === "mash"){ var a = d.p.split(" "); mashDefs[a[0]] = {id: d.id, n: +a[1], win: d.o.win || 2200}; }
        else if(d.t === "touch"){
            if(d.p === "two") touchDefs.two = d.id; else if(d.p === "three") touchDefs.three = d.id;
            else if(d.p.indexOf("long:") === 0) touchDefs.long[d.p.slice(5)] = d.id;
            else if(d.p.indexOf("tap:") === 0) touchDefs.tap.push({id: d.id, p: d.p.slice(4).split(" ")});
        }
    });
    function setKey(){ var o = {}, a = []; for(var s in down){ if(!o[down[s]]){ o[down[s]] = 1; a.push(down[s]); } } return a.sort().join("+"); }
    function setSize(){ var k = setKey(); return k ? k.split("+").length : 0; }
    function onPress(tok){
        var now = Date.now();
        // じゅんばん
        if(now - seqT > 1800 * SLOW) seqBuf = []; seqT = now; seqBuf.push(tok); if(seqBuf.length > 12) seqBuf.shift();
        for(var i = 0; i < seqDefs.length; i++){
            var p = seqDefs[i].p, L = p.length; if(seqBuf.length < L) continue;
            var ok = true; for(var j = 0; j < L; j++) if(seqBuf[seqBuf.length - L + j] !== p[j]){ ok = false; break; }
            if(ok){ seqBuf = []; fire(seqDefs[i].id, "seq"); return; }
        }
        // れんだ
        var md = mashDefs[tok];
        if(md){ var pt = pressTimes[tok] = (pressTimes[tok] || []).filter(function(t){ return now - t <= md.win * SLOW; }); pt.push(now); if(pt.length >= md.n){ pressTimes[tok] = []; fire(md.id, "mash"); return; } }
    }
    var setSince = 0;
    function checkChord(minMs){
        var k = setKey(); if(!k || k.indexOf("+") < 0 || !chordMap[k] || chordDone || !isTitle()) return;
        if(Date.now() - setSince >= minMs){ chordDone = true; fire(chordMap[k], "chord"); }
    }
    function checkHold(){
        var k = setKey(); if(!k || !holdMap[k] || holdDone || !isTitle()) return;
        if(Date.now() - setSince >= 3000){ holdDone = true; fire(holdMap[k], "hold"); }
    }
    // 画面が重くて「はなした」知らせが まだ とどいて いない ときは、ながおし・同時おしの 判定を すこし まつ（ちがう ひみつが 出ないように）
    function guarded(fn){ return function g(){ try{ if(navigator.scheduling && navigator.scheduling.isInputPending && navigator.scheduling.isInputPending()){ setTimeout(g, 40); return; } }catch(_e){} fn(); }; }
    function armSets(afterPress){
        clearTimeout(holdT); holdT = 0; holdDone = false; setSince = Date.now();
        var key = setKey();
        if(key && holdMap[key]) holdT = setTimeout(guarded(checkHold), 3000);
        if(afterPress){ clearTimeout(chordT); chordT = setTimeout(guarded(function(){ checkChord(90); }), 100); }
        if(!key) chordDone = false;
    }
    function press(src, tok){ if(down[src]) return; down[src] = tok; if(!isTitle()){ return; } onPress(tok); armSets(true); }
    // はなす前に、「同時おし」「ながおし」が もう 成立していたら ここで 拾う（画面が重くて タイマーが おくれても もれない）
    function release(src){ if(!down[src]) return; checkChord(90); checkHold(); delete down[src]; armSets(false); }
    function releaseAll(){ down = {}; clearTimeout(holdT); clearTimeout(chordT); chordDone = false; seqBuf = []; }
    function inField(t){ if(!t || !t.tagName) return false; var n = t.tagName; return n === "INPUT" || n === "TEXTAREA" || n === "SELECT" || !!t.isContentEditable; }
    function onKeyDown(e){
        if(!enabled || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || inField(e.target)) return;
        var tok = (cfg.keys && Object.prototype.hasOwnProperty.call(cfg.keys, e.code)) ? cfg.keys[e.code] : KEYMAP[e.code]; if(!tok) return;   // cfg.keys：そのゲームで「決定」などに つかわれている キーを さける ための つけかえ
        if(e.repeat){ if(!down["k:" + e.code]) press("k:" + e.code, tok); return; }
        press("k:" + e.code, tok);
    }
    function onKeyUp(e){ release("k:" + e.code); }

    // ゲームパッド（navigator.getGamepads は are-padmap が かぶせた ものを そのまま 読む）
    var padState = {}, padIv = 0;
    function padPoll(){
        if(!enabled) return;
        if(!isTitle()){ if(Object.keys(down).length) releaseAll(); padState = {}; return; }
        var pads; try{ pads = navigator.getGamepads ? navigator.getGamepads() : []; }catch(_e){ return; }
        var seen = {};
        for(var i = 0; i < pads.length; i++){
            var p = pads[i]; if(!p || !p.buttons) continue;
            for(var b in PADMAP){ var src = "g" + p.index + ":" + b, on = !!(p.buttons[b] && p.buttons[b].pressed); seen[src] = 1; if(on && !padState[src]){ padState[src] = 1; press(src, PADMAP[b]); } else if(!on && padState[src]){ padState[src] = 0; release(src); } }
            var ax = p.axes || [], dirs = [["gx-", ax[0] < -.7, "L"], ["gx+", ax[0] > .7, "R"], ["gy-", ax[1] < -.7, "U"], ["gy+", ax[1] > .7, "D"]];
            for(var d = 0; d < 4; d++){ var s2 = "g" + p.index + ":" + dirs[d][0]; seen[s2] = 1; if(dirs[d][1] && !padState[s2]){ padState[s2] = 1; press(s2, dirs[d][2]); } else if(!dirs[d][1] && padState[s2]){ padState[s2] = 0; release(s2); } }
        }
        for(var k in padState){ if(padState[k] && !seen[k]){ padState[k] = 0; release(k); } }   // パッドが ぬけた
    }

    // さわる（ゆび・マウス）
    var ptr = {}, taps = [], touchLongT = 0, touchNT = 0;
    function zoneOf(x, y){
        var nx = x / Math.max(1, innerWidth), ny = y / Math.max(1, innerHeight);
        if(nx < .22 && ny < .22) return "TL"; if(nx > .78 && ny < .22) return "TR"; if(nx < .22 && ny > .78) return "BL"; if(nx > .78 && ny > .78) return "BR";
        if(Math.hypot(nx - .5, ny - .5) < .18) return "C"; return "";
    }
    function interactive(t){
        while(t && t.nodeType === 1){
            var n = t.tagName; if(n === "BUTTON" || n === "A" || n === "INPUT" || n === "SELECT" || n === "TEXTAREA" || n === "LABEL" || n === "SUMMARY") return true;
            if(t.getAttribute && (t.getAttribute("role") === "button" || t.hasAttribute("data-btn") || t.hasAttribute("data-are-padmap"))) return true;
            t = t.parentNode;
        }
        return false;
    }
    function nPtr(){ var n = 0; for(var k in ptr) n++; return n; }
    var multi = {n: 0, t: 0, done: false};
    function onPtrDown(e){
        if(!enabled || !isTitle()) return;
        if(e.pointerType === "mouse" && e.button !== 0) return;
        ptr[e.pointerId] = {x: e.clientX, y: e.clientY, t: Date.now(), touch: e.pointerType !== "mouse", ia: interactive(e.target), moved: 0, long: 0, fired: false, single: false};
        var n = nPtr(); clearTimeout(touchNT); touchNT = 0; clearTimeout(touchLongT); touchLongT = 0; multi = {n: 0, t: 0, done: false};
        if((n === 2 && touchDefs.two) || (n === 3 && touchDefs.three)){
            var want = n; multi = {n: n, t: Date.now(), done: false};
            touchNT = setTimeout(function(){ if(nPtr() === want && isTitle() && !multi.done){ multi.done = true; fire(want === 2 ? touchDefs.two : touchDefs.three, "touch"); } }, 1200);
        }else if(n === 1){
            var z = zoneOf(e.clientX, e.clientY), id = z && touchDefs.long[z], q0 = ptr[e.pointerId]; q0.single = true; q0.long = id || 0;
            if(id) touchLongT = setTimeout(function(){ var q = ptr[e.pointerId]; if(q && !q.fired && q.moved < 24 && nPtr() === 1 && isTitle()){ q.fired = true; fire(id, "touch"); } }, 1500);
        }
    }
    function onPtrMove(e){ var q = ptr[e.pointerId]; if(q) q.moved = Math.max(q.moved, Math.hypot(e.clientX - q.x, e.clientY - q.y)); }
    function onPtrUp(e){
        var q = ptr[e.pointerId], nBefore = nPtr(), now = Date.now();
        // 画面が おもくて タイマーが おくれても、はなした ときに「もう じゅうぶん ながく おしていた」なら 拾う
        if(q && enabled && isTitle() && e.type !== "pointercancel"){
            if(q.single && q.long && !q.fired && nBefore === 1 && q.moved < 24 && now - q.t >= 1500){ q.fired = true; fire(q.long, "touch"); }
            else if(multi.n && !multi.done && nBefore === multi.n && now - multi.t >= 1200){ multi.done = true; fire(multi.n === 2 ? touchDefs.two : touchDefs.three, "touch"); }
        }
        delete ptr[e.pointerId];
        clearTimeout(touchLongT); touchLongT = 0; if(nPtr() < 2){ clearTimeout(touchNT); touchNT = 0; }
        if(!q || !enabled || !isTitle() || q.ia || e.type === "pointercancel") return;
        if(now - q.t > 450 || q.moved > 24) return;
        var z = zoneOf(q.x, q.y); if(!z) return;
        taps = taps.filter(function(t){ return now - t.t < 4200 * SLOW; }); taps.push({z: z, t: now});
        for(var i = 0; i < touchDefs.tap.length; i++){
            var p = touchDefs.tap[i].p, L = p.length; if(taps.length < L) continue;
            var seg = taps.slice(taps.length - L), ok = seg.every(function(t, j){ return t.z === p[j]; });
            if(ok && now - seg[0].t < (p[0] === "C" ? 2600 : 4200) * SLOW){ taps = []; fire(touchDefs.tap[i].id, "touch"); return; }
        }
    }

    // ---------- そとから つかう ----------
    function attach(o){
        if(o){ if(typeof o.title === "function") cfg.title = o.title; if(o.host != null) cfg.host = o.host; if(o.keys && typeof o.keys === "object") cfg.keys = o.keys; }
        if(attached) return; attached = true;
        window.addEventListener("keydown", onKeyDown, true); window.addEventListener("keyup", onKeyUp, true);
        window.addEventListener("blur", releaseAll); document.addEventListener("visibilitychange", function(){ if(document.hidden) releaseAll(); });
        window.addEventListener("pointerdown", onPtrDown, true); window.addEventListener("pointermove", onPtrMove, true);
        window.addEventListener("pointerup", onPtrUp, true); window.addEventListener("pointercancel", onPtrUp, true);
        padIv = setInterval(padPoll, 25);
        // タイトルから はなれたら ひみつの 演出は すぐ ぜんぶ 消す
        setInterval(function(){ if(!isTitle() && (layerEl && layerEl.firstChild || hostMem.length || cleanups.length || timers.length)){ cancelAll(); releaseAll(); } }, 250);
    }
    function selfCheck(){
        var bad = [], i, j;
        if(D.length !== 100) bad.push("数が 100 ではない: " + D.length);
        var names = {}; D.forEach(function(d){ if(names[d.name]) bad.push("名前が かぶる: " + d.name); names[d.name] = 1; });
        for(i = 0; i < seqDefs.length; i++) for(j = 0; j < seqDefs.length; j++){
            if(i === j) continue; var a = seqDefs[i].p, b = seqDefs[j].p;
            if(a.length <= b.length && (" " + b.join(" ") + " ").indexOf(" " + a.join(" ") + " ") >= 0) bad.push("じゅんばん：#" + seqDefs[i].id + " が #" + seqDefs[j].id + " の 中に ふくまれる");
        }
        var keys = Object.keys(chordMap);
        for(i = 0; i < keys.length; i++) for(j = 0; j < keys.length; j++){
            if(i === j) continue; var A = keys[i].split("+"), B = keys[j].split("+");
            if(A.every(function(x){ return B.indexOf(x) >= 0; })) bad.push("同時おし：#" + chordMap[keys[i]] + " が #" + chordMap[keys[j]] + " に ふくまれる");
        }
        return bad;
    }
    function visible(x){
        try{ var e = typeof x === "string" ? document.querySelector(x) : x; if(!e || e.hidden) return false; var r = e.getBoundingClientRect(), cs = getComputedStyle(e);
            return r.width > 40 && r.height > 20 && cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > .05; }catch(_e){ return false; }
    }
    window.TitleSecrets = {
        attach: attach, visible: visible, isTitle: isTitle, list: function(){ return D.map(function(d){ return {id: d.id, t: d.t, p: d.p, name: d.name}; }); },
        fire: function(id){ return fire(id, "debug", true); }, enable: function(on){ enabled = !!on; if(!enabled){ cancelAll(); releaseAll(); } lsSet(LSOFF, on ? "0" : "1"); },
        isEnabled: function(){ return enabled; }, found: function(){ return Object.keys(found).map(Number).sort(function(a, b){ return a - b; }); }, resetFound: function(){ found = {}; lsSet(LSF, "[]"); try{ localStorage.removeItem(LSDONE); }catch(_e){} },
        debug: function(){ return {down: down, key: setKey(), chords: Object.keys(chordMap).length, mash: Object.keys(mashDefs), holds: Object.keys(holdMap).length, press: pressTimes, seqBuf: seqBuf, enabled: enabled}; }, setSlow: function(k){ SLOW = Math.max(1, +k || 1); }, stats: stats, active: function(){ return (layerEl ? layerEl.childNodes.length : 0) + hostMem.length + cleanups.length; }, cancel: cancelAll, selfCheck: selfCheck, keymap: KEYMAP, padmap: PADMAP
    };
})();
