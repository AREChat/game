// ===== のりこみの 演出（2026-11-26）=====
// アトラクションごとに、「のりばの ようす」を はっきり 見せる。
//   ・s:"move" ＝ のりものは とまらずに ゆっくり うごきつづけている。うごく ゆかに あわせて「1、2の 3！」で のりこむ
//   ・s:"stop" ＝ のりものが 1だいずつ ゆっくり ちかづいて きて、のりばに ぴたっと とまる。とびらが ひらいて のりこみ、あんぜんバーが おりて、しゅっぱつ
// 1回目・2回目は ぜんぶ 見せて、3回目からは みじかい版（約3びょう）。E（または 画面の ⏩）で とばせる。Esc / Q で やめる（コインは へらない）。
// オートプレイ中は 演出を とばす。のりものの 中の ようす（ride）は ここでは かえない。

// ic：絵文字／veh：のりものの よびかた／tail：しゅっぱつ前の ひとこと
export const BOARD = {
    ghost:    {s: "move", ic: "🕯️", veh: "ゴンドラ", tail: "くらい おやしきへ ゆっくり すすむよ…"},
    fairy:    {s: "move", ic: "🧚", veh: "おとぎの のりもの", tail: "ひかりの もりへ しゅっぱつ！"},
    boat:     {s: "move", ic: "🏮", veh: "ランタンの ボート", tail: "ゆらゆら、みなもを すべりだすよ"},
    splash:   {s: "move", ic: "💦", veh: "まるたの ボート", tail: "みずしぶきに ちゅうい！"},
    safari:   {s: "move", ic: "🦒", veh: "サファリ・カー", tail: "ふしぎな いきものたちに あいに いこう"},
    sky:      {s: "move", ic: "🚠", veh: "スカイ・ゴンドラ", tail: "そらの さんぽに しゅっぱつ！"},
    ship:     {s: "move", ic: "🚀", veh: "ムーンシップ", tail: "ふわっと ういて、つきの みちへ"},
    wheel:    {s: "move", ic: "🎡", veh: "ゴンドラ", tail: "ゆっくり ゆっくり、そらへ のぼるよ"},
    carousel: {s: "stop", ic: "🎠", veh: "おうま", tail: "おんがくに あわせて まわりだすよ"},
    balloon:  {s: "stop", ic: "🎈", veh: "バルーンの かご", tail: "ふわっと ういて いくよ"},
    drop:     {s: "stop", ic: "🗼", veh: "ドロップの せき", tail: "ゆっくり うえへ…（まんなかで ドキドキ！）"},
    swing:    {s: "stop", ic: "🪁", veh: "ブランコ", tail: "ゆるやかに まわりながら のぼるよ"},
    spinner:  {s: "stop", ic: "☕", veh: "カップ", tail: "ハンドルを まわして くるくる！"},
    mine:     {s: "stop", ic: "💎", veh: "トロッコ", tail: "クリスタルの どうくつへ ガタンゴトン！"},
    worldjet: {s: "stop", ic: "✈️", veh: "ジェット", tail: "せかいの そらへ テイクオフ！"},
    sweets:   {s: "stop", ic: "🍬", veh: "ブラスター・カー", tail: "あまい まちへ しゅっぱつ！"},
    aurora:   {s: "stop", ic: "🌌", veh: "ウイング", tail: "オーロラの そらを とぶよ"},
    shoot:    {s: "stop", ic: "⭐", veh: "シューティング・カー", tail: "まとを ねらって、よーい…！"},
    cosmo:    {s: "stop", ic: "🪐", veh: "カプセル", tail: "うちゅうへ カウントダウン！"},
    loop:     {s: "stop", ic: "🌀", veh: "ループの せき", tail: "ぐるりと まわる じゅんび、いいかな？"}
};
export const boardInfo = (a) => (a && BOARD[a.id]) || null;
export const BOARD_IDS = Object.keys(BOARD);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, ease = (u) => u * u * (3 - 2 * u);
const wrap = (d) => { while(d > Math.PI) d -= 2 * Math.PI; while(d < -Math.PI) d += 2 * Math.PI; return d; };

let cssDone = false;
function css(){
    if(cssDone) return; cssDone = true;
    const st = document.createElement("style"); st.id = "dfBoardCss";
    st.textContent =
        "#dfBoard{position:fixed;inset:0;z-index:7;pointer-events:none;font-family:inherit;overflow:hidden}" +
        "#dfBoard .bt{position:absolute;left:50%;top:9%;transform:translateX(-50%);background:rgba(32,24,80,.86);border:2px solid #ffd76a;border-radius:16px;padding:8px 20px;font-weight:900;font-size:clamp(15px,3.2vw,22px);color:#fff;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}" +
        "#dfBoard .bc{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);width:min(760px,92vw);text-align:center;background:rgba(255,250,240,.94);color:#2a1e50;border:3px solid #2a1e50;border-radius:18px;padding:12px 16px;font-weight:800;font-size:clamp(15px,3vw,21px);line-height:1.5;opacity:0;transition:opacity .25s}" +
        "#dfBoard .bc.on{opacity:1}" +
        "#dfBoard .bn{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) scale(1);font-weight:900;font-size:clamp(70px,18vw,150px);color:#fff;text-shadow:0 5px 0 #ff6a9a,0 0 26px #ffd76a;opacity:0}" +
        "#dfBoard .bn.pop{animation:dfbpop .6s ease-out}" +
        "@keyframes dfbpop{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}" +
        "#dfBoard .belt{position:absolute;left:-5%;right:-5%;bottom:0;height:20vh;opacity:0;transition:opacity .4s;transform:perspective(520px) rotateX(48deg);transform-origin:50% 100%;background:repeating-linear-gradient(90deg,#3a3358 0,#3a3358 46px,#4a4270 46px,#4a4270 48px),#3a3358;border-top:10px solid #ffd76a;box-shadow:inset 0 0 0 4px #1d1838}" +
        "#dfBoard .belt:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,215,106,.55) 0,rgba(255,215,106,.55) 14px,transparent 14px,transparent 96px);animation:dfbelt .55s linear infinite}" +
        "#dfBoard .belt.on{opacity:1}" +
        "@keyframes dfbelt{to{background-position:-96px 0}}" +
        "#dfBoard .bar{position:absolute;left:3%;right:3%;top:-14%;height:11vh;border-radius:30px;background:linear-gradient(#e8ecf8,#9aa3c4 55%,#6a7298);border:4px solid #3a3358;box-shadow:0 12px 20px rgba(0,0,0,.45);transition:top .55s cubic-bezier(.3,1.5,.5,1)}" +
        "#dfBoard .bar.down{top:66%}" +
        "#dfBoard .bar:after{content:'';position:absolute;left:50%;top:20%;width:18%;height:60%;transform:translateX(-50%);border-radius:14px;background:linear-gradient(#ffd76a,#e0a020)}" +
        "#dfBoard .dr{position:absolute;top:0;bottom:0;width:50%;background:linear-gradient(90deg,#4a4270,#2b2550);transition:transform .9s cubic-bezier(.6,0,.3,1);opacity:.96}" +
        "#dfBoard .dl{left:0;border-right:6px solid #ffd76a}#dfBoard .dr2{right:0;border-left:6px solid #ffd76a;background:linear-gradient(270deg,#4a4270,#2b2550)}" +
        "#dfBoard .dl.open{transform:translateX(-100%)}#dfBoard .dr2.open{transform:translateX(100%)}" +
        "#dfBoard .bs{position:absolute;right:12px;bottom:25%;pointer-events:auto;cursor:pointer;background:rgba(32,24,80,.86);border:2px solid #fff;border-radius:14px;padding:6px 14px;font-weight:800;font-size:clamp(13px,2.8vw,17px);color:#fff}";
    document.head.appendChild(st);
}
const el = (cls, text) => { const d = document.createElement("div"); d.className = cls; if(text !== undefined) d.textContent = text; return d; };

// 1回ぶんの 演出
export class BoardScene{
    constructor(g, a, info, short){
        this.g = g; this.a = a; this.info = info; this.short = !!short; this.t = 0; this.done = false; this.k = 0; this.skipReq = false;
        this.yaw0 = g.yaw; const c = a.c || (a.board ? [a.board.x, a.board.z - 1] : null);
        this.faceYaw = c ? Math.atan2(c[0] - g.x, c[1] - g.z) : g.yaw;
        if(c && Math.hypot(c[0] - g.x, c[1] - g.z) < 2) this.faceYaw = g.yaw;           // ほとんど 同じ場所なら 向きは かえない
        css();
        const r = this.root = el(""); r.id = "dfBoard";
        this.title = el("bt", info.ic + "  " + a.n + "  の のりば");
        this.cap = el("bc"); this.num = el("bn");
        r.appendChild(this.title);
        if(info.s === "move"){ this.belt = el("belt"); r.appendChild(this.belt); }
        else{ this.dl = el("dr dl"); this.dr = el("dr dr2"); r.appendChild(this.dl); r.appendChild(this.dr); this.bar = el("bar"); r.appendChild(this.bar); }
        r.appendChild(this.num); r.appendChild(this.cap);
        this.skipBtn = el("bs", "⏩ とばす（E）"); this.skipBtn.addEventListener("click", () => { this.skipReq = true; });
        this.skipBtn.addEventListener("touchstart", (e) => { this.skipReq = true; e.preventDefault(); }, {passive: false});
        r.appendChild(this.skipBtn);
        document.body.appendChild(r); document.body.classList.add("boarding");
        // 時刻（びょう）ごとの できごと
        const v = info.veh, ev = [];
        if(info.s === "stop"){
            if(this.short) ev.push([.2, "say", v + "が ぴたっと とまったよ！"], [.3, "sfx", "bell"], [1.0, "doors"], [1.6, "say", "せきに すわって… バーが おりるよ"], [1.9, "seat"], [2.2, "bar"], [3.2, "say", info.tail], [3.9, "end"]);
            else ev.push([.2, "say", v + "が ゆっくり ちかづいて きたよ…"], [.4, "sfx", "bell"], [2.0, "say", "ぴたっ！ と のりばに とまったよ（1だいずつ とまるから あわてなくて だいじょうぶ）"], [2.0, "brake"], [3.0, "doors"], [3.1, "say", "とびらが ひらいた！ さあ、のりこもう"], [4.4, "say", "せきに すわって… あんぜんバーが おりるよ"], [4.6, "seat"], [4.9, "bar"], [6.0, "say", "「いってらっしゃい！」  " + info.tail], [7.1, "end"]);
        }else{
            if(this.short) ev.push([.2, "belt"], [.3, "say", v + "は とまらずに うごいているよ"], [1.2, "n", "1"], [1.8, "n", "2"], [2.4, "n", "3"], [2.9, "hop"], [3.3, "seat"], [3.5, "say", info.tail], [4.2, "end"]);
            else ev.push([.2, "belt"], [.3, "say", v + "は とまらずに ゆっくり うごきつづけているよ！"], [2.4, "say", "うごく ゆかに あわせて、あしもとを みて… 「1、2の 3！」で のりこもう"], [4.0, "n", "1"], [4.7, "n", "2"], [5.4, "n", "3"], [5.9, "hop"], [6.3, "seat"], [6.5, "say", "のれた！  " + info.tail], [7.6, "end"]);
        }
        this.ev = ev; this.endAt = ev[ev.length - 1][0];
    }
    say(t){ this.cap.textContent = t; this.cap.classList.add("on"); }
    fire(e){
        const [, k, x] = e;
        if(k === "say") this.say(x);
        else if(k === "sfx") this.g.sfx(x);
        else if(k === "belt"){ this.belt.classList.add("on"); this.g.sfx("belt"); }
        else if(k === "n"){ this.num.textContent = x; this.num.classList.remove("pop"); void this.num.offsetWidth; this.num.classList.add("pop"); this.g.sfx("ok"); }
        else if(k === "hop"){ this.hopAt = this.t; this.g.sfx("door"); }
        else if(k === "brake"){ this.brakeAt = this.t; this.g.sfx("door"); }
        else if(k === "doors"){ this.dl.classList.add("open"); this.dr.classList.add("open"); this.g.sfx("door"); }
        else if(k === "seat"){ this.seated = true; try{ this.g.ui.el.frame.className = "veh-" + (this.a.vehicle || this.a.kind || this.a.mode || ""); this.g.ui.el.frame.style.opacity = "1"; }catch(_e){} this.g.sfx("clack"); }
        else if(k === "bar"){ this.bar.classList.add("down"); setTimeout(() => this.g.sfx("clack"), 420); }
        else if(k === "end") this.done = true;
    }
    update(dt, canSkip){
        this.t += dt;
        while(this.k < this.ev.length && this.ev[this.k][0] <= this.t) this.fire(this.ev[this.k++]);
        if(canSkip && this.t > .7 && this.skipReq){ this.skipReq = false; this.done = true; }
        if(this.t > this.endAt + .2) this.done = true;
        return this.done;
    }
    // のりばの 中の カメラ（歩いていたときの 視点から、すこしだけ うごかす）
    camera(base){
        const t = this.t, c = {eye: base.eye.slice(), yaw: base.yaw, pitch: base.pitch, fov: base.fov};
        c.yaw = this.yaw0 + wrap(this.faceYaw - this.yaw0) * ease(clamp(t / 1.1, 0, 1));
        c.pitch = lerp(base.pitch, -.1, ease(clamp(t / 1.1, 0, 1)));
        if(this.info.s === "move"){
            const u = clamp((t - .3) / 5.6, 0, 1), fw = [Math.sin(c.yaw), Math.cos(c.yaw)], d = (this.short ? .35 : .55) * u * (this.short ? 3 : 6) * .6;
            c.eye[0] += fw[0] * d; c.eye[2] += fw[1] * d; c.eye[1] += Math.sin(t * 6.5) * .012 * clamp(t / .6, 0, 1);
            if(this.hopAt !== undefined){ const h = clamp((t - this.hopAt) / .5, 0, 1); c.eye[1] += Math.sin(h * Math.PI) * .28; c.pitch -= Math.sin(h * Math.PI) * .06; }
        }else if(this.brakeAt !== undefined){
            const h = t - this.brakeAt; if(h >= 0 && h < 1.2){ c.pitch += Math.sin(h * 9) * Math.exp(-h * 3.5) * .05; c.eye[1] += Math.sin(h * 9) * Math.exp(-h * 3.5) * .02; }
        }
        return c;
    }
    destroy(keepFrame){
        document.body.classList.remove("boarding");
        if(this.root.parentNode) this.root.parentNode.removeChild(this.root);
        if(!keepFrame){ try{ this.g.ui.el.frame.className = ""; this.g.ui.el.frame.style.opacity = ""; }catch(_e){} }
        else { try{ this.g.ui.el.frame.style.opacity = ""; }catch(_e){} }
    }
}
