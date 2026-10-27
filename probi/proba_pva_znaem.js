// ЕКРАН 7 — КАКВО ЗНАЕМ ЗА СТРОЕЖА, огледалото.
//
// „Нищо не се въвежда… До всяка стойност — източникът и кой я е потвърдил.
//  Разминаванията излизат тук, червени.“ (ЗАДАНИЕ.md)
//
// Затова пробата гледа три неща освен рисуването:
//   · НЕ показва стойност, която не е сверена — предложеното не е знание;
//   · показва откъде е и КОЙ я е потвърдил;
//   · хваща трите разминавания: паспорт ↔ проект, част ↔ част, постигнато ↔
//     допустимо. И че в екрана няма нито едно поле за въвеждане.
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

const KOGA = '2026-10-15T09:00:00.000Z';
const sveren = (v, chast, koy) => ({
    sastoyanie: 'potvardeno', stoynost: v, prochetena: v, koy: koy || 'Ст. Цонева',
    koga: KOGA, iztochnik: { chast: chast || 'Архитектура', stranica: 4, citat: '' },
});

const OBEKT = {
    id: 'hus', pi: '68134.1006.2440', nik: 'ХЪС',
    stroej: 'Жилищна сграда с подземни гаражи',
    fakti: {
        obekt: sveren('Жилищна сграда с подземни гаражи', 'челен лист'),
        vid: sveren('сграда', 'Архитектура'),
        kategoria: sveren('четвърта', 'разрешение за строеж'),
        etaji: sveren('6', 'Архитектура'),
        visochina: sveren('14,80 м', 'Архитектура'),
        kota_cokul: sveren('690,00', 'Архитектура'),
        sobstvenik: sveren('Иван Петров · Мария Петрова', 'челен лист на проекта'),
        identifikator: sveren('68134.1006.2440', 'Геодезия'),
        // постигнатото е НАД допустимото — разминаване №3
        plytnost_dop: sveren('60 %', 'виза за проектиране'),
        plytnost_post: sveren('63,4 %', 'Архитектура'),
        // озеленяването е ПОД допустимото — пак разминаване
        ozelen_dop: sveren('40 %', 'виза за проектиране'),
        ozelen_post: sveren('38,5 %', 'Архитектура'),
        // частите не се връзват — разминаване №2
        kota_izkop: { sastoyanie: 'sporno', stoynost: '', varianti: [
            { stoynost: '-3,20', chasti: ['Архитектура'] },
            { stoynost: '-3,50', chasti: ['Конструкции'] }] },
        // четено, но не сверено — НЕ е знание
        reper_nomer: { sastoyanie: 'predlozheno', stoynost: '№ 1241',
                       prochetena: '№ 1241', iztochnik: { chast: 'Геодезия', stranica: 2 } },
        // ново четене дава друго, отколкото е било сверено — разминаване №4
        rzp: { sastoyanie: 'predlozheno', stoynost: '2 410 кв. м', prochetena: '2 410 кв. м',
               predishna: '2 380 кв. м', iztochnik: { chast: 'Архитектура' } },
    },
    // паспортът спори с проекта — разминаване №1
    razminavania: {
        prednaznachenie: { pole: 'prednaznachenie', ot_proekt: 'жилищно',
                           v_pasporta: 'смесено', koga: KOGA },
    },
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
            w.fetch = async () => ({ ok: true, status: 200, json: async () => ({ stoynost: null }) });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 150));
    return { w, d: w.document, greshki };
}

(async () => {

const a = await otvori('#/znaem/hus/0');
t('Екран 7 се рисува без грешка в конзолата', a.greshki.length === 0, a.greshki);
t('от огледалото се връщаш в ОБЕКТА',
  a.d.getElementById('shapka-nazad').getAttribute('href') === '#/obekt/hus/0');
t('другите екрани са скрити', a.d.getElementById('ekran-obekt').hidden
  && !a.d.getElementById('ekran-znaem').hidden);

const telo = () => tekst(a.d.getElementById('znaem-telo'));

// ── ТОЗИ ЕКРАН НЕ ВЪВЕЖДА ───────────────────────────────────────────────────
const telo_el = a.d.getElementById('znaem-telo');
t('няма нито едно поле за въвеждане',
  !telo_el.querySelector('input, textarea, select'));
t('няма нито един чек',
  !telo_el.querySelector('input[type="checkbox"]'));
t('казва къде се поправя', /се поправя там, където се чете/i.test(telo()));
t('и дава пътя дотам',
  !!telo_el.querySelector('a[href="#/proekt/hus/0"]'));

// ── броевете в главата ──────────────────────────────────────────────────────
t('главата брои сверените', /12 сверени/.test(telo()), telo().slice(0, 220));
t('и колко чакат ✔', /2 чакат ✔/.test(telo()), telo().slice(0, 220));
t('и колко са спорни', /1 спорни/.test(telo()), telo().slice(0, 220));
t('и казва от колко признака', /от \d+ признака за този строеж/.test(telo()));

// ── РАЗМИНАВАНИЯТА, червените ───────────────────────────────────────────────
const razm = a.d.getElementById('znaem-razminavania');
t('разделът за разминавания съществува', !!razm);
t('и е червен', razm.classList.contains('razdel-cherveno'));
const edno = [...a.d.querySelectorAll('.razminavane')];
t('петте разминавания излизат', edno.length === 5, edno.map(x => tekst(x)));

const vsichkiRazm = tekst(razm);
t('паспортът ↔ проектът излиза',
  /Предназначение/.test(vsichkiRazm) && /по проект жилищно/.test(vsichkiRazm)
  && /в паспорта смесено/.test(vsichkiRazm), vsichkiRazm);
t('и казва, че не подменя въведеното',
  /НЕ подменя въведеното на ръка/.test(vsichkiRazm));
t('част ↔ част излиза с двете части и двете стойности',
  /Архитектура -3,20/.test(vsichkiRazm) && /Конструкции -3,50/.test(vsichkiRazm),
  vsichkiRazm);
t('постигнатото НАД допустимото излиза',
  /Плътност — постигната/.test(vsichkiRazm)
  && /допустимо 60 %/.test(vsichkiRazm) && /постигнато 63,4 %/.test(vsichkiRazm)
  && /над допустимото/.test(vsichkiRazm), vsichkiRazm);
t('озеленяването ПОД допустимото също излиза',
  /Озеленяване — постигнато/.test(vsichkiRazm) && /под допустимото/.test(vsichkiRazm),
  vsichkiRazm);
t('ново четене срещу свереното излиза',
  /беше сверено 2 380/.test(vsichkiRazm) && /новото четене дава 2 410/.test(vsichkiRazm),
  vsichkiRazm);
t('разминаванията се броят в заглавието', /Разминавания · 5/.test(vsichkiRazm));

// ── стойностите, с откъде и от кого ─────────────────────────────────────────
a.w.znaemRazgani('obem');
const obem = tekst(a.d.getElementById('znaem-obem'));
t('групата се разгъва', /Етажи/.test(obem), obem.slice(0, 200));
t('сверената стойност се вижда', /Етажи 6/.test(obem), obem);
t('казва ОТКЪДЕ е', /Архитектура, стр\. 4/.test(obem), obem);
t('казва КОЙ я е потвърдил', /сверено от Ст\. Цонева/.test(obem), obem);
t('и КОГА', /15\.10\.2026/.test(obem), obem);
t('групата брои своите', /2 от \d+/.test(obem) || /\d+ от \d+/.test(obem), obem);

// Предложеното НЕ е знание.
a.w.znaemRazgani('koti');
const koti = tekst(a.d.getElementById('znaem-koti'));
t('четеното, но несверено НЕ показва стойност',
  !/№ 1241/.test(koti), koti);
t('а казва, че чака', /четено, но още не е сверено/.test(koti), koti);
t('и че никой не го е сверил', /никой не го е сверил още/.test(koti), koti);
t('спорното казва, че частите спорят',
  /частите казват различно/.test(koti), koti);
t('празното го казва честно', /нищо не знаем/.test(koti), koti);

// Какво ДОКАЗВА полето — опората на кухнята.
a.w.znaemRazgani('koi');
const koi = tekst(a.d.getElementById('znaem-koi'));
t('собственикът казва с какво се доказва',
  /Доказва се с нотариален акт/.test(koi), koi);
a.w.znaemRazgani('kade');
const kade = tekst(a.d.getElementById('znaem-kade'));
t('идентификаторът казва, че се пише на ръка',
  /пише се на ръка/.test(kade), kade);
t('и защо', /Сбъркана цифра сочи чужд имот/.test(kade), kade);

// ── приложимост: непитаните не са празни ────────────────────────────────────
const LINEEN = JSON.parse(JSON.stringify(OBEKT));
LINEEN.stroej = 'Външно кабелно захранване с кабели СрН';
LINEEN.fakti.vid = sveren('линеен обект', 'Архитектура');
const b = await otvori('#/znaem/hus/0', LINEEN);
t('линейният обект се рисува без грешка', b.greshki.length === 0, b.greshki);
b.w.znaemRazgani('instalacii');
const inst = b.d.getElementById('znaem-instalacii');
t('при линеен обект асансьорът НЕ се пита',
  !inst || !/Асансьор/.test(tekst(inst).split('не се питат')[0]), tekst(inst || {}));
t('и го казва с думи, вместо да го скрие',
  !inst || /не се питат за този строеж/.test(tekst(inst)), tekst(inst || {}));
t('и обяснява защо', !inst || /неприложими/.test(tekst(inst)), tekst(inst || {}));

// ── влизането от число ──────────────────────────────────────────────────────
const c = await otvori('#/znaem/hus/0/redove');
t('адресът с група се отваря без грешка', c.greshki.length === 0, c.greshki);
const redove = c.d.getElementById('znaem-redove');
t('групата от числото е подчертана',
  redove.classList.contains('razdel-podchertan'));
t('и е разгъната',
  /Процентите не броят признаци/.test(tekst(redove)), tekst(redove).slice(0, 200));
t('показва съставките на строежа',
  !!redove.querySelector('.krugche'), tekst(redove));
t('и откъде е всяка', /заглавието|записките|вписана на ръка/.test(tekst(redove)),
  tekst(redove));
t('показва четирите, които стесняват чеклиста',
  /Вид/.test(tekst(redove)) && /Категория/.test(tekst(redove))
  && /Повод/.test(tekst(redove)), tekst(redove));
t('празният повод го казва честно',
  /празно — затова чеклистът не стеснява/.test(tekst(redove)), tekst(redove));

// ── връзките навън и навътре ────────────────────────────────────────────────
const o = await otvori('#/obekt/hus/0');
const vrazki = [...o.d.querySelectorAll('.vrazka')];
t('Екран 2 вече има ЧЕТИРИ връзки', vrazki.length === 4, vrazki.map(x => tekst(x)));
t('четвъртата е огледалото',
  vrazki[3].getAttribute('href') === '#/znaem/hus/0', vrazki[3].getAttribute('href'));
t('и не отпраща към старото ПВА',
  !vrazki.some(x => /index\.html/.test(x.getAttribute('href') || '')),
  vrazki.map(x => x.getAttribute('href')));

// ── пълнота: нито един признак не може да изчезне ───────────────────────────
const vzeti = a.w.znaemGrupi().flatMap(g => g[2]);
t('групите не повтарят ключ', new Set(vzeti).size === vzeti.length,
  vzeti.filter((x, i) => vzeti.indexOf(x) !== i));
const vsichki = a.w.znaemPoleta().map(x => x[0]);
const izvan = vsichki.filter(k => !vzeti.includes(k));
t('каквото не е подредено, пада в „Друго“',
  JSON.stringify(a.w.znaemOstanali().sort()) === JSON.stringify(izvan.sort()),
  { izvan, drugo: a.w.znaemOstanali() });
t('нито един ключ на групите не е измислен',
  vzeti.every(k => vsichki.includes(k)), vzeti.filter(k => !vsichki.includes(k)));

// ── празен обект ────────────────────────────────────────────────────────────
const e = await otvori('#/znaem/hus/0', { id: 'hus', pi: '1', stroej: 'Проба' });
t('празно огледало не гърми', e.greshki.length === 0, e.greshki);
t('и казва, че разминавания няма',
  /Няма\. Нито паспортът спори/.test(tekst(e.d.getElementById('znaem-telo'))),
  tekst(e.d.getElementById('znaem-telo')).slice(0, 300));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — огледалото не лъже`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
