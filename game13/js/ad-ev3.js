"use strict";
/* 20歳の冒険：イベント3（ストーリー：起業・配信・創作・資格・就職・昇進・家業・恋・たばこ） */
(function(){
    var AD = window.AD || globalThis.AD, E = AD.E, C = AD.C, O = AD.O, N = AD.N, W = AD.W, Q = AD.Q, X = AD.X;
    var money = function(n){ return function(S){ return S.money >= n; }; };
    var part = function(S){ return S.job && AD.JOBMAP[S.job].tier === "part"; };
    var full = function(S){ return S.job && AD.JOBMAP[S.job].tier === "full"; };

    // ===== 起業ストーリー =====
    E("idea_spark", {wk: [W(3, 1), W(8, 30)], w: 1.1, boost: function(S){ return S.flags.dreamer; }, need: function(S){ return S.skl >= 34 && S.knw >= 34 && !S.flags.idea; }},
        N("ひらめいた！", "A flash of an idea!", "灵光一闪！", "아이디어가 번뜩!"),
        N("シャワー中に 突然 ひらめいた。「これ、サービスに できるんじゃない？」 ノートに 走り書き。 心臓が ドキドキしている。", "In the shower, an idea hits: \"Could this be a real service?\" You scribble it down. Your heart pounds.", "洗澡时突然灵光一闪：“这个能做成服务吧？”在笔记本上匆匆记下。心跳加速。", "샤워 중 갑자기 번뜩였어요. \"이거 서비스로 만들 수 있지 않을까?\" 노트에 휘갈겨 써요. 심장이 두근거려요."), [
        C(N("本気で やってみる", "Go for it seriously", "认真去做", "진지하게 해 본다"), [O(1, {mp: 10, skl: 1, knw: 1}, N("挑戦の はじまり。 まずは 仲間さがしだ。", "The challenge begins. First, find teammates.", "挑战开始了。先找伙伴。", "도전의 시작. 먼저 동료를 찾자."), {set: "idea"})]),
        C(N("もう少し 温めておく", "Let it simmer", "再酝酿一下", "조금 더 묵혀 둔다"), [O(1, {knw: 2, mp: 2}, N("アイデアは ノートに 眠った。", "The idea slept in the notebook.", "点子沉睡在笔记本里。", "아이디어는 노트에서 잠들었어요."))])
    ]);
    E("cofounder", {wk: [W(3, 15), W(9, 15)], w: 2, need: function(S){ return S.flags.idea && !S.flags.cofounder && (S.rel.ken >= 30 || S.rel.noa >= 30); }},
        N("仲間を さそう", "Recruit a partner", "邀请伙伴", "동료를 꼬신다"),
        N("アイデアを 話せる 相手は…。 信頼できる 人に プレゼンしてみよう。", "Who can you share the idea with? Pitch it to someone you trust.", "能说出这个点子的对象是……向信任的人演示一下吧。", "아이디어를 말할 수 있는 상대는…. 믿을 수 있는 사람에게 프레젠테이션해 보자."), [
        X(N("{ken}に 話す", "Tell {ken}", "告诉{ken}", "{ken}에게 말한다"), [{mp: 10, rel: {ken: 8}, soc: 2}, N("「おもしろい！ のった！」 {ken}が 目を かがやかせた。", "\"Sounds great! I'm in!\" {ken}'s eyes sparkled.", "“有意思！算我一个！”{ken}眼睛闪闪发光。", "\"재밌다! 나도 할래!\" {ken}의 눈이 반짝였어요.")], [{mp: -4, rel: {ken: 1}}, N("「ごめん、今は ちょっと…」 ことわられた。", "\"Sorry, not right now…\" They declined.", "“抱歉，现在有点……”被拒绝了。", "\"미안, 지금은 좀…\" 거절당했어요.")], {base: .45, s: ["chm"], k: .004, rel: "ken"}),
        X(N("{noa}に 話す", "Tell {noa}", "告诉{noa}", "{noa}에게 말한다"), [{mp: 10, rel: {noa: 8}, skl: 1}, N("「ネットで 人 集める 手も あるよ！」 {noa}が ノリノリ。", "\"We can recruit people online too!\" {noa} is thrilled.", "“也可以在网上招人哦！”{noa}干劲十足。", "\"인터넷으로 사람 모을 수도 있어!\" {noa}이(가) 신나요.")], [{mp: -4}, N("「いいね…でも 忙しくて」 やんわり 断られた。", "\"Nice… but I'm busy.\" Gently declined.", "“不错……但我很忙”。被委婉拒绝了。", "\"좋네… 근데 바빠서\" 부드럽게 거절당했어요.")], {base: .4, s: ["chm"], k: .004, rel: "noa"})
    ].map(function(c, i){ var o = c.o; if(i === 0 || i === 1){ o[0].ex = {set: "cofounder"}; } return c; }));
    E("proto", {wk: [W(4, 15), W(10, 15)], w: 2, need: function(S){ return S.flags.cofounder && !S.flags.proto; }}, N("試作品づくり", "Building a prototype", "制作原型", "시제품 제작"),
        N("カフェの 隅で 夜まで 作業。 仲間と 画面を のぞきこむ。 動いた！！ …ちょっとだけ。", "Working at a café corner till night. You and your partner peer at the screen. It runs!! …barely.", "在咖啡馆角落工作到夜晚。和伙伴凑在一起看屏幕。动起来了！！……一点点。", "카페 구석에서 밤까지 작업. 동료와 화면을 들여다봐요. 움직였다!! …조금은."), [
        C(N("夜ふかしで 一気に つくる", "Pull all-nighters", "通宵一口气做完", "밤을 새워 단숨에 만든다"), [O(1, {skl: 5, hp: -14, mp: -4, money: -5000}, N("荒削りだけど 形に なった！", "Rough, but it has a shape!", "虽然粗糙，但成形了！", "거칠지만 형태가 됐어요!"), {set: "proto"})]),
        C(N("まず お客さんの 声を 聞く", "Listen to customers first", "先听听客户的声音", "먼저 고객의 목소리를 듣는다"), [O(1, {knw: 4, soc: 3, mp: -3, money: -3000}, N("方向性が はっきりしてきた。", "The direction became clear.", "方向变清晰了。", "방향성이 뚜렷해졌어요."), {set: "proto"})])
    ]);
    E("funding", {wk: [W(6, 1), W(11, 15)], w: 2, need: function(S){ return S.flags.proto && !S.flags.funded; }}, N("資金を どうする？", "How to fund it?", "资金怎么办？", "자금은 어떻게?"),
        N("開発も 宣伝も お金が かかる。 どうやって 資金を 集める？", "Development and marketing cost money. How will you raise it?", "开发和宣传都要花钱。怎么筹集资金？", "개발도 홍보도 돈이 들어요. 자금은 어떻게 모을까요?"), [
        X(N("投資家に ピッチする", "Pitch to investors", "向投资人路演", "투자자에게 피칭"), [{money: 150000, mp: 10, chm: 2}, N("熱意が 伝わり 出資が 決まった！", "Your passion came through; funding secured!", "热情传达到了，决定出资了！", "열정이 전해져 투자가 결정됐어요!")], [{mp: -9, chm: 1}, N("「まだ 早いね」 …今回は だめだった。", "\"It's still early.\" Not this time.", "“还早了点”……这次没成。", "\"아직 이르네요\" …이번엔 안 됐어요.")], {base: .15, s: ["chm", "skl", "soc"], k: .004}, {}),
        X(N("クラウドファンディング", "Crowdfunding", "众筹", "크라우드펀딩"), [{money: 100000, fame: 1500, soc: 3}, N("応援メッセージが つぎつぎと！ 目標達成！", "Messages of support pour in! Goal reached!", "应援留言接连不断！达成目标！", "응원 메시지가 줄줄이! 목표 달성!")], [{mp: -6, fame: 200}, N("目標には とどかなかった…。", "Fell short of the goal…", "没有达到目标……", "목표에 못 미쳤어요…")], {base: .22, s: ["soc"], k: .006, f: {}}),
        C(N("自分の お金で 始める（¥60,000）", "Self-fund it (¥60,000)", "自掏腰包开始（¥60,000）", "내 돈으로 시작(¥60,000)"), [O(1, {money: -60000, mp: 5}, N("小さく はじめる。 自由に 動ける。", "Start small. Freedom to move.", "从小做起。能自由行动。", "작게 시작해요. 자유롭게 움직일 수 있어요."), {set: "funded"})], {need: money(60000)})
    ].map(function(c){ if(c.chk && c.o[0].fx.money > 0) c.o[0].ex = {set: "funded"}; return c; }));
    E("first_sale", {wk: [W(7, 1), 51], w: 2, need: function(S){ return S.flags.funded && !S.flags.first_sale; }}, N("はじめての 売上", "Your first sale", "第一笔销售", "첫 매출"),
        N("リリース当日。 ドキドキしながら 管理画面を 更新する。 …1件、2件、3件！", "Launch day. You refresh the dashboard, heart racing. …One order, two, three!", "发布当天。紧张地刷新后台。……1单、2单、3单！", "출시 당일. 두근두근 관리 화면을 새로고침. …1건, 2건, 3건!"), [
        X(N("全力で 宣伝する", "Promote with everything", "全力宣传", "전력으로 홍보"), [{money: 60000, fame: 2000, mp: 12, soc: 3}, N("口コミが 広がって 大ヒット スタート！", "Word of mouth spread — a hit start!", "口碑传开，开局大热！", "입소문이 퍼져 대히트 스타트!")], [{money: -20000, mp: -6}, N("思ったほど 伸びなかった…。", "It didn't take off as hoped…", "增长没有想象的好……", "생각만큼 늘지 않았어요…")], {base: .4, s: ["chm", "skl"], k: .004, c: {posts: .01}}, {})
    ].map(function(c){ c.o[0].ex = {set: "first_sale"}; c.o[1].ex = {set: "first_sale_ng"}; return c; }));
    E("startup_final", {wk: [W(10, 1), 51], w: 4, need: function(S){ return S.flags.idea && S.flags.proto && S.flags.funded && !S.flags.startup_ok && !S.flags.startup_fail; }},
        N("勝負の とき", "The moment of truth", "决胜时刻", "승부의 때"),
        N("事業を 拡大するか、ここで 区切りを つけるか。 仲間と 夜通し 話し合った。 決めるのは {me}だ。", "Scale up, or call it here? You talked through the night with your partner. The decision is yours.", "是扩大事业，还是到此为止？和伙伴彻夜商谈。决定权在{me}手里。", "사업을 확대할지 여기서 매듭지을지. 동료와 밤새 의논했어요. 결정은 {me}의 몫이에요."), [
        X(N("拡大に ふみきる！", "Go all in on scaling!", "决心扩大！", "확대에 나선다!"), [{money: 220000, mp: 20, chm: 3, soc: 4, fame: 5000}, N("大きな 契約が とれた！ 事業が 本格的に まわりだした！", "You landed a big contract! The business is truly rolling!", "拿到了大合同！事业开始真正运转了！", "큰 계약을 땄어요! 사업이 본격적으로 돌아가기 시작했어요!")], [{money: -50000, mp: -14, chm: -1}, N("拡大が 空回り。 資金が とけていく…。", "Scaling fizzled. The funds melted away…", "扩张空转。资金不断消耗……", "확대가 헛돌았어요. 자금이 녹아내려요…")], {base: .08, s: ["skl", "soc", "chm", "knw"], k: .0018, f: {first_sale: .14, first_sale_ng: -.04, cofounder: .06}}, {}),
        C(N("ここで 一度 区切りを つける", "Call it here", "到此为止", "여기서 일단 마무리"), [O(1, {mp: 4, knw: 3, skl: 2}, N("悔しいけど 清々しい。 経験は ぜんぶ 自分の もの。", "It stings but feels clean. All the experience is yours.", "虽不甘心但很畅快。经验全都属于自己。", "분하지만 후련해요. 경험은 전부 내 거예요."), {set: "startup_fail"})])
    ].map(function(c, i){ if(i === 0){ c.o[0].ex = {set: "startup_ok"}; c.o[1].ex = {set: "startup_fail"}; } return c; }));

    // ===== 配信・SNS ストーリー =====
    Q("first_fans", {w: 2, need: function(S){ return S.fame >= 900; }}, N("はじめての ファンレター", "Your first fan message", "第一封粉丝来信", "첫 팬레터"),
        N("DMに 「いつも 見てます。 元気 もらってます！」 初めて 知らない 人から 熱い メッセージが。", "A DM: \"I always watch! You give me energy!\" Your first warm message from a stranger.", "私信里写着“一直在看你！从你这里得到了活力！”第一次收到陌生人的热情留言。", "DM에 \"항상 보고 있어요. 힘을 얻어요!\" 처음으로 모르는 사람에게서 뜨거운 메시지가 왔어요."),
        [N("ていねいに 返信する", "Reply thoughtfully", "认真回复", "정성스럽게 답장"), {chm: 2, mp: 12, fame: 300}, N("やる気が 100倍に なった！", "Your motivation shot up 100x!", "干劲暴涨100倍！", "의욕이 100배가 됐어요!")],
        [N("うれしすぎて 固まる", "Freeze from happiness", "开心得僵住了", "너무 기뻐서 굳는다"), {mp: 10}, N("画面を 見て にやにや してしまった。", "You grinned at the screen.", "盯着屏幕傻笑起来。", "화면을 보며 히죽히죽 웃었어요.")]);
    E("collab_noa", {w: 2.2, need: function(S){ return S.fame >= 3000 && S.rel.noa >= 25 && !S.flags.collab; }}, N("{noa}と コラボ", "Collab with {noa}", "和{noa}联动", "{noa}와(과) 콜라보"),
        N("{noa}から 「一緒に 企画 やらない？」 と 提案。 お互いの フォロワーに 届く チャンス。", "{noa} proposes: \"Want to do a project together?\" A chance to reach each other's followers.", "{noa}提议：“要不要一起做企划？”这是触达彼此粉丝的好机会。", "{noa}이(가) \"같이 기획 해 볼래?\" 하고 제안했어요. 서로의 팔로워에게 닿을 기회예요."), [
        X(N("全力で 企画する", "Plan it all-out", "全力策划", "전력으로 기획"), [{fame: 7000, mp: 12, rel: {noa: 10}, skl: 2}, N("企画が 大ウケ！ 再生数が 伸びまくり！", "The project was a smash! Views skyrocketed!", "企划大受欢迎！播放量暴涨！", "기획이 대박! 조회수가 폭등!")], [{fame: 800, mp: -3, rel: {noa: 4}}, N("まあまあ の 反応。 でも 楽しかった！", "A so-so response. But it was fun!", "反应一般。不过很开心！", "반응은 그저 그랬지만 즐거웠어요!")], {base: .5, s: ["chm", "skl"], k: .004, c: {posts: .008}})
    ].map(function(c){ c.o[0].ex = {set: "collab"}; c.o[1].ex = {set: "collab"}; return c; }));
    E("sponsor", {w: 2, need: function(S){ return S.fame >= 12000 && !S.flags.sponsor; }}, N("企業案件の おさそい", "A sponsorship offer", "企业合作邀请", "기업 협찬 제안"),
        N("企業から 「商品を 紹介して もらえませんか」と DM。 報酬は 8万円。 でも ちょっと 怪しい 商品…？", "A company DMs: \"Could you introduce our product?\" ¥80,000. But the product seems a bit sketchy…?", "企业私信：“能请你介绍我们的商品吗？”报酬8万日元。不过这商品有点可疑……？", "기업에서 \"상품을 소개해 주실 수 있나요?\" DM. 보수는 8만 엔. 하지만 좀 수상한 상품…?"), [
        C(N("使ってみて 良ければ 受ける", "Try it first, accept if good", "试用后觉得好才接", "써 보고 좋으면 받는다"), [O(1, {money: 80000, knw: 2, fame: 2500, mp: 5}, N("良い 商品だった。 ステマに ならず 正直に 紹介。", "A good product. You promoted it honestly.", "是好商品。如实介绍，没有变成暗广。", "좋은 상품이었어요. 광고 티 없이 솔직하게 소개했어요."), {set: "sponsor"})], {need: function(S){ return S.knw >= 30; }}),
        C(N("お金に つられて 受ける", "Take it for the money", "为了钱接下", "돈에 끌려 받는다"), [O(1, {money: 80000, fame: -1500, mp: -6, chm: -2}, N("「それ ほんとに 良いの？」と コメントが あふれた…。", "Comments flood in: \"Is it really good?\"…", "评论里满是“这真的好吗？”……", "\"그거 정말 좋은 거야?\" 댓글이 넘쳐났어요…"), {set: "sponsor"})]),
        C(N("信頼を 優先して 断る", "Decline to protect trust", "为了信任而拒绝", "신뢰를 위해 거절"), [O(1, {fame: 1200, chm: 2, mp: 3}, N("「信じて よかった」と ファンが ふえた。", "\"Glad I trusted you!\" Fans grew.", "“信你是对的”，粉丝增加了。", "\"믿길 잘했어\" 팬이 늘었어요."))])
    ]);
    E("flame", {rep: 1, cd: 20, w: 1.2, need: function(S){ return S.fame >= 6000; }}, N("炎上の ひ", "Backlash day", "被网暴的一天", "논란의 날"),
        N("言葉足らずの 投稿が 切りとられ、批判が 殺到。 通知が 止まらない…。 手が ふるえる。", "A poorly worded post was clipped and criticism flooded in. Notifications won't stop… your hands shake.", "一条措辞不当的帖子被截取，批评铺天盖地而来。通知停不下来……手在发抖。", "말이 부족했던 게시물이 잘려 나가 비판이 쇄도해요. 알림이 멈추지 않아요… 손이 떨려요."), [
        X(N("誠実に 説明・謝罪する", "Explain and apologize sincerely", "诚恳说明并道歉", "성실히 설명·사과"), [{fame: 800, mp: -6, chm: 2}, N("誠意が 伝わり 少しずつ 落ちついた。 学びに なった。", "Sincerity got through and things calmed. A lesson learned.", "诚意传达到了，渐渐平息。成了一次教训。", "성의가 전해져 조금씩 가라앉았어요. 배움이 됐어요.")], [{fame: -2000, mp: -12}, N("言葉が 空回り…。 フォロワーが 減った。", "Your words fell flat… followers dropped.", "言辞空转……粉丝减少了。", "말이 헛돌았어요… 팔로워가 줄었어요.")], {base: .55, s: ["chm", "knw"], k: .004}),
        C(N("しばらく 投稿を やめる", "Stop posting for a while", "暂时停止发帖", "한동안 게시를 멈춘다"), [O(1, {fame: -600, mp: 5, hp: 6}, N("スマホから 離れて 心を 休めた。", "You stepped away from your phone and rested your mind.", "离开手机，让内心休息。", "폰에서 벗어나 마음을 쉬게 했어요."))]),
        C(N("強く 反論する", "Fight back hard", "强硬反驳", "강하게 반박한다"), [O(1, {fame: -4000, mp: -14, chm: -2}, N("火に 油を 注いだ…。 かなり 荒れた。", "You poured oil on the fire… it got ugly.", "火上浇油……局面变得很糟。", "불난 집에 기름을 부었어요… 많이 시끄러워졌어요."))])
    ]);
    E("big_stage", {w: 2, need: function(S){ return S.fame >= 30000 && !S.flags.big_stage; }}, N("大きな ステージの 依頼", "A huge stage invitation", "大型舞台的邀约", "큰 무대 섭외"),
        N("リアルイベントへの 出演依頼。 ステージの 向こうに 数千人。 緊張で 足が すくむ…けど。", "An offer to appear at a live event. Thousands beyond the stage. Your legs stiffen with nerves… but.", "收到线下活动的出演邀请。舞台对面有数千人。紧张得腿发软……但是。", "오프라인 행사 출연 의뢰. 무대 너머에 수천 명. 긴장으로 다리가 후들거려요… 하지만."), [
        X(N("出演する！", "Take the stage!", "出演！", "출연한다!"), [{fame: 40000, money: 60000, mp: 16, chm: 3}, N("大歓声！ 人生で いちばん キラキラした 夜。", "A roar of cheers! The most dazzling night of your life.", "震耳欲聋的欢呼！人生中最闪耀的夜晚。", "대환호! 인생에서 가장 반짝이는 밤.")], [{fame: 3000, money: 20000, mp: -6}, N("緊張で ガチガチ…。 でも やりきった！", "Stiff with nerves… but you pulled through!", "紧张得僵硬……但总算完成了！", "긴장으로 굳었지만… 끝까지 해냈어요!")], {base: .5, s: ["chm", "skl"], k: .004}),
        C(N("今は 辞退する", "Decline for now", "现在先婉拒", "지금은 사양"), [O(1, {mp: 2}, N("次の チャンスを 待つことに した。", "You'll wait for the next chance.", "决定等待下一次机会。", "다음 기회를 기다리기로 했어요."))])
    ].map(function(c, i){ if(i === 0){ c.o[0].ex = {set: "big_stage"}; c.o[1].ex = {set: "big_stage"}; } return c; }));

    // ===== 創作・資格 =====
    E("contest_call", {w: 2, wk: [W(4, 1), W(11, 15)], need: function(S){ return S.skl >= 40 && (S.cnt.create || 0) >= 6 && !S.flags.contest; }}, N("コンテストの 公募", "A contest call", "比赛征集", "공모전"),
        N("作品を 募集する 大きな コンテスト。 結果しだいで デビューの 道も…。 応募する？", "A big contest accepts submissions. Success could mean a debut. Enter?", "一个大型比赛在征集作品。结果也许能通往出道之路……要参加吗？", "작품을 모집하는 큰 공모전. 결과에 따라 데뷔의 길도…. 응모할까요?"), [
        X(N("全力の 作品で 応募", "Submit your best work", "用全力之作应征", "최고의 작품으로 응모"), [{fame: 2500, mp: 14, skl: 3}, N("【入賞！】 審査員に 才能を 認められた！ デビューが 決まった！", "WINNER! The judges recognized your talent! Debut confirmed!", "【获奖！】才华得到评委认可！决定出道了！", "【입상!】 심사위원이 재능을 인정했어요! 데뷔 결정!")], [{mp: -8, skl: 3, knw: 1}, N("結果は 落選。 でも 次に つながる 手ごたえは あった。", "Not selected. But you felt it would lead somewhere.", "落选了。不过有种能通向下次的手感。", "결과는 낙선. 하지만 다음으로 이어질 손맛이 있었어요.")], {base: .02, s: ["skl"], k: .0075, c: {create: .01}}),
        C(N("まだ 実力不足。 見おくる", "Not ready. Skip", "实力还不够。先放弃", "아직 실력 부족. 보류"), [O(1, {skl: 2, mp: 1}, N("もう少し 腕を みがいてから。", "Sharpen your skills a bit more first.", "再磨练一下技艺。", "좀 더 실력을 다듬은 뒤에."))])
    ].map(function(c, i){ if(i === 0){ c.o[0].ex = {set: ["contest", "debut"]}; c.o[1].ex = {set: "contest"}; } else { c.o[0].ex = {set: "contest"}; } return c; }));
    E("license_plan", {w: 1.5, wk: [W(2, 1), W(8, 30)], need: function(S){ return S.knw >= 38 && !S.flags.license_plan && !S.flags.license; }}, N("資格に ちょうせん？", "Try for a qualification?", "要挑战资格证吗？", "자격증에 도전?"),
        N("書店で 資格の 参考書が 目に とまった。「これ 取れたら 仕事の 幅が 広がるかも」", "A qualification textbook catches your eye. \"If I get this, my options could widen.\"", "书店里一本资格考试参考书映入眼帘。“要是拿到这个，工作范围或许会变广”。", "서점에서 자격증 참고서가 눈에 띄었어요. \"이걸 따면 일의 폭이 넓어질지도\""), [
        C(N("参考書を 買って 挑戦する", "Buy it and go for it", "买下参考书挑战", "참고서를 사서 도전"), [O(1, {money: -4000, knw: 3, mp: 4}, N("受験日に 向けて 勉強スタート！ 勉強を 重ねるほど 合格に 近づく。", "Studying begins for the exam! The more you study, the closer you get.", "为考试日开始学习！学得越多越接近合格。", "시험일을 향해 공부 시작! 공부를 쌓을수록 합격에 가까워져요."), {set: "license_plan"})], {need: money(4000)}),
        C(N("今は いいや", "Not now", "现在算了", "지금은 됐어"), [O(1, {})])
    ]);
    E("license_exam", {w: 4, wk: [W(9, 1), W(12, 20)], need: function(S){ return S.flags.license_plan && !S.flags.license && (S.cnt.study || 0) >= 8; }}, N("資格試験の 日", "Exam day", "资格考试日", "자격시험 날"),
        N("試験会場。 まわりの 人が みんな 賢そうに 見える。 深呼吸して 問題用紙を めくる…。", "The exam hall. Everyone around looks smart. You breathe deeply and flip the paper…", "考场。周围的人看起来都很聪明。深呼吸后翻开试卷……", "시험장. 주변 사람이 다 똑똑해 보여요. 심호흡하고 문제지를 넘겨요…"), [
        X(N("全力で 解く", "Give it everything", "全力作答", "전력으로 푼다"), [{knw: 3, mp: 14, skl: 3}, N("【合格！】 合格通知を 握りしめて ガッツポーズ！", "PASSED! You pump your fist, clutching the notice!", "【合格！】握着合格通知摆出胜利姿势！", "【합격!】 합격 통지서를 쥐고 주먹을 불끈!")], [{knw: 2, mp: -8}, N("あと 数点で 不合格…。 次は 取れる はず。", "A few points short… you'll get it next time.", "差几分没合格……下次一定能考上。", "몇 점 차로 불합격… 다음엔 딸 수 있을 거예요.")], {base: .1, s: ["knw"], k: .008, c: {study: .012}})
    ].map(function(c){ c.o[0].ex = {set: "license"}; return c; }));

    // ===== 就職・昇進 =====
    Q("intern", {w: 1.2, wk: [W(3, 1), W(10, 30)], need: function(S){ return (S.cnt.career || 0) >= 1 && S.knw >= 35 && !S.flags.intern; }}, N("インターンの おさそい", "An internship invitation", "实习邀请", "인턴십 제안"),
        N("気になる 会社の 短期インターンの 案内。 仕事の 現場を 見られる チャンス。", "A short-term internship notice from a company you like. A chance to see the workplace.", "感兴趣的公司的短期实习通知。是了解工作现场的机会。", "관심 가는 회사의 단기 인턴십 안내. 일의 현장을 볼 기회예요."),
        [N("参加する", "Join it", "参加", "참가한다"), {knw: 4, soc: 4, skl: 2, hp: -8, mp: -3}, N("社会人の 空気が わかった。 志望動機に 厚みが 出た。", "You felt the working world. Your motivation statement gained depth.", "体会到了职场氛围。求职动机更有分量了。", "사회인의 분위기를 알았어요. 지원 동기에 깊이가 생겼어요."), {set: "intern"}],
        [N("バイトを 優先する", "Prioritize work", "优先打工", "알바를 우선"), {money: 8000}, N("収入は 安定。 でも 少し もったいなかったかも。", "Income steady. But maybe a missed chance.", "收入稳定。但也许有点可惜。", "수입은 안정적이지만 조금 아까울지도.")]);
    Q("ob_visit", {w: 1.1, wk: [W(3, 1), W(10, 30)], need: function(S){ return (S.cnt.career || 0) >= 2 && !S.flags.ob; }}, N("OB訪問", "Alumni visit", "拜访校友", "선배 방문"),
        N("{aki}の 紹介で 大企業に 勤める 先輩と 話せることに。 質問を 考えておこう。", "Through {aki}, you get to talk with a senior at a big company. Better prepare questions.", "通过{aki}的介绍，可以和在大企业工作的前辈聊聊。得准备好问题。", "{aki}의 소개로 대기업에 다니는 선배와 이야기할 수 있게 됐어요. 질문을 준비하자."),
        [N("しっかり 準備して 行く", "Prepare thoroughly", "做足准备去", "철저히 준비해서 간다"), {knw: 3, soc: 4, chm: 2, rel: {aki: 6}}, N("「その質問、いいね」 と ほめられた。", "\"That's a good question,\" they said.", "对方夸道：“这个问题不错”。", "\"그 질문 좋네\" 하고 칭찬받았어요."), {set: "ob"}],
        [N("ぶっつけ本番で 行く", "Wing it", "直接硬上", "무작정 간다"), {soc: 2, mp: -4}, N("あまり 深い話は できなかった…。", "You couldn't go deep…", "没能聊得很深入……", "깊은 얘기는 못 했어요…"), {set: "ob"}]);
    E("promotion", {w: 2, need: function(S){ return S.job && S.jobWk >= 16 && !S.flags.promo && S.absent === 0; }}, N("昇進・昇給の はなし", "A promotion offer", "晋升加薪的消息", "승진·승급 이야기"),
        N("{aki}に 呼ばれた。「最近 よく がんばってるな。 来月から 責任ある 立場を まかせたいんだ」", "{aki} calls you in: \"You've been working hard. I'd like to give you more responsibility next month.\"", "{aki}叫你过去：“最近很努力啊。下个月起想让你担任更有责任的职位”。", "{aki}이(가) 불렀어요. \"요즘 열심히 하네. 다음 달부터 책임 있는 자리를 맡기고 싶어.\""), [
        C(N("よろこんで 引きうける", "Gladly accept", "欣然接受", "기꺼이 맡는다"), [O(1, {mp: 8, chm: 2, skl: 2, rel: {aki: 8}}, N("時給も 上がる。 責任の おもみも 感じる。", "Pay goes up. So does the weight of responsibility.", "时薪上涨，也感到责任的分量。", "시급도 오르고 책임의 무게도 느껴요."), {set: "promo"})]),
        C(N("まだ 自信が ない", "I'm not confident yet", "还没有自信", "아직 자신이 없어요"), [O(1, {mp: -2, rel: {aki: 1}}, N("「そうか。 また 声を かけるよ」", "\"I see. I'll ask again later.\"", "“这样啊。以后再找你”。", "\"그래? 또 얘기하자\""))])
    ]);
    E("promotion2", {w: 1.6, need: function(S){ return S.flags.promo && !S.flags.promo2 && S.jobWk >= 34 && S.absent === 0; }}, N("さらに 上へ", "Further up", "更进一步", "더 위로"),
        N("チームリーダーに 推薦された。 みんなの 前で 話す 場面が ふえそうだ。", "You've been recommended as team leader. You'll speak in front of everyone more.", "被推荐为团队负责人。在大家面前讲话的场合会变多。", "팀 리더로 추천받았어요. 모두 앞에서 말할 일이 늘 것 같아요."), [
        C(N("チャレンジする", "Take the challenge", "接受挑战", "도전한다"), [O(1, {mp: 6, chm: 3, soc: 3, skl: 2, hp: -4}, N("チームを まとめる 難しさと 楽しさ。", "The difficulty and joy of leading a team.", "领导团队的难处与乐趣。", "팀을 이끄는 어려움과 즐거움."), {set: "promo2"})]),
        C(N("現場に 専念する", "Stay on the front lines", "专注现场", "현장에 전념한다"), [O(1, {skl: 2, mp: 2}, N("得意な ことを 磨く 道も ある。", "Polishing what you're good at is a path too.", "打磨擅长之事也是一条路。", "잘하는 걸 갈고닦는 길도 있어요."))])
    ]);
    E("staff_offer", {w: 1.6, need: function(S){ return part(S) && S.jobWk >= 22 && !S.flags.staff_offer && S.absent === 0 && S.job !== "family"; }}, N("正社員に ならない？", "Become a full-timer?", "要不要转正？", "정규직 안 할래?"),
        N("「正社員に ならないか？」 と 打診された。 安定は 魅力だけど、自由な 時間は へりそう。", "\"Would you consider full-time?\" Stability appeals, but you'd lose free time.", "被问“要不要转正式员工？”稳定很有吸引力，但自由时间会减少。", "\"정규직 어때?\" 하고 제안받았어요. 안정은 매력적이지만 자유 시간이 줄 것 같아요."), [
        C(N("正社員に なる", "Go full-time", "转为正式员工", "정규직이 된다"), [O(1, {mp: 4, money: 5000}, N("名刺が できた。 責任と お給料が ふえた。", "You got business cards. More responsibility and pay.", "有了名片。责任和工资都增加了。", "명함이 생겼어요. 책임과 월급이 늘었어요."), {job: "office", set: "staff_offer"})]),
        C(N("今の まま で いい", "Stay as I am", "保持现状", "지금 그대로가 좋아"), [O(1, {mp: 2}, N("自分の ペースを 大切にしたい。", "You value your own pace.", "想珍惜自己的节奏。", "내 페이스를 소중히 하고 싶어요."), {set: "staff_offer"})])
    ]);
    E("raise_talk", {w: 1.2, need: function(S){ return part(S) && S.jobWk >= 10 && !S.flags.promo && S.job !== "family"; }}, N("時給アップ交渉", "Ask for a raise", "申请涨时薪", "시급 인상 협상"),
        N("同期の バイトが 時給を 上げて もらったらしい。 自分も 言ってみる？", "A coworker got a raise. Should you ask too?", "同期的打工人好像涨了时薪。自己也要说说看吗？", "동기 알바가 시급을 올렸대요. 나도 말해 볼까요?"), [
        X(N("店長に 交渉する", "Negotiate with the boss", "向店长交涉", "점장에게 협상"), [{mp: 8, chm: 2, soc: 1}, N("「実績 認めるよ」 時給が アップ！", "\"I recognize your work.\" Your wage goes up!", "“认可你的业绩”。时薪上涨了！", "\"실적 인정해\" 시급이 올랐어요!")], [{mp: -5}, N("「今は むずかしい」 …言い出しにくく なった。", "\"Not right now.\" It's awkward to bring up again.", "“现在有点难”……之后更难开口了。", "\"지금은 어려워\" …다시 말 꺼내기 어려워졌어요.")], {base: .25, s: ["chm", "skl"], k: .004, c: {shifts: .008}}, {})
    ].map(function(c){ c.o[0].ex = {set: "promo"}; return c; }));
    Q("meet_senior", {w: 1.5, wk: [0, W(6, 30)], need: function(S){ return S.job && !S.rel.dai; }}, N("職場の 先輩", "A senior at work", "职场前辈", "직장 선배"),
        N("{dai}が 「お前、新人？ わからないこと あったら 聞けよ」と 肩を たたいた。", "{dai} claps your shoulder: \"New here? Ask me if you're stuck.\"", "{dai}拍了拍你的肩：“你是新人？不懂的就问我”。", "{dai}이(가) \"신입이야? 모르는 거 있으면 물어봐\" 하고 어깨를 두드렸어요."),
        [N("たよりに させてもらう", "Rely on them", "好好依赖前辈", "의지하기로 한다"), {rel: {dai: 20}, soc: 2, mp: 3, skl: 1}, N("面倒見の いい 先輩だ。 仕事が ぐっと ラクに。", "A caring senior. Work got much easier.", "是个很照顾人的前辈。工作轻松了不少。", "잘 챙겨 주는 선배예요. 일이 훨씬 편해졌어요.")],
        [N("ひとりで がんばる", "Do it alone", "自己努力", "혼자 힘으로 해 본다"), {rel: {dai: 6}, skl: 2, mp: -2}, N("遠慮したけど {dai}は 気に かけてくれている。", "You held back, but {dai} is looking out for you.", "虽然客气推辞，{dai}还是很关心你。", "사양했지만 {dai}은(는) 신경 써 줘요.")]);

    // ===== 家業 =====
    E("gpa_story", {w: 2.5, wk: [W(3, 1), W(9, 30)], need: function(S){ return S.flags.heir && !S.flags.heir_commit && !S.flags.heir_no; }}, N("おじいちゃんの 話", "Grandpa's story", "爷爷的话", "할아버지의 이야기"),
        N("閉店後の 店で {gpa}が ぽつり。「この店は わしの 代で おわりかも しれん…。 でも お前が 継いで くれたらなぁ」", "After closing, {gpa} murmurs: \"This shop may end with me… but if you took over…\"", "打烊后的店里，{gpa}喃喃道：“这家店也许到我这代就结束了……但要是你能继承就好了”。", "폐점 후의 가게에서 {gpa}이(가) 중얼거려요. \"이 가게는 내 대에서 끝일지도… 하지만 네가 이어 준다면\""), [
        C(N("継ぐ決意を する", "Resolve to take over", "下定决心继承", "잇기로 결심한다"), [O(1, {mp: 8, skl: 3, rel: {gpa: 14, mom: 5}}, N("「ほんとか！」 {gpa}の 目に 涙が にじんだ。", "\"Really?!\" Tears welled in {gpa}'s eyes.", "“真的吗！”{gpa}眼里泛起泪光。", "\"정말이냐!\" {gpa}의 눈에 눈물이 맺혔어요."), {set: "heir_commit"})]),
        C(N("もう少し 考えさせて", "Let me think more", "再让我想想", "조금 더 생각하게 해 줘"), [O(1, {mp: -2, rel: {gpa: 1}}, N("「ゆっくりで いいぞ」", "\"Take your time.\"", "“慢慢来就好”。", "\"천천히 해라\""), {q: ["gpa_story2", 8]})]),
        C(N("自分の 道を 行きたい", "I want my own path", "我想走自己的路", "내 길을 가고 싶어요"), [O(1, {mp: -4, rel: {gpa: -6}}, N("{gpa}は さみしそうに 笑った。「そうか…」", "{gpa} smiled sadly. \"I see…\"", "{gpa}寂寞地笑了笑：“这样啊……”", "{gpa}은(는) 쓸쓸하게 웃었어요. \"그렇구나…\""), {set: "heir_no"})])
    ]);
    E("gpa_story2", {src: "sys"}, N("おじいちゃんの 店の 前で", "In front of Grandpa's shop", "在爷爷的店前", "할아버지 가게 앞에서"),
        N("{gpa}は もう 話を 蒸しかえさない。 でも 毎朝 のれんを あげる 背中は 少し 小さく 見えた。", "{gpa} doesn't bring it up again. But the back raising the shop curtain each morning looks a little smaller.", "{gpa}不再重提此事。但每天早上挂门帘的背影，看起来小了一点。", "{gpa}은(는) 더 이상 말을 꺼내지 않아요. 하지만 매일 아침 포렴을 올리는 뒷모습이 조금 작아 보였어요."), [
        C(N("継ぐ決意を する", "Resolve to take over", "下定决心继承", "잇기로 결심한다"), [O(1, {mp: 8, skl: 3, rel: {gpa: 12}}, N("「…ありがとう」 {gpa}が ぼそっと 言った。", "\"…Thank you,\" {gpa} said quietly.", "“……谢谢”{gpa}轻声说道。", "\"…고맙다\" {gpa}이(가) 낮게 말했어요."), {set: "heir_commit"})]),
        C(N("やっぱり 継がない", "Still, I won't", "还是不继承", "역시 잇지 않는다"), [O(1, {mp: -3, rel: {gpa: -3}}, N("自分の 人生は 自分で 決める。", "Your life is yours to decide.", "自己的人生自己决定。", "내 인생은 내가 정해요."), {set: "heir_no"})])
    ]);
    Q("gpa_recipe", {w: 1.3, need: function(S){ return S.flags.heir && S.rel.gpa >= 55; }}, N("秘伝の 味", "The secret recipe", "秘传的味道", "비전의 맛"),
        N("{gpa}が 「今日は お前に 教えてやる」 と 古い ノートを 取りだした。", "{gpa} pulls out an old notebook: \"Today I'll teach you.\"", "{gpa}拿出一本旧笔记本：“今天教你”。", "{gpa}이(가) \"오늘은 너에게 가르쳐 주마\" 하며 낡은 노트를 꺼냈어요."),
        [N("ていねいに メモを とる", "Take careful notes", "认真做笔记", "꼼꼼히 메모한다"), {skl: 4, knw: 2, rel: {gpa: 8}, mp: 5}, N("何十年分の 工夫が つまっていた。", "Decades of ingenuity were packed in.", "里面凝结着几十年的功夫。", "수십 년의 노하우가 담겨 있었어요.")],
        [N("まず 作ってみる", "Try cooking it first", "先试着做做", "먼저 만들어 본다"), {skl: 5, hp: -3, rel: {gpa: 5}}, N("「ぜんぜん ちがう！」 と 笑われながら 覚えた。", "\"That's all wrong!\" they laughed as you learned.", "在“完全不对！”的笑声中学会了。", "\"전혀 아니야!\" 하고 웃음을 사며 배웠어요.")]);
    Q("shop_online", {w: 1.2, need: function(S){ return S.flags.heir && S.skl >= 30 && S.fame >= 400; }}, N("お店を ネットで 発信", "Promote the shop online", "在网上宣传店铺", "가게를 온라인으로 홍보"),
        N("{gpa}の 店の 名物を SNSに のせたら、思わぬ 反響が。 注文の 電話が 鳴りやまない！", "You post the shop's specialty on social media — and the response is huge. The order phone won't stop ringing!", "把{gpa}店里的招牌发到SNS上，反响出乎意料。订购电话响个不停！", "{gpa}의 가게 명물을 SNS에 올렸더니 뜻밖의 반응. 주문 전화가 끊이지 않아요!"),
        [N("注文を 全力で さばく", "Handle every order", "全力处理订单", "주문을 전력으로 처리"), {money: 30000, fame: 1800, hp: -10, rel: {gpa: 6}, mp: 6}, N("へとへと。 でも 店が 活気づいた！", "Exhausted. But the shop came alive!", "累得够呛。但店里变得有活力了！", "녹초지만 가게에 활기가 돌았어요!")],
        [N("数を しぼって ていねいに", "Limit orders, do them carefully", "限量并认真制作", "수량을 줄이고 정성껏"), {money: 15000, fame: 800, rel: {gpa: 8}, mp: 3}, N("「品質が 第一」 {gpa}も ほめてくれた。", "\"Quality first.\" {gpa} praised you.", "“品质第一”。{gpa}也夸了你。", "\"품질이 최우선\" {gpa}도 칭찬해 줬어요.")]);

    // ===== 恋（やさしい 恋愛。だれも きずつけない） =====
    E("confess_misa", {w: 3, need: function(S){ return S.rel.misa >= 58 && (S.cnt.a_date || 0) >= 2 && !S.flags.lover_misa && !S.flags.lover_sak && !S.flags.misa_no; }}, N("{misa}への 気持ち", "Your feelings for {misa}", "对{misa}的心意", "{misa}에 대한 마음"),
        N("おさななじみ だったはずなのに、笑顔を 見ると 胸が きゅっと なる。 気持ちを 伝える？", "You were just childhood friends, yet her smile tightens your chest. Tell her?", "明明只是青梅竹马，看到她的笑容却心头一紧。要表达心意吗？", "소꿉친구였을 뿐인데 웃는 얼굴을 보면 가슴이 뜨끔해요. 마음을 전할까요?"), [
        X(N("気持ちを 伝える", "Confess", "表白", "고백한다"), [{mp: 18, rel: {misa: 14}, chm: 2}, N("「…わたしも。 ずっと そう 思ってた」 夕焼けが やさしかった。", "\"…Me too. I've felt that way for a long time.\" The sunset was gentle.", "“……我也是。一直都这么想”。晚霞很温柔。", "\"…나도. 계속 그렇게 생각했어\" 노을이 다정했어요.")], [{mp: -8, rel: {misa: -6}}, N("「ごめん、今は 友だちで いたい」 …でも 関係は 続けられそうだ。", "\"Sorry, I want to stay friends for now.\" …But the friendship can go on.", "“对不起，现在想保持朋友关系”……不过友情似乎还能继续。", "\"미안, 지금은 친구로 있고 싶어\" …그래도 관계는 이어질 것 같아요.")], {base: .2, s: ["chm"], k: .004, rel: "misa", f: {fes_misa: .25}}),
        C(N("まだ 早い。 見まもる", "Too early. Wait", "还太早。再观望", "아직 일러. 지켜본다"), [O(1, {mp: 1}, N("もう少し 時間を かけよう。", "Let's take a bit more time.", "再多花些时间吧。", "조금 더 시간을 들이자."))])
    ].map(function(c, i){ if(i === 0){ c.o[0].ex = {set: "lover_misa"}; c.o[1].ex = {set: "misa_no"}; } return c; }));
    E("confess_sak", {w: 3, need: function(S){ return S.rel.sak >= 58 && (S.cnt.a_date || 0) >= 2 && S.flags.met_sak && !S.flags.lover_sak && !S.flags.lover_misa && !S.flags.sak_no; }}, N("{sak}への 気持ち", "Your feelings for {sak}", "对{sak}的心意", "{sak}에 대한 마음"),
        N("春の電車で 出会ってから、気づけば 毎日 {sak}の ことを 考えている。 勇気を 出す？", "Since meeting on that spring train, you think of {sak} every day. Gather your courage?", "自从春天电车上的邂逅，不知不觉每天都在想{sak}。要鼓起勇气吗？", "봄 전철에서 만난 뒤로 어느새 매일 {sak} 생각을 해요. 용기를 낼까요?"), [
        X(N("気持ちを 伝える", "Confess", "表白", "고백한다"), [{mp: 18, rel: {sak: 14}, chm: 2}, N("「うれしい…！ よろしく おねがいします」 桜の 花びらが ひらり。", "\"I'm so happy…! Please take care of me.\" A cherry petal fluttered down.", "“好开心……！请多关照”。樱花花瓣轻轻飘落。", "\"기뻐요…! 잘 부탁드려요\" 벚꽃잎이 나풀.")], [{mp: -8, rel: {sak: -6}}, N("「ありがとう。 でも 今は 気持ちが 追いつかなくて…」", "\"Thank you. But my feelings haven't caught up yet…\"", "“谢谢。但我现在的心情还没跟上……”", "\"고마워요. 하지만 지금은 마음이 따라가지 못해서…\"")], {base: .2, s: ["chm"], k: .004, rel: "sak", f: {fes_sak: .25}}),
        C(N("まだ 早い。 見まもる", "Too early. Wait", "还太早。再观望", "아직 일러. 지켜본다"), [O(1, {mp: 1}, N("焦らず ゆっくり いこう。", "No rush. Take it slow.", "不要着急，慢慢来。", "서두르지 말고 천천히 가자."))])
    ].map(function(c, i){ if(i === 0){ c.o[0].ex = {set: "lover_sak"}; c.o[1].ex = {set: "sak_no"}; } return c; }));
    Q("lover_misa_day", {rep: 1, cd: 6, w: 2.5, need: function(S){ return S.flags.lover_misa; }}, N("{misa}と ふたりの 時間", "Time together with {misa}", "和{misa}的二人时光", "{misa}와(과) 둘만의 시간"),
        N("休みの 日、{misa}が 「ちょっと 散歩 しよ」と 手を ひいた。 何気ない 時間が いちばん たいせつ。", "On a day off, {misa} takes your hand: \"Let's take a walk.\" The ordinary moments matter most.", "休息日，{misa}牵起你的手：“去散散步吧”。不经意的时光最珍贵。", "쉬는 날 {misa}이(가) \"산책하자\" 하며 손을 잡았어요. 무심한 시간이 가장 소중해요."),
        [N("のんびり 歩く", "Stroll leisurely", "悠闲地散步", "느긋하게 걷는다"), {mp: 10, rel: {misa: 6}, hp: 4}, N("いつもの 道が 少し 特別に 見えた。", "The usual street looked a little special.", "平时走的路看起来有点特别。", "늘 걷던 길이 조금 특별해 보였어요.")],
        [N("手づくり 弁当で ピクニック", "Picnic with a homemade lunch", "带手作便当去野餐", "수제 도시락 피크닉"), {mp: 12, rel: {misa: 8}, money: -1500, skl: 1}, N("おにぎりの 形が ぶさいくでも 笑ってくれた。", "Even lumpy rice balls made them laugh.", "饭团的形状很难看，对方也笑了。", "주먹밥 모양이 못나도 웃어 줬어요.")]);
    Q("lover_sak_day", {rep: 1, cd: 6, w: 2.5, need: function(S){ return S.flags.lover_sak; }}, N("{sak}と ふたりの 時間", "Time together with {sak}", "和{sak}的二人时光", "{sak}와(과) 둘만의 시간"),
        N("{sak}が お気に入りの 本屋に 連れていって くれた。 好きな ものを 教えあう 午後。", "{sak} takes you to a favorite bookstore. An afternoon of sharing what you love.", "{sak}带你去了最喜欢的书店。互相介绍喜欢之物的午后。", "{sak}이(가) 좋아하는 서점에 데려갔어요. 서로의 취향을 알려 주는 오후."),
        [N("おすすめを 教えてもらう", "Ask for recommendations", "请对方推荐", "추천을 받는다"), {mp: 10, knw: 2, rel: {sak: 6}}, N("貸してもらった 本が 楽しみ。", "You look forward to the book they lent you.", "期待着借来的书。", "빌린 책이 기대돼요.")],
        [N("お返しに 自分の 好きを 紹介", "Share your own favorites", "回礼介绍自己的喜好", "답례로 내 취향 소개"), {mp: 12, chm: 1, rel: {sak: 8}}, N("「おもしろい！」 と 目を 輝かせてくれた。", "\"That's fascinating!\" Their eyes lit up.", "对方眼睛发亮：“好有意思！”", "\"재밌다!\" 하고 눈을 반짝였어요.")]);

    // ===== たばこ（すすめられる場面。ことわる／もらう／やめる） =====
    E("smoke_offer", {w: 2, wk: [W(2, 1), W(10, 30)], need: function(S){ return S.rel.dai >= 15 && !S.flags.smoker && !S.flags.quit_smoke && S.smk < 5 && !S.flags.smoke_declined; }}, N("喫煙所での ひとこと", "At the smoking area", "吸烟区的一句话", "흡연실에서 한마디"),
        N("休憩中、{dai}が 喫煙所から 手まねき。「ちょっと 話そうぜ」 煙の 向こうで 「お前も 一本 どう？」 と 箱を 差しだした。", "On break, {dai} beckons from the smoking area: \"Let's talk.\" Through the smoke: \"Want one?\" holding out the pack.", "休息时，{dai}从吸烟区招手：“聊聊吧”。烟雾对面递来烟盒：“你也来一根？”", "휴식 중 {dai}이(가) 흡연실에서 손짓해요. \"잠깐 얘기하자\" 연기 너머로 \"너도 한 대?\" 하고 담뱃갑을 내밀었어요."), [
        C(N("ことわる（話だけ する）", "Decline (just chat)", "拒绝（只聊天）", "거절한다(얘기만)"), [O(1, {rel: {dai: 3}, chm: 1, mp: 2}, N("「そっか。 吸わない ほうが いいぞ」 {dai}は 笑った。 断れる 大人は かっこいい。", "\"Right. Better not to.\" {dai} laughed. An adult who can say no is cool.", "“这样啊。不抽比较好”。{dai}笑了。能拒绝的大人很帅。", "\"그래. 안 피우는 게 좋아\" {dai}은(는) 웃었어요. 거절할 줄 아는 어른은 멋있어요."), {set: "smoke_declined"})]),
        C(N("一本 もらってみる", "Try one", "试着接一根", "한 대 받아 본다"), [O(1, {smk: 22, mp: 3, hlt: -3, rel: {dai: 6}, money: -600}, N("むせた…。 でも 先輩との 距離は ちぢまった。 …これ、くせに ならないよな？", "You coughed… but got closer to your senior. …This won't become a habit, right?", "呛到了……不过和前辈拉近了距离。……这不会变成习惯吧？", "콜록… 하지만 선배와 가까워졌어요. …이거 습관 되진 않겠죠?"), {set: "smoker"})]),
        C(N("体に 悪いから 遠慮する", "Pass — it's bad for health", "对身体不好，婉拒", "몸에 안 좋아서 사양"), [O(1, {hlt: 1, rel: {dai: 1}, mp: 1}, N("「真面目だな」 と 言われたが 悪い気は しなかった。", "\"You're a serious one,\" they said, but it felt fine.", "对方说“你真认真”，但心里并不坏。", "\"진지하네\"라는 말을 들었지만 기분 나쁘지 않았어요."), {set: "smoke_declined"})])
    ]);
    Q("smoking_area", {rep: 1, cd: 8, w: 1.2, need: function(S){ return S.flags.smoker; }}, N("たばこ休憩", "A smoke break", "吸烟休息", "담배 타임"),
        N("喫煙所で 同僚と 雑談。 仕事の 裏話が 聞けた。 でも 服に ニオイが…。 財布も 軽い。", "A chat with coworkers at the smoking area. You picked up behind-the-scenes talk. But the smell clings to your clothes… and your wallet is lighter.", "在吸烟区和同事闲聊，听到了工作的内幕。但衣服上有味道……钱包也变轻了。", "흡연실에서 동료와 수다. 업무 뒷이야기를 들었어요. 하지만 옷에 냄새가… 지갑도 가벼워요."),
        [N("情報を もらって 戻る", "Get the intel and return", "获取信息后回去", "정보를 얻고 돌아간다"), {soc: 3, knw: 1, smk: 3, hlt: -1.5, money: -800}, N("人脈は ひろがった。 体は…。", "Your network grew. Your body…", "人脉拓宽了。身体呢……", "인맥은 넓어졌어요. 몸은…")],
        [N("今日は 吸わずに 話だけ", "Chat without smoking today", "今天不抽，只聊天", "오늘은 안 피우고 얘기만"), {soc: 2, smk: -3, mp: 2}, N("意外と 我慢 できた！", "You held off — and it wasn't so hard!", "出乎意料地忍住了！", "의외로 참을 수 있었어요!")]);
    E("quit_try", {rep: 1, cd: 5, w: 2, need: function(S){ return S.flags.smoker && S.smk >= 10; }}, N("禁煙 しようかな", "Maybe I should quit", "要不要戒烟", "금연할까"),
        N("階段で 息が 切れる。 たばこ代も ばかに ならない。 {me}は 灰皿を ながめて 考えた。", "You're out of breath on the stairs. The cigarette money adds up. {me} stares at the ashtray and thinks.", "爬楼梯气喘吁吁。烟钱也不容小觑。{me}盯着烟灰缸陷入思考。", "계단에서 숨이 차요. 담뱃값도 무시 못 해요. {me}은(는) 재떨이를 바라보며 생각했어요."), [
        X(N("禁煙に ちょうせん！", "Try to quit!", "挑战戒烟！", "금연에 도전!"), [{smk: -60, hlt: 3, mp: 12, money: 1500}, N("【禁煙 成功】 今日で 禁煙 7日目。 朝の 空気が おいしい！", "QUIT! Day 7 smoke-free. The morning air tastes great!", "【戒烟成功】今天是戒烟第7天。早晨的空气真好！", "【금연 성공】 오늘로 금연 7일째. 아침 공기가 맛있어요!")], [{smk: -6, mp: -8}, N("3日で 挫折…。 でも 本数は へった。 また 挑戦しよう。", "Slipped after 3 days… but you cut back. You'll try again.", "3天就受挫了……不过抽得少了。下次再挑战。", "3일 만에 좌절… 그래도 개수는 줄었어요. 또 도전해요.")], {base: .2, s: ["mp", "hlt"], k: .0035, f: {quit_try: .0}, rel: "mom"}),
        C(N("もう少し 先で いい", "Maybe later", "晚点再说", "나중에 해도 돼"), [O(1, {smk: 2, mp: -1}, N("「あした から」 の あした は 来ない…。", "\"Starting tomorrow\" never comes…", "“明天开始”的明天永远不会来……", "\"내일부터\"의 내일은 오지 않아요…"))])
    ].map(function(c, i){ if(i === 0){ c.o[0].ex = {set: "quit_smoke", clr: "smoker"}; } return c; }));
})();
