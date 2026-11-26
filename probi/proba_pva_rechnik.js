// РЕЧНИКЪТ — без стая; учи се сам и на място (25.11.2026).
//
// `ДА ПРОЧЕТА/ЗАДАНИЕ-ЕДИН-ЗАПИС.md`, стъпка 1. Случаят от същия ден: договорът
// с ЕРМ Запад е в досието, вързан към „Становище за присъединяване —
// електроснабдяване“, а „Липсва ми“ го иска като „Договор за присъединяване от
// електроразпределителното дружество“. Пробата пази:
//   · няма стая „Речник“;
//   · на реда — „в досието има „…“ — ✔ това е · не е“ (само предлага);
//   · „✔ това е“ затваря реда и в „Имам“ пише „казано от теб“ + „не е това“;
//   · наученото по броене (от сървъра) личи „научено от N обекта“;
//   · „не е“ забранява двойката и не пита пак;
//   · обобщението към сървъра — без лични данни.
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

const ERMRED = 'Договор за присъединяване от електроразпределителното дружество';
const ZK = 'Заповедна книга на строежа';
const ERM = { id: 'erm.pdf', fajl: 'erm.pdf', vid: 'Договор за присъединяване на обекти на клиенти към разпределителната мрежа на „Електроразпределителни мрежи Запад“ ЕАД',
              cheklist_red: 'Становище за присъединяване — електроснабдяване', nomer: { stoynost: '1205463907' }, data: { stoynost: '13.06.2024' } };
const KNIGA = { id: 'zk.pdf', fajl: 'zk.pdf', vid: 'ЗАПОВЕДНА КНИГА', cheklist_red: 'Договори за строителство и строителен надзор' };
const OB = { id: 'rad', pi: '68134.4083.1', nik: 'Радулов', vid: 'sgrada', tekusht_moment: 'Акт 15',
             sloy2: { od: { dokumenti: [ERM, KNIGA], potvardeni: {} } }, egn_vazlozhitel: '0000000000' };
const SARVAR = {};
let obobshtenie = null;

(async () => {
    const vc = new VirtualConsole(), greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), { runScripts: 'dangerously',
        url: 'http://localhost/akt/#/moment/rad/0/' + encodeURIComponent('Акт 15'), pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OB], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async (url, o) => {
                const u = String(url), telo = JSON.parse((o && o.body) || '{}'), metod = (o && o.method) || 'GET';
                let r = {};
                if (/\/api\/rechnik\/uchi/.test(u)) {
                    obobshtenie = telo.obobshtenie;
                    // сървърът „е научил“: заповедната книга при 4 обекта
                    r = { nauchen: { 'заповедна книга': { red: ZK, obekti: 4, dyal: 1 } } };
                } else if (/\/api\/danni\/(\w+)/.test(u)) {
                    const k = /\/api\/danni\/(\w+)/.exec(u)[1];
                    if (metod === 'POST') SARVAR[k] = JSON.parse(JSON.stringify(telo.stoynost));
                    r = { stoynost: SARVAR[k] ? JSON.parse(JSON.stringify(SARVAR[k])) : null };
                } else if (/\/api\/nadzor/.test(u)) {
                    const DOK = [ERMRED, ZK, 'Становище за присъединяване — електроснабдяване', 'Договори за строителство и строителен надзор'];
                    r = { red: ['Акт 15'], grupi: [{ moment: 'Акт 15', minal: true, dokumenti: DOK.map(d => ({ dokument: d, etap: 'подпис',
                        sastoyanie: (telo.nalichni || []).includes(d) ? 'налично' : 'очаква се' })) }] };
                }
                return { ok: true, status: 200, json: async () => r, text: async () => '{}', headers: { get: () => 'application/json' } };
            };
        } });
    const w = dom.window, d = w.document;
    w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
    await new Promise(r => setTimeout(r, 600));
    const red = ime => d.querySelector(`.lipsva-red[data-dokument="${ime}"]`);

    t('няма стая „Речник“ в лявата колона', !d.querySelector('#lyava [data-plochka="rechnik"]') && !d.getElementById('ekran-rechnik'));
    t('ученето прати обобщение — само вид, ред, сверен, ПИ', obobshtenie && obobshtenie.length === 2
      && Object.keys(obobshtenie[0]).sort().join(',') === 'pi,red,sveren,vid', obobshtenie);
    t('без лични данни в обобщението', !JSON.stringify(obobshtenie).includes('0000000000'));
    t('наученото е записано в речника на сървъра', SARVAR.rechnik && SARVAR.rechnik.nauchen['заповедна книга'].red === ZK, SARVAR.rechnik);
    await new Promise(r => setTimeout(r, 300));

    // предложение на място
    const p = tx(red(ERMRED));
    t('„Липсва ми“: „в досието има „Договор … ЕРМ Запад“ — ✔ това е · не е“',
      /в досието има „Договор за присъединяване на обекти/.test(p) && /✔ това е/.test(p) && /не е/.test(p), p);
    t('и показва номера и датата', /1205463907 · 13\.06\.2024/.test(p), p);
    t('само предлага — редът още липсва', !!red(ERMRED));

    // ✔ това е
    await w.rechnikTovaE(encodeURIComponent(ERM.vid), encodeURIComponent(ERMRED));
    await new Promise(r => setTimeout(r, 300));
    t('„✔ това е“ се записва — казано от теб', SARVAR.rechnik.chetec[w.eval('_rk')(ERM.vid)].red === ERMRED, SARVAR.rechnik.chetec);
    t('и редът излиза от „Липсва ми“', !red(ERMRED), tx(d.querySelector('.razdel-telo')));
    const zz = w.momentZhiv();
    t('стъпка 2: вратата на кухнята (_nadzorNalichni) вижда речника — сверката и числата питат нея',
      w._nadzorNalichni(zz.st, zz.p).includes(ERMRED), w._nadzorNalichni(zz.st, zz.p));
    const sv = w.dokSverkaSCheklista(zz.p, zz.st, [ERMRED]);
    t('стъпка 2: и сверката Акт 15 ↔ чеклист не казва „липсва“ за затвореното през речника',
      !(sv.pisheNeBroi || []).some(x => x.red === ERMRED), sv);
    w.momentOtvoriRazdel('imam');
    const imam = tx(d.querySelector('.razdel-telo'));
    t('в „Имам“: „затворено от досието: „…“ · казано от теб“', /затворено от досието: „Договор за присъединяване на обекти.*ЕАД“ · казано от теб/.test(imam), imam);
    t('научената заповедна книга: „научено от 4 обекта“', /затворено от досието: „ЗАПОВЕДНА КНИГА“ · научено от 4 обекта/.test(imam), imam);
    t('до тях — „не е това“', /не е това/.test(imam));

    // не е това → забранено, връща се в „Липсва ми“ и не предлага пак
    await w.rechnikNeE(encodeURIComponent(ERM.vid), encodeURIComponent(ERMRED));
    await new Promise(r => setTimeout(r, 300));
    w.momentOtvoriRazdel('lipsva');
    t('„не е това“ връща реда в „Липсва ми“', !!red(ERMRED));
    t('и не предлага пак същия документ', !/в досието има/.test(tx(red(ERMRED))), tx(red(ERMRED)));
    t('двойката е забранена в речника', (SARVAR.rechnik.ne || []).length === 1 && !SARVAR.rechnik.chetec[w.eval('_rk')(ERM.vid)], SARVAR.rechnik);

    // образците
    t('обр. 7 никога не се предлага за обр. 14', w.eval('_rkRazlichniObrazci')('Акт обр. 7 за приемане', 'Акт обр. 14'));
    // ── „не е това“ на ред, затворен от документ в досието (26.11.2026) ────────
    // Случаят на оператора: заповедната книга, вързана към „Договори за
    // строителство и строителен надзор“.
    w.momentOtvoriRazdel('imam');
    const kn = tx(d.querySelector('.razdel-telo'));
    t('в „Имам“ редът казва вида от досието — „ЗАПОВЕДНА КНИГА“', /Договори за строителство и строителен надзор Досието · „ЗАПОВЕДНА КНИГА“/.test(kn), kn);
    await w.momentNeEToziDokument(encodeURIComponent('Договори за строителство и строителен надзор'));
    await new Promise(r => setTimeout(r, 300));
    const knDok = w.momentZhiv().st.sloy2.od.dokumenti.find(x => x.id === 'zk.pdf');
    t('„не е това“ маха връзката на документа и пази старата', knDok.cheklist_red === ''
      && knDok.cheklist_red_chetec === 'Договори за строителство и строителен надзор', knDok);
    t('и в речника: „заповедна книга“ НЕ е „Договори …“', (SARVAR.rechnik.ne || []).includes('заповедна книга|договори за строителство и строителен надзор'),
      SARVAR.rechnik.ne);
    w.momentOtvoriRazdel('lipsva');
    t('редът се връща в „Липсва ми“', !!red('Договори за строителство и строителен надзор'));

    // ── стъпка 3 (26.11.2026): общите редове на чеклиста ──────────────────────
    const blizak = (ime, redove) => (w.eval('rechnikNaiBlizakRed')(ime, redove) || {}).red || '';
    t('„Сертификат за качество на асансьора“ → „Документи за асансьора“',
      blizak('Сертификат за качество на асансьора', ['Документи за асансьора', 'Разрешение за строеж']) === 'Документи за асансьора');
    t('„Ревизионна книга на асансьор“ → „Документи за асансьора“', blizak('Ревизионна книга на пътнически асансьор', ['Документи за асансьора']) === 'Документи за асансьора');
    t('акт по образец НЕ отива в общ ред („Акт обр. 12 по част Електро“ ≠ „Протоколи за … ел.“)',
      !blizak('Акт обр. 12 по част Електро', ['Протоколи за измерване на електрическите инсталации']));
    t('договор НЕ отива в „Документи за …“ (ВиК ≠ противопожарно водоснабдяване)',
      !blizak('Договор за присъединяване към водоснабдителната система', ['Документи за противопожарното водоснабдяване']));
    t('писмо НЕ отива в „Протоколи за …“', !blizak('Писмо от Софийска вода за изградено канализационно отклонение', ['Протоколи за изпитване на канализационните инсталации']));
    t('нотариален акт → „Документ за собственост … право на строеж“',
      /Документ за собственост/.test(blizak('Нотариален акт за учредяване право на строеж', ['Документ за собственост или документ за учредено право на строеж'])));
    t('декларациите — извън подобния (таблицата на материалите)', w.podobniEMaterial('Декларация за характеристиките на строителен продукт')
      && w.podobniEMaterial('Декларации за вложените материали (таблица)') && !w.podobniEMaterial('Сертификат за качество на асансьора'));
    t('регулярният израз е без невидим знак (\b не знае кирилица)', !fs.readFileSync(path.join(PAPKA, 'rechnik.js'), 'utf8').includes(String.fromCharCode(8)));
    t('без грешки', !greshki.length, greshki.slice(0, 3));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — речникът без стая`);
    process.exit(loshi.length ? 1 : 0);
})();
