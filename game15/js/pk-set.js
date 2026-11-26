"use strict";
// ポコポコ太鼓：せってい（おぼえておく・プリセット・書き出し）。画面の 組み立ては pk.js から 呼ぶ。
(function(root){
    var KEY = "are_pk_settings_v2", PKEY = "are_pk_presets_v2";
    var DEF = {
        speed: 1, size: 1, offset: 0, strict: 1, kd1: "f", kd2: "j", kk1: "d", kk2: "k", swap: false, mod: 0, hid: 0, noFail: false, clearAt: 70, rate: 1,
        theme: 0, donC: 0, kaC: 0, hitX: .2, laneY: .5, laneS: 1, sCombo: true, sScore: true, sJudge: true, sFast: true, sBeat: true, sGauge: true, sMascot: true, fx: 2, calm: false, bgAnim: true, skin: 0,
        vMaster: .8, vMusic: .8, vSe: 1, sePack: 0, metro: false, music: true, vib: false, count: 3, name: ""
    };
    var NOTE_COLORS = [   // [赤の しるし, 青の しるし]
        {n: {ja: "ひょうじゅん（赤・青）", en: "Standard (red/blue)"}, d: ["#ee4b3a", "#37a2ee"]},
        {n: {ja: "見わけやすい（だいだい・水色）", en: "High contrast (orange/cyan)"}, d: ["#ff8a1a", "#19d6e6"]},
        {n: {ja: "パステル", en: "Pastel"}, d: ["#ff8fa8", "#8fc8ff"]},
        {n: {ja: "ネオン", en: "Neon"}, d: ["#ff2a6a", "#2affc8"]},
        {n: {ja: "モノクロ（白・くろ）", en: "Mono (white/dark)"}, d: ["#f4f4f4", "#505870"]},
        {n: {ja: "みどり・むらさき", en: "Green/purple"}, d: ["#7ae04a", "#a05aff"]}
    ];
    var THEMES = [
        {n: {ja: "よまつり", en: "Festival night"}, top: "#241048", bot: "#6a2a7a", hill: ["#2a1450", "#3a1a5e"], glow: "#ffb84a", star: true},
        {n: {ja: "ゆうやけ", en: "Sunset"}, top: "#4a1a5a", bot: "#ff8a4a", hill: ["#5a2060", "#7a2a58"], glow: "#ffd27a", star: false},
        {n: {ja: "さくら", en: "Cherry blossom"}, top: "#5a2a6a", bot: "#ffb0d0", hill: ["#7a3a7a", "#9a4a88"], glow: "#ffd0e8", petals: true},
        {n: {ja: "うみ", en: "Ocean"}, top: "#0a2a5a", bot: "#2aa8c8", hill: ["#0a3a6a", "#10507a"], glow: "#aaf0ff", wave: true},
        {n: {ja: "ほしぞら", en: "Starry sky"}, top: "#04041a", bot: "#2a1a6a", hill: ["#0a0a2a", "#14143a"], glow: "#aab8ff", star: true}
    ];
    var SKINS = [
        {n: {ja: "ぽこたん", en: "Pokotan"}, body: "#d8402e", edge: "#8f2416", ext: "none"},
        {n: {ja: "ねこたいこ", en: "Cat drum"}, body: "#f0932e", edge: "#9a5a14", ext: "cat"},
        {n: {ja: "おにたいこ", en: "Ogre drum"}, body: "#3a7ae0", edge: "#1d3a8f", ext: "horn"},
        {n: {ja: "うさたいこ", en: "Bunny drum"}, body: "#f070a8", edge: "#a02a68", ext: "bunny"},
        {n: {ja: "ほしたいこ", en: "Star drum"}, body: "#f0c020", edge: "#a07a0a", ext: "star"}
    ];
    var SE_PACKS = [{ja: "ポコポコ", en: "Poko-poko"}, {ja: "もくぎょ", en: "Wood block"}, {ja: "でんし", en: "Electro"}, {ja: "てびょうし", en: "Hand clap"}, {ja: "ドラム", en: "Drum kit"}];
    var cur = {}, listeners = [], k;
    function copy(o){ var r = {}, x; for(x in o) r[x] = o[x]; return r; }
    function load(){
        cur = copy(DEF);
        try{ var v = JSON.parse(localStorage.getItem(KEY) || "null"); if(v) for(k in DEF){ if(k in v && typeof v[k] === typeof DEF[k]) cur[k] = v[k]; } }catch(_e){}
        clamp(); return cur;
    }
    function num(v, a, b){ return Math.min(b, Math.max(a, +v || 0)); }
    function clamp(){
        cur.speed = num(cur.speed || 1, .5, 4); cur.size = num(cur.size || 1, .7, 1.5); cur.offset = num(cur.offset, -300, 300); cur.strict = Math.round(num(cur.strict, 0, 2));
        cur.clearAt = Math.round(num(cur.clearAt || 70, 40, 95)); cur.rate = num(cur.rate || 1, .5, 1.5); cur.hitX = num(cur.hitX || .2, .1, .4); cur.laneY = num(cur.laneY || .5, .3, .7); cur.laneS = num(cur.laneS || 1, .7, 1.4);
        cur.theme = Math.round(num(cur.theme, 0, THEMES.length - 1)); cur.donC = Math.round(num(cur.donC, 0, NOTE_COLORS.length - 1)); cur.kaC = Math.round(num(cur.kaC, 0, NOTE_COLORS.length - 1));
        cur.skin = Math.round(num(cur.skin, 0, SKINS.length - 1)); cur.sePack = Math.round(num(cur.sePack, 0, SE_PACKS.length - 1)); cur.fx = Math.round(num(cur.fx, 0, 2));
        cur.mod = Math.round(num(cur.mod, 0, 2)); cur.hid = Math.round(num(cur.hid, 0, 3)); cur.count = Math.round(num(cur.count, 0, 5));
        cur.vMaster = num(cur.vMaster, 0, 1); cur.vMusic = num(cur.vMusic, 0, 1); cur.vSe = num(cur.vSe, 0, 1); cur.name = String(cur.name || "").slice(0, 12);
        ["kd1", "kd2", "kk1", "kk2"].forEach(function(x){ cur[x] = String(cur[x] || DEF[x]).slice(0, 12); });
    }
    function save(){ clamp(); try{ localStorage.setItem(KEY, JSON.stringify(cur)); }catch(_e){} listeners.forEach(function(f){ try{ f(cur); }catch(_e){} }); }
    function set(key, v){ cur[key] = v; save(); }
    function reset(){ cur = copy(DEF); save(); }
    function presets(){ try{ var v = JSON.parse(localStorage.getItem(PKEY) || "[]"); return Array.isArray(v) ? v : []; }catch(_e){ return []; } }
    function savePreset(i, name){ var p = presets(); p[i] = {name: name || ("#" + (i + 1)), data: copy(cur)}; try{ localStorage.setItem(PKEY, JSON.stringify(p)); }catch(_e){} }
    function loadPreset(i){ var p = presets()[i]; if(!p || !p.data) return false; for(k in DEF){ if(k in p.data && typeof p.data[k] === typeof DEF[k]) cur[k] = p.data[k]; } save(); return true; }
    function exportJson(){ return JSON.stringify(cur); }
    function importJson(s){ try{ var v = JSON.parse(s); if(!v || typeof v !== "object") return false; for(k in DEF){ if(k in v && typeof v[k] === typeof DEF[k]) cur[k] = v[k]; } save(); return true; }catch(_e){ return false; } }
    // せってい画面の 部品（タブごとの いちらん）。type: range / sel / tog / key
    var L = function(ja, en){ return {ja: ja, en: en}; };
    var SCHEMA = [
        {tab: 0, k: "speed", type: "range", min: .5, max: 4, step: .1, fmt: "x", l: L("スクロールの はやさ", "Scroll speed"), h: L("大きいほど 音符が はやく流れます", "Higher = notes move faster")},
        {tab: 0, k: "size", type: "range", min: .7, max: 1.5, step: .05, fmt: "x", l: L("音符の 大きさ", "Note size")},
        {tab: 0, k: "offset", type: "range", min: -300, max: 300, step: 5, fmt: "ms", l: L("判定の ずれ調整", "Judgement offset"), h: L("＋：おそめに たたく人向け　−：はやめに たたく人向け（「はかる」で じどう設定）", "+ if you hit late, − if you hit early (use Calibrate)")},
        {tab: 0, k: "strict", type: "sel", opts: [L("やさしい", "Lenient"), L("ふつう", "Standard"), L("きびしい", "Strict")], l: L("判定の きびしさ", "Judgement strictness")},
        {tab: 0, k: "clearAt", type: "range", min: 40, max: 95, step: 5, fmt: "%", l: L("クリアに ひつような 魂ゲージ", "Gauge needed to clear")},
        {tab: 0, k: "noFail", type: "tog", l: L("ゲージが たりなくても 「クリア」に する（れんしゅう）", "Always count as cleared (practice)")},
        {tab: 0, k: "rate", type: "range", min: .5, max: 1.5, step: .05, fmt: "x", l: L("曲の はやさ（れんしゅう）", "Song tempo (practice)"), h: L("0.5〜1.5ばい。変えると 記録は のこりません", "Records are not saved when changed")},
        {tab: 0, k: "mod", type: "sel", opts: [L("なし", "Off"), L("赤と青を ぎゃくに", "Swap red/blue"), L("ランダム", "Random")], l: L("音符の いれかえ", "Note modifier")},
        {tab: 0, k: "hid", type: "sel", opts: [L("なし", "Off"), L("おくで きえる（サドゥン）", "Sudden"), L("てまえで きえる（ヒドゥン）", "Hidden"), L("りょうほう", "Both")], l: L("音符を かくす", "Hide notes")},
        {tab: 0, k: "vib", type: "tog", l: L("たたくと ぶるっと する（スマホ）", "Vibrate on hit (mobile)")},
        {tab: 0, k: "count", type: "range", min: 0, max: 5, step: 1, fmt: "s", l: L("はじまる まえの カウント", "Count-in seconds")},
        {tab: 1, k: "theme", type: "sel", opts: THEMES.map(function(x){ return x.n; }), l: L("はいけい", "Background")},
        {tab: 1, k: "skin", type: "sel", opts: SKINS.map(function(x){ return x.n; }), l: L("左上の あいぼう", "Mascot")},
        {tab: 1, k: "donC", type: "sel", opts: NOTE_COLORS.map(function(x){ return x.n; }), l: L("赤い音符の いろ", "Don note colour"), pair: 0},
        {tab: 1, k: "kaC", type: "sel", opts: NOTE_COLORS.map(function(x){ return x.n; }), l: L("青い音符の いろ", "Ka note colour"), pair: 1},
        {tab: 1, k: "hitX", type: "range", min: .1, max: .4, step: .01, fmt: "%100", l: L("たたく まるの いち", "Hit circle position")},
        {tab: 1, k: "laneY", type: "range", min: .3, max: .7, step: .01, fmt: "%100", l: L("レーンの たかさ", "Lane height")},
        {tab: 1, k: "laneS", type: "range", min: .7, max: 1.4, step: .05, fmt: "x", l: L("レーンの 太さ", "Lane thickness")},
        {tab: 1, k: "fx", type: "sel", opts: [L("なし", "None"), L("すこし", "Low"), L("たっぷり", "High")], l: L("エフェクト", "Effects")},
        {tab: 1, k: "bgAnim", type: "tog", l: L("はいけいを うごかす", "Animated background")},
        {tab: 1, k: "calm", type: "tog", l: L("ゆれを おさえる（目に やさしい）", "Reduce motion")},
        {tab: 1, k: "sMascot", type: "tog", l: L("あいぼうを 出す", "Show mascot")},
        {tab: 1, k: "sGauge", type: "tog", l: L("魂ゲージを 出す", "Show soul gauge")},
        {tab: 1, k: "sCombo", type: "tog", l: L("コンボを 出す", "Show combo")},
        {tab: 1, k: "sScore", type: "tog", l: L("スコアを 出す", "Show score")},
        {tab: 1, k: "sJudge", type: "tog", l: L("判定（良・可・不可）を 出す", "Show judgement text")},
        {tab: 1, k: "sFast", type: "tog", l: L("はやい／おそいを 出す", "Show early/late")},
        {tab: 1, k: "sBeat", type: "tog", l: L("拍の せんを 出す", "Show beat lines")},
        {tab: 2, k: "vMaster", type: "range", min: 0, max: 1, step: .05, fmt: "%100", l: L("ぜんたいの 音量", "Master volume")},
        {tab: 2, k: "vMusic", type: "range", min: 0, max: 1, step: .05, fmt: "%100", l: L("曲の 音量", "Music volume")},
        {tab: 2, k: "vSe", type: "range", min: 0, max: 1, step: .05, fmt: "%100", l: L("たたく 音の 音量", "Hit sound volume")},
        {tab: 2, k: "sePack", type: "sel", opts: SE_PACKS, l: L("たたく 音の しゅるい", "Hit sound set"), test: true},
        {tab: 2, k: "music", type: "tog", l: L("曲を ならす（オフなら 譜面だけ）", "Play the music")},
        {tab: 2, k: "metro", type: "tog", l: L("メトロノーム（拍の クリック）", "Metronome click")},
        {tab: 3, k: "kd1", type: "key", l: L("赤（ドン）：ひだり", "Don (left)")},
        {tab: 3, k: "kd2", type: "key", l: L("赤（ドン）：みぎ", "Don (right)")},
        {tab: 3, k: "kk1", type: "key", l: L("青（カッ）：ひだり", "Ka (left)")},
        {tab: 3, k: "kk2", type: "key", l: L("青（カッ）：みぎ", "Ka (right)")}
    ];
    function fmt(def, v){ var f = def.fmt; if(f === "x") return v.toFixed(2).replace(/0$/, "") + "×"; if(f === "ms") return (v > 0 ? "+" : "") + v + "ms"; if(f === "%") return v + "%"; if(f === "%100") return Math.round(v * 100) + "%"; if(f === "s") return v + "s"; return String(v); }
    var api = {DEF: DEF, THEMES: THEMES, SKINS: SKINS, NOTE_COLORS: NOTE_COLORS, SE_PACKS: SE_PACKS, SCHEMA: SCHEMA, load: load, save: save, set: set, reset: reset, get: function(){ return cur; },
        presets: presets, savePreset: savePreset, loadPreset: loadPreset, exportJson: exportJson, importJson: importJson, fmt: fmt, onChange: function(f){ listeners.push(f); }};
    root.PKSet = api; load();
})(typeof window !== "undefined" ? window : globalThis);
