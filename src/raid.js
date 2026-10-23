// Filo Baskını (fleet raid), developer preview only (?dev): four holes share one wide field (the camera pulled back, everything smaller, growth capped),
// five bosses arrive one by one, and the score is how long the team lasts, plus 20 for every teammate brought back. A fallen hole is a ghost for 6 s:
// a teammate who stays beside it for 1.3 s brings it back with one heart. In this build bots take the empty seats; the live 4-player room comes later.
var RAID=null; // var, so the engine may look before this line runs
const RAIDK={zoom:.55,cap:1.4,lives:3,ghost:6,rev:1.3,resc:20,every:30,lvl:18};
const RAID_P=[{n:'SEN',col:'255,205,90'},{n:'NOVA',col:'120,220,255'},{n:'ORION',col:'255,120,220'},{n:'VEGA',col:'130,255,150'}];
const RAID_B=[ // the order they arrive in; three are the bosses players already know
  {id:'avci',n:'AVCI',d:'Kırmızı Dev · en yakını kovalar',col:'255,110,60'},
  {id:'cekim',n:'ÇEKİM',d:'Dev Gezegen · içine çeker',col:'190,150,255'},
  {id:'bomba',n:'BOMBACI',d:'Süpernova · mayın bırakır',col:'150,220,255'},
  {id:'tara',n:'TARAYICI',d:'Döner ışın · zamanla kaç',col:'140,240,255'},
  {id:'bol',n:'BÖLÜNEN',d:'İkiye ayrılır, sonra birleşir',col:'210,255,90'}];
const raidFast=()=>DEV&&/[?&]raidfast\b/.test(location.search); // recordings: a boss every 8 s instead of 30
const raidOn=()=>!!(RAID&&G2.on&&gameMode==='sprint');
function raidNew(){return {t:0,end:-1,me:null,ps:[],bs:[],mines:[],booms:[],nextB:0,k:1};}
function raidPlay(){if(!DEV)return;fmClose();const o=document.createElement('div');o.className='fm-ov';o.id='fmOv';const J=[.3,1.4,2.7,3.9];
  const slot=(p,i)=>`<div class="rdS" id="rdS${i}" style="--c:${p.col}"><i></i><b>${i?'…':escH(T('SEN'))}</b><em></em></div>`;
  o.innerHTML=`<div class="fm-card rdInv"><div class="fm-sec">${T('FİLO ÇAĞRISI')}</div><h3>⚔ ${T('FİLO BASKINI')}</h3><p>${T('4 kişi · 5 boss · en uzun hayatta kalan takım')}</p>
    <div class="rdBar"><i id="rdBar"></i></div><p class="dur" id="rdLeft"></p><div class="rdSl">${RAID_P.map(slot).join('')}</div><h3 id="rdN"></h3>
    <div class="fm-note">${T('4 kişi kabul edince başlar. Süre dolarsa 2–3 kişiyle, boş yerlere bot karadelik girerek başlar.')}<br>🛠 ${T('Geliştirici denemesi: diğer üç yer bot.')}</div>
    <div class="row"><button class="b2" id="rdNo">${T('VAZGEÇ')}</button></div></div>`;
  document.body.appendChild(o);sfx('click',{vol:.4});const t0=performance.now(),id=++raidPlay.n;let go=0;
  o.querySelector('#rdNo').onclick=()=>{raidPlay.n++;fmClose();};
  const tick=()=>{if(raidPlay.n!==id||!$('rdBar'))return;const t=(performance.now()-t0)/1000,n=J.filter(j=>t>=j).length;
    $('rdBar').style.width=Math.max(0,100-t/120*100)+'%';$('rdLeft').textContent='⏱ '+T('Davet süresi')+' '+fmtT(Math.max(0,120-t));
    RAID_P.forEach((p,i)=>{const e=$('rdS'+i);if(t>=J[i]&&!e.classList.contains('on')){e.classList.add('on');e.querySelector('b').textContent=i?p.n:T('SEN');e.querySelector('em').textContent=i?T('KATILDI ✓'):T('ÇAĞIRDI');if(i)sfx('coin',{vol:.35,rate:1.2});}});
    $('rdN').textContent=n<4?`${n}/4 ${T('kabul etti')}`:`4/4 · ${T('baskın başlıyor!')}`;
    if(n===4&&!go){go=t;}if(go){const k=Math.ceil(3-(t-go));if(k<=0){raidPlay.n++;fmClose();startSprint(0x5eed^Date.now()%1e6,{raid:1});return;}$('rdN').textContent=`4/4 · ${T('baskın başlıyor!')} ${k}`;}
    requestAnimationFrame(tick);};tick();}
raidPlay.n=0;
const fmtT=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
// set up after v2Start: the field, the bodies, the team
function raidSetup(){const R=RAID;G2.noRage=1;G2.shrinkN=99;G2.arcMax=0;G2.arcs=0;G2.shells=0;lives=RAIDK.lives;G2.lives0=lives;G2.cap=V2K.r0*RAIDK.cap;
  const w=G2.L.w;for(const k of ['meteor','bomb','anti','comet','icec','dark','magnet','mirror','pulsar','mpair','time','mini'])w[k]=0;G2.L.metIv=0;G2.L.overload=false;G2.L.cap=Math.round(G2.L.cap*1.9);G2.L.iv*=.55;G2.evPlan=null;G2.garcAt=-1;
  R.ps=RAID_P.map((p,i)=>({i,n:p.n,col:p.col,me:!i,x:W*(.3+.4*(i%2)),y:H*(.35+.3*(i>>1)),vx:0,vy:0,rr:V2K.r0,lives:RAIDK.lives,alive:true,out:false,ghost:0,rv:0,surv:0,resc:0,inv:2,tg:null,fear:rrnd(.75,1.05),ft:0,hx:0,hy:0}));
  R.me=R.ps[0];hX=R.me.x;hY=R.me.y;G2.tx=hX;G2.ty=hY;G2.lx=hX;G2.ly=hY;
  R.nextB=0;raidBoss();raidBoss();document.body.classList.add('raid');raidHud(true);
  if($('rage2'))$('rage2').style.visibility='hidden';if($('pb'))$('pb').style.display='none';$('badge').textContent='⚔ '+T('FİLO BASKINI');
  try{SND.music('boss');}catch(e){}later(()=>{if(raidOn())v2Call('⚔ '+T('FİLO BASKINI'),T('HAYATTA KAL · DÜŞENİ KURTAR'),'#ffd76a',2.2,true);},300);}
function raidStop(){document.body.classList.remove('raid');const h=$('raidHud');if(h)h.remove();RAID=null;}
// a boss joins: from the edge it fades in, harmless for a moment
function raidBoss(){const R=RAID,i=R.nextB++,K=RAID_B[i];if(!K)return;const S=G2.S,b={id:K.id,k:K,age:0,in:1,x:W*.5,y:H*.5,vx:0,vy:0};
  if(K.id==='avci')Object.assign(b,{x:W*.2,y:H*.15,r:66*S,bt:'red',br:1,gs:1,fade:1});
  if(K.id==='cekim'){Object.assign(b,{x:W*.75,y:H*.25,r:62*S,pull:300*S,k2:'boss',cell:2,sX:1,sY:1,gs:1,isBoss:false,hitFlash:0});giveSpin(b);b.spinV*=.25;}
  if(K.id==='bomba')Object.assign(b,{x:W*.5,y:H*.78,r:52*S,bt:'nova',flash:0,gs:1,fade:1,cd:2});
  if(K.id==='tara')Object.assign(b,{x:W*.5,y:H*.5,r:30*S,a:0,L:Math.min(W,H)*.46});
  if(K.id==='bol')Object.assign(b,{x:W*.2,y:H*.7,r:58*S,vx:120*S,vy:-90*S,sp:0,tw:null});
  R.bs.push(b);if(R.t>.5){v2Call(K.n,T(K.d),`rgb(${K.col})`,2,true);sfx('bossIntro',{vol:.55,rev:.4});}}
// the hazards as circles and segments, for hits and for the bots' fear
function raidCircles(){const o=[];for(const b of RAID.bs){if(b.in>.4)continue;if(b.id==='bol'&&b.tw)for(const h of b.tw)o.push({x:h.x,y:h.y,r:h.r});else if(b.id!=='tara')o.push({x:b.x,y:b.y,r:b.id==='cekim'?b.r*.95:b.r*(b.id==='avci'?b.br:1)});else o.push({x:b.x,y:b.y,r:b.r});}return o;}
function raidArms(b){const a=[];for(let k=0;k<2;k++){const g=b.a+k*Math.PI;a.push([b.x+Math.cos(g)*b.r,b.y+Math.sin(g)*b.r,b.x+Math.cos(g)*b.L,b.y+Math.sin(g)*b.L]);}return a;}
function raidSeg(px,py,a){const dx=a[2]-a[0],dy=a[3]-a[1],l=dx*dx+dy*dy,t=clamp(((px-a[0])*dx+(py-a[1])*dy)/l,0,1),qx=a[0]+dx*t,qy=a[1]+dy*t;return {d:Math.hypot(px-qx,py-qy),qx,qy};}
function raidHit(p){if(!p.alive||p.inv>0)return;if(p.me){if(G2.immT>0)return;G2.hitWhy='raid';v2Hit({x:hX,y:hY,k:'raid'},true);G2.freeze=0;if(G2.lifeHit){G2.lifeHit=0;G2.revT=REV_T;}p.lives=lives;p.inv=G2.immT;return;}
  p.lives--;p.inv=1.5;v2Burst(p.x,p.y,18,'#ff7a5c',2,6,.6,2);v2Sfx('armor',{vol:.35,rate:.9});if(p.lives<=0)raidDown(p);}
function raidDown(p){p.alive=false;p.ghost=RAIDK.ghost;p.rv=0;p.lives=0;const x=p.me?hX:p.x,y=p.me?hY:p.y;p.x=x;p.y=y;v2Burst(x,y,34,`rgb(${p.col})`,2,8,.8,2.4);shake=Math.max(shake,p.me?10:4);
  v2Call(p.me?T('DÜŞTÜN!'):p.n+' '+T('DÜŞTÜ'),T('6 sn içinde kurtarılmalı'),'#ff8a7a',1.4,true);if(p.me){G2.immT=1e9;sfx('gameover',{vol:.4});}}
function raidUp(p,by){p.alive=true;p.lives=1;p.ghost=0;p.rv=0;p.inv=2;by.resc++;v2Burst(p.x,p.y,40,'#7dff8a',2,8,.8,2.4);sfx('powerup',{vol:.6,rate:1.1});
  v2Call(p.n+' '+T('KURTARILDI'),'+'+RAIDK.resc+' · '+by.n,'#7dff8a',1.4,true);if(p.me){lives=1;G2.immT=2;updateUI();}}
// one step of the raid, after the hole has moved
function raidStep(dt){const R=RAID;if(R.end>=0)return;R.t+=dt;const S=G2.S,me=R.me,ev=raidFast()?8:RAIDK.every;
  if(R.nextB<RAID_B.length&&R.t>=ev*(R.nextB-1))raidBoss();
  {const k=1+.12*Math.max(0,Math.floor(R.t/ev)-(RAID_B.length-1));if(k>R.k){R.k=k;v2Call(T('BOSSLAR HIZLANDI'),'×'+k.toFixed(2).replace(/0$/,''),'#ff8a5c',1.6,true);sfx('bossIntro',{vol:.4,rate:1.2});}} // all five are in: every round after that they get 12 % faster, so a long stand is worth more
  const K=R.k;
  if(me.alive){me.x=hX;me.y=hY;me.lives=lives;if(G2.rr>G2.cap)G2.rr=G2.cap;}else{G2.tx=hX;G2.ty=hY;DRAG.ax=hX;DRAG.ay=hY;}
  const alive=R.ps.filter(p=>p.alive);
  // bosses
  for(const b of R.bs){b.age+=dt;if(b.in>0)b.in=Math.max(0,b.in-dt/.9);
    if(b.id==='avci'){b.br=1+.1*Math.sin(b.age*TAU/5);let t=null,bd=1e9;for(const p of alive){const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<bd){bd=d;t=p;}}if(t){const dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy)||1,v=(55+4*R.nextB)*S*K;b.x+=dx/d*v*dt;b.y+=dy/d*v*dt;}}
    if(b.id==='cekim'){b.spinA+=b.spinV*dt;b.x=W*.72+Math.sin(b.age*.22)*W*.16;b.y=H*.26+Math.cos(b.age*.29)*H*.08;}
    if(b.id==='bomba'){b.flash=Math.max(0,b.flash-dt*1.5);b.x=W*.5+Math.sin(b.age*.45)*W*.32;b.y=H*.72+Math.sin(b.age*.9)*H*.07;b.cd-=dt*K;if(b.cd<=0&&b.in<=0){b.cd=2.6;b.flash=.8;R.mines.push({x:b.x,y:b.y,t:1.7});}}
    if(b.id==='tara'){b.a+=.55*K*dt;b.x=W*.5+Math.sin(b.age*.2)*W*.08;b.y=H*.48+Math.cos(b.age*.17)*H*.05;}
    if(b.id==='bol'){const mv=o=>{o.x+=o.vx*dt*K;o.y+=o.vy*dt*K;if(o.x<o.r||o.x>W-o.r)o.vx*=-1;if(o.y<o.r||o.y>H-o.r-60)o.vy*=-1;o.x=clamp(o.x,o.r,W-o.r);o.y=clamp(o.y,o.r,H-o.r-60);};b.sp+=dt;
      if(!b.tw){mv(b);if(b.sp>7){b.sp=0;const s=Math.hypot(b.vx,b.vy)||1,v=150*S;b.tw=[{x:b.x,y:b.y,r:b.r*.7,vx:-b.vy/s*v,vy:b.vx/s*v},{x:b.x,y:b.y,r:b.r*.7,vx:b.vy/s*v,vy:-b.vx/s*v}];v2Burst(b.x,b.y,26,'#d8ff6a',2,7,.7,2.2);v2Sfx('armor',{vol:.4,rate:.6});}}
      else{if(b.sp<=4.5)for(const h of b.tw)mv(h);else{const [a,q]=b.tw,mx=(a.x+q.x)/2,my=(a.y+q.y)/2;for(const h of b.tw){h.x+=(mx-h.x)*Math.min(1,3*dt);h.y+=(my-h.y)*Math.min(1,3*dt);}b.x=mx;b.y=my;if(Math.hypot(a.x-q.x,a.y-q.y)<6*S+2){b.tw=null;b.sp=0;}}}}}
  for(let i=R.mines.length-1;i>=0;i--){const m=R.mines[i];m.t-=dt;if(m.t<=0){R.mines.splice(i,1);R.booms.push({x:m.x,y:m.y,t:0,R:120*S});v2Sfx('boom',{vol:.35,rate:1.2});shake=Math.max(shake,3);}}
  for(let i=R.booms.length-1;i>=0;i--){const e=R.booms[i];e.t+=dt;if(e.t>.55)R.booms.splice(i,1);}
  const C=raidCircles(),tb=R.bs.find(b=>b.id==='tara'&&b.in<=.4),arms=tb?raidArms(tb):[],gb=R.bs.find(b=>b.id==='cekim');
  // the pull of the giant planet: on your hole it moves where your finger aims, so it creeps in while you hold still
  if(gb&&gb.in<=0&&me.alive){const dx=gb.x-hX,dy=gb.y-hY,d=Math.hypot(dx,dy)||1;if(d<gb.pull){const f=110*S*(1-d/gb.pull)*dt,ux=dx/d*f,uy=dy/d*f;G2.tx+=ux;G2.ty+=uy;if(DRAG.id!==null){DRAG.ax+=ux;DRAG.ay+=uy;}}}
  // the team
  for(const p of R.ps){if(p.out)continue;p.inv=Math.max(0,p.inv-dt);
    if(!p.alive){p.ghost-=dt;const rs=R.ps.find(q=>q.alive&&Math.hypot(q.x-p.x,q.y-p.y)<(q.me?G2.R:q.rr*S)+34*S+8);if(rs){p.rv+=dt;if(p.rv>=RAIDK.rev)raidUp(p,rs);}else p.rv=Math.max(0,p.rv-dt*.5);
      if(!p.alive&&p.ghost<=0){p.out=true;v2Call(p.me?T('ELENDİN'):p.n+' '+T('ELENDİ'),'','#9aa2b6',1.2,true);for(const q of R.ps)if(q.tg===p)q.tg=null;}continue;}
    p.surv+=dt;
    if(!p.me)raidBot(p,dt,C,arms,gb);
    const pr=p.me?G2.R:p.rr*S;
    for(const c of C)if(Math.hypot(p.x-c.x,p.y-c.y)<c.r+pr*.45)raidHit(p);
    for(const e of R.booms)if(e.t<.3&&Math.hypot(p.x-e.x,p.y-e.y)<e.R*Math.min(1,e.t/.25)+pr*.3)raidHit(p);
    for(const a of arms)if(raidSeg(p.x,p.y,a).d<6*S+pr*.45)raidHit(p);}
  if(R.ps.some(p=>p.alive))R.team=R.t;else if(R.end<0){R.end=R.t;raidEnd();}}
// a bot: eat what it can, keep away from what hurts, run to a fallen teammate
function raidBot(p,dt,C,arms,gb){const R=RAID,S=G2.S,pr=p.rr*S;let ax=0,ay=0;p.ft-=dt;if(p.ft<=0){p.ft=rrnd(2,4);p.fear=rrnd(.55,1.1);} // nerve comes and goes
  if(p.tg&&(p.tg.alive||p.tg.out))p.tg=null;
  if(!p.tg&&p.lives>=1)for(const q of R.ps)if(!q.alive&&!q.out&&!R.ps.some(o=>o!==p&&o.tg===q)&&Math.hypot(q.x-p.x,q.y-p.y)<Math.max(W,H)*.8){p.tg=q;break;}
  let tg=p.tg;if(!tg){let bd=1e9;for(const o of G2.objs){if(o.st!=='in'||o.wait>0||!v2Edible(o)||o.r>pr*.95)continue;const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;tg=o;}}}
  if(tg){const dx=tg.x-p.x,dy=tg.y-p.y,d=Math.hypot(dx,dy)||1,w=p.tg?2.6:1;ax+=dx/d*w;ay+=dy/d*w;}
  const fr=p.tg?.45:p.fear;
  for(const c of C){const dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy)||1,lim=c.r+150*S*fr+pr;if(d<lim){const w=(lim-d)/(150*S*fr+pr)*3.2;ax+=dx/d*w;ay+=dy/d*w;}}
  for(const m of R.mines){const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1,lim=135*S;if(d<lim){const w=(lim-d)/lim*3*fr;ax+=dx/d*w;ay+=dy/d*w;}}
  for(const a of arms){const s=raidSeg(p.x,p.y,a),dx=p.x-s.qx,dy=p.y-s.qy,d=s.d||1,lim=90*S*fr+pr;if(d<lim){const w=(lim-d)/lim*3.4;ax+=dx/d*w;ay+=dy/d*w;}}
  const e=60*S;if(p.x<e)ax+=(e-p.x)/e*2;if(p.x>W-e)ax-=(p.x-W+e)/e*2;if(p.y<e)ay+=(e-p.y)/e*2;if(p.y>H-e-60)ay-=(p.y-H+e+60)/e*2;
  const L=Math.hypot(ax,ay)||1,sp=(p.tg?330:290)*S;p.vx+=(ax/L*sp-p.vx)*Math.min(1,3*dt);p.vy+=(ay/L*sp-p.vy)*Math.min(1,3*dt);
  if(gb&&gb.in<=0){const dx=gb.x-p.x,dy=gb.y-p.y,d=Math.hypot(dx,dy)||1;if(d<gb.pull){const f=110*S*(1-d/gb.pull);p.vx+=dx/d*f*dt*2;p.vy+=dy/d*f*dt*2;}}
  p.x=clamp(p.x+p.vx*dt,pr,W-pr);p.y=clamp(p.y+p.vy*dt,pr,H-pr-60);
  for(const o of G2.objs)if(o.st==='in'&&!(o.wait>0)&&v2Edible(o)&&o.r<pr*.95&&Math.hypot(o.x-p.x,o.y-p.y)<pr+o.r*.3){o.st='dead';p.rr=Math.min(V2K.r0*RAIDK.cap,p.rr+.6);v2Burst(o.x,o.y,6,`rgb(${p.col})`,.8,2.5,.35,1.4);}
  if(rng()<dt*.2)p.rr=Math.max(V2K.r0,p.rr-.4);}
function raidEnd(){const R=RAID;gState='over';SPR_RUN.ended=true;SND.setDrone(.08,300);SND.duck(.35,2);later(()=>{if(RAID===R)raidResult();},1400);}
function raidScore(){const R=RAID;return Math.floor(R.team||0)+R.ps.reduce((s,p)=>s+p.resc,0)*RAIDK.resc;}
function raidResult(){const R=RAID,rs=[...R.ps].sort((a,b)=>b.surv-a.surv),pts=raidScore();sfx('levelup',{vol:.7,rev:.4});fmClose();
  const o=document.createElement('div');o.className='fm-ov';o.id='fmOv';
  o.innerHTML=`<div class="fm-card rdRes"><div class="fm-sec">⚔ ${T('FİLO BASKINI BİTTİ')}</div><small>${T('TAKIM SÜRESİ')}</small><div class="big">${fmtT(R.team||0)}</div>
    <div class="rdL">${rs.map((p,i)=>`<div style="--c:${p.col}"><span>${i+1}.</span><b>${p.me?T('SEN'):p.n}</b>${p.resc?`<em>🤝 ${p.resc}</em>`:''}<i>${fmtT(p.surv)}</i></div>`).join('')}</div>
    <p>${T('Puan = takım süresi (sn) + kurtarma × {n}',{n:RAIDK.resc})}</p><h3 class="rdPts">${T('Filo puanı')} +${pts}</h3>
    <div class="fm-note">🛠 ${T('Geliştirici denemesi: puan kaydedilmez.')}</div>
    <div class="row"><button class="b2" id="rdMenu">${T('MENÜ')}</button><button class="b1" id="rdAgain">🔁 ${T('TEKRAR')}</button></div></div>`;
  document.body.appendChild(o);o.querySelector('#rdMenu').onclick=()=>{fmClose();hideModals();showMenu();};o.querySelector('#rdAgain').onclick=()=>{fmClose();hideModals();showMenu();later0(raidPlay,300);};}
// the top bar: the team's time, then one chip per seat (hearts, or the seconds a fallen one has left)
function raidHud(make){let h=$('raidHud');if(make&&!h){h=document.createElement('div');h.id='raidHud';h.className='notr';$('hdr').insertBefore(h,$('pauseBtn'));}if(!h||!RAID)return;const R=RAID;
  h.innerHTML=`<div class="rt"><small>${T('TAKIM')}</small><b>${fmtT(R.team||0)}</b></div>`+R.ps.map(p=>`<div class="rc${p.out?' out':!p.alive?' dn':''}${p.me?' mine':''}" style="--c:${p.col}"><b>${p.me?T('SEN'):p.n}</b><span>${p.out?T('ELENDİ'):!p.alive?'⏳ '+Math.ceil(p.ghost):'♥'.repeat(p.lives)+'<em>'+'♥'.repeat(Math.max(0,RAIDK.lives-p.lives))+'</em>'}</span></div>`).join('');}
// GL: the giant planet is drawn by the body shader with the other bodies
function raidGl(list){for(const b of RAID.bs)if(b.cell!==undefined){b.gs=1-b.in;list.push(b);}}
// before the frame is drawn: a fallen or eliminated player has no hole on the screen
function raidPre(){if(RAID&&!RAID.me.alive){holeK=0;curR=.01;tgtR=curR;}}
function raidDraw(gl){const R=RAID,S=G2.S,t=clock;ctx.save();
  for(const b of R.bs){const al=1-b.in;ctx.globalAlpha=al;
    if(b.id==='cekim'){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const k=((t*.45+i/4)%1),rr=b.pull*(1-k)+b.r;ctx.strokeStyle=`rgba(${b.k.col},${.3*k*al})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,rr,t*1.5+i,t*1.5+i+2.4);ctx.stroke();}
      ctx.setLineDash([3,9]);ctx.strokeStyle=`rgba(${b.k.col},${.2*al})`;ctx.beginPath();ctx.arc(b.x,b.y,b.pull,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();if(!gl){const im=SPR.byCell&&SPR.byCell[b.cell];if(im)ctx.drawImage(im,b.x-b.r,b.y-b.r,b.r*2,b.r*2);}}
    if(b.id==='avci'){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(b.x,b.y,b.r*.9,b.x,b.y,b.r*2);g.addColorStop(0,`rgba(255,40,30,${.5*al})`);g.addColorStop(1,'rgba(255,40,30,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r*2,0,TAU);ctx.fill();ctx.restore();} /* the hunter burns red, the bomber cold blue: told apart at a glance */
    if(b.id==='avci'||b.id==='bomba'){b.gs=1-b.in*.6;b.fade=al;v2DrawStar(b);if(b.id==='bomba'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(150,220,255,${.6*al})`;ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.lineDashOffset=-t*20;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.3,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=`rgba(230,245,255,${.9*al})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.5,-Math.PI/2,-Math.PI/2+TAU*clamp(1-b.cd/2.6,0,1));ctx.stroke();ctx.restore();} /* the fuse: when the ring closes, a mine drops */if(b.id==='avci'){const a=Math.atan2(R.me.y-b.y,R.me.x-b.x);ctx.save();ctx.globalAlpha=al*(.5+.3*Math.sin(t*6));ctx.fillStyle='#ff5a4a';for(let i=-1;i<=1;i++){const g=a+i*.35;ctx.beginPath();ctx.moveTo(b.x+Math.cos(g)*b.r*1.25,b.y+Math.sin(g)*b.r*1.25);ctx.lineTo(b.x+Math.cos(g+.08)*b.r*1.08,b.y+Math.sin(g+.08)*b.r*1.08);ctx.lineTo(b.x+Math.cos(g-.08)*b.r*1.08,b.y+Math.sin(g-.08)*b.r*1.08);ctx.fill();}ctx.restore();}}
    if(b.id==='tara'){if(b.in<=.4)for(const a of raidArms(b)){ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.strokeStyle=`rgba(${b.k.col},${.16*al})`;ctx.lineWidth=22*S+6;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(a[2],a[3]);ctx.stroke();ctx.strokeStyle=`rgba(${b.k.col},${.85*al})`;ctx.lineWidth=7*S+2;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=2*S+1;ctx.stroke();ctx.restore();}
      else{ctx.strokeStyle=`rgba(${b.k.col},.5)`;ctx.setLineDash([4,6]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.L,0,TAU);ctx.stroke();ctx.setLineDash([]);}
      const g=ctx.createRadialGradient(b.x,b.y,b.r*.4,b.x,b.y,b.r*2.4);g.addColorStop(0,`rgba(${b.k.col},.7)`);g.addColorStop(1,`rgba(${b.k.col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r*2.4,0,TAU);ctx.fill();
      ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);ctx.fillStyle=`rgb(${b.k.col})`;ctx.beginPath();ctx.arc(0,0,b.r*.6,0,TAU);ctx.fill();ctx.fillStyle='#0b2a33';ctx.fillRect(-b.r*.75,-b.r*.12,b.r*1.5,b.r*.24);ctx.restore();}
    if(b.id==='bol'){const blob=(x,y,r,cr)=>{const g=ctx.createRadialGradient(x,y,r*.5,x,y,r*2.2);g.addColorStop(0,`rgba(${b.k.col},.4)`);g.addColorStop(1,`rgba(${b.k.col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*2.2,0,TAU);ctx.fill();
        const gg=ctx.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r*1.1);gg.addColorStop(0,'#f4ffc0');gg.addColorStop(.55,`rgb(${b.k.col})`);gg.addColorStop(1,'#5f8a10');ctx.fillStyle=gg;ctx.beginPath();for(let i=0;i<=28;i++){const a=i*TAU/28,q=r*(1+.07*Math.sin(a*5+t*4)+.04*Math.sin(a*3-t*3));ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}ctx.closePath();ctx.fill();
        ctx.fillStyle='#1d2a06';ctx.beginPath();ctx.arc(x-r*.28,y-r*.12,r*.13,0,TAU);ctx.arc(x+r*.28,y-r*.12,r*.13,0,TAU);ctx.fill();
        if(cr){ctx.strokeStyle='#1d2a06';ctx.lineWidth=Math.max(1.5,r*.07);ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.12,y-r*.3);ctx.lineTo(x-r*.1,y+r*.2);ctx.lineTo(x,y+r);ctx.stroke();}};
      if(b.tw)for(const h of b.tw)blob(h.x,h.y,h.r,0);else blob(b.x,b.y,b.r,b.sp>5.6);}
    const tx=b.id==='bol'&&b.tw?b.tw[0]:b;ctx.globalAlpha=al;ctx.font='900 10px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.strokeText(T(b.k.n),tx.x,tx.y+(tx.r||b.r)*1.15+4);ctx.fillStyle=`rgb(${b.k.col})`;ctx.fillText(T(b.k.n),tx.x,tx.y+(tx.r||b.r)*1.15+4);}
  ctx.globalAlpha=1;
  for(const m of R.mines){const k=1-m.t/1.7;ctx.strokeStyle=`rgba(255,90,60,${.2+.4*k})`;ctx.lineWidth=1.5;ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(m.x,m.y,120*S,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#1c1f28';ctx.beginPath();ctx.arc(m.x,m.y,10*S+3,0,TAU);ctx.fill();ctx.fillStyle=Math.floor(t*(4+k*10))%2?'#ff4a3a':'#5a1a14';ctx.beginPath();ctx.arc(m.x,m.y,4*S+2,0,TAU);ctx.fill();ctx.strokeStyle='#ffb36a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y,14*S+4,-Math.PI/2,-Math.PI/2+TAU*k);ctx.stroke();}
  ctx.save();ctx.globalCompositeOperation='lighter';for(const e of R.booms){const k=e.t/.55,rr=e.R*Math.min(1,e.t/.25),g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,rr+1);g.addColorStop(0,`rgba(255,240,200,${.7*(1-k)})`);g.addColorStop(.6,`rgba(255,150,50,${.4*(1-k)})`);g.addColorStop(1,'rgba(255,80,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,rr+1,0,TAU);ctx.fill();ctx.strokeStyle=`rgba(255,220,150,${1-k})`;ctx.lineWidth=4;ctx.stroke();}ctx.restore();
  for(const p of R.ps){if(p.out)continue;const pr=p.me?G2.R:p.rr*S;
    if(!p.alive){ctx.save();ctx.globalAlpha=.6+.25*Math.sin(t*6);ctx.strokeStyle=`rgba(${p.col},.95)`;ctx.lineWidth=2.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(p.x,p.y,pr*1.5,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=`rgba(${p.col},.12)`;ctx.fill();ctx.globalAlpha=1;
      ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,pr*2.1,-Math.PI/2,-Math.PI/2+TAU*clamp(p.ghost/RAIDK.ghost,0,1));ctx.stroke();
      if(p.rv>0){ctx.strokeStyle='#7dff8a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,p.y,pr*2.6,-Math.PI/2,-Math.PI/2+TAU*clamp(p.rv/RAIDK.rev,0,1));ctx.stroke();}
      ctx.fillStyle='#fff';ctx.font='900 13px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.ceil(p.ghost),p.x,p.y);
      ctx.font='800 10px "IBM Plex Sans Condensed",sans-serif';ctx.textBaseline='bottom';ctx.fillStyle=`rgb(${p.col})`;ctx.fillText((p.me?T('SEN'):p.n)+' · '+T('KURTAR!'),p.x,p.y-pr*2.7-2);ctx.restore();continue;}
    if(!p.me){ctx.save();ctx.translate(p.x,p.y);if(p.inv>0&&Math.floor(p.inv*10)%2)ctx.globalAlpha=.45;const g=ctx.createRadialGradient(0,0,pr*.9,0,0,pr*2.3);g.addColorStop(0,`rgba(${p.col},.5)`);g.addColorStop(1,`rgba(${p.col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,pr*2.3,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='lighter';ctx.lineCap='round';for(let i=0;i<4;i++){const a=t*(2.2-i*.3)+i*1.4+p.i,rr=pr*(1.12+.14*i);ctx.strokeStyle=`rgba(${p.col},${.75-.15*i})`;ctx.lineWidth=Math.max(1.2,pr*(.2-.035*i));ctx.beginPath();ctx.arc(0,0,rr,a,a+1.8-.2*i);ctx.stroke();}
      ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,pr,0,TAU);ctx.fill();ctx.strokeStyle=`rgba(${p.col},.95)`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,pr+.5,0,TAU);ctx.stroke();ctx.restore();}
    ctx.font='900 10px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.75)';const nm=p.me?T('SEN'):p.n,y=p.y-pr*(p.me?2.1:1.9)-2;ctx.strokeText(nm,p.x,y);ctx.fillStyle=`rgb(${p.col})`;ctx.fillText(nm,p.x,y);
    ctx.font='8px sans-serif';ctx.fillStyle='#ff5a6a';ctx.textBaseline='top';ctx.fillText('♥'.repeat(Math.max(0,p.lives)),p.x,p.y+pr*(p.me?1.9:1.6)+1);
    if(p.tg&&!p.tg.alive&&!p.tg.out){ctx.strokeStyle='rgba(125,255,138,.5)';ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.tg.x,p.tg.y);ctx.stroke();ctx.setLineDash([]);}}
  ctx.restore();RAID.hudT=(RAID.hudT||0)-1;if(RAID.hudT<=0){RAID.hudT=8;raidHud(false);}}
if(DEV&&/[?&]raid\b/.test(location.search))setTimeout(()=>{if(!G2.on)raidPlay();},2500); // ?dev&raid opens the invite (add &raidfast for a boss every 8 s)
