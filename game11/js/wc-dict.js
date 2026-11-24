"use strict";
/* ことばクラフト：ことば → もの の 辞書 とパーサー
   ・「なまえことば」（はし・いし・かぜ…）と「せいしつことば」（おおきい・おもい・つるつる…）を 日・英・中・韓 で 登録
   ・打たれた ことばを 左から 読んで、いちばん 長く 合う ものから 拾う（例：「おおきい いし」→ 大きい＋石）
   ・なまえことばが 1つも 見つからなければ「ふしぎもの」：文字の かず・にごり・ちいさい「ゃゅょっ」などで 性質が きまる
   Node でも ブラウザでも つかえる。 */
(function(root){
    var BAN = root.WCBanned || (typeof require !== "undefined" ? require("./wc-banned.js") : null);

    // ---- なまえことば ----
    // t: 形(circle/box)・大きさ・重さ・はずみ・すべり・ふるまい(kind)。 a0: 向きの初期値（度）
    var NOUNS = [
        {id: "plank", emoji: "🪵", ja: ["はし", "いた", "かけはし", "つりばし"], en: ["bridge", "board", "plank"], zh: ["桥", "木板", "板子"], ko: ["다리", "판자", "널빤지"],
            t: {shape: "box", w: 150, h: 9, ramped: 1, density: .0009, friction: .6, burn: 1, color: "#c98a4b"}},
        {id: "stick", emoji: "📏", ja: ["ぼう", "つえ", "えだ"], en: ["stick", "pole", "rod"], zh: ["棍子", "木棍", "杆"], ko: ["막대", "막대기", "지팡이"],
            t: {shape: "box", w: 230, h: 8, ramped: 1, density: .0009, friction: .5, burn: 1, color: "#b9794a"}},
        {id: "log", emoji: "🪵", ja: ["まるた", "きのみき"], en: ["log", "trunk"], zh: ["圆木", "原木"], ko: ["통나무"],
            t: {shape: "circle", r: 26, density: .0009, friction: .7, burn: 1, color: "#a8693a"}},
        {id: "stone", emoji: "🪨", ja: ["いし", "こいし"], en: ["stone", "pebble"], zh: ["石头", "石子"], ko: ["돌", "조약돌"],
            t: {shape: "circle", r: 24, density: .006, friction: .6, color: "#8d96a6"}},
        {id: "rock", emoji: "🪨", ja: ["いわ", "がんせき", "おもし"], en: ["rock", "boulder"], zh: ["岩石", "巨石"], ko: ["바위"],
            t: {shape: "circle", r: 44, density: .008, friction: .7, color: "#6f7788"}},
        {id: "box", emoji: "📦", ja: ["はこ", "ブロック", "つみき"], en: ["box", "block", "crate"], zh: ["箱子", "方块", "积木"], ko: ["상자", "블록"],
            t: {shape: "box", w: 62, h: 62, density: .0016, friction: .6, burn: 1, color: "#d8a458"}},
        {id: "iron", emoji: "🔩", ja: ["てつ", "てっきゅう", "おもり"], en: ["iron", "weight", "metal"], zh: ["铁", "铁球"], ko: ["철", "쇠공"],
            t: {shape: "circle", r: 20, density: .012, friction: .5, metal: 1, color: "#59606f"}},
        {id: "ice", emoji: "🧊", ja: ["こおり", "アイス"], en: ["ice"], zh: ["冰"], ko: ["얼음"],
            t: {shape: "box", w: 130, h: 12, ramped: 1, density: .0008, friction: .0, melt: 1, color: "#aee6ff"}},
        {id: "ramp", emoji: "🛝", ja: ["すべりだい", "さか", "スロープ"], en: ["slide", "ramp", "slope"], zh: ["滑梯", "斜坡"], ko: ["미끄럼틀", "경사로"],
            t: {shape: "box", w: 170, h: 14, fixed: 1, friction: .02, a0: -22, color: "#7ad0e8"}},
        {id: "spring", emoji: "🌀", ja: ["ばね", "スプリング"], en: ["spring"], zh: ["弹簧"], ko: ["스프링", "용수철"],
            t: {shape: "box", w: 78, h: 18, fixed: 1, kind: "spring", boost: .9, kick: 3.5, color: "#ff7ab8"}},
        {id: "trampoline", emoji: "🎪", ja: ["トランポリン", "はずみ"], en: ["trampoline"], zh: ["蹦床"], ko: ["트램펄린"],
            t: {shape: "box", w: 150, h: 14, fixed: 1, kind: "spring", boost: .98, kick: 2, color: "#ffb347"}},
        {id: "wind", emoji: "💨", ja: ["かぜ", "そよかぜ", "あらし"], en: ["wind", "breeze", "gust"], zh: ["风", "微风"], ko: ["바람"],
            t: {shape: "zone", w: 230, h: 150, kind: "wind", acc: .0012, color: "#cfefff"}},
        {id: "fan", emoji: "🌬️", ja: ["せんぷうき", "ファン"], en: ["fan"], zh: ["风扇", "电扇"], ko: ["선풍기", "팬"],
            t: {shape: "box", w: 40, h: 44, fixed: 1, kind: "fan", zw: 300, zh: 90, acc: .0018, color: "#9bb0c9"}},
        {id: "balloon", emoji: "🎈", ja: ["ふうせん", "ふうせんだま"], en: ["balloon"], zh: ["气球"], ko: ["풍선"],
            t: {shape: "circle", r: 22, density: .0002, restitution: .5, kind: "balloon", air: .12, lift: 1.0e-6, color: "#ff5d7a"}},
        {id: "rocket", emoji: "🚀", ja: ["ロケット"], en: ["rocket"], zh: ["火箭"], ko: ["로켓"],
            t: {shape: "box", w: 70, h: 26, density: .0012, friction: 0, kind: "rocket", acc: .0013, burn: 1, color: "#f4f6ff"}},
        {id: "bomb", emoji: "💣", ja: ["ばくだん", "ばくはつ", "ダイナマイト"], en: ["bomb", "dynamite", "explosion"], zh: ["炸弹", "爆炸"], ko: ["폭탄", "다이너마이트"],
            t: {shape: "circle", r: 17, density: .004, kind: "bomb", fuse: 100, power: 9, rad: 190, color: "#2f2f3a"}},
        {id: "fire", emoji: "🔥", ja: ["ひ", "ほのお", "たきび"], en: ["fire", "flame"], zh: ["火", "火焰"], ko: ["불", "화염"],
            t: {shape: "zone", w: 96, h: 80, kind: "fire", color: "#ff8a2a"}},
        {id: "water", emoji: "💧", ja: ["みず", "うみ", "かわ", "いけ"], en: ["water", "sea", "pond", "river"], zh: ["水", "海", "池塘"], ko: ["물", "바다", "연못"],
            t: {shape: "zone", w: 240, h: 160, kind: "water", color: "#3aa7ff"}},
        {id: "magnet", emoji: "🧲", ja: ["じしゃく", "マグネット"], en: ["magnet"], zh: ["磁铁"], ko: ["자석"],
            t: {shape: "box", w: 44, h: 44, fixed: 1, kind: "magnet", pull: .0021, rad: 300, color: "#e0423a"}},
        {id: "feather", emoji: "🪶", ja: ["はね", "とりのはね"], en: ["feather"], zh: ["羽毛"], ko: ["깃털"],
            t: {shape: "circle", r: 15, density: .00008, restitution: .3, air: .045, color: "#f2f2ff"}},
        {id: "swing", emoji: "🪢", ja: ["ぶらんこ", "ブランコ"], en: ["swing"], zh: ["秋千"], ko: ["그네"],
            t: {shape: "box", w: 140, h: 14, density: .0012, friction: .8, kind: "swing", rope: 150, color: "#e8b05a"}},
        {id: "seesaw", emoji: "⚖️", ja: ["シーソー", "てんびん"], en: ["seesaw", "scale"], zh: ["跷跷板", "天平"], ko: ["시소", "저울"],
            t: {shape: "box", w: 240, h: 14, density: .0012, friction: .8, kind: "seesaw", color: "#7fd18a"}},
        {id: "wheel", emoji: "🛞", ja: ["くるま", "しゃりん", "タイヤ"], en: ["wheel", "tire"], zh: ["车轮", "轮子"], ko: ["바퀴", "타이어"],
            t: {shape: "circle", r: 32, density: .0014, friction: .95, restitution: .2, color: "#3b3f4c"}},
        {id: "cannon", emoji: "🎯", ja: ["たいほう", "ランチャー"], en: ["cannon", "launcher"], zh: ["大炮", "发射器"], ko: ["대포", "발사기"],
            t: {shape: "box", w: 66, h: 40, fixed: 1, kind: "cannon", speed: 14, color: "#475066", a0: 0}},
        {id: "float", emoji: "☁️", ja: ["ふわふわ", "むじゅうりょく", "うちゅう"], en: ["float", "space"], zh: ["漂浮", "失重"], ko: ["둥둥", "무중력"],
            t: {shape: "zone", w: 200, h: 200, kind: "float", color: "#c7b8ff"}},
        {id: "glue", emoji: "🍯", ja: ["のり", "ガム"], en: ["glue", "gum"], zh: ["胶水", "粘胶"], ko: ["풀", "껌"],
            t: {shape: "box", w: 100, h: 20, density: .0014, friction: 7, restitution: 0, color: "#ffd66b"}},
        {id: "umbrella", emoji: "☂️", ja: ["かさ", "パラシュート"], en: ["umbrella", "parachute"], zh: ["伞", "降落伞"], ko: ["우산", "낙하산"],
            t: {shape: "box", w: 116, h: 9, density: .0005, air: .09, restitution: 0, friction: .8, burn: 1, color: "#6f8bff"}},
        {id: "bird", emoji: "🐦", ja: ["とり", "ことり"], en: ["bird"], zh: ["鸟", "小鸟"], ko: ["새"],
            t: {shape: "circle", r: 17, density: .0004, restitution: .3, kind: "bird", fly: 2.6, color: "#58b6ff"}},
        {id: "ball", emoji: "⚽", ja: ["ボール", "たま"], en: ["ball"], zh: ["球"], ko: ["공"],
            t: {shape: "circle", r: 21, density: .0015, restitution: .86, friction: .3, color: "#ffffff"}},
        {id: "domino", emoji: "🁢", ja: ["ドミノ"], en: ["domino"], zh: ["多米诺"], ko: ["도미노"],
            t: {shape: "box", w: 16, h: 84, density: .0018, friction: .5, color: "#f2f2f8"}}
    ];

    // ---- せいしつことば ----
    var MODS = [
        {id: "big", ja: ["おおきい", "おおきな", "でっかい", "でかい", "きょだい", "巨大", "大きい", "大きな", "大"], en: ["big", "large", "huge", "giant"], zh: ["大", "巨大", "大的"], ko: ["큰", "거대한", "커다란"], label: "↑大"},
        {id: "small", ja: ["ちいさい", "ちいさな", "ちっちゃい", "ちいさめ", "小さい", "小さな", "小"], en: ["small", "tiny", "little", "mini"], zh: ["小", "小的", "迷你"], ko: ["작은", "조그만", "미니"], label: "↓小"},
        {id: "heavy", ja: ["おもい", "おもたい", "ずっしり", "重い"], en: ["heavy"], zh: ["重", "沉重"], ko: ["무거운", "묵직한"], label: "重"},
        {id: "light", ja: ["かるい", "ふわっと", "軽い"], en: ["light", "lightweight"], zh: ["轻", "轻的"], ko: ["가벼운"], label: "軽"},
        {id: "slick", ja: ["つるつる", "すべる", "すべすべ"], en: ["slippery", "slick", "smooth"], zh: ["滑", "光滑"], ko: ["미끄러운", "매끈한"], label: "滑"},
        {id: "sticky", ja: ["ねばねば", "べたべた", "くっつく"], en: ["sticky"], zh: ["粘", "黏"], ko: ["끈적한", "끈끈한"], label: "粘"},
        {id: "bouncy", ja: ["はずむ", "ぽよぽよ", "ぷにぷに", "ぼよんぼよん"], en: ["bouncy", "springy"], zh: ["弹", "有弹性"], ko: ["통통", "탄력"], label: "弾"},
        {id: "hot", ja: ["あつい", "あっつい", "ほのおの", "もえる"], en: ["hot", "burning", "flaming"], zh: ["热", "燃烧"], ko: ["뜨거운", "불타는"], label: "熱"},
        {id: "strong", ja: ["つよい", "きょうりょく", "パワフル"], en: ["strong", "powerful"], zh: ["强", "强力"], ko: ["강한", "강력한"], label: "強"},
        {id: "long", ja: ["ながい", "のびる", "ロング"], en: ["long"], zh: ["长", "长的"], ko: ["긴", "기다란"], label: "長"}
    ];

    function norm(s){
        return String(s || "").normalize("NFKC").toLowerCase().replace(/[\s　・,.、。!！?？'"「」~〜ー-]/g, "").replace(/[ァ-ヶ]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 96); });
    }
    // 「ー」は のばす音なので 辞書の ことばからも 消して あわせる（ロケット→ろけっと）
    var TOK = [];
    NOUNS.forEach(function(n){ ["ja", "en", "zh", "ko"].forEach(function(l){ (n[l] || []).forEach(function(w){ var k = norm(w); if(k) TOK.push({k: k, type: "n", id: n.id}); }); }); });
    MODS.forEach(function(m){ ["ja", "en", "zh", "ko"].forEach(function(l){ (m[l] || []).forEach(function(w){ var k = norm(w); if(k) TOK.push({k: k, type: "m", id: m.id}); }); }); });
    TOK.sort(function(a, b){ return b.k.length - a.k.length; });
    var NMAP = {}, MMAP = {}; NOUNS.forEach(function(n){ NMAP[n.id] = n; }); MODS.forEach(function(m){ MMAP[m.id] = m; });

    function hash(s){ var h = 2166136261; for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

    /** ことばを 読む → {noun, mods, ratio, key} */
    function parse(text){
        var k = norm(text), i = 0, nouns = [], mods = [], matched = 0, lastTokLen = 0;
        while(i < k.length){
            var hit = null;
            for(var j = 0; j < TOK.length; j++){ var tk = TOK[j]; if(k.substr(i, tk.k.length) === tk.k){ hit = tk; break; } }
            if(hit){ if(hit.type === "n"){ nouns.push(hit.id); lastTokLen = hit.k.length; } else if(mods.indexOf(hit.id) < 0) mods.push(hit.id); matched += hit.k.length; i += hit.k.length; }
            else i++;
        }
        var ratio = k.length ? matched / k.length : 0, noun = null;
        if(nouns.length && ratio >= .55 && (lastTokLen >= 2 || matched === k.length)) noun = nouns[nouns.length - 1];
        return {noun: noun, mods: mods, ratio: ratio, key: k};
    }

    /** ことば → ものの 設計図（spec）。 空・つかえない ことば は null */
    function make(text){
        var raw = String(text || "").trim().slice(0, 14);
        if(!raw) return {err: "empty"};
        if(BAN && BAN.banned(raw)) return {err: "banned"};
        var p = parse(raw), n = p.noun ? NMAP[p.noun] : null, t, generic = false;
        if(n) t = JSON.parse(JSON.stringify(n.t));
        else{
            generic = true;
            var chars = Array.from(p.key), len = Math.max(1, chars.length), h = hash(p.key);
            var dk = chars.filter(function(c){ return /[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ]/.test(c); }).length;
            var sm = chars.filter(function(c){ return /[ゃゅょっぁぃぅぇぉ]/.test(c) || /[!?]/.test(c); }).length;
            var sticky = chars.filter(function(c){ return /[なにぬねのまみむめも]/.test(c); }).length;
            var shape = len <= 2 ? "circle" : len <= 4 ? "box" : "plank";
            var hue = h % 360;
            t = {shape: shape === "plank" ? "box" : shape, density: .0014 * (1 + dk * .7), restitution: Math.min(.9, .12 + sm * .28), friction: Math.max(.05, Math.min(1.2, .35 + sticky * .18 - sm * .06)), color: "hsl(" + hue + ",62%,62%)", generic: 1};
            if(shape === "circle"){ t.r = 16 + len * 7; }
            else if(shape === "box"){ t.w = 28 + len * 17; t.h = 40; }
            else{ t.w = Math.min(280, 30 + len * 21); t.h = 16; }
        }
        var m = p.mods, k;
        function sc(f){ if(t.shape === "circle") t.r = Math.round(t.r * f); else if(t.shape === "zone" || t.kind === "fan"){ t.w = Math.round(t.w * f); t.h = Math.round(t.h * f); if(t.zw){ t.zw = Math.round(t.zw * f); t.zh = Math.round(t.zh * f); } } else{ t.w = Math.round(t.w * f); t.h = Math.max(8, Math.round(t.h * (f > 1 ? Math.min(f, 1.15) : f))); } }
        if(m.indexOf("big") >= 0) sc(1.55);
        if(m.indexOf("small") >= 0) sc(.62);
        if(m.indexOf("long") >= 0 && t.shape === "box"){ t.w = Math.round(t.w * 1.7); }
        if(m.indexOf("heavy") >= 0) t.density = (t.density || .0014) * 4;
        if(m.indexOf("light") >= 0) t.density = (t.density || .0014) * .28;
        if(m.indexOf("slick") >= 0) t.friction = 0;
        if(m.indexOf("sticky") >= 0) t.friction = 6;
        if(m.indexOf("bouncy") >= 0){ t.restitution = .95; if(t.kind === "spring") t.boost = (t.boost || 1) * 1.25; }
        if(m.indexOf("hot") >= 0) t.hot = 1;
        if(m.indexOf("strong") >= 0){ ["acc", "lift", "pull", "power", "speed", "fly", "kick"].forEach(function(f){ if(t[f]) t[f] *= 1.6; }); }
        t.mods = m; t.label = raw; t.noun = p.noun; t.generic = generic;
        return {spec: t, parse: p, noun: n};
    }

    function nounName(id, lang){ var n = NMAP[id]; if(!n) return id; return (n[lang] && n[lang][0]) || n.ja[0]; }

    root.WCDict = {NOUNS: NOUNS, MODS: MODS, parse: parse, make: make, norm: norm, nounName: nounName, NMAP: NMAP, MMAP: MMAP};
    if(typeof module !== "undefined" && module.exports) module.exports = root.WCDict;
})(typeof window !== "undefined" ? window : globalThis);
