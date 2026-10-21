// Ядрото на новото ПВА: двете числа, цветът, редовете на плота, търсенето.
//
// Тези функции са чисти — не искат браузър — затова се проверяват направо.
// Най-важното тук е ПРАВИЛО 4: „не се отнася“ ВДИГА процента, не го сваля.
// И правилото, което пази от измислени числа: няма ли етапи, „да започна“ е
// тире, а не стойност.
const Y = require('../akt/yadro.js');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const red = (dokument, sastoyanie, etap) => ({ dokument, sastoyanie, etap });

// ── двете числа ──────────────────────────────────────────────────────────────

const GRUPA = {
    moment: 'Акт 15',
    dokumenti: [
        red('Разрешение за строеж', 'налично', 'начало'),
        red('Договор за СМР', 'налично', 'начало'),
        red('Заповед за технически ръководител', 'очаква се', 'начало'),
        red('Протокол обр. 2', 'налично', 'подпис'),
        red('Бетонов дневник', 'очаква се', 'подпис'),
        red('Декларации за бетон', 'очаква се', 'подпис'),
    ],
};

let d = Y.aktDveChisla(GRUPA, []);
t('„да започна“ брои само редовете с етап „начало“', d.nachalo.ot === 3, d.nachalo);
t('„да започна“ = 2 от 3 → 67 %', d.nachalo.imam === 2 && d.nachalo.post === 67, d.nachalo);
t('„да подпиша“ брои ВСИЧКИ редове', d.podpis.ot === 6, d.podpis);
t('„да подпиша“ = 3 от 6 → 50 %', d.podpis.imam === 3 && d.podpis.post === 50, d.podpis);
t('двете числа казват и кое липсва',
  d.nachalo.lipsvat.length === 1 && d.podpis.lipsvat.length === 3,
  [d.nachalo.lipsvat, d.podpis.lipsvat]);
t('моментът си носи името', d.moment === 'Акт 15', d.moment);

// Правило 4 — равноправният отговор.
d = Y.aktDveChisla(GRUPA, ['Заповед за технически ръководител']);
t('„не се отнася“ ВДИГА „да започна“ до 100 %', d.nachalo.post === 100, d.nachalo);
t('„не се отнася“ вдига и „да подпиша“', d.podpis.post === 67, d.podpis);
t('махнатият ред вече не е в „липсват“',
  !d.nachalo.lipsvat.includes('Заповед за технически ръководител'), d.nachalo.lipsvat);

// Няма ли етапи — не се измисля число.
const BEZ_ETAPI = { moment: 'Протокол 17', dokumenti: [red('Нещо', 'очаква се')] };
d = Y.aktDveChisla(BEZ_ETAPI, []);
t('без етапи „да започна“ е null, не 0 и не 100', d.nachalo === null, d.nachalo);
t('без етапи „да подпиша“ пак се брои', d.podpis.ot === 1 && d.podpis.post === 0, d.podpis);
t('празният момент е 100 %, не деление на нула',
  Y.aktDveChisla({ moment: 'Х', dokumenti: [] }, []).podpis.post === 100);
t('липсващата група не чупи', Y.aktDveChisla(null, []).podpis.ot === 0);

t('aktProcent показва тире при null', Y.aktProcent(null) === '—');
t('aktProcent показва процент', Y.aktProcent({ post: 40 }) === '40 %');

// ── цветът ───────────────────────────────────────────────────────────────────

const cv = (g, tek, neot) => Y.aktCvyat(Y.aktDveChisla(g, neot || []), tek);
t('празен момент е сив', cv({ dokumenti: [] }) === 'sivo');
t('нищо събрано и не е текущ → сиво',
  cv({ dokumenti: [red('А', 'очаква се', 'начало')] }) === 'sivo');
t('нищо събрано, но е текущият → жълто',
  cv({ dokumenti: [red('А', 'очаква се', 'начало')] }, true) === 'zhalto');
t('частично събрано → жълто',
  cv({ dokumenti: [red('А', 'налично'), red('Б', 'очаква се')] }) === 'zhalto');
t('всичко събрано → зелено',
  cv({ dokumenti: [red('А', 'налично'), red('Б', 'налично')] }) === 'zeleno');
t('„не се отнася“ позеленява момента',
  cv({ dokumenti: [red('А', 'налично'), red('Б', 'очаква се')] }, false, ['Б']) === 'zeleno');

// ── редовете на плота ────────────────────────────────────────────────────────

const DANNI = {
    projects: [
        {
            id: 'i1', pi: '68134.1006.2440', nik: 'ХЪС', address: 'София',
            stroej: 'Външно електрозахранване с кабели СрН и шахтов ТП',
            tekusht_moment: 'Протокол 2', updatedAt: '2026-10-19T10:00:00Z',
            dve_chisla: { moment: 'Протокол 2', nachalo: 80, podpis: 40 },
            stroezhi_dop: [{ stroej: 'Канал', tekusht_moment: 'Акт 15', arhiviran: true }],
        },
        {
            id: 'i2', pi: '11111.2.3', nik: 'Петракиев',
            stroej: 'Жилищна сграда с подземни гаражи',
            tekusht_moment: '', updatedAt: '2026-10-20T10:00:00Z',
        },
    ],
};

let r = Y.aktRedove(DANNI, 'raboti');
t('един ред = един СТРОЕЖ, не имот', r.length === 2, r.map(x => x.ime));
t('архивираният строеж не е на плота',
  !r.some(x => x.ime === 'Канал'), r.map(x => x.ime));
t('архивът е отделен изглед',
  Y.aktRedove(DANNI, 'arhiv').map(x => x.ime).join() === 'Канал');
t('най-пипаното е най-отгоре', r[0].id === 'i2', r.map(x => x.id));
t('редът носи момента', r[1].moment === 'Протокол 2', r[1].moment);
t('редът носи двете числа от последното броене',
  r[1].chisla.nachalo === 80 && r[1].chisla.podpis === 40, r[1].chisla);
t('необоеният обект няма числа, а не нули', r[0].chisla === null, r[0].chisla);
t('редът казва кога е пипан', !!r[1].posledno);
t('строежът знае кой от колко е', r[1].otKolko === 2, r[1].otKolko);

// ── търсенето ────────────────────────────────────────────────────────────────

const imena = x => Y.aktTarsi(Y.aktRedove(DANNI, 'raboti'), x).map(y => y.ime);
t('без текст — всичко', imena('').length === 2);
t('по ПИ излиза имотът', imena('68134').length === 1 && imena('68134')[0].includes('Външно'));
t('по ник излиза имотът', imena('хъс').length === 1);
t('по адрес излиза имотът', imena('софия').length === 1);
t('по име на строеж излиза само той',
  imena('жилищна').length === 1 && imena('жилищна')[0].includes('Жилищна'));
t('нищо намерено е празен списък, не грешка', imena('няма такова').length === 0);

// ── главата: три реда ────────────────────────────────────────────────────────

const P = {
    id: 'i1', pi: '68134.1006.2440',
    clients: [{ name: '„ХЪС Инвест София“ ЕООД' }],
};
const ST = {
    stroej: 'Външно електрозахранване с кабели СрН, НН и шахтов ТП',
    permit: { number: 'Б-228', date: '2026-07-23' },
    consultant: { name: 'СиБиТи Консулт ЕООД' },
};
const g = Y.aktGlavaRedove(P, ST);
t('главата е три реда', g.length === 3, g.map(x => x.klyuch));
t('първи ред: ПИ и строежът',
  g[0].tekst.includes('68134.1006.2440') && g[0].tekst.includes('шахтов ТП'), g[0].tekst);
t('втори ред: възложител и РС',
  g[1].tekst.includes('ХЪС Инвест') && g[1].tekst.includes('Б-228'), g[1].tekst);
t('РС-то е с българска дата', g[1].tekst.includes('23.07.2026'), g[1].tekst);
t('трети ред: консултантът', g[2].tekst.includes('СиБиТи'), g[2].tekst);
t('възложителят казва откъде е', /регистъра/.test(g[1].otkade || ''), g[1].otkade);
t('всеки ред знае кое поле отваря', g.every(x => x.polya && x.polya.length), g);
t('ПИ се пише на ИМОТА, строежът — на строежа',
  g[0].polya[0].kade === 'imot' && g[0].polya[1].kade === 'stroezh', g[0].polya);
t('гол обект пак дава първия ред',
  Y.aktGlavaRedove({ id: 'x' }, {}).length === 1);

// ── архивирането: системата подсеща, операторът решава ───────────────────────

t('след Акт 16 се подсеща за архив', Y.aktVremeZaArhiv({ tekusht_moment: 'Акт 16' }));
t('след окончателния доклад — също',
  Y.aktVremeZaArhiv({ tekusht_moment: 'Окончателен доклад' }));
t('по средата не подсеща', !Y.aktVremeZaArhiv({ tekusht_moment: 'Акт 14' }));
t('вече архивиран не се подсеща пак',
  !Y.aktVremeZaArhiv({ tekusht_moment: 'Акт 16', arhiviran: true }));
t('двата повода са точно тези', Y.AKT_SLED.length === 2, Y.AKT_SLED);

// ── съставките без кухнята: не се чупи, само показва вписаното ───────────────

const sast = Y.aktSastavki({ pi: '1' }, { sastavki: { dobaveni: [{ kod: 'x', ime: 'Нещо' }] } });
t('вписаната на ръка съставка казва, че е на ръка',
  sast.length === 1 && sast[0].ot === 'вписана на ръка', sast);
t('махнатата съставка не се връща',
  Y.aktSastavki({}, { sastavki: { dobaveni: [{ kod: 'x', ime: 'Н' }], mahnati: ['x'] } }).length === 0);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — ядрото е здраво`);
process.exit(loshi.length ? 1 : 0);
