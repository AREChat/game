"use strict";
/* 20歳の冒険：イベント2（毎週ランダム：友だち・お金・スマホ・健康・家族） */
(function(){
    var AD = window.AD || globalThis.AD, E = AD.E, C = AD.C, O = AD.O, N = AD.N, W = AD.W, Q = AD.Q, X = AD.X;
    var money = function(n){ return function(S){ return S.money >= n; }; };

    // ===== 友だち・人づきあい =====
    Q("old_friend_sns", {w: 1.2}, N("昔の友だちから DM", "A DM from an old friend", "老朋友发来私信", "옛 친구에게서 DM"),
        N("SNSに 中学の 同級生から 「久しぶり！ 元気？」と メッセージが きた。", "A middle-school classmate DMs you: \"Long time no see! How are you?\"", "初中同学在SNS上发来：“好久不见！还好吗？”", "SNS로 중학교 동창이 \"오랜만이야! 잘 지내?\" 하고 메시지를 보냈어요."),
        [N("すぐ 返信して 会う約束", "Reply and plan to meet", "马上回复并约见面", "바로 답장하고 약속 잡기"), {soc: 4, mp: 8, money: -3500}, N("思い出話で 3時間。 世界が 少し せまく感じた。", "Three hours of memories. The world felt smaller.", "聊了3个小时往事。世界感觉变小了一点。", "추억 얘기로 3시간. 세상이 조금 좁게 느껴졌어요.")],
        [N("スタンプだけ 返す", "Reply with just a sticker", "只回个表情包", "스티커만 보낸다"), {soc: 1}, N("それ以上は つづかなかった。", "It didn't go any further.", "没有再继续下去。", "더 이어지진 않았어요.")]);
    Q("group_chat", {rep: 1, cd: 10}, N("グループLINEが 荒れた", "The group chat blew up", "群聊吵起来了", "단톡방이 시끄러워졌어요"),
        N("{ken}と 友だちが ささいな ことで 言いあらそい。 通知が 止まらない。", "{ken} and a friend are quarreling over a small thing. Notifications won't stop.", "{ken}和朋友为小事吵了起来。通知响个不停。", "{ken}와(과) 친구가 사소한 일로 다퉈요. 알림이 멈추지 않아요."),
        [N("仲裁に 入る", "Step in to mediate", "出面调解", "중재에 나선다"), {soc: 3, mp: -6, rel: {ken: 3}}, N("なんとか おさまった。 どっと つかれた…。", "It calmed down. You're exhausted…", "总算平息了。累得够呛……", "겨우 수습됐어요. 기운이 쭉 빠졌어요…")],
        [N("通知を オフにする", "Mute notifications", "关闭通知", "알림을 끈다"), {mp: 5, soc: -1}, N("静かな 夜が もどってきた。", "A quiet night returned.", "安静的夜晚回来了。", "조용한 밤이 돌아왔어요.")]);
    E("lend_money", {w: .9, need: function(S){ return S.money >= 30000 && S.rel.ken >= 25; }}, N("お金を 貸してほしい", "Can you lend me money?", "能借我点钱吗", "돈 좀 빌려줘"),
        N("{ken}が 申しわけなさそうに 言う。「来月の 家賃が ピンチで…。 15,000円 貸してくれない？」", "{ken} says sheepishly: \"Next month's rent is tight… can you lend me ¥15,000?\"", "{ken}不好意思地说：“下个月房租有点紧……能借我15,000日元吗？”", "{ken}이(가) 미안한 듯 말해요. \"다음 달 월세가 위험해서… 15,000엔만 빌려줄래?\""), [
        C(N("貸す", "Lend it", "借给他", "빌려준다"), [O(1, {money: -15000, rel: {ken: 8}, mp: 2}, N("「助かる！ 絶対 返す」 …たぶん。", "\"You saved me! I'll pay it back.\" …Probably.", "“帮大忙了！一定还”……大概吧。", "\"살았다! 꼭 갚을게\" …아마도."), {q: ["lent_back", 5], set: "lent"})]),
        C(N("きっぱり 断る", "Politely decline", "委婉拒绝", "딱 잘라 거절"), [O(1, {rel: {ken: -4}, mp: -3}, N("気まずい 空気が ながれた。 お金の 貸し借りは むずかしい。", "An awkward silence. Lending money is hard.", "气氛有些尴尬。借钱这事很难办。", "어색한 공기가 흘렀어요. 돈거래는 어려워요."))]),
        C(N("5,000円だけ あげる", "Give ¥5,000 outright", "只给他5,000日元", "5,000엔만 준다"), [O(1, {money: -5000, rel: {ken: 4}}, N("「返さなくて いいよ」 気持ちは つたわった。", "\"No need to pay back.\" The feeling got across.", "“不用还了”。心意传达到了。", "\"안 갚아도 돼\" 마음은 전해졌어요."))])
    ]);
    E("lent_back", {src: "sys"}, N("貸したお金の 行方", "About that money you lent", "借出去的钱", "빌려준 돈의 행방"),
        N("{ken}から 連絡。「この前の お金、ちょっと遅れたけど…」", "{ken} messages: \"About that money, sorry it's late…\"", "{ken}发来消息：“上次那笔钱，虽然晚了点……”", "{ken}에게서 연락. \"저번 돈, 좀 늦었지만…\""), [
        X(N("確認する", "Check", "确认一下", "확인한다"), [{money: 15000, rel: {ken: 4}}, N("全額 返ってきた！ ついでに ラーメンも おごってくれた。", "Paid back in full — plus ramen on them!", "全额还回来了！还顺便请你吃了拉面。", "전액 돌려받았어요! 라멘까지 사 줬어요.")], [{rel: {ken: -6}, mp: -4}, N("「ごめん、もう少し 待って…」 …返ってこなかった。", "\"Sorry, wait a bit more…\" You never got it back.", "“对不起，再等等……”钱没有还回来。", "\"미안, 조금만 더 기다려…\" 돌려받지 못했어요.")], {base: .72})
    ]);
    Q("wedding", {wk: [W(5, 1), W(11, 30)], w: .7}, N("友だちの 結婚式", "A friend's wedding", "朋友的婚礼", "친구의 결혼식"),
        N("高校の 友だちから 結婚式の 招待状。 20歳で 結婚する人も いるんだ…。", "A high-school friend sends a wedding invitation. Some people really do marry at 20…", "高中朋友寄来婚礼请柬。原来有人20岁就结婚了……", "고등학교 친구에게서 결혼식 초대장이 왔어요. 20살에 결혼하는 사람도 있군요…"),
        [N("お祝いに 行く（ご祝儀 ¥20,000）", "Attend (¥20,000 gift)", "去祝贺（礼金¥20,000）", "축하하러 간다(축의금 ¥20,000)"), {money: -20000, mp: 10, soc: 4, rel: {ken: 2}}, N("幸せそうな 二人に 胸が あつくなった。", "The happy couple warmed your heart.", "看着幸福的两人，心头一热。", "행복해 보이는 두 사람에 가슴이 뭉클했어요."), {sv: "wedding"}, {need: money(20000)}],
        [N("メッセージだけ 送る", "Send a message only", "只发祝福消息", "메시지만 보낸다"), {mp: -2, soc: -1}, N("少し さみしい 気持ちで 画面を 閉じた。", "You closed the screen with a pang of loneliness.", "带着一丝寂寞关掉了屏幕。", "조금 쓸쓸한 마음으로 화면을 닫았어요.")]);
    Q("ryo_promo", {w: .8, wk: [W(4, 15), W(10, 30)], need: function(S){ return S.rel.ryo >= 20; }}, N("ライバルが 一歩 先へ", "Your rival pulls ahead", "对手领先一步", "라이벌이 한 걸음 앞서"),
        N("{ryo}が 大きな 成果を 出したと 聞いた。 自分と くらべて、胸が ざわつく。", "You hear {ryo} achieved something big. Comparing yourself, your chest tightens.", "听说{ryo}取得了巨大成果。和自己比起来，心里很不平静。", "{ryo}이(가) 큰 성과를 냈다고 들었어요. 나와 비교하니 가슴이 술렁여요."),
        [N("よし、負けない！", "Right, I won't lose!", "好，我不会输！", "좋아, 지지 않아!"), {skl: 3, knw: 2, mp: -4, rel: {ryo: 3}}, N("対抗心に 火が ついた。 最高の ライバルだ。", "Your fighting spirit ignites. The best rival.", "斗志被点燃了。最棒的对手。", "경쟁심에 불이 붙었어요. 최고의 라이벌이에요.")],
        [N("素直に 祝う", "Congratulate sincerely", "真诚地祝贺", "솔직하게 축하한다"), {chm: 3, mp: 3, rel: {ryo: 8}}, N("「サンキュ。 お前も やれよ」 笑って 拳を ぶつけた。", "\"Thanks. You go for it too.\" You bumped fists, smiling.", "“谢啦。你也加油”，笑着碰了碰拳头。", "\"고마워. 너도 해봐\" 웃으며 주먹을 맞댔어요.")]);
    Q("friend_trouble", {rep: 1, cd: 9, w: 1}, N("相談が あるんだ", "I need to talk", "我有事想商量", "상담할 게 있어"),
        N("夜中に {noa}から 「ちょっと 話せる？」 と 通話の 着信。 悩みが ありそうだ。", "Late at night, {noa} calls: \"Can we talk for a bit?\" Something seems wrong.", "深夜{noa}打来电话：“能聊聊吗？”似乎有烦恼。", "한밤중에 {noa}이(가) \"잠깐 얘기할 수 있어?\" 하고 전화했어요. 고민이 있는 것 같아요."),
        [N("じっくり 聞く", "Listen carefully", "认真倾听", "차분히 들어준다"), {mp: -3, rel: {noa: 8}, soc: 2, chm: 1}, N("「話せて 楽になった」 ――その一言が うれしい。", "\"I feel lighter for talking.\" That one line made you happy.", "“说出来轻松多了”——这句话让你很高兴。", "\"얘기하니까 편해졌어\" 그 한마디가 기뻐요.")],
        [N("眠いので 明日にする", "Too sleepy — tomorrow", "太困了，明天再说", "졸려서 내일로"), {hp: 5, rel: {noa: -3}}, N("次の日、少し 気まずかった。", "Things were a bit awkward the next day.", "第二天有点尴尬。", "다음 날 조금 어색했어요.")]);
    E("band_invite", {wk: [W(2, 1), W(8, 30)], need: function(S){ return S.skl >= 25; }, w: .8}, N("バンドを 組まない？", "Want to form a band?", "要不要组乐队？", "밴드 같이 안 할래?"),
        N("{ken}が ギターを かかえて 言った。「学園祭までに バンド 組もうぜ！ ベースが いないんだ」", "{ken} hugs a guitar: \"Let's form a band for the festival! We need a bassist!\"", "{ken}抱着吉他说：“学园祭前组个乐队吧！缺个贝斯手”。", "{ken}이(가) 기타를 안고 말했어요. \"축제 전에 밴드 하자! 베이스가 없어!\""), [
        C(N("やってみる！", "Give it a try!", "试试看！", "해 본다!"), [O(1, {skl: 4, soc: 3, mp: 8, money: -5000, rel: {ken: 8}}, N("週末の スタジオ練習が 毎回 たのしい。", "Weekend studio practice is fun every time.", "每周末的排练室练习都很开心。", "주말 스튜디오 연습이 매번 즐거워요."), {set: "band"})]),
        C(N("今回は 見おくる", "Pass this time", "这次先不了", "이번엔 보류"), [O(1, {rel: {ken: -2}}, N("{ken}は 別の 人を さそった。", "{ken} invited someone else.", "{ken}邀请了别人。", "{ken}은(는) 다른 사람을 불렀어요."))])
    ]);
    Q("new_friend", {w: 1}, N("気の合う 人と 出会った", "You clicked with someone", "遇到了投缘的人", "마음이 맞는 사람을 만났어요"),
        N("ふと 立ち寄った 店で 好きな ものが 同じ 人と 話しこんでしまった。", "At a shop you stopped by, you got deep into talk with someone who likes the same things.", "在偶然路过的店里，和喜欢同样东西的人聊了起来。", "우연히 들른 가게에서 취향이 같은 사람과 이야기에 빠졌어요."),
        [N("連絡先を 交換する", "Swap contacts", "交换联系方式", "연락처를 교환한다"), {soc: 5, mp: 7, chm: 1}, N("また 会おうね、と 言って わかれた。", "\"Let's meet again,\" you said, parting.", "说了句“下次再见”后告别。", "\"또 만나요\" 하고 헤어졌어요.")],
        [N("会話だけで 満足", "Be content with the chat", "只聊天就满足了", "대화만으로 만족"), {mp: 5}, N("心地よい 余韻だけが のこった。", "A pleasant afterglow remained.", "只留下舒服的余韵。", "기분 좋은 여운만 남았어요.")]);

    // ===== スマホ・お金 =====
    Q("flea_sale", {w: 1.3}, N("フリマアプリで 売れた！", "Sold on the flea-market app!", "在二手App上卖出去了！", "중고 앱에서 팔렸어요!"),
        N("「購入されました」の 通知。 クローゼットに ねむっていた 服が 売れた。", "\"Purchased!\" Clothes sleeping in your closet got sold.", "“已被购买”的通知。沉睡在衣柜里的衣服卖出去了。", "\"구매되었습니다\" 알림. 옷장에 잠자던 옷이 팔렸어요."),
        [N("発送まで ていねいに", "Pack it with care", "认真打包发货", "정성껏 발송"), {money: 8500, chm: 1, mp: 3}, N("「梱包が 丁寧でした」と 高評価！", "A 5-star review: \"Wonderfully packed!\"", "收到好评：“包装很用心！”", "\"포장이 정성스러웠어요\" 호평!")],
        [N("ほかの ものも 出品する", "List more items", "再上架其他东西", "다른 것도 올린다"), {money: 5500, mp: 2, knw: 1}, N("部屋が すっきり。 収入も ちょっと。", "A tidier room and a bit of income.", "房间变整洁了，还有点收入。", "방이 깔끔해졌고 수입도 조금.")]);
    E("scam_mail", {w: 1, rep: 1, cd: 14}, N("「お支払い確認」メール", "\"Payment confirmation\" email", "“付款确认”邮件", "\"결제 확인\" 메일"),
        N("「お客様の アカウントが 停止されます。 こちらから ログインを」――見おぼえのない メールが 届いた。", "\"Your account will be suspended. Log in here\" — an email you don't recognize.", "“您的账户将被冻结。请从这里登录”——收到了一封陌生的邮件。", "\"고객님의 계정이 정지됩니다. 여기서 로그인\" — 낯선 메일이 왔어요."), [
        C(N("無視して 削除する", "Ignore and delete", "无视并删除", "무시하고 삭제"), [O(1, {knw: 1, mp: 1}, N("正解！ 公式アプリから 確認しても 問題なし。", "Correct! Checking via the official app showed no issue.", "正确！通过官方App确认后没有问题。", "정답! 공식 앱으로 확인해도 문제없었어요."))]),
        C(N("公式サイトで 確認する", "Verify on the official site", "在官网确认", "공식 사이트에서 확인"), [O(1, {knw: 2, mp: 1}, N("詐欺メールだと 判明。 知識が ひとつ ふえた。", "It was a scam. One more piece of knowledge.", "确认是诈骗邮件。又多了一点知识。", "사기 메일로 판명. 지식이 하나 늘었어요."))]),
        X(N("リンクを ひらいてみる", "Open the link", "点开链接看看", "링크를 열어 본다"), [{knw: 1}, N("開く前に 気づいて 閉じた。 ひやっと した…。", "You noticed before it loaded and closed it. Phew…", "在打开前察觉并关掉了。吓出一身冷汗……", "열기 전에 알아채고 닫았어요. 간담이 서늘했어요…")], [{money: -30000, mp: -12, knw: 1}, N("ID と パスワードを 入力して しまった…。 不正利用された。", "You entered your ID and password… and it was misused.", "输入了ID和密码……被盗用了。", "ID와 비밀번호를 입력해 버렸어요… 부정 사용을 당했어요.")], {base: .25, s: ["knw"], k: .006})
    ]);
    E("invest_start", {w: .9, wk: [W(2, 1), W(9, 30)], need: function(S){ return S.money >= 60000 && !S.flags.invest; }}, N("積立投資、始める？", "Start investing?", "要开始定投吗？", "적립 투자 시작할까?"),
        N("SNSで 「少額から 積立投資」の 投稿が 流れてきた。 将来の ために 始めてみる？（※ゲーム内の 架空の 話です）", "A post on \"starting small with recurring investing\" floats by. Try it for the future? (A fictional in-game story.)", "刷到“从小额开始定投”的帖子。为了将来要不要试试？（※游戏内的虚构故事）", "\"소액부터 적립 투자\" 게시물이 흘러와요. 미래를 위해 시작해 볼까요? (※게임 속 가상의 이야기)"), [
        C(N("まず 勉強する", "Study it first", "先学习", "먼저 공부한다"), [O(1, {knw: 4, mp: -2}, N("手数料の しくみ・長期の 考え方を 学んだ。", "You learned fees and long-term thinking.", "学习了手续费的结构和长期思维。", "수수료 구조와 장기적 사고를 배웠어요."), {set: "invest_learn"})]),
        C(N("少額（¥20,000）で 始める", "Start small (¥20,000)", "小额开始（¥20,000）", "소액(¥20,000)으로 시작"), [O(1, {money: -20000, knw: 2}, N("毎月 少しずつ。 ほったらかしに してみる。", "A little each month. You leave it alone.", "每月一点点。试着放着不管。", "매달 조금씩. 내버려 두기로 했어요."), {set: "invest", q: ["invest_result", 14]})], {need: money(20000)}),
        C(N("貯金の ままで いい", "Stay with savings", "还是存着吧", "저금 그대로가 좋아"), [O(1, {mp: 1}, N("安心が いちばん。", "Peace of mind comes first.", "安心最重要。", "안심이 제일이에요."))])
    ]);
    E("invest_result", {src: "sys"}, N("積立投資の 結果", "Investment check-in", "定投结果", "적립 투자 결과"),
        N("アプリを ひらいたら 評価額が 出ていた。 さて、どうなっていた？", "You open the app and see the valuation. So, how did it go?", "打开App看到了评估金额。结果如何呢？", "앱을 열어 보니 평가액이 나와 있었어요. 과연 어떻게 됐을까요?"), [
        X(N("見る", "Look", "查看", "확인한다"), [{money: 6000, knw: 2, mp: 3}, N("少しだけ プラスに！ 長く つづけるのが コツ らしい。", "A small gain! Keeping at it seems to be the trick.", "小有盈利！长期坚持似乎是诀窍。", "조금 플러스! 오래 이어가는 게 요령인 것 같아요.")], [{money: -3500, knw: 2, mp: -2}, N("少しだけ マイナス。 でも 慌てて 売らなかった。", "A small loss. But you didn't panic-sell.", "小有亏损。但你没有慌忙卖掉。", "조금 마이너스. 그래도 당황해 팔진 않았어요.")], {base: .62, s: ["knw"], k: .002})
    ]);
    E("crypto_boom", {w: .6, wk: [W(3, 1), W(10, 30)], need: function(S){ return S.money >= 50000; }}, N("「絶対もうかる」の誘い", "A \"sure win\" pitch", "“绝对赚钱”的邀约", "\"무조건 번다\"는 권유"),
        N("{ken}の 知りあいが 「この コインは 10倍に なる！」と 熱弁している。 ※ゲーム内の 架空の 話。 現実でも 『絶対』は ありません。", "{ken}'s acquaintance insists \"This coin will 10x!\" (Fictional. In real life, nothing is 'guaranteed'.)", "{ken}的熟人在热情宣传“这个币会涨10倍！”※游戏内的虚构故事。现实中也没有“绝对”。", "{ken}의 지인이 \"이 코인은 10배 돼!\"라고 열변을 토해요. ※게임 속 가상의 이야기. 현실에서도 '절대'는 없어요."), [
        X(N("¥50,000 つぎこむ", "Put in ¥50,000", "投入¥50,000", "¥50,000을 건다"), [{money: 40000, mp: 6}, N("たまたま 上がった！ …でも これは 運だった。", "It happened to rise! …But that was just luck.", "碰巧涨了！……不过这只是运气。", "우연히 올랐어요! …하지만 이건 운이었어요.")], [{money: -50000, mp: -10, knw: 3}, N("価値が 急落。 『うまい話は 疑え』を 高い授業料で 学んだ。", "The value crashed. You learned \"doubt easy money\" the expensive way.", "价值暴跌。用高昂的学费学到了“好事要怀疑”。", "가치가 급락했어요. '달콤한 얘기는 의심하라'를 비싼 수업료로 배웠어요.")], {base: .3}),
        C(N("調べてから 判断する", "Research before deciding", "调查后再决定", "조사한 뒤 판단"), [O(1, {knw: 3, mp: 2}, N("運営も 仕組みも あやしい。 見送って 正解だった。", "The operator and mechanics were sketchy. Passing was right.", "运营方和机制都很可疑。放弃是正确的。", "운영도 구조도 수상해요. 보류하길 잘했어요."))]),
        C(N("ぜんぜん 興味ない", "Not interested", "完全没兴趣", "전혀 관심 없어"), [O(1, {mp: 1}, N("「ま、そうだよな」と {ken}は 笑った。", "\"Well, fair enough,\" {ken} laughed.", "{ken}笑着说：“也是呢”。", "\"뭐, 그렇지\" {ken}이(가) 웃었어요."))])
    ]);
    Q("rent_up", {w: .7, wk: [W(3, 1), W(10, 30)], need: function(S){ return S.bg !== "home"; }}, N("家賃の 値上げ通知", "Rent increase notice", "房租上涨通知", "월세 인상 통지"),
        N("大家さんから 「来月から 家賃を 3,000円 上げます」と 通知。 物価が 上がっている…。", "Your landlord: \"Rent goes up ¥3,000 next month.\" Prices keep rising…", "房东通知：“下个月起房租上涨3,000日元。”物价在上涨……", "집주인에게서 \"다음 달부터 월세를 3,000엔 올립니다\" 통지. 물가가 오르고 있어요…"),
        [N("受けいれる", "Accept it", "接受", "받아들인다"), {money: -12000, mp: -2}, N("まとめて 4か月ぶん 先に ひかれた。", "Four months' worth deducted up front.", "一次性预扣了4个月的涨幅。", "4개월 치가 한꺼번에 빠졌어요.")],
        [N("交渉してみる", "Try negotiating", "试着交涉", "협상해 본다"), {money: -4000, knw: 2, soc: 1, mp: -3}, N("少し まけてもらえた。 交渉も 経験。", "They gave a small discount. Negotiating is experience.", "稍微让了点价。交涉也是经验。", "조금 깎아줬어요. 협상도 경험이에요.")]);
    Q("phone_broke", {w: .9}, N("スマホの 画面が バキバキ", "Your phone screen is shattered", "手机屏幕碎了", "폰 화면이 와장창"),
        N("うっかり 落とした。 画面に 網の目のような ヒビ。 でも 連絡手段は これだけ…。", "You dropped it. A net of cracks across the screen. But it's your only lifeline…", "不小心摔了。屏幕上网状的裂纹。可它是你唯一的联络手段……", "깜빡 떨어뜨렸어요. 화면에 그물 같은 금. 하지만 연락 수단은 이것뿐…"),
        [N("修理に 出す", "Get it repaired", "送去修理", "수리 맡긴다"), {money: -12000, mp: -3}, N("2時間で 直った。 つぎから ケースを 買おう。", "Fixed in two hours. Time to buy a case.", "2小时修好了。下次买个壳吧。", "2시간 만에 고쳤어요. 이제 케이스를 사야겠어요.")],
        [N("ヒビの まま 使う", "Use it cracked", "就这样凑合用", "금이 간 채로 쓴다"), {mp: -5, chm: -1}, N("指を 切りそうで ヒヤヒヤ。", "You worry about cutting your finger.", "总担心划到手指。", "손가락 베일까 조마조마해요.")]);
    E("gacha", {w: .8, rep: 1, cd: 12}, N("ガチャの 誘惑", "The gacha temptation", "抽卡的诱惑", "가챠의 유혹"),
        N("推しキャラの ピックアップが きた。 「あと1回で 出るかも」の 悪魔が ささやく…。", "Your favorite character's banner is live. A devil whispers: \"Maybe one more pull…\"", "喜欢的角色UP池来了。“再抽一次说不定就出了”的恶魔在耳边低语……", "최애 캐릭터 픽업이 왔어요. \"한 번만 더 하면 나올지도\" 하고 악마가 속삭여요…"), [
        X(N("課金する（¥10,000）", "Pay (¥10,000)", "氪金（¥10,000）", "과금한다(¥10,000)"), [{money: -10000, mp: 14}, N("出たーー！！ 最高の 気分！", "GOT IT!! Best feeling ever!", "出了——！！心情最棒！", "나왔다ㅡㅡ!! 최고의 기분!")], [{money: -10000, mp: -8, gam: 3}, N("爆死…。 財布も 心も 空っぽ。", "A total bust… wallet and heart both empty.", "惨败……钱包和内心都空了。", "폭사… 지갑도 마음도 텅 비었어요.")], {base: .4, hint: null}, {need: money(10000)}),
        C(N("ぐっと こらえる", "Hold back", "忍住", "꾹 참는다"), [O(1, {mp: 2, knw: 1}, N("無課金で 楽しむ のも ひとつの ゲーム。", "Playing free is its own game.", "不氪金玩也是一种游戏方式。", "무과금으로 즐기는 것도 하나의 게임이에요."))])
    ]);
    Q("subscription", {w: .8}, N("サブスクの 整理", "Cleaning up subscriptions", "整理订阅", "구독 정리"),
        N("明細を 見たら、使っていない サブスクが 3つも。 毎月 じわじわ お金が 出ていた。", "Checking your statement, three unused subscriptions quietly drain money monthly.", "查看明细，发现有3个没用的订阅。每月悄悄在扣钱。", "명세서를 보니 안 쓰는 구독이 3개나. 매달 슬금슬금 돈이 나갔어요."),
        [N("ぜんぶ 解約する", "Cancel them all", "全部取消", "전부 해지한다"), {money: 3000, knw: 1, mp: 3}, N("スッキリ！ 年間で 数万円の 節約に。", "Clean! It saves tens of thousands a year.", "清爽了！一年能省好几万日元。", "개운해요! 연간 수만 엔 절약이에요.")],
        [N("1つだけ のこす", "Keep just one", "只保留一个", "하나만 남긴다"), {money: 1800, mp: 2}, N("本当に 好きな 1つだけ。", "Just the one you truly love.", "只留下真正喜欢的一个。", "정말 좋아하는 하나만.")]);
    Q("cashless", {w: 1}, N("ポイント還元キャンペーン", "A points-back campaign", "积分返还活动", "포인트 환원 캠페인"),
        N("キャッシュレス決済で 20%還元！ 買い物の タイミング、いまかも。", "20% back on cashless payments! Maybe now's the time to shop.", "无现金支付返还20%！也许现在是购物的好时机。", "캐시리스 결제 20% 환원! 지금이 쇼핑할 타이밍일지도."),
        [N("必要な ものだけ 買う", "Buy only what you need", "只买需要的东西", "필요한 것만 산다"), {money: 4500, knw: 1}, N("賢く ポイントを ゲット！", "Smartly grabbed the points!", "聪明地拿到了积分！", "똑똑하게 포인트를 얻었어요!")],
        [N("つい 買いすぎる", "Overbuy", "不小心买多了", "그만 너무 많이 산다"), {money: -7500, mp: 8, chm: 1}, N("お得に 見えて 実は 散財…。", "Looked like a deal, actually a splurge…", "看似划算实则乱花钱……", "이득처럼 보여도 사실은 낭비…")]);
    E("gift_20", {wk: [1, 4], w: 3}, N("20歳の おいわい", "A 20th-birthday gift", "20岁的贺礼", "20살 축하 선물"),
        N("祖父母から 封筒が とどいた。「20歳 おめでとう。 好きに 使いなさい」", "An envelope from your grandparents: \"Happy 20th. Spend it as you like.\"", "祖父母寄来了信封：“20岁快乐。随你怎么用。”", "조부모님께 봉투가 도착했어요. \"20살 축하한다. 마음대로 써라\""), [
        C(N("貯金する", "Save it", "存起来", "저금한다"), [O(1, {money: 50000, mp: 4}, N("大切に 使おう。", "You'll use it carefully.", "好好珍惜地用。", "소중히 쓰자."))]),
        C(N("みんなで ごはん", "Treat friends to a meal", "请大家吃饭", "다 같이 식사"), [O(1, {money: 20000, mp: 12, soc: 4, rel: {ken: 4, misa: 3}}, N("「お前、いいやつだな！」 と 言われた。", "\"You're a good one!\" they said.", "大家说：“你真是个好人！”", "\"너 좋은 놈이네!\" 하고 말했어요."), {set: "treated"})]),
        C(N("自分への 投資（本）", "Invest in yourself (books)", "投资自己（买书）", "나에게 투자(책)"), [O(1, {money: 30000, knw: 5, skl: 2}, N("新しい 世界が ひらけた 気がする。", "A new world seems to open.", "感觉打开了新世界。", "새로운 세계가 열린 것 같아요."))])
    ]);
    Q("found_cash", {rep: 1, cd: 16, w: .7}, N("道に 落ちていた 財布", "A wallet on the street", "路上掉落的钱包", "길에 떨어진 지갑"),
        N("歩道に ぽつんと 財布が。 中には 現金と カードが 入っている。", "A wallet lies alone on the sidewalk, with cash and cards inside.", "人行道上孤零零地躺着一个钱包。里面有现金和卡片。", "인도에 지갑이 덩그러니. 안에는 현금과 카드가 들어 있어요."),
        [N("交番に とどける", "Take it to the police box", "送到派出所", "파출소에 가져간다"), {chm: 2, mp: 5, soc: 1}, N("持ち主から お礼の 連絡が きた。 いい気分！", "The owner got in touch to thank you. Feels great!", "失主来联系道谢。心情很好！", "주인이 고맙다고 연락했어요. 기분 좋아요!")],
        [N("見なかった ことに する", "Walk on by", "当作没看见", "못 본 척한다"), {mp: -3}, N("後味が 悪かった…。 やっぱり 気に なる。", "It left a bad taste… You can't stop thinking about it.", "心里不是滋味……还是放不下。", "뒷맛이 안 좋았어요… 역시 신경 쓰여요.")]);

    // ===== 健康 =====
    Q("cold", {rep: 1, cd: 12, w: 1.1, need: function(S){ return S.hlt < 85 || S.hp < 40; }}, N("風邪を ひいた", "You caught a cold", "感冒了", "감기에 걸렸어요"),
        N("のどが 痛い。 熱は 37.8度。 体が おもい…。", "Sore throat. 37.8°C fever. Your body feels heavy…", "喉咙痛。发烧37.8度。身体沉重……", "목이 아파요. 열은 37.8도. 몸이 무거워요…"),
        [N("病院に 行って 休む", "See a doctor and rest", "去医院并休息", "병원 가서 쉰다"), {hp: -10, money: -3000, hlt: 1, mp: -2}, N("薬が 効いて 3日で 回復。", "Medicine worked; recovered in three days.", "药起作用了，3天恢复。", "약이 들어 3일 만에 회복.")],
        [N("市販薬で がんばる", "Tough it out with OTC meds", "靠非处方药硬撑", "시판약으로 버틴다"), {hp: -20, hlt: -2, mp: -5, money: -800}, N("長引いて しんどかった…。", "It dragged on and was rough…", "拖了很久，很难受……", "오래 끌어서 힘들었어요…")]);
    E("health_check", {fix: 1, wk: [W(5, 10), W(6, 5)]}, N("健康診断の 結果", "Health-check results", "体检结果", "건강검진 결과"),
        N("封筒を ひらく。 数字が ずらり…。 「生活習慣に 気をつけましょう」と 書いてあるか どうか。", "You open the envelope. Rows of numbers… will it say \"watch your lifestyle\"?", "打开信封。一排排数字……上面会不会写着“请注意生活习惯”？", "봉투를 열어요. 숫자가 줄줄이… \"생활 습관에 주의하세요\"라고 적혀 있을까요?"), [
        X(N("結果を 見る", "Read the results", "查看结果", "결과를 본다"), [{knw: 1, mp: 4, hlt: 2}, N("ぜんぶ 『A判定』！ 自信が ついた。", "All 'A' ratings! Confidence boost.", "全部是“A判定”！有信心了。", "전부 'A 판정'! 자신감이 생겼어요.")], [{mp: -4, hlt: 0}, N("『要再検査』が いくつか…。 生活を 見なおそう。", "Some 'recheck needed'… time to rethink your habits.", "有几项“需复查”……该重新审视生活了。", "'재검사 필요'가 몇 개… 생활을 돌아봐야겠어요.")], {base: .15, s: ["hlt"], k: .008}),
        C(N("今日から 生活を 見なおす", "Reform your habits from today", "从今天起改善生活", "오늘부터 생활을 고친다"), [O(1, {drk: -8, smk: -6, gam: -3, hlt: 3, mp: 2}, N("お酒も たばこも 控えめに。 小さな 一歩。", "Less drinking and smoking. A small step.", "减少饮酒和吸烟。小小的一步。", "술도 담배도 줄이기. 작은 한 걸음."))])
    ]);
    Q("insomnia", {rep: 1, cd: 9, w: 1, need: function(S){ return S.mp < 55; }}, N("ねむれない 夜", "A sleepless night", "睡不着的夜晚", "잠 못 드는 밤"),
        N("布団に 入って 2時間。 目が さえて 眠れない。 スマホを つい 見てしまう。", "Two hours in bed, wide awake. You keep checking your phone.", "躺在被窝里2小时了，睡意全无。忍不住看手机。", "이불에 들어간 지 2시간. 눈이 말똥말똥. 자꾸 폰을 봐요."),
        [N("スマホを 置いて 深呼吸", "Put the phone down & breathe", "放下手机深呼吸", "폰을 두고 심호흡"), {hp: 10, mp: 7}, N("いつのまにか ねむっていた。", "You fell asleep before you knew it.", "不知不觉睡着了。", "어느새 잠들었어요.")],
        [N("朝まで 動画を 見る", "Watch videos till dawn", "刷视频到天亮", "아침까지 영상을 본다"), {hp: -12, mp: -5, fame: 120, hlt: -1}, N("おもしろかったけど 朝が つらい…。", "It was fun, but the morning hurts…", "是挺好玩，可早上好难受……", "재밌었지만 아침이 힘들어요…")]);

    // ===== 家族 =====
    Q("mom_call", {rep: 1, cd: 7, w: 1.2}, N("お母さんから 電話", "A call from Mom", "妈妈来电话", "엄마에게서 전화"),
        N("画面に 「お母さん」の 文字。 ちゃんと ごはん 食べてるか、いつもの 心配。", "\"Mom\" lights up the screen. The usual worry: are you eating properly?", "屏幕上显示“妈妈”。又是惯例的担心：有没有好好吃饭。", "화면에 \"엄마\". 밥은 잘 먹고 있는지, 늘 하는 걱정."),
        [N("ゆっくり 話す", "Talk for a while", "慢慢聊", "천천히 얘기한다"), {mp: 6, rel: {mom: 4}}, N("30分も しゃべって いた。 心が あたたまった。", "You talked for 30 minutes. Your heart warmed.", "聊了足足30分钟。内心暖暖的。", "30분이나 얘기했어요. 마음이 따뜻해졌어요.")],
        [N("あとで かけなおす", "Call back later", "晚点回电话", "나중에 다시 건다"), {rel: {mom: -1}}, N("結局 かけなおせなかった…。", "You ended up never calling back…", "结果没能回电话……", "결국 다시 못 걸었어요…")]);
    E("mom_ill", {wk: [W(5, 20), W(10, 30)], w: .8, need: function(S){ return S.rel.mom >= 40; }}, N("お母さんが 体調を くずした", "Mom isn't well", "妈妈身体不舒服", "엄마가 몸이 안 좋아요"),
        N("「ちょっと 熱が 出ただけ」と 母は 言うけれど、声が 弱い。 心配だ。", "\"Just a little fever,\" Mom says, but her voice is weak. You worry.", "妈妈说“只是有点发烧”，但声音很虚弱。让人担心。", "엄마는 \"열이 조금 났을 뿐\"이라지만 목소리가 약해요. 걱정돼요."), [
        C(N("すぐ 実家へ 帰る", "Rush home", "马上回老家", "바로 본가로 간다"), [O(1, {money: -8000, hp: -6, rel: {mom: 12}, mp: 4}, N("看病する {me}を 見て 「大きくなったね」と 笑った。", "Seeing you care for her, Mom smiled: \"You've grown.\"", "看着照顾她的{me}，妈妈笑着说：“你长大了呢”。", "간병하는 {me}을(를) 보며 \"컸구나\" 하고 웃으셨어요."))]),
        C(N("仕送りして 電話する", "Send money and call", "寄钱并打电话", "송금하고 전화"), [O(1, {money: -20000, rel: {mom: 5}, mp: -2}, N("「無理しないで」 と 言われたが うれしそう。", "\"Don't push yourself,\" she said, but she sounded glad.", "妈妈说“别勉强”，但听起来很开心。", "\"무리하지 마\"라고 했지만 기뻐 보였어요."))], {need: money(20000)}),
        C(N("電話だけ する", "Just call", "只打电话", "전화만 한다"), [O(1, {rel: {mom: -4}, mp: -4}, N("あとで 少し 後悔した。", "You regretted it a little later.", "之后有点后悔。", "나중에 조금 후회했어요."))])
    ]);
    Q("sibling_talk", {w: .8, wk: [W(3, 1), W(11, 30)]}, N("きょうだいの 相談", "Your sibling asks for advice", "兄弟姐妹来商量", "형제의 상담"),
        N("高校生の いとこが 「進路 どうしたらいい？」と 聞いてきた。 先輩として 答える番だ。", "A high-school cousin asks, \"What should I do about my future?\" Your turn to advise as a senior.", "高中生的表弟问：“出路该怎么选？”轮到你以前辈身份回答了。", "고등학생 사촌이 \"진로 어떻게 하지?\" 하고 물어요. 선배로서 대답할 차례예요."),
        [N("自分の 経験を 話す", "Share your experience", "分享自己的经历", "내 경험을 이야기한다"), {chm: 2, knw: 1, soc: 2, rel: {mom: 2}}, N("「話せて よかった」 と 言ってもらえた。", "\"I'm glad I talked to you,\" they said.", "对方说：“能和你聊太好了”。", "\"얘기해서 좋았어\"라는 말을 들었어요.")],
        [N("「好きに すれば？」と 言う", "Say \"Do what you like\"", "说“随你喜欢吧”", "\"맘대로 해\"라고 말한다"), {mp: 1, chm: -1}, N("そっけなかったかも…。", "Maybe that was a bit curt…", "也许有点冷淡了……", "좀 퉁명스러웠나…")]);
    Q("compliment", {w: 1.2}, N("ふいに ほめられた", "An unexpected compliment", "突然被夸了", "뜻밖의 칭찬"),
        N("すれちがった 人に 「その服 いいですね」と 声を かけられた。", "A passerby says, \"Nice outfit!\"", "擦肩而过的人对你说：“这件衣服真好看”。", "스쳐 지나간 사람이 \"그 옷 멋져요\" 하고 말을 걸었어요."),
        [N("笑顔で お礼を 言う", "Thank them with a smile", "笑着道谢", "미소로 감사 인사"), {chm: 2, mp: 6}, N("今日 一日 ごきげん。", "You were in a good mood all day.", "整天都心情很好。", "하루 종일 기분이 좋았어요.")],
        [N("照れて 逃げる", "Get shy and flee", "害羞地逃走", "쑥스러워서 도망"), {chm: 1, mp: 3}, N("顔が 熱い…。 でも うれしかった。", "Your face burns… but you were happy.", "脸好烫……但很开心。", "얼굴이 뜨거워요… 그래도 기뻤어요.")]);
})();
