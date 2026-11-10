// Бетоновият дневник → актовете обр. 7, в момента Акт 7.
//
// Операторът, 09–10.11.2026: по един акт на бетониране, актът е ПРЕДИ бетона,
// всички в ЕДИН файл. Прочетеното е предложение — поправя се, слива се, маха се.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const tekst = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>'
            + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const PREDLOZHENIE = [
    { element: 'Плоча на к+2,61', obem: '45', data_beton: '29.07.2024', stranica: 2,
      belezhka: 'годината — по „Започнат на“ и реда на месеците',
      data: '28.07.2024', ot: '+2,61', do: '+2,61', smr: 'Кофраж и армировка на плоча на к+2,61',
      razreshava: 'Бетониране на гореописаните елементи.' },
    { element: 'Вертикали от к+2,61 до +5,50', obem: '12', data_beton: '04.08.2024', stranica: 2,
      belezhka: '', data: '03.08.2024', ot: '+2,61', do: '+5,50',
      smr: 'Кофраж и армировка на вертикали от к+2,61 до +5,50', razreshava: 'Бетониране на гореописаните елементи.' },
    { element: 'Борд', data_beton: '', belezhka: 'датата на бетона не се чете — впиши я',
      data: '', ot: '', do: '', smr: 'Кофраж и армировка на борд', razreshava: 'Бетониране на гореописаните елементи.' },
];

async function otvori() {
    const greshki = [], zaiavki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/#/moment/r/0/' + encodeURIComponent('Акт 7'),
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [{ id: 'r', pi: '68134.702.9889', stroej: 'Сграда', consultant: { id: 1 } }],
                consultants: [{ id: 1, name: 'СиБиТи Консулт ООД', employees: [] }],
                apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.URL.createObjectURL = () => 'blob:x';
            w.URL.revokeObjectURL = () => {};
            w.fetch = async (url, opt) => {
                const telo = JSON.parse((opt && opt.body) || '{}');
                zaiavki.push([String(url), telo]);
                if (/beton\/dnevnik/.test(url))
                    return { ok: true, status: 200, json: async () => ({ dnevnik: {
                        fajl: 'dnevnik.pdf', chetec: 'Claude', zapochnat: '27.02.2024',
                        predlozhenie: PREDLOZHENIE } }) };
                if (/generate\/akt7/.test(url))
                    return { ok: true, status: 200, blob: async () => new w.Blob(['docx']) };
                return { ok: true, status: 200, json: async () => ({ red: ['Акт 7'],
                    grupi: [{ moment: 'Акт 7', dokumenti: [] }] }) };
            };
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true;
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 250));
    return { w, d: w.document, greshki, zaiavki };
}

(async () => {
const a = await otvori();
t('моментът Акт 7 се рисува без грешка', a.greshki.length === 0, a.greshki);
t('има карта „Бетоновият дневник“', /Бетоновият дневник → актове обр\. 7/.test(tekst(a.d.body)), tekst(a.d.body).slice(0, 300));

// Четене: файлът се подава като от полето.
const vhod = a.d.getElementById('moment-dnevnik-fajl');
Object.defineProperty(vhod, 'files', { value: [new a.w.File(['%PDF'], 'dnevnik.pdf', { type: 'application/pdf' })] });
await a.w.momentDnevnikCheti();
await new Promise(r => setTimeout(r, 50));
const st = a.w.aktObekt('r');
t('прочетеното се пази при строежа', (st.akt7_dnevnik || {}).aktove?.length === 3, st.akt7_dnevnik);
t('дневникът влиза и в досието',
  ((st.sloy2 || {}).od || {}).dokumenti?.some(d => d.vid === 'Дневник на бетоновите работи'), st.sloy2);
const b = tekst(a.d.body);
t('казва откъде е всеки ред', /дневник, стр\. 2: „Плоча на к\+2,61“/.test(b) && /бетон 29\.07\.2024/.test(b), b.slice(0, 600));
t('казва нечетливата дата', /не се чете — впиши я/.test(b), '');
t('3 акта', /3 акта/.test(b), '');

// Поправка, сливане, махане.
a.w.momentDnevnikPoprav(2, 'data', '13.04.2025');
t('поправката се пази', st.akt7_dnevnik.aktove[2].data === '13.04.2025', st.akt7_dnevnik.aktove[2]);
a.w.momentDnevnikSlei(0);
const s = st.akt7_dnevnik.aktove[0];
t('слети: един акт по-малко', st.akt7_dnevnik.aktove.length === 2, st.akt7_dnevnik.aktove.length);
t('слети: нивата обхващат двата', s.ot === '+2,61' && s.do === '+5,50', s);
t('слети: СМР е събрано, датата е на първия',
  s.smr === 'Кофраж и армировка на плоча на к+2,61; вертикали от к+2,61 до +5,50' && s.data === '28.07.2024', s);

// Съставяне — един файл с всички.
await a.w.momentDnevnikSastavi();
const gen = a.zaiavki.find(z => /generate\/akt7/.test(z[0]));
t('съставянето праща всички актове в една заявка', gen && gen[1].akt7_seriya.length === 2, gen && gen[1]);
t('с датите и СМР', gen && gen[1].akt7_seriya[1].data === '13.04.2025', gen && gen[1].akt7_seriya);
t('и казва, че е свален', /2 акта в един файл/.test(tekst(a.d.getElementById('moment-dnevnik-hod'))),
  tekst(a.d.getElementById('moment-dnevnik-hod')));
a.w.momentDnevnikMahni(1);
t('махане', st.akt7_dnevnik.aktove.length === 1, st.akt7_dnevnik.aktove.length);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — дневникът дава актовете`);
process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
