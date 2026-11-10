# game（ゲーム）

AREChat のゲーム置き場です。チャットアプリは `AREChat/ARE`、学習アプリは `AREChat/LearnLab124` にあります。

- 2026-11-05：旧 `AREChat/ARE` から、game・game2〜game7（と、それらが使う shared/・dream-frontier/・protect.js・apple-touch-icon.png）をそのまま移しました。
- 2026-11-08：パッド（プロコン）のボタン配置を、ボタン1つ1つ好きに変えられる『🎮 ボタン設定』を追加（`shared/are-padmap.js`。各ゲームのタイトルから開く。マウス不要。設定はこの端末に保存）。
- 2026-11-08：ゲームを **4つのフォルダ** に統合しました：`game`（ARE QUEST）／`game2`（`quest2`＝ARE QUEST 2、`quest3`＝ARE QUEST 3）／`game4`（`card`＝ARE CARD、`starweaver`＝星紡ぎの旅人。旧 game6）／`game5`（`play`＝推理ゲーム、`blocks`＝ARE BLOCKS。旧 game7）。`game2`・`game4`・`game5` の `index.html` は、中の ゲームを えらぶ入口ページです。タイトル画面から お互いに行き来できます（一覧は `shared/game-nav.js` の1か所だけ。ブラウザ版のみ。exe には ARE QUEST だけが入っているので出しません）。保存データは同じ場所（同一オリジン）なので引き継がれます。

## exe（パソコン用アプリ）と Web（サーバー公開）の区別

同じゲームのファイルを、2 つの形で使います。違いは「おわる」ボタンだけです（`game/mode.js` が見分けます）。

| | exe（パソコン用アプリ） | Web（GitHub Pages など） |
|---|---|---|
| 「おわる」 | アプリ（画面）を終了する | チャット画面にもどる |
| ボタンの表示 | ✖ おわる | ← チャットへ |
| 見分け方 | `shared/are-mode.js`：`window.areDesktop`（Electron）／アドレスが `127.0.0.1`・`localhost`（Go 版 exe）／`?mode=exe` | それ以外（https） |
| file:// で直接開いた版 | 画面を閉じる（閉じられなければ「おつかれさま」の画面） | — |

- Web で「もどる」先は、`?back=https://arechat.github.io/ARE/chat.html` で指定できます（ARE のチャット・ログインだけ有効）。指定が無ければ、チャットから来たページ（referrer）、それも無ければ AREDA のログイン画面（`https://arechat.github.io/ARE/login.html`。ログイン済みなら、そのままチャットに入ります）です。
- exe・file では、チャットなど外のアドレスへのリンクは隠し、ゲーム内の「もどる」はゲーム一覧に向けます。
- 動作確認用に、ブラウザで `…/game/index.html?mode=exe` と開くと、exe 側の表示になります。

### exe の作り方
**毎週 金曜 20:00（日本時間）に自動で作られます**（Actions →「exe を作る」の Artifacts に出ます。タグのときだけ Releases にも置きます）。手動で作るときは：
1. GitHub の **Actions** タブ →「exe を作る（ARE QUEST）」→ **Run workflow**。
2. 終わったら、その実行の **Artifacts**（`ARE-QUEST-exe`）から `ARE-QUEST.exe` をダウンロード（インストール不要・ダブルクリックで起動）。
3. `exe-v1.0.0` のようなタグを付けて push すると、**Releases** にも自動で置かれます。

パソコン（Windows）で自分で作る場合：`cd desktop && npm install && npm run dist`（`desktop/dist/` に出ます）。試しに動かすだけなら `npm start`。
アプリの中身は `desktop/build-app.js` が `game/`・`shared/`・`protect.js` を `desktop/app/` にコピーして作るので、ゲームを直したら、exe を作り直すだけで反映されます。

## 軽量化メモ（2026-11-08）
- BGM(mp3)は すべて 96kbps に圧縮（137MB → 約72MB。長さ・ループはそのまま）。
- 大きかった画像（game/img/title.webp、game2/quest2/img/icon.webp・thumb.webp、game5/play/img/title_bg.jpg）を縮小。
- Three.js は 同じ版(0.160.0)の公式 `three.module.min.js` に差しかえ（1.27MB → 0.67MB）。
- ARE QUEST の sw.js は 毎回の再確認をやめ、ブラウザの短い控えを使う（2回目から速い。更新の反映は最大でも数分）。

## ARE QUEST の JS は「まとめて」配信している（2026-11-09）
- `game/index.html` が読む JS 66本は、`game/game.bundle-1.js`〜`4.js` の 4本の束にまとめてある（リクエスト 93 → 32）。
- **`game/*.js` を直したら、かならず `node tools/build-game.js` を実行して、できた `game.bundle-*.js` と `index.html` も一緒にコミットする。**
  忘れても GitHub Actions「ARE QUEST のまとめファイルを自動で最新にする」が 1〜2分後に作り直してコミットしてくれる（それまでの間だけ 古い内容が出る）。
  確認だけなら `node tools/build-game.js --check`。ローカルで `git pull` するときは、そのコミットも取りこむこと。
- 新しい JS を足す／順番をかえる時は `tools/game-bundle-sources.txt` を直す（`---` は束の区切り）。
- ビルドは中身を 1文字もかえない（つなげるだけ）。次のどれかだと失敗して教えてくれる：先頭が `"use strict"` でない／同じ束に同名の関数・const がある／構文エラー。
- 束が読めない時は、`game.bundle-fb.js` が まだ動いていないファイルを元のファイルで 1本ずつ読み直す（今までと同じ動き）。
