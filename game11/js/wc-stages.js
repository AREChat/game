"use strict";
/* ことばクラフト：ステージ（ほしを ゴールへ とどけよう）
   statics … 動かない じめん [中心x, 中心y, よこ, たて, かたむき(度)]   lava … ようがん [x,y,w,h]
   star … ほしの はじまり {x,y,vx}   goal … ゴール {x,y,w,h}   limit … つかえる ことばの かず   par … さいしょうの ことば数（★3）
   sol … 作った人が 用意した こたえ（テストで 本当に クリアできるか 毎回 たしかめる）   */
(function(root){
    function G(x0, x1, y){ return [(x0 + x1) / 2, y + 150, x1 - x0, 300, 0]; }       // 上の面が y の じめん
    function B(x0, x1, y0, y1){ return [(x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0]; }   // 四角いかたまり
    var T = function(ja, en, zh, ko){ return {ja: ja, en: en, zh: zh, ko: ko}; };
    var S = [];
    function add(o){ o.id = S.length + 1; S.push(o); }

    // ===== 1〜6：はじまりの草原 =====
    add({world: 1, name: T("はしを かけよう", "Build a Bridge", "搭一座桥", "다리를 놓자"), hint: T("すきまが ひろいね。ながい「はし」が あれば わたれそう。", "The gap is wide. A long \"bridge\" should do it.", "缺口很宽，写一个又长的「桥」吧。", "틈이 넓어요. 긴 \"다리\"가 필요해요."),
        star: {x: 70, y: 314, vx: 4}, goal: {x: 830, y: 306, w: 100, h: 68}, statics: [G(0, 250, 340), G(470, 960, 340)], limit: 2,
        sol: [{w: "おおきい はし", x: 360, y: 332, a: 0}]});
    add({world: 1, name: T("すべりだいで ジャンプ", "Slide Away", "滑下去", "미끄럼틀로 점프"), hint: T("たかい ところから おちるよ。「すべりだい」を ななめに おいてみよう。", "You'll drop from a ledge. Try a tilted \"slide\".", "会从高处掉下去，斜着放一个「滑梯」。", "높은 곳에서 떨어져요. \"미끄럼틀\"을 기울여 놓아요."),
        star: {x: 70, y: 194, vx: 2}, goal: {x: 800, y: 406, w: 110, h: 68}, statics: [G(0, 260, 220), G(480, 960, 440), B(930, 960, 340, 440)], limit: 2,
        sol: [{w: "すべりだい", x: 350, y: 300, a: 22}]});
    add({world: 1, name: T("ばねで ぴょーん", "Spring Up", "弹簧起飞", "스프링으로 점프"), hint: T("おちた ほしを「ばね」で うえに はじこう。", "Bounce the falling star up with a \"spring\".", "用「弹簧」把掉下来的星星弹上去。", "떨어지는 별을 \"스프링\"으로 튕겨 올려요."),
        star: {x: 70, y: 194, vx: 2}, goal: {x: 830, y: 226, w: 110, h: 68}, statics: [G(0, 170, 220), G(0, 960, 480), G(390, 960, 252), B(930, 960, 150, 252)], limit: 2,
        sol: [{w: "ばね", x: 246, y: 470, a: 0}]});
    add({world: 1, name: T("かぜに のろう", "Ride the Wind", "乘风而行", "바람을 타자"), hint: T("かべが じゃま。「かぜ」を うえむきに ふかせて ほしを もちあげよう。", "A wall blocks the way. Blow the star up and over with \"wind\".", "有墙挡路，用向上的「风」把星星吹过去。", "벽이 막고 있어요. \"바람\"을 위로 불게 해요."),
        star: {x: 70, y: 414, vx: 3}, goal: {x: 830, y: 406, w: 110, h: 68}, statics: [G(0, 960, 440), B(480, 520, 290, 440), B(930, 960, 340, 440)], limit: 2,
        sol: [{w: "つよい かぜ", x: 440, y: 380, a: -90}]});
    add({world: 1, name: T("ふうせんで ふわり", "Balloon Lift", "气球升空", "풍선으로 둥실"), hint: T("ほしの とおり道に「ふうせん」を おくと、ほしが ふわっと うかぶよ。てんじょうの ななめを すべって ゴールへ！", "Put a \"balloon\" in the star's path. It floats up and slides along the slanted roof to the goal.", "在星星必经之路放一个「气球」，星星会飘起来，沿着斜顶滑向终点。", "별이 지나가는 길에 \"풍선\"을 놓으면 떠올라 비스듬한 천장을 따라 골로 가요."),
        star: {x: 70, y: 414, vx: 2.5}, goal: {x: 800, y: 70, w: 150, h: 140}, statics: [G(0, 960, 440), [480, 150, 520, 20, -20]], limit: 2,
        sol: [{w: "ふうせん", x: 330, y: 414, a: 0}]});
    add({world: 1, name: T("ばくだんで ドカン", "Blast Off", "炸弹发射", "폭탄으로 쾅"), hint: T("ほしの そばで「ばくだん」が ばくはつ！「つよい」を つけると ちからも つよく なるよ。", "A \"bomb\" blast launches the star. Add \"strong\" to power it up.", "在星星旁边放「炸弹」，加上「强」威力更大。", "별 옆에서 \"폭탄\"이 터져요. \"강한\"을 붙이면 더 세져요."),
        star: {x: 70, y: 324, vx: 0}, goal: {x: 800, y: 326, w: 120, h: 80}, statics: [G(0, 250, 340), G(300, 960, 340), B(930, 960, 290, 340)], limit: 2,
        sol: [{w: "つよい ばくだん", x: 40, y: 326, a: 0}]});


    // ===== 7〜：ふしぎの谷 =====
    add({world: 2, name: T("ひで もやそう", "Burn It Down", "烧掉它", "불태우자"), hint: T("きの かべが とおせんぼ。「ひ」で もやしちゃおう！", "A wooden wall blocks you. Burn it with \"fire\"!", "木墙挡住了去路，用「火」烧掉它！", "나무 벽이 막고 있어요. \"불\"로 태워요!"),
        star: {x: 70, y: 414, vx: 3}, goal: {x: 810, y: 406, w: 110, h: 68}, statics: [G(0, 960, 440), B(930, 960, 340, 440)],
        preset: [{w: "おおきい はし", x: 500, y: 330, a: 90, fixed: 1}], limit: 2,
        sol: [{w: "ひ", x: 500, y: 410, a: 0}]});
    add({world: 2, name: T("みずで うかぼう", "Float Up", "浮上来", "물에 떠오르자"), hint: T("あなに おちて でられない！「おおきい みず」で ほしを うかせて、「かぜ」で おしだそう。", "Stuck in a pit! Float up with big \"water\", then push out with \"wind\".", "掉进坑里了！用大「水」浮起来，再用「风」吹出去。", "구덩이에 빠졌어요! 큰 \"물\"로 띄우고 \"바람\"으로 밀어요."),
        star: {x: 70, y: 284, vx: 2.5}, goal: {x: 820, y: 266, w: 110, h: 68}, statics: [G(0, 200, 300), G(200, 640, 480), G(640, 960, 300), B(930, 960, 200, 300)], limit: 3,
        sol: [{w: "おおきい みず", x: 420, y: 370, a: 0}, {w: "かぜ", x: 420, y: 230, a: 0}]});
    add({world: 2, name: T("たいほうで ドーン", "Cannon Shot", "大炮发射", "대포로 쾅"), hint: T("ほしが ころがる みちに「たいほう」を ななめに おくと、ほしを うちあげてくれるよ。", "Place a \"cannon\" at an angle where the star rolls. It will fire the star up.", "在星星滚动的路上斜着放一门「大炮」，它会把星星发射出去。", "별이 굴러가는 길에 \"대포\"를 비스듬히 놓으면 쏘아 줘요."),
        star: {x: 70, y: 414, vx: 3}, goal: {x: 820, y: 216, w: 120, h: 68}, statics: [G(0, 960, 440), G(600, 960, 250), B(930, 960, 150, 250)], limit: 2,
        sol: [{w: "たいほう", x: 300, y: 420, a: -60}]});
    add({world: 2, name: T("ロケットで ビュン", "Rocket Boost", "火箭加速", "로켓으로 슝"), hint: T("ほしの うしろに「ロケット」を おいて、むこうの だいちまで とばそう！", "Put a \"rocket\" behind the star and blast it to the far land!", "在星星后面放「火箭」，把它送到对面的高地！", "별 뒤에 \"로켓\"을 놓아 건너편으로 날려요!"),
        star: {x: 150, y: 324, vx: 0}, goal: {x: 740, y: 346, w: 120, h: 68}, statics: [G(0, 260, 340), G(390, 960, 380), B(930, 960, 280, 380)], limit: 2,
        sol: [{w: "ロケット", x: 100, y: 326, a: 0}]});


    // ===== 11〜：ふしぎの谷（つづき） =====
    add({world: 2, name: T("じしゃくで ひきよせろ", "Magnet Pull", "磁铁吸引", "자석으로 끌어당겨"), hint: T("ほしは てつで できているよ。「じしゃく」を ゴールの ちかくに おいてみよう。", "The star is made of iron. Put a \"magnet\" near the goal!", "星星是铁做的。在终点附近放一块「磁铁」吧！", "별은 철로 되어 있어요. 골 근처에 \"자석\"을 놓아요!"),
        star: {x: 70, y: 414, vx: 3}, goal: {x: 600, y: 300, w: 150, h: 140}, statics: [G(0, 960, 440)], limit: 2, sol: [{w: "じしゃく", x: 560, y: 340, a: 0}]});
    add({world: 2, name: T("トランポリンで たかく", "Trampoline Hop", "蹦床高跳", "트램펄린 점프"), hint: T("おちた いきおいを つかって、たかい だいちへ。「トランポリン」を ななめに おいて、まえへ はずもう！", "Use the fall to reach the high land. Tilt a \"trampoline\" so it bounces you forward!", "利用下落的冲力跳上高台。把「蹦床」斜着放，向前弹出去！", "떨어지는 힘으로 높은 곳까지! \"트램펄린\"을 비스듬히 놓아 앞으로 튕겨요!"),
        star: {x: 70, y: 124, vx: 2.4}, goal: {x: 820, y: 216, w: 120, h: 68}, statics: [G(0, 220, 150), G(0, 960, 440), G(640, 960, 250), B(930, 960, 150, 250)], limit: 2, sol: [{w: "トランポリン", x: 260, y: 340, a: 22}]});
    add({world: 2, name: T("ようがんを わたれ", "Over the Lava", "跨过熔岩", "용암을 건너라"), hint: T("あつい ようがんの いけ！ ながい「はし」を かけて わたろう。", "A pool of hot lava! Lay a long \"bridge\" across.", "炽热的熔岩池！架一座长长的「桥」吧。", "뜨거운 용암 연못! 긴 \"다리\"를 놓아 건너요."),
        star: {x: 70, y: 314, vx: 3}, goal: {x: 830, y: 306, w: 100, h: 68}, statics: [G(0, 250, 340), G(550, 960, 340)], lava: [[400, 505, 300, 130]], limit: 2, sol: [{w: "おおきい ぼう", x: 400, y: 332, a: 0}]});
    add({world: 2, name: T("ひとつ おいて もやす", "Bridge and Burn", "架桥再点火", "다리 놓고 불 붙이기"), hint: T("ようがんの むこうに、きの かべ。はしを かけて、「ひ」で かべを もやそう。", "Lava, then a wooden wall. Bridge it, then burn the wall with \"fire\".", "熔岩对面还有木墙。先架桥，再用「火」烧墙。", "용암 건너에 나무 벽. 다리를 놓고 \"불\"로 벽을 태워요."),
        star: {x: 70, y: 314, vx: 3}, goal: {x: 850, y: 306, w: 100, h: 68}, statics: [G(0, 250, 340), G(550, 960, 340)], lava: [[400, 505, 300, 130]],
        preset: [{w: "おおきい はし", x: 720, y: 240, a: 90, fixed: 1}], limit: 3, sol: [{w: "おおきい ぼう", x: 400, y: 332, a: 0}, {w: "ひ", x: 720, y: 300, a: 0}]});

    root.WCStages = S;
    if(typeof module !== "undefined" && module.exports) module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
