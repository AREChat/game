"use strict";
/* AREUSO：データ（4言語）。戦う相手は「ノイズ」（ざらざらした 光の かたまり）。小さな 生き物に 似た 見た目・名前は 使わない。 */
(function(){
    var US = window.US = {};
    var L4 = ["ja", "en", "zh", "ko"];
    function P(s){ var a = s.split("|"); return {ja: a[0], en: a[1] || a[0], zh: a[2] || a[1] || a[0], ko: a[3] || a[1] || a[0]}; }
    US.P = P; US.L4 = L4;
    US.t = function(o, lang){ if(!o) return ""; if(typeof o === "string") return o; return o[lang] || o.ja || ""; };

    /* ---- 武将（ヒーロー）---- 攻撃は 「弱」の れんぞく（combo）と「強」。range=はんい, arc=角度, dur=秒, hit=当たる時間, dmg=ダメージ */
    US.HEROES = [
        {id: "akari", n: P("アカリ|Akari|灯|아카리"), role: P("光刃の 剣士|Light-blade swordswoman|光刃剑士|광검 검사"), col: 0xffb347, col2: 0xfff2c0, hp: 360, spd: 8.2, w: "sword", unlock: 0,
            weak: [{dmg: 14, range: 2.6, arc: 120, dur: .34, hit: .12, lunge: 1.2}, {dmg: 14, range: 2.6, arc: 120, dur: .34, hit: .12, lunge: 1.2}, {dmg: 16, range: 2.8, arc: 150, dur: .38, hit: .14, lunge: 1.4}, {dmg: 18, range: 3.0, arc: 160, dur: .42, hit: .16, lunge: 1.5}, {dmg: 30, range: 3.6, arc: 360, dur: .6, hit: .26, lunge: 0, launch: 1}],
            strong: {dmg: 42, range: 3.8, arc: 200, dur: .72, hit: .3, lunge: 2, launch: 1}, musou: {dmg: 38, radius: 9}, desc: P("バランスの よい 万能型。れんぞく技が きれいに つながる。|Well-balanced all-rounder with smooth combos.|均衡的万能型，连招流畅。|균형 잡힌 만능형. 연속기가 매끄러워요.")},
        {id: "raiga", n: P("ライガ|Raiga|雷牙|라이가"), role: P("雷槍の つかい手|Thunder-spear wielder|雷枪使者|뇌창의 사용자"), col: 0x4de1ff, col2: 0xd6f7ff, hp: 340, spd: 8.0, w: "spear", unlock: 1,
            weak: [{dmg: 13, range: 3.8, arc: 75, dur: .36, hit: .14, lunge: 1.0}, {dmg: 13, range: 3.8, arc: 75, dur: .36, hit: .14, lunge: 1.0}, {dmg: 15, range: 4.0, arc: 80, dur: .38, hit: .15, lunge: 1.2}, {dmg: 17, range: 4.2, arc: 90, dur: .42, hit: .17, lunge: 1.2}, {dmg: 28, range: 4.6, arc: 300, dur: .62, hit: .28, lunge: 0, launch: 1}],
            strong: {dmg: 44, range: 5.4, arc: 100, dur: .76, hit: .32, lunge: 3, launch: 1}, musou: {dmg: 36, radius: 10}, desc: P("リーチが とても 長い。遠くから ついて 敵を 近づけない。|Very long reach. Keep enemies at bay with thrusts.|攻击距离极长，远距离突刺。|리치가 아주 길어요. 멀리서 찔러 적을 막아요.")},
        {id: "gan", n: P("ガン|Gan|巌|간"), role: P("大槌の 怪力|Hammer powerhouse|大锤怪力|대형 망치 괴력"), col: 0xff5d73, col2: 0xffd0d6, hp: 460, spd: 6.8, w: "hammer", unlock: 2,
            weak: [{dmg: 24, range: 2.8, arc: 120, dur: .52, hit: .24, lunge: .8}, {dmg: 26, range: 2.8, arc: 130, dur: .54, hit: .25, lunge: .8}, {dmg: 32, range: 3.2, arc: 360, dur: .72, hit: .34, lunge: 0, launch: 1}],
            strong: {dmg: 70, range: 4.2, arc: 360, dur: .95, hit: .45, lunge: 0, launch: 1}, musou: {dmg: 52, radius: 10}, desc: P("動きは おそいが 一撃が 重い。体力が 多く おし返されにくい。|Slow but hits very hard. High HP, hard to push back.|动作慢但一击沉重，体力高。|느리지만 한 방이 묵직해요. 체력이 많아요.")},
        {id: "tsubame", n: P("ツバメ|Tsubame|燕|츠바메"), role: P("双刃の 疾風|Twin-blade gale|双刃疾风|쌍검의 질풍"), col: 0xb68cff, col2: 0xe6d9ff, hp: 300, spd: 10.0, w: "twin", unlock: 3,
            weak: [{dmg: 9, range: 2.3, arc: 110, dur: .22, hit: .08, lunge: 1.0}, {dmg: 9, range: 2.3, arc: 110, dur: .22, hit: .08, lunge: 1.0}, {dmg: 10, range: 2.4, arc: 120, dur: .22, hit: .08, lunge: 1.0}, {dmg: 10, range: 2.4, arc: 120, dur: .22, hit: .08, lunge: 1.0}, {dmg: 12, range: 2.6, arc: 130, dur: .24, hit: .09, lunge: 1.2}, {dmg: 13, range: 2.6, arc: 130, dur: .24, hit: .09, lunge: 1.2}, {dmg: 30, range: 3.4, arc: 360, dur: .5, hit: .22, lunge: 0, launch: 1}],
            strong: {dmg: 41, range: 4.2, arc: 160, dur: .55, hit: .22, lunge: 4, launch: 1}, musou: {dmg: 30, radius: 9}, desc: P("とても はやい。小さな 攻撃を 何度も つなげて 連続ヒットを ねらう。|Extremely fast. Chain many quick hits for huge combos.|极快，连续出招打出高连击。|아주 빨라요. 빠른 공격을 이어 콤보를 노려요.")}
    ];
    US.HEROMAP = {}; US.HEROES.forEach(function(h, i){ h.i = i; US.HEROMAP[h.id] = h; });

    /* ---- ふつうの ノイズ ---- */
    US.EN = {
        grunt: {n: P("ノイズ兵|Noise Grunt|噪点兵|노이즈 병사"), hp: 40, dmg: 12, spd: 3.6, r: .5, range: 1.5, wind: .55, cd: 1.6, col: 0x6a6a86, glow: 0xff4fd8, score: 10, mus: 2.5},
        archer: {n: P("ノイズ射手|Noise Shooter|噪点射手|노이즈 사수"), hp: 28, dmg: 10, spd: 3.0, r: .45, range: 13, keep: 8, wind: .75, cd: 2.6, col: 0x5a6a86, glow: 0x4de1ff, score: 14, mus: 3},
        shield: {n: P("ノイズ盾|Noise Guard|噪点盾兵|노이즈 방패병"), hp: 80, dmg: 14, spd: 2.8, r: .6, range: 1.7, wind: .7, cd: 2.0, col: 0x77779a, glow: 0xffd34d, score: 22, mus: 4},
        brute: {n: P("ノイズ猛者|Noise Brute|噪点猛者|노이즈 맹자"), hp: 260, dmg: 32, spd: 2.3, r: 1.0, range: 2.4, wind: .95, cd: 2.8, col: 0x55556e, glow: 0xff7a3d, score: 60, mus: 10, slam: 3.2}
    };
    US.OFFICERS = {
        zapper: {n: P("ザッパー|Zapper|扎帕|잡퍼"), t: P("雑音の 先ぶれ|Herald of Static|杂音的先驱|잡음의 전령"), hp: 1500, dmg: 20, spd: 3.6, r: 1.1, col: 0x7a4de0, glow: 0xff4fd8, pat: ["slash", "dash", "slash", "slam"]},
        lancer: {n: P("グリッチ・ランサー|Glitch Lancer|故障枪兵|글리치 랜서"), t: P("ひび割れの 槍|Spear of the Rift|裂隙之枪|균열의 창"), hp: 2100, dmg: 23, spd: 4.2, r: 1.1, col: 0x2d9db8, glow: 0x4de1ff, pat: ["dash", "fan", "slash", "dash", "slam"]},
        warden: {n: P("ジャミング・ウォーデン|Jamming Warden|干扰典狱官|재밍 워든"), t: P("砦の 番人|Keeper of the Fort|堡垒守卫|요새의 문지기"), hp: 2500, dmg: 26, spd: 3.2, r: 1.4, col: 0xb8742d, glow: 0xffd34d, pat: ["slam", "fan", "slash", "slam", "dash"]},
        twin1: {n: P("ミラー・アルファ|Mirror Alpha|镜像·阿尔法|미러 알파"), t: P("歪んだ 鏡の 右|Right of the Warped Mirror|扭曲之镜·右|일그러진 거울의 오른쪽"), hp: 1900, dmg: 22, spd: 4.4, r: 1.1, col: 0xe04d8a, glow: 0xff4fd8, pat: ["dash", "slash", "fan", "slash"]},
        twin2: {n: P("ミラー・ベータ|Mirror Beta|镜像·贝塔|미러 베타"), t: P("歪んだ 鏡の 左|Left of the Warped Mirror|扭曲之镜·左|일그러진 거울의 왼쪽"), hp: 1900, dmg: 22, spd: 4.4, r: 1.1, col: 0x4d8ae0, glow: 0x4de1ff, pat: ["fan", "slash", "dash", "slam"]},
        king: {n: P("ノイズ王 ホワイト|Noise King White|噪点王·白|노이즈 왕 화이트"), t: P("すべての 雑音の 王|King of All Static|万噪之王|모든 잡음의 왕"), hp: 5000, dmg: 25, spd: 3.8, r: 1.6, col: 0xe8e8ff, glow: 0xffffff, pat: ["slash", "fan", "dash", "slam", "summon"], phases: 3}
    };

    /* ---- ステージ ---- goal: boss(武将を たおす)／bases(拠点を 2つ とって 武将)／gens(発生源を こわす)／duo(武将 2人)／king */
    US.STAGES = [
        {id: "s1", n: P("はじまりの 野|The Opening Field|起始之野|시작의 들판"), sky: [0x1a2a66, 0xffa56b], ground: 0x2c3a52, line: 0x6ab8ff, r: 52, goal: "boss", ko: 50, off: ["zapper"], cap: 16, par: 210, spawn: 1.1, mix: {grunt: 1},
            intro: P("夕ぐれの 野に 雑音が あふれだした。ざらざらした 光の かたまり「ノイズ」が 世界を ゆがめている。|Static pours over the evening field. Rough clumps of light called “Noise” are warping the world.|傍晚的原野上涌出了杂音。名为“噪点”的粗糙光团正在扭曲世界。|해 질 녘 들판에 잡음이 넘쳐흘러요. ‘노이즈’라는 거친 빛 덩어리가 세상을 일그러뜨리고 있어요."),
            obj: P("ノイズを たおして、先ぶれの 「ザッパー」を 討て！|Defeat the Noise and take down Zapper!|击败噪点，讨伐“扎帕”！|노이즈를 쓰러뜨리고 ‘잡퍼’를 물리쳐요!"),
            end: P("ひとつ目の 雑音が 静まった。だが、これは はじまりに すぎない。|The first static fades. But this is only the beginning.|第一道杂音平息了。但这只是开始。|첫 번째 잡음이 가라앉았어요. 하지만 이건 시작일 뿐이에요.")},
        {id: "s2", n: P("ひび割れの 谷|The Cracked Valley|裂隙之谷|갈라진 계곡"), sky: [0x2a1a4a, 0x6bd0ff], ground: 0x2a2a46, line: 0xb68cff, r: 54, goal: "bases", bases: 2, ko: 0, off: ["lancer"], cap: 20, par: 270, spawn: .95, mix: {grunt: 3, archer: 1},
            intro: P("谷の 地面に 光の ひびが 走る。ノイズの 拠点を ふたつ 取りもどし、谷の 主を おびき出そう。|Light cracks run across the valley floor. Retake two Noise bases to lure out the valley’s master.|山谷的地面裂开光的缝隙。夺回两处噪点据点，引出谷主。|계곡 바닥에 빛의 금이 달려요. 노이즈 거점 두 곳을 되찾아 계곡의 주인을 불러내요."),
            obj: P("光の 輪に 入って 拠点を 2つ 取り返し、「グリッチ・ランサー」を 討て！|Capture 2 bases by standing in the light rings, then defeat Glitch Lancer!|站在光环内夺回2处据点，再讨伐“故障枪兵”！|빛의 고리 안에 서서 거점 2곳을 되찾고 ‘글리치 랜서’를 물리쳐요!"),
            end: P("谷に 静けさが もどった。行く手に そびえる 砦が 見える。|Quiet returns to the valley. A fortress looms ahead.|山谷恢复了平静。前方耸立着堡垒。|계곡에 고요가 돌아왔어요. 앞쪽에 요새가 보여요.")},
        {id: "s3", n: P("雑音の 砦|The Static Fortress|杂音堡垒|잡음의 요새"), sky: [0x2a1a1a, 0xffc36b], ground: 0x3a2f2a, line: 0xffd34d, r: 54, goal: "gens", gens: 3, ko: 0, off: ["warden"], cap: 22, par: 330, spawn: .9, mix: {grunt: 3, archer: 2, shield: 2},
            intro: P("砦の 三か所で、ノイズを うみだす 「発生源」が うなっている。こわさない かぎり 雑音は 止まらない。|Three Noise generators hum inside the fortress. The static will never stop until they are destroyed.|堡垒的三处“发生源”嗡嗡作响。不摧毁它们，杂音就不会停止。|요새 세 곳에서 노이즈를 만드는 ‘발생원’이 웅웅거려요. 부수지 않으면 잡음은 멈추지 않아요."),
            obj: P("発生源を 3つ こわし、「ジャミング・ウォーデン」を 討て！|Destroy 3 generators, then defeat Jamming Warden!|摧毁3个发生源，再讨伐“干扰典狱官”！|발생원 3개를 부수고 ‘재밍 워든’을 물리쳐요!"),
            end: P("砦が 静まりかえった。空の 色が かわっていく…。|The fortress falls silent. The color of the sky begins to change…|堡垒归于寂静。天空的颜色渐渐改变……|요새가 고요해졌어요. 하늘의 색이 변해 가요…")},
        {id: "s4", n: P("ゆがんだ 城下|The Warped Town|扭曲城下|일그러진 성하마을"), sky: [0x120a2a, 0xff6bb8], ground: 0x2a1f3a, line: 0xff4fd8, r: 56, goal: "duo", ko: 70, off: ["twin1", "twin2"], cap: 26, par: 400, spawn: .8, mix: {grunt: 3, archer: 2, shield: 2, brute: 1},
            intro: P("町の 鏡が われて、ノイズの 双子が あらわれた。ふたりを たおさなければ 町は もとにもどらない。|The mirrors of the town shattered and twin Noise appeared. The town will not recover unless both are defeated.|城镇的镜子碎裂，噪点双子现身。不击败两人，城镇无法恢复。|마을의 거울이 깨지고 노이즈 쌍둥이가 나타났어요. 둘을 쓰러뜨리지 못하면 마을은 돌아오지 않아요."),
            obj: P("「ミラー・アルファ」と「ミラー・ベータ」を 両方 討て！|Defeat both Mirror Alpha and Mirror Beta!|讨伐“镜像·阿尔法”与“镜像·贝塔”！|‘미러 알파’와 ‘미러 베타’를 둘 다 물리쳐요!"),
            end: P("鏡は とじた。残る 雑音の みなもとは ただ ひとつ。|The mirrors are closed. Only one source of static remains.|镜子合上了。杂音的源头只剩一个。|거울이 닫혔어요. 남은 잡음의 근원은 단 하나예요.")},
        {id: "s5", n: P("ノイズの 王座|The Throne of Noise|噪点王座|노이즈의 왕좌"), sky: [0x05020f, 0x9a6bff], ground: 0x1a1430, line: 0xffffff, r: 58, goal: "king", ko: 0, off: ["king"], cap: 24, par: 540, spawn: 1.0, mix: {grunt: 3, archer: 2, shield: 2, brute: 1},
            intro: P("すべての 雑音の みなもと、ノイズ王 ホワイト。世界の 音を ぬりつぶす 白い 光が ひろがる。|White, King of Noise, source of all static. A white light that paints over every sound of the world spreads out.|万噪之源，噪点王·白。涂尽世界声音的白光蔓延开来。|모든 잡음의 근원, 노이즈 왕 화이트. 세상의 소리를 칠해 버리는 하얀 빛이 퍼져요."),
            obj: P("「ノイズ王 ホワイト」を たおせ！|Defeat Noise King White!|击败“噪点王·白”！|‘노이즈 왕 화이트’를 쓰러뜨려요!"),
            end: P("白い 光が ほどけ、世界に 音が もどった。風、足音、だれかの 笑い声…。きみの 戦いが すべてを とりもどした。|The white light unravels and sound returns to the world: wind, footsteps, someone’s laughter… Your fight has won everything back.|白光消散，世界重新有了声音：风声、脚步、谁的笑声……你的战斗夺回了一切。|하얀 빛이 풀리고 세상에 소리가 돌아왔어요. 바람, 발소리, 누군가의 웃음소리… 당신의 싸움이 모든 것을 되찾았어요.")}
    ];
    US.STAGEMAP = {}; US.STAGES.forEach(function(s, i){ s.i = i; US.STAGEMAP[s.id] = s; });

    /* ---- UI 文字 ---- */
    US.TX = {
        title: P("AREUSO|AREUSO|AREUSO|AREUSO"),
        sub: P("ノイズの 大軍を 斬りひらけ！爽快 3D アクション|Cut through the Noise horde! Thrilling 3D action|斩开噪点大军！爽快3D动作|노이즈 대군을 가르자! 통쾌한 3D 액션"),
        start: P("ゲームスタート|Start|开始游戏|게임 시작"), cont: P("つづきから|Continue|继续|이어하기"), how: P("あそびかた|How to Play|玩法|플레이 방법"),
        stage: P("ステージえらび|Select Stage|选择关卡|스테이지 선택"), hero: P("武将えらび|Select Hero|选择武将|무장 선택"), go: P("出陣！|Deploy!|出阵！|출진!"),
        back: P("もどる|Back|返回|뒤로"), locked: P("かいほうまで ひみつ|Locked|未解锁|잠김"), unlockHint: P("ステージを クリアすると 仲間が ふえる|Clear stages to unlock more heroes|通关可解锁更多伙伴|스테이지를 클리어하면 동료가 늘어요"),
        diff: P("むずかしさ|Difficulty|难度|난이도"), easy: P("やさしい|Easy|简单|쉬움"), normal: P("ふつう|Normal|普通|보통"), hard: P("むずかしい|Hard|困难|어려움"),
        ko: P("撃破|KO|击败|격파"), time: P("タイム|Time|时间|시간"), combo: P("コンボ|Combo|连击|콤보"), best: P("ベスト|Best|最佳|최고"), rank: P("ランク|Rank|评级|랭크"),
        musou: P("無双ゲージ|Musou|无双|무쌍"), pause: P("ポーズ|Paused|暂停|일시정지"), resume: P("つづける|Resume|继续|계속"), quit: P("やめる|Quit|退出|그만두기"), retry: P("もういちど|Retry|重试|다시 도전"), next: P("つぎへ|Next|下一关|다음으로"), menu: P("メニューへ|Menu|返回菜单|메뉴로"),
        clear: P("ステージクリア！|Stage Clear!|关卡通过！|스테이지 클리어!"), down: P("たおれた…|Defeated…|倒下了……|쓰러졌어요…"), skip: P("スキップ|Skip|跳过|건너뛰기"),
        boss: P("武将 出現！|Officer appears!|武将出现！|무장 출현!"), capture: P("拠点を 取りもどした！|Base recaptured!|夺回据点！|거점을 되찾았어요!"), gen: P("発生源を こわした！|Generator destroyed!|摧毁发生源！|발생원을 부쉈어요!"),
        musouReady: P("無双 発動できる！|Musou ready!|无双可发动！|무쌍 발동 가능!"), phase: P("ノイズ王が 力を 解き放った！|The Noise King unleashes its power!|噪点王释放了力量！|노이즈 왕이 힘을 해방했어요!"),
        allClear: P("全ステージ クリア！|All Stages Clear!|全关卡通过！|모든 스테이지 클리어!"), reset: P("データを けす|Erase data|清除存档|데이터 지우기"), confirmReset: P("セーブデータを すべて けしますか？|Erase all save data?|要清除全部存档吗？|저장 데이터를 모두 지울까요?"), yes: P("はい|Yes|是|예"), no: P("いいえ|No|否|아니오"),
        how1: P("左スティック／WASD／ドラッグ：うごく|Left stick / WASD / drag: move|左摇杆/WASD/拖动：移动|왼쪽 스틱/WASD/드래그: 이동"),
        how2: P("Y：弱こうげき（れんぞくで コンボ）／X：強こうげき（ふきとばし）|Y: light attack (chain for combos) / X: heavy attack (launch)|Y：轻攻击（连按连击）/X：重攻击（击飞）|Y: 약공격(연타로 콤보)/X: 강공격(날려 보내기)"),
        how3: P("B：かいひ（一瞬 むてき）／A：ジャンプ／R：ガード|B: dodge (brief invincibility) / A: jump / R: guard|B：闪避（瞬间无敌）/A：跳跃/R：防御|B: 회피(순간 무적)/A: 점프/R: 가드"),
        how4: P("ZR：無双（ゲージが たまったら！）／L：カメラを うしろへ／＋：ポーズ|ZR: Musou (when the gauge is ready!) / L: recenter camera / +: pause|ZR：无双（气槽满时！）/L：重置视角/＋：暂停|ZR: 무쌍(게이지가 차면!)/L: 카메라 뒤로/＋: 일시정지"),
        how5: P("たくさん 倒すほど 無双ゲージが たまる。赤い 輪は 攻撃の 予告！かいひで よけよう。|Defeating many fills the Musou gauge. Red rings warn of attacks — dodge them!|击败越多，无双气槽越满。红圈是攻击预告，快闪避！|많이 쓰러뜨릴수록 무쌍 게이지가 차요. 빨간 고리는 공격 예고! 회피로 피해요."),
        how6: P("キーボード：J=弱 K=強 Space=ジャンプ L/Shift=かいひ O=無双 I=ガード Q=カメラ／🎮で 好きな キーに 変えられます|Keyboard: J=light K=heavy Space=jump L/Shift=dodge O=musou I=guard Q=camera / remap in 🎮|键盘：J=轻 K=重 空格=跳跃 L/Shift=闪避 O=无双 I=防御 Q=视角 / 可在🎮中修改|키보드: J=약 K=강 Space=점프 L/Shift=회피 O=무쌍 I=가드 Q=카메라 / 🎮에서 바꿀 수 있어요"),
        loading: P("よみこみ中…|Loading…|加载中……|불러오는 중…"), webgl: P("この 端末では 3D 表示が 使えません。|3D graphics are not available on this device.|此设备无法使用3D显示。|이 기기에서는 3D 표시를 쓸 수 없어요."),
        quality: P("画質|Quality|画质|화질"), qHigh: P("高|High|高|높음"), qLow: P("軽い|Light|流畅|가벼움"), shake: P("画面ゆれ|Screen shake|画面震动|화면 흔들림"), on: P("あり|On|开|켜짐"), off: P("なし|Off|关|꺼짐")
    };
    US.LEG = [
        {k: "y", t: P("弱|Light|轻|약")}, {k: "x", t: P("強|Heavy|重|강")}, {k: "a", t: P("ジャンプ|Jump|跳|점프")}, {k: "b", t: P("かいひ|Dodge|闪避|회피")}, {k: "zr", t: P("無双|Musou|无双|무쌍")}, {k: "r", t: P("ガード|Guard|防御|가드")}, {k: "plus", t: P("ポーズ|Pause|暂停|일시정지")}
    ];
})();
