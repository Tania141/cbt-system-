// Плотът в три колони (кройката от 17–18.11.2026, стъпка 2 след облеклото).
//
// Пази решенията: лява тъмна колона — фирмата, с плочки Обекти · Заповедни
// книги · Консултанти и бледо долу Нормативна уредба · История · Резервно
// копие; дясна — обектът на посочения ред, само показва, всяка стойност казва
// откъде е; невписаното казва „не е вписано“, не се измисля. Плочката на
// отворения екран е отбелязана. В момента лявата е свита (стои в stil.css).
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const tekst = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    const izvori = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
    for (const src of izvori) {
        const telo = fs.readFileSync(path.resolve(PAPKA, src), 'utf8');
        html = html.replace(`<script src="${src}"></script>`, () => '<script>' + telo + '</script>');
    }
    return html;
}

// Измислени обекти — нищо от истинските.
const PARVI = {
    id: 'bryag', pi: '10135.2518.417', nik: 'Бряг',
    stroej: 'Многофамилна жилищна сграда с подземен гараж', kategoria: 'II',
    // 18.11.2026: възложителят е в РЕГИСТЪРА (`sobstvenost`), не в старото поле
    // `clients` на паспорта; строителят е `company` — както го пише паспортът.
    sobstvenost: { lica: [{ id: 'l1', ime: '„Бряг Девелопмънт“ ЕООД', vid: 'юридическо' }],
                   obekti: [{ id: 'o1', vid: 'земя', identifikator: '10135.2518.417' }],
                   sabitia: [{ id: 'e1', obekt: 'o1', vid: 'покупко-продажба', data: '01.01.2020',
                               dokument: 'НА № 1', pridobivashti: [{ lice: 'l1', dyal: '1/1' }] }], koren: 'o1' },
    permit: { number: '58', date: '2025-03-14' },
    builder: { company: '„Калнистрой“ ООД' },
    consultant: { name: '„Наблюдател Консулт“ ЕООД' },
    tekusht_moment: 'Акт 15', updatedAt: '2026-11-18T08:00:00Z',
    dve_chisla: { moment: 'Акт 15', nachalo: 100, podpis: 73 },
};
const VTORI = {
    id: 'sklad', pi: '10447.505.36', nik: 'Склад', stroej: 'Складова база с офис',
    tekusht_moment: 'Акт 7', updatedAt: '2026-11-09T08:00:00Z',
};

async function otvori(hash) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + (hash || ''),
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [PARVI, VTORI], history: [],
                consultants: [{ id: 1, name: '„Наблюдател Консулт“ ЕООД', employees: [] }],
                apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async () => ({ ok: true, status: 200, json: async () => ({ red: [], grupi: [] }) });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 200));
    return { w, d: w.document, greshki };
}

(async () => {
    const a = await otvori('#/plot');
    const d = a.d;
    t('плотът в три колони — без грешка', a.greshki.length === 0, a.greshki);
    const ramka = d.getElementById('ramka');
    t('трите колони: лява · среда · дясна', !!ramka && ramka.children.length === 3
      && ramka.children[0].id === 'lyava' && ramka.children[1].classList.contains('sreda')
      && ramka.children[2].id === 'dyasna');
    t('рамката знае, че е плотът', ramka.dataset.ekran === 'plot', ramka.dataset.ekran);

    // лявата — фирмата
    const lyava = d.getElementById('lyava');
    const plochki = [...lyava.querySelectorAll('.fp')].map(x => tekst(x.querySelector('.fp-t')));
    // „Подобни обекти“ (24.11.2026, стъпка 4а) — на фирмата, до книгите.
    t('горе: Обекти · Заповедни книги · Подобни обекти · Консултанти',
      plochki.join('|') === 'Обекти|Заповедни книги|Подобни обекти|Консултанти', plochki);
    const bledi = [...lyava.querySelectorAll('.bled')].map(tekst);
    // „Речник“ (25.11.2026) — един документ, всичките му имена; на фирмата.
    t('долу бледо: Речник · Нормативна уредба · История · Резервно копие',
      bledi.join('|') === 'Речник|Нормативна уредба|История|Резервно копие', bledi);
    t('плочката „Обекти“ казва колко са в работа', /^2 в работа/.test(tekst(d.getElementById('lyava-obekti'))),
      tekst(d.getElementById('lyava-obekti')));
    t('числото на свитата плочка е същото', tekst(d.getElementById('lyava-obekti-z')) === '2');
    t('„Консултанти“ казва колко фирми', tekst(d.getElementById('lyava-konsult')) === '1 фирма');
    t('на плота е отбелязана „Обекти“', lyava.querySelector('.aktivna') && lyava.querySelector('.aktivna').dataset.plochka === 'obekti');
    t('логото е горе вляво и води към плота', !!lyava.querySelector('a.firma[href="#/plot"] svg.logo'));
    t('шапката вече няма редица със стаите', !d.querySelector('.shapka .shapka-stai'));

    // дясната — обектът
    const dyasna = d.getElementById('dyasna');
    t('дясната показва първия ред, докато не е посочен друг',
      /Многофамилна жилищна сграда/.test(tekst(dyasna)) && /10135\.2518\.417/.test(tekst(dyasna)), tekst(dyasna));
    t('всяка стойност казва откъде е', dyasna.querySelectorAll('.dan-o').length === 5,
      dyasna.querySelectorAll('.dan-o').length);
    t('възложителите — от собствеността', /Бряг Девелопмънт.*собственост/.test(tekst(dyasna)), tekst(dyasna));
    t('РС с номер и дата', /№ 58 от 14\.03\.2025/.test(tekst(dyasna)), tekst(dyasna));
    t('дясната не се поправя — няма полета', !dyasna.querySelector('input, textarea, select'));
    t('посоченият ред е отбелязан', d.querySelector('#plot-spisak .red.posochen')
      && d.querySelector('#plot-spisak .red.posochen').dataset.red === 'bryag/0');

    a.w.plotPosochi('sklad', 0);
    t('посочваш друг ред → дясната го показва', /Складова база/.test(tekst(dyasna)), tekst(dyasna));
    t('невписаното казва „не е вписано“, не се измисля',
      dyasna.querySelectorAll('.dan-nyama').length === 5 && !/Калнистрой/.test(tekst(dyasna)), tekst(dyasna));
    t('„Отвори обекта“ води към обекта', !!dyasna.querySelector('a[href="#/obekt/sklad/0"]'));

    // другите екрани
    const b = await otvori('#/obekt/bryag/0');
    t('в обекта лявата остава', !!b.d.getElementById('lyava') && b.d.getElementById('ramka').dataset.ekran === 'obekt');
    const z = await otvori('#/zk');
    t('в Заповедни книги е отбелязана нейната плочка',
      z.d.querySelector('#lyava .aktivna') && z.d.querySelector('#lyava .aktivna').dataset.plochka === 'knigi');
    const m = await otvori('#/moment/bryag/0/' + encodeURIComponent('Акт 15'));
    t('в момента рамката казва „moment“ (там лявата е свита)', m.d.getElementById('ramka').dataset.ekran === 'moment');

    const css = fs.readFileSync(path.join(PAPKA, 'stil.css'), 'utf8');
    t('в момента лявата е свита и на голям монитор',
      /\.ramka\[data-ekran="moment"\][^{]*\{\s*grid-template-columns:\s*68px/.test(css));
    t('на лаптоп (<1440) лявата се свива', /@media \(max-width: 1439px\)[\s\S]*?grid-template-columns:\s*68px/.test(css));
    t('дясната е бяло + 30 % RAL 6004', /\.dyasna\s*\{[^}]*background:\s*var\(--obekt\)/.test(css));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — плотът стои в три колони`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
