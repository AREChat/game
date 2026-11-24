// ===== ドリーム・フロンティアの データ（エンジンに よらない）=====
import {buildTrack} from "./df-coaster.js";
export const ZONES = {
    center: {fog: [.75, .88, 1], near: 46, far: 125, amb: [.56, .6, .72], light: [.4, .8, .45]},
    grove: {fog: [.42, .36, .7], near: 24, far: 90, amb: [.42, .44, .66], light: [.3, .8, .3]},
    sky: {fog: [.62, .84, 1], near: 60, far: 150, amb: [.6, .64, .76], light: [.5, .8, .3]},
    manor: {fog: [.14, .1, .22], near: 7, far: 42, amb: [.34, .3, .42], light: [.2, .7, .2]},
    lagoon: {fog: [.5, .85, .9], near: 36, far: 110, amb: [.58, .64, .74], light: [.4, .8, .5]},
    dark: {fog: [.07, .04, .16], near: 5, far: 34, amb: [.5, .44, .62], light: [.2, .7, .2]},
    night: {fog: [.04, .06, .2], near: 60, far: 200, amb: [.26, .3, .5], light: [.2, .8, .3]},
    space: {fog: [.01, .01, .05], near: 160, far: 420, amb: [.5, .5, .65], light: [.5, .6, .4]},
    ghost: {fog: [.05, .04, .1], near: 3, far: 18, amb: [.3, .26, .4], light: [.2, .6, .2]},
    mars: {fog: [.62, .3, .2], near: 90, far: 360, amb: [.7, .46, .38], light: [.6, .5, .3]},
    jupiter: {fog: [.96, .78, .58], near: 110, far: 420, amb: [.82, .72, .64], light: [.4, .9, .4]},
    sweets: {fog: [1, .8, .92], near: 70, far: 300, amb: [.8, .68, .76], light: [.3, .9, .5]},
    aurora: {fog: [.2, .26, .5], near: 80, far: 380, amb: [.55, .6, .78], light: [.3, .8, .4]},
    rhythm: {fog: [.05, .02, .14], near: 60, far: 210, amb: [.6, .52, .8], light: [.3, .8, .3]},
    maze: {fog: [.22, .16, .4], near: 7, far: 46, amb: [.7, .64, .88], light: [.4, .8, .4]},
    loop: {fog: [.03, .05, .17], near: 100, far: 380, amb: [.52, .58, .84], light: [.3, .8, .4]},
    jump: {fog: [.6, .84, 1], near: 120, far: 320, amb: [.74, .76, .86], light: [.4, .9, .4]},
    kart: {fog: [.72, .87, 1], near: 110, far: 300, amb: [.68, .72, .82], light: [.4, .85, .4]}
};
export const AREA_NAMES = {center: "セントラル・ガーデン", grove: "ファンタジー・グローブ", sky: "スカイ・コースト", manor: "ミステリー・マナー", lagoon: "ブルー・ラグーン"};
export const zoneAt = (x, z) => (x > 52 && Math.abs(z) < 40) ? "manor" : (x > 52 && z >= 40 && z < 56) ? "manor" : x < -30 ? "grove" : z < -30 ? "sky" : z > 56 ? "lagoon" : "center";
export const BGM = {center: "town", grove: "cave", sky: "field", manor: "demoncastle", lagoon: "sea"};

export const SKY_PTS = [[0, -50, 1.2], [14, -52, 1.2], [28, -60, 9], [34, -76, 18], [26, -92, 6], [8, -96, 2.5], [-10, -90, 10], [-26, -80, 15], [-30, -66, 5], [-18, -54, 1.8], [-6, -50, 1.2]];
export const MINE_PTS = [[-40, 22, 1.2], [-52, 28, 1.2], [-64, 36, 8], [-78, 32, 13], [-90, 22, 5], [-88, 10, 3], [-76, 14, 6], [-62, 18, 2.5], [-48, 16, 1.4]];
export const BOAT_PTS = (() => { const a = []; for(let i = 0; i < 12; i++){ const t = i / 12 * Math.PI * 2 + Math.PI / 2; a.push([Math.cos(t) * 16, 79 + Math.sin(t) * 9, .15]); } return a; })();
export const SPLASH_PTS = [[12, 60, .6], [28, 64, .6], [31, 76, 4], [30, 88, 10], [22, 96, 14], [6, 96, 14], [-2, 90, 12], [-6, 85, 2], [-8, 80, .5], [-20, 74, .5], [-24, 64, .6], [-12, 60, .6]];
export const GHOST_PTS = [[79, 17.5, .9], [79, 23, .9], [72, 27, .9], [70, 33, .9], [78, 34, .9], [86, 32, .9], [88, 26, .9], [84, 22, .9], [84, 17.5, .9]];
export const SAFARI_PTS = [[40, 60, .4], [52, 66, .4], [66, 64, .4], [80, 70, .4], [88, 80, .4], [80, 90, .4], [64, 92, .4], [50, 86, .4], [44, 74, .4]];

export const FAIRY_PTS = [[-55, -8.4, .6], [-55, -12, .6], [-51, -15, .6], [-47, -18.2, .6], [-51, -21.2, .6], [-58, -21.2, .6], [-62, -17.5, .6], [-59, -13.5, .6], [-56, -10.4, .6]];
export const SHIP_PTS = [[44, -18, 2], [48, -26, 12], [62, -34, 22], [72, -14, 28], [64, 12, 30], [60, 40, 28], [40, 54, 26], [14, 52, 24], [0, 34, 24], [0, 4, 26], [-14, -10, 24], [-10, 6, 22], [14, 14, 20], [30, 14, 13], [40, 2, 7], [44, -10, 4], [44, -18, 2]];

// kind: track（レールの上を すすむ）／orbit（ぐるぐる）／wheel（かんらんしゃ）／drop（タワー）／shoot（ミニゲーム）／show（パレード）
export const ATTRACTIONS = [
    {id: "carousel", n: "ドリーム・カルーセル", area: "center", kind: "orbit", mode: "horse", c: [-21, -21], r: 4.2, w: .9, h0: .9, bob: .35, dur: 34, board: {x: -21, z: -14.6, r: 3.4}, coin: 10, desc: "ゆめの どうぶつに のって ゆったり ひとまわり。", ref: "メリーゴーランド系"},
    {id: "wheel", n: "ムーンホイール", area: "center", kind: "wheel", c: [21, -21], R: 11.5, cy: 13.5, dur: 50, board: {x: 16.6, z: -16.6, r: 3.6}, coin: 10, desc: "ゆっくり まわる おおきな かんらんしゃ。パークが ぜんぶ みわたせる。", ref: "観覧車系"},
    {id: "parade", n: "ドリーム・パレード", area: "center", kind: "show", dur: 70, period: 150, first: 35, coin: 10, desc: "ひろばを ぐるっと まわる 光の パレード。ちかくで みよう。", ref: "パレード"},
    {id: "balloon", n: "ふわふわバルーン", area: "grove", kind: "orbit", mode: "balloon", c: [-50, -32], r: 7, w: .28, h0: 2, h1: 14, dur: 50, board: {x: -50, z: -26.2, r: 3.4}, coin: 10, desc: "↑↓で たかさを かえられる ふうせんの のりもの。", ref: "空飛ぶゾウ系"},
    {id: "mine", n: "クリスタル・マインコースター", area: "grove", kind: "track", pts: MINE_PTS, closed: true, laps: 1, speed: {type: "energy", vmin: 6, g: 10, h0: 13.5, lift: 30}, eye: 1.0, style: "rails", color: "#7a5a3a", board: {x: -38, z: 18.6, r: 3.4}, coin: 10, desc: "ひかる水晶の ほら穴を ぬける トロッコ型 コースター。", ref: "鉱山トロッコ系"},
    {id: "sky", n: "スカイ・ライナー", area: "sky", kind: "track", pts: SKY_PTS, closed: true, laps: 2, speed: {type: "energy", vmin: 7, g: 12, h0: 18.5, lift: 55}, eye: 1.1, style: "rails", color: "#ff6a4a", manual: true, board: {x: 0, z: -42.2, r: 5.5}, coin: 20, desc: "いちばん たかい ところから かけおりる ジェットコースター。↑かそく ↓ブレーキ。", ref: "ジェットコースター系"},
    {id: "drop", n: "スカイ・ドロップ", area: "sky", kind: "drop", c: [30, -42], H: 48, y0: 2, board: {x: 30, z: -36.2, r: 3.4}, coin: 15, desc: "てっぺんまで ぐーんと のぼって、いっきに おちる タワー。", ref: "フリーフォール系"},
    {id: "swing", n: "ウィンド・スイング", area: "sky", kind: "orbit", mode: "chair", c: [-32, -44], r: 4, r1: 9, w: 1.0, w1: 1.6, h0: 6, h1: 12, dur: 36, board: {x: -32, z: -38.4, r: 3.4}, coin: 10, desc: "ぐるぐる まわりながら ひろがる 空中ブランコ。", ref: "スペースシップ・チェア系"},
    {id: "ghost", n: "ゴースト・ギャラリー", area: "manor", kind: "track", pts: GHOST_PTS, closed: false, laps: 1, speed: {type: "const", v: 2.3}, eye: 1.35, style: "none", vehicle: "cart", env: "ghost", board: {x: 79, z: 15.4, r: 3.2}, coin: 15, desc: "くらい おやしきを ゆっくり すすむ おばけ屋敷の のりもの。", ref: "ホーンテッド・ハウス系",
        scares: [{s: .16, ghost: [72, 27], text: "…ヒュウウ…"}, {s: .32, ghost: [70, 31], text: "うしろに だれか いる…？"}, {s: .5, ghost: [80, 33], text: "ガタガタ！"}, {s: .68, ghost: [88, 30], text: "ようこそ… わたしの おやしきへ…"}, {s: .86, ghost: [85, 23], text: "また おいで… ヒヒヒ"}]},
    {id: "puzzle", n: "ミステリー・マナーの きんこ", area: "manor", kind: "quest", coin: 0, desc: "やかたの 3つの てがかりで きんこを あける。", ref: "なぞとき"},
    {id: "boat", n: "ランタン・ボートクルーズ", area: "lagoon", kind: "track", pts: BOAT_PTS, closed: true, laps: 1, speed: {type: "const", v: 2.9}, eye: .95, style: "none", vehicle: "boat", board: {x: 0, z: 60.2, r: 3.5}, coin: 10, desc: "ランタンの うかぶ みずうみを ゆったり ひとまわり。", ref: "ボート・クルーズ系",
        events: [{s: .1, text: "みずうみに ランタンが ゆらゆら うかんでいる…"}, {s: .4, text: "ほとりの はしらに ランタンが かかっているよ。"}, {s: .7, text: "たきの おとが きこえてきた。"}]},
    {id: "splash", n: "ログ・スプラッシュ", area: "lagoon", kind: "track", pts: SPLASH_PTS, closed: true, laps: 1, speed: {type: "energy", vmin: 4.5, g: 14, h0: 14.5, lift: 70}, eye: 1.1, style: "trough", vehicle: "log", board: {x: 12, z: 57.6, r: 3.4}, coin: 15, desc: "まるたの ボートで すいろを すすみ、さいごは ざっぱーん！と おちる。", ref: "ログフルーム系",
        events: [{s: .55, text: "ガコン…ガコン…（のぼってる…）", ev: "climb"}, {s: .72, text: "うわあああ！！", ev: "drop"}, {s: .8, text: "ざっぱーん！", ev: "splash"}]},
    {id: "shoot", n: "スターライト・シューティング", area: "lagoon", kind: "shoot", board: {x: 18, z: 57.2, r: 3.2}, dur: 45, coin: 0, desc: "みずうみに うかぶ まとを ねらう シューティング。（Eで はっしゃ）", ref: "シューティング系"},
    {id: "safari", n: "ふしぎサファリ", area: "lagoon", kind: "track", pts: SAFARI_PTS, closed: true, laps: 1, speed: {type: "const", v: 3.4}, eye: 1.55, style: "none", vehicle: "jeep", board: {x: 40, z: 57.4, r: 3.4}, coin: 10, desc: "ジープで めぐる ふしぎな どうぶつの 国。", ref: "ジャングル・サファリ系",
        events: [{s: .12, text: "ながーい くびの ふしぎな どうぶつが いるよ！"}, {s: .4, text: "おおきな ぞうさんが みずあびを している。"}, {s: .65, text: "モコモコの どうぶつが ちかづいてきた！"}, {s: .85, text: "ライオンの こどもだ。あくびを している。"}]},
    {id: "fairy", n: "ひかりの もりの おとぎライド", area: "grove", kind: "track", pts: FAIRY_PTS, closed: false, laps: 1, speed: {type: "const", v: 1.9}, eye: 1.0, style: "none", vehicle: "cart", env: "dark", board: {x: -55, z: -2.4, r: 3.2}, coin: 10, desc: "ほしのこたちが うたう、ひかりの もりを めぐる おとぎ話の ダークライド。", ref: "おとぎ話のダークライド系",
        events: [{s: .1, text: "ようこそ… ひかりの もりへ。ランプの ようせいが あんないするよ。"}, {s: .28, text: "5ひきの ほしのこが おうたを うたっている♪"}, {s: .48, text: "…！ うしろから かげの まじょが ちかづいてきた！"}, {s: .66, text: "ひかりの ランプが まじょを てらすと…"}, {s: .8, text: "ガラスの おしろが あらわれた！"}, {s: .93, text: "めでたし めでたし。ゆめの おとぎ話は つづく…"}]},
    {id: "ship", n: "ムーンシップ・フライト", area: "center", kind: "track", pts: SHIP_PTS, closed: false, laps: 1, speed: {type: "const", v: 7.2}, eye: 1.2, style: "none", vehicle: "ship", env: "night", board: {x: 44, z: -14, r: 3.4}, coin: 15, desc: "ゆめの 空とぶ ふねで、ほしぞらの パークを 一周。（よるの そらの たび）", ref: "空飛ぶ海賊船系",
        events: [{s: .08, text: "ふねが ふわり…  パークが どんどん ちいさくなる！"}, {s: .28, text: "あれは ムーンホイール！ あかりが きれいだよ。"}, {s: .5, text: "まんなかの ふんすいが ほしみたいに ひかっている。"}, {s: .7, text: "みずうみの ランタンが ゆらゆら ゆれているね。"}, {s: .9, text: "そろそろ ちゃくりくの じかんだよ。"}]},
    {id: "spinner", n: "ポップタウン・スピナー", area: "sky", kind: "orbit", mode: "cup", c: [-52, -62], r: 5.6, w: .5, h0: .9, dur: 40, board: {x: -52, z: -53.2, r: 3.2}, coin: 10, desc: "カップが ぐるぐる まわる マンガの まち。A / D で じぶんの カップを もっと まわそう！", ref: "コーヒーカップ系の 回転ライド"},
    {id: "cosmo", n: "コスモ・クルーズ", area: "sky", kind: "sim", env: "space", dur: 56, board: {x: 62, z: -50, r: 3.2}, coin: 15, desc: "うちゅうせんの コックピットで ワープしながら わくせいの たびへ。", ref: "宇宙旅行シミュレーター系",
        events: [{s: .02, text: "コスモ・クルーズ、はっしん！ シートベルトを しめてね。"}, {s: .15, text: "ひだりに あおい わくせい「ルナリア」が みえる！"}, {s: .34, text: "ちゅうい！ がれきの おびだ！ おおきく ゆれるよ！"}, {s: .55, text: "ゲートを くぐるよ…！"}, {s: .7, text: "ワープ・かいし！"}, {s: .88, text: "とうちゃく。ステーションが みえてきた！"}]}
];

// ============ 新アトラクション3つ（すべて オリジナル）============
// ステージ（とおくの ばしょに つくった 専用の せかい）。のっている あいだだけ 見える
export const STAGES = {
    mars: {at: [1200, 0]}, jupiter: {at: [-1200, 0]}, sweets: {at: [0, 1300]}, aurora: {at: [0, -1300]},
    rhythm: {at: [1300, 1300]}, maze: {at: [-1300, -1300]}, loop: {at: [1300, -1300]}, jump: {at: [-1300, 1300]}, kart: {at: [0, 2600]}
};

// ---- ① ジェット・ワールドツアー（4分：火星 2分 ＋ 木星 2分 ／ ぎゃくそう つき）----
const MARS_H = [
    {len: 20}, {len: 110, mark: "launch"}, {len: 100, turn: 20, mark: "hill1"}, {len: 70, turn: -25}, {len: 170, turn: -140, mark: "bottom"},
    {len: 110, mark: "hill2"}, {len: 40}, {len: 260, turn: 200, mark: "helix"}, {len: 80, roll: 1, mark: "roll"}, {len: 40, turn: -30}, {len: 90, turn: -84}, {len: 60, mark: "spike"}];
const MARS_V = [[0, 2, 0], [20, 2, 0], [130, 5, 8], [225, 28, 0], [272, 13, -46], [335, 3.5, 0], [400, 3, 0], [470, 3.5, 5], [520, 15, 0], [580, 3.5, 0], [620, 3, 0], [750, 12, 6], [880, 14, 0], [960, 26, 0], [1000, 24, -6], [1040, 16, 0], [1090, 16, 10], [1150, 44, 58]];
export const MARS_TR = buildTrack({x: STAGES.mars.at[0], z: STAGES.mars.at[1], yaw: 0}, MARS_H, MARS_V);
const JUP_H = [
    {len: 18}, {len: 105, mark: "lift"}, {len: 26, turn: 8, mark: "crest"}, {len: 84, turn: -24, mark: "drop"}, {len: 100, turn: -48},
    {len: 80, mark: "hillA"}, {len: 80, turn: 20, mark: "hillB"}, {len: 70, turn: -85}, {len: 64, mark: "hillC"},
    {len: 200, turn: 200, mark: "helix"}, {len: 90, roll: 1, mark: "roll"}, {len: 56, turn: 60}, {len: 80, mark: "spike"}];
const JUP_V = [[0, 5, 0], [18, 5, 0], [123, 38, 34], [149, 46, 0], [185, 26, -58], [258, 5, 0], [300, 4, 0], [333, 5, 3], [373, 15, 0], [413, 5, 0], [453, 17, 0], [493, 5, 0], [528, 4, 0], [563, 6, 4], [595, 16, 0], [627, 6, 0], [727, 16, 4], [827, 22, 0], [872, 28, 8], [917, 28, 0], [945, 24, -8], [973, 18, 0], [1000, 22, 16], [1028, 44, 58], [1038, 46, 0], [1053, 46, 0]];
export const JUP_TR = buildTrack({x: STAGES.jupiter.at[0], z: STAGES.jupiter.at[1], yaw: 0}, JUP_H, JUP_V);
// sim: 物理シミュレーションの せってい（zones は L=レールの ながさ から つくる）
export const MARS_SIM = (L) => ({s0: 0, hold0: 6, cd: .0011, cr: .045, stopB: 2.4, vCrawl: .6, topS: L - 2, stopS: 12, topHold: 3, endHold: 3,
    fwd: [{s0: 0, s1: 20, type: "assist", v: 2.5, a: 2}, {s0: 20, s1: 118, type: "launch", v: 31, a: 5.2}, {s0: 130, s1: L, type: "assist", v: 24, a: 5.5}, {s0: L - 110, s1: L, type: "assist", v: 9, a: 3}],
    rev: [{s0: 0, s1: L, type: "assist", v: 25, a: 9}, {s0: 0, s1: 60, type: "brake", v: 15, a: 4}]});
export const JUP_SIM = (L) => ({s0: 0, hold0: 6, cd: .0011, cr: .045, stopB: 2.4, vCrawl: .6, topS: L - 6, stopS: 12, topHold: 5, endHold: 3,
    fwd: [{s0: 0, s1: 18, type: "assist", v: 2.5, a: 2}, {s0: 18, s1: 150, type: "assist", v: 10.5, a: 9}, {s0: 290, s1: L, type: "assist", v: 22, a: 5}, {s0: 250, s1: L - 130, type: "brake", v: 23, a: 6}],
    rev: [{s0: 0, s1: L, type: "assist", v: 22, a: 7}, {s0: 120, s1: L - 60, type: "brake", v: 23, a: 7}, {s0: 0, s1: 60, type: "brake", v: 14, a: 4}]});

// ---- ② キラキラ・スイーツ・ブラスター（のりもの が じゆうに うごく 「レールなし」ライド＋ ひかりの ブラスターで てきを ねらう）----
const SW_H = [{len: 16}, {len: 60, mark: "gate"}, {len: 70, turn: -60}, {len: 60, turn: 60, mark: "cream"}, {len: 80, turn: 90, mark: "donut"}, {len: 60}, {len: 80, turn: -120, mark: "river"}, {len: 70, turn: 30}, {len: 90, turn: 150, mark: "tower"}, {len: 60}, {len: 70, turn: -90, mark: "finale"}, {len: 40}];
const SW_V = [[0, 1.2, 0], [16, 1.2, 0], [150, 2, 0], [300, 1.4, 0], [450, 3, 0], [600, 1.6, 0], [756, 1.2, 0]];
const scH = (H, k) => H.map((g) => Object.assign({}, g, {len: Math.round(g.len * k)})), scV = (V, k) => V.map((q) => [Math.round(q[0] * k), q[1], q[2]]);
export const SW_TR = buildTrack({x: STAGES.sweets.at[0], z: STAGES.sweets.at[1], yaw: 0}, scH(SW_H, .85), scV(SW_V, .85));
export const SW_SIM = (L) => ({s0: 0, hold0: 5, endHold: 3, keys: [[0, 2], [14, 4.6], [51, 6.4], [110, 6.4], [145, 4.6], [204, 6.8], [280, 5.2], [340, 7], [400, 5], [476, 7], [544, 5.4], [L - 36, 5], [L - 8, 1.4], [L, .4]],
    marks: [{name: "mid", s: L * .5}]});

// ---- ③ オーロラ・スカイウィング（ひかりの つばさで 夜空を とぶ 絶叫アドベンチャー）----
const AU_H = [{len: 32}, {len: 160, mark: "liftoff"}, {len: 144, turn: -30}, {len: 176, turn: 70, mark: "lanterns"}, {len: 224, turn: -160, mark: "castle"}, {len: 160, roll: 1, mark: "roll1"}, {len: 192, turn: 150, mark: "forest"},
    {len: 320, turn: -200, mark: "helix"}, {len: 128, mark: "ship"}, {len: 160, turn: -80, roll: -1, mark: "roll2"}, {len: 144, turn: 50, mark: "moon"}, {len: 96, mark: "finale"}, {len: 130}];
const AU_V = [[0, 6, 0], [32, 6, 0], [150, 24, 24], [260, 58, 14], [330, 68, 0], [380, 56, -38], [470, 18, -42], [560, 12, 0], [680, 26, 14], [800, 34, 0], [930, 20, -32], [1060, 18, 0], [1160, 26, 12], [1300, 38, 0], [1460, 20, -30], [1600, 18, 0],
    [1720, 24, 10], [1840, 20, 0], [1940, 48, 30], [2020, 66, 0], [2090, 70, 0], [2160, 62, -34], [2220, 20, -50], [2264, 8, -10]];
export const AU_TR = buildTrack({x: STAGES.aurora.at[0], z: STAGES.aurora.at[1], yaw: 0}, AU_H, scV(AU_V, .855).concat([[1990, 6.5, 0], [2066, 6, 0]]));
export const AU_SIM = (L) => ({s0: 0, hold0: 5, endHold: 3, keys: [[0, 2.5], [32, 5], [100, 9], [150, 12], [250, 8], [330, 6], [372, 12], [430, 26], [520, 20], [640, 16], [800, 14], [900, 22], [960, 26], [1060, 19], [1200, 16], [1300, 14], [1420, 24], [1480, 26], [1620, 20],
    [1750, 15], [1900, 12], [2010, 8], [2090, 9], [2160, 20], [2230, 21]].map((q) => [Math.round(q[0] * .886), q[1] * 1.25]).filter((q) => q[0] < L - 150).concat([[L - 130, 25], [L - 76, 16], [L - 31, 7], [L - 8, 2.2], [L, .4]]), marks: [{name: "mid", s: L * .5}]});

export const NEW_ATTRACTIONS = [
    {id: "worldjet", n: "ジェット・ワールドツアー", area: "sky", kind: "coaster", env: "mars", eye: 1.1, coin: 25,
        board: {x: 84, z: -44, r: 3.8}, vehicle: "jet", desc: "ジェットきに のって 火星から 木星まで ぐるっと せかいを たび。ぜんぶで 4ふん。とちゅうで 「ぎゃくそう」も！（おとは クラシック風）",
        ref: "宇宙もの屋内コースター＋世界めぐりライド（合体）",
        acts: [
            {id: "mars", stage: "mars", env: "mars", music: "mars", track: MARS_TR, sim: MARS_SIM, label: "第1幕：火星", turntable: false,
                events: [{m: "dispatch", dt: -3.5, text: "ジェットき「ワールド1ごう」、はっしん じゅんび。ベルトを ぎゅっと しめてね。"}, {m: "launch", dt: 0.5, text: "リニア・ローンチ！ いっきに 120キロまで かそく！"}, {m: "launch", dt: 14, text: "ひがしの かべを こえて… ここは あかい だいちの 火星！"}, {m: "launch", dt: 30, text: "ぐるぐる らせん！ 目が まわるぞ！"}, {m: "launch", dt: 44, text: "ふわっ…！ むじゅうりょく ロール！"}, {m: "top", dt: -2, text: "てっぺん まで あと すこし…！"}, {m: "top", dt: 0.4, text: "ストップ…。 ここから 「ぎゃくそう」だ！ うしろむきに おちるよ！"}, {m: "rev", dt: 10, text: "せなかから ぐんぐん かそく！ ゆうだいな 谷を ぎゃくに かけぬける！"}, {m: "rev", dt: 34, text: "ステーション・はいりこみ…。 つぎは 木星の くもの うみへ！"}]},
            {id: "jupiter", stage: "jupiter", env: "jupiter", music: "jupiter", track: JUP_TR, sim: JUP_SIM, label: "第2幕：木星", turntable: true,
                events: [{m: "dispatch", dt: -3.5, text: "第2幕！ ここは 木星の くもの うみ。 おまつりの せかいへ ようこそ！"}, {m: "launch", dt: 3, text: "チェーンで ゆっくり のぼるよ… ガタン ガタン…"}, {m: "launch", dt: 17, text: "いただき！ 55メートルの 大ダイブ いくよ…！"}, {m: "launch", dt: 24, text: "ひゅーーっ！ くもの はしを とびこえろ！"}, {m: "launch", dt: 46, text: "いろんな 国の おどりの しま が ならんでる！ てを ふってるよ。"}, {m: "top", dt: -2, text: "もういちど てっぺんへ…！"}, {m: "top", dt: 0.6, text: "ターンテーブルで ぐるっと 回って… ぎゃくそう スタート！"}, {m: "rev", dt: 12, text: "すごい スピード！ さっきの 山を さかさまに かけおりる！"}, {m: "rev", dt: 38, text: "とうちゃく。 4ふんかん、ありがとう！"}]}
        ]},
    {id: "sweets", n: "キラキラ・スイーツ・ブラスター", area: "lagoon", kind: "coaster", shoot: true, env: "sweets", eye: 1.25, coin: 15, pass: 1500, rank: [1500, 4500, 9000],
        board: {x: -48, z: 68, r: 3.6}, vehicle: "blaster", desc: "レールの ない ブラスター・カーで おかしの せかいを ドライブ！ ひかりの ブラスターで ゼリーや ケーキを ねらって ハイスコア！（1500てんで スタンプ）",
        ref: "最新型の トラックレス（レールなし）・シューティング・ライド（種類の説明のみ。名前・絵・音は ぜんぶ オリジナル）",
        acts: [{id: "sweets", stage: "sweets", env: "sweets", music: "sweets", track: SW_TR, simType: "scripted", sim: SW_SIM, label: "スイーツ・ランド", turntable: false, shoot: true,
            spins: [{at: "donut", len: 50, turns: 1}, {at: "river", len: 36, turns: -1}, {at: "tower", len: 44, turns: 1}, {at: "finale", len: 26, turns: -2}],
            events: [{m: "dispatch", dt: -3.5, text: "ブラスター・カー、 はっしん じゅんび！ ひかりの ブラスターで おかしを ねらえ！（クリック・タップで はっしゃ）"}, {at: "gate", dt: 0, text: "ゲートを くぐると… おかしの せかい！ まわりを 見わたして ねらおう！"}, {at: "cream", dt: -6, text: "ふわふわ クリームの もり。 ゼリーの おばけが とびだすぞ！"},
                {at: "donut", dt: 0, text: "ドーナツの ひろば！ くるまが くるくる まわるよ。 ねらいを うしなわないで！"}, {at: "river", dt: 0, text: "チョコの かわを わたるよ。 かわの うえの まとも ねらえ！"}, {at: "tower", dt: 0, text: "ケーキの とうが そびえてる！ たかい ところの まとも わすれずに。"}, {at: "finale", dt: -4, text: "ラスト！ きんいろの ケーキは 300てん！ いっきに ねらえ！"}, {m: "stop", dt: 0, text: "おつかれさま！ スコアを みてみよう。"}]}]},
    {id: "aurora", n: "オーロラ・スカイウィング", area: "sky", kind: "coaster", env: "aurora", eye: 1.15, coin: 20,
        board: {x: 48, z: -76, r: 3.8}, vehicle: "wing", desc: "ひかりの つばさで 夜空へ！ ランタンの うみ、 氷の おしろ、 まほうの 森、 空とぶ 船…。 ロールも ダイブも ある 大ぼうけん！（絶叫ちゅうい）",
        ref: "空とぶ 絶叫系アドベンチャー・コースター（種類の説明のみ。名前・絵・音は ぜんぶ オリジナル）",
        acts: [{id: "aurora", stage: "aurora", env: "aurora", music: "aurora", track: AU_TR, simType: "scripted", sim: AU_SIM, label: "ひかりの つばさ", turntable: false,
            events: [{m: "dispatch", dt: -3.5, text: "ひかりの つばさに のって 夜空へ… ベルトを しっかり しめてね。"}, {at: "liftoff", dt: 6, text: "ふわっと ふわり！ ランタンの うみへ とびたつよ。"}, {at: "lanterns", dt: 0, text: "なん千もの ランタンが ゆらゆら。 そらも うみも きらきら！"}, {at: "castle", dt: -8, text: "氷の おしろが 見えてきた。 とんがり やねの あいだを すりぬけろ！"},
                {at: "roll1", dt: 0, text: "ぐるっと たるまわし！ せかいが さかさま！"}, {at: "forest", dt: 0, text: "まほうの 森。 光の きのこが ぴかぴか！ …ひゃっ、 ふくろうの かげ！"}, {at: "helix", dt: 0, text: "ぐるぐる らせん下り！ かぜが ごうごう！"}, {at: "ship", dt: 0, text: "雲の上に 空とぶ 船！ ほしの 風が ふいてくる。"},
                {at: "roll2", dt: 0, text: "もういっかい ロール！ こんどは ぎゃくまわり！"}, {at: "moon", dt: -12, text: "おおきな 月が みえた。 いっきに のぼって… さいごの ダイブ、 いくよ！"}, {at: "finale", dt: 10, text: "ひゅーーーーん！ ほしぞらに ひかりの おびを のこして！"}, {m: "stop", dt: 0, text: "とうちゃく！ 夜空の たびは どうだった？"}]}]}
];

// ============ さらに 新アトラクション5つ（ぜんぶ オリジナル。虫は ぜったい 出ない）============
//  リズムゲーム／鏡の3D迷路／360度ループの コースター／空中ジャンプ（3Dアクション）／ランナー・レース
export const NEW5_ATTRACTIONS = [
    {id: "rhythm", n: "スターライト・リズムステージ", area: "center", kind: "rhythm", board: {x: 14, z: 42, r: 3.4}, coin: 10, dur: 70,
        desc: "ひかる 4つの レーンを ながれてくる ノーツを、リズムに あわせて たたく 音ゲー！ キーは D F J K（スマホは がめんの 4つの ばしょを タップ）。60%で スタンプ。",
        ref: "音楽リズムゲーム系（種類の説明のみ。名前・曲・絵は ぜんぶ オリジナル）"},
    {id: "maze", n: "ミラー・ラビリンス", area: "grove", kind: "maze", board: {x: -88, z: -30, r: 3.4}, coin: 10, dur: 240,
        desc: "ガラスの かべで できた 3Dの めいろ。ほしを 3こ あつめて ゲートから でよう！ ちずと ヒント（E）つき。ぜんぶで 3パターン。",
        ref: "3D迷路・脱出系（種類の説明のみ。名前・絵・音は ぜんぶ オリジナル）"},
    {id: "loop", n: "ギャラクシー・ループ", area: "grove", kind: "loop", board: {x: -88, z: -70, r: 3.6}, coin: 25, dur: 100,
        desc: "ぐるーん！と 360度 まわる ループが ある 絶叫コースター。ヘアピン、コークスクリュー、ダブルループ…。ネオンの リングを ぬけて 星の かなたへ！（絶叫ちゅうい）",
        ref: "ループ・コースター系（種類の説明のみ。名前・絵・音は ぜんぶ オリジナル）"},
    {id: "jump", n: "ふわふわ・スカイジャンプ", area: "grove", kind: "jump", board: {x: -86, z: 90, r: 3.4}, coin: 10, dur: 120,
        desc: "空に うかぶ しまを ジャンプで わたって、ほしを あつめる 3Dアクション。Eキー（スマホは Eボタン）で ジャンプ、2だん ジャンプも できるよ！",
        ref: "3Dジャンプ・アスレチック系（種類の説明のみ。名前・絵・音は ぜんぶ オリジナル）"},
    {id: "kart", n: "ドリーム・ランナー・グランプリ", area: "sky", kind: "kart", board: {x: 88, z: -86, r: 3.6}, coin: 15, dur: 150,
        desc: "ライバルの ランナーと 2しゅう きそう かけっこ レース！ ↑ダッシュ ↓ブレーキ ←→で ほうこう。ダッシュパネルを ふむと ビューン！ 3いまでに はいれば スタンプ。",
        ref: "かけっこ・ランナー レース系（種類の説明のみ。名前・絵・音は ぜんぶ オリジナル）"}
];
ATTRACTIONS.push(...NEW_ATTRACTIONS, ...NEW5_ATTRACTIONS);
export const STAMPS = ATTRACTIONS.map((a) => a.id);
export const byId = (id) => ATTRACTIONS.find((a) => a.id === id);

export const QUARTET = [
    {id: "rihito", name: "理人（りひと）", look: {shirt: "#3b6fd8", hair: "#2a2a30", style: "short", accent: "#ffd24a"}, at: [-13, 17], yaw: 1.2,
        lines: ["ワンコロランド、ネコネランド、ウサウサランド… ぼくたち 4人で ぜんぶ 全制覇してきたんだ。", "ここ ドリーム・フロンティアは " + ATTRACTIONS.length + "この スタンプが そろえば 全制覇だって。 のこりは メニューの『スタンプちょう』で かくにんできるよ。"]},
    {id: "satoshi", name: "智司（さとし）", look: {shirt: "#e0793a", hair: "#3a2a20", style: "spiky", accent: "#ffffff"}, at: [-11.4, 18.4], yaw: 2.2,
        lines: ["高いところは にがてなんだけど… スカイ・ドロップは のらないと 全制覇に ならないんだよなあ。", "ウサウサランドの 脱出ゲームみたいに、ここの きんこも ばんごうを あわせるらしいよ。"]},
    {id: "akane", name: "赤音（あかね）", look: {shirt: "#d94a6a", hair: "#5a2a1a", style: "long", accent: "#ffe9a0"}, at: [-14.6, 18.6], yaw: .6,
        lines: ["完璧な スケジュール、できてるよ！ パレードは 150びょうごとに 1かい。のがさないでね。", "ファストパスは いらない。ここは まちじかんが ゼロだから！"]},
    {id: "maika", name: "舞華（まいか）", look: {shirt: "#6a4ad8", hair: "#caa070", style: "bun", accent: "#ffb0c8"}, at: [-12.4, 20], yaw: 3.0,
        lines: ["わたし ぜっきょうけいは にがてだけど、ボートと カルーセルは だいすき！", "シューティングは ぜんぶ あてると いいことが あるって うわさだよ。"]},
    // ---- 新しい 3つの アトラクションの 案内係（1枚絵は img/chara/staff_*_f|r|l|b.webp。のりばから すこし はなれた ところに たっている）----
    {id: "staff_jet", name: "空良（そら）", look: {shirt: "#1f3a8a", hair: "#9cb8e8", style: "short", accent: "#ff9a3a"}, at: [79.6, -40.6], yaw: 1.5,
        lines: ["ジェット・ワールドツアーへ ようこそ！ 火星から 木星まで、ぜんぶで 4ふんの たびだよ。", "とちゅうで ぎゃくそうも するから、しっかり つかまってね。 きょくも クラシックふうで もりあがるよ！"]},
    {id: "staff_sweets", name: "琥珀（こはく）", look: {shirt: "#9af0d0", hair: "#e8b84a", style: "spiky", accent: "#ff9ac4"}, at: [-44.4, 63.4], yaw: 2.4,
        lines: ["キラキラ・スイーツ・ブラスターは、ひかりの ブラスターで おかしを ねらう アトラクションだよ。 1500てんで スタンプが もらえるんだ！", "ねらいを つづけて あてると コンボが のびて、てんすうが ぐんぐん ふえるよ。 おいしく ねらってね！"]},
    {id: "staff_aurora", name: "灯（あかり）", look: {shirt: "#2a2a6a", hair: "#cfd2e0", style: "long", accent: "#9be8ff"}, at: [51.2, -71.4], yaw: 3.6,
        lines: ["オーロラ・スカイウィングは、ひかりの つばさで 夜空を とぶ アトラクション。 ロールや ダイブも あるから、びっくりしないでね。", "この ランタンは、ゴールまで みちを てらしてくれる おまもり。 いってらっしゃい！"]}
];
