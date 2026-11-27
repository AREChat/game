// ===== 新アトラクションの きょく（ぜんぶ その場で 音を つくる／メロディも オリジナル）=====
//  mars    … 5びょうし の くりかえし と ブラス（ホルストの「火星」を イメージした クラシックふう）
//  jupiter … はずむ 2びょうし と ホルン（「木星」を イメージ）。ゆっくりな ところでは ひろい 旋律に かわる
//  sweets  … ポップな 4びょうし（ピコピコ ＋ ベル）  /  aurora … ひろがる ぼうけんの きょく（ストリングス ＋ ホルン）
//  のりものの はやさ（intensity 0〜1）で 楽器が ふえたり へったり する。
import {SONG, melodyAt, rootAt} from "./df-x-song.js";
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---- きょくの せっけい：bar(小節番号, つよさ, add) の中で add(楽器, 音の高さ(MIDI), ステップ, ながさ(ステップ), つよさ) を よぶ ----
const TH_MARS = [[60, 60, 63, 67, 63], [60, 60, 63, 67, 72], [68, 68, 72, 75, 72], [68, 68, 72, 70, 67], [65, 65, 68, 72, 68], [67, 67, 71, 74, 71], [72, 72, 75, 79, 75], [74, 74, 71, 71, 67]];
const TH_JUP = [[[67, 0, 2], [64, 2, 2], [67, 4, 2], [72, 6, 2]], [[69, 0, 2], [67, 2, 2], [64, 4, 2], [62, 6, 2]], [[65, 0, 2], [69, 2, 2], [72, 4, 2], [77, 6, 2]], [[76, 0, 4], [74, 4, 4]],
    [[72, 0, 2], [67, 2, 2], [72, 4, 2], [76, 6, 2]], [[76, 0, 2], [74, 2, 2], [72, 4, 2], [69, 6, 2]], [[74, 0, 4], [71, 4, 2], [74, 6, 2]], [[72, 0, 8]]];
const LEAD_SW = [[[76, 0, 3], [79, 4, 2], [76, 6, 2], [72, 8, 4]], [[76, 0, 3], [81, 4, 2], [79, 6, 2], [76, 8, 4]], [[77, 0, 3], [81, 4, 2], [77, 6, 2], [72, 8, 4]], [[74, 0, 3], [79, 4, 2], [71, 8, 2], [74, 10, 2], [67, 12, 4]]];
const LEAD_AU = [[[69, 0, 6], [72, 6, 2], [76, 8, 8]], [[72, 0, 6], [69, 6, 2], [65, 8, 8]], [[67, 0, 6], [72, 6, 2], [76, 8, 8]], [[74, 0, 8], [71, 8, 4], [67, 12, 4]]];
// ---- 新5アトラクションの きょく（ぜんぶ オリジナル）----
const rhythmScore = {bpm: SONG.bpm, beats: 4, sub: 2, gain: 1.15, bar(b, I, add){
    const root = rootAt(b), mel = melodyAt(b), chorus = (b >= 12 && b < 20) || (b >= 24 && b < 32), minor = root === 45 || root === 40, tn = [0, minor ? 3 : 4, 7, 12];
    add("kick", 40, 0, 1, .55); add("kick", 40, 4, 1, .5); if(chorus){ add("kick", 40, 2, 1, .3); add("kick", 40, 6, 1, .3); }
    if(b >= 2){ add("snare", 60, 2, 1, .3); add("snare", 60, 6, 1, .3); }
    for(let st = 0; st < 8; st++) add("hat", 80, st, 1, .11 + (st % 2 ? .04 : 0));
    add("bass", root, 0, 4, .5); add("bass", root + 7, 4, 4, .42);
    if(b >= 1) [0, 1, 2, 3, 2, 1, 2, 3].forEach((q, st) => add("pluck", root + 24 + tn[q], st, 1, .1 + (chorus ? .05 : 0)));
    if(b >= 2){ add("string", root + 24, 0, 8, .1); add("string", root + 31, 0, 8, .08); }
    if(mel) mel.forEach((m, st) => { if(m){ add(chorus ? "horn" : "bell", m, st, 1.7, chorus ? .3 : .34); if(chorus) add("chip", m + 12, st, 1, .06); } });
    if(b % 8 === 4 || b === 33) add("crash", 60, 0, 4, .35);
}};
const mazeScore = {bpm: 84, beats: 4, sub: 4, gain: .9, bar(b, I, add){
    const root = [45, 41, 43, 40][b % 4] , minor = true, tn = [0, 3, 7, 12, 15, 12, 7, 3];
    add("string", root + 12, 0, 16, .1); add("string", root + 19, 0, 16, .08); add("bass", root - 12, 0, 8, .4); add("bass", root - 12, 8, 8, .34);
    for(let i = 0; i < 8; i++) add("bell", root + 24 + tn[i], i * 2, 2, .1 + (i % 4 === 0 ? .05 : 0));
    if(b % 4 === 3) [12, 13, 14, 15].forEach((st, k) => add("bell", root + 36 + k * 3, st, 1, .08));
}};
const jumpScore = {bpm: 128, beats: 4, sub: 2, gain: 1.05, bar(b, I, add){
    const rt = [0, 5, 7, 4][b % 4], root = 48 + rt, pent = [0, 2, 4, 7, 9, 12, 14, 16], pat = [[0, 2, 4, 2, 5, 4, 2, 1], [3, 4, 5, 4, 2, 4, 3, 1], [2, 4, 5, 6, 5, 4, 2, 0], [4, 5, 7, 5, 4, 2, 3, 2]][(b >> 0) % 4];
    [0, 2, 4, 6].forEach((st, i) => add("bass", root - 12 + (i % 2 ? 7 : 0), st, 1, .36));
    [0, 4].forEach((st) => add("kick", 60, st, 1, .5)); [2, 6].forEach((st) => add("snare", 60, st, 1, .22)); for(let i = 0; i < 8; i++) add("hat", 60, i, 1, i % 2 ? .1 : .06);
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((st) => { if(st % 2 === 0 || b % 2) add("pluck", root + 12 + [0, 4, 7, 4][st % 4], st, 1, .13); });
    pat.forEach((q, st) => add(b % 8 < 4 ? "bell" : "chip", root + 24 + pent[q], st, 1, b % 8 < 4 ? .22 : .12));
    if(b % 8 === 7) for(let k = 0; k < 4; k++) add("snare", 60, 4 + k, 1, .12 + k * .05);
    if(b % 8 === 0) add("crash", 60, 0, 4, .3);
}};
const loopScore = {bpm: 146, beats: 4, sub: 2, gain: 1.0, bar(b, I, add){
    const rt = [0, -4, -2, -5][b % 4], root = 45 + rt, arp = [0, 3, 7, 12, 7, 3, 7, 10];
    for(let i = 0; i < 8; i++){ add("bass", root - 12, i, 1, .34); add("pluck", root + 12 + arp[i], i, 1, .13 + (i % 2 ? 0 : .05)); }
    add("string", root + 12, 0, 8, .1); add("string", root + 19, 0, 8, .08); [0, 4].forEach((st) => add("kick", 60, st, 1, .5)); [2, 6].forEach((st) => add("snare", 60, st, 1, .2)); for(let i = 0; i < 8; i++) add("hat", 60, i, 1, i % 2 ? .1 : .05);
    if(b % 8 >= 4){ [[0, 12, 2], [2, 15, 1], [3, 14, 1], [4, 12, 2], [6, 10, 2]].forEach(([st, m, len]) => add("brass", root + 24 + m - 12, st, len, .22)); add("timp", root, 0, 2, .4); }
    if(b % 8 === 7) for(let k = 0; k < 4; k++) add("snare", 60, 4 + k, 1, .1 + k * .05); if(b % 8 === 0) add("crash", 60, 0, 4, .3);
}};
const kartScore = {bpm: 156, beats: 4, sub: 2, gain: 1.05, bar(b, I, add){
    const rt = [0, 7, 9, 5][b % 4], root = 48 + rt, hook = [[0, 12], [1, 16], [2, 19], [3, 16], [4, 21], [5, 19], [6, 16], [7, 14]];
    for(let i = 0; i < 8; i++){ add("bass", root - 12 + (i % 4 === 2 ? 7 : 0), i, 1, .34); } [0, 4].forEach((st) => add("kick", 60, st, 1, .5)); [2, 6].forEach((st) => add("snare", 60, st, 1, .22)); for(let i = 0; i < 8; i++) add("hat", 60, i, 1, i % 2 ? .1 : .05);
    hook.forEach(([st, m]) => add(b % 8 < 4 ? "chip" : "bell", root + 12 + m, st, 1, b % 8 < 4 ? .13 : .22)); [0, 3, 6].forEach((st) => add("pluck", root + 24 + [0, 4, 7][st % 3], st, 1, .1));
    if(b % 8 === 3 || b % 8 === 7) for(let k = 0; k < 4; k++) add("snare", 60, 4 + k, 1, .1 + k * .05); if(b % 8 === 0) add("crash", 60, 0, 4, .3);
}};
export const SCORES = {
    maze: mazeScore,
    jump: jumpScore,
    loop: loopScore,
    kart: kartScore,
    rhythm: rhythmScore,
    mars: {bpm: 156, beats: 5, sub: 2, gain: 1, bar(b, I, add){
        const r = 36 + [0, 0, -4, -4, -7, -5, 0, -5][b % 8], hits = [0, 2, 3, 5, 7, 8], pit = [0, 0, 7, 0, 1, 7];
        hits.forEach((st, i) => add("pluck", r + 12 + pit[i], st, 1, .34 + .22 * I));
        add("bass", r, 0, 10, .5); if(I > .1){ add("string", r + 12, 0, 10, .12 + .16 * I); add("string", r + 19, 0, 10, .09 + .1 * I); }
        if(I > .35) [0, 5].forEach((st) => add("timp", r, st, 2, .5)); if(I > .65) [2, 3, 7, 8].forEach((st) => add("timp", r, st, 1, .3));
        if(I > .28){ TH_MARS[b % 8].forEach((m, i) => { add("brass", m, i * 2, 2, .42 + .12 * I); if(I > .8) add("brass", m - 12, i * 2, 2, .3); }); }
        if(I > .7 && b % 8 === 0) add("crash", 60, 0, 4, .5); if(I > .55 && b % 8 === 7) for(let k = 0; k < 4; k++) add("snare", 60, 6 + k, 1, .18 + k * .06);
    }},
    jupiter: {bpm: 138, beats: 2, sub: 4, gain: .7, bar(b, I, add){
        const rt = [0, 0, 5, 7, 0, 9, 5, 7][b % 8], root = 36 + rt, tones = (b % 8 === 5) ? [0, 3, 7, 12] : [0, 4, 7, 12], th = TH_JUP[b % 8];
        if(I >= .3){
            [0, 1, 2, 3, 2, 1, 2, 3].forEach((q, st) => add("pluck", root + 24 + tones[q], st, 1, .16 + .1 * I));
            add("bass", root, 0, 2, .55); add("bass", root + 7, 4, 2, .42); add("pluck", root + 19, 2, 1, .12); add("pluck", root + 19, 6, 1, .12);
            if(I > .45) th.forEach(([m, st, len]) => { add("horn", m, st, len, .46 + .1 * I); if(I > .8) add("horn", m - 4, st, len, .26); });
            if(I > .6){ add("timp", root, 0, 2, .4); add("timp", root, 4, 2, .3); } if(I > .85 && b % 8 === 7) add("crash", 60, 0, 4, .4);
        } else {
            tones.slice(0, 3).forEach((q) => add("string", root + 24 + q, 0, 8, .13)); add("bass", root, 0, 8, .4);
            th.forEach(([m, st, len]) => add("string", m, st, Math.max(len, 3), .26));
        }
    }},
    sweets: {bpm: 140, beats: 4, sub: 4, gain: 1.5, bar(b, I, add){
        const rt = [0, 9, 5, 7][b % 4], root = 36 + rt, tones = (b % 4 === 1) ? [0, 3, 7, 12] : [0, 4, 7, 12];
        add("kick", 40, 0, 1, .55); add("kick", 40, 8, 1, .5); if(I > .3){ add("kick", 40, 6, 1, .3); add("kick", 40, 14, 1, .3); } add("snare", 60, 4, 1, .32); add("snare", 60, 12, 1, .32);
        if(I > .3) for(let st = 0; st < 16; st += 2) add("hat", 80, st, 1, .16 + (st % 4 === 2 ? .06 : 0));
        [0, 0, 12, 0, 0, 12, 0, 7].forEach((o, i) => add("chip", root + o, i * 2, 2, .17));
        for(let st = 0; st < 16; st++) add("chip", root + 36 + tones[[0, 1, 2, 3, 2, 1, 2, 3][st % 8]], st, 1, .055 + .03 * I);
        if(I > .25) LEAD_SW[b % 4].forEach(([m, st, len]) => add("bell", m, st, len, .3));
        if(I > .7) LEAD_SW[b % 4].forEach(([m, st, len]) => add("chip", m + 12, st, len, .06));
    }},
    aurora: {bpm: 96, beats: 4, sub: 4, gain: .8, bar(b, I, add){
        const rt = [9, 5, 0, 7][b % 4], root = 36 + rt, minor = b % 4 === 0, tn = [0, 7, 12, minor ? 15 : 16, 19, minor ? 15 : 16, 12, 7];
        [0, 7, minor ? 15 : 16].forEach((q) => add("string", root + 24 + q, 0, 16, .12 + .12 * I)); add("bass", root, 0, 8, .5); add("bass", root, 8, 8, .42);
        for(let i = 0; i < 8; i++) add("bell", root + 36 + tn[i] - 12, i * 2, 2, .1 + .04 * I);
        if(I > .4){ add("timp", root, 0, 2, .4); add("timp", root, 10, 2, .3); } if(I > .55) LEAD_AU[b % 4].forEach(([m, st, len]) => add("horn", m, st, len, .4 + .1 * I));
        if(I > .8){ LEAD_AU[b % 4].forEach(([m, st, len]) => add("string", m + 12, st, len, .14)); if(b % 4 === 0) add("crash", 60, 0, 4, .35); }
    }},
    // コスモ・クルーズ（2026-11-27）：ひろい うちゅうを ゆったり すすむ、あかるい ぼうけんの きょく（オリジナル）
    cosmo: {bpm: 108, beats: 4, sub: 4, gain: .85, bar(b, I, add){
        const rt = [0, 7, 9, 5, 0, 5, 7, 7][b % 8], root = 38 + rt, third = (b % 8 === 2) ? 3 : 4;
        [0, 7, third + 12].forEach((q) => add("string", root + 12 + q, 0, 16, .1 + .1 * I)); add("bass", root, 0, 6, .46); add("bass", root + 7, 8, 4, .36); add("bass", root, 12, 4, .34);
        const arp = [0, 7, 12, 16, 19, 16, 12, 7];
        for(let i = 0; i < 8; i++) add("bell", root + 24 + (arp[i] === 16 ? third + 12 : arp[i]), i * 2, 2, .08 + .04 * I);
        const mel = [[0, 0, 4], [7, 4, 2], [12, 6, 2], [third + 12, 8, 6], [7, 14, 2]];
        if(I > .3) mel.forEach(([m, st, len]) => add("horn", root + 24 + m + (b % 8 >= 4 ? 2 : 0), st, len, .26 + .1 * I));
        if(I > .5){ add("timp", root, 0, 2, .32); add("timp", root, 8, 2, .26); add("hat", 70, 4, 1, .1); add("hat", 70, 12, 1, .1); }
        if(I > .75 && b % 4 === 0) add("crash", 60, 0, 4, .3);
    }},
    // コスモクルーズ・ミッション：くろがねの かんたい（おもく ぶきみな、ゆっくりの ぎょうれつ）。オリジナル
    cos2dark: {bpm: 78, beats: 4, sub: 4, gain: .9, bar(b, I, add){
        const rt = [0, 0, 3, 1, 0, 0, 5, 3][b % 8], root = 33 + rt;
        [0, 7, 12].forEach((q) => add("string", root + 12 + q, 0, 16, .12 + .06 * I)); add("bass", root, 0, 8, .6); add("bass", root, 8, 4, .5); add("bass", root + 1, 12, 4, .4);
        add("timp", root, 0, 2, .42); add("timp", root, 6, 2, .3); add("timp", root + 5, 10, 2, .34); add("timp", root, 14, 2, .3);
        if(b % 2 === 0){ [[0, 0, 3], [0, 3, 1], [3, 4, 2], [1, 6, 2], [0, 8, 6]].forEach(([m, st, len]) => add("horn", root + 24 + m, st, len, .3)); }
        else add("bell", root + 36, 2, 2, .09), add("bell", root + 31, 10, 2, .08);
        if(b % 4 === 3) add("crash", 55, 0, 4, .25);
    }},
    // コスモクルーズ・ミッション：だっしゅつ（はやい ビートの ひっぱる きょく）。オリジナル
    cos2run: {bpm: 146, beats: 4, sub: 4, gain: .9, bar(b, I, add){
        const rt = [0, 0, 5, 3, 0, 0, 7, 5][b % 8], root = 38 + rt;
        [0, 7, 12].forEach((q) => add("string", root + 12 + q, 0, 16, .12 + .06 * I)); for(let i = 0; i < 8; i++) add("bass", root + (i % 4 === 3 ? 7 : 0), i * 2, 2, .42);
        for(const st of [0, 4, 8, 12]) add("timp", root, st, 1, .4); for(let i = 0; i < 16; i += 2) add("hat", 70, i, 1, .12);
        const arp = [0, 3, 7, 12, 7, 3, 7, 12]; for(let i = 0; i < 8; i++) add("bell", root + 24 + arp[i], i * 2, 2, .09 + .04 * I);
        [[0, 0, 4], [3, 4, 2], [7, 6, 2], [12, 8, 6], [7, 14, 2]].forEach(([m, st, len]) => add("horn", root + 24 + m, st, len, .3));
        if(b % 4 === 0) add("crash", 60, 0, 4, .3);
    }}
};

export function createScore(host){
    let timer = null, name = "", bar = 0, nextT = 0, I = 0, It = 0, master = null, noiseBuf = null;
    const noise = (ac) => { if(noiseBuf) return noiseBuf; const n = ac.sampleRate, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let s = 1234567; for(let i = 0; i < n; i++){ s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; } return noiseBuf = b; };
    function voice(ac, out, inst, midi, t, dur, vel){
        const f = mtof(midi), end = t + dur;
        const env = (a, peak, rel) => { const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, Math.max(t + a, end - rel)); g.gain.exponentialRampToValueAtTime(.0001, end + rel); g.connect(out); return g; };
        const osc = (type, fr, det, dst, st, en) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = fr; if(det) o.detune.value = det; o.connect(dst); o.start(st); o.stop(en); return o; };
        if(inst === "pluck"){ const g = ac.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + Math.min(.28, dur * 1.8 + .06)); g.connect(out); osc("triangle", f, 0, g, t, t + .36); osc("square", f * 2, 0, g, t, t + .1); }
        else if(inst === "bass"){ const g = env(.02, vel * .8, .2); osc("sine", f, 0, g, t, end + .3); osc("triangle", f * 2, 0, g, t, end + .3); }
        else if(inst === "brass" || inst === "horn"){ const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = .8; lp.frequency.setValueAtTime(f * 1.6, t); lp.frequency.linearRampToValueAtTime(f * (inst === "brass" ? 5.5 : 4), t + .14); const g = env(inst === "brass" ? .03 : .05, vel * .35, .1); lp.connect(g); osc("sawtooth", f, -6, lp, t, end + .2); osc("sawtooth", f, 6, lp, t, end + .2); if(inst === "horn") osc("square", f, 0, lp, t, end + .2); }
        else if(inst === "string"){ const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800; const g = env(.16, vel * .3, .25); lp.connect(g); osc("sawtooth", f, -9, lp, t, end + .5); osc("sawtooth", f, 9, lp, t, end + .5); }
        else if(inst === "bell"){ const g = ac.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1); g.connect(out); osc("sine", f, 0, g, t, t + 1.2); const g2 = ac.createGain(); g2.gain.setValueAtTime(vel * .3, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .5); g2.connect(out); osc("sine", f * 3.01, 0, g2, t, t + .6); }
        else if(inst === "chip"){ const g = ac.createGain(); g.gain.setValueAtTime(vel * .5, t); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.07, dur * .9)); g.connect(out); osc("square", f, 0, g, t, t + Math.max(.1, dur)); }
        else if(inst === "timp"){ const g = ac.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .55); g.connect(out); const o = osc("sine", f * 2, 0, g, t, t + .6); o.frequency.exponentialRampToValueAtTime(f, t + .09); }
        else if(inst === "kick"){ const g = ac.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16); g.connect(out); const o = osc("sine", 150, 0, g, t, t + .2); o.frequency.exponentialRampToValueAtTime(42, t + .12); }
        else { const src = ac.createBufferSource(); src.buffer = noise(ac); const fl = ac.createBiquadFilter(), g = ac.createGain(); let len = .1;
            if(inst === "snare"){ fl.type = "bandpass"; fl.frequency.value = 1900; fl.Q.value = .7; len = .13; } else if(inst === "hat"){ fl.type = "highpass"; fl.frequency.value = 7000; len = .045; } else { fl.type = "highpass"; fl.frequency.value = 2800; len = 1.5; }
            g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + len); src.connect(fl); fl.connect(g); g.connect(out); src.start(t, Math.random() * .5); src.stop(t + len + .05); }
    }
    function schedule(){
        const ac = host.ac(); if(!ac || !master || !name) return; const S = SCORES[name]; if(!S) return;
        const barDur = S.beats * 60 / S.bpm, stepDur = barDur / (S.beats * S.sub);
        if(nextT < ac.currentTime + .05) nextT = ac.currentTime + .08;
        while(nextT < ac.currentTime + .7){
            I += (It - I) * .55; const t0 = nextT;
            S.bar(bar, I, (inst, midi, st, len, vel) => voice(ac, master, inst, midi, t0 + st * stepDur, Math.max(.05, len * stepDur), vel));
            nextT += barDur; bar++;
        }
    }
    return {
        start(n){ if(name === n && timer) return; this.stop(); const ac = host.ac(); if(!ac || !SCORES[n]) return; name = n; bar = 0; I = 0; It = 0; nextT = 0; master = ac.createGain(); master.gain.value = .9 * (SCORES[n].gain || 1); master.connect(host.bus()); schedule(); timer = setInterval(schedule, 120); },
        stop(){ if(timer){ clearInterval(timer); timer = null; } if(master){ const m = master, ac = host.ac(); try{ if(ac){ m.gain.setTargetAtTime(0, ac.currentTime, .08); } setTimeout(() => { try{ m.disconnect(); }catch(e){} }, 600); }catch(e){} master = null; } name = ""; },
        setIntensity(v){ It = Math.max(0, Math.min(1, v)); },
        playing: () => !!timer, name: () => name, bars: () => bar
    };
}
