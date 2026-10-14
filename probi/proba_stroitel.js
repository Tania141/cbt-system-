// Строителят: един договор, пет полета.
//
// Пробата не вика сървъра — подава прочетеното направо на _dogovorNapalni,
// за да провери какво прави кодът с него.
const { JSDOM, VirtualConsole } = require('jsdom');
const { stranicaSVgradenKod, HTML } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const f = s => ({ stoynost: s, stranica: 1 });   // четецът връща факт с цитат

const DOGOVOR = {
    vid_kod: 'DOGOVOR_STROITELSTVO', nomer: f('17'), data: f('03.02.2024'),
    uchastnici: [
        { rolya: 'възложител', ime: f('Иван Георгиев Петров') },
        { rolya: 'строител', ime: f('Строй Инвест ЕООД'), eik: f('203456789'),
          adres: f('гр. София, ул. Бяло море 3'), predstavlyavan_ot: f('инж. Петър Строителев') },
        { rolya: 'технически ръководител', ime: f('инж. Мария Техникова') },
    ],
};

const OBEKT = { id: '1', pi: '1', name: 'Проба', nik: 'Проба', consultant: { id: 1 },
                vid: 'сграда', kategoria: 5 };
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

    w.navigateTo('new-passport');
    w.renderPassportForm(null);
    await new Promise(r => setTimeout(r, 100));

    t('картата на строителя има качване', !!w.document.getElementById('fp-dogovor-fajl'));

    const hod = w._dogovorNapalni(DOGOVOR, 'dogovor-17.pdf');
    const v = id => (w.document.getElementById(id) || {}).value;

    t('фирмата идва от договора', v('fp-builder-company') === 'Строй Инвест ЕООД', v('fp-builder-company'));
    t('ЕИК идва от договора', v('fp-builder-eik') === '203456789', v('fp-builder-eik'));
    t('адресът идва от договора', v('fp-builder-address') === 'гр. София, ул. Бяло море 3', v('fp-builder-address'));
    t('управителят идва от „представляван от“', v('fp-builder-manager') === 'инж. Петър Строителев', v('fp-builder-manager'));
    t('техн. ръководител идва от своята роля', v('fp-builder-tech') === 'инж. Мария Техникова', v('fp-builder-tech'));
    t('казва откъде и кара да се провери', /От „dogovor-17\.pdf“/.test(hod) && /Провери ги/.test(hod), hod.slice(0, 120));
    t('показва номера и датата на договора', /№ 17 от 03\.02\.2024/.test(hod), hod.slice(0, 160));

    // Написаното на ръка не се подменя, но разминаването се казва.
    w.document.getElementById('fp-builder-eik').value = '111111111';
    const hod2 = w._dogovorNapalni(DOGOVOR, 'dogovor-17.pdf');
    t('написаното на ръка остава', v('fp-builder-eik') === '111111111', v('fp-builder-eik'));
    t('разминаването се казва', /Различава се/.test(hod2) && /203456789/.test(hod2), hod2.slice(0, 200));

    // Липсващото се казва, не се налучква.
    const bez = { uchastnici: [{ rolya: 'строител', ime: f('Строй ЕООД') }] };
    w.renderPassportForm(null);
    await new Promise(r => setTimeout(r, 50));
    const hod3 = w._dogovorNapalni(bez, 'kus.pdf');
    t('липсващото се казва с [___]', /\[___\]/.test(hod3) && /ЕИК/.test(hod3), hod3.slice(0, 200));
    t('което го има, пак влиза', v('fp-builder-company') === 'Строй ЕООД', v('fp-builder-company'));

    // Чужд документ.
    w.renderPassportForm(null);
    await new Promise(r => setTimeout(r, 50));
    const hod4 = w._dogovorNapalni({ uchastnici: [] }, 'skica.pdf');
    t('чужд документ се разпознава', /не изглежда като договор/.test(hod4), hod4.slice(0, 120));

    t('няма грешки', greshki.length === 0, greshki.slice(0, 2));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — един договор, пет полета`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.log('  ЛО  ' + e.stack); process.exit(1); });
