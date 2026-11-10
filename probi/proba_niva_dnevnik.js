// Датите на нивата (раздел III на Протокол 2) — предложени от бетоновия дневник.
//
// Операторът, 21.10.2026: раздел III се пише отпосле; датите — по бетоновия
// дневник. 10.11.2026: „Да“. Редовете са от истинския дневник на Радулов.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'akt', 'moment.js'), 'utf8');
const grab = ime => { const m = new RegExp('^function ' + ime + '\\b[\\s\\S]*?\\n}', 'm').exec(src); return m ? m[0] : ''; };
const f = new Function([grab('_nvKota'), grab('_nvKotiNaRed'), grab('aktNivaOtDnevnik')].join('\n')
    + '\nreturn { aktNivaOtDnevnik, _nvKota };')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const DNEVNIK = [
    { element: 'Вертикали от к-3,12 до ±0,00', data_beton: '04.04.2024' },
    { element: 'Подложен бетон к-3,97', data_beton: '27.02.2024' },
    { element: 'Фундаментна плоча на к-3,17', data_beton: '22.03.2024' },
    { element: 'Плоча на кота ±0,00', data_beton: '06.06.2024' },
    { element: 'Вертикали от ±0,00 до +2,61', data_beton: '27.06.2024' },
    { element: 'Плоча на к+22,84', data_beton: '03.04.2025' },
    { element: 'Бордове покрив к+23,27', data_beton: '15.04.2025' },
    { element: 'Борд', data_beton: '' },
];
const p = f.aktNivaOtDnevnik(DNEVNIK, { korniz: '+22,84', bilo: 'К+28,40' });
t('изкоп — първото бетониране, не първият ред', p.izkop && p.izkop.data === '27.02.2024', p.izkop);
t('цокъл — плочата на ±0,00, не вертикалите до ±0,00', p.cokul && p.cokul.data === '06.06.2024', p.cokul);
t('корниз — плочата на котата му', p.korniz && p.korniz.data === '03.04.2025' && /22,84/.test(p.korniz.red), p.korniz);
t('било — няма такъв ред, не се гадае', !p.bilo, p.bilo);
t('всяко предложение казва от кой ред е', /Подложен бетон/.test(p.izkop.red) && p.izkop.kak === 'първото бетониране', p.izkop);
const bez = f.aktNivaOtDnevnik(DNEVNIK, {});
t('без кота корнизът не се гадае', !bez.korniz && !bez.bilo, bez);
t('кота с „К+“ и точка се чете', f._nvKota('К+11.90') === 11.9 && f._nvKota('-3,99') === -3.99, [f._nvKota('К+11.90'), f._nvKota('-3,99')]);
t('празен дневник — нищо', Object.keys(f.aktNivaOtDnevnik([], {})).length === 0, '');

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — датите на нивата идват от дневника`);
process.exit(loshi.length ? 1 : 0);
