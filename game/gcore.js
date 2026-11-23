"use strict";
// ===== game.wasm.js（C++の ダメージ計算・重みつき抽選・行動順ならべ）を 読みこんで、
//       使いやすい形に ラップする。失敗・読みこみ中は GCore.ready が false のままで、
//       呼び出し側（battle.js など）は 元のJS計算に フォールバックする =====
var GCore = {ready: false, failed: false};
(function(){
    function boot(){
        if(typeof window.GameCoreModule !== "function"){ GCore.failed = true; return; }
        window.GameCoreModule().then(function(mod){
            try{
                var c = function(name, ret, args){ return mod.cwrap(name, ret, args); };
                var dmgC = c("g_damage", "number", ["number", "number", "number", "number", "number", "number", "number"]);
                GCore.damage = function(atk, def, mult, rnd1, rnd2, critRate, forceCrit){
                    var p = dmgC(atk, def, mult, rnd1, rnd2, critRate, forceCrit ? 1 : 0) >>> 0;
                    var f = mod.HEAPF32, i = p >> 2;
                    return {d: f[i], crit: f[i + 1] !== 0};
                };
                var pickC = c("g_weighted_pick", "number", ["number", "number", "number"]);
                GCore.weightedPick = function(weights, rnd01){
                    var n = weights.length; if(n <= 0) return 0;
                    var ptr = mod._malloc(n * 4); mod.HEAPF32.set(weights, ptr >> 2);
                    var r = pickC(ptr, n, rnd01); mod._free(ptr); return r;
                };
                var orderC = c("g_turn_order", "number", ["number", "number"]);
                GCore.turnOrder = function(keys){
                    var n = keys.length; if(n <= 0) return [];
                    var ptr = mod._malloc(n * 4); mod.HEAPF32.set(keys, ptr >> 2);
                    var p = orderC(ptr, n) >>> 0; mod._free(ptr);
                    var out = []; var i32 = mod.HEAP32, base = p >> 2;
                    for(var i = 0; i < n; i++) out.push(i32[base + i]);
                    return out;
                };
                GCore.ready = true;
            }catch(err){ GCore.failed = true; if(window.console) console.warn("game.wasm 読みこみ失敗。JS計算にフォールバックします。", err); }
        }).catch(function(err){ GCore.failed = true; if(window.console) console.warn("game.wasm 読みこみ失敗。JS計算にフォールバックします。", err); });
    }
    boot();
})();
