// Котите от фасадата като избор в Протокол 2 (18.11.2026, Митко Ситекс:
// „Не чете коти от проект“). Системата предлага; коя е коя казва операторът.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak).slice(0, 300)));
const tekst = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const src of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]))
        html = html.replace(`<script src="${src}"></script>`, () => '<script>' + fs.readFileSync(path.resolve(PAPKA, src), 'utf8') + '</script>');
    return html;
}

const OBEKT = { id: 'ob1', pi: '10000.1.2', nik: 'Проба', stroej: 'Еднофамилна жилищна сграда', vid: 'sgrada',
                tekusht_moment: 'Протокол 2', consultant: { id: 1, name: 'Консулт' }, updatedAt: '2026-11-18T08:00:00Z' };
const OTGOVOR = { koti: { fajl: 'фасади.jpg', chetec: 'Claude', absolyutni: [],
    koti: [{ kota: '+7,04', absolyutna: '541,64', nadpis: '' }, { kota: '+5,73', absolyutna: '540,33', nadpis: '' },
           { kota: '±0,00', absolyutna: '534,60', nadpis: '' }, { kota: '-0,47', absolyutna: '534,13', nadpis: 'Ср. кота прил. терен' }],
    podskazki: { cokul: '±0,00', bilo: '+7,04', korniz: '+5,73' } } };

(async () => {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    let zaiavka = null;
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/#/dokumenti/ob1/0/' + encodeURIComponent('Протокол 2'),
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OBEKT], history: [],
                consultants: [{ id: 1, name: 'Консулт', employees: [] }] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url, o) => {
                const telo = /\/api\/koti\/chete/.test(String(url)) ? (zaiavka = JSON.parse(o.body), OTGOVOR) : { red: [], grupi: [] };
                return { ok: true, status: 200, json: async () => telo, text: async () => '{}', headers: { get: () => 'application/json' } };
            };
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));
    const d = w.document;
    const telo = () => d.getElementById('dokumenti-telo');
    t('Протокол 2: бутонът за четене на котите', /прочети котите от фасада или разрез/.test(tekst(telo())), tekst(telo()).slice(0, 300));

    // четене — подменен файл
    const vhod = d.querySelector('.koti-fasada input[type=file]');
    Object.defineProperty(vhod, 'files', { value: [new w.File(['x'], 'фасади.jpg', { type: 'image/jpeg' })] });
    await w.dokumentiChetiKoti(vhod);
    await new Promise(r => setTimeout(r, 100));
    t('файлът стига до сървъра', zaiavka && zaiavka.fajl && zaiavka.fajl.ime === 'фасади.jpg', zaiavka);
    const tabl = d.querySelector('.koti-izbor');
    t('котите излизат като избор', !!tabl && /\+7,04/.test(tekst(tabl)) && /540,33/.test(tekst(tabl)), tekst(tabl));
    t('подсказката е оцветена, не попълнена', d.querySelectorAll('.koti-podskazka').length === 3
      && !d.getElementById('p2-kota-bilo').value, d.getElementById('p2-kota-bilo').value);
    const p = w.eval('aktDanni.projects[0]');
    t('прочетеното се пази при строежа', (p.p2_koti_chetene || {}).fajl === 'фасади.jpg', p.p2_koti_chetene);

    // операторът посочва
    const buton = [...d.querySelectorAll('.koti-izbor button')].find(b => b.dataset.k === '+5,73' && /корниз/.test(b.textContent));
    w.dokumentiIzberiKota('korniz', buton.dataset.k);
    t('изборът попълва полето', d.getElementById('p2-kota-korniz').value === '+5,73', d.getElementById('p2-kota-korniz').value);
    t('и се записва', w.eval('aktDanni.projects[0]').p2_koti.korniz === '+5,73');
    t('избраната е отбелязана', !!d.querySelector('.koti-izbrana'));
    t('без грешка', greshki.length === 0, greshki);

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — котите от фасадата като избор`);
    process.exit(loshi.length ? 1 : 0);
})();
