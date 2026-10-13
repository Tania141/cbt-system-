// Мъртъв код и счупени бутони — двете посоки на една и съща грешка.
//
// Функция, която никой не вика, е тежест: чете се, поддържа се, подвежда.
// Бутон, който вика несъществуваща функция, е дефект, който личи чак когато
// операторът го натисне. (Стъпка 3 от ПОДРЕЖДАНЕ.md, 13.10.2026)
const fs = require('fs');
const path = require('path');
const { JS, HTML, redNaModulite, kod } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const faylove = redNaModulite();
const tela = Object.fromEntries(faylove.map(f => [f, fs.readFileSync(path.join(JS, f), 'utf8')]));
const html = fs.readFileSync(HTML, 'utf8');
const vsichko = kod() + '\n' + html;

const duma = ime => new RegExp('(?<![\\w$])' + ime.replace(/\$/g, '\\$') + '(?![\\w$])', 'g');

// ── 1. функции, които никой не вика ───────────────────────────────────────
const opredeleni = [];
for (const f of faylove)
    for (const m of tela[f].matchAll(/^(?:async )?function ([A-Za-z_$][\w$]*)/gm))
        opredeleni.push([m[1], f]);

const mrtvi = opredeleni
    .filter(([ime]) => (vsichko.match(duma(ime)) || []).length <= 1)
    .map(([ime, f]) => `${ime} (${f})`);
t(`${opredeleni.length} функции, нито една мъртва`, mrtvi.length === 0, mrtvi);

// ── 2. бутони, които викат несъществуваща функция ─────────────────────────
// onclick="nещоСи(...)" в маркъпа и в низовете, с които се рисува.
const imena = new Set(opredeleni.map(([ime]) => ime));
const vgradeni = new Set(['alert', 'confirm', 'prompt', 'print', 'open', 'close', 'focus',
                          'blur', 'reload', 'submit', 'click', 'returnValue', 'preventDefault',
                          'stopPropagation', 'setTimeout', 'encodeURIComponent', 'decodeURIComponent',
                          'JSON', 'String', 'Number', 'Boolean', 'Array', 'Object', 'Math', 'Date',
                          'this', 'if', 'for', 'while', 'return', 'typeof', 'new', 'function']);

const vikani = new Map();     // име → къде се вика
for (const [kade, tekst] of [['index.html', html], ...faylove.map(f => [f, tela[f]])])
    for (const m of tekst.matchAll(/\bon(?:click|change|input|submit|focus|blur)\s*=\s*["'`]([^"'`]*)["'`]/g))
        // Без извикванията по точка: JSON.stringify, el.remove, …
        for (const v of m[1].matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g))
            if (!vgradeni.has(v[1])) vikani.set(v[1], kade);

const nyama = [...vikani]
    .filter(([ime]) => !imena.has(ime) && !new RegExp('(?:const|let|var)\\s+' + ime + '\\b').test(vsichko))
    .map(([ime, kade]) => `${ime} (вика се от ${kade})`);
t(`${vikani.size} различни обработчика, всички съществуват`, nyama.length === 0, nyama);

// ── 3. елементи, които кодът търси, а ги няма в маркъпа ───────────────────
// Само тези, които се търсят ПРЯКО по id и не се създават с innerHTML.
const vMarkap = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
// Елемент може да се създаде и с `el.id = 'нещо'`, не само в низ с id="…".
const sazdavani = new Set([
    ...[...kod().matchAll(/id="([^"${]+)"/g)].map(m => m[1]),
    ...[...kod().matchAll(/\.id\s*=\s*'([^']+)'/g)].map(m => m[1]),
]);
const tarseni = [...new Set([...kod().matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]))];
const lipsvat = tarseni.filter(id => !vMarkap.has(id) && !sazdavani.has(id));
t(`${tarseni.length} търсени елемента, всички се намират или се създават`,
  lipsvat.length === 0, lipsvat);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — няма мъртво и няма счупени бутони`);
process.exit(loshi.length ? 1 : 0);
