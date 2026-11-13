"use strict";
// タイトル画面の「ひみつ」を つなぐ（このページは 安全のため、ページの中に直接書く script を つかえないので、別ファイルにしてある）
// ARE QUEST では キーボードの Z が「決定」なので、ひみつの「B」ボタンは V キーに つけかえる（ゲームパッドの B は そのまま）
TitleSecrets.attach({title: function(){ return !!(document.body.dataset.mode === "title"); }, host: "#stage", keys: {KeyZ: null, KeyV: "B"}});
