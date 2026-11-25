"use strict";
// ============================================================================
// AREGames — ゲーム一覧の共通部品（ハブ・ジャンルページ・「ほかのゲームへ」が同じものを使う）
//   元データ：shared/games-registry.json → node tools/build-registry.js → shared/games-data.js（window.AREGamesData）
//   ことば：チャットと同じ localStorage "are_lang"（ja / en / zh / ko。なければ ja）
//   遊んだ記録：localStorage "are_play_log"（この端末だけ。こわれていても動く）
// ============================================================================
(function(){
  if(window.AREGames) return;
  var D = window.AREGamesData;
  if(!D){ try{ console.error("AREGames: games-data.js が読めていません"); }catch(_e){} return; }
  var LANGS = D.langs, LOG_KEY = "are_play_log", LANG_KEY = "are_lang", LAST_KEY = "are_game_last";
  var OK_BACK = /^https:\/\/arechat\.github\.io\/(ARE|AREDA)\/(chat|login)(\.html)?(\?[^#]*)?$/;
  var OK_REF = /^(https:\/\/arechat\.github\.io\/(ARE|AREDA)\/)/;

  function lsGet(k){ try{ return localStorage.getItem(k); }catch(_e){ return null; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); return true; }catch(_e){ return false; } }
  function lang(){ var l = lsGet(LANG_KEY); return LANGS.indexOf(l) >= 0 ? l : "ja"; }
  function setLang(l){ if(LANGS.indexOf(l) < 0) return false; lsSet(LANG_KEY, l); try{ document.documentElement.lang = l; }catch(_e){} return true; }
  // {ja,en,zh,ko} から いまの ことばを えらぶ（なければ 日本語）
  function t(o, l){ if(o == null) return ""; if(typeof o === "string") return o; l = l || lang(); var v = o[l]; return (v == null || v === "") ? o.ja : v; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }

  // ---- 画面のことば（ハブ・ジャンルページ・ほかのゲームへ） ----
  var UI = {
    title: {ja: "ARE ゲーム ｜ あそびたいゲームをえらぼう", en: "ARE Games | Pick a game to play", zh: "ARE 游戏 ｜ 选一个想玩的游戏", ko: "ARE 게임 | 하고 싶은 게임을 골라요"},
    metaDesc: {ja: "AREのゲームをジャンル別にまとめた入口です。RPG・推理・パズル・アクション・カード・ミニゲームなど、ブラウザですぐあそべます（無料）。", en: "A genre-based entrance to ARE's games: RPG, mystery, puzzle, action, card and mini-games, playable right in your browser (free).", zh: "按类型整理的ARE游戏入口。RPG、推理、益智、动作、卡牌、小游戏等，浏览器里就能玩（免费）。", ko: "ARE의 게임을 장르별로 모은 입구예요. RPG·추리·퍼즐·액션·카드·미니게임 등을 브라우저에서 바로 즐겨요(무료)."},
    h1: {ja: "あそびたいゲームを<br>えらぼう", en: "Pick a game<br>to play", zh: "选一个想玩的<br>游戏吧", ko: "하고 싶은<br>게임을 골라요"},
    lead: {ja: "ぜんぶブラウザでそのままあそべます（無料）。スマホ・タブレットは<b>横向き</b>がおすすめです。", en: "Everything plays right in your browser (free). On phones and tablets, <b>landscape</b> is recommended.", zh: "全部都能直接在浏览器里玩（免费）。手机和平板建议<b>横屏</b>。", ko: "모두 브라우저에서 바로 즐길 수 있어요(무료). 스마트폰·태블릿은 <b>가로 방향</b>을 추천해요."},
    backChat: {ja: "← チャットへもどる", en: "← Back to chat", zh: "← 返回聊天", ko: "← 채팅으로 돌아가기"},
    backChat2: {ja: "💬 チャットへもどる", en: "💬 Back to chat", zh: "💬 返回聊天", ko: "💬 채팅으로 돌아가기"},
    learn: {ja: "📚 学習サイト（LearnLab124）", en: "📚 Study site (LearnLab124)", zh: "📚 学习网站（LearnLab124）", ko: "📚 학습 사이트(LearnLab124)"},
    help: {ja: "❓ あそびかた・よくある質問", en: "❓ How to play & FAQ", zh: "❓ 玩法与常见问题", ko: "❓ 플레이 방법·자주 묻는 질문"},
    chipsLabel: {ja: "ゲームのしぼりこみ", en: "Filter games", zh: "筛选游戏", ko: "게임 거르기"},
    all: {ja: "すべて", en: "All", zh: "全部", ko: "전체"},
    newest: {ja: "🆕 しんさく", en: "🆕 New", zh: "🆕 新作", ko: "🆕 신작"},
    genreTiles: {ja: "ジャンルから えらぶ", en: "Browse by genre", zh: "按类型选择", ko: "장르로 고르기"},
    genrePage: {ja: "このジャンルのページへ ▶", en: "Open this genre ▶", zh: "进入该类型页面 ▶", ko: "이 장르 페이지로 ▶"},
    nGames: {ja: "{n}本", en: "{n} games", zh: "{n}个游戏", ko: "{n}개"},
    nGame1: {ja: "{n}本", en: "{n} game", zh: "{n}个游戏", ko: "{n}개"},
    empty: {ja: "このしぼりこみに合うゲームはありません。", en: "No games match this filter.", zh: "没有符合该筛选的游戏。", ko: "이 조건에 맞는 게임이 없어요."},
    play: {ja: "▶ あそぶ", en: "▶ Play", zh: "▶ 开始", ko: "▶ 플레이"},
    last: {ja: "前回あそんだ", en: "Last played", zh: "上次玩的", ko: "지난번에 한 게임"},
    lastBig: {ja: "前回あそんだゲーム", en: "The game you played last", zh: "上次玩的游戏", ko: "지난번에 한 게임"},
    cont: {ja: "つづきから ▶", en: "Continue ▶", zh: "继续 ▶", ko: "이어서 ▶"},
    note: {ja: "セーブはこの端末のブラウザに保存されます（別の端末・別のブラウザには引きつがれません）。", en: "Saves are kept in this device's browser (they do not carry over to other devices or browsers).", zh: "存档保存在这台设备的浏览器中（不会同步到其他设备或浏览器）。", ko: "저장 데이터는 이 기기의 브라우저에 보관돼요(다른 기기·다른 브라우저로는 이어지지 않아요)."},
    langLabel: {ja: "ことば", en: "Language", zh: "语言", ko: "언어"},
    onlyJa: {ja: "ゲーム内は日本語", en: "In-game text: Japanese", zh: "游戏内为日语", ko: "게임 내는 일본어"},
    fourLang: {ja: "ゲーム内も4か国語", en: "In-game: 4 languages", zh: "游戏内支持四种语言", ko: "게임 내도 4개 국어"},
    pad: {ja: "🎮 ゲームパッド対応", en: "🎮 Gamepad", zh: "🎮 支持手柄", ko: "🎮 게임패드 지원"},
    adult: {ja: "20歳以上", en: "Ages 20+", zh: "20岁以上", ko: "20세 이상"},
    external: {ja: "チャット内のページ", en: "Opens in the chat site", zh: "聊天站内页面", ko: "채팅 사이트 내 페이지"},
    howGenre: {ja: "このジャンルの遊びかた", en: "How this genre works", zh: "该类型的玩法", ko: "이 장르의 플레이 방법"},
    order: {ja: "おすすめの順", en: "Suggested order", zh: "推荐顺序", ko: "추천 순서"},
    otherGenres: {ja: "ほかのジャンル", en: "Other genres", zh: "其他类型", ko: "다른 장르"},
    hub: {ja: "← ゲーム一覧へ", en: "← All games", zh: "← 游戏列表", ko: "← 게임 목록"},
    myRec: {ja: "このジャンルの あそんだ記録", en: "Your play record in this genre", zh: "该类型的游戏记录", ko: "이 장르의 플레이 기록"},
    recNone: {ja: "まだ記録がありません。遊ぶと、ここに出ます。", en: "No record yet. It will appear here once you play.", zh: "还没有记录。玩过之后会显示在这里。", ko: "아직 기록이 없어요. 플레이하면 여기에 나와요."},
    recTimes: {ja: "{n}回", en: "{n}×", zh: "{n}次", ko: "{n}회"},
    recTotal: {ja: "あわせて {n}回 あそびました", en: "{n} plays in total", zh: "共玩了 {n} 次", ko: "합계 {n}회 플레이했어요"},
    recLastAt: {ja: "さいごに あそんだ日：{d}", en: "Last played: {d}", zh: "最后一次游玩：{d}", ko: "마지막으로 한 날: {d}"},
    recClear: {ja: "記録を消す", en: "Clear record", zh: "清除记录", ko: "기록 지우기"},
    recClearAsk: {ja: "あそんだ記録を消します。セーブデータは消えません。よろしいですか？", en: "This clears your play record only. Save data is not deleted. Continue?", zh: "将清除游戏记录。存档数据不会被删除。要继续吗？", ko: "플레이 기록만 지워요. 저장 데이터는 지워지지 않아요. 계속할까요?"},
    notFound: {ja: "そのジャンルは見つかりませんでした。一覧にもどります。", en: "That genre was not found. Returning to the list.", zh: "没有找到该类型，返回列表。", ko: "그 장르를 찾지 못했어요. 목록으로 돌아가요."},
    myStats: {ja: "📊 あなたの記録", en: "📊 Your record", zh: "📊 你的记录", ko: "📊 나의 기록"},
    navHead: {ja: "🎮 ほかのゲームへ", en: "🎮 Other games", zh: "🎮 去玩别的游戏", ko: "🎮 다른 게임으로"},
    navNote: {ja: "いまのゲームは、できるだけ セーブしてから うつってね。", en: "Please save the current game before you move on.", zh: "切换前请尽量先保存当前游戏。", ko: "옮기기 전에 지금 게임을 저장해 주세요."},
    navClose: {ja: "とじる", en: "Close", zh: "关闭", ko: "닫기"},
    navAll: {ja: "🏠 ゲーム一覧", en: "🏠 All games", zh: "🏠 游戏列表", ko: "🏠 게임 목록"}
  };
  function ui(k, vars, l){
    var s = t(UI[k], l); if(vars) for(var key in vars) s = s.split("{" + key + "}").join(vars[key]);
    return s;
  }

  function count(n, l){ return ui(n === 1 ? "nGame1" : "nGames", {n: n}, l); }
  // ---- 一覧 ----
  var GENRES = D.genres, GAMES = D.games;
  function byId(id){ for(var i = 0; i < GAMES.length; i++) if(GAMES[i].id === id) return GAMES[i]; return null; }
  function genre(id){ for(var i = 0; i < GENRES.length; i++) if(GENRES[i].id === id) return GENRES[i]; return null; }
  function ofGenre(id){ return GAMES.filter(function(g){ return g.genre === id; }).sort(function(a, b){ return a.order - b.order; }); }
  // いまの ページが どのゲームの中か（フォルダ名で見分ける。長い名前を優先）
  function currentGameId(pathname){
    var p = pathname != null ? pathname : (function(){ try{ return location.pathname; }catch(_e){ return ""; } })(), best = null;
    GAMES.forEach(function(g){
      if(g.ext || !g.folder) return;
      var f = "/" + g.folder + "/";
      if(p.indexOf(f) >= 0 && (!best || g.folder.length > best.folder.length)) best = g;
    });
    return best ? best.id : "";
  }

  // ---- もどる先（チャット） ----
  function chatTarget(search, referrer){
    var LOGIN = "https://arechat.github.io/ARE/login.html", back = "", chat = LOGIN;
    try{
      var b = new URLSearchParams(search != null ? search : location.search).get("back");
      if(b && OK_BACK.test(b)){ back = b; chat = b; }
      else{ var m = String(referrer != null ? referrer : document.referrer || "").match(OK_REF); if(m) chat = m[1] + "chat.html"; }
    }catch(_e){}
    return {back: back, chat: chat};
  }
  function gameUrl(g, back, prefix){
    var h = g.ext ? g.href : ((prefix || "") + g.href);
    if(!back || g.ext) return h;
    return h + (h.indexOf("?") < 0 ? "?" : "&") + "back=" + encodeURIComponent(back);
  }

  // ---- あそんだ記録 ----
  function readLog(){
    var raw = lsGet(LOG_KEY), o = null;
    try{ o = raw ? JSON.parse(raw) : null; }catch(_e){ o = null; }
    if(!o || typeof o !== "object" || o.v !== 1 || typeof o.g !== "object" || o.g === null || Array.isArray(o.g)) o = {v: 1, g: {}, d: {}};
    if(typeof o.d !== "object" || o.d === null || Array.isArray(o.d)) o.d = {};
    // 変な値は捨てる
    var g2 = {};
    Object.keys(o.g).forEach(function(id){
      var e = o.g[id];
      if(byId(id) && e && typeof e === "object" && isFinite(e.n) && e.n > 0) g2[id] = {n: Math.min(Math.floor(e.n), 99999), last: isFinite(e.last) ? e.last : 0};
    });
    o.g = g2;
    o.h = hist(o.h, 24); o.w = hist(o.w, 7); // あそんだ時間帯（0〜23時）・曜日（日=0）。ない／こわれていれば 0 で うめる
    return o;
  }
  function hist(a, n){
    var r = [];
    for(var i = 0; i < n; i++){ var v = Array.isArray(a) ? a[i] : 0; r.push(typeof v === "number" && isFinite(v) && v > 0 ? Math.min(Math.floor(v), 99999) : 0); }
    return r;
  }
  function dayKey(ms){ var d = new Date(ms); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function recordPlay(id, now){
    if(!byId(id)) return false;
    now = now || Date.now();
    var o = readLog(), e = o.g[id] || {n: 0, last: 0};
    e.n = Math.min(e.n + 1, 99999); e.last = now; o.g[id] = e;
    var k = dayKey(now); o.d[k] = (o.d[k] || 0) + 1;
    var dt = new Date(now); o.h[dt.getHours()] = Math.min(o.h[dt.getHours()] + 1, 99999); o.w[dt.getDay()] = Math.min(o.w[dt.getDay()] + 1, 99999);
    var keys = Object.keys(o.d).sort(); while(keys.length > 90) delete o.d[keys.shift()];
    lsSet(LOG_KEY, JSON.stringify(o)); lsSet(LAST_KEY, id);
    return true;
  }
  function clearLog(){ try{ localStorage.removeItem(LOG_KEY); }catch(_e){} }
  function genreStats(gid){
    var o = readLog(), total = 0, last = 0, rows = ofGenre(gid).map(function(g){
      var e = o.g[g.id] || {n: 0, last: 0}; total += e.n; if(e.last > last) last = e.last;
      return {id: g.id, n: e.n, last: e.last};
    });
    return {total: total, last: last, rows: rows};
  }
  function lastGameId(){ var id = lsGet(LAST_KEY); return byId(id) ? id : ""; }

  // ---- 画面の部品 ----
  function tagsOf(g){ return t(g.tags) ; }
  function badges(g, l){
    var a = [];
    a.push(g.inGameLangs.length > 1 ? ui("fourLang", null, l) : ui("onlyJa", null, l));
    if(g.gamepad) a.push(ui("pad", null, l));
    if(g.ext) a.push(ui("external", null, l));
    return a;
  }
  function cardHTML(g, opt){
    opt = opt || {}; var l = opt.lang || lang(), last = opt.last === g.id;
    var tags = (t(g.tags, l) || []).concat(badges(g, l));
    var cover = '<div class="cover" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '"><span class="emoji" aria-hidden="true">' + g.emoji + '</span>' +
      (g.img ? '<img src="' + esc((opt.prefix || "") + g.img) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '') +
      (g.adult ? '<span class="age20" title="' + esc(ui("adult", null, l)) + '">20+</span>' : '') + (last ? '<span class="ribbon">' + esc(ui("last", null, l)) + '</span>' : '') + '</div>';
    return '<a class="card' + (opt.dup ? ' dupnew' : '') + '" data-id="' + esc(g.id) + '" data-cat="' + esc(g.genre) + '" href="' + esc(gameUrl(g, opt.back, opt.prefix)) + '"' + (g.ext ? ' rel="noopener"' : '') + '>' + cover +
      '<div class="body"><h2 class="name">' + esc(t(g.name, l)) + '<small>' + esc(t(g.sub, l)) + '</small></h2><p class="desc">' + esc(t(g.desc, l)) + '</p>' +
      '<div class="tags">' + tags.map(function(x){ return '<span class="tag">' + esc(x) + '</span>'; }).join("") + '</div>' +
      '<span class="play">' + esc(ui("play", null, l)) + '</span></div></a>';
  }
  function langSwitchHTML(l){
    var names = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"};
    return '<div class="langsw" role="group" aria-label="' + esc(ui("langLabel", null, l)) + '">' + LANGS.map(function(x){
      return '<button type="button" class="lb" data-lang="' + x + '" lang="' + x + '" aria-pressed="' + (x === l ? "true" : "false") + '">' + names[x] + '</button>';
    }).join("") + '</div>';
  }

  window.AREGames = {
    data: D, langs: LANGS, genres: GENRES, games: GAMES,
    lang: lang, setLang: setLang, t: t, ui: ui, esc: esc, count: count,
    byId: byId, genre: genre, ofGenre: ofGenre, currentGameId: currentGameId,
    chatTarget: chatTarget, gameUrl: gameUrl, cardHTML: cardHTML, langSwitchHTML: langSwitchHTML,
    readLog: readLog, recordPlay: recordPlay, clearLog: clearLog, genreStats: genreStats, lastGameId: lastGameId, dayKey: dayKey
  };
})();
