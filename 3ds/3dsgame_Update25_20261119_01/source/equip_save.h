/* equip_save.h - ほしあかり英雄譚 装備セーブ変換ロジック(Update04)
 * EquipState を int 配列へ詰める/戻す(SAVE_VERSION=3 への組み込み用)。
 * game.c 非依存。末尾にチェックサムを付け、壊れたデータは unpack が拒否する。 */
#ifndef EQUIP_SAVE_H
#define EQUIP_SAVE_H
#include <stdbool.h>
#include "shop.h"

#define EQUIP_PACK_LEN (MAX_PARTY * 2 + WEAPON_COUNT + ARMOR_COUNT + 1) /* +1 = チェックサム */

/* 値の範囲と整合性(装備中の数 <= 所持数、IDが範囲内、所持数0..99)を確認 */
bool equip_validate(const EquipState *e);
/* 配列へ詰める。成功で EQUIP_PACK_LEN、不正な状態/容量不足は -1 */
int equip_pack(const EquipState *e, int out[], int cap);
/* 配列から復元。検証/チェックサムに失敗したら false で e は変更しない */
bool equip_unpack(EquipState *e, const int in[], int n);
#endif
