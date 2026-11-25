#!/bin/sh
# ===== ループ・ラボの ステージ自動生成（cpp/g10gen.cpp）を WebAssembly に ビルドする =====
# ひつよう: clang++（wasm32 に 対応したもの）と wasm-ld。Emscripten は いりません（標準ライブラリを つかわない書き方です）。
# つかいかた: このフォルダ（game10/）で   sh build.sh
# できるもの: js/g10gen.wasm（本体。約 数十KB）。js/g10gen.js が これを よみこみます。
set -e
cd "$(dirname "$0")"
CXX="${CXX:-clang++}"
$CXX --target=wasm32 -O2 -std=c++17 -nostdlib -ffreestanding -fno-exceptions -fno-rtti -fno-builtin -fvisibility=hidden \
  -Wl,--no-entry -Wl,--export-dynamic -Wl,--initial-memory=1048576 -Wl,--max-memory=1048576 -Wl,-z,stack-size=65536 -Wl,--strip-all \
  cpp/g10gen.cpp -o js/g10gen.wasm
echo "✔ js/g10gen.wasm を作りました（$(wc -c < js/g10gen.wasm) バイト）"
