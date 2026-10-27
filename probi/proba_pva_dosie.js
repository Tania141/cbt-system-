// ЕКРАН 6 — ДОСИЕТО, килерът.
//
// „Всичко, качено по обекта, на едно място… Този екран НЕ въвежда — само
// показва и поправя.“ (ЗАДАНИЕ.md)
//
// Сверяването идва от кухнята (`js/04-vhodni-dokumenti.js`) — екранът не
// смята дали документ е сверен, само го показва.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const KOREN = path.join(__dirname, '..');
const PAPKA = path.join(KOREN, 'akt');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const tekst = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>'
            + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const fakt = (v, citat, str) => ({ stoynost: v, citat, stranica: str });

const OBEKT = {
    id: 'hus', pi: '68134.1006.2440', nik: 'ХЪС', stroej: 'Жилищна сграда',
    sloy2: { od: {
        dokumenti: [
            { id: 'd1', fajl: 'Protokol_2.pdf', vid: 'протокол обр. 2', sken: true, chetec: 'claude',
              cheklist_red: 'Протокол обр. 2',
              nomer: fakt('1', 'Протокол № 1', 3), data: fakt('29.03.2026', 'от 29.03.2026 г.', 3) },
            { id: 'd2', fajl: 'Dogovor_SMR.docx', vid: 'договор', chetec: 'claude',
              cheklist_red: 'Договор за СМР',
              nomer: fakt('12', '№ 12', 1), data: fakt('01.03.2026', 'от 01.03.2026', 1),
              izdatel: fakt('ИРА-НМ 21 ООД', 'ИРА-НМ 21 ООД', 1) },
            { id: 'd3', fajl: 'Stanovishte_PBZN.pdf', vid: 'становище', sken: true },
        ],
        // d1 е сверен докрай; d2 — само наполовина
        potvardeni: { 'd1::nomer': true, 'd1::data': true, 'd2::nomer': true },
    } },
};

async function otvori(hash, obekt) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + hash,
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [JSON.parse(JSON.stringify(obekt || OBEKT))],
                consultants: [], apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url) => ({ ok: true, status: 200, json: async () =>
                /danni\/kandidati/.test(String(url))
                    ? { stoynost: {
                        'удостоверение за нанасяне в кадастъра': {
                            ime: 'Удостоверение за нанасяне в кадастъра', broy: 4,
                            obekti: ['68134.1006.2440'], sastavki: ['sgrada'],
                            fajlove: ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf'], sastoyanie: 'chaka' },
                        'протокол 19': {
                            ime: 'Протокол 19', broy: 1, obekti: [], sastavki: [],
                            fajlove: ['x.pdf'], sastoyanie: 'chaka' } } }
                    : { stoynost: null } });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 250));
    return { w, d: w.document, greshki };
}

(async () => {

const a = await otvori('#/dosie/hus/0');
t('Екран 6 се рисува без грешка в конзолата', a.greshki.length === 0, a.greshki);
t('от досието се връщаш в ОБЕКТА',
  a.d.getElementById('shapka-nazad').getAttribute('href') === '#/obekt/hus/0');

// ── списъкът ────────────────────────────────────────────────────────────────
let dokumenti = [...a.d.querySelectorAll('.dok')];
t('всички прочетени документи излизат', dokumenti.length === 3, dokumenti.length);
t('броячът ги казва', /3 документа/.test(tekst(a.d.getElementById('dosie-telo'))));
t('вижда се какво е', /протокол обр\. 2/.test(tekst(dokumenti[0])), tekst(dokumenti[0]));
t('вижда се номер и дата',
  /1 · 29\.03\.2026/.test(tekst(dokumenti[0])), tekst(dokumenti[0]));
t('вижда се кой ред доказва',
  /доказва: Протокол обр\. 2/.test(tekst(dokumenti[0])), tekst(dokumenti[0]));
t('вижда се файлът и че е скан',
  /Protokol_2\.pdf/.test(tekst(dokumenti[0])) && /скан/.test(tekst(dokumenti[0])));

// ── сверено ли е — сметката е на кухнята ────────────────────────────────────
t('сверен докрай си личи', dokumenti[0].classList.contains('dok-sveren'));
t('и го казва с числа', /сверени 2 от 2/.test(tekst(dokumenti[0])), tekst(dokumenti[0]));
t('наполовина свереният НЕ е сверен', !dokumenti[1].classList.contains('dok-sveren'));
t('и казва колко са', /сверени 1 от 3/.test(tekst(dokumenti[1])), tekst(dokumenti[1]));
t('без извадени факти го казва честно',
  /няма извадени факти/.test(tekst(dokumenti[2])), tekst(dokumenti[2]));
t('документ без ред в чеклиста си личи',
  /няма ред в чеклиста/.test(tekst(dokumenti[2])), tekst(dokumenti[2]));

// ── клик отваря прочетеното с цитатите ──────────────────────────────────────
t('отначало нищо не е разгънато', !a.d.querySelector('.dok-fakti'));
a.w.dosieRazgani(encodeURIComponent('d1'));
const fakti = [...a.d.querySelectorAll('.fakt')];
t('разгънатото показва фактите', fakti.length === 2, fakti.length);
t('с етикет и стойност',
  /номер 1/.test(tekst(fakti[0])), tekst(fakti[0]));
t('с ЦИТАТА и страницата',
  /„Протокол № 1“ · стр\. 3/.test(tekst(fakti[0])), tekst(fakti[0]));
t('казва кое е сверено', /✓ сверено/.test(tekst(fakti[0])), tekst(fakti[0]));
a.w.dosieRazgani(encodeURIComponent('d1'));
t('втори клик го сгъва', !a.d.querySelector('.dok-fakti'));

// ── търсенето ───────────────────────────────────────────────────────────────
a.w.dosieTarsi('договор');
dokumenti = [...a.d.querySelectorAll('.dok')];
t('търсене по вид стеснява', dokumenti.length === 1, dokumenti.length);
a.w.dosieTarsi('Protokol_2');
t('търсене по име на файл работи', a.d.querySelectorAll('.dok').length === 1);
a.w.dosieTarsi('29.03');
t('търсене по дата работи', a.d.querySelectorAll('.dok').length === 1);
a.w.dosieTarsi('няма такова');
t('нищо намерено го казва',
  /Нищо не отговаря/.test(tekst(a.d.getElementById('dosie-telo'))));
a.w.dosieTarsi('');
t('празно търсене връща всичко', a.d.querySelectorAll('.dok').length === 3);

// ── видени, но неописани ────────────────────────────────────────────────────
const telo = tekst(a.d.getElementById('dosie-telo'));
t('видените, но неописани излизат', /Видени, но неописани · 2/.test(telo), telo.slice(-400));
t('с брояча на срещанията', /срещан 4 пъти/.test(telo), telo.slice(-400));
t('казва, че нищо не влиза само', /Нищо не влиза само/.test(telo));

const kandidati = [...a.d.querySelectorAll('.kandidat')];
t('срещаният достатъчно пъти ПИТА',
  kandidati[0].classList.contains('kandidat-pita'), tekst(kandidati[0]));
t('и дава трите отговора',
  /за да започна/.test(tekst(kandidati[0])) && /за да подпиша/.test(tekst(kandidati[0]))
  && /не е за чеклиста/.test(tekst(kandidati[0])), tekst(kandidati[0]));
t('срещаният веднъж НЕ пита още',
  !kandidati[1].classList.contains('kandidat-pita'), tekst(kandidati[1]));

// ── какво НЕ прави този екран ───────────────────────────────────────────────
t('няма качване на файлове',
  !a.d.querySelector('#dosie-telo input[type="file"]'));
t('няма бутон „прочети“',
  !/прочети/i.test(tekst(a.d.getElementById('dosie-telo'))));
t('казва, че сверяването е другаде',
  /Сверява се там, където се чете|файловете не се пазят/i.test(telo), telo.slice(0, 300));

// ── празен обект ────────────────────────────────────────────────────────────
const c = await otvori('#/dosie/hus/0', { id: 'hus', pi: '1', stroej: 'Проба' });
t('празно досие не гърми', c.greshki.length === 0, c.greshki);
t('и го казва с думи',
  /Още няма/.test(tekst(c.d.getElementById('dosie-telo'))),
  tekst(c.d.getElementById('dosie-telo')).slice(0, 160));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — досието стои`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
