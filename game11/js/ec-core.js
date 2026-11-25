"use strict";
/* こだまの部屋：ルールの しくみ（画面なし。Node でも ブラウザでも つかえる）
   ・1手ごとに 1マス（U 上／D 下／L 左／R 右／W まつ）。
   ・「こだまにする」と、今の動きが こだまに なり、はじめの場所から おなじ 動きを くりかえす。
     こだまは、動きが おわったら、その場所に とまったまま（スイッチを おし続ける）。
   ・床の スイッチ（1・2・3）を だれかが ふんでいる あいだ、おなじ 番号の とびら（a・b・c）が あく。
   ・とびらが あくか どうかは「その手の はじめ」の 位置で きまる。とびらや かべに ぶつかった 動きは「まつ」になる。
   ・主人公が ゴール（G）に ついたら クリア。 */
(function(root){
    var DIRS = {U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0], W: [0, 0]};
    var MAXT = 80;

    // rows: ["#####", "#S.G#", ...]  # かべ  S スタート  G ゴール  1 2 3 スイッチ  a b c とびら  . ゆか
    function parse(def){
        var rows = def.rows, h = rows.length, w = 0, i, x, y, ch;
        for(i = 0; i < h; i++) w = Math.max(w, rows[i].length);
        var L = {w: w, h: h, wall: [], plates: [], doors: [], start: null, goal: null, echoes: def.echoes || 1, def: def, doorAt: {}, plateAt: {}};
        for(y = 0; y < h; y++){
            L.wall[y] = [];
            for(x = 0; x < w; x++){
                ch = rows[y].charAt(x) || "#";
                L.wall[y][x] = ch === "#";
                if(ch === "S") L.start = {x: x, y: y};
                else if(ch === "G") L.goal = {x: x, y: y};
                else if(ch >= "1" && ch <= "3"){ var p = {x: x, y: y, id: +ch}; L.plates.push(p); L.plateAt[x + "," + y] = p; }
                else if(ch >= "a" && ch <= "c"){ var d = {x: x, y: y, id: ch.charCodeAt(0) - 96}; L.doors.push(d); L.doorAt[x + "," + y] = d; }
            }
        }
        if(!L.start || !L.goal) throw new Error("EC.parse: S と G が ひつようです");
        return L;
    }

    function openSet(L, actors){
        var open = {}, i, p;
        for(i = 0; i < actors.length; i++){ p = L.plateAt[actors[i].x + "," + actors[i].y]; if(p) open[p.id] = true; }
        return open;
    }

    // recs: こだまの 動き（文字列の 配列）。cur: 今の ラウンドの 主人公の 動き（文字列）。
    // 返り値: {hero:[{x,y}...], echoes:[[...]...], open:[その手の はじめの とびらの 状態...], now:{open, hero, echoes}, won, wonTick, cur: 実際に おこなわれた 動き}
    function simulate(L, recs, cur){
        var T = cur.length, t, i, n = recs.length;
        var pos = [], eff = "", out = {hero: [], echoes: [], open: [], won: false, wonTick: -1};
        for(i = 0; i <= n; i++) pos.push({x: L.start.x, y: L.start.y});
        out.hero.push({x: pos[n].x, y: pos[n].y});
        for(i = 0; i < n; i++) out.echoes.push([{x: pos[i].x, y: pos[i].y}]);
        for(t = 0; t < T; t++){
            var open = openSet(L, pos); out.open.push(open);
            var np = [], k;
            for(k = 0; k <= n; k++){
                var cmd = k < n ? (recs[k].charAt(t) || "W") : cur.charAt(t);
                var dv = DIRS[cmd] || DIRS.W, nx = pos[k].x + dv[0], ny = pos[k].y + dv[1], ok = true;
                if(nx < 0 || ny < 0 || nx >= L.w || ny >= L.h || L.wall[ny][nx]) ok = false;
                else { var d = L.doorAt[nx + "," + ny]; if(d && !open[d.id]) ok = false; }
                if(!ok){ nx = pos[k].x; ny = pos[k].y; if(k === n) cmd = "W"; }
                if(k === n) eff += cmd;
                np.push({x: nx, y: ny});
            }
            pos = np;
            for(k = 0; k < n; k++) out.echoes[k].push({x: pos[k].x, y: pos[k].y});
            out.hero.push({x: pos[n].x, y: pos[n].y});
            if(pos[n].x === L.goal.x && pos[n].y === L.goal.y){ out.won = true; out.wonTick = t + 1; out.cur = eff; break; }
        }
        out.cur = eff;
        out.now = {open: openSet(L, pos), hero: pos[n], echoes: pos.slice(0, n)};
        return out;
    }

    // ゲームの 進み具合（やり直し・ひとつ戻す・こだまにする）
    function Game(L){ this.L = L; this.recs = []; this.cur = ""; this.moves = 0; }
    Game.prototype.sim = function(){ return simulate(this.L, this.recs, this.cur); };
    Game.prototype.won = function(){ return this.sim().won; };
    Game.prototype.move = function(cmd){
        if(!DIRS[cmd] || this.cur.length >= MAXT) return false;
        var before = this.sim(); if(before.won) return false;
        var after = simulate(this.L, this.recs, this.cur + cmd);
        this.cur = after.cur;   // ぶつかった 動きは「まつ」として きろくされる
        this.moves++;
        return true;
    };
    Game.prototype.undo = function(){ if(!this.cur.length) return false; this.cur = this.cur.slice(0, -1); return true; };
    Game.prototype.canEcho = function(){ return this.recs.length < this.L.echoes && this.cur.replace(/W+$/, "").length > 0 && !this.sim().won; };
    Game.prototype.echo = function(){
        if(!this.canEcho()) return false;
        this.recs.push(this.cur.replace(/W+$/, "")); this.cur = ""; return true;
    };
    Game.prototype.redoRound = function(){ this.cur = ""; };   // 今の ラウンドだけ やり直す
    Game.prototype.undoEcho = function(){ if(!this.recs.length) return false; this.cur = this.recs.pop(); return true; };   // さいごの こだまを もどす
    Game.prototype.reset = function(){ this.recs = []; this.cur = ""; this.moves = 0; };
    // 通しの 手数（こだまの 長さ ＋ 今の 長さ）
    Game.prototype.total = function(){ var s = this.cur.length, i; for(i = 0; i < this.recs.length; i++) s += this.recs[i].length; return s; };

    // 答えの たしかめ：rounds = ["DD", "RWRRR"]（さいごが 主人公）
    function check(L, rounds){
        var g = new Game(L), i, j;
        for(i = 0; i < rounds.length; i++){
            for(j = 0; j < rounds[i].length; j++) g.move(rounds[i].charAt(j));
            if(i < rounds.length - 1){ if(!g.echo()) return {ok: false, why: "echo"}; }
        }
        return {ok: g.won(), total: g.total(), game: g};
    }

    var EC = {parse: parse, simulate: simulate, Game: Game, check: check, DIRS: DIRS, MAXT: MAXT, openSet: openSet};
    if(typeof module !== "undefined" && module.exports) module.exports = EC; else root.EC = EC;
})(typeof window !== "undefined" ? window : this);
