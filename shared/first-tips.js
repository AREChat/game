/* ARE ゲーム共通：はじめてそのゲームを開いたときに、かんたんな「あそびかた」ポップアップを1回だけ出す（クラシックscript）
   ・「わかった」で閉じると、そのゲームでは二度と出ません。「案内を今後ぜんぶ出さない」でオフにもできます。
   ・もう一度見たいとき：アドレスのうしろに ?tips=1 をつける（その場で表示。保存は消えません）／ブラウザの記憶 are_gtips_off を消す
   ・出さないとき：アドレスのうしろに ?tips=0 をつける
   ・ポップアップが出ている間は、キー（Enter・Space・矢印など）を ゲームに送りません（閉じるついでに ゲームが始まらないように）
   ・どのゲームも <script src="…/shared/first-tips.js" defer></script> を1行足すだけ。文章はこのファイルの TIPS に書いています */
(function(){
  "use strict";
  var TIPS = {
    hub: ["🎮 ARE GAMES へようこそ", ["遊びたいゲームのカードをタップすると、そのゲームが始まります。","上の分類ボタン（RPG・カード・推理…）で、ゲームを絞れます。","スマホ・タブレットは、横向きにすると遊びやすくなります。","遊んだ記録は、この端末に自動で残ります。"]],
    quest1: ["🗡️ ARE QUEST", ["「はじめから」で新しく、「つづきから」でセーブの続きを遊べます。","移動は 矢印キー／画面のタップ、決定は Enter（コントローラーは A）です。","「あそびかた」に、くわしい説明があります。","わからなくなったら、メニュー（ずかん・いらい など）を開いてみてください。"]],
    quest2: ["🗡️ ARE QUEST 2", ["名前を入れて「はじめから」を押すと始まります。続きは「つづきから」。","移動は WASD／矢印キー、決定は Space／Enter です。スマホは画面のボタンで操作します。","「そうさの せつめい」で、ボタンの使い方が見られます。","絵がさかさまに見えるときは「がめんの むき」を押してください。"]],
    quest3: ["🌙 ARE QUEST 3", ["名前を入れて「はじめから」を押すと始まります。続きは「つづきから」。","移動は WASD／矢印キー、決定は Space／Enter です。スマホは画面のボタンで操作します。","「そうさの せつめい」で、ボタンの使い方が見られます。","絵がさかさまに見えるときは「がめんの むき」を押してください。"]],
    dream: ["🎡 ドリーム・フロンティア", ["「あそぶ！」を押すと始まります。","歩いて回って、メダルやコインを集めます（左上に数が出ます）。","うまく始まらないときは、8秒ほど待つと診断画面が出ます。","オフラインで遊びたいときは「オフライン準備」を先に押してください。"]],
    mystery: ["🔍 推理ゲーム", ["「はじめから」で物語がスタート。「つづきから」「章選択」で続きから遊べます。","物語を読み進めて、問題が出たら証言（ヒント）を読んで、盤面のマスをタップして答えます。","まちがえると誤答が増えて、章の評価が下がります。章をクリアすると自動でセーブされます。"]],
    blocks: ["🧱 ARE BLOCKS", ["「けす役」は、ブロックをつんでラインを消す役。「じゃま役」は、AIがラインを消すのをじゃまする役です。","むずかしさは「やさしい・ふつう・むずかしい」から選べます。","Enter で一気に下まで落とせます。C／Shift（HOLD）で、パーツをとっておけます。"]],
    card: ["🃏 ARE CARD", ["まず、デッキを選んでバトルを始めます。","自分のターンにカードを出して、終わったら「ターン終了」を押します。","相手を攻撃すると「AREだ！」の選択が出ることがあります。画面の指示にしたがってください。","くわしい説明は、画面の「あそびかた」ボタンで見られます。"]],
    starweaver: ["✦ 星紡ぎの旅人", ["移動は W A S D／矢印キー（スマホは画面の十字ボタン）です。","「💬 話す」で風の声（ヒント）が聞けます。光る場所に近づいて「調べる」を押しましょう。","「保存」「読込」で、いつでも続きから遊べます。","「いまの目標」に、次にやることが出ています。"]],
    mystery2: ["🔍 推理ゲーム2", ["最初に「難しさ」を選んで「はじめる」を押します。","人の話から「いつ」「なにが好き」を推理して、表を完成させます。","第1〜3章は、はじめから選べます。クリアした話の数が記録されます。"]],
    offline: ["🎰 OFFLINE PARADISE", ["「ルーレットで はじめる」か「えらんで あそぶ」で、ミニゲームが始まります。","1回は30秒〜1分。遊んだ分は 🪙 になって、ぜんぶのゲームで共通です。","スマホはタッチ、パソコンはキーボード、プロコンでも遊べます。","電波がなくても遊べます。"]],
    game8: ["🏁 GAME8", ["タイトルで「アクション」か「レース」を選びます。","アクションは 左右＋ジャンプで進み、敵を上から踏むとたおせます。","レースは 左右で ハンドル操作、自動で前に進みます。コースの外に出ると おそくなります。","スマホは画面のボタン、パソコンは矢印キー／WASD＋Spaceで操作します。"]]
  };
  var p = location.pathname.replace(/index\.html$/, "");
  var key = /\/game2\/quest3\/$/.test(p) ? "quest3" : /\/game2\/quest2\/$/.test(p) ? "quest2" : /\/game5\/play\/$/.test(p) ? "mystery" : /\/game5\/blocks\/$/.test(p) ? "blocks"
    : /\/game4\/card\/$/.test(p) ? "card" : /\/game4\/starweaver\/$/.test(p) ? "starweaver" : /\/game6\/$/.test(p) ? "mystery2" : /\/game7\/$/.test(p) ? "offline"
    : /\/dream-frontier\/$/.test(p) ? "dream" : /\/game8\/$/.test(p) ? "game8" : /\/game\/$/.test(p) ? "quest1" : /\/$/.test(p) ? "hub" : "";
  var tip = TIPS[key]; if(!tip) return;
  var q = location.search, force = /[?&]tips=1\b/.test(q);
  if(/[?&]tips=0\b/.test(q)) return;
  var SEEN = "are_gtips_seen", OFF = "are_gtips_off", seen = {}, off = false;
  try{ seen = JSON.parse(localStorage.getItem(SEEN) || "{}") || {}; off = localStorage.getItem(OFF) === "1"; }catch(e){ seen = {}; }
  if(!force && (off || seen[key])) return;

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  var m = null, blockKeys = function(e){ if(m && !m.hidden){ e.stopImmediatePropagation(); if(e.key === "Enter" || e.key === " " || e.key === "Escape"){ if(e.type === "keydown"){ e.preventDefault(); close(); } } else if(e.type === "keydown" && /^(Arrow|Tab)/.test(e.key) === false){ e.preventDefault(); } } };
  function close(){
    if(!m) return; m.hidden = true;
    try{ if(!force){ seen[key] = Date.now(); localStorage.setItem(SEEN, JSON.stringify(seen)); } }catch(e){}
    window.removeEventListener("keydown", blockKeys, true); window.removeEventListener("keyup", blockKeys, true); window.removeEventListener("keypress", blockKeys, true);
    if(m.parentNode) m.parentNode.removeChild(m); m = null;
  }
  function show(){
    if(m) return;
    var css = document.createElement("style");
    css.textContent = "#areTips{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.66);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,'Hiragino Sans','Noto Sans JP',sans-serif}#areTips[hidden]{display:none}" +
      "#areTips .c{background:#16213a;color:#fff;border:1px solid #3a4a70;border-radius:16px;max-width:430px;width:100%;padding:18px 18px 12px;box-shadow:0 12px 40px #000a;max-height:88vh;overflow:auto}" +
      "#areTips h3{margin:0 0 2px;font-size:1.15rem}#areTips .s{font-size:.78rem;opacity:.7;margin:0 0 6px}#areTips ul{margin:8px 0 14px;padding-left:1.2em;line-height:1.7;font-size:.95rem}" +
      "#areTips .ok{width:100%;min-height:48px;font-size:1rem;border:0;border-radius:12px;background:#5b7cfa;color:#fff;font-weight:700;cursor:pointer}#areTips .off{display:block;margin:8px auto 0;background:none;border:0;color:#fff;opacity:.65;text-decoration:underline;font-size:.78rem;cursor:pointer;padding:6px}";
    document.head.appendChild(css);
    m = document.createElement("div"); m.id = "areTips"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.innerHTML = '<div class="c"><h3>' + esc(tip[0]) + '</h3><p class="s">はじめて開いたときの案内です</p><ul>' + tip[1].map(function(l){ return "<li>" + esc(l) + "</li>"; }).join("") + '</ul><button type="button" class="ok">わかった！</button><button type="button" class="off">案内を今後ぜんぶ出さない</button></div>';
    
    document.body.appendChild(m);
    m.querySelector(".ok").addEventListener("click", close);
    m.querySelector(".off").addEventListener("click", function(){ try{ localStorage.setItem(OFF, "1"); }catch(e){} close(); });
    window.addEventListener("keydown", blockKeys, true); window.addEventListener("keyup", blockKeys, true); window.addEventListener("keypress", blockKeys, true);
    try{ m.querySelector(".ok").focus(); }catch(e){}
  }
  function start(){ setTimeout(show, 1200); }
  if(document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
