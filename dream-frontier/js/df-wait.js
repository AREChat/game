// ===== まち時間（キューライン）のモデル =====
//  2026年11月26日から、ぜんアトラクションに「まち時間」と「キューライン」を 入れた、という せってい。
//  まち時間は「アトラクションの にんき × じかんたい × 曜日 × その日の ばらつき × 20分ごとの ゆれ」で、パソコン／スマホの 時計から けいさんする。
//  ぜんぶ 計算で きまるので、むかしの 日の まち時間も おなじ けっかが でる（「導入いらいの へいきん」に つかう）。うそ・じっさいの お店の データは つかっていません。
export const LAUNCH = new Date(2026, 10, 26, 0, 0, 0);
export const OPEN_H = 9, CLOSE_H = 21;
const NOQ = {parade: 1, puzzle: 1};   // パレード・やかたの なぞは キューなし
const POP = {worldjet: .95, aurora: .9, sweets: .85, loop: .95, cheese: .95, drop: .85, sky: .8, mine: .75, splash: .7, kart: .75, jump: .6, maze: .55, rhythm: .6, ghost: .8, safari: .65, shoot: .6, boat: .45, carousel: .5, wheel: .6, balloon: .5, swing: .55, fairy: .4, ship: .5, spinner: .5, cosmo: .7};
const hash = (s) => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; } return h; };
const r01 = (s) => hash(s) / 4294967296;
const CURVE = [[0, .1], [8, .12], [9, .3], [10, .5], [11, .8], [12, 1], [13, 1], [14, .95], [15, .85], [16, .75], [17, .6], [18, .5], [19, .4], [20, .3], [21, .2], [24, .1]];
const curve = (h) => { for(let i = 1; i < CURVE.length; i++) if(h <= CURVE[i][0]){ const a = CURVE[i - 1], b = CURVE[i], u = (h - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return .1; };
const DOW = [1.25, .65, .6, .65, .75, .95, 1.3];   // にち・げつ・か・すい・もく・きん・ど
export const hasQueue = (id) => !NOQ[id];
const ymd = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
export const daysSince = (d) => Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - LAUNCH) / 86400000);
export const started = (d) => (d || new Date()) >= LAUNCH;
// いまの まち時間（ふん。5ふんきざみ。0 は「すぐ のれる」）
export function waitMinutes(id, d){
    d = d || new Date(); if(NOQ[id] || d < LAUNCH) return 0;
    const h = d.getHours() + d.getMinutes() / 60, ds = daysSince(d), novelty = ds < 3 ? 1.25 - ds * .08 : 1, dayR = .8 + .4 * r01("day" + ymd(d) + id), slot = Math.floor(h * 3), slotR = .86 + .28 * r01("slot" + ymd(d) + slot + id);
    const pop = POP[id] !== undefined ? POP[id] : .35 + .5 * r01("pop" + id);
    const raw = 55 * pop * curve(h) * DOW[d.getDay()] * dayR * slotR * novelty;
    return raw < 4 ? 0 : Math.min(120, Math.round(raw / 5) * 5);
}
const at = (d, h) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(h), (h % 1) * 60 + 30 * (h % 1 ? 0 : 0));
// きょうの 1じかんごとの まち時間（OPEN_H〜CLOSE_H-1）
export const dayCurve = (id, d) => { d = d || new Date(); const o = []; for(let h = OPEN_H; h < CLOSE_H; h++) o.push(waitMinutes(id, new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 30))); return o; };
// 導入（2026-11-26）いらいの へいきん・さいだい（きょうは 今の じかんまで）
export function history(id, now){
    now = now || new Date(); if(NOQ[id] || now < LAUNCH) return {days: 0, avg: 0, max: 0, n: 0};
    let sum = 0, n = 0, max = 0; const days = daysSince(now) + 1;
    for(let k = 0; k < days; k++){ const day = new Date(LAUNCH.getFullYear(), LAUNCH.getMonth(), LAUNCH.getDate() + k); for(let h = OPEN_H; h < CLOSE_H; h++){ const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, 30); if(t > now) break; const w = waitMinutes(id, t); sum += w; n++; if(w > max) max = w; } }
    return {days, avg: n ? sum / n : 0, max, n};
}
// ゲームの なかの キューの ながさ（びょう）。ほんとうの まち時間を ぎゅっと ちぢめる
export const queueSeconds = (min) => min <= 0 ? 0 : Math.max(10, Math.min(70, Math.round(min * 1.1)));
export const mood = (m) => m <= 0 ? ["すぐ のれる", "#6fe08a"] : m <= 10 ? ["すいている", "#6fe08a"] : m <= 30 ? ["ふつう", "#ffe27a"] : m <= 60 ? ["こんでいる", "#ffa050"] : ["とても こんでいる", "#ff6a6a"];
// セーブに のこす「あなたの きろく」
export function record(sv, id, min, fast){ const w = sv.waits || (sv.waits = {}), r = w[id] || (w[id] = {n: 0, sum: 0, last: 0, max: 0, fp: 0}); r.n++; r.sum += min; r.last = min; r.max = Math.max(r.max, min); if(fast) r.fp++; }
export const fmtDate = (d) => d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" + "日月火水木金土"[d.getDay()] + "）" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
