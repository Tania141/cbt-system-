// ПОТВЪРЖДЕНИЕТО Е ПРЕГРАДАТА, НЕ ЧЕКЛИСТЪТ.
//
// Операторът, 27.10.2026: „прочита документа, съобщава какъв е този документ —
// например «Договор за присъединяване… на «Електроразпределителни мрежи
// Запад» ЕАД № … дата …» — ако операторът го потвърди, този потвърден факт
// трябва да се запише в акт 15, ОСИП, ОД или където системата иска.“
//
// Три неща пази тази проба, и трите бяха счупени:
//   · документ БЕЗ ред в чеклиста се губеше от описа — сега влиза;
//   · вписваше се името на РЕДА, не наименованието на документа;
//   · несвереният не влиза — потвърждението е единственото условие.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const KOREN = path.join(__dirname, '..');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const DPERM = 'Договор за присъединяване на обекти на клиенти към разпределителната '
            + 'електрическа мрежа на „Електроразпределителни мрежи Запад“ ЕАД';

const fakt = (v, citat) => ({ stoynost: v, citat: citat || v, stranica: 1 });

// Четири документа, по един за всеки случай.
const DOKUMENTI = [
    // 1. НЯМА ред в чеклиста, но е сверен докрай → трябва да влезе, с пълното име
    { id: 'd1', fajl: 'DPERM.pdf', vid: 'договор за присъединяване', cheklist_red: '',
      naimenovanie: fakt(DPERM), nomer: fakt('4100123'), data: fakt('12.05.2026') },
    // 2. ИМА ред и е сверен → влиза с наименованието, а не с името на реда
    { id: 'd2', fajl: 'Protokol_2.pdf', vid: 'протокол обр. 2', cheklist_red: 'Протокол обр. 2',
      naimenovanie: fakt('Протокол за откриване на строителна площадка и определяне на строителна линия и ниво'),
      nomer: fakt('1'), data: fakt('29.03.2026') },
    // 3. Сверен е само наполовина → НЕ влиза
    { id: 'd3', fajl: 'Stanovishte.pdf', vid: 'становище', cheklist_red: 'Становище',
      naimenovanie: fakt('Становище по пожарна безопасност'), nomer: fakt('77'), data: fakt('01.02.2026') },
    // 4. Четецът не е извадил нищо → НЕ влиза (няма какво да се потвърди)
    { id: 'd4', fajl: 'Skica.pdf', vid: 'скица', cheklist_red: '' },
];

const POTV = {
    'd1::naimenovanie': true, 'd1::nomer': true, 'd1::data': true,
    'd2::naimenovanie': true, 'd2::nomer': true, 'd2::data': true,
    'd3::nomer': true,   // без наименование и дата — наполовина
};

function kuhnya() {
    const html = `<!DOCTYPE html><html><body><script>
        let appData = { projects: [], currentProject: null };
        function _zhivObekt() { return appData.currentProject; }
        function saveData() {}
        function addHistory() {}
        function _s2Koy() { return 'Ст. Цонева'; }
        function showAlert() {}
        function _prerisuvai() {}
        async function _danniVzemi() { return null; }
        async function _danniZapishi() {}
    </script><script>${
        fs.readFileSync(path.join(KOREN, 'js', '04-vhodni-dokumenti.js'), 'utf8')
    }</script></body></html>`;
    const vc = new VirtualConsole();
    const greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(html, { runScripts: 'dangerously', virtualConsole: vc });
    return { w: dom.window, greshki };
}

const { w, greshki } = kuhnya();
t('кухнята на документите се зарежда без грешка', greshki.length === 0, greshki);

const p = { id: 'hus', pi: '68134.1006.2440', dokumenti: [] };
const n = w._dokVpishiSverenite({ id: 'hus' }, p, DOKUMENTI, POTV);

// ── кои влязоха ─────────────────────────────────────────────────────────────
const imena = (p.dokumenti || []).map(d => d.ime);
t('вписани са точно двата сверени', n === 2 && imena.length === 2, { n, imena });

t('документ БЕЗ ред в чеклиста вече ВЛИЗА',
  imena.includes(DPERM), imena);
t('и влиза с ПЪЛНОТО си наименование, с дружеството',
  imena.some(x => /Електроразпределителни мрежи Запад/.test(x)), imena);
t('номерът и датата го следват',
  (p.dokumenti.find(d => d.ime === DPERM) || {}).nomer === '№ 4100123 от 12.05.2026',
  p.dokumenti);

const d2 = p.dokumenti.find(d => /откриване на строителна площадка/.test(d.ime));
t('документ С ред влиза с наименованието, НЕ с името на реда', !!d2, imena);
t('но помни кой ред доказва', d2 && d2.red === 'Протокол обр. 2', d2);
t('името на реда НЕ е името в описа',
  !imena.includes('Протокол обр. 2'), imena);

t('сверен наполовина НЕ влиза',
  !imena.some(x => /пожарна безопасност|Становище/.test(x)), imena);
t('документ без извадени факти НЕ влиза',
  !imena.some(x => /скица/i.test(x)), imena);

// ── второ минаване не дублира ───────────────────────────────────────────────
const n2 = w._dokVpishiSverenite({ id: 'hus' }, p, DOKUMENTI, POTV);
t('второ сверяване не вписва нищо наново', n2 === 0, n2);
t('и описът не се удвоява', p.dokumenti.length === 2, p.dokumenti.map(d => d.ime));

// ── старите записи се надграждат, не се дублират ────────────────────────────
// До 27.10.2026 в описа стоеше ИМЕТО НА РЕДА. Такъв запис трябва да се
// преименува на наименованието, а не да се появи втори ред за същото.
const star = { id: 'hus', pi: '1', dokumenti: [{ ime: 'Протокол обр. 2', nomer: '' }] };
w._dokVpishiSverenite({ id: 'hus' }, star, [DOKUMENTI[1]], POTV);
t('стар запис по име на реда се ПРЕИМЕНУВА, не се дублира',
  star.dokumenti.length === 1 && /откриване на строителна площадка/.test(star.dokumenti[0].ime),
  star.dokumenti);
t('и получава номера си',
  star.dokumenti[0].nomer === '№ 1 от 29.03.2026', star.dokumenti[0]);

// ── вписан ли е ред — търси се и по реда ────────────────────────────────────
t('редът се разпознава като вписан през наименованието',
  w._dokVpisanRed(p, 'Протокол обр. 2'), p.dokumenti);
t('невписан ред си остава невписан',
  !w._dokVpisanRed(p, 'Акт обр. 14'));

// ── наименованието е факт, който се чека ────────────────────────────────────
const fakti = w._s2Fakti(DOKUMENTI[0]).map(x => x.k);
t('наименованието е сред фактите за чекване',
  fakti.includes('naimenovanie'), fakti);
t('и е ПЪРВО — то казва кой е документът',
  fakti[0] === 'naimenovanie', fakti);
t('без потвърдено наименование описът пада на късото заглавие',
  w._dokIme(DOKUMENTI[0], {}) === 'договор за присъединяване',
  w._dokIme(DOKUMENTI[0], {}));
t('а с потвърдено — на пълното',
  w._dokIme(DOKUMENTI[0], POTV) === DPERM, w._dokIme(DOKUMENTI[0], POTV));

// ── сървърът иска наименование от четеца ────────────────────────────────────
const sloy2 = fs.readFileSync(path.join(KOREN, '..', '..', '..', '..',
    'cbt-api', 'rules', 'sloy2.py'), 'utf8');
t('схемата на четеца има „naimenovanie“', /"naimenovanie": _fakt/.test(sloy2));
t('и то е задължително',
  /"required": \[[^\]]*"naimenovanie"/.test(sloy2),
  (sloy2.match(/"required": \[[^\]]*\],\n    \}/) || [])[0]);
t('нормализаторът го прибира като факт',
  /for k in \("naimenovanie", "nomer"/.test(sloy2));
t('указанието казва да е ЦЯЛО и дословно',
  /ПЪЛНОТО заглавие, цяло и дословно/.test(sloy2));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — потвърденото влиза`);
process.exit(loshi.length ? 1 : 0);
