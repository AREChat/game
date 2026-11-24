"use strict";
// game/index.html の CSP（script-src 'self'。インラインscript 禁止）に あわせて、
// AREFeaturePanel.init(...) の 呼び出しを 外部ファイルに 分けている。
(function(){
    if(!window.AREFeaturePanel) return;
    window.AREFeaturePanel.init({
        gameId: "game",
        title: "⚔️ 戦闘 せいせき分析＆実績",
        lowerIsBetter: true,
        unit: "ターン",
        rules: [
            {id:"tq_firstwin", title:"はじめての勝利", desc:"戦闘に 1回 勝つ", icon:"⚔️", field:"wins", op:"gte", value:1},
            {id:"tq_20wins", title:"かけだし冒険者", desc:"戦闘に 20回 勝つ", icon:"🗡️", field:"wins", op:"gte", value:20},
            {id:"tq_100wins", title:"百戦錬磨", desc:"戦闘に 100回 勝つ", icon:"🛡️", field:"wins", op:"gte", value:100},
            {id:"tq_boss1", title:"ボスキラー", desc:"ボス戦に 1回 勝つ", icon:"👑", field:"bossWins", op:"gte", value:1},
            {id:"tq_boss5", title:"ボスハンター", desc:"ボス戦に 5回 勝つ", icon:"🏆", field:"bossWins", op:"gte", value:5},
            {id:"tq_lv10", title:"レベル10到達", desc:"キャラクターが レベル10に なる", icon:"📈", field:"lv", op:"gte", value:10},
            {id:"tq_lv30", title:"レベル30到達", desc:"キャラクターが レベル30に なる", icon:"🌟", field:"lv", op:"gte", value:30}
        ],
        getLiveStats: function(){
            var rec = {wins:0, bossWins:0, lv:1};
            try{ rec = JSON.parse(localStorage.getItem("tq_battle_rec") || "null") || rec; }catch(_e){}
            return {wins: rec.wins || 0, bossWins: rec.bossWins || 0, lv: rec.lv || 1};
        }
    });
})();
