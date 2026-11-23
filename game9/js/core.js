"use strict";
// ===== GAME9「AREshoot（美食の晩餐会）」本体 =====
// 厨房を舞台にした3Dガンシューティング（TPS）。
// 物理・当たり判定・索敵AI・弾道計算は C++(WebAssembly: cpp/game9.cpp) 側が行い、
// ここ（JS側）は three.js での描画・カメラ制御・入力・HUD・画面遷移だけを担当する（game8と同じ設計方針）。
import * as T from "../vendor/three/build/three.module.js";
import {STAGES, difficultyFor} from "./stages.js";

// 武器種（C++側 cpp/game9.cpp の WEAPONS テーブルと同じ並び順・同じ3種）
const WEAPONS = [
    {name:"ライフル",          icon:"🔫", key:"1"},
    {name:"サブマシンガン",     icon:"⚡", key:"2"},
    {name:"スナイパーライフル", icon:"🎯", key:"3"},
];

const $ = (id) => document.getElementById(id);
const scrs = {};
["s-title","s-how","s-set","s-play","s-res","s-br"].forEach((id) => { scrs[id] = $(id); });
function showScreen(id){ Object.keys(scrs).forEach((k) => scrs[k].classList.toggle("on", k === id)); document.body.classList.toggle("g9br", id === "s-br"); }

// ---------- 進捗・せってい（この端末だけに保存） ----------
const PKEY = "game9_progress_v2", SKEY = "game9_settings_v2";
let unlocked = 0;
try{ unlocked = Math.max(0, Math.min(STAGES.length - 1, parseInt(localStorage.getItem(PKEY) || "0", 10) || 0)); }catch(_e){}
function saveProgress(idx){
    unlocked = Math.max(unlocked, idx);
    try{ localStorage.setItem(PKEY, String(unlocked)); }catch(_e){}
}
const settings = {bgm: 0.6, se: 0.8, sens: 1.1};
(function loadSettings(){
    try{
        const o = JSON.parse(localStorage.getItem(SKEY) || "null");
        if(o && typeof o === "object"){
            if(typeof o.bgm === "number") settings.bgm = o.bgm;
            if(typeof o.se === "number") settings.se = o.se;
            if(typeof o.sens === "number") settings.sens = o.sens;
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
const sfxShoot = () => beep(1200, 0.045, "square", 0.14);
const sfxHit = () => beep(300, 0.1, "sawtooth", 0.3);
const sfxEnemyDown = () => beep(180, 0.22, "sawtooth", 0.4);
const sfxReload = () => { beep(500, 0.08, "square", 0.2); setTimeout(() => beep(700, 0.08, "square", 0.2), 120); };
const sfxGrenade = () => beep(90, 0.3, "sawtooth", 0.45);
const sfxHurt = () => beep(160, 0.18, "sawtooth", 0.4);
const sfxClear = () => { beep(523, 0.15, "triangle", 0.4); setTimeout(() => beep(784, 0.25, "triangle", 0.4), 140); };
const sfxOver = () => { beep(220, 0.3, "sawtooth", 0.4); setTimeout(() => beep(140, 0.4, "sawtooth", 0.4), 200); };
const sfxSwitch = () => beep(700, 0.06, "triangle", 0.22);

// ---------- BGM ----------
let bgmEl = null;
function playBgm(src){
    stopBgm();
    bgmEl = new Audio(src);
    bgmEl.loop = true;
    bgmEl.volume = settings.bgm;
    bgmEl.play().catch(() => {});
}
function stopBgm(){ if(bgmEl){ try{ bgmEl.pause(); }catch(_e){} bgmEl = null; } }

// ---------- 3D シーン ----------
const canvas = $("cv");
const renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(66, 1, 0.1, 120);

function resize(){
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// ---------- 入力 ----------
const Input = {moveF:0, moveS:0, yaw:0, firing:false, reload:false, grenade:false, weaponSwitch:-1};
window.G9Input = Input; // 動作確認・デバッグ用（ゲームの動きには関係しません）
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if(e.code === "KeyR") Input.reload = true;
    if(e.code === "ShiftLeft" || e.code === "ShiftRight") Input.grenade = true;
    if(e.code === "Digit1" || e.code === "Numpad1") Input.weaponSwitch = 0;
    if(e.code === "Digit2" || e.code === "Numpad2") Input.weaponSwitch = 1;
    if(e.code === "Digit3" || e.code === "Numpad3") Input.weaponSwitch = 2;
    if(e.code === "KeyQ" || e.code === "Tab"){ e.preventDefault(); Input.weaponSwitch = (G.curWeapon + 1) % WEAPONS.length; }
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });
function keyboardMove(){
    let f = 0, s = 0;
    if(keys.KeyW || keys.ArrowUp) f += 1;
    if(keys.KeyS || keys.ArrowDown) f -= 1;
    if(keys.KeyD || keys.ArrowRight) s += 1;
    if(keys.KeyA || keys.ArrowLeft) s -= 1;
    return {f, s};
}

// マウス：ポインターロックでのマウスルック（失敗時はドラッグ中のmovementXで代用） + 左クリックで発射
let mouseDown = false;
canvas.addEventListener("pointerdown", (e) => {
    if(e.pointerType === "mouse"){
        if(document.pointerLockElement !== canvas){ try{ canvas.requestPointerLock && canvas.requestPointerLock(); }catch(_e){} }
        Input.firing = true; mouseDown = true;
    }
});
window.addEventListener("pointerup", (e) => { if(e.pointerType === "mouse"){ Input.firing = false; mouseDown = false; } });
window.addEventListener("mousemove", (e) => {
    const locked = document.pointerLockElement === canvas;
    if(!locked && !mouseDown) return;   // ロック中は常に、ロックできない環境ではドラッグ中だけ視点を回す
    Input.yaw -= (e.movementX || 0) * 0.0026 * settings.sens;
});
window.addEventListener("contextmenu", (e) => { if(scrs["s-play"].classList.contains("on")) e.preventDefault(); });

// タッチ：左半分＝バーチャルスティック（移動）、右半分＝ドラッグで視点
const moveZone = $("moveZone"), lookZone = $("lookZone"), moveStick = $("moveStick");
let moveTouchId = null, moveOrigin = {x:0,y:0};
moveZone.addEventListener("pointerdown", (e) => {
    if(e.pointerType === "mouse") return;
    moveTouchId = e.pointerId; moveOrigin = {x:e.clientX, y:e.clientY};
    moveStick.style.display = "block";
    moveStick.style.left = (e.clientX - 43) + "px"; moveStick.style.top = (e.clientY - 43) + "px";
});
window.addEventListener("pointermove", (e) => {
    if(e.pointerId === moveTouchId){
        const dx = clampN(e.clientX - moveOrigin.x, -46, 46), dy = clampN(e.clientY - moveOrigin.y, -46, 46);
        Input.moveS = dx / 46; Input.moveF = -dy / 46;
        moveStick.querySelector && (moveStick.style.transform = "");
        moveStick.style.left = (moveOrigin.x - 43 + dx) + "px"; moveStick.style.top = (moveOrigin.y - 43 + dy) + "px";
    }
});
function endMoveTouch(e){
    if(e.pointerId === moveTouchId){ moveTouchId = null; Input.moveF = 0; Input.moveS = 0; moveStick.style.display = "none"; }
}
window.addEventListener("pointerup", endMoveTouch);
window.addEventListener("pointercancel", endMoveTouch);
function clampN(v, lo, hi){ return v < lo ? lo : (v > hi ? hi : v); }

let lookTouchId = null, lookLast = {x:0,y:0};
lookZone.addEventListener("pointerdown", (e) => {
    if(e.pointerType === "mouse") return;
    lookTouchId = e.pointerId; lookLast = {x:e.clientX, y:e.clientY};
});
window.addEventListener("pointermove", (e) => {
    if(e.pointerId === lookTouchId){
        const dx = e.clientX - lookLast.x;
        Input.yaw -= dx * 0.0048 * settings.sens;
        lookLast = {x:e.clientX, y:e.clientY};
    }
});
function endLookTouch(e){ if(e.pointerId === lookTouchId) lookTouchId = null; }
window.addEventListener("pointerup", endLookTouch);
window.addEventListener("pointercancel", endLookTouch);

// 画面ボタン（発射・リロード・グレネード）
function bindHold(el, onDown, onUp){
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); onDown(); el.classList.add("on"); });
    const off = () => { onUp(); el.classList.remove("on"); };
    el.addEventListener("pointerup", off); el.addEventListener("pointerleave", off); el.addEventListener("pointercancel", off);
}
bindHold($("bFire"), () => { Input.firing = true; }, () => { Input.firing = false; });
$("bReload").addEventListener("pointerdown", (e) => { e.preventDefault(); Input.reload = true; });
$("bGrenade").addEventListener("pointerdown", (e) => { e.preventDefault(); Input.grenade = true; });

// ---------- 武器切り替えUI（画面下の武器アイコン：PCのクリックでもスマホのタップでも操作できる） ----------
const weaponSelectEl = $("weaponSelect");
let weaponBtns = [];
function paintWeaponSelect(){
    weaponSelectEl.innerHTML = WEAPONS.map((w, i) =>
        '<button type="button" class="weaponBtn' + (i === G.curWeapon ? " active" : "") + '" data-i="' + i + '">' +
        '<span class="key">' + w.key + '</span>' + w.icon + '<span class="ammo"></span></button>'
    ).join("");
    weaponBtns = WEAPONS.map((_, i) => weaponSelectEl.querySelector('[data-i="' + i + '"]'));
    weaponBtns.forEach((b, i) => {
        if(!b) return;
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); Input.weaponSwitch = i; });
    });
}

// ---------- 見た目：共通マテリアル・ジオメトリ ----------
function makeCharacter(bodyColor, hatColor){
    const g = new T.Group();
    const body = new T.Mesh(new T.CapsuleGeometry(0.42, 0.78, 4, 10), new T.MeshStandardMaterial({color:bodyColor, roughness:0.55, metalness:0.1}));
    body.position.y = 0.95; body.castShadow = true; g.add(body);
    const head = new T.Mesh(new T.SphereGeometry(0.28, 16, 12), new T.MeshStandardMaterial({color:0xf0c8a0, roughness:0.6}));
    head.position.y = 1.72; head.castShadow = true; g.add(head);
    const hat = new T.Mesh(new T.CylinderGeometry(0.26, 0.3, 0.32, 14), new T.MeshStandardMaterial({color:hatColor, roughness:0.5}));
    hat.position.y = 2.02; hat.castShadow = true; g.add(hat);
    const gun = new T.Mesh(new T.BoxGeometry(0.14, 0.14, 0.7), new T.MeshStandardMaterial({color:0x2a2a2a, metalness:0.6, roughness:0.4}));
    gun.position.set(0.32, 1.05, 0.5); g.add(gun);
    g.userData.hitFlashMat = [body.material, head.material];
    return g;
}

const scene3d = {};
function buildStageScene(stage){
    scene.background = new T.Color(stage.sky[0]);
    scene.fog = new T.Fog(stage.fog, 14, 60);
    while(scene.children.length) scene.remove(scene.children[0]);

    const hemi = new T.HemisphereLight(stage.sky[0], 0x201810, 1.0);
    scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff3e0, 1.15);
    sun.position.set(14, 26, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
    sun.shadow.camera.far = 90;
    scene.add(sun);
    scene.add(new T.AmbientLight(0xffffff, 0.28));

    const floorMat = new T.MeshStandardMaterial({color:stage.floorColor, roughness:0.92});
    const floor = new T.Mesh(new T.PlaneGeometry(60, 60), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);
    const wallMat = new T.MeshStandardMaterial({color:stage.floorColor, roughness:0.95});
    const wallH = 6;
    [[0,-23,46,wallH,0],[0,23,46,wallH,0],[-23,0,wallH,46,Math.PI/2],[23,0,wallH,46,Math.PI/2]].forEach(([x,z,w,h,rot]) => {
        const wall = new T.Mesh(new T.BoxGeometry(w, h, 1), wallMat);
        wall.position.set(x, h/2, z); wall.rotation.y = rot; wall.receiveShadow = true;
        scene.add(wall);
    });

    scene3d.enemyMeshes = [];
    for(let i = 0; i < 10; i++){
        const m = makeCharacter(stage.enemyColor, 0xffffff);
        m.visible = false; scene.add(m); scene3d.enemyMeshes.push(m);
    }
    scene3d.player = makeCharacter(0x3a6fd9, 0xffffff);
    scene.add(scene3d.player);

    scene3d.obstMeshes = [];
    for(let i = 0; i < 18; i++){
        const g = new T.Group();
        const body = new T.Mesh(new T.CylinderGeometry(1, 1, 1.5, 16), new T.MeshStandardMaterial({color:0x6a4a2a, roughness:0.75, metalness:0.1}));
        body.castShadow = true; body.receiveShadow = true; body.position.y = 0.75; g.add(body);
        const lid = new T.Mesh(new T.CylinderGeometry(1.04, 1.04, 0.14, 16), new T.MeshStandardMaterial({color:0xcaa36a, roughness:0.6, metalness:0.3}));
        lid.position.y = 1.5; g.add(lid);
        g.visible = false; scene.add(g); scene3d.obstMeshes.push(g);
    }

    scene3d.ebulletMeshes = [];
    const ebGeo = new T.SphereGeometry(0.22, 10, 8);
    const ebMat = new T.MeshStandardMaterial({color:0xffb347, emissive:0xff8a2a, emissiveIntensity:0.8, roughness:0.4});
    for(let i = 0; i < 60; i++){
        const m = new T.Mesh(ebGeo, ebMat); m.castShadow = false; m.visible = false; scene.add(m); scene3d.ebulletMeshes.push(m);
    }

    scene3d.tracerLines = [];
    const trMat0 = new T.LineBasicMaterial({color:0xfff6c8, transparent:true, opacity:0.95});
    for(let i = 0; i < 16; i++){
        const geo = new T.BufferGeometry();
        geo.setAttribute("position", new T.BufferAttribute(new Float32Array(6), 3));
        const line = new T.Line(geo, trMat0.clone());
        line.visible = false; scene.add(line); scene3d.tracerLines.push(line);
    }

    scene3d.grenadeMeshes = [];
    const grGeo = new T.SphereGeometry(0.3, 12, 10);
    const grMat = new T.MeshStandardMaterial({color:0x4a2a1a, emissive:0xff4400, emissiveIntensity:0.5});
    for(let i = 0; i < 4; i++){
        const m = new T.Mesh(grGeo, grMat); m.visible = false; scene.add(m); scene3d.grenadeMeshes.push(m);
    }
    scene3d.explosionSprites = [];
    const glowTex = makeGlowTexture();
    for(let i = 0; i < 4; i++){
        const spr = new T.Sprite(new T.SpriteMaterial({map:glowTex, color:0xffaa33, transparent:true, opacity:0, depthWrite:false, blending:T.AdditiveBlending}));
        spr.scale.set(1,1,1); spr.visible = false; scene.add(spr); scene3d.explosionSprites.push(spr);
    }

    scene3d.itemMeshes = [];
}
function makeGlowTexture(){
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,180,80,.8)");
    g.addColorStop(1, "rgba(255,180,80,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
}

// ---------- WASM 起動 ----------
let G9mod = null;
const G9 = {};
async function boot(){
    try{
        G9mod = await window.Game9Module();
        const c = (name, ret, args) => G9mod.cwrap(name, ret, args);
        G9.g9_start_stage = c("g9_start_stage", null, ["number","number","number","number","number","number","number"]);
        G9.g9_step = c("g9_step", null, ["number","number","number","number","number","number","number","number"]);
        G9.g9_get_buffer = c("g9_get_buffer", "number", []);
        G9.heap = () => G9mod.HEAPF32;
        window.G9 = G9;
        $("boot").classList.add("off");
        paintStageSelect();
        resize();
    }catch(err){
        $("boot").textContent = "読みこみに失敗しました。再読み込みしてください。";
        console.error(err);
    }
}

// ---------- ゲーム状態 ----------
const HEADER = 37, MAX_OBST = 18, MAX_ENEMY = 10, MAX_EB = 60, MAX_TR = 16, MAX_GR = 4;
const BUF_LEN = HEADER + MAX_OBST*3 + MAX_ENEMY*8 + MAX_EB*3 + MAX_TR*6 + MAX_GR*5;
let G = {running:false, stageIdx:0, stage:null, curWeapon:0};
let lastKills = -1, lastHp = -1, lastAmmo = -1, lastCombo = -1, lastBoss = 0, lastWeapon = -1, obstaclesPlaced = false;

function startStage(idx){
    G.stageIdx = idx; G.stage = STAGES[idx];
    const diff = difficultyFor(idx);
    buildStageScene(G.stage);
    const seed = (Date.now() ^ (idx * 7919)) & 0x7fffffff;
    G9.g9_start_stage(idx, G.stage.killTarget, diff.hpMul, diff.speedMul, diff.fireMul, diff.bulletMul, seed);
    Input.yaw = 0; Input.moveF = 0; Input.moveS = 0; Input.firing = false; Input.weaponSwitch = -1;
    G.curWeapon = 0; paintWeaponSelect();
    obstaclesPlaced = false; lastKills = -1; lastHp = -1; lastAmmo = -1; lastCombo = -1; lastBoss = 0; lastWeapon = -1;
    $("playTitle").textContent = G.stage.title;
    $("playSub").textContent = G.stage.composer;
    $("bossWrap").hidden = true;
    showScreen("s-play");
    resize();
    G.running = true;
    lastT = performance.now();
    requestAnimationFrame(loop);
    playBgm(G.stage.track);
}

function endStage(cleared, finalScore){
    G.running = false;
    stopBgm();
    try{ if(document.exitPointerLock) document.exitPointerLock(); }catch(_e){}
    try{
        if(window.AREFeaturePanel){
            window.AREFeaturePanel.recordRun("game9", finalScore);
            const rec = JSON.parse(localStorage.getItem("g9_mission_rec") || "{\"runs\":0,\"clears\":0,\"bestScore\":0}");
            rec.runs = (rec.runs || 0) + 1;
            if(cleared) rec.clears = (rec.clears || 0) + 1;
            rec.bestScore = Math.max(rec.bestScore || 0, finalScore || 0);
            rec.stagesUnlocked = unlocked + (cleared ? 1 : 0);
            localStorage.setItem("g9_mission_rec", JSON.stringify(rec));
        }
    }catch(_e){}
    if(cleared){
        saveProgress(Math.min(STAGES.length - 1, G.stageIdx + 1));
        sfxClear();
        $("resTitle").textContent = "🎉 クリア！";
        $("resBody").textContent = G.stage.bossName + " を撃破！（スコア " + finalScore + "）";
        $("resNext").hidden = (G.stageIdx + 1 >= STAGES.length);
    }else{
        sfxOver();
        $("resTitle").textContent = "💥 ゲームオーバー";
        $("resBody").textContent = G.stage.title + "：スコア " + finalScore;
        $("resNext").hidden = true;
    }
    showScreen("s-res");
}

let lastT = 0;
function loop(t){
    if(!G.running) return;
    let dt = (t - lastT) / 1000; lastT = t;
    if(dt > 0.05) dt = 0.05;
    requestAnimationFrame(loop);

    const km = keyboardMove();
    let moveF = km.f, moveS = km.s;
    if(Input.moveF || Input.moveS){ moveF = clampN(moveF + Input.moveF, -1, 1); moveS = clampN(moveS + Input.moveS, -1, 1); }

    const reloadPressed = Input.reload ? 1 : 0; Input.reload = false;
    const grenadePressed = Input.grenade ? 1 : 0; Input.grenade = false;
    const firing = Input.firing ? 1 : 0;
    const weaponSwitch = Input.weaponSwitch; Input.weaponSwitch = -1;

    G9.g9_step(dt, moveF, moveS, Input.yaw, firing, reloadPressed, grenadePressed, weaponSwitch);
    const ptr = G9.g9_get_buffer();
    const buf = new Float32Array(G9.heap().buffer, ptr, BUF_LEN);

    const running = buf[0] > 0, gameOver = buf[1] > 0, stageCleared = buf[2] > 0;
    const score = buf[3] | 0, combo = buf[4] | 0;
    const hp = buf[6], maxHp = buf[7], ammo = buf[8] | 0, maxAmmo = buf[9] | 0;
    const reloading = buf[10] > 0, grenadeCd = buf[12];
    const killCount = buf[13] | 0, killTarget = buf[14] | 0;
    const bossActive = buf[15] > 0, bossSpawned = buf[16] > 0, bossHp = buf[17], bossHpMax = buf[18];
    const px = buf[20], pz = buf[21], yaw = buf[22];
    const obstacleCount = buf[23] | 0, enemyCount = buf[24] | 0, ebCount = buf[25] | 0, trCount = buf[26] | 0, grCount = buf[27] | 0;
    const hitFlashT = buf[28];
    const curWeapon = buf[32] | 0, weaponSwitchT = buf[33];
    const wpnAmmo = [buf[34] | 0, buf[35] | 0, buf[36] | 0];

    // プレイヤー・カメラ
    scene3d.player.position.set(px, 0, pz);
    scene3d.player.rotation.y = yaw;
    const backX = -Math.sin(yaw), backZ = -Math.cos(yaw);
    camera.position.set(px + backX * 4.6, 2.6, pz + backZ * 4.6);
    const lookX = px + Math.sin(yaw) * 3, lookZ = pz + Math.cos(yaw) * 3;
    camera.lookAt(lookX, 1.55, lookZ);

    // 遮蔽物（初回のみ配置：ステージ中は不動）
    if(!obstaclesPlaced){
        let o = HEADER;
        for(let i = 0; i < MAX_OBST; i++){
            const x = buf[o], z = buf[o+1], r = buf[o+2];
            const m = scene3d.obstMeshes[i];
            if(i < obstacleCount && r > 0){ m.visible = true; m.position.set(x, 0, z); m.scale.set(r, 1, r); }
            else m.visible = false;
            o += 3;
        }
        obstaclesPlaced = true;
    }

    // 敵
    let o = HEADER + MAX_OBST * 3;
    for(let i = 0; i < MAX_ENEMY; i++){
        const ex = buf[o], ez = buf[o+1], eyaw = buf[o+2], ehp = buf[o+3], ehpMax = buf[o+4];
        const etype = buf[o+5] | 0, estate = buf[o+6] | 0, ehitFlash = buf[o+7];
        const m = scene3d.enemyMeshes[i];
        if(i < enemyCount && ehp > 0){
            m.visible = true;
            m.position.set(ex, 0, ez); m.rotation.y = eyaw;
            const scl = etype === 1 ? 1.7 : 1.0;
            m.scale.setScalar(scl);
            const flashOn = ehitFlash > 0;
            m.userData.hitFlashMat.forEach((mat) => { mat.emissive.setHex(flashOn ? 0xffffff : 0x000000); mat.emissiveIntensity = flashOn ? 0.9 : 0; });
        } else m.visible = false;
        o += 8;
    }

    // 敵の弾（投射物）
    o = HEADER + MAX_OBST * 3 + MAX_ENEMY * 8;
    for(let i = 0; i < MAX_EB; i++){
        const bx = buf[o], bz = buf[o+1], alive = buf[o+2] > 0;
        const m = scene3d.ebulletMeshes[i];
        if(i < ebCount && alive){ m.visible = true; m.position.set(bx, 1.1, bz); } else m.visible = false;
        o += 3;
    }

    // トレーサー（プレイヤーの射撃線）
    o = HEADER + MAX_OBST * 3 + MAX_ENEMY * 8 + MAX_EB * 3;
    let anyShot = false;
    for(let i = 0; i < MAX_TR; i++){
        const ox = buf[o], oz = buf[o+1], tx = buf[o+2], tz = buf[o+3], life = buf[o+4], hit = buf[o+5] > 0;
        const line = scene3d.tracerLines[i];
        if(i < trCount && life > 0){
            line.visible = true;
            const pos = line.geometry.attributes.position.array;
            pos[0] = ox; pos[1] = 1.05; pos[2] = oz; pos[3] = tx; pos[4] = 1.05; pos[5] = tz;
            line.geometry.attributes.position.needsUpdate = true;
            line.material.opacity = Math.min(1, life * 6);
            if(hit) anyShot = true;
        } else line.visible = false;
        o += 6;
    }
    if(anyShot){ $("hitmark").classList.remove("go"); void $("hitmark").offsetWidth; $("hitmark").classList.add("go"); }

    // 手榴弾・爆発
    o = HEADER + MAX_OBST * 3 + MAX_ENEMY * 8 + MAX_EB * 3 + MAX_TR * 6;
    for(let i = 0; i < MAX_GR; i++){
        const gx = buf[o], gz = buf[o+1], alive = buf[o+2] > 0, exploded = buf[o+3] > 0, life = buf[o+4];
        const m = scene3d.grenadeMeshes[i], spr = scene3d.explosionSprites[i];
        if(i < grCount && alive){
            if(!exploded){ m.visible = true; m.position.set(gx, 1, gz); spr.visible = false; }
            else { m.visible = false; spr.visible = true; spr.position.set(gx, 1, gz); spr.scale.setScalar(2 + (0.4 - life) * 10); spr.material.opacity = Math.max(0, life / 0.4) * 0.9; }
        } else { m.visible = false; spr.visible = false; }
        o += 5;
    }

    // 発射音（ammoが減った瞬間に鳴らす）
    if(lastAmmo >= 0 && ammo < lastAmmo && !reloading) sfxShoot();
    if(lastAmmo >= 0 && reloading && lastAmmo !== -2 && ammo === maxAmmo && lastAmmo !== maxAmmo){ /* reload complete handled below */ }
    lastAmmo = ammo;

    if(killCount > lastKills){ sfxEnemyDown(); lastKills = killCount; }
    if(lastHp >= 0 && hp < lastHp){ sfxHurt(); $("dmgFlash").classList.add("go"); setTimeout(() => $("dmgFlash").classList.remove("go"), 160); }
    lastHp = hp;
    if(bossActive && !lastBoss){ sfxGrenade(); }
    lastBoss = bossActive ? 1 : 0;

    // HUD
    $("hpBar").style.width = Math.max(0, (hp / maxHp) * 100) + "%";
    $("hpText").textContent = Math.ceil(hp) + " / " + maxHp;
    $("hudScore").textContent = "スコア " + score;
    $("hudCombo").textContent = combo > 1 ? ("combo " + combo) : "";
    $("hudKills").textContent = bossSpawned ? "" : ("撃破 " + killCount + " / " + killTarget);
    $("ammoText").textContent = reloading ? "…" : (ammo + " / " + maxAmmo);
    $("reloadText").classList.toggle("on", reloading);
    $("weaponName").textContent = WEAPONS[curWeapon].name;
    if(curWeapon !== G.curWeapon || curWeapon !== lastWeapon){
        G.curWeapon = curWeapon;
        if(lastWeapon >= 0 && curWeapon !== lastWeapon) sfxSwitch();
        lastWeapon = curWeapon;
        paintWeaponSelect();
    }
    for(let i = 0; i < WEAPONS.length; i++){
        const b = weaponBtns[i];
        if(b) b.querySelector(".ammo").textContent = wpnAmmo[i];
    }
    if(bossActive){
        $("bossWrap").hidden = false;
        $("bossName").textContent = G.stage.bossName;
        $("bossBar").style.setProperty("--w", Math.max(0, (bossHp / bossHpMax) * 100) + "%");
    }else{
        $("bossWrap").hidden = true;
    }

    renderer.render(scene, camera);

    if(gameOver && G.running){ endStage(false, score); }
    else if(stageCleared && G.running){ endStage(true, score); }
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

// ---------- 画面のボタン ----------
$("bHow").addEventListener("click", () => showScreen("s-how"));
$("bHowBack").addEventListener("click", () => showScreen("s-title"));
$("bSet").addEventListener("click", () => {
    $("volBgm").value = settings.bgm; $("volSe").value = settings.se; $("volSens").value = settings.sens;
    showScreen("s-set");
});
$("bSetBack").addEventListener("click", () => showScreen("s-title"));
$("volBgm").addEventListener("input", (event) => { settings.bgm = Number(event.target.value); if(bgmEl) bgmEl.volume = settings.bgm; saveSettings(); });
$("volSe").addEventListener("input", (event) => { settings.se = Number(event.target.value); saveSettings(); });
$("volSens").addEventListener("input", (event) => { settings.sens = Number(event.target.value); saveSettings(); });
$("stageSelect").addEventListener("click", (event) => {
    const b = event.target.closest("[data-i]"); if(!b || b.disabled) return;
    startStage(Number(b.dataset.i));
});
// ---------- バトルロワイヤル（js/br.js をはじめて遊ぶときに読みこむ） ----------
let brMod = null;
async function launchBR(){
    try{
        if(!brMod) brMod = await import("./br.js");
        stopBgm();
        const diff = $("brDiff").value, assist = $("brAssist").checked;
        try{ localStorage.setItem("g9_br_opts", JSON.stringify({diff, assist})); }catch(_e){}
        showScreen("s-br");
        brMod.startBR({settings, difficulty: diff, assist});
    }catch(err){ console.error(err); showScreen("s-title"); alert("バトルロワイヤルを 読みこめませんでした。再読み込みしてください。"); }
}
try{ const o = JSON.parse(localStorage.getItem("g9_br_opts") || "null"); if(o){ if(o.diff) $("brDiff").value = o.diff; $("brAssist").checked = o.assist !== false; } }catch(_e){}
$("bBR").addEventListener("click", launchBR);
$("brAgain").addEventListener("click", launchBR);
$("brHome").addEventListener("click", () => { if(brMod) brMod.stopBR(); paintStageSelect(); showScreen("s-title"); });
$("resRetry").addEventListener("click", () => startStage(G.stageIdx));
$("resNext").addEventListener("click", () => startStage(Math.min(STAGES.length - 1, G.stageIdx + 1)));
$("resTitleBtn").addEventListener("click", () => { paintStageSelect(); showScreen("s-title"); });
$("exitBtn").addEventListener("click", () => {
    if(scrs["s-br"].classList.contains("on")){ if(brMod) brMod.stopBR(); paintStageSelect(); showScreen("s-title"); return; }
    if(scrs["s-play"].classList.contains("on")){
        G.running = false; stopBgm();
        try{ if(document.exitPointerLock) document.exitPointerLock(); }catch(_e){}
        paintStageSelect(); showScreen("s-title"); return;
    }
    try{ const back = new URLSearchParams(location.search).get("back"); location.href = back || "../index.html"; }catch(_e){ history.back(); }
});

resize();
boot();
