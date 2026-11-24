// ===== スターライト・リズムステージの きょく（オリジナル）と 譜面の もと =====
//  df-score.js（演奏）と df-x-rhythm.js（ノーツ）の 両方が これを 見る → 音と ノーツが ずれない
export const SONG = {bpm: 128, bars: 34, steps: 8};   // 1小節 = 8分音符 8こ
const A1 = [[72, 0, 74, 0, 76, 0, 74, 72], [71, 0, 74, 0, 79, 0, 77, 76], [72, 0, 69, 0, 72, 0, 76, 0], [74, 0, 77, 0, 76, 74, 72, 0]];
const A2 = [[72, 0, 74, 0, 76, 79, 76, 74], [71, 0, 74, 0, 79, 0, 81, 79], [77, 0, 76, 0, 72, 0, 69, 0], [74, 72, 74, 76, 77, 0, 76, 0]];
const B1 = [[79, 79, 81, 0, 79, 76, 79, 0], [79, 79, 83, 0, 81, 79, 76, 0], [76, 76, 81, 0, 81, 79, 76, 72], [77, 77, 81, 0, 79, 77, 74, 0]];
const B2 = [[79, 0, 84, 83, 81, 79, 76, 79], [83, 81, 79, 0, 74, 0, 79, 0], [81, 0, 84, 0, 81, 0, 79, 76], [77, 79, 81, 0, 84, 0, 0, 0]];
const BR = [[72, 0, 0, 0, 76, 0, 0, 0], [74, 0, 0, 0, 79, 0, 0, 0], [77, 0, 0, 0, 81, 0, 0, 0], [79, 0, 0, 0, 84, 0, 0, 0]];
const OUT = [[84, 0, 0, 0, 0, 0, 0, 0], [72, 0, 76, 0, 79, 0, 84, 0]];
// 小節ごとの メロディ（8こ。0 は 休み）。ないときは null
export function melodyAt(bar){
    if(bar < 4) return null;
    if(bar < 8) return A1[bar - 4];
    if(bar < 12) return A2[bar - 8];
    if(bar < 16) return B1[bar - 12];
    if(bar < 20) return B2[bar - 16];
    if(bar < 24) return BR[bar - 20];
    if(bar < 28) return B1[bar - 24].map((m, i) => m && (i % 2 === 0 ? m : m));
    if(bar < 32) return B2[bar - 28];
    if(bar < 34) return OUT[bar - 32];
    return null;
}
export const rootAt = (bar) => (bar >= 20 && bar < 24 ? [41, 43, 40, 45] : [48, 43, 45, 41])[bar % 4];
export const stepDur = () => 60 / SONG.bpm / 2;
export const songLen = () => SONG.bars * SONG.steps * stepDur();
// 譜面：{t: 秒（きょくの あたまから）, lane: 0〜3}。低い音は 左（D）、高い音は 右（K）
export function chart(){
    const out = []; let prev = -1;
    for(let b = 0; b < SONG.bars; b++){
        const mel = melodyAt(b); if(!mel) continue;
        mel.forEach((m, s) => {
            if(!m) return;
            let lane = Math.max(0, Math.min(3, Math.floor((m - 69) / 4.6)));
            if(lane === prev && s % 2 === 1 && lane < 3) lane = lane + 1;   // 同じ レーンの れんだを すこし へらす
            prev = lane; out.push({t: (b * SONG.steps + s) * stepDur(), lane});
        });
    }
    return out;
}
