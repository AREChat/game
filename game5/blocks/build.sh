#!/bin/sh
# ===== ARE BLOCKS の判定・AIエンジン（cpp/blocks.cpp）を WebAssembly に ビルドする =====
# つかいかた: このフォルダ（game5/blocks/）で   sh build.sh
# できるもの: js/blocks.wasm.js（読みこみ用スクリプト）と js/blocks.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
mkdir -p js
emcc cpp/blocks.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=BlocksModule -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_blk_collide,_blk_merge,_blk_clear_lines,_blk_add_garbage,_blk_eval_grid,_blk_try_placement,_blk_drop_y,_blk_seed,_blk_rand_int,_blk_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPU8,HEAP32 \
  -o js/blocks.wasm.js
echo "✔ js/blocks.wasm.js / js/blocks.wasm.wasm を作りました"
