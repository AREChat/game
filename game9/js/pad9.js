/* ゲーム9：ゲームパッド（プロコン）読み取りの共通部品。
   ニンテンドー配置が標準（右＝A 決定／下＝B もどる）。Xbox・Steam配置への切りかえは、共通の「🎮 ボタン設定」（shared/are-padmap.js）でおこなう。
   ここは「ゲームが見る A／B／X／Y」だけを読む（配置の入れかえは are-padmap.js が済ませてから、ここへ とどく）。 */
(function(){
    "use strict";
    var prev = {};
    var NAMES = {b: 0, a: 1, y: 2, x: 3, l: 4, r: 5, zl: 6, zr: 7, minus: 8, plus: 9, l3: 10, r3: 11};
    function first(){
        try{ var l = navigator.getGamepads ? navigator.getGamepads() : []; for(var i = 0; i < l.length; i++) if(l[i] && l[i].connected) return l[i]; }catch(_e){}
        return null;
    }
    function dz(v){ v = v || 0; return Math.abs(v) < 0.18 ? 0 : v; }
    // read(): いまの状態。h＝おしている／e＝いま おした（1回だけ）
    function read(){
        var p = first(), o = {on: !!p, f: 0, s: 0, rx: 0, ry: 0, h: {}, e: {}};
        if(!p){ prev = {}; return o; }
        function bt(i){ return !!(p.buttons[i] && p.buttons[i].pressed); }
        var ax = p.axes || [];
        o.s = Math.max(-1, Math.min(1, dz(ax[0]) + (bt(15) ? 1 : 0) - (bt(14) ? 1 : 0)));
        o.f = Math.max(-1, Math.min(1, -dz(ax[1]) + (bt(12) ? 1 : 0) - (bt(13) ? 1 : 0)));
        o.rx = dz(ax[2]); o.ry = dz(ax[3]);
        var cur = {};
        for(var k in NAMES){ cur[k] = bt(NAMES[k]); o.h[k] = cur[k]; o.e[k] = cur[k] && !prev[k]; }
        prev = cur;
        return o;
    }
    window.Pad9 = {read: read};
})();
