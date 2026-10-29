// РАЗДЕЛИТЕ 1.1, 1.3, 1.4 и 1.5 на Акт 15 — сглобени от сверените документи.
//
// Операторът, 29.10.2026, даде точната подредба от свой истински акт:
//
//   „Акт Образец 7 от 24.05.2022г. до 29.12.2022г за приемане на извършените
//    СМР по нива и елементи на строителната конструкция — 24 броя“
//
// Тоест изречението носи БРОЙ и ДИАПАЗОН, а обр. 12 и Протокол 17 вървят
// ОТДЕЛНО ПО ЧАСТИ. Дотук в шаблона нямаше дори поле за тях.
//
// Две граници пази пробата:
//   · брои се от ПРОЧЕТЕНИТЕ документи, не от вписаните — там 24 акта обр. 7
//     се сливат в един ред и броят се губи;
//   · брои се само СВЕРЕНОТО: чекнатото влиза в акта, нечекнатото не.
const { kod, grab } = require('./kod');
const s = kod();

const imena = ['_A15_VIDOVE', '_A15_CHASTI', '_S2_TABLICI'];
const F = new Function(
    imena.map(ime => {
        const m = new RegExp('^const ' + ime + ' = [\\s\\S]*?\\n\\];$', 'm').exec(s);
        if (!m) throw new Error('няма ' + ime);
        return m[0];
    }).join('\n')
    + '\n' + [grab(s, '_s2Fakti'), grab(s, '_s2KlPoKoloni'), grab(s, '_s2SverimiKl'), grab(s, '_s2Sveren'), grab(s, '_a15Chast'),
              grab(s, '_a15Svereni'), grab(s, '_a15TekstNa'), grab(s, '_a15Sortirai'),
              grab(s, '_a15Red'), grab(s, '_a15Izrechenie'), grab(s, '_a15AktoveProtokoli'), grab(s, '_a15Sobstvenost'),
              grab(s, '_a15Skici'), grab(s, '_a15DogovoriMrezhi')].join('\n')
    + '\nconst _s2Id = d => d.id || d.fajl;'
    + '\nconst _a15DataNa = d => String((d.data || {}).stoynost || "").trim();'
    + '\nreturn {_a15AktoveProtokoli,_a15Sobstvenost,_a15Skici,_a15DogovoriMrezhi,'
    + '_a15Chast,_a15Sortirai,_a15Svereni};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const fakt = v => ({ stoynost: v, citat: v, stranica: 1 });
let broj = 0;
// Всеки документ е сверен, щом всичките му факти са потвърдени.
const dok = (vid, data, extra) => {
    const id = 'd' + (++broj);
    return { id, fajl: id + '.pdf', vid, data: fakt(data), ...(extra || {}) };
};
const potvardi = dokumenti => {
    const p = {};
    for (const d of dokumenti) for (const f of F._a15Svereni ? [] : []) void f;
    for (const d of dokumenti) {
        if (d.data) p[`${d.id}::data`] = true;
        if (d.nomer) p[`${d.id}::nomer`] = true;
        if (d.naimenovanie) p[`${d.id}::naimenovanie`] = true;
        if (d.sadarzhanie) p[`${d.id}::sadarzhanie`] = true;
    }
    return p;
};
const stroezh = (dokumenti, potv) => ({
    sloy2: { od: { dokumenti, potvardeni: potv || potvardi(dokumenti) } },
});

// ── 1.3 — броят и диапазонът ────────────────────────────────────────────────
// Датите са между 24.05.2022 и 29.12.2022 — както в истинския акт.
const sedem = Array.from({ length: 24 }, (_, i) =>
    dok('акт обр. 7', `${String((i % 28) + 1).padStart(2, '0')}.06.2022`));
sedem[0].data = fakt('24.05.2022');
sedem[23].data = fakt('29.12.2022');
const st1 = stroezh([
    dok('акт обр. 5', '15.03.2022'),
    dok('акт обр. 6', '25.05.2022'),
    ...sedem,
    dok('акт обр. 14', '09.03.2023'),
]);
const r1 = F._a15AktoveProtokoli(st1);

t('всеки вид дава свой ред', r1.length === 4, r1);
t('обр. 5 излиза с датата си',
  /^Акт Образец 5 от 15\.03\.2022 г\. за установяване/.test(r1[0]), r1[0]);
t('единичният акт НЯМА „броя“', !/броя/.test(r1[0]), r1[0]);
t('обр. 7 дава диапазон',
  /от 24\.05\.2022 до 29\.12\.2022 г\./.test(r1[2]), r1[2]);
t('и брой', /— 24 броя$/.test(r1[2]), r1[2]);
t('описанието е законовото',
  /приемане на извършените СМР по нива и елементи/.test(r1[2]), r1[2]);
t('редът на видовете е по образец, не по азбука',
  /Образец 5/.test(r1[0]) && /Образец 6/.test(r1[1]) && /Образец 7/.test(r1[2])
  && /Образец 14/.test(r1[3]), r1);

// ── обр. 12 и Протокол 17 — ОТДЕЛНО ПО ЧАСТИ ────────────────────────────────
const dvanadeset = [
    dok('акт обр. 12', '10.02.2022', { sadarzhanie: fakt('по част Архитектура') }),
    dok('акт обр. 12', '21.09.2023', { sadarzhanie: fakt('по част Архитектура') }),
    dok('акт обр. 12', '02.10.2023', { sadarzhanie: fakt('по част ВиК') }),
    dok('акт обр. 12', '22.05.2024', { sadarzhanie: fakt('по част ВиК') }),
    dok('акт обр. 12', '05.11.2023', { sadarzhanie: fakt('по част Електро') }),
    dok('протокол обр. 17', '28.11.2024', { sadarzhanie: fakt('водопроводна инсталация') }),
    dok('протокол обр. 17', '10.11.2024', { sadarzhanie: fakt('електро инсталация') }),
];
const r2 = F._a15AktoveProtokoli(stroezh(dvanadeset));
t('обр. 12 се цепи по части', r2.filter(x => /Образец 12/.test(x)).length === 3, r2);
t('архитектурата има свой диапазон и брой',
  /Образец 12 от 10\.02\.2022 до 21\.09\.2023 г\..*по част Архитектура — 2 броя/.test(
      r2.find(x => /Архитектура/.test(x))), r2.find(x => /Архитектура/.test(x)));
t('ВиК е отделно', /по част ВиК — 2 броя/.test(r2.find(x => /ВиК/.test(x))));
t('електро с един акт няма „броя“',
  !/броя/.test(r2.find(x => /Електро/.test(x))), r2.find(x => /Електро/.test(x)));
t('Протокол 17 също се цепи по инсталации',
  r2.filter(x => /Образец 17/.test(x)).length === 2, r2);

// ── СВЕРЕНОТО ВЛИЗА, НЕСВЕРЕНОТО НЕ ─────────────────────────────────────────
const chaka = [dok('акт обр. 5', '15.03.2022'), dok('акт обр. 6', '25.05.2022')];
t('несверените не влизат изобщо',
  F._a15AktoveProtokoli(stroezh(chaka, {})).length === 0,
  F._a15AktoveProtokoli(stroezh(chaka, {})));
const edin = {};
edin[`${chaka[0].id}::data`] = true;
t('влиза само сверéният',
  F._a15AktoveProtokoli(stroezh(chaka, edin)).length === 1,
  F._a15AktoveProtokoli(stroezh(chaka, edin)));

// ── номерът не се бърка ─────────────────────────────────────────────────────
const lesni = stroezh([dok('акт обр. 1', '01.01.2022'), dok('акт обр. 15', '16.04.2025')]);
t('обр. 1 и обр. 15 не минават за обр. 5 или 7',
  F._a15AktoveProtokoli(lesni).length === 0, F._a15AktoveProtokoli(lesni));

// ── 1.1 собственост ─────────────────────────────────────────────────────────
const na = stroezh([
    dok('нотариален акт', '22.01.2025', { nomer: fakt('11'),
        naimenovanie: fakt('Нотариален акт за покупко-продажба на недвижим имот') }),
    dok('договор', '01.03.2026', { nomer: fakt('12') }),
]);
const r3 = F._a15Sobstvenost(na);
t('1.1 изрежда само нотариалните актове', r3.length === 1, r3);
t('с наименование, номер и дата',
  /Нотариален акт за покупко-продажба на недвижим имот, № 11, от 22\.01\.2025 г\./.test(r3[0]), r3[0]);

// ── 1.4 скици ───────────────────────────────────────────────────────────────
const sk = stroezh([
    dok('скица на сграда', '13.05.2025', { nomer: fakt('15-762305') }),
    dok('акт обр. 7', '01.01.2022'),
]);
t('1.4 хваща само скиците', F._a15Skici(sk).length === 1, F._a15Skici(sk));
t('и носи номера от СГКК', /№ 15-762305/.test(F._a15Skici(sk)[0]), F._a15Skici(sk)[0]);

// ── 1.5 договори с мрежите ──────────────────────────────────────────────────
const mr = stroezh([
    dok('договор за присъединяване', '14.02.2022', { nomer: fakt('93'),
        naimenovanie: fakt('Договор за присъединяване към водоснабдителната система със „Софийска вода“ АД') }),
    dok('писмо', '05.04.2022', { nomer: fakt('М – 1192'),
        naimenovanie: fakt('Писмо от „Софийска вода“ АД за изградено сградно канализационно отклонение') }),
    dok('договор за СМР', '28.10.2025', { nomer: fakt('7') }),
]);
const r4 = F._a15DogovoriMrezhi(mr);
t('1.5 хваща договора и писмото', r4.length === 2, r4);
t('но НЕ договора за строителство',
  !r4.some(x => /СМР|строително-монтаж/i.test(x)), r4);

// 29.10.2026, от истински акт: „Orona — Техническо досие“ влезе в 1.5, защото
// „Техниче-СКО“ свършва на „ско“. Кирилицата няма дума-граница — трябва се пише.
const asansьor = stroezh([
    dok('техническо досие', '', { nomer: fakt('XBG10409UN'),
        naimenovanie: fakt('Техническо досие на асансьор') }),
    dok('договор за присъединяване', '14.02.2022', { nomer: fakt('93') }),
]);
t('„Техническо“ не минава за СКО',
  F._a15DogovoriMrezhi(asansьor).length === 1, F._a15DogovoriMrezhi(asansьor));
const sko = stroezh([dok('писмо', '05.04.2022',
    { naimenovanie: fakt('Писмо за изпълнено СКО') })]);
t('а самостоятелното СКО минава', F._a15DogovoriMrezhi(sko).length === 1);

// „Нотариален акт, № № 23“ — номерът носи своето „№“.
const dvojno = stroezh([dok('нотариален акт', '29.11.2022', { nomer: fakt('№ 23') })]);
t('второ № не се слага', /№ 23/.test(F._a15Sobstvenost(dvojno)[0])
  && !/№ №/.test(F._a15Sobstvenost(dvojno)[0]), F._a15Sobstvenost(dvojno)[0]);

// ── подредбата на датите е по календар, не по текст ─────────────────────────
t('датите се подреждат по календар',
  JSON.stringify(F._a15Sortirai(['29.03.2022', '01.12.2021', '05.01.2022']))
  === JSON.stringify(['01.12.2021', '05.01.2022', '29.03.2022']),
  F._a15Sortirai(['29.03.2022', '01.12.2021', '05.01.2022']));
t('двуцифрена година се разбира',
  F._a15Sortirai(['01.01.25', '01.01.24'])[0] === '01.01.24');

// ── частта се чете от документа ─────────────────────────────────────────────
t('частта се разпознава', F._a15Chast('по част ВиК') === 'ВиК');
t('и по описанието', F._a15Chast('водопроводна инсталация') === 'ВиК');
t('непозната част не гърми', F._a15Chast('нещо друго') === '');

// ── празно ──────────────────────────────────────────────────────────────────
t('строеж без документи дава празни раздели',
  F._a15AktoveProtokoli({}).length === 0 && F._a15Sobstvenost({}).length === 0
  && F._a15Skici({}).length === 0 && F._a15DogovoriMrezhi({}).length === 0);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — разделите се сглобяват`);
process.exit(loshi.length ? 1 : 0);
