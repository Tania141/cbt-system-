// Разрешението и строителят от досието — и точките в датите.
//
// Операторът, 09.11.2026: прочетеното и записано в досието разрешение за
// строеж не стигаше до Протокол 2; същото с договора за строителство. А
// датите в новите екрани искаха точките на ръка — старите ги слагаха сами.
const { kod, grab } = require('./kod');
const Y = require('../akt/yadro.js');
const s = kod();

const f = new Function(
    [grab(s, '_s2Prilozhi'), grab(s, '_ppOtDosie'), grab(s, 'buildPassportRows'),
     'const _s2Id = d => d.id || d.fajl;', 'const _a15Redove = () => [], _stroezh = p => p, appData = { consultants: [] }, _bezEGN = r => r;'].join('\n')
    + '\nreturn {_ppOtDosie, buildPassportRows};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const fk = v => ({ stoynost: v, stranica: 1 });
const karta = r => Object.fromEntries(r);

const RS = { id: 'rs1', vid: 'Разрешение за строеж', vid_kod: 'RS', nomer: fk('№ 277'),
             data: fk('02.11.2023'), izdatel: fk('Главен архитект на район Люлин') };
const DG = { id: 'dg1', vid: 'Договор за строителство', vid_kod: 'DOGOVOR_STROITEL', nomer: fk('17'),
             uchastnici: [{ rolya: 'възложител', ime: fk('Иван Петров') },
                          { rolya: 'строител', ime: fk('Строй Инвест ЕООД'), eik: fk('203456789'),
                            predstavlyavan_ot: fk('Петър Строителев'), adres: fk('София') },
                          { rolya: 'технически ръководител', ime: fk('инж. Мария Техникова') }] };
const obekt = (dop) => ({ pi: '1', stroej: 'Сграда', sloy2: { od: { dokumenti: [RS, DG], potvardeni: {} } }, ...dop });

// 1. Празен паспорт — досието попълва.
let r = karta(f.buildPassportRows(obekt({}), null, {}));
t('РС № от досието', r['РС_Номер'] === '277', r['РС_Номер']);
t('РС дата от досието', r['РС_Дата'] === '02.11.2023', r['РС_Дата']);
t('РС издател от досието', r['РС_Издател'] === 'Главен архитект на район Люлин', r['РС_Издател']);
t('строителят от договора', r['Строител_Фирма'] === 'Строй Инвест ЕООД' && r['Строител_ЕИК'] === '203456789', r);
t('управителят от договора', r['Строител_Управител'] === 'Петър Строителев', r['Строител_Управител']);
t('техническият ръководител от договора', r['Строител_ТехРък'] === 'инж. Мария Техникова', r['Строител_ТехРък']);

// 2. Написаното в паспорта бие досието; празното поле се допълва.
r = karta(f.buildPassportRows(obekt({ permit: { number: '300', date: '' },
                                       builder: { company: 'Друга ООД', eik: '' } }), null, {}));
t('паспортът бие досието', r['РС_Номер'] === '300' && r['Строител_Фирма'] === 'Друга ООД', r);
t('празно поле в паспорта се допълва', r['РС_Дата'] === '02.11.2023' && r['Строител_ЕИК'] === '203456789', r);

// 3. Поправеното в досието бие прочетеното.
r = karta(f.buildPassportRows(obekt({ sloy2: { od: { dokumenti: [RS],
        potvardeni: { 'rs1::nomer': { stoynost: '278' } } } } }), null, {}));
t('потвърденото бие прочетеното', r['РС_Номер'] === '278', r['РС_Номер']);

// 4. РС за друг строеж (външен кабел) не става разрешението на сградата.
r = karta(f.buildPassportRows(obekt({ sloy2: { od: { dokumenti: [{ ...RS, za_drug_stroezh: true }] } } }), null, {}));
t('РС за друг строеж не влиза', r['РС_Номер'] === '', r['РС_Номер']);

// 5. Без досие — нищо не гърми.
r = karta(f.buildPassportRows({ pi: '1' }, null, {}));
t('без досие — празно', r['РС_Номер'] === '' && r['Строител_Фирма'] === '', r);

// 6. Точките в датата.
const D = Y.aktDataTochki;
t('голи цифри → точки', D('26042024') === '26.04.2024', D('26042024'));
t('докато се пише', D('260') === '26.0' && D('26.042') === '26.04.2', [D('260'), D('26.042')]);
t('с точки на друго място — не се пипа', D('1.3.2025') === '1.3.2025', D('1.3.2025'));
t('с „г.“ — не се пипа', D('04.11.2026 г.') === '04.11.2026 г.', D('04.11.2026 г.'));
t('датите в остатъка имат образец', Y.aktOstatak('Протокол 2').filter(x => x.data).length === 4
  && Y.aktOstatak('Акт 15').some(x => x.klyuch === 'data_akt' && x.data), Y.aktOstatak('Протокол 2'));

// 7. Втори строеж — документите от НЕГОВИТЕ данни (10.11.2026). Дотук
// съставянето вземаше обекта и вторият строеж излизаше с РС на първия.
const vtori = { stroej: 'Трафопост', permit: { number: '45', date: '01.02.2025' }, consultant: { id: 2 },
                sloy2: { od: { dokumenti: [] } } };
const imot = { id: 'x', pi: '68134.1', address: 'ул. Проба 1', stroej: 'Сграда', permit: { number: '277' },
               consultant: { id: 1 }, owner: 'Иван', stroezhi_dop: [vtori], tekusht_stroezh: 1 };
const zd = Y.aktZaDokument(imot, vtori);
t('втори строеж: РС — неговото', zd.permit.number === '45', zd.permit);
t('втори строеж: строежът и консултантът — неговите', zd.stroej === 'Трафопост' && zd.consultant.id === 2, zd);
t('втори строеж: имотът — от обекта', zd.pi === '68134.1' && zd.address === 'ул. Проба 1' && zd.owner === 'Иван', zd);
t('първи строеж — самият обект', Y.aktZaDokument(imot, imot) === imot, '');
r = karta(f.buildPassportRows(zd, null, {}));
t('втори строеж: РС_Номер в документа е неговият', r['РС_Номер'] === '45', r['РС_Номер']);
const fs_ = require('fs'), path_ = require('path');
const pas = fs_.readFileSync(path_.join(__dirname, '..', 'akt', 'pasport.js'), 'utf8');
t('паспортът пише РС на отворения строеж', /st\.permit = \{ \.\.\.\(st\.permit/.test(pas) && !/\bp\.permit = /.test(pas), '');
const dk = fs_.readFileSync(path_.join(__dirname, '..', 'akt', 'dokumenti.js'), 'utf8');
t('„Състави“ подава строежа', /genDokument\(aktZaDokument\(z\.p, z\.st\)/.test(dk), '');

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — досието стига до паспорта`);
process.exit(loshi.length ? 1 : 0);
