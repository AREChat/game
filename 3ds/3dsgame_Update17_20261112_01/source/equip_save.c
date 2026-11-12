#include "equip_save.h"

#define OWN_MAX 99

static int checksum(const int *v, int n) {
    unsigned s = 0x5Au;
    for (int i = 0; i < n; i++) s = (s * 31u + (unsigned)(v[i] + 7)) & 0x7FFFFFFFu;
    return (int)s;
}

bool equip_validate(const EquipState *e) {
    if (!e) return false;
    int usedW[WEAPON_COUNT] = {0}, usedA[ARMOR_COUNT] = {0};
    for (int i = 0; i < MAX_PARTY; i++) {
        if (e->weapon[i] < 0 || e->weapon[i] >= WEAPON_COUNT) return false;
        if (e->armor[i] < 0 || e->armor[i] >= ARMOR_COUNT) return false;
        usedW[e->weapon[i]]++;
        usedA[e->armor[i]]++;
    }
    for (int i = 0; i < WEAPON_COUNT; i++) {
        if (e->ownedWeapon[i] < 0 || e->ownedWeapon[i] > OWN_MAX) return false;
        if (i > 0 && usedW[i] > e->ownedWeapon[i]) return false; /* 0=なし は無制限 */
    }
    for (int i = 0; i < ARMOR_COUNT; i++) {
        if (e->ownedArmor[i] < 0 || e->ownedArmor[i] > OWN_MAX) return false;
        if (i > 0 && usedA[i] > e->ownedArmor[i]) return false;
    }
    return true;
}

int equip_pack(const EquipState *e, int out[], int cap) {
    if (!out || cap < EQUIP_PACK_LEN || !equip_validate(e)) return -1;
    int k = 0;
    for (int i = 0; i < MAX_PARTY; i++) out[k++] = e->weapon[i];
    for (int i = 0; i < MAX_PARTY; i++) out[k++] = e->armor[i];
    for (int i = 0; i < WEAPON_COUNT; i++) out[k++] = e->ownedWeapon[i];
    for (int i = 0; i < ARMOR_COUNT; i++) out[k++] = e->ownedArmor[i];
    out[k] = checksum(out, k);
    return EQUIP_PACK_LEN;
}

bool equip_unpack(EquipState *e, const int in[], int n) {
    if (!e || !in || n != EQUIP_PACK_LEN) return false;
    if (in[EQUIP_PACK_LEN - 1] != checksum(in, EQUIP_PACK_LEN - 1)) return false;
    EquipState t;
    int k = 0;
    for (int i = 0; i < MAX_PARTY; i++) t.weapon[i] = in[k++];
    for (int i = 0; i < MAX_PARTY; i++) t.armor[i] = in[k++];
    for (int i = 0; i < WEAPON_COUNT; i++) t.ownedWeapon[i] = in[k++];
    for (int i = 0; i < ARMOR_COUNT; i++) t.ownedArmor[i] = in[k++];
    if (!equip_validate(&t)) return false;
    *e = t;
    return true;
}
