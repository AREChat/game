// ===== ライド中の「声」と「字幕」の 共通の しくみ（2026-11-27）=====
//  voice/<ファイル名>.mp3 を 鳴らして、画面の したに 字幕（だれが なにを いったか）を 出す。
//  コスモ・クルーズ・全アトラクションの アナウンスで つかう。声は すべて この ゲームの オリジナル（音声合成）。
import {Snd} from "./audio.js";
const BASE = new URL("../voice/", import.meta.url).href;
export const WHO = {gaku: "ガク", mimi: "ミミ", gf: "ガイドの おねえさん", gm: "ガイドの おにいさん", cat: "モフゾー", mouse: "チュッピ", cmd: "キャプテン・ポッド", bot: "ロボクルー", pilot: "パイロット", nav: "ナビ"};
export const WCOL = {gaku: "#6ab8ff", mimi: "#ff8ac0", gf: "#ffe27a", gm: "#9affc0", cat: "#ffb060", mouse: "#d8c0ff", cmd: "#ffd24a", bot: "#7affd8", pilot: "#9ad8ff", nav: "#ffffff"};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 1つの せりふを 鳴らす。R.cap に 字幕を ためる（かくモジュールが 画面に 出す）。ファイルが なくても 字幕だけは 出る
export function speak(g, R, file, who, text, dur){
    R.cap = {who, text, until: g.t + (dur || 3) + .8, from: g.t};
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
        capEl.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:19%;width:min(92vw,720px);text-align:center;font-weight:800;font-size:clamp(15px,3.4vw,24px);line-height:1.4;color:#fff;text-shadow:0 2px 4px #000;pointer-events:none;z-index:6;font-family:inherit";
        document.body.appendChild(capEl);
    }
    const c = R && R.cap, on = c && g.t < c.until;
    const html = on ? "<span style='display:inline-block;padding:6px 14px;border-radius:14px;background:rgba(20,14,40,.72);border:2px solid " + (WCOL[c.who] || "#fff") + "'><b style='color:" + (WCOL[c.who] || "#fff") + "'>" + (WHO[c.who] || "") + "</b>　" + c.text + "</span>" : "";
    if(capEl._h !== html){ capEl._h = html; capEl.innerHTML = html; }
}
export function capHide(){ if(capEl && capEl.parentNode) capEl.parentNode.removeChild(capEl); capEl = null; }
