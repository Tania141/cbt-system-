// ПОДОБНИ ОБЕКТИ — библиотеката и връзката с обекта.
//
// 24.11.2026 (4а): качваш завършен Акт 15 и ОД; нищо не се чете без „да“;
// .doc и PDF казват защо.
// 25.11.2026 (4в): категория (на ръка; от текста — само предложение) и
// законовият под под всеки обект.
// 25.11.2026 (връзката): операторът — „това е в подобни обекти, не в този, в
// който работя… пак затрупахме с инфо“. Списъкът с бутоните (4б) отпадна от
// библиотеката; подобният се ВРЪЗВА в момента („сравнявам с“) и пълни „Липсва
// ми“ на всеки момент. Пробата пази и двете.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + String(JSON.stringify(kak)).slice(0, 300)));
const tx = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>' + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const OTGOVOR = {
    'denka_akt15.docx': { fajl: 'denka_akt15.docx', vid: 'Акт 15', stroezh: 'Жилищна сграда — Овча купел', godina: 2025,
        kategoria_v_teksta: { cifra: 3, izrechenie: 'Трета категория съгласно чл.6, ал.3, т.2 от Наредба №1' },
        chetec: 'кодът — .docx има текст, без АИ', redove: [
            { ime: 'Акт обр. 7', klyuch: 'акт обр. 7', razdel: '1.3. Актове и протоколи', broy: 24, ot: '24.05.2022', do: '29.12.2022',
              dosloven: ['Акт Образец 7 от 24.05.2022г. до 29.12.2022г — 24 броя;'], cheklist_red: 'Акт 7 и обр. 12 по част архитектура' },
            { ime: 'Акт обр. 12 по част ВиК', klyuch: 'акт обр. 12 по част вик', razdel: '1.3. Актове и протоколи', broy: 9,
              ot: '02.10.2023', do: '22.05.2024', dosloven: ['Акт Образец 12 … по част ВиК — 9 броя'], cheklist_red: '' },
            { ime: 'Виза за проектиране', klyuch: 'виза за проектиране', razdel: '1.2. По законосъобразното започване', broy: 1,
              ot: '17.09.2019', do: '', dosloven: ['Виза за проектиране … 17.09.2019г.'], cheklist_red: '' },
        ] },
    'denka_od.docx': { fajl: 'denka_od.docx', vid: 'Окончателен доклад', stroezh: 'Жилищна сграда — Овча купел', godina: 2025,
        chetec: 'кодът — .docx има текст, без АИ', redove: [
            { ime: 'Протокол от изпитване на вода', klyuch: 'протокол от изпитване на вода', razdel: 'В.', broy: 1, ot: '', do: '',
              dosloven: ['Протокол от изпитване на вода'], cheklist_red: '' },
        ] },
    'petrakiev.docx': { fajl: 'petrakiev.docx', vid: 'Акт 15', stroezh: 'Жилищна сграда — Надежда', godina: 2016,
        chetec: 'кодът — .docx има текст, без АИ', redove: [
            { ime: 'Акт обр. 7', klyuch: 'акт обр. 7', razdel: '1.3.', broy: 28, ot: '29.03.2022', do: '29.01.2023',
              dosloven: ['Акт обр. 7 — 28 броя'], cheklist_red: 'Акт 7 и обр. 12 по част архитектура' },
        ] },
};
const POD_ZAIAVKI = [];
// Чеклистът на сървъра за момента — два момента.
const GRUPI = () => [
    { moment: 'Протокол 2', minal: true, dokumenti: [{ dokument: 'Разрешение за строеж', etap: 'начало', sastoyanie: 'налично' }] },
    { moment: 'Акт 15', minal: true, dokumenti: [{ dokument: 'Акт 7 и обр. 12 по част архитектура', etap: 'подпис', sastoyanie: 'очаква се' },
                                                 { dokument: 'Акт обр. 14', etap: 'подпис', sastoyanie: 'очаква се' }] },
];

(async () => {
    const vc = new VirtualConsole(), greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const zaiavki = [];
    let pitano = null, otgovor = true;
    const OBEKT = { id: 'ob1', pi: '1.2.3', nik: 'Радулов', vid: 'sgrada', tekusht_moment: 'Акт 15',
                    nadzor_otmetnati: ['Разрешение за строеж'] };
    const dom = new JSDOM(stranica(), { runScripts: 'dangerously', url: 'http://localhost/akt/#/podobni',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OBEKT], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url, o) => {
                const telo = JSON.parse((o && o.body) || '{}');
                const u = String(url);
                let r = {};
                if (/\/api\/podoben\/chete/.test(u)) { zaiavki.push(telo.fajl.ime); r = { podoben: OTGOVOR[telo.fajl.ime] }; }
                else if (/\/api\/podoben\/pod/.test(u)) {
                    POD_ZAIAVKI.push(telo);
                    r = { kategoria: Number(telo.kategoria),
                          namereni: [{ kod: 'rs', ime: 'Разрешение за строеж', osnovanie: 'Наредба № 2, чл. 4, ал. 2, т. 2.1', tvardo: true, namereno_kato: 'Разрешение за строеж' }],
                          lipsvat: [{ kod: 'akt6', ime: 'Акт обр. 6', osnovanie: 'таблицата на оператора — само 1–3 категория', tvardo: true, belezhka: '' },
                                    { kod: 'tehpasport', ime: 'Технически паспорт', osnovanie: 'Наредба № 2, чл. 14, т. 9', tvardo: false,
                                      belezhka: 'съставя се накрая — Акт 15 може да не го изрежда' }] };
                }
                else if (/\/api\/nadzor/.test(u)) r = { red: ['Протокол 2', 'Акт 15'], grupi: GRUPI() };
                return { ok: true, status: 200, json: async () => r, text: async () => '{}', headers: { get: () => 'application/json' } };
            };
        } });
    const w = dom.window, d = w.document;
    w.confirm = s => { pitano = s; return otgovor; };
    w.alert = () => {}; w.scrollTo = () => {};
    await new Promise(r => setTimeout(r, 300));
    const fajl = ime => new w.File(['x'], ime);
    const telo = () => tx(d.getElementById('podobni-telo'));

    // ── библиотеката ────────────────────────────────────────────────────────
    const plochka = d.querySelector('#lyava [data-plochka="podobni"]');
    t('плочката „Подобни обекти“ е в лявата колона, до „Заповедни книги“', !!plochka
      && plochka.previousElementSibling && plochka.previousElementSibling.dataset.plochka === 'knigi');
    t('казва, че се свързва в обекта, по който работиш', /Свързва се в обекта, по който работиш/.test(telo()), telo());
    otgovor = false;
    await w.podobniKachi([fajl('denka_akt15.docx')], -1);
    t('преди четене пита — колко файла и кой чете', /1 файл/.test(pitano) && /без АИ/.test(pitano), pitano);
    t('„не“ → нищо не отива към сървъра', zaiavki.length === 0, zaiavki);
    otgovor = true; pitano = null;
    await w.podobniKachi([fajl('star.doc'), fajl('skan.pdf')], -1);
    t('.doc и PDF не се пращат и казват защо', zaiavki.length === 0 && pitano === null
      && /стар \.doc, запиши го като \.docx/.test(telo()) && /само \.docx/.test(telo()), telo());
    await w.podobniKachi([fajl('denka_akt15.docx'), fajl('denka_od.docx')], -1);
    await w.podobniKachi([fajl('petrakiev.docx')], -1);
    let zap = JSON.parse(w.localStorage.getItem('akt_v5'));
    t('два обекта; първият — с два файла', zap.podobni.length === 2 && zap.podobni[0].fajlove.length === 2, zap.podobni.map(o => o.fajlove.length));
    t('името е строежът от акта', zap.podobni[0].ime === 'Жилищна сграда — Овча купел', zap.podobni[0].ime);
    t('акт от 2016 — „не е годен за източник“', /по-стар от 2017, не е годен за източник/.test(telo()));
    await w.podobniKachi([fajl('petrakiev.docx')], 1);
    t('същият файл пак — не се трупа', JSON.parse(w.localStorage.getItem('akt_v5')).podobni[1].fajlove.length === 1);
    t('БЕЗ списък с бутони в библиотеката (затрупваше)', !d.querySelector('.podoben-red') && !/изисквай/.test(telo()), telo().slice(-300));

    // ── 4в: категория и законовият под ──────────────────────────────────────
    const ob1 = () => d.querySelectorAll('.podoben-obekt')[0];
    t('4в: категорията от текста е само предложение — с изречението',
      /в акта пише: „Трета категория съгласно чл\.6/.test(tx(ob1())) && /✔ трета, както пише/.test(tx(ob1()))
      && !JSON.parse(w.localStorage.getItem('akt_v5')).podobni[0].kategoria, tx(ob1()));
    w.podobniSmeniKategoria(0, '3');
    await new Promise(r => setTimeout(r, 50));
    const pod = tx(ob1().querySelector('.podoben-pod'));
    t('4в: към сървъра — категорията и редовете на обекта', POD_ZAIAVKI.length && POD_ZAIAVKI.slice(-1)[0].kategoria === '3'
      && POD_ZAIAVKI.slice(-1)[0].ima_akt15 === true, POD_ZAIAVKI.slice(-1));
    t('4в: „1 от 3 са в акта · 1 липсва“', /3 категория · 1 от 3 са в акта · 1 липсва/.test(pod), pod);
    t('4в: твърдото — „пропуск там, не правило“, с основанието',
      /⚠ Акт обр\. 6 — нормата го иска, в този акт го няма\. Пропуск там, не правило\./.test(pod) && /само 1–3 категория/.test(pod), pod);
    t('4в: „когато се изисква“ — без ⚠, с бележката',
      /Технически паспорт — го няма \(съставя се накрая — Акт 15 може да не го изрежда\)/.test(pod), pod);
    const predi = POD_ZAIAVKI.length;
    w.podobniRisuvai(); await new Promise(r => setTimeout(r, 50));
    t('4в: при прерисуване не пита пак сървъра', POD_ZAIAVKI.length === predi);

    // ── връзката: в момента на обекта ───────────────────────────────────────
    w.location.hash = '#/moment/ob1/0/' + encodeURIComponent('Акт 15');
    await new Promise(r => setTimeout(r, 300));
    const vrazka = () => tx(d.querySelector('.podoben-vrazka'));
    t('в момента: „сравнявам с“ и изборът', /сравнявам с:/.test(vrazka()) && !!d.querySelector('.podoben-vrazka select'), vrazka());
    t('без връзка — казва, че „Липсва ми“ е само от чеклиста', /само от чеклиста/.test(vrazka()), vrazka());
    t('без връзка — само редовете на чеклиста', !d.querySelector('.lipsva-red-podoben'));
    const idDenka = JSON.parse(w.localStorage.getItem('akt_v5')).podobni[0].id;
    w.podobniVrazhi(idDenka);
    await new Promise(r => setTimeout(r, 300));
    t('връзката е на строежа', JSON.stringify(JSON.parse(w.localStorage.getItem('akt_v5')).projects[0].podobni) === JSON.stringify([idDenka]));
    t('и се вижда като чип с категорията', /Жилищна сграда — Овча купел · 3 кат\./.test(vrazka()), vrazka());
    const red = ime => d.querySelector(`.lipsva-red[data-dokument="${ime}"]`);
    // 26.11.2026: при свързан подобен редът носи ИМЕТО ОТ АКТА и казва кой ред на
    // чеклиста е — един ред, не два.
    t('ред, който чеклистът има — ЕДИН ред, с името от акта и „в чеклиста: …“',
      d.querySelectorAll('.lipsva-red[data-dokument="Акт обр. 7"]').length === 0
      && /^Акт обр\. 7 при Жилищна сграда — Овча купел: 24 бр\. · от 24\.05\.2022 до 29\.12\.2022 · в чеклиста: „Акт 7 и обр\. 12/.test(tx(red('Акт 7 и обр. 12 по част архитектура'))),
      tx(red('Акт 7 и обр. 12 по част архитектура')));
    t('ред, който чеклистът няма, излиза в Акт 15 — „от подобния · при …: 9 бр.“',
      /от подобния · при Жилищна сграда — Овча купел: 9 бр\./.test(tx(red('Акт обр. 12 по част ВиК'))), tx(d.querySelector('.razdel-telo')));
    t('и редът само от ОД също', !!red('Протокол от изпитване на вода'));
    t('документ от „законосъобразно започване“ НЕ е в Акт 15 — отива в Протокол 2', !red('Виза за проектиране'));
    const z = w.momentZhiv();
    const r2 = await w.aktNadzor(z.p, z.st);
    const p2 = r2.grupi.find(g => g.moment === 'Протокол 2');
    t('Протокол 2 получава „Виза за проектиране“, етап „начало“',
      p2.dokumenti.some(x => x.dokument === 'Виза за проектиране' && x.etap === 'начало' && x.ot_podoben), p2.dokumenti);
    // ОБЪРНАТО ПАК 26.11.2026 (вечерта): заданието казва „Липсва ми = каквото е
    // имал подобният − каквото имаш; чеклистът — само първият подобен“. Затова
    // ОСНОВАТА е подобният (брои се), а редът от чеклиста, който подобният няма
    // („Акт обр. 14“), отива „по стария списък“ и не се брои. Вж. и
    // `proba_pva_spisak_podoben.js`.
    const a15 = r2.grupi.find(g => g.moment === 'Акт 15');
    t('основата е подобният: Акт 7 · Акт 12 ВиК · изпитване на вода · Акт обр. 6 (законовият под) — 4',
      w.aktDveChisla(a15, []).podpis.ot === 4, w.aktDveChisla(a15, []).podpis);
    t('„Акт обр. 14“ (подобният го няма) — по стария списък, не се брои',
      a15.dokumenti.find(x => x.dokument === 'Акт обр. 14').izvan_podobniya === true);
    t('на екрана — свито „по стария списък, не са в подобния · 1“', /по стария списък, не са в подобния · 1/.test(tx(d.querySelector('.stariyat-spisak summary'))),
      tx(d.querySelector('.stariyat-spisak summary')));
    t('бутонът казва колко са по стария списък', /Липсва ми · \d+ · 1 по стария списък/.test(tx(d.querySelector('.razdel-bt'))), tx(d.querySelector('.razdel-bt')));
    z.st.podobni_iskani = ['Акт обр. 14'];
    const r2b = await w.aktNadzor(z.p, z.st);
    t('„искам го“ връща реда от стария списък — брои се', w.aktDveChisla(r2b.grupi.find(g => g.moment === 'Акт 15'), []).podpis.ot === 5,
      w.aktDveChisla(r2b.grupi.find(g => g.moment === 'Акт 15'), []).podpis);
    z.st.podobni_iskani = [];
    z.st.nadzor_otmetnati = [...(z.st.nadzor_otmetnati || []), 'Акт обр. 12 по част ВиК'];
    const r3 = await w.aktNadzor(z.p, z.st);
    t('отметнатият ред от подобния става „налично“',
      r3.grupi.find(g => g.moment === 'Акт 15').dokumenti.find(x => x.dokument === 'Акт обр. 12 по част ВиК').sastoyanie === 'налично');
    w.podobniVrazhi(JSON.parse(w.localStorage.getItem('akt_v5')).podobni[1].id);
    await new Promise(r => setTimeout(r, 300));
    t('два подобни: до реда — и двата, с броя на всеки',
      /при Жилищна сграда — Овча купел: 24 бр\..*при Жилищна сграда — Надежда: 28 бр\./.test(tx(red('Акт 7 и обр. 12 по част архитектура'))),
      tx(red('Акт 7 и обр. 12 по част архитектура')));
    w.podobniOtvrazhi(encodeURIComponent(idDenka));
    w.podobniOtvrazhi(encodeURIComponent(JSON.parse(w.localStorage.getItem('akt_v5')).podobni[1].id));
    await new Promise(r => setTimeout(r, 300));
    t('„✕“ маха връзката и редовете от подобния', !d.querySelector('.lipsva-red-podoben')
      && !(JSON.parse(w.localStorage.getItem('akt_v5')).projects[0].podobni || []).length);

    // ── махни от библиотеката ───────────────────────────────────────────────
    w.location.hash = '#/podobni';
    await new Promise(r => setTimeout(r, 100));
    w.podobniMahni(1);
    t('„махни“ маха само прочетеното', JSON.parse(w.localStorage.getItem('akt_v5')).podobni.length === 1);
    w.plotLyava();
    t('плочката казва колко са', /1 прочетен/.test(tx(plochka)), tx(plochka));
    t('библиотеката не пише в чеклиста на обекта', !/nadzor_otmetnati|neotnasya|cheklist_sobstveni/.test(
      fs.readFileSync(path.join(PAPKA, 'podobni.js'), 'utf8').replace(/\/\/.*$/gm, '')));
    t('без грешки', !greshki.length, greshki.slice(0, 3));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — библиотеката и връзката с обекта`);
    process.exit(loshi.length ? 1 : 0);
})();
