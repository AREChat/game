# DEVLOG Update32
- 台本エンジン: ST_RUN / ST_CHOICE(はい・いいえ・わからない) / ST_IFFLAG / ST_IFNOT / ST_LEAVE / ST_ACTION / ST_FX / ST_SFX / ST_ENDING / ST_RESET / ST_ADDMON / ST_BOOST。script_advance に 3000回の ほけん。
- 選択は flags[F_CNT_*] に かず(あかりの色)、flags[F_CHOICE_BASE+id] に こたえを きろく。F_END_* は 星の記録で リセットされない。
- 2Dアクション: source/action.c(物理・固定小数 1/256px・コヨーテタイム・ジャンプ先行入力・可変ジャンプ・ダッシュ・バネ・トゲ・光/かげ層・自動スクロール)。面は tools(genlevels.py)で つくり source/data_action.c に 書く。
- 演出: game.c の fx(ゆれ・フラッシュ・ワイプ・紙ふぶき・ダメージ数字)。platform に plat_sfx / plat_shake / plat_voice。
- こうかおん: platform_3ds_gfx.c の sfx_init で 本体の 中で 合成(ファイル不要)。
- ボイス: Windows の Haruka で 合成 → ピッチを かえて 12000Hz 8bit → romfs/voice/<id>_<step>.pcm。
- テスト: test_action(ビームさがし)、test_story(27ルート・星の記録・アスレチック・ボイス整合・でたらめ)、scenario_ch5(第5〜6章 27シード)。
