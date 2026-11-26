// „ЛИПСВА МИ“ = СПИСЪКЪТ НА ПОДОБНИЯ (26.11.2026).
//
// Заданието (`ДА ПРОЧЕТА/ЗАДАНИЕ-ЕДИН-ЗАПИС.md`, записано 25.11): „Липсва ми =
// каквото е имал подобният − каквото имаш, през записите. Днешният чеклист —
// само първият подобен.“ Направено беше обратното (целият чеклист + подобният
// отгоре — ~90 реда при ~30 документа). Операторът: „защо записваме решения, а
// после не ги спазваш?“ Тази проба е решението, записано като проба:
//   · свързан с подобен → основните редове в „Липсва ми“ не са повече от
//     документите на подобния плюс законовия под;
//   · ред от чеклиста, който подобният няма — в свитата група „по стария
//     списък“, не се брои;
//   · ред от чеклиста, който отговаря на документ от подобния — ЕДИН ред, с
//     името от акта;
//   · подредено по разделите на подобния акт;
//   · без свързан подобен — както досега.
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

// Подобният: 5 документа (едната декларация не се брои — таблицата на материалите).
const PODOBEN = { id: 'pod1', ime: 'Петракиев', vid: 'сграда', kategoria: '3', fajlove: [{ fajl: 'p.docx', vid: 'Акт 15', godina: 2024, redove: [
    { ime: 'Нотариален акт', klyuch: 'нотариален акт', razdel: '1.1. По собствеността', broy: 3, dosloven: ['Нотариален акт № 5'], cheklist_red: '' },
    { ime: 'Разрешение за строеж', klyuch: 'разрешение за строеж', razdel: '1.2. По законосъобразното започване', broy: 1, dosloven: ['РС № 1'], cheklist_red: 'Разрешение за строеж' },
    { ime: 'Акт обр. 7', klyuch: 'акт обр. 7', razdel: '1.3. Актове и протоколи', broy: 28, ot: '29.03.2022', do: '29.01.2023', dosloven: ['Акт обр. 7 — 28 броя'], cheklist_red: 'Акт 7 и обр. 12 по част архитектура' },
    { ime: 'Бетонов дневник', klyuch: 'бетонов дневник', razdel: '1.3. Актове и протоколи', broy: 1, dosloven: ['Бетонов дневник'], cheklist_red: '' },
    { ime: 'Сертификат за качество на асансьора', klyuch: 'сертификат за качество на асансьора', razdel: '2.9 Пожарна безопасност', broy: 1, dosloven: ['…'], cheklist_red: '' },
    { ime: 'Декларация за характеристиките на строителен продукт', klyuch: 'декларация', razdel: '1.3.', broy: 1, dosloven: ['…'], cheklist_red: '' },
] }] };
// Чеклистът на сървъра: 8 реда; само 2 отговарят на подобния.
const CHEK = ['Разрешение за строеж', 'Акт 7 и обр. 12 по част архитектура', 'Документи за асансьора', 'Енергиен сертификат',
              'Гаранционни карти и инструкции за експлоатация', 'Протоколи за мълниезащитната уредба', 'Документ за собственост на имота',
              'Документи за вентилацията на гаражите'];
const GRUPI = () => [
    { moment: 'Протокол 2', minal: true, dokumenti: [{ dokument: 'Разрешение за строеж', etap: 'начало', sastoyanie: 'налично' },
                                                     { dokument: 'Документ за собственост на имота', etap: 'начало', sastoyanie: 'очаква се' }] },
    { moment: 'Акт 15', minal: true, dokumenti: CHEK.filter(x => !['Разрешение за строеж', 'Документ за собственост на имота'].includes(x))
        .map(d => ({ dokument: d, etap: 'подпис', sastoyanie: 'очаква се' })) },
];

(async () => {
    const vc = new VirtualConsole(), greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const OB = { id: 'rad', pi: '68134.702.9889', nik: 'Радулов', vid: 'sgrada', kategoria: '3', tekusht_moment: 'Акт 15',
                 sloy2: { od: { dokumenti: [], potvardeni: {} } } };
    const dom = new JSDOM(stranica(), { runScripts: 'dangerously',
        url: 'http://localhost/akt/#/moment/rad/0/' + encodeURIComponent('Акт 15'), pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OB], podobni: [PODOBEN], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.localStorage.setItem('rechnik_uchi_koga', String(Date.now()));
            w.fetch = async (url, o) => {
                const u = String(url), telo = JSON.parse((o && o.body) || '{}');
                let r = {};
                if (/\/api\/nadzor/.test(u)) r = { red: ['Протокол 2', 'Акт 15'], grupi: GRUPI() };
                else if (/\/api\/podoben\/pod/.test(u)) r = { kategoria: 3, namereni: [],
                    lipsvat: [{ kod: 'akt5', ime: 'Акт обр. 5', osnovanie: 'таблицата на оператора — само 1–3 категория', tvardo: true, belezhka: '' },
                              { kod: 'tehpasport', ime: 'Технически паспорт', osnovanie: 'Наредба № 2, чл. 14, т. 9', tvardo: false, belezhka: '…' }] };
                else if (/\/api\/danni\//.test(u)) r = { stoynost: null };
                return { ok: true, status: 200, json: async () => r, text: async () => '{}', headers: { get: () => 'application/json' } };
            };
        } });
    const w = dom.window, d = w.document;
    w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
    await new Promise(r => setTimeout(r, 500));

    const z = w.momentZhiv();
    // без връзка — както досега
    let r0 = await w.aktNadzor(z.p, z.st);
    t('без свързан подобен — редовете на чеклиста, без промяна', r0.grupi.find(g => g.moment === 'Акт 15').dokumenti.length === 6
      && !r0.grupi.some(g => g.dokumenti.some(x => x.izvan_podobniya)));

    // свързан
    z.st.podobni = ['pod1'];
    await w.aktNadzor(z.p, z.st);            // първото — пускa смятането на законовия под
    await new Promise(res => setTimeout(res, 200));
    const r = await w.aktNadzor(z.p, z.st);  // второто — вече с пода
    const osnovni = g => r.grupi.find(x => x.moment === g).dokumenti.filter(x => !x.izvan_podobniya);
    const vsichkiOsnovni = osnovni('Протокол 2').concat(osnovni('Акт 15'));
    const zakon = vsichkiOsnovni.filter(x => x.zakon);
    t('ДОГОВОРЕНОТО: основните редове ≤ документите на подобния (5, без декларацията) + законовия под',
      vsichkiOsnovni.length <= 5 + zakon.length, vsichkiOsnovni.map(x => x.dokument));
    t('ред от чеклиста, който отговаря на документ от подобния — ЕДИН ред, с името от акта',
      vsichkiOsnovni.filter(x => /Акт 7|Акт обр. 7/.test(x.dokument) || /Акт обр. 7/.test(x.prikaz || '')).length === 1
      && vsichkiOsnovni.some(x => x.prikaz === 'Акт обр. 7'), vsichkiOsnovni);
    const izvan = r.grupi.flatMap(g => g.dokumenti.filter(x => x.izvan_podobniya)).map(x => x.dokument);
    t('редовете от чеклиста, които подобният няма — „по стария списък“', izvan.includes('Енергиен сертификат')
      && izvan.includes('Протоколи за мълниезащитната уредба'), izvan);
    t('и не се броят в процента', w.aktDveChisla(r.grupi.find(g => g.moment === 'Акт 15'), []).podpis.ot === osnovni('Акт 15').length,
      w.aktDveChisla(r.grupi.find(g => g.moment === 'Акт 15'), []).podpis);
    t('декларацията — не (таблицата на материалите)', !vsichkiOsnovni.some(x => /Деклараци/.test(x.prikaz || x.dokument)));
    t('законовият под — червен ред „нормата иска“ за липсващото в подобния', zakon.some(x => x.dokument === 'Акт обр. 5' && x.tvardo), zakon);
    t('„когато се изисква“ от пода — не е ред (само твърдото)', !zakon.some(x => x.dokument === 'Технически паспорт'), zakon);

    // на екрана
    w.momentRisuvai();
    const telo = tx(d.querySelector('.razdel-telo'));
    t('на екрана: подредено по разделите на подобния', /1\.3\. Актове и протоколи/.test(telo), telo.slice(0, 400));
    t('и „по стария списък, не са в подобния“ — свито', /по стария списък, не са в подобния · \d+/.test(tx(d.querySelector('.stariyat-spisak summary'))),
      tx(d.querySelector('.stariyat-spisak summary')));
    t('бутонът „Липсва ми“ брои само основните', /^Липсва ми · \d+/.test(tx(d.querySelector('.razdel-bt'))), tx(d.querySelector('.razdel-bt')));
    t('без грешки', !greshki.length, greshki.slice(0, 3));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — „Липсва ми“ е списъкът на подобния`);
    process.exit(loshi.length ? 1 : 0);
})();
