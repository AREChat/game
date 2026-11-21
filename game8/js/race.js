"use strict";
// ===== GAME8：レースモード（コースを走って 順位を競う）=====
// コース上の移動・あたり判定（コース外ではおそくなる）・周回判定は C++(WebAssembly) 側（race_* 関数）が計算する。
// ここでは コースの見た目（three.js）と、車の位置をその結果に合わせて動かすことをする。
import * as T from "../vendor/three/build/three.module.js";

const SCALE = 1 / 8; // 物理の単位 → three.js world 単位

// アスファルト風の ざらついたテクスチャ（単色べた塗りより リアルに見える）
function makeAsphaltTexture(){
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#34383f"; ctx.fillRect(0, 0, 256, 256);
    for(let i = 0; i < 2600; i++){
        const v = Math.round(30 + Math.random() * 40);
        ctx.fillStyle = "rgba(" + v + "," + v + "," + (v + 6) + ",0.14)";
        const s = 1 + Math.random() * 2.2;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
    }
    const tex = new T.CanvasTexture(c);
    tex.wrapS = T.RepeatWrapping; tex.wrapT = T.RepeatWrapping;
    return tex;
}
function makeGlowTexture(){
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,240,1)"); g.addColorStop(1, "rgba(255,255,240,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
}

function buildTrack(){
    const L = 150, R = 46, pts = [];
    const push = (x, z) => pts.push([x, z]);
    for(let i = 0; i < 16; i++) push(-L / 2 + (L * i) / 16, -R);                 // 下の直線
    for(let i = 0; i < 20; i++){ const t = -Math.PI / 2 + (Math.PI * i) / 20; push(L / 2 + R * Math.cos(t), R * Math.sin(t)); } // 右カーブ
    for(let i = 0; i < 16; i++) push(L / 2 - (L * i) / 16, R);                   // 上の直線
    for(let i = 0; i < 20; i++){ const t = Math.PI / 2 + (Math.PI * i) / 20; push(-L / 2 + R * Math.cos(t), R * Math.sin(t)); } // 左カーブ
    return {pts, width: 22, startX: -L / 2 + 10, startZ: -R};
}

export function start(ctx){
    const {Input, G8, renderer, camera, makeLitScene, setHud, toast, showResult} = ctx;
    const scene = makeLitScene(0x9fe0ff, 0x234a2a);

    const track = buildTrack();
    const N = track.pts.length;
    const LAPS = 3;

    // ---------- C++ 側へコースとレーサーを渡す ----------
    function loadRace(){
        G8.race_reset(LAPS);
        track.pts.forEach((p) => G8.race_add_waypoint(p[0], p[1]));
        G8.race_set_width(track.width);
        const lanes = [-6, -2, 2, 6];
        const specs = [
            {cpu: 0, mul: 1.0}, {cpu: 1, mul: 0.93}, {cpu: 1, mul: 0.97}, {cpu: 1, mul: 1.0}
        ];
        specs.forEach((s, i) => {
            G8.race_add_car(track.startX, track.startZ + lanes[i], Math.PI / 2, s.cpu, s.mul, 0.5);
        });
    }
    loadRace();

    // ---------- コースの見た目 ----------
    const half = track.width / 2;
    const left = [], right = [];
    for(let i = 0; i < N; i++){
        const p = track.pts[i], q = track.pts[(i + 1) % N];
        const dx = q[0] - p[0], dz = q[1] - p[1];
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len, nz = dx / len;
        left.push([p[0] + nx * half, p[1] + nz * half]);
        right.push([p[0] - nx * half, p[1] - nz * half]);
    }
    const positions = [], indices = [], uvs = [];
    let arcLen = 0;
    const UV_REPEAT = 1 / 18; // 長さ18単位ごとに 模様が1くりかえし
    for(let i = 0; i < N; i++){
        const p = track.pts[i], q = track.pts[(i + 1) % N];
        positions.push(left[i][0] * SCALE, 0.02, left[i][1] * SCALE);
        positions.push(right[i][0] * SCALE, 0.02, right[i][1] * SCALE);
        uvs.push(arcLen * SCALE * UV_REPEAT, 0, arcLen * SCALE * UV_REPEAT, 1);
        arcLen += Math.hypot(q[0] - p[0], q[1] - p[1]);
    }
    for(let i = 0; i < N; i++){
        const a = i * 2, b = i * 2 + 1, c = ((i + 1) % N) * 2, d = ((i + 1) % N) * 2 + 1;
        indices.push(a, c, b, b, c, d);
    }
    const trackGeo = new T.BufferGeometry();
    trackGeo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    trackGeo.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    trackGeo.setIndex(indices);
    trackGeo.computeVertexNormals();
    const asphaltTex = makeAsphaltTexture();
    asphaltTex.repeat.set(1, 1);
    const trackMesh = new T.Mesh(trackGeo, new T.MeshStandardMaterial({color: 0xaeb4bd, map: asphaltTex, roughness: 0.88}));
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // センターライン（点線）：まんなかを 少しずつ 白くぬる
    const dashMat = new T.MeshBasicMaterial({color: 0xffe9a8});
    for(let i = 0; i < N; i += 2){
        const p = track.pts[i], q = track.pts[(i + 1) % N];
        const dash = new T.Mesh(new T.PlaneGeometry(0.5, Math.hypot(q[0] - p[0], q[1] - p[1]) * SCALE * 0.7), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.rotation.z = -Math.atan2(q[0] - p[0], q[1] - p[1]);
        dash.position.set((p[0] + q[0]) / 2 * SCALE, 0.03, (p[1] + q[1]) / 2 * SCALE);
        scene.add(dash);
    }

    // 縁石（赤白の目印）：立体の箱だと、カメラがコースの はしに近づいたときに すぐそばの箱が 画面いっぱいに
    // 大きく見えてしまう（近くのものほど大きく映る、カメラごしの錯覚）。そのため、地面にはりつく「平たい模様」にする。
    const curbGeo = new T.PlaneGeometry(0.34, 1);
    const curbMatA = new T.MeshStandardMaterial({color: 0xd43a3a, roughness: 0.75});
    const curbMatB = new T.MeshStandardMaterial({color: 0xeeeeee, roughness: 0.75});
    for(let i = 0; i < N; i += 2){
        [left, right].forEach((side) => {
            const p = side[i], q = side[(i + 1) % N];
            const segLen = Math.hypot(q[0] - p[0], q[1] - p[1]) * SCALE * 2;
            const ang = Math.atan2(q[0] - p[0], q[1] - p[1]);
            const m = new T.Mesh(curbGeo, (i / 2) % 2 === 0 ? curbMatA : curbMatB);
            m.scale.set(1, segLen, 1);
            m.rotateX(-Math.PI / 2);
            m.rotateOnWorldAxis(new T.Vector3(0, 1, 0), ang);
            m.position.set(p[0] * SCALE, 0.021, p[1] * SCALE);
            m.receiveShadow = true;
            scene.add(m);
        });
    }
    const groundMesh = new T.Mesh(new T.PlaneGeometry(260, 220), new T.MeshStandardMaterial({color: 0x234a2a, roughness: 1}));
    groundMesh.rotation.x = -Math.PI / 2; groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // ---------- 車（つやのある塗装＋ヘッドライトの光） ----------
    const headlightTex = makeGlowTexture();
    // コース幅（約2.75 world単位）に 車がきちんと 収まるよう、小さめの寸法にする
    function makeCar(color){
        const g = new T.Group();
        const bodyMat = new T.MeshPhysicalMaterial({color, roughness: 0.25, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15});
        const chassis = new T.Mesh(new T.BoxGeometry(0.46, 0.16, 0.95), bodyMat);
        chassis.position.y = 0.14; chassis.castShadow = true; g.add(chassis);
        const stripe = new T.Mesh(new T.BoxGeometry(0.1, 0.02, 0.97), new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.3, metalness: 0.2}));
        stripe.position.set(0, 0.225, 0); g.add(stripe);
        const cabin = new T.Mesh(new T.BoxGeometry(0.34, 0.14, 0.42), new T.MeshPhysicalMaterial({color: 0xcfeeff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.75, clearcoat: 1}));
        cabin.position.set(0, 0.27, -0.03); cabin.castShadow = true; g.add(cabin);
        const wheelMat = new T.MeshStandardMaterial({color: 0x161616, roughness: 0.75, metalness: 0.2});
        const wheelGeo = new T.CylinderGeometry(0.1, 0.1, 0.1, 16);
        [[-0.2, 0.32], [0.2, 0.32], [-0.2, -0.32], [0.2, -0.32]].forEach(([x, z]) => {
            const w = new T.Mesh(wheelGeo, wheelMat);
            w.rotation.z = Math.PI / 2;
            w.position.set(x, 0.095, z);
            w.castShadow = true; g.add(w);
            const hub = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.11, 10), new T.MeshStandardMaterial({color: 0xcccccc, metalness: 0.8, roughness: 0.3}));
            hub.rotation.z = Math.PI / 2; hub.position.set(x, 0.095, z); g.add(hub);
        });
        [[-0.15, 0.46], [0.15, 0.46]].forEach(([x, z]) => {
            const light = new T.Sprite(new T.SpriteMaterial({map: headlightTex, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending}));
            light.position.set(x, 0.14, z); light.scale.set(0.16, 0.16, 1);
            g.add(light);
        });
        return g;
    }
    const carColors = [0xff3b3b, 0x2e7bff, 0x2fe08a, 0xffcf2e];
    const cars = carColors.map((c) => { const m = makeCar(c); scene.add(m); return m; });

    // ---------- たすけモンスター（コースから大きくはずれて 止まってしまったら、かわいいモンスターが車をコースへ運んでくれる） ----------
    function makeRescueMonster(){
        const g = new T.Group();
        const body = new T.Mesh(new T.SphereGeometry(0.22, 16, 12), new T.MeshStandardMaterial({color: 0xffb3e6, roughness: 0.55, emissive: 0x4a1a3a, emissiveIntensity: 0.25}));
        body.scale.set(1, 0.92, 1); g.add(body);
        const eyeWhite = new T.Mesh(new T.SphereGeometry(0.1, 14, 10), new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.3}));
        eyeWhite.position.set(0, 0.03, 0.18); g.add(eyeWhite);
        const pupil = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), new T.MeshStandardMaterial({color: 0x241a33}));
        pupil.position.set(0, 0.03, 0.26); g.add(pupil);
        // ほっぺ
        [[-0.13, -0.02], [0.13, -0.02]].forEach(([x, y]) => {
            const cheek = new T.Mesh(new T.CircleGeometry(0.045, 10), new T.MeshBasicMaterial({color: 0xff8fc7, transparent: true, opacity: 0.8}));
            cheek.position.set(x, y, 0.2); g.add(cheek);
        });
        // ちいさなプロペラ帽子
        const cap = new T.Mesh(new T.ConeGeometry(0.07, 0.1, 10), new T.MeshStandardMaterial({color: 0xffe36e, roughness: 0.5}));
        cap.position.set(0, 0.26, 0); g.add(cap);
        const prop = new T.Mesh(new T.BoxGeometry(0.26, 0.02, 0.05), new T.MeshStandardMaterial({color: 0x6ecfff, roughness: 0.4}));
        prop.position.set(0, 0.33, 0); g.add(prop);
        // ふわふわ ちいさな羽（布っぽい、虫の羽ではなく リボンのような形）
        [-1, 1].forEach((side) => {
            const wing = new T.Mesh(new T.CircleGeometry(0.13, 12, 0, Math.PI), new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.6, side: T.DoubleSide, transparent: true, opacity: 0.9}));
            wing.position.set(side * 0.2, 0.04, -0.02);
            wing.rotation.y = side * 0.5;
            wing.rotation.z = Math.PI / 2;
            wing.userData.side = side;
            g.add(wing);
            g.userData['wing' + side] = wing;
        });
        // 車とつながる ひも
        const rope = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1, 6), new T.MeshBasicMaterial({color: 0xffffff}));
        rope.userData.isRope = true;
        g.add(rope);
        g.userData.prop = prop; g.userData.rope = rope;
        g.visible = false;
        scene.add(g);
        return g;
    }
    const rescueAnim = cars.map(() => ({active: false, fromX: 0, fromZ: 0, toX: 0, toZ: 0, toHeading: 0, monster: makeRescueMonster()}));

    // ---------- HUD ----------
    function paintHud(lap, rank, carN, speedKmh){
        setHud('<span>🏁 Lap ' + Math.min(lap + 1, LAPS) + '/' + LAPS + '</span><span>順位 ' + rank + '/' + carN + '</span><span>' + Math.round(speedKmh) + ' km/h</span>');
    }

    let done = false, running = true, lastT = performance.now();
    function frame(t){
        if(!running) return;
        requestAnimationFrame(frame);
        let dt = (t - lastT) / 1000; lastT = t;
        if(dt > 0.05) dt = 0.05;

        if(!ctx.isPaused() && !done){
            const steer = (Input.left ? -1 : 0) + (Input.right ? 1 : 0);
            G8.race_step(dt, steer, 1, 0);
            const ptr = G8.race_get_buffer();
            const buf = new Float32Array(G8.heap().buffer, ptr, 4 + 4 * 10);
            const carN = buf[0] | 0;
            const progress = [];
            for(let i = 0; i < carN; i++){
                const o = 4 + i * 10;
                const x = buf[o], z = buf[o + 1], heading = buf[o + 2], speed = buf[o + 3];
                const lap = buf[o + 4], finished = buf[o + 5], rank = buf[o + 6], prog = buf[o + 7];
                const rescue = buf[o + 9]; // 1→0：かわいいモンスターが 運んでいる残り（0なら 通常どおり）
                const wx = x * SCALE, wz = z * SCALE;
                const ra = rescueAnim[i];
                if(rescue > 0){
                    if(!ra.active){
                        // 運ばれはじめ：いまの見た目の位置を「はこぶ前」として覚える
                        ra.active = true;
                        ra.fromX = cars[i].position.x; ra.fromZ = cars[i].position.z;
                        ra.fromHeading = cars[i].rotation.y;
                        ra.toX = wx; ra.toZ = wz; ra.toHeading = heading;
                        ra.monster.visible = true;
                    }
                    const t = 1 - rescue; // 0→1
                    const ease = t * t * (3 - 2 * t); // スムーズに
                    const cx = ra.fromX + (ra.toX - ra.fromX) * ease, cz = ra.fromZ + (ra.toZ - ra.fromZ) * ease;
                    const lift = Math.sin(Math.min(t, 1) * Math.PI) * 1.1; // ふわっと持ち上がって おりる
                    let hd = ra.fromHeading + (ra.toHeading - ra.fromHeading) * ease;
                    cars[i].position.set(cx, lift * 0.18, cz);
                    cars[i].rotation.set(0, hd, Math.sin(performance.now() / 160 + i) * 0.08);
                    const m = ra.monster;
                    m.position.set(cx, lift + 0.55, cz);
                    m.position.y += Math.sin(performance.now() / 120) * 0.03;
                    const w1 = m.userData.wing1, w2 = m.userData['wing-1'];
                    const flap = Math.sin(performance.now() / 70) * 0.5;
                    if(w1) w1.rotation.x = flap; if(w2) w2.rotation.x = -flap;
                    m.userData.prop.rotation.y += 0.9;
                    const rope = m.userData.rope;
                    const dy = m.position.y - cars[i].position.y;
                    rope.scale.y = Math.max(0.05, lift + 0.55);
                    rope.position.set(0, -(lift + 0.55) / 2, 0);
                }else{
                    if(ra.active){ ra.active = false; ra.monster.visible = false; }
                    cars[i].position.set(wx, 0, wz);
                    cars[i].rotation.set(0, heading, 0);
                }
                progress.push({i, score: lap * 10000 + prog});
                if(i === 0){
                    progress._player = {lap, speed, finished, rank};
                }
            }
            progress.sort((a, b) => b.score - a.score);
            const playerRank = progress.findIndex((p) => p.i === 0) + 1;
            const pinfo = progress._player;
            paintHud(pinfo.lap, playerRank, carN, pinfo.speed * 3.2);

            if(pinfo.finished >= 1 && !done){
                done = true;
                const rankTxt = pinfo.rank === 1 ? '<span class="rank1">🥇 1位</span>' : pinfo.rank + '位';
                showResult("🏁 ゴール！", '<p>結果：' + rankTxt + ' ／ ' + LAPS + '周</p>', () => restart(), () => {});
            }

            const my = cars[0];
            const camDist = 3.4, camHeight = 1.5;
            const bx = my.position.x - Math.sin(my.rotation.y) * camDist;
            const bz = my.position.z - Math.cos(my.rotation.y) * camDist;
            camera.position.lerp(new T.Vector3(bx, camHeight, bz), 0.18);
            const lookAt = new T.Vector3(my.position.x + Math.sin(my.rotation.y) * 2.2, 0.28, my.position.z + Math.cos(my.rotation.y) * 2.2);
            camera.lookAt(lookAt);
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    function restart(){ done = false; loadRace(); }

    return {
        stop(){ running = false; }
    };
}
