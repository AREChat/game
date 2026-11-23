#!/bin/sh
# ===== 星紡ぎの旅人 の戦闘計算エンジン（cpp/battle.cpp）を WebAssembly に ビルドする =====
# つかいかた: このフォルダ（game4/starweaver/）で   sh build.sh
# できるもの: js/battle.wasm.js（読みこみ用スクリプト）と js/battle.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
mkdir -p js
emcc cpp/battle.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=BattleModule -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_battle_player_attack,_battle_enemy_attack,_battle_level_up,_battle_lvup_level,_battle_lvup_xp,_battle_win_chance,_battle_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall \
  -o js/battle.wasm.js
echo "✔ js/battle.wasm.js / js/battle.wasm.wasm を作りました"
