// ===== 人（NPC・ゲスト）を 1枚絵で ひょうじする ための 共通部品 =====
// 画像は img/chara/<名前>_f|r|l|b.webp（前・右むき・左むき・後ろ）。どちらの描画エンジンでも 同じ 選びかたを つかう。
// 読みこめない あいだ／失敗した ときは、呼ぶ側が 手作りの3Dモデルで 表示する（なので 画像が なくても ゲームは 動く）。
export const SPRITE_H = {rihito: 2.35, satoshi: 2.3, akane: 2.25, maika: 2.2, staff_jet: 2.3, staff_sweets: 2.3, staff_aurora: 2.4, giraffe: 6.4, elephant: 3.7, fluffy: 2.6, lion: 2.5, ghost: 2.4, starkid: 1.35, guest0: 1.9, guest1: 1.9, guest2: 2.4, guest3: 2.3, guest4: 1.9, guest5: 1.9, ch_boy: 2.0, ch_girl: 2.0, ch_boyS: 2.0, ch_girlS: 2.0, ch_cat: 1.9, ch_cat_soot: 1.9, ch_mouse: 1.35, ch_duck: 1.2, ch_bomb: 1.0, ch_wheel: 3.07, ch_paw: 1.6, ch_bal0: 1.3, ch_bal1: 1.3, ch_bal2: 1.3};
// 1まいだけの 絵（どの 向きから 見ても おなじ）：img/chara/<名前>_f.webp だけ あれば よい
export const ONE = new Set(["ch_duck", "ch_bomb", "ch_wheel", "ch_paw", "ch_bal0", "ch_bal1", "ch_bal2"]);
const cache = {};
export function spriteImage(name, view){
    if(ONE.has(name)) view = "f";
    const k = name + "_" + view; if(cache[k]) return cache[k];
    const rec = cache[k] = {img: new Image(), ok: false, bad: false};
    rec.img.onload = () => { rec.ok = true; }; rec.img.onerror = () => { rec.bad = true; };
    rec.img.src = new URL("../img/chara/" + k + ".webp", import.meta.url).href;
    return rec;
}
// 人の向き(yaw)と カメラ(eye)の 位置から、見える 面（f 前 / r 右むき / l 左むき / b 後ろ）を えらぶ
export function pickView(eye, x, z, yaw){
    const cx = eye[0] - x, cz = eye[2] - z, face = Math.atan2(cx, cz), len = Math.hypot(cx, cz) || 1;
    const fx = Math.sin(yaw || 0), fz = Math.cos(yaw || 0);
    const a = Math.atan2(fx * Math.cos(face) - fz * Math.sin(face), (fx * cx + fz * cz) / len);
    return {view: Math.abs(a) < Math.PI / 4 ? "f" : Math.abs(a) > Math.PI * 3 / 4 ? "b" : a > 0 ? "r" : "l", face};
}
// その人が 今 画像で 描けるか（4面 そろって 読みこみ ずみ）
export function spriteReady(name){ let ok = true; for(const v of "frlb"){ if(!spriteImage(name, v).ok) ok = false; } return ok; }   // 4方向の 絵を いっぺんに よみはじめる（1まいずつ 待たない）
