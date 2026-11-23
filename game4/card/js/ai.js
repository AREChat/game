"use strict";
// ===== CPU の思考（わかりやすい 点数づけ）。level 0=やさしい 1=ふつう 2=つよい =====
// 盤面の進行（カードを出す・攻撃する・演出）は rules.js（JS）のまま。
// 「どの行動が良さそうか」を数値で比べる部分（判定・スコア計算）だけ、C++(WebAssembly)で計算する（cpp/card_ai.cpp）。
// wasmの読みこみに失敗した場合は、元のJS計算（フォールバック）に自動で切りかわる。
import {LIMITS} from "./rules.js";

const OP_CODE = {dmg: 0, draw: 1, heal: 2, healdraw: 3, buff: 4, haste: 5, lamp: 6, destroy: 7, bigl: 8, healAlly: 9, stormDraw: 10};
const NOISE = [6, 2.2, .4];

let M = null, ready = null, failed = false;
function boot(){
    if(ready) return ready;
    ready = (async () => {
        try{
            if(typeof window.CardAIModule !== "function") throw new Error("CardAIModule がありません");
            M = await window.CardAIModule();
            M._card_ai_seed((Date.now() ^ 0x9e3779b9) >>> 0);
        }catch(e){ failed = true; console.warn("card_ai wasm 読みこみ失敗。JS計算にきりかえます。", e); }
    })();
    return ready;
}
boot();

// ---------- JSフォールバック（wasmが使えない時だけ使う。元の計算式と同じ） ----------
function scoreActionJS(G, pi, a){
    const me = G.p[pi], foe = G.p[1 - pi]; const db = G.db;
    if(a.k === "unit"){ const c = a.c; let s = 4 + c.cost * 1.6 + (c.kw.includes("haste") ? 3 : 0) + (c.kw.includes("guard") && me.base.hp < 12 ? 3 : 0); if(c.fx.some((f) => f.op === "dmg")) s += 2; return s; }
    if(a.k === "spell"){
        const c = a.c, v = c.v || 0, t = a.target;
        switch(c.op){
            case "dmg": {
                if(c.tg === "allEnemy"){ let kills = 0, n = 0; foe.board.forEach((u) => { if(u){ n++; if(u.hp <= v) kills++; } }); return n ? 2 + kills * 4 + n * 1.5 : -1; }
                if(t.t === "base") return foe.base.hp <= v ? 200 : 2 + v * .6 + (foe.base.hp <= 8 ? 4 : 0);
                const u = foe.board[t.slot]; if(!u) return -1; const cu = db[u.id]; return u.hp <= v ? 5 + cu.cost * 2 + u.atk : 1 + v * .4;
            }
            case "draw": return me.hand.length <= 6 ? 7 : 1;
            case "heal": case "healdraw": return me.base.max - me.base.hp >= 4 ? 5 + (me.base.hp <= 10 ? 5 : 0) : -1;
            case "buff": case "haste": { const u = me.board[t.slot]; if(!u) return -1; return 4 + u.atk * .5 + (c.op === "haste" && u.sick ? 4 : 0); }
            case "lamp": return me.hand.some((id) => db[id].cost > me.lamps && db[id].cost <= me.lamps + v) ? 9 : -1;
            case "destroy": { const u = foe.board[t.slot]; if(!u || u.hp > v) return -1; return 6 + db[u.id].cost * 2; }
            case "bigl": { const n = foe.board.filter(Boolean).length; return n >= 2 ? 6 + n * 2 : 1; }
            case "healAlly": { const d = me.board.reduce((s, u) => s + (u ? Math.min(v, u.max - u.hp) : 0), 0); return d >= 4 ? 4 + d * .3 : -1; }
            case "stormDraw": return me.hand.length <= 6 ? 6 : 1;
            default: return 0;
        }
    }
    if(a.k === "attack"){
        const u = me.board[a.slot]; const t = a.target;
        if(t.t === "base"){ if(foe.base.hp <= u.atk) return 300; const threats = foe.board.some((x) => x && x.atk >= u.hp); return 5 + u.atk * 1.2 + (foe.base.hp <= 10 ? 3 : 0) - (threats ? 1 : 0); }
        const x = foe.board[t.slot]; if(!x) return -1;
        const kills = u.atk >= x.hp, dies = x.atk >= u.hp, cx = db[x.id].cost, cu = db[u.id].cost;
        if(kills && !dies) return 12 + cx * 2; if(kills && dies) return cx >= cu ? 6 + cx - cu : -3 + cx;
        if(!kills && dies) return -8; return x.guard ? 3 : 1;
    }
    return 0;
}

// ---------- wasm版：盤面の状況を C++側の文脈(ctx)に書きこんでから、各候補を評価する ----------
function syncCtx(G, pi){
    const me = G.p[pi], foe = G.p[1 - pi], db = G.db;
    M._card_ctx_reset();
    M._card_ctx_set_me_base(me.base.hp, me.base.max, me.lamps, me.hand.length);
    M._card_ctx_set_foe_base(foe.base.hp, foe.base.max);
    for(let i = 0; i < LIMITS.slots; i++){
        const u = me.board[i]; if(u) M._card_ctx_set_my_unit(i, u.atk, u.hp, u.max, db[u.id].cost, u.guard ? 1 : 0, u.haste ? 1 : 0, u.sick ? 1 : 0, u.acted ? 1 : 0);
        const x = foe.board[i]; if(x) M._card_ctx_set_foe_unit(i, x.atk, x.hp, x.max, db[x.id].cost, x.guard ? 1 : 0);
    }
    me.hand.forEach((id, i) => { if(i < 9) M._card_ctx_set_hand_cost(i, db[id].cost); });
}
function scoreActionWASM(G, pi, a){
    const db = G.db;
    if(a.k === "unit"){ const c = a.c; return M._card_ai_score_unit(c.cost, c.kw.includes("haste") ? 1 : 0, c.kw.includes("guard") ? 1 : 0, c.fx.some((f) => f.op === "dmg") ? 1 : 0); }
    if(a.k === "spell"){
        const c = a.c, v = c.v || 0, t = a.target, op = OP_CODE[c.op];
        if(op === undefined) return 0;
        const allEnemy = c.tg === "allEnemy" ? 1 : 0;
        let targetType = 0, targetSlot = -1;
        if(t && t.t === "base") targetType = 1;
        else if(t && t.t === "unit"){ targetType = 2; targetSlot = t.slot; }
        return M._card_ai_score_spell(op, allEnemy, targetType, targetSlot, v);
    }
    if(a.k === "attack"){ const t = a.target; return M._card_ai_score_attack(a.slot, t.t === "base" ? 1 : 0, t.t === "base" ? -1 : t.slot); }
    return 0;
}
export function scoreAction(G, pi, a){
    if(!failed && M){ syncCtx(G, pi); return scoreActionWASM(G, pi, a); }
    return scoreActionJS(G, pi, a);
}
// 1ターンぶんの行動（描画側は after で待つ）。必ず endTurn まで進む
export async function cpuTurn(G, pi, opt){
    await boot();
    const o = opt || {}; const lv = o.level === undefined ? 1 : o.level; let guard = 0, fails = 0;
    const useWasm = !failed && M;
    while(!G.over && G.turn === pi && guard++ < LIMITS.maxActionsPerTurn){
        const acts = G.legal(pi); if(!acts.length) break;
        if(useWasm) syncCtx(G, pi);
        let best = null, bs = -1e9;
        for(const a of acts){
            const base = useWasm ? scoreActionWASM(G, pi, a) : scoreActionJS(G, pi, a);
            const noise = useWasm ? M._card_ai_noise(lv) : (G.rnd() - .5) * 2 * NOISE[lv];
            const sc = base + noise;
            if(sc > bs){ bs = sc; best = a; }
        }
        if(!best || bs <= 0) break;
        const ok = await G.doAction(pi, best); if(!ok){ if(++fails > 4) break; continue; }
        if(o.after) await o.after(best);
    }
    if(!G.over && G.turn === pi) await G.endTurn();
}
// 「AREだ！」を使うか（CPU）
export function cpuAskARE(G, pl, ctx, lv){
    const u = ctx.attacker; if(!u) return false;
    if(!failed && M) return !!M._card_ai_ask_are(lv, pl.base.hp, u.atk);
    if(lv === 0) return G.rnd() < .5;
    return pl.base.hp <= Math.max(u.atk + 1, 8) || G.rnd() < .5;
}
