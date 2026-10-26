// ЕКРАН 4 — ПРОЕКТЪТ. Единственото място, където влиза проектът.
//
// Проверява се онова, което заданието иска: записките се качват по части,
// вижда се какво е извадено, а текстовите блокове чакат ЕДНО ✔. Плюс
// кръговете по чл. 154 — нов кръг значи нови записки, а старите остават.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const KOREN = path.join(__dirname, '..');
const PAPKA = path.join(KOREN, 'akt');

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

// Какво връща четецът на записки.
const ZAPISKA = {
    zapiska: {
        fajl: '02_Zapiska_kabeli.docx', chast_ime: 'Електро', chast_kod: 'EL',
        priznaci: [{ k: 'elektro' }, { k: 'kabel_srn' }], materiali: [{ ime: 'САХЕк(вн)П' }],
        ot_tekst: true, chetec: 'claude',
    },
    blokove: [{
        chast: 'Електро', chast_kod: 'EL', fajl: '02_Zapiska_kabeli.docx',
        razdeli: [
            { podzaglavie: 'Кабели СрН 20 kV', tekst: 'Кабелите се полагат в съществуваща тръбна мрежа.',
              rolya: 'описание', red: 1, stranica: 3 },
            { podzaglavie: 'Изчисляване на загуба', tekst: 'ΔU = P·L / (C·S)',
              rolya: 'изчисление', red: 2, stranica: 5 },
        ],
    }],
};

const OBEKT = {
    id: 'hus', pi: '68134.1006.2440', nik: 'ХЪС',
    stroej: 'Външно електрозахранване с кабели СрН и шахтов ТП',
    updatedAt: '2026-10-26T08:00:00Z',
};

async function otvori(hash) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + hash,
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [JSON.parse(JSON.stringify(OBEKT))], consultants: [],
                apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url) => ({ ok: true, status: 200, json: async () =>
                /zapiski/.test(String(url)) ? ZAPISKA : { grupi: [] } });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => '7';
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 200));
    return { w, d: w.document, greshki };
}

(async () => {

const a = await otvori('#/proekt/hus/0');
t('Екран 4 се рисува без грешка в конзолата', a.greshki.length === 0, a.greshki);
t('другите екрани са скрити',
  a.d.getElementById('ekran-plot').hidden && a.d.getElementById('ekran-obekt').hidden
  && a.d.getElementById('ekran-moment').hidden);
t('от проекта се връщаш в ОБЕКТА',
  a.d.getElementById('shapka-nazad').getAttribute('href') === '#/obekt/hus/0');

// ── кръговете ────────────────────────────────────────────────────────────────
let prevkl = tekst(a.d.querySelector('.prevkl'));
t('първият кръг е оценката по чл. 142', /Оценка по чл\. 142/.test(prevkl), prevkl);
t('има бутон за ново изменение', /\+ изменение/.test(prevkl), prevkl);

// ── качването ────────────────────────────────────────────────────────────────
t('записките се избират с бутон, не се хвърлят',
  /избери записки/.test(tekst(a.d.getElementById('proekt-telo'))));
t('казва, че се чете само отметнатото',
  /Чете се само отметнатото/.test(tekst(a.d.getElementById('proekt-telo'))));

// Истински File обекти — четецът ги подава на FileReader.
const fajl = (ime, vid) => new a.w.File(['проба'], ime, { type: vid });
a.w.proektIzbroi([
    fajl('02_Zapiska_kabeli.docx', ''),
    fajl('Zapiska_ARH.pdf', 'application/pdf'),
    fajl('staro.doc', 'application/msword'),
]);
const fajlove = [...a.d.querySelectorAll('.fajl')];
t('изброените записки излизат', fajlove.length === 3, fajlove.length);
t('до .docx пише „безплатно“', /безплатно/.test(tekst(fajlove[0])), tekst(fajlove[0]));
t('до .pdf пише „през АИ“', /през АИ/.test(tekst(fajlove[1])), tekst(fajlove[1]));
t('нечетимата не може да се отметне', fajlove[2].querySelector('input').disabled === true);
t('нищо не е отметнато само', fajlove.every(x => !x.querySelector('input').checked));

// ── четенето ─────────────────────────────────────────────────────────────────
a.w.proektOtmetni(0, true);
await a.w.proektProcheti();
await new Promise(r => setTimeout(r, 150));

const telo = tekst(a.d.getElementById('proekt-telo'));
t('прочетената част излиза с името си', /Електро/.test(telo), telo.slice(0, 200));
t('показва какво е извадено',
  /2 признака · 1 материала/.test(telo), telo);
t('казва откъде е и че е безплатно',
  /02_Zapiska_kabeli\.docx/.test(telo) && /от текст/.test(telo), telo);
t('казва, че нищо не влиза без ✔', /без твоето ✔/.test(telo), telo);

// ── блоковете ────────────────────────────────────────────────────────────────
const blokove = [...a.d.querySelectorAll('.blok')];
t('блоковете излизат', blokove.length === 2, blokove.length);
t('групирани са по част', /Част Електро/.test(telo), telo);
t('описанието чака ✔',
  /✔ потвърди/.test(tekst(blokove[0])), tekst(blokove[0]));
t('изчислението НЕ влиза в доклада и няма ✔',
  /не влиза в доклада/.test(tekst(blokove[1])) && !/✔ потвърди/.test(tekst(blokove[1])),
  tekst(blokove[1]));
t('блокът казва от кой файл и коя страница е',
  /стр\. 3/.test(tekst(blokove[0])), tekst(blokove[0]));
t('текстът е дословен',
  /Кабелите се полагат в съществуваща тръбна мрежа\./.test(tekst(blokove[0])));
t('горе брои колко чакат', /1 чакат твоето ✔|чакат твоето ✔/.test(telo), telo);

// едно ✔ затваря блока
const k64 = encodeURIComponent('Електро · кабели срн 20 kv');
a.w.proektPotvardi(k64);
let zapis = JSON.parse(a.w.localStorage.getItem('akt_v5')).projects[0];
t('✔ записва състоянието при кръга',
  zapis.blokove['Електро · кабели срн 20 kv'].sastoyanie === 'potvardeno',
  Object.keys(zapis.blokove || {}));
t('и кой го е потвърдил, с дата',
  !!zapis.blokove['Електро · кабели срн 20 kv'].koga);
t('потвърденият вече няма бутон „потвърди“',
  !/✔ потвърди/.test(tekst([...a.d.querySelectorAll('.blok')][0])),
  tekst([...a.d.querySelectorAll('.blok')][0]));

// ── новият кръг ──────────────────────────────────────────────────────────────
a.w.proektNovKrug();
await new Promise(r => setTimeout(r, 100));
prevkl = tekst(a.d.querySelector('.prevkl'));
t('новият кръг е изменение по чл. 154',
  /Изменение по чл\. 154/.test(prevkl), prevkl);
t('и се избира сам', /Кръгове · 2/.test(prevkl), prevkl);
t('новият кръг си няма записки',
  /Още няма\. Качи записките/.test(tekst(a.d.getElementById('proekt-telo'))));

zapis = JSON.parse(a.w.localStorage.getItem('akt_v5')).projects[0];
t('СТАРИЯТ кръг пази записките си',
  (zapis.zapiski.chasti || []).length === 1, zapis.zapiski);
t('и потвърдения си блок',
  zapis.blokove['Електро · кабели срн 20 kv'].sastoyanie === 'potvardeno');

a.w.proektSmeniKrug(0);
t('връщането в първия кръг показва записките пак',
  /Електро/.test(tekst(a.d.getElementById('proekt-telo'))));

// ── границата ────────────────────────────────────────────────────────────────
t('Екран 4 е свой файл',
  fs.existsSync(path.join(PAPKA, 'proekt.js')));
t('старият index.html пак е непокътнат',
  !/akt\//.test(fs.readFileSync(path.join(KOREN, 'index.html'), 'utf8')));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — проектът стои`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
