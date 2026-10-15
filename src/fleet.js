// FLEETS (1.5.1): the Fleet tab on the ranking, the strip under the menu name, points from play, the daily fleet mission,
// weekly prizes. The server (server/fleet.js) keeps the fleets; FL is the game's last look at mine, kept in the save.
let FL={fid:'',name:'',emb:'',pts:0,tg:[],prz:0,race:0,at:0,mis:{d:'',p:0,cl:0}};
let FLV=null,FLS='main',FLI=0,FLQ={n:0,src:'',busy:0},FLE=''; // the server's view, the sub-screen, points waiting to go, the last error
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
  $('lbTF').classList.toggle('dot',FL.prz>0);}
function fleetOpen(){FLS=FL.fid?'main':'intro';FLI=0;showLB();lbTab('f');} /* the window opens over the menu: hiding the menu left a bare game screen after KAPAT (15 Oct) */ // from the menu strip or the level card

async function fleetFetch(force){
  if(!flOn())return null;if(!force&&FLV&&Date.now()-FL.at<60e3)return FLV;
  try{const j=await lbFetch('/fleet?pid='+PID);FLV=j;FLE='';
    if(j.fleet){const f=j.fleet;Object.assign(FL,{fid:f.fid,name:f.name,emb:f.emb,pts:f.pts,tg:f.targets||[],race:f.race?1:0});}else FL.fid='';
    FL.prz=(j.prizes||[]).length;FL.at=Date.now();saveSoon();fleetMenu();fleetTabs();return j;}
  catch(e){FLE='off';return null;}}

// points from play: queued and sent in chunks (the server allows 80 a call and 300 a day)
function fleetAdd(n,src){if(!rel(10)||!FL.fid||!(n>0))return;FLQ.n+=n;if(src)FLQ.src=src;FL.pts+=n;saveSoon();later0(fleetFlush,1500);}
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

// the strip under the player's name in the menu: emblem, fleet name, the week's chest bar; a red dot when a prize waits
function fleetMenu(){const s=$('menuSub');if(!s||!rel(10))return;s.onclick=null;s.classList.remove('fl','fljoin');
  if(FL.fid){const t=FL.tg&&FL.tg[2]||1,q=Math.min(1,FL.pts/t);s.classList.add('fl');
    s.innerHTML=`${flImg(FL.emb)}<b class="notr">${flE(FL.name)}</b><span class="fb"><i style="width:${Math.round(q*100)}%"></i></span><span class="fc${FL.prz>0||FL.race?' dot':''}">🎁</span>`;s.onclick=e=>{e.stopPropagation();fleetOpen();};}
  else if(flOn()&&bestLevel>=FL_LV){s.classList.add('fljoin');s.innerHTML=`🛸 ${T('Bir filoya katıl')}`;s.onclick=e=>{e.stopPropagation();fleetOpen();};}}

// the daily fleet mission, shown above the three daily missions
function fleetMission(){if(!rel(10)||!FL.fid)return '';const d=utcDay();if(FL.mis.d!==d)FL.mis={d,p:0,cl:0};const m=FL.mis,done=m.p>=3;
  return `<div class="dmr flm"><div class="x">🛸 ${T('Filon için {n} seviye geç',{n:3})}<small>${m.p} / 3 · ${T('ödül')} 30 ⭐ · ${T('filoya puan')}</small><div class="bar"><i style="width:${Math.min(100,m.p/3*100)}%"></i></div></div>${m.cl?'<span class="ok">✅</span>':`<button id="flMisGo" ${done?'':'disabled'}>${T('AL')}</button>`}</div>`;}
function fleetMissionWire(){const b=$('flMisGo');if(b)b.onclick=()=>{if(FL.mis.p<3||FL.mis.cl)return;FL.mis.cl=1;stars+=30;saveG();updateUI();sfx('achieve',{vol:.5});renderDM();};}

// the Fleet tab
async function fleetRender(){const w=$('lbFleet');if(!w)return;fleetTabs();
  if(!flOn()){w.innerHTML=`<div class="hero"><b>🛸 ${T('FİLO')}</b>${T('Filolar internet bağlantısı ister.')}</div>`;return;}
  if(bestLevel<FL_LV){w.innerHTML=`<div class="hero"><b>🛸 ${T('FİLO')}</b>${T('Filolar {n}. seviyede açılır. Bir filoya katıl: haftalık sandıklar ve hafta sonu yarışı seni bekliyor.',{n:FL_LV})}</div>`;return;}
  if(FLS==='intro'&&!FL.fid){w.innerHTML=fleetIntroH();fleetIntroWire();return;} // the benefit cards need no connection
  if(!FLV)w.innerHTML=`<div class="lbwait">${T('Yükleniyor…')}</div>`;
  const j=await fleetFetch(FLS==='main');if(!$('sLB').classList.contains('on'))return;
  if(!j){w.innerHTML=`<div class="hero"><b>🛸 ${T('FİLO')}</b>${flErr('off')}</div><div class="two"><button class="btn sec" id="flRetry">${T('TEKRAR DENE')}</button></div>`;$('flRetry').onclick=()=>fleetRender();return;}
  let h=fleetPrizes(j);
  if(FLS==='make')h+=fleetMakeH();else if(FLS==='code')h+=fleetCodeH();else if(FLS==='race')h+=await fleetRaceH();else if(FLS==='set')h+=fleetSetH(j);else h+=j.fleet?fleetPageH(j):fleetNoneH(j);
  w.innerHTML=h;fleetWire(j);}

function fleetPrizes(j){return (j.prizes||[]).map(z=>`<div class="hero przc">${flImg(z.emb,'big')}<b class="notr">${flE(z.name||'')}</b>
  ${z.rank?T('Hafta sonu yarışını {r}. bitirdi ({n} filo)',{r:z.rank,n:z.grpn}):T('Bu hafta {n} sandık açıldı',{n:z.tier})} · ${T('senin katkın')} ${flN(z.mine)}
  <div class="rw">${z.tier?`<span>🎁 ${T('{n} sandık',{n:z.tier})}</span>`:''}${z.rank&&z.rank<=10?`<span>🏁 ${T('yarış')} ${z.rank}.</span>`:''}${z.top3?`<span>🏅 ${T('filonun en iyi 3\'ü')}</span>`:''}</div>
  <div class="rw"><span>+${flN(z.stars)} ⭐${z.gems?` +${z.gems} 💎`:''}</span></div><div class="two"><button class="btn" data-claim="${z.wk}">${T('TOPLA')}</button></div></div>`).join('');}

// what a fleet gives, card by card: shown when the player taps "Join a fleet"; the last card offers to show them again.
// The numbers are the server's (server/fleet.js CHEST_PAY, RACE_PAY, TOP3_PAY) and the game's (fleetLevel, fleetMission).
function flCards(){const s=n=>flN(n)+' ⭐',g=n=>' + '+n+' 💎';return [
  {i:'🎁',t:'HAFTALIK SANDIKLAR',x:'Filondaki herkes oynadıkça ortak çubuk dolar. Her hafta 3 sandık açılır; katkı veren her üye hepsini alır.',c:['🎁 '+s(150),'🎁 '+s(300)+g(5),'🎁 '+s(600)+g(15)]},
  {i:'🏁',t:'HAFTA SONU YARIŞI',x:'Cuma–Pazar filon 20 filoluk bir grupta yarışır. İlk 10 filo ödül alır; filonun en iyi 3 oyuncusuna ek ödül var.',c:['🥇 '+s(1500)+g(30),'🥈 '+s(1000)+g(20),'🥉 '+s(600)+g(10),'🏅 +'+s(200)]},
  {i:'📈',t:'EKSTRA ÖDÜL, KAYIP YOK',x:'Filo puanı normal puanına ek gelir: rekorların, yıldızların ve sıralaman aynen kalır. Geçtiğin her seviye filona puan kazandırır.',c:['+10–30 '+T('puan')+' / '+T('seviye'),'🌪️ +20–80 '+T('puan')]},
  {i:'📋',t:'GÜNLÜK FİLO GÖREVİ',x:'Her gün filon için 3 seviye geç, ödülünü topla. Görev, günlük görevlerinin en üstünde durur.',c:['📋 +'+s(30)+' / '+T('gün')]},
  {i:'🤝',t:'BİRLİKTE DAHA GÜÇLÜ',x:'Filo duvarında arkadaşlarını gör, hazır mesajlarla destek ol, kimin ne kattığını izle. Katılmak ücretsiz, istediğin zaman ayrılabilirsin.',c:['👥 20 '+T('üye'),'🆓 '+T('ücretsiz')]}];}
function fleetIntroH(){const cs=flCards(),c=cs[FLI],last=FLI===cs.length-1;
  return `<div class="hero flin" id="flCard"><small>${T('FİLO AVANTAJLARI')} · ${FLI+1}/${cs.length}</small><i class="bdg">${ICO.badge(c.i)}</i><b>${T(c.t)}</b>${T(c.x)}
  <div class="rw">${c.c.map(x=>`<span class="notr">${flE(x).replace(ICO.re,m=>ICO.svg(m))}</span>`).join('')}</div><div class="dots">${cs.map((_,k)=>`<em class="${k===FLI?'on':''}"></em>`).join('')}</div></div>
  <div class="two">${last?`<button class="btn sec" id="flAgain">↺ ${T('TEKRAR GÖSTER')}</button><button class="btn" id="flSeen">${T('FİLOLARA BAK')} ›</button>`
    :`<button class="btn sec" id="flSeen">${T('ATLA')}</button><button class="btn" id="flNext">${T('İLERİ')} ›</button>`}</div>`;}
function fleetIntroWire(){const n=flCards().length,go=k=>{FLI=(k+n)%n;fleetRender();sfx('click');};
  if($('flNext'))$('flNext').onclick=()=>go(FLI+1);if($('flAgain'))$('flAgain').onclick=()=>go(0);$('flSeen').onclick=()=>{FLS='main';fleetRender();};
  const c=$('flCard');let x0=null;c.onclick=()=>{if(FLI<n-1)go(FLI+1);}; // a tap or a swipe turns the card
  c.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
  c.addEventListener('touchend',e=>{if(x0==null)return;const d=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(d)<40)return;const k=FLI+((d<0)!==(document.dir==='rtl')?1:-1);if(k>=0&&k<n)go(k);},{passive:true});}

function fleetNoneH(j){const canMake=bestLevel>=FL_MAKE_LV,wait=j.wait&&j.wait>Date.now();
  return `<div class="hero"><b>🛸 ${T('FİLO')}</b>${T('Bir filoya katıl: oynadığın her seviye filona puan kazandırır. Hafta boyunca sandıklar açılır, hafta sonu filolar yarışır.')}</div>
  ${wait?`<div class="flnote">⏳ ${T('Yeni bir filoya katılmak için')} ${flLeft(j.wait-Date.now())}</div>`:''}
  <div class="two"><button class="btn" id="flMake" ${canMake?'':'disabled'}>➕ ${T('FİLO KUR')}${canMake?'':` · ${T('{n}. seviye',{n:FL_MAKE_LV})}`}</button><button class="btn sec" id="flCode">🔑 ${T('KODLA KATIL')}</button></div>
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

function fleetPageH(j){const f=j.fleet,cap=(j.members||[]).find(m=>m.cap),t=f.targets||[1,1,1],top=t[2]||1,now=Date.now();
  const code=String(f.code||'').replace(/^(...)(...)$/,'$1-$2');
  return `${f.hidden&&f.cap?`<div class="flnote warn">⚠️ ${T('Filonun adı bildirildi ve gizlendi. Yeni bir ad seç.')} <button class="go" id="flRen">${T('AD DEĞİŞTİR')}</button></div>`:''}
  <div class="fc">${flImg(f.emb,'big')}<span class="t"><b class="notr">${flE(f.name)}</b><small>${f.n}/${f.max} ${T('üye')} · ${T('Kaptan')}: <span class="notr">${flE(cap?cap.name:'')}</span></small><span class="code">🔑 ${code}</span></span></div>
  <div class="stat"><div><b>#${f.rank||'–'}</b><small>${f.race?T('yarışta'):T('bu hafta')} / ${f.of||1}</small></div><div><b>${flN(f.pts)}</b><small>${T('filo puanı')}</small></div><div><b>${flLeft((f.race?f.ends:f.raceFrom)-now)}</b><small>${f.race?T('yarışın bitişi'):T('yarışa kalan')}</small></div></div>
  ${f.n<f.max?`<div class="finv"><b>📨 ${T('ARKADAŞINI FİLOYA ÇAĞIR')}</b><div class="fic"><small>${T('FİLO KODU')}</small><span class="notr">${code}</span></div>
  <div class="two"><button class="btn" id="flShare">📤 ${T('DAVET GÖNDER')}</button><button class="btn sec" id="flCopy">${T('KOPYALA')}</button></div>
  <small>${T('WhatsApp, Telegram ya da SMS ile gönder. Arkadaşın oyunda Sıralama › Filo › Kodla katıl’a bu kodu yazar.')}</small></div>`:''}
  <div class="sec"><span>${T('HAFTALIK SANDIKLAR')}</span><b>${T('herkese')}</b></div>
  <div class="bar"><i style="width:${Math.min(100,f.pts/top*100)}%"></i>${t.map((x,i)=>`<span class="ck${f.pts>=x?' got':''}" style="left:${Math.min(97,x/top*100)}%">${i===2?'👑':'🎁'}</span>`).join('')}</div>
  <div class="barl">${t.map((x,i)=>`<span style="${i===2?'right:0':`left:${x/top*100}%;transform:translateX(-50%)`}">${flN(x)}${f.pts>=x?' ✓':''}</span>`).join('')}</div>
  <div class="sec"><span>${T('ÜYELER · BU HAFTA')}</span><b>${T('bugün oynayan')} ✓</b></div>
  ${(j.members||[]).map((m,i)=>`<div class="row2${m.me?' mine':''}"><span class="rk">${i+1}</span>${avHtml(m.av)}<span class="nm"><b class="notr">${flE(m.name)}${m.cap?' 👑':''}${m.today?' <i class="ok">✓</i>':''}${m.away?' 💤':''}</b></span><span class="pt">${flN(m.pts)}</span>${f.cap&&!m.me?`<button class="kick" data-kick="${m.k}" aria-label="${T('Filodan çıkar')}">✕</button>`:''}</div>`).join('')}
  <div class="sec"><span>${T('FİLO DUVARI')}</span><b>${T('hazır mesajlar')}</b></div>
  <div class="wall">${(j.wall||[]).slice(-6).map(flWall).join('')||`<div class="ev">${T('Henüz mesaj yok.')}</div>`}</div>
  <div class="emo">${FL_CHIPS.map(k=>`<button data-msg="${k}">${T(FL_MSG[k])}</button>`).join('')}</div>
  <div class="two"><button class="btn sec" id="flRace">🏆 ${T('FİLO SIRALAMASI')}</button>${f.cap?`<button class="btn sec" id="flSet">⚙️</button>`:''}<button class="btn sec" id="flLeave">${T('AYRIL')}</button></div><div class="flnote" id="flMsg"></div>`;}

function flWall(w){const m=String(w.m||''),n=+m.split(':')[1]||0;
  if(FL_MSG[m])return `<div><b class="notr">${flE(w.name)}:</b> ${T(FL_MSG[m])}</div>`;
  if(m.startsWith('chest:'))return `<div class="ev nw">🎁 ${T('{n}. sandık açıldı!',{n})}</div>`;
  if(m.startsWith('rank:'))return `<div class="ev nw">🏁 ${T('Filo yarışta {n}. sıraya yükseldi',{n})}</div>`;
  return FL_EV[m]?`<div class="ev"><b class="notr">${flE(w.name)}</b> ${T(FL_EV[m])}</div>`:'';}
function fleetSetH(j){const f=j.fleet;return `<div class="hero" style="text-align:start"><b>⚙️ ${T('FİLO AYARLARI')}</b>${T('Yalnızca kaptan görür.')}</div>
  <div class="sec"><span>${T('FİLO ADI')}</span><b>${f.freeRename?T('bir kez ücretsiz'):FL_RENAME+' 💎'}</b></div><input class="inp notr" id="flName" maxlength="24" value="${flE(f.hidden?'':f.name)}" dir="auto"><div class="flnote" id="flNameE"></div>
  <div class="two"><button class="btn" id="flRenGo">${T('ADI KAYDET')}${f.freeRename?'':` · ${FL_RENAME} 💎`}</button></div>
  <div class="sec"><span>${T('ARMA')}</span></div><div class="embs">${FL_EMB.map(k=>`<button class="${k===f.emb?'on':''}" data-emb="${k}">${flImg(k)}</button>`).join('')}</div>
  <div class="sec"><span>${T('KİMLER KATILABİLİR')}</span></div><div class="tog"><button class="${f.open?'on':''}" data-open="1">🌍 ${T('HERKES')}</button><button class="${f.open?'':'on'}" data-open="0">🔑 ${T('YALNIZCA KODLA')}</button></div>
  <div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button></div><div class="flnote" id="flMsg"></div>`;}

async function fleetRaceH(){let j;try{j=await lbFetch('/fleets/top?pid='+PID);}catch(e){return `<div class="hero">${flErr('off')}</div><div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button></div>`;}
  const now=Date.now();
  return `<div class="hero" style="padding:9px"><b>🏆 ${j.race?T('HAFTA SONU YARIŞI'):T('FİLOLAR · BU HAFTA')}</b>${j.race?T('Bitişe {t}. İlk 3 filonun her üyesine: 1.500 ⭐ + 30 💎 · 1.000 ⭐ + 20 💎 · 600 ⭐ + 10 💎; 4.–10.: 300 ⭐. Sıralanmak için hafta sonu en az 3 üyenin puan getirmesi gerekir.',{t:flLeft(j.ends-now)})
    :T('Yarış Cuma 00:00 UTC\'de başlar ({t}). Benzer güçte en fazla 20 filo aynı grupta yarışır.',{t:flLeft(j.raceFrom-now)})}</div>
  ${(j.list||[]).map(x=>`<div class="row2${x.me?' mine':''}"><span class="rk">${['🥇','🥈','🥉'][x.r-1]||x.r}</span>${flImg(x.emb)}<span class="nm"><b class="notr">${flE(x.name)}</b><small>${x.n}/20 ${T('üye')}</small></span><span class="pt">${flN(x.pts)}</span></div>`).join('')||`<div class="lbwait">${T('Henüz puan yok.')}</div>`}
  <div class="two"><button class="btn sec" id="flBack">${T('GERİ')}</button></div>`;}

function flMsg(t,ok){const e=$('flMsg');if(e){e.textContent=t;e.classList.toggle('good',!!ok);}}
function fleetNameCheck(){const i=$('flName'),e=$('flNameE');if(!i||!e)return null;const r=BHS_NAMES.check(i.value,'fleet'),wv=BHS_NAMES.width(BHS_NAMES.tidy(i.value)),c=$('flCnt');
  if(c)c.textContent=wv+'/16';e.textContent=i.value.trim()?(r.ok?'✓':'✕ '+flErr(r.err)):'';e.classList.toggle('good',r.ok);return r;}
function fleetWire(j){const w=$('lbFleet'),q=s=>w.querySelector(s),all=s=>w.querySelectorAll(s);
  const go=async(path,body,after)=>{flMsg('…');try{const r=await lbFetch(path,body);if(r&&r.ok){after&&after(r);}else flMsg(flErr(r&&r.err));return r;}catch(e){flMsg(flErr('off'));return null;}};
  all('[data-claim]').forEach(b=>b.onclick=()=>go('/fleet/claim',{pid:PID,wk:b.dataset.claim},r=>{if(r.stars||r.gems)grant({stars:r.stars,gems:r.gems},'🛸 '+T('FİLO ÖDÜLÜ'));FLV=null;fleetRender();}));
  if(q('#flBack'))q('#flBack').onclick=()=>{FLS='main';fleetRender();};
  if(q('#flIntro'))q('#flIntro').onclick=()=>{FLS='intro';FLI=0;fleetRender();};
  if(q('#flMake'))q('#flMake').onclick=()=>{FLS='make';fleetRender();};
  if(q('#flCode'))q('#flCode').onclick=()=>{FLS='code';fleetRender();};
  if(q('#flRace'))q('#flRace').onclick=()=>{FLS='race';fleetRender();};
  if(q('#flSet'))q('#flSet').onclick=()=>{FLS='set';fleetRender();};
  if(q('#flRen'))q('#flRen').onclick=()=>{FLS='set';fleetRender();};
  all('[data-join]').forEach(b=>b.onclick=()=>go('/fleet/join',{pid:PID,fid:b.dataset.join,pname:playerName||'PİLOT',av:playerAvatar},()=>{FLS='main';FLV=null;fleetRender();}));
  if(q('#flCodeGo'))q('#flCodeGo').onclick=()=>go('/fleet/join',{pid:PID,code:q('#flCodeIn').value,pname:playerName||'PİLOT',av:playerAvatar},()=>{FLS='main';FLV=null;fleetRender();});
  let emb=(j.fleet&&j.fleet.emb)||FL_EMB[0],open=j.fleet?j.fleet.open:true;
  all('[data-emb]').forEach(b=>b.onclick=()=>{emb=b.dataset.emb;all('[data-emb]').forEach(x=>x.classList.toggle('on',x===b));if(FLS==='set')go('/fleet/set',{pid:PID,emb},()=>{FL.emb=emb;flMsg('✓',1);fleetMenu();});});
  all('[data-open]').forEach(b=>b.onclick=()=>{open=b.dataset.open==='1';all('[data-open]').forEach(x=>x.classList.toggle('on',x===b));if(FLS==='set')go('/fleet/set',{pid:PID,open},()=>flMsg('✓',1));});
  if(q('#flName')){q('#flName').oninput=fleetNameCheck;fleetNameCheck();}
  if(q('#flMakeGo'))q('#flMakeGo').onclick=()=>{const r=fleetNameCheck();if(!r||!r.ok){flMsg(flErr(r?r.err:'short'));return;}if(diamonds<FL_COST){flMsg(T('Yetersiz elmas'));return;}
    go('/fleet/create',{pid:PID,name:r.name,emb,open,pname:playerName||'PİLOT',av:playerAvatar},()=>{diamonds-=FL_COST;saveG();updateUI();sfx('achieve',{vol:.6});FLS='main';FLV=null;fleetRender();});};
  if(q('#flRenGo'))q('#flRenGo').onclick=()=>{const r=fleetNameCheck(),free=j.fleet&&j.fleet.freeRename;if(!r||!r.ok){flMsg(flErr(r?r.err:'short'));return;}if(!free&&diamonds<FL_RENAME){flMsg(T('Yetersiz elmas'));return;}
    go('/fleet/rename',{pid:PID,name:r.name},x=>{if(!x.free){diamonds-=FL_RENAME;saveG();updateUI();}FL.name=r.name;FLS='main';FLV=null;fleetRender();fleetMenu();});};
  all('[data-msg]').forEach(b=>b.onclick=()=>go('/fleet/msg',{pid:PID,m:b.dataset.msg},()=>{FLV=null;fleetRender();}));
  all('[data-kick]').forEach(b=>b.onclick=()=>{if(!b.classList.contains('ask')){b.classList.add('ask');b.textContent=T('ÇIKAR?');return;}go('/fleet/kick',{pid:PID,k:b.dataset.kick},()=>{FLV=null;fleetRender();});});
  // the invite goes out through the phone's own share sheet (WhatsApp, Telegram, SMS…); without one it is copied
  const flCode=()=>String(j.fleet&&j.fleet.code||'').replace(/^(...)(...)$/,'$1-$2');
  if(q('#flShare'))q('#flShare').onclick=async()=>{const txt=['🛸 '+T('{f} filosuna katıl!',{f:j.fleet.name}),T('Blackhole Storm’da birlikte sandık açıp hafta sonu yarışalım.'),T('Filo kodu: {c}',{c:flCode()}),T('Oyunda: Sıralama › Filo › Kodla katıl (filolar {n}. seviyede açılır)',{n:FL_LV})].join('\n');
    const out=await shareOut(txt,NATIVE?'https://play.google.com/store/apps/details?id=com.liaslabs.blackholestorm':APP_URL);if(out==='copied')flMsg(T('Davet kopyalandı: WhatsApp’a yapıştırıp gönder'),1);else if(out==='fail')flMsg(flCode(),1);};
  if(q('#flCopy'))q('#flCopy').onclick=async()=>{try{await navigator.clipboard.writeText(flCode());flMsg(T('Kod kopyalandı'),1);}catch(e){flMsg(flCode(),1);}};
  // a pasted message is searched for the code (three letters or digits, a dash, three more)
  const cIn=q('#flCodeIn'),pick=v=>{const u=String(v).toUpperCase(),d=u.match(/\b([A-Z0-9]{3})-([A-Z0-9]{3})\b/);if(d)return d[1]+'-'+d[2];const c=u.replace(/[^A-Z0-9]/g,'');return c.length===6?c.slice(0,3)+'-'+c.slice(3):'';};
  if(cIn)cIn.oninput=()=>{if(cIn.value.length>7){const c=pick(cIn.value);if(c)cIn.value=c;}};
  if(q('#flPaste'))q('#flPaste').onclick=async()=>{try{const v=await navigator.clipboard.readText();const c=pick(v);if(c){cIn.value=c;flMsg('',0);}else flMsg(T('Panoda filo kodu yok'));}catch(e){cIn.focus();flMsg(T('Kutuya uzun bas › Yapıştır'));}};
  if(q('#flLeave'))q('#flLeave').onclick=()=>{const b=q('#flLeave'),last=j.fleet.n<=1;if(!b.classList.contains('ask')){b.classList.add('ask');b.textContent=last?T('FİLO KAPANACAK, EMİN MİSİN?'):T('AYRIL?');return;}
    go('/fleet/leave',{pid:PID},()=>{FL.fid='';FLS='main';FLV=null;saveG();fleetMenu();fleetRender();});};}
