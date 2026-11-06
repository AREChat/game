# game（ゲーム）

AREChat のゲーム置き場です。チャットアプリは `AREChat/AREDA`、学習アプリは `AREChat/LearnLab124` にあります。

- 2026-11-05：旧 `AREChat/ARE` から、game・game2〜game7（と、それらが使う shared/・dream-frontier/・protect.js・apple-touch-icon.png）をそのまま移しました。
- このあと、ゲームは game1〜game5 に再編成する予定です（旧 `game` は新 game1 に相当）。

## exe（パソコン用アプリ）と Web（サーバー公開）の区別

同じゲームのファイルを、2 つの形で使います。違いは「おわる」ボタンだけです（`game/mode.js` が見分けます）。

| | exe（パソコン用アプリ） | Web（GitHub Pages など） |
|---|---|---|
| 「おわる」 | アプリ（画面）を終了する | チャット画面にもどる |
| ボタンの表示 | ✖ おわる | ← チャットへ |
| 見分け方 | `window.areDesktop`（`desktop/preload.js` が用意） | それが無いとき |

- Web で「もどる」先は、`?back=https://arechat.github.io/AREDA/chat.html` で指定できます（ARE / AREDA のチャットだけ有効）。指定が無ければ、チャットから来たページ（referrer）、それも無ければ `https://arechat.github.io/ARE/chat.html` です。
- 動作確認用に、ブラウザで `…/game/index.html?mode=exe` と開くと、exe 側の表示になります。

### exe の作り方
1. GitHub の **Actions** タブ →「exe を作る（ARE QUEST）」→ **Run workflow**。
2. 終わったら、その実行の **Artifacts**（`ARE-QUEST-exe`）から `ARE-QUEST.exe` をダウンロード（インストール不要・ダブルクリックで起動）。
3. `exe-v1.0.0` のようなタグを付けて push すると、**Releases** にも自動で置かれます。

パソコン（Windows）で自分で作る場合：`cd desktop && npm install && npm run dist`（`desktop/dist/` に出ます）。試しに動かすだけなら `npm start`。
アプリの中身は `desktop/build-app.js` が `game/`・`shared/`・`protect.js` を `desktop/app/` にコピーして作るので、ゲームを直したら、exe を作り直すだけで反映されます。
