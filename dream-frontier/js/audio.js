import {createScore} from "./df-score.js";
const PREF_KEY = "dreamFrontierSound_v1";
const SCALES = {town: [0, 2, 4, 7, 9, 12, 9, 7], cave: [0, 3, 7, 10, 12, 10, 7, 3], field: [0, 4, 7, 9, 12, 9, 7, 4], demoncastle: [0, 1, 4, 5, 7, 5, 4, 1], sea: [0, 2, 5, 7, 9, 7, 5, 2]};
const clamp = (v) => Math.max(0, Math.min(1, Number(v) || 0));
const prefs = (() => { try{ return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); }catch(_e){ return {}; } })();
let ac = null, bgmBus = null, seBus = null, unlocked = false, on = prefs.on !== false;
let bgmVol = clamp(prefs.bgmVol === undefined ? .48 : prefs.bgmVol), seVol = clamp(prefs.seVol === undefined ? .58 : prefs.seVol);
let bgmTimer = null, step = 0, key = "town", activeAudio = null, activeKey = "", pendingAudio = null, fadeToken = 0;
const tracks = {}, failedTracks = {};
// 火星・木星（ジェット・ワールドツアー）だけは、本物のクラシック音源をこの自前フォルダから読む（他のエリアは従来どおりgame2/quest2/bgm/）
const LOCAL_BGM = {mars: 1, jupiter: 1, cheeseq: 1, cheeseride: 1};   // チーズいせき：ならぶ間（0:00〜6:00）／ライド（6:00〜さいごまで）は、曲の 切りだし
const RESTART = {cheeseq: 1, cheeseride: 1};   // はじまるたびに あたまから
const hz = (n) => 261.63 * Math.pow(2, n / 12);

function ensure(){
    if(ac) return ac;
    try{
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if(!AudioContextClass) return null;
        ac = new AudioContextClass();
        bgmBus = ac.createGain(); bgmBus.gain.value = bgmVol; bgmBus.connect(ac.destination);
        seBus = ac.createGain(); seBus.gain.value = seVol; seBus.connect(ac.destination);
    }catch(_e){ ac = null; }
    return ac;
}

const score = createScore({ac: () => (unlocked && on && ensure()) ? ac : null, bus: () => bgmBus});
let wind = null;
function ensureWind(){
    if(wind || !unlocked || !on || !ensure()) return wind;
    const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); let s = 987654; for(let i = 0; i < n; i++){ s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const fl = ac.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = 500; fl.Q.value = .6; const gn = ac.createGain(); gn.gain.value = 0;
    src.connect(fl); fl.connect(gn); gn.connect(seBus); src.start(); return wind = {src, fl, gn};
}
function burst(freq, dur, vol, q){
    if(!unlocked || !on || !ensure()) return; const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource(); src.buffer = buf; const fl = ac.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = freq; fl.Q.value = q || 1.2; const gn = ac.createGain(); gn.gain.value = vol; src.connect(fl); fl.connect(gn); gn.connect(seBus); src.start();
}
function savePrefs(){ try{ localStorage.setItem(PREF_KEY, JSON.stringify({on, bgmVol, seVol})); }catch(_e){} }

function tone(f, d, type, v, when, bus){
    if(!unlocked || !on || !ensure()) return;
    const startAt = ac.currentTime + (when || 0), oscillator = ac.createOscillator(), gain = ac.createGain();
    oscillator.type = type || "sine"; oscillator.frequency.value = f;
    gain.gain.setValueAtTime(0, startAt); gain.gain.linearRampToValueAtTime(v || .2, startAt + .02); gain.gain.exponentialRampToValueAtTime(.0001, startAt + d);
    oscillator.connect(gain); gain.connect(bus === "bgm" ? bgmBus : seBus); oscillator.start(startAt); oscillator.stop(startAt + d + .05);
}

function stopSynthBgm(){ clearInterval(bgmTimer); bgmTimer = null; }

function startSynthBgm(){
    if(bgmTimer || !unlocked || !on || !ensure()) return;
    bgmTimer = setInterval(() => {
        const scale = SCALES[key] || SCALES.town, note = scale[step % scale.length];
        tone(hz(note - 12), .5, "sine", .07, 0, "bgm");
        if(step % 2 === 0) tone(hz(scale[(step * 3) % scale.length] + 12), .35, "triangle", .035, 0, "bgm");
        if(step % 8 === 0) tone(hz(scale[0] - 24), 1.4, "sine", .08, 0, "bgm");
        step++;
    }, 420);
}

function getTrack(name){
    if(failedTracks[name]) return null;
    if(tracks[name]) return tracks[name];
    try{
        const rel = LOCAL_BGM[name] ? ("../bgm/" + name + ".mp3") : ("../../game2/quest2/bgm/" + name + ".mp3");
        const audio = new Audio(new URL(rel, import.meta.url).href);
        audio.loop = true; audio.preload = "auto"; audio.volume = 0;
        audio.addEventListener("error", () => { failedTracks[name] = true; if(key === name){ activeAudio = null; activeKey = ""; startSynthBgm(); } });
        tracks[name] = audio;
        return audio;
    }catch(_e){ failedTracks[name] = true; return null; }
}

// いま鳴らしてよい曲（next と、うすれていく previous）いがいは、ぜんぶ止める。
// 切りかえの 途中で また 別の曲に かわると、うすれている 途中の 前の曲が 止まらずに 小さく 鳴りつづけ、
// 洞窟の曲と チーズいせきの List123 が 重なっていた（このアトラクションは List123 だけを 流す）
function silenceOthers(keepA, keepB){
    for(const name of Object.keys(tracks)){ const a = tracks[name]; if(a !== keepA && a !== keepB && !a.paused){ try{ a.pause(); }catch(_e){} a.volume = 0; } }
}
async function syncBgm(){
    if(!on || document.hidden){ fadeToken++; pendingAudio = null; if(activeAudio) activeAudio.pause(); stopSynthBgm(); score.stop(); return; }
    if(!unlocked) return;
    if(key.indexOf("score:") === 0){ fadeToken++; pendingAudio = null; if(activeAudio){ activeAudio.pause(); activeAudio = null; activeKey = ""; } stopSynthBgm(); score.start(key.slice(6)); return; }
    score.stop();
    const requestKey = key, next = getTrack(requestKey);
    if(!next){ startSynthBgm(); return; }
    if(next === activeAudio && !next.paused){ silenceOthers(next, null); next.volume = bgmVol; stopSynthBgm(); return; }
    if(next === pendingAudio) return;
    const token = ++fadeToken, previous = activeAudio, previousVolume = previous ? previous.volume : 0, prevKey = activeKey;
    silenceOthers(next, previous);                                  // 前の前の曲が のこっていたら、ここで 止める
    const fadeMs = (RESTART[requestKey] || RESTART[prevKey]) ? 300 : 800;      // チーズいせきの 曲と ほかの曲は、ほとんど 重ねない
    pendingAudio = next; next.volume = 0; if(RESTART[requestKey]){ try{ next.currentTime = 0; }catch(_e){} }
    try{ await next.play(); }
    catch(error){ if(pendingAudio === next) pendingAudio = null; if(error && error.name === "NotAllowedError") return; failedTracks[requestKey] = true; startSynthBgm(); return; }
    if(token !== fadeToken){ next.pause(); next.volume = 0; if(pendingAudio === next) pendingAudio = null; return; }
    pendingAudio = null; activeAudio = next; activeKey = key; stopSynthBgm();
    const startedAt = performance.now();
    const fade = (now) => {
        if(token !== fadeToken) return;
        const progress = Math.max(0, Math.min(1, (now - startedAt) / fadeMs));   // 時刻が開始より わずかに前でも マイナスにしない（音量が範囲外になり エラーで 無音になるのを防ぐ）
        next.volume = bgmVol * progress;
        if(previous && previous !== next) previous.volume = previousVolume * (1 - progress);
        if(progress < 1) requestAnimationFrame(fade);
        else if(previous && previous !== next){ previous.pause(); previous.currentTime = 0; }
    };
    fade(startedAt);
}

export const Snd = {
    init(){
        if(seBus){ bgmBus.gain.value = bgmVol; seBus.gain.value = seVol; }
        document.addEventListener("visibilitychange", () => {
            if(document.hidden){ fadeToken++; pendingAudio = null; if(activeAudio) activeAudio.pause(); stopSynthBgm(); score.stop(); if(wind) wind.gn.gain.value = 0; }
            else syncBgm();
        });
    },
    resume(){ unlocked = true; if(ensure() && ac.state === "suspended") ac.resume(); syncBgm(); },
    setOn(value){ on = !!value; savePrefs(); if(!on){ fadeToken++; pendingAudio = null; Object.values(tracks).forEach((audio) => { audio.pause(); audio.volume = 0; }); activeAudio = null; activeKey = ""; stopSynthBgm(); score.stop(); if(wind) wind.gn.gain.value = 0; } else syncBgm(); },
    isOn: () => on,
    setVol(value){ bgmVol = clamp(value); if(bgmBus) bgmBus.gain.value = bgmVol; if(activeAudio) activeAudio.volume = bgmVol; savePrefs(); },
    getVol: () => bgmVol,
    setSeVol(value){ seVol = clamp(value); if(seBus) seBus.gain.value = seVol; savePrefs(); },
    getSeVol: () => seVol,
    sfx(name){
        const sounds = {
            coin: () => { tone(988, .12, "square", .12); tone(1319, .2, "square", .12, .08); },
            clue: () => tone(660, .25, "triangle", .2),
            ok: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, "triangle", .2, i * .09)),
            ng: () => tone(150, .3, "sawtooth", .15),
            stamp: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, .3, "triangle", .22, i * .1)),
            start: () => [392, 523, 659].forEach((f, i) => tone(f, .18, "square", .1, i * .08)),
            fan: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .22, "triangle", .2, i * .12)),
            climb: () => tone(120, .5, "square", .08),
            drop: () => { for(let i = 0; i < 12; i++) tone(900 - i * 60, .12, "sawtooth", .06, i * .05); },
            splash: () => tone(90, .6, "sawtooth", .2),
            boo: () => { tone(180, .6, "sawtooth", .1); tone(150, .8, "triangle", .1, .1); },
            shot: () => tone(1400, .08, "square", .1),
            hit: () => { tone(880, .12, "triangle", .2); tone(1320, .2, "triangle", .2, .06); },
            gold: () => [784, 988, 1319, 1568, 2093].forEach((f, i) => tone(f, .26, "triangle", .2, i * .06)),
            // のりこみ・演出（2026-11-27）
            bell: () => { tone(1568, .5, "sine", .16); tone(2093, .6, "sine", .1, .02); tone(1568, .5, "sine", .12, .32); },
            door: () => { tone(220, .35, "sawtooth", .07); tone(165, .5, "sawtooth", .06, .12); },
            clack: () => { tone(2300, .04, "square", .06); tone(110, .1, "square", .08, .02); },
            belt: () => [0, 1, 2, 3, 4, 5].forEach((i) => tone(95, .07, "square", .05, i * .11)),
            whoosh: () => { for(let i = 0; i < 10; i++) tone(300 + i * 90, .09, "sawtooth", .035, i * .035); },
            sparkle: () => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, .18, "sine", .1, i * .06)),
            rumble: () => { tone(55, .9, "sawtooth", .14); tone(70, .8, "square", .06, .05); burst(120, .9, .22, .8); },
            warp: () => { for(let i = 0; i < 14; i++) tone(180 + i * i * 9, .1, "triangle", .07, i * .03); },
            alarm: () => [0, 1, 2, 3].forEach((i) => tone(i % 2 ? 660 : 880, .16, "square", .09, i * .18)),
            boing: () => { for(let i = 0; i < 6; i++) tone(260 + Math.sin(i * 1.3) * 140, .08, "sine", .14, i * .045); },
            pop: () => { tone(880, .06, "triangle", .16); tone(1320, .08, "triangle", .12, .04); },
            cheer: () => [523, 659, 784, 988, 1175].forEach((f, i) => tone(f, .22, "triangle", .14, i * .07)),
            crash: () => { burst(160, .8, .6, .7); burst(900, .4, .4, 1.1); tone(68, .9, "sawtooth", .28); tone(46, 1.1, "square", .2, .03); tone(1500, .1, "square", .1); [0, 1, 2, 3].forEach((i) => tone(300 - i * 50, .2, "sawtooth", .12, .18 + i * .08)); },
            smash: () => { burst(130, 1.0, .65, .6); burst(1200, .5, .45, 1.0); tone(60, 1.2, "sawtooth", .3); tone(40, 1.4, "square", .22, .04); [0, 1, 2, 3, 4, 5].forEach((i) => tone(900 + i * 220, .14, "triangle", .1, .25 + i * .05)); }
        };
        if(sounds[name]) sounds[name]();
    },
    // のりもの：かぜの おと・レールの おと・きょくの つよさ
    ride(o){ const w = ensureWind(); if(!w) return; const t = ac.currentTime, v = Math.max(0, Math.min(1, o.v || 0)); w.gn.gain.setTargetAtTime(Math.min(.45, v * v * .5 + .015), t, .15); w.fl.frequency.setTargetAtTime(340 + v * 2300, t, .2); score.setIntensity(o.music === undefined ? v : o.music); },
    rideStop(){ if(wind && ac) wind.gn.gain.setTargetAtTime(0, ac.currentTime, .12); score.setIntensity(0); },
    clack(v, chain){ if(chain){ tone(2300, .03, "square", .035); burst(1500, .03, .09, 2); } else { burst(700 + v * 500, .05, .06 + .1 * v, 1.4); tone(62, .08, "square", .05 * v); } },
    setBgm(name){ key = name; syncBgm(); },
    startBgm(){ syncBgm(); },
    stopBgm(){ fadeToken++; pendingAudio = null; if(activeAudio) activeAudio.pause(); stopSynthBgm(); score.stop(); },
    _score: score
};
