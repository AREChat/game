"use strict";
// ポコポコ太鼓：曲のデータと、譜面（ふめん）・音楽の自動づくり。画面にはさわらない（node でも試せる）
// 曲も譜面も、このファイルの決まりから 自動で作ります。既存の曲や作品は まったく使っていません。
(function(root){
    var DIFFS = [
        {id: 0, color: "#e87a3a", key: "easy"}, {id: 1, color: "#6cbf4a", key: "normal"},
        {id: 2, color: "#e8508a", key: "hard"}, {id: 3, color: "#9a4ae8", key: "oni"}
    ];
    var SONGS = [
        {id: "s1", color: "#f0a43a", bpm: 100, bars: 32, seed: 11, root: 57, scale: [0, 2, 4, 7, 9], prog: [0, 5, 3, 4],
         name: {ja: "ぽかぽか朝ごはん", en: "Sunny Breakfast", zh: "暖洋洋的早餐", ko: "따끈따끈 아침밥"}, stars: [1, 2, 3, 4]},
        {id: "s2", color: "#4ab0e8", bpm: 120, bars: 32, seed: 23, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3],
         name: {ja: "雲の上のおまつり", en: "Festival Above the Clouds", zh: "云端上的庙会", ko: "구름 위의 축제"}, stars: [2, 3, 4, 5]},
        {id: "s3", color: "#e86a9a", bpm: 136, bars: 32, seed: 37, root: 55, scale: [0, 3, 5, 7, 10], prog: [0, 3, 4, 0],
         name: {ja: "ネコ缶ステップ", en: "Cat Can Step", zh: "猫罐头舞步", ko: "고양이 통조림 스텝"}, stars: [2, 4, 6, 7]},
        {id: "s4", color: "#7a5ae8", bpm: 150, bars: 32, seed: 41, root: 62, scale: [0, 2, 3, 7, 8], prog: [0, 5, 2, 4],
         name: {ja: "星くず祭りばやし", en: "Stardust Parade", zh: "星尘祭典乐", ko: "별가루 축제 가락"}, stars: [3, 5, 7, 8]},
        {id: "s5", color: "#d83a3a", bpm: 172, bars: 32, seed: 59, root: 52, scale: [0, 1, 4, 5, 7, 8, 11], prog: [0, 0, 3, 4],
         name: {ja: "鬼ヶ島の宴", en: "Banquet of Ogre Isle", zh: "鬼岛的盛宴", ko: "도깨비섬의 잔치"}, stars: [4, 6, 8, 10]}
    ];
    // ぎじ乱数（同じ曲・同じ むずかしさ なら、いつも同じ譜面になる）
    function rng(seed){ var s = (seed >>> 0) || 1; return function(){ s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
    function beatSec(song){ return 60 / song.bpm; }
    // 譜面：[{t, type:"d"|"k"|"D"|"K"|"r", end?}]   d=赤 k=青 D・K=大きい音符 r=連打
    function makeChart(song, diff){
        var R = rng(song.seed * 131 + diff * 977 + 7), bs = beatSec(song), step = bs / 4, bar = bs * 4, notes = [];
        // むずかしさごとの「その拍にたたく見こみ」（16分音符の16マス）
        var dens = [
            [0.95, 0, 0, 0, 0.55, 0, 0, 0, 0.8, 0, 0, 0, 0.55, 0, 0, 0],
            [0.98, 0, 0.25, 0, 0.8, 0, 0.45, 0, 0.9, 0, 0.3, 0, 0.8, 0, 0.5, 0],
            [0.98, 0, 0.7, 0.1, 0.9, 0, 0.7, 0.15, 0.95, 0, 0.7, 0.1, 0.9, 0, 0.75, 0.2],
            [0.98, 0.35, 0.8, 0.4, 0.95, 0.35, 0.8, 0.45, 0.98, 0.35, 0.8, 0.4, 0.95, 0.4, 0.85, 0.55]
        ][diff];
        var lead = 2;                                        // さいしょの 2小節は、音楽だけ（じゅんび）
        for(var b = lead; b < song.bars - 1; b++){
            var phrase = b % 8, isRollBar = (b % 8 === 7) && b > 8 && diff >= 0;
            var last = -1;
            for(var s = 0; s < 16; s++){
                if(isRollBar && s >= 8) break;
                var p = dens[s] * (phrase === 0 && b > lead ? 0.8 : 1) * (b < lead + 2 ? 0.7 : 1);
                if(R() > p) continue;
                var onBeat = s % 4 === 0;
                var type = onBeat ? (R() < 0.7 ? "d" : "k") : (R() < 0.55 ? "k" : "d");
                if(s === 0 && phrase === 0) type = "d";
                if(last >= 0 && s - last === 1 && diff < 3 && R() < 0.6) continue;   // かんたんでは、ならびすぎを さける
                notes.push({t: b * bar + s * step, type: type}); last = s;
            }
            // フレーズのさいごの はじめは 大きい音符
            if(phrase === 6 && diff >= 1){ var bi = notes.length - 1; if(bi >= 0 && notes[bi].t >= b * bar) notes[bi].type = notes[bi].type === "d" ? "D" : "K"; }
            if(isRollBar){ notes.push({t: b * bar + 8 * step, type: "r", end: b * bar + 16 * step - step * 0.5}); }
        }
        // さいごの 大きな「ドン！」
        notes.push({t: (song.bars - 1) * bar, type: "D"});
        notes.sort(function(a, c){ return a.t - c.t; });
        // かさなりの そうじ（連打の中の音符は のぞく）
        var out = [];
        notes.forEach(function(n){
            var prev = out.length ? out[out.length - 1] : null;
            if(prev && prev.type === "r" && n.t <= prev.end + 0.05) return;
            if(prev && n.t - prev.t < step * 0.9 && prev.type !== "r") return;
            out.push(n);
        });
        return out;
    }
    // 音楽：[{t, k:"bass"|"lead"|"hat"|"kick"|"chord", f?, d}]  （曲の はじまりを 0 秒として）
    function makeMusic(song){
        var R = rng(song.seed * 71 + 3), bs = beatSec(song), step = bs / 2, ev = [];
        function midi(n){ return 440 * Math.pow(2, (n - 69) / 12); }
        var sc = song.scale, nSc = sc.length;
        function degNote(deg, oct){ var o = Math.floor(deg / nSc), i = ((deg % nSc) + nSc) % nSc; return song.root + sc[i] + 12 * (o + oct); }
        var melody = [], i;
        for(i = 0; i < 8; i++) melody.push(Math.floor(R() * nSc) + (R() < 0.3 ? nSc : 0));   // 1フレーズ（8つ）の 旋律のもと
        for(var b = 0; b < song.bars; b++){
            var root = song.prog[Math.floor(b / 2) % song.prog.length];
            var bt = b * bs * 4;
            ev.push({t: bt, k: "bass", f: midi(degNote(root, -1)), d: bs * 1.6});
            ev.push({t: bt + bs * 2, k: "bass", f: midi(degNote(root + 2, -1)), d: bs * 1.6});
            if(b % 2 === 0) ev.push({t: bt, k: "chord", f: [midi(degNote(root, 0)), midi(degNote(root + 2, 0)), midi(degNote(root + 4, 0))], d: bs * 7.5});
            for(var h = 0; h < 8; h++) ev.push({t: bt + h * step, k: "hat", d: step * 0.3, v: h % 2 ? 0.5 : 1});
            for(var q = 0; q < 4; q++) ev.push({t: bt + q * bs, k: "kick", d: 0.2});
            if(b >= 2 && b < song.bars - 1){
                for(var m = 0; m < 8; m++){
                    var deg = melody[(m + (b % 4 >= 2 ? 3 : 0)) % 8] + root;
                    if(m % 2 === 1 && R() < 0.35) continue;
                    ev.push({t: bt + m * step, k: "lead", f: midi(degNote(deg, 1)), d: step * 0.9});
                }
            }
        }
        ev.push({t: (song.bars - 1) * bs * 4, k: "chord", f: [midi(degNote(0, 0)), midi(degNote(2, 0)), midi(degNote(4, 0))], d: bs * 3});
        ev.sort(function(a, c){ return a.t - c.t; });
        return ev;
    }
    var api = {DIFFS: DIFFS, SONGS: SONGS, makeChart: makeChart, makeMusic: makeMusic, rng: rng};
    if(typeof module !== "undefined" && module.exports) module.exports = api; else root.PKSongs = api;
})(typeof window !== "undefined" ? window : globalThis);
