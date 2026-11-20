"use strict";
// ===== GAME8 共通基盤 =====
// ・three.js の描画セットアップ（高精細寄りのライト・影・トーンマッピング）
// ・C++(WebAssembly) の物理エンジン（game8.wasm.js / game8.wasm.wasm）の読みこみ
// ・キーボード／画面ボタンの入力をまとめる
// ・タイトル・あそびかた・プレイ・けっか の画面切り替え、一時停止・出口
import * as T from "../vendor/three/build/three.module.js";

const $ = (id) => document.getElementById(id);
const scrs = {};
["s-title", "s-how", "s-play", "s-res"].forEach((id) => { scrs[id] = $(id); });
function showScreen(id){
    Object.keys(scrs).forEach((k) => scrs[k].classList.toggle("on", k === id));
    $("pad").hidden = id !== "s-play";
    $("pauseBtn").hidden = id !== "s-play";
}

// ---------- 入力（キーボード＋画面ボタン。プロコンは下の「ゲームパッド」） ----------
export const Input = {left: false, right: false, jump: false, jumpEdge: false};
const KEYMAP = {ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "jump", KeyW: "jump", Space: "jump"};
let jumpHeldPrev = false;
window.addEventListener("keydown", (e) => {
    const k = KEYMAP[e.code]; if(!k) return;
    if(k === "jump" && !Input.jump) Input.jumpEdge = true;
    Input[k] = true;
    if(e.code === "Space" || e.code.indexOf("Arrow") === 0) e.preventDefault();
}, {passive: false});
window.addEventListener("keyup", (e) => { const k = KEYMAP[e.code]; if(k) Input[k] = false; });
(function setupPad(){
    const pad = $("pad");
    pad.querySelectorAll(".tb").forEach((btn) => {
        const k = btn.dataset.k;
        const on = (e) => { e.preventDefault(); if(k === "jump" && !Input.jump) Input.jumpEdge = true; Input[k] = true; btn.classList.add("on"); };
        const off = (e) => { if(e) e.preventDefault(); Input[k] = false; btn.classList.remove("on"); };
        btn.addEventListener("pointerdown", on);
        btn.addEventListener("pointerup", off);
        btn.addEventListener("pointerleave", off);
        btn.addEventListener("pointercancel", off);
    });
})();
export function consumeJumpEdge(){ const v = Input.jumpEdge; Input.jumpEdge = false; return v; }

// ---------- three.js 描画セットアップ（高精細寄り） ----------
const canvas = $("cv");
export const renderer = new T.WebGLRenderer({canvas, antialias: true, powerPreference: "high-performance"});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
export const camera = new T.PerspectiveCamera(55, 1, 0.1, 2000);

export function makeLitScene(skyTop, skyBottom){
    const scene = new T.Scene();
    scene.fog = new T.Fog(skyBottom, 60, 420);
    const sky = new T.Mesh(new T.SphereGeometry(900, 16, 10), new T.MeshBasicMaterial({color: skyTop, side: T.BackSide, fog: false}));
    scene.add(sky);
    const hemi = new T.HemisphereLight(skyTop, 0x3a3020, 0.85);
    scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff3d8, 1.65);
    sun.position.set(60, 140, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -140; sun.shadow.camera.right = 140;
    sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -140;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 420;
    sun.shadow.bias = -0.0003;
    scene.add(sun, sun.target);
    const fill = new T.AmbientLight(0xffffff, 0.22);
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
        '<button type="button" id="pTitle">🏠 タイトルへ</button>' +
        '<button type="button" id="pExit">✖ 出口</button>';
    box.hidden = false;
    box.querySelector("#pResume").addEventListener("click", closePause);
    box.querySelector("#pTitle").addEventListener("click", () => { closePause(); if(onTitle) onTitle(); toTitle(); });
    box.querySelector("#pExit").addEventListener("click", () => { closePause(); if(window.AREExit) window.AREExit.open(); });
}
function closePause(){ paused = false; $("pauseBox").hidden = true; }
$("pauseBtn").addEventListener("click", () => { if(paused) closePause(); else openPause(); });
$("exitBtn").addEventListener("click", () => { if(window.AREExit) window.AREExit.open(); else location.href = "../index.html"; });

// ---------- ゲームパッド（Switch プロコンなど） ----------
// 十字キー／左スティック＝左右、A・B・X・Y＝ジャンプ、＋＝いちじ停止。タイトル・けっか・停止の箱も ボタンで 選べます。
const gp = {left: false, right: false, jump: false, prev: {}};
function setPad(k, on){
    if(gp[k] === on) return;
    gp[k] = on;
    if(on){ if(k === "jump" && !Input.jump) Input.jumpEdge = true; Input[k] = true; }
    else Input[k] = false;
}
function padPoll(){
    requestAnimationFrame(padPoll);
    let pads = [];
    try{ pads = navigator.getGamepads ? Array.prototype.slice.call(navigator.getGamepads()) : []; }catch(_e){}
    const p = pads.find((x) => x && x.connected);
    if(!p){ setPad("left", false); setPad("right", false); setPad("jump", false); gp.prev = {}; return; }
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    const ax = p.axes && p.axes.length ? p.axes[0] : 0;
    const playing = scrs["s-play"].classList.contains("on") && !paused;
    setPad("left", playing && (b(14) || ax < -0.45));
    setPad("right", playing && (b(15) || ax > 0.45));
    setPad("jump", playing && (b(0) || b(1) || b(2) || b(3) || b(12)));
    const now = {a: b(0), b: b(1), x: b(2), st: b(9)};
    const hit = (k) => now[k] && !gp.prev[k];
    const on = (id) => scrs[id].classList.contains("on");
    if(hit("st") && on("s-play")){ if(paused) closePause(); else openPause(); }
    else if(paused){ if(hit("a") || hit("b")) closePause(); }
    else if(on("s-title")){ if(hit("a") && !$("bAction").disabled) $("bAction").click(); else if(hit("x") && !$("bRace").disabled) $("bRace").click(); }
    else if(on("s-how")){ if(hit("a") || hit("b")) $("howBack").click(); }
    else if(on("s-res")){ if(hit("a")) $("rAgain").click(); else if(hit("b")) $("rTitleBtn").click(); }
    gp.prev = now;
}
requestAnimationFrame(padPoll);

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
    activeMode = mod.start({Input, G8, renderer, camera, makeLitScene, consumeJumpEdge, setHud, toast, showResult, isPaused: () => paused});
});
$("bRace").addEventListener("click", async () => {
    if(!G8mod) return;
    const mod = await import("./race.js");
    showScreen("s-play");
    activeMode = mod.start({Input, G8, renderer, camera, makeLitScene, consumeJumpEdge, setHud, toast, showResult, isPaused: () => paused});
});
