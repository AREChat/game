"use strict";
// ===== GAME9「Cuisine Royale（キュイジーヌロワイヤル）」ステージ定義 =====
// ・敵はすべて「食べもの・調理道具」モチーフ（虫は一切出しません）。形は3Dの基本図形（球・箱・筒など）で表現します。
// ・BGMは bgm/ フォルダの mp3（曲が届くまでは無音でもプレイできます）。
// ・1ステージ＝目標撃破数を倒すか、最終ステージはボスを倒すとクリア。

export const STAGES = [
    {
        key:"s01", title:"山の魔王の厨房", composer:"グリーグ：山の魔王の宮殿にて", track:"bgm/01-hall-of-mountain-king.mp3",
        sky:[0x1a0f2a,0x060208], fog:0x0d0714, target:18, spawnMs:1250, speed:1.05,
        cast:[
            {shape:"sphere", color:0x3a1f12, label:"こげた肉", r:0.5},
            {shape:"box", color:0x171018, label:"黒コショウの塊", r:0.42},
            {shape:"cylinder", color:0x2a2a2a, label:"鉄なべモンスター", r:0.55}
        ]
    },
    {
        key:"s02", title:"闘牛場のタパス祭り", composer:"ビゼー：カルメン前奏曲（闘牛士の歌）", track:"bgm/02-toreador.mp3",
        sky:[0xb33a1f,0x4a1208], fog:0x6a1c0d, target:20, spawnMs:1100, speed:1.2,
        cast:[
            {shape:"sphere", color:0xd92a1f, label:"トマト弾", r:0.42},
            {shape:"cylinder", color:0x7a1f2a, label:"ワインボトル", r:0.35},
            {shape:"box", color:0xe0a030, label:"パエリア皿", r:0.5}
        ]
    },
    {
        key:"s03", title:"回転すしコンベア", composer:"ラヴェル：ボレロ", track:"bgm/03-bolero.mp3",
        sky:[0x0f2a3a,0x071822], fog:0x0a2230, target:26, spawnMs:900, speed:1.35,
        cast:[
            {shape:"cylinder", color:0xe8e0d0, label:"にぎり寿司", r:0.4},
            {shape:"box", color:0x1a5a3a, label:"のり巻き", r:0.4},
            {shape:"sphere", color:0xff6a3a, label:"サーモン玉", r:0.38}
        ]
    },
    {
        key:"s04", title:"しずかなカフェテラス", composer:"サティ：ジムノペディ", track:"bgm/04-gymnopedie.mp3",
        sky:[0x2a3a4a,0x14202a], fog:0x1d2a36, target:14, spawnMs:1700, speed:0.7,
        cast:[
            {shape:"cylinder", color:0xf5f0e6, label:"コーヒーカップ", r:0.4},
            {shape:"cone", color:0xd9b36b, label:"クロワッサン", r:0.42},
            {shape:"icosahedron", color:0xc98fb0, label:"マカロン", r:0.36}
        ]
    },
    {
        key:"s05", title:"吹雪の冷凍庫", composer:"ヴィヴァルディ：四季「冬」", track:"bgm/05-winter.mp3",
        sky:[0xdfeefc,0x9fc2e0], fog:0xcfe4f5, target:22, spawnMs:1050, speed:1.25,
        cast:[
            {shape:"icosahedron", color:0xbfe8ff, label:"アイスクリーム", r:0.42},
            {shape:"cone", color:0xffffff, label:"かき氷", r:0.44},
            {shape:"box", color:0x7fb0d9, label:"冷凍シチュー", r:0.46}
        ]
    },
    {
        key:"s06", title:"お菓子の王国", composer:"チャイコフスキー：くるみ割り人形", track:"bgm/06-nutcracker.mp3",
        sky:[0x6a2a9a,0x2a1050], fog:0x3a1a60, target:24, spawnMs:1000, speed:1.1,
        cast:[
            {shape:"icosahedron", color:0xff6ab0, label:"金平糖", r:0.3},
            {shape:"sphere", color:0xffd43a, label:"キャンディ", r:0.35},
            {shape:"box", color:0x8a5a2a, label:"ジンジャーブレッドマン", r:0.46}
        ]
    },
    {
        key:"s07", title:"運命の鉄板", composer:"ベートーヴェン：交響曲第5番「運命」", track:"bgm/07-fate.mp3",
        sky:[0x1a1a1a,0x3a0a0a], fog:0x200a0a, target:26, spawnMs:850, speed:1.4,
        cast:[
            {shape:"box", color:0x2a2a2a, label:"鉄板", r:0.5},
            {shape:"cylinder", color:0x7a1010, label:"炎の中の肉", r:0.42},
            {shape:"cone", color:0xaaaaaa, label:"シェフナイフ", r:0.3}
        ]
    },
    {
        key:"s08", title:"上品な晩餐会", composer:"モーツァルト：アイネ・クライネ・ナハトムジーク", track:"bgm/08-eine-kleine-nachtmusik.mp3",
        sky:[0x2a1a3a,0x120a1f], fog:0x1c1230, target:20, spawnMs:1150, speed:1.0,
        cast:[
            {shape:"cylinder", color:0xf0e8d8, label:"シャンパングラス", r:0.32},
            {shape:"box", color:0xd9a84a, label:"カナッペ", r:0.4},
            {shape:"icosahedron", color:0x1a2a1a, label:"キャビア", r:0.3}
        ]
    },
    {
        key:"s09", title:"トルコのバザール", composer:"モーツァルト：トルコ行進曲", track:"bgm/09-turkish-march.mp3",
        sky:[0xc97a2a,0x6a3a10], fog:0x7a4414, target:24, spawnMs:950, speed:1.3,
        cast:[
            {shape:"cylinder", color:0x8a4a1f, label:"ケバブ", r:0.42},
            {shape:"box", color:0xd9b36b, label:"バクラヴァ", r:0.4},
            {shape:"sphere", color:0xaa2a2a, label:"チャイポット", r:0.4}
        ]
    },
    {
        key:"s10", title:"パリのカンカン厨房", composer:"オッフェンバック：天国と地獄（カンカン）", track:"bgm/10-can-can.mp3",
        sky:[0x3a1a4a,0x8a1a5a], fog:0x4a1a4a, target:28, spawnMs:800, speed:1.5,
        cast:[
            {shape:"cylinder", color:0xe8d8a0, label:"踊るバゲット", r:0.35},
            {shape:"icosahedron", color:0xf0f0ff, label:"シャンパンの泡", r:0.3},
            {shape:"cone", color:0xffb3d9, label:"クレープ", r:0.42}
        ]
    },
    {
        key:"s11", title:"アルプスのチーズ小屋", composer:"ロッシーニ：ウィリアムテル序曲", track:"bgm/11-william-tell.mp3",
        sky:[0x8fd0e8,0x3a6a8a], fog:0x5a90a8, target:22, spawnMs:1000, speed:1.25,
        cast:[
            {shape:"icosahedron", color:0xf0d060, label:"チーズフォンデュ", r:0.44},
            {shape:"box", color:0x5a3a1f, label:"チョコレート", r:0.4},
            {shape:"cylinder", color:0xd9c090, label:"アルプスのパン", r:0.36}
        ]
    },
    {
        key:"s12", title:"ハンガリーの食卓", composer:"ブラームス：ハンガリー舞曲第5番", track:"bgm/12-hungarian-dance-5.mp3",
        sky:[0x5a1a1a,0x2a0a1a], fog:0x3a1212, target:24, spawnMs:900, speed:1.35,
        cast:[
            {shape:"box", color:0xaa3a1a, label:"グヤーシュなべ", r:0.48},
            {shape:"sphere", color:0xd92a1a, label:"パプリカ", r:0.38},
            {shape:"cylinder", color:0x7a8a3a, label:"ピクルス", r:0.3}
        ]
    },
    {
        key:"s13", title:"英国の晩さん会", composer:"エルガー：威風堂々第1番", track:"bgm/13-pomp-and-circumstance.mp3",
        sky:[0x1a2a4a,0x0a1222], fog:0x16233d, target:22, spawnMs:1000, speed:1.2,
        cast:[
            {shape:"box", color:0x6a2a1a, label:"ローストビーフ", r:0.48},
            {shape:"cylinder", color:0xd9c8a0, label:"紅茶ポット", r:0.36},
            {shape:"icosahedron", color:0xe8d8b0, label:"スコーン", r:0.36}
        ]
    },
    {
        key:"s14", title:"宇宙の晩さん会（最終決戦）", composer:"ホルスト：組曲「惑星」より 木星", track:"bgm/14-jupiter.mp3",
        sky:[0x0a0a2a,0x000010], fog:0x08082a, target:20, spawnMs:900, speed:1.3, boss:true,
        cast:[
            {shape:"sphere", color:0xffd84a, label:"星屑スパイス", r:0.36},
            {shape:"icosahedron", color:0xb0a0ff, label:"流星プリン", r:0.4}
        ],
        bossCast:{shape:"icosahedron", color:0xffe08a, label:"ロイヤル・プディング", r:1.5, hp:16}
    }
];
