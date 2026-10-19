// Два обекта — два регистъра на собственост.
//
// Операторът, 16.10.2026: „1. Никъде не записва НА, дори и когато кажа
// запиши в «Актове за придобиване». 2. Когато отида на друг обект в него е
// записана собствеността на предишния.“
//
// Пробата отваря ПВА наистина с ДВА обекта: единият с вписан акт, другият
// празен. Чете се КАКВО ПИШЕ на екрана, не какво има в паметта.
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { stranicaSVgradenKod } = require('./kod');

const HTML = process.argv[2] || path.join(__dirname, '..', 'index.html');

const KONSULTANT = { id: 1, name: 'СиБиТи Консулт ЕООД', eik: '123456789', employees: [] };
const bazov = (id, pi, nik) => ({
    id, pi, nik, name: 'Сграда ' + nik, consultant: { id: 1, name: 'СиБиТи Консулт ЕООД' },
    vid: 'сграда', prednaznachenie: 'жилищна', kategoria: 5,
});

const A = bazov('obekt-a', '29430.4713.49', 'А');
A.sobstvenost = {
    lica: [{ id: 'la', ime: 'Даниела Валентинова Занева' }],
    obekti: [{ id: 'oa', vid: 'земя', identifikator: '29430.4713.49' }],
    koren: 'oa',
    sabitia: [{ id: 'sa', obekt: 'oa', vid: 'покупко-продажба', data: '09.07.2019',
                dokument: 'нотариален акт № 186, том II, рег. № 3421, дело 311, нотариус Росица Рашева',
                ot: null, ot_opisanie: 'Иван Петров', pridobivashti: [{ lice: 'la', dyal: '1/1' }] }],
};
const B = bazov('obekt-b', '68134.4354.781', 'Б');

async function pusni() {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push('jsdom: ' + (e.message || e)));
    vc.on('error', (...a) => greshki.push('конзола: ' + a.join(' ')));

    const dom = new JSDOM(stranicaSVgradenKod(HTML), {
        runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
        virtualConsole: vc, beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [A, B], currentProject: A, consultants: [KONSULTANT], history: [],
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.localStorage.setItem('akt_user', JSON.stringify({ email: 'proba@proba.bg', role: 'admin' }));
        },
    });
    const w = dom.window;
    w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' },
                             json: async () => ({}), text: async () => '{}' });
    w.alert = m => greshki.push('alert: ' + m);
    w.confirm = () => true;
    w.scrollTo = () => {};

    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));
    if (typeof w.navigateTo !== 'function') { console.log('  ЛО  приложението не се вдигна'); return 1; }

    const dobri = [], loshi = [];
    const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + String(kak).slice(0, 160)));
    const tekst = () => (w.document.getElementById('sobstvenost-content') || {}).textContent || '';

    w.navigateTo('sobstvenost');
    await new Promise(r => setTimeout(r, 200));
    t('на обект А си личи неговият акт', /Занева/.test(tekst()) && /186/.test(tekst()), tekst().slice(0, 200));

    // ── 1. другият обект е ПРАЗЕН ─────────────────────────────────────────
    w.smeniObekt('obekt-b', 'sobstvenost');
    await new Promise(r => setTimeout(r, 200));
    t('на обект Б не се вижда собственост от А', !/Занева/.test(tekst()), tekst().slice(0, 300));
    t('на обект Б не се вижда актът на А', !/186/.test(tekst()), tekst().slice(0, 300));
    t('обект Б кани да започне от земята', /Веригата започва от земята/.test(tekst()), tekst().slice(0, 120));

    // ── 2. вписването на акт на ръка остава вписано ───────────────────────
    w.sbZapochni();
    await new Promise(r => setTimeout(r, 100));
    const otgovori = ['1', 'покупко-продажба', 'Павел Валериев Христов 1/1', 'Мария Иванова',
                      '15.03.2021', 'нотариален акт № 77, том I, рег. № 1200, нотариус Петя Колева'];
    let i = 0;
    w.prompt = () => (i < otgovori.length ? otgovori[i++] : null);
    w.sbDobaviSabitie();
    await new Promise(r => setTimeout(r, 200));
    t('всички въпроси са зададени', i === otgovori.length, 'отговорени ' + i + ' от ' + otgovori.length);
    t('актът се вижда в регистъра', /№ 77/.test(tekst()), tekst().slice(0, 400));
    t('придобиващият се вижда', /Христов/.test(tekst()), tekst().slice(0, 400));
    t('нотариусът се вижда', /Петя Колева/.test(tekst()), tekst().slice(0, 400));

    // ── 3. записано ли е НАИСТИНА ─────────────────────────────────────────
    const zapis = JSON.parse(w.localStorage.getItem('akt_v5') || '{}');
    const zb = (zapis.projects || []).find(x => x.id === 'obekt-b') || {};
    const za = (zapis.projects || []).find(x => x.id === 'obekt-a') || {};
    t('актът е в записа на Б', ((zb.sobstvenost || {}).sabitia || []).length === 1,
      JSON.stringify((zb.sobstvenost || {}).sabitia || []).slice(0, 200));
    t('А си остава с един акт', ((za.sobstvenost || {}).sabitia || []).length === 1,
      ((za.sobstvenost || {}).sabitia || []).length);
    t('А не е прихванал лицата на Б', !JSON.stringify(za.sobstvenost || {}).includes('Христов'));

    // ── 4. обратно на А ───────────────────────────────────────────────────
    w.smeniObekt('obekt-a', 'sobstvenost');
    await new Promise(r => setTimeout(r, 200));
    t('на А не се вижда актът на Б', !/№ 77/.test(tekst()) && !/Христов/.test(tekst()), tekst().slice(0, 300));

    // ── 5. обекти, дошли ОТ СЪРВЪРА ───────────────────────────────────────
    // Сървърът връща паспортите без `id` и зареждането слага `id = pi`. Два
    // паспорта в един и същ имот (преустройство на два обекта в една сграда)
    // тогава получават ЕДИН И СЪЩИ номер — и всяка справка намира първия.
    // Оттам е и „на другия обект е собствеността на предишния“.
    const ot_sarvara = [
        { pi: '29430.4713.49', nik: 'магазин' },
        { pi: '29430.4713.49', nik: 'аптека' },
        { pi: '', nik: 'без имот' },
        { pi: '', nik: 'още един без имот' },
    ];
    t('има кой да раздаде номерата', typeof w.nomeraNaObekti === 'function');
    if (typeof w.nomeraNaObekti === 'function') {
        const nomera = w.nomeraNaObekti(ot_sarvara).map(x => String(x.id));
        t('всеки паспорт получава СВОЙ номер',
          new Set(nomera).size === nomera.length, nomera.join(' = '));
        t('номерът не е празен', nomera.every(Boolean), nomera.join(' | '));
        const vtori = w.nomeraNaObekti(ot_sarvara).map(x => String(x.id));
        t('номерът не се сменя при следващо зареждане',
          vtori.join('|') === nomera.join('|'), vtori.join(' | '));
    }

    for (const d of dobri) console.log('  ok  ' + d);
    for (const l of loshi) console.log('  ЛО  ' + l);
    for (const g of greshki.slice(0, 5)) console.log('  ЛО  ' + g);
    const n = loshi.length + greshki.length;
    console.log(n ? `\n${n} проблема` : `\n${dobri.length} проверки — двата обекта са отделни`);
    return n ? 1 : 0;
}

pusni().then(k => process.exit(k)).catch(e => { console.error(e); process.exit(1); });
