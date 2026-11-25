"use strict";
/* 20歳の冒険：エンディング・実績 */
(function(){
    var AD = window.AD || globalThis.AD, N = AD.N;
    var EN = function(id, kind, pri, em, g, n, d, t){ var e = {id: id, kind: kind, pri: pri, em: em, g: g, n: n, d: d, t: t || function(){ return false; }}; AD.ENDS.push(e); AD.ENDMAP[id] = e; };
    var full = function(S){ return S.job && AD.JOBMAP[S.job].tier === "full"; };
    var nvis = function(S){ return Object.keys(S.vis).length; };

    // ---- とちゅうで おわる ----
    EN("bankrupt", "crisis", 0, "💸", "bad", N("借金の 沼", "Drowning in Debt", "债务的泥沼", "빚의 늪"),
        N("支払いが おいつかず、生活が 立ちゆかなくなった。 {mom}が 迎えに来てくれた。「いっしょに やり直そう」――どん底の 一年も、きっと 人生の 一部になる。", "You couldn't keep up with payments, and life fell apart. {mom} came to pick you up. \"Let's start over together.\" Even a rock-bottom year becomes part of your life.", "还不上账，生活难以为继。{mom}来接你了。“一起重新来过吧”——即使是谷底的一年，也会成为人生的一部分。", "결제를 감당하지 못해 생활이 무너졌어요. {mom}이(가) 데리러 왔어요. \"같이 다시 시작하자\" 바닥을 친 한 해도 인생의 일부가 될 거예요."));
    EN("hospital", "crisis", 0, "🏥", "bad", N("入院と ゆっくりの 再出発", "Hospital & a Slow Restart", "住院与缓慢的重新出发", "입원과 느린 재출발"),
        N("体が 限界を こえて、長い入院に。 ベッドの上で はじめて 自分の 生活を ふり返った。 健康は、すべての 土台だった。", "Your body hit its limit and you were hospitalized for a long time. In bed, you reflected on your life for the first time. Health was the foundation of everything.", "身体超出极限，住了很长时间的院。躺在病床上，你第一次回顾自己的生活。健康是一切的基础。", "몸이 한계를 넘어 오래 입원하게 됐어요. 침대 위에서 처음으로 생활을 돌아봤어요. 건강이 모든 것의 바탕이었어요."));
    EN("burnout", "crisis", 0, "🕯️", "bad", N("燃えつきて 実家へ", "Burned Out, Back Home", "精疲力竭回老家", "번아웃, 본가로"),
        N("心が 動かなくなって、いったん 実家へ 帰ることに。 {mom}の 味噌汁を 飲んだら、涙が 出た。 休むことも 冒険の 一部。", "Your heart stopped moving, and you went back home for a while. Mom's miso soup made you cry. Resting is part of the adventure.", "内心失去了动力，暂时回了老家。喝到妈妈做的味噌汤，眼泪流了出来。休息也是冒险的一部分。", "마음이 움직이지 않아 잠시 본가로 돌아왔어요. 엄마의 된장국을 먹다가 눈물이 났어요. 쉬는 것도 모험의 일부예요."));

    // ---- 1年を おえて ----
    EN("ceo", "final", 1, "🚀", "great", N("夢の 起業・社長に！", "Founder & CEO!", "创业成功·当上社长！", "꿈의 창업·대표가 되다!"),
        N("{ken}と はじめた 事業が 軌道に のった。 21歳の 社長。 肩書きより うれしいのは、仲間と 笑いあえる 毎日。 冒険は ここから だ！", "The business you started with {ken} took off. A 21-year-old CEO. More than the title, you love laughing with your team every day. The adventure starts here!", "和{ken}一起开创的事业步入正轨。21岁的社长。比头衔更开心的是每天和伙伴们欢笑。冒险从这里开始！", "{ken}와(과) 시작한 사업이 궤도에 올랐어요. 21살 대표. 직함보다 기쁜 건 동료와 웃는 매일. 모험은 이제부터!"),
        function(S){ return !!S.flags.startup_ok; });
    EN("legend", "final", 2, "🌈", "great", N("全部そろった 一年（かくしエンド）", "Having It All (secret)", "样样俱全的一年（隐藏结局）", "모든 걸 갖춘 한 해(숨은 엔딩)"),
        N("知識も 魅力も 技術も 人脈も、体も 心も お財布も――ぜんぶ バランスよく 育った 理想の 一年。 まわりから 「どうやったの？」と 聞かれるように なった。", "Knowledge, charm, skill, connections, body, mind, and wallet — everything grew in balance. People now ask, \"How did you do it?\"", "知识、魅力、技术、人脉、身体、心灵、钱包——全都均衡成长的理想一年。身边人开始问你：“你是怎么做到的？”", "지식도 매력도 기술도 인맥도, 몸도 마음도 지갑도 — 전부 균형 있게 자란 이상적인 한 해. 주변에서 \"어떻게 한 거야?\"라고 물어요."),
        function(S){ return S.knw >= 45 && S.chm >= 45 && S.skl >= 45 && S.soc >= 45 && S.hlt >= 70 && S.mp >= 60 && S.money >= 200000; });
    EN("streamer", "final", 3, "📺", "great", N("人気クリエイター・配信者", "Popular Streamer", "人气创作者·主播", "인기 크리에이터"),
        N("フォロワーが 10万人を こえた。 画面の むこうの 「ありがとう」に 支えられた 一年。 {noa}と 笑いながら、次の 企画を ねっている。", "Over 100,000 followers. A year carried by thank-yous from beyond the screen. You're brainstorming the next project with Noa, laughing.", "粉丝突破了10万。被屏幕那头的“谢谢”支撑着的一年。你正和{noa}笑着策划下一个企划。", "팔로워가 10만 명을 넘었어요. 화면 너머의 \"고마워요\"가 지탱해 준 한 해. {noa}와(과) 웃으며 다음 기획을 짜고 있어요."),
        function(S){ return S.fame >= 100000; });
    EN("lover_misa", "final", 4, "💞", "great", N("一生の 相手と 出会った（幼なじみ）", "A Love for a Lifetime (childhood friend)", "遇见一生的伴侣（青梅竹马）", "평생의 인연(소꿉친구)"),
        N("ずっと そばに いた {misa}と、いつのまにか 同じ 未来を 見ていた。 「来年も 花火 見ようね」 ――その約束は、もう 当たりまえの 日常。", "{misa} was always by your side, and you ended up looking at the same future. \"Let's watch the fireworks again next year\" — that promise is already part of everyday life.", "一直在身边的{misa}，不知不觉间和你望向了同一个未来。“明年也一起看烟火吧”——这个约定已经成了理所当然的日常。", "늘 곁에 있던 {misa}와(과) 어느새 같은 미래를 보고 있었어요. \"내년에도 불꽃놀이 보자\" 그 약속은 이제 당연한 일상이에요."),
        function(S){ return !!S.flags.lover_misa && S.rel.misa >= 80; });
    EN("lover_sak", "final", 4, "🌸", "great", N("運命の 人と 出会った（サクラ）", "A Fateful Meeting (Sakura)", "命中注定的人（樱）", "운명의 사람(사쿠라)"),
        N("春の電車で 話しかけられた {sak}と、季節を 4つ 一緒に 過ごした。 あの日 勇気を出して よかった。 もうすぐ 2度目の さくらが 咲く。", "You spent all four seasons with {sak}, who spoke to you on that spring train. Good thing you were brave that day. A second cherry-blossom season will soon bloom.", "春天电车上向你搭话的{sak}，和你一起度过了四个季节。那天鼓起勇气真是太好了。第二个樱花季就要开了。", "봄 전철에서 말을 걸어 준 {sak}와(과) 네 계절을 함께 보냈어요. 그날 용기 내길 잘했어요. 곧 두 번째 벚꽃이 피어요."),
        function(S){ return !!S.flags.lover_sak && S.rel.sak >= 80; });
    EN("bigcorp", "final", 5, "🏆", "great", N("憧れの 大企業へ", "Dream Big-Company Job", "进入梦想中的大企业", "동경하던 대기업으로"),
        N("面接を 乗りこえて 手に入れた 内定。 スーツの 袖を とおす 朝、少しだけ 緊張して、少しだけ 誇らしかった。 安定と 挑戦の 両方が 待っている。", "The offer you won through interviews. Slipping into the suit that morning, you felt a little nervous and a little proud. Both stability and challenge await.", "闯过面试拿到的录用通知。穿上西装的那个早晨，有点紧张，也有点自豪。稳定与挑战都在等着你。", "면접을 넘어 얻은 내정. 정장 소매를 꿰는 아침, 조금 긴장되고 조금 자랑스러웠어요. 안정과 도전이 모두 기다리고 있어요."),
        function(S){ return !!S.flags.offer_big; });
    EN("debut", "final", 6, "🎤", "great", N("クリエイターとして デビュー", "Creator Debut", "以创作者身份出道", "크리에이터로 데뷔"),
        N("コツコツ 作りつづけた 作品が 認められ、デビューが 決まった。 夜中に ひとり 作っていた あの時間は、ムダじゃ なかった。", "Your steadily made work was recognized and your debut is set. Those late nights alone weren't wasted.", "坚持创作的作品得到认可，决定出道了。深夜独自创作的那些时光，没有白费。", "꾸준히 만든 작품이 인정받아 데뷔가 결정됐어요. 한밤중에 혼자 만들던 그 시간은 헛되지 않았어요."),
        function(S){ return !!S.flags.debut; });
    EN("world", "final", 7, "🌏", "great", N("旅する 冒険家", "Adventurer of the Roads", "旅行冒险家", "여행하는 모험가"),
        N("日本の 北から 南、そして 海の向こうまで。 見た景色の 数だけ 世界が 広がった。 次の 一年は どこへ 行こう？ 地図は まだ まっ白だ。", "From north to south, and across the sea. Your world grew with every view. Where next year? The map is still blank.", "从日本的北到南，再到海的另一边。看过多少风景，世界就扩大了多少。明年去哪里？地图还是一片空白。", "일본의 북쪽에서 남쪽, 그리고 바다 너머까지. 본 풍경만큼 세계가 넓어졌어요. 내년엔 어디로? 지도는 아직 하얗네요."),
        function(S){ return nvis(S) >= 8; });
    EN("license", "final", 8, "📜", "good", N("資格で 独立の 一歩", "Licensed & Independent", "凭资格迈向独立", "자격증으로 독립의 한 걸음"),
        N("勉強を 積みかさねて 手に入れた 資格。 肩書きが ひとつ ふえただけで、世界の 見え方が 変わった。 自分の 名前で 仕事を 受ける日も 遠くない。", "The qualification you earned through study. One new title changed how the world looks. The day you take work under your own name isn't far.", "积累学习换来的资格证书。只是多了一个头衔，世界在眼中的样子就变了。用自己的名字接工作的日子不远了。", "공부를 쌓아 얻은 자격증. 직함 하나가 늘었을 뿐인데 세상이 달라 보여요. 내 이름으로 일을 받을 날도 멀지 않아요."),
        function(S){ return !!S.flags.license && S.knw >= 55; });
    EN("heir", "final", 9, "🏡", "good", N("家業を つぐ 決意", "Taking Over the Family Shop", "决心继承家业", "가업을 잇기로 결심"),
        N("{gpa}の 店で 毎日 暖簾を あげるうち、この場所と 人たちが 大好きだと 気づいた。 地元で 生きる。 それは 逃げじゃなく、立派な 冒険だ。", "Raising the shop curtain every day at Grandpa's, you realized you love this place and these people. Living in your hometown isn't running away — it's a real adventure.", "每天在{gpa}的店里挂起门帘，你发现自己深爱着这个地方和这里的人。在家乡生活，不是逃避，而是了不起的冒险。", "{gpa}의 가게에서 매일 포렴을 걸다 보니 이곳과 사람들이 정말 좋다는 걸 깨달았어요. 고향에서 사는 건 도피가 아니라 멋진 모험이에요."),
        function(S){ return !!S.flags.heir_commit && S.rel.gpa >= 65; });
    EN("scholar", "final", 10, "🔬", "good", N("学びを 極める 道へ", "Path of the Scholar", "钻研学问之路", "배움을 파고드는 길"),
        N("知りたい という 気持ちが ずっと 止まらなかった。 大学院や 研究の 道に 進む 決意を した。 「勉強って こんなに おもしろかったんだ」", "Your curiosity never stopped. You decided to pursue graduate study and research. \"Studying was this fun all along.\"", "求知的心情一直没有停下。你决定走上研究生院和研究之路。“原来学习这么有趣”。", "알고 싶은 마음이 멈추지 않았어요. 대학원과 연구의 길로 나아가기로 결심했어요. \"공부가 이렇게 재밌었구나\""),
        function(S){ return S.knw >= 85; });
    EN("network", "final", 11, "🤝", "good", N("人脈の 達人", "Master of Connections", "人脉达人", "인맥의 달인"),
        N("気づけば スマホの 連絡先は 人であふれていた。 「{me}に 聞けば 誰かを 紹介してくれる」 ――そう 言われる 存在に。 つながりは 最強の 資産だ。", "Your contacts overflowed with people. \"Ask {me} — they'll introduce you to someone.\" Connections turned out to be your greatest asset.", "回过神来，手机通讯录里全是人。“问{me}的话，他会帮你介绍认识的人”——你成了这样的存在。人脉是最强的资产。", "정신 차려 보니 연락처가 사람들로 가득했어요. \"{me}에게 물어보면 누군가를 소개해 줘\" — 그런 존재가 됐어요. 인맥은 최강의 자산이에요."),
        function(S){ return S.soc >= 85; });
    EN("athlete", "final", 12, "💪", "good", N("体づくりの 鬼", "Fitness Beast", "健身狂人", "몸 만들기의 귀신"),
        N("毎週の トレーニングが 習慣に。 体も 心も 見ちがえるほど 強くなった。 階段が ぜんぜん つらくない。 次は 大会に 出てみようかな。", "Weekly training became a habit. Body and mind grew impressively strong. Stairs are no longer a struggle. Maybe you'll enter a competition next.", "每周的训练成了习惯。身心都强壮得判若两人。爬楼梯完全不觉得累。接下来要不要去参加比赛呢。", "매주 하는 트레이닝이 습관이 됐어요. 몸도 마음도 몰라보게 강해졌어요. 계단이 전혀 힘들지 않아요. 다음엔 대회에 나가 볼까요."),
        function(S){ return (S.cnt.gym || 0) >= 22 && S.hlt >= 88; });
    EN("richsave", "final", 13, "💰", "good", N("コツコツ 貯金の 一年", "A Year of Steady Saving", "稳扎稳打存钱的一年", "차곡차곡 저금한 한 해"),
        N("通帳の 数字を 見るのが 楽しみに なった。 ムダづかいを 減らして、働いて、貯めて。 地味だけど、いちばん 確実な 冒険。 自由の 選択肢が ふえた。", "Looking at your balance became a joy. Cut waste, work, save. It's plain, but the surest adventure. Your options for freedom grew.", "看存折上的数字成了乐趣。减少浪费、努力工作、攒钱。虽然朴素，却是最可靠的冒险。自由的选择变多了。", "통장 숫자를 보는 게 즐거워졌어요. 낭비를 줄이고 일하고 모았어요. 소박하지만 가장 확실한 모험. 자유의 선택지가 늘었어요."),
        function(S){ return S.money >= 3000000; });
    EN("startup_fail", "final", 14, "🌅", "good", N("起業は 失敗、でも 次へ", "Failed Startup, Next Chapter", "创业失败，但继续前进", "창업은 실패, 그래도 다음으로"),
        N("事業は うまく いかなかった。 でも 得た経験と 仲間は 本物。 「失敗は 経歴だ」 ――ノートの 最初の ページに、次の 計画を 書きはじめた。", "The business didn't work out. But the experience and friends are real. \"Failure is part of the résumé.\" You started writing your next plan on page one.", "事业没能成功。但得到的经验和伙伴是真的。“失败也是履历”——你在笔记本第一页开始写下新的计划。", "사업은 잘 되지 않았어요. 하지만 얻은 경험과 동료는 진짜예요. \"실패도 경력이다\" 노트 첫 페이지에 다음 계획을 쓰기 시작했어요."),
        function(S){ return !!S.flags.startup_fail && !S.flags.startup_ok; });
    EN("quitsmoke", "final", 15, "🌤️", "good", N("たばこを やめた 一年", "The Year You Quit Smoking", "戒烟的一年", "담배를 끊은 한 해"),
        N("先輩に すすめられて 吸いはじめた たばこ。 でも 自分で やめると 決めて、本当に やめた。 空気が おいしい。 「やめられた」は 一生の 自信に なった。", "You started smoking when a senior offered. But you decided to quit, and you really did. The air tastes good. \"I quit\" became lifelong confidence.", "被前辈劝着开始抽烟。但你自己决定戒掉，真的戒掉了。空气真好。“我戒掉了”成为一生的自信。", "선배 권유로 피우기 시작한 담배. 하지만 스스로 끊기로 결심했고 정말 끊었어요. 공기가 맛있어요. \"끊었다\"는 평생의 자신감이 됐어요."),
        function(S){ return !!S.flags.quit_smoke && S.smk < 5; });
    EN("gamble", "final", 16, "🎰", "bad", N("やめどきを 見失った 一年", "A Year of Lost Limits", "找不到收手时机的一年", "그만둘 때를 놓친 한 해"),
        N("「あと1回だけ」が 何十回も つづいた。 気づけば 時間も お金も 溶けていた。 大切なのは、勝つことより 「やめられる 自分」。 まだ やり直せる。 相談できる 窓口も ある。", "\"Just one more\" went on dozens of times. Time and money melted away. What matters isn't winning but being someone who can stop. You can still start over. Help lines exist.", "“再来一次”持续了几十次。回过神来，时间和钱都化为乌有。重要的不是赢，而是“能收手的自己”。还能重新来过。也有可以求助的咨询窗口。", "\"딱 한 번만\"이 수십 번 이어졌어요. 정신 차리니 시간도 돈도 녹아 있었어요. 중요한 건 이기는 것보다 \"그만둘 수 있는 나\". 아직 다시 시작할 수 있어요. 상담 창구도 있어요."),
        function(S){ return S.gam >= 65; });
    EN("drunk", "final", 17, "🍺", "bad", N("お酒に 飲まれた 一年", "Swallowed by Drinking", "被酒精吞噬的一年", "술에 먹힌 한 해"),
        N("楽しいはずの 乾杯が、いつのまにか 習慣に。 朝の だるさと 財布の 軽さに 気づいた 今、お酒との つきあい方を 見直す ときだ。 健康診断の 数字も 気になる。", "What should've been fun cheers became a habit. Noticing the morning fog and a lighter wallet, it's time to rethink your relationship with alcohol. The health-check numbers worry you too.", "本该快乐的干杯，不知不觉成了习惯。注意到早晨的倦怠和变轻的钱包，现在是重新审视与酒相处方式的时候了。体检数据也让人担心。", "즐거워야 할 건배가 어느새 습관이 됐어요. 아침의 나른함과 가벼워진 지갑을 알아챈 지금, 술과의 관계를 돌아볼 때예요. 건강검진 수치도 걱정돼요."),
        function(S){ return S.drk >= 65; });
    EN("lonely", "final", 18, "🌧️", "bad", N("ひとりぼっちの 一年", "A Lonely Year", "孤独的一年", "외로운 한 해"),
        N("気がつけば 誰とも ほとんど 話さない 日々。 でも 連絡は いつでも 取れる。 勇気を出して 「元気？」と 送れば、きっと 誰かが 返してくれる。", "Before you knew it, you hardly spoke to anyone. But you can reach out anytime. If you gather courage and send \"how are you?\", someone will surely reply.", "不知不觉，几乎不和任何人说话的日子。但随时都可以联系。鼓起勇气发一句“最近好吗？”，一定会有人回复你。", "어느새 거의 아무와도 말하지 않는 나날. 하지만 언제든 연락할 수 있어요. 용기 내 \"잘 지내?\" 하고 보내면 분명 누군가 답해 줄 거예요."),
        function(S){ return S.soc < 25 && S.mp < 60; });
    EN("steady", "final", 19, "🏢", "good", N("安定の 正社員ライフ", "Steady Full-Time Life", "稳定的正式员工生活", "안정적인 정규직 생활"),
        N("仕事に なれて、後輩にも 頼られるように。 派手さは ないけれど、毎月の お給料と 週末の たのしみが ある。 これも ひとつの 立派な 20歳の 冒険。", "You've settled in and juniors rely on you. It's not flashy, but there's a monthly paycheck and weekend joys. A fine 20-year-old adventure too.", "熟悉了工作，后辈也开始依赖你。虽不华丽，但有每月的工资和周末的乐趣。这也是一次了不起的20岁冒险。", "일에 익숙해져 후배들도 의지해요. 화려하진 않지만 매달 월급과 주말의 즐거움이 있어요. 이것도 멋진 20살의 모험이에요."),
        function(S){ return full(S) && S.jobWk >= 36 && !!S.flags.promo; });
    EN("free", "final", 20, "🎒", "good", N("自由な 風来坊", "Free Spirit", "自由的流浪者", "자유로운 방랑자"),
        N("肩書きは ないけれど、行きたい所へ 行った。 履歴書には 書けない 思い出が いっぱい。 「何者でも ない」って、ちょっと 最強かも しれない。", "No title, but you went where you wanted. So many memories no résumé can hold. Being \"nobody in particular\" might be a kind of superpower.", "虽然没有头衔，但想去的地方都去了。有很多写不进简历的回忆。“什么都不是”，或许是某种最强状态。", "직함은 없지만 가고 싶은 곳에 갔어요. 이력서에 쓸 수 없는 추억이 가득해요. \"아무것도 아닌 사람\"이라는 건 어쩌면 최강일지도 몰라요."),
        function(S){ return !S.job && nvis(S) >= 4; });
    EN("happy", "final", 21, "☀️", "good", N("小さな しあわせの 一年", "A Year of Small Joys", "小确幸的一年", "작은 행복의 한 해"),
        N("大きな 成功は なかったけれど、笑った 日の 数は きっと 多かった。 友だちと ごはんを 食べて、好きな ことを して。 それが 「いい人生」の かたち。", "No big successes, but the number of days you laughed was surely high. Meals with friends, doing what you love. That's the shape of a good life.", "虽然没有大成功，但笑过的日子一定很多。和朋友吃饭，做自己喜欢的事。这就是“好人生”的样子。", "큰 성공은 없었지만 웃은 날은 분명 많았어요. 친구들과 밥 먹고 좋아하는 일을 하면서. 그게 \"좋은 인생\"의 모습이에요."),
        function(S){ return S.mp >= 70 && S.hlt >= 65; });
    EN("struggle", "final", 20.5, "🌱", "soso", N("もがいた 一年", "A Year of Struggle", "拼命挣扎的一年", "발버둥 친 한 해"),
        N("思いどおりには いかなかった。 でも その分 いろんな失敗を 経験して、自分の 弱さも 強さも 知った。 来年の {me}は、きっと 今より 強い。", "Things didn't go as planned. But you tasted all kinds of failures and learned your own weaknesses and strengths. Next year's you will be stronger.", "事情没有如愿。但也因此经历了各种失败，认识了自己的弱点与强项。明年的{me}一定比现在更强。", "생각대로 되지 않았어요. 하지만 그만큼 여러 실패를 겪으며 내 약함도 강함도 알게 됐어요. 내년의 {me}은(는) 분명 지금보다 강해요."),
        function(S){ return AD.score(S) < 85 || S.money < -50000; });
    EN("ordinary", "final", 99, "🍀", "soso", N("ふつうの、いい一年", "An Ordinary, Good Year", "平凡而美好的一年", "평범하고 좋은 한 해"),
        N("劇的な 事件は ないけれど、一歩ずつ 進んだ 一年。 仕事も 遊びも 勉強も、ちょっとずつ。 そんな 毎日の つみかさねが、未来の {me}を つくっていく。", "No dramatic events, but a year of steady steps. A bit of work, play, and study. Day-by-day accumulations build the future you.", "没有戏剧性的事件，但一步一步前进的一年。工作、玩耍、学习，都一点一点。这样每天的积累，塑造着未来的{me}。", "극적인 사건은 없었지만 한 걸음씩 나아간 한 해. 일도 놀이도 공부도 조금씩. 그런 매일의 쌓임이 미래의 {me}을(를) 만들어요."));

    // ---- 実績 ----
    var AC = function(id, em, n, d, t){ var a = {id: id, em: em, n: n, d: d, t: t}; AD.ACH.push(a); };
    AC("viral1", "🔥", N("はじめての バズ", "First Viral Post", "第一次爆红", "첫 대박"), N("投稿がバズった", "A post went viral", "有帖子爆红了", "게시물이 대박 났어요"), function(S){ return (S.cnt.viral || 0) >= 1; });
    AC("viral3", "🌋", N("バズ職人", "Viral Artisan", "爆红专家", "대박 장인"), N("3回 バズった", "Went viral 3 times", "爆红了3次", "3번 대박"), function(S){ return (S.cnt.viral || 0) >= 3; });
    AC("fame10k", "📈", N("フォロワー1万人", "10K Followers", "1万粉丝", "팔로워 1만 명"), N("フォロワー 10,000人", "10,000 followers", "10,000粉丝", "팔로워 10,000명"), function(S){ return S.fame >= 10000; });
    AC("fame100k", "🏅", N("フォロワー10万人", "100K Followers", "10万粉丝", "팔로워 10만 명"), N("フォロワー 100,000人", "100,000 followers", "100,000粉丝", "팔로워 100,000명"), function(S){ return S.fame >= 100000; });
    AC("trips5", "🧳", N("旅の入口", "Travel Beginner", "旅行入门", "여행 입문"), N("5か所 旅した", "Visited 5 places", "去了5个地方", "5곳 여행"), function(S){ return nvis(S) >= 5; });
    AC("trips10", "🗺️", N("地図ぬりつぶし", "Map Filler", "涂满地图", "지도 채우기"), N("10か所 旅した", "Visited 10 places", "去了10个地方", "10곳 여행"), function(S){ return nvis(S) >= 10; });
    AC("europe", "🗽", N("海を こえた", "Across the Sea", "跨越大海", "바다를 건너다"), N("ヨーロッパへ 行った", "Went to Europe", "去了欧洲", "유럽에 다녀왔어요"), function(S){ return !!S.vis.europe; });
    AC("shifts50", "⏱️", N("働きもの", "Hard Worker", "勤劳的人", "일꾼"), N("シフトを 50回 こなした", "Worked 50 shifts", "完成了50次班", "근무 50회"), function(S){ return (S.cnt.shifts || 0) >= 50; });
    AC("study30", "🎓", N("勉強の鬼", "Study Demon", "学习狂魔", "공부 귀신"), N("30回 勉強した", "Studied 30 times", "学习了30次", "공부 30회"), function(S){ return (S.cnt.study || 0) >= 30; });
    AC("gym30", "🏋️", N("筋トレ習慣", "Gym Habit", "健身习惯", "운동 습관"), N("30回 運動した", "Worked out 30 times", "运动了30次", "운동 30회"), function(S){ return (S.cnt.gym || 0) >= 30; });
    AC("jackpot", "🎰", N("大当たり（でも…）", "Jackpot (but…)", "中大奖（不过……）", "잭팟(하지만…)"), N("パチンコで 大当たりを 引いた", "Hit a pachinko jackpot", "弹珠机中了大奖", "파친코 잭팟"), function(S){ return (S.cnt.jackpot || 0) >= 1; });
    AC("pachiloss", "📉", N("授業料", "Tuition Paid", "学费", "수업료"), N("パチンコで 10万円 以上 負けた", "Lost ¥100,000+ at pachinko", "弹珠机输了10万日元以上", "파친코로 10만 엔 이상 잃었어요"), function(S){ return (S.cnt.pachiNet || 0) <= -100000; });
    AC("clean", "🌿", N("クリーンな 一年", "Clean Year", "健康的一年", "깨끗한 한 해"), N("ギャンブル・お酒・たばこ すべて 低め", "Low gambling, drinking, smoking", "赌博·饮酒·吸烟都很少", "도박·술·담배 모두 낮음"), function(S){ return S.gam < 10 && S.drk < 15 && S.smk < 5; });
    AC("saver", "🐷", N("貯金 30万円", "¥300K Saved", "存款30万", "저금 30만 엔"), N("30万円 以上 ためた", "Saved ¥300,000+", "存了30万日元以上", "30만 엔 이상 저금"), function(S){ return S.money >= 300000; });
    AC("million", "💎", N("ミリオネア", "Millionaire", "百万富翁", "밀리어네어"), N("100万円 以上 ためた", "Saved ¥1,000,000+", "存了100万日元以上", "100만 엔 이상 저금"), function(S){ return S.money >= 1000000; });
    AC("redzone", "🆘", N("どん底から", "From Rock Bottom", "从谷底爬起", "바닥에서"), N("一度 お金が -10万円 以下に なった", "Money once dropped below -¥100,000", "钱一度跌到-10万日元以下", "한때 -10만 엔 이하"), function(S){ return (S.minM || 0) <= -100000; });
    AC("network80", "🤝", N("顔が ひろい", "Well-Connected", "交际广泛", "발이 넓다"), N("人脈 80 以上", "Connections 80+", "人脉80以上", "인맥 80 이상"), function(S){ return S.soc >= 80; });
    AC("health95", "🍎", N("健康優良", "Picture of Health", "健康优秀", "건강 우량"), N("健康 95 以上", "Health 95+", "健康95以上", "건강 95 이상"), function(S){ return S.hlt >= 95; });
    AC("friends", "👯", N("なかよし 3人", "Three Friends", "三个好友", "친한 친구 3명"), N("3人と 仲よし（60以上）", "Three people at 60+", "3人好感度60以上", "3명과 친밀도 60 이상"), function(S){ return ["ken", "misa", "noa", "dai", "aki", "sak", "ryo"].filter(function(k){ return S.rel[k] >= 60; }).length >= 3; });
    AC("family", "🏠", N("親孝行", "Devoted Child", "孝顺", "효도"), N("家族の 絆 80 以上", "Family bond 80+", "家人羁绊80以上", "가족 유대 80 이상"), function(S){ return S.rel.mom >= 80; });
    AC("smart", "🧠", N("博識", "Know-It-All", "博学", "박식"), N("知識 80 以上", "Knowledge 80+", "知识80以上", "지식 80 이상"), function(S){ return S.knw >= 80; });
    AC("charm", "✨", N("魅力全開", "Magnetic", "魅力全开", "매력 폭발"), N("魅力 60 以上", "Charm 60+", "魅力60以上", "매력 60 이상"), function(S){ return S.chm >= 60; });
    AC("skill", "🛠️", N("職人", "Craftsperson", "匠人", "장인"), N("技術 80 以上", "Skill 80+", "技术80以上", "기술 80 이상"), function(S){ return S.skl >= 80; });
    AC("quit", "🚭", N("やめられた", "Quit!", "戒掉了", "끊었다"), N("たばこを やめた", "Quit smoking", "戒烟成功", "담배를 끊었어요"), function(S){ return !!S.flags.quit_smoke; });
    AC("startup", "🚀", N("起業家", "Founder", "创业者", "창업가"), N("起業に ちょうせんした", "Tried a startup", "尝试了创业", "창업에 도전"), function(S){ return !!(S.flags.startup_ok || S.flags.startup_fail); });
    AC("lover", "💞", N("大切な 人", "Someone Special", "重要的人", "소중한 사람"), N("恋人が できた", "Got a partner", "有了恋人", "연인이 생겼어요"), function(S){ return !!(S.flags.lover_misa || S.flags.lover_sak); });
    AC("promo", "🎖️", N("昇進", "Promoted", "晋升", "승진"), N("職場で 昇進・昇給した", "Got a promotion", "在职场晋升加薪", "승진·승급"), function(S){ return !!S.flags.promo; });
    AC("license", "📜", N("資格ゲット", "Qualified", "考到资格证", "자격증 취득"), N("資格に 合格した", "Passed a qualification exam", "通过了资格考试", "자격증 합격"), function(S){ return !!S.flags.license; });
    AC("debut", "🎤", N("デビュー", "Debut", "出道", "데뷔"), N("クリエイターとして デビュー", "Debuted as a creator", "以创作者身份出道", "크리에이터로 데뷔"), function(S){ return !!S.flags.debut; });
    AC("volunteer", "🧹", N("地域の 人気者", "Local Helper", "地区的热心人", "동네 도우미"), N("ボランティアを 5回", "Volunteered 5 times", "做了5次志愿活动", "봉사 5회"), function(S){ return (S.cnt.vol || 0) >= 5; });
    AC("rich_friend", "🍜", N("おごり上手", "Generous", "爱请客", "한턱 잘 내는 사람"), N("友だちに ごちそうした", "Treated friends", "请朋友吃了饭", "친구에게 밥을 샀어요"), function(S){ return !!S.flags.treated; });
    AC("night_owl", "🌙", N("夜型の 創作者", "Night-Owl Creator", "夜猫子创作者", "야행성 창작자"), N("創作を 15回", "Created 15 times", "创作了15次", "창작 15회"), function(S){ return (S.cnt.create || 0) >= 15; });
    AC("poster", "📱", N("投稿マニア", "Post Addict", "发帖狂人", "게시 마니아"), N("30回 投稿", "Posted 30 times", "发了30次帖", "30번 게시"), function(S){ return (S.cnt.posts || 0) >= 30; });
})();
