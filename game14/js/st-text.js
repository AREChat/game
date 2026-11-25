"use strict";
/* 人気者になろう：できごと・ストーリー・エンディング・実績（4言語）。虫は 出さない。 */
(function(){
    var ST = window.ST || globalThis.ST, P = ST.P;
    ST.CAST = {
        mika: {em: "🧑‍💼", n: P("マネージャーのミカ|Manager Mika|经纪人美佳|매니저 미카")},
        ryu: {em: "😤", n: P("ライバルのリュウ|Rival Ryu|对手阿龙|라이벌 류")},
        haru: {em: "🧒", n: P("ファンのハル|Fan Haru|粉丝小春|팬 하루")},
        master: {em: "🥋", n: P("師匠|Master|师父|사부님")},
        me: {em: "🌟", n: P("{me}|{me}|{me}|{me}")}
    };
    ST.EV = []; ST.EVMAP = {};
    function O(p, fx, txt, ex){ ex = ex || {}; return {p: p, fx: fx || {}, txt: txt ? P(txt) : null, set: ex.set, clr: ex.clr, cnt: ex.cnt, go: ex.go}; }
    function CH(label, outs, opt){ opt = opt || {}; return {t: P(label), o: outs, need: opt.need || null}; }
    function E(id, cfg, who, title, body, ch){ var e = {id: id, cfg: cfg || {}, who: who || "me", title: P(title), body: P(body), ch: ch}; ST.EV.push(e); ST.EVMAP[id] = e; }

    E("first_fan", {fix: 1, day: [2, 9]}, "haru", "はじめての ファン|Your very first fan|第一个粉丝|첫 번째 팬",
        "「あの…ずっと 見てました！ 応援してます！」 小さな男の子が 目を かがやかせて 立っている。ハルと いう名前らしい。|“Um… I’ve been watching you! I’m your fan!” A small kid stands there, eyes sparkling. His name is Haru.|“那个……我一直在看你！我是你的粉丝！”一个小男孩眼睛闪闪发亮地站在那里。他叫小春。|“저… 계속 봤어요! 응원해요!” 작은 아이가 눈을 반짝이며 서 있어요. 이름은 하루래요.", [
        CH("サインを 書く|Sign something|签名|사인해 주기", [O(1, {f: 10, rel: {haru: 15}}, "「やった！ 宝物にします！」 はじめての サインは ちょっと 照れくさい。|“Yes! I’ll treasure it!” Your first autograph feels a bit embarrassing.|“太好了！我会当宝贝的！”第一次签名有点害羞。|“와! 보물로 간직할게요!” 첫 사인은 조금 쑥스러워요.")]),
        CH("あく手して ありがとうと 言う|Shake hands and say thanks|握手并道谢|악수하고 고맙다고 말하기", [O(1, {f: 6, cond: 10, rel: {haru: 10}}, "ちいさな 手の あたたかさが、明日への 力に なった。|The warmth of that small hand gave you strength for tomorrow.|小手的温暖成了明天的力量。|작은 손의 따뜻함이 내일의 힘이 되었어요.")])]);
    E("rival_intro", {fix: 1, day: [6, 20], rk: [1, 11]}, "ryu", "ライバル リュウ 登場|Rival Ryu appears|对手阿龙登场|라이벌 류 등장",
        "「お前が 最近 話題の {me} か。 おれは リュウ。 先に 人気者に なるのは おれだ。」 すれちがいざまに 宣戦布告された！|“So you’re the {me} everyone talks about. I’m Ryu. I’ll be the star first.” He declares rivalry in passing!|“你就是最近的话题人物{me}吧。我是阿龙。先成为人气王的会是我。”擦肩而过时被宣战了！|“요즘 화제의 {me}가 너냐. 난 류. 먼저 인기인이 되는 건 나야.” 스쳐 지나가며 선전포고를 받았어요!", [
        CH("「受けて立つ！」|“Bring it on!”|“放马过来！”|“얼마든지!”", [O(1, {st: {gt: 2}, rel: {rival: 10}}, "目と目が ぶつかった。 負けられない 理由が ひとつ ふえた。|Your eyes locked. One more reason not to lose.|目光交汇。又多了一个不能输的理由。|눈빛이 부딪쳤어요. 질 수 없는 이유가 하나 늘었어요.")]),
        CH("無視して 練習に もどる|Ignore him and keep practicing|无视他继续练习|무시하고 연습으로 돌아가기", [O(1, {st: {wt: 1}, rel: {rival: 3}}, "余計な 声は 気にしない。 結果で 見せればいい。|Ignore the noise. Let results speak.|不理会多余的声音。用结果说话。|쓸데없는 말은 신경 쓰지 않아요. 결과로 보여주면 돼요.")])]);
    E("mika_gift", {rep: 1, cd: 14, w: 1.2}, "mika", "ミカさんの 差し入れ|A treat from Mika|美佳的慰问|미카의 간식",
        "「お疲れさま！ これ、ファンの 方から 預かったよ。」 マネージャーの ミカが 笑顔で 袋を 差し出した。|“Good work! A fan left this for you.” Manager Mika hands over a bag with a smile.|“辛苦了！这是粉丝托我转交的。”经纪人美佳笑着递来袋子。|“수고했어! 팬분이 맡기고 가셨어.” 매니저 미카가 웃으며 봉투를 내밀었어요.", [
        CH("ありがたく いただく|Gladly accept|欣然收下|감사히 받기", [O(1, {cond: 20, rel: {mika: 6}}, "あまいものを 食べて 元気が 出た！|The sweets gave you energy!|吃了甜食精神大振！|단 걸 먹고 기운이 났어요!")]),
        CH("ミカさんと 分けあう|Share with Mika|和美佳分享|미카와 나눠 먹기", [O(1, {cond: 10, rel: {mika: 12}}, "「ありがとう」と 言われて 照れる 二人。 いいチームだ。|“Thank you,” she says, and you both blush. A good team.|听到“谢谢”，两人都害羞了。真是好搭档。|“고마워”라는 말에 둘 다 쑥스러워요. 좋은 팀이에요.")])]);
    E("street_crowd", {rep: 1, cd: 10, rk: [0, 4], w: 1.3}, "me", "路上ライブに 人だかり|A crowd at your street live|街头演出围满了人|길거리 라이브에 인파",
        "いつもの 場所で 練習していたら、いつの間にか 人が 集まっていた。 スマホを むける 人も いる。|While practicing at your usual spot, a crowd gathered. Some people are filming.|在老地方练习时，不知不觉聚来了人。有人举起手机。|평소 장소에서 연습하다 보니 어느새 사람들이 모였어요. 폰을 드는 사람도 있어요.", [
        CH("もう一曲 歌う！|Sing one more!|再唱一首！|한 곡 더 부르기!", [O(.75, {f: 12, cond: -10}, "歌いきった 瞬間、大きな 拍手が おこった！|When you finished, applause erupted!|唱完的瞬间，响起了热烈的掌声！|노래를 끝내자 큰 박수가 터졌어요!"), O(.25, {f: 4, cond: -12, hlt: -1}, "のどが かれて 最後は ガラガラ声。 それでも 拍手は もらえた。|Your voice cracked by the end, but you still got applause.|嗓子哑了，最后声音嘶哑。但还是得到了掌声。|목이 쉬어서 마지막엔 갈라진 목소리. 그래도 박수는 받았어요.")]),
        CH("ダンスを 見せる|Show a dance|展示舞蹈|춤을 보여주기", [O(1, {f: 9, st: {rhy: 1}, cond: -8}, "足もとの ステップに 歓声が あがった！|The crowd cheered your footwork!|脚下的舞步引来了欢呼！|발놀림에 환호가 터졌어요!")])]);
    E("viral_clip", {rep: 1, cd: 25, rk: [2, 11], w: .8}, "me", "動画が バズった！|Your clip went viral!|视频火了！|영상이 대박 났어요!",
        "朝 起きたら 通知が 止まらない。 先週の 動画が、一晩で 何十万回も 再生されていた！|You wake up to nonstop notifications. Last week’s clip got hundreds of thousands of views overnight!|早上醒来通知停不下来。上周的视频一夜之间被播放了几十万次！|아침에 일어나니 알림이 멈추지 않아요. 지난주 영상이 하룻밤에 수십만 번 재생됐어요!", [
        CH("お礼の ライブ配信|Do a thank-you livestream|感谢直播|감사 라이브 방송", [O(1, {f: 15, cond: -8}, "コメントが 滝のように 流れる。 みんなの 声が うれしい！|Comments pour in like a waterfall. Everyone’s voices make you happy!|评论如瀑布般刷屏。大家的声音让人开心！|댓글이 폭포처럼 흘러요. 모두의 목소리가 기뻐요!", {set: "viral"})]),
        CH("あえて 静かに 見守る|Stay quiet and watch|静静观望|일부러 조용히 지켜보기", [O(1, {f: 6, cond: 5}, "落ち着いて 次の 練習に 集中できた。|You stayed calm and focused on the next practice.|冷静地专注于下一次练习。|침착하게 다음 연습에 집중할 수 있었어요.", {set: "viral"})])]);
    E("master_surprise", {rep: 1, cd: 15, w: 1}, "master", "師匠の 抜き打ち特訓|Master’s surprise training|师父的突击特训|사부님의 기습 특훈",
        "「今日は 特別じゃ。」 師匠が 突然 あらわれた。 目が マジだ。|“Today is special.” Master suddenly appears. His eyes are serious.|“今天很特别。”师父突然出现，眼神是认真的。|“오늘은 특별하단다.” 사부님이 갑자기 나타났어요. 눈이 진지해요.", [
        CH("全力で 挑む！|Give it everything!|全力以赴！|전력으로 도전!", [O(1, {st: {gt: 2, bd: 2}, cond: -12, rel: {master: 8}}, "ヘトヘトだが、確かな 手ごたえが あった。|You’re exhausted, but you felt real progress.|虽然筋疲力尽，但确实有收获。|녹초가 됐지만 확실한 손맛이 있었어요.")]),
        CH("今日は 見学させてもらう|Observe today|今天先观摩|오늘은 견학하기", [O(1, {st: {wt: 1}, cond: 5, rel: {master: 3}}, "師匠の 動きを じっくり 観察。 なるほど…。|You studied Master’s moves closely. I see…|仔细观察师父的动作。原来如此……|사부님의 움직임을 차근차근 관찰했어요. 과연…")])]);
    E("catch_cold", {rep: 1, cd: 18, w: .9, need: function(S){ return S.cond < 55 || S.hlt < 70; }}, "me", "風邪を ひいた|You caught a cold|感冒了|감기에 걸렸어요",
        "朝から のどが いたい。 ゴホゴホ…。 体が 重い。|Sore throat since morning. Cough, cough… Your body feels heavy.|早上起来嗓子疼。咳咳……身体沉重。|아침부터 목이 아파요. 콜록콜록… 몸이 무거워요.", [
        CH("しっかり 休んで 治す|Rest properly|好好休息|푹 쉬어서 낫기", [O(1, {cond: 10, coins: -80, ap: -1}, "ぐっすり 休んで 回復。 でも 1日 ぶん 遅れた。|You rested and recovered, but lost a day’s worth of time.|好好休息恢复了，但耽误了一天。|푹 쉬고 회복했지만 하루만큼 늦어졌어요.")]),
        CH("薬で ごまかして 動く|Push through with medicine|靠药硬撑|약으로 버티며 움직이기", [O(1, {hlt: -6, cond: 12}, "なんとか 動けるが、体の 奥が 重い…。|You can move, but something deep inside feels heavy…|勉强能动，但身体深处很沉重……|어떻게든 움직이지만 몸속이 무거워요…")])]);
    E("izakaya_invite", {rep: 1, cd: 16, rk: [2, 11], w: 1}, "me", "先輩に 飲みに さそわれた（20歳以上）|Invited out for drinks (20+)|被前辈邀请去喝酒（20岁以上）|선배가 술 한잔 하자고 해요 (20세 이상)",
        "「{me}、今夜 飲みに 行かないか？ 業界の 人も 来るぞ。」 先輩からの さそい。 お酒は ほどほどに…。|“{me}, wanna grab a drink tonight? Some industry folks are coming.” An invitation from a senior. Drink in moderation…|“{me}，今晚去喝一杯吗？业内的人也会来。”前辈的邀请。要适度饮酒……|“{me}, 오늘 한잔 안 할래? 업계 사람도 와.” 선배의 초대예요. 술은 적당히…", [
        CH("付き合う|Join them|奉陪|함께하기", [O(.7, {f: 9, drk: 14, cond: -10, hlt: -2}, "人脈が ひろがった！ ……でも 翌朝は 頭が いたい。|You expanded your network! …But you wake up with a headache.|拓展了人脉！……但第二天早上头很痛。|인맥이 넓어졌어요! …하지만 다음 날 아침엔 머리가 아파요.", {cnt: {drinkYes: 1}}), O(.3, {f: 3, drk: 20, cond: -18, hlt: -4}, "飲みすぎて 記憶が とんだ…。 反省。|You drank too much and blacked out… Time to reflect.|喝多了断片了……要反省。|너무 마셔서 필름이 끊겼어요… 반성.", {cnt: {drinkYes: 1}})]),
        CH("「明日 早いので」と ていねいに ことわる|Politely decline: “early start tomorrow”|礼貌地拒绝：“明天要早起”|“내일 일찍이라서요” 정중히 거절", [O(1, {f: 2, cond: 8, rel: {master: 3}}, "「しっかりしてるな」と かえって 好印象。|“You’re responsible,” he says. A good impression instead.|“你真靠谱。”反而留下了好印象。|“야무지네” 하며 오히려 좋은 인상을 줬어요.")])]);
    E("smoking_room", {rep: 1, cd: 20, rk: [3, 11], w: .8}, "me", "喫煙所で 業界の人と（20歳以上）|In the smoking room (20+)|在吸烟室遇到业内人士（20岁以上）|흡연실에서 업계 사람과 (20세 이상)",
        "休憩中、喫煙所で テレビ関係者に 声を かけられた。 「一本 どう？」 たばこは 体に よくないけれど…。|On a break, a TV staffer talks to you in the smoking room. “Care for one?” Smoking isn’t good for you, but…|休息时，在吸烟室被电视台人员搭话。“来一根？”吸烟对身体不好，但是……|쉬는 시간, 흡연실에서 방송 관계자가 말을 걸어요. “한 대 어때?” 담배는 몸에 안 좋지만…", [
        CH("いっしょに 一本 吸って 話す|Smoke one and chat|一起抽一根聊聊|같이 한 대 피우며 이야기", [O(1, {f: 10, smk: 14, hlt: -1.5}, "話が はずんだ。 ……でも のどが すこし いがらっぽい。|The talk went well. …But your throat feels a bit scratchy.|聊得很投机。……但嗓子有点痒。|이야기가 잘 통했어요. …하지만 목이 조금 칼칼해요.", {cnt: {smokeYes: 1}})]),
        CH("ていねいに ことわって あいさつだけ|Politely decline, just greet|礼貌拒绝，只打招呼|정중히 거절하고 인사만", [O(1, {f: 3, st: {tk: 1}}, "「歌手は のどが 命なので」 笑顔で かわせた。|“A singer’s voice is everything,” you say with a smile.|“歌手的嗓子就是命。”你笑着婉拒了。|“가수는 목이 생명이라서요.” 웃으며 넘겼어요.")])]);
    E("pachi_invite", {rep: 1, cd: 18, rk: [4, 11], w: 1}, "me", "パチンコの さそい（20歳以上）|A pachinko invitation (20+)|弹珠机邀约（20岁以上）|파친코 권유 (20세 이상)",
        "友だちが 「ちょっとだけ 打って いかない？」と さそってきた。 コインは ゲームの ニセモノ。 でも 平均では 必ず へるよ。|A friend asks, “Wanna play just a little?” The coins are fake in-game coins, but on average you always lose.|朋友邀请：“要不要玩一小会儿？”游戏币是假的，但平均一定会亏。|친구가 “조금만 치고 갈래?” 하고 권해요. 코인은 게임 속 가짜지만 평균적으로 반드시 잃어요.", [
        CH("少しだけ 打つ|Play a little|玩一点点|조금만 치기", [O(.35, {coins: 300, gam: 10}, "ラッキー！ コインが ふえた。 ……でも これは たまたま。|Lucky! Your coins grew. …But that was just luck.|走运！游戏币增加了。……不过只是运气。|럭키! 코인이 늘었어요. …하지만 우연일 뿐이에요.", {cnt: {pachiYes: 1}}), O(.65, {coins: -250, gam: 10}, "あっという間に コインが 消えた…。 やっぱり へるんだな。|Your coins vanished in no time… It really does lose.|游戏币转眼就没了……果然会亏。|눈 깜짝할 새에 코인이 사라졌어요… 역시 잃는군요.", {cnt: {pachiYes: 1}})]),
        CH("ことわって 練習に もどる|Decline and go practice|拒绝并回去练习|거절하고 연습으로 돌아가기", [O(1, {st: {wt: 1}, gam: -5, cond: 3}, "「また 今度な」 コインは 使わず 練習へ。|“Maybe next time.” You skip the coins and go practice.|“下次吧。”不花游戏币，去练习。|“다음에.” 코인은 쓰지 않고 연습하러 갔어요.")])]);
    E("interview", {rep: 1, cd: 14, rk: [3, 11], w: 1}, "mika", "雑誌の 取材|A magazine interview|杂志采访|잡지 인터뷰",
        "「取材の 依頼が 来たよ！」 ミカが 目を かがやかせる。 取材 当日、記者が まっすぐ こちらを 見ている。|“We got an interview request!” Mika beams. On the day, the reporter looks right at you.|“收到采访邀请了！”美佳眼睛闪闪发亮。采访当天，记者直视着你。|“인터뷰 의뢰가 왔어!” 미카가 눈을 반짝여요. 당일, 기자가 똑바로 바라봐요.", [
        CH("堂々と 夢を 語る|Speak boldly about your dream|堂堂正正谈梦想|당당하게 꿈을 이야기하기", [O(.65, {f: 11, st: {tk: 1}}, "言葉が すらすら 出て きた！ 記事は 大反響。|The words flowed! The article drew a huge response.|话语滔滔不绝！报道反响很大。|말이 술술 나왔어요! 기사는 큰 반향."), O(.35, {f: 3, cond: -6}, "緊張して かんでしまった…。 でも 正直さが 伝わった。|Nerves made you stumble… but your honesty came through.|紧张得咬了舌头……但诚实传达了。|긴장해서 말을 더듬었어요… 그래도 솔직함은 전해졌어요.")]),
        CH("無難に 答える|Answer safely|稳妥回答|무난하게 대답하기", [O(1, {f: 5, cond: 2}, "ミスは なかったが、少し 印象が うすい。|No mistakes, but a bit forgettable.|没出错，但印象有点淡。|실수는 없었지만 인상이 조금 약해요.")])]);
    E("gaffe", {rep: 1, cd: 30, rk: [5, 11], w: .6}, "mika", "うっかり 失言|An unfortunate slip|不小心失言|실언",
        "生放送で つい 口が すべった。 SNSが ざわつく…。 ミカが 青ざめた 顔で 駆けこんで きた。|You slipped up on live TV. Social media buzzes… Mika rushes in, pale.|直播里一不留神说错了话。社交网络一片哗然……美佳脸色苍白地冲进来。|생방송에서 그만 말실수를 했어요. SNS가 술렁여요… 미카가 창백한 얼굴로 뛰어 들어와요.", [
        CH("すぐに 誠実に あやまる|Apologize sincerely right away|立刻诚恳道歉|바로 진심으로 사과하기", [O(1, {f: -4, cond: -5, rel: {mika: 6}}, "ていねいな おわびに 「次は 応援する」の 声も。|Your sincere apology even earned “we’ll support you next time.”|诚恳的道歉换来了“下次支持你”的声音。|정중한 사과에 “다음엔 응원할게요”라는 목소리도 있었어요.")]),
        CH("開き直る|Brush it off|不当回事|뻔뻔하게 넘기기", [O(.4, {f: 10}, "なぜか 「ブレない人」と 評価が 上がった！|Somehow people praised you as “unshakable”!|不知为何被评价为“不动摇的人”！|왜인지 “흔들리지 않는 사람”이라는 평가를 받았어요!"), O(.6, {f: -18, cond: -10, rel: {mika: -8}}, "炎上が ひろがった…。 ファンが 離れていく。|The backlash spread… Fans are leaving.|事态愈演愈烈……粉丝在流失。|논란이 번져요… 팬이 떠나가요.")])]);
    E("invite_event", {rep: 1, cd: 16, rk: [4, 11], w: .9}, "mika", "大型イベントへの 招待|Invitation to a big event|大型活动邀请|대형 이벤트 초대",
        "「大きな イベントから 出演オファーだよ！」 ただ スケジュールは ぎっしり…。|“We got an offer to appear at a big event!” But the schedule is packed…|“收到大型活动的出演邀请了！”不过日程排得满满的……|“큰 이벤트에서 출연 제안이 왔어!” 하지만 일정이 꽉 차 있어요…", [
        CH("出演する！|Appear!|出演！|출연한다!", [O(1, {f: 12, cond: -12, rel: {mika: 4}}, "ステージ上で 手ごたえ 十分。 新しい ファンが ふえた！|You felt great on stage. New fans joined!|在舞台上手感十足。增加了新粉丝！|무대 위에서 손맛 충분. 새 팬이 늘었어요!")]),
        CH("体調を 優先して 見送る|Skip it to rest|优先身体，放弃|컨디션을 우선해 보류", [O(1, {cond: 12, hlt: 2}, "無理を しない 判断も 大切。|Knowing when not to push is important too.|不勉强也是重要的判断。|무리하지 않는 판단도 중요해요.")])]);
    E("rainy_fans", {rep: 1, cd: 12, w: 1}, "haru", "雨の日の ファン交流|Rainy-day fan meeting|雨天的粉丝交流|비 오는 날의 팬 교류",
        "雨の 夕方、 ハルが 傘も なしで 待っていた。 「どうしても 会いたくて…」|On a rainy evening, Haru is waiting without an umbrella. “I really wanted to see you…”|雨天的傍晚，小春没带伞在等着。“无论如何都想见你……”|비 오는 저녁, 하루가 우산도 없이 기다리고 있었어요. “꼭 만나고 싶어서…”", [
        CH("傘を 貸して いっしょに 歩く|Lend your umbrella and walk together|借伞一起走|우산을 빌려주고 함께 걷기", [O(1, {f: 7, rel: {haru: 10}, cond: -3}, "「ずっと 応援します！」 ハルの 笑顔が まぶしい。|“I’ll always support you!” Haru’s smile is dazzling.|“我会一直支持你！”小春的笑容很耀眼。|“계속 응원할게요!” 하루의 미소가 눈부셔요.")]),
        CH("あたたかい 飲み物を わたす|Hand over a warm drink|递上热饮|따뜻한 음료를 건네기", [O(1, {f: 4, rel: {haru: 6}, cond: 3}, "ふたりで ホットココアを 飲んだ。 心が ぽかぽか。|You shared hot cocoa. Your heart felt warm.|两人一起喝了热可可。心里暖洋洋的。|둘이서 핫코코아를 마셨어요. 마음이 따뜻해요.")])]);
    E("retire_live", {rep: 0, day: [28, 80], rk: [3, 11], w: 1.2}, "master", "先輩の 引退ライブ|A senior’s farewell live|前辈的引退演唱会|선배의 은퇴 라이브",
        "憧れていた 先輩が 今夜で 引退する。 ライブハウスは 満員だ。|A senior you admired retires tonight. The venue is packed.|你憧憬的前辈今晚引退。演出场地座无虚席。|동경하던 선배가 오늘 밤 은퇴해요. 라이브하우스는 만원이에요.", [
        CH("ステージで いっしょに 歌う|Sing together on stage|在台上一起唱|무대에서 함께 노래하기", [O(1, {f: 8, st: {vo: 1, rhy: 1}, cond: -8}, "バトンを 受けとった 気持ちに なった。|It felt like receiving the baton.|仿佛接过了接力棒。|바통을 이어받은 기분이 들었어요.")]),
        CH("客席から 見送る|See him off from the audience|在观众席目送|객석에서 배웅하기", [O(1, {st: {wt: 2}, cond: 10}, "最後の 一曲に 胸が あつくなった。|The last song made your chest burn.|最后一首歌让胸口发热。|마지막 한 곡에 가슴이 뜨거워졌어요.")])]);
    E("day_off", {rep: 1, cd: 10, w: .9}, "me", "とつぜんの オフ|A sudden day off|突如其来的休息|갑작스러운 휴일",
        "リハーサルが 中止に！ ぽっかり 空いた 1日。 どう すごそう？|Rehearsal got canceled! A whole day suddenly free. How to spend it?|彩排取消了！突然空出一整天。怎么过呢？|리허설이 취소됐어요! 갑자기 하루가 비었어요. 어떻게 보낼까요?", [
        CH("街を ぶらぶら 散歩|Stroll around town|在街上闲逛|거리를 어슬렁어슬렁", [O(1, {cond: 25, f: 2}, "気分転換に なった！ 街で 声を かけられた。|A nice change of pace! People recognized you in town.|换了个心情！在街上被人认出来了。|기분 전환이 됐어요! 거리에서 알아보는 사람도 있었어요.")]),
        CH("部屋で 自主練|Practice alone at home|在家自主练习|방에서 자율 연습", [O(1, {st: {rhy: 1, vo: 1, tk: 1}, cond: 8}, "静かな 部屋で じっくり 練習。 力が ついた。|Quiet, focused practice at home. You got stronger.|在安静的房间里认真练习。有了进步。|조용한 방에서 차분히 연습. 실력이 늘었어요.")])]);
    E("rival_battle", {fix: 1, day: [20, 85], rk: [3, 11], need: function(S){ return S.rel.rival >= 10 && !!S.flags.boss_town; }}, "ryu", "リュウとの 直接対決|Showdown with Ryu|与阿龙的正面对决|류와의 정면 승부",
        "「ここで はっきり させようぜ。」 リュウが 控室の ドアを ふさぐ。 ステージで 勝負だ！|“Let’s settle this once and for all.” Ryu blocks the dressing-room door. A showdown on stage!|“在这里做个了断吧。”阿龙堵住了休息室的门。在舞台上决胜负！|“여기서 확실히 하자.” 류가 대기실 문을 막아요. 무대에서 승부예요!", [
        CH("正面から ぶつかる|Face him head-on|正面对决|정면으로 맞붙기", [O(.55, {f: 14, st: {gt: 2}, rel: {rival: 12}}, "接戦を 制した！ リュウは 悔しそうに 笑った。|You won a close match! Ryu smiled, frustrated.|赢下了激战！阿龙不甘地笑了。|접전을 이겼어요! 류는 분하다는 듯 웃었어요."), O(.45, {f: -3, st: {wt: 2}, rel: {rival: 15}}, "負けた…。 でも 手を 差しのべられた。「次は 本気で やろう」|You lost… but he offered a hand. “Let’s go all out next time.”|输了……但他伸出了手。“下次认真比一场吧。”|졌어요… 하지만 류가 손을 내밀었어요. “다음엔 진짜로 해보자.”")]),
        CH("いっしょに ステージに 立つ|Share the stage|一起站上舞台|함께 무대에 서기", [O(1, {f: 8, rel: {rival: 22}, st: {tk: 1}}, "二人の ステージは 伝説の コラボに なった！|Your joint stage became a legendary collab!|两人的舞台成了传奇合作！|둘의 무대는 전설적인 콜라보가 되었어요!")])]);
    E("rival_rematch", {fix: 1, day: [30, 88], rk: [4, 11], need: function(S){ return S.rel.rival >= 18 && !!S.flags.boss_arcade; }}, "ryu", "リュウと 合同特訓|Training with Ryu|与阿龙一起特训|류와 함께 특훈",
        "「勝つための 練習を 教えてやる。 かわりに おまえの 秘密も 教えろ。」 リュウが 意外にも 練習に 誘って きた。|“I’ll show you how I train to win. In return, tell me your secrets.” Ryu surprisingly invites you to train together.|“我教你赢的练习方法，作为交换，你也告诉我你的秘诀。”阿龙意外地邀你一起练习。|“이기기 위한 연습을 알려줄게. 대신 네 비결도 알려줘.” 류가 뜻밖에 함께 연습하자고 해요.", [
        CH("よろこんで 教えあう|Gladly swap tips|欣然互相切磋|기꺼이 서로 알려주기", [O(1, {st: {gt: 1, rhy: 1}, cond: -8, rel: {rival: 22}}, "二人で 汗を ながした。 ライバルの 見かたが 少し かわった。|You sweated together. Your view of your rival changed a little.|两人一起挥汗如雨，对对手的看法有了些许改变。|둘이 함께 땀을 흘렸어요. 라이벌을 보는 눈이 조금 달라졌어요.")]),
        CH("手の うちは 見せない|Keep your cards hidden|不露底牌|패는 보여주지 않기", [O(1, {st: {wt: 1}, rel: {rival: 4}}, "ひとりで 黙々と 練習。 リュウは つまらなそうに 去った。|You trained quietly alone. Ryu walked off looking bored.|独自默默练习。阿龙无趣地走开了。|혼자 묵묵히 연습했어요. 류는 심심한 듯 자리를 떴어요.")])]);
    E("rival_final", {fix: 1, day: [55, 90], rk: [5, 11], need: function(S){ return S.rel.rival >= 40 && !!S.flags.boss_game; }}, "ryu", "リュウの 本音|Ryu’s true feelings|阿龙的真心话|류의 속마음",
        "夕やけの 屋上。 リュウが ぽつりと つぶやいた。「おまえが いたから、ここまで 来られた。」 風が 二人の あいだを ぬけて いく。|On a rooftop at sunset Ryu murmurs, “I got this far because of you.” The wind passes between you.|夕阳下的天台上，阿龙喃喃道：“因为有你，我才走到了这里。”风从两人之间吹过。|노을 진 옥상에서 류가 중얼거려요. “네가 있어서 여기까지 왔어.” 바람이 둘 사이를 지나가요.", [
        CH("「おれも だ。 これからも 勝負だ」|“Me too. Let’s keep competing.”|“我也是。今后继续较量吧。”|“나도야. 앞으로도 승부하자.”", [O(1, {f: 6, cond: 10, rel: {rival: 25}}, "かたい あくしゅ。 二人の きずなは 一生ものだ。|A firm handshake. Your bond will last a lifetime.|紧紧握手。两人的羁绊将伴随一生。|굳게 악수했어요. 두 사람의 유대는 평생 가요.")]),
        CH("照れて 話を そらす|Change the subject, embarrassed|害羞地岔开话题|쑥스러워서 화제를 돌리기", [O(1, {cond: 4, rel: {rival: 6}}, "リュウは 「ふん」と 笑った。 でも 少し うれしそうだった。|Ryu snorted, but he looked a little happy.|阿龙哼了一声，但看起来有点高兴。|류는 “흥” 하고 웃었지만 조금 기뻐 보였어요.")])]);
    E("haru_letter", {fix: 1, need: function(S){ return S.rel.haru >= 40; }}, "haru", "ハルからの 手紙|A letter from Haru|小春的来信|하루의 편지",
        "楽屋に 一通の 手紙。「ぼくも いつか 人気者に なって、{me}さんと 一緒に 歌いたいです。」 下手な 字が あたたかい。|A letter in the dressing room. “Someday I want to be popular and sing with you, {me}.” The clumsy handwriting is warm.|休息室里有一封信。“我也想有一天成为人气王，和{me}一起唱歌。”笨拙的字迹很温暖。|대기실에 편지 한 통. “저도 언젠가 인기인이 되어서 {me}님과 함께 노래하고 싶어요.” 서툰 글씨가 따뜻해요.", [
        CH("返事を 書く|Write back|写回信|답장 쓰기", [O(1, {f: 5, cond: 15, rel: {haru: 12}}, "「待ってるよ」 と 書いた。 胸が いっぱいに なった。|You wrote, “I’ll be waiting.” Your heart felt full.|你写下“我等你”。心里满满的。|“기다릴게”라고 썼어요. 가슴이 벅차올랐어요.")])]);
    E("mika_talk", {fix: 1, need: function(S){ return S.rel.mika >= 40; }}, "mika", "ミカの 本音|Mika’s true feelings|美佳的真心话|미카의 속마음",
        "夜の 事務所で ミカが ぽつり。「私ね、あなたを 見つけた 日から ずっと 信じてるんだ。」|In the office at night, Mika murmurs. “I’ve believed in you since the day I found you.”|夜晚的事务所里，美佳喃喃道：“从发现你的那天起，我就一直相信你。”|밤의 사무실에서 미카가 툭 말해요. “널 발견한 날부터 쭉 믿고 있었어.”", [
        CH("「ありがとう。 一緒に 上へ 行こう」|“Thank you. Let’s go to the top together.”|“谢谢。一起去往更高处吧。”|“고마워. 함께 위로 가자.”", [O(1, {cond: 20, st: {gt: 2}, rel: {mika: 10}}, "二人三脚の 絆が 強くなった。|Your bond as a team grew stronger.|二人三脚的羁绊更深了。|이인삼각의 유대가 더 강해졌어요.")])]);
    E("snack_win", {rep: 1, cd: 20, rk: [4, 11], w: .7, need: function(S){ return !!S.flags.boss_izakaya || S.cnt.t_cheers >= 1; }}, "me", "お店の 人に ほめられた（20歳以上）|Praised by the bar owner (20+)|被店主夸奖（20岁以上）|가게 주인의 칭찬 (20세 이상)",
        "盛りあげ上手な あなたを 見て、お店の ママが 「また 来てね」と 笑った。 ただし お酒の 飲みすぎは 禁物。|The bar owner smiles, “Come again,” impressed by how you lift the mood. But never overdo the drinking.|店里的妈妈桑看着善于带动气氛的你笑道：“下次再来哦。”不过千万别喝过量。|분위기 메이커인 모습을 보고 가게 마마가 “또 와요” 하며 웃었어요. 단, 과음은 금물.", [
        CH("ウーロン茶で かんぱい|Toast with oolong tea|用乌龙茶干杯|우롱차로 건배", [O(1, {f: 6, cond: 6, rel: {mika: 2}}, "ソフトドリンクでも 場は 盛りあがった！|The mood was lively even with soft drinks!|喝软饮料气氛也很热烈！|소프트드링크로도 분위기는 달아올랐어요!")]),
        CH("もう 一杯だけ いただく|Just one more drink|再喝一杯|딱 한 잔만 더", [O(1, {f: 8, drk: 10, cond: -6, hlt: -1}, "いい気分… でも 明日に 響かないように。|Feeling good… but don’t let it affect tomorrow.|心情不错……但别影响明天。|기분 좋아요… 하지만 내일에 지장 없게.", {cnt: {drinkYes: 1}})])]);

    // ---- ストーリー ----
    ST.STORY = {
        start: [["mika", "はじめまして。 今日から あなたの マネージャーを つとめる ミカです。|Nice to meet you. I’m Mika, your manager starting today.|初次见面。我是从今天起担任你经纪人的美佳。|처음 뵙겠습니다. 오늘부터 매니저를 맡은 미카예요."],
            ["mika", "目標は ただ ひとつ。 90日で 「人気者」に なること！|We have one goal: become a “star” in 90 days!|目标只有一个。90天内成为“人气王”！|목표는 단 하나. 90일 안에 '인기인'이 되는 것!"],
            ["me", "よし…！ ここから 全部 はじまるんだ。|Alright…! It all starts here.|好……！一切从这里开始。|좋아…! 여기서부터 모든 게 시작이야."]]
    };
    ST.AREA_INTRO = {
        school: [["mika", "学園祭の ステージ、出演 決まったよ！|You’re booked for the school-festival stage!|学园祭的舞台，确定出演了！|학교 축제 무대, 출연이 정해졌어!"]],
        arcade: [["mika", "商店街の みなさんが 応援してくれるって。|The shopping-street folks say they’ll support you.|商店街的大家说会支持你。|상점가 분들이 응원해 주신대."]],
        game: [["ryu", "ゲーセンで 勝負だ。 ついて来れるか？|Let’s settle it at the arcade. Can you keep up?|在游戏厅一决胜负。你跟得上吗？|오락실에서 승부다. 따라올 수 있어?"]],
        izakaya: [["mika", "ここからは 大人の 世界（20歳以上）。 お酒は ほどほどにね。|From here on it’s the adult world (20+). Drink in moderation.|从这里开始是大人的世界（20岁以上）。饮酒要适度哦。|여기서부턴 어른의 세계(20세 이상). 술은 적당히."]],
        pachi: [["mika", "ホールの 熱気は すごいけど、コインは ニセモノ。 ハマりすぎ 注意よ。|The hall is intense, but the coins are fake. Don’t get hooked.|店里热气腾腾，但游戏币是假的。小心别沉迷。|홀의 열기는 대단하지만 코인은 가짜야. 빠지지 않게 조심해."]],
        studio: [["mika", "ついに テレビ局！ カメラの 前でも いつもどおりにね。|Finally, the TV studio! Be yourself in front of the cameras.|终于来到电视台！在镜头前也要保持平常心。|드디어 방송국! 카메라 앞에서도 평소처럼."]],
        beach: [["haru", "夏フェスで 会えるの 楽しみに してました！|I’ve been looking forward to seeing you at the summer fest!|我一直期待着在夏日音乐节见到你！|여름 페스에서 만날 날을 기대했어요!"]],
        arena: [["master", "ここまで 来たか。 よい 顔に なったな。|You’ve come this far. You have a good face now.|你走到这里了。脸上有光了。|여기까지 왔구나. 좋은 얼굴이 되었어."]],
        world: [["mika", "世界の 舞台… 夢みたい。 でも 夢じゃない。|The world stage… like a dream. But it’s real.|世界舞台……像做梦一样。但这不是梦。|세계 무대… 꿈만 같아. 하지만 꿈이 아니야."]]
    };
    ST.RANK_LINE = [null,
        P("ファンが ふえてきた！|Fans are starting to gather!|粉丝多起来了！|팬이 늘기 시작했어요!"), P("町で 声を かけられる ように なった！|People greet you around town now!|在街上开始被人搭话了！|거리에서 말을 걸어 주는 사람이 생겼어요!"),
        P("学校中で 話題に！|You’re the talk of the school!|成了全校的话题！|학교에서 화제가 됐어요!"), P("町の 有名人に なった！|You’re a town celebrity now!|成了小镇的名人！|마을 유명인이 되었어요!"),
        P("ご当地スターの 誕生！|A local star is born!|地方明星诞生了！|지역 스타 탄생!"), P("ネットで 大きな 話題に！|You’re trending online!|在网络上成为大热门！|온라인에서 큰 화제가 됐어요!"),
        P("全国に 名前が ひろがった！|Your name spread nationwide!|名字传遍了全国！|이름이 전국에 퍼졌어요!"), P("テレビで 見ない日が ない！|You’re on TV every day!|没有一天不在电视上看到你！|TV에서 안 보이는 날이 없어요!"),
        P("国民的スターに なった！|You’re a national star!|成为了国民巨星！|국민 스타가 되었어요!"), P("世界中が あなたを 知っている！|The whole world knows you!|全世界都认识你！|전 세계가 당신을 알고 있어요!"),
        P("ついに 「伝説」に なった！！|You’ve become a “Legend”!!|终于成为了“传奇”！！|마침내 '전설'이 되었어요!!")];

    // ---- エンディング ----
    ST.ENDS = [];
    function EN(id, kind, pri, em, g, n, d, t){ var e = {id: id, kind: kind, pri: pri, em: em, g: g, n: P(n), d: P(d), t: t || function(){ return false; }}; ST.ENDS.push(e); }
    EN("legend", "special", 0, "👑", "great", "伝説の スター|Legendary Star|传奇巨星|전설의 스타", "ファン100万人。 {me}の 名前は 時代の 代名詞に なった。 ふり返れば、最初に サインを せがんだ ハルが 満面の 笑みで 拍手している。 夢は 叶う。|One million fans. The name {me} became synonymous with an era. Looking back, Haru—your first fan—is clapping with a huge smile. Dreams do come true.|粉丝一百万。{me}这个名字成了时代的代名词。回头一看，当初第一个要签名的小春正笑得灿烂地鼓掌。梦想真的会实现。|팬 100만 명. {me}라는 이름은 시대의 대명사가 되었어요. 돌아보니 처음 사인을 졸랐던 하루가 환하게 웃으며 박수를 치고 있어요. 꿈은 이루어져요.");
    EN("hospital", "crisis", 0, "🏥", "bad", "ドクターストップ|Doctor’s Orders|医生叫停|의사의 제동", "無理が たたって 体が 悲鳴を あげた。 しばらく 入院して 休むことに。 ミカが 「焦らなくていい。 健康が いちばん」と 手を にぎってくれた。|Overwork took its toll and your body gave out. You’ll rest in the hospital for a while. Mika held your hand: “No rush. Health comes first.”|过度劳累让身体发出了悲鸣。要住院休养一段时间。美佳握着你的手：“不用着急。健康最重要。”|무리한 탓에 몸이 비명을 질렀어요. 한동안 입원해 쉬기로 했어요. 미카가 손을 잡아 주며 “서두르지 않아도 돼. 건강이 제일이야.”");
    EN("hooked", "crisis", 0, "🎰", "bad", "ハマりすぎ注意|Hooked Too Deep|沉迷过头|너무 빠져버렸어요", "コインを 使いはたし、ホールから 出られなくなってしまった。 ミカと ハルが 迎えに 来て くれた。 「ゲームでも、ハマりすぎは 危険だよ」。 ここから やり直そう。|You ran out of coins and couldn’t leave the hall. Mika and Haru came to get you. “Even in a game, getting hooked is dangerous.” Let’s start over from here.|游戏币用光了，无法离开店里。美佳和小春来接你。“就算是游戏，沉迷过头也很危险。”从这里重新开始吧。|코인을 다 써버려 홀에서 나올 수 없게 되었어요. 미카와 하루가 데리러 와 주었어요. “게임이라도 너무 빠지면 위험해.” 여기서 다시 시작해요.");
    EN("world", "final", 1, "🌏", "great", "世界の 人気者|World Favorite|世界人气王|세계적 인기인", "90日で 世界の 舞台に 立った！ 言葉が ちがっても 歓声は 同じ。 次の ツアーは どこの 国だろう。|In 90 days you stood on the world stage! Languages differ, but the cheers are the same. Which country is next on the tour?|90天就站上了世界舞台！语言不同，欢呼声却一样。下一站巡演会去哪个国家呢。|90일 만에 세계 무대에 섰어요! 말은 달라도 환호는 같아요. 다음 투어는 어느 나라일까요.", function(S){ return S.rk >= 10; });
    EN("nation", "final", 2, "🌟", "great", "国民的スター|National Star|国民巨星|국민 스타", "町を 歩けば 誰もが 振り返る。 CMにも 引っぱりだこ。 気づけば 「国民的」と 呼ばれていた。|Everyone turns around when you walk through town. You’re in demand for commercials. Before you knew it, you were called “national.”|走在街上每个人都会回头。广告邀约不断。回过神来已被称为“国民级”。|거리를 걸으면 모두가 돌아봐요. CM에도 섭외 1순위. 어느새 '국민적'이라고 불리고 있었어요.", function(S){ return S.rk >= 9; });
    EN("tv", "final", 3, "📺", "great", "テレビの 顔|Face of TV|电视红人|TV의 얼굴", "毎日 どこかの 番組に 出ている。 控室で ミカが 小さく ガッツポーズ。 「もっと 上を 目指せるよ」。|You appear on some show every day. In the dressing room Mika makes a tiny fist pump. “We can aim even higher.”|每天都会出现在某个节目里。休息室里美佳小小地握拳庆祝。“还可以向更高处努力。”|매일 어딘가의 프로그램에 나와요. 대기실에서 미카가 작게 주먹을 쥐어요. “더 높이 갈 수 있어.”", function(S){ return S.rk >= 8; });
    EN("net", "final", 7, "📱", "great", "ネットの 星|Star of the Net|网络之星|인터넷의 스타", "あの バズった 動画が きっかけで ネット発の スターに。 世界中の コメントが あなたを 支えている。|That viral clip made you an internet-born star. Comments from around the world support you.|那个爆红的视频成了契机，你成为网络出身的明星。来自世界各地的评论支持着你。|그 대박 난 영상이 계기가 되어 인터넷 발 스타가 되었어요. 전 세계의 댓글이 당신을 지탱해요.", function(S){ return S.rk >= 6 && !!S.flags.viral; });
    EN("star", "final", 8, "⭐", "good", "ご当地スター|Local Star|地方明星|지역 스타", "地元では 知らない人が いない 存在に。 商店街の 看板にも あなたの 顔。 これからも 一歩ずつ。|Everyone in your hometown knows you. Your face is on the shopping-street signs. One step at a time from here.|在家乡无人不知。商店街的招牌上也有你的脸。今后也一步一步来。|고향에선 모르는 사람이 없어요. 상점가 간판에도 당신의 얼굴이. 앞으로도 한 걸음씩.", function(S){ return S.rk >= 5; });
    EN("rivalfriend", "final", 4, "🤝", "good", "最高の ライバル|The Best Rival|最棒的对手|최고의 라이벌", "ステージの 裏で リュウが 笑った。「次は 負けない」。 競いあった 90日が、二人を 一生の 仲間に した。|Backstage, Ryu grinned. “I won’t lose next time.” The 90 days of competing made you lifelong comrades.|后台阿龙笑了。“下次不会输了。”互相竞争的90天让两人成了一生的伙伴。|무대 뒤에서 류가 웃었어요. “다음엔 안 져.” 겨룬 90일이 두 사람을 평생의 동료로 만들었어요.", function(S){ return S.rk >= 3 && S.rel.rival >= 70; });
    EN("loyal", "final", 6, "💖", "good", "小さくても 熱い ファンに 囲まれて|Surrounded by Small but Loyal Fans|被小而热情的粉丝包围|작지만 뜨거운 팬에 둘러싸여", "ファンは 多くなくても、ハルを はじめ 一人ひとりが あなたの 宝物。 小さな ライブハウスで 今日も 最高の 笑顔。|Not many fans, but each one—Haru first of all—is your treasure. Another brilliant smile at the small live house today.|粉丝虽不多，但以小春为首每个人都是你的宝物。今天也在小小的演出场地露出最棒的笑容。|팬은 많지 않아도 하루를 비롯해 한 명 한 명이 보물이에요. 작은 라이브하우스에서 오늘도 최고의 미소.", function(S){ return S.rk >= 2 && S.rel.haru >= 70 && S.rel.mika >= 40; });
    EN("sober", "final", 5, "🌿", "good", "健全な 人気者|A Wholesome Favorite|健康的人气王|건전한 인기인", "お酒も たばこも ギャンブルも 遠ざけて、体と 心を 大切に。 清潔な 人柄が 好感を 呼び、ファンが 長く 続いている。|Staying away from alcohol, tobacco and gambling, you cared for body and mind. Your clean image won hearts and fans stay long-term.|远离酒、烟和赌博，珍惜身心。清爽的人品赢得好感，粉丝长久相伴。|술도 담배도 도박도 멀리하고 몸과 마음을 소중히 했어요. 깨끗한 인품이 호감을 불러 팬이 오래 이어져요.", function(S){ return S.rk >= 4 && S.drk < 10 && S.smk < 10 && S.gam < 10 && S.hlt >= 80 && !(S.cnt.drinkYes || S.cnt.smokeYes || S.cnt.pachiYes); });
    EN("local", "final", 9, "🎪", "good", "町の 有名人|Town Celebrity|小镇名人|마을 유명인", "町内の イベントには いつも 呼ばれる 存在に。 ここから もっと 大きな 舞台へ 羽ばたける はず。|You’re always invited to local events. From here you should be able to soar to bigger stages.|成了镇上活动必邀的人物。从这里应该能飞向更大的舞台。|동네 행사에 늘 초대받는 존재가 되었어요. 여기서부터 더 큰 무대로 날아오를 수 있을 거예요.", function(S){ return S.rk >= 3; });
    EN("rising", "final", 10, "🌱", "mid", "これからの 星|A Rising Star|未来之星|앞으로의 스타", "まだ 小さな 芽だけれど、 たしかに ファンが 待っている。 90日で 学んだ ことは 宝物。 次の 90日は きっと もっと 輝ける。|Still a small sprout, but fans are surely waiting. What you learned in 90 days is a treasure. The next 90 will shine even brighter.|虽然还是小小的嫩芽，但确实有粉丝在等待。90天学到的是宝物。下一个90天一定会更闪耀。|아직 작은 새싹이지만 분명 팬이 기다리고 있어요. 90일 동안 배운 건 보물. 다음 90일은 분명 더 빛날 거예요.", function(S){ return S.rk >= 1; });
    EN("newcomer", "final", 99, "🌸", "mid", "はじまりの 一歩|The First Step|起步的一步|시작의 한 걸음", "結果は まだ これから。 でも 逃げずに 90日を やりきった 自分を 誇ろう。 夢の 続きは、ここから。|The results are yet to come. But be proud of yourself for seeing all 90 days through. The rest of your dream starts here.|结果还在后头。但要为没有逃避、坚持走完90天的自己感到骄傲。梦想的后续从这里开始。|결과는 아직 앞으로예요. 하지만 도망치지 않고 90일을 해낸 자신을 자랑스러워하세요. 꿈의 다음 이야기는 여기서부터.");
    ST.ENDMAP = {}; ST.ENDS.forEach(function(e){ ST.ENDMAP[e.id] = e; });

    // ---- 実績 ----
    ST.ACH = [];
    function AC(id, em, n, d, t){ ST.ACH.push({id: id, em: em, n: P(n), d: P(d), t: t}); }
    var allArea = function(S, ar){ return ST.CHS.filter(function(c){ return c.area === ar; }).every(function(c){ return (S.stars[c.id] || 0) > 0; }); };
    var clears = function(S){ return ST.CHS.filter(function(c){ return (S.stars[c.id] || 0) > 0; }).length; };
    AC("first", "✨", "はじめの 一歩|The First Step|迈出第一步|첫 걸음", "チャレンジを 1回 あそぶ|Play one challenge|玩一次挑战|챌린지를 1번 하기", function(S){ return (S.cnt.chal || 0) >= 1; });
    AC("s3_1", "🥉", "パーフェクト！|Perfect!|完美！|퍼펙트!", "★3を 1回 とる|Earn ★3 once|获得一次★3|★3을 1번 받기", function(S){ return (S.cnt.s3 || 0) >= 1; });
    AC("s3_10", "🥈", "★3の 常連|Regular ★3|★3常客|★3 단골", "★3を 10回|Earn ★3 ten times|获得10次★3|★3을 10번", function(S){ return (S.cnt.s3 || 0) >= 10; });
    AC("s3_30", "🥇", "完璧主義者|Perfectionist|完美主义者|완벽주의자", "★3を 30回|Earn ★3 thirty times|获得30次★3|★3을 30번", function(S){ return (S.cnt.s3 || 0) >= 30; });
    AC("town", "🏘️", "住宅街 制覇|Neighborhood cleared|住宅区通关|동네 제패", "住宅街の 5つを すべて クリア|Clear all 5 in the Neighborhood|通关住宅区的5个挑战|동네의 5개를 모두 클리어", function(S){ return allArea(S, "town"); });
    AC("clear25", "🗺️", "半分 制覇|Halfway there|通关一半|절반 제패", "25の チャレンジを クリア|Clear 25 challenges|通关25个挑战|25개의 챌린지 클리어", function(S){ return clears(S) >= 25; });
    AC("clear50", "🏆", "全国 制覇|Complete clear|全部通关|전체 제패", "50の チャレンジを すべて クリア|Clear all 50 challenges|通关全部50个挑战|50개의 챌린지를 모두 클리어", function(S){ return clears(S) >= 50; });
    AC("rk3", "🏫", "学校の 人気者|School star|校园人气王|학교 인기인", "ランク「学校の人気者」に|Reach “School Star”|达到“校园人气王”|'학교 인기인' 달성", function(S){ return S.rk >= 3; });
    AC("rk5", "⭐", "ご当地スター|Local star|地方明星|지역 스타", "ランク「ご当地スター」に|Reach “Local Star”|达到“地方明星”|'지역 스타' 달성", function(S){ return S.rk >= 5; });
    AC("rk8", "📺", "テレビの 顔|Face of TV|电视红人|TV의 얼굴", "ランク「テレビの顔」に|Reach “Face of TV”|达到“电视红人”|'TV의 얼굴' 달성", function(S){ return S.rk >= 8; });
    AC("rk10", "🌏", "世界の 人気者|World favorite|世界人气王|세계적 인기인", "ランク「世界の人気者」に|Reach “World Favorite”|达到“世界人气王”|'세계적 인기인' 달성", function(S){ return S.rk >= 10; });
    AC("rk11", "👑", "伝説|Legend|传奇|전설", "ランク「伝説」に|Reach “Legend”|达到“传奇”|'전설' 달성", function(S){ return S.rk >= 11; });
    AC("stats40", "💪", "オールラウンダー|All-rounder|全能选手|올라운더", "すべての 能力が 40 以上|All stats 40+|所有能力40以上|모든 능력 40 이상", function(S){ return ST.STATS.every(function(s){ return S.st[s.id] >= 40; }); });
    AC("stat80", "🔥", "極めた 一芸|Master of one|精通一技|극한의 한 가지", "どれかの 能力が 80 以上|Any stat 80+|任一能力80以上|어느 능력이든 80 이상", function(S){ return ST.STATS.some(function(s){ return S.st[s.id] >= 80; }); });
    AC("streak5", "🔗", "連続成功 5|5 in a row|连续成功5次|연속 성공 5", "連続で 5回 クリア|Clear 5 in a row|连续通关5次|연속 5회 클리어", function(S){ return S.maxStreak >= 5; });
    AC("streak10", "⛓️", "連続成功 10|10 in a row|连续成功10次|연속 성공 10", "連続で 10回 クリア|Clear 10 in a row|连续通关10次|연속 10회 클리어", function(S){ return S.maxStreak >= 10; });
    AC("train20", "🥋", "特訓の 鬼|Training devotee|特训狂人|특훈의 달인", "特訓を 20回|Train 20 times|特训20次|특훈 20번", function(S){ return (S.cnt.train || 0) >= 20; });
    AC("train50", "🏋️", "鉄人|Iron person|铁人|철인", "特訓を 50回|Train 50 times|特训50次|특훈 50번", function(S){ return (S.cnt.train || 0) >= 50; });
    AC("sober", "🌿", "クリーンな 日々|Clean living|清爽的日子|깨끗한 나날", "40日以上 お酒に 付き合わず 過ごす|40+ days without taking up drinks|40天以上不陪酒|40일 이상 술자리를 피하기", function(S){ return S.day > 40 && !(S.cnt.drinkYes); });
    AC("nosmoke", "🫁", "たばこは 吸わない|Smoke-free|不吸烟|담배는 안 피워요", "40日以上 たばこを 吸わない|40+ days without smoking|40天以上不吸烟|40일 이상 담배를 안 피우기", function(S){ return S.day > 40 && !(S.cnt.smokeYes); });
    AC("nopachi", "🛑", "ギャンブルとは 無縁|No gambling|远离赌博|도박과 무관", "40日以上 パチンコを しない|40+ days without pachinko|40天以上不玩弹珠机|40일 이상 파친코 안 하기", function(S){ return S.day > 40 && !(S.cnt.pachi) && !(S.cnt.pachiYes); });
    AC("rich", "💰", "コイン長者|Coin tycoon|游戏币大富翁|코인 부자", "コインが 3000 以上|Hold 3,000+ coins|持有3000以上游戏币|코인 3000 이상", function(S){ return S.coins >= 3000; });
    AC("outfit3", "👗", "衣装持ち|Wardrobe|衣橱|의상 부자", "ステージ衣装 Lv3|Stage outfit Lv3|舞台服装Lv3|무대 의상 Lv3", function(S){ return S.gear.outfit >= 3; });
    AC("haru80", "🧒", "ハルの ヒーロー|Haru’s hero|小春的英雄|하루의 영웅", "ハルとの きずな 80|Bond with Haru 80|与小春的羁绊80|하루와의 유대 80", function(S){ return S.rel.haru >= 80; });
    AC("mika80", "🧑‍💼", "最高の 相棒|Best partner|最棒的搭档|최고의 파트너", "ミカとの きずな 80|Bond with Mika 80|与美佳的羁绊80|미카와의 유대 80", function(S){ return S.rel.mika >= 80; });
    AC("ryu80", "🤝", "宿命の ライバル|Destined rival|宿命的对手|숙명의 라이벌", "リュウとの きずな 80|Bond with Ryu 80|与阿龙的羁绊80|류와의 유대 80", function(S){ return S.rel.rival >= 80; });
    AC("pachiwin", "🎰", "ツイてた！|Lucky!|走运！|운이 좋았어요!", "パチンコ（ニセコイン）で プラス 500 ……でも これは たまたま|Net +500 at pachinko (fake coins)… but that’s luck|弹珠机（假游戏币）净赚500……不过只是运气|파친코(가짜 코인)에서 +500… 하지만 우연", function(S){ return S.pachiNet >= 500; });
    AC("boss5", "🥊", "ボスキラー|Boss slayer|首领杀手|보스 킬러", "5つの エリアボスを たおす|Beat 5 area bosses|击败5个区域首领|5개 지역 보스 격파", function(S){ return Object.keys(S.flags).filter(function(k){ return /^boss_/.test(k); }).length >= 5; });
    ST.ACHMAP = {}; ST.ACH.forEach(function(a){ ST.ACHMAP[a.id] = a; });
})();
