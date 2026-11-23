"use strict";
// ===== GAME9「AREshoot（美食の晩餐会）」ステージ定義 =====
// TPSガンシューティング。各ステージ＝厨房モチーフの戦場＋ライバルシェフ（敵）を目標数たおすと、
// その皿の「鬼軍曹シェフ」（ボス）が出現。ボスをたおすとクリア。
// 難易度（敵の体力・移動速度・射撃レート・弾速）はステージが進むほど少しずつ上がる。

export const STAGES = [
    {key:"s01", title:"第1皿　魔王の竈ごちそう", composer:"グリーグ：山の魔王の宮殿にて", track:"bgm/01-hall-of-mountain-king.mp3",
     sky:[0x3a2050,0x0d0714], fog:0x120a1c, killTarget:10, bossName:"焦がし肉の鬼軍曹", enemyColor:0x8a4a2a, floorColor:0x241827},
    {key:"s02", title:"第2皿　闘牛場のタパス宴", composer:"ビゼー：カルメン前奏曲（闘牛士の歌）", track:"bgm/02-toreador.mp3",
     sky:[0xb33a1f,0x4a1208], fog:0x5a1c0d, killTarget:11, bossName:"闘牛士シェフ", enemyColor:0xd9432a, floorColor:0x3a1710},
    {key:"s03", title:"第3皿　回転寿司のワルツ", composer:"ラヴェル：ボレロ", track:"bgm/03-bolero.mp3",
     sky:[0x0f2a3a,0x071822], fog:0x0a2230, killTarget:12, bossName:"大将ロボ", enemyColor:0x2a8a6a, floorColor:0x0f2430},
    {key:"s04", title:"第4皿　静寂のカフェタイム", composer:"サティ：ジムノペディ", track:"bgm/04-gymnopedie.mp3",
     sky:[0x2a3a4a,0x14202a], fog:0x1d2a36, killTarget:11, bossName:"カフェの支配人", enemyColor:0xd9b36b, floorColor:0x1c2630},
    {key:"s05", title:"第5皿　氷の晩餐", composer:"ヴィヴァルディ：四季「冬」", track:"bgm/05-winter.mp3",
     sky:[0x9fc2e0,0x2a3a50], fog:0x3a4a60, killTarget:13, bossName:"氷の盛付け人", enemyColor:0x7fb0d9, floorColor:0x1a2a3a},
    {key:"s06", title:"第6皿　お菓子の王国", composer:"チャイコフスキー：くるみ割り人形", track:"bgm/06-nutcracker.mp3",
     sky:[0x6a2a9a,0x2a1050], fog:0x3a1a60, killTarget:13, bossName:"くるみ割りシェフ長", enemyColor:0xff6ab0, floorColor:0x2a1838},
    {key:"s07", title:"第7皿　運命の鉄板焼き", composer:"ベートーヴェン：交響曲第5番「運命」", track:"bgm/07-fate.mp3",
     sky:[0x3a0a0a,0x1a1a1a], fog:0x200a0a, killTarget:14, bossName:"運命の鉄板鬼", enemyColor:0x7a1010, floorColor:0x1c1010},
    {key:"s08", title:"第8皿　優雅なディナー", composer:"モーツァルト：アイネ・クライネ・ナハトムジーク", track:"bgm/08-eine-kleine-nachtmusik.mp3",
     sky:[0x2a1a3a,0x120a1f], fog:0x1c1230, killTarget:14, bossName:"優雅なソムリエ", enemyColor:0xd9a84a, floorColor:0x201230},
    {key:"s09", title:"第9皿　金平糖の精の舞踏会", composer:"チャイコフスキー：くるみ割り人形　金平糖の精の踊り", track:"bgm/09-dance-of-the-sugar-plum-fairy.mp3",
     sky:[0x3a1a4a,0x1a0a30], fog:0x2a1240, killTarget:15, bossName:"金平糖の精", enemyColor:0xffb3e0, floorColor:0x2a1838},
    {key:"s10", title:"第10皿　カンカン・キッチン", composer:"オッフェンバック：天国と地獄（カンカン）", track:"bgm/10-can-can.mp3",
     sky:[0x8a1a5a,0x3a1a4a], fog:0x4a1a4a, killTarget:15, bossName:"カンカン親方", enemyColor:0xe8d8a0, floorColor:0x381a38},
    {key:"s11", title:"第11皿　アルプスのチーズ祭り", composer:"ロッシーニ：ウィリアムテル序曲", track:"bgm/11-william-tell.mp3",
     sky:[0x8fd0e8,0x3a6a8a], fog:0x5a90a8, killTarget:16, bossName:"チーズ砲台長", enemyColor:0xf0d060, floorColor:0x1a3040},
    {key:"s12", title:"第12皿　シェフの剣舞", composer:"ハチャトゥリアン：剣の舞", track:"bgm/12-sabre-dance.mp3",
     sky:[0x6a0a1a,0x2a0510], fog:0x3a0a16, killTarget:16, bossName:"剣舞の鬼シェフ", enemyColor:0xc0c0c0, floorColor:0x2a0a16},
    {key:"s13", title:"第13皿　英国式晩さん会", composer:"エルガー：威風堂々第1番", track:"bgm/13-pomp-and-circumstance.mp3",
     sky:[0x1a2a4a,0x0a1222], fog:0x16233d, killTarget:17, bossName:"執事長", enemyColor:0x6a2a1a, floorColor:0x101c30},
    {key:"s14", title:"第14皿　全力配膳レース（最終決戦）", composer:"ネッケ：クシコスポスト", track:"bgm/14-csikos-post.mp3",
     sky:[0xff9a4a,0x5a1e10], fog:0x6a2a14, killTarget:18, bossName:"グランド・プディング総料理長", enemyColor:0xffd84a, floorColor:0x3a1c10}
];

// 難易度カーブ：ステージが進むほど 敵の体力・射撃レート・弾速がゆるやかに上昇する。
export function difficultyFor(idx){
    const t = idx / Math.max(1, STAGES.length - 1);
    return {
        hpMul: 1.0 + t * 1.3,
        speedMul: 1.0 + t * 0.5,
        fireMul: 1.0 + t * 0.7,
        bulletMul: 1.0 + t * 0.4
    };
}
