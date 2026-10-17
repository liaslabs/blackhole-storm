// Names others can see (player names, fleet names): one filter for the game and the leaderboard server.
// The game inlines this file (src/build.py, //@@NAMES@@); the server imports it (server/worker.js). Same rules on both sides,
// the server's answer is the one that counts. Lists cover the game's 11 languages. Arabic and Kurdish (Oct 2026) come from
// LDNOOBW, wooorm/cuss (arabizi), sweardictionary.com and youswear.com, checked against common Arabic, Kurdish and Turkish names.
globalThis.BHS_NAMES = (() => {
  // what a name is folded to before the lists are checked: case, accents, look-alike letters, digits used as letters
  const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i', '|': 'i', '€': 'e', '¡': 'i' };
  const CYR2LAT = { 'а': 'a', 'в': 'b', 'е': 'e', 'ё': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'һ': 'h', 'ԁ': 'd' };
  const LAT2CYR = { 'a': 'а', 'b': 'в', 'e': 'е', 'k': 'к', 'm': 'м', 'h': 'н', 'o': 'о', 'p': 'р', 'c': 'с', 't': 'т', 'y': 'у', 'x': 'х', 'i': 'і', '3': 'з', '6': 'б', '0': 'о' };
  // whole words only: short ones that would hit innocent names as part of a longer word ("computadora", "technique", "sikke")
  const WORD = [
    // tr
    'sik', 'sikik', 'pic', 'amk', 'aq', 'oc', 'mk', 'got', 'gotu', 'anan', 'anani', 'ananin', 'bok', 'yarak', 'amcik',
    // en
    'ass', 'dick', 'cock', 'cum', 'fag', 'rape', 'sex', 'tits', 'nazi', 'kkk', 'jizz', 'porn', 'piss',
    // de
    'hure', 'arsch', 'fotze', 'nutte', 'spast',
    // es / pt
    'puta', 'puto', 'polla', 'culo', 'verga', 'pija', 'fdp', 'vsf', 'pqp', 'viado',
    // fr
    'bite', 'pute', 'nique', 'pd', 'conne', 'ntm', 'negre', 'neger', 'mongo', 'pedo', 'isis', 'pust', 'bego',
    // id
    'babi', 'asu', 'anjing', 'kntl', 'mmk', 'jembut',
    // ku (kurmancî): kûn/qûn arse, kûz pussy, kîr cock, gan fuck (whole words: "kuzey", "kuzgun", "gani" stay free)
    'qun', 'quz', 'kerê', 'quna', 'kuna', 'kunek', 'kuz', 'kuze', 'kuzi', 'kuza', 'kire', 'kirê', 'xaye', 'xayê', 'ganim', 'dennim', 'gandin',
    // ru (after look-alikes are read as Cyrillic)
    'хуй', 'хер', 'ебу', 'еба', 'ебал', 'сука', 'суки', 'бля', 'жопа', 'хуи',
    // ar
    'كس', 'زب', 'طيز', 'نيك', 'خول', 'زق',
    'زبي', 'زبك', 'زبر', 'زبه', 'اير', 'ايري', 'ايرك', 'طيزي', 'طيزك', 'انيك', 'ينيك', 'نيكني', 'متناك', 'عرص', 'قواد', 'خرا', 'خره', 'زنا',
    'سكس', 'سكسي', 'مص', 'لحس', 'بزاز', 'ثدي', 'بظر', 'قضيب', 'جماع', 'شهوه', 'بيضان', 'سحاق', 'سحاقيه', 'شاذ', 'لبوه', 'منيوكه',
    // ar in Latin letters (arabizi; 7 = h, 3 = a, 5 = kh are read by the digit rules)
    'zebbi', 'zeby', 'zobry', 'zebak', 'teez', 'teezak', 'neek', 'nayek', 'kahba', 'qahba', 'gahba', 'katba', 'metnak', 'metnaka', 'khawal', 'luti', 'louty', 'zamel', 'zemel',
    // ja (hiragana)
    'しね', 'くそ', 'ちんこ', 'まんこ', 'ちんぽ', 'うんこ',
    // reserved short words
    'mod', 'gm', 'staff'
  ];
  // anywhere in the name, also with spaces, dots or digits inside ("f.u.c.k", "s1kt1r")
  const SUB = [
    // tr
    'orospu', 'orspu', 'siktir', 'sikerim', 'sikeyim', 'sikis', 'yarrak', 'aminakoy', 'aminako', 'gotveren', 'pezevenk', 'kahpe', 'kaltak', 'ibne',
    'gavat', 'yavsak', 'serefsiz', 'surtuk', 'dalyarak', 'tasak', 'kevase', 'amcig', 'gerizekali',
    // en
    'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'slut', 'pussy', 'asshole', 'bastard', 'retard', 'penis', 'vagina',
    'wanker', 'twat', 'motherf', 'dickhead', 'hitler', 'daesh', 'terrorist', 'pedofil', 'paedo', 'porno', 'hentai', 'xxx',
    // de
    'fick', 'scheiss', 'scheis', 'arschloch', 'hurensohn', 'wichser', 'schlampe', 'schwuchtel', 'kanake', 'missgeburt',
    // es
    'mierda', 'cabron', 'pendejo', 'culero', 'maricon', 'gilipollas', 'chinga', 'follar', 'zorra', 'hijodeputa', 'malparido',
    // fr
    'putain', 'merde', 'connard', 'connasse', 'salope', 'encule', 'batard', 'couille', 'tapette', 'niquetamere',
    // pt
    'porra', 'caralho', 'merda', 'buceta', 'cuzao', 'foder', 'fodase', 'arrombado', 'piroca', 'cacete', 'filhodaputa', 'vagabunda',
    // id
    'bangsat', 'kontol', 'memek', 'ngentot', 'goblok', 'tolol', 'jancok', 'jancuk', 'pepek', 'bajingan', 'lonte',
    // ku (kurmancî)
    'qehbik', 'dayikqehpe', 'pezewenk', 'qehbe', 'qehpe', 'qahpe', 'orispi', 'sekbav', 'segbav', 'benamus', 'qunate', 'qundek', 'kunate',
    'kuzediya', 'kuzdiya', 'kuzedayika', 'kuzdayika', 'kuzadayika', 'kuzekere', 'kuzkere', 'kuzikeri', 'dayikatedikim', 'diyatedikim', 'kiremin', 'guxwar', 'bikimete',
    // tr (same family)
    'namussuz', 'sikimin',
    // ru
    'пизд', 'ебат', 'ебан', 'ёбан', 'еблан', 'блядь', 'бляд', 'мудак', 'пидор', 'пидар', 'залуп', 'гандон', 'шлюх', 'хуе', 'хуё', 'дерьм', 'нацист', 'гитлер',
    // ar
    'شرموط', 'منيوك', 'منيك', 'عاهر', 'قحب', 'لوطي', 'كسمك', 'كس امك', 'داعش', 'خنزير', 'ابن الكلب', 'يلعن',
    'كس اختك', 'كسختك', 'كسمين', 'متناكه', 'معرص', 'ديوث', 'لواط', 'اغتصاب', 'مخنث', 'ابن الحرام', 'ولد زنا', 'كل خرا', 'خرا عليك', 'تلحس', 'مص زبي', 'زبالة', 'ابن ستين كلب',
    'kosomak', 'kosommak', 'kusummak', 'kussummak', 'kusomak', 'kesomak', 'kosokhtak', 'kososhtak', 'kosekhtak', 'kosstak', 'kossomak', 'sharmout', 'sharmot', 'charmout', 'manyook', 'manyok', 'mnayak',
    'mnayek', 'dayouth', 'dayooth', 'dayoos', 'ibnelkalb', 'ibnalkalb', 'ibnelsharmouta', 'sharmoot', 'sharmut',
    // ja (hiragana / kanji)
    'ちんちん', 'まんまん', 'せっくす', 'きちがい', '死ね', '殺す', 'ころす', 'ふぁっく', 'ばいた', 'くたばれ',
    // the game, the studio and the stores: nobody may pose as them
    'admin', 'administrator', 'administrador', 'moderator', 'moderador', 'moderateur', 'yonetici', 'resmi', 'official', 'offiziell', 'officiel', 'oficial',
    'destek', 'support', 'blackholestorm', 'liaslabs', 'google', 'playstore', 'googleplay',
    'админ', 'модератор', 'поддержк', 'مشرف', 'ادمن', 'الدعم', 'رسمي', '管理者', '運営', 'うんえい', 'かんりしゃ', 'もでれーたー'
  ];
  const RESERVED = new Set(['mod', 'gm', 'staff', 'admin', 'administrator', 'administrador', 'moderator', 'moderador', 'moderateur', 'yonetici', 'resmi', 'official', 'offiziell',
    'officiel', 'oficial', 'destek', 'support', 'blackholestorm', 'liaslabs', 'google', 'playstore', 'googleplay', 'админ', 'модератор', 'поддержк', 'مشرف', 'ادمن', 'الدعم', 'رسمي',
    '管理者', '運営', 'うんえい', 'かんりしゃ', 'もでれーたー']);

  const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const arab = s => s.replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  function base(n) { // case, width and accents gone; Turkish dotless i read as i
    let s = String(n || '').normalize('NFKC');
    s = s.replace(/İ/g, 'i').replace(/I/g, 'i').toLowerCase().replace(/ı/g, 'i');
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'); // é ş ğ ü ö ç -> e s g u o c (Arabic marks are handled apart)
    return kata2hira(arab(s));
  }
  const flatL = s => s.replace(/[^\p{L}]/gu, '');
  const WORDF = new Set(WORD.map(w => flatL(base(w)))), SUBF = SUB.map(w => flatL(base(w))).filter(Boolean), RESF = new Set([...RESERVED].map(w => flatL(base(w))));
  const toLat = s => [...s].map(c => LEET[c] || CYR2LAT[c] || c).join('');
  const toCyr = s => [...s].map(c => LAT2CYR[c] || c).join('');
  const flat = s => s.replace(/[^\p{L}]/gu, '');      // letters only: "f.u.c.k" and "k o n t o l" are caught
  const words = s => s.split(/[^\p{L}]+/u).filter(Boolean);

  function badKind(n) { // 'reserved' | 'bad' | ''
    const b = base(n), forms = [toLat(b), toLat(b).replace(/v/g, 'u'), toCyr(b), b]; // "fvck": v for u
    for (const f of forms) {
      const fl = flat(f), ws = words(f);
      for (const w of SUBF) if (fl.includes(w)) return RESF.has(w) ? 'reserved' : 'bad';
      for (const w of ws) if (WORDF.has(w)) return RESF.has(w) ? 'reserved' : 'bad';
      if (WORDF.has(fl)) return RESF.has(fl) ? 'reserved' : 'bad';
    }
    return '';
  }
  // CJK and other full-width letters take two places, so a Japanese name stays about as wide as a Latin one
  const width = s => [...s].reduce((a, c) => a + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(c) ? 2 : 1), 0);
  function tidy(n) { // drops control and invisible characters, joins runs of spaces
    return String(n || '').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿<>&"`\\]/g, '').replace(/\s+/g, ' ').trim();
  }
  // kind 'fleet': 3-16 places, letters, digits, single spaces and - . _ ' only. kind 'player': the older rules (up to 11 characters, any visible text)
  function check(n, kind = 'player') {
    const s = tidy(n);
    if (kind === 'fleet') {
      if (width(s) < 3) return { ok: false, err: 'short', name: s };
      if (width(s) > 16) return { ok: false, err: 'long', name: s };
      if (/[^\p{L}\p{M}\p{N} \-._']/u.test(s)) return { ok: false, err: 'chars', name: s };
    }
    if (/(https?|www\.|\.(com|net|org|ru|tr|io|gg|me|xyz)\b|discord|t\.me|wa\.me|@)/i.test(s)) return { ok: false, err: 'link', name: s };
    if ((s.match(/\p{N}/gu) || []).length > 4) return { ok: false, err: 'phone', name: s };
    if (/(.)\1{3,}/u.test(s.toLowerCase())) return { ok: false, err: 'repeat', name: s };
    const k = badKind(s);
    if (k) return { ok: false, err: k, name: s };
    return { ok: true, name: s };
  }
  return { check, bad: n => !!badKind(n), width, tidy };
})();
