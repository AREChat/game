/* data_story.c - 第1章「はじまりの広場」〜第2章「学び舎の事件」のシナリオ
 * 世界観はすべてオリジナル。人名・地名は実在のものと無関係。禁止事項は docs/story_bible.md を参照。
 * %N は主人公の名前に置き換わる。 */
#include "game.h"

#define L(w, t) {ST_LINE, w, t, 0, 0}
#define FLAG(f) {ST_SETFLAG, 0, 0, f, 0}
#define BATTLE(g) {ST_BATTLE, 0, 0, g, 0}
#define DEDUCT(d) {ST_DEDUCT, 0, 0, d, 0}
#define GIVE(i, n) {ST_GIVE, 0, 0, i, n}
#define JOIN(m) {ST_JOIN, 0, 0, m, 0}
#define WARP(a, x, y) {ST_WARP, 0, 0, a, ((x) << 8) | (y)}
#define HEAL() {ST_HEAL, 0, 0, 0, 0}
#define CHAPTER(n) {ST_CHAPTER, 0, 0, n, 0}
#define END() {ST_END, 0, 0, 0, 0}

static const Step sc_prologue[] = {
    L("", "星がこぼれる夜、ひなた村にひとつの産声が響いた。"),
    L("母", "生まれたわ……！ なんて元気な声なの。"),
    L("父", "この子はきっと、みんなを助ける英雄になるぞ。"),
    L("", "赤ちゃんには、ひとつ変わった才能があった。"),
    L("", "なんでも「どうして？」と考え、謎を解くのが大好きなのだ。"),
    L("", "これは、%Nが星あかりの道を歩いていく物語。"),
    FLAG(F_PROLOGUE), END()
};
static const Step sc_meet_sera[] = {
    L("", "ひだまり公園で、同い年の女の子と出会った。"),
    L("セラ", "はじめましちゃ、よろちくね！"),
    L("%N", "こんにちひゃ、よろちきおねぎいしまふ！"),
    L("", "ふたりとも言葉を覚えたてで、うまく話せない。"),
    L("", "それでも不思議と気持ちは通じ合い、親どうしも仲良くなった。"),
    GIVE(ITEM_HERB, 2),
    L("", "やくそう を2つ もらった。"),
    FLAG(F_MET_SERA), END()
};
static const Step sc_ride[] = {
    L("係員", "いらっしゃい！ 『そらとぶ舟』は、空を飛べる人気者だよ！"),
    L("父", "よし、乗ってみるか。"),
    L("", "みんなの舟は、ふわりと空へ舞い上がった。"),
    L("", "……ところが、%Nの舟だけぴくりとも動かない。"),
    L("父", "ん？ 壊れてるのか？"),
    L("%N", "うん。"),
    L("", "ふしぎな思い出として、胸に強く残った。"),
    FLAG(F_RIDE_DONE), END()
};
static const Step sc_fire_bell[] = {
    L("", "その夜、遠くで半鐘が鳴りひびいた。"),
    L("母", "なんだか、けむり臭くない？"),
    L("%N", "うん。"),
    L("父", "ちょっと見てくるか。"),
    L("", "3キロ先の家が燃えている！"),
    L("父", "%N、見張り塔へ知らせてきてくれ。"),
    L("%N", "うん！ ……知らせたよ！"),
    L("", "村人たちが外へ出てきた。そのとき――"),
    L("父", "ん？ あれは……！"),
    L("山賊", "じゃまだ、どけ！ 短剣のサビになりたいか！"),
    L("父", "やめろ！ まだ小さい子供だぞ！"),
    L("%N", "ぼくは、できるから！"),
    BATTLE(G_BANDIT),
    L("山賊", "くそっ……！"),
    L("父", "あとは任せろ！"),
    L("", "山賊は村の衛兵に捕まった。"),
    L("衛兵", "君は将来、村の衛兵にならないか？ 似合ってるぞ。"),
    L("%N", "ううん、ぼくは星の汽車の運転手になりたいよ。"),
    L("衛兵", "そうか、残念だ。でも夢に向かって頑張れよ！"),
    HEAL(),
    FLAG(F_BANDIT_DEAD), FLAG(F_BELL_DONE), END()
};
static const Step sc_kinder_arrive[] = {
    L("", "4歳になった%Nは、はじめて『みつば園』へやってきた。"),
    L("セラ", "あれ？ もしかして……%Nくん？"),
    L("%N", "セラさん！？ ひさしぶり！"),
    L("", "はじめての園で、思いがけない再会。胸があたたかくなった。"),
    FLAG(F_KINDER_ARRIVED), END()
};
static const Step sc_dispute[] = {
    L("セラ", "%Nくん、あれ見て！"),
    L("", "ライとロクが、木のコマを取り合ってけんかしている。"),
    L("ライ", "なんだお前？ 文句あるのかよ。"),
    L("ロク", "おれたちに口出しするなよ。"),
    L("%N", "先生は忙しそうだし、ぼくが解決するか。"),
    L("%N", "……そうだ！ ふたりとも、ちょっと考えてみよう。"),
    DEDUCT(0),
    L("ライ", "それなら我慢できる！"),
    L("ロク", "いいね、そのルール。"),
    L("セラ", "%Nくん、すごい！ これからもいろんな問題を解決してよ。"),
    L("%N", "う～ん……がんばってみる。"),
    GIVE(ITEM_ETHER, 1),
    L("", "ふしぎな水 を1つ もらった。"),
    FLAG(F_DISPUTE_DONE), END()
};
/* 第1章の終わり → 章カード → 学び舎の町ミルフィへ引っ越し(第2章の始まり) */
static const Step sc_kinder_done[] = {
    L("先生", "%Nくん。ご両親のお仕事の都合で、春にはお引っ越しね。"),
    L("セラ", "え？ 引っ越しちゃうの？"),
    L("%N", "安心して。大きくなったら、また会おうよ！"),
    L("セラ", "うん、わかった！ 約束だよ！"),
    L("", "指きりをして、ふたりは別れた。"),
    FLAG(F_CH1_DONE),
    CHAPTER(2),
    WARP(AREA_MILFI, 11, 8),
    L("", "春になり、%Nは学び舎の町『ミルフィ』へ引っ越してきた。"),
    L("%N", "ここが新しい町かあ。北に見える大きな建物が、学び舎だね。"),
    FLAG(F_CH2_START), END()
};
static const Step sc_mother[] = {
    L("母", "おかえり。公園へ行くなら、日が暮れる前に帰るのよ。"),
    L("母", "困っている子がいたら、助けてあげなさいね。"), END()
};
static const Step sc_father[] = {
    L("父", "星あかり祭りの広場は、東の道をまっすぐだ。"),
    L("父", "原っぱには小さな魔物がいるから、気をつけるんだぞ。"), END()
};
static const Step sc_oldman[] = {
    L("じいさん", "この村では、赤ちゃんが生まれる夜に星が降るんじゃ。"),
    L("じいさん", "%Nが生まれた夜は、ひときわ明るかったのう。"), END()
};
static const Step sc_sera_home[] = {
    L("セラの母", "うちのセラが、いつもお世話になっております。"), END()
};
static const Step sc_sign[] = {
    L("看板", "【ひなた村】 星あかりの下、みんな仲良く。"),
    L("看板", "Aボタンで話す・調べる、Xボタンでメニュー(セーブもここ)"), END()
};
static const Step sc_ride_man[] = {
    L("係員", "『そらとぶ舟』は故障知らず……のはずなんだがなあ。"), END()
};
static const Step sc_sister[] = {
    L("村の子", "あっちの原っぱで、ぷるぷる動くしずくの精を見たよ！"), END()
};
static const Step sc_teacher[] = {
    L("先生", "みつば園へようこそ。みんな仲良く遊びましょうね。"), END()
};
static const Step sc_blocked_kinder[] = {
    L("", "みつば園は4歳から。いまは、まだ入れないようだ……。"), END()
};
static const Step sc_field_kid[] = {
    L("子供", "宝箱は、やぶの奥にあるんだって！"), END()
};
static const Step sc_ch2_placeholder[] = {
    L("", "第2章は、次回の更新でお届けします。"), END()
};
static const Step sc_sera_kinder[] = {
    L("セラ", "%Nくん、あとでいっしょにコマ回しで遊ぼうね！"), END()
};
static const Step sc_chest_herb[] = {
    L("", "宝箱をあけた！ やくそう を3つ手に入れた。"),
    GIVE(ITEM_HERB, 3), FLAG(F_GOT_HERB_CHEST), END()
};
static const Step sc_chest_empty[] = {
    L("", "宝箱は からっぽだ。"), END()
};
static const Step sc_ch1_end[] = { END() };

/* ================= 第2章 学び舎の事件 ================= */
static const Step sc_milfi_a[] = {
    L("町の人", "ミルフィは学び舎の町。朝から子供たちの声がにぎやかよ。"),
    L("町の人", "でも、きのうから学び舎が妙に静かなのよねえ。"), END()
};
static const Step sc_milfi_b[] = {
    L("町の子", "学び舎の先生たちが、きのうから姿を見せないんだって。"),
    L("町の子", "中をのぞいたら、ほうきがひとりでに動いてたんだ！"), END()
};
static const Step sc_milfi_c[] = {
    L("おばあさん", "ミルフィでは、新入りさんに声をかける決まりなのよ。"),
    L("おばあさん", "さあ、学び舎は北の大きな建物だよ。"), END()
};
static const Step sc_school_enter[] = {
    L("", "学び舎の中は、しんと静まりかえっている。"),
    L("", "廊下には、縄で縛られた先生たちの姿があった。"),
    L("%N", "たいへんだ……！ 先生たちが縛られてる！"),
    L("???", "おっと、動かないで。……敵じゃなさそうだな。"),
    FLAG(F_SCHOOL_ENTERED), END()
};
static const Step sc_gai_join[] = {
    L("ガイ", "ぼくはガイ。推理小説が大好きな、この学び舎の生徒さ。"),
    L("ガイ", "これはただのいたずらじゃない。きっと誰かの仕業だ。"),
    L("ガイ", "君、謎解きは得意かい？ いっしょに手がかりを探そう！"),
    L("%N", "うん！ ひらめきなら、まかせて。"),
    JOIN(MEM_GAI),
    L("", "ガイが なかまに くわわった！"),
    FLAG(F_GAI_JOINED), END()
};
static const Step sc_teacher_bound[] = {
    L("先生", "うう……縄がきつくて動けないの。どうか犯人を見つけてちょうだい。"), END()
};
static const Step sc_teacher_free[] = {
    L("先生", "縄をほどいてくれて、ありがとう。学び舎はもう安心ね。"),
    L("先生", "ミルフィの子供たちを、これからもよろしくね。"), END()
};
static const Step sc_clue_a[] = {
    L("", "廊下に、インクのついた足あとが続いている。"),
    L("", "そばには、切れた縄のはしも落ちていた。"),
    L("ガイ", "縄は高い柱にしっかり結ばれ、職員室の鍵もあけられてる。"),
    L("ガイ", "さあ、この犯人はどんな人物だろう？"),
    DEDUCT(1),
    L("ガイ", "なるほど！ ほかにも手がかりがあるはずだ。奥の机を調べてみよう。"),
    FLAG(F_CLUE_A), END()
};
static const Step sc_clue_b[] = {
    L("", "机の下に、『星の鍵』の合鍵をつくる型が落ちていた。"),
    L("ガイ", "こんな型を持てるのは、学び舎の鍵を預かる人だけだ……。"),
    L("%N", "校長先生に、話を聞いてみよう。"),
    FLAG(F_CLUE_B), END()
};
static const Step sc_principal_idle[] = {
    L("校長", "いま取り込み中だ。授業は中止、中止！"),
    L("校長", "さわぎは外の賊の仕業だ。君たちは帰りなさい。"), END()
};
static const Step sc_principal_confront[] = {
    L("校長", "なんだね、君たち。さわぎは外の賊の仕業だと言っただろう。"),
    L("%N", "いいえ。ぼくたちには、わかります。"),
    DEDUCT(2),
    L("校長", "ぐ……！ ばれたか！ 出てこい、用心棒！"),
    BATTLE(G_BOUNCER),
    L("校長", "まいった……。学び舎の宝を売って、お金に換えようとしたのだ……。"),
    L("衛兵", "通報を受けて来たぞ！ 校長、話は詰所で聞こう。"),
    L("ガイ", "やったね、%N。ぼくたちの推理が当たった！"),
    L("先生", "縄をほどいてくれて助かったわ。お礼に、これをどうぞ。"),
    GIVE(ITEM_TONIC, 2),
    L("", "ほしのしずく を2つ もらった。"),
    HEAL(),
    FLAG(F_PRINCIPAL_DONE), FLAG(F_CH2_DONE),
    CHAPTER(3),
    L("", "学び舎の庭で、勤勉の像が取りこわされるという。"),
    L("ガイ", "像のまわりを調べてみよう。手がかりがあるはずだよ。"),
    FLAG(F_CH3_START),
    WARP(AREA_STATUE, 12, 13), END()
};

static const Step sc_ch3_spot0[] = {
    L("", "台座の うらに あたらしい けずりあとが ある。さいきん だれかが さわった ようだ。"),
    L("", "（手がかり 1 をメモした）"),
    FLAG(F_CH3_C0), END()
};
static const Step sc_ch3_spot1[] = {
    L("", "像の もつ 本を のぞくと…ページが まっしろだ。もとは 金色の もじが あったはずだ。"),
    L("", "（手がかり 2 をメモした）"),
    FLAG(F_CH3_C1), END()
};
static const Step sc_ch3_spot2[] = {
    L("", "会計帳を めくった。像の しゅうり代の ページが どこにも ない。"),
    L("", "（手がかり 3 をメモした）"),
    FLAG(F_CH3_C2), END()
};
static const Step sc_ch3_spot3[] = {
    L("", "夜の 庭の すみに 荷車の わだちが のこっている。こうもんの 方へ のびている。"),
    L("", "（手がかり 4 をメモした）"),
    FLAG(F_CH3_C3), END()
};
static const Step sc_ch3_spot4[] = {
    L("", "石工の ふるい 手紙を ひろった。「像の 金ぱくは はがせる。うる 人も いる」と ある。"),
    L("", "（手がかり 5 をメモした）"),
    FLAG(F_CH3_C4), END()
};
static const Step sc_ch3_crowd[] = {
    L("", "学び舎の庭に、全校生徒が集まってきた。"),
    L("生徒たち", "勤勉の像は、どうして片づけられちゃうの？"),
    L("先生", "古くなったから、というのが学び舎の言い分です。けれど、それだけでしょうか。"),
    L("ガイ", "%N、手がかりはそろったよね。みんなの前で話してみよう。"),
    L("セラ", "だいじょうぶ。%Nのひらめき、わたしは信じてるよ。"),
    L("%N", "……はい。ぼくの考えを聞いてください。"),
    DEDUCT(3),
    L("%N", "像の足もとには、土をほりかえした跡がありました。像を動かすのが目的ではなかったんです。"),
    L("ガイ", "台座のすき間から出てきた古い手紙。そこには、像をつくった人の願いが書かれていた。"),
    L("セラ", "「勉強は、だれかに見せるためではなく、自分の星を磨くためにするもの」……そう書いてあったよ。"),
    L("%N", "像をなくそうとした人は、この手紙が見つかるのを止めたかったのだと思います。"),
    L("先生", "……そのとおりです。わたしの負けです。手紙は、あなたたちにお返ししましょう。"),
    L("生徒たち", "すごい！ %Nの推理、ぴったりだ！"),
    L("", "像はそのまま、庭に残されることになった。"),
    L("", "事件のあと、学び舎の庭はおだやかな夕やけに包まれた。"),
    L("母", "%N、手紙が届いたの。山あいの町クロモリで、新しいお仕事が決まりそうなのよ。"),
    L("%N", "クロモリ……暗い山里だって聞いたことがあるよ。"),
    L("ガイ", "遠くなるけど、ぼくたちの友だちは変わらないさ。"),
    L("セラ", "またいつか、星の下で会おうね。約束だよ。"),
    L("", "%Nは、ミルフィの町をあとにして、クロモリへ旅立った。"),
    FLAG(F_CH3_DONE),
    CHAPTER(4),
    L("", "第4章は、次回の更新でお届けします。"), END()
};
static const Step sc_ch3_crowd_idle[] = {
    L("ガイ", "まずは庭を調べて、手がかりを集めよう。"), END()
};
static const Step sc_ch3_student[] = {
    L("生徒", "勤勉の像が 取りこわされるって ほんと? みんな ふしぎがっているよ。"), END()
};
static const Step sc_ch3_teacher[] = {
    L("先生", "像は ずっと 金色に かがやいていたのに、さいきん くすんで 見えるのよ。"), END()
};
static const Step sc_ch3_gai[] = {
    L("ガイ", "手がかりを 集めて、全校の みんなの 前で すいりを 話そう!"), END()
};

#define N(a) (int)(sizeof(a) / sizeof((a)[0]))
const Step *const SCRIPTS[] = {
    sc_prologue, sc_meet_sera, sc_ride, sc_fire_bell, sc_ch1_end, sc_ch1_end,
    sc_kinder_arrive, sc_dispute, sc_kinder_done, sc_mother, sc_father, sc_oldman,
    sc_sera_home, sc_sign, sc_ch1_end, sc_ride_man, sc_sister, sc_teacher,
    sc_blocked_kinder, sc_field_kid, sc_ch2_placeholder, sc_sera_kinder, sc_chest_herb, sc_chest_empty,
    sc_milfi_a, sc_milfi_b, sc_milfi_c, sc_school_enter, sc_gai_join, sc_teacher_bound,
    sc_teacher_free, sc_clue_a, sc_clue_b, sc_principal_idle, sc_principal_confront,
    sc_ch3_spot0, sc_ch3_spot1, sc_ch3_spot2, sc_ch3_spot3, sc_ch3_spot4, sc_ch3_crowd, sc_ch3_crowd_idle, sc_ch3_student, sc_ch3_teacher, sc_ch3_gai
};
const int SCRIPT_LEN[] = {
    N(sc_prologue), N(sc_meet_sera), N(sc_ride), N(sc_fire_bell), N(sc_ch1_end), N(sc_ch1_end),
    N(sc_kinder_arrive), N(sc_dispute), N(sc_kinder_done), N(sc_mother), N(sc_father), N(sc_oldman),
    N(sc_sera_home), N(sc_sign), N(sc_ch1_end), N(sc_ride_man), N(sc_sister), N(sc_teacher),
    N(sc_blocked_kinder), N(sc_field_kid), N(sc_ch2_placeholder), N(sc_sera_kinder), N(sc_chest_herb), N(sc_chest_empty),
    N(sc_milfi_a), N(sc_milfi_b), N(sc_milfi_c), N(sc_school_enter), N(sc_gai_join), N(sc_teacher_bound),
    N(sc_teacher_free), N(sc_clue_a), N(sc_clue_b), N(sc_principal_idle), N(sc_principal_confront),
    N(sc_ch3_spot0), N(sc_ch3_spot1), N(sc_ch3_spot2), N(sc_ch3_spot3), N(sc_ch3_spot4), N(sc_ch3_crowd), N(sc_ch3_crowd_idle), N(sc_ch3_student), N(sc_ch3_teacher), N(sc_ch3_gai)
};
const int SCRIPT_COUNT = N(SCRIPT_LEN);

const Deduction DEDUCTIONS[] = {
    { "ひらめきタイム",
      "ライとロクがコマの取り合い。みんなが納得する方法は？",
      { "先生に言いつける", "じゃんけんで勝った人が5分使い、次は交代", "コマを取り上げて隠す" },
      1,
      "ふたりとも「自分が使いたい」だけ。順番に使えるルールを考えてみよう。",
      "ひらめいた！ ぜんぶ つながったぞ！ 時間で区切れば、ふたりとも納得できる。" },
    { "ひらめきタイム",
      "切れた縄、高い柱の結び目、あけられた職員室の鍵。縛ったのは、どんな人物？",
      { "背の低い子供", "学び舎にくわしい大人", "通りすがりの旅人" },
      1,
      "高い柱に結べて、しかも鍵を持っているのは、誰だろう？",
      "ひらめいた！ 鍵と建物にくわしい、学び舎の大人の仕業だ。" },
    { "ひらめきタイム",
      "『星の鍵』が盗まれた夜、扉も窓もこわされていなかった。どうやって入った？",
      { "窓から入った泥棒", "合鍵を持つ校長先生", "風で扉がひとりでに開いた" },
      1,
      "どこもこわされていないなら、鍵を使った人がいるはず。合鍵の型は誰のもの？",
      "ひらめいた！ 合鍵を持てるのは校長先生だけ。犯人はあなたです！" },
    { "ひらめきタイム",
      "像の金ぱくが消え、会計帳の修理代のページもない。像は、どうなったのか？",
      { "像は こわれて いたから かたづける", "会計係が 像の金ぱくを はがして うった", "像は 自分で どこかへ 歩いていった" },
      1,
      "まず 像の台座を しらべてみよう。",
      "ひらめいた！ 会計係が 像の 金ぱくを はがして 売っていた。お金の ふそくを かくすために…。" }
};
const int DEDUCTION_COUNT = N(DEDUCTIONS);

const char *const CHAPTER_TITLES[] = { "", "第1章 はじまりの広場", "第2章 学び舎の事件", "第3章 勤勉の像の謎", "第4章 家族の危機" };
const int CHAPTER_TITLE_COUNT = 5;
