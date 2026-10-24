// New fleet missions (developer preview, ?dev&fm=<id>): Diet, Planet Guardian, Bomb Disposal. They are kept out of BHS_FMIS.L for now:
// the day's pick and the server read that list, so these join it with the release that brings their rules, targets and translations.
// targets (24 Oct) from the recorder's bot, two runs each: the diet 19 and 60 (both over the limit early), the planet (Orbit Keeper) 75 and 79 rocks,
// the bombs 81 and 80 (7 blasts each); gold is about the bot's best, to be tuned with real play as the first missions were
const FMX=[
  {id:'diet',lv:0,ic:'🥗',n:'DİYET',d:'Bu kez büyüme! Küçük cisimleri yut, boyut sınırını geçme. Antimadde dost: yutunca küçültür.',dur:60,m:'caught',tg:[20,40,60],max:400,diet:1.55,anti:1,bodies:1,kit:{sh:1,nova:0,rage:0},x:1},
  {id:'guard',lv:1,ic:'🌍',n:'GEZEGEN KORUYUCUSU',d:'Kara delik gezegenin yörüngesine kilitli: parmağını kaydır, çember üzerinde döner. Gezegene gelen kayaların yolunu kes, her kaya +1. Gezegen yıkılırsa bir can gider.',orbit:1,dur:90,m:'guard',tg:[25,50,75],max:250,kit:{sh:2,nova:1,rage:1},x:1},
  {id:'bomb',lv:2,ic:'💣',n:'BOMBA İMHASI',d:'Geri sayımlı bombalar beliriyor. Patlamadan önce yut! Her patlama bir yay kırar; kalkan korur.',dur:90,m:'bomb',tg:[27,55,80],max:200,bombs:1,kit:{sh:2,nova:0,rage:0},x:1}];
let FX=null; // the running mission's own state
function fmxPlay(id){const m=FMX.find(x=>x.id===id);if(!DEV||!m)return;fmClose();hideModals();startSprint((Date.now()%1e6)^0x77,{fm:m,fmDay:'dev'});}
// called at the end of fmSetup, so the mission's kit is in place
function fmxSetup(){const m=FMRUN.m;FX={bombs:[],booms:[],next:1.2,warn:0};const w=G2.L.w;
  if(m.bombs){w.meteor=0;w.bomb=0;G2.L.metIv=0;w.planet=(w.planet||0)*.5;G2.cap=V2K.r0*1.6;G2.L.overload=false;} /* a hole kept small: the bombs have to be reached, not just swallowed by a giant */
  if(m.m==='guard'&&G2.guard){const g=G2.guard;g.dur=g.t=m.dur+3;g.dmg=20;w.meteor=0;
    if(m.orbit){G2.orb={cy:H*.45,R:Math.min(W*.33,H*.2),a:Math.PI/2,a0:0};G2.cap=V2K.r0*1.8;G2.L.overload=false;hX=W/2;hY=G2.orb.cy+G2.orb.R;G2.tx=hX;G2.ty=hY;}} /* 24 Oct: the Orbit Keeper: the hole rides a ring round the planet */ /* the clock runs out on the mission, not on the defence; meteors become rocks anyway */
  if(m.diet){w.planet=(w.planet||0)*1.4;w.mini=0;G2.growK=.45;} /* a few more planets (the trap), and every body grows the hole half as much as usual, so 60 s of eating is a real choice */}
const fmxLim=()=>V2K.r0*FMRUN.m.diet;
function fmxStep(dt){const m=FMRUN.m,S=G2.S;if(G2.ending||gState!=='playing')return;
  if(G2.orb&&G2.guard){const o=G2.orb,cx=W/2,cy=o.cy,a=Math.atan2(G2.ty-cy,G2.tx-cx); /* the finger's travel moves a point; its angle round the planet is where the hole goes, and the point goes back on the ring so it never drifts */
    G2.tx=cx+Math.cos(a)*o.R;G2.ty=cy+Math.sin(a)*o.R;if(DRAG.id!==null){DRAG.ax=G2.tx;DRAG.ay=G2.ty;}
    let d=(a-o.a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;o.v=d;o.a+=d*Math.min(1,dt*16);hX=cx+Math.cos(o.a)*o.R;hY=cy+Math.sin(o.a)*o.R;}
  if(m.diet){const lim=fmxLim(),q=(G2.rr-V2K.r0)/(lim-V2K.r0);if(q>.82&&!FX.warn){FX.warn=1;v2Pop(T('SINIRA YAKLAŞTIN'),'#ff8a7a',16);v2Sfx('tickHi',{vol:.5,rate:.7});}else if(q<.6)FX.warn=0;
    if(G2.rr>lim){v2Burst(hX,hY,40,'#ff5a4a',2,8,.8,2.4);v2Fail(T('BOYUT SINIRI AŞILDI'));}}
  if(m.bombs){const p=Math.min(1,SPR_RUN.t/m.dur);FX.next-=dt;
    if(FX.next<=0){FX.next=(1.35-.6*p)*rrnd(.85,1.15);const r=sp2(21);let x,y,k=0;do{x=rrnd(sp2(40),W-sp2(40));y=rrnd(sp2(120),H-sp2(160));k++;}while(k<12&&Math.hypot(x-hX,y-hY)<sp2(110));
      FX.bombs.push({x,y,r,t:0,fuse:(3.4-1*p)*rrnd(.95,1.08)});v2Sfx('tickHi',{vol:.25,rate:1.6});}
    for(let i=FX.bombs.length-1;i>=0;i--){const b=FX.bombs[i];b.t+=dt;
      if(Math.hypot(b.x-hX,b.y-hY)<G2.R+b.r*.5&&!(G2.antiT>0)){FX.bombs.splice(i,1);fmAdd('bomb',1);v2Burst(b.x,b.y,18,'#7dff8a',1.5,5,.5,1.8);v2Sfx('bell',{vol:.4,rate:1.2+.02*(FMRUN.v%10)});v2Pop('+1','#7dff8a',15);continue;}
      if(b.t>=b.fuse){FX.bombs.splice(i,1);FX.booms.push({x:b.x,y:b.y,t:0,R:sp2(95)});shake=Math.max(shake,7);v2Sfx('boom',{vol:.5,rate:1.1});
        if(G2.shT>0){v2Pop(T('KALKAN KORUDU'),'#9fe8ff',15);}else{G2.hitWhy='bomb';v2Hit({x:b.x,y:b.y,k:'bomb'},false);G2.hitWhy=null;}}}
    for(let i=FX.booms.length-1;i>=0;i--){const e=FX.booms[i];e.t+=dt;if(e.t>.6)FX.booms.splice(i,1);}}}
function fmxAnti(){if(!(FMRUN&&FMRUN.m.diet))return false; /* the diet's antimatter is a friend: it takes half the growth away and nothing else */
  G2.rr=Math.max(V2K.r0,G2.rr-(G2.rr-V2K.r0)*.5-2);G2.pulse=1;v2Burst(hX,hY,24,'#ff4fd8',1.5,6,.6,2);v2Pop(T('KÜÇÜLDÜN ✓'),'#7dff8a',17);v2Sfx('bell',{vol:.45,rate:1.4});return true;}
function fmxDraw(){const m=FMRUN&&FMRUN.m;if(!m||!FX)return;const t=clock;ctx.save();
  if(G2.orb){const o=G2.orb,cx=W/2,cy=o.cy,R=G2.R||20,cov=Math.asin(Math.min(1,R/o.R))*1.2;ctx.strokeStyle='rgba(159,232,255,.14)';ctx.lineWidth=R*2;ctx.beginPath();ctx.arc(cx,cy,o.R,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(159,232,255,.45)';ctx.lineWidth=1.2;ctx.setLineDash([4,7]);ctx.beginPath();ctx.arc(cx,cy,o.R,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='rgba(255,190,90,.7)';ctx.lineWidth=3;for(const r of [o.R+R+5,o.R-R-5]){ctx.beginPath();ctx.arc(cx,cy,r,o.a-cov,o.a+cov);ctx.stroke();} /* the stretch of the ring the hole guards now */
    if(Math.abs(o.v||0)>.05){const dir=Math.sign(o.v);for(let i=1;i<=2;i++){const a=o.a+dir*(cov+.18*i),x=cx+Math.cos(a)*o.R,y=cy+Math.sin(a)*o.R;ctx.save();ctx.translate(x,y);ctx.rotate(a+dir*Math.PI/2);ctx.fillStyle=`rgba(255,215,106,${.7-.25*i})`;ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();}}
    for(const q of G2.objs)if(q.k==='thr'&&q.st==='in'){ctx.strokeStyle='rgba(255,140,90,.18)';ctx.lineWidth=1;ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(cx,cy);ctx.stroke();ctx.setLineDash([]);}} /* where each rock is heading */
  if(m.diet){const lim=fmxLim(),q=clamp((G2.rr-V2K.r0)/(lim-V2K.r0),0,1),col=q>.82?'#ff5a4a':q>.55?'#ffd76a':'#6dff8e';
    ctx.strokeStyle=q>.82?`rgba(255,90,74,${.55+.35*Math.sin(t*10)})`:'rgba(255,120,100,.4)';ctx.lineWidth=1.6;ctx.setLineDash([5,6]);ctx.lineDashOffset=-t*12;ctx.beginPath();ctx.arc(hX,hY,lim*G2.S,0,TAU);ctx.stroke();ctx.setLineDash([]); /* the size you may not pass, round your hole */
    const x=W-20,y0=sp2(120),h=Math.min(180,H*.25);ctx.fillStyle='rgba(10,12,18,.6)';ctx.beginPath();ctx.roundRect(x-3,y0-3,14,h+6,7);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x,y0+h*(1-q),8,h*q,4);ctx.fill();
    ctx.strokeStyle='#ff5a4a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-6,y0);ctx.lineTo(x+14,y0);ctx.stroke();ctx.font='800 9px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='right';ctx.fillStyle='#ff8a7a';ctx.fillText(T('SINIR'),x-8,y0+3);ctx.textAlign='center';ctx.fillStyle='#aab2c6';ctx.fillText(T('BOYUT'),x+4,y0+h+14);}
  if(m.bombs){for(const b of FX.bombs){const left=b.fuse-b.t,q=b.t/b.fuse,r=b.r,pop=Math.min(1,b.t/.25);ctx.save();ctx.translate(b.x,b.y);ctx.scale(pop,pop);
      if(left<1.2){ctx.globalAlpha=.25+.25*Math.sin(t*20);ctx.fillStyle='#ff5a3a';ctx.beginPath();ctx.arc(0,0,sp2(95),0,TAU);ctx.fill();ctx.globalAlpha=1;} /* the blast it is about to make */
      const g=ctx.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r);g.addColorStop(0,'#6a7088');g.addColorStop(.6,'#2a2e3c');g.addColorStop(1,'#0c0e14');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
      ctx.strokeStyle='#8a90a6';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.fillStyle='#454a5c';ctx.fillRect(-r*.25,-r*1.25,r*.5,r*.35);
      const sp=.5+.5*Math.sin(t*30);ctx.fillStyle=`rgba(255,${180+60*sp},90,1)`;ctx.shadowColor='#ffb347';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(r*.1,-r*1.35,r*.16+sp*1.5,0,TAU);ctx.fill();ctx.shadowBlur=0; /* the fuse sparks */
      const bl=Math.floor(t*(3+q*14))%2;ctx.fillStyle=bl?'#ff3a2a':'#5a1410';ctx.beginPath();ctx.arc(0,0,r*.24,0,TAU);ctx.fill();
      ctx.strokeStyle=q>.65?'#ff5a4a':'#ffd76a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r+5,-Math.PI/2,-Math.PI/2+TAU*(1-q));ctx.stroke();
      ctx.font='900 11px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(Math.ceil(left),0,r+15);ctx.fillStyle='#fff';ctx.fillText(Math.ceil(left),0,r+15);ctx.restore();}
    ctx.globalCompositeOperation='lighter';for(const e of FX.booms){const k=e.t/.6,rr=e.R*Math.min(1,e.t/.2),g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,rr+1);g.addColorStop(0,`rgba(255,240,200,${.8*(1-k)})`);g.addColorStop(.6,`rgba(255,150,50,${.45*(1-k)})`);g.addColorStop(1,'rgba(255,80,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,rr+1,0,TAU);ctx.fill();ctx.strokeStyle=`rgba(255,220,150,${1-k})`;ctx.lineWidth=4;ctx.stroke();}}
  ctx.restore();}
if(DEV){const q=(location.search.match(/[?&]fm=([a-z]+)/)||[])[1];if(q)setTimeout(()=>{if(!G2.on)fmxPlay(q);},2500);} // ?dev&fm=diet|guard|bomb starts one at once
