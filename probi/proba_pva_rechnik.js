// РЕЧНИКЪТ — един документ, всичките му имена (25.11.2026).
//
// Мярката от същия ден: договорът с ЕРМ Запад стои в досието, вързан към
// „Становище за присъединяване — електроснабдяване“, а „Липсва ми“ го иска като
// „Договор за присъединяване от електроразпределителното дружество“ — два
// файла, две имена. Пробата пази: какво се пита, че решението се помни на
// сървъра и че след него „Липсва ми“ го вижда.
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

const CHEKLIST = ['Разрешение за строеж', 'Становище за присъединяване — електроснабдяване',
                  'Документи от електроразпределителното дружество', 'Декларации за експлоатационни показатели на бетона и армировката',
                  'Сертификати и протоколи за влаганите материали', 'Оценка от техническия контрол по част „Конструктивна“'];
const MOMENTI = ['Разрешение за строеж', 'Становище за присъединяване — електроснабдяване',
                 'Договор за присъединяване  от електроразпределителното дружество',
                 'Декларации за експлоатационни показатели на бетона и армировката', 'Сертификати и протоколи за влаганите материали'];
const ERM = { id: 'erm.pdf', fajl: 'erm.pdf', vid: 'Договор за присъединяване на обекти на клиенти към разпределителната мрежа',
              cheklist_red: 'Документи от електроразпределителното дружество', nomer: { stoynost: '1205463907' }, data: { stoynost: '13.06.2024' } };
const ERM2 = { ...ERM, id: 'erm2.pdf', fajl: 'erm2.pdf', cheklist_red: 'Становище за присъединяване — електроснабдяване' };
const DEK = n => ({ id: `d${n}.pdf`, fajl: `d${n}.pdf`, vid: 'Декларация за характеристиките на строителен продукт',
                    cheklist_red: n % 2 ? 'Декларации за експлоатационни показатели на бетона и армировката' : 'Сертификати и протоколи за влаганите материали' });
const OTK = { id: 'tk.pdf', fajl: 'tk.pdf', vid: 'Оценка за съответствие — конструктивна', cheklist_red: 'Оценка от техническия контрол по част „Конструктивна“' };
const OB = { id: 'rad', pi: '68134.4083.1', nik: 'Радулов', vid: 'sgrada', tekusht_moment: 'Акт 15',
             sloy2: { od: { dokumenti: [ERM, DEK(1), DEK(2), OTK], potvardeni: {} } } };
const OB2 = { id: 'drug', pi: '1.2.3', nik: 'Друг', vid: 'sgrada', sloy2: { od: { dokumenti: [ERM2], potvardeni: {} } } };

const SARVAR = {};
let nalichniKamSarvara = null;

(async () => {
    const vc = new VirtualConsole(), greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), { runScripts: 'dangerously', url: 'http://localhost/akt/#/rechnik',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OB, OB2], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url, o) => {
                const u = String(url), telo = JSON.parse((o && o.body) || '{}'), metod = (o && o.method) || 'GET';
                let r = {};
                if (/\/api\/rechnik\/izvori/.test(u)) r = { cheklist: CHEKLIST, momenti: MOMENTI };
                else if (/\/api\/danni\/(\w+)/.test(u)) {
                    const k = /\/api\/danni\/(\w+)/.exec(u)[1];
                    if (metod === 'POST') SARVAR[k] = JSON.parse(JSON.stringify(telo.stoynost));
                    r = { stoynost: SARVAR[k] ? JSON.parse(JSON.stringify(SARVAR[k])) : null };
                } else if (/\/api\/nadzor/.test(u)) {
                    nalichniKamSarvara = telo.nalichni;
                    r = { red: ['Акт 15'], grupi: [{ moment: 'Акт 15', minal: true, dokumenti: MOMENTI.map(d => ({ dokument: d, etap: 'подпис',
                        sastoyanie: (telo.nalichni || []).includes(d) ? 'налично' : 'очаква се' })) }] };
                }
                return { ok: true, status: 200, json: async () => r, text: async () => '{}', headers: { get: () => 'application/json' } };
            };
        } });
    const w = dom.window, d = w.document;
    w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
    await new Promise(r => setTimeout(r, 400));
    const telo = () => tx(d.getElementById('rechnik-telo'));

    t('стаята „Речник“ е в лявата колона и се отваря', !!d.querySelector('#lyava [data-plochka="rechnik"]')
      && !d.getElementById('ekran-rechnik').hidden);
    const r = w.rechnikResheniya();
    const f = r.find(x => x.tip === 'faylove');
    t('1. двата файла: „Договор за присъединяване от ЕРМ“ ↔ най-близкото в чеклиста',
      f && /от електроразпределителното дружество/.test(f.momenti) && f.predlozhenie === 'Документи от електроразпределителното дружество', f);
    const c = r.filter(x => x.tip === 'chetec');
    t('2. четецът: договорът с ЕРМ — към два различни реда, с броевете', c.some(x => /Договор за присъединяване/.test(x.ime)
      && x.redove.length === 2), c);
    t('2. декларациите — към два реда (1 и 1)', c.some(x => /Декларация/.test(x.ime) && x.redove.every(y => y.broy === 1)), c);
    const s = r.filter(x => x.tip === 'samo_cheklist');
    t('3. ред само в чеклиста — „Оценка от техническия контрол“ (не се пита два пъти „Документи от ЕРМ“)',
      s.length === 1 && /Оценка/.test(s[0].red), s);
    t('казва колко чакат', /Чакат 4 от 4\./.test(telo()), telo().slice(0, 200));

    // преди решението: досието има договора, „Липсва ми“ не
    const z = { p: w.aktObekt('rad') }; z.st = z.p;
    let res = await w.aktNadzor(z.p, z.st);
    const st = (ime) => res.grupi[0].dokumenti.find(x => x.dokument === ime).sastoyanie;
    const ERMRED = 'Договор за присъединяване  от електроразпределителното дружество';
    t('преди: „Договор … от ЕРМ“ липсва, макар да е в досието', st(ERMRED) === 'очаква се', res.grupi[0].dokumenti);

    // решение 1: един документ
    await w.rechnikSashto(encodeURIComponent(f.momenti), encodeURIComponent(f.predlozhenie));
    t('„✔ един документ“ се записва на сървъра като група', SARVAR.rechnik && SARVAR.rechnik.grupi.length === 1
      && SARVAR.rechnik.grupi[0].imena.includes('Документи от електроразпределителното дружество'), SARVAR.rechnik);
    res = await w.aktNadzor(z.p, z.st);
    t('след: „Липсва ми“ вижда договора — налично', st(ERMRED) === 'налично', nalichniKamSarvara);

    // решение 2: вид от четеца → ред
    const ermVid = c.find(x => /Договор/.test(x.ime)).klyuch.slice(2);
    await w.rechnikChetec(encodeURIComponent(ermVid), encodeURIComponent('Становище за присъединяване — електроснабдяване'));
    t('„✔ това е редът“ се записва', SARVAR.rechnik.chetec[ermVid] && SARVAR.rechnik.chetec[ermVid].red === 'Становище за присъединяване — електроснабдяване');
    res = await w.aktNadzor(z.p, z.st);
    t('прочетеният вид затваря решения ред, макар четецът да го е вързал другаде', st('Становище за присъединяване — електроснабдяване') === 'налично');
    const dekVid = c.find(x => /Декларация/.test(x.ime)).klyuch.slice(2);
    await w.rechnikChetec(encodeURIComponent(dekVid), '', true);
    t('„и двата са верни — зависи“ спира питането, без да слива', SARVAR.rechnik.chetec[dekVid].zavisi === true
      && !SARVAR.rechnik.grupi.some(g => g.imena.some(i => /Декларации/.test(i))));

    // решение 3: няма го в моментите
    await w.rechnikNyama(encodeURIComponent(s[0].red));
    t('„няма го в моментите“ се помни', SARVAR.rechnik.nyama.length === 1);
    w.rechnikRisuvai();
    t('всички решени — казва го', /Всичките 4 са решени\./.test(telo()), telo().slice(0, 200));

    // ново отваряне — от сървъра
    await w.rechnikOtvori();
    t('след ново отваряне решенията стоят', /Всичките 4 са решени\./.test(telo()));
    // върни
    await w.rechnikVarni(encodeURIComponent(f.momenti), encodeURIComponent(f.predlozhenie));
    t('„върни“ маха групата и пита пак', !SARVAR.rechnik.grupi.length && /Чакат 1 от 4\./.test(telo()), telo().slice(0, 200));
    t('двата заключени файла не се пипат — речникът е отделен ключ',
      !/cheklist_sobstveni|nadzor_otmetnati/.test(fs.readFileSync(path.join(PAPKA, 'rechnik.js'), 'utf8').replace(/\/\/.*$/gm, '')));
    t('без грешки', !greshki.length, greshki.slice(0, 3));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — речникът`);
    process.exit(loshi.length ? 1 : 0);
})();
