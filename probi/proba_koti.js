// Котите: потвърдени веднъж в „Проверки“, влизат в Протокол 2 сами.
//
// Дотук се въвеждаха на ръка на три места. Пробата отваря истинския модал и
// гледа какво е в полетата. (14.10.2026)
const { JSDOM, VirtualConsole } = require('jsdom');
const { stranicaSVgradenKod, HTML } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const fakt = (stoynost, sastoyanie = 'potvardeno') => ({ stoynost, sastoyanie, koga: '2026-10-14' });

const OBEKT = {
    id: '1', pi: '68134.4354.781', name: 'Проба', nik: 'Проба',
    consultant: { id: 1 }, vid: 'сграда', kategoria: 5,
    fakti: {
        kota_izkop:  fakt('-2.50'),
        kota_cokul:  fakt('690.00'),
        korniz_post: fakt('9.80'),
        reper_nomer: fakt('РП-23'),
        opisanie_ploshtadka: fakt('Теренът е равен, ограден с плътна ограда; достъп от ул. Бяло море.'),
        // kota_bilo и reper_kota нарочно липсват — да се види как се казва
        kota_bilo:   fakt('12.40', 'predlozheno'),   // предложено ≠ потвърдено
    },
};
const KONSULTANT = { id: 1, name: 'СиБиТи Консулт ЕООД', eik: '1', type: 'ЮЛ', employees: [] };

(async () => {
    const vc = new VirtualConsole();
    const greshki = [];
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

    if (typeof w.showProtokol2Form !== 'function') {
        console.log('  ЛО  приложението не се вдигна');
        process.exit(1);
    }

    w.showProtokol2Form();
    await new Promise(r => setTimeout(r, 100));
    const v = id => (w.document.getElementById(id) || {}).value;

    t('кота изкоп идва от потвърденото', v('p2-kota-izkop') === '-2.50', v('p2-kota-izkop'));
    t('кота цокъл идва от потвърденото', v('p2-kota-cokul') === '690.00', v('p2-kota-cokul'));
    t('кота корниз идва от показателя', v('p2-kota-korniz') === '9.80', v('p2-kota-korniz'));
    t('реперът идва от част Геодезия', v('p2-reper-nomer') === 'РП-23', v('p2-reper-nomer'));
    t('ПРЕДЛОЖЕНО, но непотвърдено, НЕ влиза', !v('p2-kota-bilo'), v('p2-kota-bilo'));
    t('липсващото остава празно', !v('p2-reper-kota'), v('p2-reper-kota'));
    t('описанието на площадката идва от част Архитектура',
      /Теренът е равен/.test(v('p2-opisanie-ploshtadka') || ''), v('p2-opisanie-ploshtadka'));
    // `const` на горно ниво живее в глобалния лексикален обхват, не на window.
    const std = w.eval('P2_STANDARTNI');
    t('стандартният текст за дървесността го има',
      /няма дървесна растителност/.test(std.darvesenost), std.darvesenost);
    t('стандартният текст за мерките по ПБЗ го има',
      /одобрени проекти с действащото законодателство/.test(std.merki_pbz), std.merki_pbz);

    const bel = (w.document.getElementById('p2-koti-belejka') || {}).textContent || '';
    t('казва колко е взето от Проверки', /5 стойности са взети/.test(bel), bel.trim().slice(0, 80));
    t('изброява непотвърденото с [___]', /\[___\]/.test(bel) && /Кота било/.test(bel), bel.trim().slice(0, 160));

    // Написаното на ръка не се подменя при повторно отваряне.
    w.document.getElementById('p2-kota-izkop').value = '-3.10';
    w.showProtokol2Form();
    await new Promise(r => setTimeout(r, 50));
    t('написаното на ръка не се подменя', v('p2-kota-izkop') === '-3.10', v('p2-kota-izkop'));

    t('няма грешка при отварянето', greshki.length === 0, greshki.slice(0, 2));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — котите идват от едно място`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.log('  ЛО  ' + e.stack); process.exit(1); });
