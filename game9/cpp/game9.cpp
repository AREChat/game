// ===== GAME9「AREshoot（美食の晩餐会）」物理・ロジックコア（C++ → WebAssembly）=====
// 見下ろし弾幕STGではなく、3D空間を自由に動き回るTPSガンシューティング（CoD/荒野行動的な手触り）。
// プレイヤー・敵の移動・当たり判定・弾道（ヒットスキャン／敵の投射弾）・索敵AI・遮蔽物でのLOS判定・
// 手榴弾の爆発ダメージ・スコア計算を すべてここ（C++側）で行う。
// 描画（three.js・TPSカメラ）・入力は JS 側が担当する（game8と同じ設計方針）。
// ビルド: build.sh を参照。
#include <cmath>
#include <cstring>
#include <cstdlib>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }
static inline float frand(){ return (float)rand() / (float)RAND_MAX; }
static inline float frand2(){ return frand() * 2.0f - 1.0f; }
static const float PI = 3.14159265f;

namespace g9 {

// ---------------------------------------------------------------------------
// フィールド（厨房をテーマにした円形の広場。中心から ARENA_HALF の正方形内）
// ---------------------------------------------------------------------------
const float ARENA_HALF = 22.0f;
const float PLAYER_R = 0.5f;
const float ENEMY_R = 0.55f;
const float PLAYER_SPEED = 7.0f;
const float ENEMY_MOVE_BASE = 3.0f;

enum EnemyType { ET_GRUNT = 0, ET_BOSS = 1 };
enum EnemyState { ES_SEEK = 0, ES_ATTACK = 1, ES_COVER = 2 };

// ---------------------------------------------------------------------------
// 武器種（CoD的な複数武器の持ち替え）
//   0: ライフル     … 連射は遅いが一撃が重い。標準バランス。
//   1: サブマシンガン … 連射は速いが威力が低く、射程も短め。弾倉は大きい。
//   2: スナイパーライフル … 射程も威力も最大級だが連射が非常に遅く、弾倉が小さい。
// ---------------------------------------------------------------------------
enum Weapon { WPN_RIFLE = 0, WPN_SMG = 1, WPN_SNIPER = 2, WPN_COUNT = 3 };
struct WeaponDef { float dmg, fireInterval, reloadTime, range, spread; int maxAmmo; };
const WeaponDef WEAPONS[WPN_COUNT] = {
    /* RIFLE  */ {24.0f, 0.46f, 2.0f, 36.0f, 0.006f, 8},
    /* SMG    */ {7.5f,  0.085f, 1.5f, 20.0f, 0.05f, 30},
    /* SNIPER */ {100.0f, 1.05f, 2.3f, 60.0f, 0.0f,   5},
};
const float WEAPON_SWITCH_TIME = 0.32f; // 持ち替え（構えなおし）にかかる時間。この間は射撃できない。

const int MAX_OBST = 18;
const int MAX_ENEMY = 10;
const int MAX_EBULLET = 60;
const int MAX_TRACER = 16;
const int MAX_GRENADE = 4;

struct Obstacle { float x, z, r; };
struct Enemy {
    float x, z, yaw, hp, hpMax;
    int type, state, alive;
    float moveSpeed, fireCooldown, stateTimer, coverX, coverZ;
    int hitFlash;      // 被弾した直後の見た目用（>0の間 光らせる等）
};
struct EBullet { float x, z, vx, vz, life; int alive; };
struct Tracer { float ox, oz, tx, tz, life; int hit; };   // プレイヤーの射撃（ヒットスキャン）の軌跡表示用
struct Grenade { float x, z, vx, vz, dist, life; int alive, exploded; };

Obstacle obstacles[MAX_OBST]; int obstacleCount = 0;
Enemy enemies[MAX_ENEMY]; int enemyCount = 0;
EBullet ebullets[MAX_EBULLET]; int ebulletCount = 0;
Tracer tracers[MAX_TRACER]; int tracerCount = 0;
Grenade grenades[MAX_GRENADE]; int grenadeCount = 0;

float px = 0, pz = 0, pyaw = 0;
float hp = 100, maxHp = 100;
int curWeapon = 0;
int ammoArr[WPN_COUNT] = {8, 30, 5};
int reloading = 0;
float reloadT = 0, fireCooldown = 0, grenadeCd = 0, hitFlashT = 0, weaponSwitchT = 0;
double score = 0;
int combo = 0, comboMax = 0;
int killCount = 0, killTarget = 20;
float elapsed = 0;
int running = 0, gameOver = 0, stageCleared = 0;
int bossActive = 0, bossSpawned = 0;
int spawnQueue = 0; float spawnTimer = 0.6f;
float enemyHpMul = 1, enemySpeedMul = 1, fireRateMul = 1, bulletSpeedMul = 1;
const int CONCURRENT_CAP = 4;

const float GRENADE_CD = 6.0f;
const float GRENADE_SPEED = 13.0f;
const float GRENADE_RANGE = 12.0f;
const float GRENADE_RADIUS = 3.6f;
const float GRENADE_DMG = 70.0f;
const float DETECT_RANGE = 20.0f;
const float ATTACK_RANGE = 15.0f;

static Obstacle* nearestObstacleSlot(){ return obstacleCount < MAX_OBST ? &obstacles[obstacleCount] : nullptr; }

// 線分(ax,az)-(bx,bz) が 円(cx,cz,r) によって 遮られているか（LOS判定にも、弾の衝突にも使う）
static bool segBlockedByCircle(float ax, float az, float bx, float bz, float cx, float cz, float r){
    float ex = bx - ax, ez = bz - az;
    float len2 = ex * ex + ez * ez; if(len2 < 1e-6f) return false;
    float t = ((cx - ax) * ex + (cz - az) * ez) / len2;
    t = clampf(t, 0.0f, 1.0f);
    float nx = ax + ex * t, nz = az + ez * t;
    float dx = cx - nx, dz = cz - nz;
    return (dx * dx + dz * dz) < (r * r);
}
static bool losBlocked(float ax, float az, float bx, float bz){
    for(int i = 0; i < obstacleCount; i++){
        if(segBlockedByCircle(ax, az, bx, bz, obstacles[i].x, obstacles[i].z, obstacles[i].r * 0.92f)) return true;
    }
    return false;
}
// レイ(ox,oz)方向(dx,dz：正規化済み)が 円(cx,cz,r) に当たる距離を返す（当たらなければ -1）
static float rayHitCircle(float ox, float oz, float dx, float dz, float cx, float cz, float r){
    float fx = cx - ox, fz = cz - oz;
    float t = fx * dx + fz * dz; if(t < 0) return -1.0f;
    float px2 = ox + dx * t, pz2 = oz + dz * t;
    float ex = cx - px2, ez = cz - pz2;
    float d2 = ex * ex + ez * ez;
    if(d2 > r * r) return -1.0f;
    float back = sqrtf(r * r - d2);
    float hitT = t - back;
    return hitT >= 0 ? hitT : t;
}
// 円(ax,az,ar)を 円(bx,bz,br)から押し出す（重なっていたら ずらす）
static void pushOutCircle(float &ax, float &az, float ar, float bx, float bz, float br){
    float dx = ax - bx, dz = az - bz;
    float d2 = dx * dx + dz * dz; float rr = ar + br;
    if(d2 >= rr * rr) return;
    float d = sqrtf(d2); if(d < 1e-4f){ dx = 1; dz = 0; d = 1; }
    ax = bx + dx / d * rr; az = bz + dz / d * rr;
}

EM_KEEP void g9_start_stage(int idx, int targetKills, float hpMul, float speedMul, float fireMul, float bulletMul, int seed){
    srand((unsigned)seed);
    // 前回のプレイ（リトライ・次のコースへ 等、同じWASMインスタンスを再利用するケース）の
    // 残留状態が残らないよう、各配列の alive フラグ等を明示的にクリアする。
    enemyCount = 0; ebulletCount = 0; tracerCount = 0; grenadeCount = 0;
    memset(enemies, 0, sizeof(enemies));
    memset(ebullets, 0, sizeof(ebullets));
    memset(grenades, 0, sizeof(grenades));
    for(int i = 0; i < MAX_TRACER; i++) tracers[i].life = 0;
    px = 0; pz = 0; pyaw = 0;
    hp = maxHp = 100;
    curWeapon = 0;
    for(int i = 0; i < WPN_COUNT; i++) ammoArr[i] = WEAPONS[i].maxAmmo;
    reloading = 0; reloadT = 0; fireCooldown = 0; grenadeCd = 0; hitFlashT = 0; weaponSwitchT = 0;
    score = 0; combo = 0; comboMax = 0; killCount = 0; elapsed = 0;
    killTarget = targetKills > 0 ? targetKills : 14;
    enemyHpMul = hpMul > 0 ? hpMul : 1.0f;
    enemySpeedMul = speedMul > 0 ? speedMul : 1.0f;
    fireRateMul = fireMul > 0 ? fireMul : 1.0f;
    bulletSpeedMul = bulletMul > 0 ? bulletMul : 1.0f;
    bossActive = 0; bossSpawned = 0;
    spawnQueue = killTarget; spawnTimer = 0.8f;
    running = 1; gameOver = 0; stageCleared = 0;

    // 遮蔽物（厨房の大樽・寸胴鍋・食材クレートなど＝円柱あたり判定）をランダム生成。中心のプレイヤー出現地点は避ける。
    obstacleCount = 0;
    int n = 10 + (int)(idx * 0.6f); if(n > MAX_OBST) n = MAX_OBST;
    int guard = 0;
    while(obstacleCount < n && guard < 400){
        guard++;
        float x = frand2() * (ARENA_HALF - 4.0f), z = frand2() * (ARENA_HALF - 4.0f);
        if(x * x + z * z < 6.5f * 6.5f) continue;
        float r = 1.1f + frand() * 1.0f;
        bool ok = true;
        for(int i = 0; i < obstacleCount; i++){
            float dx = x - obstacles[i].x, dz = z - obstacles[i].z;
            if(dx * dx + dz * dz < (r + obstacles[i].r + 1.2f) * (r + obstacles[i].r + 1.2f)){ ok = false; break; }
        }
        if(!ok) continue;
        obstacles[obstacleCount++] = {x, z, r};
    }
}

static Enemy* freeEnemySlot(){
    for(int i = 0; i < MAX_ENEMY; i++) if(!enemies[i].alive){ if(i >= enemyCount) enemyCount = i + 1; return &enemies[i]; }
    return nullptr;
}
static EBullet* freeEBulletSlot(){
    for(int i = 0; i < MAX_EBULLET; i++) if(!ebullets[i].alive){ if(i >= ebulletCount) ebulletCount = i + 1; return &ebullets[i]; }
    return nullptr;
}
static Tracer* nextTracerSlot(){
    for(int i = 0; i < MAX_TRACER; i++) if(tracers[i].life <= 0){ if(i >= tracerCount) tracerCount = i + 1; return &tracers[i]; }
    Tracer* t = &tracers[0]; return t;
}
static Grenade* freeGrenadeSlot(){
    for(int i = 0; i < MAX_GRENADE; i++) if(!grenades[i].alive){ if(i >= grenadeCount) grenadeCount = i + 1; return &grenades[i]; }
    return nullptr;
}

static void spawnEnemyAt(int type){
    Enemy* e = freeEnemySlot(); if(!e) return;
    float ang = frand() * 2.0f * PI;
    float r = ARENA_HALF - 1.5f;
    e->x = sinf(ang) * r; e->z = cosf(ang) * r;
    e->yaw = ang + PI; e->type = type; e->alive = 1; e->state = ES_SEEK;
    e->hp = (type == ET_BOSS ? 260.0f : 36.0f) * enemyHpMul;
    e->hpMax = e->hp;
    e->moveSpeed = (type == ET_BOSS ? ENEMY_MOVE_BASE * 0.8f : ENEMY_MOVE_BASE) * enemySpeedMul;
    e->fireCooldown = 0.6f; e->stateTimer = 0; e->coverX = e->x; e->coverZ = e->z; e->hitFlash = 0;
}

static void findCoverPoint(Enemy &e){
    int best = -1; float bestScore = -1e9f;
    for(int i = 0; i < obstacleCount; i++){
        float dx = obstacles[i].x - e.x, dz = obstacles[i].z - e.z;
        float d2 = dx * dx + dz * dz;
        float sc = -d2;
        if(sc > bestScore){ bestScore = sc; best = i; }
    }
    if(best < 0){ e.coverX = e.x; e.coverZ = e.z; return; }
    // プレイヤーから見て obstacle の裏側にまわる
    float ox = obstacles[best].x, oz = obstacles[best].z, orr = obstacles[best].r;
    float dx = ox - px, dz = oz - pz;
    float d = sqrtf(dx * dx + dz * dz); if(d < 1e-3f) d = 1e-3f;
    e.coverX = ox + dx / d * (orr + 1.1f);
    e.coverZ = oz + dz / d * (orr + 1.1f);
}

static void killEnemy(Enemy &e){
    e.alive = 0;
    if(e.type == ET_BOSS){
        bossActive = 0;
        score += 4000 + combo * 25;
        stageCleared = 1; running = 0;
        return;
    }
    killCount++; combo++; if(combo > comboMax) comboMax = combo;
    score += 120 + combo * 4;
    if(!bossSpawned && killCount >= killTarget){ bossSpawned = 1; spawnQueue = 0; spawnEnemyAt(ET_BOSS); bossActive = 1; }
}

static void damagePlayer(float dmg){
    if(stageCleared || gameOver) return;
    hp -= dmg; combo = 0; hitFlashT = 0.35f;
    if(hp <= 0){ hp = 0; gameOver = 1; running = 0; }
}

static void fireEnemyBullet(Enemy &e){
    float dx = px - e.x, dz = pz - e.z;
    float d = sqrtf(dx * dx + dz * dz); if(d < 1e-3f) d = 1e-3f;
    float nx = dx / d, nz = dz / d;
    // 命中率：距離が遠いほど ばらつく。初見で避けられる速度に調整。
    float spread = clampf(d * 0.012f, 0.02f, 0.22f);
    float ang = atan2f(nx, nz) + frand2() * spread;
    EBullet* b = freeEBulletSlot(); if(!b) return;
    float speed = 11.0f * bulletSpeedMul;
    b->x = e.x; b->z = e.z; b->vx = sinf(ang) * speed; b->vz = cosf(ang) * speed; b->life = 3.0f; b->alive = 1;
}

static void stepEnemy(Enemy &e, float dt){
    float dx = px - e.x, dz = pz - e.z;
    float dist = sqrtf(dx * dx + dz * dz);
    bool los = !losBlocked(e.x, e.z, px, pz);
    e.fireCooldown -= dt; if(e.hitFlash > 0) e.hitFlash--;

    if(e.state == ES_COVER){
        e.stateTimer -= dt;
        float tx = e.coverX - e.x, tz = e.coverZ - e.z;
        float td = sqrtf(tx * tx + tz * tz);
        if(td > 0.3f){ e.x += tx / td * e.moveSpeed * 1.2f * dt; e.z += tz / td * e.moveSpeed * 1.2f * dt; e.yaw = atan2f(tx, tz); }
        if(e.stateTimer <= 0){ e.state = (dist < DETECT_RANGE) ? ES_ATTACK : ES_SEEK; }
    } else if(dist < ATTACK_RANGE && los){
        e.state = ES_ATTACK;
        e.yaw = atan2f(dx, dz);
        // じりじり距離を詰めすぎない（遠すぎれば寄る、近すぎれば少し引く）
        if(dist > ATTACK_RANGE * 0.6f){ e.x += dx / dist * e.moveSpeed * 0.5f * dt; e.z += dz / dist * e.moveSpeed * 0.5f * dt; }
        else if(dist < ATTACK_RANGE * 0.3f){ e.x -= dx / dist * e.moveSpeed * 0.4f * dt; e.z -= dz / dist * e.moveSpeed * 0.4f * dt; }
        if(e.fireCooldown <= 0){
            e.fireCooldown = (e.type == ET_BOSS ? 0.5f : 0.95f) / fireRateMul;
            fireEnemyBullet(e);
            if(e.type == ET_BOSS){ // ボスは連射気味の二連射
                EBullet* b2 = freeEBulletSlot();
                if(b2){ float a2 = atan2f(dx, dz) + frand2() * 0.1f; float sp = 11.0f * bulletSpeedMul; b2->x = e.x; b2->z = e.z; b2->vx = sinf(a2) * sp; b2->vz = cosf(a2) * sp; b2->life = 3.0f; b2->alive = 1; }
            }
            if(e.hitFlash <= 0 && frand() < 0.22f){ e.state = ES_COVER; e.stateTimer = 1.6f + frand() * 1.0f; findCoverPoint(e); }
        }
    } else if(dist < DETECT_RANGE){
        e.state = ES_SEEK;
        if(dist > 0.1f){ e.x += dx / dist * e.moveSpeed * dt; e.z += dz / dist * e.moveSpeed * dt; e.yaw = atan2f(dx, dz); }
    } else {
        // 索敵範囲外：ゆっくりプレイヤー方向へ寄る（完全待機にしない＝退屈させない）
        if(dist > 0.1f){ e.x += dx / dist * e.moveSpeed * 0.35f * dt; e.z += dz / dist * e.moveSpeed * 0.35f * dt; e.yaw = atan2f(dx, dz); }
    }
    for(int i = 0; i < obstacleCount; i++) pushOutCircle(e.x, e.z, ENEMY_R, obstacles[i].x, obstacles[i].z, obstacles[i].r);
    e.x = clampf(e.x, -ARENA_HALF + 0.5f, ARENA_HALF - 0.5f);
    e.z = clampf(e.z, -ARENA_HALF + 0.5f, ARENA_HALF - 0.5f);
}

EM_KEEP void g9_step(float dt, float moveF, float moveS, float yaw, int firing, int reloadPressed, int grenadePressed, int weaponSwitch){
    if(dt > 0.05f) dt = 0.05f;
    if(!running) return;
    elapsed += dt;
    if(hitFlashT > 0){ hitFlashT -= dt; if(hitFlashT < 0) hitFlashT = 0; }

    // ---- 武器の持ち替え ----
    if(weaponSwitchT > 0){ weaponSwitchT -= dt; if(weaponSwitchT < 0) weaponSwitchT = 0; }
    if(weaponSwitch >= 0 && weaponSwitch < WPN_COUNT && weaponSwitch != curWeapon){
        curWeapon = weaponSwitch;
        reloading = 0; // 持ち替え中はリロードを中断する（弾は減らない）
        weaponSwitchT = WEAPON_SWITCH_TIME;
        if(fireCooldown < weaponSwitchT) fireCooldown = weaponSwitchT;
    }
    const WeaponDef &wdef = WEAPONS[curWeapon];
    int &curAmmo = ammoArr[curWeapon];

    // ---- プレイヤー移動（カメラの向き=yaw を基準にした前後・左右移動） ----
    pyaw = yaw;
    float mF = clampf(moveF, -1.0f, 1.0f), mS = clampf(moveS, -1.0f, 1.0f);
    float len = sqrtf(mF * mF + mS * mS); if(len > 1.0f){ mF /= len; mS /= len; }
    float wx = sinf(yaw) * mF + cosf(yaw) * mS;
    float wz = cosf(yaw) * mF - sinf(yaw) * mS;
    px += wx * PLAYER_SPEED * dt; pz += wz * PLAYER_SPEED * dt;
    for(int i = 0; i < obstacleCount; i++) pushOutCircle(px, pz, PLAYER_R, obstacles[i].x, obstacles[i].z, obstacles[i].r);
    px = clampf(px, -ARENA_HALF + 0.6f, ARENA_HALF - 0.6f);
    pz = clampf(pz, -ARENA_HALF + 0.6f, ARENA_HALF - 0.6f);

    // ---- リロード ----
    if(reloading){
        reloadT -= dt;
        if(reloadT <= 0){ reloading = 0; curAmmo = wdef.maxAmmo; }
    } else if((reloadPressed && curAmmo < wdef.maxAmmo) || curAmmo <= 0){
        reloading = 1; reloadT = wdef.reloadTime;
    }

    // ---- 射撃（ヒットスキャン：遮蔽物／敵のうち いちばん近いものに当たる） ----
    fireCooldown -= dt;
    if(firing && !reloading && curAmmo > 0 && fireCooldown <= 0 && running){
        fireCooldown = wdef.fireInterval;
        curAmmo--;
        float shotYaw = wdef.spread > 0 ? yaw + frand2() * wdef.spread : yaw;
        float dirx = sinf(shotYaw), dirz = cosf(shotYaw);
        float bestDist = wdef.range; int hitEnemy = -1;
        for(int i = 0; i < obstacleCount; i++){
            float t = rayHitCircle(px, pz, dirx, dirz, obstacles[i].x, obstacles[i].z, obstacles[i].r);
            if(t >= 0 && t < bestDist) bestDist = t;
        }
        for(int i = 0; i < enemyCount; i++){
            if(!enemies[i].alive) continue;
            float t = rayHitCircle(px, pz, dirx, dirz, enemies[i].x, enemies[i].z, ENEMY_R);
            if(t >= 0 && t < bestDist){ bestDist = t; hitEnemy = i; }
        }
        Tracer* tr = nextTracerSlot();
        tr->ox = px; tr->oz = pz; tr->tx = px + dirx * bestDist; tr->tz = pz + dirz * bestDist; tr->life = 0.12f;
        tr->hit = hitEnemy >= 0 ? 1 : 0;
        if(hitEnemy >= 0){
            Enemy &e = enemies[hitEnemy];
            e.hp -= wdef.dmg; e.hitFlash = 6;
            if(e.hp <= 0) killEnemy(e);
        }
    }

    // ---- 手榴弾 ----
    if(grenadeCd > 0){ grenadeCd -= dt; if(grenadeCd < 0) grenadeCd = 0; }
    if(grenadePressed && grenadeCd <= 0){
        grenadeCd = GRENADE_CD;
        Grenade* g = freeGrenadeSlot();
        if(g){ g->x = px; g->z = pz; g->vx = sinf(yaw) * GRENADE_SPEED; g->vz = cosf(yaw) * GRENADE_SPEED; g->dist = 0; g->life = 0.9f; g->alive = 1; g->exploded = 0; }
    }
    for(int i = 0; i < grenadeCount; i++){
        Grenade &g = grenades[i];
        if(!g.alive) continue;
        if(g.exploded){
            g.life -= dt; if(g.life <= 0) g.alive = 0;
            continue;
        }
        g.x += g.vx * dt; g.z += g.vz * dt; g.dist += GRENADE_SPEED * dt; g.life -= dt;
        bool blocked = false;
        for(int j = 0; j < obstacleCount; j++){
            float dx = g.x - obstacles[j].x, dz = g.z - obstacles[j].z;
            if(dx * dx + dz * dz < obstacles[j].r * obstacles[j].r){ blocked = true; break; }
        }
        if(blocked || g.dist >= GRENADE_RANGE || g.life <= 0){
            g.exploded = 1; g.life = 0.4f;
            for(int k = 0; k < enemyCount; k++){
                Enemy &e = enemies[k]; if(!e.alive) continue;
                float dx = e.x - g.x, dz = e.z - g.z;
                if(dx * dx + dz * dz <= GRENADE_RADIUS * GRENADE_RADIUS){
                    e.hp -= GRENADE_DMG; e.hitFlash = 6;
                    if(e.hp <= 0) killEnemy(e);
                }
            }
        }
    }

    // ---- 敵の出現（上限数を維持しつつ、目標数まで出し切る） ----
    if(!bossActive && spawnQueue > 0){
        int alive = 0; for(int i = 0; i < enemyCount; i++) if(enemies[i].alive) alive++;
        spawnTimer -= dt;
        if(alive < CONCURRENT_CAP && spawnTimer <= 0){
            spawnTimer = 0.9f + frand() * 0.6f;
            spawnEnemyAt(ET_GRUNT); spawnQueue--;
        }
    }

    // ---- 敵AI ----
    for(int i = 0; i < enemyCount; i++) if(enemies[i].alive) stepEnemy(enemies[i], dt);

    // ---- 敵の弾の移動・当たり判定 ----
    for(int i = 0; i < ebulletCount; i++){
        EBullet &b = ebullets[i];
        if(!b.alive) continue;
        float nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
        bool blocked = false;
        for(int j = 0; j < obstacleCount; j++) if(segBlockedByCircle(b.x, b.z, nx, nz, obstacles[j].x, obstacles[j].z, obstacles[j].r)){ blocked = true; break; }
        float dx = nx - px, dz = nz - pz;
        bool hitPlayer = (dx * dx + dz * dz) <= (PLAYER_R * PLAYER_R);
        b.x = nx; b.z = nz; b.life -= dt;
        if(hitPlayer){ damagePlayer(9.0f); b.alive = 0; continue; }
        if(blocked || b.life <= 0 || b.x < -ARENA_HALF - 2 || b.x > ARENA_HALF + 2 || b.z < -ARENA_HALF - 2 || b.z > ARENA_HALF + 2) b.alive = 0;
    }

    // ---- トレーサー（見た目用）の寿命 ----
    for(int i = 0; i < tracerCount; i++) if(tracers[i].life > 0){ tracers[i].life -= dt; if(tracers[i].life < 0) tracers[i].life = 0; }
}

// 出力バッファ: HEADER(37) → obstacle*3 → enemy*8 → ebullet*3 → tracer*6 → grenade*5
// HEADER: 0 running 1 gameOver 2 stageCleared 3 score 4 combo 5 comboMax 6 hp 7 maxHp
//  8 ammo(現在の武器) 9 maxAmmo(現在の武器) 10 reloading 11 reloadT 12 grenadeCd 13 killCount 14 killTarget
//  15 bossActive 16 bossSpawned 17 bossHp 18 bossHpMax 19 elapsed 20 px 21 pz 22 yaw
//  23 obstacleCount 24 enemyCount 25 ebulletCount 26 tracerCount 27 grenadeCount
//  28 hitFlashT 29 arenaHalf 30 playerR 31 enemyR
//  32 curWeapon 33 weaponSwitchT 34 ammoWpn0 35 ammoWpn1 36 ammoWpn2
const int HEADER = 37;
const int PER_OBST = 3, PER_ENEMY = 8, PER_EB = 3, PER_TR = 6, PER_GR = 5;
float outBuf[HEADER + MAX_OBST * PER_OBST + MAX_ENEMY * PER_ENEMY + MAX_EBULLET * PER_EB + MAX_TRACER * PER_TR + MAX_GRENADE * PER_GR];

EM_KEEP float* g9_get_buffer(){
    float bossHp = 0, bossHpMax = 0;
    for(int i = 0; i < enemyCount; i++) if(enemies[i].alive && enemies[i].type == ET_BOSS){ bossHp = enemies[i].hp; bossHpMax = enemies[i].hpMax; }
    outBuf[0] = (float)running; outBuf[1] = (float)gameOver; outBuf[2] = (float)stageCleared;
    outBuf[3] = (float)score; outBuf[4] = (float)combo; outBuf[5] = (float)comboMax;
    outBuf[6] = hp; outBuf[7] = maxHp; outBuf[8] = (float)ammoArr[curWeapon]; outBuf[9] = (float)WEAPONS[curWeapon].maxAmmo;
    outBuf[10] = (float)reloading; outBuf[11] = reloadT; outBuf[12] = grenadeCd;
    outBuf[13] = (float)killCount; outBuf[14] = (float)killTarget;
    outBuf[15] = (float)bossActive; outBuf[16] = (float)bossSpawned; outBuf[17] = bossHp; outBuf[18] = bossHpMax;
    outBuf[19] = elapsed; outBuf[20] = px; outBuf[21] = pz; outBuf[22] = pyaw;
    outBuf[23] = (float)obstacleCount; outBuf[24] = (float)enemyCount; outBuf[25] = (float)ebulletCount;
    outBuf[26] = (float)tracerCount; outBuf[27] = (float)grenadeCount;
    outBuf[28] = hitFlashT; outBuf[29] = ARENA_HALF; outBuf[30] = PLAYER_R; outBuf[31] = ENEMY_R;
    outBuf[32] = (float)curWeapon; outBuf[33] = weaponSwitchT;
    outBuf[34] = (float)ammoArr[0]; outBuf[35] = (float)ammoArr[1]; outBuf[36] = (float)ammoArr[2];
    int o = HEADER;
    for(int i = 0; i < MAX_OBST; i++){
        if(i < obstacleCount){ outBuf[o] = obstacles[i].x; outBuf[o+1] = obstacles[i].z; outBuf[o+2] = obstacles[i].r; }
        else memset(&outBuf[o], 0, sizeof(float) * PER_OBST);
        o += PER_OBST;
    }
    for(int i = 0; i < MAX_ENEMY; i++){
        if(i < enemyCount && enemies[i].alive){
            Enemy &e = enemies[i];
            outBuf[o] = e.x; outBuf[o+1] = e.z; outBuf[o+2] = e.yaw; outBuf[o+3] = e.hp;
            outBuf[o+4] = e.hpMax; outBuf[o+5] = (float)e.type; outBuf[o+6] = (float)e.state; outBuf[o+7] = (float)e.hitFlash;
        } else memset(&outBuf[o], 0, sizeof(float) * PER_ENEMY);
        o += PER_ENEMY;
    }
    for(int i = 0; i < MAX_EBULLET; i++){
        if(i < ebulletCount && ebullets[i].alive){ outBuf[o] = ebullets[i].x; outBuf[o+1] = ebullets[i].z; outBuf[o+2] = 1.0f; }
        else memset(&outBuf[o], 0, sizeof(float) * PER_EB);
        o += PER_EB;
    }
    for(int i = 0; i < MAX_TRACER; i++){
        if(i < tracerCount && tracers[i].life > 0){
            outBuf[o] = tracers[i].ox; outBuf[o+1] = tracers[i].oz; outBuf[o+2] = tracers[i].tx; outBuf[o+3] = tracers[i].tz;
            outBuf[o+4] = tracers[i].life; outBuf[o+5] = (float)tracers[i].hit;
        } else memset(&outBuf[o], 0, sizeof(float) * PER_TR);
        o += PER_TR;
    }
    for(int i = 0; i < MAX_GRENADE; i++){
        if(i < grenadeCount && grenades[i].alive){
            outBuf[o] = grenades[i].x; outBuf[o+1] = grenades[i].z; outBuf[o+2] = 1.0f; outBuf[o+3] = (float)grenades[i].exploded; outBuf[o+4] = grenades[i].life;
        } else memset(&outBuf[o], 0, sizeof(float) * PER_GR);
        o += PER_GR;
    }
    return outBuf;
}

} // namespace g9

EM_KEEP int game9_ping(){ return 99; }
