// Моментът в три колони (кройката от 17–18.11.2026, стъпка 4).
//
// Пази решенията: лявата е свита; горе изворите са САМО връзки (без
// състояние — то е в „Липсва ми“); лента с моментите няма; средата е по ред
// Липсва ми → Имам → Остатъкът → Съставѝ; вдясно обектът, документът и
// двата кръга, зад които е „Какво знаем“; трите вида моменти — съставя се,
// повтаря се, получава се (без „Съставѝ“). Документът казва само онова,
// което историята знае.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const tekst = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const src of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])) {
        const telo = fs.readFileSync(path.resolve(PAPKA, src), 'utf8');
        html = html.replace(`<script src="${src}"></script>`, () => '<script>' + telo + '</script>');
    }
    return html;
}

// Измислен обект — нищо от истинските.
const OBEKT = {
    id: 'bryag', pi: '10135.2518.417', stroej: 'Многофамилна жилищна сграда',
    kategoria: 'II', clients: [{ name: '„Бряг Девелопмънт“ ЕООД' }],
    permit: { number: '58', date: '2025-03-14' }, builder: { name: '„Калнистрой“ ООД' },
    consultant: { name: '„Наблюдател Консулт“ ЕООД' }, tekusht_moment: 'Акт 15',
};
const NADZOR = { red: ['Акт 7', 'Акт 14', 'Акт 15', 'Акт 16'], grupi: [
    { moment: 'Акт 14', dokumenti: [] },
    { moment: 'Акт 7', dokumenti: [{ dokument: 'Бетонов дневник', sastoyanie: 'налично', etap: 'начало' }] },
    { moment: 'Акт 15', dokumenti: [
        { dokument: 'Разрешение за строеж', sastoyanie: 'налично', etap: 'начало' },
        { dokument: 'Скица от СГКК', sastoyanie: 'очаква се', etap: 'подпис' },
        { dokument: 'Акт обр. 14', sastoyanie: 'очаква се', etap: 'подпис' },
        { dokument: 'Нотариално заверено пълномощно на представителя на възложителите', sastoyanie: 'очаква се', etap: 'подпис' },
        { dokument: 'Заповедна книга на строежа', sastoyanie: 'очаква се', etap: 'подпис' },
        { dokument: 'Технически паспорт на строежа', sastoyanie: 'очаква се', etap: 'подпис' },
    ] },
    { moment: 'Акт 16', dokumenti: [{ dokument: 'Акт обр. 15', sastoyanie: 'очаква се', etap: 'начало' }] },
] };

async function otvori(moment, history) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/#/moment/bryag/0/' + encodeURIComponent(moment),
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [OBEKT], history: history || [], consultants: [], apiUrl: 'http://localhost/api' }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async () => ({ ok: true, status: 200, json: async () => NADZOR });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 250));
    return { w, d: w.document, greshki };
}

(async () => {
    const a = await otvori('Акт 15', [{ type: 'generate', pi: '10135.2518.417',
        detail: 'Генерирани .docx: Акт обр. 15', date: '2026-11-12T10:00:00Z' }]);
    const d = a.d;
    t('моментът в три колони — без грешка', a.greshki.length === 0, a.greshki);
    t('рамката казва „moment“', d.getElementById('ramka').dataset.ekran === 'moment');

    const izv = [...d.querySelectorAll('#moment-gore .izvori-vrazki .izvor')];
    t('горе — четирите извора като връзки', izv.map(x => tekst(x)).join('|') === 'Паспортът|Проектът|Собственост|Досието',
      izv.map(x => tekst(x)));
    t('без състояние — то е в „Липсва ми“', !d.querySelector('#moment-gore .izvor-s'));
    t('видът на момента: съставя се', tekst(d.querySelector('#moment-gore .moment-vid')) === 'съставя се');
    t('лента с моментите няма', !d.querySelector('#ekran-moment .plochka, #ekran-moment .lenta'));

    const telo = tekst(d.getElementById('moment-telo'));
    const i = s => telo.indexOf(s);
    t('редът: Липсва ми → Имам → Остатъкът → Съставѝ → папката',
      i('Липсва ми') >= 0 && i('Липсва ми') < i('Имам') && i('Имам') < i('само ти знаеш')
      && i('само ти знаеш') < i('Съставѝ документа') && i('Съставѝ документа') < i('избери папка'),
      [i('Липсва ми'), i('Имам'), i('само ти знаеш'), i('Съставѝ документа'), i('избери папка')]);
    t('везните не са в средата', !d.querySelector('#moment-telo .vezna'));

    const dyasna = d.getElementById('dyasna');
    t('вдясно — обектът', /10135\.2518\.417/.test(tekst(dyasna)) && /Бряг Девелопмънт/.test(tekst(dyasna)));
    t('вдясно нищо не се поправя', !dyasna.querySelector('input, textarea, select'));
    const krugove = [...dyasna.querySelectorAll('button.vezna.krug')];
    t('долу вдясно — двата кръга', krugove.length === 2 && !!dyasna.querySelector('.d-dolu .vezni'), krugove.length);
    t('кръговете казват процента и „имам N от M“', /100 %/.test(tekst(krugove[0])) && /17 %/.test(tekst(krugove[1])) && /имам 1 от 6/.test(tekst(krugove[1])),
      krugove.map(tekst));
    a.w.momentKoeLipsva('podpis');
    t('зад кръга е „Какво знаем“ — кои са редовете',
      /Кои са/.test(tekst(d.getElementById('moment-kutiya-telo'))) && /Скица от СГКК/.test(tekst(d.getElementById('moment-kutiya-telo'))));
    // „Липсва ми“ праща, не чете
    const red = ime => [...d.querySelectorAll('#moment-telo .lipsva-red')].find(x => x.dataset.dokument === ime);
    const kam = ime => { const r = red(ime); const a = r && r.querySelector('a.kam'); return a ? [tekst(a), a.getAttribute('href')] : null; };
    t('Акт обр. 14 праща към своя момент', JSON.stringify(kam('Акт обр. 14'))
      === JSON.stringify(['към Акт 14 →', '#/moment/bryag/0/' + encodeURIComponent('Акт 14')]), kam('Акт обр. 14'));
    t('пълномощното праща към Собственост', JSON.stringify(kam('Нотариално заверено пълномощно на представителя на възложителите'))
      === JSON.stringify(['към Собственост →', '#/sobstvenost/bryag/0']), kam('Нотариално заверено пълномощно на представителя на възложителите'));
    t('заповедната книга праща към регистъра на ЗК', JSON.stringify(kam('Заповедна книга на строежа'))
      === JSON.stringify(['към Заповедната книга →', '#/zk/bryag/0']), kam('Заповедна книга на строежа'));
    t('редът, който праща, НЕ иска пак — няма качи · впиши', !red('Акт обр. 14').querySelector('button'));
    t('момент, който чеклистът няма за строежа, не се измисля — Техническият паспорт остава с трите жеста',
      !kam('Технически паспорт на строежа') && red('Технически паспорт на строежа').querySelectorAll('.lipsva-zhestove .bt').length === 3);
    t('документ без момент и извор — качи · впиши · не се отнася',
      !kam('Скица от СГКК') && red('Скица от СГКК').querySelectorAll('.lipsva-zhestove .bt').length === 3);
    t('документът — от историята, с дата', /генериран на 12\.11\.2026/.test(tekst(dyasna)), tekst(dyasna));

    const b = await otvori('Акт 15');
    t('без запис в историята казва точно това', /в историята няма генериран/.test(tekst(b.d.getElementById('dyasna'))),
      tekst(b.d.getElementById('dyasna')));

    const s7 = await otvori('Акт 7');
    t('Акт 7 — повтаря се', tekst(s7.d.querySelector('#moment-gore .moment-vid')) === 'повтаря се');

    const s16 = await otvori('Акт 16');
    t('Акт 16 — получава се', tekst(s16.d.querySelector('#moment-gore .moment-vid')) === 'получава се');
    t('получаващият се момент няма „Съставѝ“', !s16.d.querySelector('#moment-telo .sastavi button'));
    t('и казва защо — качи или впиши', /не се съставя/.test(tekst(s16.d.querySelector('.sastavi-poluchava'))));
    t('документът му — от органа', /получава се от органа/.test(tekst(s16.d.getElementById('dyasna'))));

    const css = fs.readFileSync(path.join(PAPKA, 'stil.css'), 'utf8');
    t('в момента: свита лява, среда, дясна', /\.ramka\[data-ekran="moment"\]\s*\{\s*grid-template-columns:\s*68px minmax\(0, 1fr\) 272px/.test(css));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — моментът стои в три колони`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
