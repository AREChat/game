// ===== 全アトラクションの アナウンス（声・字幕・こうか）2026-11-27 =====
//  どの のりものでも、はじまり・みどころ・おわりに ガイドさんの 声と 字幕、こうかおん・ぱっと ひかる・おおきな もじ が はいる。
//  せりふの 表は df-announce-lines.js（tools/ann_data.py から 自動生成）。コスモ・チーズいせきは 自前の 声なので ここでは なにもしない。
//  声は すべて この ゲームの オリジナル（音声合成）。
import {speak, stopVoices, capShow, capHide, fxFlash, fxBoom, fxClear, WHO} from "./df-voice.js";
import {ANN_LINES, ANN_END} from "./df-announce-lines.js";
import {rideTotal} from "./df-ride.js";
import {Snd} from "./audio.js";

const OWN = {cosmo: 1, cheese: 1, queue: 1};
const BASE = new URL("../voice/", import.meta.url).href;
const SFX = new Set(["bell", "door", "clack", "belt", "whoosh", "sparkle", "rumble", "warp", "alarm", "boing", "pop", "cheer", "crash", "smash", "boo", "drop", "splash", "gold", "coin", "start", "fan", "hit", "shot"]);

function progress(g, R, a){
    try{
        if(a.kind === "coaster" && R.before !== undefined) return clamp01((R.before + (R.ct || 0)) / Math.max(1, rideTotal(a)));
        if(a.kind === "drop") return clamp01(R.t / 16.2);
        if(typeof R.frac === "number") return clamp01(R.frac);
        if(a.dur) return clamp01(R.t / a.dur);
    }catch(_e){}
    return 0;
}
const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;

function fire(g, R, a, L){
    const nc = L.nc;
    speak(g, R, L.id, L.who, L.tx, L.d, nc);
    for(const tok of (L.fx || "").split("+")){
        if(!tok) continue;
        if(tok === "flash") fxFlash(.55, a.kind === "track" && a.env === "ghost" ? "#cfe4ff" : "#f2f8ff");
        else if(tok.indexOf("boom:") === 0) fxBoom(tok.slice(5), 1.2);
        else if(SFX.has(tok)) g.sfx(tok);
    }
}

// 毎フレーム（updateRide の さいしょ）
export function annTick(g, R, a){
    if(OWN[a.id]) return;
    const lines = ANN_LINES[a.id]; if(!lines) return;
    const st = R.ann || (R.ann = {done: {}});
    const fr = progress(g, R, a);
    for(let i = 0; i < lines.length; i++){
        const L = lines[i]; if(st.done[i]) continue; const w = L.w; let go = false;
        if(typeof w === "number") go = fr >= w;
        else if(w === "peak"){ const p = g.paths && g.paths[a.id]; go = !!p && R.s >= (p.peak || 1e9) - 3; }
        else if(typeof w === "string" && w[0] === "t") go = R.t >= parseFloat(w.slice(1));
        if(go){ st.done[i] = 1; fire(g, R, a, L); break; }   // 1フレームに 1つだけ（かさなりを さける）
    }
    if(R.cap) capShow(R, g);
}

// のりものを おりる ときに（endRide から）：声を とめて、おわりの ひとこと
export function annEnd(g, R, a, ok){
    if(!R || OWN[a.id]) return;
    stopVoices(R); capHide();
    if(!ok || !ANN_LINES[a.id] || !Snd.isOn()) return;
    const keys = Object.keys(ANN_END), k = keys[Math.floor(Math.random() * keys.length)], L = ANN_END[k];
    try{ const au = new Audio(BASE + "ann_" + k + ".mp3"); au.volume = Math.max(0, Math.min(1, .5 + Snd.getSeVol() * .6)); au.play().catch(() => {}); }catch(_e){}
    try{ g.ui.toast((WHO[L.who] || "") + "：" + L.tx, 2600); }catch(_e){}
}
