// СВЕРКАТА: каквото Акт 15 пише ↔ каквото чеклистът брои (24.11.2026).
//
// Анализът от 18.11.2026, т. 3.2 — една истина на две места. Тази проба не
// пази какво пише актът; пази, че РАЗМИНАВАНЕТО СЕ КАЗВА. Двата случая са
// видени в кода:
//   · акт обр. 7 от бетоновия дневник, „подписан“ — Акт 15 го изрежда в 1.3,
//     а чеклистът не го брои (решено 18.11: редът го отмята операторът);
//   · прочетен, но несверен документ — чеклистът казва „имам“, а актът не го
//     изрежда.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>'
            + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const REDOVE = ['Документ за собственост или документ за учредено право на строеж',
    'Разрешение за строеж', 'Заповедна книга на строежа', 'Акт обр. 14',
    'Акт 7 и обр. 12 по част архитектура', 'Технически паспорт на строежа'];

const RS = { id: 'rs.pdf', fajl: 'rs.pdf', vid: 'Разрешение за строеж', cheklist_red: 'Разрешение за строеж',
    nomer: { stoynost: '277' }, data: { stoynost: '02.11.2023' } };
const A14 = { id: 'a14.pdf', fajl: 'a14.pdf', vid: 'Акт обр. 14', cheklist_red: 'Акт обр. 14',
    nomer: { stoynost: '1' }, data: { stoynost: '12.01.2022' } };

const vc = new VirtualConsole();
const greshki = [];
vc.on('jsdomError', e => greshki.push(String(e.message || e)));
const dom = new JSDOM(stranica(), { runScripts: 'dangerously', url: 'http://localhost/akt/',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [], consultants: [] })); } });
const w = dom.window;

const obekt = (dop) => ({
    id: 'rad', pi: '68134.4083.1', vid: 'sgrada', dokumenti: [],
    sloy2: { od: { dokumenti: [RS, A14], potvardeni: {} } },
    akt7_dnevnik: { aktove: [{ data: '09.09.2020', smr: 'колони от -0,75 до +2,67', podpisan: true }] },
    ...dop,
});
const sveri = (p, d) => { for (const kl of w._s2SverimiKl(d)) p.sloy2.od.potvardeni[`${d.id}::${kl}`] = { stoynost: 'x' }; };

// ── 1. двата видени случая се казват ────────────────────────────────────────
const p = obekt();
sveri(p, RS);
t('функцията я има', typeof w.dokSverkaSCheklista === 'function');
const r = w.dokSverkaSCheklista(p, p, REDOVE);
const red = (spisak, ime) => spisak.find(x => x.red === ime);
t('актът обр. 7 от дневника: актът го пише, чеклистът го иска — казва се',
  !!red(r.pisheNeBroi, 'Акт 7 и обр. 12 по част архитектура'), r);
t('и казва откъде — от дневника, потвърден от теб',
  /потвърден от оператора/.test((red(r.pisheNeBroi, 'Акт 7 и обр. 12 по част архитектура') || {}).otkade), r.pisheNeBroi);
t('несвереният акт обр. 14: чеклистът казва „имам“, актът не го пише — казва се',
  !!red(r.broiNePishe, 'Акт обр. 14') && /не е сверен/.test(red(r.broiNePishe, 'Акт обр. 14').zashto), r.broiNePishe);
t('свереното РС е и в акта, и в чеклиста — не е разминаване',
  !red(r.pisheNeBroi, 'Разрешение за строеж') && !red(r.broiNePishe, 'Разрешение за строеж'), r);

// ── 2. затворени, разминаването изчезва ─────────────────────────────────────
const p2 = obekt({ nadzor_otmetnati: ['Акт 7 и обр. 12 по част архитектура'] });
sveri(p2, RS); sveri(p2, A14);
const r2 = w.dokSverkaSCheklista(p2, p2, REDOVE);
t('отметнатият ред на обр. 7 и сверeният обр. 14 — няма разминаване',
  !r2.pisheNeBroi.length && !r2.broiNePishe.length, r2);

// ── 3. документ без ред в чеклиста не е разминаване ─────────────────────────
const p3 = obekt();
const FAKT = { id: 'f.pdf', fajl: 'f.pdf', vid: 'Фактура', cheklist_red: '', nomer: { stoynost: '5' }, data: { stoynost: '01.01.2024' } };
p3.sloy2.od.dokumenti.push(FAKT); sveri(p3, FAKT); sveri(p3, RS);
const r3 = w.dokSverkaSCheklista(p3, p3, REDOVE);
t('документ без ред в чеклиста не се брои за разминаване',
  !r3.pisheNeBroi.some(x => /Фактура/.test(x.dokumenti.join(' '))), r3.pisheNeBroi);

// ── 4. отметнатото на ръка е твое — не е „имам, а не пише“ ──────────────────
const p4 = obekt({ nadzor_otmetnati: ['Акт обр. 14'] });
sveri(p4, RS);
const r4 = w.dokSverkaSCheklista(p4, p4, REDOVE);
t('отметнатото влиза с името си — не е разминаване',
  !red(r4.broiNePishe, 'Акт обр. 14') && !red(r4.pisheNeBroi, 'Акт обр. 14'), r4);

t('страницата се вдига без грешки', !greshki.length, greshki.slice(0, 3));

// ── 5. екранът на Акт 15 го казва на самия ред ──────────────────────────────
(async () => {
    const ob = obekt({ nik: 'Радулов', tekusht_moment: 'Акт 15' });
    sveri(ob, RS);
    const vc2 = new VirtualConsole(), gr2 = [];
    vc2.on('jsdomError', e => gr2.push(String(e.message || e)));
    const d2 = new JSDOM(stranica(), { runScripts: 'dangerously',
        url: 'http://localhost/akt/#/moment/rad/0/' + encodeURIComponent('Акт 15'),
        pretendToBeVisual: true, virtualConsole: vc2,
        beforeParse(w2) {
            w2.localStorage.setItem('akt_v5', JSON.stringify({ projects: [ob], consultants: [], apiUrl: 'http://localhost/api' }));
            w2.localStorage.setItem('akt_token', 'proba');
            w2.fetch = async (url, opt) => ({ ok: true, status: 200, json: async () => {
                const nal = JSON.parse((opt && opt.body) || '{}').nalichni || [];
                return { red: ['Акт 15'], grupi: [{ moment: 'Акт 15', dokumenti: REDOVE.map(ime => ({
                    dokument: ime, etap: 'подпис', sastoyanie: nal.includes(ime) ? 'налично' : 'очаква се' })) }] };
            } });
        } });
    await new Promise(r => setTimeout(r, 400));
    const tx = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
    const red7 = d2.window.document.querySelector('.lipsva-red[data-dokument="Акт 7 и обр. 12 по част архитектура"]');
    t('в „Липсва ми“ редът на обр. 7 казва, че актът вече го изрежда',
      /Актът вече го изрежда/.test(tx(red7)), tx(red7));
    const butoni = [...d2.window.document.querySelectorAll('.razdel-bt')].map(tx).join(' | ');
    t('бутоните казват разминаването и затворени', /Липсва ми · \d+ · 1 актът вече го изрежда/.test(butoni)
      && /Имам · \d+ · 1 не влиза в акта/.test(butoni), butoni);
    d2.window.momentOtvoriRazdel('imam');
    const imam = tx(d2.window.document.querySelector('.razdel-telo'));
    t('в „Имам“ несвереният обр. 14 казва, че не влиза в акта',
      /Акт обр\. 14/.test(imam) && /Актът не го изрежда/.test(imam), imam);
    d2.window.momentSverkaOtmetni(encodeURIComponent('Акт 7 и обр. 12 по част архитектура'));
    await new Promise(r => setTimeout(r, 300));
    const zap = JSON.parse(d2.window.localStorage.getItem('akt_v5')).projects[0];
    t('„✔ имам го — отметни“ отмята реда', (zap.nadzor_otmetnati || []).includes('Акт 7 и обр. 12 по част архитектура'),
      zap.nadzor_otmetnati);
    t('Акт 15 на екрана — без грешки', !gr2.length, gr2.slice(0, 3));
    kraj();
})();

function kraj() {

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — сверката казва`);
process.exit(loshi.length ? 1 : 0);
}
