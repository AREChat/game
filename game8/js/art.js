"use strict";
// ===== GAME8：1枚絵（イラスト）の差しこみ口 =====
// game8/img/ に、下の名前の絵（.webp）を置くと、自動でゲームに出ます（ARE QUEST 2 と同じ「場面ぜんたいの1枚絵」の考え方）。
// 絵が無いものは、今までどおりの見た目のまま（エラーにはなりません）。キャラ1人ずつの絵は使いません。
//   title        タイトル・あそびかた・せっていの うしろの絵
//   card_race    タイトルの「レースモード」ボタンの絵
//   card_action  タイトルの「アクションモード」ボタンの絵
//   result       けっか画面の うしろの絵
//   sky_race     レースの空・遠くのけしき（ぐるっと1周するパノラマ）
//   sky_action   アクションの空・遠くのけしき（走ると、ゆっくり流れる）
//   icon         ブラウザのタブの小さな絵（正方形）
import * as T from "../vendor/three/build/three.module.js";

export const ART_SLOTS = ["title", "card_race", "card_action", "result", "sky_race", "sky_action", "icon"];
export const art = {};   // 名前 → {url, img}（読みこめた絵だけが入る）

function probe(name){
    return new Promise((resolve) => {
        const url = new URL("../img/" + name + ".webp", import.meta.url).href;
        const im = new Image();
        im.decoding = "async";
        im.onload = () => resolve({url, img: im});
        im.onerror = () => resolve(null);
        im.src = url;
    });
}

/** すべての絵を調べ終わったら解決する（絵が1枚も無くても、失敗にはならない） */
export const ready = Promise.all(ART_SLOTS.map((n) => probe(n).then((r) => { if(r && r.img.naturalWidth > 0) art[n] = r; })));

/** 画面の絵（CSS）：読みこめた絵だけ、body にクラスをつけて、style.css 側の見た目を有効にする */
export function applyScreenArt(){
    const root = document.documentElement, body = document.body;
    const on = (name, cls, v) => { if(art[name]){ root.style.setProperty(v, 'url("' + art[name].url + '")'); body.classList.add(cls); } };
    on("title", "art-title", "--g8-title");
    on("card_race", "art-card-race", "--g8-card-race");
    on("card_action", "art-card-action", "--g8-card-action");
    on("result", "art-result", "--g8-result");
    if(art.icon){
        let l = document.querySelector('link[rel="icon"]');
        if(!l){ l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); }
        l.type = "image/webp"; l.href = art.icon.url;
    }
}

/**
 * 空・遠くのけしき：絵を、カメラのまわりをぐるっと囲む筒（まくの内がわ）にはる。
 *  ・左右をつなぐ継ぎ目が見えないように、絵とそのうら返しを ならべて 1周ぶんにする。
 *  ・上と下は すこしずつ透明にして、もとの空のグラデーションに とけこませる。
 *  ・opts.scroll：カメラが横に動くとき、けしきを ゆっくり流す強さ（0 なら流さない）。
 * 絵が無ければ null を返す（そのときは、今までの空のまま）。
 */
export function makeBackdrop(slot, opts){
    const a = art[slot];
    if(!a) return null;
    const im = a.img, iw = im.naturalWidth || 0, ih = im.naturalHeight || 0;
    if(iw < 64 || ih < 64) return null;
    const scroll = (opts && opts.scroll) || 0;
    const sw = Math.min(iw, 2048), sh = Math.max(32, Math.round(ih * sw / iw));
    const cv = document.createElement("canvas");
    cv.width = sw * 2; cv.height = sh;
    const g = cv.getContext("2d");
    g.drawImage(im, 0, 0, sw, sh);
    g.save(); g.translate(sw * 2, 0); g.scale(-1, 1); g.drawImage(im, 0, 0, sw, sh); g.restore();
    g.globalCompositeOperation = "destination-out";
    const fade = (y0, y1, a0, a1) => {
        const gr = g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, "rgba(0,0,0," + a0 + ")"); gr.addColorStop(1, "rgba(0,0,0," + a1 + ")");
        g.fillStyle = gr; g.fillRect(0, Math.min(y0, y1), cv.width, Math.abs(y1 - y0));
    };
    fade(0, sh * 0.14, 1, 0); fade(sh * 0.86, sh, 0, 1);
    const tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace; tex.wrapS = T.RepeatWrapping; tex.anisotropy = 4;
    const R = 800, H = Math.PI * R * (sh / sw);   // 絵がのびちぢみしない高さ（まわり 2πR に 幅 2sw を はる）
    const mesh = new T.Mesh(
        new T.CylinderGeometry(R, R, H, 96, 1, true),
        new T.MeshBasicMaterial({map: tex, side: T.BackSide, transparent: true, depthWrite: false, fog: false, toneMapped: false})
    );
    mesh.renderOrder = -10; mesh.frustumCulled = false;
    mesh.onBeforeRender = (r, s, cam) => {
        mesh.position.copy(cam.position);
        if(scroll) mesh.rotation.y = cam.position.x * scroll;
        mesh.updateMatrixWorld(true);
    };
    return mesh;
}
