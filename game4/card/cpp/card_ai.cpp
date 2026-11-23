// ===== ARE CARD 〜そういうときは、AREだ！〜 CPUの思考（C++ → WebAssembly）=====
// js/ai.js の scoreAction / cpuAskARE と「同じ計算」を C++側でおこなう。
// 盤面の進行（カードを出す・攻撃する・演出イベントの発行）は 今までどおり rules.js（JS）が行い、
// ここでは「どの行動が いちばん良さそうか」の 数値評価（判定・スコア計算）だけを 高速なC++で計算する。
// ビルド: build.sh を参照。
#include <cstdlib>
#include <cstring>
#include <cmath>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

namespace cardai {
    const int SLOTS = 5;
    const int MAX_HAND = 9;

    // ---- その場（盤面）の状態。CPUの1手ごとに JS から set_* でまとめて書きこまれる ----
    struct Unit { int alive; float atk, hp, maxhp, cost; int guard, haste, sick, acted; };
    Unit myUnit[SLOTS];
    Unit foeUnit[SLOTS];
    float meBaseHp, meBaseMax, foeBaseHp, foeBaseMax, meLamps;
    int meHandLen;
    float handCost[MAX_HAND];

    static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }

    EM_KEEP void card_ctx_reset(){
        for(int i = 0; i < SLOTS; i++){ myUnit[i] = {0,0,0,0,0,0,0,0,0}; foeUnit[i] = {0,0,0,0,0,0,0,0,0}; }
        meBaseHp = meBaseMax = foeBaseHp = foeBaseMax = meLamps = 0; meHandLen = 0;
        for(int i = 0; i < MAX_HAND; i++) handCost[i] = 0;
    }
    EM_KEEP void card_ctx_set_me_base(float hp, float max, float lamps, int handLen){
        meBaseHp = hp; meBaseMax = max; meLamps = lamps; meHandLen = handLen;
    }
    EM_KEEP void card_ctx_set_foe_base(float hp, float max){ foeBaseHp = hp; foeBaseMax = max; }
    EM_KEEP void card_ctx_set_my_unit(int slot, float atk, float hp, float maxhp, float cost, int guard, int haste, int sick, int acted){
        if(slot < 0 || slot >= SLOTS) return;
        myUnit[slot] = {1, atk, hp, maxhp, cost, guard, haste, sick, acted};
    }
    EM_KEEP void card_ctx_set_foe_unit(int slot, float atk, float hp, float maxhp, float cost, int guard){
        if(slot < 0 || slot >= SLOTS) return;
        foeUnit[slot] = {1, atk, hp, maxhp, cost, guard, 0, 0, 0};
    }
    EM_KEEP void card_ctx_set_hand_cost(int idx, float cost){ if(idx >= 0 && idx < MAX_HAND) handCost[idx] = cost; }

    // ---- ai.js の scoreAction({k:"unit"}) と同じ ----
    EM_KEEP float card_ai_score_unit(float cost, int haste, int guardKw, int hasDmgFx){
        float s = 4.0f + cost * 1.6f + (haste ? 3.0f : 0.0f) + (guardKw && meBaseHp < 12.0f ? 3.0f : 0.0f);
        if(hasDmgFx) s += 2.0f;
        return s;
    }

    // op番号: 0=dmg 1=draw 2=heal 3=healdraw 4=buff 5=haste 6=lamp 7=destroy 8=bigl 9=healAlly 10=stormDraw
    // targetType: 0=none 1=base 2=unit（dmg/buff/haste/destroyで使う。buff/hasteは味方=myUnit、dmg/destroyは敵=foeUnit）
    EM_KEEP float card_ai_score_spell(int op, int allEnemy, int targetType, int targetSlot, float v){
        switch(op){
            case 0: { // dmg
                if(allEnemy){
                    int n = 0, kills = 0;
                    for(int i = 0; i < SLOTS; i++) if(foeUnit[i].alive){ n++; if(foeUnit[i].hp <= v) kills++; }
                    return n ? 2.0f + kills * 4.0f + n * 1.5f : -1.0f;
                }
                if(targetType == 1) return foeBaseHp <= v ? 200.0f : 2.0f + v * 0.6f + (foeBaseHp <= 8.0f ? 4.0f : 0.0f);
                if(targetType == 2 && targetSlot >= 0 && targetSlot < SLOTS && foeUnit[targetSlot].alive){
                    Unit &u = foeUnit[targetSlot];
                    return u.hp <= v ? 5.0f + u.cost * 2.0f + u.atk : 1.0f + v * 0.4f;
                }
                return -1.0f;
            }
            case 1: return meHandLen <= 6 ? 7.0f : 1.0f; // draw
            case 2: case 3: return (meBaseMax - meBaseHp) >= 4.0f ? 5.0f + (meBaseHp <= 10.0f ? 5.0f : 0.0f) : -1.0f; // heal / healdraw
            case 4: case 5: { // buff / haste（対象は自分のユニット）
                if(targetSlot < 0 || targetSlot >= SLOTS || !myUnit[targetSlot].alive) return -1.0f;
                Unit &u = myUnit[targetSlot];
                return 4.0f + u.atk * 0.5f + (op == 5 && u.sick ? 4.0f : 0.0f);
            }
            case 6: { // lamp：灯を増やす。手札に「今は出せないが、増やせば出せる」カードがあれば お得
                for(int i = 0; i < meHandLen && i < MAX_HAND; i++)
                    if(handCost[i] > meLamps && handCost[i] <= meLamps + v) return 9.0f;
                return -1.0f;
            }
            case 7: { // destroy（確定破壊、hpがv以下の敵のみ）
                if(targetSlot < 0 || targetSlot >= SLOTS || !foeUnit[targetSlot].alive) return -1.0f;
                Unit &u = foeUnit[targetSlot];
                if(u.hp > v) return -1.0f;
                return 6.0f + u.cost * 2.0f;
            }
            case 8: { // bigl（敵全体にダメージ＋自分の本拠地を回復）
                int n = 0; for(int i = 0; i < SLOTS; i++) if(foeUnit[i].alive) n++;
                return n >= 2 ? 6.0f + n * 2.0f : 1.0f;
            }
            case 9: { // healAlly
                float d = 0; for(int i = 0; i < SLOTS; i++) if(myUnit[i].alive) d += fminf(v, myUnit[i].maxhp - myUnit[i].hp);
                return d >= 4.0f ? 4.0f + d * 0.3f : -1.0f;
            }
            case 10: return meHandLen <= 6 ? 6.0f : 1.0f; // stormDraw
            default: return 0.0f;
        }
    }

    // targetType: 0=unit 1=base
    EM_KEEP float card_ai_score_attack(int mySlot, int targetType, int targetSlot){
        if(mySlot < 0 || mySlot >= SLOTS || !myUnit[mySlot].alive) return -1.0f;
        Unit &u = myUnit[mySlot];
        if(targetType == 1){
            if(foeBaseHp <= u.atk) return 300.0f;
            int threats = 0;
            for(int i = 0; i < SLOTS; i++) if(foeUnit[i].alive && foeUnit[i].atk >= u.hp) threats = 1;
            return 5.0f + u.atk * 1.2f + (foeBaseHp <= 10.0f ? 3.0f : 0.0f) - (threats ? 1.0f : 0.0f);
        }
        if(targetSlot < 0 || targetSlot >= SLOTS || !foeUnit[targetSlot].alive) return -1.0f;
        Unit &x = foeUnit[targetSlot];
        bool kills = u.atk >= x.hp, dies = x.atk >= u.hp;
        if(kills && !dies) return 12.0f + x.cost * 2.0f;
        if(kills && dies) return x.cost >= u.cost ? 6.0f + x.cost - u.cost : -3.0f + x.cost;
        if(!kills && dies) return -8.0f;
        return x.guard ? 3.0f : 1.0f;
    }

    // ---- ノイズ（levelが低いほど ゆらぎが大きい＝弱くなる）と AREだ！を使うか ----
    const float NOISE[3] = {6.0f, 2.2f, 0.4f};
    EM_KEEP float card_ai_noise(int level){
        if(level < 0) level = 0; if(level > 2) level = 2;
        float r = (float)rand() / (float)RAND_MAX;
        return (r - 0.5f) * 2.0f * NOISE[level];
    }
    EM_KEEP int card_ai_ask_are(int level, float baseHp, float atk){
        float r = (float)rand() / (float)RAND_MAX;
        if(level == 0) return r < 0.5f ? 1 : 0;
        float need = atk + 1.0f; if(need < 8.0f) need = 8.0f;
        if(baseHp <= need) return 1;
        return r < 0.5f ? 1 : 0;
    }
    EM_KEEP void card_ai_seed(unsigned int s){ srand(s); }
}

EM_KEEP int card_ai_ping(){ return 44; }
