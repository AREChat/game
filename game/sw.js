"use strict";
// ===== ARE QUEST 専用 サービスワーカー（チャットの sw.js とは べつもの）=====
// ・このゲームの フォルダ（/ARE/game/）の中だけを 担当する。チャット側の控え（キャッシュ）とは まざらない。
// ・GET 以外／ほかのサイト／Range（音楽のとちゅう再生）／mp3 などの 大きな音声は さわらない → 止まったり 古いままに ならない。
// ・自分のファイルは「ネット優先（ただしブラウザの短い控えは つかう＝2回目から速い）」。つながらない ときだけ 控えを つかう。新しい版が 入ったら 古い控えは すべて 消す。
importScripts("../precache-manifest.js", "../sw-core.js");
const core = self.areCore({shell: "tq-game-x", root: "../", precache: false, fetch: false});
const CACHE = "tq-game-v28-20261113";
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.indexOf("tq-game-") === 0 && k !== CACHE).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});
self.addEventListener("fetch", (event) => {
    const request = event.request;
    if(request.method !== "GET") return;
    let url; try{ url = new URL(request.url); }catch(_e){ return; }
    if(url.origin !== self.location.origin) return;
    if(core.isAudio(url.pathname)){ core.audio(event); return; }                           // 保存ずみの音楽は オフラインでも 再生（なければ ふつうに ネットから）
    if(request.headers.has("range")) return;
    if(url.pathname.indexOf(new URL("./", self.location.href).pathname) !== 0){             // ゲームの フォルダの そと（共通の js など）：ネット優先、オフラインのときだけ 控え
        event.respondWith(fetch(request).catch(() => core.lookup(request, false).then((h) => h || Response.error())));
        return;
    }
    event.respondWith((async () => {
        try{
            const res = await fetch(request);   // ブラウザの控え（数分）をつかう → 2回目からは通信なしで すぐ ひらく
            if(res && res.status === 200 && res.type === "basic"){ const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {}); }
            return res;
        }catch(err){
            const hit = await caches.match(request);
            if(hit) return hit;
            if(request.mode === "navigate"){ const home = await caches.match("./index.html"); if(home) return home; }
            throw err;
        }
    })());
});
