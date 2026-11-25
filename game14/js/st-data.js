"use strict";
/* 人気者になろう：データ（ランク・エリア・チャレンジ・特訓・ショップ）。文章は「ja|en|zh|ko」。虫は 出さない。
   お金は ぜんぶ ゲーム内の コイン（架空）。お酒・たばこ・パチンコの 場面は 20歳以上。 */
(function(){
    var ST = window.ST = window.ST || {};
    function P(s){ var a = s.split("|"); return {ja: a[0], en: a[1] != null ? a[1] : a[0], zh: a[2] != null ? a[2] : a[0], ko: a[3] != null ? a[3] : a[0]}; }
    ST.P = P;
    ST.L = function(){ return window.GK ? GK.lang() : "ja"; };
    ST.t = function(n, vars){
        if(n == null) return ""; if(typeof n === "string") return n;
        var s = n[ST.L()]; if(s == null) s = n.ja;
        return String(s).replace(/\{(\w+)\}/g, function(m, k){ return vars && vars[k] != null ? vars[k] : m; });
    };
    ST.DAYS = 90; ST.AP = 3;

    // ---- 能力 ----
    ST.STATS = [
        {id: "rhy", em: "🎵", n: P("リズム|Rhythm|节奏|리듬")}, {id: "vo", em: "🎤", n: P("うた|Vocal|歌唱|노래")}, {id: "tk", em: "💬", n: P("トーク|Talk|口才|토크")},
        {id: "bd", em: "💪", n: P("体力|Stamina|体力|체력")}, {id: "gt", em: "🔥", n: P("度胸|Guts|胆量|배짱")}, {id: "wt", em: "💡", n: P("ひらめき|Wit|机灵|번뜩임")}
    ];
    ST.STATMAP = {}; ST.STATS.forEach(function(s){ ST.STATMAP[s.id] = s; });

    // ---- ランク（ファン数）----
    var R = function(f, n, em){ return {f: f, n: P(n), em: em}; };
    ST.RANKS = [
        R(0, "無名の新人|Unknown Rookie|无名新人|무명 신인", "🌱"), R(150, "知り合いが できた|Getting Noticed|有了熟人|아는 사람이 생김", "🙂"),
        R(500, "近所の人気者|Neighborhood Favorite|街坊人气王|동네 인기인", "🏘️"), R(1400, "学校の人気者|School Star|校园人气王|학교 인기인", "🏫"),
        R(3500, "町の有名人|Town Celebrity|小镇名人|마을 유명인", "🎪"), R(8000, "ご当地スター|Local Star|地方明星|지역 스타", "⭐"),
        R(18000, "ネットで話題|Trending Online|网络热门|온라인 화제", "📱"), R(40000, "全国区|Nationwide Name|全国知名|전국구", "🗾"),
        R(90000, "テレビの顔|Face of TV|电视红人|TV의 얼굴", "📺"), R(200000, "国民的スター|National Star|国民巨星|국민 스타", "🌟"),
        R(450000, "世界の人気者|World Favorite|世界人气王|세계적 인기인", "🌏"), R(1000000, "伝説|Legend|传奇|전설", "👑")
    ];
    ST.rankOf = function(f){ var r = 0; for(var i = 0; i < ST.RANKS.length; i++) if(f >= ST.RANKS[i].f) r = i; return r; };

    // ---- エリア ----
    ST.AREAS = [
        {id: "town", em: "🏘️", rk: 0, n: P("住宅街|Neighborhood|住宅区|동네"), d: P("ここから 全てが はじまる。|Where it all begins.|一切从这里开始。|모든 것이 여기서 시작돼요."), base: 15},
        {id: "school", em: "🏫", rk: 1, n: P("学園祭|School Festival|校园祭|학교 축제"), d: P("みんなの 前で 輝こう。|Shine in front of everyone.|在大家面前闪耀吧。|모두의 앞에서 빛나자."), base: 23},
        {id: "arcade", em: "🏮", rk: 2, n: P("商店街|Shopping Street|商业街|상점가"), d: P("にぎやかな 町の 人気者に。|Become the town's favorite.|成为热闹小镇的人气王。|떠들썩한 거리의 인기인이 되자."), base: 45},
        {id: "game", em: "🕹️", rk: 3, n: P("ゲームセンター|Arcade|游戏厅|오락실"), d: P("反射神経と 集中力の 勝負。|A test of reflexes and focus.|反应力和专注力的较量。|반사신경과 집중력의 승부."), base: 70},
        {id: "izakaya", em: "🍶", rk: 4, adult: 1, n: P("居酒屋横丁|Izakaya Alley|居酒屋巷|이자카야 골목"), d: P("お酒の 場も 盛り上げ上手に。（20歳以上）|Be the life of the party. (20+)|在酒场也能带动气氛。（20岁以上）|술자리도 분위기 메이커로. (20세 이상)"), base: 115},
        {id: "pachi", em: "🎰", rk: 5, adult: 1, n: P("パチンコホール|Pachinko Hall|弹珠机店|파친코 홀"), d: P("コインは ゲーム内の ニセモノ。ハマりすぎ 注意。（20歳以上）|Fake in-game coins. Beware of getting hooked. (20+)|游戏币是假的。小心沉迷。（20岁以上）|코인은 게임 속 가짜. 빠지지 않게 주의. (20세 이상)"), base: 165},
        {id: "studio", em: "📺", rk: 6, n: P("テレビ局|TV Studio|电视台|방송국"), d: P("生放送の 緊張感。|The tension of live TV.|直播的紧张感。|생방송의 긴장감."), base: 245},
        {id: "beach", em: "🏖️", rk: 7, n: P("夏フェス・ビーチ|Beach Festival|夏日音乐节|여름 페스·해변"), d: P("夕日と 花火の ステージ。|A stage of sunsets and fireworks.|夕阳与烟花的舞台。|노을과 불꽃놀이의 무대."), base: 385},
        {id: "arena", em: "🏟️", rk: 8, n: P("ドームツアー|Dome Tour|巨蛋巡演|돔 투어"), d: P("5万人の 歓声の 中心へ。|The center of 50,000 cheers.|站到五万人欢呼的中心。|5만 명 함성의 한가운데로."), base: 610},
        {id: "world", em: "🌏", rk: 9, n: P("世界の舞台|World Stage|世界舞台|세계 무대"), d: P("伝説への 最終章。|The final chapter to legend.|通往传奇的最终章。|전설을 향한 마지막 장."), base: 1040}
    ];
    ST.AREAMAP = {}; ST.AREAS.forEach(function(a, i){ a.i = i; ST.AREAMAP[a.id] = a; });

    // ---- チャレンジ（エリアごと5つ）：type, 難しさ d, 名前 ----
    ST.CHS = []; ST.CHMAP = {};
    function C(area, id, type, d, name, o){ o = o || {}; var c = {id: id, area: area, type: type, d: d, n: P(name), rv: o.rv || 1, boss: !!o.boss, cfg: o.cfg || {}}; ST.CHS.push(c); ST.CHMAP[id] = c; }
    C("town", "t1", "rhythm", .15, "公園で ダンス練習|Dance practice in the park|在公园练舞|공원 댄스 연습");
    C("town", "t2", "timing", .15, "笑顔で あいさつ|A bright greeting|笑着打招呼|웃으며 인사");
    C("town", "t3", "catch", .2, "さしいれを キャッチ|Catch the treats|接住慰问品|간식 받기");
    C("town", "t4", "react", .2, "ご近所 早押しクイズ|Neighborhood buzzer|街坊抢答|동네 퀴즈 버튼");
    C("town", "t5", "karaoke", .25, "はじめての 路上ライブ|First street live|首次街头演出|첫 길거리 라이브", {boss: 1, rv: 1.25});
    C("school", "s1", "rhythm", .3, "文化祭ダンス|Culture-fest dance|文化祭舞蹈|문화제 댄스");
    C("school", "s2", "mood", .3, "友だちの 気持ちを 読む|Read your friend's mood|读懂朋友的心情|친구 마음 읽기");
    C("school", "s3", "mash", .3, "体育祭・綱引き|Tug of war|运动会拔河|체육대회 줄다리기");
    C("school", "s4", "memory", .3, "校歌を 暗記|Memorize the school song|背校歌|교가 외우기");
    C("school", "s5", "karaoke", .35, "合唱コンクール|Choir contest|合唱比赛|합창 대회", {boss: 1, rv: 1.25});
    C("arcade", "a1", "dart", .35, "射的で 人気者|Shooting gallery star|打靶人气王|사격 인기인");
    C("arcade", "a2", "timing", .4, "たい焼きを 焼く|Grill the taiyaki|烤鲷鱼烧|붕어빵 굽기");
    C("arcade", "a3", "scan", .4, "福引きの 当たりを さがせ|Find the lucky ticket|找中奖券|복권 찾기");
    C("arcade", "a4", "catch", .4, "福袋を キャッチ|Lucky bag catch|接福袋|복주머니 받기");
    C("arcade", "a5", "rhythm", .45, "商店街ダンス大会|Shopping-street dance contest|商店街舞蹈大赛|상점가 댄스 대회", {boss: 1, rv: 1.25});
    C("game", "g1", "react", .45, "反射神経バトル|Reflex battle|反应力对战|반사신경 배틀");
    C("game", "g2", "rhythm", .5, "リズムゲーム ハイスコア|Rhythm game high score|音游高分|리듬 게임 하이스코어");
    C("game", "g3", "memory", .5, "記憶力ゲーム|Memory game|记忆游戏|기억력 게임");
    C("game", "g4", "dart", .5, "ダーツ大会|Dart tournament|飞镖大赛|다트 대회");
    C("game", "g5", "scan", .55, "間違い探しバトル|Spot-the-odd battle|找不同对战|다른 그림 찾기 배틀", {boss: 1, rv: 1.25});
    C("izakaya", "i1", "cheers", .5, "乾杯の ノリを つくれ|Lead the toast|带动干杯气氛|건배 분위기 띄우기");
    C("izakaya", "i2", "mash", .55, "シェイカーを ふれ！|Shake the shaker!|摇调酒器！|셰이커를 흔들어!");
    C("izakaya", "i3", "mood", .55, "酔った 先輩を なだめる|Calm the tipsy senior|安抚喝醉的前辈|취한 선배 달래기");
    C("izakaya", "i4", "timing", .55, "ビールを うまく 注ぐ|Pour the perfect beer|倒好啤酒|맥주 잘 따르기");
    C("izakaya", "i5", "karaoke", .6, "スナックで 十八番|Signature song at the snack bar|在小酒吧唱拿手歌|스낵바 애창곡", {boss: 1, rv: 1.25});
    C("pachi", "p1", "pachi", .5, "はじめての 台に すわる|Your first machine|第一次坐上机台|처음 앉는 기계", {cfg: {bet: 100}});
    C("pachi", "p2", "timing", .6, "目押しに 集中|Focus on the eye-press|专注盯牌|눈 맞추기 집중");
    C("pachi", "p3", "pachi", .6, "ホールを 盛りあげる|Liven up the hall|带热店里气氛|홀 분위기 띄우기", {cfg: {bet: 200}});
    C("pachi", "p4", "scan", .6, "ホールで 友だちを さがせ|Find your friend in the hall|在店里找朋友|홀에서 친구 찾기");
    C("pachi", "p5", "pachi", .7, "ハイリスク台に 挑戦|High-stakes machine|挑战高风险机台|하이리스크 기계 도전", {boss: 1, rv: 1.25, cfg: {bet: 400}});
    C("studio", "v1", "mood", .65, "バラエティで リアクション|Variety show reactions|综艺反应|버라이어티 리액션");
    C("studio", "v2", "react", .65, "クイズ番組 早押し|Quiz show buzzer|问答节目抢答|퀴즈쇼 버튼");
    C("studio", "v3", "karaoke", .7, "歌番組 生放送|Live music show|歌唱节目直播|음악방송 생방송");
    C("studio", "v4", "rhythm", .7, "ダンス企画 生中継|Live dance segment|舞蹈企划直播|댄스 기획 생중계");
    C("studio", "v5", "timing", .7, "CMの 決めポーズ|Commercial pose|广告定格姿势|CM 결정 포즈", {boss: 1, rv: 1.25});
    C("beach", "b1", "catch", .7, "ファンの 贈り物を 受けとれ|Catch fans' gifts|接住粉丝礼物|팬 선물 받기");
    C("beach", "b2", "mash", .7, "ビーチバレー 全力ラリー|All-out beach volleyball|全力沙排对打|비치발리볼 랠리");
    C("beach", "b3", "rhythm", .75, "フェスの ステージダンス|Festival stage dance|音乐节舞台舞蹈|페스 무대 댄스");
    C("beach", "b4", "memory", .75, "花火の 順番を 暗記|Memorize the fireworks|记住烟花顺序|불꽃놀이 순서 외우기");
    C("beach", "b5", "karaoke", .8, "夕焼けの ライブ|Sunset live|夕阳下的演出|노을 라이브", {boss: 1, rv: 1.25});
    C("arena", "d1", "rhythm", .8, "ドームツアー 初日|Dome tour day one|巨蛋巡演首日|돔 투어 첫날");
    C("arena", "d2", "karaoke", .85, "5万人の 大合唱|Sing with 50,000|五万人大合唱|5만 명의 대합창");
    C("arena", "d3", "mash", .8, "アンコール 体力勝負|Encore endurance|返场体力战|앙코르 체력전");
    C("arena", "d4", "timing", .85, "ステージ演出を 決めろ|Nail the stage cue|完美掌控舞台演出|무대 연출을 맞춰라");
    C("arena", "d5", "mood", .85, "ファンの 声に こたえる|Answer your fans|回应粉丝的声音|팬의 목소리에 답하기", {boss: 1, rv: 1.25});
    C("world", "w1", "rhythm", .9, "世界ツアー 開幕|World tour opening|世界巡演开幕|월드 투어 개막");
    C("world", "w2", "memory", .9, "多言語MC|Multilingual MC|多语言主持|다국어 MC");
    C("world", "w3", "dart", .9, "世界大会 決勝|World final|世界大赛决赛|세계 대회 결승");
    C("world", "w4", "karaoke", .95, "国際音楽祭|International music festival|国际音乐节|국제 음악제");
    C("world", "w5", "rhythm", 1, "伝説の ラストステージ|The legendary last stage|传奇的最后舞台|전설의 라스트 스테이지", {boss: 1, rv: 1.4});
    ST.CHS.forEach(function(c){ c.i = ST.AREAMAP[c.area].i; });

    // ---- 特訓（ミニゲーム短縮版で 能力アップ）----
    ST.TRAIN = [
        {id: "dance", type: "rhythm", stat: "rhy", em: "💃", n: P("ダンスレッスン|Dance lesson|舞蹈课|댄스 레슨")},
        {id: "vocal", type: "karaoke", stat: "vo", em: "🎤", n: P("ボイストレーニング|Voice training|声乐训练|보이스 트레이닝")},
        {id: "talk", type: "mood", stat: "tk", em: "💬", n: P("トーク特訓|Talk drills|口才特训|토크 특훈")},
        {id: "gym", type: "mash", stat: "bd", em: "🏋️", n: P("ジムで 体力づくり|Gym stamina|健身房练体力|체력 단련")},
        {id: "focus", type: "timing", stat: "gt", em: "🎯", n: P("集中力トレ|Focus training|专注力训练|집중력 트레이닝")},
        {id: "memo", type: "memory", stat: "wt", em: "🧠", n: P("記憶力ドリル|Memory drill|记忆力训练|기억력 드릴")},
        {id: "reflex", type: "react", stat: "gt", em: "⚡", n: P("反射神経トレ|Reflex training|反应力训练|반사신경 트레이닝")},
        {id: "scan", type: "scan", stat: "wt", em: "🔍", n: P("観察力ドリル|Observation drill|观察力训练|관찰력 드릴")}
    ];

    // ---- ショップ（コイン）----
    ST.SHOP = [
        {id: "outfit", em: "👗", max: 5, price: function(l){ return Math.round(300 * Math.pow(3.2, l)); }, n: P("ステージ衣装|Stage outfit|舞台服装|무대 의상"), d: P("ファンが ふえやすく なる（+6%/Lv）|More fans per win (+6%/Lv)|更容易涨粉（+6%/级）|팬이 늘기 쉬워져요 (+6%/Lv)")},
        {id: "gear", em: "🎧", max: 3, price: function(l){ return Math.round(500 * Math.pow(3, l)); }, n: P("プロの機材|Pro gear|专业设备|프로 장비"), d: P("ミニゲームが やさしく なる（+5%/Lv）|Mini-games get easier (+5%/Lv)|小游戏更容易（+5%/级）|미니게임이 쉬워져요 (+5%/Lv)")},
        {id: "coach", em: "🧑‍🏫", max: 3, price: function(l){ return Math.round(400 * Math.pow(3, l)); }, n: P("専属コーチ|Personal coach|专属教练|전담 코치"), d: P("特訓の のびが 大きく（+25%/Lv）|Training gains +25%/Lv|特训提升更大（+25%/级）|특훈 성장 +25%/Lv")},
        {id: "poster", em: "🪧", max: 3, price: function(l){ return Math.round(350 * Math.pow(3, l)); }, n: P("宣伝ポスター|Promo posters|宣传海报|홍보 포스터"), d: P("ファン獲得 +5%/Lv|Fan gain +5%/Lv|涨粉 +5%/级|팬 획득 +5%/Lv")},
        {id: "drink", em: "🥤", max: 99, price: function(){ return 120; }, cons: 1, n: P("栄養ドリンク|Energy drink|能量饮料|에너지 드링크"), d: P("コンディション +40|Condition +40|状态 +40|컨디션 +40")}
    ];
    ST.SHOPMAP = {}; ST.SHOP.forEach(function(s){ ST.SHOPMAP[s.id] = s; });

    // ---- 画面の ことば ----
    ST.TX = {
        ja: {
            title: "人気者になろう", sub: "90日で、無名の新人から「伝説」へ。ダンス・歌・トーク…いろんなチャレンジと特訓で ファンを ふやそう！",
            new: "▶ はじめから", cont: "▶ つづきから（{d}日め）", daily: "📅 きょうの チャレンジ", coll: "🏆 ずかん", how: "📖 あそびかた",
            note: "お酒・たばこ・パチンコの場面が あります（20歳以上）。コインは すべて ゲーム内の ニセモノです。進み具合は この端末に 保存されます。",
            howT: "あそびかた",
            howL: ["🌟 90日の あいだに、ファンを ふやして「人気者」を めざそう。ファンが ふえると ランクが あがり、あたらしい エリアが ひらく。", "📅 1日に できる ことは 3回（行動）。チャレンジ・特訓・おやすみ から えらぶ。", "🎯 チャレンジは ミニゲーム！ ダンス・歌・早押し・記憶… 成績で ★が つき、ファンが もらえる。", "💪 特訓で 能力が のびると、ミニゲームが やさしくなる。コンディション（元気）が ひくいと ミスが ふえるので 休もう。", "🎰 お酒・たばこ・パチンコには 危険も。パチンコの コインは ゲーム内の ニセモノで、平均では 必ず へります。", "🏆 90日で エンディング。ランクが 高いほど すごい結末に。連続成功で ボーナス！"],
            suT: "どんな タイプで はじめる？", suName: "なまえ", suPh: "あなた", suGo: "▶ この タイプで はじめる", back: "もどる",
            ty_dance: "ダンサー", ty_vocal: "シンガー", ty_talk: "おしゃべり", ty_guts: "ガッツ",
            dayN: "{d}日め / {m}", ap: "行動 {n}", cond: "元気", coins: "コイン", fans: "ファン", rank: "ランク", next: "次のランクまで {n}", maxRank: "最高ランク！",
            hChal: "🎯 チャレンジ", hTrain: "💪 特訓", hRest: "🛌 やすむ", hShop: "🛍️ ショップ", hStat: "📋 ステータス", hEnd: "🌙 1日を おわる", hMenu: "☰ メニュー",
            locked: "🔒 ランク「{r}」で かいほう", stars: "★", start: "▶ スタート", best: "ベスト {n}%", firstClear: "初クリアボーナス！", boss: "ボス",
            trainT: "どの 特訓を する？", trainGain: "{s} +{n}", needAp: "行動が のこっていません", noEnergy: "元気が たりない…休もう",
            restDo: "ぐっすり 休んだ。コンディションが 回復した！", shopT: "ショップ", buy: "買う", maxed: "MAX", poor: "コインが たりない", bought: "買った！", drinkUse: "栄養ドリンクを 飲んだ！（元気 +40）", own: "もっている: {n}", use: "飲む",
            statT: "ステータス", achT: "じっせき",
            pause: "一時停止", resume: "▶ つづける", quit: "あきらめる", quitQ: "この チャレンジを やめますか？", yes: "はい", no: "いいえ",
            resT: "けっか", resFail: "ざんねん…", res1: "クリア！", res2: "すばらしい！", res3: "パーフェクト！！", fansGain: "ファン +{n}", coinsGain: "コイン {n}", streak: "連続 {n}", again: "▶ もういちど", okBtn: "つぎへ", toHome: "ホームへ",
            rankUp: "ランクアップ！", newArea: "新エリア かいほう！", scoreLine: "成績 {n}%",
            dayEnd: "{d}日目 おつかれさま", sleep: "ぐっすり ねむる…", event: "できごと",
            endT: "90日の おわり", score: "ファン {n}人", bestFans: "ベスト {n}人", newEnd: "NEW", endColl: "🏆 ずかん", toTitle: "タイトルへ", newAch: "新しい 実績",
            cT: "ずかん", cEnd: "エンディング", cAch: "じっせき", cStar: "チャレンジ", cCount: "{a} / {b} かいほう", unknown: "？？？",
            dailyBadge: "📅 きょうの 特別チャレンジ（ファン2倍・1日1回）", dailyDone: "きょうの 分は クリア済み", saved: "セーブしました",
            warnPachi: "※ コインは ゲーム内の ニセモノ。大当たりも ありますが、平均では 必ず へります。", warnDrink: "お酒は ほどほどに。", habit: "くせ", gam: "ハマり度", drk: "お酒", smk: "たばこ", hlt: "体調",
            saveTitle: "セーブして タイトルへ", giveUp: "この 90日を おわる", giveUpQ: "ここで おわりにして エンディングを 見ますか？",
            tutorial: "💡 まず「チャレンジ」か「特訓」を えらぼう。1日 3回 できるよ。", tut2: "💡 ミニゲームの 操作：タップ／A ボタン。画面の 説明を 見てね。",
            cond0: "元気が 少ない！ミスが ふえるよ", ctl_rhythm: "4つの レーンに 合わせて タップ／十字キー／A B X Y", ctl_karaoke: "線に 合わせて 上下に ドラッグ／↑↓", ctl_timing: "ちょうど いい所で タップ／A", ctl_mash: "れんだ！ タップ／A（どれでも）", ctl_mood: "同じ 気持ちの 顔を えらぶ", ctl_react: "合図が 出たら すぐ タップ／A", ctl_memory: "光った じゅんに 押す（十字キー／タップ）", ctl_dart: "まとの 真ん中で タップ／A", ctl_catch: "左右に うごかして キャッチ（ドラッグ／←→）", ctl_pachi: "強さを きめて 発射（タップ／A）", ctl_cheers: "リングが 重なる 瞬間に タップ／A", ctl_scan: "ひとつだけ ちがう ものを タップ／十字＋A",
            go: "GO!", ready: "よーい…", perfect: "PERFECT", great: "GREAT", good: "GOOD", miss: "MISS", combo: "{n} COMBO", timeUp: "TIME UP", clear: "CLEAR"
        },
        en: {
            title: "Become a Star!", sub: "In 90 days, go from unknown rookie to “Legend”. Win fans with dance, song, talk and more through challenges and training!",
            new: "▶ New game", cont: "▶ Continue (day {d})", daily: "📅 Daily challenge", coll: "🏆 Collection", how: "📖 How to play",
            note: "Contains drinking, smoking and pachinko scenes (ages 20+). All coins are fictional in-game coins. Progress is saved on this device.",
            howT: "How to play",
            howL: ["🌟 You have 90 days to grow your fanbase. More fans raise your rank and unlock new areas.", "📅 You get 3 actions per day: Challenge, Training or Rest.", "🎯 Challenges are mini-games! Dance, song, reflexes, memory… Your score gives ★ stars and fans.", "💪 Training raises stats and makes mini-games easier. Low Condition causes mistakes, so rest.", "🎰 Drinking, smoking and pachinko carry risks. Pachinko coins are fake in-game coins and always lose on average.", "🏆 After 90 days you get an ending. The higher the rank, the better! Streaks give bonuses."],
            suT: "Which type are you?", suName: "Name", suPh: "You", suGo: "▶ Start as this type", back: "Back",
            ty_dance: "Dancer", ty_vocal: "Singer", ty_talk: "Talker", ty_guts: "Daredevil",
            dayN: "Day {d} / {m}", ap: "Actions {n}", cond: "Condition", coins: "Coins", fans: "Fans", rank: "Rank", next: "{n} to next rank", maxRank: "Top rank!",
            hChal: "🎯 Challenge", hTrain: "💪 Training", hRest: "🛌 Rest", hShop: "🛍️ Shop", hStat: "📋 Status", hEnd: "🌙 End the day", hMenu: "☰ Menu",
            locked: "🔒 Unlocks at rank “{r}”", stars: "★", start: "▶ Start", best: "Best {n}%", firstClear: "First-clear bonus!", boss: "Boss",
            trainT: "Which training?", trainGain: "{s} +{n}", needAp: "No actions left", noEnergy: "Too tired… rest up",
            restDo: "You slept well. Condition restored!", shopT: "Shop", buy: "Buy", maxed: "MAX", poor: "Not enough coins", bought: "Bought!", drinkUse: "You drank an energy drink! (Condition +40)", own: "Owned: {n}", use: "Drink",
            statT: "Status", achT: "Badges",
            pause: "Paused", resume: "▶ Resume", quit: "Give up", quitQ: "Quit this challenge?", yes: "Yes", no: "No",
            resT: "Result", resFail: "Too bad…", res1: "Clear!", res2: "Great job!", res3: "Perfect!!", fansGain: "Fans +{n}", coinsGain: "Coins {n}", streak: "Streak {n}", again: "▶ Again", okBtn: "Next", toHome: "Home",
            rankUp: "RANK UP!", newArea: "New area unlocked!", scoreLine: "Score {n}%",
            dayEnd: "End of day {d}", sleep: "Sleeping…", event: "Event",
            endT: "The 90 days end", score: "{n} fans", bestFans: "Best {n} fans", newEnd: "NEW", endColl: "🏆 Collection", toTitle: "Title", newAch: "New badges",
            cT: "Collection", cEnd: "Endings", cAch: "Badges", cStar: "Challenges", cCount: "{a} / {b} unlocked", unknown: "???",
            dailyBadge: "📅 Today's special challenge (2× fans, once a day)", dailyDone: "Today's already cleared", saved: "Saved",
            warnPachi: "※ Fake in-game coins. Big wins exist, but on average you lose.", warnDrink: "Drink in moderation.", habit: "Habits", gam: "Gambling", drk: "Drinking", smk: "Smoking", hlt: "Health",
            saveTitle: "Save & go to title", giveUp: "End these 90 days", giveUpQ: "End here and see your ending?",
            tutorial: "💡 Start by choosing “Challenge” or “Training”. You get 3 actions a day.", tut2: "💡 Mini-game controls: tap / A button. Read the hint on screen.",
            cond0: "Low condition! More mistakes", ctl_rhythm: "Tap the 4 lanes / D-pad / A B X Y", ctl_karaoke: "Drag up/down to follow the line / ↑↓", ctl_timing: "Tap at the right moment / A", ctl_mash: "Mash! Tap / A (any)", ctl_mood: "Pick the face with the same mood", ctl_react: "Tap the instant the signal appears / A", ctl_memory: "Repeat the lit order (D-pad / tap)", ctl_dart: "Tap when on the bullseye / A", ctl_catch: "Move left/right to catch (drag / ←→)", ctl_pachi: "Set power and fire (tap / A)", ctl_cheers: "Tap as the rings align / A", ctl_scan: "Tap the one that differs / D-pad + A",
            go: "GO!", ready: "Ready…", perfect: "PERFECT", great: "GREAT", good: "GOOD", miss: "MISS", combo: "{n} COMBO", timeUp: "TIME UP", clear: "CLEAR"
        },
        zh: {
            title: "成为人气王", sub: "90天内，从无名新人成为“传奇”。通过舞蹈、歌唱、口才等挑战与特训来赢得粉丝！",
            new: "▶ 新游戏", cont: "▶ 继续（第{d}天）", daily: "📅 每日挑战", coll: "🏆 图鉴", how: "📖 玩法",
            note: "含有饮酒、吸烟、弹珠机场景（20岁以上）。游戏币全部是虚构的。进度保存在本设备中。",
            howT: "玩法",
            howL: ["🌟 在90天内增加粉丝，成为人气王。粉丝越多排名越高，并解锁新区域。", "📅 每天有3次行动：挑战、特训或休息。", "🎯 挑战就是小游戏！舞蹈、歌唱、反应、记忆……成绩决定★星和粉丝。", "💪 特训提升能力，小游戏会变简单。状态低会失误增多，要记得休息。", "🎰 饮酒、吸烟、弹珠机都有风险。弹珠机用游戏币，平均一定会亏。", "🏆 90天后迎来结局。排名越高结局越好！连续成功有奖励。"],
            suT: "选择你的类型", suName: "名字", suPh: "你", suGo: "▶ 以此类型开始", back: "返回",
            ty_dance: "舞者", ty_vocal: "歌手", ty_talk: "话痨", ty_guts: "胆大",
            dayN: "第{d}天 / {m}", ap: "行动 {n}", cond: "状态", coins: "游戏币", fans: "粉丝", rank: "排名", next: "距下一级 {n}", maxRank: "最高排名！",
            hChal: "🎯 挑战", hTrain: "💪 特训", hRest: "🛌 休息", hShop: "🛍️ 商店", hStat: "📋 状态", hEnd: "🌙 结束今天", hMenu: "☰ 菜单",
            locked: "🔒 达到“{r}”解锁", stars: "★", start: "▶ 开始", best: "最佳 {n}%", firstClear: "首次通关奖励！", boss: "首领",
            trainT: "做哪种特训？", trainGain: "{s} +{n}", needAp: "没有行动次数了", noEnergy: "太累了……先休息",
            restDo: "睡得很香，状态恢复了！", shopT: "商店", buy: "购买", maxed: "MAX", poor: "游戏币不足", bought: "已购买！", drinkUse: "喝了能量饮料！（状态+40）", own: "持有：{n}", use: "喝",
            statT: "状态", achT: "成就",
            pause: "暂停", resume: "▶ 继续", quit: "放弃", quitQ: "要放弃这个挑战吗？", yes: "是", no: "否",
            resT: "结果", resFail: "可惜……", res1: "通关！", res2: "太棒了！", res3: "完美！！", fansGain: "粉丝 +{n}", coinsGain: "游戏币 {n}", streak: "连续 {n}", again: "▶ 再来一次", okBtn: "继续", toHome: "回主页",
            rankUp: "排名上升！", newArea: "解锁新区域！", scoreLine: "成绩 {n}%",
            dayEnd: "第{d}天结束", sleep: "睡觉中……", event: "事件",
            endT: "90天结束", score: "粉丝 {n}人", bestFans: "最高 {n}人", newEnd: "NEW", endColl: "🏆 图鉴", toTitle: "标题", newAch: "新成就",
            cT: "图鉴", cEnd: "结局", cAch: "成就", cStar: "挑战", cCount: "已解锁 {a} / {b}", unknown: "？？？",
            dailyBadge: "📅 今日特别挑战（粉丝×2，每天一次）", dailyDone: "今天已通关", saved: "已存档",
            warnPachi: "※ 游戏币是虚构的。也有大奖，但平均一定会亏。", warnDrink: "饮酒要适度。", habit: "习惯", gam: "沉迷度", drk: "酒", smk: "烟", hlt: "身体",
            saveTitle: "存档并回标题", giveUp: "结束这90天", giveUpQ: "就此结束并查看结局吗？",
            tutorial: "💡 先选“挑战”或“特训”。每天可以行动3次。", tut2: "💡 小游戏操作：点击/A键。请看屏幕提示。",
            cond0: "状态很低！失误会增多", ctl_rhythm: "点击4条轨道/十字键/A B X Y", ctl_karaoke: "上下拖动跟随线条/↑↓", ctl_timing: "在合适的时机点击/A", ctl_mash: "连打！点击/A（任意）", ctl_mood: "选出心情相同的脸", ctl_react: "信号出现立刻点击/A", ctl_memory: "按亮起的顺序点击（十字键/点击）", ctl_dart: "在靶心时点击/A", ctl_catch: "左右移动接住（拖动/←→）", ctl_pachi: "决定力度并发射（点击/A）", ctl_cheers: "圆环重合时点击/A", ctl_scan: "点击唯一不同的一个/十字键+A",
            go: "GO!", ready: "预备……", perfect: "PERFECT", great: "GREAT", good: "GOOD", miss: "MISS", combo: "{n} COMBO", timeUp: "TIME UP", clear: "CLEAR"
        },
        ko: {
            title: "인기인이 되자", sub: "90일 안에 무명 신입에서 '전설'로! 댄스·노래·토크… 다양한 챌린지와 특훈으로 팬을 늘려요!",
            new: "▶ 처음부터", cont: "▶ 이어하기 ({d}일째)", daily: "📅 오늘의 챌린지", coll: "🏆 도감", how: "📖 하는 법",
            note: "음주·흡연·파친코 장면이 있습니다(20세 이상). 코인은 모두 게임 속 가짜입니다. 진행 상황은 이 기기에 저장됩니다.",
            howT: "하는 법",
            howL: ["🌟 90일 동안 팬을 늘려 인기인이 되세요. 팬이 늘면 랭크가 오르고 새 지역이 열립니다.", "📅 하루에 3번 행동할 수 있어요: 챌린지, 특훈, 휴식.", "🎯 챌린지는 미니게임! 댄스·노래·반사신경·기억… 성적에 따라 ★와 팬을 얻어요.", "💪 특훈으로 능력이 오르면 미니게임이 쉬워져요. 컨디션이 낮으면 실수가 늘어요.", "🎰 술·담배·파친코는 위험도 있어요. 파친코 코인은 게임 속 가짜이며 평균적으로 반드시 잃어요.", "🏆 90일 후 엔딩. 랭크가 높을수록 멋진 결말! 연속 성공 보너스."],
            suT: "어떤 타입으로 시작할까?", suName: "이름", suPh: "당신", suGo: "▶ 이 타입으로 시작", back: "뒤로",
            ty_dance: "댄서", ty_vocal: "싱어", ty_talk: "수다쟁이", ty_guts: "강심장",
            dayN: "{d}일째 / {m}", ap: "행동 {n}", cond: "컨디션", coins: "코인", fans: "팬", rank: "랭크", next: "다음 랭크까지 {n}", maxRank: "최고 랭크!",
            hChal: "🎯 챌린지", hTrain: "💪 특훈", hRest: "🛌 휴식", hShop: "🛍️ 상점", hStat: "📋 상태", hEnd: "🌙 하루 끝내기", hMenu: "☰ 메뉴",
            locked: "🔒 랭크 '{r}'에서 해금", stars: "★", start: "▶ 시작", best: "최고 {n}%", firstClear: "첫 클리어 보너스!", boss: "보스",
            trainT: "어떤 특훈을 할까?", trainGain: "{s} +{n}", needAp: "남은 행동이 없어요", noEnergy: "너무 피곤해요… 쉬세요",
            restDo: "푹 잤어요. 컨디션이 회복됐어요!", shopT: "상점", buy: "구매", maxed: "MAX", poor: "코인이 부족해요", bought: "구매했어요!", drinkUse: "에너지 드링크를 마셨어요! (컨디션 +40)", own: "보유: {n}", use: "마시기",
            statT: "상태", achT: "업적",
            pause: "일시정지", resume: "▶ 계속", quit: "포기", quitQ: "이 챌린지를 그만둘까요?", yes: "예", no: "아니요",
            resT: "결과", resFail: "아쉬워요…", res1: "클리어!", res2: "훌륭해요!", res3: "퍼펙트!!", fansGain: "팬 +{n}", coinsGain: "코인 {n}", streak: "연속 {n}", again: "▶ 다시", okBtn: "다음", toHome: "홈으로",
            rankUp: "랭크 업!", newArea: "새 지역 해금!", scoreLine: "성적 {n}%",
            dayEnd: "{d}일째 수고했어요", sleep: "푹 자는 중…", event: "사건",
            endT: "90일의 끝", score: "팬 {n}명", bestFans: "최고 {n}명", newEnd: "NEW", endColl: "🏆 도감", toTitle: "타이틀", newAch: "새 업적",
            cT: "도감", cEnd: "엔딩", cAch: "업적", cStar: "챌린지", cCount: "{a} / {b} 해금", unknown: "???",
            dailyBadge: "📅 오늘의 특별 챌린지 (팬 2배, 하루 한 번)", dailyDone: "오늘 분은 클리어했어요", saved: "저장했어요",
            warnPachi: "※ 코인은 게임 속 가짜. 대박도 있지만 평균적으로 반드시 잃어요.", warnDrink: "술은 적당히.", habit: "버릇", gam: "도박", drk: "음주", smk: "흡연", hlt: "건강",
            saveTitle: "저장하고 타이틀로", giveUp: "이 90일을 끝내기", giveUpQ: "여기서 끝내고 엔딩을 볼까요?",
            tutorial: "💡 먼저 '챌린지'나 '특훈'을 고르세요. 하루 3번 할 수 있어요.", tut2: "💡 미니게임 조작: 탭 / A 버튼. 화면의 설명을 보세요.",
            cond0: "컨디션이 낮아요! 실수가 늘어요", ctl_rhythm: "4개의 레인에 맞춰 탭/십자키/A B X Y", ctl_karaoke: "선에 맞춰 위아래로 드래그/↑↓", ctl_timing: "딱 좋은 때에 탭/A", ctl_mash: "연타! 탭/A (아무거나)", ctl_mood: "같은 기분의 얼굴을 고르기", ctl_react: "신호가 나오면 바로 탭/A", ctl_memory: "빛난 순서대로 누르기 (십자키/탭)", ctl_dart: "과녁 한가운데서 탭/A", ctl_catch: "좌우로 움직여 받기 (드래그/←→)", ctl_pachi: "세기를 정해 발사 (탭/A)", ctl_cheers: "링이 겹치는 순간 탭/A", ctl_scan: "하나만 다른 것을 탭/십자키+A",
            go: "GO!", ready: "준비…", perfect: "PERFECT", great: "GREAT", good: "GOOD", miss: "MISS", combo: "{n} COMBO", timeUp: "TIME UP", clear: "CLEAR"
        }
    };
    ST.tx = function(k, v){ var d = ST.TX[ST.L()] || ST.TX.ja, s = d[k]; if(s == null) s = ST.TX.ja[k]; if(s == null) s = k; return v ? String(s).replace(/\{(\w+)\}/g, function(m, q){ return v[q] != null ? v[q] : m; }) : s; };

    // ---- 最初のタイプ ----
    ST.TYPES = [
        {id: "dance", em: "💃", st: {rhy: 22, vo: 8, tk: 10, bd: 16, gt: 10, wt: 8}},
        {id: "vocal", em: "🎤", st: {rhy: 10, vo: 22, tk: 12, bd: 8, gt: 10, wt: 12}},
        {id: "talk", em: "🗣️", st: {rhy: 8, vo: 10, tk: 22, bd: 8, gt: 14, wt: 14}},
        {id: "guts", em: "🔥", st: {rhy: 10, vo: 8, tk: 10, bd: 20, gt: 22, wt: 8}}
    ];
})();
