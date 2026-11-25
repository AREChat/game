"use strict";
/* 20歳の冒険：データ（登場人物・出身・しごと・副業・旅さき・行動） */
(function(){
    var AD = window.AD || globalThis.AD, N = AD.N, O = AD.O, add = AD.add, ri = AD.ri, rnd = AD.rnd;
    AD.TX.me = {ja: "あなた", en: "You", zh: "你", ko: "당신"};
    AD.TX.rent = N("🏠 家賃・スマホ代を はらった", "🏠 Paid rent & phone bill", "🏠 付了房租和手机费", "🏠 월세·통신비 납부");
    AD.TX.smk = N("🚬 たばこ代が かさんでいる", "🚬 Cigarettes are adding up", "🚬 烟钱不断累积", "🚬 담뱃값이 쌓여요");
    AD.TX.debt = N("📉 借金の利息が ついた", "📉 Interest on your debt", "📉 欠款产生了利息", "📉 빚에 이자가 붙었어요");

    // ---- 登場人物 ----
    var CH = [
        {id: "ken", em: "😄", n: N("ケンタ", "Kenta", "健太", "켄타"), role: N("地元の親友", "Hometown best friend", "老家的挚友", "고향 절친")},
        {id: "misa", em: "🙂", n: N("ミサキ", "Misaki", "美咲", "미사키"), role: N("おさななじみ", "Childhood friend", "青梅竹马", "소꿉친구")},
        {id: "dai", em: "😎", n: N("ダイスケ先輩", "Senior Daisuke", "大辅前辈", "다이스케 선배"), role: N("バイト先の先輩", "Senior at work", "打工的前辈", "알바 선배")},
        {id: "ryo", em: "😤", n: N("リョウ", "Ryo", "凉", "료"), role: N("ライバル", "Rival", "对手", "라이벌")},
        {id: "aki", em: "🧑‍🍳", n: N("アキラさん", "Akira", "明哥", "아키라 씨"), role: N("たよれる大人", "Reliable mentor", "可靠的前辈", "믿음직한 어른")},
        {id: "sak", em: "🌸", n: N("サクラ", "Sakura", "樱", "사쿠라"), role: N("気になる人", "Someone special", "在意的人", "마음에 두는 사람")},
        {id: "noa", em: "🎮", n: N("ノア", "Noa", "诺亚", "노아"), role: N("ネットの友達", "Online friend", "网友", "온라인 친구")},
        {id: "mom", em: "👩", n: N("お母さん", "Mom", "妈妈", "엄마"), role: N("家族", "Family", "家人", "가족")},
        {id: "gpa", em: "👴", n: N("おじいちゃん", "Grandpa", "爷爷", "할아버지"), role: N("家業のおじいちゃん", "Grandpa's shop", "爷爷的店", "할아버지의 가게")}
    ];
    CH.forEach(function(c){ AD.CH[c.id] = c; });

    // ---- 出身（スタート）----
    var B = function(id, em, n, d, st, o){ var b = {id: id, em: em, n: n, d: d, st: st, rent: o.rent, food: o.food, allow: o.allow || 0, job: o.job || null, rel: o.rel || {}, flags: o.flags || {}}; return b; };
    AD.reg(AD.BGS, AD.BGMAP, [
        B("univ", "🎓", N("大学生", "College student", "大学生", "대학생"), N("勉強も遊びもこれから。仕送りあり、時間は多め。", "Time to study and play. You get an allowance.", "学习和玩乐都刚开始。有生活费，时间多。", "공부도 놀이도 이제부터. 용돈이 있고 시간이 많아요."),
            {money: 90000, hp: 80, mp: 70, hlt: 85, knw: 40, chm: 25, skl: 15, soc: 35, fame: 150}, {rent: 42000, allow: 40000, rel: {ken: 40, misa: 30}, flags: {student: 1}}),
        B("free", "🛵", N("フリーター", "Part-timer", "自由职业者", "프리터"), N("コンビニのバイトで自由に生きる。お金はカツカツ。", "Living free on a convenience-store job. Money is tight.", "靠便利店打工自由生活。钱很紧。", "편의점 알바로 자유롭게. 돈은 빠듯해요."),
            {money: 110000, hp: 80, mp: 60, hlt: 80, knw: 20, chm: 30, skl: 25, soc: 30, fame: 100}, {rent: 52000, job: "conv", rel: {ken: 45, dai: 30}}),
        B("voc", "🛠️", N("専門学生", "Trade-school student", "专科生", "전문학교 학생"), N("手に職をつける毎日。技術に自信あり。", "Learning a trade. Strong technical skills.", "每天学一技之长。技术有自信。", "기술을 익히는 나날. 기술에 자신 있어요."),
            {money: 70000, hp: 85, mp: 65, hlt: 85, knw: 25, chm: 25, skl: 40, soc: 30, fame: 120}, {rent: 48000, allow: 30000, rel: {ken: 35, ryo: 25}, flags: {student: 1}}),
        B("newbie", "💼", N("上京・社会人1年目", "Rookie in the city", "进京新人社畜", "상경 신입 사원"), N("お給料はあるけど、時間がない。毎週が勝負。", "You have a salary but little time.", "有工资但没时间。每周都是考验。", "월급은 있지만 시간이 없어요."),
            {money: 180000, hp: 70, mp: 60, hlt: 75, knw: 35, chm: 30, skl: 30, soc: 25, fame: 80}, {rent: 62000, job: "office", rel: {aki: 30, ryo: 30}, flags: {employed: 1}}),
        B("home", "🏡", N("地元・家業の手伝い", "Family shop at home", "留在老家帮忙", "고향·가업 돕기"), N("家賃ゼロ。おじいちゃんの店を手伝いながら将来を考える。", "No rent. You help Grandpa's shop and think about the future.", "不用房租。帮爷爷看店，思考将来。", "월세 0. 할아버지 가게를 도우며 미래를 고민해요."),
            {money: 60000, hp: 85, mp: 70, hlt: 90, knw: 25, chm: 25, skl: 25, soc: 45, fame: 60}, {rent: 0, food: 4500, job: "family", rel: {mom: 70, gpa: 60, misa: 35, ken: 40}, flags: {heir: 1}}),
        B("dream", "🌟", N("夢追い人", "Dreamer", "追梦人", "꿈을 쫓는 사람"), N("バイトしながら夢に賭ける。フォロワーは少しだけいる。", "Chasing a big dream between shifts.", "边打工边追梦。有一点点粉丝。", "알바하면서 꿈에 도전. 팔로워가 조금 있어요."),
            {money: 140000, hp: 75, mp: 75, hlt: 80, knw: 30, chm: 35, skl: 35, soc: 20, fame: 800}, {rent: 55000, job: "conv", rel: {noa: 35, ken: 30}, flags: {dreamer: 1}})
    ]);

    // ---- しごと ----
    var J = function(id, em, n, tier, pay, mpc, hpc, gain, req){ return {id: id, em: em, n: n, tier: tier, pay: pay, mp: mpc, hp: hpc, gain: gain || {}, req: req || {}}; };
    AD.reg(AD.JOBS, AD.JOBMAP, [
        J("conv", "🏪", N("コンビニ店員", "Convenience store", "便利店店员", "편의점 알바"), "part", 28000, 3, 4, {soc: .5}),
        J("cafe", "☕", N("カフェ店員", "Café staff", "咖啡店店员", "카페 알바"), "part", 30000, 3, 4, {chm: .8, soc: .4}),
        J("izakaya", "🍶", N("居酒屋", "Izakaya (pub)", "居酒屋", "이자카야"), "part", 34000, 4, 5, {soc: .8, drk: .8}),
        J("delivery", "🚴", N("配達スタッフ", "Delivery rider", "外卖骑手", "배달 라이더"), "part", 38000, 2, 8, {hlt: .3}),
        J("warehouse", "📦", N("倉庫・軽作業", "Warehouse", "仓库轻体力活", "물류 창고"), "part", 35000, 2, 7, {}),
        J("tutor", "📚", N("家庭教師・塾講師", "Tutor", "家教·补习班老师", "과외·학원 강사"), "part", 40000, 4, 3, {knw: 1}, {knw: 35}),
        J("event", "🎪", N("イベントスタッフ", "Event staff", "活动工作人员", "이벤트 스태프"), "part", 32000, 3, 5, {soc: 1}),
        J("apparel", "👕", N("古着屋・アパレル", "Clothing shop", "古着店·服装店", "옷가게"), "part", 30000, 3, 3, {chm: 1}),
        J("hall", "🎰", N("パチンコ店のホール", "Pachinko hall staff", "弹珠机店店员", "파친코 홀 직원"), "part", 38000, 4, 5, {soc: .4, gam: .5, smk: .4}),
        J("family", "🏡", N("家業の手伝い", "Family shop", "家里的店", "가업 돕기"), "part", 25000, 2, 4, {soc: .6}),
        J("office", "🏢", N("事務職（正社員）", "Office clerk (full-time)", "文职（正式员工）", "사무직(정규직)"), "full", 62000, 4, 3, {knw: .4, skl: .3}),
        J("sales", "📈", N("営業職（正社員）", "Sales (full-time)", "销售（正式员工）", "영업직(정규직)"), "full", 72000, 6, 4, {soc: 1, chm: .5}),
        J("it", "💻", N("IT企業（正社員）", "IT company (full-time)", "IT公司（正式员工）", "IT 기업(정규직)"), "full", 85000, 5, 3, {skl: 1}, {skl: 40}),
        J("care", "🧓", N("介護職（正社員）", "Care worker (full-time)", "护理工作（正式员工）", "요양 보호(정규직)"), "full", 56000, 6, 6, {soc: .8, chm: .3}),
        J("factory", "🏭", N("工場（正社員）", "Factory (full-time)", "工厂（正式员工）", "공장(정규직)"), "full", 66000, 3, 7, {skl: .5}),
        J("chef", "🍳", N("調理の見習い", "Apprentice chef", "厨师学徒", "요리 견습생"), "full", 54000, 4, 6, {skl: 1.2})
    ]);
    AD.jobOk = function(S, j){ for(var k in j.req) if(S[k] < j.req[k]) return false; return true; };

    // ---- 副業 ----
    var SD = function(id, em, n, stat, min, base, per, ex){ return {id: id, em: em, n: n, stat: stat, min: min, base: base, per: per, stock: ex ? ex.stock || 0 : 0}; };
    AD.reg(AD.SIDES, AD.SIDEMAP, [
        SD("resale", "📦", N("せどり（フリマで転売）", "Flea-market reselling", "倒卖（二手平台）", "중고 되팔기"), "knw", 0, 3000, 200, {stock: 5000}),
        SD("craft", "🎨", N("ハンドメイド・イラスト販売", "Handmade & illustrations", "手作·插画售卖", "핸드메이드·일러스트"), "skl", 15, 4000, 200),
        SD("write", "✍️", N("ネット記事ライティング", "Web writing", "网络文章写作", "웹 글쓰기"), "knw", 25, 6000, 180),
        SD("video", "🎬", N("動画編集の案件", "Video editing gigs", "视频剪辑接单", "영상 편집 외주"), "skl", 20, 8000, 250),
        SD("code", "💻", N("プログラミングの案件", "Programming gigs", "编程接单", "프로그래밍 외주"), "skl", 35, 15000, 400)
    ]);

    // ---- 旅さき ----
    var D = function(id, em, n, cost, hpc, mp, gain, tag){ return {id: id, em: em, n: n, cost: cost, hp: hpc, mp: mp, gain: gain || {}, tag: tag}; };
    AD.reg(AD.DEST, AD.DESTMAP, [
        D("camp", "⛺", N("山のキャンプ", "Mountain camping", "山中露营", "산 캠핑"), 15000, 6, 20, {hlt: 1}),
        D("tokyo", "🗼", N("東京のまち歩き", "Tokyo city walk", "东京城市漫步", "도쿄 시내 산책"), 18000, 4, 14, {chm: 1}),
        D("fuji", "🗻", N("富士山の日の出", "Mt. Fuji sunrise", "富士山日出", "후지산 일출"), 22000, 10, 22, {hp: 0, hlt: 2}),
        D("kyoto", "⛩️", N("京都ひとり旅", "Solo Kyoto trip", "京都独旅", "교토 혼자 여행"), 25000, 5, 20, {knw: 2}),
        D("osaka", "🐙", N("大阪食べ歩き", "Osaka street food", "大阪吃吃喝喝", "오사카 먹방"), 30000, 5, 22, {soc: 1}),
        D("onsen", "♨️", N("温泉でのんびり", "Hot-spring trip", "泡温泉放松", "온천 여행"), 35000, 0, 24, {hlt: 3}),
        D("island", "🏝️", N("離島のんびり旅", "Remote island", "离岛悠闲游", "섬 여행"), 55000, 5, 26, {hlt: 1}),
        D("okinawa", "🌺", N("沖縄の海", "Okinawa sea", "冲绳的海", "오키나와 바다"), 60000, 5, 26, {chm: 1}),
        D("hokkaido", "❄️", N("北海道の雪まつり", "Hokkaido snow", "北海道雪景", "홋카이도 눈"), 70000, 6, 24, {knw: 1}),
        D("korea", "🇰🇷", N("韓国のカフェ巡り", "Seoul café tour", "韩国咖啡馆巡礼", "서울 카페 투어"), 70000, 5, 24, {chm: 2}),
        D("taiwan", "🏮", N("台湾の夜市", "Taiwan night market", "台湾夜市", "대만 야시장"), 85000, 6, 26, {soc: 2}),
        D("europe", "🗽", N("ヨーロッパ1週間", "A week in Europe", "欧洲一周", "유럽 일주일"), 280000, 8, 35, {knw: 4, chm: 2, soc: 2})
    ]);

    // ---- 行動 ----
    var A = function(id, em, n, d, slots, ex){ var a = {id: id, em: em, n: n, d: d, slots: slots}; for(var k in ex) a[k] = ex[k]; AD.ACTS.push(a); AD.ACTMAP[id] = a; };
    var NOJOB = N("しごとが ない", "No job", "没有工作", "일이 없어요");
    function lines(S, v){ return v[Math.floor(rnd(S) * v.length)]; }
    A("work", "💼", N("はたらく", "Work", "工作", "일하기"), N("お金をかせぐ。", "Earn money.", "赚钱。", "돈을 벌어요."), ["wd", "we"], {
        can: function(S){ return S.job ? null : NOJOB; },
        run: function(S, arg, slot){
            var j = AD.JOBMAP[S.job], senior = 1 + Math.min(.2, S.jobWk * .004), pay = Math.round(j.pay * (slot === "we" ? .85 : 1) * senior * (S.flags.promo ? 1.15 : 1) * (S.flags.promo2 ? 1.15 : 1) * (.94 + rnd(S) * .12) / 100) * 100;
            S.wkWork++; var fx = {money: pay, hp: -j.hp, mp: -j.mp};
            for(var k in j.gain) fx[k] = j.gain[k];
            S.cnt.shifts = (S.cnt.shifts || 0) + 1;
            return {fx: fx, txt: lines(S, [N("今日も シフトを こなした。", "Another shift done.", "又完成了一天的班。", "오늘도 근무를 마쳤어요."), N("お客さんに ありがとうと言われた。", "A customer thanked you.", "客人对你说了谢谢。", "손님이 고맙다고 했어요."), N("時間が ゆっくり流れた…。", "The hours crawled by…", "时间过得好慢……", "시간이 느리게 흘렀어요…")]), ev: AD.actEvent(S, "job", .22)};
        }});
    A("study", "📖", N("勉強する", "Study", "学习", "공부하기"), N("知識が のびる。", "Gain knowledge.", "增加知识。", "지식이 늘어요."), ["wd", "we"], {
        run: function(S){ var g = ri(S, 4, 7) + (S.flags.student ? 2 : 0); S.cnt.study = (S.cnt.study || 0) + 1; return {fx: {knw: g, mp: -4, hp: -3}, txt: lines(S, [N("集中できた！ 頭に入った。", "Focused! It sank in.", "很专注！记住了。", "집중했어요! 머리에 쏙쏙."), N("カフェで はかどった。", "Productive at a café.", "在咖啡馆很有效率。", "카페에서 잘 됐어요.")]), ev: AD.actEvent(S, "study", .14)}; }});
    A("gym", "🏋️", N("筋トレ・運動", "Work out", "健身运动", "운동하기"), N("健康と体力。", "Health & stamina.", "健康和体力。", "건강과 체력."), ["wd", "we"], {
        run: function(S){ S.cnt.gym = (S.cnt.gym || 0) + 1; return {fx: {hlt: 3, chm: 1, mp: 3, hp: -4, money: -600}, txt: lines(S, [N("汗をかいて スッキリ！", "Sweaty and refreshed!", "出了汗好舒畅！", "땀 흘리고 개운해요!"), N("自己ベストを こうしん。", "New personal best.", "刷新了个人纪录。", "개인 최고 기록!")]), ev: AD.actEvent(S, "gym", .12)}; }});
    A("side", "🪙", N("副業", "Side hustle", "副业", "부업"), N("スキルで かせぐ。", "Earn with your skills.", "靠技能赚钱。", "기술로 벌어요."), ["wd", "we"], {
        can: function(S){ return AD.SIDES.some(function(s){ return S[s.stat] >= s.min && S.money >= s.stock; }) ? null : N("できる副業が ない", "No gigs available", "没有能做的副业", "할 수 있는 부업이 없어요"); },
        run: function(S, arg){
            var s = AD.SIDEMAP[arg || "craft"]; if(!s || S[s.stat] < s.min || S.money < s.stock) throw new Error("side not ok");
            var r = .4 + rnd(S) * 1.2, fail = rnd(S) < .12, net = fail ? -s.stock : Math.round((s.base + S[s.stat] * s.per * r) / 100) * 100 - s.stock;
            S.cnt.side = (S.cnt.side || 0) + 1; S.side = s.id;
            return {fx: {money: net, skl: 2, mp: -5, hp: -3}, txt: fail ? N("今回は 案件が とれなかった…。", "No client this time…", "这次没接到单……", "이번엔 의뢰를 못 땄어요…") : N("お客さんから 追加の依頼まで もらった！", "A client even asked for more!", "客户还追加了委托！", "고객이 추가 의뢰까지 줬어요!"), ev: AD.actEvent(S, "side", .12)};
        }});
    A("sns", "📱", N("SNS・動画投稿", "Post online", "发SNS·视频", "SNS·영상 올리기"), N("フォロワーを ふやす。", "Grow followers.", "涨粉。", "팔로워를 늘려요."), ["wd", "we"], {
        run: function(S){
            var base = ri(S, 40, 220), g = Math.round(base * (1 + S.chm / 50) * (1 + Math.log10(1 + S.fame) / 4)), viral = rnd(S) < .035 + S.skl * .0004;
            if(viral){ g *= 12; S.cnt.viral = (S.cnt.viral || 0) + 1; }
            S.cnt.posts = (S.cnt.posts || 0) + 1;
            return {fx: {fame: g, chm: 1, skl: 1, mp: -2}, txt: viral ? N("バズった！！ 通知が とまらない！", "It went viral!! Notifications won't stop!", "爆红了！！通知停不下来！", "대박 났어요!! 알림이 멈추지 않아요!") : lines(S, [N("投稿して 反応を まった。", "Posted and waited for reactions.", "发布后等待反应。", "올리고 반응을 기다렸어요."), N("いいねが ちょっと ふえた。", "A few more likes.", "点赞多了一些。", "좋아요가 조금 늘었어요.")]), ev: AD.actEvent(S, "sns", .22), tag: viral ? "viral" : null};
        }});
    A("create", "🎨", N("創作・ものづくり", "Create", "创作", "창작"), N("技術が のびる。", "Build your skill.", "提升技术。", "기술이 늘어요."), ["wd", "we"], {
        run: function(S){ S.cnt.create = (S.cnt.create || 0) + 1; return {fx: {skl: ri(S, 3, 5), mp: 1, chm: 1, hp: -2}, txt: lines(S, [N("夢中で 手を動かした。", "Lost in making something.", "沉迷于动手创作。", "푹 빠져서 만들었어요."), N("ちょっと 納得のいく ものが できた。", "Made something you're happy with.", "做出了比较满意的作品。", "마음에 드는 걸 만들었어요.")]), ev: AD.actEvent(S, "create", .16)}; }});
    A("rest", "🛌", N("ゆっくり休む", "Rest", "好好休息", "푹 쉬기"), N("体力と気力が 回復。", "Recover HP & MP.", "恢复体力和精力。", "체력과 기력 회복."), ["wd", "we"], {
        run: function(S){ return {fx: {hp: 22, mp: 14, hlt: 1}, txt: lines(S, [N("ぐっすり ねむった。", "Slept like a log.", "睡得很香。", "푹 잤어요."), N("なにもしない 時間も たいせつ。", "Doing nothing matters too.", "什么都不做的时间也很重要。", "아무것도 안 하는 시간도 소중해요.")])}; }});
    A("career", "🧭", N("仕事さがし・進路活動", "Job hunt", "找工作·规划出路", "구직·진로 활동"), N("あたらしい しごとを さがす。", "Look for a new job.", "寻找新工作。", "새 일을 찾아요."), ["wd"], {
        run: function(S){ S.cnt.career = (S.cnt.career || 0) + 1; return {fx: {knw: 1, soc: 1, mp: -3}, txt: N("求人を チェックして、気になる所に 応募してみた。", "You browsed listings and applied.", "浏览招聘信息并投了简历。", "구인 정보를 살펴보고 지원해 봤어요."), ev: "jobhunt"}; }});
    A("network", "🤝", N("交流会・人脈づくり", "Networking", "交流会·拓展人脉", "교류회·인맥 쌓기"), N("人脈が ふえる。", "Grow your network.", "增加人脉。", "인맥이 늘어요."), ["wd"], {
        run: function(S){ S.cnt.network = (S.cnt.network || 0) + 1; return {fx: {soc: 5, chm: 1, money: -2000, mp: -2}, txt: lines(S, [N("名刺代わりに SNSを交換した。", "Swapped social accounts.", "交换了社交账号。", "SNS 계정을 교환했어요."), N("おもしろい人に 会えた。", "Met someone interesting.", "认识了有趣的人。", "재미있는 사람을 만났어요.")]), ev: AD.actEvent(S, "net", .22)}; }});
    A("friends", "🍜", N("友だちと遊ぶ", "Hang out", "和朋友玩", "친구와 놀기"), N("気力が 回復。人脈も。", "Boost MP & friends.", "恢复精力，也增进友谊。", "기력 회복, 인맥도."), ["we"], {
        run: function(S){ var who = ["ken", "misa", "noa"][ri(S, 0, 2)]; S._ctx = who; return {fx: {mp: 14, soc: 3, money: -4000, hp: -3, rel: (function(){ var r = {}; r[who] = 4; return r; })()}, txt: lines(S, [N("ごはん食べて、ゲームして、くだらない話。", "Food, games, silly talk.", "吃饭、打游戏、聊废话。", "밥 먹고 게임하고 수다 떨었어요."), N("カラオケで 歌いまくった！", "Sang our hearts out at karaoke!", "在卡拉OK尽情唱歌！", "노래방에서 신나게 불렀어요!")]), ev: AD.actEvent(S, "friends", .28)}; }});
    A("party", "🍻", N("飲み会", "Drinking party", "聚餐喝酒", "술자리"), N("盛りあがるけど 体に よくない。", "Fun, but rough on your body.", "很热闹但伤身体。", "신나지만 몸에는 안 좋아요."), ["we"], {
        run: function(S){ S.cnt.party = (S.cnt.party || 0) + 1; S._ctx = "party"; return {fx: {mp: 12, soc: 5, hlt: -1.6, drk: 5, money: -6500, hp: -6}, txt: lines(S, [N("みんなで かんぱい！ 話がはずんだ。", "Cheers! The talk flowed.", "大家干杯！聊得很开心。", "다 같이 건배! 이야기꽃이 폈어요."), N("2軒目まで 行ってしまった…。", "We hit a second place…", "居然去了第二摊……", "2차까지 가 버렸어요…")]), ev: AD.actEvent(S, "party", .55)}; }});
    // パチンコ：賭け金は「ゲーム内のコイン（円）」だけ。期待値は わざと マイナス（約0.85）
    var PACH = [[.68, 0], [.14, .5], [.08, 1.5], [.05, 3], [.036, 6], [.014, 20]];
    AD.PACH = PACH;
    A("pachinko", "🎰", N("パチンコ", "Pachinko", "弹珠机", "파친코"), N("大当たりもあるけど、期待値はマイナス。", "Big wins exist, but it loses on average.", "有大奖，但长期是亏的。", "대박도 있지만 평균은 손해예요."), ["we"], {
        can: function(S){ return S.money >= 3000 ? null : N("お金が たりない", "Not enough money", "钱不够", "돈이 부족해요"); },
        run: function(S, arg){
            var bet = arg || 3000; if(S.money < bet) throw new Error("no money");
            var r = rnd(S), m = 0, acc = 0; for(var i = 0; i < PACH.length; i++){ acc += PACH[i][0]; if(r < acc){ m = PACH[i][1]; break; } }
            var net = Math.round(bet * (m - 1)), win = net > 0, fx = {money: net, gam: win ? (m >= 3 ? 7 : 4) : 4, mp: win ? 6 : -8, hp: -3};
            S.cnt.pachi = (S.cnt.pachi || 0) + 1; S.cnt.pachiNet = (S.cnt.pachiNet || 0) + net; if(m >= 6) S.cnt.jackpot = (S.cnt.jackpot || 0) + 1;
            S._ctx = "pachi";
            return {fx: fx, txt: m >= 6 ? N("🎉 大当たり！！ ……でも これは たまたま。", "🎉 JACKPOT!! …but that was luck.", "🎉 大奖！！……不过这只是运气。", "🎉 잭팟!! …하지만 우연일 뿐이에요.") : win ? N("すこし 勝った。やめどきが むずかしい…。", "Won a little. Hard to stop…", "小赢了一点。很难收手……", "조금 땄어요. 그만두기 어려워요…") : lines(S, [N("負けた…。 気づけば 台の前で 数時間。", "Lost… hours in front of the machine.", "输了……不知不觉坐了好几个小时。", "잃었어요… 어느새 몇 시간이 지났어요."), N("今日は ぜんぜん だめだった…。", "Nothing went right today…", "今天完全不行……", "오늘은 영 안 풀렸어요…")]), ev: AD.actEvent(S, "pachi", .5), tag: m >= 6 ? "jackpot" : null};
        }});
    A("trip", "🧳", N("ひとり旅", "Solo trip", "独自旅行", "혼자 여행"), N("冒険の いちばん。お金は かかる。", "The heart of adventure. Costs money.", "冒险的精髓。要花钱。", "모험의 꽃. 돈이 들어요."), ["we"], {
        can: function(S){ return S.money >= AD.DEST[0].cost ? null : N("お金が たりない", "Not enough money", "钱不够", "돈이 부족해요"); },
        run: function(S, arg){
            var d = AD.DESTMAP[arg || "camp"]; if(!d || S.money < d.cost) throw new Error("trip not ok");
            var fx = {money: -d.cost, hp: -d.hp, mp: d.mp, knw: 1}; for(var k in d.gain) fx[k] = (fx[k] || 0) + d.gain[k];
            S.vis[d.id] = 1; S._ctx = d.id;
            return {fx: fx, ex: {cnt: {trips: 1}}, txt: N("{d} へ 出かけた！", "Off to {d}!", "出发去{d}！", "{d}(으)로 떠났어요!"), ev: AD.actEvent(S, "trip", .8), dest: d.id};
        }});
    A("date", "💞", N("デート", "Go on a date", "约会", "데이트"), N("気になる人と 過ごす。", "Spend time with someone special.", "和在意的人共度时光。", "마음에 둔 사람과 시간을 보내요."), ["we"], {
        can: function(S){ return (S.rel.misa >= 30 || S.rel.sak >= 30) ? null : N("まだ 誘える人が いない", "Nobody to ask yet", "还没有能约的人", "아직 부를 사람이 없어요"); },
        run: function(S, arg){
            var who = arg && S.rel[arg] >= 30 ? arg : (S.rel.sak >= S.rel.misa ? "sak" : "misa"); var r = {}; r[who] = 5; S._ctx = who;
            return {fx: {mp: 12, chm: 1, money: -6000, hp: -2, rel: r}, txt: lines(S, [N("{w} と 映画を 見て ごはんを 食べた。", "Movie and dinner with {w}.", "和{w}看了电影吃了饭。", "{w}와(과) 영화 보고 밥 먹었어요."), N("{w} と 散歩して たくさん 話した。", "A long walk and talk with {w}.", "和{w}散步聊了很多。", "{w}와(과) 산책하며 많이 얘기했어요.")]), who: who, ev: AD.actEvent(S, "date", .4)};
        }});
    A("family", "🏠", N("実家に帰る", "Visit home", "回老家", "본가 가기"), N("気力が 回復。お小遣いも。", "Recover, maybe pocket money.", "恢复精力，也许有零花钱。", "기력 회복, 용돈도."), ["we"], {
        run: function(S){ S._ctx = "family"; return {fx: {mp: 12, hp: 8, money: 3000, rel: {mom: 4}}, txt: lines(S, [N("お母さんの ごはんが しみる…。", "Mom's cooking hits the spot…", "妈妈做的饭真暖心……", "엄마 밥이 너무 맛있어요…"), N("実家の ふとんは さいこう。", "Nothing beats the futon at home.", "老家的被子最舒服。", "본가 이불이 최고예요.")]), ev: AD.actEvent(S, "family", .35)}; }});
    A("hobby", "🎧", N("趣味・推し活", "Hobby & fandom", "兴趣·追星", "취미·덕질"), N("気力が 大きく 回復。", "A big MP boost.", "大幅恢复精力。", "기력이 크게 회복돼요."), ["we"], {
        run: function(S){ S._ctx = "hobby"; return {fx: {mp: 12, money: -3000, hp: -2}, txt: lines(S, [N("好きなものに 囲まれた 一日。", "A day with what you love.", "被喜欢的东西包围的一天。", "좋아하는 것에 둘러싸인 하루."), N("ライブで めいっぱい 叫んだ！", "Screamed our lungs out at the show!", "在演唱会上尽情呐喊！", "라이브에서 목청껏 외쳤어요!")]), ev: AD.actEvent(S, "hobby", .22)}; }});
    A("volunteer", "🧹", N("ボランティア", "Volunteer", "志愿活动", "봉사활동"), N("人のために 動く。", "Help your community.", "为他人出力。", "다른 사람을 위해 움직여요."), ["we"], {
        run: function(S){ S._ctx = "vol"; S.cnt.vol = (S.cnt.vol || 0) + 1; return {fx: {soc: 3, chm: 2, mp: 3, knw: 1, hp: -4}, txt: lines(S, [N("地域のイベントを 手伝った。", "Helped with a local event.", "帮忙筹办了地区活动。", "지역 행사를 도왔어요."), N("「ありがとう」が しみた。", "A heartfelt thank-you.", "一句“谢谢”暖到心里。", "\"고마워요\"가 가슴에 남았어요.")]), ev: AD.actEvent(S, "vol", .22)}; }});
    A("outdoors", "🚲", N("散歩・サイクリング", "Walk & cycle", "散步·骑行", "산책·자전거"), N("体と心に やさしい。", "Gentle on mind & body.", "对身心都好。", "몸과 마음에 좋아요."), ["we"], {
        run: function(S){ S._ctx = "out"; return {fx: {hlt: 2, mp: 10, hp: 8, money: -2000}, txt: lines(S, [N("風が 気持ちよかった。", "The breeze felt great.", "风很舒服。", "바람이 시원했어요."), N("知らない 道を 走ってみた。", "Rode down an unfamiliar road.", "骑上了陌生的路。", "모르는 길을 달려 봤어요.")]), ev: AD.actEvent(S, "out", .16)}; }});
})();
