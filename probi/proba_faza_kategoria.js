// Фазата и категорията: потвърждават се в „Проверки“, ОСИП само ги показва.
//
// Операторът, 30.09.2026: „когато избера вярната фаза, това поле не го
// записва“ — избирала е на едното място, гледала е другото.
//
// Пробата сменя и обекта — там имаше изтрита функция, която гърмеше тихо.
const { JSDOM, VirtualConsole } = require('jsdom');
const { stranicaSVgradenKod, HTML } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const fakt = (stoynost, sastoyanie = 'potvardeno') => ({ stoynost, sastoyanie });
const KONSULTANT = { id: 1, name: 'СиБиТи Консулт ЕООД', eik: '1', type: 'ЮЛ', employees: [] };

function obekt(fakti, osip) {
    return { id: '1', pi: '1', name: 'Проба', nik: 'Проба', consultant: { id: 1 },
             vid: 'сграда', kategoria: 5, fakti, osip: osip || {} };
}

async function vdigni(o, vtori) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const projects = vtori ? [o, vtori] : [o];
    const dom = new JSDOM(stranicaSVgradenKod(HTML), {
        runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
        virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects, currentProject: o, consultants: [KONSULTANT],
                history: [], apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
        },
    });
    const w = dom.window;
    w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' },
                             json: async () => ({ grupi: [], red: [], po_izbor: [] }), text: async () => '{}' });
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));
    return { w, greshki };
}

(async () => {
    // ── потвърдено в Проверки ────────────────────────────────────────────
    const { w, greshki } = await vdigni(obekt({
        faza: fakt('Технически проект (ТП)'),
        kategoria: fakt('пета'),
    }, { kategoria: 'пета КАТЕГОРИЯ, съгласно чл. 10, ал. 1, буква „а“…' }));

    w.navigateTo('osip');
    await new Promise(r => setTimeout(r, 400));
    const v = id => (w.document.getElementById(id) || {}).value;
    const txt = id => ((w.document.getElementById(id) || {}).textContent || '').trim();

    t('фазата идва от потвърденото', v('fp-osip-faza') === 'Технически проект (ТП)', v('fp-osip-faza'));
    t('казва откъде е', /От потвърденото/.test(txt('fp-faza-belejka')), txt('fp-faza-belejka'));
    t('категорията се сверява и съвпада',
       /потвърдена пета категория/.test(txt('fp-kat-belejka')), txt('fp-kat-belejka'));

    // ── цитатът противоречи на потвърденото ──────────────────────────────
    const a = await vdigni(obekt({ kategoria: fakt('четвърта') },
                                 { kategoria: 'пета КАТЕГОРИЯ, съгласно чл. 10…' }));
    a.w.navigateTo('osip');
    await new Promise(r => setTimeout(r, 400));
    const bel = ((a.w.document.getElementById('fp-kat-belejka') || {}).textContent || '');
    t('разминаването цитат/цифра се вижда', /единият е грешен/.test(bel) && /четвърта/.test(bel), bel.trim());

    // ── нищо не е потвърдено ─────────────────────────────────────────────
    const b = await vdigni(obekt({}, {}));
    b.w.navigateTo('osip');
    await new Promise(r => setTimeout(r, 400));
    t('непотвърдената фаза се казва с [___]',
       /\[___\]/.test((b.w.document.getElementById('fp-faza-belejka') || {}).textContent || ''));
    t('непотвърдената категория се казва с [___]',
       /\[___\]/.test((b.w.document.getElementById('fp-kat-belejka') || {}).textContent || ''));

    // ── смяната на обект не гърми ────────────────────────────────────────
    const vtori = { ...obekt({}), id: '2', pi: '2', name: 'Втори' };
    const c = await vdigni(obekt({ faza: fakt('Работен проект (РП)') }), vtori);
    let padna = null;
    try { c.w.smeniObekt('2', 'osip'); } catch (e) { padna = e.message; }
    await new Promise(r => setTimeout(r, 300));
    t('смяната на обект не хвърля', !padna, padna);
    t('смяната на обект не прави грешка в конзолата', c.greshki.length === 0, c.greshki.slice(0, 2));

    t('няма други грешки', greshki.length === 0 && a.greshki.length === 0 && b.greshki.length === 0,
       [...greshki, ...a.greshki, ...b.greshki].slice(0, 2));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — едно място за фазата и категорията`);
    process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.log('  ЛО  ' + e.stack); process.exit(1); });
