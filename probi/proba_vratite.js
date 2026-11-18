// Двете врати (18.11.2026): наличното и стойността — от ВСИЧКИ складове.
//
// Операторът, 17.11: „чете НА в Собственост, после пак си търси НА в
// Протокол 2 и търси «Нотариално заверено пълномощно на представителя на
// възложителите» в Акт 15“; „Какво знаем — в момента твърди, че нищо не знае“.
// Анализът (`ДА ПРОЧЕТА/АНАЛИЗ-КЪДЕ-СМЕ-СЕ-ЛУТАЛИ.md`) намери защо: чеклистът
// гледаше само отметнатото и досието, огледалото — само признаците.
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

const OBEKT = {
    id: 'ob1', pi: '10000.1.2', nik: 'Проба', stroej: 'Жилищна сграда', vid: 'sgrada', kategoria: 'трета',
    tekusht_moment: 'Акт 15', updatedAt: '2026-11-18T08:00:00Z',
    permit: { number: '77', date: '01.03.2023', issuer: 'гл. архитект' },
    builder: { company: 'Строител Проба ЕООД' },
    consultant: { name: 'Консулт Проба ЕООД' },
    zk: { number: '4570', date: '05.04.2023' },
    p2_koti: { izkop: '-3,97', cokul: '±0,00', bilo: '+24,10' },
    fakti: { kategoria: { stoynost: 'четвърта', sastoyanie: 'potvardeno', koy: 'оператора' } },
    sobstvenost: {
        lica: [{ id: 'l1', ime: 'Иван Пробов Пробов', vid: 'физическо',
                 predstavitel: { ime: 'Петър Пълномощников', nomer: '1234', data: '02.02.2023' } }],
        obekti: [{ id: 'o1', vid: 'земя', identifikator: '10000.1.2' }],
        sabitia: [{ id: 'e1', obekt: 'o1', vid: 'покупко-продажба', data: '01.01.2020',
                    dokument: 'НА № 5, том I', pridobivashti: [{ lice: 'l1', dyal: '1/1' }] }],
        koren: 'o1',
    },
};

let poslednaNadzor = null;
async function otvori(hash) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + hash, pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OBEKT], history: [], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url, o) => {
                if (/\/api\/nadzor/.test(String(url))) poslednaNadzor = JSON.parse((o && o.body) || '{}');
                const telo = { red: [], grupi: [] };
                return { ok: true, status: 200, json: async () => telo, text: async () => '{}', headers: { get: () => 'application/json' } };
            };
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));
    return { w, d: w.document, greshki };
}

(async () => {
    // ── вратата към наличното ───────────────────────────────────────────────
    const a = await otvori('#/moment/ob1/0/' + encodeURIComponent('Акт 15'));
    const p = a.w.eval('aktDanni.projects[0]');
    const nal = a.w.aktNalichni(p, p);
    for (const red of ['Документ за собственост на имота',
                       'Документ за собственост или документ за учредено право на строеж',
                       'Пълномощно на представителя на възложителя',
                       'Нотариално заверено пълномощно на представителя на възложителите',
                       'Разрешение за строеж', 'Заповедна книга на строежа'])
        t(`налично: „${red}“`, nal.includes(red), nal);
    t('учредяване няма — редът за право на строеж НЕ е налично',
      !nal.includes('Нотариален акт за учредено право на строеж'), nal);
    t('към сървъра отиват и складовете', !!poslednaNadzor
      && (poslednaNadzor.nalichni || []).includes('Нотариално заверено пълномощно на представителя на възложителите'),
      poslednaNadzor && poslednaNadzor.nalichni);
    const otkade = a.w.nalichniOtSkladove(p, p);
    t('всеки ред казва откъде: пълномощното', otkade.some(x => /пълномощно № 1234/.test(x.otkade)), otkade);
    t('всеки ред казва откъде: РС от паспорта', otkade.some(x => x.otkade === 'Паспорт · РС № 77'), otkade);
    t('съставеното НЕ се брои за налично (съставен ≠ подписан)',
      !/generatedDocs/.test(a.w.nalichniOtSkladove.toString()), '');
    // и старата кухня (ОСИП, надзорът) пита същото
    t('кухнята пита същата врата', JSON.stringify(a.w._nadzorNalichni(p, p).sort()) === JSON.stringify(nal.slice().sort()),
      a.w._nadzorNalichni(p, p));
    t('без грешка', a.greshki.length === 0, a.greshki);

    // ── вратата към стойността ──────────────────────────────────────────────
    const s = k => a.w.aktStoynost(p, p, k);
    t('РС: от паспорта', s('rs').stoynost === '№ 77 от 01.03.2023 гл. архитект' && s('rs').otkade === 'Паспорт', s('rs'));
    t('строителят', s('stroitel').stoynost === 'Строител Проба ЕООД', s('stroitel'));
    t('книгата', /4570/.test(s('zk_nomer').stoynost), s('zk_nomer'));
    t('възложителят — от регистъра', /Иван Пробов/.test(s('sobstvenik').stoynost) && s('sobstvenik').otkade === 'Собственост', s('sobstvenik'));
    t('котата изкоп — от Протокол 2', s('kota_izkop').stoynost === '-3,97', s('kota_izkop'));
    t('сверен признак е пръв', s('kategoria').stoynost === 'четвърта', s('kategoria'));
    t('и разминаването със склада не е тихо', s('kategoria').razminava && s('kategoria').razminava.stoynost === 'трета', s('kategoria'));

    // ── „Какво знаем“ ───────────────────────────────────────────────────────
    const z = await otvori('#/znaem/ob1/0/dokumenti');
    const dok = tekst(z.d.getElementById('znaem-dokumenti'));
    t('огледалото: „Документите и участниците“', /Документите и участниците/.test(dok) && /4 от 4/.test(dok), dok);
    t('огледалото показва РС с откъде', /№ 77/.test(dok) && /от Паспорт/.test(dok), dok);
    z.w.znaemRazgani('kakvo');
    const kakvo = tekst(z.d.getElementById('znaem-kakvo'));
    t('огледалото: категорията с разминаването', /четвърта/.test(kakvo) && /Паспорт казва „трета“/.test(kakvo), kakvo);
    t('огледалото вече не казва „нищо не знаем“ за строежа', /Жилищна сграда/.test(kakvo), kakvo);
    t('огледалото без грешка', z.greshki.length === 0, z.greshki);

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — двете врати виждат всички складове`);
    process.exit(loshi.length ? 1 : 0);
})();
