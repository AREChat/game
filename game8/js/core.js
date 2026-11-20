"use strict";
// ===== GAME8 共通基盤 =====
// ・three.js の描画セットアップ（高精細寄りのライト・影・トーンマッピング）
// ・C++(WebAssembly) の物理エンジン（game8.wasm.js / game8.wasm.wasm）の読みこみ
// ・キーボード／画面ボタン／プロコン（ゲームパッド）の入力をまとめる
// ・タイトル・あそびかた・せってい・プレイ・けっか の画面切り替え、一時停止・出口
import * as T from "../vendor/three/build/three.module.js";

const $ = (id) => document.getElementById(id);
const scrs = {};
["s-title", "s-how", "s-set", "s-play", "s-res"].forEach((id) => { scrs[id] = $(id); });
function showScreen(id){
    Object.keys(scrs).forEach((k) => scrs[k].classList.toggle("on", k === id));
    $("pad").hidden = id !== "s-play" || !settings.padVisible;
    $("pauseBtn").hidden = id !== "s-play";
}

// ---------- せってい（キー変更・画面のボタン・グラフィック品質）----------
const SKEY = "game8_settings_v1";
const settings = {jumpKey: "Space", padVisible: true, quality: "high"};
(function loadSettings(){
    try{
        const o = JSON.parse(localStorage.getItem(SKEY) || "null");
        if(o && typeof o === "object"){
            if(typeof o.jumpKey === "string") settings.jumpKey = o.jumpKey;
            if(typeof o.padVisible === "boolean") settings.padVisible = o.padVisible;
            if(o.quality === "high" || o.quality === "low") settings.quality = o.quality;
        }
    }catch(_e){}
})();
function saveSettings(){ try{ localStorage.setItem(SKEY, JSON.stringify(settings)); }catch(_e){} }

// ---------- 入力（キーボード＋画面ボタン＋プロコン）----------
// 入力もと（キー／タッチ／プロコン）を まとめて、どれか1つでも 押されていれば ON にする
export const Input = {left: false, right: false, jump: false, jumpEdge: false};
const src = {left: {}, right: {}, jump: {}};
let jumpCombinedPrev = false;
function setSrc(action, id, on){
    if(on) src[action][id] = 1; else delete src[action][id];
    Input[action] = Object.keys(src[action]).length > 0;
    if(action === "jump"){
        if(Input.jump && !jumpCombinedPrev) Input.jumpEdge = true;
        jumpCombinedPrev = Input.jump;
    }
}
export function consumeJumpEdge(){ const v = Input.jumpEdge; Input.jumpEdge = false; return v; }

const MOVEMAP = {ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right"};
const KEYNAME = {Space: "スペース", ArrowUp: "↑", KeyW: "W", Enter: "Enter"};
function keyLabel(code){ return KEYNAME[code] || code.replace(/^Key/, "").replace(/^Digit/, ""); }
window.addEventListener("keydown", (e) => {
    if(remapWaiting){ remapWaiting(e.code); return; }
    const mv = MOVEMAP[e.code];
    if(mv){ setSrc(mv, "key", true); e.preventDefault(); return; }
    if(e.code === settings.jumpKey || e.code === "ArrowUp" || e.code === "KeyW"){ setSrc("jump", "key", true); if(e.code === "Space" || e.code.indexOf("Arrow") === 0) e.preventDefault(); }
}, {passive: false});
window.addEventListener("keyup", (e) => {
    const mv = MOVEMAP[e.code];
    if(mv){ setSrc(mv, "key", false); return; }
    if(e.code === settings.jumpKey || e.code === "ArrowUp" || e.code === "KeyW") setSrc("jump", "key", false);
});
(function setupPad(){
    const pad = $("pad");
    pad.querySelectorAll(".tb").forEach((btn) => {
        const k = btn.dataset.k;
        const on = (e) => { e.preventDefault(); setSrc(k, "touch", true); btn.classList.add("on"); };
        const off = (e) => { if(e) e.preventDefault(); setSrc(k, "touch", false); btn.classList.remove("on"); };
        btn.addEventListener("pointerdown", on);
        btn.addEventListener("pointerup", off);
        btn.addEventListener("pointerleave", off);
        btn.addEventListener("pointercancel", off);
    });
})();

// ---------- プロコン（ゲームパッド）----------
let gpSeen = false;
function pollGamepad(){
    try{
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = pads && pads[0];
        if(gp){
            gpSeen = true;
            const axis = gp.axes && gp.axes.length ? gp.axes[0] : 0;
            const dpadL = gp.buttons[14] && gp.buttons[14].pressed, dpadR = gp.buttons[15] && gp.buttons[15].pressed;
            setSrc("left", "gp", axis < -0.35 || dpadL);
            setSrc("right", "gp", axis > 0.35 || dpadR);
            const faceBtn = [0, 1, 2, 3].some((i) => gp.buttons[i] && gp.buttons[i].pressed);
            const rt = gp.buttons[7] && gp.buttons[7].pressed;
            setSrc("jump", "gp", !!(faceBtn || rt));
        }else if(gpSeen){
            setSrc("left", "gp", false); setSrc("right", "gp", false); setSrc("jump", "gp", false);
        }
    }catch(_e){}
    requestAnimationFrame(pollGamepad);
}
requestAnimationFrame(pollGamepad);

// ---------- three.js 描画セットアップ（高精細寄り） ----------
const canvas = $("cv");
export const renderer = new T.WebGLRenderer({canvas, antialias: true, powerPreference: "high-performance"});
export const camera = new T.PerspectiveCamera(55, 1, 0.1, 2000);
function applyQuality(){
    const high = settings.quality === "high";
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 2 : 1));
    renderer.shadowMap.enabled = high;
}
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.type = T.PCFSoftShadowMap;
applyQuality();

// 空：上下でグラデーションがかかった、きれいな空（単色の球より 豪華に見える）
function makeSkyDome(top, bottom){
    const geo = new T.SphereGeometry(900, 20, 14);
    const colTop = new T.Color(top), colBottom = new T.Color(bottom);
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3);
    for(let i = 0; i < pos.count; i++){
        const y = pos.getY(i) / 900, t = Math.pow(Math.max(0, (y + 1) / 2), 0.7);
        const c = colBottom.clone().lerp(colTop, t);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new T.BufferAttribute(colors, 3));
    const mat = new T.MeshBasicMaterial({vertexColors: true, side: T.BackSide, fog: false});
    return new T.Mesh(geo, mat);
}
export function makeLitScene(skyTop, skyBottom){
    const scene = new T.Scene();
    scene.fog = new T.Fog(skyBottom, 70, 440);
    scene.add(makeSkyDome(skyTop, skyBottom));
    const hemi = new T.HemisphereLight(skyTop, 0x3a3020, 0.9);
    scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff3d8, 1.8);
    sun.position.set(60, 140, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -140; sun.shadow.camera.right = 140;
    sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -140;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 420;
    sun.shadow.bias = -0.0003;
    scene.add(sun, sun.target);
    // 反対側から あわく差す色つきの縁光（リムライト）→ 立体感とツヤを足す
    const rim = new T.DirectionalLight(0x7ec8ff, 0.55);
    rim.position.set(-80, 60, -70);
    scene.add(rim);
    const fill = new T.AmbientLight(0xffffff, 0.24);
    scene.add(fill);
    return scene;
}

function resize(){
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// ---------- HUD・トースト ----------
export function setHud(html){ $("hud").innerHTML = html; }
let toastT = 0;
export function toast(text, ms){
    const e = $("toast"); e.textContent = text; e.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove("on"), ms || 1600);
}

// ---------- けっか画面 ----------
let onAgain = null, onTitle = null;
export function showResult(title, bodyHtml, again, backToTitle){
    $("rTitle").textContent = title;
    $("rBody").innerHTML = bodyHtml;
    onAgain = again; onTitle = backToTitle;
    showScreen("s-res");
}
$("rAgain").addEventListener("click", () => { if(onAgain) onAgain(); });
$("rTitleBtn").addEventListener("click", () => { if(onTitle) onTitle(); toTitle(); });

// ---------- 一時停止・出口 ----------
export let paused = false;
function openPause(){
    paused = true;
    const box = $("pauseBox");
    box.innerHTML = '<h2>⏸ いちじ停止</h2>' +
        '<button type="button" id="pResume">▶ つづける</button>' +
        '<button type="button" id="pSet">⚙ せってい</button>' +
        '<button type="button" id="pTitle">🏠 タイトルへ</button>' +
        '<button type="button" id="pExit">✖ 出口</button>';
    box.hidden = false;
    box.querySelector("#pResume").addEventListener("click", closePause);
    box.querySelector("#pSet").addEventListener("click", () => { closePause(); openSettings(() => openPause()); });
    box.querySelector("#pTitle").addEventListener("click", () => { closePause(); if(onTitle) onTitle(); toTitle(); });
    box.querySelector("#pExit").addEventListener("click", () => { closePause(); if(window.AREExit) window.AREExit.open(); });
}
function closePause(){ paused = false; $("pauseBox").hidden = true; }
$("pauseBtn").addEventListener("click", () => { if(paused) closePause(); else openPause(); });

// 出口ボタンの表示（空だと「文字化け」のように見えるため、ラベルを必ず入れる）
function paintExit(){ const b = $("exitBtn"); b.textContent = window.AREExit ? window.AREExit.label() : "✖ 出口"; }
$("exitBtn").addEventListener("click", () => { if(window.AREExit) window.AREExit.open(); else location.href = "../index.html"; });
paintExit();
setTimeout(paintExit, 300); // are-mode.js の判定が 少し遅れて そろうことがあるため

// ---------- せってい画面 ----------
let remapWaiting = null, settingsReturnTo = null;
function paintSettings(){
    const sec = $("s-set");
    sec.innerHTML =
        '<h2>⚙ せってい</h2>' +
        '<div class="panel">' +
        '<h3>ジャンプ・アクセルのボタン</h3>' +
        '<p>いまのキー：<b id="jkLabel">' + keyLabel(settings.jumpKey) + '</b></p>' +
        '<button type="button" id="jkRemap">🔁 キーを変える</button>' +
        '<h3>画面のボタン</h3>' +
        '<label style="display:flex;align-items:center;gap:8px;font-size:14px"><input type="checkbox" id="padToggle"' + (settings.padVisible ? " checked" : "") + '> 画面に 操作ボタンを 出す（スマホ・タブレット向け）</label>' +
        '<h3>グラフィック</h3>' +
        '<div class="row"><button type="button" id="qHigh" class="' + (settings.quality === "high" ? "on" : "") + '">✨ きれい（高品質）</button><button type="button" id="qLow" class="' + (settings.quality === "low" ? "on" : "") + '">⚡ かるい（高速）</button></div>' +
        '</div>' +
        '<button id="setBack" type="button">もどる</button>';
    sec.querySelector("#jkRemap").addEventListener("click", () => {
        sec.querySelector("#jkRemap").textContent = "キーを おしてください…";
        remapWaiting = (code) => {
            remapWaiting = null;
            settings.jumpKey = code; saveSettings();
            paintSettings();
        };
    });
    sec.querySelector("#padToggle").addEventListener("change", (e) => {
        settings.padVisible = e.target.checked; saveSettings();
        $("pad").hidden = !scrs["s-play"].classList.contains("on") || !settings.padVisible;
    });
    sec.querySelector("#qHigh").addEventListener("click", () => { settings.quality = "high"; saveSettings(); applyQuality(); paintSettings(); });
    sec.querySelector("#qLow").addEventListener("click", () => { settings.quality = "low"; saveSettings(); applyQuality(); paintSettings(); });
    sec.querySelector("#setBack").addEventListener("click", () => { const back = settingsReturnTo; settingsReturnTo = null; if(back) back(); else showScreen("s-title"); });
}
function openSettings(returnTo){ settingsReturnTo = returnTo || null; paintSettings(); showScreen("s-set"); }
$("bSet").addEventListener("click", () => openSettings(null));

// ---------- ゲームパッド：メニュー操作（移動・ジャンプは上の pollGamepad が担当） ----------
// A・B・X・Y＝決定／もどる、＋＝いちじ停止。タイトル・あそびかた・けっか・停止の箱も ボタンで 選べます。
const gpMenuPrev = {};
function padMenuPoll(){
    requestAnimationFrame(padMenuPoll);
    let pads = [];
    try{ pads = navigator.getGamepads ? Array.prototype.slice.call(navigator.getGamepads()) : []; }catch(_e){}
    const p = pads.find((x) => x && x.connected);
    if(!p){ gpMenuPrev.a = gpMenuPrev.b = gpMenuPrev.x = gpMenuPrev.st = false; return; }
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    const now = {a: b(0), b: b(1), x: b(2), st: b(9)};
    const hit = (k) => now[k] && !gpMenuPrev[k];
    const on = (id) => scrs[id].classList.contains("on");
    if(hit("st") && on("s-play")){ if(paused) closePause(); else openPause(); }
    else if(paused){ if(hit("a") || hit("b")) closePause(); }
    else if(on("s-title")){ if(hit("a") && !$("bAction").disabled) $("bAction").click(); else if(hit("x") && !$("bRace").disabled) $("bRace").click(); }
    else if(on("s-how")){ if(hit("a") || hit("b")) $("howBack").click(); }
    else if(on("s-res")){ if(hit("a")) $("rAgain").click(); else if(hit("b")) $("rTitleBtn").click(); }
    gpMenuPrev.a = now.a; gpMenuPrev.b = now.b; gpMenuPrev.x = now.x; gpMenuPrev.st = now.st;
}
requestAnimationFrame(padMenuPoll);

// ---------- タイトル・あそびかた ----------
let activeMode = null; // {stop()}
function toTitle(){
    if(activeMode && activeMode.stop){ try{ activeMode.stop(); }catch(_e){} }
    activeMode = null; closePause();
    showScreen("s-title");
}
$("bHow").addEventListener("click", () => showScreen("s-how"));
$("howBack").addEventListener("click", () => showScreen("s-title"));

// ---------- 起動：WASM を読みこんでから、モード選択を有効にする ----------
let G8mod = null;
export const G8 = {};
async function boot(){
    try{
        G8mod = await window.Game8Module();
        const c = (name, ret, args) => G8mod.cwrap(name, ret, args);
        G8.act_reset = c("act_reset", null, ["number", "number"]);
        G8.act_add_platform = c("act_add_platform", "number", ["number", "number", "number", "number", "number"]);
        G8.act_add_enemy = c("act_add_enemy", "number", ["number", "number", "number", "number"]);
        G8.act_add_coin = c("act_add_coin", "number", ["number", "number"]);
        G8.act_set_goal = c("act_set_goal", null, ["number", "number", "number", "number"]);
        G8.act_step = c("act_step", null, ["number", "number", "number", "number", "number"]);
        G8.act_get_buffer = c("act_get_buffer", "number", []);
        G8.race_reset = c("race_reset", null, ["number"]);
        G8.race_add_waypoint = c("race_add_waypoint", null, ["number", "number"]);
        G8.race_set_width = c("race_set_width", null, ["number"]);
        G8.race_add_car = c("race_add_car", "number", ["number", "number", "number", "number", "number", "number"]);
        G8.race_step = c("race_step", null, ["number", "number", "number", "number"]);
        G8.race_get_buffer = c("race_get_buffer", "number", []);
        G8.heap = () => G8mod.HEAPF32;
        window.G8 = G8; // デバッグ・動作確認用（ゲームの動きには関係しません）
        $("boot").classList.add("off");
        resize();
        $("bAction").disabled = false; $("bRace").disabled = false;
    }catch(err){
        $("boot").textContent = "読みこみに失敗しました。再読み込みしてください。";
        console.error(err);
    }
}
$("bAction").disabled = true; $("bRace").disabled = true;
boot();

$("bAction").addEventListener("click", async () => {
    if(!G8mod) return;
    const mod = await import("./action.js");
    showScreen("s-play");
    $("pad").hidden = !settings.padVisible;
    activeMode = mod.start({Input, G8, renderer, camera, makeLitScene, consumeJumpEdge, setHud, toast, showResult, isPaused: () => paused});
});
$("bRace").addEventListener("click", async () => {
    if(!G8mod) return;
    const mod = await import("./race.js");
    showScreen("s-play");
    $("pad").hidden = !settings.padVisible;
    activeMode = mod.start({Input, G8, renderer, camera, makeLitScene, consumeJumpEdge, setHud, toast, showResult, isPaused: () => paused});
});
