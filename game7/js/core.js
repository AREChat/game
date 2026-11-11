"use strict";
// OFFLINE PARADISE：ルーレット・共通のコイン・図鑑・音・入力・ゲームの進行（ミニゲーム本体は games.js）
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var KEY = "game7_save_v1";
  var save = {coins: 0, own: {}, eq: "", best: {}, plays: 0, mute: false};
  try{ var o = JSON.parse(localStorage.getItem(KEY) || "null"); if(o && typeof o === "object"){ save.coins = +o.coins || 0; save.own = o.own || {}; save.eq = o.eq || ""; save.best = o.best || {}; save.plays = +o.plays || 0; save.mute = !!o.mute; } }catch(_e){}
  function persist(){ try{ localStorage.setItem(KEY, JSON.stringify(save)); }catch(_e){} }

  var ITEMS = [
    ["🎩", "シルクハット", 50], ["🕶️", "サングラス", 80], ["👑", "王冠", 150], ["🪽", "天使のつばさ", 200], ["🌈", "にじ", 250], ["🚀", "ロケット", 300],
    ["🔮", "すいしょう玉", 350], ["🐉", "ドラゴン", 400], ["🛰️", "通信衛星", 500], ["🏰", "お城", 600], ["🏆", "金のトロフィー", 1000], ["🌟", "伝説のスター", 2000]
  ];

  // ---------- 音（WebAudio。ファイル不要） ----------
  var AC = null, master = null, intensity = 0, step = 0, bgmTimer = 0;
  function ac(){ if(AC) return AC; try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = save.mute ? 0 : .5; master.connect(AC.destination); }catch(_e){ AC = null; } return AC; }
  function tone(f, d, type, vol, when, slide){
    if(!ac() || save.mute) return;
    var t = AC.currentTime + (when || 0), os = AC.createOscillator(), g = AC.createGain();
    os.type = type || "square"; os.frequency.setValueAtTime(f, t); if(slide) os.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
    g.gain.setValueAtTime(vol || .15, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    os.connect(g); g.connect(master); os.start(t); os.stop(t + d + .02);
  }
  var SFX = {
    jump: function(){ tone(300, .18, "square", .12, 0, 700); }, coin: function(){ tone(988, .08, "square", .1); tone(1318, .12, "square", .1, .06); },
    hit: function(){ tone(160, .22, "sawtooth", .18, 0, 50); }, good: function(){ tone(660, .1, "triangle", .2); tone(880, .15, "triangle", .2, .08); },
    perfect: function(){ [523, 659, 784, 1046].forEach(function(f, i){ tone(f, .14, "triangle", .2, i * .06); }); },
    drop: function(){ tone(220, .1, "square", .12, 0, 110); }, fan: function(){ [523, 659, 784, 1046, 1318].forEach(function(f, i){ tone(f, .22, "square", .14, i * .09); }); },
    spin: function(){ tone(700 + Math.random() * 400, .05, "square", .08); }, lose: function(){ tone(300, .4, "sawtooth", .15, 0, 80); }
  };
  var SCALE = [0, 3, 7, 10, 12, 15, 19, 22];
  function bgmStep(){
    if(!AC || save.mute || document.hidden) return;
    var root = 196 * Math.pow(2, [0, 0, 5, 5, 3, 3, 7, 7][(step >> 3) & 7] / 12), n = step & 7;
    tone(root / 2, .22, "triangle", .12);                                      // ベース
    if(intensity >= 1) tone(root * Math.pow(2, SCALE[(n * 3 + (step >> 3)) % 8] / 12), .13, "square", .045);   // アルペジオ
    if(intensity >= 2 && n % 2 === 0) tone(root * 2, .25, "sawtooth", .03);    // 厚み
    if(intensity >= 3){ tone(70, .09, "sine", .2, 0, 40); if(n % 2) tone(5000, .03, "square", .03); }   // ドラム
    step++;
  }
  function bgmOn(){ if(!ac()) return; if(AC.state === "suspended") AC.resume(); if(!bgmTimer) bgmTimer = setInterval(bgmStep, 170); }
  function setIntensity(i){ intensity = Math.max(0, Math.min(3, i)); }
  $("snd").onclick = function(){ save.mute = !save.mute; persist(); paintSnd(); if(master) master.gain.value = save.mute ? 0 : .5; };
  function paintSnd(){ $("snd").textContent = save.mute ? "🔇" : "🔊"; } paintSnd();
  // 音の許可は「ゆびを はなした時」「click」「キー」でないと 出ない（iPhone・iPad・Android）。さわった しゅんかん（pointerdown）だけでは 足りない
  ["pointerdown", "pointerup", "touchend", "click", "keydown"].forEach(function(t){ document.addEventListener(t, function(){ bgmOn(); }, {passive: true, capture: true}); });

  // ---------- 画面 ----------
  function show(id){ document.querySelectorAll(".scr").forEach(function(s){ s.classList.toggle("on", s.id === id); }); if(id !== "s-play") setIntensity(0); }
  function paintWallet(){ $("coinN").textContent = save.coins; $("coinN2").textContent = save.coins;
    var it = ITEMS.filter(function(x){ return x[0] === save.eq; })[0]; $("equipped").textContent = it ? "着用中：" + it[0] + " " + it[1] : ""; }
  function paintNet(){ var on = navigator.onLine !== false, n = $("net"); n.textContent = on ? "📶 つながっているよ" : "✈ オフライン中"; n.classList.toggle("on", on); }
  paintNet();

  // ---------- 図鑑・ショップ ----------
  function paintColl(){
    $("collList").innerHTML = ITEMS.map(function(x, i){
      var own = save.own[x[0]], eq = save.eq === x[0];
      return '<button type="button" class="item' + (own ? " own" : "") + (eq ? " eq" : "") + (!own && save.coins < x[2] ? " off" : "") + '" data-i="' + i + '"><span class="ic">' + (own ? x[0] : "❔") + '</span>' + (own ? x[1] + (eq ? "（着用）" : "") : x[1] + "<br>🪙 " + x[2]) + '</button>';
    }).join("");
    $("collList").querySelectorAll(".item").forEach(function(b){ b.onclick = function(){
      var x = ITEMS[+b.dataset.i];
      if(save.own[x[0]]){ save.eq = save.eq === x[0] ? "" : x[0]; SFX.good(); }
      else if(save.coins >= x[2]){ save.coins -= x[2]; save.own[x[0]] = 1; save.eq = x[0]; SFX.fan(); }
      else { SFX.hit(); return; }
      persist(); paintWallet(); paintColl();
    }; });
  }

  // ---------- ルーレット ----------
  var GAMES = [];            // games.js が登録する
  var current = null, running = false, jackpot = false, fromRoulette = false;
  function pickByChance(){ var t = GAMES.reduce(function(s, g){ return s + g.chance; }, 0), r = Math.random() * t; for(var i = 0; i < GAMES.length; i++){ r -= GAMES[i].chance; if(r <= 0) return GAMES[i]; } return GAMES[0]; }
  function roulette(){
    show("s-roul"); fromRoulette = true;
    var target = pickByChance(), n = 0, total = 26, reel = $("reel"), msg = $("roulette") || $("roulMsg");
    msg.textContent = "ルーレット スタート！";
    (function spin(){
      var g = n < total ? GAMES[Math.floor(Math.random() * GAMES.length)] : target;
      reel.textContent = g.icon; SFX.spin(); n++;
      if(n <= total) setTimeout(spin, 55 + n * n * .55);
      else {
        msg.innerHTML = '<b style="font-size:22px">' + target.icon + ' ' + target.name + '</b><br>' + (target.chance <= 10 ? "✨ 超激レア！ ✨" : "きょうは これ！");
        SFX.fan(); setTimeout(function(){ start(target); }, 1500);
      }
    })();
  }

  // ---------- ゲームの進行 ----------
  var cv = $("cv"), cx = cv.getContext("2d"), W = 360, H = 640;
  var T = {t: 0, last: 0, raf: 0};
  var S = {score: 0, combo: 0};             // ゲーム側から使う
  function start(g){ if(core.gate) core.gate(g, begin); else begin(g); }       // gate：操作説明の画面（input.js）。なければ そのまま はじめる
  function begin(g){
    current = g; running = true; core.paused = false; jackpot = false; core.over = false; core.bonusTime = 0;
    show("s-play"); $("hName").textContent = g.icon + " " + g.name; $("hScore").textContent = "0"; $("hTime").textContent = g.dur;
    var help = $("help"); help.textContent = g.help; help.style.opacity = 1; setTimeout(function(){ help.style.opacity = 0; }, 3200);
    S.score = 0; S.combo = 0; setIntensity(1);
    g.init(core);
    if(core.onBegin) core.onBegin(g);
    T.t = 0; T.last = performance.now(); cancelAnimationFrame(T.raf); T.raf = requestAnimationFrame(loop);
  }
  function abort(){ running = false; core.paused = false; core.over = false; cancelAnimationFrame(T.raf); setIntensity(0); show("s-title"); if(core.onEnd) core.onEnd(); }
  function loop(now){
    if(!running) return;
    var dt = Math.min(.05, (now - T.last) / 1000); T.last = now;
    if(core.paused){ T.raf = requestAnimationFrame(loop); return; }              // 一時停止中
    var sdt = dt * (core.speed || 1);                                           // ゲームの速さ（せってい：ふつう／ゆっくり）
    if(core.frame) core.frame(dt);                                              // パッド・キーボードの おしっぱなし処理（input.js）
    if(!document.hidden){ T.t += sdt; current.update(sdt, core); }
    var left = Math.max(0, current.dur - T.t + (core.bonusTime || 0));
    $("hTime").textContent = Math.ceil(left); $("hScore").textContent = Math.floor(S.score);
    current.draw(cx, core);
    if(left <= 0 || core.over){ finish(); return; }
    T.raf = requestAnimationFrame(loop);
  }
  function cutin(text, ms){ var c = $("cutin"); c.textContent = text; c.classList.add("on"); setTimeout(function(){ c.classList.remove("on"); }, ms || 1600); }
  function finish(){
    running = false; core.over = false; core.bonusTime = 0;
    var g = current, sc = Math.floor(S.score), mult = jackpot ? 2 : 1, gain = Math.floor(sc * g.coinRate * mult * (fromRoulette ? 1.5 : 1));
    var best = save.best[g.id] || 0, rec = sc > best; if(rec) save.best[g.id] = sc;
    save.coins += gain; save.plays++; persist(); paintWallet();
    $("rTitle").textContent = g.icon + " " + g.name;
    $("rScore").textContent = sc;
    $("rInfo").innerHTML = (rec ? "🎉 ベストスコア こうしん！<br>" : "ベスト：" + best + "<br>") + (jackpot ? "📡 通信回復ジャックポット！ コイン 2 倍！<br>" : "") + (fromRoulette ? "🎰 ルーレットボーナス ×1.5" : "");
    $("rCoin").innerHTML = "🪙 +" + gain + "（ぜんぶで " + save.coins + "）";
    SFX[rec ? "fan" : "good"](); show("s-res");
    if(core.onEnd) core.onEnd();
  }

  // 電波が戻ったら：ジャックポット（このゲームのコインが2倍）
  window.addEventListener("online", function(){
    paintNet();
    if(running && !jackpot){ jackpot = true; cutin("📡 通信回復おめでとう！\nスコア報酬 2 倍！", 2200); SFX.fan(); }
  });
  window.addEventListener("offline", paintNet);

  // ---------- 入力（タップ・長押し・スワイプ） ----------
  var P = {down: false, x: 0, y: 0, sx: 0, sy: 0, st: 0, swiped: false};
  function pos(e){ var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
  cv.addEventListener("pointerdown", function(e){ e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_e){} var p = pos(e); P.down = true; P.x = P.sx = p[0]; P.y = P.sy = p[1]; P.st = performance.now(); P.swiped = false;
    if(running && current.onDown) current.onDown(p[0], p[1], core); });
  cv.addEventListener("pointermove", function(e){ if(!P.down) return; var p = pos(e); P.x = p[0]; P.y = p[1];
    if(running && current.onMove) current.onMove(p[0], p[1], core);
    var dx = p[0] - P.sx, dy = p[1] - P.sy;
    if(!P.swiped && Math.max(Math.abs(dx), Math.abs(dy)) > 28){ P.swiped = true; var d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      if(running && current.onSwipe) current.onSwipe(d, core); P.sx = p[0]; P.sy = p[1]; P.swiped = current.multiSwipe ? false : true; } });
  function up(e){ if(!P.down) return; P.down = false; var p = pos(e);
    if(running && current.onUp) current.onUp(p[0], p[1], core, performance.now() - P.st, P.swiped);
    if(running && !P.swiped && current.onTap && performance.now() - P.st < 300) current.onTap(p[0], p[1], core); }
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  // キーボード・パッドの そうさは input.js が うけもつ

  // ---------- ボタン ----------
  $("bRoulette").onclick = roulette;
  $("rAgain").onclick = roulette;
  $("bPick").onclick = function(){
    $("pickList").innerHTML = GAMES.map(function(g, i){ return '<button type="button" data-i="' + i + '"><span style="font-size:30px">' + g.icon + '</span><span><b>' + g.name + '</b><small>' + g.desc + '</small></span></button>'; }).join("");
    $("pickList").querySelectorAll("button").forEach(function(b){ b.onclick = function(){ fromRoulette = false; start(GAMES[+b.dataset.i]); }; });
    show("s-pick");
  };
  $("pickBack").onclick = function(){ show("s-title"); };
  $("bColl").onclick = function(){ paintColl(); paintWallet(); show("s-coll"); };
  $("collBack").onclick = function(){ show("s-title"); };
  $("rTitleBtn").onclick = function(){ show("s-title"); };
  document.addEventListener("visibilitychange", function(){ if(running) T.last = performance.now(); });

  var core = {W: W, H: H, S: S, P: P, SFX: SFX, tone: tone, setIntensity: setIntensity, cutin: cutin, save: save, over: false, bonusTime: 0, rand: Math.random,
    register: function(g){ GAMES.push(g); }, time: function(){ return T.t; }, left: function(){ return current.dur - T.t + core.bonusTime; }, equip: function(){ return save.eq; }};
  core.show = show; core.start = start; core.begin = begin; core.abort = abort; core.roulette = roulette; core.persist = persist; core.bgmOn = bgmOn;
  core.games = GAMES; core.current = function(){ return current; }; core.isRunning = function(){ return running; }; core.pos = pos; core.paused = false; core.speed = 1;
  window.G7 = core;
  paintWallet();
})();
