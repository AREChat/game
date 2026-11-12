
"use strict";
// ===== 手作りの丸くてかわいい低ポリ3Dキャラ（外部モデル不要）と、モンスターのテクスチャ =====
import {Geo, M4, canvasTex} from "./gl.js";

const cache = new Map();

// look の色をそのまま使い、各パーツをひとつの軽量メッシュにまとめる。
export function charMeshes(R, look){
    const L = Object.assign({
        skin:"#f6cfa6", hair:"#3a2a20", shirt:"#7897c9", pants:"#59657d",
        style:"short", accent:"#e8c879", cape:null, size:1
    }, look || {});
    const key = JSON.stringify(L);
    if(cache.has(key)) return cache.get(key);

    const mesh = (g) => R.mesh(g);
    const mk = (fn) => { const g = new Geo(); fn(g); return mesh(g); };
    const tr = (x,y,z,sx,sy,sz) => M4.mul(M4.T(x,y,z), M4.S(sx,sy,sz));
    const P = {};

    // 足：原点が付け根。丸いズボンと小さな丸靴で構成。
    const leg = (side) => mk((g) => {
        g.sphere(.145, 6, 4, L.pants, tr(0,-.245,0, .92,1.55,1.0));
        g.sphere(.135, 6, 4, "#66594f", tr(0,-.435,.045, 1.18,.62,1.35));
        g.sphere(.105, 6, 4, "#8a796b", tr(0,-.478,.055, 1.18,.22,1.25));
    });
    P.legL = leg(-1);
    P.legR = leg(1);

    // 胴
    P.torso = mk((g) => {
        g.sphere(.34, 10, 8, L.shirt, tr(0,0,0, 1.0,1.0,.82));
        g.sphere(.115, 6, 4, L.accent, tr(0,.225,.205, 1.25,.48,.42));
        g.sphere(.035, 7, 5, L.accent, M4.T(0,.035,.282));
        if(L.cape){
            g.sphere(.29, 9, 7, L.cape, tr(0,-.025,-.205, 1.02,1.02,.30));
        }
    });

    // 頭
    P.head = mk((g) => {
        g.sphere(.46, 10, 8, L.skin, M4.T(0,.46,0));

        // 大きな目・ハイライト・頬
        for(const s of [-1,1]){
            g.sphere(.078, 6, 4, "#fffaf2", tr(s*.145,.465,.391, .82,1.12,.34));
            g.sphere(.055, 6, 4, "#302b32", tr(s*.145,.463,.414, .88,1.12,.36));
            g.sphere(.019, 7, 5, "#ffffff", M4.T(s*.145-.014,.49,.435));
            g.sphere(.047, 6, 4, "#e9a4a0", tr(s*.255,.335,.365, 1.0,.62,.28));
        }

        // 小さな口
        g.sphere(.025, 7, 5, "#a95f5b", tr(0,.315,.405, 1.0,.48,.24));

        const hc = L.hair;

        const hairCap = () => g.sphere(
            .465, 10, 7, hc,
            tr(0,.665,-.045, 1.0,.56,1.0)
        );

        if(L.style === "short"){
            hairCap();
            g.sphere(.16, 6, 4, hc, tr(-.19,.60,.315, 1.0,.72,.62));
            g.sphere(.17, 6, 4, hc, tr(.015,.625,.345, 1.0,.72,.62));
            g.sphere(.14, 6, 4, hc, tr(.20,.59,.30, 1.0,.72,.62));

        } else if(L.style === "long"){
            hairCap();
            g.sphere(.16, 6, 4, hc, tr(-.37,.30,-.015, .78,1.65,.78));
            g.sphere(.16, 6, 4, hc, tr(.37,.30,-.015, .78,1.65,.78));
            g.sphere(.15, 6, 4, hc, tr(0,.12,-.31, 1.55,1.25,.62));
            g.sphere(.16, 6, 4, hc, tr(0,.61,.33, 1.0,.62,.50));

        } else if(L.style === "spiky"){
            hairCap();

            for(let k=0;k<5;k++){
                const x = (k-2)*.145;
                const y = .82 + (k===2 ? .12 : (k%2===0 ? .045 : .08));

                g.cyl(
                    .075,.105,.20,8,hc,
                    M4.mul(
                        M4.T(x,y-.08,-.015),
                        M4.RZ((2-k)*.16)
                    ),
                    true
                );

                g.sphere(.078,7,5,hc,M4.T(x,y+.105,-.015));
            }

            g.sphere(.15,8,5,hc,tr(0,.61,.34,1.0,.62,.48));

        } else if(L.style === "cap"){
            g.sphere(.445,10,7,hc,tr(0,.65,-.035,1.0,.40,1.0));
            g.cyl(.30,.34,.105,10,L.accent,M4.T(0,.79,-.005),true);
            g.sphere(.34,8,5,L.accent,tr(0,.795,.055,1.0,.16,.80));
            g.sphere(.22,8,5,L.accent,tr(0,.79,.265,1.0,.10,.50));

        } else if(L.style === "bun"){
            hairCap();
            g.sphere(.15,8,6,hc,M4.T(0,.98,-.055));
            g.sphere(.105,8,5,hc,M4.T(.075,1.055,-.045));
            g.sphere(.15,8,5,hc,tr(0,.61,.33,1.0,.62,.48));

        } else if(L.style === "hat"){
            g.sphere(.445,10,7,hc,tr(0,.65,-.035,1.0,.40,1.0));
            g.cyl(.40,.40,.045,12,L.accent,M4.T(0,.78,0),true);
            g.cyl(.19,.27,.30,10,L.accent,M4.T(0,.80,0),true);
            g.sphere(.055,7,5,"#fff0bd",M4.T(0,1.105,0));

        } else {
            hairCap();
        }
    });

    // 腕：丸い上腕と手
    const arm = (side) => mk((g) => {
        g.sphere(.105,8,6,L.shirt,M4.mul(M4.T(0,-.205,0),M4.S(1.0,1.85,1.0)));
        g.sphere(.092,8,6,L.skin,M4.T(0,-.445,.015));
        g.cyl(.105,.105,.055,8,L.accent,M4.T(0,-.335,0),true);
    });

    P.armL = arm(-1);
    P.armR = arm(1);

    // 影
    P.shadow = mk((g) => {
        g.cyl(.42,.42,.01,12,[0,0,0],M4.T(0,.02,0),true);
    });

    P.size = L.size;
    cache.set(key,P);
    return P;
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
