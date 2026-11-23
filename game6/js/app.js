"use strict";
// ===== 推理ゲーム（game6）本体 =====
// ・全20章 × 各5話。第1〜10章＝事件ファイル、第11〜20章＝「やりすぎヒーロー伝説」。
// ・人の名前・好きなもの・被害者・犯人は、plan.js が プレイヤーごとに 100この話ぜんぶで かぶらないように 決める。
// ・表（マス目）の書きかた：
//     【本書き】マスをタップすると ○ が入り、その場で 正解か まちがいか 判定される。
//               正解なら、同じ行・同じ列の ほかのマスは ぜんぶ ✕ になる（ほかの表にも ひろがる）。
//               ○ がそろえば、「答える」ボタンなしで その場でクリア。
//     【下書き】メモ用。○？／✕？ を 自由に つけられる。判定も 自動の ✕ も ぜんぜん 動かない。
(function(){
  var S = window.SuiriStory, CASTD = window.SuiriCast, PL = window.SuiriPlan, G = window.SuiriGen;
  var IMG = "../game5/play/img/", AUD = "../game5/play/audio/";
  var app = document.getElementById("app"), barTitle = document.getElementById("barTitle");
  var btnBack = document.getElementById("btnBack"), selDiff = document.getElementById("diff"), btnSnd = document.getElementById("btnSnd");
  var TITLE = "推理ゲーム";
  var LEVELNAME = ["とてもかんたん", "かんたん", "ふつう", "むずかしい", "とてもむずかしい"];
  var BASE = {easy: 1, normal: 2, hard: 3};
  var NCH = S.CH.length, EPN = PL.EPS;
  var ME = "切札 勝", SH = "島田会長", AI = "相田";
  var CAST = {};
  CAST[AI] = {img: "chara_aida.webp", ini: "相"}; CAST[ME] = {img: "chara_katsu.webp", ini: "勝"}; CAST[SH] = {img: "chara_shimada.webp", ini: "島"};
  var GUESTS = ["guest_a.webp", "guest_b.webp", "guest_c.webp", "guest_d.webp", "guest_e.webp", "guest_f.webp"];

  // ---------- 保存 ----------
  var SAVE_KEY = "game6_save_v2", OLD_KEY = "game6_save_v1";
  var save = {cleared: {}, diff: "normal", mute: false, seed: 0};
  function newSeed(){ var a = new Uint32Array(1); try{ crypto.getRandomValues(a); }catch(_e){ a[0] = (Math.random() * 4294967296) >>> 0; } return a[0] || 1; }
  try{
    var raw = localStorage.getItem(SAVE_KEY);
    if(raw){ var o = JSON.parse(raw); if(o && typeof o === "object"){ save.cleared = o.cleared || {}; save.diff = BASE[o.diff] ? o.diff : "normal"; save.mute = !!o.mute; save.seed = (o.seed >>> 0) || 0; } }
    else{
      var old = localStorage.getItem(OLD_KEY);     // 旧版（各10話）の きろくは、最初の5話ぶんだけ ひきつぐ
      if(old){ var oo = JSON.parse(old); if(oo && typeof oo === "object"){ for(var k0 in (oo.cleared || {})){ var pp = k0.split("-"); if(+pp[1] < EPN && +pp[0] < NCH) save.cleared[k0] = oo.cleared[k0]; } save.diff = BASE[oo.diff] ? oo.diff : "normal"; save.mute = !!oo.mute; } }
    }
  }catch(_e){}
  if(!save.seed) save.seed = newSeed();
  var plan = PL.build(save.seed);
  function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(_e){} }
  persist();
  function ck(c, e){ return c + "-" + e; }
  function isCleared(c, e){ return !!save.cleared[ck(c, e)]; }
  function chCount(c){ var n = 0; for(var e = 0; e < EPN; e++) if(isCleared(c, e)) n++; return n; }
  function chOpen(c){ return c < 3 || chCount(c - 1) >= EPN; }
  function epOpen(c, e){ return chOpen(c) && (e === 0 || isCleared(c, e - 1)); }
  function clearedTotal(){ var d = 0; for(var k in save.cleared) d++; return d; }

  // ---------- 音（BGM と 効果音）----------
  var bgm = null, bgmName = "", unlocked = false;
  // スマホ・タブレットでは「ゆびが さわった しゅんかん（pointerdown）」では 音の許可が出ない。ゆびを はなした時／click／keydown で play() を呼ぶ。
  function ensureBgm(){
    if(!bgm){ bgm = new Audio(); bgm.loop = true; bgm.volume = .35; bgm.preload = "auto"; try{ bgm.setAttribute("playsinline", ""); }catch(_e){} }
    return bgm;
  }
  function startBgm(){
    if(save.mute || !bgmName) return;
    try{
      var a = ensureBgm(), src = AUD + bgmName + ".mp3";
      if(a.getAttribute("data-n") !== bgmName){ a.setAttribute("data-n", bgmName); a.src = src; }
      var p = a.play();
      if(p && p.then) p.then(function(){ unlocked = true; }, function(){ unlocked = false; }); else unlocked = true;
    }catch(_e){ unlocked = false; }
  }
  function playBgm(name){ bgmName = name; if(save.mute) return; startBgm(); }
  function stopBgm(){ try{ if(bgm) bgm.pause(); }catch(_e){} }
  function sndIcon(){ btnSnd.textContent = save.mute ? "🔇" : "🔊"; }
  function gestureBgm(){ if(!save.mute && bgmName && (!bgm || bgm.paused)) startBgm(); }
  ["pointerup", "touchend", "click", "keydown"].forEach(function(t){ document.addEventListener(t, gestureBgm, {capture: true, passive: true}); });
  document.addEventListener("visibilitychange", function(){ if(!document.hidden) gestureBgm(); });
  btnSnd.addEventListener("click", function(){ save.mute = !save.mute; persist(); sndIcon(); if(save.mute) stopBgm(); else playBgm(bgmName || "bgm_title"); });
  sndIcon();
  selDiff.value = save.diff;
  selDiff.addEventListener("change", function(){ save.diff = selDiff.value; persist(); toast("次の事件から「" + selDiff.selectedOptions[0].textContent + "」になるよ"); });

  // 効果音（小さめ）。ミュートのときは 鳴らさない
  var actx = null;
  function sfx(kind){
    if(save.mute) return;
    try{
      var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
      if(!actx) actx = new AC();
      if(actx.state === "suspended") actx.resume();
      var t0 = actx.currentTime + 0.01;
      var seq = kind === "ok" ? [[784, 0, .09], [1175, .08, .14]]
        : kind === "ng" ? [[196, 0, .16], [147, .12, .2]]
        : kind === "auto" ? [[988, 0, .05]]
        : kind === "clear" ? [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .3]]
        : kind === "tap" ? [[660, 0, .04]] : [[880, 0, .06]];
      seq.forEach(function(s){
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = kind === "ng" ? "sawtooth" : "triangle"; o.frequency.value = s[0];
        var a = t0 + s[1], e = a + s[2];
        g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(kind === "ng" ? .07 : .12, a + .01); g.gain.exponentialRampToValueAtTime(0.0001, e);
        o.connect(g); g.connect(actx.destination); o.start(a); o.stop(e + .02);
      });
    }catch(_e){}
  }
  function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(_e){} }

  // ---------- 小物 ----------
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  var toastT = 0;
  function toast(t){ var el = document.getElementById("toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function(){ el.classList.remove("on"); }, 2600); }
  function bgStyle(c){ var k = (c % 10) + 1; return "--bgimg:url(" + IMG + "bg_ch" + (k < 10 ? "0" : "") + k + ".jpg)"; }
  function imgTag(file, cls){ return '<img src="' + IMG + file + '" alt="" class="' + (cls || "") + '" onerror="this.style.display=\'none\'" loading="lazy" decoding="async">'; }
  function hue(name){ var h = 0; for(var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360; return h; }
  function guestImg(name){ return GUESTS[hue(name) % GUESTS.length]; }
  function avHtml(name){
    if(!CAST[name]) return '<span class="av" style="background:hsl(' + hue(name) + ',45%,32%)"><span>' + esc(name.charAt(0)) + '</span></span>';
    var c = CAST[name];
    return '<span class="av" style="position:relative"><span>' + esc(c.ini) + '</span><img src="' + IMG + c.img + '" alt="" style="position:absolute;inset:0" onerror="this.remove()"></span>';
  }
  function modal(html, buttons){
    var m = document.createElement("div"); m.className = "modal";
    m.innerHTML = '<div class="box">' + html + '<div class="row"></div></div>';
    var row = m.querySelector(".row");
    buttons.forEach(function(b){ var x = document.createElement("button"); x.className = "btn " + (b.cls || ""); x.type = "button"; x.textContent = b.t; x.onclick = function(){ m.remove(); if(b.f) b.f(); }; row.appendChild(x); });
    document.body.appendChild(m); return m;
  }
  function confirmBox(msg, yes, onYes){ modal("<p>" + msg + "</p>", [{t: "やめる", cls: "sub"}, {t: yes, f: onYes}]); }
  function shortLabel(v){ v = String(v); return (v.indexOf("ヒーロー") === 0 && v.length > 4) ? v.slice(4) : v; }
  var DIG = "〇一二三四五六七八九";
  // たて書きの見出しは 数字が 横向きに なるので、漢字の数字に する（14時 → 十四時）
  function kanjiNum(t){
    return String(t).replace(/\d+/g, function(x){
      var n = parseInt(x, 10); if(!(n >= 0 && n < 100) || x.length > 2) return x.split("").map(function(c){ return DIG[+c]; }).join("");
      if(n < 10) return DIG[n];
      return (n >= 20 ? DIG[Math.floor(n / 10)] : "") + "十" + (n % 10 ? DIG[n % 10] : "");
    });
  }

  // ---------- 画面の移動 ----------
  var stack = [], cur = null, inGame = false, mode = "";
  function go(fn, title, push){
    if(push !== false && cur) stack.push(cur);
    cur = {fn: fn, title: title}; barTitle.textContent = title || TITLE; window.scrollTo(0, 0);
    document.body.classList.remove("in-puzzle"); closeSheet(true);
    app.classList.remove("swap"); void app.offsetWidth; app.classList.add("swap");
    fn();
  }
  function leave(){
    inGame = false; mode = "";
    var p = stack.pop(); if(p){ cur = null; go(p.fn, p.title, false); } else { cur = null; go(screenTitle, TITLE, false); }
  }
  btnBack.addEventListener("click", function(){
    if(inGame){ confirmBox("いまの事件を やめて、もどる？<br>（進みぐあいは 保存されないよ）", "もどる", leave); return; }
    leave();
  });
  var btnExit = document.getElementById("btnExit");
  if(btnExit){ btnExit.textContent = window.AREExit ? AREExit.label() : "終了"; btnExit.addEventListener("click", function(){ if(window.AREExit) AREExit.open(); }); }

  // ---------- タイトル ----------
  function screenTitle(){
    mode = "title"; playBgm("bgm_title"); btnBack.style.visibility = "hidden";
    var done = clearedTotal(), sp = "";
    for(var i = 0; i < 26; i++) sp += '<i style="left:' + Math.round(Math.random() * 100) + '%;top:' + Math.round(Math.random() * 100) + '%;animation-delay:' + (Math.random() * 4).toFixed(2) + 's;animation-duration:' + (2 + Math.random() * 3).toFixed(2) + 's;font-size:' + (10 + Math.round(Math.random() * 14)) + 'px">' + (i % 3 ? "✦" : "★") + '</i>';
    app.innerHTML = '<section class="hero"><div class="spark" aria-hidden="true">' + sp + '</div>' + imgTag("logo.webp", "logo") + '<h1>推理ゲーム</h1>' +
      '<p class="lead">人の話から「いつ」「なにが好き」を推理して、表をうめよう。<br>全20章・各5話。第11章からは<b>「やりすぎヒーロー伝説」</b>！<br>○を入れると、その場で 正解かどうか わかるよ。</p>' +
      '<button class="btn big pulse" id="goStart" type="button">' + (done ? "つづきから" : "はじめる") + '</button>' +
      '<button class="btn sub" id="goStats" type="button">📊 推理せいせき分析（Python）</button>' +
      '<p class="note">クリアした話：' + done + ' / ' + (NCH * EPN) + '</p>' +
      '<button class="lnk" id="goReset" type="button">さいしょから やりなおす（きろくを消して、新しい事件セットに）</button></section>';
    document.getElementById("goStart").onclick = function(){ unlocked = true; sfx("tap"); go(screenChapters, "章をえらぶ"); btnBack.style.visibility = "visible"; };
    document.getElementById("goStats").onclick = function(){ if(window.DeduceStats) window.DeduceStats.showPanel(); };
    document.getElementById("goReset").onclick = function(){
      confirmBox("クリアのきろくを ぜんぶ消して、<br>名前や好きなものが ぜんぶ ちがう<br><b>あたらしい100この事件</b>に つくりなおすよ。<br>ほんとうに いい？", "さいしょから", function(){
        save.cleared = {}; save.seed = newSeed(); plan = PL.build(save.seed); persist(); toast("あたらしい事件セットを つくったよ！"); screenTitle();
      });
    };
  }

  // ---------- 章えらび ----------
  function screenChapters(){
    mode = "chapters"; playBgm("bgm_title"); btnBack.style.visibility = "visible";
    var h = '<h2 class="sec">📁 事件ファイル（第1〜10章）</h2><div class="grid2">';
    S.CH.forEach(function(ch, c){
      if(c === 10) h += '</div><h2 class="sec hero">🦸 やりすぎヒーロー伝説（第11〜20章）</h2><div class="grid2">';
      var open = chOpen(c), cnt = chCount(c), pct = Math.round(cnt / EPN * 100);
      h += '<button type="button" class="chcard' + (ch.hero ? " hero" : "") + (open ? "" : " lock") + (cnt === EPN ? " done" : "") + '" data-c="' + c + '" style="' + bgStyle(c) + ';background-size:cover">' +
        '<span class="tag' + (ch.hero ? " h" : ch.kind === "お試し" ? " b" : ch.kind === "練習" ? " c" : "") + '">' + esc(ch.kind) + '</span><b>第' + (c + 1) + '章 ' + esc(ch.name) + '</b>' +
        '<small>表の大きさ ' + ch.n + '×' + ch.n + '（人＋' + ch.m + '項目）　' + cnt + '/' + EPN + '話クリア' + (cnt === EPN ? " ✔" : "") + (open ? "" : "　🔒 前の章をクリアすると開くよ") + '</small>' +
        '<span class="bar"><span style="width:' + pct + '%"></span></span></button>';
    });
    app.innerHTML = h + '</div>';
    app.querySelectorAll(".chcard").forEach(function(b){ b.onclick = function(){ var c = +b.dataset.c; if(!chOpen(c)){ toast("前の章を ぜんぶクリアすると 開くよ"); sfx("ng"); return; } sfx("tap"); go(function(){ screenEpisodes(c); }, "第" + (c + 1) + "章"); }; });
  }

  // ---------- 話えらび ----------
  function screenEpisodes(c){
    mode = "episodes"; playBgm("bgm_story");
    var ch = S.CH[c];
    var h = '<h2>第' + (c + 1) + '章 ' + esc(ch.name) + '</h2><p class="note">' + esc(ch.kind) + '／表の大きさ ' + ch.n + '×' + ch.n + '（人＋' + ch.m + '項目）。前の話をクリアすると、次の話が開くよ。</p><div class="eps">';
    ch.items.forEach(function(it, e){
      var cl = save.cleared[ck(c, e)], open = epOpen(c, e);
      h += '<button type="button" class="ep' + (cl ? " cleared" : "") + (open ? "" : " lock") + '" data-e="' + e + '"><b>第' + (e + 1) + '話</b><small>' + esc(it[0]) + '</small>' +
        '<span class="stars">' + (cl ? "★".repeat(cl.s || 1) + "☆".repeat(3 - (cl.s || 1)) : (open ? "NEW" : "🔒")) + '</span></button>';
    });
    app.innerHTML = h + '</div>';
    app.querySelectorAll(".ep").forEach(function(b){ b.onclick = function(){ if(!epOpen(c, +b.dataset.e)){ toast("前の話を クリアすると 開くよ"); sfx("ng"); return; } sfx("tap"); startEpisode(c, +b.dataset.e); }; });
  }

  // その話の人たち（名前・役わり・口ぐせ）
  function castOf(c, e){
    var ep = plan.eps[c][e], cd = CASTD[c];
    return ep.names.map(function(nm, i){ var rl = cd.roles[ep.roleIdx[i]]; return {name: nm, role: rl[0], pre: rl[1]}; });
  }

  // ---------- 会話（ストーリー） ----------
  function startEpisode(c, e){
    var ch = S.CH[c], it = ch.items[e], ep = plan.eps[c][e], ppl = castOf(c, e), vic = ppl[ep.victim];
    var lines = [], hero = !!ch.hero;
    if(e === 0){
      if(c === 0){ lines.push([AI, "はじめまして！ わたしは相田。探偵さんの助手だよ。まずはお試しで、やさしい事件から始めよう！"]); lines.push([ME, "○をつけながら、表を完成させるんだ。○が合っていれば すぐわかるし、むずかしく考えなくていい。"]); lines.push([AI, "○を入れると、同じ行と同じ列は 自動で ×になるよ。まよったら『下書き』にメモしてね！"]); }
      else if(c === 1){ lines.push([AI, "第2章は練習の章だよ。問題に慣れていこうね！"]); }
      else if(c === 2){ lines.push([ME, "ここからが本番だ。覚悟はいいか、探偵。"]); lines.push([AI, "第3章からは、本格的な推理だよ。わたしも全力でサポートするね！"]); }
      else if(c === 10){ lines.push([SH, "おお、切札くん、相田くん。よく来てくれたのう。わしは、ヒーロー協会の会長の島田じゃ。"]); lines.push([AI, "ここから先は『やりすぎヒーロー伝説』…ヒーローたちの “やりすぎ” の謎に挑むんだね！"]); lines.push([ME, "やりすぎの裏には、かならず理由がある。ひとつずつ解き明かそう。"]); }
      else if(hero){ lines.push([SH, "ほっほっ。" + ch.short + "の件で、また協会が大さわぎじゃ。たのんだぞい。"]); }
      else { lines.push([AI, "第" + (c + 1) + "章のはじまりだよ。『" + ch.name.split(" ")[0] + "』…気をひきしめていこう。"]); }
    }
    var tm = hero ? [
      SH + "：" , "", ""
    ] : [
      "事件よ！ " + ch.place + "で『" + it[0] + "』が起きたの。",
      "大変！ 『" + it[0] + "』…" + ch.place + "が大さわぎになってるみたい！",
      "探偵さん、依頼が来たわ。" + ch.place + "の『" + it[0] + "』について、調べてほしいって。"
    ];
    if(hero){
      var hs = [
        "ほっほっ、" + ch.place + "で『" + it[0] + "』じゃ。これは、ちとやりすぎかもしれんのう。",
        "『" + it[0] + "』…" + ch.place + "でこんなことが起きるとは。ヒーローも やりすぎは いかんのう。",
        "切札くん、相田くん。" + ch.place + "の『" + it[0] + "』を、調べてくれんかのう。"
      ];
      lines.push([SH, hs[(c + e) % 3]]);
    }else lines.push([AI, tm[(c + e) % 3]]);
    lines.push(["", it[1]]);
    var tk = [
      "落ち着け、相田。まずは" + ch.n + "人の話を聞いてみよう。",
      "関係者は" + ch.n + "人。全員の話を聞く必要がありそうだ。",
      "状況を整理しよう。" + ch.n + "人の証言が頼りだ。"
    ];
    lines.push([ME, hero ? "やりすぎには、かならず理由がある。関係者は" + ch.n + "人か。まず話を聞こう。" : tk[(c * 2 + e) % 3]]);
    lines.push([AI, "被害にあったのは、" + vic.role + "の" + vic.name + "さん。" + (ch.n < 5 ? "" : "名前も好みも、この話だけの人たちだよ。") + "まず、この人たちに会ってみよう！"]);
    var feat = [ep.victim]; for(var q0 = 0; q0 < ppl.length && feat.length < Math.min(5, ch.n); q0++) if(q0 !== ep.victim) feat.push(q0);
    feat.forEach(function(i){ var p = ppl[i]; lines.push([p.name + "（" + p.role + "）", p.name + "です。" + p.role + "をしています。" + (i === ep.victim ? "…ひどい目にあいました。" : "")]); });
    if(e === EPN - 1) lines.push([AI, c === NCH - 1 ? "これが、ほんとうに最後の事件…！ 気合いを入れていくよ！" : "これが、この章の最後の事件…！ 気合いを入れていくよ！"]);
    var qs = S.QUESTIONS, qn = qs[(c * 3 + e) % qs.length];
    inGame = true;
    go(function(){ runScene(c, e, lines, qn); }, "第" + (c + 1) + "章 第" + (e + 1) + "話", true);
  }
  function runScene(c, e, lines, q){
    mode = "scene"; playBgm("bgm_story");
    var ch = S.CH[c], i = 0;
    app.innerHTML = '<section class="stage' + (ch.hero ? " hero" : "") + '" style="' + bgStyle(c) + '"><div class="shade"></div><div class="scctl"><button class="btn sub" type="button" id="autoBtn">▶ オート</button><button class="btn sub" type="button" id="fastBtn">⏩ 早送り</button><button class="btn sub" type="button" id="skipBtn">⏭ スキップ</button></div>' +
      '<img class="portrait" id="por" alt="" style="opacity:0"><div id="below"></div></section>';
    var por = app.querySelector("#por"), below = app.querySelector("#below");
    por.onerror = function(){ por.style.display = "none"; };
    var auto = false, fast = false, timer = 0, tw = 0, typing = false, alive = true, fullText = "";
    function setPortrait(who){
      var f = null;
      if(who && CAST[who]) f = CAST[who].img;
      else if(who && who.indexOf("（") > 0) f = guestImg(who.split("（")[0]);
      if(f){ por.style.display = ""; if(por.getAttribute("data-f") !== f){ por.setAttribute("data-f", f); por.src = IMG + f; } por.style.opacity = 1; por.classList.remove("talk"); void por.offsetWidth; por.classList.add("talk"); }
      else por.style.opacity = 0;
    }
    function typeLine(who, text){
      var p = below.querySelector("p"), nx = below.querySelector(".next"); fullText = text; typing = true; nx.style.visibility = "hidden"; var k = 0;
      clearInterval(tw);
      tw = setInterval(function(){
        k += fast ? 6 : 1; p.textContent = text.slice(0, k);
        if(k >= text.length){ clearInterval(tw); typing = false; nx.style.visibility = "visible"; sched(); }
      }, 24);
    }
    function show(){
      var ln = lines[i]; setPortrait(ln[0]);
      below.innerHTML = '<div class="msgbox" id="mb" tabindex="0">' + (ln[0] ? '<span class="who">' + esc(ln[0]) + '</span>' : "") + '<p></p><span class="next">▼</span></div>';
      below.firstChild.onclick = tap; typeLine(ln[0], ln[1]);
    }
    function tap(){ if(typing){ clearInterval(tw); typing = false; below.querySelector("p").textContent = fullText; below.querySelector(".next").style.visibility = "visible"; sched(); } else adv(); }
    function sched(){
      clearTimeout(timer);
      if(!alive || !(auto || fast) || !document.body.contains(below) || typing) return;
      var ln = lines[i]; if(!ln || i >= lines.length) return;
      var d = Math.min(5200, 900 + String(ln[1]).length * 90); if(fast) d = 260 + String(ln[1]).length * 12;
      timer = setTimeout(function(){ if(alive && (auto || fast) && !typing) adv(); }, d);
    }
    function adv(){ i++; if(i < lines.length){ show(); } else { clearTimeout(timer); choose(); } }
    function choose(){
      clearInterval(tw); typing = false; setPortrait(AI);
      var three = c >= 4;
      below.innerHTML = '<div class="msgbox"><span class="who">相田</span><p>' + esc(q.q) + (three ? "\n（「わからない」も選べるよ）" : "") + '</p></div><div class="choices"></div>';
      var box = below.querySelector(".choices");
      [["はい", "yes"], ["いいえ", "no"]].concat(three ? [["わからない", "unk"]] : []).forEach(function(o){
        var b = document.createElement("button"); b.className = "btn" + (o[1] === "unk" ? " sub" : ""); b.type = "button"; b.textContent = o[0];
        b.onclick = function(){ sfx("tap"); pick(o[1]); }; box.appendChild(b);
      });
    }
    function pick(k){
      var r = k === "yes" ? q.yes : k === "no" ? q.no : S.UNK;
      var tag = k === "unk" ? "…" : (r.d > 0 ? "（状況がややこしくなった…）" : r.d < 0 ? "（手がかりが集まりやすくなった！）" : "");
      setPortrait(ME);
      below.innerHTML = '<div class="msgbox"><span class="who">' + ME + '</span><p>' + esc(r.r + tag) + '</p><span class="next">▼</span></div>';
      below.firstChild.onclick = function(){ alive = false; startPuzzle(c, e, k, r); };
    }
    function ctl(){ var a = document.getElementById("autoBtn"), f = document.getElementById("fastBtn"); a.classList.toggle("on", auto); f.classList.toggle("on", fast); a.textContent = auto ? "⏸ オート中" : "▶ オート"; f.textContent = fast ? "⏩ 早送り中" : "⏩ 早送り"; }
    document.getElementById("autoBtn").onclick = function(){ auto = !auto; if(auto) fast = false; ctl(); sched(); };
    document.getElementById("fastBtn").onclick = function(){ fast = !fast; if(fast) auto = false; ctl(); sched(); };
    document.getElementById("skipBtn").onclick = function(){ alive = false; clearTimeout(timer); i = lines.length; choose(); };
    show();
  }

  // ---------- パズル ----------
  var P = null; // いまの事件
  function dur(mins){ return mins % 60 === 0 ? (mins / 60) + "時間" : mins + "分"; }
  function timeStr(mins, step){ var h = Math.floor(mins / 60), mm = mins % 60; return step % 60 === 0 ? h + "時" : h + ":" + (mm < 10 ? "0" : "") + mm; }
  function startPuzzle(c, e, choice, res){
    var ch = S.CH[c], n = ch.n, m = ch.m, ep = plan.eps[c][e];
    var base = BASE[save.diff] || 2, cap = c === 0 ? 2 : c === 1 ? 3 : 4;
    var lvl = Math.max(0, Math.min(cap, base + res.d));
    var ci = choice === "yes" ? 0 : choice === "no" ? 1 : 2;
    var seed = (((save.seed ^ ((c + 1) * 100003)) + (e + 1) * 1009 + ci * 7919 + lvl * 104729) | 0);
    var pz = G.makePuzzle(n, lvl, seed, m);
    var rr = G.rng(ep.eseed ^ (ci * 977));
    var ppl = castOf(c, e), roleOf = {}; ppl.forEach(function(x){ roleOf[x.name] = {r: x.role, s: x.pre}; });
    var attrs = [], i;
    if(ep.order){
      var ord = []; for(i = 1; i <= n; i++) ord.push(i + "番目");
      attrs.push({label: "事情を聞かれた順番", kind: "order", act: {pos: "事情を聞かれた", neg: "事情を聞かれなかった"}, vals: ord, adj: "前後すぐ（1つちがい）の順番に", gap: function(d){ return d + "人ぶん"; }});
    }else{
      var tv = []; for(i = 0; i < n; i++) tv.push(timeStr(ch.tstart + ch.step * (ep.toff + i), ch.step));
      attrs.push({label: ch.Alabel, kind: "time", act: ch.act, vals: tv, adj: "前後すぐ（" + dur(ch.step) + "ちがい）の時間に", gap: function(d){ return dur(d * ch.step); }});
    }
    ep.likes.forEach(function(l){ attrs.push({label: l.label, kind: "like", noun: l.noun, vals: l.vals.slice()}); });
    P = {c: c, e: e, n: n, m: m, ep: ep, pz: pz, lvl: lvl, people: ep.names.slice(), attrs: attrs, ch: ch, roleOf: roleOf, ppl: ppl, mode: "ok", mist: 0, hints: 0, choice: choice, res: res, cat: null, marks: {}, blk: "0_1", struck: {}, done: false, busy: false};
    P.cat = [{name: "人", items: P.people}].concat(attrs.map(function(x){ return {name: x.label, items: x.vals}; }));
    P.blocks = [];
    for(var R = 0; R <= m; R++) for(var C = 1; C <= m; C++) if(R === 0 || C < R){
      var grid = []; for(i = 0; i < n; i++){ grid[i] = []; for(var k = 0; k < n; k++) grid[i][k] = {s: 0, a: 0, d: 0}; }
      P.marks[R + "_" + C] = grid; P.blocks.push({key: R + "_" + C, R: R, C: C});
    }
    P.inv = pz.sol.S.map(function(arr){ var iv = []; arr.forEach(function(v, p){ iv[v] = p; }); return iv; });
    P.lines = makeLines(P, rr, res);
    go(screenPuzzle, "第" + (c + 1) + "章 第" + (e + 1) + "話", false);
  }

  var VOICE = {
    verb: {"相田": ["よ。", "って言ってたよ。", "みたいだよ。"], "切札 勝": ["。", "らしい。", "ようだ。"], "guest": ["はずです。", "と思います。", "と記憶しています。"], "島田会長": ["のじゃ。", "のう。", "じゃよ。"]},
    adj: {"相田": ["だよ。", "らしいよ。", "なんだって。"], "切札 勝": ["だ。", "らしい。", "なようだ。"], "guest": ["です。", "だったと思います。", "だと聞きました。"], "島田会長": ["なのじゃ。", "らしいのう。", "じゃそうじゃ。"]}
  };
  // 項目kが値vである、という言いかた。type=verb(〜た/〜ない)かadj(好き)
  function pred(P, k, v, neg){
    var at = P.attrs[k];
    if(at.kind === "like") return neg ? [at.noun + "なら" + at.vals[v] + "は好きではない", "verb"] : [at.noun + "なら" + at.vals[v] + "が好き", "adj"];
    return neg ? [at.vals[v] + "には" + at.act.neg, "verb"] : [at.vals[v] + "に" + at.act.pos, "verb"];
  }
  function teForm(P, k, v){
    var at = P.attrs[k];
    return at.kind === "like" ? at.noun + "なら" + at.vals[v] + "が好きで" : at.vals[v] + "に" + at.act.pos.replace(/た$/, "て");
  }
  function clueText(P, c, who){
    var N = P.people, at0 = P.attrs[0];
    function nm(p){ return who && who.guest === p ? "私" : N[p] + "さん"; }
    switch(c.t){
      case "eq": var e1 = pred(P, c.k, c.v); return [nm(c.p) + "は、" + e1[0], e1[1]];
      case "multi": var parts = c.ks.map(function(k, i){ return [k, c.vs[i]]; }), last = parts.pop(), pl = pred(P, last[0], last[1]);
        return [nm(c.p) + "は、" + parts.map(function(x){ return teForm(P, x[0], x[1]); }).join("、") + "、" + pl[0], pl[1]];
      case "neq": var n1 = pred(P, c.k, c.v, true); return [nm(c.p) + "は、" + n1[0], n1[1]];
      case "either": var at = P.attrs[c.k];
        return at.kind === "like" ? [nm(c.p) + "が好きな" + at.noun + "は、" + at.vals[c.v] + "か" + at.vals[c.w] + "のどちらか", "adj"] : [nm(c.p) + "は、" + at.vals[c.v] + "か" + at.vals[c.w] + "のどちらかに" + at.act.pos, "verb"];
      case "link": var f = pred(P, c.k1, c.a), g = pred(P, c.k2, c.b);
        return [f[0].replace(/好き$/, "好きな") + "人は、" + g[0], g[1]];
      case "notlink": var f2 = pred(P, c.k1, c.a), g2 = pred(P, c.k2, c.b, true);
        return [f2[0].replace(/好き$/, "好きな") + "人は、" + g2[0], g2[1]];
      case "before": return [nm(c.p) + "は、" + nm(c.q) + "より先に" + at0.act.pos, "verb"];
      case "adj": return [nm(c.p) + "と" + nm(c.q) + "は、" + at0.adj + at0.act.pos, "verb"];
      case "gap": return [nm(c.p) + "は、" + nm(c.q) + "より" + at0.gap(c.d) + "あとに" + at0.act.pos, "verb"];
    }
    return ["", "verb"];
  }
  function involved(c){ var s = []; ["p", "q"].forEach(function(k){ if(typeof c[k] === "number") s.push(c[k]); }); return s; }
  function makeLines(P, rr, res){
    var out = [];
    P.pz.clues.forEach(function(c){
      var x = rr(), speaker, guestIdx = -1, inv = involved(c);
      if(x < 0.42) speaker = AI; else if(x < 0.67) speaker = ME; else {
        guestIdx = Math.floor(rr() * P.n); speaker = P.people[guestIdx];
        if(inv.length === 2 && inv.indexOf(guestIdx) >= 0){ guestIdx = -1; speaker = rr() < .5 ? AI : ME; }
      }
      var t = clueText(P, c, guestIdx >= 0 ? {guest: guestIdx} : null);
      var vkey = speaker === AI ? AI : speaker === ME ? ME : "guest";
      var ends = VOICE[t[1]][vkey], endTxt = ends[Math.floor(rr() * ends.length)];
      var isG = guestIdx >= 0, rl = isG ? P.roleOf[speaker] : null;
      var pre = isG && rl && rr() < 0.45 ? rl.s : "";
      out.push({who: speaker, role: rl ? rl.r : "", gi: guestIdx, text: pre + t[0] + endTxt, noise: false});
    });
    var nn = [1, 1, 2, 3, 4][P.lvl] + (res.noise || 0);
    var pool = G.shuffle(rr, S.NOISE);
    var tv = P.attrs[0].vals, bv = P.attrs[1].vals;
    for(var i = 0; i < nn; i++){
      var tx = (i === 0 ? S.CASUAL[Math.floor(rr() * S.CASUAL.length)] : pool[i % pool.length]).replace("{t}", tv[Math.floor(rr() * P.n)]).replace("{b}", bv[Math.floor(rr() * P.n)]);
      out.splice(Math.floor(rr() * (out.length + 1)), 0, {who: SH, role: "", gi: -1, text: tx, noise: true});
    }
    return out;
  }

  // ---------- 表の ロジック ----------
  // カテゴリ 0=人、1..m=項目。マス＝[行カテゴリ R][列カテゴリ C][行 i][列 j]。
  // 状態 s：0=なし／1=○（正解）／2=×（自動）。a：1=自動でうまった ○。d：下書き（1=○？ 2=✕？）。
  function personOf(cat, idx){ return cat === 0 ? idx : P.inv[cat - 1][idx]; }
  function truthCell(R, C, i, j){ return personOf(R, i) === personOf(C, j); }
  function cellOf(key, i, j){ return P.marks[key][i][j]; }
  function setCell(blk, i, j, s, auto, fx){
    var x = P.marks[blk.key][i][j]; if(x.s === s) return false;
    x.s = s; x.a = auto ? 1 : 0; x.d = 0;
    if(fx) fx.push({key: blk.key, i: i, j: j, s: s}); return true;
  }
  // ○ からわかることを ぜんぶ ひろげる（同じ人のグループ＝つながった ○。そこから ○ と × が 自動で決まる／1つしか 残らない行・列は ○）
  function propagate(fx){
    var n = P.n, m = P.m, any = false, loops = 0, changed = true;
    while(changed && loops++ < 60){
      changed = false;
      var par = []; for(var k = 0; k < (m + 1) * n; k++) par[k] = k;
      var find = function(x){ while(par[x] !== x){ par[x] = par[par[x]]; x = par[x]; } return x; };
      P.blocks.forEach(function(b){ var g = P.marks[b.key]; for(var i = 0; i < n; i++) for(var j = 0; j < n; j++) if(g[i][j].s === 1){ var a = find(b.R * n + i), c2 = find(b.C * n + j); if(a !== c2) par[a] = c2; } });
      var has = {};   // グループの根 → {カテゴリ: 番号}
      for(var it = 0; it < (m + 1) * n; it++){ var rt = find(it), cat = Math.floor(it / n); (has[rt] = has[rt] || {})[cat] = it % n; }
      P.blocks.forEach(function(b){
        var g = P.marks[b.key];
        for(var i = 0; i < n; i++) for(var j = 0; j < n; j++){
          var cell = g[i][j]; if(cell.s) continue;
          var ra = find(b.R * n + i), rb = find(b.C * n + j);
          if(ra === rb){ if(setCell(b, i, j, 1, true, fx)){ changed = true; any = true; } }
          else if(has[ra][b.C] !== undefined || has[rb][b.R] !== undefined){ if(setCell(b, i, j, 2, true, fx)){ changed = true; any = true; } }
        }
      });
      P.blocks.forEach(function(b){
        var g = P.marks[b.key], i, j, cnt, at;
        for(i = 0; i < n; i++){ cnt = 0; at = -1; for(j = 0; j < n; j++) if(g[i][j].s !== 2){ cnt++; at = j; } if(cnt === 1 && g[i][at].s === 0){ setCell(b, i, at, 1, true, fx); changed = true; any = true; } }
        for(j = 0; j < n; j++){ cnt = 0; at = -1; for(i = 0; i < n; i++) if(g[i][j].s !== 2){ cnt++; at = i; } if(cnt === 1 && g[at][j].s === 0){ setCell(b, at, j, 1, true, fx); changed = true; any = true; } }
      });
    }
    return any;
  }
  // 人の行（人×各項目）が ぜんぶ ○ か
  function isComplete(){
    for(var C = 1; C <= P.m; C++){ var g = P.marks["0_" + C]; for(var i = 0; i < P.n; i++){ var ok = false; for(var j = 0; j < P.n; j++) if(g[i][j].s === 1){ ok = true; break; } if(!ok) return false; } }
    return true;
  }
  function blockDone(b){ var g = P.marks[b.key]; for(var i = 0; i < P.n; i++){ var ok = false; for(var j = 0; j < P.n; j++) if(g[i][j].s === 1){ ok = true; break; } if(!ok) return false; } return true; }
  function progress(){ var d = 0, t = P.n * P.m; for(var C = 1; C <= P.m; C++){ var g = P.marks["0_" + C]; for(var i = 0; i < P.n; i++) for(var j = 0; j < P.n; j++) if(g[i][j].s === 1) d++; } return [d, t]; }

  // ○ を入れる（本書き）。その場で 正解／まちがいを 判定する
  function placeOk(blkKey, i, j, byHint){
    if(!P || P.done) return {r: "none"};
    var b = P.blocks.filter(function(x){ return x.key === blkKey; })[0], cell = cellOf(blkKey, i, j);
    if(cell.s === 1) return {r: "already"};
    if(cell.s === 2) return {r: "x"};
    if(truthCell(b.R, b.C, i, j)){
      var fx = []; setCell(b, i, j, 1, false, fx); var first = fx[0];
      propagate(fx);
      return {r: "ok", fx: fx, from: first, complete: isComplete()};
    }
    if(!byHint) P.mist++;
    return {r: "wrong"};
  }

  // ---------- 表の画面 ----------
  var sheetOpen = false;
  function closeSheet(quiet){ sheetOpen = false; var s = document.querySelector(".cluecol"); if(s) s.classList.remove("open"); }
  function blkTitle(b){ return P.cat[b.R].name.replace(/^好きな/, "") + "×" + P.cat[b.C].name.replace(/^好きな/, ""); }
  function screenPuzzle(){
    mode = "puzzle"; inGame = true; btnBack.style.visibility = "visible"; document.body.classList.add("in-puzzle");
    playBgm(P.lvl >= 3 ? "bgm_puzzle_hard" : P.lvl >= 1 ? "bgm_puzzle_normal" : "bgm_puzzle_easy");
    var vic = P.ppl[P.ep.victim], n = P.n;
    var h = '<div class="pz' + (P.ch.hero ? " hero" : "") + '"><aside class="cluecol" id="cluecol"><button type="button" class="sheetbar" id="sheetBtn">💬 みんなの話（' + P.lines.length + 'こ） <span class="car">▲</span></button><div class="cluebody"><div class="panel"><div class="badges"><span class="chip">第' + (P.c + 1) + '章 第' + (P.e + 1) + '話</span><span class="chip">表 ' + n + '×' + n + '（人＋' + P.m + '項目）</span><span class="chip">難しさ：' + (LEVELNAME[BASE[save.diff] || 2] === LEVELNAME[P.lvl] ? LEVELNAME[P.lvl] : LEVELNAME[BASE[save.diff] || 2] + '→' + LEVELNAME[P.lvl]) + '</span></div>' +
      '<div class="victim">🩹 被害者：<b>' + esc(vic.name) + '</b>（' + esc(vic.role) + '）</div><h3>みんなの話 <small>（タップで ✓ 線をひけるよ）</small></h3><div class="log" id="clues">';
    P.lines.forEach(function(l, k){
      h += '<div class="line' + (l.noise ? " noise" : "") + '" data-k="' + k + '">' + avHtml(l.who) + '<div class="bub"><b>' + esc(l.who) + (l.role ? "（" + esc(l.role) + "）" : "") + '</b>' + esc(l.text) + '</div></div>';
    });
    h += '</div><p class="note">※ 事件と関係のない話も まじっているよ。手がかりだけで、答えは必ず1つに決まるよ。</p></div></div></aside>';
    h += '<section class="tabcol"><div class="panel"><div class="tools"><div class="mode"><button type="button" data-mode="ok" class="on">✍ 本書き（○）</button><button type="button" data-mode="dr">✎ 下書き</button></div>' +
      '<button class="btn sub sm" type="button" id="bHint">💡 ヒント</button><button class="btn sub sm" type="button" id="bClearDr">下書きを消す</button><button class="btn sub sm" type="button" id="bReset">やりなおし</button></div>' +
      '<p class="note" id="modeNote"></p><div class="meter"><span id="progTxt"></span><div class="mbar"><span id="progBar"></span></div><span class="mist" id="mistTxt"></span></div></div>' +
      '<div class="panel gridpanel"><div class="tabs" id="tabs"></div><div class="blkwrap" id="blk"></div></div></section></div>';
    app.innerHTML = h;
    P.mode = "ok"; updateMode(); renderTabs(); renderBlock(); updateMeter();
    document.getElementById("sheetBtn").onclick = function(){ sheetOpen = !sheetOpen; document.getElementById("cluecol").classList.toggle("open", sheetOpen); };
    app.querySelectorAll(".mode button").forEach(function(b){ b.onclick = function(){ P.mode = b.dataset.mode; sfx("tap"); updateMode(); }; });
    document.getElementById("clues").onclick = function(ev){ var ln = ev.target.closest && ev.target.closest(".line"); if(!ln) return; var k = ln.dataset.k; P.struck[k] = !P.struck[k]; ln.classList.toggle("struck", !!P.struck[k]); };
    document.getElementById("bClearDr").onclick = function(){ eachCell(function(b, i, j, x){ x.d = 0; }); paintAll(); toast("下書きを ぜんぶ消したよ"); };
    document.getElementById("bReset").onclick = function(){ confirmBox("表を ぜんぶ まっさらに もどす？<br>（まちがいの回数は そのままだよ）", "もどす", function(){ eachCell(function(b, i, j, x){ x.s = 0; x.a = 0; x.d = 0; }); paintAll(); renderTabs(); updateMeter(); }); };
    document.getElementById("bHint").onclick = hint;
    window.addEventListener("resize", fitCell);
  }
  function eachCell(f){ P.blocks.forEach(function(b){ var g = P.marks[b.key]; for(var i = 0; i < P.n; i++) for(var j = 0; j < P.n; j++) f(b, i, j, g[i][j]); }); }
  function updateMode(){
    app.querySelectorAll(".mode button").forEach(function(x){ x.classList.toggle("on", x.dataset.mode === P.mode); });
    document.getElementById("modeNote").textContent = P.mode === "dr"
      ? "下書き：タップで ○？ → ✕？ → なし と変わるよ。メモなので、判定も 自動の ✕ も 動かないよ。"
      : "本書き：自信のあるマスを タップ。○ が合っていれば、同じ行・列が 自動で ✕ になるよ。ちがうと まちがい ＋1。";
    document.getElementById("blk").classList.toggle("drmode", P.mode === "dr");
  }
  function updateMeter(){
    var pr = progress(); document.getElementById("progTxt").textContent = "人の行 " + pr[0] + " / " + pr[1];
    document.getElementById("progBar").style.width = Math.round(pr[0] / pr[1] * 100) + "%";
    var mt = document.getElementById("mistTxt"); mt.textContent = "まちがい " + P.mist + "　ヒント " + P.hints;
  }
  function renderTabs(){
    var h = "";
    P.blocks.forEach(function(b){
      var done = blockDone(b), done2 = 0, g = P.marks[b.key];
      for(var i = 0; i < P.n; i++) for(var j = 0; j < P.n; j++) if(g[i][j].s === 1) done2++;
      h += '<button type="button" class="tab' + (b.key === P.blk ? " on" : "") + (done ? " done" : "") + '" data-k="' + b.key + '">' + esc(blkTitle(b)) + '<small>' + (done ? "✔" : done2 + "/" + P.n) + '</small></button>';
    });
    var t = document.getElementById("tabs"); t.innerHTML = h;
    t.querySelectorAll(".tab").forEach(function(b){ b.onclick = function(){ P.blk = b.dataset.k; sfx("tap"); renderTabs(); renderBlock(); }; });
  }
  function renderBlock(){
    var b = P.blocks.filter(function(x){ return x.key === P.blk; })[0], n = P.n, R = b.R, C = b.C;
    var h = '<table class="g blk"><thead><tr><th class="corner"><span class="cr">' + esc(P.cat[R].name.replace(/^好きな/, "")) + '</span><span class="cc">' + esc(P.cat[C].name.replace(/^好きな/, "")) + '</span></th>';
    P.cat[C].items.forEach(function(v, j){ h += '<th class="vh" data-j="' + j + '"><span>' + esc(kanjiNum(shortLabel(v))) + '</span></th>'; });
    h += '</tr></thead><tbody>';
    for(var i = 0; i < n; i++){
      h += '<tr><th class="rh" data-i="' + i + '">' + esc(shortLabel(P.cat[R].items[i])) + '</th>';
      for(var j = 0; j < n; j++) h += '<td><button type="button" class="cl" data-i="' + i + '" data-j="' + j + '" aria-label="' + esc(P.cat[R].items[i] + " × " + P.cat[C].items[j]) + '"></button></td>';
      h += '</tr>';
    }
    var wrap = document.getElementById("blk"); wrap.innerHTML = h + '</tbody></table>';
    wrap.querySelector("table").style.setProperty("--n", n);
    wrap.onclick = cellClick;
    fitCell(); paintAll();
  }
  function fitCell(){
    try{
      if(mode !== "puzzle") return;
      var gp = app.querySelector(".gridpanel"); if(!gp) return;
      var W = gp.clientWidth - 22, n = P.n, rh = n >= 9 ? 62 : n >= 7 ? 70 : 84;
      var c = Math.floor((W - rh) / n); c = Math.max(30, Math.min(48, c));
      document.documentElement.style.setProperty("--cell", c + "px"); document.documentElement.style.setProperty("--rh", rh + "px");
    }catch(_e){}
  }
  function paintCell(btn, x, anim, delay){
    var cls = "cl";
    if(x.s === 1) cls += " ok" + (x.a ? " auto" : "");
    else if(x.s === 2) cls += " ng";
    else if(x.d) cls += " d" + x.d;
    if(anim) cls += " " + anim;
    btn.className = cls;
    if(delay !== undefined) btn.style.setProperty("--d", delay + "ms"); else btn.style.removeProperty("--d");
  }
  function paintAll(){
    var wrap = document.getElementById("blk"); if(!wrap) return;
    var g = P.marks[P.blk];
    wrap.querySelectorAll(".cl").forEach(function(btn){ paintCell(btn, g[+btn.dataset.i][+btn.dataset.j]); });
  }
  function hl(i, j){
    var wrap = document.getElementById("blk"); if(!wrap) return;
    wrap.querySelectorAll(".hl").forEach(function(x){ x.classList.remove("hl"); });
    var r = wrap.querySelector('.rh[data-i="' + i + '"]'), c = wrap.querySelector('.vh[data-j="' + j + '"]'); if(r) r.classList.add("hl"); if(c) c.classList.add("hl");
    clearTimeout(hl.t); hl.t = setTimeout(function(){ wrap.querySelectorAll(".hl").forEach(function(x){ x.classList.remove("hl"); }); }, 1100);
  }
  function cellClick(ev){
    var btn = ev.target.closest && ev.target.closest(".cl"); if(!btn || !P || P.done || P.busy) return;
    var i = +btn.dataset.i, j = +btn.dataset.j, x = cellOf(P.blk, i, j);
    hl(i, j);
    if(P.mode === "dr"){
      if(x.s){ toast(x.s === 1 ? "そこは もう ○ で 決まっているよ" : "そこは もう ✕ で 決まっているよ"); return; }
      x.d = (x.d + 1) % 3; paintCell(btn, x, x.d ? "pop" : ""); sfx("tap"); return;
    }
    var r = placeOk(P.blk, i, j);
    if(r.r === "already"){ toast("そこは もう ○ だよ"); return; }
    if(r.r === "x"){ toast("そこは もう ✕ と わかっているよ（自動で入った ✕ だよ）"); sfx("ng"); return; }
    if(r.r === "wrong"){
      sfx("ng"); buzz(80); paintCell(btn, x, "wrong"); setTimeout(function(){ if(P && P.marks) paintCell(btn, x); }, 650);
      var wl = ["あれ？ ちがうみたい…", "うーん、そこは ちがうよ。", "おしい…！ もう一度、手がかりを 見なおそう。", "ざんねん、そこじゃないみたい。"];
      toast(wl[P.mist % wl.length]); updateMeter(); return;
    }
    applyFx(r, btn);
  }
  // ○ が決まったあとの 見た目（ポン！ → 自動の ✕ が さざなみのように ひろがる）
  function applyFx(r, btn){
    sfx("ok");
    var wrap = document.getElementById("blk"), g = P.marks[P.blk], f0 = r.from, autoCnt = 0;
    var other = {};
    r.fx.forEach(function(f){
      if(f === f0) return;
      if(f.key === P.blk){
        var bt = wrap.querySelector('.cl[data-i="' + f.i + '"][data-j="' + f.j + '"]');
        if(bt){ var dist = f0 && f0.key === P.blk ? Math.abs(f.i - f0.i) + Math.abs(f.j - f0.j) : 1; paintCell(bt, g[f.i][f.j], f.s === 1 ? "pop" : "rip", Math.min(900, dist * 45)); autoCnt++; }
      }else other[f.key] = 1;
    });
    paintCell(btn, g[f0.i][f0.j], "pop");
    renderTabs();
    Object.keys(other).forEach(function(k){ var t = document.querySelector('#tabs .tab[data-k="' + k + '"]'); if(t) t.classList.add("flash"); });
    updateMeter();
    if(autoCnt > 3 || Object.keys(other).length) sfx("auto");
    if(r.complete) win();
  }
  function hint(){
    if(!P || P.done) return;
    var cand = [];
    for(var C = 1; C <= P.m; C++) for(var p = 0; p < P.n; p++){ var g = P.marks["0_" + C][p], has = false; for(var v = 0; v < P.n; v++) if(g[v].s === 1) has = true; if(!has) cand.push([C, p]); }
    if(!cand.length) return;
    var x = cand[Math.floor(Math.random() * cand.length)], C2 = x[0], p2 = x[1], tv = P.pz.sol.S[C2 - 1][p2];
    P.hints++; P.blk = "0_" + C2; renderTabs(); renderBlock();
    var r = placeOk("0_" + C2, p2, tv, true); P.mode = "ok"; updateMode();
    var btn = document.querySelector('#blk .cl[data-i="' + p2 + '"][data-j="' + tv + '"]');
    toast("ヒント：" + P.people[p2] + "さんの「" + P.cat[C2].name + "」は " + P.cat[C2].items[tv] + " だよ（○を入れたよ）");
    if(r.r === "ok") applyFx(r, btn);
  }

  // ---------- クリアの演出 ----------
  function confetti(ms){
    var cv = document.createElement("canvas"); cv.className = "confetti"; document.body.appendChild(cv);
    var W = cv.width = window.innerWidth, H = cv.height = window.innerHeight, ctx = cv.getContext("2d"), ps = [], i;
    var cols = ["#ffd24a", "#ff7b8a", "#5fe0a0", "#7cc4ff", "#c79bff", "#ffffff"];
    for(i = 0; i < 140; i++) ps.push({x: Math.random() * W, y: -20 - Math.random() * H * .6, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length]});
    var t0 = Date.now();
    (function loop(){
      var el = Date.now() - t0; ctx.clearRect(0, 0, W, H);
      ps.forEach(function(p){ p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - el / ms); ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); ctx.restore(); });
      if(el < ms && document.body.contains(cv)) requestAnimationFrame(loop); else cv.remove();
    })();
  }
  function win(){
    if(P.done) return; P.done = true; P.busy = true; sfx("clear"); buzz(30);
    // のこりの マスを ぜんぶ ひらく（さざなみ）
    eachCell(function(b, i, j, x){ if(x.s === 0){ x.s = truthCell(b.R, b.C, i, j) ? 1 : 2; x.a = 1; x.d = 0; } });
    renderTabs(); renderBlock();
    var cells = document.querySelectorAll("#blk .cl"); cells.forEach(function(bt, k){ bt.style.setProperty("--d", (k % P.n) * 25 + Math.floor(k / P.n) * 25 + "ms"); bt.classList.add("wave"); });
    confetti(2800);
    var tt = document.getElementById("modeNote"); if(tt) tt.textContent = "✨ 表が 完成！ 事件解決だよ…！";
    setTimeout(function(){ luck(); }, 1900);
  }

  // ---------- 犯人当てクイズ（運だめし・1問だけ）----------
  function luck(){
    mode = "luck"; document.body.classList.remove("in-puzzle");
    var ep = P.ep, vic = P.ppl[ep.victim];
    var pool = []; for(var i = 0; i < P.n; i++) if(i !== ep.victim) pool.push(i);
    var cnt = Math.min(4, pool.length);
    var others = pool.filter(function(i){ return i !== ep.culprit; });
    var names = G.shuffle(Math.random, [ep.culprit].concat(G.shuffle(Math.random, others).slice(0, cnt - 1)));
    app.innerHTML = '<section class="panel result"><div class="big-star">🎲</div><h2>犯人当てクイズ！</h2><p>表は完成！ …さて、おまけの1問。<br>被害にあった <b>' + esc(vic.name) + '</b>さん（' + esc(vic.role) + '）。<br>犯人は…ヒントなしの<b>運だめし</b>だよ。<br>' + cnt + '人のうち、だれ？</p><div class="tools" id="lk" style="justify-content:center;margin:12px 0"></div><p class="note">あたってもはずれても、事件は解決。当たると ★ボーナス！</p></section>';
    var box = document.getElementById("lk");
    names.forEach(function(p){ var b = document.createElement("button"); b.className = "btn"; b.type = "button"; b.innerHTML = esc(P.people[p]) + '<small class="rl">' + esc(P.ppl[p].role) + '</small>'; b.onclick = function(){ sfx("tap"); finish(p === ep.culprit); }; box.appendChild(b); });
  }

  function finish(lucky){
    var stars = P.hints ? 1 : (P.mist <= 1 ? 3 : (P.mist <= 5 ? 2 : 1));
    var prev = save.cleared[ck(P.c, P.e)];
    if(!prev || (prev.s || 0) < stars) save.cleared[ck(P.c, P.e)] = {s: stars, l: lucky ? 1 : (prev && prev.l) || 0};
    persist(); inGame = false; mode = "result";
    try{ if(window.DeduceStats) window.DeduceStats.record({c: P.c, e: P.e, stars: stars, mist: P.mist || 0, hints: P.hints || 0, lucky: !!lucky, n: P.n}); }catch(_e){}
    var lastCh = P.c === NCH - 1 && P.e === EPN - 1;
    playBgm(lastCh ? "bgm_final" : "bgm_result");
    var ep = P.ep, cul = P.ppl[ep.culprit], vic = P.ppl[ep.victim];
    var end = S.ENDINGS[(P.c + P.e) % S.ENDINGS.length], extra = S.ENDINGS[(P.c * 2 + P.e + 1) % S.ENDINGS.length];
    var last = P.e === EPN - 1;
    var more = last ? (lastCh ? "これで、すべての事件が解決だよ。ここまで本当にありがとう！" : P.c === 9 ? "第11章が開いたよ！ 次からは『やりすぎヒーロー伝説』だよ！" : "第" + (P.c + 2) + "章が開いたよ！") : "次の話が開いたよ。";
    app.innerHTML = '<section class="panel result"><h2>事件解決！</h2><div class="big-star stars3">' + [1, 2, 3].map(function(k){ return '<span class="st' + (k <= stars ? " on" : "") + '" style="animation-delay:' + (.25 + k * .3) + 's">' + (k <= stars ? "★" : "☆") + '</span>'; }).join("") + (lucky ? ' <span class="sp">✨</span>' : "") + '</div>' +
      '<p>' + (lucky ? "犯人当て：大当たり！ ✨ ボーナスだよ。" : "犯人当て：はずれ！ おしい！") + '</p>' +
      '<p class="culp">被害者は <b>' + esc(vic.name) + '</b>（' + esc(vic.role) + '）<br>真犯人は <b>' + esc(cul.name) + '（' + esc(cul.role) + '）</b>…<br>「' + esc(CASTD[P.c].motives[P.e]) + '」</p>' +
      '<div class="log" style="text-align:left;max-width:540px;margin:10px auto">' +
      [end, extra, [AI, more]].map(function(l){ return '<div class="line">' + avHtml(l[0]) + '<div class="bub"><b>' + esc(l[0]) + '</b>' + esc(l[1]) + '</div></div>'; }).join("") + '</div>' +
      '<p class="note">まちがい ' + P.mist + ' 回／ヒント ' + P.hints + ' 回　（★3＝ヒントなし＋まちがい1回まで／★2＝まちがい5回まで）</p>' +
      '<div class="tools" style="justify-content:center"><button class="btn" id="bNext" type="button">' + (last ? "章えらびへ" : "次の話へ") + '</button><button class="btn sub" id="bEps" type="button">話えらびへ</button></div></section>';
    confetti(1800);
    var c = P.c, e = P.e;
    document.getElementById("bNext").onclick = function(){ stack = []; cur = null; if(last) go(screenChapters, "章をえらぶ", false); else { go(function(){ screenEpisodes(c); }, "第" + (c + 1) + "章", false); startEpisode(c, e + 1); } };
    document.getElementById("bEps").onclick = function(){ stack = []; cur = null; go(screenChapters, "章をえらぶ", false); go(function(){ screenEpisodes(c); }, "第" + (c + 1) + "章"); };
  }

  window.__g6 = {
    get P(){ return P; }, get plan(){ return plan; }, get save(){ return save; }, S: S, G: G,
    startPuzzle: startPuzzle, placeOk: placeOk, propagate: propagate, isComplete: isComplete, truthCell: truthCell, castOf: castOf,
    rebuild: function(seed){ save.seed = seed; plan = PL.build(seed); return plan; }, screenChapters: screenChapters
  };
  go(screenTitle, TITLE, false);
})();
