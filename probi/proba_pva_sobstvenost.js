// ЕКРАН 5 — СОБСТВЕНОСТТА.
//
// Заданието: „както е сега… плюс едно изречение горе какво липсва“. Затова
// екранът НЕ смята нищо — сметките с идеалните части идват от
// `js/07-sobstvenost.js` през `most.js`.
//
// Най-важната проверка тук е последната: че мостът покрива ВСИЧКО, което
// кухнята вика отвън. Порасне ли утре модулът с нова зависимост, пробата пада,
// вместо екранът да гръмне в ръцете на оператора.
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

// ── обект с истинска верига ──────────────────────────────────────────────────
// Земята е придобита наполовина от двама; строи се в нея.

const OBEKT = {
    id: 'hus', consultant: { id: 1, name: 'Консулт ЕООД' }, pi: '68134.1006.2440', nik: 'ХЪС', stroej: 'Жилищна сграда',
    sobstvenost: {
        koren: 'o1',
        lica: [{ id: 'l1', ime: 'Иван Станчев Станчев', vid: 'физическо' },
               { id: 'l2', ime: 'Мария Иванова Петрова', vid: 'физическо',
                 predstavitel: { ime: 'Димитри Петракиев', nomer: '4676', data: '19.11.2021' } }],
        obekti: [{ id: 'o1', vid: 'земя', identifikator: '68134.1006.2440' }],
        sabitia: [{
            id: 'e1', obekt: 'o1', vid: 'покупко-продажба', data: '12.11.2021',
            dokument: 'Нотариален акт № 143, том IV', ot_opisanie: 'Продавачите',
            pridobivashti: [{ lice: 'l1', dyal: '1/2' }, { lice: 'l2', dyal: '1/2' }],
        }],
    },
};

async function otvori(hash, obekt) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + hash,
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [JSON.parse(JSON.stringify(obekt || OBEKT))],
                consultants: [{ id: 1, name: 'Консулт ЕООД', employees: [] }], apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async () => ({ ok: true, status: 200, json: async () => ({ grupi: [] }) });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 200));
    return { w, d: w.document, greshki };
}

(async () => {

const a = await otvori('#/sobstvenost/hus/0');
t('Екран 5 се рисува без грешка в конзолата', a.greshki.length === 0, a.greshki);
t('другите екрани са скрити',
  a.d.getElementById('ekran-plot').hidden && a.d.getElementById('ekran-obekt').hidden);
t('от собствеността се връщаш в ОБЕКТА',
  a.d.getElementById('shapka-nazad').getAttribute('href') === '#/obekt/hus/0');

// ── изречението горе — допълнението, което заданието иска ───────────────────
const izr = a.d.querySelector('.izrechenie');
t('горе стои едно изречение', !!izr);
t('веригата връзва и го казва',
  izr.classList.contains('izrechenie-dobre') && /връзва/.test(tekst(izr)), tekst(izr));

// ── възложителите — извеждат се, не се въвеждат ─────────────────────────────
const telo = tekst(a.d.getElementById('sobstvenost-telo'));
t('двамата възложители излизат с ДВЕТЕ имена',
  /Иван Станчев представител/.test(telo), telo.slice(0, 300));
t('и Мария', /Мария Петрова/.test(telo), telo.slice(0, 300));
t('трите имена стоят в подсказката',
  !!a.d.querySelector('.vaz-ime [title="Иван Станчев Станчев"]'));
t('казва какво притежават', /собственик на 1\/2 от земята/.test(telo), telo.slice(0, 400));
t('казва, че не се въвеждат, а се извеждат', /не се въвеждат/i.test(telo), telo.slice(0, 260));
t('пълномощникът се вижда при подписващия',
  /подписва Димитри Петракиев/.test(telo) && /4676/.test(telo), telo);

// ── регистърът — преместен цял ──────────────────────────────────────────────
t('регистърът е тук: лица, обекти, актове',
  /Лица \(2\)/.test(telo) && /Обекти \(1\)/.test(telo) && /Актове за придобиване/.test(telo), telo);
t('със самия акт', /Нотариален акт № 143, том IV/.test(telo));
t('и с прехвърлителя', /Продавачите/.test(telo));
t('четенето на документ е на екрана', !!a.d.getElementById('sb-fajl'));
t('бутоните за добавяне са тук',
  !!a.d.querySelector('[onclick="sbDobaviLice()"]') && !!a.d.querySelector('[onclick="sbDobaviSabitie()"]'));
t('няма вече връзка към старото ПВА', !/в старото ПВА/.test(telo), telo);
t('Акт 15 подписват 2', /Акт 15 подписват 2/.test(telo), telo);

// ── без дял: пак възложител (операторът, 04.11.2026) ────────────────────────
const BEZ = JSON.parse(JSON.stringify(OBEKT));
BEZ.sobstvenost.lica.push({ id: 'l3', ime: 'Мария Димитрова Йорданова', vid: 'физическо' });
BEZ.sobstvenost.obekti.push({ id: 'o2', vid: 'самостоятелен обект', opisanie: 'АП3' });
BEZ.sobstvenost.sabitia.push({ id: 'e2', obekt: 'o2', vid: 'покупко-продажба', data: '01.02.2023',
    dokument: 'НА № 9', pridobivashti: [{ lice: 'l3', dyal: '' }] });
const z = await otvori('#/sobstvenost/hus/0', BEZ);
const zt = tekst(z.d.getElementById('sobstvenost-telo'));
t('без дял лицето НЕ изпада', /Мария Йорданова/.test(zt), zt.slice(0, 500));
t('и се казва, че дялът не е вписан', /АП3 \(дялът не е вписан\)/.test(zt), zt.slice(0, 500));
t('Акт 15 подписват вече 3', /Акт 15 подписват 3/.test(zt), zt);
// прехвърлил после — вече не е
BEZ.sobstvenost.lica.push({ id: 'l4', ime: 'Петър Иванов Колев', vid: 'физическо' });
BEZ.sobstvenost.sabitia.push({ id: 'e3', obekt: 'o2', vid: 'покупко-продажба', data: '01.02.2024',
    ot: 'l3', pridobivashti: [{ lice: 'l4', dyal: '1/1' }] });
const z2 = await otvori('#/sobstvenost/hus/0', BEZ);
const zt2 = tekst(z2.d.getElementById('sobstvenost-telo'));
t('прехвърлилият после вече не е възложител',
  !/Мария Йорданова/.test(zt2.split('Регистърът')[0]) && /Петър Колев/.test(zt2), zt2.slice(0, 500));

// ── паспортът: само бутон ───────────────────────────────────────────────────
const ps = await otvori('#/pasport/hus/0');
t('паспортът се рисува без грешка', ps.greshki.length === 0, ps.greshki);
const rachno = ps.d.getElementById('karta-vazlozhiteli-rachno');
t('ръчните полета за възложител са скрити', !rachno || rachno.style.display === 'none');
t('упълномощеният остава в DOM-а — записът не го трие', !!ps.d.getElementById('fp-upalnomoshten'));
// Обектът има регистър — значи формата рисува и картата със списъка от него.
const regKarta = ps.d.querySelector('[onclick*="\'sobstvenost\'"]');
t('и списъкът от регистъра НЕ се показва в паспорта',
  !!regKarta && regKarta.closest('.card').style.display === 'none', regKarta && regKarta.outerHTML);
const vidimi = [...ps.d.querySelectorAll('#pasport-telo .card')]
    .filter(k => k.style.display !== 'none' && /Станчев/.test(k.textContent));
t('никъде в паспорта не стои име на възложител', vidimi.length === 0, vidimi.map(k => k.id));
const bt = ps.d.querySelector('#pas-vazlozhiteli a');
t('на тяхно място — бутон към Собствеността',
  !!bt && bt.getAttribute('href') === '#/sobstvenost/hus/0', bt && bt.outerHTML);

// ── какво не връзва ─────────────────────────────────────────────────────────
t('при здрава верига няма раздел „какво не връзва“',
  !/Какво не връзва/.test(telo), telo.slice(0, 200));

// счупена верига: единият дял изчезва
const SCHUPEN = JSON.parse(JSON.stringify(OBEKT));
SCHUPEN.sobstvenost.sabitia[0].pridobivashti = [{ lice: 'l1', dyal: '1/3' }];
const b = await otvori('#/sobstvenost/hus/0', SCHUPEN);
const izr2 = b.d.querySelector('.izrechenie');
t('непълната верига си личи горе',
  izr2.classList.contains('izrechenie-lipsva'), tekst(izr2));
t('и казва колко липсва', /липсва/.test(tekst(izr2)), tekst(izr2));
t('находката излиза отделно',
  /Какво не връзва/.test(tekst(b.d.getElementById('sobstvenost-telo'))));

// празен регистър
const PRAZEN = { id: 'hus', pi: '1', stroej: 'Проба' };
const c = await otvori('#/sobstvenost/hus/0', PRAZEN);
t('празен регистър не гърми', c.greshki.length === 0, c.greshki);
t('и го казва с думи',
  /още не е започната|регистърът е празен/.test(tekst(c.d.getElementById('sobstvenost-telo'))),
  tekst(c.d.getElementById('sobstvenost-telo')).slice(0, 160));

// ── мостът ──────────────────────────────────────────────────────────────────
// Кухнята се ВИКА, не се преписва. Значи мостът трябва да покрива всяко име,
// което тя очаква отвън — иначе екранът гърми при първото непокрито.

const kuhnya = fs.readFileSync(path.join(KOREN, 'js', '07-sobstvenost.js'), 'utf8');
const most = fs.readFileSync(path.join(PAPKA, 'most.js'), 'utf8');
const osnova = fs.readFileSync(path.join(KOREN, 'js', '01-osnova.js'), 'utf8');
const yadro = fs.readFileSync(path.join(PAPKA, 'yadro.js'), 'utf8');

// Какво определя самата кухня — то не ѝ трябва отвън.
const svoi = new Set([...kuhnya.matchAll(/^(?:async )?function ([\w$]+)/gm)].map(m => m[1])
    .concat([...kuhnya.matchAll(/^const ([\w$]+)\s*=/gm)].map(m => m[1])));
// Какво дават другите включени файлове.
const dadeni = new Set();
for (const izvor of [most, osnova, yadro])
    for (const m of izvor.matchAll(/^(?:async )?function ([\w$]+)|^const ([\w$]+)\s*=|^let ([\w$]+)/gm))
        dadeni.add(m[1] || m[2] || m[3]);

const VGRADENI = new Set(['String', 'Number', 'Object', 'Array', 'Math', 'JSON', 'Date', 'Set',
    'Map', 'Boolean', 'parseInt', 'parseFloat', 'isNaN', 'console', 'document', 'window',
    'localStorage', 'prompt', 'confirm', 'alert', 'setTimeout', 'encodeURIComponent',
    'decodeURIComponent', 'Promise', 'Error', 'fetch', 'FileReader', 'RegExp', 'navigator']);

// Имената ВЪТРЕ в текстове не се броят: кухнята носи цял HTML в шаблонни
// низове, с onclick към стари екрани. Те не се изпълняват тук — не ги викаме.
const bezTekstove = kuhnya
    .replace(/`[^`]*`/g, '``').replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
// Само ГОЛИ извиквания: `foo(`, но не `x.foo(`.
const vikani = new Set([...bezTekstove.matchAll(/(^|[^.\w$])([_a-zA-Z][\w$]*)\s*\(/g)]
    .map(m => m[2]));

const nepokriti = [...vikani].filter(n => !svoi.has(n) && !dadeni.has(n) && !VGRADENI.has(n)
    && !/^(if|for|while|switch|catch|return|typeof|function|of|in|new|await|delete)$/.test(n));

t('мостът покрива всичко, което кухнята вика отвън',
  nepokriti.length === 0, nepokriti);

// ЕДИН ОБЕКТ, НЕ ДВА. Мостът взима показалеца към данните ПРЕДИ зареждането
// им. Направи ли `aktZaredi` нов обект вместо да напълни стария, кухнята
// остава да сочи празния и мълчаливо не вижда нищо — точно това счупи
// кандидатите на Екран 6 на 27.10.2026.
t('кухнята и новото ПВА сочат ЕДИН И СЪЩ обект след зареждане',
  a.w.eval('appData === aktDanni'));
t('и кухнята вижда данните',
  a.w.eval('(appData.projects || []).length') === 1,
  a.w.eval('(appData.projects || []).length'));
t('`aktZaredi` пълни обекта, не го подменя',
  /Object\.assign\(aktDanni/.test(fs.readFileSync(path.join(PAPKA, 'yadro.js'), 'utf8')));

t('мостът не смята нищо сам',
  !/_dr[A-Z]|function _sb/.test(most), 'мостът трябва само да посочва, не да смята');

// ── границата ───────────────────────────────────────────────────────────────
t('старият index.html пак е непокътнат',
  !/akt\//.test(fs.readFileSync(path.join(KOREN, 'index.html'), 'utf8')));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — собствеността стои`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
