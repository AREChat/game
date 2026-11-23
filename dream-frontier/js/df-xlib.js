// ===== 新アトラクション5つ（リズム／迷路／ループ／ジャンプ／カート）の 共通 どうぐ =====
//  ・ぜんぶ オリジナル。虫は ぜったいに 出さない。
//  ・のりもの モジュールは  {build(K), init(g,R,a), update(g,R,dt,inp), camera(g,R), dyn(g,R,D), hud(R), finish(g,R), end(g,R)}  を もつ。
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const rng = (seed) => { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
export const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ---- 画面（HUD）の 部品：いちど だけ CSS を 入れる ----
const CSS = `
.xh{position:fixed;pointer-events:none;z-index:6;color:#fff;font-weight:900;text-shadow:0 2px 6px #000,0 0 12px rgba(0,0,0,.6);font-family:inherit}
#xRoot{position:fixed;inset:0;pointer-events:none;z-index:6}
#xRoot *{box-sizing:border-box}
.xh .sc{font-size:clamp(18px,3.4vw,30px);letter-spacing:.04em}
.xh small{font-size:clamp(10px,1.7vw,13px);font-weight:700;opacity:.9}
.xpill{display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(10,14,40,.62);border:2px solid rgba(255,255,255,.55);margin:2px}
.xbig{position:fixed;left:0;right:0;text-align:center;font-weight:900;text-shadow:0 3px 10px #000;pointer-events:none}
.xbar{position:fixed;left:12px;right:12px;top:6px;height:7px;border-radius:5px;background:rgba(255,255,255,.22);overflow:hidden;pointer-events:none}
.xbar>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff7ab8,#ffe27a,#7affd8)}
.xmap{position:fixed;right:10px;top:48px;border:2px solid rgba(255,255,255,.7);border-radius:10px;background:rgba(10,14,40,.55);pointer-events:none;z-index:6}
.xbtn{position:fixed;pointer-events:auto;z-index:7;border:3px solid #fff;border-radius:16px;background:rgba(40,30,90,.72);color:#fff;font:900 clamp(18px,4vw,30px) sans-serif;display:flex;align-items:center;justify-content:center;touch-action:none;-webkit-user-select:none;user-select:none}
.xbtn.on{background:rgba(255,122,184,.9);transform:scale(.96)}
body.x-rhythm #stick,body.x-rhythm #bAct,body.x-rhythm #bRun,body.x-rhythm #bMenu{display:none!important}
body.x-loop #stick,body.x-loop #bAct,body.x-loop #bRun,body.x-loop #bMenu{display:none!important}
body.x-maze #bRun,body.x-maze #bMenu,body.x-jump #bRun,body.x-jump #bMenu,body.x-kart #bRun,body.x-kart #bMenu{display:none!important}
#vehicle.veh-rhythm,#vehicle.veh-maze,#vehicle.veh-jump,#vehicle.veh-kart,#vehicle.veh-loop{opacity:0!important;border:0!important;background:none!important}
#vehicle.veh-loop{opacity:1!important;height:100%!important;background:linear-gradient(to top,rgba(20,16,50,.92) 0,rgba(20,16,50,.92) 7vh,rgba(20,16,50,0) 15vh),linear-gradient(to right,rgba(20,16,50,.7) 0,rgba(20,16,50,0) 7vw) !important}
`;
let cssDone = false;
export function ensureCss(){
    if(cssDone || typeof document === "undefined") return; cssDone = true;
    const s = document.createElement("style"); s.id = "xCss"; s.textContent = CSS; document.head.appendChild(s);
}
export function root(){
    ensureCss(); let r = document.getElementById("xRoot");
    if(!r){ r = document.createElement("div"); r.id = "xRoot"; document.body.appendChild(r); }
    return r;
}
export function clearRoot(){ const r = document.getElementById("xRoot"); if(r) r.innerHTML = ""; }
export function el(tag, cls, html, style){
    const e = document.createElement(tag); if(cls) e.className = cls; if(html !== undefined) e.innerHTML = html; if(style) e.style.cssText = style; return e;
}
export const bodyOn = (k, on) => document.body.classList.toggle("x-" + k, !!on);
export const isTouch = () => document.body.classList.contains("touch");

// ---- カメラの うつし：ワールドの 点が 画面の どこに くるか（ピクセル）----
//  cam: {eye, yaw, pitch, fov(縦・度)}。まえ＝(sinψcosφ, sinφ, cosψcosφ)  みぎ＝(-cosψ, 0, sinψ)  うえ＝(-sinψ sinφ, cosφ, -cosψ sinφ)
export function project(cam, p, W, H){
    const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw), sp = Math.sin(cam.pitch), cp = Math.cos(cam.pitch);
    const f = [sy * cp, sp, cy * cp], r = [-cy, 0, sy], u = [-sy * sp, cp, -cy * sp];
    const d = [p[0] - cam.eye[0], p[1] - cam.eye[1], p[2] - cam.eye[2]];
    const depth = d[0] * f[0] + d[1] * f[1] + d[2] * f[2]; if(depth <= .01) return null;
    const th = Math.tan(cam.fov * Math.PI / 360), asp = W / H;
    const nx = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / (depth * th * asp), ny = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / (depth * th);
    return {x: (nx * .5 + .5) * W, y: (.5 - ny * .5) * H, depth};
}

// ---- 迷路・コースの 計算：BFS・円と かべの ぶつかり ----
export function circleRects(x, z, r, rects){   // 円(x,z,r) が 長方形 {x0,x1,z0,z1} に めりこまない ように おしだす。うごいた 座標を 返す
    for(let k = 0; k < 2; k++) for(const w of rects){
        const cx = clamp(x, w.x0, w.x1), cz = clamp(z, w.z0, w.z1), dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if(d2 < r * r){
            if(d2 > 1e-8){ const d = Math.sqrt(d2), k2 = (r - d) / d; x += dx * k2; z += dz * k2; }
            else { const l = x - w.x0, rr = w.x1 - x, t = z - w.z0, b = w.z1 - z, m = Math.min(l, rr, t, b); if(m === l) x = w.x0 - r; else if(m === rr) x = w.x1 + r; else if(m === t) z = w.z0 - r; else z = w.z1 + r; }
        }
    }
    return [x, z];
}
