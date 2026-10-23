// New fleet missions (developer preview, ?dev&fm=<id>): Diet, Planet Guardian, Bomb Disposal. They are kept out of BHS_FMIS.L for now:
// the day's pick and the server read that list, so these join it with the release that brings their rules, targets and translations.
const FMX=[
  {id:'diet',lv:0,ic:'🥗',n:'DİYET',d:'Bu kez büyüme! Küçük cisimleri yut, boyut sınırını geçme. Antimadde dost: yutunca küçültür.',dur:60,m:'caught',tg:[60,110,160],max:600,diet:1.55,anti:1,bodies:1,kit:{sh:1,nova:0,rage:0},x:1},
  {id:'guard',lv:1,ic:'🌍',n:'GEZEGEN KORUYUCUSU',d:'Kızıl kayalar gezegene doğru geliyor. Çarpmadan önce yolunu kes ve yut. Her kaya +1; gezegen yıkılırsa bir can gider.',dur:90,m:'guard',tg:[20,35,50],max:200,kit:{sh:2,nova:1,rage:1},x:1},
  {id:'bomb',lv:2,ic:'💣',n:'BOMBA İMHASI',d:'Geri sayımlı bombalar beliriyor. Patlamadan önce yut! Her patlama bir yay kırar; kalkan korur.',dur:90,m:'bomb',tg:[35,60,85],max:300,bombs:1,kit:{sh:2,nova:0,rage:0},x:1}];
let FX=null; // the running mission's own state
function fmxPlay(id){const m=FMX.find(x=>x.id===id);if(!DEV||!m)return;fmClose();hideModals();startSprint((Date.now()%1e6)^0x77,{fm:m,fmDay:'dev'});}
// called at the end of fmSetup, so the mission's kit is in place
function fmxSetup(){const m=FMRUN.m;FX={bombs:[],booms:[],next:1.2,warn:0};const w=G2.L.w;
  if(m.bombs){w.meteor=0;w.bomb=0;G2.L.metIv=0;w.planet=(w.planet||0)*.5;}
  if(m.m==='guard'&&G2.guard){const g=G2.guard;g.dur=g.t=m.dur+3;g.dmg=20;w.meteor=0;} /* the clock runs out on the mission, not on the defence; meteors become rocks anyway */
  if(m.diet){w.planet=(w.planet||0)*1.4;w.mini=0;} /* a few more planets: the trap of the diet */}
const fmxLim=()=>V2K.r0*FMRUN.m.diet;
function fmxStep(dt){const m=FMRUN.m,S=G2.S;if(G2.ending||gState!=='playing')return;
  if(m.diet){const lim=fmxLim(),q=(G2.rr-V2K.r0)/(lim-V2K.r0);if(q>.82&&!FX.warn){FX.warn=1;v2Pop(T('SINIRA YAKLAŞTIN'),'#ff8a7a',16);v2Sfx('tickHi',{vol:.5,rate:.7});}else if(q<.6)FX.warn=0;
    if(G2.rr>lim){v2Burst(hX,hY,40,'#ff5a4a',2,8,.8,2.4);v2Fail(T('BOYUT SINIRI AŞILDI'));}}
  if(m.bombs){const p=Math.min(1,SPR_RUN.t/m.dur);FX.next-=dt;
    if(FX.next<=0){FX.next=(1.35-.6*p)*rrnd(.85,1.15);const r=sp2(17);let x,y,k=0;do{x=rrnd(sp2(40),W-sp2(40));y=rrnd(sp2(120),H-sp2(160));k++;}while(k<12&&Math.hypot(x-hX,y-hY)<sp2(110));
      FX.bombs.push({x,y,r,t:0,fuse:(3.4-1*p)*rrnd(.95,1.08)});v2Sfx('tickHi',{vol:.25,rate:1.6});}
    for(let i=FX.bombs.length-1;i>=0;i--){const b=FX.bombs[i];b.t+=dt;
      if(Math.hypot(b.x-hX,b.y-hY)<G2.R+b.r*.5&&!(G2.antiT>0)){FX.bombs.splice(i,1);fmAdd('bomb',1);v2Burst(b.x,b.y,18,'#7dff8a',1.5,5,.5,1.8);v2Sfx('bell',{vol:.4,rate:1.2+.02*(FMRUN.v%10)});v2Pop('+1','#7dff8a',15);continue;}
      if(b.t>=b.fuse){FX.bombs.splice(i,1);FX.booms.push({x:b.x,y:b.y,t:0,R:sp2(95)});shake=Math.max(shake,7);v2Sfx('boom',{vol:.5,rate:1.1});
        if(G2.shT>0){v2Pop(T('KALKAN KORUDU'),'#9fe8ff',15);}else{G2.hitWhy='bomb';v2Hit({x:b.x,y:b.y,k:'bomb'},false);G2.hitWhy=null;}}}
    for(let i=FX.booms.length-1;i>=0;i--){const e=FX.booms[i];e.t+=dt;if(e.t>.6)FX.booms.splice(i,1);}}}
function fmxAnti(){if(!(FMRUN&&FMRUN.m.diet))return false; /* the diet's antimatter is a friend: it takes half the growth away and nothing else */
  G2.rr=Math.max(V2K.r0,G2.rr-(G2.rr-V2K.r0)*.5-2);G2.pulse=1;v2Burst(hX,hY,24,'#ff4fd8',1.5,6,.6,2);v2Pop(T('KÜÇÜLDÜN ✓'),'#7dff8a',17);v2Sfx('bell',{vol:.45,rate:1.4});return true;}
function fmxDraw(){const m=FMRUN&&FMRUN.m;if(!m||!FX)return;const t=clock;ctx.save();
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
