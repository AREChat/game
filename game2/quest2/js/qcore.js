"use strict";
// ===== quest.wasm.js（C++の 当たり判定・ダメージ計算）を 読みこんで、
//       JSから 呼びやすい形に ラップする。失敗しても ゲームは 止まらない
//      （failed のままなら、呼び出し側は 元のJS計算に フォールバックする）=====
export const Q = {ready: false, failed: false};
let mod = null;
const boot = (async () => {
    try{
        mod = await window.QuestModule();
        const c = (name, ret, args) => mod.cwrap(name, ret, args);
        Q.world_reset = c("q_world_reset", null, []);
        Q.set_bounds = c("q_set_bounds", null, ["number", "number", "number", "number"]);
        Q.add_rect = c("q_add_rect", "number", ["number", "number", "number", "number"]);
        Q.add_circle = c("q_add_circle", "number", ["number", "number", "number"]);
        Q.hit = c("q_hit", "number", ["number", "number", "number"]);
        const moveC = c("q_move", "number", ["number", "number", "number", "number", "number"]);
        Q.move = (x, z, dx, dz, r) => { const p = moveC(x, z, dx, dz, r) >>> 0; const f = mod.HEAPF32; const i = p >> 2; return [f[i], f[i + 1]]; };
        const freeSpotC = c("q_free_spot", "number", ["number", "number"]);
        Q.freeSpot = (x, z) => { const p = freeSpotC(x, z) >>> 0; const f = mod.HEAPF32; const i = p >> 2; return [f[i], f[i + 1]]; };
        const dmgC = c("q_damage", "number", ["number", "number", "number", "number", "number", "number", "number"]);
        Q.damage = (atk, def, rnd01, rnd2, critRate, guard, forceCrit) => {
            const p = dmgC(atk, def, rnd01, rnd2, critRate, guard ? 1 : 0, forceCrit ? 1 : 0) >>> 0; const f = mod.HEAPF32; const i = p >> 2;
            return {d: f[i], crit: f[i + 1] !== 0};
        };
        Q.ready = true;
    }catch(err){
        Q.failed = true; console.warn("quest.wasm 読みこみ失敗。JS計算にフォールバックします。", err);
    }
})();
export const qReady = boot;
