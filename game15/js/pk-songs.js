"use strict";
// ポコポコ太鼓：曲のデータと、譜面（ふめん）・音楽の自動づくり。画面にはさわらない（node でも試せる）
// 曲も譜面も、このファイルの決まりから 自動で作ります。既存の曲や作品は まったく使っていません。
(function(root){
    var DIFFS = [
        {id: 0, color: "#e87a3a", key: "easy"}, {id: 1, color: "#6cbf4a", key: "normal"},
        {id: 2, color: "#e8508a", key: "hard"}, {id: 3, color: "#9a4ae8", key: "oni"}
    ];
    var GENRES = [
        {id: "fes", color: "#f0a43a", name: {ja: "おまつり", en: "Festival", zh: "庙会", ko: "축제"}},
        {id: "pop", color: "#5ac8e8", name: {ja: "ポップ", en: "Pop", zh: "流行", ko: "팝"}},
        {id: "dance", color: "#e85aa8", name: {ja: "ダンス", en: "Dance", zh: "舞曲", ko: "댄스"}},
        {id: "rock", color: "#8a6ae8", name: {ja: "ロック", en: "Rock", zh: "摇滚", ko: "록"}},
        {id: "ogre", color: "#d83a3a", name: {ja: "おに", en: "Ogre", zh: "鬼", ko: "도깨비"}}
    ];
    // style：0=やさしい 1=バックビート 2=ダンス（アルペジオ）3=ぎょうれつ（まつり）
    var SONGS = [
        {id: "s1", genre: "pop", color: "#f0a43a", bpm: 100, bars: 32, seed: 11, root: 57, scale: [0, 2, 4, 7, 9], prog: [0, 5, 3, 4], style: 0,
         name: {ja: "ぽかぽか朝ごはん", en: "Sunny Breakfast", zh: "暖洋洋的早餐", ko: "따끈따끈 아침밥"}, stars: [1, 2, 3, 4]},
        {id: "s6", genre: "pop", color: "#7ad66a", bpm: 108, bars: 32, seed: 67, root: 59, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0], style: 0,
         name: {ja: "ひだまりスキップ", en: "Sunbeam Skip", zh: "阳光小跳步", ko: "햇살 스킵"}, stars: [1, 3, 4, 5]},
        {id: "s2", genre: "fes", color: "#4ab0e8", bpm: 120, bars: 40, seed: 23, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], style: 1,
         name: {ja: "雲の上のおまつり", en: "Festival Above the Clouds", zh: "云端上的庙会", ko: "구름 위의 축제"}, stars: [2, 3, 4, 5]},
        {id: "s9", genre: "fes", color: "#e8a24a", bpm: 116, bars: 40, seed: 97, root: 57, scale: [0, 2, 3, 7, 8], prog: [0, 0, 5, 4], style: 3,
         name: {ja: "つきよの ししまい", en: "Moonlit Lion Dance", zh: "月夜舞狮", ko: "달밤의 사자춤"}, stars: [2, 4, 5, 6]},
        {id: "s7", genre: "dance", color: "#e86a9a", bpm: 128, bars: 40, seed: 73, root: 58, scale: [0, 3, 5, 7, 10], prog: [0, 5, 3, 4], style: 2,
         name: {ja: "夜店のネオン", en: "Night Stall Neon", zh: "夜市霓虹", ko: "야시장 네온"}, stars: [2, 4, 6, 7]},
        {id: "s3", genre: "dance", color: "#e86aae", bpm: 136, bars: 40, seed: 37, root: 55, scale: [0, 3, 5, 7, 10], prog: [0, 3, 4, 0], style: 2,
         name: {ja: "ネコ缶ステップ", en: "Cat Can Step", zh: "猫罐头舞步", ko: "고양이 통조림 스텝"}, stars: [2, 4, 6, 7]},
        {id: "s8", genre: "rock", color: "#6a8ae8", bpm: 144, bars: 40, seed: 83, root: 52, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4], style: 1,
         name: {ja: "風鈴ロック", en: "Wind-Chime Rock", zh: "风铃摇滚", ko: "풍경 록"}, stars: [3, 5, 6, 8]},
        {id: "s4", genre: "fes", color: "#7a5ae8", bpm: 150, bars: 40, seed: 41, root: 62, scale: [0, 2, 3, 7, 8], prog: [0, 5, 2, 4], style: 3,
         name: {ja: "星くず祭りばやし", en: "Stardust Parade", zh: "星尘祭典乐", ko: "별가루 축제 가락"}, stars: [3, 5, 7, 8]},
        {id: "s5", genre: "ogre", color: "#d83a3a", bpm: 172, bars: 48, seed: 59, root: 52, scale: [0, 1, 4, 5, 7, 8, 11], prog: [0, 0, 3, 4], style: 1,
         name: {ja: "鬼ヶ島の宴", en: "Banquet of Ogre Isle", zh: "鬼岛的盛宴", ko: "도깨비섬의 잔치"}, stars: [4, 6, 8, 10]},
        {id: "s10", genre: "ogre", color: "#e8503a", bpm: 184, bars: 48, seed: 101, root: 50, scale: [0, 2, 3, 6, 7, 9, 10], prog: [0, 3, 0, 4], style: 2,
         name: {ja: "ターボちょうちん", en: "Turbo Lantern", zh: "极速灯笼", ko: "터보 초롱"}, stars: [4, 7, 9, 10]}
    ];
    // ぎじ乱数（同じ曲・同じ むずかしさ なら、いつも同じ譜面になる）
    function rng(seed){ var s = (seed >>> 0) || 1; return function(){ s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
    function beatSec(song){ return 60 / song.bpm; }
    // きょうの1曲：日づけから 毎日ちがう曲が できる（その日は だれでも おなじ）
    function daily(d){
        d = d || new Date(); var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(), R = rng(seed * 7 + 5);
        var scales = [[0, 2, 4, 7, 9], [0, 2, 4, 5, 7, 9, 11], [0, 3, 5, 7, 10], [0, 2, 3, 7, 8], [0, 2, 3, 5, 7, 8, 10]];
        var progs = [[0, 5, 3, 4], [0, 4, 5, 3], [0, 3, 4, 0], [0, 0, 5, 4], [0, 5, 2, 4]];
        var bpm = 100 + Math.floor(R() * 9) * 10, st = Math.floor(R() * 4), pick = Math.floor(R() * 5);
        var star = Math.min(8, Math.max(1, Math.round((bpm - 90) / 12)));
        return {id: "daily", genre: "pop", color: "#ffd24a", bpm: bpm, bars: 40, seed: seed, root: 50 + Math.floor(R() * 12), scale: scales[pick], prog: progs[Math.floor(R() * 5)], style: st, daily: true,
            name: {ja: "きょうの1曲（" + (d.getMonth() + 1) + "/" + d.getDate() + "）", en: "Today's Song (" + (d.getMonth() + 1) + "/" + d.getDate() + ")", zh: "今日一曲（" + (d.getMonth() + 1) + "/" + d.getDate() + "）", ko: "오늘의 한 곡 (" + (d.getMonth() + 1) + "/" + d.getDate() + ")"},
            stars: [Math.max(1, star - 3), Math.max(1, star - 1), star, star + 2]};
    }
    // 1小節（16マス）の ならびかた。「.」は やすみ。むずかしさごとに、やさしい順
    var PAT = [
        ["d...d...d...d...", "d.......k.......", "d...k...d...k...", "d.......d...k...", "d...d...k...k...", "d...k.......k...", "d.......k...d...", "d...d.......k..."],
        ["d...d...d...d...", "d...k...d...k...", "d.d.k...d.d.k...", "d...d.k.d...d.k.", "d.k.d.k.d.k.d.k.", "d.d.k.d.k...d.k.", "d.dkd.k.d.dkd.k.", "d.d.d.k.d.d.d.k."],
        ["d.d.k.d.d.d.k.d.", "dkd.dkd.dkd.dk.d", "d.dkd.dkd.k.d.k.", "ddk.ddk.ddk.dkdk", "d.dkdkd.k.dkdkd.", "dddkdddkdddkd.kk", "d.ddk.dkd.ddk.dk", "dkdkd.kdkdkd.dk."],
        ["dddkddkdddkddkdk", "dkdkdkdddkdkdkdd", "ddkkddkkddkkdkdk", "dkddkddkdkddkdkd", "dddkdkkdddkdkkdd", "dkkdkddkdkkdkddk", "dddddkkkdddddkkk", "dkdkkdkddkdkkdkd"]
    ];
    var FILL = ["d.......", "d.k.....", "dkdk....", "dkdkdkdk"];   // 4小節めの おわりの かざり（後ろ半分）
    // 譜面：[{t, type:"d"|"k"|"D"|"K"|"r"|"R"|"b", end?, need?}]
    //   d=赤 k=青 D・K=大きい音符 r=連打 R=大きい連打 b=風船（need回 たたくと われる）
    function makeChart(song, diff){
        var R = rng(song.seed * 131 + diff * 977 + 7), bs = beatSec(song), step = bs / 4, bar = bs * 4, notes = [], lead = 2;
        var pats = PAT[diff], nP = pats.length;
        function energy(b){ var ph = b % 8, base = [.15, .3, .35, .5, .5, .7, .85, 1][ph], g = b / song.bars; return Math.min(1, base * (.6 + .6 * g)); }
        function pick(e){ var i = Math.floor(e * (nP - 1) + R() * 2 - .5); return pats[Math.max(0, Math.min(nP - 1, i))]; }
        var A = null, B = null;
        for(var b = lead; b < song.bars - 1; b++){
            var e = energy(b), g4 = (b - lead) % 4;
            if(g4 === 0){ A = pick(e); B = pick(Math.min(1, e + .18)); }
            var pat = g4 === 2 ? B : A;
            if(g4 === 3 && FILL[diff]){ pat = A.slice(0, 8) + FILL[diff]; }
            if(b < lead + 2 && diff < 3) pat = pats[Math.min(1, nP - 1)];   // さいしょは やさしく
            var balloon = (b % 16 === 15) && b > 16 && diff >= 1, roll = (b % 8 === 7) && b >= 7 && !balloon;
            for(var s = 0; s < 16; s++){
                if((roll || balloon) && s < 8) continue;   // 連打・風船のあいだは あける
                var ch = pat.charAt(s); if(ch === ".") continue;
                // やさしい むずかしさでは、小さな ひと息（直前が すぐ となり）を さける
                notes.push({t: b * bar + s * step, type: ch});
            }
            if(roll){ var big = diff >= 2 && b % 16 === 7; notes.push({t: b * bar, type: big ? "R" : "r", end: b * bar + 8 * step - step * .4}); notes.push({t: b * bar + 8 * step, type: "D"}); }
            if(balloon){ notes.push({t: b * bar, type: "b", end: b * bar + 8 * step - step * .3, need: [0, 6, 9, 14][diff]}); notes.push({t: b * bar + 8 * step, type: "D"}); }
            // 8小節のはじめは、大きい音符
            if(b % 8 === 0 && diff >= 1){ for(var q = 0; q < notes.length; q++) if(Math.abs(notes[q].t - b * bar) < 1e-6 && (notes[q].type === "d" || notes[q].type === "k")) notes[q].type = notes[q].type === "d" ? "D" : "K"; }
            // 4小節の さいごの拍は、大きい音符に
            if(g4 === 3 && diff >= 1){ for(var w = notes.length - 1; w >= 0; w--){ if(notes[w].t < b * bar) break; if(notes[w].t < b * bar + 2 * step && notes[w].t >= b * bar && diff < 3) { } } }
        }
        notes.push({t: (song.bars - 1) * bar, type: "D"});
        notes.sort(function(a, c){ return a.t - c.t; });
        var out = [];
        notes.forEach(function(n){
            var prev = out.length ? out[out.length - 1] : null;
            if(prev && (prev.type === "r" || prev.type === "R" || prev.type === "b") && n.t <= prev.end + 0.05) return;
            if(prev && n.t - prev.t < step * 0.9 && prev.end === undefined) return;
            out.push(n);
        });
        return out;
    }
    function chartStats(ch){
        var n = 0, rolls = 0, balloons = 0; ch.forEach(function(x){ if(x.type === "r" || x.type === "R") rolls++; else if(x.type === "b") balloons++; else n++; });
        return {notes: n, rolls: rolls, balloons: balloons};
    }
    // 音楽：[{t, k:"bass"|"lead"|"hat"|"kick"|"snare"|"chord"|"arp"|"crash"|"click", f?, d}]  （曲の はじまりを 0 秒として）
    function makeMusic(song){
        var R = rng(song.seed * 71 + 3), bs = beatSec(song), step = bs / 2, ev = [], st = song.style || 0;
        function midi(n){ return 440 * Math.pow(2, (n - 69) / 12); }
        var sc = song.scale, nSc = sc.length;
        function degNote(deg, oct){ var o = Math.floor(deg / nSc), i = ((deg % nSc) + nSc) % nSc; return song.root + sc[i] + 12 * (o + oct); }
        var melody = [], i;
        for(i = 0; i < 8; i++) melody.push(Math.floor(R() * nSc) + (R() < 0.3 ? nSc : 0));
        var melodyB = []; for(i = 0; i < 8; i++) melodyB.push(Math.floor(R() * nSc) + (R() < 0.4 ? nSc : 0));
        for(var b = 0; b < song.bars; b++){
            var root = song.prog[Math.floor(b / 2) % song.prog.length], bt = b * bs * 4, last = b === song.bars - 1, intro = b < 2;
            // ベース
            if(st === 0){ ev.push({t: bt, k: "bass", f: midi(degNote(root, -1)), d: bs * 1.6}); ev.push({t: bt + bs * 2, k: "bass", f: midi(degNote(root + 2, -1)), d: bs * 1.6}); }
            else if(st === 1){ for(var q = 0; q < 8; q++) ev.push({t: bt + q * step, k: "bass", f: midi(degNote(root + (q % 4 === 2 ? 4 : 0), -1)), d: step * .8}); }
            else if(st === 2){ for(q = 0; q < 8; q++) if(q % 2 === 1 || q === 0) ev.push({t: bt + q * step, k: "bass", f: midi(degNote(root + (q === 5 ? 2 : 0), -1)), d: step * .7}); }
            else { ev.push({t: bt, k: "bass", f: midi(degNote(root, -1)), d: bs * .9}); ev.push({t: bt + bs, k: "bass", f: midi(degNote(root + 4, -1)), d: bs * .5}); ev.push({t: bt + bs * 2, k: "bass", f: midi(degNote(root, -1)), d: bs * .9}); ev.push({t: bt + bs * 3, k: "bass", f: midi(degNote(root + 4, -1)), d: bs * .5}); }
            if(b % 2 === 0) ev.push({t: bt, k: "chord", f: [midi(degNote(root, 0)), midi(degNote(root + 2, 0)), midi(degNote(root + 4, 0))], d: bs * 7.5});
            for(var h = 0; h < 8; h++) ev.push({t: bt + h * step, k: "hat", d: step * 0.3, v: h % 2 ? (st === 2 ? 1 : 0.5) : (st === 2 ? .4 : 1)});
            for(q = 0; q < 4; q++){ if(st === 3 && (q === 1 || q === 3)) continue; ev.push({t: bt + q * bs, k: "kick", d: 0.2}); }
            if(st >= 1 && !intro) for(q = 1; q < 4; q += 2) ev.push({t: bt + q * bs, k: "snare", d: .14});
            if(st === 3 && !intro) for(q = 0; q < 4; q++) if(q % 2 === 0) ev.push({t: bt + q * bs + bs * .5, k: "snare", d: .08});
            if(st === 2 && !intro) for(var a = 0; a < 16; a++) ev.push({t: bt + a * (bs / 4), k: "arp", f: midi(degNote(root + [0, 2, 4, 2][a % 4] + (a >= 8 ? 1 : 0), 1)), d: bs / 4 * .8});
            if(b >= 2 && !last){
                var mel = (Math.floor(b / 8) % 2) ? melodyB : melody;
                for(var m = 0; m < 8; m++){
                    var deg = mel[(m + (b % 4 >= 2 ? 3 : 0)) % 8] + root;
                    if(m % 2 === 1 && R() < 0.35) continue;
                    ev.push({t: bt + m * step, k: "lead", f: midi(degNote(deg, 1)), d: step * (st === 3 ? .6 : .9)});
                }
            }
            if(b % 8 === 0 && b > 0) ev.push({t: bt, k: "crash", d: .5});
        }
        ev.push({t: (song.bars - 1) * bs * 4, k: "chord", f: [midi(degNote(0, 0)), midi(degNote(2, 0)), midi(degNote(4, 0))], d: bs * 3});
        ev.push({t: (song.bars - 1) * bs * 4, k: "crash", d: 1});
        ev.sort(function(a, c){ return a.t - c.t; });
        return ev;
    }
    var api = {DIFFS: DIFFS, GENRES: GENRES, SONGS: SONGS, daily: daily, makeChart: makeChart, chartStats: chartStats, makeMusic: makeMusic, rng: rng};
    if(typeof module !== "undefined" && module.exports) module.exports = api; else root.PKSongs = api;
})(typeof window !== "undefined" ? window : globalThis);
