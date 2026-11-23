// ===== 画面（HUD・会話・メニュー）。DOM だけ。エンジンには ふれない =====
import {ATTRACTIONS, STAMPS, AREA_NAMES} from "./df-data.js";
const $ = (id) => document.getElementById(id);
export class UI{
    constructor(){
        this.dlg = null; this.modal = null; this.kp = null; this.toastT = null; this.lastArea = "";
        this.el = {hud: $("hud"), area: $("areaName"), stamps: $("hudStamps"), coins: $("hudCoins"), obj: $("hudObj"), prompt: $("prompt"), toast: $("toast"), dlg: $("dlg"), dname: $("dlgName"), dtext: $("dlgText"), modal: $("modal"), ride: $("rideHud"), rideName: $("rideName"), rideInfo: $("rideInfo"), frame: $("vehicle"), fade: $("fade"), cross: $("cross"), gfx: $("gfx")}; this.gfxKey = "";
    }
    bind(){ this.el.dlg.addEventListener("click", () => this.advance()); this.el.dlg.addEventListener("touchend", (e) => { e.preventDefault(); this.advance(); }); }
    busy(){ return !!(this.dlg || this.modal); }
    toast(t, ms){ const e = this.el.toast; e.textContent = t; e.classList.add("on"); clearTimeout(this.toastT); this.toastT = setTimeout(() => e.classList.remove("on"), ms || 3400); }
    area(n){ const e = this.el.area; e.textContent = n; e.classList.remove("show"); void e.offsetWidth; e.classList.add("show"); }
    hud(g){
        this.el.stamps.textContent = g.count() + " / " + STAMPS.length; this.el.coins.textContent = g.sv.coins;
        const o = g.objective(); this.el.obj.textContent = o ? "▶ " + o.text : "";
        const n = g.near; this.el.prompt.textContent = (!this.busy() && n && g.mode === "walk") ? "［E］ " + n.label : ""; this.el.prompt.classList.toggle("on", !!this.el.prompt.textContent);
        const ba = $("bAuto"); if(ba){ const on = !!g.auto.on; if(ba.dataset.on !== (on ? "1" : "0")){ ba.dataset.on = on ? "1" : "0"; ba.classList.toggle("on", on); ba.textContent = on ? "⏸ オートプレイ中" : "▶ オートプレイ"; } }
        this.el.cross.style.display = g.mode === "ride" && (g.ride.a.kind === "shoot" || (g.ride.A && g.ride.A.shoot)) ? "block" : "none";
    }
    // 会話
    say(name, lines, done){ this.dlg = {name, lines: lines.slice(), i: 0, done}; this.el.dlg.classList.add("on"); this.show(); }
    show(){ const d = this.dlg; this.el.dname.textContent = d.name; this.el.dtext.textContent = d.lines[d.i] + (d.i < d.lines.length - 1 ? "  ▼" : "  ■"); }
    advance(){ const d = this.dlg; if(!d) return; if(++d.i >= d.lines.length){ this.el.dlg.classList.remove("on"); this.dlg = null; d.done && d.done(); } else this.show(); }
    // モーダル（メニュー・スタンプ帳・証明書・キーパッド）
    open(html, onClose){ this.modal = {onClose}; this.el.modal.innerHTML = "<div class='card'>" + html + "<div class='row'><button id='mClose'>とじる</button></div></div>"; this.el.modal.classList.add("on"); $("mClose").onclick = () => this.close(); }
    close(){ if(!this.modal) return; const m = this.modal; this.modal = null; this.el.modal.classList.remove("on"); this.el.modal.innerHTML = ""; m.onClose && m.onClose(); }
    // 瞬間移動：行き先（すべてのアトラクションの 入口）を えらぶ
    showTeleport(g, go){
        const groups = {}; g.tpList().forEach((a) => { (groups[a.area] = groups[a.area] || []).push(a); });
        let h = "<h2>🌀 瞬間移動</h2><p class='hint'>行き先を えらぶと、そのアトラクションの 入口まで 一しゅんで とぶよ。（✓＝スタンプ ずみ）</p><div class='tp'>";
        Object.keys(AREA_NAMES).forEach((k) => {
            if(!groups[k]) return;
            h += "<h3>" + AREA_NAMES[k] + "</h3><div class='tpg'>" + groups[k].map((a) => "<button type='button' data-tp='" + a.id + "'>" + (g.sv.stamps[a.id] ? "✓ " : "") + a.n + "</button>").join("") + "</div>";
        });
        this.open(h + "</div>");
        this.el.modal.querySelectorAll("[data-tp]").forEach((b) => b.onclick = () => { const id = b.dataset.tp; this.close(); go(id); });
    }
    showStamps(g){
        const rows = ATTRACTIONS.map((a) => "<li class='" + (g.sv.stamps[a.id] ? "got" : "") + "'><b>" + (g.sv.stamps[a.id] ? "🏅" : "⬜") + " " + a.n + "</b><small>" + AREA_NAMES[a.area] + " ／ " + a.desc + "</small></li>").join("");
        this.open("<h2>スタンプちょう　" + g.count() + " / " + STAMPS.length + "</h2><ul class='stamps'>" + rows + "</ul><p class='hint'>ぜんぶ そろえると「全制覇しょうめいしょ」が もらえるよ。</p>");
    }
    cert(g){
        const name = (new URLSearchParams(location.search).get("name")) || "あなた"; const d = new Date(); const ds = d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
        this.open("<div class='cert'><div class='ct'>全制覇しょうめいしょ</div><p class='cn'>" + name.replace(/[<>&]/g, "") + " さま</p><p>ドリーム・フロンティアの アトラクション ぜんぶ（" + STAMPS.length + "こ）を 制覇しました。<br>ここに その ゆうきと すきな きもちを たたえます。</p><p class='cd'>" + ds + "　ドリーム・フロンティア</p><div class='are'>A R E</div></div>", () => this.toast("ふんすいの うえで「A R E」が かがやいている…"));
    }
    keypad(check){
        let v = ""; this.open("<h2>きんこ</h2><div id='kpv' class='kpv'>_ _ _</div><div class='kp'>" + [1, 2, 3, 4, 5, 6, 7, 8, 9, "←", 0, "OK"].map((k) => "<button data-k='" + k + "'>" + k + "</button>").join("") + "</div><p class='hint'>3けたの ばんごう。 やかたの てがかりを おもいだそう。</p>");
        const upd = () => { $("kpv").textContent = (v + "___").slice(0, 3).split("").join(" "); };
        this.el.modal.querySelectorAll("[data-k]").forEach((b) => b.onclick = () => { const k = b.dataset.k; if(k === "←") v = v.slice(0, -1); else if(k === "OK"){ if(v.length === 3){ const ok = check(v); if(ok){ this.close(); return; } else { v = ""; } } } else if(v.length < 3) v += k; upd(); });
    }
    menu(g, cb){
        const bgmValue = Math.round(cb.bgmVolume() * 100), seValue = Math.round(cb.seVolume() * 100);
        this.open("<h2>メニュー</h2><div class='mn'><button data-m='stamps'>🏅 スタンプちょう</button><button data-m='pystats'>📊 らいえん分析（Python）</button><button data-m='help'>🎮 そうさ せつめい</button><button data-m='snd'>🔊 おと：" + (cb.sndOn() ? "ON" : "OFF") + "</button><button data-m='q'>🖼 がしつ：" + cb.quality() + "</button><button data-m='diag'>🛠 しんだん（おかしい時）</button><button data-m='save'>💾 セーブ</button><button data-m='reset'>🗑 はじめから</button>" + (cb.back ? "<button data-m='back'>↩ ARE QUEST 2 に もどる</button>" : "") + "</div><div class='soundSliders'><label for='bgmVolume'>BGM音量 <output id='bgmVolumeValue'>" + bgmValue + "%</output><input id='bgmVolume' type='range' min='0' max='100' step='5' value='" + bgmValue + "'></label><label for='seVolume'>効果音音量 <output id='seVolumeValue'>" + seValue + "%</output><input id='seVolume' type='range' min='0' max='100' step='5' value='" + seValue + "'></label></div><p class='hint'>ひょうじ中の えんじん：" + cb.engine() + "</p>");
        const connectVolume = (inputId, outputId, update) => { const input = this.el.modal.querySelector("#" + inputId), output = this.el.modal.querySelector("#" + outputId); input.addEventListener("input", () => { const value = Number(input.value); output.value = value + "%"; output.textContent = value + "%"; update(value / 100); }); };
        connectVolume("bgmVolume", "bgmVolumeValue", cb.setBgmVolume); connectVolume("seVolume", "seVolumeValue", cb.setSeVolume);
        this.el.modal.querySelectorAll("[data-m]").forEach((b) => b.onclick = () => { const m = b.dataset.m; this.close(); cb[m] && cb[m](); });
    }
    help(){ this.open("<h2>そうさ せつめい</h2><ul class='help'><li><b>T</b>（または 🌀ボタン）瞬間移動：行き先を えらぶと 入口まで とぶ／<b>P</b>（または ▶ボタン）オートプレイ：じどうで アトラクションに のってくれる</li><li>PC：<b>W A S D</b> いどう／<b>マウス</b> 視点（クリックで ロック）／<b>Shift</b> はしる</li><li><b>E</b>（または Space）しらべる・のる・はなす・はっしゃ</li><li>のりもの中：<b>Q</b> or <b>Esc</b> で おりる／<b>マウス</b> で まわりを みる</li><li>スカイ・ライナー：<b>W</b> かそく ／<b>S</b> ブレーキ。バルーン：<b>W S</b> で たかさ。</li><li><b>Esc / M</b> メニュー</li><li>スマホ：左の スティック いどう／画面ドラッグ 視点／右の ボタン</li></ul>"); }
    // のりもの
    rideStart(a){ document.body.classList.add("riding"); this.el.ride.classList.add("on"); this.el.rideName.textContent = a.n; this.el.frame.className = "veh-" + (a.vehicle || a.kind || a.mode || ""); this.fade(); this.toast(a.n + "！  （Q / Esc で おりる）", 2600); }
    rideSet(R, a){ if(R.xm){ this.el.rideInfo.textContent = R.xm.hud ? R.xm.hud(R) : ""; return; } if(a.kind === "coaster"){ this.el.rideInfo.textContent = R.hud || ""; this.gfx(R.gfx); return; } let s = ""; if(a.kind === "track") s = "スピード " + Math.round((R.v || 0) * 3.6) + " km/h" + (a.laps > 1 ? "　周 " + (R.lap + 1) + "/" + a.laps : ""); else if(a.kind === "shoot") s = "ヒット " + R.hits + "　のこり " + Math.max(0, Math.ceil(a.dur - R.t)) + "びょう"; else if(a.kind === "drop") s = R.t < 9 ? "じょうしょう中…" : "…"; else if(a.mode === "balloon") s = "W/S で たかさ"; else s = "のこり " + Math.max(0, Math.ceil((a.dur || 0) - R.t)) + "びょう"; this.el.rideInfo.textContent = s; }
    // 画面の くろ（ふぇーど／G で まわりが くらくなる）
    gfx(o){ const e = this.el.gfx; if(!e) return; const f = o ? Math.round(o.fade * 50) / 50 : 0, v = o ? Math.round(o.vig * 50) / 50 : 0, k = f + "," + v; if(k === this.gfxKey) return; this.gfxKey = k;
        e.style.background = (f || v) ? "radial-gradient(ellipse at 50% 50%, rgba(0,0,0," + f + ") 0%, rgba(0,0,0," + f + ") " + Math.round(62 - v * 40) + "%, rgba(0,0,0," + Math.max(f, v) + ") 100%)" : "none"; }
    rideEnd(){ this.gfx(null); document.body.classList.remove("riding"); this.el.ride.classList.remove("on"); this.el.frame.className = ""; this.fade(); }
    fade(){ const f = this.el.fade; f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }
}
