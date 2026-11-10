"use strict";
(function(){
  var S = window.SuiriStory, G = window.SuiriGen;
  var IMG = "../game5/play/img/", AUD = "../game5/play/audio/";
  var app = document.getElementById("app"), barTitle = document.getElementById("barTitle");
  var btnBack = document.getElementById("btnBack"), selDiff = document.getElementById("diff"), btnSnd = document.getElementById("btnSnd");
  var LEVELNAME = ["とてもかんたん", "かんたん", "ふつう", "むずかしい", "とてもむずかしい"];
  var BASE = {easy: 1, normal: 2, hard: 3};
  var CAST = {
    "相田": {img: "chara_aida.webp", ini: "相"}, "勝": {img: "chara_katsu.webp", ini: "勝"}, "島田": {img: "chara_shimada.webp", ini: "島"}
  };
  var GUESTS = ["guest_a.webp", "guest_b.webp", "guest_c.webp", "guest_d.webp", "guest_e.webp", "guest_f.webp"];

  // ---------- 保存 ----------
  var SAVE_KEY = "game6_save_v1", save = {cleared: {}, diff: "normal", mute: false};
  try{ var raw = localStorage.getItem(SAVE_KEY); if(raw){ var o = JSON.parse(raw); if(o && typeof o === "object"){ save.cleared = o.cleared || {}; save.diff = BASE[o.diff] ? o.diff : "normal"; save.mute = !!o.mute; } } }catch(_e){}
  function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(_e){} }
  function ck(c, e){ return c + "-" + e; }
  function isCleared(c, e){ return !!save.cleared[ck(c, e)]; }
  function chCount(c){ var n = 0; for(var e = 0; e < 10; e++) if(isCleared(c, e)) n++; return n; }
  function chOpen(c){ return c < 3 || chCount(c - 1) >= 10; }
  function epOpen(c, e){ return chOpen(c) && (e === 0 || isCleared(c, e - 1)); }

  // ---------- 音 ----------
  var bgm = null, bgmName = "", unlocked = false;
  function playBgm(name){
    bgmName = name;
    if(save.mute || !unlocked) return;
    try{
      if(!bgm){ bgm = new Audio(); bgm.loop = true; bgm.volume = .35; bgm.preload = "none"; }
      var src = AUD + name + ".mp3";
      if(bgm.getAttribute("data-n") !== name){ bgm.setAttribute("data-n", name); bgm.src = src; }
      var p = bgm.play(); if(p && p.catch) p.catch(function(){});
    }catch(_e){}
  }
  function stopBgm(){ try{ if(bgm) bgm.pause(); }catch(_e){} }
  function sndIcon(){ btnSnd.textContent = save.mute ? "🔇" : "🔊"; }
  document.addEventListener("pointerdown", function(){ if(!unlocked){ unlocked = true; if(bgmName) playBgm(bgmName); } }, {once: false, passive: true});
  btnSnd.addEventListener("click", function(){ save.mute = !save.mute; persist(); sndIcon(); if(save.mute) stopBgm(); else playBgm(bgmName || "bgm_title"); });
  sndIcon();
  selDiff.value = save.diff;
  selDiff.addEventListener("change", function(){ save.diff = selDiff.value; persist(); toast("次の事件から「" + selDiff.selectedOptions[0].textContent + "」になるよ"); });

  // ---------- 小物 ----------
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  var toastT = 0;
  function toast(t){ var el = document.getElementById("toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function(){ el.classList.remove("on"); }, 2600); }
  function bgStyle(c){ return "--bgimg:url(" + IMG + "bg_ch" + (c < 9 ? "0" : "") + (c + 1) + ".jpg)"; }
  function imgTag(file, cls){ return '<img src="' + IMG + file + '" alt="" class="' + (cls || "") + '" onerror="this.style.display=\'none\'" loading="lazy" decoding="async">'; }
  function hue(name){ var h = 0; for(var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360; return h; }
  function avHtml(name, idx){
    if(!CAST[name]) return '<span class="av" style="background:hsl(' + hue(name) + ',45%,32%)"><span>' + esc(name.charAt(0)) + '</span></span>';
    var c = CAST[name], file = c ? c.img : GUESTS[(idx || 0) % GUESTS.length], ini = c ? c.ini : name.charAt(0);
    return '<span class="av" style="position:relative"><span>' + esc(ini) + '</span><img src="' + IMG + file + '" alt="" style="position:absolute;inset:0" onerror="this.remove()"></span>';
  }
  function modal(html, buttons){
    var m = document.createElement("div"); m.className = "modal";
    m.innerHTML = '<div class="box">' + html + '<div class="row"></div></div>';
    var row = m.querySelector(".row");
    buttons.forEach(function(b){ var x = document.createElement("button"); x.className = "btn " + (b.cls || ""); x.textContent = b.t; x.onclick = function(){ m.remove(); if(b.f) b.f(); }; row.appendChild(x); });
    document.body.appendChild(m); return m;
  }

  // ---------- 画面の移動 ----------
  var stack = [];
  function go(fn, title, push){ if(push !== false && cur) stack.push(cur); cur = {fn: fn, title: title}; barTitle.textContent = title || "推理ゲーム2"; window.scrollTo(0, 0); fn(); }
  var cur = null;
  btnBack.addEventListener("click", function(){
    if(cur && cur.noBack){ return; }
    if(inGame && !confirm("いまの事件をやめて、もどる？（進みぐあいは保存されないよ）")) return;
    inGame = false;
    var p = stack.pop(); if(p){ cur = null; go(p.fn, p.title, false); } else { cur = null; go(screenTitle, "推理ゲーム2", false); }
  });
  var inGame = false;
  var btnExit = document.getElementById("btnExit");
  if(btnExit){ btnExit.textContent = window.AREExit ? AREExit.label() : "終了"; btnExit.addEventListener("click", function(){ if(window.AREExit) AREExit.open(); }); }

  // ---------- タイトル ----------
  function screenTitle(){
    playBgm("bgm_title"); btnBack.style.visibility = "hidden";
    var done = 0; for(var k in save.cleared) done++;
    app.innerHTML = '<section class="hero">' + imgTag("logo.webp") + '<h1>推理ゲーム2</h1>' +
      '<p>人の話から「いつ」「なにが好き」を推理して、表を完成させよう。<br>第1章〜第10章・各10話。第1〜3章は、はじめから選べるよ。</p>' +
      '<button class="btn big" id="goStart" type="button">' + (done ? "つづきから" : "はじめる") + '</button>' +
      '<p class="note">クリアした話：' + done + ' / 100</p></section>';
    document.getElementById("goStart").onclick = function(){ unlocked = true; go(screenChapters, "章をえらぶ"); btnBack.style.visibility = "visible"; };
  }

  // ---------- 章えらび ----------
  function screenChapters(){
    playBgm("bgm_title"); btnBack.style.visibility = "visible";
    var h = '<h2>章をえらぶ</h2><div class="grid2">';
    S.CH.forEach(function(ch, c){
      var open = chOpen(c), cnt = chCount(c);
      h += '<button type="button" class="chcard' + (open ? "" : " lock") + '" data-c="' + c + '" style="' + bgStyle(c) + ';background-size:cover">' +
        '<span class="tag' + (ch.kind === "お試し" ? " b" : ch.kind === "練習" ? " c" : "") + '">' + ch.kind + '</span><b>第' + (c + 1) + '章 ' + esc(ch.name) + '</b>' +
        '<small>表の大きさ ' + ch.n + '×' + ch.n + '　' + cnt + '/10話クリア' + (open ? "" : "　🔒 前の章をクリアすると開くよ") + '</small></button>';
    });
    app.innerHTML = h + '</div>';
    app.querySelectorAll(".chcard").forEach(function(b){ b.onclick = function(){ var c = +b.dataset.c; go(function(){ screenEpisodes(c); }, "第" + (c + 1) + "章"); }; });
  }

  // ---------- 話えらび ----------
  function screenEpisodes(c){
    playBgm("bgm_story");
    var ch = S.CH[c];
    var h = '<h2>第' + (c + 1) + '章 ' + esc(ch.name) + '</h2><p class="note">' + ch.kind + '／表の大きさ ' + ch.n + '×' + ch.n + '。前の話をクリアすると、次の話が開くよ。</p><div class="eps">';
    ch.items.forEach(function(it, e){
      var cl = save.cleared[ck(c, e)], open = epOpen(c, e);
      h += '<button type="button" class="ep' + (cl ? " cleared" : "") + (open ? "" : " lock") + '" data-e="' + e + '"><b>第' + (e + 1) + '話</b><small>' + esc(it[0]) + '</small>' +
        '<span class="stars">' + (cl ? "★".repeat(cl.s || 1) + "☆".repeat(3 - (cl.s || 1)) : (open ? "" : "🔒")) + '</span></button>';
    });
    app.innerHTML = h + '</div>';
    app.querySelectorAll(".ep").forEach(function(b){ b.onclick = function(){ startEpisode(c, +b.dataset.e); }; });
  }

  // 章の10人から、その話に登場する人を決める（話ごとにちがう5人が前面に出る）
  function pickCast(c, e){
    var pool = window.SuiriCast[c].cast, r = G.rng((c + 1) * 4243 + (e + 1) * 97);
    var order = G.shuffle(r, pool), n = S.CH[c].n;
    var feat = order.slice(0, Math.min(5, n));
    return {feat: feat, all: order.slice(0, n)};
  }

  // ---------- 会話（ストーリー） ----------
  function startEpisode(c, e){
    var ch = S.CH[c], it = ch.items[e];
    var lines = [];
    if(e === 0){
      if(c === 0){ lines.push(["相田", "はじめまして！ わたしは相田。探偵さんの助手だよ。まずはお試しで、やさしい事件から始めよう！"]); lines.push(["勝", "○と×をつけながら、表を完成させるんだ。むずかしく考えなくていい。"]); }
      else if(c === 1){ lines.push(["相田", "第2章は練習の章だよ。問題に慣れていこうね！"]); }
      else if(c === 2){ lines.push(["勝", "ここからが本番だ。覚悟はいいか、探偵。"]); lines.push(["相田", "第3章からは、本格的な推理だよ。わたしも全力でサポートするね！"]); }
      else { lines.push(["相田", "第" + (c + 1) + "章のはじまりだよ。『" + ch.name.split(" ")[0] + "』…気をひきしめていこう。"]); }
    }
    var tm = [
      "事件よ！ " + ch.place + "で『" + it[0] + "』が起きたの。",
      "大変！ 『" + it[0] + "』…" + ch.place + "が大さわぎになってるみたい！",
      "探偵さん、依頼が来たわ。" + ch.place + "の『" + it[0] + "』について、調べてほしいって。"
    ], tk = [
      "落ち着け、相田。まずは" + ch.n + "人の話を聞いてみよう。",
      "関係者は" + ch.n + "人。全員の話を聞く必要がありそうだ。",
      "状況を整理しよう。" + ch.n + "人の証言が頼りだ。"
    ];
    lines.push(["相田", tm[(c + e) % 3]]);
    lines.push(["", it[1]]);
    lines.push(["勝", tk[(c * 2 + e) % 3]]);
    var cs = pickCast(c, e);
    lines.push(["相田", "今回の関係者を紹介するね！" + (ch.n < 5 ? "" : "（この話にしか出てこない人たちだよ）")]);
    cs.feat.forEach(function(m){ lines.push([m[0] + "（" + m[1] + "）", m[0] + "です。" + m[1] + "をしています。"]); });
    if(e === 9) lines.push(["相田", "これが、この章の最後の事件…！ 気合いを入れていくよ！"]);
    var q = S.QUESTIONS[(c * 3 + e) % S.QUESTIONS.length];
    inGame = true;
    go(function(){ runScene(c, e, lines, q); }, "第" + (c + 1) + "章 第" + (e + 1) + "話", true);
  }
  function runScene(c, e, lines, q){
    playBgm("bgm_story");
    var ch = S.CH[c], i = 0;
    app.innerHTML = '<section class="stage" style="' + bgStyle(c) + '"><div class="shade"></div><button class="btn sub skip" type="button" id="skipBtn">▶ 先へ</button>' +
      '<img class="portrait" id="por" alt="" style="opacity:0"><div id="below"></div></section>';
    var por = app.querySelector("#por"), below = app.querySelector("#below");
    por.onerror = function(){ por.style.display = "none"; };
    function show(){
      var ln = lines[i];
      por.style.display = ""; 
      if(ln[0] && CAST[ln[0]]){ por.src = IMG + CAST[ln[0]].img; por.style.opacity = 1; } else por.style.opacity = 0;
      below.innerHTML = '<div class="msgbox" id="mb" tabindex="0">' + (ln[0] ? '<span class="who">' + esc(ln[0]) + '</span>' : "") + '<p>' + esc(ln[1]) + '</p><span class="next">▼</span></div>';
      below.firstChild.onclick = adv;
    }
    function adv(){ i++; if(i < lines.length) show(); else choose(); }
    function choose(){
      por.src = IMG + CAST["相田"].img; por.style.opacity = 1;
      var three = c >= 4;
      below.innerHTML = '<div class="msgbox"><span class="who">相田</span><p>' + esc(q.q) + (three ? "\n（「わからない」も選べるよ）" : "") + '</p></div><div class="choices"></div>';
      var box = below.querySelector(".choices");
      [["はい", "yes"], ["いいえ", "no"]].concat(three ? [["わからない", "unk"]] : []).forEach(function(o){
        var b = document.createElement("button"); b.className = "btn" + (o[1] === "unk" ? " sub" : ""); b.type = "button"; b.textContent = o[0];
        b.onclick = function(){ pick(o[1]); }; box.appendChild(b);
      });
    }
    function pick(k){
      var r = k === "yes" ? q.yes : k === "no" ? q.no : S.UNK;
      var tag = k === "unk" ? "…" : (r.d > 0 ? "（状況がややこしくなった…）" : r.d < 0 ? "（手がかりが集まりやすくなった！）" : "");
      below.innerHTML = '<div class="msgbox"><span class="who">勝</span><p>' + esc(r.r + tag) + '</p><span class="next">▼</span></div>';
      below.firstChild.onclick = function(){ startPuzzle(c, e, k, r); };
    }
    document.getElementById("skipBtn").onclick = function(){ i = lines.length; choose(); };
    show();
  }

  // ---------- パズル ----------
  var P = null; // いまの事件
  function dur(mins){ return mins % 60 === 0 ? (mins / 60) + "時間" : mins + "分"; }
  function startPuzzle(c, e, choice, res){
    var ch = S.CH[c], n = ch.n, cd = window.SuiriCast[c];
    var m = (c >= 2 && c <= 6) ? 3 : 2;           // 第3〜7章は「人＋3つの項目」の大きな表
    var base = BASE[save.diff] || 2;
    var cap = c === 0 ? 2 : c === 1 ? 3 : 4;
    var lvl = Math.max(0, Math.min(cap, base + res.d));
    var ci = choice === "yes" ? 0 : choice === "no" ? 1 : 2;
    var seed = (c + 1) * 100003 + (e + 1) * 1009 + ci * 7919 + lvl * 104729;
    var pz = G.makePuzzle(n, lvl, seed, m);
    var rr = G.rng((c + 1) * 777 + (e + 1) * 31);
    var cs = pickCast(c, e);
    var roleOf = {}; cd.cast.forEach(function(x){ roleOf[x[0]] = {r: x[1], s: x[2]}; });
    var people = G.shuffle(rr, cs.all.map(function(x){ return x[0]; }));
    var attrs = [];
    // 項目0：いつ／順番（順番のある項目）
    var useOrder = (e % 3) === 2, a0;
    if(useOrder){
      var ord = []; for(var oi = 1; oi <= 10; oi++) ord.push(oi + "番目");
      attrs.push({label: "事情を聞かれた順番", kind: "order", act: {pos: "事情を聞かれた", neg: "事情を聞かれなかった"}, vals: ord.slice(0, n), gap: function(d){ return d + "人ぶん"; }, adj: "前後すぐ（1つちがい）の順番に"});
    } else {
      a0 = Math.floor(rr() * (ch.A.length - n + 1));
      attrs.push({label: ch.Alabel, kind: "time", act: ch.act, vals: ch.A.slice(a0, a0 + n), gap: function(d){ return dur(d * ch.step); }, adj: "前後すぐ（" + dur(ch.step) + "ちがい）の時間に"});
    }
    // 項目1・2：好きなもの（章ごとの3つの種類から、話ごとにえらぶ）
    var TH = [[ch.Blabel, ch.B]].concat(cd.themes), bt = (c + e) % 3;
    for(var j = 0; j < m - 1; j++){
      var th = TH[(bt + j) % 3];
      attrs.push({label: th[0], kind: "like", noun: th[0].replace(/^好きな/, ""), vals: G.shuffle(rr, th[1]).slice(0, n)});
    }
    P = {c: c, e: e, n: n, m: m, pz: pz, lvl: lvl, people: people, attrs: attrs, ch: ch, roleOf: roleOf, feat: cs.feat, mode: "chk", mist: 0, hints: 0, choice: choice, res: res, cat: null};
    // 表のなかみ：カテゴリ0=人、1..m=項目。マス＝[行カテゴリ][列カテゴリ][行][列]
    P.cat = [{name: "人", items: people}].concat(attrs.map(function(x){ return {name: x.label, items: x.vals}; }));
    P.marks = {};
    for(var R = 0; R <= m; R++) for(var C = 1; C <= m; C++) if(R === 0 || C < R){
      var grid = []; for(var i = 0; i < n; i++){ grid[i] = []; for(var k = 0; k < n; k++) grid[i][k] = {m: 0, d: 0}; }
      P.marks[R + "_" + C] = grid;
    }
    P.inv = pz.sol.S.map(function(arr){ var iv = []; arr.forEach(function(v, p){ iv[v] = p; }); return iv; });
    P.lines = makeLines(P, rr, res);
    go(screenPuzzle, "第" + (c + 1) + "章 第" + (e + 1) + "話", false);
  }

  var VOICE = {
    verb: {"相田": ["よ。", "って言ってたよ。", "みたいだよ。"], "勝": ["。", "らしい。", "ようだ。"], "guest": ["はずです。", "と思います。", "と記憶しています。"]},
    adj: {"相田": ["だよ。", "らしいよ。", "なんだって。"], "勝": ["だ。", "らしい。", "なようだ。"], "guest": ["です。", "だったと思います。", "だと聞きました。"]}
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
    function nm(p){ return who && who.guest === p ? "私" : N[p]; }
    switch(c.t){
      case "eq": var e1 = pred(P, c.k, c.v); return [nm(c.p) + "は、" + e1[0], e1[1]];
      case "multi": var parts = c.ks.map(function(k, i){ return [k, c.vs[i]]; }), last = parts.pop(), pl = pred(P, last[0], last[1]);
        return [nm(c.p) + "は、" + parts.map(function(x){ return teForm(P, x[0], x[1]); }).join("、") + "、" + pl[0], pl[1]];
      case "neq": var n1 = pred(P, c.k, c.v, true); return [nm(c.p) + "は、" + n1[0], n1[1]];
      case "either": var at = P.attrs[c.k];
        return at.kind === "like" ? [nm(c.p) + "が好きな" + at.noun + "は、" + at.vals[c.v] + "か" + at.vals[c.w] + "のどちらか", "adj"] : [nm(c.p) + "は、" + at.vals[c.v] + "か" + at.vals[c.w] + "のどちらかに" + at.act.pos, "verb"];
      case "link": var f = pred(P, c.k1, c.a), g = pred(P, c.k2, c.b);
        return [f[0].replace(/好き$/, "好きな").replace(/た$/, "た") + "人は、" + g[0], g[1]];
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
      if(x < 0.42) speaker = "相田"; else if(x < 0.67) speaker = "勝"; else {
        guestIdx = Math.floor(rr() * P.n); speaker = P.people[guestIdx];
        if(inv.length === 2 && inv.indexOf(guestIdx) >= 0){ guestIdx = -1; speaker = rr() < .5 ? "相田" : "勝"; }
      }
      var t = clueText(P, c, guestIdx >= 0 ? {guest: guestIdx} : null);
      var vkey = speaker === "相田" ? "相田" : speaker === "勝" ? "勝" : "guest";
      var ends = VOICE[t[1]][vkey], endTxt = ends[Math.floor(rr() * ends.length)];
      var isG = guestIdx >= 0, rl = isG ? P.roleOf[speaker] : null;
      var pre = isG && rl && rr() < 0.45 ? rl.s : "";
      out.push({who: speaker, role: rl ? rl.r : "", gi: guestIdx, text: pre + t[0] + endTxt, noise: false});
    });
    var nn = [1, 1, 2, 3, 4][P.lvl] + (res.noise || 0);
    var pool = G.shuffle(rr, S.NOISE);
    var tv = P.attrs[0].vals, bv = P.attrs[1].vals;
    for(var i = 0; i < nn; i++){
      var tx = pool[i % pool.length].replace("{t}", tv[Math.floor(rr() * P.n)]).replace("{b}", bv[Math.floor(rr() * P.n)]);
      out.splice(Math.floor(rr() * (out.length + 1)), 0, {who: "島田", role: "", gi: -1, text: tx, noise: true});
    }
    return out;
  }

  // マトリックス表（画像のような L 字の表）。行グループ=[0, m, m-1, …, 2]、列グループ=[1..m]
  function matrixHtml(){
    var m = P.m, n = P.n, rows = [0], cols = [], R, C;
    for(R = m; R >= 2; R--) rows.push(R);
    for(C = 1; C <= m; C++) cols.push(C);
    var h = '<table class="g mx"><thead><tr><th class="corner" colspan="2" rowspan="2"></th>';
    cols.forEach(function(C){ h += '<th class="grp" colspan="' + n + '">' + esc(P.cat[C].name) + '</th>'; });
    h += '</tr><tr>';
    cols.forEach(function(C){ P.cat[C].items.forEach(function(v, i){ h += '<th class="vh' + (i === 0 ? " gs" : "") + '"><span>' + esc(v) + '</span></th>'; }); });
    h += '</tr></thead><tbody>';
    rows.forEach(function(R){
      for(var i = 0; i < n; i++){
        h += '<tr' + (i === 0 ? ' class="gsr"' : '') + '>';
        if(i === 0) h += '<th class="rg" rowspan="' + n + '"><span>' + esc(R === 0 ? "人" : P.cat[R].name) + '</span></th>';
        h += '<th class="rh">' + esc(P.cat[R].items[i]) + '</th>';
        cols.forEach(function(C){
          for(var j = 0; j < n; j++){
            if(R === 0 || C < R) h += '<td' + (j === 0 ? ' class="gs"' : '') + '><button type="button" class="cl" data-r="' + R + '" data-c="' + C + '" data-i="' + i + '" data-j="' + j + '" aria-label="' + esc(P.cat[R].items[i] + " × " + P.cat[C].items[j]) + '"></button></td>';
            else h += '<td class="void' + (j === 0 ? " gs" : "") + '"></td>';
          }
        });
        h += '</tr>';
      }
    });
    return h + '</tbody></table>';
  }

  function screenPuzzle(){
    inGame = true; btnBack.style.visibility = "visible";
    playBgm(P.lvl >= 3 ? "bgm_puzzle_hard" : P.lvl >= 1 ? "bgm_puzzle_normal" : "bgm_puzzle_easy");
    var n = P.n;
    var h = '<div class="pz"><div class="cluecol"><div class="panel"><div class="badges"><span class="chip">第' + (P.c + 1) + '章 第' + (P.e + 1) + '話</span><span class="chip">表 ' + n + '×' + n + '（人＋' + P.m + '項目）</span><span class="chip">難しさ：' + LEVELNAME[P.lvl] + '</span></div>' +
      '<h3>みんなの話</h3><div class="log">';
    P.lines.forEach(function(l){
      h += '<div class="line' + (l.noise ? " noise" : "") + '">' + avHtml(l.who, l.gi >= 0 ? l.gi : 0) + '<div class="bub"><b>' + esc(l.who) + (l.role ? "（" + esc(l.role) + "）" : "") + '</b>' + esc(l.text) + '</div></div>';
    });
    h += '</div><p class="note">※ 話の中には、事件と関係のないものもまじっているよ。手がかりだけで、答えは必ず1つに決まるよ。</p></div></div>';
    h += '<div class="tabcol"><div class="panel"><div class="tools"><div class="mode"><button type="button" data-mode="chk" class="on">○ × をつける</button><button type="button" data-mode="dr">✎ 下書き</button></div>' +
      '<button class="btn sub" type="button" id="bClearDr">下書きを消す</button><button class="btn sub" type="button" id="bHint">ヒント</button></div>' +
      '<p class="note" id="modeNote">マスをタップするたびに ○ → × → なし と変わるよ。迷ったら「✎ 下書き」で2つ以上に印をつけてもOK（答える前に1つにしてね）。</p>' +
      '<p class="note">表の見かた：いちばん上の段が「人 × 各項目」。その下の段は「項目どうし」の表で、考えるときのメモに使えるよ。答えるときに見るのは、いちばん上の段（人の行）だけ。</p></div>' +
      '<div class="panel"><div class="tblwrap">' + matrixHtml() + '</div></div>';
    h += '<div class="panel"><div class="tools"><button class="btn big" type="button" id="bAns">答える</button><button class="btn sub" type="button" id="bReset">ぜんぶ消す</button></div>' +
      '<p class="note">答える前に：「人」の行で、1人に ○ は1つだけ、同じ列にも ○ は1つだけ。下書き（✎）が残っていると答えられないよ。</p></div></div></div>';
    app.innerHTML = h;
    app.querySelectorAll(".mode button").forEach(function(b){ b.onclick = function(){ P.mode = b.dataset.mode; app.querySelectorAll(".mode button").forEach(function(x){ x.classList.toggle("on", x === b); });
      document.getElementById("modeNote").textContent = P.mode === "dr" ? "下書きモード：タップで ✎ をつけ外し。1行に何個でもつけられるよ。答えるときは、必ず1つにしてね。" : "マスをタップするたびに ○ → × → なし と変わるよ。"; }; });
    app.addEventListener("click", cellClick);
    document.getElementById("bClearDr").onclick = function(){ eachCell(function(r, c, i, j, x){ x.d = 0; }); paint(); toast("下書きを全部消したよ"); };
    document.getElementById("bReset").onclick = function(){ if(confirm("表をぜんぶ消す？")){ eachCell(function(r, c, i, j, x){ x.m = 0; x.d = 0; }); paint(); } };
    document.getElementById("bHint").onclick = hint;
    document.getElementById("bAns").onclick = answer;
    paint();
  }
  function eachCell(f){ for(var key in P.marks){ var rc = key.split("_"), g = P.marks[key]; for(var i = 0; i < P.n; i++) for(var j = 0; j < P.n; j++) f(+rc[0], +rc[1], i, j, g[i][j]); } }
  function mk(b){ return P.marks[b.dataset.r + "_" + b.dataset.c][+b.dataset.i][+b.dataset.j]; }
  function cellClick(ev){
    var b = ev.target.closest && ev.target.closest(".cl"); if(!b || !P) return;
    var x = mk(b);
    if(P.mode === "dr") x.d = x.d ? 0 : 1; else x.m = (x.m + 1) % 3;
    paintCell(b, x);
  }
  function paintCell(b, x){ b.className = "cl" + (x.m === 1 ? " m1" : x.m === 2 ? " m2" : "") + (x.d ? " dr" : ""); b.textContent = x.m === 1 ? "○" : x.m === 2 ? "×" : ""; }
  function paint(){ app.querySelectorAll(".cl").forEach(function(b){ paintCell(b, mk(b)); }); }
  // 人(行)に対する項目 C(=1..m) の正しい列
  function truth(C, p){ return P.pz.sol.S[C - 1][p]; }
  function hint(){
    var cand = [];
    for(var C = 1; C <= P.m; C++) for(var p = 0; p < P.n; p++) if(P.marks["0_" + C][p][truth(C, p)].m !== 1) cand.push([C, p]);
    if(!cand.length){ toast("人の行は、ぜんぶ ○ が入っているよ！"); return; }
    var x = cand[Math.floor(Math.random() * cand.length)], C2 = x[0], p2 = x[1], tv = truth(C2, p2);
    for(var v = 0; v < P.n; v++){ var cc = P.marks["0_" + C2][p2][v]; cc.d = 0; cc.m = v === tv ? 1 : (cc.m === 1 ? 0 : cc.m); }
    P.hints++; paint();
    toast("ヒント：" + P.people[p2] + "さんの「" + P.cat[C2].name + "」は " + P.cat[C2].items[tv] + " だよ（○を入れたよ）");
  }
  function answer(){
    var n = P.n, dr = 0;
    eachCell(function(r, c, i, j, x){ if(x.d) dr++; });
    if(dr){ modal("<p>✎ 下書きが " + dr + " か所のこっているよ。\n答えるときは、選択肢を1つにしてください。\n（下書きを外して、○ か × にしてね）</p>", [{t: "もどる", cls: "sub"}, {t: "下書きを全部消す", f: function(){ eachCell(function(r, c, i, j, x){ x.d = 0; }); paint(); }}]); return; }
    for(var C = 1; C <= P.m; C++){
      var g = P.marks["0_" + C], colCnt = []; for(var v0 = 0; v0 < n; v0++) colCnt[v0] = 0;
      for(var p = 0; p < n; p++){
        var cnt = 0; for(var v = 0; v < n; v++) if(g[p][v].m === 1){ cnt++; colCnt[v]++; }
        if(cnt !== 1){ toast("「" + P.cat[C].name + "」で、" + P.people[p] + "さんの ○ が " + (cnt ? "多すぎるよ" : "まだないよ") + "。1人に ○ は1つだけ！"); return; }
      }
      for(var v1 = 0; v1 < n; v1++) if(colCnt[v1] !== 1){ toast("「" + P.cat[C].name + "」で、「" + P.cat[C].items[v1] + "」の列の ○ が " + (colCnt[v1] ? "多すぎるよ" : "ないよ") + "。同じ列にも ○ は1つだけ！"); return; }
    }
    var wrong = 0;
    for(var C2 = 1; C2 <= P.m; C2++) for(var p2 = 0; p2 < n; p2++) if(P.marks["0_" + C2][p2][truth(C2, p2)].m !== 1) wrong++;
    if(wrong){ P.mist++; modal("<p>うーん…まちがいが " + wrong + " か所あるみたい。\n手がかりを、もう一度見なおしてみよう！</p>", [{t: "つづける"}]); return; }
    app.removeEventListener("click", cellClick);
    luck();
  }

  // ---------- 運試し（4択・1問だけ） ----------
  function luck(){
    var names = G.shuffle(Math.random, P.people.map(function(_, i){ return i; })).slice(0, 4);
    var culprit = names[Math.floor(Math.random() * 4)];
    app.innerHTML = '<section class="panel" style="text-align:center;padding:18px"><div class="big-star">🎲</div><h2>運試しクイズ！</h2><p>表は完成！ …さて、おまけの1問。\nこの事件の「いちばん怪しいと思う人」は、ヒントなしの<b>運だめし</b>だよ。\n4人のうち、だれ？</p><div class="choices" id="lk" style="margin:12px 0"></div><p class="note">あたってもはずれても、事件は解決。当たると★ボーナス！</p></section>';
    var box = document.getElementById("lk"); box.className = "tools"; box.style.justifyContent = "center";
    names.forEach(function(p){ var b = document.createElement("button"); b.className = "btn"; b.textContent = P.people[p]; b.onclick = function(){ finish(p === culprit, P.people[culprit]); }; box.appendChild(b); });
  }

  function finish(lucky, culpritName){
    var stars = P.hints ? 1 : (P.mist <= 1 ? 3 : 2);
    var prev = save.cleared[ck(P.c, P.e)];
    if(!prev || (prev.s || 0) < stars) save.cleared[ck(P.c, P.e)] = {s: stars, l: lucky ? 1 : (prev && prev.l) || 0};
    persist(); inGame = false;
    playBgm(P.c === 9 && P.e === 9 ? "bgm_final" : "bgm_result");
    var end = S.ENDINGS[(P.c + P.e) % S.ENDINGS.length], extra = S.ENDINGS[(P.c * 2 + P.e + 1) % S.ENDINGS.length];
    var last = P.e === 9, allDone = P.c === 9 && P.e === 9;
    var more = last ? (allDone ? "これで、すべての事件が解決だよ。ここまで本当にありがとう！" : "第" + (P.c + 2) + "章が開いたよ！") : "次の話が開いたよ。";
    app.innerHTML = '<section class="panel" style="text-align:center;padding:18px"><h2>事件解決！</h2><div class="big-star">' + "★".repeat(stars) + "☆".repeat(3 - stars) + (lucky ? " ✨" : "") + '</div>' +
      '<p>' + (lucky ? "運試し：大当たり！ ✨ ボーナスだよ。" : "運試し：はずれ！ おしい！") + '</p>' +
      '<p class="note" style="font-size:14px;color:var(--ink)">真犯人は <b>' + esc(culpritName) + '（' + esc((P.roleOf[culpritName] || {}).r || "") + '）</b>…\n「' + esc(window.SuiriCast[P.c].motives[P.e]) + '」</p>' +
      '<div class="log" style="text-align:left;max-width:540px;margin:10px auto">' +
      [end, extra, ["相田", more]].map(function(l){ return '<div class="line">' + avHtml(l[0], 0) + '<div class="bub"><b>' + esc(l[0]) + '</b>' + esc(l[1]) + '</div></div>'; }).join("") + '</div>' +
      '<p class="note">まちがい ' + P.mist + ' 回／ヒント ' + P.hints + ' 回　（★3＝ヒントなし＋まちがい1回まで）</p>' +
      '<div class="tools" style="justify-content:center"><button class="btn" id="bNext" type="button">' + (last ? "章えらびへ" : "次の話へ") + '</button><button class="btn sub" id="bEps" type="button">話えらびへ</button></div></section>';
    var c = P.c, e = P.e;
    document.getElementById("bNext").onclick = function(){ stack = []; cur = null; if(last) go(screenChapters, "章をえらぶ", false); else { go(function(){ screenEpisodes(c); }, "第" + (c + 1) + "章", false); startEpisode(c, e + 1); } };
    document.getElementById("bEps").onclick = function(){ stack = []; cur = null; go(screenChapters, "章をえらぶ", false); go(function(){ screenEpisodes(c); }, "第" + (c + 1) + "章"); };
  }

  window.__g6 = {get P(){ return P; }};
  go(screenTitle, "推理ゲーム2", false);
})();
