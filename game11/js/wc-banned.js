"use strict";
/* ことばクラフト：つかえない ことば（虫の なまえ）。ここに ならべるのが しごとの ファイルです。
   打たれた ことばに ふくまれていたら つくらずに「このことばは つかえません」と 出します。 */
(function(root){
    var LIST = [
        "ちょうちょ", "ちょうちょう", "ちょう", "はち", "あり", "ありんこ", "くも", "ごきぶり", "むかで", "むし", "かぶとむし", "くわがた", "てんとうむし", "とんぼ", "ばった", "かまきり", "せみ", "ほたる", "はえ", "か", "いもむし", "けむし", "みつばち", "こおろぎ", "すずむし", "だんごむし", "なめくじ", "かたつむり", "みみず", "さそり", "たいこ虫",
        "虫", "蝶", "蛾", "蜂", "蟻", "蜘蛛", "蚊", "蝿", "蝉", "蛍", "蜻蛉", "蜥蜴", "百足", "芋虫", "毛虫", "昆虫", "蠍",
        "butterfly", "moth", "bee", "wasp", "ant", "spider", "cockroach", "roach", "centipede", "bug", "insect", "beetle", "ladybug", "ladybird", "dragonfly", "grasshopper", "cicada", "firefly", "mosquito", "fly", "caterpillar", "worm", "snail", "slug", "scorpion", "cricket", "termite",
        "蝴蝶", "蜜蜂", "蚂蚁", "蟑螂", "蜈蚣", "甲虫", "瓢虫", "蜻蜓", "蚱蜢", "知了", "萤火虫", "蚊子", "苍蝇", "毛毛虫", "蜗牛", "蛞蝓", "蝎子", "蟋蟀", "白蚁", "虫子",
        "나비", "벌", "개미", "거미", "바퀴벌레", "지네", "벌레", "곤충", "딱정벌레", "무당벌레", "잠자리", "메뚜기", "매미", "반딧불", "모기", "파리", "애벌레", "달팽이", "민달팽이", "전갈", "귀뚜라미", "흰개미"
    ];
    // 1〜2文字の ことば（か・あり・ant・fly・벌 など）は 他の ことばの 一部に なりやすいので、「ことば全体が それ」のときだけ ことわる
    function norm(s){ return String(s || "").normalize("NFKC").toLowerCase().replace(/[\s　・,.、。!！?？'"「」]/g, "").replace(/[ァ-ヶ]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 96); }); }
    function banned(text){
        var t = norm(text); if(!t) return false;
        for(var i = 0; i < LIST.length; i++){
            var w = norm(LIST[i]);
            if(w.length <= 2){ if(t === w) return true; }
            else if(/^[a-z]+$/.test(w)){ if(t === w || t.indexOf(w) >= 0 && w.length >= 5) return true; if(t.indexOf(w) === 0 && w.length === 4 && t.length <= 6) return true; }
            else if(t.indexOf(w) >= 0) return true;
        }
        return false;
    }
    root.WCBanned = {banned: banned, norm: norm};
    if(typeof module !== "undefined" && module.exports) module.exports = root.WCBanned;
})(typeof window !== "undefined" ? window : globalThis);
