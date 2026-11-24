// ВРАТАТА КЪМ СТОЙНОСТТА И ШАБЛОНЪТ КАЗВАТ ЕДНО (24.11.2026).
//
// Стъпка 2 от плана по анализа (18.11.2026, т. 5.2): „Каква е датата на РС“
// имаше два отговора — един на екрана („Какво знаем“, `aktStoynost`) и друг в
// документа (`buildPassportRows`). Тук за едни и същи данни се пита и двете.
// Видени и поправени:
//   · РС с номер в паспорта, а датата само в досието — шаблонът я взимаше,
//     екранът не;
//   · празен регистър — шаблонът пишеше възложителите от паспорта, екранът
//     казваше „не знам“;
//   · сверен признак ≠ паспорт без „Коя е?“ — документът взимаше паспорта тихо.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>'
            + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const vc = new VirtualConsole(), greshki = [];
vc.on('jsdomError', e => greshki.push(String(e.message || e)));
const dom = new JSDOM(stranica(), { runScripts: 'dangerously', url: 'http://localhost/akt/',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [], consultants: [] })); } });
const w = dom.window;
let pitano = null;
w.confirm = tekst => { pitano = tekst; return false; };

const red = (rows, k) => (rows.find(r => r[0] === k) || [])[1] || '';
const shablon = p => w.buildPassportRows(p, null, {});

// ── РС: номер в паспорта, датата — само в досието ───────────────────────────
const RS_DOSIE = { id: 'rs.pdf', fajl: 'rs.pdf', vid: 'Разрешение за строеж', vid_kod: 'RS',
    nomer: { stoynost: '254' }, data: { stoynost: '10.12.2023' }, izdatel: { stoynost: 'Община Ихтиман' } };
const p1 = { id: 'a', pi: '1.2.3', stroej: 'Еднофамилна жилищна сграда', kategoria: '5',
    permit: { number: '254' }, sloy2: { od: { dokumenti: [RS_DOSIE], potvardeni: { 'rs.pdf::data': { stoynost: '10.12.2023' } } } } };
const rows1 = shablon(p1);
const v1 = w.aktStoynost(p1, p1, 'rs');
t('шаблонът пише датата от досието', red(rows1, 'РС_Дата') === '10.12.2023', red(rows1, 'РС_Дата'));
t('вратата казва същата дата', /от 10\.12\.2023/.test(v1.stoynost), v1);
t('и казва, че датата е от досието', /датата/.test(v1.otkade) && /досието/.test(v1.otkade), v1.otkade);
t('и издателя — като шаблона', red(rows1, 'РС_Издател') === 'Община Ихтиман' && /Ихтиман/.test(v1.stoynost), [red(rows1, 'РС_Издател'), v1]);

// ── Възложителите: празен регистър → паспортът, и на двете места ────────────
const p2 = { id: 'b', pi: '1.2.4', stroej: 'Сграда', clients: [{ name: 'Петър Илич Панчев', type: 'ФЛ' }] };
const rows2 = shablon(p2);
const v2 = w.aktStoynost(p2, p2, 'sobstvenik');
t('шаблонът пише възложителя от паспорта', red(rows2, 'Възложител_1_Фирма') === 'Петър Илич Панчев', rows2.filter(r => /Възложител_1/.test(r[0])));
t('вратата казва същото, с „Паспорт“', v2.stoynost === 'Петър Илич Панчев' && v2.otkade === 'Паспорт', v2);

// ── Строежът и категорията: еднакви, когато няма признак ────────────────────
t('строежът — еднакъв', red(rows1, 'Строеж') === w.aktStoynost(p1, p1, 'obekt').stoynost);
t('категорията — еднаква', red(rows1, 'Категория_Номер') === w.aktStoynost(p1, p1, 'kategoria').stoynost);
t('без разминаване не се пита', w.stoynostPitaiPrediDokument(p1, p1) === true && pitano === null, pitano);

// ── Сверен признак ≠ паспорт, без „Коя е?“ → пита се преди съставяне ────────
const p3 = { ...p1, fakti: { kategoria: { stoynost: '4', sastoyanie: 'potvardeno' } } };
const razm = w.stoynostRazminavaniaZaDokument(p3, p3);
t('разминаването се вижда за документа', razm.length === 1 && razm[0].k === 'kategoria', razm);
t('и казва какво ще влезе — паспортът, както пише шаблонът',
  razm[0] && razm[0].vliza === red(shablon(p3), 'Категория_Номер'), [razm, red(shablon(p3), 'Категория_Номер')]);
t('преди съставяне се пита и отказът спира', w.stoynostPitaiPrediDokument(p3, p3) === false
  && /Категорията/.test(pitano) && /„5“/.test(pitano) && /„4“/.test(pitano), pitano);

// ── Казала си „Коя е?“ → няма питане и документът взима твоето ──────────────
const p4 = JSON.parse(JSON.stringify(p3));
w.stoynostReshi(p4, p4, 'kategoria', '4');
pitano = null;
t('след „Коя е?“ не се пита', w.stoynostPitaiPrediDokument(p4, p4) === true && pitano === null, pitano);
t('и документът пише твоето', red(shablon(p4), 'Категория_Номер') === '4', red(shablon(p4), 'Категория_Номер'));

// ── Двете места, които съставят, питат ──────────────────────────────────────
const kod = f => fs.readFileSync(path.join(PAPKA, f), 'utf8');
t('„Документите“ питат преди съставяне', /stoynostPitaiPrediDokument\(z\.p, z\.st\)/.test(kod('dokumenti.js')));
t('Акт 7 от дневника пита преди съставяне', /stoynostPitaiPrediDokument\(z\.p, z\.st\)/.test(kod('moment.js')));

t('без грешки', !greshki.length, greshki.slice(0, 3));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — вратата и шаблонът казват едно`);
process.exit(loshi.length ? 1 : 0);
