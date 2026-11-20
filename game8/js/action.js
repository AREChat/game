"use strict";
// ===== GAME8：アクションモード（横スクロール・ジャンプ・ふみつけ）=====
// 物理（あたり判定・重力・敵の移動）は C++(WebAssembly) 側（act_* 関数）が計算し、
// ここでは その結果を three.js の見た目（板・敵・コイン・プレイヤー）に反映するだけ。
import * as T from "../vendor/three/build/three.module.js";

const SCALE = 1 / 50;               // 物理の px を three.js の world 単位に変換
const toX = (px) => px * SCALE;
const toY = (py) => -py * SCALE;

export function start(ctx){
    const {Input, G8, renderer, camera, makeLitScene, consumeJumpEdge, setHud, toast, showResult} = ctx;
    const scene = makeLitScene(0x8fd3ff, 0x1a2f55);

    // ---------- レベルデータ ----------
    const GY = 400;                 // 地面の基準 y（物理 px）
    const groundSegs = [[0, 560], [660, 580], [1320, 540], [1940, 760]];
    const floatPlats = [
        {x: 540, y: GY - 150, w: 160, h: 22, oneWay: 1},
        {x: 860, y: GY - 230, w: 150, h: 22, oneWay: 1},
        {x: 1180, y: GY - 150, w: 150, h: 22, oneWay: 1},
        {x: 1520, y: GY - 260, w: 150, h: 22, oneWay: 1},
        {x: 1760, y: GY - 150, w: 150, h: 22, oneWay: 1}
    ];
    const enemyDefs = [
        [300, GY - 28, 60, 90], [420, GY - 28, 50, 70],
        [900, GY - 28, 70, 100], [1420, GY - 28, 60, 90],
        [2020, GY - 28, 80, 120], [2250, GY - 28, 70, 90]
    ];
    const coinDefs = [];
    groundSegs.forEach((s) => { for(let i = 0; i < 4; i++) coinDefs.push([s[0] + 60 + i * (s[1] - 120) / 3, GY - 70]); });
    floatPlats.forEach((p) => coinDefs.push([p.x + p.w / 2, p.y - 40]));
    const GOAL = {x: 2560, y: GY - 260, w: 70, h: 260};
    const LEVEL_END = GOAL.x + 120;

    // ---------- C++ 側にレベルを渡す ----------
    const START_X = 70, START_Y = GY - 200;
    function loadLevel(){
        G8.act_reset(START_X, START_Y);
        groundSegs.forEach((s) => G8.act_add_platform(s[0], GY, s[1], 400, 1));
        floatPlats.forEach((p) => G8.act_add_platform(p.x, p.y, p.w, p.h, p.oneWay));
        enemyDefs.forEach((e) => G8.act_add_enemy(e[0], e[1], e[2], e[3]));
        coinDefs.forEach((c) => G8.act_add_coin(c[0], c[1]));
        G8.act_set_goal(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
    }
    loadLevel();

    // ---------- 見た目（three.js メッシュ）----------
    const groundMat = new T.MeshStandardMaterial({color: 0x6a8f3a, roughness: 0.85});
    const dirtMat = new T.MeshStandardMaterial({color: 0x7a5a3a, roughness: 0.95});
    const floatMat = new T.MeshStandardMaterial({color: 0xbf7a3a, roughness: 0.8});
    const groundGroup = new T.Group(); scene.add(groundGroup);
    groundSegs.forEach((s) => {
        const topH = 0.5, mesh = new T.Mesh(new T.BoxGeometry(s[1] * SCALE, topH, 2.2), groundMat);
        mesh.position.set(toX(s[0]) + (s[1] * SCALE) / 2, toY(GY) + topH / 2, 0);
        mesh.receiveShadow = true; mesh.castShadow = false;
        groundGroup.add(mesh);
        const body = new T.Mesh(new T.BoxGeometry(s[1] * SCALE, 2.2, 2.0), dirtMat);
        body.position.set(mesh.position.x, toY(GY) - 1.1, -0.05);
        body.receiveShadow = true;
        groundGroup.add(body);
    });
    const floatMeshes = floatPlats.map((p) => {
        const m = new T.Mesh(new T.BoxGeometry(p.w * SCALE, p.h * SCALE, 2.0), floatMat);
        m.position.set(toX(p.x) + (p.w * SCALE) / 2, toY(p.y) - (p.h * SCALE) / 2, 0);
        m.castShadow = true; m.receiveShadow = true;
        groundGroup.add(m);
        return m;
    });

    const playerMat = new T.MeshStandardMaterial({color: 0xff4040, roughness: 0.45, metalness: 0.08});
    const playerMesh = new T.Mesh(new T.CapsuleGeometry(0.28, 0.42, 4, 10), playerMat);
    playerMesh.castShadow = true; scene.add(playerMesh);

    function makeEnemyMesh(){
        const g = new T.Group();
        const body = new T.Mesh(new T.SphereGeometry(0.34, 14, 10), new T.MeshStandardMaterial({color: 0x8a4a2a, roughness: 0.6}));
        body.scale.set(1, 0.82, 1); body.castShadow = true;
        g.add(body);
        const eyeMat = new T.MeshStandardMaterial({color: 0x100800, roughness: 0.3});
        [-0.14, 0.14].forEach((ox) => {
            const eye = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), eyeMat);
            eye.position.set(ox, 0.08, 0.28); g.add(eye);
        });
        return g;
    }
    const enemyMeshes = enemyDefs.map(() => { const m = makeEnemyMesh(); scene.add(m); return m; });

    const coinMat = new T.MeshStandardMaterial({color: 0xffd34a, roughness: 0.25, metalness: 0.85, emissive: 0x5a3a00, emissiveIntensity: 0.3});
    const coinMeshes = coinDefs.map((c) => {
        const m = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.06, 16), coinMat);
        m.rotation.x = Math.PI / 2; m.castShadow = true;
        m.position.set(toX(c[0]), toY(c[1]), 0);
        scene.add(m);
        return m;
    });

    const flagGroup = new T.Group();
    const pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, GOAL.h * SCALE, 8), new T.MeshStandardMaterial({color: 0xdddddd, roughness: 0.4, metalness: 0.5}));
    pole.position.set(toX(GOAL.x) + 0.1, toY(GOAL.y) - (GOAL.h * SCALE) / 2, 0);
    pole.castShadow = true;
    const flag = new T.Mesh(new T.PlaneGeometry(0.6, 0.4), new T.MeshStandardMaterial({color: 0xffd34a, side: T.DoubleSide, roughness: 0.6}));
    flag.position.set(pole.position.x + 0.32, pole.position.y + (GOAL.h * SCALE) / 2 - 0.3, 0);
    flagGroup.add(pole, flag); scene.add(flagGroup);

    // 遠景（かんたんな山並み）
    const farMat = new T.MeshBasicMaterial({color: 0x2a4a7a});
    for(let i = 0; i < 14; i++){
        const h = 6 + Math.random() * 10;
        const m = new T.Mesh(new T.ConeGeometry(5 + Math.random() * 4, h, 5), farMat);
        m.position.set(i * 9 - 10, toY(GY) + h / 2 - 1.2, -14 - Math.random() * 6);
        scene.add(m);
    }
    const bigGround = new T.Mesh(new T.PlaneGeometry(400, 60), new T.MeshStandardMaterial({color: 0x0c1830, roughness: 1}));
    bigGround.rotation.x = -Math.PI / 2; bigGround.position.set(40, toY(GY) - 30, 0); bigGround.receiveShadow = true;
    scene.add(bigGround);

    // ---------- HUD・状態 ----------
    let lives = 3, score = 0, done = false, wasAlive = true;
    function paintHud(){ setHud('<span>❤️ ' + lives + '</span><span>🪙 ' + score + '</span>'); }
    paintHud();

    let running = true, lastT = performance.now();
    function frame(t){
        if(!running) return;
        requestAnimationFrame(frame);
        let dt = (t - lastT) / 1000; lastT = t;
        if(dt > 0.05) dt = 0.05;
        if(!ctx.isPaused() && !done){
            const jumpEdge = consumeJumpEdge();
            G8.act_step(dt, Input.left ? 1 : 0, Input.right ? 1 : 0, jumpEdge ? 1 : 0, Input.jump ? 1 : 0);
            const ptr = G8.act_get_buffer();
            const buf = new Float32Array(G8.heap().buffer, ptr, 12 + 32 * 6 + 64 * 3);
            const px = buf[0], py = buf[1], onGround = buf[4], alive = buf[5], facing = buf[6];
            const coins = buf[8] | 0, goalReached = buf[9] >= 1;
            const enemyN = buf[10] | 0, coinN = buf[11] | 0;

            playerMesh.position.set(toX(px) + 0.3, toY(py) + 0.45, 0);
            playerMesh.rotation.y = facing < 0 ? Math.PI : 0;

            let o = 12;
            for(let i = 0; i < 32; i++){
                if(i < enemyN){
                    const ex = buf[o], ey = buf[o + 1], ew = buf[o + 2], eh = buf[o + 3], ealive = buf[o + 4];
                    const mesh = enemyMeshes[i];
                    mesh.visible = ealive > 0;
                    if(mesh.visible) mesh.position.set(toX(ex) + ew * SCALE / 2, toY(ey) + eh * SCALE * 0.42, 0);
                }
                o += 6;
            }
            for(let i = 0; i < 64; i++){
                if(i < coinN){
                    const collected = buf[o + 2] > 0;
                    const mesh = coinMeshes[i];
                    mesh.visible = !collected;
                    if(mesh.visible) mesh.rotation.z += dt * 3;
                }
                o += 3;
            }

            if(coins !== score){ score = coins; paintHud(); }
            if(alive < 1 && wasAlive){ wasAlive = false; lives--; paintHud(); toast(lives > 0 ? "やられた！" : "ゲームオーバー"); }
            else if(alive >= 1) wasAlive = true;
            if(lives <= 0 && !done){
                done = true;
                showResult("😵 ゲームオーバー", '<div class="bigscore">🪙 ' + score + '</div><p>残念！もう一度ちょうせんしよう。</p>', () => restart(), () => {});
            }else if(goalReached && !done){
                done = true;
                showResult("🏁 クリア！", '<div class="bigscore">🪙 ' + score + '</div><p>ゴールにとうちゃく！お疲れさまでした。</p>', () => restart(), () => {});
            }
        }

        const camX = playerMesh.position.x;
        camera.position.set(camX, playerMesh.position.y + 2.6, 7.2);
        camera.lookAt(camX + 1.4, playerMesh.position.y + 0.6, 0);
        renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    function restart(){
        lives = 3; score = 0; done = false; wasAlive = true; paintHud();
        loadLevel();
    }

    return {
        stop(){ running = false; }
    };
}
