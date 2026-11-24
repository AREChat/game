"use strict";
/* ===== ARE ゲーム共通キット (GK) =====
   game11 / game12 で つかう 小さな どうぐ箱（クラシック script・外部ライブラリなし）
   ・GK.lang()                … ja / en / zh / ko（チャットの設定 are_lang をそのまま使う。なければ ja）
   ・GK.i18n({ja:{k:"…"},en:{…},zh:{…},ko:{…}}) → t(key, {n:3})   （ない言葉は ja → キー名の順に さがす）
   ・GK.sfx(name) / GK.bgm(kind) / GK.mute(b) … WebAudio で つくる 音（ファイル不要）
   ・GK.confetti() / GK.burst(x,y,opt) … 紙吹雪・火花（画面の上に かぶせる canvas）
   ・GK.shake(el) / GK.vibrate(ms) / GK.save(ns) / GK.rng(seed) / GK.daySeed()
   虫の 絵・絵文字・名前は 一切 使いません。 */
(function(){
    if(window.GK) return;
    var LS = {
        get: function(k, d){ try{ var v = localStorage.getItem(k); return v == null ? d : v; }catch(_e){ return d; } },
        set: function(k, v){ try{ localStorage.setItem(k, v); }catch(_e){} }
    };

    // ---------- 言語 ----------
    var LANGS = ["ja", "en", "zh", "ko"];
    function lang(){ var l = LS.get("are_lang", "ja"); return LANGS.indexOf(l) >= 0 ? l : "ja"; }
    function i18n(dict){
        return function t(key, vars){
            var d = dict[lang()] || {}, s = d[key];
            if(s == null) s = (dict.ja || {})[key];
            if(s == null) s = key;
            if(vars) s = String(s).replace(/\{(\w+)\}/g, function(m, k){ return vars[k] != null ? vars[k] : m; });
            return s;
        };
    }
    var COMMON = i18n({
        ja: {back: "← もどる", play: "▶ あそぶ", how: "📖 あそびかた", close: "とじる", sound: "おと", on: "オン", off: "オフ", retry: "もういちど", next: "▶ つぎへ", title: "タイトルへ", best: "ベスト", score: "スコア", stage: "ステージ", clear: "クリア！", over: "ゲームオーバー", pause: "いちじ ていし", resume: "つづける", lang: "ことば"},
        en: {back: "← Back", play: "▶ Play", how: "📖 How to play", close: "Close", sound: "Sound", on: "On", off: "Off", retry: "Retry", next: "▶ Next", title: "Title", best: "Best", score: "Score", stage: "Stage", clear: "Clear!", over: "Game Over", pause: "Paused", resume: "Resume", lang: "Language"},
        zh: {back: "← 返回", play: "▶ 开始", how: "📖 玩法", close: "关闭", sound: "声音", on: "开", off: "关", retry: "再来一次", next: "▶ 下一关", title: "标题", best: "最佳", score: "得分", stage: "关卡", clear: "过关！", over: "游戏结束", pause: "暂停", resume: "继续", lang: "语言"},
        ko: {back: "← 돌아가기", play: "▶ 플레이", how: "📖 방법", close: "닫기", sound: "소리", on: "켜기", off: "끄기", retry: "다시", next: "▶ 다음", title: "타이틀", best: "최고", score: "점수", stage: "스테이지", clear: "클리어!", over: "게임 오버", pause: "일시정지", resume: "계속", lang: "언어"}
    });

    // ---------- 保存 ----------
    function save(ns){
        var key = "gk_" + ns;
        return {
            get: function(k, d){ try{ var o = JSON.parse(LS.get(key, "{}")); return o[k] === undefined ? d : o[k]; }catch(_e){ return d; } },
            set: function(k, v){ try{ var o = JSON.parse(LS.get(key, "{}")); o[k] = v; LS.set(key, JSON.stringify(o)); }catch(_e){} },
            all: function(){ try{ return JSON.parse(LS.get(key, "{}")); }catch(_e){ return {}; } }
        };
    }

    // ---------- 乱数 ----------
    function rng(seed){
        var a = (seed >>> 0) || 1;
        return function(){ a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    function daySeed(){ var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
    function hashStr(s){ var h = 2166136261; for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

    // ---------- 音 ----------
    var actx = null, master = null, muted = false, bgmT = 0, bgmOn = false, bgmKind = "calm", bgmStep = 0, bgmNext = 0;
    try{ var st = JSON.parse(LS.get("are_settings", "{}")); muted = !!st.mute; }catch(_e){}
    if(LS.get("gk_mute", "") === "1") muted = true;
    function ctx(){
        if(muted) return null;
        try{
            if(!actx){ actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = .7; master.connect(actx.destination); }
            if(actx.state === "suspended") actx.resume();
        }catch(_e){ return null; }
        return actx;
    }
    function tone(f, d, type, v, when, slide){
        var c = ctx(); if(!c) return;
        try{
            var t0 = (when || c.currentTime), o = c.createOscillator(), g = c.createGain();
            o.type = type || "sine"; o.frequency.setValueAtTime(f, t0);
            if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t0 + d);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v == null ? .12 : v, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
            o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + d + .02);
        }catch(_e){}
    }
    function noise(d, v, hp, when){
        var c = ctx(); if(!c) return;
        try{
            var t0 = (when || c.currentTime), n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), ch = buf.getChannelData(0);
            for(var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
            var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
            f.type = "highpass"; f.frequency.value = hp || 800; g.gain.value = v == null ? .2 : v;
            s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start(t0);
        }catch(_e){}
    }
    var SFX = {
        tap: function(){ tone(660, .06, "triangle", .08); },
        ok: function(){ tone(660, .09, "triangle", .12); tone(990, .14, "triangle", .1, actx && actx.currentTime + .08); },
        ng: function(){ tone(180, .18, "sawtooth", .1, 0, .6); },
        pop: function(){ tone(520, .07, "sine", .14, 0, 1.8); },
        coin: function(){ tone(988, .06, "square", .07); tone(1319, .16, "square", .07, actx && actx.currentTime + .06); },
        jump: function(){ tone(300, .16, "square", .06, 0, 2.2); },
        hit: function(){ noise(.09, .22, 600); tone(140, .1, "square", .1, 0, .5); },
        slash: function(){ noise(.12, .18, 2500); tone(900, .1, "sawtooth", .05, 0, .3); },
        boom: function(){ noise(.5, .35, 80); tone(90, .45, "sawtooth", .16, 0, .35); },
        whoosh: function(){ noise(.3, .12, 1500); },
        win: function(){ var c = ctx(); if(!c) return; [523, 659, 784, 1047, 1319].forEach(function(f, i){ tone(f, .22, "triangle", .12, c.currentTime + i * .09); }); },
        lose: function(){ var c = ctx(); if(!c) return; [392, 330, 262, 196].forEach(function(f, i){ tone(f, .26, "sawtooth", .08, c.currentTime + i * .13); }); },
        combo: function(n){ tone(440 * Math.pow(1.0595, Math.min(24, (n || 1) * 2)), .09, "triangle", .1); },
        charge: function(){ tone(200, .5, "sawtooth", .07, 0, 4); },
        musou: function(){ noise(.8, .3, 200); tone(110, .8, "sawtooth", .16, 0, 3); }
    };
    function sfx(name, a){ try{ if(SFX[name]) SFX[name](a); }catch(_e){} }
    var SCALES = {calm: [0, 2, 4, 7, 9, 12], tense: [0, 3, 5, 6, 7, 10], epic: [0, 2, 3, 5, 7, 8, 10], fun: [0, 2, 4, 5, 7, 9, 11]};
    function bgmTick(){
        if(!bgmOn || muted){ return; }
        var c = ctx(); if(!c) return;
        var sc = SCALES[bgmKind] || SCALES.calm, bpm = bgmKind === "tense" ? 140 : bgmKind === "epic" ? 120 : bgmKind === "fun" ? 128 : 92, sp = 60 / bpm / 2;
        while(bgmNext < c.currentTime + .3){
            var t = bgmNext < c.currentTime ? c.currentTime : bgmNext, s = bgmStep;
            var root = [0, 0, 5, 7][((s / 16) | 0) % 4], base = 110 * Math.pow(1.0595, root);
            if(s % 4 === 0) tone(base, sp * 3.6, "triangle", .07, t);
            if(s % 2 === 0 || bgmKind === "tense"){ var n = sc[(s * 7 + ((s / 8) | 0) * 3) % sc.length]; tone(base * 4 * Math.pow(1.0595, n), sp * 1.6, bgmKind === "epic" ? "sawtooth" : "sine", bgmKind === "epic" ? .025 : .04, t); }
            if(bgmKind !== "calm" && s % 4 === 2) noise(.04, .05, 6000, t);
            if(bgmKind === "epic" && s % 8 === 0) { noise(.12, .12, 90, t); }
            bgmNext = t + sp; bgmStep++;
        }
    }
    function bgm(kind){
        if(kind === false || kind === "off"){ bgmOn = false; clearInterval(bgmT); return; }
        bgmKind = kind || "calm"; bgmStep = 0;
        if(bgmOn) return;
        bgmOn = true; var c = ctx(); bgmNext = c ? c.currentTime + .05 : 0;
        clearInterval(bgmT); bgmT = setInterval(bgmTick, 120);
    }
    function mute(b){ muted = !!b; LS.set("gk_mute", muted ? "1" : "0"); if(muted){ clearInterval(bgmT); } else if(bgmOn){ var c = ctx(); bgmNext = c ? c.currentTime + .05 : 0; clearInterval(bgmT); bgmT = setInterval(bgmTick, 120); } return muted; }
    function isMuted(){ return muted; }
    // ブラウザは ユーザーの操作の後でないと 音を出せない → 最初の操作で 起こす
    ["pointerdown", "keydown", "touchstart"].forEach(function(ev){ window.addEventListener(ev, function(){ if(!muted && actx && actx.state === "suspended") try{ actx.resume(); }catch(_e){} }, {passive: true}); });

    // ---------- 演出（紙吹雪・火花・ゆれ・バイブ） ----------
    var fxC = null, fxX = null, parts = [], fxRaf = 0, calm = false;
    try{ calm = !!JSON.parse(LS.get("are_settings", "{}")).calm; }catch(_e){}
    function fxInit(){
        if(fxC) return;
        fxC = document.createElement("canvas"); fxC.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000";
        document.body.appendChild(fxC); fxX = fxC.getContext("2d");
        window.addEventListener("resize", fxSize); fxSize();
    }
    function fxSize(){ if(!fxC) return; var d = Math.min(2, window.devicePixelRatio || 1); fxC.width = Math.floor(innerWidth * d); fxC.height = Math.floor(innerHeight * d); fxX.setTransform(d, 0, 0, d, 0, 0); }
    var COLS = ["#ffd24a", "#ff6b9a", "#6fe3ff", "#9dff7a", "#b58bff", "#ffffff", "#ff9a4a"];
    function burst(x, y, o){
        if(calm) return; o = o || {}; fxInit();
        var n = o.n || 24, cols = o.colors || COLS;
        for(var i = 0; i < n; i++){
            var a = o.up ? -Math.PI / 2 + (Math.random() - .5) * 1.4 : Math.random() * 6.283, sp = (o.speed || 260) * (.3 + Math.random() * .9);
            parts.push({x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g == null ? 620 : o.g, life: (o.life || .9) * (.6 + Math.random() * .6), t: 0, s: (o.size || 6) * (.6 + Math.random() * .8), c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6, vr: (Math.random() - .5) * 14, shape: o.shape || (Math.random() < .5 ? "r" : "c")});
        }
        if(!fxRaf) fxRaf = requestAnimationFrame(fxLoop);
    }
    function confetti(){
        if(calm) return; fxInit();
        for(var k = 0; k < 6; k++) setTimeout(function(){ burst(Math.random() * innerWidth, innerHeight * .15, {n: 26, speed: 380, up: false, g: 520, life: 1.6, size: 7}); }, k * 120);
        burst(innerWidth * .15, innerHeight * .9, {n: 40, speed: 760, up: true, life: 1.4}); burst(innerWidth * .85, innerHeight * .9, {n: 40, speed: 760, up: true, life: 1.4});
    }
    var last = 0;
    function fxLoop(ts){
        var dt = Math.min(.05, ((ts - last) / 1000) || .016); last = ts;
        fxX.clearRect(0, 0, innerWidth, innerHeight);
        for(var i = parts.length - 1; i >= 0; i--){
            var p = parts[i]; p.t += dt; if(p.t >= p.life){ parts.splice(i, 1); continue; }
            p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
            var a = 1 - p.t / p.life; fxX.globalAlpha = a; fxX.fillStyle = p.c;
            if(p.shape === "c"){ fxX.beginPath(); fxX.arc(p.x, p.y, p.s * .6, 0, 6.283); fxX.fill(); }
            else if(p.shape === "s"){ fxX.save(); fxX.translate(p.x, p.y); fxX.rotate(p.r); fxX.beginPath(); for(var j = 0; j < 4; j++){ fxX.lineTo(0, -p.s * 1.3); fxX.rotate(.785); fxX.lineTo(0, -p.s * .35); fxX.rotate(.785); } fxX.fill(); fxX.restore(); }
            else{ fxX.save(); fxX.translate(p.x, p.y); fxX.rotate(p.r); fxX.fillRect(-p.s / 2, -p.s * .3, p.s, p.s * .6); fxX.restore(); }
        }
        fxX.globalAlpha = 1;
        if(parts.length) fxRaf = requestAnimationFrame(fxLoop); else { fxRaf = 0; fxX.clearRect(0, 0, innerWidth, innerHeight); }
    }
    function shake(el, ms){
        if(calm || !el || !el.animate) return;
        try{ el.animate([{transform: "translate(0,0)"}, {transform: "translate(-6px,3px)"}, {transform: "translate(5px,-4px)"}, {transform: "translate(-3px,-2px)"}, {transform: "translate(0,0)"}], {duration: ms || 260}); }catch(_e){}
    }
    function vibrate(ms){ try{ var v = true; try{ v = JSON.parse(LS.get("are_settings", "{}")).vib !== false; }catch(_e){} if(v && navigator.vibrate) navigator.vibrate(ms || 20); }catch(_e){} }

    window.GK = {LS: LS, lang: lang, i18n: i18n, t: COMMON, save: save, rng: rng, daySeed: daySeed, hashStr: hashStr,
        sfx: sfx, bgm: bgm, mute: mute, isMuted: isMuted, tone: tone, noise: noise,
        burst: burst, confetti: confetti, shake: shake, vibrate: vibrate, COLS: COLS};
})();
