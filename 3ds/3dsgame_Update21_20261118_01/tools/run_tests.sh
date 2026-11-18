#!/bin/sh
# PC上でロジックとデータを検証する(3DS実機ツールチェーン不要)
set -e
cd "$(dirname "$0")/.."
mkdir -p build_host
CFLAGS="-std=c99 -Wall -Wextra -Werror -Wno-unused-parameter -O1 -g"
# Update15: 第8章のデータ(試験会場前広場・手がかり・判断)と台本の単体テスト(game.c非依存)
gcc $CFLAGS source/ch8data.c source/ch8script.c tests/test_ch8.c -o build_host/test_ch8
./build_host/test_ch8
# Update14: 画像・人と建物の見分け(sprites)の対応表の単体テスト(game.c非依存)
gcc $CFLAGS source/sprites.c source/ch7data.c tests/test_sprites.c -o build_host/test_sprites
./build_host/test_sprites
# Update13: 第7章のデータ(駅広場・手紙の手がかり・判断)と台本の単体テスト(game.c非依存)
gcc $CFLAGS source/ch7data.c source/ch7script.c tests/test_ch7.c -o build_host/test_ch7
./build_host/test_ch7
# Update12: 第6章のデータ(舞台・手がかり・暗記法の判定)と台本の単体テスト(game.c非依存)
gcc $CFLAGS source/ch6data.c source/ch6script.c tests/test_ch6.c -o build_host/test_ch6
./build_host/test_ch6
# Update11: 第5章のデータ(舞台・手がかり・立ち直りの判定)と台本の単体テスト(game.c非依存)
gcc $CFLAGS source/ch5data.c source/ch5script.c tests/test_ch5.c -o build_host/test_ch5
./build_host/test_ch5
# Update10: 第4章のデータ(マップ・手がかり・説得の判定)と台本の単体テスト(game.c非依存)
gcc $CFLAGS source/ch4data.c source/ch4script.c tests/test_ch4.c -o build_host/test_ch4
./build_host/test_ch4
# Update09: 第3章のスクリプト(推理シーン・クロモリへの引っ越し導入)の単体テスト(game.c非依存)
gcc $CFLAGS source/ch3script.c tests/test_ch3script.c -o build_host/test_ch3script
./build_host/test_ch3script
# Update08: 第3章のマップ・調査スポット・会話データの単体テスト(game.c非依存)
gcc $CFLAGS source/ch3data.c source/clue.c tests/test_ch3data.c -o build_host/test_ch3data
./build_host/test_ch3data
# Update07: 第3章の手がかりボード・第4章の名前記憶ミニゲームの単体テスト(game.c非依存)
gcc $CFLAGS source/clue.c source/namemem.c tests/test_clue_name.c -o build_host/test_clue_name
./build_host/test_clue_name
# Update06: 数あてマジック(ひらめきタイム)ロジックの単体テスト(game.c非依存)
gcc $CFLAGS source/puzzle.c tests/test_puzzle.c -o build_host/test_puzzle
./build_host/test_puzzle
# Update05: 経験値成長・エンカウント判定の単体テスト(game.c非依存)
gcc $CFLAGS source/growth.c source/encounter.c tests/test_growth_enc.c -o build_host/test_growth_enc
./build_host/test_growth_enc
# Update04: 装備セーブ変換・行動順ロジックの単体テスト(game.c非依存)
gcc $CFLAGS source/equip_save.c source/turn_order.c tests/test_equip_order.c -o build_host/test_equip_order
./build_host/test_equip_order
# Update03: 戦闘強化ロジックの単体テスト(game.c非依存)
gcc $CFLAGS source/battle_ai.c tests/test_battle.c -o build_host/test_battle
./build_host/test_battle
# Update02: shop/宿屋/装備ロジックの単体テスト(game.c非依存)
gcc $CFLAGS source/shop.c tests/test_shop.c -o build_host/test_shop
./build_host/test_shop
# 本体テスト
gcc $CFLAGS \
 source/game.c source/data_story.c source/data_world.c source/platform_host.c tests/test_main.c \
 -o build_host/test_game
./build_host/test_game
python3 tools/check_banned.py
# Update16: データ監査(台本のはみ出し・NPC到達・ワープ先など)
gcc -std=c99 -Wall -Wextra -Wno-unused-parameter -O1 -g -Isource source/game.c source/data_story.c source/data_world.c source/platform_host.c tools/audit_data.c -o build_host/audit_data
./build_host/audit_data
# Update16: 通しプレイ(はじめ→第2章クリア)を乱数の種20通りで実行。1つでも失敗したらここで止まる
gcc -std=c99 -Wall -Wextra -Wno-unused-parameter -Wno-misleading-indentation -O1 -g -Isource source/game.c source/data_story.c source/data_world.c source/platform_host.c tools/playtest.c -o build_host/playtest
for seed in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  rm -f build_host/playtest_save.dat
  ./build_host/playtest build_host/playtest_save.dat $seed q < tools/scenario_ch1_2.txt > build_host/playtest_$seed.log || { echo "通しプレイ失敗(seed=$seed) build_host/playtest_$seed.log を見てください"; tail -20 build_host/playtest_$seed.log; exit 1; }
done
echo "通しプレイ: 20通りの乱数すべて合格"
