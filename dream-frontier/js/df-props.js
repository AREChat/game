// ===== 立て絵・建物の正面の絵（img/prop/<名前>.webp ・ img/bld/<名前>.webp）=====
// ・木・花・岩・水晶・街灯・雲・山などを「1まいの絵」で たてる ための 共通部品（人の絵 = df-sprites.js と おなじ かんがえ）。
// ・読みこめた 絵だけが「使える」。読めない ものは、世界を つくる ときに 今までの 箱・円すいの 形にもどる（なので 絵が なくても ゲームは 動く）。
export const PROP_FILES = [
    "prop/tree_round", "prop/tree_cone", "prop/tree_puff", "prop/tree_bloom", "prop/tree_slim", "prop/bush_round",
    "prop/tree_indigo", "prop/tree_teal", "prop/tree_glow", "prop/tree_fruit", "prop/mushroom_big", "prop/fern_glow",
    "prop/palm_tall", "prop/palm_curve", "prop/palm_short", "prop/rock_big", "prop/rock_small", "prop/reeds",
    "prop/flowerbed_pink", "prop/flowerbed_yellow", "prop/flowerbed_white", "prop/flowerbed_violet", "prop/grass_tuft_a", "prop/grass_tuft_b", "prop/flower_tall_a", "prop/flower_tall_b",
    "prop/crystal_blue", "prop/crystal_violet", "prop/crystal_mint", "prop/crystal_rose", "prop/crystal_tall", "prop/rock_pillar",
    "prop/lamp_plaza", "prop/lamp_lantern", "prop/bench", "prop/trashcan", "prop/signpost", "prop/board_station", "prop/balloons",
    "prop/cloud_a", "prop/cloud_b", "prop/cloud_c", "prop/cloud_d", "prop/cloud_e", "prop/cloud_f", "prop/mountain_a", "prop/mountain_b", "prop/mountain_c", "prop/mountain_d",
    "bld/shop_1", "bld/shop_2", "bld/shop_3", "bld/shop_4", "bld/shop_5", "bld/shop_6", "bld/info_front", "bld/gate_front", "bld/manor_front", "bld/fairy_front", "bld/dome_front", "prop/lamp_garden", "prop/cheese_gate", "prop/cheese_sign", "prop/cheese_jeep", "prop/cheese_stamp"
];
const cache = {};
export function loadProp(name){
    if(cache[name]) return cache[name];
    const rec = cache[name] = {img: new Image(), ok: false, bad: false};
    rec.img.onload = () => { rec.ok = rec.img.naturalWidth > 0; }; rec.img.onerror = () => { rec.bad = true; };
    rec.img.src = new URL("../img/" + name + ".webp", import.meta.url).href;
    return rec;
}
// 全部の 絵を よみこむ（時間切れ・失敗しても そのまま すすむ）
export function preloadProps(timeoutMs){
    const one = (n) => new Promise((res) => { const r = loadProp(n); if(r.img.complete){ res(); return; } r.img.addEventListener("load", () => res()); r.img.addEventListener("error", () => res()); });
    return Promise.race([Promise.all(PROP_FILES.map(one)), new Promise((res) => setTimeout(res, timeoutMs || 8000))]);
}
export const propReady = (name) => !!(cache[name] && cache[name].ok);
export const propImg = (name) => (cache[name] && cache[name].ok) ? cache[name].img : null;
export const propCount = () => Object.values(cache).filter((r) => r.ok).length;
export const propAspect = (name) => (cache[name] && cache[name].ok) ? cache[name].img.naturalHeight / cache[name].img.naturalWidth : 1;
