// ПОДОБНИ ОБЕКТИ — стъпка 4а (24.11.2026).
//
// `ДА ПРОЧЕТА/ЗАДАНИЕ-ПОДОБЕН-ОБЕКТ.md`: подаваш завършен Акт 15 и ОД, виждаш
// СПИСЪК — дословно, раздел, брой и период, в колко обекта, кой ред от чеклиста.
// Пробата пази и обратното: НИЩО в чеклиста не се мени, нищо не се чете без
// „да“, .doc и PDF казват защо не се четат.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak).slice(0, 300)));
const tx = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>' + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

// Какво връща сървърът за двата обекта — по образа на Денка и Петракиев.
const OTGOVOR = {
    'denka_akt15.docx': { fajl: 'denka_akt15.docx', vid: 'Акт 15', stroezh: 'Жилищна сграда — Овча купел', godina: 2025,
        chetec: 'кодът — .docx има текст, без АИ', redove: [
            { ime: 'Акт обр. 7', klyuch: 'акт обр. 7', razdel: '1.3. Актове и протоколи', broy: 24, ot: '24.05.2022', do: '29.12.2022',
              dosloven: ['Акт Образец 7 от 24.05.2022г. до 29.12.2022г — 24 броя;'], cheklist_red: 'Акт 7 и обр. 12 по част архитектура',
              cheklist_kak: 'системата — по номера на образеца' },
            { ime: 'Акт обр. 5', klyuch: 'акт обр. 5', razdel: '1.3. Актове и протоколи', broy: 1, ot: '15.03.2022', do: '',
              dosloven: ['Акт Образец 5 от 15.03.2022г'], cheklist_red: '', cheklist_kak: '' },
        ] },
    'denka_od.docx': { fajl: 'denka_od.docx', vid: 'Окончателен доклад', stroezh: 'Жилищна сграда — Овча купел', godina: 2025,
        chetec: 'кодът — .docx има текст, без АИ', redove: [
            { ime: 'Акт обр. 7', klyuch: 'акт обр. 7', razdel: 'По част Конструкции', broy: 24, ot: '24.05.2022', do: '29.12.2022',
              dosloven: ['Акт. Обр.7 за приемане на конструкцията — 24 бр.'], cheklist_red: '', cheklist_kak: '' },
            { ime: 'Протокол от изпитване на вода', klyuch: 'протокол от изпитване на вода', razdel: 'В.', broy: 1, ot: '', do: '',
              dosloven: ['Протокол от изпитване на вода'], cheklist_red: '', cheklist_kak: '' },
        ] },
    'petrakiev.docx': { fajl: 'petrakiev.docx', vid: 'Акт 15', stroezh: 'Жилищна сграда — Надежда', godina: 2016,
        chetec: 'кодът — .docx има текст, без АИ', redove: [
            { ime: 'Акт обр. 7', klyuch: 'акт обр. 7', razdel: '1.3.', broy: 28, ot: '29.03.2022', do: '29.01.2023',
              dosloven: ['Акт обр. 7 — 28 броя'], cheklist_red: 'Акт 7 и обр. 12 по част архитектура', cheklist_kak: 'системата — по номера на образеца' },
        ] },
};

// Сървърът — „базата“ на пробата. Един собствен ред вече има (от „Видени, но
// неописани“) — той не бива да изчезне при запис оттук.
const SARVAR = { cheklist_sobstveni: [{ dokument: 'Удостоверение за кадастъра', etap: 'подпис', uslovie: 'sast_ktp' }] };
const CHEKLIST = ['Разрешение за строеж', 'Акт 7 и обр. 12 по част архитектура', 'Заповедна книга на строежа'];

(async () => {
    const vc = new VirtualConsole(), greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const zaiavki = [];
    let pitano = null, otgovor = true;
    const OBEKT = { id: 'ob1', pi: '1.2.3', nik: 'Проба', nadzor_otmetnati: ['Разрешение за строеж'] };
    const dom = new JSDOM(stranica(), { runScripts: 'dangerously', url: 'http://localhost/akt/#/podobni',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OBEKT], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url, o) => {
                const telo = JSON.parse((o && o.body) || '{}');
                const u = String(url), metod = (o && o.method) || 'GET';
                let r = {};
                if (/\/api\/podoben\/chete/.test(u)) { zaiavki.push(telo.fajl.ime); r = { podoben: OTGOVOR[telo.fajl.ime] }; }
                else if (/\/api\/podoben\/redove/.test(u)) r = { redove: CHEKLIST.map(d => ({ dokument: d, otkade: 'чеклистът' })) };
                else if (/\/api\/danni\/(\w+)/.test(u)) {
                    const k = /\/api\/danni\/(\w+)/.exec(u)[1];
                    if (metod === 'POST') SARVAR[k] = JSON.parse(JSON.stringify(telo.stoynost));
                    r = { stoynost: SARVAR[k] === undefined ? null : JSON.parse(JSON.stringify(SARVAR[k])) };
                }
                return { ok: true, status: 200, json: async () => r, text: async () => '{}', headers: { get: () => 'application/json' } };
            };
        } });
    const w = dom.window, d = w.document;
    w.confirm = s => { pitano = s; return otgovor; };
    w.alert = () => {}; w.scrollTo = () => {};
    await new Promise(r => setTimeout(r, 300));
    const fajl = ime => new w.File(['x'], ime);

    // ── плочката и екранът ──────────────────────────────────────────────────
    const plochka = d.querySelector('#lyava [data-plochka="podobni"]');
    t('плочката „Подобни обекти“ е в лявата колона', !!plochka && /Подобни обекти/.test(tx(plochka)), tx(plochka));
    t('и стои до „Заповедни книги“', !!plochka && plochka.previousElementSibling
      && plochka.previousElementSibling.dataset.plochka === 'knigi');
    t('екранът се отваря и плочката свети', !d.getElementById('ekran-podobni').hidden && plochka.classList.contains('aktivna'));
    const telo = () => tx(d.getElementById('podobni-telo'));
    t('казва, че нищо не влиза в чеклиста само', /Нищо не влиза в чеклиста само/.test(telo()), telo());
    t('и честно — в „Липсва ми“ на Акт 15 още не излиза', /В „Липсва ми“ на Акт 15 още не излиза/.test(telo()), telo());
    t('и кой чете — кодът, без АИ', /с кода, без АИ/.test(telo()), telo());

    // ── без „да“ — нищо не се чете ──────────────────────────────────────────
    otgovor = false;
    await w.podobniKachi([fajl('denka_akt15.docx')], -1);
    t('преди четене пита — колко файла и кой чете', /1 файл/.test(pitano) && /без АИ/.test(pitano), pitano);
    t('„не“ → нищо не отива към сървъра', zaiavki.length === 0, zaiavki);
    otgovor = true;

    // ── .doc и PDF казват защо ──────────────────────────────────────────────
    pitano = null;
    await w.podobniKachi([fajl('star.doc'), fajl('skan.pdf')], -1);
    t('.doc и PDF не се пращат и не се пита', zaiavki.length === 0 && pitano === null, [zaiavki, pitano]);
    t('и казва защо', /стар \.doc, запиши го като \.docx/.test(telo()) && /само \.docx/.test(telo()), telo());

    // ── един обект: Акт 15 + ОД ─────────────────────────────────────────────
    await w.podobniKachi([fajl('denka_akt15.docx'), fajl('denka_od.docx')], -1);
    t('двата файла отиват за четене', zaiavki.join(',') === 'denka_akt15.docx,denka_od.docx', zaiavki);
    let zap = JSON.parse(w.localStorage.getItem('akt_v5'));
    t('записано в браузъра — един обект с два файла', zap.podobni.length === 1 && zap.podobni[0].fajlove.length === 2, zap.podobni);
    t('името на обекта е строежът от акта', zap.podobni[0].ime === 'Жилищна сграда — Овча купел', zap.podobni[0].ime);
    const redove = () => [...d.querySelectorAll('.podoben-red')];
    const redNa = ime => redove().find(r => tx(r.querySelector('.podoben-dok')) === ime);
    t('обр. 7 е ЕДИН ред, макар да е и в акта, и в ОД', redove().filter(r => /Акт обр\. 7/.test(tx(r.querySelector('.podoben-dok')))).length === 1,
      redove().map(tx));
    t('обр. 7 — раздел, брой и период', /в „1\.3\. Актове и протоколи“/.test(tx(redNa('Акт обр. 7')))
      && /24 бр\. · от 24\.05\.2022 до 29\.12\.2022/.test(tx(redNa('Акт обр. 7'))), tx(redNa('Акт обр. 7')));
    t('и дословно', /Акт Образец 7 от 24\.05\.2022г/.test(tx(redNa('Акт обр. 7'))), tx(redNa('Акт обр. 7')));
    t('и на кой ред от чеклиста отговаря — и кой го е вързал',
      /„Акт 7 и обр\. 12 по част архитектура“/.test(tx(redNa('Акт обр. 7'))) && /кодът, по номера/.test(tx(redNa('Акт обр. 7'))),
      tx(redNa('Акт обр. 7')));
    t('без ред — казва „няма ред“, не мълчи', /няма ред/.test(tx(redNa('Акт обр. 5'))), tx(redNa('Акт обр. 5')));
    t('редът само от ОД също е в списъка', !!redNa('Протокол от изпитване на вода'));
    t('при един обект подсказва да добавиш втори', /Добави втори/.test(telo()), telo());

    // ── втори обект: „в колко обекта“ и годината ────────────────────────────
    await w.podobniKachi([fajl('petrakiev.docx')], -1);
    t('вторият обект е отделен', JSON.parse(w.localStorage.getItem('akt_v5')).podobni.length === 2);
    t('обр. 7 — „2 от 2“', /2 от 2/.test(tx(redNa('Акт обр. 7'))), tx(redNa('Акт обр. 7')));
    t('обр. 5 — „1 от 2 — само при единия“', /1 от 2 — само при единия/.test(tx(redNa('Акт обр. 5'))), tx(redNa('Акт обр. 5')));
    t('каквото го има във всички е първо', tx(redove()[0].querySelector('.podoben-dok')) === 'Акт обр. 7', redove().map(tx));
    t('акт от 2016 — „не е годен за източник“', /по-стар от 2017, не е годен за източник/.test(telo()), telo());

    // ── същият файл пак — сменя стария, не се трупа ─────────────────────────
    await w.podobniKachi([fajl('petrakiev.docx')], 1);
    zap = JSON.parse(w.localStorage.getItem('akt_v5'));
    t('същият файл, качен пак към обекта, не се трупа', zap.podobni[1].fajlove.length === 1, zap.podobni[1].fajlove.map(f => f.fajl));

    // ── 4б: без вид не се пита ──────────────────────────────────────────────
    await w.podobniZarediOtgovori(); w.podobniRisuvai();
    t('без вид — няма бутони и казва защо', !d.querySelector('.podoben-zhestove')
      && /Кажи какъв вид е обектът/.test(telo()), telo());
    w.podobniSmeniVid(0, 'сграда'); w.podobniSmeniVid(1, 'сграда');
    t('видът е казан и записан', JSON.parse(w.localStorage.getItem('akt_v5')).podobni.every(o => o.vid === 'сграда'));
    t('списъкът е за вид „сграда“', /Списъкът за вид „сграда“/.test(telo()), telo());
    const zhest = ime => (redNa(ime) && redNa(ime).querySelector('.podoben-zhestove')) || null;
    const bt = (ime, re) => [...((zhest(ime) || {}).querySelectorAll ? zhest(ime).querySelectorAll('button') : [])].find(b => re.test(tx(b)));
    t('вързан от кода ред пита „✔ същото е като …“, не „изисквай“',
      !!bt('Акт обр. 7', /същото е като „Акт 7 и обр\. 12/) && !bt('Акт обр. 7', /изисквай/), tx(zhest('Акт обр. 7')));
    t('ред в 2 от 2 → „същото е“ е предложеното (тъмният бутон)',
      bt('Акт обр. 7', /същото е като/).classList.contains('bt-glaven'));
    t('ред без ред в чеклиста пита изисквай / същото като / не и за мен',
      !!bt('Акт обр. 5', /изисквай — за да подпиша/) && !!bt('Акт обр. 5', /същото като…/) && !!bt('Акт обр. 5', /не и за мен/),
      tx(zhest('Акт обр. 5')));
    t('ред само при единия — нищо не е предложено тъмно', !zhest('Акт обр. 5').querySelector('.bt-glaven'),
      zhest('Акт обр. 5').innerHTML);
    t('етапът е предложен от раздела', /изисквай — за да подпиша \(предложено от раздела\)/.test(tx(zhest('Акт обр. 5'))));

    // ── изисквай → собствен ред с условие по вида ───────────────────────────
    w.prompt = (q, def) => def;
    await w.podobniIzisquay(encodeURIComponent('акт обр. 5'), 'подпис');
    const novRed = SARVAR.cheklist_sobstveni.find(x => x.dokument === 'Акт обр. 5');
    t('„изисквай“ прави собствен ред', !!novRed, SARVAR.cheklist_sobstveni);
    t('условието е „вид ∈ сграда“ — не „вид = “ (сървърът пренаписва старите)', novRed && novRed.uslovie === 'вид ∈ сграда', novRed);
    t('разделът е за въвеждането', novRed && /^Въвеждане в експлоатация/.test(novRed.razdel), novRed);
    t('основанието казва откъде — обект, година, раздел, „1 от 2“',
      novRed && /от подобен обект: „Жилищна сграда — Овча купел“ \(2025\)/.test(novRed.osnovanie)
      && /раздел „1\.3\. Актове и протоколи“/.test(novRed.osnovanie) && /1 от 2/.test(novRed.osnovanie), novRed && novRed.osnovanie);
    t('старият собствен ред остава', SARVAR.cheklist_sobstveni.some(x => x.dokument === 'Удостоверение за кадастъра'));
    t('отговорът е записан на сървъра, по вид', SARVAR.podobni_otgovori['сграда|акт обр. 5']
      && SARVAR.podobni_otgovori['сграда|акт обр. 5'].otgovor === 'izisquay', SARVAR.podobni_otgovori);
    t('на екрана: „✔ изисква се за „сграда“ — за да подпишеш“', /✔ изисква се за „сграда“ — за да подпишеш/.test(tx(redNa('Акт обр. 5'))),
      tx(redNa('Акт обр. 5')));
    // името съвпада с ред от чеклиста → не се записва (сървърът би го прескочил мълчаливо)
    w.prompt = () => 'Разрешение за строеж';
    const predi = SARVAR.cheklist_sobstveni.length;
    await w.podobniIzisquay(encodeURIComponent('протокол от изпитване на вода'), 'подпис');
    t('име на съществуващ ред → отказ с думи', SARVAR.cheklist_sobstveni.length === predi
      && /вече е ред в чеклиста — отговори „същото като…“/.test(telo()), telo());

    // ── не и за мен ─────────────────────────────────────────────────────────
    await w.podobniNe(encodeURIComponent('протокол от изпитване на вода'));
    t('„не и за мен“ се пази на сървъра', SARVAR.podobni_otgovori['сграда|протокол от изпитване на вода']
      && SARVAR.podobni_otgovori['сграда|протокол от изпитване на вода'].otgovor === 'ne');
    t('и редът слиза долу, свит', /не и за мен · 1/.test(tx(d.querySelector('.podoben-ne summary'))) && !zhest('Протокол от изпитване на вода'));

    // ── същото като… ────────────────────────────────────────────────────────
    await w.podobniSashtoto(encodeURIComponent('акт обр. 7'), 'Акт 7 и обр. 12 по част архитектура');
    const s7 = SARVAR.podobni_otgovori['*|акт обр. 7'];
    t('„същото като“ не зависи от вида и пази двете имена', s7 && s7.otgovor === 'sashtoto'
      && JSON.stringify(s7.imena) === '["Акт обр. 7","Акт 7 и обр. 12 по част архитектура"]', s7);
    t('на екрана: „= същото като …, казано от теб“', /= същото като „Акт 7 и обр\. 12 по част архитектура“ · казано от теб/.test(tx(redNa('Акт обр. 7'))));

    // ── отговорите остават при ново отваряне ────────────────────────────────
    await w.podobniOtvori();
    t('след ново отваряне не пита пак', !zhest('Акт обр. 5') && !zhest('Акт обр. 7'), [tx(redNa('Акт обр. 5')), tx(redNa('Акт обр. 7'))]);

    // ── върни ───────────────────────────────────────────────────────────────
    await w.podobniVarni(encodeURIComponent('акт обр. 5'));
    t('„върни“ маха собствения ред', !SARVAR.cheklist_sobstveni.some(x => x.dokument === 'Акт обр. 5')
      && SARVAR.cheklist_sobstveni.some(x => x.dokument === 'Удостоверение за кадастъра'), SARVAR.cheklist_sobstveni);
    t('и отговора — пита пак', !SARVAR.podobni_otgovori['сграда|акт обр. 5'] && !!zhest('Акт обр. 5'));

    // ── чеклистът на обекта не е пипнат ─────────────────────────────────────
    const p = JSON.parse(w.localStorage.getItem('akt_v5')).projects[0];
    t('чеклистът на обекта не е пипнат', JSON.stringify(p.nadzor_otmetnati) === '["Разрешение за строеж"]'
      && !p.neotnasya, p);
    t('в кода няма запис по обекта (отметнато, „не се отнася“)', !/nadzor_otmetnati|neotnasya/.test(
      fs.readFileSync(path.join(PAPKA, 'podobni.js'), 'utf8').replace(/\/\/.*$/gm, '')));

    // ── махни ───────────────────────────────────────────────────────────────
    w.podobniMahni(1);
    t('„махни“ маха само прочетеното', JSON.parse(w.localStorage.getItem('akt_v5')).podobni.length === 1);
    w.plotLyava();
    t('плочката казва колко са', /1 прочетен/.test(tx(plochka)), tx(plochka));

    t('без грешки', !greshki.length, greshki.slice(0, 3));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — подобният обект: списъкът и трите отговора`);
    process.exit(loshi.length ? 1 : 0);
})();
