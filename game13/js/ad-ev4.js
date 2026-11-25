"use strict";
/* 20歳の冒険：イベント4（行動のあとに起こる：パチンコ・飲み会・友だち・デート・ギャンブル/お酒の注意） */
(function(){
    var AD = window.AD || globalThis.AD, E = AD.E, C = AD.C, O = AD.O, N = AD.N, W = AD.W, Q = AD.Q, X = AD.X;
    var money = function(n){ return function(S){ return S.money >= n; }; };

    // ===== パチンコ（賭けは ゲーム内の コインだけ。やりすぎの こわさも ちゃんと 見せる） =====
    Q("pachi_neighbor", {src: "pachi", w: 1.2}, N("隣の 常連さん", "The regular next to you", "旁边的常客", "옆자리 단골"),
        N("となりの おじさんが 「兄ちゃん、勝ってる うちに やめるのが いちばんだ」と ぼそり。 経験者の 言葉は 重い。", "The man beside you mutters: \"Quit while you're ahead, kid.\" A veteran's words weigh a lot.", "旁边的大叔嘟囔道：“小伙子，赢着的时候收手最好”。过来人的话分量很重。", "옆자리 아저씨가 \"젊은이, 따고 있을 때 그만두는 게 최고야\" 하고 중얼거려요. 경험자의 말은 무거워요."),
        [N("言われた とおり やめる", "Quit as advised", "听劝收手", "말대로 그만둔다"), {gam: -4, mp: 3, knw: 1}, N("席を たつ。 外の 空気が うまい。 …やめられる自分が ちょっと 誇らしい。", "You leave. The outside air tastes good. …A little proud you could stop.", "离开座位。外面的空气真好。……能收手的自己有点自豪。", "자리를 떠요. 바깥 공기가 맛있어요. …그만둘 수 있는 내가 조금 자랑스러워요.")],
        [N("「あと ちょっと だけ」", "\"Just a little more\"", "“再玩一会儿”", "\"조금만 더\""), {money: -6000, gam: 5, mp: -4}, N("気づけば 2時間。 『あと ちょっと』は 魔法の ことば。", "Two hours gone. \"Just a little more\" is a magic phrase.", "回过神来已经2小时了。“再玩一会儿”是魔法咒语。", "정신 차리니 2시간. '조금만 더'는 마법의 말이에요.")]);
    E("pachi_hot", {src: "pachi", w: 1}, N("「出る台」の うわさ", "A rumor about a \"hot machine\"", "“会出的机台”传闻", "\"터지는 기계\" 소문"),
        N("店内で 「あの台、今日 出るらしい」 と ひそひそ声。 ほんとか うそか…。 ※ 実際には 台の 当たりは ランダムです。", "Whispers in the hall: \"That machine's supposed to pay out today.\" True or false… (In reality, outcomes are random.)", "店里有人窃窃私语：“那台今天好像会出”。真的假的……※实际上机台的中奖是随机的。", "매장에서 \"저 기계 오늘 터진대\" 하는 수군거림. 진짜일까… ※실제로 기계의 당첨은 무작위예요."), [
        C(N("噂を 信じない", "Don't believe the rumor", "不信传闻", "소문을 믿지 않는다"), [O(1, {knw: 1, mp: 2}, N("確率は 毎回 リセット。 ジンクスに 頼らない。", "Odds reset every time. No reliance on superstition.", "概率每次重置。不依赖迷信。", "확률은 매번 초기화. 징크스에 기대지 않아요."))]),
        X(N("その台に 座る（¥15,000）", "Sit at it (¥15,000)", "坐上那台（¥15,000）", "그 기계에 앉는다(¥15,000)"), [{money: 25000, gam: 6, mp: 8}, N("たまたま 当たった。 …でも これで 「勝てる」と 思ったら 危険信号。", "It happened to hit. …But thinking \"I can win\" is a danger sign.", "碰巧中了。……可要是因此觉得“能赢”就是危险信号。", "우연히 터졌어요. …하지만 이걸로 \"이길 수 있다\"고 생각하면 위험 신호예요.")], [{money: -15000, gam: 5, mp: -8}, N("当然 出なかった。 噂は ただの 噂。", "Of course it didn't pay out. A rumor is just a rumor.", "当然没出。传闻就只是传闻。", "당연히 안 터졌어요. 소문은 그냥 소문.")], {base: .28}, {need: money(15000)})
    ]);
    Q("pachi_friend", {src: "pachi", w: 1, need: function(S){ return S.rel.ken >= 20; }}, N("ばったり {ken}", "Running into {ken}", "偶遇{ken}", "{ken}와(과) 딱 마주침"),
        N("店の 出口で {ken}と 目が あった。「お前 こんな ところ で 何してんの…」 気まずい 沈黙。", "At the exit, you lock eyes with {ken}: \"What are you doing here…\" An awkward silence.", "在店门口和{ken}四目相对：“你在这种地方干嘛……”尴尬的沉默。", "가게 출구에서 {ken}와(과) 눈이 마주쳤어요. \"너 이런 데서 뭐 해…\" 어색한 침묵."),
        [N("正直に 話して 相談する", "Be honest and talk it over", "坦白并商量", "솔직하게 얘기하고 상담"), {gam: -8, mp: 4, rel: {ken: 5}}, N("「まあ 俺も 他人の こと 言えないけど。 ほどほどに な」", "\"Well, I can't talk. Just keep it moderate.\"", "“我也没资格说别人。适可而止吧”。", "\"뭐 나도 남 말 할 처지는 아니지만. 적당히 해\"")],
        [N("笑って ごまかす", "Laugh it off", "笑着糊弄过去", "웃으며 얼버무린다"), {mp: -4, rel: {ken: -3}, gam: 2}, N("{ken}の 目は 笑って いなかった。", "{ken}'s eyes weren't smiling.", "{ken}的眼睛里没有笑意。", "{ken}의 눈은 웃지 않았어요.")]);
    E("pachi_reflect", {src: "pachi", w: 3, need: function(S){ return (S.cnt.pachiNet || 0) <= -30000; }}, N("ふと 我に かえる", "A moment of clarity", "忽然清醒", "문득 정신이 든다"),
        N("ポケットの レシートを 数えた。 今まで 負けた 合計は ¥{n}…。 そのお金で なにが できただろう。", "You tally the receipts in your pocket. Total losses so far… what could that money have done?", "数了数口袋里的小票。到目前为止输掉的总额……这笔钱本来能做什么呢。", "주머니 속 영수증을 세어 봤어요. 지금까지 잃은 합계… 그 돈으로 뭘 할 수 있었을까요."), [
        C(N("今日で やめると 決める", "Decide to stop for good", "决定今天起戒掉", "오늘로 그만두기로 결심"), [O(1, {gam: -22, mp: 8, knw: 2}, N("【決意】 台に 座らず そのまま 帰った。 足どりが 軽い。", "RESOLVE: you went home without sitting down. Your steps feel light.", "【决心】没有坐下就直接回家了。脚步轻快。", "【결심】 앉지 않고 그대로 집에 갔어요. 발걸음이 가벼워요."), {set: "pachi_limit"})]),
        C(N("取りかえす…つもり", "I'll win it back…", "打算赢回来……", "되찾을 생각…"), [O(1, {gam: 6, mp: -6, money: -4000}, N("『取りかえす』は いちばん 危ない 考え。", "\"Win it back\" is the most dangerous thought.", "“赢回来”是最危险的想法。", "'되찾는다'는 가장 위험한 생각이에요."))])
    ]);
    E("gam_urge", {rep: 1, cd: 5, w: 3, need: function(S){ return S.gam >= 50; }}, N("また 行きたい", "The urge to go again", "又想去了", "또 가고 싶다"),
        N("頭の なかで 当たりの 音が 鳴りひびく。 手が 勝手に スマホで 近くの 店を 検索している…。", "The sound of a jackpot rings in your head. Your hand is searching for nearby halls on its own…", "脑海里回响着中奖的声音。手自己在用手机搜索附近的店……", "머릿속에서 당첨 소리가 울려요. 손이 저절로 폰으로 근처 가게를 검색하고 있어요…"), [
        X(N("ぐっと こらえる", "Hold off", "忍住", "꾹 참는다"), [{gam: -9, mp: 3, knw: 1}, N("深呼吸して ジムへ。 衝動は 波のように 去っていった。", "You breathed deep and went to the gym. The urge passed like a wave.", "深呼吸后去了健身房。冲动如潮水般退去。", "심호흡하고 헬스장으로. 충동은 파도처럼 지나갔어요.")], [{gam: 3, money: -12000, mp: -6}, N("がまん できなかった…。 気づけば 夜に なっていた。", "You couldn't resist… and suddenly it was night.", "没能忍住……回过神来已是夜晚。", "참지 못했어요… 정신 차리니 밤이었어요.")], {base: .35, s: ["mp"], k: .004, f: {pachi_limit: .25}}),
        C(N("ケンタに 電話して 話す", "Call Kenta and talk", "给健太打电话聊聊", "켄타에게 전화해 얘기"), [O(1, {gam: -12, mp: 4, rel: {ken: 4}}, N("「話してくれて ありがとな」 話すだけで 気持ちが 軽くなった。", "\"Thanks for telling me.\" Just talking lightened you.", "“谢谢你告诉我”。光是说出来就轻松了。", "\"얘기해 줘서 고마워\" 말하는 것만으로 마음이 가벼워졌어요."))], {need: function(S){ return S.rel.ken >= 20; }}),
        C(N("行ってしまう", "Give in and go", "忍不住去了", "그냥 가 버린다"), [O(1, {gam: 6, money: -12000, mp: -4}, N("負けて 帰る 道は いつも 長い。", "The walk home after losing is always long.", "输了回家的路总是格外漫长。", "잃고 돌아오는 길은 늘 길어요."))])
    ]);
    Q("loan_offer", {w: 2, need: function(S){ return S.money < 12000 && S.gam >= 25 && !S.flags.loan; }}, N("「すぐ 借りられます」", "\"Borrow instantly\"", "“马上就能借到”", "\"바로 빌릴 수 있어요\""),
        N("財布が ほぼ からっぽの 夜、スマホに 「最短 即日 融資！」の 広告。 指が 勝手に タップしそうに なる…。", "On a night when your wallet is nearly empty, an ad pops up: \"Same-day loans!\" Your finger almost taps on its own…", "钱包几乎见底的夜晚，手机弹出广告“最快当天放款！”手指差点自己点了下去……", "지갑이 거의 빈 밤, 폰에 \"최단 당일 융자!\" 광고. 손가락이 저절로 누를 뻔해요…"),
        [N("借りない。 地道に かせぐ", "Don't borrow. Earn steadily", "不借。踏实赚钱", "빌리지 않는다. 착실히 번다"), {mp: -2, knw: 2}, N("借金に 手を 出さなかった。 これが いちばん 賢い。", "You didn't touch debt. The wisest choice.", "没有碰借款。这是最聪明的选择。", "빚에 손대지 않았어요. 가장 현명해요.")],
        [N("借りる（¥50,000）", "Borrow (¥50,000)", "借钱（¥50,000）", "빌린다(¥50,000)"), {money: 50000, mp: 3}, N("あっさり 入金。 …返す日が 6週間後に やってくる。", "Deposited instantly. …The repayment day arrives in six weeks.", "轻易到账。……还款日将在6周后到来。", "순식간에 입금. …갚는 날이 6주 뒤에 와요."), {set: "loan", q: ["loan_due", 6]}]);
    E("loan_due", {src: "sys"}, N("返済日", "Repayment day", "还款日", "상환일"),
        N("アプリに 「ご返済額 ¥62,000」。 借りた 額より ずっと 多い。 利息の 重さを はじめて 知る。", "The app says \"Amount due ¥62,000.\" Far more than you borrowed. You learn the weight of interest.", "App上显示“应还金额¥62,000”。比借的多得多。第一次体会到利息的分量。", "앱에 \"상환액 ¥62,000\". 빌린 것보다 훨씬 많아요. 이자의 무게를 처음 알았어요."), [
        C(N("返す", "Pay it", "还钱", "갚는다"), [O(1, {money: -62000, mp: -6, knw: 3}, N("『借りる前に もう一度 考える』と 心に きざんだ。", "You vowed: \"Think twice before borrowing.\"", "心里刻下了“借钱之前再想一想”。", "'빌리기 전에 한 번 더 생각한다'고 마음에 새겼어요."), {clr: "loan"})])
    ]);
    Q("gam_friend", {rep: 1, cd: 10, w: 2, need: function(S){ return S.gam >= 35 && S.rel.ken >= 20; }}, N("{ken}の 心配", "{ken} is worried", "{ken}的担心", "{ken}의 걱정"),
        N("{ken}が 真剣な 顔で 言う。「最近 お前、金 ないって いつも 言ってるけど…ギャンブル しすぎてない？」", "{ken} says seriously: \"You keep saying you're broke lately… aren't you gambling too much?\"", "{ken}一脸认真地说：“你最近老说没钱……是不是赌太多了？”", "{ken}이(가) 진지한 얼굴로 말해요. \"요즘 너 돈 없다고만 하는데… 도박 너무 하는 거 아냐?\""),
        [N("素直に 認めて 相談する", "Admit it and ask for help", "坦率承认并求助", "솔직히 인정하고 상담"), {gam: -14, mp: 4, rel: {ken: 6}}, N("「いっしょに 減らそう」 その一言で 救われた。", "\"Let's cut back together.\" That line saved you.", "“一起减少吧”。这句话救了你。", "\"같이 줄이자\" 그 한마디에 구원받았어요.")],
        [N("「ほっといて」と 怒る", "Snap: \"Leave me alone\"", "发火说“别管我”", "\"내버려 둬\"라며 화낸다"), {rel: {ken: -8}, mp: -6, gam: 2}, N("言いすぎた。 気まずい 空気だけが 残った。", "You went too far. Only an awkward air remained.", "说过头了。只留下尴尬的气氛。", "너무 심했어요. 어색한 공기만 남았어요.")]);

    // ===== 飲み会（20歳の 最初の お酒。楽しさと 失敗と 引きぎわ） =====
    Q("hangover", {src: "party", w: 2, rep: 1, cd: 3}, N("二日酔いの 朝", "Hungover morning", "宿醉的早晨", "숙취의 아침"),
        N("頭が ガンガンする。 昨日の 記憶が ところどころ ない…。 水を 飲んでも 胃が むかむか。", "Your head pounds. Parts of last night are missing… Even water turns your stomach.", "头痛欲裂。昨晚的记忆断断续续……喝水胃也难受。", "머리가 지끈거려요. 어젯밤 기억이 군데군데 없어요… 물을 마셔도 속이 울렁거려요."),
        [N("水と みそ汁で ゆっくり 回復", "Recover with water and miso soup", "靠水和味噌汤慢慢恢复", "물과 된장국으로 천천히 회복"), {hp: -8, mp: -3, hlt: -0.5}, N("昼すぎに ようやく 復活。 次は ほどほどに しよう…。", "Back to life after noon. Next time, moderation…", "过了中午才勉强复活。下次要适可而止……", "낮이 지나서야 겨우 부활. 다음엔 적당히 하자…")],
        [N("迎え酒で ごまかす", "Hair of the dog", "用酒解酒", "해장술로 버틴다"), {drk: 4, hlt: -3, hp: -4, mp: -2, money: -1000}, N("悪循環の はじまり…。 これは やめよう。", "The start of a vicious circle… Don't do this.", "恶性循环的开始……这个别做。", "악순환의 시작… 이건 그만두자.")]);
    Q("last_train", {src: "party", w: 1.5}, N("終電を のがした！", "You missed the last train!", "错过末班车了！", "막차를 놓쳤어요!"),
        N("ふと 時計を 見たら 0時すぎ。 駅の シャッターが おりている…。 さて、どうする？", "You glance at the clock — past midnight. The station shutters are down… What now?", "一看时间已过零点。车站的卷帘门已经拉下……怎么办？", "문득 시계를 보니 0시 넘어요. 역 셔터가 내려져 있어요… 어떻게 할까요?"),
        [N("タクシーで 帰る（¥6,000）", "Take a taxi (¥6,000)", "打车回家（¥6,000）", "택시로 귀가(¥6,000)"), {money: -6000, hp: 3}, N("深夜の 街を 窓から ぼんやり 眺めた。", "You gazed at the late-night city out the window.", "透过车窗茫然地看着深夜的街道。", "창밖으로 한밤의 거리를 멍하니 바라봤어요."), null, {need: money(6000)}],
        [N("{ken}の 家に 泊めてもらう", "Crash at {ken}'s place", "借住在{ken}家", "{ken}의 집에서 잔다"), {rel: {ken: 4}, hp: -4, mp: 3}, N("カップ麺を すすりながら 朝まで 語りあった。", "Slurping cup noodles, you talked until morning.", "一边吃杯面一边聊到天亮。", "컵라면을 후루룩 먹으며 아침까지 이야기했어요.")]);
    Q("senior_lecture", {src: "party", w: 1.2, need: function(S){ return S.rel.dai >= 10; }}, N("{dai}の ありがたい お説教", "{dai}'s precious lecture", "{dai}的“宝贵”说教", "{dai}의 고마운 잔소리"),
        N("2軒目で {dai}が 人生を 語りはじめた。「いいか、20代は 失敗 してなんぼだ」 …けっこう いい話だ。", "At the second bar, {dai} starts talking life: \"In your twenties, failure is the point.\" …Actually pretty good advice.", "第二摊时，{dai}开始谈人生：“听好了，20多岁就是要失败才有价值”……其实说得挺好。", "2차에서 {dai}이(가) 인생을 이야기해요. \"20대는 실패해 봐야 해\" …꽤 좋은 말이에요."),
        [N("メモを とる", "Take notes", "做笔记", "메모한다"), {knw: 2, chm: 1, rel: {dai: 5}, mp: 2}, N("酔いが さめても 覚えていた 名言。", "A quote you remembered even after sobering up.", "酒醒后还记得的名言。", "술이 깨도 기억에 남는 명언.")],
        [N("トイレに 逃げる", "Escape to the bathroom", "借口去厕所逃走", "화장실로 도망"), {mp: 1, rel: {dai: -1}}, N("戻ったら まだ 話していた。", "When you got back, they were still going.", "回来时还在讲。", "돌아오니 아직도 말하고 있었어요.")]);
    Q("new_people", {src: "party", w: 1.4}, N("初対面で 大盛りあがり", "Instant friends", "和初次见面的人聊得火热", "첫 만남인데 대화가 폭발"),
        N("となりの 席の 人たちと 乾杯。 趣味が かぶって 話が 止まらない。", "A toast with the next table. Overlapping hobbies — you can't stop talking.", "和邻桌的人干杯。兴趣重合，话题停不下来。", "옆 테이블 사람들과 건배. 취미가 겹쳐 이야기가 끊이지 않아요."),
        [N("連絡先を 交換する", "Swap contacts", "交换联系方式", "연락처를 교환한다"), {soc: 5, chm: 1, mp: 4}, N("新しい 出会いは 財産。", "New encounters are treasure.", "新的邂逅是财富。", "새로운 만남은 재산이에요.")],
        [N("その場かぎりに する", "Keep it one-time", "只当一次性的缘分", "그 자리에서만"), {mp: 5}, N("楽しい 一夜の おもいで。", "A fun one-night memory.", "愉快的一夜回忆。", "즐거운 하룻밤의 추억.")]);
    E("shot_call", {src: "party", w: 1.5}, N("一気コール", "Chug chant", "起哄灌酒", "원샷 콜"),
        N("「いっき！ いっき！」 まわりが 手拍子で あおる。 ジョッキを 渡されて、空気が 重い…。", "\"Chug! Chug!\" Everyone claps and eggs you on. A mug is handed over, the air heavy…", "“干！干！”周围拍手起哄。递来一大杯，气氛沉重……", "\"원샷! 원샷!\" 주변이 박수로 부추겨요. 잔을 건네받고 분위기가 무거워요…"), [
        X(N("笑顔で きっぱり 断る", "Refuse firmly with a smile", "笑着坚决拒绝", "웃으며 딱 잘라 거절"), [{chm: 3, mp: 6, soc: 1, hlt: 1}, N("「ごめん、自分の ペースで 飲みたいんだ」 意外と 『えらい』と 言われた。", "\"Sorry, I'd like to drink at my own pace.\" Surprisingly, they said you were mature.", "“抱歉，我想按自己的节奏喝”。意外地被夸“靠谱”。", "\"미안, 내 페이스로 마시고 싶어\" 의외로 '대단하다'는 말을 들었어요.")], [{drk: 6, hlt: -4, hp: -12, mp: -6}, N("断りきれず 一気 飲み…。 ふらふらで 動けなくなった。", "Couldn't refuse, chugged it… staggered, unable to move.", "没能拒绝，一口气喝了……摇摇晃晃动弹不得。", "거절하지 못하고 원샷… 휘청거려서 움직일 수 없었어요.")], {base: .45, s: ["chm"], k: .006}),
        C(N("ソフトドリンクを 飲みほす", "Down a soft drink instead", "改喝软饮料", "음료수를 마신다"), [O(1, {chm: 1, mp: 4}, N("「それで いいよ！」 と 笑いが おきた。", "\"That works!\" laughter broke out.", "“这样也行！”引来一阵笑声。", "\"그것도 좋아!\" 하고 웃음이 터졌어요."))])
    ]);
    Q("lost_phone", {src: "party", w: 1.1, need: function(S){ return S.drk >= 20; }}, N("スマホが ない！", "Where's my phone?!", "手机不见了！", "폰이 없어!"),
        N("翌朝 カバンを あさっても スマホが 出てこない。 ゆうべの 記憶は 途中から 消えている…。", "The next morning, no phone in your bag. Last night's memory vanishes halfway…", "第二天早上翻遍包也找不到手机。昨晚的记忆从中途开始消失……", "다음 날 아침 가방을 뒤져도 폰이 안 나와요. 어젯밤 기억은 중간부터 사라졌어요…"),
        [N("お店に 電話して さがす", "Call the bar to search", "打电话去店里找", "가게에 전화해 찾는다"), {mp: -4, hp: -3}, N("店員さんが 保管していて くれた。 ほんと 助かった…。", "A staff member had kept it. What a relief…", "店员帮忙保管着。真是帮大忙了……", "직원이 보관해 두었어요. 정말 살았어요…")],
        [N("あきらめて 買いなおす（¥25,000）", "Give up and buy a new one (¥25,000)", "放弃重新买（¥25,000）", "포기하고 새로 산다(¥25,000)"), {money: -25000, mp: -8, drk: 1}, N("データも 思い出も 一緒に 消えた…。 お酒は ほどほどに。", "Data and memories vanished together… Drink in moderation.", "数据和回忆一起消失了……饮酒要适度。", "데이터도 추억도 함께 사라졌어요… 술은 적당히.")]);
    Q("drink_warn", {rep: 1, cd: 8, w: 2.2, need: function(S){ return S.drk >= 45 && S.rel.ken >= 15; }}, N("飲みすぎ じゃない？", "Aren't you drinking too much?", "是不是喝太多了？", "너무 마시는 거 아냐?"),
        N("{ken}が 眉を ひそめる。「最近 毎回 ベロベロ だぞ。 お酒は 楽しく 飲むもんだろ」", "{ken} frowns: \"You're hammered every time lately. Drinking's supposed to be fun.\"", "{ken}皱起眉头：“你最近每次都喝得烂醉。喝酒不是应该开开心心的吗”。", "{ken}이(가) 눈살을 찌푸려요. \"요즘 매번 만취야. 술은 즐겁게 마시는 거잖아.\""),
        [N("反省して 量を へらす", "Reflect and cut back", "反省并减少饮酒量", "반성하고 양을 줄인다"), {drk: -14, hlt: 2, mp: 3, rel: {ken: 4}}, N("休肝日を つくることに した。 体が 軽い。", "You set alcohol-free days. Your body feels lighter.", "决定设置休肝日。身体变轻松了。", "금주일을 만들기로 했어요. 몸이 가벼워요.")],
        [N("「だいじょうぶ だって」", "\"I'm fine, really\"", "“没事啦”", "\"괜찮다니까\""), {rel: {ken: -3}, mp: -2}, N("{ken}は ため息を ついた。", "{ken} sighed.", "{ken}叹了口气。", "{ken}은(는) 한숨을 쉬었어요.")]);

    // ===== 友だち・デート =====
    Q("karaoke", {src: "friends", w: 1.2}, N("カラオケ 大会", "Karaoke contest", "卡拉OK大赛", "노래방 대회"),
        N("点数勝負で 罰ゲームつき。 {ken}が 「負けたら おごりな」と ニヤリ。", "A scoring contest with penalty. {ken} grins: \"Loser pays.\"", "比分数还带惩罚游戏。{ken}坏笑：“输了请客”。", "점수 대결에 벌칙 포함. {ken}이(가) \"지면 한턱이다\" 하고 씩 웃어요."),
        [N("本気で 歌う", "Sing for real", "认真地唱", "진심으로 부른다"), {chm: 2, mp: 6, rel: {ken: 3}}, N("高得点！ 喉は ガラガラ でも 最高だった。", "A high score! Your throat is raw but it was great.", "高分！嗓子沙哑但太棒了。", "고득점! 목은 쉬었지만 최고였어요.")],
        [N("ネタ曲で 笑いを とる", "Go for laughs with a goofy song", "唱搞笑歌取乐", "웃긴 곡으로 웃음을 노린다"), {soc: 3, mp: 8, rel: {ken: 4}}, N("ウケすぎて 点数は 最下位。 でも 大満足。", "It killed — last place on points, but fully satisfied.", "太搞笑，分数垫底。但非常满足。", "너무 웃겨서 점수는 꼴찌. 그래도 대만족.")]);
    Q("game_night", {src: "friends", w: 1.1, ctx: ["noa", "ken"]}, N("オールナイト ゲーム大会", "All-night gaming", "通宵游戏大会", "밤샘 게임 대회"),
        N("コントローラーを にぎって 気づけば 空が しらんできた。 最終ステージの ボスが つよすぎる！", "Gripping the controller, you notice the sky turning pale. The final boss is brutal!", "握着手柄，回过神来天色已经泛白。最终关的Boss太强了！", "컨트롤러를 쥐고 정신 차리니 하늘이 밝아 와요. 마지막 보스가 너무 세요!"),
        [N("朝まで 挑戦しつづける", "Keep trying till morning", "挑战到天亮", "아침까지 도전한다"), {mp: 10, hp: -12, rel: {noa: 4, ken: 3}, skl: 1}, N("ついに 倒した！ ハイタッチ！ …そして 寝落ち。", "Finally beat it! High five! …Then passed out.", "终于打倒了！击掌！……然后睡着了。", "드디어 쓰러뜨렸어요! 하이파이브! …그리고 기절.")],
        [N("ほどほどで 切りあげる", "Call it at a reasonable hour", "适可而止结束", "적당히 마무리"), {mp: 6, hp: -2, rel: {noa: 2, ken: 2}}, N("「また 来週 リベンジ な」", "\"Rematch next week.\"", "“下周再来复仇”。", "\"다음 주에 리벤지\"")]);
    Q("trip_plan", {src: "friends", w: 1, need: function(S){ return S.money >= 40000; }}, N("旅行の 計画", "Planning a trip", "旅行计划", "여행 계획"),
        N("「来月 みんなで どこか 行かない？」 {misa}と {ken}が 地図アプリを 見せてくる。", "\"Wanna go somewhere together next month?\" {misa} and {ken} show you a map app.", "“下个月大家一起去哪里玩吧？”{misa}和{ken}拿出地图App给你看。", "\"다음 달에 다 같이 어디 갈래?\" {misa}와(과) {ken}이(가) 지도 앱을 보여 줘요."),
        [N("のる！ 計画を 立てる", "I'm in! Start planning", "好！一起做计划", "좋아! 계획을 세운다"), {mp: 8, soc: 3, knw: 1, rel: {misa: 3, ken: 3}}, N("行き先を 決める時間も 楽しい。 ひとり旅の ヒントにも なった。", "Choosing the destination was fun too. A hint for solo trips as well.", "决定目的地的时间也很快乐。也给独自旅行提供了灵感。", "목적지를 정하는 시간도 즐거워요. 혼자 여행의 힌트도 됐어요.")],
        [N("今回は パス", "Pass this time", "这次先不去", "이번엔 패스"), {mp: -1}, N("お金も 時間も ないので…。", "No money or time right now…", "钱和时间都不够……", "돈도 시간도 없어서…")]);
    Q("date_movie", {src: "date", ctx: ["sak", "misa"], w: 1.2}, N("映画館で", "At the movies", "在电影院", "영화관에서"),
        N("ポップコーンを 半分ずつ。 感動シーンで 横を ちらっと 見たら、{w}も 泣いていた。", "Sharing popcorn. At the touching scene you glance sideways — {w} is crying too.", "共享爆米花。感人场景时偷看旁边，{w}也在哭。", "팝콘을 반씩. 감동 장면에서 옆을 슬쩍 보니 {w}도 울고 있었어요."),
        [N("そっと ハンカチを わたす", "Quietly hand over a handkerchief", "悄悄递上手帕", "살며시 손수건을 건넨다"), {mp: 10, rel: {sak: 5, misa: 5}, chm: 1}, N("「ありがとう」 と 小さな 声。 エンドロールまで 静かだった。", "A small \"thank you.\" Quiet until the credits ended.", "小声说了句“谢谢”。直到片尾字幕结束都很安静。", "\"고마워\" 작은 목소리. 엔딩 크레딧까지 조용했어요.")],
        [N("気づかない ふりを する", "Pretend not to notice", "假装没注意到", "모른 척한다"), {mp: 5, rel: {sak: 2, misa: 2}}, N("あとで 「泣いて なかったよ」と 照れ笑い。", "Later: \"I wasn't crying,\" with a shy laugh.", "之后对方害羞地笑着说：“我才没哭”。", "나중에 \"안 울었어\" 하며 쑥스럽게 웃었어요.")]);
    Q("date_cafe", {src: "date", ctx: ["sak", "misa"], w: 1.2}, N("お気に入りの カフェで", "At a favorite café", "在最爱的咖啡馆", "마음에 드는 카페에서"),
        N("ラテアートが かわいい 隅の席。 好きな 音楽や 昔の 話。 時間が ゆっくり 流れる。", "A corner seat with cute latte art. Talk of music and old times. Time flows slowly.", "有可爱拉花的角落座位。聊着喜欢的音乐和往事。时间缓缓流淌。", "라테 아트가 귀여운 구석 자리. 좋아하는 음악과 옛날 이야기. 시간이 천천히 흘러요."),
        [N("自分の 夢を 話す", "Share your dreams", "说出自己的梦想", "내 꿈을 이야기한다"), {mp: 10, chm: 2, rel: {sak: 6, misa: 6}}, N("「いいね、応援してる」 その言葉が 力に なる。", "\"That's great, I'm rooting for you.\" The words become strength.", "“不错呀，我支持你”。这句话成了力量。", "\"멋지다, 응원할게\" 그 말이 힘이 돼요.")],
        [N("相手の 話を ききつづける", "Keep listening to them", "一直倾听对方", "상대 이야기를 계속 듣는다"), {mp: 8, knw: 1, rel: {sak: 7, misa: 7}}, N("「こんなに 話せたの はじめて」 と 笑ってくれた。", "\"I've never talked this much before,\" they smiled.", "对方笑着说：“第一次说这么多”。", "\"이렇게 많이 얘기한 건 처음이야\" 하고 웃었어요.")]);
    Q("date_rain", {src: "date", ctx: ["sak", "misa"], w: 1}, N("傘が 1本しか ない", "Only one umbrella", "只有一把伞", "우산이 하나뿐"),
        N("帰り道、にわか雨。 {w}の 折りたたみ傘は ひとつ。 肩が 近い…。", "On the way home, a sudden shower. {w} has just one folding umbrella. Shoulders close…", "回家路上下起阵雨。{w}只有一把折叠伞。肩膀靠得很近……", "귀갓길에 소나기. {w}의 접이식 우산은 하나뿐. 어깨가 가까워요…"),
        [N("傘を {w}に 寄せる", "Tilt the umbrella toward them", "把伞偏向对方", "우산을 상대 쪽으로 기울인다"), {mp: 10, hp: -3, rel: {sak: 7, misa: 7}, chm: 1}, N("片方の 肩が びしょぬれ。 でも 心は ぽかぽか。", "One shoulder soaked. But your heart is warm.", "一边肩膀湿透了。但心里暖洋洋的。", "한쪽 어깨가 흠뻑. 하지만 마음은 포근해요.")],
        [N("コンビニに 走って 傘を 買う", "Run to buy an umbrella", "跑去便利店买伞", "편의점으로 달려가 우산을 산다"), {mp: 6, money: -700, rel: {sak: 3, misa: 3}}, N("ふたりで 笑いながら 走った。", "You ran together, laughing.", "两人笑着一起奔跑。", "둘이 웃으며 달렸어요.")]);
    Q("date_night", {src: "date", ctx: ["sak", "misa"], w: 1, need: function(S){ return S.rel.sak >= 45 || S.rel.misa >= 45; }}, N("夜景の 見える 場所", "A place with a night view", "能看夜景的地方", "야경이 보이는 곳"),
        N("高台から 見おろす 街の 灯り。 ふたりとも 言葉を 忘れて ただ 景色を 見ていた。", "City lights from the hill. Both of you forgot words and simply watched the view.", "从高台俯瞰城市灯火。两人都忘了言语，只是静静望着景色。", "언덕에서 내려다본 거리의 불빛. 두 사람 다 말을 잊고 풍경만 바라봤어요."),
        [N("「また 来ようね」と 言う", "Say \"Let's come again\"", "说“下次再来”", "\"또 오자\"라고 말한다"), {mp: 14, rel: {sak: 8, misa: 8}, chm: 1}, N("「うん」 小さく うなずいた。", "\"Yeah.\" A small nod.", "“嗯”。小小地点了点头。", "\"응\" 작게 고개를 끄덕였어요.")],
        [N("だまって 隣に いる", "Just stay by their side", "默默待在身边", "말없이 곁에 있는다"), {mp: 12, rel: {sak: 6, misa: 6}}, N("言葉は いらない 夜も ある。", "Some nights need no words.", "有些夜晚不需要言语。", "말이 필요 없는 밤도 있어요.")]);
    Q("date_zoo", {src: "date", ctx: ["misa"], w: 1}, N("動物園デート", "A zoo date", "动物园约会", "동물원 데이트"),
        N("ペンギンの 前で {w}が 目を きらきらさせている。 子どもの ころの 話で もりあがった。", "{w}'s eyes sparkle in front of the penguins. You swap childhood stories.", "在企鹅前，{w}眼睛闪闪发光。聊着小时候的事很开心。", "펭귄 앞에서 {w}의 눈이 반짝여요. 어릴 적 이야기로 신났어요."),
        [N("写真を いっぱい とる", "Take lots of photos", "拍很多照片", "사진을 잔뜩 찍는다"), {mp: 10, rel: {misa: 6}, fame: 150}, N("ふたりで 写った 1枚が お気に入りに。", "A photo of the two of you became a favorite.", "两人合影的那张成了最爱。", "둘이 함께 찍힌 한 장이 마음에 들었어요.")],
        [N("お土産を おそろいに", "Get matching souvenirs", "买同款纪念品", "기념품을 커플로"), {mp: 9, money: -1800, rel: {misa: 8}}, N("おそろいの キーホルダーが カバンで ゆれる。", "The matching keychains swing on your bags.", "同款钥匙扣在包上摇晃。", "커플 키링이 가방에서 흔들려요.")]);
})();
