// ===== C++(WebAssembly) モジュールの 共有読みこみ（dream-frontier.wasm.js を 1回だけ instantiate する）=====
// js/df-game.js（移動の当たり判定）と js/df-coaster.js（コースター物理・シューティング判定）が
// それぞれ この同じモジュールを使うので、ここで 一度だけ 読みこみ、両方に同じインスタンスを配る。
export const DFM = {mod: null, ready: false, failed: false};
let promise = null;
export function bootDfWasm(){
    if(promise) return promise;
    if(typeof window === "undefined" || typeof window.DreamFrontierModule !== "function"){
        DFM.failed = true; promise = Promise.reject(new Error("DreamFrontierModule が ありません"));
        promise.catch(() => {}); return promise;
    }
    try{
        promise = window.DreamFrontierModule().then((M) => {
            DFM.mod = M; DFM.ready = true; return M;
        }, (err) => {
            DFM.failed = true; try{ console.warn("dream-frontier: WASM読みこみ失敗。JS版にフォールバックします。", err); }catch(_e){}
            throw err;
        });
    }catch(_e){ DFM.failed = true; promise = Promise.reject(_e); }
    promise.catch(() => {});
    return promise;
}
