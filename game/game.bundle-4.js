"use strict";
/* 自動生成: node tools/build-game.js （直接編集しない）  束 4 / 4 */

/* ==== game/shooter2.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[30]=1;
"use strict";
// ===== AREシューティング（作り直し）：ノイズ射的 ～ねらって うて！～ =====
// 的（ノイズ）を ねらって うつ 的あて シューティング。3ステージ ＋ ボス（玲也・悪魔・？？？）。
// 操作：🖥️ マウスで ねらって クリック／スペース＝うつ　R＝リロード　B＝ボム　矢印・WASD＝ねらいを うごかす
//       📱 タップ＝その場所を うつ　🎮 左スティック／十字＝ねらい　A・ZR・R＝うつ　B・ZL・L＝リロード　X・Y＝ボム　−/＋＝やめる
const PK_SH_IMG = {};
function pkShImg(n){ if(!PK_SH_IMG[n]){ const im = new Image(); im.src = "./img/" + n + ".webp"; PK_SH_IMG[n] = im; } return PK_SH_IMG[n]; }
const PK_SH_BOSS = [{img:"reiya", n:"玲也", e:"😈", say:"ひひひ…ねらえるもんなら ねらってみろ〜！"}, {img:"akuma", n:"悪魔", e:"🌹", say:"ふふ…わたしの バラを うちぬける？"}, {img:"unknown", n:"？？？", e:"👤", say:"…すべての へんじを、ここで うけとめよう。"}];
const PK_SH_CFG = {
    easy:{gap:1.0, life:2.4, lives:5, friend:0.08, chase:0.06, boss:[14, 20, 28], bgap:1.8, wave:18, mag:12},
    normal:{gap:0.78, life:1.8, lives:4, friend:0.13, chase:0.10, boss:[20, 30, 42], bgap:1.4, wave:18, mag:10},
    hard:{gap:0.58, life:1.4, lives:3, friend:0.18, chase:0.15, boss:[28, 42, 60], bgap:1.0, wave:18, mag:8}
};
pkShNew = function(did, token){
    const d = PK_SHOOT.difficulty_levels.find((x) => x.id === did) || PK_SHOOT.difficulty_levels[0], c = PK_SH_CFG[d.id];
    PK_SH_BOSS.forEach((b) => pkShImg(b.img)); pkShImg("yuzai");
    return {id:"CAS005", diff:d.id, d, cfg:c, phase:"ready", token, keys:{}, ax:320, ay:180, lives:c.lives, score:0, kills:0, shots:0, hits:0, combo:0, maxc:0, ammo:c.mag, reload:0, bombs:1, stage:1, st:0, mode:"wave", foes:[], pops:[], boss:null, t:0, sp:0.6, banner:{text:"STAGE 1", t:1.6}, flash:0, hurt:0, last:0, cleared:0, res:null};
};
pkShBegin = function(){ const g = G.pk.game; if(!g || g.id !== "CAS005" || g.phase !== "ready") return; g.phase = "play"; g.last = performance.now(); G.pk.raf = requestAnimationFrame(pkShLoop); render(); };
function pkShPop(g, x, y, text, col){ g.pops.push({x, y, text, col:col || "#fff", t:0.8}); }
function pkShSpawn(g, kind){
    const c = g.cfg, x = 50 + G.rnd() * (PK_SH.W - 100), y = 50 + G.rnd() * (PK_SH.H - 100);
    if(kind === "noise") g.foes.push({kind, x, y, r:22, e:["👾", "🍙", "💾", "🐟", "🦠"][Math.floor(G.rnd() * 5)] , life:c.life * (0.85 + G.rnd() * 0.4), age:0, hp:1, pts:10, vx:(G.rnd() - 0.5) * 50, vy:(G.rnd() - 0.5) * 30});
    else if(kind === "gold") g.foes.push({kind, x, y, r:18, e:"⭐", life:c.life * 0.6, age:0, hp:1, pts:50, vx:(G.rnd() < 0.5 ? -1 : 1) * 130, vy:(G.rnd() - 0.5) * 60});
    else if(kind === "friend") g.foes.push({kind, x, y, r:22, e:G.rnd() < 0.5 ? "🐱" : "🐶", life:c.life * 1.1, age:0, hp:1, pts:0, vx:0, vy:0, img:G.rnd() < 0.3 ? "yuzai" : null});
    else if(kind === "chase") g.foes.push({kind, x, y, r:12, e:"😈", life:2.6 + (c.life - 1.4) * 0.3, age:0, hp:1, pts:25, vx:0, vy:0, grow:true});
    else if(kind === "bomb") g.foes.push({kind, x, y, r:20, e:"🎁", life:c.life * 1.2, age:0, hp:1, pts:20, vx:0, vy:0});
}
function pkShFire(g){
    if(!g || g.phase !== "play" || g.banner.t > 0.9 && g.banner.big) return;
    if(g.reload > 0) return;
    if(g.ammo <= 0){ g.reload = 0.9; return; }
    g.ammo--; g.shots++; g.flash = 0.08; pkBeep(520 + G.rnd() * 60, 0.03, 0.03);
    // うしろ（あとから でた もの）を さきに あてる
    const x = g.ax, y = g.ay; let hit = null;
    for(let i = g.foes.length - 1; i >= 0; i--){ const f = g.foes[i]; if(Math.hypot(f.x - x, f.y - y) <= f.r + 4){ hit = f; break; } }
    if(hit){ pkShHit(g, hit); return; }
    if(g.boss){ const b = g.boss; if(Math.abs(x - b.x) < b.w / 2 && Math.abs(y - b.y) < b.h / 2){ const head = y < b.y - b.h * 0.22; b.hp -= head ? 3 : 1; g.hits++; g.combo++; g.maxc = Math.max(g.maxc, g.combo); g.score += head ? 30 : 10; b.shake = 0.15; pkShPop(g, x, y, head ? "HEAD! -3" : "-1", head ? "#ffe066" : "#fff"); pkBeep(head ? 880 : 660, 0.05, 0.04); return; } }
    g.combo = 0; pkShPop(g, x, y, "MISS", "#9aa");
    if(g.ammo <= 0) g.reload = 0.9;
}
function pkShHit(g, f){
    g.hits++; const i = g.foes.indexOf(f);
    if(f.kind === "friend"){ g.foes.splice(i, 1); g.combo = 0; g.score = Math.max(0, g.score - 30); g.lives--; g.hurt = 0.4; pkShPop(g, f.x, f.y, "ともだち！ ダメ！", "#ff8a8a"); pkBeep(140, 0.15, 0.05); return; }
    g.foes.splice(i, 1); g.combo++; g.maxc = Math.max(g.maxc, g.combo); g.kills++;
    const mul = 1 + Math.min(4, Math.floor(g.combo / 5)), pts = f.pts * mul; g.score += pts; pkShPop(g, f.x, f.y, "+" + pts, f.kind === "gold" ? "#ffe066" : "#7dffb0"); pkBeep(f.kind === "gold" ? 980 : 760, 0.05, 0.04);
    if(f.kind === "bomb"){ g.bombs = Math.min(3, g.bombs + 1); g.ammo = g.cfg.mag; pkShPop(g, f.x, f.y - 22, "ボム ＋1 ・ 弾 かいふく", "#9ad1ff"); }
}
function pkShBomb(g){
    if(!g || g.phase !== "play" || g.bombs <= 0) return; g.bombs--; g.flash = 0.35; pkBeep(200, 0.25, 0.06);
    g.foes.filter((f) => f.kind === "noise" || f.kind === "chase" || f.kind === "gold").forEach((f) => { g.kills++; g.score += f.pts; pkShPop(g, f.x, f.y, "+" + f.pts, "#ffb86b"); });
    g.foes = g.foes.filter((f) => !(f.kind === "noise" || f.kind === "chase" || f.kind === "gold"));
    if(g.boss) g.boss.hp -= 5;
}
pkShStep = function(g, dt){
    const c = g.cfg; g.t += dt;
    if(g.banner.t > 0) g.banner.t -= dt;
    g.flash = Math.max(0, g.flash - dt); g.hurt = Math.max(0, g.hurt - dt);
    // ねらいの いどう（キー）
    let dx = 0, dy = 0; if(g.keys.left) dx--; if(g.keys.right) dx++; if(g.keys.up) dy--; if(g.keys.down) dy++;
    if(g.pad){ dx += g.pad.x; dy += g.pad.y; }
    if(dx || dy){ const n = Math.max(1, Math.hypot(dx, dy)); g.ax = Math.max(6, Math.min(PK_SH.W - 6, g.ax + dx / n * 330 * dt)); g.ay = Math.max(6, Math.min(PK_SH.H - 6, g.ay + dy / n * 330 * dt)); }
    // リロード
    if(g.reload > 0){ g.reload -= dt; if(g.reload <= 0){ g.ammo = c.mag; g.reload = 0; pkBeep(400, 0.06, 0.03); } }
    // てきの しゅつげん
    if(g.banner.t <= 0.9 || !g.banner.big){
        if(g.mode === "wave"){
            g.st += dt; g.sp -= dt;
            if(g.sp <= 0){
                g.sp = c.gap * (0.75 + G.rnd() * 0.5) * (1 - Math.min(0.3, (g.stage - 1) * 0.12));
                const r = G.rnd();
                const kind = r < c.friend ? "friend" : r < c.friend + c.chase ? "chase" : r < c.friend + c.chase + 0.07 ? "gold" : r < c.friend + c.chase + 0.11 ? "bomb" : "noise";
                pkShSpawn(g, kind);
                if(g.stage >= 2 && G.rnd() < 0.35) pkShSpawn(g, "noise");
            }
            if(g.st >= c.wave){ g.mode = "boss"; const B = PK_SH_BOSS[g.stage - 1], hp = c.boss[g.stage - 1]; g.foes = g.foes.filter((f) => f.kind === "chase"); g.boss = {x:PK_SH.W / 2, y:150, w:120, h:150, hp, max:hp, dir:1, fire:1.2, ph:0, shake:0, B}; g.banner = {text:"BOSS  " + B.n, t:2.0, big:1, sub:B.say}; }
        }else if(g.boss){
            const b = g.boss; b.ph += dt; b.shake = Math.max(0, b.shake - dt);
            b.x = PK_SH.W / 2 + Math.sin(b.ph * (0.9 + g.stage * 0.25)) * (170 + g.stage * 25); b.y = 150 + Math.sin(b.ph * 1.7) * 36;
            b.fire -= dt; if(b.fire <= 0){ b.fire = c.bgap * (1 - (1 - b.hp / b.max) * 0.35); const n = b.hp < b.max / 2 && g.stage >= 2 ? 2 : 1; for(let k = 0; k < n; k++){ g.foes.push({kind:"chase", x:b.x + (k - (n - 1) / 2) * 60, y:b.y + 40, r:12, e:"💢", life:2.4, age:0, hp:1, pts:25, vx:(G.rnd() - 0.5) * 80, vy:60, grow:true}); } if(G.rnd() < 0.25) pkShSpawn(g, "friend"); }
            if(b.hp <= 0){ pkShBossDown(g); }
        }
    }
    // てきの うごき・じかん
    g.foes.forEach((f) => {
        f.age += dt; f.x += f.vx * dt; f.y += f.vy * dt; if(f.x < 20 || f.x > PK_SH.W - 20) f.vx = -f.vx; if(f.y < 30 || f.y > PK_SH.H - 40) f.vy = -f.vy;
        if(f.grow) f.r = 12 + 34 * Math.min(1, f.age / f.life);
    });
    const gone = g.foes.filter((f) => f.age >= f.life);
    gone.forEach((f) => { if(f.kind === "chase"){ g.lives--; g.hurt = 0.5; g.combo = 0; pkShPop(g, f.x, Math.min(f.y, PK_SH.H - 40), "やられた！", "#ff8a8a"); pkBeep(120, 0.2, 0.05); } else if(f.kind === "noise"){ g.combo = 0; } });
    g.foes = g.foes.filter((f) => f.age < f.life);
    g.pops.forEach((p) => { p.t -= dt; p.y -= 24 * dt; }); g.pops = g.pops.filter((p) => p.t > 0);
    if(g.lives <= 0) pkShEnd(g, false);
};
function pkShBossDown(g){
    g.score += 200 * g.stage + g.lives * 20; g.cleared++; g.foes = []; g.boss = null; g.combo = 0;
    if(g.stage >= 3){ pkShEnd(g, true); return; }
    g.stage++; g.mode = "wave"; g.st = 0; g.sp = 1.2; g.ammo = g.cfg.mag; g.reload = 0; g.bombs = Math.min(3, g.bombs + 1); g.banner = {text:"STAGE " + g.stage, t:1.8, big:1, sub:"CLEAR！ ボム ＋1"};
}
pkShLoop = function(now){
    const u = G.pk; u.raf = 0; const g = u.game; if(!g || g.id !== "CAS005" || g.phase !== "play" || G.mode !== "pack") return;
    const dt = Math.min(0.05, (now - g.last) / 1000); g.last = now; pkShStep(g, dt); if(g.phase !== "play") return; pkShDraw(g);
    u.raf = requestAnimationFrame(pkShLoop);
};
pkShCalc = function(g, cleared){
    const k = {easy:1, normal:2, hard:4}[g.diff], clr = {easy:15, normal:40, hard:100}[g.diff];
    const acc = g.shots ? g.hits / g.shots : 0, accB = g.shots >= 20 && acc >= 0.7 ? g.kills : 0;
    return {coins:g.kills * k + g.cleared * clr + (cleared ? clr * 2 + g.lives * 10 : 0) + accB, cleared, acc, accB};
};
pkShEnd = function(g, cleared){
    if(g.phase !== "play") return; g.phase = "end"; const r = pkShCalc(g, cleared); g.res = r;
    pkCasFinish("CAS005", {coins:r.coins, score:g.score, high:cleared && g.diff === "hard"}); render();
};
pkShAfter = function(g){
    if(g.phase === "play"){ if(!G.pk.raf) G.pk.raf = requestAnimationFrame(pkShLoop); }
    const cv = $("pkCv"); if(cv && !cv._b2){ cv._b2 = 1;
        const at = (e) => { const r = cv.getBoundingClientRect(); g.ax = Math.max(0, Math.min(PK_SH.W, (e.clientX - r.left) / r.width * PK_SH.W)); g.ay = Math.max(0, Math.min(PK_SH.H, (e.clientY - r.top) / r.height * PK_SH.H)); };
        cv.addEventListener("pointermove", (e) => { if(g.phase === "play") at(e); });
        cv.addEventListener("pointerdown", (e) => { e.preventDefault(); if(g.phase !== "play") return; at(e); pkShFire(g); });
        cv.addEventListener("contextmenu", (e) => { e.preventDefault(); if(g.phase === "play") pkShBomb(g); });
    }
    pkShDraw(g);
};
document.addEventListener("keydown", (e) => {
    if(G.mode !== "pack" || !G.pk || !G.pk.game || G.pk.game.id !== "CAS005" || G.pk.game.phase !== "play" || e.repeat) return; const g = G.pk.game;
    if(e.key === " "){ e.preventDefault(); e.stopPropagation(); pkShFire(g); }
    else if(e.key === "r" || e.key === "R"){ if(g.reload <= 0 && g.ammo < g.cfg.mag){ g.reload = 0.9; } }
    else if(e.key === "b" || e.key === "B"){ pkShBomb(g); }
}, true);
// ---- 画面
function pkShDraw(g){
    const cv = $("pkCv"); if(!cv) return; const x = cv.getContext("2d"), W = PK_SH.W, H = PK_SH.H, st = g.stage;
    const sky = [["#12306b", "#2b6cb0"], ["#0c2a3f", "#0a5b6b"], ["#140a2e", "#3b1260"]][st - 1];
    const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(255,255,255,.07)"; for(let i = 0; i < 14; i++){ const sx = ((i * 83 - g.t * (6 + i % 4 * 4)) % W + W) % W, sy = 20 + (i * 47) % 200; x.beginPath(); x.arc(sx, sy, 10 + i % 3 * 6, 0, 7); x.fill(); }
    x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, H - 34, W, 34);          // たな
    x.textAlign = "center"; x.textBaseline = "middle";
    // ボス
    if(g.boss){ const b = g.boss, im = pkShImg(b.B.img), sh = b.shake > 0 ? (G.rnd() - 0.5) * 8 : 0;
        if(im.complete && im.naturalWidth){ const h = b.h + 10, w = h * im.naturalWidth / im.naturalHeight; if(typeof tqIsFramed === "function" && tqIsFramed(b.B.img)) tqDrawFramed(x, im, b.x + sh, b.y, h); else x.drawImage(im, b.x - w / 2 + sh, b.y - h / 2, w, h); b.w = Math.max(70, w * 0.8); }
        else{ x.font = "84px serif"; x.fillText(b.B.e, b.x + sh, b.y); b.w = 100; }
        x.fillStyle = "#333"; x.fillRect(180, 8, 280, 9); x.fillStyle = b.hp / b.max > 0.3 ? "#f87171" : "#fbbf24"; x.fillRect(180, 8, 280 * Math.max(0, b.hp) / b.max, 9);
        x.fillStyle = "#fff"; x.font = "bold 12px sans-serif"; x.fillText(b.B.n + "（あたま ＝ 3ダメージ）", W / 2, 28); }
    // 的
    g.foes.forEach((f) => {
        const k = f.kind, life = 1 - f.age / f.life, pop = Math.min(1, f.age / 0.12);
        x.save(); x.translate(f.x, f.y); x.scale(0.4 + 0.6 * pop, 0.4 + 0.6 * pop);
        x.fillStyle = k === "friend" ? "rgba(120,200,255,.35)" : k === "gold" ? "rgba(255,220,80,.45)" : k === "chase" ? "rgba(255,80,80,.35)" : k === "bomb" ? "rgba(120,160,255,.4)" : "rgba(255,255,255,.22)";
        x.beginPath(); x.arc(0, 0, f.r + 2, 0, 7); x.fill();
        x.strokeStyle = k === "friend" ? "#7cc7ff" : "#fff"; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, f.r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, life)); x.stroke();
        const im = f.img ? pkShImg(f.img) : null;
        if(im && im.complete && im.naturalWidth){ const h = f.r * 2; x.drawImage(im, -h * im.naturalWidth / im.naturalHeight / 2, -h / 2, h * im.naturalWidth / im.naturalHeight, h); }
        else{ x.font = Math.round(f.r * 1.5) + "px serif"; x.fillStyle = "#fff"; x.fillText(f.e, 0, 2); }
        if(k === "friend"){ x.font = "bold 11px sans-serif"; x.fillStyle = "#cfe9ff"; x.fillText("うたない！", 0, f.r + 14); }
        x.restore();
    });
    // ポップ
    x.font = "bold 14px sans-serif"; g.pops.forEach((p) => { x.globalAlpha = Math.min(1, p.t * 2); x.fillStyle = p.col; x.fillText(p.text, p.x, p.y); }); x.globalAlpha = 1;
    // バナー
    if(g.banner.t > 0){ x.fillStyle = "rgba(0,0,0,.45)"; x.fillRect(0, H / 2 - 44, W, 88); x.fillStyle = "#fff"; x.font = "bold 34px sans-serif"; x.fillText(g.banner.text, W / 2, H / 2 - 10); if(g.banner.sub){ x.font = "14px sans-serif"; x.fillText(g.banner.sub, W / 2, H / 2 + 26); } }
    // ねらい
    x.strokeStyle = g.reload > 0 ? "#ffb347" : "#ff4d4d"; x.lineWidth = 2; x.beginPath(); x.arc(g.ax, g.ay, 15, 0, 7); x.moveTo(g.ax - 22, g.ay); x.lineTo(g.ax - 6, g.ay); x.moveTo(g.ax + 6, g.ay); x.lineTo(g.ax + 22, g.ay); x.moveTo(g.ax, g.ay - 22); x.lineTo(g.ax, g.ay - 6); x.moveTo(g.ax, g.ay + 6); x.lineTo(g.ax, g.ay + 22); x.stroke();
    if(g.flash > 0){ x.fillStyle = "rgba(255,255,255," + Math.min(0.5, g.flash * 3) + ")"; x.fillRect(0, 0, W, H); }
    if(g.hurt > 0){ x.fillStyle = "rgba(255,0,0," + Math.min(0.35, g.hurt) + ")"; x.fillRect(0, 0, W, H); }
    // HUD
    x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = "#fff"; x.font = "bold 14px sans-serif";
    x.fillText("SCORE " + g.score + "　STAGE " + g.stage + "/3　" + (g.mode === "wave" ? "あと " + Math.max(0, Math.ceil(g.cfg.wave - g.st)) + "秒でボス" : "BOSS！") + "　COMBO " + g.combo, 8, H - 18);
    x.fillText("❤️×" + g.lives + "　💣×" + g.bombs + "　" + (g.reload > 0 ? "リロード中…" : "弾 " + "●".repeat(g.ammo) + "○".repeat(Math.max(0, g.cfg.mag - g.ammo))), 8, H - 4);
};
pkShView = function(g){
    if(g.phase === "ready") return '<div class="card"><b>' + esc(g.d.name) + '</b><div class="meta">ノイズの 的を ねらって うつ「ノイズ射的」！ 3ステージ すすむと、各ステージの さいごに ボス（玲也・悪魔・？？？）が あらわれるよ。<br>' +
        '🖥️ <b>マウス</b>で ねらって クリック（スペースでも うてる）／<b>R</b>＝リロード／<b>B</b>（右クリック）＝ボム／矢印・WASD＝ねらいを うごかす<br>📱 ねらった ところを <b>タップ</b>　🎮 <b>左スティック・十字</b>で ねらい／<b>A・ZR・R</b>＝うつ／<b>B・ZL・L</b>＝リロード／<b>X・Y</b>＝ボム／<b>−・＋</b>＝やめる<br>' +
        '⭐ きんいろの 的＝50てん　🎁 ボム＋弾かいふく　😈 だんだん 大きくなる ノイズ＝おおきくなる まえに うて！（うちもらすと ダメージ）　🐱🐶 ともだちは うっちゃダメ！<br>れんぞく命中で コンボ倍率アップ。ごほうび：たおした 数 × ' + ({easy:1, normal:2, hard:4}[g.diff]) + ' ＋ ステージクリア ＋ めいちゅうりつ70%以上で ボーナス</div><div class="row">' + pkBtn("スタート！", "sgo") + '</div></div>';
    if(g.phase === "end"){ const r = g.res; return '<div class="card"><h3>' + (r.cleared ? "ぜんステージ クリア！" : "ゲームオーバー…（STAGE " + g.stage + "）") + '</h3><div>スコア ' + g.score + '　たおした数 ' + g.kills + '　めいちゅうりつ ' + Math.round(r.acc * 100) + '%　さいだいコンボ ' + g.maxc + '</div><div class="okc">🪙 ' + pkNum(r.coins) + ' コイン' + (r.accB ? '（めいちゅうボーナス ＋' + r.accB + '）' : '') + '</div><div class="row">' + pkBtn("もういちど", "cagain") + pkBtn("カジノへ もどる", "cend", {sub:1}) + '</div></div>'; }
    return '<canvas id="pkCv" width="640" height="360" style="width:100%;border-radius:1cqw;touch-action:none;cursor:crosshair"></canvas>';
};
// ---- コントローラー（ゲーム中だけ 専用の入力にする）
(function(){
    window.TQ_PAD = window.TQ_PAD || {};
    const prev = window.TQ_PAD.game;
    window.TQ_PAD.game = function(down, edge, ax, dt){
        const g = G.mode === "pack" && G.pk && G.pk.game; if(!g || g.phase !== "play") return prev ? prev(down, edge, ax, dt) : false;
        if(g.id === "CAS004"){                                    // AREの達人：A＝ドン　B＝カッ　L・R・ZL・ZR＝連打　−/＋＝やめる
            if(edge[8] || edge[9]){ pkCasAbort(); G.pk.game = null; render(); return true; }
            if(edge[1]) pkRhHit("don");
            if(edge[0]) pkRhHit("ka");
            if(edge[4] || edge[5] || edge[6] || edge[7]) pkRhHit("rap");
            return true;
        }
        if(g.id !== "CAS005") return prev ? prev(down, edge, ax, dt) : false;
        if(edge[8] || edge[9]){ pkCasAbort(); G.pk.game = null; render(); return true; }
        const dz = (v) => Math.abs(v) < 0.18 ? 0 : v;
        let x = dz(ax.lx) + dz(ax.rx), y = dz(ax.ly) + dz(ax.ry); if(down[14]) x -= 1; if(down[15]) x += 1; if(down[12]) y -= 1; if(down[13]) y += 1;
        g.pad = {x:Math.max(-1, Math.min(1, x)), y:Math.max(-1, Math.min(1, y))};
        if(edge[1] || edge[7] || edge[5]) pkShFire(g);
        if(edge[0] || edge[6] || edge[4]){ if(g.reload <= 0 && g.ammo < g.cfg.mag) g.reload = 0.9; }
        if(edge[2] || edge[3]) pkShBomb(g);
        return true;
    };
})();


/* ==== game/bgm.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[31]=1;
"use strict";
// ===== BGM（音楽）：場所・戦闘ごとに 10曲。ずっと ループ再生 =====
// 音楽ファイルは game/bgm/ に、下の名前の mp3 を置いてください（まだ無い曲は、無音のまま進みます）。
// 一覧は game/bgm/BGMリスト.txt にも書いてあります。
const TQ_BGM = {
    opening:     {file:"opening.mp3",     n:"オープニング（タイトル画面・プロフィールなど）"},
    ending:      {file:"ending.mp3",      n:"エンディング（スタッフクレジットが曲に合わせて流れます。1回だけ）"},
    save:        {file:"save.mp3",        n:"セーブ音（冒険の書に記録したとき。1回だけ）", se:true},
    field:       {file:"field.mp3",       n:"フィールド（野や道・おまけの体験会）"},
    town:        {file:"town.mp3",        n:"街（ホシミ台・アカリ市・ラボ・クリスマス）"},
    sea:         {file:"sea.mp3",         n:"海（第2層 ノイズの海ぞこ）"},
    cave:        {file:"cave.mp3",        n:"洞窟・研究室（ちいさな研究室・秘密基地）"},
    castle:      {file:"castle.mp3",      n:"城・塔（運命開発ビル・まっしろルーム・ARE タワー・サーバー城）"},
    demoncastle: {file:"demoncastle.mp3", n:"魔王城（第4層 ノイズ王国）"},
    mainbattle:  {file:"mainbattle.mp3",  n:"通常戦闘曲"},
    midboss:     {file:"midboss.mp3",     n:"中ボス戦闘曲（ふつうのボス）"},
    lastboss:    {file:"lastboss.mp3",    n:"ラスボス戦闘曲（ぬいぐるみ王・ノイズ・オメガ）"},
    secretboss:  {file:"secretboss.mp3",  n:"裏ボス戦闘曲（おまけの悪魔）"}
};
// 地図 → 曲（地図の名前は data / maps の キー）
const TQ_BGM_MAP = {lab:"town", sendai:"town", tokyo:"town", aprt:"town", xmas:"town", tower:"castle", white:"castle", future:"castle", n10:"castle",
    labn:"cave", base:"cave", n8:"field", n9:"sea", n11:"demoncastle", xr:"field", ep10:"field", ep11:"town", ep11b:"town", ep12:"castle", ep01:"field", ks1:"field", ks2:"town", ks3:"castle", ks4:"town", ks5:"field"};
const TQ_BGM_LAST = ["teddy", "king", "omega"], TQ_BGM_SECRET = ["s_akuma"];

const tqBgm = {cur:"", audios:{}, bad:{}, want:""};
function tqBgmWant(){
    if(G.mode === "end") return "ending";
    const fromMenu = (G.mode === "help" && G.helpFrom === "menu") || (G.mode === "settings" && G.setFrom === "menu") || (G.mode === "cheat" && G.cheatFrom === "menu") || (G.mode === "slots" && G.slotFrom === "menu");
    if(!G.S || (!fromMenu && ["title", "slots", "profile", "persona", "result", "help", "settings", "cheat"].includes(G.mode))) return "opening";
    if(G.mode === "battle" && G.b){
        const ids = G.b.foes.map((f) => f.id);
        if(ids.some((i) => TQ_BGM_SECRET.includes(i))) return "secretboss";
        if(ids.some((i) => TQ_BGM_LAST.includes(i))) return "lastboss";
        if(G.b.boss) return "midboss";
        return "mainbattle";
    }
    return TQ_BGM_MAP[G.S.map] || "field";
}
function tqBgmAudio(key){
    if(tqBgm.bad[key]){
        // 通信が とぎれて 読めなかった曲は、20秒 あとに もう一度 ためす（ずっと 無音に ならない）
        if(Date.now() - tqBgm.bad[key] < 20000) return null;
        delete tqBgm.bad[key]; delete tqBgm.audios[key];
    }
    let a = tqBgm.audios[key];
    if(!a){
        a = new Audio("./bgm/" + TQ_BGM[key].file); a.loop = key !== "ending"; a.preload = "auto";
        a.addEventListener("error", () => { tqBgm.bad[key] = Date.now(); });
        tqBgm.audios[key] = a;
    }
    return a;
}
function tqBgmVol(){ return Math.max(0, Math.min(1, [0.25, 0.5, 0.8][G.set.bgmVol == null ? 1 : G.set.bgmVol] || 0.5)); }
function tqBgmStop(){ Object.keys(tqBgm.audios).forEach((k) => { try{ tqBgm.audios[k].pause(); }catch(_e){} }); tqBgm.cur = ""; }
function tqBgmSync(){
    try{
        if(G.moviePlaying || G.pkQuiet){ if(tqBgm.cur) tqBgmStop(); return; }
        if(G.set.bgm === false || document.hidden){ if(tqBgm.cur) tqBgmStop(); return; }
        const key = tqBgmWant();
        if(key !== tqBgm.cur){
            Object.keys(tqBgm.audios).forEach((k) => { if(k !== key){ try{ tqBgm.audios[k].pause(); }catch(_e){} } });
            tqBgm.cur = key;
            if(key === "ending"){ const e = tqBgmAudio(key); if(e){ try{ e.currentTime = 0; }catch(_x){} } }
        }
        if(key === "ending" && tqBgm.audios.ending && tqBgm.audios.ending.ended) return;   // 曲が おわったら しずかに
        const a = tqBgmAudio(key); if(!a) return;
        a.volume = tqBgmVol();
        if(a.paused){ const p = a.play(); if(p && p.catch) p.catch(() => {}); }   // 画面を さわる まで 鳴らないブラウザでは、あとで もういちど ためす
    }catch(_e){ /* 音が 出せなくても ゲームは つづける */ }
}
setInterval(tqBgmSync, 500);
["pointerdown", "keydown", "touchstart"].forEach((ev) => document.addEventListener(ev, tqBgmSync, {passive:true}));
document.addEventListener("visibilitychange", tqBgmSync);

// 効果音（1回だけ）：セーブ音など。BGMは止めません
function tqSePlay(key){
    try{
        if(G.set.bgm === false || !TQ_BGM[key] || tqBgm.bad["se_" + key]) return;
        // いまの 効果音が あれば 止める（かさなって 鳴らない）
        if(tqBgm.se){ try{ tqBgm.se.pause(); }catch(_e){} clearTimeout(tqBgm.seT); tqBgm.se = null; }
        const a = new Audio("./bgm/" + TQ_BGM[key].file), vol = Math.min(1, tqBgmVol() + 0.2); a.volume = vol;
        a.addEventListener("error", () => { tqBgm.bad["se_" + key] = 1; });
        tqBgm.se = a;
        const p = a.play(); if(p && p.catch) p.catch(() => {});
        // ファイルが 長くても、5秒で ふわっと きえる
        const SE_MAX = 5000, SE_FADE = 1200, t0 = Date.now();
        const tick = () => {
            if(tqBgm.se !== a) return;
            const left = SE_MAX - (Date.now() - t0);
            if(left <= 0 || a.ended){ try{ a.pause(); }catch(_e){} tqBgm.se = null; return; }
            if(left < SE_FADE){ try{ a.volume = Math.max(0, vol * left / SE_FADE); }catch(_e){} }
            tqBgm.seT = setTimeout(tick, 100);
        };
        tqBgm.seT = setTimeout(tick, 100);
    }catch(_e){ /* 無視 */ }
}


/* ==== game/yarisugi.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[32]=1;
"use strict";
// ===== 追加コンテンツ：やりすぎヒーロー伝説＆ドリームストーリー（全20話・長編）=====
//   ・本編クリア後、ゲートから ひらく。推奨Lv は 45 から 5ずつ あがり、さいごは Lv99 が つづく。
//   ・むずかしさは「イージー／ベーシック／ハード」に かかわらず ぜんぶ『ハードより むずかしい』で 固定。
//   ・1話ごとに 仲間が 2〜3人 くわわり、話が おわると はずれる。仲間は めっちゃ 強い！
//   ・ぜんぶ クリアすると 15の 職業が Lv99 に なり、16個目の職業『天才』が ひらく。
//   ・こわい 場面は「ゆめの アクション」ふう。ぶき・けが・いのちの 話は ありません（ノイズ・いたずら・ドッキリに おきかえ）。
//   ・NPC（仲間に できる ひと）は 本編＋追加コンテンツ ぜんぶで 100人（NPC001〜100）。
//   ※ 人名は 下の名前だけ。じっさいの 人物とは かんけい ありません（ゲームの なかの キャラクターです）。

// ---------------------------------------------------------------- 小さな 道具
const YKL = (a) => a.map((s) => { const i = s.indexOf("｜"); return i > 0 ? rpgS(s.slice(0, i), s.slice(i + 1)) : rpgN(s); });
function yHash(s){ let h = 11; for(const c of String(s)) h = (h * 33 + c.codePointAt(0)) % 1000003; return h; }

// ---------------------------------------------------------------- 見た目（名前から 自動で きめる／おもな 人は 手で きめる）
const Y_SKIN = ["#f6d2b0", "#f9d9bd", "#f3cfae", "#eebf98", "#f0c9a2"];
const Y_HAIR = ["#1b1b27", "#2d2118", "#4a2a1a", "#7a4a2a", "#2a1a14", "#3b2a20", "#5a3a22", "#8a5a2b", "#1f2a44", "#7a1fd1", "#e07a1f", "#9c4a2a"];
const Y_TOP = ["#2f6fdc", "#e8506b", "#4caf7a", "#f0a8c0", "#6fb4e8", "#8a5ab6", "#e07a1f", "#6b7280", "#14b8a6", "#f2c94c", "#c0475a", "#3a4a6b"];
const Y_BOT = ["#374151", "#4b5563", "#2e6b4a", "#4b3a6b", "#35507a", "#1f2937", "#6a4a7a"];
const Y_STY = ["short", "long", "bob", "twin", "spike", "bun", "short", "spike", "long", "bob"];
const Y_ACC = ["none", "none", "none", "glasses", "none", "tie", "none", "scarf", "none", "none"];
// [名前, ヒント: 男(m)/女(f)] ─ 手で きめる 見た目
const Y_HAND = {
    "紘":"ks_hiro", "渚":"ks_nagisa", "康介":"ks_kosuke", "羽鳥彦":"ks_hatori", "鳩子":"ks_hatoko", "多鹿":"ks_taka", "鷲郎":"ks_washi", "大翔":"ks_mag", "優":"ks_girl2", "愛海":"ks_girl", "芽衣":"ks_girl",
    "布武矢":"ks_boy", "南海":"ks_girl2", "村川":"ks_kosuke", "玲奈":"ks_girl2", "晴喜":"ks_boy", "内踝":"ks_elder", "春鳥":"ks_kosuke", "波止美":"ks_elderF",
    "玲也":"reiya", "蒼太":"aota", "竜也":"tatsuya", "美咲":"misaki", "健斗":"kento", "さえこ":"saeko", "龍之介":"ryu", "はるや":"haruya", "ミナ":"mina", "耕太":"kota", "弘樹":"hiroki", "サンタさん":"santa",
    "アナウンくん":"robo", "手品師マジック":"magician", "もりの ガイド":"forester", "ダイバー":"diver", "さいごの 案内人":"lastgirl"
};
const Y_PEOPLE = {
    // おもな 登場人物（見た目の くわしい 指定）
    "桃寧":["#f9d9bd", "#2a1a14", "long", "#f4a6c0", "#6a4a7a", "glasses"], "真里香":["#f9d9bd", "#3b2a20", "twin", "#8ad0ff", "#35507a", "none"], "恵美子":["#f9d9bd", "#5a3a22", "bob", "#c084fc", "#4b3a6b", "none"],
    "蒼井":["#f6d2b0", "#1f2a44", "short", "#4caf7a", "#2e6b4a", "none"], "愛梨":["#f9d9bd", "#7a4a2a", "bun", "#f2c94c", "#4b5563", "none"], "玲実":["#f9d9bd", "#1b1b27", "long", "#d946ef", "#1f2937", "none"],
    "泉":["#f9d9bd", "#4a2a1a", "twin", "#a78bfa", "#4b3a6b", "none"], "真花":["#f9d9bd", "#2a1a14", "long", "#fb7185", "#6a4a7a", "none"], "紘殿":["#f3cfae", "#d8d8d8", "short", "#6a7a5a", "#3a4a3a", "scarf"],
    "晴夏":["#f9d9bd", "#8a5a2b", "bob", "#fdba74", "#374151", "none"], "凪":["#f9d9bd", "#1b1b27", "long", "#38bdf8", "#1f2937", "none"], "智也":["#eebf98", "#2d2118", "short", "#6b7280", "#374151", "none"],
    "雄太":["#f3cfae", "#222", "spike", "#ef4444", "#374151", "glasses"], "秋弥":["#f6d2b0", "#1d3557", "short", "#457b9d", "#1d3557", "glasses"], "咲来":["#f9d9bd", "#9c4a2a", "twin", "#f48fb1", "#6a4a7a", "none"],
    "沙弥香":["#f9d9bd", "#2a1a14", "long", "#fde68a", "#4b5563", "none"], "創輝":["#f6d2b0", "#7a1fd1", "spike", "#14b8a6", "#1f2937", "none"], "藍里":["#f9d9bd", "#4a2a1a", "bun", "#60a5fa", "#374151", "tie"],
    "由美":["#f9d9bd", "#1b1b27", "bob", "#fb923c", "#4b5563", "none"], "大樹":["#eebf98", "#222", "spike", "#5a6b2f", "#2a3320", "none"], "和佐":["#f3cfae", "#3a2a1a", "short", "#9ca3af", "#374151", "glasses"],
    "原伊太士":["#f0c9a2", "#555", "bald", "#a16207", "#3a2a1a", "none"], "女将":["#f9d9bd", "#2a1a14", "bun", "#c0475a", "#6a4a5a", "none"], "拓也":["#f6d2b0", "#1b1b27", "short", "#374151", "#1f2937", "none"],
    "将也":["#f3cfae", "#111", "spike", "#7f1d1d", "#1b1b27", "scarf"], "ひなた":["#f9d9bd", "#7a4a2a", "twin", "#fbcfe8", "#6a4a7a", "none"], "夏海":["#f9d9bd", "#1f2a44", "bob", "#a7f3d0", "#2e6b4a", "glasses"],
    "垣内":["#f6d2b0", "#2d2118", "cap", "#1d4ed8", "#1f2937", "none"], "遠野さん":["#f9d9bd", "#555", "bun", "#9ca3af", "#4b5563", "none"], "翔也":["#f6d2b0", "#1d3557", "short", "#2563eb", "#1f2937", "tie"]
};
function yLookKey(name){
    if(Y_HAND[name]) return Y_HAND[name];
    const key = "y_" + yHash(name);
    if(!RPG_LOOKS[key]){
        const p = Y_PEOPLE[name], h = yHash(name);
        RPG_LOOKS[key] = p ? {skin:p[0], hair:p[1], style:p[2], top:p[3], bot:p[4], acc:p[5]}
            : {skin:Y_SKIN[h % 5], hair:Y_HAIR[(h >> 3) % 12], style:Y_STY[(h >> 5) % 10], top:Y_TOP[(h >> 7) % 12], bot:Y_BOT[(h >> 9) % 7], acc:Y_ACC[(h >> 11) % 10]};
    }
    return key;
}
function yPortrait(name){ TQ_PORTRAIT_LOOK[name] = yLookKey(name); }

// ---------------------------------------------------------------- NPC 100人（NPC001〜100）
//   001〜015：本編から。 016〜100：追加コンテンツぶん（やりすぎヒーロー伝説の 仲間＝つよい／烏坂探偵事務所／本編の 人たち ほか）
//   [名前, 役わり(atk/mage/heal/tank/buff), 強さ（1=ふつう／1.5=めっちゃ つよい）]
const Y_ROSTER = [
    // やりすぎヒーロー伝説の おもな 仲間（めっちゃ強い）
    ["渚", "heal", 1.5], ["竜也", "mage", 1.5], ["桃寧", "buff", 1.5], ["真里香", "atk", 1.5], ["恵美子", "buff", 1.5], ["康介", "mage", 1.5], ["蒼井", "tank", 1.5], ["愛梨", "heal", 1.5], ["玲実", "atk", 1.5],
    ["泉", "heal", 1.5], ["真花", "buff", 1.5], ["紘殿", "mage", 1.5], ["晴夏", "atk", 1.5], ["凪", "mage", 1.5], ["智也", "tank", 1.5], ["雄太", "atk", 1.5], ["秋弥", "mage", 1.5], ["咲来", "atk", 1.5],
    ["沙弥香", "heal", 1.5], ["創輝", "tank", 1.5], ["藍里", "buff", 1.5], ["由美", "mage", 1.5], ["大樹", "tank", 1.5], ["和佐", "atk", 1.5], ["原伊太士", "tank", 1.5], ["女将", "heal", 1.5], ["拓也", "atk", 1.5],
    ["将也", "atk", 1.5], ["ひなた", "heal", 1.5], ["夏海", "mage", 1.5], ["垣内", "tank", 1.5], ["遠野さん", "mage", 1.5], ["翔也", "atk", 1.5],
    // 烏坂探偵事務所の 人たち
    ["羽鳥彦", "mage", 1.15], ["鳩子", "heal", 1.15], ["多鹿", "tank", 1.15], ["鷲郎", "atk", 1.15], ["大翔", "buff", 1.15], ["優", "heal", 1.15], ["愛海", "buff", 1.15], ["芽衣", "atk", 1.15], ["布武矢", "tank", 1.15],
    ["南海", "mage", 1.15], ["村川", "tank", 1.15], ["玲奈", "heal", 1.15], ["晴喜", "atk", 1.15], ["内踝", "buff", 1.15], ["春鳥", "mage", 1.15], ["波止美", "heal", 1.15],
    // 本編・追加エピソードの 人たち
    ["玲也", "atk", 1.1], ["蒼太", "tank", 1.1], ["美咲", "heal", 1.1], ["健斗", "atk", 1.1], ["さえこ", "buff", 1.1], ["龍之介", "tank", 1.1], ["はるや", "mage", 1.1], ["ミナ", "heal", 1.1], ["耕太", "atk", 1.1],
    ["弘樹", "tank", 1.1], ["サンタさん", "buff", 1.1], ["アナウンくん", "mage", 1.1], ["手品師マジック", "mage", 1.1], ["もりの ガイド", "heal", 1.1], ["ダイバー", "atk", 1.1], ["さいごの 案内人", "buff", 1.1],
    // 長編の ゆかいな 脇役たち
    ["ゆう", "atk", 1.2], ["さり", "heal", 1.2], ["あずま", "tank", 1.2], ["ゆうじ", "atk", 1.2], ["束", "buff", 1.2], ["大和", "tank", 1.2], ["梨音", "heal", 1.2], ["楓花", "mage", 1.2], ["しょう", "atk", 1.2],
    ["はやと", "tank", 1.2], ["校長先生", "buff", 1.2], ["教頭先生", "heal", 1.2], ["税関の 案内人", "buff", 1.2], ["郵便屋さん", "atk", 1.2], ["事務官", "mage", 1.2], ["国税局の 人", "tank", 1.2], ["店長さん", "atk", 1.2],
    ["運転手さん", "atk", 1.2], ["消防士さん", "tank", 1.2], ["おいしゃさん", "heal", 1.2]
];
const Y_NPC_ID = {};   // 名前 → "n016"…
(function(){
    const base = {atk:{hp:[28, 10.5], mp:[5, 2.2], atk:[9.5, 3.4], def:[5, 1.9], agi:[10, 0.8]}, mage:{hp:[22, 7.5], mp:[14, 5], atk:[9.5, 3.1], def:[3, 1.5], agi:[8, 0.55]},
        heal:{hp:[24, 8.8], mp:[12, 4.6], atk:[6.5, 2.4], def:[4, 1.7], agi:[8, 0.55]}, tank:{hp:[38, 13.5], mp:[4, 2], atk:[7.5, 2.7], def:[9, 2.7], agi:[5, 0.4]}, buff:{hp:[26, 9.2], mp:[11, 4.3], atk:[7, 2.5], def:[5, 1.8], agi:[10, 0.7]}};
    const sc = (a, k) => [Math.round(a[0] * k * 10) / 10, Math.round(a[1] * k * 100) / 100];
    Y_ROSTER.forEach((r, i) => {
        const id = "n" + String(16 + i).padStart(3, "0"), b = base[r[1]], k = r[2], lk = yLookKey(r[0]);
        Y_NPC_ID[r[0]] = id;
        RPG_CLASS[id] = {n:r[0], role:r[1], hp:sc(b.hp, k), mp:sc(b.mp, k), atk:sc(b.atk, k), def:sc(b.def, k), agi:sc(b.agi, 1 + (k - 1) * 0.5)};
        TQ_LOOK_OF[id] = lk; TQ_NPCS.push([id, r[0], lk]); yPortrait(r[0]);
    });
})();
const YA = (n) => Y_NPC_ID[n];

// ---------------------------------------------------------------- 仲間の でいり（話ごとに 2〜3人が くわわり、おわると はずれる）
const Y_ALLY = {};   // 地図 id → [名前…]
const Y_MAXP = 6;
(function(){
    const _ts = tqTempSync;
    tqTempSync = function(map, quiet){
        const base = _ts.apply(this, arguments), S = G.S; if(!S) return base;
        const msgs = [], yh = (S.yh = S.yh || {joined:[], bench:[]}), want = (Y_ALLY[map] || []).map(YA).filter(Boolean);
        if(want.length && !S.cx.noTemp){
            want.forEach((id) => {
                if(S.party.includes(id)) return;
                while(S.party.length >= Y_MAXP){
                    const bi = S.party.map((x, i) => [x, i]).reverse().find(([x]) => x !== "hero" && !want.includes(x));
                    if(!bi) break; const [bid] = bi; S.party = S.party.filter((x) => x !== bid); yh.bench.push(bid); msgs.push(tqName(bid) + "は ちょっと ひとやすみ。（この話の あいだ だけ）");
                }
                if(S.party.length < Y_MAXP && tqAddMember(id, true)){ yh.joined.push(id); msgs.push(tqName(id) + " が なかまに くわわった！（この話の あいだ だけ・めっちゃ 強い！）"); }
            });
        }
        if(!want.length && (yh.joined.length || yh.bench.length)){
            yh.joined.forEach((id) => { if(S.party.includes(id)){ S.party = S.party.filter((x) => x !== id); msgs.push(tqName(id) + "は ようじが あって かえっていった。（また ゆめで 会おう！）"); } });
            yh.joined = [];
            yh.bench.forEach((id) => { if(!S.party.includes(id) && S.party.length < Y_MAXP) tqAddMember(id, true); });
            yh.bench = [];
        }else if(want.length){
            // 前の 話の 仲間が のこって いたら はずす
            yh.joined = yh.joined.filter((id) => { if(want.includes(id)) return true; if(S.party.includes(id)){ S.party = S.party.filter((x) => x !== id); msgs.push(tqName(id) + "は ゆめの なかへ 帰っていった。"); } return false; });
        }
        tqClamp();
        return base.concat(quiet ? [] : msgs);
    };
})();

// ---------------------------------------------------------------- むずかしさは 『ハードより むずかしい』で 固定
const Y_FOES = {};   // 敵 id → 話の 番号
(function(){
    const _bs = battleStart;
    battleStart = function(ids, after){
        const hit = ids.some((x) => Y_FOES[x]);
        if(!hit) return _bs.apply(this, arguments);
        const keep = G.S.diff; G.S.diff = "basic";
        try{ _bs.apply(this, arguments); }finally{ G.S.diff = keep; }
        try{
            const c = G.S.cx;
            if(G.b) G.b.foes.forEach((f) => {
                if(f._yh) return; f._yh = 1;
                const m = c.yw ? 0.25 : c.ys ? 2 : 1;
                if(m !== 1){ f.hp = Math.max(1, Math.round(f.hp * m)); f.cur = f.hp; f.atk = Math.max(1, Math.round(f.atk * m)); }
            });
        }catch(e){ console.error("[yh-diff]", e); }
    };
})();
const Y_POW = [1.00, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.36, 1.42, 1.50, 1.60, 1.70, 1.80, 1.90, 2.02, 2.14, 2.26, 2.40, 2.60];   // 話ごとの つよさの 上乗せ（Hardより むずかしい）
const Y_LV = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99, 99, 99, 99, 99, 99, 99, 99, 99];
function yMob(n, idx, name, emo, tier){
    const id = "yh" + n + "_m" + idx, lv = Y_LV[n - 1], st = tqFoeStat(lv, tier, false), pw = Y_POW[n - 1] * 1.25;
    RPG_FOES[id] = rpgE(name, emo, Math.round(st.hp * pw), Math.round(st.atk * pw), Math.round(st.def * (0.9 + pw * 0.1)), Math.round(st.exp * 1.4), Math.round(st.g * 2.2),
        [[name.split(" ").pop() + "の たいあたり", 0, 1, 1.2], ["ぐるぐる ノイズ", 0, 0.8, 1.0], ["ふしぎな ひかり", 1, 0.5, 0.7]], {yh:1});
    Y_FOES[id] = n; return id;
}
function yBoss(n, id, name, emo, img, acts, say, extra){
    const lv = Y_LV[n - 1], st = tqBossStat(lv), pw = Y_POW[n - 1];
    st.hp = Math.round(st.hp * pw * 1.5); st.atk = Math.round(st.atk * pw * 1.2); st.def = Math.round(st.def * (0.9 + pw * 0.12)); st.exp = Math.round(st.exp * (1.6 + n * 0.12)); st.g = Math.round(st.g * 5);
    RPG_FOES[id] = Object.assign(rpgE(name, emo, 10, 5, 1, 1, 1, acts, {boss:true, spar:false, img}), st, {bossLv:lv, say50:say, yh:1}, extra || {});
    Y_FOES[id] = n; TQ_PORTRAIT_IMG[name] = img; return id;
}

// ---------------------------------------------------------------- 地図（テーマごとの 見た目）
//   歩ける マスだけ 人を おく。かざりは 上の 段（y=1〜2）と ふち だけ。
const Y_THEMES = {
    park:{fill:".", b:"T", ops:[["r", 1, 5, 16, 2, ","], ["r", 2, 1, 4, 1, "f"], ["r", 11, 1, 5, 1, "f"]], tint:"rgba(255,230,160,0.08)"},
    school:{fill:"=", b:"#", ops:[["r", 2, 1, 3, 2, "L"], ["r", 7, 1, 3, 2, "L"], ["r", 12, 1, 3, 2, "L"]], tint:"rgba(180,200,255,0.08)"},
    night:{fill:"n", b:"m", ops:[["r", 2, 1, 3, 2, "N"], ["r", 13, 1, 3, 2, "N"], ["r", 7, 1, 4, 1, "m"]], tint:"rgba(40,40,110,0.20)"},
    snow:{fill:"S", b:"t", ops:[["r", 1, 5, 16, 2, "s"], ["r", 3, 1, 3, 1, "t"], ["r", 12, 1, 3, 1, "t"]], tint:"rgba(190,215,255,0.12)"},
    rink:{fill:"i", b:"Q", ops:[["r", 2, 1, 14, 1, "Q"], ["r", 6, 4, 6, 1, "w"]], tint:"rgba(150,220,255,0.12)"},
    lab:{fill:"q", b:"z", ops:[["r", 2, 1, 3, 2, "P"], ["r", 8, 1, 3, 2, "P"], ["r", 13, 1, 3, 2, "z"]], tint:"rgba(120,200,255,0.10)"},
    stage:{fill:"c", b:"N", ops:[["r", 3, 1, 12, 1, "p"], ["r", 7, 5, 4, 2, "w"]], tint:"rgba(150,60,170,0.14)"},
    port:{fill:"M", b:"Q", ops:[["r", 2, 1, 3, 2, "Q"], ["r", 13, 1, 3, 2, "Q"], ["r", 6, 1, 6, 1, "b"]], tint:"rgba(150,190,255,0.10)"},
    lake:{fill:".", b:"T", ops:[["r", 12, 1, 4, 3, "~"], ["r", 1, 5, 16, 2, ","]], tint:"rgba(120,200,255,0.10)"},
    town:{fill:",", b:"#", ops:[["r", 2, 1, 4, 2, "H"], ["r", 2, 3, 4, 1, "h"], ["r", 12, 1, 4, 2, "H"], ["r", 12, 3, 4, 1, "h"]], tint:"rgba(255,180,120,0.10)"},
    shop:{fill:"=", b:"#", ops:[["r", 2, 1, 3, 2, "K"], ["r", 8, 1, 3, 2, "K"], ["r", 13, 1, 3, 2, "K"]], tint:"rgba(255,210,150,0.10)"},
    dream:{fill:"n", b:"m", ops:[["r", 3, 1, 12, 1, "m"], ["r", 7, 5, 4, 2, "c"]], tint:"rgba(120,60,180,0.22)"}
};
const Y_SLOT = [[3, 5], [7, 5], [11, 5], [15, 5], [3, 8], [7, 8], [11, 8], [15, 8]];   // 人を おく 場所（ぜんぶ 歩ける）
const Y_GUIDE = [5, 10];
function yMap(theme, objs, name){
    const T = Y_THEMES[theme] || Y_THEMES.park, R = [["b", T.b]].concat(T.ops, [["p", 9, 11, "G"]]);
    return {name, tint:T.tint, start:[9, 10], enc:null, rows:rpgMk(18, 12, T.fill, R), tev:{G:["gate_back", 1], b:["seat"]}, objs};
}
const yNpc = (id, x, y, name, ev) => NPC(id, x, y, yLookKey(name), name, ev);

// ---------------------------------------------------------------- 1話ぶんを つくる
const Y_EPS = [];
const Y_LET = "ゆうきとちえとやさしさでじんせいはかわる";   // 20話 ぶんの 手紙の もじ（さいごに 1つの ことばに なる）
const yLetter = (n) => (n >= 20 ? [] : ["（空から 1まいの 手紙が ひらひらと おちて きた…）", "手紙｜『挑戦状 No." + n + " ── 人生を 大逆転 させたければ、さきへ 進め。 きょうの もじは「" + Y_LET[n - 1] + "」。』", "紘｜…だれが 書いたんだろう。つぎの 話へ いこう！"]);
function yq(id, o){
    // o = {chk, set, intro:[…], done:[…], steps:[{q, a:[正解, まちがい…], hint:[…], ok:[…]}…]}
    const n = o.steps.length, sid = (i) => (i ? id + "_s" + (i + 1) : id + "_q");
    o.steps.forEach((s, i) => {
        const last = i === n - 1, okOps = YKL(s.ok).concat(last ? (o.fin ? YKL(o.fin) : []).concat([["set", o.set]]) : [["run", sid(i + 1)]]);
        const h = yHash(id + i), opts = s.a.map((t, k) => [t, k === 0 ? okOps : YKL(s.hint).concat([["run", sid(i)]])]), rot = h % opts.length;
        const shuf = opts.slice(rot).concat(opts.slice(0, rot));
        RPG_EV[sid(i)] = [rpgN(s.q), ["choice", shuf]];
    });
    RPG_EV[id] = [["if", o.chk, YKL(o.done || ["（この なぞは もう とけたよ！）"]), YKL(o.intro).concat([["run", sid(0)]])]];
}
function YE(n, c){
    const m = "yh" + n, L = "abcd", lv = Y_LV[n - 1], flags = c.qs.map((_q, i) => m + L[i]);
    Y_EPS.push({n, title:c.title, sub:c.sub, lv, learn:c.learn});
    // --- なぞ
    c.qs.forEach((q, i) => yq(m + "_" + L[i], {chk:flags[i], set:flags[i], intro:q.intro, done:q.done, fin:q.fin, steps:q.steps}));
    // --- 司令塔（案内役）
    const labels = c.qs.map((q) => q.label || q.steps[0].q.slice(0, 12));
    const list = flags.map((f, i) => ["if", f, [], [rpgN("・なぞ" + (i + 1) + "『" + labels[i] + "』は まだ とけて いないよ")]]);
    RPG_EV[m + "_hq"] = [["if", "e_" + m, YKL(c.after || ["紘｜この 話は もう クリアしたね。ゲートから つぎの 話へ すすもう！"]),
        [["if", flags.join("&"), [["run", m + "_boss"]], YKL(c.guide).concat(list)]]]];
    // --- ざつだん
    (c.talks || []).forEach((t, i) => { RPG_EV[m + "_t" + (i + 1)] = YKL(t[1]); });
    // --- 敵
    const mobIds = (c.mobs || []).map((mb, i) => yMob(n, i + 1, mb[1], mb[0], [1, 1.35, 1.8][i] || 1));
    // --- わな（おまけの たたかい）
    if(c.trap){
        const tid = m + "_trap";
        RPG_EV[tid] = [["if", m + "tr", YKL(["（わなは もう こわしたよ。）"]), YKL(c.trap.pre).concat([["battle", [mobIds[2] || mobIds[0]], YKL(c.trap.post).concat([["gold", 300 + n * 40], ["item", "special", 2], ["set", m + "tr"]])]])]];
    }
    // --- ボス
    const b = c.boss, bid = m + "_boss";
    yBoss(n, bid, b.name, b.emo, b.img, b.acts, b.say);
    const reward = [["gold", 2000 + n * 700], ["item", "special", 6], ["item", "omamori", 3], rpgN((2000 + n * 700) + "G と スペシャルおにぎり 6こ・ふっかつのおまもり 3こ を てにいれた！"), rpgN("📖 今回の まなび：" + c.learn)];
    RPG_EV[bid] = YKL(c.pre).concat([["battle", [bid], YKL(c.post).concat(reward, c.end ? YKL(c.end) : [], YKL(yLetter(n)), [["set", "e_" + m], ["run", n === 20 ? "yh_final" : n === 30 ? "yh_extra_final" : "lab_ret_go"]])]]);
    RPG_EV[m + "_enter"] = [["if", "!" + m + "_in", [["set", m + "_in"], ["set", "yh_started"]].concat(YKL(c.intro)), []]];
    // --- 地図
    const objs = [yNpc(m + "_hq", Y_GUIDE[0], Y_GUIDE[1], c.guideName || "紘", m + "_hq")];
    c.qs.forEach((q, i) => objs.push(yNpc(m + "_" + L[i], Y_SLOT[i][0], Y_SLOT[i][1], q.who, m + "_" + L[i])));
    (c.talks || []).forEach((t, i) => objs.push(yNpc(m + "_t" + (i + 1), Y_SLOT[c.qs.length + i][0], Y_SLOT[c.qs.length + i][1], t[0], m + "_t" + (i + 1))));
    if(c.trap) objs.push(NPC(m + "_trap", Y_SLOT[7][0], Y_SLOT[7][1], "y_trap", c.trap.name, m + "_trap"));
    RPG_MAPS[m] = yMap(c.theme, objs, "やりすぎヒーロー伝説 第" + n + "話　" + c.title);
    if(mobIds.length) RPG_MAPS[m].enc = {rate:0.05, f:[[[mobIds[0]], 4], [[mobIds[1]], 3], [[mobIds[0], mobIds[1]], 2], [[mobIds[2] || mobIds[1]], 1]]};
    Y_ALLY[m] = c.allies;
    RPG_ENTER[m] = m + "_enter";
    if(c.bgm) TQ_BGM_MAP[m] = c.bgm;
    RPG_LOOKS.y_trap = RPG_LOOKS.y_trap || {skin:"#e9ddf2", hair:"#7c3aed", style:"spike", top:"#4c1d95", bot:"#1b1b27", acc:"xr"};
}


/* ==== game/yh1.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[33]=1;
"use strict";
// ===== やりすぎヒーロー伝説 ① 第1〜5話 =====
//   第1話 ちいさな ヒーローの はじまり（Lv45） / 第2話 ふしぎな しょうがっこう じけん（Lv50） / 第3話 ぞうの なぞと おうちの あかり（Lv55）
//   第4話 なまえ どろぼうと おぼえる ひみつ（Lv60） / 第5話 ビリから トップへ！ 勉強の まほう（Lv65）

YE(1, {
    title:"ちいさな ヒーローの はじまり", sub:"こうえんの なかま", theme:"park", bgm:"field", allies:["渚", "恵美子"],
    intro:["ゆめの 中で、ふしぎな 日記が ひらいた。表紙には『紘の ドリームストーリー』…。", "紘｜ようこそ、{名前}{くん}。ここは ぼくの 子どもの ころの 『ゆめの 世界』。今日から きみは『なりきり探偵』。ぼくの 物語を 20話ぶん いっしょに 歩いて ほしい。",
        "紘｜これは ゆめだから、ちょっと ドキッと する ことも アクションゲームみたいに 起きるよ。でも、よく 考えて みんなで 助けあえば かならず 乗りこえられる。", "紘｜全部 クリアした とき、きみは すごい ちからを 手に入れる…。 ひみつだよ！",
        "渚｜こんにちは！ わたし 渚。この 公園で いつも 遊んでるの。紘くん、その人 だれ？", "紘｜今日から いっしょに 遊ぶ ともだち だよ。あれ、むこうで 何か さわいでる！ まずは 公園の 人たちに 話しかけよう（なぞは 3つ）。"],
    guide:["紘｜ぼくが ちいさかった ころの 公園だよ。ここで 3つの なぞを といて いこう。", "紘｜しょうくん・まいごの 子・渚さん に 話しかけて ね。ぜんぶ とけたら、公園に 何かが あらわれるよ。"],
    qs:[
        {who:"しょう", label:"おもちゃの とりあい", intro:["しょう｜この おもちゃは おれのだ！ ぜったい 渡さないぞ！", "はやと｜ずるい！ おれが 先に 見つけたんだ！", "渚｜けんか、ひどく なっちゃう…。{名前}{くん}、どうしたら いいかな？"],
            steps:[{q:"どうすれば 2人とも なっとくして あそべるかな？", a:["じゃんけんで 勝った人が 5分だけ 使って、時間が きたら 交代する", "じゃんけんで 勝った人が ずっと 使う", "先に つかんだ人が ずっと 使う"],
                hint:["紘｜勝った人が ずっと だと、負けた人は ぜんぜん 遊べないよね。2人とも 楽しめる ルールを 考えよう。"],
                ok:["紘｜そう！ 時間で 交代する『ルール』を つくれば、取りあいに ならないんだ。", "しょう｜5分なら がまん できる！ じゃんけん ぽん！", "はやと｜負けても あとで 使えるなら いいや。", "なぞ① 『おもちゃの とりあい』を とけた！"]}]},
        {who:"まいごの こども", label:"まいごの おうち", intro:["まいごの こども｜ひっく…。おうちが わからないよ…。", "まいごの こども｜おうちは『赤い 屋根』で、お庭に『ひまわり』が さいてて、『犬』を かってるの。",
            "渚｜この 近くには 3つの おうちが あるよ。　A：赤い 屋根・ひまわり・ねこ　B：赤い 屋根・ひまわり・犬　C：青い 屋根・ひまわり・犬"],
            steps:[{q:"この 子の おうちは どれ？", a:["B（赤い 屋根・ひまわり・犬）", "A（赤い 屋根・ひまわり・ねこ）", "C（青い 屋根・ひまわり・犬）"], hint:["紘｜3つの ヒントが ぜんぶ 当てはまる おうちを さがそう。『赤い 屋根』『ひまわり』『犬』、ぜんぶ そろってるのは？"],
                ok:["紘｜そう！ ヒントを ぜんぶ 満たす ものを 見つけるのが 名探偵の 第一歩だよ。", "まいごの こども｜あった！ ぼくの おうちだ！ ありがとう！", "なぞ② 『まいごの おうち』を とけた！"]}]},
        {who:"渚", label:"ブランコの じゅんばん", intro:["渚｜ブランコに 4人で ならんで、順番を まってるの。前から 順番だよ。", "渚｜①わたし（渚）は 紘くんより 前。 ②しょうくんは わたしの すぐ 後ろ。 ③はやとくんは いちばん 後ろ。"],
            steps:[{q:"紘くんは 前から 何番目 かな？", a:["3番目", "2番目", "4番目"], hint:["紘｜まず いちばん 後ろ（4番目）は はやとくん。そして 渚さんの すぐ 後ろが しょうくん。のこりの 場所は どこ かな？"],
                ok:["紘｜渚さん → しょうくん → 紘 → はやとくん。 ならべて みると きれいに 決まるよね。", "渚｜せいかい！ 次は わたしが 先に すべるね！", "なぞ③ 『ブランコの じゅんばん』を とけた！"]}]}
    ],
    talks:[["おまわりさん", ["おまわりさん｜おや、小さい ヒーロー！ 大きくなったら 町を まもる 公務員に ならないか？", "紘｜ぼくは 電車の 運転手に なりたいんだ！", "おまわりさん｜そうか、それも すてきな 夢だ。夢に むかって がんばれよ！"]],
        ["公園の おじいさん", ["おじいさん｜けんかを 止める ときは、まず ゆっくり 話を 聞いて あげる ことが 大事 じゃよ。", "おじいさん｜相手の 気持ちが わかると、いい 考えが うかぶものだ。"]]],
    trap:{name:"ふしぎな 箱", pre:["ふしぎな 箱｜…カタカタ…カタカタ…。（箱の 中から ガラクタ ノイズが とびだした！）"], post:["渚｜やった！ 箱の 中の おもちゃが もどったよ！"]},
    mobs:[["🧸", "ガラクタん"], ["🎈", "ふうせんノイズ"], ["🪁", "カイトノイズ"]],
    boss:{name:"ガラクタ・いたずらキング", emo:"🧸", img:"yh1_boss", acts:[["おもちゃ ふぶき", 1, 0.9, 0.9], ["ぜんぶ ひとりじめ！", 0, 1, 1.3], ["ガラクタ ストンプ", 0, 0.7, 1.7]], say:"ガラクタ キング「まだまだ！ ぜんぶ ぼくの おもちゃだ！」"},
    pre:["渚｜きゃっ！ 公園の おもちゃが ぜんぶ 大きな 山に なっちゃった！", "ガラクタ キング｜ぜんぶ ぼくの おもちゃだ！ だれにも 渡さないぞー！", "紘｜取りあいを やめない ノイズだ…！ {名前}{くん}、渚さん、恵美子さん、いっしょに 止めよう！", "恵美子｜まかせて！ みんなで 力を 合わせれば だいじょうぶ！"],
    post:["ガラクタ キング｜…ほんとうは、いっしょに 遊びたかった だけ なんだ…。", "紘｜いっしょに 遊ぼう。順番に 使えば、みんな 楽しいよ。", "ガラクタ キング｜…うん。ごめんね。ありがとう。", "渚｜よかった！ みんなで すべり台 しよう！"],
    end:["渚｜紘くん、わたし 春に 引っ越し なの…。", "紘｜だいじょうぶ。大きく なったら また 会おう！ 約束だよ。", "渚｜うん！ 約束！"],
    learn:"ルールを つくると けんかが へる。『ありがとう』と『ごめんね』は なかなおりの 魔法。"
});

YE(2, {
    title:"ふしぎな しょうがっこう じけん", sub:"校長先生は うそつき？", theme:"school", bgm:"town", allies:["竜也", "渚"],
    intro:["紘｜つぎは 小学1年生の ゆめ。学校に ついたら…あれ？ だれも いない。", "竜也｜おはよう、紘！ 今日は 臨時休校の はずなのに、なんで 来たんだ？ …体育館が ざわざわ してるぞ。", "竜也｜先生たちが 体育館で ぐっすり ねむらされてる！ 『ねむりの ノイズ』のしわざだ。", "紘｜犯人を 見つけよう。なぞは 3つ。竜也くんと 渚さんも 手伝って くれる！"],
    guide:["紘｜先生たちを ねむらせた 犯人は 学校の 中に いるはず。事実を ならべて、うそを 見やぶろう。", "紘｜竜也くん・用務員さん・体育館の 先生 に 話しかけて みよう。"],
    qs:[
        {who:"竜也", label:"さかさの 貼り紙", intro:["竜也｜体育館の とびらに、へんな 貼り紙が あるぞ。", "竜也｜『ちぐらうのんかくいいた』…読めない。これは 暗号かな？", "紘｜文字を 後ろから 読むと どうなるか 試して みよう。"],
            steps:[{q:"『ちぐらうのんかくいいた』を 後ろから 読むと？", a:["たいいくかんの うらぐち", "たいいくかんの まえぐち", "こうちょうしつの うらぐち"], hint:["紘｜いちばん 後ろの『た』から 順番に 読んでいくと…？"],
                ok:["紘｜『たいいくかんの うらぐち』！ 犯人は 体育館の うら口から 出入りして いたんだ。", "竜也｜やるな、紘！ うら口へ 行って みよう。", "なぞ① 『さかさの 貼り紙』を とけた！"]}]},
        {who:"用務員さん", label:"校長先生の あやしい ことば", intro:["用務員さん｜校長先生は『今朝 8時に 学校へ 来たばかり』と 言っとったが…。", "用務員さん｜わしが 7時前に 見に行ったら、校長室の ストーブは もう あたたかかった。しかも 休校の れんらくは 7時に 校長室から 回っとる。"],
            steps:[{q:"校長先生の ことばは どこが おかしい？", a:["8時に 来たばかりなのに、7時前から ストーブが あたたかい のは おかしい", "朝に 学校へ 来るのは おかしい", "ストーブを つかうのは おかしい"], hint:["紘｜『8時に 来た』が ほんとうなら、7時前の 校長室は つめたい はずだよね。"],
                ok:["紘｜そう！ 『時間』の くいちがいは うそを 見やぶる いちばんの ヒント。", "用務員さん｜やっぱり 校長先生は 早くから 学校に おったんじゃな。", "なぞ② 『校長先生の あやしい ことば』を とけた！"]}]},
        {who:"体育館の 先生", label:"いったい だれが 犯人？", intro:["体育館の 先生｜ん…うーん…（目を さました）。わたしたち 先生は 全員 体育館で ねむらされて いたの。", "体育館の 先生｜でも 『ねむって いなかった 先生』が 2人 いるわ。校長先生と 教頭先生。教頭先生は 校門で 気を うしなって たおれて いたの。"],
            steps:[{q:"ねむりの ノイズを 使った 犯人は だれ？", a:["校長先生", "教頭先生", "用務員さん"], hint:["紘｜ねむって いなかった 2人の うち、教頭先生は『あとで たおされた がわ』だったね。のこる 1人は？"],
                ok:["紘｜犯人は 校長先生！ ねむって いなかった 2人の うち、教頭先生は ひがいに あった 側。だから 犯人は 校長先生 しか いないんだ。", "竜也｜名探偵だな、紘！", "なぞ③ 『いったい だれが 犯人？』を とけた！"]}]}
    ],
    talks:[["ねむる 先生", ["先生（ねむり）｜ぐう…ぐう…。（ゆすっても 起きない。ノイズの ねむり 魔法だ）", "渚｜ノイズを たおせば きっと 目を さますよ！"]]],
    trap:{name:"あやしい ロッカー", pre:["あやしい ロッカー｜ガタン！ ガタガタ…！（ロッカーの 中から ねむり ノイズが とびだした！）"], post:["竜也｜ふぅ…。中に かくれてた ノイズも 片づいたな。"]},
    mobs:[["📚", "ホンノイズ"], ["✏️", "えんぴつノイズ"], ["📏", "じょうぎノイズ"]],
    boss:{name:"ノイズ校長", emo:"🏫", img:"yh2_boss", acts:[["ねむりの ベル", 1, 0.9, 0.9], ["いいつけ ラッシュ", 0, 1, 1.3], ["校長室の とびら", 0, 0.7, 1.7]], say:"ノイズ校長「みんな ねむれば いいんだ…！ だれも わたしの 気持ちを わかって くれない…！」"},
    pre:["校長先生｜…ばれたか。そうだ、先生たちを ねむらせたのは わたしだ。", "紘｜連絡網で 生徒を お休みに させて、先生だけ 学校に 来させた。そして ねむりの ノイズで 体育館に…。うそを 見やぶる 3つの 手がかりが 全部 校長先生を さして います。", "校長先生｜そうだ！ わたしは 校長に なりたくなかった！ 教頭が『かわりに なって くれ』と おしつけて、仕事は ぜんぶ わたし！ だれも 助けて くれない…！", "ノイズ校長｜ううう…！（校長先生が ノイズに のみこまれていく！）", "竜也｜紘、気持ちは わかるけど、ほうって おけない！", "紘｜{名前}{くん}、渚さん、竜也くん、校長先生を ノイズから 助けよう！"],
    post:["校長先生｜…すまなかった。つらくて、だれにも 言えなくて…。", "紘｜つらい ときは、ひとりで かかえずに 『そうだんする』んです。先生たちも 助けて くれますよ。", "体育館の 先生｜校長先生、これからは 仕事を みんなで 分けましょう。", "校長先生｜…ありがとう。ありがとう…。"],
    end:["竜也｜紘、おまえ ほんとうに 名探偵だな。いつか いっしょに 大きな 事件を 解こうぜ！", "紘｜うん！ 約束！"],
    learn:"うそは『時間』や『言ったこと』の くいちがいで 見やぶれる。つらい ときは ひとりで かかえず、そうだんしよう。"
});

YE(3, {
    title:"ぞうの なぞと おうちの あかり", sub:"家族が はなれそうな 夜", theme:"town", bgm:"town", allies:["ひなた", "竜也", "蒼井"],
    intro:["紘｜つぎは 小学校の 3年生の ゆめ。引っ越した 先の 町は、なんだか とっても 暗かった…。", "ひなた｜お兄ちゃん！ 学校の 二宮金次郎の ぞうが、もうすぐ はずされちゃうんだって。", "竜也｜みんなに 理由を 説明しなくちゃ いけないらしい。紘、頼む！", "蒼井｜ぼくも 手伝うよ。それと…お兄ちゃんの 家の ようすが 心配だって、ひなたちゃんが。"],
    guide:["紘｜この ゆめは 大事な 回。学校の ぞうの なぞと、うちの 家族の おはなしが 出てくるよ。", "紘｜先生・ひなた・竜也くん に 話しかけて、3つの なぞを といて ね。"],
    qs:[
        {who:"先生", label:"二宮金次郎の ぞう", intro:["先生｜この ぞうは『働きながら 勉強する』りっぱな 姿を 見せて、みんなが がんばる ように と 置かれたの。", "先生｜でも 全国で はずされる ことに なったわ。みんなの 前で 理由を 説明して くれる？", "紘｜（ぞうは 薪を せおって、歩きながら 本を 読んでる…。そういえば 下を 向いて 歩いてる 子が、さっき 人に ぶつかって いたな）"],
            steps:[{q:"ぞうが はずされる 本当の 理由は？", a:["まねして『歩きながら 本を 読む』と、ぶつかったり ころんだり して あぶないから", "ぞうが ふるくなって きたから", "本を 読むのは いけない ことだから"], hint:["紘｜ぞうは 歩きながら 本を 読んでるよね。まねを した 子は どうなるかな？ さっき 見た 子を 思い出して。"],
                ok:["紘｜そう！ ぞうの 本当の 意味は『歩きながら 覚えた ことを 暗唱する』だけど、まねする 子が あぶないから なんだ。", "先生｜みんな、歩きながらの 読書は あぶないから やめましょうね。", "なぞ① 『二宮金次郎の ぞう』を とけた！"]}]},
        {who:"ひなた", label:"お誕生日の 買い物", intro:["ひなた｜お兄ちゃん、これ 見て！ 『かっぱ えびせん』っていう おかし！ 今月 わたしの 誕生日だから、買って！", "紘｜いいよ！ 1ふくろ 120円。3ふくろ 買って、1000円さつで はらうよ。"],
            steps:[{q:"おつりは いくら？", a:["640円", "540円", "760円"], hint:["紘｜120円 × 3 = 360円。1000円 から 360円を ひくと？"],
                ok:["紘｜120×3 = 360円。 1000 − 360 = 640円！", "ひなた｜やったー！ ありがとう お兄ちゃん！", "なぞ② 『お誕生日の 買い物』を とけた！"]}]},
        {who:"竜也", label:"ゲームと 時間", intro:["竜也｜紘、最近 毎日 10時間も ゲームして 勉強が ぜんぜん できてないって 聞いたぞ。", "竜也｜1日は 24時間。ねる 時間は 8時間 ひつようだ。まず 数えて みよう。"],
            steps:[{q:"1日 10時間 ゲームを すると、1週間（7日）で 何時間？", a:["70時間", "17時間", "100時間"], hint:["紘｜10時間 × 7日 の かけ算だよ。"], ok:["紘｜10×7 = 70時間！ 1週間は 168時間だから、すごく 多いんだ。"]},
                {q:"1日 24時間から、ゲーム 10時間と ねる 8時間を ひいた のこりは？ （ごはん・勉強・遊び・おふろ…）", a:["6時間", "14時間", "2時間"], hint:["紘｜24 − 10 − 8 = いくつ かな？"], ok:["紘｜のこりは 6時間。ごはんや おふろも あるから、勉強の 時間は ほとんど ないね！"]},
                {q:"どう したら バランスよく すごせる？", a:["ゲームは 1日 1〜2時間 までと 決めて、休む時間も つくる", "もっと ゲームを ふやす", "ねる 時間を へらして ゲームする"], hint:["紘｜ねる 時間を へらすと 次の 日が つらいし、ゲームを ふやすと 勉強が できなくなるよ。"],
                    ok:["紘｜そう！ 好きな ことも 楽しみながら、時間を 決めて つきあおう。", "竜也｜よし、今日から 約束だ！", "なぞ③ 『ゲームと 時間』を とけた！"]}]}
    ],
    talks:[["お父さん", ["お父さん｜母さんが 出て いってしまった…。この 町は 暗くて、来た ときから 不安だったと 言っていたんだ。", "お父さん｜紘、母さんを 追いかけてくれ。たのんだぞ。"]],
        ["お母さん", ["お母さん｜…もう この 家は いや。暗いし、こわいし…。（外から 大きな 音が して、車が かべに ぶつかった。だれも ケガは なかった けれど、とても おどろいた 夜だった）"]]],
    trap:{name:"うごく かげ", pre:["うごく かげ｜ゆらり…ゆらり…。（暗い 道の かげから ノイズが のびてきた！）"], post:["蒼井｜かげは 光に よわいんだ。ほら、街灯が ついたよ！"]},
    mobs:[["🌑", "かげっぽ"], ["🕯️", "ろうそくん"], ["🌫️", "きりノイズ"]],
    boss:{name:"くらやみノイズ『おうち なんて』", emo:"🌑", img:"yh3_boss", acts:[["まっくらな うず", 1, 0.9, 0.9], ["ひとりぼっち ストンプ", 0, 1, 1.3], ["にげだしたい さけび", 0, 0.7, 1.8]], say:"くらやみノイズ「こんな 家、もう いやだ…！ 出ていくんだ…！」"},
    pre:["お母さん｜もう こんな 家は いや！ ここは 暗くて、こわいの！ 出ていく！", "紘｜お母さん、待って！ …ふり返ると、道の 先が まっくらに！", "くらやみノイズ｜出ていけ…出ていけ…。みんな ばらばらに なれば いい…。", "ひなた｜お兄ちゃん、お母さんが ノイズの 向こうに！", "紘｜{名前}{くん}、みんな！ おうちの 明かりを 取りもどそう！"],
    post:["紘｜お母さん！ こんな 環境が つらいからって 逃げて いいの？ ぼくは みんなを 助ける ヒーローに なりたい。それが『紘』という 名前の 由来なんだ！", "お母さん｜…紘、よく その 由来を 知ってるね。息子に そこまで 言われたら 戻るしか ないわね。", "お母さん｜さっきは 勝手に 出て いって ごめんなさい。紘に 気づかされたの。こんな 親じゃ ダメよね。", "お父さん｜帰ってきて くれて よかった。みんなで 家に 帰ろう。", "ひなた｜お兄ちゃん、かっこよかった！"],
    end:["蒼井｜紘くん、家族を 助けるって すごいよ。ぼくも そんな ヒーローに なりたいな。", "紘｜助けあうのが ヒーローだよ。蒼井くんも もう ヒーローだ！"],
    learn:"時間は 大切にして、家族とも 話しあおう。『ここが いやだから 逃げる』のではなく『どうしたら よくなるか』を みんなで 考えよう。"
});

YE(4, {
    title:"なまえ どろぼうと おぼえる ひみつ", sub:"ぜんいんの なまえを 1週間で！", theme:"school", bgm:"town", allies:["蒼井", "康介"],
    intro:["紘｜つぎは 新しい 学校の ゆめ。みんなの 名前が なかなか おぼえられなくて、ずっと 悩んでたんだ。", "康介｜そこで あらわれたのが『なまえ どろぼう ノイズ』。みんなの 名前を ぬすんでる！", "蒼井｜名前が ないと『だれ』か わからなくなっちゃう。紘くんの 力で 取りもどそう！"],
    guide:["紘｜名前を おぼえる コツと、からだの サインの なぞを といて いこう。", "紘｜転校生・康介くん・保健室の 先生 に 話しかけてね。"],
    qs:[
        {who:"転校生", label:"名前を おぼえる コツ", intro:["転校生｜ぼく、クラスの みんなの 名前を おぼえたいんだけど、ぜんぜん だめで…。", "紘｜ぼくは 1週間で 全員 おぼえたよ。あだ名が ある 人は あだ名で 呼ぶ。ない 人は とくちょうで おぼえたんだ。"],
            steps:[{q:"名前を おぼえる コツは？", a:["あだ名や とくちょうと セットで 結びつけて おぼえる", "1回だけ 大声で 読む", "あきらめて 毎日 ちがう 呼び方を する"], hint:["紘｜『メガネの はる くん』みたいに 目立つ とくちょうと くっつけると 思い出しやすいんだ。"], ok:["紘｜そう！ 名前を『とくちょう』に 結びつけると 頭に のこるよ。"]},
                {q:"メガネで ショートヘアで サッカーが 得意な『はるき』くんは だれ？　A：メガネ・ロングヘア・ピアノ　B：メガネ・ショートヘア・サッカー　C：ぼうし・ショートヘア・サッカー", a:["B", "A", "C"], hint:["紘｜ヒントを 3つ そろえて 当てはまる 人を さがそう。"],
                    ok:["紘｜B！ 3つの とくちょうを 結びつけて 名前を 覚える。これが ひみつだよ。", "なぞ① 『名前を おぼえる コツ』を とけた！"]}]},
        {who:"康介", label:"おかしの あんごう", intro:["康介｜ひなたちゃんから、あんごうの 手紙が とどいたよ。『かきす』って 書いてある。", "康介｜ルールは『1つ 前の もじに もどす』。ひらがなの ならびは あ・い・う・え・お・か・き・く・け・こ・さ・し・す… の 順だよ。"],
            steps:[{q:"『かきす』を 1つ 前の もじに もどすと？", a:["おかし", "おもち", "おかね"], hint:["紘｜か → お、き → か、す → し。1つ前の 文字に もどして 読んでみよう。"],
                ok:["紘｜か→お、き→か、す→し。『おかし』！ ひなたの 誕生日に 食べる おかし だね。", "康介｜あんごうは 『ルール』さえ わかれば 読める んだ！", "なぞ② 『おかしの あんごう』を とけた！"]}]},
        {who:"保健室の 先生", label:"からだの サイン", intro:["保健室の 先生｜どうしたの？ 首が いたくて まわらない？ 実は 紘くんも 小学生の とき、朝おきたら 首の 骨が ずれて、まわせなく なったことが あるのよ。"],
            steps:[{q:"首が いたくて まわらない とき、どうする？", a:["むりに まわさず、おうちの 人に 言って 病院へ 行く", "がまんして 体育を する", "自分で ぐいっと 回して なおす"], hint:["紘｜いたい ところを むりに うごかすと、もっと ひどく なる かも しれないよ。"],
                ok:["紘｜そう！ からだの サインは 早めに 大人に そうだんして、お医者さんに 見てもらおう。", "保健室の 先生｜うつぶせで ねない など、お医者さんの 言うことを 守れば、ちゃんと なおるわ。", "なぞ③ 『からだの サイン』を とけた！"]}]}
    ],
    talks:[["給食の おばさん", ["給食の おばさん｜給食は 手を あらって、残さず…と 言いたい けど、ぐあいが 悪い ときは むりしないで ね。", "給食の おばさん｜『はなやか ごはん』は 今日の 新メニュー！ ちょっと 変わった 味だけど 元気が 出るわよ。"]]],
    trap:{name:"なまえふだ", pre:["なまえふだ｜ひらり…。（落ちていた 名札から ノイズが 立ちあがった！）"], post:["康介｜名札を 元の 持ち主に もどして おこう。"]},
    mobs:[["📛", "なふだノイズ"], ["🔖", "しおりノイズ"], ["📇", "めいしノイズ"]],
    boss:{name:"なまえ どろぼう ノイズ", emo:"📛", img:"yh4_boss", acts:[["なまえ ぬすみ", 1, 0.9, 0.9], ["ななしの さけび", 0, 1, 1.3], ["だれ だれ だれ？", 0, 0.7, 1.7]], say:"なまえ どろぼう「だれ？ だれ？ ぼくも 名前が ほしい…！」"},
    pre:["蒼井｜クラスの みんなの 名札が まっしろに！ 名前が ぬすまれた！", "なまえ どろぼう｜名前…名前…。ぼくも 名前が ほしい…。", "康介｜なんだ、さびしかった だけなのか。でも 人の 名前を ぬすむのは やめさせなきゃ。", "紘｜{名前}{くん}、蒼井くん、康介くん。みんなの 名前を 取りもどそう！"],
    post:["なまえ どろぼう｜…ぼくには 名前が ないから、さびしかったんだ。", "紘｜じゃあ、ぼくが つけるよ。きみの 名前は『ナナシ』！ 名前が ない 子から 生まれた、すてきな 名前だ。", "ナナシ｜ナナシ…。ぼくの 名前…！ ありがとう、紘！", "蒼井｜みんなの 名札も 元に もどったよ！"],
    end:["康介｜紘は 人の 気持ちを 読むのが うまいなぁ。", "紘｜名前を よんで もらえると、うれしいもんね。"],
    learn:"おぼえる コツは『結びつける』こと。からだの サインは 早めに 大人に そうだんしよう。名前を よぶのは、あいての 心を あたためる 魔法。"
});

YE(5, {
    title:"ビリから トップへ！ 勉強の まほう", sub:"桃寧の 勉強ノート", theme:"school", bgm:"town", allies:["桃寧", "蒼井"],
    intro:["紘｜つぎは 中学の ゆめ。ぼくは 定期テストで ビリに ちかかった。3点とか 2点とか…。", "桃寧｜こんにちは！ わたし 桃寧。テストで 学年1位を とってる けど、自慢じゃ ないよ。紘くんにも 勉強の コツを 教えたいの。", "蒼井｜おもしろそう！ ぼくも 手伝うよ。", "紘｜勉強が にがてでも、発想力で 勝負だ！ まずは 3つの ミニテストから！"],
    guide:["紘｜勉強は『かんたんな ことから』『覚え方を くふう』が コツだよ。", "紘｜桃寧さん・先生・蒼井くん に 話しかけて、3つの 問題を といて みよう。"],
    qs:[
        {who:"桃寧", label:"Be動詞", intro:["桃寧｜まず 英語の『Be動詞』から いくよ！ 3つ あるの。am・is・are。", "桃寧｜主語に 合わせて 使いわけるの。 I（わたし）は am。 You（あなた）は are。 He / She / It は is だよ。"],
            steps:[{q:"『I ___ a student.』（わたしは 生徒です）に 入るのは？", a:["am", "is", "are"], hint:["桃寧｜I（わたし）の ときは 『am』だよ。"], ok:["桃寧｜せいかい！ I am！"]},
                {q:"『You ___ kind.』（あなたは やさしい）に 入るのは？", a:["are", "am", "is"], hint:["桃寧｜You の ときは『are』だよ。"], ok:["桃寧｜You are！ その 調子！"]},
                {q:"『She ___ my friend.』（彼女は ともだち）に 入るのは？", a:["is", "am", "are"], hint:["桃寧｜She / He / It の ときは『is』だよ。"], ok:["桃寧｜She is！ ぜんぶ せいかい！ Be動詞は これで ばっちり。", "なぞ① 『Be動詞』を とけた！"]}]},
        {who:"数学の 先生", label:"ごろ合わせ", intro:["数学の 先生｜数字を 覚えるには『ごろ合わせ』が べんりだ。√2＝1.41421356… は『ひと よ ひと よ に ひと み ご ろ』（一夜一夜に 人見頃）と 覚える。", "数学の 先生｜1・4・1・4・2・1・3・5・6 の 順だよ。"],
            steps:[{q:"『ひとよ ひとよに ひとみごろ』の『ご』に あたる 数字は？", a:["5", "3", "6"], hint:["先生｜『ひと＝1』『よ＝4』『ひと＝1』『よ＝4』『に＝2』『ひと＝1』『み＝3』『ご＝？』『ろ＝6』。 √2 の 数字（1.41421356）と 見くらべて みよう。"],
                ok:["数学の 先生｜そう！ ご＝5、ろ＝6。 くふうして 覚えれば、むずかしい 数字も 頭に 入るぞ。", "なぞ② 『ごろ合わせ』を とけた！"]}]},
        {who:"蒼井", label:"テストの 平均点", intro:["蒼井｜紘くん、期末テストで 初めて 5教科で 3けたに なったよ！", "蒼井｜点数は 国語 31・数学 92・英語 24・理科 26・社会 27。まず 合計を 出そう。"],
            steps:[{q:"5教科の 合計は？", a:["200点", "190点", "210点"], hint:["蒼井｜31 + 92 = 123、+24 = 147、+26 = 173、+27 = ？"], ok:["蒼井｜合計 200点！ 3けたに なったね！"]},
                {q:"5教科の 平均点は 何点？ （合計 ÷ 5）", a:["40点", "50点", "20点"], hint:["蒼井｜200 ÷ 5 を 計算して みよう。"],
                    ok:["蒼井｜平均 40点！ 前は 1けた だったのに、すごい 進歩だね。", "桃寧｜やった！ 紘くんが がんばった からだよ！", "なぞ③ 『テストの 平均点』を とけた！"]}]}
    ],
    talks:[["校内放送", ["校内放送｜ぴんぽんぱんぽん。きょうは 期末テストの へんきゃく日 です。", "校内放送｜がんばった 人も、がんばれなかった 人も、次の 一歩を ふみだしましょう。"]]],
    trap:{name:"ふえる プリント", pre:["ふえる プリント｜ぺらり…ぺらぺら！（プリントが 山のように ふえて ノイズに なった！）"], post:["桃寧｜やった！ プリントの 山が かたづいたよ。"]},
    mobs:[["📝", "プリントノイズ"], ["📕", "ノートノイズ"], ["🧮", "そろばんノイズ"]],
    boss:{name:"ゼロてんノイズ『どうせ むり』", emo:"0️⃣", img:"yh5_boss", acts:[["どうせ むり ビーム", 1, 0.9, 0.9], ["あきらめ ダイブ", 0, 1, 1.3], ["サボりの かげ", 0, 0.7, 1.7]], say:"ゼロてんノイズ「どうせ むりだよ…。がんばっても ムダなんだ…！」"},
    pre:["ゼロてんノイズ｜どうせ むりだよ…。ぼくは 0点…。がんばっても ムダなんだ…。", "桃寧｜そんなことない！ 紘くんは 発想力の 天才なんだよ。パソコンと IQで、勉強だって 変えられる！", "紘｜ありがとう、桃寧さん。…よし、{名前}{くん}、蒼井くん、『できない』を『できる』に かえよう！"],
    post:["ゼロてんノイズ｜…ぼくは、だれかに『だいじょうぶ』って 言って ほしかっただけ…。", "桃寧｜だいじょうぶ。かんたんな ことから 始めれば いいの。わたしが 教えるよ。", "紘｜ありがとう、桃寧。きみの おかげで 勉強に 目ざめたよ。", "蒼井｜0点の ノイズが 1点に なって、光に なっていく…！"],
    end:["桃寧｜わたしは 紘くんを 元気に したかっただけ。これからも 一緒に がんばろうね！", "紘｜うん！ ありがとう、桃寧！"],
    learn:"できないを できるに かえるのは、かんたんな ことの つみかさね。覚え方を くふうして、わからない ところは 人に 聞こう。"
});


/* ==== game/yh2.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[34]=1;
"use strict";
// ===== やりすぎヒーロー伝説 ② 第6〜10話 =====
//   第6話 とどいた ちょうせんじょう（Lv70） / 第7話 氷の上の ヒロイン（Lv75） / 第8話 ボタンを もった 竜也（Lv80）
//   第9話 せいとかい だいさくせん！（Lv85） / 第10話 試験の日は ちこく しそう！（Lv90）

YE(6, {
    title:"とどいた ちょうせんじょう", sub:"はじめての 差出人 ふめいの 手紙", theme:"town", bgm:"town", allies:["恵美子", "桃寧"],
    intro:["紘｜つぎは 中学3年の ゆめ。冬休みに ミドリ県へ 行ったら、幼なじみの 恵美子に 会ったんだ。", "恵美子｜紘！ また 背が のびたでしょ！ …ねぇ、あそこの 郵便屋さん、紘に 用が あるみたい。", "郵便屋さん｜そこの 君！ こんな 手紙が とどいてたよ。差出人は 書いて ないんだ。", "紘｜『卒業後 公務員試験に 合格して 頭が いいことを アピールせよ』…？ 挑戦状だ！", "桃寧｜（そこへ 桃寧が かけてきた）紘くん！ 受験の 勉強、いっしょに しよう！"],
    guide:["紘｜挑戦状の 手紙と、受験の 勉強。3つの なぞが あるよ。", "紘｜郵便屋さん・恵美子・桃寧 に 話しかけて ね。"],
    qs:[
        {who:"郵便屋さん", label:"手紙の たてよみ", intro:["郵便屋さん｜この 手紙、おかしいんだ。1行ずつ 読んでも 意味が とおらない。", "　　『こんにちは、挑戦者さん。』", "　　『うれしい 知らせが あります。』", "　　『えらばれたのは あなたです。』", "　　『んーと、つづきは 公園で。』", "紘｜行の 『はじめの 文字』を 上から 順番に 読んでみよう。"],
            steps:[{q:"手紙の 各行の 1文字目を たてに 読むと？", a:["こうえん", "こんにち", "えらんで"], hint:["紘｜1行目『こ』、2行目『う』、3行目『え』、4行目『ん』。つなげると？"], ok:["紘｜『こうえん』！ 公園で 次の ヒントが 待ってる。これは『あくろすてぃっく（たてよみ）』という 暗号だよ。", "郵便屋さん｜なるほど、手紙には かくれた 意味が あったのか。", "なぞ① 『手紙の たてよみ』を とけた！"]}]},
        {who:"恵美子", label:"面接の 答え方", intro:["恵美子｜高校の 面接で『志望動機』を 聞かれたら、どう 答える？ 先生は『パソコンが 好きだけじゃ 落とされるぞ』って 言ってたよね。"],
            steps:[{q:"いちばん つたわる 答え方は？", a:["好きな こと・その 理由・入学後に やりたい ことを 具体的に 話す", "『パソコンが 好きです』とだけ 言う", "わからないので だまる"], hint:["紘｜『何が』『なぜ』『どうしたい』が セットで 話せると、聞く 人に よく つたわるよ。"],
                ok:["紘｜そう！『パソコンで プログラムを 作るのが 好き。人の 役に 立つ アプリを 作りたい』みたいに ね。", "恵美子｜いい 答え！ 気持ちが 伝わるよ。", "なぞ② 『面接の 答え方』を とけた！"]}]},
        {who:"桃寧", label:"憲法の 3つの 柱", intro:["桃寧｜公民の 勉強だよ。ヒノモト国の 憲法には 大事な 3つの 柱(原則)が あるの。", "桃寧｜『国民が 国の 主人公（国民主権）』『ひとり一人の 自由や 権利を 守る（基本的人権の尊重）』『なかよく へいわに くらす（平和主義）』。"],
            steps:[{q:"次の うち、憲法の 3つの 柱に 入って いないのは？", a:["お金主義", "国民主権", "平和主義"], hint:["桃寧｜3つの 柱は『国民主権』『基本的人権の尊重』『平和主義』だよ。 ちがうのは どれ かな？"],
                ok:["桃寧｜せいかい！ お金主義は 柱に 入って いないよ。", "紘｜公民は 暗記だけじゃなく『なぜ そう なるか』を 考えると 楽しいね。", "なぞ③ 『憲法の 3つの 柱』を とけた！"]}]}
    ],
    talks:[["受験生", ["受験生｜明日が 入試なんだ…。きんちょうして ねむれない。", "受験生｜…でも 桃寧さんの ノートを 見たら、少し 落ちついたよ。"]]],
    trap:{name:"ふしぎな ポスト", pre:["ふしぎな ポスト｜ガタン！（ポストの 口から 手紙ノイズが ふき出した！）"], post:["恵美子｜ふぅ。ポストの 中は もう からっぽだね。"]},
    mobs:[["💌", "てがみっこ"], ["📮", "ポストノイズ"], ["✉️", "ふうとうノイズ"]],
    boss:{name:"てがみノイズ『ちょうせんじょう』", emo:"💌", img:"yh6_boss", acts:[["紙ふぶき ラッシュ", 1, 0.9, 0.9], ["さしだしにん ふめい", 0, 1, 1.3], ["あて先 まちがい タックル", 0, 0.7, 1.7]], say:"てがみノイズ「ちょうせんじょう は ぜったい！ にげるなよ！」"},
    pre:["てがみノイズ｜差出人は 教えない。公園まで 来られるかな？ ふふふ…！", "桃寧｜（そのとき 桃寧に ほかの ノイズが ささやいた）あなたは 試験に 落ちるわ…！", "桃寧｜…ううん。落ちても 紘くんと 友だちだよ。", "紘｜桃寧、ありがとう。{名前}{くん}、恵美子、桃寧、てがみノイズを 止めよう！"],
    post:["てがみノイズ｜…ただの 手紙に もどる…。でも 約束だ。シラカバ村で 待っている人が いる…。", "紘｜シラカバ村…？", "桃寧｜（桃寧は 入試で 思いどおりの 結果に ならなかった。けれど…）わたし、都内の 高校に 行くね。でも 友だちは ずっと 友だちだよ。", "紘｜うん。道が 分かれても、友だちは かわらないよ。"],
    end:["恵美子｜紘、挑戦状、ちゃんと 達成してね！ 差出人も 探そう！", "紘｜うん！ 任せて！"],
    learn:"気持ちを つたえる には『何が・なぜ・どうしたい』を 具体的に。結果が ちがっても 友だちは 友だち。"
});

YE(7, {
    title:"氷の上の ヒロイン", sub:"真里香の 大きな 大会", theme:"rink", bgm:"town", allies:["真里香", "蒼井", "康介"],
    intro:["紘｜つぎは 春休みの ゆめ。シラカバ村に 行ったら、フィギュアスケートの 真里香さんに 会ったんだ。", "真里香｜はじめまして！ 次の 大会で 優勝すれば オリンピックに 出られるの。", "康介｜ところが 大会の 日、会場が 急に 暗くなるって 予言が…。", "蒼井｜ていでんノイズが 動き出す！ 真里香さんを 守ろう！"],
    guide:["紘｜大会まで あと すこし。3つの なぞを といて、ていでんノイズに そなえよう。", "紘｜受付・司会者・コーチ に 話しかけて ね。"],
    qs:[
        {who:"受付", label:"大会まで あと 何日？", intro:["受付｜今日は 3月20日。大会は 3月24日 です。", "受付｜練習の 計画を 立てるために『あと 何日か』知りたい そうです。"],
            steps:[{q:"3月20日から 3月24日まで、あと 何日？", a:["4日", "3日", "5日"], hint:["紘｜24 − 20 を 計算 するよ。"], ok:["紘｜24 − 20 = 4日！ 時間の けいかくは 大切だね。", "なぞ① 『大会まで あと 何日？』を とけた！"]}]},
        {who:"司会者", label:"ていでんの とき", intro:["司会者｜もしも 会場が とつぜん 暗く なったら…。みなさんに 正しい 行動を 知って ほしいんです。"],
            steps:[{q:"とつぜん ていでんに なったら、どう する？", a:["あわてず その場で 動かず、明るく なってから 係の 人の 指示で 安全な 場所へ 行く", "走りまわって 出口を さがす", "ひとりで 暗い 場所へ 行く"], hint:["紘｜暗い 中で 走ると、ぶつかったり ころんだり して あぶないよね。"],
                ok:["紘｜そう！ まず 落ちついて、まわりの 人と 声を かけあい、係の 人の 指示を 待つ。これが 安全な 行動だよ。", "司会者｜ありがとう！ みなさんにも つたえます。", "なぞ② 『ていでんの とき』を とけた！"]}]},
        {who:"コーチ", label:"カギの 暗号", intro:["コーチ｜真里香が 閉じこめられた 部屋の カギは 4けたの 暗号だ。", "コーチ｜ヒント：ジャンプの 回転数を 順に ならべる。『ダブル → クワド → シングル → トリプル』。　ダブル＝2回転、シングル＝1回転、トリプル＝3回転、クワド＝4回転。"],
            steps:[{q:"暗号（4けた）は？", a:["2413", "2314", "4213"], hint:["紘｜ダブル＝2、クワド＝4、シングル＝1、トリプル＝3。その 順番に ならべよう。"], ok:["紘｜2・4・1・3 で『2413』！ カギが ひらいた！", "なぞ③ 『カギの 暗号』を とけた！"]}]}
    ],
    talks:[["記者", ["記者｜真里香さんの 4回転ジャンプ、成功すれば 大ニュースですよ！", "記者｜でも 本番は きんちょうするものです。応援しましょう！"]]],
    trap:{name:"こおりの かたまり", pre:["こおりの かたまり｜パキッ！（氷が 割れて つめたい ノイズが とびだした！）"], post:["康介｜氷の ノイズは 熱に よわいんだ。カイロが 役に立ったね。"]},
    mobs:[["🧊", "こおりんぼ"], ["⛸️", "スケートノイズ"], ["❄️", "ゆきひらノイズ"]],
    boss:{name:"ていでんゴースト", emo:"🔌", img:"yh7_boss", acts:[["ぱちん！ ていでん", 1, 0.9, 0.9], ["ブレーカー ダッシュ", 0, 1, 1.3], ["くらやみ カーテン", 0, 0.7, 1.7]], say:"ていでんゴースト「ふふふ… 真っ暗に して あげるよ！」"},
    pre:["司会者｜では 代表として 真里香さん、ひとこと お願いします。", "真里香｜はい。今回の 大会で 優勝すれば 世界の 大会に なるので、精いっぱい がんばります！", "ていでんゴースト｜ぱちん！（会場が 真っ暗に なった！）", "真里香｜きゃーっ！ 氷の 部屋に 閉じこめられた！ 助けてー！", "紘｜あっちの 方角だ！ 寒い 場所に 長く いたら 体が 冷える。急ごう！ {名前}{くん}、みんな、ていでんゴーストを 止めよう！"],
    post:["ていでんゴースト｜…ぼくは、暗い 所が さびしかっただけ…。", "紘｜明かりは みんなで 分けあうものだよ。", "（会場に 明かりが もどった。真里香は ぶじだった！）", "真里香｜坂口くん、ありがとう！ …さあ、本番！ いってきます！", "（3月24日。真里香は 練習では 一度も できなかった 4回転ジャンプを 成功させた！）", "紘｜よっしゃー！", "司会者｜オリンピック 出場権を 得たのは 悪田真里香さんです！", "真里香｜やった…！ 坂口くんの おかげだよ！"],
    end:["真里香｜こうやって 問題を 解決してくれる 人が 好きだな。", "紘｜え！？　ぼくも 真里香さんみたいな 人が 好き…って、あわわ。", "康介｜顔が 赤いぞ、紘。"],
    learn:"ていでんなどの もしもの ときは あわてず 安全な 場所へ。練習で できなかった ことも、仲間の 応援で 本番に 力が 出る。"
});

YE(8, {
    title:"ボタンを もった 竜也", sub:"さびしさの ノイズ", theme:"port", bgm:"town", allies:["真里香", "康介"],
    intro:["紘｜つぎは 3月25日の ゆめ。テレビで『オリンピック延期』の ニュースが 流れたんだ。", "真里香｜せっかく 出られるのに…。でも 病気の 流行は しかたない。", "康介｜ニュースによると、延期の 原因は『ノイズの いたずら』らしい。アカリ湾の 港に 犯人が いる。", "紘｜ぼく、行ってくる。…でも ひとりじゃ 行かないよ。{名前}{くん}、いっしょに 来て！"],
    guide:["紘｜アカリ湾の 港で 竜也くんに 似た 人を 見つけた。なぞを といて 近づこう。", "紘｜通りがかりの 人・港の 係員・ボタンの 前の 看板 に 話しかけて ね。"],
    qs:[
        {who:"通りがかりの 人", label:"ニセの ニュース", intro:["通りがかりの 人｜SNSで『明日 世界が おわる！』って 投稿が 回ってるんだ。みんな こわがってるよ。"],
            steps:[{q:"こんな 投稿を 見たら どうする？", a:["本当か どうか、ニュースや 公式の 発表で たしかめる", "すぐ 友だちに ぜんぶ しらせる", "信じて パニックに なる"], hint:["紘｜みんなに 広める 前に、まず 本当かを たしかめよう。"],
                ok:["紘｜そう！ 情報は『だれが 言ってるか』『ほかの ところでも 言ってるか』を たしかめてから 広げよう。", "通りがかりの 人｜たしかめて みるよ！ ありがとう。", "なぞ① 『ニセの ニュース』を とけた！"]}]},
        {who:"港の 係員", label:"水に 落ちたら", intro:["港の 係員｜ここは 海に 近いから、もし 水に 落ちたら…と 想像して みよう。"],
            steps:[{q:"もし 水に 落ちて しまったら？", a:["あわてず 力を ぬいて あおむけで 浮いて、助けを 待つ", "ひっしに 手足を ばたばた させる", "重たい くつを はいたまま 泳ぎ出す"], hint:["紘｜ばたばた すると 体力を つかうし、水を 飲みやすくなるよ。"],
                ok:["紘｜『浮いて待て』！ 力を ぬいて あおむけに なると、体が 浮きやすいんだ。", "港の 係員｜それが 安全の 基本です。", "なぞ② 『水に 落ちたら』を とけた！"]}]},
        {who:"ボタンの 看板", label:"ボタンの 暗証番号", intro:["ボタンの 看板｜『この ボタンを 止める 番号は ──3つの 数の 和が 15。3つとも ちがう 数で、ぜんぶ 奇数（1・3・5・7・9…）』"],
            steps:[{q:"当てはまる 3つの 数は？", a:["3・5・7", "5・5・5", "2・6・7"], hint:["紘｜『ぜんぶ ちがう』と『ぜんぶ 奇数』と『合計 15』。3つとも 満たす ものを さがそう。"], ok:["紘｜3＋5＋7＝15、ぜんぶ ちがう 奇数！ 『5・5・5』は 同じ数、『2・6・7』は 偶数が まじってる。", "なぞ③ 『ボタンの 暗証番号』を とけた！"]}]}
    ],
    talks:[["消防士さん", ["消防士さん｜公園で 花火ノイズが 光ったが、けが人は いない。みんな 安全に 避難できたぞ。", "消防士さん｜紘くん、むちゃは するなよ。"]]],
    trap:{name:"うみの うず", pre:["うみの うず｜ぐるぐる…。（海面に ノイズの うずが！）"], post:["真里香｜うずは おさまった！ いまのうちに 進もう！"]},
    mobs:[["🌊", "なみノイズ"], ["⚓", "いかりノイズ"], ["🐚", "かいがらノイズ"]],
    boss:{name:"ノイズ竜也『ボタン おとこ』", emo:"🔘", img:"yh8_boss", acts:[["ぽんぽん 花火", 1, 0.9, 0.9], ["さびしさ タックル", 0, 1, 1.3], ["ボタン 連打", 0, 0.7, 1.8]], say:"ノイズ竜也「ぼくは 何を やっても つまらないんだ…！ 見てろ、ボタンを 押すぞ！」"},
    pre:["竜也｜…おう、紘じゃん。おれ、アカリ市に あきたんだ。おもしろい ことが 何も ないから、『ノイズ ボタン』で 大会を のばして やった。", "紘｜竜也くん…。迷惑を かけるのは やめよう、って あれほど 言ったのに。", "竜也｜うるせー！ ここの ボタンを 押したら ぽんぽん 花火が 上がるんだぞ！ …押すぞ！", "（ボタンを 押すと、近くの 公園で 大きな 光と 音が 広がった。けが人は いない。）", "紘｜やめろー！ …竜也くんが ノイズに 飲まれていく！ {名前}{くん}、真里香さん、康介くん、竜也くんを 助けよう！"],
    post:["竜也｜ごほっ…。…ありがとう、紘。ぼくは 人生が つまらなくて、悪い 知恵しか 働かなかった。", "紘｜つまらない ときは、ひとりで ためこまずに 『そうだんする』。ぼくたち 友だちだろ？", "真里香｜（病院で 目を さました紘のそばに 真里香が いた）心配で アカリ市まで 来ちゃった。ひとりで 解決しようなんて 思っちゃ ダメ！ 次に 会うときは それを わすれないでね。", "紘｜うん。…約束する。", "真里香｜オリンピックは 来年に 延期だって。でも 来年 出るから 楽しみに していてね！"],
    end:["竜也｜紘、ごめん。それに ありがとう。…また いっしょに 事件を 解こうぜ！", "紘｜もちろん！"],
    learn:"ニュースは『本当か』をたしかめてから 広める。水に 落ちたら 浮いて待つ。そして 困った ときは ひとりで かかえず 仲間に そうだんしよう。"
});

YE(9, {
    title:"せいとかい だいさくせん！", sub:"演説で 心を うごかせ", theme:"stage", bgm:"castle", allies:["夏海", "愛梨"],
    intro:["紘｜つぎは 高校の ゆめ。パソコン系の 学校で、クラス1位の 夏海さんと いっしょに 勉強して、成績が ぐんぐん 上がったんだ。", "夏海｜検定の 勉強は 友だち どうしで 教えあうと はかどるよ。", "愛梨｜わたしも 手伝う！ 生徒会選挙の 演説、いっしょに 考えよう。", "紘｜面接で 有利に なるように、生徒会に 立候補！ …でも 前回は 熱を 出して 休んじゃった。今回こそ リベンジだ！"],
    guide:["紘｜検定の 問題と、演説の 作り方。3つの なぞを とこう。", "紘｜夏海さん・先生・愛梨さん に 話しかけてね。"],
    qs:[
        {who:"夏海", label:"お店の 資産", intro:["夏海｜簿記(ぼき)の 基本だよ。『資産』は お店が 持っている お金や 商品。『負債』は 借りている お金。『純資産』は 自分の もの。　資産 ＝ 負債 ＋ 純資産。"],
            steps:[{q:"お店の 資産が 100万円、負債(借金)が 40万円。純資産は？", a:["60万円", "140万円", "40万円"], hint:["夏海｜資産 ＝ 負債 ＋ 純資産 だから、純資産 ＝ 資産 − 負債 だよ。100 − 40 は？"], ok:["夏海｜せいかい！ 100 − 40 ＝ 60万円。簿記3級の 基本だね。", "なぞ① 『お店の 資産』を とけた！"]}]},
        {who:"先生", label:"メールの 書き出し", intro:["先生｜ビジネス文書検定の 練習だ。目上の 人に メールを 送る ときは、あいさつと 名乗りが 大事だぞ。"],
            steps:[{q:"先生に 送る メールの 書き出しは？", a:["いつも お世話に なっております。○○です。", "やっほー、先生！", "ねぇ、聞いて！"], hint:["先生｜目上の 人には ていねいな 言葉を 使うのが マナーだ。"], ok:["先生｜よろしい。『お世話に なっております』は 便利な 書き出しだぞ。", "なぞ② 『メールの 書き出し』を とけた！"]}]},
        {who:"愛梨", label:"演説の 組み立て", intro:["愛梨｜人の 心を 動かす 演説には 型が あるんだよ。", "愛梨｜『結論（言いたい こと）→ 理由 → 具体例 → もう一度 結論』。これを『PREP法』って 言うの。"],
            steps:[{q:"心に とどく 演説の 順番は？", a:["結論 → 理由 → 具体例 → もう一度 結論", "オチ → おしまい", "思いつくまま 1時間 話す"], hint:["紘｜最初に 言いたい ことを 言って、最後に もう一度 くり返すと 伝わるよ。"],
                ok:["紘｜そう！ 型を つかえば 話が 整理されて きんちょうも 小さくなる。", "愛梨｜やった！ 本番は 『ちゃんと 伝わる』演説に なるね。", "なぞ③ 『演説の 組み立て』を とけた！"]}]}
    ],
    talks:[["ゆうじ（生徒会）", ["生徒会｜紘の 演説、前回は『茶番劇』って 言われてたよな。", "生徒会｜でも リベンジ 選挙では『最高』って 言う 人も 多かったんだ。"]],
        ["クラスメイト", ["クラスメイト｜検定って たくさん あるね。ビジネス文書、簿記、情報処理…。", "クラスメイト｜紘は 3級から 順に 合格して いったんだよね。すごい。"]]],
    trap:{name:"ふしぎな マイク", pre:["ふしぎな マイク｜キーン！（マイクから ハウリングノイズが とびだした！）"], post:["愛梨｜音量を 下げたら おさまったよ。"]},
    mobs:[["🎤", "マイクノイズ"], ["🎧", "ヘッドホンノイズ"], ["🔊", "スピーカーノイズ"]],
    boss:{name:"きんちょうノイズ『ステージ おばけ』", emo:"🎤", img:"yh9_boss", acts:[["あたまが まっしろ", 1, 0.9, 0.9], ["ドキドキ ビート", 0, 1, 1.3], ["ひざ ガクガク", 0, 0.7, 1.8]], say:"きんちょうノイズ「うまく 話せないぞ…！ 失敗したら どうするんだ…！」"},
    pre:["司会者｜では 生徒会立会演説会、はじまります！", "きんちょうノイズ｜ふふふ…。ステージで あたまが まっしろに なる 魔法を かけてやろう…。", "愛梨｜紘、だいじょうぶ！ 型を 思い出して！", "紘｜結論、理由、具体例、結論…。{名前}{くん}、夏海さん、愛梨さん、一緒に ステージおばけを しずめよう！"],
    post:["きんちょうノイズ｜…ぼくも 失敗が こわかった だけなんだ…。", "紘｜準備すれば、こわさは 小さく なる。失敗しても いいんだ。もう一度 やれば いいんだから。", "（紘の 演説は 大成功。投票の 結果、紘は 無事に 生徒会に 当選した！）", "みんなの 感想｜面白い 演説だったから 投票したよ！　やっぱり 紘の 演説は 最高だ！", "夏海｜おめでとう！ 3級から 1級まで 合格できたのも、毎日 コツコツ 勉強したからだよ。"],
    end:["愛梨｜紘、これからも 生徒会でも 検定でも、いっしょに がんばろうね。", "紘｜うん！"],
    learn:"話す ときは『結論 → 理由 → 具体例 → 結論』。きんちょうは 準備で 小さくなる。失敗しても もう一度 やれば いい。"
});

YE(10, {
    title:"試験の日は ちこく しそう！", sub:"迷い道と 田んぼの 大冒険", theme:"town", bgm:"field", allies:["康介", "蒼井", "夏海"],
    intro:["紘｜つぎは 試験の 日の ゆめ。国家公務員試験の 会場へ 行く 途中、大きな トラブルに 出会ったんだ。", "康介｜時計を 見ろ！ 13時から 試験開始なのに、まだ 駅の 近くだぞ！", "蒼井｜紘くん、ぎりぎりまで 走るのは あぶないよ。落ちついて ルートを 考えよう。", "夏海｜（試験会場の 近くでは 変な 人が 追いかけて くるって うわさ）…気を つけて！"],
    guide:["紘｜ちこく しないための 作戦と、帰り道の 冒険。3つの なぞを とこう。", "紘｜道を 教えてくれる おじさん・田んぼの かかし・電車の おじさん に 話しかけて ね。"],
    qs:[
        {who:"道案内の おじさん", label:"まにあう 方法", intro:["道案内の おじさん｜大学は 駅から 反対方向だよ。ここから 歩くと 30分、走ると 15分 かかる。", "道案内の おじさん｜いま 12時40分。受付は 13時までだ。"],
            steps:[{q:"受付に まにあう 方法は？", a:["走って 向かう（12時55分に 着く）", "歩いて 向かう（13時10分に 着く）", "その場で 立ち止まる"], hint:["紘｜走ると 15分。12時40分 ＋ 15分 ＝ ？ 受付は 13時までだよ。"], ok:["紘｜12時40分 ＋ 15分 ＝ 12時55分！ 受付に まにあう。　ただし 次からは 早めに 家を 出て 余裕を もとう。", "道案内の おじさん｜がんばれ！", "なぞ① 『まにあう 方法』を とけた！"]}]},
        {who:"田んぼの かかし", label:"雨の 田んぼ道", intro:["田んぼの かかし｜試験の あと、土砂降りで 道と 田んぼの 境目が 見えない！ 自転車で 田んぼに ぼちゃんと 落ちたくない…。"],
            steps:[{q:"どう すれば 安全に 帰れる？", a:["水が 流れる 向きを 見て、水が 集まる 低い 側が 田んぼだと 判断して、高い 側(道)を ゆっくり 進む", "目を とじて 全力で 走る", "田んぼの ほうへ 近づく"], hint:["紘｜水は 高い ところから 低い ところへ 流れるよ。水が 集まる ところは？"],
                ok:["紘｜そう！ 水の 流れを 見れば、どちらが 低いかが わかるんだ。ゆっくり 進めば 安全だよ。", "田んぼの かかし｜知恵だな！", "なぞ② 『雨の 田んぼ道』を とけた！"]}]},
        {who:"電車の おじさん", label:"電車の マナー", intro:["電車の おじさん｜公務員を 受ける 人は ぜんぜん だめだ！ だめだ！ だめなんだ！（大声）", "夏海｜まわりの 人が こまってる…。どうしよう。"],
            steps:[{q:"電車で 大声を 出す 人に あったら？", a:["まきこまれないよう 距離を とり、必要なら 駅員さんに しらせる", "同じ 大声で 言い返す", "スマホで 撮って 笑い者にする"], hint:["紘｜けんかに 巻きこまれると 危ないし、時間も 取られるよ。"],
                ok:["紘｜『相手に しない』『大人や 駅員さんに しらせる』が 安全だよ。", "電車の おじさん｜…ふん。（静かになった）", "なぞ③ 『電車の マナー』を とけた！"]}]}
    ],
    talks:[["試験官", ["試験官｜受験票を 見せてください。…席は あちらです。", "試験官｜問題が 解けなくても あわてずに。時間を 見て 解ける 問題から 取り組みましょう。"]]],
    trap:{name:"うごく 時計", pre:["うごく 時計｜チク タク チク タク！（時計が ノイズに なって おそってきた！）"], post:["蒼井｜針が 止まったね。もう ちこくは しないぞ。"]},
    mobs:[["⏰", "めざましノイズ"], ["🕰️", "ふりこノイズ"], ["⌛", "すなどけいノイズ"]],
    boss:{name:"ちこくノイズ『うっかり どけい』", emo:"⏰", img:"yh10_boss", acts:[["ちこく ビーム", 1, 0.9, 0.9], ["あわて ダッシュ", 0, 1, 1.3], ["のんびり ストンプ", 0, 0.7, 1.9]], say:"ちこくノイズ「まだ 時間は あるさ…。ほら、ちこくだ ちこくだ！」"},
    pre:["康介｜やばい、ちこくノイズが 時計を ぐるぐる 回してる！", "ちこくノイズ｜13時まで あと5分…あと3分…あと1分！ さあ 走れ 走れ！", "紘｜ひっしに 走ると 汗が 止まらない。でも 落ちついて、道を 思い出す…。", "蒼井｜紘くん、{名前}{くん}、夏海さん、康介さん、時計を 止めよう！"],
    post:["ちこくノイズ｜…ぼくも 時間に おわれるのが こわかった…。", "紘｜早めに 動けば こわくないよ。『余裕』が 友だちさ。", "（試験は 終わった。紘は 全問 解けず、結果は 全落ち だった。）", "康介｜どんまい！ 来年は 専門学校で リベンジしよう。国家公務員の 問題は 大学共通テストみたいな もんだから、受かったら 本当に 頭いいよ。", "紘｜それな！ 来年の 僕は 国家に 受かるくらいの 頭脳に なってますように！"],
    end:["夏海｜失敗は 終わりじゃないよ。次の 一歩の 材料だよ。", "蒼井｜ぼくたちも いっしょに がんばる！"],
    learn:"余裕を もって 行動する。まよったら 立ち止まって 調べる。失敗は『次の 一歩の ざいりょう』。"
});


/* ==== game/yh3.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[35]=1;
"use strict";
// ===== やりすぎヒーロー伝説 ③ 第11〜15話 =====
//   第11話 マジック たいけつ！（Lv95） / 第12話 ゆめの きょういくじっしゅう（Lv99） / 第13話 さらわれた 桃寧！（Lv99）
//   第14話 ほんとうの やさしさ（Lv99） / 第15話 ロボット紘 だいさくせん！（Lv99）

YE(11, {
    title:"マジック たいけつ！", sub:"拓也との であい", theme:"stage", bgm:"castle", allies:["恵美子", "康介", "真里香"],
    intro:["紘｜つぎは 春の ゆめ。恵美子に さそわれて、全国放送の 生中継で マジックを 披露する ことに なったんだ。", "恵美子｜紘のマジックなら 大盛り上がり まちがいなし！", "康介｜ところが、その 放送を 見ていた『ある人』が『おれの ほうが 上手だ』と 対決を もうしこんできたぞ。", "真里香｜いったい だれ？ …気を つけて、紘！"],
    guide:["紘｜テレビの マジックと、公園での 対決。3つの なぞを といて、マジックの たねを 見やぶろう。", "紘｜恵美子・司会者・手品師マジック に 話しかけてね。"],
    qs:[
        {who:"恵美子", label:"9の マジック", intro:["恵美子｜紘が 先生に 見せた 数字当てマジック、わたしも やってみたい！", "恵美子｜『2〜9の 中から 好きな 数を 1つ 思い浮かべて、9を かけ算して、十の位と 一の位を 足す』。すると…？"],
            steps:[{q:"どの 数を えらんでも、答えは いつも？", a:["9", "18", "えらんだ 数と 同じ"], hint:["紘｜たとえば 2なら 2×9＝18 →1＋8＝？ 3なら 3×9＝27 →2＋7＝？ 試して みよう。"],
                ok:["紘｜2×9＝18→1＋8＝9、3×9＝27→2＋7＝9…。 9の だんは、十の位と 一の位を 足すと いつも 9に なるんだ。 これが たね！", "恵美子｜数学って、そのまま マジックだね！", "なぞ① 『9の マジック』を とけた！"]}]},
        {who:"司会者", label:"トランプの 数", intro:["司会者｜次は トランプの クイズです。ジョーカーを のぞく トランプは 52まい。マークは 4種類（ハート・ダイヤ・クラブ・スペード）で、どれも おなじ まいすうです。"],
            steps:[{q:"ハートの カードは 何まい？", a:["13まい", "12まい", "4まい"], hint:["紘｜52まいを 4つの マークで 同じ数ずつ わけると？ 52 ÷ 4 を 計算 しよう。"], ok:["紘｜52 ÷ 4 ＝ 13まい。 A・2〜10・J・Q・K で 13まいだね。", "なぞ② 『トランプの 数』を とけた！"]}]},
        {who:"手品師マジック", label:"ミスディレクション", intro:["手品師マジック｜マジックの 大事な 技が ひとつ あるぞ。『ミスディレクション』という やつだ。"],
            steps:[{q:"『ミスディレクション』とは？", a:["観客の 注意を べつの ところに 向けさせる 技", "本当に 魔法を 使う こと", "道具を 見せない こと"], hint:["紘｜手に 目を 向けさせて、ほんとうの たねは 別の 場所…。そんな 技だよ。"],
                ok:["紘｜そう！ だまされない 方法は『全体を 見る』こと。 手品師の 動きだけを 見ないのが コツだよ。", "手品師マジック｜よく わかっているな。", "なぞ③ 『ミスディレクション』を とけた！"]}]}
    ],
    talks:[["ファン", ["ファン｜紘さんだー！ 生放送、見てました！ マジック すごかった！", "ファン｜あれ？ むこうに いる 人も マジックの 準備を して いるみたい。"]]],
    trap:{name:"シルクハット", pre:["シルクハット｜ぽんっ！（ぼうしの 中から ノイズの ハトが とびだした！）"], post:["恵美子｜ハトは 空に 帰って いったよ。"]},
    mobs:[["🎩", "ぼうしノイズ"], ["🕊️", "ハトノイズ"], ["🃏", "トランプノイズ"]],
    boss:{name:"マジシャン拓也ノイズ", emo:"🎩", img:"yh11_boss", acts:[["ハトの ふぶき", 1, 0.9, 0.9], ["カード ラッシュ", 0, 1, 1.3], ["ノイズ時限ボール", 1, 0.6, 1.9]], say:"拓也ノイズ「おれの マジックは 本物だ！ 今に 見てろ！」"},
    pre:["拓也｜おい、お前ら。おれと マジック対決だ！ お前より おれの ほうが ずっと 上手い。", "紘｜いいですよ。でも どうして？", "拓也｜テレビを 見て むかついたんだ。おれは 大学でも ひとりぼっちで、人生が つまらない…！", "拓也｜おれが 勝ったら、お前の 正体を 教えろ！　…ふん、おれの マジックは ハトだ。　ぱっ！　（ぼうしから ハトが とびだした）", "紘｜じゃあ ぼくは、大きな 箱で マジックを します。恵美子、この 箱に 入って！", "恵美子｜うん！", "（箱が 光に つつまれて…恵美子は 公園の トイレの 近くから あらわれた！）", "拓也｜くっ！　負けを みとめない！　このノイズ時限ボールを 5分後に 光らせるぞ！", "紘｜まずい！ 自転車を かりる！　{名前}{くん}、時間を かせいで！"],
    post:["（紘は 自転車に ノイズ時限ボールを 乗せて、いっしょうけんめい こいだ。2キロ 先の 湖に ジャンプして ボールを 投げこむ！　ドッカーン！　水しぶきが 虹に なった！）", "拓也｜…負けた。おれの 名前は 拓也。お前は 小学校の ころ 同じ 町に 住んでたやつか…？", "紘｜拓也くん。ひとりぼっちで つまらない なら、ぼくたちと マジック クラブを 作ろう。", "拓也｜…おれが？　…いいのか？", "恵美子｜もちろん！", "拓也｜…ありがとう。　（拓也は うつむいて、小さく わらった）"],
    end:["康介｜拓也、ふくざつな 気持ちだな。", "真里香｜でも 一歩ずつ 友だちに なれるといいね。"],
    learn:"手品の たねは『数』と『注意の そらしかた』。ひとりぼっちで くるしい ときは、声を かけてくれる 人に 頼ってもいい。"
});

YE(12, {
    title:"ゆめの きょういくじっしゅう", sub:"紘殿と 遊びの 授業", theme:"school", bgm:"town", allies:["紘殿", "泉", "真花"],
    intro:["紘｜つぎは ふしぎな ゆめ。18歳の『紘殿』さんが 教育実習で 女子高に 行く、っていう 話だよ。", "泉｜わたし 泉。占い師の たまごなの。紘殿さんは『遊びを 教える』担当らしい。", "真花｜わたし 真花。クラスの 隣の席だよ！", "紘殿｜ふふふ、よろしく なのじゃ。遊びの 授業、はじめるのじゃ！"],
    guide:["紘殿｜遊びは 心を つなぐ 魔法じゃ。3つの 遊びの なぞを とくのじゃ。", "紘殿｜ゆう・さり・真花 に 話しかけるのじゃ。"],
    guideName:"紘殿",
    qs:[
        {who:"ゆう", label:"オセロの かど", intro:["ゆう｜オセロって、かど(すみ)を とると 強いんだよね。どうして？"],
            steps:[{q:"オセロで 4つの かど(すみ)が 有利な 理由は？", a:["かどの 石は 横にも たてにも はさまれないから、ひっくり返されない", "かどが いちばん 大きいから", "かどは 色が かわるから"], hint:["紘殿｜かどの 石は、左右も 上下も 一方向は 外がわ じゃろう？ はさまれる 方向が あるかの？"],
                ok:["紘殿｜そうじゃ！ かどの 石は ひっくり返されない。だから 強いのじゃ。", "ゆう｜なるほど！ 次は かどを ねらうよ！", "なぞ① 『オセロの かど』を とけた！"]}]},
        {who:"さり", label:"折り紙の 広さ", intro:["さり｜折り紙で 遊ぼう！　正方形の 折り紙を 半分に おって、さらに もう一回 半分に おったよ。"],
            steps:[{q:"広さは 元の 何分の1に なった？", a:["4分の1", "2分の1", "3分の1"], hint:["紘殿｜1回 おると 半分(2分の1)。もう1回 おると その また 半分じゃ。"], ok:["紘殿｜1回で 1/2、2回で 1/4じゃ。 折り紙は 算数の 勉強にも なるのじゃ。", "さり｜わーい！ ちっちゃく なった！", "なぞ② 『折り紙の 広さ』を とけた！"]}]},
        {who:"真花", label:"いじわるを 見たら", intro:["真花｜クラスで『こわい 団体』が、わたしの ことを じっと 見て ひそひそ 話してるの…。", "真花｜もし 友だちが いじわるを されていたら、どうするのが いいかな？"],
            steps:[{q:"友だちが いじわるを されている ところを 見たら？", a:["止められるなら 声を かけ、先生や 信頼できる 大人にも すぐ 知らせる", "見て 見ぬふりを する", "いっしょに わらう"], hint:["紘殿｜見て見ぬふりも、いっしょに 笑うのも、いじわるに 力を 貸してしまうのじゃ。"],
                ok:["紘殿｜そうなのじゃ。『ひとりで 解決しなくて いい』。大人や 仲間に 助けを 求めるのも 勇気じゃ。", "真花｜ありがとう、紘殿。少し 安心したよ。", "なぞ③ 『いじわるを 見たら』を とけた！"]}]}
    ],
    talks:[["女子高の 校長先生", ["女子高の 校長先生｜教育実習生の 紘殿くん、頭が 悪い クラスの 担当だが、がんばって くれ。", "女子高の 校長先生｜遊びは 心の 勉強にも なる。たのんだぞ。"]]],
    trap:{name:"かげ ひそひそ", pre:["かげ ひそひそ｜ひそひそ…ひそひそ…。（教室の すみから ノイズが 立ちあがった！）"], post:["泉｜うわさ話の ノイズだったみたい。ぱっと 消えたね。"]},
    mobs:[["👥", "ひそひそノイズ"], ["💭", "うわさノイズ"], ["🗯️", "いやみノイズ"]],
    boss:{name:"いじわるノイズ団『きょうしつの かげ』", emo:"👥", img:"yh12_boss", acts:[["ひそひそ ウェーブ", 1, 0.9, 0.9], ["むし ストンプ", 0, 1, 1.3], ["屋上の つよい かぜ", 1, 0.6, 1.9]], say:"いじわるノイズ団「ふふふ…。もっと ひそひそ してやる！」"},
    pre:["いじわるノイズ団｜憎たらしい 女ね…。真花を 屋上に 呼びだして こわがらせて あげましょう！", "（放課後、屋上から 風が ふきあれた。真花が 強い 風に あおられて、ふちの ほうに ふらふらと！）", "真花｜きゃあ！", "紘殿｜真花！ 手を のばすのじゃ！　（紘殿が 真花の 手を ぎゅっと つかんで 引きもどす。かわりに 紘殿が ふちから 落ちかけた！）", "紘殿｜ぬおー！　ここで 終わる わけには いかないのじゃ！　あの 時 もらった 糸を 使うのじゃ！", "泉｜（地面に 大きな クッションを ひろげて）とどいてるよー！　ここだよ！", "（紘殿は ぶじに クッションの 上に ふわり。）", "紘殿｜ふう…。たすかったのじゃ。ありがとう 泉。　…さあ、{名前}{くん}、いじわる ノイズ団を 止めるのじゃ！"],
    post:["いじわるノイズ団｜…ほんとうは、真花と 仲良く したかったの。話しかけ かたが わからなかっただけ…。", "真花｜わたしも ごめんね。ちゃんと 話しかけ れば よかった。", "紘殿｜いじわるは しても される 人も つらい。これからは 友だちとして 遊ぶのじゃ。", "ゆう｜よかった！ みんな で 遊ぼう！"],
    end:["泉｜（水晶玉を のぞいて）見えた…。『桃寧』という 人が さらわれる 未来が…。　気を つけて！", "紘殿｜ふむ。つぎの 事件が 近いのじゃな。"],
    learn:"遊びは 心を つなぐ。いじわるを 見たら 見すごさず、大人や 仲間に 助けを もとめよう。"
});

YE(13, {
    title:"さらわれた 桃寧！", sub:"ジャパン・クレイジー学園の 3日間", theme:"dream", bgm:"castle", allies:["愛梨", "紘殿", "真花"],
    intro:["泉の 予言どおり、13時に なると 空が まっくらに。桃寧の すがたが ぱっと 消えた！", "紘｜桃寧！　…さらったのは 忍者のように 素早い『将也』という 男の子。", "愛梨｜紘、わたしも 手伝う！　桃寧さんを さがそう。", "紘殿｜桃寧は『ジャパン・クレイジー(JC)学園』にいるらしいのじゃ。3日間の 体験講習で 潜入するのじゃ！"],
    guide:["紘｜体験講習の 3日間。教室で 起こる 事件の なぞを とこう。", "紘｜ゆうじ・あずま・桃寧 に 話しかけて ね。"],
    qs:[
        {who:"あずま", label:"ふくろの シール", intro:["あずま｜桃寧が さらわれた 公園に、『空気ボール』の ふくろが 落ちていたんだ。ふくろには『忍者屋』の シールが。", "あずま｜昨日 持っていた 袋は、将也くんが『忍者屋』、わたしが『星屋』、ゆうじくんが『月屋』。"],
            steps:[{q:"ふくろを 公園に 落とした 可能性が 高いのは？", a:["将也くん", "あずまくん", "ゆうじくん"], hint:["紘｜落ちていた 袋の シールは『忍者屋』。昨日 持っていた 人の シールと くらべよう。"], ok:["紘｜『忍者屋』の 袋を 持っていたのは 将也くん！ シールが 手がかりだ。", "あずま｜やっぱり 将也くんが…。", "なぞ① 『ふくろの シール』を とけた！"]}]},
        {who:"ゆうじ", label:"ネットの いじわる", intro:["ゆうじ｜みんなの グループチャットに『ダサい』『こっちくんな』って 悪口が 書かれて いたんだ…。", "ゆうじ｜どうしたら いい？"],
            steps:[{q:"グループで 悪口を 書かれたら？", a:["返信せず 画面を 保存して、先生や 保護者に 相談する", "悪口で 言いかえす", "ずっと ひとりで なやむ"], hint:["紘｜言いかえすと けんかが ひろがるし、ひとりで なやむと 心が つかれるよ。"], ok:["紘｜画面を 保存すると『しょうこ』に なる。ひとりで かかえず、大人に そうだん しよう。", "ゆうじ｜わかった！ 先生に 話すよ。", "なぞ② 『ネットの いじわる』を とけた！"]}]},
        {who:"桃寧（ふしぎな 声）", label:"英語の あいさつ", intro:["桃寧（ふしぎな 声）｜…紘くん？　わたし、CAに なるために この学校に 来たの。CAは 飛行機の 乗務員さんだよ。", "桃寧（ふしぎな 声）｜英語で『お水を ください』って 言える かな？"],
            steps:[{q:"『お水を ください』を 英語で？", a:["Water, please.", "Please sleep.", "Wait, water."], hint:["紘｜『water』は『水』、『please』は『ください』。"], ok:["桃寧（ふしぎな 声）｜せいかい！ Water, please. その 調子だよ。", "紘｜桃寧の 声は ステージの ほうから 聞こえる…！", "なぞ③ 『英語の あいさつ』を とけた！"]}]}
    ],
    talks:[["先生（かわいい）", ["先生｜今日から 3日間、体験講習を 受ける 坂口くんです。みんな 仲良くしてね。", "先生｜あれ…いすが こわれて いるわね。いたずらかしら？"]]],
    trap:{name:"こわれた いす", pre:["こわれた いす｜ガタ…ガタガタ！（いすが ノイズに なって 立ちあがった！）"], post:["愛梨｜ノイズの いすは 動かなく なったよ。"]},
    mobs:[["🪑", "いすノイズ"], ["🚪", "げたばこノイズ"], ["🖍️", "らくがきノイズ"]],
    boss:{name:"やきもちナイト 将也ノイズ", emo:"🌑", img:"yh13_boss", acts:[["くうき ボール", 1, 0.9, 0.9], ["にんじゃ ダッシュ", 0, 1, 1.3], ["おれの 桃寧！", 0, 0.7, 1.9]], say:"将也ノイズ「桃寧は おれのだ！ 紘なんかに 渡すか！」"},
    pre:["（3日目。学校中が 大さわぎ。体育館の ステージの 上に 将也が 立っている。）", "将也｜みんな 体育館へ 集まれ！　今から この 紘に『おしおき』をする。みんな 見とけよ！", "紘｜（心の中で）ぜったいに 桃寧を 傷つけさせない。考えろ…そうだ！", "紘｜みなさん、この 3日間で たくさん 学びました。いちばん 心に のこったのは、桃寧と 再会できた ことと、あの 事件の 犯人が 将也くん だという こと です。", "将也｜おい！　それ 言うな！", "ゆうじ｜将也、本当なのか？", "桃寧｜…わたし、将也くんに つれて来られたの。本当は つらかった。でも ここしか CAの 専門学校が なかったから…。", "将也｜くそー！　ふたりとも ゆるさねー！", "紘｜そうは させない！　{名前}{くん}、愛梨さん、紘殿さん、真花さん、将也ノイズを 止めよう！"],
    post:["将也｜…ちくしょう。留年して、ひとりぼっちで…桃寧は 優しく してくれた。　…おれ、どうしたら よかったんだ。", "紘｜桃寧が 大事なら『やさしく する』ことだよ。　ねえ、みんなで 話そう。", "桃寧｜将也くん、助けられたよ。でも もう 人を こわがらせないで。", "将也｜……。　（将也は 小さく うなずき、かげのように 消えた）", "桃寧｜坂口、ありがとう！　CAに なれるよう がんばるね！", "紘｜うん！ ぼくも 夢に むかって がんばる。"],
    end:["愛梨｜でも 将也は 消えちゃった。また どこかで 会いそう。", "紘殿｜うむ。その ときまで 力を 蓄えるのじゃ。"],
    learn:"悪口や いじめを ネットで 受けたら、ひとりで かかえず、しょうこを のこして 大人に そうだん。やさしさは 力に なる。"
});

YE(14, {
    title:"ほんとうの やさしさ", sub:"ニセ創輝を 見やぶれ", theme:"lab", bgm:"castle", allies:["沙弥香", "咲来", "紘殿"],
    intro:["紘｜つぎは『将也』の 情報を 手に入れる ために、ある 学校へ 潜入するよ。", "沙弥香｜わたし 沙弥香。この学校に いる『創輝先輩』が とっても かっこいいの！", "咲来｜わたし 咲来。沙弥香の 親友だよ。　…でも この 転校生、バカっぽくない？", "紘殿｜ほっほっほ。じつは 創輝先輩は『将也』が 変装した ニセモノの 疑いが あるのじゃ。見やぶるのじゃ！"],
    guide:["紘殿｜変装を 見やぶる 3つの 手がかりを さがすのじゃ。", "紘殿｜咲来・沙弥香・創輝先輩 に 話しかけるのじゃ。"],
    guideName:"紘殿",
    qs:[
        {who:"咲来", label:"きのうの 天気", intro:["咲来｜創輝先輩は『きのうは 雨で 傘を さして 学校に 来た』って 言ってたの。", "咲来｜でも きのうは 一日じゅう はれて いたような…。"],
            steps:[{q:"創輝先輩の ことばの おかしい ところは？", a:["はれて いた日に『傘を さした』と 言ったところ", "傘を 持っていた ところ", "学校に 来た ところ"], hint:["紘｜きのうの 天気は『はれ』だったよね。はれの日に 傘を さすかな？"], ok:["紘｜天気の くいちがいが 手がかり！　ことばの うそは 見やぶれる。", "咲来｜じゃあ 創輝先輩は ニセモノ…？", "なぞ① 『きのうの 天気』を とけた！"]}]},
        {who:"沙弥香", label:"卓球の 点数", intro:["沙弥香｜体育の 卓球で、11点 先取で 勝ちなんだけど、いま 10対9で 紘くんが リードしてるの。", "沙弥香｜次の 1点を 紘くんが とったら どうなる？"],
            steps:[{q:"10対9の あと、紘が 次の 1点を とると？", a:["11対9で 紘くんの 勝ち", "まだ つづく", "10対10に なる"], hint:["紘｜11点先取だから、先に 11点に なった 人が 勝ちだよ。"], ok:["紘｜10＋1＝11点！　11対9で 勝ち。", "沙弥香｜やったね！　紘くんの 教え方、やさしい！", "なぞ② 『卓球の 点数』を とけた！"]}]},
        {who:"創輝先輩", label:"本当の やさしさ", intro:["創輝先輩｜ふふ、沙弥香さん。ぼくの そばに いれば しあわせに なれるよ。", "沙弥香｜でも…。　紘くんは 本当の やさしさって 何だと 思う？"],
            steps:[{q:"本当に 大切な 人への やさしさとは？", a:["相手の 話を 聞いて、いやがる ことは しない", "命令して 言うことを きかせる", "ほめて ばかり いて、本音は 言わない"], hint:["紘殿｜やさしい フリは すぐ ばれる のじゃ。本当の やさしさは どんな 態度かの？"], ok:["沙弥香｜…わたし、気づいた。　ほんとうに やさしいのは、話を 聞いてくれる 紘くん だよ。", "創輝先輩｜ぐっ…！", "なぞ③ 『本当の やさしさ』を とけた！"]}]}
    ],
    talks:[["校長先生（やさしい）", ["校長先生｜1週間の 講習ですね。ようこそ。　…沙弥香さんは 女子校出身で、素直な 子ですよ。", "校長先生｜でも だまされやすい ところも あります。気に かけて あげてください。"]]],
    trap:{name:"かがみの かげ", pre:["かがみの かげ｜ピカッ！（かがみから ニセモノの 影が とびだした！）"], post:["咲来｜かがみの ノイズは ひびが 入って 消えたよ。"]},
    mobs:[["🪞", "かがみノイズ"], ["🎭", "おめんノイズ"], ["🧥", "へんそうノイズ"]],
    boss:{name:"ニセ創輝ノイズ『へんそう おとこ』", emo:"🎭", img:"yh14_boss", acts:[["かっこつけ ビーム", 1, 0.9, 0.9], ["へんそう チェンジ", 0, 1, 1.3], ["ニセの ほほえみ", 0, 0.7, 1.9]], say:"ニセ創輝ノイズ「ふふ…。見やぶられた 以上、本気で いくぞ！」"},
    pre:["紘｜創輝先輩。ほんとうの あなたは、将也くん ですね。", "創輝（将也）｜…ばれたか。　なぜ だ。なぜ 沙弥香は 紘の ほうへ 行くんだ…！", "沙弥香｜将也さんが 創輝先輩に 化けて いたんですか！？　ひどい！", "将也｜紘に じゃまされて ストレスが たまって…。　　もう、おまえを…！", "（屋上で ふいに ふしぎな 煙玉が 紘の ほうへ ぱっと とんだ。）", "紘殿｜あぶないのじゃ！　（紘殿が 紘を 突きとばして、煙玉を うけた！　紘殿は ばたっと たおれた。）", "紘｜紘殿さん！！", "将也｜ハハハ。またどこかで 会おうな。　（将也は 煙の 向こうへ 消えた。）", "咲来｜…最低！　紘殿さん、気を 失ってる…！", "紘｜（歯をくいしばって）{名前}{くん}、沙弥香さん、咲来さん。ニセ創輝ノイズだけでも 止めよう！"],
    post:["ニセ創輝ノイズ｜…ぐう…。", "（ノイズが とけて 光に なった。）", "沙弥香｜坂口くん、ありがとう。　気づけなくて ごめんね。わたしを 助けてくれて…", "紘｜気にしないで。　それより 紘殿さんが…。", "咲来｜だいじょうぶ！　ただ 気を 失ってるだけ。きっと 目を さますよ。", "紘｜よかった…。　将也、もう絶対に 逃がさないぞ。"],
    end:["沙弥香｜坂口くん…。わたし、あなたの おかげで『ほんとうの やさしさ』が わかったよ。", "紘｜ありがとう。　みんなで、次の 事件を 解決しよう！"],
    learn:"見た目より、心の やさしさが 大切。ことばの うそ(時間・天気のくいちがい)は 見やぶれる。"
});

YE(15, {
    title:"ロボット紘 だいさくせん！", sub:"康介の ひみつ兵器", theme:"lake", bgm:"field", allies:["真里香", "康介", "桃寧"],
    intro:["紘｜つぎは 夏の ゆめ。ある 朝、スマホに『ノイズ花火の 予告』が とどいたんだ。", "康介｜犯人は 拓也かもしれない。それとも 仲間の ノイズか。　紘のスマホと ぼくの パソコン、いつでも つなげておくよ。", "真里香｜今日は 日陰山浜公園で 遊ぶ 約束 だったね。気をつけて いこう！", "桃寧｜わたしも 手伝う！　作戦を 立てよう。"],
    guide:["紘｜遊園地で 追跡と 作戦。3つの なぞを とこう。", "紘｜康介・真里香・桃寧 に 話しかけて ね。"],
    qs:[
        {who:"真里香", label:"にげる 方角", intro:["真里香｜怪しい 人たちが 追いかけてくる！　いま 東を 向いて 自転車に 乗ってるよ。", "康介｜（通信で）次の 角を 右に 曲がって！　そのあと さらに 右へ！"],
            steps:[{q:"東を 向いて 右に 曲がると、どちらを 向く？", a:["南", "北", "西"], hint:["紘｜東を 向いて 右手の 方向を 考えて みよう。地図の 上が 北、右が 東、下が 南だよ。"], ok:["紘｜東を 向いて 右に 曲がると 南！"]},
                {q:"さらに 右に 曲がると？", a:["西", "北", "東"], hint:["紘｜南を 向いて 右手の ほうは どちらかな？"], ok:["紘｜南を 向いて 右は 西！　こうやって 方角を 追いかけると 道に 迷わないね。", "なぞ① 『にげる 方角』を とけた！"]}]},
        {who:"康介", label:"ロボットの 電池", intro:["康介｜じつは 紘そっくりの『ロボット紘』を つくったんだ。満タンなら 3時間（180分）動く。", "康介｜いま 電池が 40％ のこってる。"],
            steps:[{q:"電池が 40％ のこっていると、あと 何分 動く？", a:["72分", "60分", "90分"], hint:["康介｜180分の 40％ ＝ 180 × 0.4 を 計算して みよう。"], ok:["康介｜180 × 0.4 ＝ 72分！　1時間 12分だね。", "なぞ② 『ロボットの 電池』を とけた！"]}]},
        {who:"桃寧", label:"磁石の 追跡", intro:["桃寧｜康介くんが ロボット紘に 磁石を つけたの。それで 位置が わかるんだって。", "桃寧｜磁石に くっつく ものは どれ かな？"],
            steps:[{q:"磁石に くっつくのは どれ？", a:["てつの カギ", "ガラスの コップ", "木の スプーン"], hint:["紘｜磁石は『てつ』に くっつくよ。"], ok:["桃寧｜せいかい！　てつの カギは くっつく。ガラスと 木は くっつかないよ。", "なぞ③ 『磁石の 追跡』を とけた！"]}]}
    ],
    talks:[["遊園地の スタッフ", ["スタッフ｜ノイズ花火の 予告が 出た ため、少し 早めに 閉園します。　　みなさん 安全に 帰りましょう。"]]],
    trap:{name:"ジェットコースター", pre:["ジェットコースター｜ガタガタ…ゴゴゴ！（コースターが ノイズ化して 止まらなくなった！）"], post:["真里香｜ふう…。何周も 回ったけど、もう 酔わなくなったよ。"]},
    mobs:[["🎢", "コースターノイズ"], ["🎡", "かんらんしゃノイズ"], ["🎠", "メリーゴーランドノイズ"]],
    boss:{name:"くろふくの 団ノイズ『ブラック・コンボイ』", emo:"🚗", img:"yh15_boss", acts:[["くろい ライト", 1, 0.9, 0.9], ["コンボイ ラッシュ", 0, 1, 1.3], ["ノイズ光線", 1, 0.6, 1.9]], say:"ブラック・コンボイ「おまえを つかまえるのが 仕事だ！」"},
    pre:["（紅葉公園。黒い ふくの ノイズたちが 8体 待っていた。）", "拓也｜よう、紘。　今日は『小説の 紘』が 実際に 動けるか 試させてもらう。", "真里香｜ヒノモトを ノイズ花火で 爆発させたら、自分も 家族も 巻きこまれる のよ！　わかってるの？", "拓也｜知るか！　おれは 大学でも ひとりぼっちで、つまらない。　夢は 警察に 捕まる ことだ！", "紘｜つかまる 以外にも 道は ある！　相談する、友だちを つくる、…やり方は たくさん あるんだ！", "拓也｜うるせえ！　（拓也は ノイズ光線を 真里香に 向けた！）", "紘｜危ない！！　（紘が 光線を うけて たおれた。）", "真里香｜坂口くん…！　　　もう 許さない。みんな、拓也を 止めて！", "ブラック・コンボイ｜つかまえろー！", "桃寧｜{名前}{くん}、真里香さん、康介さん。わたしたちで コンボイを 止めましょう！"],
    post:["ブラック・コンボイ｜…ぐう。参りました…。", "（拓也は 仲間の ノイズと いっしょに 捕まった。）", "真里香｜坂口くん、今まで ありがとう……。", "（数日後。ヤホーニュース『伝説の 小説家 坂口紘が……！？』）", "康介｜真里香さん、ちょっと いいですか。じつは 紘、無事なんだ。　この動画を 見てください。", "真里香｜え？　ロボットじゃん！", "紘｜やっほー、真里香！　泉さんの 占いで『ぼくが やられる 未来』が 出たから、康介に ロボット紘を つくって もらったんだ。", "真里香｜すごっ…！　　生きてて よかったよ！", "紘｜もう こんな 作戦は しません！"],
    end:["康介｜ロボット紘、役に立ったな。", "桃寧｜みんなで 考えれば 乗りこえられるね。"],
    learn:"方角や 電池の 計算など、数学は 作戦に 役立つ。仲間を 信じて 準備すれば 危険も 乗りこえられる。"
});


/* ==== game/yh4.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[36]=1;
"use strict";
// ===== やりすぎヒーロー伝説 ④ 第16〜20話 =====
//   第16話 遊園地の かなしみ（Lv99） / 第17話 あんごうの とびら（Lv99） / 第18話 ひこうきと なぞとき研究部（Lv99）
//   第19話 タオルの なぞと ドッキリ大作戦（Lv99） / 第20話（最終話） ありがとう ぜんぶの 物語（Lv99）

YE(16, {
    title:"遊園地の かなしみ", sub:"りがんりゅうと やくそく", theme:"shop", bgm:"field", allies:["恵美子", "蒼井"],
    intro:["紘｜つぎは 夏休みの ゆめ。恵美子と 日陰山浜公園へ 遊びに 行ったんだ。", "恵美子｜VRジェットコースターに 乗りたい！　それに 森間コースターも！", "蒼井｜ふふ、紘くんは こわがり だけど、がんばれ！", "紘｜（遠くに ふしぎな 人影が。…あれは、コスプレの 人？　それとも…）"],
    guide:["紘｜遊園地での 3つの なぞ。安全の 知識や 暗号を つかって 解決しよう。", "紘｜チケット売り場・ライフセーバー・看板 に 話しかけて ね。"],
    qs:[
        {who:"チケット売り場", label:"フリーパスの 値段", intro:["チケット売り場｜フリーパスは 1人 3,500円。　2人 いっしょに 買うと 1わり(10％)引き ですよ。"],
            steps:[{q:"2人分の フリーパスは いくら？", a:["6,300円", "7,000円", "6,500円"], hint:["紘｜3,500円 × 2人 ＝ 7,000円。そこから 1わり(10％) 引くと？　7,000 × 0.9 でも いいよ。"], ok:["紘｜7,000円の 1わりは 700円。7,000 − 700 ＝ 6,300円！", "なぞ① 『フリーパスの 値段』を とけた！"]}]},
        {who:"ライフセーバー", label:"りがんりゅう", intro:["ライフセーバー｜海や 湖で 沖へ 流される『離岸流(りがんりゅう)』という 流れが あるんだ。もし つかまったら、どうする？"],
            steps:[{q:"沖へ 流されたとき、正しい 行動は？", a:["岸と 平行に（横に）泳いで 流れから ぬける", "岸に むかって まっすぐ 全力で 泳ぐ", "あきらめて ばたばた する"], hint:["紘｜流れは 沖へ むかっているから、まっすぐ 岸に むかうと 力が つきてしまうよ。"],
                ok:["紘｜そう！ 流れの 幅は せまいから、横に 泳げば ぬけられる。　つかれたら 浮いて、大声で 助けを 呼ぼう。", "ライフセーバー｜その とおり。海では 一人で 遊ばない ことも 大事です。", "なぞ② 『りがんりゅう』を とけた！"]}]},
        {who:"古い 看板", label:"数字の あんごう", intro:["古い 看板｜『2・10・3』…数字が ならんでいる。ヒントの ひょう：1＝あ　2＝い　3＝う　4＝え　5＝お　6＝か　7＝き　8＝く　9＝け　10＝こ"],
            steps:[{q:"『2・10・3』を ひらがなに すると？", a:["いこう", "いくう", "うこい"], hint:["紘｜2＝い、10＝こ、3＝う。　順番に 読んで みよう。"], ok:["紘｜『いこう』！ 看板は『行こう(いこう)』と よびかけて いたんだ。", "なぞ③ 『数字の あんごう』を とけた！"]}]}
    ],
    talks:[["遠野さんの 友だち", ["遠野さんの 友だち｜この 遊園地は、むかし たいへんな 時代に 基地が あった 土地だと 聞いた ことが あります。", "遠野さんの 友だち｜平和を 守るために、わたしたちは 今を 大切に したいですね。"]]],
    trap:{name:"ふしぎな ぬいぐるみ", pre:["ふしぎな ぬいぐるみ｜ぽふん！（遊園地の ぬいぐるみが ノイズに なった！）"], post:["恵美子｜ぬいぐるみは もとの かわいい 姿に もどったよ。"]},
    mobs:[["🎡", "かんらんしゃノイズ"], ["🧸", "ぬいぐるみノイズ"], ["🎈", "ふうせんノイズ"]],
    boss:{name:"にせ きぐるみノイズ『かなしみの コスプレ』", emo:"🦄", img:"yh16_boss", acts:[["ふわふわ ストンプ", 0, 1, 1.3], ["かなしみの ビーム", 1, 0.9, 0.9], ["とけない ほのお？", 1, 0.6, 1.9]], say:"きぐるみノイズ「かなしくて…もう すべて 消えて しまえば いいんだ…！」"},
    pre:["遠野さん｜ごめんなさいね、紘くん。　叔父は むかし、この 土地に あった 基地で かなしい 思いを したの。それで…つい ノイズに 心を 貸して しまって。", "紘｜遠野さん…。ぼくたちは あの 悲しい 時代を くり返さない。国営日陰山浜公園は、みんなが 笑う 場所に します。", "恵美子｜わたしも、新しい 思い出を つくる！", "遠野さん｜…もう いい。やっておしまい！　（遠野さんの 影から きぐるみノイズが 立ちあがった！）", "（ノイズの 手には 大きな 時限ボールが！）", "紘｜まずい！　{名前}{くん}、恵美子、蒼井くん、止めよう！"],
    post:["（紘は 時限ボールを つかんで 森間コースターに 乗り、てっぺんで 空へ 投げた。）", "紘｜5・4・3・2…　いっけー！", "（ドッカーン！　空に 大きな 光の 花が さいた。　紘は コースターの とちゅうで ジャンプして 大きな 木に ふわり。）", "恵美子｜紘！　けがは ない！？", "紘｜だいじょうぶ！　けっこう 楽しかった。　…遠野さん。", "遠野さん｜…ありがとう。わたしは 過去に とらわれて いた。これからは 新しい 思い出を つくりたい。", "（そのとき、物かげから だれかが 小さく つぶやいた。）？？？｜さすが 坂口紘。ノイズ花火を とめたか。", "紘｜今、だれか 呼んだ？", "恵美子｜気のせいじゃ ない？"],
    end:["蒼井｜過去の かなしみも 受けとめて、前へ 進む。　それが 平和への 道かもね。", "紘｜うん。みんなで 笑える 世界に しよう。"],
    learn:"海では 離岸流に 注意。流されたら 横に 泳いで ぬける。過去の かなしみを 知って、平和を 守るために 今を 大切にする。"
});

YE(17, {
    title:"あんごうの とびら", sub:"うそつきを 見やぶれ", theme:"night", bgm:"castle", allies:["恵美子", "桃寧", "蒼井"],
    intro:["紘｜つぎは 夜の 町の ゆめ。桃寧と いっしょに ジグソーパズルを 作った 帰り道、『？？？』が 現れたんだ。", "？？？｜坂口紘。桃寧の お母さんを 返して ほしければ…　あんごう問題を 解け。", "桃寧｜（はっと）あの人、わたしの 友達とも つながっている 人…！", "恵美子｜みんなで 力を 合わせて、とびらを 開けよう！"],
    guide:["紘｜あんごうの とびらが 3つ。ルールを 見つけたら 解けるよ。", "紘｜扉の 番人・桃寧・恵美子 に 話しかけて ね。"],
    qs:[
        {who:"月と日の とびら", label:"MOON と DAY", intro:["月と日の とびら｜扉に ならんだ 文字は『MOON　DAY』。ヒント：英語を 日本語に して、それを 漢字に して 合わせる。"],
            steps:[{q:"『MOON』と『DAY』を 日本語に すると？", a:["月と 日", "星と 夜", "雲と 朝"], hint:["恵美子｜ムーンは 月、デイは 日(ひ)だよ。"], ok:["恵美子｜そう！ MOON＝月、DAY＝日。"]},
                {q:"『月』と『日』を 合わせて 1つの 漢字に すると？", a:["明", "間", "朝"], hint:["紘｜月の となりに 日を ならべて みよう。"], ok:["紘｜『明』！"]},
                {q:"『明』に もう一つ『日』を つけた ことばは？ （読みも 考えよう）", a:["明日（あした）", "昨日（きのう）", "今日（きょう）"], hint:["紘｜『明』＋『日』で できる ことばは？"],
                    ok:["紘｜『明日』、読みは『あした』！　とびらが 開いた！", "なぞ① 『MOON と DAY』を とけた！"]}]},
        {who:"糸と冬の とびら", label:"THREAD と WINTER", intro:["糸と冬の とびら｜2つめの 扉に ならぶ 文字は『THREAD　WINTER　COMPLETED』。　ヒント：やっぱり 日本語に して、漢字 1文字に してから くっつける。"],
            steps:[{q:"『THREAD』『WINTER』『COMPLETED(完了)』を 1文字の 漢字に すると、順に？", a:["糸・冬・了", "針・雪・終", "絹・夏・了"], hint:["桃寧｜スレッドは『糸』、ウインターは『冬』、コンプリーテッドは『終わった(了)』だよ。"], ok:["桃寧｜せいかい！ 糸・冬・了。"]},
                {q:"『糸』と『冬』を 合わせて 1つの 漢字に して、『了』と つなげると？", a:["終了", "完了", "中止"], hint:["紘｜糸＋冬＝『終』。それに『了』を つなげて みよう。"], ok:["紘｜『終了』！　とびらが 開いた。", "なぞ② 『THREAD と WINTER』を とけた！"]}]},
        {who:"五十音の とびら", label:"ひょうの あんごう", intro:["五十音の とびら｜さいごの 扉は 数字。　行(たて)と 段(よこ)で 読む ひょう。", "　　行：1あ　2か　3さ　4た　5な　6は　7ま　　　段：1あ　2い　3う　4え　5お", "　　『5 1』＝ な行の あ段＝『な』。　『2 1』＝ か行の あ段＝『か』。　あんごうは『51　21　71』。"],
            steps:[{q:"『51　21　71』を ひらがなに すると？", a:["なかま", "なはま", "さかな"], hint:["紘｜51＝な行の あ段＝な。　21＝か行の あ段＝か。　71＝ま行の あ段＝？"], ok:["紘｜『な・か・ま』＝『なかま』！　とびらが 開いた！", "なぞ③ 『ひょうの あんごう』を とけた！"]}]}
    ],
    talks:[["桃寧の お母さん", ["桃寧の お母さん｜ありがとう、みなさん。　娘が お世話に なって います。　…むかしは 少し きびしく してしまって ごめんなさいね。", "桃寧の お母さん｜これからも 桃寧の 友だちで いてください。"]]],
    trap:{name:"あんごうの かげ", pre:["あんごうの かげ｜さらさら…。（かべの 文字が かげに なって うごき出した！）"], post:["蒼井｜かげの 文字が 順番に もどって いくよ。"]},
    mobs:[["🔐", "かぎノイズ"], ["🗝️", "かぎあなノイズ"], ["🧩", "ピースノイズ"]],
    boss:{name:"うそつきノイズ『？？？』", emo:"🔐", img:"yh17_boss", acts:[["あやしい ささやき", 1, 0.9, 0.9], ["ニセの うわさ", 0, 1, 1.3], ["うたがいの かげ", 1, 0.6, 1.9]], say:"？？？ノイズ「ほら…みんな おまえを うらぎるぞ…！」"},
    pre:["？？？｜ハハハ、よくわかったな。　　　でも 紘。おまえは だまされてる。みんなに 好きなように 動かされてるだけだ！", "恵美子｜そんなの うそよ！　？？？の 言うことは 聞いちゃだめ。", "？？？｜桃寧は『なんで あんな人を 家に 入れたんだろう』って 言ってたぞ。　信じるか 信じないかは おまえしだい。", "桃寧｜…わたし、そんなこと 言ってないよ！", "紘｜わかってる。　でも、たしかめたい。　{名前}{くん}、桃寧、恵美子、蒼井くん、うそつきノイズを 止めよう！"],
    post:["？？？ノイズ｜…ぐうう…。ほんとうは、ぼくも 友だちが ほしかった。うそを ついてでも、そばに いたかったんだ…。", "紘｜うそは いつか ばれる。でも、正直に 話せば 友だちは できるよ。", "桃寧｜わたしの 友達にも、ごめんなさいって 言わせるね。", "（扉の 向こうから 桃寧の お母さんが 無事に あらわれた。）", "恵美子｜ありがとう！　桃寧さん、お母さんも 助かって よかった！"],
    end:["桃寧｜でもね…ほんとうの 黒幕は もっと 近くに いる 気がする。", "紘｜うん。　　手紙の 差出人も 気になるよね。"],
    learn:"暗号は『ルール』を 見つければ 解ける。他人の ことばや うわさに まどわされず、自分の 目で たしかめよう。"
});

YE(18, {
    title:"ひこうきと なぞとき研究部", sub:"空の 脱出ゲーム", theme:"port", bgm:"castle", allies:["藍里", "由美", "大樹"],
    intro:["紘｜つぎは 初めて 飛行機に 乗る ゆめ。税関の 面接で 出会った 藍里さんも いっしょ！", "藍里｜はじめまして。丸海藍里です。　あなたが 伝説の 坂口くん？　亜理紗の 知り合いなんでしょ？", "由美｜わたしは 謎解き研究部の 由美。大樹と 和佐も いるわ。", "大樹｜今日は 空港で 発表会だぜ。…でも なんだか イヤな 予感がする。"],
    guide:["紘｜空港での 3つの なぞ。安全の ルールと 謎解きの 力を 使おう。", "紘｜手荷物検査・航空整備士・由美 に 話しかけて ね。"],
    qs:[
        {who:"手荷物検査の 係員", label:"持ちこめない もの", intro:["手荷物検査の 係員｜飛行機の 機内に 持ちこめない ものが あります。　安全の ため、液体は 100ml 以内の 容器に 入れる ルールです。"],
            steps:[{q:"機内に 持ちこめないのは？", a:["大きな ペットボトルに 入った ジュース（100mlを こえる 液体）", "ぬいぐるみ", "本"], hint:["紘｜液体は 100ml 以内の 小さな 容器に 入れる ルールだったよね。"], ok:["紘｜そう！ 大きな ボトルの 飲み物は ダメ。 先に 飲み切る か、預ける 荷物に 入れよう。", "手荷物検査の 係員｜ルールを 守って、みんなで 安全に 乗りましょう。", "なぞ① 『持ちこめない もの』を とけた！"]}]},
        {who:"航空整備士", label:"風船の ふしぎ", intro:["航空整備士｜機内で ふうせんが ぷくぷく ふくらんで いたと いう 報告が あった。　なぜ だと 思う？"],
            steps:[{q:"高い 空で 風船が ふくらむ 理由は？", a:["まわりの 気圧が 低く なるから", "風が ふくから", "太陽が 当たるから"], hint:["紘｜高い 場所ほど 空気が うすい。その ぶん まわりから 風船を 押す 力(気圧)は？"], ok:["紘｜そう！ 高い 空では 気圧が 低いから、風船の 中の 空気が ふくらむんだ。", "航空整備士｜よく 知ってるね。", "なぞ② 『風船の ふしぎ』を とけた！"]}]},
        {who:"由美", label:"さかさ読み", intro:["由美｜謎解き研究部の 発表会で 使う 問題よ。　『さかさに 読んでも 同じに なる ことば(回文)』を 見つけて。"],
            steps:[{q:"さかさに 読んでも 同じ ことばは？", a:["しんぶんし", "ひこうき", "くうこう"], hint:["由美｜『ひこうき』を さかさに すると『きうこひ』。同じに ならないね。他の 2つも 試して みよう。"], ok:["由美｜『しんぶんし』を さかさに しても『しんぶんし』！　これを『回文』と いうの。", "なぞ③ 『さかさ読み』を とけた！"]}]}
    ],
    talks:[["キャビンアテンダント（真花）", ["キャビンアテンダント｜いらっしゃいませ。　ご搭乗ありがとうございます。　…わたしは 真花と 言います。", "キャビンアテンダント｜飲み物を お持ちしますね。"]],
        ["和佐", ["和佐｜謎解き研究部の 和佐だよ。　発表会では、みんなで 5つの 問題を 出す 予定なんだ。", "和佐｜緊張するな〜。"]]],
    trap:{name:"荷物カート", pre:["荷物カート｜ゴロゴロ…ガシャン！（カートが ノイズ化して 走り出した！）"], post:["大樹｜止まった！　ふぅ…。危なかった。"]},
    mobs:[["🧳", "スーツケースノイズ"], ["🛫", "ひこうきノイズ"], ["🛬", "ちゃくりくノイズ"]],
    boss:{name:"バルーン・ハイジャッカー", emo:"🎈", img:"yh18_boss", acts:[["ふうせん ばくだん？", 1, 0.9, 0.9], ["ぐるぐる ロープ", 0, 1, 1.3], ["ふくらみ ストンプ", 0, 0.7, 1.9]], say:"ハイジャッカー「おれを とめる だと？　笑わせるな！」"},
    pre:["（機内。ふうせんノイズが パンと はじけた。）", "ハイジャッカー｜おい、てめぇら 静かに しろ！　1人ずつ リボンを くばる。それで 腕を むすべ！", "紘｜（リボンで 腕を むすばれた。でも 縄ぬけの トリックを 使えば、いつでも ほどける。）", "ハイジャッカー｜誰も 逆らうな。　　　…ん？　そこの おまえ、生意気な 顔だな。", "紘｜ばーか！　調子に のるな！", "ハイジャッカー｜うるさい！　（ふうせんの 空気ぶくろで、紘の 顔を ぽよんと 当てた。）", "紘｜こっけー。　（わざと 大げさに ニワトリの まね。）　ニワトリ みたいだろ！", "ハイジャッカー｜ぐぬぬ…。　真花の かわりに この CAを 人質に する！", "紘｜そう させない！　パッ！　（ひとしゅんで リボンを ほどいた。）", "藍里｜紘さん、すごい！", "紘｜{名前}{くん}、藍里さん、由美さん、大樹くん、ハイジャッカーを 止めよう！"],
    post:["ハイジャッカー｜…おれは、好きな 人を うばわれて、ストレスが たまって…。　　　おまえに にた 彼氏が いて、うざくて…。", "紘｜気持ちは わかるけど、人を こわがらせるのは ダメだ。　　　ぼくで よければ 話を 聞くよ。", "ハイジャッカー｜…ありがとう。　（ふうせんの 姿が すこし しぼんだ。）", "由美｜謎解き研究部の 発表会は…予定どおり！　みんなで 問題を 出しあおう！", "（発表会の 会場では、ゲームノイズが『まちがえたら ゲームオーバー』と 脅したが、実際は 何度でも やり直せる ゲームだった。）", "大樹｜なんだ、やり直せるのか！　　よし、全問 クリア！", "紘｜失敗しても 大丈夫。もう一度 挑戦すれば いいんだ。"],
    end:["藍里｜紘さん、あなたは 本当に 頼もしい。", "由美｜また 一緒に 謎解き やろうね！"],
    learn:"空港や 飛行機の ルールは みんなの 安全の ため。高い 空では 気圧が かわる。回文や 暗号で 頭の 体操を しよう。"
});

YE(19, {
    title:"タオルの なぞと ドッキリ大作戦", sub:"税金と クレーム対応", theme:"shop", bgm:"town", allies:["晴夏", "恵美子", "垣内"],
    intro:["紘｜つぎは ミドリ県の ゆめ。恵美子から 相談が 来たんだ。　『ある 散髪屋さんが 売り上げを ごまかして いるかも』って。", "恵美子｜国税局の 人にも 協力して もらえるって。　紘、証拠を 見つけて！", "晴夏｜わたしも いくよ。かっきー(垣内)にも 運転を お願いするね。", "垣内｜まかせて。安全運転で いこう。"],
    guide:["紘｜税金の なぞと、クレーム対応の なぞ。3つ解こう。", "紘｜国税局の 人・雄太・おじさん に 話しかけて ね。"],
    qs:[
        {who:"国税局の 人", label:"タオルの 数", intro:["国税局の 人｜散髪屋さんは カット 1,500円。　お客さん 1人に つき タオルを 1まい 使います。　きのうは タオルを 40まい 使って いました。"],
            steps:[{q:"きのうの 売り上げは いくらの はず？", a:["60,000円", "15,000円", "40,000円"], hint:["紘｜1,500円 × 40人 ＝ ？"], ok:["紘｜1,500 × 40 ＝ 60,000円！"]},
                {q:"お店は『きのうの 売り上げは 40,000円』と 申告した。ごまかした 金額は？", a:["20,000円", "10,000円", "40,000円"], hint:["紘｜60,000 − 40,000 ＝ ？"],
                    ok:["紘｜20,000円 ごまかして いた！　証拠は『タオルの 数』。　税金は 道路や 学校を つくる ための みんなの お金だから、ちゃんと はらおうね。", "店長さん｜…すみません。きちんと 申告します。", "なぞ① 『タオルの 数』を とけた！"]}]},
        {who:"雄太", label:"あくびの なぞ", intro:["雄太｜問題だ。あくびが 人から 人へ うつる 理由は？", "晴夏｜（雄太くん、すぐ 問題を 出して 馬鹿に するの…）"],
            steps:[{q:"あくびが うつる 理由は？", a:["相手の 気持ちに 共感(きょうかん)しているから", "空気が うすいから", "ねむい 人は ぜんいん うつるから"], hint:["紘｜親しい 人ほど うつりやすい。それは どんな 気持ち かな？"],
                ok:["紘｜そう！ 共感しているから、親しい 人の あくびは うつりやすい。　　雄太くん、問題を 出しても 馬鹿にしないで ほしい。　晴夏さんは ストレスを 感じてるよ。", "雄太｜…そうだったのか。　これからは 気をつけます。", "なぞ② 『あくびの なぞ』を とけた！"]}]},
        {who:"スマホ相談の おじさん", label:"クレーム対応", intro:["スマホ相談の おじさん｜スマホの 使い方を 全部 教えて ほしいんだが…　うまく 説明できなくてな。", "紘｜クレームや 相談の 対応には 3つの 手順が あります。　順番に 考えよう。"],
            steps:[{q:"まず する ことは？", a:["用件(ようけん)を ていねいに 聞く", "反論する", "無視する"], hint:["紘｜相手の 話を 聞く ことが 最初の 一歩だよ。"], ok:["紘｜そう！ まず 用件を ていねいに 聞こう。"]},
                {q:"つぎに 聞く ことは？", a:["何を 優先して 解決したいか", "相手の 年れい", "自分の 言い訳"], hint:["紘｜いちばん 困っている ことを 先に 解決して あげよう。"], ok:["紘｜そう！ 優先順位を 聞くんだ。"]},
                {q:"さいごに する ことは？", a:["納得して もらえたか 確認する", "話を 打ち切る", "お客さんを 帰らせる"], hint:["紘｜相手が 納得したか、ちゃんと 確かめよう。"], ok:["紘｜そう！ 納得を 確認する。　それでも ダメなら 上司に 相談しよう。", "おじさん｜ありがとう。わかった気が するよ。", "なぞ③ 『クレーム対応』を とけた！"]}]}
    ],
    talks:[["凪（ドッキリ係）", ["凪｜ふふふ、ドッキリ大作戦の 準備中です。　　　紘くんの 対応力を 見たかっただけですよ。", "凪｜…炭酸が のめない ことを わすれていました。ごめんなさい。"]],
        ["智也", ["智也｜謎解き研究部の 智也だ。　凪の 彼氏でもある。　ドッキリには 少し 付きあわされたよ。"]]],
    trap:{name:"タオルの 山", pre:["タオルの 山｜もこもこ…！（タオルが ノイズに なって ふくらんだ！）"], post:["恵美子｜タオルは ふわふわに もどったよ。"]},
    mobs:[["🧺", "せんたくノイズ"], ["🧼", "せっけんノイズ"], ["🪒", "ヘアノイズ"]],
    boss:{name:"ドッキリ司会ノイズ『しかけ おじさん』", emo:"🎪", img:"yh19_boss", acts:[["ドッキリ ぱんぱん", 1, 0.9, 0.9], ["びっくり ストンプ", 0, 1, 1.3], ["ネタばらし ビーム", 1, 0.6, 1.9]], say:"ドッキリ司会「ドッキリ大成功…と 思ったかい？　まだまだ これからだ！」"},
    pre:["（凪の 家。炭酸ジュースで ふいを つかれた 紘は ごほごほ。）", "凪｜笑。本当は『謎解き問題を 1つでも まちがえたら 晴夏さんが たいへんな ことに』というドッキリです。", "晴夏｜わたし、紘を 恨んでるフリしてた…ごめん！", "紘｜（ほっと）ドッキリか…。でも 心臓に わるいよ！", "ドッキリ司会ノイズ｜ドッキリ大成功！…でも ここから 本番だよ。　ノイズの ドッキリで みんなを 怖がらせるのが ぼくの 仕事！", "紘｜それは 迷惑だ。　{名前}{くん}、晴夏さん、恵美子、垣内さん、ドッキリ司会ノイズを 止めよう！"],
    post:["ドッキリ司会ノイズ｜…ぼくも みんなを 笑わせたかった だけ。　　怖がらせるのは ちがうって、わかったよ。", "凪｜お父さんが 税金を 払って 前に 進めるなら、わたしは 応援する。　紘くん、ありがとう。", "紘｜みんなを 笑わせる ドッキリは いいけど、怖がらせたり 傷つけたり するのは ダメだよ。", "ドッキリ司会ノイズ｜うん。　今度は 笑顔の ドッキリを 考えるよ。"],
    end:["晴夏｜ごめんね、いろいろと。　　紘、これからも 友達だよ。", "紘｜うん！"],
    learn:"税金は みんなの くらしを 支える お金。証拠は 身近な ところ(タオルの 数)に ある。クレーム対応は『聞く→優先→確認』。あくびは 共感の しるし。"
});

YE(20, {
    title:"ありがとう ぜんぶの 物語", sub:"ゆめの 王と さいごの 手紙", theme:"dream", bgm:"demoncastle", allies:["愛梨", "玲実", "康介"],
    intro:["紘｜いよいよ 最終話。ここまで 来てくれて ありがとう、{名前}{くん}。", "愛梨｜わたしは 愛梨。　紘が 骨を ケガして 入院している あいだ、事務所を 手伝ってくれた 友だちだよ。", "玲実｜わたしは 玲実。　将也の 幼なじみで、彼の 気持ちを いちばん 知っている。　　将也を 止めるのを 手伝わせて。", "康介｜ヘリコプターも ぼくに まかせて。　最後の 仲間だよ！", "紘｜それじゃあ、4つの 最後の なぞを 解こう。"],
    guide:["紘｜最後の なぞは 4つ。　お金の 考え方、井戸の 水、残り1秒の ボタン、そして…今までの 手紙の 文字！", "紘｜秋弥・愛梨・ボタンの 係・ゆめの 日記 に 話しかけて ね。"],
    qs:[
        {who:"秋弥", label:"お金と 人気", intro:["秋弥｜おれは 人気者に なりたくて、お金持ちに なりたかった。　お金が あれば 人気者に なれるのかな？", "紘｜（ぼくは 大貧民だけど…）　考えて みよう。"],
            steps:[{q:"お金と 人気の 関係は？", a:["人気者かどうかは お金ではなく、思いやりや 人がらで きまる", "お金が あれば かならず 人気者に なれる", "お金は 人気と まったく 関係ないと 言い切れる"], hint:["紘｜お金が あっても、いじわるな 人は 人気者に なれないよ。　　でも お金は くらしに 役立つ ことも ある。どちらも 大切だよ。"],
                ok:["紘｜そう！ 人気者は『思いやり』や『人がら』で きまる。お金は 手段の 1つに すぎないよ。", "秋弥｜…わかった。おれは 自分らしく がんばる。", "なぞ① 『お金と 人気』を とけた！"]}]},
        {who:"愛梨", label:"井戸の 水", intro:["愛梨｜わたし、古い 井戸の 底に 閉じこめられた ことが あったの。　紘と 玲実が ホースで 水を 入れて 助けてくれた。", "愛梨｜水面が 1分で 20cm ずつ あがるとして、あと 200cm(2m)上げたいとき、何分かかる？"],
            steps:[{q:"200cm 上げるのに かかる 時間は？", a:["10分", "20分", "5分"], hint:["紘｜200 ÷ 20 を 計算しよう。"], ok:["紘｜200 ÷ 20 ＝ 10分！　愛梨さんは 水に 浮いて 引っぱられ、無事に 地上へ。", "愛梨｜ありがとう、紘！", "なぞ② 『井戸の 水』を とけた！"]}]},
        {who:"ボタンの 係", label:"残り1秒", intro:["ボタンの 係｜ふしぎな メモに こう 書いて ある。　『ノイズ時限ボタンは 残り 1秒の タイミングで 押すと 止まる』", "ボタンの 係｜カウントは 5・4・3・2・1…。　どのタイミング？"],
            steps:[{q:"どの タイミングで 押す？", a:["『1』の ときに 押す", "『5』の ときに 押す", "『0』に なってから 押す"], hint:["紘｜メモには『残り1秒』と 書いて あるよ。0に なってからでは 遅い かもしれない。"],
                ok:["紘｜『1』の ときに 押す！　　　自分の 力を 信じて、メモを 信じて…　押した！", "（トイレの ほうから ピピポパンと 音が して、水が いきおいよく 流れた。　ノイズ時限ボタンは 止まった。）", "なぞ③ 『残り1秒』を とけた！"]}]},
        {who:"ゆめの 日記", label:"20もじの 手紙", intro:["ゆめの 日記｜これまでに とどいた 手紙の 文字を 集めるよ。　1話から 順に：", "　　ゆ・う・き・と・ち・え・と・や・さ・し・さ・で・じ・ん・せ・い・は・か・わ・る"],
            steps:[{q:"20もじを 順番に 読むと、どんな 文に なる？", a:["ゆうきと ちえと やさしさで じんせいは かわる", "ゆうきと ちえと やさしさで じんせいは まもる", "ゆめと ちえと おかねで じんせいは かわる"], hint:["紘｜1話から 20話まで、順番に 読んで みよう。"],
                ok:["紘｜『ゆうきと ちえと やさしさで じんせいは かわる』…！", "（日記の ページが ひかりに つつまれた。）", "なぞ④ 『20もじの 手紙』を とけた！"]}]}
    ],
    talks:[["康介（ヘリ係）", ["康介｜ヘリコプターは いつでも 準備 オーケー。　最後まで 見守っているよ。"]]],
    trap:{name:"ゆめの かけら", pre:["ゆめの かけら｜きらり…。（日記の かけらが ノイズに なった！）"], post:["玲実｜ふぅ…。いまのは 最後の わなね。"]},
    mobs:[["🌙", "つきノイズ"], ["⭐", "ほしノイズ"], ["🌌", "ゆめノイズ"]],
    boss:{name:"ゆめの 王 将也・ファイナル", emo:"👑", img:"yh20_boss", acts:[["さびしさの うず", 1, 0.9, 0.9], ["ゆめ くいの つめ", 0, 1, 1.3], ["最後の さけび", 1, 0.7, 2.0], ["やきもちの 光", 0, 0.6, 1.8]], say:"将也「ひとりは いやだ…！　だれか、おれを 見てくれ…！」"},
    pre:["（ビルの 屋上。将也が 立っていた。）", "将也｜待ってたぞ、紘。　　おれは『ゆめの 王』に なる。　みんなを ひとりぼっちに させない…　かわりに、みんな ここに 閉じこめるんだ。", "玲実｜将也。　昔みたいに わたしと 話そう。あなたは いじめられたり、お金が なくて つらかったよね。", "将也｜…玲実。　　　　でも もう おそい。　ノイズに 心を 渡してしまった。", "紘｜おそくない。　　　　将也。ぼくが 全部、受けとめる。　　　{名前}{くん}、愛梨さん、玲実さん、康介くん、最後の たたかいだ！"],
    post:["将也ノイズ｜…うう…。　　（ノイズが はがれて、将也が 光の 中に たおれた。）", "将也｜…ごめん。みんなに 迷惑を かけた。　　おれは ほんとうは、だれかに『だいじょうぶ』って 言って ほしかった…。", "玲実｜わたしも ごめん。もっと 早く 話を 聞けば よかった。", "紘｜将也。　みんなで、新しい 一歩を 歩こう。", "将也｜…ありがとう。　　（将也は 玲実と 並んで 空を 見あげた。）", "（朝。ヘリコプターから 康介が 手を ふった。）", "アナウンサー｜昨夜、坂口紘が これまでの 事件を 全て 解決しました。　一言どうぞ！", "紘｜いや〜、人生いろいろ ありますが、良い ことも 悪い ことも あるから がんばれたんです。　みなさんに ご心配を おかけしました。　平和に できて 感謝しています。", "桃寧｜坂口、ほんとうに ありがとう。救世主だよ！", "愛梨｜この 20年間、すごい 人生だったね。"],
    end:["紘｜（日記が ぱたんと 閉じる。　最後の ページに 『差出人』の 名前が 浮かんだ…）"],
    learn:"人生は 勇気と 知恵と やさしさで かえられる。そして ひとりで かかえこまず、仲間と 助けあう ことが いちばん つよい。"
});

// ---------------------------------------------------------------- 最終話の エンディング（手紙の 差出人／職業ぜんぶ Lv99／16個目の 職業『天才』）
RPG_EV.yh_final = YKL([
    "紘｜…日記の さいごの ページが ひかった。　　　　『差出人』の 名前は…", "紘｜{名前}{くん}。　　　きみだ。", "紘｜20もじの 手紙を 書いたのは、きみ。　　ゆめの 外から『がんばれ』って 送ってくれた。　その 声が ぼくの 背中を 押して くれたんだ。",
    "紘｜『ゆうきと ちえと やさしさで じんせいは かわる』…　　きみも、ぼくも、これからの 人生を かえられる。", "渚｜（ふしぎな 光の 中に、これまでの 仲間たちが あらわれた。）　わたしたちの ことを、わすれないでね。", "紘｜ありがとう、{名前}{くん}。　ここまで 一緒に 歩いてくれて。　　最後に…ぼくから プレゼントだ。"
]).concat([["pkcall", "pkYhFinal", ""]]).concat(YKL([
    "（ゆめの 日記が ぱああっと ひかり、きみの 中に あたたかい 力が ながれこんだ！）", "📘 ぜんぶの 職業が レベル99に なった！　　さらに 16個目の 職業『天才』が ひらいたよ！　（メニューの『職業』から 転職できる）",
    "紘｜やりすぎヒーロー伝説＆ドリームストーリー…　これで『完』！　　　また どこかで 会おう！"
])).concat([["gold", 200000], ["item", "special", 10], ["item", "omamori", 5], rpgN("200,000G と スペシャルおにぎり 10こ・ふっかつのおまもり 5こを てにいれた！"), ["set", "e_yh_all"], ["run", "lab_ret_go"]]);
window.pkYhFinal = function(){
    const S = G.S; if(!S) return;
    const j = tqJ();
    TQ_JOBS.filter((d) => !d.genius).forEach((d) => {
        if(!j.mast.includes(d.id)) j.mast.push(d.id);
        j.best[d.id] = 99; if(!j.tried.includes(d.id)) j.tried.push(d.id);
        d.abil.forEach((a) => { j.learned[a.id] = 1; });
    });
    if(j.cur && TQ_JOB_BY[j.cur] && !TQ_JOB_BY[j.cur].genius){ j.jlv = 99; j.jexp = 0; }
    try{ tqTitleCheck(true); }catch(_e){}
    try{ tqClamp(); tqAutoSave(); }catch(_e){}
};


/* ==== game/yh5.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[37]=1;
"use strict";
// ===== やりすぎヒーロー伝説 ⑤ 番外編 第21〜25話（本編 全20話の あとの ゆめの つづき）=====
//   第21話 ひみつの としょかん / 第22話 ひかりの とうだい / 第23話 ふしぎな おてんき ゆうえんち
//   第24話 ごみゼロ だいさくせん / 第25話 ほしぞら キャンプ　（ぜんぶ 推奨Lv99・『ひじょうに むずかしい』で こてい）
//   ※ 人名は 下の名前だけ。じっさいの 人物・場所とは かんけい ありません。こわい 場面は ありません（ノイズ・いたずらに おきかえ）。

// 21話いこうの つよさ（20話までの つづき）
if(Y_POW.length < 30){ [2.70, 2.80, 2.90, 3.00, 3.10, 3.20, 3.30, 3.40, 3.50, 3.60].forEach((v) => Y_POW.push(v)); }
if(Y_LV.length < 30){ for(let i = 0; i < 10; i++) Y_LV.push(99); }

YE(21, {
    title:"ひみつの としょかん", sub:"本の なぞを ときあかせ", theme:"school", bgm:"town", allies:["桃寧", "蒼井"],
    intro:["紘｜ゆめの 日記には まだ つづきが あったんだ。{名前}{くん}、番外編の はじまりだよ。", "紘｜きょうは ふしぎな 図書館。夜になると 本が ぜんぶ 入れかわって しまうんだって。", "桃寧｜だれかが 本の ならびを ぐちゃぐちゃに したのでしょうか。しらべて みましょう。", "蒼井｜よし、まかせて！", "紘｜（おくの 本だなから、かすかな ノイズの 音が きこえる…）"],
    guide:["紘｜図書館での 3つの なぞを といて いこう。本の さがしかたを つかうよ。", "紘｜司書さん・本の 山・読書の 子 に 話しかけて ね。"],
    qs:[
        {who:"司書さん", label:"本の なかまわけ", intro:["司書さん｜この 図書館では 本を 番号で 分けて います。0＝そうれい・百科、4＝しぜん・りか、9＝ものがたり、という ぐあいです。", "司書さん｜『星の ひみつ 図かん』は、どの 番号の 棚に おけば いいかしら？"],
            steps:[{q:"『星の ひみつ 図かん』は どの 棚に おく？", a:["4の 棚（しぜん・りか）", "9の 棚（ものがたり）", "0の 棚（そうれい・百科）"], hint:["紘｜星は 空や 宇宙の 勉強だから『しぜん・りか』の なかまだよ。"],
                ok:["紘｜そう！ 4の 棚。本の 番号は『なかまわけ』の しるし なんだ。", "司書さん｜ありがとう。棚が もとに もどったわ。", "なぞ① 『本の なかまわけ』を とけた！"]}]},
        {who:"本の 山", label:"もくじの なぞ", intro:["本の 山｜『ごはんの ひみつ』という 本の もくじだよ。　1 米の ひみつ…P.4　2 パンの ひみつ…P.12　3 おやさいの ひみつ…P.20　4 おかしの ひみつ…P.28", "桃寧｜もくじは、読みたい ところへ すぐ 行ける 地図の ようですね。"],
            steps:[{q:"『パンの ひみつ』を 読みたい。何ページを ひらく？", a:["12ページ", "4ページ", "20ページ"], hint:["紘｜もくじの『パンの ひみつ』の よこに 書いてある 数字を 見よう。"], ok:["紘｜そう！ P.12 だね。", "本の 山｜よく 読めたね。もう ひとつ！"]},
                {q:"『おかしの ひみつ』は『パンの ひみつ』より 何ページ あとに ある？", a:["16ページ あと", "8ページ あと", "28ページ あと"], hint:["紘｜おかしは P.28、パンは P.12。 ひき算を して みよう。"], ok:["紘｜28 − 12 ＝ 16ページ あと。", "なぞ② 『もくじの なぞ』を とけた！"]}]},
        {who:"読書の 子", label:"しらべかたの ちえ", intro:["読書の 子｜『ペンギンは どうして 氷の 上で へいき なの？』を 調べたいんだ。でも どうやって 調べれば いいのかな？"],
            steps:[{q:"いちばん 正しい 調べかたは？", a:["図かんや 本を 2さつ いじょう くらべて 読み、どの 本かも メモする", "いちばん 最初に 見つけた 1つだけ 信じる", "うわさで 聞いた ことを そのまま 書く"], hint:["紘｜ひとつだけ だと まちがいに 気づけないね。くらべる 方法を 考えよう。"],
                ok:["紘｜そう！ 2つ いじょうを くらべると まちがいに 気づけるし、本の 名前を 書けば あとで たしかめられるよ。", "読書の 子｜やって みる！ ありがとう！", "なぞ③ 『しらべかたの ちえ』を とけた！"]}]}
    ],
    talks:[["本を よむ ねこ", ["本を よむ ねこ｜しーっ…。図書館では しずかに すごすのが きまり ですにゃ。", "本を よむ ねこ｜借りた 本は きれいに つかって、きげんまでに かえす。やくそく ですにゃ。"]]],
    trap:{name:"とびだす しおり", pre:["とびだす しおり｜ぱらぱらぱら…！（本の あいだから しおりノイズが とびだした！）"], post:["桃寧｜しおりも もとの 場所に もどりましたね。"]},
    mobs:[["📖", "ほんノイズ"], ["📚", "ほんだなノイズ"], ["🔖", "しおりノイズ"]],
    boss:{name:"しずけさキング『ぜんぶ ひみつ』", emo:"📕", img:"yh21_boss", acts:[["ひみつの ページ ふぶき", 1, 0.9, 0.9], ["ちえ かくし", 0, 1, 1.3], ["とじこめ ストンプ", 0, 0.7, 1.7]], say:"しずけさキング「だれにも 読ませない…ぜんぶ ひみつに して しまえば いいんだ…！」"},
    pre:["しずけさキング｜本は ぜんぶ ぼくの もの…。しゃべるのも、読むのも、きんしだ！", "桃寧｜本は みんなで 読んで ちえを わけあう ものです。", "蒼井｜ひとりじめは だめだよ！", "紘｜みんなで 本を 取りもどそう！　{名前}{くん}、いくよ！"],
    post:["しずけさキング｜…ほんとうは、さびしかった。だれにも 読まれなく なるのが、こわかったんだ。", "紘｜本は 読まれて、いきいき する もの。今日から みんなで 読もう。", "司書さん｜では、読書会を ひらきましょう。あなたも どうぞ。"],
    end:["桃寧｜知りたい ことを 調べる 楽しさ、たくさんの 人と わけあいたいですね。", "紘｜うん。つぎの ゆめへ 行こう。"],
    learn:"調べものは、もくじや 番号の 分けかたを 使い、2つ いじょうの 本を くらべる。読んだ 本の 名前も メモしよう。"
});

YE(22, {
    title:"ひかりの とうだい", sub:"まいごの 船を みちびけ", theme:"port", bgm:"field", allies:["真里香", "康介"],
    intro:["紘｜つぎは 海の ゆめ。きりの 中に ぽつんと 灯台が たって いるよ。", "真里香｜でも ひかりが 消えかけて いる…。これじゃ 船が まいごに なっちゃう！", "康介｜ひかりの しくみを しらべよう。きっと ノイズが じゃま してる。", "紘｜（きりの むこうから、船の ぼうえんきょうの 音が…）"],
    guide:["紘｜灯台での 3つの なぞを といて いこう。ひかりの リズム・方位・潮の みちひき を 使うよ。", "紘｜とうだいもり・ふなのりさん・かもめの 子 に 話しかけて ね。"],
    qs:[
        {who:"とうだいもり", label:"ひかりの あいず", intro:["とうだいもり｜この 灯台は ひかりを 3びょう ぴかーっと ともして、2びょう 休む。この くりかえしじゃ。", "とうだいもり｜船の 人は、ひかりの リズムで『どこの 灯台か』を 見分けるんじゃよ。"],
            steps:[{q:"ひかり 3びょう ＋ 休み 2びょう で、ひとまわり 何びょう？", a:["5びょう", "3びょう", "6びょう"], hint:["紘｜ひかっている 時間と 休んでいる 時間を たしてみよう。"], ok:["紘｜3 ＋ 2 ＝ 5びょう。これが ひとまわり だね。", "とうだいもり｜ふむ。つぎは どうじゃ？"]},
                {q:"1分（60びょう）では、ひとまわりが 何回 くりかえされる？", a:["12回", "10回", "15回"], hint:["紘｜60 ÷ 5 を 計算してみよう。"], ok:["紘｜60 ÷ 5 ＝ 12回。", "なぞ① 『ひかりの あいず』を とけた！"]}]},
        {who:"ふなのりさん", label:"コンパスの なぞ", intro:["ふなのりさん｜コンパスの はりは、いつも『北』を さすんだ。", "ふなのりさん｜いま 船は 北を むいている。右に 90度 まわると、どっちを むく かな？"],
            steps:[{q:"北を むいた 船が 右に 90度 まわると どっちを むく？", a:["東", "西", "南"], hint:["紘｜北を 上に した 地図で、右の 方向は 何かな？"], ok:["紘｜そう！ 右は『東』。", "ふなのりさん｜じゃあ もう 1回 右に 90度だ。"]},
                {q:"そこから さらに 右に 90度。どっちを むく？", a:["南", "北", "西"], hint:["紘｜東から また 右に まわると…？　北・東・南・西の じゅんに まわって いくよ。"], ok:["紘｜東の つぎは『南』。", "なぞ② 『コンパスの なぞ』を とけた！"]}]},
        {who:"かもめの 子", label:"しおの みちひき", intro:["かもめの 子｜海の 水は 1日に 2回ずつ ふえたり へったり するんだ。いちばん ふえた 時を『満潮(まんちょう)』、いちばん ひいた 時を『干潮(かんちょう)』って いうの。", "かもめの 子｜貝ひろいが したい 子が いるんだけど、いつが いいかな？"],
            steps:[{q:"貝ひろいに いちばん むいて いる のは？", a:["干潮（水が ひいて 砂浜が ひろく なる とき）", "満潮（水が いちばん ふえた とき）", "どちらでも おなじ"], hint:["紘｜貝が いる 砂浜は、水が ひいた 時に ひろく あらわれるよ。"],
                ok:["紘｜そう！ 干潮の 時。ただし 水が ふえはじめる 時間も 調べて、おとなと いっしょに 気を つけよう。", "かもめの 子｜ありがとう！ 時間を しらべて から 行くね！", "なぞ③ 『しおの みちひき』を とけた！"]}]}
    ],
    talks:[["ベテラン 漁師さん", ["漁師さん｜海に 出る ときは、天気と 潮の 時間を かならず たしかめる。ライフジャケットも わすれずにな。"]]],
    trap:{name:"あやしい うきわ", pre:["あやしい うきわ｜ぷくぷく…ぽんっ！（うきわの 中から うみノイズが とびだした！）"], post:["康介｜うきわも 安全な ところに もどせたよ。"]},
    mobs:[["🌊", "なみノイズ"], ["⚓", "いかりノイズ"], ["⛵", "ヨットノイズ"]],
    boss:{name:"きりの かいぶつ『モヤッチ』", emo:"🌫️", img:"yh22_boss", acts:[["きりの かべ", 1, 0.9, 0.9], ["ひかり けし", 0, 1, 1.3], ["まいご ストンプ", 0, 0.7, 1.7]], say:"モヤッチ「ひかりなんて いらない…まっくらに して しまえば いいんだ…！」"},
    pre:["モヤッチ｜もやもやもや…。この 海の ひかりは、ぜんぶ ぼくが 消して やる！", "真里香｜ひかりが 消えたら、船が まいごに なっちゃう！", "康介｜道しるべを まもろう！", "紘｜{名前}{くん}、いっしょに きりを はらおう！"],
    post:["モヤッチ｜…ほんとうは、ぼくも 道を 見つけたかった だけ なんだ…。", "紘｜ひかりが あれば、どこへでも 行けるよ。いっしょに 見に 行こう。", "とうだいもり｜では わしが、ひかりの ともしかたを おしえて あげようかの。"],
    end:["康介｜ひかりも 方位も、まいごに ならない ための ちえ なんだね。", "紘｜うん。つぎの ゆめへ！"],
    learn:"コンパスの はりは 北を さす。右に 90度 まわると 東・南・西の じゅんに かわる。海へ 出る ときは、潮の 時間と 天気を しらべて からに しよう。"
});

YE(23, {
    title:"ふしぎな おてんき ゆうえんち", sub:"空の ひみつと あらしの 王", theme:"park", bgm:"field", allies:["愛梨", "晴夏"],
    intro:["紘｜つぎは 空の ゆめ。ここは おてんきが ころころ かわる ふしぎな 遊園地。", "愛梨｜さっきまで 晴れて いたのに、もう 空が くらく なって きたわ。", "晴夏｜空の ようすを 読めば、きっと なにか わかるはず！", "紘｜（ごろごろ…と、とおくで 音が する）"],
    guide:["紘｜空の ひみつの 3つの なぞを といて いこう。雲・ことわざ・気温の グラフ を 使うよ。", "紘｜てんきの はかせ・お天気ばあちゃん・おんどけいロボ に 話しかけて ね。"],
    qs:[
        {who:"てんきの はかせ", label:"雲の しゅるい", intro:["てんきの はかせ｜空に うかぶ 雲には しゅるいが あるんじゃ。", "てんきの はかせ｜もくもくと 高く そびえる『入道雲(にゅうどうぐも)』は、夏の 午後に にわか雨や かみなりを つれてくる ことが あるぞ。"],
            steps:[{q:"もくもくと 高く 大きく 育つ 雲は どれ？", a:["入道雲（積乱雲）", "うろこ雲", "すじ雲"], hint:["紘｜うろこ雲は 秋の 空に 小さく ならぶ 雲、すじ雲は 細く のびる 雲だよ。"], ok:["紘｜そう！ 入道雲。かみなりや 大雨に 注意の 雲だね。", "てんきの はかせ｜よく 知って おるな。", "なぞ① 『雲の しゅるい』を とけた！"]}]},
        {who:"お天気ばあちゃん", label:"ことわざの ちえ", intro:["お天気ばあちゃん｜むかしから『夕焼けは 晴れ』と いうんじゃ。西の 空が 赤いと、つぎの 日は 晴れる ことが 多いんじゃよ。", "お天気ばあちゃん｜天気は 西から 東へ うつって いく ことが 多いからねぇ。"],
            steps:[{q:"『夕焼けは 晴れ』は、どんな ことを あらわして いる？", a:["夕方 西の 空が 赤いと、つぎの 日は 晴れやすい", "夕方 空が 赤いと かならず 雨", "夕焼けは 朝に 見える"], hint:["紘｜ことわざは むかしの 人の ちえ。『晴れ』の 文字に ちゅうもく！"], ok:["紘｜そう！ ただし 天気は かわりやすいから『やすい』 だよ。", "お天気ばあちゃん｜ふぉっふぉっ。かしこい 子じゃ。", "なぞ② 『ことわざの ちえ』を とけた！"]}]},
        {who:"おんどけいロボ", label:"気温の グラフ", intro:["おんどけいロボ｜今日の 気温を はかったよ。朝9時：18度、正午：24度、午後3時：26度、夕方6時：21度。"],
            steps:[{q:"いちばん 気温が 高かったのは いつ？", a:["午後3時", "正午", "夕方6時"], hint:["紘｜4つの 数字を くらべて、いちばん 大きい ものを えらぼう。"], ok:["紘｜26度の 午後3時！", "おんどけいロボ｜ピピッ！ せいかい。つぎは 差を 計算 するよ。"]},
                {q:"正午と 夕方6時の 気温の 差は 何度？", a:["3度", "6度", "8度"], hint:["紘｜正午は 24度、夕方6時は 21度。 ひき算 だよ。"], ok:["紘｜24 − 21 ＝ 3度。", "なぞ③ 『気温の グラフ』を とけた！"]}]}
    ],
    talks:[["かさを もった 子", ["かさを もった 子｜雨が 降りそうな ときは、かさを もって 出かけるよ。", "かさを もった 子｜かみなりが 鳴ったら、木の 下には いかないで、がんじょうな 建物の 中に にげるんだ。"]]],
    trap:{name:"ふしぎな かさ", pre:["ふしぎな かさ｜ぽんっ！ ぽんっ！（かさが ひらいて、あめノイズが とびだした！）"], post:["愛梨｜かさも もとの かたちに もどったね。"]},
    mobs:[["☁️", "雨雲ノイズ"], ["🌂", "かさノイズ"], ["⚡", "いなずまノイズ"]],
    boss:{name:"あらしの 王『ごろごろ ドーン』", emo:"⛈️", img:"yh23_boss", acts:[["かみなり ストンプ", 0, 1, 1.3], ["どしゃぶり ビーム", 1, 0.9, 0.9], ["こがらし ふぶき", 1, 0.6, 1.9]], say:"ごろごろ ドーン「ぼくの 天気を じゃま するな！　ぜんぶ あらしに して やる！」"},
    pre:["ごろごろ ドーン｜ごろごろ…ドーン！　きょうは ぼくの 日だ！　遊園地ごと あらしに して やる！", "愛梨｜かみなりの 時は あぶないのよ！", "晴夏｜空を 元に もどそう！", "紘｜{名前}{くん}、いくよ！"],
    post:["ごろごろ ドーン｜…ほんとうは、ぼくも 晴れの 日が すきなんだ。", "紘｜じゃあ 今日は いっしょに にじを 見よう。雨の あとの 空には にじが かかるよ。", "晴夏｜ほら、見て！ 空に にじが かかったわ！"],
    end:["愛梨｜空を 見る ことは、あしたを 考える ことにも つながるのね。", "紘｜うん。つぎの ゆめへ 行こう！"],
    learn:"雲の しゅるいや 夕焼け、気温の 変化から 天気の ようすが わかる。かみなりの ときは 木の 下を さけ、がんじょうな 建物に にげよう。"
});

YE(24, {
    title:"ごみゼロ だいさくせん", sub:"町を ぴかぴかに しよう", theme:"town", bgm:"town", allies:["創輝", "藍里"],
    intro:["紘｜つぎは 町の ゆめ。あれ？ 道ばたが ごみの 山で いっぱいだ！", "創輝｜だれが こんなに ちらかしたんだ？", "藍里｜ごみの ちらかしは 町の みんなの 問題ね。分けかたを 思い出して かたづけましょう。", "紘｜（ごみばこの かげから、ポイポイ…という ノイズの 声が）"],
    guide:["紘｜町の 3つの なぞを といて いこう。ごみの 分けかた・3つの アール・水の せつやく を 使うよ。", "紘｜しょうてんがいの 店長・リサイクルロボ・せつやくの 子 に 話しかけて ね。"],
    qs:[
        {who:"しょうてんがいの 店長", label:"ごみの わけかた", intro:["店長｜この 町の きまりでは、ごみを『もえる ごみ』『かん・びん』『ペットボトル』『もえない ごみ』などに 分けて 出すんだ。", "店長｜どこの 町でも、きまりは すこしずつ ちがうから、じぶんの 町の ルールを 見て ほしいな。"],
            steps:[{q:"空きかん は どこへ 出す？", a:["かん・びん", "もえる ごみ", "ペットボトル"], hint:["紘｜かんは 金ぞくで できて いるよ。燃やす ごみとは 別に 分けるよ。"], ok:["紘｜そう！『かん・びん』。きれいに 水で ゆすいで 出すと もっと いいね。", "店長｜助かるよ、ありがとう！", "なぞ① 『ごみの わけかた』を とけた！"]}]},
        {who:"リサイクルロボ", label:"3つの アール", intro:["リサイクルロボ｜ごみを へらす ちえは 3つ。『リデュース(へらす)』『リユース(くりかえし 使う)』『リサイクル(つくりなおす)』ピピッ！"],
            steps:[{q:"マイバッグを もって行って、レジぶくろを もらわない のは どれ？", a:["リデュース（へらす）", "リサイクル（つくりなおす）", "リユース（くりかえし 使う）"], hint:["紘｜ふくろ そのものを 『へらす』 行動 だよね。"], ok:["紘｜そう！ リデュース。ごみが 出る もとを へらすんだ。", "リサイクルロボ｜ピピッ！ つぎの もんだい。"]},
                {q:"小さく なった ふくを、ほかの 人に ゆずる のは どれ？", a:["リユース（くりかえし 使う）", "リデュース（へらす）", "リサイクル（つくりなおす）"], hint:["紘｜ふくの かたちは かえずに、そのまま 使って もらう よ。"], ok:["紘｜そう！ リユース。まだ 使える ものを 大切に するんだ。", "なぞ② 『3つの アール』を とけた！"]}]},
        {who:"せつやくの 子", label:"水の せつやく", intro:["せつやくの 子｜歯みがきの とき、水を 出しっぱなしに すると、1分で およそ 12リットルも 使うんだって。"],
            steps:[{q:"コップに 水を くんで 歯みがきを すると どうなる？", a:["水を ぐっと へらせる", "水が もっと ふえる", "ぜんぜん かわらない"], hint:["紘｜出しっぱなしと、コップ1ぱい だけ。どっちが 水を 使う かな？"], ok:["紘｜そう！ コップを 使えば、水を ぐっと へらせるね。", "せつやくの 子｜ほかにも あるのかな？"]},
                {q:"もし 3分間 出しっぱなしに すると、水は およそ 何リットル？", a:["36リットル", "24リットル", "12リットル"], hint:["紘｜1分で 12リットル。3分なら 12 × 3 だよ。"], ok:["紘｜12 × 3 ＝ 36リットル。たいへん！", "なぞ③ 『水の せつやく』を とけた！"]}]}
    ],
    talks:[["そうじを する おじいさん", ["おじいさん｜町を きれいに すると、気持ちも すっきり するのう。", "おじいさん｜ごみは ごみばこへ。そうじ 当番も たのしいぞ。"]]],
    trap:{name:"ごみぶくろの 山", pre:["ごみぶくろの 山｜ガサガサ…！（ごみぶくろの 山から ポイすてノイズが とびだした！）"], post:["藍里｜ごみぶくろも ちゃんと 分けて、かたづけたわ。"]},
    mobs:[["🗑️", "ごみばこノイズ"], ["🥤", "ペットボトルノイズ"], ["📦", "だんボールノイズ"]],
    boss:{name:"ポイすて王『ごみの やま』", emo:"🗑️", img:"yh24_boss", acts:[["ポイポイ ふぶき", 1, 0.9, 0.9], ["ちらかし ダッシュ", 0, 1, 1.3], ["ごみの やま ストンプ", 0, 0.7, 1.7]], say:"ポイすて王「ぜんぶ ポイだ！　かたづけなんて めんどうだ！」"},
    pre:["ポイすて王｜ぜんぶ ポイ！ ポイ！ ポイ！　町なんて ごみの 山に して やる！", "創輝｜ごみは ぽいぽい 捨てる ものじゃない！", "藍里｜分けて、へらして、つかい直す。それが みんなの 町を まもる 方法 よ。", "紘｜{名前}{くん}、いっしょに かたづけよう！"],
    post:["ポイすて王｜…ぼくが ちらかした ごみを、みんなが 分けて くれたんだね。", "紘｜ひとりで やると たいへんな ことも、みんなで やれば あっと いう まに 終わるよ。", "ポイすて王｜…ごめんなさい。ぼくも そうじを 手伝う！"],
    end:["創輝｜小さな ことから 町は 変わるんだな。", "紘｜うん。つぎの ゆめへ 行こう！"],
    learn:"ごみは きまりどおりに 分けて 出す。へらす（リデュース）・くりかえし 使う（リユース）・つくりなおす（リサイクル）の 3つの アールで ごみを へらそう。水も 大切に 使おう。"
});

YE(25, {
    title:"ほしぞら キャンプ", sub:"北極星と 月の ひみつ", theme:"night", bgm:"field", allies:["凪", "咲来"],
    intro:["紘｜つぎは 夜の ゆめ。ここは 山の 上の キャンプ場。空いっぱいに 星が かがやいて いるよ。", "凪｜…ほんとだ、きれい。でも 星が すこしずつ 消えて いってる。", "咲来｜ノイズの しわざ かな？　星の ひみつを 調べて みよう！", "紘｜（たきびの むこうで、くらやみが ゆらりと うごいた）"],
    guide:["紘｜星空の 3つの なぞを といて いこう。北極星・月の みちかけ・たきびの あんぜん を 使うよ。", "紘｜キャンプの おじさん・ずかんの 子・たきび当番 に 話しかけて ね。"],
    qs:[
        {who:"キャンプの おじさん", label:"北極星の さがしかた", intro:["おじさん｜夜の 空で 北を 知るには『北極星』が 役に立つんだ。", "おじさん｜北斗七星の 先の 2つの 星を つないで、その 長さの 5ばいぶん のばした ところに あるよ。"],
            steps:[{q:"北極星の 見つけかたは どれ？", a:["北斗七星の 先の 2つの 星を つないで のばす", "月の 左はしを まっすぐ たどる", "いちばん 明るい 星を えらぶ"], hint:["紘｜北極星は、じつは そんなに 明るい 星では ないんだ。目印を 使って さがすよ。"], ok:["紘｜そう！ 北極星は ほとんど 動かない から、北の 目印に なるんだ。", "おじさん｜これで まいごに ならない ぞ！", "なぞ① 『北極星の さがしかた』を とけた！"]}]},
        {who:"ずかんの 子", label:"月の みちかけ", intro:["ずかんの 子｜月は 日に よって かたちが かわるよ。まんまるの『満月』、ほそい『三日月』、まったく 見えない『新月』。", "ずかんの 子｜かたちが ひとまわり するのに およそ 29日 かかるんだ。"],
            steps:[{q:"まんまるに 見える 月は どれ？", a:["満月", "新月", "三日月"], hint:["紘｜『満』は 満ちる、いっぱい に なるって いみだよ。"], ok:["紘｜そう！ 満月。", "ずかんの 子｜じゃあ つぎも！"]},
                {q:"月の かたちの ひとまわりが およそ 29日 なら、2回ぶんは およそ 何日？", a:["58日", "29日", "87日"], hint:["紘｜29 × 2 を 計算 しよう。"], ok:["紘｜29 × 2 ＝ 58日。", "なぞ② 『月の みちかけ』を とけた！"]}]},
        {who:"たきび当番", label:"たきびの あんぜん", intro:["たきび当番｜キャンプで たきびを する とき、いちばん 大切なのは『あとしまつ』なんだ。", "たきび当番｜おわる とき、どう すれば いいと 思う？"],
            steps:[{q:"たきびを おわる とき、正しい のは？", a:["水を かけて、火が 完全に 消えた ことを おとなと たしかめる", "そのまま 帰る", "土を すこしだけ かける"], hint:["紘｜見えない 火の こが のこって いると、あとで 火事に なるかも しれないよ。"], ok:["紘｜そう！ しっかり 消えた ことを たしかめる ことが 大切だよ。", "たきび当番｜やくそく だぞ！", "なぞ③ 『たきびの あんぜん』を とけた！"]}]}
    ],
    talks:[["ほしを 見る 子", ["ほしを 見る 子｜しずかに して いると、星が すーっと 流れる ことも あるよ。", "ほしを 見る 子｜流れ星に おねがい するの、まいにち 見張って いるんだ。"]]],
    trap:{name:"あやしい ランタン", pre:["あやしい ランタン｜ぱっ！ ちかちか…！（ランタンから ほしノイズが とびだした！）"], post:["凪｜ランタンの ひかりも おちついたね。"]},
    mobs:[["⭐", "ほしノイズ"], ["🌙", "つきノイズ"], ["🔥", "たきびノイズ"]],
    boss:{name:"くらやみノイズ『ほしけし』", emo:"🌑", img:"yh25_boss", acts:[["ほしけし ビーム", 1, 0.9, 0.9], ["まっくら ストンプ", 0, 1, 1.3], ["ひとりぼっち かぜ", 1, 0.6, 1.9]], say:"ほしけし「ぜんぶ まっくらに なれば いいんだ…！　だれも ぼくを 見て くれない…！」"},
    pre:["ほしけし｜星なんか ぜんぶ 消して やる…！　ぼくだけ 見て くれれば いいんだ！", "凪｜…ひとりぼっちは、さびしいよね。", "咲来｜でも 星を 消して しまったら、みんな 道に まよっちゃう！", "紘｜{名前}{くん}、星空を 取りもどそう！"],
    post:["ほしけし｜…ほんとうは、ぼくも ひかりたかった。ひとりぼっちが いやだった。", "紘｜きみも 小さな 星に なれるよ。みんなの 空には、いろんな 星が あるから。", "ほしけし｜…うん。ありがとう。"],
    end:["咲来｜星も 人も、それぞれが ちがう ひかりを もって いるのね。", "紘｜うん。つぎの ゆめへ 行こう！"],
    learn:"北極星は 北斗七星を 手がかりに さがせる。月は 約29日で かたちが ひとまわり する。火の あとしまつは 水で 完全に 消す。"
});


/* ==== game/yh6.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[38]=1;
"use strict";
// ===== やりすぎヒーロー伝説 ⑥ 番外編 第26〜30話（さいごの ゆめの つづき）=====
//   第26話 おいしい ふしぎ キッチン / 第27話 どうぶつの もり がっこう / 第28話 ゆめの でんしゃ たび
//   第29話 おもいで ミュージアム / 第30話（番外編 さいごの 話） ゆめの そつぎょうしき　（ぜんぶ 推奨Lv99・『ひじょうに むずかしい』で こてい）
//   ※ 人名は 下の名前だけ。じっさいの 人物・場所とは かんけい ありません。こわい 場面は ありません（ノイズ・いたずらに おきかえ）。

YE(26, {
    title:"おいしい ふしぎ キッチン", sub:"はかる・えらぶ・あらう", theme:"shop", bgm:"town", allies:["由美", "大樹"],
    intro:["紘｜つぎは キッチンの ゆめ。ごちそうの においが する…のに、なべも フライパンも ひとりでに うごいて いるよ！", "由美｜りょうりは はかりかたと じゅんばんが 大事。わたしが おしえて あげる！", "大樹｜おなかが すいて きたな。さっさと ノイズを かたづけよう！", "紘｜（なべの ふたが、カタカタと 鳴りはじめた…）"],
    guide:["紘｜キッチンの 3つの なぞを といて いこう。はかりかた・えいよう・手あらい を 使うよ。", "紘｜シェフロボ・えいようの 先生・おばあさん に 話しかけて ね。"],
    qs:[
        {who:"シェフロボ", label:"はかりかた", intro:["シェフロボ｜りょうりは はかりかたが 大事。大さじ1ぱいは 15ミリリットル、小さじ1ぱいは 5ミリリットルだ。ピピッ！"],
            steps:[{q:"大さじ1ぱいは、小さじ 何ばいぶん？", a:["3ばい", "2ばい", "5ばい"], hint:["紘｜15 ÷ 5 を 計算して みよう。"], ok:["紘｜15 ÷ 5 ＝ 3。 小さじ 3ばいで 大さじ 1ぱいだね。", "なぞ① 『はかりかた』を とけた！"]}]},
        {who:"えいようの 先生", label:"赤・黄・緑", intro:["えいようの 先生｜食べものは はたらきで 3つに 分けられるわ。『赤』＝ からだを つくる（肉・魚・たまご・牛にゅう）、『黄』＝ ちからに なる（ごはん・パン・めん）、『緑』＝ からだを ととのえる（やさい・くだもの）。"],
            steps:[{q:"ごはんと パンは どの 色の なかま？", a:["黄（ちからに なる）", "赤（からだを つくる）", "緑（からだを ととのえる）"], hint:["紘｜ごはんや パンは エネルギーの もとに なるよ。"], ok:["紘｜そう！ 黄色の なかまだね。", "えいようの 先生｜じゃあ 次も やってみて。"]},
                {q:"やさいや くだものは どの 色の なかま？", a:["緑（からだを ととのえる）", "赤（からだを つくる）", "黄（ちからに なる）"], hint:["紘｜やさいや くだものは からだの ちょうしを 整えて くれるよ。"], ok:["紘｜そう！ 3つの 色を バランス よく 食べよう。", "なぞ② 『赤・黄・緑』を とけた！"]}]},
        {who:"おばあさん", label:"手あらいの じゅんばん", intro:["おばあさん｜りょうりの まえには、かならず 手を あらうんだよ。"],
            steps:[{q:"手あらいで いちばん よい のは？", a:["石けんで 指の あいだ・つめ・手首まで 20びょう いじょう あらう", "水で さっと ぬらすだけ", "タオルで ふくだけ"], hint:["紘｜よごれや ばいきんは、石けんと こすり洗いで おちるんだ。"], ok:["紘｜そう！ 食べる 前・トイレの あとは しっかり 手あらい。", "おばあさん｜えらいねぇ。", "なぞ③ 『手あらいの じゅんばん』を とけた！"]}]}
    ],
    talks:[["おなかの すいた 子", ["おなかの すいた 子｜いただきますは『いのちを いただく』って いみなんだって。", "おなかの すいた 子｜ごちそうさまの 気持ちも わすれずに ね。"]]],
    trap:{name:"おなべの ふた", pre:["おなべの ふた｜ぐつぐつ…カタカタ！（ふたから ゆげノイズが とびだした！）"], post:["由美｜おなべの ふたも ちゃんと もどったわ。"]},
    mobs:[["🍳", "フライパンノイズ"], ["🥄", "スプーンノイズ"], ["🍲", "おなべノイズ"]],
    boss:{name:"あじなしノイズ『からっぽ ごはん』", emo:"🍽️", img:"yh26_boss", acts:[["あじけし ビーム", 1, 0.9, 0.9], ["おなべ ストンプ", 0, 1, 1.3], ["ごはん かくし", 0, 0.7, 1.7]], say:"からっぽ ごはん「あじなんて いらない…ぜんぶ からっぽに して やる…！」"},
    pre:["からっぽ ごはん｜ぜんぶ あじを 消して やる！　おいしい なんて うそだ！", "由美｜りょうりは 食べる 人を 思って つくる もの よ！", "大樹｜ごはんを おいしく 食べさせて もらうぜ！", "紘｜{名前}{くん}、いくよ！"],
    post:["からっぽ ごはん｜…みんなで 食べる ごはんの 時間を、ぼくも 知りたかった だけなんだ…。", "紘｜じゃあ いっしょに 食べよう。いただきます、から はじめるんだ。", "由美｜おかわりも あるわよ。さあ、みんなで どうぞ。"],
    end:["大樹｜食べる ことは、生きる ことだな。", "紘｜うん。つぎの ゆめへ 行こう！"],
    learn:"はかる ときは 大さじ1＝15mL・小さじ1＝5mL。赤・黄・緑の 食べものを バランスよく。りょうりの まえには 石けんで 手あらい。"
});

YE(27, {
    title:"どうぶつの もり がっこう", sub:"からだの ひみつを まなぼう", theme:"park", bgm:"field", allies:["晴夏", "ひなた"],
    intro:["紘｜つぎは 森の ゆめ。どうぶつたちが 通う 学校に 来たよ。", "晴夏｜みんな かわいい！　でも…先生たちが こまった 顔を して いるわ。", "ひなた｜どうぶつの ひみつの 授業を 取りもどそう！", "紘｜（もりの おくから、ざわざわ という 音が ひびく）"],
    guide:["紘｜森の 学校の 3つの なぞを といて いこう。どうぶつの からだの はたらきを 使うよ。", "紘｜ペンギン先生・ラクダの おじさん・イルカの 子 に 話しかけて ね。"],
    qs:[
        {who:"ペンギン先生", label:"つばさの はたらき", intro:["ペンギン先生｜わたしは 鳥ですが、空は とべません。そのかわり、海を すいすい およぎます。", "ペンギン先生｜つばさは、水を かく ひれのように 使います。"],
            steps:[{q:"ペンギンの つばさは、何に やくだつ？", a:["海を およぐ とき 水を かく", "空を とぶ", "木に のぼる"], hint:["紘｜ペンギンは 空じゃなくて、どこで 活やくする 鳥 かな？"], ok:["紘｜そう！ およぐ ために 進化 したんだね。", "ペンギン先生｜よく できました。", "なぞ① 『つばさの はたらき』を とけた！"]}]},
        {who:"ラクダの おじさん", label:"コブの なぞ", intro:["ラクダの おじさん｜ぼくの 背中の コブには 水が 入って いる、と 思われがち だけど…ほんとうは ちがうんだ。"],
            steps:[{q:"ラクダの コブの 中には 何が たくさん 入って いる？", a:["脂ぼう（エネルギーの もと）", "水", "空気"], hint:["紘｜食べものが ない ときに 使う、ためて おいた エネルギー だよ。"], ok:["紘｜そう！ 脂ぼうを たくわえて、食べものの ない 砂ばくでも 長く 歩けるんだ。", "ラクダの おじさん｜ごほうびに コブ ぽんぽん して あげよう。", "なぞ② 『コブの なぞ』を とけた！"]}]},
        {who:"イルカの 子", label:"なかまわけ", intro:["イルカの 子｜ぼくは 魚じゃなくて『ほにゅうるい』。赤ちゃんを 産んで、ミルクで 育てるんだ。", "イルカの 子｜カエルは 水の 中で 生まれて、おとなに なると 陸でも くらす『両生類(りょうせいるい)』だよ。"],
            steps:[{q:"ほにゅうるいの なかまは どれ？", a:["イルカ", "カエル", "ペンギン"], hint:["紘｜赤ちゃんを 産んで ミルクで 育てる のは？ 鳥は たまごを 産むよ。"], ok:["紘｜そう！ イルカ。", "イルカの 子｜じゃあ もう1つ！"]},
                {q:"水と 陸の 両方で くらす『両生類』は どれ？", a:["カエル", "イルカ", "ペンギン"], hint:["紘｜おたまじゃくしから おとなに なる どうぶつ だよ。"], ok:["紘｜そう！ カエルは 両生類。", "なぞ③ 『なかまわけ』を とけた！"]}]}
    ],
    talks:[["もりの ふくろう", ["もりの ふくろう｜どうぶつは、すむ 場所に あわせた からだを して いるんじゃ。", "もりの ふくろう｜どうぶつの 生活を じゃま しない ように、見る だけに しような。"]]],
    trap:{name:"ゆれる くさむら", pre:["ゆれる くさむら｜ガサガサ…！（くさむらから もりノイズが とびだした！）"], post:["ひなた｜くさむらも しずかに なったよ。"]},
    mobs:[["🌳", "きノイズ"], ["🦊", "きつねノイズ"], ["🐻", "くまノイズ"]],
    boss:{name:"もりの ぬしノイズ『ざわざわ フクロウ』", emo:"🦉", img:"yh27_boss", acts:[["ざわざわ ふぶき", 1, 0.9, 0.9], ["よぞら ストンプ", 0, 1, 1.3], ["つばさの かぜ", 1, 0.6, 1.9]], say:"ざわざわ フクロウ「この 森に 入るな…ぜんぶ ぼくの 森だ！」"},
    pre:["ざわざわ フクロウ｜この 森は ぜんぶ ぼくの もの だ…！　だれにも あげない！", "晴夏｜森は みんなの 住む ところ よ！", "ひなた｜どうぶつたちを しずめよう！", "紘｜{名前}{くん}、森の しずけさを とりもどそう！"],
    post:["ざわざわ フクロウ｜…ほんとうは、みんなと 仲良く したかった だけ なんだ…。", "紘｜森は みんなで わけあう ものだよ。", "ざわざわ フクロウ｜…うん。ごめんなさい。"],
    end:["ひなた｜どうぶつたちも、ちがう からだで いきて いるんだね。", "紘｜うん。つぎの ゆめへ 行こう！"],
    learn:"どうぶつは 住む 場所に あわせた からだを もつ。ペンギンの つばさは およぐ ため。ラクダの コブは 脂ぼうの たくわえ。ほにゅうるいは 赤ちゃんを 産み ミルクで 育てる。"
});

YE(28, {
    title:"ゆめの でんしゃ たび", sub:"じこくひょうと マナー", theme:"town", bgm:"town", allies:["智也", "雄太"],
    intro:["紘｜つぎは 電車の ゆめ。ここは『ゆめ駅』。ふしぎな 電車が とまって いるよ。", "智也｜時刻表が ぐちゃぐちゃ だ。これじゃ 電車が 動かせない。", "雄太｜みんなが こまってる！　はやく なおそうぜ！", "紘｜（ホームの はしから、ダイヤを みだす ノイズの 気配が…）"],
    guide:["紘｜駅の 3つの なぞを といて いこう。時刻表・マナー・ホームの あんぜん を 使うよ。", "紘｜駅員さん・車しょうさん・ホームの 係の 人 に 話しかけて ね。"],
    qs:[
        {who:"駅員さん", label:"じこくひょう", intro:["駅員さん｜時刻表だ。ゆめ駅 8:10、ほし駅 8:25、うみ駅 8:50、もり駅 9:20。これは ある 電車の 時間だよ。"],
            steps:[{q:"ゆめ駅 8:10 から うみ駅 8:50 まで、何分 かかる？", a:["40分", "25分", "60分"], hint:["紘｜8:50 − 8:10 を 計算 しよう。"], ok:["紘｜50分 − 10分 ＝ 40分。", "駅員さん｜では つぎも だ。"]},
                {q:"ほし駅 8:25 から もり駅 9:20 まで、何分 かかる？", a:["55分", "45分", "65分"], hint:["紘｜8:25 から 9:00 まで 35分、そこから 9:20 まで 20分。"], ok:["紘｜35 ＋ 20 ＝ 55分。", "なぞ① 『じこくひょう』を とけた！"]}]},
        {who:"車しょうさん", label:"でんしゃの マナー", intro:["車しょうさん｜電車は みんなの 乗りものです。ほかの 人が 気もちよく 乗れる ように、気を つけましょう。"],
            steps:[{q:"電車の 中で 正しい のは？", a:["ほかの 人の じゃまに ならない よう、リュックを 前に かかえる", "大きな 声で おしゃべり する", "いすに ねころぶ"], hint:["紘｜まわりの 人を 思いやる 行動を えらぼう。"], ok:["紘｜そう！ お年よりや 小さな 子に 席を ゆずる ことも 大切だね。", "車しょうさん｜ありがとう ございます。", "なぞ② 『でんしゃの マナー』を とけた！"]}]},
        {who:"ホームの 係の 人", label:"ホームの あんぜん", intro:["係の 人｜ホームには『黄色い 点字ブロックの 線』が あるね。電車が くる ときは どうするか、分かるかい？"],
            steps:[{q:"電車を まつ とき、安全なのは？", a:["黄色い 線の 内がわ（かべの がわ）で まつ", "線の すぐ そばで まつ", "走って 乗りこむ"], hint:["紘｜電車と ぶつかったり、落ちたり しない 場所を えらぼう。"], ok:["紘｜そう！ 線の 内がわで、電車が とまって から 乗ろう。", "係の 人｜ありがとう。みんなで 安全に 乗ろうね。", "なぞ③ 『ホームの あんぜん』を とけた！"]}]}
    ],
    talks:[["おべんとうやさん", ["おべんとうやさん｜旅の 楽しみは 駅弁だね。食べ終わったら、ごみは 持ち帰るか ごみばこへ。"]]],
    trap:{name:"ふしぎな きっぷ", pre:["ふしぎな きっぷ｜ぴぴぴっ！（きっぷから ダイヤノイズが とびだした！）"], post:["智也｜きっぷも ちゃんと 使える 状態に なったな。"]},
    mobs:[["🚃", "でんしゃノイズ"], ["🎫", "きっぷノイズ"], ["🚏", "ていりゅうじょノイズ"]],
    boss:{name:"ダイヤみだれノイズ『おくれ ばっかり』", emo:"🚄", img:"yh28_boss", acts:[["おくれ ストンプ", 0, 1, 1.3], ["ダイヤ みだれ ビーム", 1, 0.9, 0.9], ["ホーム ばくそう", 0, 0.7, 1.8]], say:"おくれ ばっかり「ぜんぶ おくれろ！　だれも 時間どおりに 行けなく なれ！」"},
    pre:["おくれ ばっかり｜おくれて おくれて おくれまくれ！　時間なんて いらない！", "智也｜時間を まもる ことは、みんなの やくそく だ！", "雄太｜ホームの みんなを まもるぞ！", "紘｜{名前}{くん}、ダイヤを なおそう！"],
    post:["おくれ ばっかり｜…ぼくも、ほんとうは 時間どおりに 走りたかった。でも まにあわなくて…。", "紘｜そんな ときは、みんなで 時間を わけて 助けあうんだよ。", "智也｜よし、出発 進行！"],
    end:["雄太｜みんなの 時間を まもる ことは、みんなの 気もちを まもる ことだな。", "紘｜うん。つぎの ゆめへ 行こう！"],
    learn:"時刻表の 所要時間は ひき算で 出す。ホームでは 黄色い 線の 内がわで まち、車内では まわりの 人を 思いやる。"
});

YE(29, {
    title:"おもいで ミュージアム", sub:"むかしの くらしを たどろう", theme:"stage", bgm:"castle", allies:["沙弥香", "秋弥"],
    intro:["紘｜つぎは 博物館の ゆめ。ここには むかしの 品々が ならんで いるよ。", "沙弥香｜でも 展示が ぜんぶ バラバラ に なっちゃって いる…。", "秋弥｜ならべ直す ヒントは ぜんぶ ここに ある はずだ。", "紘｜（展示室の おくで、ぼんやり と ノイズの ひかりが 見える）"],
    guide:["紘｜博物館の 3つの なぞを といて いこう。年表・かけらの なぞ・年代の 計算 を 使うよ。", "紘｜学芸員さん・はっくつ ガイド・年代の 子 に 話しかけて ね。"],
    qs:[
        {who:"学芸員さん", label:"年表の ならびかえ", intro:["学芸員さん｜展示を 古い じゅんに ならべたい の。『石の おの』『銅の かがみ』『鉄の なべ』があるわ。", "学芸員さん｜むかしの 人は、石から 銅、銅から 鉄の じゅんに 道具を つかうように なったと いわれて いるの。"],
            steps:[{q:"3つの うち、いちばん 古い 道具は どれ？", a:["石の おの", "鉄の なべ", "銅の かがみ"], hint:["紘｜石 → 銅 → 鉄 の じゅんに 使われる ように なったよ。"], ok:["紘｜そう！ 石の おの が いちばん 古い。", "学芸員さん｜これで ならべ直せるわ。", "なぞ① 『年表の ならびかえ』を とけた！"]}]},
        {who:"はっくつ ガイド", label:"かけらから わかる こと", intro:["はっくつ ガイド｜土の 中から、まるい つぼの かけらが 出て きたよ。底に ススが ついて いたんだ。", "はっくつ ガイド｜ふかい ところほど 古い もの が 出る ことが 多いよ。"],
            steps:[{q:"ススが ついて いた ことから 考えられる のは？", a:["火に かけて 煮たきに 使って いた", "ただの かざりだった", "水を 入れる だけだった"], hint:["紘｜ススは 火や けむりが あたると つくよ。"], ok:["紘｜そう！ かけらの ようすから、むかしの くらしが 見えて くるね。", "はっくつ ガイド｜よく できました！", "なぞ② 『かけらから わかる こと』を とけた！"]}]},
        {who:"年代の 子", label:"なん年 まえ？", intro:["年代の 子｜この つぼは 今から 1,200年 まえ。この かがみは、つぼの 300年 あとに つくられたよ。"],
            steps:[{q:"かがみは、今から 何年 まえ？", a:["900年 まえ", "1,500年 まえ", "1,200年 まえ"], hint:["紘｜つぼより 300年 あとだから、今に 近づくよ。1,200 − 300 だね。"], ok:["紘｜1,200 − 300 ＝ 900年 まえ。", "年代の 子｜つぎも！"]},
                {q:"その かがみの さらに 100年 あとに つくられた 展示品は、今から 何年 まえ？", a:["800年 まえ", "1,000年 まえ", "700年 まえ"], hint:["紘｜かがみは 900年 まえ。さらに 100年 あと だよ。"], ok:["紘｜900 − 100 ＝ 800年 まえ。", "なぞ③ 『なん年 まえ？』を とけた！"]}]}
    ],
    talks:[["見学の 先生", ["見学の 先生｜博物館では、展示品に 手を ふれない、大きな 声を 出さない が きまりよ。", "見学の 先生｜さわって いい コーナーは しっかり ルールを 読んでね。"]]],
    trap:{name:"ふしぎな つぼ", pre:["ふしぎな つぼ｜ごとごと…ぱかっ！（つぼの 中から むかしノイズが とびだした！）"], post:["沙弥香｜つぼも 展示だなに もどったわ。"]},
    mobs:[["🏺", "つぼノイズ"], ["🗿", "いしぞうノイズ"], ["🖼️", "がぞうノイズ"]],
    boss:{name:"わすれんぼノイズ『からっぽ ミュージアム』", emo:"🏛️", img:"yh29_boss", acts:[["わすれんぼ ビーム", 1, 0.9, 0.9], ["ぜんぶ ケース ストンプ", 0, 1, 1.3], ["おもいで かくし", 1, 0.6, 1.9]], say:"わすれんぼ「むかしの ことなんて ぜんぶ わすれろ…！　おもいでは いらない…！」"},
    pre:["わすれんぼ｜むかしの ことなんて ぜんぶ 消して やる！　新しい ものだけ あれば いい！", "沙弥香｜むかしを 知る ことは、今の わたしたちを 知る こと です！", "秋弥｜おもいでを 取りもどすぞ！", "紘｜{名前}{くん}、いっしょに！"],
    post:["わすれんぼ｜…ほんとうは、わすれられるのが こわかったんだ。", "紘｜むかしを 大切に すれば、わすれられる ことも ないよ。", "学芸員さん｜では、あなたの おもいでも 展示しましょうか。"],
    end:["秋弥｜過去を 知る ことは、未来を 作る ヒントに なるんだな。", "紘｜うん。さいごの ゆめへ 行こう！"],
    learn:"古い ものほど 深い 地層から 出る ことが 多い。かけらの かたちや ススから むかしの くらしが わかる。年代の 差は ひき算で 求める。"
});

YE(30, {
    title:"ゆめの そつぎょうしき", sub:"ありがとう ぜんぶの まなび", theme:"dream", bgm:"castle", allies:["渚", "竜也", "桃寧"],
    intro:["紘｜…とうとう、ゆめの 日記の さいごの ページ。番外編の 最終話 だよ。", "渚｜紘くん、ずっと いっしょに がんばって きたね。", "竜也｜ここまで 来たら、さいごまで やりきろうぜ！", "桃寧｜これまでの まなびを ぜんぶ 使って、ゆめの そつぎょう式を 迎えましょう。", "紘｜（ホールの まん中で、ゆめの 王冠が ゆっくり ひかりはじめた…）"],
    guide:["紘｜さいごの 3つの なぞを といて いこう。これまでの まなびの 復習 だよ。", "紘｜司会の ロボ・さいごの 案内人・ともだち代表 に 話しかけて ね。"],
    qs:[
        {who:"司会の ロボ", label:"なかなおりの まほう", intro:["司会ロボ｜ピピッ！ さいしょの もんだい！　1話で 学んだ『なかなおりの まほう』を おぼえて いますか？"],
            steps:[{q:"なかなおりの まほうの ことばは どれ？", a:["『ごめんね』と『ありがとう』", "『いやだ』", "『しらない』"], hint:["紘｜けんかを したとき、気持ちが つたわる 言葉を えらぼう。"], ok:["紘｜そう！ 小さな 言葉が、大きな ちからに なるよ。", "司会ロボ｜せいかい です！", "なぞ① 『なかなおりの まほう』を とけた！"]}]},
        {who:"さいごの 案内人", label:"ぜんぶの まなび ふくしゅう", intro:["さいごの 案内人｜これまでの ゆめで 学んだ ことを 3つ、おさらい しましょう。"],
            steps:[{q:"コンパスの はりは どっちを さす？", a:["北", "南", "東"], hint:["紘｜灯台の ゆめで 学んだね。いつも 同じ 方角を さす よ。"], ok:["紘｜そう！ 北。", "さいごの 案内人｜つぎです。"]},
                {q:"大さじ1ぱいは、小さじ 何ばいぶん？", a:["3ばい", "5ばい", "2ばい"], hint:["紘｜キッチンの ゆめを 思い出そう。15 ÷ 5 だよ。"], ok:["紘｜そう！ 3ばい。", "さいごの 案内人｜ラスト です。"]},
                {q:"『くりかえし 使う』ごみ へらしの ちえは どれ？", a:["リユース", "リデュース", "リサイクル"], hint:["紘｜ごみの ゆめを 思い出そう。そのまま 使いつづける ちえ だよ。"], ok:["紘｜そう！ リユース。", "なぞ② 『ぜんぶの まなび ふくしゅう』を とけた！"]}]},
        {who:"ともだち 代表", label:"やくそく", intro:["ともだち 代表｜どうしても つらい とき、ひとりで かかえて いると、心が くたびれて しまうよね。"],
            steps:[{q:"つらい とき、いちばん よい のは？", a:["信じられる 人に 話して そうだん する", "だれにも 言わず がまんする", "ぜんぶ 人の せいに する"], hint:["紘｜1話から ずっと 学んで きた ことだよ。ひとりで かかえこまない。"], ok:["紘｜そう！ そうだん する ことは、ゆうきの ひとつ だよ。", "ともだち 代表｜ありがとう。わたしも そうだん する ね。", "なぞ③ 『やくそく』を とけた！"]}]}
    ],
    talks:[["ゆめの 司書さん", ["ゆめの 司書さん｜あなたの 物語は、これで ひとつ 完成しました。", "ゆめの 司書さん｜でも ほんとうの 物語は、ゆめの そとの 毎日に つづいて いきますよ。"]]],
    trap:{name:"ひかる 王冠の かけら", pre:["ひかる 王冠の かけら｜ぴかっ！（かけらから ゆめノイズが とびだした！）"], post:["桃寧｜かけらも もとの 場所に もどりましたね。"]},
    mobs:[["🌟", "きらきらノイズ"], ["🎓", "そつぎょうノイズ"], ["💤", "ねぼすけノイズ"]],
    boss:{name:"ゆめの ねぼすけ王『さよなら ノイズ』", emo:"🌌", img:"yh30_boss", acts:[["さよなら ビーム", 1, 0.9, 0.9], ["ねぼすけ ストンプ", 0, 1, 1.3], ["ゆめの おわり", 1, 0.7, 2.0], ["かなしみの うず", 0, 0.6, 1.8]], say:"さよなら ノイズ「ゆめが おわるのは さびしい…ずっと ここに いて…！」"},
    pre:["さよなら ノイズ｜ゆめが おわったら、みんな わすれて しまう…！　ずっと ここに いれば いいんだ！", "渚｜わすれたり しないよ。今まで の おもいで は ぜんぶ ここに ある。", "竜也｜ゆめの 外でも、おれたちは ずっと 仲間だ！", "桃寧｜さあ、紘くん、{名前}{くん}。さいごの たたかいです。", "紘｜うん！　いくよ！"],
    post:["さよなら ノイズ｜…さびしかった だけ なんだ。おわるのが、こわかった…。", "紘｜おわりは さよならじゃ ないよ。また 会える。『ありがとう』って 言えば いいんだ。", "さよなら ノイズ｜…ありがとう。みんなに 会えて、よかった。"],
    end:["渚｜ありがとう、紘くん。そして {名前}{くん}。", "竜也｜またな！　ゆめの 外でも 会おうぜ！", "桃寧｜これからも、ゆうきと ちえと やさしさで、一歩ずつ すすんで いきましょう。", "紘｜うん。みんな、ありがとう！"],
    learn:"あいさつ・そうだん・調べる・思いやる。これまでの まなびを つかって、あしたの じぶんを すこしずつ かえて いこう。"
});

// ---------------------------------------------------------------- 番外編 最終話の エンディング（ごほうび）
RPG_EV.yh_extra_final = YKL([
    "紘｜ゆめの 日記の ページが、ふわっと ひらいた。　　ページの うえには、いままでの 30の ゆめが ならんで いる。", "紘｜（番外編の さいごまで、いっしょに 来て くれて ありがとう。）",
    "渚｜わたしたちは、ずっと ここに いるよ。いつでも 会いに 来てね。", "竜也｜ゆめの 外では、きみが 主役だ！", "桃寧｜やさしさと ちえを、たくさんの 人に わけて あげて ください ね。",
    "紘｜これは、ぼくたちからの おくりもの。", "📘 『番外編 かんぜん せいは』の しょうごうを てにいれた！"
]).concat([["gold", 300000], ["item", "special", 10], ["item", "omamori", 5], rpgN("300,000G と スペシャルおにぎり 10こ・ふっかつのおまもり 5こを てにいれた！"), ["set", "e_yh_extra"], ["run", "lab_ret_go"]]);


/* ==== game/yh-end.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[39]=1;
"use strict";
// ===== やりすぎヒーロー伝説＆ドリームストーリー：ゲートの 行き先・称号・もくてき =====
(function(){
    const L = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];
    const T = ["ちいさな ヒーローの はじまり", "ふしぎな しょうがっこう じけん", "ぞうの なぞと おうちの あかり", "なまえ どろぼうと おぼえる ひみつ", "ビリから トップへ！ 勉強の まほう",
        "とどいた ちょうせんじょう", "氷の上の ヒロイン", "ボタンを もった 竜也", "せいとかい だいさくせん！", "試験の日は ちこく しそう！",
        "マジック たいけつ！", "ゆめの きょういくじっしゅう", "さらわれた 桃寧！", "ほんとうの やさしさ", "ロボット紘 だいさくせん！",
        "遊園地の かなしみ", "あんごうの とびら", "ひこうきと なぞとき研究部", "タオルの なぞと ドッキリ大作戦", "ありがとう ぜんぶの 物語",
        "ひみつの としょかん", "ひかりの とうだい", "ふしぎな おてんき ゆうえんち", "ごみゼロ だいさくせん", "ほしぞら キャンプ",
        "おいしい ふしぎ キッチン", "どうぶつの もり がっこう", "ゆめの でんしゃ たび", "おもいで ミュージアム", "ゆめの そつぎょうしき"];
    const HN = (i) => (i > 20 ? "番外編 第" + i + "話" : "第" + i + "話");
    for(let i = 1; i <= 30; i++){
        RPG_ERAS.push({id:"yh" + i, n:"追加：やりすぎヒーロー伝説 " + HN(i) + " " + T[i - 1] + "〔推奨Lv" + L[i - 1] + "〕", map:"yh" + i, pos:[9, 10], done:"e_yh" + i, req: i === 1 ? "e_future" : "e_yh" + (i - 1)});
    }
    const xe = RPG_ERAS.find((e) => e.id === "xr"); if(xe){ RPG_ERAS.splice(RPG_ERAS.indexOf(xe), 1); RPG_ERAS.push(xe); }
    const F = (k) => () => !!G.S.f[k];
    for(let i = 1; i <= 30; i++){
        const t = {id:"t_yh" + i, n:(i > 20 ? "ヒーロー番外編" + (i - 20) : "ヒーロー第" + i + "話"), d:"やりすぎヒーロー伝説 " + HN(i) + "を クリア", f:F("e_yh" + i), g:500 + i * 100}; TQ_TITLES.push(t); TQ_TITLE_BY[t.id] = t;
    }
    const all = {id:"t_yh_all", n:"やりすぎヒーロー伝説 かんけつ！", d:"やりすぎヒーロー伝説＆ドリームストーリーを 20話ぜんぶ クリア", f:F("e_yh20"), g:10000}; TQ_TITLES.push(all); TQ_TITLE_BY[all.id] = all;
    const extra = {id:"t_yh_extra", n:"番外編 かんぜん せいは！", d:"やりすぎヒーロー伝説 番外編 第21〜30話を ぜんぶ クリア", f:F("e_yh30"), g:12000}; TQ_TITLES.push(extra); TQ_TITLE_BY[extra.id] = extra;
    const gen = {id:"t_genius", n:"天才への みち", d:"15の 職業を ぜんぶ きわめた", f:() => { const j = tqJ(); return !!j && TQ_JOBS.filter((d) => !d.genius).every((d) => j.mast.includes(d.id)); }, g:5000}; TQ_TITLES.push(gen); TQ_TITLE_BY[gen.id] = gen;
    const _obj = tqObjective;
    window.tqObjective = function(){
        const f = G.S.f;
        if(f.e_ks5 || f.yh_started){
            for(let i = 1; i <= 30; i++) if(!f["e_yh" + i]) return "追加：やりすぎヒーロー伝説 " + HN(i) + "『" + T[i - 1] + "』へ（ゲート）〔推奨Lv" + L[i - 1] + "〕　※むずかしさは ぜんぶ『ひじょうに むずかしい』で こてい";
        }
        return _obj();
    };
    // 話者の かおを じどうで そろえる
    Object.keys(RPG_EV).filter((k) => /^yh/.test(k)).forEach((k) => {
        const walk = (a) => { if(!Array.isArray(a)) return; if(a[0] === "say" && typeof a[1] === "string" && a[1] && !TQ_PORTRAIT_LOOK[a[1]]) yPortrait(a[1]); a.forEach(walk); };
        walk(RPG_EV[k]);
    });
})();


/* ==== game/dk.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[40]=1;
"use strict";
// ===== 出来事（クリア後の おまけ・全10話） 〜 エンジン =====
//   主人公と ゆうざいくん 以外の 名前・地名は ぜんぶ 架空に かえてあります。
//   1話 ＝ 1つの 地図。町の人に 話しかけて、場面を じゅんばんに すすめる。 さいごに 語り手に 話しかけると おしまい。
const DK_EPS = [];
Y_HAND["ゆうざいくん"] = "yuzai";
Y_PEOPLE["主人公"] = ["#f6d2b0", "#1b1b27", "short", "#2f6fdc", "#374151", "none"];
Y_PEOPLE["語り手"] = ["#f9d9bd", "#555", "bun", "#8a5ab6", "#4b5563", "glasses"];
TQ_PORTRAIT_IMG["ゆうざいくん"] = TQ_PORTRAIT_IMG["ゆうざいくん"] || "yuzai";

// 戦う 相手（模擬戦＝まけても だいじょうぶ。むずかしさは ふつうの ルール）
function dkFoe(id, name, emo, img, lv, acts, say, mult){
    RPG_FOES[id] = rpgE(name, emo, 10, 5, 1, 1, 1, acts, Object.assign({boss:true, spar:true}, img ? {img} : {}, {say50:say}));
    const st = tqBossStat(lv), m = mult || 1; st.hp = Math.round(st.hp * m); st.atk = Math.round(st.atk * Math.min(1, 0.7 + m * 0.3)); st.exp = Math.round(st.exp * 0.9); st.g = Math.round(st.g * 4);
    Object.assign(RPG_FOES[id], st, {bossLv:lv}); return id;
}

// 1つの 場面（NPC 1人ぶん）。lines → （なぞ／たたかい）→ after → フラグ
function dkScene(id, prev, prevLabel, o){
    const flag = o.flag, x = id + "_x";
    const hint = [rpgN("（まだ その 場面には 早いみたい。『" + (prevLabel || "ほかの 人") + "』の ところから 先に 話を 聞いてみよう。）")];
    if(o.q){
        yq(x, {chk:flag, set:flag, intro:o.lines, fin:o.after, done:o.done, steps:o.q});
    } else if(o.battle){
        RPG_EV[x] = [["if", flag, YKL(o.done || ["（この 場面は もう おわったよ。）"]),
            YKL(o.lines).concat([["battle", [o.battle], YKL(o.after || []).concat([["set", flag]])]])]];
    } else {
        RPG_EV[x] = [["if", flag, YKL(o.done || ["（この 場面は もう おわったよ。）"]), YKL(o.lines).concat(YKL(o.after || []), [["set", flag]])]];
    }
    RPG_EV[id] = [["if", flag, [["run", x]], prev ? [["if", prev, [["run", x]], hint]] : [["run", x]]]];
}

function DKE(n, c){
    const m = "dk" + n, L = "abcde", flags = c.steps.map((_s, i) => m + "s" + (i + 1));
    DK_EPS.push({n, title:c.title, sub:c.sub, date:c.date, learn:c.learn});
    // --- 場面
    c.steps.forEach((s, i) => dkScene(m + "_" + L[i], i ? flags[i - 1] : "", i ? c.steps[i - 1].label : "", Object.assign({flag:flags[i]}, s)));
    // --- ざつだん
    (c.talks || []).forEach((t, i) => { RPG_EV[m + "_t" + (i + 1)] = YKL(t[1]); });
    // --- 語り手（まとめ役）
    const list = c.steps.map((s, i) => ["if", flags[i], [], [rpgN("・" + s.label + "（まだ）")]]);
    const reward = [["gold", 3000 + n * 600], ["item", "special", 3], ["item", "omamori", 1], rpgN((3000 + n * 600) + "G と スペシャルおにぎり 3こ・ふっかつのおまもり 1こ を てにいれた！"), rpgN("📖 今回の まなび：" + c.learn)];
    RPG_EV[m + "_hq"] = [["if", "e_" + m, YKL(c.after || ["語り手｜この 出来事は もう おしまい。ゲートから つぎの 出来事へ すすもう！"]),
        [["if", flags.join("&"), YKL(c.fin).concat(reward, [["set", "e_" + m]], n === 10 ? [["run", "dk_final"]] : [["run", "lab_ret_go"]]), YKL(c.guide).concat(list)]]]];
    RPG_EV[m + "_enter"] = [["if", "!" + m + "_in", [["set", m + "_in"], ["set", "dk_started"]].concat(YKL(c.intro)), []]];
    // --- 地図
    const objs = [yNpc(m + "_hq", Y_GUIDE[0], Y_GUIDE[1], "語り手", m + "_hq")];
    c.steps.forEach((s, i) => objs.push(yNpc(m + "_" + L[i], Y_SLOT[i][0], Y_SLOT[i][1], s.who, m + "_" + L[i])));
    (c.talks || []).forEach((t, i) => objs.push(yNpc(m + "_t" + (i + 1), Y_SLOT[c.steps.length + i][0], Y_SLOT[c.steps.length + i][1], t[0], m + "_t" + (i + 1))));
    RPG_MAPS[m] = yMap(c.theme, objs, "出来事 第" + n + "話　" + c.title);
    RPG_ENTER[m] = m + "_enter"; TQ_BGM_MAP[m] = c.bgm || "town";
    c.steps.forEach((s) => yPortrait(s.who));
    (c.talks || []).forEach((t) => yPortrait(t[0]));
}


/* ==== game/dk1.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[41]=1;
"use strict";
// ===== 出来事 ① 第1〜4話 =====
DKE(1, {
    title:"えきまえの ぐうぜん", sub:"あやめを まもる さくせん（前）", date:"2026年9月19日〜20日", theme:"town", bgm:"town",
    intro:["語り手｜ここは 『出来事』。主人公の ある秋の 日々を、いっしょに 歩いてみよう。", "語り手｜名前や 場所は ぜんぶ 架空だよ。 でも、そこで 起きる 小さな できごとは、きみの 毎日にも あるかも しれない。", "語り手｜第1話は 9月19日、つばめ川駅から はじまる。"],
    guide:["語り手｜町の 人に 話しかけて、場面を じゅんばんに 見ていこう。", "語り手｜さいごは わたしに 話しかけてね。"],
    steps:[
        {who:"こはる", label:"つばめ川駅で ばったり", lines:["（朝から 電車で 遠くまで 出かけた 帰り道。主人公は つばめ川駅に ついた。）", "こはる｜え？ なんで ここに いるの？", "主人公｜朝から 電車で 遠くまで 行ってたんだよ。 こはるこそ なにしてるの？", "こはる｜今日は お休みだから、あやめに 会いに いくの。", "主人公｜え、マジ？ ぼくも 会いたい！ 頭がよくて 華やかな あの子に さ！", "こはる｜ダメー！ 主人公は すぐ ちょっかいを だすから ムリでーす！"],
            q:[{q:"ここで 主人公は どう 答えるのが いいかな？", a:["「わかった。むりには 会わないよ」と 相手の 気持ちを 大切にする", "「そんなこと 言わずに 会わせてよ」と しつこく たのむ", "こっそり あとを つける"], hint:["こはる｜しつこく されると あやめは ほんとうに こまっちゃうよ。"], ok:["主人公｜（うーん…）わかった、むりには 会わないよ。", "こはる｜よろしい。 いい 返事です。", "語り手｜相手が いやがる ことは しない。 これが 人づきあいの 第一歩だよ。"]}],
            after:["（主人公は その場を はなれて グリーンモールへ むかった。この 小さな 再会が、あとで 大さわぎに つながるとは 思いもせず…）"]},
        {who:"大地", label:"ひよりからの でんごん", lines:["（同じ日の 夜７時ごろ。主人公の スマホに メッセージが とどいた。）", "大地｜こはるから 伝言。 いますぐ 駅に 来いってさ。", "主人公｜はぁ？ 行くわけ ないでしょ。 実家に 帰らないと いけないし。", "大地｜まあ、好きに すれば？（笑）", "主人公｜今日は もう 家に 帰りますわ。"],
            after:["（だが 主人公の 知らない ところで、事態は 思わぬ 方向へ すすんでいた。）"]},
        {who:"こはる", label:"9月20日 こはるの そうだん", lines:["（9月20日 午前10時ごろ。主人公は 『買い物に 行く』と 親に 伝え、駅の 近くへ。そこで また こはると ばったり。）", "こはる｜どうして 昨日 来なかったの？", "主人公｜親が きびしくて、まっすぐ 家に 帰ったんだよ。", "こはる｜そうなのね…。じつは あやめの ようすが おかしいの。", "主人公｜あやめって 気分に 波が あるじゃん。そういう 日も あるんじゃない？", "こはる｜そういう 話じゃ ないの。 ほんとうに あぶなかったんだから。", "こはる｜明日、ゆうざいくんが あやめの 住んでる マンションに 友だちを 連れて くるの。 その友だちは 主人公の 知り合いたち。", "主人公｜えっ？", "こはる｜その人たちが あやめに 近づかないように してほしいの。みんな ちょっと 問題が ある人たちだから。"],
            q:[{q:"こはるの たのみに、主人公は どうするのが いいかな？", a:["あやめを まもるため、ひとりで かかえず こはるや 大地と 協力する", "かんけいないから ことわる", "ゆうざいくんたちに 先まわりして ひとりで けんかを する"], hint:["こはる｜ひとりで むちゃを すると かえって あぶないよ。 みんなで 役わりを わけよう。"], ok:["主人公｜わかった。 ぼくも 協力する。 連絡は SNSで とりあおう。", "こはる｜ありがとう！ 明日の 12時に あやめの マンション前 集合ね。"]}],
            after:["語り手｜こまっている 人を 助ける ときは、ひとりで かかえこまず、みんなで 役わりを わけると うまく いくよ。", "（こうして 主人公と こはるは 連絡を とりあう ことに。 主人公は まだ 知らなかった。 翌日、自分が 最も 会いたくない 男と 真正面から むきあう ことに なるのを…。）"]}
    ],
    talks:[["あやめ", ["あやめ｜（遠くの マンションの 窓から 外を 見ている。）…今日は だれかに 会うのは ちょっと こわいな。", "あやめ｜でも 友だちが そばに いてくれるから、少しだけ 安心。"]]],
    fin:["語り手｜第1話は ここまで。 駅前の 小さな 再会が、大きな 出来事の はじまりだったね。", "語り手｜つづきは 9月21日。 雨の 日の 『マンション作戦』だよ。"],
    learn:"相手が いやがる ことは しない。 こまっている 人を 助けるときは、ひとりで かかえず みんなで 役わりを わけよう。"
});

DKE(2, {
    title:"あめの 日の マンション作戦", sub:"やんちゃ組を とめろ！", date:"2026年9月21日", theme:"night", bgm:"field",
    intro:["語り手｜9月21日、月曜日。 空は どんより、雨が ざあざあ。", "語り手｜主人公は 傘を 忘れて、ぴしょぬれで あやめの マンションに ついた。"],
    guide:["語り手｜今日の 作戦は 『やんちゃ組が あやめに 近づかないように する』こと。", "語り手｜町の 人に 話しかけて、場面を じゅんばんに すすめよう。"],
    steps:[
        {who:"こはる", label:"びしょぬれの 作戦会議", lines:["主人公｜びしょぬれだわ…", "こはる｜なんで 傘を 持ってないの？ まじで バカ？", "主人公｜いいから、あやめの マンションに 入らせて くれ。", "こはる｜主人公は あやめの 部屋番号を 見ちゃ ダメだからね。", "主人公｜了解。 もう 二度と 顔を あわせる ことも ないだろうし、別に いいよ。", "こはる｜はい、扉が 開いたよ。", "主人公｜じゃあ、作戦どおり、やんちゃ組を 止める よ。", "こはる｜なにか あったら すぐ 連絡してね。"],
            q:[{q:"あやめの 部屋番号を 見ない のは、どうして かな？", a:["人の 大事な 個人情報を まもるため", "めんどうだから", "ただの いじわる"], hint:["こはる｜住んでる 場所は とっても 大事な 個人情報なの。 必要の ない人は 知らない ほうが 安全だよ。"], ok:["主人公｜そうか。 あやめが 安心して くらせるように、ぼくは 見ないよ。", "語り手｜住所や 部屋番号は 大事な 個人情報。 見ない・ひろめない が マナーだよ。"]}]},
        {who:"やんちゃA", label:"やんちゃ組と ごうりゅう", lines:["（午後1時ごろ。 主人公は 駐輪場で やんちゃ組と ごうりゅうした。）", "やんちゃA｜主人公！ 久しぶり！ 元気か？", "主人公｜もちろん！ 元気！！", "やんちゃB｜俺たち、ゆうざいくんから 可愛い子を 紹介して もらうことに なって 来たんだよね。 主人公は あやめと 友だち なんだろ？", "主人公｜あ〜、えぇ〜、だれだろうな？", "ゆうざいくん｜あやめだよ。", "主人公｜あ〜、あの人か！ へぇ〜。", "やんちゃC｜苦手なの？（笑）", "主人公｜いや〜、頭が よすぎて 次元が ちがうからさ、ぼくには つりあわないよ（笑）"],
            q:[{q:"ここで ごまかして 話を そらすのは 正しいかな？ 主人公は どうする？", a:["ごまかさず、時間を かせぎつつ、あとで 正直に 話す 準備を する", "うそを ついて ぜんぶ ごまかす", "怒って どなる"], hint:["語り手｜うそを つくと あとで ばれて かえって 大さわぎに なるよ。"], ok:["主人公｜（よし、ひとまず 話を 引きのばして…。 あとで ちゃんと 話そう。）"]}],
            after:["（そのとき、こはるから 連絡が 入った。）", "こはる｜主人公、ナイス！ 無事に ひなん できた！", "主人公｜よしっ！", "ゆうざいくん｜え？ なんで 喜んだの？", "主人公｜あ、いや、雨が おちつきそうだからさ。", "ゆうざいくん｜なるほどね。"]},
        {who:"ゆうざいくん", label:"ばれた！？ にげろ！", lines:["（そのとき、主人公の 目の前に、あやめと こはるの 姿が 見えた！）", "ゆうざいくん｜あ、あいつらだよ！", "やんちゃグループ｜おお、いいやん！ ふたりとも 可愛いね！", "ゆうざいくん｜もしかして お前、あいつらと 協力してた？", "主人公｜いや〜、サプライズで 待機して もらうつもりだったんだけど、ちょっと 展開が 早かったな〜って 思って。", "ゆうざいくん｜なるほどね。 まあ いい。 追いかけよう！", "（ゆうざいくんは あやめたちの ほうへ 走りだした！ やんちゃ組は 立ちどまり、主人公の 話を 聞くことに なった。）"],
            after:["主人公｜よし、ここからは ぼくの 知恵で なんとか するから、ゆるしてよ。"]},
        {who:"やんちゃB", label:"ほんとうの 気持ち", lines:["主人公｜正直に 話すから、怒らずに 聞いて ほしい。", "主人公｜もともと、ぼくは あやめの ことが 好きだった。 何度か 告白したけど、人見知りだからって ことわられた。 いまは 個人的に メッセージを 送る のも やめて ほしいって 言われてる。", "（やんちゃ組は だまって 聞いていた。）", "主人公｜だから、これ以上 あやめに つらい思いを させたく ないんだ。", "やんちゃB｜でも まだ なにも してないぞ？", "主人公｜そうだね。 でも、あやめは 人見知りなんだ。 大ぜいで とつぜん おしかけたら、こわい 思いを するかも しれないだろ？", "やんちゃC｜…確かに。"],
            q:[{q:"やんちゃ組を 説得する とき、いちばん いい 伝え方は？", a:["気持ちを 正直に 話して、相手の 立場を 考えて もらう", "大声で おどして 帰らせる", "あやめの 秘密を ばらす"], hint:["語り手｜おどしや 秘密を ばらす のは、新しい 問題を つくるだけだよ。"], ok:["主人公｜みんなが 興味を もつ 気持ちは わかる。 でも これ以上 近づこうと しないで ほしい。", "やんちゃA｜…主人公の 言うとおりだな！", "やんちゃB｜本人が いやがってるなら、むりに 近づくのは ちがうよな。", "やんちゃC｜よし、俺たちは ゲームセンターに 行こうぜ！", "主人公｜ぼくは 用事が あるから 行けない。 みんなで 楽しんできな！", "やんちゃグループ｜わざわざ 説得 ありがとな！"]}],
            after:["語り手｜気持ちを 正直に 話して、相手の 立場を 考えて もらう。 それが いちばん ひびく 説得だよ。", "（こうして やんちゃ組の 説得に 成功。 だが、まだ ひとり、止めなければ ならない 男が のこっていた。）"]}
    ],
    talks:[["マンションの 管理人", ["マンションの 管理人｜雨の 日は すべりやすい から 気をつけてね。", "マンションの 管理人｜知らない 人が 部屋の 前に 来たら、すぐ 管理人室に 教えて くださいね。"]]],
    fin:["語り手｜第2話は ここまで。 やんちゃ組は 帰ったけれど、まだ ひとり…。", "語り手｜つづきは 『にげられない 対決』。 ゆうざいくんが 待っているよ。"],
    learn:"個人情報（住所・部屋番号）は まもる。 うそで ごまかさず、正直に 気持ちを 伝えて 説得しよう。"
});

DKE(3, {
    title:"にげられない 対決", sub:"主人公VSゆうざいくん", date:"2026年9月21日（夕方）", theme:"stage", bgm:"castle",
    intro:["語り手｜第3話。 マンションの 前の 広場で、ついに 主人公と ゆうざいくんが 向きあう。", "語り手｜ここは ちょっぴり ドキドキする 場面だけど、アクションゲームの 模擬戦だから 安心してね。"],
    guide:["語り手｜まず こはるたちの 話を 聞こう。 そのあと ゆうざいくんと 対決だ！"],
    steps:[
        {who:"こはる", label:"ついてくる ゆうざいくん", lines:["こはる｜主人公、ゆうざいくんが こっちに ついてきてる！", "主人公｜マジで…。 あいつ、絶対に ゆるさねぇ！", "（そのとき、背後から 声が した。）", "ゆうざいくん｜あ、そこに いたのか。", "こはる｜きみさ、気持ち わるいから、しつこく 追いかけるの やめてくれる？ あやめが かわいそうだよ。", "ゆうざいくん｜うっせーな！ だいたい お前らが 逃げるのが 悪いんだろうが！", "あやめ｜人が いやがる ことは しちゃ いけないよ。 それくらい 大人なんだから わかるよね？", "ゆうざいくん｜ぐぬぬ…！ こいつら、頭に 来る…！"],
            after:["（そこへ 大地が 自転車で かけつけた。）", "大地｜そこまでだ！", "主人公｜ごめん！ ふたりとも！"]},
        {who:"ゆうざいくん", label:"主人公VSゆうざいくん", lines:["ゆうざいくん｜もう こうなったら、強引にでも 決着を つけるしか ねぇな！", "主人公｜残念ながら、それは できないね。", "ゆうざいくん｜なんでだよ！", "主人公｜ここは ぼくが 相手に なる。 ただし 模擬戦だ！", "ゆうざいくん｜ふん、いい 度胸だ。 かかってこい！"],
            battle:dkFoe("dk3_yuzai", "ゆうざいくん", "🎩", "yuzai", 62, [["ゆうざい ダンス", 0, 1, 1.3], ["サクセス ウインク", 1, 0.7, 0.8], ["おこりんぼ ターン", 0, 0.7, 1.7]], "ゆうざいくん「ぐぬぬ…！ まだ まだ だ！」", 0.9),
            after:["ゆうざいくん｜はぁ、はぁ…。 くそ…。", "主人公｜勝負は ついた。 次は 話を しよう。"]},
        {who:"ななせ", label:"もとカノの ことば", lines:["主人公｜ほら、君。 こっちに 来てくれる？", "（ひとりの 女性が 姿を あらわした。）", "ななせ｜こんにちは。", "ゆうざいくん｜えっ…ななせ！？", "ななせ｜わたしは、ゆうざいくんの 元の 恋人の ななせと 申します。", "こはる｜ななせさんは、ゆうざいくんと お付きあい していたんだね。", "ななせ｜はい。 ゆうざいくんは ほんとうは いい人なんです。 ただ、自分の 気に入らない ことが あると すぐ 怒って、きつい ことばを 言ってしまう ことが あるんです。", "（ななせは ゆうざいくんを 見つめた。）", "ななせ｜でも だからって、だれかを こわがらせて いい 理由には なりません。 ゆうざいくんには、自分の 行動を 見直して ほしいです。", "（ゆうざいくんは だまって うつむいた。）"],
            q:[{q:"ななせの ことばから、どんな ことを まなべる かな？", a:["気に入らなくても、きつい ことばや つきまといは だめ。 自分の 行動を 見直す", "怒れば 相手は 言うことを 聞く", "好きなら しつこくても ゆるされる"], hint:["ななせ｜きつい ことばや つきまといは、相手を こわがらせるだけ なんです。"], ok:["語り手｜相手が いやがる ことを して しまったら、まず 立ちどまって 自分の 行動を ふりかえろう。"]}]},
        {who:"あやめ", label:"とどかなかった 想い", lines:["あやめ｜わかりました。 でも もう 二度と、わたしを ナンパしたり、しつこく 追いかけたり しないでください。", "（あやめの 声は ふるえていた。）", "あやめ｜最近 心が 折れそうで、就職活動にも 集中できません。 これからは 自分の 生活を 大切に したいんです。", "ゆうざいくん｜…すみませんでした。", "（ゆうざいくんは 深く 頭を さげて、その場を はなれていった。ようやく 騒動は おわったのだった。）", "こはる｜主人公…。 残念だったね。", "主人公｜あやめ、ぼくは…", "あやめ｜主人公。 ほんとうに わたしの ことを 好きで いてくれたのは うれしいよ。 でも、付きあう ことは できません。", "主人公｜あやめ！！", "（主人公は その場で 泣きくずれた。）", "主人公｜ぼくは あやめが いなきゃ なにも できないよ…。 あの頃だって あやめの おかげで がんばれたんだし…。", "大地｜男なら 泣くんじゃねぇぞ！", "主人公｜もう なにもかも 今月は うまく いってないんだよ！ メンタルが ボロボロなんだよ…！", "あやめ｜ごめんなさい…。 でも わたしの 気持ちは 変わりません。"],
            q:[{q:"ふられて 苦しいとき、いちばん いい うけとめかたは？", a:["相手の 返事を 受けとめて、信頼できる 友だちに 話を 聞いて もらう", "しつこく 追いかけて 気持ちを かえさせる", "ぜんぶ 相手の せいに する"], hint:["大地｜気持ちを 変えさせようと すると、相手は もっと こわがって しまうぞ。"], ok:["大地｜ここに いても 同じ ことの くりかえしだ。 ほら、帰るぞ。", "（大地は 主人公の 肩に 手を 置いた。 主人公は 何度も あやめの 名前を 呼びながら、その場を はなれた。）"]}]},
        {who:"こはる", label:"ひよりからの メッセージ", lines:["（その日の 夕方。 主人公の スマホに こはるから メッセージが とどいた。）", "こはる｜主人公、今日は つらい 思いを させて ごめんね。 でも あやめの 件は 解決できて、少し ホッと したよ。", "こはる｜今まで 意地悪な ことを 言って ごめんね。 わたしも これからは 言葉に 気をつけます。", "主人公｜あやめと もう一度 やりなおせないのが 残念だよ。", "（主人公は スマホを 置き、涙を ぬぐった。）", "主人公｜…さよなら、あやめ。", "（その言葉は 誰にも とどくことなく、静かな 夕暮れの 中へ 消えていった。）"]}
    ],
    talks:[["大地", ["大地｜ふぅ…。 自転車で 走ったから 足が パンパンだ。", "大地｜主人公、 つらい 時は いつでも 言えよ。 おれも 話を 聞くから。"]]],
    fin:["語り手｜第3話は ここまで。 ふられて つらいけれど、友だちが そばに いてくれたね。", "語り手｜次は 9月24日。 シルバーウィーク あけの 大さわぎの はじまりだよ。"],
    learn:"相手を こわがらせる ことは しない。 ふられても 気持ちを 受けとめ、信頼できる 友だちに 話を 聞いて もらおう。"
});

DKE(4, {
    title:"ゲームセンターと おすしの 夜", sub:"シルバーウィーク あけの 大さわぎ ①", date:"2026年9月24日", theme:"shop", bgm:"town",
    intro:["語り手｜第4話。 9月24日の 朝、主人公は 7時に 飛びおきた。", "主人公｜あ〜、そうだ！ 今日、銀行に 行く 日だった！ このままじゃ クレジットカードが 使えないんだ！"],
    guide:["語り手｜今日は 銀行 → ゲームセンター → おすしの 夕食会。 順番に 行ってみよう。"],
    steps:[
        {who:"銀行の 担当者", label:"銀行で おこづかい けいかく", lines:["（14時30分。 ほしぞらモールの 銀行。 主人公は 電車代が なくて 1時間 歩いて たどりついた。）", "主人公｜やっと 着いた… 疲れた…。", "銀行の 担当者｜カードは 10月1日から 再び ご利用 いただける 予定です。", "主人公｜なるほど…。 ありがとうございます！", "（主人公は 1万円を 引き出した。 9月30日までは この 1万円で 生活しなければ ならない。）"],
            q:[{q:"9月24日から 9月30日まで（7日間）、1万円で くらす。 1日 いくらまで つかえる？", a:["約1,400円（10,000 ÷ 7）", "約3,000円", "約700円"], hint:["主人公｜10,000 ÷ 7日 ＝ ？ まず 1,000円ずつ 7日で 7,000円。 のこり 3,000円を 7日で わると…。"], ok:["主人公｜10,000 ÷ 7 ＝ 約 1,428円！ 1日 1,400円 いないに おさえれば OK。", "語り手｜お金は 先に 使い道を 決めて 計画的に。 これが 『家計の 基本』だよ。"]}]},
        {who:"ゲームセンターの お姉さん", label:"和太鼓の リズムゲーム", lines:["（気分転換に ゲームセンターへ。 和太鼓の リズムゲームが 4台も ある！）", "主人公｜おお！ 4台も あるじゃん！ これは やるしかない！", "（数分後、となりの 台で 2人組の 女の子が あそびはじめた。）", "女の子A｜あれ？ 主人公！？", "女の子B｜うわっ！ あの 主人公じゃん！", "主人公｜あ、あぁ、お久しぶり！", "女の子A｜なに？ うちらの こと 忘れかけてた？", "主人公｜そんなわけ…。", "女の子B｜その顔は 忘れていたな！ じゃあ 勝負してよ（笑）", "主人公｜君たちには さすがに 勝てるから！ ぼくは 専用の マイバチを 持ってるし！", "女の子A｜それ 勝負に 有利な やつじゃん！"],
            battle:dkFoe("dk4_taiko", "たいこ リズムノイズ", "🥁", null, 58, [["どんどん ドラムロール", 0, 1, 1.2], ["ずんちゃ ビート", 1, 0.8, 0.8], ["ばちばち スパーク", 0, 0.6, 1.7]], "リズムノイズ「ドン・ドン・カッ！ ついてこれるかな？」", 0.8),
            after:["（夏祭りの 人気曲で 勝負！ 結果は…）", "女の子A｜やったー！ 勝った！ ここの ゲーム、すごく たたきやすいのかも！", "主人公｜だよね…。 1回で 2曲しか あそべないのは 残念だけど、あと 10回くらい やりたいわ。"]},
        {who:"女の子B", label:"ゲームセンターで だんらん", lines:["（1時間後。）", "女の子B｜あんまり 変わってなくね？（笑）", "女の子A｜手に 豆が できないの すごいね（笑）", "主人公｜君たちは わかってないですね〜。 マメに ならない コツを！ マイバチを 使う！ たったこれだけだ！", "女の子B｜ずるっ！", "主人公｜ずるくない！！", "女の子A｜主人公は すぐ ずるするから！", "主人公｜なんで みんな ぼくを いじめるんじゃーー！", "女の子B｜主人公が 調子に のってるから。 こっちは 頭に 来るんだよ。", "主人公｜そんな つもりは…。", "女の子A｜少しは 素直に なれば？", "女の子B｜一昨日、好きな子に ふられたもんね！", "主人公｜なぜ 知ってる！？", "女の子B｜主人公の うわさ話は その日に 広まるよ（笑）"],
            q:[{q:"うわさ話が 広まるのを ふせぐ、いちばん いい 行動は？", a:["人の 個人的な 話は ひろめない。 じぶんも 気をつける", "おもしろいから みんなに 話す", "うわさが 本当か 確かめずに 信じる"], hint:["語り手｜うわさ話は 人を きずつける ことが あるよ。"], ok:["語り手｜人の 話を ひろめない。 自分が されて いやな ことは 人にも しない。 これが 信頼の もとだよ。"]}]},
        {who:"女の子C", label:"おすし屋さんの 夕食会", lines:["（18時30分 おすし やまびこ。 最後の 1人 女の子Cも 合流した。）", "女の子C｜あ、主人公！ 相変わらず 昔から 変わらない 服そうだな〜。", "主人公｜別に いいでしょ！", "女の子A｜最近 仕事は どう？", "主人公｜職場には 慣れてきたよ。 でも 来月末までに プログラミング言語を マスターしないと 今の 仕事から はずされる かもしれないんだよね。", "女の子C｜大丈夫っしょ！ 主人公は やれば できるんだから。 前に 専門的な 勉強を して いたときだって、最下位から 1位に なれたんだし。 心配する ことないよ。", "主人公｜ありがとう…！", "女の子B｜いつも うるさくて バカな ことするのに、今日 やけに 静かじゃん。", "主人公｜相当 メンタル やられてるって ことなのかな…。", "女の子C｜そうだ、ほのかちゃんって 子が 大雨で 川が はんらんして、いま ホテルに 避難してるの。 明日 会うから 一緒に 来ない？", "主人公｜えっ、大丈夫なの！？ ほのかと 会えるのは うれしい！", "女の子C｜困ったら すぐ 助けてくれるから、みんな 主人公の ことを 尊敬してるんだよ〜。", "主人公｜それなら よかったよ！"],
            after:["（みんなで おすしを 食べながら 仕事の 話や 近況を 語りあう。 久しぶりに、心から 笑えた 時間だった。）", "女の子C｜じゃあ 明日は 10時に あさひ台駅で 集合ね！", "主人公｜了解！ 今日は ありがとう！", "主人公｜…よし。 明日は 少しでも ほのかに 元気を 出して もらえるように がんばろう。"]}
    ],
    talks:[["ゲームセンターの 店員さん", ["ゲームセンターの 店員さん｜太鼓の ゲームは 今日も 人気ですよ！", "ゲームセンターの 店員さん｜あそびすぎて 電車代まで なくさないように ね。"]]],
    fin:["語り手｜第4話は ここまで。 お金の 計画、友だちの 力、 そして すこしの 勇気。", "語り手｜次の 第5話は 9月25日。 『ニコニコの 日』が はじまるよ。"],
    learn:"お金は 先に 使い道を 決めて 計画的に。 うわさ話を ひろめず、友だちの 励ましに 感謝しよう。"
});


/* ==== game/dk2.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[42]=1;
"use strict";
// ===== 出来事 ② 第5〜8話 =====
DKE(5, {
    title:"9月の ニコニコの日", sub:"シルバーウィーク あけの 大さわぎ ②", date:"2026年9月25日", theme:"park", bgm:"field",
    intro:["語り手｜第5話。 9月25日。 『ニコニコの 日』の はずが、ちょっぴり 笑えない 出来事が いくつも おこるよ。", "語り手｜主人公は 朝9時25分 発の 電車に のって、あさひ台駅に むかった。"],
    guide:["語り手｜友だちと ほのかに 会って、街を 歩く 1日。 順番に 話を 聞いていこう。"],
    steps:[
        {who:"つむぎ", label:"駅で 集合（ちこく？）", lines:["（9時57分。 待ち合わせの あさひ台駅に ついた。 友だちは すでに 待っていた。）", "つむぎ｜主人公、遅いよー！ 女の子を 何分 待たせてるの？", "りさ｜マジで ギリギリじゃん。", "主人公｜えぇー、遅いのか？ これで…。", "つむぎ｜うん、遅い！ 余裕を もって 行動してよ！", "（そこへ 別の 友だちの すずが やってきた。）", "すず｜お待たせー！", "つむぎ｜主人公より 遅い人 いたわ（笑）", "すず｜おい 主人公！ 笑うなよ！ 君は 遅刻の 前科 15回 あるんだから！", "主人公｜まあね…。 でも それは 昔の 話でしょ？（笑）", "すず｜その 記録は まだ 引き継がれてるよ！ みんなに 信用して もらえるように 早く 行動しなきゃね！"],
            q:[{q:"主人公は 9時25分に 電車に のって、9時57分に 着いた。 何分 かかった？ また、待ち合わせ（10時）に 間に あうには どうする？", a:["32分。 1本 前の 電車に のって 余裕を もつ", "27分。 走れば 間に あう", "40分。 遅刻は かまわない"], hint:["語り手｜9時25分から 9時57分まで 引き算してみよう。 57 − 25 ＝ ？"], ok:["主人公｜57 − 25 ＝ 32分！ たしかに ギリギリ だった。 次からは 1本 前の 電車に のろう。", "語り手｜時間に 余裕を もつ ことは、相手への 思いやり。 信用は 小さな 約束の つみ重ねで できるよ。"]}]},
        {who:"ほのか", label:"ほのかと 再会", lines:["（ほのかは ほしぞらモールの 駐車場付近に いるらしい。）", "つむぎ｜みんなは バスで 行くから、主人公は 歩いてきてねー！", "主人公｜なんで ぼくだけ！？", "つむぎ｜バスの 中で 女子会を するから、主人公には 聞かれたくないの（笑）", "（主人公は 駅から 走りだした。 作戦名は 『走って 早く ほのかに 会う 作戦』。）", "ほのか｜あ、主人公じゃん！ 久しぶり〜！", "主人公｜久しぶり！！ 元気してる？（笑）", "ほのか｜元気だよ〜！ 家は 大変な ことに なっちゃったけどね。", "主人公｜マジか…。 それでも 元気で いられる ほのかは 素敵だよ！", "ほのか｜あざっす！！", "（みんなで ゲームセンターの 和太鼓リズムゲームで 大さわぎ。 ほのかとも 勝負した。）", "主人公｜いやー、楽しかった！", "ほのか｜また 勝負しようね！"],
            after:["（午前11時ごろ。 みんなが モールを 出ると、目の前で カップルが 言い争っていた。）", "ほのか｜あんまり ああいう 人たちの ことは 見ない ほうが いいよ。", "主人公｜…あの人、ぼくの 知り合いなんだ。", "（そこに いたのは、リュウという 男性だった。 主人公は 近づいて 話しかけた。）", "リュウ｜さっきから なにを 見てるんですか？", "主人公｜カイという 人から 聞きまして。 あなたが 女の子を もてあそんで いるのは 本当ですか？", "リュウ｜はい。 それの なにが いけないんですかね？", "（リュウは それ以上 話さず、車に のって 去っていった。）", "つむぎ｜主人公は あの人たちと つるんでるの？", "主人公｜ちがう。 ぼくは カイとは ちがう。"]},
        {who:"ほのかの おうち", label:"水に しずんだ 街", lines:["（午後2時ごろ。 みんなで ほのかの 家が ある 地域を 散歩した。）", "主人公｜…マジかぁ。", "（目の前に 広がっていたのは、湖のように なってしまった 街だった。 大雨で 川が あふれ、家々が 水に 囲まれていた。）", "主人公｜これは ひどすぎる…。", "ほのか｜家が なくなるって こんなに つらい ことなんだなって 理解できたよ。", "すず｜主人公なら、こんな とき どうする？"],
            q:[{q:"川が あふれそうな ときの 正しい 行動は？", a:["川や 水路に 近づかず、高い ところへ 早めに 避難する", "見に 行って 様子を 確かめる", "車で 水の 中を 通りぬける"], hint:["語り手｜水の 力は とても 強いよ。 近づくのは あぶない！ 避難は 早めが 大事。"], ok:["主人公｜ホテルに 泊まるか、それが 無理なら 住む 場所を さがすしか ないよね。", "語り手｜川の 増水 時は、近づかず 早めに 高い ところへ。 避難所や 親せきの 家など、避難先を 前もって 決めて おこう。"]}]},
        {who:"こうた", label:"親子の 言い争い", lines:["（そのとき、近くに いた 親子が さわいでいる ことに 気づいた。）", "ほのか｜あの子、かわいそう…。", "つむぎ｜主人公、助けて あげなよ。", "主人公｜わかった。 行ってくる。", "（父親が 子どもに 向かって 怒鳴っていた。）", "お父さん｜ふざけんじゃ ねぇよ！ こいつは 学校にも 行かねぇし！", "主人公｜そこまでだ、お父さん！ いくら 子どもが 言うことを 聞かなくても、暴力は 反対です！", "お父さん｜他人が 口を 突っ込んでくるな！"],
            q:[{q:"主人公の 言い方は、このあと どう 直すのが いいかな？", a:["相手の 話を 聞き、落ちついた 声で 『子どもの 気持ちも 聞いて あげて』と 伝える", "もっと 大声で 責める", "お父さんを 無視して 立ち去る"], hint:["ほのか｜主人公、それは ちょっと 言いすぎ…。 相手を 責めすぎると 話を 聞いて もらえなくなるよ。"], ok:["主人公｜…ごめん。 ぼくも 言いすぎた。 お父さん、すみません。 子どもの 話を 聞いて あげて ほしいんです。", "お父さん｜…すみませんでした。 こうた、ごめんね。", "お父さん｜君の おかげで、父親としての 役目を 考えなおそうと 思いました。 ありがとうございます。"]}],
            after:["（友だちの ところへ もどると、みんなが 笑顔で むかえてくれた。）", "すず｜主人公、やるじゃん！", "つむぎ｜かっこよかったよ！", "りさ｜将来、いい お父さんに なれるね！", "語り手｜相手を 責めすぎず、気持ちを 聞く。 これが 人を 変える 話しかたの コツだよ。"]}
    ],
    talks:[["カイ", ["カイ｜リュウは 女の子を からかって ばかりで、ゆるせなくて…。 でも 主人公は ぼくとは ちがうって 分かって くれて ありがとう。", "カイ｜ぼくも 気持ちの おさえ方を 見直さなきゃ。"]],
        ["こうた", ["こうた｜お父さん、さっきは ありがとう…。 ぼく、学校に 行けない 日も あるけど、がんばって 行って みようと 思う。"]]],
    fin:["語り手｜第5話は ここまで。 ほのかの ことを 気づかい、困っている 人を 助けた 日。", "ほのか｜主人公の おかげで 元気を とりもどせた！ 本当に みんな、協力して くれて ありがとう！", "語り手｜つづきは 9月26日。 すずの 家の 『ゲーム大会』だよ。"],
    learn:"時間に 余裕を もつと 信用が たまる。 川が あふれそうな ときは 近づかず 早めに 高い ところへ 避難。 相手を 責めすぎず、気持ちを 聞こう。"
});

DKE(6, {
    title:"やきそばと ひみつの 約束", sub:"シルバーウィーク あけの 大さわぎ ③", date:"2026年9月26日", theme:"lab", bgm:"town",
    intro:["語り手｜第6話。 9月26日。 朝7時、主人公は きりの原駅に ついた。", "語り手｜今日は すずの 家で みんなで ゲーム大会だよ。"],
    guide:["語り手｜ゲーム、料理、お客さん、そして 夜の 相談。 順番に 見ていこう。"],
    steps:[
        {who:"すず", label:"レースゲーム大会", lines:["（すずの 家で ゲーム機を 借りて、レースゲームで 大もりあがり！）", "すず｜主人公、そこで アイテム 使わないと ぬかれるよ！", "主人公｜わかってるって！ …あっ、コース アウト！", "つむぎ｜下手すぎ（笑）", "りさ｜でも 楽しそう！ 次は わたしに かして！", "（気づけば あっという間に お昼の 時間に なっていた。）", "すず｜せっかくだし、主人公の 手料理が 食べたい！", "主人公｜えっ、今から 作るの！？ 買いに 行けば いいじゃん！", "すず｜えー、作ってよー！"]},
        {who:"つむぎ", label:"やきそばを つくろう", lines:["（結局、主人公は 5人分の やきそばを 作る ことに なった。）", "つむぎ｜もっと こうした ほうが いいんじゃない？", "りさ｜その 順番で 大丈夫なの？", "主人公｜注文が 多いな！ 料理番組の 審査員かよ！", "主人公｜さて、5人分の 麺は 何玉 いるかな。 1人 1玉 食べるなら…。"],
            q:[{q:"5人が 1人 1玉ずつ 食べる。 麺は 何玉 いる？ また、やきそばを 作る ときの 安全は？", a:["5玉。 火を 使うので 目を はなさず、フライパンの 持ち手を 内側に", "3玉。 足りなくても がまん", "10玉。 火は 強火で 放っておく"], hint:["語り手｜5人 × 1玉 ＝ 5玉。 そして 火を 使う ときは 目を はなさない ことが 大事だよ。"], ok:["主人公｜よし、5玉！ 持ち手は 内側に して、やけどに 気を つけて…。", "みんな｜おいしい！", "主人公｜最初から そう 言ってくれれば いいのに！（笑）", "語り手｜料理は 安全が いちばん。 火の そばを はなれない、手を よく 洗う、が 基本だよ。"]}]},
        {who:"うらら", label:"うららの おしらせ", lines:["（午後4時ごろ、友だちの うららが すずの 家に やって きた。）", "すず｜ちょっと 夕食を 買ってくるね。 主人公、うららと 留守番してて！", "主人公｜了解！", "（すずが 出かけ、主人公と うららの 2人きりに なった。）", "うらら｜そういえば 主人公に 教えておきたい ことが あるんだよね。", "うらら｜2024年の 春に 初めて 会った ときの こと、覚えてる？", "主人公｜もちろん。 あの頃、ぼくは 雪村さんの ことで なやんでたんだ。", "うらら｜じつは わたし、雪村さんと 同じ 吹奏楽部だった 後輩 なんだよ。 明日、会う 約束を してるんだけど、一緒に 来る？", "主人公｜えええええ！？ 本当に！？ もちろん 行く！！", "うらら｜ちょっと（笑） そんなに 嬉しいの？", "主人公｜いや、そりゃ 嬉しいでしょ！！"],
            after:["（夕方、すずたちが もどってきた。）", "りさ｜ねえ 主人公、なんで そんなに ニヤついてるの？（笑）", "主人公｜なんでも なーい！ いい ことは 明日 おこるんだよ！", "（うららは そんな 主人公を 見ながら 笑っていた。 明日の 予定を 知っているのは、うららと 主人公だけ。）"]},
        {who:"すず", label:"夜の おねがい", lines:["（午後7時、みんなで お惣菜を 食べながら テレビの 格付け番組を 見た。 みんな 好き勝手に 予想して 大さわぎ。）", "（午後10時前、番組が おわり、つむぎ・りさ・うららは 帰っていった。）", "すず｜主人公、帰らないで ほしいんだけど。", "主人公｜…え？", "すず｜じつは 隣の 家が 最近 うるさくて、眠れないの！", "主人公｜あっ、そういうこと か…。 よかった（笑）", "すず｜なにと 勘違いしてるの！？", "すず｜本当に 寝不足で やばいの！ お願い、助けて！", "主人公｜わかった。 じゃあ、ひとつ 条件。 『友だちとして 一緒に 来た』って 設定に して。 そうじゃないと ぼくは ただの 不審者に なるでしょ？", "すず｜わかった。 じゃあ、呼び名を 決めよう。 主人公は『しゅぴー』ね！", "主人公｜じゃあ すずは『すずち』で！", "すず｜うん（笑） …で、騒音トラブルを 解決して くれるの？"],
            q:[{q:"夜の 騒音トラブル、まず する ことは？", a:["騒音の 大きさや 時間を 記録して、落ちついて 対処法を 考える", "いきなり 隣の 家に 突撃する", "なにもせず ひたすら がまん"], hint:["主人公｜まず 記録を とるのが 大事。 23時以降も うるさい かどうか、いつ どのくらい 続くか メモしよう。"], ok:["主人公｜よしっ、まずは 記録だ！ 23時以降も 騒がしいなら、どこに 相談するか 考えよう。", "すず｜わかった！"]}]}
    ],
    talks:[["雪村さんの うわさ", ["通りすがりの 人｜この 辺りは 夜も にぎやかだけど、ほどほどに ね。"]]],
    fin:["語り手｜第6話は ここまで。 夕方まで 楽しい ゲーム大会、夜は 騒音トラブルの 予感…。", "語り手｜つづきは 第7話 『騒音トラブルに 立ちむかえ』だよ。"],
    learn:"人数分の 量は かけ算で 考える。 火を 使う ときは 目を はなさない。 トラブルの 最初の 一歩は『記録を とる』。"
});

DKE(7, {
    title:"夜の 騒音トラブル", sub:"23時10分の ドンドン", date:"2026年9月26日（夜）", theme:"night", bgm:"castle",
    intro:["語り手｜第7話。 午後11時10分。 すずの 隣の 家から、パーティー会場のような 大音量が ひびきはじめた。", "語り手｜ここは ちょっぴり ドキドキだけど、『冷静に 対応する』 練習の 場面だよ。"],
    guide:["語り手｜記録 → 相談 → 話しあい → 最後の 対決。 順番に すすめよう。"],
    steps:[
        {who:"すず", label:"ドンドン 大音量", lines:["（午後11時10分ごろ。 となりから 大音量が 流れてきた！）", "主人公｜いや、これは さすがに 気づくだろ！（笑） 今すぐ 相談しよう。", "すず｜警察！？ こわくて 呼べないよ！（笑）", "主人公｜こんなに うるさいのに がまんし続ける ほうが おかしいから！"],
            q:[{q:"騒音が ひどくて 眠れない とき、どこに 相談するのが いいかな？", a:["警察の 相談窓口や 管理会社・大家さん。 急ぎの 危険が あれば 110番", "SNSに 隣人の 名前を ばらす", "仕返しに こちらも 大きな 音を 出す"], hint:["主人公｜仕返しや ばらすのは 新しい トラブルの もと。 公的な 相談先に 頼ろう。"], ok:["主人公｜よし、緊急性が あるかを 確認して、警察に 連絡しよう。", "語り手｜騒音は 管理会社や 大家さん、警察の 相談窓口へ。 緊急の ときは 110番。 仕返しは しない。"]}]},
        {who:"おまわりさん", label:"警察が 注意", lines:["（午後11時30分ごろ、警察官が 到着し、隣の 住民に 注意して くれた。）", "おまわりさん｜近隣の 方々が、騒がしくて 眠れない との ことです。 ご協力を お願いします。", "となりの 男性たち｜あっ、すみませんでした。", "主人公｜はい、一件落着！", "すず｜よかったぁ…。", "（これで ようやく 静かな 夜が もどって くる。 …はずだった。）"],
            after:["（約20分後。 再び 隣の 家が うるさくなった。）", "主人公｜マジかよ！ また かよ！", "すず｜どうしてくれるの！！ しゅぴー！", "主人公｜もう 突撃して やる！", "すず｜えぇ、それは ダメ！"]},
        {who:"すず", label:"インターホンで はなす", lines:["主人公｜じゃあ どうしろっていうんだよ！ このままじゃ 一生 解決しないぞ！", "すず｜それは いやだよ…。 でも 解決するためなら、隣の 家に 直接 話しても いいと 思う。", "主人公｜わかった。 じゃあ、すずちも 一緒に ついてきて。", "（2人は 隣の 家へ むかい、インターホンを 押した。）", "ピンポーン。", "男性｜はーい。", "主人公｜すみません、夜 遅くに。 少し お話し してもよろしいでしょうか？"],
            q:[{q:"インターホンで 話す とき、いちばん いい 伝えかたは？", a:["『楽しむのは いいけど、周りの 迷惑にも 気を つけて ください』と ていねいに 伝える", "『うるさい！ 出てこい！』と どなる", "ドアを たたいて 追いはらう"], hint:["語り手｜どなったり 脅したり すると、相手は 身を まもろうと して もっと 危ないよ。"], ok:["主人公｜皆さんが 楽しむ こと 自体は 構いません。 ただ、周りに 迷惑を かけないで ほしいんです。 こちらも 静かに 生活したいだけです。", "男性｜そ、それは 申し訳ありませんでした。 こちらも 気をつけます。", "主人公｜ありがとうございます。 ほら、すずちも。", "すず｜お願いします！"]}]},
        {who:"墨野さん", label:"元隣人 あらわる！", lines:["主人公｜…と、これで 終わりだと 思っちゃ ダメですよ。", "すず｜え？", "主人公｜実はー、この中にー、元隣人が かくれて いますねー！", "すず｜えぇ！？ もしかして…。", "主人公｜墨野さーん！ お久しぶりでーす！", "墨野さん｜引っ越したと 思ったら、今度は 友人の 家の 騒音まで 注意するんですね…。", "主人公｜お前が いるってことは、うるさいって ことなんだよ！！", "墨野さん｜もう 静かにするので、警察は 呼ばないでください！", "主人公｜わかった。 じゃあ、よろしくな！", "（突然 家の 中から ふくらんだ ふしぎな かげが 飛びだした！ 『さわがしノイズ』だ！）"],
            battle:dkFoe("dk7_noise", "さわがしノイズ", "📢", "dk7_boss", 60, [["ドンドコ おんぱ", 1, 0.9, 0.9], ["ぐるぐる スピーカー", 0, 1, 1.3], ["夜ふかし ストンプ", 0, 0.7, 1.8]], "さわがしノイズ「ボリューム 最大だー！」", 0.9),
            after:["（さわがしノイズが しゅるしゅる しぼんで 消えた。 家の 中は しーんと 静かに なった。）", "すず｜主人公、すごすぎる！！（笑）", "主人公｜これくらい 言わないと 聞いて くれないんだよ。", "すず｜終電、逃しちゃったよね？", "主人公｜もう いいよ。 変なことは しないから 玄関で 寝かせて ほしい。", "すず｜いや、リビングで 寝ていいよ！（笑）", "主人公｜それは 勘弁してくれー！", "（こうして 午前2時ごろ、主人公は 玄関で 眠りに ついた。）"]}
    ],
    talks:[["となりの 男性", ["となりの 男性｜さっきは すみませんでした。 夜は 音を ひかえめにします。", "となりの 男性｜みなさんが 楽しい 時間を すごすのは いいけど、周りの 人にも 気を 配らないと ですね。"]]],
    fin:["語り手｜第7話は ここまで。 冷静に 記録して、相談して、ていねいに 伝える。 これが 騒音トラブルの 基本。", "語り手｜つづきは 9月27日。 『白石さん』ならぬ 『雪村さん』との 再会だよ。"],
    learn:"騒音トラブルは 記録 → 相談 → ていねいに 伝える。 仕返しや どなるのは ダメ。 急ぎの 危険が あれば 110番。"
});

DKE(8, {
    title:"雪村さんと 変わった 主人公", sub:"念願の 再会", date:"2026年9月27日", theme:"lake", bgm:"field",
    intro:["語り手｜第8話。 9月27日 朝6時。 主人公が 起きると、すずは おどろいた 顔を した。", "すず｜はぁ！？ 起きるの 早すぎ！（笑）", "主人公｜ほら、しおかぜ駅に 行くよ！ 今日は 大切な 日なんだから！"],
    guide:["語り手｜雪村さんとの 再会、そして 主人公の 本音。 順番に 見ていこう。"],
    steps:[
        {who:"うらら", label:"しおかぜ駅で 待ちあわせ", lines:["（午前9時、しおかぜ駅に 到着。 うららが 待っていた。）", "うらら｜すずち、しゅぴー、おはよう！", "主人公｜さーて、どこに いるのかな？", "うらら｜まだ 来てないよ！ 10時集合だから！（笑）", "主人公｜がくーん…。", "すず｜え？ だれか 来るの？", "うらら｜あっ、そうそう！ すずちには 話してなかったね。 しゅぴーの お気に入りの 雪村さんと、わたしが 今日 会う 約束をして いて。", "すず｜あらー、またまた わがまま 言っちゃって！", "主人公｜この ための シルバーウィークの 休みなんだから！（笑）", "すず｜女の子に 会うための 休み？（笑）", "主人公｜いや、そういう わけでは ないー！ 今日は 本当に 大切な 日だから！"],
            q:[{q:"待ちあわせの 1時間前に 着いて しまった。 その 時間の 使い方で いいのは？", a:["本や 勉強、散歩で 有効に 使う。 相手には 先に 連絡しておく", "ずっと そわそわして 何もしない", "約束より 早く 来た ことを 怒る"], hint:["語り手｜早く 着くのは 悪く ないよ。 待ち時間を 有効に 使おう。"], ok:["主人公｜よし、時間を 有効に 使おう。 雪村さんに 失礼の ない ように 準備を…。"]}]},
        {who:"雪村さん", label:"雪村さんと カフェ", lines:["（午前10時ごろ、雪村さんが 到着した。）", "主人公｜おぉ！ 雪村さん！！！", "雪村さん｜えぇ？ 主人公さん！？", "（雪村さんは おどろいた 拍子に 片足の 動きが おかしく なってしまった。）", "主人公｜あらら、大丈夫ですか？（笑）", "雪村さん｜びっくりして、足まで びっくり しちゃいました！（笑）", "主人公｜会って 早々、質問なんですが…会社、辞めちゃったんですね。 やっぱり ぼくの せいですか？", "雪村さん｜まあ、いろいろ ありますよ。 主人公さんは わたしを 守って くれたので、感謝しています。", "雪村さん｜せっかくなので カフェで お茶しましょう！", "みんな｜はい！", "（雪村さんが みんなの 分を おごって くれた。）", "主人公｜うわー、いいなー！ 最高すぎる！ 今 幸せです！", "雪村さん｜そんなに 堅くならなくて いいですからね（笑）"]},
        {who:"雪村さん", label:"雪村さんの お仕事の 話", lines:["主人公｜今の 仕事は どうですか？", "雪村さん｜今は 販売職と 事務職を していますよ。 大変ですけど がんばっています。 主人公さんは？", "主人公｜ぼくは 現場に 入ってから 来月で 1年です。 開発の 仕事に 加われるかは ぼくの スキル しだいです。", "雪村さん｜実は、内勤が いやだったことも 辞めた 理由の ひとつなんです。", "主人公｜…補助講師を 誰が やるか 問題ですか？", "雪村さん｜そう、それです！ 社長が 空いている 内勤メンバーを 強制的に 補助講師に する、と 言いはじめたんです。 それが どうしても 耐えられなくて…。", "主人公｜そ、そんな…。 ぼくが 補助講師 だったら 辞めて なかった、ってことですか？", "雪村さん｜うーん、どうでしょうね（笑）"],
            q:[{q:"仕事の 悩みを 友だちに 打ち明けた とき、いちばん 大切なのは？", a:["お互いの 気持ちを 聞いて、自分の せいに しすぎない", "全部 自分の せいだと 思う", "相手の せいに して 文句を 言う"], hint:["語り手｜会社の 事情や 人の 気持ちは、ひとりの 責任じゃ ないよ。"], ok:["主人公｜…話せて よかったです。 ずっと 心に のこっていた 疑問が 解けました。", "雪村さん｜主人公さんは これからも がんばって くださいね！", "主人公｜はい！ 雪村さんの 分まで がんばります！"]}]},
        {who:"すず", label:"変わってしまった 理由", lines:["（正午ごろ、雪村さんと 別れた あと。 主人公と すずは 主人公の 家で ゲーム大会を した。）", "すず｜ねえ、主人公って 彼女を 作る 気 ないの？", "主人公｜ないね。 それよりも 来月末で 現場が 終了に ならないように、プログラミング言語の 勉強を しないと いけないんだよ。", "すず｜仕事も 大事だけど、少しは プライベートも 大切に したら？", "すず｜あの頃の 主人公は、今の 10倍くらい 元気だったよ。 そのテンションの 高い 主人公が みんな 好きなんだよ。 今の 主人公は ちょっと 悲観的に なってる 気が する。 どうして そうなっちゃったの？", "主人公｜つらい ことが いろいろ 重なって、こうなっちゃった んだと 思う。", "主人公｜ネットで 知り合った まひろ、昔からの 友だち、はなと さくら、以前からの 知り合い、社会人に なってから 出会った 雪村さん、迷惑ボーイの リュウ、騒音ボーイの ケンジ…。 こういう 人たちとの 間で かかえた 悩みが 重なって 今の 自分に なったんだと 思う。", "すず｜そっか…。 でも すべてを ひとりで 解決しなくて いいんだよ。 たまには 自由に、のんびり した 時間を すごした ほうが いいと 思う。"],
            q:[{q:"悩みが たくさん 重なった とき、主人公は どうするのが いいかな？", a:["信頼できる 人に 相談して、休む 時間も つくる", "全部 ひとりで 解決しようと がんばりつづける", "悩みを 無視して 何も しない"], hint:["すず｜がんばりすぎると 疲れて しまうよ。 まわりの 人に たよるのも 勇気だよ。"], ok:["主人公｜…少しくらい 休んでも いいのかも しれないな。", "（そうつぶやきながら、主人公は 家路に ついた。 9月27日。 なつかしい 人との 再会と、自分を 見つめなおす きっかけに なった 1日だった。）"]}]}
    ],
    talks:[["駅の 売店の おばさん", ["駅の 売店の おばさん｜あら、今日は 待ち合わせ？ いい 天気だから 散歩 日和ね。", "駅の 売店の おばさん｜あたたかい お茶でも どうぞ。 お代は けっこうよ。"]]],
    fin:["語り手｜第8話は ここまで。 念願の 再会と、ちょっと だけ 肩の 力が ぬけた 1日だったね。", "語り手｜つづきは 第9話。 10月3日、思わぬ 誤解が 待っているよ。"],
    learn:"悩みは ひとりで かかえず、信頼できる 人に 相談しよう。 休む 時間も 大切。 待ち時間は 有効に 使おう。"
});


/* ==== game/dk3.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[43]=1;
"use strict";
// ===== 出来事 ③ 第9〜10話 =====
DKE(9, {
    title:"ごかいと ゆめを とりもどした 友だち", sub:"すれちがいと、さいごの 約束", date:"2026年10月2日〜4日", theme:"snow", bgm:"town",
    intro:["語り手｜第9話。 10月2日の 夜、すずが 元気が なさそうに 会いに きた。", "語り手｜ここから 2日間は、すれちがいと 友情の おはなし。 ゆっくり 見ていこう。"],
    guide:["語り手｜相談 → ごかい → 作戦 → 最後の 約束。 順番に 見ていこう。"],
    steps:[
        {who:"まどか", label:"美容師の まどかの 相談", lines:["（10月2日の 夜10時。 ファミリーレストランで すずが 話しはじめた。）", "すず｜じつは、海ぞい県に 住んでる まどかって 人の ことで 相談が あるんだ。 美容師さんなんだけど、最近 つらい ことが あって、仕事を 休んでるらしいの。", "主人公｜わかった。 ぼくで よければ 話を 聞くよ。", "（10月3日の 午後1時ごろ。 主人公は はまかぜ駅に 到着した。 そこで 待っていたのは まどかだった。）", "まどか｜お客さんからの クレームが 続いて、店長にも きびしく 言われて、精神的に 追いつめられて しまって…。", "主人公｜そっか。 大変だったね。 じゃあ、ひとまず ぼくを 練習台に して いいよ！ スポーツがりに しちゃって！", "（まどかに 髪を 切って もらった 主人公は スッキリ！）", "主人公｜あっ、そうだ！ まどかも 思いきって 髪を 切って イメチェンして みたら？", "まどか｜…この 髪型が ダメなの？", "主人公｜あっ、いや、そういう わけじゃ ないよ！"],
            q:[{q:"まどかは 『この 髪型は お気に入り』と 言った。 主人公は どう 返すのが いいかな？", a:["「ごめんね、余計な ことを 言ったね」と あやまって 相手の 気持ちを 大切に する", "「でも 変えたほうが いいよ」と おし通す", "だまって 帰る"], hint:["語り手｜相手が 大切に している ものを、本人の 気持ちを 聞かずに 変えようと しては いけないよ。"], ok:["主人公｜ああ、ごめんごめん。 余計な ことを 言っちゃったね。", "まどか｜ううん、大丈夫。"]}]},
        {who:"すず", label:"すれちがいの 電話", lines:["（そのとき、主人公の スマホに すずから 電話が かかってきた。）", "すず｜主人公、マジで 最低。", "主人公｜えっ？ ちょっと 落ちついてくれ！", "すず｜やっぱり リュウって 人と 関わってたんだね！", "主人公｜えぇ！？ ちがうんだって！", "すず｜もう 二度と わたしたちに 関わらないで。 まどかの 件も わたしたちで どうにかするから。", "主人公｜待ってくれ！ リュウに 協力なんて 一切 してないんだ！ 被害に あって いないか 心配で 連絡しただけなんだよ！", "すず｜…もう 信じられない。 ごめん、電話 切るね。"],
            q:[{q:"ごかいを とく ために、いちばん いい 方法は？", a:["落ちついた 時に、事実を 順番に 説明して、相手の 気持ちを 聞く", "何度も 電話して 言いわけを つづける", "SNSで みんなに 反論を ばらまく"], hint:["語り手｜相手が 怒っている ときは、まず 落ちつく 時間を あげよう。 そのあと 事実を 順番に 話すと 伝わりやすいよ。"], ok:["主人公｜…そうか。 今は 無理に 話さないほうが いいね。 まずは 落ちついて 事実を 整理しよう。", "（16時ごろ、みなと橋駅で すずと 会った。 『今後、リュウと 関わらないって 約束できる？』 主人公は 『うん、約束する』と 答えた。 でも、すずは 『ちょっと こわく なっちゃったから 距離を おくね』と 言った。）"]}]},
        {who:"ジロウ", label:"ジロウの 緊急連絡", lines:["（その日の 19時ごろ。 主人公に ジロウから メールが とどいた。）", "ジロウ｜大変だ！ タケルが また、夜の おもてなしクラブの アルバイトを はじめたみたい！ 明日、ほしぞらモールまで 来て、タケルを 説得 してくれない？ ぼくも そばに いるけど、何て 言えば いいのか わからなくて…。", "主人公｜わかった。 明日、ほしぞらモールに 行くよ。 タケルの 家に 10時集合ね。", "（夜。 主人公は ネットで 知り合った 友だちを 思いうかべながら、ある 人物に メッセージを 送った。）", "主人公｜明日、タケルくんと 会うんだけど、一緒に 来てほしい。", "ミユ｜えぇ！？ めっちゃ なつかしいじゃん！（笑）", "ミユ｜わかった！ 劇団の 演技力 見せつけるよ！"],
            after:["（主人公は 一息ついて つぶやいた。）", "主人公｜最近 こんな ことばっかり だな…。 そりゃ 物語も こういう 話に なるわけですわ…。"]},
        {who:"タケル", label:"説得 作戦！", lines:["（10月4日 午前10時30分。 タケルの 家の 前。 ようやく タケルが やってきた。）", "タケル｜えっ！？ ミユじゃん！ 久しぶり！！", "ミユ｜タケルくん、久しぶり！ 今 劇団の 仕事を してるよ！", "タケル｜すごっ！ 主人公より すごいな！（笑）", "主人公｜おいっ！（笑）", "（そして 本題。 ミユが 少し 表情を くもらせた。）", "ミユ｜最近 いい ことが なくて つらいんだよね…。 じつは わたしの お姉ちゃんが、おもてなしクラブに 通いすぎて、おこづかいじゃ 返せない 借金を かかえて しまったの。", "タケル｜ごめん、悪い 印象を あたえちゃって…。 悪い 人ばかりじゃ ないよ。 俺が 保証する！", "主人公｜そう、そのとおりだ！ 『保証する』って 言って 安心させる。 なんて 巧妙な 話し方なんだ…！", "主人公｜売上や 順位を 上げるために 相手に お金を 使わせようと する 人も いる。 それは 信頼を 失うことだよ！", "（そこへ お金を つかわせる ことば ばかり ささやく 『さそいごえノイズ』が あらわれた！）"],
            battle:dkFoe("dk9_noise", "さそいごえノイズ", "💸", "dk9_boss", 62, [["あまい ささやき", 1, 0.9, 0.9], ["ぐいぐい ぐるぐる", 0, 1, 1.3], ["おかね ふぶき", 0, 0.7, 1.8]], "さそいごえノイズ「かんたんに もうかるよ〜！」", 0.9),
            after:["タケル｜…主人公、わかった。 アルバイトは 今月で 辞めるよ。 ゲームクリエイターや デザイナーの 勉強を してみようかな。", "主人公｜うん！ 約束だからね！", "ミユ｜わたしからも 約束してね！", "タケル｜わかった！", "（こうして タケルは アルバイトを やめ、もう一度 自分の 夢に 向きあう ことを 決意した。）"]}
    ],
    talks:[["つむぎ", ["つむぎ｜（桜が 丘駅で）主人公、ごめん。 わたしたちは 今日で 距離を おく ことに したの。 わたしたちにも それぞれ 大切な 人が できたし…。", "つむぎ｜さようなら。 …でも、元気で いてね。"]],
        ["ジロウ", ["ジロウ｜主人公、ありがとう。 タケルが また 夢に むかって くれたよ。 ぼくも 気持ちを 切りかえるから、主人公も がんばろうな！"]]],
    fin:["語り手｜第9話は ここまで。 すれちがいも あったけれど、友だちの 夢を 取りもどす お手つだいが できたね。", "語り手｜つづきは 最終話。 10月31日、AREChat の 最終テストだよ。"],
    learn:"ごかいは 落ちついてから 事実を 順番に 説明する。 相手が 大切に している ものは 尊重する。 友だちの 夢を 応援しよう。"
});

DKE(10, {
    title:"AREChat 始動！", sub:"騒音トラブルに 終止符", date:"2026年10月31日〜11月1日", theme:"stage", bgm:"demoncastle",
    intro:["語り手｜最終話。 10月31日。 主人公は 開発を すすめてきた チャットサービス『AREChat』の 最終テストに 取りくんでいた。", "語り手｜11月1日から いよいよ 運用開始。 でも、その前に もう ひとつ 片づけなければ ならない 問題が…。"],
    guide:["語り手｜最終テスト → ふしぎな 事件 → 証拠 → 管理会社。 順番に 見ていこう。"],
    steps:[
        {who:"テスト係", label:"AREChat 最終テスト", lines:["（10月31日。 動作確認、メッセージの 送受信、各機能の チェック。 不具合が ないか ひとつずつ 確認していく。）", "主人公｜よし…これで 最後！", "テスト係｜テストの 順番を きめよう。 いちばん 大事な 順番は？"],
            q:[{q:"チャットの テスト、いちばん いい 順番は？", a:["ログイン → メッセージ 送信 → 受信 → 各機能の チェック", "ぜんぶ 一度に 適当に 試す", "本番を 先に 公開してから 試す"], hint:["語り手｜基本機能から 順番に 確認して、問題が 起きた ところを すぐ 見つけられるように しよう。"], ok:["主人公｜よし、基本から 順番に。 …動いた！ ついに テスト 完了！", "主人公｜11月1日から いよいよ 運用開始だ！", "テスト係｜おめでとう！"]}]},
        {who:"にせ おまわりさん", label:"にせ警官 さわぎ", lines:["（そんな ある日。 主人公の 前に、警察官の ような 格好を した 人物が あらわれた。）", "にせ おまわりさん｜動くな！ 確保する！", "主人公｜…は？", "（状況を 理解する 間もなく、主人公は おもちゃの 手錠を かけられて しまった！）", "主人公｜ちょっと 待て！ あなた、本当に 警察官 なのか！？", "（相手は 答えず、主人公を おさえつけようと した。）", "主人公｜危険を 感じる…！ とっさに おもちゃの 水てっぽうで 相手を けんせいして、その場から はなれた！", "（主人公は 安全な 場所へ 逃げ、息を ととのえた。）", "主人公｜相手が 何者か わからない ときは、むりに 対抗しないで、まず 安全な 場所へ にげる。 これが 大事だ。", "（けれど 相手は あきらめず、『にせ警官ノイズ』に 姿を 変えて おいかけて きた！）"],
            battle:dkFoe("dk10_noise", "にせ警官ノイズ", "🚓", "dk10_boss", 64, [["ぴーぴー ホイッスル", 1, 0.9, 0.9], ["おもちゃ 手錠", 0, 1, 1.3], ["ブーブー サイレン", 0, 0.7, 1.8]], "にせ警官ノイズ「おとなしく しろー！」", 0.9),
            after:["（にせ警官ノイズは ひゅるひゅると 小さく なって 消えて いった。）"]},
        {who:"けいさつの 人", label:"決定的な 証拠", lines:["（主人公には ひとつ 考えが あった。 相手が おそってくる 瞬間を、カメラで 撮影して いたのだ。）", "主人公｜…よし。 これなら 何が 起きたのか 説明できる。", "（主人公は 撮影した 映像を 確認し、警察に 届け出た。）", "けいさつの 人｜映像を 見ました。 相手が 近づいて 手錠を かけようと する 様子が 記録されて いますね。 状況を 確認して、関係者に 話を 聞いた うえで 注意を おこないます。"],
            q:[{q:"あやしい 人に 会ったとき、とるべき 行動は？", a:["安全な 場所へ にげて、可能な 範囲で 記録を とり、警察などに 相談する", "ひとりで 立ち向かって けんかを する", "だまって がまんする"], hint:["けいさつの 人｜むりに 立ち向かうと けがを する 危険が あるよ。 まず 安全第一！"], ok:["主人公｜これで 少しは 安心できるかな…。", "語り手｜安全な 場所へ にげる → 記録を とる → 公的な 機関に 相談。 この 3つが 大事だよ。"]}]},
        {who:"管理会社の 人", label:"騒音ボーイ ついに 動く", lines:["（警察から 注意を 受けたのは、以前から 騒音トラブルを 起こしていた 人物、通称『騒音ボーイ』 だった。）", "管理会社の 人｜不動産の 管理会社です。 これまでの ご相談と 警察への 届け出を ふまえて、騒音ボーイさんに 注意を おこないました。", "管理会社の 人｜その結果、騒音ボーイさんは 引っ越しを 検討しはじめた そうです。", "主人公｜…ようやく ここまで 来たか。", "（長く 続いていた 騒音トラブル。 管理会社への 相談、警察への 届け出、そして なんども おきた 問題。 そのすべてが ようやく 解決へ むかった。）", "管理会社の 人｜もちろん 引っ越しは 検討段階で、実際に 転居した わけでは ありません。 それでも 大きな 前進ですね。"],
            after:["主人公｜これで やっと 落ちついて 生活できる…！"]}
    ],
    talks:[["サポート係", ["サポート係｜AREChat は 無料で 使える チャットサービス。 安心して つかえるように、みんなで ルールを まもろうね。", "サポート係｜こまった ときは 管理者に 相談してね。"]]],
    fin:["語り手｜11月1日（日）。 AREChat の 運用が 始まった。", "主人公｜よし…今日から 本番だ！", "主人公｜仕事も 生活も、ようやく 前に 進みはじめたな…。 今度こそ 落ちついた 毎日に なりますように！", "語り手｜こうして 主人公の 長い 騒音トラブルは ひとまず おわりを むかえた。", "語り手｜そして 11月1日。 AREChat と 主人公の 新しい 日々が、同時に 始まったのだった。"],
    learn:"あやしい 人に 会ったら 安全第一。 にげる → 記録 → 公的な 相談。 ひとつずつ 問題に 向きあえば、道は ひらける。"
});

// ---------------------------------------------------------------- 出来事ぜんぶ クリア
RPG_EV.dk_final = YKL([
    "語り手｜これで 『出来事』の 10話は ぜんぶ おしまい。", "語り手｜うれしい ことも、つらい ことも、たくさん あったね。 それでも 主人公は 前に 進んだ。", "語り手｜名前や 地名は 変えてあるけれど、ここに あるのは 『だれにでも 起こりうる 日常』。 きみの 毎日にも、同じように 小さな 出来事が たくさん あるはず。",
    "語り手｜ありがとう、ここまで 付きあって くれて。 これで ARE QUEST は 『完』！ …また どこかで 会おう！"
]).concat([["gold", 300000], ["item", "special", 10], ["item", "omamori", 5], rpgN("300,000G と スペシャルおにぎり 10こ・ふっかつのおまもり 5こを てにいれた！"), ["set", "e_dk_all"], ["run", "lab_ret_go"]]);


/* ==== game/dk-end.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[44]=1;
"use strict";
// ===== 出来事：ゲートの 行き先・称号・もくてき・チート =====
(function(){
    const T = DK_EPS.map((e) => e.title);
    for(let i = 1; i <= 10; i++){
        RPG_ERAS.push({id:"dk" + i, n:"おまけ：出来事 第" + i + "話 " + T[i - 1] + "（クリア後・推奨 Lv30〜）", map:"dk" + i, pos:[9, 10], done:"e_dk" + i, req: i === 1 ? "e_future" : "e_dk" + (i - 1)});
    }
    const xe = RPG_ERAS.find((e) => e.id === "xr"); if(xe){ RPG_ERAS.splice(RPG_ERAS.indexOf(xe), 1); RPG_ERAS.push(xe); }
    const F = (k) => () => !!G.S.f[k];
    for(let i = 1; i <= 10; i++){
        const t = {id:"t_dk" + i, n:"出来事 第" + i + "話", d:"出来事 第" + i + "話を クリア", f:F("e_dk" + i), g:300 + i * 80}; TQ_TITLES.push(t); TQ_TITLE_BY[t.id] = t;
    }
    const all = {id:"t_dk_all", n:"出来事 かんけつ！", d:"出来事 10話を ぜんぶ クリア", f:F("e_dk10"), g:8000}; TQ_TITLES.push(all); TQ_TITLE_BY[all.id] = all;
    const _obj = tqObjective;
    window.tqObjective = function(){
        const r = _obj(), f = G.S.f;
        if(/^(クリア おめでとう|ぜんぶ クリア)/.test(r)){
            for(let i = 1; i <= 10; i++) if(!f["e_dk" + i]) return "おまけ：出来事 第" + i + "話『" + T[i - 1] + "』へ（ゲート）";
        }
        return r;
    };
    Object.keys(RPG_EV).filter((k) => /^dk/.test(k)).forEach((k) => {
        const walk = (a) => { if(!Array.isArray(a)) return; if(a[0] === "say" && typeof a[1] === "string" && a[1] && !TQ_PORTRAIT_LOOK[a[1]]) yPortrait(a[1]); a.forEach(walk); };
        walk(RPG_EV[k]);
    });
})();


/* ==== game/ld.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[45]=1;
"use strict";
// ===== テーマパーク編（コイヌネランド／ワンコロランド／ウサウサランド）エンジン =====
//   dk.js の 場面システム（DKE）を そのまま つかい、ランドごとの 名前・難しさ・ごほうびだけ かえる。
const LD_EPS = {kn:[], wn:[], us:[]};
const LD_AREA = {kn:"コイヌネランド", wn:"ワンコロランド", us:"ウサウサランド"};
Object.assign(Y_PEOPLE, {
    "タカシ":["#f6d2b0", "#2d2118", "spike", "#e8506b", "#374151", "none"], "ケンジ":["#f9d9bd", "#1b1b27", "short", "#2f6fdc", "#4b5563", "glasses"],
    "リヒト":["#f6d2b0", "#1f2a44", "short", "#14b8a6", "#374151", "none"], "サトル":["#f3cfae", "#4a2a1a", "cap", "#f2c94c", "#35507a", "none"],
    "アカネ":["#f9d9bd", "#7a4a2a", "twin", "#c0475a", "#4b3a6b", "none"], "マイカ":["#f6d2b0", "#2a1a14", "bob", "#8a5ab6", "#6a4a7a", "none"]
});

// land: kn / wn / us ,  n: 1〜10 ,  c: DKE と おなじ ＋ lv（推奨レベル）, mobs:[[emo,name]×3]
function LDX(land, n, c){
    const m = land + n, L = "abcdefghij", flags = c.steps.map((_s, i) => m + "s" + (i + 1)), area = LD_AREA[land];
    LD_EPS[land].push({n, title:c.title, sub:c.sub, lv:c.lv, learn:c.learn});
    c.steps.forEach((s, i) => dkScene(m + "_" + L[i], i ? flags[i - 1] : "", i ? c.steps[i - 1].label : "", Object.assign({flag:flags[i]}, s)));
    (c.talks || []).forEach((t, i) => { RPG_EV[m + "_t" + (i + 1)] = YKL(t[1]); });
    const list = c.steps.map((s, i) => ["if", flags[i], [], [rpgN("・" + s.label + "（まだ）")]]);
    const base = c.base || (2500 + n * 450 + (land === "wn" ? 3000 : land === "us" ? 8000 : 0));
    const reward = [["gold", base], ["item", "special", 3], ["item", "omamori", 1], rpgN(base + "G と スペシャルおにぎり 3こ・ふっかつのおまもり 1こ を てにいれた！"), rpgN("📖 今回の まなび：" + c.learn)];
    RPG_EV[m + "_hq"] = [["if", "e_" + m, YKL(c.after || ["語り手｜この 話は もう おしまい。 ゲートから つぎへ すすもう！"]),
        [["if", flags.join("&"), YKL(c.fin).concat(reward, [["set", "e_" + m]], (c.last !== undefined ? c.last : n === 10) ? [["run", land + "_final"]] : [["run", "lab_ret_go"]]), YKL(c.guide || ["語り手｜町の 人に 話しかけて、場面を じゅんばんに すすめよう。 さいごは わたしに 話しかけてね。"]).concat(list)]]]];
    RPG_EV[m + "_enter"] = [["if", "!" + m + "_in", [["set", m + "_in"], ["set", land + "_started"]].concat(YKL(c.intro)), []]];
    const objs = [yNpc(m + "_hq", Y_GUIDE[0], Y_GUIDE[1], "語り手", m + "_hq")];
    c.steps.forEach((s, i) => objs.push(yNpc(m + "_" + L[i], Y_SLOT[i][0], Y_SLOT[i][1], s.who, m + "_" + L[i])));
    (c.talks || []).forEach((t, i) => objs.push(yNpc(m + "_t" + (i + 1), Y_SLOT[c.steps.length + i][0], Y_SLOT[c.steps.length + i][1], t[0], m + "_t" + (i + 1))));
    RPG_MAPS[m] = yMap(c.theme, objs, (c.area || area) + " 第" + n + "話　" + c.title);
    RPG_ENTER[m] = m + "_enter"; TQ_BGM_MAP[m] = c.bgm || "field";
    c.steps.forEach((s) => yPortrait(s.who)); (c.talks || []).forEach((t) => yPortrait(t[0]));
}
// 戦う 相手（ランドの 推奨レベルに あわせた ボス）
const ldFoe = (id, name, emo, img, lv, acts, say, mult) => dkFoe(id, name, emo, img, lv, acts, say, mult || 1);

// ---- かきやすい ヘルパー ----
const _A = (x) => x == null ? [] : Array.isArray(x) ? x : [x];
const LP = (who, label, lines, after) => ({who, label, lines, after:_A(after)});                    // ふつうの 場面
const LB = (who, label, lines, foe, after) => ({who, label, lines, battle:foe, after:_A(after)});    // たたかい 場面
// なぞ場面：qs = [[もんだい, せいかい, [まちがい…], ヒント, せいかいの ひとこと]…]
const LQ = (who, label, lines, qs, after) => ({who, label, lines, after:_A(after), q:qs.map((x) => ({q:x[0], a:[x[1]].concat(x[2]), hint:_A(x[3]), ok:_A(x[4])}))});


/* ==== game/kn.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[46]=1;
"use strict";
// ===== コイヌネランド（本編・全10話）=====
//   夏の テーマパークで タカシと ケンジが 大わらい。 さいごは なぞとき イベントに ちょうせん！
LDX("kn", 1, {title:"のろのろ ニャンダット", sub:"いちばん人気の コースター", lv:28, theme:"park", bgm:"field",
    intro:["語り手｜まぶしい 夏の 日。 タカシと ケンジは 『コイヌネランド』に やってきた！", "語り手｜ふたりの ゆかいな 1日を、いっしょに 見ていこう。 悪い 人は 出てこない、わらえる おはなしだよ。"],
    steps:[
        LP("ケンジ", "ゲートの ふたり", ["ケンジ｜タカシ、ついに 来たね！ ぼくは ちょっと こわいなぁ。", "タカシ｜だいじょうぶ、だいじょうぶ！ ぼくは いつも 自信まんまんだから！", "ケンジ｜（ほんとうは タカシが ジェットコースター きらいなの、知ってるんだけど…）"]),
        LQ("タカシ", "いちばんうしろの せき", ["タカシ｜まずは 一番人気の 『ニャンダット』だ！ すっごい 速いって ウワサだよ。", "ケンジ｜え〜、こわいよ。 一番うしろの せきだったら にげるからね！", "タカシ｜そんな 予言、当たるわけ ないじゃ〜ん！", "（……じっさいに 乗る ばんが きた。 なんと 席は 一番うしろ！）", "タカシ｜うそー！ これは 聞いてない！"],
            [["ウワサだけで 『ぜったい こわい』と 決めつけるのは いいかな？", "じっさいに 体験して たしかめるのが いちばん", ["ウワサが ぜんぶ 正しいから 信じる", "こわそうだから ぜったい 近づかない"], "ケンジ｜ウワサは ウワサ。 じぶんの 目で たしかめよう！", "ケンジ｜そうだね！ 見た目や ウワサだけで 決めつけない ことが 大事だね。"]]),
        LP("係員", "のろのろ ニャンダット", ["（コースターは どんどん 上昇… いよいよ 急降下！ と 思ったら…）", "タカシ｜えぇ？？", "ケンジ｜おっそ！", "タカシ｜なんだこれ、トロッコかよ！ ゆっくり 降りるの、逆に こわすぎる〜！", "ケンジ｜タカシ、おそいからって 泣いたり しないでよ〜 あはは！", "係員｜ニャンダットは 『見た目は ひゅんひゅん、中身は のんびり』が 人気なんですよ。"]),
    ],
    talks:[["ニャンダットの スタッフ", ["ニャンダットの スタッフ｜ニャーン！ きょうも のんびり 運転中ニャ。", "ニャンダットの スタッフ｜ゆっくり だから、まわりの けしきも よく 見えるニャ。"]]],
    fin:["語り手｜ニャンダットは 速いと 思ったら のろのろ。 タカシは まさかの 『遅さ』で ぐったり だったね。", "語り手｜つぎは 『ネットウWAN』。 待ち時間ゼロの わけは…？"],
    learn:"ウワサや 見た目だけで 決めつけない。 じっさいに 体験して たしかめよう。"});

LDX("kn", 2, {title:"ぐつぐつ ネットウWAN", sub:"待ち時間ゼロの ひみつ", lv:30, theme:"park", bgm:"field",
    intro:["語り手｜つぎは 『ネットウWAN』。 水しぶきが 人気の ボートの アトラクション。", "語り手｜ふだんは 1時間待ちなのに、きょうは なぜか 待ち時間ゼロ…？"],
    steps:[
        LQ("ケンジ", "どうして ガラガラ？", ["ケンジ｜いつもは 1時間待ちなのに、おかしいよね。", "タカシ｜今日は 運が いい日なんだよ！", "ケンジ｜なんか 理由が ありそうな 気がする…。"],
            [["まわりに だれも いない ときは、どうするのが 安心かな？", "看板や スタッフの 説明を 見て 理由を たしかめる", ["とにかく 先に 乗ったもの 勝ち", "気にせず 走って 入る"], "ケンジ｜まずは 看板を 見てみよう。 『びしょ濡れバージョン』って かいてあるよ。", "タカシ｜お、ほんとだ。 ちゃんと 読めば わかったね。"]]),
        LP("タカシ", "ボートで ぷかぷか", ["（ボートは ゆっくり 進む…。 そして クライマックス！）", "タカシ｜あつっ！ なんだこれ！ あつあつの おふろじゃないか！", "ケンジ｜あはは！ 『お湯』だから 『ネットウWAN』なんだね！", "タカシ｜猛暑日なのに、さらに あつく 感じる〜…。"]),
        LP("係員", "ぽかぽか タオル", ["係員｜おつかれさま！ あつあつ バージョンの 日は、このタオルで ふいてね。", "係員｜お水も しっかり 飲んで、体を 休めてください。", "ケンジ｜はーい！ ありがとうございます！"]),
    ],
    talks:[["ボートの 子ども", ["ボートの 子ども｜ぼく、おゆの ボートも だいすき〜！", "ボートの 子ども｜ぽかぽか して きもちいいよ！"]]],
    fin:["語り手｜ガラガラには 理由が あったね。 まわりを よく 見るのが 大事だよ。", "語り手｜ケンジは 『新アトラクション』の うわさを 聞きつけた！"],
    learn:"いつもと ちがう ときは 理由が ある。 看板や 説明を よく 見よう。"});

LDX("kn", 3, {title:"ようこそ タマゴドン", sub:"きょうりゅうの たまごに なかよし！", lv:32, theme:"park", bgm:"cave",
    intro:["語り手｜新アトラクション 『恐竜の卵！ タマゴドン！』。", "語り手｜たまご型の ライドに 乗って、赤ちゃん きょうりゅうと ふれあえるよ。"],
    steps:[
        LP("タカシ", "たまごの 中は？", ["タカシ｜うわー、たまごの 中って、出てくる きょうりゅうに かじられるんじゃ…？", "ケンジ｜だいじょうぶだって！ ぼくたちが お友だちに なってあげるんだよ！"]),
        LB("タマゴドン", "なかよし バトル", ["（たまごが ぱかっ！ と 割れて、まんまるの 赤ちゃん きょうりゅう 『タマゴドン』が 出てきた！）", "タマゴドン｜ぎゃおーん！ （あそぼう！ あそぼう！）", "ケンジ｜タマゴドン、ぼくたちと 『なかよく』しようぜ！"],
            ldFoe("kn3_baby", "タマゴドン", "🥚", "kn3_boss", 32, [["ころころ タックル", 0, 1, 1.1], ["ぷにぷに しっぽ", 0, 0.8, 1.0], ["ぴかぴか たまご光", 1, 0.5, 0.7]], "タマゴドン「ぎゃおぉ〜ん！ もっと あそぼ〜！」", 1),
            ["タマゴドン｜ぎゃお！ （たのしかった〜！）", "（タマゴドンは にこにこ しながら、ふたりの 手に 小さな スタンプを ぽんっと おした。）"]),
        LP("係員", "ふれあい タイム", ["係員｜タマゴドンは 人の 笑顔が だいすきなんです。", "ケンジ｜こわがらずに 近づいたら、やさしい 子だったね。", "タカシ｜ふぅ、平和に 乗り終わった〜。 …ハプニング 続出の 1日だったな！"]),
    ],
    talks:[["タマゴドンの ファン", ["タマゴドンの ファン｜スタンプ、あつめてるの！ ほら、キラキラ だよ。", "タマゴドンの ファン｜こわがらないで 近づくと、なかよく なれるよ。"]]],
    fin:["語り手｜こわそうに 見えても、近づいてみたら やさしかった。 ふたりは 1日目を おえたよ。", "語り手｜つづいては お昼。 売店の ちかくで 大きな かげが…！"],
    learn:"こわそうな ものも、近づいて 知ると やさしいことが ある。 まず 相手を 知ろう。"});

LDX("kn", 4, {title:"ゴリラさんと ポテト", sub:"のみ・食べ禁止の ひみつ", lv:34, theme:"town", bgm:"town",
    intro:["語り手｜2日目の お昼ごろ。 売店の ちかくは おいしい においで いっぱい。", "語り手｜ふたりは ポテトを 買ったよ。 でも ちょっと まって、まわりの 看板を 見てみよう。"],
    steps:[
        LP("ケンジ", "わぁ！ でっかい ゴリラ！", ["ケンジ｜わぁ！？", "タカシ｜わぁ！？ なんだよ びっくりしたなぁ。", "ケンジ｜あそこに でっかい ゴリラが いる〜！", "タカシ｜てっきり ニャンダットを 見たかと 思ったよ〜。", "（そこに いたのは、ゴリラの きぐるみを 着た キャスト さんだった。）"]),
        LQ("タカシ", "ごーかーと と ポテト", ["（ふたりは ゴーカートに のりこんだ。 売店で 買った ポテトを 食べながら…。）", "タカシ｜うわー！ このゴーカート めっちゃ 速い！", "ケンジ｜だよね！ しかも このポテト 最高に おいしい！", "（すぐそばに 『飲食 禁止』の 看板が あるのに、ふたりは 気づいていない…。）"],
            [["ふたりは 何を まちがえたかな？", "看板を 見ないで、ルールを やぶってしまった", ["ゴーカートに 乗ったこと", "ポテトを 買ったこと"], "ケンジ｜あっ！ 『飲食 禁止』って 書いてある…！", "ケンジ｜そっか。 看板を ちゃんと 見ないと、ルールを 知らないまま 守れないんだね。"]]),
        LP("売店の おばさん", "ポテトの おいしさ", ["売店の おばさん｜ポテトは あっちの ベンチで 食べると おいしいよ。", "売店の おばさん｜ゴーカートの 中は 飲み物も 食べ物も おやすみ 中なの。", "売店の おばさん｜みんなが 気持ちよく 遊ぶための ルールだからね。"]),
    ],
    talks:[["ベンチの 子", ["ベンチの 子｜ポテト、おいしいね！ ここで 食べるのが 正解だよ。", "ベンチの 子｜ゴリラさん、おこると 追いかけてくるって ウワサだよ…？"]]],
    fin:["語り手｜ルールを 見落とすと、予想外の 出来事に つながっちゃう。", "語り手｜その とき、背中で 『ガオー！』と 大きな 声が…！"],
    learn:"看板や ルールは 先に 確認。 みんなで 気持ちよく 遊ぶための 約束ごと。"});

LDX("kn", 5, {title:"ブレーキが きかない！", sub:"ふたりの 協力プレー", lv:36, theme:"stage", bgm:"castle",
    intro:["語り手｜『ガオー！』と、ゴリラの キャストが 追いかけてきた！", "語り手｜これは アトラクションの 演出。 ほんとうに 危なくは ないよ。 ゲームの 模擬戦として 楽しもう！"],
    steps:[
        LP("タカシ", "ブレーキ ぷしゅー", ["タカシ｜うわっ！ ブレーキが きかない！", "ケンジ｜止まんないよ、これ〜！", "タカシ｜このままじゃ 壁に ぶつかっちゃう…！"]),
        LQ("ケンジ", "ふたりで 力を あわせろ", ["ケンジ｜落ち着いて！ 降り場まで あと すこしだよ！", "ケンジ｜アクセルを ふまずに、ゆっくり 自然に 止めよう！"],
            [["あわてた ときに いちばん いい 行動は？", "声を かけあって、役わりを わける", ["ひとりで ぜんぶ やろうとする", "大声で さけぶだけ"], "ケンジ｜タカシ、ハンドルを おさえて！ ぼくは 体重を うしろにかける！", "タカシ｜よし！ せーのっ！"]]),
        LB("ゴリラキャスト", "ゴリラキャストと 勝負", ["（ゴーカートが 白い ラインの すぐ手前で ぴたっと 止まった！）", "ゴリラキャスト｜ふっふっふ… 見事だったぞ、諸君。 だが これは 飲食禁止の 警告だ！", "ゴリラキャスト｜ルールを 守れるか、最後に 力くらべだ！"],
            ldFoe("kn5_gorilla", "ゴリラキャスト", "🦍", "kn4_boss", 36, [["ドラミング ぽこぽこ", 0, 1, 1.2], ["バナナ なげ", 0, 0.8, 1.0], ["どっしり ジャンプ", 0, 0.5, 1.5]], "ゴリラキャスト「ふふ… ルールは 守って こそ 楽しいのだ！」", 1.1),
            ["ゴリラキャスト｜見事だ！ ルールの 大切さを 学んだな。", "（ゴリラキャストは 親指を ぐっと 立てて、軽やかに 去っていった。）", "タカシ｜すみませんでした…！", "ケンジ｜看板、ちゃんと 見とけば よかったです…。"]),
    ],
    talks:[["ゴーカートの 係員", ["ゴーカートの 係員｜ブレーキが きかない ときは、あわてず ハンドルを しっかり。", "ゴーカートの 係員｜一人で がんばらず、ふたりで 協力すると 乗りこえられるよ。"]]],
    fin:["語り手｜ふたりは 力を あわせて ピンチを 乗りこえた！", "語り手｜つぎは 『お化け屋敷』。 ここでも ハプニングが 待っているよ。"],
    learn:"ピンチの ときは あわてず 役わりを 分けて 協力。 ルールは 守ろう。"});

LDX("kn", 6, {title:"ふわふわ おばけやしき", sub:"こわがりは どっち？", lv:38, theme:"night", bgm:"cave",
    intro:["語り手｜つぎは 『お化け屋敷』。 暗くて ふしぎな おんがくが ながれる、ウォークスルー型。", "語り手｜でも 出てくる おばけは みんな かわいい ぬいぐるみ風。 こわがりな タカシは ドキドキ…！"],
    steps:[
        LP("ケンジ", "入口で ドキドキ", ["ケンジ｜ついに 来たね！ コイヌネランドの お化け屋敷！", "タカシ｜マジかよ…。 ぼくは ジェットコースターより お化けの 方が にがてなんだけど。", "ケンジ｜だいじょうぶでしょ（笑） ぼくの 方が ビビりだし！"]),
        LP("タカシ", "くらやみの 中で", ["（暗い 道を 進むと、足元に 何かが ぽよんと 当たった。）", "タカシ｜うわっ！ きゃー うひょー やめてくれー！！", "ケンジ｜いやっ！ やめて！ こわいよー！", "タカシ｜お化けなんて こわくねぇからな！ 今のは 練習さ！"]),
        LB("ゆらりさん", "ふわふわ おばけ ゆらりさん", ["（そのとき、うしろから 気配が…。 タカシが ふり返った！）", "ゆらりさん｜ふわあああ〜！（おどろかせ 大成功〜！）", "タカシ｜うわぁーー！！ （おどろいた 勢いで、思わず ゆらりさんを ぽーん！ と とばしてしまった！）"],
            ldFoe("kn6_ghost", "ゆらりさん", "👻", "kn6_boss", 38, [["ふわふわ ゆらり", 0, 1, 1.1], ["ぷるぷる おどろき", 1, 0.6, 0.8], ["ひゅるる スピン", 0, 0.7, 1.3]], "ゆらりさん「ふわっ！ きみ、おもしろいね〜！」", 1),
            ["（ビービービー！ 緊急ボタンが 押されて、あかりが ぱっと ついた！）", "アナウンス｜お客様に ご案内します。 ただいま、明かりを つけます。", "タカシ｜ま、まさか ぼくの せい…？"]),
        LP("係員", "ごめんなさい", ["係員｜あなたたちが ゆらりさんを とばしましたか？", "タカシ｜あ、はい…。", "係員｜ゆらりさんは こわれやすいので、今回は 大目に 見ます。 今後は 気をつけてください。", "ケンジ｜すみません。 ぼくが 無理やり 入らせてしまいました…。", "係員｜だいじょうぶですよ。 お化けは こわいですもんね！ ところで…", "係員｜いま、謎解きイベントを やっているので、ぜひ 参加してみてください！"]),
    ],
    talks:[["おばけ屋敷の 子", ["おばけ屋敷の 子｜ゆらりさん、ほんとは すごく やさしいんだよ。", "おばけ屋敷の 子｜つぎは 『なぞとき』だって！ いっしょに やろうよ！"]]],
    fin:["語り手｜暗くて こわくても、笑える 出来事に なったね。 ゆらりさんも おこって いなかったよ。", "語り手｜さあ、つぎは 『謎解きイベント』！ その前に アイスを 食べたい ケンジだけど…？"],
    learn:"こわい ときも、あわてず 落ち着いて。 失敗したら 正直に あやまろう。"});

LDX("kn", 7, {title:"すぐ冷えるアイス", sub:"お腹と 水分の ひみつ", lv:40, theme:"park", bgm:"town",
    intro:["語り手｜猛暑日の コイヌネランド。 アイスが おいしい 季節だね。", "語り手｜売店では 『すぐ冷えるアイス』が 大人気。 でも、タカシは ちょっと 気が すすまない ようすで…。"],
    steps:[
        LP("ケンジ", "アイスを 買おう", ["ケンジ｜その前に、あついから アイス 食べよ！", "タカシ｜うーん、まぁ いいけど…。", "（このとき、タカシは ちょっと いやな 予感が した。）", "ケンジ｜ここの 売店が おすすめ！ 『すぐ冷えるアイス』だよ！ おごるから いっしょに 食べよ！"]),
        LP("タカシ", "あっという間に ぺろり", ["タカシ｜おぉ〜 おいしい〜！", "（タカシは 数秒で 食べ終わっていた。）", "ケンジ｜え？ もう 食べたの！？ 食べるの 速っ（笑）", "タカシ｜ふぅ〜 おいしかった〜。"]),
        LQ("売店の おじさん", "冷たい ものの 食べ方", ["売店の おじさん｜暑い 日は 冷たいものが おいしいけど、一気に 食べると お腹が びっくりしちゃうよ。", "売店の おじさん｜お水も こまめに 飲んでね。"],
            [["暑い 日に 冷たい ものを 食べるときは？", "ゆっくり 食べて、お水も こまめに 飲む", ["いっきに 食べるほど おいしい", "お水は 飲まなくて いい"], "売店の おじさん｜お腹は 冷えると びっくりするんだ。 ゆっくり 食べようね。", "売店の おじさん｜そのとおり！ こまめに 水分を とって、休むことも 大事だよ。"]]),
        LP("ケンジ", "景品は ARE！", ["（ふたりは 謎解きイベントの 景品を 見に 行った。）", "ケンジ｜景品は なんと 『ARE』（AI搭載の ゲーム機）だって！", "タカシ｜うぉー！ ゲーム好きには たまらねぇ！", "ケンジ｜タカシなら ぜったい ゲットできるよ！"]),
    ],
    talks:[["アイスの 店員", ["アイスの 店員｜すぐ冷えるアイスは、食べた あとに ぽかぽか 飲み物で あたためると いいよ。", "アイスの 店員｜お腹が ごろごろ したら、むりしないで 休んでね。"]]],
    fin:["語り手｜暑い 日でも、冷たい ものの 食べすぎには ちゅうい。", "語り手｜ケンジは トイレへ。 タカシは…お腹が ちょっと 気に なってきたみたい。"],
    learn:"暑い 日は 水分補給と 休けいが 大事。 冷たい ものは ゆっくり 食べよう。"});

LDX("kn", 8, {title:"なぞとき イベント はじまる", sub:"ヒントは 思い出の 中に", lv:42, theme:"stage", bgm:"castle",
    intro:["語り手｜謎解きイベントの 受付に 来た ふたり。 キットを もらったら、なぞが 書かれていたよ。", "語り手｜タカシは 『あ〜 わかったわ！』と 言ったあと、お腹が 痛くなって リタイア！？"],
    steps:[
        LP("係員", "受付で キットを もらう", ["係員｜謎解きキットです。 ぜんぶ 解けたら 答えを 教えてくださいね。", "ケンジ｜はい！ ありがとうございます！", "（キットには こんな なぞが 書かれていた。 『このパークの アトラクションの 名前を 思い出して。 どうぶつは なにかな？』）"]),
        LP("タカシ", "タカシの リタイア", ["タカシ｜あ〜 わかったわ！", "ケンジ｜え？ どういうこと？？", "タカシ｜待って、お腹が…。 リタイアするから あとは よろしく…！", "ケンジ｜えぇ、ひとりじゃ こんなの 解けないよ〜！", "タカシ｜健闘を祈る！ AREの ために ね！"]),
        LQ("ケンジ", "ヒント① ニャンダット", ["ケンジ｜ひとりで やるしか ない。 タカシが 前に 言った 言葉を 思い出そう…。", "タカシ｜『ニャンダットって めっちゃ スピード 早いんだよね』", "ケンジ｜『そうそう ニャンダットって ネコみたいだよね』", "タカシ｜『どう考えても ニャンって 書いてあるから ネコだろ』"],
            [["『ニャンダット』は どの どうぶつの 名前に ちなんでいるかな？", "ネコ", ["イヌ", "ウサギ"], "ケンジ｜『ニャン』と 鳴くのは…？ もういちど 考えてみよう。", "ケンジ｜そう！ ニャンダット ＝ ネコ。 ヒント① 完了！"]]),
    ],
    talks:[["なぞとき 仲間", ["なぞとき 仲間｜わたしも ヒント、探してるの。 いっしょに 考えよう！", "なぞとき 仲間｜あわてず、ひとつずつ 思い出すのが コツだよ。"]]],
    fin:["語り手｜ヒント①は 『ネコ』。 ケンジは まだ ひとりで がんばって いるよ。", "語り手｜つぎは 『ネットウWAN』と 『ゴリラ』の ヒント。"],
    learn:"なぞは ひとつずつ 整理。 友だちの ことばが ヒントに なる ことも あるよ。"});

LDX("kn", 9, {title:"ケンジの ちょうせん", sub:"考えすぎないで 行動！", lv:44, theme:"stage", bgm:"castle",
    intro:["語り手｜ケンジは ひとりで なぞを 解き進める。", "語り手｜タカシの 『ある アドバイス』を 思い出して…！"],
    steps:[
        LQ("ケンジ", "ヒント② ネットウWAN", ["ケンジ｜『ネットウWAN』は どの どうぶつだろう…？", "タカシ｜『さっきの 考えで いうと、そういうことだな！』"],
            [["『ネットウ ＷＡＮ』の 『ＷＡＮ』は どの どうぶつの 鳴き声かな？", "イヌ", ["ネコ", "ゾウ"], "ケンジ｜『ワンワン』って 鳴くのは…？ もう一度 考えてみよう。", "ケンジ｜そう！ ワン ＝ イヌ。 ヒント② 完了！"]]),
        LP("タカシ", "タカシの アドバイス", ["（ケンジは、タカシの 言葉を 思い出した。）", "タカシ｜『すぐに あきらめるのではない！ 考えすぎずに 行動するんだよ！』", "ケンジ｜『…そんな こわい こと 言わないでよ』", "タカシ｜『こわい ことを 言うと ビビるだけで、慌てて 大混乱になる。 水分補給は しっかり ね』"]),
        LQ("ゴリラキャスト", "ヒント③ ゴリラの ひとこと", ["ゴリラキャスト｜やあ、ケンジくん。 ひとりで ちょうせん 中かい？", "ゴリラキャスト｜ヒントは ふたつ。 『ネコ』と 『イヌ』だ。 ならべかえるのが コツだぞ。"],
            [["次の ことばを 考えよう。 ネコ と イヌ、2つの どうぶつの 文字を ばらして ならべると、どうなるかな？", "ネ・コ・イ・ヌ の 4もじに なる", ["ネ・コ・ウ・サ の 4もじに なる", "ゴ・リ・ラ の 3もじに なる"], "ケンジ｜ネコは 『ネ・コ』、イヌは 『イ・ヌ』…。 もう一度 文字を 数えてみよう。", "ケンジ｜そう！ 『ネ・コ・イ・ヌ』。 これを ならべかえるんだ。"]]),
        LP("タカシ", "ひとやすみ", ["タカシ｜（遠くから）ケンジ〜 がんばれ〜！", "ケンジ｜タカシ、おなかは だいじょうぶかな。 …考えすぎは 悪いクセ。 いまは なぞに 集中！"]),
    ],
    talks:[["売店の 子", ["売店の 子｜ケンジくん、がんばって！", "売店の 子｜水分補給も わすれずにね！"]]],
    fin:["語り手｜ヒントは そろったよ。 『ネ・コ・イ・ヌ』の 4もじ。", "語り手｜さいごの 答えは、このパークの 名前に ひみつが あるみたい…！"],
    learn:"悩みすぎず、行動に うつす。 ひとつずつ ヒントを つなげよう。"});

LDX("kn", 10, {title:"こたえは コイヌネランド！", sub:"さいごの なぞ", lv:46, theme:"stage", bgm:"castle",
    intro:["語り手｜いよいよ 最後の なぞ。 ケンジは 『ネ・コ・イ・ヌ』を ならべかえて、パークの 名前を 作る。", "語り手｜答えは ○○○○○○○（7もじ）。 ヒントは 『ランド』の 前に 4もじ！"],
    steps:[
        LQ("ケンジ", "さいごの なぞ", ["ケンジ｜『ネ・コ・イ・ヌ』を ならべかえて、『ランド』の 前に つけると…。", "ケンジ｜ヒントの カードには 『1もじめは コ』と 書いてあったよ。"],
            [["『ネ・コ・イ・ヌ』を ならべかえて、『ランド』を つけると、どんな 名前に なるかな？（1もじめは 『コ』）", "コイヌネランド", ["ネコイヌランド", "イヌネコランド"], "ケンジ｜1もじめは 『コ』だったよね。 もう一度 ならべかえてみよう。", "ケンジ｜『コ・イ・ヌ・ネ』＋『ランド』 ＝ 『コイヌネランド』！ わかった！"]]),
        LP("係員", "答え合わせ", ["ケンジ｜答えは 『コイヌネランド』ですね！", "係員｜正解です！ 残り1台の AREを さしあげますね！", "ケンジ｜ありがとうございます！", "タカシ｜ありがとう、ケンジ！ やるじゃん！", "ケンジ｜こちらこそ。 タカシの 言いたいことが わかったよ！"]),
        LB("なぞなぞ番人", "ごほうびバトル", ["（ふたりが 笑いあっていると、キラキラ ひかる 『なぞなぞ番人』が あらわれた！）", "なぞなぞ番人｜よくぞ 解いた！ 最後に 力くらべで ごほうびを あげよう！"],
            ldFoe("kn10_boss", "なぞなぞ番人", "❓", "kn10_boss", 46, [["クエスチョン ビーム", 1, 0.6, 0.9], ["ぐるぐる ひらめき", 0, 1, 1.3], ["ぴこぴこ ハンマー", 0, 0.8, 1.6]], "なぞなぞ番人「ほほう！ 見事な ちえと 勇気だ！」", 1.15),
            ["なぞなぞ番人｜みごとだ！ きみたちの 友情も ちえも 本物だ。", "（ふたりは ハイタッチ！ 平和な 1日が おわった…はずが）"]),
        LP("タカシ", "あつい 夜", ["タカシ｜熱帯夜で 寝不足の 日が つづいて、ねむい ねむい…。", "ケンジ｜ふぁ〜…。 ぼくも〜。", "語り手｜こうして 『眠井眠杉』の ふたりは ぐっすり ねむったとさ。"]),
    ],
    talks:[["ゲートの 子", ["ゲートの 子｜コイヌネランド、また 来てね！", "ゲートの 子｜つぎは 『ワンコロランド』と 『ウサウサランド』が ひらくらしいよ！"]]],
    fin:["語り手｜コイヌネランド かんけつ！ ケンジの 成長と 友情が すてきな 1日だったね。", "語り手｜ここで 終わらずに… 新しい ランドの 入口が ひらく！"],
    learn:"友だちの ヒントを いかして、じぶんの 力で やりとげよう。"});

RPG_EV.kn_final = YKL([
    "語り手｜コイヌネランドの 10話は ぜんぶ おしまい。", "語り手｜ふたりの 笑顔に つられて、新しい ゲートが ひらいたよ。",
    "語り手｜『ワンコロランド』と 『ウサウサランド』。 どちらも 行かなくても 本編は つづけられる。 でも、つよく なりたい 人は ちょうせん してみよう！"
]).concat([["gold", 20000], ["item", "special", 5], ["item", "omamori", 2], rpgN("20,000G と スペシャルおにぎり 5こ・ふっかつのおまもり 2こを てにいれた！"), ["set", "e_kn_all"], rpgN("★ ワンコロランドと ウサウサランドが ひらいた！（ゲートの 行き先に でるよ）"), ["run", "lab_ret_go"]]);


/* ==== game/wn.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[47]=1;
"use strict";
// ===== ワンコロランド（サブストーリー・任意・全10話）=====
//   リヒト・サトル・アカネ・マイカの 4人が 犬の テーマパークを 全制覇！ （おすすめ Lv は コイヌネより +15）
LDX("wn", 1, {title:"ぜんせいは 作戦会議", sub:"4人の 全制覇ミッション", lv:43, theme:"town", bgm:"town",
    intro:["語り手｜ここは 犬の テーマパーク 『ワンコロランド』。 アトラクションは なんと 20こ！", "語り手｜リヒト・サトル・アカネ・マイカの 4人が、あした 全部 まわる 『全制覇』に ちょうせん するよ。"],
    steps:[
        LP("リヒト", "リヒトの へやで", ["リヒト｜よし、みんな そろったな。 あしたは ついに ワンコロランド 全制覇の 日だ。", "サトル｜マジで 全部 まわれるのかな。 アトラクション 20こって けっこう 多いよね。", "アカネ｜だいじょうぶ！ わたしが 完ぺきな 計画を 立てたから！"]),
        LP("アカネ", "分刻みの スケジュール", ["（アカネが ノートパソコンを 見せると、画面には 分きざみの スケジュールが 表示されていた。）", "マイカ｜すごい アカネちゃん、本気だね！", "アカネ｜当たり前じゃん！ 3か月前から チケットを 予約したんだよ！", "リヒト｜結局、ぼくが 奇跡的に 4まい 取れたんだよな。 運が よかっただけだよ。"]),
        LQ("サトル", "人気アトラクション", ["アカネ｜人気は 『コイヌコースター』『スカイドッグ』『ワンワンワールド』『ドッグハウス・ドキドキ』『フライング・パピー』『コイヌの大冒険』の 6つ。", "リヒト｜この 6つは 平均 120分待ちか。", "サトル｜2時間待ちは さすがに キツイな。"],
            [["待ち時間が 長い 人気アトラクションを 回りたい とき、いい 方法は？", "ファストパスや 開園すぐの 時間を 上手に つかう", ["とにかく 並ぶ 人の 数を 数える", "ぜんぶ あきらめる"], "アカネ｜2500円で 5分待ちになる 『ファストパス』が あるよ！", "アカネ｜そう！ 作戦は 『早起き』と 『ファストパス』だよ！"]]),
        LP("マイカ", "決まり！", ["マイカ｜じゃあ ファストパス 買おう！", "リヒト｜4人で 1万円か。 でも 全制覇のためなら しかたないな。", "アカネ｜決まり！ あしたは 7時に 現地集合ね。", "サトル｜早っ！"]),
    ],
    talks:[["パンフレットの 犬", ["パンフレットの 犬｜ワン！ あしたは 20このアトラクションを 全制覇だワン！", "パンフレットの 犬｜計画は 大事。 でも 楽しむ 心も わすれずに！"]]],
    fin:["語り手｜計画は ばっちり！ 作戦会議は おしまい。", "語り手｜つぎは 当日の 朝。 開園前の 行列で…。"],
    learn:"目標が 大きい ときは、みんなで 役わりと 時間を 計画しよう。"});

LDX("wn", 2, {title:"ファストパス争奪戦", sub:"開園ダッシュ！", lv:45, theme:"park", bgm:"field",
    intro:["語り手｜朝6時45分、ワンコロランドの 正門前。 すでに 長い 行列ができている。", "語り手｜寒いけれど、4人は わくわくしていたよ。"],
    steps:[
        LP("サトル", "開園前の 行列", ["サトル｜うわ、めっちゃ 人いる。", "マイカ｜みんな 早起きだね。", "リヒト｜にしても 寒いな。", "サトル｜ぼく、カイロ 持ってきたよ。", "マイカ｜サトルくん、やさしい！ ありがとう！"]),
        LP("スタッフ", "いよいよ 開園", ["スタッフ｜みなさん、お待たせしました！ まもなく 開園いたします！", "（8時ちょうど、正門が 開いた！ 4人は 走って ファストパスの カウンターへ！）", "リヒト｜走れ！ まずは ファストパスだ！"]),
        LQ("アカネ", "ファストパス窓口", ["スタッフ｜ファストパスは 1人 3つまでと なっております。", "アカネ｜えっ、6つ 全部は 買えないの？", "リヒト｜じゃあ、どうする？"],
            [["ルールで 『3つまで』と 言われたとき、どうするのが いいかな？", "ルールを 守って、いちばん 人気の 3つを えらぶ", ["ルールを 無視して 6つ ぜんぶ たのむ", "スタッフに おこって 文句を 言う"], "サトル｜ルールは ルールだよ。 3つまでで えらぼう。", "マイカ｜そうだね。 ルールを 守って、人気の 3つにしよう！"]]),
        LP("スタッフ", "ファストパス ゲット", ["アカネ｜『コイヌコースター』『スカイドッグ』『ワンワンワールド』でお願いします！", "スタッフ｜かしこまりました。 使える 時間は 9時・11時・13時です。", "アカネ｜了解です！"]),
    ],
    talks:[["行列の おじさん", ["行列の おじさん｜わたしは 3時間前から 並んでいるよ。 楽しみだねぇ。", "行列の おじさん｜ゴミは ゴミ箱へ。 みんなで 気持ちよく 遊ぼう！"]]],
    fin:["語り手｜ファストパスを ゲット！ ルールを 守る ことで、気持ちよく スタートできたね。", "語り手｜さあ、最初の アトラクション 『パピーメリー』へ！"],
    learn:"ルールは 守る。 限られた 中で いちばん いい 作戦を えらぼう。"});

LDX("wn", 3, {title:"パピーメリーと コースター", sub:"絶叫の ぼうけん", lv:47, theme:"park", bgm:"field",
    intro:["語り手｜時刻は 8時45分。 ファストパスの 時間まで あと 15分。", "語り手｜4人は 待ち時間の 短い 『パピーメリー』へ！"],
    steps:[
        LP("マイカ", "パピーメリー", ["マイカ｜あそこに 『パピーメリー』が あるよ。 待ち時間20分だって！", "（犬の メリーゴーランド。 マイカは ゴールデンレトリバー、アカネは しばいぬ、サトルは ハスキー、リヒトは ダルメシアンを えらんだ。）", "サトル｜これ、なんか シュールだな。", "リヒト｜大の大人が 犬に 乗ってるって、おもしろいだろうな（笑）", "アカネ｜でも 楽しい！"]),
        LQ("サトル", "ぜっきょうは にがて？", ["サトル｜つぎは 最高時速120キロの 『コイヌコースター』だよ。", "マイカ｜わたし、絶叫系は にがてなんだけど…。", "アカネ｜だいじょうぶ！ わたしが 隣に いるから！"],
            [["にがてな 乗り物の ときは、どうすると いいかな？", "友だちに 気持ちを 伝えて、むりせず 決める", ["こわいのを かくして がまんする", "友だちを むりやり さそう"], "リヒト｜にがてなら 言っていいんだよ。", "マイカ｜ありがとう。 そばに いてくれるなら 乗ってみる！"]]),
        LB("コースターくん", "コイヌコースター バトル", ["（4人は ファストパスで すぐ 乗れた。 スタッフ『それでは 出発します。 ワンワン！』）", "（頂上で、コースターは 一気に 急降下！ …そのとき 『コースターくん』が あらわれた！）", "コースターくん｜ビュンビュン！ 最後まで ついてこれるかな！？"],
            ldFoe("wn3_coaster", "コースターくん", "🎢", "wn3_boss", 47, [["ビュンビュン カーブ", 0, 1, 1.2], ["くるくる ループ", 0, 0.8, 1.4], ["ひゅー らせん", 1, 0.5, 0.8]], "コースターくん「ひゃっほー！ もう 1回 いくよ〜！」", 1.1),
            ["サトル｜（ふらふら）み、みんな だいじょうぶ？", "マイカ｜もう 2度と 乗らない…！", "アカネ｜でも 楽しかったね！", "リヒト｜たしかに。 つぎ 行こう。"]),
    ],
    talks:[["メリーの 係員", ["メリーの 係員｜お好きな 犬を えらんでね。 みんな かわいいよ！", "メリーの 係員｜安全バーは しっかり おろしてね。"]]],
    fin:["語り手｜最初の 2つを クリア！ 4人は ちょっと ふらふらだけど、笑顔だね。", "語り手｜つぎは 待ち時間120分の 『ドッグハウス・ドキドキ』。"],
    learn:"にがてな ことは むり せず、友だちに 気持ちを 伝えよう。"});

LDX("wn", 4, {title:"ドッグハウス・ドキドキ", sub:"待ち時間は しりとりで！", lv:49, theme:"night", bgm:"cave",
    intro:["語り手｜つぎの 目的地は 犬の おばけ屋敷 『ドッグハウス・ドキドキ』。", "語り手｜待ち時間は なんと 120分！ ファストパスは つかえないよ。"],
    steps:[
        LP("アカネ", "並ぶしかない！", ["アカネ｜ファストパス 使えないから、並ぶしかないね。", "マイカ｜2時間も 待つの？", "リヒト｜しかたない。 全制覇のためだ。"]),
        LQ("サトル", "しりとりで ひまつぶし", ["サトル｜そういえば 4人で 遊ぶの、久しぶりだよな。", "アカネ｜卒業してから みんな 忙しくなっちゃって。", "リヒト｜じゃあ しりとりでも する？ 『ワンコロランド』の 『ド』から！"],
            [["しりとりで 『ド』から つづく ことばは？（ド→ドーナツ→ツ…）", "ツナ", ["ナス", "ドーナツ"], "サトル｜『ドーナツ』の 最後は 『ツ』だね。 『ツ』から 始まる ことばは…？", "アカネ｜そう！ 『ツナ』。 つぎは 『ナス』、『スイカ』と つづくよ！"]]),
        LB("ポチゴースト", "犬おばけ ポチゴースト", ["（120分後、やっと 順番が まわってきた！ 暗い 建物の 中に 入ると…）", "（アオーン！ と 遠吠えが ひびいた。 目の前に あらわれたのは 目が きらきら ひかる 大きな 犬の ぬいぐるみおばけ 『ポチゴースト』！）", "ポチゴースト｜わふわふ〜！ おどろいた？ …ねえ、あそんで！"],
            ldFoe("wn4_ghost", "ポチゴースト", "🐶", "wn4_boss", 49, [["わふわふ ダッシュ", 0, 1, 1.2], ["ぷるぷる 遠吠え", 1, 0.6, 0.9], ["ふわもふ タックル", 0, 0.7, 1.4]], "ポチゴースト「わふぅ！ また あそぼうね〜！」", 1.1),
            ["マイカ｜…あれ、あんまり こわく ないかも？", "マイカ｜犬のおばけって、かわいい けどスリル満点だったね！", "リヒト｜次、行こう。"]),
        LP("お化け屋敷の 係員", "出口で", ["お化け屋敷の 係員｜おつかれさま！ 疲れたら 休けいスペースで 休んでね。", "お化け屋敷の 係員｜お水も 飲んでね。"]),
    ],
    talks:[["行列の 子", ["行列の 子｜しりとり、ぼくも 入っていい？", "行列の 子｜ん、で おわらないように 気をつけてね！"]]],
    fin:["語り手｜2時間の 待ち時間も、4人の おしゃべりで あっという間。", "語り手｜つぎは お昼ごはん 『レストワン』。"],
    learn:"待つ 時間も、友だちと 話せば 楽しい 思い出に なるよ。"});

LDX("wn", 5, {title:"レストワンの おひるごはん", sub:"見た目は ドッグフード！？", lv:51, theme:"shop", bgm:"town",
    intro:["語り手｜お昼の 12時。 4人は お腹ぺこぺこ。", "語り手｜犬テーマの レストラン 『レストワン』に やってきたよ。"],
    steps:[
        LP("マイカ", "メニューを 見よう", ["アカネ｜そろそろ お腹 空いたね。", "サトル｜俺、めっちゃ 腹 へった。", "マイカ｜メニューには 『骨つき肉』『ドッグフード風 カレー』『肉球パン』が あるよ。"]),
        LQ("サトル", "ドッグフード風カレー", ["サトル｜ドッグフード風カレーって、食べたくないんだけど…。", "アカネ｜でも せっかくだから 食べてみようよ！"],
            [["見た目が 変わっていても、食べて みるには？", "ひとくち 食べて たしかめる", ["見た目で 決めつけて 食べない", "ほかの 人に 全部 おしつける"], "リヒト｜見た目だけで 決めつけるのは、もったいないよ。 ひとくち だけでも どうかな。", "サトル｜あれ？ 意外と おいしい！"]]),
        LP("店員", "ごちそうさま", ["（マイカの 前には 肉球の 形の パン、リヒトの 前には 巨大な 骨つき肉が 運ばれてきた。）", "マイカ｜食べるの もったいない！ かわいい〜！", "リヒト｜これ、1人で 食べきれるかな。", "サトル｜分けてもらおうぜ。 みんなで 楽しく 食べよう！", "店員｜またの おこしを おまちしています！ ワン！"]),
        LP("アカネ", "時計を 見ると", ["アカネ｜ごはんも 食べたし、つぎは 『スカイドッグ』だよ！", "リヒト｜よし、行こう！"]),
    ],
    talks:[["レストワンの シェフ", ["レストワンの シェフ｜見た目は ドッグフード風でも、中身は 本格 カレーだよ！", "レストワンの シェフ｜アレルギーが ある 人は、先に 教えてね。"]]],
    fin:["語り手｜見た目に まどわされず、ひとくち 食べてみると おいしかったね。", "語り手｜午後は 空の 旅 『スカイドッグ』と 水びたしの 『スプラッシュワンダー』。"],
    learn:"見た目だけで 決めつけず 試してみよう。 食べ物の アレルギーは 先に 伝えよう。"});

LDX("wn", 6, {title:"スカイドッグと スプラッシュ", sub:"空へ、そして 水びたし！", lv:53, theme:"lake", bgm:"sea",
    intro:["語り手｜午後1時。 犬型ゴンドラで 空を 飛ぶ 『スカイドッグ』と、急流下りの 『スプラッシュワンダー』。", "語り手｜景色も 水しぶきも、たっぷり 楽しもう！"],
    steps:[
        LP("サトル", "スカイドッグ", ["サトル｜これは 楽しそうだな。", "マイカ｜景色が きれいそう！", "（犬型ゴンドラは ゆっくり 上昇。 下には ワンコロランドの 全景が 広がっていた。）", "アカネ｜わー！ 高い！ 景色 最高！", "リヒト｜これは いいな。 写真 撮ろう！"]),
        LQ("リヒト", "カッパを 買おう", ["アカネ｜スプラッシュワンダーは 濡れる アトラクションだよ。 でも カッパ 売ってるから だいじょうぶ！", "サトル｜カッパ、買っておこうか。"],
            [["水に ぬれる アトラクションの 前に 準備する ものは？", "かっぱと 着替えと タオル", ["とくに いらない", "スマホを ポケットに 入れたまま"], "リヒト｜ぬれるのは 分かってるから、着替えも 用意しよう。", "リヒト｜そう！ 着替えを 持ってきて よかったな！"]]),
        LB("スプラッシュワン", "水しぶきバトル", ["（ボートで 急流を くだる 4人。 最後の 大滝で、大きな 水しぶきの 精霊 『スプラッシュワン』が 登場！）", "スプラッシュワン｜ざっぱーん！ びしょぬれに しちゃうよ〜！"],
            ldFoe("wn6_splash", "スプラッシュワン", "💧", "wn6_boss", 53, [["ざぶざぶ ウェーブ", 0, 1, 1.2], ["しゃわしゃわ ミスト", 1, 0.7, 0.8], ["どぼーん ダイブ", 0, 0.6, 1.6]], "スプラッシュワン「ざっぱ〜ん！ たのしかったね〜！」", 1.1),
            ["アカネ｜ぬれたああ！", "マイカ｜カッパ 意味ないい！", "リヒト｜着替え 持ってきて よかったな。", "（4人は 更衣室で 着替えて、あったかい タオルで ぽかぽか。）"]),
    ],
    talks:[["更衣室の おばさん", ["更衣室の おばさん｜ぬれた 服は ここの ふくろに 入れてね。", "更衣室の おばさん｜体が 冷えたら カゼを ひくから、あったかい 飲み物も どうぞ。"]]],
    fin:["語り手｜準備していたから、びしょぬれでも へっちゃら！", "語り手｜でも 時計を 見ると…。"],
    learn:"出かける 前の 準備は 大切。 着替えや タオルを 持っていこう。"});

LDX("wn", 7, {title:"スケジュールが おくれてる！", sub:"作戦を かえよう", lv:55, theme:"town", bgm:"town",
    intro:["語り手｜時刻は 15時。 アカネが 時計を 見て 青ざめた。", "語り手｜スケジュールより 1時間も おくれているみたい！"],
    steps:[
        LP("アカネ", "ピンチ！？", ["アカネ｜やばい、スケジュールより 1時間 おくれてる。", "サトル｜マジ？", "アカネ｜残りは あと 10こ。 このままだと 全制覇できないかも。", "マイカ｜でも あきらめたくない！"]),
        LQ("リヒト", "作戦変更", ["リヒト｜落ち着こう。 まだ 残り 5時間 ある。", "リヒト｜作戦を 変えるぞ。"],
            [["時間が 足りない ときの いい 作戦は？", "待ち時間が 短い ものから 先に まわる", ["待ち時間が いちばん 長い ものから 並ぶ", "ぜんぶ やめて 帰る"], "アカネ｜待ち時間が 長いものを あとに すると、全体の 時間が へるかも！", "リヒト｜そう！ 待ち時間が 短い ものを 優先する。 食事も 手早く すませよう。"]]),
        LP("サトル", "連続アトラクション", ["（『パピーティーカップ』30分、『ドッグトレイン』40分、『バウバウシアター』20分、『わんこの森』50分、『ドッグレース』60分…。）", "サトル｜酔いそう〜。 …でも ドッグレース、1位 取った！", "マイカ｜ドッグトレインは 癒されたね。", "アカネ｜かわいかった！"]),
        LP("リヒト", "時刻は 18時", ["リヒト｜時刻は 18時。 残りは あと 5つだ。", "アカネ｜あと 5つ！ がんばろう！"]),
    ],
    talks:[["案内スタッフ", ["案内スタッフ｜あせらず、安全第一でね。 走ると 危ないよ。", "案内スタッフ｜待ち時間は アプリで 見られるよ。"]]],
    fin:["語り手｜予定が おくれても、作戦を かえて ちゃんと 追いついた！", "語り手｜夕食の 時間。 みんな ちょっと つかれ気味…。"],
    learn:"思い通りに いかない ときは、あきらめずに 作戦を 立て直そう。"});

LDX("wn", 8, {title:"ワンコーヒーで ひと休み", sub:"最後の 追い込み", lv:57, theme:"shop", bgm:"town",
    intro:["語り手｜夕方。 4人は つかれて 足が 痛くなってきた。", "語り手｜『ワンコーヒー』で ひと休みしてから、最後の 追い込みだよ。"],
    steps:[
        LP("マイカ", "ちょっと 休けい", ["マイカ｜ちょっと 休憩したい。", "サトル｜俺も、足が 痛い。", "リヒト｜じゃあ、夕食を 食べながら 休もう。"]),
        LQ("店員", "犬型ハンバーガー", ["（メニューには 『ホットドッグ』『犬型 ハンバーガー』『肉球アイス』などが ならんでいる。）", "サトル｜ホットドッグって、犬なのに 食べていいのか？", "アカネ｜気にしない 気にしない（笑）"],
            [["休けいを とる いちばんの 理由は？", "体力を 回復して、そのあと もっと がんばるため", ["時間を ムダに するため", "ほかの 人に 見せるため"], "リヒト｜休むのも 作戦のうちだよ。 つかれたまま 走ると 危ないからね。", "リヒト｜そのとおり！ 休むのも 大事な 作戦だ。"]]),
        LP("アカネ", "19時 最後の 追い込み", ["アカネ｜閉園は 21時。 残り 2時間で 5つ 回らなきゃ。", "リヒト｜よし、走ろう！ （あぶなくないように ゆっくり！）", "サトル｜おう！"]),
        LB("フライングパピー", "フライング・パピー", ["（『フライング・パピー』は 犬型の のりものに 乗って 空を とぶ アトラクション。）", "フライングパピー｜ひゅー！ ぼくと 競走しよう！"],
            ldFoe("wn8_puppy", "フライングパピー", "🪂", "wn8_boss", 57, [["ふわふわ ダイブ", 0, 1, 1.2], ["きらきら 風", 1, 0.7, 0.9], ["ぐるぐる ターン", 0, 0.7, 1.5]], "フライングパピー「ひゅーん！ 楽しかったね！」", 1.15),
            ["マイカ｜気持ちいい！", "リヒト｜よし、あと 4つ。", "（『コイヌの大冒険』『ワンワンワールド』も 回って、時刻は 20時45分。）"]),
    ],
    talks:[["ワンコーヒーの 店員", ["ワンコーヒーの 店員｜ごゆっくり どうぞ！ 肉球アイスも 人気だよ。", "ワンコーヒーの 店員｜あったかい 飲み物で ほっと ひと息。"]]],
    fin:["語り手｜休けいも 作戦のうち。 4人は 元気を とりもどした！", "語り手｜時刻は 20時45分。 いよいよ ラストスパート！"],
    learn:"休むことも 大切な 作戦。 無理して 走ると 危ない。"});

LDX("wn", 9, {title:"ラストスパート！", sub:"観覧車に まにあうか！？", lv:59, theme:"night", bgm:"castle",
    intro:["語り手｜時刻は 20時45分。 残りは 2つ。 閉園まで あと 15分！", "語り手｜4人は 最後の ちからを ふりしぼる。"],
    steps:[
        LP("リヒト", "ドッグパレード", ["（『ドッグパレード』を 見ながら 10分間。 パレードの 犬たちが 手をふってくれた。）", "サトル｜かわいい！", "リヒト｜時刻は 20時55分。 残り 5分だ。", "リヒト｜最後は 『コイヌ観覧車』だ！ 走るぞ！"]),
        LQ("スタッフ", "20時59分59秒", ["（観覧車の 入口に ついた 4人。）", "スタッフ｜申し訳ございません。 観覧車は 21時で 終了です。", "リヒト｜並んでました！", "スタッフ｜受付は 20時59分59秒までなんですよ。"],
            [["ルールで ダメと 言われたとき、リヒトたちは どうするのが いい？", "かんたんに 言い合いにならず、事実を 丁寧に 伝える", ["大声で さけんで 文句を 言う", "ウソを ついて 割り込む"], "サトル｜この 時計では 20時59分24秒ですよ。 事実を つたえてみよう。", "スタッフ｜あら、そこまでいうなら 4名様どうぞ！"]]),
        LB("パレードたいちょう", "パレード隊長", ["（観覧車に 乗ると、頂上に 『パレード隊長』が！）", "パレードたいちょう｜ごほうび バトル！ 全制覇の 実力を 見せてくれ！"],
            ldFoe("wn9_captain", "パレード隊長", "🎺", "wn9_boss", 59, [["ぱんぱか ファンファーレ", 1, 0.7, 1.0], ["ずんずん 行進", 0, 1, 1.3], ["ぴかぴか キラキラ", 1, 0.5, 0.9]], "パレード隊長「すばらしい！ 全制覇、おめでとう！」", 1.15),
            ["リヒト｜夜の ワンコロランドは きれいだな。", "マイカ｜疲れたけど、達成感 あるな。", "アカネ｜わたしたち、やったね！ 全制覇！"]),
        LP("マイカ", "観覧車の 上で", ["マイカ｜綺麗…。 今日1日、いろいろ あったね。", "サトル｜スケジュール おくれたり、あせったり…。", "リヒト｜これも みんなで 協力したからだ。", "アカネ｜チームワークって 大事だね。"]),
    ],
    talks:[["観覧車の 係員", ["観覧車の 係員｜落ちついて 乗ってね。 景色が 最高だよ。", "観覧車の 係員｜写真は 立ち上がらずに 座ったままで！"]]],
    fin:["語り手｜ぎりぎりで 観覧車に 間にあった！ あきらめない 気持ちが 勝利を つかんだね。", "語り手｜最後は 『全制覇しょうめいしょ』を もらう 場面。"],
    learn:"最後まで あきらめず、でも ルールは 守って ていねいに 伝えよう。"});

LDX("wn", 10, {title:"全制覇しょうめいしょ", sub:"つぎの ぼうけんへ", lv:61, theme:"stage", bgm:"castle",
    intro:["語り手｜観覧車を おりると、スタッフが 待っていた。", "語り手｜4人の 長い 1日は、いよいよ 最後の 場面。"],
    steps:[
        LP("スタッフ", "しょうめいしょ", ["スタッフ｜お疲れさまでした。 全制覇達成、おめでとうございます。", "（4人に 特別な 記念品 『ワンコロランド 全制覇しょうめいしょ』が わたされた。）", "サトル｜すげー！ こんなの もらえるんだ！", "アカネ｜嬉しい！", "マイカ｜記念になるね！"]),
        LP("リヒト", "帰りの 電車で", ["サトル｜今日は 最高だったな。", "アカネ｜スケジュール どおりに いかないのも、それはそれで おもしろかった。", "マイカ｜わたしたち、良い チームだよね。", "リヒト｜ああ、最高の チームだ。 友達って、いいものだな。"]),
        LP("サトル", "数日後", ["サトル｜写真を SNSに あげたら めっちゃ いいね ついた！", "アカネ｜わたしも！ みんな うらやましがってた。", "マイカ｜つぎは どこ いく？", "サトル｜『ネコネランド』って 聞いたことあるんだけど。"]),
        LB("ゲートキーパー", "全制覇 しけんバトル", ["（4人の 前に、キラキラ ひかる 『ゲートキーパー』が あらわれた！）", "ゲートキーパー｜全制覇 おめでとう！ さいごに 本当の 力を 見せてくれ！"],
            ldFoe("wn10_boss", "ゲートキーパー", "🔑", "wn10_boss", 61, [["かちゃかちゃ キー", 0, 1, 1.3], ["ぴかぴか ゲートビーム", 1, 0.6, 1.0], ["どっしり ゲート", 0, 0.5, 1.7]], "ゲートキーパー「見事だ！ 次の 冒険も 応援してるぞ！」", 1.2),
            ["ゲートキーパー｜りっぱな チームワークだ。 ごほうびを うけとってくれ！"]),
    ],
    talks:[["記念写真の かかり", ["記念写真の かかり｜はい、チーズ！ ワン！", "記念写真の かかり｜今日の 思い出は 一生 たからものだよ。"]]],
    fin:["語り手｜ワンコロランド 全制覇！ 4人は また 新しい 冒険へ 向かう。", "語り手｜『ネコネランド』…ではなく、つぎは 『ウサウサランド』かも！？"],
    learn:"仲間と 協力して やりとげた 経験は、一生の たからもの。"});

RPG_EV.wn_final = YKL([
    "語り手｜ワンコロランドの 10話は ぜんぶ おしまい。", "語り手｜4人の チームワークは 世界一！ きみにも 全制覇しょうめいしょを 渡すよ。"
]).concat([["gold", 60000], ["item", "special", 8], ["item", "omamori", 3], rpgN("60,000G と スペシャルおにぎり 8こ・ふっかつのおまもり 3こを てにいれた！"), ["set", "e_wn_all"], ["run", "lab_ret_go"]]);


/* ==== game/us.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[48]=1;
"use strict";
// ===== ウサウサランド（サブストーリー・任意・全10話）=====
//   アトラクション 45こ！ 雨と 氷点下の 1日。 さいごは とくべつ 脱出ゲーム。 （おすすめ Lv は ワンコロより +30）
LDX("us", 1, {title:"1しゅうかん前の 作戦会議", sub:"ヒノモト一の 全制覇ミッション", lv:73, theme:"school", bgm:"town",
    intro:["語り手｜ここは うさぎの テーマパーク 『ウサウサランド』。 アトラクションは なんと 45しゅるい！", "語り手｜今回は サトルの たんじょう日を いわう ための 大作戦。 リヒト・サトル・アカネ・マイカの 4人が あつまった。"],
    steps:[
        LP("アカネ", "分厚い 資料", ["（リヒトの へやには、パンフレット・タブレット・付箋・マーカー、そして アカネの 分厚い 資料が 山づみ。）", "アカネ｜みんな、今回は 今までで いちばん きびしい ちょうせんだよ。", "サトル｜どのくらい きびしいの？", "アカネ｜アトラクションは 45しゅるい。 ヒノモト一の 数だよ。", "マイカ｜45しゅるい！？"]),
        LQ("リヒト", "計算してみよう", ["アカネ｜人気アトラクションは 10こ。 ぜんぶ 課金しても 1時間待ち。", "アカネ｜開園は 8時から 20時。 そして 16時から 17時は パレードを 見る。", "アカネ｜18時から 20時は リアル脱出ゲーム イベントに さんか。"],
            [["『8時〜18時』の 10時間で 45こ まわる。 1こに つかえる 時間は 平均で およそ どのくらい？", "およそ 13分", ["およそ 60分", "およそ 1分"], "リヒト｜10時間は 600分。 45で わると…？ もういちど 計算してみよう。", "リヒト｜そう、およそ 13分。 かなり きびしいね。"]]),
        LP("サトル", "サトルの たんじょう日", ["サトル｜今回は ぼくの たんじょう日祝いも 兼ねてるんだよな。 1月23日が 誕生日なんだ。", "アカネ｜だから ぜったい 成功させたいの！ サトルの 最高の 誕生日に したい！", "サトル｜ありがとう、アカネ。"]),
        LP("マイカ", "さあ 計画を！", ["マイカ｜じゃあ、がんばろう！", "リヒト｜よし。 計画を 立てはじめよう。", "アカネ｜今日から 毎日 あつまって、完ぺきな 計画を 立てるよ！"]),
    ],
    talks:[["うさぎの ぬいぐるみ", ["うさぎの ぬいぐるみ｜ぴょん！ 計画は 大事だけど、楽しむ 気持ちも 大事だぴょん。", "うさぎの ぬいぐるみ｜無理な 計画は、体を こわすかも。 気をつけて！"]]],
    fin:["語り手｜目標は 『45しゅるい 全制覇』と 『脱出ゲーム』。 かなり 大変そうだね。", "語り手｜つぎは 1週間かけた 計画の 立て方。"],
    learn:"目標が 大きい ときは、数字で 見積もってみよう。 無理が ないか 確かめることも 大事。"});

LDX("us", 2, {title:"1週間の 計画づくり", sub:"完ぺきな スケジュール？", lv:75, theme:"lab", bgm:"town",
    intro:["語り手｜1日目から 7日目まで、4人は 毎日 あつまって 計画を 磨いていく。", "語り手｜アカネの 『完ぺきな 計画』は できるのかな？"],
    steps:[
        LP("アカネ", "1日目 情報収集", ["アカネ｜まず 全アトラクションを リストアップするよ。", "（子供向け 10・一般向け 25・絶叫系 10。 絶叫系は ぜんぶ 人気で 課金が 必要。）", "リヒト｜課金は 1人 1500円か。 4人で 6000円だね。"]),
        LQ("サトル", "2日目〜5日目", ["アカネ｜子供向けは 待ち時間 平均 20分、一般向けは 40分。", "アカネ｜だから 近くの アトラクションを 連続で まわって、移動時間を へらすよ。", "サトル｜ストップウォッチで シミュレーションしてみよう！"],
            [["計画の 練習（シミュレーション）を する ねらいは？", "本番で おこる 問題を 先に 見つけておく", ["練習するほど 本番で 時間が かかる", "計画は 立てなくても いい"], "リヒト｜移動時間が 予想以上に かかるのが わかったね。", "サトル｜そう！ 問題を 先に 見つけるから、本番で あわてなく なる。"]]),
        LP("マイカ", "6日目 問題点", ["アカネ｜シミュレーションの 結果、問題点が 見えてきた。", "マイカ｜雨が ふると 移動速度が おちるよね。 当日は 雨予報だし…。", "アカネ｜だから 雨対策も 必要。 カッパ・防水バッグ・タオルを 全部 用意する！"]),
        LP("サトル", "7日目 最終調整", ["サトル｜リアル脱出ゲームを あきらめれば 時間ができる、と 思ったんだけど…。", "アカネ｜でも わたしは 両方 達成したい！ サトルの 誕生日だもん。", "リヒト｜わかった。 時間は 作ろう。 かならず 方法は あるはず。"]),
    ],
    talks:[["計画ノートの うさぎ", ["計画ノートの うさぎ｜ノートに 書くと、頭の 中が すっきりするぴょん。", "計画ノートの うさぎ｜失敗しても 大丈夫、直せば いいぴょん。"]]],
    fin:["語り手｜1週間かけて、準備は ばっちり。 当日が 楽しみだね。", "語り手｜でも 当日の 天気は…。"],
    learn:"練習して 問題点を 見つけよう。 天気や 体調も、計画に 入れておくと 安心。"});

LDX("us", 3, {title:"雨と 氷点下の あさ", sub:"さむい 日の 準備", lv:77, theme:"snow", bgm:"town",
    intro:["語り手｜1月23日の 朝5時。 リヒトの アラームが 鳴った。", "語り手｜外は 雨。 気温は 氷点下2度。 風も 強い、きびしい 天気。"],
    steps:[
        LP("リヒト", "最悪の 天気！？", ["リヒト｜うう、さむい…。", "（スマホで 天気予報を 見ると 『降水確率100% 風速10m』と 出ていた。）", "リヒト｜風も 強いな。 厳しいけど、あきらめるわけには いかない。"]),
        LQ("リヒト", "持ち物 チェック", ["（リヒトは リュックに カッパ・防水バッグ・タオル・着替え・ホッカイロを つめた。）", "リヒト｜これで ひとまず 安心かな。"],
            [["雨で 氷点下の 日に、いちばん 大事な 準備は？", "体を あたためる 服と ホッカイロ、ぬれた ときの 着替え", ["うすい 服だけで 行く", "傘だけ 持って 行く"], "リヒト｜体が 冷えると 動けなく なるよ。 防寒が いちばん 大事。", "リヒト｜そうだね。 着替えと ホッカイロで 体を まもろう。"]]),
        LP("サトル", "駅で 合流", ["サトル｜おはよう、さむいな。", "マイカ｜おはよう、リヒトくん。", "リヒト｜アカネは？", "（そこへ 走ってきた アカネは 大きな リュックを 背負っていた。）", "アカネ｜ごめん！ 準備に 時間 かかった！ 中身は あとで 教えるね。"]),
        LP("電車の 乗客", "ウサウサランドへ", ["電車の 乗客｜今日は すごい 雨ですね。 気をつけて 行ってらっしゃい。", "電車の 乗客｜風邪を ひかないよう、あったかい 服で。", "（4人は 電車に のって ウサウサランドへ 向かった。）"]),
    ],
    talks:[["駅員さん", ["駅員さん｜足元が すべりやすいから、ゆっくり 歩いてね。", "駅員さん｜ホームで 走るのは 危ないよ。"]]],
    fin:["語り手｜寒さ対策は ばっちり。 4人は ウサウサランドの 正門へ。", "語り手｜開園前の 行列で、気持ちが ゆらぐ 場面が…。"],
    learn:"寒い 日は 防寒と 着替えの 準備を。 体調を いちばんに しよう。"});

LDX("us", 4, {title:"極寒の 待機と ホップ・ぐるぐる", sub:"チケット争奪戦！", lv:79, theme:"snow", bgm:"field",
    intro:["語り手｜朝7時、ウサウサランドの 正門前。 すでに 数百人が 並んでいる。", "語り手｜雨は 強く、風も ふいている。 4人は 寒さに 耐えて 開園を 待つ。"],
    steps:[
        LP("マイカ", "ホッカイロを 配る", ["サトル｜雨なのに、こんなに 人が いるのか。", "マイカ｜みんな、冬限定イベント めあてなんだろうね。", "マイカ｜ホッカイロ 持ってきたよ。 みんなに 配るね。", "アカネ｜ありがとう、マイカちゃん！"]),
        LQ("リヒト", "『帰りたい』の 気持ち", ["リヒト｜正直、帰りたい。 こんなに 寒い 中、1日中 アトラクションなんて…。", "サトル｜リヒト、無理しなくて いいよ。 体調を 崩したら 意味ないから。", "アカネ｜でも わたしは あきらめない。 ここまで 来たんだから。"],
            [["『つらい』と 思ったとき、仲間に どう 伝えると いい？", "素直に 気持ちを 伝えて、体調を 大事に しながら 決める", ["だまって がまんして 倒れる", "文句を 言って ほかの 人を せめる"], "マイカ｜つらい ときは 言って いいんだよ。", "リヒト｜そうだな。 気持ちを 伝えて、体調を 見ながら がんばるよ。"]]),
        LP("スタッフ", "いよいよ 開園", ["スタッフ｜みなさん、お待たせしました！ 開園です！", "アカネ｜走れーっ！ （雨で すべりやすいから ゆっくり！）", "（長い 列の あと、4人は 課金チケットを ゲットした。）", "リヒト｜高っ…。 でも しかたない。"]),
        LB("ぐるぐるマックス", "ホップ・ぐるぐるマックス", ["（『ホップ・ぐるぐるマックス』は ウサウサランドで いちばん 回る 絶叫マシン。 ジェットコースターも フリーフォールも 回転も 全部まざり！）", "ぐるぐるマックス｜ホップ！ ぐるぐる〜！ しっかり つかまってね！"],
            ldFoe("us4_max", "ぐるぐるマックス", "🌀", "us4_boss", 79, [["ぐるぐる ターン", 0, 1, 1.3], ["びゅんびゅん ホップ", 1, 0.7, 1.0], ["さかさま スピン", 0, 0.6, 1.7]], "ぐるぐるマックス「ぐるぐる〜！ また 乗ってね！」", 1.2),
            ["サトル｜ふらふら…。 目が まわった…。", "マイカ｜もう 2度と 乗らない！", "アカネ｜でも 楽しかったね！", "リヒト｜楽しいのか…？"]),
    ],
    talks:[["行列の 子ども", ["行列の 子ども｜ぼくも 寒いけど、がんばる！", "行列の 子ども｜ホッカイロ、ありがとう！"]]],
    fin:["語り手｜寒さと 疲れの 中でも、4人は 助けあって 進んだね。", "語り手｜まだ 8こ！ 絶叫マシンの マラソンが つづくよ。"],
    learn:"つらい ときは 素直に 伝える。 体調を 大事にして、無理を しすぎない。"});

LDX("us", 5, {title:"ぜっきょうマラソン", sub:"目が まわる 連続アトラクション", lv:81, theme:"stage", bgm:"castle",
    intro:["語り手｜つぎは 『バニー・ぴゅーん』『ラビット・くるくる』『うさぎの ふしぎやしき』。", "語り手｜4人は だんだん ふらふら…。 それでも 笑顔で 進むよ。"],
    steps:[
        LP("アカネ", "バニー・ぴゅーん", ["アカネ｜つぎは 『バニー・ぴゅーん』！ 射出型の マシンだよ。", "スタッフ｜カウントダウンします。 3、2、1、ぴゅーん！", "サトル｜うわああああ！", "マイカ｜速いいいい！", "リヒト｜これは やばい…！"]),
        LP("リヒト", "ラビット・くるくる", ["リヒト｜つぎは 『ラビット・くるくる』。 高速回転だ。 待ち時間60分。", "サトル｜速い 速すぎる…。", "マイカ｜目が まわる〜。", "アカネ｜もう 何も 見えない！"]),
        LB("ふしぎやしきの うさぎ", "うさぎの ふしぎやしき", ["（つぎは お化け屋敷風 『うさぎの ふしぎやしき』。 でも 出てくるのは ぬいぐるみの おばけうさぎ。）", "ふしぎやしきの うさぎ｜ふわふわ〜 ぴょーん！ びっくりした〜？"],
            ldFoe("us5_yashiki", "ふしぎやしきの うさぎ", "🐰", "us5_boss", 81, [["ぴょんぴょん ジャンプ", 0, 1, 1.2], ["ぷるぷる おどろかし", 1, 0.7, 0.9], ["ふかふか タックル", 0, 0.7, 1.5]], "ふしぎやしきの うさぎ「ぴょ〜ん！ また 来てね！」", 1.2),
            ["マイカ｜かわいいのに びっくりした〜。", "サトル｜出口に 光が 見える！", "アカネ｜これで 4こ おわった！", "リヒト｜まだ 6こもあるのか…。"]),
        LQ("スタッフ", "つかれた ときは", ["スタッフ｜お客さま、顔色が 悪いですよ。 少し 休まれては どうでしょう。", "スタッフ｜絶叫マシンの 連続は 体に 負担が かかります。"],
            [["ふらふらして きたとき、どうするのが 正しい？", "休けいして、水分を とり、無理を しない", ["気合いで もう1つ 乗る", "水を 飲まずに がまんする"], "リヒト｜休む ことも 大事だね。 ふらふらなら ベンチへ。", "スタッフ｜そのとおりです。 体調が 一番ですよ。"]]),
    ],
    talks:[["売店の うさぎ", ["売店の うさぎ｜あったかい ココアは いかが？", "売店の うさぎ｜ふぅふぅ して 飲むと ぽかぽかだぴょん。"]]],
    fin:["語り手｜絶叫マシンの 連続は 体への 負担が 大きい。 でも 4人は 休みながら すすんだね。", "語り手｜つぎは お昼ごはんなき 戦い。 そして…。"],
    learn:"疲れた ときは 休けいと 水分。 気合いだけで がまんしない。"});

LDX("us", 6, {title:"お昼なき 戦いと けんか", sub:"仲直りの 方法", lv:83, theme:"town", bgm:"town",
    intro:["語り手｜時刻は 13時45分。 4人は お腹ぺこぺこ。", "語り手｜ところが、座って 食べる 時間が ない。 おにぎりを 歩きながら 食べることに…。"],
    steps:[
        LP("アカネ", "歩きながらの お昼", ["アカネ｜お腹 空いたよね。", "サトル｜めっちゃ 空いた。", "アカネ｜歩きながら 食べよう。 じゃないと 時間が 足りない。", "（アカネは リュックから 朝 作ってきた おにぎりと パンを 取り出した。）", "マイカ｜なんか 修行みたい。", "サトル｜でも、うまい！"]),
        LP("リヒト", "バニー・つむじ風", ["リヒト｜つぎは 『バニー・つむじ風』。 つむじ風型の 絶叫マシン。 待ち時間60分だ。", "（マシンは ぐるぐる 回って 3分後に 止まった。）", "サトル｜もう 立てない…。", "アカネ｜でも パレードまで あと 5分！ 急ごう！"]),
        LQ("リヒト", "けんかに なった！", ["サトル｜もう 無理。 正直、帰りたい。", "リヒト｜おれも 同じ 気持ちだ。 これ以上 つづけたら、体が もたない。", "マイカ｜リヒトくん！ また 弱音を はく！", "リヒト｜弱音じゃない！ 現実的な 話を してるんだ！", "（リヒトと マイカは 言い合いに なってしまった…。）"],
            [["言い合いに なったとき、どうするのが いいかな？", "深呼吸して、相手の 気持ちを 聞いてから あやまる", ["もっと 大きな 声で 言い返す", "無視して ひとりで 行く"], "サトル｜みんな、やめよう。 おれの せいで けんかさせて ごめん…。", "リヒト｜ごめん、サトル。 おれ、弱音を はいて。", "マイカ｜わたしも 感情的に なりすぎた。"]]),
        LP("アカネ", "チーム再団結", ["アカネ｜ねえ、みんな。 わたし、あきらめたくない。", "アカネ｜実は 最終手段を 考えてた。 『チーム分割作戦』！", "アカネ｜2人ずつに わかれて、パレードのあとに 合流するの。", "サトル｜全制覇を 達成したい。 みんな、最後まで 付き合ってくれ！", "リヒト｜わかった。 やろう。", "マイカ｜わたしも！"]),
    ],
    talks:[["パレード会場の 係員", ["パレード会場の 係員｜まもなく パレード開始です。 前の方から つめて 座ってね。", "パレード会場の 係員｜足元に 気をつけてね。"]]],
    fin:["語り手｜けんかして、あやまって、また ひとつに。 チームの きずなが 強まったね。", "語り手｜パレードを 見たあと、作戦を 実行！"],
    learn:"けんかに なっても、ごめんと 言えば 仲直りできる。 相手の 気持ちを まず 聞こう。"});

LDX("us", 7, {title:"冬の パレードと チーム分割", sub:"2チームに わかれて", lv:85, theme:"stage", bgm:"castle",
    intro:["語り手｜16時。 冬限定の パレードが はじまる。", "語り手｜雪の 衣装の うさぎたちが 登場！ しばしの 癒しの 時間だよ。"],
    steps:[
        LP("マイカ", "パレード開始", ["マイカ｜良い 場所 見つけたよ！", "（雪の 結晶の 山車、雪だるまを 持った うさぎ、ふわふわの 雪の 演出…。）", "マイカ｜かわいい！", "サトル｜これは 癒されるな。", "アカネ｜写真 撮ろう！"]),
        LB("ゆきうさぎ たいちょう", "雪うさぎ隊長", ["（パレードの 先頭に 立つ 『雪うさぎ隊長』が ふたりの 前で 立ち止まった。）", "ゆきうさぎ たいちょう｜ここまで よく がんばったね。 ごほうびに 力くらべだ！"],
            ldFoe("us7_captain", "ゆきうさぎ たいちょう", "⛄", "us7_boss", 85, [["ふわふわ ふぶき", 1, 0.7, 1.0], ["どっしり 雪玉", 0, 1, 1.4], ["きらきら ダイヤモンド", 1, 0.5, 0.9]], "ゆきうさぎ たいちょう「いい ぼうけんを、ぴょん！」", 1.2),
            ["ゆきうさぎ たいちょう｜みんなの 笑顔が 最高の ごほうびだよ。", "アカネ｜パレードで 元気 でた！"]),
        LQ("アカネ", "チーム分割作戦", ["アカネ｜チーム分割作戦を 実行する。 リヒトと サトルが チームA、わたしと マイカが チームB。", "アカネ｜チームAは 人気アトラクション 4つ。 チームBは 一般向けアトラクション。", "アカネ｜18時に 『ホップ・ぐるぐるデラックス』の 前で 合流しよう。"],
            [["チームに わかれて 作業するとき、大事なことは？", "役わりと 集合の 時間・場所を 決めておく", ["それぞれ 好きに 動く", "連絡は 一切 しない"], "リヒト｜集合時間と 場所は 大事だよ。 スマホで 連絡も とろう。", "アカネ｜そう！ 役わりと 集合時間を 決めておくと、バラバラでも うまく いくよ。"]]),
        LP("サトル", "出発！", ["サトル｜了解！", "リヒト｜よし、行くぞ。", "（こうして チームは ふたつに わかれた。）"]),
    ],
    talks:[["パレードの うさぎ", ["パレードの うさぎ｜ハイタッチ しよう！ ぴょん！", "パレードの うさぎ｜写真は 一緒に ピースして ね！"]]],
    fin:["語り手｜パレードで 元気を もらって、チームは ふたつに わかれて 出発。", "語り手｜チームAは 人気アトラクション、チームBは 一般向けアトラクションを 目指すよ。"],
    learn:"チームで わかれて 作業する ときは、役わりと 集合の ルールを 決めよう。"});

LDX("us", 8, {title:"全制覇の 瞬間！", sub:"チームAとB 合流", lv:87, theme:"night", bgm:"castle",
    intro:["語り手｜17時5分。 チームAの リヒトとサトルは 『ホップ・ぐるぐるデラックス』へ。", "語り手｜チームBの アカネとマイカは 『ラビットコースター』へ。"],
    steps:[
        LP("リヒト", "チームA 絶叫マラソン", ["（『ホップ・ぐるぐるデラックス』『ラビット・すとーん』『バニー・ぽかぽかライト』と 3つを クリア。）", "サトル｜ふらふらする…。", "リヒト｜でも、あと 1つだ！"]),
        LP("アカネ", "チームB 効率マラソン", ["（『ラビットコースター』『ホップスター』『バニースカイ』『うさぎの大冒険』『ラビットフライト』と 5つを クリア。）", "マイカ｜観覧車の 夜景、きれいだったね。", "アカネ｜あと 少し！ がんばろう！"]),
        LB("スーパースター", "ホップ・スーパースター", ["（最後の アトラクション 『ホップ・スーパースター』。 閉園時間を すぎていたが、リヒトと サトルは スタッフに おねがいした。）", "スタッフ｜最後の お客様として、特別に のせてあげます。", "スーパースター｜きらきら〜！ 全制覇、あと一歩だ！"],
            ldFoe("us8_star", "スーパースター", "⭐", "us8_boss", 87, [["きらきら ビーム", 1, 0.7, 1.0], ["ぐんぐん ダッシュ", 0, 1, 1.4], ["ぴかぴか スーパー", 0, 0.5, 1.8]], "スーパースター「全制覇、おめでとう！」", 1.25),
            ["サトル｜やった！ 全制覇！", "リヒト｜信じられない、本当に やったのか！"]),
        LQ("スタッフ", "出口で 合流", ["（20時55分。 4人は 出口で 合流して、だきあって よろこんだ。）", "スタッフ｜全制覇達成、おめでとうございます。", "スタッフ｜記念品は 『ウサウサランド 完全制覇しょうめいしょ』と 特別な メダルです。"],
            [["全制覇を 達成できた いちばんの 理由は？", "協力して、役わりを わけて、あきらめなかったから", ["ひとりで ぜんぶ やったから", "ルールを 無視したから"], "サトル｜みんなの おかげだよ。", "リヒト｜そうだね。 協力と あきらめない 気持ちが 勝利を 生んだね。"]]),
    ],
    talks:[["ゲートの スタッフ", ["ゲートの スタッフ｜おめでとうございます！ メダル、よく似合ってますよ。", "ゲートの スタッフ｜でも 実は… 特別な イベントが あるんです。"]]],
    fin:["語り手｜45しゅるい、全制覇！ 4人は 手を つないで よろこんだ。", "語り手｜でも アカネは まだ 何かを 考えて いるみたい…。"],
    learn:"協力して 役わりを わけると、ひとりでは できない ことも 達成できる。"});

LDX("us", 9, {title:"とくべつ 脱出ゲーム（前）", sub:"3つの なぞ", lv:89, theme:"lab", bgm:"cave",
    intro:["語り手｜全制覇した 人だけが 参加できる 『特別 リアル脱出ゲーム』。", "語り手｜制限時間は 60分。 5つの なぞを 解いて、出口の かぎを あけよう！"],
    steps:[
        LP("スタッフ", "ルール説明", ["スタッフ｜ここが 特別リアル脱出ゲームの 会場です。", "スタッフ｜5つの なぞを 解いて、出口の かぎを あけてください。 制限時間は 60分です。", "アカネ｜参加します！ 最後まで 付き合って！"]),
        LQ("アカネ", "第1の なぞ 暗号文", ["（部屋の 中央に 大きな 紙。 暗号文が 書かれている。）", "『UDEELW LV WUXWK』", "アカネ｜アルファベットを 3つ ずらす 『シーザー暗号』みたい。 U→R、D→A、E→B…と 3つ 戻すよ。"],
            [["暗号文を 解くと、どんな 意味に なる？", "RABBIT IS TRUTH", ["RABBIT IS FRIEND", "CARROT IS TRUTH"], "マイカ｜U→R、D→A、E→B、E→B、L→I、W→T と もどして みよう。", "サトル｜『RABBIT IS TRUTH』！ うさぎは 真実…！"]]),
        LQ("リヒト", "第2の なぞ 数式", ["（壁に 数式が 書かれている。）", "『3 ＋ 5 ＝ 158』　『4 ＋ 6 ＝ 2410』　『5 ＋ 7 ＝ ？』", "アカネ｜ヒントは 『かけ算 と たし算 を ならべる』だって。"],
            [["『5 ＋ 7 ＝ ？』の 答えは？", "3512", ["2412", "1235"], "リヒト｜3＋5 では 3×5＝15 と 3＋5＝8 を ならべて 158。 5と7でも 同じ やり方で やってみよう。", "リヒト｜5×7＝35 と 5＋7＝12 を ならべて 3512！"]]),
        LQ("マイカ", "第3の なぞ 絵のパズル", ["（壁には 4枚の 絵。 1枚目 太陽、2枚目 月、3枚目 星、4枚目 ？）", "マイカ｜選択肢は A. 雲　B. 雨　C. 虹　D. 地球 だよ。", "サトル｜太陽は 昼、月と 星は 夜。 ヒントは 『昼と夜の あいだ』…？"],
            [["4枚目に 入る 絵は どれ？", "虹", ["雲", "地球"], "マイカ｜虹は いつ 見える？ 雨が あがった 空に 出るよね。", "アカネ｜そう！ 雨あがりの 空に でる 『虹』だ！"]]),
        LB("なぞの ばんにん", "なぞの 番人", ["（3つめを 解いたとき、キラキラ ひかる 『なぞの 番人』が あらわれた！）", "なぞの ばんにん｜ここまで 来たね。 つぎの へやに 進む 前に、力くらべだ！"],
            ldFoe("us9_guard", "なぞの ばんにん", "🔮", "us9_boss", 89, [["ひらめき ビーム", 1, 0.7, 1.0], ["ぐるぐる 暗号", 0, 1, 1.4], ["ぴかぴか 鍵", 0, 0.6, 1.7]], "なぞの ばんにん「見事な ひらめきだ！」", 1.25),
            ["なぞの ばんにん｜つぎの へやへ どうぞ。"]),
    ],
    talks:[["ヒントの うさぎ", ["ヒントの うさぎ｜暗号は 文字を ずらす 方法が あるぴょん。", "ヒントの うさぎ｜あせらず ゆっくり 考えれば 大丈夫！"]]],
    fin:["語り手｜3つの なぞを 解いた！ のこりは あと 2つ。", "語り手｜つぎは 迷路と 最終問題だよ。"],
    learn:"なぞは 一つずつ ヒントを 集めて 順番に 解こう。 あわてずに 考えよう。"});

LDX("us", 10, {title:"とくべつ 脱出ゲーム（後）", sub:"さいごの 扉", lv:91, theme:"stage", bgm:"demoncastle",
    intro:["語り手｜のこりの なぞは あと 2つ。 迷路と、最後の 4けたの 鍵。", "語り手｜時間は 残り 20分ぐらい。 ここが 勝負だ！"],
    steps:[
        LQ("サトル", "第4の なぞ 迷路", ["（次の 部屋には 巨大な 迷路。 壁に 『RIGHT』『LEFT』『RIGHT』と 文字が 書かれている。）", "アカネ｜この 文字が ヒントだよ。 分かれ道で 書かれた 方向に 進めば ゴールに つくはず。"],
            [["書かれた じゅんばんに 進むと、どうなる？", "右 → 左 → 右 の じゅんで 進むと ゴール", ["左 → 左 → 右 の じゅんで 進むと ゴール", "ずっと まっすぐ 進むと ゴール"], "マイカ｜RIGHT は 右、LEFT は 左だよ。 もういちど 見てみよう。", "リヒト｜そう！ 右・左・右の じゅんだ。 4つ目 クリア！"]]),
        LQ("リヒト", "第5の なぞ 最後の 鍵", ["（最後の 部屋には 大きな 扉。 4けたの 数字を 入力するようだ。）", "『1つ目の 答えは 言葉、2つ目は 数字、3つ目は 絵、4つ目は 道。 それぞれの 数を ならべよ』", "アカネ｜1つ目は 『うさぎ』の 耳の 数。 2つ目は 『3512』の 各けたを たした 数。"],
            [["うさぎの 耳の 数は 何本？", "2本", ["1本", "4本"], "リヒト｜うさぎの 耳は…？ 想像して 数えてみよう。", "サトル｜2本！ 1つ目の 数は 2。"]]),
        LQ("マイカ", "各けたを たす", ["マイカ｜つぎは 3512 の 各けたを たすよ。 3 ＋ 5 ＋ 1 ＋ 2 ＝ ？"],
            [["3 ＋ 5 ＋ 1 ＋ 2 の 答えは？", "11", ["10", "12"], "アカネ｜3＋5＝8、8＋1＝9、9＋2＝？", "アカネ｜11！ 2つ目の 数は 11。"]]),
        LQ("アカネ", "のこりの ヒント", ["アカネ｜3つ目は 『虹』の 色の 数。 4つ目は 『道』が 何本 だったか。 迷路の 道は 1本だよね。", "リヒト｜じゃあ、2・11・7・1 を ならべると…？"],
            [["『2』『11』『7』『1』を ならべて できる 4けたの 数字は？", "2171", ["2117", "1172"], "サトル｜2・11・7・1 を ならべると 2、11、7、1。 つなげると…？", "サトル｜2171！ 入力してみよう！"]],
            ["（ピンポーン！ 扉が ひらいた！）", "アカネ｜やった〜！ みんな、ありがとう！", "リヒト｜やったな！ 時刻は 21時55分。 制限時間ぎりぎりで クリアした！"]),
        LB("もんばん", "脱出ゲーム マスター", ["（扉の 向こうには、スタッフが 待っていた。 そして、いちばん 最後の しけん。）", "もんばん｜おめでとう！ 最後に 全力の 力くらべだ！"],
            ldFoe("us10_boss", "脱出ゲーム マスター", "🗝️", "us10_boss", 91, [["かちゃかちゃ 錠前", 0, 1, 1.4], ["ひらめき ビーム", 1, 0.6, 1.1], ["どっしり 大扉", 0, 0.5, 1.9]], "脱出ゲーム マスター「完全クリアだ！ すばらしい！」", 1.3),
            ["スタッフ｜今年初めての クリア者です。 金色の トロフィーを どうぞ！", "サトル｜みんな、ありがとう。 最高の 誕生日だった。"]),
    ],
    talks:[["脱出ゲームの スタッフ", ["脱出ゲームの スタッフ｜今年初めての クリア者です！ おめでとう！", "脱出ゲームの スタッフ｜友達と 協力する 力が すばらしかった。"]]],
    fin:["語り手｜リアル脱出ゲーム、完全クリア！ サトルの 誕生日は 最高の 思い出に なった。", "語り手｜帰りの 電車で、4人は 『最高の チームだな』と 笑いあったよ。"],
    learn:"仲間と 協力して、ヒントを つなげれば どんな なぞも 解ける。"});

RPG_EV.us_final = YKL([
    "語り手｜ウサウサランドの 10話は ぜんぶ おしまい。", "語り手｜コイヌネランド・ワンコロランド・ウサウサランド。 3つの パークを 制覇した 4人の 友情と ちょうせんの 物語は、これで 『完』だよ。",
    "語り手｜どんな 困難も、仲間と いっしょなら のりこえられる。 …またね！"
]).concat([["gold", 150000], ["item", "special", 10], ["item", "omamori", 5], rpgN("150,000G と スペシャルおにぎり 10こ・ふっかつのおまもり 5こを てにいれた！"), ["set", "e_us_all"], ["run", "lab_ret_go"]]);


/* ==== game/ld-end.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[49]=1;
"use strict";
// ===== テーマパーク編：ゲートの 行き先・称号・もくてき・チート／リプレイ =====
(function(){
    const LANDS = [["kn", "本編：コイヌネランド", "必須"], ["wn", "任意：ワンコロランド", "任意"], ["us", "任意：ウサウサランド", "任意"]];
    const LV = (land, n) => (LD_EPS[land][n - 1] || {}).lv || 30;
    LANDS.forEach(([land, label]) => {
        for(let i = 1; i <= 10; i++){
            const e = LD_EPS[land][i - 1], req = i > 1 ? "e_" + land + (i - 1) : (land === "kn" ? "e_future" : "e_kn10");
            RPG_ERAS.push({id:land + i, n:label + " 第" + i + "話 " + e.title + "（推奨 Lv" + e.lv + "）", map:land + i, pos:[9, 10], done:"e_" + land + i, req});
        }
    });
    const xe = RPG_ERAS.find((e) => e.id === "xr"); if(xe){ RPG_ERAS.splice(RPG_ERAS.indexOf(xe), 1); RPG_ERAS.push(xe); }
    const F = (k) => () => !!G.S.f[k];
    [["t_kn_all", "コイヌネランド かんけつ！", "コイヌネランド 10話を ぜんぶ クリア", "e_kn10", 6000], ["t_wn_all", "ワンコロランド 全制覇！", "ワンコロランド 10話を ぜんぶ クリア", "e_wn10", 9000], ["t_us_all", "ウサウサランド 完全制覇！", "ウサウサランド 10話を ぜんぶ クリア", "e_us10", 14000]].forEach(([id, n, d, k, g]) => {
        const t = {id, n, d, f:F(k), g}; TQ_TITLES.push(t); TQ_TITLE_BY[id] = t;
    });
    const all = {id:"t_ld_all", n:"テーマパーク マスター", d:"3つの ランドを ぜんぶ クリア", f:() => !!(G.S.f.e_kn10 && G.S.f.e_wn10 && G.S.f.e_us10), g:20000}; TQ_TITLES.push(all); TQ_TITLE_BY[all.id] = all;
    const _obj = tqObjective;
    window.tqObjective = function(){
        const r = _obj(), f = G.S.f;
        if(f.e_future){
            for(let i = 1; i <= 10; i++) if(!f["e_kn" + i]) return "本編：コイヌネランド 第" + i + "話『" + LD_EPS.kn[i - 1].title + "』へ（ゲート）";
        }
        return r;
    };
    Object.keys(RPG_EV).filter((k) => /^(kn|wn|us)\d/.test(k)).forEach((k) => {
        const walk = (a) => { if(!Array.isArray(a)) return; if(a[0] === "say" && typeof a[1] === "string" && a[1] && !TQ_PORTRAIT_LOOK[a[1]]) yPortrait(a[1]); a.forEach(walk); };
        walk(RPG_EV[k]);
    });

    // ---- 隠しコード（リプレイ・チート）----
    const isLdFlag = (k) => /^(e_)?(kn|wn|us)\d/.test(k) || /^(kn|wn|us)_started$/.test(k) || /^e_(kn|wn|us)_all$/.test(k);
    const _rf = window.tqReplayFlags;
    window.tqReplayFlags = function(){ return _rf.apply(this, arguments).filter((k) => !isLdFlag(k)); };
    LANDS.forEach(([land, label]) => {
        const nm = {kn:"コイヌネランド", wn:"ワンコロランド", us:"ウサウサランド"}[land];
        for(let n = 1; n <= 10; n++) TQ_REPLAYS.push({id:"rp_" + land + String(n).padStart(2, "0"), n:"🎡 " + nm + " 第" + n + "話（クリア前まで）", era:land + n, lv:LV(land, n)});
    });
    const base = {kn:42, wn:52, us:62};
    Object.keys(base).forEach((land) => { for(let i = 1; i <= 10; i++) TQ_WARP_IDS[base[land] + i - 1] = land + i; });
    const setLand = (S, land, upto) => { for(let i = 1; i <= upto; i++) S.f["e_" + land + i] = 1; if(upto > 0) S.f[land + "_started"] = 1; if(upto >= 10) S.f["e_" + land + "_all"] = 1; };
    const _rs = window.tqReplayStart;
    window.tqReplayStart = function(id){
        const r = _rs.apply(this, arguments);
        const m = /^rp_(kn|wn|us)(\d+)$/.exec(id);
        if(r && r.ok && m && G.S){
            const land = m[1], n = parseInt(m[2], 10), f = G.S.f;
            f.e_future = 1;
            if(land !== "kn") setLand(G.S, "kn", 10);
            setLand(G.S, land, n - 1);
            tqAutoSave(); render();
        }
        return r;
    };
    const _ac = _tqApplyBase;
    _tqApplyBase = function(raw){
        const f = tqFindCheat(raw);
        if(!f || !/^y_c(1[7-9]|2[0-3])$/.test(f.id) || !G.S) return _ac.apply(this, arguments);
        const S = G.S; let msg = "";
        const pick = (land) => { const n = f.nums[0]; if(!(n >= 0 && n <= 10)) return null; S.f.e_future = 1; if(land !== "kn") setLand(S, "kn", 10); setLand(S, land, n); return n; };
        switch(f.id){
            case "y_c17": { S.f.e_future = 1; ["kn", "wn", "us"].forEach((l) => setLand(S, l, 10)); msg = "コイヌネ・ワンコロ・ウサウサの 30話を ぜんぶ クリア扱いに した。"; break; }
            case "y_c18": { S.f.e_future = 1; setLand(S, "kn", 10); msg = "コイヌネランドを クリア扱いに した。ワンコロ・ウサウサが ひらいたよ！"; break; }
            case "y_c19": { const n = pick("kn"); if(n === null) return {ok:false, msg:"0〜10 を 指定してね。"}; msg = "コイヌネランド 第" + n + "話まで クリア扱いに した。"; break; }
            case "y_c20": { const n = pick("wn"); if(n === null) return {ok:false, msg:"0〜10 を 指定してね。"}; msg = "ワンコロランド 第" + n + "話まで クリア扱いに した。"; break; }
            case "y_c21": { const n = pick("us"); if(n === null) return {ok:false, msg:"0〜10 を 指定してね。"}; msg = "ウサウサランド 第" + n + "話まで クリア扱いに した。"; break; }
            default: return _ac.apply(this, arguments);
        }
        try{ tqTitleCheck(true); }catch(_e){}
        tqAutoSave(); return {ok:true, msg};
    };
})();


/* ==== game/sub.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[50]=1;
"use strict";
// ===== 本編 Map1〜10 の クリア後に ひらく 任意サブストーリー（9作品・各10話＝合計90話。前編5話＋後編5話）=====
//   ssa〜ssj ＝ Map1〜10。 LDX（ld.js）を そのまま つかう。
const SUB_MAPS = [  // key, 親のMap(ゲートID), 本編の おすすめLv, 話数, 名前
    ["ssa", "sendai", 1, 10, "コード・オブ・デスティニー"],
    ["ssb", "tokyo", 3, 10, "リプレイワールド"],
    ["ssc", "white", 10, 10, "人生2周目"],
    ["sse", "labn", 20, 10, "楽しい時ほど、大さんじ！？"],
    ["ssf", "n8", 28, 10, "人生おにハードモード"],
    ["ssg", "n9", 33, 10, "職業せんたく"],
    ["ssh", "n10", 38, 10, "デビルバイト"],
    ["ssi", "n11", 43, 10, "うそつきは うそはるの はじまり"],
    ["ssj", "future", 48, 10, "余命7日間の 彼女"]
];
SUB_MAPS.forEach((s) => { LD_EPS[s[0]] = []; LD_AREA[s[0]] = s[4]; });
// 20話ぶん書いてあった 3作品（ssa・ssb・ssc）は、2話ずつ ひとつに まとめて 10話（前編5話＋後編5話）にする。
// そのぶん 1話の長さ（場面・たたかい・ごほうび）は 2倍になる。ファイルは 書いたまま（20話ぶん）で、ここで まとめる。
const SUB_MERGE = {ssa:20, ssb:20, ssc:20};
const SUB_Q = {};
// その話の おすすめレベルを きめる（Map の おすすめ + 2 から じわじわ 上がる）。total＝もとの 話数
function SBlvT(key, n, total){
    const s = SUB_MAPS.find((x) => x[0] === key), lo = s[2] + 2, span = total >= 20 ? 14 : 8;
    return Math.min(99, lo + Math.round((n - 1) * span / (total - 1)));
}
// 10話に まとめたあとの 話数 n（1〜10）の おすすめレベル。もとが 20話の作品は、2話ぶんの 真ん中あたりを とる
function SBlv(key, n){
    const s = SUB_MAPS.find((x) => x[0] === key);
    return SUB_MERGE[key] ? SBlvT(key, n * 2, SUB_MERGE[key]) : SBlvT(key, n, s[3]);
}
// SB(キー, 話, {…LDX と おなじ（lvは じどう）})
function SB(key, n, c){
    const s = SUB_MAPS.find((x) => x[0] === key);
    if(SUB_MERGE[key]){                                          // 20話ぶんを ためて、20話目で まとめて 10話にする
        (SUB_Q[key] = SUB_Q[key] || [])[n - 1] = c;
        if(n < SUB_MERGE[key]) return;
        const q = SUB_Q[key], half = q.length / 2;
        for(let k = 1; k <= half; k++){
            const a = q[2 * k - 2], b = q[2 * k - 1];
            const pre = (t) => String(t || "").replace(/^(前編|後編)[①-⑳0-9]*\s*/, "");   // 「前編① 」の かざりは つけなおす
            const part = k <= half / 2 ? "前編" : "後編", no = "①②③④⑤⑥⑦⑧⑨⑩"[(k - 1) % (half / 2)];
            const base = Math.round((1500 + SBlvT(key, 2 * k - 1, 20) * 160 + (2 * k - 1) * 120 + 1500 + SBlvT(key, 2 * k, 20) * 160 + (2 * k) * 120) / 2) * 2;
            const m = Object.assign({}, a, {
                title: part + no + " " + pre(a.title) + "／" + pre(b.title),
                area: LD_AREA[key] + " " + part,
                steps: a.steps.concat(b.steps),
                talks: (a.talks || []).concat(b.talks || []),
                fin: b.fin, after: b.after || a.after,
                learn: a.learn === b.learn ? a.learn : [a.learn, b.learn].filter(Boolean).join("　／　"),
                base: base,
                lv: SBlv(key, k), last: k === s[3]
            });
            LDX(key, k, m);
        }
        return;
    }
    LDX(key, n, Object.assign({lv:SBlv(key, n), last:n === s[3], base:1500 + SBlv(key, n) * 160 + n * 120}, c));
}
// 人を おく 場所を ふやす（1話に 場面が 8つ ちかく になるので）。下の はしは どの 場面も 歩ける
Y_SLOT.push([1, 10], [11, 10], [13, 10], [15, 10]);
// ---- むかしの セーブデータを 10話に あわせる（20話ぶんの 進み具合を 2話ずつ まとめる）----
window.tqSubMigrate = function(S){
    try{
        if(!S || !S.f || S.f.ss_m10) return;
        Object.keys(SUB_MERGE).forEach((key) => {
            const old = (n) => !!S.f["e_" + key + n], total = SUB_MERGE[key], half = total / 2;
            const done = []; for(let k = 1; k <= half; k++) done[k] = old(2 * k - 1) && old(2 * k);
            const wasAll = !!S.f["e_" + key + "_all"];
            for(let n = 1; n <= total; n++){
                delete S.f["e_" + key + n]; delete S.f[key + n + "_in"];
                for(let i = 1; i <= 10; i++) delete S.f[key + n + "s" + i];
            }
            for(let k = 1; k <= half; k++) if(done[k] || wasAll) S.f["e_" + key + k] = 1;
            if(wasAll || done.slice(1).every(Boolean)) S.f["e_" + key + "_all"] = 1; else delete S.f["e_" + key + "_all"];
            const m = new RegExp("^" + key + "(\\d+)$").exec(S.map || "");     // 消えた 話の マップに いたら、まとめた 話の 入口へ
            if(m && parseInt(m[1], 10) > half || m && !RPG_MAPS[S.map]){ S.map = key + Math.min(half, Math.ceil(parseInt(m[1], 10) / 2)); S.x = S.px = 9; S.y = S.py = 10; S.dir = "up"; }
        });
        S.f.ss_m10 = 1;
    }catch(_e){}
};
// 作品の さいごの ごほうび
SUB_MAPS.forEach((s, i) => {
    RPG_EV[s[0] + "_final"] = YKL(["語り手｜『" + s[4] + "』の " + s[3] + "話は ぜんぶ おしまい。", "語り手｜さいごまで 見てくれて ありがとう！ きみの ぼうけんに、とっておきの ごほうびを おくるよ。"])
        .concat([["gold", 30000 + i * 6000], ["item", "special", 5 + i], ["item", "omamori", 2 + (i >> 1)], rpgN((30000 + i * 6000).toLocaleString() + "G と スペシャルおにぎり " + (5 + i) + "こ・ふっかつのおまもり " + (2 + (i >> 1)) + "こを てにいれた！"), ["set", "e_" + s[0] + "_all"], ["run", "lab_ret_go"]]);
});
Object.assign(Y_PEOPLE, {
    "蒼太":["#f6d2b0", "#1b1b27", "short", "#2f6fdc", "#374151", "glasses"], "健斗":["#f6d2b0", "#3a2a1a", "spike", "#f2994a", "#374151", "none"],
    "美咲":["#f9d9bd", "#1b1b27", "long", "#d65a8a", "#4b3a6b", "none"], "竜也":["#f3cfae", "#222", "short", "#3b4a66", "#2b2b3a", "none"],
    "さえこ":["#f9d9bd", "#2a1a14", "long", "#2b2b3a", "#2b2b3a", "none"], "龍之介":["#f0d2b4", "#cfcfcf", "short", "#556", "#444", "glasses"]
});
// 戦う 相手（おすすめレベルと 画像は じどうで きまる）
const SBF = (key, n, name, emo, say, mult) => ldFoe(key + n + "_f", name, emo, key + n + "_boss", SUB_MERGE[key] ? SBlvT(key, n, SUB_MERGE[key]) : SBlv(key, n),
    [[name.split(" ").pop().slice(0, 4) + "アタック", 0, 1, 1.2], ["ぐるぐる ノイズ", 1, 0.7, 0.9], ["どっしり ジャンプ", 0, 0.6, 1.6]], (name + "「" + (say || "いい 勝負だったよ！") + "」"), mult || 1.1);


/* ==== game/ssa.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[51]=1;
"use strict";
// ===== Map1 サブ：コード・オブ・デスティニー（アプリ開発の善悪・全20話）=====
SB("ssa", 1, {title:"始まりの 終わり", theme:"night", bgm:"town",
    intro:["語り手｜ここは 夜の アカリ市。 小さな アパートで、28さいの フリーランス・エンジニア 蒼太は 落ちこんでいた。", "語り手｜アプリを 作る 仕事が うまくいかず、10社目の 不採用通知が とどいたんだ。"],
    steps:[
        LP("蒼太", "また 不採用", ["蒼太｜また 不採用か…。", "蒼太｜俺の 人生って、なんだったんだろう。", "（部屋には うまく いかなかった アプリの コードや 山づみの 請求書。）"]),
        LQ("蒼太", "なぞの 通知", ["（そのとき、スマホに 見知らぬ 通知が とどいた。）", "『あなたの 人生を 変える アプリを 開発しませんか？ ―― 運命開発株式会社』", "蒼太｜怪しい…。 でも…。"],
            [["知らない 会社から うまい 話が 来たとき、まず どうするのが いい？", "家族や 友だちに 相談して、会社の ことを ちゃんと 調べる", ["すぐに 『はい』を おす", "通知の リンクを 友だちにも 送りまくる"], "語り手｜うまい 話ほど、先に 調べるのが 大事だよ。", "語り手｜そう。 相談と 確認が 身を まもるよ。（でも 蒼太は… はいを おしてしまった。）"]]),
        LP("語り手", "部屋が まっくらに", ["（画面が まっくらになり、『蒼太さん、あなたは 選ばれました』と メッセージが 出た。）", "（その しゅんかん、部屋の でんきが ぜんぶ 消えた。 蒼太の 運命が 大きく 動き はじめた…！）"]),
    ],
    talks:[["となりの 住人", ["となりの 住人｜夜中に 停電かな？ ブレーカーを 見てみようか。", "となりの 住人｜怪しい メッセージは 開かない のが いちばんだよ。"]]],
    fin:["語り手｜蒼太の 長い 物語が はじまったね。", "語り手｜つぎは 見知らぬ 場所で 目を さます 蒼太…。"],
    learn:"知らない 人からの 『うまい話』は まず 相談して、くわしく 調べよう。"});

SB("ssa", 2, {title:"なぞの クライアント", theme:"lab", bgm:"town",
    intro:["語り手｜朝。 蒼太は 見知らぬ 超高層ビルの 最上階で 目を さました。", "語り手｜目の前には 黒い スーツの 女性が 立っている。"],
    steps:[
        LP("さえこ", "運命開発の しゃちょう", ["さえこ｜おはようございます、蒼太さん。 私は さえこ。 運命開発株式会社の 代表です。", "蒼太｜ここは どこですか？ 俺、なにも 契約して いないのに…。", "さえこ｜昨夜 あなたが 『はい』を おした 時点で 成立しています。"]),
        LQ("蒼太", "契約書を 読もう", ["（さえこは 一枚の 書類を わたした。 雇用契約書。 月給は とんでもない 金額だ！）", "蒼太｜500万円…！？ これ、本当ですか？"],
            [["契約書を 受け取ったとき、いちばん 大切な ことは？", "内容を さいごまで よく 読んで、わからない ところは 質問する", ["金額だけ 見て すぐ サインする", "読まずに 破りすてる"], "蒼太｜小さな 文字にも 大事な ことが 書いてあるかも。 ちゃんと 読もう。", "蒼太｜そうだ。 読んで 質問してから 決めよう。"]]),
        LP("さえこ", "新しい アプリ", ["さえこ｜つくって もらう アプリは 『Destiny Rewrite（運命書き換え）』。", "さえこ｜ユーザーの 過去の 選択を 選びなおして、未来を 変える アプリです。", "蒼太｜そんなこと、できるわけ…。 でも、倫理的に 問題が あるんじゃ？", "さえこ｜だからこそ、失敗を 知る あなたに お願いするの。"]),
        LP("蒼太", "決心", ["蒼太｜元の 生活に もどるか、ここで 開発するか…。", "蒼太｜わかりました。 やります。", "さえこ｜素晴らしい。 では、はじめましょう。"]),
    ],
    talks:[["受付ロボ", ["受付ロボ｜ピピッ！ ようこそ 運命開発へ。", "受付ロボ｜サインする 前に 契約書は よく 読んでね。"]]],
    fin:["語り手｜蒼太は 開発を 引き受けた。 でも『読んで 質問する』ことは わすれずに ね。", "語り手｜つぎは 開発チームとの 出会い。"],
    learn:"契約書は 最後まで 読んで、わからない ところは 質問しよう。"});

SB("ssa", 3, {title:"開発チームとの 出会い", theme:"lab", bgm:"town",
    intro:["語り手｜さえこが 蒼太を 別の 部屋に 案内した。", "語り手｜そこには 3人の エンジニアが 作業中。 蒼太の 新しい チームメンバーだ。"],
    steps:[
        LP("健斗", "明るい 健斗", ["健斗｜初めまして！ 俺は 健斗、バックエンド担当！", "健斗｜時間を 操る アプリなんて ロマンあるじゃん！ 一緒に がんばろう！"]),
        LP("美咲", "クールな 美咲", ["美咲｜私は 美咲。 フロントエンド担当よ。", "美咲｜期待は してないけど。", "蒼太｜（ちょっと 冷たいな…。）"]),
        LP("竜也", "だまりこむ 竜也", ["竜也｜竜也。 セキュリティ担当だ。", "竜也｜俺には 参加する 理由が ある。 それは 言えない。", "蒼太｜（なにか 事情が ありそうだ…。）"]),
        LQ("蒼太", "チームで 大切な こと", ["蒼太｜みんな なんで この プロジェクトに 参加したの？", "健斗｜面白そうだから！", "美咲｜お金のため。", "竜也｜……。"],
            [["チームで 仕事を する とき、はじめに すると いいことは？", "おたがいの 考えや 得意な ことを 聞いて、役わりを 分ける", ["自分のやり方を 押しつける", "だれとも 話さず 作業する"], "蒼太｜まず みんなの 得意を 聞いてみよう。", "蒼太｜そうだね。 役わりを 分けると 進めやすい。 6か月、よろしく！"]]),
    ],
    talks:[["オフィスの 猫", ["オフィスの 猫｜にゃーん（ここの コーヒーは おいしいよ）", "オフィスの 猫｜チームは 話し合いから はじまるにゃ。"]]],
    fin:["語り手｜4人の チームが そろった。 でも それぞれ ひみつを かかえているみたい…。", "語り手｜つぎは 開発計画づくり！"],
    learn:"チームの はじめは、おたがいの 考えと 得意を 知ることから。"});

SB("ssa", 4, {title:"4つの フェーズ", theme:"lab", bgm:"field",
    intro:["語り手｜さえこが 開発計画を 見せた。 全部で 6か月、4つの フェーズに 分かれている。", "語り手｜蒼太は 計画を チームに 分担する。"],
    steps:[
        LP("さえこ", "開発計画", ["さえこ｜第1フェーズ（1か月）基本機能。 第2フェーズ（2か月）時空間システム。", "さえこ｜第3フェーズ（2か月）安全機能。 第4フェーズ（1か月）テストと デバッグ。", "蒼太｜6か月、かなり タイトですね。", "さえこ｜時間が ないんです。 世界を 救うために 必要な アプリなの。"]),
        LQ("蒼太", "分担を きめよう", ["蒼太｜プロジェクト全体の 管理と 設計は 俺。 健斗は バックエンド、美咲は フロント、竜也は セキュリティ。"],
            [["大きな 仕事を すすめる ときの コツは？", "小さく 分けて、だれが いつまでに 何を するか 決める", ["ぜんぶ 一人で やる", "だれも 担当を 決めない"], "健斗｜小さく 分けた 方が 迷わないよね？", "蒼太｜そう。 分担して 見える化しよう。"]]),
        LP("竜也", "セキュリティが 第一", ["竜也｜このアプリが 悪用されたら 世界が 崩れる。", "竜也｜セキュリティは 最初から 考えるべきだ。", "美咲｜便利でも 安全じゃなきゃ 意味ないよね。"]),
        LP("健斗", "さあ 始動！", ["健斗｜いくぞー！ フェーズ1、スタート！", "蒼太｜よし、まずは 基本の UIから 作ろう！"]),
    ],
    talks:[["ホワイトボードの ペン", ["ホワイトボードの ペン｜きゅきゅっ！ 計画は 見える化すると 迷わないよ。", "ホワイトボードの ペン｜書いて 消して、何度でも やり直せるよ。"]]],
    fin:["語り手｜計画と 分担が きまった。 つぎは 最初の 大きな トラブル！", "語り手｜その名も 『タイムライン・パラドックス』…！"],
    learn:"大きな 仕事は 小さく 分けて 分担。 安全は 最初から 考えよう。"});

SB("ssa", 5, {title:"タイムライン・パラドックス", theme:"lab", bgm:"cave",
    intro:["語り手｜開発から 1週間。 健斗が 青い顔で さけんだ。", "健斗｜蒼太さん、大変だよ！ 時空間データベースに つながらない！"],
    steps:[
        LP("健斗", "エラー画面", ["（画面には 『ERROR: TIMELINE_PARADOX_DETECTED』の 文字。）", "健斗｜過去を 変えると、つじつまが 合わなくなるみたい。"]),
        LQ("健斗", "ラーメン？ カレー？", ["健斗｜たとえば 『昨日 ラーメンを 食べた』を 『カレーを 食べた』に 変えたとする。", "健斗｜でも ラーメン屋さんの 店主は 『昨日 ラーメンを 売った』って 覚えてる。"],
            [["つじつまが 合わなくなる 問題を 直すには？", "関係する 人の 記憶や 記録も ぜんぶ いっしょに 直す", ["矛盾は 気にしない", "元の データを 消す"], "蒼太｜一部だけ 直しても つじつまは 合わない。 ぜんぶ 見直そう。", "蒼太｜そう！ 全部 そろえて 直す『矛盾解消システム』を 作ろう！"]]),
        LB("バグくん", "バグくんを 退治！", ["（徹夜で 作業していたら、画面から ちいさな『バグくん』が とびだしてきた！）", "バグくん｜ぴこぴこ！ ぼくを 見つけて ごらん〜！"], SBF("ssa", 5, "バグくん", "🧩", "ぴこっ！ 見つかっちゃった！"),
            ["健斗｜やった！ バグくんを つかまえたぞ！", "美咲｜認めるわ。 あなた たち、やるじゃない。", "竜也｜次の フェーズに 進もう。"]),
    ],
    talks:[["デバッグ猫", ["デバッグ猫｜バグは 悪い ものじゃ ないにゃ。 直す チャンスだにゃ。", "デバッグ猫｜原因を 1つずつ 探すのが コツにゃ。"]]],
    fin:["語り手｜3日間の 徹夜で『矛盾解消システム』が 完成。 第1フェーズ クリア！", "語り手｜つぎは 時空間操作システム。 大きな 機械が 待っている…。"],
    learn:"問題は 原因を 分けて 1つずつ 直す。 徹夜は 無理せず、休むことも 大切。"});

SB("ssa", 6, {title:"量子コンピュータの 部屋", theme:"lab", bgm:"cave",
    intro:["語り手｜第2フェーズ。 さえこが 地下の 研究室へ 蒼太を 案内した。", "語り手｜部屋じゅうを 占める 巨大な 機械。 これが 『量子コンピュータ』だ。"],
    steps:[
        LP("さえこ", "巨大な 機械", ["さえこ｜この 機械は 無数の 並行世界を 同時に 計算できます。", "蒼太｜選択するたびに 世界が 分かれるっていう 理論ですよね。", "さえこ｜その中から、ユーザーが 望む 世界を 選び出すの。"]),
        LQ("蒼太", "他の 世界の 人は？", ["蒼太｜でも、他の 世界の 人たちは どうなるんですか？", "さえこ｜それは 考えないでください。 倫理的な ことは 私が 責任を 持ちます。"],
            [["大きな 技術を 作るとき、倫理（人への 影響）は どう 考える？", "作る 人も 責任を もって、人への 影響を 考える", ["偉い人が 責任を とるから 考えなくていい", "お金が もうかれば 気にしない"], "蒼太｜『考えるな』は おかしい。 自分でも 考えなきゃ。", "蒼太｜そう。 作る人も 責任を もつ。 それが エンジニアの 仕事だ。"]]),
        LP("健斗", "不安な 気持ち", ["健斗｜蒼太さん、どうだった？", "蒼太｜なんでもない。 作業を 続けよう。", "（でも 蒼太の 心には、大きな 不安が 芽生えていた。）"]),
    ],
    talks:[["研究室の ロボ", ["研究室の ロボ｜ブーン… ブーン… 計算中。", "研究室の ロボ｜ぼくは 考える ことを やめない ロボです。"]]],
    fin:["語り手｜蒼太は 『とんでもない ものを 作ろうとして いるのかも』と 感じはじめた。", "語り手｜つぎは チームメンバーの ひみつが 明かされる。"],
    learn:"技術には 責任が ともなう。 作る人も 人への 影響を 考えよう。"});

SB("ssa", 7, {title:"美咲の 過去", theme:"night", bgm:"town",
    intro:["語り手｜ある夜。 オフィスには 蒼太と 美咲だけが 残っていた。", "語り手｜美咲は ふだんの 冷たい 態度が うそみたいに 静かだった。"],
    steps:[
        LP("蒼太", "遅くまで 残業", ["蒼太｜美咲さんも 遅くまで 大変だね。", "美咲｜別に。", "蒼太｜ねえ、なんで このプロジェクトに 参加したの？"]),
        LP("美咲", "美咲の 後悔", ["美咲｜私ね、5年前に 妹と けんかしたまま、遠くへ 引っ越すのを 見送れなかったの。", "美咲｜それから ずっと 会えなくて、後悔してる。 毎日 あの日を 思い出す。", "美咲｜だから このアプリで 過去を やり直して 妹に あやまりたい。"]),
        LQ("蒼太", "どう 声をかける？", ["蒼太｜美咲さん…。", "美咲｜蒼太さん、お願い。 このアプリを 完成させて。"],
            [["後悔している 友だちに かける 言葉は？", "気持ちを 受けとめて、今から できる ことを いっしょに 考える", ["もう 過ぎたことだから 忘れなよ", "あなたが 悪かったんだね"], "蒼太｜責めたり 無理に 忘れさせたり しない方が いいね。", "蒼太｜そうだ。 今から できる ことを いっしょに 考えよう。 妹さんに 手紙を 書くのも 一つの 方法だよ。"]]),
    ],
    talks:[["コーヒーメーカー", ["コーヒーメーカー｜ごぽごぽ… 夜は あったかい 飲み物を どうぞ。", "コーヒーメーカー｜話すだけで 心が 軽くなる ことも あるよ。"]]],
    fin:["語り手｜美咲の 痛みを 知った 蒼太。 でも 過去を 変えるだけが 解決じゃ ないよね。", "語り手｜つぎは 竜也の ひみつ。"],
    learn:"後悔は 責めずに 受けとめる。 今から できる ことを 考えよう。"});

SB("ssa", 8, {title:"竜也の ひみつ", theme:"night", bgm:"cave",
    intro:["語り手｜竜也が 夜な夜な オフィスに 残って 何かを 調べている。", "語り手｜ある日、蒼太は 竜也の パソコンを 偶然 見てしまった。"],
    steps:[
        LP("蒼太", "見てしまった 画面", ["（画面には 他人の 個人情報が のった 記録が ずらり。）", "蒼太｜これって 他人の 情報を 勝手に のぞいてる…？", "蒼太｜竜也さん、どういうこと？"]),
        LP("竜也", "竜也の 告白", ["竜也｜見られたか。 実は 俺は 元 警察官だ。", "竜也｜5年前に 大事な ペンダントと、家族との 思い出を うしなった。 それを 取りもどしたくて…。", "竜也｜勝手に 調べるのは 悪い ことだと わかってる。 でも 俺には これしかなかった。"]),
        LQ("蒼太", "のぞき見は だめ", ["蒼太｜竜也さん、それでも 勝手に 人の 情報を 見るのは だめだ。"],
            [["他人の 個人情報を 勝手に 調べる ことは？", "目的が よくても 許されない。 ルールに そって 助けを 求める", ["理由が あれば 調べても いい", "ばれなければ 問題ない"], "蒼太｜個人情報は その人の 大事な もの。 勝手に 見ちゃだめだよ。", "竜也｜…そうだな。 ちゃんと 正式に 相談する ことにする。 ありがとう、蒼太。"]]),
        LB("ログ警備ロボ", "ログ警備ロボ", ["（そのとき アラームが 鳴って、警備ロボが 登場！）", "ログ警備ロボ｜ピピッ！ 不正アクセス検知！ 力くらべで 確認します！"], SBF("ssa", 8, "ログ警備ロボ", "🤖", "ピピッ！ 確認 完了。"),
            ["竜也｜助かった。 これからは 正しいやり方で 探すよ。"]),
    ],
    talks:[["警備ロボ2号", ["警備ロボ2号｜個人情報は 宝物。 勝手に 見るのは NGだよ。", "警備ロボ2号｜困ったら 相談窓口へ 行こう。"]]],
    fin:["語り手｜竜也は まちがいを 認めて、ただしい 方法を 選んだ。", "語り手｜つぎは 健斗に 異変が…！"],
    learn:"他人の 個人情報は 勝手に 見ない。 困ったら 正式に 相談しよう。"});

SB("ssa", 9, {title:"健斗の 告白", theme:"school", bgm:"town",
    intro:["語り手｜第2フェーズの 終わり。 健斗が 作業中に ふらふらと 座りこんだ。", "語り手｜蒼太は あわてて 医務室へ つれていく。"],
    steps:[
        LP("蒼太", "健斗が たおれた", ["蒼太｜健斗！ 大丈夫か！？", "（健斗は 医務室で 休み、お医者さんが 診てくれた。）", "お医者さん｜過労と、むずかしい 病気の 治療が 必要ですね。 ゆっくり 休めば よくなりますよ。"]),
        LP("健斗", "かくしていた こと", ["健斗｜蒼太さん、ごめんね。 心配かけて。", "蒼太｜なんで だまってたんだよ！", "健斗｜言ったら プロジェクトから 外されると 思って…。"]),
        LQ("蒼太", "ちゃんと 休もう", ["健斗｜俺、アプリを 完成させたい。 病気が よくなる 未来を 信じてるから。"],
            [["体調が わるい ときは どうする？", "正直に 伝えて、しっかり 休んで 治療する", ["かくして 無理をつづける", "周りには ぜったい 言わない"], "蒼太｜無理して かくすと もっと 悪くなるよ。 正直に 話そう。", "蒼太｜そうだ。 休むのも 仕事のうち。 みんなで 助け合うから 安心して。"]]),
        LP("美咲", "みんなで 支える", ["美咲｜健斗の 分は 私たちで カバーするわ。", "竜也｜ああ。 チームだからな。", "健斗｜みんな ありがとう！"]),
    ],
    talks:[["看護ロボ", ["看護ロボ｜ぴこぴこ。 水分と 休養を とってくださいね。", "看護ロボ｜つらい ときは 『つらい』と 言って いいんですよ。"]]],
    fin:["語り手｜健斗は 休養して 治療する ことに。 チームの きずなが 強まったね。", "語り手｜つぎの フェーズは 安全機能。"],
    learn:"体調が わるい ときは 正直に 伝えて 休もう。 助け合うのが チーム。"});

SB("ssa", 10, {title:"安全機能を つくろう", theme:"lab", bgm:"field",
    intro:["語り手｜第3フェーズは 『安全機能』。 アプリが 悪用されないための 大切な 仕組みだ。", "語り手｜チームで 話し合って ルールを 決める。"],
    steps:[
        LQ("蒼太", "変更できる 範囲", ["蒼太｜まず 変えられる 過去の 範囲を 制限しよう。 自分自身の 選択だけ。 他人の 人生は 変えられないように。"],
            [["アプリが 悪用されない ために、まず 大切な ことは？", "使える 範囲と 回数に ルールを つくる", ["制限なしで 自由に つかえる", "ルールは 利用者に まかせる"], "竜也｜制限が ないと 悪用される 可能性が 高いよ。", "竜也｜そうだ。 範囲と 回数を 決めよう。"]]),
        LP("健斗", "回数制限", ["蒼太｜変更回数にも 制限を かけよう。 一人 生涯 3回まで。", "健斗｜3回、少なくない？", "蒼太｜多すぎると 世界が 混乱する。 本当に 大事な 選択だけ 変えられる 方が いいんだ。"]),
        LB("テストくん", "セキュリティ テスト", ["（テスト用の 『テストくん』が あらわれて、安全機能を 試しに きた！）", "テストくん｜ぴっぴ！ 破れるもんなら 破ってみて〜！"], SBF("ssa", 10, "テストくん", "🧪", "ぴっぴ！ 合格だよ！"),
            ["美咲｜安全機能、バッチリね！", "蒼太｜よし、第3フェーズ 完成まで あと少し。"]),
        LP("さえこ", "突然の 命令", ["（そこへ さえこが 突然 現れた。）", "さえこ｜蒼太さん、安全機能を 削除してください。", "蒼太｜え？ 何を 言ってるんですか！？"]),
    ],
    talks:[["テスト用 ドア", ["テスト用 ドア｜ぎぃ… ルールが あるから 安全だよ。", "テスト用 ドア｜便利さだけを 追うと、危なくなるよ。"]]],
    fin:["語り手｜安全機能は 完成。 でも さえこは それを 削除しろと 言いはじめた…。", "語り手｜つぎは さえこの 本当の 目的が 明らかに！"],
    learn:"便利な ものほど、使える 範囲や 回数の ルールが 大切。"});

SB("ssa", 11, {title:"さえこの 本当の 目的", theme:"stage", bgm:"castle",
    intro:["語り手｜安全機能の 削除を 命じた さえこ。 蒼太は 理由を 問いただした。", "語り手｜さえこは 重い 口を 開く。"],
    steps:[
        LP("さえこ", "真の 目的", ["さえこ｜実は このアプリは 世界を 救う ためでは ありません。", "さえこ｜世界を 白紙に もどして、ぜんぶ 作り直す ためです。", "蒼太｜白紙に…？"]),
        LQ("蒼太", "反対する 勇気", ["さえこ｜この世界は もう 救いようが ないんです。", "蒼太｜そんなこと、許されるわけ ない！"],
            [["『世界を 白紙に もどす』と 言われたら どうする？", "大勢の 人に 影響が 出るから、はっきり 反対して 止める", ["えらい人が 決めたから 従う", "だまって 見て見ぬふりを する"], "蒼太｜大勢の 暮らしを 勝手に なくすなんて だめだ。", "蒼太｜そう！ おかしいと 思ったら 声を 上げよう。"]]),
        LB("ロボ警備隊長", "ロボ警備隊長", ["（さえこが 手を あげると ロボ警備隊長が 出てきた！）", "ロボ警備隊長｜ここから 先は 通せません！ 勝負です！"], SBF("ssa", 11, "ロボ警備隊長", "🛡️", "ガシャン！ お見事！"),
            ["蒼太｜みんなに この事実を 伝えないと！"]),
    ],
    talks:[["パトロールロボ", ["パトロールロボ｜ピポピポ。 おかしいと 思ったら 『おかしい』と 言おう。", "パトロールロボ｜勇気は 小さな 声から はじまるよ。"]]],
    fin:["語り手｜蒼太は 『世界を 白紙に もどす』計画に 反対する 決意を した。", "語り手｜つぎは 世界の真実を 知る場面。"],
    learn:"おかしいと 思ったら 勇気を もって 反対しよう。"});

SB("ssa", 12, {title:"世界の 真実", theme:"stage", bgm:"castle",
    intro:["語り手｜さえこは 蒼太を 巨大な モニターの 部屋へ 連れていった。", "語り手｜そこには 世界じゅうの ニュースが 映し出されている。"],
    steps:[
        LP("さえこ", "ニュースの 山", ["さえこ｜見てください。 この世界の ようすを。", "さえこ｜環境の 問題、争い、食べ物の 不足…。 人類は もう 限界なのです。", "蒼太｜でも それと この アプリに 何の 関係が？"]),
        LQ("蒼太", "ニュースの 見かた", ["さえこ｜悪い ニュースばかりでしょう？ だから ぜんぶ やり直すのです。"],
            [["悪い ニュースばかり 見て 『世界は もうだめだ』と 思ったら？", "いい ニュースも あるはず。 事実を 広く 確かめて 冷静に 考える", ["悪い ニュースだけ 信じる", "ニュースは ぜんぶ ウソだと 決めつける"], "蒼太｜世の中には よい ことも たくさん あるはず。 広く 見よう。", "蒼太｜そう。 かたよった 情報だけで 判断しないように しよう。"]]),
        LP("さえこ", "運命開発の 正体", ["さえこ｜この 会社は、各国の えらい人たちが 集まって 作った 組織なの。", "さえこ｜蒼太さん、続けるか、ここから 出て行くか。", "蒼太｜（ここで 答えを 間違えたら、みんなが…。）"]),
        LP("蒼太", "決意", ["蒼太｜続けます。 でも、世界を 白紙に する ためには 使わせない。", "蒼太｜（みんなに 話さないと…！）"]),
    ],
    talks:[["ニュース画面", ["ニュース画面｜ピッ。 よい ニュースも あります。 ほら、助け合う 人たちの 話。", "ニュース画面｜大事なのは 広く 確かめること。"]]],
    fin:["語り手｜蒼太は チームに 真実を 伝える ことに。", "語り手｜つぎは 反撃の 作戦会議！"],
    learn:"悪い 情報だけで 判断せず、広く 確かめて 冷静に 考えよう。"});

SB("ssa", 13, {title:"みんなで 話そう", theme:"lab", bgm:"field",
    intro:["語り手｜蒼太は 開発室で、チームに すべてを 打ち明けた。", "語り手｜みんなは おどろき、迷う。"],
    steps:[
        LP("健斗", "マジかよ", ["健斗｜俺たち、利用されてたのか…。", "美咲｜でも、私は 妹に あやまりたい。", "竜也｜俺も 思い出を 取りもどしたい。"]),
        LQ("蒼太", "どうする？", ["蒼太｜アプリを 完成させたら 世界が 白紙に なる。 これだけは 止めたい。", "蒼太｜こっそり 裏口（バックドア）を 作って 俺たちだけで 使う…？"],
            [["こっそり 裏口を 作るか、正直に さえこに 伝えるか。 どちらが 正しい？", "正直に 伝えて、安全な 方法を 話し合って みんなで 決める", ["こっそり 裏口を 作って 隠す", "さえこの いうとおりに 従う"], "美咲｜こっそりは、あとで もっと 大きな トラブルに なるよ。", "蒼太｜そうだね。 正直に 話し合う 方が 結局 みんなの ためだ。"]]),
        LP("竜也", "チームで 決める", ["竜也｜俺も 賛成だ。 正直に いこう。", "健斗｜俺も！", "美咲｜私も。"]),
        LP("蒼太", "決まり！", ["蒼太｜じゃあ 安全機能は 残したまま、さえこに 見せて 説得しよう。", "（ところが さえこは すべてを 見ていた。 開発室に 監視カメラが あったのだ。）"]),
    ],
    talks:[["会議用 ホワイトボード", ["会議用 ホワイトボード｜かきかき。 意見が 分かれても、話し合えば 道は 開けるよ。", "会議用 ホワイトボード｜かくしごとは 後で 大きくなるよ。"]]],
    fin:["語り手｜チームは 正直に 話し合う ことに 決めた。", "語り手｜つぎは 監視と 説得の 場面。"],
    learn:"かくしごとより、正直な 話し合い。 みんなで 決めた ことは 強いよ。"});

SB("ssa", 14, {title:"監視と 説得", theme:"stage", bgm:"castle",
    intro:["語り手｜開発室に さえこが 現れた。", "さえこ｜あなたたち、何か かくして いますね。 全部 見ていましたよ。"],
    steps:[
        LQ("蒼太", "監視カメラ", ["さえこ｜このオフィスには カメラが あって、会話も 録音されています。", "健斗｜そんな…。"],
            [["オフィスで 社員に 知らせず 録音するのは？", "働く 人の プライバシーを 守るため、事前に ちゃんと 説明が 必要", ["会社の ものだから 自由に 録音していい", "バレなければ いい"], "美咲｜知らされずに 録音されたら 安心して 働けないよね。", "美咲｜そう。 監視や 録音は 事前に 説明して 同意が 必要。"]]),
        LP("さえこ", "取り引き", ["さえこ｜もう一度 チャンスを あげます。 素直に 完成させれば、あなたたちの 望みを 叶えましょう。", "美咲｜本当に…？", "さえこ｜ええ。 全員の 願いを 叶えます。"]),
        LQ("蒼太", "うまい 話", ["蒼太｜みんな、うまい 話に だまされるな！", "健斗｜でも…。"],
            [["『願いを 叶える』という 約束を 信じる 前に すべき ことは？", "約束が 本当か、証拠や 条件を たしかめる", ["すぐ 信じる", "相手に ぜんぶ まかせる"], "竜也｜条件も 証拠も 言わない 約束は 危ない。", "竜也｜そうだ。 口先だけの 約束は 信じない。"]]),
        LB("さえこの 手下ロボ", "手下ロボ", ["（さえこが 合図を すると 手下ロボが 登場した！）", "手下ロボ｜蒼太を 連れていきます！ 勝負！"], SBF("ssa", 14, "手下ロボ", "🤖", "ガガッ！ 負けました。"),
            ["蒼太｜みんな、ありがとう！", "（でも ロボは 次々と 出てくる。 蒼太は 別の 部屋へ つれていかれた…。）"]),
    ],
    talks:[["カメラの ロボ", ["カメラの ロボ｜ぴぴ。 録音する 時は 知らせてね。", "カメラの ロボ｜プライバシーは 大切な 権利だよ。"]]],
    fin:["語り手｜蒼太は 別の 部屋に 連れて いかれた。", "語り手｜そこで 出会ったのは…。"],
    learn:"監視や 録音は 事前に 説明が 必要。 うまい 約束は 証拠を 確かめよう。"});

SB("ssa", 15, {title:"龍之介との 出会い", theme:"night", bgm:"cave",
    intro:["語り手｜暗い 地下の 部屋で 蒼太は 目を さました。", "語り手｜そこに ひとりの 老人が 入ってきた。"],
    steps:[
        LP("龍之介", "創設者", ["龍之介｜やあ、蒼太くん。 私は 龍之介。 この 会社の 創設者だ。", "蒼太｜あなたも 世界を 白紙に するつもりですか？", "龍之介｜いいや。 私は 世界を 守りたい。 さえこは 暴走している。"]),
        LQ("蒼太", "信じていい？", ["龍之介｜私に 協力してほしい。 さえこを 止めるために。", "蒼太｜（でも 本当に 信じて いいのかな…。）"],
            [["初めて 会った 人から 『協力して』と 言われたら？", "話を 聞きつつ、本当か 少しずつ たしかめる", ["すぐ 全部 信じる", "話も 聞かず 無視する"], "蒼太｜相手の 話は 聞く。 でも 確かめる ことも 大事だ。", "蒼太｜そうだ。 少しずつ 確かめながら 信頼を 築こう。"]]),
        LP("龍之介", "逃がす", ["龍之介｜今から 君を 逃がす。 時間がない。", "蒼太｜なんで 俺を 信じるんですか？", "龍之介｜君の 目を 見れば わかる。 世界を 救いたいと 思っている目だ。"]),
        LP("蒼太", "開発室へ", ["蒼太｜ありがとうございます。 みんなを 助けに 行きます！"]),
    ],
    talks:[["地下の 灯り", ["地下の 灯り｜ぽわん… 暗い 時こそ 落ち着いて。", "地下の 灯り｜助けてくれる 人が いたら 感謝を 伝えよう。"]]],
    fin:["語り手｜蒼太は 協力者と 出会い、仲間の もとへ 向かう。", "語り手｜つぎは アプリの 奪還だ！"],
    learn:"助けを 受けるときは、相手を よく 見て 少しずつ 確かめよう。"});

SB("ssa", 16, {title:"アプリを 取りもどせ", theme:"lab", bgm:"castle",
    intro:["語り手｜開発室に もどると、健斗・美咲・竜也が 待っていた。", "語り手｜みんな さえこに 騙されて いたことに 気づいたと言う。"],
    steps:[
        LP("健斗", "再会", ["健斗｜蒼太さん！ 無事だったんだ！", "美咲｜ごめん、蒼太。 私たち、弱かった。", "竜也｜もう 迷わない。 いっしょに 戦おう。"]),
        LP("蒼太", "バックアップ", ["蒼太｜アプリは 完成させる。 でも さえこたちには 渡さない。", "蒼太｜データは 持っていかれた。 でも 俺、バックアップを 取っていた！", "竜也｜さすがだ。"]),
        LB("ロボ警備隊", "ロボ警備隊", ["（警報が 鳴りひびいて、ロボ警備隊が なだれこんできた！）", "竜也｜俺が 食い止める！ 美咲、健斗、頼む！"], SBF("ssa", 16, "ロボ警備隊", "🤖", "ガシャガシャ！ 降参！", 1.2),
            ["健斗｜よし！ 突破したぞ！", "美咲｜蒼太、急いで！"]),
        LP("さえこ", "さえこ登場", ["（そこへ さえこが 現れた。 手には ビームが 出る ピカピカの おもちゃの ビームペン。）", "さえこ｜蒼太さん、もう あきらめて。 このアプリは 私の ものよ。", "蒼太｜（あと 少しで 完成する…！）"]),
    ],
    talks:[["バックアップUSB", ["バックアップUSB｜ぴこ。 大事な データは 別の 場所にも 保存しよう。", "バックアップUSB｜備えあれば 憂いなし。"]]],
    fin:["語り手｜バックアップの 備えが 役に 立った！ アプリは もうすぐ 完成。", "語り手｜つぎは アプリ完成と 運命の 選択。"],
    learn:"大事な データは バックアップ。 備えが 後で 助けてくれる。"});

SB("ssa", 17, {title:"完成、そして 選択", theme:"stage", bgm:"castle",
    intro:["語り手｜蒼太は 最後の コードを 打ち込む。", "語り手｜画面に『Destiny Rewrite 完成』の 文字が 浮かんだ。"],
    steps:[
        LP("蒼太", "完成！", ["蒼太｜完成した…！", "さえこ｜まさか…！ 待って、それを 使ったら 世界が！", "蒼太｜（使うのは 自分の 過去の 選択だけ。 安全機能が まもってくれる。）"]),
        LQ("蒼太", "どの 選択を 変える？", ["蒼太｜書き換えるのは 6か月前の 選択。 『運命開発の 通知を 受け取るか』…。"],
            [["過去の 選択を やり直せるとき、いちばん 大切な 考え方は？", "他人を 巻きこまず、自分の 責任で 決める", ["他人の 人生も 変えて しまう", "使えば ぜんぶ 解決すると 考える"], "蒼太｜他の 人を 巻きこむのは だめだ。 自分の 責任で。", "蒼太｜そう。 自分の 選択に 責任を もつ。"]]),
        LP("蒼太", "『いいえ』を 選ぶ", ["蒼太｜通知を 受け取るか… 『いいえ』。", "（その しゅんかん、世界が ゆれ、まっしろな 光が すべてを つつんだ。）"]),
        LP("語り手", "時間の 逆行", ["（気がつくと 蒼太は 自分の アパートに いた。 6か月前の 日付。）", "蒼太｜戻って きた…。", "（でも 開発チームの こと、さえこの こと…。 記憶は だんだん うすれて いった。）", "蒼太｜忘れたくない…。 誰かを 救いたかった。 それだけは、忘れない。"]),
    ],
    talks:[["時計の ぬいぐるみ", ["時計の ぬいぐるみ｜ちくたく。 過去は 変えられなくても、未来は つくれるよ。", "時計の ぬいぐるみ｜今を 大切にね。"]]],
    fin:["語り手｜蒼太は 『いいえ』を 選び、新しい 人生を はじめた。", "語り手｜つぎは 変わった 世界の ようす。"],
    learn:"自分の 選択には 自分で 責任を もとう。 他人を 巻きこまない。"});

SB("ssa", 18, {title:"新しい 世界、新しい 再会", theme:"town", bgm:"town",
    intro:["語り手｜3年後。 蒼太は 小さな 会社で、人の 役に 立つ アプリを 作っていた。", "語り手｜ある日、街で 見覚えのある 人たちを 見かける。"],
    steps:[
        LP("美咲", "妹さんと", ["（街角で 笑いあう 美咲と 妹さん。）", "美咲｜お姉ちゃん、今日は どこ行く？ ──妹の 声に 美咲は 笑っていた。", "蒼太｜（……よかった。）"]),
        LP("竜也", "竜也と 家族", ["（竜也は 大事な ペンダントを 手に 家族と 歩いていた。）", "蒼太｜（竜也さんも 幸せそうだ。）"]),
        LQ("健斗", "覚えていない 人", ["（公園で 健斗に 声を かけると、健斗は 蒼太を 覚えていなかった。）", "健斗｜え？ 俺のこと 知ってるの？ 会ったこと ないよね？", "蒼太｜この世界では 初めてです。"],
            [["初対面の 人に 昔の 話を する とき、気を つけることは？", "相手が びっくり しないよう ていねいに 話す", ["むりやり 思い出させる", "怒って 責める"], "健斗｜突然 言われても びっくりするよ！", "健斗｜そう、ゆっくり ていねいに 話してくれると 安心するよ。 友だちに なろう！"]]),
        LP("蒼太", "新しい チーム", ["蒼太｜みんな、人を 幸せにする アプリを いっしょに 作らない？", "健斗｜いいね！ やろうよ！", "（4人は 『Hope Connect』という 『困っている人と 助けたい人を つなぐ アプリ』を 作りはじめた。）"]),
    ],
    talks:[["街の 人", ["街の 人｜アプリで 助けて もらったよ！ ありがとう！", "街の 人｜困った時は 助け合いだね。"]]],
    fin:["語り手｜『Hope Connect』は 100万ダウンロードを たっせい！ みんなが 笑顔に なった。", "語り手｜でも、平和は 長く つづかなかった…。"],
    learn:"相手の 気持ちを 考えて ていねいに 話そう。 助け合う アプリは 人を つなぐ。"});

SB("ssa", 19, {title:"さえこの 影", theme:"night", bgm:"castle",
    intro:["語り手｜ある夜。 蒼太が 会社で ひとり 残業していると、突然 電気が 消えた。", "さえこ｜久しぶりね、蒼太さん。"],
    steps:[
        LP("さえこ", "さえこ再登場", ["さえこ｜あなた、過去を 変えたわね。 でも 私の 記憶は 消えなかった。", "蒼太｜なんで…。", "さえこ｜アプリを 返してもらうわ。"]),
        LP("時空警察", "時空警察 リョウ", ["（そこへ 『時空警察』を 名乗る リョウと アヤが 現れた。）", "リョウ｜私たちは 時間の 秩序を 守る 組織です。 さえこを 追っています。", "アヤ｜力を かしてください。 さえこを 止めるために。"]),
        LQ("蒼太", "話し合いで 解決？", ["蒼太｜さえこさんを 力で 止めるより、話し合えないかな。"],
            [["争いを 解決する とき、最初に 試す ことは？", "相手の 気持ちを 聞いて 話し合う", ["大声で おどす", "だれかに おしつける"], "リョウ｜まず 話し合うのは 大事だ。 でも 危ない ときは 守る。", "リョウ｜そうだ。 まず 話し合い。 それでも 難しい ときに 備えよう。"]]),
        LB("さえこ", "さえこ との 対決", ["さえこ｜話し合い？ 笑わせないで。 私と 勝負よ！", "蒼太｜俺は 負けない。 仲間と いっしょに 止める！"], SBF("ssa", 19, "さえこ", "🕴️", "…見事ね。", 1.25),
            ["さえこ｜…強く なったのね、蒼太さん。", "（さえこの 力が ゆらいだ そのとき…。）"]),
    ],
    talks:[["時空警察の 犬", ["時空警察の 犬｜ワン！ 時間の 秩序を まもるよ。", "時空警察の 犬｜話し合いが 第一ワン。"]]],
    fin:["語り手｜さえこの 力を 止めた。 そこへ 現れた のは…。", "語り手｜最終話へ。"],
    learn:"もめごとは まず 話し合い。 それでも 守る ときは 仲間と 協力。"});

SB("ssa", 20, {title:"終わりなき 物語", theme:"stage", bgm:"demoncastle",
    intro:["語り手｜さえこの 前に、龍之介が 現れた。", "龍之介｜さえこ、もう やめなさい。"],
    steps:[
        LP("龍之介", "親子", ["さえこ｜父さん…！", "龍之介｜世界を 救うために 世界を 壊すのか？ 本当に 大切なのは 今を 生きる ことだ。", "龍之介｜過去は 変えられない。 でも 未来は 変えられる。"]),
        LP("さえこ", "さえこの 涙", ["さえこ｜父さん… ごめんなさい。", "（さえこは 龍之介の うでの 中で 泣いた。 時空間は 元に もどり、世界は 静かさを とりもどした。）"]),
        LQ("蒼太", "封印の 決断", ["（その後、蒼太たちは 『Future Rewrite』という 未来を 見る アプリも 作った。 でも…）", "蒼太｜未来を 知りすぎると、選ぶ 勇気が なくなる。 このアプリは 封印しよう。"],
            [["『未来を 先に 知れる アプリ』を 作ったら、どうするのが よい？", "副作用を 考えて、使わない 決断も する", ["使いまくる", "売って もうける"], "蒼太｜便利でも、人の 自由を うばう なら 問題だ。", "蒼太｜そう。 作った あとの 責任も 考えて、必要なら やめる 勇気を もとう。"]]),
        LB("時空の ボス", "時空の ボス", ["（最後に、時空の 番人が 蒼太たちの 覚悟を 試しに きた！）", "時空の ボス｜今を 生きる 覚悟、見せてみよ！"], SBF("ssa", 20, "時空の ボス", "⏳", "…いい 覚悟だ。", 1.3),
            ["蒼太｜過去を 変えず、未来を おそれず、今を 生きる。 それが 俺たちの 答えだ。", "健斗｜蒼太さん、さいこう！"]),
    ],
    talks:[["講演会の 司会", ["講演会の 司会｜本日は 蒼太さんの お話です。", "講演会の 司会｜今を 大切に 生きる ことが 一番ですね。"]]],
    fin:["語り手｜『コード・オブ・デスティニー』は 完結。 作る人の 責任と、今を 生きる 大切さを まなんだね。", "語り手｜Map1の 任意サブストーリー、おしまい！"],
    learn:"技術には 責任が ある。 過去に とらわれず、未来を おそれず、今を 生きよう。"});


/* ==== game/ssb.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[52]=1;
"use strict";
// ===== Map2 サブ：リプレイワールド（全20話）=====
//   紘が 運命書き換えアプリで 過去へ。 どの事件も『あぶない わな』を 見ぬく まなびがいっぱい！
SB("ssb", 1, {title:"金色の 封筒", theme:"night", bgm:"town",
    intro:["語り手｜クリスマスの 夜。 紘は アカリ市の 秘密基地へ 向かった。", "語り手｜けれど 待っていたのは 金色の 封筒と ふしぎな USBメモリ。"],
    steps:[
        LP("紘", "ポストの 音", ["紘｜まぁ、平和が 一番だよな。 …ん？ ポストに 何か 入った。", "紘｜金色の 封筒？ 『親愛なる 坂口紘様へ』…めっちゃ 怪しい。"]),
        LQ("紘", "知らない USB", ["（手紙には『過去の 14個の 事件を 解決せよ』と 書かれ、USBメモリが 入っていた。）", "紘｜USBを パソコンに さしてみようかな…。"],
            [["知らない 人から 届いた USBメモリは、どうするのが 安全？", "むやみに さしこまず、信頼できる 人に 相談する", ["すぐ パソコンに さしてみる", "友だちに 配る"], "紘｜ウイルスが 入っているかも。 まず 相談しよう。", "紘｜そうだね。 ただ今回は 特別な アプリ。 安全に 気をつけて 進もう。"]]),
        LP("紘", "タイムスリップ！", ["（パソコンの 画面に『運命書き換えアプリ Ver1.0』。 紘は 勇気を 出して YESを おした。）", "紘｜うわぁぁぁ！！", "（まぶしい 光に つつまれて、紘は 2006年12月へ…！）"]),
    ],
    talks:[["秘密基地の ポスト", ["秘密基地の ポスト｜かさっ。 差出人の ない 手紙は 気をつけてね。", "秘密基地の ポスト｜開ける 前に 相談が 安全だよ。"]]],
    fin:["語り手｜紘は 14個の 依頼に ちょうせんする ことに！", "語り手｜最初の 依頼は 『スマホ不正利用事件』。"],
    learn:"知らない 人から 届いた 物は むやみに 使わず、相談しよう。"});

SB("ssb", 2, {title:"無料スマホ診断アプリ", theme:"town", bgm:"town",
    intro:["語り手｜2006年12月、丹羽鳥島。 若い 羽鳥彦が 営む 烏坂探偵事務所に 紘が 来た。", "語り手｜島民の スマホが 勝手に 操作される 事件が 起きている。"],
    steps:[
        LP("羽鳥彦", "事件の あらまし", ["羽鳥彦｜SNSに 変な 投稿が されたり、写真が 勝手に 送られたり しているんだ。", "紘｜被害者の 共通点は？", "羽鳥彦｜全員、『無料スマホ診断アプリ』を ダウンロードしているんだ。"]),
        LQ("紘", "アプリの 見分け方", ["紘｜そのアプリを 作った 人を 探そう。 でも その前に…"],
            [["無料の アプリを 入れる 前に 確かめる ことは？", "公式の ストアか、作った 会社と 許可（アクセス権）の 内容", ["ダウンロード数が 多いか だけ", "友だちが 入れていれば 安心"], "紘｜不要な 許可を 求める アプリは 要注意だよ。", "紘｜そう！ 作った 人と 許可の 内容を 確認しよう。"]]),
        LB("かめんの ひと", "仮面の 人 登場", ["（島の 広場に 黒い マントの 『仮面の 人』が 現れた！）", "かめんの ひと｜ふふふ、よく 見つけたね。 でも 僕は 捕まらない！"], SBF("ssb", 2, "かめんの ひと", "🎭", "ふふ、やるね。", 1.0),
            ["羽鳥彦｜逃げられたか…。", "紘｜あの 動き方、どこかで… まさか 智也！？"]),
    ],
    talks:[["島民", ["島民｜スマホが おかしいんだ。 パスワードを 変えなきゃ。", "島民｜怪しい アプリは もう 入れないよ。"]]],
    fin:["語り手｜仮面の 人は 『智也』かも しれない。 紘は おとり作戦を 考える。", "語り手｜依頼1 クリア！ つぎは クレカの 事件。"],
    learn:"アプリを 入れる 前に、作った 人と 許可の 内容を 確かめよう。"});

SB("ssb", 3, {title:"カード番号が もれた！", theme:"shop", bgm:"town",
    intro:["語り手｜2007年。 島の 人の クレジットカードが 勝手に 使われている。", "語り手｜鳩子が あわてて 事務所に かけこんだ。"],
    steps:[
        LP("鳩子", "また 被害者が！", ["鳩子｜村川さんの カードで 100万円分の 買い物が されたそうです！", "紘｜被害者の 共通点を 探そう。 みんな どこで カードを 使った？"]),
        LQ("村川", "共通点", ["村川｜先週、ガソリンスタンドで 使いました。", "羽鳥彦｜みんな 同じスタンドだ！"],
            [["カードの 番号が 盗まれる『スキミング』を 防ぐには？", "カード読み取り機に 怪しい 装置が ないか 見て、明細を 毎月 確認する", ["カードを 人に 貸す", "暗証番号を メモして 財布に 入れる"], "紘｜読み取り機に 変な 装置が ついて いないか、チェックだ。", "紘｜そう！ 明細の 確認も 大切だよ。"]]),
        LB("スキミくん", "スキミ装置の 精霊", ["（カード読み取り機の すきまから 小さな『スキミくん』が 飛び出した！）", "スキミくん｜ぴこぴこ！ 情報を ちょうだ〜い！"], SBF("ssb", 3, "スキミくん", "💳", "ぴこっ！ とられた〜！"),
            ["鳩子｜装置を 発見しました！", "紘｜犯人は…アルバイトの 井上智也だ！"]),
        LP("かめんの ひと", "仮面の 手紙", ["（そこへ カードが 1枚。『紘、久しぶり。君の 未来を 変えるために 僕は この時代に 来た』）", "紘｜智也も タイムスリップ してる…？"]),
    ],
    talks:[["ガソリンスタンドの 人", ["ガソリンスタンドの 人｜装置は 見つかりました。 点検を 強化します。", "ガソリンスタンドの 人｜カードは 自分の 目の 届く ところで 使ってね。"]]],
    fin:["語り手｜智也は 逃げたけれど、証拠は そろった。", "語り手｜依頼2 クリア！ つぎは 引っ越し詐欺。"],
    learn:"カードは 読み取り機を 確認して、利用明細を こまめに チェックしよう。"});

SB("ssb", 4, {title:"安すぎる ひっこし屋", theme:"town", bgm:"town",
    intro:["語り手｜2008年2月、アカリ市。 亜由美さんは 引っ越し業者に 荷物を 持ち逃げされた。", "語り手｜名前は『スピード引っ越しセンター』。 料金が とても 安かった。"],
    steps:[
        LP("亜由美", "亜由美さんの 相談", ["亜由美｜朝9時に 荷物を ぜんぶ トラックに つみこんで、『先に 新居へ』と 言われたんです。", "亜由美｜何時間 待っても トラックは 来なくて…。 電話も つながらなく なりました。"]),
        LQ("紘", "安いには 理由が ある", ["紘｜ホームページの 口コミ、文章の パターンが 全部 同じだ。"],
            [["料金が 安すぎる 業者に 頼む 前に すべき ことは？", "会社の 住所と 連絡先、本当の 口コミ、複数社の 見積もりを 確かめる", ["安い ほうが 得だから すぐ 契約", "口コミが いいから 信じる"], "亜由美｜連絡先も 住所も うそだったの…。", "亜由美｜なるほど。 比べて 確かめるのが 大事なんですね。"]]),
        LB("にせトラック", "にせトラック", ["（作戦当日、にせの 引っ越しトラックが 走り出した！ 追いかけた 倉庫の 前で…）", "にせトラック｜ぶるるん！ つかまえて ごらん！"], SBF("ssb", 4, "にせトラック", "🚚", "ぶるる…まいった。"),
            ["亜由美｜荷物が あった！", "紘｜よかった！ 警察にも 協力して もらって 正解だね。"]),
    ],
    talks:[["荷物の 箱", ["荷物の 箱｜がさごそ。 荷物の 写真を 撮っておくと 安心だよ。", "荷物の 箱｜契約書は 保存しておこうね。"]]],
    fin:["語り手｜仮面の 人が 黒幕かもしれない。 でも 荷物は 取り戻せた。", "語り手｜依頼3 クリア！ つぎは カシノ県の 蒼くんの 家。"],
    learn:"安すぎる 値段には 注意。 会社の 住所・連絡先・口コミを 確かめよう。"});

SB("ssb", 5, {title:"小さな 文字の 契約書", theme:"school", bgm:"town",
    intro:["語り手｜2008年4月、カシノ県。 幼い 蒼くんの 家族が 引っ越し先で 多額の 追加費用を 請求された。", "語り手｜契約書の 小さな 文字が 気に なる…。"],
    steps:[
        LP("蒼の 父", "300万円の 請求", ["蒼の 父｜入居の あとで 追加費用300万円を 請求されたんだ。", "蒼の 母｜契約書には『追加費用が かかる 場合が あります』と 小さく 書いてあったの。"]),
        LQ("紘", "契約書を よく 読もう", ["紘｜追加費用の 内訳が まったく 書かれていません。 しかも 不動産屋の 住所が 存在しない！"],
            [["契約書に あいまいな 書き方が あったら？", "サインの 前に 内容を 質問し、消費生活センターなどに 相談する", ["小さい 字は 気にしない", "相手の 言うとおりに 払う"], "蒼の 父｜サインを する前に 質問すれば よかった…。", "蒼の 父｜そうか。 困ったら 相談窓口を 使えば いいんだね。"]]),
        LB("にせ不動産屋", "にせ不動産屋", ["（紘は 偽の 不動産屋の 事務所に のりこんだ！）", "にせ不動産屋｜うちは 正規の 会社です！ …たぶん！"], SBF("ssb", 5, "にせ不動産屋", "🏠", "あわわ…ばれた。"),
            ["蒼｜お兄さん かっこいい！ ありがとう！"]),
    ],
    talks:[["幼い 蒼", ["幼い 蒼｜ぼく 新雪蒼！ よろしくね！", "幼い 蒼｜お父さんと お母さんを 助けてくれて ありがとう！"]]],
    fin:["語り手｜契約書の 小さな 文字まで 読む。 それが 身を まもる 第一歩。", "語り手｜依頼4 クリア！ つぎは QRコード。"],
    learn:"契約書は 小さな 文字まで 読み、あいまいな 点は 質問・相談しよう。"});

SB("ssb", 6, {title:"公園の ふしぎな QRコード", theme:"park", bgm:"field",
    intro:["語り手｜2009年6月、ミドリ県。 4さいの 渚ちゃんが お母さんの スマホで 遊んでいて、QRコードを 読み取って しまった。", "語り手｜その後、クレジットカードが 不正に 使われた。"],
    steps:[
        LP("渚", "渚ちゃんの 涙", ["渚｜わたしの せいなの…ごめんなさい。", "紘｜渚ちゃんの せいじゃ ないよ。 悪いのは 犯人だ。 いっしょに 捕まえよう！"]),
        LQ("紘", "QRコードの わな", ["紘｜公園に『無料プレゼント！このQRコードを 読み取ろう！』という 看板が あったんだね。"],
            [["知らない QRコードを 見つけたら？", "むやみに 読み取らず、出どころと 飛び先の アドレスを 確認する", ["プレゼントが ほしいから すぐ 読む", "友だちに 広める"], "紘｜ニセの 入力画面に 飛ばされる ことも あるんだ。", "紘｜そう。 出どころの 確認が 大切。 子どもには 大人が 付き添おうね。"]]),
        LB("ニセQRくん", "ニセQRくん", ["（公園の 看板に 化けた『ニセQRくん』が 現れた！）", "ニセQRくん｜ぷにぷに！ 読み取って〜！"], SBF("ssb", 6, "ニセQRくん", "🔳", "ぷにっ…負けた。"),
            ["渚｜お兄ちゃん ありがとう！", "紘｜これで カードの 不正利用も 止まるはずだよ。"]),
    ],
    talks:[["渚の お母さん", ["渚の お母さん｜子どもの スマホは 見守りが 大切ですね。", "渚の お母さん｜怪しい QRは 触らない ようにします。"]]],
    fin:["語り手｜仮面の 人の 正体は まだ わからない。", "語り手｜依頼5 クリア！ つぎは ゲーム機の トラブル。"],
    learn:"知らない QRコードは 読み取らず、出どころを 確かめよう。"});

SB("ssb", 7, {title:"ニセモノの ゲーム機", theme:"shop", bgm:"town",
    intro:["語り手｜2010年2月、アカリ市。 5さいの 智也くんは、ネットで 買った 新しい ゲーム機が にせものだった。", "語り手｜お金も 返って こない。"],
    steps:[
        LP("智也の 母", "偽物の 3DS", ["智也｜僕の ゲーム機…箱は 本物そっくりなのに、中身が ちがうの。", "智也の 母｜お金も 返って こなくて…。"]),
        LQ("紘", "ネットで 買う とき", ["紘｜出品者の 評価を 見ましたか？"],
            [["ネットで 高い 品物を 買う ときは？", "出品者の 評価と 住所、返品の 条件を 確認し、安全な 支払い方法を 使う", ["いちばん 安い 出品者を えらぶ", "お金を 先に 直接 振り込む"], "紘｜相手の ことが 分からない まま お金を 払うのは 危ないよ。", "紘｜そう。 安全な 支払いと 評価の 確認が 大事。"]]),
        LB("コピーくん", "コピーくん", ["（偽物を 売っていた『コピーくん』が 登場！）", "コピーくん｜そっくり でしょ？ へへっ！"], SBF("ssb", 7, "コピーくん", "🎮", "ぷしゅー…ばれたか。"),
            ["智也｜お兄ちゃん ありがとう！", "紘｜（このころの 智也は まだ 純粋だったんだな…。）"]),
    ],
    talks:[["幼い 智也", ["幼い 智也｜ぼく 今度は 本物を 買ってもらう！", "幼い 智也｜ありがとう お兄ちゃん。"]]],
    fin:["語り手｜幼い 智也は 笑顔を とりもどした。", "語り手｜依頼6 クリア！ つぎは 2011年。"],
    learn:"ネットの 買い物は 出品者の 評価と 安全な 支払い方法を 確かめよう。"});

SB("ssb", 8, {title:"防災の ニセ情報", theme:"school", bgm:"town",
    intro:["語り手｜2011年3月、避難所。 6さいの 未来くんの 家族は『義援金を 集めている』という 人に お金を わたして しまった。", "語り手｜後で 調べると その 団体は 存在しなかった。"],
    steps:[
        LP("未来の 母", "困っている 人を 助けたくて", ["未来の 母｜困っている 人を 助けたいと 思って、10万円を 渡したの。", "紘｜その気持ちは とても やさしい ですね。 でも 犯人は それを 利用した んです。"]),
        LQ("紘", "寄付の かくにん", ["紘｜寄付を する ときは 団体が 本物か 確かめよう。"],
            [["寄付や 募金を する とき、まず 確認することは？", "公的な 団体か どうかを 公式サイトなどで 調べる", ["その場で すぐ 現金を わたす", "メッセージの 指示で 振り込む"], "紘｜団体の 名前で 調べると 本物か わかるよ。", "紘｜そう。 やさしい 気持ちを 守るために 確認が 大切。"]]),
        LP("避難所の 人", "ほんとうの 防災", ["避難所の 人｜落ち着いて 公式な 情報を 見て、うわさを 広げないように しましょう。", "避難所の 人｜非常用の 水と 食べ物を 家に 用意しておくと 安心ですよ。"]),
        LB("デマくん", "デマくん", ["（まちに 流れる ニセの うわさ『デマくん』が 登場！）", "デマくん｜うわさは 広がれ〜！"], SBF("ssb", 8, "デマくん", "📢", "しゅん…ごめんなさい。"),
            ["未来｜お兄ちゃん ありがとう！"]),
    ],
    talks:[["避難所の 子ども", ["避難所の 子ども｜みんなで 助け合えば 大丈夫！", "避難所の 子ども｜ニセの うわさは 信じないよ。"]]],
    fin:["語り手｜助けたい 気持ちを 守る ために、確かめる ことが 大事だね。", "語り手｜依頼7 クリア！ つぎは マジックショー。"],
    learn:"寄付は 団体を 確認して。 うわさは 公式な 情報で たしかめよう。"});

SB("ssb", 9, {title:"マジックショーの ひみつ", theme:"stage", bgm:"castle",
    intro:["語り手｜2012年4月、アカリ市文化会館。 子どもたちの マジックショーが 開かれている。", "語り手｜出場者の 中には 7さいの 蒼くんと 康介くんも！"],
    steps:[
        LP("司会者", "ショーの 始まり", ["司会者｜今日は 10人の マジシャンが 登場します！", "紘｜(懐かしいな…子どもの 頃の 蒼と 康介。)"]),
        LQ("市川", "種あかしは だめ", ["（マジシャンの 一人が、他の 人の マジックの 種を 客席に ばらしてしまった。）"],
            [["他の 人の マジックの 種を 勝手に ばらすのは？", "努力を 台無しに するので マナー違反。 やめる", ["みんなが 喜ぶから 許される", "ばれなければ いい"], "康介｜練習して 作った マジックなのに…。", "康介｜そう。 仲間の 努力を 大切に しよう。"]]),
        LP("紘", "数の マジック", ["紘｜数の マジックを 見せるよ。 好きな 数を 2倍して 10を たして、2で わって、最初の 数を ひくと…？", "蒼｜5だ！", "紘｜そう！ どんな 数でも 答えは 5。 数学の 力だよ。"]),
        LB("マジシャン", "ふしぎな マジシャン", ["（そこへ 仮面の 人が 現れて、紘に マジック対決を 挑んだ！）", "かめんの ひと｜僕の 手品、見破れるかな？"], SBF("ssb", 9, "かめんの ひと", "🎭", "お見事。", 1.1),
            ["紘｜(まさか 仮面の 人も 運命書き換えアプリを 持っている…？)"]),
    ],
    talks:[["観客の 子", ["観客の 子｜わぁ すごい！ どうやったの？", "観客の 子｜種を 知らなくても 楽しいね。"]]],
    fin:["語り手｜今回の 本当の 目的は 『仮面の 人の 存在に 気づく こと』だった。", "語り手｜依頼8 クリア！"],
    learn:"仲間の 努力は 大切に。 種あかしは 本人の 気持ちを 考えよう。"});

SB("ssb", 10, {title:"教室の 涙", theme:"school", bgm:"town",
    intro:["語り手｜2013年5月。 紘は 中学2年の 教室に もどった。", "語り手｜同級生の 真理奈さんが、だれかに つきまとわれて いるらしい。"],
    steps:[
        LP("蒼", "教室の ざわめき", ["蒼｜真理奈ちゃん、最近 ずっと 泣いてるんだ。", "康介｜変な メッセージも 届くらしい。"]),
        LQ("紘", "どう 助ける？", ["（真理奈さんは しつこく 追いかけられて 不安を 感じている。）"],
            [["友だちが つきまとい被害で 悩んでいたら？", "ひとりで 抱えず、先生や 保護者などに 相談するよう すすめる", ["本人を 責める", "犯人を 自分たちだけで 探し出す"], "紘｜自分たちだけで 解決しようとすると 危ないよ。", "紘｜そう。 信頼できる 大人に 相談するのが 一番 安全。"]]),
        LP("智也", "智也の 反省", ["智也｜…僕、真理奈に しつこく メッセージを 送ってた。 ごめん。", "真理奈｜そんなに 気持ちが あるなら、ちゃんと 話してほしかった。 つきまとわれるのは こわいよ。"]),
        LP("紘", "素直に", ["紘｜気持ちを 伝えるのは 大切。 でも 相手が いやがる ことは しないで ね。", "智也｜これから 素直に なるよ。"]),
    ],
    talks:[["先生", ["先生｜困った ことが あったら いつでも 相談してね。", "先生｜一人で 悩まないで。"]]],
    fin:["語り手｜気持ちを 伝える とき、相手の 気持ちも 大切に する ことを まなんだね。", "語り手｜依頼9 クリア！ つぎは 2014年。"],
    learn:"相手が いやがる ことは しない。 困ったら 大人に 相談しよう。"});

SB("ssb", 11, {title:"消えた おやつの なぞ", theme:"school", bgm:"cave",
    intro:["語り手｜2014年。 小学校の 理科室の 鍵つきの 部屋から、おやつが 消えた！", "語り手｜部屋は 中から 鍵が かかっていた『密室』だ。"],
    steps:[
        LP("先生", "密室の おやつ", ["先生｜鍵は ここに あるのに おやつだけ 消えているの…。", "紘｜窓も 内側から 閉まっている。 どうやって…？"]),
        LQ("紘", "推理しよう", ["紘｜よく 見ると 換気口の ふたが 少し ずれている。"],
            [["『密室』の なぞを 解くには、まず 何を する？", "事実を 集めて、見落とした 出入口が ないか 順番に 調べる", ["思いつきで 犯人を 決めつける", "あきらめて 帰る"], "紘｜決めつけは 禁物。 一つずつ 調べよう。", "紘｜そう！ 換気口から 小さな 手が…。"]]),
        LB("おやつどろぼう", "おやつどろぼう", ["（換気口から ぴょこっと 出てきたのは、おなかを すかせた『おやつどろぼう』！）", "おやつどろぼう｜ごめんなさい…おなかが すいて。"], SBF("ssb", 11, "おやつどろぼう", "🍪", "ごめんなさい…。"),
            ["先生｜お腹が すいたら 先に 相談してね。", "紘｜みんなで 分け合おう。"]),
    ],
    talks:[["給食の おばさん", ["給食の おばさん｜お腹が すいたら 言ってね。 おにぎり あるよ。", "給食の おばさん｜無断で 取るのは だめだよ。"]]],
    fin:["語り手｜なぞは 解決。 おなかが すいた子も 反省して、みんなで おやつを 分け合った。", "語り手｜依頼10 クリア！"],
    learn:"決めつけず、事実を 一つずつ 調べよう。 困ったら 正直に 相談しよう。"});

SB("ssb", 12, {title:"RPG脱出ゲーム 入口", theme:"town", bgm:"town",
    intro:["語り手｜2015年7月、ハガネ町。 紘は 蒼と 康介と RPG風の 脱出ゲームイベントに 来た。", "語り手｜けれど イベントの 様子が 少し おかしい…。"],
    steps:[
        LP("スタッフ", "ようこそ 勇者さま", ["スタッフ｜ようこそ 勇者さま！ ダンジョンを 攻略して ゴールを 目指して ください！", "蒼｜雰囲気 出てるなぁ！"]),
        LQ("康介", "ルールを 確認", ["康介｜イベントの ルールを ちゃんと 読もう。 制限時間と 禁止事項は？"],
            [["イベントに 参加する とき、最初に すべき ことは？", "ルールと 注意事項を 読み、わからない ことは スタッフに 聞く", ["読まずに 進む", "ほかの 人の まねだけする"], "康介｜ルールを 知らないと 失格に なるかも。", "康介｜そう！ ルール確認は 基本中の 基本。"]]),
        LP("蒼", "パーティー編成", ["蒼｜僕は 戦士役！ 紘は 魔法使い役ね！", "康介｜僕は 僧侶役か。"]),
        LP("紘", "出口が 開かない！？", ["（ダンジョンの 部屋に 入ると、扉の 鍵が 開かなくなった。 ほかの 参加者も 困っている。）", "紘｜これは… ゲームの 仕掛けだけじゃ ない気がする。"]),
    ],
    talks:[["魔法使いの スタッフ", ["魔法使いの スタッフ｜きらきら ヒントを どうぞ！", "魔法使いの スタッフ｜困ったら 手を あげてね。"]]],
    fin:["語り手｜扉が 開かない 部屋に 参加者が 閉じこめられた！ 続きは 後編で。", "語り手｜謎解きで 脱出しよう！"],
    learn:"イベントでは ルールと 注意事項を 先に 確認しよう。"});

SB("ssb", 13, {title:"RPG脱出ゲーム 攻略", theme:"lab", bgm:"cave",
    intro:["語り手｜扉の 向こうの 部屋には 3つの 謎が 用意されている。", "語り手｜紘たちは 参加者みんなで 協力して 解くことに。"],
    steps:[
        LQ("蒼", "第1の 謎", ["（壁に 『1・2・4・8・？』と 書かれている。）"],
            [["？に 入る 数字は？", "16", ["10", "12"], "蒼｜前の 数の 2倍に なっているよ。", "蒼｜そう、16！ 扉が 1つ 開いた。"]]),
        LQ("康介", "第2の 謎", ["（宝箱に 『赤・青・黄・？』とある。 次は 何色？）"],
            [["信号の 色の 順番で 考えると、？は？", "緑（青）", ["黒", "白"], "康介｜信号の 色は 青・黄・赤。 この 順番で 考えよう。", "康介｜その とおり！ 2つめも 開いた。"]]),
        LB("ダンジョン番人", "ダンジョン番人", ["（最後の 部屋に ダンジョン番人が 現れた！）", "ダンジョン番人｜よくぞ ここまで！ 最後の 勝負だ！"], SBF("ssb", 13, "ダンジョン番人", "🗝️", "見事だ！"),
            ["参加者たち｜やった〜！ 出られた！"]),
        LP("かめんの ひと", "仮面の 登場", ["（そこへ 仮面の 人が 現れた。『この 脱出ゲームは 僕が 仕組んだんだ』）", "かめんの ひと｜次は 占い師だよ。 楽しみに していて ね。"]),
    ],
    talks:[["参加者", ["参加者｜みんなで 協力したから 出られたね！", "参加者｜知らない 人とも 助け合えるって 素敵。"]]],
    fin:["語り手｜助け合って 脱出に 成功。 仮面の 人の 正体は まだ ひみつ。", "語り手｜依頼11 クリア！"],
    learn:"知らない 人とも 協力すると 難しい 問題を 解決できる。"});

SB("ssb", 14, {title:"当たる占い師の トリック", theme:"stage", bgm:"castle",
    intro:["語り手｜2018年3月、ヒカリ町。 『100%当たる』と 評判の 占い師が いる。 1回5万円！", "語り手｜蒼は 就職の ことを 占ってもらうと 言いだした。"],
    steps:[
        LP("蒼", "100%当たる？", ["蒼｜ネットでは みんな『当たった！』って 書いてるよ！", "紘｜（100%当たる占い…怪しいな。）"]),
        LQ("紘", "計算トリック", ["紘｜占い師が 使うのは 数学の トリックかも。 好きな 数に 2をかけて 5を足し、5をかけると…？"],
            [["（X×2＋5）×5 は、X を 使って 表すと？", "10X ＋ 25", ["5X ＋ 25", "X ＋ 10"], "蒼｜(2X＋5)×5 だから、2X×5 ＋ 5×5 だよ。", "蒼｜そう！ 答えが わかれば 逆算して X が わかる。 これが 占いの 種！"]]),
        LQ("康介", "高い 料金", ["康介｜1回5万円は 高すぎるよ。"],
            [["『必ず 当たる』と 言って 高い お金を 取る 占いには？", "『必ず』という 言葉に 注意し、お金を 払う 前に よく 考える", ["高いほど 当たると 信じる", "借金してでも 払う"], "紘｜『必ず』『絶対』と いう 言葉は 要注意。", "紘｜そう。 冷静に なって 考えよう。"]]),
        LB("にせ占い師", "にせ占い師", ["（紘が トリックを 見破ると、占い師は 水晶玉を 持って 逃げようとした！）", "にせ占い師｜ばれたか！ でも 簡単には 捕まらないぞ！"], SBF("ssb", 14, "にせ占い師", "🔮", "くっ…負けた。"),
            ["蒼｜お金を 払わなくて 本当に よかった…。"]),
    ],
    talks:[["占いサロンの 客", ["占いサロンの 客｜当たったと 思ったけど…。 だまされてたのかな。", "占いサロンの 客｜占いは 楽しむ程度に しよう。"]]],
    fin:["語り手｜トリックを 見破って 被害を 防いだ！", "語り手｜依頼12 クリア！ つぎは 島の 事件。"],
    learn:"『必ず当たる』に 注意。 計算の トリックを 知ると だまされにくい。"});

SB("ssb", 15, {title:"島の まいごさがし（前）", theme:"lake", bgm:"field",
    intro:["語り手｜2019年8月、丹羽鳥島。 島の 住民が 次々と 行方が わからなく なっているという 知らせ。", "語り手｜みんな 落ち着いて 探すよ。 実は『いたずら連絡』が 原因かもしれない。"],
    steps:[
        LP("羽鳥彦", "あらまし", ["羽鳥彦｜漁師の 田中さん、主婦の 佐藤さん、中学生の 鈴木くんが 連絡が とれなく なった。", "蒼｜みんな 突然 いなくなったんだ！"]),
        LQ("紘", "第一の 手がかり", ["（田中さんの 家の テーブルに『港の 倉庫に 来て』という メモが 残されて いた。）"],
            [["知らない 人からの 『ここに 来て』の メモを 見つけたら？", "ひとりで 行かず、大人や 警察に 知らせる", ["こっそり ひとりで 行く", "返事を 書いて 場所を 教える"], "紘｜危ないので ひとりで 行くのは やめよう。", "紘｜そう。 知らせて 大勢で 行動しよう。"]]),
        LP("鳩子", "目撃情報", ["鳩子｜昨夜 倉庫の 近くで 黒い マントの 人を 見たそうです。", "紘｜仮面の 人かもしれない…。"]),
        LB("いたずらカラス", "いたずらカラス", ["（倉庫の 前に『いたずらカラス』が 立っていた！）", "いたずらカラス｜カァカァ！ ここは 通さないぞ！"], SBF("ssb", 15, "いたずらカラス", "🐦", "カァ…まいった。"),
            ["羽鳥彦｜倉庫の 扉が 開いたぞ！"]),
    ],
    talks:[["漁師の 奥さん", ["漁師の 奥さん｜主人が 心配で…。 無事を 祈っているわ。", "漁師の 奥さん｜みんなで 探せば 見つかるよ。"]]],
    fin:["語り手｜倉庫の 中には…。 続きは 後編。", "語り手｜落ち着いて 行動すれば 大丈夫！"],
    learn:"知らない メモや 呼び出しには ひとりで 行かず、大人に 知らせよう。"});

SB("ssb", 16, {title:"島の まいごさがし（後）", theme:"lake", bgm:"field",
    intro:["語り手｜倉庫の 中には、いなくなったと 思われた 島の 人たちが 無事だった。", "語り手｜みんな 仮面の 人に『宝探しゲーム』と 言われて 集められていた。"],
    steps:[
        LP("田中さん", "宝探しゲーム", ["田中さん｜仮面の 人が『宝探しゲームを しよう』と 言って、ここに 集められたんだ。", "佐藤さん｜帰ろうとしたら、扉が 開かなく なって…。"]),
        LQ("紘", "うまい誘いに 注意", ["紘｜『宝探し』『プレゼント』と 言われて 知らない 人に ついて いくのは 危ないよ。"],
            [["知らない 人から『いい ものを あげる』と 言われたら？", "お礼を 言って 断り、その場を はなれて 大人に 知らせる", ["ついて いく", "秘密にして ついて いく"], "紘｜知らない 人に ついて行かない。 これは 大人も 同じ。", "紘｜そのとおり。 断る勇気が 身を 守る。"]]),
        LB("かめんの ひと", "仮面の 人との 対決", ["（紘の 前に 仮面の 人が あらわれた。）", "かめんの ひと｜ふふ、次が いよいよ 最後の 試練だ。"], SBF("ssb", 16, "かめんの ひと", "🎭", "…やるね。", 1.15),
            ["かめんの ひと｜最後の 依頼で 全てが 明らかに なる。", "紘｜お前の 正体を 暴いてやる！"]),
    ],
    talks:[["鈴木くん", ["鈴木くん｜助けてくれて ありがとう。 もう 知らない 人に ついて いかないよ。", "鈴木くん｜怖かったけど 平気だよ。"]]],
    fin:["語り手｜島の 人たちは 無事に 戻った。 仮面の 人は 逃げたけれど、最後の 依頼が 待っている。", "語り手｜依頼13 クリア！"],
    learn:"知らない 人に ついて いかない。 うまい 誘いは きっぱり 断ろう。"});

SB("ssb", 17, {title:"ノロマ風邪が 広がる（前）", theme:"lab", bgm:"cave",
    intro:["語り手｜2020年3月、アカリ市。 街の 人は みんな マスク姿。 『ノロマ風邪』が 広がって いる。", "語り手｜紘は 24時間以内に 原因を つきとめる 依頼を 受けた。"],
    steps:[
        LP("蒼", "康介が 倒れた", ["蒼｜紘！ 大変だ！ 康介が 研究所で 体調を くずしたらしい！", "紘｜康介が！？ すぐ 行く！"]),
        LP("医師", "研究所で", ["医師｜康介さんは 休めば よくなります。 ただ、ノロマ風邪が 広がる 前に 対策が 必要です。"]),
        LQ("医師", "予防の 基本", ["医師｜風邪や ウイルスから 身を 守る 基本は？"],
            [["感染症の 予防として 正しい ものは？", "手洗い・うがい・休養・バランスの よい 食事", ["ぜんぜん 休まない", "つばを あちこちに はく"], "医師｜基本は 手洗いと 休養ですよ。", "医師｜そのとおり！ 当たり前の 対策が 大事です。"]]),
        LB("ノロマくん", "ノロマくん", ["（研究所の 装置から ちいさな『ノロマくん』が 現れた！）", "ノロマくん｜ぼくが 広めちゃうぞ〜！"], SBF("ssb", 17, "ノロマくん", "🦠", "ぷしゅ…負けた。"),
            ["医師｜ありがとう！ 研究所の 空気が きれいに なったよ。"]),
    ],
    talks:[["マスクの 子ども", ["マスクの 子ども｜手洗い、ちゃんと してるよ！", "マスクの 子ども｜体調が 悪い ときは 早く 休むの！"]]],
    fin:["語り手｜予防の 基本を しっかり 実行しよう。", "語り手｜次は 原因の 解明。"],
    learn:"手洗い・うがい・休養は 感染症予防の 基本。 体調が 悪い ときは 休もう。"});

SB("ssb", 18, {title:"ノロマ風邪が 広がる（後）", theme:"lab", bgm:"castle",
    intro:["語り手｜研究所で 原因を 調べた 紘たち。 すると『ある 人物』の ネットワークが 浮かび上がった。", "語り手｜その 人物は 未来の 自分を 名乗る メッセージを 送り続けて いた。"],
    steps:[
        LP("羽鳥彦", "分析結果", ["羽鳥彦｜この 風邪の 広がり方には 規則性が あるぞ。", "紘｜だれかが 意図的に ニセの 情報を 流している…？"]),
        LQ("紘", "ニセ情報の 見分け", ["紘｜ネットでは『この 薬を 飲めば 治る』という ニセ情報が 流れて いる。"],
            [["体の ことで ネットの 情報を 見たら？", "公的機関や 医師など 信頼できる 情報で たしかめる", ["すぐ 試す", "友だちに 広める"], "紘｜体に かかわる 情報は 専門家の 意見が 大事。", "紘｜そのとおり。 確認してから 行動しよう。"]]),
        LB("かめんの ひと", "最後の 勝負", ["（仮面の 人が 研究所の 屋上に 立っていた。）", "かめんの ひと｜ここまで よく 来たね。 最後の 勝負だ！"], SBF("ssb", 18, "かめんの ひと", "🎭", "お見事…。", 1.2),
            ["紘｜お前の 仮面を 取る！", "（仮面の 下には、未来の 紘と 同じ 顔が…！？）"]),
        LP("紘", "世界は 守られた", ["紘｜ニセ情報を 止めたから、風邪は 落ち着いて いくはずだ。", "蒼｜康介も 回復したよ！"]),
    ],
    talks:[["研究員", ["研究員｜ニセ情報が 減って よかった。", "研究員｜みんなで 確認しよう。"]]],
    fin:["語り手｜最後の 依頼も クリア。 紘は 14個の 依頼を ぜんぶ 達成した！", "語り手｜でも、物語には まだ 続きが…。"],
    learn:"体の 情報は 信頼できる 機関で 確認。 ニセ情報を 広めない。"});

SB("ssb", 19, {title:"真実の 語り部", theme:"stage", bgm:"castle",
    intro:["語り手｜2026年1月1日。 紘の スマホに『真実の語り部』から メッセージが 届いた。", "語り手｜これまで 知らなかった 真実を 明かすという。"],
    steps:[
        LP("紘", "新しい 年", ["紘｜2026年…。 世界は 平和を とりもどした。 でも 不安が ある。", "紘｜『真実の語り部』って、だれだ？"]),
        LQ("羽鳥彦", "正体を さぐる", ["羽鳥彦｜差出人が 不明の メッセージは どうする？"],
            [["差出人が 不明の メッセージが 来たら？", "返信せず、内容を 保存して 信頼できる 人に 相談する", ["すぐ 返信して 会う", "SNSで 全員に 広める"], "羽鳥彦｜差出人が わからない うちは 慎重に ね。", "羽鳥彦｜そう。 相談してから 動こう。"]]),
        LB("真実の 語り部", "真実の 語り部", ["（探偵事務所の 前に 『真実の語り部』が 現れた。）", "真実の 語り部｜君に すべてを 伝えよう。 ただし 実力を 見せてから だ！"], SBF("ssb", 19, "真実の 語り部", "📖", "よくやった。", 1.25),
            ["真実の 語り部｜仮面の 人の 正体は… 実は、ある 人物の『変装』だった。"]),
        LP("紘", "つぎは 最終話", ["紘｜正体は 誰だったんだ…？", "（その答えは、最終話で 明かされる。）"]),
    ],
    talks:[["事務所の 時計", ["事務所の 時計｜ちくたく。 時間は 前へ 進むよ。", "事務所の 時計｜過去を 振り返って、今日を 生きよう。"]]],
    fin:["語り手｜語り部は 最後の ヒントを 紘に 伝えた。", "語り手｜つぎは 最終話！"],
    learn:"差出人が わからない メッセージには 慎重に。 信頼できる 人に 相談しよう。"});

SB("ssb", 20, {title:"仮面の 正体は…", theme:"stage", bgm:"demoncastle",
    intro:["語り手｜リプレイワールドの 最後の 夜。 紘たちは 仮面の 人の 正体を つきとめた。", "語り手｜その 正体は…。"],
    steps:[
        LP("レオ", "レオ 登場", ["仮面の 人｜僕の 名前は レオ。 変装の 達人さ。", "仮面の 人｜智也にも 蒼太にも 化けて、紘を 試して いたんだ。", "紘｜え！？ 最初から 全部 変装だったの！？"]),
        LQ("紘", "なぜ 試したの？", ["レオ｜君が どこまで 見破れるか 知りたかったんだ。"],
            [["相手を だます ことが 目的の いたずらは？", "人を 困らせる ので よくない。 でも 学びに 変えることは できる", ["だます ほうが 賢い", "やられたら やり返す"], "紘｜だまされて 困った 人も いたよ。", "紘｜そうだね。 今回の 経験を 防犯の 学びに 変えよう。"]]),
        LB("レオ", "レオと 最終対決", ["レオ｜最後に 全力で 勝負だ！ 僕の 変装を 見破れるかな？"], SBF("ssb", 20, "レオ", "🦎", "見事！", 1.3),
            ["レオ｜降参だ。 これからは 人を 楽しませる 変装だけにするよ。"]),
        LP("蒼", "みんなの 笑顔", ["蒼｜みんな 無事で よかった！", "康介｜紘、お疲れ！", "羽鳥彦｜よくがんばったな、紘。"]),
    ],
    talks:[["みんなの 写真", ["みんなの 写真｜ぱしゃり！ いい 笑顔だね。", "みんなの 写真｜詐欺や デマに 気をつけて 暮らそうね。"]]],
    fin:["語り手｜『リプレイワールド』は かんけつ。 詐欺・ニセ情報・ルールの 大切さを まなんだね。", "語り手｜Map2の 任意サブストーリー、おしまい！"],
    learn:"だまされない 力は 日々の 知識から。 学びを 家族や 友だちにも 伝えよう。"});


/* ==== game/ssc.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[53]=1;
"use strict";
// ===== Map3 サブ：人生2周目（前編10話・後編10話）=====
SB("ssc", 1, {title:"前編① 不採用の 夜", area:"人生2周目 前編", theme:"night", bgm:"town",
    intro:["語り手｜2025年12月、アカリ市。 28さいの 蒼太は また 不採用通知を 受け取った。", "語り手｜ここから 『人生2周目』の 物語が はじまる。"],
    steps:[
        LP("蒼太", "また 不採用", ["蒼太｜また 不採用か…。 10社目だ。", "蒼太｜俺の 人生って、なんだったんだろう。"]),
        LQ("蒼太", "なぞの 通知", ["（スマホに『運命開発株式会社』から 通知が 届いた。）", "蒼太｜怪しい。 でも、どうせ 失うものなんて…。"],
            [["落ちこんでいる ときに うまい 話が 来たら？", "気持ちが 弱い ときほど、いったん 落ち着いて 人に 相談する", ["すぐ 飛びつく", "だれにも 言わずに 一人で 決める"], "蒼太｜弱った 時ほど 冷静に ならなきゃ。", "蒼太｜そうだね。 いったん 相談してから 決めよう。"]]),
        LP("蒼太", "運命が 動く", ["（蒼太は 『はい』を おした。 部屋の 電気が 消えて、運命が 大きく 動きはじめた。）"]),
    ],
    talks:[["となりの おじさん", ["となりの おじさん｜元気を 出して。 次は きっと うまく いくよ。", "となりの おじさん｜困った ときは 相談してね。"]]],
    fin:["語り手｜蒼太は 新しい アプリの 開発へ…。", "語り手｜次の 話では アプリの ひみつが 明らかに。"],
    learn:"落ちこんだ ときほど 冷静に。 うまい 話は 人に 相談しよう。"});

SB("ssc", 2, {title:"前編② 運命書き換えアプリ", area:"人生2周目 前編", theme:"lab", bgm:"town",
    intro:["語り手｜さえこが アプリの ひみつを 蒼太に 明かす。", "語り手｜『過去の 選択を 書き換えて 未来を 変える』アプリだ。"],
    steps:[
        LP("さえこ", "アプリの 説明", ["さえこ｜このアプリは、ユーザーの 過去を 書き換えて、未来を 変えられます。", "蒼太｜でも それって 倫理的に 問題が あるんじゃ…？"]),
        LQ("蒼太", "失敗を いかす", ["さえこ｜あなたは たくさん 失敗してきた。 だからこそ 危険性が わかるはず。"],
            [["失敗した 経験は どう いかせる？", "次に 同じ ミスを しないよう 気をつけたり、他の 人に 注意したり できる", ["失敗は 隠す", "全部 他人の せいにする"], "蒼太｜失敗から 学べば 力になる。", "蒼太｜そうだ。 失敗は 次の 力に なる。"]]),
        LP("蒼太", "開発開始", ["蒼太｜わかりました。 やります。", "さえこ｜素晴らしい。 では 早速 開発を はじめましょう。"]),
    ],
    talks:[["研究室の ロボ", ["研究室の ロボ｜ピポ。 失敗は データ。 次に つなげよう。", "研究室の ロボ｜安全第一！"]]],
    fin:["語り手｜アプリが 完成して 数週間後、蒼太は 異変に 気づく…。", "語り手｜龍之介との 出会い。"],
    learn:"失敗は 学びの 材料。 次に いかすことが 大切。"});

SB("ssc", 3, {title:"前編③ 龍之介の 手助け", area:"人生2周目 前編", theme:"night", bgm:"cave",
    intro:["語り手｜蒼太が 目を さますと、そこは 薄暗い 地下の 部屋だった。", "語り手｜そこに 老人が 入ってくる。"],
    steps:[
        LP("龍之介", "創設者", ["龍之介｜私は 龍之介。 運命開発の 創設者だ。", "龍之介｜さえこは 暴走している。 私は 彼女を 止めたい。"]),
        LQ("蒼太", "信じて いい？", ["蒼太｜なんで 俺を 信じるんですか？", "龍之介｜君の 目を 見れば わかる。"],
            [["初めて 会った 人の 言葉を 信じる とき、大切な ことは？", "話を 聞いたうえで、行動や 事実を 見て 少しずつ たしかめる", ["顔の 印象だけで 決める", "何でも 疑って 話を 聞かない"], "蒼太｜話を 聞きつつ、事実も 見よう。", "蒼太｜そう。 少しずつ たしかめて 信頼を 築く。"]]),
        LP("龍之介", "逃がす", ["龍之介｜アプリを 完成させて、さえこより 先に 使うんだ。 さあ 行け。"]),
    ],
    talks:[["地下の 灯り", ["地下の 灯り｜ぽぅ。 暗い 時は 友だちの 声を 聞こう。", "地下の 灯り｜助けられたら ありがとうを 言おうね。"]]],
    fin:["語り手｜蒼太は 開発室に もどるが、さえこは すでに 姿を 消していた。", "語り手｜さえこは アプリで 2010年代に タイムスリップしてしまった。"],
    learn:"人を 信じる ときは、話と 事実を 少しずつ 確かめよう。"});

SB("ssc", 4, {title:"前編④ 紘への 手紙", area:"人生2周目 前編", theme:"town", bgm:"town",
    intro:["語り手｜さえこが 消えた。 蒼太は ニュースで『予言が 的中した 探偵』を 知る。", "語り手｜その名は 坂口紘。 蒼太は 紘に 手紙を 書く。"],
    steps:[
        LP("アナウンサー", "ニュース", ["アナウンサー｜坂口 紘さんの 予言が 今年も 的中しました！", "蒼太｜こいつだ。 手紙を 送って 過去へ 行ってもらおう。"]),
        LQ("蒼太", "手紙の 書き方", ["（蒼太は 手紙に 依頼の 内容を 書こうとして いる。）"],
            [["初めて 会う 人に 手紙で 頼みごとを するとき、大切な ことは？", "目的と お願いを ていねいに 書き、相手が 断れる ように する", ["命令口調で 書く", "うそを 書いて 動かす"], "蒼太｜相手の 気持ちを 考えて 書こう。", "蒼太｜そう。 ていねいに、断る自由も 大切に。"]]),
        LP("紘", "手紙を 読む", ["紘｜へぇ、なるほどね。 依頼を 引き受けてみるか。", "（紘は クリスマスの 夜に サンタさんに お願いした。）", "紘｜過去に タイムスリップする アプリの QRコードが ほしいです！"]),
    ],
    talks:[["サンタ（蒼太）", ["サンタ（蒼太）｜ホーホー。 プレゼントは 手紙の 中だよ。", "サンタ（蒼太）｜優しい 気持ちで 贈るのが 一番だね。"]]],
    fin:["語り手｜紘に アプリが 届いた。", "語り手｜次の 話から、紘の 『人生2周目』が はじまる！"],
    learn:"頼みごとは ていねいに。 相手の 気持ちを 考えて 書こう。"});

SB("ssc", 5, {title:"前編⑤ 5さいに なった 紘", area:"人生2周目 前編", theme:"school", bgm:"town",
    intro:["語り手｜紘が アプリを 立ち上げると、まっくらに。『2011年3月10日へ 飛びます』", "語り手｜気がつくと 紘は 5さいの 幼稚園児に なっていた。"],
    steps:[
        LP("紘", "鏡の 中の 自分", ["紘｜体は 5さい。 でも 頭は 大人のまま。 つまり 天才幼稚園児だ。"]),
        LQ("紘", "地震の 前日", ["紘｜明日、大きな 地震が ホクト地方で 起こるから、非常食を 買っておいた方が いいよ！", "先生｜そんな こわい こと 言わないの。"],
            [["『大きな 災害が 来る』と 知っている ときの 伝え方は？", "落ち着いて 具体的な 備えを 提案する（水・食べ物・避難場所）", ["こわい 言葉で おどす", "自慢のように 言う"], "紘｜こわがらせるのは よくない。 備えを 伝えよう。", "紘｜そう。 具体的に 備える ことを すすめよう。"]]),
        LP("先生", "信じてもらえない", ["先生｜君は そういう 怖い 話が 好きだもんね。 ほどほどにね。", "紘｜ほんとだもん！ 外れたら バカにしていいよ！"]),
    ],
    talks:[["幼稚園の 子", ["幼稚園の 子｜ひろくん すごいね！ 何でも 知ってるの？", "幼稚園の 子｜非常食って なあに？"]]],
    fin:["語り手｜紘の 予言は 先生に 信じてもらえなかった。", "語り手｜翌日、3月11日…。"],
    learn:"災害の 備えは、具体的に 落ち着いて 伝えよう。"});

SB("ssc", 6, {title:"前編⑥ 的中、そして 人気者", area:"人生2周目 前編", theme:"school", bgm:"town",
    intro:["語り手｜2011年3月11日14時46分。 大きな ゆれが 起こった。", "語り手｜紘の 予言は 的中した。 その後、紘の 周りの 空気が 変わっていく。"],
    steps:[
        LP("先生", "予言的中", ["先生｜えぇ、すごい！ 予想が 当たった！", "（ラジオでは『5さいの 幼稚園児が 地震を 予言！？』と 流れた。）"]),
        LQ("紘", "人気者の 影", ["紘｜みんなが ほめてくれる。 でも 一部の 人は 紘を にらんで いた。"],
            [["有名に なって 注目されたら、気を つけることは？", "自慢せず、人を 傷つける 言い方を さけ、困ったら 大人に 相談する", ["調子に のって 予言を 連発する", "周りを 見下す"], "紘｜みんなの 気持ちを 考えよう。", "紘｜そう。 目立つほど 言い方に 気をつけよう。"]]),
        LP("近所の 人", "さまざまな 声", ["近所の 人｜予言が 当たって すごいね。", "別の 人｜いや、あんな 予言を するから 不安に なる人も いるんだ。"]),
    ],
    talks:[["ラジオ番組", ["ラジオ番組｜今日の ニュースは…。 情報は 落ち着いて 受け止めよう。", "ラジオ番組｜デマには 注意！"]]],
    fin:["語り手｜紘は 一躍 有名に なったが、批判する 人も 現れた。", "語り手｜小学校へ 進む 紘。"],
    learn:"目立つ ことには 良い面も 悪い面も ある。 言い方に 気をつけよう。"});

SB("ssc", 7, {title:"前編⑦ 予言少年と 呼ばれて", area:"人生2周目 前編", theme:"school", bgm:"cave",
    intro:["語り手｜小学校に 入学した 紘は『予言少年』と 呼ばれ、人気者に。", "語り手｜ところが 4年生の 引っ越し先では、うわさを 知った 子たちから いじわるを 受けてしまう。"],
    steps:[
        LP("同級生", "ひどい 言葉", ["同級生｜お前 変な 予言するな！", "（机には 傷つく 落書きが 書かれていた。 授業を 受けるのも つらい 日々。）"]),
        LQ("紘", "いじわるを 受けたら", ["紘｜つらいけれど、どうしたら…。"],
            [["いじわるを 受けたとき、いちばん 大切な ことは？", "一人で 我慢せず、先生や 家族、相談窓口に 話す", ["やり返す", "だれにも 言わず 学校を 休み続ける"], "先生｜話してくれて ありがとう。 一緒に 考えよう。", "先生｜そう。 一人で 抱えないで。 話すことが 第一歩。"]]),
        LP("先生", "味方が いる", ["先生｜あなたは 悪くない。 いじわるは 絶対に だめな こと。", "紘｜ありがとうございます。 すこし 楽に なりました。"]),
    ],
    talks:[["スクールカウンセラー", ["スクールカウンセラー｜いつでも 話を 聞くよ。", "スクールカウンセラー｜つらい ときは 休んでも いい。"]]],
    fin:["語り手｜いじわるは どんな 理由でも いけない。 紘は 引っ越して 新しい 環境へ。", "語り手｜新しい 学校で…。"],
    learn:"いじわるは 絶対に だめ。 つらい ときは 一人で 抱えず 相談しよう。"});

SB("ssc", 8, {title:"前編⑧ ゲーム好きの 人気者", area:"人生2周目 前編", theme:"town", bgm:"town",
    intro:["語り手｜5年生で また 新しい 環境に。 そこでは『ゲーム好き』として 人気者に なれた。", "語り手｜予言の 話は だれも 知らず、紘は ほっと した。"],
    steps:[
        LP("ゲーム仲間", "ゲーム仲間", ["ゲーム仲間｜紘、新作 やった？", "紘｜やったよ！ 今日も 公園で 対戦しよう！"]),
        LQ("紘", "勉強と 遊び", ["（毎日 ゲームばかり で、勉強は ほとんど していなかった。）"],
            [["遊びと 勉強の 両立で 大切な ことは？", "時間を 決めて、やることを バランスよく する", ["遊びだけ する", "勉強だけ して 友だちと 遊ばない"], "紘｜テストが 近づくと あせるね…。", "紘｜そう。 時間を 決めて バランスよく。"]]),
        LP("母", "お母さんの 声", ["お母さん｜ゲームも いいけど、宿題や 勉強も 大事よ。", "紘｜わかってる。 少しずつ やるよ。"]),
    ],
    talks:[["公園の 子", ["公園の 子｜一緒に ゲームしようぜ！", "公園の 子｜夕方には 帰ろうね。"]]],
    fin:["語り手｜予言を 知らない 友だちとは 気軽に 話せた。", "語り手｜中学へ 進学。"],
    learn:"遊びと 勉強は バランスよく。 時間を 決めて 取り組もう。"});

SB("ssc", 9, {title:"前編⑨ 部活ばかりの 毎日", area:"人生2周目 前編", theme:"school", bgm:"field",
    intro:["語り手｜中学生に なった 紘は 部活動に 入部。 土日も ほとんど 部活で、勉強の 時間は ほぼゼロ。", "語り手｜中学3年の 秋、紘は また『ボロ』を 出してしまう。"],
    steps:[
        LP("部活の 先輩", "いそがしい 毎日", ["部活の 先輩｜今日も 練習だぞ！", "紘｜はい！ …でも 勉強が 気になるなぁ。"]),
        LQ("紘", "つい 口が すべる", ["（受験の プレッシャーで、紘は つい 未来の 話を してしまった。）", "紘｜数か月後に『ノロマ風邪』という 病気が 世界で 流行する。 外に 出られなくなるよ。"],
            [["未来の 話を 信じてもらえない とき、どう 伝えるのが いい？", "証拠と 根拠を 示し、あせらず 少しずつ 話す", ["怒って 無理に 信じさせる", "うそつきと 言われたら あきらめる"], "友だち｜証拠もなしに 言われても 信じられないよ。", "友だち｜根拠を 示して 話してくれたら 聞けるかも。"]]),
        LP("友だち", "信じてもらえない", ["友だち｜うそつけ！ 世界が 変わる わけ ない！", "友だち｜お前は 受験の プレッシャーで 変に なっちゃったんだろ。"]),
    ],
    talks:[["部活の 顧問", ["部活の 顧問｜勉強との 両立も 忘れずにな。", "部活の 顧問｜体調管理も 大事だぞ。"]]],
    fin:["語り手｜紘の 言葉は 信じてもらえなかった。", "語り手｜2020年2月、ノロマ風邪が 広がる…。"],
    learn:"信じてもらうには 根拠と 証拠が 必要。 あせらず ていねいに 話そう。"});

SB("ssc", 10, {title:"前編⑩ 休校の 日", area:"人生2周目 前編", theme:"town", bgm:"cave",
    intro:["語り手｜2020年2月。『ノロマ風邪』が 広がり、総理大臣は 緊急事態宣言を 出した。", "語り手｜学校は 休校。 外に 出られない 日々が はじまった。"],
    steps:[
        LP("ニュース", "緊急事態宣言", ["ニュース｜感染拡大を 防ぐため、学校は 休校と なります。", "紘｜本当に 来ちゃったか…。"]),
        LQ("紘", "家で 過ごす", ["（家に 閉じこもる 日が 続く。 友だちからは 『お前の 予言の せいだ』と メッセージが 届いた。）"],
            [["責められる メッセージを 受け取ったら？", "返信せず、信頼できる 大人に 相談する。 画面を 保存しておく", ["怒って 言い返す", "全員に 反論を 拡散する"], "紘｜けんかが 広がると 悪化するね。", "紘｜そう。 保存して 相談しよう。"]]),
        LP("紘", "怪しい 影", ["紘｜体格も ばれているし、顔を 見られたら 危ない。 …それに、すぐ ばれるのは おかしい。 裏で だれかが 仕込んでるはず。", "（そのとき、物陰から 逃げていく 人影が…！）", "紘｜あいつだ！ 待て！"]),
    ],
    talks:[["近所の 人", ["近所の 人｜外に 出られなくて 大変ね。", "近所の 人｜助け合って 乗り越えよう。"]]],
    fin:["語り手｜前編は ここまで。 紘は 人影を 追いかけた。", "語り手｜後編へ つづく。"],
    learn:"責める メッセージは 保存して、大人に 相談。 けんかを 広げない。"});

SB("ssc", 11, {title:"後編① 追いかけた 先に", area:"人生2周目 後編", theme:"night", bgm:"field",
    intro:["語り手｜2020年3月。 紘は 逃げる 人影を 追いかけた。", "語り手｜追いついた 先で 見たものは…。"],
    steps:[
        LP("さえこ", "追いつめた", ["さえこ｜やばい！", "紘｜さえこさん、あなたが 世間に ばらまいたんだな！", "さえこ｜ごめんなさい！"]),
        LQ("紘", "なぜ？", ["紘｜どうして そんな ことを したんですか？"],
            [["相手が 事情を 話し始めたら？", "さえぎらず、最後まで 話を 聞く", ["話を 聞かず 責める", "笑いものに する"], "さえこ｜話も 聞かないで 責められても…。", "さえこ｜聞いてくれて ありがとう。 実は…。"]]),
        LP("さえこ", "さえこの 事情", ["さえこ｜2011年の 震災で、おばあちゃんが 遠くへ 避難して、ずっと 会えなく なったの。", "さえこ｜予言した 人を ずっと うらんで いたの。"]),
    ],
    talks:[["夜の 街灯", ["街灯｜ぱち。 夜道は 一人で 歩かない ように。", "街灯｜話し合いは 明るい 場所で。"]]],
    fin:["語り手｜さえこの 気持ちが 少し わかった。", "語り手｜つぎは さえこの おこりの 理由。"],
    learn:"相手の 話を 最後まで 聞くと、気持ちが 見えてくる。"});

SB("ssc", 12, {title:"後編② さえこの 怒り", area:"人生2周目 後編", theme:"night", bgm:"castle",
    intro:["語り手｜さえこは 予言をした 紘を うらんでいると 言った。", "語り手｜紘は 気持ちを 伝えようとする。"],
    steps:[
        LQ("紘", "気持ちを 伝える", ["紘｜僕は 未来から 来て、起こる ことを 伝えただけ。 傷つけたかった わけじゃない。"],
            [["相手を 傷つけて しまった ことに 気づいたら？", "言い訳せず、まず 謝って 気持ちを 受け止める", ["自分は 悪くないと 言い張る", "知らんぷりをする"], "紘｜まずは ごめんなさい と 言おう。", "紘｜そう。 受け止める ことから 始めよう。"]]),
        LP("さえこ", "もう近づかないで", ["さえこ｜もう これ以上 近づかないで！ 近づいたら、アプリで 世界を めちゃくちゃに するから！", "紘｜落ち着け。 それだけは しちゃだめだ。"]),
        LP("さえこ", "くやしさ", ["さえこ｜みんな 家に 閉じこもってる。 私の 気持ちを 伝えるには 今しか ないの！", "紘｜そんなことしたら、みんな 悲しむだけだ。"]),
        LB("さえこの かげ", "さえこの かげ", ["（さえこの 怒りが かたちに なって、『さえこの かげ』が あらわれた！）", "さえこの かげ｜わかってよ…わかってよ！"], SBF("ssc", 12, "さえこの かげ", "🌑", "…ごめんなさい。"),
            ["さえこ｜…ごめん。 取り乱した。"]),
    ],
    talks:[["通りの 猫", ["通りの 猫｜にゃあ。 深呼吸、すぅ…はぁ…。", "通りの 猫｜落ち着けば 話せるにゃ。"]]],
    fin:["語り手｜怒りが 爆発しそうに なった さえこを、紘は 必死に 落ち着かせた。", "語り手｜つぎは 説得の 場面。"],
    learn:"怒った 相手には、まず 受け止めて 落ち着いて 話そう。"});

SB("ssc", 13, {title:"後編③ 調子に のって いた？", area:"人生2周目 後編", theme:"stage", bgm:"castle",
    intro:["語り手｜さえこは 紘に 言った。『君も 調子に のって いたでしょ？』", "語り手｜紘は 自分の 言動を ふりかえる。"],
    steps:[
        LP("さえこ", "同類だよ", ["さえこ｜予言が 当たって 自慢して、うわさ話に して、都市伝説に なるんでしょ？", "さえこ｜君も 調子に のって たから、同類よ。"]),
        LQ("紘", "ふりかえり", ["（紘は 5さいの ころ、ほめられて 少し 得意に なっていた ことを 思い出した。）"],
            [["自分の 言動を 反省して 相手に 伝える とき？", "正直に 認めて、これから どう するかを 伝える", ["全部 否定する", "逆ギレする"], "紘｜確かに 調子に のってた 部分も あった。", "紘｜そう。 認めて、これからを 約束しよう。"]]),
        LP("紘", "約束", ["紘｜ごめん。 僕は 人の 気持ちを 考えきれて いなかった。", "紘｜これからは 人を 守る ために 力を 使う。"]),
    ],
    talks:[["さえこの 友だち", ["さえこの 友だち｜さえこ、無理しないでね。", "さえこの 友だち｜つらい ときは 話してね。"]]],
    fin:["語り手｜紘は 自分の 言動を 認め、約束を した。", "語り手｜そのとき…。"],
    learn:"自分の 言動を ふりかえり、正直に 認め、これからを 約束しよう。"});

SB("ssc", 14, {title:"後編④ 警察が 来た！", area:"人生2周目 後編", theme:"night", bgm:"cave",
    intro:["語り手｜突然、サイレンの 音が 響いた。 警察が 駆けつけたのだ。", "語り手｜その 現場に、あの 老人が 現れた。"],
    steps:[
        LP("警察", "そこを 動くな", ["警察｜2人とも そこを 動くな！", "紘｜やべっ。"]),
        LQ("老人", "龍之介の 判断", ["老人｜紘くん、ここは 私が どうにかする。 君は アプリで 元の世界に 戻ってくれ。"],
            [["警察の 人が 来たとき、正しい 対応は？", "落ち着いて 事情を 正直に 話し、言うことを きく", ["逃げ回る", "うそを つく"], "老人｜逃げると 余計に 疑われるよ。", "老人｜その とおり。 正直に 話すのが 一番。"]]),
        LB("警備ロボ", "警備ロボ", ["（そのとき、さえこが 呼んだ 警備ロボが 割って入った！）", "警備ロボ｜ガガガ…侵入者を 確認！"], SBF("ssc", 14, "警備ロボ", "🤖", "ガ…ガ…停止します。"),
            ["老人｜行きなさい！", "紘｜わかりました！"]),
        LP("紘", "元の世界へ", ["紘｜龍之介さん、ありがとう。", "（紘は アプリで 2025年12月の 世界へ 戻った。）"]),
    ],
    talks:[["通りがかりの 人", ["通りがかりの 人｜何か 事件ですか？", "通りがかりの 人｜落ち着いて 離れましょう。"]]],
    fin:["語り手｜紘は 元の 世界へ 帰ってきた。", "語り手｜そこは 牢屋のような 部屋…。"],
    learn:"警察と 話すときは 正直に。 助けてくれた 人に 感謝しよう。"});

SB("ssc", 15, {title:"後編⑤ 地下の 再会", area:"人生2周目 後編", theme:"lab", bgm:"cave",
    intro:["語り手｜2025年12月。 紘が 目を さますと 地下の 部屋に いた。", "語り手｜そこには 龍之介と 蒼太が 待っていた。"],
    steps:[
        LP("龍之介", "龍之介の 説明", ["龍之介｜あの後、私は 警察署に 行ったが、さえこに 捕まって ここに いる。", "紘｜さえこは まだ 捕まって いないんですか？"]),
        LP("蒼太", "手紙の 差出人", ["蒼太｜はじめまして。 手紙を 送った 蒼太です。", "蒼太｜自分に 良い 考えが あります。"]),
        LQ("紘", "どうしたら いい？", ["紘｜アプリは 危険だ。 でも 使えなくなるのは 困る…。"],
            [["危険な 道具を どう 扱えば いい？", "使い方に ルールを つくり、必要なら 使うのを やめる 決断も する", ["全部 好きに 使う", "こっそり 隠す"], "蒼太｜ルールを 作って 守る。 それが 大事だ。", "蒼太｜その とおり。 やめる 決断も 勇気だよ。"]]),
        LP("龍之介", "アプリは 消える", ["龍之介｜私の アプリは 消えてしまうがな。", "紘｜もう 過去には 行けない…。", "蒼太｜過去に とらわれず、未来に 向かって 進みましょう！"]),
    ],
    talks:[["地下の 灯り", ["地下の 灯り｜ぽぅ…。 仲間が いれば 心強いね。", "地下の 灯り｜未来は 自分で つくろう。"]]],
    fin:["語り手｜3人は アプリを 修正して、さえこを 止める 作戦を 立てた。", "語り手｜つぎは アプリの コード修正。"],
    learn:"危険な 道具は ルールを 作って 使う。 やめる 勇気も 大切。"});

SB("ssc", 16, {title:"後編⑥ コードを 直せ！", area:"人生2周目 後編", theme:"lab", bgm:"field",
    intro:["語り手｜蒼太は アプリの コードを 修正する。", "語り手｜Enterを おすと、アプリ そのものが 消える 仕組みだ。"],
    steps:[
        LQ("蒼太", "確認の 大切さ", ["蒼太｜修正した コードを 実行する 前に、もう一度 確認しよう。"],
            [["大事な 操作を 実行する 前に すること？", "内容を 見直し、元に 戻せるか 確かめる", ["急いで すぐ 押す", "確認せず 他の 人に 任せる"], "紘｜押したら 元に 戻せないかも。 見直そう。", "紘｜そう。 実行前の 見直しは 大事。"]]),
        LP("紘", "Enterを 押すと？", ["紘｜Enterを 押すと アプリ自体が 消えちゃうんですか？", "蒼太｜その とおりです。"]),
        LB("プログラムくん", "プログラムくん", ["（そのとき コードの 中から『プログラムくん』が 現れて いたずらを はじめた！）", "プログラムくん｜ぴこぴこ！ 消されて たまるか〜！"], SBF("ssc", 16, "プログラムくん", "💾", "ぴこ…さようなら。"),
            ["蒼太｜よし、コードの 修正は 完了だ。"]),
        LP("蒼太", "準備完了", ["蒼太｜あとは さえこに 最後の 説得を するだけだ。"]),
    ],
    talks:[["キーボード", ["キーボード｜かたかた。 確認してから 押そう。", "キーボード｜実行前に 見直しだよ。"]]],
    fin:["語り手｜コードの 修正が 終わった。", "語り手｜さえこの もとへ 向かおう。"],
    learn:"大事な 操作の 前には 見直しと 確認を。"});

SB("ssc", 17, {title:"後編⑦ さえことの 最後の 対話", area:"人生2周目 後編", theme:"stage", bgm:"castle",
    intro:["語り手｜紘たちは さえこの もとへ。", "語り手｜力ではなく、話し合いで 気持ちを 伝える。"],
    steps:[
        LP("さえこ", "さえこの 本音", ["さえこ｜私は ただ、おばあちゃんの 気持ちを 分かってほしかっただけ…。"]),
        LQ("紘", "どう 答える？", ["紘｜おばあちゃんは さえこさんが 悲しむのを 望まないはずだよ。"],
            [["悲しんでいる 人に 寄りそう 言葉は？", "気持ちを 受け止め、『一人じゃない』と 伝える", ["『気にしすぎ』と 言う", "『忘れなよ』と 言う"], "さえこ｜気にしすぎ じゃない！", "さえこ｜…ありがとう。 少し 気持ちが 軽くなった。"]]),
        LB("さえこ", "最後の 対決", ["さえこ｜でも 私は 止まれない…！"], SBF("ssc", 17, "さえこ", "🕴️", "…ごめんなさい。", 1.25),
            ["さえこ｜…もう やめる。 ごめんなさい。"]),
        LP("蒼太", "アプリを 消す", ["蒼太｜さえこさん、アプリを 消すよ。", "さえこ｜…うん。"]),
    ],
    talks:[["夜明けの 空", ["夜明けの 空｜明るく なってきたね。", "夜明けの 空｜新しい 一日が はじまるよ。"]]],
    fin:["語り手｜さえこは 自分の 気持ちに 気づいた。", "語り手｜つぎは 最後の 場面。"],
    learn:"悲しんでいる 人には 気持ちを 受け止め『一人じゃない』と 伝えよう。"});

SB("ssc", 18, {title:"後編⑧ アプリが 消える", area:"人生2周目 後編", theme:"lab", bgm:"castle",
    intro:["語り手｜いよいよ Enterを おす 時が 来た。", "語り手｜アプリは 消え、みんなの 記憶も…。"],
    steps:[
        LP("蒼太", "Enter！", ["蒼太｜みんな、いくよ。", "蒼太｜Enter！"]),
        LP("さえこ", "光の 中", ["さえこ｜うわー、アプリがぁ…。", "（まぶしい 光が 広がり、さえこの 記憶が 静かに 消えていった。）"]),
        LQ("紘", "忘れても 大丈夫", ["紘｜記憶が 消えても、大切な 気持ちは 心に 残る かな。"],
            [["つらい 思い出や 出来事を どう 受け止める？", "学んだ ことを 心に 残し、今から 一歩ずつ 進む", ["全部 なかった ことに する", "ずっと 引きずる"], "蒼太｜忘れても、学んだ ことは 残るよ。", "蒼太｜そう。 前を 向いて 一歩ずつ。"]]),
        LB("時間の 番人", "時間の 番人", ["（最後に 時間の 番人が 現れ、３人を 見送りに 来た。）", "時間の 番人｜お見事だった。 最後に 力くらべを！"], SBF("ssc", 18, "時間の 番人", "⏳", "…ありがとう。", 1.3),
            ["時間の 番人｜気をつけて 帰りなさい。"]),
    ],
    talks:[["光の 粒", ["光の 粒｜きらきら。 思い出は 心の 中に。", "光の 粒｜未来へ 進もう。"]]],
    fin:["語り手｜アプリは 消え、世界は もとの 静けさを 取り戻した。", "語り手｜つぎは エピローグ。"],
    learn:"つらい 出来事から 学んだ ことは 心に 残る。 前を 向いて 進もう。"});

SB("ssc", 19, {title:"後編⑨ 2025年の クリスマス", area:"人生2周目 後編", theme:"town", bgm:"town",
    intro:["語り手｜2025年12月25日。 紘は いつも どおり 家に 帰った。", "語り手｜アプリの こと、さえこの こと…すべて 夢のようだった。"],
    steps:[
        LP("紘", "ひとりの クリスマス", ["紘｜クリスマス…。 一人で チキンを 食べよう。", "（部屋には 小さな ツリーが 飾られていた。）"]),
        LQ("紘", "ひとりでも だいじょうぶ", ["紘｜ひとりでも、クリスマスを 楽しめる かな。"],
            [["ひとりで 過ごす 日を 楽しむ コツは？", "好きな ことを して、ほかの 人に 連絡して 気持ちを 伝える", ["落ちこんで 何も しない", "他人と 比べて いじける"], "紘｜ひとりの 時間も 悪くない。 連絡もしてみよう。", "紘｜そう。 好きな ことを して、感謝を 伝えよう。"]]),
        LP("母", "お母さんから", ["お母さん（電話）｜メリークリスマス。 元気に してる？", "紘｜うん。 ありがとう。"]),
    ],
    talks:[["サンタさん", ["サンタさん｜ホーホー。 いい子には プレゼントを。", "サンタさん｜感謝の 気持ちが 一番の 贈り物だよ。"]]],
    fin:["語り手｜静かな クリスマス。 紘は 少し あたたかい 気持ちに なった。", "語り手｜最終話へ。"],
    learn:"ひとりの 時間も 楽しもう。 感謝の 気持ちを 家族や 友だちに 伝えよう。"});

SB("ssc", 20, {title:"後編⑩ 物語は つづく", area:"人生2周目 後編", theme:"stage", bgm:"demoncastle",
    intro:["語り手｜紘は スマホで ある 物語の 一覧を 見つけた。", "語り手｜そこには たくさんの 物語の 名前が ならんでいた。"],
    steps:[
        LP("紘", "ふしぎな 一覧", ["紘｜やりすぎヒーロー伝説、リプレイワールド、人生2周目…。 たくさんの 物語が 続いているんだな。", "紘｜今年も あと 1週間で 終わるのか。"]),
        LQ("紘", "新しい 年へ", ["紘｜来年は どんな 一年に したいかな。"],
            [["新しい 年に むけて 大切な ことは？", "目標を 小さく 決め、続けられる 習慣から はじめる", ["最初から 完ぺきを 求める", "何も 決めない"], "紘｜まずは 小さな 目標から。", "紘｜そう。 続けられる ことから はじめよう。"]]),
        LB("物語の 番人", "物語の 番人", ["（最後に 『物語の 番人』が 現れた！）", "物語の 番人｜物語は 続く。 でも 今を 大事に ね。"], SBF("ssc", 20, "物語の 番人", "📚", "いい 物語だった。", 1.35),
            ["物語の 番人｜2026年の 新作も 楽しみに しているよ。"]),
    ],
    talks:[["本棚", ["本棚｜ぱらぱら。 物語は 心を 豊かに するよ。", "本棚｜読書の 時間も 大切に。"]]],
    fin:["語り手｜『人生2周目』は かんけつ。 過去より 今、今より 未来へ。", "語り手｜Map3の 任意サブストーリー、おしまい！"],
    learn:"過去に とらわれず、今を 大切に。 未来へ 一歩ずつ 進もう。"});


/* ==== game/sse.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[54]=1;
"use strict";
// ===== Map5 サブ：楽しい時ほど、大さんじ！？（10話）=====
const _SE = "楽しい時ほど、大さんじ！？";
SB("sse", 1, {title:"① デートの 朝", area:_SE, theme:"town", bgm:"town",
    intro:["語り手｜8月16日の 朝。 だいちと まひろ、まひろの 友だち あかりの 3人は 駅前で まちあわせ。","語り手｜今日は ぞうり屋さん、映画、プラネタリウムの 予定だ。"],
    steps:[
        LP("だいち", "まちあわせ", ["だいち｜まひろさん！ おはようございます！ またせて ごめんなさい〜！","まひろ｜おはようございます。 いい お天気ですね。"]),
        LQ("あかり", "ごあいさつ", ["あかり｜どもー！ まひろの 友だちの あかりです！ おじゃまして ごめんね！"],
            [["はじめて 会う 人への あいさつで 大切な ことは？","えがおで 名前を 言って、ていねいに あいさつする",["目を そらして だまる","大声で ふざける"],"だいち｜まずは えがおで 名前を 言おう。","だいち｜そうだね。 えがおの あいさつが 一番！"]]),
        LP("だいち", "今日の プラン", ["だいち｜ぞうり屋さん、映画、プラネタリウムの じゅんで どうでしょう〜！","あかり｜デートプラン かんぺき！ レッツゴー！"]),
    ],
    talks:[["駅前の はと", ["はと｜くるっぽー。 今日は いい 天気だね。","はと｜でも 空の 色は かわるかも…。"]]],
    fin:["語り手｜3人は ぞうり屋さんへ 歩き出した。","語り手｜でも この日は いろいろ おこる 一日に…。"],
    learn:"はじめて 会う 人には えがおで あいさつ。"});

SB("sse", 2, {title:"② ぞうり屋さんの 前で", area:_SE, theme:"shop", bgm:"town",
    intro:["語り手｜しずかな 路地の ぞうり屋さん。 まひろは うっとり。","語り手｜そのとき、店の 外から 大きな 声が きこえた。"],
    steps:[
        LP("まひろ", "すてきな ぞうり", ["まひろ｜わぁ、すてき。 職人さんの 手しごとが 見えますね。"]),
        LP("お父さん", "大きな 声", ["お父さん｜いいかげんに しなさい！ いつも どうして そうなんだ！","（男の子は 小さな かたを ふるわせて 泣いている。）"]),
        LQ("だいち", "どうする？", ["だいち｜ほうっては おけない…！"],
            [["子どもが 大人に きつく しかられて 泣いていたら？","やさしく 声を かけて、近くの 大人や お店の 人に 助けを よぶ",["見て見ぬふりを する","大人に 大声で いいかえす"],"だいち｜けんかに ならないように 気をつけよう。","だいち｜そう。 おだやかに 間に 入って 助けを よぼう。"]]),
        LB("ぷんぷん お父さん", "ぷんぷん", ["（ぷんぷん おこる 『ぷんぷん お父さん』が あらわれた！ ※ごっこ あそびの たたかいだよ）","ぷんぷん お父さん｜むむむ！ おこったぞー！"], SBF("sse", 2, "ぷんぷん お父さん", "😤", "…ごめん。 おちついたよ。"),
            ["お父さん｜…すまなかった。 かっと なりすぎた。"]),
    ],
    talks:[["ぞうり屋さんの 店主", ["店主｜ようこそ。 ゆっくり 見て いってね。","店主｜ぞうりは 足に あわせて えらぶんだよ。"]]],
    fin:["語り手｜だいちは 男の子に そっと 声を かけた。","だいち｜もう だいじょうぶ。 こわかったね。"],
    learn:"こまっている 子には やさしく 声を かけ、まわりの 大人に つなごう。"});

SB("sse", 3, {title:"③ 男の子の 気持ち", area:_SE, theme:"park", bgm:"town",
    intro:["語り手｜男の子は しゃくりあげながら 話しはじめた。","語り手｜まひろが そっと せなかを さする。"],
    steps:[
        LP("男の子", "ぽつり", ["男の子｜ぼく、テストで 点が わるくて…。 おこられたの。"]),
        LQ("まひろ", "気持ちを きく", ["まひろ｜そうだったんですね。 つらかったですね。"],
            [["泣いている 子の 話を きくとき 大切な ことは？","さえぎらず、うなずいて 気持ちを うけとめる",["すぐに 説教する","『泣くな』と 言う"],"まひろ｜まずは 気持ちを うけとめましょう。","まひろ｜そう。 きいて もらうだけで ほっと します。"]]),
        LP("あかり", "はげまし", ["あかり｜点数が すべてじゃ ないよ！ 次に がんばれば いいのさ！","男の子｜…うん！"]),
    ],
    talks:[["ブランコ", ["ブランコ｜きぃこ。 のんびり ゆれよう。","ブランコ｜つらい ときは 深呼吸だよ。"]]],
    fin:["語り手｜男の子の お母さんが むかえに きた。","語り手｜一けん らくちゃく…。 でも 空が くもってきた。"],
    learn:"泣いている 人の 話は、さえぎらずに 最後まで きこう。"});

SB("sse", 4, {title:"④ ゲリラ ごうう！", area:_SE, theme:"night", bgm:"field",
    intro:["語り手｜ゴロゴロ…！ 空が 急に まっくらに なった。","語り手｜ざあざあと 大つぶの 雨が ふりだす！"],
    steps:[
        LP("あかり", "うそでしょ", ["あかり｜天気予報は 10パーセント だったじゃん！","まひろ｜ゲリラごうう でしょうか。"]),
        LQ("だいち", "雷の ときは？", ["だいち｜みなさん、あの スーパーに 駆け込みましょう！"],
            [["かみなりが 鳴っている ときの すごし方は？","じょうぶな 建物の 中に 入り、外や 高い 木の 下は さける",["開けた 場所に 立つ","木の 下で 雨やどり"],"だいち｜あぶない 場所は さけよう。","だいち｜そう。 建物の 中が 安全だよ。"]]),
        LB("雨くも ゴロゴロ", "雨くも", ["（空から 『雨くも ゴロゴロ』が おりてきた！ ※ごっこ あそび）","雨くも ゴロゴロ｜ごろごろ！ ざあざあ〜！"], SBF("sse", 4, "雨くも ゴロゴロ", "⛈️", "ごろ…はれたよ。"),
            ["だいち｜ふぅ、スーパーに つきました！"]),
    ],
    talks:[["スーパーの 店員", ["店員｜いらっしゃいませ。 タオルを どうぞ。","店員｜雨宿りは 安全な ところで ね。"]]],
    fin:["語り手｜3人は ずぶぬれ。 タオルで ふいて ひと休み。","語り手｜すると 店内が さわがしく…。"],
    learn:"雷の ときは、じょうぶな 建物の 中へ。"});

SB("sse", 5, {title:"⑤ お会計しない 男", area:_SE, theme:"shop", bgm:"town",
    intro:["語り手｜スーパーで さわぎが おきた。 ひとりの 男が お会計を せずに 出口へ 走る。","語り手｜店員さんが こまっている。"],
    steps:[
        LP("店員", "お客さん！", ["店員｜お客さん、お会計を まだ…！","男｜どけどけー！"]),
        LQ("だいち", "どうする？", ["だいち｜つかまえに いくのは あぶない。 それなら…。"],
            [["お店で 悪いことを する 人を 見たとき、いちばん いい 行動は？","安全な 場所から 店員さんや 警察に しらせる",["自分で 追いかけて つかまえる","見ない ふりを する"],"だいち｜あぶないから 大人に しらせよう。","だいち｜そう。 しらせるのが 一番 安全！"]]),
        LB("おかし どろぼう", "おかし", ["（にげる 男は 『おかし どろぼう』に へんしん！ ※ごっこ あそび）","おかし どろぼう｜おかしは 全部 もらったー！"], SBF("sse", 5, "おかし どろぼう", "🍬", "ごめんなさい…かえします。"),
            ["店員｜ありがとうございます！ 警察に れんらく しました。"]),
    ],
    talks:[["レジの ロボ", ["レジの ロボ｜ピッ。 お会計は ルールです。","レジの ロボ｜ズルは だめ！"]]],
    fin:["語り手｜男は 屋上へ にげて いった。","語り手｜そのとき 非常階段から 小さな 泣き声が…。"],
    learn:"悪いことを 見たら、自分で なんとかせず 大人や 警察に しらせよう。"});

SB("sse", 6, {title:"⑥ 非常階段の さけび", area:_SE, theme:"lab", bgm:"cave",
    intro:["語り手｜非常階段に 小さな 女の子が とりのこされて いた。","語り手｜ドアが しまって 動けなくなっている。"],
    steps:[
        LP("女の子", "たすけて", ["女の子｜ぐすん…ドアが あかないよ。","だいち｜だいじょうぶ！ すぐ たすけるよ！"]),
        LQ("まひろ", "おちついて", ["まひろ｜女の子を 安心させて あげましょう。"],
            [["こわがっている 子を 助ける とき、まず する ことは？","ゆっくり 話しかけて、安心させる",["大声で せかす","かってに 引っぱる"],"まひろ｜あわてると 余計 こわがります。","まひろ｜そう。 声かけが 一番 大事。"]]),
        LP("あかり", "店員さんへ", ["あかり｜私、店員さんを よんでくる！","だいち｜おねがいします！"]),
    ],
    talks:[["非常口の ライト", ["非常口の ライト｜ぴかぴか。 にげ道は ここだよ。","非常口の ライト｜あわてず 歩こうね。"]]],
    fin:["語り手｜女の子は だいちに しがみついた。","語り手｜屋上へ 向かう ことに…。"],
    learn:"こわがる 子には ゆっくり 話しかけて 安心させよう。"});

SB("sse", 7, {title:"⑦ とざされた 屋上", area:_SE, theme:"night", bgm:"cave",
    intro:["語り手｜屋上への 扉は 電子ロックで しまって いた。","語り手｜ロックは 4けたの 数字だ。"],
    steps:[
        LP("あかり", "ヒントを 発見", ["あかり｜ねぇ、壁に メモが あるよ！『時計の 3時の 方向』って 書いてある。"]),
        LQ("まひろ", "数字なぞ", ["まひろ｜12時を 1として 時計まわりに 数えると…。"],
            [["時計の 12時から 3時の 方向は 何時の 方向？","3（さん）",["6（ろく）","9（きゅう）"],"まひろ｜12時が スタートです。 もう 一度 数えて みましょう。","まひろ｜その とおりです！ 3ですね。"]]),
        LP("だいち", "のこりの 数字", ["だいち｜これで 数字が ひとつ そろった。 のこりも さがそう！"]),
    ],
    talks:[["階段の 看板", ["看板｜屋上は 関係者 いがい 立入禁止。","看板｜ルールは まもろうね。"]]],
    fin:["語り手｜数字は ひとつ 見つかった。","語り手｜のこりの ヒントは？"],
    learn:"なぞ ときは、ヒントを ひとつずつ 順番に。"});

SB("sse", 8, {title:"⑧ 3つの ウソ", area:_SE, theme:"night", bgm:"cave",
    intro:["語り手｜屋上の 扉には 『3つの ウソ』が かくれて いる。","語り手｜ウソを 見やぶると ヒントが 見えるぞ。"],
    steps:[
        LQ("だいち", "ウソ① ", ["だいち｜『東は 時計の 12時の 方向』 これは ほんとう？"],
            [["東は 時計では どこ？（12時が 北）","3時の 方向",["12時の 方向","6時の 方向"],"だいち｜北が 12時なら、東は…。","だいち｜そう！ 最初の ウソは 見やぶった！"]]),
        LQ("あかり", "ウソ② ", ["あかり｜『南は 9時の 方向』 これは？"],
            [["南は 時計では どこ？（12時が 北）","6時の 方向",["9時の 方向","12時の 方向"],"あかり｜北の 反対だよ！","あかり｜ばっちり！ ふたつ 目も 見やぶった！"]]),
        LB("ウソつき ロボ", "ウソつき", ["（ウソを つく 『ウソつき ロボ』が 立ちふさがった！）","ウソつき ロボ｜ぼくの 言う ことは 全部 ウソだよ〜"], SBF("sse", 8, "ウソつき ロボ", "🤥", "ほんとうの こと、言うよ。"),
            ["ウソつき ロボ｜…ほんとうは 2つ 目の 数字は『5』だよ。"]),
    ],
    talks:[["ひそひそ 声", ["ひそひそ 声｜ウソに だまされないで。","ひそひそ 声｜証拠を たしかめるのが 大事。"]]],
    fin:["語り手｜3つの ウソを 見やぶった。","語り手｜数字は あと ひとつ！"],
    learn:"ウソに だまされない ためには、ひとつずつ 事実を たしかめよう。"});

SB("sse", 9, {title:"⑨ 0・5・2・1", area:_SE, theme:"lab", bgm:"castle",
    intro:["語り手｜階段の 下から 足音が 近づいて くる。","語り手｜あと ひとつの 数字で ロックが 開く！"],
    steps:[
        LP("あかり", "かすれた 文字", ["あかり｜扉の すみに チョークの 文字が あるよ。「＋1」って 書いて ある！"]),
        LQ("だいち", "最後の 数字", ["だいち｜『0』『5』『2』と、あと ひとつ。 ヒントは『＋1』…。"],
            [["4けた目の 数字は？（ヒント『1』）","1",["0","9"],"だいち｜ヒントを もう 一度 よく 見て！","だいち｜そう、4けた目は『1』だ！"]]),
        LB("かぎ番人", "かぎ番人", ["（ロックの 前に 『かぎ番人』が あらわれた！）","かぎ番人｜0・5・2・1 を 入れる 前に、わたしと 勝負！"], SBF("sse", 9, "かぎ番人", "🔐", "…あけて いいよ。"),
            ["だいち｜0・5・2・1！ ポチッ！"]),
    ],
    talks:[["ロック", ["ロック｜ピッ。 たしかめながら 入力しよう。","ロック｜あせらず ゆっくり。"]]],
    fin:["語り手｜ピロリ！ 扉の ロックが はずれた！","語り手｜屋上に 出ると、そこには…。"],
    learn:"あせらず ヒントを 組み合わせれば、答えが 見えてくる。"});

SB("sse", 10, {title:"⑩ 虹の あとで", area:_SE, theme:"stage", bgm:"demoncastle",
    intro:["語り手｜屋上に 出ると 雨は あがり、夕やけと 大きな 虹が かかっていた。","語り手｜女の子は 両親の もとへ。 おかしを 持ち出した 男は 警察が 見つけていた。"],
    steps:[
        LP("警察官", "ありがとう", ["警察官｜3人とも ご協力 ありがとうございました！","だいち｜お子さんが 無事で 何よりです。"]),
        LQ("まひろ", "今日の ふりかえり", ["まひろ｜今日は トラブルが おおかったけど、だいちさんの 勇気が すてきでした。"],
            [["たいへんな 一日を おえたとき 大事な ことは？","おたがいに 『ありがとう』を 伝えて、また 会う 約束を する",["ひとりで 反省して だまる","文句だけ 言う"],"あかり｜感謝を 伝えると 気持ち いいよね！","あかり｜その とおり！ ありがとうを 伝えよう！"]]),
        LB("大さんじ おばけ", "大さんじ おばけ", ["（空の 虹から 『大さんじ おばけ』が あらわれた！ ※ごっこ あそび）","大さんじ おばけ｜たのしい ときほど 大さんじ〜！ 最後の 勝負だ！"], SBF("sse", 10, "大さんじ おばけ", "🌈", "たのしかったよ。 ありがとう。", 1.3),
            ["あかり｜じゃあ 私は 用事が あるから お先に〜！ おふたり おしあわせに〜！"]),
    ],
    talks:[["夕やけ", ["夕やけ｜ぽかぽか。 虹が きれいだね。","夕やけ｜おつかれさま。"]]],
    fin:["語り手｜だいちは まひろに 一冊の 物語を すすめた。","語り手｜その タイトルは『楽しい時ほど、大さんじ！？』。 おしまい！"],
    learn:"たいへんな 日も ふりかえれば 楽しい 思い出。 感謝を 伝えよう。"});


/* ==== game/ssf.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[55]=1;
"use strict";
// ===== Map6 サブ：人生おにハードモード（10話）=====
const _SF = "人生おにハードモード";
SB("ssf", 1, {title:"① 草からの てがみ", area:_SF, theme:"town", bgm:"town",
    intro:["語り手｜コイヌネランドで たっぷり あそんだ タカシ。 でも ねつきが わるい 日が つづいていた。","語り手｜ある日、友だちの 草から てがみが とどく。"],
    steps:[
        LP("草", "てがみ", ["草｜タカシ、なやみごとを きいてほしい。 山本さんを たすけてあげて。","タカシ｜やっぱり なにか あったんだね。 わかった、会おう。"]),
        LQ("タカシ", "ねぶそく", ["タカシ｜さいきん ねむれなくて、日中も ぼーっとするんだ…。"],
            [["ねぶそくを かいぜんする ために いいのは？","毎日 同じ 時間に ねて おきる、ねる 前は スマホを 見ない",["夜ふかしを して 昼に ねる","おそくまで ゲームを する"],"草｜生活リズムが だいじだよ。","草｜そう。 リズムを ととのえよう。"]]),
        LP("タカシ", "出発", ["タカシ｜じゃあ 明日の 朝 8時に 山本さんの 駅で！"]),
    ],
    talks:[["ふくろう", ["ふくろう｜ほーほー。 ちゃんと ねないとね。","ふくろう｜ねる前は 画面を はなそう。"]]],
    fin:["語り手｜タカシは 山本さんに 会いに いく。","語り手｜次の 日から ハードな 一週間が はじまる…。"],
    learn:"ねぶそくの ときは 生活リズムを ととのえよう。"});

SB("ssf", 2, {title:"② カフェで そうだん", area:_SF, theme:"shop", bgm:"town",
    intro:["語り手｜カフェで 山本さんが なやみを あかす。","語り手｜どうやら 中学校の 先生の しごとに 関わる ことらしい。"],
    steps:[
        LP("山本さん", "ごめんなさい", ["山本さん｜タカシさん、よびだして すみません。","タカシ｜いいですよ！ そうだんって なんですか？"]),
        LQ("山本さん", "ていあん", ["山本さん｜実は、学校の 『席がえ』を プログラムで 自動に できないか、と…。"],
            [["人から そうだんされた とき 大切な ことは？","話を 最後まで きいて、できる こと・できない ことを 正直に 伝える",["よく きかずに ひきうける","話を きかずに ことわる"],"タカシ｜できる 範囲を 伝えよう。","タカシ｜そう。 正直に つたえるのが 大事。"]]),
        LP("タカシ", "ひきうける", ["タカシ｜わかりました。 やってみます！"]),
    ],
    talks:[["カフェの 店員", ["店員｜ごゆっくり どうぞ。","店員｜コーヒーは すこし 熱いですよ。"]]],
    fin:["語り手｜タカシは 席がえ ツールを 作ることに。","語り手｜つぎの 日は『ねむすぎ』に あだ名が つく。"],
    learn:"人の そうだんは 最後まで きいて、できる 範囲を 正直に 伝えよう。"});

SB("ssf", 3, {title:"③ 眠杉と 元気", area:_SF, theme:"town", bgm:"town",
    intro:["語り手｜ねむれずに むかえた 朝。 タカシは『眠杉』と よばれはじめる。","語り手｜友だちの ケンジは げんきなので『元気』。"],
    steps:[
        LP("元気", "顔色が！", ["元気｜眠杉！ 顔色が わるいよ！","眠杉｜ねむれなくて…。"]),
        LQ("元気", "しんぱい", ["元気｜きちんと ねて、ごはんも たべようよ。"],
            [["体調が わるい 友だちに 声を かけるなら？","『だいじょうぶ？』と やさしく きいて、休むように すすめる",["『なまけてる』と 言う","むしする"],"元気｜しんぱいの 言葉が 大事だよ。","元気｜そう。 やさしい 声かけが 大事！"]]),
        LP("眠杉", "ありがとう", ["眠杉｜ありがとう、元気。 すこし らくに なったよ。"]),
    ],
    talks:[["通りの ねこ", ["ねこ｜ふぁ〜あ。 ねむい…。","ねこ｜よく ねると 元気に なるにゃ。"]]],
    fin:["語り手｜眠杉は 席がえ ツール 作りに とりかかる。","語り手｜でも パズルは むずかしい…。"],
    learn:"友だちの 体調が わるそうな ときは、やさしく 声を かけよう。"});

SB("ssf", 4, {title:"④ 席がえ パズル", area:_SF, theme:"school", bgm:"field",
    intro:["語り手｜中学校の 席がえは、ジグソーパズルの ような ものだった。","語り手｜せまい 教室、のぞみ、ちゅういてん…。 条件を ならべて パズルを とく。"],
    steps:[
        LP("ねっけつ先生", "じょうけん", ["ねっけつ先生｜さむがりの 子は まどから とおく。 目の わるい 子は 前の 方に。"]),
        LQ("眠杉", "条件の 整理", ["眠杉｜条件を 一つずつ 整理して…。"],
            [["むずかしい 問題を とくときの コツは？","小さく 分けて ひとつずつ かたづける",["全部 いっぺんに やる","あきらめる"],"眠杉｜小さく 分けよう。","眠杉｜そう。 ひとつずつ 順番に。"]]),
        LB("パズル スライム", "パズル", ["（席がえ パズルから 『パズル スライム』が とびだした！ ※ごっこ あそび）","パズル スライム｜ぷるぷる！ とけるかな？"], SBF("ssf", 4, "パズル スライム", "🧩", "ぷる…とけたね。"),
            ["眠杉｜よし、いい かんじ！ もうすこしだ。"]),
    ],
    talks:[["黒板", ["黒板｜かりかり。 整理して 書くと わかりやすい。","黒板｜チョークは 手を よごすよ。"]]],
    fin:["語り手｜席がえ ツールの 試作が できた。","語り手｜けれど 夜に 天気が くずれる…。"],
    learn:"むずかしい 問題は、小さく 分けて ひとつずつ。"});

SB("ssf", 5, {title:"⑤ ゲリラ ごうう VS 眠杉", area:_SF, theme:"night", bgm:"cave",
    intro:["語り手｜作業中、ゲリラごううが はじまり、かみなりで 停電に。","語り手｜復旧すると ネットワークが つながらない！"],
    steps:[
        LP("眠杉", "ネットが…", ["眠杉｜えっ、ネットワークに つながらない！ ルーターが こわれたのかも。"]),
        LQ("眠杉", "あぶない 道", ["眠杉｜家電屋さんへ いそがなきゃ！ でも ふみきりが 鳴り出した…。"],
            [["ふみきりの けいほうが 鳴ったときは？","ぜったいに わたらず、安全な ところで 待つ",["急いで かけぬける","しゃがんで すべりこむ"],"眠杉｜あぶない！ 絶対に わたらない！","眠杉｜そう。 ふみきりは 待つ。 いのちが 大事。"]]),
        LB("かみなり ピカゴロ", "かみなり", ["（かみなりの 精 『ピカゴロ』が あらわれた！ ※ごっこ あそび）","ピカゴロ｜ピカピカ〜！ ゴロゴロ〜！"], SBF("ssf", 5, "かみなり ピカゴロ", "⚡", "ごろ…おやすみ。"),
            ["店員｜お客様、ぬれてますよ！ かぜ ひきますよ！"]),
    ],
    talks:[["家電屋さんの 店員", ["店員｜ルーターは こちらです。","店員｜ぬれた 服は ふいてね。"]]],
    fin:["語り手｜新しい ルーターを 買って 無事に 復旧。","語り手｜ところが 次の 日、あやしい 連絡が…。"],
    learn:"ふみきりは ぜったいに わたらない。 安全が 一番。"});

SB("ssf", 6, {title:"⑥ さぎか？ ほんとか？", area:_SF, theme:"lab", bgm:"cave",
    intro:["語り手｜席がえ ひょうが かんせい。 みんなに かんしゃされた 眠杉。","語り手｜その あと、あやしい メッセージが とどく。"],
    steps:[
        LP("ねっけつ先生", "ありがとう", ["ねっけつ先生｜席がえ ひょう、ありがとう！ クビは じょうだんだよ、実力を 見ただけさ。","眠杉｜えぇ〜、必死でしたよ！"]),
        LP("メッセージ", "あやしい メッセージ", ["（『あなたに 当せんしました！ このURLを 開いて 口座番号を 入力してください』）"]),
        LQ("眠杉", "どうする？", ["眠杉｜これは…。"],
            [["『当せんしました』という あやしい メッセージが 来たら？","リンクを 開かず、家族や 窓口に そうだんする",["すぐ URLを 開く","口座番号を 入力する"],"眠杉｜開くと あぶない！","眠杉｜そう。 開かず そうだん！"]]),
        LB("さぎ きつね", "さぎ きつね", ["（メッセージから 『さぎ きつね』が とびだした！ ※ごっこ あそび）","さぎ きつね｜コンコン！ お金を ちょうだい！"], SBF("ssf", 6, "さぎ きつね", "🦊", "コン…あきらめるよ。"),
            ["眠杉｜やった。 だまされなかった！"]),
    ],
    talks:[["けいさつの 人", ["けいさつの 人｜さぎは 年々 増えて います。","けいさつの 人｜あやしいと 思ったら 188番に そうだん。"]]],
    fin:["語り手｜眠杉は さぎを 見やぶった。","語り手｜つぎは 山本さんと デート？"],
    learn:"あやしい メッセージは 開かず、家族や 窓口に そうだんしよう。"});

SB("ssf", 7, {title:"⑦ ねぶそくの お出かけ", area:_SF, theme:"park", bgm:"town",
    intro:["語り手｜山本さんたちと お出かけの 日。 でも 眠杉は ねぶそく。","語り手｜気づくと 立ったまま ねむそうに…。"],
    steps:[
        LP("山本さん", "だいじょうぶ？", ["山本さん｜眠杉さん、ふらふらですよ。 ちょっと 休みましょう。"]),
        LQ("眠杉", "むりしない", ["眠杉｜せっかくの お出かけだし、がんばるよ…。"],
            [["たいちょうが わるい ときは？","正直に 言って 休む",["がまんして ずっと あそぶ","だまって 帰る"],"山本さん｜むりを すると 悪化しますよ。","山本さん｜そう。 正直に 言って 休もう。"]]),
        LB("ねむねむ ひつじ", "ひつじ", ["（ねむけの 精『ねむねむ ひつじ』が あらわれた！ ※ごっこ あそび）","ねむねむ ひつじ｜むにゃむにゃ…ねんねしよう〜"], SBF("ssf", 7, "ねむねむ ひつじ", "🐑", "めぇ…おやすみ。"),
            ["眠杉｜ありがとう。 すこし 元気に なったよ。"]),
    ],
    talks:[["ベンチ", ["ベンチ｜ここで ひと休み しよう。","ベンチ｜こまめな 休けいが 大事。"]]],
    fin:["語り手｜しっかり 休んで 一日を おえた。","語り手｜次の 日は 大きな しけんの 日。"],
    learn:"たいちょうが わるい ときは、がまんせず 休もう。"});

SB("ssf", 8, {title:"⑧ 資格しけん 一日目", area:_SF, theme:"school", bgm:"castle",
    intro:["語り手｜人生を かえる 資格しけんの 日。 受験料は 10万円！","語り手｜草が 応えんに かけつけた。"],
    steps:[
        LP("草", "がんばれ", ["草｜眠杉、がんばれ！ 応えん してるよ！","眠杉｜ありがとう。 しけんは 2日間。 午前と 午後、3時間ずつ。"]),
        LQ("眠杉", "しけんの コツ", ["眠杉｜1日目は 選択式。 ひと目で わかる 問題から…。"],
            [["しけんの 時間配分の コツは？","かんたんな 問題から 解き、むずかしい 問題は あとに まわす",["むずかしい 問題から 順に 解く","1問に 時間を かけすぎる"],"眠杉｜かんたんな 問題から だよ。","眠杉｜そう。 時間配分が 大事。"]]),
        LB("しけんかん ロボ", "しけんかん", ["（しけん会場に 『しけんかん ロボ』が あらわれた！ ※ごっこ あそび）","しけんかん ロボ｜はじめ！ ピー！"], SBF("ssf", 8, "しけんかん ロボ", "📝", "ピー…おつかれさま。", 1.2),
            ["眠杉｜1日目、なんとか おわった！"]),
    ],
    talks:[["受付の 人", ["受付の 人｜受験票を 見せてください。","受付の 人｜がんばってくださいね。"]]],
    fin:["語り手｜一日目が おわり、2日目の 記述式に 向かう。","語り手｜20時には 結果発表だ。"],
    learn:"しけんは、かんたんな 問題から 時間配分を 考えよう。"});

SB("ssf", 9, {title:"⑨ 合格と 新しい PC", area:_SF, theme:"shop", bgm:"town",
    intro:["語り手｜結果は 合格！ 『合格祝いに 家電を 買って いいですよ』と 連絡が 来た。","語り手｜眠杉は 家電量販店へ。"],
    steps:[
        LP("眠杉", "ほしい PC", ["眠杉｜16インチ、メモリ32GB、SSD 512GB…。 こんな 条件、伝わるかな。","店員｜こちらの 新しい モデルが ございます。"]),
        LQ("眠杉", "価格は？", ["眠杉｜価格を たしかめなきゃ。 いくらですか？"],
            [["高い 買いものを する前に すること？","ねだんを たしかめ、予算と 必要な 機能を 見くらべる",["ねだんを 見ずに 買う","ねぼけたまま 買う"],"眠杉｜ねだんを 見よう。","眠杉｜そう。 見くらべて 買おう。"]]),
        LB("おかね ゴブリン", "おかね", ["（財布から 『おかね ゴブリン』が とびだした！ ※ごっこ あそび）","おかね ゴブリン｜ちゃりんちゃりん！ ぜんぶ つかっちゃえ〜"], SBF("ssf", 9, "おかね ゴブリン", "💰", "ちゃりん…ためよう。"),
            ["眠杉｜ふう、よく 考えて 買おう。"]),
    ],
    talks:[["レジの 人", ["レジの 人｜お会計は こちらです。","レジの 人｜ポイントカードは おもち ですか？"]]],
    fin:["語り手｜眠杉は ネットで 注文。 でも 20万円の 引き落としに 気づく！","語り手｜寝ぼけて 買っていたらしい。"],
    learn:"高い 買いものは、ねだんと 条件を よく たしかめよう。"});

SB("ssf", 10, {title:"⑩ 人生おにハードモード", area:_SF, theme:"stage", bgm:"demoncastle",
    intro:["語り手｜38度の 猛暑日。 お金が ないので 節約生活に。","語り手｜エアコンも 電気も 節約…と 思ったら、体が つらい。"],
    steps:[
        LQ("眠杉", "あつい 日", ["眠杉｜暑すぎる…。 でも 節約しなきゃ。"],
            [["猛暑日に 大切な ことは？","エアコンや 扇風機を 使い、水分を こまめに とる",["がまんして 使わない","水を のまない"],"草｜体を まもる ことが 一番 大事。","草｜そう。 節約より 体が 先だよ。"]]),
        LP("草", "ふりかえり", ["草｜1週間 どうだった？","眠杉｜しんどかった…。 でも お金の 大切さが わかったよ。"]),
        LB("おにハード ボス", "おに", ["（最後に 『おにハード ボス』が あらわれた！ ※ごっこ あそび）","おにハード ボス｜節約も ほどほどが 大事だぞ〜！"], SBF("ssf", 10, "おにハード ボス", "👹", "ほどほどに…な。", 1.35),
            ["草｜心配性の 人は 準備が じょうずなんだよ。"]),
    ],
    talks:[["扇風機", ["扇風機｜ぶぉー。 すずしいよ。","扇風機｜水分も わすれずに。"]]],
    fin:["語り手｜眠杉は 節約と 体調の バランスを まなんだ。","語り手｜Map6の サブストーリー、おしまい！"],
    learn:"節約は 大事。 でも 体を まもる ことが 一番。"});


/* ==== game/ssg.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[56]=1;
"use strict";
// ===== Map7 サブ：職業せんたく（10話）=====
const _SG = "職業せんたく";
SB("ssg", 1, {title:"① 拓也くんの へや", area:_SG, theme:"town", bgm:"town",
    intro:["語り手｜高校を そつぎょうして 1年。 拓也くんは 5つの しごとを てんてんとして いた。", "語り手｜へやは ちらかり、せんたくものも やまづみ。"],
    steps:[
        LP("拓也", "ひとりごと", ["拓也｜どうして 俺って こうなんだろう…。", "拓也｜まずは へやを かたづけよう。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["へやを きれいに たもつ ために 良い ことは？", "毎日 少しずつ かたづける", ["ためこんで 一度に やる", "見ない ふりを する"], "拓也｜少しずつが 大事。", "拓也｜そう。 毎日 少しずつ。"]]),
        LB("ごみ おばけ", "ごみ おばけ", ["（ごみ おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 1, "ごみ おばけ", "🗑️", "ぽい…きれいに して…。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["ごみぶくろ", ["ごみぶくろ｜がんばってね。","ごみぶくろ｜むりは しないでね。"]]],
    fin:["語り手｜拓也くんは へやを かたづけ、じぶんの しごとを ふりかえる。", "語り手｜まずは 最初の しごと から。"],
    learn:"へやは 毎日 少しずつ かたづけよう。"});

SB("ssg", 2, {title:"② エンジニアの しごと", area:_SG, theme:"lab", bgm:"town",
    intro:["語り手｜最初の しごとは IT会社の エンジニア。", "語り手｜毎日 おそくまで 残業が つづいた。"],
    steps:[
        LP("上司", "むちゃぶり", ["上司｜このバグ、今日中に おねがい。", "拓也｜もう 夜の 10時ですけど…。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["つらい ほど はたらき続けて いる とき どうする？", "信頼できる 人に そうだんし、休む", ["だまって がまんする", "むりして 続ける"], "拓也｜休むことも 大事。", "拓也｜そう。 そうだんして 休もう。"]]),
        LB("バグくん", "バグくん", ["（バグくんが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 2, "バグくん", "💻", "ぴこ…なおったよ。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["バグ", ["バグ｜がんばってね。","バグ｜むりは しないでね。"]]],
    fin:["語り手｜拓也くんは たいちょうを くずして 退職を きめた。", "語り手｜次は 学校の 先生に ちょうせん。"],
    learn:"つらい ときは、そうだんして 休むことも 大事。"});

SB("ssg", 3, {title:"③ 先生の しごと", area:_SG, theme:"school", bgm:"town",
    intro:["語り手｜つぎは 中学校の 講師に。", "語り手｜でも 職員室の 人間関係は むずかしかった。"],
    steps:[
        LP("先輩教師", "きびしい 声", ["先輩教師｜今日の 準備、できてるの？", "拓也｜はい、やってます。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["職場の 人間関係で こまった とき 良い 方法は？", "おだやかに 話し合い、必要なら 相談窓口を 使う", ["悪口を 広める", "無視し返す"], "拓也｜話し合いが 大事。", "拓也｜そう。 話し合いと 相談。"]]),
        LB("クレーム おばけ", "クレーム おばけ", ["（クレーム おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 3, "クレーム おばけ", "📢", "しゅん…ごめんね。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["ほごしゃ", ["ほごしゃ｜がんばってね。","ほごしゃ｜むりは しないでね。"]]],
    fin:["語り手｜心が つかれた 拓也くんは また 退職。", "語り手｜つぎは 接客の しごと。"],
    learn:"人間関係は 話し合いと 相談で。"});

SB("ssg", 4, {title:"④ 接客の しごと", area:_SG, theme:"shop", bgm:"town",
    intro:["語り手｜家電量販店の 販売員に。", "語り手｜毎日 大きな 声で 接客した。"],
    steps:[
        LP("店長", "もっと 元気に", ["店長｜もっと 大きな 声で！", "拓也｜いらっしゃいませー！"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["のどが いたい ときは？", "声を 出さず 休み、お医者さんに 行く", ["大声を 出し続ける", "がまんする"], "拓也｜のどを 休めよう。", "拓也｜そう。 のどを 大事に。"]]),
        LB("マイクくん", "マイクくん", ["（マイクくんが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 4, "マイクくん", "🎤", "きーん…ごめんね。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["マイク", ["マイク｜がんばってね。","マイク｜むりは しないでね。"]]],
    fin:["語り手｜のどを 痛めた 拓也くんは 退職。", "語り手｜次は 清掃の しごと。"],
    learn:"のどが 痛い ときは 声を 出さず 休もう。"});

SB("ssg", 5, {title:"⑤ 清掃の しごと", area:_SG, theme:"lab", bgm:"town",
    intro:["語り手｜つぎは オフィスビルの 清掃員。", "語り手｜でも 洗剤が 肌に 合わなかった。"],
    steps:[
        LP("皮膚科の 先生", "アドバイス", ["先生｜この 薬品は 合わないですね。 別の しごとを さがしましょう。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["肌に 合わない ものを 使って しまった ときは？", "使うのを やめて お医者さんに 行く", ["がまんして 使い続ける", "自分で なんとかする"], "拓也｜やめることも 大事。", "拓也｜そう。 すぐ 受診しよう。"]]),
        LB("せんざい スライム", "せんざい スライム", ["（せんざい スライムが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 5, "せんざい スライム", "🧴", "ぷしゅ…やさしく するよ。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["せんざい", ["せんざい｜がんばってね。","せんざい｜むりは しないでね。"]]],
    fin:["語り手｜手を 痛めた 拓也くんは また 退職。", "語り手｜つぎは 事務の しごと。"],
    learn:"合わない ものは 使うのを やめ、受診しよう。"});

SB("ssg", 6, {title:"⑥ 事務の しごと", area:_SG, theme:"lab", bgm:"town",
    intro:["語り手｜最後は 事務。", "語り手｜小さな 字を 見続けて 目が つかれた。"],
    steps:[
        LP("眼科の 先生", "注意", ["眼科の 先生｜目を 休ませて ください。 しばらく 画面は 見ないでね。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["目が つかれた ときは？", "画面から 目を はなして 休み、遠くを 見る", ["もっと 画面を 見る", "夜ふかしする"], "拓也｜目を 休めよう。", "拓也｜そう。 目を いたわろう。"]]),
        LB("もじ おばけ", "もじ おばけ", ["（もじ おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 6, "もじ おばけ", "🔤", "ぼやー…休むよ。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["もじ", ["もじ｜がんばってね。","もじ｜むりは しないでね。"]]],
    fin:["語り手｜心が おれた 拓也くんは 家に こもる。", "語り手｜つぎは ニートの 日々。"],
    learn:"目が つかれたら 画面から はなれて 休もう。"});

SB("ssg", 7, {title:"⑦ のんびりの 日々", area:_SG, theme:"dream", bgm:"town",
    intro:["語り手｜ニートの 生活に。", "語り手｜ゲームと ネットで 一日が すぎる。"],
    steps:[
        LP("拓也", "安心", ["拓也｜働かなくて いいって 最高！"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["お金を ためる ために 大事な ことは？", "収入と 支出を 見て、計画を 立てる", ["使い切る", "見ないで 使う"], "拓也｜残高が 少ない…。", "拓也｜そう。 計画が 大事。"]]),
        LB("つうちょう おばけ", "つうちょう おばけ", ["（つうちょう おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 7, "つうちょう おばけ", "📒", "ぺら…計画しよう。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["つうちょう", ["つうちょう｜がんばってね。","つうちょう｜むりは しないでね。"]]],
    fin:["語り手｜気づくと 通帳の 残高が ほとんど ない！", "語り手｜お父さんに 電話を すると…。"],
    learn:"収入と 支出を 計画しよう。"});

SB("ssg", 8, {title:"⑧ お父さんの 電話", area:_SG, theme:"town", bgm:"town",
    intro:["語り手｜拓也くんは お父さんに 電話を かけた。", "語り手｜お父さんは きびしい 声で 言う。"],
    steps:[
        LP("お父さん", "電話", ["お父さん｜もう 仕送りは しない。 自分で なんとかしろ。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["自立の ために 必要な ことは？", "できる ことから 始め、助けを 借りながら 進む", ["だれかに たより続ける", "あきらめる"], "拓也｜少しずつ 始めよう。", "拓也｜そう。 少しずつ 自立しよう。"]]),
        LB("でんわ おばけ", "でんわ おばけ", ["（でんわ おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 8, "でんわ おばけ", "📞", "りん…がんばれ。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["でんわ", ["でんわ｜がんばってね。","でんわ｜むりは しないでね。"]]],
    fin:["語り手｜拓也くんは 一人で かんがえこんだ。", "語り手｜そこへ 夜、ノックの 音が。"],
    learn:"自立は 少しずつ。 助けを 借りても いい。"});

SB("ssg", 9, {title:"⑨ 選択の 案内人", area:_SG, theme:"night", bgm:"cave",
    intro:["語り手｜夜、黒い スーツの 男が たずねてきた。", "語り手｜『選択の 案内人』と 名のる 男は 2つの 選択肢を 見せた。"],
    steps:[
        LP("案内人", "選択", ["案内人｜Aは 土日休み。 Bは 平日休み。 時間は 5分です。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["大事な 選択を する とき は？", "時間を 使って 比べ、決めることを 恐れない", ["決めずに 先のばし", "他人に 任せる"], "拓也｜決めないと 他人に 決められて しまう。", "拓也｜そう。 自分で 決めよう。"]]),
        LB("案内人の かげ", "案内人の かげ", ["（案内人の かげが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 9, "案内人の かげ", "🕴️", "…選んで ね。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["選択肢", ["選択肢｜がんばってね。","選択肢｜むりは しないでね。"]]],
    fin:["語り手｜時間切れ。 部屋が 暗くなった。", "語り手｜つぎは エピローグ。"],
    learn:"大事な ことは 自分で 決めよう。"});

SB("ssg", 10, {title:"⑩ 新しい 毎日", area:_SG, theme:"stage", bgm:"demoncastle",
    intro:["語り手｜気がつくと 拓也くんは オフィスに いた。", "語り手｜そこは 営業部。 土日休みの 人生が 決まっていた。"],
    steps:[
        LP("同僚", "はげまし", ["同僚｜おはよう拓也！ 今日も 頑張ろうね！"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["働く 意味を 見つける ために 大事な ことは？", "小さな 喜びを 大事に して 続ける", ["いやな ことだけ 見る", "すぐ やめる"], "拓也｜小さな 喜びを 見つけよう。", "拓也｜そう。 続けて 見えてくる ことも ある。"]]),
        LB("ノルマ おばけ", "ノルマ おばけ", ["（ノルマ おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssg", 10, "ノルマ おばけ", "📈", "ふぅ…ほどほどに。", 1.3),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["ノルマ", ["ノルマ｜がんばってね。","ノルマ｜むりは しないでね。"]]],
    fin:["語り手｜1年後、拓也くんは 前よりも 幸せだと 思った。", "語り手｜Map7の サブストーリー、おしまい！"],
    learn:"小さな 喜びを 見つけて 続けよう。"});


/* ==== game/ssh.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[57]=1;
"use strict";
// ===== Map8 サブ：デビルバイト（10話）=====
const _SH = "デビルバイト";
SB("ssh", 1, {title:"① お金が ほしい", area:_SH, theme:"night", bgm:"town",
    intro:["語り手｜営業の しごとを 始めて 5年。 拓也くんは 25さいに なった。", "語り手｜おきゅうりょうが やすく、毎月 ぎりぎりの 生活だった。"],
    steps:[
        LP("拓也", "ひとりごと", ["拓也｜もっと お金が あればなあ…。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["お金に こまった とき、まず 考える ことは？", "家計を 見なおし、むりの ない 方法を さがす", ["すぐに 楽な もうけ話に のる", "だれかから 借りる"], "拓也｜楽な 話ほど 危ないかも。", "拓也｜そう。 家計を 見なおそう。"]]),
        LB("からっぽ さいふ", "からっぽ さいふ", ["（からっぽ さいふが あらわれた！ ※ごっこ あそび）"], SBF("ssh", 1, "からっぽ さいふ", "👛", "ひらり…節約しよう。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["さいふ", ["さいふ｜気をつけてね。","さいふ｜うまい 話には ご用心。"]]],
    fin:["語り手｜その夜、高校の 友だち 健太から 連絡が 来た。", "語り手｜『日給5万円の バイト、やらない？』"],
    learn:"お金に こまったら、まず 家計を 見なおそう。"});

SB("ssh", 2, {title:"② 友だちの さそい", area:_SH, theme:"town", bgm:"town",
    intro:["健太｜土日だけの 単発バイトで 日給5万円！", "語り手｜でも 『ちょっと 変わった しごと』らしい。"],
    steps:[
        LP("健太", "電話", ["健太｜日給5万円！ 詳しくは 会って 話すよ。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["うますぎる バイトの 話が 来たら？", "すぐに 返事せず、仕事の 内容・会社名・契約を 調べる", ["その場で OKする", "友だちだから 信じる"], "拓也｜まず 調べよう。", "拓也｜そう。 内容を 調べてから。"]]),
        LB("あやしい ちらし", "あやしい ちらし", ["（あやしい ちらしが あらわれた！ ※ごっこ あそび）"], SBF("ssh", 2, "あやしい ちらし", "📄", "ぺら…調べてね。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["ちらし", ["ちらし｜気をつけてね。","ちらし｜うまい 話には ご用心。"]]],
    fin:["語り手｜拓也くんは 会う ことに した。", "語り手｜でも 健太の 顔色が わるい…。"],
    learn:"うますぎる 話は、すぐ 返事せず 調べよう。"});

SB("ssh", 3, {title:"③ カフェの 内しょ話", area:_SH, theme:"shop", bgm:"town",
    intro:["語り手｜健太は 小声で 言った。『お化け屋敷の そうじ』だって。", "語り手｜『人手不足だから、拓也も やれないか』と。"],
    steps:[
        LP("健太", "小声", ["健太｜何が あっても 最後まで やってね。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["『絶対に 途中で やめるな』と 言われたら？", "理由を たしかめ、おかしければ ことわる", ["そのまま 従う", "理由を 聞かない"], "拓也｜理由を 聞こう。", "拓也｜そう。 おかしければ ことわる。"]]),
        LB("ひそひそ メモ", "ひそひそ メモ", ["（ひそひそ メモが あらわれた！ ※ごっこ あそび）"], SBF("ssh", 3, "ひそひそ メモ", "📝", "ぱら…気をつけて。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["メモ", ["メモ｜気をつけてね。","メモ｜うまい 話には ご用心。"]]],
    fin:["語り手｜日曜日の 朝、拓也くんは 駅前へ。", "語り手｜山の中の 洋館へ 向かう。"],
    learn:"「やめるな」と 言われたら、理由を たしかめよう。"});

SB("ssh", 4, {title:"④ 山の 洋館", area:_SH, theme:"night", bgm:"cave",
    intro:["語り手｜車で 1時間。 山の 奥の 古い 洋館に ついた。", "語り手｜まどは われ、ドアは 半分 あいている。"],
    steps:[
        LP("拓也", "きたい と ふあん", ["拓也｜ここ、ほんとうに そうじ するの？"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["あやしい 場所に 行く とき の 備えは？", "だれかに 行き先を 伝え、スマホを 充電しておく", ["だれにも 言わない", "スマホを 置いていく"], "拓也｜行き先を 伝えよう。", "拓也｜そう。 連絡できるように。"]]),
        LB("きしむ ドア", "きしむ ドア", ["（きしむ ドアが あらわれた！ ※ごっこ あそび）"], SBF("ssh", 4, "きしむ ドア", "🚪", "ぎぃ…ようこそ。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["ドア", ["ドア｜気をつけてね。","ドア｜うまい 話には ご用心。"]]],
    fin:["語り手｜中に 入ると、ほこりだらけ。", "語り手｜せんめんじょの 水道は…。"],
    learn:"あやしい 場所へは、行き先を 伝えて 備えよう。"});

SB("ssh", 5, {title:"⑤ あかい 水道？", area:_SH, theme:"lab", bgm:"cave",
    intro:["語り手｜蛇口を ひねると、赤い 水が！", "語り手｜…よく 見ると、ジュース用の 色水だった。"],
    steps:[
        LP("健太", "ドッキリ", ["健太｜ごめん、これは お化け屋敷の しかけなんだ。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["きみが わるい しかけは？", "安全か どうか 確かめる", ["さわいで 逃げる", "ほうっておく"], "拓也｜ふざけて いるだけか 確かめよう。", "拓也｜そう。 安全を 確かめよう。"]]),
        LB("いろみず スライム", "いろみず スライム", ["（いろみず スライムが あらわれた！ ※ごっこ あそび）"], SBF("ssh", 5, "いろみず スライム", "🧪", "ぷる…ごめんね。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["水道", ["水道｜気をつけてね。","水道｜うまい 話には ご用心。"]]],
    fin:["語り手｜健太は ほんとうは お化け屋敷の スタッフだった。", "語り手｜でも 本当は 別の 事情が あるようだ。"],
    learn:"おどろく ことが あっても、まず 安全を 確かめよう。"});

SB("ssh", 6, {title:"⑥ おもちゃの 部屋", area:_SH, theme:"dream", bgm:"town",
    intro:["語り手｜廊下の 部屋には ゴム製の おもちゃが ならんでいた。", "語り手｜壁には『次は あなたの 番！』と 書かれている。"],
    steps:[
        LP("健太", "説明", ["健太｜これは 小道具。 本物じゃ ないよ。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["こわい もの を 見ても 落ち着くには？", "深呼吸して、本物か 確かめる", ["さけんで 逃げる", "ぜんぶ 疑わない"], "拓也｜深呼吸、すぅ…はぁ…。", "拓也｜そう。 落ち着いて 確かめよう。"]]),
        LB("ゴムおばけ", "ゴムおばけ", ["（ゴムおばけが あらわれた！ ※ごっこ あそび）"], SBF("ssh", 6, "ゴムおばけ", "🧸", "ぽよん…またね。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["おもちゃ", ["おもちゃ｜気をつけてね。","おもちゃ｜うまい 話には ご用心。"]]],
    fin:["語り手｜でも 健太は うつむいた まま。", "語り手｜『実は…。』"],
    learn:"落ち着いて 確かめると、こわさは へる。"});

SB("ssh", 7, {title:"⑦ 健太の ひみつ", area:_SH, theme:"stage", bgm:"town",
    intro:["語り手｜健太は 打ち明けた。『借金が あって、悪い 人たちに バイトを させられていた』と。", "語り手｜拓也くんを 巻きこんだ ことを あやまった。"],
    steps:[
        LP("健太", "打ち明け", ["健太｜ごめん。 俺、お金が なくて…。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["友だちが 悪い 組織に 巻きこまれて いたら？", "話を 聞いて、警察や 弁護士・相談窓口に つなぐ", ["自分一人で 助けようとする", "見捨てる"], "拓也｜専門の 人に 相談しよう。", "拓也｜そう。 一人で 抱えず 相談。"]]),
        LB("デビル 店長", "デビル 店長", ["（デビル 店長が あらわれた！ ※ごっこ あそび）"], SBF("ssh", 7, "デビル 店長", "😈", "…ごめん。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["借用書", ["借用書｜気をつけてね。","借用書｜うまい 話には ご用心。"]]],
    fin:["語り手｜そこへ『デビル店長』が あらわれた。", "語り手｜『契約書に サインしろ〜！』"],
    learn:"友だちを 助けるには 専門の 人に 相談しよう。"});

SB("ssh", 8, {title:"⑧ 契約は だめ！", area:_SH, theme:"lab", bgm:"castle",
    intro:["語り手｜デビル店長は 契約書を 出した。", "語り手｜『サインすれば 月に 何百万も かせげる！』"],
    steps:[
        LP("デビル店長", "誘い", ["デビル店長｜サインするだけ。 かんたんだよ〜。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["よく わからない 契約書を 出されたら？", "サインせず、持ち帰って 家族や 専門家に 見せる", ["その場で サインする", "読まずに サインする"], "拓也｜絶対に サイン しない！", "拓也｜そう。 持ち帰って 相談しよう。"]]),
        LB("デビル契約書", "デビル契約書", ["（デビル契約書が あらわれた！ ※ごっこ あそび）"], SBF("ssh", 8, "デビル契約書", "📜", "ひらり…燃えるよ〜", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["契約書", ["契約書｜気をつけてね。","契約書｜うまい 話には ご用心。"]]],
    fin:["語り手｜拓也くんは きっぱり ことわった。", "語り手｜デビル店長は しぶしぶ 引きさがる。"],
    learn:"わからない 契約書には サインしない。"});

SB("ssh", 9, {title:"⑨ つながる 助け", area:_SH, theme:"town", bgm:"field",
    intro:["語り手｜拓也くんは 健太と いっしょに 警察や 相談窓口へ 行った。", "語り手｜専門の 人が 助けて くれる ことに。"],
    steps:[
        LP("相談員", "聞き取り", ["相談員｜よく 話して くれましたね。 もう 大丈夫ですよ。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["こまった ときの 相談先は？", "警察・消費者ホットライン188・弁護士・家族", ["ネットの 知らない 人", "だれにも 言わない"], "拓也｜信頼できる 窓口へ。", "拓也｜そう。 188番など。"]]),
        LB("相談 ロボ", "相談 ロボ", ["（相談 ロボが あらわれた！ ※ごっこ あそび）"], SBF("ssh", 9, "相談 ロボ", "🤖", "ピ…おつかれさま。", 1.1),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["電話", ["電話｜気をつけてね。","電話｜うまい 話には ご用心。"]]],
    fin:["語り手｜こうして 健太は 助けを 受けられた。", "語り手｜拓也くんは しばらく 考える。"],
    learn:"相談できる 窓口を 知っておこう。"});

SB("ssh", 10, {title:"⑩ 選択の その先に", area:_SH, theme:"stage", bgm:"demoncastle",
    intro:["語り手｜数日後、拓也くんは 会社に もどった。", "語り手｜お金は 増えなかったけど、大事な ことを まなんだ。"],
    steps:[
        LP("拓也", "ふりかえり", ["拓也｜うまい 話には 気をつけよう。 友だちの ためにも。"]),
        LQ("拓也", "しつもん", ["拓也｜どうしよう…。"],
            [["これから お金を 増やす 方法は？", "ひとつずつ スキルを 身につけ、堅実に 働く", ["一発 逆転を ねらう", "あやしい 話に 乗る"], "拓也｜こつこつが 一番。", "拓也｜そう。 堅実に 進もう。"]]),
        LB("デビル大王", "デビル大王", ["（デビル大王が あらわれた！ ※ごっこ あそび）"], SBF("ssh", 10, "デビル大王", "👿", "わかった…負けた。", 1.35),
            ["拓也｜ふぅ、のりこえた。"]),
    ],
    talks:[["さいごの デビル", ["さいごの デビル｜気をつけてね。","さいごの デビル｜うまい 話には ご用心。"]]],
    fin:["語り手｜拓也くんは 『選択』の 大切さを 知った。", "語り手｜Map8の サブストーリー、おしまい！"],
    learn:"うまい 話に のらず、堅実に 進もう。"});


/* ==== game/ssi.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[58]=1;
"use strict";
// ===== Map9 サブ：うそつきは うそはるの はじまり（10話）=====
const _SI = "うそはるの はじまり";
SB("ssi", 1, {title:"① ドッキリ きかく", area:_SI, theme:"town", bgm:"town",
    intro:["語り手｜草が SNSに 書きこんだ。『タカシを おどろかせたい！ いい アイデア ない？』", "語り手｜すると『うそはる』という 人が 手を あげた。"],
    steps:[
        LP("草", "相談", ["草｜うそはるさん、ぜひ おねがい！", "うそはる｜了解！ 俺に いい 考えが あるぞ。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["SNSで 知らない 人の 『いい 考え』に どう 対応する？", "内容を たしかめ、あぶないと 思ったら 断る", ["すぐ 全部 信じる", "個人情報を 教える"], "草｜知らない 人は 注意しよう。", "草｜そう。 うたがう 目も 大事。"]]),
        LB("うそはるの かげ", "うそはるの かげ", ["（うそはるの かげが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 1, "うそはるの かげ", "🎭", "…ちっ。", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["SNS", ["SNS｜気をつけてね。","SNS｜ウソには ご用心。"]]],
    fin:["語り手｜これが 大さわぎの はじまりだった…。", "語り手｜つぎは ARE 発売日。"],
    learn:"SNSの 知らない 人の 話は、すぐ 信じず 確かめよう。"});

SB("ssi", 2, {title:"② ARE 発売日", area:_SI, theme:"shop", bgm:"town",
    intro:["語り手｜ARE の 発売日が 来週！ 5万円で 買える。", "語り手｜でも 当日、店頭には ならばず 『抽選のみ』と 言われる。"],
    steps:[
        LP("タカシ", "がっくり", ["タカシ｜せっかく 5万円 持って 来たのに！", "ケンジ｜ひどいね…。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["品切れで 買えない とき、良い 対応は？", "公式の 情報を 見て、あせらず 待つ", ["高い 値段で 買う", "他人から 無理に 買う"], "タカシ｜公式を 見よう。", "タカシ｜そう。 あせらず 待とう。"]]),
        LB("てんばい ヤー", "てんばい ヤー", ["（てんばい ヤーが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 2, "てんばい ヤー", "😈", "ぐぬぬ…", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["ARE本体", ["ARE本体｜気をつけてね。","ARE本体｜ウソには ご用心。"]]],
    fin:["語り手｜1週間後、ニュースで『転売ヤーが 続出』と 言っていた。", "語り手｜うそはるは SNSで『ARE ほしい 人 いいね』と さそっていた。"],
    learn:"品切れの ときは、公式情報で あせらず 待とう。"});

SB("ssi", 3, {title:"③ おとり 作戦", area:_SI, theme:"school", bgm:"town",
    intro:["語り手｜うそはるの さそいは『5店で 予約して、当選したら 俺に 報告しろ。 報酬10万円！』", "語り手｜タカシは ヒロシに おとりを たのんだ。"],
    steps:[
        LP("タカシ", "作戦", ["タカシ｜うそはるに だまされた ふりを して くれ。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["友だちに ぎせいを 強いない ために 大事な ことは？", "本人の 同意を とり、危険な ことは させない", ["むりやり やらせる", "だまして やらせる"], "ヒロシ｜同意は 大事だよ。", "ヒロシ｜そう。 安全と 同意が 一番。"]]),
        LB("よやく ゴースト", "よやく ゴースト", ["（よやく ゴーストが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 3, "よやく ゴースト", "📋", "ひゅ…", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["予約票", ["予約票｜気をつけてね。","予約票｜ウソには ご用心。"]]],
    fin:["語り手｜ヒロシは 予約を 3店 取った。", "語り手｜うそはるは『顔を かくして 受けとれ』と 指示した。"],
    learn:"友だちに たのむ ときは 同意と 安全を まもろう。"});

SB("ssi", 4, {title:"④ 作戦 せいこう！", area:_SI, theme:"night", bgm:"field",
    intro:["語り手｜うそはるが 『ARE 2台 ゆずれ』と 言った とき、タカシが 割りこんだ。", "語り手｜うそはるは 連絡を 切った。"],
    steps:[
        LP("タカシ", "一喝", ["タカシ｜俺の 名前は タカシ。 会いたいんだが。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["身分を かくして 買い物を する のは？", "やってはいけない。 ルールを まもる", ["みんな やっている", "ばれなければ OK"], "タカシ｜ルールは まもろう。", "タカシ｜そう。 ズルは だめ。"]]),
        LB("ネットの かげ", "ネットの かげ", ["（ネットの かげが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 4, "ネットの かげ", "👤", "ひそ…", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["ひそひそ", ["ひそひそ｜気をつけてね。","ひそひそ｜ウソには ご用心。"]]],
    fin:["語り手｜ヒロシの ARE は 無事。", "語り手｜つぎは うそはるを 追う。"],
    learn:"ズルや かくし事は しない。 ルールを まもろう。"});

SB("ssi", 5, {title:"⑤ 追いかけっこ", area:_SI, theme:"town", bgm:"town",
    intro:["語り手｜駅前で うそはるを みつけた。", "語り手｜うそはるは 電車に 乗って にげる。"],
    steps:[
        LP("アナウンス", "ドア", ["アナウンス｜駆け込み乗車は おやめください。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["電車の ドアが しまる ときは？", "むりに 乗らず、次の 電車を 待つ", ["荷物を ドアに 入れる", "走って 飛びこむ"], "タカシ｜ドアに 物を はさむのは あぶない！", "タカシ｜そう。 次の 電車を 待とう。"]]),
        LB("にげ足 ロボ", "にげ足 ロボ", ["（にげ足 ロボが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 5, "にげ足 ロボ", "🚃", "ぷしゅー…", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["電車", ["電車｜気をつけてね。","電車｜ウソには ご用心。"]]],
    fin:["語り手｜うそはるは 緊急ボタンを 押して にげた。", "語り手｜緊急ボタンは むやみに 押しては いけない。"],
    learn:"電車では ルールを まもろう。"});

SB("ssi", 6, {title:"⑥ 転売ヤーとは？", area:_SI, theme:"lab", bgm:"town",
    intro:["語り手｜通販サイトで ARE が 6万円！", "語り手｜転売は 定価より 高く 売って もうける ことだ。"],
    steps:[
        LP("タカシ", "きょうり", ["タカシ｜これで みんなが こまる。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["転売に ついて 正しいのは？", "品物が ほしい 人が 買えなくなる こまった 行為だ", ["みんなが 喜ぶ", "お得に なる"], "タカシ｜買いたい 人が こまる。", "タカシ｜そう。 ほしい人に 届くのが 一番。"]]),
        LB("てんばい おばけ", "てんばい おばけ", ["（てんばい おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 6, "てんばい おばけ", "💴", "ぺら…", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["ねだん", ["ねだん｜気をつけてね。","ねだん｜ウソには ご用心。"]]],
    fin:["語り手｜タカシは 解決の ために 対策を 考える。", "語り手｜つぎは 作戦会議。"],
    learn:"ほしい 人に 品物が 届くように 考えよう。"});

SB("ssi", 7, {title:"⑦ 作戦会議", area:_SI, theme:"stage", bgm:"town",
    intro:["語り手｜草と タカシは 作戦会議。", "語り手｜転売を 防ぐ ためには どうしたら いい？"],
    steps:[
        LP("草", "提案", ["草｜買う 人を 本人確認すれば いいんじゃない？"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["転売を 防ぐ ための 工夫は？", "本人確認や 購入数の 制限などの ルールを 作る", ["だれでも 何個でも 買える", "値段を 上げる"], "草｜ルールで ふせごう。", "草｜そう。 ルール作りが 大事。"]]),
        LB("ルール ガーゴイル", "ルール ガーゴイル", ["（ルール ガーゴイルが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 7, "ルール ガーゴイル", "🗿", "ごご…", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["ルール表", ["ルール表｜気をつけてね。","ルール表｜ウソには ご用心。"]]],
    fin:["語り手｜作戦が できた。", "語り手｜つぎは いよいよ うそはると 対決。"],
    learn:"ルールを 作って 守る ことが 大事。"});

SB("ssi", 8, {title:"⑧ うそはるを さがせ", area:_SI, theme:"night", bgm:"cave",
    intro:["語り手｜SNSの 手がかりから うそはるの いる 場所を つきとめた。", "語り手｜公園の ベンチに うそはるが いた。"],
    steps:[
        LP("うそはる", "観念", ["うそはる｜…バレたか。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["ひとを だます こと を どう 思う？", "相手が 傷つくので 絶対に だめ", ["バレなければ 平気", "お金のためなら いい"], "タカシ｜ウソは 人を 傷つける。", "タカシ｜そう。 絶対に だめ。"]]),
        LB("うそはる", "うそはる", ["（うそはるが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 8, "うそはる", "🃏", "…ごめん。", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["ベンチ", ["ベンチ｜気をつけてね。","ベンチ｜ウソには ご用心。"]]],
    fin:["語り手｜うそはるは うつむいた。", "語り手｜でも 事情が あるようだ。"],
    learn:"ウソは 人を 傷つける。 絶対に だめ。"});

SB("ssi", 9, {title:"⑨ うそはるの わけ", area:_SI, theme:"dream", bgm:"town",
    intro:["語り手｜うそはるは 話しはじめた。『お金が なくて、人気者に なりたくて…』", "語り手｜タカシは 静かに 聞いた。"],
    steps:[
        LP("うそはる", "打ち明け", ["うそはる｜ほめられたくて やってしまった…。"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["だれかが 悪い ことを した とき どうする？", "事情を 聞き、正しい 相談先へ つなぐ", ["ののしる", "さらしあげる"], "タカシ｜さらしは だめ。", "タカシ｜そう。 相談先へ つなごう。"]]),
        LB("後悔 おばけ", "後悔 おばけ", ["（後悔 おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssi", 9, "後悔 おばけ", "😢", "うう…", 1.1),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["後悔", ["後悔｜気をつけてね。","後悔｜ウソには ご用心。"]]],
    fin:["語り手｜うそはるは あやまった。", "語り手｜つぎは エピローグ。"],
    learn:"相手を 責めず、正しい 相談先へ つなごう。"});

SB("ssi", 10, {title:"⑩ ウソから まこと", area:_SI, theme:"stage", bgm:"demoncastle",
    intro:["語り手｜うそはるは 警察で 反省。 ARE は 公式販売が 増えた。", "語り手｜タカシ・ケンジ・ヒロシ・草・舞華は ARE で あそぶ。"],
    steps:[
        LP("舞華", "ありがとう", ["舞華｜みんなで あそべて 楽しいね！"]),
        LQ("タカシ", "しつもん", ["タカシ｜どうしよう…。"],
            [["ウソを つかない 毎日の コツは？", "正直に 話し、まちがえたら すなおに あやまる", ["ごまかす", "かくす"], "タカシ｜正直が 一番。", "タカシ｜そう。 すなおに あやまろう。"]]),
        LB("うそはる大魔王", "うそはる大魔王", ["（うそはる大魔王が あらわれた！ ※ごっこ あそび）"], SBF("ssi", 10, "うそはる大魔王", "👹", "ごめん…", 1.35),
            ["タカシ｜ふぅ、のりこえた。"]),
    ],
    talks:[["ARE", ["ARE｜気をつけてね。","ARE｜ウソには ご用心。"]]],
    fin:["語り手｜『うそつきは どろぼうの はじまり』ならぬ『うそはるの はじまり』の おはなし。", "語り手｜Map9の サブストーリー、おしまい！"],
    learn:"正直が 一番。 ウソを つかないで すごそう。"});


/* ==== game/ssj.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[59]=1;
"use strict";
// ===== Map10 サブ：余命7日間の 彼女 → 7日間の 星の子（10話）=====
const _SJ = "7日間の 星の子";
SB("ssj", 1, {title:"① 桜の 公園", area:_SJ, theme:"park", bgm:"town",
    intro:["語り手｜3月の おわり。 大学3年の 翔太は 彼女の 美月と 公園で お花見。", "語り手｜美月の えがおは 太陽のように 明るかった。"],
    steps:[
        LP("美月", "お弁当", ["美月｜翔太の おにぎり、おいしい！", "翔太｜来年も また 来ようね。"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["大切な 人と すごす 時間で 大事な ことは？", "今を 大切に して 気持ちを 言葉に する", ["あとで 言えば いい", "当たり前だと 思う"], "翔太｜今を 大切に しよう。", "翔太｜そう。 今、伝えよう。"]]),
        LB("さくら ひらひら", "さくら ひらひら", ["（さくら ひらひらが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 1, "さくら ひらひら", "🌸", "ひら…またね。", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["桜", ["桜｜やさしい 気持ちで ね。","桜｜今を 大切に。"]]],
    fin:["語り手｜そのとき、美月の からだが ふわっと ひかった。", "語り手｜実は 美月は…。"],
    learn:"今を 大切に 気持ちを 言葉に しよう。"});

SB("ssj", 2, {title:"② 星の 子", area:_SJ, theme:"dream", bgm:"town",
    intro:["語り手｜美月は ほんとうは『星の子』だった。", "語り手｜地上で すごせるのは 7日間だけ。 それを すぎると 空に もどる。"],
    steps:[
        LP("美月", "打ち明け", ["美月｜ごめんね。 ずっと 言えなかった。"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["大切な 人から 大きな ひみつを 聞いたとき は？", "最後まで 話を 聞き、気持ちを 受けとめる", ["信じない", "おこる"], "翔太｜まず 聞こう。", "翔太｜そう。 受けとめよう。"]]),
        LB("ほしの かけら", "ほしの かけら", ["（ほしの かけらが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 2, "ほしの かけら", "⭐", "きらり…", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["星", ["星｜やさしい 気持ちで ね。","星｜今を 大切に。"]]],
    fin:["語り手｜翔太は なみだを ぬぐい、決意した。", "語り手｜7日間を 最高の 時間に する！"],
    learn:"ひみつを 打ち明けられたら、気持ちを 受けとめよう。"});

SB("ssj", 3, {title:"③ 7日間の 計画", area:_SJ, theme:"town", bgm:"town",
    intro:["語り手｜翔太は ノートに 計画を 書いた。", "語り手｜水族館、遊園地、海、友だちの 集まり、思い出の場所…。"],
    steps:[
        LP("美月", "おねがい", ["美月｜残りの 7日間で、たくさんの 思い出を つくりたいの。"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["計画を 立てる ときの コツは？", "体力と 時間に 余裕を もたせる", ["予定を つめこみすぎる", "計画を 立てない"], "翔太｜むりは しないでね。", "翔太｜そう。 余裕が 大事。"]]),
        LB("けいかく ふくろう", "けいかく ふくろう", ["（けいかく ふくろうが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 3, "けいかく ふくろう", "📖", "ほー…", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["ノート", ["ノート｜やさしい 気持ちで ね。","ノート｜今を 大切に。"]]],
    fin:["語り手｜1日目は 水族館に 決まった。", "語り手｜おでかけの 準備を しよう。"],
    learn:"計画には 余裕を もたせよう。"});

SB("ssj", 4, {title:"④ 1日目 水族館", area:_SJ, theme:"lake", bgm:"town",
    intro:["語り手｜青い 水そうの 前で、美月は 目を かがやかせた。", "語り手｜イルカ、クラゲ、ペンギン…。"],
    steps:[
        LP("美月", "わぁ", ["美月｜きれい…！ ずっと 見ていたい。"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["水族館の マナーは？", "フラッシュを たかず、さわらず、しずかに 見る", ["水そうを たたく", "大声を 出す"], "翔太｜しずかに 見よう。", "翔太｜そう。 生き物に やさしく。"]]),
        LB("クラゲ ぷかぷか", "クラゲ ぷかぷか", ["（クラゲ ぷかぷかが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 4, "クラゲ ぷかぷか", "🪼", "ぷか…", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["水そう", ["水そう｜やさしい 気持ちで ね。","水そう｜今を 大切に。"]]],
    fin:["語り手｜美月は 写真を いっぱい とった。", "語り手｜つぎは 遊園地。"],
    learn:"水族館では、しずかに 生き物を 見よう。"});

SB("ssj", 5, {title:"⑤ 2日目 遊園地", area:_SJ, theme:"stage", bgm:"town",
    intro:["語り手｜観覧車、コーヒーカップ、メリーゴーランド。", "語り手｜二人で 手を つないで 回った。"],
    steps:[
        LP("美月", "楽しい", ["美月｜ぐるぐる 回るの、楽しいね！"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["遊園地で 安全に すごす コツは？", "ルールを まもり、体調に 合わせて 乗る", ["気分が わるくても 乗る", "ルールを むしする"], "翔太｜体調も 大事。", "翔太｜そう。 ルールを まもろう。"]]),
        LB("かんらんしゃ ロボ", "かんらんしゃ ロボ", ["（かんらんしゃ ロボが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 5, "かんらんしゃ ロボ", "🎡", "ぐるぐる…", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["観覧車", ["観覧車｜やさしい 気持ちで ね。","観覧車｜今を 大切に。"]]],
    fin:["語り手｜夕やけの 観覧車で 美月は 言った。", "語り手｜『ありがとう。 最高の 思い出』"],
    learn:"遊園地では ルールを まもり、体調に 合わせよう。"});

SB("ssj", 6, {title:"⑥ 3日目 海", area:_SJ, theme:"lake", bgm:"sea",
    intro:["語り手｜青い 海。 貝がらを ひろって、波と あそんだ。", "語り手｜きらきらした 水面が まぶしい。"],
    steps:[
        LP("美月", "貝がら", ["美月｜この 貝がら、きれい！"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["海で あそぶ ときの 約束は？", "大人と いっしょに 行き、ライフジャケットや 日焼け止めを 使う", ["ひとりで 深い ところへ 行く", "準備しない"], "翔太｜安全第一！", "翔太｜そう。 準備して 安全に。"]]),
        LB("うみの ヤドカリ", "うみの ヤドカリ", ["（うみの ヤドカリが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 6, "うみの ヤドカリ", "🐚", "ざざ…", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["貝がら", ["貝がら｜やさしい 気持ちで ね。","貝がら｜今を 大切に。"]]],
    fin:["語り手｜二人は 砂浜に 名前を 書いた。", "語り手｜波が 静かに 消していった。"],
    learn:"海では、準備と 安全を わすれずに。"});

SB("ssj", 7, {title:"⑦ 4日目 友だちの 協力", area:_SJ, theme:"town", bgm:"town",
    intro:["語り手｜翔太の 友だちが サプライズパーティーを 開いてくれた。", "語り手｜みんなが 美月に 手紙を わたす。"],
    steps:[
        LP("友だち", "お祝い", ["友だち｜美月さん、会えて うれしい！"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["友だちの 協力を うけたとき は？", "『ありがとう』を 伝える", ["あたりまえと 思う", "何も 言わない"], "翔太｜感謝は 伝えよう。", "翔太｜そう。 ありがとうを 大切に。"]]),
        LB("クラッカー おばけ", "クラッカー おばけ", ["（クラッカー おばけが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 7, "クラッカー おばけ", "🎉", "ぱん！", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["パーティー", ["パーティー｜やさしい 気持ちで ね。","パーティー｜今を 大切に。"]]],
    fin:["語り手｜美月は なみだを ぬぐって わらった。", "語り手｜つぎは 思い出の 場所。"],
    learn:"助けて くれた 人に 感謝を 伝えよう。"});

SB("ssj", 8, {title:"⑧ 5日目 思い出の 場所", area:_SJ, theme:"school", bgm:"town",
    intro:["語り手｜二人が 出会った 図書館に 行った。", "語り手｜窓ぎわの 席に すわり、あの 日の 話を した。"],
    steps:[
        LP("美月", "思い出", ["美月｜ここで 翔太に 会えて 良かった。"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["思い出を 大切に する 方法は？", "写真や 日記に 残し、ときどき 見かえす", ["わすれる", "全部 すてる"], "翔太｜残して おこう。", "翔太｜そう。 記録に 残そう。"]]),
        LB("図書館 ねこ", "図書館 ねこ", ["（図書館 ねこが あらわれた！ ※ごっこ あそび）"], SBF("ssj", 8, "図書館 ねこ", "📚", "にゃ…", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["本", ["本｜やさしい 気持ちで ね。","本｜今を 大切に。"]]],
    fin:["語り手｜二人は 写真を たくさん とった。", "語り手｜アルバムに 貼る ことに。"],
    learn:"思い出は 写真や 日記に 残そう。"});

SB("ssj", 9, {title:"⑨ 6・7日目 さいごの 夜と 朝", area:_SJ, theme:"night", bgm:"castle",
    intro:["語り手｜6日目の 夜。 二人は 星空を 見あげた。", "語り手｜7日目の 朝、美月の からだが うっすらと ひかりだした。"],
    steps:[
        LP("美月", "さよなら", ["美月｜翔太、ありがとう。 わたしは 空に もどるね。", "翔太｜うん。 ずっと 見てるよ。"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["お別れの ときに 大事な ことは？", "感謝を 伝え、笑顔で 見送る", ["泣いて 引き止める", "何も 言わない"], "翔太｜感謝を 伝えよう。", "翔太｜そう。 笑顔で 見送ろう。"]]),
        LB("星の 番人", "星の 番人", ["（星の 番人が あらわれた！ ※ごっこ あそび）"], SBF("ssj", 9, "星の 番人", "🌟", "きらり…またね。", 1.1),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["星空", ["星空｜やさしい 気持ちで ね。","星空｜今を 大切に。"]]],
    fin:["語り手｜美月は 光の つぶに なって 空へ のぼっていった。", "語り手｜翔太は ずっと 手を ふっていた。"],
    learn:"お別れの ときは、感謝と 笑顔を 伝えよう。"});

SB("ssj", 10, {title:"⑩ 桜の 季節", area:_SJ, theme:"stage", bgm:"demoncastle",
    intro:["語り手｜1年後。 桜の 季節。 翔太は 図書館の 窓ぎわの 席に すわっていた。", "語り手｜となりの 席には だれも いない。 でも、美月が いるような 気がした。"],
    steps:[
        LP("翔太", "つぶやき", ["翔太｜美月、桜が きれいだよ。 約束どおり、美月の 分まで 見てるよ。"]),
        LQ("翔太", "しつもん", ["翔太｜どうしよう…。"],
            [["大切な 人と わかれた あと、前を 向く ために 大事な ことは？", "思い出を 胸に、今できる ことを 一歩ずつ やる", ["ずっと 後ろを 向く", "全部 わすれる"], "翔太｜一歩ずつ 進もう。", "翔太｜そう。 思い出と いっしょに 進もう。"]]),
        LB("さくらの 番人", "さくらの 番人", ["（さくらの 番人が あらわれた！ ※ごっこ あそび）"], SBF("ssj", 10, "さくらの 番人", "🌸", "ふわり…またね。", 1.4),
            ["翔太｜ふぅ、のりこえた。"]),
    ],
    talks:[["桜の 精", ["桜の 精｜やさしい 気持ちで ね。","桜の 精｜今を 大切に。"]]],
    fin:["語り手｜花びらが 一枚、翔太の 手に 落ちた。", "語り手｜『美月は 星に なって、ずっと ぼくを 見てる。』", "語り手｜Map10の サブストーリー、おしまい！"],
    learn:"思い出を 胸に、前を 向いて 進もう。"});


/* ==== game/sub-end.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[60]=1;
"use strict";
// ===== サブストーリー：ゲートの 行き先・称号・チート／リプレイ =====
(function(){
    const MAIN_ORDER = ["sendai", "tokyo", "white", "xmas", "labn", "n8", "n9", "n10", "n11", "future"];
    const MAIN = {};   // key → 親Map の クリアフラグ
    SUB_MAPS.forEach((s, i) => { MAIN[s[0]] = "e_" + s[1]; });
    SUB_MAPS.forEach((s, i) => {
        const key = s[0];
        for(let n = 1; n <= s[3]; n++){
            const e = LD_EPS[key][n - 1]; if(!e) continue;
            RPG_ERAS.push({id:key + n, n:"任意：Map" + (MAIN_ORDER.indexOf(s[1]) + 1) + "サブ『" + s[4] + "』第" + n + "話 " + e.title + "（推奨 Lv" + e.lv + "）", map:key + n, pos:[9, 10], done:"e_" + key + n, req: n === 1 ? MAIN[key] : "e_" + key + (n - 1)});
        }
    });
    const xe = RPG_ERAS.find((e) => e.id === "xr"); if(xe){ RPG_ERAS.splice(RPG_ERAS.indexOf(xe), 1); RPG_ERAS.push(xe); }
    const F = (k) => () => !!G.S.f[k];
    SUB_MAPS.forEach((s, i) => {
        const t = {id:"t_" + s[0], n:"Map" + (MAIN_ORDER.indexOf(s[1]) + 1) + "サブ『" + s[4] + "』かんけつ", d:"『" + s[4] + "』を ぜんぶ クリア", f:F("e_" + s[0] + "_all"), g:2000 + i * 600}; TQ_TITLES.push(t); TQ_TITLE_BY[t.id] = t;
    });
    const all = {id:"t_sub_all", n:"サブストーリー マスター", d:"Map1〜10の サブストーリーを ぜんぶ クリア", f:() => SUB_MAPS.every((s) => G.S.f["e_" + s[0] + "_all"]), g:40000}; TQ_TITLES.push(all); TQ_TITLE_BY[all.id] = all;
    Object.keys(RPG_EV).filter((k) => /^ss[a-j]\d/.test(k)).forEach((k) => {
        const walk = (a) => { if(!Array.isArray(a)) return; if(a[0] === "say" && typeof a[1] === "string" && a[1] && !TQ_PORTRAIT_LOOK[a[1]]) yPortrait(a[1]); a.forEach(walk); };
        walk(RPG_EV[k]);
    });
    // ---- なかまを ふやす（チート用・最大8人）----
    const POOL = ["haruki", "akito", "kaito", "n001", "n002", "n003", "n004"];
    window.tqPartyTo = function(n){
        const S = G.S; n = Math.max(1, Math.min(8, n));
        POOL.forEach((id) => { if(S.party.length < n && !S.party.includes(id)) tqAddMember(id, true); });
        while(S.party.length > n){ const i = S.party.map((x, k) => [x, k]).reverse().find(([x]) => x !== "hero"); if(!i) break; S.party.splice(i[1], 1); }
        tqHealAll(); return S.party.length;
    };
    // ---- ひみつの コード ----
    const isSubFlag = (k) => /^(e_)?ss[a-j]/.test(k) || /^ss[a-j]_started$/.test(k);
    const _rf = window.tqReplayFlags;
    window.tqReplayFlags = function(){ return _rf.apply(this, arguments).filter((k) => !isSubFlag(k)); };
    // リプレイ：話数の 区切り
    const RP = {ssa:[1, 6], ssb:[1, 6], ssc:[1, 6], sse:[1, 6], ssf:[1, 6], ssg:[1, 6], ssh:[1, 6], ssi:[1, 6], ssj:[1, 6]};
    window.SUB_RP = RP;
    SUB_MAPS.forEach((s, i) => { RP[s[0]].forEach((n) => TQ_REPLAYS.push({id:"rp_" + s[0] + String(n).padStart(2, "0"), n:"🗺️ Map" + (MAIN_ORDER.indexOf(s[1]) + 1) + "サブ『" + s[4] + "』第" + n + "話から", era:s[0] + n, lv:(LD_EPS[s[0]][n - 1] || {}).lv || 30})); });
    // ワープ：72〜
    let wi = 72; SUB_MAPS.forEach((s) => { for(let n = 1; n <= s[3]; n++) TQ_WARP_IDS[wi++] = s[0] + n; });
    const mainOf = (key) => SUB_MAPS.find((x) => x[0] === key)[1];
    const openMain = (S, upto) => { for(let i = 0; i < upto; i++) S.f["e_" + MAIN_ORDER[i]] = 1; if(upto > 0) S.f.intro_done = 1; };
    const setSub = (S, key, upto) => { for(let i = 1; i <= upto; i++) S.f["e_" + key + i] = 1; if(upto > 0) S.f[key + "_started"] = 1; if(upto >= SUB_MAPS.find((x) => x[0] === key)[3]) S.f["e_" + key + "_all"] = 1; };
    const _rs = window.tqReplayStart;
    window.tqReplayStart = function(id){
        const r = _rs.apply(this, arguments);
        const m = /^rp_(ss[a-j])(\d+)$/.exec(id);
        if(r && r.ok && m && G.S){
            const key = m[1], n = parseInt(m[2], 10), idx = SUB_MAPS.findIndex((x) => x[0] === key);
            openMain(G.S, idx + 1);
            setSub(G.S, key, n - 1);
            tqAutoSave(); render();
        }
        return r;
    };
    const _ac = _tqApplyBase;
    _tqApplyBase = function(raw){
        const f = tqFindCheat(raw);
        if(!f || !/^y_c(2[2-7])$/.test(f.id) || !G.S) return _ac.apply(this, arguments);
        const S = G.S; let msg = "";
        switch(f.id){
            case "y_c22": { openMain(S, 10); SUB_MAPS.forEach((s) => setSub(S, s[0], s[3])); msg = "Map1〜10の サブストーリー 90話を ぜんぶ クリア扱いに した。"; break; }
            case "y_c23": { openMain(S, 10); msg = "Map1〜10の サブストーリーが ぜんぶ ひらいた！（ゲートへ）"; break; }
            case "y_c24": { const n = f.nums[0]; if(!(n >= 0 && n <= 10)) return {ok:false, msg:"0〜10 を 指定してね。"}; openMain(S, n); msg = "Map" + n + "まで クリア扱いに した。サブストーリーが ひらいたよ。"; break; }
            case "y_c25": { const v = f.nums[0], mi = Math.floor(v / 100), ep = v % 100, s = SUB_MAPS.find((x) => x[1] === MAIN_ORDER[mi - 1]); if(!s || ep < 0 || ep > s[3]) return {ok:false, msg:"例：subskip0105 ＝ Map1の 5話まで。（Map2桁＋話数2桁）"}; openMain(S, mi); setSub(S, s[0], ep); msg = "Map" + mi + "サブ『" + s[4] + "』を " + ep + "話まで クリア扱いに した。"; break; }
            case "y_c26": { const n = f.nums[0]; if(!(n >= 1 && n <= 8)) return {ok:false, msg:"1〜8 を 指定してね。"}; tqPartyTo(n); msg = "なかまが " + S.party.length + "人に なった！（最大8人）"; break; }
            case "y_c27": { tqPartyTo(4); msg = "なかまを 4人に もどした。"; break; }
            default: return _ac.apply(this, arguments);
        }
        try{ tqTitleCheck(true); }catch(_e){}
        tqAutoSave(); return {ok:true, msg};
    };
})();


/* ==== game/yarisugi-codes.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[61]=1;
"use strict";
// やりすぎヒーロー伝説ぶんの チート／リプレイコードの「指紋」だけが入っています（コード本体は入っていません）。
const TQ_CHEAT3 = [["8c47e7fd0f155e91a954544c115fb2f92c1175fede4d6287168a91e51974737b","y_c01"],["4f2abe945dbf592327d927c27522df6c9b4bff33ace6473f14255146c9901f55","y_c02"],["9534749b140b209fcefbaa881f7fffd134bbaeb5b73065527d80698edf6a276e","y_c03"],["440644d6956433fa3af4754843b9761f8362b17ed171f49a2ad039cda60090ca","y_c04"],["e2e1ed12ad18bb1f95f5ea25e66447fc5840ea30adf1d279671f20c34ce9a672","y_c05"],["b69d8f8b3106bdaac703a162a9701dc4444c5581b75fbfa6500628db8bcbaaf4","y_c06"],["64ce46b1e487961095aceaee7bac7e63b5a1b6b098f5b82113e64d4fc2d821c2","y_c07"],["ea1f059cfc4976e2a8e19127082ad946cd46270a6287f37f7f18cf7df71fcddd","y_c08"],["1d65d51ef08265204048184396c788a185db70dbb56730e257c756cf18c3673e","y_c09"],["e3202d3b7a7ee5def164d6ba7a759bf49e26ad2e40d91fbfe98bdc71a27d1dad","y_c10"],["5cf30079939a6b069b4d9dd215d78f2e8e10dd32c559c8f352b24216be096ea0","y_c11"],["1cc51569083d5700baef5d4c4fe5318b06bfb03dbd77e844bf3d0862e140f7c1","y_c12"],["f9a2b9784d7b337402c2ff7724429eeab0d26bc5fad4839933b8499555653a5c","y_c13"],["3e7e4ef9fbf993a1d52d0143f3a16bcc059db5a9c3f7e0260edf8db39ee2cdee","y_c14"],["dcb57d7c6dd08ccf4edf44694daa004e0a755634e87b34a02e5d0d83d01e5a74","y_c15"],["70f8a00bf5af9ca8d456ce8bc5294747413bf78918d44247390c3c715f491a42","y_c16"],["95affec412ff582be7d3951f9c6b400e73e610d90b1e67ac6a3f5d8fa004a05e","y_c17"],["b3fb0a80bcad5fc7205daa11167d6879c9527ca71207ec34b59c20348dc1f2d2","y_c18"],["4d506fd196c08c7f725c4195357012f25eb6f8e680891b9e340b62829a3f5938","y_c19"],["6f8336cd57e5f2e5c786f7018028f072fb3debfa0c2aaead35185f4c9e38598e","y_c20"],["bde5448859802c841436572ac3ca4c1b642a192284372fbc49503806ff5ce09f","y_c21"],["682061b37fab1685ac1201a76c61c57566dc192248adfb11ade05cb105bab260","y_c22"],["cf914ab7240d661e7af89075c0beba01cfa353f05017fd2037dda78d4ec581c8","y_c23"],["a8ce6018bc8526281d36107942a06fa6b026889eb1d9d1538dae94f9ee84619f","y_c24"],["a807cca82529589f966c9e36850d1681a03bb25c31843f02af73931e3308b438","y_c25"],["a4e367392adf46797a08ffa596e54f428fd9c234054ab1a5e2682699c64c2bea","y_c26"],["431863a53f58a4ff2d5032722a3fd3dbdbb27a8898949a266862e1421896a506","y_c27"],["772c3c2315f540059f75bd056f89355b27a50fd02220171686edcaf98dda5def","rp_yh01"],["9de1bcd57694495d9bc28137306fe4e22e74676b221cc657c13239f9c3767c3c","rp_yh02"],["8d88d0b33b0b48eb4d85e52e879ad72bd4601b6407524a45b0e4686cae79e458","rp_yh03"],["7ded6208077fd07b8c1c5ebc55dbfa8c43aed6a1e14b6bff65181572391c4c9e","rp_yh04"],["9c603886e208b06d77ad2513b0f448ca4306266cc64cacf519400ea14c5dd442","rp_yh05"],["989977d95596ef8c1eb6e178cf268048ecdac54ed498d5a71c9a9cd78a89c36a","rp_yh06"],["1d074d7c59529647a75ce423db4154054c823d4eda7e1bdc1fb746dabe9351f6","rp_yh07"],["26822775bdec4281624447e2c2fd39956c3718ba470b8a27ebd539bafd078cf3","rp_yh08"],["35c13d7bc6e05dd368a723940b382520e20bdbb499f6b42a0ec28a66b36a8124","rp_yh09"],["a09db5ead4ffdef89214bd635fc9b46b121974874c3a21e6480ad16e82ada5cf","rp_yh10"],["51236e28cf958ca608d61cb97606d3df6e9eb3e15995d607811d726b2d7a1aea","rp_yh11"],["1b465f49f9e81bc3278f776e1e708460c57a8826477193fa5db510f9b7eb40b4","rp_yh12"],["d48ae985ed5b9b27609d61d0cb67b4f46c4d33fe9501c534b0d0d6fc4aa353a1","rp_yh13"],["f69606ab29c93894b312425622c8a2dd2150c85e22baa3f931e7325181fdafca","rp_yh14"],["5bddc571e8747c3b2b67a2e4764f1976f309698366f7d0bc4446a5a35b91aba6","rp_yh15"],["1084699e9734dbe1e7f226043505849d34badf2a7885983e9cabab8f0416f207","rp_yh16"],["58c587d80715d6f580778527bbc48ae029aa48ebf17656a2585304c26e913801","rp_yh17"],["414ef73c7d8e45ed2364b07490809761cdfbdff67f7572527ccbcf3796bc337c","rp_yh18"],["9eedb84cc3acefd96eb8ba7260f480e4ab5abad8d1d2316e28f7d83263d61a63","rp_yh19"],["ee1b8a8ebde5404054b8778abfd90e5b1c2acf12024bd70bcf5b9f57057dce65","rp_yh20"],["421f909869b4a4989fd4a29ba0cdd9680c67337be3733d01005e25097092e69e","rp_dk01"],["1ae0f3d65c1166c58b54e2b1e58c4fd337a47a1ab26e3982adfe6f56f75bc676","rp_dk02"],["7a06881b38fae80e6419b3b47872a6b30ee547cfbffad34e5bbc39a11afb21b9","rp_dk03"],["5827b13432a5d73be7ecb597bc9c140c268f9f99f0223dbf528ee4ab4ef4f806","rp_dk04"],["402a991aed014bc6277abdf309a0cce43e5cddf5de4864d844ffb65c7c8ea08a","rp_dk05"],["f1760af749a9a2cbbfed4327a640afc772974f1a9615afd31b55b62f5994b7fe","rp_dk06"],["3358a521e16c4e1613c1aca2723149bb34e24c0414706390012c71569c14e474","rp_dk07"],["f1241991705c9b74fab8ded7289da2bcc412e1e692824f012a1f849ad7a2f676","rp_dk08"],["b9f3738ac6a92fd88a76d23929d826778669ef844625b7006b70d1e4f03a00e7","rp_dk09"],["5630951b7da6719f260cb8477ff4327055a9032a75274ec1d5c8e9a92b839e9e","rp_dk10"],["92c0b67348783fd7d5605ad2e91a78e3e68d41f79a161ef210e6c8dc16029c26","rp_kn01"],["764d5647ab5b6502378d1a04e49addefa25d3a48b0f6c08ea7ecc8d0a78f6eaf","rp_kn02"],["147895bb0a5f64026a5c404730e011e15615d8dc8e341025bbda9623a560ea2b","rp_kn03"],["740a87baef973e50fcf5510ec29bf99eccba8fab9ae2a1f84ed5f1837ae855dc","rp_kn04"],["5f7e96010197510c26ac6658d57c08a201e63799382d289f019c9b099087e749","rp_kn05"],["24cbc3a54b3e09c32cf2d9798cb0d7e04390e1102f47ebcf029b7e37e848e970","rp_kn06"],["1c781b14f37b36a3ac158e35e9f1be3c112013d86a28e9ace363f4eae35bef40","rp_kn07"],["feded6fa1e40a2e3b4e3e448ef89408fb982eec5becdac96d4c56e2cb9fd06f7","rp_kn08"],["7fb9374ae62d510b66b65938534545c48eb153c94115c3493558b071b26adf8a","rp_kn09"],["ae22de0777995740af96d43f655a63393cece23e175cf62e313f48b1cf036f0f","rp_kn10"],["4954a4301cfde98e125340e18e0cd2216ce9167c8672408939573a40bb985d22","rp_wn01"],["c079a055c076cd198116c2e13c09e37cf8abbc249d481a93bcda7de83a96a614","rp_wn02"],["73c277aa672c99b40d9e797105bcc9c367f03b9fde31470ebf326ee8ae654510","rp_wn03"],["340f500fc9ea692c68988bf0f3bd1b8ef9500d544acce275ebda409404a8f27c","rp_wn04"],["914debf402fe683d2da55cf422494388b105e244a2217951abfc7523274db4db","rp_wn05"],["4ddb923b1759241ab4c872c2dfa19e460c1d4cffe410114f663fe6bc660d0edc","rp_wn06"],["c2a1426df9a8827eb58db2d3069a39d3d5137368c4d496a5d736e93a5446890e","rp_wn07"],["c23e39b1d7839837f910a089c9b92572e6cd037ef3f2729c5663e9a4ce8d0cd5","rp_wn08"],["d128e9d66794764e83343fcebeed01987ad4d327d0fe947926b440b8e3ee7fad","rp_wn09"],["f705f7c6034d9491cc7e348790cfb972c3111f8a0c773a83dcd3e214bf15331b","rp_wn10"],["12660b9a33d0d8e6a81ea2f0ed4427810e341bca7f2a8b864fca543bf74a362c","rp_us01"],["7138c00809daf4a2d21f18c9a121366c1986ef4dad5134827ccaba267920334d","rp_us02"],["7bf9685393983be010cee56543c17fb7173c92b2f3a22525bd0b2cd40805df37","rp_us03"],["91b11c9c7e3860b1b1a9e19aaa63f7cbb595e00bfe8b8b0ed04763a677a2fe7d","rp_us04"],["2ce6ea9c09f3f6b8d0fe439ba0fdb2e8adf17fa50a309d3392d49c7f62502e34","rp_us05"],["647115c69b567ca964ead2eeaafa7f3824c0d15ec6d0973c896e118c8dda18fe","rp_us06"],["2e6cc5da408cb1c960b69371f3b0166bc680fb586ec8a6cee9b1a7dbe3408ef2","rp_us07"],["05999ac6b02327558070e28aefbc2df3403ca47710b48e94fb38cf5cbffbb1fc","rp_us08"],["79516149b7620fc3808ebd7d0fa56cca857e900a50ca828fce48380be1231c97","rp_us09"],["f73581683ef73f9bdb7be14d320042bfb22bdc5dcf9cdebdbe73b7f3cfc32790","rp_us10"],["af16b379dda56595d7e1bcc225ec7920e683f1531f1af8bc96b3b3cb5edd9e2f","rp_ssa01"],["1ad9738ba8a075882535d4d49e0ca7c92442f1842b56b381e213d8932b08ffc2","rp_ssa06"],["bdb69316bb627da0b182508c5ba82ba065c4c752c13d81b430c89b82bfdfac35","rp_ssa11"],["d266c65165cc88ecca9821400cfe522fd32ef8ac03c9efa866e38b3133543a4b","rp_ssa16"],["ca0ed8aeb9c787775b039ac3814e7d21f534ce2532f19c860767444daf5f4862","rp_ssb01"],["f868995d5790f2f8f40ed281e2059c3a23699371af5d10907bd8f59773545fa8","rp_ssb06"],["c897a969009417d7ece764e63a7b376c8129ae81636081b994c44dabd6b1943b","rp_ssb11"],["8b92dcfc8cb970bfc2643218ae36d8fa7feb21d29ce5edfa9de283f8732d8bb2","rp_ssb16"],["2dc2c7d13ce359ee7165ca3f5ebfa04469b032cb2edabc446c190a517db58633","rp_ssc01"],["793f20d3446fc5b3b1e2ee3d5a76692ea8584ef470d75f52ddfbbe39a16aabf9","rp_ssc06"],["79d6bfb38055693d1f48957de73b425bd24adcbe18342c846aacba2462cee83f","rp_ssc11"],["c841c5304574391bacc9ef12194b0e06243a96a630eb62817e0dfb97f3cbc35b","rp_ssc16"],["2e97b6c53bac9ed34bf109e7f3427ce1f8ad531bfb2b129b965060918fc0457b","rp_sse01"],["55ca99b9f6dcffb6e69dd5bd100135f271d3f66de18d997d4d74f483c671c68f","rp_sse06"],["0a697a73b4b9d7a3dcd72f8e6b825136780caffc7bad577c9ffab4992a2bbaf2","rp_ssf01"],["fa040399c5fed2219d7c3ba5c27d2d404ae556622f1a7da809dfb9b353315725","rp_ssf06"],["be1e2d4f1007d82f001c9d90dcfd24db0845bd1eec4b29d4f7062c664296d2ea","rp_ssg01"],["d69beea0abed84ab40bcf1dffd6eea7f48f7876e26307bf2783b1337d548e94c","rp_ssg06"],["8dd3224d77cea83eecce5a1f98add7e78b67e3f350594a32da8d9b664e4cee8a","rp_ssh01"],["94493482f50e85eec5e36059ddcf84f4520277b83da1de0fe041342c79f56421","rp_ssh06"],["bbdcaa02eb96312475292de8dcd11a331452d54d451a65aa76c940d447fa8976","rp_ssi01"],["b3b37ef1af91f30a5bc03d7efdd8c2d95bb30bc274bfa6b194f45cb4fb9e8d11","rp_ssi06"],["20dec3ca2896f6cb5d2fd153bfe7b2429c5aba6bc9a579cd45ce86ed5d88a9c0","rp_ssj01"],["419772b54e2b612751fb259da1e4b9cff47dd815a5fe094c1d376c44050910de","rp_ssj06"]];
if(typeof TQ_CHEATS !== "undefined") TQ_CHEAT3.forEach((x) => TQ_CHEATS.push(x));


/* ==== game/yh-codes.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[62]=1;
"use strict";
// ===== やりすぎヒーロー伝説：チート／リプレイ（指紋は yarisugi-codes.js）=====
(function(){
    const isYhFlag = (k) => /^(e_)?(yh|dk)\d/.test(k) || k === "yh_started" || k === "e_yh_all" || k === "dk_started" || k === "e_dk_all";
    const _rf = window.tqReplayFlags;
    window.tqReplayFlags = function(){ return _rf.apply(this, arguments).filter((k) => !isYhFlag(k)); };
    for(let n = 1; n <= 30; n++){
        TQ_REPLAYS.push({id:"rp_yh" + String(n).padStart(2, "0"), n:"🦸 やりすぎヒーロー伝説 " + (n > 20 ? "番外編 " : "") + "第" + n + "話（クリア前まで）", era:"yh" + n, lv:[45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95][n - 1] || 99 });
    }
    for(let n = 1; n <= 10; n++) TQ_REPLAYS.push({id:"rp_dk" + String(n).padStart(2, "0"), n:"📖 出来事 第" + n + "話（クリア前まで）", era:"dk" + n, lv:40});
    for(let i = 1; i <= 20; i++) TQ_WARP_IDS[11 + i] = "yh" + i;
    for(let i = 1; i <= 10; i++) TQ_WARP_IDS[31 + i] = "dk" + i;
    const _rs = window.tqReplayStart;
    window.tqReplayStart = function(id, slot, name){
        const r = _rs.apply(this, arguments);
        const m = /^rp_yh(\d+)$/.exec(id);
        const md = /^rp_dk(\d+)$/.exec(id);
        if(r && r.ok && md && G.S){ const n = parseInt(md[1], 10); for(let k = 1; k < n; k++) G.S.f["e_dk" + k] = 1; if(n > 1) G.S.f.dk_started = 1; tqAutoSave(); render(); }
        if(r && r.ok && m && G.S){
            const n = parseInt(m[1], 10), f = G.S.f;
            for(let k = 1; k < n; k++) f["e_yh" + k] = 1;
            ["e_ks1", "e_ks2", "e_ks3", "e_ks4", "e_ks5"].forEach((k) => { f[k] = 1; });
            if(n > 1) f.yh_started = 1;
            tqAutoSave(); render();
        }
        return r;
    };
    const _ac = _tqApplyBase;
    _tqApplyBase = function(raw){
        const f = tqFindCheat(raw);
        if(!f || !/^y_/.test(f.id) || !G.S) return _ac.apply(this, arguments);
        const S = G.S, c = S.cx; let msg = "";
        switch(f.id){
            case "y_c01": { for(let i = 1; i <= 20; i++) S.f["e_yh" + i] = 1; S.f.yh_started = 1; S.f.e_yh_all = 1; pkYhFinal(); msg = "やりすぎヒーロー伝説を ぜんぶ クリア！ 15職業 Lv99、天才が ひらいた！"; break; }
            case "y_c02": { ["e_future", "e_ks1", "e_ks2", "e_ks3", "e_ks4", "e_ks5"].forEach((k) => { S.f[k] = 1; }); c.allgate = true; S.f.xr_open = 1; msg = "ヒーロー伝説の 第1話が ひらいた！（ゲートへ）"; break; }
            case "y_c03": { const n = f.nums[0]; if(!(n >= 0 && n <= 20)) return {ok:false, msg:"0〜20 を 指定してね。"}; ["e_future", "e_ks1", "e_ks2", "e_ks3", "e_ks4", "e_ks5"].forEach((k) => { S.f[k] = 1; }); for(let i = 1; i <= n; i++) S.f["e_yh" + i] = 1; S.f.yh_started = 1; msg = "第" + n + "話まで クリア扱いに した。"; break; }
            case "y_c04": c.ys = false; msg = tqToggle("yw", "ヒーロー伝説の てき 1/4"); break;
            case "y_c05": c.yw = false; msg = tqToggle("ys", "ヒーロー伝説の てき ×2"); break;
            case "y_c06": { const u = tqGain(1000000); msg = "1,000,000EXP を てにいれた！" + (u.length ? "\n" + u.join("\n") : ""); break; }
            case "y_c07": S.gold = Math.min(TQ_MAX_GOLD, S.gold + 9000000); msg = "9,000,000G を てにいれた！"; break;
            case "y_c08": { const n = f.nums[0]; if(!(n >= 0)) return {ok:false, msg:"金額を 指定してね。"}; S.gold = Math.min(TQ_MAX_GOLD, n); msg = "ゴールドを " + S.gold.toLocaleString() + "G に した。"; break; }
            case "y_c09": Object.keys(RPG_EQUIP).forEach((k) => { if(!S.own.includes(k)) S.own.push(k); }); msg = "そうびを ぜんぶ てにいれた！（" + Object.keys(RPG_EQUIP).length + "こ）"; break;
            case "y_c10": ["e_ks1", "e_ks2", "e_ks3", "e_ks4", "e_ks5"].forEach((k) => { S.f[k] = 1; }); msg = "烏坂探偵事務所①〜⑤を クリア扱いに した。"; break;
            case "y_c11": RPG_ERAS.forEach((e) => { if(!/^yh/.test(e.id) && e.done) S.f[e.done] = 1; }); S.f.xr_open = 1; msg = "ゲートの 時代を ぜんぶ クリア扱いに した。"; break;
            case "y_c12": { const j = tqJ(), d = TQ_JOB_BY[j.cur]; if(!d) return {ok:false, msg:"いま 職業に ついていません。"}; j.jlv = Math.min(99, j.jlv + (f.nums[0] || 1)); j.jexp = 0; d.abil.forEach((a) => { if(j.jlv >= a.lv) j.learned[a.id] = 1; }); msg = "職業レベルが " + j.jlv + " に なった！"; break; }
            case "y_c13": tqHealAll(); msg = "HP・MPが ぜんぶ かいふくした！"; break;
            case "y_c15": { for(let i = 1; i <= 10; i++) S.f["e_dk" + i] = 1; S.f.dk_started = 1; S.f.e_dk_all = 1; S.f.e_future = 1; msg = "出来事 10話を ぜんぶ クリア扱いに した。"; break; }
            case "y_c16": { const n = f.nums[0]; if(!(n >= 0 && n <= 10)) return {ok:false, msg:"0〜10 を 指定してね。"}; S.f.e_future = 1; for(let i = 1; i <= n; i++) S.f["e_dk" + i] = 1; S.f.dk_started = 1; msg = "出来事 第" + n + "話まで クリア扱いに した。"; break; }
            case "y_c14": { const y = S.yh; if(y && y.bench){ y.bench.forEach((id) => { try{ tqAddMember(id, true); }catch(_e){} }); y.bench = []; } msg = "ベンチの なかまを もどした。"; break; }
            default: return _ac.apply(this, arguments);
        }
        try{ tqTitleCheck(true); }catch(_e){}
        tqAutoSave(); return {ok:true, msg};
    };
})();


/* ==== game/cheat-reset.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[63]=1;
"use strict";
// ===== チートの「ぜんぶリセット」コード（指紋だけ。コード本体は入っていません）=====
// ずっと続くチート（無敵・ワンパン・MPむげん・倍率・ステータス999・ヒーロー伝説の敵の強さ…）を、まとめて もとに もどす。
// ※ 一回きりの チート（所持金・レベルの上げ下げ・職業マスター等）は「続く効果」ではないので そのまま。
if(typeof TQ_CHEATS !== "undefined"){
    TQ_CHEATS.push(["67694e5644d1141c267f0861c0be86ca40702b5fd239ff9ed5f5ff051ce63169", "z_reset"]);
    TQ_CHEATS.push(["289384218a04e39f4a27974835a4158c6b1c4fb8db2fc4640c18036e6435102a", "z_reset"]);
}
const TQ_PERSIST_FLAGS = ["god", "onehit", "infmp", "areall", "noenc", "encx3", "speed", "rainbow", "showpos", "gcrit", "gflee", "gscout", "ggold", "gexp", "yw", "ys", "st999"];
const TQ_FLAG_JP = {gcrit:"いつでも かいしん", gflee:"いつでも にげられる", gscout:"スカウト100%", ggold:"ゴールド×3", gexp:"経験値×3", yw:"ヒーロー伝説の てき 1/4", ys:"ヒーロー伝説の てき ×2"};
function tqResetAllCheats(){
    const S = G.S, c = S.cx, out = [];
    try{ const m = tqReleaseAll(true); if(m) out.push(m); }catch(_e){}      // レベル・そうび・なかま等、記録つきのチートを かいじょ
    TQ_PERSIST_FLAGS.forEach((k) => { if(c[k]) out.push("・" + (TQ_FLAG_JP[k] || k) + " を OFF"); delete c[k]; });
    if((S.expmul || 1) !== 1){ out.push("・経験値の倍率を 1倍に"); }
    S.expmul = 1;
    if(!c.replay) { if(c.allgate) out.push("・ゲート全開を OFF"); delete c.allgate; }   // リプレイの冒険の書は ゲートが開いたまま
    c.act = [];
    // チートで ふやした なかま（4人より多い分）を もどす。ストーリーの 一時なかまは そのまま
    const keep = new Set(["hero", "haruki", "akito", "kaito"]);
    const tmp = S.temp || {};
    for(let i = S.party.length - 1; i >= 0 && S.party.length > 4; i--){
        const id = S.party[i]; if(keep.has(id) || tmp[id]) continue;
        S.party.splice(i, 1); delete S.m[id]; out.push("・なかま " + (typeof tqName === "function" ? tqName(id) : id) + " がぬけた");
    }
    try{ tqFixAfterRelease(); }catch(_e){ try{ tqClamp(); }catch(_e2){} }
    return out;
}
(function(){
    const _ac = _tqApplyBase;
    _tqApplyBase = function(raw){
        const f = tqFindCheat(raw);
        if(!f || f.id !== "z_reset" || !G.S) return _ac.apply(this, arguments);
        const out = tqResetAllCheats();
        try{ tqTitleCheck(true); }catch(_e){}
        tqAutoSave();
        return {ok:true, msg:"♻ チートを ぜんぶ リセットした！ ふだんの 状態に もどったよ。" + (out.length ? "\n" + out.join("\n") : "\n（続いていた チートは ありませんでした）")};
    };
})();


/* ==== game/qol.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[64]=1;
"use strict";
// ===== ARE QUEST：使いやすさ追加（T041〜T050）=====
// 属性相性／図鑑／ワープ／依頼（目標）／オートセーブ表示／ミニマップ／セリフ履歴／文字の速さ・大きさ
(function(){
    // ---------- 共通の見た目（このファイルだけで完結）----------
    const st = document.createElement("style");
    st.textContent =
        "#qolSave{position:absolute;right:1.6cqw;bottom:1.4cqw;z-index:9;font-size:2.4cqw;background:rgba(10,18,60,.82);border:.25cqw solid #8fb4ff;border-radius:1cqw;padding:.3cqw 1.2cqw;opacity:0;transition:opacity .25s;pointer-events:none;color:#fff}" +
        "#qolSave.on{opacity:1}" +
        "#qolMini{position:absolute;right:1cqw;top:15cqw;z-index:4;border:.25cqw solid #8fb4ff;background:rgba(5,10,40,.7);image-rendering:pixelated;max-width:18cqw;pointer-events:none}" +
        "#qolBtns{position:absolute;right:1cqw;top:11cqw;z-index:6;display:flex;gap:.5cqw}" +
        "#qolBtns button{font-size:1.9cqw;padding:.2cqw 1cqw;border-radius:.8cqw;border:.25cqw solid #8fb4ff;background:rgba(10,18,60,.85);color:#fff}" +
        "#qolLog{position:absolute;inset:3cqw 8cqw;z-index:12;background:rgba(6,12,50,.96);border:.35cqw solid #8fb4ff;border-radius:1.4cqw;padding:1.6cqw 2cqw;overflow:auto;color:#fff;font-size:2.1cqw;line-height:1.55}" +
        "#qolLog h2{margin:0 0 .8cqw;font-size:2.6cqw;color:#ffd86b}#qolLog .r{margin:.5cqw 0;padding-bottom:.4cqw;border-bottom:1px dashed rgba(255,255,255,.2)}#qolLog .w{color:#9fd0ff;font-size:1.8cqw}" +
        "#qolLog button{font-size:2.1cqw;padding:.4cqw 2cqw;border-radius:1cqw;border:.25cqw solid #8fb4ff;background:#1a2fa8;color:#fff;margin-top:1cqw}" +
        "body.qfs1 #msg{font-size:2.9cqw}body.qfs2 #msg{font-size:3.4cqw}" +
        ".qeff{color:#ffd86b;font-weight:bold}";
    document.head.appendChild(st);

    const stage = document.getElementById("stage");
    const lsGet = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(_e){ return d; } };
    const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(_e){} };

    // ---------- T047 オートセーブ表示 ----------
    const ind = document.createElement("div"); ind.id = "qolSave"; ind.textContent = "💾 セーブ"; stage.appendChild(ind);
    let indT = 0;
    const origAuto = window.tqAutoSave;
    window.tqAutoSave = function(){
        const had = !!(G.S && G.slot);
        const r = origAuto.apply(this, arguments);
        if(had){
            ind.classList.add("on"); clearTimeout(indT); indT = setTimeout(() => ind.classList.remove("on"), 1000);
            try{   // 図鑑：持っているアイテムを記録（T044）
                const S = G.S; S.dex = S.dex || {foe:{}, item:{}};
                Object.keys(S.items || {}).forEach((k) => { if(S.items[k] > 0) S.dex.item[k] = 1; });
                (S.own || []).forEach((k) => { S.dex.item[k] = 1; });
            }catch(_e){}
        }
        return r;
    };

    // ---------- T049 セリフ履歴 ----------
    let LOG = []; try{ LOG = JSON.parse(lsGet("tq_backlog", "[]")); if(!Array.isArray(LOG)) LOG = []; }catch(_e){ LOG = []; }
    const origSpeak = window.tqSpeak;
    window.tqSpeak = function(text, who){
        try{
            if(G.mode === "talk" && G.say && G.say.text){
                const last = LOG[LOG.length - 1], w = String(G.say.who || ""), t = String(G.say.text);
                if(!(last && last.w === w && last.t === t)){ LOG.push({w, t}); if(LOG.length > 100) LOG = LOG.slice(-100); lsSet("tq_backlog", JSON.stringify(LOG)); }
            }
        }catch(_e){}
        return origSpeak.apply(this, arguments);
    };
    function showLog(){
        closeLog();
        const d = document.createElement("div"); d.id = "qolLog";
        d.innerHTML = "<h2>📜 セリフの れきし（さいご100こ）</h2>" + (LOG.length ? LOG.slice().reverse().map((r) => '<div class="r">' + (r.w ? '<span class="w">' + esc(r.w) + "</span><br>" : "") + esc(r.t).replace(/\n/g, "<br>") + "</div>").join("") : "<div>まだ ありません。</div>") + '<button type="button" id="qolLogX">とじる</button>';
        stage.appendChild(d);
        d.querySelector("#qolLogX").addEventListener("click", closeLog);
    }
    function closeLog(){ const d = document.getElementById("qolLog"); if(d) d.remove(); }

    // ---------- T050 文字の はやさ・大きさ ----------
    window.typeInto = function(el, text, instant){
        clearInterval(G.typeT); G.typing = null;
        if(!el) return;
        const sp = G.set.tspeed || 0;                      // 0 ふつう / 1 はやい(すぐ全部) / 2 ゆっくり
        if(instant || !text || sp === 1){ el.textContent = text; tqAtArm(); return; }
        let i = 0; el.textContent = ""; G.typing = {el, text};
        const step = sp === 2 ? 1 : 2, ms = sp === 2 ? 45 : 28;
        G.typeT = setInterval(() => { i += step; el.textContent = text.slice(0, i); if(i >= text.length){ clearInterval(G.typeT); G.typing = null; tqAtArm(); } }, ms);
    };
    function applyFs(){ document.body.classList.remove("qfs1", "qfs2"); const f = G.set.fsize || 0; if(f) document.body.classList.add("qfs" + f); }
    const origSettings = window.viewSettings;
    window.viewSettings = function(){
        let h = origSettings.apply(this, arguments);
        const add = '<div class="card"><div class="row"><button class="btn" data-a="sTSpeed">💬 文字の でかた：' + ["ふつう", "すぐ ぜんぶ", "ゆっくり"][G.set.tspeed || 0] + '</button><button class="btn" data-a="sFsize">🔠 文字の 大きさ：' + ["ふつう", "大", "とても大"][G.set.fsize || 0] + '</button></div><div class="meta">会話ウィンドウの 文字が 読みやすく なります。</div></div>';
        const key = '<div class="row"><button class="btn" data-a="sBack">';
        const i = h.lastIndexOf(key); return i < 0 ? h : h.slice(0, i) + add + h.slice(i);
    };
    ACT.sTSpeed = () => { G.set.tspeed = ((G.set.tspeed || 0) + 1) % 3; tqSettingsSave(); render(); };
    ACT.sFsize = () => { G.set.fsize = ((G.set.fsize || 0) + 1) % 3; tqSettingsSave(); applyFs(); render(); };

    // ---------- T041 属性相性（みず＞ひ＞くさ＞みず）----------
    const EL = {fire:"ひ", water:"みず", grass:"くさ"}, BEATS = {water:"fire", fire:"grass", grass:"water"};
    const EMO = {"🔥":"fire", "👹":"fire", "🌋":"fire", "🌶":"fire", "🦊":"fire", "💧":"water", "🐟":"water", "🐸":"water", "🐙":"water", "🦀":"water", "🐠":"water", "🌊":"water", "🐢":"water", "🌿":"grass", "🌳":"grass", "🍀":"grass", "🌱":"grass", "🍄":"grass", "🌵":"grass", "🌻":"grass"};
    function foeEl(f){ if(f.el) return f.el; const e = String(f.e || ""); for(const k in EMO){ if(e.indexOf(k) >= 0) return EMO[k]; } return null; }
    const SK_EL = {code:"fire", beam:"water"};
    const origRound = window.battleRound;
    window.battleRound = function(act){ G.qolEl = (act && act.k === "skill") ? (SK_EL[act.id] || null) : null; return origRound.apply(this, arguments); };
    const origHurt = window.bFoeHurt;
    window.bFoeHurt = function(f, d){
        let note = "";
        try{
            const a = G.qolEl, e = foeEl(f);
            if(a && e){
                if(BEATS[a] === e){ d = Math.round(d * 1.5); note = "こうかは ばつぐんだ！（" + EL[a] + "→" + EL[e] + "）"; }
                else if(BEATS[e] === a){ d = Math.max(1, Math.round(d * 0.6)); note = "こうかは いまひとつ…（" + EL[a] + "→" + EL[e] + "）"; }
            }
        }catch(_e){}
        const r = origHurt.call(this, f, d);
        if(note) bLog(note);
        return r;
    };

    // ---------- T044 図鑑（たおした てき）----------
    const origStart = window.battleStart;
    window.battleStart = function(ids){
        try{ const S = G.S; S.dex = S.dex || {foe:{}, item:{}}; (ids || []).forEach((id) => { const r = S.dex.foe[id] || (S.dex.foe[id] = {s:0, k:0}); r.s++; }); }catch(_e){}
        return origStart.apply(this, arguments);
    };
    const origEnd = window.endBattle;
    window.endBattle = function(res){
        try{ if(res === "win" && G.b){ const S = G.S; S.dex = S.dex || {foe:{}, item:{}}; G.b.foes.forEach((f) => { if(f.cur <= 0 && !f.fled){ const r = S.dex.foe[f.id] || (S.dex.foe[f.id] = {s:1, k:0}); r.k++; } }); } }catch(_e){}
        return origEnd.apply(this, arguments);
    };

    // ---------- T045 ワープ用に 来た場所を 記録 ----------
    const origGoto = window.gotoMap;
    window.gotoMap = function(map, x, y){ try{ const S = G.S; S.vis = S.vis || {}; S.vis[map] = [x, y]; }catch(_e){} return origGoto.apply(this, arguments); };

    // ---------- メニューに 新しいタブ ----------
    const TABS = [["quest", "📋 いらい（もくひょう）"], ["dex", "📖 ずかん"], ["warp", "🌀 ワープ"], ["log", "📜 セリフの れきし"]];
    let tabBody = function(t){
        const S = G.S;
        if(t === "quest"){
            const L = [];
            L.push('<div class="card"><b>🎯 いまの もくてき</b><div>' + esc(tqObjective()) + "</div></div>");
            L.push("<h3>メモリあつめ</h3>" + RPG_MEM_NAMES.map((n, i) => '<div class="card">' + (S.mem[i] ? "✅ " : "⬜ ") + esc(rpgFmt(n)) + "</div>").join(""));
            const goals = [["てきを 10たい たおす", S.kills, 10], ["てきを 50たい たおす", S.kills, 50], ["てきを 200たい たおす", S.kills, 200], ["1000 ほ あるく", S.steps, 1000], ["10000 ほ あるく", S.steps, 10000], ["レベル 10 に なる", S.lv, 10], ["レベル 30 に なる", S.lv, 30], ["10000G ためる", S.gold, 10000]];
            L.push("<h3>やりこみ もくひょう</h3>" + goals.map((g) => '<div class="card">' + (g[1] >= g[2] ? "✅ " : "⬜ ") + esc(g[0]) + ' <span class="meta">(' + Math.min(g[1], g[2]).toLocaleString() + "/" + g[2].toLocaleString() + ")</span></div>").join(""));
            return "<h2>📋 いらい（もくひょう）</h2>" + L.join("");
        }
        if(t === "dex"){
            const dx = S.dex || {foe:{}, item:{}}, ids = Object.keys(RPG_FOES), seen = ids.filter((i) => dx.foe[i]);
            const its = Object.keys(RPG_ITEMS).concat(Object.keys(RPG_EQUIP)), got = its.filter((i) => dx.item[i]);
            return "<h2>📖 ずかん</h2><div class='meta'>てき：" + seen.length + "/" + ids.length + "　どうぐ・そうび：" + got.length + "/" + its.length + "</div><h3>てき</h3>" +
                ids.map((i) => { const f = RPG_FOES[i], r = dx.foe[i], e = foeEl(f); return '<div class="card">' + (r ? (esc(f.e) + " <b>" + esc(f.n) + "</b> <span class='meta'>HP" + f.hp + (e ? "　ぞくせい：" + EL[e] : "") + "　であった " + r.s + "回／たおした " + r.k + "回</span>") : "❔ ？？？") + "</div>"; }).join("") +
                "<h3>どうぐ・そうび</h3>" + its.map((i) => { const it = RPG_ITEMS[i] || RPG_EQUIP[i]; return '<div class="card">' + (dx.item[i] ? "<b>" + esc(it.n) + "</b> <span class='meta'>" + esc(it.d || "") + "</span>" : "❔ ？？？") + "</div>"; }).join("");
        }
        if(t === "warp"){
            const vis = S.vis || {}, ok = G.mode === "menu" && !G.scripts.length;
            const list = Object.keys(vis).filter((m) => RPG_MAPS[m] && !RPG_MAPS[m].enc);
            return "<h2>🌀 ワープ</h2><div class='meta'>いちど いった まちや たてもの（てきの でない ばしょ）に とべます。</div>" + (G.menuMsg ? '<div class="okc">' + esc(G.menuMsg) + "</div>" : "") +
                (list.length ? list.map((m) => '<div class="card row" style="justify-content:space-between"><span>' + esc(RPG_MAPS[m].name) + (m === S.map ? " <span class='meta'>（いまここ）</span>" : "") + '</span><button class="btn sub" data-a="qWarp" data-v="' + esc(m) + '"' + (ok && m !== S.map ? "" : " disabled") + ">とぶ</button></div>").join("") : "<div class='meta'>まだ とべる ばしょが ありません。</div>");
        }
        if(t === "log"){ return "<h2>📜 セリフの れきし</h2><div class='row'><button class='btn' data-a='qLog'>ひらく（さいご100こ）</button></div>"; }
        return "";
    };
    ACT.qWarp = (m) => {
        const S = G.S, v = S.vis && S.vis[m];
        if(!v || !RPG_MAPS[m] || RPG_MAPS[m].enc){ return; }
        G.mode = "script"; G.scripts.length = 0; gotoMap(m, v[0], v[1]); pump();
    };
    ACT.qLog = () => showLog();
    const origMenu = window.menuView;
    window.menuView = function(){
        const t = G.menuTab || "main", mine = TABS.some((x) => x[0] === t);
        const keep = G.menuTab; if(mine) G.menuTab = "main";
        let h = origMenu.apply(this, arguments); G.menuTab = keep;
        const btns = TABS.map((x) => '<button class="opt" data-a="mnav" data-v="' + x[0] + '">' + x[1] + "</button>").join("");
        h = h.replace('<button class="opt" data-a="mclose">', btns + '<button class="opt" data-a="mclose">');
        if(mine){ const i = h.indexOf('<div id="mc"'); h = h.slice(0, i) + '<div id="mc" class="win">' + tabBody(t) + "</div>"; }
        return h;
    };


    // ---------- 声の高さ（T055）----------
    try{
        if(window.speechSynthesis){
            const ss = window.speechSynthesis, os = ss.speak.bind(ss);
            ss.speak = (u) => { try{ const m = [0.85, 1, 1.15][G.set.vpitch == null ? 1 : G.set.vpitch]; u.pitch = Math.max(0.1, Math.min(2, u.pitch * m)); }catch(_e){} os(u); };
        }
    }catch(_e){}
    ACT.sYomi = () => {
        if(!G.S){ return; }
        const cur = G.S.yomi || "", v = prompt("主人公「" + G.S.name + "」の よみがな（ひらがな・かたかな）。空にすると 名前のまま よみます。", cur);
        if(v === null) return; const y = tqNormYomi(v, G.S.name);
        if(y === null){ toast("ひらがな・かたかなで 20文字までです。"); return; }
        G.S.yomi = y; tqAutoSave(); toast(y ? "よみがなを 「" + y + "」に しました。" : "よみがなを 消しました。"); tqSpeak("こんにちは。" + G.S.name + "です。", "me"); render();
    };
    ACT.sVpitch = () => { G.set.vpitch = ((G.set.vpitch == null ? 1 : G.set.vpitch) + 1) % 3; tqSettingsSave(); tqSpeak("こんにちは。声の 高さを かえました。", "me"); render(); };
    const origSet2 = window.viewSettings;
    window.viewSettings = function(){
        let h = origSet2.apply(this, arguments);
        const add = '<div class="card"><div class="row"><button class="btn" data-a="sYomi">🔤 主人公の よみがな：' + esc((G.S && G.S.yomi) || "未設定") + '</button> <button class="btn" data-a="sVpitch">🎤 声の 高さ：' + ["ひくめ", "ふつう", "たかめ"][G.set.vpitch == null ? 1 : G.set.vpitch] + '</button></div><div class="meta">声の オン／オフは 上の ボタン。</div></div>';
        const key = '<div class="row"><button class="btn" data-a="sBack">', i = h.lastIndexOf(key); return i < 0 ? h : h.slice(0, i) + add + h.slice(i);
    };

    // ---------- ふるえ（T069/T070）と チート記録（T067）----------
    const origBHurt = window.bHurt;
    window.bHurt = function(id, d){ try{ if(window.AREvib && d > 0) AREvib(d > 30 ? 60 : 30); }catch(_e){} return origBHurt.apply(this, arguments); };
    const origBHit = window.bHit;
    window.bHit = function(){ try{ if(window.AREvib) AREvib(18); }catch(_e){} return origBHit.apply(this, arguments); };
    const origSave2 = window.tqAutoSave;
    window.tqAutoSave = function(){ try{ const c = G.S && G.S.cx; if(c && (c.god || c.st999 || c.onehit || c.infmp || c.noenc || c.areall || c.ggold || c.gexp || c.allgate || (G.S.expmul > 1))) G.S.cheated = 1; }catch(_e){} return origSave2.apply(this, arguments); };

    // ---------- 追加タブ：おとテスト（T064）・あらすじ（T074）・ショップ売却（T059）----------
    TABS.push(["sound", "🎵 おとテスト"], ["story", "📖 あらすじ"]);
    const origTab = tabBody;
    tabBody = function(t){
        if(t === "sound"){
            return "<h2>🎵 おとテスト</h2><div class='meta'>曲を ためしに ききます（ボタンを おすと 再生。もういちど おすと 止まります）。</div>" +
                Object.keys(TQ_BGM).map((k) => '<div class="card row" style="justify-content:space-between"><span>' + esc(TQ_BGM[k].n) + '</span><button class="btn sub" data-a="qSnd" data-v="' + k + '">' + (G.qSnd === k ? "■ とめる" : "▶ きく") + '</button></div>').join("") + "<div class='row'><button class='btn' data-a='qSndStop'>ぜんぶ とめる</button></div>";
        }
        if(t === "story"){
            const S = G.S;
            return "<h2>📖 あらすじ</h2><div class='meta'>いままでの おはなし（行った時代と、クリア状況）</div><div class='card'><b>🎯 いまの もくてき</b><div>" + esc(tqObjective()) + "</div></div>" +
                eraList().map((e) => '<div class="card">' + (S.f[e.done] ? "✅ " : "▶ ") + esc(e.n) + "</div>").join("") + (S.cheated ? "<div class='meta'>※ チートを つかった きろく が あります。</div>" : "");
        }
        return origTab(t);
    };
    ACT.qSnd = (k) => {
        try{ if(G.qSndA){ G.qSndA.pause(); G.qSndA = null; } if(G.qSnd === k){ G.qSnd = ""; tqBgmSync(); render(); return; }
            tqBgmStop(); const a = new Audio("./bgm/" + TQ_BGM[k].file); a.volume = tqBgmVol(); a.loop = !TQ_BGM[k].se && k !== "ending"; a.play().catch(() => toast("この曲は ならせませんでした。")); G.qSndA = a; G.qSnd = k; }catch(_e){}
        render();
    };
    ACT.qSndStop = () => { try{ if(G.qSndA){ G.qSndA.pause(); G.qSndA = null; } G.qSnd = ""; tqBgmSync(); }catch(_e){} render(); };
    // ショップの 売却（かった ねだんの はんぶん）
    const origShop = window.shopView;
    window.shopView = function(){
        let h = origShop.apply(this, arguments);
        const S = G.S, sell = Object.keys(S.items || {}).filter((k) => S.items[k] > 0 && RPG_ITEMS[k] && RPG_ITEMS[k].price).map((k) => '<div class="card row" style="justify-content:space-between"><span><b>' + esc(RPG_ITEMS[k].n) + '</b> <span class="meta">×' + S.items[k] + '</span></span><button class="btn sub" data-a="qSell" data-v="' + k + '">うる ' + Math.floor(RPG_ITEMS[k].price / 2) + 'G</button></div>').join("");
        const key = '<div class="row" style="margin-top:.6cqw"><button class="btn sub" data-a="shopclose">', i = h.lastIndexOf(key);
        return i < 0 || !sell ? h : h.slice(0, i) + '<h3>どうぐを うる</h3>' + sell + h.slice(i);
    };
    ACT.qSell = (k) => { const S = G.S, it = RPG_ITEMS[k]; if(!it || !(S.items[k] > 0)) return; S.items[k]--; const g = Math.floor(it.price / 2); S.gold = Math.min(TQ_MAX_GOLD, S.gold + g); G.shopMsg = it.n + "を うって " + g + "G に なった。"; tqAutoSave(); render(); };

    // ---------- T048 ミニマップ と 履歴ボタン ----------
    const btns = document.createElement("div"); btns.id = "qolBtns";
    btns.innerHTML = '<button type="button" id="qolMapBtn" aria-label="ミニマップ">🗺</button><button type="button" id="qolLogBtn" aria-label="セリフの れきし">📜</button>';
    stage.appendChild(btns);
    const cvs = document.createElement("canvas"); cvs.id = "qolMini"; stage.appendChild(cvs);
    let miniOn = lsGet("tq_mini", innerWidth >= 700 ? "1" : "0") === "1";
    document.getElementById("qolMapBtn").addEventListener("click", (e) => { e.stopPropagation(); miniOn = !miniOn; lsSet("tq_mini", miniOn ? "1" : "0"); drawMini(); });
    document.getElementById("qolLogBtn").addEventListener("click", (e) => { e.stopPropagation(); showLog(); });
    function drawMini(){
        const show = G.S && (G.mode === "map" || G.mode === "talk" || G.mode === "choice");
        btns.style.display = show ? "flex" : "none";
        if(!show || !miniOn){ cvs.style.display = "none"; return; }
        const mp = RPG_MAPS[G.S.map]; if(!mp || !mp.rows) { cvs.style.display = "none"; return; }
        const h = mp.rows.length, w = Math.max.apply(null, mp.rows.map((r) => r.length)), s = Math.max(2, Math.min(6, Math.floor(160 / w), Math.floor(110 / h)));
        cvs.width = w * s; cvs.height = h * s; cvs.style.display = "block";
        const g = cvs.getContext("2d");
        for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const t = RPG_TILES[mp.rows[y][x]]; g.fillStyle = t ? (t.w ? t.c : "#222a44") : "#000"; g.fillRect(x * s, y * s, s, s); }
        (mp.objs || []).forEach((o) => { if(o.k === "npc" && objVisible(o)){ g.fillStyle = "#ffd86b"; g.fillRect(o.x * s, o.y * s, s, s); } });
        g.fillStyle = "#ff3b3b"; g.fillRect(G.S.x * s - 1, G.S.y * s - 1, s + 2, s + 2);
    }
    setInterval(drawMini, 250);

    // ---------- T046 つり（みずの となりで 🎣）----------
    const FISH = [["こあじ", 12, "🐟"], ["ふな", 20, "🐠"], ["にじます", 35, "🐟"], ["おおきな こい", 60, "🐡"], ["きんいろの さかな", 150, "✨"]];
    const fbtn = document.createElement("button"); fbtn.type = "button"; fbtn.id = "qolFishBtn"; fbtn.textContent = "🎣"; fbtn.setAttribute("aria-label", "つりをする"); btns.appendChild(fbtn); fbtn.style.display = "none";
    function nearWater(){
        try{ const S = G.S, mp = RPG_MAPS[S.map]; return [[1,0],[-1,0],[0,1],[0,-1]].some((d) => { const r = mp.rows[S.y + d[1]]; return r && r[S.x + d[0]] === "~"; }); }catch(_e){ return false; }
    }
    setInterval(() => { fbtn.style.display = (G.S && G.mode === "map" && nearWater()) ? "" : "none"; }, 300);
    fbtn.addEventListener("click", (e) => { e.stopPropagation(); startFish(); });
    function startFish(){
        if(document.getElementById("qolFish") || G.mode !== "map") return;
        const d = document.createElement("div"); d.id = "qolFish";
        d.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:13;width:56cqw;background:rgba(6,12,50,.97);border:.35cqw solid #8fb4ff;border-radius:1.4cqw;padding:2cqw;color:#fff;font-size:2.2cqw;text-align:center";
        const zw = 18 + Math.floor(Math.random() * 10), zs = 10 + Math.floor(Math.random() * (80 - zw));
        d.innerHTML = "<div>🎣 ウキが みどりの ところに きたら『いまだ！』</div><div id='qfBar' style='position:relative;height:4cqw;margin:1.6cqw 0;background:#223;border-radius:2cqw;overflow:hidden'><div style='position:absolute;left:" + zs + "%;width:" + zw + "%;top:0;bottom:0;background:#3c9d5a'></div><div id='qfK' style='position:absolute;top:0;bottom:0;width:2%;background:#ffd86b'></div></div><div id='qfR' style='min-height:3cqw'></div><div><button type='button' id='qfGo' style='font-size:2.4cqw;padding:.6cqw 3cqw;border-radius:1cqw;border:.25cqw solid #8fb4ff;background:#1a2fa8;color:#fff'>いまだ！</button> <button type='button' id='qfX' style='font-size:2cqw;padding:.6cqw 2cqw;border-radius:1cqw;border:.25cqw solid #8fb4ff;background:#2a3050;color:#fff'>やめる</button></div>";
        stage.appendChild(d);
        let pos = 0, dir = 1, raf = 0, done = false; const k = d.querySelector("#qfK"), spd = 1.1 + Math.random() * .8;
        const tick = () => { pos += dir * spd; if(pos >= 98){ pos = 98; dir = -1; } if(pos <= 0){ pos = 0; dir = 1; } k.style.left = pos + "%"; raf = requestAnimationFrame(tick); };
        tick();
        const end = () => { cancelAnimationFrame(raf); d.remove(); };
        d.querySelector("#qfX").addEventListener("click", end);
        d.querySelector("#qfGo").addEventListener("click", () => {
            if(done) return; done = true; cancelAnimationFrame(raf);
            const hit = pos >= zs - 1 && pos <= zs + zw, r = d.querySelector("#qfR");
            if(hit){
                const f = FISH[Math.min(FISH.length - 1, Math.floor(Math.pow(Math.random(), 1.8) * FISH.length))];
                const S = G.S; S.gold = Math.min(TQ_MAX_GOLD, S.gold + f[1]); S.fish = (S.fish || 0) + 1; tqAutoSave();
                r.textContent = f[2] + " " + f[0] + " が つれた！ うって " + f[1] + "G に なった。";
            }else r.textContent = "にげられた…";
            const b = d.querySelector("#qfGo"); b.textContent = "もういちど"; b.onclick = null; b.replaceWith(b.cloneNode(true));
            d.querySelector("#qfGo").addEventListener("click", () => { end(); startFish(); });
        });
    }


    // ---------- T037 ゲーム内お知らせ（GitHub上の announce.json を読むだけ。Supabaseは使わない）----------
    try{
        fetch("./announce.json", {cache:"no-cache"}).then((r) => r.ok ? r.json() : null).then((a) => {
            if(!a || !a.id || lsGet("tq_announce_seen", "") === a.id) return;
            lsSet("tq_announce_seen", a.id); setTimeout(() => toast("📢 " + a.text, 7000), 1500);
        }).catch(() => {});
    }catch(_e){}

    // ---------- 描画のあとの 後始末 ----------
    const origRender = window.render;
    window.render = function(){ const r = origRender.apply(this, arguments); applyFs(); if(G.mode !== "talk" && G.mode !== "map") closeLog(); return r; };
    applyFs(); drawMini();
    // ---------- ローディング画面を 消す（T071）----------
    const ld = document.getElementById("qolLoad"); if(ld){ const rm = () => { ld.style.opacity = 0; setTimeout(() => ld.remove(), 450); }; if(document.readyState === "complete") setTimeout(rm, 200); else window.addEventListener("load", () => setTimeout(rm, 200)); setTimeout(rm, 6000); }
})();


/* ==== game/boot.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[65]=1;
"use strict";
try{ if(location.search){ if(new URLSearchParams(location.search).has("name")){ try{ localStorage.setItem("tq_suggest_name", String(new URLSearchParams(location.search).get("name")).slice(0, 10)); }catch(_e){} history.replaceState(null, "", location.pathname); } } }catch(_e){}
// ===== 起動 =====
(function(){
    tqSettingsLoad();
    // 画面の向き：スマホの たてむき だと「よこむき すいしょう」を出す
    try{ if(window.matchMedia("(orientation: portrait)").matches && window.innerWidth < 900) document.body.classList.add("needrot"); }catch(_e){}
    try{ if(window.matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch"); }catch(_e){}
    G.mode = "title"; render();
    // インストール（アプリ化）：このゲーム専用の sw.js（スコープ＝このフォルダ）。失敗してもゲームは ふつうに あそべる
    try{ if("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("./sw.js", {scope:"./"}).catch(() => {}); }catch(_e){}
    window.addEventListener("beforeunload", () => { try{ tqAutoSave(); }catch(_e){} });
    document.addEventListener("visibilitychange", () => { if(document.hidden){ try{ tqAutoSave(); }catch(_e){} } });
})();

