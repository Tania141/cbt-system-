// Акт 7 — таблицата по бетоновия дневник в новото облекло (18.11.2026).
//
// Пази решенията от раздел 0 (т. 3а): редът казва състоянието си — подписан
// (твоето ✔ или сверен скан) · сканиран, провери · само в дневника;
// подписаните са сгънати в един ред; „Съставѝ избраните · един файл“ съставя
// само несъставените, избрани; сканираните се проверяват в досието (връзка);
// кръговете — „подписани N от M“ и „чакат проверка K“.
//
// И СВЕРКАТА С КУХНЯТА: дали ред от дневника има скан, се решава като в
// `dokTetradka` (js/04b-spisak.js) — дата или коти, един скан поглъща един
// ред. Повторено е в moment.js; ако двете се разминат, тук пада.
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
        html = html.replace(m[0], () => '<script>' + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

// Измислено — нищо от истинските обекти.
const red = (data, smr, podpisan) => ({ data, smr, ot: '', do: '', element: smr, podpisan: !!podpisan,
    klyuchove: ['k|' + data + smr] });
const SKAN = (id, data, sadarzhanie) => ({ id, fajl: id + '.pdf', vid: 'Акт обр. 7', vid_kod: 'AKT7',
    data: { stoynost: data }, sadarzhanie: { stoynost: sadarzhanie } });
const OBEKT = {
    id: 'bryag', pi: '10135.2518.417', stroej: 'Жилищна сграда', consultant: { id: 1 },
    akt7_dnevnik: { fajl: 'dnevnik.xlsx', chetec: 'код', aktove: [
        red('14.05.2025', 'Кофраж и армировка на фундаментна плоча'),            // скан, сверен → подписан скан
        red('20.05.2025', 'Кофраж и армировка на шайби, сутерен', true),         // твоето ✔
        red('02.06.2025', 'Кофраж и армировка на плоча от +2,57 до +2,87'),      // скан по коти, несверен
        red('10.06.2025', 'Кофраж и армировка на колони, ет. 1'),                // само в дневника
        red('17.06.2025', 'Кофраж и армировка на плоча над ет. 1'),              // само в дневника
        red('24.06.2025', 'Кофраж и армировка на стълбище', true),               // ✔ и скан, несверен
    ] },
    sloy2: { od: { dokumenti: [
        SKAN('skanA', '14.05.2025', 'фундаментна плоча'),
        SKAN('skanB', '01.06.2025', 'плоча от +2,57 до +2,87'),
        SKAN('skanC', '24.06.2025', 'стълбище'),
    ], potvardeni: {} } },
};

async function otvori() {
    const greshki = [], zaiavki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/#/moment/bryag/0/' + encodeURIComponent('Акт 7'),
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OBEKT], history: [],
                consultants: [{ id: 1, name: '„Наблюдател Консулт“ ЕООД', employees: [] }], apiUrl: 'http://localhost/api' }));
            w.localStorage.setItem('akt_token', 'proba');
            w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {};
            w.fetch = async (url, opt) => {
                zaiavki.push([String(url), JSON.parse((opt && opt.body) || '{}')]);
                if (/generate\/akt7/.test(url)) return { ok: true, status: 200, blob: async () => new w.Blob(['docx']) };
                return { ok: true, status: 200, json: async () => ({ red: ['Акт 7'], grupi: [{ moment: 'Акт 7', dokumenti: [] }] }) };
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
    const { w, d } = a;
    // Сверяваме скана A: всички негови факти — потвърдени (както в досието).
    const st = w.aktObekt('bryag');
    const sA = st.sloy2.od.dokumenti[0];
    for (const k of w._s2SverimiKl(sA)) st.sloy2.od.potvardeni[`${sA.id}::${k}`] = true;
    t('скан A е сверен по правилото на досието', w._s2Sveren(sA, st.sloy2.od.potvardeni));
    w.momentRisuvai();

    t('Акт 7 се рисува без грешка', a.greshki.length === 0, a.greshki);
    const z = w.momentZhiv();
    const vid = w.momentDnSastoyaniya(z).map(r => r.vid);
    t('състоянията по реда', vid.join('|') === 'skan|podpisan|proveri|dnevnik|dnevnik|podpisan', vid);

    const redove = [...d.querySelectorAll('.dn-tablica tr.dn-red')];
    const chip = i => tekst(redove[i].querySelector('.chip'));
    t('подписан скан — зелено', chip(0) === 'подписан скан' && redove[0].querySelector('.chip-gotovo'));
    t('твоето ✔ — зелено, казва чие е', chip(1) === 'подписан · твоето ✔');
    t('сканиран, провери — златисто', chip(2) === 'сканиран, провери' && redove[2].querySelector('.chip-chaka'));
    t('само в дневника — червено', chip(3) === 'само в дневника' && redove[3].querySelector('.chip-lipsva'));

    t('подписаните са сгънати в един ред', /Подписани · 3/.test(tekst(d.querySelector('.dn-grupa')))
      && redove.filter(r => r.hidden).length === 3, tekst(d.querySelector('.dn-grupa')));
    w.momentDnPodpisaniSgavane();
    t('разгъват се с клик', [...d.querySelectorAll('.dn-tablica tr.dn-red')].every(r => !r.hidden));
    w.momentDnPodpisaniSgavane();

    t('избор — само на „само в дневника“, всички избрани', d.querySelectorAll('.dn-izbor').length === 2
      && [...d.querySelectorAll('.dn-izbor')].every(x => x.checked));
    t('бутонът казва колко', /Съставѝ избраните · един файл \(2\)/.test(tekst(d.querySelector('.dn-sastavi'))));
    t('провери в досието — връзка, не бутон', d.querySelector('.dn-sastavi a.kam[href="#/dosie/bryag/0"]')
      && /провери 1 в досието/.test(tekst(d.querySelector('.dn-sastavi'))));
    t('общият „Съставѝ документа“ не се дублира', !/Съставѝ документа/.test(tekst(d.getElementById('moment-telo'))));

    w.momentDnIzberi(4, false);
    t('махнатият от избора се брои', /\(1\)/.test(tekst(d.querySelector('.dn-sastavi'))));
    await w.momentDnevnikSastavi();
    await new Promise(r => setTimeout(r, 50));
    const gen = a.zaiavki.find(x => /generate\/akt7/.test(x[0]));
    t('съставя само избраните', gen && gen[1].akt7_seriya.length === 1 && gen[1].akt7_seriya[0].data === '10.06.2025',
      gen && gen[1].akt7_seriya);

    const dy = d.getElementById('dyasna');
    t('кръговете: подписани 3 от 6', /3 подписани 3 от 6/.test(tekst(dy)), tekst(dy));
    t('кръговете: чакат проверка 1 от 6', /1 чакат проверка 1 от 6/.test(tekst(dy)), tekst(dy));

    // Сверката с кухнята: за подписаните редове „има скан“ ⇔ кухнята НЕ ги дописва като съставени.
    const dopisani = new Set(w.dokTetradka(z.p, z.st).filter(r => r.otkade === w.eval("_DOK_SASTAVEN") && r.kod === 'AKT7').map(r => r.data));
    const sast = w.momentDnSastoyaniya(z).filter(r => r.a.podpisan);
    t('съвпадението на скана е същото като в кухнята',
      sast.every(r => r.skan === !dopisani.has(r.a.data)), sast.map(r => [r.a.data, r.skan, dopisani.has(r.a.data)]));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — таблицата на Акт 7 стои`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
