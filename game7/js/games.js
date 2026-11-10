"use strict";
// 5つのミニゲーム（どれも タップ／長押し／スワイプだけ・30秒〜1分）
(function(){
  var C = window.G7, W = C.W, H = C.H, S = C.S;
  var R = Math.random;
  function rnd(a, b){ return a + R() * (b - a); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function emoji(x, ch, px, py, size, rot){ x.save(); x.translate(px, py); if(rot) x.rotate(rot); x.font = size + "px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(ch, 0, 0); x.restore(); }
  function glowRect(x, px, py, w, h, col){ x.save(); x.shadowColor = col; x.shadowBlur = 16; x.fillStyle = col; x.fillRect(px, py, w, h); x.restore(); }
  function addP(list, px, py, n, col, sp){ for(var i = 0; i < n; i++){ var a = R() * 6.283, v = rnd(40, sp || 200); list.push({x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: rnd(.4, .9), c: col}); } }
  function stepP(list, dt){ for(var i = list.length - 1; i >= 0; i--){ var p = list[i]; p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; if(p.t <= 0) list.splice(i, 1); } }
  function drawP(x, list){ list.forEach(function(p){ x.globalAlpha = clamp(p.t * 2, 0, 1); x.fillStyle = p.c; x.fillRect(p.x - 2, p.y - 2, 4, 4); }); x.globalAlpha = 1; }
  function accessory(x, px, py, size){ var e = C.equip(); if(e) emoji(x, e, px, py, size); }

  // ===== ① ネオン・サイバーダッシュ =====
  var D = {id: "dash", icon: "🏃", name: "ネオン・サイバーダッシュ", chance: 25, dur: 45, coinRate: .7, desc: "ジャンプとスライディングで、ネオンの街を駆けぬけろ！",
    help: "タップ＝ジャンプ ／ 下にスワイプ＝スライディング"};
  var GROUND = 520;
  D.init = function(){ D.y = 0; D.vy = 0; D.slide = 0; D.obs = []; D.coins = []; D.next = 400; D.dist = 0; D.fever = 0; D.inv = 0; D.shake = 0; D.parts = []; D.bx = 0; D.flash = 0; C.S.combo = 0; };
  D.onTap = function(){ if(D.y === 0 && D.slide <= 0){ D.vy = -740; C.SFX.jump(); } };
  D.onSwipe = function(d){ if(d === "up") D.onTap(); else if(d === "down"){ D.slide = .55; if(D.y > 0) D.vy = Math.max(D.vy, 600); } };
  D.update = function(dt){
    var v = (300 + C.time() * 4) * (D.fever > 0 ? 1.5 : 1);
    D.dist += v * dt; S.score += v * dt / 25; D.bx += v * dt;
    if(D.fever > 0) D.fever -= dt; if(D.inv > 0) D.inv -= dt; if(D.slide > 0) D.slide -= dt; if(D.shake > 0) D.shake -= dt; if(D.flash > 0) D.flash -= dt;
    D.vy += 2300 * dt; D.y -= D.vy * dt; if(D.y <= 0){ D.y = 0; D.vy = 0; } else if(D.y > 0 && D.vy < 0 && false) D.y = 0;
    if(D.y < 0) D.y = 0;
    D.next -= v * dt;
    if(D.next <= 0){
      var type = R() < .5 ? "low" : "high";
      D.obs.push({x: W + 40, type: type, w: type === "low" ? 34 : 56, h: type === "low" ? 42 : 24, y: type === "low" ? 0 : 36, done: false});
      if(R() < .7){ var cy = type === "low" ? 120 : 20, cx = W + 40 - 90; for(var i = 0; i < 5; i++) D.coins.push({x: cx + i * 28, y: cy + (type === "low" ? Math.sin(i / 4 * 3.14) * 50 : 0)}); }
      D.next = rnd(300, 480) + v * .25;
    }
    var px = 64, pw = 30, ph = D.slide > 0 ? 22 : 44, ptop = GROUND - D.y - ph, pbot = GROUND - D.y;
    D.obs.forEach(function(o){
      o.x -= v * dt; var ot = GROUND - o.y - o.h, ob = GROUND - o.y;
      if(!o.done && o.x < px + pw && o.x + o.w > px && ptop < ob && pbot > ot){
        o.done = true;
        if(D.fever > 0){ addP(D.parts, o.x, ot, 14, "#ffd84a", 260); S.score += 20; C.SFX.good(); }
        else if(D.inv <= 0){ S.combo = 0; C.bonusTime -= 2; D.inv = 1; D.shake = .3; C.SFX.hit(); addP(D.parts, px, ptop, 10, "#ff4fa0"); }
        o.dead = true;
      } else if(!o.done && o.x + o.w < px){ o.done = true; S.combo++; S.score += 10 + S.combo; C.SFX.coin();
        if(S.combo % 8 === 0 && D.fever <= 0){ D.fever = 5; D.flash = .5; C.cutin("🔥 フィーバー！ 全部ふっとばせ！", 1200); C.SFX.fan(); } }
    });
    D.obs = D.obs.filter(function(o){ return o.x > -80 && !o.dead; });
    D.coins.forEach(function(k){ k.x -= v * dt; if(!k.got && Math.abs(k.x - (px + 15)) < 22 && Math.abs((GROUND - k.y - 12) - (ptop + ph / 2)) < 34){ k.got = true; S.score += 5; C.SFX.coin(); addP(D.parts, k.x, GROUND - k.y, 4, "#ffe27a", 120); } });
    D.coins = D.coins.filter(function(k){ return k.x > -20 && !k.got; });
    stepP(D.parts, dt);
    C.setIntensity(D.fever > 0 ? 3 : S.combo >= 8 ? 2 : 1);
  };
  D.draw = function(x){
    var f = D.fever > 0;
    x.save(); if(D.shake > 0) x.translate(rnd(-4, 4), rnd(-4, 4));
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, f ? "#5a3a00" : "#12002e"); g.addColorStop(.7, f ? "#ffb300" : "#3a0f6a"); g.addColorStop(1, f ? "#ffe27a" : "#0a0420");
    x.fillStyle = g; x.fillRect(-10, -10, W + 20, H + 20);
    // 街（ふたつの奥行き）
    for(var l = 0; l < 2; l++){
      var sp = l ? .5 : .25, off = -(D.bx * sp) % 120;
      for(var i = -1; i < 5; i++){ var bx = off + i * 120, bh = 120 + ((i * 53 + l * 31) % 5 + 5) % 5 * 38; x.fillStyle = l ? (f ? "#b8860b" : "#1c0b4a") : (f ? "#8a6400" : "#150838");
        x.fillRect(bx, GROUND - bh, 90, bh);
        x.fillStyle = f ? "#fff2a0" : (l ? "#ff4fd8" : "#6ee7ff"); for(var w = 0; w < bh / 30; w++) for(var k = 0; k < 3; k++) if(((i * 7 + w * 3 + k) % 4) !== 0) x.fillRect(bx + 10 + k * 26, GROUND - bh + 10 + w * 30, 8, 12); }
    }
    glowRect(x, 0, GROUND, W, 3, f ? "#fff2a0" : "#6ee7ff");
    x.fillStyle = f ? "#7a5200" : "#0d0526"; x.fillRect(0, GROUND + 3, W, H - GROUND);
    D.obs.forEach(function(o){ glowRect(x, o.x, GROUND - o.y - o.h, o.w, o.h, o.type === "low" ? "#ff4fa0" : "#6ee7ff"); });
    D.coins.forEach(function(k){ x.fillStyle = "#ffe27a"; x.beginPath(); x.arc(k.x, GROUND - k.y - 12, 7, 0, 6.3); x.fill(); });
    // 走者
    var ph = D.slide > 0 ? 22 : 44, py = GROUND - D.y - ph;
    if(D.inv > 0 && Math.floor(D.inv * 12) % 2) x.globalAlpha = .4;
    glowRect(x, 64, py, 30, ph, f ? "#ffd84a" : "#7cff9a");
    x.fillStyle = "#fff"; x.fillRect(82, py + 6, 8, 6);
    accessory(x, 80, py - 8, 24); x.globalAlpha = 1;
    drawP(x, D.parts);
    if(D.flash > 0){ x.fillStyle = "rgba(255,240,160," + D.flash + ")"; x.fillRect(0, 0, W, H); }
    x.fillStyle = "#fff"; x.font = "bold 16px sans-serif"; x.textAlign = "left"; x.fillText("コンボ " + S.combo + (f ? "  🔥" : ""), 12, 96);
    x.restore();
  };

  // ===== ② スカイ・キャッスル =====
  var K = {id: "castle", icon: "🏰", name: "スカイ・キャッスル", chance: 25, dur: 60, coinRate: .8, desc: "ブロックをぴったり積んで、空の上まで お城を建てよう！",
    help: "タップでブロックを落とす。ぴったり重ねるほど高く積める！"};
  var BH = 26;
  function theme(n){ return n < 10 ? {c: "#c9bfae", d: "#8e8571", e: "🏰", sky: ["#6ec3ff", "#d9f1ff"]} : n < 20 ? {c: "#8fdc7a", d: "#4f9a43", e: "🌿", sky: ["#4aa3e8", "#bfe6ff"]} : n < 30 ? {c: "#fff0b8", d: "#d9b95a", e: "🏛️", sky: ["#1d3b8a", "#ffb46a"]} : {c: "#9fc2ff", d: "#5a7fd0", e: "🛰️", sky: ["#02021a", "#1a1a5a"]}; }
  K.init = function(){ K.blocks = [{x: 80, w: 200}]; K.cur = {x: 0, w: 200, dir: 1}; K.cam = 0; K.camT = 0; K.dead = 0; K.fall = null; K.parts = []; K.perfect = 0; K.stars = []; for(var i = 0; i < 40; i++) K.stars.push([R() * W, R() * H]); S.combo = 0; };
  K.onTap = function(){
    if(K.dead) return;
    var top = K.blocks[K.blocks.length - 1], c = K.cur, l = Math.max(top.x, c.x), r = Math.min(top.x + top.w, c.x + c.w), ov = r - l;
    if(ov <= 0){ K.dead = .9; K.fall = {x: c.x, w: c.w, y: 0, vy: 0}; C.SFX.lose(); return; }
    var perfect = Math.abs(c.x - top.x) < 6;
    if(perfect){ K.blocks.push({x: top.x, w: top.w}); S.combo++; K.perfect++; S.score += 15; C.SFX.perfect(); addP(K.parts, top.x + top.w / 2, 0, 10, "#fff2a0", 160); K.pfx = top.x + top.w / 2; }
    else { K.blocks.push({x: l, w: ov}); S.combo = 0; S.score += 10; C.SFX.drop(); }
    var n = K.blocks.length - 1; if(n % 5 === 0){ C.SFX.fan(); for(var i = 0; i < 3; i++) addP(K.parts, rnd(40, 320), 0, 18, ["#ff6ad5", "#6ee7ff", "#ffe27a"][i], 260); K.fw = .8; }
    var nw = K.blocks[K.blocks.length - 1].w; K.cur = {x: R() < .5 ? -nw : W, w: nw, dir: K.cur.x < 0 ? 1 : -1, sp: 130 + n * 7};
    K.cur.dir = K.cur.x < 0 ? 1 : -1; C.setIntensity(n > 20 ? 3 : n > 8 ? 2 : 1);
  };
  K.update = function(dt){
    var c = K.cur; c.sp = c.sp || 130;
    if(!K.dead){ c.x += c.dir * c.sp * dt; if(c.x + c.w > W + 40) c.dir = -1; if(c.x < -40) c.dir = 1; }
    else { K.dead -= dt; if(K.fall){ K.fall.vy += 1400 * dt; K.fall.y += K.fall.vy * dt; } if(K.dead <= 0) C.over = true; }
    var n = K.blocks.length; K.camT = Math.max(0, (n - 9) * BH); K.cam += (K.camT - K.cam) * Math.min(1, dt * 4);
    stepP(K.parts, dt); if(K.fw > 0) K.fw -= dt;
    S.score = Math.max(S.score, 0);
  };
  K.draw = function(x){
    var n = K.blocks.length, th = theme(n), g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    if(n >= 30){ x.fillStyle = "#fff"; K.stars.forEach(function(s){ x.fillRect(s[0], s[1], 2, 2); }); }
    var base = 580 + K.cam;
    for(var i = 0; i < K.blocks.length; i++){ var b = K.blocks[i], t = theme(i); x.fillStyle = t.c; x.fillRect(b.x, base - (i + 1) * BH, b.w, BH - 2); x.fillStyle = t.d; x.fillRect(b.x, base - (i + 1) * BH + BH - 6, b.w, 4); }
    var tb = K.blocks[n - 1]; emoji(x, th.e, tb.x + tb.w / 2, base - n * BH - 16, 28);
    if(!K.dead){ x.fillStyle = th.c; x.fillRect(K.cur.x, base - (n + 1) * BH, K.cur.w, BH - 2); }
    else if(K.fall){ x.fillStyle = th.c; x.fillRect(K.fall.x, base - (n + 1) * BH + K.fall.y, K.fall.w, BH - 2); }
    x.save(); x.translate(0, base); drawP(x, K.parts.map(function(p){ return {x: p.x, y: p.y - n * BH, t: p.t, c: p.c}; })); x.restore();
    x.fillStyle = "#fff"; x.font = "bold 18px sans-serif"; x.textAlign = "left"; x.fillText("🏗 " + (n - 1) + " 階" + (S.combo > 1 ? "　ぴったり×" + S.combo : ""), 12, 96);
  };

  // ===== ③ 100階層のポケットダンジョン =====
  var N = {id: "dungeon", icon: "🗝️", name: "100階層のポケットダンジョン", chance: 20, dur: 60, coinRate: .5, desc: "モンスターを倒して、宝箱から豪華な装備をゲット！",
    help: "上下左右にスワイプで1マス移動。ぶつかると攻撃！🎁＝宝箱 🪜＝かいだん"};
  var CS = 56, GX = 12, GY = 132, COLS = 6, ROWS = 8;
  var GEAR = [["🗡️", "さびた剣", 1, 0, 40], ["🪓", "おの", 1, 0, 25], ["🛡️", "鉄のたて", 0, 2, 40], ["🧪", "かいふく薬", 0, 3, 30], ["🏹", "ゆみ", 2, 0, 12], ["⚔️", "伝説の剣", 4, 0, 5], ["👑", "王冠", 1, 4, 5], ["🪽", "天使のつばさ", 2, 3, 5], ["🐉", "ドラゴン", 5, 3, 3]];
  N.init = function(){ N.floor = 1; N.atk = 1; N.maxhp = 6; N.hp = 6; N.gear = []; N.texts = []; N.kills = 0; N.gen(); };
  N.gen = function(){
    N.mon = []; N.chest = []; var used = {}; function free(){ var k, c, r; do{ c = Math.floor(R() * COLS); r = Math.floor(R() * ROWS); k = c + "," + r; }while(used[k]); used[k] = 1; return {c: c, r: r}; }
    N.hero = {c: Math.floor(R() * COLS), r: ROWS - 1}; used[N.hero.c + "," + N.hero.r] = 1;
    N.stairs = free(); while(N.stairs.r > 2) { used = {}; used[N.hero.c + "," + N.hero.r] = 1; N.stairs = free(); }
    used[N.stairs.c + "," + N.stairs.r] = 1;
    var mc = 3 + Math.min(4, Math.floor(N.floor / 8)), hp = 1 + Math.floor(N.floor / 14);
    for(var i = 0; i < mc; i++){ var p = free(); p.hp = Math.min(5, hp + (R() < .25 ? 1 : 0)); p.e = ["👾", "👻", "🦇", "🐍", "👹"][Math.floor(R() * 5)]; N.mon.push(p); }
    for(var j = 0; j < 2; j++) N.chest.push(free());
  };
  function say(t, c){ N.texts.push({t: t, y: 120, a: 1.4, c: c || "#fff"}); }
  function roll(){ var tot = GEAR.reduce(function(s, g){ return s + g[4]; }, 0), r = R() * tot; for(var i = 0; i < GEAR.length; i++){ r -= GEAR[i][4]; if(r <= 0) return GEAR[i]; } return GEAR[0]; }
  N.onSwipe = function(d){
    var h = N.hero, dc = d === "left" ? -1 : d === "right" ? 1 : 0, dr = d === "up" ? -1 : d === "down" ? 1 : 0;
    var nc = h.c + dc, nr = h.r + dr; if(nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return;
    var m = N.mon.filter(function(q){ return q.c === nc && q.r === nr; })[0];
    if(m){ m.hp -= N.atk; C.SFX.hit();
      if(m.hp <= 0){ N.mon.splice(N.mon.indexOf(m), 1); S.score += 3; N.kills++; say("やっつけた！", "#ffe27a"); }
      else { N.hp--; if(N.hp <= 0){ N.hp = N.maxhp; C.bonusTime -= 3; say("ダウン！ -3秒", "#ff7a9a"); C.SFX.lose(); } }
      return; }
    h.c = nc; h.r = nr;
    var ch = N.chest.filter(function(q){ return q.c === nc && q.r === nr; })[0];
    if(ch){ N.chest.splice(N.chest.indexOf(ch), 1); var g = roll(); N.atk = Math.min(10, N.atk + g[2]); N.maxhp += g[3]; N.hp = Math.min(N.maxhp, N.hp + g[3] + 1); N.gear.push(g[0]); if(N.gear.length > 8) N.gear.shift();
      S.score += 5 + (g[4] <= 5 ? 20 : g[4] <= 15 ? 8 : 0); say((g[4] <= 5 ? "✨ 超レア！ " : g[4] <= 15 ? "レア！ " : "") + g[0] + " " + g[1], g[4] <= 5 ? "#ff9bff" : "#fff"); g[4] <= 5 ? C.SFX.fan() : C.SFX.coin(); }
    if(nc === N.stairs.c && nr === N.stairs.r){ N.floor++; S.score += 10; C.SFX.perfect(); say("B" + N.floor + "F へ！", "#6ee7ff"); N.gen(); }
    C.setIntensity(N.floor > 6 ? 3 : N.floor > 2 ? 2 : 1);
  };
  N.update = function(dt){ N.texts.forEach(function(t){ t.a -= dt; t.y -= 14 * dt; }); N.texts = N.texts.filter(function(t){ return t.a > 0; }); };
  N.draw = function(x){
    x.fillStyle = "#14102a"; x.fillRect(0, 0, W, H);
    for(var r = 0; r < ROWS; r++) for(var c = 0; c < COLS; c++){ x.fillStyle = (r + c) % 2 ? "#221a45" : "#1b1438"; x.fillRect(GX + c * CS, GY + r * CS, CS - 2, CS - 2); }
    emoji(x, "🪜", GX + N.stairs.c * CS + CS / 2, GY + N.stairs.r * CS + CS / 2, 34);
    N.chest.forEach(function(q){ emoji(x, "🎁", GX + q.c * CS + CS / 2, GY + q.r * CS + CS / 2, 34); });
    N.mon.forEach(function(q){ var px = GX + q.c * CS + CS / 2, py = GY + q.r * CS + CS / 2; emoji(x, q.e, px, py, 36); x.fillStyle = "#ff5a7a"; x.fillRect(px - 16, py + 18, 32 * q.hp / 5, 4); });
    var hx = GX + N.hero.c * CS + CS / 2, hy = GY + N.hero.r * CS + CS / 2; emoji(x, "🧙", hx, hy, 36); accessory(x, hx, hy - 24, 18);
    x.fillStyle = "#fff"; x.font = "bold 15px sans-serif"; x.textAlign = "left";
    x.fillText("B" + N.floor + "F / 100　❤ " + N.hp + "/" + N.maxhp + "　⚔ " + N.atk, 12, 96);
    x.font = "22px sans-serif"; x.fillText(N.gear.join(" "), 12, 122);
    N.texts.forEach(function(t){ x.globalAlpha = clamp(t.a, 0, 1); x.fillStyle = t.c; x.font = "bold 20px sans-serif"; x.textAlign = "center"; x.fillText(t.t, W / 2, GY + 8 * CS + 30 + (t.y - 120) * .3); }); x.globalAlpha = 1;
  };

  // ===== ④ 電波ビート・ウェーブ =====
  var B = {id: "beat", icon: "🏄", name: "電波ビート・ウェーブ", chance: 20, dur: 45, coinRate: .6, desc: "長押しして、ビートに合わせて はなす！ 大ジャンプで空中回転！",
    help: "長押しして、光の輪が ○ に重なったら はなす！"};
  var HITX = 90, SPD = 230;
  B.init = function(){ B.marks = []; for(var k = 0; k < 40; k++) B.marks.push({t: 1.6 + k * 1.05, done: 0}); B.hold = false; B.hs = 0; B.trick = 0; B.parts = []; B.label = ""; B.lt = 0; S.combo = 0; B.aur = 0; };
  B.onDown = function(){ B.hold = true; B.hs = C.time(); };
  B.onUp = function(){
    if(!B.hold) return; B.hold = false; var now = C.time(), hd = now - B.hs;
    var m = B.marks.filter(function(q){ return !q.done && Math.abs(q.t - now) < .2; }).sort(function(a, b){ return Math.abs(a.t - now) - Math.abs(b.t - now); })[0];
    if(!m || hd < .1){ C.SFX.drop(); return; }
    var d = Math.abs(m.t - now); m.done = d < .07 ? 2 : 1;
    S.combo++; S.score += (d < .07 ? 100 : 50) * (1 + Math.floor(S.combo / 5) * .5); B.label = d < .07 ? "PERFECT!" : "GOOD"; B.lt = .6; B.trick = .7; d < .07 ? C.SFX.perfect() : C.SFX.good();
    addP(B.parts, HITX, 480, d < .07 ? 26 : 12, ["#6ee7ff", "#ff9bff", "#fff2a0"][Math.floor(R() * 3)], 280);
    C.setIntensity(S.combo >= 10 ? 3 : S.combo >= 3 ? 2 : 1);
  };
  B.update = function(dt){
    var now = C.time();
    B.marks.forEach(function(q){ if(!q.done && q.t < now - .2){ q.done = -1; S.combo = 0; B.label = "MISS"; B.lt = .5; C.setIntensity(1); } });
    if(B.trick > 0) B.trick -= dt; if(B.lt > 0) B.lt -= dt; stepP(B.parts, dt);
    B.aur += ((Math.min(1, S.combo / 14)) - B.aur) * dt * 2;
  };
  B.draw = function(x){
    var now = C.time(), g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#050520"); g.addColorStop(1, "#0b3a5a"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for(var a = 0; a < 3; a++){ x.strokeStyle = ["rgba(110,255,200,", "rgba(255,120,255,", "rgba(110,200,255,"][a] + (.12 + B.aur * .45) + ")"; x.lineWidth = 26; x.beginPath();
      for(var i = 0; i <= 18; i++){ var px = i * 20, py = 150 + a * 46 + Math.sin(now * 1.2 + i * .5 + a) * 24; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    // 波（電波）
    function wy(px, ph){ return 500 + Math.sin(px * .03 + now * 3 + ph) * 18; }
    for(var l = 0; l < 3; l++){ x.fillStyle = ["#0e5a8a", "#117ab0", "#1aa0d8"][l]; x.beginPath(); x.moveTo(0, H); for(var q = 0; q <= W; q += 8) x.lineTo(q, wy(q, l * 1.3) + l * 14); x.lineTo(W, H); x.fill(); }
    // 判定の輪
    x.strokeStyle = "#fff"; x.lineWidth = 3; x.beginPath(); x.arc(HITX, 440, 26, 0, 6.3); x.stroke();
    B.marks.forEach(function(q){
      var mx = HITX + (q.t - now) * SPD; if(mx > W + 30 || mx < -30 || q.done > 0) return;
      x.globalAlpha = q.done < 0 ? .3 : 1; x.fillStyle = "#ff9bff"; x.shadowColor = "#ff9bff"; x.shadowBlur = 14; x.beginPath(); x.arc(mx, 440, 14, 0, 6.3); x.fill(); x.shadowBlur = 0; x.globalAlpha = 1; });
    // 長押しのリング
    if(B.hold){ var hd = now - B.hs, rr = Math.max(10, 52 - hd * 70); x.strokeStyle = "#6ee7ff"; x.lineWidth = 4; x.beginPath(); x.arc(HITX, 440, rr, 0, 6.3); x.stroke(); }
    // サーファー
    var jump = B.trick > 0 ? Math.sin((1 - B.trick / .7) * 3.14) * 140 : 0, rot = B.trick > 0 ? (1 - B.trick / .7) * 6.28 : 0, squat = B.hold ? 8 : 0;
    emoji(x, "🏄", HITX, wy(HITX, 0) - 24 - jump + squat, 40, rot); accessory(x, HITX, wy(HITX, 0) - 52 - jump + squat, 16);
    drawP(x, B.parts);
    if(B.lt > 0){ x.globalAlpha = clamp(B.lt * 2, 0, 1); x.fillStyle = B.label === "MISS" ? "#ff7a9a" : "#fff2a0"; x.font = "bold 30px sans-serif"; x.textAlign = "center"; x.fillText(B.label, W / 2, 330); x.globalAlpha = 1; }
    x.fillStyle = "#fff"; x.font = "bold 16px sans-serif"; x.textAlign = "left"; x.fillText("コンボ " + S.combo, 12, 96);
  };

  // ===== ⑤ ゴールデン・フィーバー（超激レア） =====
  var F = {id: "fever", icon: "🤑", name: "ゴールデン・フィーバー", chance: 10, dur: 30, coinRate: 2, desc: "降りそそぐコインと宝石を、スワイプで集めまくれ！（コイン2倍）",
    help: "ゆびを左右にスライドして、コインと宝石をキャッチ！"};
  F.init = function(){ F.items = []; F.bx = W / 2; F.tx = W / 2; F.parts = []; F.acc = 0; F.pile = []; S.combo = 0; F.n = 0; C.setIntensity(3); };
  F.onDown = F.onMove = function(px){ F.tx = clamp(px, 40, W - 40); };
  F.update = function(dt){
    F.bx += (F.tx - F.bx) * Math.min(1, dt * 14);
    var rate = 8 + C.time() * .3; F.acc += dt * rate;
    while(F.acc > 1){ F.acc--; var r = R(); F.items.push({x: rnd(16, W - 16), y: -20, vy: rnd(240, 420), t: r < .04 ? 2 : r < .28 ? 1 : 0}); }
    F.items.forEach(function(it){
      it.y += it.vy * dt; var dx = F.bx - it.x; if(Math.abs(dx) < 90 && it.y > 440) it.x += dx * Math.min(1, dt * 5);
      if(!it.got && it.y > 540 && it.y < 600 && Math.abs(it.x - F.bx) < 48){ it.got = true; var v = [1, 5, 25][it.t]; S.score += v; F.n++; S.combo = F.n; C.SFX.coin(); addP(F.parts, it.x, 560, it.t ? 8 : 3, it.t ? "#9ff4ff" : "#ffe27a", 160);
        if(F.pile.length < 260) F.pile.push([rnd(0, W), rnd(0, 1)]); }
    });
    F.items = F.items.filter(function(it){ return it.y < H + 30 && !it.got; }); stepP(F.parts, dt);
  };
  F.draw = function(x){
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3a1a00"); g.addColorStop(1, "#b36b00"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var t = C.time(); x.fillStyle = "rgba(255,240,160,.7)"; for(var i = 0; i < 30; i++) x.fillRect((i * 97 + t * 40) % W, (i * 53 + t * 90) % H, 2, 2);
    var ph = Math.min(260, F.pile.length); F.pile.forEach(function(p, i){ x.fillStyle = i % 3 ? "#ffd84a" : "#ffb300"; x.beginPath(); x.ellipse(p[0], H - 6 - p[1] * ph * .9, 9, 5, 0, 0, 6.3); x.fill(); });
    F.items.forEach(function(it){ if(it.t === 0){ x.fillStyle = "#ffe27a"; x.beginPath(); x.ellipse(it.x, it.y, 9, 11, 0, 0, 6.3); x.fill(); x.strokeStyle = "#b8860b"; x.lineWidth = 2; x.stroke(); } else emoji(x, it.t === 2 ? "👑" : "💎", it.x, it.y, it.t === 2 ? 30 : 24); });
    emoji(x, "🧲", F.bx, 560, 46); accessory(x, F.bx, 528, 18);
    drawP(x, F.parts);
    x.fillStyle = "#fff"; x.font = "bold 16px sans-serif"; x.textAlign = "left"; x.fillText("ゲット " + F.n + " こ", 12, 96);
  };

  [D, K, N, B, F].forEach(function(g){ C.register(g); });
})();
