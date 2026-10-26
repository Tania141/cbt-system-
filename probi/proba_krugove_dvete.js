// Кръговете са написани на ДВЕ места — и това е опасно.
//
// `js/13-krugove.js` е кухнята: старият екран я ползва. `akt/yadro.js` я
// повтаря, защото онзи модул вика пет неща от стария екран (`_zhivObekt`,
// `_stroezh`, `_zapishiObekt`, `_prerisuvai`, `_s2esc`), а новото ПВА не ги
// зарежда.
//
// Повторението се търпи само ако се пази. Тази проба пуска двете една срещу
// друга върху едни и същи данни и пада при първото разминаване.
const { kod, grab } = require('./kod');
const fs = require('fs');
const path = require('path');

const s = kod();
const yadro = fs.readFileSync(path.join(__dirname, '..', 'akt', 'yadro.js'), 'utf8');

function vzemi(izvor, imena) {
    return new Function(imena.map(n => grab(izvor, n)).join('\n')
        + '\nreturn {' + imena.join(',') + '};')();
}

const STARO = vzemi(s, ['_krugove', '_brojKrugove', '_indeksKrug', '_krug', '_imeKrug']);
const NOVO  = vzemi(yadro, ['aktKrugove', 'aktIndeksKrug', 'aktKrug', 'aktImeKrug']);

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// ── едни и същи данни, двете сметки ──────────────────────────────────────────

const SLUCHAI = [
    ['без изменения', { stroej: 'Проба' }],
    ['едно изменение', { stroej: 'Проба', krugove_dop: [{ nomer: '7' }] }],
    ['две изменения, на второто', { stroej: 'Проба', tekusht_krug: 2,
        krugove_dop: [{ nomer: '7' }, { nomer: '9' }] }],
    ['изменение без номер', { stroej: 'Проба', tekusht_krug: 1, krugove_dop: [{}] }],
    ['номер извън обхвата', { stroej: 'Проба', tekusht_krug: 9, krugove_dop: [{ nomer: '1' }] }],
    ['отрицателен номер', { stroej: 'Проба', tekusht_krug: -3, krugove_dop: [{ nomer: '1' }] }],
    ['празен строеж', {}],
];

for (const [ime, st] of SLUCHAI) {
    t(`${ime}: еднакъв брой кръгове`,
      STARO._krugove(st).length === NOVO.aktKrugove(st).length,
      [STARO._krugove(st).length, NOVO.aktKrugove(st).length]);

    t(`${ime}: еднакъв текущ индекс`,
      STARO._indeksKrug(st) === NOVO.aktIndeksKrug(st),
      [STARO._indeksKrug(st), NOVO.aktIndeksKrug(st)]);

    t(`${ime}: еднакъв текущ кръг`,
      STARO._krug(st) === NOVO.aktKrug(st));

    for (let i = 0; i < Math.max(1, STARO._krugove(st).length); i++)
        t(`${ime}: еднакво име на кръг ${i}`,
          STARO._imeKrug(st, i) === NOVO.aktImeKrug(st, i),
          [STARO._imeKrug(st, i), NOVO.aktImeKrug(st, i)]);
}

// ── и че кръг 1 наистина Е самият строеж ─────────────────────────────────────
// Записките и блоковете на първия кръг стоят там, където са били винаги —
// нищо не се мести при добавяне на изменение.

const st = { stroej: 'Проба', zapiski: { chasti: [{ fajl: 'a.docx' }] } };
t('кръг 1 е самият строеж', NOVO.aktKrug(st) === st);
st.krugove_dop = [{ nomer: '7' }];
t('след добавено изменение кръг 1 пак е строежът', NOVO.aktKrug(st) === st);
t('и записките му са непокътнати', st.zapiski.chasti.length === 1);
st.tekusht_krug = 1;
t('вторият кръг е друг носител', NOVO.aktKrug(st) !== st);
t('и той си няма записки', !NOVO.aktKrug(st).zapiski);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема — двете копия се разминаха`
                         : `\n${dobri.length} проверки — двете копия съвпадат`);
process.exit(loshi.length ? 1 : 0);
