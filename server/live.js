// Live content (18 Oct): the campaigns GET /camp hands to the game. Data only; the game checks every field and keeps its own ceilings
// (src/game.src.html, LIVE_FX, LIVE_RW and LIVE_T): effects lvStars (level stars, at most ×3), sp (season points, at most ×2) and race
// (the Daily Race's prize, at most ×2); up to 4 tasks built on the daily-mission counters (catch, perfect, combo, clean, rescue, comet,
// score, surv, edge, diamond, rulelv, hunt, boss, crack, atlas, rival, spec, jet, cons, guard) and the campaign's own (fm: fleet missions
// played, fmg: fleet medals, race: Daily Races played, racesc: a Daily Race score, survplay: Survival runs), with rewards in stars
// (≤2000), gems (≤50), lives (spare lives, ≤5), shield (≤5), time (≤5); go: play | surv | race | fleet | shop | lab | season | daily.
// Texts: one entry per language, the game falls back to en, then tr.
//
// Every weekend (Friday 00:00 to Monday 00:00 UTC) a campaign comes by itself, the four themes in turn. A campaign written in LIST
// below comes as well (and is shown first while both run). Each is sent from two days before it starts until it ends, so a phone
// that goes offline still has it.

const T = (tr, en, de, es, fr, pt, id, ru, ja, ar, ku) => ({ tr, en, de, es, fr, pt, id, ru, ja, ar, ku });

export const THEMES = {
  storm: { ic: '☄️', col: '#ff8a4c', go: 'play', fx: { lvStars: 2, sp: 1.5 },
    t: T('HAFTA SONU FIRTINASI', 'WEEKEND STORM', 'WOCHENEND-STURM', 'TORMENTA DE FIN DE SEMANA', 'TEMPÊTE DU WEEK-END', 'TEMPESTADE DE FIM DE SEMANA', 'BADAI AKHIR PEKAN', 'ШТОРМ ВЫХОДНЫХ', '週末の嵐', 'عاصفة نهاية الأسبوع', 'BAHOZA DAWIYA HEFTEYÊ'),
    d: T('Kara delik bu hafta sonu daha cömert: her seviye 2 kat yıldız verir. Üç fırtına görevini bitir, ödülleri topla.',
      'The black hole is more generous this weekend: every level pays double stars. Finish the three storm tasks and collect the rewards.',
      'Das Schwarze Loch ist an diesem Wochenende großzügiger: Jedes Level bringt doppelte Sterne. Erledige die drei Sturmaufgaben und hol dir die Belohnungen.',
      'El agujero negro es más generoso este fin de semana: cada nivel da el doble de estrellas. Completa las tres tareas de la tormenta y recoge los premios.',
      'Le trou noir est plus généreux ce week-end : chaque niveau rapporte deux fois plus d\'étoiles. Termine les trois tâches de la tempête et récupère les récompenses.',
      'O buraco negro está mais generoso neste fim de semana: cada fase dá o dobro de estrelas. Complete as três tarefas da tempestade e pegue os prêmios.',
      'Lubang hitam lebih murah hati akhir pekan ini: setiap level memberi bintang ganda. Selesaikan tiga tugas badai dan ambil hadiahnya.',
      'В эти выходные чёрная дыра щедрее: каждый уровень даёт вдвое больше звёзд. Выполни три задания шторма и забери награды.',
      '今週末のブラックホールは太っ腹:どのレベルも星が2倍。嵐のタスク3つを達成して報酬を受け取ろう。',
      'الثقب الأسود أكثر كرمًا في نهاية هذا الأسبوع: كل مستوى يمنح ضعف النجوم. أكمل مهام العاصفة الثلاث واجمع المكافآت.',
      'Vê dawiya hefteyê qula reş comerttir e: her ast du qat stêrk dide. Sê peywirên bahozê biqedîne û xelatan bistîne.'),
    tasks: [{ id: 'catch', n: 300, r: { stars: 300 } }, { id: 'clean', n: 5, r: { gems: 10 } }, { id: 'boss', n: 1, r: { lives: 2 } }] },
  fleet: { ic: '🛸', col: '#5fd3ff', go: 'fleet', fx: { sp: 1.5 },
    t: T('FİLO HAFTA SONU', 'FLEET WEEKEND', 'FLOTTEN-WOCHENENDE', 'FIN DE SEMANA DE FLOTA', 'WEEK-END DE LA FLOTTE', 'FIM DE SEMANA DA FROTA', 'AKHIR PEKAN ARMADA', 'ВЫХОДНЫЕ ФЛОТА', '艦隊ウィークエンド', 'عطلة الأسطول', 'DAWIYA HEFTEYÊ YA FÎLOYÊ'),
    d: T('Bu hafta sonu filon seni bekliyor. Filo görevlerini oyna, madalya topla; her madalya filona da puan getirir.',
      'Your fleet is waiting for you this weekend. Play the fleet missions and win medals; every medal also earns your fleet points.',
      'Deine Flotte wartet an diesem Wochenende auf dich. Spiele die Flottenmissionen und gewinne Medaillen; jede Medaille bringt auch deiner Flotte Punkte.',
      'Tu flota te espera este fin de semana. Juega las misiones de flota y gana medallas; cada medalla también da puntos a tu flota.',
      'Ta flotte t\'attend ce week-end. Joue les missions de flotte et gagne des médailles ; chaque médaille rapporte aussi des points à ta flotte.',
      'Sua frota está esperando por você neste fim de semana. Jogue as missões da frota e ganhe medalhas; cada medalha também dá pontos à sua frota.',
      'Armadamu menunggumu akhir pekan ini. Mainkan misi armada dan raih medali; setiap medali juga memberi poin untuk armadamu.',
      'В эти выходные твой флот ждёт тебя. Играй задания флота и собирай медали; каждая медаль приносит очки и флоту.',
      '今週末は艦隊があなたを待っています。艦隊任務をプレイしてメダルを集めよう。メダルごとに艦隊ポイントも入ります。',
      'أسطولك ينتظرك في نهاية هذا الأسبوع. العب مهام الأسطول واجمع الميداليات؛ كل ميدالية تمنح أسطولك نقاطًا أيضًا.',
      'Vê dawiya hefteyê fîloya te li benda te ye. Peywirên fîloyê bilîze û madalyayan bicivîne; her madalya ji fîloya te re jî xal tîne.'),
    tasks: [{ id: 'fm', n: 6, r: { stars: 300 } }, { id: 'fmg', n: 3, r: { gems: 10 } }, { id: 'catch', n: 200, r: { shield: 2 } }] },
  race: { ic: '🏁', col: '#ffd76a', go: 'race', fx: { race: 2 },
    t: T('YARIŞ HAFTA SONU', 'RACE WEEKEND', 'RENN-WOCHENENDE', 'FIN DE SEMANA DE CARRERAS', 'WEEK-END DE COURSE', 'FIM DE SEMANA DE CORRIDA', 'AKHIR PEKAN BALAPAN', 'ГОНОЧНЫЕ ВЫХОДНЫЕ', 'レースウィークエンド', 'عطلة السباق', 'DAWIYA HEFTEYÊ YA PÊŞBIRKÊ'),
    d: T('Günlük Yarış bu hafta sonu 2 kat ödül veriyor. Her gün aynı evrende 60 saniye: üç günü de koş, rekorunu zorla.',
      'The Daily Race pays double this weekend. The same universe for everyone, 60 seconds a day: race all three days and push your record.',
      'Das Tagesrennen zahlt an diesem Wochenende doppelt. Für alle dasselbe Universum, 60 Sekunden am Tag: Fahre an allen drei Tagen und knacke deinen Rekord.',
      'La Carrera diaria paga el doble este fin de semana. El mismo universo para todos, 60 segundos al día: corre los tres días y supera tu récord.',
      'La Course du jour rapporte le double ce week-end. Le même univers pour tous, 60 secondes par jour : cours les trois jours et bats ton record.',
      'A Corrida diária paga em dobro neste fim de semana. O mesmo universo para todos, 60 segundos por dia: corra os três dias e supere seu recorde.',
      'Balapan Harian memberi hadiah ganda akhir pekan ini. Alam semesta yang sama untuk semua, 60 detik sehari: ikut tiga hari dan pecahkan rekormu.',
      'В эти выходные ежедневная гонка даёт двойную награду. Одна вселенная для всех, 60 секунд в день: участвуй все три дня и побей свой рекорд.',
      '今週末はデイリーレースの報酬が2倍。全員同じ宇宙で1日60秒:3日間走って自己ベストを更新しよう。',
      'السباق اليومي يمنح ضعف الجوائز في نهاية هذا الأسبوع. الكون نفسه للجميع، 60 ثانية في اليوم: شارك في الأيام الثلاثة وحطّم رقمك.',
      'Vê dawiya hefteyê Pêşbirka Rojane du qat xelat dide. Ji bo herkesî heman gerdûn, rojê 60 çirke: her sê rojan beşdar bibe û rekora xwe bişkîne.'),
    tasks: [{ id: 'race', n: 3, r: { gems: 15 } }, { id: 'racesc', n: 15000, r: { stars: 300 } }, { id: 'perfect', n: 20, r: { time: 2 } }] },
  surv: { ic: '💀', col: '#7fe08a', go: 'surv', fx: { sp: 1.5 },
    t: T('HAYATTA KALMA FIRTINASI', 'SURVIVAL STORM', 'ÜBERLEBENS-STURM', 'TORMENTA DE SUPERVIVENCIA', 'TEMPÊTE DE SURVIE', 'TEMPESTADE DE SOBREVIVÊNCIA', 'BADAI BERTAHAN HIDUP', 'ШТОРМ ВЫЖИВАНИЯ', 'サバイバルの嵐', 'عاصفة البقاء', 'BAHOZA MANÊ'),
    d: T('Bu hafta sonu Hayatta Kal\'da ne kadar dayanabilirsin? Görevleri bitir, sezon puanların da 1,5 kat gelsin.',
      'How long can you last in Survival this weekend? Finish the tasks, and your season points come 1.5 times over.',
      'Wie lange hältst du an diesem Wochenende im Überleben durch? Erledige die Aufgaben, und deine Saisonpunkte zählen 1,5-fach.',
      '¿Cuánto aguantas en Supervivencia este fin de semana? Completa las tareas y tus puntos de temporada valen 1,5 veces.',
      'Combien de temps tiendras-tu en Survie ce week-end ? Termine les tâches, et tes points de saison comptent 1,5 fois.',
      'Quanto tempo você aguenta no Sobrevivência neste fim de semana? Complete as tarefas e seus pontos da temporada valem 1,5 vez.',
      'Berapa lama kamu bisa bertahan di Bertahan Hidup akhir pekan ini? Selesaikan tugasnya, poin musimmu juga dihitung 1,5 kali.',
      'Сколько ты продержишься в выживании в эти выходные? Выполни задания, и очки сезона засчитываются в 1,5 раза.',
      '今週末、サバイバルでどこまで耐えられる?タスクを達成しよう。シーズンポイントも1.5倍。',
      'كم يمكنك الصمود في وضع البقاء في نهاية هذا الأسبوع؟ أكمل المهام، ونقاط موسمك تُحتسب 1.5 مرة.',
      'Vê dawiya hefteyê tu dikarî çiqas di Mayînê de bimînî? Peywiran biqedîne, xalên demsala te jî 1,5 qat tên.'),
    tasks: [{ id: 'survplay', n: 5, r: { stars: 200 } }, { id: 'surv', n: 120, r: { gems: 10 } }, { id: 'edge', n: 10, r: { lives: 2 } }] }
};
export const ORDER = ['storm', 'fleet', 'race', 'surv'];

// the weekend campaigns of this week and the next (week 0 began on Monday 5 January 2026)
const W0 = Date.UTC(2026, 0, 5), WEEK = 7 * 864e5;
export function auto(now = Date.now()) {
  const wk = Math.floor((now - W0) / WEEK), out = [];
  for (const w of [wk, wk + 1]) {
    const k = ORDER[((w % ORDER.length) + ORDER.length) % ORDER.length], from = W0 + w * WEEK + 4 * 864e5, to = from + 3 * 864e5;
    out.push({ id: `auto-${k}-${new Date(from).toISOString().slice(0, 10)}`, from: new Date(from).toISOString(), to: new Date(to).toISOString(), ...THEMES[k] });
  }
  return out;
}

// campaigns written by hand: same fields as a theme, plus id, from and to (ISO dates)
export const LIST = [];

// what GET /camp sends: hand-written first, then the weekend's own, each from two days before its start until its end
export function campaigns(now = Date.now()) {
  return [...LIST, ...auto(now)].filter(c => c && Date.parse(c.to) > now && Date.parse(c.from) - 2 * 864e5 <= now).slice(0, 6);
}
export default LIST;
