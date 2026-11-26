"use strict";
// ===== ARE QUEST 置き場（game）の サービスワーカー =====
// ・ページの本体（html/js/css/json）は 最初に まとめて保存（オフラインでも あそべる）。画像・音楽は「オフライン準備」ボタンで are-media に保存（sw-core.js）。
// ・html は ネット優先（つながるときは 常に最新）／js・css などは 控え先・裏で更新。
// ・ARE QUEST 本体（game/）は game/sw.js が 先に担当する。GET 以外・ほかのサイトには さわらない。
importScripts("precache-manifest.js", "sw-core.js");
const CACHE = "game-v97-20261126";
const core = self.areCore({shell: CACHE, root: "./", precache: true, fetch: false});
const STATIC_RE = /\.(?:js|css|png|webp|jpe?g|gif|svg|ico|json|webmanifest|txt|woff2?|ttf|mp3|mp4|wasm)$/i;

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("message", (event) => { if(event.data && event.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE && k !== "are-media" && k.indexOf("tq-game-") !== 0).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});

function putCopy(request, response){
    if(response && response.status === 200 && response.type === "basic"){
        let copy;
        try{ copy = response.clone(); }catch(_e){ return Promise.resolve(); }
        return caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
    }
    return Promise.resolve();
}
// soft=true（画面の html）：控えがあるのに ネットが1.5秒たっても返らないとき（電波が弱い・モバイル回線）は、先に控えを出す。
// ネットの取得は そのまま続けて、控えを新しくする（次に開いたときに最新になる）。
// 画面（html）は、?g=rpg や ?back=… のような あと付けが ちがっても、同じ画面の控えを 使う（オフラインで ジャンルページが 開けるように）
async function matchPage(request){
    const hit = await caches.match(request);
    if(hit) return hit;
    try{
        const u = new URL(request.url);
        if(request.mode === "navigate" || /\.html$/i.test(u.pathname) || /\/$/.test(u.pathname)) return await caches.match(request, {ignoreSearch: true});
    }catch(_e){}
    return undefined;
}
async function networkFirst(request, soft){
    try{
        const p = fetch(request, {cache: "no-cache"}).then((response) => { putCopy(request, response); return response; });
        if(soft){
            const cachedNow = await matchPage(request);
            if(cachedNow){
                p.catch(() => {});
                return await Promise.race([p, new Promise((res) => setTimeout(() => res(cachedNow), 1500))]);
            }
        }
        return await p;
    }catch(error){
        const cached = await matchPage(request);
        if(cached) return cached;
        if(request.mode === "navigate"){ const home = await caches.match("./game/index.html"); if(home) return home; }
        throw error;
    }
}
async function cacheFirst(event, request, revalidate){
    const cached = await caches.match(request);
    if(cached){
        if(revalidate) event.waitUntil(fetch(request, {cache: "no-cache"}).then((response) => putCopy(request, response)).catch(() => {}));
        return cached;
    }
    const response = await fetch(request);
    putCopy(request, response);
    return response;
}
self.addEventListener("fetch", (event) => {
    const request = event.request;
    if(request.method !== "GET") return;
    let url;
    try{ url = new URL(request.url); }catch(_e){ return; }
    if(url.origin !== self.location.origin) return;
    if(core.isAudio(url.pathname)){ core.audio(event); return; }
    if(request.headers.has("range")) return;
    if(url.pathname.indexOf("/desktop/") !== -1) return;
    const path = url.pathname;
    const isPage = request.mode === "navigate" || /\.html$/i.test(path) || /\/$/.test(path);
    if(isPage || /\/version\.json$/i.test(path) || !STATIC_RE.test(path)){ event.respondWith(networkFirst(request, isPage && !/\/version\.json$/i.test(path))); return; }
    event.respondWith(cacheFirst(event, request, !url.searchParams.has("v")));
});
