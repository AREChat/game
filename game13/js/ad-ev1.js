"use strict";
/* 20歳の冒険：イベント1（しくみ・ピンチ・季節の行事） */
(function(){
    var AD = window.AD || globalThis.AD, E = AD.E, C = AD.C, O = AD.O, N = AD.N, W = AD.W;
    var full = function(S){ return S.job && AD.JOBMAP[S.job].tier === "full"; };
    var hasJob = function(S){ return !!S.job; };
    var money = function(n){ return function(S){ return S.money >= n; }; };

    // ===== 20歳のはじまり =====
    E("coming", {fix: 1, wk: [0, 0]}, N("成人式の朝", "Coming-of-Age Day", "成人节的早晨", "성인식 아침"),
        N("スーツと振袖の中、{ken}が大声で手を振っている。「おーい、{me}！ 変わってないな！」 今日から、おとなの一年がはじまる。", "Among the suits and kimonos, {ken} waves wildly. \"Hey, {me}! You haven't changed!\" Today your adult year begins.", "西装和振袖之间，{ken}大声挥着手。“喂，{me}！你一点没变！”今天起，成年的一年开始了。", "정장과 기모노 사이에서 {ken}이(가) 크게 손을 흔들어요. \"야, {me}! 하나도 안 변했네!\" 오늘부터 어른의 일 년이 시작돼요."), [
        C(N("旧友と はしゃぐ", "Joke around with old friends", "和老友们闹成一团", "옛 친구들과 신나게"), [O(1, {soc: 4, mp: 8, money: -3000, rel: {ken: 8}}, N("写真を とりまくった。最高の一日！", "Took photos all day. The best!", "拍了好多照片。美好的一天！", "사진을 잔뜩 찍었어요. 최고의 하루!"))]),
        C(N("恩師に あいさつ", "Greet an old teacher", "去向恩师问好", "은사님께 인사"), [O(1, {knw: 3, chm: 2, mp: 3}, N("「しっかり やれよ」と 背中を おされた。", "\"Do your best,\" they said, patting your back.", "“好好加油啊”，老师拍了拍你的背。", "\"잘해라\" 하고 등을 두드려 주셨어요."))]),
        C(N("早めに ぬけて 将来を 考える", "Slip away and think about the future", "早点离开思考将来", "일찍 빠져나와 미래를 생각"), [O(1, {skl: 2, knw: 2, mp: -2}, N("一年で なにを つかむか、ノートに 書いた。", "You wrote down what you want to grab this year.", "把这一年想要抓住的东西写进了笔记本。", "일 년 동안 무엇을 잡을지 노트에 적었어요."), {set: "planner"})])
    ]);

    // ===== しくみ（会社・バイト） =====
    E("fired", {src: "sys"}, N("シフトに 入らなくなった結果…", "You stopped showing up…", "因为总不去上班……", "근무에 안 나갔더니…"),
        N("連絡が とれないまま、職場から「今月で終わりに しましょう」と メールが きた。収入が なくなる。", "After no contact, your workplace emailed: \"Let's end it this month.\" Your income is gone.", "一直联系不上，公司发来邮件：“这个月就到此为止吧。”收入没了。", "연락이 안 된 채로 직장에서 \"이번 달로 마무리하죠\"라고 메일이 왔어요. 수입이 사라졌어요."), [
        C(N("次を さがす", "Look for something new", "找下一份工作", "다음 일을 찾는다"), [O(1, {mp: -8, knw: 1}, N("すぐ 気持ちを 切りかえた。", "You switched gears quickly.", "很快调整了心态。", "금세 마음을 다잡았어요."), {job: null, q: ["jobhunt", 0]})]),
        C(N("すこし 休む", "Take a break first", "先休息一下", "조금 쉰다"), [O(1, {hp: 15, mp: 8, soc: -2}, N("しばらく ゆっくり することにした。", "You decided to rest for a while.", "决定先好好休息一阵。", "당분간 푹 쉬기로 했어요."), {job: null})])
    ]);
    E("absent_warn", {src: "sys"}, N("店長・上司から LINE", "A message from your boss", "上司的消息", "상사에게서 연락"),
        N("「最近 来てないけど、だいじょうぶ？ 無理しすぎてない？」 あたたかい 連絡が きた。", "\"You haven't come in lately. Are you okay? Don't push yourself.\" A kind message arrived.", "“最近没来，没事吧？别太勉强自己。”收到一条暖心的消息。", "\"요즘 안 나오던데 괜찮아? 무리하지 마.\" 따뜻한 연락이 왔어요."), [
        C(N("すぐ 出勤すると 返す", "Promise to come back", "回复说马上回去", "곧 출근한다고 답장"), [O(1, {mp: -3, soc: 1}, N("次の週から ちゃんと 入ろう。", "You'll show up properly next week.", "下周起好好上班。", "다음 주부터 제대로 나가자."))]),
        C(N("しばらく 休むと 正直に言う", "Honestly say you need a break", "老实说要休息一阵", "솔직히 쉬고 싶다고 말한다"), [O(1, {mp: 6, hp: 5}, N("理解してもらえた。ほっとした。", "They understood. Relief.", "得到了理解。松了口气。", "이해해 줬어요. 한시름 놓았어요."))])
    ]);
    // しごとさがし（そのときの 条件で 3つ）
    AD.DYN.jobhunt = function(S){
        var cand = AD.JOBS.filter(function(j){ return j.id !== S.job && j.id !== "family" && AD.jobOk(S, j); });
        var bigOk = S.cnt.career >= 3 && S.knw >= 45 && !S.flags.offer_big;
        var pool = cand.slice(), picks = [], k;
        for(k = 0; k < 3 && pool.length; k++){ var j = AD.pickW(S, pool, function(){ return 1; }); picks.push(j); pool.splice(pool.indexOf(j), 1); }
        var ch = picks.map(function(j){
            return C(N(j.n.ja + "（¥" + (j.pay / 1000) + "k/回）", j.n.en + " (¥" + (j.pay / 1000) + "k/shift)", j.n.zh + "（¥" + (j.pay / 1000) + "k/次）", j.n.ko + " (¥" + (j.pay / 1000) + "k/회)"),
                [O(1, {mp: 2}, N("採用された！ 来週から新しい職場。", "You got the job! Starting next week.", "录用了！下周开始新工作。", "채용됐어요! 다음 주부터 새 직장."), {job: j.id}), O(1, {mp: -4}, N("残念ながら 不採用…。", "Unfortunately rejected…", "很遗憾没被录用……", "아쉽게도 불합격…"))],
                {chk: {base: .5, s: ["chm", "knw"], k: .004}});
        });
        if(bigOk) ch.push(C(N("🏆 憧れの大企業に 応募する", "🏆 Apply to a dream big company", "🏆 应聘梦想中的大企业", "🏆 동경하던 대기업에 지원"), [O(1, {mp: 8, chm: 2}, N("【内定】大企業から 内定の連絡が！ 人生が 動きだす…。", "OFFER! A big company wants you! Life starts to move…", "【录用】大企业发来了录用通知！人生开始转动……", "【내정】대기업에서 합격 연락이! 인생이 움직이기 시작해요…"), {set: "offer_big", job: "sales"}), O(1, {mp: -10}, N("最終面接で 落ちた…。 でも 経験には なった。", "Rejected at the final interview… but it was an experience.", "最终面试被刷了……不过也是经验。", "최종 면접에서 떨어졌어요… 그래도 경험이 됐어요."))], {chk: {base: .12, s: ["knw", "chm", "soc"], k: .006}}));
        if(S.job && S.job !== "family") ch.push(C(N("今の しごとを やめる（お金は 自分で なんとかする）", "Quit your current job (you'll have to manage money yourself)", "辞掉现在的工作（钱要自己想办法）", "지금 일을 그만둔다 (돈은 스스로 해결)"), [O(1, {mp: 6, soc: -1}, N("退職届を 出した。 肩が かるい。 …けど、 来月からの 生活費は？", "You handed in your resignation. A weight off your shoulders… but what about next month's bills?", "递交了辞职信。一身轻松……可下个月的生活费呢？", "사직서를 냈어요. 어깨가 가벼워요… 그런데 다음 달 생활비는?"), {job: null})]));
        ch.push(C(N("今は やめておく", "Not now", "现在先不了", "지금은 그만둔다"), [O(1, {})]));
        return {id: "jobhunt", cfg: {}, title: N("求人・面接", "Listings & interviews", "招聘与面试", "구인·면접"), body: N("気になる募集を 見つけた。どれかに 応募してみよう。（成功率は 能力しだい）", "You found some openings. Apply to one! (Odds depend on your stats.)", "发现了几个有意思的招聘。选一个投简历吧！（成功率取决于能力）", "관심 가는 공고를 찾았어요. 하나 지원해 보세요! (성공률은 능력에 따라)"), ch: ch};
    };

    // ===== ピンチ =====
    E("collapse", {crisis: 1, rep: 1, cd: 6, need: function(S){ return S.hp <= 8; }}, N("ふらっと 倒れた", "You collapsed", "晕倒了", "휘청 쓰러졌어요"),
        N("気づいたら 病院の天井。「ちょっと 働きすぎ・遊びすぎ ですね」と 先生に 言われた。", "You wake up to a hospital ceiling. \"Maybe too much work or play,\" says the doctor.", "醒来时看到的是医院天花板。医生说：“工作或玩得有点过头了哦。”", "정신을 차리니 병원 천장. \"좀 무리하셨네요\" 의사가 말했어요."), [
        C(N("ちゃんと 休む", "Rest properly", "好好休息", "제대로 쉰다"), [O(1, {hp: 40, mp: 10, hlt: 2, money: -12000}, N("数日 休んで ずいぶん 回復した。", "A few days of rest did wonders.", "休息几天恢复了不少。", "며칠 쉬었더니 많이 회복됐어요."))]),
        C(N("すぐ 戻る", "Get right back to it", "马上回去", "바로 복귀"), [O(1, {hp: 25, mp: -5, hlt: -4, money: -12000}, N("無理して 戻った。 体は 悲鳴を あげている。", "You pushed back too soon. Your body protests.", "硬撑着回去了。身体在尖叫。", "무리해서 복귀했어요. 몸이 비명을 질러요."))])
    ]);
    E("debt_notice", {crisis: 1, rep: 1, cd: 6, need: function(S){ return S.money < -20000; }}, N("残高が マイナス！", "Your balance is negative!", "余额变成负数了！", "잔고가 마이너스!"),
        N("銀行アプリに 赤い数字。 「お支払いが おくれています」の通知が 止まらない…。", "A red number in the bank app. \"Payment overdue\" notices keep coming…", "银行App上一串红色数字。“逾期未付”的通知不断弹出……", "은행 앱에 빨간 숫자. \"결제가 늦어지고 있습니다\" 알림이 멈추지 않아요…"), [
        C(N("{ken}に 頭を下げて 借りる", "Humbly borrow from {ken}", "低头向{ken}借钱", "{ken}에게 고개 숙여 빌린다"), [O(1, {money: 30000, mp: -6, rel: {ken: -3}}, N("「いつか 返せよ」と 笑って 貸してくれた。", "\"Pay me back someday,\" they laughed.", "“以后记得还哦”，对方笑着借给了你。", "\"언젠가 갚아\" 하고 웃으며 빌려줬어요."))], {need: function(S){ return S.rel.ken >= 25; }}),
        C(N("シフトを ふやす", "Pick up more shifts", "多排些班", "근무를 늘린다"), [O(1, {money: 22000, hp: -8, mp: -6}, N("休みなしで 働いて なんとか 返した。", "You worked nonstop and paid some off.", "没日没夜工作，总算还上了一部分。", "쉬지 않고 일해서 겨우 갚았어요."))], {need: hasJob}),
        C(N("見ないふりを する", "Pretend not to see it", "假装没看见", "못 본 척한다"), [O(1, {mp: -4, money: -4000}, N("利息だけが ふえていく…。", "Only the interest grows…", "只有利息在增加……", "이자만 불어나요…"))])
    ]);
    E("burnout_warn", {crisis: 1, rep: 1, cd: 8, need: function(S){ return S.mp <= 15; }}, N("気持ちが ぎりぎり", "Running on empty", "精神快撑不住了", "마음이 한계"),
        N("なにをしても 楽しくない。朝 起きるのが つらい。スマホを 見る気力もない。", "Nothing feels fun. Getting up is hard. You can't even look at your phone.", "做什么都不开心。早上起床很难受。连看手机的力气都没有。", "뭘 해도 즐겁지 않아요. 아침에 일어나기 힘들어요. 폰 볼 기운도 없어요."), [
        C(N("{ken}に 電話する", "Call {ken}", "给{ken}打电话", "{ken}에게 전화"), [O(1, {mp: 28, rel: {ken: 5}, soc: 1}, N("2時間 しゃべって 心が かるくなった。", "Two hours of talking lightened your heart.", "聊了两个小时，心里轻松多了。", "두 시간 수다 떨고 마음이 가벼워졌어요."))]),
        C(N("ぜんぶ 休んで 寝る", "Drop everything and sleep", "全部放下睡觉", "다 접고 잔다"), [O(1, {hp: 25, mp: 30, money: -3000}, N("泥のように ねむった。 すこし 戻ってきた。", "You slept like a stone and came back a bit.", "睡得像一滩泥。感觉恢复了一点。", "진흙처럼 잤어요. 조금 돌아온 느낌."))]),
        C(N("気合いで のりきる", "Tough it out", "靠意志硬扛", "정신력으로 버틴다"), [O(1, {mp: 8}, N("なんとか 持ちこたえた。", "You somehow held on.", "总算撑住了。", "어떻게든 버텼어요."), {}), O(1, {mp: -10, hlt: -3}, N("やっぱり だめだった…。", "It didn't work…", "果然还是不行……", "역시 안 됐어요…"))], {chk: {base: .3, s: ["hlt"], k: .003}})
    ]);

    // ===== 季節・行事 =====
    E("valentine", {fix: 1, wk: [W(2, 8), W(2, 15)]}, N("バレンタインの 街", "Valentine's season", "情人节的街头", "발렌타인 거리"),
        N("街が ピンクに 染まっている。{sak}と {misa}から LINEが きた。「ちょっと 会えない？」", "The town is pink. Messages from {sak} and {misa}: \"Can we meet?\"", "街头一片粉色。{sak}和{misa}发来消息：“能见一面吗？”", "거리가 분홍빛이에요. {sak}와(과) {misa}에게서 연락이 왔어요. \"잠깐 만날 수 있어?\""), [
        C(N("{sak}に 会う", "Meet {sak}", "去见{sak}", "{sak}를 만난다"), [O(1, {mp: 10, money: -2500, rel: {sak: 14}}, N("手づくりチョコを もらった。心臓が うるさい。", "You got handmade chocolate. Your heart is loud.", "收到了手作巧克力。心跳好吵。", "수제 초콜릿을 받았어요. 심장이 시끄러워요."))]),
        C(N("{misa}に 会う", "Meet {misa}", "去见{misa}", "{misa}를 만난다"), [O(1, {mp: 10, money: -2500, rel: {misa: 14}}, N("昔みたいに 笑いあった。", "You laughed together like old times.", "像从前一样笑成一团。", "옛날처럼 함께 웃었어요."))]),
        C(N("友だち みんなで 会う", "Meet everyone together", "大家一起见面", "친구들과 함께"), [O(1, {mp: 8, soc: 3, money: -3000, rel: {sak: 5, misa: 5, ken: 3}}, N("みんなで チョコを 交換して 盛りあがった。", "Everyone swapped chocolates and had fun.", "大家互换巧克力，玩得很开心。", "다 같이 초콜릿을 교환하며 즐거웠어요."))])
    ]);
    E("exam_season", {fix: 1, wk: [W(2, 15), W(2, 25)], need: function(S){ return S.flags.student; }}, N("期末テストの 季節", "Exam season", "期末考试季", "기말고사 시즌"),
        N("図書館が 満席。レポートの山。 {ken}は 「一夜漬けで いける」と 言っている。", "The library is full. Piles of reports. {ken} says, \"I can cram it all in one night.\"", "图书馆座无虚席。堆积如山的报告。{ken}说：“通宵突击就行”。", "도서관이 만석이에요. 리포트 산더미. {ken}은(는) \"벼락치기하면 돼\"라고 해요."), [
        C(N("コツコツ 勉強する", "Study steadily", "稳扎稳打地复习", "꾸준히 공부"), [O(1, {knw: 8, mp: -6, hp: -6}, N("手ごたえ ばっちり！", "You nailed it!", "有十足的把握！", "손맛이 확실해요!"))]),
        C(N("一夜漬けに ちょうせん", "Pull an all-nighter", "挑战通宵突击", "벼락치기에 도전"), [O(1, {knw: 7, mp: -3, hp: -4}, N("なんとか 乗り切った！", "Somehow made it!", "总算蒙混过关了！", "어떻게든 넘겼어요!")), O(1, {knw: 2, mp: -12, hp: -14, hlt: -2}, N("寝落ちして テスト中に 頭が まっ白に…。", "You nodded off; your mind went blank mid-test…", "睡过去了，考试时脑子一片空白……", "졸다가 시험 중에 머리가 하얘졌어요…"))], {chk: {base: .35, s: ["knw"], k: .004}}),
        C(N("{ken}に ノートを 借りる", "Borrow {ken}'s notes", "向{ken}借笔记", "{ken}에게 노트를 빌린다"), [O(1, {knw: 5, rel: {ken: 3}, mp: -2}, N("{ken}の ノートが 意外と わかりやすい。", "{ken}'s notes are surprisingly clear.", "{ken}的笔记意外地好懂。", "{ken}의 노트가 의외로 알기 쉬워요."))])
    ]);
    E("tax", {fix: 1, wk: [W(3, 5), W(3, 15)], need: function(S){ return (S.cnt.side || 0) >= 3 || S.fame >= 20000; }}, N("税金の おしらせ", "Tax time", "税务通知", "세금 안내"),
        N("副業の収入が 増えてきて、確定申告の 時期。 ネットで 調べても よくわからない…。", "Your side income is growing and tax season is here. The web isn't helping much…", "副业收入增加了，到了报税的时候。网上查也看不太懂……", "부업 수입이 늘어서 확정신고 시기예요. 인터넷으로 찾아도 잘 모르겠어요…"), [
        C(N("ちゃんと 勉強して 申告する", "Learn it and file properly", "认真学习后申报", "제대로 공부해서 신고"), [O(1, {knw: 3, mp: -4, money: -6000}, N("税金の しくみが 少し わかった。", "You understood taxes a little better.", "稍微弄懂了税收的原理。", "세금 구조를 조금 알게 됐어요."), {set: "tax_ok"})]),
        C(N("専門家に まかせる", "Hire a professional", "委托专业人士", "전문가에게 맡긴다"), [O(1, {money: -15000, mp: 2}, N("安心料だと 思うことに した。", "You call it peace-of-mind money.", "就当是买个安心吧。", "안심료라고 생각하기로 했어요."), {set: "tax_ok"})]),
        C(N("あと回しに する", "Put it off", "往后拖", "미룬다"), [O(1, {money: -20000, mp: -6}, N("あとで 追徴課税を うけた…。", "You paid extra later…", "之后被追缴了税款……", "나중에 추징세를 냈어요…"), {})])
    ]);
    E("hanami", {fix: 1, wk: [W(3, 28), W(4, 10)]}, N("お花見の 季節", "Cherry-blossom season", "赏樱季", "벚꽃 시즌"),
        N("満開の さくら。 {ken}から 「場所取り 行ってくれる？」と 連絡が きた。", "Cherry blossoms at full bloom. {ken}: \"Can you go grab a spot?\"", "樱花盛开。{ken}发来消息：“能去占个位置吗？”", "벚꽃이 만개했어요. {ken}이(가) \"자리 맡아줄래?\" 하고 연락했어요."), [
        C(N("早起きして 場所取り", "Wake up early to claim a spot", "早起占位", "일찍 일어나 자리 맡기"), [O(1, {hp: -6, soc: 4, mp: 10, rel: {ken: 4}}, N("寒かったけど みんなで 笑いあった。", "It was cold, but we laughed together.", "虽然冷，但大家笑成一片。", "추웠지만 다 같이 웃었어요."))]),
        C(N("ひとりで 静かに 見る", "Enjoy them quietly alone", "一个人静静地看", "혼자 조용히 본다"), [O(1, {mp: 12, hlt: 1, chm: 1}, N("花びらが ひらひら…。 心が 静まった。", "Petals drifting down… your mind settles.", "花瓣纷纷飘落……内心平静下来。", "꽃잎이 나풀나풀… 마음이 가라앉았어요."))]),
        C(N("花より だんご", "Food over flowers", "吃比赏花重要", "꽃보다 먹거리"), [O(1, {mp: 9, money: -2500, hp: 3}, N("屋台で おなか いっぱい！", "You stuffed yourself at the stalls!", "在摊位吃得好饱！", "포장마차에서 배불리 먹었어요!"))])
    ]);
    E("new_face", {fix: 1, wk: [W(4, 1), W(4, 20)]}, N("春の 新しい出会い", "New faces in spring", "春天的新邂逅", "봄의 새로운 만남"),
        N("新入生・新入社員が 街に あふれる季節。 初対面の{sak}が 同じ 電車で 話しかけてきた。", "Newcomers fill the streets. {sak}, a stranger, speaks to you on the same train.", "新生和新员工挤满街头的季节。素不相识的{sak}在同一趟电车上向你搭话。", "신입생·신입 사원이 거리에 넘치는 계절. 처음 보는 {sak}이(가) 같은 전철에서 말을 걸어요."), [
        C(N("すなおに 話してみる", "Chat openly", "坦率地聊聊", "솔직하게 얘기해 본다"), [O(1, {soc: 3, mp: 6, rel: {sak: 12}}, N("意外と 話が はずんで 連絡先を 交換した！", "The talk flowed; you swapped contacts!", "聊得意外投机，交换了联系方式！", "의외로 대화가 잘 통해서 연락처를 교환했어요!"), {set: "met_sak"}), O(1, {mp: -3, rel: {sak: 2}}, N("緊張して うまく しゃべれなかった…。", "You were too nervous to talk well…", "太紧张，没能好好说话……", "긴장해서 말이 잘 안 나왔어요…"), {set: "met_sak"})], {chk: {base: .45, s: ["chm"], k: .008}}),
        C(N("ヘッドホンで 聞こえないふり", "Pretend not to hear (headphones)", "戴着耳机假装没听见", "헤드폰 끼고 못 들은 척"), [O(1, {mp: 1}, N("電車は 静かに ゆれた。", "The train rocked quietly.", "电车静静地摇晃着。", "전철이 조용히 흔들렸어요."))])
    ]);
    E("gw", {fix: 1, wk: [W(4, 28), W(5, 8)]}, N("ゴールデンウィーク", "Golden Week", "黄金周", "골든위크"),
        N("連休だ！ SNSには みんなの 旅行写真が ならんでいる。 {me}は…？", "A long holiday! Everyone's trip photos fill your feed. And you…?", "长假来了！SNS上全是大家的旅行照片。{me}呢……？", "연휴예요! SNS에 다들 여행 사진을 올렸어요. {me}은(는)…?"), [
        C(N("思いきって 遠出する（¥30,000）", "Take a big trip (¥30,000)", "来一次远行（¥30,000）", "과감히 멀리 떠난다(¥30,000)"), [O(1, {money: -30000, mp: 25, knw: 2, hp: -5, soc: 2}, N("知らない景色に 心が ひろがった。", "Unfamiliar scenery opened your heart.", "陌生的景色让心胸开阔。", "낯선 풍경에 마음이 넓어졌어요."), {cnt: {trips: 1}})], {need: money(30000)}),
        C(N("連休は バイトを いれる", "Pick up work over the break", "连休期间多排班", "연휴에는 알바를 넣는다"), [O(1, {money: 32000, hp: -10, mp: -6}, N("時給アップで がっつり かせいだ。", "Holiday pay — you earned a lot.", "节假日加班费，赚了不少。", "휴일 수당으로 크게 벌었어요."))], {need: hasJob}),
        C(N("家で ごろごろ", "Laze around at home", "在家躺平", "집에서 뒹굴뒹굴"), [O(1, {hp: 20, mp: 14}, N("最高の ダラダラ。 罪悪感は ちょっと。", "Perfect laziness. Just a little guilt.", "完美的摆烂。只有一点点罪恶感。", "최고의 빈둥거림. 죄책감은 약간."))])
    ]);
    E("rainy", {fix: 1, wk: [W(6, 10), W(6, 24)]}, N("梅雨の ゆううつ", "Rainy-season blues", "梅雨的忧郁", "장마철 우울"),
        N("毎日 雨。 洗濯物は かわかない。 気分も どんより…。", "Rain every day. Laundry won't dry. Your mood is gloomy…", "天天下雨。衣服晒不干。心情也阴沉沉的……", "매일 비. 빨래는 안 마르고 기분도 우중충…"), [
        C(N("雨の日を 楽しむ（カフェ）", "Enjoy it at a café", "享受雨天（咖啡馆）", "비 오는 날을 즐긴다(카페)"), [O(1, {mp: 9, money: -1800, knw: 1}, N("窓の雨音を きいて ゆっくり 読書。", "Reading to the sound of rain on the window.", "听着窗外雨声悠闲读书。", "창가의 빗소리를 들으며 독서."))]),
        C(N("家で ひたすら ゲーム", "Game at home all day", "在家一直打游戏", "집에서 계속 게임"), [O(1, {mp: 12, hp: -3, rel: {noa: 4}}, N("{noa}と 朝まで 協力プレイ。", "Co-op with {noa} until dawn.", "和{noa}合作游戏到天亮。", "{noa}와(과) 아침까지 협동 플레이."))]),
        C(N("気合いで ジムへ", "Push yourself to the gym", "硬着头皮去健身房", "큰맘 먹고 헬스장"), [O(1, {hlt: 3, mp: 3, hp: -5, money: -700}, N("気分が スッキリ。 雨にも 勝った。", "You feel clear. You beat the rain too.", "心情清爽了。连雨天也赢了。", "기분이 상쾌해요. 비도 이겼어요."))])
    ]);
    E("summer_fes", {fix: 1, wk: [W(7, 22), W(8, 8)]}, N("夏祭り・花火大会", "Summer festival & fireworks", "夏日祭典与烟火大会", "여름 축제·불꽃놀이"),
        N("ドーン…と 空に 大輪の 花火。 ゆかた姿の 人たちで 川ぞいは いっぱいだ。 誰と 見る？", "BOOM — giant fireworks bloom in the sky. The riverside is packed with yukata. Who will you watch with?", "砰——天空绽放巨大的烟火。河边挤满了穿浴衣的人。你想和谁一起看？", "쾅— 하늘에 커다란 불꽃이 피어요. 강가는 유카타 입은 사람들로 가득해요. 누구와 볼까요?"), [
        C(N("{sak}と 屋台を まわる", "Tour the stalls with {sak}", "和{sak}逛摊位", "{sak}와(과) 포장마차 구경"), [O(1, {mp: 14, money: -4000, rel: {sak: 12}}, N("花火の下で 手が ふれた。 夏が ぎゅっと つまってる。", "Your hands brushed under the fireworks. Summer, distilled.", "烟火下手碰到了一起。夏天被紧紧装满。", "불꽃 아래서 손이 스쳤어요. 여름이 꽉 차 있어요."), {set: "fes_sak"})]),
        C(N("{misa}と 見る", "Watch with {misa}", "和{misa}一起看", "{misa}와(과) 본다"), [O(1, {mp: 14, money: -4000, rel: {misa: 12}}, N("「来年も 見ようね」と 言われた。", "\"Let's watch again next year,\" they said.", "对方说：“明年也一起看吧”。", "\"내년에도 같이 보자\"라는 말을 들었어요."), {set: "fes_misa"})]),
        C(N("{ken}たちと 打ち上げ", "After-party with {ken} and friends", "和{ken}他们庆祝", "{ken} 일행과 뒤풀이"), [O(1, {mp: 12, soc: 4, money: -3500, rel: {ken: 5}}, N("わたあめ・かき氷・くだらない話。 最高。", "Cotton candy, shaved ice, silly talk. The best.", "棉花糖、刨冰、聊废话。太棒了。", "솜사탕·빙수·시시한 이야기. 최고."))]),
        C(N("屋台で バイト（臨時収入）", "Work a festival stall (extra income)", "在摊位打零工（额外收入）", "포장마차 알바(임시 수입)"), [O(1, {money: 14000, hp: -8, soc: 2}, N("汗だくで 焼きそばを 焼きまくった。", "You grilled noodles until you were drenched in sweat.", "汗流浃背地煎了一堆炒面。", "땀범벅으로 볶음면을 구웠어요."))])
    ]);
    E("obon", {fix: 1, wk: [W(8, 10), W(8, 20)]}, N("お盆の 帰省", "Obon homecoming", "盂兰盆节回乡", "오봉 귀성"),
        N("{mom}から 「お盆 かえってくる？」と メール。 {gpa}も 待っているらしい。", "{mom} texts: \"Coming home for Obon?\" {gpa} seems to be waiting too.", "{mom}发来邮件：“盂兰盆节回来吗？”{gpa}好像也在等你。", "{mom}이(가) \"오봉에 올 거니?\" 하고 메일을 보냈어요. {gpa}도 기다리는 모양이에요."), [
        C(N("実家に帰る", "Go home", "回老家", "본가에 간다"), [O(1, {mp: 14, hp: 15, money: -4000, rel: {mom: 8, gpa: 6}}, N("おばあちゃんの スイカ。 縁側の 風鈴。 ただいま。", "Watermelon, a wind chime on the veranda. I'm home.", "西瓜、檐廊上的风铃。我回来了。", "수박, 툇마루의 풍경. 다녀왔어요."))]),
        C(N("今年は 帰らない", "Skip it this year", "今年不回去", "올해는 안 간다"), [O(1, {money: 6000, mp: -2, rel: {mom: -4}}, N("すこし 後ろめたいけど 稼ぎどき。", "A bit guilty, but it's prime earning time.", "有点愧疚，但正是赚钱的好时机。", "조금 미안하지만 돈 벌 기회예요."))]),
        C(N("家族を 連れて ごはん", "Treat the family to dinner", "请家人吃饭", "가족을 데리고 식사"), [O(1, {mp: 10, money: -12000, rel: {mom: 10, gpa: 6}}, N("「おとなに なったね」と 笑われた。", "\"You've grown up,\" they smiled.", "家人笑着说：“你长大了呢”。", "\"어른이 됐네\" 하고 웃으셨어요."))], {need: money(12000)})
    ]);
    E("typhoon", {fix: 1, wk: [W(9, 5), W(9, 25)]}, N("台風 接近", "Typhoon approaching", "台风逼近", "태풍 접근"),
        N("強い風と 雨。 電車は 止まる予報。 でも 今日は 大事な予定が…。", "Strong wind and rain. Trains will stop. But today you had something important…", "风雨交加。预报电车会停运。但今天有重要的安排……", "강한 바람과 비. 전철이 멈출 예정. 그런데 오늘 중요한 일정이…"), [
        C(N("無理せず 家に いる", "Stay safe at home", "不勉强，待在家里", "무리하지 않고 집에 있는다"), [O(1, {hp: 10, mp: 5}, N("窓の外の 嵐を 見ながら のんびり。", "Relaxed, watching the storm outside.", "看着窗外的暴风雨悠闲度日。", "창밖 폭풍을 보며 느긋하게."))]),
        C(N("近所の 人を 手伝う", "Help the neighbors", "帮邻居的忙", "이웃을 돕는다"), [O(1, {soc: 4, chm: 2, hp: -8, mp: 3}, N("土のうを 運んだ。 近所の おばあさんに 感謝された。", "You carried sandbags; a neighbor thanked you.", "搬了沙袋，邻居奶奶向你道谢。", "모래주머니를 날랐어요. 이웃 할머니가 고마워했어요."))]),
        C(N("それでも 出かける", "Go out anyway", "还是出门", "그래도 나간다"), [O(1, {mp: -8, hp: -12, money: -3000}, N("びしょぬれに なって 後悔した…。", "You got soaked and regretted it…", "淋成落汤鸡，后悔了……", "흠뻑 젖어서 후회했어요…"))])
    ]);
    E("autumn_fes", {fix: 1, wk: [W(10, 15), W(11, 5)]}, N("秋の 祭り", "Autumn festival", "秋日祭典", "가을 축제"),
        N("学園祭・地域の祭り・収穫祭…。 秋は イベントが いっぱい。 どれに 行く？", "School fairs, local festivals, harvest events… autumn is packed. Where to?", "校园祭、地区祭典、丰收节……秋天活动满满。去哪个？", "학교 축제·지역 축제·수확제… 가을은 행사가 가득해요. 어디에 갈까요?"), [
        C(N("実行委員で 運営を てつだう", "Help organize it", "加入执行委员会帮忙", "실행위원으로 운영을 돕는다"), [O(1, {soc: 6, chm: 2, skl: 2, hp: -8, mp: 4}, N("裏方の たいへんさと 達成感を 知った。", "You learned the toil and joy behind the scenes.", "体会到幕后的辛苦与成就感。", "무대 뒤의 고생과 성취감을 알았어요."))]),
        C(N("出店で 稼ぐ", "Run a stall to earn", "摆摊赚钱", "가게를 열어 번다"), [O(1, {money: 18000, hp: -7, soc: 3}, N("焼き芋が 大ヒット！ 売り切れた。", "The roasted sweet potatoes sold out!", "烤红薯大热卖！全部卖光了。", "군고구마가 대히트! 다 팔렸어요."))]),
        C(N("ふつうに 遊びに 行く", "Just go and play", "单纯去玩", "그냥 놀러 간다"), [O(1, {mp: 12, money: -3500, soc: 2}, N("食べ歩き・ゲーム・ライブ。 満喫した。", "Snacks, games, shows. You enjoyed it all.", "边逛边吃、游戏、演出。玩得尽兴。", "먹거리·게임·공연. 만끽했어요."))])
    ]);
    E("halloween", {fix: 1, wk: [W(10, 25), W(11, 2)]}, N("ハロウィンの 夜", "Halloween night", "万圣节之夜", "핼러윈의 밤"),
        N("街に 仮装した 人が いっぱい。 {ken}から 「ゾンビの メイクして 集合な！」と 連絡が。", "The streets are full of costumes. {ken}: \"Zombie makeup, meet up!\"", "街上全是变装的人。{ken}发来消息：“化僵尸妆集合！”", "거리에 분장한 사람이 가득해요. {ken}이(가) \"좀비 분장하고 집합!\" 하고 연락했어요."), [
        C(N("全力で 仮装する", "Go all-out with a costume", "全力变装", "전력으로 분장"), [O(1, {chm: 3, mp: 12, money: -4000, soc: 3, fame: 400}, N("SNSに 載せたら ちょっと バズった。", "Posted it, and it got a bit of buzz.", "发到SNS上小小火了一把。", "SNS에 올렸더니 조금 화제가 됐어요."))]),
        C(N("ふつうの 服で 参加", "Join in normal clothes", "穿便服参加", "평상복으로 참가"), [O(1, {mp: 8, money: -2000, soc: 2}, N("みんなの 仮装を 見て 笑いっぱなし。", "You laughed at everyone's costumes all night.", "看着大家的变装笑个不停。", "다들 분장한 걸 보고 계속 웃었어요."))]),
        C(N("家で 映画ナイト", "Movie night at home", "在家看电影", "집에서 영화의 밤"), [O(1, {mp: 10, hp: 6, money: -1200}, N("ポップコーンと ホラー映画。 これも ハロウィン。", "Popcorn and a horror movie. Also Halloween.", "爆米花加恐怖片。这也是万圣节。", "팝콘과 호러 영화. 이것도 핼러윈."))])
    ]);
    E("bonus", {fix: 1, wk: [W(12, 5), W(12, 18)], need: function(S){ return full(S) && S.jobWk >= 12; }}, N("冬の ボーナス", "Winter bonus", "冬季奖金", "겨울 보너스"),
        N("初めての ボーナスが 振り込まれた！ 通帳を 何度も 見てしまう。", "Your first bonus has landed! You keep checking your balance.", "第一笔奖金到账了！忍不住一遍遍看存折。", "첫 보너스가 입금됐어요! 통장을 몇 번이나 확인해요."), [
        C(N("貯金する", "Save it", "存起来", "저금한다"), [O(1, {money: 90000, mp: 4, knw: 1}, N("安心の ひびき。 将来の 自分に プレゼント。", "A reassuring sound. A gift to your future self.", "安心的感觉。给未来的自己的礼物。", "안심되는 느낌. 미래의 나에게 주는 선물."))]),
        C(N("家族に プレゼント", "Gift something to family", "给家人买礼物", "가족에게 선물"), [O(1, {money: 50000, mp: 10, rel: {mom: 10, gpa: 6}}, N("「大きくなったねぇ」と 涙ぐまれた。", "\"You've grown,\" they said, teary-eyed.", "“你长大了呀”，家人眼眶湿润。", "\"많이 컸구나\" 하며 눈시울이 붉어졌어요."))]),
        C(N("自分に ごほうび", "Treat yourself", "犒劳自己", "나에게 선물"), [O(1, {money: 40000, mp: 18, chm: 2}, N("ずっと ほしかった 物を 買った！", "You bought what you'd wanted forever!", "买了一直想要的东西！", "계속 갖고 싶던 걸 샀어요!"))])
    ]);
    E("bonus_part", {fix: 1, wk: [W(12, 5), W(12, 18)], need: function(S){ return S.job && !full(S) && S.jobWk >= 20; }}, N("店長からの 気持ち", "A thank-you from your boss", "店长的心意", "점장의 마음"),
        N("「いつも ありがとう。これ、寸志。」 封筒が わたされた。", "\"Thanks for everything. Here's a little something.\" An envelope is handed over.", "“一直谢谢你。这是一点心意。”递来了一个信封。", "\"항상 고마워. 이거 약소하지만.\" 봉투를 건네받았어요."), [
        C(N("ありがたく うけとる", "Accept gratefully", "感激地收下", "감사히 받는다"), [O(1, {money: 20000, mp: 8, soc: 1}, N("見てくれている 人が いた。 それだけで うれしい。", "Someone was watching. That alone is a joy.", "有人在看着你。光是这样就很开心。", "지켜봐 주는 사람이 있었어요. 그것만으로 기뻐요."))])
    ]);
    E("bonenkai", {fix: 1, wk: [W(12, 15), W(12, 26)]}, N("忘年会", "Year-end party", "年终聚会", "송년회"),
        N("今年も おつかれさま会。 まわりは どんどん 注がれている。 ビール？ ソフトドリンク？", "The year-end party. Drinks are flowing all around. Beer? Or a soft drink?", "今年也有慰劳聚会。周围的人都在不停地被劝酒。啤酒？还是软饮料？", "올해도 수고했다는 송년회. 주변에선 술이 계속 오가요. 맥주? 음료수?"), [
        C(N("ビールで かんぱい", "Cheers with a beer", "用啤酒干杯", "맥주로 건배"), [O(1, {mp: 10, soc: 5, drk: 6, hlt: -2.5, money: -5000, hp: -6}, N("盛りあがった！ …が 翌朝が こわい。", "A blast! …but tomorrow morning looms.", "气氛热烈！……但第二天早上有点可怕。", "신났어요! …하지만 다음 날 아침이 무서워요."))]),
        C(N("ソフトドリンクで 参加", "Join with a soft drink", "用软饮料参加", "음료수로 참가"), [O(1, {mp: 7, soc: 3, money: -3500, chm: 1}, N("自分の ペースで 楽しめた。 無理しないのも 大人。", "You enjoyed it at your pace. Not forcing it is adult too.", "按自己的节奏玩得开心。不勉强也是成熟。", "내 페이스로 즐겼어요. 무리하지 않는 것도 어른이에요."))]),
        C(N("今回は 欠席する", "Skip it this time", "这次缺席", "이번엔 결석"), [O(1, {mp: 3, hp: 8, soc: -2}, N("一人の 夜。 それも 悪くない。", "A quiet night alone. Not bad either.", "一个人的夜晚。也不坏。", "혼자 보내는 밤. 그것도 나쁘지 않아요."))])
    ]);
    E("newyear_eve", {fix: 1, wk: [50, 50]}, N("大みそか", "New Year's Eve", "除夕夜", "섣달그믐"),
        N("もうすぐ 一年が おわる。 去年の 今ごろの 自分と くらべて、どう変わっただろう。", "The year is almost over. How have you changed since this time last year?", "一年即将结束。和去年这个时候的自己相比，有什么变化？", "곧 일 년이 끝나요. 작년 이맘때의 나와 비교하면 얼마나 변했을까요."), [
        C(N("{ken}たちと 年越し", "Ring in the year with {ken} & co.", "和{ken}他们一起跨年", "{ken} 일행과 새해맞이"), [O(1, {mp: 14, soc: 3, money: -3000, rel: {ken: 5}}, N("カウントダウンで 叫んだ！", "You screamed during the countdown!", "倒数时大声喊了出来！", "카운트다운에 소리 질렀어요!"))]),
        C(N("実家で 年越しそば", "Toshikoshi soba at home", "在老家吃跨年荞麦面", "본가에서 해넘이 소바"), [O(1, {mp: 14, hp: 10, money: -1500, rel: {mom: 8, gpa: 4}}, N("除夜の鐘を 聞きながら そばを すすった。", "You slurped soba to the sound of temple bells.", "听着除夕钟声吃荞麦面。", "제야의 종소리를 들으며 소바를 먹었어요."))]),
        C(N("ひとり ふり返りノート", "A solo reflection note", "独自写回顾笔记", "혼자 돌아보는 노트"), [O(1, {knw: 2, mp: 8, skl: 1}, N("この一年で 得たものを 書き出した。", "You wrote down what this year gave you.", "写下了这一年的收获。", "이 한 해에 얻은 것을 적었어요."))])
    ]);
    E("last_week", {fix: 1, wk: [51, 51]}, N("21歳に なる朝", "The morning you turn 21", "迎来21岁的早晨", "21살이 되는 아침"),
        N("1月。 20歳の 冒険が おわる。 {me}の 一年は…？ 最後に 誰かに 「ありがとう」を 伝えよう。", "January. Your 20-year-old adventure ends. How was your year? Say thanks to someone.", "一月。20岁的冒险即将结束。{me}的这一年……？最后对某个人说一声“谢谢”吧。", "1월. 20살의 모험이 끝나요. {me}의 일 년은…? 마지막으로 누군가에게 \"고마워\"를 전해요."), [
        C(N("{mom}に 電話する", "Call {mom}", "给{mom}打电话", "{mom}에게 전화"), [O(1, {mp: 12, rel: {mom: 8}}, N("「元気そうで よかった」 それだけで 胸が いっぱい。", "\"Glad you sound well.\" That alone fills your heart.", "“听起来很精神，太好了”。光是这句话心里就满满的。", "\"잘 지내는 것 같아서 다행이다\" 그것만으로 가슴이 벅차요."))]),
        C(N("{ken}に メッセージ", "Message {ken}", "给{ken}发消息", "{ken}에게 메시지"), [O(1, {mp: 12, rel: {ken: 8}}, N("「こちらこそ！ 来年も よろしく」", "\"Same to you! Let's keep it up next year.\"", "“我才要谢谢你！明年也请多关照”", "\"나야말로! 내년에도 잘 부탁해\""))]),
        C(N("{sak}か{misa}に 気持ちを 伝える", "Tell {sak} or {misa} how you feel", "向{sak}或{misa}表达心意", "{sak} 또는 {misa}에게 마음을 전한다"), [O(1, {mp: 10, rel: {sak: 5, misa: 5}}, N("言えた。 返事は…まだ 秘密。", "You said it. The answer… is still a secret.", "说出口了。回答……还是秘密。", "말했어요. 대답은… 아직 비밀."))])
    ]);
})();
