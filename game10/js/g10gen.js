"use strict";
// ===== ループ・ラボ：ステージ自動生成（C++ → WebAssembly）の よびだし =====
//   本体は game10/cpp/g10gen.cpp（js/g10gen.wasm）。ここは よみこみと、文字のやりとりだけ。
//   window.G10Gen.load() → Promise<{gen(seed, level), par(mapRows, steps)}>（読みこめなければ reject）
//     gen(seed, level)  … level 1〜3（かんたん・ふつう・むずかしい）。{steps, par, map:[行…]} か null
//     par(rows, steps)  … 地図の さいしょうの ぶんしん数（解けなければ -1）
(function(){
    var SRC = ""; try{ SRC = (document.currentScript && document.currentScript.src) || ""; }catch(_e){}
    var WASM = (SRC ? SRC.replace(/[^\/]*$/, "") : "js/") + "g10gen.wasm";
    var cache = null;
    function make(E){
        var enc = new TextEncoder(), dec = new TextDecoder();
        function putIn(s){
            var b = enc.encode(s), cap = E.g10_incap();
            if(b.length >= cap) return false;
            var m = new Uint8Array(E.memory.buffer), p = E.g10_inbuf(); m.set(b, p); m[p + b.length] = 0; return true;
        }
        function getOut(){
            var m = new Uint8Array(E.memory.buffer), p = E.g10_outbuf(), q = p; while(m[q]) q++;
            return dec.decode(m.subarray(p, q));
        }
        return {
            gen: function(seed, level){
                seed = Number(seed); if(!isFinite(seed)) return null;
                var n = E.g10_gen(seed >>> 0, level | 0); if(!n) return null;
                var lines = getOut().split("\n"), steps = Number(lines[0]), par = Number(lines[1]), map = lines.slice(2).filter(function(x){ return x.length; });
                if(!(steps > 0) || !(par >= 0) || !map.length) return null;
                return {steps: steps, par: par, map: map};
            },
            par: function(rows, steps){ if(!putIn(rows.join("\n") + "\n")) return -3; return E.g10_par(steps | 0); }
        };
    }
    function load(){
        if(cache) return cache;
        cache = fetch(WASM).then(function(r){ if(!r.ok) throw new Error("g10gen.wasm " + r.status); return r.arrayBuffer(); })
            .then(function(b){ return WebAssembly.instantiate(b, {}); })
            .then(function(r){ var E = r.instance.exports; if(E.g10_ping() !== 1010) throw new Error("g10gen: ping"); return make(E); })
            .catch(function(e){ cache = null; throw e; });
        return cache;
    }
    window.G10Gen = {load: load};
})();
