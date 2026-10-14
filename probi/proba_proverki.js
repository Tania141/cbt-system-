// Подредбата на „Проверки“: късата и важна група е ПЪРВА.
//
// Операторът, 14.10.2026: „двете полета „от проекта“ и „от документи на ръка“
// са несъразмерни, на практика второто не се вижда“. 40 срещу 10 полета в
// равни колони — дясната свършва веднага и се губи, макар от нея да зависи
// кои актове изобщо се съставят.
const { JSDOM, VirtualConsole } = require('jsdom');
const { stranicaSVgradenKod, HTML } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const f = (v, s = 'potvardeno') => ({ stoynost: v, sastoyanie: s });
const OBEKT = {
    id: '1', pi: '1', name: 'Проба', nik: 'П', consultant: { id: 1 }, vid: 'сграда', kategoria: 5,
    zapiski: { chasti: [{ chast_kod: 'ARH', fajl: 'a.pdf' }, { chast_kod: 'KONSTR', fajl: 'k.pdf' }] },
    fakti: {
        etaji: f('1'), kota_izkop: f('-2.50'), korniz_post: f('6.09'),
        vid: f('сграда'), kategoria: f('пета', 'predlozheno'),
        prednaznachenie: f('жилищна', 'predlozheno'), sobstvenik: f('Иван Петров', 'predlozheno'),
    },
};
const KONSULTANT = { id: 1, name: 'СиБиТи Консулт ЕООД', eik: '1', type: 'ЮЛ', employees: [] };

(async () => {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranicaSVgradenKod(HTML), {
        runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
        virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [OBEKT], currentProject: OBEKT, consultants: [KONSULTANT],
                history: [], apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
        },
    });
    const w = dom.window;
    w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' },
                             json: async () => ({ shapka: [], razminavania: [], chasti: [] }),
                             text: async () => '{}' });
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));

    w.navigateTo('kakav');
    await new Promise(r => setTimeout(r, 700));
    const el = w.document.getElementById('page-kakav');
    const tekst = el.textContent.replace(/\s+/g, ' ');

    const iDok = tekst.indexOf('От документите и на ръка');
    const iPro = tekst.indexOf('От проекта');
    t('и двете групи се рисуват', iDok >= 0 && iPro >= 0, [iDok, iPro]);
    t('късата и важна група е ПЪРВА', iDok >= 0 && iPro > iDok, [iDok, iPro]);

    const a = tekst.match(/От документите и на ръка (\d+) полета/);
    const b = tekst.match(/От проекта (\d+) полета/);
    t('всяка група казва колко полета има', !!a && !!b, [a && a[1], b && b[1]]);
    t('групите наистина са несъразмерни', a && b && Number(b[1]) > Number(a[1]) * 2,
       [a && a[1], b && b[1]]);
    t('казва колко чакат потвърждение', /чакат ✔/.test(tekst));

    // Полетата вече се подреждат в стълбове, а не в една колона.
    t('полетата са в решетка', /repeat\(auto-fill/.test(el.innerHTML));
    t('няма грешка при рисуването', greshki.length === 0, greshki.slice(0, 2));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `
${loshi.length} проблема` : `
${dobri.length} проверки — подредбата е наред`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.log('  ЛО  ' + e.stack); process.exit(1); });
