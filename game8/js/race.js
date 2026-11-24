"use strict";
// ===== GAME8：レースモード（コースを走って 順位を競う）=====
// コース上の移動・あたり判定（コース外ではおそくなる）・周回判定は C++(WebAssembly) 側（race_* 関数）が計算する。
// ここでは コースの見た目（three.js）と、ランナーの位置をその結果に合わせて動かすことをする。
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

// ===== コース生成（全32コース、くねくねした道をシード値から毎回同じ形で作る） =====
const COURSE_COUNT = 32;
function mulberry32(seed){
    return function(){
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// 閉じたループの Catmull-Rom スプライン（制御点どうしを なめらかな曲線でつなぐ）
function catmullRomClosed(ctrl, seg){
    const n = ctrl.length, out = [];
    for(let i = 0; i < n; i++){
        const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
        for(let s = 0; s < seg; s++){
            const t = s / seg, t2 = t * t, t3 = t2 * t;
            const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
            const z = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
            out.push([x, z]);
        }
    }
    return out;
}
const COURSE_THEMES = [
    {ground: 0x234a2a, curbA: 0xd43a3a, curbB: 0xeeeeee, name: "グリーンフィールド"},
    {ground: 0x1a2a4a, curbA: 0xffcf2e, curbB: 0x222222, name: "ナイトサーキット"},
    {ground: 0x3a2050, curbA: 0x7ecbff, curbB: 0xffffff, name: "トワイライトロード"},
    {ground: 0x4a3414, curbA: 0xff7a1a, curbB: 0xffffff, name: "デザートダッシュ"},
    {ground: 0x123a3a, curbA: 0x4af0c8, curbB: 0x0a1a1a, name: "ラグーンループ"},
    {ground: 0x3a1414, curbA: 0xffffff, curbB: 0xd43a3a, name: "キャニオンコース"},
    {ground: 0x14281a, curbA: 0xffe14a, curbB: 0x2a2a2a, name: "ミステリーウッズ"},
    {ground: 0x241a3a, curbA: 0xff6fae, curbB: 0xffffff, name: "スターライトアベニュー"}
];
// コース番号(0〜31)を元に、毎回同じ形の「くねくねコース」をひとつ作る
function buildTrack(seed){
    const rnd = mulberry32(seed * 97531 + 12345);
    const ctrlN = 11 + Math.floor(rnd() * 4);   // 11〜14の制御点
    const baseR = 95 + rnd() * 35;
    const ctrl = [];
    let theta = 0;
    for(let i = 0; i < ctrlN; i++){
        theta += (Math.PI * 2 / ctrlN) * (0.65 + rnd() * 0.7);   // 角度は必ず増える＝輪が交差しない
        const wobble = Math.sin(theta * 2.3 + seed * 1.7) * baseR * 0.14;   // 「ぐにゃぐにゃ」感を足す
        const r = baseR * (0.55 + rnd() * 0.85) + wobble;
        ctrl.push([Math.cos(theta) * r, Math.sin(theta) * r]);
    }
    const pts = catmullRomClosed(ctrl, 14);
    const width = 18 + rnd() * 8;
    return {pts, width, startX: pts[0][0], startZ: pts[0][1], theme: COURSE_THEMES[seed % COURSE_THEMES.length], courseNo: seed + 1};
}
// 障害物（コースのあちこちに置く。ぶつかると つまずく。アイテムとはちがい、消費されず ずっと残る）
function placeObstacles(track, seed){
    const rnd = mulberry32(seed * 51913 + 777);
    const N = track.pts.length, half = track.width / 2;
    const count = 16 + Math.floor(rnd() * 10);
    const gap = Math.max(3, Math.floor(N / (count + 3)));
    const obstacles = [];
    let idx = Math.floor(rnd() * gap);
    while(idx < N && obstacles.length < count){
        const p = track.pts[idx], q = track.pts[(idx + 1) % N];
        const dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len, nz = dx / len;
        const off = (rnd() * 2 - 1) * (half * 0.62);
        obstacles.push({x: p[0] + nx * off, z: p[1] + nz * off, r: 1.0 + rnd() * 0.5});
        idx += gap + Math.floor(rnd() * gap * 0.6);
    }
    return obstacles;
}

// ===== 10種のオリジナルアイテム（マリオの こうら・バナナなどは 使わない、まったく別の効果） =====
const ITEM_INFO = {
    1: {emoji: "🥤", name: "ダッシュドリンク"},
    2: {emoji: "👟", name: "スプリントシューズ"},
    3: {emoji: "🧥", name: "ガードポンチョ"},
    4: {emoji: "🪢", name: "足止めロープ"},
    5: {emoji: "💤", name: "眠気スプレー"},
    6: {emoji: "💦", name: "ぬかるみ跳ね"},
    7: {emoji: "🪨", name: "石ころばらまき"},
    8: {emoji: "🌀", name: "こむら返りの風"},
    9: {emoji: "📣", name: "大声援どよめき"},
    10: {emoji: "📢", name: "応援メガホン"}
};

export function start(ctx){
    const {Input, G8, renderer, camera, makeLitScene, consumeJumpEdge, setHud, toast, showResult} = ctx;
    const scene = makeLitScene(0x9fe0ff, 0x234a2a, "race");

    const courseSeed = Math.floor(Math.random() * COURSE_COUNT);
    const track = buildTrack(courseSeed);
    const obstacleList = placeObstacles(track, courseSeed);
    const N = track.pts.length;
    const LAPS = 3;
    toast("🏁 コース " + track.courseNo + " / " + COURSE_COUNT + "：" + track.theme.name);
    const raceStartMs = performance.now();

    // アイテムボックスを置く場所（コースを8か所に分けて置く）
    const ITEMBOX_N = 8;
    const itemBoxPts = [];
    for(let i = 0; i < ITEMBOX_N; i++){
        const idx = Math.floor((i / ITEMBOX_N) * N);
        itemBoxPts.push(track.pts[idx]);
    }

    // ---------- C++ 側へコースとレーサーを渡す ----------
    function loadRace(){
        G8.race_reset(LAPS);
        track.pts.forEach((p) => G8.race_add_waypoint(p[0], p[1]));
        G8.race_set_width(track.width);
        itemBoxPts.forEach((p) => G8.race_add_itembox(p[0], p[1]));
        obstacleList.forEach((ob) => G8.race_add_obstacle(ob.x, ob.z, ob.r));
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
    const curbMatA = new T.MeshStandardMaterial({color: track.theme.curbA, roughness: 0.75});
    const curbMatB = new T.MeshStandardMaterial({color: track.theme.curbB, roughness: 0.75});
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
    const groundMesh = new T.Mesh(new T.PlaneGeometry(260, 220), new T.MeshStandardMaterial({color: track.theme.ground, roughness: 1}));
    groundMesh.rotation.x = -Math.PI / 2; groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // ---------- 障害物（コース上にランダムに置かれる。ぶつかると ふらついて少しの間おくれる） ----------
    const obstacleMat = new T.MeshStandardMaterial({color: 0xff8a1a, roughness: 0.55, emissive: 0x4a2000, emissiveIntensity: 0.25});
    const obstacleBandMat = new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.6});
    obstacleList.forEach((ob) => {
        const g = new T.Group();
        const cone = new T.Mesh(new T.ConeGeometry(ob.r * SCALE, ob.r * SCALE * 1.8, 12), obstacleMat);
        cone.position.y = ob.r * SCALE * 0.9; cone.castShadow = true; g.add(cone);
        const band = new T.Mesh(new T.CylinderGeometry(ob.r * SCALE * 0.72, ob.r * SCALE * 0.78, ob.r * SCALE * 0.3, 12), obstacleBandMat);
        band.position.y = ob.r * SCALE * 0.55; g.add(band);
        g.position.set(ob.x * SCALE, 0, ob.z * SCALE);
        scene.add(g);
    });

    // ---------- ランナー（走っているキャラクター。マラソンのイメージ） ----------
    // コース幅（約2.75 world単位）に きちんと 収まるよう、小さめの寸法にする
    const HIP_Y = 0.46, SHOULDER_Y = 0.62;
    function limb(len, mat, capMat){
        const piv = new T.Group();
        const m = new T.Mesh(new T.CapsuleGeometry(0.045, len, 4, 8), mat);
        m.position.y = -len / 2 - 0.045; m.castShadow = true;
        piv.add(m);
        if(capMat){
            const cap = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), capMat);
            cap.position.y = -len - 0.09; piv.add(cap);
        }
        return piv;
    }
    function makeRunner(color){
        const g = new T.Group();
        const skinMat = new T.MeshStandardMaterial({color: 0xffd9b3, roughness: 0.6});
        const bodyMat = new T.MeshStandardMaterial({color, roughness: 0.5, metalness: 0.08});
        const shoeMat = new T.MeshStandardMaterial({color: 0x222222, roughness: 0.7});

        const torso = new T.Mesh(new T.CapsuleGeometry(0.14, 0.26, 4, 8), bodyMat);
        torso.position.y = HIP_Y + 0.17; torso.castShadow = true; g.add(torso);
        const stripe = new T.Mesh(new T.BoxGeometry(0.03, 0.26, 0.29), new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.4}));
        stripe.position.set(0.15, HIP_Y + 0.17, 0); g.add(stripe);
        const head = new T.Mesh(new T.SphereGeometry(0.13, 16, 12), skinMat);
        head.position.y = HIP_Y + 0.46; head.castShadow = true; g.add(head);
        const band = new T.Mesh(new T.TorusGeometry(0.135, 0.025, 8, 16), bodyMat);
        band.position.y = head.position.y + 0.02; band.rotation.x = Math.PI / 2; g.add(band);

        const legL = limb(0.42, bodyMat, shoeMat); legL.position.set(-0.08, HIP_Y, 0.02); g.add(legL);
        const legR = limb(0.42, bodyMat, shoeMat); legR.position.set(0.08, HIP_Y, 0.02); g.add(legR);
        const armL = limb(0.3, skinMat, null); armL.position.set(-0.17, SHOULDER_Y, 0); g.add(armL);
        const armR = limb(0.3, skinMat, null); armR.position.set(0.17, SHOULDER_Y, 0); g.add(armR);
        g.userData.legL = legL; g.userData.legR = legR; g.userData.armL = armL; g.userData.armR = armR;

        // ガードポンチョ（シールド）中は、まわりに うっすら光るバブルを出す
        const shield = new T.Mesh(new T.SphereGeometry(0.56, 16, 12), new T.MeshStandardMaterial({color: 0x7ecbff, transparent: true, opacity: 0.0, roughness: 0.2, metalness: 0.1, emissive: 0x2a6fa8, emissiveIntensity: 0.3}));
        shield.position.y = HIP_Y + 0.2; g.add(shield);
        g.userData.shield = shield;
        g.userData.phase = Math.random() * Math.PI * 2;
        return g;
    }
    const carColors = [0xff3b3b, 0x2e7bff, 0x2fe08a, 0xffcf2e];
    const cars = carColors.map((c) => { const m = makeRunner(c); scene.add(m); return m; });

    // ---------- たすけモンスター（コースから大きくはずれて 止まってしまったら、かわいいモンスターがランナーをコースへ運んでくれる） ----------
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
        // ランナーとつながる ひも
        const rope = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1, 6), new T.MeshBasicMaterial({color: 0xffffff}));
        rope.userData.isRope = true;
        g.add(rope);
        g.userData.prop = prop; g.userData.rope = rope;
        g.visible = false;
        scene.add(g);
        return g;
    }
    const rescueAnim = cars.map(() => ({active: false, fromX: 0, fromZ: 0, toX: 0, toZ: 0, toHeading: 0, monster: makeRescueMonster()}));

    // ---------- アイテムボックス（とると10種のどれかを持つ。またとれば おきかわる） ----------
    const itemGlowTex = makeGlowTexture();
    function makeItemBox(){
        const g = new T.Group();
        const core = new T.Mesh(new T.OctahedronGeometry(0.26, 0), new T.MeshStandardMaterial({color: 0xffe14a, emissive: 0xffb300, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.4}));
        core.castShadow = true; g.add(core);
        const glow = new T.Sprite(new T.SpriteMaterial({map: itemGlowTex, color: 0xffe79a, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending}));
        glow.scale.set(1.1, 1.1, 1); g.add(glow);
        g.userData.core = core; g.userData.glow = glow;
        g.position.y = 0.5;
        scene.add(g);
        return g;
    }
    const itemBoxMeshes = itemBoxPts.map((p) => {
        const m = makeItemBox();
        m.position.x = p[0] * SCALE; m.position.z = p[1] * SCALE;
        return m;
    });

    // ---------- わな（ぬかるみ・石ころ）：使わなかった人にも見えるよう、地面に出す ----------
    const MAX_TRAP_VIS = 16;
    function makeTrapMesh(){
        const g = new T.Group();
        const mud = new T.Mesh(new T.CircleGeometry(0.75, 20), new T.MeshStandardMaterial({color: 0x6b4a2a, roughness: 0.95, transparent: true, opacity: 0.85}));
        mud.rotation.x = -Math.PI / 2; mud.position.y = 0.012; g.add(mud);
        const pebbles = new T.Group();
        for(let i = 0; i < 6; i++){
            const pb = new T.Mesh(new T.SphereGeometry(0.09 + Math.random() * 0.05, 8, 6), new T.MeshStandardMaterial({color: 0x999288, roughness: 0.8}));
            const a = (i / 6) * Math.PI * 2, r = 0.25 + Math.random() * 0.25;
            pb.position.set(Math.cos(a) * r, 0.06, Math.sin(a) * r);
            pb.castShadow = true;
            pebbles.add(pb);
        }
        g.add(pebbles);
        g.userData.mud = mud; g.userData.pebbles = pebbles;
        g.visible = false;
        scene.add(g);
        return g;
    }
    const trapMeshes = Array.from({length: MAX_TRAP_VIS}, () => makeTrapMesh());

    // ---------- HUD ----------
    function paintHud(lap, rank, carN, speedKmh, heldItem, effects){
        const item = heldItem ? (ITEM_INFO[heldItem].emoji + ' ' + ITEM_INFO[heldItem].name + '（決定キーで使う）') : "アイテムなし";
        let fx = "";
        if(effects){
            if(effects.stagger) fx += " 😵つまずき中";
            if(effects.slow) fx += " 🐌スロー中";
            if(effects.shield) fx += " 🧥ガード中";
            if(effects.speedBuff) fx += " 🥤ダッシュ中";
            if(effects.turnBuff) fx += " 👟スプリント中";
        }
        setHud('<span>C' + track.courseNo + ' 🏁 Lap ' + Math.min(lap + 1, LAPS) + '/' + LAPS + '</span><span>順位 ' + rank + '/' + carN + '</span><span>' + Math.round(speedKmh) + ' km/h</span><span>' + item + fx + '</span>');
    }

    let done = false, running = true, lastT = performance.now();
    function frame(t){
        if(!running) return;
        requestAnimationFrame(frame);
        let dt = (t - lastT) / 1000; lastT = t;
        if(dt > 0.05) dt = 0.05;

        if(!ctx.isPaused() && !done){
            const steer = (Input.left ? -1 : 0) + (Input.right ? 1 : 0);
            const useItemEdge = consumeJumpEdge() ? 1 : 0;
            G8.race_step(dt, steer, 1, 0, useItemEdge);
            const ptr = G8.race_get_buffer();
            const MAX_CAR = 4, PER_CAR = 16, MAX_TRAP = 16, MAX_ITEMBOX = 8;
            const TOTAL = 6 + MAX_CAR * PER_CAR + MAX_TRAP * 4 + MAX_ITEMBOX * 3;
            const buf = new Float32Array(G8.heap().buffer, ptr, TOTAL);
            const carN = buf[0] | 0;
            const trapN = buf[4] | 0, boxN = buf[5] | 0;
            const progress = [];
            for(let i = 0; i < carN; i++){
                const o = 6 + i * PER_CAR;
                const x = buf[o], z = buf[o + 1], heading = buf[o + 2], speed = buf[o + 3];
                const lap = buf[o + 4], finished = buf[o + 5], rank = buf[o + 6], prog = buf[o + 7];
                const rescue = buf[o + 9]; // 1→0：かわいいモンスターが 運んでいる残り（0なら 通常どおり）
                const heldItem = buf[o + 10] | 0;
                const stagger = buf[o + 11] > 0, slow = buf[o + 12] > 0, shield = buf[o + 13] > 0;
                const speedBuff = buf[o + 14] > 0, turnBuff = buf[o + 15] > 0;
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
                    // つまずき中は がくっと前のめりに、それ以外は まっすぐ立って走る
                    const wobble = stagger ? Math.sin(performance.now() / 90) * 0.18 : 0;
                    cars[i].position.set(wx, 0, wz);
                    cars[i].rotation.set(stagger ? 0.35 : 0, heading, wobble);
                }
                // 走るアニメーション（速さに合わせて 足・うでを ふる。つまずき中は止める）
                const runner = cars[i];
                const strideHz = stagger ? 0 : 1.2 + (speed / 20);
                runner.userData.phase += dt * strideHz * Math.PI * 2;
                const swing = stagger ? 0 : Math.sin(runner.userData.phase) * (0.55 + Math.min(speed / 40, 0.5));
                runner.userData.legL.rotation.x = swing;
                runner.userData.legR.rotation.x = -swing;
                runner.userData.armL.rotation.x = -swing * 0.8;
                runner.userData.armR.rotation.x = swing * 0.8;
                // ガードポンチョ中は バブルを出す
                const shieldMesh = runner.userData.shield;
                shieldMesh.material.opacity = shield ? 0.32 + Math.sin(performance.now() / 150) * 0.06 : 0.0;

                progress.push({i, score: lap * 10000 + prog});
                if(i === 0){
                    progress._player = {lap, speed, finished, rank, heldItem, effects: {stagger, slow, shield, speedBuff, turnBuff}};
                }
            }

            // トラップ（わな）の見た目
            for(let i = 0; i < MAX_TRAP_VIS; i++){
                const o = 6 + MAX_CAR * PER_CAR + i * 4;
                const life = i < trapN ? buf[o + 3] : 0;
                const m = trapMeshes[i];
                if(life > 0){
                    const kind = buf[o + 2] | 0;
                    m.position.set(buf[o] * SCALE, 0, buf[o + 1] * SCALE);
                    m.userData.mud.visible = kind === 0;
                    m.userData.pebbles.visible = kind === 1;
                    m.visible = true;
                }else{
                    m.visible = false;
                }
            }
            // アイテムボックスの見た目（とられていたら 消え、復活したら また浮かぶ）
            for(let i = 0; i < itemBoxMeshes.length; i++){
                const o = 6 + MAX_CAR * PER_CAR + MAX_TRAP * 4 + i * 3;
                const avail = i < boxN ? buf[o + 2] > 0 : true;
                const m = itemBoxMeshes[i];
                m.visible = avail;
                if(avail){
                    m.rotation.y += dt * 1.4;
                    m.position.y = 0.5 + Math.sin(performance.now() / 300 + i) * 0.08;
                }
            }

            progress.sort((a, b) => b.score - a.score);
            const playerRank = progress.findIndex((p) => p.i === 0) + 1;
            const pinfo = progress._player;
            paintHud(pinfo.lap, playerRank, carN, pinfo.speed * 3.2, pinfo.heldItem, pinfo.effects);

            if(pinfo.finished >= 1 && !done){
                done = true;
                const rankTxt = pinfo.rank === 1 ? '<span class="rank1">🥇 1位</span>' : pinfo.rank + '位';
                const finishSec = (performance.now() - raceStartMs) / 1000;
                try{
                    if(window.AREFeaturePanel){
                        window.AREFeaturePanel.recordRun("game8", finishSec);
                        const rec = JSON.parse(localStorage.getItem("g8_race_rec") || "{\"races\":0,\"wins\":0,\"bestRank\":99}");
                        rec.races = (rec.races || 0) + 1;
                        if(pinfo.rank === 1) rec.wins = (rec.wins || 0) + 1;
                        rec.bestRank = Math.min(rec.bestRank || 99, pinfo.rank || 99);
                        rec.lastFinishSec = finishSec;
                        localStorage.setItem("g8_race_rec", JSON.stringify(rec));
                    }
                }catch(_e){}
                showResult("🏁 ゴール！", '<p>結果：' + rankTxt + ' ／ ' + LAPS + '周 ／ タイム ' + finishSec.toFixed(1) + '秒</p>', () => restart(), () => {});
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
