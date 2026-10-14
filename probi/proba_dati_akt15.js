// Датите в Акт 15: системата ги знае, предлага ги и ПИТА.
//
// Операторът, 14.10.2026: „Системата може да знае кога е съставен даден
// документ, но понякога датите се променят, затова е необходимо да пита.“
const { JSDOM, VirtualConsole } = require('jsdom');
const { stranicaSVgradenKod, HTML } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const OBEKT = {
    id: '1', pi: '68134.4354.781', name: 'Проба', nik: 'Проба',
    consultant: { id: 1 }, vid: 'сграда', kategoria: 5,
    zk: { number: '1190', date: '05.02.2024' },
    docDates: {
        protokol2: '12.03.2024',
        obrazec3: '15.03.2024',
        zk_zaverka: '14.03.2024',
        akt7: { br: '5', ot: '20.03.2024', do: '18.09.2024' },
        akt12: { 'Архитектура': { br: '3', ot: '01.04.2024', do: '30.06.2024' },
                 'ВиК': { br: '2', ot: '05.04.2024', do: '20.06.2024' } },
        // akt14 нарочно липсва — да се види как се казва
    },
    sobstvenost: {
        lica: [{ id: 'l1', ime: 'Иван Георгиев Петров' }],
        obekti: [{ id: 'o1', vid: 'земя', identifikator: '68134.4354.781' }],
        sabitia: [{ id: 's1', obekt: 'o1', data: '01.01.2020', vid: 'първоначално',
                    ot: null, na: 'l1', dyal: '1/1', dokument: 'НА № 1' }],
    },
};
const KONSULTANT = { id: 1, name: 'СиБиТи Консулт ЕООД', eik: '1', type: 'ЮЛ', employees: [] };

(async () => {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));

    const dom = new JSDOM(stranicaSVgradenKod(HTML), {
        runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
        virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [OBEKT], currentProject: OBEKT, consultants: [KONSULTANT],
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

    if (typeof w.showAkt15Form !== 'function') { console.log('  ЛО  няма showAkt15Form'); process.exit(1); }

    w.showAkt15Form();
    await new Promise(r => setTimeout(r, 100));
    const v = id => (w.document.getElementById(id) || {}).value;

    t('дата на Протокол 2 идва от досието', v('a15-prot2-date') === '12.03.2024', v('a15-prot2-date'));
    t('Образец 3 идва от досието', v('a15-obr3-date') === '15.03.2024', v('a15-obr3-date'));
    t('номерът на ЗК идва от регистъра', v('a15-zk-number') === '1190', v('a15-zk-number'));
    t('заверката на ЗК идва от досието', v('a15-zk-date') === '14.03.2024', v('a15-zk-date'));
    t('актовете 7 — брой', v('a15-akt7-br') === '5', v('a15-akt7-br'));
    t('актовете 7 — от / до', v('a15-akt7-ot') === '20.03.2024' && v('a15-akt7-do') === '18.09.2024',
       [v('a15-akt7-ot'), v('a15-akt7-do')]);
    t('акт 12 Архитектура по части', v('a15-akt12-arh-br') === '3' && v('a15-akt12-arh-ot') === '01.04.2024',
       [v('a15-akt12-arh-br'), v('a15-akt12-arh-ot')]);
    t('акт 12 ВиК по части', v('a15-akt12-vik-br') === '2', v('a15-akt12-vik-br'));
    t('акт 12 Електро го няма в досието → празно', !v('a15-akt12-el-br'), v('a15-akt12-el-br'));
    t('упълномощникът идва от регистъра на собствеността',
       v('a15-upulnomoshnik') === 'Иван Петров', v('a15-upulnomoshnik'));
    t('липсващият Акт 14 остава празен', !v('a15-akt14-date'), v('a15-akt14-date'));

    const bel = (w.document.getElementById('a15-dati-belejka') || {}).textContent || '';
    t('казва откъде е попълнено', /Попълнено от досието/.test(bel), bel.trim().slice(0, 90));
    t('кара да се провери', /Провери датите/.test(bel));
    t('изброява липсващото с [___]', /\[___\]/.test(bel) && /Акт 14/.test(bel), bel.trim().slice(0, 200));

    // Написаното на ръка не се подменя.
    w.document.getElementById('a15-prot2-date').value = '01.01.2025';
    w.showAkt15Form();
    await new Promise(r => setTimeout(r, 50));
    t('написаното на ръка остава', v('a15-prot2-date') === '01.01.2025', v('a15-prot2-date'));

    t('няма грешка при отварянето', greshki.length === 0, greshki.slice(0, 2));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — датите идват от досието`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.log('  ЛО  ' + e.stack); process.exit(1); });
