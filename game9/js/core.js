"use strict";
// ===== GAME9「Cuisine Royale（キュイジーヌロワイヤル）」本体 =====
// ・3Dの射的（シューティングギャラリー）ゲーム。画面をタップ／クリックして、向かってくる「食べもの・調理道具」を撃ちます。
// ・虫は一切出てきません（敵はすべて食べもの・調理道具モチーフです）。
// ・パソコンはマウス、スマホ・タブレットは指で操作できます（狙う＝動かす、撃つ＝タップ／クリック）。
import * as T from "../vendor/three/build/three.module.js";
import {STAGES} from "./stages.js";

const $ = (id) => document.getElementById(id);
const scrs = {};
["s-title","s-how","s-set","s-play","s-res"].forEach((id) => { scrs[id] = $(id); });
function showScreen(id){ Object.keys(scrs).forEach((k) => scrs[k].classList.toggle("on", k === id)); }

// ---------- 進捗・せってい（この端末だけに保存） ----------
const PKEY = "game9_progress_v1", SKEY = "game9_settings_v1";
let unlocked = 0;
try{ unlocked = Math.max(0, Math.min(STAGES.length - 1, parseInt(localStorage.getItem(PKEY) || "0", 10) || 0)); }catch(_e){}
function saveProgress(idx){
    unlocked = Math.max(unlocked, idx);
    try{ localStorage.setItem(PKEY, String(unlocked)); }catch(_e){}
}
const settings = {bgm: 0.6, se: 0.8};
(function loadSettings(){
    try{
        const o = JSON.parse(localStorage.getItem(SKEY) || "null");
        if(o && typeof o === "object"){
            if(typeof o.bgm === "number") settings.bgm = o.bgm;
            if(typeof o.se === "number") settings.se = o.se;
        }
    }catch(_e){}
})();
function saveSettings(){ try{ localStorage.setItem(SKEY, JSON.stringify(settings)); }catch(_e){} }

// ---------- 効果音（アセット不要。WebAudioで短い音をその場で鳴らす） ----------
let actx = null;
function beep(freq, dur, type, vol){
    try{
        if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || "sine"; o.frequency.value = freq;
        g.gain.value = (vol == null ? 1 : vol) * settings.se;
        o.connect(g); g.connect(actx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
        o.stop(actx.currentTime + dur);
    }catch(_e){}
}
const sfxShoot = () => beep(880, 0.08, "square", 0.25);
const sfxHit = () => beep(260, 0.18, "sawtooth", 0.35);
const sfxMiss = () => beep(140, 0.12, "sine", 0.2);
const sfxClear = () => { beep(523, 0.15, "triangle", 0.4); setTimeout(() => beep(784, 0.25, "triangle", 0.4), 140); };
const sfxOver = () => { beep(220, 0.3, "sawtooth", 0.4); setTimeout(() => beep(140, 0.4, "sawtooth", 0.4), 200); };

// ---------- BGM ----------
let bgmEl = null;
function playBgm(src){
    stopBgm();
    bgmEl = new Audio(src);
    bgmEl.loop = true;
    bgmEl.volume = settings.bgm;
    bgmEl.play().catch(() => { /* まだ曲ファイルが無い場合は無音のまま続行 */ });
}
function stopBgm(){ if(bgmEl){ try{ bgmEl.pause(); }catch(_e){} bgmEl = null; } }

// ---------- 3D シーン ----------
const canvas = $("cv");
const renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, 0.1, 60);
camera.position.set(0, 1.5, 6);
const raycaster = new T.Raycaster();
const ndc = new T.Vector2();

const hemi = new T.HemisphereLight(0xffffff, 0x202020, 1.1);
scene.add(hemi);
const key = new T.DirectionalLight(0xffffff, 1.0);
key.position.set(3, 6, 4);
scene.add(key);

const floorGeo = new T.PlaneGeometry(14, 40);
const floorMat = new T.MeshStandardMaterial({color:0x201418, roughness:0.9});
const floor = new T.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -1, -8);
scene.add(floor);

function resize(){
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// ---------- 敵（食べもの・調理道具）の見た目 ----------
const geoCache = {};
function geoFor(shape){
    if(geoCache[shape]) return geoCache[shape];
    let g;
    if(shape === "box") g = new T.BoxGeometry(1, 1, 1);
    else if(shape === "cylinder") g = new T.CylinderGeometry(0.6, 0.6, 1, 20);
    else if(shape === "cone") g = new T.ConeGeometry(0.65, 1.1, 20);
    else if(shape === "icosahedron") g = new T.IcosahedronGeometry(0.7, 0);
    else g = new T.SphereGeometry(0.6, 20, 16);
    geoCache[shape] = g;
    return g;
}
function makeEnemyMesh(def){
    const geo = geoFor(def.shape);
    const mat = new T.MeshStandardMaterial({color:def.color, roughness:0.45, metalness:0.08, emissive:def.color, emissiveIntensity:0.08});
    const mesh = new T.Mesh(geo, mat);
    const scale = def.r || 0.4;
    mesh.scale.setScalar(scale);
    return mesh;
}

// ---------- ゲーム状態 ----------
const G = {
    running:false, stageIdx:0, stage:null, kills:0, score:0, lives:5,
    enemies:[], spawnTimer:0, spawnMs:1000, elapsed:0, boss:null, bossHp:0, bossHpMax:0
};
const enemyGroup = new T.Group();
scene.add(enemyGroup);

function clearEnemies(){
    enemyGroup.clear();
    G.enemies = [];
    G.boss = null;
}

function spawnEnemy(def, isBoss){
    const mesh = makeEnemyMesh(def);
    const x = isBoss ? 0 : (Math.random() * 2 - 1) * 4.2;
    const y = isBoss ? 1.2 : (Math.random() * 1.6);
    mesh.position.set(x, y, -26);
    mesh.userData = {def, isBoss, hp: isBoss ? (def.hp || 12) : 1, spin:(Math.random() - 0.5) * 2};
    enemyGroup.add(mesh);
    G.enemies.push(mesh);
    if(isBoss){ G.boss = mesh; G.bossHp = mesh.userData.hp; G.bossHpMax = mesh.userData.hp; }
}

function damagePlayer(n){
    G.lives = Math.max(0, G.lives - n);
    paintHud();
    if(G.lives <= 0) endStage(false);
}

function destroyEnemy(mesh, byPlayer){
    const idx = G.enemies.indexOf(mesh);
    if(idx >= 0) G.enemies.splice(idx, 1);
    enemyGroup.remove(mesh);
    if(mesh.userData.isBoss){
        G.boss = null;
        if(byPlayer){ G.score += 500; sfxClear(); endStage(true); }
        return;
    }
    if(byPlayer){ G.kills++; G.score += 10; paintHud(); if(G.kills >= G.stage.target && !G.stage.boss) endStage(true); }
}

function tryShoot(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(G.enemies, false);
    sfxShoot();
    muzzleFlash(ndc.x, ndc.y);
    if(!hits.length){ sfxMiss(); return; }
    const mesh = hits[0].object;
    if(mesh.userData.isBoss){
        G.bossHp -= 1; paintHud();
        if(G.bossHp <= 0) destroyEnemy(mesh, true); else sfxHit();
        return;
    }
    sfxHit();
    destroyEnemy(mesh, true);
}

function muzzleFlash(ndcX, ndcY){
    const el2 = $("flash");
    el2.style.left = ((ndcX + 1) / 2 * 100) + "%";
    el2.style.top = ((1 - ndcY) / 2 * 100) + "%";
    el2.classList.remove("go"); void el2.offsetWidth; el2.classList.add("go");
}

// ---------- ループ ----------
let lastT = 0;
function loop(t){
    if(!G.running){ return; }
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    G.elapsed += dt;

    if(!G.boss){
        G.spawnTimer -= dt * 1000;
        if(G.spawnTimer <= 0){
            G.spawnTimer = G.spawnMs;
            const cast = G.stage.cast;
            spawnEnemy(cast[Math.floor(Math.random() * cast.length)], false);
        }
    }else if(G.stage.boss && G.enemies.length === 0 && !enemyGroup.children.includes(G.boss)){
        // ボスがまだ出ていなければ出す（初回）
    }

    const speed = G.stage.speed;
    for(let i = G.enemies.length - 1; i >= 0; i--){
        const mesh = G.enemies[i];
        if(mesh.userData.isBoss){
            mesh.rotation.y += dt * 0.6;
            mesh.position.z = Math.min(-6, mesh.position.z + dt * 0.4);
            continue;
        }
        mesh.position.z += dt * speed * 6;
        mesh.rotation.x += dt * mesh.userData.spin;
        mesh.rotation.y += dt * mesh.userData.spin * 0.7;
        if(mesh.position.z > 4.5){
            destroyEnemy(mesh, false);
            damagePlayer(1);
        }
    }

    // 最終ステージ：ボスをまだ出していなければ、開始2秒後に出す
    if(G.stage.boss && !G.boss && G.elapsed > 2 && !G._bossSpawned){
        G._bossSpawned = true;
        spawnEnemy(G.stage.bossCast, true);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

// ---------- HUD ----------
function paintHud(){
    $("hudScore").textContent = "スコア " + G.score;
    $("hudLives").textContent = "❤️".repeat(Math.max(0, G.lives)) + "🖤".repeat(Math.max(0, 5 - G.lives));
    if(G.stage.boss){
        $("hudProgress").textContent = G.boss ? ("ボス残りHP " + Math.max(0, G.bossHp) + " / " + G.bossHpMax) : "ボス出現まで…";
    }else{
        $("hudProgress").textContent = "撃破 " + G.kills + " / " + G.stage.target;
    }
}

// ---------- ステージ開始・終了 ----------
function startStage(idx){
    G.stageIdx = idx;
    G.stage = STAGES[idx];
    G.kills = 0; G.score = 0; G.lives = 5; G.spawnTimer = 300; G.elapsed = 0; G._bossSpawned = false;
    clearEnemies();
    scene.background = new T.Color(G.stage.sky[0]);
    scene.fog = new T.Fog(G.stage.fog, 8, 30);
    floorMat.color.setHex(G.stage.sky[1]);
    $("playTitle").textContent = G.stage.title;
    $("playSub").textContent = G.stage.composer;
    paintHud();
    showScreen("s-play");
    resize();
    G.running = true;
    lastT = performance.now();
    requestAnimationFrame(loop);
    playBgm(G.stage.track);
}

function endStage(cleared){
    G.running = false;
    stopBgm();
    if(cleared){
        saveProgress(Math.min(STAGES.length - 1, G.stageIdx + 1));
        sfxClear();
        $("resTitle").textContent = "🎉 クリア！";
        $("resBody").textContent = G.stage.title + " をクリアしました（スコア " + G.score + "）";
        $("resNext").hidden = (G.stageIdx + 1 >= STAGES.length);
    }else{
        sfxOver();
        $("resTitle").textContent = "💥 ゲームオーバー";
        $("resBody").textContent = G.stage.title + "：撃破 " + G.kills + " / " + G.stage.target + "（スコア " + G.score + "）";
        $("resNext").hidden = true;
    }
    showScreen("s-res");
}

// ---------- タイトル：ステージ選択 ----------
function paintStageSelect(){
    const box = $("stageSelect");
    box.innerHTML = STAGES.map((s, i) => {
        const lock = i > unlocked;
        return '<button type="button" class="stagebtn' + (lock ? " locked" : "") + '" data-i="' + i + '"' + (lock ? " disabled" : "") + '>' +
            '<span class="st">' + (lock ? "🔒 未開放" : s.title) + '</span>' +
            (lock ? "" : '<span class="sc">' + s.composer + '</span>') + '</button>';
    }).join("");
}

// ---------- 入力（マウス・タッチ共通）----------
canvas.addEventListener("pointerdown", (event) => { if(G.running) tryShoot(event.clientX, event.clientY); });

// ---------- 画面のボタン ----------
$("bHow").addEventListener("click", () => showScreen("s-how"));
$("bHowBack").addEventListener("click", () => showScreen("s-title"));
$("bSet").addEventListener("click", () => {
    $("volBgm").value = settings.bgm; $("volSe").value = settings.se;
    showScreen("s-set");
});
$("bSetBack").addEventListener("click", () => showScreen("s-title"));
$("volBgm").addEventListener("input", (event) => { settings.bgm = Number(event.target.value); if(bgmEl) bgmEl.volume = settings.bgm; saveSettings(); });
$("volSe").addEventListener("input", (event) => { settings.se = Number(event.target.value); saveSettings(); });
$("stageSelect").addEventListener("click", (event) => {
    const b = event.target.closest("[data-i]"); if(!b || b.disabled) return;
    startStage(Number(b.dataset.i));
});
$("resRetry").addEventListener("click", () => startStage(G.stageIdx));
$("resNext").addEventListener("click", () => startStage(Math.min(STAGES.length - 1, G.stageIdx + 1)));
$("resTitleBtn").addEventListener("click", () => { paintStageSelect(); showScreen("s-title"); });
$("exitBtn").addEventListener("click", () => {
    if(scrs["s-play"].classList.contains("on")){ G.running = false; stopBgm(); paintStageSelect(); showScreen("s-title"); return; }
    try{ const back = new URLSearchParams(location.search).get("back"); location.href = back || "../index.html"; }catch(_e){ history.back(); }
});

paintStageSelect();
resize();
$("boot").classList.add("off");
