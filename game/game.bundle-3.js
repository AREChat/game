"use strict";
/* 自動生成: node tools/build-game.js （直接編集しない）  束 3 / 4 */

/* ==== game/extra.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[19]=1;
"use strict";
// ===== 追加の しくみ：①チートの「使用中一覧／個別かいじょ／ぜんぶかいじょ」と複数同時入力
//        ②仲間の なまえ変更（ふだんから）  ③むずかしさ（イージー／ベーシック／ハード） =====
// ・チートを かいじょ すると、レベル・ステータス・そうび・なかま などが「いい感じ」に もどります。
//   レベルを チートで 上げていた あいだに もらった 経験値は、もとのレベルに ちゃんと つみかさなって いるので、そんしません。
// ・おかね／どうぐ／HP回復／ストーリーを すすめる コード（Clear など）は「プレゼント」あつかい。かいじょしても とりあげません。

// ---------------------------------------------------------------- なまえ（仲間）
function tqNm(){ const S = G.S; if(!S) return {}; return (S.nm = S.nm || {}); }
(function(){
    const _name = tqName;
    tqName = function(id){ if(id !== "hero" && G.S && G.S.nm && G.S.nm[id]) return G.S.nm[id]; return _name(id); };
})();
// ふきだしの なまえ／本文の なかの 元の なまえを、かえた なまえに おきかえる
function tqWho(w){
    const S = G.S; if(!S || !S.nm || !w) return w;
    for(const id of Object.keys(S.nm)){ if(RPG_CLASS[id] && RPG_CLASS[id].n === w) return S.nm[id]; }
    return w;
}
function tqRen(t){
    const S = G.S; if(!S || !S.nm || typeof t !== "string") return t;
    Object.keys(S.nm).forEach((id) => { const o = RPG_CLASS[id] && RPG_CLASS[id].n; if(o && S.nm[id] && o !== S.nm[id]) t = t.split(o).join(S.nm[id]); });
    return t;
}
function tqSetNick(id, raw){
    const S = G.S; if(!S || !S.party.includes(id) || id === "hero") return {ok:false, msg:"この なかまは なまえを かえられません。"};
    const v = Array.from(String(raw || "").normalize("NFKC").replace(/[<>&"'`]/g, "").trim()).slice(0, 8).join("");
    const nm = tqNm();
    if(!v || v === RPG_CLASS[id].n){ delete nm[id]; tqAutoSave(); return {ok:true, msg:RPG_CLASS[id].n + " の なまえを もとに もどした。"}; }
    if(S.party.some((x) => x !== id && tqName(x) === v) || v === S.name) return {ok:false, msg:"おなじ なまえの 仲間が いるよ。べつの なまえに しよう。"};
    nm[id] = v; tqAutoSave(); return {ok:true, msg:RPG_CLASS[id].n + " の なまえを「" + v + "」に した！"};
}

// ---------------------------------------------------------------- むずかしさ
const TQ_DIFFS = {
    easy:  {n:"イージー",   d:"てきが よわめ。ゆっくり ストーリーを たのしみたい人へ。", hp:0.7, atk:0.7, def:0.85, exp:1, g:1},
    basic: {n:"ベーシック", d:"ふつうの むずかしさ。（はじめは これ）", hp:1, atk:1, def:1, exp:1, g:1},
    hard:  {n:"ハード",     d:"てきが つよめ。そのぶん 経験値と おかねが 3割 おおい！", hp:1.4, atk:1.3, def:1.1, exp:1.3, g:1.3}
};
function tqDiff(){ const k = G.S && G.S.diff; return TQ_DIFFS[k] ? k : "basic"; }
function tqSetDiff(k){
    if(!G.S || !TQ_DIFFS[k]) return {ok:false, msg:"？"};
    G.S.diff = k; tqAutoSave();
    return {ok:true, msg:"むずかしさを「" + TQ_DIFFS[k].n + "」に した。" + (G.b ? "（つぎの たたかいから はんえい）" : "")};
}
(function(){
    const _bs = battleStart;
    battleStart = function(ids, after){
        _bs.apply(this, arguments);
        try{
            const k = tqDiff(), d = TQ_DIFFS[k]; if(k === "basic" || !G.b) return;
            G.b.foes.forEach((f) => {
                if(f._diff) return; f._diff = k;
                f.hp = Math.max(1, Math.round(f.hp * d.hp)); f.cur = f.hp; f.atk = Math.max(1, Math.round(f.atk * d.atk)); f.def = Math.max(0, Math.round(f.def * d.def));
                f.exp = Math.round(f.exp * d.exp); f.g = Math.round(f.g * d.g);
            });
        }catch(e){ console.error("[diff]", e); }
    };
})();

// ---------------------------------------------------------------- チート：使用中の管理
const TQ_TOGGLES = {god:"無敵モード", onehit:"ワンパンモード", infmp:"MPむげん", areall:"ARE！ゲージ MAX固定", noenc:"エンカウントなし", encx3:"エンカウント3倍", speed:"あるくの 2倍速", rainbow:"にじいろモード", showpos:"座標ひょうじ"};
function tqActs(){ const c = G.S.cx; if(!Array.isArray(c.act)) c.act = []; return c.act; }
function tqActFind(g){ return tqActs().find((a) => a.g === g); }
function tqActDrop(g){ const c = G.S.cx; c.act = tqActs().filter((a) => a.g !== g); }

// レベルチート中に もらった 経験値を「もとのレベル」にも つみかさねる
(function(){
    const _gain = tqGain;
    tqGain = function(exp){
        const a = G.S && G.S.cx && Array.isArray(G.S.cx.act) ? G.S.cx.act.find((x) => x.g === "lv") : null;
        if(a && a.snap && a.snap.lv < TQ_MAX_LV){
            a.snap.exp += Math.round(exp * (G.S.expmul || 1));
            while(a.snap.lv < TQ_MAX_LV && a.snap.exp >= rpgNeed(a.snap.lv)){ a.snap.exp -= rpgNeed(a.snap.lv); a.snap.lv++; }
            if(a.snap.lv >= TQ_MAX_LV) a.snap.exp = 0;
        }
        return _gain.apply(this, arguments);
    };
})();

function tqActOne(raw){
    const S = G.S, c = S.cx, f = tqFindCheat(raw), id = f && f.id;
    const before = {party:S.party.slice(), lv:S.lv, exp:S.exp, own:S.own.slice(), eq:Object.assign({}, S.eq), expmul:S.expmul || 1};
    const r = _tqApplyBase(raw);
    if(!r.ok || r.queued || !id) return r;
    const note = (extra) => { r.msg += "\n" + extra; };
    if(id === "off"){ const m = tqReleaseAll(true); if(m) r.msg += "\n" + m; return r; }
    if(id === "lvmax" || id === "lvset"){
        const had = tqActFind("lv");
        const lab = id === "lvmax" ? "レベル99" : "レベル" + S.lv;
        if(had){ had.label = lab; } else tqActs().push({g:"lv", label:lab, snap:{lv:before.lv, exp:before.exp}});
        note("（かいじょ すると もとの Lv" + tqActFind("lv").snap.lv + " に もどります。チート中に もらった 経験値は のこります）");
    }else if(id === "st999"){
        if(!tqActFind("st")) tqActs().push({g:"st", label:"ステータス999", snap:{}});
    }else if(id === "bestgear"){
        if(!tqActFind("gear")) tqActs().push({g:"gear", label:"さいきょうの そうび", snap:{own:before.own, eq:before.eq}});
    }else if(id === "expx10" || id === "expx100"){
        const had = tqActFind("exp"), lab = "経験値 ×" + (id === "expx10" ? 10 : 100);
        if(had) had.label = lab; else tqActs().push({g:"exp", label:lab, snap:{expmul:before.expmul}});
    }else if(id === "expx1"){ tqActDrop("exp"); }
    else if(id === "party5" || id === "party6" || id === "bossally" || id === "miraboss" || id === "miraally"){
        const added = S.party.filter((x) => !before.party.includes(x));
        if(added.length){
            const dropped = before.party.filter((x) => !S.party.includes(x));   // ミラ→ノイズクイーン への入れかえ
            tqActs().push({g:"party:" + added.join("+"), label:"なかま：" + added.map((x) => tqName(x)).join("・"), snap:{added, dropped}});
        }
    }else if(TQ_TOGGLES[id]){
        const key = id;
        if(c[key]){ if(!tqActFind("tg:" + key)) tqActs().push({g:"tg:" + key, label:TQ_TOGGLES[key], snap:{}}); } else tqActDrop("tg:" + key);
    }else if(id === "allgate"){
        if(!tqActFind("allgate")) tqActs().push({g:"allgate", label:"ゲート全開", snap:{}});
    }
    tqAutoSave();
    return r;
}

// 1つ かいじょ する。メッセージを かえす
function tqReleaseOne(g){
    const S = G.S, c = S.cx, a = tqActFind(g); if(!a) return "";
    let m = a.label + " を かいじょ した。";
    if(g === "lv"){
        const lv0 = S.lv, to = Math.max(1, a.snap.lv);
        S.lv = to; S.exp = a.snap.lv >= TQ_MAX_LV ? 0 : Math.min(a.snap.exp, rpgNeed(to) - 1);
        m = "レベルチートを かいじょ。Lv" + lv0 + " → Lv" + to + "（チート中に もらった 経験値も ちゃんと はんえい！）";
    }else if(g === "st"){ delete c.st999; m = "ステータス999を かいじょ。ほんらいの つよさに もどった。"; }
    else if(g === "gear"){
        S.own = S.own.filter((k) => a.snap.own.includes(k) || !["w6", "a6", "c4"].includes(k));
        ["w", "a", "c"].forEach((sl) => { if(["w6", "a6", "c4"].includes(S.eq[sl]) && !a.snap.own.includes(S.eq[sl])) S.eq[sl] = a.snap.eq[sl] && S.own.includes(a.snap.eq[sl]) ? a.snap.eq[sl] : (S.own.filter((k) => RPG_EQUIP[k].slot === sl).pop() || S.eq[sl]); });
        m = "さいきょうの そうびを かいじょ。もとの そうびに もどした。";
    }else if(g === "exp"){ S.expmul = a.snap.expmul || 1; m = "経験値の倍率を もとに もどした。（×" + S.expmul + "）"; }
    else if(g.indexOf("party:") === 0){
        const names = a.snap.added.map((x) => tqName(x)).join("・");
        S.party = S.party.filter((x) => !a.snap.added.includes(x) || x === "hero"); a.snap.added.forEach((x) => { delete S.m[x]; });
        (a.snap.dropped || []).forEach((x) => { if(!S.party.includes(x) && S.party.length < 6) tqAddMember(x, true); });
        if(S.party.length === 0) S.party = ["hero"];
        m = names + " は パーティから はなれた。";
    }
    else if(g.indexOf("tg:") === 0){ c[g.slice(3)] = false; }
    else if(g === "allgate"){ c.allgate = false; m = "ゲート全開を かいじょ。"; }
    tqActDrop(g);
    return m;
}
function tqReleaseAll(silent){
    if(!G.S) return "";
    const gs = tqActs().map((a) => a.g), out = [];
    // レベルは さいごに（ほかの かいじょで ステータスが かわるため）
    gs.sort((x, y) => (x === "lv") - (y === "lv"));
    gs.forEach((g) => { const m = tqReleaseOne(g); if(m) out.push(m); });
    TQ_TOGGLES && Object.keys(TQ_TOGGLES).forEach((k) => { G.S.cx[k] = false; });
    tqFixAfterRelease();
    tqAutoSave();
    return out.length ? out.join("\n") : (silent ? "" : "かいじょ する チートは ありません。");
}
// かいじょ のあと：HP/MPを あたらしい さいだい値に あわせ、のこりすぎ・へりすぎを おさえる
function tqFixAfterRelease(){
    const S = G.S;
    S.party.forEach((id) => { if(!S.m[id]) S.m[id] = {hp:1, mp:1}; });
    tqClamp();
    S.party.forEach((id) => { const m = S.m[id], st = tqStat(id); if(m.hp <= 0 && id === "hero") m.hp = 1; m.hp = Math.max(m.hp, Math.min(1, st.maxhp)); });
}
function tqRelease(g){ const m = tqReleaseOne(g); tqFixAfterRelease(); tqAutoSave(); return m || "かいじょ できる チートは ありません。"; }

// 複数同時入力（；／、／|で区切る）
let _tqApplyBase = tqApplyCheat;
tqApplyCheat = function(raw){
    const parts = String(raw == null ? "" : raw).split(/[;；、|｜\n]/).map((x) => x.trim()).filter(Boolean);
    if(parts.length <= 1){ return G.S ? tqActOne(parts[0] || raw) : _tqApplyBase(raw); }
    const msgs = []; let any = false;
    parts.forEach((p) => { const r = G.S ? tqActOne(p) : _tqApplyBase(p); any = any || r.ok; msgs.push((r.ok ? "◯ " : "× ") + r.msg.split("\n")[0]); });
    return {ok:any, msg:msgs.join("\n")};
};

// ---------------------------------------------------------------- 画面：チート／なまえ／むずかしさ
(function(){
    const _vc = viewCheat;
    viewCheat = function(){
        let h = _vc().replace('maxlength="40"', 'maxlength="300"').replace("コードを にゅうりょく", "コード（まとめて：；で区切る）");
        if(G.S){
            const a = tqActs();
            const list = '<div class="card"><b>🔧 いま つかっている チート</b>' + (a.length ? a.map((x) => '<div class="row" style="justify-content:space-between;align-items:center"><span>' + esc(x.label) + '</span><button class="btn sub" data-a="cRel" data-v="' + esc(x.g) + '">かいじょ</button></div>').join("") +
                '<div class="row"><button class="btn" data-a="cRelAll">ぜんぶ かいじょ</button></div>' : '<div class="meta">いまは ありません。</div>') +
                '<div class="meta">かいじょ すると、レベルや ステータス、そうび、なかまが いい感じに もどります。チート中に もらった 経験値は のこるので そんしません。おかね・どうぐ・ストーリーを すすめる コードは プレゼント あつかい（かいじょしても そのまま）。コードは「；」で 区切ると まとめて 入力できます。</div></div>';
            h = h.replace('<div class="meta">ヒント：', list + '<div class="meta">ヒント：');
        }
        return h;
    };
    ACT.cRel = (v) => { const m = tqRelease(v); G.cheatMsg = m; G.cheatOk = true; render(); };
    ACT.cRelAll = () => { const m = tqReleaseAll(false); G.cheatMsg = m; G.cheatOk = true; render(); };
})();

function tqCustomView(){
    const S = G.S, k = tqDiff();
    let h = '<h2>🔧 なまえ・むずかしさ</h2><div class="card"><b>むずかしさ</b>：' + esc(TQ_DIFFS[k].n) + '<div class="meta">' + esc(TQ_DIFFS[k].d) + '（あとから いつでも かえられる）</div><div class="row">' +
        Object.keys(TQ_DIFFS).map((x) => '<button class="btn' + (x === k ? "" : " sub") + '" data-a="dSet" data-v="' + x + '">' + esc(TQ_DIFFS[x].n) + '</button>').join("") + '</div></div>';
    h += '<div class="card"><b>なかまの なまえ</b><div class="meta">8文字まで。空にして「けってい」で もとの なまえに もどる。</div>' +
        S.party.filter((id) => id !== "hero").map((id) => '<div class="row" style="align-items:center"><span style="min-width:9cqw">' + esc(RPG_CLASS[id].n) + '</span><input id="nk_' + id + '" type="text" maxlength="8" value="' + esc(tqName(id) === RPG_CLASS[id].n ? "" : tqName(id)) + '" placeholder="' + esc(RPG_CLASS[id].n) + '" autocomplete="off" style="width:16cqw"><button class="btn sub" data-a="nkSet" data-v="' + id + '">けってい</button></div>').join("") +
        (S.party.length < 2 ? '<div class="meta">なかまが いません。</div>' : "") +
        '<div class="meta">' + esc(G.menuMsg || "") + '</div></div>';
    return h;
}
ACT.dSet = (v) => { const r = tqSetDiff(v); G.menuMsg = r.msg; render(); };
ACT.nkSet = (id) => { const r = tqSetNick(id, ($("nk_" + id) || {}).value || ""); G.menuMsg = r.msg; render(); };

// せってい画面にも むずかしさ
(function(){
    const _vs = viewSettings;
    viewSettings = function(){
        let h = _vs();
        if(G.S){
            const k = tqDiff();
            const card = '<div class="card"><div class="meta">むずかしさ（いつでも かえられる）</div><div class="row">' + Object.keys(TQ_DIFFS).map((x) => '<button class="btn' + (x === k ? "" : " sub") + '" data-a="sDiff" data-v="' + x + '">' + esc(TQ_DIFFS[x].n) + '</button>').join("") + '</div><div class="meta">' + esc(TQ_DIFFS[k].d) + '</div></div>';
            h = h.replace('<div class="row"><button class="btn" data-a="sBack">', card + '<div class="row"><button class="btn" data-a="sBack">');
        }
        return h;
    };
    ACT.sDiff = (v) => { tqSetDiff(v); render(); };
})();

// ---------------------------------------------------------------- ボスの イラスト（game/img/b_○○.webp）
// ある ボスだけ イラストで ひょうじ（ほかの てきは 今まで どおり 絵文字）
const TQ_BOSS_ART = ["gyutan", "panda", "anaun", "reindeer", "whale", "teddy", "spamking", "owl", "miraqueen", "skydragon", "omega"];
const TQ_BOSS_ART_PK = ["MON026", "MON040", "MON159", "MON173", "MON278", "MON292", "MON411", "MON425"];
TQ_BOSS_ART.forEach((k) => { if(RPG_FOES[k]) RPG_FOES[k].img = "b_" + k; });
(function(){
    if(typeof pkRegFoe !== "function") return;
    const _reg = pkRegFoe;
    pkRegFoe = function(monId){
        const key = _reg.apply(this, arguments);
        try{ if(key && RPG_FOES[key] && TQ_BOSS_ART_PK.includes(monId)) RPG_FOES[key].img = "b_" + monId; }catch(_e){}
        return key;
    };
})();


/* ==== game/job.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[20]=1;
"use strict";
// ===== 職業（転職）システム =====
// ・15しゅるいの 職業。転職は レベル10から。（主人公が つく）
// ・職業レベル（1〜99）は 戦闘の経験値で そだつ。各職業の さいごの わざは 職業レベル99で おぼえる。
// ・転職すると、その職業で のびた せいちょうの「半分」が ずっと のこる（ほかの職業でも ステータスが たかい！）
// ・おぼえた わざ（呪文・とくぎ）は、職業を かえても つかえる。
// ・マスター（職業レベル99）した 職業の かず、ためした 職業の かずで、さらに ステータス・成長スピードが アップ。
//   → 転職すればするほど 有利。
// ・ぜんぶで 15職 × わざ（4つ×5職 ＋ 3つ×10職）＝ 50しゅるい。ダブりは ありません。

const TQ_JOB_MIN_LV = 10;
const TQ_JOB_ARE_NEED = 3;      // ARE使いは 3つの職業を マスターすると なれる
const TQ_JOBS = [
    {id:"engineer", n:"エンジニア", e:"🛠️", d:"ARE の しくみを しりつくした 技術者。バグを みつけて なおす プロ。", prof:{hp:0.2, mp:0.35, atk:0.2, def:0.25, agi:0.25}, ab:[
        ["デバッグ・スキャン", "特技", 6, "foes", 15, "てき ぜんたいの こうげき・ぼうぎょを さげる", [["debuff"]]],
        ["ホットフィックス", "呪文", 9, "ally", 40, "なかまの HPを 5わり かいふく", [["heal", 0.5]]],
        ["ロールバック", "呪文", 20, "ally", 70, "たおれた なかまを HP6わりで ふっかつ", [["revive", 0.6]]],
        ["フルビルド・ARE", "特技", 30, "foes", 99, "てき ぜんたいに 大ダメージ！ AREゲージも ふえる", [["dmgAll", 2.6], ["gauge", 30]]]]},
    {id:"battle", n:"バトルの達人", e:"⚔️", d:"たたかいを きわめた 達人。ちからと ぼうぎょが ぐんぐん のびる。", prof:{hp:0.25, mp:0.0, atk:0.6, def:0.35, agi:0.25}, ab:[
        ["ばくれつ ラッシュ", "特技", 5, "foe", 15, "3れんぞく こうげき", [["multi", 3, 0.8]]],
        ["せいしん とういつ", "特技", 8, "party", 40, "みんなの こうげき・ぼうぎょ アップ", [["buffAD"]]],
        ["かわし ぎり", "特技", 10, "foe", 70, "かいしん 2.2ばい の いちげき", [["crit", 2.2]]],
        ["ひゃくれつ たつまき", "特技", 32, "foes", 99, "てき ぜんたいを まきこむ 大たつまき", [["dmgAll", 3.0]]]]},
    {id:"chef", n:"料理博士", e:"🍳", d:"おいしい りょうりで みんなを げんきに！ たいりょくが たっぷり。", prof:{hp:0.45, mp:0.2, atk:0.15, def:0.25, agi:0.1}, ab:[
        ["ほかほか スープ", "呪文", 12, "party", 15, "みんなの HPを 2.5わり かいふく", [["healAll", 0.25]]],
        ["スパイス ボンバー", "特技", 10, "foes", 40, "てき ぜんたいに ピリ辛ダメージ", [["dmgAll", 1.4]]],
        ["まんぷく ごちそう", "呪文", 18, "ally", 70, "なかまの HPを ぜんかいふく", [["heal", 1.0]]],
        ["フルコース・サプライズ", "特技", 34, "party", 99, "みんなを 8わり かいふく＋パワーアップ", [["healAll", 0.8], ["buffAD"]]]]},
    {id:"star", n:"星読み", e:"⭐", d:"星の ながれを よむ ふしぎな 人。まほうが とくい。", prof:{hp:0.1, mp:0.6, atk:0.3, def:0.1, agi:0.3}, ab:[
        ["ながれぼし", "呪文", 7, "foe", 15, "ながれぼしを ぶつける", [["dmg", 1.8]]],
        ["ほしの おつげ", "呪文", 9, "party", 40, "こうげき アップ＋AREゲージ", [["buffA"], ["gauge", 20]]],
        ["ほしぞら ゆうえい", "呪文", 18, "foes", 70, "てき ぜんたいを ダメージ＋うごけなく する", [["dmgAll", 1.6], ["stunAll"]]],
        ["しんぱくの ほしふり", "呪文", 36, "foes", 99, "ほしの あめを ふらせる 大まほう", [["dmgAll", 3.2]]]]},
    {id:"plush", n:"ぬいぐるみ使い", e:"🧸", d:"ぬいぐるみの なかまと たたかう ふしぎな 職業。かわいくて つよい。", prof:{hp:0.35, mp:0.25, atk:0.3, def:0.4, agi:0.1}, ab:[
        ["ぬいぐるみ ダイブ", "特技", 5, "foe", 15, "ぬいぐるみで ぽふっと こうげき", [["dmg", 1.7]]],
        ["ふわふわ ガード", "特技", 8, "party", 40, "みんなの ぼうぎょ アップ＋まもりを かためる", [["buffD"], ["guard"]]],
        ["おともだち ぞくぞく", "呪文", 16, "foes", 70, "3ターン ぬいぐるみが こうげき", [["summon", 3, 0.9]]],
        ["ぬいぐるみ軍団 そうしゅつげき", "特技", 30, "foes", 99, "ぜんいん で とっげき！＋3ターン おうえん", [["dmgAll", 2.4], ["summon", 3, 1.0]]]]},
    {id:"music", n:"音楽家", e:"🎵", d:"おんがくで みんなを げんきづける。リズムに のって たたかう。", prof:{hp:0.2, mp:0.35, atk:0.2, def:0.15, agi:0.5}, ab:[
        ["げんきの ふえ", "呪文", 10, "party", 20, "みんなの HPを 3わり かいふく", [["healAll", 0.3]]],
        ["ノリノリ ドラム", "特技", 12, "party", 55, "みんなの こうげき・ぼうぎょ アップ", [["buffAD"]]],
        ["フィナーレ・シンフォニー", "呪文", 34, "foes", 99, "だいえんそうで てきに ダメージ＋みんなを かいふく", [["dmgAll", 2.6], ["healAll", 0.3]]]]},
    {id:"weather", n:"お天気博士", e:"🌤️", d:"あめ・かみなり・ハリケーン。てんきを あやつる はかせ。", prof:{hp:0.1, mp:0.55, atk:0.3, def:0.1, agi:0.3}, ab:[
        ["にわか あめ", "呪文", 6, "foes", 20, "てき ぜんたいに あめを ふらせる", [["dmgAll", 1.1]]],
        ["いなずま ピカッ", "呪文", 14, "foe", 55, "かみなりを ひとりに ドーン", [["dmg", 2.6]]],
        ["ハリケーン・ホリデー", "呪文", 34, "foes", 99, "だいあらし！ ダメージ＋うごけなく する", [["dmgAll", 2.9], ["stunAll"]]]]},
    {id:"detective", n:"名探偵", e:"🔍", d:"なぞを とく めいたんてい。てきの よわてんを みぬく。", prof:{hp:0.15, mp:0.3, atk:0.4, def:0.2, agi:0.45}, ab:[
        ["ちゅうい ぶかい", "特技", 6, "foes", 20, "てきの よわてんを さがして ちからを さげる", [["debuff"]]],
        ["じけんの かぎ", "特技", 12, "foe", 55, "かいしん 2ばい の いちげき", [["crit", 2.0]]],
        ["すいり・かんぺき", "特技", 30, "foe", 99, "なぞを ぜんぶ とく！ ひとりに 超ダメージ", [["dmg", 4.2]]]]},
    {id:"magic", n:"手品師", e:"🎩", d:"ハトが ポン！ ふしぎな マジックで てきを まどわせる。", prof:{hp:0.15, mp:0.4, atk:0.25, def:0.15, agi:0.5}, ab:[
        ["ハトが ポン", "特技", 5, "foes", 20, "ハトで てきを びっくり！ うごけなく する", [["stunAll"]]],
        ["ぶんしん ショー", "特技", 12, "foe", 55, "4れんぞく こうげき", [["multi", 4, 0.7]]],
        ["ふしぎな マジック", "呪文", 32, "foes", 99, "ダメージ＋みんなの HPを かいふく", [["dmgAll", 2.5], ["healAll", 0.4]]]]},
    {id:"inventor", n:"発明家", e:"💡", d:"へんな どうぐを つぎつぎ はつめい。ひらめきが ちから。", prof:{hp:0.2, mp:0.4, atk:0.3, def:0.2, agi:0.25}, ab:[
        ["ビリビリ ボール", "特技", 7, "foe", 20, "でんきの ボールを ぶつける", [["dmg", 2.0]]],
        ["じどう はんとうき", "特技", 13, "ally", 55, "なかまの HPを 6わり かいふく", [["heal", 0.6]]],
        ["ロボ・アーミー", "特技", 32, "foes", 99, "ロボが 4ターン こうげき＋てき ぜんたいに ダメージ", [["dmgAll", 1.5], ["summon", 4, 1.0]]]]},
    {id:"dream", n:"夢見人", e:"🌙", d:"ゆめの せかいを あんない。ねむりで てきを とめる。", prof:{hp:0.3, mp:0.45, atk:0.15, def:0.2, agi:0.2}, ab:[
        ["ふわふわ ねむり", "呪文", 8, "foes", 20, "てき ぜんたいを ねむらせる", [["stunAll"]]],
        ["ゆめの つづき", "呪文", 14, "ally", 55, "たおれた なかまを HP5わりで ふっかつ", [["revive", 0.5]]],
        ["ぐっすり ドリーム", "呪文", 34, "party", 99, "みんなを 7わり かいふく＋MPも かいふく", [["healAll", 0.7], ["mp", 0.4]]]]},
    {id:"traveler", n:"時の旅人", e:"⏳", d:"じかんを ゆきき する たびびと。ARE の ものがたりに ぴったり。", prof:{hp:0.15, mp:0.4, atk:0.25, def:0.15, agi:0.6}, ab:[
        ["ちょっと はやまわし", "呪文", 9, "party", 20, "みんなの こうげき アップ", [["buffA"]]],
        ["もどって やりなおし", "呪文", 18, "ally", 55, "たおれた なかまを HP7わりで ふっかつ", [["revive", 0.7]]],
        ["じかん ストップ・ARE", "呪文", 36, "foes", 99, "てきの じかんを とめて ダメージ", [["dmgAll", 2.0], ["stunAll"]]]]},
    {id:"fairy", n:"妖精", e:"🧚", d:"はなと ひかりの ようせい。やさしい まほうで みんなを まもる。", prof:{hp:0.2, mp:0.5, atk:0.1, def:0.3, agi:0.35}, ab:[
        ["キラキラ こな", "呪文", 6, "ally", 20, "なかまの HPを 4.5わり かいふく", [["heal", 0.45]]],
        ["はなの かんむり", "呪文", 13, "party", 55, "ぼうぎょ アップ＋みんなを ちょっと かいふく", [["buffD"], ["healAll", 0.2]]],
        ["せいれいの うた", "呪文", 32, "party", 99, "みんなを ぜんかいふく＋パワーアップ", [["healAll", 1.0], ["buffAD"]]]]},
    {id:"cat", n:"ねこ使い", e:"🐱", d:"ねこと なかよし。すばしっこく て ひるねも だいすき。", prof:{hp:0.25, mp:0.2, atk:0.35, def:0.2, agi:0.6}, ab:[
        ["ねこパンチ", "特技", 4, "foe", 20, "2れんぞく ねこパンチ", [["multi", 2, 1.0]]],
        ["おひるね ゴロゴロ", "特技", 10, "self", 55, "じぶんの HPと MPを かいふく", [["healSelf", 0.6], ["mp", 0.25]]],
        ["ねこの もりの なかまたち", "特技", 30, "foes", 99, "ねこが 4ターン こうげき＋てき ぜんたいに ダメージ", [["dmgAll", 2.2], ["summon", 4, 1.1]]]]},
    {id:"are", n:"ARE使い", e:"🌟", d:"『そういうときは、AREだ！』を つかいこなす でんせつの 職業。3つの 職業を マスターすると なれる。", prof:{hp:0.4, mp:0.5, atk:0.5, def:0.4, agi:0.4}, need:TQ_JOB_ARE_NEED, ab:[
        ["AREの ひかり", "呪文", 12, "party", 30, "みんなを 5わり かいふく＋こうげき アップ", [["healAll", 0.5], ["buffA"]]],
        ["そういう ときは AREだ！", "特技", 24, "foes", 60, "てき ぜんたいに ダメージ＋AREゲージ モリモリ", [["dmgAll", 2.6], ["gauge", 50]]],
        ["ARE・オーバードライブ", "特技", 40, "foes", 99, "ARE の ぜんりょく！ 超ダメージ＋パワーアップ", [["dmgAll", 4.0], ["buffAD"]]]]},
    {id:"genius", n:"天才", e:"🌈", genius:true, d:"15の 職業を すべて きわめた ものだけが たどりつく ふしぎな 職業。ぜんぶ ケタちがい！", prof:{hp:0.9, mp:0.9, atk:0.9, def:0.9, agi:0.9}, ab:[
        ["てんさいの へんしん", "呪文", 20, "foes", 1, "てきを ランダムで「けいけんち」「ゴールド」「ドロップ」「転生」モンスターに へんしんさせる！", [["transform"]]],
        ["いつでも かいしん", "特技", 0, "self", 1, "【ずっと】こうげきが いつも かいしんの いちげきに なる（ON/OFF）", [["passive", "gcrit"]]],
        ["いつでも にげられる", "特技", 0, "self", 1, "【ずっと】どんな あいてからも かならず にげられる（ON/OFF）", [["passive", "gflee"]]],
        ["スカウトの かみさま", "特技", 0, "self", 1, "【ずっと】モンスターが かならず なかまに なりたがる 100%（ON/OFF）", [["passive", "gscout"]]],
        ["ゴールドの かみさま", "特技", 0, "self", 1, "【ずっと】もらえる ゴールドが 3ばい（ON/OFF）", [["passive", "ggold"]]],
        ["けいけんの かみさま", "特技", 0, "self", 1, "【ずっと】もらえる 経験値が 3ばい（ON/OFF）", [["passive", "gexp"]]],
        ["てんさいの いやし", "呪文", 40, "party", 1, "みんなを ぜんかいふく！ ふっかつ＋HP・MPまんたん", [["godHeal"]]],
        ["ボス とばし", "特技", 50, "foes", 1, "ボスせんを いっしゅんで おわらせる！（ほうびは ちゃんと もらえる）", [["bossSkip"]]],
        ["ビッグバン・ARE", "呪文", 60, "foes", 1, "うちゅうの はじまりの ひかり！ てき ぜんたいに 超・超ダメージ", [["dmgAll", 14.0], ["gauge", 100]]],
        ["じかんよ とまれ", "特技", 80, "foes", 1, "じかんが とまる！ てきが ぜんいん 3ターン うごけない＋みんな パワーアップ", [["timeStop"]]]]}
];
// わざ（50）の 一覧を つくる（id: "J" + 職業番号 + 順番）
const TQ_JOB_AB = {};
TQ_JOBS.forEach((j, ji) => {
    j.abil = j.ab.map((a, ai) => { const o = {id:"J" + String(ji + 1).padStart(2, "0") + String.fromCharCode(97 + ai), job:j.id, n:a[0], type:a[1], mp:a[2], tg:a[3], lv:a[4], d:a[5], fx:a[6]}; TQ_JOB_AB[o.id] = o; return o; });
});
const TQ_JOB_BY = {}; TQ_JOBS.forEach((j) => { TQ_JOB_BY[j.id] = j; });
const TQ_JOB_STATS = ["hp", "mp", "atk", "def", "agi"], TQ_JOB_STAT_N = {hp:"HP", mp:"MP", atk:"こうげき", def:"ぼうぎょ", agi:"すばやさ"};

// ---------------------------------------------------------------- 状態
function tqJ(){
    const S = G.S; if(!S) return null;
    const j = (S.job = S.job || {});
    if(!j.carry) j.carry = {hp:0, mp:0, atk:0, def:0, agi:0};
    if(!j.best) j.best = {};
    if(!Array.isArray(j.mast)) j.mast = [];
    if(!Array.isArray(j.tried)) j.tried = [];
    if(!j.learned) j.learned = {};
    if(typeof j.cur !== "string") j.cur = "";
    if(!(j.jlv >= 1)) j.jlv = 1;
    if(!(j.jexp >= 0)) j.jexp = 0;
    if(!(j.changes >= 0)) j.changes = 0;
    return j;
}
function tqJobNeed(lv){ return Math.max(6, Math.round(rpgNeed(Math.min(lv, 98)) / 12)); }
function tqJobCan(id){
    const j = tqJ(), def = TQ_JOB_BY[id]; if(!j || !def) return {ok:false, why:"？"};
    if(window.pkGate && !pkGate(1)) return {ok:false, why:"地図1（ホシミ台）を クリアすると 転職できます。"};
    if(G.S.lv < TQ_JOB_MIN_LV) return {ok:false, why:"レベル" + TQ_JOB_MIN_LV + " から 転職できます。（いま Lv" + G.S.lv + "）"};
    if(def.genius){ const left = TQ_JOBS.filter((x) => !x.genius && !j.mast.includes(x.id)).length; if(left > 0) return {ok:false, why:"？？？（まだ ひみつ… あと " + left + " しゅるいの 職業を マスターすると…）"}; }
    else if(def.need && j.mast.length < def.need) return {ok:false, why:"3つの 職業を マスター（職業Lv99）すると なれます。（いま " + j.mast.length + "/" + def.need + "）"};
    if(j.cur === id) return {ok:false, why:"いま この 職業です。"};
    return {ok:true};
}
// ボーナスの けいさん
function tqJobMul(stat){
    const j = tqJ(); if(!j) return 1;
    const def = TQ_JOB_BY[j.cur], cur = def ? 1 + def.prof[stat] * (j.jlv / 99) : 1;
    const carry = 1 + Math.min(1.0, j.carry[stat] || 0), team = 1 + 0.03 * j.mast.length + 0.01 * Math.max(0, j.tried.length - 1);
    return carry * cur * team;
}
function tqJobStartLv(id){
    const j = tqJ(); let s = 1 + 2 * j.mast.length + Math.floor(j.changes / 2);
    if(j.best[id]) s = Math.max(s, Math.floor(j.best[id] * 0.6));
    return Math.max(1, Math.min(60, s));
}
function tqJobRate(){ const j = tqJ(); return 1 + 0.1 * Math.min(10, Math.max(0, j.tried.length - 1)); }

// ステータスに はんえい（主人公だけ）
(function(){
    const _stat = tqStat;
    tqStat = function(id){
        const st = _stat.apply(this, arguments);
        try{
            const S = G.S;
            if(id !== "hero" || !S || S.cx.st999 || !S.job) return st;
            tqJ();
            const o = {maxhp:"hp", maxmp:"mp", atk:"atk", def:"def", agi:"agi"};
            Object.keys(o).forEach((k) => { st[k] = Math.round(st[k] * tqJobMul(o[k])); });
        }catch(e){ console.error("[job stat]", e); }
        return st;
    };
})();

// 経験値 → 職業レベル
(function(){
    const _gain = tqGain;
    tqGain = function(exp){
        const S = G.S, pre = S && S.job && S.job.cur ? exp : 0, msgs = [];
        const ups = _gain.apply(this, arguments);
        try{
            if(pre > 0){
                const j = tqJ();
                if(j.jlv < 99){
                    j.jexp += Math.max(1, Math.round(pre * (S.expmul || 1) * tqJobRate()));
                    while(j.jlv < 99 && j.jexp >= tqJobNeed(j.jlv)){
                        j.jexp -= tqJobNeed(j.jlv); j.jlv++;
                        msgs.push(S.name + "の 職業レベルが " + j.jlv + " に あがった！（" + TQ_JOB_BY[j.cur].n + "）");
                        TQ_JOB_BY[j.cur].abil.forEach((a) => { if(j.jlv >= a.lv && !j.learned[a.id]){ j.learned[a.id] = 1; msgs.push(S.name + "は「" + a.n + "」を おぼえた！"); } });
                        if(j.jlv >= 99){ j.jexp = 0; if(!j.mast.includes(j.cur)){ j.mast.push(j.cur); j.best[j.cur] = 99; msgs.push("🎉 " + TQ_JOB_BY[j.cur].n + " を マスターした！（ステータスに ボーナス）"); } }
                    }
                    j.best[j.cur] = Math.max(j.best[j.cur] || 0, j.jlv);
                }
            }
        }catch(e){ console.error("[job gain]", e); }
        return ups.concat(msgs);
    };
})();

// 転職
function tqJobChange(id){
    const S = G.S, j = tqJ(), c = tqJobCan(id); if(!c.ok) return {ok:false, msg:c.why};
    const def = TQ_JOB_BY[id], old = TQ_JOB_BY[j.cur];
    let msg = "";
    if(old){
        TQ_JOB_STATS.forEach((s) => { j.carry[s] = Math.min(1, (j.carry[s] || 0) + old.prof[s] * (j.jlv / 99) * 0.5); });
        j.best[old.id] = Math.max(j.best[old.id] || 0, j.jlv);
        if(j.jlv >= 99 && !j.mast.includes(old.id)) j.mast.push(old.id);
        msg += old.n + " で のびた 成長の 半分が ずっと のこる！\n";
    }
    if(!j.tried.includes(id)) j.tried.push(id);
    j.changes++; j.cur = id; j.jlv = tqJobStartLv(id); j.jexp = 0;
    def.abil.forEach((a) => { if(j.jlv >= a.lv) j.learned[a.id] = 1; });
    tqClamp(); tqAutoSave();
    return {ok:true, msg:msg + S.name + " は「" + def.n + "」に 転職した！（職業Lv" + j.jlv + " から スタート）"};
}
function tqJobKnown(){ const j = tqJ(); return j ? Object.keys(j.learned).filter((k) => TQ_JOB_AB[k] && j.learned[k]).map((k) => TQ_JOB_AB[k]) : []; }

// ---------------------------------------------------------------- 戦闘
(function(){
    if(typeof pkBattleBtns !== "function") return;
    const _btns = pkBattleBtns, _menu = pkBattleMenu, _bcmd = pkBcmd, _act = pkHeroAct, _re = roundEnd;
    pkBattleBtns = function(){ let h = _btns.apply(this, arguments); try{ if(G.S && G.S.job && tqJobKnown().length) h += '<button class="opt" data-a="bcmd" data-v="pkmenu|job">🎓 しょくぎょうわざ</button>'; }catch(_e){} return h; };
    pkBattleMenu = function(menu){
        if(menu === "pkjob"){
            const back = '<button class="opt" data-a="bcmd" data-v="back">もどる</button>';
            return tqJobKnown().filter((a) => !(a.fx[0] && a.fx[0][0] === "passive")).map((a) => '<button class="opt" data-a="bcmd" data-v="jobuse|' + a.id + '">' + esc(a.n) + '（MP' + a.mp + '）</button>').join("") + back;
        }
        return _menu.apply(this, arguments);
    };
    pkBcmd = function(c, arg){
        if(c === "jobuse"){
            const b = G.b, S = G.S, a = TQ_JOB_AB[arg]; if(!b || !a || !tqJobKnown().includes(a)) return true;
            if(S.m.hero.mp < a.mp && !S.cx.infmp){ b.text = "MPが たりない！"; b.menu = "top"; render(); return true; }
            if(a.tg === "foe"){ if(foesAlive().length > 1){ G.pend = {k:"pkjob", id:arg}; b.menu = "target"; render(); } else heroTurn({k:"pkjob", id:arg, t:foesAlive()[0]}); return true; }
            if(a.tg === "ally"){ G.pend = {k:"pkjob", id:arg}; b.menu = "ally"; render(); return true; }
            heroTurn({k:"pkjob", id:arg, t:foesAlive()[0]}); return true;
        }
        return _bcmd.apply(this, arguments);
    };
    pkHeroAct = function(act){
        if(act.k !== "pkjob") return _act.apply(this, arguments);
        const b = G.b, S = G.S, a = TQ_JOB_AB[act.id], hn = S.name; if(!a) return false;
        if(S.m.hero.mp < a.mp && !S.cx.infmp){ bLog("MPが たりない！"); return false; }
        const st = tqStat("hero"), atkB = b.buff.atk > 0 ? 1.25 : 1, fa = foesAlive();
        bSpend("hero", a.mp); bLog(hn + (a.type === "呪文" ? "は " + a.n + " を となえた！" : "の " + a.n + "！"));
        const hit = (t, mult, crit) => { const r = bDmg(st.atk * atkB, t.def, mult * (crit || 1)), dm = bFoeHurt(t, r.d); bHit(b.foes.indexOf(t)); S.gauge = Math.min(100, S.gauge + 6); bLog(t.label + "に " + dm + "のダメージ！" + (r.crit ? "（かいしん！）" : "")); return dm; };
        const pickT = () => { let t = act.t; if(!t || t.cur <= 0) t = foesAlive()[0]; return t; };
        const healTo = (cid, amt) => { if(!bAlive(cid)) { bLog(tqName(cid) + "は たおれていて きかない！"); return; } const mm = S.m[cid], bf = mm.hp; mm.hp = Math.min(tqStat(cid).maxhp, bf + Math.max(1, Math.round(amt))); bLog(tqName(cid) + "の HPが " + (mm.hp - bf) + " かいふく！"); };
        a.fx.forEach((f) => {
            const k = f[0];
            if(k === "dmg"){ const t = pickT(); if(t) hit(t, f[1]); }
            else if(k === "crit"){ const t = pickT(); if(t) hit(t, f[1], 1); }
            else if(k === "multi"){ for(let i = 0; i < f[1]; i++){ const t = pickT() || foesAlive()[0]; if(!t || t.cur <= 0) break; hit(t, f[2]); } }
            else if(k === "dmgAll"){ foesAlive().forEach((t) => hit(t, f[1] * 0.85)); }
            else if(k === "heal"){ const c = act.to || "hero"; healTo(c, tqStat(c).maxhp * f[1]); }
            else if(k === "healSelf"){ healTo("hero", tqStat("hero").maxhp * f[1]); }
            else if(k === "healAll"){ S.party.filter((c) => bAlive(c)).forEach((c) => healTo(c, tqStat(c).maxhp * f[1])); }
            else if(k === "revive"){ const c = act.to || S.party.find((x) => !bAlive(x)); if(!c || bAlive(c)){ bLog("ふっかつさせる なかまが いない！"); } else { S.m[c].hp = Math.max(1, Math.round(tqStat(c).maxhp * f[1])); bLog(tqName(c) + "が ふっかつした！"); } }
            else if(k === "mp"){ const mm = S.m.hero, mx = tqStat("hero").maxmp, bf = mm.mp; mm.mp = Math.min(mx, bf + Math.round(mx * f[1])); bLog(hn + "の MPが " + (mm.mp - bf) + " かいふく！"); }
            else if(k === "buffA"){ b.buff.atk = Math.max(b.buff.atk, 3); bLog("みんなの こうげきが アップ！"); }
            else if(k === "buffD"){ b.buff.def = Math.max(b.buff.def, 3); bLog("みんなの ぼうぎょが アップ！"); }
            else if(k === "buffAD"){ b.buff.atk = Math.max(b.buff.atk, 3); b.buff.def = Math.max(b.buff.def, 3); bLog("みんなの こうげき・ぼうぎょが アップ！"); }
            else if(k === "guard"){ b.guard = true; }
            else if(k === "debuff"){ foesAlive().forEach((t) => { t.atk = Math.max(1, Math.round(t.atk * 0.8)); t.def = Math.max(0, Math.round(t.def * 0.75)); bLog(t.label + "の ちからが さがった！"); }); }
            else if(k === "stunAll"){ foesAlive().forEach((t) => { if(t.boss && G.rnd() > 0.35){ bLog(t.label + "には きかなかった！"); return; } t.stun = 2; bLog(t.label + "は うごけなくなった！"); }); }
            else if(k === "gauge"){ S.gauge = Math.min(100, S.gauge + f[1]); bLog("AREゲージが たまった！"); }
            else if(k === "transform"){ tqGeniusTransform(a); }
            else if(k === "godHeal"){ S.party.forEach((c) => { const mm = S.m[c], st2 = tqStat(c); mm.hp = st2.maxhp; mm.mp = st2.maxmp; }); bLog("みんなが ひかりに つつまれて ぜんかいふく！ ふっかつも した！"); }
            else if(k === "bossSkip"){ foesAlive().forEach((t) => { t.cur = 1; bFoeHurt(t, 999999999); bHit(b.foes.indexOf(t)); }); bLog("てんさいの ちからで たたかいが いっしゅんで おわった！"); }
            else if(k === "timeStop"){ foesAlive().forEach((t) => { t.stun = 3; bLog(t.label + "は じかんの なかに とじこめられた！"); }); b.buff.atk = Math.max(b.buff.atk, 4); b.buff.def = Math.max(b.buff.def, 4); S.gauge = 100; bLog("じかんが とまった！ みんなが パワーアップ！"); }
            else if(k === "passive"){ bLog("これは ずっと はたらく ちから。メニューの てんしょくで ON/OFF できる！"); }
            else if(k === "summon"){ b.jobFx = (b.jobFx || []).concat([{k:"summon", turns:f[1], mult:f[2], name:a.n}]); bLog("なかまが かけつけた！（" + f[1] + "ターン）"); }
        });
        return false;
    };
    // ターンの おわりに ぬいぐるみ などが こうげき
    roundEnd = function(){
        const b = G.b;
        try{
            if(b && b.jobFx && b.jobFx.length && foesAlive().length > 0){
                const S = G.S, st = tqStat("hero");
                b.jobFx.forEach((f) => {
                    const fa = foesAlive(); if(!fa.length || f.turns <= 0) return;
                    const t = fa[Math.floor(G.rnd() * fa.length)], r = bDmg(st.atk, t.def, f.mult * 0.9), dm = bFoeHurt(t, r.d); bHit(b.foes.indexOf(t));
                    bLog("おともだちの こうげき！ " + t.label + "に " + dm + "のダメージ！"); f.turns--;
                });
                b.jobFx = b.jobFx.filter((f) => f.turns > 0);
                b.text = b.log.slice(-6).join("\n");
            }
        }catch(e){ console.error("[job fx]", e); }
        return _re.apply(this, arguments);
    };
})();

// ---------------------------------------------------------------- 天才の ちから
const TQ_GEN_PASS = {gcrit:"いつでも かいしん", gflee:"いつでも にげられる", gscout:"スカウト 100%", ggold:"ゴールド ×3", gexp:"経験値 ×3"};
function tqGeniusTransform(a){
    const b = G.b, kinds = ["exp", "gold", "drop", "rebirth"];
    foesAlive().forEach((f) => {
        if(f.boss){ f.exp = Math.round(f.exp * 1.5); f.g = Math.round(f.g * 1.5); b.log.push(f.label + "は へんしんを はねかえした！ …でも ごほうびが ふえた！"); return; }
        const k = kinds[Math.floor(G.rnd() * kinds.length)], old = f.label;
        if(k === "exp"){ f.exp = f.exp * 6 + 20; f.label = "✨経験値の" + old; b.log.push(old + "は 🌟けいけんちモンスター に へんしん！"); }
        else if(k === "gold"){ f.g = f.g * 6 + 30; f.label = "💰ゴールドの" + old; b.log.push(old + "は 💰ゴールドモンスター に へんしん！"); }
        else if(k === "drop"){ f.sureDrop = true; f.g = f.g * 2; f.label = "🎁ドロップの" + old; b.log.push(old + "は 🎁ドロップモンスター に へんしん！ かならず なにか おとす！"); }
        else{ f.exp = f.exp * 3 + 10; f.g = f.g * 3 + 20; f.sureDrop = true; f.sureScout = true; f.label = "🌈転生の" + old; b.log.push(old + "は 🌈転生モンスター に へんしん！ すべてが ふえて なかまにも なりたがる！"); }
        f.atk = Math.max(1, Math.round(f.atk * 0.5));
    });
}
ACT.gTog = (v) => { const S = G.S; if(!TQ_GEN_PASS[v]) return; const ok = tqJobKnown().some((a) => a.fx[0] && a.fx[0][1] === v); if(!ok) return; S.cx[v] = !S.cx[v]; tqAutoSave(); render(); };

// ---------------------------------------------------------------- 画面（メニュー → 転職）
function tqJobView(){
    const S = G.S, j = tqJ(), cur = TQ_JOB_BY[j.cur];
    let h = '<h2>👔 てんしょく</h2>';
    h += '<div class="card"><b>いまの 職業：' + (cur ? cur.e + " " + esc(cur.n) : "（なし）") + '</b>' + (cur ? '　職業Lv ' + j.jlv + (j.jlv >= 99 ? "（マスター！）" : '　つぎまで ' + (tqJobNeed(j.jlv) - j.jexp)) : "") +
        '<div class="meta">キャラ Lv' + S.lv + '　マスター ' + j.mast.length + '/15　ためした職業 ' + j.tried.length + '/16　転職 ' + j.changes + '回　成長スピード ×' + tqJobRate().toFixed(1) + '</div>' +
        '<div class="meta">ボーナス：' + TQ_JOB_STATS.map((s) => TQ_JOB_STAT_N[s] + " ×" + tqJobMul(s).toFixed(2)).join("　") + '</div></div>';
    if(window.pkGate && !pkGate(1)) h += '<div class="card">🔒 地図1（ホシミ台）を クリアすると 転職できます。</div>';
    else if(S.lv < TQ_JOB_MIN_LV) h += '<div class="card">🔒 レベル' + TQ_JOB_MIN_LV + ' から 転職できます。（いま Lv' + S.lv + '）</div>';
    h += '<div class="card meta">転職すると、いまの 職業で のびた 成長の「半分」が ずっと のこります。おぼえた わざは 職業を かえても つかえます。マスターした 職業が ふえるほど、あたらしい 職業の スタートが 高くなります。</div>';
    if(G.jobMsg) h += '<div class="card okc" style="white-space:pre-wrap">' + esc(G.jobMsg) + '</div>';
    const passK = tqJobKnown().filter((a) => a.fx[0] && a.fx[0][0] === "passive");
    if(passK.length){
        h += '<div class="card"><b>🌈 てんさいの ちから（ずっと）</b>' + passK.map((a) => { const k = a.fx[0][1]; return '<div class="row"><span class="meta">' + esc(a.n) + '：' + esc(a.d) + '</span><button class="btn' + (S.cx[k] ? "" : " sub") + '" data-a="gTog" data-v="' + k + '">' + (S.cx[k] ? "ON" : "OFF") + '</button></div>'; }).join("") + '</div>';
    }
    TQ_JOBS.forEach((d) => {
        const c = tqJobCan(d.id), me = j.cur === d.id, best = j.best[d.id] || 0, pend = G.jobPend === d.id;
        if(d.genius && !c.ok && !me && !best){ h += '<div class="card"><b>❓ ？？？</b><div class="meta">' + esc(c.why) + '</div></div>'; return; }
        h += '<div class="card"><b>' + d.e + ' ' + esc(d.n) + '</b>' + (me ? ' <span class="okc">◀ いま</span>' : "") + (j.mast.includes(d.id) ? ' <span class="okc">★マスター</span>' : (best ? ' <span class="meta">さいこう Lv' + best + '</span>' : "")) +
            '<div class="meta">' + esc(d.d) + '</div><div class="meta">せいちょう：' + TQ_JOB_STATS.map((s) => TQ_JOB_STAT_N[s] + "+" + Math.round(d.prof[s] * 100) + "%").join(" ") + '</div>' +
            '<div class="meta">' + d.abil.map((a) => (j.learned[a.id] ? "✅" : "▫️") + esc(a.n) + '(Lv' + a.lv + ')').join("　") + '</div>' +
            (me ? "" : pend ? '<div class="row"><button class="btn" data-a="jobGo" data-v="' + d.id + '">ほんとうに 転職する</button><button class="btn sub" data-a="jobNo">やめる</button></div>' :
                c.ok ? '<div class="row"><button class="btn" data-a="jobSet" data-v="' + d.id + '">転職する</button></div>' : '<div class="meta">🔒 ' + esc(c.why) + '</div>') + '</div>';
    });
    return h;
}
ACT.jobSet = (v) => { G.jobPend = v; G.jobMsg = ""; render(); };
ACT.jobNo = () => { G.jobPend = null; render(); };
ACT.jobGo = (v) => { const r = tqJobChange(v); G.jobPend = null; G.jobMsg = r.msg; render(); };


/* ==== game/titles.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[21]=1;
"use strict";
// ===== しょうごう（称号）：もくひょうを たっせいすると もらえる =====
// 保存：S.cx.ti = {got:{id:1}, sel:"id"}
const TQ_TITLES = (function(){
    const F = (k) => () => !!G.S.f[k], J = () => tqJ(), cnt = () => G.S.party.length;
    const L = [
        // ものがたり
        ["t_first", "はじめの いっぽ", "はじめて てきを たおす", () => G.S.kills >= 1, 100],
        ["t_sendai", "ホシミ台の ヒーロー", "2026年の ホシミ台を クリア", F("e_sendai"), 300],
        ["t_tokyo", "夜のアカリ市の たんていさん", "2025年の 夜のアカリ市を クリア", F("e_tokyo"), 300],
        ["t_white", "まっしろの たびびと", "まっしろルームを クリア", F("e_white"), 400],
        ["t_xmas", "クリスマスの きせき", "クリスマスの アカリ市を クリア", F("e_xmas"), 400],
        ["t_labn", "ARE たんじょうの めいげきしゃ", "ARE が 生まれた 夜を クリア", F("e_labn"), 500],
        ["t_future", "ARE かんせい！", "本編を クリアする", F("e_future"), 2000],
        ["t_n8", "ノイズの森の しんにゅうしゃ", "第1層を クリア", F("e_n8"), 800],
        ["t_n9", "うみぞこの すくいぬし", "第2層を クリア", F("e_n9"), 800],
        ["t_n10", "サーバー城の ゆうしゃ", "第3層を クリア", F("e_n10"), 1000],
        ["t_n11", "ノイズ王国の へいわの もと", "第4層を クリア", F("e_n11"), 3000],
        ["t_xr", "XRたいけんの たつじん", "XRアドベンチャー体験会を クリア", F("e_xr"), 1500],
        ["t_mem3", "メモリ あつめ 中", "メモリを 3つ あつめる", () => tqMemCount() >= 3, 300],
        ["t_mem6", "メモリ コンプリート", "メモリを 6つ ぜんぶ あつめる", () => tqMemCount() >= 6, 1000],
        // なかま
        ["t_p2", "ふたりは なかよし", "仲間が 2人以上", () => cnt() >= 2, 100],
        ["t_p4", "4人の ドリームチーム", "パーティが 4人", () => cnt() >= 4, 400],
        ["t_p6", "6人の ちょうチーム", "パーティが 6人（チート）", () => cnt() >= 6, 100],
        // レベル
        ["t_l10", "ひよっこ ぼうけんか", "レベル 10", () => G.S.lv >= 10, 100],
        ["t_l30", "いちにんまえ", "レベル 30", () => G.S.lv >= 30, 400],
        ["t_l50", "ベテラン", "レベル 50", () => G.S.lv >= 50, 800],
        ["t_l70", "えいゆう", "レベル 70", () => G.S.lv >= 70, 1500],
        ["t_l99", "ちょうてん", "レベル 99", () => G.S.lv >= 99, 5000],
        // たたかい
        ["t_k10", "モンスター ハンター", "てきを 10たい たおす", () => G.S.kills >= 10, 100],
        ["t_k100", "100たい ぎり", "てきを 100たい たおす", () => G.S.kills >= 100, 500],
        ["t_k500", "せんとうの たつじん", "てきを 500たい たおす", () => G.S.kills >= 500, 1500],
        ["t_k2000", "ノイズ バスター", "てきを 2000たい たおす", () => G.S.kills >= 2000, 4000],
        ["t_g10", "こつこつ レベルあげ", "じどうレベル上げを 10回", () => (G.S.grinds || 0) >= 10, 200],
        ["t_g100", "レベルあげの おに", "じどうレベル上げを 100回", () => (G.S.grinds || 0) >= 100, 1500],
        ["t_gauge", "AREの ほのお", "ARE！ゲージを ためて ひっさつを だす準備", () => G.S.gauge >= 100, 100],
        // おかね・あるく
        ["t_gold1", "おこづかい もちもち", "10,000G もつ", () => G.S.gold >= 10000, 200],
        ["t_gold2", "おかねもち", "100,000G もつ", () => G.S.gold >= 100000, 600],
        ["t_gold3", "ミリオネア", "1,000,000G もつ", () => G.S.gold >= 1000000, 2000],
        ["t_step1", "さんぽ ずき", "5,000歩 あるく", () => G.S.steps >= 5000, 200],
        ["t_step2", "せかいの たびびと", "50,000歩 あるく", () => G.S.steps >= 50000, 1000],
        ["t_play1", "1じかん あそんだよ", "プレイ 1時間", () => G.S.play >= 3600, 200],
        ["t_play2", "ARE ジャンキー", "プレイ 10時間", () => G.S.play >= 36000, 2000],
        // 職業
        ["t_j1", "てんしょく デビュー", "はじめて 転職する", () => J().changes >= 1, 300],
        ["t_j5", "いろんな しごとを したよ", "5つの 職業を ためす", () => J().tried.length >= 5, 800],
        ["t_j10", "ジョブ コレクター", "10の 職業を ためす", () => J().tried.length >= 10, 1500],
        ["t_m1", "はじめての マスター", "職業を 1つ マスター（Lv99）", () => J().mast.length >= 1, 1000],
        ["t_m5", "マスター 5人前", "職業を 5つ マスター", () => J().mast.filter((x) => x !== "genius").length >= 5, 2500],
        ["t_m10", "ジョブの たつじん", "職業を 10こ マスター", () => J().mast.filter((x) => x !== "genius").length >= 10, 4000],
        ["t_m15", "ぜんしょくぎょう マスター", "15の 職業を ぜんぶ マスター", () => J().mast.filter((x) => x !== "genius").length >= 15, 10000],
        ["t_gen", "🌈 天才", "天才の 職業に たどりつく", () => J().tried.includes("genius"), 20000],
        ["t_gen99", "かみさま レベル", "天才を マスター（職業Lv99）", () => J().mast.includes("genius"), 50000],
        ["t_abil", "わざ ずかん", "職業の わざを 20こ おぼえる", () => Object.keys(J().learned).filter((k) => J().learned[k]).length >= 20, 1500],
        ["t_abil2", "わざ コンプリート", "職業の わざを 50こ おぼえる", () => Object.keys(J().learned).filter((k) => /^J(0\d|1[0-5])/.test(k) && J().learned[k]).length >= 50, 6000],
        // おまけ
        ["t_diff", "ちょうせんしゃ", "むずかしさを ハードに する", () => G.S.diff === "hard", 300],
        ["t_cheat", "…ひみつを しっている ひと", "チートを つかってみる", () => !!(G.S.cx.god || G.S.cx.st999 || G.S.cx.onehit || G.S.cx.infmp || G.S.cx.noenc || G.S.expmul > 1), 0]
    ];
    return L.map((a) => ({id:a[0], n:a[1], d:a[2], f:a[3], g:a[4]}));
})();
const TQ_TITLE_BY = {}; TQ_TITLES.forEach((t) => { TQ_TITLE_BY[t.id] = t; });
function tqTi(){ const S = G.S; if(!S) return {got:{}, sel:""}; const t = (S.cx.ti = S.cx.ti || {got:{}, sel:""}); if(!t.got) t.got = {}; return t; }
function tqTitleCheck(quiet){
    if(!G.S || !G.S.cx) return [];
    const ti = tqTi(), out = [];
    TQ_TITLES.forEach((t) => {
        if(ti.got[t.id]) return;
        let ok = false; try{ ok = !!t.f(); }catch(_e){}
        if(ok){ ti.got[t.id] = 1; out.push(t); if(t.g) G.S.gold = Math.min(TQ_MAX_GOLD, G.S.gold + t.g); if(!ti.sel) ti.sel = t.id; }
    });
    if(out.length && !quiet && typeof toast === "function") toast("🏅 称号『" + out[0].n + "』を てにいれた！" + (out.length > 1 ? "（ほか " + (out.length - 1) + "こ）" : "") + (out.reduce((a, t) => a + t.g, 0) ? "　ごほうび " + out.reduce((a, t) => a + t.g, 0).toLocaleString() + "G" : ""));
    return out;
}
function tqTitleNow(){ const ti = tqTi(); const t = TQ_TITLE_BY[ti.sel]; return t ? t.n : ""; }
(function(){
    const _save = tqAutoSave;
    let busy = false;
    tqAutoSave = function(){ if(!busy && G.S){ busy = true; try{ tqTitleCheck(); }catch(e){ console.error("[title]", e); } busy = false; } return _save.apply(this, arguments); };
})();
function tqTitleView(){
    const ti = tqTi(); tqTitleCheck(true);
    const got = TQ_TITLES.filter((t) => ti.got[t.id]).length;
    let h = '<h2>🏅 しょうごう</h2><div class="card"><b>あつめた しょうごう：' + got + ' / ' + TQ_TITLES.length + '</b><div class="meta">もくひょうを たっせいすると もらえるよ。えらぶと なまえの よこに ついて ステータスに ひょうじ！</div>' +
        '<div class="meta">いま：' + (tqTitleNow() ? "『" + esc(tqTitleNow()) + "』" : "なし") + '</div>' + (ti.sel ? '<div class="row"><button class="btn sub" data-a="tiSel" data-v="">はずす</button></div>' : "") + '</div>';
    TQ_TITLES.forEach((t) => {
        const ok = !!ti.got[t.id];
        h += '<div class="card"' + (ok ? "" : ' style="opacity:.7"') + '><b>' + (ok ? "🏅 " + esc(t.n) : "🔒 ？？？") + '</b>' + (ti.sel === t.id ? ' <span class="okc">◀ つけている</span>' : "") + '<div class="meta">もくひょう：' + esc(t.d) + (t.g ? '　ごほうび ' + t.g.toLocaleString() + 'G' : "") + '</div>' + (ok && ti.sel !== t.id ? '<div class="row"><button class="btn" data-a="tiSel" data-v="' + t.id + '">つける</button></div>' : "") + '</div>';
    });
    return h;
}
ACT.tiSel = (v) => { tqTi().sel = v || ""; tqAutoSave(); render(); };


/* ==== game/replay-codes.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[22]=1;
"use strict";
// 追加チート／リプレイコードの「指紋」だけが入っています（コード本体は入っていません）。
const TQ_CHEAT2 = [["8dae1545af73c96d5eb8e65cbfa07d2dfe50f2bc28a47871508629bae8dcd437","x_jobmaster"],["7e855495f6cab7895de643b3b20ea9c5e42a7c8436f7695de7c84f8cf17de319","x_genius"],["754f457c853edf4d0b8378d4e4b17d55e159e69c31165a9edbc05bceeb086beb","x_joblv"],["1a68c3b78aab3654450633ee0e72b1dd11facd0f78489733a2f7e057e2d8ce75","x_jobreset"],["6c16d88babd64e8c2d78b4bbd940fd1c48fc7a3b2f8d04086c2950986386efa0","x_titleall"],["faf5cdeb727a682c9daf6c8867736e02a724ba9cfdcbf61a89c94628f19bfa9d","x_titlereset"],["e68d016380c9200abc9be97f7f18d85fc0f938752acd82807accfdace6fe1f83","x_crit"],["9b4c9aa48d833daab6a00650563165be85dfb08a083a095a503de1db83bb66b4","x_flee"],["e035facbf67230a1a0b46b5c2d117241e0acbe48442c3db07c35048bcd6231c3","x_scout"],["b4a41ccd2ad950c980d0faa61ebe7febf0f0b244432e074f8c4f37ebd4406028","x_gold3"],["0c9de0ef002deb319035cfeb2415e75a1991e276e91542cb02099de1d22040ce","x_exp3"],["e5465e2f972cf3416a1b1f2f2e2483a5b49834b143fa32d20c9504dd731fee01","x_gold1m"],["49264a81780b3338fb00ed1dc09a18b8f454210f32e6d0fd8b5d151ab847bce4","x_addexp"],["2f10fd5ff501af26a7906e6bb4d71af88df50d7420e501aaad3cb24856c0d5c7","x_lvup"],["51a543d4ed4c143d1fb7db6151eb2e939a9fb4b53e3e2357955dd922eb213048","x_lvdown"],["a15ecf33787c33711e585fc27d2346a2e8767bc64c00f31dd236ffd149c12999","x_unlock"],["f2cd70edd8517426d341954c978065bbfb7a83e4bcd63f1d92f30c1f20123c54","x_offg"],["8ac2a4657049209c6e85591dfc8937fa62a21364ad4d2f42955b191d21d156fd","x_warp"],["a748f9b25e638264d446e3d56445c64874cdbcbabf529ea624a3bd983dd3269f","rp_lab"],["aa3a9122997a1a404bd05692aac794db13d363d8f3ad4bf059c351d7e5a046f9","rp_sendai"],["f5a57bd827c702d3e93ba3f266894407e3ff28dcde20c5f8961586fde8a42660","rp_tokyo"],["f4a306fce6316cd9c698d02fc59285bec6acb9c63c9716448c9529120e8ff452","rp_white"],["485df3a5e864fd2eacde7a5558d8c7df38968e7e2824d56fc6d9b35e253e774b","rp_xmas"],["a5dec6e9bcc4f440bb674bea354eb1d458cadea14ef778d42423f0f3e959e887","rp_labn"],["fbfd503293f06ed002c350cfd3251580581a6f9a53f523592c8d46762c9f07f0","rp_future"],["6c17fefc1c6111884dc599b8c8172fbf93932702175ba4394414b4909d5d3abb","rp_n8"],["004ed2dd3855edba4c0f94a64bf6ac0f45cf1bba9feb05b758a46464fec04d44","rp_n9"],["0703654098ef5c1cb0a35deb5ca02bc27ce3e2662d0ed4a3b06358b22fe5ab5e","rp_n10"],["d3926fea04fd59528f817de3d816f192dd53b95686bf5f186cc8cf4c2715e522","rp_n11"],["29263ff5b9f286e90d2693ef881ad6e210322bb32303f16c0db654923c43d54f","rp_xr"]];
if(typeof TQ_CHEATS !== "undefined") TQ_CHEAT2.forEach((x) => TQ_CHEATS.push(x));


/* ==== game/extra2.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[23]=1;
"use strict";
// ===== あたらしい 初心者ガイド／リプレイコード／追加チート =====
// ※ チート・リプレイの「コードそのもの」は ここには ありません（指紋だけ。 → replay-codes.js）

// ---------------------------------------------------------------- こまったときは？（初心者ガイド）
function tqGuideView(){
    const S = G.S, f = S.f;
    const story = [
        [true, "🕰 ラボで ARE が あと少しで完成…でも 6つの『大事なメモリ』が ノイズに もちさられ、過去の世界に ちらばった！ ラボの『ゲート』から 過去へ とんで メモリを とりもどそう。"],
        [f.e_sendai, "🥩 2026年9月の ホシミ台：ノイズに なやむ 人たちを たすけて ① のメモリを ゲット。"],
        [f.e_tokyo, "🌃 2025年12月の 夜のアカリ市：ある開発者の ひみつに ふれて ② のメモリを ゲット。"],
        [f.e_white, "⬜ まっしろルーム：ふしぎな 部屋で ③ のメモリを ゲット。"],
        [f.e_xmas, "🎄 2028年12月25日：クリスマスの アカリ市で ④ のメモリを ゲット。"],
        [f.e_labn, "🌙 ARE が 生まれた 夜：若い アキトと ハルキに あって ⑤ のメモリを ゲット。"],
        [f.e_n8, "🌲 ノイズの深層：第1層〜第4層。ノイズの ひみつに せまる！"],
        [f.e_future, "🏙 2035年 ARE タワー：さいごの メモリを かけて ノイズの 王と たいけつ。ARE かんせい！"],
        [f.e_ep10, "🍂 追加エピソード 10月：ウォークラリーと がけ。"], [f.e_ep11, "🍁 追加エピソード 11月21日：おんがくの はくぶつかんと スマホの なぞ。"],
        [f.e_ep11b, "🧹 追加エピソード 11月22日：おおそうじと となりの さわぎ。"], [f.e_ep12, "🎄 追加エピソード 12月：キラキラ ラウンジの わな。"], [f.e_ep01, "🎂 追加エピソード 1月：22さいへの みち。"],
        [f.e_ks1, "🔮 烏坂探偵事務所①：うらない師と マジックの なぞ。"], [f.e_ks2, "🎭 烏坂探偵事務所②：ニセテストの なぞ。"], [f.e_ks3, "✉️ 烏坂探偵事務所③：マジックショーと てがみ。"], [f.e_ks4, "🎩 烏坂探偵事務所④：さいごの マジック。"], [f.e_ks5, "🏝 烏坂探偵事務所⑤：SP 丹羽鳥島の ひみつ。"],
        [f.e_yh5, "🦸 やりすぎヒーロー伝説 ①：第1〜5話（ちいさな ヒーローの はじまり〜勉強の まほう）。"], [f.e_yh10, "🦸 やりすぎヒーロー伝説 ②：第6〜10話（ちょうせんじょう〜ちこく しそうな 試験日）。"], [f.e_yh15, "🦸 やりすぎヒーロー伝説 ③：第11〜15話（マジック たいけつ〜ロボット紘）。"], [f.e_kn10, "🎡 コイヌネランド（本編・全10話）：タカシと ケンジの 夏の 1日と なぞとき。"], [f.e_wn10, "🐶 ワンコロランド（任意・全10話）：4人の 全制覇ミッション。"], [f.e_us10, "🐰 ウサウサランド（任意・全10話）：雨と 氷点下の 45アトラクション と 脱出ゲーム。"], [f.e_ssa_all, "🗺️ Map1サブ『コード・オブ・デスティニー』（20話）：アプリ開発の善悪と ふしぎな運命。"], [f.e_ssb_all, "🗺️ Map2サブ『リプレイワールド』（20話）：タイムスリップと あやしい さそいを 見やぶる。"], [f.e_ssc_all, "🗺️ Map3サブ『人生2周目』（20話）：予言少年 紘と さえこの 物語。"], [f.e_sse_all, "🗺️ Map5サブ『楽しい時ほど、大さんじ！？』（10話）：だいち・まひろ・あかりの 大さわぎ デート。"], [f.e_ssf_all, "🗺️ Map6サブ『人生おにハードモード』（10話）：眠杉の 一週間。"], [f.e_ssg_all, "🗺️ Map7サブ『職業せんたく』（10話）：拓也くんの しごと さがし。"], [f.e_ssh_all, "🗺️ Map8サブ『デビルバイト』（10話）：うまい 話に ご用心。"], [f.e_ssi_all, "🗺️ Map9サブ『うそはるの はじまり』（10話）：転売ヤーと うそはる。"], [f.e_ssj_all, "🗺️ Map10サブ『7日間の 星の子』（10話）：翔太と 美月の 7日間。"], [f.e_dk10, "📖 出来事（おまけ）：主人公の 秋の 日々と AREChat 運用開始。 これで ARE QUEST は 完！"],
        [f.e_yh20, "🌙 やりすぎヒーロー伝説 ④：第16〜20話（遊園地の かなしみ〜ありがとう ぜんぶの 物語）。15職業 Lv99、天才が ひらいた！"],
        [f.e_yh25, "🌟 やりすぎヒーロー伝説 番外編 ①：第21〜25話（ひみつの としょかん〜ほしぞら キャンプ）。"], [f.e_yh30, "🎓 やりすぎヒーロー伝説 番外編 ②：第26〜30話（おいしい ふしぎ キッチン〜ゆめの そつぎょうしき）。番外編 かんぜん せいは！"],
        [f.e_xr, "🥽 おまけ：XRアドベンチャー体験会。"]
    ].filter((x) => x[0]).map((x) => "・" + x[1]).join("\n");
    const faq = [
        ["どこへ 行けば いいか わからない", "メニュー →『メモリ・もくてき』の「🎯 いまの もくてき」を 見てね。いちばん たしかな ヒントだよ。"],
        ["ラボの『ゲート』って？", "ラボの かべぎわの ゲート（Gの マス）を しらべると、過去の 時代へ いけます。ゲートで ラボに もどることも できるよ。"],
        ["たたかいが つらい", "①レベルを あげる（メニュー→『⚡ じどう（オート）』で じどうレベル上げ）②おにぎりや そうびを ととのえる ③『🔧 なまえ・むずかしさ』で イージーモードに。いつでも かえられます。"],
        ["ゲームオーバーに なったら？", "ラボの ソファで めがさめるよ（ゴールドが 半分に なるだけ）。データは きえません。"],
        ["セーブは どうするの？", "メニュー →『📖 ぼうけんのしょ』。3つまで。メニューを とじるたびに じどうセーブも されるよ。"],
        ["仲間が ふえない", "ストーリーを すすめると なかまが くわわります。ラボの アキト・ハルキに 話しかけてみよう。"],
        ["職業って？", "地図1(ホシミ台)を クリアして レベル10になると『👔 てんしょく』で 15しゅるいの 職業に つける。職業で おぼえた わざは、ずっと つかえるよ。"],
        ["称号って？", "『🏅 しょうごう』。もくひょうを たっせいすると もらえて、ごほうびの ゴールドも もらえる！"],
        ["スマホで そうさが むずかしい", "画面の 十字ボタンと Aボタンで あそべます。『せってい』で パッドの ON/OFF も できるよ。"],
        ["あそびは いつ ふえるの？", "メニュー『🎪 追加コンテンツ』は すすめるほど ふえます。はじめから：プレゼントコード・ずかん・実績／地図1(ホシミ台)クリア：転職・クエスト／地図2(アカリ市)クリア：カジノ／地図3(運命開発ビル)クリア：牧場・スカウト・配合・転生・格闘場／本編クリア：強くてニューゲームなど。地図2・地図4のあとは、レベル上げや ゴールド稼ぎが しやすい モンスターも でてくるよ。"],
        ["レベルが あがると？", "HPと MPが ぜんかいふく します（ハードモードは かいふくしません）。"]
    ];
    let h = '<h2>❓ こまったときは</h2>' +
        '<div class="card"><b>🎯 いま やること</b><div>' + esc(tqObjective()) + '</div></div>' +
        '<div class="card"><b>📖 ここまでの ものがたり</b><div class="meta" style="white-space:pre-wrap">' + esc(story) + '</div></div>' +
        '<div class="card"><b>🎮 そうさ</b><div class="meta">いどう：矢印キー／WASD／十字ボタン　はなす・しらべる：Enter／Z／Aボタン　メニュー：X／M　もどる：Esc／X</div></div>';
    faq.forEach((q) => { h += '<div class="card"><b>Q. ' + esc(q[0]) + '</b><div class="meta">' + esc(q[1]) + '</div></div>'; });
    h += '<div class="card meta">くわしい てじゅんしょは <a href="https://arechat.github.io/ARE/help.html#rpg" target="_blank" rel="noopener noreferrer" style="color:#9fd0ff">help.html の「RPG 手順書」</a> に あります。</div>';
    return h;
}
(function(){
    const _h = helpText;
    helpText = function(){
        return _h.apply(this, arguments) + "\n\n【はじめての 人へ】\n・ゲームを はじめたら ラボの アキトと ハルキに 話しかけよう。\n・こまったら メニュー →『❓ こまったときは』。いま やることが わかるよ。\n・たたかいが つらい ときは『🔧 なまえ・むずかしさ』で イージーに！\n・クリアすると タイトルに『🔁 リプレイコード』が でるよ。\n・くわしい 手順書は help.html の『RPG 手順書』。";
    };
})();

// ---------------------------------------------------------------- リプレイコード（クリア後の せかいを ひとあしさきに たいけん）
// コードの 指紋は replay-codes.js。いまの 画面には「名前」だけ ならぶ。
const TQ_REPLAYS = [
    {id:"rp_lab", n:"🏠 ARE かいはつラボ（クリア後）", era:null, map:"lab", pos:[8, 9], lv:40},
    {id:"rp_sendai", n:"🥩 2026年9月 ホシミ台（クリア後）", era:"sendai", lv:25},
    {id:"rp_tokyo", n:"🌃 夜のアカリ市（クリア後）", era:"tokyo", lv:30},
    {id:"rp_white", n:"⬜ まっしろルーム（クリア後）", era:"white", lv:34},
    {id:"rp_xmas", n:"🎄 クリスマスのアカリ市（クリア後）", era:"xmas", lv:38},
    {id:"rp_labn", n:"🌙 ARE 誕生の夜（クリア後）", era:"labn", lv:42},
    {id:"rp_future", n:"🏙 2035年 ARE タワー（クリア後）", era:"future", lv:50},
    {id:"rp_n8", n:"🌲 第1層 ノイズの森（クリア後）", era:"n8", lv:55},
    {id:"rp_n9", n:"🌊 第2層 ノイズの海ぞこ（クリア後）", era:"n9", lv:62},
    {id:"rp_n10", n:"🏰 第3層 サーバー城（クリア後）", era:"n10", lv:70},
    {id:"rp_n11", n:"👑 第4層 ノイズ王国（クリア後）", era:"n11", lv:80},
    {id:"rp_xr", n:"🥽 XRアドベンチャー体験会（クリア後）", era:"xr", lv:85}
];
function tqEverCleared(){
    try{ if(localStorage.getItem("tq_cleared") === "1") return true; }catch(_e){}
    for(let i = 1; i <= TQ_SLOTS; i++){ const r = tqReadSlot(i); if(r && !r.corrupted && r.data && r.data.f && r.data.f.e_future){ try{ localStorage.setItem("tq_cleared", "1"); }catch(_e){} return true; } }
    return false;
}
// クリアしたら 覚えておく（セーブを けしても リプレイコードは のこる）
(function(){
    const _a = tqAutoSave;
    tqAutoSave = function(){ try{ if(G.S && G.S.f && G.S.f.e_future) localStorage.setItem("tq_cleared", "1"); }catch(_e){} return _a.apply(this, arguments); };
})();
(function(){
    const _t = viewTitle;
    viewTitle = function(){
        let h = _t.apply(this, arguments);
        if(tqEverCleared()) h = h.replace('<button class="opt" data-a="tCheat">', '<button class="opt" data-a="tReplay">🔁 リプレイコード</button><button class="opt" data-a="tCheat">');
        return h;
    };
    const _fv = fieldView;
    fieldView = function(){ if(G.mode === "replay") return viewReplay(); return _fv.apply(this, arguments); };
})();
function tqReplayFlags(){
    const set = {}; const walk = (x) => { if(Array.isArray(x)){ if(x[0] === "set" && typeof x[1] === "string") set[x[1]] = 1; x.forEach(walk); } else if(x && typeof x === "object") Object.keys(x).forEach((k) => walk(x[k])); };
    walk(RPG_EV); return Object.keys(set);
}
function viewReplay(){
    const sel = G.rpSel && TQ_REPLAYS.find((r) => r.id === G.rpSel);
    let h = '<div class="win panel scroll"><h2>🔁 リプレイコード</h2>';
    if(!sel){
        h += '<div class="meta" style="margin-bottom:1cqw">どの リプレイコードを 使用しますか？（クリア後の せかいを ひとあしさきに たいけん！）</div>';
        TQ_REPLAYS.forEach((r) => { h += '<button class="opt" data-a="rpPick" data-v="' + r.id + '">' + esc(r.n) + '</button>'; });
        h += '<div class="row" style="margin-top:1cqw"><button class="btn sub" data-a="rpBack">もどる</button></div>';
    }else{
        h += '<div class="meta">「' + esc(sel.n) + '」を はじめます。どの 冒険の書に 記録しますか？（ここに ある データは 上書きされます）</div><div class="slots">';
        for(let i = 1; i <= TQ_SLOTS; i++){
            const r = tqReadSlot(i);
            h += '<div class="slot pick"><b>冒険の書 ' + i + '</b>' + (!r ? '<div class="meta" style="margin:2cqw 0">— あきわく —</div>' : r.corrupted ? '<div class="err">読み込めません</div>' : '<div class="meta">' + esc(r.name) + '　Lv' + r.data.lv + '</div>') + '<button class="btn" data-a="rpGo" data-v="' + i + '">ここに きろく</button></div>';
        }
        h += '</div><div class="row"><button class="btn sub" data-a="rpNo">べつの コードに する</button></div>';
    }
    return h + '</div>';
}
ACT.tReplay = () => { G.rpSel = null; G.mode = "replay"; render(); };
ACT.rpBack = () => { G.mode = "title"; render(); };
ACT.rpNo = () => { G.rpSel = null; render(); };
ACT.rpPick = (v) => { G.rpSel = v; render(); };
ACT.rpGo = (v) => {
    const i = Number(v), r = tqReadSlot(i);
    const go = (nm) => { const res = tqReplayStart(G.rpSel, i, nm); if(!res.ok){ toast(res.msg); } };
    let nm = "リプレイ"; for(let k = 1; k <= TQ_SLOTS; k++){ const x = tqReadSlot(k); if(x && !x.corrupted && x.data && x.data.name){ nm = x.data.name; break; } }
    if(r && !r.corrupted){ askConfirm("冒険の書 " + i + " を 上書きして はじめます。よろしいですか？", () => go(nm)); }
    else go(nm);
};
function tqReplayStart(id, slot, name){
    const rp = TQ_REPLAYS.find((x) => x.id === id); if(!rp) return {ok:false, msg:"そのリプレイは ありません。"};
    let prof = {name, sex:"m", pers:{name:"リプレイ", bonus:{}}};
    for(let k = 1; k <= TQ_SLOTS; k++){ const x = tqReadSlot(k); if(x && !x.corrupted && x.data && x.data.prof && x.data.f && x.data.f.e_future){ prof = JSON.parse(JSON.stringify(x.data.prof)); name = x.data.name || name; break; } }
    prof.name = name;
    const S = tqNewState(prof);
    G.S = S; G.slot = slot; G.saveName = name + "の リプレイ";
    tqReplayFlags().forEach((k) => { S.f[k] = 1; });
    ["e_sendai", "e_tokyo", "e_white", "e_xmas", "e_labn", "e_future", "intro_done", "xr_open", "e_n8", "e_n9", "e_n10", "e_n11"].forEach((k) => { S.f[k] = 1; });
    if(rp.id !== "rp_xr") delete S.f.e_xr;   // XRだけ 「はじめて」 を のこす
    S.mem = [1, 1, 1, 1, 1, 1]; S.cx.allgate = true; S.cx.replay = id;
    ["haruki", "akito", "kaito"].forEach((m) => { try{ tqAddMember(m, true); }catch(_e){} });
    S.lv = rp.lv; S.exp = 0; S.gold = 50000;
    ["w6", "a6", "c4"].forEach((k) => { if(RPG_EQUIP[k]){ if(!S.own.includes(k)) S.own.push(k); S.eq[RPG_EQUIP[k].slot] = k; } });
    S.items.onigiri = 20; S.items.coffee = 10;
    tqHealAll(); G.scripts = []; G.b = null; G.auto = false; G.grind = null; G.draft = null; G.rpSel = null;
    tqSaveTo(slot, G.saveName);
    enterGame("");
    const e = rp.era ? RPG_ERAS.find((x) => x.id === rp.era) : null;
    const map = e ? e.map : rp.map, pos = e ? e.pos : rp.pos;
    G.scripts.length = 0; G.mode = "map"; gotoMap(map, pos[0], pos[1]); G.info = "🔁 リプレイ：「" + rp.n + "」から はじまったよ！（Lv" + S.lv + "）"; tqAutoSave(); render();
    return {ok:true};
}
function askConfirm(text, fn){ if(typeof askYes === "function") askYes(text, fn); else if(confirm(text)) fn(); }

// ---------------------------------------------------------------- 追加チート（指紋は replay-codes.js）
(function(){
    const _ac = _tqApplyBase;
    const NG = ["gcrit", "gflee", "gscout", "ggold", "gexp"];
    _tqApplyBase = function(raw){
        const f = tqFindCheat(raw);
        if(!f) return _ac.apply(this, arguments);
        if(/^rp_/.test(f.id)){
            if(G.S) return {ok:false, msg:"リプレイコードは タイトル画面の『チート』から 入れてね。（今の データを まもるため）"};
            G.rpSel = f.id; G.mode = "replay"; return {ok:true, msg:"🔁 リプレイコード かくにん！ 記録する 冒険の書を えらんでね。"};
        }
        if(!/^x_/.test(f.id)) return _ac.apply(this, arguments);
        if(!G.S) return _ac.apply(this, arguments);   // queue 側で処理
        const S = G.S, c = S.cx; let msg = "";
        const all = () => TQ_JOBS.filter((d) => !d.genius);
        switch(f.id){
            case "x_jobmaster": { const j = tqJ(); all().forEach((d) => { if(!j.mast.includes(d.id)) j.mast.push(d.id); j.best[d.id] = 99; if(!j.tried.includes(d.id)) j.tried.push(d.id); d.abil.forEach((a) => { j.learned[a.id] = 1; }); }); msg = "15の 職業を ぜんぶ マスターした！ …ふしぎな 力が めざめそう…"; break; }
            case "x_genius": { const j = tqJ(); all().forEach((d) => { if(!j.mast.includes(d.id)) j.mast.push(d.id); j.best[d.id] = 99; if(!j.tried.includes(d.id)) j.tried.push(d.id); d.abil.forEach((a) => { j.learned[a.id] = 1; }); }); if(S.lv < 10) tqSetLevel(10); const r = tqJobChange("genius"); msg = r.msg; break; }
            case "x_joblv": { const j = tqJ(); const d = TQ_JOB_BY[j.cur]; if(!d) return {ok:false, msg:"いま 職業に ついていません。"}; if(!(f.nums[0] >= 1 && f.nums[0] <= 99)) return {ok:false, msg:"職業レベルは 1〜99 です。"}; j.jlv = f.nums[0]; j.jexp = 0; d.abil.forEach((a) => { if(j.jlv >= a.lv) j.learned[a.id] = 1; }); if(j.jlv >= 99 && !j.mast.includes(d.id)) j.mast.push(d.id); j.best[d.id] = Math.max(j.best[d.id] || 0, j.jlv); msg = "職業レベルが " + j.jlv + " に なった！"; break; }
            case "x_jobreset": S.job = {}; tqJ(); tqClamp(); msg = "職業の データを まっさらに もどした。"; break;
            case "x_titleall": { const t = tqTi(); TQ_TITLES.forEach((x) => { t.got[x.id] = 1; }); msg = "しょうごうが ぜんぶ てにはいった！（" + TQ_TITLES.length + "こ）"; break; }
            case "x_titlereset": S.cx.ti = {got:{}, sel:""}; msg = "しょうごうを まっさらに もどした。"; break;
            case "x_crit": msg = tqToggle("gcrit", "いつでも かいしん"); break;
            case "x_flee": msg = tqToggle("gflee", "いつでも にげられる"); break;
            case "x_scout": msg = tqToggle("gscout", "スカウト 100%"); break;
            case "x_gold3": msg = tqToggle("ggold", "ゴールド ×3"); break;
            case "x_exp3": msg = tqToggle("gexp", "経験値 ×3"); break;
            case "x_gold1m": S.gold = Math.min(TQ_MAX_GOLD, S.gold + 1000000); msg = "1,000,000G を てにいれた！"; break;
            case "x_addexp": { if(!(f.nums[0] > 0)) return {ok:false, msg:"経験値を 指定してください。"}; const u = tqGain(f.nums[0]); msg = f.nums[0].toLocaleString() + "EXP を てにいれた！" + (u.length ? "\n" + u.join("\n") : ""); break; }
            case "x_lvup": { if(!(f.nums[0] > 0)) return {ok:false, msg:"あげる レベルを 指定してください。"}; tqSetLevel(Math.min(99, S.lv + f.nums[0])); msg = "レベルが " + S.lv + " に なった！"; break; }
            case "x_lvdown": { if(!(f.nums[0] > 0)) return {ok:false, msg:"さげる レベルを 指定してください。"}; tqSetLevel(Math.max(1, S.lv - f.nums[0])); msg = "レベルが " + S.lv + " に なった。"; break; }
            case "x_unlock": c.allgate = true; S.f.xr_open = 1; msg = "ゲートの 行き先が ぜんぶ ひらいた！（ストーリーは そのまま）"; break;
            case "x_offg": NG.forEach((k) => { c[k] = false; }); msg = "天才の ちから（ON/OFF）を ぜんぶ OFF に した。"; break;
            case "x_warp": { const e = RPG_ERAS.find((x) => x.id === TQ_WARP_IDS[f.nums[0]]); if(!e) return {ok:false, msg:"そんな 行き先は ありません。"}; G.scripts.length = 0; gotoMap(e.map, e.pos[0], e.pos[1]); msg = e.n + " へ ワープ！"; break; }
            default: return _ac.apply(this, arguments);
        }
        try{ tqTitleCheck(true); }catch(_e){}
        tqAutoSave(); return {ok:true, msg};
    };
})();
const TQ_WARP_IDS = {1:"sendai", 2:"tokyo", 3:"white", 4:"xmas", 5:"labn", 6:"future", 7:"n8", 8:"n9", 9:"n10", 10:"n11", 11:"xr"};
// 「off」で 天才の ちからも きれる
(function(){
    const _ac = _tqApplyBase;
    _tqApplyBase = function(raw){ const r = _ac.apply(this, arguments); try{ const f = tqFindCheat(raw); if(f && f.id === "off" && G.S) ["gcrit", "gflee", "gscout", "ggold", "gexp"].forEach((k) => { G.S.cx[k] = false; }); }catch(_e){} return r; };
})();


/* ==== game/episodes.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[24]=1;
"use strict";
// ===== 追加エピソード：2026年10月〜2027年1月（「未来予知VS迷惑ボーイ」をもとにした おはなし）=====
// 本編クリア後に、ラボのゲートから 順番に ひらきます。
//   ① 2026年10月 ウォークラリーと がけ　② 2026年11月21日 おんがくの はくぶつかんと スマホの なぞ
//   ③ 2026年11月22日 おおそうじと となりの さわぎ　④ 2026年12月 キラキラ ラウンジの わな　⑤ 2027年1月 22さいへの みち
// ※ 虫・ヘビ・ねずみ などの 場面は ありません。ぶきは ぜんぶ おもちゃ・みずでっぽう などに おきかえています。

Object.assign(RPG_LOOKS, {
    magician:{skin:"#f3cfae", hair:"#111", style:"cap", top:"#5b2a86", bot:"#1b1b27", acc:"tie"},
    kota:{skin:"#eebf98", hair:"#3a2a1a", style:"short", top:"#6b7280", bot:"#374151", acc:"glasses"},
    hiroki:{skin:"#f3cfae", hair:"#111", style:"short", top:"#1b1b27", bot:"#1b1b27", acc:"tie"},
    reiyamama:{skin:"#f9d9bd", hair:"#7a5a8a", style:"bun", top:"#e8b4c8", bot:"#6a4a7a", acc:"none"},
    doctor:{skin:"#f9d9bd", hair:"#2a1a14", style:"bob", top:"#ffffff", bot:"#b0c4de", acc:"glasses"},
    stamp:{skin:"#f9d9bd", hair:"#e07a1f", style:"cap", top:"#ffb703", bot:"#2b3a67", acc:"none"}
});
Object.assign(TQ_PORTRAIT_LOOK, {"手品師マジック":"magician", "耕太":"kota", "弘樹":"hiroki", "玲也の お母さん":"reiyamama", "先生":"doctor", "スタンプ係":"stamp", "花音":"kanon", "良太":"ryota", "雄介":"yusuke", "優花":"yuka", "美優":"miyu", "隼人":"hayato", "七海":"nanami"});
Object.assign(TQ_PORTRAIT_IMG, {"弘樹":"yuzai"});

// ---- ボス（絵は reiya.webp / yuzai.webp）
(function(){
    const mk = (id, name, emo, img, lv, acts, extra) => {
        RPG_FOES[id] = rpgE(name, emo, 10, 5, 1, 1, 1, acts, Object.assign({boss:true, spar:true}, img ? {img} : {}, extra || {}));
        const st = tqBossStat(lv); st.exp = Math.round(st.exp * 0.8); st.g = Math.round(st.g * 5); Object.assign(RPG_FOES[id], st, {bossLv:lv});
    };
    mk("ep10_reiya", "迷惑ボーイ 玲也", "😈", "reiya", 58, [["しつこい チラシ ふぶき", 1, 0.9, 0.9], ["めいわく ダッシュ", 0, 1, 1.3], ["おしうり トーク", 0, 0.7, 1.7]], {say50:"玲也「勧誘は 営業と おなじだって 言ってるだろ〜！」"});
    mk("ep11_reiya", "スマホどろぼう 玲也", "📱", "reiya", 60, [["スマホ ひったくり", 0, 1, 1.3], ["おくじょう ダッシュ", 0, 0.8, 1.2], ["いいわけ マシンガン", 1, 0.8, 1.5]], {say50:"玲也「ちょっと 借りてただけだって〜！ …たぶん！」"});
    mk("ep11_kota", "ごまかしノイズ・耕太", "🕶️", null, 62, [["ことばの めくらまし", 1, 0.9, 0.9], ["しりょう かくし", 0, 1, 1.3], ["おおさわぎ アピール", 0, 0.7, 1.8]], {say50:"耕太「ち、ちがう！ ぼくは なにも…！ …あ、でも あの しりょうだけは…」"});
    mk("ep12_hiroki", "キラキラ 弘樹", "💎", "yuzai", 64, [["ひゃくまんボルトの えがお", 1, 0.9, 0.9], ["たかい せいきゅうしょ", 0, 1, 1.3], ["ごうかな ちょうはつ", 0, 0.7, 1.8]], {say50:"弘樹「きみたち、お金の 話は ちゃんと しないとね。ふふ。」"});
    mk("ep01_reiya", "みずでっぽう 玲也", "🔫", "reiya", 66, [["みずでっぽう らんしゃ", 1, 0.9, 0.9], ["べっそう ダッシュ", 0, 1, 1.3], ["ミルクティー ぶんぶん", 0, 0.7, 1.9]], {say50:"玲也「これは ただの おもちゃだ〜！ ぬれても しらないぞ〜！」"});
    mk("ep01_boy", "つきまとい ノイズ", "👿", null, 65, [["しつこい メッセージ", 1, 0.9, 0.9], ["ぐいぐい ダッシュ", 0, 1, 1.3], ["いいわけ ノイズ", 0, 0.7, 1.7]], {say50:"ノイズ「おれは ただ 話を したいだけだ！」"});
})();

// ---- 地図
function epMap(name, tint, rows, objs, startPos){
    return {name, tint, start:startPos || [9, 10], enc:null, rows, tev:{G:["gate_back", 1], b:["seat"]}, objs};
}
const EP10_ROWS = rpgMk(18, 12, ".", [["b", "T"], ["r", 1, 5, 16, 2, ","], ["r", 8, 1, 2, 10, ","], ["r", 12, 7, 5, 4, "~"], ["r", 11, 1, 6, 1, "#"], ["r", 2, 1, 4, 1, "H"], ["r", 2, 2, 4, 2, "h"],
    ["p", 3, 3, "D"], ["p", 3, 8, "f"], ["p", 6, 8, "f"], ["p", 5, 3, "f"], ["p", 9, 11, "G"]]);
const EP11_ROWS = rpgMk(18, 12, "w", [["b", "Q"], ["r", 2, 2, 3, 2, "L"], ["r", 7, 2, 3, 2, "L"], ["r", 12, 2, 3, 2, "L"], ["r", 2, 7, 4, 3, "c"], ["r", 12, 7, 4, 3, "c"], ["p", 3, 8, "b"], ["p", 14, 8, "b"], ["p", 1, 10, "p"], ["p", 16, 10, "p"], ["p", 9, 11, "G"]]);
const EP11B_ROWS = rpgMk(18, 12, "=", [["b", "#"], ["r", 1, 1, 7, 4, "="], ["r", 10, 1, 7, 4, "w"], ["r", 8, 1, 1, 4, "#"], ["p", 8, 3, "D"], ["r", 3, 7, 3, 2, "L"], ["p", 14, 8, "b"], ["p", 16, 10, "p"], ["p", 2, 10, "p"], ["p", 9, 11, "G"]]);
const EP12_ROWS = rpgMk(18, 12, "n", [["b", "m"], ["r", 2, 2, 4, 3, "N"], ["r", 12, 2, 4, 3, "N"], ["r", 7, 2, 4, 3, "c"], ["r", 4, 7, 10, 2, "c"], ["p", 5, 5, "f"], ["p", 13, 5, "f"], ["p", 2, 8, "p"], ["p", 15, 8, "p"], ["p", 9, 11, "G"]]);
const EP01_ROWS = rpgMk(18, 12, "S", [["b", "t"], ["r", 1, 1, 6, 4, "w"], ["r", 10, 1, 7, 4, "s"], ["r", 7, 2, 3, 1, "w"], ["r", 13, 7, 3, 2, "i"], ["r", 3, 7, 3, 3, "r"], ["p", 14, 5, "t"], ["p", 9, 11, "G"]]);
const NPC = (id, x, y, look, name, ev, o) => Object.assign({k:"npc", id, x, y, look, name, ev}, o || {});
Object.assign(RPG_MAPS, {
    ep10:epMap("2026年10月 ミドリ新都心・カワベ", "rgba(255,200,120,0.08)", EP10_ROWS, [
        NPC("e10_kanon", 5, 9, "kanon", "花音", "ep10_kanon"), NPC("e10_ryota", 7, 9, "ryota", "良太", "ep10_ryota"),
        NPC("e10_fly", 9, 4, "reiya", "玲也", "ep10_flyer", {hide:"ep10_a"}),
        NPC("e10_mama", 3, 5, "reiyamama", "玲也の お母さん", "ep10_mama", {show:"ep10_a"}),
        NPC("e10_st1", 5, 7, "stamp", "スタンプ係", "ep10_s1", {show:"ep10_b"}), NPC("e10_st2", 11, 5, "stamp", "スタンプ係", "ep10_s2", {show:"ep10_b"}), NPC("e10_st3", 14, 4, "stamp", "スタンプ係", "ep10_s3", {show:"ep10_b"}),
        NPC("e10_mag", 14, 2, "magician", "手品師マジック", "ep10_magic", {show:"ep10_b"})]),
    ep11:epMap("2026年11月21日 おんがくの はくぶつかん", "rgba(180,200,255,0.08)", EP11_ROWS, [
        NPC("e11_yuka", 5, 9, "yuka", "優花", "ep11_yuka"), NPC("e11_guide", 4, 5, "citizenF", "はくぶつかんの 案内人", "ep11_guide"),
        NPC("e11_cafe", 14, 9, "mina", "カフェの 店員さん", "ep11_cafe", {show:"ep11_a"}), NPC("e11_rei", 15, 5, "reiya", "玲也", "ep11_rei", {show:"ep11_b"}),
        NPC("e11_mama", 9, 6, "reiyamama", "玲也の お母さん", "ep11_mama", {show:"ep11_c"})]),
    ep11b:epMap("2026年11月22日 優花の おへや と となりの いえ", "rgba(255,230,180,0.08)", EP11B_ROWS, [
        NPC("e11b_yuka", 4, 6, "yuka", "優花", "ep11b_yuka"), NPC("e11b_boxes", 5, 9, "citizen", "となりの 住人", "ep11b_neighbor", {show:"ep11b_a"}),
        NPC("e11b_kota", 13, 5, "kota", "耕太", "ep11b_kota", {show:"ep11b_a"}), NPC("e11b_clue1", 12, 2, "citizenF", "ほこりの かげ", "ep11b_c1", {show:"ep11b_a"}),
        NPC("e11b_clue2", 3, 3, "kid", "すみっこ", "ep11b_c2", {show:"ep11b_a"})]),
    ep12:epMap("2026年12月 キラキラ ラウンジ", "rgba(60,30,90,0.25)", EP12_ROWS, [
        NPC("e12_miyu", 6, 9, "miyu", "美優", "ep12_miyu"), NPC("e12_hayato", 8, 9, "hayato", "隼人", "ep12_hayato"),
        NPC("e12_nanami", 7, 5, "nanami", "七海", "ep12_nanami"), NPC("e12_hiroki", 9, 3, "hiroki", "弘樹", "ep12_hiroki", {show:"ep12_a"}),
        NPC("e12_pol", 15, 9, "citizen", "おまわりさん", "ep12_police", {show:"ep12_c"})]),
    ep01:epMap("2027年1月 びょういん と ゆきの まち", "rgba(200,220,255,0.12)", EP01_ROWS, [
        NPC("e01_doc", 3, 3, "doctor", "先生", "ep01_doc"), NPC("e01_hana", 12, 5, "hana", "羽奈", "ep01_hana", {show:"ep01_a"}),
        NPC("e01_boy", 14, 8, "citizen", "つきまとい ノイズ", "ep01_boy", {show:"ep01_b"}), NPC("e01_rei", 8, 8, "reiya", "玲也", "ep01_rei", {show:"ep01_c"}),
        NPC("e01_cake", 8, 6, "mina", "ケーキやさん", "ep01_cake", {show:"ep01_d"})])
});
Object.assign(RPG_ENTER, {ep10:"ep10_enter", ep11:"ep11_enter", ep11b:"ep11b_enter", ep12:"ep12_enter", ep01:"ep01_enter"});
RPG_ERAS.push(
    {id:"ep10", n:"追加：2026年10月 ウォークラリーと がけ〔推奨Lv58〕", map:"ep10", pos:[9, 10], done:"e_ep10", req:"e_future"},
    {id:"ep11", n:"追加：2026年11月21日 おんがくの はくぶつかん〔推奨Lv60〕", map:"ep11", pos:[9, 10], done:"e_ep11", req:"e_ep10"},
    {id:"ep11b", n:"追加：2026年11月22日 おおそうじと となりの さわぎ〔推奨Lv62〕", map:"ep11b", pos:[9, 10], done:"e_ep11b", req:"e_ep11"},
    {id:"ep12", n:"追加：2026年12月 キラキラ ラウンジの わな〔推奨Lv64〕", map:"ep12", pos:[9, 10], done:"e_ep12", req:"e_ep11b"},
    {id:"ep01", n:"追加：2027年1月 22さいへの みち〔推奨Lv66〕", map:"ep01", pos:[9, 10], done:"e_ep01", req:"e_ep12"}
);
(function(){ const xe = RPG_ERAS.find((e) => e.id === "xr"); if(xe){ RPG_ERAS.splice(RPG_ERAS.indexOf(xe), 1); RPG_ERAS.push(xe); } })();

// ---- お話
const EP_SETM = (a, b) => rpgM("[[" + a + "|" + (b || a) + "]]");
Object.assign(RPG_EV, {
    // ================= ① 2026年10月 ウォークラリーと がけ =================
    ep10_enter:[["if", "!ep10_in", [["set", "ep10_in"],
        rpgN("2026年10月10日。ミドリ新都心の 広場には、ウォークラリーの 準備で たくさんの 人が あつまっていた。"),
        rpgS("花音", "{名前}{くん}！ こっち こっち！ きょうは 町じゅうを あるいて スタンプを あつめる イベントだよ！"),
        rpgS("良太", "でも ちょっと 気に なる ことが ある。…また『あの人』が 広場で 勧誘してるんだ。"),
        rpgN("（まずは 広場の まんなかに いる 玲也に 話しかけてみよう）")], []]],
    ep10_kanon:[["if", "ep10_b", [rpgS("花音", "スタンプは 3つ！ ふれあい広場、ひだまりの 丘、川の ほとり だよ。")], [rpgS("花音", "まずは 広場の 玲也くんを なんとか しなきゃ！")]]],
    ep10_ryota:[["if", "ep10_b", [rpgS("良太", "ゴールは 丘の うえの がけの 展望台だって。きれいな けしきが 見えるらしい！")], [rpgS("良太", "玲也は 「勧誘は 営業と おなじだ」って 言い張ってるんだ…。")]]],
    ep10_flyer:[
        rpgS("玲也", "やぁ！ 君たち、ARE より もっと おトクな ひみつの アプリを 知りたく ない？ いまなら 無料！ さらに おまけ！"),
        EP_SETM("玲也、勧誘は 相手が きもちよく 聞いてくれて はじめて 営業なんだ。いやがる 人に しつこく 話すのは、ただの めいわく だよ。", "玲也くん、勧誘は 相手が きもちよく 聞いてくれて はじめて 営業なんだよ。いやがる 人に しつこく 話すのは、ただの めいわくだよ。"),
        rpgS("玲也", "うぐっ…！ …で、でも 営業は 営業 だ！ 文句が あるなら ウチに 来て 話を 聞け！"),
        rpgN("玲也は チラシを ばらまいて 走って いった。"),
        rpgS("花音", "あ、ほんとに 家に 行く 気？ …いってみよっか。"), ["set", "ep10_a"],
        rpgN("（広場の 左上に ある 木の おうち が 玲也の 家だ。お母さんに 相談してみよう）")],
    ep10_mama:[["if", "ep10_b", [rpgS("玲也の お母さん", "ありがとう。あの子、悪気は ないんだけど…。ウォークラリー、楽しんで きてね。")],
        [rpgS("玲也の お母さん", "あら、いらっしゃい。玲也の ことで 来たのね？ …ごめんなさいね、あの子 すぐ 夢中に なって。"),
         rpgN("そのとき、窓の むこうが ぴかっと 赤く ひかった！"),
         rpgS("良太", "ひ、火事 かも！？ 大変だ、みんな 外へ…！"),
         EP_SETM("まって、あわてないで。…よく 見てみて。あれは 火の ゆらめきじゃ なくて、窓に 夕日が 反射してる だけだよ。", "まって、あわてないで。…よく 見てみて。あれは 火の ゆらめきじゃ なくて、窓に 夕日が はんしゃ してる だけだよ。"),
         rpgS("玲也の お母さん", "まぁ、ほんとう。すごい 観察力 ね。…玲也は ウォークラリーの 参加者で、午後に がけの 展望台へ 行く はず。止めて あげて くれる？"),
         rpgN("洞察力で ひとさわぎを 防いだ！"), ["set", "ep10_b"],
         rpgN("（スタンプ係が 3人 あらわれた。3つ あつめて 展望台の 手品師マジックに 話しかけよう）")]]],
    ep10_s1:[["if", "ep10_s1", [rpgS("スタンプ係", "ポン！ もう 押したよ。")], [rpgS("スタンプ係", "ふれあい広場の スタンプ、ポン！"), rpgN("スタンプを 1つ あつめた（1/3）"), ["set", "ep10_s1"]]]],
    ep10_s2:[["if", "ep10_s2", [rpgS("スタンプ係", "ポン！ もう 押したよ。")], [rpgS("スタンプ係", "ひだまりの 丘の スタンプ、ポン！"), rpgN("スタンプを 1つ あつめた"), ["set", "ep10_s2"]]]],
    ep10_s3:[["if", "ep10_s3", [rpgS("スタンプ係", "ポン！ もう 押したよ。")], [rpgS("スタンプ係", "川の ほとりの スタンプ、ポン！ …あれ？ きみ、案内人の 腕章は？"), rpgS("花音", "{名前}{くん}は 案内人の 助っ人 なんです！ 雄介さんと 交代で ついて きて くれてて。"), rpgN("スタンプを 1つ あつめた"), ["set", "ep10_s3"]]]],
    ep10_magic:[["if", "e_ep10", [rpgS("手品師マジック", "いい 見せものだったでしょ？ またね。")],
        [["if", "ep10_s1&ep10_s2&ep10_s3",
        [rpgS("手品師マジック", "スタンプ コンプリート！ ようこそ、がけの 展望台へ。"),
         rpgN("展望台の はしに、見なれた 後ろすがたが 立っている。"),
         rpgS("玲也", "ふっふっふ…。ここまで 来たか！ おれの 勧誘を 止めるなら、この がけで 決着を つけようぜ！"),
         rpgS("手品師マジック", "おっと。ケンカは よして。…そうだ、ちょうど いい 手品が ある。みんなの 前で やってみせよう！"),
         rpgN("手品師が 手を ひとふり すると、{名前}の 手首に『おもちゃの 手錠』が かかった！"),
         rpgS("良太", "わっ！ {名前}{くん}が がけから…！ ……あれ？ ひも付きの ふわふわ マットが 下に 見える。"),
         EP_SETM("だいじょうぶ！ これは 手品の ショーなんだ。（がけから おちる ふりを しただけ！）", "だいじょうぶ！ これは 手品の ショーなんだよ。（がけから おちる ふりを しただけ！）"),
         rpgS("玲也", "な、なんだ ショーか…！ ほっとしたぞ。…って、ちがう！ おれと 勝負しろ〜！ （おもちゃの ゴムの つるぎを ふりまわす）"),
         ["battle", ["ep10_reiya"], [
            rpgS("玲也", "ま、まいった…。勧誘は 相手の きもちを 考えて、だな…。"),
            rpgS("手品師マジック", "はい、これで ショーは おしまい。玲也くんも ちょっと 反省かな？"),
            rpgS("玲也", "…わかったよ。もう しつこい 勧誘は しない。ほんとうに 聞きたい 人にだけ、話す。約束だ。"),
            rpgN("玲也は 手錠を はずされ、おまわりさんに 注意だけ されて 帰って いった。（無罪 ほうめん！）"),
            rpgS("花音", "みんな ケガ なくて よかったね！ ゴールの ごほうびも もらいに いこう！"),
            ["gold", 20000], ["item", "special", 5], ["item", "omamori", 2], rpgN("20000G と スペシャルおにぎり 5こ・ふっかつのおまもり 2こ を てにいれた！"),
            ["set", "e_ep10"], ["run", "lab_ret_go"]]]],
        [rpgS("手品師マジック", "スタンプは ぜんぶ あつめたかな？ あつめて から おいで。")]]]]],
    // ================= ② 2026年11月21日 おんがくの はくぶつかん =================
    ep11_enter:[["if", "!ep11_in", [["set", "ep11_in"],
        rpgN("2026年11月21日。優花に さそわれて、さいたまの おんがくと お金の はくぶつかん（ぞうへいきょく はくぶつかん）へ やって きた。"),
        rpgS("優花", "{名前}{くん}、来てくれて ありがとう！ ここ、むかしの コインや 記念メダルが たくさん あって 大すき なの！"),
        rpgN("（まずは 案内人さんの 話を 聞いてみよう）")], []]],
    ep11_guide:[["if", "ep11_a", [rpgS("はくぶつかんの 案内人", "カフェで ひとやすみ、いいですね。上の かいの 展望スペースも 見て いって ください。")],
        [rpgS("はくぶつかんの 案内人", "こちらが 昔の コインの 展示です。ピカピカの ものは、ぬすまれない ように ガラスケースに 入って います。"),
         rpgS("優花", "うわぁ…！ すごい…！ これ ぜんぶ 本物…！"),
         rpgN("じっくり 見学した あと、2人は 併設の カフェで ひとやすみ することにした。"), ["set", "ep11_a"],
         rpgN("（右下の カフェの 店員さんに 話しかけてみよう）")]]],
    ep11_yuka:[["if", "ep11_a", [rpgS("優花", "スマホで 展示の 写真、いっぱい とれたの。あとで 見せるね！")], [rpgS("優花", "まずは 展示を 見て まわろう！ 案内人さんに 話しかけて みて。")]]],
    ep11_cafe:[["if", "ep11_b", [rpgS("カフェの 店員さん", "さっきの お客さん、すごい いきおいで 走って いきました…。")],
        [rpgS("カフェの 店員さん", "いらっしゃいませ。ほうじ茶ラテと、りんごジュースですね。"),
         rpgN("2人が ほっと していると、後ろの 席から 急に 手が のびて きた！"),
         rpgS("玲也", "ごめん、ちょっと 借りるよ〜！ （優花の スマホを ひょい！）"),
         rpgS("優花", "あっ！ 待って！ 私の スマホ…！ 展示の 写真も 入ってるのに…！"),
         EP_SETM("まてー！ 屋上へ 行ったぞ、追いかけよう！", "まって〜！ 屋上へ 行ったよ、追いかけよう！"),
         rpgN("カフェの 外に 屋上への 階段が ひらいた！（玲也に 話しかけよう）"), ["set", "ep11_b"]]]],
    ep11_rei:[["if", "ep11_c", [rpgS("玲也", "…お母さんに 見つかっちゃった…。")],
        [rpgS("玲也", "ここまで 来たか。この スマホ、ぼくの 新しい アプリの 実験に 借りたんだ！ …もちろん あとで 返す つもり だった ぞ！"),
         rpgS("優花", "そういう 問題 じゃ ありません！ 勝手に 取るのは ダメ！"),
         ["battle", ["ep11_reiya"], [
            rpgS("玲也", "うぅ…スマホ、返す…。"),
            rpgN("そのとき、屋上の 扉が ひらいて 玲也の お母さんが あらわれた。"), ["set", "ep11_c"],
            rpgS("玲也の お母さん", "玲也！ また ひとの 物を 借りたの！？ お母さんと いっしょに あやまりに いきましょう！"),
            rpgS("玲也", "か、母さん…！ いつから そこに…"),
            rpgS("優花", "…これで 一件落着、かな。スマホも 無事 だし、展示の 写真も ぶじ！"),
            EP_SETM("玲也、これからは ひとに 相談してから 借りる ことだ。", "玲也くん、これからは ひとに 相談してから 借りようね。"),
            ["gold", 24000], ["item", "special", 5], ["item", "omamori", 2], rpgN("24000G と スペシャルおにぎり 5こ・ふっかつのおまもり 2こ を てにいれた！"),
            ["set", "e_ep11"], ["run", "lab_ret_go"]]]]]],
    ep11_mama:[rpgS("玲也の お母さん", "ほんとうに ごめんなさいね。ほら、玲也、あやまって。")],
    // ================= ③ 2026年11月22日 おおそうじと となりの さわぎ =================
    ep11b_enter:[["if", "!ep11b_in", [["set", "ep11b_in"],
        rpgN("2026年11月22日。昨日の おれいに、優花の おへやの おおそうじを てつだう ことに なった。"),
        rpgS("優花", "ごめんね、手伝わせちゃって。本とか 資料が たくさん あって、なかなか かたづかなくて…。"),
        rpgN("（まずは 優花に 話しかけよう）")], []]],
    ep11b_yuka:[["if", "ep11b_a", [rpgS("優花", "となりの いえで なにか あったみたい。ちょっと 見に いって みよう！")],
        [rpgS("優花", "この 本だなの 裏、ほこりが すごい…。いっしょに はこぼう！"),
         rpgN("本だなを うごかすと、紙の たばが バサッと おちた。"),
         rpgN("そのとき、となりの 家から「ドーン」という 大きな おとと、ガラスが わるような 音！"),
         rpgS("優花", "え、なに！？ となりの 耕太さんの いえ…！"),
         rpgN("となりの 家の まどが わられ、中から 白い けむり（ドライアイスの けむり）が もくもくと 出て いる！"),
         EP_SETM("ケガ人は…！ とにかく 見に いこう！", "ケガ人は…！ とにかく 見に いこう！"),
         ["set", "ep11b_a"], rpgN("（となりの 住人・耕太・ほこりの かげ・すみっこ を しらべて、事件の ヒントを あつめよう）")]]],
    ep11b_neighbor:[rpgS("となりの 住人", "ガスの 事故かと おもったら、けむりは 冷たかったよ。それに、においも しない…。ほんとうに ガス？")],
    ep11b_c1:[["set", "ep11b_c1"], rpgN("ほこりの かげに、小さな ドライアイスの かけらが おちている。"), rpgS("優花", "これ…ガスじゃ なくて、わざと けむりを だした みたい。")],
    ep11b_c2:[["set", "ep11b_c2"], rpgN("すみっこに、耕太の 名前入りの 大きな 封筒が おちている。中は からっぽだ。"), rpgS("優花", "あっ、これ、ゆうべ ここに あった 大事な 資料の 入れ物…！")],
    ep11b_kota:[["if", "e_ep11b", [rpgS("耕太", "…ごめんなさい。もう しません。")],
        [["if", "ep11b_c1&ep11b_c2",
        [rpgS("耕太", "い、いやあ、ガスの じこ なんて こわいですね。わたしは 被害者 でして…"),
         rpgN("すいりタイム！ 耕太は どうやって さわぎを おこしたのか？"),
         ["choice", [
            ["「ドライアイスの けむりで ごまかして、その すきに 資料を かくした」", [rpgS("優花", "そうだよ！ けむりで さわがせて、みんなが 外に 出た すきに、大事な 資料を かくした んだ！"), rpgS("耕太", "ぎく…。いや、ちがう、ガスの… …ああもう！ ばれたか！"), ["run", "ep11b_boss"]]],
            ["「ほんとうに ガスの じこ だった」", [rpgS("優花", "ううん、においも ないし ドライアイスの かけらも あったよ。もういちど 考えて みよう！"), ["run", "ep11b_kota"]]]]]],
        [rpgS("耕太", "ぼくは なにも…。まだ なにか 用ですか？ ほら、ヒントを さがして ください。")]]]]],
    ep11b_boss:[
        rpgS("耕太", "…そうさ。あの 資料は 絶対に 人に 見られたく なかった。だから さわぎを おこして、みんなを 外に 出したんだ！"),
        rpgS("優花", "資料を かくす ために、みんなを おどろかせるなんて…！"),
        ["battle", ["ep11_kota"], [
            rpgS("耕太", "…ぼくが わるかった。資料は ちゃんと 持ち主に 返すよ。"),
            rpgS("優花", "本当の 持ち主さんも、きっと ゆるして くれるよ。ね、{名前}{くん}。"),
            rpgN("大事な 資料は ぶじ 持ち主に 返された。さわぎも おさまった。"),
            ["gold", 26000], ["item", "special", 5], ["item", "omamori", 2], rpgN("26000G と スペシャルおにぎり 5こ・ふっかつのおまもり 2こ を てにいれた！"),
            ["set", "e_ep11b"], ["run", "lab_ret_go"]]]],
    // ================= ④ 2026年12月 キラキラ ラウンジの わな =================
    ep12_enter:[["if", "!ep12_in", [["set", "ep12_in"],
        rpgN("2026年12月24日。クリスマス・イブの 夜、いばらきの ネオンの まちで 美優、隼人、七海と あつまった。"),
        rpgS("美優", "{名前}{くん}、来てくれて ありがとう。じつは 七海が、イケメン接客の ラウンジに ハマっちゃって 心配なの。"),
        rpgS("隼人", "しかも そこの『弘樹』って 人、七海の 貯金が 目当てらしい。…なんとか したいんだ。"),
        rpgN("（まずは 美優と 隼人に 話を 聞こう。つぎに 七海に 話しかけよう）")], []]],
    ep12_miyu:[["if", "ep12_a", [rpgS("美優", "あの 弘樹って 人、ぜったい あやしい。ごめん、気を つけて ね。")], [rpgS("美優", "七海は 弘樹が 大すき みたいで、話を 聞いてくれなくて…。")]]],
    ep12_hayato:[["if", "ep12_a", [rpgS("隼人", "もし 高い 請求書を 出されたら、ひとりで 払っちゃ ダメ だぞ！")], [rpgS("隼人", "七海に 直接 注意しても、「弘樹くんは そんな 人 じゃない」の 一点ばり なんだ。")]]],
    ep12_nanami:[["if", "ep12_a", [rpgS("七海", "弘樹くんが 来るって！ …みんなも 一緒に 行こう？")],
        [rpgS("七海", "あ、{名前}{くん}！ いいところに 来た！ 弘樹くんが 12月26日に 特別な パーティに 招待して くれたの！"),
         EP_SETM("七海、そのパーティ、僕たちも 一緒に 行っても いいかな？ 弘樹さんに 会ってみたいんだ。", "七海ちゃん、そのパーティ、私たちも 一緒に 行っても いいかな？ 弘樹さんに 会ってみたいの。"),
         rpgS("七海", "もちろん！ …じゃあ 26日、ごうかな ラウンジで あおうね！"),
         rpgN("12月26日。ごうかな ラウンジの ゴージャスな ホールに ついた。"), ["set", "ep12_a"],
         rpgN("（奥の ソファに すわっている 弘樹に 話しかけよう）")]]],
    ep12_hiroki:[["if", "ep12_c", [rpgS("弘樹", "…くっ。")],
        [rpgS("弘樹", "ようこそ、ラウンジへ。ジュースでも どうぞ。…きょうは ぼくの おごり、と 言いたい ところ だけど。"),
         rpgN("ほどなくして、1まいの 紙が テーブルに おかれた。"),
         rpgS("弘樹", "お会計は 50万円 に なります。ふふ。これは『特別席の サービス料』 です。"),
         rpgS("七海", "えっ…！？ ご、ごじゅうまん…！？ 弘樹くん、どういう こと？"),
         rpgS("弘樹", "七海ちゃんの 貯金から、ほんの すこし 助けて ほしい だけ なんだ。ね？"),
         rpgS("美優", "請求書に 内訳が ない！ こんなの おかしい！"),
         rpgN("弘樹が ぱちんと 指を ならすと、店の 奥から 屈強な スタッフが ぞろぞろと あらわれた！"),
         EP_SETM("みんな、目を つぶって！ …これで どうだ！", "みんな、目を つぶって！ …えいっ！"),
         rpgN("{名前}の カメラの フラッシュが ピカーッ！ と ひかった！ スタッフは まぶしさで 立ち止まって しまった！"),
         rpgS("隼人", "いまの うちに 外へ！ …と 言いたい ところ だけど、弘樹が 追ってくる ぞ！"),
         ["battle", ["ep12_hiroki"], [
            rpgS("弘樹", "ま…まいった…。お金の 話は ぬきで いい。もう やめるよ。"),
            rpgN("そこへ、美優が 呼んでいた おまわりさんが とうちゃくした！"), ["set", "ep12_c"],
            rpgS("おまわりさん", "請求書の こと、くわしく 話を 聞かせて もらいます。ごいっしょ ください。"),
            rpgN("弘樹は おまわりさんに 連れて いかれた。"),
            rpgS("七海", "ごめんね、みんな…。わたし、ぜんぜん 気づけなかった…。"),
            rpgS("美優", "気づけて よかったよ。これから 一緒に 気を つけよう？"),
            ["gold", 28000], ["item", "special", 5], ["item", "omamori", 2], rpgN("28000G と スペシャルおにぎり 5こ・ふっかつのおまもり 2こ を てにいれた！"),
            ["set", "e_ep12"], ["run", "lab_ret_go"]]]]]],
    ep12_police:[rpgS("おまわりさん", "ご協力、ありがとうございました。しばらく ようすを 見ます。")],
    // ================= ⑤ 2027年1月 22さいへの みち =================
    ep01_enter:[["if", "!ep01_in", [["set", "ep01_in"],
        rpgN("2027年1月。ゆきの まちで、{名前}は 熱を 出して たおれて しまい、病院に 運ばれた。"),
        rpgS("先生", "かぜと つかれ ですね。ゆっくり 休めば 良く なりますよ。……あれ、あの 子は？"),
        rpgN("（まずは 先生に 話しかけよう）")], []]],
    ep01_doc:[["if", "ep01_a", [rpgS("先生", "お大事に。そう いえば、外で 女の子が 困って いるみたい ですよ。")],
        [rpgS("先生", "お薬と たっぷりの 睡眠で だいじょうぶ。…でも 面会の 方が いらしてますよ。"),
         rpgN("そのとき 窓の むこうに 見なれた 影が あらわれた。"),
         rpgS("玲也", "やぁ！ お見舞いに 来たぞ！ …と 言いたい ところだけど、病室は 面会時間 外 だって 言われて…。窓から 入る！"),
         EP_SETM("ま、まってよ、玲也。窓は ダメだよ！", "ま、まってよ、玲也くん。窓は ダメだよ！"),
         rpgN("病室は 1かい。玲也は 窓から ひょいと 入って きて、先生に ひどく 怒られた。"),
         rpgS("玲也", "ご、ごめんなさい…。ほら、お見舞いの 果物。…うさぎリンゴ、むけたぞ。"),
         rpgN("ふたりで うさぎリンゴを 食べて いると、外から 女の子の 声が きこえた。"),
         ["set", "ep01_a"], rpgN("（外の ゆきの まちに 出て、女の子に 話しかけよう）")]]],
    ep01_hana:[["if", "ep01_b", [rpgS("羽奈", "ありがとう…。もう だいじょうぶ。")],
        [rpgS("羽奈", "あ、あの…たすけて…。彼氏が ずっと 私の スマホを 見て、「どこに いたんだ」って しつこく メッセージ を おくって くるんです。"),
         rpgS("羽奈", "さっきも 大声で 呼びつけられて…こわくて…。"),
         EP_SETM("それは 愛じゃ ない。羽奈さん、ここは 僕に 任せて。", "それは 愛じゃ ないよ。羽奈さん、ここは 私に 任せて。"),
         rpgN("みち の むこうから、むきに なった 男の 子が どなりながら 近づいて きた！"), ["set", "ep01_b"],
         rpgN("（つきまとい ノイズに 話しかけよう）")]]],
    ep01_boy:[
        rpgS("つきまとい ノイズ", "羽奈！ 勝手に どこ 行ってたんだ！ おれの 言うこと 聞け！"),
        EP_SETM("やめなさい！ 相手の 気もちを 考えず、おどして 言うことを 聞かせようと しても、それは 大切に している ことには ならない！", "やめなさい！ 相手の 気もちを 考えず、おどして 言うことを 聞かせようと しても、それは 大切に している ことには ならないよ！"),
        ["battle", ["ep01_boy"], [
            rpgS("つきまとい ノイズ", "…うっ。…おれが まちがって いたのかも しれない…。"),
            rpgS("羽奈", "…ありがとう、{名前}{くん}。わたし、ひとりで かかえこんでた。"),
            rpgN("彼は 羽奈に ちゃんと あやまり、スマホを 見る クセを やめると 約束した。"),
            rpgN("そのとき、雪の 向こうから 見なれた 声が きこえた。"), ["set", "ep01_c"],
            rpgN("（玲也が 立っている。話しかけてみよう）")]]],
    ep01_rei:[["if", "ep01_d", [rpgS("玲也", "お祝いの ケーキ、買ってきた！")],
        [rpgS("玲也", "やぁ、{名前}。…いや、ちがう。実は 別荘で ちょっと 大変な ことに なってて、助けてくれ！"),
         rpgN("玲也に つれられて、ゆきの 別荘に 行くと、玲也が 古い おもちゃの『みずでっぽう』を かまえた！"),
         rpgS("玲也", "こ、これは 友だちを おどかす ための おもちゃ だ！ …でも 住民の 人に ほんものと まちがえられて 通報されそうに なって…！"),
         rpgN("別荘の 机の 上には、飲みかけの ミルクティーの 缶と、かわいい ぬいぐるみが ならんでいる。"),
         rpgS("羽奈", "ぬいぐるみ…？ ちいさな どうぶつの かたちですね。かわいい。"),
         EP_SETM("玲也、ちゃんと 住民の 人に 説明して あやまろう。…その みずでっぽうは しまって？", "玲也くん、ちゃんと 住民の 人に 説明して あやまろうね。…その みずでっぽうは しまって？"),
         rpgS("玲也", "でも 久しぶりに 決着を つけたい…！ ほんとうに だいじな 勝負は、ここで やる！"),
         ["battle", ["ep01_reiya"], [
            rpgS("玲也", "…つよく なったな。…もう 悪さは しない。これは ただの おもちゃだ。"),
            rpgN("玲也は 住民の みなさんに ちゃんと あやまって、おもちゃだと 説明した。通報は とりさげられた。"),
            rpgS("羽奈", "あの…そういえば、{名前}さん、今日は お誕生日ですよね？"),
            rpgN("ケーキやさんが ろうそくの ともった ケーキを 持って あらわれた！"), ["set", "ep01_d"],
            rpgS("玲也", "22さい、おめでとう！ …おれからも ひとつ。ぬいぐるみ、プレゼント。"),
            rpgS("羽奈", "ふふ、ほんとに ぬいぐるみ なんですね。もこもこ！"),
            EP_SETM("みんな、ありがとう。ここまで 来られた のは みんなの おかげだ。", "みんな、ありがとう。ここまで 来られた のは みんなの おかげだよ。"),
            ["gold", 30000], ["item", "special", 8], ["item", "omamori", 3], rpgN("30000G と スペシャルおにぎり 8こ・ふっかつのおまもり 3こ を てにいれた！"),
            rpgN("称号『22さいへの みち』を てにいれた！"),
            ["set", "e_ep01"], ["run", "lab_ret_go"]]]]]],
    ep01_cake:[rpgS("ケーキやさん", "おたんじょうび、おめでとう ございます！ ろうそく、ふいてね。"), ["heal"], rpgN("あたたかい ケーキで HP と MP が 全回復した！")]
});
(function(){
    const F = (k) => () => !!G.S.f[k];
    [["t_ep10", "ウォークラリーの なかま", "追加エピソード『10月』を クリア", "e_ep10", 600], ["t_ep11", "はくぶつかんの めいたんてい", "追加エピソード『11月21日』を クリア", "e_ep11", 600],
        ["t_ep11b", "おおそうじの すいりおう", "追加エピソード『11月22日』を クリア", "e_ep11b", 600], ["t_ep12", "キラキラの わなを みやぶる", "追加エピソード『12月』を クリア", "e_ep12", 700],
        ["t_ep01", "22さいへの みち", "追加エピソード『1月』を クリア", "e_ep01", 1000]].forEach((a) => {
        const t = {id:a[0], n:a[1], d:a[2], f:F(a[3]), g:a[4]}; TQ_TITLES.push(t); TQ_TITLE_BY[t.id] = t;
    });
})();


/* ==== game/karasu.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[25]=1;
"use strict";
// ===== 追加コンテンツ：烏坂探偵事務所（なぞとき 5本）=====
//   ① 1〜4話「うらない師と マジックの なぞ」  ② 5〜10話「イケメン てんこうせいと ニセテストの なぞ」
//   ③ 11〜15話「マジックショーと ふしぎな てがみ」 ④ 16〜20話・最終話「さいごの マジックたいけつ」 ⑤ SP「丹羽鳥島の ひみつ」
// ・ぜんぶ「えらんで とく」なぞ。まちがえても ヒントが 出て、なんどでも やりなおせます。
// ・こわい 場面（ぶき・けが・いのち）は ありません。わるものは ノイズ・いたずら・ドッキリに おきかえています。
// ・本編（2035年タワー）クリア後に ゲートから ひらきます。

Object.assign(RPG_LOOKS, {
    ks_hiro:{skin:"#f6d2b0", hair:"#1b1b27", style:"spike", top:"#2f6fdc", bot:"#374151", acc:"tie"},
    ks_hatori:{skin:"#f3cfae", hair:"#222", style:"short", top:"#3a3a52", bot:"#1b1b27", acc:"tie"},
    ks_hatoko:{skin:"#f9d9bd", hair:"#2a1a14", style:"bob", top:"#8a5ab6", bot:"#4b3a6b", acc:"none"},
    ks_taka:{skin:"#f6d2b0", hair:"#5a3a22", style:"short", top:"#e07a1f", bot:"#2b3a67", acc:"none"},
    ks_nagisa:{skin:"#f9d9bd", hair:"#4a2a1a", style:"long", top:"#e8506b", bot:"#4b5563", acc:"none"},
    ks_kosuke:{skin:"#f3cfae", hair:"#3a2a1a", style:"short", top:"#4caf7a", bot:"#2e6b4a", acc:"glasses"},
    ks_girl:{skin:"#f9d9bd", hair:"#7a4a2a", style:"twin", top:"#f0a8c0", bot:"#6a4a7a", acc:"none"},
    ks_girl2:{skin:"#f9d9bd", hair:"#222", style:"bun", top:"#6fb4e8", bot:"#374151", acc:"none"},
    ks_boy:{skin:"#eebf98", hair:"#2d2118", style:"short", top:"#6b7280", bot:"#374151", acc:"none"},
    ks_elder:{skin:"#f3cfae", hair:"#d8d8d8", style:"bald", top:"#6a7a5a", bot:"#3a4a3a", acc:"none"},
    ks_elderF:{skin:"#f9d9bd", hair:"#cfcfcf", style:"bun", top:"#c07a9a", bot:"#6a4a5a", acc:"none"},
    ks_mag:{skin:"#f3cfae", hair:"#111", style:"cap", top:"#5b2a86", bot:"#1b1b27", acc:"tie"},
    ks_washi:{skin:"#f3cfae", hair:"#111", style:"spike", top:"#1b1b27", bot:"#1b1b27", acc:"scarf"},
    ks_mask:{skin:"#f4f4f8", hair:"#111", style:"short", top:"#20202c", bot:"#20202c", acc:"none"}
});
(function(){
    const L = {"羽鳥彦":"ks_hatori", "紘":"ks_hiro", "鳩子":"ks_hatoko", "多鹿":"ks_taka", "渚":"ks_nagisa", "康介":"ks_kosuke", "南海":"ks_girl2", "花梨":"ks_girl", "優":"ks_girl2", "優菜":"ks_girl2", "愛海":"ks_girl", "芽衣":"ks_girl", "玲奈":"ks_girl2",
        "布武矢":"ks_boy", "智也":"ks_boy", "拓馬":"ks_boy", "勇太":"ks_boy", "村川":"ks_kosuke", "和昭":"ks_kosuke", "晴喜":"ks_boy", "小太郎":"ks_boy", "大翔":"ks_mag", "阿井植尾":"ks_mag", "和音":"ks_mag", "葉菜我":"ks_mag", "司会者":"ks_kosuke",
        "鷲郎":"ks_washi", "先生":"doctor", "校長先生":"oyaji", "内踝":"ks_elder", "春鳥":"ks_kosuke", "波止美":"ks_elderF", "工場の人":"citizen", "占い師":"ks_hatoko", "店員さん":"citizenF", "かめんボーイ":"ks_mask"};
    Object.assign(TQ_PORTRAIT_LOOK, L);
    Object.assign(TQ_PORTRAIT_IMG, {"インチキ うらない ノイズ":"ks_uranai", "ニセテスト かめんボーイ":"ks_mask", "てがみノイズ":"ks_letter", "マジック ノイズ 鷲郎":"ks_magic", "ドッキリ しかけにん 鳩子":"ks_party"});
})();

// ---- 小さな 道具
const KL = (a) => a.map((s) => { const i = s.indexOf("｜"); return i > 0 ? rpgS(s.slice(0, i), s.slice(i + 1)) : rpgN(s); });
// なぞ 1問：o = {chk（とけたか 見る フラグ）, set（正解で たてる フラグ）, intro, q, opts:[[文,true/false]…], hint, ok, done, next（つぎの 問題）}
function ksQ(id, o){
    const okOps = KL(o.ok).concat(o.set ? [["set", o.set]] : [], o.next ? [["run", o.next]] : []);
    RPG_EV[id + "_q"] = [rpgN(o.q), ["choice", o.opts.map((x) => [x[0], x[1] ? okOps : KL(o.hint).concat([["run", id + "_q"]])]), {shuffle:1}]];
    if(o.intro) RPG_EV[id] = [["if", o.chk, KL(o.done || ["（この なぞは もう とけたよ！）"]), KL(o.intro).concat([["run", id + "_q"]])]];
}
const KS_HINT = "紘｜ううん、おしい！ もういちど ゆっくり 考えて みよう。ヒントは…";
// 司令塔：なぞの のこりを おしえ、ぜんぶ とけたら ボスへ
function ksHq(id, who, flags, labels, intro, after){
    const all = flags.join("&"), list = flags.map((f, i) => ["if", f, [], [rpgN("・なぞ" + (i + 1) + "『" + labels[i] + "』は まだ とけて いないよ")]]);
    RPG_EV[id] = [["if", id.replace("_hq", "").replace("ks", "e_ks"), KL(after),
        [["if", all, [["run", id.replace("_hq", "_boss")]], KL(intro).concat(list)]]]];
}
function ksMap(kind, objs){
    const R = {
        a:[["b", "T"], ["r", 1, 5, 16, 2, ","], ["r", 2, 1, 4, 1, "H"], ["r", 2, 2, 4, 2, "h"], ["p", 3, 3, "D"], ["p", 9, 11, "G"]],
        b:[["b", "#"], ["r", 2, 2, 3, 2, "L"], ["r", 7, 2, 3, 2, "L"], ["r", 12, 2, 3, 2, "L"], ["p", 9, 11, "G"]],
        c:[["b", "m"], ["r", 2, 2, 3, 2, "N"], ["r", 13, 2, 3, 2, "N"], ["r", 6, 2, 6, 1, "c"], ["p", 9, 11, "G"]],
        d:[["b", "Q"], ["r", 2, 2, 3, 2, "L"], ["r", 13, 2, 3, 2, "L"], ["r", 7, 2, 4, 2, "c"], ["p", 9, 11, "G"]],
        e:[["b", "T"], ["r", 1, 5, 16, 2, ","], ["r", 12, 8, 4, 3, "~"], ["r", 2, 1, 4, 1, "H"], ["r", 2, 2, 4, 2, "h"], ["p", 3, 3, "D"], ["p", 9, 11, "G"]]
    }[kind], fill = {a:".", b:"=", c:"n", d:"w", e:"."}[kind];
    return {name:"", tint:{a:"rgba(255,230,160,0.08)", b:"rgba(180,200,255,0.08)", c:"rgba(120,60,150,0.16)", d:"rgba(255,180,120,0.10)", e:"rgba(120,200,255,0.10)"}[kind],
        start:[9, 10], enc:null, rows:rpgMk(18, 12, fill, R), tev:{G:["gate_back", 1], b:["seat"]}, objs};
}
const KB = (id, name, emo, img, lv, acts, say) => {
    RPG_FOES[id] = rpgE(name, emo, 10, 5, 1, 1, 1, acts, {boss:true, spar:true, img});
    const st = tqBossStat(lv); st.exp = Math.round(st.exp * 0.8); st.g = Math.round(st.g * 5); Object.assign(RPG_FOES[id], st, {bossLv:lv}, {say50:say});
};
const KEND = (gold, flag, titleLine) => [["gold", gold], ["item", "special", 6], ["item", "omamori", 3], rpgN(gold + "G と スペシャルおにぎり 6こ・ふっかつのおまもり 3こ を てにいれた！"), rpgN(titleLine), ["set", flag], ["run", "lab_ret_go"]];

// ================= ① 1〜4話「うらない師と マジックの なぞ」 =================
KB("ks1_boss", "インチキ うらない ノイズ", "🔮", "ks_uranai", 68, [["にせ うらない ふぶき", 1, 0.9, 0.9], ["おかね ほしがり ダッシュ", 0, 1, 1.3], ["あたる あたる トーク", 0, 0.7, 1.7]], "うらない ノイズ「ふふふ… お金を とれば もっと 人気者に なれるのよ！」");
ksQ("ks1_a", {chk:"k1a", set:"k1a", intro:["占い師｜いらっしゃい！ あなたの 誕生日を ズバリ 当てて あげましょう。この 計算を して、答えを おしえて ね。", "占い師｜『(4×生まれた月＋9)×25＋生まれた日』…さぁ、答えは？", "紘｜たとえば 1月23日 うまれの 人なら (4×1＋9)×25＋23 で『348』に なるよ。",
        "占い師｜348 ですね。ズバリ…1月23日！ おめでとう！"],
    q:"占い師は『348』と 聞いて すぐ 1月23日と 当てた。答えの 数から いくつを ひくと『123（1月23日）』に なるかな？",
    opts:[["10 を ひく", 0], ["225 を ひく", 1], ["348 を 2 で わる", 0]],
    hint:["紘｜かっこを はずして みよう。(4×月＋9)×25 は『100×月 ＋ 9×25』。9×25 は いくつ かな？"],
    ok:["紘｜そう！ 9×25＝225。225 を ひくと『100×月＋日』、つまり 123 → 1月23日！ 数式の 中に 答えが かくれて いたんだ。", "占い師｜ば、ばれた…！ でも 人気者に なりたかった だけなの。ごめんなさい。", "なぞ① 『占い師の しかけ』を とけた！"], done:["占い師｜お金は ぜったい とりません。やくそく します。"]});
ksQ("ks1_b", {chk:"k1b", set:"k1b", intro:["大翔｜おれの マジックを 見せよう！ カードを 1まい えらんで、その 数に 2を かける。つぎに 10を たす。それを 2で わる。さいごに 最初の 数を ひく。…答えは ズバリ わかる！", "紘｜『4』の カードなら 4×2＝8、8＋10＝18、18÷2＝9、9－4＝5 だね。"],
    q:"『7』の カードで やって みよう。7×2＋10 ÷2 － 7 の 答えは いくつ？（7→14→24→12→？）",
    opts:[["5", 1], ["7", 0], ["12", 0]],
    hint:["紘｜計算 して みよう。7×2＝14、14＋10＝24、24÷2＝12、12－7＝？"],
    ok:["紘｜答えは 5！ どの カードでも 5に なるよ。(2×数＋10)÷2 は『数＋5』だから、最初の 数を ひくと 5 だけ のこる。マジックの たねは 計算だったんだ！", "大翔｜く、くやしい…！ ばれたか。きみ、やるな！", "なぞ② 『大翔の 数マジック』を とけた！"], done:["大翔｜また あたらしい マジックを 考えて おくよ。"]});
ksQ("ks1_c", {chk:"k1c", set:"k1c", intro:["優｜わたしの マジックは カード当て！ 9まいの カードから 1まい えらんで。3×3に ならべるから『何れつ目 ?』と 聞くね。…もういちど ならべて また 聞くよ。", "紘｜これは『ハンバーグの ほうそく』！ ハンバーグは パンの まんなかに はさまってる よね。ヒントは そこに あるよ。"],
    q:"『何れつ目？』を 2回 聞くと、えらんだ カードは 3×3の どこに くる？",
    opts:[["左上の すみ", 0], ["まんなかの マス", 1], ["右下の すみ", 0]],
    hint:["紘｜3×3 の 表を 思いうかべて みよう。たての まんなか と よこの まんなか が かさなる マスは どこ？"],
    ok:["紘｜そう、まんなか！ 1回目で 3まいの れつに しぼり、2回目に ならべ かえると、えらんだ カードは かならず まんなかに くる。だから すぐ 当てられるんだ！", "優｜すごーい！ 種明かし されちゃった！", "なぞ③ 『ハンバーグの ほうそく』を とけた！"], done:["優｜こんどは 紘くんの マジックも もう1回 見たいな！"]});
ksQ("ks1_d", {chk:"k1d", set:"k1d", intro:["工場の人｜大変だ！ むこうの 道で 車が さかさまに ういて いる ように 見える！ 超能力者の いたずらか…？", "紘｜今日は 39度。ものすごく 暑い 日だね。それに 車が くるっと 180度 まわるのは 人には できないよ。"],
    q:"さかさまに 見える 車の しょうたいは？",
    opts:[["ちょうのうりょくの いたずら", 0], ["ほんとうに ひっくりかえった", 0], ["あたたかい 空気と つめたい 空気の さかいで 光が まがって 見える『しんきろう』", 1]],
    hint:["紘｜暑い 日は 地面ぎわの 空気が あたたかく、上は つめたい。そのとき 光は どう なるかな？"],
    ok:["紘｜しんきろう！ 空気の あたたかさが ちがう 層の さかいで 光が まがって、とおくの ものが さかさに 見えるんだ。", "工場の人｜なぁんだ、ふしぎな 自然の 光の いたずら だったのか。あんしん したよ！", "なぞ④ 『さかさまの 車』を とけた！"], done:["工場の人｜しんきろう、また 見てみたいなぁ。"]});
ksQ("ks1_e", {chk:"k1e", set:"k1e", intro:["愛海｜たすけて！ うちの SNS（友だちと つながる アプリ）に、だれかが かってに 投稿してるの！", "愛海｜ニセ投稿には『愛海は みんなが きらい！』って、自分の 名前で 書いて あった。でも うちは ふだん『うち』って 言うの。", "優菜｜わたしは いつも『わたし』って 言うよ。", "芽衣｜…芽衣は『芽衣』って 名前で 言うけど…？（目を そらす）"],
    q:"ニセ投稿を した 人は だれ？ 話し方の クセに ちゅうもく！",
    opts:[["優菜", 0], ["芽衣", 1], ["愛海 ほんにん", 0]],
    hint:["紘｜ニセ投稿は『自分の 名前』で 自分のことを 書いて いたね。ふだん 自分を 名前で 呼ぶ 人は だれかな？"],
    ok:["紘｜自分のことを 名前で 呼ぶ クセが 同じ。それが しょうこ だよ。", "芽衣｜…ごめんね。愛海が うらやましかっただけ なの。", "愛海｜言ってくれれば よかったのに！ これからも 友だち だよ。", "なぞ⑤ 『ニセ投稿の なぞ』を とけた！"], done:["芽衣｜もう しないよ。ほんとうに ごめんね。"]});
ksHq("ks1_hq", "羽鳥彦", ["k1a", "k1b", "k1c", "k1d", "k1e"], ["占い師の しかけ", "大翔の 数マジック", "ハンバーグの ほうそく", "さかさまの 車", "ニセ投稿の なぞ"],
    ["羽鳥彦｜ようこそ。ぼくが 探偵の 烏坂羽鳥彦だ。町には ふしぎな ことが いっぱい。なぞを 5つ といて くれ！", "紘｜{名前}{くん}、いっしょに 考えよう！ むずかしい ときは ヒントが 出るから あんしんして。"],
    ["羽鳥彦｜① の なぞ、ぜんぶ とけたね。きみは 立派な 名探偵だ！"]);
RPG_EV.ks1_boss = [rpgS("羽鳥彦", "すごい！ 5つとも 見ごとな すいりだ！ …ん？ 事務所の 外が さわがしいぞ。"), rpgN("さっきの 占い師の うしろから、キラキラの ノイズが ふくらんで いく！"),
    rpgS("紘", "お金を とる ために ノイズに のみこまれたんだ！ {名前}{くん}、とめよう！"),
    ["battle", ["ks1_boss"], [rpgS("うらない ノイズ", "…お金を とるのは もう やめます。ほんとうに 当たる 占いより、みんなが わらってくれる ほうが うれしい。"), rpgS("羽鳥彦", "ははは、いい 心がけだ。事務所の 仲間に ならないか？"), rpgS("紘", "さすが {名前}{くん}！ 1〜4話の なぞ、ぜんぶ かいけつ！")].concat(KEND(34000, "e_ks1", "称号『なぞとき みならい』を てにいれた！"))]];
RPG_EV.ks1_enter = [["if", "!ks1_in", [["set", "ks1_in"], rpgN("2022年1月23日。『烏坂探偵事務所』が オープンした ばかりの 町に やって きた。"),
    rpgS("紘", "あっ、{名前}{くん}！ きょうは 町の ふしぎを 5つ といて いくよ。"), rpgN("（まずは 左上の 事務所の 前の 羽鳥彦に 話しかけよう。なぞは どれから といても いいよ）")], []]];

// ================= ② 5〜10話「イケメン てんこうせいと ニセテストの なぞ」 =================
KB("ks2_boss", "ニセテスト かめんボーイ", "🎭", "ks_mask", 70, [["ニセ テスト ふぶき", 1, 0.9, 0.9], ["かめん ダッシュ", 0, 1, 1.3], ["けむり いたずら", 0, 0.7, 1.8]], "かめんボーイ「ふふふ… みんなを あわてさせるのが 楽しいんだ！」");
ksQ("ks2_a", {chk:"k2a", set:"k2a", intro:["紘｜渚さんが 病院の イケメンな 先生に むちゅうで 学校を ずっと おやすみ しちゃってる。このままだと 単位が 足りなく なるよ。", "花梨｜わたしなら…『もっと かっこいい 人が いる』って 聞いたら 気に なっちゃうかも。"],
    q:"渚さんを 学校へ 行きたい 気もちに させる、いちばん やさしい さくせんは？",
    opts:[["むりやり ひっぱって くる", 0], ["『先生の むすこの かっこいい 転校生が 学校に いるよ』と おしえる", 1], ["先生を 学校に よぶ", 0]],
    hint:["花梨｜むりやりは けんかに なっちゃう。きもちを 動かす ほうほうを 思い出して！"],
    ok:["渚｜えっ！ 先生の むすこ！？ しかも 転校生！？ いく いく、今すぐ 行く〜！", "紘｜作戦 せいこう！ 渚さんが 学校に もどって きた！", "なぞ① 『渚さんを 学校へ』を とけた！"], done:["渚｜学校 たのしい〜！ ありがとう、{名前}{くん}！"]});
ksQ("ks2_b", {chk:"k2b", set:"", next:"ks2_b2_q", intro:["布武矢｜数学を おしえてよ！『等差数列』って 何？", "紘｜となりの 数との 差が いつも 同じ ならびの ことだよ。たとえば…", "布武矢｜1, 3, 5, 7, 9, ？, 13。"],
    q:"『？』に 入る 数は？（2ずつ ふえてるよ）",
    opts:[["10", 0], ["12", 0], ["11", 1]],
    hint:["紘｜となりと 差を とって みよう。1→3 は +2、3→5 は +2…。9の つぎは？"],
    ok:["布武矢｜11！ 2ずつ ふえてるから ね。かんたん かんたん！", "紘｜じゃあ 差が 同じ じゃない ならびも 見てみよう。"]});
ksQ("ks2_b2", {chk:"k2b", set:"k2b",
    q:"1, 2, 4, 8, ？ …『？』に 入る 数は？（何ばい ずつ ふえてる？）",
    opts:[["10", 0], ["16", 1], ["12", 0]],
    hint:["紘｜1→2、2→4、4→8。『たし算』じゃ なくて 何ばいかな？"],
    ok:["紘｜16！ 2ばいずつ ふえてるね。ふえかたを 自分で しらべるのが こつだよ。", "布武矢｜やったぜ！ 数学 たのしい！", "なぞ② 『ならびの ひみつ』を とけた！"]});
ksQ("ks2_c", {chk:"k2c", set:"", next:"ks2_c2_q", intro:["先生｜きんきゅう テストだ！ 1から 100までを ぜんぶ たして ください。5分 いないに とけたら ろうかへ 出て よろしい。", "紘｜ひとつずつ たしたら 大変！ こうしき を 使おう。『さいしょ と さいごを たして、こすうの はんぶんを かける』よ。"],
    q:"1＋2＋3＋…＋100 は いくつ？（1＋100＝101 が 50こ）",
    opts:[["10100", 0], ["5050", 1], ["5000", 0]],
    hint:["紘｜(1＋100) の 組が 50こ できるよ。101 × 50 を 計算 して みよう。"],
    ok:["先生｜正解 5050！ では つぎは もっと 大きい 数だ。"]});
ksQ("ks2_c2", {chk:"k2c", set:"k2c",
    q:"では 1から 1000までを ぜんぶ たすと？ (1＋1000)×500 を 計算しよう！",
    opts:[["1001000", 0], ["500500", 1], ["50500", 0]],
    hint:["紘｜1＋1000＝1001 が 500こ。1001 × 500 は いくつ かな？"],
    ok:["紘｜500500！ 同じ やり方で どんな 数も あっという間！", "先生｜みごと だ！ みんな ろうかへ どうぞ。", "なぞ③ 『ガウスの 計算』を とけた！"]});
ksQ("ks2_d", {chk:"k2d", set:"k2d", intro:["先生｜…テストの あと、きょうしつに ふしぎな けむりが ひろがった！ ドアも まども 閉まってる。", "紘｜きょうしつ全体が けむりで いっぱい。空気が 足りなく なって くらくら する…！"],
    q:"まず 何を する のが いちばん あんぜん？",
    opts:[["ドアを もっと しっかり 閉める", 0], ["その場で ねころんで 休む", 0], ["まどや ドアを あけて 空気を いれかえる（かんき）", 1]],
    hint:["紘｜けむりが こもって いるよね。新しい 空気を 入れる には どう すれば いい かな？"],
    ok:["紘｜まどを あけて かんき！ 空気が 足りなく なる『さんそ けっぼう』を ふせげるよ。", "先生｜みんな ぶじだ。ケガ人は いないぞ。", "なぞ④ 『けむりの きょうしつ』を とけた！"], done:["先生｜いつも かんきは だいじ だな。"]});
ksQ("ks2_e", {chk:"k2e", set:"", next:"ks2_e2_q", intro:["南海｜拓馬くんの ようすが おかしいの。黒い 服で 立派な バッグを もって、駅の 公衆電話で ながでんわ…。", "紘｜お金が ほしいって 言ってた。しかも『バイト』としか 教えて くれない。"],
    q:"拓馬くんの『バイト』は 何だと 思う？",
    opts:[["でんわで ウソを ついて お金を だましとる『サギ』", 1], ["新聞はいたつ", 0], ["ゴミひろい ボランティア", 0]],
    hint:["紘｜黒い 服・バッグ・長電話・『ひみつ』。まじめな バイト なら かくす 必要は ないよね。"],
    ok:["南海｜やっぱり…！ お金のために ウソを つくのは だめだよ！", "拓馬｜ご、ごめん。さそわれて つい…。もう やめる！", "紘｜さそった 人が いるはず。その 人は だれ かな？"]});
ksQ("ks2_e2", {chk:"k2e", set:"k2e",
    q:"手がかり：『アカリ市から 来た』『頭が いい』『いつも 紘くんの そばに いる』『占いの ことも 知ってる』…さそった 犯人は？",
    opts:[["花梨さん", 0], ["校長先生", 0], ["羽鳥彦の 助手の 智也さん", 1]],
    hint:["紘｜花梨さんは ミドリ、校長先生は 学校の 人。『アカリ市出身』で『いつも そば』に いる のは？"],
    ok:["紘｜智也さん…だったんだね。みんなを あわてさせる ために、かめんを かぶって いたんだ。", "なぞ⑤ 『かめんの 正体』を とけた！"]});
ksHq("ks2_hq", "羽鳥彦", ["k2a", "k2b", "k2c", "k2d", "k2e"], ["渚さんを 学校へ", "ならびの ひみつ", "ガウスの 計算", "けむりの きょうしつ", "かめんの 正体"],
    ["羽鳥彦｜ここは 学校だ。ふしぎな ニセテストの うわさが 広がって いる。みんなで なぞを とこう！", "紘｜なぞは 5つ。どれから でも だいじょうぶ！"],
    ["羽鳥彦｜② の なぞも かいけつ。きみの すいり力、ますます さえて いるね！"]);
RPG_EV.ks2_boss = [rpgS("紘", "かめんの 正体は わかった。…あっ、後ろから ニセテストの ノイズが！"), rpgN("かめんボーイが ふくらんだ ノイズに のみこまれた！"),
    ["battle", ["ks2_boss"], [rpgS("かめんボーイ", "…まいった。じつは さびしくて、みんなを おどろかせたかった だけなんだ。"), rpgS("智也", "ごめんなさい。もう ぜったい いたずらは しません。"), rpgS("紘", "うん。いっしょに 遊ぼう！ …あれ？ 渚さんと 布武矢くん、もう 友だちに なってる！")].concat(KEND(38000, "e_ks2", "称号『ニセテスト ばんにん』を てにいれた！"))]];
RPG_EV.ks2_enter = [["if", "!ks2_in", [["set", "ks2_in"], rpgN("つぎの 舞台は 学校。イケメンの 転校生、とつぜんの 緊急テスト…。"), rpgS("紘", "5話から 10話の なぞ、いっしょに といて くれる？"), rpgN("（羽鳥彦に 話しかけて、まわりの 人から ヒントを あつめよう）")], []]];

// ================= ③ 11〜15話「マジックショーと ふしぎな てがみ」 =================
KB("ks3_boss", "てがみノイズ", "✉️", "ks_letter", 72, [["てがみ ふぶき", 1, 0.9, 0.9], ["ふうとう アタック", 0, 1, 1.3], ["おどし もんく", 0, 0.7, 1.8]], "てがみノイズ「わたしは 小さな 手紙だ。でも 大きな さわぎを 起こせるぞ！」");
ksQ("ks3_a", {chk:"k3a", set:"k3a", intro:["多鹿｜はじめまして。羽鳥彦の 弟の 烏坂多鹿です。たいへんです！ 智也くんの 家に 大きな『ビックリ クラッカー』が かくされて いました。", "多鹿｜ひらくと 大きな 音と 風で まわりが 大さわぎ！ 町の 人の ために『かたい かべ』で かこいたいです。", "村川｜マイクラ みたいに 作れる かも！"],
    q:"音と 風を おさえこむ のに いちばん むいて いる かべは？",
    opts:[["うすい 紙の かべ", 0], ["ガラスの かべ", 0], ["黒曜石みたいな かたくて あつい 石の かべ", 1]],
    hint:["多鹿｜音と 風に まけない のは、かたくて あつくて われにくい ものだよ。"],
    ok:["多鹿｜そう！ かたくて あつい 石の かべ。ゲームの 黒曜石は 世界で いちばん かたい ブロックの ひとつだよね。", "村川｜まかせて！ 2週間で ぜんぶ 作った よ！", "渚｜せーの！ …ぱーん！ …わぁ、紙ふぶきだけ！ だれも ケガ しなかった！", "なぞ① 『ふうじこめ 大作戦』を とけた！"], done:["村川｜また あたらしい かべ、作るよ！"]});
ksQ("ks3_b", {chk:"k3b", set:"", next:"ks3_b2_q", intro:["和音｜ぼくの マジック！ 1〜20から すきな 数を 思って。その 番号の カードを おぼえて ね。残りの カードを まとめる とき、1まい だけ うしろに おくよ。", "紘｜これは たねが ある。ヒントは『1まい ふえる』！"],
    q:"『6ばんめ』の カードを おぼえた。1まい うしろに おいた あと、そのカードは 何ばんめ？",
    opts:[["5ばんめ", 0], ["7ばんめ", 1], ["6ばんめ", 0]],
    hint:["紘｜1まい 手前に ふえると、6ばんめは どちらへ ずれる かな？"],
    ok:["紘｜7ばんめ！ ずれた 場所を 数えれば、どの カードか わかるんだ。", "和音｜ばれたか。さすが！ …じゃあ つぎは 葉菜我さんの マジックを 見てみて。"]});
ksQ("ks3_b2", {chk:"k3b", set:"k3b",
    q:"葉菜我さんの デッキは スペード→クローバー→ハート→ダイヤ の じゅんに 1,2,3,4,5,6,7…と ならんで いる。『7ばんめ』の カードは？",
    opts:[["クローバーの 7", 0], ["ダイヤの 7", 0], ["ハートの 7", 1]],
    hint:["紘｜1スペード、2クローバー、3ハート、4ダイヤ、5スペード…。同じ くりかえし だよ。"],
    ok:["紘｜ハートの 7！ ならびが きまって いたから、見なくても わかったんだ。", "葉菜我｜ばれたか…！ 鼻で 当てる のは ウソ でした。", "なぞ② 『カードの たね』を とけた！"]});
ksQ("ks3_c", {chk:"k3c", set:"", next:"ks3_c2_q", intro:["紘｜ぼくの マジックは『1〜30の 数 当て』。5まいの カードに『1』『2』『4』『8』『16』から はじまる 数が のってる。", "紘｜思った 数が のってる カードの 先頭の 数を たし算すると 答えが 出るよ！"],
    q:"『16・8・4・2』の カードに 思った 数が あった。思った 数は？（16＋8＋4＋2）",
    opts:[["32", 0], ["30", 1], ["20", 0]],
    hint:["紘｜16＋8＝24、24＋4＝28、28＋2＝？"],
    ok:["多鹿｜30！ 正解です。つぎは ちがう 組み合わせで。"]});
ksQ("ks3_c2", {chk:"k3c", set:"k3c",
    q:"『16・2・1』の カードに 思った 数が あった。思った 数は？",
    opts:[["18", 0], ["21", 0], ["19", 1]],
    hint:["紘｜16＋2＋1 を 順番に たそう。"],
    ok:["紘｜19！ 数は 1・2・4・8・16 を 組み合わせると、1〜31 まで 作れるんだ。", "なぞ③ 『5まいの カード』を とけた！"]});
ksQ("ks3_d", {chk:"k3d", set:"", next:"ks3_d2_q", intro:["司会者｜大変です！ 葉菜我さんが トイレで くしゃみが 止まらなく なって、へたりこんで います！", "紘｜鼻が じまんの 葉菜我さん。顔が ぬれて いたね。手を 見せて…あっ、手に 白い 粉が！"],
    q:"葉菜我さんを こまらせた しかけは？",
    opts:[["空から 雪が ふった", 0], ["手に こしょうを つけて おいた（顔を 洗うと 鼻に 入る）", 1], ["トランプを 食べた", 0]],
    hint:["紘｜鼻が じまんの 人の 弱点は 何かな？ 手の 白い 粉は なにの 粉？"],
    ok:["紘｜こしょうの 粉！ 手から 顔、鼻に 入って くしゃみが 止まらなくなったんだ。", "司会者｜じつは 手紙で『こしょうを 手に つけて』と たのまれました。ごめんなさい。"]});
ksQ("ks3_d2", {chk:"k3d", set:"k3d",
    q:"手紙の ふうとうには『鳥』の スタンプ。これは 丹羽鳥島（にわとりじま）の しるし。鳩子さんは『わたしの 家の しるし。でも 協力者よ』と 言う。手紙の 送りぬしは？",
    opts:[["司会者", 0], ["鳩子さんの 弟の 丹羽鷲郎", 1], ["阿井植尾さん", 0]],
    hint:["紘｜鳥の スタンプは 鳩子さんの 家の しるし。でも 鳩子さんでは ない。鳩子さんの 家族で、男の 人は…？"],
    ok:["鳩子｜…わたしの 弟 かもしれない。ごめんね、紘くん。", "紘｜鳩子さんは わるく ない よ。いっしょに 仲直り しよう。", "なぞ④ 『てがみの 送りぬし』を とけた！"]});
ksQ("ks3_e", {chk:"k3e", set:"k3e", intro:["玲奈｜きのう 階段を おりるほど 息が くるしくなったの。下に 着いたら、きらいな 男子が わらってた…。", "多鹿｜階段の 下は 空気が ちがう のかも…。"],
    q:"空気より おもい『二酸化炭素』は 階段の どこに たまりやすい？",
    opts:[["いちばん 上", 0], ["いちばん 下（ひくい ところ）", 1], ["まんなかだけ", 0]],
    hint:["多鹿｜空気より おもい ものは 下へ 下へ…。水の コップの 底に 重い ものが しずむのと 同じだよ。"],
    ok:["多鹿｜そう！ 二酸化炭素は 空気より おもいから 下に たまる。だから おりる ほど 息が くるしくなった んだ。", "玲奈｜教えて くれて ありがとう。きょうから 気を つけるね。", "なぞ⑤ 『階段の くるしさ』を とけた！"], done:["玲奈｜階段、気を つけて おりるね！"]});
ksHq("ks3_hq", "多鹿", ["k3a", "k3b", "k3c", "k3d", "k3e"], ["ふうじこめ 大作戦", "カードの たね", "5まいの カード", "てがみの 送りぬし", "階段の くるしさ"],
    ["多鹿｜ようこそ、マジックショーの 会場へ。きょうは なぞ だらけです。5つ、いっしょに といて ください！", "紘｜ぼくも 出演 する から、ついて きて！"],
    ["多鹿｜③ の なぞも ぜんぶ 解決！ {名前}さん、すごいです！"]);
RPG_EV.ks3_boss = [rpgS("鳩子", "…あのね、紘くん。羽鳥彦が 入院して から、さびしくて、ひどい こと を 言ったわ。ごめんなさい。"), rpgS("紘", "ぼくも ごめんなさい。いっしょに なぞを とくの、手伝って くれる？"), rpgS("鳩子", "…うん。わたしも 仲間に 入れて。"),
    rpgN("そのとき、会場に ふいてきた 風で 手紙が まいあがり、一つの ノイズに なった！"),
    ["battle", ["ks3_boss"], [rpgS("てがみノイズ", "…ただの 手紙に もどる…。いたずらの お手つだいは もう しない。"), rpgS("多鹿", "あとは 鷲郎くんの ほうだね。つぎの 舞台は…")].concat(KEND(42000, "e_ks3", "称号『てがみの なぞ ときびと』を てにいれた！"))]];
RPG_EV.ks3_enter = [["if", "!ks3_in", [["set", "ks3_in"], rpgN("2月25日。アカリ市 ヒカリ町の マジックショー 会場。"), rpgS("多鹿", "きょうは 4人の マジシャンが 出ます。たねを 見やぶって いきましょう！"), rpgN("（多鹿に 話しかけて、会場の 人たちから なぞを 聞いて みよう）")], []]];

// ================= ④ 16〜20話・最終話「さいごの マジックたいけつ」 =================
KB("ks4_boss", "マジック ノイズ 鷲郎", "🎩", "ks_magic", 74, [["カード ふぶき", 1, 0.9, 0.9], ["マジック ダッシュ", 0, 1, 1.3], ["たねあかし ブロック", 0, 0.7, 1.9]], "鷲郎「たねを 見やぶれる もんなら 見やぶって みろ！」");
ksQ("ks4_a", {chk:"k4a", set:"", next:"ks4_a2_q", intro:["晴喜｜おれが 学校を さぼった ことが 一しゅんで 広まって…。だれにも 話して ないのに！", "南海｜うちの 家の 話が だれかに 聞かれて いるみたい。となりの 家の 小太郎くんは『スマホゲーム 専用の スマホ』を 持って るの。", "紘｜ゲーム専用なのに『録音アプリ』が 入って いたよ。"],
    q:"こっそり 録音して いたのは だれ？",
    opts:[["晴喜くん", 0], ["南海さん", 0], ["となりの 家の 小太郎くん", 1]],
    hint:["多鹿｜家が となりで、スマホに 録音アプリが 入って いたのは だれ だったかな？"],
    ok:["小太郎｜…ごめんなさい。手紙で たのまれて やっちゃった。", "多鹿｜つぎは カシノの 事件。ポイントカードの ふしぎ です。"]});
ksQ("ks4_a2", {chk:"k4a", set:"k4a",
    q:"和昭くんの カードが かってに 使われて いた。じつは カードを 作る とき、サービスカウンターの 人に『暗証番号（4けた）』を 見られて いた。なぜ 他人の カードが 使えたの？",
    opts:[["暗証番号を 見られて おぼえられた から", 1], ["カードが 分身 した から", 0], ["お店の おつりが まちがって いた から", 0]],
    hint:["多鹿｜暗証番号は 人に 見せて いい もの かな？ 見られたら どう なる？"],
    ok:["多鹿｜そう。暗証番号は ぜったいに 人に 見せない・教えない。カードを 作る ときも 手で かくして 書こうね。", "店員さん｜ごめんなさい。もう しません。", "なぞ① 『ひみつの 録音と カード』を とけた！"]});
ksQ("ks4_b", {chk:"k4b", set:"", next:"ks4_b2_q", intro:["占い師｜また 誕生日 当て を しましょう。好きな 月日を 思い浮かべて、公式に 当てはめて 合計を おしえて ね。", "紘｜公式は『100×日＋15＋月』だよ。8月31日 なら 100×31＋15＋8＝3123。"],
    q:"合計が『1025』だった。15を ひくと 1010。右から 2けたが 月、のこりが 日。何月何日？",
    opts:[["1月25日", 0], ["10月10日", 1], ["10月25日", 0]],
    hint:["紘｜1025－15＝1010。右の 2けたが『10』、のこりも『10』だよ。"],
    ok:["占い師｜正解…！ もう ひとつ いきますよ。"]});
ksQ("ks4_b2", {chk:"k4b", set:"k4b",
    q:"合計が『3123』だった。15を ひくと 3108。右から 2けたが 月、のこりが 日。何月何日？",
    opts:[["3月12日", 0], ["12月3日", 0], ["8月31日", 1]],
    hint:["紘｜3123－15＝3108。右の 2けたは『08』、のこりは『31』。"],
    ok:["紘｜8月31日！ 合計から 15を ひいて、右から 2けたが 月、のこりが 日。これが たねだよ。", "占い師｜ばれました…。お金を とる マジックは もうやりません。", "なぞ② 『誕生日 当ての 公式』を とけた！"]});
ksQ("ks4_c", {chk:"k4c", set:"", next:"ks4_c2_q", intro:["鷲郎｜俺の マジックを 見せて やる！ カレンダーの 3×3の 9つの 数を たした 合計を、一しゅんで 当てて みせる！", "紘｜ヒントは『まんなかの 数』だよ。"],
    q:"3×3 の まんなかの 数が 9 の とき、9つの 合計は？（まんなか × 9）",
    opts:[["27", 0], ["81", 1], ["90", 0]],
    hint:["紘｜9×9 は？ 3×3 の 9つの 数は、まんなかを 中心に かたよりなく ならんで いるから…。"],
    ok:["多鹿｜81！ そのとおり。つぎは『たて3つ』の マジックです。"]});
ksQ("ks4_c2", {chk:"k4c", set:"", next:"ks4_c3_q",
    q:"カレンダーの たて3つ（いちばん上の数 a、a＋7、a＋14）の 合計が『30』。いちばん 上の 数は？",
    opts:[["5", 0], ["3", 1], ["10", 0]],
    hint:["紘｜a ＋ (a＋7) ＋ (a＋14) ＝ 3a ＋ 21。それが 30 に なるのは…。"],
    ok:["紘｜3！（3, 10, 17）。合計から 21を ひいて 3で わると いちばん 上が わかる。"]});
ksQ("ks4_c3", {chk:"k4c", set:"k4c",
    q:"電卓マジック：3けたの 数『275』を 2回 ならべて『275275』。7、13、11 で 順番に わると…？ （7×13×11＝1001）",
    opts:[["もとの 数『275』", 1], ["1001", 0], ["275275", 0]],
    hint:["多鹿｜275275 は 275 × 1001。1001 は 7×13×11 だから、ぜんぶ わり きると…？"],
    ok:["多鹿｜275！ 3けたを 2回 ならべると 1001ばい。だから 7×13×11 で わると もどるんです。", "なぞ③ 『カレンダーと 電卓』を とけた！"]});
ksQ("ks4_d", {chk:"k4d", set:"", next:"ks4_d2_q", intro:["鷲郎｜つぎは 理科×なぞとき だ！ 第1問、きょうしつに もくもくと けむりが 出た！ どうやって にげる？", "紘｜けむりや あたたかい 空気は 上へ のぼる よね。"],
    q:"けむりが 出た とき の にげ方は？",
    opts:[["立って 走る", 0], ["エレベーターに 乗る", 0], ["ひくい しせいで、ハンカチで 口を おさえて にげる", 1]],
    hint:["紘｜けむりは 上に たまる。だから 低い ところの 空気を すう ように するには？"],
    ok:["ピンポン！ 正解のあいず が 鳴った！", "鷲郎｜やるな。第2問！ 畳に インクを こぼした。どう する？"]});
ksQ("ks4_d2", {chk:"k4d", set:"k4d",
    q:"インクの シミは どうやって おとすのが よい？",
    opts:[["ごしごし こする", 0], ["ぬらした ぬのを あてて、トントンと たたいて うつす", 1], ["そのまま ほうっておく", 0]],
    hint:["紘｜こすると 広がっちゃう。シミを ぬのに 『うつし とる』 には？"],
    ok:["渚｜こすらず トントン！ だいぶ きれいに なった！", "なぞ④ 『理科の なぞ』を とけた！"]});
ksQ("ks4_e", {chk:"k4e", set:"k4e", intro:["鷲郎｜ラストの 問題だ！ 美術の 時間、紗幸さんと 香帆さんが 油絵を かいた。かわかす ために 乾燥剤を 使い、油の しみた ぞうきんを 水で 洗わずに 元の 場所へ…。", "鷲郎｜次の 日、美術室から 火が 出る さわぎに なった！『紘伝説の のろい』かも…？", "南海｜わたし 美術部 だったから わかるかも…！"],
    q:"火が 出た ほんとうの わけは？",
    opts:[["だれかが わざと マッチで つけた", 0], ["絵の のろい", 0], ["油の しみた ぬのが 空気と ふれて 熱を 出し、自然に 火が ついた", 1]],
    hint:["南海｜油絵具や 乾燥剤の しみた 布は、空気に ふれ ながら ためこむと だんだん あつくなる ことが あるの。"],
    ok:["紘｜犯人は いない！ 油の しみた ぬのは『さんか ねつ』で 熱が たまり、自然に 発火する ことが ある。使った あとは 水で あらって から しまおう。", "鷲郎｜…お前らの きょうりょく と 発想力、よく 伝わった。", "なぞ⑤ 『さいごの 問題』を とけた！"], done:["南海｜使った ぬのは あらって から しまう！ やくそく ね。"]});
ksHq("ks4_hq", "多鹿", ["k4a", "k4b", "k4c", "k4d", "k4e"], ["ひみつの 録音と カード", "誕生日 当ての 公式", "カレンダーと 電卓", "理科の なぞ", "さいごの 問題"],
    ["多鹿｜ここは アカリ市の 文化会館。さいごの マジック 対決の 日です。なぞは 5つ。紘さんの 友だちも みんな 来て います！", "紘｜みんなの 力を あわせれば できるよ！"],
    ["多鹿｜④ の なぞも ぜんぶ 解決。{名前}さん、さすがです！"]);
RPG_EV.ks4_boss = [rpgS("鷲郎", "お前らの 協調性は よく わかった。…だが 最後に 本気の マジック勝負を して みろ！"), rpgS("多鹿", "いいですよ。{名前}さん、お願いします！"),
    ["battle", ["ks4_boss"], [rpgS("鷲郎", "…負けを 認める。もう 手紙を 送ったり は しない。"), rpgS("紘", "さいごの マジック、たのしかった ね！"), rpgS("南海", "紘、探偵の アルバイト、ぴったり だと 思う！"), rpgN("4月1日。紘は 探偵の アルバイトを はじめる ことに した。")].concat(KEND(48000, "e_ks4", "称号『マジックの たねあかしの 達人』を てにいれた！"))]];
RPG_EV.ks4_enter = [["if", "!ks4_in", [["set", "ks4_in"], rpgN("3月25日。アカリ市の 文化会館。『生き残り（いきのこり）脱出ゲーム』ならぬ『なぞとき 脱出ゲーム』が はじまる！"), rpgS("多鹿", "ことしの さいごの 大舞台です。気を ひきしめて いきましょう！"), rpgN("（多鹿に 話しかけて、会場の 人たちの なぞを とこう）")], []]];

// ================= ⑤ SP「丹羽鳥島の ひみつ」 =================
KB("ks5_boss", "ドッキリ しかけにん 鳩子", "🎉", "ks_party", 76, [["ドッキリ クラッカー", 1, 0.9, 0.9], ["へんそう ダッシュ", 0, 1, 1.3], ["なぞなぞ マシンガン", 0, 0.7, 1.9]], "鳩子「ここまで 来たのね！ さいごの 勝負よ！」");
ksQ("ks5_a", {chk:"k5a", set:"k5a", intro:["内踝｜たすけて くれ…！ 朝おきたら 体が うごかないんじゃ。", "春鳥｜お父さん、きのう お昼寝 しすぎたんじゃ ないの？", "紘｜でも 体には 悪い ところが ない。昼寝で ねるじかんが みだれると、おきて いるのに 体だけ 動かない ことが あるんだ。"],
    q:"頭は おきて いるのに 体が 動かない、ねむりの とちゅうに おこる 状態は？",
    opts:[["まほう", 0], ["年よりだけが なる 病気", 0], ["金縛り（かなしばり）＝ねむりの『レム睡眠』の とき 体の 力が ぬける 状態", 1]],
    hint:["紘｜ねむりには 体を 休める『ノンレム』と、体は 休んで 頭は はたらく『レム』が ある。レムの とき 体の 力が ぬけるんだ。"],
    ok:["紘｜そう、金縛り（睡眠まひ）！ 昼寝で リズムが みだれると 起こりやすい。ふつうは 心配 いらないよ。", "内踝｜なんじゃ、そうか。やばくないか？ やばくない。", "なぞ① 『うごかない 体』を とけた！"], done:["内踝｜もう すっかり げんきじゃ！"]});
ksQ("ks5_b", {chk:"k5b", set:"k5b", intro:["春鳥｜昨日 おれは『波止美が 内踝さんの へやに 入る の』を 見たんだ！", "波止美｜わたしは そのとき ずっと 台所で 夕ごはんの したく よ！"],
    q:"春鳥さんが 見た『波止美さん』の しょうたいは？",
    opts:[["波止美さんの ふたご", 0], ["波止美さんに へんそうした 人", 1], ["ゆうれい", 0]],
    hint:["紘｜波止美さんは 台所に いた。同じ 時間に へやに 入ったのなら、どちらかは 本物じゃ ない よね。"],
    ok:["紘｜へんそう！ だれかが 波止美さんの ふりを して いたんだ。春鳥さんは だまされたんだね。", "春鳥｜な、なるほど！ すっかり 信じて いた…！", "なぞ② 『もう ひとりの 波止美さん』を とけた！"], done:["春鳥｜へんそうの 名人が いるのか…。"]});
ksQ("ks5_c", {chk:"k5c", set:"k5c", intro:["渚｜島の 自動販売機で『桃の 天然水』を 買ったよ。…あっ、炭酸だった！ ふっちゃった！", "康介｜開けた しゅんかん あふれ出す やつ でしょ！", "紘｜ころがしたり デコピンしたり は『おまじない』みたいな もの。ほんとうに 効く のは…？"],
    q:"ふって しまった 炭酸を、ふきださずに あける いちばん たしかな 方法は？",
    opts:[["もっと よく ふる", 0], ["しばらく じっと おいて あわが おちつくのを まつ", 1], ["いきなり ぜんぶ ひらく", 0]],
    hint:["紘｜あわ（二酸化炭素）は 上へ のぼるよ。まって いれば どう なるかな？"],
    ok:["紘｜そう！ あわが 上に あつまって おちつくのを まつ のが いちばん たしか。ころがす・デコピンは 気分 だけ（笑）。", "渚｜なるほど〜！ 理科って おもしろい！", "なぞ③ 『ふった 炭酸』を とけた！"], done:["渚｜つぎは ちゃんと まつね！"]});
ksQ("ks5_d", {chk:"k5d", set:"", next:"ks5_d2_q", intro:["春鳥｜夕方 とつぜん 地震が！ …でも 近所は ぜんぜん ゆれて ないんだ。", "康介｜家の まわりで 工事の 音が してた…。", "紘｜この 家の 下には 空洞が ある。工事の 小さな ゆれが 空洞で だんだん 大きく なったんだ。"],
    q:"『小さな ゆれを くりかえし 与えると、どんどん 大きな ゆれに なる』現象は？",
    opts:[["しんきろう", 0], ["共振（きょうしん）", 1], ["地われ", 0]],
    hint:["紘｜ブランコを タイミング よく おすと だんだん 大きく ゆれる よね。あれと 同じ げんしょう。"],
    ok:["紘｜共振！ ブランコの 原理と 同じで、同じ リズムの ゆれが かさなると 大きくなるんだ。", "春鳥｜スマホの『緊急地震速報』も 鳴ったが…？"]});
ksQ("ks5_d2", {chk:"k5d", set:"k5d",
    q:"家の 中の スマホだけ『緊急地震速報』が 鳴り、ほかの 人の スマホには 通知が 来て いなかった。しょうたいは？",
    opts:[["ほんとうの 地震速報", 0], ["あらかじめ 録音した 音を アラームの 時間に 鳴らした", 1], ["宇宙人の でんぱ", 0]],
    hint:["紘｜近所の スマホに 通知が ない のは ヘンだよね。『この スマホだけ』で 音を 出せる 方法は？"],
    ok:["紘｜録音した 速報の 音を アラームに セットして おいたんだ。時間どおり 鳴る から、本物みたいに 聞こえた！", "なぞ④ 『ゆれと 速報』を とけた！"]});
ksQ("ks5_e", {chk:"k5e", set:"k5e", intro:["多鹿｜あれ…？ 波止美さんと 春鳥さんが いない…！ どこかに 行って しまった みたい です。", "紘｜さっきの ゆれで 分かった 場所に ヒントが あるはず。"],
    q:"ふたりが かくれて いる 場所は？（ヒント：この 家の 床の 下には…）",
    opts:[["ニワトリの 庭園", 0], ["屋根の 上", 0], ["床の 下の 空洞", 1]],
    hint:["紘｜工事の ゆれが 上に つたわった 道すじ。空洞は どこに あった かな？"],
    ok:["波止美｜…ばれちゃった！ 床の 下の 空洞に かくれて いたのよ。", "春鳥｜これは『ドッキリ』だったのか！ すっかり だまされたぞ。", "なぞ⑤ 『きえた ふたり』を とけた！"], done:["波止美｜せまい ところで 肩が こったわ。"]});
ksQ("ks5_f", {chk:"k5f", set:"k5f", intro:["紘｜ぜんぶの しかけを 考えた 人は…。手がかり：『多鹿くんが 電話で 話して いた 相手』『へんそうの 名人』『むかし 事務所で さわぎを 起こした 人』。"],
    q:"ドッキリの しかけにんは？",
    opts:[["康介", 0], ["丹羽鳩子", 1], ["渚", 0]],
    hint:["紘｜へんそうの 名人で、多鹿くんが 電話で 話していた 人。鳥の 名前の 人だよ。"],
    ok:["鳩子｜ふふふ…ばれたわね。そう、多鹿くんと 組んで『ドッキリ 大作戦』を 考えたの。紘さんの 探偵力を 見たくて！", "多鹿｜ごめんなさい、紘さん。電話の 相手は 鳩子さんでした。", "なぞ⑥ 『ドッキリの しかけにん』を とけた！"], done:["鳩子｜つぎは どんな ドッキリが いいかしら？"]});
ksHq("ks5_hq", "内踝", ["k5a", "k5b", "k5c", "k5d", "k5e", "k5f"], ["うごかない 体", "もう ひとりの 波止美さん", "ふった 炭酸", "ゆれと 速報", "きえた ふたり", "ドッキリの しかけにん"],
    ["内踝｜わしは 矢麦内踝（やばくないか）じゃ。この 丹羽鳥島の 家へ ようこそ。『探偵の アルバイト』を して くれるんじゃな？", "内踝｜じつは 家に 手紙が とどいて な。『ふしぎな ことが 起きる』と…。なぞを 6つ といて くれ！", "紘｜{名前}{くん}、いっしょに いこう！"],
    ["内踝｜SPの なぞも ぜんぶ 解決じゃな。ありがとう！ 夕ごはんは からあげ丼の 大盛りじゃ！"]);
RPG_EV.ks5_boss = [rpgS("鳩子", "すごい…！ ぜんぶの なぞを といたわね。さいごに ほんとうの 勝負よ。ドッキリ しかけにんの 全力、うけて みなさい！"),
    ["battle", ["ks5_boss"], [rpgS("鳩子", "…まいったわ。あなたたちなら どんな なぞも だいじょうぶ ね。"), rpgS("多鹿", "ありがとう ございました、紘さん、{名前}さん！"), rpgS("紘", "夏休みの バイト、探偵に しようかな？ …あれ、でも 塾の 先生も 悪くない かも。"),
        rpgN("これで 烏坂探偵事務所の なぞは ぜんぶ かいけつ！『完』")].concat(KEND(60000, "e_ks5", "称号『烏坂探偵事務所の 名探偵』を てにいれた！"))]];
RPG_EV.ks5_enter = [["if", "!ks5_in", [["set", "ks5_in"], rpgN("SP：4月から 専門学校に 通い はじめた 紘は、3か月後 友だちに『探偵の アルバイト』を すすめられ、丹羽鳥島へ やって きた。"), rpgS("紘", "{名前}{くん}、しばらく 手伝って くれる？ 内踝さんに 話しかけて みよう。"), rpgN("（ゆかいな 島の 人たちに 話しかけて、6つの なぞを といて いこう）")], []]];

// ---- 地図
Object.assign(RPG_MAPS, {
    ks1:Object.assign(ksMap("a", [
        NPC("k1_hq", 3, 4, "ks_hatori", "羽鳥彦", "ks1_hq"), NPC("k1_hiro", 5, 9, "ks_hiro", "紘", "ks1_hiro"), NPC("k1_a", 14, 4, "ks_hatoko", "占い師", "ks1_a"), NPC("k1_b", 14, 8, "ks_mag", "大翔", "ks1_b"),
        NPC("k1_c", 10, 6, "ks_girl2", "優", "ks1_c"), NPC("k1_d", 3, 8, "citizen", "工場の人", "ks1_d"), NPC("k1_e", 7, 4, "ks_girl", "愛海", "ks1_e")]), {name:"烏坂探偵事務所①　うらない師の まち"}),
    ks2:Object.assign(ksMap("b", [
        NPC("k2_hq", 3, 5, "ks_hatori", "羽鳥彦", "ks2_hq"), NPC("k2_hiro", 5, 9, "ks_hiro", "紘", "ks2_hiro"), NPC("k2_a", 14, 5, "ks_nagisa", "渚", "ks2_a"), NPC("k2_b", 9, 8, "ks_boy", "布武矢", "ks2_b"),
        NPC("k2_c", 9, 5, "doctor", "数学の 先生", "ks2_c"), NPC("k2_d", 3, 9, "citizen", "担任の 先生", "ks2_d"), NPC("k2_e", 14, 9, "ks_girl2", "南海", "ks2_e")]), {name:"烏坂探偵事務所②　イケメン てんこうせいの 学校"}),
    ks3:Object.assign(ksMap("c", [
        NPC("k3_hq", 3, 5, "ks_taka", "多鹿", "ks3_hq"), NPC("k3_hiro", 5, 9, "ks_hiro", "紘", "ks3_hiro"), NPC("k3_a", 14, 5, "ks_kosuke", "村川", "ks3_a"), NPC("k3_b", 9, 7, "ks_mag", "和音", "ks3_b"),
        NPC("k3_c", 3, 9, "ks_hiro", "紘", "ks3_c"), NPC("k3_d", 14, 9, "ks_kosuke", "司会者", "ks3_d"), NPC("k3_e", 9, 9, "ks_girl2", "玲奈", "ks3_e")]), {name:"烏坂探偵事務所③　マジックショー会場"}),
    ks4:Object.assign(ksMap("d", [
        NPC("k4_hq", 3, 5, "ks_taka", "多鹿", "ks4_hq"), NPC("k4_hiro", 5, 9, "ks_hiro", "紘", "ks4_hiro"), NPC("k4_a", 14, 5, "ks_boy", "晴喜", "ks4_a"), NPC("k4_b", 9, 7, "ks_hatoko", "占い師", "ks4_b"),
        NPC("k4_c", 3, 9, "ks_washi", "鷲郎", "ks4_c"), NPC("k4_d", 14, 9, "ks_nagisa", "渚", "ks4_d"), NPC("k4_e", 9, 9, "ks_girl2", "南海", "ks4_e")]), {name:"烏坂探偵事務所④　さいごの マジック会場"}),
    ks5:Object.assign(ksMap("e", [
        NPC("k5_hq", 3, 4, "ks_elder", "内踝", "ks5_hq"), NPC("k5_hiro", 5, 9, "ks_hiro", "紘", "ks5_hiro"), NPC("k5_a", 7, 4, "ks_elder", "内踝（おやすみ中）", "ks5_a"), NPC("k5_b", 14, 4, "ks_kosuke", "春鳥", "ks5_b"),
        NPC("k5_c", 10, 8, "ks_nagisa", "渚", "ks5_c"), NPC("k5_d", 12, 6, "ks_kosuke", "康介", "ks5_d"), NPC("k5_e", 3, 8, "ks_taka", "多鹿", "ks5_e"), NPC("k5_f", 8, 9, "ks_elderF", "波止美", "ks5_f")]), {name:"烏坂探偵事務所⑤　SP 丹羽鳥島"})
});
// 紘が いつでも ヒントを くれる
const KS_HIRO = (list) => [rpgS("紘", list[0]), rpgS("紘", list[1])];
RPG_EV.ks1_hiro = KS_HIRO(["なぞは ぜんぶ『えらぶ』だけ。まちがえても ヒントが 出るから、なんど でも やりなおせるよ。", "まず 占い師・大翔・優・工場の人・愛海 の 5人に 話しかけよう！"]);
RPG_EV.ks2_hiro = KS_HIRO(["今回の 舞台は 学校。渚さん・布武矢くん・先生・南海さん に 話しかけて みよう。", "ヒントは『数の ならびかた』と『だれが 何を 言ったか』だよ。"]);
RPG_EV.ks3_hiro = KS_HIRO(["マジックの たねは、よく 見ると ぜんぶ 計算か ならびかた。", "村川くん・和音さん・司会者・玲奈さん・ぼく（紘）に 話しかけて ね。"]);
RPG_EV.ks4_hiro = KS_HIRO(["数の マジックは『まんなか』や『足し算』が たね。いっしょに 考えよう。", "晴喜くん・占い師・鷲郎・渚さん・南海さん に 話しかけて みよう！"]);
RPG_EV.ks5_hiro = KS_HIRO(["島の 人たちに 話を 聞こう。なぞは ぜんぶで 6つ。", "内踝・春鳥・渚・康介・多鹿・波止美 に 話しかけて ね。"]);
Object.assign(RPG_ENTER, {ks1:"ks1_enter", ks2:"ks2_enter", ks3:"ks3_enter", ks4:"ks4_enter", ks5:"ks5_enter"});
RPG_ERAS.push(
    {id:"ks1", n:"追加：烏坂探偵事務所① 1〜4話 うらない師と マジックの なぞ〔推奨Lv68〕", map:"ks1", pos:[9, 10], done:"e_ks1", req:"e_future"},
    {id:"ks2", n:"追加：烏坂探偵事務所② 5〜10話 ニセテストの なぞ〔推奨Lv70〕", map:"ks2", pos:[9, 10], done:"e_ks2", req:"e_ks1"},
    {id:"ks3", n:"追加：烏坂探偵事務所③ 11〜15話 マジックショーと てがみ〔推奨Lv72〕", map:"ks3", pos:[9, 10], done:"e_ks3", req:"e_ks2"},
    {id:"ks4", n:"追加：烏坂探偵事務所④ 16〜20話・最終話 さいごの マジック〔推奨Lv74〕", map:"ks4", pos:[9, 10], done:"e_ks4", req:"e_ks3"},
    {id:"ks5", n:"追加：烏坂探偵事務所⑤ SP 丹羽鳥島の ひみつ〔推奨Lv76〕", map:"ks5", pos:[9, 10], done:"e_ks5", req:"e_ks4"}
);
(function(){ const xe = RPG_ERAS.find((e) => e.id === "xr"); if(xe){ RPG_ERAS.splice(RPG_ERAS.indexOf(xe), 1); RPG_ERAS.push(xe); } })();
(function(){
    const F = (k) => () => !!G.S.f[k];
    [["t_ks1", "なぞとき みならい", "烏坂探偵事務所①を クリア", "e_ks1", 800], ["t_ks2", "ニセテスト ばんにん", "烏坂探偵事務所②を クリア", "e_ks2", 800], ["t_ks3", "てがみの なぞ ときびと", "烏坂探偵事務所③を クリア", "e_ks3", 900],
        ["t_ks4", "マジックの たねあかしの 達人", "烏坂探偵事務所④を クリア", "e_ks4", 1000], ["t_ks5", "烏坂探偵事務所の 名探偵", "烏坂探偵事務所⑤（SP）を クリア", "e_ks5", 1500]].forEach((a) => {
        const t = {id:a[0], n:a[1], d:a[2], f:F(a[3]), g:a[4]}; TQ_TITLES.push(t); TQ_TITLE_BY[t.id] = t;
    });
    const all = {id:"t_ks_all", n:"全なぞ かいけつ！", d:"烏坂探偵事務所の 5本ぜんぶを クリア", f:() => ["e_ks1", "e_ks2", "e_ks3", "e_ks4", "e_ks5"].every((k) => !!G.S.f[k]), g:3000}; TQ_TITLES.push(all); TQ_TITLE_BY[all.id] = all;
})();


/* ==== game/gamepad.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[26]=1;
"use strict";
// ===== ゲームを おわる ボタン ＋ コントローラー対応（Switch Proコントローラー／Xbox／PS 等。ブラウザの Gamepad API）=====
(function(){
    // ---- おわる：自動セーブ → BGM停止 →（exe：アプリを終了／web：チャット画面にもどる）。切り分けは mode.js
    function quitNow(){
        if(window.areQuit){ window.areQuit(); return; }
        try{ if(G.S && window.tqAutoSave) tqAutoSave(); }catch(_e){}
        try{ if(window.tqBgmStop) tqBgmStop(); if(window.tqSpeakStop) tqSpeakStop(); }catch(_e){}
        try{ location.href = "https://arechat.github.io/ARE/chat.html"; }catch(_e){}
    }
    ACT.tQuit = ACT.quit = () => {
        const inGame = !!(G.S && G.mode !== "title");
        askYes(window.areQuitText ? window.areQuitText(inGame) : (inGame ? "ここまでの 冒険を 自動で 記録して、\n" : "") + "ゲームを おわりますか？", quitNow);
    };
    const bq = document.getElementById("btnQuit");
    if(bq) bq.addEventListener("click", () => { if(!G.dlg) ACT.quit(); });

    // ---- コントローラー
    // 標準配置: 0=下(Switchの B) 1=右(Switchの A) 2=左(Y) 3=上(X) 4=L 5=R 8=− 9=＋ 12-15=十字キー
    const pressed = {}, nextAt = {};
    let started = false, seen = false, prevDown = [], lastT = 0;
    function fire(k){
        try{ handleKey(k); }catch(e){ console.error("[pad]", e); }
        try{ if(window.tqBgmSync) tqBgmSync(); }catch(_e){}
    }
    function poll(){
        const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
        const now = performance.now();
        const want = {}, down = [], axs = {lx:0, ly:0, rx:0, ry:0};
        for(const gp of pads){
            if(!gp || !gp.connected) continue;
            const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
            const ax = gp.axes || [];
            const lx = ax[0] || 0, ly = ax[1] || 0;
            for(let i = 0; i < 17; i++) if(b(i)) down[i] = true;
            if(Math.abs(lx) > Math.abs(axs.lx)) axs.lx = lx; if(Math.abs(ly) > Math.abs(axs.ly)) axs.ly = ly;
            if(Math.abs(ax[2] || 0) > Math.abs(axs.rx)) axs.rx = ax[2] || 0; if(Math.abs(ax[3] || 0) > Math.abs(axs.ry)) axs.ry = ax[3] || 0;
            if(b(12) || ly < -0.6) want.up = 1;
            if(b(13) || ly > 0.6) want.down = 1;
            if(b(14) || lx < -0.6) want.left = 1;
            if(b(15) || lx > 0.6) want.right = 1;
            if(b(1)) want.ok = 1;                          // A
            if(b(0) || b(2)) want.cancel = 1;              // B / Y
            if(b(3) || b(9)) want.menu = 1;                // X / ＋
            if(b(8)) want.cancel = 1;                      // −
        }
        // ミニゲーム中（AREの達人・シューティング）は 専用の入力（ボタンを そのまま わたす）
        const edge = []; for(let i = 0; i < 17; i++) edge[i] = !!down[i] && !prevDown[i];
        const dtp = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0.016; lastT = now; prevDown = down.slice();
        const hook = window.TQ_PAD && window.TQ_PAD.game;
        if(hook){
            let used = false; try{ used = hook(down, edge, axs, dtp) === true; }catch(e){ console.error("[pad-game]", e); }
            if(used){ ["up", "down", "left", "right", "ok", "cancel", "menu"].forEach((k) => { pressed[k] = want[k] ? 1 : 0; }); requestAnimationFrame(poll); return; }
        }
        ["up", "down", "left", "right", "ok", "cancel", "menu"].forEach((k) => {
            if(want[k]){
                const move = k === "up" || k === "down" || k === "left" || k === "right";
                if(!pressed[k]){ pressed[k] = 1; nextAt[k] = now + 320; fire(k); }
                else if(move && now >= nextAt[k]){ nextAt[k] = now + (G.mode === "map" ? 130 : 200); fire(k); }
            } else pressed[k] = 0;
        });
        requestAnimationFrame(poll);
    }
    function start(){ if(started) return; started = true; requestAnimationFrame(poll); }
    window.addEventListener("gamepadconnected", (e) => {
        start();
        if(!seen){ seen = true; try{ toast("🎮 コントローラーを みつけました！（A=けってい B=もどる X/＋=メニュー）"); }catch(_e){} }
    });
    window.addEventListener("gamepaddisconnected", () => { try{ toast("🎮 コントローラーが はずれました"); }catch(_e){} });
    // すでに つながっていて イベントが来ない場合に そなえて、最初の操作でも調べる
    ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => {
        try{ const l = navigator.getGamepads ? navigator.getGamepads() : []; for(const g of l){ if(g){ start(); return; } } }catch(_e){}
    }, {passive:true}));
    window.TQ_PAD = Object.assign(window.TQ_PAD || {}, {start});
})();


/* ==== game/lucky.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[27]=1;
"use strict";
// ===== レベル上げ・ゴールド稼ぎが しやすい モンスター =====
// 地図2(アカリ市)クリア後：「ラッキーノイズ」が ときどき でる（かんたんに たおせて、けいけんちが おおい）
// 地図4(まっしろルーム)クリア後：「ごほうびノイズ」（けいけんち 大）と「こがねノイズ」（ゴールド 大）も でる
// ※ ボス戦や ストーリーの 戦闘には でません（ふつうの 草むらなどの 戦闘だけ）。強さは いまの レベルに あわせて 毎回つくります。
(function(){
    function mk(id, n, e, lv, expRate, gRate, gBase){
        const need = rpgNeed(Math.min(98, lv));
        RPG_FOES[id] = rpgE(n, e, Math.round(14 + lv * 5), Math.max(2, Math.round(2 + lv * 0.7)), 0,
            Math.max(3, Math.round(need * expRate)), Math.round(gBase + lv * gRate),
            [["ころころ たいあたり", 0, 1, 0.7], ["きらきら ひかる", 1, 0.3, 0.2]], {lucky:true});
    }
    function pickLucky(){
        const S = G.S; if(!S || !window.pkStage) return null;
        const st = pkStage(); if(st < 2 || S.lv >= TQ_MAX_LV) return null;
        const r = G.rnd(), lv = S.lv;
        if(st >= 4){
            if(r < 0.06){ mk("lk_gold", "こがねノイズ", "🪙", lv, 0.12, 250, 300); return "lk_gold"; }
            if(r < 0.14){ mk("lk_super", "ごほうびノイズ", "🌟", lv, 0.9, 120, 300); return "lk_super"; }
        }
        if(r < (st >= 4 ? 0.26 : 0.12)){ mk("lk_lucky", "ラッキーノイズ", "🍀", lv, 0.3, 40, 60); return "lk_lucky"; }
        return null;
    }
    const _enc = encounter;
    encounter = function(){
        let id = null; try{ id = pickLucky(); }catch(e){ console.error("[lucky]", e); }
        if(!id) return _enc.apply(this, arguments);
        const n = G.rnd() < 0.3 ? 2 : 1;
        battleStart(Array(n).fill(id), null);
    };
})();


/* ==== game/pack-casino.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[28]=1;
"use strict";
// ===== 追加パック：カジノ（5ゲーム）=====
// CAS001 アイテム神経衰弱 / CAS002 友披露（大富豪）/ CAS003 タイピングチャレンジ（PCのみ）/ CAS004 AREの達人（リズム）/ CAS005 AREシューティング（2Dシューティング・独自追加）
// どのゲームも「ゲームの結果から」ごほうびを計算する（画面の表示値は信用しない）。コインは 1コイン＝5G。
const PK_SHOOT = {id:"CAS005", name:"AREシューティング", platforms:["PC", "スマートフォン"], type:"shooting", summary:"ノイズの 的を ねらって うつ 的あて シューティング。3ステージ ＋ ボス（マウス・タッチ・コントローラー対応）。むずかしさは 3だんかい。",
    difficulty_levels:[{id:"easy", name:"初級"}, {id:"normal", name:"中級"}, {id:"hard", name:"上級"}]};
const PK_BGM_FILES = ["opening", "field", "town", "sea", "cave", "castle", "demoncastle", "mainbattle", "midboss", "lastboss", "secretboss", "save", "ending"];   // AREの達人の13曲：すでに入っている BGM を そのまま つかう
function pkIsTouch(){ try{ return document.body.classList.contains("touch"); }catch(_e){ return false; } }
function pkCasList(){ return PK.L.games.concat([PK_SHOOT]); }
function pkCasDef(id){ return PK.GM[id] || (id === "CAS005" ? PK_SHOOT : null); }
function pkCasRec(id){ const p = pkS(); return (p.cas[id] = p.cas[id] || {plays:0, best:0, coins:0, items:0, high:0}); }
function pkCasFinish(id, o){
    // o = {coins, items, score, high}
    const p = pkS(), r = pkCasRec(id); r.plays++; r.coins += o.coins || 0; r.items += o.items || 0; r.best = Math.max(r.best, o.score || 0); if(o.high) r.high = 1;
    pkAddCoins(o.coins || 0); p.cnt.casino++; if(id === "CAS004") p.cnt.music++;
    pkQuestTick(); pkAchCheck();
}
function pkBeep(f, d, v){ try{ if(!G.set.voice && !G.set.bgm) return; const A = window.AudioContext || window.webkitAudioContext; if(!A) return; G.ac = G.ac || new A(); const o = G.ac.createOscillator(), g = G.ac.createGain(); o.frequency.value = f; o.type = "square"; g.gain.value = v || 0.04; o.connect(g); g.connect(G.ac.destination); o.start(); o.stop(G.ac.currentTime + (d || 0.06)); }catch(_e){} }
function pkShuffle(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(G.rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------------------------------------------------------------- メニュー
function pkCasMenuHtml(){
    const touch = pkIsTouch();
    return pkCasList().map((g) => {
        const r = pkCasRec(g.id), dis = g.id === "CAS003" && touch;
        const lv = g.difficulty_levels || [{id:"normal", name:"ふつう"}];
        const btns = g.id === "CAS003" ? tyMenuBtns(g, dis) : g.id === "CAS002" ? pkBtn("あそぶ", "cas|" + g.id + "|normal") + pkBtn("ルールせつめい", "cas|" + g.id + "|help", {sub:1}) :
            g.id === "CAS004" ? '<label class="meta">曲：<select id="pkSong">' + g.songs.map((s, i) => '<option value="' + i + '"' + (G.pk.song === i ? " selected" : "") + '>' + (i + 1) + '. ' + esc(s.title) + '（BPM' + s.bpm + '）</option>').join("") + '</select></label> ' + lv.map((d) => pkBtn(esc(d.name), "cas|" + g.id + "|" + d.id, {dis})).join("") :
            lv.map((d) => pkBtn(esc(d.name), "cas|" + g.id + "|" + d.id, {dis})).join("");
        return '<div class="card"><b>' + esc(g.name) + '</b> <span class="meta">' + g.platforms.map((x) => x === "スマートフォン" ? "📱" : "🖥️").join("") + '　あそんだ ' + r.plays + '回・ベスト ' + pkNum(r.best) + '・かせいだ 🪙' + pkNum(r.coins) + (r.high ? '　⭐高評価' : '') + '</span><div class="meta">' + esc(g.summary) + (dis ? '<br>※ このゲームは パソコンの キーボードで あそびます。' : '') + '</div><div class="row">' + btns + '</div></div>';
    }).join("");
}
function pkCasDo(c, a){
    if(c === "cas"){
        const id = a[1], d = a[2], u = G.pk; if(d === "help"){ u.game = {id, help:true}; render(); return true; }
        if(id === "CAS004"){ const sel = $("pkSong"); u.song = sel ? Number(sel.value) : (u.song || 0); }
        const r = pkCasStart(id, d); if(!r.ok){ u.msg = r.msg; } render(); return true;
    }
    if(c === "cflip"){ pkMemFlip(Number(a[1])); return true; }
    if(c === "cdsel"){ pkDfSel(Number(a[1])); return true; }
    if(c === "cdplay"){ pkDfHumanPlay(); return true; }
    if(c === "cdpass"){ pkDfHumanPass(); return true; }
    if(c === "cdopt"){ const g = G.pk.game; if(g && g.opts && g.phase === "setup"){ g.opts[a[1]] = !g.opts[a[1]]; render(); } return true; }
    if(c === "cdgo"){ pkDfBegin(); return true; }
    if(c === "cend"){ const u = G.pk; pkCasAbort(); u.game = null; render(); return true; }
    if(c === "cagain"){ const g = G.pk.game; const id = g.id, d = g.diff; pkCasAbort(); const r = pkCasStart(id, d); if(!r.ok) G.pk.msg = r.msg; render(); return true; }
    if(c === "tgo"){ pkTypeBegin(); return true; }
    if(c === "rgo"){ pkRhBegin(); return true; }
    if(c === "sgo"){ pkShBegin(); return true; }
    if(c === "rhdon"){ pkRhHit("don"); return true; }
    if(c === "rhka"){ pkRhHit("ka"); return true; }
    if(c === "rhrap"){ pkRhHit("rap"); return true; }
    return false;
}
function pkCasStart(id, diff){
    const u = G.pk; pkCasAbort();
    if(id === "CAS003" && pkIsTouch()) return {ok:false, msg:"タイピングチャレンジは パソコンの キーボードで あそぶゲームです。"};
    const token = (u.token = (u.token || 0) + 1);
    if(id === "CAS001") u.game = pkMemNew(diff, token);
    else if(id === "CAS002") u.game = pkDfNew(token);
    else if(id === "CAS003") u.game = pkTypeNew(diff, token);
    else if(id === "CAS004") u.game = pkRhNew(diff, u.song || 0, token);
    else if(id === "CAS005") u.game = pkShNew(diff, token);
    else return {ok:false, msg:"？"};
    return {ok:true};
}
function pkCasAbort(){
    const u = G.pk; if(!u) return; const g = u.game;
    u.token = (u.token || 0) + 1; clearInterval(u.tmr); clearTimeout(u.tm2); if(u.raf) cancelAnimationFrame(u.raf); u.raf = 0;
    if(g && g.audio){ try{ g.audio.pause(); }catch(_e){} g.audio = null; }
    G.pkQuiet = false; try{ if(window.tqBgmSync) tqBgmSync(); }catch(_e){}
    if(u.keyup){ u.keys = {}; }
}
function pkCasGameView(){
    const g = G.pk.game; if(!g) return "";
    if(g.help) return pkDfHelp();
    const head = '<div class="row"><b>' + esc((pkCasDef(g.id) || {}).name || "") + '</b>' + pkBtn("やめる", "cend", {sub:1}) + '</div>';
    if(g.id === "CAS001") return head + pkMemView(g);
    if(g.id === "CAS002") return head + pkDfView(g);
    if(g.id === "CAS003") return head + pkTypeView(g);
    if(g.id === "CAS004") return head + pkRhView(g);
    if(g.id === "CAS005") return head + pkShView(g);
    return head;
}
function pkCasAfterRender(){
    const g = G.pk.game; if(!g) return;
    if(g.id === "CAS003") pkTypeAfter(g); else if(g.id === "CAS004") pkRhAfter(g); else if(g.id === "CAS005") pkShAfter(g);
}
function pkCasKey(k, e){
    const g = G.pk.game; if(!g) return false;
    if(k === "cancel" && g.phase !== "play" && !g.help){ pkCasAbort(); G.pk.game = null; render(); return true; }
    if(g.help && (k === "cancel" || k === "ok")){ G.pk.game = null; render(); return true; }
    if((g.id === "CAS004" || g.id === "CAS005" || g.id === "CAS003") && g.phase === "play"){ if(k === "cancel"){ pkCasAbort(); G.pk.game = null; render(); } else if(k === "ok" && g.id === "CAS004") pkRhHit("rap"); return true; }
    return false;
}
// ---- キーボード（F / J / 矢印 / スペース）
document.addEventListener("keydown", (e) => {
    if(G.mode !== "pack" || !G.pk || !G.pk.game) return; const g = G.pk.game, k = e.key;
    if(g.id === "CAS004" && g.phase === "play"){
        if(e.ctrlKey || e.metaKey || e.altKey) return;
        if(k === "f" || k === "F"){ e.preventDefault(); if(!e.repeat) pkRhHit("don"); }
        else if(k === "j" || k === "J"){ e.preventDefault(); if(!e.repeat) pkRhHit("ka"); }
        else if(k === "Enter"){ e.preventDefault(); e.stopPropagation(); pkRhHit("rap"); }
    }else if(g.id === "CAS005" && g.phase === "play"){
        const m = {ArrowUp:"up", w:"up", W:"up", ArrowDown:"down", s:"down", S:"down", ArrowLeft:"left", a:"left", A:"left", ArrowRight:"right", d:"right", D:"right", " ":"fire"}[k];
        if(m){ e.preventDefault(); e.stopPropagation(); g.keys[m] = true; }
    }
}, true);
document.addEventListener("keyup", (e) => {
    if(G.mode !== "pack" || !G.pk || !G.pk.game || G.pk.game.id !== "CAS005") return; const g = G.pk.game;
    const m = {ArrowUp:"up", w:"up", W:"up", ArrowDown:"down", s:"down", S:"down", ArrowLeft:"left", a:"left", A:"left", ArrowRight:"right", d:"right", D:"right", " ":"fire"}[e.key]; if(m) g.keys[m] = false;
}, true);

// ================================================================ 1. アイテム神経衰弱
function pkCalcMemory(diff, matched, total, timeLeft, limit){
    const base = diff.coin_reward, cleared = matched >= total;
    return cleared ? base + Math.floor(base * 0.5 * Math.max(0, timeLeft) / limit) : Math.floor(base * 0.5 * matched / total);
}
function pkMemNew(did, token){
    const def = PK.GM.CAS001, diff = def.difficulty_levels.find((d) => d.id === did) || def.difficulty_levels[0];
    const pool = pkShuffle(PK.L.items.slice()).slice(0, diff.pair_count), deck = pkShuffle(pool.concat(pool).map((x) => x.id));
    const g = {id:"CAS001", diff:diff.id, d:diff, cards:deck.map((x) => ({id:x, up:false, done:false})), first:-1, lock:false, matched:0, miss:0, left:diff.time_limit_seconds, items:[], phase:"play", token, t0:Date.now(), res:null};
    const u = G.pk; clearInterval(u.tmr);
    u.tmr = setInterval(() => {
        if(!u.game || u.game !== g || u.token !== token || g.phase !== "play") { clearInterval(u.tmr); return; }
        g.left = Math.max(0, g.d.time_limit_seconds - Math.floor((Date.now() - g.t0) / 1000));
        const el = $("pkTimer"); if(el) el.textContent = "のこり " + g.left + "秒";
        if(g.left <= 0) pkMemEnd(g);
    }, 250);
    return g;
}
function pkMemFlip(i){
    const g = G.pk.game; if(!g || g.id !== "CAS001" || g.phase !== "play" || g.lock) return; const c = g.cards[i]; if(!c || c.up || c.done) return;
    c.up = true;
    if(g.first < 0){ g.first = i; render(); return; }
    const a = g.cards[g.first]; const fi = g.first; g.first = -1;
    if(a.id === c.id){
        a.done = c.done = true; g.matched++; g.items.push(c.id); pkGive(c.id, 1); pkBeep(880, 0.08);
        if(g.matched >= g.cards.length / 2){ pkMemEnd(g); return; }
        render(); return;
    }
    g.miss++; g.lock = true; render();
    const tok = g.token; setTimeout(() => { if(G.pk.game !== g || g.token !== tok) return; a.up = false; c.up = false; g.lock = false; render(); }, G.pk.fast ? 0 : 700);
}
function pkMemEnd(g){
    if(g.phase !== "play") return; g.phase = "end"; clearInterval(G.pk.tmr);
    const total = g.cards.length / 2, left = Math.max(0, g.d.time_limit_seconds - Math.floor((Date.now() - g.t0) / 1000)), cleared = g.matched >= total;
    const coins = pkCalcMemory(g.d, g.matched, total, cleared ? left : 0, g.d.time_limit_seconds);
    g.res = {coins, cleared, matched:g.matched, total, miss:g.miss, items:g.items.slice()};
    pkCasFinish("CAS001", {coins, items:g.items.length, score:coins, high:cleared && g.diff === "hard"});
    render();
}
function pkMemView(g){
    if(g.phase === "end"){
        const r = g.res; return '<div class="card"><h3>' + (r.cleared ? "クリア！" : "じかんぎれ…") + '</h3><div>そろえた ペア ' + r.matched + '/' + r.total + '　まちがい ' + r.miss + '回</div><div class="okc">🪙 ' + pkNum(r.coins) + ' コインを てにいれた！</div><div class="meta">てにいれた どうぐ：' + (r.items.map((id) => esc(PK.I[id].name)).join("・") || "なし") + '</div><div class="row">' + pkBtn("もういちど", "cagain") + pkBtn("カジノへ もどる", "cend", {sub:1}) + '</div></div>';
    }
    const cols = g.cards.length <= 12 ? 4 : g.cards.length <= 20 ? 5 : 6;
    return '<div class="meta"><span id="pkTimer">のこり ' + g.left + '秒</span>　そろえた ' + g.matched + '/' + g.cards.length / 2 + '　まちがい ' + g.miss + '　（' + esc(g.d.name) + '：クリアで 🪙' + g.d.coin_reward + '〜）</div><div class="cg" style="grid-template-columns:repeat(' + cols + ',1fr)">' +
        g.cards.map((c, i) => '<button class="mc' + (c.up || c.done ? " up" : "") + (c.done ? " dn" : "") + '" data-a="pk" data-v="cflip|' + i + '"' + (c.done ? " disabled" : "") + '>' + (c.up || c.done ? (PK_IT_ICON[PK.I[c.id].category] || "🎁") + '<small>' + esc(PK.I[c.id].name) + '</small>' : "？") + '</button>').join("") + '</div>';
}

// ================================================================ 2. 友披露（大富豪）
const PK_SUITS = ["♠", "♥", "♦", "♣"];
function pkRankLab(r){ return r === 16 ? "JOKER" : ({11:"J", 12:"Q", 13:"K", 14:"A", 15:"2"})[r] || String(r); }
function pkDfNew(token){ return {id:"CAS002", phase:"setup", opts:{kaidan:false, revo:true, cut8:true, back11:true, skip5:true, rev9:true, bonus12:true, spade3:true}, token}; }
function pkDfDeck(){ const d = []; for(let s = 0; s < 4; s++) for(let r = 3; r <= 15; r++) d.push({s, r}); d.push({s:4, r:16}, {s:4, r:16}); return d; }
function pkDfStr(c, g){ if(c.r === 16) return 99; return g.inv ? 18 - c.r : c.r; }
function pkDfBegin(){
    const g = G.pk.game; if(!g || g.phase !== "setup") return;
    const deck = pkShuffle(pkDfDeck()); g.hands = [[], [], [], []]; deck.forEach((c, i) => g.hands[i % 4].push(c));
    g.hands.forEach((h) => h.sort((a, b) => a.r - b.r || a.s - b.s));
    g.field = null; g.last = -1; g.turn = Math.floor(G.rnd() * 4); g.dir = 1; g.inv = false; g.rev = false; g.back = false; g.passes = 0; g.order = []; g.sel = []; g.log = ["ゲームスタート！"]; g.bonus = 0; g.count = 0; g.phase = "play"; g.hold = false; g.res = null;
    pkDfNext(g);
}
// 出し方の判定。cards：選んだカード。戻り：{ok, kind, n, rank, seq, why}
function pkDfAnalyze(cards){
    const jk = cards.filter((c) => c.r === 16), nj = cards.filter((c) => c.r !== 16);
    if(!cards.length) return {ok:false, why:"カードを えらんでね。"};
    if(!nj.length){ return jk.length <= 2 ? {ok:true, kind:"set", n:cards.length, rank:16, seq:false} : {ok:false, why:"?"}; }
    if(nj.every((c) => c.r === nj[0].r)) return {ok:true, kind:"set", n:cards.length, rank:nj[0].r, seq:false};
    if(!jk.length && cards.length >= 3 && nj.every((c) => c.s === nj[0].s)){
        const rs = nj.map((c) => c.r).sort((a, b) => a - b); let ok = true; for(let i = 1; i < rs.length; i++) if(rs[i] !== rs[i - 1] + 1) ok = false;
        if(ok) return {ok:true, kind:"seq", n:cards.length, rank:rs[0], seq:true, top:rs[rs.length - 1]};
    }
    return {ok:false, why:"その 組みあわせは だせません。"};
}
function pkDfCanPlay(g, cards){
    const a = pkDfAnalyze(cards); if(!a.ok) return a;
    if(a.kind === "seq" && !g.opts.kaidan) return {ok:false, why:"階段は オフです。"};
    const f = g.field; if(!f) return a;
    // スペードの3返し：1まいの ジョーカーには ♠3
    if(g.opts.spade3 && f.n === 1 && f.rank === 16 && a.kind === "set" && a.n === 1 && cards[0].r === 3 && cards[0].s === 0) return Object.assign({}, a, {spade3:true});
    if(a.kind !== f.kind || a.n !== f.n) return {ok:false, why:"場と おなじ まいすう・かたちで だそう。"};
    const sa = a.rank === 16 ? 99 : (g.inv ? 18 - a.rank : a.rank), sf = f.rank === 16 ? 99 : (g.inv ? 18 - f.rank : f.rank);
    if(a.kind === "seq"){ const sa2 = g.inv ? 18 - a.top : a.rank, sf2 = g.inv ? 18 - f.top : f.rank; if(sa2 <= sf2) return {ok:false, why:"場より 強い 階段を！"}; return a; }
    if(sa <= sf) return {ok:false, why:"場より 強い カードを だそう。"};
    return a;
}
function pkDfEnum(g, hand){
    const out = [], by = {};
    hand.forEach((c, i) => { if(c.r === 16) return; (by[c.r] = by[c.r] || []).push(i); });
    hand.forEach((c, i) => out.push([i]));
    Object.keys(by).forEach((r) => { const ix = by[r]; for(let k = 2; k <= ix.length; k++){ const comb = (arr, k2) => k2 === 0 ? [[]] : arr.flatMap((x, j) => comb(arr.slice(j + 1), k2 - 1).map((t) => [x].concat(t))); comb(ix, k).forEach((c2) => out.push(c2)); } });
    if(g.opts.kaidan){
        for(let s = 0; s < 4; s++){ const cs = hand.map((c, i) => ({c, i})).filter((x) => x.c.s === s && x.c.r !== 16).sort((a, b) => a.c.r - b.c.r); for(let i = 0; i < cs.length; i++){ for(let j = i + 2; j < cs.length; j++){ let ok = true; for(let k = i + 1; k <= j; k++) if(cs[k].c.r !== cs[k - 1].c.r + 1) ok = false; if(ok) out.push(cs.slice(i, j + 1).map((x) => x.i)); } } }
    }
    return out.filter((ix) => pkDfCanPlay(g, ix.map((i) => hand[i])).ok);
}
function pkDfLog(g, t){ g.log.push(t); if(g.log.length > 6) g.log.shift(); }
function pkDfActive(g){ return [0, 1, 2, 3].filter((i) => g.hands[i].length > 0); }
function pkDfNextIdx(g, from){ let i = from; for(let k = 0; k < 8; k++){ i = (i + g.dir + 4) % 4; if(g.hands[i].length) return i; } return from; }
function pkDfClear(g, lead){ g.field = null; g.passes = 0; g.back = false; if(g.inv && !g.rev) g.inv = false; g.inv = g.rev; g.turn = g.hands[lead].length ? lead : pkDfNextIdx(g, lead); }
const PK_DF_NAMES = ["あなた", "モモ", "ケン", "ユウ"];
function pkDfPlay(g, who, idxs){
    const hand = g.hands[who], cards = idxs.map((i) => hand[i]), a = pkDfCanPlay(g, cards); if(!a.ok) return a;
    g.count++;
    idxs.slice().sort((x, y) => y - x).forEach((i) => hand.splice(i, 1));
    g.field = {cards, kind:a.kind, n:a.n, rank:a.rank, top:a.top, owner:who}; g.last = who; g.passes = 0; g.hold = false;
    const label = cards.map((c) => c.r === 16 ? "🃏" : PK_SUITS[c.s] + pkRankLab(c.r)).join(" ");
    pkDfLog(g, PK_DF_NAMES[who] + "：" + label);
    const o = g.opts, ranks = cards.filter((c) => c.r !== 16).map((c) => c.r); let clear = false, skip = 0, again = false;
    if(a.spade3){ pkDfLog(g, "♠3返し！ ジョーカーを 返した！"); clear = true; again = true; }
    if(o.cut8 && ranks.includes(8)){ pkDfLog(g, "8切り！ 場が ながれた！"); clear = true; again = true; }
    if(o.back11 && ranks.includes(11) && a.kind === "set"){ g.back = !g.back; g.inv = g.rev !== g.back; pkDfLog(g, "11バック！ 強さが ぎゃくてん！"); }
    if(o.revo && a.kind === "set" && a.n >= 4 && ranks.length >= 4){ g.rev = !g.rev; g.inv = g.rev !== g.back; pkDfLog(g, "かくめい！ 強さが ひっくりかえった！"); }
    if(o.skip5 && ranks.includes(5)) skip = ranks.filter((r) => r === 5).length;
    if(o.rev9 && ranks.includes(9)){ g.dir = -g.dir; pkDfLog(g, "9リバース！ まわる むきが ぎゃくに！"); }
    if(o.bonus12 && ranks.includes(12) && who === 0){ const b = ranks.filter((r) => r === 12).length * 5; g.bonus = Math.min(100, g.bonus + b); pkDfLog(g, "12ボーナス！ +" + b + "コイン"); }
    if(!hand.length){ g.order.push(who); pkDfLog(g, PK_DF_NAMES[who] + " は あがり！（" + g.order.length + "いめ）"); again = false; }
    if(g.order.length >= 3){ const last = pkDfActive(g)[0]; if(last != null) g.order.push(last); pkDfEnd(g); return {ok:true}; }
    if(clear){ pkDfClear(g, who); if(!hand.length) g.turn = pkDfNextIdx(g, who); }
    else { let nxt = who; for(let k = 0; k <= skip; k++) nxt = pkDfNextIdx(g, nxt); if(skip) pkDfLog(g, "5スキップ！"); g.turn = nxt; }
    return {ok:true};
}
function pkDfPass(g, who){
    pkDfLog(g, PK_DF_NAMES[who] + "：パス"); g.passes++;
    const act = pkDfActive(g), need = act.filter((i) => i !== g.last).length;
    if(g.passes >= need){ pkDfLog(g, "みんな パス。場が ながれた。"); pkDfClear(g, g.last); }
    else g.turn = pkDfNextIdx(g, who);
}
function pkDfCpu(g, who){
    const hand = g.hands[who], opts = pkDfEnum(g, hand);
    if(!opts.length){ if(g.field) return pkDfPass(g, who); return pkDfPlay(g, who, [0]); }
    // いちばん弱い 出し方を えらぶ（ときどき パス）
    const score = (ix) => { const cs = ix.map((i) => hand[i]), a = pkDfAnalyze(cs); const r = a.rank === 16 ? 99 : (g.inv ? 18 - a.rank : a.rank); return r * 10 - cs.length * 6; };
    opts.sort((x, y) => score(x) - score(y));
    let pick = opts[0];
    if(g.field && score(pick) > 130 && hand.length > 4 && G.rnd() < 0.45) return pkDfPass(g, who);
    if(g.field && G.rnd() < 0.08 && hand.length > 3) return pkDfPass(g, who);
    pkDfPlay(g, who, pick);
}
function pkDfNext(g){
    if(g.phase !== "play") { render(); return; }
    if(g.count > 900){ g.order = [0, 1, 2, 3].sort((a, b) => g.hands[a].length - g.hands[b].length); pkDfEnd(g); return; }
    if(g.turn === 0){ if(!g.hands[0].length){ g.turn = pkDfNextIdx(g, 0); return pkDfNext(g); }
        if(g.field && !pkDfEnum(g, g.hands[0]).length){   // だせる カードが ないときは じどうで パス
            G.pk.msg = "だせる カードが ないので、じどうで パスします…"; render();
            const tk = g.token; const goPass = () => { if(G.pk.game !== g || g.token !== tk || g.phase !== "play" || g.turn !== 0) return; pkDfPass(g, 0); g.sel = []; G.pk.msg = "パスしました。"; pkDfNext(g); };
            if(G.pk.fast) goPass(); else G.pk.tm2 = setTimeout(goPass, 1000);
            return;
        }
        render(); return; }
    render();
    const tok = g.token; const run = () => { if(G.pk.game !== g || g.token !== tok || g.phase !== "play") return; if(g.turn === 0){ pkDfNext(g); return; } const w = g.turn; pkDfCpu(g, w); pkDfNext(g); };
    if(G.pk.fast) run(); else G.pk.tm2 = setTimeout(run, 650);
}
function pkDfSel(i){ const g = G.pk.game; if(!g || g.phase !== "play" || g.turn !== 0) return; const k = g.sel.indexOf(i); if(k >= 0) g.sel.splice(k, 1); else g.sel.push(i); render(); }
function pkDfHumanPlay(){
    const g = G.pk.game; if(!g || g.phase !== "play" || g.turn !== 0) return;
    const r = pkDfPlay(g, 0, g.sel.slice()); if(!r.ok){ G.pk.msg = r.why || "だせません。"; render(); return; }
    G.pk.msg = ""; g.sel = []; pkDfNext(g);
}
function pkDfHumanPass(){
    const g = G.pk.game; if(!g || g.phase !== "play" || g.turn !== 0) return;
    if(!g.field){ G.pk.msg = "親は パスできません。"; render(); return; }
    pkDfPass(g, 0); g.sel = []; G.pk.msg = ""; pkDfNext(g);
}
function pkDfEnd(g){
    g.phase = "end"; const pay = PK.GM.CAS002.payouts, keys = ["first", "second", "third", "fourth"], place = g.order.indexOf(0), base = pay[keys[place]] || 0;
    const coins = base + g.bonus; g.res = {place:place + 1, coins, base, bonus:g.bonus, order:g.order.slice()};
    pkCasFinish("CAS002", {coins, score:coins, high:place === 0}); render();
}
function pkCard(c, on, idx){
    const red = c.s === 1 || c.s === 2;
    return '<button class="pc' + (red ? " rd" : "") + (on ? " sel" : "") + '" data-a="pk" data-v="cdsel|' + idx + '">' + (c.r === 16 ? "🃏" : PK_SUITS[c.s]) + '<b>' + (c.r === 16 ? "J" : pkRankLab(c.r)) + '</b></button>';
}
function pkDfView(g){
    if(g.phase === "setup"){
        const names = {kaidan:"階段（同じマークで 3まい いじょう つづき）", revo:"革命（4まいで 強さが ぎゃくてん）", cut8:"8切り（場を ながす）", back11:"11バック（強さが 一時的に ぎゃく）", skip5:"5スキップ（次の人を とばす）", rev9:"9リバース（まわる むきが ぎゃく）", bonus12:"12ボーナス（だすたび コイン+5・さいだい100）", spade3:"♠3返し（ジョーカーに ♠3）"};
        return '<div class="card"><b>ルール せってい</b>' + Object.keys(names).map((k) => '<div><label><input type="checkbox" data-a="pk" data-v="cdopt|' + k + '"' + (g.opts[k] ? " checked" : "") + '> ' + esc(names[k]) + '</label></div>').join("") + '<div class="meta">4人たいせん（あなた ＋ CPU3人）。1いは 🪙5000 の ジャックポット！ 2い 500・3い 150・4い 50。</div><div class="row">' + pkBtn("はじめる", "cdgo") + pkBtn("ルールせつめい", "cas|CAS002|help", {sub:1}) + '</div></div>';
    }
    if(g.phase === "end"){
        const r = g.res; return '<div class="card"><h3>' + r.place + 'い！</h3><div>' + r.order.map((i, k) => (k + 1) + 'い ' + PK_DF_NAMES[i]).join('　') + '</div><div class="okc">🪙 ' + pkNum(r.coins) + ' コイン（きほん ' + pkNum(r.base) + (r.bonus ? ' ＋ 12ボーナス ' + r.bonus : '') + '）</div><div class="row">' + pkBtn("もういちど", "cagain") + pkBtn("カジノへ もどる", "cend", {sub:1}) + '</div></div>';
    }
    const f = g.field;
    return '<div class="meta">' + [1, 2, 3].map((i) => PK_DF_NAMES[i] + ' 🂠×' + g.hands[i].length + (g.order.includes(i) ? "（あがり）" : "")).join('　') + '　' + (g.inv ? "【強さ ぎゃくてん中】" : "") + '</div>' +
        '<div class="card pkfield"><div class="meta">場</div><div>' + (f ? f.cards.map((c) => '<span class="pc sm' + (c.s === 1 || c.s === 2 ? " rd" : "") + '">' + (c.r === 16 ? "🃏" : PK_SUITS[c.s] + pkRankLab(c.r)) + '</span>').join("") + ' <span class="meta">（' + PK_DF_NAMES[f.owner] + '）</span>' : '<span class="meta">（なにも ない）</span>') + '</div></div>' +
        '<div class="meta">' + g.log.map(esc).join("　／　") + '</div>' +
        '<div class="card"><div class="meta">あなたの 手ふだ（' + g.hands[0].length + 'まい）' + (g.turn === 0 ? "　👉 あなたの ばん！ カードを えらんで『だす』" : "　（" + PK_DF_NAMES[g.turn] + " の ばん…）") + '</div><div class="hand">' + g.hands[0].map((c, i) => pkCard(c, g.sel.includes(i), i)).join("") + '</div><div class="row">' + pkBtn("だす", "cdplay", {dis:g.turn !== 0 || !g.sel.length}) + pkBtn("パス", "cdpass", {sub:1, dis:g.turn !== 0 || !g.field}) + '</div></div>';
}
function pkDfHelp(){
    return '<div class="row"><b>友披露 ルールせつめい</b>' + pkBtn("とじる", "cend", {sub:1}) + '</div><div class="card meta" style="line-height:1.6">' +
        '・4人で 手札を さきに なくした 人が かち。1人プレイは CPU3人と たいせん。相手の 手札は 見えません。<br>' +
        '・強さ：3＜4＜…＜K＜A＜2＜ジョーカー。場と おなじ まいすうで、より強い カードを だす（1まい・ペア・3まい・4まい）。だせない／だしたくない ときは パス。<br>' +
        '・<b>3の効果</b>：<b>♠3返し</b>…場に ジョーカー1まいが あるとき ♠3 を だすと、ジョーカーを 返して 場が ながれる。<br>' +
        '・<b>5の効果（5スキップ）</b>：5を だすと 次の人を とばす。<b>8の効果（8切り）</b>：8を だすと 場が ながれ、もう一度 じぶんの ばん。<br>' +
        '・<b>9の効果（9リバース）</b>：まわる むきが ぎゃくに なる。<b>11の効果（11バック）</b>：場が ながれるまで 強さが ぎゃくてん。<br>' +
        '・<b>12の効果（12ボーナス）</b>：あなたが 12を だすたび ボーナス コイン +5（さいだい100）。<br>' +
        '・<b>革命</b>：同じ数字を 4まい いっしょに だすと、強さが ひっくりかえる（もう一度 4まいで もとに もどる）。<b>階段</b>：同じ マークで 3まい いじょう 数字が つづく とき（オプション）。<br>' +
        '・4・6・7・10 には とくべつな 効果は ありません。<br>' +
        '・1い 🪙5000／2い 500／3い 150／4い 50。せってい画面で ルールを オン・オフ できます。</div>';
}

// ================================================================ 3. タイピングチャレンジ
const PK_SENT = ["sou iu toki wa are da", "kyou mo ichinichi ganbarou", "are wo tsukatte mirai wo kaeru", "noizu wa kowakunai yo", "tomodachi to issho ni asobou", "kokoro ni nokotta henji wo sagasu", "arigatou wo tsutaeru kiseki", "yume no tsuzuki wo miyou",
    "asa no hikari ga mado ni todoku", "oishii onigiri wo tabeyou", "sora wo tobu kujira no yume", "hoshizora no michi wo aruku", "takoyaki matsuri ni ikou", "hanasaku oka de ohirune", "sakana tachi no parade", "kinoo no hanashi wo shiyou",
    "mou ichido chousen shiyou", "yuuki wo dashite ippo mae he", "minna de kuria wo mezasou", "tanoshii bouken no hajimari", "sono kimochi wo taisetsu ni", "koinune land de aimashou", "tegami no henji wo kakou", "saigo made akiramenai"];
function pkTypeNew(did, token){ const def = PK.GM.CAS003, diff = def.difficulty_levels.find((d) => d.id === did) || def.difficulty_levels[0]; return {id:"CAS003", diff:diff.id, d:diff, phase:"ready", token, list:pkShuffle(PK_SENT.slice()), si:0, pos:0, log:[], left:diff.duration_seconds}; }
function pkTypeBegin(){
    const g = G.pk.game; if(!g || g.id !== "CAS003" || g.phase !== "ready") return;
    g.phase = "play"; g.t0 = performance.now(); g.log = []; g.si = 0; g.pos = 0; const u = G.pk, tok = g.token; clearInterval(u.tmr);
    u.tmr = setInterval(() => { if(G.pk.game !== g || g.token !== tok || g.phase !== "play") { clearInterval(u.tmr); return; } g.left = Math.max(0, g.d.duration_seconds - (performance.now() - g.t0) / 1000); const el = $("pkTimer"); if(el) el.textContent = "のこり " + Math.ceil(g.left) + "秒"; if(g.left <= 0) pkTypeEnd(g); }, 200);
    render();
}
function pkTypeAfter(g){ if(g.phase === "play"){ const el = $("pkTyIn"); if(el){ el.value = g.list[g.si % g.list.length].slice(0, g.pos); el.focus(); } } }
// 入力：1文字ずつ 判定（まとめて ペーストされたら むこう）
function pkTypeInput(val){
    const g = G.pk && G.pk.game; if(!g || g.id !== "CAS003" || g.phase !== "play") return; const el = $("pkTyIn");
    const tgt = g.list[g.si % g.list.length], now = performance.now() - g.t0;
    if(val.length > g.pos + 1){ if(el) el.value = tgt.slice(0, g.pos); g.pasted = (g.pasted || 0) + 1; return; }
    if(val.length < g.pos){ if(el) el.value = tgt.slice(0, g.pos); return; }   // もどる（BackSpace）は むこう
    if(val.length === g.pos) return;
    const ch = val[val.length - 1];
    if(ch === tgt[g.pos]){ g.log.push([Math.round(now), 1]); g.pos++; pkBeep(660, 0.03, 0.02); if(g.pos >= tgt.length){ g.si++; g.pos = 0; if(el) el.value = ""; const t = $("pkTyTarget"); if(t) t.innerHTML = pkTypeTarget(g); return; } }
    else { g.log.push([Math.round(now), 0]); pkBeep(180, 0.05, 0.03); if(el) el.value = tgt.slice(0, g.pos); }
    const t = $("pkTyTarget"); if(t) t.innerHTML = pkTypeTarget(g);
}
// ごほうびの けいさん（ログから 計算しなおす：画面の数字は つかわない）
function pkTypingScore(log, dur, diffId){
    const sc = PK.GM.CAS003.scoring; let correct = 0, miss = 0, last = -1, bad = 0;
    (log || []).forEach((e) => {
        const t = e[0], ok = e[1]; if(typeof t !== "number" || t < 0 || t > dur * 1000 + 500 || t < last){ bad++; return; }
        if(ok === 1 && last >= 0 && t - last < 30){ bad++; last = t; return; }     // 1秒に 33文字より はやい入力は むこう
        last = t; if(ok === 1) correct++; else miss++;
    });
    const total = correct + miss, acc = total ? correct / total * 100 : 0, cpm = correct / dur * 60;
    const base = correct * sc.base_coins_per_correct_character, accB = acc >= sc.accuracy_bonus_threshold_percent && correct > 0 ? sc.accuracy_bonus : 0;
    const spd = sc.speed_bonus_enabled ? Math.min(150, Math.max(0, Math.floor((cpm - 150) / 2))) : 0;
    return {correct, miss, bad, acc, cpm, coins:base + accB + spd, base, accB, spd, high:acc >= 95 && cpm >= 200};
}
function pkTypeEnd(g){
    if(g.phase !== "play") return; g.phase = "end"; clearInterval(G.pk.tmr);
    const r = pkTypingScore(g.log, g.d.duration_seconds, g.diff); if(g.pasted) r.bad += g.pasted;
    const coins = r.bad > 0 && r.correct === 0 ? 0 : r.coins; g.res = Object.assign(r, {coins});
    pkCasFinish("CAS003", {coins, score:r.correct, high:r.high && g.diff !== "easy"}); render();
}
function pkTypeTarget(g){ const t = g.list[g.si % g.list.length]; return '<span class="okc">' + esc(t.slice(0, g.pos)) + '</span><span>' + esc(t.slice(g.pos)) + '</span>'; }
function pkTypeView(g){
    if(g.phase === "ready") return '<div class="card"><b>' + esc(g.d.name) + '</b>（' + g.d.duration_seconds + '秒）<div class="meta">でてくる 文章（ローマ字）を キーボードで そのまま うちこもう。まちがえた キーは カウントされ、正しい キーを うつまで すすみません。<br>ごほうび：せいかいした 文字ごとに 🪙1 ＋ せいかくさ95%いじょうで 🪙100 ＋ はやさボーナス。</div><div class="row">' + pkBtn("スタート！", "tgo") + '</div></div>';
    if(g.phase === "end"){ const r = g.res; return '<div class="card"><h3>けっか</h3><div>せいかい ' + r.correct + '文字　ミス ' + r.miss + '　せいかくさ ' + r.acc.toFixed(1) + '%　スピード ' + Math.round(r.cpm) + '文字/分</div>' + (r.bad ? '<div class="err">むこうな 入力が ' + r.bad + 'こ ありました。</div>' : '') + '<div class="okc">🪙 ' + pkNum(r.coins) + ' コイン（もじ ' + r.base + ' ＋ せいかくボーナス ' + r.accB + ' ＋ はやさ ' + r.spd + '）</div><div class="row">' + pkBtn("もういちど", "cagain") + pkBtn("カジノへ もどる", "cend", {sub:1}) + '</div></div>'; }
    return '<div class="meta"><span id="pkTimer">のこり ' + Math.ceil(g.left) + '秒</span></div><div class="card" style="font-size:2.6cqw;letter-spacing:.2cqw" id="pkTyTarget">' + pkTypeTarget(g) + '</div><input id="pkTyIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:100%;font-size:2.6cqw" data-ty="1">';
}
document.addEventListener("input", (e) => { if(e.target && e.target.id === "pkTyIn") pkTypeInput(e.target.value); });

// ================================================================ 4. AREの達人（リズム）
const PK_RH_PERFECT = 60, PK_RH_GOOD = 130, PK_RH_LEAD = 2.0, PK_RH_LEN = 45;
function pkRhChart(song, diffId){
    let seed = pkHash(song.id + diffId) + 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const spb = 60 / song.bpm, notes = [], dens = {easy:0.5, normal:0.8, hard:0.95}[diffId] || 0.5, step = {easy:1, normal:0.5, hard:0.5}[diffId] || 1;
    let t = PK_RH_LEAD, bar = 0;
    while(t < PK_RH_LEAD + PK_RH_LEN){
        const barStart = t; bar++;
        if(diffId !== "easy" && bar % (diffId === "hard" ? 4 : 6) === 0){ notes.push({t:Math.round(t * 1000) / 1000, k:"rap", len:Math.min(1.2, spb * 2)}); t += spb * 2; continue; }
        for(let i = 0; i < 4 / step; i++){
            const nt = barStart + i * spb * step; if(nt >= PK_RH_LEAD + PK_RH_LEN) break;
            const on = (i === 0) || rnd() < dens - (diffId === "easy" && i % 2 ? 0.35 : 0);
            if(on) notes.push({t:Math.round(nt * 1000) / 1000, k:rnd() < 0.55 ? "don" : "ka"});
        }
        t = barStart + 4 * spb;
    }
    return notes;
}
function pkRhMax(notes){ let s = 0, c = 0; notes.forEach((n) => { if(n.k === "rap") s += 10 * 12; else { c++; s += 100 + Math.min(10, Math.floor(c / 10)); } }); return s; }
function pkRhNew(did, si, token){
    const def = PK.GM.CAS004, song = def.songs[si] || def.songs[0], diff = def.difficulty_levels.find((d) => d.id === did) || def.difficulty_levels[0];
    const notes = pkRhChart(song, diff.id).map((n) => Object.assign({done:false, res:""}, n));
    return {id:"CAS004", diff:diff.id, d:diff, song, si, notes, phase:"ready", token, score:0, combo:0, maxc:0, per:0, good:0, miss:0, rapHits:0, max:pkRhMax(notes), clock:null, flash:"", t0:0};
}
function pkRhBegin(){
    const g = G.pk.game; if(!g || g.id !== "CAS004" || g.phase !== "ready") return;
    g.phase = "play"; g.t0 = performance.now(); G.pkQuiet = true; try{ if(window.tqBgmSync) tqBgmSync(); }catch(_e){}
    try{ const f = PK_BGM_FILES[g.si % PK_BGM_FILES.length]; const a = new Audio("./bgm/" + f + ".mp3"); a.volume = 0.8; a.loop = false; g.audio = a; const pr = a.play(); if(pr && pr.catch) pr.catch(() => { g.audio = null; }); }catch(_e){ g.audio = null; }
    G.pk.raf = requestAnimationFrame(pkRhLoop); render();
}
function pkRhNow(g){ return g.clock != null ? g.clock : (performance.now() - g.t0) / 1000; }
function pkRhAfter(g){ if(g.phase === "play" && !G.pk.raf) G.pk.raf = requestAnimationFrame(pkRhLoop); pkRhDraw(g); }
function pkRhHit(kind){
    const g = G.pk && G.pk.game; if(!g || g.id !== "CAS004" || g.phase !== "play") return null; const t = pkRhNow(g);
    if(kind === "rap"){
        const n = g.notes.find((x) => x.k === "rap" && !x.done && t >= x.t - 0.05 && t <= x.t + x.len + 0.1);
        if(n){ n.hits = (n.hits || 0) + 1; if(n.hits <= 12){ g.score += 10; g.rapHits++; } g.flash = "連打！"; pkBeep(520, 0.02, 0.02); return "rap"; }
        return null;
    }
    let best = null, bd = 1e9;
    g.notes.forEach((n) => { if(n.done || n.k !== kind) return; const d = Math.abs(n.t - t) * 1000; if(d < bd){ bd = d; best = n; } });
    if(!best || bd > PK_RH_GOOD) return null;
    best.done = true; const bonus = Math.min(10, Math.floor((g.combo + 1) / 10));
    if(bd <= PK_RH_PERFECT){ best.res = "perfect"; g.per++; g.score += 100 + bonus; g.flash = "PERFECT"; } else { best.res = "good"; g.good++; g.score += 60 + bonus; g.flash = "GOOD"; }
    g.combo++; g.maxc = Math.max(g.maxc, g.combo); pkBeep(kind === "don" ? 440 : 660, 0.04, 0.03);
    return best.res;
}
function pkRhTick(g){
    const t = pkRhNow(g);
    g.notes.forEach((n) => { if(!n.done){ if(n.k === "rap"){ if(t > n.t + n.len + 0.1) n.done = true; } else if(t > n.t + PK_RH_GOOD / 1000){ n.done = true; n.res = "miss"; g.miss++; g.combo = 0; g.flash = "MISS"; } } });
    const last = g.notes[g.notes.length - 1]; if(g.notes.every((n) => n.done) && t > (last ? last.t : 0) + 1.2) pkRhEnd(g);
}
function pkRhLoop(){
    const u = G.pk; u.raf = 0; const g = u.game; if(!g || g.id !== "CAS004" || g.phase !== "play" || G.mode !== "pack") return;
    pkRhTick(g); if(g.phase !== "play") return; pkRhDraw(g); u.raf = requestAnimationFrame(pkRhLoop);
}
function pkRhRank(g){ const r = g.max ? g.score / g.max : 0; return r >= 0.9 ? "S" : r >= 0.75 ? "A" : r >= 0.55 ? "B" : "C"; }
function pkRhCalc(g){ const base = {easy:40, normal:120, hard:300}[g.diff] || 40, r = g.max ? Math.min(1, g.score / g.max) : 0, rank = pkRhRank(g), full = g.miss === 0 && g.notes.some((n) => n.k !== "rap"); return {coins:Math.round(base * r) + (full ? 50 : 0) + (rank === "S" ? Math.round(base * 0.5) : 0), rank, full}; }
function pkRhEnd(g){
    if(g.phase !== "play") return; g.phase = "end"; if(g.audio){ try{ g.audio.pause(); }catch(_e){} g.audio = null; } G.pkQuiet = false; try{ if(window.tqBgmSync) tqBgmSync(); }catch(_e){}
    const c = pkRhCalc(g); g.res = c; pkCasFinish("CAS004", {coins:c.coins, score:g.score, high:c.rank === "S"}); render();
}
function pkRhDraw(g){
    const cv = $("pkCv"); if(!cv) return; const x = cv.getContext("2d"), W = 640, H = 200, t = pkRhNow(g);
    x.fillStyle = "#101a4a"; x.fillRect(0, 0, W, H); x.fillStyle = "#1c2a70"; x.fillRect(0, 70, W, 70);
    const HX = 110, SPD = 220; x.strokeStyle = "#fff"; x.lineWidth = 3; x.beginPath(); x.arc(HX, 105, 34, 0, 7); x.stroke();
    g.notes.forEach((n) => {
        const nx = HX + (n.t - t) * SPD; if(nx < -80 || nx > W + 80) return;
        if(n.k === "rap"){ const w = n.len * SPD; x.fillStyle = "#fbbf24"; x.fillRect(nx, 85, w, 40); x.fillStyle = "#000"; x.font = "bold 16px sans-serif"; x.fillText("連打！", nx + 6, 111); return; }
        if(n.done && n.res !== "miss") return; x.fillStyle = n.k === "don" ? "#ef4444" : "#3b82f6"; x.beginPath(); x.arc(nx, 105, 26, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "bold 16px sans-serif"; x.textAlign = "center"; x.fillText(n.k === "don" ? "ドン" : "カッ", nx, 111); x.textAlign = "left";
    });
    x.fillStyle = "#fff"; x.font = "bold 18px sans-serif"; x.fillText("SCORE " + g.score + "   COMBO " + g.combo + "   " + (g.flash || ""), 12, 24);
    x.fillStyle = "#fff8"; x.fillRect(0, H - 8, W, 4); x.fillStyle = "#34d399"; x.fillRect(0, H - 8, W * Math.min(1, Math.max(0, (t - PK_RH_LEAD) / PK_RH_LEN)), 4);
}
function pkRhView(g){
    if(g.phase === "ready") return '<div class="card"><b>' + esc(g.song.title) + '</b>　BPM ' + g.song.bpm + '　' + esc(g.d.name) + '<div class="meta">BGM：ゲームの きょく（' + PK_BGM_FILES[g.si % PK_BGM_FILES.length] + '）。ノーツが わっかに かさなったら 入力！<br>🖥️ PC：<b>ドン＝Fキー</b>・<b>カッ＝Jキー</b>・<b>連打＝Enterキー</b>　📱 スマホ：<b>ドン／カッ／連打</b>の ボタンを タッチ　🎮 コントローラー：<b>A＝ドン</b>・<b>B＝カッ</b>・<b>L／R／ZL／ZR＝連打</b>（−／＋＝やめる）<br>ひょうか：PERFECT 100・GOOD 60・MISS 0（コンボで ボーナス）。<br>※ きょくの テンポと ノーツは BPM にあわせて 作っています。</div><div class="row">' + pkBtn("スタート！", "rgo") + '</div></div>';
    if(g.phase === "end"){ const r = g.res; return '<div class="card"><h3>ランク ' + r.rank + (r.full ? "　フルコンボ！" : "") + '</h3><div>スコア ' + g.score + '/' + g.max + '　PERFECT ' + g.per + '・GOOD ' + g.good + '・MISS ' + g.miss + '・さいだいコンボ ' + g.maxc + '</div><div class="okc">🪙 ' + pkNum(r.coins) + ' コイン</div><div class="row">' + pkBtn("もういちど", "cagain") + pkBtn("カジノへ もどる", "cend", {sub:1}) + '</div></div>'; }
    return '<canvas id="pkCv" width="640" height="200" style="width:100%;border-radius:1cqw;touch-action:none"></canvas><div class="row rhpad"><button class="btn rh don" data-rh="don" data-keep="1">ドン</button><button class="btn rh ka" data-rh="ka" data-keep="1">カッ</button><button class="btn rh rap" data-rh="rap" data-keep="1">連打</button></div>';
}
document.addEventListener("pointerdown", (e) => { const b = e.target.closest && e.target.closest("[data-rh]"); if(b){ e.preventDefault(); pkRhHit(b.dataset.rh); } });

// ================================================================ 5. AREシューティング（独自追加）
const PK_SH = {W:640, H:360, T:60};
function pkShNew(did, token){
    const d = PK_SHOOT.difficulty_levels.find((x) => x.id === did) || PK_SHOOT.difficulty_levels[0];
    const cfg = {easy:{spawn:1.1, spd:70, hp:1, shoot:0, lives:5, boss:60, bshoot:1.6}, normal:{spawn:0.8, spd:95, hp:2, shoot:0.0035, lives:4, boss:90, bshoot:1.1}, hard:{spawn:0.5, spd:125, hp:3, shoot:0.008, lives:3, boss:130, bshoot:0.7}}[d.id];
    return {id:"CAS005", diff:d.id, d, cfg, phase:"ready", token, keys:{}, px:60, py:180, lives:cfg.lives, score:0, kills:0, shots:[], foes:[], eshots:[], fx:[], boss:null, t:0, sp:0, fire:0, inv:0, clock:null, res:null, target:null};
}
function pkShBegin(){ const g = G.pk.game; if(!g || g.id !== "CAS005" || g.phase !== "ready") return; g.phase = "play"; g.last = performance.now(); G.pk.raf = requestAnimationFrame(pkShLoop); render(); }
function pkShAfter(g){
    if(g.phase === "play"){ if(!G.pk.raf) G.pk.raf = requestAnimationFrame(pkShLoop); }
    const cv = $("pkCv"); if(cv && !cv._b){ cv._b = 1;
        const mv = (e) => { const r = cv.getBoundingClientRect(); g.target = {x:(e.clientX - r.left) / r.width * PK_SH.W, y:(e.clientY - r.top) / r.height * PK_SH.H}; };
        cv.addEventListener("pointerdown", (e) => { e.preventDefault(); mv(e); try{ cv.setPointerCapture(e.pointerId); }catch(_e){} });
        cv.addEventListener("pointermove", (e) => { if(e.buttons || e.pointerType === "touch") mv(e); });
        cv.addEventListener("pointerup", () => { g.target = null; });
    }
    pkShDraw(g);
}
function pkShStep(g, dt){
    const c = g.cfg; g.t += dt;
    // じぶんの いどう
    const sp = 190; let dx = 0, dy = 0; if(g.keys.left) dx -= 1; if(g.keys.right) dx += 1; if(g.keys.up) dy -= 1; if(g.keys.down) dy += 1;
    if(g.target){ const tx = g.target.x - g.px, ty = g.target.y - g.py, d = Math.hypot(tx, ty); if(d > 4){ dx = tx / d; dy = ty / d; } }
    g.px = Math.max(16, Math.min(PK_SH.W - 16, g.px + dx * sp * dt)); g.py = Math.max(16, Math.min(PK_SH.H - 16, g.py + dy * sp * dt));
    // じどう連射
    g.fire -= dt; if(g.fire <= 0){ g.fire = 0.2; g.shots.push({x:g.px + 14, y:g.py, vx:420}); }
    g.shots.forEach((s) => { s.x += s.vx * dt; }); g.shots = g.shots.filter((s) => s.x < PK_SH.W + 20);
    // てきの しゅつげん
    if(!g.boss && g.t < PK_SH.T){ g.sp -= dt; if(g.sp <= 0){ g.sp = c.spawn * (0.7 + G.rnd() * 0.6); const kind = Math.floor(G.rnd() * 4); g.foes.push({x:PK_SH.W + 20, y:30 + G.rnd() * (PK_SH.H - 60), hp:c.hp + (kind === 3 ? 1 : 0), e:["👾", "🍙", "💾", "🐟"][kind], wob:G.rnd() * 6, spd:c.spd * (0.8 + G.rnd() * 0.5), pts:kind === 3 ? 30 : 10}); } }
    if(!g.boss && g.t >= PK_SH.T){ g.boss = {x:PK_SH.W - 90, y:180, hp:c.boss, max:c.boss, dir:1, fire:1}; }
    g.foes.forEach((f) => { f.x -= f.spd * dt; f.y += Math.sin(g.t * 2 + f.wob) * 40 * dt; if(c.shoot && G.rnd() < c.shoot) g.eshots.push({x:f.x - 10, y:f.y, vx:-170, vy:(g.py - f.y) * 0.25}); });
    g.foes = g.foes.filter((f) => f.x > -30);
    if(g.boss){ const b = g.boss; b.y += b.dir * 70 * dt; if(b.y < 50 || b.y > PK_SH.H - 50) b.dir = -b.dir; b.fire -= dt; if(b.fire <= 0){ b.fire = c.bshoot; for(let k = -1; k <= 1; k++) g.eshots.push({x:b.x - 30, y:b.y, vx:-150, vy:k * 55}); } }
    g.eshots.forEach((s) => { s.x += s.vx * dt; s.y += (s.vy || 0) * dt; }); g.eshots = g.eshots.filter((s) => s.x > -20 && s.y > -20 && s.y < PK_SH.H + 20);
    // あたりはんてい
    g.shots.forEach((s) => { g.foes.forEach((f) => { if(f.hp > 0 && Math.abs(s.x - f.x) < 20 && Math.abs(s.y - f.y) < 20){ f.hp--; s.x = 9999; if(f.hp <= 0){ g.score += f.pts; g.kills++; g.fx.push({x:f.x, y:f.y, t:0.3}); } } }); if(g.boss && Math.abs(s.x - g.boss.x) < 40 && Math.abs(s.y - g.boss.y) < 44){ g.boss.hp--; s.x = 9999; g.score += 2; } });
    g.foes = g.foes.filter((f) => f.hp > 0); g.fx.forEach((f) => { f.t -= dt; }); g.fx = g.fx.filter((f) => f.t > 0);
    g.inv = Math.max(0, g.inv - dt);
    if(g.inv <= 0){
        const hit = g.eshots.some((s) => Math.hypot(s.x - g.px, s.y - g.py) < 12) || g.foes.some((f) => Math.hypot(f.x - g.px, f.y - g.py) < 22) || (g.boss && Math.abs(g.boss.x - g.px) < 36 && Math.abs(g.boss.y - g.py) < 40);
        if(hit){ g.lives--; g.inv = 1.6; g.eshots = []; g.foes = g.foes.filter((f) => Math.hypot(f.x - g.px, f.y - g.py) > 60); pkBeep(120, 0.15, 0.05); }
    }
    if(g.boss && g.boss.hp <= 0){ g.score += 300; pkShEnd(g, true); } else if(g.lives <= 0) pkShEnd(g, false);
}
function pkShLoop(now){
    const u = G.pk; u.raf = 0; const g = u.game; if(!g || g.id !== "CAS005" || g.phase !== "play" || G.mode !== "pack") return;
    const dt = Math.min(0.05, (now - g.last) / 1000); g.last = now; pkShStep(g, dt); if(g.phase !== "play") return; pkShDraw(g);
    u.raf = requestAnimationFrame(pkShLoop);
}
function pkShCalc(g, cleared){ const k = {easy:1, normal:2, hard:4}[g.diff], clr = {easy:30, normal:90, hard:250}[g.diff]; return {coins:g.kills * k + (cleared ? clr : 0) + g.lives * 10 * (cleared ? 1 : 0), cleared}; }
function pkShEnd(g, cleared){
    if(g.phase !== "play") return; g.phase = "end"; const r = pkShCalc(g, cleared); g.res = r;
    pkCasFinish("CAS005", {coins:r.coins, score:g.score, high:cleared && g.diff === "hard"}); render();
}
function pkShDraw(g){
    const cv = $("pkCv"); if(!cv) return; const x = cv.getContext("2d");
    x.fillStyle = "#070d2e"; x.fillRect(0, 0, 640, 360);
    for(let i = 0; i < 40; i++){ const sx = ((i * 97 - g.t * (20 + (i % 5) * 12)) % 640 + 640) % 640, sy = (i * 53) % 360; x.fillStyle = "#fff8"; x.fillRect(sx, sy, 2, 2); }
    x.textAlign = "center"; x.textBaseline = "middle";
    if(g.inv <= 0 || Math.floor(g.t * 10) % 2){ x.font = "28px serif"; x.fillText("🚀", g.px, g.py); }
    x.fillStyle = "#7dffb0"; g.shots.forEach((s) => x.fillRect(s.x - 6, s.y - 1.5, 12, 3));
    x.font = "26px serif"; g.foes.forEach((f) => x.fillText(f.e, f.x, f.y));
    x.fillStyle = "#ff6b6b"; g.eshots.forEach((s) => { x.beginPath(); x.arc(s.x, s.y, 4, 0, 7); x.fill(); });
    g.fx.forEach((f) => { x.font = "26px serif"; x.fillText("💥", f.x, f.y); });
    if(g.boss){ x.font = "72px serif"; x.fillText("👑", g.boss.x, g.boss.y); x.fillStyle = "#333"; x.fillRect(200, 8, 240, 8); x.fillStyle = "#f87171"; x.fillRect(200, 8, 240 * Math.max(0, g.boss.hp) / g.boss.max, 8); }
    x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = "#fff"; x.font = "bold 16px sans-serif"; x.fillText("SCORE " + g.score + "　❤️×" + g.lives + "　" + (g.boss ? "BOSS!" : "のこり " + Math.max(0, Math.ceil(PK_SH.T - g.t)) + "秒"), 10, 350);
}
function pkShView(g){
    if(g.phase === "ready") return '<div class="card"><b>' + esc(g.d.name) + '</b><div class="meta">ノイズの 群れを うちおとして、60秒後に あらわれる ボスを たおそう！ じどうで 弾が でます。<br>🖥️ PC：<b>矢印キー／WASD</b> で いどう　📱 スマホ：<b>画面を ドラッグ</b> で いどう<br>ごほうび：たおした 数 × ' + ({easy:1, normal:2, hard:4}[g.diff]) + ' ＋ ボスげきは ボーナス（ライフが のこるほど おおい）</div><div class="row">' + pkBtn("スタート！", "sgo") + '</div></div>';
    if(g.phase === "end"){ const r = g.res; return '<div class="card"><h3>' + (r.cleared ? "ボスげきは！ クリア！" : "ゲームオーバー…") + '</h3><div>スコア ' + g.score + '　たおした数 ' + g.kills + '</div><div class="okc">🪙 ' + pkNum(r.coins) + ' コイン</div><div class="row">' + pkBtn("もういちど", "cagain") + pkBtn("カジノへ もどる", "cend", {sub:1}) + '</div></div>'; }
    return '<canvas id="pkCv" width="640" height="360" style="width:100%;border-radius:1cqw;touch-action:none"></canvas>';
}


/* ==== game/typing2.js ==== */
;(window.__AREB_S||(window.__AREB_S=[]))[29]=1;
"use strict";
// ===== タイピングチャレンジ（作り直し）=====
// ジャンル：モンスター名／会話文／仲間キャラ／ランダム　×　むずかしさ：かんたん／ふつう／むずかしい／ランダム
// 文章（ローマ字）は これまでと同じ。画面には 日本語 と ローマ字 の りょうほうを 出す。ごほうび計算は pack-casino.js の pkTypingScore のまま。
const TY_CATS = [{id:"mon", n:"👾 モンスター名"}, {id:"talk", n:"💬 会話文"}, {id:"mate", n:"🧑‍🤝‍🧑 仲間キャラ"}, {id:"rand", n:"🎲 ランダム"}];
const TY_DIFFS = [{id:"easy", n:"かんたん"}, {id:"normal", n:"ふつう"}, {id:"hard", n:"むずかしい"}, {id:"random", n:"ランダム"}];
const TY_TALK = [
    ["そういうときは、AREだ！", "sou iu toki wa are da"], ["今日も一日がんばろう", "kyou mo ichinichi ganbarou"], ["AREを使って未来を変える", "are wo tsukatte mirai wo kaeru"],
    ["ノイズはこわくないよ", "noizu wa kowakunai yo"], ["友だちといっしょに遊ぼう", "tomodachi to issho ni asobou"], ["心に残った返事をさがす", "kokoro ni nokotta henji wo sagasu"],
    ["ありがとうを伝える奇跡", "arigatou wo tsutaeru kiseki"], ["夢の続きを見よう", "yume no tsuzuki wo miyou"], ["朝の光が窓に届く", "asa no hikari ga mado ni todoku"],
    ["おいしいおにぎりを食べよう", "oishii onigiri wo tabeyou"], ["空を飛ぶくじらの夢", "sora wo tobu kujira no yume"], ["星空の道を歩く", "hoshizora no michi wo aruku"],
    ["たこ焼き祭りに行こう", "takoyaki matsuri ni ikou"], ["花咲く丘でお昼寝", "hanasaku oka de ohirune"], ["魚たちのパレード", "sakana tachi no parade"],
    ["昨日の話をしよう", "kinoo no hanashi wo shiyou"], ["もう一度挑戦しよう", "mou ichido chousen shiyou"], ["勇気を出して一歩前へ", "yuuki wo dashite ippo mae he"],
    ["みんなでクリアをめざそう", "minna de kuria wo mezasou"], ["楽しい冒険の始まり", "tanoshii bouken no hajimari"], ["その気持ちを大切に", "sono kimochi wo taisetsu ni"],
    ["コイヌネランドで会いましょう", "koinune land de aimashou"], ["手紙の返事を書こう", "tegami no henji wo kakou"], ["最後まであきらめない", "saigo made akiramenai"]];
const TY_MATE_NAMES = [["ハルキ", "haruki"], ["アキト", "akito"], ["海斗", "kaito"], ["亜理紗", "arisa"], ["蒼太", "souta"], ["紘", "hiro"], ["ミナ", "mina"], ["ミラ", "mira"], ["玲也", "reiya"], ["羽奈", "hana"], ["りかり", "rikari"], ["ゆうざいくん", "yuuzaikun"], ["さえこ", "saeko"], ["健斗", "kento"]];
const TY_MATE_LINES = [
    ["アキト「そういうときは、AREだ！」", "akito sou iu toki wa are da"], ["アキト「ゲートを 守る！」", "akito geeto wo mamoru"], ["ハルキ「バックアップは まかせろ」", "haruki bakkuappu wa makasero"],
    ["ハルキ「おつかれ」", "haruki otsukare"], ["海斗「頭脳 貸すよ！」", "kaito zunou kasu yo"], ["海斗「XRグラスで 見えるんだ」", "kaito xr gurasu de mieru nda"],
    ["亜理紗「応援してる！」", "arisa ouen shiteru"], ["亜理紗「みんな ARE 使ってるよ」", "arisa minna are tsukatteru yo"], ["蒼太「だいじょうぶ。いっしょに行こう」", "souta daijoubu issho ni ikou"],
    ["紘「ひとつずつ 考えよう」", "hiro hitotsu zutsu kangaeyou"], ["ミナ「おにぎり あるよ♪」", "mina onigiri aru yo"], ["ミラ「ひとりじゃ ないよ」", "mira hitori ja nai yo"],
    ["羽奈「きょうも いい天気！」", "hana kyou mo ii tenki"], ["りかり「作戦会議だよ！」", "rikari sakusen kaigi da yo"], ["ゆうざいくん「いい作戦だね」", "yuuzaikun ii sakusen da ne"]];

// ---- かな → ローマ字（モンスター名用）
const TY_K = {あ:"a", い:"i", う:"u", え:"e", お:"o", か:"ka", き:"ki", く:"ku", け:"ke", こ:"ko", さ:"sa", し:"shi", す:"su", せ:"se", そ:"so", た:"ta", ち:"chi", つ:"tsu", て:"te", と:"to", な:"na", に:"ni", ぬ:"nu", ね:"ne", の:"no",
    は:"ha", ひ:"hi", ふ:"fu", へ:"he", ほ:"ho", ま:"ma", み:"mi", む:"mu", め:"me", も:"mo", や:"ya", ゆ:"yu", よ:"yo", ら:"ra", り:"ri", る:"ru", れ:"re", ろ:"ro", わ:"wa", を:"wo", ん:"n",
    が:"ga", ぎ:"gi", ぐ:"gu", げ:"ge", ご:"go", ざ:"za", じ:"ji", ず:"zu", ぜ:"ze", ぞ:"zo", だ:"da", ぢ:"ji", づ:"zu", で:"de", ど:"do", ば:"ba", び:"bi", ぶ:"bu", べ:"be", ぼ:"bo", ぱ:"pa", ぴ:"pi", ぷ:"pu", ぺ:"pe", ぽ:"po", ゔ:"vu"};
function tyRomaji(src){
    const s = String(src).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)), out = []; let dbl = false;
    for(const ch of s){
        if(ch === "・" || ch === " " || ch === "　"){ out.push(" "); continue; }
        if(/[A-Za-z0-9]/.test(ch)){ out.push(ch.toLowerCase()); continue; }
        if(ch === "ー"){ out.push("-"); continue; }
        if(ch === "っ"){ dbl = true; continue; }
        const small = "ゃゅょぁぃぅぇぉ".indexOf(ch);
        if(small >= 0){
            const prev = out.pop() || "";
            const vv = ch === "ゃ" ? "a" : ch === "ゅ" ? "u" : ch === "ょ" ? "o" : "aiueo"["ぁぃぅぇぉ".indexOf(ch)] || "a";
            if(ch === "ゃ" || ch === "ゅ" || ch === "ょ") out.push(/(shi|chi|ji)$/.test(prev) ? prev.slice(0, -1) + vv : prev.replace(/i$/, "") + "y" + vv);
            else out.push(prev === "u" && vv !== "a" && vv !== "u" ? "w" + vv : prev === "fu" ? "f" + vv : prev === "vu" ? "v" + vv : /(te|de)$/.test(prev) && vv === "i" ? prev.slice(0, -1) + "i" : prev.replace(/[aiueo]$/, "") + vv);
            continue;
        }
        const r = TY_K[ch]; if(!r) return null;
        out.push(dbl ? r[0] + r : r); dbl = false;
    }
    return out.join("").replace(/\s+/g, " ").trim();
}
// ---- 文章の しなぞろえ
let TY_POOL = null;
function tyBuild(){
    const mon = [];
    try{ ((window.PK && PK.L && PK.L.monsters) || []).forEach((m) => { const r = tyRomaji(m.name); if(r && /^[a-z0-9\- ]+$/.test(r) && r.length >= 3 && r.length <= 30) mon.push([m.name, r]); }); }catch(_e){}
    try{ Object.keys(RPG_FOES).forEach((k) => { const f = RPG_FOES[k], r = f && f.n ? tyRomaji(f.n) : null; if(r && /^[a-z0-9\- ]+$/.test(r) && r.length >= 3 && r.length <= 30) mon.push([f.n, r]); }); }catch(_e){}
    const seen = {}, mons = mon.filter((x) => (seen[x[1]] ? false : (seen[x[1]] = 1)));
    const byLen = (a, lo, hi) => a.filter((x) => x[1].length >= lo && x[1].length <= hi);
    const talkS = TY_TALK.slice().sort((a, b) => a[1].length - b[1].length), mateAll = TY_MATE_NAMES.concat(TY_MATE_LINES);
    TY_POOL = {
        mon:{easy:byLen(mons, 3, 8), normal:byLen(mons, 9, 13), hard:byLen(mons, 14, 30)},
        talk:{easy:talkS.slice(0, 10), normal:talkS.slice(8), hard:null},
        mate:{easy:TY_MATE_NAMES, normal:TY_MATE_LINES.filter((x) => x[1].length <= 26), hard:TY_MATE_LINES.filter((x) => x[1].length > 26), all:mateAll}
    };
    ["easy", "normal", "hard"].forEach((d) => { if(!TY_POOL.mon[d].length) TY_POOL.mon[d] = mons.slice(); });
    if(!TY_POOL.mate.hard.length) TY_POOL.mate.hard = TY_MATE_LINES.slice();
    TY_POOL.mons = mons;
}
function tyPick(arr){ return arr[Math.floor(G.rnd() * arr.length)]; }
function tyNext(g){
    if(!TY_POOL) tyBuild();
    const cat = g.cat === "rand" ? tyPick(["mon", "talk", "mate"]) : g.cat, dif = g.diff === "random" ? tyPick(["easy", "normal", "hard"]) : g.diff;
    let p;
    if(cat === "talk" && dif === "hard"){ const a = tyPick(TY_TALK); let b = tyPick(TY_TALK); if(b === a) b = TY_TALK[(TY_TALK.indexOf(a) + 7) % TY_TALK.length]; p = [a[0] + "　" + b[0], a[1] + " " + b[1]]; }
    else if(cat === "mon" && dif === "hard" && G.rnd() < 0.5){ const a = tyPick(TY_POOL.mon.normal); let b = tyPick(TY_POOL.mon.normal); if(b === a) b = tyPick(TY_POOL.mon.easy); p = [a[0] + "　" + b[0], a[1] + " " + b[1]]; }
    else{ const L = TY_POOL[cat][dif]; p = tyPick(L && L.length ? L : TY_POOL[cat].normal); }
    if(g.cur && p[1] === g.cur[1]) p = tyPick((TY_POOL[cat].normal || []).concat(TY_POOL.mons));
    g.cur = p; g.pos = 0; g.curTag = TY_CATS.find((c) => c.id === cat).n + "・" + TY_DIFFS.find((d) => d.id === dif).n;
}
// ---- メニュー（ジャンル ＋ むずかしさ 4つ）
function tyMenuBtns(g, dis){
    const sel = G.pk.tyCat || "mon";
    return '<label class="meta">ジャンル：<select id="pkTyCat">' + TY_CATS.map((c) => '<option value="' + c.id + '"' + (sel === c.id ? " selected" : "") + '>' + c.n + '</option>').join("") + '</select></label> ' +
        TY_DIFFS.map((d) => pkBtn(d.n, "cas|CAS003|" + d.id, {dis})).join("");
}
(function(){
    const _do = pkCasDo;
    pkCasDo = function(c, a){
        if(c === "cas" && a[1] === "CAS003" && a[2] !== "help"){ const el = $("pkTyCat"); if(el) G.pk.tyCat = el.value; }
        return _do.apply(this, arguments);
    };
})();
// ---- ゲーム本体
pkTypeNew = function(did, token){
    const def = PK.GM.CAS003, lv = def.difficulty_levels, d0 = lv.find((x) => x.id === did) || lv[1];
    const label = (TY_DIFFS.find((x) => x.id === did) || TY_DIFFS[3]).n;
    const g = {id:"CAS003", diff:did || "random", d:Object.assign({}, d0, {name:label}), cat:(G.pk && G.pk.tyCat) || "mon", phase:"ready", token, pos:0, log:[], left:d0.duration_seconds, cur:null};
    if(!TY_POOL) tyBuild(); tyNext(g); return g;
};
pkTypeAfter = function(g){ if(g.phase === "play"){ const el = $("pkTyIn"); if(el){ el.value = g.cur[1].slice(0, g.pos); el.focus(); } } };
pkTypeInput = function(val){
    const g = G.pk && G.pk.game; if(!g || g.id !== "CAS003" || g.phase !== "play") return; const el = $("pkTyIn");
    const tgt = g.cur[1], now = performance.now() - g.t0;
    if(val.length > g.pos + 1){ if(el) el.value = tgt.slice(0, g.pos); g.pasted = (g.pasted || 0) + 1; return; }
    if(val.length < g.pos){ if(el) el.value = tgt.slice(0, g.pos); return; }
    if(val.length === g.pos) return;
    const ch = val[val.length - 1];
    if(ch === tgt[g.pos]){
        g.log.push([Math.round(now), 1]); g.pos++; pkBeep(660, 0.03, 0.02);
        if(g.pos >= tgt.length){ g.words = (g.words || 0) + 1; tyNext(g); if(el) el.value = ""; const t = $("pkTyBox"); if(t) t.innerHTML = tyTarget(g); return; }
    }else{ g.log.push([Math.round(now), 0]); pkBeep(180, 0.05, 0.03); if(el) el.value = tgt.slice(0, g.pos); }
    const t = $("pkTyBox"); if(t) t.innerHTML = tyTarget(g);
};
function tyTarget(g){
    const ro = g.cur[1];
    return '<div class="meta">' + esc(g.curTag || "") + '</div><div style="font-size:3.2cqw;font-weight:bold;margin:.6cqw 0">' + esc(g.cur[0]) + '</div>' +
        '<div style="font-size:2.6cqw;letter-spacing:.2cqw;font-family:monospace;white-space:pre-wrap"><span class="okc">' + esc(ro.slice(0, g.pos)) + '</span><span>' + esc(ro.slice(g.pos)) + '</span></div>';
}
pkTypeTarget = function(g){ return tyTarget(g); };
pkTypeView = function(g){
    const cat = TY_CATS.find((c) => c.id === g.cat) || TY_CATS[0];
    if(g.phase === "ready") return '<div class="card"><b>' + esc(cat.n) + '</b>　むずかしさ：<b>' + esc(g.d.name) + '</b>（' + g.d.duration_seconds + '秒）<div class="meta">上に でる 日本語を、下の ローマ字どおりに キーボードで うちこもう。まちがえた キーは ミスに なり、正しい キーを うつまで すすみません。ローマ字は スペースも いれてね。<br>ごほうび：せいかいした 文字ごとに 🪙1 ＋ せいかくさ95%いじょうで 🪙100 ＋ はやさボーナス。「ランダム」は 1もんごとに かわるよ。</div><div class="row">' + pkBtn("スタート！", "tgo") + '</div></div>';
    if(g.phase === "end"){ const r = g.res; return '<div class="card"><h3>けっか</h3><div>' + esc(cat.n) + '・' + esc(g.d.name) + '　うちきった もんだい ' + (g.words || 0) + '</div><div>せいかい ' + r.correct + '文字　ミス ' + r.miss + '　せいかくさ ' + r.acc.toFixed(1) + '%　スピード ' + Math.round(r.cpm) + '文字/分</div>' + (r.bad ? '<div class="err">むこうな 入力が ' + r.bad + 'こ ありました。</div>' : '') + '<div class="okc">🪙 ' + pkNum(r.coins) + ' コイン（もじ ' + r.base + ' ＋ せいかくボーナス ' + r.accB + ' ＋ はやさ ' + r.spd + '）</div><div class="row">' + pkBtn("もういちど", "cagain") + pkBtn("カジノへ もどる", "cend", {sub:1}) + '</div></div>'; }
    return '<div class="meta"><span id="pkTimer">のこり ' + Math.ceil(g.left) + '秒</span></div><div class="card" id="pkTyBox">' + tyTarget(g) + '</div><input id="pkTyIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:100%;font-size:2.6cqw" data-ty="1">';
};

