/* audit_data.c - 台本・ひらめき・地図・NPC・ワープのデータ監査(Update16)。問題があれば終了コード1 */
#include <stdio.h>
#include <string.h>
#include "game.h"
static int u8(unsigned char c){return c<0x80?1:c<0xE0?2:c<0xF0?3:4;}
static int lines(const char*s){int n=1,w=0;while(*s){if(*s=='\n'){n++;w=0;s++;continue;}int l=u8((unsigned char)*s),cw=l==1?1:2;if(w+cw>40){n++;w=0;}w+=cw;s+=l;}return n;}
int main(void){int bad=0;
 for(int i=0;i<SCRIPT_COUNT;i++){int hasend=0;for(int j=0;j<SCRIPT_LEN[i];j++){const Step*s=&SCRIPTS[i][j];
   if(s->t==ST_LINE){int n=lines(s->text?s->text:"");if(n>5){printf("script %d step %d: %d lines (box fits 7 starting y34)\n",i,j,n);}if(n>7){bad++;printf("  OVERFLOW\n");} if(!s->text){printf("script %d step %d null text\n",i,j);bad++;}}
   if(s->t==ST_SETFLAG&&(s->a<0||s->a>=MAX_FLAGS)){printf("bad flag s%d\n",i);bad++;}
   if(s->t==ST_WARP&&(s->a<0||s->a>=AREA_COUNT)){printf("bad warp s%d\n",i);bad++;}
   if(s->t==ST_BATTLE&&(s->a<0||s->a>=GROUP_COUNT)){printf("bad group s%d\n",i);bad++;}
   if(s->t==ST_DEDUCT&&(s->a<0||s->a>=DEDUCTION_COUNT)){printf("bad deduct s%d\n",i);bad++;}
   if(s->t==ST_END)hasend=1;}
   if(!hasend)printf("script %d has no ST_END (len %d) - ends by running off\n",i,SCRIPT_LEN[i]);}
 for(int i=0;i<DEDUCTION_COUNT;i++){const Deduction*d=&DEDUCTIONS[i];for(int c=0;c<3;c++)if(lines(d->choice[c])>3){printf("deduct %d choice %d >3 lines\n",i,c);bad++;}
   if(lines(d->prompt)>5||lines(d->hint)>7||lines(d->solved)>7){printf("deduct %d long\n",i);bad++;}
   if(d->correct<0||d->correct>2){printf("deduct %d bad correct\n",i);bad++;}}
 for(int a=0;a<AREA_COUNT;a++){const Area*A=&AREAS[a];
  for(int y=0;y<A->h;y++)if((int)strlen(A->rows[y])!=A->w){printf("area %d row %d len %d != %d\n",a,y,(int)strlen(A->rows[y]),A->w);bad++;}
  for(int i=0;i<A->nNpc;i++){const Npc*n=&A->npc[i];if(!game_is_walkable(A,n->x,n->y)){printf("area %d npc %d (script %d) on unwalkable tile\n",a,i,n->script);bad++;}
   for(int j=0;j<A->nNpc;j++)if(j>i&&A->npc[j].x==n->x&&A->npc[j].y==n->y)printf("area %d npc %d,%d share (%d,%d) (ok if flag-exclusive: need %d/%d hide %d/%d)\n",a,i,j,n->x,n->y,n->needFlag,A->npc[j].needFlag,n->hideFlag,A->npc[j].hideFlag);}
  for(int i=0;i<A->nWarp;i++){const Warp*w=&A->warp[i];if(!game_is_walkable(A,w->x,w->y)){printf("area %d warp %d on unwalkable\n",a,i);bad++;}
   if(w->toArea<0||w->toArea>=AREA_COUNT||!game_is_walkable(&AREAS[w->toArea],w->tx,w->ty)){printf("area %d warp %d bad dest\n",a,i);bad++;}}
  for(int i=0;i<A->nTrig;i++){const Trigger*t=&A->trig[i];if(!game_is_walkable(A,t->x,t->y)){printf("area %d trig %d unwalkable\n",a,i);bad++;}}
  /* reachability from first warp-in tiles: BFS from all warp dests into this area */
  int seen[20][30];memset(seen,0,sizeof seen);int qx[600],qy[600],h=0,t=0;
  for(int b=0;b<AREA_COUNT;b++)for(int i=0;i<AREAS[b].nWarp;i++)if(AREAS[b].warp[i].toArea==a){int x=AREAS[b].warp[i].tx,y=AREAS[b].warp[i].ty;if(!seen[y][x]){seen[y][x]=1;qx[t]=x;qy[t]=y;t++;}}
  if(a==AREA_HINATA){seen[7][12]=1;qx[t]=12;qy[t]=7;t++;} if(a==AREA_STATUE||a==AREA_KUROMORI){seen[13][12]=1;qx[t]=12;qy[t]=13;t++;} if(a==AREA_MILFI){seen[8][11]=1;qx[t]=11;qy[t]=8;t++;}
  while(h<t){int x=qx[h],y=qy[h];h++;int dx[4]={0,0,-1,1},dy[4]={-1,1,0,0};for(int d=0;d<4;d++){int nx=x+dx[d],ny=y+dy[d];if(nx<0||ny<0||nx>=A->w||ny>=A->h||seen[ny][nx]||!game_is_walkable(A,nx,ny))continue;seen[ny][nx]=1;qx[t]=nx;qy[t]=ny;t++;}}
  for(int i=0;i<A->nNpc;i++){const Npc*n=&A->npc[i];int ok=0;int dx[4]={0,0,-1,1},dy[4]={-1,1,0,0};for(int d=0;d<4;d++){int nx=n->x+dx[d],ny=n->y+dy[d];if(nx>=0&&ny>=0&&nx<A->w&&ny<A->h&&seen[ny][nx])ok=1;}if(!ok){printf("area %d npc %d unreachable\n",a,i);bad++;}}
  for(int y=0;y<A->h;y++)for(int x=0;x<A->w;x++)if(A->rows[y][x]=='T'){int ok=0;int dx[4]={0,0,-1,1},dy[4]={-1,1,0,0};for(int d=0;d<4;d++){int nx=x+dx[d],ny=y+dy[d];if(nx>=0&&ny>=0&&nx<A->w&&ny<A->h&&seen[ny][nx])ok=1;}printf("area %d chest at (%d,%d) reachable=%d\n",a,x,y,ok);}
 }
 printf("audit done, problems=%d\n",bad);return bad;}
