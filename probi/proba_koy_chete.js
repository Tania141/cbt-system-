// КОЙ ЧЕТЕ — и вижда ли се.
//
// Операторът, 28.10.2026: при една проба Claude срещу Mistral изборът остана в
// браузъра (`localStorage.s2_chetec = "mistral"`), и МЕСЕЦИ наред всичко се
// четеше с резервния. Едно разрешение за строеж излезе с измислен цитат,
// пропуснат ред от чеклиста, празно наименование и „няма подписи“ при два
// подписа — и нищо на екрана не казваше защо.
//
// Най-лошото беше надписът: документът пишеше „Mistral (резервен)“. А той не
// беше резервен — беше ИЗБРАНИЯТ, и основният никога не е бил опитван.
// Затова `zashto_rezerven` беше празно: нищо не се е провалило.
//
// Тази проба пази трите неща, които го правят видимо.
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

const fakt = v => ({ stoynost: v, citat: v, stranica: 1 });

const OBEKT = {
    id: 'hus', pi: '1', stroej: 'Проба',
    sloy2: { od: { potvardeni: {}, dokumenti: [
        // избран от оператора — НЕ е резервен
        { id: 'a', fajl: 'RS.pdf', vid: 'разрешение за строеж', chetec: 'Mistral (резервен)',
          chetec_izbran: 'mistral', zashto_rezerven: '', nomer: fakt('277') },
        // наистина резервен — основният е отказал
        { id: 'b', fajl: 'Akt14.pdf', vid: 'акт 14', chetec: 'Mistral (резервен)',
          zashto_rezerven: 'Claude: 429 претоварен', nomer: fakt('1') },
        // основният
        { id: 'v', fajl: 'Dogovor.pdf', vid: 'договор', chetec: 'Claude', nomer: fakt('12') },
    ] } },
};

async function otvori(hash, chetec) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + hash,
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [JSON.parse(JSON.stringify(OBEKT))], consultants: [],
                apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            if (chetec) w.localStorage.setItem('s2_chetec', chetec);
            w.fetch = async () => ({ ok: true, status: 200,
                json: async () => ({ stoynost: null, grupi: [{ moment: 'Акт 15', dokumenti: [] }] }) });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 200));
    return { w, d: w.document, greshki };
}

(async () => {

// ── 1. Изборът се ВИЖДА там, където се чете ─────────────────────────────────
const a = await otvori('#/moment/hus/0/' + encodeURIComponent('Акт 15'), 'mistral');
t('моментът се рисува без грешка', a.greshki.length === 0, a.greshki);
const predupr = a.d.querySelector('.predupr');
t('избраният четец се вижда на момента', !!predupr, tekst(a.d.getElementById('moment-telo')).slice(0, 200));
t('казва КОЙ чете', /Mistral/.test(tekst(predupr)), tekst(predupr));
t('и че е ИЗБРАН, не резервен',
  /избран от теб, не резервен/.test(tekst(predupr)), tekst(predupr));
t('и че основният не се опитва',
  /Основният четец не се опитва/.test(tekst(predupr)), tekst(predupr));
t('дава връщане с един клик',
  /върни автоматичния/.test(tekst(predupr)), tekst(predupr));

// Връщането работи и предупреждението изчезва.
a.w.aktVarniAvtomatichen();
t('връщането маха избора', a.w.localStorage.getItem('s2_chetec') === null);
t('и четецът пак е автоматичен', a.w.aktChetec() === 'auto');
t('при автоматично НЕ се казва нищо', a.w.aktChetecHtml() === '', a.w.aktChetecHtml());

// ── 2. При автоматично няма предупреждение ──────────────────────────────────
const b = await otvori('#/moment/hus/0/' + encodeURIComponent('Акт 15'));
t('без избор моментът мълчи', !b.d.querySelector('.predupr'));

// ── 3. Досието казва честно кой е чел всеки документ ────────────────────────
const c = await otvori('#/dosie/hus/0', 'mistral');
t('досието се рисува без грешка', c.greshki.length === 0, c.greshki);
const dok = [...c.d.querySelectorAll('.dok')];
t('трите документа излизат', dok.length === 3, dok.length);

t('избраният четец си личи като ИЗБРАН',
  /чел го е Mistral — избран от теб/.test(tekst(dok[0])), tekst(dok[0]));
t('и вече НЕ пише „резервен“ при него',
  !/Mistral \(резервен\)/.test(tekst(dok[0])), tekst(dok[0]));
t('истински резервният казва ЗАЩО',
  /резервен, защото основният отказа/.test(tekst(dok[1])), tekst(dok[1]));
t('основният не носи нито едното',
  /чел го е Claude/.test(tekst(dok[2]))
  && !/избран от теб/.test(tekst(dok[2]))
  && !/резервен/.test(tekst(dok[2])), tekst(dok[2]));

// ── 4. Сървърът записва избора ──────────────────────────────────────────────
const api = fs.readFileSync(path.join(KOREN, '..', '..', '..', '..', 'cbt-api', 'api.py'), 'utf8');
t('сървърът записва „chetec_izbran“ на всеки документ',
  /d\["chetec_izbran"\] = izbran/.test(api));
t('и го оставя празно при автоматично',
  /izbran = "" if izbor == "auto" else izbor/.test(api));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — вижда се кой чете`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
