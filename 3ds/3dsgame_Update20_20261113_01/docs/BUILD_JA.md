# ビルドと3DSへの入れ方（Windows + MSYS2 / devkitPro）

## 0. 重要
- 画面の `MSYS2 UCRT64` は通常のMSYS2で、**3DS用コンパイラ（devkitARM）は入っていません**。
  3DS用は **devkitPro 公式インストーラ**（https://devkitpro.org/wiki/Getting_Started ）で入れるのが確実です。
  インストーラが専用のMSYS2（スタートメニューに「MSYS2 MSYS」と出る、紫色のアイコンの方）を同梱します。
  → このゲームのビルドは **「MSYS2 MSYS」（devkitProのもの）** のシェルで行います。
- 既存のUCRT64で行う場合は、devkitProのpacmanリポジトリを追加する必要があり手順が増えます。迷ったら上記の公式インストーラ推奨。

## 1. 初回だけ
1. devkitProインストーラで「Nintendo 3DS」を含めてインストール。
2. 「MSYS2 MSYS」を開き、次を実行（まだなら）：
   ```
   sudo dkp-pacman -S 3ds-dev
   ```
   （`3ds-dev` に libctru / citro2d / citro3d が含まれます）

## 2. ビルド
```
cd /c/あなたのパス/hoshiakari      # zipを展開したフォルダ
make
```
→ `hoshiakari.3dsx` と `hoshiakari.smdh` ができます。

## 3. 2DS LL（改造済み）へ入れる
1. SDカードの `/3ds/hoshiakari/` を作り、`hoshiakari.3dsx` をコピー。
2. 本体で Homebrew Launcher を起動 → 「Hoshiakari Eiyuutan」を選択して起動。
3. （任意）.cia にしてホーム画面に置く場合は bannertool + makerom が必要（後日のアップデートで手順を追加）。

## 4. PCだけでロジックを検証（ツールチェーン不要）
```
sh tools/run_tests.sh      # gcc があれば実行できます（MSYS2 UCRT64でも可: pacman -S mingw-w64-ucrt-x86_64-gcc make）
```
データ整合性・戦闘・セーブ・禁止語チェックが走ります。

## 5. うまくいかない時
- `DEVKITARM` 未設定エラー → 「MSYS2 MSYS」（devkitPro側）で実行しているか確認。
- Makefileで詰まったら devkitPro の `3ds-examples/templates/application/Makefile` をコピーして、`SOURCES := source`、`LIBS := -lcitro2d -lcitro3d -lctru -lm` に変更し、`platform_host.c` を除外してください。
- 画面が文字化け → 本ゲームは本体の日本語フォント（citro2d）を使います。実機が日本語設定でなくても表示できますが、リージョン設定によっては字形が異なります。
