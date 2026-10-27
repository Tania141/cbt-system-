// „НЕ СЕ ОТНАСЯ“ СТАВА УРОК.
//
// Операторът, 27.10.2026: „няма жива сила, която да каже — ей такива са
// групите, защото има изключения. Операторът с времето да научи системата за
// различните типове обекти и тогава системата ще натрупа чеклиста.“
//
// Затова пробата пази точно границите на ученето:
//   · урокът важи при СЪЩИТЕ съставки, не при подмножество — иначе едно
//     изключение затваря въпроси, които не е виждало;
//   · урокът казва кой, кога и при колко обекта — иначе не може да се оспори;
//   · урокът се маха с един жест, и само за своя профил;
//   · казаното на обекта и наученото се различават — „върни“ и „забрави“ не са
//     едно и също.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const KOREN = path.join(__dirname, '..');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// Складът живее в паметта — пробата не пипа сървър.
function kuhnya(nachalni) {
    let sklad = JSON.parse(JSON.stringify(nachalni || []));
    const html = `<!DOCTYPE html><html><body><script>
        let _SASTAVKI_PROBA = [];
        function _kesSastavkiNa(p) { return (p.sastavki_proba || []).map(k => ({ kod: k })); }
        function _s2Koy() { return 'Ст. Цонева'; }
        window.__sklad = ${JSON.stringify(sklad)};
        async function _danniVzemi(k) { return k === 'otkazi' ? window.__sklad : null; }
        async function _danniZapishi(k, v) { if (k === 'otkazi') window.__sklad = v; }
    </script><script>${
        fs.readFileSync(path.join(KOREN, 'js', '12c-naucheno.js'), 'utf8')
    }</script></body></html>`;
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(html, { runScripts: 'dangerously', virtualConsole: vc });
    return { w: dom.window, greshki };
}

const obekt = (pi, vid, sastavki) => ({ pi, vid, sastavki_proba: sastavki });

(async () => {

const { w, greshki } = kuhnya();
t('модулът се зарежда без грешка', greshki.length === 0, greshki);

// ── профилът ────────────────────────────────────────────────────────────────
const A = obekt('1.1', 'lineen', ['shtp', 'kabel_srn']);
const B = obekt('2.2', 'lineen', ['kabel_srn', 'shtp']);            // същият, друг ред
const C = obekt('3.3', 'lineen', ['kabel_srn', 'shtp', 'kabel_nn']); // една съставка повече
const D = obekt('4.4', 'sgrada', ['shtp', 'kabel_srn']);             // друг вид

t('профилът подрежда съставките, за да се сравняват',
  JSON.stringify(w.nauchProfil(A, A).sastavki) === JSON.stringify(['kabel_srn', 'shtp']),
  w.nauchProfil(A, A));
t('два обекта с едни съставки имат един профил',
  w._nauchEdinProfil(w.nauchProfil(A, A), w.nauchProfil(B, B)));
t('една съставка повече е ДРУГ профил',
  !w._nauchEdinProfil(w.nauchProfil(A, A), w.nauchProfil(C, C)));
t('друг вид е ДРУГ профил',
  !w._nauchEdinProfil(w.nauchProfil(A, A), w.nauchProfil(D, D)));

// ── запомняне ───────────────────────────────────────────────────────────────
const RED = 'Удостоверение за нанасяне в кадастъра';
const urok = await w.nauchZapomni(A, A, RED);
t('урокът се запомня', !!urok, urok);
t('и казва КОЙ го е дал', urok.koy === 'Ст. Цонева', urok);
t('и КОГА', !!urok.koga && !isNaN(new Date(urok.koga)), urok.koga);
t('и при кой обект', urok.obekti.includes('1.1'), urok.obekti);
t('и при кои съставки',
  JSON.stringify(urok.sastavki) === JSON.stringify(['kabel_srn', 'shtp']), urok.sastavki);
t('броячът е 1 след първия обект', urok.broy === 1, urok.broy);

// ── къде важи и къде НЕ ─────────────────────────────────────────────────────
t('при същия профил редът вече не се пита',
  w.nauchNeotnasya(B, B).includes(RED), w.nauchNeotnasya(B, B));
t('при една съставка повече СЕ пита — профилът е друг',
  !w.nauchNeotnasya(C, C).includes(RED), w.nauchNeotnasya(C, C));
t('при друг вид СЕ пита',
  !w.nauchNeotnasya(D, D).includes(RED), w.nauchNeotnasya(D, D));
t('друг ред не се влачи',
  !w.nauchNeotnasya(B, B).includes('Акт обр. 14'));

// ── вторият обект брои, не дублира ──────────────────────────────────────────
const vtori = await w.nauchZapomni(B, B, RED);
t('втори обект със същия профил НЕ прави втори урок',
  w.nauchVsichki().length === 1, w.nauchVsichki());
t('а вдига брояча', vtori.broy === 2, vtori.broy);
t('и помни двата обекта',
  vtori.obekti.join(',') === '1.1,2.2', vtori.obekti);
t('същият обект втори път не брои двойно',
  (await w.nauchZapomni(B, B, RED)).broy === 2);

// Друг профил, същият ред → СВОЙ урок, не общ.
await w.nauchZapomni(C, C, RED);
t('друг профил прави свой урок', w.nauchVsichki().length === 2, w.nauchVsichki().length);

// ── обяснението ─────────────────────────────────────────────────────────────
const obj = w.nauchObyasnenie(vtori);
t('обяснението казва от кого', /от Ст\. Цонева/.test(obj), obj);
t('и при колко обекта', /при 2 обекта със същите съставки/.test(obj), obj);
t('и кои са съставките', /kabel_srn · shtp/.test(obj), obj);
t('празен урок не гърми', w.nauchObyasnenie(null) === '');

// ── забравяне ───────────────────────────────────────────────────────────────
t('забравя се с един жест', (await w.nauchZabravi(A, A, RED)) === true);
t('и урокът за този профил го няма',
  !w.nauchNeotnasya(B, B).includes(RED), w.nauchNeotnasya(B, B));
t('но урокът на ДРУГИЯ профил остава — грешката беше тук, не навсякъде',
  w.nauchNeotnasya(C, C).includes(RED), w.nauchVsichki());
t('забравяне на нещо ненаучено казва „не“',
  (await w.nauchZabravi(A, A, 'нещо друго')) === false);

// ── празното не гърми ───────────────────────────────────────────────────────
t('без съставки профилът е празен, но валиден',
  w.nauchProfil({ pi: '9' }, { vid: '' }).sastavki.length === 0);
t('празно име не се запомня', (await w.nauchZapomni(A, A, '  ')) === null);

// ── сървърът приема ключа ───────────────────────────────────────────────────
const api = fs.readFileSync(path.join(KOREN, '..', '..', '..', '..',
    'cbt-api', 'api.py'), 'utf8');
t('складът „otkazi“ е разрешен на сървъра',
  /DANNI_KLYUCHOVE = \([^)]*"otkazi"/.test(api),
  (api.match(/DANNI_KLYUCHOVE = \([^)]*\)/) || [])[0]);

// ── условието вече се прави от съставките ───────────────────────────────────
const kand = fs.readFileSync(path.join(KOREN, 'js', '12b-kandidati.js'), 'utf8');
t('условието на научен ред се прави от съставките',
  /map\(k => 'sast_' \+ k\)\.join\(' или '\)/.test(kand));
// В КОДА, не в коментарите: обяснението защо беше грешно остава да се чете.
t('и вече НЕ е грубото „вид = линеен“ като стойност',
  !/['\"`]вид = линеен/.test(kand), (kand.match(/.{30}['\"`]вид = линеен.{20}/) || [])[0]);
t('„ако_е_приложимо“ остава — научено не значи задължително',
  /'ако_е_приложимо',/.test(kand));

// ── и сървърът разбира „или“ ────────────────────────────────────────────────
const ch = fs.readFileSync(path.join(KOREN, '..', '..', '..', '..',
    'cbt-api', 'rules', 'cheklist_dokumenti.py'), 'utf8');
t('условието поддържа „или“', /split\(" или "\)/.test(ch));

// ── признаците носят съставките, иначе условието е мъртво ───────────────────
for (const [fajl, ime] of [['js/08-momenti.js', 'старото ПВА'], ['akt/yadro.js', 'новото ПВА']]) {
    const src = fs.readFileSync(path.join(KOREN, fajl), 'utf8');
    t(`${ime} подава съставките като признаци`, /'sast_' \+ s\.kod/.test(src));
    t(`${ime} подава и вида`, /vid: st\.vid \|\| ''/.test(src));
}

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — системата учи и може да забрави`);
process.exit(loshi.length ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
