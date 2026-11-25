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
    mystery: ["🔍 推理ゲーム", ["最初に「難しさ」を選んで「はじめる」を押すと、事件が始まります。毎回ちがう事件・ちがう登場人物です。","人の話（証言）から「だれが・いつ・なにを」を推理して、表のマスをタップします。","「✍ 本書き」は、マスをタップすると ○ が入り、その場で正解かどうか判定されます。合っていれば同じ行・列は自動で ✕ に。ちがうと「まちがい」が増えます。","「✎ 下書き」はメモ用です。○？／✕？ を自由につけられて、判定には関係ありません。表がぜんぶ正しく埋まると、その場でクリアです。"]],
    blocks: ["🧱 ARE BLOCKS", ["「けす役」は、ブロックをつんでラインを消す役。「じゃま役」は、AIがラインを消すのをじゃまする役です。","むずかしさは「やさしい・ふつう・むずかしい」から選べます。","↓（または Enter／Space）で一気に下まで落とせます。C／Shift（HOLD）で、パーツをとっておけます。"]],
    card: ["🃏 ARE CARD", ["まず、デッキを選んでバトルを始めます。","自分のターンにカードを出して、終わったら「ターン終了」を押します。","相手を攻撃すると「AREだ！」の選択が出ることがあります。画面の指示にしたがってください。","くわしい説明は、画面の「あそびかた」ボタンで見られます。"]],
    starweaver: ["✦ 星紡ぎの旅人", ["移動は W A S D／矢印キー（スマホは画面の十字ボタン）です。","「💬 話す」で風の声（ヒント）が聞けます。光る場所に近づいて「調べる」を押しましょう。","「保存」「読込」で、いつでも続きから遊べます。","「いまの目標」に、次にやることが出ています。"]],
    offline: ["🎰 OFFLINE PARADISE", ["「ルーレットで はじめる」か「えらんで あそぶ」で、ミニゲームが始まります。","1回は30秒〜1分。遊んだ分は 🪙 になって、ぜんぶのゲームで共通です。","スマホはタッチ、パソコンはキーボード、プロコンでも遊べます。","電波がなくても遊べます。"]],
    game8: ["🏁 GAME8", ["タイトルで「アクション」か「レース」を選びます。","アクションは 左右＋ジャンプで進み、敵を上から踏むとたおせます。","レースは 左右で ハンドル操作、自動で前に進みます。コースの外に出ると おそくなります。","スマホは画面のボタン、パソコンは矢印キー／WASD＋Spaceで操作します。"]],
    game9: ["🍽️ AREshoot", ["「コース」は、向かってくる食べもの・調理道具をねらって撃つシューティング。「バトルロワイヤル」は、島に降りて最後の1人をめざす 3D サバイバルです。","バトロワは、拾った武器で戦い、だんだんせばまる安全エリアの中にいましょう。むずかしさは「やさしい・ふつう・むずかしい」。","スマホは左で移動・右で視点・ボタンで撃つ、パソコンは WASD＋マウスです。","虫は一切出てきません。"]],
    lab11: ["🧪 ARE 前代未聞ラボ", ["4つの ふしぎな ゲームが あります。カードを タップすると その ゲームが はじまります。","どれも「あそびかた」ボタンに くわしい 説明が あるので、まよったら 見てね。","パソコンは 矢印キー／WASD、スマホは 画面の ボタン、コントローラーも つかえます。"]],
    words: ["⌨️ ことばクラフト", ["⭐ ほしを 右がわの 🚩ゴールへ とどけるのが もくてき です。","下の はこに「ことば」を 打つと、それが「もの」に なります。（例：「はし」→ 橋、「かぜ」→ 風）","つくった ものを タップして 場所に おいて、「▶スタート」！ 知らない ことばは「ふしぎもの」に なります。"]],
    twins: ["👯 ふたごの世界", ["ふたごは 1つの ボタンで いっしょに うごきます。ふたりとも ゴールの ☆ に のれば クリア！","せかいによっては ボタンと ぎゃくむきに うごくことも。ボードの すみの 小さな 十字が ヒントです。","まよったら ↩（ひとつ もどす）と 💡（つぎの 一手）が つかえます。"]],
    rules: ["🎡 ルール・ルーレット", ["ルーレットが「ミニゲーム」と「ルールの へんか」を きめます。1回は 10びょうほど！","クリアで とくてん、しっぱいで ❤ が 1つ へります。❤ が なくなると おしまい。","4ラウンドごとに ごほうび（パーク）を 1つ えらべます。"]],
    echo: ["🔔 こだまの部屋", ["きみが うごくと、あとから「こだま」が おなじ うごきを します。","「🔔 こだまに する」で いまの うごきを こだまにして、はじめの 場所から やりなおし。","ゆかの スイッチを だれかが ふんでいる あいだだけ、おなじ 番号の とびらが あきます。⭐ に ついたら クリア！"]],
    game12: ["⚔️ AREUSO", ["「ゲームスタート」→ ステージと 武将を えらんで「出陣！」。","うごく：左スティック／WASD／画面の ドラッグ。Y＝弱こうげき、X＝強こうげき、B＝かいひ（一瞬 むてき）。","たくさん たおすと 無双ゲージが たまります。赤い 輪は 攻撃の 予告！ かいひで よけよう。"]],
    game13: ["📅 20+ の冒険", ["1年＝52週。 1週ごとに「平日」と「週末」の 行動を 1つずつ えらびます。","はたらけば お金、勉強すれば 知識、あそべば 気力が 回復。体力・気力・健康が 0に ちかづくと ピンチ！","週の おわりに できごとが 起きて、えらんだ 答えで 物語が かわります。エンディングは 27種類！（20歳以上向けの 場面が あります）"]],
    game14: ["🌟 人気者になろう", ["90日の あいだに ファンを ふやして「人気者」を めざします。","1日に 3回、チャレンジ（ミニゲーム）・特訓・おやすみ から えらびます。","特訓で 能力が のびると ミニゲームが やさしく なります。元気が ひくい ときは 休もう。"]],
    game10: ["⏪ ループ・ラボ", ["青いロボを動かして 🌀出口をめざします。トビラは、同じ色のボタンが ぜんぶ ふまれているあいだだけ ひらきます。","ボタンの上に立って「ぶんしん」を押すと、いまの動きがゴーストになって、つぎのループで くりかえしてくれます。","ぶんしんが すくないほど ★が ふえます。迷ったら 💡ヒント。","PC：矢印／WASD、Space＝まつ、Enter＝ぶんしん、R＝やりなおし。スマホは画面のボタン。"]]
  };
  var p = location.pathname.replace(/index\.html$/, "");
  var key = /\/game2\/quest3\/$/.test(p) ? "quest3" : /\/game2\/quest2\/$/.test(p) ? "quest2" : /\/game5\/play\/$/.test(p) ? "mystery" : /\/game5\/blocks\/$/.test(p) ? "blocks"
    : /\/game4\/card\/$/.test(p) ? "card" : /\/game4\/starweaver\/$/.test(p) ? "starweaver" : /\/game6\/$/.test(p) ? "mystery" : /\/game7\/$/.test(p) ? "offline"
    : /\/dream-frontier\/$/.test(p) ? "dream" : /\/game8\/$/.test(p) ? "game8" : /\/game9\/$/.test(p) ? "game9" : /\/game10\/$/.test(p) ? "game10" : /\/game\/$/.test(p) ? "quest1"
    : /\/game11\/$/.test(p) ? "lab11" : /\/game11\/words\.html$/.test(p) ? "words" : /\/game11\/twins\.html$/.test(p) ? "twins" : /\/game11\/rules\.html$/.test(p) ? "rules" : /\/game11\/echo\.html$/.test(p) ? "echo"
    : /\/game12\/$/.test(p) ? "game12" : /\/game13\/$/.test(p) ? "game13" : /\/game14\/$/.test(p) ? "game14" : /\/$/.test(p) ? "hub" : "";

  // 4か国語（日本語のほかに、英語・中国語・韓国語）。4言語に対応しているゲームと入口だけ。ほかは 日本語のまま。
  var T4 = {
    hub: {
      ja: ["🎮 ARE GAMES へようこそ", ["遊びたいゲームのカードをタップすると、そのゲームが始まります。","上の「ジャンルから えらぶ」や分類ボタン（RPG・カード・推理…）で、ゲームを絞れます。","右上のボタンで、ことば（日本語・English・中文・한국어）を変えられます。","スマホ・タブレットは、横向きにすると遊びやすくなります。","遊んだ記録は、この端末に自動で残ります。"]],
      en: ["🎮 Welcome to ARE GAMES", ["Tap a game card to start playing it.", "Use “Browse by genre” or the filter buttons (RPG, Card, Mystery…) to narrow down the games.", "Switch the language (日本語 / English / 中文 / 한국어) with the buttons at the top right.", "On phones and tablets, landscape makes games easier to play.", "Your play record is saved automatically on this device."]],
      zh: ["🎮 欢迎来到 ARE GAMES", ["点一下想玩的游戏卡片，就会开始游戏。", "可用“按类型选择”或筛选按钮（RPG・卡牌・推理…）缩小范围。", "右上角的按钮可切换语言（日本語 / English / 中文 / 한국어）。", "手机和平板横屏会更容易玩。", "游戏记录会自动保存在这台设备上。"]],
      ko: ["🎮 ARE GAMES에 오신 것을 환영해요", ["하고 싶은 게임 카드를 탭하면 그 게임이 시작돼요.", "‘장르로 고르기’나 필터 버튼(RPG·카드·추리…)으로 게임을 좁힐 수 있어요.", "오른쪽 위 버튼으로 언어(日本語 / English / 中文 / 한국어)를 바꿀 수 있어요.", "스마트폰·태블릿은 가로 방향이 더 편해요.", "플레이 기록은 이 기기에 자동으로 저장돼요."]]
    },
    lab11: {
      en: ["🧪 ARE Unheard-of Lab", ["There are 4 curious games. Tap a card to start one.", "Each has a “How to play” button with details if you get lost.", "Use arrow keys/WASD on PC, on-screen buttons on phones, or a controller."]],
      zh: ["🧪 ARE 前所未闻实验室", ["这里有4个奇妙的游戏。点一下卡片就能开始。", "每个游戏都有“玩法”按钮，有疑问时可以查看。", "电脑可用方向键/WASD，手机用屏幕按钮，也可以用手柄。"]],
      ko: ["🧪 ARE 전대미문 랩", ["신기한 게임이 4개 있어요. 카드를 탭하면 그 게임이 시작돼요.", "각 게임에 ‘플레이 방법’ 버튼이 있어서 헷갈리면 확인할 수 있어요.", "PC는 방향키/WASD, 스마트폰은 화면 버튼, 컨트롤러도 사용할 수 있어요."]]
    },
    words: {
      en: ["⌨️ Word Craft", ["Goal: deliver the ⭐ star to the 🚩 goal on the right.", "Type a “word” in the box below and it becomes a thing. (e.g. “bridge” → a bridge, “wind” → wind)", "Tap what you made, place it, then press “▶ Start”! Unknown words become “mystery things”."]],
      zh: ["⌨️ 文字工坊", ["目标：把⭐星星送到右侧的🚩终点。", "在下方的框里输入“词语”，它就会变成实物。（例：“桥”→ 桥，“风”→ 风）", "点一下做好的东西放到位置上，再按“▶开始”！不认识的词会变成“神秘物”。"]],
      ko: ["⌨️ 말 크래프트", ["목표: ⭐ 별을 오른쪽의 🚩 골까지 보내요.", "아래 칸에 ‘말’을 입력하면 그것이 물건이 돼요. (예: ‘다리’ → 다리, ‘바람’ → 바람)", "만든 것을 탭해 자리에 놓고 ‘▶ 시작’! 모르는 말은 ‘수수께끼 물건’이 돼요."]]
    },
    twins: {
      en: ["👯 Twin Worlds", ["The twins move together with one button. Get both onto the ☆ goal to clear!", "In some worlds a twin moves opposite to your button. The small cross in the board's corner is a hint.", "If you're stuck, use ↩ (undo) and 💡 (next move)."]],
      zh: ["👯 双子世界", ["双子用同一个按钮一起行动。两个都站上终点的☆就过关！", "有些世界里，其中一个会和按钮方向相反地移动。棋盘角落的小十字是提示。", "卡住时可以用↩（撤销一步）和💡（下一步提示）。"]],
      ko: ["👯 쌍둥이 세계", ["쌍둥이는 버튼 하나로 함께 움직여요. 둘 다 골의 ☆에 올라가면 클리어!", "세계에 따라 버튼과 반대 방향으로 움직이기도 해요. 보드 구석의 작은 십자가 힌트예요.", "막히면 ↩(한 수 되돌리기)와 💡(다음 한 수)를 쓸 수 있어요."]]
    },
    rules: {
      en: ["🎡 Rule Roulette", ["The roulette picks a “mini-game” and a “rule change”. Each round is about 10 seconds!", "Clear it to score; fail and you lose one ❤. Lose them all and it's over.", "Every 4 rounds you can pick one reward (perk)."]],
      zh: ["🎡 规则轮盘", ["轮盘会决定“小游戏”和“规则变化”。每一回合大约10秒！", "通关得分，失败会少一颗❤。❤用完就结束。", "每4回合可以选择一个奖励（特技）。"]],
      ko: ["🎡 룰 룰렛", ["룰렛이 ‘미니게임’과 ‘규칙 변화’를 정해요. 한 판은 10초쯤이에요!", "클리어하면 득점, 실패하면 ❤가 하나 줄어요. ❤가 없어지면 끝이에요.", "4라운드마다 보상(퍽)을 하나 고를 수 있어요."]]
    },
    echo: {
      en: ["🔔 Echo Room", ["When you move, an “echo” repeats the same moves afterwards.", "Press “🔔 Make an echo” to turn your moves into an echo and restart from the start.", "A door of the same number stays open only while someone stands on its floor switch. Reach the ⭐ to clear!"]],
      zh: ["🔔 回声之间", ["你一动，之后“回声”就会重复相同的动作。", "按“🔔 化为回声”，就把当前的动作变成回声，并从起点重新开始。", "只有在有人踩着地板开关时，同编号的门才会开着。到达⭐就过关！"]],
      ko: ["🔔 메아리 방", ["내가 움직이면 나중에 ‘메아리’가 같은 움직임을 해요.", "‘🔔 메아리로 만들기’를 누르면 지금의 움직임이 메아리가 되고 처음 자리에서 다시 시작해요.", "바닥 스위치를 누군가 밟고 있는 동안만 같은 번호의 문이 열려요. ⭐에 도착하면 클리어!"]]
    },
    game12: {
      en: ["⚔️ AREUSO", ["Press “Game Start”, pick a stage and a warlord, then “Charge!”.", "Move: left stick / WASD / drag on screen. Y = light attack, X = heavy attack, B = dodge (brief invincibility).", "Defeat many foes to fill the Musou gauge. Red rings warn of attacks — dodge them!"]],
      zh: ["⚔️ AREUSO", ["点“开始游戏”，选择关卡和武将后按“出阵！”。", "移动：左摇杆/WASD/在屏幕上拖动。Y＝轻攻击，X＝重攻击，B＝闪避（瞬间无敌）。", "击败大量敌人就会积攒无双槽。红圈是攻击预告！用闪避躲开。"]],
      ko: ["⚔️ AREUSO", ["‘게임 스타트’ → 스테이지와 무장을 골라 ‘출진!’.", "이동: 왼쪽 스틱/WASD/화면 드래그. Y＝약공격, X＝강공격, B＝회피(순간 무적).", "많이 쓰러뜨리면 무쌍 게이지가 차요. 빨간 고리는 공격 예고! 회피로 피해요."]]
    },
    game13: {
      en: ["📅 Adventure at Twenty", ["1 year = 52 weeks. Each week you pick one weekday action and one weekend action.", "Work for money, study for knowledge, play to recover spirit. Watch out when stamina, spirit or health nears 0!", "Events happen at the end of the week and your answers change the story. 27 endings! (Contains scenes for ages 20+.)"]],
      zh: ["📅 二十岁的冒险", ["1年＝52周。每周分别选择一个“工作日”和一个“周末”的行动。", "工作赚钱，学习增加知识，玩耍恢复精力。体力、精力、健康接近0就危险了！", "每周结束会发生事件，你的回答会改变故事。共27种结局！（含有20岁以上向的场景）"]],
      ko: ["📅 스무 살의 모험", ["1년＝52주. 한 주마다 ‘평일’과 ‘주말’ 행동을 하나씩 골라요.", "일하면 돈, 공부하면 지식, 놀면 기력이 회복돼요. 체력·기력·건강이 0에 가까워지면 위기!", "주 말미에 사건이 일어나고, 고른 대답에 따라 이야기가 바뀌어요. 엔딩은 27종! (20세 이상 대상 장면이 있어요)"]]
    },
    game14: {
      en: ["🌟 Become a Star", ["Win fans over 90 days and aim to become a star.", "3 times a day, choose from a challenge (mini-game), training or rest.", "Training raises your skills and makes mini-games easier. Rest when your energy is low."]],
      zh: ["🌟 成为人气明星", ["在90天里增加粉丝，目标成为人气明星。", "每天3次，从挑战（小游戏）、特训、休息中选择。", "特训提升能力后，小游戏会变简单。精力低的时候要休息。"]],
      ko: ["🌟 인기인이 되자", ["90일 동안 팬을 늘려 ‘인기인’을 노려요.", "하루에 3번, 도전(미니게임)·특훈·휴식 중에서 골라요.", "특훈으로 능력이 오르면 미니게임이 쉬워져요. 기운이 낮을 땐 쉬어요."]]
    }
  };
  var UI4 = {
    ja: ["はじめて開いたときの案内です", "わかった！", "案内を今後ぜんぶ出さない"],
    en: ["A quick guide for your first visit", "Got it!", "Don't show guides anymore"],
    zh: ["首次打开时的简要说明", "知道了！", "以后不再显示说明"],
    ko: ["처음 열었을 때의 안내예요", "알겠어요!", "앞으로 안내를 모두 숨기기"]
  };
  function curLang(){ try{ var l = localStorage.getItem("are_lang"); return /^(ja|en|zh|ko)$/.test(l) ? l : "ja"; }catch(e){ return "ja"; } }
  var tip = TIPS[key]; if(!tip) return;
  var LANG = curLang();
  if(T4[key]){ if(T4[key].ja && LANG === "ja") tip = T4[key].ja; else if(T4[key][LANG]) tip = T4[key][LANG]; }
  var U = UI4[LANG] || UI4.ja;
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
      "#areTips h3{display:block!important;margin:0 0 2px;font-size:1.15rem;color:#fff!important}#areTips .s{font-size:.78rem;opacity:.7;margin:0 0 6px}#areTips ul{margin:8px 0 14px;padding-left:1.2em;line-height:1.7;font-size:.95rem}" +
      "#areTips .ok{width:100%;min-height:48px;font-size:1rem;border:0;border-radius:12px;background:#5b7cfa;color:#fff;font-weight:700;cursor:pointer}#areTips .off{display:block;margin:8px auto 0;background:none;border:0;color:#fff;opacity:.65;text-decoration:underline;font-size:.78rem;cursor:pointer;padding:6px}";
    document.head.appendChild(css);
    m = document.createElement("div"); m.id = "areTips"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.innerHTML = '<div class="c"><h3>' + esc(tip[0]) + '</h3><p class="s">' + esc(U[0]) + '</p><ul>' + tip[1].map(function(l){ return "<li>" + esc(l) + "</li>"; }).join("") + '</ul><button type="button" class="ok">' + esc(U[1]) + '</button><button type="button" class="off">' + esc(U[2]) + '</button></div>';
    
    document.body.appendChild(m);
    m.querySelector(".ok").addEventListener("click", close);
    m.querySelector(".off").addEventListener("click", function(){ try{ localStorage.setItem(OFF, "1"); }catch(e){} close(); });
    window.addEventListener("keydown", blockKeys, true); window.addEventListener("keyup", blockKeys, true); window.addEventListener("keypress", blockKeys, true);
    try{ m.querySelector(".ok").focus({preventScroll:true}); }catch(e){ try{ m.querySelector(".ok").focus(); }catch(e2){} }
  }
  function start(){ setTimeout(show, 1200); }
  if(document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
