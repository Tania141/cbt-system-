// ЕКРАН 3 — моментът. Сърцето: 90 % от работата става тук.
//
// Проверява се онова, което операторът каза, че иска:
//   · двете везни и ЕДНО ИЗРЕЧЕНИЕ какво сега може;
//   · папката се ИЗБРОЯВА, без да се чете, и до всеки файл пише какво струва;
//   · „Липсва ми“ — ЕДИН ЖЕСТ затваря ЕДИН ред (качи · впиши · не се отнася);
//   · името на файла не е данна — само сива подсказка;
//   · бутонът „Съставѝ документа“ казва ЗАЩО, когато не може.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const Y = require('../akt/yadro.js');

const KOREN = path.join(__dirname, '..');
const PAPKA = path.join(KOREN, 'akt');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const tekst = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

// ── чистите правила ──────────────────────────────────────────────────────────

const red = (dokument, sastoyanie, etap) => ({ dokument, sastoyanie, etap });
const dve = (redove, neot) => Y.aktDveChisla({ moment: 'Акт 15', dokumenti: redove }, neot || []);

const VSICHKO = [red('А', 'налично', 'начало'), red('Б', 'налично', 'подпис')];
const ZAPOCHVA = [red('А', 'налично', 'начало'), red('Б', 'очаква се', 'подпис'),
                  red('В', 'очаква се', 'подпис')];
const NE = [red('А', 'очаква се', 'начало'), red('Б', 'очаква се', 'подпис')];

t('всичко налице → „може и да се подпише“',
  /подпише/.test(Y.aktKakvoMozhe(dve(VSICHKO))), Y.aktKakvoMozhe(dve(VSICHKO)));
t('началото е пълно → „Можеш да започнеш“',
  /^Можеш да започнеш/.test(Y.aktKakvoMozhe(dve(ZAPOCHVA))), Y.aktKakvoMozhe(dve(ZAPOCHVA)));
t('казва колко липсват за подписа',
  /липсват 2 неща/.test(Y.aktKakvoMozhe(dve(ZAPOCHVA))), Y.aktKakvoMozhe(dve(ZAPOCHVA)));
t('едно липсващо е в единствено число',
  /липсва 1 нещо/.test(Y.aktKakvoMozhe(dve([red('А', 'налично', 'начало'), red('Б', 'очаква се', 'подпис')]))),
  Y.aktKakvoMozhe(dve([red('А', 'налично', 'начало'), red('Б', 'очаква се', 'подпис')])));
t('началото не е пълно → казва и за началото',
  /да започнеш/.test(Y.aktKakvoMozhe(dve(NE))), Y.aktKakvoMozhe(dve(NE)));
t('моментът без чеклист си остава шаблон',
  /шаблон/.test(Y.aktKakvoMozhe(dve([]))), Y.aktKakvoMozhe(dve([])));
t('небројаният момент не лъже', /не е броено/.test(Y.aktKakvoMozhe(null)));

// правилото на момента
let pr = Y.aktPraviloNaMomenta(dve(NE));
t('липсва за началото → бутонът НЕ може', pr.mozhe === false, pr);
t('и казва защо', /да се започне/.test(pr.zashto), pr.zashto);
t('едно липсващо не се пише „Липсват 1 неща“',
  Y.aktPraviloNaMomenta(dve([red('А', 'очаква се', 'начало')])).zashto
    === 'Липсва 1 нещо, за да се започне.',
  Y.aktPraviloNaMomenta(dve([red('А', 'очаква се', 'начало')])).zashto);
t('две липсващи са в множествено число',
  /Липсват 2 неща/.test(Y.aktPraviloNaMomenta(
    dve([red('А', 'очаква се', 'начало'), red('Б', 'очаква се', 'начало')])).zashto));
pr = Y.aktPraviloNaMomenta(dve(ZAPOCHVA));
t('липсва само за подписа → МОЖЕ, решението е на оператора', pr.mozhe === true, pr);
t('но пише, че ще излязат на точки', /на точки/.test(pr.zashto), pr.zashto);
pr = Y.aktPraviloNaMomenta(dve(VSICHKO));
t('всичко налице → може, без забележки', pr.mozhe && /налице/.test(pr.zashto), pr);
t('шаблонът винаги може', Y.aktPraviloNaMomenta(dve([])).mozhe);

// цената на файла — познава се по разширението, без да се чете
t('.docx е безплатно', Y.aktCenaNaFajl('02_Zapiska_ShTP.docx').cena === 'безплатно');
t('.pdf минава през АИ', Y.aktCenaNaFajl('Становище ПБЗН.pdf').cena === 'през АИ');
t('и казва защо', /скан/.test(Y.aktCenaNaFajl('НА_ЕРМ.pdf').kak));
t('снимката минава през АИ', Y.aktCenaNaFajl('IMG_2201.JPG').cena === 'през АИ');
t('старият .doc не се чете', Y.aktCenaNaFajl('akt.doc').cena === 'не се чете');
t('и казва какво да се направи', /docx/.test(Y.aktCenaNaFajl('akt.doc').kak));
t('непознатият вид не се чете', Y.aktCenaNaFajl('dwg.dwg').cena === 'не се чете');
t('без име не гърми', !!Y.aktCenaNaFajl(null).cena);

// името на файла не е данна — само подсказка
t('подсказката маха разширението и долните черти',
  Y.aktPodskazkaOtIme('02_Zapiska_ShTP.docx') === '02 Zapiska ShTP',
  Y.aktPodskazkaOtIme('02_Zapiska_ShTP.docx'));

// остатъкът
t('остатъкът за ОД иска вх. номер',
  Y.aktOstatak('Окончателен доклад').some(x => x.klyuch === 'vh_nomer'));
t('непознатият момент пак иска изх. номер',
  Y.aktOstatak('Акт 9')[0].klyuch === 'izh_nomer');
// „Кратък списък“ значи толкова, колкото документът наистина иска. Акт 15 е
// най-дългият: освен изходящия номер, в тялото му стоят датата на съставяне и
// двата срока. Останалите моменти са с два-три реда.
t('остатъкът никъде не се разраства в анкета',
  Object.values(Y.AKT_OSTATAK).every(x => x.length <= 8),
  Object.entries(Y.AKT_OSTATAK).map(([k, v]) => k + ':' + v.length));
t('Акт 15 пита и за двата срока',
  Y.aktOstatak('Акт 15').some(x => x.klyuch === 'nedostatuci_srok')
  && Y.aktOstatak('Акт 15').some(x => x.klyuch === 'vremenno_srok'));

// ── екранът ──────────────────────────────────────────────────────────────────

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>'
            + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const NADZOR = { red: ['Протокол 2', 'Акт 15'], grupi: [
    { moment: 'Протокол 2', dokumenti: [red('Разрешение за строеж', 'налично', 'начало')] },
    { moment: 'Акт 15', dokumenti: [
        red('Разрешение за строеж', 'налично', 'начало'),
        red('Договор за СМР', 'очаква се', 'начало'),
        red('Протоколи от изпитвания', 'очаква се', 'подпис'),
        red('Акт обр. 16', 'не му е времето', 'подпис'),
    ] },
] };

const OBEKT = {
    id: 'hus', pi: '68134.1006.2440', nik: 'ХЪС',
    stroej: 'Външно електрозахранване с кабели СрН и шахтов ТП',
    tekusht_moment: 'Акт 15', updatedAt: '2026-10-19T08:00:00Z',
};

async function otvori(hash) {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/' + hash,
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [OBEKT], consultants: [], apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            // Сървърът пресмята състоянията от подаденото „налични“ — иначе
            // пробата би била по-глупава от истината и нищо нямаше да се мени.
            w.fetch = async (url, opt) => ({ ok: true, status: 200, json: async () => {
                if (/sloy2/.test(String(url)))
                    return { dokumenti: [{ vid: 'Договор за строителство',
                                           nomer: { stoynost: '12/2026' },
                                           data: { stoynost: '01.03.2026' } }] };
                const nalichni = JSON.parse((opt && opt.body) || '{}').nalichni || [];
                return { ...NADZOR, grupi: NADZOR.grupi.map(g => ({ ...g,
                    dokumenti: g.dokumenti.map(d => nalichni.includes(d.dokument)
                        ? { ...d, sastoyanie: 'налично' } : d) })) };
            } });
        },
    });
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => true;
    w.prompt = () => '№ 7 от 12.05.2026';
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 250));
    return { w, d: w.document, greshki };
}

(async () => {

const a = await otvori('#/moment/hus/0/' + encodeURIComponent('Акт 15'));
t('Екран 3 се рисува без грешка в конзолата', a.greshki.length === 0, a.greshki);
t('Екран 1 и Екран 2 са скрити',
  a.d.getElementById('ekran-plot').hidden && a.d.getElementById('ekran-obekt').hidden);
t('заглавието е самият момент',
  tekst(a.d.getElementById('moment-zaglavie')) === 'Акт 15');
t('от момента се връщаш в ОБЕКТА, не на плота',
  a.d.getElementById('shapka-nazad').getAttribute('href') === '#/obekt/hus/0',
  a.d.getElementById('shapka-nazad').getAttribute('href'));

// двете везни
const vezni = [...a.d.querySelectorAll('.vezna')];
t('горе има точно две везни', vezni.length === 2, vezni.length);
t('везните са назовани',
  /За да започна/.test(tekst(vezni[0])) && /За да подпиша/.test(tekst(vezni[1])));
t('„за да започна“ = 1 от 2 → 50 %',
  /50 %/.test(tekst(vezni[0])) && /имам 1 от 2/.test(tekst(vezni[0])), tekst(vezni[0]));
t('„за да подпиша“ = 1 от 4 → 25 %',
  /25 %/.test(tekst(vezni[1])), tekst(vezni[1]));
t('под везните стои ЕДНО изречение',
  /да започнеш/.test(tekst(a.d.querySelector('.kakvo-mozhe'))),
  tekst(a.d.querySelector('.kakvo-mozhe')));
t('везната се отваря — бутон е', vezni.every(v => v.tagName === 'BUTTON'));

a.w.momentKoeLipsva('nachalo');
t('везната отваря кои са', /Кои са/.test(tekst(a.d.getElementById('moment-kutiya-telo'))));
t('и казва кое го има и кое не',
  /Разрешение за строеж ✔/.test(tekst(a.d.getElementById('moment-kutiya-telo'))),
  tekst(a.d.getElementById('moment-kutiya-telo')));
a.w.momentZatvoriKutiya();

// „Липсва ми“
let redove = [...a.d.querySelectorAll('.lipsva-red')];
t('показва се само ЛИПСВАЩОТО', redove.length === 2, redove.map(x => tekst(x)));
t('„не му е времето“ не е в липсващото',
  !redove.some(x => /Акт обр\. 16/.test(tekst(x))), redove.map(x => tekst(x)));
t('но се брои отделно',
  /1 още — не им е времето/.test(tekst(a.d.querySelector('.kutiya-razdel'))
    || '') || /не им е времето/.test(tekst(a.d.getElementById('moment-telo'))));
t('всеки ред има точно ТРИ възможности',
  redove.every(x => x.querySelectorAll('.lipsva-zhestove .bt').length === 3),
  redove.map(x => x.querySelectorAll('.bt').length));
t('възможностите са качи · впиши · не се отнася',
  /качи/.test(tekst(redove[0])) && /впиши/.test(tekst(redove[0]))
  && /не се отнася/.test(tekst(redove[0])), tekst(redove[0]));

// ✍ впиши — ЕДИН жест затваря реда
a.w.momentVpishi(encodeURIComponent('Договор за СМР'));
await new Promise(r => setTimeout(r, 200));
redove = [...a.d.querySelectorAll('.lipsva-red')];
t('„впиши“ затваря реда с ЕДИН жест', redove.length === 1, redove.map(x => tekst(x)));
let zapis = JSON.parse(a.w.localStorage.getItem('akt_v5')).projects[0];
t('вписаното е отметнато в чеклиста',
  (zapis.nadzor_otmetnati || []).includes('Договор за СМР'), zapis.nadzor_otmetnati);
t('и е вписано в документите на строежа — без втори жест',
  (zapis.dokumenti || []).some(d => d.ime === 'Договор за СМР' && /12\.05\.2026/.test(d.nomer)),
  zapis.dokumenti);
t('вписаното казва, че е на ръка',
  (zapis.dokumenti || []).some(d => d.ot === 'вписан на ръка'), zapis.dokumenti);
t('везната се вдигна до 100 %',
  /100 %/.test(tekst(a.d.querySelector('.vezna'))), tekst(a.d.querySelector('.vezna')));

// „Имам“ — сгънато, с откъде е
const imam = a.d.querySelector('details.kutiya-razdel');
t('„Имам“ е сгънато', imam && !imam.open);
t('„Имам“ показва вписаното с номера му',
  /Договор за СМР/.test(tekst(imam)) && /12\.05\.2026/.test(tekst(imam)), tekst(imam));
t('всеки налице ред казва откъде е',
  [...imam.querySelectorAll('.lipsvat li .otkade')].every(x => tekst(x)), tekst(imam));

// — не се отнася
a.w.momentNeSeOtnasya(encodeURIComponent('Протоколи от изпитвания'));
await new Promise(r => setTimeout(r, 200));
t('„не се отнася“ маха последния ред',
  a.d.querySelectorAll('.lipsva-red').length === 0,
  [...a.d.querySelectorAll('.lipsva-red')].map(x => tekst(x)));
t('казва, че нищо не липсва — но честно, за онова, на което му е времето',
  /Нищо, на което му е времето\. 1 чака реда си\./.test(tekst(a.d.getElementById('moment-telo'))),
  tekst(a.d.getElementById('moment-telo')).slice(0, 300));
zapis = JSON.parse(a.w.localStorage.getItem('akt_v5')).projects[0];
t('„не се отнася“ се помни с дата',
  !!(zapis.neotnasya_koga || {})['Протоколи от изпитвания'], zapis.neotnasya_koga);
// Редът, на когото още не му е времето, СЕ БРОИ в подписа — затова 3 от 4,
// а не 100 %. Екранът не обещава повече, отколкото знае.
t('и вдига подписа — 3 от 4, защото Акт 16 още чака реда си',
  /75 %/.test(tekst([...a.d.querySelectorAll('.vezna')][1])),
  tekst([...a.d.querySelectorAll('.vezna')][1]));
t('махнатото се вижда в „Имам“ като „не се отнася“',
  /не се отнася/.test(tekst(a.d.querySelector('details.kutiya-razdel'))));

// бутонът „Съставѝ документа“
let bt = a.d.querySelector('.sastavi .bt');
t('всичко налице → бутонът е активен', !bt.disabled);
a.w.momentVarni(encodeURIComponent('Договор за СМР'));
await new Promise(r => setTimeout(r, 200));
bt = a.d.querySelector('.sastavi .bt');
t('върнатият ред пак липсва', a.d.querySelectorAll('.lipsva-red').length === 1);
t('липсва за началото → бутонът е спрян', bt.disabled === true);
t('и пише ЗАЩО, не мълчи',
  /да се започне/.test(tekst(a.d.querySelector('.zashto-ne'))),
  tekst(a.d.querySelector('.zashto-ne')));

// остатъкът
const ostatak = [...a.d.querySelectorAll('.ostatak-red')];
t('остатъкът е списък с по едно поле на ред', ostatak.length === 7, ostatak.length);
t('за Акт 15 иска рег. № на ПБЗН',
  ostatak.some(x => /ПБЗН/.test(tekst(x))), ostatak.map(x => tekst(x)));
t('празното поле показва [___]',
  ostatak[0].querySelector('input').getAttribute('placeholder') === '[___]');
a.w.momentZapishiOstatak('izh_nomer', '1288');
t('попълненото се пази при строежа',
  JSON.parse(a.w.localStorage.getItem('akt_v5')).projects[0].ostatak.izh_nomer === '1288');

// папката: изброява се, не се чете
t('папката се избира с бутон, не се хвърля',
  /избери папка/.test(tekst(a.d.getElementById('moment-telo'))));
a.w.momentIzbroi([
    { name: '02_Zapiska_ShTP.docx', type: '' },
    { name: 'Становище ПБЗН.pdf', type: 'application/pdf' },
    { name: 'star.doc', type: '' },
]);
const fajlove = [...a.d.querySelectorAll('.fajl')];
t('изброените файлове излизат с имената си', fajlove.length === 3, fajlove.length);
t('до .docx пише „безплатно“', /безплатно/.test(tekst(fajlove[0])), tekst(fajlove[0]));
t('до .pdf пише „през АИ“', /през АИ/.test(tekst(fajlove[1])), tekst(fajlove[1]));
t('нито един файл не е отметнат сам',
  fajlove.every(x => !x.querySelector('input').checked));
t('нечетимият файл не може да се отметне',
  fajlove[2].querySelector('input').disabled === true);
t('бутонът за четене е спрян, докато няма отметнато',
  [...a.d.querySelectorAll('.kutiya-razdel .bt')]
    .find(b => /прочети отметнатите/.test(tekst(b))).disabled === true);
a.w.momentOtmetni(0, true);
t('отметнатото се брои',
  /прочети отметнатите \(1\)/.test(tekst(a.d.getElementById('moment-telo'))));

// 📎 качи: показва какво е разбрал и чака ✔
const fajl = new a.w.File(['%PDF-1.4 проба'], 'dogovor.pdf', { type: 'application/pdf' });
await a.w.momentKachiFajl('Договор за СМР', fajl);
await new Promise(r => setTimeout(r, 200));
const hod = tekst(a.d.querySelector('.razbrano'));
t('прочетеното се ПОКАЗВА, преди да влезе', /Прочетох/.test(hod), hod);
t('показва номера и датата, които е разбрал',
  /12\/2026/.test(hod) && /01\.03\.2026/.test(hod), hod);
t('името на файла е само подсказка, не данна',
  /подсказка от името/.test(hod) && /не влиза никъде/.test(hod), hod);
t('затваря се с ЕДИН ✔', /✔ това е/.test(hod), hod);
zapis = JSON.parse(a.w.localStorage.getItem('akt_v5')).projects[0];
t('нищо не е влязло в чеклиста без ✔',
  !(zapis.nadzor_otmetnati || []).includes('Договор за СМР'), zapis.nadzor_otmetnati);
t('но прочетеното се пази при строежа',
  (((zapis.sloy2 || {}).od || {}).dokumenti || []).length === 1);

// нечетимият файл не тръгва да се качва
await a.w.momentKachiFajl('Договор за СМР',
    new a.w.File(['x'], 'staro.doc', { type: 'application/msword' }));
t('стар .doc не се праща на четеца',
  /не се чете/.test(tekst(a.d.querySelector('.lipsva-hod'))),
  tekst(a.d.querySelector('.lipsva-hod')));

// ── какво НЕ е на този екран ─────────────────────────────────────────────────

const telo = tekst(a.d.getElementById('moment-telo'));
t('признаци, съставки, записки и собственост ги няма тук',
  !/От какво е строежът/.test(telo) && !/записки/i.test(telo)
  && !/[Сс]обственост/.test(telo), telo.slice(0, 200));

// ── границата ────────────────────────────────────────────────────────────────

const html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
const vkl = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
t('Екран 3 е свой файл, включен от новата страница', vkl.includes('moment.js'), vkl);
t('всеки включен файл съществува',
  vkl.every(s => fs.existsSync(path.resolve(PAPKA, s))), vkl);
t('старият index.html пак е непокътнат',
  !/akt\//.test(fs.readFileSync(path.join(KOREN, 'index.html'), 'utf8')));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — моментът стои`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
