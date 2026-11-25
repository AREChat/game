"use strict";
/* ルール・ルーレット：ラウンドの しくみ・ルールの へんか（ミューテータ）・画面の ゆがみ
   ・マイクロゲーム（rr-games-*.js）は 「ゲームの 世界（W×H）」の 中だけで 動く。
   ・ルールの へんかには 2しゅるい： ①ゲームの 中身を かえる（fast/slow/big/tiny/hurry） ②見え方・うごかし方を かえる（mirror/invert/upside/dark/shake/spin/zoom）
   Node でも ブラウザでも つかえる（テストで ぜんぶの くみあわせを たしかめる）。 */
(function(root){
    var W = 400, H = 560;
    function mkRng(seed){ var a = (seed >>> 0) || 1; return function(){ a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    var N = function(ja, en, zh, ko){ return {ja: ja, en: en, zh: zh, ko: ko}; };

    var MODS = [
        {id: "mirror", em: "🪞", logic: 0, n: N("かがみ", "Mirror", "镜子", "거울"), d: N("ひだりと みぎが ぎゃく！", "Left and right are swapped!", "左右反了！", "좌우가 반대!")},
        {id: "invert", em: "🙃", logic: 0, n: N("ぎゃくさま", "Inverted", "全反", "모두 반대"), d: N("うえしたも ひだりみぎも ぎゃく！", "Up/down and left/right are reversed!", "上下左右全都反了！", "상하좌우가 모두 반대!")},
        {id: "upside", em: "🔄", logic: 0, n: N("さかさま", "Upside Down", "颠倒", "거꾸로"), d: N("がめんが さかさまに！", "The screen is upside down!", "画面上下颠倒！", "화면이 거꾸로!")},
        {id: "dark", em: "🔦", logic: 0, n: N("くらやみ", "Spotlight", "黑暗", "어둠"), d: N("ゆびの まわりしか みえない！", "You only see around your finger!", "只能看到手指周围！", "손가락 주변만 보여요!")},
        {id: "shake", em: "🌊", logic: 0, n: N("ゆらゆら", "Wobble", "摇晃", "흔들흔들"), d: N("がめんが ゆれる！", "The screen wobbles!", "画面在摇晃！", "화면이 흔들려요!")},
        {id: "spin", em: "🌀", logic: 0, n: N("ぐるぐる", "Spin", "旋转", "빙글빙글"), d: N("がめんが ゆっくり まわる！", "The screen slowly rotates!", "画面在慢慢旋转！", "화면이 천천히 돌아요!")},
        {id: "zoom", em: "🔍", logic: 0, n: N("ズーム", "Zoom", "放大", "확대"), d: N("がめんが 1.6ばいに！", "The screen is zoomed in!", "画面放大1.6倍！", "화면이 1.6배 확대!")},
        {id: "fast", em: "⚡", logic: 1, n: N("はやおくり", "Fast", "加速", "빨리감기"), d: N("ぜんぶが 1.45ばい はやい！", "Everything is 1.45x faster!", "一切都快1.45倍！", "모든 게 1.45배 빨라요!")},
        {id: "slow", em: "🐢", logic: 1, n: N("スロー", "Slow", "慢动作", "슬로우"), d: N("ぜんぶが ゆっくり。", "Everything is slower.", "一切都变慢了。", "모든 게 느려져요.")},
        {id: "big", em: "🔵", logic: 1, n: N("ビッグ", "Big", "巨大化", "빅"), d: N("まとが おおきい！ チャンス！", "Targets are huge! Lucky!", "目标变大了！好机会！", "과녁이 커졌어요! 찬스!")},
        {id: "tiny", em: "🔹", logic: 1, n: N("ちびっこ", "Tiny", "迷你", "꼬마"), d: N("まとが ちいさい…！", "Targets are tiny…!", "目标变小了……！", "과녁이 작아졌어요…!")},
        {id: "hurry", em: "⏰", logic: 1, n: N("じかんぎれ", "Hurry", "限时", "시간 부족"), d: N("せいげん じかんが 70%！", "Only 70% of the time!", "时间只剩70%！", "제한 시간이 70%!")}
    ];
    var MOD = {}; MODS.forEach(function(m){ MOD[m.id] = m; });

    function has(mods, id){ return mods && mods.indexOf(id) >= 0; }

    function Round(game, o){
        o = o || {}; var mods = o.mods || [];
        this.g = game; this.W = W; this.H = H; this.rnd = mkRng(o.seed || 1); this.lv = o.lv || 0; this.mods = mods;
        this.sz = has(mods, "big") ? 1.4 : has(mods, "tiny") ? .72 : 1;
        this.ts = has(mods, "fast") ? 1.45 : has(mods, "slow") ? .7 : 1;
        this.time = game.time * (has(mods, "hurry") ? .7 : 1) * (o.timeMul || 1);
        this.t = 0; this.status = "run"; this.score = 0; this.fxq = []; this.sfxq = [];
        game.setup(this);
    }
    Round.prototype.ri = function(a, b){ return a + Math.floor(this.rnd() * (b - a + 1)); };
    Round.prototype.pick = function(arr){ return arr[Math.floor(this.rnd() * arr.length)]; };
    Round.prototype.win = function(){ if(this.status === "run"){ this.status = "win"; } };
    Round.prototype.lose = function(why){ if(this.status === "run"){ this.status = "lose"; this.why = why || ""; } };
    Round.prototype.fx = function(x, y, c){ this.fxq.push({x: x, y: y, c: c || "#fff"}); };
    Round.prototype.sfx = function(n){ this.sfxq.push(n); };
    Round.prototype.step = function(dt, inp){
        if(this.status !== "run") return;
        this.t += dt;
        this.g.update(this, dt * this.ts, inp);
        if(this.status === "run" && this.t >= this.time){ if(this.g.type === "survive") this.win(); else this.lose("time"); }
    };
    Round.prototype.left = function(){ return Math.max(0, this.time - this.t); };

    // ---- 画面の ゆがみ（ゲームの 世界 ⇄ 画面） ----
    function viewOf(mods, t, cur){
        var v = {rot: 0, zoom: 1, flip: 1, fx: W / 2, fy: H / 2, jx: 0, jy: 0};
        if(has(mods, "upside")) v.flip = -1;
        if(has(mods, "shake")){ v.rot = Math.sin(t * 7.3) * .06 + Math.sin(t * 12.1) * .035; v.jx = Math.sin(t * 17) * 4; v.jy = Math.cos(t * 13) * 4; }
        if(has(mods, "spin")) v.rot = t * .45;
        if(has(mods, "zoom")){ v.zoom = 1.6; var hw = W / 2 / 1.6, hh = H / 2 / 1.6; v.fx = Math.max(hw, Math.min(W - hw, cur ? cur.x : W / 2)); v.fy = Math.max(hh, Math.min(H - hh, cur ? cur.y : H / 2)); }
        return v;
    }
    // ゲームの 点 → 画面の 点
    function toScreen(v, x, y){
        var dx = (x - v.fx) * v.zoom, dy = (y - v.fy) * v.zoom * v.flip, c = Math.cos(v.rot), s = Math.sin(v.rot);
        return {x: W / 2 + v.jx + dx * c - dy * s, y: H / 2 + v.jy + dx * s + dy * c};
    }
    // 画面の 点 → ゲームの 点（そのあと mirror/invert を かける）
    function toGame(v, sx, sy, mods){
        var dx = sx - W / 2 - v.jx, dy = sy - H / 2 - v.jy, c = Math.cos(-v.rot), s = Math.sin(-v.rot);
        var rx = dx * c - dy * s, ry = dx * s + dy * c;
        var x = v.fx + rx / v.zoom, y = v.fy + ry / (v.zoom * v.flip);
        if(has(mods, "mirror")) x = W - x;
        if(has(mods, "invert")){ x = W - x; y = H - y; }
        return {x: Math.max(0, Math.min(W, x)), y: Math.max(0, Math.min(H, y))};
    }

    root.RR = {W: W, H: H, Round: Round, MODS: MODS, MOD: MOD, viewOf: viewOf, toGame: toGame, toScreen: toScreen, mkRng: mkRng, GAMES: [], add: function(g){ root.RR.GAMES.push(g); }, has: has, N: N};
    if(typeof module !== "undefined" && module.exports) module.exports = root.RR;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
