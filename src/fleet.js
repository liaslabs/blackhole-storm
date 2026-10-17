// FLEETS (1.5.1): the Fleet tab on the ranking, the strip under the menu name, points from play, the daily fleet mission,
// weekly prizes. The server (server/fleet.js) keeps the fleets; FL is the game's last look at mine, kept in the save.
let FL={fid:'',name:'',emb:'',pts:0,tg:[],prz:0,race:0,at:0,mis:{d:'',p:0,cl:0},fmc:0,fmq:[]}; // fmc: the Fleet Chain's stars wait · fmq: mission results not sent yet
let FLV=null,FLS='main',FLT='tasks',FLI=0,FLQ={n:0,src:'',busy:0},FLE=''; // the server's view, the sub-screen, points waiting to go, the last error
const FL_EMB=['🌀','🎯','🪐','☄️','🌌','🌑','🌗','💫','🌠','👾','🔭','🚀'],FL_LV=20,FL_MAKE_LV=30,FL_COST=100,FL_RENAME=50;
const FL_MSG={go:'🔥 Hadi filo!',gj:'👏 Harika!',done:'✓ Oynadım',rec:'🏆 Rekor!',ufo:'🛸',hi:'👋 Hoş geldin!',chest:'🎁 Sandığa az kaldı!',race:'🏁 Yarış başladı!',eat:'🕳️ Hepsini yut!'};
const FL_CHIPS=['go','gj','done','rec','hi','chest','race','eat']; // the ready-made messages on offer ('ufo' is only shown when an older app sent it)
const FL_EV={made:'filoyu kurdu',join:'filoya katıldı',left:'filodan ayrıldı',kicked:'filodan çıkarıldı',newcap:'yeni kaptan oldu',mis:'günlük filo görevini tamamladı',prec:'Günün Fırtınası\'nda rekorunu geliştirdi'};
const FL_ERR={short:'En az 3 karakter',long:'En fazla 16 karakter',chars:'Yalnızca harf, rakam, boşluk ve - . _ \'',link:'Bağlantı ve adres kullanılamaz',phone:'Telefon numarası gibi görünüyor',
  repeat:'Aynı harfi 3 kereden fazla tekrarlama',bad:'Bu isim kullanılamaz',reserved:'Bu kelime ayrılmış (admin, moderatör, resmi…)',taken:'Bu ad alınmış',member:'Zaten bir filodasın',
  made:'Haftada bir filo kurabilirsin',wait:'Bir filodan ayrıldıktan sonra 24 saat beklemelisin',nofleet:'Bu kodla filo bulunamadı',closed:'Bu filo yalnızca kodla katılıma açık',full:'Filo dolu',
  soon:'Adı 30 günde bir değiştirebilirsin',notcap:'Bunu yalnızca kaptan yapabilir',slow:'Biraz bekle',off:'Bağlantı yok, biraz sonra tekrar dene',emb:'Bir arma seç'};
const flOn=()=>rel(10)&&!!LB_URL,flE=s=>String(s==null?'':s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
const flN=n=>(+n||0).toLocaleString(LOC);
function flImg(k,c=''){const a=AVX[k],src=a&&window.BHS_SPR&&BHS_SPR.av[a[0]];return `<span class="fem ${c}">${src?`<img src="${src}" alt="">`:''}</span>`;}
function flLeft(ms){const m=Math.max(0,Math.round(ms/6e4)),d=Math.floor(m/1440),h=Math.floor(m%1440/60);return d?T('{d}g {h}s',{d,h}):h?T('{h}s {m}dk',{h,m:m%60}):T('{m}dk',{m});}
function flErr(e){return T(FL_ERR[e]||FL_ERR.off);}

function fleetInit(){if(!rel(10)||$('lbTF'))return;const b=document.createElement('button');b.id='lbTF';$('lbTW').after(b);b.onclick=()=>lbTab('f');
  const d=document.createElement('div');d.id='lbFleet';d.className='fx';d.hidden=true;$('lbWorld').after(d);$('sLB').classList.add('r11');}
function fleetTabs(){if(!$('lbTF'))return;$('lbTW').textContent='🌍 '+T('FIRTINA');$('lbTF').textContent='🛸 '+T('FİLO');$('lbTM').textContent='📜 '+T('REKORLAR');
}
// 1.5.0 (15 Oct): the Fleet is its own screen, opened from the FLEET button in the menu (it reuses the ranking window in 'fleet mode':
// own title, a ✕, four icons at the bottom: GÖREVLER (missions and FİLOM) · ÜYELER · YARIŞ · DAVET); the ranking window itself is back to Storm and Records
function fleetMode(on){natMark(on?'fleet':'fleet closed');const s=$('sLB');if(!s)return;s.classList.toggle('flm',!!on);flInvClose();
  if(on&&!$('flX')){const c=s.querySelector('.card'),x=document.createElement('button');x.id='flX';x.className='icb';x.setAttribute('aria-label',T('KAPAT'));x.textContent='✕';x.onclick=()=>$('lbClose').click();if(c)c.appendChild(x);}const h=s.querySelector('.card>.h');if(h){if(!h.dataset.t)h.dataset.t=h.textContent;if(on)h.innerHTML=ICO.svg('🛸')+' '+escH(T('FİLO'));else h.textContent=h.dataset.t;}}
function fleetOpen(tab){FLS=FL.fid?'main':(TIPS.flIntro?'main':'intro');FLT=tab&&tab!=='home'?tab:'tasks';FLI=0;fleetMode(true);showLB();lbTab('f');} /* the window opens over the menu: hiding the menu left a bare game screen after KAPAT (15 Oct) */ // from the menu strip or the level card

async function fleetFetch(force){
  if(!flOn())return null;if(!force&&FLV&&Date.now()-FL.at<60e3)return FLV;
  try{if(rel(10)&&(FL.fmq||[]).length)await fmFlush();const j=await lbFetch('/fleet?pid='+PID);FLV=j;FLE='';
    if(j.fleet){const f=j.fleet;Object.assign(FL,{fid:f.fid,name:f.name,emb:f.emb,pts:f.pts,tg:f.targets||[],race:f.race?1:0});if(f.mis)Object.assign(FL,{pts:f.mis.week,tg:f.mis.chestAt});}else FL.fid=''; /* 18 Oct: the chests are filled by mission points */
    FL.fmc=rel(10)&&fmChainReady(j.fm)?1:0;
    FL.prz=(j.prizes||[]).length+(j.dprizes||[]).length;FL.at=Date.now();saveSoon();fleetMenu();fleetTabs();return j;}
  catch(e){FLE='off';return null;}}

// points from play: queued and sent in chunks (the server allows 80 a call and 300 a day)
function fleetAdd(n,src){if(!rel(10)||!FL.fid||!(n>0))return;FLQ.n+=n;if(src)FLQ.src=src;if(!rel(11))FL.pts+=n;saveSoon();later0(fleetFlush,1500);}
const later0=(fn,ms)=>setTimeout(fn,ms); // not tied to a run: a level that ends still sends its points
async function fleetFlush(){if(FLQ.busy||FLQ.n<=0||!flOn())return;FLQ.busy=1;
  try{while(FLQ.n>0){const n=Math.min(80,FLQ.n),src=FLQ.src,mis=FLQ.mis?1:0;FLQ.src='';FLQ.mis=0;
      const j=await lbFetch('/fleet/pts',{pid:PID,day:utcDay(),n,src,mis,pname:playerName||'PİLOT',av:playerAvatar});
      if(j&&j.err==='nomember'){FL.fid='';FLQ.n=0;saveSoon();fleetMenu();break;}FLQ.n-=n;if(j&&j.ok&&!j.added){FLQ.n=0;break;}}} // the day's cap is reached
  catch(e){}FLQ.busy=0;}
// a cleared level: 10 points (20 in Hard Mode), 10 more for a boss or a peak level; the level card says so
function fleetLevel(){if(!rel(10)||!FL.fid||gameMode!=='classic'||REPLAY)return;const pk=(G2.L&&G2.L.boss)||(typeof v2Hard==='function'&&v2Hard(level)>0);
  const n=(HMODE?20:10)+(pk?10:0);fleetAdd(n);
  const d=utcDay();if(FL.mis.d!==d)FL.mis={d,p:0,cl:0};if(FL.mis.p<3){FL.mis.p++;if(FL.mis.p===3)FLQ.mis=1;}saveSoon();
  const r=$('lvlFlRow');if(r){r.hidden=false;r.innerHTML=`${flImg(FL.emb)}<b>+${n}</b> ${T('filo puanı')} · <span class="notr">${flE(FL.name)}</span>`;r.onclick=e=>{e.stopPropagation();fleetOpen();};}}
// the Daily Storm: 20 points for taking part, 10 more for each 5,000 points up to 60
function fleetStorm(score,rec){if(score>0)fleetAdd(20+Math.min(60,10*Math.floor(score/5000)),rec?'rec':'');}

const flHot=()=>!!FL.fid&&(FL.prz>0||FL.mis.d===utcDay()&&FL.mis.p>=3&&!FL.mis.cl||!!FL.fmc);
// the FLEET button in the menu (in REHBER's place, which moved to Settings): one pulsing badge when a fleet reward waits
function fleetBtn(){const b=$('flBtn');if(!b||!rel(10))return;b.hidden=false;const g=$('guideBtn');if(g)g.hidden=true;const sr=$('sGuideRow');if(sr)sr.hidden=false;
  const i=b.querySelector('i');if(i&&!i.dataset.nb){i.dataset.nb=1;i.innerHTML=ICO.badge('🤝').replace('class="ico"','class="nb"');b.classList.add('neon');}
  const lock=!flOn()||bestLevel<FL_LV,hot=!lock&&flHot(),e=$('flBadge'),t=$('flTxt');b.classList.toggle('lock',lock);
  if(e){e.textContent=hot?T('AL')+'!':'';e.className=hot?'hot':'';}if(t)t.textContent=lock&&flOn()?T('{n}. seviye',{n:FL_LV}):'';flRaceTick();}
// FLEET REMINDERS (Android app, local like the other reminders; nothing goes through a server): today's missions this evening
// if none was played, tomorrow's new missions, and the weekend race (Friday evening when it starts, Sunday evening before it ends)
function flNotifPlan(now){const L=[],at=(dd,h,m=0)=>{const d=new Date(now);d.setDate(d.getDate()+dd);d.setHours(h,m,0,0);return d.getTime();},fl=flE(FL.name||'');
  if(FL.fmd!==utcDay()&&at(0,18,30)>now+18e5)L.push({p:1.5,at:at(0,18,30),title:'🛸 '+T('Filo görevleri seni bekliyor'),body:T('Bugün 3 görev, her birinde 3 hak. {f} madalyanı bekliyor.',{f:fl})});
  L.push({p:1.5,at:at(1,18,30),title:'🛸 '+T('Yeni filo görevleri'),body:T('Bugünün 3 görevi hazır. Filo Zinciri için madalya topla!')});
  const r=flRaceT(now);
  if(!r.race){const fri=now+r.ms;const d=new Date(fri);d.setHours(19,0,0,0);if(d.getTime()<fri)d.setDate(d.getDate()+1);if(d.getTime()-now<7*864e5)L.push({p:1.5,at:d.getTime(),title:'🏁 '+T('Hafta sonu yarışı başladı'),body:T('{f} yarışta. Puan getir: ilk 3 filonun her üyesine büyük ödül.',{f:fl})});}
  else{const end=now+r.ms,d=new Date(end-6*36e5);d.setMinutes(0,0,0);if(d.getTime()>now+36e5)L.push({p:1.5,at:d.getTime(),title:'🏁 '+T('Yarışın bitmesine az kaldı'),body:T('{f} için son puanları getir.',{f:fl})});}
  return L;}
// the weekend race on the menu: a small two-line violet tag right under FİLO (the tournament's pill is cyan), counting to Friday 00:00 UTC, then (pink, pulsing) to the race's end
function flRaceT(now=Date.now()){const d=new Date(now),dow=(d.getUTCDay()+6)%7,mon=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-dow),fri=mon+4*864e5,end=mon+7*864e5;return now>=fri?{race:1,ms:end-now}:{race:0,ms:fri-now};}
function flRaceTick(){const b=$('flBtn');if(!b||b.hidden)return;let c=$('flRace');if(!c){c=document.createElement('b');c.id='flRace';b.appendChild(c);}
  const on=!!FL.fid&&!b.classList.contains('lock');c.hidden=!on;if(!on)return;const r=flRaceT();c.className=r.race?'on':'';c.innerHTML=`<span class="q">${T(r.race?'YARIŞ':'YARIŞA')}</span>${flLeft(r.ms)}`;
  c.style.marginLeft='';const q=c.getBoundingClientRect(),vw=document.documentElement.clientWidth,o=q.right-(vw-4);if(o>0)c.style.marginLeft=-o+'px';else if(q.left<4)c.style.marginLeft=(4-q.left)+'px';} // a long language never runs off the screen edge
// the strip under the player's name in the menu: emblem, fleet name, the week's chest bar
function fleetMenu(){fleetBtn();const s=$('menuSub');if(!s||!rel(10))return;s.onclick=null;s.classList.remove('fl','fljoin');
  if(FL.fid){const t=FL.tg&&FL.tg[2]||1,q=Math.min(1,FL.pts/t);s.classList.add('fl');
    s.innerHTML=`${flImg(FL.emb)}<b class="notr">${flE(FL.name)}</b><span class="fb"><i style="width:${Math.round(q*100)}%"></i></span><span class="fc">🎁</span>`;s.onclick=e=>{e.stopPropagation();fleetOpen();};}
  else if(flOn()&&bestLevel>=FL_LV){s.classList.add('fljoin');s.innerHTML=`🛸 ${T('Bir filoya katıl')}`;s.onclick=e=>{e.stopPropagation();fleetOpen();};}}

// the daily fleet mission, shown above the three daily missions
function fleetMission(){if(!rel(10)||!FL.fid)return '';const d=utcDay();if(FL.mis.d!==d)FL.mis={d,p:0,cl:0};const m=FL.mis,done=m.p>=3;
  return `<div class="dmr flm"><div class="x">🛸 ${T('Filon için {n} seviye geç',{n:3})}<small>${m.p} / 3 · ${T('filoya puan')}</small>${flPay(BHS_FMIS.PAY.mis)}<div class="bar"><i style="width:${Math.min(100,m.p/3*100)}%"></i></div></div>${m.cl?'<span class="ok">✅</span>':`<button id="flMisGo" ${done?'':'disabled'}>${T('AL')}</button>`}</div>`;}
function fleetMissionWire(){const b=$('flMisGo');if(b)b.onclick=()=>flMisClaim(b,renderDM);}
// 18 Oct: a fleet reward shown big: a gold tag with the stars and the diamonds
function flPay(p){return `<span class="flpay">🎁 <b>+${flN(p[0])}</b> ⭐${p[1]?` <b>+${p[1]}</b> 💎`:''}</span>`;}
// a claim: "+100 ⭐ +5 💎" rises from the button, the stars and diamonds fly from it into the wallet
function flClaimFx(btn,g){const t=[g.stars?`+${flN(g.stars)} ⭐`:'',g.gems?`+${g.gems} 💎`:''].filter(Boolean).join('  ');
  if(btn){btn.disabled=true;btn.classList.add('got');btn.textContent=t;const R=btn.getBoundingClientRect(),e=document.createElement('div');e.className='flmpop';e.textContent=t;
    e.style.left=Math.max(70,Math.min(innerWidth-70,R.left+R.width/2))+'px';e.style.top=(R.top-4)+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),1300);}
  flyReward(btn,{stars:g.stars,gems:g.gems});sfx('achieve',{vol:.55});vib([20,40,30]);}
// 18 Oct: the 30 stars of the daily fleet mission: the button says what it gives, a "+30 ⭐" rises from it and the stars fly into the wallet
function flMisClaim(btn,after){if(FL.mis.p<3||FL.mis.cl)return;const [st,gm]=BHS_FMIS.PAY.mis;FL.mis.cl=1;stars+=st;diamonds+=gm;saveG();
  flClaimFx(btn,{stars:st,gems:gm});fleetMenu();setTimeout(()=>{updateUI();after&&after();},1150);}

// the Fleet tab
async function fleetRender(){const w=$('lbFleet');if(!w)return;fleetTabs();
  if(!flOn()){w.innerHTML=`<div class="hero"><b>🛸 ${T('FİLO')}</b>${T('Filolar internet bağlantısı ister.')}</div>`;return;}
  if(bestLevel<FL_LV){w.innerHTML=`<div class="hero"><b>🛸 ${T('FİLO')}</b>${T('Filolar {n}. seviyede açılır. Bir filoya katıl: haftalık sandıklar ve hafta sonu yarışı seni bekliyor.',{n:FL_LV})}</div>`;return;}
  if(FLS==='intro'&&!FL.fid){w.innerHTML=fleetIntroH();fleetIntroWire();return;} // the benefit cards need no connection
  if(!FLV)w.innerHTML=`<div class="lbwait">${T('Yükleniyor…')}</div>`;
  const j=await fleetFetch(FLS==='main');if(!$('sLB').classList.contains('on'))return;
  if(!j){w.innerHTML=`<div class="hero"><b>🛸 ${T('FİLO')}</b>${flErr('off')}</div><div class="two"><button class="btn sec" id="flRetry">${T('TEKRAR DENE')}</button></div>`;$('flRetry').onclick=()=>fleetRender();return;}
  let h=fleetPrizes(j);
  if(FLS==='make')h+=fleetMakeH();else if(FLS==='code')h+=fleetCodeH();else if(FLS==='race')h+=await fleetRaceH();else if(FLS==='set')h+=fleetSetH(j);
  else if(!j.fleet)h+=fleetNoneH(j);
  else{if(FLT!=='tasks')h='';h+=FLT==='crew'?flCrewH(j):FLT==='race'?await fleetRaceH(1):FLT==='week'&&j.fleet.mis?await flWeekH(j):flTasksH(j);h+=flNavH();}
  w.innerHTML=h;fleetWire(j);}

function fleetPrizes(j){const D=j.dprizes||[],dt=z=>{try{return new Date(z.day+'T12:00:00Z').toLocaleDateString(LOC,{day:'numeric',month:'short',weekday:'short',timeZone:'UTC'});}catch(e){return z.day;}};
  const dz=D.length?`<div class="hero przc"><b>🏆 ${T('GÜNLÜK FİLO ÖDÜLLERİ')}</b>${D.map(z=>`<div class="rw"><span>${flE(dt(z))} · ${[z.rank?T('{r}. sıra',{r:z.rank}):'',z.star?'🌟 '+T('filonun yıldızı'):''].filter(Boolean).join(' · ')} · +${flN(z.stars)} ⭐${z.gems?` +${z.gems} 💎`:''}</span></div>`).join('')}
  <div class="two"><button class="btn" id="flDClaim">${T('TOPLA')} · +${flN(D.reduce((a,z)=>a+z.stars,0))} ⭐${D.some(z=>z.gems)?` +${D.reduce((a,z)=>a+z.gems,0)} 💎`:''}</button></div></div>`:'';
  return dz+(j.prizes||[]).map(z=>`<div class="hero przc">${flImg(z.emb,'big')}<b class="notr">${flE(z.name||'')}</b>
  ${z.rank?T('Hafta sonu yarışını {r}. bitirdi ({n} filo)',{r:z.rank,n:z.grpn}):T('Bu hafta {n} sandık açıldı',{n:z.tier})}${z.mine?` · ${T('senin katkın')} ${flN(z.mine)}`:''}
  <div class="rw">${z.tier?`<span>🎁 ${T('{n} sandık',{n:z.tier})}</span>`:''}${z.champ?`<span>🏆 ${T('haftanın şampiyonları: {r}.',{r:z.champ})}</span>`:''}${z.rank&&z.rank<=10?`<span>🏁 ${T('yarış')} ${z.rank}.</span>`:''}${z.top3?`<span>🏅 ${T('filonun en iyi 3\'ü')}</span>`:''}</div>
  <div class="rw"><span>+${flN(z.stars)} ⭐${z.gems?` +${z.gems} 💎`:''}${z.sh?` +${z.sh} 🛡️`:''}</span></div><div class="two"><button class="btn" data-claim="${z.wk}">${T('TOPLA')}</button></div></div>`).join('');}

// what a fleet gives, card by card: shown when the player taps "Join a fleet"; the last card offers to show them again.
// The numbers are the server's (server/fleet.js CHEST_PAY, RACE_PAY, TOP3_PAY) and the game's (fleetLevel, fleetMission).
function flCards(){const s=n=>flN(n)+' ⭐',g=n=>' + '+n+' 💎',P=BHS_FMIS.PAY;return [
  {i:'📋',t:'FİLO GÖREVLERİ',x:'Her gün 3 görev, herkese eşit donanım. En iyi sonucun görev puanına çevrilir: altın hedef 1.000 puan. Filonun puanı, oynayan üyelerin ortalamasıdır.',c:['🥇 = '+flN(1000)+' '+T('puan'),'📋 3 '+T('görev')+' / '+T('gün')]},
  {i:'🏆',t:'GÜNÜN FİLO SIRALAMASI',x:'Filolar her gün görev puanıyla sıralanır. İlk 10 filoda, o gün 3 görevi de oynayan her üye ödül alır. Filosuna en çok puan getiren üye günün yıldızı olur.',c:['🥇 '+s(P.day[0][0])+g(P.day[0][1]),'🥈 '+s(P.day[1][0])+g(P.day[1][1]),'🥉 '+s(P.day[2][0])+g(P.day[2][1]),'🌟 '+s(P.star[0])+g(P.star[1])]},
  {i:'🎁',t:'HAFTALIK SANDIKLAR',x:'Haftanın görev puanı biriktikçe 3 sandık açılır. Haftada en az 3 gün görevlerini tamamlayan her üye hepsini alır.',c:P.chest.map((c,i)=>'🎁 '+s(c[0])+(c[1]?g(c[1]):''))},
  {i:'🏆',t:'HAFTANIN ŞAMPİYONLARI',x:'Haftada en çok görev puanı toplayan 3 filo ödül alır. 7 günün en az 6’sında görevlerini tamamlayan üyeler kazanır.',c:['🥇 '+s(P.champ[0][0])+g(P.champ[0][1])+' + '+P.champ[0][2]+' 🛡️','🥈 '+s(P.champ[1][0])+g(P.champ[1][1]),'🥉 '+s(P.champ[2][0])+g(P.champ[2][1])]},
  {i:'🏁',t:'HAFTA SONU YARIŞI',x:'Cuma–Pazar filon 20 filoluk bir grupta yarışır. İlk 10 filo ödül alır; filonun en iyi 3 oyuncusuna ek ödül var.',c:['🥇 '+s(1500)+g(30),'🥈 '+s(1000)+g(20),'🥉 '+s(600)+g(10),'🏅 +'+s(200)]},
  {i:'📈',t:'EKSTRA ÖDÜL, KAYIP YOK',x:'Filo ödülleri normal ödüllerine ek gelir: rekorların, yıldızların ve sıralaman aynen kalır. Geçtiğin her seviye hafta sonu yarışı için filona puan kazandırır.',c:['+10–30 '+T('puan')+' / '+T('seviye'),'🌪️ +20–80 '+T('puan'),'📋 +'+s(P.mis[0])+g(P.mis[1])+' / '+T('gün')]},
  {i:'🤝',t:'BİRLİKTE DAHA GÜÇLÜ',x:'Filo duvarında arkadaşlarını gör, hazır mesajlarla destek ol, kimin ne kattığını izle. Katılmak ücretsiz, istediğin zaman ayrılabilirsin.',c:['👥 20 '+T('üye'),'🆓 '+T('ücretsiz')]}];}
function fleetIntroH(){const cs=flCards(),c=cs[FLI],last=FLI===cs.length-1;
  return `<div class="hero flin" id="flCard"><small>${T('FİLO AVANTAJLARI')} · ${FLI+1}/${cs.length}</small><i class="bdg">${ICO.badge(c.i)}</i><b>${T(c.t)}</b>${T(c.x)}
  <div class="rw">${c.c.map(x=>`<span class="notr">${flE(x).replace(ICO.re,m=>ICO.svg(m))}</span>`).join('')}</div><div class="dots">${cs.map((_,k)=>`<em class="${k===FLI?'on':''}"></em>`).join('')}</div></div>
  <div class="two">${last?`<button class="btn sec" id="flAgain">↺ ${T('TEKRAR GÖSTER')}</button><button class="btn" id="flSeen">${T('FİLOLARA BAK')} ›</button>`
    :`<button class="btn sec" id="flSeen">${T('ATLA')}</button><button class="btn" id="flNext">${T('İLERİ')} ›</button>`}</div>`;}
function fleetIntroWire(){const n=flCards().length,go=k=>{FLI=(k+n)%n;fleetRender();sfx('click');};
  if($('flNext'))$('flNext').onclick=()=>go(FLI+1);if($('flAgain'))$('flAgain').onclick=()=>go(0);$('flSeen').onclick=()=>{FLS='main';TIPS.flIntro=1;saveSoon();fleetRender();};
  const c=$('flCard');let x0=null;c.onclick=()=>{if(FLI<n-1)go(FLI+1);}; // a tap or a swipe turns the card
  c.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
  c.addEventListener('touchend',e=>{if(x0==null)return;const d=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(d)<40)return;const k=FLI+((d<0)!==(document.dir==='rtl')?1:-1);if(k>=0&&k<n)go(k);},{passive:true});}

function fleetNoneH(j){const canMake=bestLevel>=FL_MAKE_LV,wait=j.wait&&j.wait>Date.now();
  return `<div class="hero" style="padding:10px">${T('Filonla her gün görev yap, sandık aç, şampiyon ol. Ödüller sana da kalır.')}</div>
  ${wait?`<div class="flnote">⏳ ${T('Yeni bir filoya katılmak için')} ${flLeft(j.wait-Date.now())}</div>`:''}
  <div class="flbig"><div class="hero"><i>${ICO.badge('🤝')}</i><b>${T('FİLO KUR')}</b><small>${T('Kendi filonu kur, kaptanı ol')}</small>
    <small class="${canMake?'ok':'no'}">${canMake?`${T('{n}. seviye',{n:FL_MAKE_LV})} ✓`:T('{n}. seviyede açılır',{n:FL_MAKE_LV})} · ${diamonds} 💎</small>
    <button class="btn" id="flMake" ${canMake?'':'disabled'}>${T('KUR')} · ${FL_COST} 💎</button></div>
  <div class="hero"><i>${ICO.badge('🏁')}</i><b>${T('FİLOYA KATIL')}</b><small>${T('Açık bir filo seç ya da arkadaşının kodunu yaz')}</small><button class="btn" id="flCode">🔑 ${T('KODLA KATIL')}</button></div></div>
  <div class="sec"><span>${T('AÇIK FİLOLAR')}</span><b>${T('yer var')}</b></div>
  ${(j.open||[]).map(f=>`<div class="row2">${flImg(f.emb)}<span class="nm"><b class="notr">${flE(f.name)}</b><small>${f.n}/20 ${T('üye')} · ${flN(f.pts)} ${T('puan')}</small></span><button class="go" data-join="${f.fid}">${T('KATIL')}</button></div>`).join('')||`<div class="lbwait">${T('Henüz açık filo yok. İlk filoyu sen kur!')}</div>`}
  <div class="flnote" id="flMsg"></div><div class="two"><button class="btn sec" id="flIntro">✨ ${T('Filo avantajları')}</button></div>`;}

function fleetMakeH(){return `<div class="hero" style="text-align:start"><b>➕ ${T('FİLO KUR')}</b>${T('Filonun adını ve armasını seç. Kurmak {n} 💎.',{n:FL_COST})}</div>
  <div class="sec"><span>${T('FİLO ADI')}</span><b id="flCnt">0/16</b></div><input class="inp notr" id="flName" maxlength="24" autocomplete="off" spellcheck="false" dir="auto"><div class="flnote" id="flNameE"></div>
  <div class="sec"><span>${T('ARMA')}</span></div><div class="embs">${FL_EMB.map((k,i)=>`<button class="${i?'':'on'}" data-emb="${k}">${flImg(k)}</button>`).join('')}</div>
  <div class="sec"><span>${T('KİMLER KATILABİLİR')}</span></div><div class="tog"><button class="on" data-open="1">🌍 ${T('HERKES')}</button><button data-open="0">🔑 ${T('YALNIZCA KODLA')}</button></div>
  <div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button><button class="btn" id="flMakeGo" ${diamonds<FL_COST?'disabled':''}>${T('KUR')} · ${FL_COST} 💎</button></div><div class="flnote" id="flMsg"></div>`;}
function fleetCodeH(){return `<div class="hero" style="text-align:start"><b>🔑 ${T('KODLA KATIL')}</b>${T('Kodu filodaki bir arkadaşın verir: kendi Filo sayfasındaki 📤 DAVET GÖNDER ile sana WhatsApp, Telegram ya da SMS ile yollar.')}</div>
  <div class="fcin"><input class="inp notr" id="flCodeIn" maxlength="400" autocomplete="off" spellcheck="false" placeholder="K7Q-2MX"><button class="btn sec" id="flPaste">${T('YAPIŞTIR')}</button></div>
  <div class="flnote tip">${T('Kodu ya da gelen mesajın tamamını yapıştırabilirsin; kod kendiliğinden bulunur.')}</div>
  <div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button><button class="btn" id="flCodeGo">${T('KATIL')}</button></div><div class="flnote" id="flMsg"></div>`;}

// 1.5.0 (16 Oct): four icons at the bottom, the same place on every page: GÖREVLER (the missions, the chain and FİLOM) · ÜYELER · YARIŞ · DAVET
// (DAVET is not a page: it opens the code and the share button over the page you are on)
const FLT_ALL=[['tasks','GÖREVLER','📋'],['week','HAFTA','📅'],['crew','ÜYELER','🤝'],['race','YARIŞ','🏁'],['inv','DAVET','✉️']]; // 18 Oct: HAFTA (the chests, the champions, your days)
function flNavH(){return `<div class="flnav">${FLT_ALL.map(([k,t,i])=>`<button data-flt="${k}" class="${k===FLT?'on':''}">${ICO.svg(i)}<span>${T(t)}</span></button>`).join('')}</div>`;}
// the daily fleet mission card: three levels for the fleet today, 30 stars
function flMisH(){const d=utcDay();if(FL.mis.d!==d)FL.mis={d,p:0,cl:0};const m=FL.mis,done=m.p>=3;
  return `<div class="hero flmis"><b>📋 ${T('GÜNLÜK FİLO GÖREVİ')}</b>${T('Bugün filon için {n} seviye geç',{n:3})}${flPay(BHS_FMIS.PAY.mis)}
  <div class="bar"><i style="width:${Math.min(100,m.p/3*100)}%"></i></div><div class="mr"><small>${T('{n} / 3 seviye',{n:m.p})}</small>${m.cl?'<span class="ok">✅</span>':`<button class="go" id="flMisGo2" ${done?'':'disabled'}>${T('TOPLA')}</button>`}</div></div>`;}
function flHeadH(j){const f=j.fleet,cap=(j.members||[]).find(m=>m.cap);
  return `${f.hidden&&f.cap?`<div class="flnote warn">⚠️ ${T('Filonun adı bildirildi ve gizlendi. Yeni bir ad seç.')} <button class="go" id="flRen">${T('AD DEĞİŞTİR')}</button></div>`:''}
  <div class="fc sm">${flImg(f.emb)}<span class="t"><b class="notr">${flE(f.name)}</b><small>${f.n}/${f.max} ${T('üye')} · ${T('Kaptan')}: <span class="notr">${flE(cap?cap.name:'')}</span></small></span></div>`;}
function flStatH(f){const now=Date.now();return `<div class="stat"><div><b>#${f.rank||'–'}</b><small>${f.race?T('yarışta'):T('bu hafta')} / ${f.of||1}</small></div><div><b>${flN(f.pts)}</b><small>${T('filo puanı')}</small></div><div><b>${flLeft((f.race?f.ends:f.raceFrom)-now)}</b><small>${f.race?T('yarışın bitişi'):T('yarışa kalan')}</small></div></div>`;}
function flChestBarH(f){const t=f.targets||[1,1,1],top=t[2]||1;
  return `<div class="flbox"><div class="h"><span>🎁 ${T('HAFTALIK SANDIKLAR')}</span><b dir="ltr">${flN(f.pts)} / ${flN(top)}</b></div>
  <div class="bar"><i style="width:${Math.min(100,f.pts/top*100)}%"></i>${t.map((x,i)=>`<span class="ck${f.pts>=x?' got':''}" style="left:${Math.min(97,x/top*100)}%">${i===2?'👑':'🎁'}</span>`).join('')}</div>
  <div class="barl">${t.map((x,i)=>`<span style="${i===2?'right:0':`left:${x/top*100}%;transform:translateX(-50%)`}">${flN(x)}${f.pts>=x?' ✓':''}</span>`).join('')}</div>
</div>`;}
// GÖREVLER (the first page): today's missions and the Fleet Chain, then FİLOM: the week's standing, the chests and the daily fleet mission
function flTasksH(j){const f=j.fleet,left=Date.parse(utcDay()+'T00:00:00Z')+864e5-Date.now();
  return `<div class="flfit">${f.hidden&&f.cap?`<div class="flnote warn">⚠️ ${T('Filonun adı bildirildi ve gizlendi. Yeni bir ad seç.')} <button class="go" id="flRen">${T('AD DEĞİŞTİR')}</button></div>`:''}${rel(10)&&j.fm?flFmH(j.fm,left,f.mis):''}
  <div class="flsep">${flImg(f.emb)}<span class="notr">${flE(f.name)}</span></div>${f.mis?flDayH(j):flStatH(f)+flChestBarH(f)}${flMisH()}<div class="flnote" id="flMsg"></div></div>`;} /* 16 Oct: the first page fits one screen */
// 18 Oct: the day in mission points: the fleet's points and place today, today's star, the top of the day's ranking (filled when it comes)
function flDayH(j){const M=j.fleet.mis,P=BHS_FMIS.PAY,st=(j.members||[]).find(m=>m.star),done=M.days[(new Date().getUTCDay()+6)%7]==='y';
  return `<div class="flday"><div class="dh"><span>${T('BUGÜNKÜ FİLO PUANI')}</span><b>${flN(M.day)}</b></div>
  <small>${M.drank?T('{r}. sıra · {n} filo',{r:M.drank,n:M.dof}):T('Henüz puan yok')} · ${done?`<span class="ok">✓ ${T('3 görevin tamam')}</span>`:T('Ödül için 3 görevi de oyna')}</small>
  <div class="dtop" id="flDayTop"></div></div>
  ${st?`<div class="flstar">${avHtml(st.av)}<i>🌟</i><span><small>${T('FİLONUN YILDIZI · BUGÜN')}</small><b class="notr">${flE(st.name)}</b> · ${T('{n} puan',{n:flN(st.mp)})}</span><em>+${P.star[0]} ⭐<br>+${P.star[1]} 💎</em></div>`:''}`;}
// the day's ranking and the week's champions, from the server once a minute at most
async function flBoards(force){if(!force&&FLV&&FLV.boards&&Date.now()-FLV.boards.at<60e3)return FLV.boards;try{const r=await lbFetch('/fleets/fm?pid='+PID);if(r&&r.ok){r.at=Date.now();if(FLV)FLV.boards=r;return r;}}catch(e){}return null;}
function flBoardRows(b,pay,n){const md=['🥇','🥈','🥉'],P=BHS_FMIS.PAY,L=b.list.slice(0,n),me=b.me&&!L.some(x=>x.me)?b.me:null;
  return L.map(x=>`<div class="row2${x.me?' mine':''}"><span class="rk">${md[x.r-1]||x.r}</span>${flImg(x.emb)}<span class="nm"><b class="notr">${flE(x.name)}</b>${pay&&pay(x.r)?`<small>${pay(x.r)}</small>`:''}</span><span class="pt">${flN(x.v)}</span></div>`).join('')
    +(me?`<div class="row2 mine"><span class="rk">${me.r}</span>${flImg(FL.emb)}<span class="nm"><b class="notr">${flE(FL.name)}</b></span><span class="pt">${flN(me.v)}</span></div>`:'');}
async function flDayFill(){const box=$('flDayTop');if(!box)return;const b=await flBoards();if(!b||!$('flDayTop'))return;const P=BHS_FMIS.PAY;
  box.innerHTML=b.day.list.length?flBoardRows(b.day,r=>P.day[r-1]?`+${P.day[r-1][0]} ⭐${P.day[r-1][1]?' +'+P.day[r-1][1]+' 💎':''}`:'',3):'';}
// HAFTA: the week's mission points and chests, the champions, your full days, what the fleet has given you this week
async function flWeekH(j){const M=j.fleet.mis,P=BHS_FMIS.PAY,b=await flBoards(),top=P.chestAt[2],now=Date.now(),wkEnd=j.fleet.ends;
  const tier=P.chestAt.filter(x=>M.week>=x).length,y=M.days.filter(x=>x==='y').length,open=M.days.filter(x=>x===''||x==='t').length;
  let ps=0,pg=0,psh=0;if(y+open>=P.chestDays)for(let k=0;k<tier;k++){ps+=P.chest[k][0];pg+=P.chest[k][1];}
  if(y+open>=P.champDays&&M.wrank>=1&&M.wrank<=3){const c=P.champ[M.wrank-1];ps+=c[0];pg+=c[1];psh+=c[2];}
  const mon=Date.UTC(2026,0,5),dl=i=>{let d='';try{d=new Date(mon+i*864e5).toLocaleDateString(LOC,{weekday:'short',timeZone:'UTC'});}catch(e){}return flE(d.replace('.','').toUpperCase());};
  const need=Math.max(0,P.champDays-y),msg=need===0?T('Şampiyonluk ödülü için günlerin tamam.'):need>open?T('Bu hafta şampiyonluk ödülü için gün kalmadı; sandıklar için {n} gün yeter.',{n:P.chestDays}):T('Şampiyonluk ödülü için {n} gün daha görevlerini tamamla.',{n:need});
  const champ=r=>P.champ[r-1]?`+${flN(P.champ[r-1][0])} ⭐ +${P.champ[r-1][1]} 💎${P.champ[r-1][2]?` +${P.champ[r-1][2]} 🛡️`:''}`:'';
  return `<div class="flbox flwk"><div class="h"><span>🎁 ${T('HAFTALIK GÖREV PUANI')}</span><b dir="ltr">${flN(M.week)} / ${flN(top)}</b></div>
    <div class="bar"><i style="width:${Math.min(100,M.week/top*100)}%"></i>${P.chestAt.map((x,i)=>`<span class="ck${M.week>=x?' got':''}" style="left:${Math.min(97,x/top*100)}%">${i===2?'👑':'🎁'}</span>`).join('')}</div>
    <div class="barl">${P.chestAt.map((x,i)=>`<span style="${i===2?'right:0':`left:${x/top*100}%;transform:translateX(-50%)`}">${flN(x)}${M.week>=x?' ✓':''}</span>`).join('')}</div>
    <small>${T('Sandıklar, haftada en az {n} gün görevlerini tamamlayan üyelere açılır.',{n:P.chestDays})} · ${T('bitişe {t}',{t:flLeft(wkEnd-now)})}</small></div>
  <div class="sec"><span>${T('HAFTANIN ŞAMPİYONLARI')}</span><b>${M.wrank?T('{r}. sıra · {n} filo',{r:M.wrank,n:M.wof}):''}</b></div>
  ${b&&b.week.list.length?flBoardRows(b.week,champ,10):`<div class="lbwait">${b?T('Henüz puan yok.'):flErr('off')}</div>`}
  <div class="sec"><span>${T('GÖREV GÜNLERİN')}</span><b>${T('ödül için {a}/{b} gün',{a:P.champDays,b:7})}</b></div>
  <div class="fldays">${M.days.map((x,i)=>`<span class="${x}"><small>${dl(i)}</small><b>${x==='y'?'✓':x==='p'?'½':x==='n'?'✕':'·'}</b></span>`).join('')}</div>
  <div class="flnote tip">${msg}</div>
  <div class="flearn"><span>${T('Bu hafta filodan kazandıkların')}<small>${T('şu anki durumla hafta sonunda')}</small></span><b>${flN(M.earned.stars)} ⭐ · ${M.earned.gems} 💎<small>+${flN(ps)} ⭐ · +${pg} 💎${psh?` · +${psh} 🛡️`:''}</small></b></div>
  <div class="flnote tip">🏁 ${T('Hafta sonu yarışı (Cuma–Pazar) oyun puanlarıyla devam ediyor.')}</div><div class="flnote" id="flMsg"></div>`;}

// ÜYELER: the week's contribution, who played today, the captain; the top three are on course for the race's +200; the wall and the ready messages
function flCrewH(j){const f=j.fleet,day=!!f.mis,M=day?(j.members||[]).slice().sort((a,b)=>(b.mp||0)-(a.mp||0)||(b.pts||0)-(a.pts||0)):j.members||[],v=m=>day?m.mp||0:m.pts||0,top=Math.max(1,...M.map(v)),today=M.filter(m=>m.today||m.g).length,md=['🥇','🥈','🥉'];
  return `${flHeadH(j)}<div class="sec"><span>${day?T('ÜYELER · BUGÜNKÜ GÖREV PUANI'):T('ÜYELER · BU HAFTA')}</span><b>${T('bugün oynayan {n}/{m}',{n:today,m:M.length})}</b></div>
  ${M.map((m,i)=>`<div class="row2 mem${m.me?' mine':''}"><span class="rk">${i<3&&v(m)>0?md[i]:i+1}</span>${avHtml(m.av)}<span class="nm"><b><span class="notr">${flE(m.name)}</span>${m.cap?' 👑':''}${m.star?' 🌟':''}${m.me?` <i class="chip p">${T('SEN')}</i>`:''}${m.g?` <i class="chip ${m.g>=3?'t':'g'}" dir="ltr">${m.g>=3?'✓ ':''}${m.g}/3</i>`:m.today?` <i class="chip t">✓ ${T('bugün')}</i>`:''}${m.away?` <i class="chip z">💤</i>`:''}</b><span class="mb"><i style="width:${Math.round(v(m)/top*100)}%"></i></span></span><span class="pt">${flN(v(m))}</span>${f.cap&&!m.me?`<button class="kick" data-kick="${m.k}" aria-label="${T('Filodan çıkar')}">✕</button>`:''}</div>`).join('')}
  <div class="flnote tip">🏅 ${T('Hafta sonu en çok puan getiren 3 üyeye ek +{n} ⭐',{n:200})}<br>${T('Normal seviye +10 · Zor +20 · boss +10 · Günün Fırtınası +20–80 · günde en fazla 300')}${rel(11)?'<br>🌟 '+T('Bugün filosuna en çok görev puanı getiren üye filonun yıldızıdır'):rel(10)?'<br>'+T('Filo görevlerinin madalyaları bu sınırın dışında sayılır'):''}</div>
  <div class="sec"><span>${T('FİLO DUVARI')}</span><b>${T('hazır mesajlar')}</b></div>
  <div class="wall">${(j.wall||[]).slice(-6).map(flWall).join('')||`<div class="ev">${T('Henüz mesaj yok.')}</div>`}</div>
  <div class="emo">${FL_CHIPS.map(k=>`<button data-msg="${k}">${T(FL_MSG[k])}</button>`).join('')}</div>
  <div class="two">${f.cap?`<button class="btn sec" id="flSet">⚙️ ${T('AYARLAR')}</button>`:''}<button class="btn sec" id="flLeave">${T('AYRIL')}</button></div><div class="flnote" id="flMsg"></div>`;}
function flWall(w){const m=String(w.m||''),n=+m.split(':')[1]||0;
  if(FL_MSG[m])return `<div><b class="notr">${flE(w.name)}:</b> ${T(FL_MSG[m])}</div>`;
  if(m.startsWith('chest:'))return `<div class="ev nw">🎁 ${T('{n}. sandık açıldı!',{n})}</div>`;
  if(m.startsWith('rank:'))return `<div class="ev nw">🏁 ${T('Filo yarışta {n}. sıraya yükseldi',{n})}</div>`;
  if(m.startsWith('drank:'))return `<div class="ev nw">🏆 ${T('Filo dünün görev sıralamasında {n}. oldu',{n})}</div>`;
  if(m==='fstar')return `<div class="ev nw">🌟 <b class="notr">${flE(w.name)}</b> ${T('dünün filo yıldızı oldu')}</div>`;
  if(m.startsWith('fmg:')){const g=globalThis.BHS_FMIS&&BHS_FMIS.byId(m.slice(4));return g?`<div class="ev nw">🥇 <b class="notr">${flE(w.name)}</b> ${T('altın madalya aldı')}: ${T(g.n)}</div>`:'';}
  return FL_EV[m]?`<div class="ev"><b class="notr">${flE(w.name)}</b> ${T(FL_EV[m])}</div>`:'';}
function fleetSetH(j){const f=j.fleet;return `<div class="hero" style="text-align:start"><b>⚙️ ${T('FİLO AYARLARI')}</b>${T('Yalnızca kaptan görür.')}</div>
  <div class="sec"><span>${T('FİLO ADI')}</span><b>${f.freeRename?T('bir kez ücretsiz'):FL_RENAME+' 💎'}</b></div><input class="inp notr" id="flName" maxlength="24" value="${flE(f.hidden?'':f.name)}" dir="auto"><div class="flnote" id="flNameE"></div>
  <div class="two"><button class="btn" id="flRenGo">${T('ADI KAYDET')}${f.freeRename?'':` · ${FL_RENAME} 💎`}</button></div>
  <div class="sec"><span>${T('ARMA')}</span></div><div class="embs">${FL_EMB.map(k=>`<button class="${k===f.emb?'on':''}" data-emb="${k}">${flImg(k)}</button>`).join('')}</div>
  <div class="sec"><span>${T('KİMLER KATILABİLİR')}</span></div><div class="tog"><button class="${f.open?'on':''}" data-open="1">🌍 ${T('HERKES')}</button><button class="${f.open?'':'on'}" data-open="0">🔑 ${T('YALNIZCA KODLA')}</button></div>
  <div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button></div><div class="flnote" id="flMsg"></div>`;}

// YARIŞ: the countdown and the week (Mon–Thu: points decide your group; Fri–Sun: the race), the prizes, then the world's week or your race group
async function fleetRaceH(inTab){let j;try{j=await lbFetch('/fleets/top?pid='+PID);}catch(e){return `<div class="hero">${flErr('off')}</div>${inTab?'':`<div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button></div>`}`;}
  const now=Date.now(),L=j.list||[],me=L.find(x=>x.me),dow=(new Date(now).getUTCDay()+6)%7,mon=Date.UTC(2026,0,5);
  const days=Array.from({length:7},(_,i)=>{let d='';try{d=new Date(mon+i*864e5).toLocaleDateString(LOC,{weekday:'short',timeZone:'UTC'});}catch(e){}return `<span class="${i>=4?'r':''}${i===dow?' now':''}">${flE(d.replace('.','').toUpperCase())}</span>`;}).join('');
  const above=me&&me.r>1?L[me.r-2]:null,gap=above?above.pts-me.pts:0,need=j.need||3,got=Math.min(need,j.racers||0),S=n=>flN(n)+' ⭐',G=n=>' + '+n+' 💎';
  return `<div class="flrace${j.race?' live':''}"><div class="h">${ICO.svg('🏁')}<div><small>${j.race?T('YARIŞ SÜRÜYOR · BİTİŞE'):T('YARIŞA KALAN')}</small><b>${flLeft((j.race?j.ends:j.raceFrom)-now)}</b></div>${me?`<div class="side"><small>${j.race?T('grubunda'):T('bu hafta')}</small><b>#${me.r}${j.race?' / '+L.length:''}</b></div>`:''}</div>
    <div class="wk">${days}</div>${j.race&&j.racers!=null?`<div class="req">${T('Sıralanmak için {n} üye puan getirmeli',{n:need})}: ${Array.from({length:need},(_,i)=>`<i class="${i<got?'':'o'}">${i<got?'✓':i+1}</i>`).join('')} <b dir="ltr">${got}/${need}</b></div>`:`<div class="wkl"><span>${T('Pzt–Per: puan topla, grubunu belirle')}</span><b>${T('Cum–Paz: yarış')}</b></div>`}</div>
  <div class="sec"><span>${T('ÖDÜLLER · FİLONUN HER ÜYESİNE')}</span></div>
  <div class="prz"><div>🥇<b>${S(1500)}</b><small>${G(30)}</small></div><div>🥈<b>${S(1000)}</b><small>${G(20)}</small></div><div>🥉<b>${S(600)}</b><small>${G(10)}</small></div><div>🏅<b>${S(300)}</b><small>4.–10.</small></div></div>
  <div class="flnote tip">🏅 ${T('Filonun en iyi 3 oyuncusuna ayrıca +{n} ⭐',{n:200})}</div>
  <div class="sec"><span>${j.race?T('GRUBUN · {n} FİLO',{n:L.length}):T('FİLOLAR · BU HAFTA')}</span><b>${j.race?T('benzer güçte'):T('dünya, ilk 50')}</b></div>
  ${L.map(x=>`<div class="row2${x.me?' mine':''}"><span class="rk">${['🥇','🥈','🥉'][x.r-1]||x.r}</span>${flImg(x.emb)}<span class="nm"><b class="notr">${flE(x.name)}</b><small>${x.n}/20 ${T('üye')}${x.me&&gap>0?` · <span class="gap">${T('{r}. sıraya {n} puan',{r:x.r-1,n:flN(gap)})}</span>`:''}</small></span><span class="pt">${flN(x.pts)}</span></div>`).join('')||`<div class="lbwait">${T('Henüz puan yok.')}</div>`}
  ${inTab?'':`<div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button></div>`}`;}
// DAVET: the fleet code and the phone's share sheet in a window over the page you are on
function flInvClose(){const o=$('flInv');if(o)o.remove();}
function flInvOpen(j){flInvClose();const f=j&&j.fleet;if(!f)return;const code=String(f.code||'').replace(/^(...)(...)$/,'$1-$2'),full=f.n>=f.max;
  const o=document.createElement('div');o.className='fm-ov';o.id='flInv';
  o.innerHTML=`<div class="fm-card flinv"><button class="icb x" id="flInvX" aria-label="${T('KAPAT')}">✕</button><div class="big">${ICO.svg('✉️')}</div><h3>${T('ARKADAŞINI FİLOYA ÇAĞIR')}</h3>
    ${full?`<p>${T('Filon dolu ({n}/{m})',{n:f.n,m:f.max})}</p>`:`<p>${T('Arkadaşın oyunda Filo › Kodla katıl’a bu kodu yazar.')}</p><div class="code notr">${code}</div>
    <div class="row"><button class="b2" id="flInvCopy">${T('KOPYALA')}</button><button class="b1" id="flInvShare">📤 ${T('DAVET GÖNDER')}</button></div>
    <div class="fm-note" id="flInvMsg">${T('WhatsApp, Telegram ya da SMS ile gönder.')}</div>`}</div>`;
  document.body.appendChild(o);sfx('click',{vol:.4});const msg=t=>{const e=$('flInvMsg');if(e)e.textContent=t;};
  o.onclick=e=>{if(e.target===o)flInvClose();};$('flInvX').onclick=flInvClose;
  if(full)return;
  $('flInvShare').onclick=async()=>{const txt=['🛸 '+T('{f} filosuna katıl!',{f:f.name}),T('Blackhole Storm’da birlikte sandık açıp hafta sonu yarışalım.'),T('Filo kodu: {c}',{c:code}),T('Oyunda: Filo › Kodla katıl (filolar {n}. seviyede açılır)',{n:FL_LV})].join('\n');
    const out=await shareOut(txt,NATIVE?'https://play.google.com/store/apps/details?id=com.liaslabs.blackholestorm':APP_URL);if(out==='copied')msg(T('Davet kopyalandı: WhatsApp’a yapıştırıp gönder'));else if(out==='fail')msg(code);};
  $('flInvCopy').onclick=async()=>{try{await navigator.clipboard.writeText(code);msg(T('Kod kopyalandı'));}catch(e){msg(code);}};}
function flMsg(t,ok){const e=$('flMsg');if(e){e.textContent=t;e.classList.toggle('good',!!ok);}}
function fleetNameCheck(){const i=$('flName'),e=$('flNameE');if(!i||!e)return null;const r=BHS_NAMES.check(i.value,'fleet'),wv=BHS_NAMES.width(BHS_NAMES.tidy(i.value)),c=$('flCnt');
  if(c)c.textContent=wv+'/16';e.textContent=i.value.trim()?(r.ok?'✓':'✕ '+flErr(r.err)):'';e.classList.toggle('good',r.ok);return r;}
function fleetWire(j){const w=$('lbFleet'),q=s=>w.querySelector(s),all=s=>w.querySelectorAll(s);
  const go=async(path,body,after)=>{flMsg('…');try{const r=await lbFetch(path,body);if(r&&r.ok){after&&after(r);}else flMsg(flErr(r&&r.err));return r;}catch(e){flMsg(flErr('off'));return null;}};
  all('[data-claim]').forEach(b=>b.onclick=()=>go('/fleet/claim',{pid:PID,wk:b.dataset.claim},r=>{if(r.stars||r.gems||r.sh)grant({stars:r.stars,gems:r.gems,shield:r.sh||0},'🛸 '+T('FİLO ÖDÜLÜ'));FLV=null;fleetRender();}));
  if(q('#flDClaim'))q('#flDClaim').onclick=async()=>{const b=q('#flDClaim');if(b.disabled)return;b.disabled=true;let st=0,gm=0; // every waiting day at once
    for(const z of j.dprizes||[]){try{const r=await lbFetch('/fleet/dclaim',{pid:PID,day:z.day});if(r&&r.ok){st+=r.stars;gm+=r.gems;}}catch(e){}}
    if(st||gm)grant({stars:st,gems:gm},'🏆 '+T('GÜNLÜK FİLO ÖDÜLLERİ'));FLV=null;fleetRender();};
  if(q('#flDayTop'))flDayFill();
  if(q('#flBack'))q('#flBack').onclick=()=>{FLS='main';fleetRender();};
  all('[data-flt]').forEach(b=>b.onclick=()=>{if(b.dataset.flt==='inv'){flInvOpen(j);return;}FLT=b.dataset.flt;FLS='main';fleetRender();$('sLB').scrollTop=0;});
  if(q('#flMisGo2'))q('#flMisGo2').onclick=()=>flMisClaim(q('#flMisGo2'),fleetRender);
  all('[data-fm]').forEach(b=>b.onclick=()=>fmPlay(b.dataset.fm));all('[data-fmi]').forEach(b=>b.onclick=()=>fmAsk(b.dataset.fmi));
  if(q('#fmChain'))q('#fmChain').onclick=()=>{const b=q('#fmChain');if(b.disabled)return;b.disabled=true;go('/fleet/fmchain',{pid:PID},r=>{const g={stars:r.stars||0,gems:r.gems||0};
    if(g.stars||g.gems){stars+=g.stars;diamonds+=g.gems;saveG();flClaimFx(b,g);}FL.fmc=0;fleetMenu();setTimeout(()=>{updateUI();FLV=null;fleetRender();},1150);}).then(r=>{if(!r||!r.ok)b.disabled=false;});};
  if(q('#flIntro'))q('#flIntro').onclick=()=>{FLS='intro';FLI=0;fleetRender();};
  if(q('#flMake'))q('#flMake').onclick=()=>{FLS='make';fleetRender();};
  if(q('#flCode'))q('#flCode').onclick=()=>{FLS='code';fleetRender();};
  if(q('#flRace'))q('#flRace').onclick=()=>{FLS='race';fleetRender();};
  if(q('#flSet'))q('#flSet').onclick=()=>{FLS='set';fleetRender();};
  if(q('#flRen'))q('#flRen').onclick=()=>{FLS='set';fleetRender();};
  all('[data-join]').forEach(b=>b.onclick=()=>go('/fleet/join',{pid:PID,fid:b.dataset.join,pname:playerName||'PİLOT',av:playerAvatar},()=>{if(rel(11))evOnce('fl_join');FLS='main';FLV=null;fleetRender();}));
  if(q('#flCodeGo'))q('#flCodeGo').onclick=()=>go('/fleet/join',{pid:PID,code:q('#flCodeIn').value,pname:playerName||'PİLOT',av:playerAvatar},()=>{if(rel(11))evOnce('fl_join');FLS='main';FLV=null;fleetRender();});
  let emb=(j.fleet&&j.fleet.emb)||FL_EMB[0],open=j.fleet?j.fleet.open:true;
  all('[data-emb]').forEach(b=>b.onclick=()=>{emb=b.dataset.emb;all('[data-emb]').forEach(x=>x.classList.toggle('on',x===b));if(FLS==='set')go('/fleet/set',{pid:PID,emb},()=>{FL.emb=emb;flMsg('✓',1);fleetMenu();});});
  all('[data-open]').forEach(b=>b.onclick=()=>{open=b.dataset.open==='1';all('[data-open]').forEach(x=>x.classList.toggle('on',x===b));if(FLS==='set')go('/fleet/set',{pid:PID,open},()=>flMsg('✓',1));});
  if(q('#flName')){q('#flName').oninput=fleetNameCheck;fleetNameCheck();}
  if(q('#flMakeGo'))q('#flMakeGo').onclick=()=>{const r=fleetNameCheck();if(!r||!r.ok){flMsg(flErr(r?r.err:'short'));return;}if(diamonds<FL_COST){flMsg(T('Yetersiz elmas'));return;}
    go('/fleet/create',{pid:PID,name:r.name,emb,open,pname:playerName||'PİLOT',av:playerAvatar},()=>{if(rel(11))evOnce('fl_join');diamonds-=FL_COST;saveG();updateUI();sfx('achieve',{vol:.6});FLS='main';FLV=null;fleetRender();});};
  if(q('#flRenGo'))q('#flRenGo').onclick=()=>{const r=fleetNameCheck(),free=j.fleet&&j.fleet.freeRename;if(!r||!r.ok){flMsg(flErr(r?r.err:'short'));return;}if(!free&&diamonds<FL_RENAME){flMsg(T('Yetersiz elmas'));return;}
    go('/fleet/rename',{pid:PID,name:r.name},x=>{if(!x.free){diamonds-=FL_RENAME;saveG();updateUI();}FL.name=r.name;FLS='main';FLV=null;fleetRender();fleetMenu();});};
  all('[data-msg]').forEach(b=>b.onclick=()=>go('/fleet/msg',{pid:PID,m:b.dataset.msg},()=>{FLV=null;fleetRender();}));
  all('[data-kick]').forEach(b=>b.onclick=()=>{if(!b.classList.contains('ask')){b.classList.add('ask');b.textContent=T('ÇIKAR?');return;}go('/fleet/kick',{pid:PID,k:b.dataset.kick},()=>{FLV=null;fleetRender();});});
  // a pasted message is searched for the code (three letters or digits, a dash, three more)
  const cIn=q('#flCodeIn'),pick=v=>{const u=String(v).toUpperCase(),d=u.match(/\b([A-Z0-9]{3})-([A-Z0-9]{3})\b/);if(d)return d[1]+'-'+d[2];const c=u.replace(/[^A-Z0-9]/g,'');return c.length===6?c.slice(0,3)+'-'+c.slice(3):'';};
  if(cIn)cIn.oninput=()=>{if(cIn.value.length>7){const c=pick(cIn.value);if(c)cIn.value=c;}};
  if(q('#flPaste'))q('#flPaste').onclick=async()=>{try{const v=await navigator.clipboard.readText();const c=pick(v);if(c){cIn.value=c;flMsg('',0);}else flMsg(T('Panoda filo kodu yok'));}catch(e){cIn.focus();flMsg(T('Kutuya uzun bas › Yapıştır'));}};
  if(q('#flLeave'))q('#flLeave').onclick=()=>{const b=q('#flLeave'),last=j.fleet.n<=1;if(!b.classList.contains('ask')){b.classList.add('ask');b.textContent=last?T('FİLO KAPANACAK, EMİN MİSİN?'):T('AYRIL?');return;}
    go('/fleet/leave',{pid:PID},()=>{FL.fid='';FLS='main';FLV=null;saveG();fleetMenu();fleetRender();});};}

// ── FLEET MISSIONS (1.5.0, added to the internal test on 15 Oct): three a day, one easy, one medium, one hard (src/fmis.js), each played on its own seeded cosmos
// on the Daily Race's engine with the mission's kit; three tries a day, the best counts, a medal pays fleet points only ──
var FMRUN=null; // the mission being played: {m, v (what it counts), d (its day)}; var, so the engine may look before this line runs
const FMU={combo:'×{n}',garc:'{n} yay',hunt:'{n} vuruş',caught:'{n} cisim',time:'{n} sn',score:'{n} puan',dodge:'{n} meteor'};
const fmFmt=(m,v)=>T(FMU[m.m],{n:m.m==='score'?flN(v):v});
function fmAdd(k,n){if(FMRUN&&FMRUN.m.m===k)FMRUN.v+=n;}
function fmVal(){const R=FMRUN,k=R.m.m;return k==='combo'?maxCombo:k==='caught'?SPR_RUN.caught:k==='time'?Math.min(R.m.dur,Math.floor(SPR_RUN.t)):k==='score'?totalScore:R.v;}
function fmSetup(){const m=FMRUN.m,k=BHS_FMIS.kit(m);G2.tSh=G2.tSh0=k.sh;G2.tNova=G2.tNova0=k.nova;G2.noRage=!k.rage; // the mission's kit, the same for everyone
  if(m.anti){const w=G2.L.w;w.anti=(w.anti||0)+18;w.ast=Math.max(12,(w.ast||0)-18);
    if(m.anti>1){let t=0;for(const x in w)t+=w[x];const a=w.anti,p=Math.min(.6,a/t*m.anti);w.anti=p*(t-a)/(1-p);}} /* m.anti times the share of antimatter the storm had */
  if(!m.bodies){const w=G2.L.w;w.ast=(w.ast||0)+(w.mini||0);w.mini=0;} /* 18 Oct: no helper black hole either, outside the missions about catching bodies */
  if(m.bar)G2.gb={B:m.bar,v:0,ts:totalScore,arc:null,arcs:[],n:0,life:m.life||0};else if(m.ev)G2.garcAt=5;
  if(m.mid){G2.midR=V2K.r0+(G2.cap-V2K.r0)*m.mid;G2.rr=G2.midR;} /* a medium hole that does not shrink: the belt is harder to slip through */
  {const rb=$('rage2');if(rb)rb.style.visibility=G2.noRage?'hidden':'';} /* no Vortex in this mission: no Vortex bar either */
  if($('pb'))$('pb').style.display='none';} /* the time is on the HUD already: no progress line under it in a mission */
function fmChainReady(fm){if(!fm||!fm.chain)return false;const c=fm.chain;return !c.got&&c.n>=c.need&&Object.keys(fm.me).some(k=>k!=='chain'&&fm.me[k].tier>0);}
function flFmH(fm,left,mis){const F=BHS_FMIS,lvC=['k','o','z'],lvT=['★','★★','★★★']; /* easy, medium, hard: stars say it in every language */
  const card=id=>{const m=F.byId(id);if(!m)return '';const me=fm.me[id]||{best:0,tier:0,tries:0},rest=Math.max(0,F.TRIES-me.tries);
    const tg=m.tg.map((x,i)=>`<span class="${me.tier>i?'got':''}"><b>${m.m==='score'||m.m==='caught'?flN(x):fmFmt(m,x)}</b><i>${mis?flN(F.mp(m,x)):'+'+F.pts(m,i+1)}</i></span>`).join(''),q=mis&&mis.per[id]; /* points and bodies: the number alone fits in every language */
    const btn=rest>0?`<button class="play${me.tries?' again':''}" data-fm="${id}">▶ ${me.tries?T('TEKRAR'):T('OYNA')}</button>`:`<span class="end">${T('Haklar bitti')}</span>`;
    return `<div class="fm-c${me.tier===3?' done':''}"><div class="fm-t"><span class="ic">${fmIc(m)}</span><b>${T(m.n)}</b><span class="lv ${lvC[m.lv]}">${lvT[m.lv]}</span></div>
      <div class="fm-m"><small>${fmDur(m)} · ${me.tries?T('En iyin: {v}',{v:fmFmt(m,me.best)})+(mis?` = <b class="mp">${flN(me.mp||0)}</b>`:''):T('Henüz oynamadın')} · ${T('hak {n}/{m}',{n:rest,m:F.TRIES})}${q?` · ${T('filo ort. {n}',{n:flN(q.avg)})}`:''}</small>
      <div class="fm-r"><div class="fm-tg">${tg}</div><button class="fm-i" data-fmi="${id}" aria-label="${T('Görev kartı')}">i</button>${btn}</div></div></div>`;};
  const c=fm.chain,mine=Object.keys(fm.me).some(k=>k!=='chain'&&fm.me[k].tier>0);
  return `<div class="sec"><span>${T('BUGÜNÜN FİLO GÖREVLERİ')}</span><b>${T('yenilenmesine {t}',{t:flLeft(left)})}</b></div>
  ${fm.ids.map(card).join('')}
  <div class="fm-ch"><div class="fm-f"><b>🤝 ${T('FİLO ZİNCİRİ')}</b><small dir="ltr">${c.n} / ${c.need}</small>${c.got?'<span class="ok">✅</span>':c.n>=c.need&&mine?`<button class="go" id="fmChain">${T('TOPLA')}</button>`:''}</div>
    <div class="bar"><i style="width:${Math.min(100,c.n/c.need*100)}%"></i></div><small>${T('Bugün filo olarak {n} madalya toplayın: madalya alan herkes ödülü alır',{n:c.need})}</small>${flPay(F.PAY.chain)}</div>`;}
// 1.5.0 (16 Oct): the missions' own pictures, drawn like the fleet's space symbols (neon line, gold, the bodies as the game draws them)
const FMIC={
 combo:'<path d="M3.5 5Q5 13 13.5 14.5" fill="none" stroke="#ffcf5a" stroke-width="1.1" stroke-dasharray="1.4 1.3"/><circle cx="3.6" cy="5.2" r="2.2" fill="#9fe3ff"/><circle cx="5.8" cy="10.8" r="2.5" fill="#c9a8ff"/><circle cx="10.2" cy="14" r="2.4" fill="url(#nGold)"/><ellipse cx="16.2" cy="15.3" rx="6" ry="2.2" fill="none" stroke="#f2a93b" stroke-width="1.1" transform="rotate(-15 16.2 15.3)"/><circle cx="16.2" cy="15.3" r="3.6" fill="#05070a" stroke="#5ff2ff" stroke-width="1.1"/><path d="M17.4 2.6l3.8 3.8M21.2 2.6l-3.8 3.8" stroke="#ffd76a" stroke-width="1.9" stroke-linecap="round"/>',
 garc:'<circle cx="12" cy="12" r="11" fill="url(#fmGl)"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="#ffd76a" stroke-width="1.7"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="#fffbe6" stroke-width=".6"/><circle cx="12" cy="12" r="5.4" fill="none" stroke="#ffd76a" stroke-width="1.1"/><circle cx="12" cy="12" r="5.4" fill="none" stroke="#fffbe6" stroke-width=".4"/><g fill="#ffe7a0"><circle cx="20.6" cy="7.4" r=".9"/><circle cx="3.6" cy="15.6" r=".8"/><circle cx="16.4" cy="21" r=".7"/><circle cx="6.4" cy="3.6" r=".6"/></g>',
 hunt:'<circle cx="12" cy="12" r="9.3" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2" pathLength="10" stroke-dasharray=".78 .22"/><circle cx="12" cy="12" r="9.3" fill="none" stroke="#ff7a1a" stroke-width="2" pathLength="10" stroke-dasharray=".78 .22 .78 .22 .78 .22 .78 .22 .78 .22 .78 .22 .78 3.22" transform="rotate(-90 12 12)"/><circle cx="12" cy="12" r="6.2" fill="url(#fmOr)"/><path d="M10.2 9.6l1.8 2.2 1.4-1" stroke="rgba(90,30,0,.55)" stroke-width=".7" fill="none" stroke-linecap="round"/>',
 eclipse:'<circle cx="12" cy="12" r="11" fill="url(#fmCo)"/><circle cx="11.2" cy="12.8" r="7" fill="#ffe9a8"/><circle cx="12.7" cy="11.4" r="7" fill="#04060c"/><circle cx="12.7" cy="11.4" r="7" fill="none" stroke="#fff3c4" stroke-width=".5" opacity=".6"/>',
 belt:'<path d="M2 18.5L21 5" stroke="#ff5a5f" stroke-width="5" stroke-linecap="round" opacity=".14"/><path d="M4.2 13.4L6 3.6L7.8 13.4z" fill="url(#fmTr)"/><path d="M10 16.4L12.2 4.6L14.4 16.4z" fill="url(#fmTr)"/><path d="M16.8 12.8L18.4 2.4L20 12.8z" fill="url(#fmTr)"/><circle cx="6" cy="13.6" r="2.2" fill="url(#fmMt)"/><circle cx="12.2" cy="16.8" r="2.7" fill="url(#fmMt)"/><circle cx="18.4" cy="13" r="2" fill="url(#fmMt)"/>',
 anti:'<circle cx="12" cy="12" r="10.5" fill="url(#fmPk)"/><g fill="none" stroke="#ffd6f5" stroke-width=".9"><ellipse cx="12" cy="12" rx="8.6" ry="3.1"/><ellipse cx="12" cy="12" rx="8.6" ry="3.1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="8.6" ry="3.1" transform="rotate(-60 12 12)"/></g><circle cx="12" cy="12" r="2.2" fill="#fff"/>'};
const fmIc=(m,c='')=>FMIC[m.id]?`<svg class="ico fmic ${c}" viewBox="0 0 24 24" aria-hidden="true">${FMIC[m.id]}</svg>`:m.ic;
const fmDur=m=>m.dur>=120&&m.dur%60===0?T('{n} dk',{n:m.dur/60}):T('{n} sn',{n:m.dur});
// OYNA: the first time a mission is played its card explains the kit; after that it starts at once (the card stays one tap away on ⓘ)
function fmPlay(id){if(TIPS['fm_'+id])fmStart(id);else{TIPS['fm_'+id]=1;saveSoon();fmAsk(id);}}
// the card before a run: what the mission asks, the same kit for everyone, what is never touched, the medals
function fmAsk(id){const F=BHS_FMIS,m=F.byId(id),fm=FLV&&FLV.fm;if(!m||!fm)return;const me=fm.me[id]||{tries:0},rest=F.TRIES-me.tries,k=F.kit(m);if(rest<=0)return;fmClose();
  const kit=[['❤️',T('{n} can (göreve özel)',{n:k.lives})],k.sh?['🛡️',T('{n} kalkan (görevin)',{n:k.sh})]:['🛡️',T('Kalkan yok'),1],k.nova?['💎',T('{n} Süpernova (görevin)',{n:k.nova})]:['💎',T('Süpernova yok'),1],
    k.rage?['💢',T('Vortex açık')]:['💢',T('Vortex kapalı'),1],['🔬',T('Lab güçleri kapalı'),1],['🧑‍🚀',T('Avatar gücü kapalı'),1]];
  const keep=[['⛽',T('Füzyon yakıtı harcanmaz')],['🛡️',T('Kendi kalkanların harcanmaz')],['⭐',T('Normal puana eklenmez')],['🗺️',T('Seviye ilerlemen değişmez')]];
  const o=document.createElement('div');o.className='fm-ov';o.id='fmOv';
  o.innerHTML=`<div class="fm-card"><div class="big">${fmIc(m,"lg")}</div><h3>${T(m.n)}</h3><p>${T(m.d)}</p><p class="dur">⏱ ${fmDur(m)}</p>
    <div class="fm-sec">${T('HERKESE EŞİT DONANIM')}</div><div class="fm-kit">${kit.map(([i,t,off])=>`<div class="${off?'off':''}">${i} ${t}</div>`).join('')}</div>
    <div class="fm-sec">${T('SENİN STOĞUN KORUNUR')}</div><div class="fm-kit">${keep.map(([i,t])=>`<div>${i} ${t}</div>`).join('')}</div>
    <div class="fm-tg">${m.tg.map((x,i)=>`<span><b>${fmFmt(m,x)}</b><i>${rel(11)?flN(F.mp(m,x))+' '+T('puan'):'+'+F.pts(m,i+1)+' '+T('filo puanı')}</i></span>`).join('')}</div>${rel(11)?`<div class="fm-note">${T('Altın hedef 1.000 görev puanı. Filonun puanı, oynayan üyelerin ortalamasıdır.')}</div>`:''}
    <div class="row"><button class="b2" id="fmNo">${T('KAPAT')}</button><button class="b1" id="fmGo">▶ ${T('BAŞLA')} · ${T('hak {n}/{m}',{n:rest,m:F.TRIES})}</button></div>
    <div class="fm-note">${T('Her görev için günde {n} hak. En iyi sonucun sayılır. Görevler {t} sonra yenilenir.',{n:F.TRIES,t:flLeft(Date.parse(utcDay()+'T00:00:00Z')+864e5-Date.now())})}</div></div>`;
  document.body.appendChild(o);sfx('click',{vol:.4});
  o.querySelector('#fmNo').onclick=fmClose;o.querySelector('#fmGo').onclick=()=>fmStart(id);}
function fmClose(){const o=$('fmOv');if(o)o.remove();}
async function fmStart(id){const F=BHS_FMIS,m=F.byId(id),b=$('fmGo');if(!m||b&&b.disabled||fmStart.busy)return;if(b){b.disabled=true;b.textContent='…';}
  const pb=document.querySelector(`[data-fm="${id}"]`);if(pb){pb.disabled=true;pb.textContent='…';}
  let r=null;fmStart.busy=1;try{r=await lbFetch('/fleet/fm/start',{pid:PID,id});}catch(e){}fmStart.busy=0;
  if(!r||!r.ok){fmClose();toast('🛸',T(r&&r.err==='tries'?'Bu görevin bugünkü hakları bitti':'Bağlantı yok, biraz sonra tekrar dene'),'');FLV=null;fleetRender();return;}
  const fm=FLV&&FLV.fm;if(fm)(fm.me[id]=fm.me[id]||{best:0,tier:0,tries:0}).tries=r.tries;FL.fmd=utcDay();saveSoon();if(rel(11))ev('fm_play');
  fmClose();$('sLB').classList.remove('on');fleetMode(false);startSprint(F.seed(r.d,id),{fm:m,fmDay:r.d});}
// the result goes to the server; with no connection it waits in the save and goes with the next look at the fleet
async function fmPost(x){try{const r=await lbFetch('/fleet/fm',{pid:PID,...x});if(r&&(r.ok||r.err))return r;}catch(e){}FL.fmq=(FL.fmq||[]).concat([x]).slice(-9);saveSoon();return null;}
async function fmFlush(){const q=FL.fmq||[];FL.fmq=[];for(const x of q){try{await lbFetch('/fleet/fm',{pid:PID,...x});}catch(e){FL.fmq.push(x);}}saveSoon();}
// 17 Oct: today's ranking for the mission, every fleet's players together: the top five and your place
async function fmTop(m){const box=$('fmTopBox');if(!box)return;let r=null;try{r=await lbFetch('/fleet/fm/top?id='+encodeURIComponent(m.id)+'&pid='+PID);}catch(e){}
  if(!r||!r.ok||!r.list||!r.list.length||!$('fmTopBox'))return;const md=['🥇','🥈','🥉'];
  const row=(x,i)=>`<div class="ft${x.me?' mine':''}"><span class="rk">${md[i]||i+1}</span><span class="nm"><b class="notr">${escH(x.name)}</b><small class="notr">${escH(x.emb+' '+x.fleet)}</small></span><b class="v">${fmFmt(m,x.v)}</b></div>`;
  const mine=r.me&&!r.list.slice(0,5).some(x=>x.me)?`<div class="ft mine"><span class="rk">${r.me.rank}</span><span class="nm"><b>${T('SEN')}</b></span><b class="v">${fmFmt(m,r.me.v)}</b></div>`:'';
  box.innerHTML=`<div class="fth">🏆 ${T('BUGÜNÜN SIRALAMASI')} <small>· ${T('{n} oyuncu',{n:r.n})}</small></div>${r.list.slice(0,5).map(row).join('')}${mine}`;box.hidden=false;}
function fmQuit(){const R=FMRUN;if(!R)return;const v=fmVal()||0;SPR_RUN.ended=true;FMRUN=null;fmPost({day:R.d,id:R.m.id,v,t:Math.min(R.m.dur,SPR_RUN.t)});} // leaving a run keeps what it reached (its try is already used)
function fmEnd(){const R=FMRUN;if(!R)return;const F=BHS_FMIS,m=R.m,v=fmVal(),t=Math.min(m.dur,SPR_RUN.t),fm=FLV&&FLV.fm,me=fm&&fm.me[m.id]||{best:0,tier:0,tries:1};FMRUN=null;
  const best=Math.max(me.best||0,v),tier=F.tier(m,best),was=me.tier||0,run=F.tier(m,v),rest=Math.max(0,F.TRIES-(me.tries||1));
  const md=['','🥉','🥈','🥇'];sfx(run>0?'levelup':'gameover',{vol:.8,rev:.4});
  const o=document.createElement('div');o.className='fm-ov';o.id='fmOv';
  o.innerHTML=`<div class="fm-card"><div class="big">${run?md[run]:fmIc(m,"lg")}</div><h3>${run?T(['','BRONZ MADALYA','GÜMÜŞ MADALYA','ALTIN MADALYA'][run]):T('MADALYA ÇIKMADI')}</h3><p>${T(m.n)}</p>
    <div class="res"><div class="w"><small>${T('BU KOŞU')}</small><b>${fmFmt(m,v)}</b></div><div><small>${T('BUGÜN EN İYİN')}</small><b>${fmFmt(m,best)}</b></div></div>
    <div class="fm-tg">${m.tg.map((x,i)=>`<span class="${tier>i?'got':''}"><b>${fmFmt(m,x)}</b><i>${flN(F.mp(m,x))} ${T('puan')}</i></span>`).join('')}</div>
    <div class="fm-mp"><p dir="ltr">${flN(best)} ÷ ${flN(m.tg[2])} × ${flN(1000)} = <b>${flN(F.mp(m,best))}</b></p><small>${T('görev puanı · bugünün en iyisi sayılır')}</small><div id="fmGain"></div></div>
    <div class="fm-top" id="fmTopBox" hidden></div>
    <div class="row">${rest>0?`<button class="b1" id="fmAgain">🔁 ${T('TEKRAR')} · ${T('hak {n}/{m}',{n:rest,m:F.TRIES})}</button>`:''}<button class="b2" id="fmBack">🛸 ${T('FİLOYA DÖN')}</button></div>
    <div class="fm-note">${T('Normal puanına, rekorlarına ve seviye ilerlemene eklenmez.')}</div></div>`;
  document.body.appendChild(o);
  fmPost({day:R.d,id:m.id,v,t}).then(r=>{if(fm&&r&&r.ok){Object.assign(fm.me[m.id]=fm.me[m.id]||{tries:1},{best:r.best,tier:r.tier,mp:r.mp||0});FL.at=0;}const g=$('fmGain');if(g&&!r)g.textContent='⏳ '+T('Bağlantı yok: sonucun sonra gönderilecek');
    if(g&&r&&r.ok&&r.n){const P=F.PAY;g.innerHTML=`<div class="fr"><span>${T('Filonun bu görevdeki ortalaması')} <small>(${T('{n} kişi',{n:r.n})})</small></span><b>${flN(r.avg)}</b></div><div class="fr"><span>${T('Bugünkü toplamın')} <small>(${r.g}/3)</small></span><b>${flN(r.my)}</b></div>${r.star?`<div class="fr st">🌟 ${T('Şu an filonun yıldızı sensin. Gün sonuna kadar kalırsan +{a} ⭐ +{b} 💎',{a:P.star[0],b:P.star[1]})}</div>`:''}`;}
    if(r&&r.ok)fmTop(m);});
  const back=()=>{fmClose();hideModals();showMenu();fleetOpen('tasks');if(rel(10))notifAsk('fleet');};
  o.querySelector('#fmBack').onclick=back;if(o.querySelector('#fmAgain'))o.querySelector('#fmAgain').onclick=()=>{back();later0(()=>fmPlay(m.id),500);};}
