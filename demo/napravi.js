// Сглобява демонстрационния обект и ГО ПРОВЕРЯВА с истинските функции на
// кухнята: потвържденията се смятат от `_s2SverimiKl`, за да няма разминаване
// между това, което екранът иска, и това, което демото носи.
const fs = require('fs');
const path = require('path');
const KOREN = 'C:\\project\\cloude\\.claude\\worktrees\\gracious-montalcini-79b88a';
const { kod, grab } = require(path.join(KOREN, 'probi', 'kod.js'));
const s = kod();

const F = new Function(
    (new RegExp('^const _S2_TABLICI = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + (new RegExp('^const _A15_VIDOVE = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + (new RegExp('^const _A15_CHASTI = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + (new RegExp('^const _A15_RAZDELI = \\{[\\s\\S]*?\\n\\};$', 'm').exec(s) || [''])[0] + '\n'
    + [grab(s, '_s2Fakti'), grab(s, '_s2KlPoKoloni'), grab(s, '_s2SverimiKl'),
       grab(s, '_s2Sveren'), grab(s, '_dokIme'),
       grab(s, '_dokKlyuchIme'), grab(s, '_dokKlyuchNomer'), grab(s, '_dokNomerOtTekst'),
       grab(s, '_dokRed'), grab(s, 'dokTetradka'), grab(s, 'dokVliza'), grab(s, 'dokIzrechenie'),
       grab(s, '_a15Chast'), grab(s, '_a15Svereni'), grab(s, '_a15TekstNa'),
       grab(s, '_a15Sortirai'), grab(s, '_a15Red'), grab(s, '_a15BezPovtor'),
       grab(s, '_a15Negov'), grab(s, '_a15PoIzraz'), grab(s, '_a15AktoveProtokoli'),
       grab(s, '_a15Sobstvenost'), grab(s, '_a15Skici'), grab(s, '_a15DogovoriMrezhi')].join('\n')
    + '\nconst _s2Id = d => d.id || d.fajl;'
    + '\nconst _DOK_PROCHETEN = "прочетен", _DOK_VPISAN = "вписан", _DOK_OTMETNAT = "отметнат";'
    + '\nconst _a15DataNa = r => String(r.data || "").trim();'
    + '\nreturn {_s2SverimiKl, dokTetradka, dokVliza, _a15AktoveProtokoli,'
    + ' _a15Sobstvenost, _a15Skici, _a15DogovoriMrezhi};')();

// ── фактите, както ги връща четецът ─────────────────────────────────────────
const f = (stoynost, citat, stranica) => ({ stoynost, citat: citat || stoynost, stranica: stranica || 1 });

let n = 0;
const dok = (vid_kod, vid, kak) => {
    const id = `demo-${++n}.pdf`;
    return { id, fajl: id, vid, vid_kod, stranica_ot: 1, stranica_do: 1,
             chetec: 'Claude', sken: false, ...kak };
};

// Три акта обр. 7 — за да се види диапазонът и броят в раздел 1.3.
const akt7 = ['14.03.2025', '28.05.2025', '11.09.2025'].map((d, i) =>
    dok('AKT7', 'Приложение № 7 към чл. 7, ал. 3, т. 7 (Образец 7)', {
        cheklist_red: 'Акт обр. 7',
        naimenovanie: f('Акт обр. 7 за приемане на извършените СМР по нива и елементи'),
        data: f(d, `Днес, ${d} г., се състави настоящият акт`, i + 1),
        sadarzhanie: f('ниво кота ±0,00 и плоча над сутерен'),
        obekt: { identifikator: f('00000.0000.0001') },
    }));

const dokumenti = [
    dok('NOT_AKT', 'Нотариален акт', {
        cheklist_red: 'Документ за собственост',
        naimenovanie: f('Нотариален акт за покупко-продажба на недвижим имот'),
        nomer: f('42'), data: f('18.02.2024'),
        obekt: { identifikator: f('00000.0000.0001') },
        razpredelenie: [{ obekti: f('Поземлен имот 00000.0000.0001'),
                          sobstvenici: f('Иван Петров Иванов; Мария Петрова Иванова') }],
    }),
    dok('RS', 'Разрешение за строеж', {
        cheklist_red: 'Разрешение за строеж',
        naimenovanie: f('Разрешение за строеж'),
        nomer: f('118'), data: f('05.06.2024'),
        izdatel: f('Главен архитект на Община Демонстрация'),
    }),
    dok('PROTOKOL2', 'Протокол обр. 2', {
        cheklist_red: 'Протокол обр. 2 (откриване на площадката)',
        naimenovanie: f('Протокол за откриване на строителна площадка и определяне на строителна линия и ниво'),
        nomer: f('1'), data: f('20.06.2024'),
    }),
    ...akt7,
    dok('AKT14', 'Приложение № 14 към чл. 7, ал. 3, т. 14 (Образец 14)', {
        cheklist_red: 'Акт обр. 14',
        naimenovanie: f('Акт обр. 14 за приемане на конструкцията'),
        data: f('02.10.2025'),
    }),
    dok('SKICA', 'Скица', {
        cheklist_red: 'Скица на поземления имот',
        naimenovanie: f('Скица от кадастралната карта'),
        nomer: f('15-000001-01.03.2024'), data: f('01.03.2024'),
        izdatel: f('СГКК — гр. Демонстрация'),
        obekt: { identifikator: f('00000.0000.0001') },
    }),
    dok('PRISAEDINYAVANE', 'Договор за присъединяване', {
        cheklist_red: 'Договор за присъединяване към електроразпределителната мрежа',
        naimenovanie: f('Договор за присъединяване към електроразпределителната мрежа'),
        // Нарочно с чертички: десет слети цифри изглеждат като ЕГН и пробата
        // ги спира — в демо, което се показва на хора, това е правилно.
        nomer: f('ДПЕРМ 1200-000-001'), data: f('12.07.2024'),
        izdatel: f('„Електроразпределителни мрежи Запад“ ЕАД'),
    }),
    dok('DEKLARACIA', 'Декларация за експлоатационни показатели', {
        cheklist_red: 'Декларации за експлоатационни показатели',
        naimenovanie: f('Декларация за експлоатационни показатели — бетон C25/30'),
        material: f('Бетон C25/30'), proizvoditel: f('„Бетон Демо“ ЕООД'),
        nomer: f('7'), data: f('10.03.2025'),
    }),
    // НАРОЧНО НЕСВЕРЕН — за да се види, че нечекнатото не влиза в акта.
    dok('IZMERVANE', 'Протокол от измерване', {
        cheklist_red: 'Протокол за измерване на заземителната уредба',
        naimenovanie: f('Протокол от измерване на заземителна уредба'),
        nomer: f('33'), data: f('15.10.2025'),
    }),
];

// ── потвържденията се смятат от самата кухня ────────────────────────────────
const potvardeni = {};
for (const d of dokumenti) {
    if (d.vid_kod === 'IZMERVANE') continue;            // този остава да чака
    for (const k of F._s2SverimiKl(d))
        potvardeni[`${d.id}::${k}`] = {
            stoynost: (k.split('.').reduce((o, x) => (o || {})[x], d) || {}).stoynost
                   ?? (d[k] || {}).stoynost ?? '',
            prochetena: (d[k] || {}).stoynost ?? '',
            koy: 'Демонстрация', koga: '29.10.2026',
        };
}

const KONSULTANT = {
    id: 9001, name: '„Надзор Демо“ ЕООД', eik: '000000001', type: 'ЮЛ',
    address: 'гр. Демонстрация, ул. Първа 1',
    manager: 'инж. Демонстрация Демонстрова',
    licenseNumber: 'РК-0000', licenseValidTo: '31.12.2030',
    employees: [
        { name: 'арх. Първан Първанов', part: 'Архитектура', reg: '00001' },
        { name: 'инж. Втора Вторанова', part: 'Конструктивна', reg: '00002' },
        { name: 'инж. Трети Третев', part: 'ВиК', reg: '00003' },
    ],
};

const OBEKT = {
    id: 'demo-obekt', pi: '00000.0000.0001',
    name: 'ДЕМОНСТРАЦИЯ — жилищна сграда', nik: 'Демо',
    stroej: 'ЖИЛИЩНА СГРАДА С ГАРАЖИ — ДЕМОНСТРАЦИОНЕН ОБЕКТ',
    address: 'гр. Демонстрация, УПИ I-1, кв. 1',
    consultant: { id: KONSULTANT.id },
    vid: 'сграда', kategoria: 4,
    kategoria_citat: 'четвърта категория, съгласно чл. 137, ал. 1, т. 4 ЗУТ',
    zk: { number: '9001', date: '18.06.2024' },
    docDates: { protokol2: '20.06.2024', obrazec3: '25.06.2024', akt14: '02.10.2025' },
    sobstvenost: {
        lica: [
            { id: 'l1', ime: 'Иван Петров Иванов', vid: 'fiz' },
            { id: 'l2', ime: 'Мария Петрова Иванова', vid: 'fiz' },
        ],
        obekti: [{ id: 'o1', vid: 'земя', identifikator: '00000.0000.0001', ploasht: '640' }],
        sabitia: [
            { id: 's1', obekt: 'o1', data: '18.02.2024', vid: 'покупко-продажба',
              ot: null, na: 'l1', dyal: '1/2', dokument: 'Нотариален акт № 42' },
            { id: 's2', obekt: 'o1', data: '18.02.2024', vid: 'покупко-продажба',
              ot: null, na: 'l2', dyal: '1/2', dokument: 'Нотариален акт № 42' },
        ],
    },
    sloy2: { od: { dokumenti, potvardeni } },
    dokumenti: [],
    ostatak: {},
};

// ── ПРОВЕРКА, преди да се запише ────────────────────────────────────────────
const tet = F.dokTetradka(OBEKT, OBEKT);
const vliza = F.dokVliza(OBEKT, OBEKT);
const razdeli = {
    '1.1 собственост': F._a15Sobstvenost(OBEKT, OBEKT),
    '1.3 актове и протоколи': F._a15AktoveProtokoli(OBEKT, OBEKT),
    '1.4 скици': F._a15Skici(OBEKT, OBEKT),
    '1.5 договори с мрежите': F._a15DogovoriMrezhi(OBEKT, OBEKT),
};
console.log(`тетрадка: ${tet.length} реда · влизат в акта: ${vliza.length}`);
for (const [ime, redove] of Object.entries(razdeli)) {
    console.log(`\n${ime}:`);
    redove.forEach(r => console.log('   - ' + r));
}
const greshki = [];
if (tet.length !== dokumenti.length) greshki.push('тетрадката не брои всички документи');
if (vliza.length !== dokumenti.length - 1) greshki.push('несвереният трябва да е точно един');
if (!/до 11\.09\.2025/.test(razdeli['1.3 актове и протоколи'].join(''))) greshki.push('няма диапазон при обр. 7');
if (!/3 броя/.test(razdeli['1.3 актове и протоколи'].join(''))) greshki.push('няма брой при обр. 7');
for (const [ime, r] of Object.entries(razdeli)) if (!r.length) greshki.push('празен раздел: ' + ime);
if (greshki.length) { console.error('\nПРОБЛЕМИ:\n  ' + greshki.join('\n  ')); process.exit(1); }

fs.writeFileSync(path.join(KOREN, 'demo', 'demo-obekt.json'),
    JSON.stringify({ obekt: OBEKT, konsultant: KONSULTANT }, null, 1), 'utf8');
console.log('\nзаписано: demo/demo-obekt.json');
