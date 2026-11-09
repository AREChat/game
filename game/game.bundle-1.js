"use strict";
/* 自動生成: node tools/build-game.js （直接編集しない）  束 1 / 4 */

/* ==== game/hash.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[0]=1;
"use strict";
// ===== ちいさな SHA-256（チートコードを「暗号のまま」保存するための道具）=====
// ゲームの中には、コードそのものは入っていません。ここで計算した「指紋（ハッシュ）」だけを比べます。
// ※ ほんとうに安全な暗号ではなく、「ソースを読んでも答えがすぐには出ない」ための仕組みです。
function tqSha256(msg){
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bytes = [];
    const s = unescape(encodeURIComponent(String(msg)));
    for(let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while(bytes.length % 64 !== 56) bytes.push(0);
    for(let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const w = new Array(64);
    for(let off = 0; off < bytes.length; off += 64){
        for(let i = 0; i < 16; i++) w[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
        for(let i = 16; i < 64; i++){
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for(let i = 0; i < 64; i++){
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) | 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
// 塩(salt)つきで何度も計算する（ちょっとだけ総当たりをしにくくする）
function tqStretch(text){
    const salt = "tq|are|2026|";
    let h = tqSha256(salt + text);
    for(let i = 0; i < 600; i++) h = tqSha256(h + salt);
    return h;
}
if(typeof module !== "undefined") module.exports = {tqSha256, tqStretch};


/* ==== game/cheat-table.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[1]=1;
"use strict";
// チートコードの「指紋」だけが入っています（コード本体は入っていません）。
// 照合：入力→小文字にして空白を消す→数字の連なりを # に置きかえた形も照合。
const TQ_CHEATS = [["74d9a46233c9ffd198f8fae5ea28a517360a2cb6880f2aefff4b8d66b10e6a2a","lvmax"],["c45e3187aa0fc0f45266b825200473af8689380f7be1577cab5534a0c5c51b7a","st999"],["66660c15c4f06d6253b0264f888772a892e043ee2bdb7eccd055c3e730b673bb","goldmax"],["d7009fc790bc01b28063affaab3b916cb6e0920f35c1dded5518133fe38b8bf6","party5"],["a1c933a09f65685bc8d9f4ff29df1947bff61f6f3b3539d95fb6dd8db5310f4e","party6"],["fd180cf48abe49000ead6003b09787dc34257ffac5d2caf4d038eb44659ef949","lvset"],["60224d2e7ce6a4d14dfb66f4d79bc6220602d8716aba9046abee708813cf1df9","goldadd"],["f9a2b9784d7b337402c2ff7724429eeab0d26bc5fad4839933b8499555653a5c","fullheal"],["dda873b20c39985054302c16d9bb510d8d26332c448b7e104cb7c172d2284a43","revive"],["fb3d057aa8773fd95fc3f24574359ba9827e88e2b8e4f1ec788fcf21486f8ad1","items99"],["47434c431a182c28b382a30c6bd236aef726c2f1c6e067837274c9a08fa81b50","bestgear"],["3143de1d936a0ed5a7537725df0b4010693eb622214a0ab3b0f14968a36c1d04","expx10"],["cc82d72e1c520d78e198c4501f38c773452a2a0a156c653cb8eda1a0f818ab17","expx100"],["f0ce7dfa2315252357cfa889f9547c3898f45c49e96e1093cab5d8ba3e3765f3","expx1"],["c4c93b76e920e67a3c9493754687a52fa4c074563ba705490a4a9183af397b3c","god"],["5aeee33941b5db76cade419a110fa88ff79cb19eb5db7be3281af7d811b49446","onehit"],["bcbb0650bae5a48155c2ff32b139add40368453acd431c494224fa10b20d3347","infmp"],["f2fbdafef162e5226e7a0a87a48f7f65aa5fd78206b31020864431b6e0ec0996","areall"],["085800d6d72067c0e23c9f2c236f078314e281ec4e23cb5332bc838d90f9709d","arefull"],["632f2770aae336f91434c538c1c119d779a8444ed9d5dc4dfcf6a785b04afc2c","noenc"],["44c31f6245734e9fc602a71ca86a639518730e912af4e829502a3041d35326b9","encx3"],["42b5a000918769c9199e1ec63130916d77f97eddac18d6e7d566619f59f54122","speed"],["d1a087ca7312fe7a9ac11387f740c798684baa7aef8e473dfbeb14ce81a9dbc1","allgate"],["ed4e2e14c25684e064d1933cbdeb4e93e34fe52f7d6b6459908f51cc68b6111e","memall"],["4fec33f1a9b5c6fd198802c451514131a377b8428154279ff9140bbfbf59cb69","bossally"],["3f440104a4a8cdc9fec17400dbcb55beca9f72ea44de722caeb4ed4fc2bd1730","miraboss"],["1b98d6a7f559ea2ef2b35b4ccf1b6637ac73cade1eb11d065da481c6784db858","miraally"],["ad981ff89ae9aece1f2f7929a111230e2da48e7cbf33aa71b0aa02a3532153d0","clear"],["76069adec1ee029ff1ec30a01e99fbed72046057ce7dd5d35e39e55e631cdd5f","bonus"],["a6c68549e3d612d3fd2bbd637aa49c8558291766424d67e33808a965feab7f83","rainbow"],["4c3bb355355c47f1c4ba4131870fdbc98da7090b74b42e7b7abcd208c87577d1","showpos"],["54dae259c603b574dc3ee11846e7feb72d8fafcd351a3569caadfeaac1d45c80","voice"],["9800f61420dab0c85ec8f353a25f495d11e1ee703576b54152dca367dc5663d0","cheat"],["ff1a1e44ff6da069d5811c44a780e27cfbe731f54cfafa0fdb712725027e94e6","off"]];


/* ==== game/data.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[2]=1;
"use strict";
// ===== RPG「ARE 〜そういうときは、AREだ！〜」のデータ：地図・見た目・敵・どうぐ =====
// 物語の元：「そういうときは、AREだ！」「人生2周目」「リプレイワールド」「未来予知VS迷惑ボーイ」など。
// かわいいモンスターだけ（虫・気持ち悪い見た目は出しません）。

/** 文字の地図を作る（四角形を塗る／1マス置く／ふち取り）。横幅がずれないように、コードで組み立てる */
function rpgMk(w, h, fill, ops){
    const g = Array.from({length:h}, () => Array(w).fill(fill));
    ops.forEach((o) => {
        if(o[0] === "r"){ for(let y = o[2]; y < o[2] + o[4]; y++) for(let x = o[1]; x < o[1] + o[3]; x++) if(g[y] && g[y][x] !== undefined) g[y][x] = o[5]; }
        else if(o[0] === "p"){ if(g[o[2]] && g[o[2]][o[1]] !== undefined) g[o[2]][o[1]] = o[3]; }
        else if(o[0] === "b"){ for(let x = 0; x < w; x++){ g[0][x] = o[1]; g[h - 1][x] = o[1]; } for(let y = 0; y < h; y++){ g[y][0] = o[1]; g[y][w - 1] = o[1]; } }
    });
    return g.map((r) => r.join(""));
}

// ---- マスの種類：c=色, w=歩ける, e=絵文字, d=もよう ----
const RPG_TILES = {
    ".":{c:"#6cc070", w:1, d:"tuft"}, ",":{c:"#dcc08a", w:1, d:"path"}, "~":{c:"#4a90e2", w:0, d:"wave"},
    "T":{c:"#6cc070", w:0, e:"🌳"}, "#":{c:"#5b6475", w:0, d:"brick"}, "=":{c:"#d2a96b", w:1, d:"plank"},
    "c":{c:"#c0475a", w:1, d:"carpet"}, "W":{c:"#7cc7f0", w:0, d:"window"}, "S":{c:"#f2f7ff", w:1, d:"snow"},
    "s":{c:"#d3deea", w:1, d:"path"}, "t":{c:"#f2f7ff", w:0, e:"🎄"}, "w":{c:"#fafafa", w:1, d:"grid"},
    "G":{c:"#23408f", w:1, d:"gate"}, "P":{c:"#d2a96b", w:0, e:"🖥️"}, "L":{c:"#d2a96b", w:0, e:"📚"},
    "K":{c:"#9a6b3c", w:0, e:"🛒"}, "p":{c:"#d2a96b", w:0, e:"🪴"}, "D":{c:"#9a6b3c", w:1, e:"🚪"},
    "b":{c:"#d2a96b", w:0, e:"🪑"}, "f":{c:"#6cc070", w:1, e:"🌸"}, "N":{c:"#243044", w:0, d:"bldg"},
    "H":{c:"#c2571a", w:0, d:"roof"}, "h":{c:"#fde9a8", w:0, d:"wall"}, "M":{c:"#aeb6c4", w:1, d:"stone"},
    "E":{c:"#8a93a3", w:1, e:"🪜"}, "n":{c:"#33415c", w:1, d:"nroad"}, "m":{c:"#2b3a55", w:0, e:"🌃"},
    "q":{c:"#e9eef7", w:1, d:"tech"}, "Q":{c:"#cfe0ff", w:0, d:"glass"}, "z":{c:"#1b2640", w:0, d:"server"},
    "r":{c:"#d2a96b", w:0, e:"🧸"}, "k":{c:"#e5d6b8", w:0, e:"🎂"}, "i":{c:"#9bd0ff", w:1, d:"ice"},
    "X":{c:"#fafafa", w:1, d:"grid"}
};

// ---- 見た目（ドット絵ふうに、キャンバスで描く）----
// skin:はだ hair:かみ style:short|long|bob|twin|cap|spike|bun top:上着 bot:下 acc:glasses|xr|santa|tie|scarf|none
const RPG_LOOKS = {
    heroM:{skin:"#f6d2b0", hair:"#2d2118", style:"short", top:"#2f6fdc", bot:"#374151", acc:"tie"},
    heroF:{skin:"#f9d9bd", hair:"#6b3a1e", style:"long", top:"#e8506b", bot:"#4b5563", acc:"none"},
    akito:{skin:"#f6d2b0", hair:"#e07a1f", style:"spike", top:"#ff8a00", bot:"#2b3a67", acc:"none"},
    haruki:{skin:"#f3cfae", hair:"#1f2a44", style:"short", top:"#3a4a6b", bot:"#222a3a", acc:"glasses"},
    mina:{skin:"#f9d9bd", hair:"#8a5a2b", style:"bun", top:"#4caf7a", bot:"#2e6b4a", acc:"none"},
    kaito:{skin:"#f6d2b0", hair:"#3b2a20", style:"short", top:"#7aa7e8", bot:"#3a4a6b", acc:"xr"},
    arisa:{skin:"#f9d9bd", hair:"#2a1a14", style:"twin", top:"#f4a6c0", bot:"#7a4a6b", acc:"none"},
    reiya:{skin:"#f3cfae", hair:"#7a1fd1", style:"spike", top:"#14b8a6", bot:"#1f2937", acc:"xr"},
    ekiin:{skin:"#f3cfae", hair:"#222", style:"cap", top:"#24407a", bot:"#24407a", acc:"none"},
    oyaji:{skin:"#f0c9a2", hair:"#ddd", style:"cap", top:"#fff", bot:"#555", acc:"none"},
    obaa:{skin:"#f0c9a2", hair:"#cfcfcf", style:"bun", top:"#7bc67e", bot:"#4b6b4b", acc:"none"},
    tourist:{skin:"#f6d2b0", hair:"#5a3a1c", style:"cap", top:"#f2c94c", bot:"#4a5568", acc:"none"},
    kid:{skin:"#f9d9bd", hair:"#3a2a1a", style:"short", top:"#ef6c3b", bot:"#35507a", acc:"none"},
    aota:{skin:"#f3cfae", hair:"#222a35", style:"short", top:"#556070", bot:"#2a3140", acc:"none"},
    saeko:{skin:"#f9d9bd", hair:"#111", style:"long", top:"#1b1b27", bot:"#1b1b27", acc:"none"},
    kento:{skin:"#f6d2b0", hair:"#3b2a20", style:"short", top:"#5b8def", bot:"#3a4a6b", acc:"glasses"},
    misaki:{skin:"#f9d9bd", hair:"#111", style:"long", top:"#c0c8d8", bot:"#4a5568", acc:"none"},
    tatsuya:{skin:"#eebf98", hair:"#222", style:"spike", top:"#2b2b2b", bot:"#222", acc:"none"},
    ryu:{skin:"#f0c9a2", hair:"#eee", style:"bald", top:"#6b4a2b", bot:"#3a2a1a", acc:"none"},
    hiro:{skin:"#f6d2b0", hair:"#1a1a1a", style:"short", top:"#7a5a3a", bot:"#2b2b2b", acc:"scarf"},
    santa:{skin:"#f3cfae", hair:"#222a35", style:"short", top:"#d62828", bot:"#d62828", acc:"santa"},
    haruya:{skin:"#f6d2b0", hair:"#3b2a20", style:"short", top:"#b0b7c3", bot:"#8a93a3", acc:"none"},
    momone:{skin:"#f9d9bd", hair:"#5a3a1c", style:"bob", top:"#c0c7d4", bot:"#8a93a3", acc:"none"},
    robo:{skin:"#dfe6ee", hair:"#7b8794", style:"cap", top:"#4a6fa5", bot:"#4a6fa5", acc:"glasses"},
    youngA:{skin:"#f6d2b0", hair:"#e07a1f", style:"spike", top:"#fff3d6", bot:"#4a5568", acc:"none"},
    youngH:{skin:"#f3cfae", hair:"#1f2a44", style:"short", top:"#dfe6f0", bot:"#2a3140", acc:"glasses"},
    kouhai:{skin:"#f9d9bd", hair:"#d4a373", style:"bob", top:"#8ecae6", bot:"#4a5568", acc:"none"},
    citizen:{skin:"#f6d2b0", hair:"#444", style:"short", top:"#90caf9", bot:"#37474f", acc:"none"},
    citizenF:{skin:"#f9d9bd", hair:"#a0522d", style:"bob", top:"#ce93d8", bot:"#455a64", acc:"none"},
    teddy:{skin:"#d9a066", hair:"#d9a066", style:"cap", top:"#c68642", bot:"#c68642", acc:"none"}
};
// 声の高さ・速さ（ブラウザの読み上げ。許可されていれば流れます）
const RPG_VOICES = {
    "me:m":[0.8, 1.05], "me:f":[1.3, 1.08], "アキト":[0.95, 1.12], "ハルキ":[0.75, 1.0], "ミナ":[1.35, 1.1], "海斗":[1.0, 1.1], "亜理紗":[1.4, 1.08],
    "玲也":[1.1, 1.2], "蒼太":[0.85, 0.98], "さえこ":[1.2, 0.98], "健斗":[0.95, 1.1], "美咲":[1.3, 1.02], "竜也":[0.6, 0.95], "龍之介":[0.55, 0.9],
    "紘":[0.9, 1.05], "サンタ":[0.8, 1.0], "はるや":[0.95, 1.1], "ももね":[1.45, 1.1], "アナウンくん":[1.6, 1.1], "ノイズ":[1.7, 1.15],
    "若いアキト":[1.05, 1.15], "若いハルキ":[0.85, 1.0], "ぬいぐるみ王":[0.5, 0.85], "ノイズの王":[0.7, 0.8], "":[1, 1]
};

// ---- どうぐ・そうび ----
const RPG_ITEMS = {
    onigiri:{n:"おにぎり", d:"HPを50かいふく", hp:50, price:12},
    special:{n:"スペシャルおにぎり", d:"HPを160かいふく", hp:160, price:50},
    coffee:{n:"ブラックコーヒー", d:"MPを20かいふく", mp:20, price:35},
    energy:{n:"エナジードリンク", d:"MPを60かいふく", mp:60, price:90},
    omamori:{n:"ふっかつのおまもり", d:"たおれた なかまを HP半分で ふっかつ", revive:true, price:120}
};
const RPG_EQUIP = {
    w0:{slot:"w", n:"ふつうのキーボード", v:0, price:0}, w1:{slot:"w", n:"メカニカルキーボード", v:5, price:120}, w2:{slot:"w", n:"ゲーミングキーボード", v:11, price:420}, w3:{slot:"w", n:"ミスリルキーボード", v:19, price:1200}, w4:{slot:"w", n:"ARE かいはつキット", v:30, price:3000},
    a0:{slot:"a", n:"Tシャツ", v:0, price:0}, a1:{slot:"a", n:"パーカー", v:4, price:100}, a2:{slot:"a", n:"しゃいんジャケット", v:9, price:350}, a3:{slot:"a", n:"ノイキャンヘッドホンアーマー", v:16, price:1000}, a4:{slot:"a", n:"ぬくぬくフリース", v:26, price:2800},
    c0:{slot:"c", n:"なし", v:0, price:0}, c1:{slot:"c", n:"ごえんのお守り", v:3, price:90}, c2:{slot:"c", n:"ほしのストラップ", v:7, price:380}, c3:{slot:"c", n:"きずなのリング", v:13, price:1100}
};
// お店の品ぞろえ：メモリを何個もっているかで増える
function rpgShopStock(mems){
    const l = ["onigiri", "coffee", "omamori"];
    if(mems >= 1) l.push("special", "w1", "a1", "c1");
    if(mems >= 2) l.push("energy", "w2", "a2");
    if(mems >= 3) l.push("c2");
    if(mems >= 4) l.push("w3", "a3");
    if(mems >= 5) l.push("c3", "w4", "a4");
    return l;
}

// ---- 敵（かわいいモンスターたち）----
// hp,atk,def,exp,g, acts:[[わざ名,ひっさつ(0=ふつう,1=ぜんたい), 出やすさ, ばいりつ]]
function rpgE(n, e, hp, atk, def, exp, g, acts, extra){ return Object.assign({n, e, hp, atk, def, exp, g, acts:acts || []}, extra || {}); }
const RPG_FOES = {
    zunda:rpgE("ずんだガエル", "🐸", 26, 9, 2, 8, 9, [["ぷるぷる ジャンプ", 0, 1, 1.2], ["ずんだをとばす", 0, 1, 1.0]]),
    sasa:rpgE("ささかまフィッシュ", "🐟", 30, 11, 3, 10, 11, [["ぴちぴち ビンタ", 0, 1, 1.2], ["あわを ふく", 1, 0.5, 0.6]]),
    kokeshi:rpgE("こけしちゃん", "🪆", 36, 13, 4, 13, 14, [["ころころ タックル", 0, 1, 1.2], ["くるくる まわる", 1, 0.5, 0.6]]),
    gyutan:rpgE("ギュータン・ノイズ", "🐮", 190, 21, 6, 90, 150, [["もーもー タックル", 0, 1, 1.3], ["ノイズの さけび", 1, 0.7, 0.7], ["タンシチューの いかり", 0, 0.6, 1.8]], {boss:true, bg:"sendai", say50:"ギュータン・ノイズ「もー…！ メモリは わたさないもー！」"}),
    spam:rpgE("スパムにゃん", "🐱", 52, 17, 6, 22, 22, [["ねこパンチ", 0, 1, 1.2], ["ひっかく", 0, 1, 1.0], ["メールを いっぱい おくる", 1, 0.5, 0.6]]),
    lag:rpgE("ラグハム", "🐹", 58, 18, 7, 25, 24, [["ほっぺ たいあたり", 0, 1, 1.2], ["ひまわりの たね なげ", 0, 1, 1.0]]),
    nullpo:rpgE("ヌルホー", "🦉", 64, 20, 8, 28, 27, [["ふわっと たいあたり", 0, 1, 1.2], ["ホーホー ボイス", 1, 0.6, 0.6]]),
    panda:rpgE("コピペ・パンダ", "🐼", 330, 28, 10, 160, 260, [["ごろごろ プレス", 0, 1, 1.3], ["コピペ アタック", 0, 1, 1.5], ["パンダの ほえる", 1, 0.7, 0.7]], {boss:true, bg:"tokyo", say50:"コピペ・パンダ「ぜんぶ コピーして ふやすぞ…！」"}),
    fuwa:rpgE("ふわふわクラウド", "☁️", 76, 23, 9, 34, 30, [["ふわふわ ぶつかり", 0, 1, 1.2], ["もくもく", 1, 0.5, 0.6]]),
    mashiro:rpgE("ましろメェ", "🐑", 84, 25, 10, 38, 34, [["もこもこ ずつき", 0, 1, 1.2], ["ひつじのなみだ", 0, 0.5, 0.9]]),
    anaun:rpgE("アナウンくん・ノイズ", "🤖", 430, 34, 12, 220, 360, [["ピーガー ビーム", 0, 1, 1.3], ["おおごえ アナウンス", 1, 0.8, 0.7], ["ルールを かきかえる", 0, 0.6, 1.6]], {boss:true, bg:"white", say50:"アナウンくん・ノイズ「ルール変更！ みんな ぬいぐるみ の 刑〜！」"}),
    penguin:rpgE("ぽんぽんペンギン", "🐧", 98, 29, 12, 45, 40, [["ぺたぺた ビンタ", 0, 1, 1.2], ["こおりの つぶて", 0, 0.6, 1.2]]),
    snowman:rpgE("ゆきだるまん", "⛄", 108, 31, 14, 50, 44, [["ゆきだま なげ", 0, 1, 1.2], ["ふぶき", 1, 0.5, 0.6]]),
    rabbit:rpgE("ゆきうさぎ", "🐰", 92, 32, 11, 48, 42, [["ぴょんぴょん キック", 0, 1, 1.2], ["にんじんミサイル", 0, 0.6, 1.1]]),
    reindeer:rpgE("トナカイ・ノイズ", "🦌", 560, 41, 15, 300, 480, [["つの ずつき", 0, 1, 1.3], ["ベルの ひびき", 1, 0.8, 0.7], ["プレゼント ばくだん", 0, 0.6, 1.7]], {boss:true, bg:"xmas", say50:"トナカイ・ノイズ「メリークリスマスは おわらせない！」"}),
    octo:rpgE("タコッチ・ループ", "🐙", 124, 36, 15, 58, 50, [["くるくる ループ", 0, 1, 1.2], ["すみを ふく", 1, 0.5, 0.6]]),
    hedgehog:rpgE("ハリセン・キャッシュ", "🦔", 132, 38, 17, 62, 54, [["ころころ アタック", 0, 1, 1.2], ["とげとげ ガード", 0, 0.5, 0.8]]),
    turtle:rpgE("ファイアウォールかめ", "🐢", 148, 35, 22, 66, 58, [["こうら ぶつけ", 0, 1, 1.2], ["ひっこむ", 0, 0.5, 0.2]]),
    whale:rpgE("デッドロック・くじら", "🐳", 760, 48, 18, 420, 650, [["おおなみ", 1, 0.9, 0.7], ["ヒレ ビンタ", 0, 1, 1.3], ["うごけなく なる うた", 0, 0.7, 1.7]], {boss:true, bg:"labn", say50:"デッドロック・くじら「ぐるぐる…まわって うごけない…たすけてぇ…」"}),
    fox:rpgE("フィッシングきつね", "🦊", 168, 44, 20, 76, 70, [["コンコン アタック", 0, 1, 1.2], ["ばけて だます", 0, 0.5, 1.3]]),
    bear:rpgE("ブラックアウトベア", "🐻", 190, 47, 23, 84, 78, [["ブラックアウト ハグ", 0, 1, 1.3], ["のしかかり", 0, 0.6, 1.5]]),
    unicorn:rpgE("ユニコーン・ノイズ", "🦄", 176, 46, 21, 90, 82, [["きらきら ずつき", 0, 1, 1.2], ["にじいろ ビーム", 1, 0.6, 0.7]]),
    teddy:rpgE("ブラックアウト・ぬいぐるみ王", "🧸", 1500, 56, 24, 0, 0, [["ぎゅーっと ブラックアウト", 1, 0.9, 0.8], ["ぬいぐるみ パンチ", 0, 1, 1.3], ["さびしさの なみだ", 0, 0.7, 1.8], ["ひとりぼっち バースト", 1, 0.5, 1.0]], {boss:true, final:true, bg:"future", say50:"ぬいぐるみ王「だれも…へんじを くれなかった…！ ひとりは いやだ…！」"})
};

// ---- なかま（職業のステータス：[はじめ, レベルごとの伸び]）----
const RPG_CLASS = {
    hero:{n:"", hp:[26, 11], mp:[6, 3], atk:[8, 3.2], def:[4, 2.0], agi:[8, 0.6]},
    haruki:{n:"ハルキ", hp:[22, 8], mp:[10, 4], atk:[7, 2.4], def:[5, 1.9], agi:[7, 0.5]},
    akito:{n:"アキト", hp:[30, 12], mp:[4, 2], atk:[10, 3.6], def:[4, 1.8], agi:[9, 0.6]}
};
function rpgNeed(lv){ return Math.round(8 + lv * lv * 2.6); }

// ボスの強さ調整（シミュレーションで、各ボスに勝てる目安のレベルをそろえた）
(function(){
    const k = {gyutan:[1.9, 1.25], panda:[2.1, 1.3], anaun:[2.2, 1.35], reindeer:[2.3, 1.4], whale:[2.4, 1.45], teddy:[2.4, 1.5]};
    Object.keys(k).forEach((id) => { const f = RPG_FOES[id]; f.hp = Math.round(f.hp * k[id][0]); f.atk = Math.round(f.atk * k[id][1]); });
})();

