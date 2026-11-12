"use strict";
// ===== 手作りの丸くてかわいい低ポリ3Dキャラ・版B（QUEST3 用／外部モデル不要）と、モンスターのテクスチャ =====
import {Geo, M4, canvasTex} from "./gl.js";

const cache = new Map();
const rgb = (c) => typeof c === "string" ? [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255] : c;
const tint = (c, k) => { const a = rgb(c); return [Math.min(1, a[0] * k), Math.min(1, a[1] * k), Math.min(1, a[2] * k)]; };

export function charMeshes(R, look){
    const L = Object.assign({skin:"#f6cfa6", hair:"#3a2a20", shirt:"#7897c9", pants:"#59657d", style:"short", accent:"#e8c879", cape:null, size:1}, look || {});
    const key = "B" + JSON.stringify(L);
    if(cache.has(key)) return cache.get(key);
    const mk = (fn) => { const g = new Geo(); fn(g); return R.mesh(g); };
    // この描画では円柱は「底が y=0」なので、中心が基準になるよう直して置く
    const cyl = (g, rt, rb, h, seg, col, m) => g.cyl(rt, rb, h, seg, col, M4.mul(m, M4.T(0, -h / 2, 0)), true);
    const sph = (g, r, seg, rings, col, m) => g.sphere(r, seg, rings, col, m);
    const skinShadow = tint(L.skin, .92), hair = L.hair, hairHigh = tint(L.hair, 1.15), hairShadow = tint(L.hair, .82);
    const shirtShadow = tint(L.shirt, .85), accent = L.accent, shoeCol = [.35, .25, .2];
    const eyeDark = [.12, .12, .15], eyeWhite = [1, 1, 1], blush = [.96, .6, .62], mouthCol = [.75, .35, .35];
    const SS = 10, SR = 8, CS = 8;
    const P = {};
    const leg = () => mk((g) => {
        const up = M4.T(0, .03, 0);
        cyl(g, .13, .11, .32, CS, L.pants, M4.mul(up, M4.T(0, -.16, 0)));
        sph(g, .11, SS, SR, skinShadow, M4.mul(up, M4.T(0, -.32, 0)));
        sph(g, .13, SS, SR, shoeCol, M4.mul(up, M4.mul(M4.T(0, -.42, .04), M4.S(1, .85, 1.3))));
    });
    P.legL = leg(); P.legR = leg();
    P.torso = mk((g) => {
        sph(g, .32, SS, SR, L.shirt, M4.mul(M4.T(0, .02, 0), M4.S(.95, 1.1, .9)));
        cyl(g, .31, .33, .12, CS, shirtShadow, M4.T(0, -.18, 0));
        cyl(g, .17, .2, .05, CS, accent, M4.T(0, .2, 0));
        sph(g, .04, 6, 6, accent, M4.T(0, .12, .28));
        if(L.cape) cyl(g, .22, .3, .5, CS, L.cape, M4.mul(M4.T(0, -.02, -.27), M4.mul(M4.RX(.12), M4.S(1, 1, .3))));
    });
    const arm = () => mk((g) => {
        sph(g, .13, SS, SR, L.shirt, M4.T(0, -.05, 0));
        cyl(g, .09, .08, .24, CS, L.skin, M4.T(0, -.18, 0));
        sph(g, .09, SS, SR, L.skin, M4.T(0, -.32, .02));
    });
    P.armL = arm(); P.armR = arm();
    P.head = mk((g) => {
        const hy = .46;
        sph(g, .48, SS + 2, SR + 2, L.skin, M4.mul(M4.T(0, hy, 0), M4.S(1.04, .98, 1)));
        for(const x of [.18, -.18]){
            sph(g, .075, 8, 8, eyeDark, M4.mul(M4.T(x, hy - .03, .44), M4.S(.85, 1.2, .4)));
            sph(g, .028, 6, 6, eyeWhite, M4.T(x + .02, hy + .01, .47));
            sph(g, .07, 6, 6, blush, M4.mul(M4.T(x * 1.33, hy - .12, .40), M4.S(1.1, .6, .3)));
        }
        sph(g, .03, 6, 6, mouthCol, M4.mul(M4.T(0, hy - .16, .45), M4.S(1.2, .5, .3)));
        sph(g, .47, SS, SR, hairShadow, M4.mul(M4.T(0, hy + .1, -.17), M4.S(1.0, .95, .92)));
        const st = L.style;
        if(st === "short"){
            sph(g, .26, 8, 8, hairHigh, M4.T(0, hy + .3, .06));
            sph(g, .17, 8, 8, hair, M4.T(.37, hy + .1, .06)); sph(g, .17, 8, 8, hair, M4.T(-.37, hy + .1, .06));
            sph(g, .18, 8, 8, hair, M4.mul(M4.T(0, hy + .27, .37), M4.S(1.3, .65, .6)));
        }else if(st === "spiky"){
            cyl(g, .04, .22, .35, 6, hairHigh, M4.mul(M4.T(0, hy + .44, .05), M4.RX(-.15)));
            cyl(g, .03, .18, .3, 6, hair, M4.mul(M4.T(.26, hy + .36, .1), M4.RZ(-.45)));
            cyl(g, .03, .18, .3, 6, hair, M4.mul(M4.T(-.26, hy + .36, .1), M4.RZ(.45)));
            sph(g, .16, 8, 8, hair, M4.mul(M4.T(.05, hy + .22, .42), M4.S(1.4, .6, .5)));
        }else if(st === "long"){
            cyl(g, .16, .11, .6, CS, hair, M4.mul(M4.T(.32, hy - .25, -.05), M4.RZ(-.12)));
            cyl(g, .16, .11, .6, CS, hair, M4.mul(M4.T(-.32, hy - .25, -.05), M4.RZ(.12)));
            sph(g, .2, 8, 8, hair, M4.mul(M4.T(0, hy + .23, .41), M4.S(1.3, .7, .6)));
        }else if(st === "bun"){
            sph(g, .24, 8, 8, hairHigh, M4.T(0, hy + .48, -.1));
            cyl(g, .16, .16, .08, CS, accent, M4.T(0, hy + .36, -.1));
            sph(g, .18, 8, 8, hair, M4.mul(M4.T(0, hy + .22, .4), M4.S(1.3, .6, .5)));
        }else if(st === "cap"){
            sph(g, .51, SS, SR, accent, M4.mul(M4.T(0, hy + .08, -.02), M4.S(1.04, 1.02, 1.04)));
            sph(g, .28, 8, 8, tint(accent, .85), M4.mul(M4.T(0, hy + .18, .44), M4.mul(M4.RX(.25), M4.S(1.2, .15, 1.1))));
        }else if(st === "hat"){
            cyl(g, .68, .7, .06, SS, accent, M4.mul(M4.T(0, hy + .22, .02), M4.RX(.1)));
            cyl(g, .08, .46, .55, CS, tint(accent, .9), M4.mul(M4.T(0, hy + .5, -.04), M4.RX(-.15)));
            sph(g, .1, 6, 6, [1, .95, .8], M4.T(0, hy + .8, -.12));
        }
    });
    P.shadow = mk((g) => { g.cyl(.38, .38, .01, 12, [0, 0, 0], M4.T(0, .02, 0), true); });
    P.size = L.size;
    cache.set(key, P); return P;
}

// 影つきで描く。obj: {x,y,z,yaw,walk(0〜1),t,hop}
export function drawChar(R, P, o, opt){
    const sc = P.size || 1, op = opt || {};
    const sw = Math.sin(o.t * 9) * 0.75 * (o.walk || 0);
    const bob = Math.abs(Math.cos(o.t * 9)) * .06 * (o.walk || 0) + (o.hop || 0);
    const idle = (o.walk || 0) < .05 ? Math.sin(o.t * 2) * .012 : 0;

    const root = M4.mul(
        M4.trs(o.x, o.y || 0, o.z, o.yaw || 0, sc),
        M4.id()
    );

    const tint = op.tint || null;
    const part = (mesh, m) => R.draw(mesh, {m:M4.mul(root, m), tint});
    const hip = .5;

    part(P.legL, M4.mul(M4.T(-.14, hip + bob, 0), M4.RX(sw)));
    part(P.legR, M4.mul(M4.T(.14, hip + bob, 0), M4.RX(-sw)));
    part(P.torso, M4.T(0, hip + .28 + bob + idle, 0));
    part(P.head, M4.T(0, hip + .56 + bob + idle, 0));

    part(P.armL, M4.mul(
        M4.T(-.4, hip + .78 + bob, 0),
        M4.mul(M4.RX(-sw), M4.RZ(.08))
    ));

    part(P.armR, M4.mul(
        M4.T(.4, hip + .78 + bob, 0),
        M4.mul(M4.RX(sw), M4.RZ(-.08))
    ));

    if(!op.noShadow){
        R.draw(P.shadow, {
            m:M4.trs(o.x, (o.y || 0) + .01, o.z, 0, sc),
            mode:3,
            tint:[0, 0, 0, .28],
            blend:true,
            late:true
        });
    }

    return bob;
}

// ---------- モンスター ----------
const shadeHex = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) * k);
    const g = Math.min(255, ((n >> 8) & 255) * k);
    const b = Math.min(255, (n & 255) * k);

    return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
};

export function monsterCanvas(kind, color){
    return canvasTex(256, 256, (x, w, h) => {
        x.clearRect(0, 0, w, h);
        x.lineJoin = "round";
        x.lineWidth = 6;
        x.strokeStyle = "#1c1c2a";

        const eyes = (ex, ey, gap, r) => {
            for(const s of [-1, 1]){
                x.fillStyle = "#fff";
                x.beginPath();
                x.arc(ex + s * gap, ey, r, 0, 7);
                x.fill();

                x.lineWidth = 3;
                x.stroke();

                x.fillStyle = "#1c1c2a";
                x.beginPath();
                x.arc(ex + s * gap + s * -2, ey + 2, r * .5, 0, 7);
                x.fill();
            }

            x.lineWidth = 6;
        };

        const grad = (cx, cy, r) => {
            const g = x.createRadialGradient(
                cx - r * .3,
                cy - r * .4,
                r * .1,
                cx,
                cy,
                r * 1.1
            );

            g.addColorStop(0, shadeHex(color, 1.35));
            g.addColorStop(1, shadeHex(color, .8));

            return g;
        };

        if(kind === "slime"){
            x.fillStyle = grad(128, 170, 90);
            x.beginPath();
            x.moveTo(36, 214);
            x.bezierCurveTo(20, 140, 80, 60, 128, 52);
            x.bezierCurveTo(176, 60, 236, 140, 220, 214);
            x.bezierCurveTo(180, 232, 76, 232, 36, 214);
            x.fill();
            x.stroke();

            x.fillStyle = "rgba(255,255,255,.55)";
            x.beginPath();
            x.ellipse(92, 100, 18, 10, -.6, 0, 7);
            x.fill();

            eyes(128, 150, 34, 15);

            x.fillStyle = "#1c1c2a";
            x.beginPath();
            x.arc(128, 188, 14, 0, Math.PI);
            x.fill();

        } else if(kind === "bat"){
            x.fillStyle = shadeHex(color, .85);

            for(const s of [-1, 1]){
                x.beginPath();
                x.moveTo(128, 120);
                x.quadraticCurveTo(128 + s * 110, 30, 128 + s * 118, 130);
                x.lineTo(128 + s * 84, 110);
                x.lineTo(128 + s * 62, 150);
                x.lineTo(128 + s * 36, 124);
                x.closePath();
                x.fill();
                x.stroke();
            }

            x.fillStyle = grad(128, 140, 52);
            x.beginPath();
            x.arc(128, 140, 52, 0, 7);
            x.fill();
            x.stroke();

            x.fillStyle = shadeHex(color, .8);

            for(const s of [-1, 1]){
                x.beginPath();
                x.moveTo(128 + s * 30, 100);
                x.lineTo(128 + s * 44, 62);
                x.lineTo(128 + s * 54, 108);
                x.fill();
                x.stroke();
            }

            eyes(128, 134, 20, 11);

            x.fillStyle = "#fff";
            x.beginPath();
            x.moveTo(116, 166);
            x.lineTo(122, 180);
            x.lineTo(128, 166);
            x.fill();

            x.beginPath();
            x.moveTo(128, 166);
            x.lineTo(134, 180);
            x.lineTo(140, 166);
            x.fill();

        } else if(kind === "mushroom"){
            x.fillStyle = "#f3e6c8";
            x.beginPath();
            x.roundRect(88, 130, 80, 92, 24);
            x.fill();
            x.stroke();

            x.fillStyle = grad(128, 112, 100);
            x.beginPath();
            x.ellipse(128, 112, 108, 76, 0, Math.PI, 0);
            x.lineTo(236, 120);
            x.quadraticCurveTo(128, 150, 20, 120);
            x.closePath();
            x.fill();
            x.stroke();

            x.fillStyle = "rgba(255,255,255,.9)";

            for(const [a, b, r] of [
                [80, 84, 14],
                [140, 66, 16],
                [190, 96, 12],
                [120, 108, 9]
            ]){
                x.beginPath();
                x.arc(a, b, r, 0, 7);
                x.fill();
            }

            eyes(128, 170, 20, 11);

            x.fillStyle = "#1c1c2a";
            x.beginPath();
            x.arc(128, 200, 8, 0, Math.PI);
            x.fill();

        } else if(kind === "ghost"){
            x.fillStyle = grad(128, 120, 90);
            x.beginPath();
            x.moveTo(40, 220);
            x.lineTo(40, 110);
            x.bezierCurveTo(40, 30, 216, 30, 216, 110);
            x.lineTo(216, 220);
            x.lineTo(188, 200);
            x.lineTo(160, 224);
            x.lineTo(128, 200);
            x.lineTo(96, 224);
            x.lineTo(68, 200);
            x.closePath();
            x.fill();
            x.stroke();

            eyes(128, 120, 32, 16);

            x.fillStyle = "#1c1c2a";
            x.beginPath();
            x.ellipse(128, 170, 16, 22, 0, 0, 7);
            x.fill();

        } else if(kind === "golem"){
            x.fillStyle = grad(128, 140, 100);
            x.beginPath();
            x.roundRect(60, 60, 136, 120, 22);
            x.fill();
            x.stroke();

            for(const s of [-1, 1]){
                x.beginPath();
                x.roundRect(s < 0 ? 14 : 190, 90, 52, 100, 18);
                x.fill();
                x.stroke();

                x.beginPath();
                x.roundRect(s < 0 ? 70 : 134, 176, 52, 56, 14);
                x.fill();
                x.stroke();
            }

            x.fillStyle = "#ffd24a";

            for(const s of [-1, 1]){
                x.beginPath();
                x.rect(128 + s * 32 - 14, 92, 28, 16);
                x.fill();
                x.stroke();
            }

            x.fillStyle = "#1c1c2a";
            x.fillRect(100, 140, 56, 10);

        } else {
            // dragon系（ボス用）
            x.fillStyle = grad(128, 140, 100);
            x.beginPath();
            x.ellipse(128, 150, 80, 70, 0, 0, 7);
            x.fill();
            x.stroke();

            x.beginPath();
            x.moveTo(60, 100);
            x.lineTo(40, 40);
            x.lineTo(96, 80);
            x.fill();
            x.stroke();

            x.beginPath();
            x.moveTo(196, 100);
            x.lineTo(216, 40);
            x.lineTo(160, 80);
            x.fill();
            x.stroke();

            eyes(128, 130, 32, 16);

            x.fillStyle = "#fff";

            for(let k = -2; k <= 2; k++){
                x.beginPath();
                x.moveTo(128 + k * 22 - 8, 180);
                x.lineTo(128 + k * 22, 202);
                x.lineTo(128 + k * 22 + 8, 180);
                x.fill();
            }
        }
    });
}
