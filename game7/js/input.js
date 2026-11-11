"use strict";
// OFFLINE PARADISE：そうさ まわり ぜんぶ
//  ・キーボード（好きなキーに かえられる）／ プロコン・ゲームパッド（ボタン設定つき）／ 画面のボタン（スマホ・タブレット）
//  ・あそぶ前の「そうさ説明」画面、せってい画面、あそびかた一覧、いちじ停止
// ミニゲーム本体（games.js）は 「onTap」「onSwipe」「onDown／onUp」「onMove」を うけとるだけ。ここで ぜんぶの 入力を その形に そろえる。
(function(){
  var C = window.G7; if(!C) return;
  var $ = function(id){ return document.getElementById(id); };
  var W = C.W, H = C.H;
  var ACTS = ["act", "up", "down", "left", "right"];

  // ---------- せってい ----------
  var SKEY = "game7_set_v1";
  var DEF_KEYS = {act: [" ", "Enter"], up: ["ArrowUp", "w"], down: ["ArrowDown", "s"], left: ["ArrowLeft", "a"], right: ["ArrowRight", "d"]};
  function cloneKeys(k){ var o = {}; ACTS.forEach(function(a){ o[a] = (k && k[a] ? k[a] : DEF_KEYS[a]).slice(0, 2); while(o[a].length < 2) o[a].push(""); }); return o; }
  var set = {speed: 1, pad: "auto", every: false, keys: cloneKeys(), seen: {}};
  try{
    var o = JSON.parse(localStorage.getItem(SKEY) || "null");
    if(o && typeof o === "object"){
      if(o.speed === .8 || o.speed === .65 || o.speed === 1) set.speed = o.speed;
      if(o.pad === "on" || o.pad === "off" || o.pad === "auto") set.pad = o.pad;
      set.every = !!o.every; set.seen = (o.seen && typeof o.seen === "object") ? o.seen : {};
      if(o.keys && typeof o.keys === "object") set.keys = cloneKeys(o.keys);
    }
  }catch(_e){}
  function saveSet(){ try{ localStorage.setItem(SKEY, JSON.stringify(set)); }catch(_e){} }
  C.speed = set.speed;

  // ---------- 文字 ----------
  var KN = {" ": "Space", "Enter": "Enter", "ArrowUp": "↑", "ArrowDown": "↓", "ArrowLeft": "←", "ArrowRight": "→", "": "（なし）"};
  function nk(k){ return k && k.length === 1 ? k.toLowerCase() : k; }
  function kname(k){ return KN[k] || (k && k.length === 1 ? k.toUpperCase() : k); }
  function ktext(a){ var l = set.keys[a].filter(Boolean).map(kname); return l.length ? l.join(" か ") : "（キーなし）"; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }

  // ---------- ゲームごとの そうさ ----------
  // use：その ゲームで つかう 入力。tp：画面のボタンに 出すもの。 how：あそびかたの 説明（スマホ／キーボード／プロコン）
  var INFO = {
    dash: {use: ["act", "up", "down"], tp: ["down"], actLabel: "ジャンプ", how: function(){ return {
      touch: "画面を タップ ＝ ジャンプ ／ 下へ スワイプ ＝ スライディング",
      key: ktext("act") + "、または " + ktext("up") + " ＝ ジャンプ ／ " + ktext("down") + " ＝ スライディング",
      pad: "A ＝ ジャンプ ／ 十字キー↓（スティック↓）＝ スライディング"}; }},
    castle: {use: ["act"], tp: [], actLabel: "おとす", how: function(){ return {
      touch: "画面を タップ ＝ ブロックを おとす",
      key: ktext("act") + " ＝ ブロックを おとす",
      pad: "A ＝ ブロックを おとす"}; }},
    dungeon: {use: ["up", "down", "left", "right"], tp: ["up", "down", "left", "right"], repeat: true, actLabel: "", how: function(){ return {
      touch: "上下左右に スワイプ ＝ 1マス すすむ（ぶつかると こうげき）",
      key: "矢印キー か " + [ktext("up"), ktext("down"), ktext("left"), ktext("right")].join("・") + " ＝ 1マス すすむ（おしっぱなしで つづけて）",
      pad: "十字キー か 左スティック ＝ 1マス すすむ（おしっぱなしで つづけて）"}; }},
    beat: {use: ["act"], tp: [], actLabel: "おす→はなす", how: function(){ return {
      touch: "画面を ながおし → 光の輪が ○ に かさなったら はなす",
      key: ktext("act") + " を ながおし → ○ に かさなったら はなす",
      pad: "A を ながおし → ○ に かさなったら はなす"}; }},
    fever: {use: ["left", "right"], tp: ["left", "right"], actLabel: "", how: function(){ return {
      touch: "ゆびを 左右に スライド ＝ コインを キャッチ",
      key: ktext("left") + " ・ " + ktext("right") + " ＝ 左右に うごく（おしっぱなし）",
      pad: "十字キー か 左スティック ＝ 左右に うごく"}; }}
  };
  var DEV = [["touch", "👆", "スマホ・タブレット"], ["key", "⌨️", "パソコン（キーボード）"], ["pad", "🎮", "プロコン・ゲームパッド"]];

  // ---------- 小さな 通知 ----------
  var tT = 0;
  function toast(t){
    var e = $("tst"); if(!e){ e = document.createElement("div"); e.id = "tst"; e.setAttribute("role", "status"); e.style.cssText = "position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;background:#000c;color:#fff;border:1px solid #7a5cf0;border-radius:999px;padding:8px 16px;font-size:14px;max-width:92vw;text-align:center;transition:opacity .3s;pointer-events:none"; document.body.appendChild(e); }
    e.textContent = t; e.style.opacity = 1; clearTimeout(tT); tT = setTimeout(function(){ e.style.opacity = 0; }, 2400);
  }

  // ---------- 入力の まとめ（キー・パッド・画面ボタン → こうどう） ----------
  var src = {}, eff = {}, rep = {};          // src[a]：その こうどうを おしている 入力もと ／ eff[a]：いま おされているか
  ACTS.forEach(function(a){ src[a] = {}; eff[a] = false; rep[a] = 0; });
  function setSrc(a, id, on){
    var had = Object.keys(src[a]).length > 0;
    if(on) src[a][id] = 1; else delete src[a][id];
    var now = Object.keys(src[a]).length > 0;
    if(now && !had){ eff[a] = true; press(a); }
    else if(!now && had){ eff[a] = false; release(a); }
  }
  function releaseAll(){ ACTS.forEach(function(a){ var had = eff[a]; src[a] = {}; eff[a] = false; if(had && C.isRunning()) release(a); }); }
  function usable(g, a){ var u = INFO[g.id]; return !!u && u.use.indexOf(a) >= 0; }
  function press(a){
    var g = C.current(); if(!g || !C.isRunning() || C.paused) return;
    var u = INFO[g.id]; if(!u) return;
    if(a === "act"){
      if(!usable(g, "act")) return;
      if(g.onDown) g.onDown(W / 2, H / 2, C);
      if(g.onTap) g.onTap(W / 2, H / 2, C);
    }else{
      if(!usable(g, a)) return;
      if(g.onSwipe) g.onSwipe(a, C);
      rep[a] = performance.now() + 320;
    }
  }
  function release(a){
    var g = C.current(); if(!g || !C.isRunning() || C.paused) return;
    if(a === "act" && usable(g, "act") && g.onUp) g.onUp(W / 2, H / 2, C, 200, false);
  }

  // ---------- キーボード ----------
  function actOf(k){ for(var i = 0; i < ACTS.length; i++) if(set.keys[ACTS[i]].indexOf(k) >= 0) return ACTS[i]; return ""; }
  var capture = null;       // せっていで キーを えらんでいる あいだ {a, i}
  var pauseAt = 0;
  var lastInput = "mouse", lastEsc = 0;
  function setLast(v){ if(lastInput === v) return; lastInput = v; try{ document.body.classList.toggle("nav", v === "key" || v === "pad"); }catch(_e){} }
  window.addEventListener("keydown", function(e){
    setLast("key");
    var k = nk(e.key);
    if(e.key === "Escape"){ var nw = performance.now(); if(nw - lastEsc < 90) return; lastEsc = nw; }   // are-pad.js は Esc を 2回ずつ 送るので、つづけて来た分は 1回に する
    if(capture){ onCaptureKey(e); return; }
    if(C.isRunning()){
      var other = document.querySelector(".scr.on");
      if(other && other.id !== "s-play"){ menuKey(e); return; }                // いちじ停止から ひらいた せってい・あそびかた の 画面
      if(e.key === "Escape" || k === "p"){
        if(e.key === "Escape" && performance.now() - pauseAt < 380) return;    // パッドの ＋ で とめた直後に Esc が とどく のを むし
        e.preventDefault(); togglePause(); return;
      }
      if(C.paused){ menuKey(e); return; }
      var a = actOf(k);
      if(a){ e.preventDefault(); if(!e.repeat) setSrc(a, "k:" + k, true); }
      return;
    }
    menuKey(e);
  }, true);
  window.addEventListener("keyup", function(e){
    var k = nk(e.key); ACTS.forEach(function(a){ if(src[a]["k:" + k]) setSrc(a, "k:" + k, false); });
  });
  window.addEventListener("blur", function(){ releaseAll(); if(C.isRunning() && !C.paused) pauseNow(); });
  document.addEventListener("visibilitychange", function(){ if(document.hidden){ releaseAll(); if(C.isRunning() && !C.paused) pauseNow(); } });
  ["pointerdown", "touchstart"].forEach(function(t){ document.addEventListener(t, function(e){ setLast((e.pointerType === "touch" || t === "touchstart") ? "touch" : "mouse"); }, {passive: true, capture: true}); });

  // メニューの キー そうさ：矢印で ボタンを えらぶ／Esc で もどる
  function visibleButtons(root){
    return [].filter.call(root.querySelectorAll("button, a[href], select, input"), function(b){
      if(b.disabled || b.hidden) return false; var r = b.getBoundingClientRect(); if(r.width < 4 || r.height < 4) return false;
      var cs = getComputedStyle(b); return cs.visibility !== "hidden" && cs.display !== "none";
    });
  }
  function menuRoot(){
    var pb = $("pauseBox"); if(pb && !pb.hidden) return pb;
    return document.querySelector(".scr.on");
  }
  function menuKey(e){
    var t = e.target; if(t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    if(e.key === "Escape"){ if(goBack()) e.preventDefault(); return; }
    var dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if(!dir) return;
    if(menuMove(dir)) e.preventDefault();
  }
  function menuMove(dir){
    var root = menuRoot(); if(!root) return false;
    var list = visibleButtons(root); if(!list.length) return false;
    var i = list.indexOf(document.activeElement);
    if(i < 0){ var big = list.filter(function(b){ return b.classList.contains("big"); })[0]; (dir > 0 && big ? big : list[dir > 0 ? 0 : list.length - 1]).focus(); return true; }
    list[(i + dir + list.length) % list.length].focus(); return true;
  }
  function goBack(){
    var pb = $("pauseBox");
    if(C.isRunning() && C.paused && pb && !pb.hidden){ togglePause(); return true; }
    var on = document.querySelector(".scr.on"); if(!on) return false;
    var map = {"s-set": "setBack", "s-help": "helpBack", "s-ready": "rdyBack", "s-pick": "pickBack", "s-coll": "collBack", "s-res": "rTitleBtn"};
    var id = map[on.id]; if(id && $(id)){ $(id).click(); return true; }
    return false;
  }
  // 画面が かわったら、キーボード・パッドの ときは 主なボタンに フォーカス（さわって あそぶ ときは しない）
  new MutationObserver(function(){
    if(lastInput === "touch" || lastInput === "mouse" && !padOn) return;
    var root = menuRoot(); if(!root || C.isRunning() && !C.paused) return;
    if(root.contains(document.activeElement) && document.activeElement !== document.body) return;
    var l = visibleButtons(root); var big = l.filter(function(b){ return b.classList.contains("big"); })[0] || l[0]; if(big) big.focus();
  }).observe($("stage"), {attributes: true, subtree: true, attributeFilter: ["class"]});

  // ---------- ゲームパッド ----------
  var padOn = false, padPrevPlus = false, padIgn = {}, padSuppress = 0, padAx = 0;
  function readPad(){
    try{ var ps = navigator.getGamepads ? navigator.getGamepads() : []; for(var i = 0; i < ps.length; i++) if(ps[i] && ps[i].connected) return ps[i]; }catch(_e){}
    return null;
  }
  window.addEventListener("gamepadconnected", function(){ padOn = true; setLast("pad"); toast("🎮 プロコン（ゲームパッド）を つないだよ"); refreshSetStatus(); });
  window.addEventListener("gamepaddisconnected", function(){ padOn = !!readPad(); releaseAllPad(); refreshSetStatus(); });
  function releaseAllPad(){ ACTS.forEach(function(a){ setSrc(a, "p", false); }); }
  function pollPad(now){
    var p = readPad(); padOn = !!p;
    if(!p){ padPrevPlus = false; return; }
    var b = p.buttons || [], ax = p.axes || [];
    function pr(i){ return !!(b[i] && b[i].pressed); }
    var any = false; for(var i = 0; i < b.length; i++) if(b[i] && b[i].pressed){ any = true; break; }
    if(any || Math.abs(ax[0] || 0) > .5 || Math.abs(ax[1] || 0) > .5) setLast("pad");
    var plus = pr(9);
    if(plus && !padPrevPlus && C.isRunning() && !C.paused && now > padSuppress){ pauseNow(); pauseAt = performance.now(); }
    padPrevPlus = plus;
    if(!C.isRunning() || C.paused){ padAx = 0; padMenu(pr, ax, now); return; }
    padMenu(null);
    padAx = ax[0] || 0;
    var want = {
      act: pr(0) || pr(1) || pr(2) || pr(3) || pr(4) || pr(5) || pr(6) || pr(7),
      up: pr(12) || (ax[1] || 0) < -.5, down: pr(13) || (ax[1] || 0) > .5,
      left: pr(14) || (ax[0] || 0) < -.5, right: pr(15) || (ax[0] || 0) > .5
    };
    ACTS.forEach(function(a){
      if(now < padSuppress){ if(want[a]) padIgn[a] = true; return; }          // ゲームを はじめた しゅんかんに おしていた ボタンは むし
      if(padIgn[a]){ if(!want[a]) padIgn[a] = false; return; }
      setSrc(a, "p", want[a]);
    });
  }
  // メニューの パッド そうさ：十字・スティックで ボタンを えらぶ／A で おす／B で もどる
  var pm = {}, pmT = {};
  function padMenu(pr, ax, now){
    if(!pr){ pm = {}; return; }
    var want = {u: pr(12) || (ax[1] || 0) < -.6, d: pr(13) || (ax[1] || 0) > .6, l: pr(14) || (ax[0] || 0) < -.6, r: pr(15) || (ax[0] || 0) > .6, a: pr(1), b: pr(0)};
    ["u", "d", "l", "r"].forEach(function(k){
      if(!want[k]){ pm[k] = false; return; }
      if(!pm[k]){ pm[k] = true; pmT[k] = now + 380; menuMove(k === "u" || k === "l" ? -1 : 1); }
      else if(now > pmT[k]){ pmT[k] = now + 140; menuMove(k === "u" || k === "l" ? -1 : 1); }
    });
    if(want.a && !pm.a){ var f = document.activeElement, root = menuRoot(); if(f && f !== document.body && root && root.contains(f) && f.click){ f.click(); } else menuMove(1); }
    if(want.b && !pm.b){ goBack(); }
    pm.a = want.a; pm.b = want.b;
  }
  function primePad(){ padSuppress = performance.now() + 350; padIgn = {}; releaseAllPad(); }

  // ---------- まいフレーム（おしっぱなしの そうさ） ----------
  var lastT = performance.now();
  function tick(now){
    requestAnimationFrame(tick);
    var dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    pollPad(now);
    if(!C.isRunning() || C.paused) return;
    var g = C.current(), u = g && INFO[g.id]; if(!u) return;
    if(u.repeat){
      ["up", "down", "left", "right"].forEach(function(a){
        if(eff[a] && now > rep[a]){ if(g.onSwipe) g.onSwipe(a, C); rep[a] = now + 150; }
      });
    }
    if(g.id === "fever" && g.onMove){
      var dir = (eff.right ? 1 : 0) - (eff.left ? 1 : 0), cur = g.tx == null ? W / 2 : g.tx;
      if(dir) g.onMove(cur + dir * W * 1.05 * dt * (C.speed || 1), 0, C);
      else if(padOn && Math.abs(padAx) > .22) g.onMove(W / 2 + padAx * (W / 2 - 40), 0, C);
    }
  }
  requestAnimationFrame(tick);

  // ---------- 画面の ボタン（スマホ・タブレット） ----------
  function wantTp(){ return set.pad === "on" || (set.pad === "auto" && matchMedia("(pointer:coarse)").matches && !padOn); }
  function buildTp(g){
    var tp = $("tp"), u = INFO[g && g.id]; tp.innerHTML = ""; tp.hidden = true;
    if(!u || !wantTp()) return;
    var html = "", L = {up: ["u", "▲"], down: ["dn", "▼"], left: ["lf", "◀"], right: ["rt", "▶"]};
    if(u.tp.length){ html += '<div class="grp l">' + u.tp.map(function(a){ return '<button type="button" class="tb d ' + L[a][0] + '" data-a="' + a + '" aria-label="' + a + '">' + L[a][1] + '</button>'; }).join("") + '</div>'; }
    if(u.use.indexOf("act") >= 0){ html += '<div class="grp r"><button type="button" class="tb a" data-a="act">' + esc(u.actLabel || "おす") + '</button></div>'; }
    if(!html) return;
    tp.innerHTML = html; tp.hidden = false;
    [].forEach.call(tp.querySelectorAll(".tb"), function(b){
      var a = b.dataset.a, id = "t:" + a;
      b.addEventListener("pointerdown", function(e){ e.preventDefault(); e.stopPropagation(); try{ b.setPointerCapture(e.pointerId); }catch(_e){} b.classList.add("on"); setSrc(a, id, true); });
      var up = function(e){ if(e) e.stopPropagation(); b.classList.remove("on"); setSrc(a, id, false); };
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", function(e){ e.preventDefault(); });
    });
  }

  // ---------- いちじ停止 ----------
  function pauseNow(){
    if(!C.isRunning() || C.paused) return;
    releaseAll(); C.paused = true; showPause(true);
  }
  function togglePause(){
    if(!C.isRunning()) return;
    if(C.paused) resume(); else { pauseNow(); pauseAt = performance.now(); }
  }
  function resume(){ showPause(false); C.paused = false; primePad(); try{ if(document.activeElement) document.activeElement.blur(); }catch(_e){} }
  function showPause(on){
    var pb = $("pauseBox"); pb.hidden = !on;
    $("tp").style.visibility = on ? "hidden" : "visible"; $("pauseBtn").style.visibility = on ? "hidden" : "visible";
    if(!on) return;
    var g = C.current();
    pb.innerHTML = '<h2>⏸ いちじ停止</h2><p class="sub">' + esc(g ? g.icon + " " + g.name : "") + '</p>' +
      '<button type="button" class="big" id="pzGo">▶ つづける</button>' +
      '<button type="button" id="pzRetry">🔁 はじめから やりなおす</button>' +
      '<button type="button" id="pzHow">📖 あそびかた</button>' +
      '<button type="button" id="pzSet">⚙ せってい</button>' +
      '<button type="button" id="pzTitle">🏠 タイトルへ（スコアは きろくされません）</button>';
    $("pzGo").onclick = resume;
    $("pzRetry").onclick = function(){ showPause(false); C.paused = false; releaseAll(); C.begin(g); };
    $("pzTitle").onclick = function(){ showPause(false); releaseAll(); C.abort(); };
    $("pzHow").onclick = function(){ pb.hidden = true; openHelp(function(){ C.show("s-play"); pb.hidden = false; focusFirst(pb); }); };
    $("pzSet").onclick = function(){ pb.hidden = true; openSettings(function(){ C.show("s-play"); pb.hidden = false; focusFirst(pb); }); };
    focusFirst(pb, true);
  }
  function focusFirst(root, force){ if(!force && lastInput === "touch") return; var b = root.querySelector("button"); if(b) try{ b.focus(); }catch(_e){} }
  $("pauseBtn").onclick = function(){ togglePause(); };

  C.onBegin = function(g){
    releaseAll(); primePad(); $("pauseBtn").hidden = false; showPause(false); buildTp(g);
    try{ if(document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); }catch(_e){}
  };
  C.onEnd = function(){ releaseAll(); $("tp").hidden = true; $("tp").innerHTML = ""; $("pauseBtn").hidden = true; showPause(false); };

  // ---------- あそぶ前の 説明 ----------
  function devNow(){ return padOn || lastInput === "pad" ? "pad" : (lastInput === "touch" || matchMedia("(pointer:coarse)").matches ? "touch" : "key"); }
  function devRows(g){
    var h = INFO[g.id] ? INFO[g.id].how() : null, me = devNow(); if(!h) return "";
    return DEV.map(function(d){
      return '<div class="dev' + (d[0] === me ? " me" : "") + '"><b aria-hidden="true">' + d[1] + '</b><span><strong>' + d[2] + (d[0] === me ? "（いまの そうさ）" : "") + '</strong></span><span>' + esc(h[d[0]]) + '</span></div>';
    }).join("");
  }
  C.gate = function(g, go){
    if(!INFO[g.id] || (!set.every && set.seen[g.id])){ go(g); return; }
    showReady(g, go);
  };
  function showReady(g, go){
    var s = $("s-ready");
    s.innerHTML = '<p class="rdy-title">' + esc(g.icon + " " + g.name) + '</p><p class="sub">' + esc(g.desc || "") + '</p>' +
      '<button type="button" class="big" id="rdyGo">▶ スタート</button>' +
      '<div class="row"><button type="button" id="rdySet">⚙ せってい（ボタンの へんこう）</button><button type="button" id="rdyBack">もどる</button></div>' +
      '<div class="panel"><h3>🎮 あそびかた</h3>' + devRows(g) + '<p class="note2">ゲーム中は <b>' + esc("P") + '</b> キー・Esc・プロコンの ＋ か、画面の「⏸ ていし」で いちじ停止できるよ。</p></div>';
    C.show("s-ready");
    $("rdyGo").onclick = function(){ set.seen[g.id] = 1; saveSet(); go(g); };
    $("rdySet").onclick = function(){ openSettings(function(){ showReady(g, go); }); };
    $("rdyBack").onclick = function(){ C.show("s-title"); };
    if(lastInput !== "touch") try{ $("rdyGo").focus(); }catch(_e){}
  }

  // ---------- あそびかた 一覧 ----------
  var helpBack = null;
  function openHelp(back){
    helpBack = back || function(){ C.show("s-title"); };
    var s = $("s-help");
    s.innerHTML = '<div class="topbar"><button type="button" id="helpBackTop">← もどる</button></div><h2>📖 あそびかた</h2><p class="hint">スマホ・タブレットは タッチ、パソコンは キーボード、プロコンでも あそべるよ。</p>' +
      C.games.map(function(g){ return INFO[g.id] ? '<div class="panel"><h3>' + esc(g.icon + " " + g.name) + '</h3>' + devRows(g) + '</div>' : ""; }).join("") +
      '<div class="panel"><h3>🎛 そのほか</h3><div class="dev"><b>⏸</b><span><strong>いちじ停止</strong></span><span>ゲーム中に P キー・Esc・プロコンの ＋・画面の「⏸ ていし」</span></div>' +
      '<div class="dev"><b>⚙</b><span><strong>せってい</strong></span><span>キーの へんこう、ゲームの 速さ（ゆっくり）、画面の ボタン、プロコンの ボタン設定</span></div></div>' +
      '<div class="row"><button type="button" class="big" id="helpBack">もどる</button></div>';
    C.show("s-help");
    $("helpBack").onclick = $("helpBackTop").onclick = function(){ var f = helpBack; helpBack = null; if(f) f(); };
    if(lastInput !== "touch") try{ $("helpBack").focus(); }catch(_e){}
  }
  $("bHow").onclick = function(){ openHelp(); };

  // ---------- せってい ----------
  var setBack = null, capMsg = "";
  function openSettings(back){
    setBack = back || function(){ C.show("s-title"); };
    renderSettings(); C.show("s-set");
  }
  function segHtml(id, opts, cur){ return '<div class="seg" data-seg="' + id + '">' + opts.map(function(o){ return '<button type="button" data-v="' + o[0] + '" class="' + (String(cur) === String(o[0]) ? "on" : "") + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + o[1] + '</button>'; }).join("") + '</div>'; }
  function renderSettings(){
    var s = $("s-set");
    var keyRows = ACTS.map(function(a){
      var name = {act: "決定（ジャンプ・おとす・おす）", up: "上", down: "下", left: "左", right: "右"}[a];
      return '<div class="krow"><span class="l">' + name + '</span>' + [0, 1].map(function(i){
        var isCap = capture && capture.a === a && capture.i === i;
        return '<button type="button" data-k="' + a + ':' + i + '" class="' + (isCap ? "cap" : "") + '">' + (isCap ? "キーを おして…" : esc(kname(set.keys[a][i]))) + '</button>';
      }).join("") + '</div>';
    }).join("");
    s.innerHTML = '<div class="topbar"><button type="button" id="setBackTop">← もどる</button></div><h2>⚙ せってい</h2>' +
      '<div class="panel"><h3>🐢 ゲームの 速さ（むずかしいと おもったら ゆっくりに）</h3>' + segHtml("speed", [[1, "ふつう"], [.8, "ゆっくり"], [.65, "とても ゆっくり"]], set.speed) + '</div>' +
      '<div class="panel"><h3>👆 画面の ボタン（スマホ・タブレット）</h3>' + segHtml("pad", [["auto", "じどう"], ["on", "いつも 出す"], ["off", "出さない"]], set.pad) +
      '<p class="note2">「じどう」＝ タッチの 端末で、プロコンを つないでいない とき だけ 出します。</p></div>' +
      '<div class="panel"><h3>📖 あそぶ前の 説明</h3>' + segHtml("every", [["0", "はじめて だけ"], ["1", "まいかい 出す"]], set.every ? "1" : "0") + '</div>' +
      '<div class="panel"><h3>⌨️ キーボード（ボタンを おして、あたらしい キーを おす）</h3>' + keyRows +
      '<p class="stat" id="capMsg">' + esc(capMsg) + '</p><p class="note2">1つの こうどうに キーを 2つまで。Backspace で けせます。Esc・P は いちじ停止用なので つかえません。</p>' +
      '<div class="row"><button type="button" id="keyReset">↩ キーを もとに もどす</button></div></div>' +
      '<div class="panel"><h3>🎮 プロコン・ゲームパッド</h3><p class="stat" id="padStat"></p>' +
      '<div class="row"><button type="button" data-are-padmap>🎮 ボタン設定を ひらく</button></div>' +
      '<p class="note2">A と B の いれかえ など、ボタン1つ1つを 好きな 配置に できます。</p></div>' +
      '<div class="panel"><h3>🔊 音</h3><div class="row"><button type="button" id="sndSet">' + ($("snd").textContent.indexOf("🔇") >= 0 ? "🔇 音は オフ（おすと オン）" : "🔊 音は オン（おすと オフ）") + '</button></div></div>' +
      '<div class="row"><button type="button" class="big" id="setBack">もどる</button><button type="button" id="setReset">せっていを ぜんぶ もとに もどす</button></div>';
    refreshSetStatus();
    [].forEach.call(s.querySelectorAll("[data-seg]"), function(box){
      box.onclick = function(e){
        var b = e.target.closest("button[data-v]"); if(!b) return;
        var v = b.dataset.v, id = box.dataset.seg;
        if(id === "speed"){ set.speed = +v; C.speed = set.speed; }
        else if(id === "pad") set.pad = v;
        else if(id === "every") set.every = v === "1";
        saveSet(); renderSettings();
      };
    });
    [].forEach.call(s.querySelectorAll("[data-k]"), function(b){
      b.onclick = function(){ var p = b.dataset.k.split(":"); capture = {a: p[0], i: +p[1]}; capMsg = ""; renderSettings(); };
    });
    $("keyReset").onclick = function(){ set.keys = cloneKeys(); capture = null; capMsg = "キーを もとに もどしました。"; saveSet(); renderSettings(); };
    $("sndSet").onclick = function(){ $("snd").click(); renderSettings(); };
    $("setBack").onclick = $("setBackTop").onclick = closeSettings;
    $("setReset").onclick = function(){ set.speed = 1; C.speed = 1; set.pad = "auto"; set.every = false; set.keys = cloneKeys(); set.seen = {}; capture = null; capMsg = "せっていを もとに もどしました。"; saveSet(); renderSettings(); };
    if(lastInput !== "touch" && !capture) try{ $("setBack").focus(); }catch(_e){}
  }
  function closeSettings(){ capture = null; var f = setBack; setBack = null; if(f) f(); }
  function refreshSetStatus(){
    var e = $("padStat"); if(!e) return; var p = readPad();
    e.textContent = p ? "つながっている パッド： " + String(p.id).slice(0, 44) : "パッドが 見つかりません。つないで、ボタンを どれか おしてください。";
  }
  function onCaptureKey(e){
    e.preventDefault(); e.stopImmediatePropagation();
    var k = e.key, a = capture.a, i = capture.i;
    if(k === "Escape"){ capture = null; capMsg = "やめました。"; renderSettings(); return; }
    if(k === "Backspace" || k === "Delete"){ set.keys[a][i] = ""; capture = null; capMsg = "けしました。"; saveSet(); renderSettings(); return; }
    if(k === "Tab" || /^F\d+$/.test(k) || k === "Shift" || k === "Control" || k === "Alt" || k === "Meta" || k === "CapsLock" || nk(k) === "p"){ capMsg = "そのキーは つかえません。ほかの キーを おしてください。"; renderSettings(); return; }
    var key = nk(k);
    ACTS.forEach(function(b){ set.keys[b] = set.keys[b].map(function(x){ return x === key ? "" : x; }); });   // 同じキーは 1か所だけ
    set.keys[a][i] = key; capture = null; capMsg = "「" + kname(key) + "」に しました。"; saveSet(); renderSettings();
  }
  $("bSet").onclick = function(){ openSettings(); };

  // いちど あそんだ ゲームは、つぎから 説明を とばして すぐ はじまる（「まいかい 出す」で かえられる）
  C.ctl = {openSettings: openSettings, openHelp: openHelp, info: INFO};
})();
