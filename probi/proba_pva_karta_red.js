// КАРТАТА В „ЧАКА ПРОВЕРКА“ — ЕДИН РЕД (26.11.2026).
//
// Заданието (`ЗАДАНИЕ-ЕДИН-ЗАПИС.md`, „Картата на прочетеното“, обсъдено
// 25.11.2026): „документът става един ред, както ще влезе в акта — едно цяло
// поле за поправка и един ✔ вярно е. Номерът и датата системата ги взима от
// реда сама и ги показва дребно; не намери ли ги — казва го. УПИ, адрес и
// възложител не са полета, а един ред за проверка. Слепени два документа —
// картата пита „да ги разделя?“.“ Операторът, 26.11: „това също не е поправено“.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + String(JSON.stringify(kak)).slice(0, 400)));
const tx = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>' + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const S = v => ({ stoynost: v, citat: v, stranica: 6 });
// Случаят от екрана на оператора: сертификат и декларация — слепени.
const SLEPEN = { id: 'sert.pdf#6', fajl: 'сертификати.pdf', vid: 'Сертификат по ISO 9001: 2015 и Декларация за характеристиките на строителен продукт',
    _za_red: 'Декларация за вложените материали',
    naimenovanie: S('СЕРТИФИКАТ по ISO 9001: 2015 BG003738 от 31.05.2024год. издаден от Bureau Veritas Certification. Декларация за характеристиките на строителен продукт № ХБ - 6-2-21'),
    nomer: S('ХБ - 6-2-21'), data: S('23.04.2025'), izdatel: S('„ХИДРОБЕТОН“ ООД'),
    material: S('Обикновен бетон с рецептурен състав – ХБ - 6'), proizvoditel: S('„ХИДРОБЕТОН“ ООД'),
    obekt: { upi: S('IV – 561, 1564, кв. 222, м. Подуяне – Редута'), adres: S('гр. София, ул. Кадемлия, 16-20') },
    uchastnici: [{ rolya: 'възложител', ime: S('„Билдинг Експрес 90 Р“ ООД') }] };
const DOG = { id: 'dog.pdf', fajl: 'dog.pdf', vid: 'Договор за присъединяване',
    naimenovanie: S('Договор за присъединяване на обекти на клиенти към разпределителната мрежа'), nomer: S('1205463907'),
    data: S('13.06.2024'), izdatel: S('„ЕРМ Запад“ ЕАД') };
const OB = { id: 'rad', pi: '68134.702.9889', nik: 'Радулов', vid: 'sgrada', tekusht_moment: 'Акт 15',
             sloy2: { od: { dokumenti: [], potvardeni: {}, chakat: [SLEPEN, DOG] } } };

(async () => {
    const vc = new VirtualConsole(), greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), { runScripts: 'dangerously',
        url: 'http://localhost/akt/#/moment/rad/0/' + encodeURIComponent('Акт 15'), pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OB], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.localStorage.setItem('rechnik_uchi_koga', String(Date.now()));
            w.fetch = async (url) => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => '{}',
                json: async () => (/\/api\/nadzor/.test(String(url)) ? { red: ['Акт 15'], grupi: [{ moment: 'Акт 15', minal: true,
                    dokumenti: [{ dokument: 'Декларация за вложените материали', etap: 'подпис', sastoyanie: 'очаква се' }] }] } : { stoynost: null }) });
        } });
    const w = dom.window, d = w.document;
    w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
    await new Promise(r => setTimeout(r, 500));
    w.momentOtvoriRazdel('chakat');
    const karta = id => d.querySelector(`.chakasht[data-id="${id}"]`);

    // ── един ред ─────────────────────────────────────────────────────────────
    const k = karta('dog.pdf');
    const pole = k && k.querySelector('textarea.karta-red');
    t('ЕДНО поле с реда, както ще влезе в акта', !!pole && k.querySelectorAll('.karta-red').length === 1, k && k.innerHTML.slice(0, 300));
    t('редът: наименование № номер от дата — издател',
      pole && pole.value === 'Договор за присъединяване на обекти на клиенти към разпределителната мрежа № 1205463907 от 13.06.2024 — „ЕРМ Запад“ ЕАД', pole && pole.value);
    t('ЕДИН бутон „✔ вярно е“ — без по един на всяко поле',
      k.querySelectorAll('button').length && [...k.querySelectorAll('.chakasht-zhestove button')].filter(b => /✔/.test(tx(b))).length === 1
      && !k.querySelector(':scope > .chakasht-fakti .fakt-zhestove button:not([hidden])'), [...k.querySelectorAll('button')].map(tx));
    t('номерът и датата — дребно, „взети от реда“', /номер: 1205463907 · дата: 13\.06\.2024 — взети от реда/.test(tx(k)), tx(k));
    t('отделните полета са свити в „подробно“', !!k.querySelector('details.karta-podrobno'));

    // ── поправка в реда ──────────────────────────────────────────────────────
    w.momentChRedPromeni(encodeURIComponent('dog.pdf'), 'Договор за присъединяване № 1205463999 от 14.06.2024 — „ЕРМ Запад“ ЕАД');
    const d1 = JSON.parse(w.localStorage.getItem('akt_v5')).projects[0].sloy2.od.chakat.find(x => x.id === 'dog.pdf');
    t('поправеният ред дава номера', d1._potv.nomer.stoynost === '1205463999' && d1._potv.nomer.prochetena === '1205463907', d1._potv);
    t('и датата', d1._potv.data.stoynost === '14.06.2024', d1._potv);
    t('и наименованието — частта преди „№“', d1._potv.naimenovanie.stoynost === 'Договор за присъединяване', d1._potv);
    w.momentChRedPromeni(encodeURIComponent('dog.pdf'), 'Договор за присъединяване с ЕРМ');
    t('ред без номер и дата — казва го, не мълчи', /в реда няма номер/.test(tx(karta('dog.pdf'))) && /няма дата/.test(tx(karta('dog.pdf'))), tx(karta('dog.pdf')));

    // ── ✔ вярно е — записва ─────────────────────────────────────────────────
    w.momentChRedPromeni(encodeURIComponent('dog.pdf'), 'Договор за присъединяване № 1205463907 от 13.06.2024 — „ЕРМ Запад“ ЕАД');
    w.momentChVyarnoE(encodeURIComponent('dog.pdf'));
    const zap = JSON.parse(w.localStorage.getItem('akt_v5')).projects[0].sloy2.od;
    t('„✔ вярно е“ записва в досието с едно натискане', zap.dokumenti.some(x => x.id === 'dog.pdf') && !zap.chakat.some(x => x.id === 'dog.pdf'), zap);
    t('с потвърдените номер и дата', zap.potvardeni['dog.pdf::nomer'].stoynost === '1205463907' && zap.potvardeni['dog.pdf::data'].stoynost === '13.06.2024');

    // ── проверката за обекта — един ред ─────────────────────────────────────
    w.momentOtvoriRazdel('chakat');
    const ks = karta('sert.pdf#6');
    t('УПИ, адрес и възложител — ЕДИН ред за проверка, не полета',
      /За обекта: УПИ IV – 561, 1564, кв\. 222, м\. Подуяне – Редута · адрес гр\. София, ул\. Кадемлия, 16-20 · възложител „Билдинг Експрес 90 Р“ ООД/.test(tx(ks.querySelector('.karta-obekt'))),
      tx(ks.querySelector('.karta-obekt')));
    t('редът на декларацията носи материала и производителя', /— Обикновен бетон с рецептурен състав – ХБ - 6 — „ХИДРОБЕТОН“ ООД$/.test(ks.querySelector('textarea.karta-red').value),
      ks.querySelector('textarea.karta-red').value);

    // ── слепени два документа ───────────────────────────────────────────────
    t('слепени — картата пита „да ги разделя?“', /Тук изглежда има два документа/.test(tx(ks)) && /да ги разделя/.test(tx(ks)), tx(ks));
    w.momentChRazdeli(encodeURIComponent('sert.pdf#6'));
    const ch = JSON.parse(w.localStorage.getItem('akt_v5')).projects[0].sloy2.od.chakat;
    const parvi = ch.find(x => x.id === 'sert.pdf#6'), vtori = ch.find(x => x.id === 'sert.pdf#6~2');
    t('разделени на два чакащи документа', !!parvi && !!vtori, ch.map(x => x.id));
    t('първият — сертификатът, с датата си', /^СЕРТИФИКАТ по ISO 9001/.test(parvi.naimenovanie.stoynost) && parvi.data.stoynost === '31.05.2024', parvi);
    t('вторият — декларацията, с номера си', /^Декларация за характеристиките/.test(vtori.naimenovanie.stoynost) && vtori.nomer.stoynost === 'ХБ - 6-2-21', vtori);
    t('и двата — за същия ред', vtori._za_red === 'Декларация за вложените материали');
    t('материалът остава на декларацията, не на сертификата', !parvi.material && /бетон/.test(vtori.material.stoynost), [parvi.material, vtori.material]);
    t('без грешки', !greshki.length, greshki.slice(0, 3));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — картата е един ред`);
    process.exit(loshi.length ? 1 : 0);
})();
