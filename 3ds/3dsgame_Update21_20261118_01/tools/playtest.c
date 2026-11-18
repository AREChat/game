/* playtest.c - 通しプレイ自動テスト(Update16)。使い方: playtest セーブ先 乱数の種 [q] < シナリオ。終了コード0=全ASSERT合格 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "game.h"
#include "platform.h"
#include "host_api.h"
static unsigned keyof(char c){switch(c){case 'A':return PK_A;case 'B':return PK_B;case 'X':return PK_X;case 'S':return PK_START;
 case 'U':return PK_UP;case 'D':return PK_DOWN;case 'L':return PK_LEFT;case 'R':return PK_RIGHT;case '.':return 0;}return 0;}
static void frame(unsigned k){static unsigned a[1];a[0]=k;host_set_script(a,1);host_set_max_frames(1000000);game_frame();}
static int quiet=0,fails=0;
static int scene_is(const char*n){return !strcmp(game_scene_name(),n);}
static void talk(void){int g=0;while(scene_is("script")&&g++<400){if(!quiet)printf("  | %s",host_screen_text());frame(PK_A);}printf("  => scene=%s\n",game_scene_name());}
static int walk(int tx,int ty){SaveData*g=game_data();int ar=g->area;const Area*a=&AREAS[ar];
 int dist[40][40];for(int y=0;y<40;y++)for(int x=0;x<40;x++)dist[y][x]=-1;int qx[2000],qy[2000],h=0,t=0;qx[t]=g->px;qy[t]=g->py;t++;dist[g->py][g->px]=0;
 int dx[4]={0,0,-1,1},dy[4]={-1,1,0,0};
 while(h<t){int x=qx[h],y=qy[h];h++;for(int d=0;d<4;d++){int nx=x+dx[d],ny=y+dy[d];if(nx<0||ny<0||nx>=a->w||ny>=a->h)continue;if(dist[ny][nx]>=0)continue;if(!game_is_walkable(a,nx,ny))continue;
  int blk=0;for(int i=0;i<a->nNpc;i++)if(a->npc[i].x==nx&&a->npc[i].y==ny&&(a->npc[i].needFlag<0||g->flags[a->npc[i].needFlag])&&!(a->npc[i].hideFlag>=0&&g->flags[a->npc[i].hideFlag]))blk=1;if(blk&&!(nx==tx&&ny==ty))continue;if(blk)continue;
  dist[ny][nx]=dist[y][x]+1;qx[t]=nx;qy[t]=ny;t++;}}
 if(dist[ty][tx]<0){printf("  walk: no path to (%d,%d)\n",tx,ty);return 0;}
 int cx=tx,cy=ty;int px[200],py[200],n=0;while(!(cx==g->px&&cy==g->py)){px[n]=cx;py[n]=cy;n++;int found=0;for(int d=0;d<4&&!found;d++){int nx=cx+dx[d],ny=cy+dy[d];if(nx<0||ny<0||nx>=a->w||ny>=a->h)continue;if(dist[ny][nx]==dist[cy][cx]-1){cx=nx;cy=ny;found=1;}}if(!found)break;}
 for(int i=n-1;i>=0;i--){int ox=g->px,oy=g->py;unsigned k=px[i]>ox?PK_RIGHT:px[i]<ox?PK_LEFT:py[i]>oy?PK_DOWN:PK_UP;frame(k);if(!scene_is("map")||g->area!=ar){printf("  walk interrupted at step %d/%d: scene=%s area=%d\n",n-i,n,game_scene_name(),g->area);return 0;}}
 return 1;}
static void keys(const char*k){for(;*k;k++)frame(keyof(*k));}
static int has(const char*t){return strstr(host_screen_text(),t)!=0;}
static void fight(const char*pat,int verbose){int guard=0;
 for(const char*p=pat;*p&&scene_is("battle")&&guard++<200;p++){
  int g2=0;while(scene_is("battle")&&!has("どうする？")&&g2++<60){frame(PK_A);if(verbose)printf("    . %s",host_screen_text());}
  if(!scene_is("battle"))break;
  int mi=(int)(p-pat)%game_data()->partyN;char c=*p;if(c=='s'&&game_data()->party[mi].mp<3)c='a';if(c=='h'&&game_data()->items[0]<=0)c='a';
  if((c=='a'||c=='s')&&game_data()->items[0]>0&&game_data()->party[mi].hp*2<game_data()->party[mi].maxhp)c='h';switch(c){case 'a':keys("A");break;case 's':keys("RAA");break;case 'h':keys("DAAA");break;case 'r':keys("DRA");break;case 'e':keys("DAD");keys("A");break;default:break;}
  if(verbose){printf("  round '%c' ->\n%s",*p,host_screen_text());}
 }
 int g3=0;while(scene_is("battle")&&g3++<80){ if(has("どうする？"))break; frame(PK_A);if(verbose)printf("    . %s",host_screen_text());}
 printf("  fight end scene=%s\n",game_scene_name());}
static void heal_menu(void){SaveData*g=game_data();
 for(int i=0;i<g->partyN;i++){int guard=0;while(g->party[i].hp*2<g->party[i].maxhp&&g->items[0]>0&&guard++<4&&scene_is("map")){
  keys("XAA");for(int r=0;r<i;r++)keys("R");keys("ABB");}}
 while(scene_is("menu"))frame(PK_B);}
static int grind(int lv){SaveData*g=game_data();int n=0,b=0;
 while(g->party[0].level<lv&&n++<3000){ if(!scene_is("map"))break;
  frame((n%2)?PK_UP:PK_DOWN);
  if(scene_is("battle")){b++;fight("saaaaaaaaaaaaaaaaaaaaaa",0);if(scene_is("script"))talk();if(scene_is("gameover")){printf("  GRIND: gameover\n");return 0;} heal_menu();}
  else if(scene_is("script"))talk(); }
 printf("  GRIND lv>=%d: now Lv%d after %d battles\n",lv,g->party[0].level,b);return g->party[0].level>=lv;}
static void show(void){SaveData*g=game_data();printf("[%s] area=%s(%d) pos=(%d,%d) ch=%d gold=%d party=%d items=%d/%d/%d hp=",game_scene_name(),AREAS[g->area].name,g->area,g->px,g->py,g->chapter,g->gold,g->partyN,g->items[0],g->items[1],g->items[2]);
 for(int i=0;i<g->partyN;i++)printf("%s:L%d %d/%d mp%d exp%d ",g->party[i].name,g->party[i].level,g->party[i].hp,g->party[i].maxhp,g->party[i].mp,g->party[i].exp);
 printf("\n--screen--\n%s--------\n",host_screen_text());}
int main(int argc,char**argv){
 host_set_save_path(argc>1?argv[1]:"playtest_save.dat"); quiet=(argc>3&&argv[3][0]=='q'); game_seed(argc>2?(unsigned)atoi(argv[2]):7);
 char line[4096];
 while(fgets(line,sizeof line,stdin)){
  line[strcspn(line,"\n")]=0;
  if(line[0]=='#'){printf("\n### %s\n",line+1);continue;}
  if(!strncmp(line,"name ",5)){host_set_input_name(line+5);continue;}
  if(!strncmp(line,"set ",4)){int a,v;char w[16];SaveData*g=game_data();if(sscanf(line+4,"%15s %d %d",w,&a,&v)>=2){
    if(!strcmp(w,"flag"))g->flags[a]=1; else if(!strcmp(w,"hp"))g->party[a].hp=v; else if(!strcmp(w,"mp"))g->party[a].mp=v;
    else if(!strcmp(w,"item"))g->items[a]=v; else if(!strcmp(w,"lv")){g->party[a].level=v;} else if(!strcmp(w,"gold"))g->gold=a;
    else if(!strcmp(w,"pos")){g->px=a;g->py=v;} else if(!strcmp(w,"area"))g->area=a;}continue;}
  if(line[0]=='W'&&line[1]=='F'){int x,y;sscanf(line+3,"%d %d",&x,&y);int tries=0,r=0,bn=0;SaveData*g=game_data();
   while(tries++<60){r=walk(x,y);if(r)break;if(scene_is("battle")){bn++;fight("saaaaaaaaaaaaaaaaaaaaa",0);if(scene_is("script"))talk();if(scene_is("gameover")){printf("  GAMEOVER during WF\n");break;}}else break;}
   printf("  WF(%d,%d) r=%d battles=%d now (%d,%d) scene=%s lv=%d hp=%d/%d\n",x,y,r,bn,g->px,g->py,game_scene_name(),g->party[0].level,g->party[0].hp,g->party[0].maxhp);continue;}
  if(line[0]=='F'&&line[1]==' '){fight(line+2,1);continue;}
  if(line[0]=='f'&&line[1]==' '){fight(line+2,0);continue;}
  if(!strncmp(line,"GRIND ",6)){if(!grind(atoi(line+6)))fails++;continue;}
  if(!strcmp(line,"HEAL")){heal_menu();continue;}
  if(!strncmp(line,"ASSERT ",7)){char k[16],v[64]="";sscanf(line+7,"%15s %63[^\n]",k,v);SaveData*g=game_data();int ok=0;char cur[64]="";
   if(!strcmp(k,"scene")){ok=!strcmp(game_scene_name(),v);snprintf(cur,64,"%s",game_scene_name());}
   else if(!strcmp(k,"chapter")){ok=g->chapter==atoi(v);snprintf(cur,64,"%d",g->chapter);}
   else if(!strcmp(k,"area")){ok=g->area==atoi(v);snprintf(cur,64,"%d",g->area);}
   else if(!strcmp(k,"party")){ok=g->partyN==atoi(v);snprintf(cur,64,"%d",g->partyN);}
   else if(!strcmp(k,"flag")){ok=g->flags[atoi(v)]!=0;snprintf(cur,64,"%d",g->flags[atoi(v)]);}
   else if(!strcmp(k,"minlv")){ok=g->party[0].level>=atoi(v);snprintf(cur,64,"%d",g->party[0].level);}
   else if(!strcmp(k,"alive")){ok=g->party[0].hp>0;snprintf(cur,64,"%d",g->party[0].hp);}
   else if(!strcmp(k,"screen")){ok=strstr(host_screen_text(),v)!=0;snprintf(cur,64,"(screen)");}
   else {printf("ASSERT unknown key %s\n",k);ok=0;}
   if(ok)printf("  ASSERT %s %s ... OK\n",k,v);else{printf("  ASSERT %s %s ... FAIL (now %s)\n",k,v,cur);fails++;}
   continue;}
  if(!strcmp(line,"ENC")){int n=0;while(scene_is("map")&&n++<2000){frame(n%2?PK_UP:PK_DOWN);}printf("  ENC after %d steps -> %s\n",n,game_scene_name());continue;}
  if(!strcmp(line,"SOLVE")){int n=0;while(scene_is("deduct")&&n++<12){frame(PK_A);if(has("ヒント")){printf("  wrong guess -> hint shown\n");frame(PK_A);frame(PK_DOWN);}else if(has("ひらめき！")){printf("  correct!\n");frame(PK_A);break;}}printf("  => scene=%s\n",game_scene_name());continue;}
  if(line[0]=='T'&&!line[1]){talk();continue;}
  if(line[0]=='W'&&line[1]==' '){int x,y;sscanf(line+2,"%d %d",&x,&y);int r=walk(x,y);printf("  walk(%d,%d)=%d now (%d,%d) scene=%s\n",x,y,r,game_data()->px,game_data()->py,game_scene_name());continue;}
  if(!strcmp(line,"show")){show();continue;}
  if(!strcmp(line,"quit?")){printf("quit=%d\n",game_quit_requested());continue;}
  /* tokens: key letters, digits = repeat previous */
  unsigned lk=0;int nn=0;for(char*p=line;*p;p++){ if(*p==' ')continue; if(*p>='0'&&*p<='9'){nn=nn*10+(*p-'0');continue;} if(nn){for(int i=1;i<nn;i++)frame(lk);nn=0;} lk=keyof(*p);frame(lk);} if(nn){for(int i=1;i<nn;i++)frame(lk);}
 }
 printf("PLAYTEST %s (failures=%d)\n",fails?"FAILED":"PASSED",fails); return fails?1:0;}
