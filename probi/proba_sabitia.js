// СТРОИТЕЛНАТА ИСТОРИЯ — събития, не папки.
//
// Стъпка 2. Пробата работи с ИСТИНСКИТЕ дати на завършен обект (Денка, Овча
// купел), прочетени от неговия Акт 15 на 30.10.2026. Същите дати дадоха и
// трите нарушени хронологии, намерени тогава на ръка:
//
//   · акт обр. 7 започва 24.05.2022, а земната основа е приета с обр. 6 на
//     25.05.2022 — ден по-късно;
//   · акт обр. 12 по архитектура започва 10.02.2022, а площадката е открита
//     на 15.03.2022 — месец по-късно;
//   · окончателният доклад е преди констативния акт обр. 15.
//
// Ако системата не ги казва, тя не върши работата, заради която се прави.
const { kod, grab } = require('./kod');
const s = kod();

const vzemi = (ime, kraj) =>
    (new RegExp('^const ' + ime + ' = [\\s\\S]*?\\n' + kraj + ';$', 'm').exec(s) || [''])[0];

const F = new Function(
    [vzemi('_SAB_VIDOVE', '\\]'), vzemi('_SAB_RED', '\\]'),
     vzemi('_SAB_DUMI', '\\}'), vzemi('_SAB_CHASTI', '\\]'),
     vzemi('_S2_TABLICI', '\\]'),
     grab(s, '_s2Fakti'), grab(s, '_s2KlPoKoloni'), grab(s, '_s2SverimiKl'),
     grab(s, '_s2Sveren'), grab(s, '_dokIme'), grab(s, '_dokKlyuchIme'),
     grab(s, '_dokKlyuchNomer'), grab(s, '_dokNomerOtTekst'), grab(s, '_dokRed'),
     grab(s, 'dokTetradka'),
     grab(s, '_sabChast'), grab(s, '_sabVid'), grab(s, '_sabChislo'),
     grab(s, 'sabIstoria'), grab(s, 'sabKonflikti')].join('\n')
    + '\nconst _s2Id = d => d.id || d.fajl;'
    + '\nconst _DOK_PROCHETEN = "прочетен", _DOK_VPISAN = "вписан", _DOK_OTMETNAT = "отметнат";'
    + '\nreturn {sabIstoria, sabKonflikti, _sabVid, _sabChast, _SAB_CHASTI};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const fakt = v => ({ stoynost: v, citat: v, stranica: 1 });
let n = 0;
const dok = (vid_kod, vid, data, extra) => {
    const id = 'd' + (++n);
    return { id, fajl: id + '.pdf', vid, vid_kod, data: fakt(data), ...(extra || {}) };
};
const potvardi = dokumenti => {
    const p = {};
    for (const d of dokumenti) for (const k of ['data', 'nomer', 'naimenovanie', 'sadarzhanie'])
        if (d[k]) p[`${d.id}::${k}`] = { stoynost: d[k].stoynost };
    return p;
};
const stroezh = (dokumenti, potv) => ({ sloy2: { od: { dokumenti, potvardeni: potv || potvardi(dokumenti) } } });

// ── истинските дати ─────────────────────────────────────────────────────────
const DENKA = [
    dok('RS', 'Разрешение за строеж', '02.12.2021', { nomer: fakt('250') }),
    dok('PROTOKOL2', 'Протокол обр. 2', '15.03.2022'),
    dok('AKT5', 'Акт обр. 5', '15.03.2022'),
    dok('AKT6', 'Акт обр. 6', '25.05.2022'),
    dok('AKT7', 'Акт обр. 7', '24.05.2022'),
    dok('AKT7', 'Акт обр. 7', '29.12.2022'),
    dok('AKT12', 'Акт обр. 12', '10.02.2022', { sadarzhanie: fakt('по част Архитектура') }),
    dok('AKT12', 'Акт обр. 12', '02.10.2023', { sadarzhanie: fakt('по част ВиК') }),
    dok('OBR3', 'Констативен акт обр. 3', '07.10.2022'),
    dok('AKT14', 'Акт обр. 14', '09.03.2023'),
    dok('AKT15', 'Акт обр. 15', '16.04.2025'),
];
const st = stroezh(DENKA);
const istoria = F.sabIstoria({}, st);

// ── историята се чете като история ──────────────────────────────────────────
t('всяко познато събитие е на реда си', istoria.length === 10, istoria.map(x => x.kod));
t('и е подредено по дата',
  istoria.every((x, i) => !i || !x.data || !istoria[i - 1].data
      || istoria[i - 1].data.split('.').reverse().join('') <= x.data.split('.').reverse().join('')),
  istoria.map(x => [x.kod, x.data]));
t('първо е разрешението за строеж', istoria[0].kod === 'rs', istoria[0]);
t('събитието казва КАКВО се е случило, не как се казва документът',
  istoria[0].ime === 'Издадено е разрешение за строеж', istoria[0].ime);

const obr7 = istoria.find(x => x.kod === 'obr7');
t('двата акта обр. 7 са ЕДНО събитие с диапазон',
  obr7.broj === 2 && obr7.data === '24.05.2022' && obr7.do === '29.12.2022', obr7);
t('и носи опорите си', obr7.opori.length === 2, obr7.opori.length);
t('а сверéното събитие е прието', obr7.priemane === 'потвърдено', obr7.priemane);

t('обр. 12 се цепи по части',
  istoria.filter(x => x.kod === 'obr12').length === 2,
  istoria.filter(x => x.kod === 'obr12').map(x => x.ime));
t('и частта влиза в името',
  istoria.some(x => x.ime.endsWith('част Архитектура')), istoria.map(x => x.ime));

// ── трите нарушени реда, намерени на ръка ───────────────────────────────────
const k = F.sabKonflikti(istoria);
const ima = kak => k.some(x => kak.test(x.tekst));
t('хваща: обр. 7 преди обр. 6', ima(/нива и елементи.*24\.05\.2022.*земната основа.*25\.05\.2022/), k.map(x => x.tekst));
t('хваща: обр. 12 преди откриването на площадката',
  ima(/закриване.*10\.02\.2022.*площадка.*15\.03\.2022/), k.map(x => x.tekst));
t('и всеки конфликт казва ЗАЩО е конфликт',
  k.every(x => x.zashto && x.zashto.length > 10), k.map(x => x.zashto));

// ── чистият обект мълчи ─────────────────────────────────────────────────────
const CHIST = [
    dok('RS', 'Разрешение за строеж', '02.12.2021'),
    dok('PROTOKOL2', 'Протокол обр. 2', '15.03.2022'),
    dok('AKT6', 'Акт обр. 6', '25.05.2022'),
    dok('AKT7', 'Акт обр. 7', '26.05.2022'),
    dok('AKT14', 'Акт обр. 14', '09.03.2023'),
    dok('AKT15', 'Акт обр. 15', '16.04.2025'),
];
t('подреден обект не дава конфликти',
  F.sabKonflikti(F.sabIstoria({}, stroezh(CHIST))).length === 0,
  F.sabKonflikti(F.sabIstoria({}, stroezh(CHIST))).map(x => x.tekst));

// Липсата на дата НЕ е нарушен ред.
const BEZ_DATA = [dok('PROTOKOL2', 'Протокол обр. 2', ''), dok('AKT7', 'Акт обр. 7', '01.01.2022')];
t('събитие без дата не се съди',
  F.sabKonflikti(F.sabIstoria({}, stroezh(BEZ_DATA))).length === 0);

// ── несверените влизат в историята, но не са приети ─────────────────────────
const chaka = stroezh([dok('AKT7', 'Акт обр. 7', '01.06.2022')], {});
const ist2 = F.sabIstoria({}, chaka);
t('несверено събитие пак е в историята', ist2.length === 1);
t('но НЕ е прието', ist2[0].priemane === '', ist2[0].priemane);

// ── ред без код се познава по думите ────────────────────────────────────────
t('отметнат ред без код пак става събитие',
  F._sabVid({ ime: 'Акт обр. 14', kod: '' }) && F._sabVid({ ime: 'Акт обр. 14', kod: '' }).kod === 'obr14');
t('а кодът бие думите',
  F._sabVid({ ime: 'писмо за акт обр. 7', kod: 'STANOVISHTE' }) === null);

// ── повторената таблица с частите не се разминава ───────────────────────────
// `_SAB_CHASTI` е копие на `_A15_CHASTI`: новата повърхност не зарежда модула
// на Акт 15. Копието е позволено, разминаването — не.
const a15 = (new RegExp('^const _A15_CHASTI = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0];
const sab = (new RegExp('^const _SAB_CHASTI = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0];
const telo = x => x.replace(/^const \w+ = \[/, '').replace(/\];$/, '').replace(/\s+/g, '');
t('частите в двата модула са една и съща таблица', telo(a15) === telo(sab) && !!a15,
  [telo(a15).slice(0, 60), telo(sab).slice(0, 60)]);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — историята се чете`);
process.exit(loshi.length ? 1 : 0);
