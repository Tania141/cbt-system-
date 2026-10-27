// Екран 1 и Екран 2 от новото ПВА, отворени в браузър без екран.
//
// Проверява се онова, което операторът иска да ВИДИ: един ред на строеж с
// двете числа, клик → обектът, главата в три реда, съставките като кръгчета с
// „откъде е“, лентата на моментите с цветове, трите връзки долу, и — най-
// важното — че всяко число се отваря и казва кое липсва.
//
// Старото ПВА не се пипа: същата проба проверява и че akt/ не включва нищо от
// старите екрани освен прочетената кухня.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const KOREN = path.join(__dirname, '..');
const PAPKA = path.join(KOREN, 'akt');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const tekst = el => ((el && el.textContent) || "").replace(/s+/g, " ").trim();

// Страницата с вградени скриптове — jsdom не сваля файлове и не бива.
function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    const izvori = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
    for (const src of izvori) {
        const telo = fs.readFileSync(path.resolve(PAPKA, src), 'utf8');
        html = html.replace(`<script src="${src}"></script>`, () => '<script>' + telo + '</script>');
    }
    if (/<script src=/.test(html)) throw new Error('не всички скриптове бяха вкарани');
    return html;
}

// ── какво сървърът отговаря ──────────────────────────────────────────────────

const NADZOR = {
    red: ['Протокол 2', 'Акт 14', 'Акт 15'],
    grupi: [
        { moment: 'Протокол 2', gotovi: 2, lipsvat: 0, dokumenti: [
            { dokument: 'Разрешение за строеж', sastoyanie: 'налично', etap: 'начало' },
            { dokument: 'Договор за СМР', sastoyanie: 'налично', etap: 'подпис' },
        ] },
        { moment: 'Акт 14', gotovi: 1, lipsvat: 2, dokumenti: [
            { dokument: 'Протокол обр. 2', sastoyanie: 'налично', etap: 'начало' },
            { dokument: 'Бетонов дневник', sastoyanie: 'очаква се', etap: 'начало' },
            { dokument: 'Декларации за бетон', sastoyanie: 'очаква се', etap: 'подпис' },
        ] },
        { moment: 'Акт 15', gotovi: 0, lipsvat: 1, dokumenti: [
            { dokument: 'Акт обр. 14', sastoyanie: 'не му е времето', etap: 'начало' },
        ] },
    ],
};

const OBEKT = {
    id: 'hus', pi: '68134.1006.2440', nik: 'ХЪС', address: 'София',
    stroej: 'Външно електрозахранване с кабели СрН, НН и шахтов ТП',
    clients: [{ name: '„ХЪС Инвест София“ ЕООД' }],
    permit: { number: 'Б-228', date: '2026-07-23' },
    consultant: { name: 'СиБиТи Консулт ЕООД' },
    tekusht_moment: 'Акт 14',
    updatedAt: '2026-10-19T08:00:00Z',
    dve_chisla: { moment: 'Акт 14', nachalo: 50, podpis: 33 },
    stroezhi_dop: [{ stroej: 'Канал', tekusht_moment: 'Протокол 2' }],
};
const STAR = {
    id: 'star', pi: '11111.2.3', nik: 'Петракиев', stroej: 'Жилищна сграда',
    tekusht_moment: 'Акт 16', arhiviran: true, updatedAt: '2026-09-01T08:00:00Z',
};

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
                projects: [OBEKT, STAR], consultants: [], history: [],
                apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async () => ({ ok: true, status: 200, json: async () => NADZOR });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 200));
    return { w, d: w.document, greshki };
}

(async () => {

// ── ЕКРАН 1 ──────────────────────────────────────────────────────────────────

const a = await otvori('#/plot');
t('Екран 1 се рисува без грешка в конзолата', a.greshki.length === 0, a.greshki);
t('заглавието е АКТ СИСТЕМ', a.d.title === 'АКТ СИСТЕМ', a.d.title);
t('горе има търсене', !!a.d.getElementById('plot-tarsene'));
t('горе има „+ нов обект“', /\+ нов обект/.test(tekst(a.d.querySelector('.shapka'))));

let redove = [...a.d.querySelectorAll('#plot-spisak .red')];
t('показват се само работещите строежи — два', redove.length === 2, redove.length);
t('архивираният не е на плота',
  !tekst(a.d.getElementById('plot-spisak')).includes('Жилищна сграда'));
t('редът показва името на строежа',
  tekst(redove[0]).includes('Външно електрозахранване'), tekst(redove[0]));
t('редът показва ПИ', tekst(redove[0]).includes('68134.1006.2440'));
t('редът казва кой момент е на огъня',
  tekst(redove[0].querySelector('.na-ognya')) === 'Акт 14');
t('редът показва двете числа',
  tekst(redove[0].querySelector('.red-chisla')).includes('50 %')
  && tekst(redove[0].querySelector('.red-chisla')).includes('33 %'),
  tekst(redove[0].querySelector('.red-chisla')));
t('двете числа са назовани',
  /да започна/.test(tekst(redove[0])) && /да подпиша/.test(tekst(redove[0])));
t('редът казва кога е пипан', /19\.10\.2026/.test(tekst(redove[0].querySelector('.red-koga'))),
  tekst(redove[0].querySelector('.red-koga')));
t('необоеният строеж показва тире, не 0 %',
  tekst(redove[1].querySelector('.red-chisla')).includes('—'),
  tekst(redove[1].querySelector('.red-chisla')));
t('числото е бутон — отваря се',
  redove[0].querySelectorAll('button.chislo').length === 2);

// търсене
a.w.plotTarsi('канал');
redove = [...a.d.querySelectorAll('#plot-spisak .red')];
t('търсене по име на строеж оставя само него',
  redove.length === 1 && tekst(redove[0]).includes('Канал'), redove.length);
a.w.plotTarsi('68134');
t('търсене по ПИ показва всички строежи в имота',
  a.d.querySelectorAll('#plot-spisak .red').length === 2);
a.w.plotTarsi('няма такова');
t('нищо намерено казва го с думи',
  /Нищо не отговаря/.test(tekst(a.d.getElementById('plot-spisak'))));
a.w.plotTarsi('');

// архивът
a.w.plotSmeniIzgled('arhiv');
t('архивът е отделен изглед и показва архивираното',
  tekst(a.d.getElementById('plot-spisak')).includes('Жилищна сграда'));
t('в архива не са работещите',
  !tekst(a.d.getElementById('plot-spisak')).includes('Външно електрозахранване'));
a.w.plotSmeniIzgled('raboti');

// клик → Екран 2
a.w.plotOtvoriObekt('hus', 0);
t('клик на ред води на Екран 2', /#\/obekt\/hus\/0$/.test(a.w.location.hash), a.w.location.hash);

// ── ЕКРАН 2 ──────────────────────────────────────────────────────────────────

const b = await otvori('#/obekt/hus/0');
t('Екран 2 се рисува без грешка в конзолата', b.greshki.length === 0, b.greshki);
t('Екран 1 е скрит', b.d.getElementById('ekran-plot').hidden);
t('търсенето и изгледите не стоят на Екран 2', b.d.getElementById('shapka-plot').hidden);
t('от Екран 2 има обратен път към плота',
  !b.d.getElementById('shapka-nazad').hidden
  && b.d.getElementById('shapka-nazad').getAttribute('href') === '#/plot');

// главата
const glava = [...b.d.querySelectorAll('.glava-red')];
t('главата е три реда текст, не формуляр', glava.length === 3, glava.length);
t('в главата няма полета за въвеждане',
  b.d.querySelectorAll('.glava input, .glava select').length === 0);
t('първи ред: ПИ и строежът', tekst(glava[0]).includes('68134.1006.2440')
  && tekst(glava[0]).includes('шахтов ТП'), tekst(glava[0]));
t('втори ред: възложител и РС', tekst(glava[1]).includes('ХЪС Инвест')
  && tekst(glava[1]).includes('Б-228'), tekst(glava[1]));
t('трети ред: консултантът', tekst(glava[2]).includes('СиБиТи Консулт'));
t('редът на главата се отваря за поправка с клик',
  glava.every(x => /obektPopravi/.test(x.getAttribute('onclick') || '')));
t('възложителят казва откъде е', /регистъра/.test(tekst(glava[1])), tekst(glava[1]));

// съставките
const krugcheta = [...b.d.querySelectorAll('.krugcheta .krugche:not(.krugche-plyus)')];
// Колко са, решава кухнята. Тук се проверява, че ПОВЪРХНОСТТА ги показва както
// ги е прочела — не колко добре чете. (При това заглавие кухнята вижда две:
// „кабели СрН, НН“ не ѝ дава НН. Това е дефект на разпознаването, не на екрана,
// и се поправя там, където живее.)
t('съставките се четат от кухнята — има кръгчета', krugcheta.length >= 2, krugcheta.length);
const imenaS = krugcheta.map(x => tekst(x));
t('кабел СрН е разпознат', imenaS.some(x => /Кабел СрН/.test(x)), imenaS);
t('шахтовият трафопост е разпознат', imenaS.some(x => /[Шш]ахтов/.test(x)), imenaS);
t('всяка съставка казва откъде е',
  krugcheta.every(x => tekst(x.querySelector('.krugche-ot'))), imenaS);
t('откъде е = заглавието', imenaS.every(x => /заглавието/.test(x)), imenaS);
t('всяка съставка има ×', krugcheta.every(x => x.querySelector('.krugche-h')));
t('има и +', !!b.d.querySelector('.krugche-plyus'));

// махане и добавяне
const kolko = krugcheta.length;
b.w.obektMahniSastavka('kabel_srn');
await new Promise(r => setTimeout(r, 150));
t('× маха съставката',
  b.d.querySelectorAll('.krugcheta .krugche:not(.krugche-plyus)').length === kolko - 1,
  kolko);
t('махнатата съставка се помни при строежа',
  (JSON.parse(b.w.localStorage.getItem('akt_v5')).projects[0].sastavki.mahnati || [])
    .includes('kabel_srn'));

// превключвателят при няколко строежа
t('при два строежа има превключвател', !!b.d.querySelector('.prevkl'));
t('превключвателят изброява и двата',
  /Канал/.test(tekst(b.d.querySelector('.prevkl'))), tekst(b.d.querySelector('.prevkl')));

// лентата на моментите
const plochki = [...b.d.querySelectorAll('.plochka')];
t('лентата на моментите има плочка за всеки момент', plochki.length === 3, plochki.length);
t('всяка плочка носи двете числа',
  plochki.every(x => x.querySelectorAll('button.chislo').length === 2));
t('текущият момент се вижда като текущ',
  plochki.some(x => x.classList.contains('plochka-tekushta')
                 && tekst(x).includes('Акт 14')));
const cvetove = plochki.map(x => [...x.classList].find(c => /^plochka-(sivo|zhalto|zeleno)$/.test(c)));
t('готовият момент е зелен', cvetove[0] === 'plochka-zeleno', cvetove);
t('текущият е жълт', cvetove[1] === 'plochka-zhalto', cvetove);
t('онзи, на който не му е времето, е сив', cvetove[2] === 'plochka-sivo', cvetove);
t('Акт 14: „да започна“ 50 %', /50 %/.test(tekst(plochki[1])), tekst(plochki[1]));

// правило 2: числото се отваря и показва кое липсва
b.w.obektKoeLipsva('Акт 14', 'nachalo');
t('числото се отваря', b.d.getElementById('obekt-kutiya').classList.contains('otvorena'));
let kutiya = tekst(b.d.getElementById('obekt-kutiya-telo'));
t('кутията казва колко от колко', /имам 1 от 2/.test(kutiya), kutiya);
t('кутията изброява липсващото', /Бетонов дневник/.test(kutiya), kutiya);
t('кутията НЕ показва наличното като липсващо',
  !/Протокол обр\. 2/.test(kutiya.split('Липсват')[1] || ''), kutiya);
t('до липсващия ред има „не се отнася“', /не се отнася/.test(kutiya), kutiya);

// правило 4: „не се отнася“ вдига процента
b.w.obektNeSeOtnasya('Бетонов дневник');
await new Promise(r => setTimeout(r, 120));
const akt14 = [...b.d.querySelectorAll('.plochka')].find(x => tekst(x).includes('Акт 14'));
t('„не се отнася“ ВДИГА числото до 100 %', /100 %/.test(tekst(akt14)), tekst(akt14));
t('махнатото се помни при строежа',
  (JSON.parse(b.w.localStorage.getItem('akt_v5')).projects[0].neotnasya || [])
    .includes('Бетонов дневник'));
b.w.obektKoeLipsva('Акт 14', 'nachalo');
t('махнатият ред се вижда и се връща',
  /не се отнасят/.test(tekst(b.d.getElementById('obekt-kutiya-telo'))));

// обектът се носи към старото ПВА
t('отвореният обект се помни като текущ — старото ПВА чете точно това',
  JSON.parse(b.w.localStorage.getItem('akt_v5')).currentProject.id === 'hus',
  (JSON.parse(b.w.localStorage.getItem('akt_v5')).currentProject || {}).id);

// трите връзки
const vrazki = [...b.d.querySelectorAll('.vrazka')].map(x => tekst(x));
t('долу има точно три връзки', vrazki.length === 3, vrazki);
t('връзките са Проектът · Собственост · Досието',
  /Проектът/.test(vrazki[0]) && /Собственост/.test(vrazki[1]) && /Досието/.test(vrazki[2]), vrazki);
// Проектът и Собствеността вече са ВЪТРЕ в новото; навън води само Досието.
const vsichki = [...b.d.querySelectorAll('.vrazka')];

t('Проектът води вътре, на Екран 4',
  vsichki[0].getAttribute('href') === '#/proekt/hus/0'
  && vsichki[0].getAttribute('target') === null,
  vsichki[0].getAttribute('href'));
t('Собствеността води вътре, на Екран 5',
  vsichki[1].getAttribute('href') === '#/sobstvenost/hus/0'
  && vsichki[1].getAttribute('target') === null,
  vsichki[1].getAttribute('href'));
t('собствеността виси на ИМОТА, не на строежа',
  /68134\.1006\.2440/.test(vrazki[1]), vrazki[1]);
t('Досието още казва честно, че води в старото ПВА',
  /в старото ПВА/.test(vrazki[2]), vrazki[2]);
t('и се отваря в нов подпрозорец',
  vsichki[2].getAttribute('target') === '_blank');

// ── границата със старото ПВА ────────────────────────────────────────────────

const html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
const vklyucheni = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
t('новата повърхност включва само своите файлове и прочетената кухня',
  vklyucheni.every(s => /^(yadro|most|plot|obekt|moment|proekt|sobstvenost)\.js$/.test(s) || ['../js/05-proverki.js', '../js/01-osnova.js', '../js/07-sobstvenost.js'].includes(s)),
  vklyucheni);
t('всеки включен файл съществува',
  vklyucheni.every(s => fs.existsSync(path.resolve(PAPKA, s))), vklyucheni);
t('старият index.html е непокътнат — не включва нищо от akt/',
  !/akt\//.test(fs.readFileSync(path.join(KOREN, 'index.html'), 'utf8')));
t('новата повърхност живее САМО в своята папка',
  fs.readdirSync(PAPKA).every(f => /\.(html|css|js)$/.test(f)), fs.readdirSync(PAPKA));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — двата екрана стоят`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
