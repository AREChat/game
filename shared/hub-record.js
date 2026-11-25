"use strict";
// ============================================================================
// AREHubRecord — ゲーム入口（ハブ・ジャンルページ）の「📊 あなたの記録」パネル
//
//   ・あそんだ回数・日づけ（JavaScript）
//   ・あそぶ時間帯・曜日・さいきんの調子 …… Java（TeaVM で JS にした shared/java-stats/dist/stats-analyzer.js）
//   ・ジャンル別の進みぐあい・バッジ・れんぞく日数・つぎのおすすめ …… C#（Blazor WebAssembly の AchievementsEngine.Report）
//
// C# の実行環境は数MBあるので、パネルを ひらいた人が「見る」を押したときだけ 読みこむ（いちど押すと、つぎからは 自動）。
// 計算の本体は別言語（Java・C#）。ここは 呼び出しと 4か国語の 画面表示だけ。ことばは are_lang（ja/en/zh/ko）。
// この端末のブラウザだけに あるデータを つかい、外へは 送らない。
// ============================================================================
(function(){
  if(window.AREHubRecord) return;
  var G = window.AREGames;
  if(!G) return;
  var SRC = "";
  try{ SRC = (document.currentScript && document.currentScript.src) || ""; }catch(_e){}
  var BASE = SRC ? SRC.replace(/[^\/]*$/, "") : "./shared/";
  var JAVA_SRC = BASE + "java-stats/dist/stats-analyzer.js";
  var CS_FRAME = BASE + "csharp-achievements/dist/index.html";
  var CONSENT_KEY = "are_hub_cs";

  // ---- 画面のことば（4か国語） ----
  var TX = {
    title: {ja: "📊 あなたの記録", en: "📊 Your record", zh: "📊 你的记录", ko: "📊 나의 기록"},
    close: {ja: "とじる", en: "Close", zh: "关闭", ko: "닫기"},
    only: {ja: "この端末のブラウザにだけ ある記録です（外へは送りません）。", en: "This record lives only in this device's browser (nothing is sent anywhere).", zh: "这些记录只保存在这台设备的浏览器中（不会发送到外部）。", ko: "이 기기의 브라우저에만 있는 기록이에요(밖으로 보내지 않아요)."},
    empty: {ja: "まだ記録がありません。ゲームをあそぶと、ここに出ます。", en: "No record yet. It will appear here once you play.", zh: "还没有记录。玩过游戏之后会显示在这里。", ko: "아직 기록이 없어요. 게임을 플레이하면 여기에 나와요."},
    habitsH: {ja: "あそぶ時間帯", en: "When you play", zh: "游戏时段", ko: "플레이 시간대"},
    habitsNone: {ja: "時間帯の記録は、これからあそぶと たまっていきます。", en: "Time-of-day records build up as you play from now on.", zh: "时段记录会随着之后的游戏逐渐积累。", ko: "시간대 기록은 앞으로 플레이하면서 쌓여요."},
    habitsPeak: {ja: "いちばん多いのは「{band}」（{h}\u2060時ごろ）です。", en: "You play most in the {band} (around {h}:00).", zh: "你最常在「{band}」玩（{h}\u2060点前后）。", ko: "가장 많은 때는 「{band}」({h}\u2060시쯤)예요."},
    weekend: {ja: "土日の割合：{p}%", en: "Weekend share: {p}%", zh: "周末占比：{p}%", ko: "주말 비율: {p}%"},
    peakDay: {ja: "いちばん多い曜日：{d}", en: "Busiest day: {d}", zh: "最常玩的星期：{d}", ko: "가장 많은 요일: {d}"},
    trend: {ja: "さいきん（14日）：{t}", en: "Lately (14 days): {t}", zh: "最近（14天）：{t}", ko: "최근(14일): {t}"},
    trendUp: {ja: "だんだん増えています", en: "playing more and more", zh: "越来越多", ko: "점점 늘고 있어요"},
    trendDown: {ja: "すこし減っています", en: "playing a little less", zh: "稍有减少", ko: "조금 줄었어요"},
    trendFlat: {ja: "いつもどおりです", en: "about the same as usual", zh: "和平时差不多", ko: "평소와 비슷해요"},
    band_morning: {ja: "朝（5〜10時）", en: "morning (5-10)", zh: "早晨（5-10点）", ko: "아침(5~10시)"},
    band_day: {ja: "昼（11〜16時）", en: "daytime (11-16)", zh: "白天（11-16点）", ko: "낮(11~16시)"},
    band_evening: {ja: "夕方〜夜（17〜21時）", en: "evening (17-21)", zh: "傍晚到晚上（17-21点）", ko: "저녁(17~21시)"},
    band_night: {ja: "夜ふかし（22〜4時）", en: "late night (22-4)", zh: "深夜（22-4点）", ko: "밤늦게(22~4시)"},
    days: {ja: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], zh: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"], ko: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]},
    csH: {ja: "ジャンル・バッジ・つぎのおすすめ", en: "Genres, badges & what to play next", zh: "类型、徽章与下一个推荐", ko: "장르·배지·다음 추천"},
    csBtn: {ja: "見る（初回だけ 数MB 読みこみ）", en: "Show (downloads a few MB the first time)", zh: "查看（首次需下载几MB）", ko: "보기(처음 한 번 수 MB 내려받아요)"},
    csNote: {ja: "計算用のプログラム（C#）を読みこみます。いちど見ると、つぎからは 自動で出ます。", en: "This loads the calculation program (C#). After the first time it appears automatically.", zh: "将加载计算程序（C#）。看过一次之后，下次会自动显示。", ko: "계산용 프로그램(C#)을 불러와요. 한 번 보면 다음부터는 자동으로 나와요."},
    csLoading: {ja: "読みこみ中…", en: "Loading…", zh: "加载中…", ko: "불러오는 중…"},
    csFail: {ja: "読みこめませんでした。ネットにつながっているときに もう一度ためしてください。", en: "Could not load it. Please try again while you are online.", zh: "加载失败。请在联网时重试。", ko: "불러오지 못했어요. 인터넷에 연결된 상태에서 다시 시도해 주세요."},
    csRetry: {ja: "もう一度", en: "Try again", zh: "重试", ko: "다시 시도"},
    tried: {ja: "あそんだゲーム {a} / {b}本（{p}%）", en: "Games played: {a} / {b} ({p}%)", zh: "玩过的游戏：{a} / {b}个（{p}%）", ko: "플레이한 게임: {a} / {b}개({p}%)"},
    genresH: {ja: "ジャンルごと", en: "By genre", zh: "按类型", ko: "장르별"},
    streakH: {ja: "れんぞく", en: "Streak", zh: "连续天数", ko: "연속"},
    streakNow: {ja: "いま {n}日 れんぞく", en: "{n}-day streak now", zh: "目前连续 {n} 天", ko: "지금 {n}일 연속"},
    streakBest: {ja: "さいこう {n}日", en: "best {n} days", zh: "最长 {n} 天", ko: "최고 {n}일"},
    streakDays: {ja: "あそんだ日 {n}日（さいきん90日）", en: "{n} days played (last 90 days)", zh: "玩过的天数 {n} 天（最近90天）", ko: "플레이한 날 {n}일(최근 90일)"},
    badgesH: {ja: "バッジ", en: "Badges", zh: "徽章", ko: "배지"},
    nextH: {ja: "つぎのおすすめ", en: "Play next", zh: "下一个推荐", ko: "다음 추천"},
    next_start: {ja: "まずは ここから", en: "A good place to start", zh: "先从这里开始", ko: "먼저 여기서 시작해요"},
    next_sameGenre: {ja: "好きなジャンルの、まだあそんでいないゲーム", en: "Not played yet, in the genre you play most", zh: "你最常玩的类型里，还没玩过的游戏", ko: "가장 많이 하는 장르의 아직 안 한 게임"},
    next_newGenre: {ja: "まだあそんでいないジャンルです", en: "A genre you have not tried yet", zh: "还没尝试过的类型", ko: "아직 해 보지 않은 장르예요"},
    next_unplayed: {ja: "まだあそんでいないゲーム", en: "A game you have not played yet", zh: "还没玩过的游戏", ko: "아직 안 해 본 게임"},
    next_leastPlayed: {ja: "あそんだ回数が いちばん少ないゲーム", en: "The game you have played the least", zh: "玩得最少的游戏", ko: "플레이 횟수가 가장 적은 게임"},
    nextNone: {ja: "おすすめできるゲームが ありません。", en: "Nothing to recommend right now.", zh: "暂时没有可推荐的游戏。", ko: "추천할 게임이 아직 없어요."},
    footer: {ja: "計算：Java（あそぶ時間帯）・C#（バッジ・おすすめ）", en: "Calculated with Java (play times) and C# (badges, picks)", zh: "计算：Java（游戏时段）、C#（徽章、推荐）", ko: "계산: Java(플레이 시간대)·C#(배지·추천)"},
    tier_bronze: {ja: "ブロンズ", en: "bronze", zh: "铜牌", ko: "브론즈"},
    tier_silver: {ja: "シルバー", en: "silver", zh: "银牌", ko: "실버"},
    tier_gold: {ja: "ゴールド", en: "gold", zh: "金牌", ko: "골드"},
    locked: {ja: "まだ", en: "locked", zh: "未获得", ko: "잠김"},
    got: {ja: "ゲット！", en: "Earned!", zh: "已获得！", ko: "획득!"}
  };
  var BADGES = {
    first: {i: "🌱", t: {ja: "はじめの一歩", en: "First step", zh: "第一步", ko: "첫걸음"}, d: {ja: "ゲームを 1回 あそぶ", en: "Play any game once", zh: "玩任意一个游戏一次", ko: "게임을 한 번 플레이해요"}},
    tried3: {i: "🎲", t: {ja: "3本あそんだ", en: "Three games", zh: "玩了3个", ko: "3개 플레이"}, d: {ja: "3本の ゲームを あそぶ", en: "Play 3 different games", zh: "玩3个不同的游戏", ko: "서로 다른 게임 3개를 플레이해요"}},
    triedAll: {i: "🏆", t: {ja: "ぜんぶ制覇", en: "Played them all", zh: "全部通玩", ko: "전부 정복"}, d: {ja: "ぜんぶの ゲームを あそぶ", en: "Play every game", zh: "玩遍所有游戏", ko: "모든 게임을 플레이해요"}},
    genres3: {i: "🧭", t: {ja: "3ジャンル", en: "Three genres", zh: "三种类型", ko: "3개 장르"}, d: {ja: "3つの ジャンルを あそぶ", en: "Try 3 different genres", zh: "尝试3种不同的类型", ko: "서로 다른 장르 3개를 해 봐요"}},
    genresAll: {i: "🌈", t: {ja: "ジャンルコンプリート", en: "Every genre", zh: "类型全收集", ko: "장르 컴플리트"}, d: {ja: "ぜんぶの ジャンルを あそぶ", en: "Try every genre", zh: "尝试所有类型", ko: "모든 장르를 해 봐요"}},
    fan10: {i: "💖", t: {ja: "おきにいり", en: "Favourite", zh: "最爱", ko: "단골"}, d: {ja: "1本の ゲームを 10回 あそぶ", en: "Play one game 10 times", zh: "同一个游戏玩10次", ko: "한 게임을 10번 플레이해요"}},
    master: {i: "🎖", t: {ja: "ジャンルマスター", en: "Genre master", zh: "类型大师", ko: "장르 마스터"}, d: {ja: "ひとつの ジャンルを ぜんぶ あそぶ", en: "Play every game in one genre", zh: "玩遍一个类型里的全部游戏", ko: "한 장르의 게임을 전부 플레이해요"}},
    streak3: {i: "🔥", t: {ja: "3日れんぞく", en: "3-day streak", zh: "连续3天", ko: "3일 연속"}, d: {ja: "3日 つづけて あそぶ", en: "Play 3 days in a row", zh: "连续3天游玩", ko: "3일 연속으로 플레이해요"}},
    streak7: {i: "⚡", t: {ja: "7日れんぞく", en: "7-day streak", zh: "连续7天", ko: "7일 연속"}, d: {ja: "7日 つづけて あそぶ", en: "Play 7 days in a row", zh: "连续7天游玩", ko: "7일 연속으로 플레이해요"}},
    days7: {i: "📅", t: {ja: "7日あそんだ", en: "Seven days", zh: "玩了7天", ko: "7일 플레이"}, d: {ja: "ちがう日に 7日 あそぶ", en: "Play on 7 different days", zh: "在7个不同的日子游玩", ko: "서로 다른 날 7일을 플레이해요"}}
  };
  var TIER_ICON = {bronze: "🥉", silver: "🥈", gold: "🥇"};

  function L(){ return G.lang(); }
  function tx(k, vars){
    var o = TX[k], l = L(), s = o ? (o[l] != null && o[l] !== "" ? o[l] : o.ja) : k;
    if(typeof s !== "string") return s;
    if(vars) for(var key in vars) s = s.split("{" + key + "}").join(String(vars[key]));
    return s;
  }
  function e(s){ return G.esc(s); }
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(_e){ return null; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(_e){} }

  // ---- Java（TeaVM）と C#（Blazor WASM）の呼び出し ----
  var javaP = null, csP = null, csFrame = null, csId = 0, csPending = {}, csListener = null;
  function loadJava(){
    if(javaP) return javaP;
    javaP = new Promise(function(resolve, reject){
      if(typeof window.habits === "function" && typeof window.analyze === "function"){ resolve(); return; }
      var s = document.createElement("script");
      s.src = JAVA_SRC; s.async = true;
      s.onload = function(){ (typeof window.habits === "function" && typeof window.analyze === "function") ? resolve() : reject(new Error("java: habits() not found")); };
      s.onerror = function(){ reject(new Error("java: load failed")); };
      document.head.appendChild(s);
    }).catch(function(err){ javaP = null; throw err; });
    return javaP;
  }
  function loadCs(){
    if(csP) return csP;
    csP = new Promise(function(resolve, reject){
      var frame = document.createElement("iframe");
      frame.style.display = "none"; frame.setAttribute("aria-hidden", "true"); frame.tabIndex = -1;
      frame.src = CS_FRAME;
      csFrame = frame;
      var timer = setTimeout(function(){ cleanup(); reject(new Error("csharp: timeout")); }, Math.max(500, opts.csTimeout || 45000)); // csTimeout：テスト用
      function cleanup(){
        clearTimeout(timer);
        if(csListener){ window.removeEventListener("message", csListener); csListener = null; }
        if(frame.parentNode) frame.parentNode.removeChild(frame);
        csFrame = null;
      }
      csListener = function(ev){
        var m = ev.data;
        if(!m || !m.arefp) return;
        if(m.type === "ready" && ev.source === frame.contentWindow){ clearTimeout(timer); resolve(frame.contentWindow); }
        else if(m.type === "result"){
          var p = csPending[m.id];
          if(p){ delete csPending[m.id]; if(m.error) p.reject(new Error(m.error)); else p.resolve(m.result); }
        }
      };
      window.addEventListener("message", csListener);
      frame.addEventListener("error", function(){ cleanup(); reject(new Error("csharp: frame error")); });
      document.body.appendChild(frame);
    }).catch(function(err){ csP = null; throw err; });
    return csP;
  }
  function callCs(method, a, b, c){
    return loadCs().then(function(win){
      return new Promise(function(resolve, reject){
        var id = ++csId;
        csPending[id] = {resolve: resolve, reject: reject};
        setTimeout(function(){ if(csPending[id]){ delete csPending[id]; reject(new Error("csharp: call timeout")); } }, 20000);
        win.postMessage({arefp: true, type: "call", id: id, method: method, a: a, b: b, c: c}, "*");
      });
    });
  }

  // ---- データの 用意 ----
  function registryForCs(){
    var games = [];
    G.genres.forEach(function(gn){ G.ofGenre(gn.id).forEach(function(g){ games.push({id: g.id, genre: g.genre, adult: !!g.adult}); }); });
    return JSON.stringify({genres: G.genres.map(function(x){ return x.id; }), games: games});
  }
  function csv(a){ return a.join(","); }
  // さいきん14日の「1日ごとの回数」→ Java の analyze() の形（"回数:時刻;…"）。あそんだ日が3日未満なら 傾向は出さない
  function trendInput(log, now){
    var parts = [], active = 0;
    for(var i = 13; i >= 0; i--){
      var d = new Date(now); d.setDate(d.getDate() - i);
      var v = log.d[G.dayKey(d.getTime())];
      v = typeof v === "number" && isFinite(v) && v > 0 ? Math.min(Math.floor(v), 99999) : 0;
      if(v > 0) active++;
      parts.push(v + ":" + d.getTime());
    }
    return {wire: parts.join(";"), active: active};
  }
  function safeJson(s){ try{ var o = JSON.parse(s); return o && typeof o === "object" ? o : null; }catch(_e){ return null; } }

  // ---- 画面 ----
  var box = null, opener = null, onKey = null, onStorage = null, prevOverflow = "", opts = {}, st = null;

  function fmtDate(ms){
    var l = L();
    try{ return new Date(ms).toLocaleDateString(l === "zh" ? "zh-CN" : l === "ko" ? "ko-KR" : l === "en" ? "en-US" : "ja-JP", {year: "numeric", month: "short", day: "numeric"}); }catch(_e){ return G.dayKey(ms); }
  }
  function dayName(i){ var d = TX.days[L()] || TX.days.ja; return d[i] || ""; }
  function bar(p, cls){ return '<span class="hr-bar' + (cls ? ' ' + cls : '') + '"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></span>'; }

  function habitsHTML(){
    var h = st.habits;
    if(st.habitsErr) return '<p class="hr-none">' + e(tx("csFail")) + '</p>';
    if(!h) return '<p class="hr-none">' + e(tx("csLoading")) + '</p>';
    if(!h.total) return '<p class="hr-none">' + e(tx("habitsNone")) + '</p>';
    var order = ["morning", "day", "evening", "night"], max = 0;
    order.forEach(function(b){ if(h.bands[b] > max) max = h.bands[b]; });
    var out = '<p>' + e(tx("habitsPeak", {band: tx("band_" + h.band), h: h.peakHour})) + '</p><div class="hr-bands" role="list">';
    order.forEach(function(b){
      out += '<div class="hr-band' + (b === h.band ? ' top' : '') + '" role="listitem"><span>' + e(tx("band_" + b)) + '</span>' + bar(max ? 100 * h.bands[b] / max : 0) + '<b>' + h.bands[b] + '</b></div>';
    });
    out += '</div><p class="hr-sub">' + e(tx("weekend", {p: h.weekendShare})) + (h.peakWeekday >= 0 ? '　' + e(tx("peakDay", {d: dayName(h.peakWeekday)})) : '') + '</p>';
    if(st.trend) out += '<p class="hr-sub">' + e(tx("trend", {t: tx(st.trend === "improving" ? "trendUp" : st.trend === "declining" ? "trendDown" : "trendFlat")})) + '</p>';
    return out;
  }

  function csHTML(){
    if(st.cs === "idle"){
      return '<p class="hr-sub">' + e(tx("csNote")) + '</p><button type="button" class="hr-btn" id="hrLoadCs">' + e(tx("csBtn")) + '</button>';
    }
    if(st.cs === "loading") return '<p class="hr-none" role="status">' + e(tx("csLoading")) + '</p>';
    if(st.cs === "error") return '<p class="hr-none" role="alert">' + e(tx("csFail")) + '</p><button type="button" class="hr-btn" id="hrLoadCs">' + e(tx("csRetry")) + '</button>';
    var r = st.report, l = L(), out = "";
    out += '<p class="hr-big">' + e(tx("tried", {a: r.gamesTried, b: r.gamesTotal, p: r.percent})) + '</p>' + bar(r.percent, "wide");

    out += '<h3 class="hr-h3">' + e(tx("genresH")) + '</h3><ul class="hr-genres">';
    r.genres.forEach(function(row){
      var gn = G.genre(row.id);
      if(!gn || (row.total === 0 && row.plays === 0)) return;
      var href = (opts.prefix || "") + "genre/index.html?g=" + encodeURIComponent(row.id) + (opts.back ? "&back=" + encodeURIComponent(opts.back) : "");
      out += '<li><a href="' + e(href) + '"><span class="hr-gn">' + e(gn.emoji + " " + G.t(gn.name, l)) + '</span>' + bar(row.percent) +
        '<b>' + row.tried + ' / ' + row.total + '</b>' +
        (TIER_ICON[row.tier] ? '<span class="hr-tier" role="img" aria-label="' + e(tx("tier_" + row.tier)) + '">' + TIER_ICON[row.tier] + '</span>' : '<span class="hr-tier"></span>') + '</a></li>';
    });
    out += '</ul>';

    out += '<h3 class="hr-h3">' + e(tx("streakH")) + '</h3><p>' + e(tx("streakNow", {n: r.streak.current})) + '　<span class="hr-sub">' + e(tx("streakBest", {n: r.streak.best})) + '</span></p>' +
      '<p class="hr-sub">' + e(tx("streakDays", {n: r.streak.days})) + '</p>';

    out += '<h3 class="hr-h3">' + e(tx("badgesH")) + '</h3><ul class="hr-badges">';
    r.badges.forEach(function(b){
      var meta = BADGES[b.id]; if(!meta) return;
      var cur = Math.min(b.current, b.target);
      out += '<li class="' + (b.unlocked ? 'on' : 'off') + '" data-badge="' + e(b.id) + '"><span class="bi" aria-hidden="true">' + meta.i + '</span><span class="bt"><b>' + e(G.t(meta.t, l)) + '</b><small>' + e(G.t(meta.d, l)) + '</small></span>' +
        '<span class="bs">' + (b.unlocked ? e(tx("got")) : e(tx("locked")) + ' ' + cur + '/' + b.target) + '</span></li>';
    });
    out += '</ul>';

    out += '<h3 class="hr-h3">' + e(tx("nextH")) + '</h3>';
    var ng = r.next && r.next.id ? G.byId(r.next.id) : null;
    if(ng){
      out += '<a class="hr-next" id="hrNext" data-id="' + e(ng.id) + '" href="' + e(G.gameUrl(ng, opts.back, opts.prefix)) + '"' + (ng.ext ? ' rel="noopener"' : '') + '><span class="ico" aria-hidden="true">' + ng.emoji + '</span><span><small>' + e(tx("next_" + r.next.reason)) + '</small><b>' + e(G.t(ng.name, l)) + '</b></span><span class="go">' + e(G.ui("play")) + '</span></a>';
    }else{
      out += '<p class="hr-none">' + e(tx("nextNone")) + '</p>';
    }
    return out;
  }

  function render(){
    if(!box) return;
    var l = L(), log = st.log, total = 0, last = 0;
    Object.keys(log.g).forEach(function(id){ total += log.g[id].n; if(log.g[id].last > last) last = log.g[id].last; });
    var body;
    if(!total){
      body = '<p class="hr-none" id="hrEmpty">' + e(tx("empty")) + '</p>';
    }else{
      body = '<p class="hr-big" id="hrTotal">' + e(G.ui("recTotal", {n: total})) + '</p>' + (last ? '<p class="hr-sub">' + e(G.ui("recLastAt", {d: fmtDate(last)})) + '</p>' : '') +
        '<h3 class="hr-h3">' + e(tx("habitsH")) + '</h3><div id="hrHabits">' + habitsHTML() + '</div>' +
        '<h3 class="hr-h3 hr-csh">' + e(tx("csH")) + '</h3><div id="hrCs">' + csHTML() + '</div>';
    }
    var hadFocus = box.querySelector(".hr-panel") && document.activeElement && box.contains(document.activeElement) ? document.activeElement.id : "";
    box.innerHTML = '<div class="hr-panel" role="document" tabindex="-1"><div class="hr-head"><h2 id="hrTitle">' + e(tx("title")) + '</h2><button type="button" class="hr-x" id="hrClose" aria-label="' + e(tx("close")) + '">✕</button></div>' +
      '<div class="hr-body">' + body + '</div><p class="hr-foot">' + e(tx("only")) + '<br>' + e(tx("footer")) + '</p><button type="button" class="hr-btn hr-close2" id="hrClose2">' + e(tx("close")) + '</button></div>';
    box.setAttribute("aria-labelledby", "hrTitle");
    var f = hadFocus && document.getElementById(hadFocus);
    if(f) f.focus();
  }

  function startCs(remember){
    if(!st) return;
    st.cs = "loading"; render();
    var mine = st;
    var log = mine.log;
    callCs("Report", registryForCs(), JSON.stringify({g: log.g, d: log.d}), G.dayKey(Date.now())).then(function(res){
      if(st !== mine) return;
      var r = safeJson(res);
      if(!r || r.error || !Array.isArray(r.genres) || !Array.isArray(r.badges)) throw new Error("csharp: bad result");
      mine.report = r; mine.cs = "ready";
      if(remember) lsSet(CONSENT_KEY, "1");
      render();
    }).catch(function(){
      if(st !== mine) return;
      mine.cs = "error"; render();
    });
  }
  function startJava(){
    var mine = st, log = mine.log, now = Date.now();
    loadJava().then(function(){
      if(st !== mine) return;
      var h = safeJson(window.habits(csv(log.h), csv(log.w)));
      if(!h || typeof h.total !== "number") throw new Error("java: bad habits");
      mine.habits = h;
      var t = trendInput(log, now);
      if(t.active >= 3){
        var a = safeJson(window.analyze(t.wire, false));
        if(a && a.count >= 4 && /^(improving|declining|flat)$/.test(a.trend)) mine.trend = a.trend;
      }
      render();
    }).catch(function(){
      if(st !== mine) return;
      mine.habitsErr = true; render();
    });
  }

  function close(){
    if(!box) return;
    var b = box; box = null; st = null;
    if(b.parentNode) b.parentNode.removeChild(b);
    if(onKey){ window.removeEventListener("keydown", onKey, true); onKey = null; }
    if(onStorage){ window.removeEventListener("storage", onStorage); onStorage = null; }
    try{ document.body.style.overflow = prevOverflow; }catch(_e){}
    var o = opener; opener = null;
    try{ if(o && o.focus && document.contains(o)) o.focus(); }catch(_e){}
  }

  function open(o){
    if(box) return;
    opts = o || {};
    opener = document.activeElement;
    st = {log: G.readLog(), cs: lsGet(CONSENT_KEY) === "1" ? "loading" : "idle", habits: null, trend: "", habitsErr: false, report: null};
    box = document.createElement("div");
    box.id = "hrOverlay"; box.className = "hr-overlay";
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    box.addEventListener("click", function(ev){
      if(ev.target === box){ close(); return; }
      var t = ev.target.closest ? ev.target.closest("button, a") : null;
      if(!t) return;
      if(t.id === "hrClose" || t.id === "hrClose2"){ close(); return; }
      if(t.id === "hrLoadCs"){ startCs(true); return; }
      if(t.id === "hrNext"){ G.recordPlay(t.getAttribute("data-id")); return; }
    });
    document.body.appendChild(box);
    try{ prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }catch(_e){}
    // Esc でとじる／Tab は パネルの中だけで ぐるぐる（うしろの ゲーム一覧は うごかさない）
    onKey = function(ev){
      if(!box) return;
      if(ev.key === "Escape"){ ev.preventDefault(); ev.stopPropagation(); close(); return; }
      if(ev.key !== "Tab") return;
      var f = box.querySelectorAll("button, a[href]");
      if(!f.length) return;
      var first = f[0], lastEl = f[f.length - 1], cur = document.activeElement;
      if(!box.contains(cur)){ ev.preventDefault(); first.focus(); }
      else if(ev.shiftKey && cur === first){ ev.preventDefault(); lastEl.focus(); }
      else if(!ev.shiftKey && cur === lastEl){ ev.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey, true);
    // ほかのタブで ことば・記録が かわったら、ここも 更新
    onStorage = function(ev){
      if(!box || !st) return;
      if(ev.key === "are_lang" || ev.key === "are_play_log"){
        if(ev.key === "are_play_log") st.log = G.readLog();
        render();
      }
    };
    window.addEventListener("storage", onStorage);
    render();
    var c = document.getElementById("hrClose"); if(c) c.focus();
    var tot = 0; Object.keys(st.log.g).forEach(function(id){ tot += st.log.g[id].n; });
    if(tot){
      startJava();
      if(st.cs === "loading") startCs(false);
    }
  }

  window.AREHubRecord = {
    open: open, close: close, isOpen: function(){ return !!box; },
    // テスト用：いまの状態
    _state: function(){ return st; }
  };
})();
