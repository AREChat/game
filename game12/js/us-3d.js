import * as T from "../../game9/vendor/three/build/three.module.js";
/* AREUSO：3D 描画（three.js 0.160）。戦闘エンジン US.step の 状態(B)と イベント(B.ev)を 絵に する。
   ノイズ＝ざらざらした 光の 人形。生き物の 足や 羽を まねた 形は 作らない。 */
(function(){
    var US = window.US, PI = Math.PI, TAU = PI * 2;
    function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
    function lerp(a, b, t){ return a + (b - a) * t; }
    function wrap(a){ while(a > PI) a -= TAU; while(a < -PI) a += TAU; return a; }
    function hex(c){ return new T.Color(c); }

    // ふわっとした 丸い 光の 点（パーティクル）
    var PV = "attribute float size; attribute vec3 col; attribute float al; varying vec3 vc; varying float va; uniform float sc; void main(){ vc = col; va = al; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * sc / max(.1, -mv.z); gl_Position = projectionMatrix * mv; }";
    var PF = "varying vec3 vc; varying float va; void main(){ vec2 p = gl_PointCoord - .5; float d = length(p); if(d > .5) discard; float a = smoothstep(.5, .05, d) * va; gl_FragColor = vec4(vc * (1.0 + (1.0 - d * 2.0) * .6), a); }";
    var SKYV = "varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
    var SKYF = "varying vec3 vp; uniform vec3 top; uniform vec3 hor; uniform float t; void main(){ float h = clamp(normalize(vp).y * 1.35 + .08, 0., 1.); vec3 c = mix(hor, top, pow(h, .7)); float band = sin(vp.y * .08 + t * .6) * .5 + .5; c += hor * .08 * band * (1. - h); gl_FragColor = vec4(c, 1.); }";

    function create(canvas, opts){
        opts = opts || {}; var gl;
        var R = {quality: opts.quality || "high", yaw: 0, pitch: .5, dist: 11, ok: false, cin: null, time: 0, stage: null};
        try {
            var renderer = new T.WebGLRenderer({canvas: canvas, antialias: R.quality === "high", powerPreference: "high-performance", alpha: false});
        } catch(e){ return null; }
        if(!renderer || !renderer.getContext()) return null;
        R.renderer = renderer; renderer.setClearColor(0x05020f, 1);
        var scene = new T.Scene(), camera = new T.PerspectiveCamera(56, 1, .1, 400);
        R.scene = scene; R.camera = camera;
        scene.add(new T.HemisphereLight(0xcfd8ff, 0x302848, 1.05)); var dl = new T.DirectionalLight(0xfff0d8, .9); dl.position.set(-20, 40, 15); scene.add(dl);
        var ambient = new T.AmbientLight(0x404060, .5); scene.add(ambient);

        /* ---- 共通 ジオメトリ ---- */
        var G = {box: new T.BoxGeometry(1, 1, 1), sph: new T.SphereGeometry(.5, 12, 8), cyl: new T.CylinderGeometry(.5, .5, 1, 10), cone: new T.ConeGeometry(.5, 1, 8), oct: new T.OctahedronGeometry(.5, 0), ring: new T.RingGeometry(.92, 1, 40), disc: new T.CircleGeometry(1, 28), ico: new T.IcosahedronGeometry(.5, 0)};
        var MB = function(c, o){ return new T.MeshBasicMaterial(Object.assign({color: c}, o || {})); };
        var ADD = {transparent: true, blending: T.AdditiveBlending, depthWrite: false};
        var skyMat = new T.ShaderMaterial({vertexShader: SKYV, fragmentShader: SKYF, side: T.BackSide, depthWrite: false, fog: false, uniforms: {top: {value: new T.Color(0x112)}, hor: {value: new T.Color(0x844)}, t: {value: 0}}});
        var sky = new T.Mesh(new T.SphereGeometry(300, 24, 12), skyMat); scene.add(sky);

        /* ---- パーティクル ---- */
        var NP = R.quality === "high" ? 1400 : 600, pp = {i: 0, pos: new Float32Array(NP * 3), vel: new Float32Array(NP * 3), life: new Float32Array(NP), max: new Float32Array(NP), size: new Float32Array(NP), col: new Float32Array(NP * 3), al: new Float32Array(NP), g: new Float32Array(NP)};
        var pgeo = new T.BufferGeometry();
        pgeo.setAttribute("position", new T.BufferAttribute(pp.pos, 3)); pgeo.setAttribute("size", new T.BufferAttribute(pp.size, 1)); pgeo.setAttribute("col", new T.BufferAttribute(pp.col, 3)); pgeo.setAttribute("al", new T.BufferAttribute(pp.al, 1));
        var pmat = new T.ShaderMaterial({vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: {sc: {value: 600}}});
        var points = new T.Points(pgeo, pmat); points.frustumCulled = false; scene.add(points);
        function emit(x, y, z, vx, vy, vz, life, size, col, g){
            var i = pp.i; pp.i = (i + 1) % NP; var k = i * 3; pp.pos[k] = x; pp.pos[k + 1] = y; pp.pos[k + 2] = z; pp.vel[k] = vx; pp.vel[k + 1] = vy; pp.vel[k + 2] = vz;
            pp.life[i] = life; pp.max[i] = life; pp.size[i] = size; var c = col; pp.col[k] = c.r; pp.col[k + 1] = c.g; pp.col[k + 2] = c.b; pp.g[i] = g === undefined ? 9 : g;
        }
        function burst(x, y, z, n, spd, life, size, col, g, up){
            if(R.quality !== "high") n = Math.ceil(n * .5);
            for(var i = 0; i < n; i++){ var a = Math.random() * TAU, e = Math.random() * 2 - .8, s = spd * (.4 + Math.random() * .8); emit(x, y, z, Math.sin(a) * s * Math.cos(e), (up || 0) + Math.sin(e) * s + 1, Math.cos(a) * s * Math.cos(e), life * (.6 + Math.random() * .6), size * (.6 + Math.random() * .8), col, g); }
        }
        function updParticles(dt){
            for(var i = 0; i < NP; i++){
                var l = pp.life[i]; if(l <= 0){ pp.al[i] = 0; continue; } l -= dt; pp.life[i] = l; var k = i * 3;
                pp.vel[k + 1] -= pp.g[i] * dt; pp.vel[k] *= 1 - dt * .8; pp.vel[k + 2] *= 1 - dt * .8;
                pp.pos[k] += pp.vel[k] * dt; pp.pos[k + 1] += pp.vel[k + 1] * dt; pp.pos[k + 2] += pp.vel[k + 2] * dt;
                if(pp.pos[k + 1] < .05 && pp.g[i] > 0){ pp.pos[k + 1] = .05; pp.vel[k + 1] *= -.35; }
                pp.al[i] = l > 0 ? clamp(l / pp.max[i] * 1.6, 0, 1) : 0;
            }
            pgeo.attributes.position.needsUpdate = true; pgeo.attributes.al.needsUpdate = true; pgeo.attributes.size.needsUpdate = true; pgeo.attributes.col.needsUpdate = true;
        }

        /* ---- 衝撃波・斬撃(リング・扇) の プール ---- */
        var FX = [];
        function fxMesh(geo, col, op){ var m = new T.Mesh(geo, MB(col, Object.assign({side: T.DoubleSide, opacity: op || 1}, ADD))); m.visible = false; m.rotation.order = "YXZ"; scene.add(m); return m; }
        for(var q = 0; q < 40; q++){ var fm = fxMesh(G.ring, 0xffffff); FX.push({m: fm, on: false, t: 0, dur: 1, kind: "ring", s0: 1, s1: 1, o: 1}); }
        function shock(x, z, r0, r1, dur, col, y, op, kind, geo){
            for(var i = 0; i < FX.length; i++){ var f = FX[i]; if(f.on) continue; f.on = true; f.t = 0; f.dur = dur; f.s0 = r0; f.s1 = r1; f.o = op === undefined ? .9 : op; f.kind = kind || "ring"; f.m.geometry = geo || G.ring; f.m.material.color.set(col); f.m.position.set(x, y === undefined ? .08 : y, z); f.m.rotation.set(-PI / 2, 0, 0); f.m.visible = true; f.m.scale.set(r0, r0, r0); f.m.material.opacity = f.o; return f; }
            return null;
        }
        function updFX(dt){
            for(var i = 0; i < FX.length; i++){ var f = FX[i]; if(!f.on) continue; f.t += dt; var p = f.t / f.dur; if(p >= 1){ f.on = false; f.m.visible = false; continue; }
                var s = lerp(f.s0, f.s1, 1 - Math.pow(1 - p, 2)); if(f.kind === "ring"){ f.m.scale.set(s, s, s); } else if(f.kind === "pillar"){ f.m.scale.set(s, 1, s); } else if(f.kind === "arc"){ f.m.scale.set(s, s, 1); }
                f.m.material.opacity = f.o * (1 - p) * (1 - p * .3); }
        }
        // 斬撃の 扇
        var arcCache = {};
        function arcGeo(arcDeg){ var k = Math.round(arcDeg / 10); if(arcCache[k]) return arcCache[k]; var a = Math.min(TAU, arcDeg * PI / 180); var g = new T.RingGeometry(.35, 1, 28, 1, -a / 2 + PI / 2, a); arcCache[k] = g; return g; }

        /* ---- 影（丸い まる） ---- */
        var shadowMat = MB(0x000000, {transparent: true, opacity: .38, depthWrite: false});
        var shadowIM = new T.InstancedMesh(G.disc, shadowMat, 140); shadowIM.rotation.x = -PI / 2; shadowIM.frustumCulled = false; scene.add(shadowIM); shadowIM.count = 0;

        /* ---- ステージ ---- */
        var stageGroup = new T.Group(); scene.add(stageGroup); var bases = [], decor = {shards: [], motes: null};
        function gridTex(line, base){
            var c = document.createElement("canvas"); c.width = c.height = 256; var x = c.getContext("2d"); x.fillStyle = base; x.fillRect(0, 0, 256, 256);
            for(var i = 0; i < 40; i++){ x.fillStyle = "rgba(255,255,255," + (Math.random() * .05) + ")"; x.fillRect(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 40, 2 + Math.random() * 10); }
            x.strokeStyle = line; x.globalAlpha = .75; x.lineWidth = 2; x.strokeRect(1, 1, 254, 254); x.globalAlpha = .25; x.lineWidth = 1; x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.moveTo(0, 128); x.lineTo(256, 128); x.stroke();
            var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
        }
        R.setStage = function(st){
            R.stage = st; while(stageGroup.children.length) { var ch = stageGroup.children.pop(); if(ch.geometry) ch.geometry.dispose(); if(ch.material){ if(ch.material.map) ch.material.map.dispose(); ch.material.dispose(); } }
            bases.length = 0; decor.shards.length = 0; var top = hex(st.sky[0]), hor = hex(st.sky[1]); skyMat.uniforms.top.value.copy(top); skyMat.uniforms.hor.value.copy(hor);
            scene.fog = new T.Fog(hor.clone().multiplyScalar(.55).getHex(), 38, 170); renderer.setClearColor(hor.getHex(), 1);
            var tex = gridTex("#" + hex(st.line).getHexString(), "#" + hex(st.ground).getHexString()); tex.repeat.set(st.r / 5, st.r / 5);
            var gm = new T.Mesh(new T.CircleGeometry(st.r + 40, 48), new T.MeshBasicMaterial({map: tex, fog: true})); gm.rotation.x = -PI / 2; stageGroup.add(gm);
            // 外わく
            var edge = new T.Mesh(new T.TorusGeometry(st.r + .5, .22, 8, 96), MB(st.line, {fog: false})); edge.rotation.x = PI / 2; edge.position.y = .2; stageGroup.add(edge);
            var wall = new T.Mesh(new T.CylinderGeometry(st.r + .5, st.r + .5, 7, 64, 1, true), MB(st.line, {transparent: true, opacity: .1, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, fog: false})); wall.position.y = 3.5; stageGroup.add(wall);
            // 柱と かけら
            var n = R.quality === "high" ? 22 : 12, hc = hex(st.line);
            for(var i = 0; i < n; i++){ var a = i / n * TAU, rr = st.r + 3 + (i % 3) * 1.5, h = 5 + (i * 7 % 6); var p = new T.Mesh(G.box, new T.MeshLambertMaterial({color: 0x2a2a44, emissive: hc, emissiveIntensity: .12})); p.scale.set(1.6, h, 1.6); p.position.set(Math.sin(a) * rr, h / 2, Math.cos(a) * rr); p.rotation.y = a; stageGroup.add(p);
                var cap = new T.Mesh(G.oct, MB(st.line, {fog: false})); cap.scale.set(1.3, 1.3, 1.3); cap.position.set(p.position.x, h + 1.4, p.position.z); stageGroup.add(cap); decor.shards.push({m: cap, a: a, h: h + 1.4, ph: i}); }
            // 遠景の 光の 塔
            for(var j = 0; j < 14; j++){ var aj = j / 14 * TAU + .2, rj = st.r + 40 + (j % 4) * 14; var tw = new T.Mesh(G.box, MB(st.line, {transparent: true, opacity: .16 + (j % 3) * .05, fog: false})); var th = 24 + (j * 13 % 40); tw.scale.set(3 + j % 3, th, 3); tw.position.set(Math.sin(aj) * rj, th / 2, Math.cos(aj) * rj); stageGroup.add(tw); }
            // 空の 星
            var sg = new T.BufferGeometry(), sp = new Float32Array(300 * 3); for(var s = 0; s < 300; s++){ var u = Math.random() * TAU, v = Math.random() * .9 + .08, rr2 = 280; sp[s * 3] = Math.sin(u) * Math.cos(v) * rr2; sp[s * 3 + 1] = Math.sin(v) * rr2; sp[s * 3 + 2] = Math.cos(u) * Math.cos(v) * rr2; } sg.setAttribute("position", new T.BufferAttribute(sp, 3));
            var stars = new T.Points(sg, new T.PointsMaterial({color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .8})); stageGroup.add(stars);
            // 拠点
            if(R.B) R.B.bases.forEach(function(b){ var g = new T.Group(); var ring = new T.Mesh(G.ring, MB(0xffd34d, Object.assign({side: T.DoubleSide, opacity: .9}, ADD))); ring.rotation.x = -PI / 2; ring.scale.set(b.r, b.r, b.r); ring.position.y = .1; g.add(ring);
                var fill = new T.Mesh(G.disc, MB(0x4de1ff, Object.assign({side: T.DoubleSide, opacity: .35}, ADD))); fill.rotation.x = -PI / 2; fill.position.y = .09; g.add(fill);
                var beam = new T.Mesh(G.cyl, MB(0xffd34d, Object.assign({opacity: .25}, ADD))); beam.scale.set(1.2, 30, 1.2); beam.position.y = 15; g.add(beam); g.position.set(b.x, 0, b.z); stageGroup.add(g); bases.push({g: g, ring: ring, fill: fill, beam: beam, b: b}); });
        };

        /* ---- 武将（プレイヤー）モデル ---- */
        var hero = null;
        function box(w, h, d, mat){ var m = new T.Mesh(G.box, mat); m.scale.set(w, h, d); return m; }
        R.setHero = function(h){
            if(hero){ scene.remove(hero.root); } var main = new T.MeshLambertMaterial({color: h.col, emissive: h.col, emissiveIntensity: .12}), dark = new T.MeshLambertMaterial({color: 0x23233a}), skin = new T.MeshLambertMaterial({color: 0xffe0c8}), glow = MB(h.col2, {fog: false}), hair = new T.MeshLambertMaterial({color: h.id === "raiga" ? 0x244a66 : h.id === "gan" ? 0x5a2a2a : h.id === "tsubame" ? 0x3a2a66 : 0x6a3a1a});
            var root = new T.Group(), body = new T.Group(); root.add(body);
            var torso = box(.78, .95, .46, main); torso.position.y = 1.55; body.add(torso); var belt = box(.82, .16, .5, dark); belt.position.y = 1.08; body.add(belt);
            var head = new T.Mesh(G.sph, skin); head.scale.set(.48, .5, .48); head.position.y = 2.28; body.add(head); var hr = new T.Mesh(G.sph, hair); hr.scale.set(.56, .5, .56); hr.position.set(0, 2.38, -.04); body.add(hr);
            var tail = new T.Mesh(G.cone, hair); tail.scale.set(.2, .7, .2); tail.position.set(0, 2.2, -.4); tail.rotation.x = -2.2; body.add(tail);
            var scarf = box(.9, .14, .5, glow); scarf.position.y = 1.98; body.add(scarf);
            var legL = new T.Group(), legR = new T.Group(); [legL, legR].forEach(function(l, i){ l.position.set(i ? .22 : -.22, 1.0, 0); var lm = box(.3, 1.0, .32, dark); lm.position.y = -.5; l.add(lm); var boot = box(.34, .22, .46, main); boot.position.set(0, -.95, .06); l.add(boot); root.add(l); });
            var armL = new T.Group(), armR = new T.Group(); armL.position.set(-.55, 1.9, 0); armR.position.set(.55, 1.9, 0);
            [armL, armR].forEach(function(a){ var am = box(.24, .85, .26, skin); am.position.y = -.42; a.add(am); var gl = box(.28, .3, .3, main); gl.position.y = -.82; a.add(gl); root.add(a); });
            var wp = new T.Group(); armR.add(wp); wp.position.set(0, -.85, .12); var wp2 = null;
            if(h.w === "sword"){ var bl = box(.1, 1.7, .26, glow); bl.position.y = .95; wp.add(bl); var gd = box(.7, .12, .2, dark); gd.position.y = .1; wp.add(gd); var hd = box(.1, .5, .1, dark); hd.position.y = -.1; wp.add(hd); wp.rotation.x = 1.3; }
            else if(h.w === "spear"){ var sh = new T.Mesh(G.cyl, dark); sh.scale.set(.08, 3.8, .08); sh.position.y = .3; wp.add(sh); var tip = new T.Mesh(G.cone, glow); tip.scale.set(.28, .9, .12); tip.position.y = 2.6; wp.add(tip); wp.rotation.x = 1.45; wp.position.z = .2; }
            else if(h.w === "hammer"){ var hs = new T.Mesh(G.cyl, dark); hs.scale.set(.1, 2.6, .1); hs.position.y = .5; wp.add(hs); var hh = box(1.0, .8, .8, main); hh.position.y = 1.9; wp.add(hh); var hg = box(1.05, .18, .85, glow); hg.position.y = 1.9; wp.add(hg); wp.rotation.x = 1.0; }
            else { var b1 = box(.08, 1.1, .2, glow); b1.position.y = .6; wp.add(b1); wp.rotation.x = 1.3; wp2 = new T.Group(); armL.add(wp2); wp2.position.set(0, -.85, .12); var b2 = box(.08, 1.1, .2, glow); b2.position.y = .6; wp2.add(b2); wp2.rotation.x = 1.3; }
            var aura = new T.Mesh(G.sph, MB(h.col2, Object.assign({opacity: .0}, ADD))); aura.scale.set(3, 4, 3); aura.position.y = 1.6; root.add(aura);
            var pil = new T.Mesh(G.cyl, MB(h.col, Object.assign({opacity: 0}, ADD))); pil.scale.set(4, 40, 4); pil.position.y = 20; root.add(pil);
            scene.add(root); hero = {root: root, body: body, legL: legL, legR: legR, armL: armL, armR: armR, wp: wp, wp2: wp2, aura: aura, pil: pil, main: main, torso: torso, h: h, t: 0, run: 0, flash: 0};
        };

        /* ---- ノイズの 兵（インスタンス） ---- */
        var ET = {};
        function mkType(name, parts, tint){ var o = {parts: [], idx: {}, n: 0}; parts.forEach(function(p){ var im = new T.InstancedMesh(p.geo, p.glow ? new T.MeshBasicMaterial({color: 0xffffff}) : new T.MeshLambertMaterial({color: 0xffffff, emissive: 0x2a2a44}), 120); im.frustumCulled = false; im.count = 0; im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(120 * 3), 3); scene.add(im); o.parts.push({im: im, off: p.off, sc: p.sc, glow: !!p.glow, shell: !!p.shell}); }); ET[name] = o; }
        var shellMat = function(){ return MB(0xffffff, {side: T.BackSide, fog: true}); };
        mkType("grunt", [{geo: G.box, off: [0, .85, 0], sc: [.8, 1.3, .55]}, {geo: G.oct, off: [0, 1.75, 0], sc: [.7, .8, .7], glow: true}, {geo: G.box, off: [.55, 1.0, .35], sc: [.14, 1.1, .14], glow: true}]);
        mkType("archer", [{geo: G.cone, off: [0, .8, 0], sc: [.85, 1.6, .85]}, {geo: G.sph, off: [0, 1.85, 0], sc: [.55, .55, .55], glow: true}, {geo: G.ring, off: [.5, 1.1, .3], sc: [.7, .7, .7], glow: true, vert: true}]);
        mkType("shield", [{geo: G.box, off: [0, .9, 0], sc: [.95, 1.5, .6]}, {geo: G.oct, off: [0, 1.95, 0], sc: [.7, .7, .7], glow: true}, {geo: G.box, off: [0, 1.0, .5], sc: [1.4, 1.6, .16], glow: true}]);
        mkType("brute", [{geo: G.box, off: [0, 1.3, 0], sc: [1.9, 2.3, 1.3]}, {geo: G.box, off: [0, 2.9, 0], sc: [1.0, .9, 1.0], glow: true}, {geo: G.box, off: [1.3, 1.5, .2], sc: [.7, 1.9, .7]}]);
        // 色は 型ごと
        var spare = new T.Object3D(), tmpC = new T.Color();

        /* ---- 武将ボス・発生源・飛び道具・ひろいもの ---- */
        var bigs = {}; // id -> {g, ...}
        function mkOfficer(e){
            var d = e.d, g = new T.Group(), col = hex(d.col), gl = hex(d.glow); var m = new T.MeshLambertMaterial({color: col, emissive: col, emissiveIntensity: .25}), dk = new T.MeshLambertMaterial({color: 0x15152a, emissive: gl, emissiveIntensity: .1});
            var body = box(1.5, 2.1, 1.0, m); body.position.y = 1.9; g.add(body); var chest = box(.8, .8, 1.08, MB(gl)); chest.position.y = 2.2; g.add(chest);
            var head = new T.Mesh(G.oct, dk); head.scale.set(1.0, 1.1, 1.0); head.position.y = 3.4; g.add(head); var eye = box(.7, .12, .1, MB(0xffffff)); eye.position.set(0, 3.4, .5); g.add(eye);
            var legs = box(1.1, 1.0, .8, dk); legs.position.y = .5; g.add(legs); var shR = box(.6, .6, .6, m); shR.position.set(1.05, 2.9, 0); g.add(shR); var shL = box(.6, .6, .6, m); shL.position.set(-1.05, 2.9, 0); g.add(shL);
            var armR = new T.Group(); armR.position.set(1.0, 2.7, 0); var ar = box(.4, 1.5, .4, dk); ar.position.y = -.7; armR.add(ar); var bl = box(.2, 2.6, .3, MB(gl)); bl.position.set(0, -1.6, .5); bl.rotation.x = 1.2; armR.add(bl); g.add(armR);
            var halo = new T.Group(); for(var i = 0; i < 6; i++){ var s = new T.Mesh(G.oct, MB(gl, {fog: false})); s.scale.set(.5, .8, .5); var a = i / 6 * TAU; s.position.set(Math.sin(a) * 1.9, 0, Math.cos(a) * 1.9); halo.add(s); } halo.position.y = 3.9; g.add(halo);
            var s2 = e.d.phases ? 1.45 : 1; g.scale.set(s2, s2, s2); scene.add(g); return {g: g, body: body, armR: armR, halo: halo, head: head, chest: chest, m: m, s: s2};
        }
        function mkGen(e){
            var g = new T.Group(), col = hex(0xffd34d); var base = new T.Mesh(G.cyl, new T.MeshLambertMaterial({color: 0x30304a, emissive: col, emissiveIntensity: .15})); base.scale.set(2.2, 1.0, 2.2); base.position.y = .5; g.add(base);
            var core = new T.Mesh(G.ico, MB(0xff4fd8)); core.scale.set(1.9, 1.9, 1.9); core.position.y = 2.6; g.add(core); var r1 = new T.Mesh(G.ring, MB(0xffd34d, Object.assign({side: T.DoubleSide}, ADD))); r1.scale.set(2.2, 2.2, 2.2); r1.position.y = 2.6; g.add(r1); var r2 = r1.clone(); g.add(r2);
            var beam = new T.Mesh(G.cyl, MB(0xff4fd8, Object.assign({opacity: .28}, ADD))); beam.scale.set(.6, 40, .6); beam.position.y = 20; g.add(beam); scene.add(g); return {g: g, core: core, r1: r1, r2: r2};
        }
        var prIM = new T.InstancedMesh(G.ico, MB(0xff4fd8, {fog: false}), 96); prIM.frustumCulled = false; prIM.count = 0; scene.add(prIM);
        var pkIM = new T.InstancedMesh(G.oct, MB(0xffffff, {fog: false}), 40); pkIM.frustumCulled = false; pkIM.count = 0; pkIM.instanceColor = new T.InstancedBufferAttribute(new Float32Array(40 * 3), 3); scene.add(pkIM);

        /* ---- 予告の 赤い 範囲 ---- */
        var TG = []; for(var tq = 0; tq < 22; tq++){ var tm = new T.Mesh(G.disc, MB(0xff2a4a, Object.assign({side: T.DoubleSide, opacity: .0}, ADD))); tm.visible = false; tm.rotation.order = "YXZ"; scene.add(tm); TG.push({m: tm, on: false}); }
        function addTelegraph(o, B){
            var slot = null; for(var i = 0; i < TG.length; i++) if(!TG[i].on){ slot = TG[i]; break; } if(!slot) return;
            slot.on = true; slot.t = 0; slot.dur = o.dur; slot.id = o.id; slot.kind = o.kind; slot.x = o.x; slot.z = o.z; slot.face = o.face; slot.fixed = o.kind === "dash"; slot.R = o.kind === "slam" ? (o.off ? 5.2 : o.r || 3) : o.kind === "slash" ? 3.6 : o.kind === "melee" ? 1.9 : 1;
            var m = slot.m; m.visible = true;
            if(o.kind === "slam"){ m.geometry = G.disc; m.scale.set(slot.R, slot.R, slot.R); }
            else if(o.kind === "slash" || o.kind === "melee"){ m.geometry = arcGeo(o.kind === "slash" ? 150 : 130); m.scale.set(slot.R, slot.R, 1); }
            else if(o.kind === "dash"){ m.geometry = G.box; m.scale.set(2.2, 12, .02); }
            else { m.geometry = G.box; m.scale.set(.5, o.kind === "fan" ? 14 : 12, .02); }
        }
        function updTelegraph(dt, B){
            for(var i = 0; i < TG.length; i++){ var s = TG[i]; if(!s.on) continue; s.t += dt; var p = s.t / s.dur; var e = null; for(var k = 0; k < B.E.length; k++) if(B.E[k].id === s.id){ e = B.E[k]; break; }
                if(p >= 1 || !e || !e.alive || (e.st !== "windup")){ s.on = false; s.m.visible = false; continue; }
                var m = s.m, x = e.x, z = e.z, f = e.face; m.position.set(x, .12, z); m.rotation.order = "YXZ";
                if(s.kind === "dash"){ var la = e.lockA === undefined ? f : e.lockA; m.position.set(x + Math.sin(la) * 6, .12, z + Math.cos(la) * 6); m.rotation.set(-PI / 2, 0, la); }
                else if(s.kind === "slam"){ m.rotation.set(-PI / 2, 0, 0); }
                else if(s.kind === "slash" || s.kind === "melee"){ m.rotation.set(-PI / 2, 0, f + PI); }
                else { m.position.set(x + Math.sin(f) * 7, .12, z + Math.cos(f) * 7); m.rotation.set(-PI / 2, 0, f); }
                m.material.opacity = .12 + p * .55 + (Math.sin(s.t * 28) > 0 ? .1 : 0);
            }
        }

        /* ---- 斬撃・イベントの 演出 ---- */
        R.process = function(evs, B){
            var P = B.P, h = B.h, c1 = hex(h.col), c2 = hex(h.col2), white = hex(0xffffff);
            for(var i = 0; i < evs.length; i++){
                var e = evs[i], t = e.t;
                if(t === "swing"){ var ag = e.heavy ? Math.max(e.arc, 120) : e.arc; var f = shock(P.x, P.z, e.range * .55, e.range * (e.heavy || e.last ? 1.15 : 1.0), e.heavy ? .3 : .2, e.heavy || e.last ? h.col2 : h.col, 1.0 + (e.heavy ? .1 : 0) + (e.ci % 2 ? .3 : .0), .85, "arc", arcGeo(ag)); if(f){ f.m.rotation.set(-PI / 2, 0, e.face + PI); } burst(P.x + Math.sin(e.face) * e.range * .6, 1.3, P.z + Math.cos(e.face) * e.range * .6, 4, 3, .25, .35, c2, 0); }
                else if(t === "hit"){ var n = e.big ? 14 : 7, col = e.boss ? hex(0xffd34d) : e.crit ? white : c2; burst(e.x, e.y, e.z, n, e.big ? 8 : 5, .45, e.crit ? .9 : .6, col, 7); }
                else if(t === "block"){ burst(e.x, e.y, e.z, 5, 4, .25, .45, hex(0xffd34d), 2); }
                else if(t === "guard"){ burst(e.x, 1.4, e.z, 8, 4, .3, .5, hex(0x4de1ff), 1); shock(e.x, e.z, .6, 2.2, .3, 0x4de1ff, 1.2, .8); }
                else if(t === "hurt"){ burst(e.x, 1.3, e.z, 10, 5, .4, .6, hex(0xff3355), 3); }
                else if(t === "ko"){ var tc = hex(e.type === "grunt" ? 0xff4fd8 : e.type === "archer" ? 0x4de1ff : e.type === "shield" ? 0xffd34d : 0xff7a3d); if(e.off){ tc = hex(0xffffff); burst(e.x, 2, e.z, 90, 14, 1.4, 1.4, tc, 5, 4); shock(e.x, e.z, 1, 16, .9, 0xffffff, .2, 1); shock(e.x, e.z, 1, 10, 1.1, 0xffd34d, .3, .9); } else if(!e.quiet){ burst(e.x, e.y, e.z, 16, 6, .8, .7, tc, 6, 2); } else burst(e.x, e.y, e.z, 5, 4, .6, .6, tc, 4, 2); }
                else if(t === "musou"){ shock(P.x, P.z, 1, 14, .8, h.col2, .2, 1); shock(P.x, P.z, 1, 8, 1.0, h.col, .25, .9); burst(P.x, 1.6, P.z, 60, 10, 1.0, 1.0, c2, 2, 3); }
                else if(t === "musoutick"){ shock(e.x, e.z, 1, e.r, e.final ? .6 : .35, e.final ? 0xffffff : h.col, e.final ? 1.2 : .4, e.final ? 1 : .7); if(e.final){ burst(e.x, 1.5, e.z, 120, 16, 1.3, 1.3, c2, 4, 5); shock(e.x, e.z, 1, e.r * 1.4, .9, h.col2, .2, .8); } else burst(e.x, 1.2, e.z, 20, e.r, .5, .8, c1, 3, 1); }
                else if(t === "dodge"){ burst(e.x, 1, e.z, 12, 4, .4, .6, hex(0x9fe8ff), 0); }
                else if(t === "justdodge"){ shock(e.x, e.z, .5, 7, .6, 0x4de1ff, 1, .9); burst(e.x, 1.4, e.z, 30, 8, .6, .8, hex(0x9fe8ff), 0); }
                else if(t === "slam"){ shock(e.x, e.z, 1, e.r, .45, 0xff3355, .15, 1); burst(e.x, .3, e.z, 24, e.r * 1.6, .6, .7, hex(0xff7a3d), 4, 2); }
                else if(t === "telegraph"){ addTelegraph(e, B); }
                else if(t === "shoot"){ burst(e.x, 1.4, e.z, 5, 3, .25, .5, hex(0xff4fd8), 0); }
                else if(t === "dash"){ burst(e.x, 1, e.z, 20, 6, .4, .7, hex(0xff4fd8), 0); }
                else if(t === "base"){ shock(e.x, e.z, 1, 14, 1.0, 0x4de1ff, .2, 1); burst(e.x, 1, e.z, 70, 9, 1.2, 1, hex(0xffd34d), 3, 4); }
                else if(t === "gen"){ shock(e.x, e.z, 1, 14, .8, 0xffd34d, .2, 1); burst(e.x, 2.5, e.z, 100, 12, 1.2, 1.2, hex(0xff4fd8), 4, 4); burst(e.x, 2.5, e.z, 40, 10, 1.2, 1, hex(0xffd34d), 4, 3); }
                else if(t === "phase"){ shock(e.x, e.z, 1, 40, 1.2, 0xffffff, .3, 1); burst(e.x, 2, e.z, 120, 16, 1.4, 1.4, white, 3, 5); }
                else if(t === "summon"){ shock(e.x, e.z, 1, 12, .8, 0xe8e8ff, .2, .9); burst(e.x, 2, e.z, 40, 8, 1, 1, white, 2, 3); }
                else if(t === "spawn"){ burst(e.x, .5, e.z, 8, 3, .5, .6, hex(0xff4fd8), 2, 2); }
                else if(t === "stagger"){ burst(e.x, 2.5, e.z, 30, 7, .8, 1, hex(0xffd34d), 3, 3); shock(e.x, e.z, 1, 6, .5, 0xffd34d, .2, .9); }
                else if(t === "pickup"){ burst(e.x, 1, e.z, 12, 4, .6, .6, hex(e.k === "hp" ? 0x7dff9a : 0xffd34d), -1, 3); }
                else if(t === "clear"){ for(var k = 0; k < 4; k++) shock(P.x, P.z, 1, 10 + k * 8, .8 + k * .25, k % 2 ? 0xffd34d : 0xffffff, .2, .9); burst(P.x, 2, P.z, 150, 14, 1.8, 1.2, white, -1, 8); }
            }
        };

        /* ---- カメラ ---- */
        var camPos = new T.Vector3(0, 8, -10), camLook = new T.Vector3(), fov0 = 56, fovCur = 56;
        R.lockT = null;
        R.cinema = function(spec, done){ R.cin = {s: spec, t: 0, done: done || null}; };
        R.cinStop = function(){ var c = R.cin; R.cin = null; if(c && c.done) c.done(); };
        function placeCam(B, dt, cam){
            var P = B.P, tx = P.x, tz = P.z, ty = 1.5 + P.y * .3, now = R.time;
            if(R.cin){
                var c = R.cin, s = c.s; c.t += dt; var p = clamp(c.t / s.dur, 0, 1), e = p * p * (3 - 2 * p), look = s.look || [tx, 1.6, tz];
                if(s.kind === "orbit"){ var a = lerp(s.a0, s.a1, e), r = lerp(s.r0 || s.r, s.r, e), hh = lerp(s.h0 === undefined ? s.h : s.h0, s.h, e); camera.position.set(s.cx + Math.sin(a) * r, hh, s.cz + Math.cos(a) * r); camera.lookAt(look[0], look[1], look[2]); }
                else { camera.position.set(lerp(s.from[0], s.to[0], e), lerp(s.from[1], s.to[1], e), lerp(s.from[2], s.to[2], e)); camera.lookAt(look[0], look[1], look[2]); }
                fovCur = lerp(fovCur, s.fov || 48, Math.min(1, dt * 4)); camera.fov = fovCur; camera.updateProjectionMatrix(); camPos.copy(camera.position);
                if(c.t >= s.dur){ R.cin = null; if(c.done) c.done(); } return;
            }
            if(R.demo){ var dm = R.demo; dm.a = (dm.a || 0) + dt * (dm.speed || .25); camera.position.set(dm.cx + Math.sin(dm.a) * dm.r, dm.h, dm.cz + Math.cos(dm.a) * dm.r); camera.lookAt(dm.cx, dm.ly === undefined ? 1.6 : dm.ly, dm.cz); fovCur = lerp(fovCur, dm.fov || 46, Math.min(1, dt * 4)); camera.fov = fovCur; camera.updateProjectionMatrix(); camPos.copy(camera.position); return; }
            // 手動
            if(cam){ if(cam.dyaw) { R.yaw += cam.dyaw; R.manualT = 1.6; } if(cam.dpitch) { R.pitch = clamp(R.pitch + cam.dpitch, .22, 1.0); } if(cam.recenter){ R.recenter = 1; } }
            if(R.manualT > 0) R.manualT -= dt;
            if(R.recenter){ R.yaw += wrap(P.face - R.yaw) * Math.min(1, dt * 7); if(Math.abs(wrap(P.face - R.yaw)) < .05) R.recenter = 0; }
            else if(cam && cam.lock && R.lockT){ var la = Math.atan2(R.lockT.x - P.x, R.lockT.z - P.z); R.yaw += wrap(la - R.yaw) * Math.min(1, dt * 5); }
            else if(!(R.manualT > 0) && P.moving && B.state === "play" && !(cam && cam.noAuto)){ R.yaw += wrap(Math.atan2(P.mx, P.mz) - R.yaw) * Math.min(1, dt * .9) * .5; }
            var musou = P.st === "musou", boss = null; for(var i = 0; i < B.offs.length; i++) if(B.offs[i].alive){ boss = B.offs[i]; break; }
            var dist = R.dist + (boss ? 3 : 0) + Math.min(3, B.E.length * .06), pitch = R.pitch, fov = fov0;
            if(musou){ dist = 7.5; pitch = .28 + Math.sin(P.t * 1.5) * .06; fov = 70; R.yaw += dt * .9; }
            else if(B.state === "clear"){ R.yaw += dt * .35; dist = 9; pitch = .32; fov = 50; }
            else if(B.state === "dead"){ dist = 8; pitch = .5; fov = 46; }
            var cx = tx - Math.sin(R.yaw) * dist * Math.cos(pitch), cz = tz - Math.cos(R.yaw) * dist * Math.cos(pitch), cy = ty + Math.sin(pitch) * dist + .6;
            var k = 1 - Math.pow(.0008, dt); camPos.x += (cx - camPos.x) * k; camPos.y += (cy - camPos.y) * k; camPos.z += (cz - camPos.z) * k;
            camLook.x += (tx + Math.sin(R.yaw) * 2.2 - camLook.x) * k; camLook.y += (ty + .8 - camLook.y) * k; camLook.z += (tz + Math.cos(R.yaw) * 2.2 - camLook.z) * k;
            var sh = B.shake * (opts.shake === false ? 0 : 1) * .18; camera.position.set(camPos.x + (Math.random() - .5) * sh, camPos.y + (Math.random() - .5) * sh, camPos.z + (Math.random() - .5) * sh); camera.lookAt(camLook);
            fovCur = lerp(fovCur, fov, Math.min(1, dt * 3)); camera.fov = fovCur; camera.updateProjectionMatrix();
            // 地面の すぐ 下へ 入らない
            if(camera.position.y < .6) camera.position.y = .6;
        }
        R.snapCamera = function(B){ var P = B.P; camPos.set(P.x - Math.sin(R.yaw) * 11, 7, P.z - Math.cos(R.yaw) * 11); camLook.set(P.x, 1.6, P.z); };

        /* ---- 更新 ---- */
        var mtx = new T.Matrix4(), q = new T.Quaternion(), eul = new T.Euler(), v3 = new T.Vector3(), v3s = new T.Vector3(), v3p = new T.Vector3();
        function poseHero(B, dt){
            var P = B.P, hh = hero, h = hh.h; hh.t += dt; var t = hh.t; hh.root.position.set(P.x, P.y, P.z); hh.root.rotation.y = P.face;
            var run = P.moving && P.st === "idle" ? 1 : 0; hh.run += (run - hh.run) * Math.min(1, dt * 10); var sw = Math.sin(t * 13) * .8 * hh.run;
            hh.legL.rotation.x = sw; hh.legR.rotation.x = -sw; hh.armL.rotation.x = -sw * .8; hh.armR.rotation.x = sw * .8; hh.body.position.y = Math.abs(Math.sin(t * 13)) * .08 * hh.run + Math.sin(t * 2.2) * .02; hh.body.rotation.set(0, 0, 0); hh.root.rotation.x = 0; hh.root.rotation.z = 0;
            hh.armR.rotation.z = 0; hh.armL.rotation.z = 0; hh.wp.rotation.set(h.w === "spear" ? 1.45 : h.w === "hammer" ? 1.0 : 1.3, 0, 0); hh.wp.position.set(0, -.85, h.w === "spear" ? .2 : .12); if(hh.wp2) hh.wp2.rotation.set(1.3, 0, 0);
            hh.aura.material.opacity = 0; hh.pil.material.opacity = 0; hh.root.scale.set(1, 1, 1);
            if(P.st === "atk" && P.mv){
                var p = clamp(P.t / P.mv.dur, 0, 1), ci = P.ci, heavy = P.heavy, sn = Math.sin(p * PI), hitp = clamp(P.t / Math.max(.05, P.mv.hit), 0, 1);
                if(h.w === "sword"){ var dir = ci % 2 ? 1 : -1; if(heavy || P.mv.arc >= 360){ hh.root.rotation.y = P.face + p * TAU * (heavy ? 1 : 1); hh.armR.rotation.x = -1.2; hh.armR.rotation.z = -1.5; hh.wp.rotation.x = 1.5; } else { hh.armR.rotation.x = lerp(-2.3, 1.0, Math.min(1, p * 1.4)); hh.armR.rotation.z = dir * (1 - p) * .9; hh.body.rotation.y = dir * lerp(.5, -.5, p); } }
                else if(h.w === "spear"){ hh.armR.rotation.x = -1.35; hh.armL.rotation.x = -1.2; hh.wp.rotation.x = 1.5; hh.wp.position.z = .2 + Math.sin(clamp(p * 1.5, 0, 1) * PI) * (heavy ? 2.4 : 1.6); if(P.mv.arc >= 300) hh.root.rotation.y = P.face + p * TAU; hh.body.rotation.x = .2 * sn; }
                else if(h.w === "hammer"){ hh.armR.rotation.x = lerp(-3.0, .3, Math.min(1, p * 1.5)); hh.armL.rotation.x = hh.armR.rotation.x; hh.wp.rotation.x = .3; hh.body.rotation.x = lerp(-.25, .45, p); if(P.mv.arc >= 360 && p > .3){ hh.root.position.y = P.y + Math.sin((p - .3) * PI * 1.4) * .0; } }
                else { var d2 = ci % 2 ? 1 : -1; hh.armR.rotation.x = lerp(-2.0, 1.0, Math.min(1, p * 1.6)) * d2 - (d2 < 0 ? 0 : 0); hh.armL.rotation.x = lerp(1.0, -2.0, Math.min(1, p * 1.6)) * d2; hh.armR.rotation.z = -.5 * sn; hh.armL.rotation.z = .5 * sn; hh.body.rotation.y = d2 * (.5 - p) * 1.0; if(heavy || P.mv.arc >= 360) hh.root.rotation.y = P.face + p * TAU * 2; }
            } else if(P.st === "dodge"){ hh.root.rotation.x = .75; hh.legL.rotation.x = .9; hh.legR.rotation.x = -.5; hh.armL.rotation.x = -1.2; hh.armR.rotation.x = -1.2; hh.body.position.y = -.25; }
            else if(P.st === "hurt"){ hh.root.rotation.x = -.35; hh.armL.rotation.x = -.8; hh.armR.rotation.x = -.8; }
            else if(P.st === "musou"){ var mp = P.t; hh.root.rotation.y = P.face + mp * 9; hh.armR.rotation.x = -2.6; hh.armL.rotation.x = -2.6; hh.wp.rotation.x = 1.5; hh.aura.material.opacity = .22 + Math.sin(mp * 20) * .08; hh.aura.scale.setScalar(3 + Math.sin(mp * 12) * .4); hh.pil.material.opacity = .22 * Math.min(1, mp * 3) * Math.max(0, 1 - Math.max(0, mp - 1.7) * 3); hh.root.position.y = P.y + Math.sin(clamp(mp / 2, 0, 1) * PI) * .8; }
            else if(P.guard && P.st === "idle"){ hh.armR.rotation.x = -1.1; hh.armL.rotation.x = -1.1; hh.armR.rotation.z = .5; hh.armL.rotation.z = -.5; hh.wp.rotation.x = 1.4; hh.wp.rotation.z = 1.4; }
            else if(P.y > .1){ hh.legL.rotation.x = -.5; hh.legR.rotation.x = .7; hh.armL.rotation.x = -2.2; hh.armR.rotation.x = -2.2; }
            if(P.dead){ hh.root.rotation.x = -PI / 2 * Math.min(1, B.t * 0 + (hh.dt = (hh.dt || 0) + dt) * 3); hh.root.position.y = P.y + .3; } else hh.dt = 0;
            var inv = P.inv > 0 && P.st !== "musou" && P.st !== "dodge" ? (Math.sin(R.time * 40) > 0 ? 1 : 0) : 0; hh.root.visible = !inv || P.dead; hh.main.emissiveIntensity = P.st === "hurt" ? 1 : P.st === "atk" ? .35 : .12;
            if(P.st === "dodge") hh.root.traverse(function(o){ }); // 半とうめい 表現は しない（軽量）
        }
        function updEnemies(B, dt){
            var cnt = {grunt: 0, archer: 0, shield: 0, brute: 0}, sh = 0, t = R.time;
            var seen = {};
            for(var i = 0; i < B.E.length; i++){
                var e = B.E[i]; if(!e.alive) continue;
                if(e.off || e.gen){ var o = bigs[e.id]; if(!o){ o = bigs[e.id] = e.gen ? mkGen(e) : mkOfficer(e); } seen[e.id] = 1;
                    if(e.gen){ o.g.position.set(e.x, 0, e.z); o.core.rotation.y += dt * 2; o.core.rotation.x += dt * 1.4; var sc = 1.9 + Math.sin(t * 6) * .12; o.core.scale.set(sc, sc, sc); o.r1.rotation.set(t * 1.2, t * .7, 0); o.r2.rotation.set(t * .5, 0, t * 1.1); o.core.material.color.setHex(e.flash > 0 ? 0xffffff : 0xff4fd8); }
                    else { o.g.position.set(e.x, e.y, e.z); var gl = e.st === "stagger"; var bob = Math.sin(t * 3 + e.id) * .08; o.g.position.y += bob; var f = e.face; o.g.rotation.y = f; o.g.rotation.x = e.st === "windup" ? -.18 : e.st === "atk" ? .3 : 0; o.halo.rotation.y += dt * (e.phase ? 3 : 1.4); var arm = 0; if(e.st === "windup") arm = -2.2 + (e.wt0 ? (1 - e.wt / e.wt0) * .3 : 0); else if(e.st === "chase" && e.cd > .6) arm = .1; else if(e.st === "chase" || e.st === "cool") arm = -.2; o.armR.rotation.x += (arm - o.armR.rotation.x) * Math.min(1, dt * 14); if(e.st === "windup" && e.act === "slam") o.armR.rotation.x = -3; if(e.st === "windup" && e.act === "fan") o.armR.rotation.x = -1.5;
                        var flash = e.flash > 0 || gl; o.m.emissiveIntensity = flash ? 1.0 : .25 + (e.phase ? e.phase * .25 : 0); o.m.emissive.setHex(flash ? (gl ? 0xffd34d : 0xffffff) : e.d.col); var gs = o.s * (e.spawnT > 0 ? 1 - e.spawnT * 2 : 1); o.g.scale.set(gs, gs, gs); }
                    sh++; if(sh < 140) { mtx.makeScale(e.r * 2.6, e.r * 2.6, 1); mtx.setPosition(e.x, .06 * 0, -e.z); shadowIM.setMatrixAt(sh - 1, mtx); } continue; }
                var T0 = ET[e.type]; if(!T0) continue; var n = cnt[e.type]; if(n >= 118) continue; cnt[e.type] = n + 1;
                var d = e.d, col = hex(d.col), gc = hex(d.glow); var flash = e.flash > 0;
                var wob = Math.sin(t * 9 + e.id * 1.7) * .06, glitch = (Math.sin(t * 31 + e.id * 13.1) > .965 || flash) ? (Math.random() - .5) * .35 : 0;
                var tilt = e.st === "windup" ? -.28 : e.st === "atk" ? .45 : 0, sq = e.stun > 0 ? .86 : 1, pop = e.spawnT > 0 ? Math.max(.05, 1 - e.spawnT * 2) : 1;
                var fall = e.air > 0 ? (e.air / .7) * 1.4 : 0;
                for(var pi = 0; pi < T0.parts.length; pi++){ var pt = T0.parts[pi]; eul.set(tilt + fall * (pi ? -1 : 1), e.face, 0, "YXZ"); q.setFromEuler(eul);
                    var ox = pt.off[0], oy = pt.off[1] + wob, oz = pt.off[2]; v3.set(ox, oy, oz).applyQuaternion(q); var sx = pt.sc[0] * pop, sy = pt.sc[1] * pop * sq, sz = pt.sc[2] * pop;
                    v3s.set(sx, sy, sz); v3p.set(e.x + v3.x + glitch, e.y + v3.y, e.z + v3.z); mtx.compose(v3p, q, v3s); T0.parts[pi].im.setMatrixAt(n, mtx);
                    var cc = flash ? tmpC.setRGB(1, 1, 1) : pt.glow ? tmpC.copy(gc).multiplyScalar(1.1) : tmpC.copy(col).multiplyScalar(1.7); if(e.st === "windup" && Math.sin(t * 30) > 0 && !pt.glow) cc = tmpC.setRGB(1, .35, .4);
                    if(pt.im.instanceColor) pt.im.setColorAt(n, cc); }
                sh++; if(sh < 140){ mtx.makeScale(e.r * 2.3, e.r * 2.3, 1); mtx.setPosition(e.x, e.z * 0, 0); mtx.setPosition(e.x, -e.z, 0); shadowIM.setMatrixAt(sh - 1, mtx); }
            }
            for(var tn in ET){ ET[tn].parts.forEach(function(pt){ pt.im.count = cnt[tn]; pt.im.instanceMatrix.needsUpdate = true; if(pt.im.instanceColor) pt.im.instanceColor.needsUpdate = true; }); }
            for(var id in bigs){ if(!seen[id]){ scene.remove(bigs[id].g); delete bigs[id]; } }
            // かげ（プレイヤー）
            var P = B.P; mtx.makeScale(.95, .95, 1); mtx.setPosition(P.x, -P.z, 0); shadowIM.setMatrixAt(sh, mtx); sh++; shadowIM.count = Math.min(140, sh); shadowIM.position.y = .04; shadowIM.instanceMatrix.needsUpdate = true;
        }
        function updMisc(B, dt){
            var i; for(i = 0; i < B.PR.length && i < 96; i++){ var p = B.PR[i]; mtx.makeScale(.7, .7, .7); mtx.setPosition(p.x, p.y, p.z); prIM.setMatrixAt(i, mtx); if(Math.random() < .5) emit(p.x, p.y, p.z, 0, 0, 0, .25, .5, hex(0xff4fd8), 0); } prIM.count = Math.min(96, B.PR.length); prIM.instanceMatrix.needsUpdate = true;
            for(i = 0; i < B.PK.length && i < 40; i++){ var k = B.PK[i]; var ph = R.time * 3 + i; mtx.makeScale(.6, .8, .6); mtx.setPosition(k.x, 1 + Math.sin(ph) * .2, k.z); pkIM.setMatrixAt(i, mtx); pkIM.setColorAt(i, tmpC.setHex(k.k === "hp" ? 0x7dff9a : 0xffd34d)); } pkIM.count = Math.min(40, B.PK.length); pkIM.instanceMatrix.needsUpdate = true; if(pkIM.instanceColor) pkIM.instanceColor.needsUpdate = true;
            bases.forEach(function(o){ var b = o.b; o.fill.scale.set(b.r * Math.max(.02, b.prog), b.r * Math.max(.02, b.prog), 1); o.ring.material.color.setHex(b.done ? 0x7dff9a : b.inside ? 0x4de1ff : 0xffd34d); o.fill.material.color.setHex(b.done ? 0x7dff9a : 0x4de1ff); o.beam.material.opacity = b.done ? .08 : .25 + Math.sin(R.time * 4) * .06; o.ring.rotation.z += dt * .3; });
            decor.shards.forEach(function(s){ s.m.rotation.y += dt * 1.2; s.m.position.y = s.h + Math.sin(R.time * 1.6 + s.ph) * .35; });
            // ただよう ノイズの つぶ
            if(Math.random() < (R.quality === "high" ? .6 : .25)){ var a = Math.random() * TAU, rr = Math.random() * (R.stage ? R.stage.r : 50); emit(Math.sin(a) * rr, .3 + Math.random() * 6, Math.cos(a) * rr, (Math.random() - .5) * .6, .6 + Math.random(), (Math.random() - .5) * .6, 3 + Math.random() * 2, .5 + Math.random() * .5, tmpC.setHex(R.stage ? R.stage.line : 0xffffff).clone(), -.1); }
        }
        R.update = function(B, dt, cam){
            R.B = B; R.time += dt; skyMat.uniforms.t.value = R.time; if(!hero) return;
            pmat.uniforms.sc.value = renderer.domElement.height * .9;
            poseHero(B, dt); updEnemies(B, dt); updMisc(B, dt); updTelegraph(dt, B); updFX(dt); updParticles(dt);
            // ロックオン 対象
            var best = null, bd = 1e9; for(var i = 0; i < B.E.length; i++){ var e = B.E[i]; if(!e.alive) continue; var d = Math.hypot(e.x - B.P.x, e.z - B.P.z) - (e.off ? 6 : 0); if(d < bd){ bd = d; best = e; } } R.lockT = best;
            placeCam(B, dt, cam);
            if(B.P.st === "musou" && hero) { /* 光の はしら */ }
        };
        R.render = function(){ renderer.render(scene, camera); };
        R.resize = function(w, h, dpr){ var pr = Math.min(dpr || 1, R.quality === "high" ? 1.75 : 1); renderer.setPixelRatio(pr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
        R.project = function(x, y, z){ v3.set(x, y, z).project(camera); return {x: (v3.x * .5 + .5) * canvas.clientWidth, y: (-v3.y * .5 + .5) * canvas.clientHeight, vis: v3.z < 1 && v3.z > -1}; };
        R.camBasis = function(){ return {fx: Math.sin(R.yaw), fz: Math.cos(R.yaw), rx: -Math.cos(R.yaw), rz: Math.sin(R.yaw)}; };
        R.reset = function(){ for(var id in bigs){ scene.remove(bigs[id].g); delete bigs[id]; } for(var i = 0; i < NP; i++){ pp.life[i] = 0; pp.al[i] = 0; } FX.forEach(function(f){ f.on = false; f.m.visible = false; }); TG.forEach(function(s){ s.on = false; s.m.visible = false; }); R.cin = null; R.demo = null; R.manualT = 0; R.recenter = 0; camera.fov = fovCur = fov0; };
        R.burst = burst; R.shock = shock; R.hex = hex;
        R.ok = true; return R;
    }
    window.US3D = {create: create, T: T};
    window.dispatchEvent(new Event("us3d-ready"));
})();
