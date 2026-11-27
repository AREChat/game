// ===== ライド中の「声」と「字幕」の 共通の しくみ（2026-11-27）=====
//  voice/<ファイル名>.mp3 を 鳴らして、画面の したに 字幕（だれが なにを いったか）を 出す。
//  コスモ・クルーズ・全アトラクションの アナウンスで つかう。声は すべて この ゲームの オリジナル（音声合成）。
import {Snd} from "./audio.js";
const BASE = new URL("../voice/", import.meta.url).href;
export const WHO = {gaku: "ガク", mimi: "ミミ", gf: "ガイドの おねえさん", gm: "ガイドの おにいさん", cat: "モフゾー", mouse: "チュッピ", cmd: "キャプテン・ポッド", bot: "ロボクルー", pilot: "パイロット", nav: "ナビ"};
export const WCOL = {gaku: "#6ab8ff", mimi: "#ff8ac0", gf: "#ffe27a", gm: "#9affc0", cat: "#ffb060", mouse: "#d8c0ff", cmd: "#ffd24a", bot: "#7affd8", pilot: "#9ad8ff", nav: "#ffffff"};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 1つの せりふを 鳴らす。R.cap に 字幕を ためる（かくモジュールが 画面に 出す）。ファイルが なくても 字幕だけは 出る
export function speak(g, R, file, who, text, dur, nocap){
    if(!nocap) R.cap = {who, text, until: g.t + (dur || 3) + .8, from: g.t};
    if(!Snd.isOn()) return;
    try{
        const a = new Audio(BASE + file + ".mp3"); a.volume = clamp(.5 + Snd.getSeVol() * .6, 0, 1); a.play().catch(() => {});
        R.voices = R.voices || []; R.voices.push(a); if(R.voices.length > 6) R.voices.shift();
    }catch(_e){}
}
export function stopVoices(R){ for(const a of R.voices || []){ try{ a.pause(); }catch(_e){} } R.voices = []; }

// 字幕を 出す 画面の 部品（ride 中 1つだけ）
let capEl = null;
export function capShow(R, g){
    if(!capEl){
        capEl = document.createElement("div"); capEl.id = "dfCap";
        capEl.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:23%;width:min(92vw,720px);text-align:center;font-weight:800;font-size:clamp(15px,3.4vw,24px);line-height:1.4;color:#fff;text-shadow:0 2px 4px #000;pointer-events:none;z-index:6;font-family:inherit";
        document.body.appendChild(capEl);
    }
    const c = R && R.cap, on = c && g.t < c.until;
    const html = on ? "<span style='display:inline-block;padding:6px 14px;border-radius:14px;background:rgba(20,14,40,.72);border:2px solid " + (WCOL[c.who] || "#fff") + "'><b style='color:" + (WCOL[c.who] || "#fff") + "'>" + (WHO[c.who] || "") + "</b>　" + c.text + "</span>" : "";
    if(capEl._h !== html){ capEl._h = html; capEl.innerHTML = html; }
}
export function capHide(){ if(capEl && capEl.parentNode) capEl.parentNode.removeChild(capEl); capEl = null; fxClear(); }

// ---- 画面の こうか：ぱっと ひかる／おおきな もじ（どのアトラクションでも つかえる）----
let flashEl = null, boomEl = null, boomT = 0;
const mkEl = (css) => { const e = document.createElement("div"); e.style.cssText = css; document.body.appendChild(e); return e; };
export function fxFlash(a, color){
    if(!flashEl) flashEl = mkEl("position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;background:#fff");
    flashEl.style.background = color || "#f2f8ff"; flashEl.style.transition = "none"; flashEl.style.opacity = String(a == null ? .7 : a);
    requestAnimationFrame(() => { if(flashEl){ flashEl.style.transition = "opacity .8s ease-out"; flashEl.style.opacity = "0"; } });
}
export function fxBoom(text, secs){
    if(!boomEl) boomEl = mkEl("position:fixed;left:50%;top:34%;transform:translate(-50%,-50%) scale(.5);opacity:0;pointer-events:none;z-index:6;font-weight:900;font-size:clamp(30px,9vw,80px);color:#fff;white-space:nowrap;text-shadow:0 0 18px #46c8ff,0 5px 0 #2a5ad8,0 0 40px #ffd23a;font-family:inherit");
    boomEl.textContent = text; boomEl.style.transition = "none"; boomEl.style.opacity = "1"; boomEl.style.transform = "translate(-50%,-50%) scale(.4)"; const my = ++boomT;
    setTimeout(() => { if(boomEl && my === boomT){ boomEl.style.transition = "transform .3s cubic-bezier(.2,1.6,.4,1)"; boomEl.style.transform = "translate(-50%,-50%) scale(1.1)"; } }, 40);
    setTimeout(() => { if(boomEl && my === boomT){ boomEl.style.transition = "opacity .5s"; boomEl.style.opacity = "0"; } }, (secs || 1.1) * 1000);
}
export function fxClear(){ for(const e of [flashEl, boomEl]) if(e && e.parentNode) e.parentNode.removeChild(e); flashEl = boomEl = null; }
