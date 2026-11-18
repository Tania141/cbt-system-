// Преместените стаи от старото ПВА (17.11.2026): Консултанти, Регистър на ЗК,
// ОСИП, Проверки, Нормативна уредба, История, Данните.
//
// Операторът: „Искам днес да преместим цялото старо ПВА“. Проверява се, че
// всяка стая се отваря в новото без грешка, рисува се от старата кухня, и
// пише — не мълчи. Сървърът е подменен: отговаря като истинския за ЗК.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const KOREN = path.join(__dirname, '..');
const PAPKA = path.join(KOREN, 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak).slice(0, 300)));
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

const OBEKT = { id: 'ob1', pi: '68134.702.9889', nik: 'Радулов', stroej: 'Жилищна сграда',
                address: 'София', tekusht_moment: 'Акт 15', updatedAt: '2026-11-17T08:00:00Z' };
const ZK = { nachalen: '4568', sledvasht: '4571', prazniny: [],
             redove: [{ nomer: '4570', data: '01.09.2026', obekt: 'Жилищна сграда', pi: '68134.702.9889', status: 'издадена' }] };
const zaiavki = [];

async function otvori(hash) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    vc.on('error', (...a) => greshki.push(a.join(' ')));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + (hash || ''),
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [OBEKT], history: [{ type: 'generate', date: '2026-11-17T09:30:00Z', pi: '68134.702.9889',
                                                detail: 'Акт 15', action: 'Генериран документ' }],
                consultants: [{ id: 1, name: 'СиБиТи Консулт ЕООД', eik: '204024246', manager: 'Таня Петрова',
                                employees: [{ id: 2, name: 'Иван Иванов', specialization: 'Архитектура', title: 'арх.' }] }],
                apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url, o) => {
                zaiavki.push(String(url));
                const u = String(url);
                const telo = /\/api\/zk(\?|$)/.test(u) ? ZK
                    : /\/api\/izvori/.test(u) ? { godni: 6, namereni: 6, ot: 6, lipsvat: [], ne_savpadat: [] }
                    : /\/api\/nadzor/.test(u) ? { red: [], grupi: [] }
                    : { ok: true };
                return { ok: true, status: 200, json: async () => telo, text: async () => JSON.stringify(telo),
                         headers: { get: () => 'application/json' } };
            };
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
    w.scrollTo = () => {};
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));
    return { w, d: w.document, greshki };
}

(async () => {
    // ── плотът: връзките към стаите на фирмата ──────────────────────────────
    const a = await otvori('#/plot');
    // ОБЪРНАТО 18.11.2026: стаите на фирмата вече не са ред връзки горе на
    // плота, а лявата колона (кройката от 17.11 — „Резервно копие“, не
    // „Данните“). Пазят се същите пет адреса, но на новото място.
    const nav = a.d.getElementById('lyava');
    const adresi = nav ? [...nav.querySelectorAll('a[href]')].map(x => x.getAttribute('href')) : [];
    t('лявата колона — стаите на фирмата', ['#/konsultanti', '#/zk', '#/normativna', '#/istoria', '#/danni']
      .every(h => adresi.includes(h)) && /Резервно копие/.test(tekst(nav)), adresi);
    t('плотът без грешка', a.greshki.length === 0, a.greshki);

    // ── Консултанти ─────────────────────────────────────────────────────────
    const k = await otvori('#/konsultanti');
    t('Консултанти: стаята се вижда', !k.d.getElementById('ekran-konsultanti').hidden);
    t('Консултанти: плотът е скрит', k.d.getElementById('ekran-plot').hidden);
    t('Консултанти: списъкът от кухнята', /СиБиТи Консулт/.test(tekst(k.d.getElementById('consultants-list')))
      && /Иван Иванов/.test(tekst(k.d.getElementById('consultants-list'))), tekst(k.d.getElementById('consultants-list')));
    // поправка през старата форма
    k.w.editConsultant(1);
    k.d.getElementById('consultant-cert').value = 'РК-0999';
    k.w.saveConsultant();
    const zap = JSON.parse(k.w.localStorage.getItem('akt_v5'));
    t('Консултанти: поправката се записва', zap.consultants[0].cert === 'РК-0999', zap.consultants[0]);
    t('Консултанти: и казва, че е записано — на екрана', /актуализиран/.test(tekst(k.d.getElementById('alerts-container'))),
      tekst(k.d.getElementById('alerts-container')));
    k.w.resetConsultantForm();
    k.w.saveConsultant();
    t('Консултанти: празна фирма — казва го', /Въведете фирма/.test(tekst(k.d.getElementById('alerts-container'))),
      tekst(k.d.getElementById('alerts-container')));
    t('Консултанти: връщането е към плота', k.d.getElementById('shapka-nazad').getAttribute('href') === '#/plot');
    t('Консултанти: без грешка', k.greshki.length === 0, k.greshki);

    // ── Регистър на ЗК — на фирмата и на обекта ─────────────────────────────
    const z = await otvori('#/zk');
    t('ЗК: регистърът се рисува', /4570/.test(tekst(z.d.getElementById('zk-spisak'))), tekst(z.d.getElementById('zk-spisak')));
    t('ЗК: следващият свободен номер', /4571/.test(tekst(z.d.getElementById('zk-sledvasht-kutiya'))));
    t('ЗК: без грешка', z.greshki.length === 0, z.greshki);
    const zo = await otvori('#/zk/ob1/0');
    t('ЗК на обекта: генерирането е за този обект', !!zo.d.getElementById('btn-gen-zk'), tekst(zo.d.getElementById('zk-gen-kutiya')));
    t('ЗК на обекта: връщането е към обекта', /#\/obekt\/ob1\/0/.test(zo.d.getElementById('shapka-nazad').getAttribute('href')));
    // изборът на друг обект не гърми на стария `renderImotPage`
    zo.w.smeniObekt('ob1', 'zk');
    await new Promise(r => setTimeout(r, 100));
    t('ЗК: изборът на обект е адрес', zo.w.location.hash === '#/zk/ob1/0', zo.w.location.hash);
    t('ЗК на обекта: без грешка', zo.greshki.length === 0, zo.greshki);

    // ── ОСИП и Проверки — на обекта ─────────────────────────────────────────
    const o = await otvori('#/osip/ob1/0');
    t('ОСИП: стаята се вижда и е пълна', !o.d.getElementById('ekran-osip').hidden
      && tekst(o.d.getElementById('osip-content')).length > 50, tekst(o.d.getElementById('osip-content')).slice(0, 200));
    t('ОСИП: не казва „не се отвори“', !/не се отвори/.test(tekst(o.d.getElementById('ekran-osip'))), tekst(o.d.getElementById('ekran-osip')).slice(0, 300));
    t('ОСИП: без грешка', o.greshki.length === 0, o.greshki);
    const p = await otvori('#/proverki/ob1/0');
    t('Проверки: без записки — праща към четенето', /записки/.test(tekst(p.d.getElementById('kakav-content'))),
      tekst(p.d.getElementById('kakav-content')).slice(0, 200));
    t('Проверки: без грешка', p.greshki.length === 0, p.greshki);

    // ── Нормативна, История, Данните ────────────────────────────────────────
    const n = await otvori('#/normativna');
    t('Нормативна: проверката се пуска', zaiavki.some(u => /izvori|health/.test(u)), zaiavki.slice(-5));
    t('Нормативна: без грешка', n.greshki.length === 0, n.greshki);
    const i = await otvori('#/istoria');
    t('История: редът от историята', /Акт 15/.test(tekst(i.d.getElementById('history-timeline'))), tekst(i.d.getElementById('history-timeline')));
    t('История: без грешка', i.greshki.length === 0, i.greshki);
    const dn = await otvori('#/danni');
    t('Данните: копието и връщането', /Свали копие/.test(tekst(dn.d.getElementById('ekran-danni')))
      && !!dn.d.getElementById('stai-vnos'));
    t('Данните: без грешка', dn.greshki.length === 0, dn.greshki);

    // ── всеки бутон сочи функция, която тук съществува ──────────────────────
    // Старите стаи носят onclick="…" към стария екран. Бутон към незаредена
    // функция не прави нищо и не казва нищо — точно това не бива.
    const IZVAN = new Set(['if', 'return', 'event', 'this', 'document', 'window', 'confirm', 'alert']);
    for (const [ime, s] of [['Консултанти', k], ['ЗК', zo], ['ОСИП', o], ['Проверки', p], ['Нормативна', n],
                            ['История', i], ['Данните', dn]]) {
        const sek = s.d.querySelector('section:not([hidden]) .stara-staya') || s.d.body;
        const imena = new Set();
        for (const el of sek.querySelectorAll('[onclick],[onchange],[oninput]'))
            for (const at of ['onclick', 'onchange', 'oninput'])
                for (const m of String(el.getAttribute(at) || '').matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g))
                    if (!IZVAN.has(m[2])) imena.add(m[2]);
        const lipsvat = [...imena].filter(x => typeof s.w[x] !== 'function');
        t(`${ime}: всеки бутон сочи заредена функция`, lipsvat.length === 0, lipsvat);
    }

    // ── обектът води към стаите си ──────────────────────────────────────────
    const ob = await otvori('#/obekt/ob1/0');
    const vr = tekst(ob.d.querySelector('.vrazki'));
    t('обектът води към ОСИП, Заповедна книга и Проверки', /ОСИП/.test(vr) && /Заповедна книга/.test(vr) && /Проверки/.test(vr), vr);

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — старите стаи са в новото`);
    process.exit(loshi.length ? 1 : 0);
})();
