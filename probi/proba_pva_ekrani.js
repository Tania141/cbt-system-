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
                projects: [OBEKT, STAR], history: [],
                consultants: [{ id: 1, name: 'СиБиТи Консулт ЕООД', eik: '204024246',
                                type: 'ЮЛ', employees: [] }],
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

// ОБЪРНАТО 18.11.2026 — кройката в три колони. Главата отиде в дясната
// колона и там САМО се показва; поправката на място отпадна (операторът,
// 17.11.2026: „данните отдясно не се поправят там“ — поправя се в паспорта
// или в досието). Пазят се същите факти, но на новото място и без полета.
const dyasna = b.d.getElementById('dyasna');
const dT = tekst(dyasna);
t('обектът е вдясно: ПИ и строежът', dT.includes('68134.1006.2440') && dT.includes('шахтов ТП'), dT);
t('вдясно: възложител и РС', dT.includes('ХЪС Инвест') && dT.includes('Б-228'), dT);
t('вдясно: консултантът', dT.includes('СиБиТи Консулт'), dT);
// Обърната 18.11.2026: `clients` е старото поле на паспорта, писано на ръка —
// „собственост“ се казва само когато възложителят идва от регистъра.
t('възложителят казва откъде е — паспортът', /ХЪС Инвест.{0,40}паспорт/.test(dT), dT);
t('вдясно нищо не се поправя — няма полета', !dyasna.querySelector('input, textarea, select'));
t('главата с поправка я няма в средата', !b.d.querySelector('#obekt-telo .glava'));
t('вдясно долу — „Какво знаем · всичко“ към огледалото',
  !!dyasna.querySelector('a[href="#/znaem/hus/0"]'));

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

// ОБЪРНАТО 18.11.2026: осемте връзки долу станаха лента с изворите горе
// (Паспортът · Проектът · Собственост · Досието — всеки казва състоянието
// си), „Какво знаем“ отиде вдясно долу, а ОСИП, Заповедна книга и Проверки
// стоят тихо под моментите, докато станат моменти. Адресите са същите.
const izvori = [...b.d.querySelectorAll('.izvori .izvor')];
t('горе — лента с четирите извора', izvori.map(x => tekst(x.querySelector('.izvor-t'))).join('|')
  === 'Паспортът|Проектът|Собственост|Досието', izvori.map(x => tekst(x)));
t('изворите водят вътре, на своите екрани',
  izvori.map(x => x.getAttribute('href')).join('|')
  === '#/pasport/hus/0|#/proekt/hus/0|#/sobstvenost/hus/0|#/dosie/hus/0',
  izvori.map(x => x.getAttribute('href')));
t('всеки извор казва състоянието си', izvori.every(x => tekst(x.querySelector('.izvor-s'))),
  izvori.map(x => tekst(x)));
t('състоянието е с цвета на значението',
  izvori.every(x => /izvor-(gotovo|chaka|lipsva|sivo)/.test(x.className)), izvori.map(x => x.className));
t('паспортът брои невписаното, не измисля (няма категория и строител)',
  /2 полета не са вписани/.test(tekst(izvori[0])) && /izvor-lipsva/.test(izvori[0].className), tekst(izvori[0]));
t('досието без прочетено казва „още нищо прочетено“', /още нищо прочетено/.test(tekst(izvori[3])), tekst(izvori[3]));
const oshte = [...b.d.querySelectorAll('.obekt-oshte a')].map(x => x.getAttribute('href'));
t('под моментите — ОСИП, Заповедна книга, Проверки',
  oshte.join('|') === '#/osip/hus/0|#/zk/hus/0|#/proverki/hus/0', oshte);
t('и всички връзки са вътре в новото',
  [...izvori.map(x => x.getAttribute('href')), ...oshte].every(h => (h || '').startsWith('#/')));

// ── ЕКРАН 8: ДОКУМЕНТИТЕ ─────────────────────────────────────────────────────
// Първата стая, преместена от старото ПВА (04.11.2026). Дотук бутонът
// „Съставѝ документа“ просто изхвърляше оператора в другото приложение.
{
    const { d, greshki } = await otvori('#/dokumenti/hus/0/Акт%2014');
    t('екранът на документите се отваря без грешки', !greshki.length, greshki[0]);
    const telo = d.getElementById('dokumenti-telo');
    t('и се рисува', (telo.textContent || '').trim().length > 0);
    t('показва момента като заглавие', /Акт 14/.test(telo.textContent), tekst(telo).slice(0, 80));
    t('предлага документа на момента',
      [...telo.querySelectorAll('.dok-ime')].some(x => /Акт 14/.test(x.textContent)),
      [...telo.querySelectorAll('.dok-ime')].map(x => x.textContent));
    t('има бутон „Съставѝ“',
      [...telo.querySelectorAll('button')].some(b => /Съставѝ/.test(b.textContent)),
      [...telo.querySelectorAll('button')].map(b => b.textContent));
    t('и казва какво ще влезе, преди да се натисне',
      /Какво ще влезе/.test(telo.textContent) || /няма избран консултант/.test(telo.textContent),
      tekst(telo).slice(0, 120));
    t('и пита кой подписва долу',
      /Кой подписва долу/.test(telo.textContent), tekst(telo).slice(0, 200));
    t('а котите на Протокол 2 не се показват при чужд документ',
      !d.getElementById('p2-kota-izkop'), '');
    t('от документите се връщаш в ОБЕКТА, не на плота',
      d.getElementById('shapka-nazad').getAttribute('href') === '#/obekt/hus/0',
      d.getElementById('shapka-nazad').getAttribute('href'));
}

// ── ЕКРАН 9: ПАСПОРТЪТ ───────────────────────────────────────────────────────
// Втората преместена стая. Формата е СЪЩАТА — вика се `renderPassportForm` от
// кухнята, не се пише нова. Разрешението за строеж е пренесено отделно, защото
// в старото живее на друга страница.
{
    const { w, d, greshki } = await otvori("#/pasport/hus/0");
    t('паспортът се отваря без грешки', !greshki.length, greshki[0]);
    const telo = d.getElementById('pasport-telo');
    t('и се рисува', (telo.textContent || '').trim().length > 0);
    t('СЪЩАТА форма се рисува, не нова',
      !!d.getElementById('fp-pi') && !!d.getElementById('fp-stroej'),
      [...telo.querySelectorAll('input')].map(x => x.id).slice(0, 8));
    t('възложителите ги има', !!d.getElementById('clients-container'));
    t('упълномощеният представител вече има място', !!d.getElementById('fp-upalnomoshten'));
    for (const id of ['fp-permit-num', 'fp-permit-date', 'fp-permit-effective', 'fp-permit-issuer'])
        t(`разрешението за строеж: ${id}`, !!d.getElementById(id));
    t('и предупреждението за преписването е дошло с него',
      /сбъркана цифра не личи никъде/.test(telo.textContent));
    t('има бутон „Запази“',
      [...telo.querySelectorAll('button')].some(b => /Запази/.test(b.textContent)),
      [...telo.querySelectorAll('button')].map(b => b.textContent));
    t('от паспорта се връщаш в обекта',
      d.getElementById('shapka-nazad').getAttribute('href') === '#/obekt/hus/0');
    // Операторът, 04.11.2026: „в секция РС да се чете РС?“ — същият жест като
    // при договора за строителство.
    t('разрешението може и да се ПРОЧЕТЕ, не само да се препише',
      !!d.getElementById('pas-rs-fajl'), '');
    // Операторът, 04.11.2026: „ако има бутон към собствеността, няма смисъл от
    // други полета за възложител. Добре е бутонът да работи.“
    t('бутонът „Към Собственост“ работи — мостът превежда името в адрес',
      typeof w.navigateTo === 'function', typeof w.navigateTo);
    t('и води на екрана на собствеността',
      (() => { w.navigateTo('sobstvenost'); return /#\/sobstvenost\//.test(w.location.hash); })(),
      w.location.hash);
    t('непозната страница не чупи нищо',
      (() => { try { w.navigateTo('няма такава'); return true; } catch (e) { return false; } })());

    // Операторът, 04.11.2026: полетата по РС да се виждат само във фаза
    // „Строителство“ — преди разрешението те нямат какво да съдържат, а празно
    // поле изглежда като пропуск.
    const rsKarta = d.getElementById('fp-permit-num').closest('[data-faza]');
    t('картата с разрешението виси на фазата',
      !!rsKarta && rsKarta.dataset.faza === 'stroitelstvo',
      rsKarta && rsKarta.dataset.faza);
    w.setFaza('osip');
    t('в проектна фаза е скрита', rsKarta.style.display === 'none', rsKarta.style.display);
    w.setFaza('stroitelstvo');
    t('в строителство се показва', rsKarta.style.display !== 'none', rsKarta.style.display);
    t('а видът на преместената форма не е гол',
      /#pasport-telo[^{]*\.form-input/.test(fs.readFileSync(path.join(PAPKA, 'stil.css'), 'utf8')), '');
}

// ── НОВ ОБЕКТ СЕ ЗАВЕЖДА ТУК ─────────────────────────────────────────────────
// Дотук бутонът на плота просто те изпращаше в старото ПВА.
{
    const plot = fs.readFileSync(path.join(PAPKA, 'plot.js'), 'utf8');
    const nov = /function plotNovObekt\(\)[\s\S]*?\n}/.exec(plot)[0];
    t('„Нов обект“ НЕ праща в старото ПВА', !/index\.html/.test(nov), nov);
    t('а отваря паспорта за нов', /#\/pasport\/nov/.test(nov), nov);

    const { d, greshki } = await otvori('#/pasport/nov/0');
    t('паспортът за НОВ обект се отваря без грешки', !greshki.length, greshki[0]);
    t('и показва празна форма, не чужди данни',
      !!d.getElementById('fp-pi') && !d.getElementById('fp-pi').value,
      d.getElementById('fp-pi') && d.getElementById('fp-pi').value);
    t('и се представя като нов',
      /Нов обект/.test(d.getElementById('form-page-title').textContent),
      d.getElementById('form-page-title').textContent);
}

// ── границата със старото ПВА ────────────────────────────────────────────────

const html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
const vklyucheni = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
t('новата повърхност включва само своите файлове и прочетената кухня',
  vklyucheni.every(s => /^(yadro|most|plot|obekt|moment|proekt|sobstvenost|dosie|znaem|dokumenti|pasport|stai)\.js$/.test(s) || ['../js/05-proverki.js', '../js/01-osnova.js', '../js/04-vhodni-dokumenti.js',
     '../js/04b-spisak.js', '../js/04c-sabitia.js',
     '../js/03-obshti.js', '../js/10-obekti.js', '../js/08-momenti.js',
     '../js/09-akt15.js',
     '../js/11-dokumenti.js',
     '../js/11b-generirane.js',
     '../js/07-sobstvenost.js', '../js/12b-kandidati.js',
     '../js/12c-naucheno.js',
     // 17.11.2026 — кухнята на преместените стаи (регистър на ЗК, консултанти, история)
     '../js/02-zapovedni-knigi.js', '../js/12-konsultanti.js'].includes(s)),
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
