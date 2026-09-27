// ══════════════════════════════════════════════════════
// BLACKHOLE STORM V2 — DRAG THE BLACK HOLE
// The player drags the hole with one finger; bodies fall in from the edges, fall into its gravity
// field, spiral in and make it grow. Meteors must be dodged, combos build Rage, a tap unleashes it.
// All sizes and speeds are the V2 baseline in reference px of a 1080×1920 portrait screen,
// scaled to the phone by G2.S. Injected into game.src.html by src/build.py.
// ══════════════════════════════════════════════════════
const V2=true;
const V2K={r0:34,rMax:180,rRage:240,gK:2.2,gMax:450,gMaxOver:500,off:50,follow:.9,
  acc:{min:.15,max:1.8,rage:3},
  rage:{dur:5,r:1.2,g:1.5,acc:1.67,score:2},time:{dur:6,k:.45},over:{dur:15,r:1.15,g:1.4,ctl:1.15},
  mini:{dur:6,k:.6,rMin:17,rMax:60,gK:2.4,gMax:150},bomb:{r:3,hold:3,pts:25,max:500},imm:.8,
  met:{slow:.3,ramp:.3},cont:{imm:3,rage:50},
  dodge:{lo:10,hi:35,cd:1.5},perfectK:.2,swallow:.35,
  dur:[0,60,65,70,70,75,75,80,80,90,90],comboT:[0,3,2.7,2.5,2.3]};
// r: radius, v/dv/vm: speed at level 1, per-level increase, maximum (ref px/s); pts: score; grow: radius gain;
// rage: Rage gain; need: hole size (× start radius) required to swallow it
const OBJ2={
  ast:    {r:18,v:220,dv:12,vm:500,pts:10, grow:.3, rage:1, need:1},
  moon:   {r:27,v:170,dv:10,vm:350,pts:25, grow:.7, rage:2, need:1.15},
  planet: {r:48,v:120,dv:8, vm:250,pts:100,grow:2,  rage:4, need:1.35},
  crystal:{r:16,v:260,dv:15,vm:550,pts:200,grow:2.5,rage:6, need:1},
  gold:   {r:30,v:300,dv:0, vm:600,pts:500,grow:4,  rage:10,need:1.15},
  energy: {r:14,v:200,dv:8, vm:420,pts:15, grow:.5, rage:15,need:1},
  time:   {r:16,v:190,dv:6, vm:380,pts:25, grow:.5, rage:2, need:1},
  bomb:   {r:24,v:170,dv:8, vm:360,pts:50, grow:1,  rage:3, need:1},
  mini:   {r:28,v:150,dv:5, vm:300,pts:100,grow:0,  rage:3, need:1},
  meteor: {r:22,v:380,dv:20,vm:750,pts:0,  grow:0,  rage:0, need:99},
  frag:   {r:15,v:150,dv:0, vm:300,pts:30, grow:.6, rage:3, need:1},  // shed by the giant planet
  shard:  {r:24,v:170,dv:6, vm:340,pts:50, grow:.5, rage:3, need:1},  // a third of a shield
  comet:  {r:16,v:460,dv:10,vm:720,pts:60, grow:.8, rage:4, need:1},    // very fast; extends the combo clock
  split:  {r:46,v:120,dv:6, vm:240,pts:0,  grow:0,  rage:0, need:99},   // never swallowed whole: touching it splits it in two
  plasma: {r:15,v:150,dv:0, vm:300,pts:30, grow:.6, rage:3, need:1},  // glowing matter shed by the red giant / supernova
  prey:   {r:15,v:200,dv:0, vm:420,pts:1500,grow:1.2,rage:15,need:0},  // the hunt target: always edible, runs away
  half:   {r:33,v:120,dv:0, vm:420,pts:80, grow:1.4,rage:4, need:1.15}, // one half of a split planet: half the mass
  anti:   {r:18,v:230,dv:8, vm:460,pts:0,  grow:0,  rage:0, need:1},    // antimatter: swallowing it shrinks you
  magnet: {r:22,v:170,dv:6, vm:340,pts:50, grow:.5, rage:3, need:1},
  pulsar: {r:18,v:170,dv:6, vm:340,pts:150,grow:1,  rage:6, need:1},    // only swallowable while it shines
  mpair:  {r:30,v:150,dv:6, vm:300,pts:100,grow:1.5,rage:4, need:1.15}, // planet with a moon
  sat:    {r:12,v:150,dv:0, vm:300,pts:100,grow:.5, rage:3, need:1},    // the moon, once its planet is gone
  dark:   {r:26,v:140,dv:6, vm:280,pts:120,grow:1.2,rage:5, need:1}};   // dark matter: seen only by how it bends light
// screen layout pass (play-tested): big things shrink to half, small ones less so they stay readable; everything a little slower
const SZ2={prey:.8,ast:.7,crystal:.7,energy:.7,time:.9,frag:.7,plasma:.75,half:.55,meteor:.7,comet:.7,anti:.7,pulsar:.7,sat:.7,moon:.6,bomb:.6,mini:.6,gold:.6,shard:.6,magnet:.8,mpair:.6,dark:.6,planet:.55,split:.55};
for(const k in OBJ2){const o=OBJ2[k];o.r*=SZ2[k]||.6;o.v*=.9;o.dv*=.9;o.vm*=.9;}
Object.assign(V2K,{prey:{wear:2.6,tired:2.6},boss:{spotCD:2.2,orbit:.45,early:.3,radFirst:4.5,radEvery:{planet:9,red:8,nova:7}},r0:V2K.r0*.6,rMax:72,rRage:90,gMax:V2K.gMax*.6,gMaxOver:V2K.gMaxOver*.6,
  decay:{wait:3,k:.2,min:1.2},shield:{dur:10,cost:30},nova:{cost:20,max:2,imm:3},goal:{a:1200,b:900,p:1.12,mid:800,late:300,storm:1.8,intro:.75},cont:{...V2K.cont,dia:25}});
Object.assign(V2K.mini,{rMin:10,rMax:36,gMax:90});
{const big=Math.max(...Object.values(OBJ2).map(o=>o.r));V2K.rMax=big*2.2;V2K.rRage=V2K.rMax*1.2;} // largest hole: 2.2× the largest ordinary bodyObject.assign(V2K.dodge,{lo:7,hi:24});
const SMALL2=new Set(['ast','moon','crystal','energy','frag','plasma']);
const GL2=new Set(['moon','planet','gold','split','half','mpair','sat']);
const MULT2=c=>c>=20?5:c>=10?4:c>=5?3:c>=3?2:1;
// what each level brings in (level-start banner, level-complete teaser, map)
const NEW2={2:['☄️','METEOR','Meteorlardan kaç: çarparsa can gider. Kıl payı geçersen PERFECT DODGE.'],
  3:['🔷','CRYSTAL','Çok değerli ama genelde bir meteorun yanında. Risk alacak mısın?'],
  4:['⏱','TIME BALL','Yut: her şey 6 saniye yavaşlar, sen hızlı kalırsın.'],
  5:['💣','BOMB PLANET','Çekim alanında 3 saniye tut: ekrandaki her şey sana gelir.'],
  6:['⚡','SPEED + OVERLOAD','Cisimler hızlanıyor. Sınıra kadar büyürsen 15 saniyelik OVERLOAD başlar.'],
  7:['↔️','SIDE STREAMS','Cisimler artık yanlardan da geliyor.'],
  8:['🌀','MINI BLACK HOLE','Yut: 6 saniye etrafında dönen yardımcı bir kara delik açılır.'],
  9:['🪨','ASTEROID STORM','Yoğun alan: dev combo zamanı.'],
  10:['🪐','GIANT PLANET','Boss: koptukça parçalarını topla, küçülünce bütünüyle yut.'],
  11:['🌐','360°','Cisimler her yönden geliyor.'],
  12:['☄️','COMET','Çok hızlı geçer. Yakalarsan combo süren uzar.'],
  13:['🌋','SPLIT PLANET','Yutulmaz; çarpınca ikiye bölünür, yarım kütleli iki parça hızla uzaklaşır: yakala.'],
  14:['⚛️','ANTIMATTER','Yutma! Kara deliğini küçültür. Çekim alanından uzak tut.'],
  15:['🧲','MAGNET','Yut: 6 saniye yutabileceğin her şey sana çekilir.'],
  16:['💫','PULSAR','Sadece parlarken yutulur. Sönükken seker.'],
  17:['🪐','MOON PAIR','Gezegeni, sonra uydusunu yut: çift puan.'],
  18:['🌫️','DARK MATTER','Görünmez! Yıldızları bükmesinden fark edilir.'],
  19:['🌀','WORMHOLE','Turuncu kapı yakındaki cisimleri çeker, mavi kapıdan sana gönderir.']};
// Level types: most levels are "reach the score", but from level 11 every few levels one has its own rule.
const RSETS=[{ban:['ast','frag'],ic:'🪨',n:'ASTEROİT YASAK',k:.6},{ban:['moon','planet','half','split'],ic:'🌑',n:'AY VE GEZEGEN YASAK',k:.55},{ban:['crystal','energy','gold','comet'],ic:'💎',n:'PARLAK CİSİMLER YASAK',k:.4}];
function v2LevelType(l){if(l<11||l%10===0||l%10===9)return 'score';const sp=l<=20?l%4===3:l%3===2;return sp?['restrict','window','hunt'][Math.floor(l/(l<=20?4:3))%3]:'score';}
function v2RuleFor(l){const t=v2LevelType(l);
  if(t==='restrict'){const s=RSETS[Math.floor(l/7)%(l<30?2:3)];/* the hardest set (no bright bodies) only from level 30 */return {t,tip:'restrict',ban:s.ban,ic:s.ic,n:s.n,k:s.k};}
  if(t==='window'){const late=l>30;return {t,tip:'window',win:1,lo:late?1.6:1.4,hi:late?2.3:2.05,ic:'📏',n:'BOYUT PENCERESİ',k:late?.4:.5};}
  if(t==='hunt')return {t,tip:'hunt',hunt:1,need:l>40?5:4,life:l>40?14:16,ic:'🎯',n:'AV',k:0};
  return null;}
const RULE_NEW={restrict:'Yasaklı cisimler seni iter; üstlerine gidersen combo yarıya iner. Hedef puan daha düşük.',window:'Puan sadece kara delik yeşil aralıktayken gelir. Fazla büyürsen buharlaşırsın; o sırada yediğin puan getirmez.',hunt:'Altın avı çekim alanında tutarak yor; yorulunca kızarır, o an yut. Süresi dolarsa kaçar ve can götürür.'};
function new2(l){const ru=G2.mode!=='sprint'?v2RuleFor(l):null;if(ru&&!NEW2[l])return [ru.ic,ru.n,RULE_NEW[ru.t]];return NEW2[l]||(l%10===0?(v2BossType(l)==='red'?['🔴','RED GIANT','Boss: nefes alan yıldız; şişince daha çok plazma saçar. Plazmayı yut, küçülünce onu da yut.']:v2BossType(l)==='nova'?['💥','SUPERNOVA','Boss: her 7 saniyede patlar ve etrafa enkaz saçar. Enkazı yut, küçülünce onu da yut.']:NEW2[10]):null);}

const G2={on:false,mode:'level',S:1,t:0,dur:60,lv:1,L:null,objs:[],gl:[],parts:[],calls:[],minis:[],waves:[],beams:[],tip:null,tipCD:0,hold:null,hungry:0,shrinkN:0,shT:0,shTick:0,shardAt:1e9,gift:0,
  rr:34,cap:46,peak:34,R:34,G:75,vx:0,vy:0,tx:0,ty:0,lx:0,ly:0,
  combo:0,comboT:0,best:0,rage:0,rageT:0,ready:false,readyT:0,timeT:0,overT:0,overDone:false,immT:0,dodgeCD:0,
  eaten:0,perfA:0,perfD:0,dmg:0,acc:0,swarm:0,swarmT:0,script:null,si:0,st:0,touched:false,tut:1,contUsed:false,
  boss:null,ending:0,endT:0,pulse:0,uiT:0,sprLv:6,sprBlock:-1,hud:{}};
const v2Ach={rage:0,mega:0}; // for achievements
const DRAG={id:null,x:0,y:0,sx:0,sy:0,t0:0,moved:false,held:false};

function v2Resize(){G2.S=Math.min(W,H*.5625)/486;}
const sp2=v=>v*G2.S;
function v2Lv(){return gameMode==='survival'?Math.min(40,effLevel()):gameMode==='sprint'?G2.sprLv:level;}
// level rules: counts, spawn odds, directions (spec §26, §36–39)
// score needed to finish level l (boss levels end with the boss instead)
function v2Goal(l){if(l%10===0)return 0;const g=V2K.goal;let x=g.a+g.b*Math.pow(Math.min(l-1,19),g.p)+g.mid*clamp(l-20,0,15)+g.late*clamp(l-35,0,25); // flat from level 60 on: any level number stays playable // steep while you learn, gentler once speeds top out
  if(l%10===9)x*=g.storm;else if(l>=12&&l<=18)x*=g.intro; // storm levels are dense and fast; 12–18 each bring a new body to learn
  return Math.round(x/100)*100;}
function v2Rules(l){
  const tb=(arr,d)=>arr[l]!==undefined?arr[l]:d;
  const crystal=l===1?0:tb([0,5,7,10,10,12,12,14,15,15,18],Math.min(20,18+(l-10)*.2));
  const meteor=tb([0,0,8,10,12,14,16,18,20,22,25],Math.min(30,25+(l-10)*.3));
  const gold=l<=3?0:l<=5?2:l<=7?3:l<=9?4:5;
  const w={crystal,meteor:l%10===9?meteor*.5:meteor,gold,moon:l===1?18:15,planet:l>=2?Math.min(10,5+l*.5):0,energy:l>=2?4:0,time:l>=4?3:0,bomb:l>=5?3:0,mini:l>=8?1.5:0,
    comet:l>=12?4:0,split:l>=13?3:0,anti:l>=14?Math.min(6,3+(l-14)*.2):0,magnet:l>=15?1.5:0,pulsar:l>=16?3:0,mpair:l>=17?2:0,dark:l>=18?3:0};
  let rest=100;for(const k in w)rest-=w[k];w.ast=Math.max(20,rest);
  return {w,cap:l===1?8:l===2?10:12,capMul:Math.min(V2K.rMax/V2K.r0,1.2+.15*l),comboT:tb(V2K.comboT,2),
    speedK:l>=6?1.15:1,dirs:l>=11?4:l>=7?2:1,iv:Math.max(.5,1.05-.025*(l-1))*(l%10===9?.6:1),dense:l%10===9,boss:l%10===0,
    dur:tb(V2K.dur,90),overload:l>=6};
}

// ── start / reset ─────────────────────────────────────
function v2Start(mode){
  v2Resize();G2.on=true;G2.mode=mode;document.body.classList.add('v2');v2Hud();if(mode==='level'||mode==='surv')SND.music('game'); // zone track, or the boss theme on boss levels
  holeK=1;
  const l=v2Lv();G2.lv=l;G2.L=v2Rules(l);
  const rule=mode==='level'?v2RuleFor(l):null;if(rule&&rule.win)G2.L.overload=false;
  const goal=mode==='level'&&!(rule&&rule.hunt)?Math.round(v2Goal(l)*(rule?rule.k:1)*(SHOP.easyLv===l&&!REPLAY?EASE.k:1)/100)*100:0; // the ease offer takes 20% off; rule levels ask less
  Object.assign(G2,{goal,rule,hunt:rule&&rule.hunt?{n:0,need:rule.need,next:2.5,prey:null}:null,lastHit:null,t:0,dur:mode==='surv'||goal||(rule&&rule.hunt)?1e9:mode==='sprint'?SPR_RUN.dur:G2.L.dur,objs:[],gl:[],calls:[],minis:[],waves:[],beams:[],tip:null,tipCD:0,hold:null,hungry:0,shrinkN:0,shT:0,shTick:0,gift:0,freeze:0,shrinkFx:0,magT:0,pairT:0,worms:[],mega:null,megaFx:[],novaN:0,novaT:0,diaCont:0,wormT:14,
    shardAt:mode==='sprint'||G2.L.boss||l<4?1e9:mode==='surv'?40:rrnd(12,Math.max(14,G2.L.dur-18)),
    rr:V2K.r0,cap:V2K.r0*G2.L.capMul,peak:V2K.r0,vx:0,vy:0,combo:0,comboT:0,best:0,rage:0,rageT:0,ready:false,readyT:0,firstRage:false,
    timeT:0,overT:0,overDone:false,immT:0,dodgeCD:0,eaten:0,perfA:0,perfD:0,dmg:0,acc:.6,swarm:0,swarmT:0,
    script:mode==='level'&&level===1&&!REPLAY?v2Script1():null,si:0,st:0,tut:mode==='level'&&level===1?1:0,touched:false,contUsed:false,failCounted:0,boss:null,ending:0,endT:0,sprBlock:-1,starCont:0,lifeGift:0,monoN:1,monoT:1});
  comboCount=0;lostThisLevel=false;lvCombo=0;
  hX=W/2;hY=H*.7;G2.tx=hX;G2.ty=hY;G2.lx=hX;G2.ly=hY;DRAG.id=null;
  if(mode==='level')lives=3; // every level starts with 3 lives; the stars count what is left
  if(G2.L.boss&&mode==='level')v2BossInit();
  else if(mode==='level'&&level%10===1&&level>1&&!REPLAY){const z=zoneOf(level),Z=ZONES[z];sigShow('🌌 '+T('YENİ BÖLGE')+' · '+T(Z.n),T(Z.d),6);}
  const nw=mode==='level'?new2(level):null;
  if(mode==='level'&&level>1)v2Call('LEVEL '+level,nw?`NEW: ${nw[0]} ${nw[1]}`:'',nw?'#ffb35c':'#e7e3da',2.2,true);
  else if(mode==='surv')v2Call('SURVIVE THE STORM','','#e7e3da',2);
  gState='playing';lastT=performance.now();v2Ui(true);
}
function v2Stop(){G2.on=false;document.body.classList.remove('v2');DRAG.id=null;curR=BASE_R;tgtR=BASE_R;}

// ── input ─────────────────────────────────────────────
function v2Pt(e){const r=$('fx').getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
const FD2=[60,90,120]; // finger → hole distance in reference px (settings: near / middle / far)
function v2Off(){return sp2(FD2[SET.fd]??90)+G2.R*.5;}
function v2Aim(x,y){G2.tx=x;G2.ty=y-v2Off();}
function v2Down(x,y,id){
  if(!G2.on||gState!=='playing'||DRAG.id!==null)return;
  DRAG.id=id;DRAG.sx=x;DRAG.sy=y;DRAG.x=x;DRAG.y=y;DRAG.t0=performance.now();DRAG.moved=false;
  if(!G2.touched){G2.touched=true;G2.tut=Math.min(G2.tut,.99);}
  if(!G2.ready)v2Aim(x,y); // with Rage ready, a tap must not yank the hole across the screen
}
function v2Move(x,y,id){
  if(id!==DRAG.id||!G2.on)return;DRAG.x=x;DRAG.y=y;
  if(!DRAG.moved&&Math.hypot(x-DRAG.sx,y-DRAG.sy)>10)DRAG.moved=true;
  if(DRAG.moved||!G2.ready)v2Aim(x,y);
}
function v2Up(id){
  if(id!==DRAG.id)return;const tap=!DRAG.moved&&performance.now()-DRAG.t0<260;DRAG.id=null;
  if(tap&&G2.on&&gState==='playing')v2Tap();
}
function v2Tap(){if(G2.ready&&G2.rageT<=0)v2RageGo();}

// ── feedback helpers ──────────────────────────────────
const SFX2={};let sfx2n=[];
function v2Sfx(n,o){const now=performance.now();if(now-(SFX2[n]||0)<45)return;sfx2n=sfx2n.filter(t=>now-t<220);if(sfx2n.length>=8)return;SFX2[n]=now;sfx2n.push(now);sfx(n,o);}
function v2Burst(x,y,n,col,s0,s1,life=.5,sz=1.8){
  const P=G2.parts;for(let i=0;i<n;i++){if(P.length>=150)P.shift();const a=rnd(0,TAU),s=rnd(s0,s1);P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,c:col,sz});}
}
function v2Pop(txt,col,sz=18){ftexts.push(new FText(txt,hX+rnd(-8,8),hY-G2.R-sp2(26)-rnd(0,14),col,sz));if(ftexts.length>14)ftexts.shift();}
// big centred callout (arcade terms stay English in every language)
function v2Call(txt,sub='',col='#fff',life=1.1,top=false){G2.calls=G2.calls.filter(c=>c.top!==top);G2.calls.push({txt,sub,col,life,max:life,top});}

// ── spawning ──────────────────────────────────────────
function v2Big(){return clamp((G2.rr/V2K.r0-1.3)/(V2K.rMax/V2K.r0-1.3),0,1);} // 0 small … 1 largest
function v2Speed(k){const K=OBJ2[k],l=G2.lv;return Math.min(K.vm,K.v+K.dv*(l-1))*(G2.L.speedK)*G2.S*(k==='meteor'?1-.25*v2Big():1);}
function v2Obj(k,x,y,vx,vy,opt={}){
  const K=OBJ2[k];const o={k,x,y,vx,vy,rr:K.r*(opt.scale||1),r:0,st:'in',t:0,inG:false,b:1e9,seen:false,rot:rnd(0,TAU),vr:rnd(-1.2,1.2),
    si:Math.floor(rnd(0,6)),wait:k==='meteor'?(opt.wait??.75):0,minGap:1e9,dodged:false,prevD:1e9,boss:!!opt.boss,noScore:false,age:0};
  o.r=o.rr*G2.S;
  if(k==='meteor'){o.fvx=vx;o.fvy=vy;o.slow=clamp(1.25-.03*(G2.lv-2),.7,1.25)+.4*v2Big();o.ramp=0;} // enters slowly (longer when the hole is big), then speeds up
  if(k==='pulsar')o.ph=rng()*1.6;if(k==='mpair')o.sa=rng()*TAU;
  if(GL2.has(k)){o.cell=k==='moon'?8:k==='gold'?6:k==='split'||k==='half'?14:k==='mpair'?5:k==='sat'?10:opt.cell??zonePlanetCell();o.sX=1;o.sY=1;o.gs=1;o.suck=null;o.heat=0;giveSpin(o);}
  G2.objs.push(o);return o;
}
function v2Edge(k,side,x0){
  const s=v2Speed(k),r=OBJ2[k].r*G2.S;let x,y,a;
  if(side==null){const d=G2.L.dirs;const q=rng();side=d>=4?(q<.45?0:q<.64?1:q<.83?2:3):d>=2?(q<.7?0:q<.85?1:2):0;}
  if(k==='meteor'&&side===3)side=0; // no meteors from below
  if(k==='meteor'&&side&&G2.objs.some(m=>m.k==='meteor'&&m.side&&m.st==='in'))side=0; // one side meteor at a time
  for(let tries=0;tries<5;tries++){
    if(side===0){x=x0??rrnd(W*.08,W*.92);y=-r-4;a=Math.PI/2+rrnd(-.26,.26);}
    else if(side===1){x=-r-4;y=k==='meteor'?rrnd(H*.1,H*.45):rrnd(H*.08,H*.55);a=rrnd(-.15,.5);} // side meteors: top half only
    else if(side===2){x=W+r+4;y=k==='meteor'?rrnd(H*.1,H*.45):rrnd(H*.08,H*.55);a=Math.PI-rrnd(-.15,.5);}
    else {x=x0??rrnd(W*.12,W*.88);y=H+r+4;a=-Math.PI/2+rrnd(-.22,.22);}
    if(Math.hypot(x-hX,y-hY)>sp2(250))break;x0=null;
  }
  // aim sideways/bottom entries toward the play area so they cross the screen
  const o=v2Obj(k,x,y,Math.cos(a)*s,Math.sin(a)*s);o.side=side;return o;
}
function v2Pick(){const w=G2.L.w;let tot=0;for(const k in w)tot+=w[k];let r=rng()*tot;for(const k in w){r-=w[k];if(r<=0)return k;}return 'ast';}
function v2Active(){let n=0;for(const o of G2.objs)if(o.st==='in'&&!o.boss)n++;return n;}
function v2Spawn(){
  let k=v2Pick();const l=G2.lv;
  if(k==='meteor'&&G2.objs.filter(o=>o.k==='meteor'&&o.wait>0).length>=3)k='ast'; // never more than 3 meteors released together
  if(k==='meteor'){const big=v2Big();if(rng()<big*.35||G2.objs.filter(o=>o.k==='meteor'&&o.st==='in').length>=(big>.6?2:3))k='ast';} // a big hole meets fewer meteors
  if(k==='bomb'&&G2.objs.some(o=>o.k==='bomb'))k='ast';
  if(k==='mini'&&(G2.minis.length||G2.objs.some(o=>o.k==='mini')))k='ast';
  if(k==='magnet'&&(G2.magT>0||G2.objs.some(o=>o.k==='magnet')))k='ast';if(k==='dark'&&G2.objs.filter(o=>o.k==='dark').length>=3)k='ast';
  if(k==='time'&&(G2.timeT>0||G2.objs.some(o=>o.k==='time')))k='ast';
  if(k==='ast'&&rng()<(G2.L.dense?.55:.3)){ // a line of small rocks: combo fodder
    const n=G2.L.dense?rpick([3,4,5]):3,x=rrnd(W*.2,W*.8),gap=sp2(32);for(let i=0;i<n;i++){const o=v2Edge('ast',0,clamp(x+(i-(n-1)/2)*gap,sp2(20),W-sp2(20)));o.y-=Math.abs(i-(n-1)/2)*sp2(21);}return;}
  const o=v2Edge(k);
  if(k==='crystal'&&l>=3&&rng()<.45){ // risk/reward: the crystal rides next to a meteor
    const side=o.x<W/2?1:-1,m=v2Obj('meteor',o.x+side*sp2(45),o.y-sp2(14),o.vx*.9,Math.max(o.vy,v2Speed('meteor')*.7),{wait:.9});}
  if(k==='gold'&&l>=4&&rng()<.5){const m=v2Obj('meteor',clamp(o.x+rrnd(-90,90)*G2.S,20,W-20),o.y-sp2(70),o.vx,v2Speed('meteor'),{wait:.9});}
}
// Level 1 — the 60 second tutorial timeline (spec §27–28): [script time, kind, x (fraction of width or 'hole'), extra]
function v2Script1(){const E=[];
  E.push([3.2,'ast','hole']);
  [8.5,10.6,12.7].forEach((t,i)=>E.push([t,'ast',[.3,.7,.45][i]]));
  [15.2,16.4,17.6,18.8,20].forEach((t,i)=>E.push([t,'ast',[.22,.36,.5,.64,.78][i]]));
  E.push([22.5,'ast',.35],[23.5,'ast',.65],[24.2,'meteor','near'],[27.4,'ast',.5]);
  E.push([30.5,'ast',.25],[32,'crystal','hole'],[34,'ast',.75]);
  E.push([38.5,'ast',.3],[39.5,'ast',.7],[40.5,'energy','hole'],[42,'ast',.5]);
  [45,45.8,46.6,47.4,48.2].forEach((t,i)=>E.push([t,'ast',[.2,.4,.6,.8,.5][i]]));E.push([46.2,'moon',.35],[47.8,'moon',.65]);
  return E;}
function v2RunScript(dt){
  if(!G2.touched)return; // the tutorial waits for the first touch
  if(!(G2.ready&&G2.rageT<=0&&G2.st>=44.5))G2.st+=dt; // hold the clock while Rage waits for its tap
  const E=G2.script;
  while(G2.si<E.length&&E[G2.si][0]<=G2.st){const [t,k,x]=E[G2.si++];
    if(k==='meteor'){const side=hX<W/2?1:-1,mx=clamp(hX+side*(G2.R+sp2(60)),sp2(24),W-sp2(24));v2Obj('meteor',mx,-sp2(30),0,v2Speed('meteor')*.8,{wait:1});v2Call('☄️ METEOR!','DODGE IT','#ff7a5c',1.2,true);continue;}
    const xx=x==='hole'?clamp(hX+rnd(-10,10),sp2(30),W-sp2(30)):W*x;const o=v2Edge(k,0,xx);o.vx=0;if(k==='ast'&&G2.si<=1)o.vy*=.75;}
  if(G2.st>=42&&!G2.firstRage&&G2.rage<100&&G2.rageT<=0&&!G2.ready)G2.rage=Math.min(100,G2.rage+dt*40); // the first Rage always arrives, once
  if(G2.ready&&G2.readyT>5)v2RageGo(); // tutorial only: nobody leaves level 1 without seeing Rage
  if(G2.si>=E.length&&G2.st>=(E.length?E[E.length-1][0]:0)+2)G2.script=null; // the tutorial script is over: normal spawning takes it from here
}

// ── giant planet boss (every 10th level) ─────────────
const BOSS2={planet:{n:'GIANT PLANET',sub:'EAT ITS FRAGMENTS',col:'#ffb35c'},red:{n:'RED GIANT',sub:'EAT ITS PLASMA',col:'#ff7a3c',pc:[255,120,40]},nova:{n:'SUPERNOVA',sub:'EAT THE BLAST DEBRIS',col:'#9fe8ff',pc:[150,235,255]}};
function v2BossType(l){return ['planet','red','nova'][(Math.max(1,Math.floor(l/10))-1)%3];}
const BOSSIMG={};function v2BossImg(k){if(!BOSSIMG[k]){const src=(window.ASSETS||{})[k];if(!src)return null;const im=new Image();im.src=src;BOSSIMG[k]=im;}const im=BOSSIMG[k];return im.complete&&im.naturalWidth?im:null;}
const SIG_BOSS={planet:['Radyo teleskoplar dev bir gezegenin yörüngesinden koptuğunu doğruladı. Kütlesi hızla bu bölgeye yaklaşıyor.','Uyarı: yerel kütleçekim iki katına çıktı. Kaynak, başıboş dev bir gezegen.','Son veri: gezegenin kabuğunda çatlaklar var. Çatlaklar parlıyor.'],
  red:['Yaşlı bir yıldız şişiyor. Yüzey sıcaklığı düşüyor, boyutu büyüyor.','Kırmızı devin plazma rüzgârı istasyonun kalkanlarını aşındırıyor. Dikkat: radyasyon dalgaları.','Son ölçüm: yıldız nefes alır gibi genişleyip daralıyor.'],
  nova:['Çekirdek çöküşü başladı. Patlama an meselesi.','Nötrino fırtınası algılandı: bir yıldız ölüyor. Radyasyon seviyesi kritik.','Tüm kanallara: süpernova uyarısı. Dalgaların arasındaki boşlukları kullan.']};
function v2BossInit(){
  let hp=Math.min(46,22+Math.floor(level/10)*4); // tops out at level 60 so any boss stays beatable
  if(SHOP.easyLv===level)hp=Math.round(hp*.8);const bt=v2BossType(level),B=BOSS2[bt];
  const b={k:'boss',x:W/2,y:H*.24,rr:57,r:57*G2.S,hp,max:hp,cell:[2,5,15,13][(Math.floor(level/10)+3)%4],vx:sp2(28),shed:1.4,edible:false,sw:0,
    sX:1,sY:1,gs:1,suck:null,heat:0,isBoss:false,age:0,bt,burst:4,fade:1,spots:[],spotCD:1.2,chips:[],hitFx:0,rad:{ph:'idle',t:0,cd:V2K.boss.radFirst}};if(bt==='nova')b.burst=1e9;/* the supernova's debris ring now goes off with its radiation burst */giveSpin(b);b.spinV*=.25;if(bt!=='planet'){delete b.cell;v2BossImg(bt==='red'?'bossRG':'bossSN');v2BossImg('bossRays');}G2.boss=b;
  v2Call(B.n,B.sub,B.col,2.4,true);sfx('bossIntro',{vol:.7,rev:.4});if(!REPLAY){const L=SIG_BOSS[bt];sigShow('📡 '+T('SİNYAL · GÖZLEM İSTASYONU-7'),T(L[Math.floor(level/30)%L.length]),6);}
}
function v2BossStep(dt,tk){
  const b=G2.boss;if(!b)return;b.age+=dt;b.spinA+=b.spinV*dt;
  if(b.sw>0){ // being swallowed
    b.sw+=dt;const p=Math.min(1,b.sw/1.2);b.fade=1-p;b.x+=(hX-b.x)*Math.min(1,dt*4);b.y+=(hY-b.y)*Math.min(1,dt*4);b.gs=1-.9*p;
    b.suck={ph:'fall'};b.radAng=Math.atan2(hY-b.y,hX-b.x);b.stretch=1+p;b.squeeze=1-.5*p;b.fade=1-p;b.sp=p;
    if(p>=1){G2.boss=null;G2.ending=1;G2.endT=1.4;}return;}
  b.rr=(40+55*b.hp/b.max)*.6;if(b.bt==='red'){b.br=1+.12*Math.sin(b.age*TAU/5);b.rr*=b.br;}b.r=b.rr*G2.S; // the red giant breathes
  if(b.bt==='nova'&&!b.edible){b.burst-=dt*tk;if(b.burst<=0){b.burst=7;b.flash=1;flash=Math.max(flash,.35);shock=Math.max(shock,.45);v2Sfx('boom',{vol:.5,rate:.8}); // the supernova blasts out a ring of debris
    for(let i=0;i<8;i++){const a=i/8*TAU+rrnd(-.2,.2),s=v2Speed('frag')*rrnd(.9,1.3)/G2.L.speedK,o=v2Obj('plasma',b.x+Math.cos(a)*b.r,b.y+Math.sin(a)*b.r,Math.cos(a)*s,Math.sin(a)*s);o.fromBoss=true;o.pc=BOSS2.nova.pc;}}}
  if(b.flash>0)b.flash=Math.max(0,b.flash-dt*1.5);
  if(!b.edible){b.x+=b.vx*dt*tk;if(b.x<b.r+10||b.x>W-b.r-10)b.vx*=-1;
    b.shed-=dt*tk*(b.bt==='red'&&b.br>1.06?1.7:1);if(b.shed<=0){b.shed=Math.max(.75,1.5*b.hp/b.max+.35);const a=rrnd(.3,Math.PI-.3),s=rrnd(.6,1.1)*v2Speed('frag')/G2.L.speedK;
      const k=rng()<.14?'crystal':rng()<.1?'energy':b.bt==='planet'?'frag':'plasma';const o=v2Obj(k,b.x+Math.cos(a)*b.r,b.y+Math.sin(a)*b.r,Math.cos(a)*s,Math.sin(a)*s);o.fromBoss=true;if(k==='plasma')o.pc=BOSS2[b.bt].pc;}
}
  if(!b.edible){v2BossSpots(b,dt,tk);v2BossRad(b,dt,tk);}
  if(!b.edible&&b.hp<=b.max*V2K.boss.early&&G2.R>=b.r){b.edible=true;v2Call('SWALLOW IT!','BIG ENOUGH','#8dffcb',1.6,true);sfx('bell',{vol:.8});} // grown past it after breaking half of it: swallow early
  if(b.hitFx>0)b.hitFx=Math.max(0,b.hitFx-dt*3);for(let i=b.chips.length-1;i>=0;i--){const c=b.chips[i];c.t+=dt;if(c.t>.7)b.chips.splice(i,1);}
  // solid until it is small enough: the hole is pushed out instead of passing through
  const dx=hX-b.x,dy=hY-b.y,d=Math.hypot(dx,dy)||1,min=b.r+G2.R*.7;
  if(b.edible&&d<G2.R+b.r*.45&&G2.R/(V2K.r0*G2.S)>=1.25){b.sw=.001;v2BossEaten();}
  else if(d<min){hX=b.x+dx/d*min;hY=b.y+dy/d*min;if(b.edible&&b.warnT===undefined){b.warnT=1;v2Call('GROW BIGGER','','#ffb35c',1);}}
}
// Weak spots: glowing cracks on the rim that turn with the boss. Touch one with the hole to break off a chunk (2 hits: the crack, then the chunk you swallow).
function v2BossSpots(b,dt,tk){const K=V2K.boss,want=b.hp<=b.max*.5?2:1;b.spotCD-=dt*tk;
  if(b.spots.length<want&&b.spotCD<=0){b.spots.push({a:rrnd(0,TAU),t:0});b.spotCD=K.spotCD;}
  for(let i=b.spots.length-1;i>=0;i--){const s=b.spots[i];s.t+=dt;const P=v2SpotPos(b,s),sr=v2SpotR(b);
    if(Math.hypot(hX-P.x,hY-P.y)<G2.R+sr*.9){b.spots.splice(i,1);b.spotCD=K.spotCD*.6;v2BossCrack(b,P);}}}
function v2SpotPos(b,s){const a=s.a+b.age*V2K.boss.orbit;return {x:b.x+Math.cos(a)*b.r*.9,y:b.y+Math.sin(a)*b.r*.9,a};}
const v2SpotR=b=>Math.max(9*G2.S,b.r*.2);
// Radiation: the boss charges (a radiation sign on it, the danger sectors shaded), then sends out waves of arcs.
// Between the arcs are gaps: sit in a gap as a wave passes. A shield or Rage protects you.
const RAD2={planet:{n:3,fill:.6,waves:2,gap:.55,shift:0,v:300,col:'190,255,90'},red:{n:2,fill:.62,waves:2,gap:.6,shift:0,v:260,col:'255,140,60'},nova:{n:4,fill:.5,waves:2,gap:1.1,shift:.5,v:320,col:'170,235,255'}};
function v2RadWarn(){return Math.max(1,1.5-.05*(Math.floor(level/10)-1));}
function v2RadArc(b,a,a0){const C=RAD2[b.bt]||RAD2.planet,seg=TAU/C.n,x=((a-a0)%seg+seg*2)%seg;return x<seg*C.fill;} // is angle a inside an arc of the pattern starting at a0?
function v2RadIn(b,x,y){const r=b.rad;if(!r||r.ph==='idle')return false;const C=RAD2[b.bt]||RAD2.planet,a=Math.atan2(y-b.y,x-b.x),d=Math.max(1,Math.hypot(x-b.x,y-b.y)),m=Math.atan2(G2.R*.55,d);
  const k=r.ph==='fire'?Math.min(C.waves-1,r.next):0,a0=r.a0+k*C.shift*TAU/C.n;return v2RadArc(b,a-m,a0)||v2RadArc(b,a+m,a0)||v2RadArc(b,a,a0);}
function v2BossRad(b,dt,tk){const r=b.rad,K=V2K.boss,C=RAD2[b.bt]||RAD2.planet;
  if(r.ph==='idle'){r.cd-=dt*tk;if(r.cd<=0){r.ph='warn';r.t=0;const seg=TAU/C.n;r.a0=Math.atan2(hY-b.y,hX-b.x)-seg*C.fill/2;r.waves=[];r.next=0;r.hurt=false;v2Sfx('powerup',{vol:.35,rate:.55}); // an arc is aimed straight at you: move into a gap
      if(!TIPS.rad)v2Tip('rad',b);else if(!G2.radSeen){G2.radSeen=1;v2Call('RADIATION!','HIDE IN THE GAPS','#ff5a4a',1.3,true);}}}
  else if(r.ph==='warn'){r.t+=dt;if(r.t>=v2RadWarn()){r.ph='fire';r.t=0;r.next=0;r.spawnT=0;if(b.bt==='nova')b.burst=0;}}
  else{r.t+=dt;r.spawnT-=dt;
    if(r.next<C.waves&&r.spawnT<=0){r.waves.push({r:b.r,a0:r.a0+r.next*C.shift*TAU/C.n,hit:false});r.next++;r.spawnT=C.gap;shake=Math.max(shake,5);flash=Math.max(flash,.15);v2Sfx('boom',{vol:.45,rate:b.bt==='nova'?.9:1.2});}
    const far=Math.hypot(W,H),th=sp2(16);
    for(const w of r.waves){w.r+=sp2(C.v)*dt*tk;if(w.hit)continue;const d=Math.hypot(hX-b.x,hY-b.y);
      if(Math.abs(d-w.r)<th*.5+G2.R*.55){const a=Math.atan2(hY-b.y,hX-b.x),m=Math.atan2(G2.R*.45,Math.max(d,1));
        if(v2RadArc(b,a,w.a0)||v2RadArc(b,a-m,w.a0)||v2RadArc(b,a+m,w.a0)){w.hit=true;if(!r.hurt&&G2.shT<=0&&G2.rageT<=0&&G2.immT<=0){r.hurt=true;G2.hitWhy='rad';v2Hit({x:hX,y:hY});G2.hitWhy=null;}}}}
    if(r.next>=C.waves&&r.waves.every(w=>w.r>far)){r.ph='idle';r.cd=K.radEvery[b.bt]||9;r.waves=[];if(b.bt==='nova')b.burst=1e9;}}}
function v2DrawRadSign(b){const r=b.rad;if(!r||r.ph==='idle'||b.edible||b.sw)return;const C=RAD2[b.bt]||RAD2.planet,seg=TAU/C.n,rot=r.a0+seg*C.fill/2+Math.PI/2; // the radiation sign on the boss, drawn above its body
  if(r.ph==='warn'){const q=Math.min(1,r.t/v2RadWarn()),pu=.5+.5*Math.sin(clock*(9+q*16));v2DrawTrefoil(b.x,b.y,b.r*.62,rot+(1-q)*2,C.col,.55+.45*pu);}
  else v2DrawTrefoil(b.x,b.y,b.r*.62,rot,C.col,Math.max(0,.9-r.t*.8));}
function v2DrawTrefoil(x,y,R,rot,col,al){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=al;ctx.fillStyle=`rgba(${col},1)`;ctx.strokeStyle='rgba(20,10,0,.85)';ctx.lineWidth=Math.max(1.5,R*.06);
  for(let i=0;i<3;i++){const a=i*TAU/3-Math.PI/2;ctx.beginPath();ctx.arc(0,0,R*.9,a-.5,a+.5);ctx.arc(0,0,R*.28,a+.5,a-.5,true);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.beginPath();ctx.arc(0,0,R*.16,0,TAU);ctx.fill();ctx.stroke();ctx.restore();}
function v2DrawRad(b){const r=b.rad;if(!r||r.ph==='idle'||b.edible||b.sw)return;const C=RAD2[b.bt]||RAD2.planet,seg=TAU/C.n,far=Math.hypot(W,H);
  ctx.save();
  if(r.ph==='warn'){const q=Math.min(1,r.t/v2RadWarn()),pu=.5+.5*Math.sin(clock*(9+q*16));
    for(let i=0;i<C.n;i++){const a0=r.a0+i*seg,a1=a0+seg*C.fill;ctx.fillStyle=`rgba(255,60,45,${.06+.07*pu+.08*q})`;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.arc(b.x,b.y,far,a0,a1);ctx.closePath();ctx.fill(); // danger directions
      ctx.strokeStyle=`rgba(${C.col},${.35+.4*pu})`;ctx.lineWidth=3;ctx.lineCap='round';for(const k of [1.6,2.4,3.2]){const rr=b.r*k+(1-q)*20;ctx.beginPath();ctx.arc(b.x,b.y,rr,a0+.04,a1-.04);ctx.stroke();}} // the coming wave shape
    ctx.font='900 14px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.fillStyle=`rgba(255,120,100,${.7+.3*pu})`;ctx.fillText('☢ '+Math.max(0,v2RadWarn()-r.t).toFixed(1),b.x,b.y+b.r+34);
    if(v2RadIn(b,hX,hY)){ctx.strokeStyle=`rgba(255,70,55,${.5+.5*pu})`;ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(hX,hY,G2.R+10+4*pu,0,TAU);ctx.stroke();ctx.setLineDash([]); // you are in a wave's path: move
      ctx.fillStyle=`rgba(255,90,70,${.7+.3*pu})`;ctx.font='900 16px "IBM Plex Sans Condensed",sans-serif';ctx.fillText('⚠',hX,hY-G2.R-16);}}
  else{ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(const w of r.waves){if(w.r>far)continue;const al=Math.max(.25,1-w.r/far);
      for(let i=0;i<C.n;i++){const a0=w.a0+i*seg,a1=a0+seg*C.fill;
        ctx.strokeStyle=`rgba(${C.col},${.35*al})`;ctx.lineWidth=sp2(30);ctx.beginPath();ctx.arc(b.x,b.y,w.r,a0,a1);ctx.stroke(); // glow
        ctx.strokeStyle=`rgba(255,255,235,${.95*al})`;ctx.lineWidth=sp2(7);ctx.beginPath();ctx.arc(b.x,b.y,w.r,a0,a1);ctx.stroke(); // hot core
        ctx.strokeStyle=`rgba(${C.col},${.3*al})`;ctx.lineWidth=sp2(3);ctx.beginPath();ctx.arc(b.x,b.y,w.r-sp2(22),a0+.05,a1-.05);ctx.stroke();}}} // trailing ripple
  ctx.restore();}
function v2BossCrack(b,P){const n=Math.max(1,Math.round(b.max/24)); // ring segments that break off with this hit
  for(let i=0;i<n*2;i++){const a=P.a+rrnd(-.25,.25);b.chips.push({a,t:0,v:rrnd(.8,1.3)});}
  v2BossHit();dmEvent('crack',1);b.hitFx=1;shake=Math.max(shake,9);flash=Math.max(flash,.25);vib(25);v2Sfx('boom',{vol:.5,rate:1.35});
  const col=b.bt==='red'?'#ffd28a':b.bt==='nova'?'#bff6ff':'#ffb35c';v2Burst(P.x,P.y,22,col,2,7,.6,2.2);v2Pop('CRACK!',col,18);
  const k=b.bt==='planet'?'frag':'plasma',o=v2Obj(k,P.x,P.y,0,0);o.fromBoss=true;o.seen=true;if(k==='plasma')o.pc=BOSS2[b.bt].pc;v2Swallow(o,null);}
function v2BossHit(){const b=G2.boss;if(!b||b.edible)return;b.hp=Math.max(0,b.hp-1);shock=Math.max(shock,.3);
  if(b.hp===0){b.edible=true;v2Call('SWALLOW IT!','','#8dffcb',1.6,true);sfx('bell',{vol:.8});}}
function v2BossEaten(){
  const pts=Math.round(1000*MULT2(G2.combo+1)*(G2.rageT>0?2:1));totalScore+=pts;levelScore+=pts;G2.combo++;G2.comboT=G2.L.comboT;
  G2.rr=Math.min(V2K.rMax,G2.rr+10);G2.cap=Math.max(G2.cap,G2.rr);v2AddRage(25);G2.eaten++;bossSlain=true;atlasAdd('b_'+(G2.boss?G2.boss.bt:'planet'));dmEvent('boss',1);
  shake=Math.max(shake,14);flash=1;shock=1;sfx('bossDie',{vol:.9,rev:.5});sfx('swallowBig',{vol:.9,rate:.8,rev:.4});vib([60,40,120]);
  v2Call(BOSS2[G2.boss?G2.boss.bt:'planet'].n+' SWALLOWED','SIZE UP','#ffd76a',2.4,true);v2Pop('+'+pts.toLocaleString(LOC),'#ffd76a',26);
  v2Burst(hX,hY,60,'#ffcf8a',2,9,1.1,2.4);addMass(5);updateUI();
}

// ── core update ───────────────────────────────────────
function v2Dims(){
  const S=G2.S;let rr=G2.rr;if(G2.overT>0)rr*=V2K.over.r;if(G2.rageT>0)rr=Math.min(rr*V2K.rage.r,V2K.rRage);
  G2.R=rr*S;
  let g=G2.rr*(G2.overT>0?V2K.over.r:1)*V2K.gK;if(G2.rageT>0)g*=V2K.rage.g;
  G2.G=Math.min(g,G2.overT>0?V2K.gMaxOver:V2K.gMax)*S;G2.peak=Math.max(G2.peak,rr);
}
function v2Size(){return G2.R/(V2K.r0*G2.S);}
function v2Banned(o){return !!(G2.rule&&G2.rule.ban&&G2.rule.ban.includes(o.k));}
function v2Edible(o){if(o.k==='meteor'||o.boss||(o.k==='pulsar'&&!o.lit)||v2Banned(o)||(o.k==='prey'&&!(o.tiredT>0)))return false;let need=OBJ2[o.k].need;if(level===1&&G2.mode==='level')need=1;return v2Size()>=need-1e-6;}
function v2AddRage(n){if(G2.rageT>0||G2.ready)return;G2.rage=Math.min(G2.script&&G2.st<42?90:100,G2.rage+n);} // level 1: the first Rage is saved for its moment (~42 s)
function v2ComboLost(){if(G2.combo>=5)v2Pop('COMBO LOST','#9aa3b2',13);G2.combo=0;comboCount=0;}

function v2Update(dt){
  const S=G2.S,tk=G2.timeT>0?V2K.time.k:1,lv=G2.lv;
  // timers
  G2.t+=dt;if(G2.immT>0)G2.immT-=dt;if(G2.dodgeCD>0)G2.dodgeCD-=dt;if(G2.pulse>0)G2.pulse=Math.max(0,G2.pulse-dt*4);
  if(G2.timeT>0){G2.timeT-=dt;if(G2.timeT<=0)v2Call('TIME NORMAL','','#8fd0ff',.8);}
  if(G2.novaT>0){G2.novaT-=dt;if(G2.novaT<=0){G2.novaT=0;v2Call('NOVA OFF','','#8fe9ff',.7);}}
  if(!TIPS.nova&&G2.mode==='level'&&level>=3&&G2.t>4&&diamonds>=V2K.nova.cost&&!G2.boss)v2Tip('nova',null);
  if(G2.overT>0){G2.overT-=dt;if(G2.overT<=0){G2.rr=V2K.r0+(G2.cap-V2K.r0)*.6;v2Call('COLLAPSE','THE HOLE SHRINKS','#b9a8ff',1.3);sfx('slow',{vol:.6,rate:.6});v2Burst(hX,hY,26,'#b9a8ff',2,6,.7);}}
  if(G2.rageT>0){const was=G2.rageT;G2.rageT-=dt;if(G2.rageT>0&&Math.ceil(was)!==Math.ceil(G2.rageT)&&G2.rageT<3){v2Call(String(Math.ceil(G2.rageT)),'RAGE','#ff8a4c',.5);sfx('tickHi',{vol:.5,rate:.9});}if(G2.rageT<=0){v2Call('RAGE OVER','','#ffb35c',1);sfx('slow',{vol:.5,rate:.7});v2Burst(hX,hY,26,'#ff8a4c',1.5,5,.6);}G2.rage=Math.max(0,G2.rageT/V2K.rage.dur*100);heat=Math.max(heat,.55);if(G2.rageT<=0){G2.rage=0;G2.rageT=0;SND.setDrone(.14,650);}}
  if(G2.ready)G2.readyT+=dt;if(G2.tipCD>0)G2.tipCD-=dt;if(G2.magT>0)G2.magT-=dt;if(G2.pairT>0)G2.pairT-=dt;
  v2Worms(dt);
  if(G2.shT>0){G2.shT-=dt;if(G2.shT<1.5&&G2.shT>0){const k=Math.ceil(G2.shT*2);if(k!==G2.shTick){G2.shTick=k;v2Sfx('tickHi',{vol:.5,rate:1.3});vib(8);}}
    if(G2.shT<=0){G2.shT=0;v2Call('SHIELD OFF','','#ffb35c',.8);v2Sfx('armor',{vol:.35,rate:.6});}}
  // a hole that stops eating slowly evaporates back toward its starting size
  if(v2WinOut()>0&&G2.rageT<=0&&!G2.ending){const hi=G2.rule.hi*V2K.r0;G2.rr=Math.max(hi-.5,G2.rr-((G2.rr-hi)*.9+1.4)*dt);if(rng()<dt*40&&G2.parts.length<150){const a=rng()*TAU;G2.parts.push({x:hX+Math.cos(a)*G2.R,y:hY+Math.sin(a)*G2.R,vx:Math.cos(a)*1.4,vy:Math.sin(a)*1.4,life:.6,max:.6,c:'#ff9a8a',sz:1.5});}} // too big for the window: it evaporates, even while eating
  if(G2.script||G2.rageT>0||G2.hold||G2.boss||G2.overT>0||G2.ending){G2.hungry=0;G2.shrink=false;}
  else{G2.hungry+=dt;G2.shrink=G2.hungry>V2K.decay.wait&&G2.rr>V2K.r0+.05;
    if(G2.shrink){G2.rr=Math.max(V2K.r0,G2.rr-Math.max(V2K.decay.min,(G2.rr-V2K.r0)*V2K.decay.k)*dt);
      G2.shrinkFx+=dt;if(!G2.shrinkOn){G2.shrinkOn=true;G2.shrinkFx=0;v2Sfx('slow',{vol:.45,rate:.55});if(G2.shrinkN++<3)v2Call('SHRINKING','EAT TO GROW','#b9a8ff',1);if(!TIPS.shrink)v2Tip('shrink',null);}
      if(rng()<dt*30&&G2.parts.length<150){const a=rng()*TAU,v=rrnd(.5,1.2);G2.parts.push({x:hX+Math.cos(a)*G2.R,y:hY+Math.sin(a)*G2.R,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.7,max:.7,c:'#b9a8ff',sz:1.4});}}
    else G2.shrinkOn=false;}
  if(SHOP.shield>0&&!TIPS.shield&&G2.t>1.5&&gameMode!=='sprint')v2Tip('shield',null);
  if(G2.combo>0&&!G2.hold){G2.comboT-=dt;if(G2.comboT<=0)v2ComboLost();}
  if(gameMode==='survival'){survTime+=dt;const sc=Math.floor(survTime);if(sc!==lastSurvSec){lastSurvSec=sc;dmEvent('surv',sc,true);}
    const nl=Math.min(40,effLevel());if(nl!==G2.lv){G2.lv=nl;const cap=G2.cap;G2.L=v2Rules(nl);G2.cap=Math.max(cap,V2K.r0*G2.L.capMul);v2Call('LEVEL UP','SPEED '+nl,'#ffb35c',1.2,true);const z=zoneOf(nl);if(z!==curZone)setZone(z);}}
  if(gameMode==='sprint'){const sec=Math.ceil(SPR_RUN.dur-SPR_RUN.t);SPR_RUN.t+=dt;const s2=Math.ceil(SPR_RUN.dur-SPR_RUN.t);
    if(s2!==sec&&s2<=5&&s2>0)sfx('tickHi',{vol:.6,rev:0});if(SPR_RUN.t>=SPR_RUN.dur){sprintEnd();return;}}

  // hole: follows the finger closely; overload overshoots a little (harder to steer)
  if(G2.tut>=1&&!G2.touched){const ph=G2.t*1.6;G2.tx=W/2+Math.sin(ph)*W*.22;G2.ty=H*.68;}
  const k=1-Math.pow(1-V2K.follow,dt*60),kk=G2.overT>0?Math.min(1.3,k*V2K.over.ctl+.05):k;
  const ox=hX,oy=hY;hX+=(G2.tx-hX)*kk;hY+=(G2.ty-hY)*kk;
  if(G2.overT>0){hX+=Math.sin(G2.t*7.3)*sp2(1.2);hY+=Math.cos(G2.t*6.1)*sp2(1.2);}
  v2Dims();const R=G2.R,m=R+4;hX=clamp(hX,m,W-m);hY=clamp(hY,m+2,H-m-50);
  const ivx=(hX-ox)/Math.max(dt,1e-3),ivy=(hY-oy)/Math.max(dt,1e-3);G2.vx+=(ivx-G2.vx)*.35;G2.vy+=(ivy-G2.vy)*.35;
  if(G2.touched&&G2.tut>=1)G2.tut=.99;if(G2.tut<1&&G2.tut>0)G2.tut=Math.max(0,G2.tut-dt*2);

  // spawning
  if(!G2.ending){
    if(G2.script)v2RunScript(dt);
    else{const cap=G2.rageT>0?20:G2.boss?24:G2.L.cap;G2.acc-=dt*tk;
      if(G2.acc<=0&&v2Active()<cap&&G2.t<G2.dur-3){G2.acc=G2.L.iv*rrnd(.75,1.25)*(G2.boss?1.6:1);v2Spawn();}}
    if(G2.t>=G2.shardAt&&!G2.script){G2.shardAt=G2.mode==='surv'?G2.t+50:1e9;v2Edge('shard',0);}
    if(G2.swarm>0){G2.swarmT-=dt;if(G2.swarmT<=0&&v2Active()<20){G2.swarmT=.09;G2.swarm--;const q=rng();v2Edge(q<.08?'crystal':q<.25?'moon':'ast',rng()<.75?0:null);}}
  }
  if(G2.hunt&&!G2.ending)v2HuntStep(dt);
  // level timer
  if(G2.mode==='level'&&!G2.ending){
    if(G2.hunt&&G2.hunt.n>=G2.hunt.need){G2.ending=1;G2.endT=.6;v2Call('GOAL!','','#ffd76a',1.2,true);sfx('achieve',{vol:.6});}
    if(G2.boss&&G2.t>=G2.dur){
      if(SHOP.time>0&&monOn()){SHOP.time--;saveG();G2.dur+=30;v2Call('TIME CRYSTAL','+30 s','#8fd0ff',1.4,true);sfx('slow',{vol:.7,rate:1.2});} // a time crystal buys the boss fight 30 s
      else{v2Fail('DEV GEZEGEN KAÇTI');return;}}
    if(G2.goal&&levelScore>=G2.goal&&(level!==1||G2.firstRage)&&!G2.mega){G2.ending=1;G2.endT=.6;v2Call('GOAL!','','#ffd76a',1.2,true);sfx('achieve',{vol:.6});}
  }
  if(G2.ending){G2.endT-=dt;if(G2.endT<=0&&gState==='playing'){G2.ending=2;v2Complete();}}

  // minis, bomb waves, boss
  for(let i=G2.minis.length-1;i>=0;i--){const q=G2.minis[i];q.t-=dt;q.a+=dt*5;q.ph+=dt*1.5;v2MiniSize(q);
    // helper: sweeps an arc on the open side of the hole (above it, or below when the hole is high up), always on screen
    const up=hY>H*.42,dist=G2.R+q.r+sp2(40),th=(up?-1:1)*Math.PI/2+1.05*Math.sin(q.ph);
    let tx=clamp(hX+Math.cos(th)*dist,q.r+6,W-q.r-6),ty=clamp(hY+Math.sin(th)*dist,q.r+sp2(70),H-q.r-sp2(56));
    const ddx=tx-hX,min=G2.R+q.r+sp2(12);if(Math.hypot(ddx,ty-hY)<min)ty=hY+(up?-1:1)*Math.sqrt(Math.max(0,min*min-ddx*ddx));
    const kq=Math.min(1,dt*7);q.x+=(tx-q.x)*kq;q.y+=(ty-q.y)*kq;
    if(q.t<=0){v2Burst(q.x,q.y,14,'#c9a8ff',1,4,.5);G2.minis.splice(i,1);}}
  for(let i=G2.beams.length-1;i>=0;i--){const b=G2.beams[i];b.t+=dt;if(b.t>=.25){G2.pulse=1;G2.beams.splice(i,1);}}
  for(let i=G2.waves.length-1;i>=0;i--){const w=G2.waves[i];w.t+=dt;const p=Math.min(1,w.t/w.dur);w.rad=w.max*(1-(1-p)*(1-p));
    if(!w.vis)for(const o of G2.objs){if(o.st!=='in'||o.wait>0||w.hit.has(o)||o.boss||o.orb)continue;
      if(!(o.k==='meteor'||(w.mega?o.k!=='bomb'&&o.k!=='anti'&&v2Edible(o):SMALL2.has(o.k))))continue;if(Math.hypot(o.x-w.x,o.y-w.y)>w.rad+o.r)continue;
      w.hit.add(o);w.n++;const add=Math.min(V2K.bomb.pts,V2K.bomb.max-w.bonus);w.bonus+=add;totalScore+=add;levelScore+=add;v2AddRage(w.mega?3:5);
      if(o.k==='meteor'){o.st='dead';v2Burst(o.x,o.y,14,'#ff8a4c',2,6,.5);}else{o.noScore=false;o.chain=true;v2Swallow(o,null);}
      if(w.n>=2)v2Call('CHAIN ×'+w.n,'','#ffb35c',.9);}
    if(w.t>=w.dur){if(w.n>=3){shake=Math.max(shake,9);v2Pop('CHAIN ×'+w.n+'  +'+w.bonus,'#ffb35c',17);}G2.waves.splice(i,1);}}
  v2BossStep(dt,tk);

  // bodies
  const Gr=G2.G,rageK=G2.rageT>0?V2K.rage.acc:1,overK=G2.overT>0?V2K.over.g:1;
  for(let i=G2.objs.length-1;i>=0;i--){const o=G2.objs[i];o.age+=dt;o.r=o.rr*S;
    if(o.st==='dead'){G2.objs.splice(i,1);continue;}
    if(o.st==='sw'){if(v2SwallowStep(o,dt)){G2.objs.splice(i,1);}continue;}
    if(o.spinA!==undefined)o.spinA+=o.spinV*dt;o.rot+=o.vr*dt;
    if(o.wait>0){o.wait-=dt*tk;continue;}
    const odt=dt*tk;
    if(o.orb){v2BombStep(o,dt);continue;}if(o.noCap>0)o.noCap-=dt;if(o.k==='prey')v2PreyStep(o,odt);
    if(o.k==='pulsar'){o.ph+=dt;o.lit=(o.ph%1.6)<.8;}if(o.k==='mpair')o.sa+=dt*2.4;
    // gravity of the main hole (and any mini hole) — meteors fly straight
    let dx=hX-o.x,dy=hY-o.y,d=Math.hypot(dx,dy)||1;
    if(o.k!=='meteor'){
      const ed=v2Edible(o)||G2.ending;
      if(d<Gr&&o.k==='bomb'&&!G2.ending&&!(o.noCap>0)&&!G2.hold){v2BombCatch(o,d);continue;}
      if(G2.magT>0&&ed&&o.k!=='anti'&&!o.boss&&d>=G2.R+o.r){const A=sp2(2800)*odt;o.vx+=dx/d*A;o.vy+=dy/d*A;const v=Math.hypot(o.vx,o.vy),mx=sp2(650);if(v>mx){o.vx*=mx/v;o.vy*=mx/v;}} // magnet: everything you can eat is hauled in
      if(d<Gr){
        if(!o.inG){o.inG=true;const rx=-dx,ry=-dy,rvx=o.vx-G2.vx,rvy=o.vy-G2.vy,rv=Math.hypot(rvx,rvy)||1;o.b=Math.abs(rx*rvy-ry*rvx)/rv;}
        const q=1-d/Gr;let a=(V2K.acc.min+(V2K.acc.max-V2K.acc.min)*q*q)*rageK*overK;a=Math.min(a,G2.rageT>0?V2K.acc.rage:V2K.acc.max*overK);
        if(!ed)a*=v2Banned(o)?-.7:o.k==='prey'?0:.3;/* banned bodies are pushed away; a fresh prey ignores the pull */if(G2.ending)a*=3;const A=a*S*3600*odt;o.vx+=dx/d*A;o.vy+=dy/d*A;
        // swirl + damping so bodies fall in instead of slingshotting around
        o.vx+=-dy/d*A*.22;o.vy+=dx/d*A*.22;const damp=Math.pow(1-.9*q,odt);o.vx*=damp;o.vy*=damp;
      }else if(d>Gr*1.2)o.inG=false;
      for(const q of G2.minis){if(!SMALL2.has(o.k)||!ed)continue;const mx=q.x-o.x,my=q.y-o.y,md=Math.hypot(mx,my)||1;if(md<q.g){const A=(V2K.acc.min+1.2*(1-md/q.g))*V2K.mini.k*S*3600*odt;o.vx+=mx/md*A;o.vy+=my/md*A;}
        if(md<q.r+o.r*.65){v2Swallow(o,q);break;}}
      if(o.st!=='in')continue;
      o.x+=o.vx*odt;o.y+=o.vy*odt;dx=hX-o.x;dy=hY-o.y;d=Math.hypot(dx,dy)||1;
      if(d<G2.R+o.r*.65){
        if(ed)v2Swallow(o,null);
        else{ // too big: bounces off the event horizon
          const nx=-dx/d,ny=-dy/d,vn=o.vx*nx+o.vy*ny;if(vn<0){o.vx-=1.8*vn*nx;o.vy-=1.8*vn*ny;}o.x=hX+nx*(G2.R+o.r*.66);o.y=hY+ny*(G2.R+o.r*.66);
          if(o.k==='split'){v2Split(o);continue;}
          if(!o.bounced){o.bounced=true;if(v2Banned(o)){v2Call('FORBIDDEN','COMBO ÷2','#ff5a4a',.9);G2.combo=Math.floor(G2.combo/2);comboCount=G2.combo;}else if(o.k!=='pulsar')v2Call('TOO BIG','GROW FIRST','#ffb35c',.9);v2Sfx('armor',{vol:.35,rate:.7});}}}
    }else{ // meteor
      if(o.slow>0){o.slow-=odt;const q=V2K.met.slow;o.vx=o.fvx*q;o.vy=o.fvy*q;if(o.slow<=0)v2Sfx('thrust',{vol:.4,rate:.7,x:o.x});}
      else if(o.ramp<V2K.met.ramp){o.ramp+=odt;const q=V2K.met.slow+(1-V2K.met.slow)*Math.min(1,o.ramp/V2K.met.ramp);o.vx=o.fvx*q;o.vy=o.fvy*q;}
      o.x+=o.vx*odt;o.y+=o.vy*odt;dx=hX-o.x;dy=hY-o.y;d=Math.hypot(dx,dy)||1;
      for(const q of G2.minis)if(Math.hypot(o.x-q.x,o.y-q.y)<q.r+o.r*.8){o.st='dead';q.t=Math.max(.4,q.t-1);v2Burst(o.x,o.y,18,'#c9a8ff',2,6,.5);
        ftexts.push(new FText('BLOCKED',q.x,q.y-q.r-sp2(14),'#c9a8ff',15));v2Sfx('armor',{vol:.5,rate:1.3});break;}
      if(o.st==='dead')continue;
      if((G2.shT>0&&d<G2.R*1.5+o.r*.6||G2.novaT>0&&d<G2.R*1.3+o.r*.6)&&!o.hit){o.st='dead';v2Burst(o.x,o.y,18,'#ffd84d',2,7,.55);const p=25;totalScore+=p;levelScore+=p;
        ftexts.push(new FText('BLOCKED',o.x,o.y-o.r-sp2(10),'#ffd84d',15));v2Sfx('armor',{vol:.55,rate:1.2});vib(15);continue;}
      const gap=d-G2.R-o.r;
      if(gap<-o.r*.25&&!o.hit){o.hit=true;
        if(G2.rageT>0||G2.ending){o.st='dead';v2Burst(o.x,o.y,20,'#ff8a4c',2,7,.6);const p=50;totalScore+=p;levelScore+=p;v2Pop('SMASH +'+p,'#ff9a6c',15);v2Sfx('boom',{vol:.5,rate:1.4});continue;}
        v2Hit(o);o.st='dead';continue;}
      if(gap<o.minGap)o.minGap=gap;
      // closest approach passed without a hit: a near miss within 35 px of the horizon is a PERFECT DODGE
      if(!o.dodged&&d>o.prevD+.1&&o.prevD<1e8){o.dodged=true;if(o.minGap<sp2(V2K.dodge.hi)&&G2.dodgeCD<=0)v2Dodge(o);}
      o.prevD=d;
    }
    // off screen
    const mg=o.r*3+20;if(o.x>-o.r&&o.x<W+o.r&&o.y>-o.r&&o.y<H+o.r)o.seen=true;if(o.k==='prey'&&!o.esc)continue;
    if(!o.tipd&&o.st==='in'&&o.x>o.r&&o.x<W-o.r&&o.y>(o.k==='meteor'?o.r*.5:o.r+sp2(60))&&o.y<H-o.r)v2TipFor(o);
    if((o.seen||o.age>12)&&(o.x<-mg||o.x>W+mg||o.y<-mg||o.y>H+mg)){if(o.fromBoss&&G2.boss)G2.boss.shed=Math.min(G2.boss.shed,.3);G2.objs.splice(i,1);}
  }
  // particles
  for(let i=G2.parts.length-1;i>=0;i--){const p=G2.parts[i];p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vx*=Math.pow(.95,dt*60);p.vy*=Math.pow(.95,dt*60);p.life-=dt;if(p.life<=0)G2.parts.splice(i,1);}
  for(let i=G2.calls.length-1;i>=0;i--){G2.calls[i].life-=dt;if(G2.calls[i].life<=0)G2.calls.splice(i,1);}
  if(G2.overT>0&&!TIPS.over)v2Tip('over',null);
  if(G2.rule&&G2.t>1.2&&!TIPS[G2.rule.tip])v2Tip(G2.rule.tip,null);
  if(G2.boss&&!G2.boss.sw&&G2.t>2.2){const id=G2.boss.bt==='red'?'bossRed':G2.boss.bt==='nova'?'bossNova':'boss';if(!TIPS[id])v2Tip(id,G2.boss);}
  if(G2.ready&&!TIPS.rage)v2Tip('rage',null);
  if(G2.overT<=0&&!G2.overDone&&G2.L.overload&&G2.rr>=G2.cap-.01&&!G2.ending){G2.overT=V2K.over.dur;G2.overDone=true;v2Call('OVERLOAD','MORE POWER · HARDER TO STEER','#c9a8ff',1.8,true);sfx('bossIntro',{vol:.5,rate:1.5});shake=Math.max(shake,8);}
}

// swallow: attract 0.15 s → spiral 0.12 s → vanish 0.08 s (spec §7)
function v2Swallow(o,mini){
  o.st='sw';o.t=0;o.sc=1;o.mini=mini||null;const cx=mini?mini.x:hX,cy=mini?mini.y:hY;o.a=Math.atan2(o.y-cy,o.x-cx);o.d0=Math.max(1,Math.hypot(o.x-cx,o.y-cy));
  o.dir=((o.vx*(cy-o.y)-o.vy*(cx-o.x))>0?-1:1);
  if(o.cell!==undefined){o.suck={ph:'fall'};o.stretch=1;o.squeeze=1;o.fade=1;o.sp=0;}
  if(G2.ending&&!o.chain){o.noScore=true;return;}
  if(o.k==='anti'){o.anti=1;return;} // not food: no combo, no score
  v2Score(o,mini);
}
function v2SwallowStep(o,dt){
  if(o.hang>0){o.hang-=dt;return false;} // mega bomb: the body flares first, then drifts in
  if(o.mega2&&G2.parts.length<150)G2.parts.push({x:o.x,y:o.y,vx:rnd(-.4,.4),vy:rnd(-.4,.4),life:.35,max:.35,c:'#ffc27a',sz:2.2}); // glowing trail
  o.t+=dt;const p=Math.min(1,o.t/(o.swDur||V2K.swallow)),cx=o.mini?o.mini.x:hX,cy=o.mini?o.mini.y:hY;
  const e=p<.43?p/.43*.35:p<.77?.35+(p-.43)/.34*.45:.8+(p-.77)/.23*.2; // attract, spiral, vanish
  const d=o.d0*(1-e);o.a+=o.dir*(2+10*p)*dt*(p>.43?2.2:1);o.x=cx+Math.cos(o.a)*d;o.y=cy+Math.sin(o.a)*d;o.sc=Math.max(.05,1-e*.95);
  if(o.cell!==undefined){o.gs=o.sc;o.radAng=Math.atan2(cy-o.y,cx-o.x);o.stretch=1+p*1.4;o.squeeze=1-p*.5;o.fade=1-p*.6;o.sp=p;}
  if(p>=1){v2Eaten(o);return true;}return false;
}
function v2HuntStep(dt){const h=G2.hunt;
  if(!h.prey){h.next-=dt;if(h.next<=0){const o=v2Edge('prey',rng()<.5?1:2);o.life=G2.rule.life;o.max=o.life;o.stam=1;o.head=Math.atan2(o.vy,o.vx);h.prey=o;v2Call('PREY!',`${h.n+1}/${h.need}`,'#ffd76a',1,false);v2Sfx('sparkle',{vol:.6,rate:.8});}}
  else if(h.prey.st!=='in'&&h.prey.st!=='sw')h.prey=null;}
function v2PreyStep(o,dt){ // flees the hole; keep it in your pull to wear it down (then it can be caught for a moment); touched fresh, it blinks away
  o.life-=dt;const dx=o.x-hX,dy=o.y-hY,d=Math.hypot(dx,dy)||1,flee=d<G2.G*2.2&&o.life>0;o.blinkCD=Math.max(0,(o.blinkCD||0)-dt);
  if(o.life<3.5&&o.life>0&&!o.warned){o.warned=1;v2Call('ESCAPING!','','#ff7a5c',1);v2Sfx('tickHi',{vol:.5,rate:.9});}
  if(o.tiredT>0){o.tiredT-=dt;if(o.tiredT<=0){o.tire=.35;v2Pop('RECOVERED','#ffd76a',14);}}
  else if(d<Math.max(G2.G,sp2(110))){o.tire=Math.min(1,(o.tire||0)+dt/V2K.prey.wear);if(o.tire>=1){o.tiredT=V2K.prey.tired;v2Call('TIRED!','CATCH IT','#ff8a5c',.9);v2Sfx('bell',{vol:.5,rate:1.4});}}
  else o.tire=Math.max(0,(o.tire||0)-dt*.2);
  if(!(o.tiredT>0)&&d<G2.R+o.r*1.2&&o.blinkCD<=0&&o.life>0){const a=Math.atan2(dy,dx)+rrnd(-.6,.6),j=sp2(170);v2Burst(o.x,o.y,14,'#ffd76a',2,6,.4); // blink away
    o.x=clamp(o.x+Math.cos(a)*j,sp2(30),W-sp2(30));o.y=clamp(o.y+Math.sin(a)*j,sp2(30),H-sp2(80));o.blinkCD=1.1;v2Sfx('thrust',{vol:.45,rate:1.6});if((G2.hunt.tipN=(G2.hunt.tipN||0)+1)<=3)v2Call('TIRE IT FIRST','KEEP IT IN YOUR PULL','#ffd76a',1.1);v2Burst(o.x,o.y,14,'#ffd76a',2,6,.4);}
  if(flee){o.stam=Math.max(0,o.stam-dt*.08);const a=Math.atan2(dy,dx);o.head+=((a-o.head+Math.PI*3)%TAU-Math.PI)*Math.min(1,dt*4);}
  else{o.stam=Math.min(1,o.stam+dt*.05);o.head+=Math.sin(G2.t*1.7+o.si)*dt*1.2;}
  const m=sp2(40);if(o.life>0){if(o.x<m)o.head=0;else if(o.x>W-m)o.head=Math.PI;if(o.y<m)o.head=Math.PI/2;else if(o.y>H-m-50)o.head=-Math.PI/2;}
  else if(!o.esc){o.esc=1;o.head=o.x<W/2?Math.PI:0;}
  const sp=sp2(o.esc?520:o.tiredT>0?70:(flee?190+230*o.stam:120)),k=Math.min(1,dt*4);o.vx+=(Math.cos(o.head)*sp-o.vx)*k;o.vy+=(Math.sin(o.head)*sp-o.vy)*k;
  if(o.esc&&(o.x<-o.r*3||o.x>W+o.r*3)){o.st='dead';G2.hunt.prey=null;G2.hunt.next=2.2;v2Call('PREY ESCAPED','','#ff7a5c',1.2,true);G2.hitWhy='prey';v2Hit({x:hX,y:hY});G2.hitWhy=null;}}
function v2DrawPrey(o,s){const r=o.r*s*1.35,q=Math.max(0,o.life/o.max),sp=Math.hypot(o.vx,o.vy)||1;ctx.save();ctx.globalCompositeOperation='lighter';
  const tl=r*(2+sp/sp2(120)),tx=-o.vx/sp*tl,ty=-o.vy/sp*tl,g=ctx.createLinearGradient(o.x,o.y,o.x+tx,o.y+ty);g.addColorStop(0,'rgba(255,215,110,.8)');g.addColorStop(1,'rgba(255,160,60,0)');
  ctx.strokeStyle=g;ctx.lineWidth=r*1.3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x+tx,o.y+ty);ctx.stroke(); // tail
  const gl=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r*2.4);gl.addColorStop(0,'rgba(255,250,220,1)');gl.addColorStop(.35,'rgba(255,200,80,.85)');gl.addColorStop(1,'rgba(255,170,40,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(o.x,o.y,r*2.4,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='source-over';if(!o.esc){ctx.strokeStyle=q<.3?'#ff6a5a':'rgba(255,215,106,.75)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(o.x,o.y,r*2.3,-Math.PI/2,-Math.PI/2+TAU*q);ctx.stroke(); // time left
    const tr=o.tiredT>0?1:(o.tire||0);ctx.strokeStyle=o.tiredT>0?`rgba(255,110,80,${.6+.4*Math.sin(clock*16)})`:'#fff3c4';ctx.lineWidth=5;ctx.beginPath();ctx.arc(o.x,o.y,r*1.6,-Math.PI/2,-Math.PI/2+TAU*tr);ctx.stroke();} // wear: full = catch it
  ctx.restore();}
function v2WinOut(){const r=G2.rule;if(!r||!r.win)return 0;const s=G2.rr/V2K.r0;return s>r.hi?1:s<r.lo?-1:0;}
function v2Score(o,mini){
  const K=OBJ2[o.k];G2.hungry=0;G2.combo++;comboCount=G2.combo;G2.comboT=G2.L.comboT;
  if(G2.combo>G2.best){G2.best=G2.combo;lvCombo=G2.best;}if(G2.combo>maxCombo)maxCombo=G2.combo;
  const perf=!mini&&o.inG&&o.b<V2K.perfectK*G2.G&&!o.chain;
  const m=MULT2(G2.combo);let pts=K.pts*m;if(perf)pts*=1.5;if(G2.rageT>0)pts*=V2K.rage.score;pts=Math.round(pts);
  const wo=v2WinOut();if(wo&&o.k!=='prey'){pts=0;if(!G2.woT||G2.t-G2.woT>1.2){G2.woT=G2.t;v2Pop(wo>0?T('ÇOK BÜYÜK · 0'):T('ÇOK KÜÇÜK · 0'),'#ff8a7a',15);}} // outside the size window nothing scores
  totalScore+=pts;levelScore+=pts;G2.eaten++;if(G2.mode!=='sprint')atlasAdd(o.k);
  v2AddRage((K.rage+(perf?4:0))*(G2.script?1.6:1));
  if(m>MULT2(G2.combo-1)){v2Call('COMBO ×'+m,'','#ffd76a',1,false);v2Sfx('mult',{vol:.55,rate:.8+m*.1});if(m>=4)shake=Math.max(shake,4);totalCombos++;}
  if(perf){G2.perfA++;perfectCount++;dmEvent('perfect',1);v2Pop('PERFECT +'+pts,'#fff1b8',18);v2Sfx('sparkle',{vol:.5,rate:1.2});shake=Math.max(shake,2.2);}
  else if(o.mega2)ftexts.push(new FText('+'+pts,o.x,o.y-o.r-sp2(6),'#ffcf8a',15+Math.min(6,m)));
  else v2Pop('+'+pts,o.k==='crystal'?'#9ef3ff':o.k==='gold'?'#ffd76a':m>=4?'#ffcf8a':'#e7e3da',o.k==='ast'?15+m:19+m);
  const snd={ast:['capture',.45,1.2],moon:['capture2',.55,1],planet:['swallowBig',.7,1],crystal:['gem',.7,1.3],gold:['master',.8,1],energy:['sparkle',.6,.8],time:['slow',.7,1.2],bomb:['bomb',.7,1],mini:['magnet',.7,1],frag:['capture2',.5,1.3],shard:['gem',.7,.8],comet:['gem',.6,1.5],magnet:['magnet',.7,1],pulsar:['sparkle',.8,1],mpair:['capture2',.6,.9],sat:['capture2',.5,1.2],dark:['slow',.6,1.3]}[o.k]||['capture',.5,1];
  v2Sfx(snd[0],{vol:snd[1],rate:snd[2]*(1+Math.min(.5,G2.combo*.015)),x:hX});
  dmEvent('catch',1);dmEvent('combo',G2.combo,true);if(o.k==='crystal')dmEvent('comet',1);dmEvent('score',totalScore,true);
  if(gameMode==='sprint'){const bi=Math.min(9,Math.floor(SPR_RUN.t/6));SPR_RUN.blocks[bi].c++;if(perf)SPR_RUN.blocks[bi].p++;SPR_RUN.caught++;}
  if(o.fromBoss)v2BossHit();
  if(o.k==='energy')v2Call('+15 RAGE','','#ff7ad9',.8);
  vib(o.k==='ast'?8:15);
}
function v2Eaten(o){ // the body has crossed the event horizon
  const K=OBJ2[o.k];const cx=o.mini?o.mini.x:hX,cy=o.mini?o.mini.y:hY;
  const n=Math.min(G2.rageT>0?12:8,4+Math.floor(G2.combo/3));const col={crystal:'#9ef3ff',gold:'#ffd76a',energy:'#ff7ad9',time:'#8fd0ff',bomb:'#ff8a4c',mini:'#c9a8ff',shard:'#ffd84d',comet:'#bff6ff',anti:'#7dffb0',magnet:'#ff8a8a',pulsar:'#bfe6ff',dark:'#b9a8ff'}[o.k]||'#e6dcff';
  v2Burst(cx,cy,n,col,1.2,3.5+Math.min(3,G2.combo*.1),.45,1.6);
  if(o.anti){v2Anti();return;}
  if(o.noScore)return;
  {const cap=G2.cap;G2.rr=Math.min(cap,G2.rr+K.grow);if(o.mini)G2.beams.push({x:cx,y:cy,t:0});else G2.pulse=1;} // helper catches flow into your hole
  addMass(1);
  if(o.k==='time'){G2.timeT=V2K.time.dur;v2Call('TIME SLOW','6 s','#8fd0ff',1.2);}
  else if(o.k==='bomb')v2Blast(hX,hY,!!o.mega);
  else if(o.k==='comet'){G2.comboT+=2;v2Call('COMBO TIME','+2 s','#bff6ff',.9);}
  else if(o.k==='prey'&&G2.hunt){dmEvent('hunt',1);G2.hunt.n++;G2.hunt.prey=null;G2.hunt.next=2.2;v2Call('CAUGHT!',`${G2.hunt.n}/${G2.hunt.need}`,'#ffd76a',1.3,true);sfx('achieve',{vol:.55});shake=Math.max(shake,6);}
  else if(o.k==='magnet'){G2.magT=6;v2Call('MAGNET','6 s','#ff8a8a',1.1);v2Sfx('magnet',{vol:.6});}
  else if(o.k==='pulsar'){v2Pop('PULSAR','#bfe6ff',17);shock=Math.max(shock,.3);}
  else if(o.k==='mpair'){const a=o.sa,d=o.r*1.9,sat=v2Obj('sat',o.x+Math.cos(a)*d,o.y+Math.sin(a)*d,o.vx-Math.sin(a)*sp2(120),o.vy+Math.cos(a)*sp2(120));sat.pair=1;G2.pairT=3;v2Call('NOW THE MOON!','3 s','#cfd6ff',1);}
  else if(o.k==='sat'&&o.pair&&G2.pairT>0){const b=Math.round((OBJ2.mpair.pts+OBJ2.sat.pts)*MULT2(G2.combo));totalScore+=b;levelScore+=b;G2.pairT=0;v2Call('PAIR ×2','+'+b,'#ffd76a',1.3);sfx('achieve',{vol:.5});}
  else if(o.k==='shard'){SHOP.shards=(SHOP.shards||0)+1;if(SHOP.shards>=3){SHOP.shards-=3;SHOP.shield++;v2Call('SHIELD +1','3 / 3','#ffd84d',1.8,true);sfx('achieve',{vol:.6});}
    else v2Call('SHIELD PIECE',SHOP.shards+' / 3','#ffd84d',1.3);saveG();updateUI();}
  else if(o.k==='mini'){const q={x:hX,y:hY,t:V2K.mini.dur,a:0,ph:0};v2MiniSize(q);q.y=hY-G2.R-q.r;G2.minis.push(q);v2Call('MINI BLACK HOLE','HELPER · 6 s','#c9a8ff',1.3);if(!TIPS.mini)v2Tip('mini',q);}
}
function v2Dodge(o){
  G2.dodgeCD=V2K.dodge.cd;G2.perfD++;const p=50*(G2.rageT>0?2:1);totalScore+=p;levelScore+=p;v2AddRage(8);G2.combo++;comboCount=G2.combo;G2.comboT=G2.L.comboT;if(G2.combo>G2.best)G2.best=G2.combo;
  v2Call('PERFECT DODGE','+50','#8dffcb',1);v2Sfx('thrust',{vol:.5,rate:1.5});dmEvent('edge',1);shake=Math.max(shake,2);
  v2Burst(o.x,o.y,10,'#8dffcb',1,3,.4);
}
function v2Hit(o){
  v2Burst(o.x,o.y,22,'#ff7a5c',2,7,.6,2.2);
  if(G2.immT>0)return;G2.immT=V2K.imm;
  if(G2.hold){const b=G2.hold;G2.hold=null;b.orb=null;b.st='dead';v2Blast(b.x,b.y,false);}
  G2.dmg++;G2.lastHit=G2.hitWhy||(o&&o.k)||'meteor';lostThisLevel=true;v2ComboLost();G2.rage=G2.ready?G2.rage:Math.max(0,G2.rage-15);
  shake=Math.max(shake,11);flash=Math.max(flash,.35);shock=Math.max(shock,.7);flashPenal(120);vib([80,40,80]);
  v2Sfx('miss',{vol:.8,x:hX});v2Sfx('buzz',{vol:.35});
  const tutorial=level===1&&G2.mode==='level';
  if(!(tutorial&&lives<=1)){lives--;heartFx(Math.max(0,lives),'drain');v2HitNote();}
  v2Pop('-1 ♥','#ff7a5c',20);updateUI();
  if(lives<=0){v2Fail(null);}
}
function v2HitNote(){ // freeze the action for a beat and say what happened
  G2.freeze=.6;const el=$('hit2');if(!el)return;
  el.innerHTML=`<b>-1 ♥</b><div class="t">${T(G2.hitWhy==='rad'?'RADYASYONA YAKALANDIN':G2.hitWhy==='prey'?'AV KAÇTI':'METEOR ÇARPTI')}</div><div class="hs">${'♥'.repeat(Math.max(0,lives))}<em>${'♥'.repeat(Math.max(0,3-lives))}</em></div>`;
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),1300);
}
function v2Fail(msg){
  if(gState!=='playing')return;gState='over';G2.failMsg=msg;SND.setDrone(.08,300);SND.duck(.35,2);
  if(msg){lives=0;v2Call(msg==='DEV GEZEGEN KAÇTI'?(G2.boss&&G2.boss.bt&&G2.boss.bt!=='planet'?'THE STAR ESCAPED':'THE PLANET ESCAPED'):msg,'','#ff7a5c',2,true);}
  setTimeout(()=>{if(!G2.on||gState!=='over')return;if(gameMode==='sprint'){sprintEnd();return;}if(gameMode==='survival'){gameOver();return;}showCont();},850);
}
function v2Revive(){ // one continue per run (spec §42)
  G2.contUsed=true;lives=1;G2.combo=0;comboCount=0;G2.rage=V2K.cont.rage;G2.ready=false;G2.rageT=0;G2.immT=V2K.cont.imm;
  hideModals();updateUI();gState='playing';lastT=performance.now();saveG();SND.setDrone(.14,650);SND.duck(1,0);sfx('powerup',{vol:.6});
  if(G2.failMsg==='DEV GEZEGEN KAÇTI'){G2.dur+=30;v2Call('+30 s','','#8dffcb',1.2);}
  for(const o of G2.objs)if(o.k==='meteor'&&Math.hypot(o.x-hX,o.y-hY)<sp2(260))o.st='dead';
}
function v2RageGo(){
  if(!G2.ready)return;v2Ach.rage++;G2.firstRage=true;G2.ready=false;G2.readyT=0;G2.rageT=V2K.rage.dur;G2.rage=100;G2.swarm=16;G2.swarmT=.15;
  shake=Math.max(shake,10);flash=Math.max(flash,.8);shock=1;heat=.6;
  v2Call('BLACK HOLE RAGE!','','#ff6a3d',1.8,true);sfx('powerup',{vol:.8,rate:.7});sfx('magnet',{vol:.6,rate:.7});sfx('boom',{vol:.5,rate:.5});SND.setDrone(.24,420);vib([40,30,90]);
  v2Burst(hX,hY,40,'#ff8a4c',2,8,.8,2.2);dmEvent('rescue',1);
}

// ── split planets, antimatter, wormholes ─────────────
function v2Split(o){ // a split planet cracks in two: both halves (half the mass each) shoot away from the hole
  o.st='dead';const a0=Math.atan2(o.y-hY,o.x-hX);for(const sd of [-1,1]){const a=a0+sd*.55,s=sp2(rrnd(300,360)),h=v2Obj('half',o.x+Math.cos(a)*o.r*.45,o.y+Math.sin(a)*o.r*.45,Math.cos(a)*s,Math.sin(a)*s);h.cut=a0+sd*Math.PI/2;h.noCap=.8;}
  v2Burst(o.x,o.y,30,'#9ff4ff',2,8,.7,2.2);shake=Math.max(shake,6);v2Sfx('boom',{vol:.55,rate:1.2});v2Call('SPLIT!','','#ffb35c',.9);
}
function v2Anti(){ // antimatter swallowed: the hole loses a third of its growth (Rage burns it off harmlessly)
  if(G2.mode!=='sprint')atlasAdd('anti');
  if(G2.rageT>0){const p=25;totalScore+=p;levelScore+=p;v2Pop('NEUTRALIZED +'+p,'#7dffb0',15);return;}
  G2.rr=Math.max(V2K.r0,G2.rr-(G2.rr-V2K.r0)*.35-2);G2.pulse=1;shake=Math.max(shake,9);flash=Math.max(flash,.4);
  v2Burst(hX,hY,30,'#7dffb0',2,7,.6,2);v2Call('ANTIMATTER!','SHRINK','#7dffb0',1.2);v2Sfx('miss',{vol:.6,rate:1.3});vib([40,30,40]);
}
function v2Worms(dt){ // wormholes from level 19: an orange mouth low on the screen, a blue one above the hole
  if(G2.lv>=19&&!G2.ending&&!G2.boss&&!G2.script){G2.wormT-=dt;if(G2.wormT<=0&&!G2.worms.length){G2.wormT=24;const pr=sp2(44);
    let ax=W*.5,ay=H*.3;for(let t=0;t<12;t++){ax=rrnd(W*.18,W*.82);ay=rrnd(H*.2,H*.55);if(Math.hypot(ax-hX,ay-hY)>G2.G+pr*2.5)break;}
    const w={ax,ay,bx:hX,by:hY,r:pr,t:0,life:12,n:0};G2.worms.push(w);v2Call('WORMHOLE','','#8fd0ff',1);if(!TIPS.worm)v2Tip('worm',{x:w.ax,y:w.ay,r:pr});}}
  for(let i=G2.worms.length-1;i>=0;i--){const w=G2.worms[i];w.t+=dt;if(w.t>=w.life){if(w.n)v2Pop('PORTAL ×'+w.n,'#8fd0ff',15);G2.worms.splice(i,1);continue;}
    {const a=Math.atan2(hY-w.ay,hX-w.ax);const d0=(G2.R+G2.G)*.5;w.bx=hX-Math.cos(a)*d0;w.by=hY-Math.sin(a)*d0;} // the exit rides inside your pull, on the side facing the entrance
    for(const o of G2.objs){if(o.st!=='in'||o.k==='meteor'||o.boss||o.orb||o.wait>0||o.jumped>0)continue;const dx=w.ax-o.x,dy=w.ay-o.y,d=Math.hypot(dx,dy)||1;
      if(d<w.r*3.6){const A=sp2(1100)*dt;o.vx+=dx/d*A;o.vy+=dy/d*A;const sp=Math.hypot(o.vx,o.vy),mx=sp2(340);if(sp>mx){o.vx*=mx/sp;o.vy*=mx/sp;} // the mouth draws nearby bodies in
        if(Math.random()<dt*12&&G2.parts.length<150)G2.parts.push({x:o.x,y:o.y,vx:dx/d*1.5,vy:dy/d*1.5,life:.35,max:.35,c:'#ffb35c',sz:1.6});}
      if(d<w.r+o.r*.8){v2Burst(o.x,o.y,12,'#ffb35c',1,4,.4);o.x=w.bx;o.y=w.by;const ex=hX-o.x,ey=hY-o.y,ed=Math.hypot(ex,ey)||1,sp=sp2(180);o.vx=ex/ed*sp;o.vy=ey/ed*sp;o.jumped=1;w.n++;
        v2Burst(o.x,o.y,12,'#8fd0ff',1,4,.4);v2Sfx('thrust',{vol:.35,rate:1.4});}}}
}

// ── helper hole, bomb hold, blasts ────────────────────
function v2MiniSize(q){const rr=clamp(G2.R/G2.S*.5,V2K.mini.rMin,V2K.mini.rMax);q.r=sp2(rr);q.g=sp2(Math.min(rr*V2K.mini.gK,V2K.mini.gMax));} // half your size, capped so it fits
function v2BombCatch(o,d){ // the bomb settles into orbit; hold it 3 s for the mega blast
  o.orb={a:Math.atan2(o.y-hY,o.x-hX),t:0,dist:clamp(d,G2.R+o.r+sp2(10),G2.R+(G2.G-G2.R)*.55),beep:0,lag:0};G2.hold=o;
  v2Call('HOLD IT!','3 s','#ff8a4c',1.1);v2Sfx('armor',{vol:.45,rate:.8});vib(20);
}
function v2BombStep(o,dt){
  const b=o.orb;b.t+=dt;b.a+=dt*2.6;b.dist=clamp(b.dist,G2.R+o.r+sp2(10),Math.max(G2.R+o.r+sp2(10),G2.G*.9));
  const tx=hX+Math.cos(b.a)*b.dist,ty=hY+Math.sin(b.a)*b.dist,px=o.x,py=o.y,k=Math.min(1,dt*14);
  o.x+=(tx-o.x)*k;o.y+=(ty-o.y)*k;o.vx=(o.x-px)/Math.max(dt,1e-3);o.vy=(o.y-py)/Math.max(dt,1e-3);o.rot+=dt*4;
  b.lag=Math.hypot(tx-o.x,ty-o.y)/Math.max(sp2(55),G2.G*.5); // how hard the drag is pulling on it (1 = it breaks free)
  if(b.lag>1){o.orb=null;G2.hold=null;o.noCap=1;o.inG=false;v2Call('BOMB LOST','TOO FAST','#ff8a4c',1.1);v2Sfx('thrust',{vol:.5,rate:.8});return;}
  const sec=Math.ceil(V2K.bomb.hold-b.t);if(sec!==b.beep&&sec>0){b.beep=sec;v2Sfx('tickHi',{vol:.55,rate:1+(3-sec)*.2});}
  if(b.t>=V2K.bomb.hold){o.orb=null;G2.hold=null;o.mega=true;o.noScore=false;v2Swallow(o,null);}
}
function v2Nova(){ // 💎 Supernova: everything on screen pops into the hole, then 3 s in which meteors shatter on you
  if(!G2.on||gState!=='playing'||G2.mega||gameMode==='sprint'||G2.ending)return;const N=V2K.nova;
  if(G2.novaN>=N.max){v2Pop('MAX '+N.max+' / LEVEL','#8fe9ff',15);v2Sfx('buzz',{vol:.25});return;}
  if(diamonds<N.cost){toast('💎','ELMASIN YETMİYOR',T('Süpernova için {n} 💎 gerekli.',{n:N.cost}));v2Sfx('buzz',{vol:.25});return;}
  diamonds-=N.cost;G2.novaN++;dmEvent('diamond',1);saveG();updateUI();G2.novaT=N.imm;
  sfx('powerup',{vol:.8,rate:.7});sfx('magnet',{vol:.5,rate:1.4});vib([30,20,60]);v2Blast(hX,hY,true,true);v2Ui(true);
}
function v2Blast(x,y,mega,nova){ // mega: the whole screen falls in; otherwise ~3× your radius (spec)
  G2.waves.push({x,y,t:0,rad:0,max:mega?Math.hypot(W,H):G2.R*V2K.bomb.r,dur:mega?.9:.6,mega,vis:mega,hit:new Set(),n:0,bonus:0});
  if(mega){const L=G2.objs.filter(o=>o.st==='in'&&o.wait<=0&&!o.boss&&!o.orb&&o.k!=='anti'&&o.k!=='bomb'&&(o.k==='meteor'||v2Edible(o))).sort((a,b)=>Math.hypot(a.x-hX,a.y-hY)-Math.hypot(b.x-hX,b.y-hY));
    G2.mega={t:0,i:0,list:L,gap:Math.min(.07,1.1/Math.max(1,L.length)),bonus:0,n:0,nova:!!nova};}
  shake=Math.max(shake,mega?12:6);flash=Math.max(flash,mega?.9:.5);sfx('boom',{vol:mega?.9:.7,rate:mega?.7:1});
  if(nova){shock=1;v2Call('SUPERNOVA','','#8fe9ff',1.6,true);}else if(mega){v2Ach.mega++;shock=1;v2Call('MEGA BOMB!','','#ff8a4c',1.5,true);vib([40,30,120]);}else v2Call('BOMB!','','#ff8a4c',.8);
}

function v2MegaStep(dt){ // play pauses while the screen pops body by body and everything spirals into the hole
  const M=G2.mega;M.t+=dt;
  while(M.i<M.list.length&&M.t>=M.i*M.gap){const o=M.list[M.i++];if(o.st!=='in')continue;M.n++;
    const add=Math.min(V2K.bomb.pts,V2K.bomb.max-M.bonus);M.bonus+=add;totalScore+=add;levelScore+=add;v2AddRage(2);
    G2.megaFx.push({x:o.x,y:o.y,r:o.r,t:0,c:o.k==='meteor'?'#ff5a3c':M.nova?'#8fe9ff':'#ffb35c'});v2Burst(o.x,o.y,16,o.k==='meteor'?'#ff6a4c':'#ffd29a',2,7,.6,2.4);shake=Math.max(shake,3);
    if(M.n%2)sfx('capture',{vol:.35,rate:1.1+Math.min(.8,M.n*.04),x:o.x});
    if(o.k==='meteor'){o.st='dead';ftexts.push(new FText('+'+add,o.x,o.y,'#ff8a6b',15));}
    else{o.noScore=false;o.chain=true;o.mega2=true;o.hang=.16;o.swDur=1.05;o.eca=Math.atan2(o.y-hY,o.x-hX)+Math.PI/2;v2Swallow(o,null);}}
  for(let i=G2.objs.length-1;i>=0;i--){const o=G2.objs[i];if(o.st==='dead'){G2.objs.splice(i,1);continue;}if(o.st==='sw'&&v2SwallowStep(o,dt))G2.objs.splice(i,1);}
  for(let i=G2.parts.length-1;i>=0;i--){const p=G2.parts[i];p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vx*=Math.pow(.95,dt*60);p.vy*=Math.pow(.95,dt*60);p.life-=dt;if(p.life<=0)G2.parts.splice(i,1);}
  for(let i=G2.waves.length-1;i>=0;i--){const w=G2.waves[i];w.t+=dt;w.rad=w.max*(1-(1-Math.min(1,w.t/w.dur))**2);if(w.t>=w.dur)G2.waves.splice(i,1);}
  if(M.i>=M.list.length&&!G2.objs.some(o=>o.st==='sw'&&o.mega2)){G2.mega=null;if(M.n)v2Pop((M.nova?'SUPERNOVA ×':'MEGA ×')+M.n+'  +'+M.bonus,M.nova?'#8fe9ff':'#ffb35c',19);}}
function v2DrawEclipse(){ // mega bomb: a dark disc slides over each body (a little eclipse with a bright corona) as it is dragged in
  for(const o of G2.objs){if(!o.mega2||o.st!=='sw')continue;const p=o.hang>0?0:Math.min(1,o.t/(o.swDur||1)),R=Math.max(9,o.r*(o.sc??1))*1.12;if(p>=.97)continue;
    const k=Math.min(1,p*3),off=(1-k)*R*1.6,ex=o.x+Math.cos(o.eca)*off,ey=o.y+Math.sin(o.eca)*off,ring=Math.min(1,p*6)*(1-Math.max(0,p-.75)/.22);
    ctx.save();ctx.globalCompositeOperation='lighter';const cr=R*(2.4+.5*Math.sin(clock*7+o.si)),g=ctx.createRadialGradient(o.x,o.y,R*.95,o.x,o.y,cr);
    g.addColorStop(0,`rgba(255,248,225,${.95*ring})`);g.addColorStop(.25,`rgba(255,200,120,${.5*ring})`);g.addColorStop(1,'rgba(255,140,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,cr,0,TAU);ctx.fill();
    for(let i=0;i<6;i++){const a=o.eca+i/6*TAU+clock*.8,l=R*(1.7+.5*Math.sin(clock*5+i*2));ctx.strokeStyle=`rgba(255,236,200,${.5*ring})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(o.x+Math.cos(a)*R*1.05,o.y+Math.sin(a)*R*1.05);ctx.lineTo(o.x+Math.cos(a)*l,o.y+Math.sin(a)*l);ctx.stroke();} // corona streamers
    if(k>.6&&k<1){const a=o.eca+Math.PI,dx=o.x+Math.cos(a)*R,dy=o.y+Math.sin(a)*R,q=1-Math.abs(k-.82)/.22,d=ctx.createRadialGradient(dx,dy,0,dx,dy,R*1.1);
      d.addColorStop(0,`rgba(255,255,255,${q})`);d.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=d;ctx.beginPath();ctx.arc(dx,dy,R*1.1,0,TAU);ctx.fill();} // the diamond-ring flash
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=Math.min(1,k*1.3);ctx.fillStyle='#000';ctx.beginPath();ctx.arc(ex,ey,R,0,TAU);ctx.fill();
    if(k>=1){ctx.strokeStyle=`rgba(255,244,215,${ring})`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(o.x,o.y,R,0,TAU);ctx.stroke();} // the bright rim of a total eclipse
    ctx.restore();}}
function v2DrawMegaFx(dt){ // a white-hot flare on every body the mega bomb detonates
  for(let i=G2.megaFx.length-1;i>=0;i--){const f=G2.megaFx[i];f.t+=dt;const p=f.t/.55;if(p>=1){G2.megaFx.splice(i,1);continue;}
    const R=f.r*(1.6+3.2*p)+sp2(8);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,R);
    g.addColorStop(0,`rgba(255,255,255,${1-p*.8})`);g.addColorStop(.35,f.c+Math.round(200*(1-p)).toString(16).padStart(2,'0'));g.addColorStop(1,'rgba(255,120,40,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,R,0,TAU);ctx.fill();ctx.globalAlpha=1-p;ctx.strokeStyle=f.c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1+3*p),0,TAU);ctx.stroke();ctx.restore();}}

// ── golden shield: the player decides when; 10 s, meteors shatter on the bubble ──
function v2Shield(){
  if(!G2.on||gState!=='playing'||gameMode==='sprint'||G2.shT>0||G2.rageT>0)return;
  if(SHOP.shield<=0){if(monOn())v2ShieldBuy();else{toast('🛡','KALKANIN YOK','3 kalkan parçası topla: seviye 4’ten itibaren gelir.');v2Sfx('buzz',{vol:.25});}return;}
  SHOP.shield--;saveG();updateUI();G2.shT=V2K.shield.dur;G2.shTick=0;
  v2Call('SHIELD','10 s','#ffd84d',1.1);sfx('armor',{vol:.8,rate:.9});sfx('powerup',{vol:.45,rate:1.3});vib(25);v2Burst(hX,hY,24,'#ffd84d',2,6,.6);v2Ui(true);
}
function v2ShieldBuy(){ // empty: offer one for diamonds, the game waits
  const c=V2K.shield.cost,ok=diamonds>=c;G2.tip={id:'buy'};gState='tip';DRAG.id=null;
  $('shbD').textContent=T('Kalkanın kalmadı. Elmasla bir kalkan al ve hemen kullan.')+' · '+T('Elmasın')+': '+diamonds+' 💎';
  const b=$('shbYes');b.disabled=!ok;b.textContent=ok?T('AL VE KULLAN')+' · '+c+' 💎':T('Yetersiz elmas');showModal('mShBuy');SND.duck(.4,1e5);
}
function v2ShieldBuyOk(){const c=V2K.shield.cost;if(diamonds<c)return;diamonds-=c;SHOP.shield++;saveG();v2TipOk();v2Shield();}

// ── first-encounter tips: one card per thing, once per player, the game waits for ANLADIM ──
const TIP2={
  rage:['🔥','RAGE','Rage barın doldu! Ekrana dokun: 5 saniye boyunca kara deliğin devleşir, her şeyi çeker, puanın ×2 olur ve meteorlar sana zarar veremez.'],
  meteor:['☄️','METEOR','Kırmızı meteor tehlikeli: çarparsa 1 can gider. Önce yavaş girer, sonra hızlanır. Kırmızı oklar gideceği yolu gösterir, o yoldan çekil. Kıl payı kaçarsan PERFECT DODGE!'],
  crystal:['🔷','KRİSTAL','Kristal çok değerli: +200 puan ve hızlı büyüme. Ama çoğu zaman yanında bir meteor olur, dikkat et.'],
  energy:['⚡','ENERJİ','Enerji topu Rage barını hızla doldurur. Kaçırma!'],
  gold:['🌕','ALTIN GEZEGEN','Nadir ve çok hızlı: +500 puan. Yutmak için biraz büyümüş olman gerekir.'],
  time:['⏱','ZAMAN TOPU','Yut: her şey 6 saniye yavaşlar, sen hızlı kalırsın.'],
  bomb:['💣','BOMBA GEZEGEN','Bombayı çekim alanına al: etrafında döner, fitili yanar. 3 saniye alanında tutarsan MEGA BOMB ekrandaki her şeyi sana çeker. Çok hızlı hareket edersen bomba kaçar.'],
  mini:['🌀','MİNİ KARA DELİK','Yut: 6 saniye boyunca etrafında dönen yardımcı bir kara delik açılır. Onun yuttukları sana akar. Meteor ona çarparsa can gitmez.'],
  big:['🪐','ÇOK BÜYÜK','Bu cisim şimdilik senden büyük: çarpınca seker. Küçük cisimleri yiyerek büyü, sonra onu da yut.'],
  over:['🟣','OVERLOAD','Sınıra kadar büyüdün! 15 saniye boyunca daha güçlüsün ama yönetmek zorlaşır. Sonra kara delik biraz küçülür.'],
  shield:['🛡','KALKAN','Bir kalkanın var! Meteor yaklaşınca kalkan butonuna dokun: 10 saniye boyunca çarpan her meteor parçalanır. Kalkan kırmızıya dönünce bitmek üzeredir.'],
  shard:['🛡','KALKAN PARÇASI','Kalkan parçasını yut: 3 parça toplayınca 1 kalkan kazanırsın.'],
  shrink:['💨','KÜÇÜLÜYOR','Bir süre bir şey yutmazsan kara deliğin yavaşça küçülür. Yemeye devam et! Seviye sonunda ulaştığın en büyük boyut sayılır.'],
  comet:['☄️','KUYRUKLU YILDIZ','Çok hızlı geçer. Yakalarsan combo süren 2 saniye uzar.'],
  split:['🌋','BÖLÜNEN GEZEGEN','Bu buzlu gezegen bütün olarak yutulmaz: kara deliğine çarpınca ikiye bölünür ve yarım kütleli iki parça hızla uzaklaşır. Peşlerinden git, ikisini de yut!'],
  anti:['⚛️','ANTİMADDE','Yutma! Antimadde kara deliğini hemen küçültür. Çekim alanına girerse içeri çekilir, uzak tut. Rage açıkken zararsızdır.'],
  magnet:['🧲','MIKNATIS TAŞI','Bu mıknatıs taşını yut: 6 saniye boyunca ekranda yutabileceğin her şey hızla sana çekilir.'],
  nova:['💎','SÜPERNOVA','Üstteki elmas butonuna dokun (20 💎): ekrandaki her şey patlayıp kara deliğine süzülür, sonra 3 saniye meteorlar sana zarar veremez. Seviye başına 2 kez.'],
  pulsar:['💫','PULSAR','Yanıp söner. Sadece parlarken yutulur ve 150 puan verir; sönükken kara deliğinden seker.'],
  mpair:['🪐','UYDULU GEZEGEN','Önce gezegeni yut, 3 saniye içinde uydusunu da yutarsan çift puan!'],
  dark:['🌫️','KARANLIK MADDE','Görünmez! Arkasındaki yıldızları nasıl büktüğüne bak. Yakalarsan 120 puan.'],
  worm:['🌀','SOLUCAN DELİĞİ','Turuncu kapı yakındaki cisimleri kendine çeker ve mavi kapıdan doğrudan kara deliğine gönderir.'],
  boss:['🪐','DEV GEZEGEN','Dev gezegen yutulamayacak kadar büyük. Kopan parçalarını yut: her parça onu küçültür. Yeşile dönünce üstüne git ve bütünüyle yut!'],
  bossRed:['🔴','KIRMIZI DEV','Ölmekte olan dev bir yıldız: nefes alır gibi şişip söner, şiştikçe daha çok plazma saçar. Plazmayı yut: her biri onu küçültür. Yeşile dönünce bütünüyle yut!'],
  restrict:['⛔','KISITLI SEVİYE','Bu seviyede bazı cisimler yasak: üstlerinde kırmızı işaret var. Seni iterler; üstlerine gidip çarparsan combo yarıya iner. Geri kalanını yiyerek hedefi tamamla.'],
  window:['📏','BOYUT PENCERESİ','Puan sadece kara delik üstteki yeşil aralıktayken gelir. Küçüksen büyü. Fazla büyürsen buharlaşırsın ve o sırada yediğin puan getirmez: yavaş ye, aralıkta kal.'],
  hunt:['🎯','AV','Altın av yutulmaz, önce yorulması gerekir: onu çekim alanında tut, iç halkası dolsun. Yorulunca kızarır ve yavaşlar, o an üstüne git ve yut. Dokunursan kaçar. Dış halka süresidir; biterse av kaçar ve 1 can gider.'],
  rad:['☢','RADYASYON','Boss üstünde radyasyon işareti belirince dalgalar geliyor demektir. Kırmızı yönlerden dalgalar yayılır, aralarında boşluk vardır: dalga geçerken boşlukta dur. Değersen can kaybedersin. Kalkan ve Rage seni korur.'],
  bossNova:['💥','SÜPERNOVA','Patlayan yıldız: her 7 saniyede bir parlayıp etrafa enkaz saçar. Enkazı yut: her parça onu küçültür. Yeşile dönünce bütünüyle yut!']};
function v2TipFor(o){let id=null;
  if(o.k==='meteor'){if(!(o.slow>0||o.ramp<V2K.met.ramp)){o.tipd=1;return;}id='meteor';}
  else if(['crystal','energy','gold','time','bomb','mini','shard','comet','split','anti','magnet','pulsar','mpair','dark'].includes(o.k))id=o.k;
  else if(GL2.has(o.k)&&o.k!=='sat'&&!v2Edible(o))id='big';
  if(!id||TIPS[id]||v2Tip(id,o))o.tipd=1;}
function v2Tip(id,tg){
  if(TIPS[id]||G2.tip||gState!=='playing'||G2.ending||G2.tipCD>0||(G2.script&&!G2.touched))return false;
  TIPS[id]=1;saveSoon();G2.tip={id,tg};gState='tip';DRAG.id=null;const t=TIP2[id];
  $('tip2I').textContent=t[0];$('tip2T').textContent=t[1];$('tip2D').textContent=t[2];
  const y=id==='rage'||id==='shield'?0:tg?tg.y:hY,m=$('mTip2');m.classList.toggle('tTop',y>H*.5);m.classList.toggle('tBot',y<=H*.5);
  $('rage2')&&$('rage2').classList.toggle('hl',id==='rage');$('shTop').classList.toggle('hl',id==='shield');
  showModal('mTip2');SND.duck(.4,1e5);sfx('bell',{vol:.5,rate:1.25});return true;
}
function v2TipOk(){if(gState!=='tip')return;hideModals();G2.tip=null;G2.tipCD=.8;$('rage2')&&$('rage2').classList.remove('hl');$('shTop').classList.remove('hl');gState='playing';lastT=performance.now();SND.duck(1,0);sfx('click',{vol:.4});}

// ── level end ─────────────────────────────────────────
function v2Complete(){
  if(gState!=='playing')return;
  const sz=G2.peak/V2K.r0;G2.rec=sz>bestSize+1e-6;if(G2.rec){bestSize=sz;saveG();}
  if(!G2.dmg)dmEvent('clean',1);if(G2.rule&&G2.mode==='level')dmEvent('rulelv',1);
  if(G2.mode==='level'&&level===2&&!TIPS.gift){TIPS.gift=1;SHOP.shield++;G2.gift=1;saveG();} // the first shield is a gift
  G2.objs=G2.objs.filter(o=>o.st==='sw');
  if(gameMode==='survival'){gameOver();return;}
  levelSuccess();
}
function v2Streak(st){ // 10 levels in a row with 3 stars and no stars spent on a continue → 25 diamonds
  G2.lifeGift=0;if(REPLAY||gameMode!=='classic')return;
  if(st===3&&!G2.starCont){STREAK3++;if(STREAK3>=10){STREAK3=0;diamonds+=25;G2.lifeGift=1;later(()=>toast('🎁','+25 💎','10 seviye üst üste 3 yıldız!'),2400);}}else STREAK3=0;saveG();
}
function v2SizeTxt(x){return (x||0).toFixed(2)+' M';}
function v2Result(){ // level-complete card body
  const sz=G2.peak/V2K.r0;const row=(k,v,hl)=>`<div class="r2"><span>${T(k)}</span><b${hl?' class="hl"':''}>${v}</b></div>`;
  const lv=clamp(lives,1,3),st=`<span class="ok">${'♥'.repeat(lv)}</span><span>${'♥'.repeat(3-lv)}</span><span>=</span><span class="ok">${'★'.repeat(lv)}</span><span>${'☆'.repeat(3-lv)}</span>`;
  const s3=G2.lifeGift?`<div class="s3b gift"><b>🎁 +25 💎</b><br>${T('10 seviye üst üste 3 yıldız')}</div>`:REPLAY?'':`<div class="s3b">${T('3 yıldız serisi')} ${STREAK3} / 10 · 🎁 25 💎<div class="bar"><i style="width:${STREAK3*10}%"></i></div></div>`;
  return `<div class="stc2">${st}</div>${s3}<div class="how2">${T('KARA DELİK KÜTLESİ')}</div><div class="size2">${v2SizeTxt(sz)}${G2.rec?`<i>${T('YENİ REKOR!')}</i>`:''}</div><div class="how2u">${T('1 M = 1 Güneş kütlesi')}</div>`+
    `<div class="res2">${row('SKOR',levelScore.toLocaleString(LOC))}${row('EN İYİ COMBO','×'+G2.best)}${row('YUTULAN',G2.eaten)}${row('PERFECT ABSORB',G2.perfA)}${row('PERFECT DODGE',G2.perfD)}${row('ÖDÜL','+5 ⭐'+(level%5===0?' +3 💎':'')+(G2.gift?' +1 🛡':''),true)}</div>`;
}
function v2Teaser(l){const n=new2(l);return n?`<b>${T('SIRADA')}</b>LEVEL ${l} · NEW: ${n[0]} ${n[1]}`:'';}

// ── drawing ───────────────────────────────────────────
function v2Frame(dt){
  const f=dt*60;clock+=dt;
  heat=Math.max(G2.rageT>0?.55:Math.min(.4,G2.combo*.02),heat-dt*.8);shock=Math.max(0,shock-dt*1.6);flash=Math.max(0,flash-dt*1.4);
  if(gState==='playing'){if(G2.mega)v2MegaStep(dt);else if(G2.freeze>0)G2.freeze-=dt;else v2Update(dt);}
  else{for(let i=G2.parts.length-1;i>=0;i--){const p=G2.parts[i];p.x+=p.vx*f;p.y+=p.vy*f;p.life-=dt;if(p.life<=0)G2.parts.splice(i,1);}
    for(const o of G2.objs)if(o.st==='sw'&&gState==='lvlup_anim'&&v2SwallowStep(o,dt))o.st='dead';G2.objs=G2.objs.filter(o=>o.st!=='dead');}
  v2Dims();curR=G2.R*RING_K;tgtR=curR;holeK=1;lockK=0;
  G2.gl.length=0;for(const o of G2.objs)if(o.cell!==undefined&&o.wait<=0)G2.gl.push(o);if(G2.boss&&G2.boss.cell!==undefined)G2.gl.push(G2.boss);
  let sx=0,sy=0;if(shake>0){sx=(Math.random()-.5)*shake;sy=(Math.random()-.5)*shake;shake*=Math.pow(.8,f);if(shake<.3)shake=0;}
  const gl=glDraw(clock,sx,sy);if(!gl)drawFallbackBG();
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);ctx.translate(sx,sy);
  ctx.save();ctx.globalCompositeOperation='lighter';for(const d of dust){d.update(dt);d.draw();}ctx.restore();ctx.globalAlpha=1;
  drawScreenFx(dt);
  v2DrawField();
  v2DrawMegaFx(dt);v2DrawEclipse();
  for(const w of G2.waves){ctx.save();ctx.globalAlpha=Math.max(0,1-w.t/w.dur);ctx.strokeStyle='#ff8a4c';ctx.lineWidth=w.mega?6:3;ctx.shadowColor='#ff6a2c';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(w.x,w.y,w.rad,0,TAU);ctx.stroke();ctx.restore();}
  for(const q of G2.minis)v2DrawMini(q);
  v2DrawLinks();v2DrawShield();v2DrawMono();
  v2DrawWorms();
  for(const o of G2.objs){if(o.cell!==undefined&&gl){if(o.k==='gold'&&o.st==='in')v2DrawGold(o);else if(o.k==='mpair'&&o.st==='in')v2DrawSat(o);else if((o.k==='split'||o.k==='half')&&o.st==='in')v2DrawCracks(o);continue;}v2DrawObj(o,gl);}
  if(G2.boss)v2DrawBoss(G2.boss,gl);
  v2DrawMarks();
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const p of G2.parts){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.strokeStyle=p.c;ctx.lineWidth=p.sz;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*2,p.y-p.vy*2);ctx.stroke();}
  for(let i=sparks.length-1;i>=0;i--){if(!sparks[i].update(dt,f))sparks.splice(i,1);else sparks[i].draw();}
  ctx.restore();ctx.globalAlpha=1;
  for(let i=ftexts.length-1;i>=0;i--){if(!ftexts[i].update(dt))ftexts.splice(i,1);else ftexts[i].draw();}
  for(let i=cols.length-1;i>=0;i--){if(!cols[i].update(dt,f)){const c=cols.splice(i,1)[0];if(c.gem){diamonds++;sfx('gem',{vol:.45,rate:1+Math.random()*.2});}else{stars++;sfx('coin',{vol:.4,rate:1+Math.random()*.25});}updateUI();}else cols[i].draw();}
  if(explA>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(230,220,255,${explA})`;ctx.lineWidth=14*explA+2;ctx.beginPath();ctx.arc(hX,hY,explR,0,TAU);ctx.stroke();ctx.restore();explR+=9*f;explA-=.012*f;}
  v2DrawRule();v2DrawTipMark();v2DrawCalls();v2DrawTut();
  recFrame();
  G2.uiT-=dt;if(G2.uiT<=0){G2.uiT=.1;v2Ui(false);}
  if(gState==='playing'){G2.achT=(G2.achT||0)-dt;if(G2.achT<=0){G2.achT=.4;checkAchs();}} // achievements show the moment they are earned, not at the end of the level
}
function v2DrawField(){ // gravity field, rage aura, overload wobble, damage blink
  if(gState!=='playing'&&gState!=='paused'&&gState!=='tip')return;
  const R=G2.R,Gr=G2.G;ctx.save();ctx.translate(hX,hY);
  let pull=false;for(const o of G2.objs)if(o.st==='in'&&o.inG&&o.k!=='meteor'){pull=true;break;}
  {const fg=ctx.createRadialGradient(0,0,R,0,0,Gr);fg.addColorStop(0,'rgba(150,170,255,0)');fg.addColorStop(.85,`rgba(150,170,255,${pull?.08:.05})`);fg.addColorStop(1,'rgba(150,170,255,0)');ctx.fillStyle=fg;ctx.beginPath();ctx.arc(0,0,Gr,0,TAU);ctx.fill();}
  if(G2.rageT>0){const g=ctx.createRadialGradient(0,0,R,0,0,Gr);g.addColorStop(0,'rgba(255,90,40,.28)');g.addColorStop(1,'rgba(255,90,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,Gr,0,TAU);ctx.fill();}
  {const tn=SKIN_TINT[SKIN.sel]||'#b9a8ff';ctx.save();ctx.shadowColor=tn;ctx.shadowBlur=6;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,R+.8,0,TAU);ctx.stroke();ctx.restore();} // crisp event horizon
  if(G2.rageT>0){const q=G2.rageT/V2K.rage.dur,bl=G2.rageT<1.5?(Math.sin(clock*24)>0?1:.25):1;ctx.save();ctx.lineCap='round';ctx.lineWidth=4;ctx.strokeStyle='rgba(255,120,70,.2)';ctx.beginPath();ctx.arc(0,0,R*1.22+4,0,TAU);ctx.stroke();
    ctx.globalAlpha=bl;ctx.strokeStyle='#ff8a4c';ctx.shadowColor='#ff5a2c';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(0,0,R*1.22+4,-Math.PI/2,-Math.PI/2+TAU*q);ctx.stroke();ctx.restore();}
  if(G2.novaT>0){const q=G2.novaT/V2K.nova.imm,w=G2.novaT<1?(Math.sin(clock*22)>0?1:.3):1;ctx.save();ctx.globalAlpha=w;ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(0,0,R,0,0,R*1.35);g.addColorStop(0,'rgba(143,233,255,.0)');g.addColorStop(.6,'rgba(143,233,255,.35)');g.addColorStop(1,'rgba(143,233,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*1.35,0,TAU);ctx.fill();
    ctx.lineWidth=2.5;ctx.strokeStyle='#bff6ff';ctx.beginPath();ctx.arc(0,0,R*1.3,-Math.PI/2,-Math.PI/2+TAU*q);ctx.stroke();ctx.restore();}
  if(G2.overT>0){ctx.strokeStyle=`rgba(201,168,255,${.35+.25*Math.sin(clock*9)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R*1.12+Math.sin(clock*11)*2,0,TAU);ctx.stroke();}
  if(G2.immT>0&&Math.sin(clock*40)>0){ctx.strokeStyle='rgba(255,90,80,.8)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,R*1.08,0,TAU);ctx.stroke();}
  if(G2.shrink){for(let i=0;i<2;i++){const q=((G2.shrinkFx*1.4+i*.5)%1);ctx.globalAlpha=.55*(1-q)*Math.min(1,G2.shrinkFx*3);ctx.strokeStyle='#c9b4ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R+(Gr-R)*(1-q),0,TAU);ctx.stroke();}
    ctx.globalAlpha=.5+.3*Math.sin(clock*16);ctx.strokeStyle='#b9a8ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,R*1.04,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  if(G2.pulse>0){ctx.globalAlpha=G2.pulse*.6;ctx.strokeStyle='#e6dcff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,R*(1.05+.25*(1-G2.pulse)),0,TAU);ctx.stroke();}
  ctx.restore();
}
const ROCKB={};
function v2RockImg(i){ // rock photos brightened once: dark rocks were hard to spot on the nebulae
  const im=sprImg('rocks',i);if(!im||!im.complete||!im.naturalWidth)return im;if(ROCKB[i])return ROCKB[i];
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');
  if('filter' in x){x.filter='brightness(1.6) contrast(1.08) saturate(1.1)';x.drawImage(im,0,0);}else{x.drawImage(im,0,0);x.globalCompositeOperation='lighter';x.globalAlpha=.45;x.drawImage(im,0,0);}
  return ROCKB[i]=c;}
function v2Rock(o,s,tint){
  const im=v2RockImg(o.si%6);const r=o.r*s;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);
  if(im){ctx.drawImage(im,-r*1.15,-r*1.15,r*2.3,r*2.3);}else{ctx.fillStyle='#8a8a86';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();}
  if(tint){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=tint;ctx.fillRect(-r*1.2,-r*1.2,r*2.4,r*2.4);}
  ctx.restore();
}
function v2DrawObj(o,gl){
  const s=o.st==='sw'?(o.sc??1):1,r=o.r*s;if(!(r>=.6))return;const k=o.k;
  if(o.wait>0){v2DrawWarn(o);return;}
  ctx.save();if(o.st==='sw')ctx.globalAlpha=Math.max(.15,s);
  if(k==='prey')v2DrawPrey(o,s);
  else if(k==='plasma'){ctx.save();ctx.translate(o.x,o.y);ctx.globalCompositeOperation='lighter';const c=o.pc||[255,140,50],g=ctx.createRadialGradient(0,0,0,0,0,r*1.9);
    g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(.3,`rgba(${c[0]},${c[1]},${c[2]},.95)`);g.addColorStop(1,`rgba(${c[0]},${c[1]},${c[2]},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*1.9*(1+.08*Math.sin(clock*9+o.si)),0,TAU);ctx.fill();ctx.restore();}
  else if(k==='ast'||k==='frag'){v2Rock(o,s);if(k==='frag'){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,150,70,.25)';ctx.beginPath();ctx.arc(o.x,o.y,r*1.1,0,TAU);ctx.fill();}}
  else if(k==='meteor'){v2MetPath(o);const sp=Math.hypot(o.vx,o.vy)||1,ux=o.vx/sp,uy=o.vy/sp;ctx.globalCompositeOperation='lighter';
    const tl=r*5.5,g=ctx.createLinearGradient(o.x,o.y,o.x-ux*tl,o.y-uy*tl);g.addColorStop(0,'rgba(255,150,60,.9)');g.addColorStop(.4,'rgba(255,70,40,.45)');g.addColorStop(1,'rgba(255,40,30,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(o.x-uy*r*.9,o.y+ux*r*.9);ctx.lineTo(o.x-ux*tl,o.y-uy*tl);ctx.lineTo(o.x+uy*r*.9,o.y-ux*r*.9);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='source-over';v2Rock(o,s,'rgba(255,90,40,.45)');
    ctx.strokeStyle=`rgba(255,80,60,${.55+.35*Math.sin(clock*14)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y,r*1.25,0,TAU);ctx.stroke();}
  else if(k==='crystal'){ctx.translate(o.x,o.y);ctx.rotate(o.rot*.5);const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#e8fdff');g.addColorStop(.45,'#5fd8ff');g.addColorStop(1,'#7a5cff');
    ctx.shadowColor='#6fe8ff';ctx.shadowBlur=14;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-r*1.25);ctx.lineTo(r*.95,-r*.25);ctx.lineTo(r*.55,r*1.1);ctx.lineTo(-r*.55,r*1.1);ctx.lineTo(-r*.95,-r*.25);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*.95,-r*.25);ctx.lineTo(r*.95,-r*.25);ctx.moveTo(0,-r*1.25);ctx.lineTo(-r*.3,-r*.25);ctx.lineTo(0,r*1.1);ctx.lineTo(r*.3,-r*.25);ctx.closePath();ctx.stroke();
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(200,250,255,${.5+.5*Math.sin(clock*6+o.si)})`;for(let i=0;i<4;i++){const a=i*Math.PI/2+clock;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*1.4,Math.sin(a)*r*1.4);ctx.lineTo(Math.cos(a)*r*2,Math.sin(a)*r*2);ctx.stroke();}}
  else if(k==='energy'){const pu=.8+.2*Math.sin(clock*9+o.si);ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r*2.4);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,120,220,.95)');g.addColorStop(1,'rgba(255,60,200,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,r*2.4*pu,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,170,240,.8)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(o.x,o.y,Math.max(.5,r*1.3+Math.sin(clock*5)*2*s),0,TAU);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font=`900 ${Math.round(r*1.2)}px "IBM Plex Sans Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⚡',o.x,o.y+1);}
  else if(k==='time'){ctx.translate(o.x,o.y); // hourglass in a slow time-wave: reads as "slow down" even when small
    ctx.globalCompositeOperation='lighter';for(let q=0;q<2;q++){const ph=((clock*.45+q*.5)%1);ctx.strokeStyle=`rgba(143,208,255,${.55*(1-ph)})`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r*(1.05+ph*1.1),0,TAU);ctx.stroke();}
    const hg=ctx.createRadialGradient(0,0,0,0,0,r*1.3);hg.addColorStop(0,'rgba(143,208,255,.45)');hg.addColorStop(1,'rgba(143,208,255,0)');ctx.fillStyle=hg;ctx.beginPath();ctx.arc(0,0,r*1.3,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';
    ctx.rotate(Math.sin(clock*1.3+o.si)*.18);const w=r*.62,h=r*.86;
    const glass=()=>{ctx.beginPath();ctx.moveTo(-w,-h);ctx.lineTo(w,-h);ctx.quadraticCurveTo(w,-h*.2,r*.1,0);ctx.quadraticCurveTo(w,h*.2,w,h);ctx.lineTo(-w,h);ctx.quadraticCurveTo(-w,h*.2,-r*.1,0);ctx.quadraticCurveTo(-w,-h*.2,-w,-h);ctx.closePath();};
    glass();ctx.fillStyle='rgba(200,236,255,.28)';ctx.fill();
    const f=(clock*.25+o.si*.1)%1;ctx.save();glass();ctx.clip();ctx.fillStyle='#ffd88a'; // sand: top drains, bottom fills
    ctx.fillRect(-w,-h*(1-f)*.85-h*.02,w*2,h*(1-f)*.85);ctx.fillRect(-w,h-h*f*.85,w*2,h*f*.85);ctx.fillRect(-r*.05,0,r*.1,h);ctx.restore();
    glass();ctx.lineWidth=Math.max(1.2,r*.1);ctx.strokeStyle='#dff4ff';ctx.shadowColor='#8fd0ff';ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#f2c46d';ctx.fillRect(-w*1.25,-h-r*.2,w*2.5,r*.22);ctx.fillRect(-w*1.25,h,w*2.5,r*.22);}
  else if(k==='bomb'){ctx.translate(o.x,o.y);ctx.rotate(o.rot);const g=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r);g.addColorStop(0,'#7a2a1c');g.addColorStop(.7,'#3a0d08');g.addColorStop(1,'#140404');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,${120+60*Math.sin(clock*10)|0},40,.9)`;ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(-r*.6,-r*.2);ctx.lineTo(-r*.1,r*.1);ctx.lineTo(r*.2,-r*.4);ctx.moveTo(-r*.1,r*.1);ctx.lineTo(r*.1,r*.6);ctx.moveTo(r*.2,-r*.4);ctx.lineTo(r*.65,-r*.1);ctx.stroke();
    ctx.strokeStyle=`rgba(255,110,50,${.4+.4*Math.sin(clock*12)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.3,0,TAU);ctx.stroke();
    if(o.orb){ctx.rotate(-o.rot);ctx.globalCompositeOperation='source-over';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.arc(0,0,r*1.75,0,TAU);ctx.stroke();
      ctx.strokeStyle='#ffd76a';ctx.shadowColor='#ff8a4c';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(0,0,r*1.75,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,o.orb.t/V2K.bomb.hold));ctx.stroke();
      ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font='900 13px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.max(1,Math.ceil(V2K.bomb.hold-o.orb.t)),0,-r*1.75-11);}}
  else if(k==='mini'){v2DrawMini({x:o.x,y:o.y,r,a:o.rot*3,t:9});}
  else if(k==='shard'){ctx.restore();v2DrawShard(o,s);return;}
  else if(k==='comet'){const sp=Math.hypot(o.vx,o.vy)||1,ux=o.vx/sp,uy=o.vy/sp,tl=r*9;ctx.globalCompositeOperation='lighter';
    const g=ctx.createLinearGradient(o.x,o.y,o.x-ux*tl,o.y-uy*tl);g.addColorStop(0,'rgba(210,250,255,.9)');g.addColorStop(.3,'rgba(120,200,255,.45)');g.addColorStop(1,'rgba(80,140,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(o.x-uy*r*.8,o.y+ux*r*.8);ctx.lineTo(o.x-ux*tl,o.y-uy*tl);ctx.lineTo(o.x+uy*r*.8,o.y-ux*r*.8);ctx.closePath();ctx.fill();
    const c=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r*1.6);c.addColorStop(0,'#fff');c.addColorStop(.4,'rgba(190,240,255,.9)');c.addColorStop(1,'rgba(120,200,255,0)');ctx.fillStyle=c;ctx.beginPath();ctx.arc(o.x,o.y,r*1.6,0,TAU);ctx.fill();}
  else if(k==='anti'){const pu=.75+.25*Math.sin(clock*7+o.si);ctx.translate(o.x,o.y);
    const g=ctx.createRadialGradient(0,0,r*.2,0,0,r*1.9);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.45,'rgba(20,60,40,.95)');g.addColorStop(.7,`rgba(125,255,176,${.55*pu})`);g.addColorStop(1,'rgba(125,255,176,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*1.9,0,TAU);ctx.fill();ctx.strokeStyle=`rgba(190,255,220,${.8*pu})`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
    ctx.rotate(clock*1.5);ctx.strokeStyle='rgba(125,255,176,.85)';ctx.lineWidth=1.2;for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.ellipse(0,0,r*.85,r*.32,0,0,TAU);ctx.stroke();}
    ctx.rotate(-clock*1.5);ctx.strokeStyle='#eafff2';ctx.lineWidth=Math.max(1.5,r*.18);ctx.beginPath();ctx.moveTo(-r*.35,0);ctx.lineTo(r*.35,0);ctx.stroke();}
  else if(k==='magnet'){ctx.translate(o.x,o.y);ctx.rotate(Math.sin(clock*1.2+o.si)*.35); // a horseshoe asteroid: reads as a magnet at a glance
    ctx.globalCompositeOperation='lighter';ctx.lineWidth=Math.max(1,r*.07);for(let q=0;q<3;q++){const ph=(clock*.8+q/3)%1;ctx.strokeStyle=`rgba(255,140,170,${.6*(1-ph)})`;ctx.beginPath();ctx.ellipse(0,r*.62,r*(.35+ph*.75),r*(.25+ph*.6),0,Math.PI*.05,Math.PI*.95);ctx.stroke();} // field lines from pole to pole
    ctx.globalCompositeOperation='source-over';const U=()=>{ctx.beginPath();ctx.arc(0,-r*.05,r*.62,Math.PI,0);ctx.lineTo(r*.62,r*.62);ctx.moveTo(-r*.62,-r*.05);ctx.lineTo(-r*.62,r*.62);};
    ctx.lineCap='butt';ctx.shadowColor='#ff4a5a';ctx.shadowBlur=12;U();ctx.lineWidth=r*.58;ctx.strokeStyle='#8e1f2a';ctx.stroke();ctx.shadowBlur=0;
    U();ctx.lineWidth=r*.42;const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#ff6b6b');g.addColorStop(.5,'#d9303d');g.addColorStop(1,'#8e1f2a');ctx.strokeStyle=g;ctx.stroke();
    ctx.fillStyle='rgba(60,8,14,.55)';for(const [cx,cy,cr] of [[-r*.55,-r*.2,.07],[r*.1,-r*.62,.06],[r*.58,r*.15,.05]]){ctx.beginPath();ctx.arc(cx,cy,r*cr,0,TAU);ctx.fill();} // craters
    ctx.fillStyle='#e8eef6';ctx.fillRect(-r*.91,r*.46,r*.58,r*.36);ctx.fillRect(r*.33,r*.46,r*.58,r*.36);ctx.fillStyle='rgba(120,135,150,.8)';ctx.fillRect(-r*.91,r*.72,r*.58,r*.1);ctx.fillRect(r*.33,r*.72,r*.58,r*.1);}
  else if(k==='pulsar'){ctx.translate(o.x,o.y);ctx.globalCompositeOperation='lighter';const lit=o.lit,k2=lit?1:.25;
    if(lit){ctx.rotate(clock*5);const bl=r*5.5;for(const sg of [1,-1]){const g=ctx.createLinearGradient(0,0,0,sg*bl);g.addColorStop(0,'rgba(200,235,255,.85)');g.addColorStop(1,'rgba(120,180,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-r*.35,0);ctx.lineTo(0,sg*bl);ctx.lineTo(r*.35,0);ctx.closePath();ctx.fill();}ctx.rotate(-clock*5);}
    const g=ctx.createRadialGradient(0,0,0,0,0,r*(lit?2.2:1.2));g.addColorStop(0,`rgba(255,255,255,${k2})`);g.addColorStop(.35,`rgba(170,215,255,${.8*k2})`);g.addColorStop(1,'rgba(120,170,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*(lit?2.2:1.2),0,TAU);ctx.fill();
    ctx.globalCompositeOperation='source-over';ctx.fillStyle=lit?'#fff':'#6c7890';ctx.beginPath();ctx.arc(0,0,r*.5,0,TAU);ctx.fill();}
  else if(k==='dark'){const d=Math.hypot(o.x-hX,o.y-hY);if(d<G2.G*1.3||o.st==='sw'){ctx.globalAlpha=(o.st==='sw'?.5:.3)*(.6+.4*Math.sin(clock*9));ctx.strokeStyle='#cbb8ff';ctx.lineWidth=1.2;ctx.setLineDash([2,5]);ctx.beginPath();ctx.arc(o.x,o.y,r*1.1,0,TAU);ctx.stroke();ctx.setLineDash([]);}}
  else if(!gl&&o.cell!==undefined){const im=SPR.byCell&&SPR.byCell[o.cell];if(im)ctx.drawImage(im,o.x-r,o.y-r,r*2,r*2);else{ctx.fillStyle='#9aa';ctx.beginPath();ctx.arc(o.x,o.y,r,0,TAU);ctx.fill();}}
  ctx.restore();
}
function v2MetPath(o){ // the lane a meteor will take: soft arrows that fade with distance, gone once it speeds up
  const a=o.wait>0?.5:o.slow>0?.55:Math.max(0,.55*(1-o.ramp/V2K.met.ramp));if(a<=.02)return;
  const sp=Math.hypot(o.fvx,o.fvy)||1,ux=o.fvx/sp,uy=o.fvy/sp,nx=-uy,ny=ux,r=o.r;ctx.save();
  ctx.lineCap='round';ctx.lineJoin='round';const n=5,gap=Math.max(34,r*2.6),s=Math.max(10,r*.85),lit=Math.floor(clock*7)%n;
  for(let i=0;i<n;i++){const d=r*2+i*gap,px=o.x+ux*d,py=o.y+uy*d;ctx.globalAlpha=Math.min(1,a*(i===lit?1.8:1.1)*(1-i*.16));ctx.strokeStyle=i===lit?'#ffd2a8':'#ff7a55';ctx.lineWidth=3.5;ctx.shadowColor='#ff5a3c';ctx.shadowBlur=12;
    ctx.beginPath();ctx.moveTo(px-ux*s+nx*s,py-uy*s+ny*s);ctx.lineTo(px,py);ctx.lineTo(px-ux*s-nx*s,py-uy*s-ny*s);ctx.stroke();}
  ctx.restore();}
function v2Heater(c,s){c.beginPath();c.moveTo(-s,-s*.95);c.quadraticCurveTo(0,-s*1.12,s,-s*.95);c.lineTo(s,-s*.1);c.bezierCurveTo(s,s*.65,s*.45,s*1.05,0,s*1.32);c.bezierCurveTo(-s*.45,s*1.05,-s,s*.65,-s,-s*.1);c.closePath();}
function v2ShCol(p){ // remaining share of the shield: gold, then orange, then red
  const G=[255,216,77],O=[255,140,30],Rd=[255,45,40],m=(x,y,k)=>x.map((v,i)=>Math.round(v+(y[i]-v)*clamp(k,0,1)));return p>=.6?G:p>=.3?m(G,O,(.6-p)/.3):m(O,Rd,(.3-p)/.15);}
function v2DrawShield(){
  if(G2.shT<=0)return;const p=G2.shT/V2K.shield.dur,[r,g,b]=v2ShCol(p),C=`rgb(${r},${g},${b})`,warn=G2.shT<2.5,k=warn?1+.06*Math.sin(clock*18):1,R=G2.R,B=R*1.5*k;
  ctx.save();ctx.translate(hX,hY);
  const bg=ctx.createRadialGradient(0,0,R*1.05,0,0,B);bg.addColorStop(0,`rgba(${r},${g},${b},0)`);bg.addColorStop(.8,`rgba(${r},${g},${b},${warn?.2:.12})`);bg.addColorStop(1,`rgba(${r},${g},${b},${warn?.45:.3})`);
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,B,0,TAU);ctx.fill();ctx.shadowColor=C;ctx.shadowBlur=warn?24:14;ctx.strokeStyle=C;ctx.lineWidth=warn?4:3;ctx.beginPath();ctx.arc(0,0,B,0,TAU);ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,B+6,-Math.PI/2,-Math.PI/2+TAU*p);ctx.stroke();
  // the crest, see-through, over the black core
  const s=R*.62;ctx.translate(0,-R*.06);v2Heater(ctx,s);const gg=ctx.createLinearGradient(-s,-s,s,s*1.3);gg.addColorStop(0,'rgba(255,247,207,.5)');gg.addColorStop(.5,`rgba(${r},${g},${b},.32)`);gg.addColorStop(1,`rgba(${r},${g},${b},.1)`);
  ctx.fillStyle=gg;ctx.fill();ctx.lineWidth=Math.max(1.5,s*.08);ctx.strokeStyle=`rgba(${r},${g},${b},.95)`;ctx.shadowColor=C;ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;
  ctx.save();ctx.scale(.8,.8);v2Heater(ctx,s);ctx.lineWidth=1.2;ctx.strokeStyle='rgba(255,250,225,.55)';ctx.stroke();ctx.restore();
  ctx.strokeStyle=`rgba(${r},${g},${b},.9)`;ctx.lineWidth=Math.max(1,s*.06);ctx.beginPath();ctx.ellipse(0,-s*.05,s*.42,s*.13,-.35,0,TAU);ctx.stroke();
  ctx.restore();
}
function v2DrawMono(){ // Cosmic ID: the name inside the core; first letter at the start, the rest open as the hole grows (11 max)
  if(!SHOP.cid||!SKIN.monoOn||G2.shT>0)return;const txt=monoText();if(!txt)return;const L=[...txt],sz=v2Size();let n=G2.monoN||1;
  const stp=(V2K.rMax/V2K.r0-1.1)/(Math.max(7,L.length)-1);while(n<L.length&&sz>=1+n*stp)n++;while(n>1&&sz<1+(n-1)*stp-.06)n--; // every letter by the largest size; a little slack against flicker
  if(n!==G2.monoN){G2.monoN=n;G2.monoT=0;}G2.monoT=Math.min(1,(G2.monoT||0)+1/30);
  ctx.save();ctx.globalAlpha=.55+.45*G2.monoT;monoDraw(ctx,hX,hY,G2.R,L.slice(0,n).join(''),SKIN_TINT[SKIN.sel],clock);ctx.restore();}
function v2DrawShard(o,sc){ // a golden third of the crest, glinting
  const s=o.r*sc;if(s<.6)return;ctx.save();ctx.translate(o.x,o.y);ctx.globalCompositeOperation='lighter';const gl=ctx.createRadialGradient(0,0,s*.3,0,0,s*2.2);gl.addColorStop(0,'rgba(255,210,90,.4)');gl.addColorStop(1,'rgba(255,200,60,0)');
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,s*2.2,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';ctx.rotate(o.rot*.4);ctx.translate(s*.5,0);
  ctx.save();ctx.beginPath();ctx.moveTo(-s*1.6,-s*1.6);ctx.lineTo(-s*.05,-s*1.6);ctx.lineTo(s*.12,-s*.75);ctx.lineTo(-s*.18,-s*.3);ctx.lineTo(s*.1,s*.15);ctx.lineTo(-s*.12,s*.6);ctx.lineTo(s*.02,s*1.6);ctx.lineTo(-s*1.6,s*1.6);ctx.closePath();ctx.clip();
  v2Heater(ctx,s);const g=ctx.createLinearGradient(-s,-s*1.1,s,s*1.3);g.addColorStop(0,'#fff7cf');g.addColorStop(.3,'#ffd84d');g.addColorStop(.62,'#e3a11c');g.addColorStop(1,'#7c4a07');ctx.fillStyle=g;ctx.fill();ctx.lineWidth=s*.13;ctx.strokeStyle='#6d4207';ctx.stroke();ctx.restore();
  ctx.strokeStyle=`rgba(255,250,220,${.6+.4*Math.sin(clock*6)})`;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-s*.05,-s*1.1);ctx.lineTo(s*.12,-s*.75);ctx.lineTo(-s*.18,-s*.3);ctx.lineTo(s*.1,s*.15);ctx.lineTo(-s*.12,s*.6);ctx.lineTo(-s*.02,s*1.1);ctx.stroke();ctx.restore();
}
function v2DrawRule(){const r=G2.rule;if(!r||gState==='menu'||G2.ending)return;const y=sp2(20);ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  let txt=r.ic+' '+T(r.n);if(r.hunt)txt=`🎯 ${T('AV')} ${G2.hunt.n}/${G2.hunt.need}`;ctx.font='800 12px "IBM Plex Sans Condensed",sans-serif';
  const w=ctx.measureText(txt).width+22,out=v2WinOut();ctx.fillStyle='rgba(10,12,18,.72)';ctx.strokeStyle=r.ban?'rgba(255,90,74,.8)':r.win?(out?'rgba(255,120,100,.9)':'rgba(141,255,203,.8)'):'rgba(255,215,106,.85)';ctx.lineWidth=1.5;
  const x0=W/2-w/2;ctx.beginPath();ctx.roundRect(x0,y-11,w,22,11);ctx.fill();ctx.stroke();ctx.fillStyle='#e8ebf4';ctx.fillText(txt,W/2,y+1);
  if(r.win){const bw=Math.min(W*.6,sp2(220)),bx=W/2-bw/2,by=y+19,s0=1,s1=Math.max(r.hi+.6,2.6),X=s=>bx+bw*clamp((s-s0)/(s1-s0),0,1),s=G2.rr/V2K.r0; // the size bar: green = scoring range
    ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(bx,by,bw,6);ctx.fillStyle=out?'rgba(141,255,203,.45)':'rgba(141,255,203,.85)';ctx.fillRect(X(r.lo),by,X(r.hi)-X(r.lo),6);
    const mx=X(s);ctx.fillStyle=out?(Math.sin(clock*14)>0?'#ff6a5a':'#ffd0c8'):'#ffffff';ctx.beginPath();ctx.moveTo(mx,by-3);ctx.lineTo(mx-5,by-9);ctx.lineTo(mx+5,by-9);ctx.closePath();ctx.fill();ctx.fillRect(mx-1,by-2,2,10);
    if(out){ctx.font='800 11px "IBM Plex Sans Condensed",sans-serif';ctx.fillStyle='#ff9a8a';ctx.fillText(out>0?T('ÇOK BÜYÜK: yavaş ye'):T('ÇOK KÜÇÜK: büyü'),W/2,by+19);}}
  ctx.restore();}
function v2DrawMarks(){ // what can be eaten: pull lines and too-big warnings
  if(gState!=='playing'&&gState!=='tip')return;const Gr=G2.G;ctx.save();
  for(const o of G2.objs){if(o.st!=='in'||o.wait>0||o.k==='meteor'||o.orb)continue;const d=Math.hypot(o.x-hX,o.y-hY);
    if(o.k==='anti'){if(d<Gr*1.6){ctx.globalAlpha=.6+.4*Math.sin(clock*12);ctx.strokeStyle='#7dffb0';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(o.x,o.y,o.r*1.6+3,0,TAU);ctx.stroke();ctx.setLineDash([]);}continue;}
    if(v2Banned(o)){{ctx.globalAlpha=(d<Gr*1.8?.7:.4)+.3*Math.sin(clock*9);ctx.strokeStyle='#ff5a4a';ctx.lineWidth=2.5;const rr=o.r*1.3+3;ctx.beginPath();ctx.arc(o.x,o.y,rr,0,TAU);ctx.moveTo(o.x-rr*.7,o.y-rr*.7);ctx.lineTo(o.x+rr*.7,o.y+rr*.7);ctx.stroke();}continue;} // forbidden: red no-entry mark
    if(v2Edible(o)){if(d<Gr){const k=1-d/Gr;ctx.globalAlpha=.18+.4*k;ctx.strokeStyle='#e6ecff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(hX+(o.x-hX)/d*G2.R,hY+(o.y-hY)/d*G2.R);ctx.stroke();}}
    else if(o.k==='split'||o.k==='pulsar'){}
    else if(d<Gr*1.5){ctx.globalAlpha=.85;ctx.strokeStyle='#ff6a5a';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(o.x,o.y,o.r*1.25+3,0,TAU);ctx.stroke();ctx.setLineDash([]);}}
  ctx.restore();
}
function v2DrawLinks(){ // bomb tether (turns red as the drag pulls it loose) and helper beams
  const b=G2.hold;if(b&&b.orb){const t=Math.min(1,b.orb.lag);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5+.4*t;
    ctx.strokeStyle=`rgb(255,${200-150*t|0},${80-60*t|0})`;ctx.lineWidth=2+3*t;ctx.setLineDash([6,5]);ctx.lineDashOffset=clock*40;ctx.beginPath();ctx.moveTo(hX,hY);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
  if(G2.beams.length){ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(const m of G2.beams){const p=m.t/.25,x=m.x+(hX-m.x)*p,y=m.y+(hY-m.y)*p,x0=m.x+(hX-m.x)*Math.max(0,p-.35),y0=m.y+(hY-m.y)*Math.max(0,p-.35);
      ctx.strokeStyle='rgba(201,168,255,.85)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();}
    ctx.restore();}
}
function v2DrawTipMark(){ // points at what the open tip card is about
  const t=G2.tip;if(!t||t.id==='rage'||t.id==='shield'||t.id==='buy')return;const o=t.tg,x=o?o.x:hX,y=o?o.y:hY,r=(o?o.r:G2.R)*1.5+sp2(10)+4*Math.sin(clock*6);
  ctx.save();ctx.strokeStyle='#ffd76a';ctx.lineWidth=3;ctx.shadowColor='#ffb35c';ctx.shadowBlur=14;ctx.setLineDash([8,6]);ctx.lineDashOffset=-clock*30;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}
function v2DrawSat(o){const a=o.sa,d=o.r*1.9,x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d,r=Math.max(2,o.r*.34);ctx.save();
  ctx.strokeStyle='rgba(200,210,240,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(o.x,o.y,d,0,TAU);ctx.stroke();
  const g=ctx.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);g.addColorStop(0,'#f2f2ee');g.addColorStop(1,'#6f7078');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function v2DrawCracks(o){ctx.save();ctx.translate(o.x,o.y);ctx.globalCompositeOperation='lighter';const r=o.r,k=.7+.3*Math.sin(clock*6);
  if(o.k==='half'){ctx.rotate(o.cut||0);ctx.strokeStyle=`rgba(160,245,255,${.9*k})`;ctx.shadowColor='#6fe8ff';ctx.shadowBlur=10;ctx.lineWidth=Math.max(1.5,r*.12);ctx.beginPath();ctx.moveTo(-r*.95,0);ctx.lineTo(-r*.3,r*.08);ctx.lineTo(r*.2,-r*.06);ctx.lineTo(r*.95,0);ctx.stroke();ctx.restore();return;} // the fresh fracture face
  ctx.rotate(o.rot*.3);ctx.strokeStyle=`rgba(150,240,255,${.85*k})`;ctx.shadowColor='#6fe8ff';ctx.shadowBlur=8;ctx.lineWidth=Math.max(1.2,r*.07);
  ctx.beginPath();ctx.moveTo(-r*.8,-r*.2);ctx.lineTo(-r*.2,r*.05);ctx.lineTo(r*.15,-r*.45);ctx.moveTo(-r*.2,r*.05);ctx.lineTo(0,r*.75);ctx.moveTo(r*.15,-r*.45);ctx.lineTo(r*.75,-r*.1);ctx.stroke();ctx.restore();}
function v2DrawWorms(){for(const w of G2.worms){const a=Math.min(1,w.t/.4,(w.life-w.t)/.6);ctx.save();ctx.globalAlpha=a*.35;ctx.strokeStyle='#b9a8ff';ctx.lineWidth=1.2;ctx.setLineDash([3,8]);ctx.lineDashOffset=-clock*30;
  ctx.beginPath();ctx.moveTo(w.ax,w.ay);ctx.quadraticCurveTo((w.ax+w.bx)/2+W*.25,(w.ay+w.by)/2,w.bx,w.by);ctx.stroke();ctx.setLineDash([]);
  for(const [x,y,c,dir] of [[w.ax,w.ay,'255,160,70',1],[w.bx,w.by,'120,200,255',-1]]){ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(x,y,0,x,y,w.r*1.6);g.addColorStop(0,`rgba(${c},.05)`);g.addColorStop(.6,`rgba(${c},.35)`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,w.r*1.6,0,TAU);ctx.fill();
    ctx.strokeStyle=`rgb(${c})`;ctx.lineWidth=2.2;for(let i=0;i<3;i++){const s=clock*2.4*dir+i*2.1;ctx.beginPath();ctx.arc(x,y,w.r*(.55+i*.2),s,s+2.2);ctx.stroke();}
    ctx.globalCompositeOperation='source-over';ctx.fillStyle='#05060a';ctx.beginPath();ctx.arc(x,y,w.r*.38,0,TAU);ctx.fill();}ctx.restore();}}
function v2DrawGold(o){ctx.save();ctx.globalCompositeOperation='lighter';const r=o.r,g=ctx.createRadialGradient(o.x,o.y,r*.7,o.x,o.y,r*1.8);g.addColorStop(0,'rgba(255,215,106,.55)');g.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,r*1.8,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,220,120,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(o.x,o.y,r+2,0,TAU);ctx.stroke();ctx.strokeStyle='#ffe7a0';ctx.lineWidth=1.2;for(let i=0;i<3;i++){const a=clock*1.3+i*2.1;ctx.beginPath();ctx.arc(o.x+Math.cos(a)*r*1.3,o.y+Math.sin(a)*r*1.3,1.6,0,TAU);ctx.stroke();}ctx.restore();}
function v2DrawMini(q){const r=Math.max(1,q.r);ctx.save();ctx.translate(q.x,q.y);const al=Math.min(1,q.t);ctx.globalAlpha=al;ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(0,0,r*.8,0,0,r*2.6);g.addColorStop(0,'rgba(190,150,255,.55)');g.addColorStop(1,'rgba(120,80,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*2.6,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(220,200,255,.8)';ctx.lineWidth=1.4;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r*(1.15+i*.28),q.a+i*2,q.a+i*2+2.2);ctx.stroke();}
  ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.restore();}
function v2DrawWarn(o){ // meteor about to enter: a red marker where it will come in
  if(o.k==='meteor')v2MetPath(o);
  const x=clamp(o.x,14,W-14),y=clamp(o.y,14,H-14),pu=.55+.45*Math.sin(clock*18);ctx.save();ctx.translate(x,y);
  const a=Math.atan2(o.vy,o.vx);ctx.globalAlpha=pu;ctx.fillStyle='#ff5a45';ctx.beginPath();ctx.moveTo(Math.cos(a)*14,Math.sin(a)*14);ctx.lineTo(Math.cos(a+2.5)*9,Math.sin(a+2.5)*9);ctx.lineTo(Math.cos(a-2.5)*9,Math.sin(a-2.5)*9);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.font='900 11px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,1);ctx.restore();}
function v2DrawStar(b){ // red giant / supernova: layered textures, turning surface, glow and rays
  const k=b.gs??1,R=b.r*k,al=b.fade??1;if(R<1)return;ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha=al;
  const red=b.bt==='red',gc=red?'255,110,40':'170,220,255',hot=red?(b.br-1)/.12*.5+.5:(b.flash||0);
  ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(0,0,R*.6,0,0,R*(2.3+.5*hot));g.addColorStop(0,`rgba(${gc},${.45+.25*hot})`);g.addColorStop(1,`rgba(${gc},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*(2.3+.5*hot),0,TAU);ctx.fill();
  if(!red){const rays=v2BossImg('bossRays');if(rays){ctx.save();ctx.rotate(b.age*.12);const s=R/.72*(1.05+.35*(b.flash||0)+.04*Math.sin(clock*3));ctx.globalAlpha=al*(.8+.2*Math.sin(clock*2.3));ctx.drawImage(rays,-s,-s,s*2,s*2);ctx.restore();}}
  ctx.globalCompositeOperation='source-over';const im=v2BossImg(red?'bossRG':'bossSN');
  if(im){ctx.save();ctx.rotate(b.age*(red?.05:-.07));const s=R/(red?.86:.72);ctx.drawImage(im,-s,-s,s*2,s*2);ctx.restore();}
  else{ctx.fillStyle=red?'#ff8a3c':'#fff4d8';ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();}
  if(!red&&b.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al*b.flash*b.flash*.7;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,R*1.05,0,TAU);ctx.fill();}
  ctx.restore();}
function v2DrawBoss(b,gl){
  v2DrawRad(b);
  if(b.bt&&b.bt!=='planet')v2DrawStar(b);
  v2DrawRadSign(b);
  ctx.save();if(!gl&&b.cell!==undefined){const im=SPR.byCell&&SPR.byCell[b.cell];if(im)ctx.drawImage(im,b.x-b.r,b.y-b.r,b.r*2,b.r*2);}
  if(b.sw)return ctx.restore();
  const N=Math.min(24,b.max),per=b.max/N,on=b.edible?N:Math.ceil(b.hp/per-1e-6),Rr=b.r+10,gap=.06,seg=TAU/N; // segmented health ring: one slice per chunk of health
  ctx.lineCap='butt';for(let i=0;i<N;i++){const a0=-Math.PI/2+i*seg+gap/2,a1=a0+seg-gap;ctx.lineWidth=6;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.arc(b.x,b.y,Rr,a0,a1);ctx.stroke();
    if(i<on){const lo=b.hp/b.max;ctx.lineWidth=4;ctx.strokeStyle=b.edible?`rgba(141,255,203,${.6+.4*Math.sin(clock*10)})`:lo>.5?'#ffb35c':lo>.25?'#ff8a4c':'#ff5a4a';ctx.beginPath();ctx.arc(b.x,b.y,Rr,a0,a1);ctx.stroke();}}
  for(const c of b.chips){const q=c.t/.7,d=Rr+q*40*c.v;ctx.globalAlpha=1-q;ctx.strokeStyle='#fff3c4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.x,b.y,d,c.a-.07,c.a+.07);ctx.stroke();}ctx.globalAlpha=1; // broken slices fly off
  if(!b.edible)for(const s of b.spots)v2DrawSpot(b,s);
  if(b.hitFx>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=b.hitFx*.5;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  ctx.font='900 12px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.7)';const lbl=b.edible?'SWALLOW!':BOSS2[b.bt||'planet'].n+' · '+b.hp;
  ctx.strokeText(lbl,b.x,b.y-Rr-10);ctx.fillStyle=b.edible?'#8dffcb':'#ffcf8a';ctx.fillText(lbl,b.x,b.y-Rr-10);
  ctx.restore();
}
function v2DrawSpot(b,s){ // a glowing crack with a pulsing target ring around it
  const P=v2SpotPos(b,s),sr=v2SpotR(b),in_=Math.min(1,s.t/.35),pu=.5+.5*Math.sin(clock*8),col=b.bt==='red'?[255,230,150]:b.bt==='nova'?[190,245,255]:[255,190,90];
  ctx.save();ctx.translate(P.x,P.y);ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(0,0,0,0,0,sr*1.8);
  g.addColorStop(0,`rgba(255,255,240,${.95*in_})`);g.addColorStop(.35,`rgba(${col},${.7*in_})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,sr*1.8*(1+.15*pu),0,TAU);ctx.fill();
  ctx.rotate(P.a+Math.PI);ctx.strokeStyle=`rgba(255,250,225,${.9*in_})`;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round'; // jagged cracks running into the body
  for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(0,0);let x=0,y=0;for(let j=1;j<=3;j++){x=j*sr*.55;y=k*sr*.35*j/3+((j%2)?1:-1)*sr*.18;ctx.lineTo(x,y);}ctx.stroke();}
  ctx.globalCompositeOperation='source-over';ctx.rotate(-(P.a+Math.PI));ctx.globalAlpha=in_*(.55+.45*pu);ctx.strokeStyle=`rgb(${col})`;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.lineDashOffset=-clock*20;
  ctx.beginPath();ctx.arc(0,0,sr*(1.6+.25*pu),0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
function v2DrawCalls(){
  for(const c of G2.calls){const age=c.max-c.life,a=Math.min(1,c.life/.25,age/.08),sc=age<.12?.7+age/.12*.3+.15*Math.sin(age/.12*Math.PI):1;
    const y=c.top?H*.3:Math.max(H*.14,hY-G2.G-sp2(40));ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,y);ctx.scale(sc,sc);ctx.textAlign='center';
    ctx.font=`900 ${c.top?28:22}px "IBM Plex Sans Condensed",sans-serif`;ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.strokeText(c.txt,0,0);ctx.shadowColor=c.col;ctx.shadowBlur=18;ctx.fillStyle=c.col;ctx.fillText(c.txt,0,0);
    if(c.sub){ctx.shadowBlur=0;ctx.font='800 12px "IBM Plex Sans Condensed",sans-serif';ctx.lineWidth=3;ctx.strokeText(c.sub,0,20);ctx.fillStyle='#e7e3da';ctx.fillText(c.sub,0,20);}ctx.restore();}
  if(G2.ready&&gState==='playing'){const pu=.6+.4*Math.sin(clock*8);ctx.save();ctx.textAlign='center';ctx.globalAlpha=.8+.2*pu;ctx.font='900 20px "IBM Plex Sans Condensed",sans-serif';
    ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.6)';const y=Math.min(H-40,hY+G2.G+sp2(40));ctx.strokeText('TAP → RAGE',W/2,y);ctx.fillStyle=`rgb(255,${110+60*pu|0},70)`;ctx.shadowColor='#ff6a3d';ctx.shadowBlur=16;ctx.fillText('TAP → RAGE',W/2,y);ctx.restore();}
}
function v2DrawTut(){ // level 1: a ghost finger drags the hole until the player touches
  if(G2.tut<=0)return;const a=Math.min(1,G2.tut);const fx=hX,fy=hY+v2Off();ctx.save();ctx.globalAlpha=a*.9;
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(fx,fy,22+4*Math.sin(clock*6),0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(fx,fy,10,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(W/2-W*.22,fy+34);ctx.lineTo(W/2+W*.22,fy+34);ctx.stroke();ctx.setLineDash([]);
  ctx.font='900 26px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.strokeText('DRAG',W/2,fy+70);ctx.fillStyle='#fff';ctx.fillText('DRAG',W/2,fy+70);
  ctx.font='700 18px "IBM Plex Sans Condensed",sans-serif';ctx.fillText('←   →',W/2,fy+95);ctx.restore();
}

// ── HUD ───────────────────────────────────────────────
function v2Hud(){
  if(G2.hud.done)return;G2.hud.done=true;
  const sb=$('scoreBox');const rb=document.createElement('div');rb.id='rage2';rb.innerHTML='<span class="l notr">RAGE</span><div class="bar"><i></i></div>';sb.appendChild(rb);
  const tm=document.createElement('div');tm.id='tmr2';tm.className='notr';tm.innerHTML='<span>⏱</span><b id="tmr2v">60</b>';$('hdr').insertBefore(tm,$('pauseBtn'));
  const hb=(id,ic,fn)=>{const b=document.createElement('button');b.id=id;b.className='hb2';b.innerHTML=`<span class="ic">${ic}</span><b></b>`;$('hdr').insertBefore(b,$('pauseBtn'));
    b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn();});b.addEventListener('click',e=>e.stopPropagation());return b;};
  hb('shTop','🛡',v2Shield);hb('diaTop','💎',()=>{if(G2.on&&gState==='playing')v2Nova();});
  rb.addEventListener('pointerdown',e=>{e.preventDefault();if(G2.on&&gState==='playing')v2Tap();});
}
function v2Ui(force){
  const h=G2.hud,sb=$('shTop');
  if(sb){const inc=SHOP.shield>0&&G2.shT<=0&&G2.rageT<=0&&G2.objs.some(o=>o.k==='meteor'&&o.st==='in'&&(o.wait>0||o.slow>0));
    const c='hb2'+(gameMode==='sprint'?' off':G2.shT>0?' on':SHOP.shield>0?(G2.rageT>0?'':' ready'):' empty')+(inc?' pulse':'')+(sb.classList.contains('hl')?' hl':'');
    if(sb.className!==c)sb.className=c;const n=String(SHOP.shield);if(sb._n!==n){sb._n=n;sb.querySelector('b').textContent=n;}
    sb.style.setProperty('--p',G2.shT>0?(G2.shT/V2K.shield.dur).toFixed(3):0);}
  const db=$('diaTop');if(db){const nv=V2K.nova,c='hb2 dia'+(gameMode==='sprint'?' off':G2.novaT>0?' on':diamonds>=nv.cost&&(G2.novaN||0)<nv.max?' ready':' empty'),n=String(diamonds);
    if(db.className!==c)db.className=c;if(db._n!==n){db._n=n;db.querySelector('b').textContent=n;}}const rg=Math.round(G2.rage),rd=G2.ready,rt=G2.rageT>0;
  if(force||h.rg!==rg||h.rd!==rd||h.rt!==rt){h.rg=rg;h.rd=rd;h.rt=rt;const rb=$('rage2');if(rb){rb.querySelector('i').style.width=rg+'%';rb.className=rt?'on':rd?'ready':'';}}
  const left=G2.mode==='surv'?Math.floor(survTime):Math.max(0,Math.ceil((G2.mode==='sprint'?SPR_RUN.dur-SPR_RUN.t:G2.dur-(G2.script?G2.st:G2.t))));
  {const tp=$('tmr2'),showT=G2.mode==='sprint'||!!G2.L.boss&&G2.mode==='level';if(tp&&tp.hidden!==!showT)tp.hidden=!showT; // the clock only matters in timed runs and boss fights
  if(force||h.left!==left){h.left=left;const v=$('tmr2v');if(v)v.textContent=left;if(G2.mode==='sprint')$('lvVal').textContent=left;if(tp)tp.classList.toggle('low',G2.mode==='level'&&left<=10);}
  const pct=G2.hunt?G2.hunt.n/G2.hunt.need*100:G2.mode==='surv'?(survTime%30)/30*100:G2.mode==='sprint'?SPR_RUN.t/SPR_RUN.dur*100:G2.goal?levelScore/G2.goal*100:G2.boss?(1-G2.boss.hp/G2.boss.max)*100:0;if(h.pct!==Math.round(pct*4)){h.pct=Math.round(pct*4);$('pb').style.width=Math.min(100,pct)+'%';}}
  {const sc=G2.hunt?-1-G2.hunt.n:G2.mode==='level'?levelScore:totalScore;if(force||h.sc!==sc||h.gl!==G2.goal){h.sc=sc;h.gl=G2.goal;$('scVal').innerHTML=G2.hunt?`🎯 ${G2.hunt.n}<small class="gl">/${G2.hunt.need}</small>`:G2.goal?`${Math.min(sc,G2.goal).toLocaleString(LOC)}<small class="gl">/${G2.goal.toLocaleString(LOC)}</small>`:sc.toLocaleString(LOC);}}
  const m=MULT2(G2.combo),ck=G2.combo+'|'+m;
  if(force||h.ck!==ck){h.ck=ck;const el=$('combo');if(G2.combo>=2){el.innerHTML=`<b>COMBO ×${m}</b><span>${G2.combo}</span>`;el.style.opacity='1';el.style.color=m>=5?'#ff8a5c':m>=3?'#ffcf8a':'#e7e3da';}else el.style.opacity='0';}
  const ct=$('combo');if(ct&&G2.combo>=2)ct.style.setProperty('--ct',Math.max(0,G2.comboT/G2.L.comboT).toFixed(2));
  if(!G2.ready&&G2.rage>=100&&G2.rageT<=0&&gState==='playing'){G2.ready=true;G2.readyT=0;v2Call('RAGE READY','TAP ANYWHERE','#ff8a4c',1.4);sfx('bell',{vol:.7,rate:.8});vib(30);}
}
