"use strict";
/* 20歳の冒険：画面（スマホ風UI）。しくみは ad-core.js ほか。文章は 4か国語。虫は 出さない。 */
(function(){
    var AD = window.AD, GK = window.GK;
    AD.lang = function(){ return GK.lang(); };
    var $ = function(id){ return document.getElementById(id); };
    var T = {
        ja: {
            sub: "20歳の 1年間を、1週ずつ 自由に すごす。仕事・恋・夢・お金…あなたの 選択で、エンディングが かわる。",
            new: "▶ はじめから", cont: "▶ つづきから（{w}週め）", daily: "📅 きょうの チャレンジ", coll: "🏆 ずかん", how: "📖 あそびかた",
            note: "お酒・たばこ・パチンコの場面が あります（20歳以上）。ゲームの お金は ぜんぶ 架空の コインです。進み具合は この端末の中に 保存されます。",
            howT: "あそびかた",
            howL: ["📅 1年＝52週。 1週ごとに「平日」と「週末」の 行動を 1つずつ えらびます。", "💼 はたらけば お金、勉強すれば 知識、友だちと あそべば 気力が 回復。 体力・気力・健康が 0に ちかづくと ピンチ！", "📩 週のおわりに できごとが 起きます。 えらんだ 答えで 物語が かわります。（⚡は 成功しやすさ）", "💴 お金が 大きく マイナスに なると 借金生活に。 仕事に ずっと 行かないと クビになります。", "🎰 お酒・たばこ・パチンコには ハマると 危険。 パチンコの お金は ゲーム内の コインで、平均では 必ず へります。", "🏆 52週 すぎると エンディング。 27種類！ 出身（スタート）も 6つ。ずかんに 記録されます。"],
            suT: "どんな 20歳で はじめる？", suName: "なまえ", suPh: "あなた", suGo: "▶ この 20歳で はじめる", back: "もどる", start: "スタート ¥{m}",
            calFmt: "{m}月 第{n}週", wk: "{w} / 52 週", slotWd: "平日", slotWe: "週末", pick: "タップして えらぶ", wait: "（先に 平日を えらぼう）", done: "✓ きまり",
            next: "▶ 週を すすめる", nextHint: "平日と 週末の 行動を えらぼう",
            nvHome: "ホーム", nvBank: "おサイフ", nvCon: "れんらく", nvDia: "にっき", nvAch: "じっせき", nvMenu: "メニュー",
            sheetT: "{s}の 行動", trip: "どこへ 行く？", side: "どの 副業を する？", pachi: "いくら かける？（ゲーム内の コイン）", pachiNote: "※ 大当たりも ありますが、平均では 必ず へります。ゲームの コインです。", date: "だれと デート？", cancel: "やめる",
            event: "📩 できごと", chance: "⚡ 成功率 {p}%", ok: "つぎへ", succ: "✨ 成功！", fail: "💦 ざんねん…", weekEnd: "{m}月 第{n}週 の おわり", weekRes: "今週の 収支と 変化",
            jobLine: "💼 {j}（1回 約¥{p}）／ 勤続 {w}週", noJob: "💼 いま しごとが ありません。平日に「仕事さがし」で さがせます。", absent: "⚠️ {n}週 つづけて シフトに 入っていません（{m}週で クビ）", debt: "📉 借金が あります。 利息に ちゅうい！", tip0: "💡 まず「平日」を タップして、行動を えらぼう。",
            minSkill: "必要：{s} {n}以上", needStock: "元手 ¥{n}", visited: "行った", cost: "¥{n}",
            menuT: "メニュー", resume: "▶ つづける", saveTitle: "セーブして タイトルへ", giveUp: "この 1年を あきらめる", giveUpQ: "ほんとうに あきらめますか？（エンディングに なります）", yes: "はい", no: "いいえ",
            endT: "1年の おわり", kindF: "1年を おえて", kindC: "とちゅうで ゲームオーバー", score: "点数 {s}", best: "ベスト {b}", newEnd: "NEW", again: "▶ もういちど", endColl: "🏆 ずかん", toTitle: "タイトルへ", achT: "じっせき", newAch: "新しい 実績",
            cT: "ずかん", cEnd: "エンディング", cAch: "じっせき", cCount: "{a} / {b} 解放", unknown: "？？？", memories: "思い出 {n} / {t}",
            bankT: "おサイフ・ステータス", habits: "くせ（高いと 危険）", conT: "れんらく先", conNone: "まだ だれとも 仲よく なっていません。", diaT: "にっき", diaNone: "まだ 何も ありません。", achTab: "じっせき（いまの 状態）",
            pachiNet: "パチンコの 収支：{n}", scoreNow: "いまの 点数（参考）：{s}", saved: "セーブしました", jobhunt: "求人・面接", lock: "🔒 {w}"
        },
        en: {
            sub: "Spend one year at age 20, week by week. Work, love, dreams, money… your choices shape the ending.",
            new: "▶ New game", cont: "▶ Continue (week {w})", daily: "📅 Daily challenge", coll: "🏆 Collection", how: "📖 How to play",
            note: "Contains drinking, smoking and pachinko scenes (ages 20+). All in-game money is fictional coins. Progress is saved on this device.",
            howT: "How to play",
            howL: ["📅 One year = 52 weeks. Each week, pick one action for the weekdays and one for the weekend.", "💼 Work for money, study for knowledge, hang out to recover mood. If Stamina, Mood or Health nears 0, trouble!", "📩 Events happen at week's end. Your answers change the story. (⚡ = chance of success)", "💴 Deep debt means a hard life. Skip work for weeks and you get fired.", "🎰 Drinking, smoking and pachinko are risky. Pachinko uses in-game coins and always loses on average.", "🏆 After week 52 you get an ending. 27 of them! 6 starting backgrounds. Saved to your Collection."],
            suT: "What kind of 20-year-old are you?", suName: "Name", suPh: "You", suGo: "▶ Start as this", back: "Back", start: "Start ¥{m}",
            calFmt: "Month {m} · Week {n}", wk: "{w} / 52 weeks", slotWd: "Weekdays", slotWe: "Weekend", pick: "Tap to choose", wait: "(choose weekdays first)", done: "✓ Set",
            next: "▶ Advance the week", nextHint: "Choose weekday and weekend actions",
            nvHome: "Home", nvBank: "Wallet", nvCon: "Contacts", nvDia: "Diary", nvAch: "Badges", nvMenu: "Menu",
            sheetT: "{s} action", trip: "Where to?", side: "Which side hustle?", pachi: "How much to bet? (in-game coins)", pachiNote: "※ Big wins exist, but on average you lose. Game coins only.", date: "Date with whom?", cancel: "Cancel",
            event: "📩 Event", chance: "⚡ Success {p}%", ok: "Next", succ: "✨ Success!", fail: "💦 Too bad…", weekEnd: "End of month {m}, week {n}", weekRes: "This week's money & changes",
            jobLine: "💼 {j} (about ¥{p} per shift) · {w} wks on the job", noJob: "💼 No job right now. Use “Job hunt” on weekdays.", absent: "⚠️ No shifts for {n} weeks in a row (fired at {m})", debt: "📉 You are in debt. Watch the interest!", tip0: "💡 Tap “Weekdays” first and choose an action.",
            minSkill: "Needs {s} {n}+", needStock: "Stock ¥{n}", visited: "Visited", cost: "¥{n}",
            menuT: "Menu", resume: "▶ Resume", saveTitle: "Save & go to title", giveUp: "Give up this year", giveUpQ: "Really give up? (It becomes an ending.)", yes: "Yes", no: "No",
            endT: "The year ends", kindF: "After one year", kindC: "Game over mid-year", score: "Score {s}", best: "Best {b}", newEnd: "NEW", again: "▶ Play again", endColl: "🏆 Collection", toTitle: "Title", achT: "Badges", newAch: "New badges",
            cT: "Collection", cEnd: "Endings", cAch: "Badges", cCount: "{a} / {b} unlocked", unknown: "???", memories: "Memories {n} / {t}",
            bankT: "Wallet & stats", habits: "Habits (high is dangerous)", conT: "Contacts", conNone: "You haven't gotten close to anyone yet.", diaT: "Diary", diaNone: "Nothing yet.", achTab: "Badges (current state)",
            pachiNet: "Pachinko net: {n}", scoreNow: "Current score (reference): {s}", saved: "Saved", jobhunt: "Listings & interviews", lock: "🔒 {w}"
        },
        zh: {
            sub: "用一周一周的方式，自由度过20岁的一年。工作、恋爱、梦想、金钱……你的选择决定结局。",
            new: "▶ 新游戏", cont: "▶ 继续（第{w}周）", daily: "📅 每日挑战", coll: "🏆 图鉴", how: "📖 玩法",
            note: "含有饮酒、吸烟、弹珠机场景（20岁以上）。游戏中的钱全是虚构的币。进度保存在本设备中。",
            howT: "玩法",
            howL: ["📅 1年＝52周。每周为“工作日”和“周末”各选一个行动。", "💼 工作赚钱，学习涨知识，和朋友玩恢复精力。体力、精力、健康接近0就危险！", "📩 每周结束会发生事件。你的选择会改变故事。（⚡表示成功几率）", "💴 欠债太多会陷入困境。长期不去上班会被解雇。", "🎰 饮酒、吸烟、弹珠机上瘾很危险。弹珠机用游戏币，平均一定会亏。", "🏆 过了第52周就是结局。共27种！出身有6种。会记录在图鉴里。"],
            suT: "以什么样的20岁开始？", suName: "名字", suPh: "你", suGo: "▶ 以此身份开始", back: "返回", start: "初始 ¥{m}",
            calFmt: "{m}月 第{n}周", wk: "{w} / 52 周", slotWd: "工作日", slotWe: "周末", pick: "点击选择", wait: "（请先选工作日）", done: "✓ 已选",
            next: "▶ 进入下一周", nextHint: "请选择工作日和周末的行动",
            nvHome: "主页", nvBank: "钱包", nvCon: "联系人", nvDia: "日记", nvAch: "成就", nvMenu: "菜单",
            sheetT: "{s}的行动", trip: "去哪里？", side: "做哪种副业？", pachi: "下多少注？（游戏币）", pachiNote: "※ 也有大奖，但平均一定会亏。仅为游戏币。", date: "和谁约会？", cancel: "取消",
            event: "📩 事件", chance: "⚡ 成功率 {p}%", ok: "继续", succ: "✨ 成功！", fail: "💦 可惜……", weekEnd: "{m}月 第{n}周 结束", weekRes: "本周收支与变化",
            jobLine: "💼 {j}（每次约¥{p}）／ 已工作{w}周", noJob: "💼 目前没有工作。工作日可以用“找工作”寻找。", absent: "⚠️ 已连续{n}周没去上班（{m}周会被解雇）", debt: "📉 你有欠款。小心利息！", tip0: "💡 先点“工作日”，选一个行动。",
            minSkill: "需要 {s} {n}以上", needStock: "本金 ¥{n}", visited: "去过", cost: "¥{n}",
            menuT: "菜单", resume: "▶ 继续", saveTitle: "存档并回标题", giveUp: "放弃这一年", giveUpQ: "真的要放弃吗？（会进入结局）", yes: "是", no: "否",
            endT: "一年结束", kindF: "一年之后", kindC: "中途游戏结束", score: "得分 {s}", best: "最高 {b}", newEnd: "NEW", again: "▶ 再玩一次", endColl: "🏆 图鉴", toTitle: "标题", achT: "成就", newAch: "新成就",
            cT: "图鉴", cEnd: "结局", cAch: "成就", cCount: "已解锁 {a} / {b}", unknown: "？？？", memories: "回忆 {n} / {t}",
            bankT: "钱包与状态", habits: "习惯（越高越危险）", conT: "联系人", conNone: "还没有和谁亲近起来。", diaT: "日记", diaNone: "还没有内容。", achTab: "成就（当前状态）",
            pachiNet: "弹珠机盈亏：{n}", scoreNow: "当前得分（参考）：{s}", saved: "已存档", jobhunt: "招聘与面试", lock: "🔒 {w}"
        },
        ko: {
            sub: "스무 살의 1년을 한 주씩 자유롭게. 일·사랑·꿈·돈… 당신의 선택이 엔딩을 바꿉니다.",
            new: "▶ 처음부터", cont: "▶ 이어하기 ({w}주째)", daily: "📅 오늘의 챌린지", coll: "🏆 도감", how: "📖 하는 법",
            note: "음주·흡연·파친코 장면이 있습니다(20세 이상). 게임 속 돈은 모두 가상의 코인입니다. 진행 상황은 이 기기에 저장됩니다.",
            howT: "하는 법",
            howL: ["📅 1년＝52주. 매주 '평일'과 '주말'의 행동을 하나씩 고릅니다.", "💼 일하면 돈, 공부하면 지식, 친구와 놀면 기력 회복. 체력·기력·건강이 0에 가까워지면 위기!", "📩 주가 끝나면 사건이 일어납니다. 고른 답에 따라 이야기가 바뀝니다. (⚡는 성공 확률)", "💴 돈이 크게 마이너스면 빚 생활. 오래 출근하지 않으면 해고됩니다.", "🎰 술·담배·파친코는 빠지면 위험. 파친코는 게임 코인이며 평균적으로 반드시 잃습니다.", "🏆 52주가 지나면 엔딩. 27종류! 출신(시작)도 6가지. 도감에 기록됩니다."],
            suT: "어떤 스무 살로 시작할까?", suName: "이름", suPh: "당신", suGo: "▶ 이 스무 살로 시작", back: "뒤로", start: "시작 ¥{m}",
            calFmt: "{m}월 {n}주차", wk: "{w} / 52 주", slotWd: "평일", slotWe: "주말", pick: "눌러서 고르기", wait: "(먼저 평일을 고르세요)", done: "✓ 결정",
            next: "▶ 한 주 진행", nextHint: "평일과 주말의 행동을 고르세요",
            nvHome: "홈", nvBank: "지갑", nvCon: "연락처", nvDia: "일기", nvAch: "업적", nvMenu: "메뉴",
            sheetT: "{s} 행동", trip: "어디로 갈까?", side: "어떤 부업?", pachi: "얼마를 걸까? (게임 코인)", pachiNote: "※ 대박도 있지만 평균적으로 반드시 잃습니다. 게임 코인입니다.", date: "누구와 데이트?", cancel: "취소",
            event: "📩 사건", chance: "⚡ 성공률 {p}%", ok: "다음", succ: "✨ 성공!", fail: "💦 아쉽다…", weekEnd: "{m}월 {n}주차 종료", weekRes: "이번 주 수지와 변화",
            jobLine: "💼 {j} (1회 약 ¥{p}) / 근속 {w}주", noJob: "💼 지금 일이 없습니다. 평일에 '구직'으로 찾을 수 있어요.", absent: "⚠️ {n}주 연속 출근하지 않았어요 ({m}주에 해고)", debt: "📉 빚이 있습니다. 이자에 주의!", tip0: "💡 먼저 '평일'을 눌러 행동을 고르세요.",
            minSkill: "필요: {s} {n} 이상", needStock: "밑천 ¥{n}", visited: "다녀옴", cost: "¥{n}",
            menuT: "메뉴", resume: "▶ 계속", saveTitle: "저장하고 타이틀로", giveUp: "이번 1년 포기", giveUpQ: "정말 포기할까요? (엔딩이 됩니다)", yes: "예", no: "아니요",
            endT: "1년의 끝", kindF: "1년을 마치고", kindC: "도중에 게임 오버", score: "점수 {s}", best: "최고 {b}", newEnd: "NEW", again: "▶ 다시 하기", endColl: "🏆 도감", toTitle: "타이틀", achT: "업적", newAch: "새 업적",
            cT: "도감", cEnd: "엔딩", cAch: "업적", cCount: "{a} / {b} 해금", unknown: "???", memories: "추억 {n} / {t}",
            bankT: "지갑·상태", habits: "버릇 (높으면 위험)", conT: "연락처", conNone: "아직 아무와도 친해지지 않았어요.", diaT: "일기", diaNone: "아직 아무것도 없어요.", achTab: "업적 (현재 상태)",
            pachiNet: "파친코 수지: {n}", scoreNow: "현재 점수 (참고): {s}", saved: "저장했어요", jobhunt: "구인·면접", lock: "🔒 {w}"
        }
    };
    var t = GK.i18n(T);
    var STAT = {
        ja: {money: "おかね", hp: "体力", mp: "気力", hlt: "健康", knw: "知識", chm: "魅力", skl: "技術", soc: "人脈", fame: "フォロワー", gam: "ギャンブル度", drk: "お酒", smk: "たばこ"},
        en: {money: "Money", hp: "Stamina", mp: "Mood", hlt: "Health", knw: "Knowledge", chm: "Charm", skl: "Skill", soc: "Network", fame: "Followers", gam: "Gambling", drk: "Drinking", smk: "Smoking"},
        zh: {money: "金钱", hp: "体力", mp: "精力", hlt: "健康", knw: "知识", chm: "魅力", skl: "技术", soc: "人脉", fame: "粉丝", gam: "赌瘾", drk: "酒瘾", smk: "烟瘾"},
        ko: {money: "돈", hp: "체력", mp: "기력", hlt: "건강", knw: "지식", chm: "매력", skl: "기술", soc: "인맥", fame: "팔로워", gam: "도박", drk: "음주", smk: "흡연"}
    };
    var ICON = {money: "💴", hp: "❤️", mp: "✨", hlt: "🩺", knw: "📚", chm: "😊", skl: "🛠️", soc: "🤝", fame: "📱", gam: "🎰", drk: "🍶", smk: "🚬"};
    var SEASON = {spring: "🌸", summer: "☀️", autumn: "🍁", winter: "❄️"};
    function L(){ return GK.lang(); }
    function sn(k){ return (STAT[L()] || STAT.ja)[k] || k; }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
    function yen(n){ n = Math.round(n); return (n < 0 ? "−" : "") + "¥" + Math.abs(n).toLocaleString("en-US"); }
    var G = {S: null, last: {}, scr: "title", daily: false, picked: "univ", busy: false};
    function X(n, extra){ if(n == null) return ""; var S = G.S; return AD.txt(S, n, L(), S ? AD.vars(S, L()) : null); }
    var store = GK.save("ad"), SAVE = "are_ad_save_v1";
    function persist(){ try{ if(G.S && !G.S.over) localStorage.setItem(SAVE, JSON.stringify(G.S)); else localStorage.removeItem(SAVE); }catch(_e){} }
    function loadSave(){ try{ var s = JSON.parse(localStorage.getItem(SAVE) || "null"); if(s && s.v === 1 && !s.over && typeof s.week === "number") return s; }catch(_e){} return null; }
    function toast(m, ms){ var e = $("toast"); e.textContent = m; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1800); }
    // コントローラー：モーダルが ひらく／とじる、画面が かわった とき、つぎに おす ボタンに 自動で カーソルを あわせる
    var padRaf = 0;
    function padSync(){
        if(!window.AREPadFocus || !window.GKI || !GKI.padConnected || !GKI.padConnected() || padRaf) return;
        padRaf = requestAnimationFrame(function(){
            padRaf = 0;
            if(document.querySelector(".gki-modal.on") || document.getElementById("ageGate")) return;
            var sc = document.querySelector(".modal.on") || document.querySelector(".scr.on"); if(!sc) return;
            var el = sc.querySelector("[data-pad-first]:not(:disabled)") || sc.querySelector("button.big:not(:disabled)") || sc.querySelector("button:not(:disabled)");
            if(el) AREPadFocus(el);
        });
    }
    function open(id){ $(id).classList.add("on"); padSync(); }
    function close(id){ $(id).classList.remove("on"); padSync(); }

    // ---------- 画面の きりかえ ----------
    function show(id){
        G.scr = id; ["title", "how", "setup", "game", "end", "coll"].forEach(function(k){ $("s-" + k).classList.toggle("on", k === id); });
        document.documentElement.lang = L(); text();
        if(id === "title") title(); else if(id === "setup") buildSetup(); else if(id === "game") renderAll(); else if(id === "coll") buildColl();
        var show2 = id !== "game"; $("lgBtn").style.display = show2 ? "" : "none"; padSync();
    }
    function text(){
        $("tSub").textContent = t("sub"); $("tNote").textContent = t("note"); $("bNew").textContent = t("new"); $("bDaily").textContent = t("daily"); $("bColl").textContent = t("coll"); $("bHow").textContent = t("how");
        $("hT").textContent = t("howT"); $("hBody").innerHTML = (T[L()].howL || T.ja.howL).map(function(x){ return "<p>" + esc(x) + "</p>"; }).join(""); $("bHowBack").textContent = t("back");
        $("suT").textContent = t("suT"); $("suName").textContent = t("suName"); $("nameIn").placeholder = t("suPh"); $("bGo").textContent = t("suGo"); $("bSuBack").textContent = t("back");
        ["Home", "Bank", "Con", "Dia", "Ach", "Menu"].forEach(function(k){ $("nv" + k).textContent = t("nv" + k); });
        $("bAgain").textContent = t("again"); $("bEndColl").textContent = t("endColl"); $("bEndTitle").textContent = t("toTitle");
        $("cT").textContent = t("cT"); $("bCollBack").textContent = t("back"); $("cTabs").children[0].textContent = t("cEnd"); $("cTabs").children[1].textContent = t("cAch");
        $("exitBtn").textContent = "← " + t("back"); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[L()];
    }
    function title(){
        var sv = loadSave(); $("bCont").style.display = sv ? "" : "none"; if(sv) $("bCont").textContent = t("cont", {w: sv.week + 1});
    }

    // ---------- はじめる ----------
    function buildSetup(){
        var h = ""; AD.BGS.forEach(function(b){
            h += '<button type="button" class="bgc' + (b.id === G.picked ? " sel" : "") + '" data-id="' + b.id + '"><span class="em">' + b.em + '</span><b>' + esc(AD.txt(null, b.n)) + '</b><small>' + esc(AD.txt(null, b.d)) + '</small><span class="mini">' + esc(t("start", {m: b.st.money.toLocaleString("en-US")})) + '</span></button>';
        });
        $("bgList").innerHTML = h;
        if(G.daily){ var seed = GK.daySeed(); G.picked = AD.BGS[seed % AD.BGS.length].id; $("bgList").querySelectorAll(".bgc").forEach(function(b){ b.classList.toggle("sel", b.dataset.id === G.picked); b.disabled = b.dataset.id !== G.picked; }); }
        var nm = ""; try{ nm = localStorage.getItem("are_ad_name") || ""; }catch(_e){} if(!$("nameIn").value) $("nameIn").value = nm;
    }
    function startRun(){
        var name = $("nameIn").value.trim(); try{ localStorage.setItem("are_ad_name", name); }catch(_e){}
        var seed = G.daily ? GK.daySeed() : ((Math.random() * 1e9) | 0) + 1;
        G.S = AD.newRun({seed: seed, bg: G.picked, name: name, daily: G.daily}); G.last = {};
        persist(); GK.sfx("ok"); GK.bgm("calm"); show("game"); weekFx();
    }

    // ---------- ゲームの 表示 ----------
    function calLabel(wk){ var c = AD.cal(wk); return SEASON[c.season] + " " + t("calFmt", {m: c.m, n: c.nth}); }
    function chips(d){
        if(!d) return ""; var h = "";
        Object.keys(d).forEach(function(k){
            if(k === "rel"){ for(var id in d.rel){ var v = d.rel[id], c = AD.CH[id]; if(!c) continue; h += '<span class="chip ' + (v > 0 ? "up" : "dn") + '">' + c.em + ' ' + esc(AD.txt(null, c.n)) + ' ' + (v > 0 ? "+" : "") + v + '</span>'; } return; }
            var v2 = d[k], good = (k === "gam" || k === "drk" || k === "smk") ? v2 < 0 : v2 > 0;
            h += '<span class="chip ' + (good ? "up" : "dn") + '">' + ICON[k] + ' ' + esc(sn(k)) + ' ' + (k === "money" ? (v2 > 0 ? "+" : "") + yen(v2) : (v2 > 0 ? "+" : "") + v2.toLocaleString("en-US")) + '</span>';
        });
        return h;
    }
    function renderHud(){
        var S = G.S; if(!S) return;
        $("cal").textContent = calLabel(S.week); $("money").textContent = yen(S.money); $("money").classList.toggle("neg", S.money < 0);
        $("wfill").style.width = Math.min(100, S.week / 52 * 100) + "%"; $("wtxt").textContent = t("wk", {w: S.week + 1});
        [["hp", S.hp], ["mp", S.mp]].forEach(function(p){ $(p[0] + "Fill").style.width = Math.max(0, Math.min(100, p[1])) + "%"; $(p[0] + "Txt").textContent = Math.round(p[1]); $(p[0] + "Fill").closest(".g").classList.toggle("low", p[1] < 22); });
    }
    function actInfo(id){ return AD.ACTMAP[id]; }
    function renderHome(){
        var S = G.S, h = "";
        ["wd", "we"].forEach(function(slot){
            var id = S.slot[slot], a = id && actInfo(id), active = S.phase === slot, lock = !a && !active;
            var cls = "slot" + (a ? " done" : active ? " active" : " lock");
            h += '<button type="button" class="' + cls + '" data-slot="' + slot + '"' + (active ? ' data-pad-first="1"' : '') + '><span class="ic">' + (a ? a.em : slot === "wd" ? "🗓️" : "🎈") + '</span><span class="tx"><div class="nm">' + esc(t(slot === "wd" ? "slotWd" : "slotWe")) + '</div><div class="tt">' + esc(a ? AD.txt(S, a.n) : lock ? t("wait") : t("pick")) + '</div>';
            if(a){ var lr = G.last[slot]; h += '<div class="ds">' + esc(lr && lr.txt ? X(lr.txt) : "") + '</div>' + (lr && lr.d ? '<div class="chips">' + chips(lr.d) + '</div>' : ""); }
            h += '</span></button>';
        });
        $("slots").innerHTML = h;
        var nx = $("bNext"); nx.textContent = S.phase === "end" ? t("next") : t("nextHint"); nx.disabled = S.phase !== "end"; if(S.phase === "end") nx.setAttribute("data-pad-first", "1"); else nx.removeAttribute("data-pad-first");
        // ヒント
        var tip = [];
        if(S.week === 0 && S.phase === "wd") tip.push(t("tip0"));
        if(S.job){ var j = AD.JOBMAP[S.job]; tip.push(t("jobLine", {j: AD.txt(S, j.n), p: j.pay.toLocaleString("en-US"), w: S.jobWk})); var lim = j.tier === "full" ? 3 : 4; if(S.absent >= 1) tip.push(t("absent", {n: S.absent, m: lim})); }
        else tip.push(t("noJob"));
        if(S.money < 0) tip.push(t("debt"));
        $("tip").innerHTML = tip.map(esc).join("<br>");
    }
    function renderBank(){
        var S = G.S, h = '<div class="card"><h3>' + esc(t("bankT")) + '</h3><div style="font-size:26px;font-weight:900;color:var(--gold)">' + yen(S.money) + '</div>';
        if(S.cnt.pachiNet) h += '<div class="hint">' + esc(t("pachiNet", {n: yen(S.cnt.pachiNet)})) + '</div>';
        h += '<div class="hint">' + esc(t("scoreNow", {s: AD.score(S)})) + '</div></div><div class="card">';
        ["hp", "mp", "hlt", "knw", "chm", "skl", "soc"].forEach(function(k){ h += '<div class="srow"><b>' + ICON[k] + ' ' + esc(sn(k)) + '</b><div class="bar"><i style="width:' + Math.max(0, Math.min(100, S[k])) + '%"></i></div><em>' + Math.round(S[k]) + '</em></div>'; });
        h += '<div class="srow"><b>' + ICON.fame + ' ' + esc(sn("fame")) + '</b><em style="width:auto;flex:1">' + Math.round(S.fame).toLocaleString("en-US") + '</em></div></div><div class="card"><h3>' + esc(t("habits")) + '</h3>';
        ["gam", "drk", "smk"].forEach(function(k){ h += '<div class="srow"><b>' + ICON[k] + ' ' + esc(sn(k)) + '</b><div class="bar bad"><i style="width:' + Math.max(0, Math.min(100, S[k])) + '%"></i></div><em>' + Math.round(S[k]) + '</em></div>'; });
        $("tab-bank").innerHTML = h + '</div>';
    }
    function renderContacts(){
        var S = G.S, h = '<div class="card"><h3>' + esc(t("conT")) + '</h3>', n = 0;
        Object.keys(AD.CH).forEach(function(id){
            var c = AD.CH[id], v = S.rel[id]; if(v == null || (v <= 0 && id !== "mom" && id !== "gpa")) return; n++;
            h += '<div class="person"><span class="pe">' + c.em + '</span><div class="pn"><b>' + esc(AD.txt(S, c.n)) + '</b><small>' + esc(AD.txt(S, c.role)) + '</small></div><div style="width:42%"><div class="srow" style="margin:0"><div class="bar"><i style="width:' + Math.min(100, v) + '%"></i></div><em>' + Math.round(v) + '</em></div></div></div><hr style="border:0;border-top:1px solid #ffffff1a">';
        });
        if(!n) h += '<p class="hint">' + esc(t("conNone")) + '</p>';
        $("tab-contacts").innerHTML = h + '</div>';
    }
    function renderDiary(){
        var S = G.S, h = '<div class="card"><h3>' + esc(t("diaT")) + '</h3>';
        var L2 = S.log.slice(-40).reverse(); if(!L2.length) h += '<p class="hint">' + esc(t("diaNone")) + '</p>';
        L2.forEach(function(g){
            var e = AD.EVMAP[g.e], ttl = e ? AD.txt(S, e.title) : t("jobhunt"), ch = e && e.ch[g.c] ? X(e.ch[g.c].t) : "";
            h += '<div class="log"><small>' + esc(calLabel(g.w)) + '</small><br><b>' + esc(ttl) + '</b>' + (ch ? ' → ' + esc(ch) : "") + '</div>';
        });
        $("tab-diary").innerHTML = h + '</div>';
    }
    function renderAch(){
        var S = G.S, got = {}; AD.achieved(S).forEach(function(i){ got[i] = 1; });
        var h = '<div class="card"><h3>' + esc(t("achTab")) + '</h3>';
        AD.ACH.forEach(function(a){ h += '<div class="achi' + (got[a.id] ? "" : " off") + '"><span class="ae">' + (got[a.id] ? a.em : "🔒") + '</span><div><b>' + esc(AD.txt(S, a.n)) + '</b><small>' + esc(AD.txt(S, a.d)) + '</small></div></div>'; });
        $("tab-ach").innerHTML = h + '</div>';
    }
    function renderAll(){ renderHud(); renderHome(); renderBank(); renderContacts(); renderDiary(); renderAch(); if(!document.querySelector(".modal.on")) padSync(); }
    function tab(name){
        ["home", "bank", "contacts", "diary", "ach"].forEach(function(k){ $("tab-" + k).classList.toggle("on", k === name); });
        $("nav").querySelectorAll("button[data-tab]").forEach(function(b){ b.classList.toggle("on", b.dataset.tab === name); });
        GK.sfx("tap");
    }

    // ---------- 行動 ----------
    function sheet(html){ $("sheetBox").innerHTML = html; open("mSheet"); }
    function openSlot(slot){
        var S = G.S; if(G.busy) return;
        if(S.slot[slot]){ toast(t("done")); return; }
        if(S.phase !== slot){ toast(t("wait")); return; }
        var av = AD.avail(S, slot), h = '<h3>' + esc(t("sheetT", {s: t(slot === "wd" ? "slotWd" : "slotWe")})) + '</h3><div class="agrid">';
        av.forEach(function(x){
            var a = actInfo(x.id);
            h += '<button type="button" class="abtn" data-act="' + a.id + '" data-slot="' + slot + '"' + (x.ok ? "" : " disabled") + '><span class="ae">' + a.em + '</span><b>' + esc(AD.txt(S, a.n)) + '</b><small>' + (x.ok ? esc(AD.txt(S, a.d)) : '<span class="why">' + esc(AD.txt(S, x.why)) + '</span>') + '</small></button>';
        });
        sheet(h + '</div><button type="button" id="shClose">' + esc(t("cancel")) + '</button>');
        GK.sfx("tap");
    }
    function pickAct(slot, id){
        var S = G.S, h;
        if(id === "trip"){
            h = '<h3>' + esc(t("trip")) + '</h3>';
            AD.DEST.forEach(function(d){ var ok = S.money >= d.cost; h += '<button type="button" class="listbtn" data-do="' + id + '" data-slot="' + slot + '" data-arg="' + d.id + '"' + (ok ? "" : " disabled") + '><span class="ae">' + d.em + '</span><span class="lt"><b>' + esc(AD.txt(S, d.n)) + '</b><small>' + (S.vis[d.id] ? "✓ " + esc(t("visited")) : "") + '</small></span><span class="pr">' + esc(t("cost", {n: d.cost.toLocaleString("en-US")})) + '</span></button>'; });
        }else if(id === "side"){
            h = '<h3>' + esc(t("side")) + '</h3>';
            AD.SIDES.forEach(function(d){ var ok = S[d.stat] >= d.min && S.money >= d.stock; h += '<button type="button" class="listbtn" data-do="' + id + '" data-slot="' + slot + '" data-arg="' + d.id + '"' + (ok ? "" : " disabled") + '><span class="ae">' + d.em + '</span><span class="lt"><b>' + esc(AD.txt(S, d.n)) + '</b><small>' + esc(d.min ? t("minSkill", {s: sn(d.stat), n: d.min}) : "") + (d.stock ? " " + esc(t("needStock", {n: d.stock.toLocaleString("en-US")})) : "") + '</small></span></button>'; });
        }else if(id === "pachinko"){
            h = '<h3>🎰 ' + esc(t("pachi")) + '</h3><p class="hint">' + esc(t("pachiNote")) + '</p>';
            [3000, 10000, 30000].forEach(function(b){ h += '<button type="button" class="listbtn" data-do="' + id + '" data-slot="' + slot + '" data-arg="' + b + '"' + (S.money >= b ? "" : " disabled") + '><span class="ae">🪙</span><span class="lt"><b>' + yen(b) + '</b></span></button>'; });
        }else if(id === "date"){
            h = '<h3>' + esc(t("date")) + '</h3>';
            ["misa", "sak"].forEach(function(w){ var c = AD.CH[w]; h += '<button type="button" class="listbtn" data-do="' + id + '" data-slot="' + slot + '" data-arg="' + w + '"><span class="ae">' + c.em + '</span><span class="lt"><b>' + esc(AD.txt(S, c.n)) + '</b><small>' + esc(AD.txt(S, c.role)) + '　❤ ' + Math.round(S.rel[w] || 0) + '</small></span></button>'; });
        }else return doAct(slot, id);
        sheet(h + '<button type="button" id="shClose">' + esc(t("cancel")) + '</button>');
    }
    function doAct(slot, id, arg){
        var S = G.S; close("mSheet"); var r;
        try{ r = AD.act(S, slot, id, arg); }catch(e){ console.warn(e); toast(String(e.message || e)); return; }
        G.last[slot] = {txt: r.txt, d: r.d}; GK.sfx(r.d.money > 0 ? "coin" : "ok"); persist(); renderAll();
        G.busy = true; flush().then(function(){ G.busy = false; persist(); renderAll(); });
    }

    // ---------- できごと ----------
    function flush(){
        return new Promise(function(done){
            var n = 0;
            (function loop(){ var e = AD.nextEv(G.S); if(!e || ++n > 12){ done(); return; } showEvent(e).then(function(){ persist(); renderHud(); loop(); }); })();
        });
    }
    function showEvent(e){
        return new Promise(function(res){
            var S = G.S, box = $("evBox"); if(AD.EVMAP[e.id] || AD.DYN[e.id]){ S.pend.unshift(e.id); persist(); S.pend.shift(); } var h = '<span class="evtag">' + esc(t("event")) + ' ・ ' + esc(calLabel(S.week)) + '</span><h3>' + esc(X(e.title)) + '</h3><p class="evbody">' + esc(X(e.body)) + '</p><div class="choices">';
            e.ch.forEach(function(c, i){
                var ok = AD.choiceOk(S, c), chance = c.chk ? Math.round(AD.chkProb(S, c.chk) * 100) : 0;
                h += '<button type="button" data-i="' + i + '"' + (ok ? "" : " disabled") + '>' + (c.chk && ok ? '<span class="ch">' + esc(t("chance", {p: chance})) + '</span>' : "") + (ok ? "" : "🔒 ") + esc(X(c.t)) + (c.hint ? '<span class="hn">' + esc(X(c.hint)) + '</span>' : "") + '</button>';
            });
            box.innerHTML = h + '</div>'; open("mEvent"); box.scrollTop = 0; GK.sfx("pop");
            var first = box.querySelector("button:not(:disabled)"); void first;
            box.onclick = function(ev){
                var b = ev.target.closest("button[data-i]"); if(!b || b.disabled) return;
                box.onclick = null; var r = AD.choose(S, e, +b.dataset.i);
                var good = (r.d.money || 0) + (r.d.mp || 0) + (r.d.hlt || 0) >= 0; GK.sfx(r.chk ? (r.chk.win ? "win" : "ng") : good ? "ok" : "ng"); if(r.chk && r.chk.win) GK.vibrate(25);
                var rh = '<div class="result">' + (r.chk ? '<div class="jd ' + (r.chk.win ? "win" : "lose") + '">' + esc(t(r.chk.win ? "succ" : "fail")) + '</div>' : "") + esc(X(r.o.txt)) + '<div class="chips">' + chips(r.d) + '</div></div><button type="button" class="big" id="evOk" data-pad-first="1" style="margin-top:12px;width:100%">' + esc(t("ok")) + '</button>';
                box.querySelector(".choices").outerHTML = rh;
                box.querySelector("#evOk").onclick = function(){ close("mEvent"); res(); }; padSync();
                box.scrollTop = box.scrollHeight;
            };
        });
    }

    // ---------- 週のおわり ----------
    function nextWeek(){
        var S = G.S; if(S.phase !== "end" || G.busy) return;
        G.busy = true; var rep = AD.endWeek(S), c = rep.cal || AD.cal(S.week);
        var h = '<h3>' + SEASON[c.season] + ' ' + esc(t("weekEnd", {m: c.m, n: c.nth})) + '</h3><p class="hint" style="text-align:center">' + esc(t("weekRes")) + '</p><div class="weekl">' + (rep.lines || []).map(function(x){ return esc(X(x)); }).join("<br>") + '</div><div class="chips">' + chips(rep.d) + '</div><button type="button" class="big" id="wkOk" data-pad-first="1" style="margin-top:12px;width:100%">' + esc(t("ok")) + '</button>';
        $("weekBox").innerHTML = h; open("mWeek"); persist(); renderHud(); GK.sfx("tap");
        $("wkOk").onclick = function(){ close("mWeek"); flush().then(function(){ afterWeek(c); }); };
    }
    function afterWeek(c){
        var S = G.S, end = AD.advance(S); G.last = {};
        if(end){ G.busy = false; finish(end); return; }
        G.busy = false; persist(); renderAll(); weekFx(); tab("home");
        var nc = AD.cal(S.week); if(c && nc.m !== c.m) toast(SEASON[nc.season] + " " + t("calFmt", {m: nc.m, n: nc.nth}));
    }

    // ---------- エンディング ----------
    function finish(id){
        var S = G.S, E = AD.ENDMAP[id], score = AD.score(S), rank = AD.rank(score);
        var st = store.all(), ends = st.ends || {}, ach = st.ach || {}, evs = st.evs || {}, newEnd = !ends[id];
        ends[id] = (ends[id] || 0) + 1; var got = AD.achieved(S), newA = got.filter(function(a){ return !ach[a]; }); got.forEach(function(a){ ach[a] = 1; });
        Object.keys(S.done).forEach(function(k){ evs[k] = 1; });
        var best = st.best || 0, isBest = score > best;
        store.set("ends", ends); store.set("ach", ach); store.set("evs", evs); store.set("runs", (st.runs || 0) + 1); if(isBest) store.set("best", score);
        if(S.daily){ var dk = "d" + GK.daySeed(); if(score > (st["" + dk] || 0)) store.set(dk, score); }
        try{ localStorage.removeItem(SAVE); }catch(_e){} GK.bgm("off");
        $("endEm").textContent = E.em; $("endKind").textContent = t(E.kind === "crisis" ? "kindC" : "kindF"); $("endT").textContent = AD.txt(S, E.n) + (newEnd ? "  " + t("newEnd") : "");
        $("endB").textContent = AD.txt(S, E.d); $("endRank").textContent = rank; $("endScore").textContent = t("score", {s: score}); $("endBest").textContent = t("best", {b: Math.max(best, score)});
        var sh = ""; ["money", "hlt", "knw", "chm", "skl", "soc", "fame"].forEach(function(k){ sh += '<span class="chip">' + ICON[k] + ' ' + esc(sn(k)) + ' ' + (k === "money" ? yen(S[k]) : Math.round(S[k]).toLocaleString("en-US")) + '</span>'; });
        $("endStats").innerHTML = sh;
        $("endAch").innerHTML = got.length ? '<div class="hint" style="width:100%">🏆 ' + esc(t("achT")) + '</div>' + got.map(function(a){ var A = AD.ACH.filter(function(x){ return x.id === a; })[0]; return '<span class="chip' + (newA.indexOf(a) >= 0 ? " new" : "") + '">' + A.em + ' ' + esc(AD.txt(S, A.n)) + '</span>'; }).join("") : "";
        show("end"); if(E.g === "great" || E.g === "good"){ GK.confetti(); GK.sfx("win"); } else GK.sfx(E.g === "bad" ? "lose" : "ok");
        $("s-end").scrollTop = 0;
    }

    // ---------- ずかん ----------
    var cTab = "end";
    function buildColl(){
        var st = store.all(), ends = st.ends || {}, ach = st.ach || {}, h = "", a = 0, b = 0;
        if(cTab === "end"){ AD.ENDS.forEach(function(E){ var u = !!ends[E.id]; b++; if(u) a++; h += '<button type="button" class="cc' + (u ? "" : " off") + '" data-end="' + E.id + '"><span class="ce">' + (u ? E.em : "❔") + '</span><b>' + esc(u ? AD.txt(null, E.n) : t("unknown")) + '</b><small>' + (u ? "×" + ends[E.id] : "") + '</small></button>'; }); }
        else{ AD.ACH.forEach(function(A){ var u = !!ach[A.id]; b++; if(u) a++; h += '<div class="cc' + (u ? "" : " off") + '"><span class="ce">' + (u ? A.em : "❔") + '</span><b>' + esc(u ? AD.txt(null, A.n) : t("unknown")) + '</b><small>' + esc(AD.txt(null, A.d)) + '</small></div>'; }); }
        $("cGrid").innerHTML = h; $("cCount").textContent = t("cCount", {a: a, b: b}) + "　" + t("memories", {n: Object.keys(st.evs || {}).length, t: AD.EV.length});
        $("cTabs").children[0].classList.toggle("on", cTab === "end"); $("cTabs").children[1].classList.toggle("on", cTab === "ach");
    }

    // ---------- 季節の えんしゅつ ----------
    var fx = {cv: $("fx"), c: null, ps: [], season: "winter", w: 0, h: 0, raf: 0};
    function fxInit(){ fx.c = fx.cv.getContext("2d"); fxResize(); fxSeed(); fx.raf = requestAnimationFrame(fxLoop); }
    function fxResize(){ var d = Math.min(2, window.devicePixelRatio || 1); fx.w = innerWidth; fx.h = innerHeight; fx.cv.width = fx.w * d; fx.cv.height = fx.h * d; fx.c.setTransform(d, 0, 0, d, 0, 0); }
    function fxSeed(){
        var n = (window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches) ? 10 : (innerWidth < 600 ? 26 : 46); fx.ps = [];
        for(var i = 0; i < n; i++) fx.ps.push({x: Math.random() * fx.w, y: Math.random() * fx.h, r: 2 + Math.random() * 5, v: .3 + Math.random() * .9, a: Math.random() * 6.28, s: .4 + Math.random() * 1.2});
    }
    function fxLoop(){
        fx.raf = requestAnimationFrame(fxLoop); var c = fx.c, s = fx.season; c.clearRect(0, 0, fx.w, fx.h);
        for(var i = 0; i < fx.ps.length; i++){
            var p = fx.ps[i]; p.a += .02 * p.s;
            if(s === "summer"){ p.y -= p.v * .5; p.x += Math.sin(p.a) * .3; if(p.y < -20){ p.y = fx.h + 10; p.x = Math.random() * fx.w; } c.globalAlpha = .12 + .1 * Math.sin(p.a * 2); c.fillStyle = "#fff6b0"; c.beginPath(); c.arc(p.x, p.y, p.r * 3, 0, 6.3); c.fill(); }
            else{
                p.y += p.v * (s === "winter" ? .8 : 1.1); p.x += Math.sin(p.a) * (s === "winter" ? .35 : .8) + (s === "autumn" ? .25 : 0);
                if(p.y > fx.h + 10){ p.y = -10; p.x = Math.random() * fx.w; } if(p.x > fx.w + 10) p.x = -10; if(p.x < -10) p.x = fx.w + 10;
                c.globalAlpha = .8; c.save(); c.translate(p.x, p.y); c.rotate(p.a);
                if(s === "winter"){ c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, p.r * .6, 0, 6.3); c.fill(); }
                else if(s === "spring"){ c.fillStyle = "#ffb7d1"; c.beginPath(); c.ellipse(0, 0, p.r * 1.2, p.r * .65, 0, 0, 6.3); c.fill(); }
                else{ c.fillStyle = i % 2 ? "#ff9a3c" : "#e0502e"; c.beginPath(); c.moveTo(0, -p.r * 1.3); c.quadraticCurveTo(p.r * 1.2, 0, 0, p.r * 1.3); c.quadraticCurveTo(-p.r * 1.2, 0, 0, -p.r * 1.3); c.fill(); }
                c.restore();
            }
        }
        c.globalAlpha = 1;
    }
    function weekFx(){ var s = G.S ? AD.cal(G.S.week).season : "winter"; fx.season = s; document.body.dataset.season = s; }

    // ---------- ボタン ----------
    $("bNew").onclick = function(){ G.daily = false; GK.sfx("ok"); show("setup"); };
    $("bDaily").onclick = function(){ G.daily = true; GK.sfx("ok"); show("setup"); };
    $("bCont").onclick = function(){ var s = loadSave(); if(!s) return; G.S = s; G.last = {}; GK.sfx("ok"); GK.bgm("calm"); show("game"); weekFx(); if(s.phase === "ev"){ G.busy = true; flush().then(function(){ afterWeek(null); }); } else if(s.pend && s.pend.length){ G.busy = true; flush().then(function(){ G.busy = false; persist(); renderAll(); }); } };
    $("bColl").onclick = function(){ cTab = "end"; show("coll"); };
    $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = $("bSuBack").onclick = $("bCollBack").onclick = $("bEndTitle").onclick = function(){ show("title"); };
    $("bEndColl").onclick = function(){ cTab = "end"; show("coll"); };
    $("bAgain").onclick = function(){ G.daily = false; show("setup"); };
    $("bGo").onclick = startRun;
    $("bgList").addEventListener("click", function(e){ var b = e.target.closest(".bgc"); if(!b || b.disabled) return; G.picked = b.dataset.id; $("bgList").querySelectorAll(".bgc").forEach(function(x){ x.classList.toggle("sel", x === b); }); GK.sfx("tap"); });
    $("cTabs").addEventListener("click", function(e){ var b = e.target.closest("button[data-c]"); if(!b) return; cTab = b.dataset.c; buildColl(); GK.sfx("tap"); });
    $("cGrid").addEventListener("click", function(e){ var b = e.target.closest("[data-end]"); if(!b) return; var E = AD.ENDMAP[b.dataset.end], u = (store.get("ends", {}) || {})[E.id]; if(!u) return; $("infoBox").innerHTML = '<div style="font-size:60px">' + E.em + '</div><h3>' + esc(AD.txt(null, E.n)) + '</h3><p>' + esc(AD.txt(null, E.d)) + '</p><button type="button" class="big" id="inOk" data-pad-first="1">' + esc(t("ok")) + '</button>'; open("mInfo"); $("inOk").onclick = function(){ close("mInfo"); }; });
    $("slots").addEventListener("click", function(e){ var b = e.target.closest(".slot"); if(b) openSlot(b.dataset.slot); });
    $("bNext").onclick = nextWeek;
    $("nav").addEventListener("click", function(e){ var b = e.target.closest("button"); if(!b) return; if(b.id === "bMenu"){ openMenu(); return; } tab(b.dataset.tab); });
    $("sheetBox").addEventListener("click", function(e){
        var b = e.target.closest("button"); if(!b || b.disabled) return;
        if(b.id === "shClose"){ close("mSheet"); return; }
        if(b.dataset.act) pickAct(b.dataset.slot, b.dataset.act);
        else if(b.dataset.do){ var a = b.dataset.arg; doAct(b.dataset.slot, b.dataset.do, /^\d+$/.test(a) ? +a : a); }
    });
    function openMenu(){
        var h = '<h3>' + esc(t("menuT")) + '</h3><div class="menu" style="width:100%"><button type="button" class="big" id="mnResume" data-pad-first="1">' + esc(t("resume")) + '</button><button type="button" id="mnSave">' + esc(t("saveTitle")) + '</button><button type="button" id="mnGive">' + esc(t("giveUp")) + '</button></div>';
        $("menuBox").innerHTML = h; open("mMenu");
        $("mnResume").onclick = function(){ close("mMenu"); };
        $("mnSave").onclick = function(){ close("mMenu"); persist(); GK.bgm("off"); toast(t("saved")); show("title"); };
        $("mnGive").onclick = function(){
            $("menuBox").innerHTML = '<h3>' + esc(t("giveUp")) + '</h3><p>' + esc(t("giveUpQ")) + '</p><div class="row"><button type="button" id="gvNo" data-pad-first="1">' + esc(t("no")) + '</button><button type="button" id="gvYes" class="pink">' + esc(t("yes")) + '</button></div>';
            $("gvNo").onclick = function(){ close("mMenu"); }; padSync();
            $("gvYes").onclick = function(){ close("mMenu"); var S = G.S; S.over = true; S.endId = S.hlt < 25 ? "hospital" : S.mp < 25 ? "burnout" : "bankrupt"; AD.crisis(S); finish(S.endId); };
        };
    }
    $("exitBtn").onclick = function(){
        if(G.scr === "game"){ openMenu(); return; }
        if(G.scr !== "title"){ show("title"); return; }
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
        location.href = "../index.html";
    };
    $("sndBtn").onclick = function(){ GK.mute(!GK.isMuted()); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; if(!GK.isMuted()){ GK.sfx("ok"); if(G.scr === "game") GK.bgm("calm"); } };
    $("lgBtn").onclick = function(){ var order = ["ja", "en", "zh", "ko"], i = order.indexOf(L()); GK.LS.set("are_lang", order[(i + 1) % 4]); show(G.scr); };
    window.addEventListener("agegate-ok", padSync);
    window.addEventListener("storage", function(e){ if(e.key === "are_lang") show(G.scr); });
    // B / Esc：とじる・もどる（パッドの B と ＋ も Esc として とどく）
    var escAt = 0;
    window.addEventListener("keydown", function(e){
        if(e.key !== "Escape") return;
        var nw = performance.now(); if(nw - escAt < 160) return; escAt = nw;   // パッドの B / ＋ は 2回とどく ことがあるので 1回にまとめる
        var a = document.activeElement; if(a && a.tagName === "INPUT"){ a.blur(); return; }
        if(document.querySelector(".gki-modal.on")) return;
        var m = document.querySelector(".modal.on[data-closable]"); if(m){ close(m.id); e.preventDefault(); return; }
        if(document.querySelector(".modal.on")) return;
        if(window.AgeGate && !AgeGate.ok()) return;
        if(G.scr === "game") openMenu(); else if(G.scr !== "title") show("title");
    });
    window.addEventListener("resize", function(){ fxResize(); });
    if(window.GKI){
        GKI.mode("menu");
        GKI.legend([{k: "dpad", t: {ja: "ボタンを えらぶ", en: "Pick a button", zh: "选择按钮", ko: "버튼 선택"}}, {k: "a", t: {ja: "決定", en: "Confirm", zh: "确定", ko: "결정"}},
            {k: "b", t: {ja: "もどる・とじる（ゲーム中は メニュー）", en: "Back / close (menu in game)", zh: "返回/关闭（游戏中为菜单）", ko: "뒤로/닫기 (게임 중엔 메뉴)"}}, {k: "plus", t: {ja: "メニュー・もどる", en: "Menu / back", zh: "菜单/返回", ko: "메뉴/뒤로"}}]);
    }
    window.__ad = {G: G, show: show, finish: finish, X: X, startRun: startRun};
    fxInit(); show("title");
})();
