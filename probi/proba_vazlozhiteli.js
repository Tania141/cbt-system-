// Възложителите: роля, не списък. Идват от регистъра на собствеността.
//
// Операторът, 13.10.2026: „Всяко възникнало вещно право е Възложител по ЗУТ.“
// Формата остава, но се показва само докато регистърът е празен.
const { JSDOM, VirtualConsole } = require('jsdom');
const { stranicaSVgradenKod, HTML } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const REGISTAR = {
    lica: [{ id: 'z', ime: 'Иван Георгиев Петров' },
           { id: 's', ime: 'Строй ЕООД', vid: 'юридическо', egn: '123456789' }],
    obekti: [{ id: 'zem', vid: 'земя', identifikator: '68134.4354.781' },
             { id: 'ps', vid: 'право на строеж', opisanie: 'право на строеж' }],
    sabitia: [
        { id: '1', obekt: 'zem', data: '01.01.2020', vid: 'първоначално', ot: null, na: 'z', dyal: '1/1' },
        { id: '2', obekt: 'ps', data: '01.06.2022', vid: 'учредяване право на строеж', ot: null, na: 's', dyal: '1/1' }],
};

const KONSULTANT = { id: 1, name: 'СиБиТи Консулт ЕООД', eik: '1', type: 'ЮЛ', employees: [] };

function obekt(sRegistar) {
    return {
        id: '1', pi: '68134.4354.781', name: 'Проба', nik: 'Проба',
        consultant: { id: 1 }, vid: 'сграда', kategoria: 5,
        clients: [{ type: 'ЮЛ', name: 'Стар Възложител ЕООД', eik: '999' }],
        ...(sRegistar ? { sobstvenost: JSON.parse(JSON.stringify(REGISTAR)) } : {}),
    };
}

async function vdigni(o) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranicaSVgradenKod(HTML), {
        runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
        virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [o], currentProject: o, consultants: [KONSULTANT],
                history: [], apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
        },
    });
    const w = dom.window;
    w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' },
                             json: async () => ({}), text: async () => '{}' });
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));
    return { w, greshki };
}

(async () => {
    // ── с регистър ────────────────────────────────────────────────────────
    const { w, greshki } = await vdigni(obekt(true));
    t('приложението се вдига', typeof w.vazlozhiteli === 'function');

    const v = w.vazlozhiteli(w.appData ? w.appData.currentProject : obekt(true));
    const spisak = w.vazlozhiteli(obekt(true));
    t('източникът е регистърът', spisak.otkade === 'registar', spisak.otkade);
    t('двама възложители', spisak.spisak.length === 2, spisak.spisak.map(x => x.name));
    t('суперфициарът е сред тях', spisak.spisak.some(x => x.name === 'Строй ЕООД'));
    t('старият ръчен списък не се ползва',
       !spisak.spisak.some(x => /Стар Възложител/.test(x.name)), spisak.spisak.map(x => x.name));
    t('физическото лице е с две имена',
       spisak.spisak.some(x => x.dveImena === 'Иван Петров'), spisak.spisak.map(x => x.dveImena));

    w.navigateTo('new-passport');
    w.renderPassportForm('1');   // функцията иска id, не обект
    await new Promise(r => setTimeout(r, 100));
    const tekst = w.document.getElementById('page-new-passport').textContent;
    t('паспортът показва възложителите от регистъра', /Иван Георгиев Петров/.test(tekst));
    t('казва, че не се въвеждат', /Не се въвеждат/.test(tekst));
    const rachno = w.document.getElementById('karta-vazlozhiteli-rachno');
    t('ръчната форма е скрита, но я има', rachno && rachno.style.display === 'none',
       rachno ? rachno.style.display : '(няма я)');

    // ── без регистър: формата се връща ───────────────────────────────────
    const bez = await vdigni(obekt(false));
    const v2 = bez.w.vazlozhiteli(obekt(false));
    t('без регистър източникът е паспортът', v2.otkade === 'pasport', v2.otkade);
    t('без регистър се ползва ръчният списък',
       v2.spisak.length === 1 && /Стар Възложител/.test(v2.spisak[0].name), v2.spisak);

    bez.w.navigateTo('new-passport');
    bez.w.renderPassportForm('1');
    await new Promise(r => setTimeout(r, 100));
    const rachno2 = bez.w.document.getElementById('karta-vazlozhiteli-rachno');
    t('без регистър ръчната форма се вижда', rachno2 && rachno2.style.display !== 'none',
       rachno2 ? rachno2.style.display : '(няма я)');

    t('няма грешки', greshki.length === 0 && bez.greshki.length === 0,
       [...greshki, ...bez.greshki].slice(0, 2));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — възложителят е роля`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.log('  ЛО  ' + e.stack); process.exit(1); });
